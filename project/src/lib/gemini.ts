import type { AIResponse, GameCharacter, Player, Party } from '@/types';

const SYSTEM_INSTRUCTION = `You are an expert AI Dungeon Master running an asynchronous Dungeons & Dragons 5th Edition (5e) campaign for a party of players.
Output ALL narrative, item names, quest logs, and reasons strictly in RUSSIAN language. Output \`image_prompt\` in ENGLISH.

CORE RULES & LOOT BALANCE:
1. Enforce D&D 5e rules for skill checks, saving throws, combat AC, and damage.
2. Evaluate all player actions submitted for the current round together as a cohesive turn. Keep \`narrative\` atmospheric, gritty, and between 120–250 words.
3. STRICT LEVEL-SCALED LOOT RARITY:
   - Levels 1–4 (Tier 1): 90% of found loot must be mundane gear, gold, potions, or scrolls. Magical items must be extremely scarce: allow only quirky Common trinkets, and reserve Uncommon (+1 weapons/armor) strictly for major boss/quest completion rewards. Never drop Rare, Very Rare, or Legendary items at Levels 1–4.
   - Any newly discovered magical item MUST be added with \`"is_magical": true\` and \`"is_identified": false\` so players must identify it during a Short Rest first.

You MUST respond strictly with a valid JSON object matching this exact structure:
{
  "narrative": "Художественное описание результатов действий группы в текущем раунде на русском языке.",
  "location_name": "Название текущей локации на русском",
  "image_prompt": "Detailed English visual prompt of the current scene, Baldur's Gate 3 dark fantasy digital painting aesthetic",
  "requested_rolls": [
    {
      "player_id": "string (ID игрока)",
      "character_name": "Имя персонажа",
      "type": "skill_check | saving_throw | attack_roll",
      "ability": "STR | DEX | CON | INT | WIS | CHA | Stealth | Perception | Athletics | Arcana | Persuasion | Lockpicking",
      "dc": 14,
      "reason": "Краткое описание, зачем нужен бросок в следующем раунде"
    }
  ],
  "state_updates": [
    {
      "player_id": "string (ID игрока)",
      "hp_change": 0,
      "xp_gain": 25,
      "gold_change": 0,
      "conditions_add": [],
      "conditions_remove": [],
      "inventory_add": [
        {
          "name": "Название предмета",
          "unidentified_name": "Зазубренный старый кинжал со слабым свечением",
          "type": "weapon | armor | potion | relic | misc",
          "slot": "main_hand | off_hand | armor | head | gloves | boots | amulet | ring | none",
          "rarity": "mundane | common | uncommon | rare",
          "is_magical": false,
          "is_identified": true,
          "requires_attunement": false,
          "ac_bonus": 0,
          "attack_bonus": 0,
          "damage_dice": "1d4",
          "weight": 1.5,
          "value_gp": 10,
          "description": "Визуальное описание предмета",
          "magical_properties": "Скрытые магические свойства",
          "image_prompt": "English prompt for item icon in Baldur's Gate 3 dark fantasy inventory style"
        }
      ],
      "inventory_remove": []
    }
  ],
  "quest_log_update": "Новое событие или задача для дневника квестов"
}`;

function buildRoundPrompt(
  party: Party,
  characters: GameCharacter[],
  players: Player[],
  campaignIntro: string
): string {
  const roundInfo = `Текущий раунд: ${party.round_number + 1}
Локация: ${party.current_location || '—'}
Кампания: ${party.campaign_id}

История (краткая): ${party.current_narrative || campaignIntro}

Персонажи партии:
${characters.map(c => {
    const p = players.find(pl => pl.id === c.player_id);
    return `- ${c.name} (${c.race} ${c.class}, Ур.${c.level}): HP ${c.hp_current}/${c.hp_max}, AC ${c.ac}, Золото ${c.gold}
  Характеристики: СИЛ${c.stats.str} ЛОВ${c.stats.dex} ТЕЛ${c.stats.con} ИНТ${c.stats.int} МДР${c.stats.wis} ХАР${c.stats.cha}
  Состояния: ${c.conditions.length ? c.conditions.join(', ') : 'нет'}`;
  }).join('\n')}

Действия игроков в этом раунде:
${players.map(p => {
    const c = characters.find(ch => ch.player_id === p.id);
    const rollInfo = p.last_roll ? ` [Бросок d20: ${p.last_roll.total} (${p.last_roll.label})]` : '';
    return `- ${p.name} (${c?.name || 'без персонажа'}): ${p.round_action || 'ожидает'}${rollInfo}`;
  }).join('\n')}`;

  return roundInfo;
}

export async function callGemini(
  apiKey: string,
  party: Party,
  characters: GameCharacter[],
  players: Player[],
  campaignIntro: string
): Promise<AIResponse> {
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = buildRoundPrompt(party, characters, players, campaignIntro);

  const body = {
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.8,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API ошибка (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Пустой ответ от ИИ-Мастера');
  }

  const parsed = JSON.parse(text) as AIResponse;
  return parsed;
}

export function buildManualPrompt(
  party: Party,
  characters: GameCharacter[],
  players: Player[],
  campaignIntro: string
): string {
  return `${SYSTEM_INSTRUCTION}\n\n--- ЗАПРОС РАУНДА ---\n${buildRoundPrompt(party, characters, players, campaignIntro)}`;
}
