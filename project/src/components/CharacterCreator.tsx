import { useState } from 'react';
import { ChevronLeft, ChevronRight, Camera, RefreshCw, Check, Info } from 'lucide-react';
import type { Race, CharacterClass, Stats, AbilityScore, GameCharacter, Background, InventoryItem } from '@/types';
import {
  RACES, CLASSES, BACKGROUNDS, ABILITY_SCORES, ABILITY_INFO, SKILLS, CONDITIONS,
  STANDARD_ARRAY, POINT_BUY_TOTAL, POINT_BUY_COST, COMBAT_INFO,
  STARTING_EQUIPMENT, CANTRIPS, SPELLS_LEVEL_1,
  mod, modStr, calcHP, getStartingAC, applyRaceBonuses, rollStat,
} from '@/data/dndRules';
import { pollinationsPortraitUrl } from '@/lib/image';
import { FantasyImage } from './FantasyImage';
import { Tooltip, TooltipCard } from './Tooltip';
import { cn, uid } from '@/lib/utils';

interface CharacterCreatorProps {
  playerId: string;
  partyId: string;
  onComplete: (char: GameCharacter, startingItems: Omit<InventoryItem, 'id' | 'character_id'>[]) => void;
}

type Step = 'race' | 'class' | 'background' | 'stats' | 'equipment';

const STAT_MODES = ['standard', 'pointbuy', 'roll'] as const;
type StatMode = typeof STAT_MODES[number];

