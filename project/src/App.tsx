import { useState, useEffect, useCallback, useRef } from 'react';
import type { Party, Player, GameCharacter, InventoryItem, GameLogEntry, TabKey, RollResult, AIResponse, RequestedRoll, InventoryItemDraft } from '@/types';
import { supabase } from '@/lib/supabase';
import { uid, partyCode, clamp } from '@/lib/utils';
import { CAMPAIGNS } from '@/data/campaigns';
import { callGemini, buildManualPrompt } from '@/lib/gemini';
import { calcHP } from '@/data/dndRules';
import { pollinationsUrl } from '@/lib/image';

import { PipBoyFrame } from '@/components/PipBoyFrame';
import { CharacterCreator } from '@/components/CharacterCreator';
import { SceneScreen } from '@/components/SceneScreen';
import { StatusScreen } from '@/components/StatusScreen';
import { InventoryScreen } from '@/components/InventoryScreen';
import { QuestLogScreen } from '@/components/QuestLogScreen';
import { PartyLogScreen } from '@/components/PartyLogScreen';
import { HostPanel } from '@/components/HostPanel';

type AppState = 'boot' | 'lobby' | 'game';

const LOCAL_PLAYER_KEY = 'pipdnd_player_id';
const LOCAL_NAME_KEY = 'pipdnd_player_name';
const LOCAL_APIKEY_KEY = 'pipdnd_gemini_key';

