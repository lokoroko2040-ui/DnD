import { useState } from 'react';
import { ChevronLeft, ChevronRight, Camera, RefreshCw, Check } from 'lucide-react';
import type { Race, CharacterClass, Stats, AbilityScore, GameCharacter } from '@/types';
import { RACES, CLASSES, ABILITY_SCORES, ABILITY_DESCRIPTIONS, STANDARD_ARRAY, POINT_BUY_TOTAL, POINT_BUY_COST, mod, modStr, calcHP, getStartingAC, applyRaceBonuses, rollStat } from '@/data/dndRules';
import { pollinationsPortraitUrl } from '@/lib/image';
import { CRTImage } from './CRTImage';
import { cn, uid } from '@/lib/utils';

interface CharacterCreatorProps {
  playerId: string;
  partyId: string;
  onComplete: (char: GameCharacter) => void;
}

type Step = 'race' | 'class' | 'stats' | 'portrait' | 'confirm';

const STAT_MODES = ['standard', 'pointbuy', 'roll'] as const;
type StatMode = typeof STAT_MODES[number];

export function CharacterCreator({ playerId, partyId, onComplete }: CharacterCreatorProps) {
  const [step, setStep] = useState<Step>('race');
  const [race, setRace] = useState<Race>('Человек');
  const [charClass, setCharClass] = useState<CharacterClass>('Воин');
  const [name, setName] = useState('');
  const [statMode, setStatMode] = useState<StatMode>('standard');
  const [baseStats, setBaseStats] = useState<Stats>({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
  const [standardUsed, setStandardUsed] = useState<boolean[]>([false, false, false, false, false, false]);
  const [selectedStat, setSelectedStat] = useState<AbilityScore | null>(null);
  const [appearance, setAppearance] = useState('');
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [portraitSeed, setPortraitSeed] = useState(Math.floor(Math.random() * 1000000));

  const finalStats = applyRaceBonuses(baseStats, race);
  const cls = CLASSES[charClass];
  const hp = calcHP(charClass, finalStats.con, 1);
  const ac = getStartingAC(finalStats);
  const initiative = mod(finalStats.dex);
  const prof = 2;

  const pointBuyUsed = Object.values(baseStats).reduce((sum, v) => sum + (POINT_BUY_COST[v] || 0), 0);
  const pointBuyRemaining = POINT_BUY_TOTAL - pointBuyUsed;

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

  function generatePortrait() {
    const prompt = `${race} ${charClass} character portrait, ${appearance || 'generic adventurer'}, dark fantasy 90s RPG`;
    const newSeed = Math.floor(Math.random() * 1000000);
    setPortraitSeed(newSeed);
    setPortraitUrl(pollinationsPortraitUrl(prompt, newSeed));
  }

  function handleComplete() {
    const char: GameCharacter = {
      id: uid(),
      player_id: playerId,
      party_id: partyId,
      name: name || 'Безымянный герой',
      race,
      class: charClass,
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
    onComplete(char);
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'race', label: 'Раса' },
    { key: 'class', label: 'Класс' },
    { key: 'stats', label: 'Характеристики' },
    { key: 'portrait', label: 'Портрет' },
    { key: 'confirm', label: 'Готово' },
  ];
  const currentIdx = steps.findIndex(s => s.key === step);

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center justify-between border-b border-pip-greendark pb-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <button
              onClick={() => i <= currentIdx && setStep(s.key)}
              className={cn(
                'text-xs uppercase tracking-wider no-select transition-colors',
                i === currentIdx ? 'text-pip-green text-glow' :
                i < currentIdx ? 'text-pip-greendim' : 'text-pip-greendark/50'
              )}
            >
              <span className={cn(i === currentIdx && 'border-b border-pip-green')}>{i + 1}. {s.label}</span>
            </button>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-pip-greendark/30 mx-2" />}
          </div>
        ))}
      </div>

      {/* STEP: RACE */}
      {step === 'race' && (
        <div className="space-y-3 animate-fade-in">
          <div className="text-pip-amber text-glow-amber text-sm uppercase tracking-wider">ШАГ 1: Выбор Расы</div>
          <input
            className="pip-input w-full text-sm"
            placeholder="Имя персонажа..."
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(Object.keys(RACES) as Race[]).map(r => {
              const rd = RACES[r];
              return (
                <button
                  key={r}
                  onClick={() => setRace(r)}
                  className={cn(
                    'border rounded p-2 text-left transition-all',
                    race === r ? 'border-pip-green bg-pip-green/10' : 'border-pip-greendark hover:border-pip-greendim'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CRTImage src={pollinationsPortraitUrl(rd.imagePrompt, r.length * 1000)} alt={r} className="w-12 h-12 rounded border border-pip-greendark" />
                    <div>
                      <div className={cn('text-sm', race === r ? 'text-pip-green text-glow' : 'text-pip-green')}>{r}</div>
                      <div className="text-[10px] text-pip-greendim">{rd.speed} фт</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-pip-greendim leading-tight">
                    {Object.entries(rd.bonuses).map(([k, v]) => `${k.toUpperCase()}+${v}`).join(' ')}
                  </div>
                </button>
              );
            })}
          </div>
          {/* Selected race details */}
          <div className="border border-pip-greendark rounded p-3 bg-pip-bgdark/60">
            <div className="flex gap-3">
              <CRTImage src={pollinationsPortraitUrl(RACES[race].imagePrompt, race.length * 1000)} alt={race} className="w-24 h-24 rounded border border-pip-greendark flex-shrink-0" />
              <div className="flex-1">
                <div className="text-pip-green text-glow text-sm mb-1">{RACES[race].name}</div>
                <div className="text-xs text-pip-greendim mb-2">{RACES[race].description}</div>
                <div className="space-y-1">
                  {RACES[race].traits.map((t, i) => (
                    <div key={i} className="text-[11px] text-pip-green/80 flex items-center gap-1">
                      <span className="pip-led pip-led-on" /> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button onClick={() => setStep('class')} disabled={!name.trim()} className="pip-btn active px-4 py-2 rounded text-sm w-full disabled:opacity-30">
            Далее: Класс →
          </button>
        </div>
      )}

      {/* STEP: CLASS */}
      {step === 'class' && (
        <div className="space-y-3 animate-fade-in">
          <div className="text-pip-amber text-glow-amber text-sm uppercase tracking-wider">ШАГ 2: Выбор Класса</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(Object.keys(CLASSES) as CharacterClass[]).map(c => {
              const cd = CLASSES[c];
              return (
                <button
                  key={c}
                  onClick={() => setCharClass(c)}
                  className={cn(
                    'border rounded p-2 text-center transition-all',
                    charClass === c ? 'border-pip-green bg-pip-green/10' : 'border-pip-greendark hover:border-pip-greendim'
                  )}
                >
                  <CRTImage src={pollinationsPortraitUrl(cd.imagePrompt, c.length * 2000)} alt={c} className="w-full h-16 rounded border border-pip-greendark mb-1" />
                  <div className={cn('text-xs', charClass === c ? 'text-pip-green text-glow' : 'text-pip-green')}>{c}</div>
                  <div className="text-[10px] text-pip-greendim">d{cd.hitDie} HP</div>
                </button>
              );
            })}
          </div>
          {/* Selected class details */}
          <div className="border border-pip-greendark rounded p-3 bg-pip-bgdark/60">
            <div className="flex gap-3">
              <CRTImage src={pollinationsPortraitUrl(cls.imagePrompt, charClass.length * 2000)} alt={charClass} className="w-24 h-24 rounded border border-pip-greendark flex-shrink-0" />
              <div className="flex-1">
                <div className="text-pip-green text-glow text-sm mb-1">{cls.name}</div>
                <div className="text-xs text-pip-greendim mb-2">{cls.description}</div>
                <div className="text-[11px] text-pip-amber/80 mb-1">Кость Хитов: d{cls.hitDie}</div>
                <div className="text-[11px] text-pip-green/80 mb-1">Спасброски: {cls.savingThrows.map(s => s.toUpperCase()).join(', ')}</div>
                <div className="space-y-0.5">
                  {cls.level1Features.map((f, i) => (
                    <div key={i} className="text-[10px] text-pip-green/70 flex items-center gap-1">
                      <span className="pip-led pip-led-on" /> {f}
                    </div>
                  ))}
                </div>
                {cls.spellcaster && <div className="text-[10px] text-pip-cyan mt-1">Заклинатель: {cls.spellSlotsLevel1 && Object.entries(cls.spellSlotsLevel1).map(([k, v]) => `${v} ячейки ${k} ур.`).join(', ')}</div>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep('race')} className="pip-btn px-4 py-2 rounded text-sm flex-1">← Назад</button>
            <button onClick={() => setStep('stats')} className="pip-btn active px-4 py-2 rounded text-sm flex-1">Далее: Характеристики →</button>
          </div>
        </div>
      )}

      {/* STEP: STATS */}
      {step === 'stats' && (
        <div className="space-y-3 animate-fade-in">
          <div className="text-pip-amber text-glow-amber text-sm uppercase tracking-wider">ШАГ 3: Распределение S.P.E.C.I.A.L.</div>

          {/* Stat mode selector */}
          <div className="flex gap-2 justify-center">
            <button onClick={() => { setStatMode('standard'); setStandardUsed([false,false,false,false,false,false]); setBaseStats({str:10,dex:10,con:10,int:10,wis:10,cha:10}); }} className={cn('pip-btn text-xs px-3 py-1 rounded', statMode === 'standard' && 'active')}>Стандартный набор</button>
            <button onClick={() => { setStatMode('pointbuy'); setBaseStats({str:8,dex:8,con:8,int:8,wis:8,cha:8}); }} className={cn('pip-btn text-xs px-3 py-1 rounded', statMode === 'pointbuy' && 'active')}>Покупка за очки</button>
            <button onClick={() => { setStatMode('roll'); handleRollAll(); }} className={cn('pip-btn text-xs px-3 py-1 rounded', statMode === 'roll' && 'active')}>Бросок 4d6</button>
          </div>

          {statMode === 'pointbuy' && (
            <div className="text-center text-xs text-pip-amber">
              Очков осталось: <span className={cn('text-glow-amber', pointBuyRemaining < 0 && 'text-pip-red')}>{pointBuyRemaining}</span> / {POINT_BUY_TOTAL}
            </div>
          )}

          {statMode === 'standard' && (
            <div className="text-center text-xs text-pip-greendim">
              Доступные значения: {STANDARD_ARRAY.filter((_, i) => !standardUsed[i]).join(', ') || '— все использованы —'}
            </div>
          )}

          {statMode === 'roll' && (
            <button onClick={handleRollAll} className="pip-btn text-xs px-3 py-1 rounded w-full active">Перебросить 4d6</button>
          )}

          {/* SPECIAL counters */}
          <div className="grid grid-cols-2 gap-2">
            {ABILITY_SCORES.map((ab, idx) => {
              const baseVal = baseStats[ab.key];
              const finalVal = finalStats[ab.key];
              const raceBonus = finalVal - baseVal;
              return (
                <div
                  key={ab.key}
                  className={cn(
                    'special-counter rounded p-2 cursor-pointer transition-all',
                    selectedStat === ab.key ? 'border-pip-green ring-1 ring-pip-green/30' : 'border-pip-greendark'
                  )}
                  onClick={() => setSelectedStat(ab.key)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-pip-greendim uppercase">{ab.short}</div>
                      <div className="text-[9px] text-pip-greendark">{ab.full}</div>
                    </div>
                    <div className="text-2xl text-pip-green text-glow font-bold">{finalVal}</div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-pip-amber">{modStr(finalVal)}</div>
                    {raceBonus > 0 && <div className="text-[9px] text-pip-cyan">+{raceBonus} раса</div>}
                  </div>
                  {/* Controls */}
                  {statMode === 'pointbuy' && (
                    <div className="flex gap-1 mt-1">
                      <button onClick={(e) => { e.stopPropagation(); handlePointBuy(idx, -1); }} className="pip-btn text-xs px-2 py-0.5 rounded">−</button>
                      <button onClick={(e) => { e.stopPropagation(); handlePointBuy(idx, 1); }} className="pip-btn text-xs px-2 py-0.5 rounded">+</button>
                    </div>
                  )}
                  {statMode === 'standard' && (
                    <div className="mt-1">
                      <select
                        className="pip-input w-full text-[10px] py-0.5"
                        value={standardUsed[idx] ? baseVal : ''}
                        onChange={(e) => handleStandardAssign(idx, parseInt(e.target.value))}
                      >
                        <option value="">— выбрать —</option>
                        {STANDARD_ARRAY.map((v, i) => (
                          <option key={i} value={v} disabled={standardUsed[i] && baseVal !== v}>{v}</option>
                        ))}
                      </select>
                      {standardUsed[idx] && <button onClick={(e) => { e.stopPropagation(); handleStandardClear(idx); }} className="text-[9px] text-pip-red mt-0.5">сбросить</button>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected stat description */}
          {selectedStat && (
            <div className="border border-pip-greendark rounded p-3 bg-pip-bgdark/60 animate-slide-up">
              <div className="text-pip-green text-glow text-sm mb-1">{ABILITY_SCORES.find(a => a.key === selectedStat)?.full}</div>
              <div className="text-xs text-pip-greendim leading-relaxed">{ABILITY_DESCRIPTIONS[selectedStat]}</div>
            </div>
          )}

          {/* Derived stats */}
          <div className="grid grid-cols-4 gap-2 border border-pip-greendark rounded p-3 bg-pip-bgdark/60">
            <div className="text-center">
              <div className="text-[10px] text-pip-greendim">HP</div>
              <div className="text-lg text-pip-green text-glow">{hp}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-pip-greendim">AC</div>
              <div className="text-lg text-pip-green text-glow">{ac}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-pip-greendim">Инициатива</div>
              <div className="text-lg text-pip-green text-glow">{initiative >= 0 ? '+' : ''}{initiative}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-pip-greendim">Бонус Маст.</div>
              <div className="text-lg text-pip-green text-glow">+{prof}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep('class')} className="pip-btn px-4 py-2 rounded text-sm flex-1">← Назад</button>
            <button onClick={() => setStep('portrait')} className="pip-btn active px-4 py-2 rounded text-sm flex-1">Далее: Портрет →</button>
          </div>
        </div>
      )}

      {/* STEP: PORTRAIT */}
      {step === 'portrait' && (
        <div className="space-y-3 animate-fade-in">
          <div className="text-pip-amber text-glow-amber text-sm uppercase tracking-wider">ШАГ 4: Фотоснимок персонажа</div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 mx-auto">
              <CRTImage
                src={portraitUrl || pollinationsPortraitUrl(`${race} ${charClass} character portrait, ${appearance || 'generic adventurer'}, dark fantasy 90s RPG`, portraitSeed)}
                alt="Портрет персонажа"
                className="w-48 h-48 rounded border-2 border-pip-greendark"
              />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs text-pip-greendim uppercase tracking-wider block mb-1">Особые приметы</label>
                <textarea
                  className="pip-input w-full text-sm h-20 resize-none"
                  placeholder="Например: шрам через глаз, плащ следопыта, трубка в зубах..."
                  value={appearance}
                  onChange={e => setAppearance(e.target.value)}
                />
              </div>
              <button
                onClick={generatePortrait}
                className="pip-btn active px-4 py-2 rounded text-sm w-full flex items-center justify-center gap-2"
              >
                <Camera size={16} /> СДЕЛАТЬ ФОТОСНИМОК
              </button>
              <button
                onClick={() => { setPortraitSeed(Math.floor(Math.random() * 1000000)); generatePortrait(); }}
                className="pip-btn px-4 py-2 rounded text-xs w-full flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Перезагенерировать
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep('stats')} className="pip-btn px-4 py-2 rounded text-sm flex-1">← Назад</button>
            <button onClick={() => setStep('confirm')} className="pip-btn active px-4 py-2 rounded text-sm flex-1">Далее: Подтверждение →</button>
          </div>
        </div>
      )}

      {/* STEP: CONFIRM */}
      {step === 'confirm' && (
        <div className="space-y-3 animate-fade-in">
          <div className="text-pip-amber text-glow-amber text-sm uppercase tracking-wider">ШАГ 5: Подтверждение</div>

          <div className="border border-pip-greendark rounded p-4 bg-pip-bgdark/60">
            <div className="flex gap-4">
              <CRTImage
                src={portraitUrl || pollinationsPortraitUrl(`${race} ${charClass} character portrait, ${appearance || 'generic adventurer'}, dark fantasy 90s RPG`, portraitSeed)}
                alt="Портрет"
                className="w-24 h-24 rounded border border-pip-greendark flex-shrink-0"
              />
              <div className="flex-1">
                <div className="text-pip-green text-glow text-lg">{name || 'Безымянный герой'}</div>
                <div className="text-sm text-pip-amber">{race} {charClass}</div>
                <div className="text-xs text-pip-greendim mt-1">Уровень 1 | HP {hp} | AC {ac} | Иниц. {initiative >= 0 ? '+' : ''}{initiative}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              {ABILITY_SCORES.map(ab => (
                <div key={ab.key} className="text-center border border-pip-greendark/50 rounded p-1">
                  <div className="text-[9px] text-pip-greendim">{ab.short}</div>
                  <div className="text-sm text-pip-green text-glow">{finalStats[ab.key]} ({modStr(finalStats[ab.key])})</div>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-1">
              <div className="text-[11px] text-pip-green/80"><span className="pip-led pip-led-on mr-1" /> Кость Хитов: d{cls.hitDie}</div>
              <div className="text-[11px] text-pip-green/80"><span className="pip-led pip-led-on mr-1" /> Спасброски: {cls.savingThrows.map(s => s.toUpperCase()).join(', ')}</div>
              <div className="text-[11px] text-pip-green/80"><span className="pip-led pip-led-on mr-1" /> Стартовое золото: 10 зм</div>
              {cls.spellcaster && <div className="text-[11px] text-pip-cyan"><span className="pip-led pip-led-amber mr-1" /> Заклинатель</div>}
            </div>
          </div>

          <button onClick={handleComplete} className="pip-btn active px-4 py-3 rounded text-sm w-full flex items-center justify-center gap-2 text-glow">
            <Check size={18} /> СОЗДАТЬ ПЕРСОНАЖА
          </button>
          <button onClick={() => setStep('portrait')} className="pip-btn px-4 py-2 rounded text-sm w-full">← Назад</button>
        </div>
      )}
    </div>
  );
}