export function CharacterCreator({ playerId, partyId, onComplete }: CharacterCreatorProps) {
  const [step, setStep] = useState<Step>('race');
  const [race, setRace] = useState<Race>('Человек');
  const [charClass, setCharClass] = useState<CharacterClass>('Воин');
  const [background, setBackground] = useState<Background>('Солдат');
  const [name, setName] = useState('');
  const [chosenSkills, setChosenSkills] = useState<string[]>([]);
  const [statMode, setStatMode] = useState<StatMode>('standard');
  const [baseStats, setBaseStats] = useState<Stats>({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
  const [standardUsed, setStandardUsed] = useState<boolean[]>([false, false, false, false, false, false]);
  const [selectedStat, setSelectedStat] = useState<AbilityScore | null>(null);
  const [equipmentOption, setEquipmentOption] = useState<string>('');
  const [chosenCantrips, setChosenCantrips] = useState<string[]>([]);
  const [chosenSpells, setChosenSpells] = useState<string[]>([]);
  const [appearance, setAppearance] = useState('');
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [portraitSeed, setPortraitSeed] = useState(Math.floor(Math.random() * 1000000));

  const finalStats = applyRaceBonuses(baseStats, race);
  const cls = CLASSES[charClass];
  const bg = BACKGROUNDS[background];
  const hp = calcHP(charClass, finalStats.con, 1);
  const ac = getStartingAC(finalStats);
  const initiative = mod(finalStats.dex);
  const prof = 2;

  const pointBuyUsed = Object.values(baseStats).reduce((sum, v) => sum + (POINT_BUY_COST[v] || 0), 0);
  const pointBuyRemaining = POINT_BUY_TOTAL - pointBuyUsed;

  // Skills from background + class choices
  const bgSkills = bg.skills;
  const classSkills = cls.skillChoices === ['Все навыки на выбор'] ? SKILLS.map(s => s.name) : cls.skillChoices;
  const availableClassSkills = classSkills.filter(s => !bgSkills.includes(s));
  const maxClassSkills = cls.skillCount;

  function toggleSkill(skill: string) {
    setChosenSkills(prev => {
      if (prev.includes(skill)) return prev.filter(s => s !== skill);
      if (prev.length >= maxClassSkills) return prev;
      return [...prev, skill];
    });
  }

  function handleStandardAssign(idx: number, value: number) {
    const newUsed = [...standardUsed];
    newUsed[idx] = true;
    setStandardUsed(newUsed);
    const keys: AbilityScore[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    setBaseStats(prev => ({ ...prev, [keys[idx]]: value }));
  }

  function handleStandardClear(idx: number) {
    const newUsed = [...standardUsed];
    newUsed[idx] = false;
    setStandardUsed(newUsed);
    const keys: AbilityScore[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    setBaseStats(prev => ({ ...prev, [keys[idx]]: 10 }));
  }

  function handlePointBuy(idx: number, delta: number) {
    const keys: AbilityScore[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const key = keys[idx];
    const current = baseStats[key];
    const newValue = current + delta;
    if (newValue < 8 || newValue > 15) return;
    const newCost = POINT_BUY_COST[newValue] || 0;
    const oldCost = POINT_BUY_COST[current] || 0;
    const newUsed = pointBuyUsed - oldCost + newCost;
    if (newUsed > POINT_BUY_TOTAL) return;
    setBaseStats(prev => ({ ...prev, [key]: newValue }));
  }

  function handleRollAll() {
    setBaseStats({
      str: rollStat(), dex: rollStat(), con: rollStat(),
      int: rollStat(), wis: rollStat(), cha: rollStat(),
    });
  }

  function toggleCantrip(name: string) {
    setChosenCantrips(prev => {
      if (prev.includes(name)) return prev.filter(s => s !== name);
      if (prev.length >= (cls.cantripsKnown || 0)) return prev;
      return [...prev, name];
    });
  }

  function toggleSpell(name: string) {
    setChosenSpells(prev => {
      if (prev.includes(name)) return prev.filter(s => s !== name);
      if (prev.length >= (cls.spellsKnownLevel1 || 0)) return prev;
      return [...prev, name];
    });
  }

  function generatePortrait() {
    const prompt = `${race} ${charClass} character portrait, ${appearance || 'generic adventurer'}, dark fantasy RPG, Baldur's Gate 3 style, high quality digital painting`;
    const newSeed = Math.floor(Math.random() * 1000000);
    setPortraitSeed(newSeed);
    setPortraitUrl(pollinationsPortraitUrl(prompt, newSeed));
  }

  function handleComplete() {
    const equipItems = STARTING_EQUIPMENT[charClass].find(e => e.id === equipmentOption) || STARTING_EQUIPMENT[charClass][0];
    const startingItems: Omit<InventoryItem, 'id' | 'character_id'>[] = equipItems.items.map(item => ({
      id: '',
      character_id: '',
      name: item.name,
      unidentified_name: null,
      type: item.type,
      slot: item.slot,
      rarity: 'mundane' as const,
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
    }));

    const char: GameCharacter = {
      id: uid(),
      player_id: playerId,
      party_id: partyId,
      name: name || 'Безымянный герой',
      race,
      class: charClass,
      background,
      level: 1,
      xp: 0,
      stats: finalStats,
      hp_current: hp,
      hp_max: hp,
      ac,
      gold: 10,
      conditions: [],
      spell_slots: cls.spellcaster ? (cls.spellSlotsLevel1 || {}) : {},
      hit_dice: { total: 1, current: 1 },
      portrait_url: portraitUrl,
      portrait_prompt: `${race} ${charClass} ${appearance}`,
      appearance,
    };
    onComplete(char, startingItems);
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'race', label: 'Раса' },
    { key: 'class', label: 'Класс' },
    { key: 'background', label: 'Предыстория' },
    { key: 'stats', label: 'Характеристики' },
    { key: 'equipment', label: 'Снаряжение' },
  ];
  const currentIdx = steps.findIndex(s => s.key === step);

  const canProceed = () => {
    if (step === 'race') return name.trim().length > 0;
    if (step === 'class') return true;
    if (step === 'background') return chosenSkills.length === maxClassSkills;
    if (step === 'stats') return true;
    if (step === 'equipment') {
      if (cls.spellcaster) {
        return equipmentOption !== '' &&
          chosenCantrips.length >= (cls.cantripsKnown || 0) &&
          chosenSpells.length >= (cls.spellsKnownLevel1 || 0);
      }
      return equipmentOption !== '';
    }
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between border-b border-[#3d3528] pb-3">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <button
              onClick={() => i <= currentIdx && setStep(s.key)}
              className={cn(
                'text-xs font-fantasy tracking-wide no-select transition-colors',
                i === currentIdx ? 'text-[#e8d5a8] font-semibold' :
                i < currentIdx ? 'text-[#8a7350]' : 'text-[#6a6050]/50'
              )}
            >
              <span className={cn(i === currentIdx && 'border-b-2 border-[#c8aa6e] pb-1')}>
                {i + 1}. {s.label}
              </span>
            </button>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-[#3d3528]/50 mx-2" />}
          </div>
        ))}
      </div>

      {/* STEP 1: RACE */}
      {step === 'race' && (
        <div className="space-y-4 fade-in">
          <div>
            <h2 className="font-fantasy text-[#e8d5a8] text-xl font-bold tracking-wide">Выбор Расы</h2>
            <p className="text-[#9a8a6a] text-sm mt-1">Выберите расу вашего героя. Каждая раса даёт уникальные бонусы и способности.</p>
          </div>

          <input
            className="dnd-input w-full text-sm"
            placeholder="Имя персонажа..."
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Object.keys(RACES) as Race[]).map(r => {
              const rd = RACES[r];
              return (
                <button
                  key={r}
                  onClick={() => setRace(r)}
                  className={cn(
                    'dnd-card p-3 text-left transition-all',
                    race === r && 'dnd-card-selected'
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FantasyImage src={pollinationsPortraitUrl(rd.imagePrompt, r.length * 1000)} alt={r} className="w-16 h-16 rounded border border-[#3d3528]" />
                    <div>
                      <div className={cn('font-fantasy text-base font-semibold', race === r ? 'text-[#e8d5a8]' : 'text-[#d4c5a0]')}>{r}</div>
                      <div className="text-[10px] text-[#9a8a6a] font-body">Скорость {rd.speed} фт</div>
                      {rd.darkvision > 0 && <div className="text-[10px] text-[#5b8def] font-body">Тёмное зрение {rd.darkvision} фт</div>}
                    </div>
                  </div>
                  <div className="text-[11px] text-[#8a7350] font-body leading-tight">
                    {Object.entries(rd.bonuses).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(' · ')}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected race details */}
          <div className="dnd-card p-4">
            <div className="flex gap-4">
              <FantasyImage src={pollinationsPortraitUrl(RACES[race].imagePrompt, race.length * 1000)} alt={race} className="w-32 h-32 rounded-lg border border-[#3d3528] flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-fantasy text-[#e8d5a8] text-lg font-bold">{RACES[race].name}</h3>
                <p className="text-xs text-[#9a8a6a] mt-1 leading-relaxed font-body">{RACES[race].lore}</p>
                <div className="space-y-1.5 mt-3">
                  <div className="text-[10px] text-[#8a7350] uppercase tracking-wider font-body mb-1">Расовые черты</div>
                  {RACES[race].traits.map((t, i) => (
                    <div key={i} className="text-xs flex items-start gap-2">
                      <Tooltip content={<TooltipCard title={t.name}>{t.desc}</TooltipCard>}>
                        <span className="text-[#c8aa6e] hover:text-[#e8d5a8] underline decoration-dotted underline-offset-2">{t.name}</span>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => setStep('class')} disabled={!name.trim()} className="dnd-btn-primary px-6 py-3 rounded text-sm w-full disabled:opacity-30 flex items-center justify-center gap-2">
            Далее: Класс <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* STEP 2: CLASS */}
      {step === 'class' && (
        <div className="space-y-4 fade-in">
          <div>
            <h2 className="font-fantasy text-[#e8d5a8] text-xl font-bold tracking-wide">Выбор Класса</h2>
            <p className="text-[#9a8a6a] text-sm mt-1">Класс определяет боевые способности, магию и роль героя в партии.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(Object.keys(CLASSES) as CharacterClass[]).map(c => {
              const cd = CLASSES[c];
              return (
                <button
                  key={c}
                  onClick={() => { setCharClass(c); setEquipmentOption(''); setChosenCantrips([]); setChosenSpells([]); }}
                  className={cn(
                    'dnd-card p-2 text-center transition-all',
                    charClass === c && 'dnd-card-selected'
                  )}
                >
                  <FantasyImage src={pollinationsPortraitUrl(cd.imagePrompt, c.length * 2000)} alt={c} className="w-full h-20 rounded border border-[#3d3528] mb-2" />
                  <div className={cn('font-fantasy text-sm font-semibold', charClass === c ? 'text-[#e8d5a8]' : 'text-[#d4c5a0]')}>{c}</div>
                  <div className="text-[10px] text-[#8a7350] font-body">Кость Хитов: d{cd.hitDie}</div>
                </button>
              );
            })}
          </div>

          {/* Selected class details */}
          <div className="dnd-card p-4">
            <div className="flex gap-4">
              <FantasyImage src={pollinationsPortraitUrl(cls.imagePrompt, charClass.length * 2000)} alt={charClass} className="w-28 h-28 rounded-lg border border-[#3d3528] flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-fantasy text-[#e8d5a8] text-lg font-bold">{cls.name}</h3>
                <p className="text-xs text-[#9a8a6a] mt-1 leading-relaxed font-body">{cls.lore}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="text-center bg-[#0f1117] rounded-lg border border-[#3d3528] p-2">
                <div className="text-[10px] text-[#8a7350] uppercase font-body">Кость Хитов</div>
                <Tooltip content={<TooltipCard title="Кость Хитов">{COMBAT_INFO.hitDice.desc}</TooltipCard>}>
                  <div className="font-fantasy text-[#e8d5a8] text-lg font-bold cursor-help">d{cls.hitDie}</div>
                </Tooltip>
              </div>
              <div className="text-center bg-[#0f1117] rounded-lg border border-[#3d3528] p-2">
                <div className="text-[10px] text-[#8a7350] uppercase font-body">Осн. Характ.</div>
                <div className="font-fantasy text-[#e8d5a8] text-lg font-bold">{ABILITY_SCORES.find(a => a.key === cls.primaryAbility)?.short}</div>
              </div>
              <div className="text-center bg-[#0f1117] rounded-lg border border-[#3d3528] p-2">
                <div className="text-[10px] text-[#8a7350] uppercase font-body">Спасброски</div>
                <div className="font-fantasy text-[#e8d5a8] text-sm font-bold">{cls.savingThrows.map(s => s.toUpperCase()).join(' · ')}</div>
              </div>
              <div className="text-center bg-[#0f1117] rounded-lg border border-[#3d3528] p-2">
                <div className="text-[10px] text-[#8a7350] uppercase font-body">Броня</div>
                <div className="text-[#d4c5a0] text-[11px] font-body font-medium">{cls.armorProf}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[10px] text-[#8a7350] uppercase tracking-wider font-body mb-2">Умения 1-го уровня</div>
              <div className="space-y-2">
                {cls.level1Features.map((f, i) => (
                  <div key={i} className="border-l-2 border-[#c8aa6e]/40 pl-3">
                    <Tooltip content={<TooltipCard title={f.name}>{f.desc}</TooltipCard>}>
                      <span className="font-fantasy text-[#e8d5a8] text-sm font-semibold underline decoration-dotted underline-offset-2 cursor-help">{f.name}</span>
                    </Tooltip>
                    <p className="text-[11px] text-[#9a8a6a] mt-0.5 leading-relaxed font-body">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {cls.spellcaster && (
              <div className="mt-3 p-3 rounded-lg border border-[#5b8def]/30 bg-[#5b8def]/5">
                <div className="text-[#5b8def] text-xs font-fantasy font-semibold mb-1">Заклинатель</div>
                <div className="text-[11px] text-[#9a8a6a] font-body">
                  Заговоров: {cls.cantripsKnown} · Заклинаний 1 круга: {cls.spellsKnownLevel1} · Ячеек 1 круга: {cls.spellSlotsLevel1?.['1'] || 0}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep('race')} className="dnd-btn px-6 py-3 rounded text-sm flex-1 flex items-center justify-center gap-2"><ChevronLeft size={16} /> Назад</button>
            <button onClick={() => setStep('background')} className="dnd-btn-primary px-6 py-3 rounded text-sm flex-1 flex items-center justify-center gap-2">Далее: Предыстория <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* STEP 3: BACKGROUND + SKILLS */}
      {step === 'background' && (
        <div className="space-y-4 fade-in">
          <div>
            <h2 className="font-fantasy text-[#e8d5a8] text-xl font-bold tracking-wide">Предыстория и Навыки</h2>
            <p className="text-[#9a8a6a] text-sm mt-1">Предыстория определяет происхождение героя и даёт профильные навыки.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Object.keys(BACKGROUNDS) as Background[]).map(b => {
              const bd = BACKGROUNDS[b];
              return (
                <button
                  key={b}
                  onClick={() => setBackground(b)}
                  className={cn(
                    'dnd-card p-3 text-left transition-all',
                    background === b && 'dnd-card-selected'
                  )}
                >
                  <div className={cn('font-fantasy text-base font-semibold', background === b ? 'text-[#e8d5a8]' : 'text-[#d4c5a0]')}>{b}</div>
                  <div className="text-[11px] text-[#9a8a6a] mt-1 font-body leading-tight">{bd.description}</div>
                  <div className="text-[10px] text-[#c8aa6e] mt-2 font-body">Навыки: {bd.skills.join(', ')}</div>
                </button>
              );
            })}
          </div>

          {/* Selected background details */}
          <div className="dnd-card p-4">
            <h3 className="font-fantasy text-[#e8d5a8] text-lg font-bold">{bg.name}</h3>
            <p className="text-xs text-[#9a8a6a] mt-1 leading-relaxed font-body">{bg.description}</p>
            <div className="text-[11px] text-[#d4c5a0] mt-2 font-body">
              <span className="text-[#c8aa6e] font-semibold">Особенность:</span> {bg.feature}
            </div>
            <div className="text-[11px] text-[#8a7350] mt-2 font-body">
              <span className="text-[#c8aa6e] font-semibold">Снаряжение:</span> {bg.equipment.join(', ')}
            </div>
          </div>

          {/* Skill selection */}
          <div className="dnd-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-fantasy text-[#e8d5a8] text-base font-bold">Выбор навыков класса</h3>
              <span className="text-[10px] text-[#8a7350] font-body">Выбрано: {chosenSkills.length} / {maxClassSkills}</span>
            </div>
            <div className="text-[11px] text-[#9a8a6a] mb-3 font-body">
              Навыки от предыстории ({bg.skills.join(', ')}) добавлены автоматически. Выберите дополнительно {maxClassSkills} навык(а) из списка класса:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableClassSkills.map(skillName => {
                const skill = SKILLS.find(s => s.name === skillName);
                if (!skill) return null;
                const selected = chosenSkills.includes(skillName);
                return (
                  <button
                    key={skillName}
                    onClick={() => toggleSkill(skillName)}
                    className={cn(
                      'border rounded-lg px-3 py-2 text-left transition-all',
                      selected ? 'border-[#c8aa6e] bg-[#c8aa6e]/10' : 'border-[#3d3528] hover:border-[#6a5a40] bg-[#0f1117]'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Tooltip content={<TooltipCard title={skill.name} ability={`от ${ABILITY_SCORES.find(a => a.key === skill.ability)?.full}`}>
                        {skill.desc}
                      </TooltipCard>}>
                        <span className={cn('text-xs font-body font-medium underline decoration-dotted underline-offset-2 cursor-help', selected ? 'text-[#e8d5a8]' : 'text-[#d4c5a0]')}>
                          {skill.name}
                        </span>
                      </Tooltip>
                      <span className="text-[9px] text-[#8a7350] font-body">{skill.ability.toUpperCase()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep('class')} className="dnd-btn px-6 py-3 rounded text-sm flex-1 flex items-center justify-center gap-2"><ChevronLeft size={16} /> Назад</button>
            <button onClick={() => setStep('stats')} disabled={!canProceed()} className="dnd-btn-primary px-6 py-3 rounded text-sm flex-1 disabled:opacity-30 flex items-center justify-center gap-2">Далее: Характеристики <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* STEP 4: STATS */}
      {step === 'stats' && (
        <div className="space-y-4 fade-in">
          <div>
            <h2 className="font-fantasy text-[#e8d5a8] text-xl font-bold tracking-wide">Калькулятор Характеристик</h2>
            <p className="text-[#9a8a6a] text-sm mt-1">Распределите характеристики героя. Модификатор = (Значение − 10) / 2, округление вниз.</p>
          </div>

          <div className="flex gap-2 justify-center">
            <button onClick={() => { setStatMode('standard'); setStandardUsed([false,false,false,false,false,false]); setBaseStats({str:10,dex:10,con:10,int:10,wis:10,cha:10}); }} className={cn('dnd-btn text-xs px-4 py-2 rounded', statMode === 'standard' && 'dnd-btn-active')}>Стандартный набор</button>
            <button onClick={() => { setStatMode('pointbuy'); setBaseStats({str:8,dex:8,con:8,int:8,wis:8,cha:8}); }} className={cn('dnd-btn text-xs px-4 py-2 rounded', statMode === 'pointbuy' && 'dnd-btn-active')}>Покупка (27 очков)</button>
            <button onClick={() => { setStatMode('roll'); handleRollAll(); }} className={cn('dnd-btn text-xs px-4 py-2 rounded', statMode === 'roll' && 'dnd-btn-active')}>Бросок 4d6</button>
          </div>

          {statMode === 'pointbuy' && (
            <div className="text-center text-xs text-[#c8aa6e] font-body">
              Очков осталось: <span className={cn('font-bold', pointBuyRemaining < 0 ? 'text-[#e34d4d]' : 'text-[#e8d5a8]')}>{pointBuyRemaining}</span> / {POINT_BUY_TOTAL}
            </div>
          )}
          {statMode === 'standard' && (
            <div className="text-center text-xs text-[#9a8a6a] font-body">
              Доступные значения: {STANDARD_ARRAY.filter((_, i) => !standardUsed[i]).join(', ') || '— все использованы —'}
            </div>
          )}
          {statMode === 'roll' && (
            <button onClick={handleRollAll} className="dnd-btn dnd-btn-active text-xs px-4 py-2 rounded w-full">Перебросить 4d6</button>
          )}

          {/* Stat table */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {ABILITY_SCORES.map((ab, idx) => {
              const baseVal = baseStats[ab.key];
              const finalVal = finalStats[ab.key];
              const raceBonus = finalVal - baseVal;
              const info = ABILITY_INFO[ab.key];
              return (
                <div
                  key={ab.key}
                  className={cn(
                    'dnd-card p-3 cursor-pointer transition-all text-center',
                    selectedStat === ab.key && 'dnd-card-selected'
                  )}
                  onClick={() => setSelectedStat(ab.key)}
                >
                  <Tooltip content={<TooltipCard title={info.title}>{info.desc}<div className="mt-2 text-[10px] text-[#8a7350]">Навыки: {info.skills.length ? info.skills.join(', ') : 'нет прямых навыков'}</div></TooltipCard>}>
                    <div className="text-[10px] text-[#8a7350] uppercase tracking-wider font-body cursor-help inline-flex items-center gap-1">
                      {ab.short} <Info size={9} className="opacity-50" />
                    </div>
                  </Tooltip>
                  <div className="font-fantasy text-[#e8d5a8] text-2xl font-bold mt-1">{finalVal}</div>
                  <div className="text-xs text-[#c8aa6e] font-body font-semibold">{modStr(finalVal)}</div>
                  {raceBonus > 0 && <div className="text-[9px] text-[#5eba7d] font-body mt-0.5">+{raceBonus} раса</div>}

                  {statMode === 'pointbuy' && (
                    <div className="flex gap-1 mt-2 justify-center">
                      <button onClick={(e) => { e.stopPropagation(); handlePointBuy(idx, -1); }} className="dnd-btn text-xs w-7 h-7 rounded flex items-center justify-center">−</button>
                      <button onClick={(e) => { e.stopPropagation(); handlePointBuy(idx, 1); }} className="dnd-btn text-xs w-7 h-7 rounded flex items-center justify-center">+</button>
                    </div>
                  )}
                  {statMode === 'standard' && (
                    <div className="mt-2">
                      <select
                        className="dnd-input w-full text-[10px] py-1"
                        value={standardUsed[idx] ? baseVal : ''}
                        onChange={(e) => handleStandardAssign(idx, parseInt(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">— выбрать —</option>
                        {STANDARD_ARRAY.map((v, i) => (
                          <option key={i} value={v} disabled={standardUsed[i] && baseVal !== v}>{v}</option>
                        ))}
                      </select>
                      {standardUsed[idx] && <button onClick={(e) => { e.stopPropagation(); handleStandardClear(idx); }} className="text-[9px] text-[#e34d4d] mt-0.5">сбросить</button>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected stat description */}
          {selectedStat && (
            <div className="dnd-card p-4 fade-in">
              <h3 className="font-fantasy text-[#e8d5a8] text-base font-bold">{ABILITY_INFO[selectedStat].title}</h3>
              <p className="text-xs text-[#9a8a6a] mt-1 leading-relaxed font-body">{ABILITY_INFO[selectedStat].desc}</p>
              <div className="text-[11px] text-[#8a7350] mt-2 font-body">
                <span className="text-[#c8aa6e]">Связанные навыки:</span> {ABILITY_INFO[selectedStat].skills.join(', ') || 'нет'}
              </div>
            </div>
          )}

          {/* Derived combat stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="dnd-card p-3 text-center">
              <Tooltip content={<TooltipCard title="Здоровье (HP)">HP на 1 уровне = Кость Хитов класса + мод. Телосложения. Растёт с каждым уровнем.</TooltipCard>}>
                <div className="text-[10px] text-[#8a7350] uppercase font-body cursor-help inline-flex items-center gap-1">HP <Info size={9} className="opacity-50" /></div>
              </Tooltip>
              <div className="font-fantasy text-[#e8d5a8] text-xl font-bold">{hp}</div>
            </div>
            <div className="dnd-card p-3 text-center">
              <Tooltip content={<TooltipCard title={COMBAT_INFO.ac.title}>{COMBAT_INFO.ac.desc}</TooltipCard>}>
                <div className="text-[10px] text-[#8a7350] uppercase font-body cursor-help inline-flex items-center gap-1">КД <Info size={9} className="opacity-50" /></div>
              </Tooltip>
              <div className="font-fantasy text-[#e8d5a8] text-xl font-bold">{ac}</div>
            </div>
            <div className="dnd-card p-3 text-center">
              <Tooltip content={<TooltipCard title={COMBAT_INFO.initiative.title}>{COMBAT_INFO.initiative.desc}</TooltipCard>}>
                <div className="text-[10px] text-[#8a7350] uppercase font-body cursor-help inline-flex items-center gap-1">Иниц. <Info size={9} className="opacity-50" /></div>
              </Tooltip>
              <div className="font-fantasy text-[#e8d5a8] text-xl font-bold">{initiative >= 0 ? '+' : ''}{initiative}</div>
            </div>
            <div className="dnd-card p-3 text-center">
              <Tooltip content={<TooltipCard title={COMBAT_INFO.profBonus.title}>{COMBAT_INFO.profBonus.desc}</TooltipCard>}>
                <div className="text-[10px] text-[#8a7350] uppercase font-body cursor-help inline-flex items-center gap-1">Бонус М. <Info size={9} className="opacity-50" /></div>
              </Tooltip>
              <div className="font-fantasy text-[#e8d5a8] text-xl font-bold">+{prof}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep('background')} className="dnd-btn px-6 py-3 rounded text-sm flex-1 flex items-center justify-center gap-2"><ChevronLeft size={16} /> Назад</button>
            <button onClick={() => setStep('equipment')} className="dnd-btn-primary px-6 py-3 rounded text-sm flex-1 flex items-center justify-center gap-2">Далее: Снаряжение <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* STEP 5: EQUIPMENT + SPELLS + PORTRAIT */}
      {step === 'equipment' && (
        <div className="space-y-4 fade-in">
          <div>
            <h2 className="font-fantasy text-[#e8d5a8] text-xl font-bold tracking-wide">Снаряжение и Портрет</h2>
            <p className="text-[#9a8a6a] text-sm mt-1">Выберите стартовый набор экипировки. КД пересчитывается автоматически.</p>
          </div>

          {/* Equipment selection */}
          <div className="dnd-card p-4">
            <div className="text-[10px] text-[#8a7350] uppercase tracking-wider font-body mb-3">Стартовый комплект снаряжения</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STARTING_EQUIPMENT[charClass].map(opt => {
                const computedAC = (() => {
                  let a = 10 + mod(finalStats.dex);
                  opt.items.forEach(item => {
                    if (item.slot === 'armor') a = 10 + mod(finalStats.dex) + item.ac_bonus;
                    else a += item.ac_bonus;
                  });
                  return a;
                })();
                return (
                  <button
                    key={opt.id}
                    onClick={() => setEquipmentOption(opt.id)}
                    className={cn(
                      'border rounded-lg p-3 text-left transition-all',
                      equipmentOption === opt.id ? 'border-[#c8aa6e] bg-[#c8aa6e]/10' : 'border-[#3d3528] hover:border-[#6a5a40] bg-[#0f1117]'
                    )}
                  >
                    <div className={cn('font-fantasy text-sm font-semibold', equipmentOption === opt.id ? 'text-[#e8d5a8]' : 'text-[#d4c5a0]')}>{opt.label}</div>
                    <div className="text-[11px] text-[#9a8a6a] mt-1 font-body">
                      {opt.items.map(i => i.name).join(' + ')}
                    </div>
                    <div className="text-[10px] text-[#c8aa6e] mt-1 font-body">Итоговый КД: {computedAC}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spells for spellcasters */}
          {cls.spellcaster && (
            <div className="dnd-card p-4">
              <div className="text-[10px] text-[#8a7350] uppercase tracking-wider font-body mb-1">Заклинания</div>
              <div className="text-[11px] text-[#9a8a6a] mb-3 font-body">
                Выберите {cls.cantripsKnown} заговор(а) и {cls.spellsKnownLevel1} заклинание(й) 1 круга.
              </div>

              {/* Cantrips */}
              <div className="mb-4">
                <div className="text-xs text-[#5b8def] font-fantasy font-semibold mb-2">Заговоры ({chosenCantrips.length}/{cls.cantripsKnown})</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CANTRIPS.slice(0, 6).map(spell => {
                    const selected = chosenCantrips.includes(spell.name);
                    return (
                      <button
                        key={spell.name}
                        onClick={() => toggleCantrip(spell.name)}
                        className={cn(
                          'border rounded-lg px-3 py-2 text-left transition-all',
                          selected ? 'border-[#5b8def] bg-[#5b8def]/10' : 'border-[#3d3528] hover:border-[#6a5a40] bg-[#0f1117]'
                        )}
                      >
                        <Tooltip content={<TooltipCard title={spell.name}>
                          <div className="text-[10px] text-[#8a7350] mb-1">{spell.school} · {spell.castingTime} · {spell.range}</div>
                          {spell.description}
                          {spell.damage && <div className="mt-1 text-[#e34d4d] text-[11px]">Урон: {spell.damage}</div>}
                        </TooltipCard>}>
                          <span className={cn('text-xs font-body font-medium underline decoration-dotted underline-offset-2 cursor-help', selected ? 'text-[#e8d5a8]' : 'text-[#d4c5a0]')}>{spell.name}</span>
                        </Tooltip>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Level 1 Spells */}
              <div>
                <div className="text-xs text-[#5b8def] font-fantasy font-semibold mb-2">Заклинания 1 круга ({chosenSpells.length}/{cls.spellsKnownLevel1})</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SPELLS_LEVEL_1.map(spell => {
                    const selected = chosenSpells.includes(spell.name);
                    return (
                      <button
                        key={spell.name}
                        onClick={() => toggleSpell(spell.name)}
                        className={cn(
                          'border rounded-lg px-3 py-2 text-left transition-all',
                          selected ? 'border-[#5b8def] bg-[#5b8def]/10' : 'border-[#3d3528] hover:border-[#6a5a40] bg-[#0f1117]'
                        )}
                      >
                        <Tooltip content={<TooltipCard title={spell.name}>
                          <div className="text-[10px] text-[#8a7350] mb-1">{spell.school} · {spell.castingTime} · {spell.range} · {spell.duration}</div>
                          {spell.concentration && <div className="text-[#f0ad4e] text-[10px] mb-1">Концентрация</div>}
                          {spell.description}
                          {spell.damage && <div className="mt-1 text-[#e34d4d] text-[11px]">Урон: {spell.damage}</div>}
                        </TooltipCard>}>
                          <span className={cn('text-xs font-body font-medium underline decoration-dotted underline-offset-2 cursor-help', selected ? 'text-[#e8d5a8]' : 'text-[#d4c5a0]')}>{spell.name}</span>
                        </Tooltip>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Portrait generation */}
          <div className="dnd-card p-4">
            <div className="text-[10px] text-[#8a7350] uppercase tracking-wider font-body mb-3">Портрет героя</div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-shrink-0 mx-auto">
                <FantasyImage
                  src={portraitUrl || pollinationsPortraitUrl(`${race} ${charClass} character portrait, ${appearance || 'generic adventurer'}, dark fantasy RPG, Baldur's Gate 3 style`, portraitSeed)}
                  alt="Портрет персонажа"
                  className="w-48 h-48 rounded-lg border-2 border-[#3d3528]"
                />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs text-[#8a7350] uppercase tracking-wider block mb-1 font-body">Особые приметы</label>
                  <textarea
                    className="dnd-input w-full text-sm h-20 resize-none"
                    placeholder="Например: шрам через глаз, плащ следопыта, трубка в зубах..."
                    value={appearance}
                    onChange={e => setAppearance(e.target.value)}
                  />
                </div>
                <button onClick={generatePortrait} className="dnd-btn-primary px-4 py-2 rounded text-sm w-full flex items-center justify-center gap-2">
                  <Camera size={16} /> Сгенерировать портрет
                </button>
                <button onClick={() => { setPortraitSeed(Math.floor(Math.random() * 1000000)); generatePortrait(); }} className="dnd-btn px-4 py-2 rounded text-xs w-full flex items-center justify-center gap-2">
                  <RefreshCw size={14} /> Перезагенерировать
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="dnd-card p-4">
            <div className="flex gap-4">
              <FantasyImage
                src={portraitUrl || pollinationsPortraitUrl(`${race} ${charClass} character portrait, ${appearance || 'generic adventurer'}, dark fantasy RPG`, portraitSeed)}
                alt="Портрет"
                className="w-20 h-20 rounded-lg border border-[#3d3528] flex-shrink-0"
              />
              <div className="flex-1">
                <div className="font-fantasy text-[#e8d5a8] text-lg font-bold">{name || 'Безымянный герой'}</div>
                <div className="text-sm text-[#c8aa6e] font-body">{race} {charClass}</div>
                <div className="text-xs text-[#9a8a6a] mt-1 font-body">Уровень 1 · HP {hp} · КД {ac} · Иниц. {initiative >= 0 ? '+' : ''}{initiative}</div>
                <div className="text-xs text-[#8a7350] mt-1 font-body">Предыстория: {background}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
              {ABILITY_SCORES.map(ab => (
                <div key={ab.key} className="text-center bg-[#0f1117] rounded border border-[#3d3528] p-1.5">
                  <div className="text-[9px] text-[#8a7350] font-body">{ab.short}</div>
                  <div className="font-fantasy text-[#e8d5a8] text-sm font-bold">{finalStats[ab.key]}</div>
                  <div className="text-[10px] text-[#c8aa6e] font-body">{modStr(finalStats[ab.key])}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep('stats')} className="dnd-btn px-6 py-3 rounded text-sm flex-1 flex items-center justify-center gap-2"><ChevronLeft size={16} /> Назад</button>
            <button onClick={handleComplete} disabled={!canProceed()} className="dnd-btn-primary px-6 py-3 rounded text-sm flex-1 disabled:opacity-30 flex items-center justify-center gap-2">
              <Check size={18} /> СОЗДАТЬ ПЕРСОНАЖА
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