export default function App() {
  const [appState, setAppState] = useState<AppState>('boot');
  const [party, setParty] = useState<Party | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [characters, setCharacters] = useState<GameCharacter[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabKey>('scene');
  const [apiKey, setApiKey] = useState('');
  const [requestedRolls, setRequestedRolls] = useState<RequestedRoll[]>([]);
  const [sceneImageSeed, setSceneImageSeed] = useState(1);
  const [bootProgress, setBootProgress] = useState(0);

  // Lobby state
  const [lobbyMode, setLobbyMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [lobbyError, setLobbyError] = useState('');

  const subscribedRef = useRef(false);

  // ─── Boot sequence ──────────────────────────────────
  useEffect(() => {
    const storedId = localStorage.getItem(LOCAL_PLAYER_KEY);
    const storedName = localStorage.getItem(LOCAL_NAME_KEY);
    const storedKey = localStorage.getItem(LOCAL_APIKEY_KEY);
    if (storedId) setCurrentPlayerId(storedId);
    if (storedName) setPlayerName(storedName);
    if (storedKey) setApiKey(storedKey);

    const timer = setInterval(() => {
      setBootProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(() => setAppState('lobby'), 300);
          return 100;
        }
        return p + 4;
      });
    }, 60);
    return () => clearInterval(timer);
  }, []);

  // ─── Realtime subscriptions ────────────────────────
  const setupSubscriptions = useCallback((partyId: string) => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    supabase.channel(`party-${partyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parties', filter: `id=eq.${partyId}` },
        (payload) => {
          if (payload.new) setParty(payload.new as Party);
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `party_id=eq.${partyId}` },
        () => { loadPlayers(partyId); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `party_id=eq.${partyId}` },
        () => { loadCharacters(partyId); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' },
        () => { loadItems(partyId); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_log', filter: `party_id=eq.${partyId}` },
        (payload) => {
          if (payload.new) setLogs(prev => [...prev, payload.new as GameLogEntry]);
        })
      .subscribe();
  }, []);

  // ─── Data loaders ──────────────────────────────────
  const loadPlayers = async (partyId: string) => {
    const { data } = await supabase.from('players').select('*').eq('party_id', partyId);
    if (data) setPlayers(data as Player[]);
  };

  const loadCharacters = async (partyId: string) => {
    const { data } = await supabase.from('characters').select('*').eq('party_id', partyId);
    if (data) setCharacters(data as GameCharacter[]);
  };

  const loadItems = async (partyId: string) => {
    const { data: chars } = await supabase.from('characters').select('id').eq('party_id', partyId);
    if (!chars || chars.length === 0) { setItems([]); return; }
    const charIds = chars.map(c => c.id);
    const { data } = await supabase.from('inventory_items').select('*').in('character_id', charIds);
    if (data) setItems(data as InventoryItem[]);
  };

  const loadLogs = async (partyId: string) => {
    const { data } = await supabase.from('game_log').select('*').eq('party_id', partyId).order('created_at', { ascending: true });
    if (data) setLogs(data as GameLogEntry[]);
  };

  // ─── Party creation ────────────────────────────────
  async function handleCreateParty() {
    if (!playerName.trim()) { setLobbyError('Введите имя'); return; }
    const pid = currentPlayerId || uid();
    localStorage.setItem(LOCAL_PLAYER_KEY, pid);
    localStorage.setItem(LOCAL_NAME_KEY, playerName);

    let code = partyCode();
    // Ensure unique code
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase.from('parties').select('id').eq('code', code).maybeSingle();
      if (!existing) break;
      code = partyCode();
    }

    const { data: newParty, error } = await supabase.from('parties').insert({
      code,
      name: `${playerName}'s Party`,
      host_player_id: pid,
      campaign_id: 'mine_curse',
    }).select().single();

    if (error || !newParty) { setLobbyError('Ошибка создания партии'); return; }

    const { error: pErr } = await supabase.from('players').insert({
      id: pid,
      party_id: newParty.id,
      name: playerName,
      is_host: true,
    });
    if (pErr) { setLobbyError('Ошибка регистрации игрока'); return; }

    setCurrentPlayerId(pid);
    setParty(newParty as Party);
    setAppState('game');
    setupSubscriptions(newParty.id);
    loadPlayers(newParty.id);
    loadCharacters(newParty.id);
    loadItems(newParty.id);
    loadLogs(newParty.id);
  }

  // ─── Party joining ─────────────────────────────────
  async function handleJoinParty() {
    if (!playerName.trim()) { setLobbyError('Введите имя'); return; }
    if (!joinCode.trim()) { setLobbyError('Введите код партии'); return; }

    const code = joinCode.trim().toUpperCase();
    const { data: existingParty, error } = await supabase.from('parties').select('*').eq('code', code).maybeSingle();
    if (error || !existingParty) { setLobbyError('Партия не найдена'); return; }

    const pid = currentPlayerId || uid();
    localStorage.setItem(LOCAL_PLAYER_KEY, pid);
    localStorage.setItem(LOCAL_NAME_KEY, playerName);

    const { data: existingPlayer } = await supabase.from('players').select('id').eq('id', pid).maybeSingle();
    if (!existingPlayer) {
      const { error: pErr } = await supabase.from('players').insert({
        id: pid,
        party_id: existingParty.id,
        name: playerName,
        is_host: false,
      });
      if (pErr) { setLobbyError('Ошибка подключения'); return; }
    }

    setCurrentPlayerId(pid);
    setParty(existingParty as Party);
    setAppState('game');
    setupSubscriptions(existingParty.id);
    loadPlayers(existingParty.id);
    loadCharacters(existingParty.id);
    loadItems(existingParty.id);
    loadLogs(existingParty.id);
  }

  // ─── Character creation ────────────────────────────
  async function handleCharacterComplete(char: GameCharacter) {
    const { error } = await supabase.from('characters').insert({
      id: char.id,
      player_id: char.player_id,
      party_id: char.party_id,
      name: char.name,
      race: char.race,
      class: char.class,
      level: char.level,
      xp: char.xp,
      stats: char.stats,
      hp_current: char.hp_current,
      hp_max: char.hp_max,
      ac: char.ac,
      gold: char.gold,
      conditions: char.conditions,
      spell_slots: char.spell_slots,
      hit_dice: char.hit_dice,
      portrait_url: char.portrait_url,
      portrait_prompt: char.portrait_prompt,
      appearance: char.appearance,
    });
    if (error) {
      console.error('Character creation error:', error);
      return;
    }
    loadCharacters(char.party_id);
    // Add starting equipment
    await addStartingEquipment(char.id, char.class);
    loadItems(char.party_id);
    setActiveTab('status');
  }

  async function addStartingEquipment(charId: string, cls: string) {
    const starters: Record<string, { name: string; type: string; slot: string; ac_bonus: number; damage_dice: string; weight: number; value_gp: number; description: string }[]> = {
      'Воин': [
        { name: 'Кольчуга', type: 'armor', slot: 'armor', ac_bonus: 5, damage_dice: '', weight: 30, value_gp: 50, description: 'Стандартная кольчуга' },
        { name: 'Длинный меч', type: 'weapon', slot: 'main_hand', ac_bonus: 0, damage_dice: '1d8', weight: 3, value_gp: 15, description: 'Надёжный стальной меч' },
      ],
      'Плут': [
        { name: 'Кожаный доспех', type: 'armor', slot: 'armor', ac_bonus: 1, damage_dice: '', weight: 10, value_gp: 10, description: 'Лёгкая кожаная броня' },
        { name: 'Кинжал', type: 'weapon', slot: 'main_hand', ac_bonus: 0, damage_dice: '1d4', weight: 1, value_gp: 2, description: 'Быстрый кинжал' },
      ],
      'Маг': [
        { name: 'Посох', type: 'weapon', slot: 'main_hand', ac_bonus: 0, damage_dice: '1d6', weight: 4, value_gp: 5, description: 'Деревянный посох с кристаллом' },
      ],
      'Жрец': [
        { name: 'Кольчуга', type: 'armor', slot: 'armor', ac_bonus: 5, damage_dice: '', weight: 30, value_gp: 50, description: 'Кольчуга с символом веры' },
        { name: 'Боевой молот', type: 'weapon', slot: 'main_hand', ac_bonus: 0, damage_dice: '1d8', weight: 5, value_gp: 15, description: 'Тяжёлый боевой молот' },
      ],
      'Паладин': [
        { name: 'Кольчуга', type: 'armor', slot: 'armor', ac_bonus: 5, damage_dice: '', weight: 30, value_gp: 50, description: 'Освящённая кольчуга' },
        { name: 'Длинный меч', type: 'weapon', slot: 'main_hand', ac_bonus: 0, damage_dice: '1d8', weight: 3, value_gp: 15, description: 'Меч правосудия' },
      ],
      'Следопыт': [
        { name: 'Кожаный доспех', type: 'armor', slot: 'armor', ac_bonus: 1, damage_dice: '', weight: 10, value_gp: 10, description: 'Лёгкая броня следопыта' },
        { name: 'Длинный лук', type: 'weapon', slot: 'main_hand', ac_bonus: 0, damage_dice: '1d8', weight: 2, value_gp: 25, description: 'Дальний лук' },
      ],
      'Варвар': [
        { name: 'Кожаный доспех', type: 'armor', slot: 'armor', ac_bonus: 1, damage_dice: '', weight: 10, value_gp: 10, description: 'Грубая кожаная броня' },
        { name: 'Боевой топор', type: 'weapon', slot: 'main_hand', ac_bonus: 0, damage_dice: '1d8', weight: 6, value_gp: 10, description: 'Тяжёлый топор' },
      ],
      'Бард': [
        { name: 'Кожаный доспех', type: 'armor', slot: 'armor', ac_bonus: 1, damage_dice: '', weight: 10, value_gp: 10, description: 'Изящная кожаная броня' },
        { name: 'Рапира', type: 'weapon', slot: 'main_hand', ac_bonus: 0, damage_dice: '1d8', weight: 2, value_gp: 25, description: 'Лёгкая рапира барда' },
      ],
    };

    const items = starters[cls] || [];
    for (const item of items) {
      await supabase.from('inventory_items').insert({
        id: uid(),
        character_id: charId,
        name: item.name,
        unidentified_name: null,
        type: item.type,
        slot: item.slot,
        rarity: 'mundane',
        is_magical: false,
        is_identified: true,
        requires_attunement: false,
        is_attuned: false,
        is_equipped: true,
        ac_bonus: item.ac_bonus,
        attack_bonus: 0,
        damage_dice: item.damage_dice || null,
        weight: item.weight,
        value_gp: item.value_gp,
        description: item.description,
        magical_properties: null,
        image_prompt: `${item.name} dark fantasy RPG item icon`,
      });
    }
  }

  // ─── Player actions ────────────────────────────────
  async function handleRoll(result: RollResult) {
    await supabase.from('players').update({ last_roll: result }).eq('id', currentPlayerId);
    setPlayers(prev => prev.map(p => p.id === currentPlayerId ? { ...p, last_roll: result } : p));
  }

  async function handleActionChange(action: string) {
    await supabase.from('players').update({ round_action: action }).eq('id', currentPlayerId);
    setPlayers(prev => prev.map(p => p.id === currentPlayerId ? { ...p, round_action: action } : p));
  }

  async function handleToggleReady() {
    const player = players.find(p => p.id === currentPlayerId);
    if (!player) return;
    const newReady = !player.ready;
    await supabase.from('players').update({ ready: newReady }).eq('id', currentPlayerId);
    setPlayers(prev => prev.map(p => p.id === currentPlayerId ? { ...p, ready: newReady } : p));
  }

  // ─── Host: Campaign change ─────────────────────────
  async function handleCampaignChange(campaignId: string, intro?: string) {
    if (!party) return;
    const campaign = CAMPAIGNS[campaignId];
    await supabase.from('parties').update({
      campaign_id: campaignId,
      campaign_intro: intro !== undefined ? intro : campaign.intro,
      current_narrative: campaign.intro || '',
      current_location: campaignId === 'sandbox' ? 'Неизвестно' : 'Стартовая локация',
      current_image_prompt: campaign.imagePrompt,
    }).eq('id', party.id);
    setSceneImageSeed(Math.floor(Math.random() * 1000000));
  }

  async function handleCampaignIntroChange(intro: string) {
    if (!party) return;
    await supabase.from('parties').update({ campaign_intro: intro }).eq('id', party.id);
  }

  // ─── Host: Run AI round ────────────────────────────
  async function handleRunRound() {
    if (!party || !apiKey) return;

    await supabase.from('parties').update({ round_resolving: true }).eq('id', party.id);

    try {
      const intro = party.campaign_intro || CAMPAIGNS[party.campaign_id]?.intro || '';
      const response = await callGemini(apiKey, party, characters, players, intro);
      await applyAIResponse(response);
    } catch (err) {
      console.error('AI round error:', err);
      await supabase.from('parties').update({ round_resolving: false }).eq('id', party.id);
      alert(`Ошибка ИИ-Мастера: ${err instanceof Error ? err.message : 'неизвестная ошибка'}. Используйте ручной мост.`);
    }
  }

  async function handleManualPaste(jsonStr: string) {
    if (!party) return;
    await supabase.from('parties').update({ round_resolving: true }).eq('id', party.id);
    try {
      const response = JSON.parse(jsonStr) as AIResponse;
      await applyAIResponse(response);
    } catch (err) {
      console.error('Manual paste error:', err);
      await supabase.from('parties').update({ round_resolving: false }).eq('id', party.id);
      alert('Ошибка: неверный JSON формат');
    }
  }

  async function applyAIResponse(response: AIResponse) {
    if (!party) return;

    const newRound = party.round_number + 1;

    // Update party
    const newQuestLog = response.quest_log_update
      ? (party.quest_log ? party.quest_log + '\n' + response.quest_log_update : response.quest_log_update)
      : party.quest_log;

    await supabase.from('parties').update({
      round_number: newRound,
      current_narrative: response.narrative,
      current_location: response.location_name,
      current_image_prompt: response.image_prompt,
      quest_log: newQuestLog,
      round_resolving: false,
    }).eq('id', party.id);

    // Log narrative
    await supabase.from('game_log').insert({
      party_id: party.id,
      round_number: newRound,
      type: 'narrative',
      content: response.narrative,
    });

    // Apply state updates
    for (const update of response.state_updates || []) {
      const char = characters.find(c => c.player_id === update.player_id);
      if (!char) continue;

      const newHP = clamp(char.hp_current + update.hp_change, 0, char.hp_max);
      const newXP = char.xp + (update.xp_gain || 0);
      const newGold = char.gold + (update.gold_change || 0);
      let newConditions = [...char.conditions];
      if (update.conditions_add) {
        newConditions = [...newConditions, ...update.conditions_add];
      }
      if (update.conditions_remove) {
        newConditions = newConditions.filter(c => !update.conditions_remove!.includes(c));
      }

      await supabase.from('characters').update({
        hp_current: newHP,
        xp: newXP,
        gold: newGold,
        conditions: newConditions,
      }).eq('id', char.id);

      // Add inventory items
      for (const draft of update.inventory_add || []) {
        await supabase.from('inventory_items').insert({
          id: uid(),
          character_id: char.id,
          name: draft.name,
          unidentified_name: draft.unidentified_name || draft.name,
          type: draft.type || 'misc',
          slot: draft.slot || 'none',
          rarity: draft.rarity || 'mundane',
          is_magical: draft.is_magical ?? false,
          is_identified: draft.is_identified ?? true,
          requires_attunement: draft.requires_attunement ?? false,
          is_attuned: false,
          is_equipped: false,
          ac_bonus: draft.ac_bonus || 0,
          attack_bonus: draft.attack_bonus || 0,
          damage_dice: draft.damage_dice || null,
          weight: draft.weight || 0,
          value_gp: draft.value_gp || 0,
          description: draft.description || null,
          magical_properties: draft.magical_properties || null,
          image_prompt: draft.image_prompt || null,
        });
      }

      // Remove inventory items
      for (const itemName of update.inventory_remove || []) {
        const item = items.find(i => i.character_id === char.id && i.name === itemName);
        if (item) {
          await supabase.from('inventory_items').delete().eq('id', item.id);
        }
      }
    }

    // Set requested rolls
    setRequestedRolls(response.requested_rolls || []);

    // Reset player ready flags and actions
    for (const p of players) {
      await supabase.from('players').update({ ready: false, round_action: '', last_roll: null }).eq('id', p.id);
    }

    setSceneImageSeed(Math.floor(Math.random() * 1000000));

    // Reload data
    loadPlayers(party.id);
    loadCharacters(party.id);
    loadItems(party.id);
    loadLogs(party.id);
    setActiveTab('scene');
  }

  // ─── Inventory actions ─────────────────────────────
  async function handleEquip(itemId: string) {
    const item = items.find(i => i.id === itemId);
    if (!item || item.slot === 'none') return;
    // Unequip existing item in that slot
    const char = characters.find(c => c.id === item.character_id);
    if (!char) return;
    const existing = items.find(i => i.character_id === char.id && i.slot === item.slot && i.is_equipped && i.id !== itemId);
    if (existing) {
      await supabase.from('inventory_items').update({ is_equipped: false }).eq('id', existing.id);
    }
    await supabase.from('inventory_items').update({ is_equipped: true }).eq('id', itemId);
    recalcAC(char.id);
    loadItems(party!.id);
  }

  async function handleUnequip(itemId: string) {
    await supabase.from('inventory_items').update({ is_equipped: false }).eq('id', itemId);
    const item = items.find(i => i.id === itemId);
    if (item) {
      const char = characters.find(c => c.id === item.character_id);
      if (char) recalcAC(char.id);
    }
    loadItems(party!.id);
  }

  async function recalcAC(charId: string) {
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    const charItems = items.filter(i => i.character_id === charId && i.is_equipped && i.is_identified);
    let ac = 10 + Math.floor((char.stats.dex - 10) / 2);
    const armor = charItems.find(i => i.slot === 'armor');
    if (armor) ac = 10 + Math.floor((char.stats.dex - 10) / 2) + (armor.ac_bonus || 0);
    charItems.forEach(i => {
      if (i.slot !== 'armor') ac += i.ac_bonus || 0;
    });
    await supabase.from('characters').update({ ac }).eq('id', charId);
    loadCharacters(party!.id);
  }

  async function handleAttune(itemId: string) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const charItems = items.filter(i => i.character_id === item.character_id && i.is_attuned);
    if (!item.is_attuned && charItems.length >= 3) return;
    await supabase.from('inventory_items').update({ is_attuned: !item.is_attuned }).eq('id', itemId);
    loadItems(party!.id);
  }

  async function handleIdentify(itemId: string) {
    await supabase.from('inventory_items').update({ is_identified: true }).eq('id', itemId);
    loadItems(party!.id);
    loadCharacters(party!.id);
  }

  async function handleDeleteItem(itemId: string) {
    await supabase.from('inventory_items').delete().eq('id', itemId);
    loadItems(party!.id);
  }

  // ─── Rest actions ──────────────────────────────────
  async function handleShortRest() {
    const char = characters.find(c => c.player_id === currentPlayerId);
    if (!char) return;
    // Use hit dice to heal (simplified: heal half hit dice)
    if (char.hit_dice.current > 0) {
      const heal = Math.ceil((char.hit_dice.current * 6) / 2);
      const newHP = clamp(char.hp_current + heal, 0, char.hp_max);
      await supabase.from('characters').update({
        hp_current: newHP,
        hit_dice: { total: char.hit_dice.total, current: char.hit_dice.current - 1 },
      }).eq('id', char.id);
    }
    loadCharacters(party!.id);
  }

  async function handleLongRest() {
    const char = characters.find(c => c.player_id === currentPlayerId);
    if (!char) return;
    await supabase.from('characters').update({
      hp_current: char.hp_max,
      hit_dice: { total: char.hit_dice.total, current: char.hit_dice.total },
      conditions: [],
      spell_slots: char.spell_slots, // refill
    }).eq('id', char.id);
    loadCharacters(party!.id);
  }

  // ─── API key storage ───────────────────────────────
  function handleApiKeyChange(key: string) {
    setApiKey(key);
    localStorage.setItem(LOCAL_APIKEY_KEY, key);
  }

  // ─── Derived state ─────────────────────────────────
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const currentCharacter = characters.find(c => c.player_id === currentPlayerId);
  const isHost = currentPlayer?.is_host ?? false;
  const myItems = items.filter(i => i.character_id === currentCharacter?.id);

  // ─── Boot screen ───────────────────────────────────
  if (appState === 'boot') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="text-pip-green text-glow text-2xl mb-4 font-mono tracking-widest">
            PIP-D&D 2000
          </div>
          <div className="text-pip-amber text-glow-amber text-sm mb-6 font-mono">
            AI DUNGEON MASTER SYSTEM
          </div>
          <div className="w-64 h-1 bg-pip-bgdark border border-pip-greendark mx-auto rounded overflow-hidden">
            <div className="boot-bar" style={{ width: `${bootProgress}%` }} />
          </div>
          <div className="text-pip-greendim text-xs mt-2 font-mono">
            {bootProgress < 30 ? 'ЗАГРУЗКА СИСТЕМЫ...' :
             bootProgress < 60 ? 'КАЛИБРОВКА ЭКРАНА...' :
             bootProgress < 90 ? 'ПОДКЛЮЧЕНИЕ К СЕТИ...' :
             'СИСТЕМА ГОТОВА'}
          </div>
        </div>
      </div>
    );
  }

  // ─── Lobby ─────────────────────────────────────────
  if (appState === 'lobby') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="pip-frame rounded-2xl p-6 max-w-md w-full relative">
          <div className="absolute top-2 left-2 pip-rivet" />
          <div className="absolute top-2 right-2 pip-rivet" />
          <div className="absolute bottom-2 left-2 pip-rivet" />
          <div className="absolute bottom-2 right-2 pip-rivet" />

          <div className="pip-screen crt-scanlines crt-flicker p-6">
            <div className="text-center mb-6">
              <div className="text-pip-green text-glow text-2xl font-mono tracking-widest">PIP-D&D 2000</div>
              <div className="text-pip-amber text-glow-amber text-sm font-mono">AI DUNGEON MASTER</div>
              <div className="text-pip-greendim text-xs font-mono mt-2">ROBCO INDUSTRIES (c) 2000</div>
            </div>

            {lobbyError && (
              <div className="text-pip-red text-glow-red text-xs text-center mb-4 border border-pip-red/30 rounded py-2">
                {lobbyError}
              </div>
            )}

            {lobbyMode === 'menu' && (
              <div className="space-y-3">
                <div className="mb-4">
                  <label className="text-xs text-pip-greendim uppercase tracking-wider block mb-1">Имя игрока</label>
                  <input
                    className="pip-input w-full text-sm"
                    placeholder="Введите ваше имя..."
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                  />
                </div>
                <button onClick={() => setLobbyMode('create')} className="pip-btn active w-full py-3 rounded text-sm">
                  СОЗДАТЬ ПАРТИЮ (ХОСТ)
                </button>
                <button onClick={() => setLobbyMode('join')} className="pip-btn w-full py-3 rounded text-sm">
                  ПРИСОЕДИНИТЬСЯ К ПАРТИИ
                </button>
              </div>
            )}

            {lobbyMode === 'create' && (
              <div className="space-y-3">
                <div className="text-xs text-pip-greendim mb-2">
                  Вы станете Хостом партии. Вам понадобится бесплатный ключ Google Gemini API. Игроки присоединятся по коду.
                </div>
                <button onClick={handleCreateParty} className="pip-btn active w-full py-3 rounded text-sm">
                  СОЗДАТЬ ПАРТИЮ
                </button>
                <button onClick={() => setLobbyMode('menu')} className="pip-btn w-full py-2 rounded text-xs">← Назад</button>
              </div>
            )}

            {lobbyMode === 'join' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-pip-greendim uppercase tracking-wider block mb-1">Код партии</label>
                  <input
                    className="pip-input w-full text-center text-2xl tracking-widest uppercase"
                    placeholder="ABCD"
                    maxLength={4}
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  />
                </div>
                <button onClick={handleJoinParty} className="pip-btn active w-full py-3 rounded text-sm">
                  ПРИСОЕДИНИТЬСЯ
                </button>
                <button onClick={() => setLobbyMode('menu')} className="pip-btn w-full py-2 rounded text-xs">← Назад</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Game screen ───────────────────────────────────
  if (!party || !currentPlayer) {
    return <div className="min-h-screen flex items-center justify-center text-pip-red">Ошибка: данные партии не загружены</div>;
  }

  // No character yet → show creator
  if (!currentCharacter) {
    return (
      <PipBoyFrame activeTab={activeTab} onTabChange={setActiveTab} isHost={isHost}>
        <div className="mb-3 border-b border-pip-greendark pb-2">
          <div className="text-pip-amber text-glow-amber text-sm uppercase tracking-wider">Создание персонажа</div>
          <div className="text-xs text-pip-greendim mt-1">Партия: {party.code} · Игрок: {currentPlayer.name}</div>
        </div>
        <CharacterCreator
          playerId={currentPlayerId}
          partyId={party.id}
          onComplete={handleCharacterComplete}
        />
      </PipBoyFrame>
    );
  }

  return (
    <PipBoyFrame activeTab={activeTab} onTabChange={setActiveTab} isHost={isHost}>
      {/* Top status bar */}
      <div className="flex items-center justify-between border-b border-pip-greendark pb-2 mb-3 text-xs">
        <span className="text-pip-green text-glow">{currentCharacter.name}</span>
        <span className="text-pip-greendim">{currentCharacter.race} {currentCharacter.class} Ур.{currentCharacter.level}</span>
        <span className="text-pip-green">HP {currentCharacter.hp_current}/{currentCharacter.hp_max}</span>
        <span className="text-pip-amber">{party.code}</span>
      </div>

      {activeTab === 'scene' && (
        <SceneScreen
          party={party}
          character={currentCharacter}
          player={currentPlayer}
          allPlayers={players}
          allCharacters={characters}
          requestedRolls={requestedRolls}
          onRoll={handleRoll}
          onActionChange={handleActionChange}
          onToggleReady={handleToggleReady}
          sceneImageSeed={sceneImageSeed}
        />
      )}

      {activeTab === 'status' && (
        <StatusScreen
          character={currentCharacter}
          onShortRest={handleShortRest}
          onLongRest={handleLongRest}
        />
      )}

      {activeTab === 'inventory' && (
        <InventoryScreen
          character={currentCharacter}
          items={myItems}
          onEquip={handleEquip}
          onUnequip={handleUnequip}
          onAttune={handleAttune}
          onIdentify={handleIdentify}
          onDelete={handleDeleteItem}
        />
      )}

      {activeTab === 'quests' && (
        <QuestLogScreen party={party} logs={logs} />
      )}

      {activeTab === 'party' && (
        <PartyLogScreen
          players={players}
          characters={characters}
          currentPlayerId={currentPlayerId}
        />
      )}

      {activeTab === 'host' && isHost && (
        <HostPanel
          party={party}
          players={players}
          characters={characters}
          apiKey={apiKey}
          onApiKeyChange={handleApiKeyChange}
          onCampaignChange={handleCampaignChange}
          onRunRound={handleRunRound}
          onManualPaste={handleManualPaste}
          roundResolving={party.round_resolving}
          onCampaignIntroChange={handleCampaignIntroChange}
        />
      )}
    </PipBoyFrame>
  );
}
