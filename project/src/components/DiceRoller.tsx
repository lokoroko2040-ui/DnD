import { useState, useRef } from 'react';
import { Dices, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RollResult, Stats, AbilityScore } from '@/types';
import { rollD20, rollCustom, outcomeLabel, outcomeColor } from '@/lib/dice';
import { mod, modStr, COMBAT_INFO } from '@/data/dndRules';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipCard } from './Tooltip';

interface DiceRollerProps {
  stats: Stats;
  lastRoll: RollResult | null;
  onRoll: (result: RollResult) => void;
  requestedRoll?: {
    ability: string;
    dc: number;
    reason: string;
  } | null;
}

const DICE = [
  { sides: 4, label: 'd4' },
  { sides: 6, label: 'd6' },
  { sides: 8, label: 'd8' },
  { sides: 10, label: 'd10' },
  { sides: 12, label: 'd12' },
  { sides: 20, label: 'd20' },
  { sides: 100, label: 'd100' },
];

function abilityToKey(ability: string): AbilityScore | null {
  const map: Record<string, AbilityScore> = {
    STR: 'str', DEX: 'dex', CON: 'con', INT: 'int', WIS: 'wis', CHA: 'cha',
    Stealth: 'dex', Perception: 'wis', Athletics: 'str', Arcana: 'int',
    Persuasion: 'cha', Lockpicking: 'dex',
  };
  return map[ability] || null;
}

export function DiceRoller({ stats, lastRoll, onRoll, requestedRoll }: DiceRollerProps) {
  const [mode, setMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [rolling, setRolling] = useState(false);
  const [displayNum, setDisplayNum] = useState<number | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function animateRoll(finalResult: RollResult, sides: number = 20) {
    setRolling(true);
    let frames = 0;
    const maxFrames = 15;
    animRef.current = setInterval(() => {
      setDisplayNum(Math.floor(Math.random() * sides) + 1);
      frames++;
      if (frames >= maxFrames) {
        if (animRef.current) clearInterval(animRef.current);
        setDisplayNum(finalResult.result);
        setRolling(false);
        onRoll(finalResult);
      }
    }, 50);
  }

  function handleD20Roll() {
    let modifier = 0;
    let label = 'Произвольная проверка';
    let dc: number | null = null;
    if (requestedRoll) {
      const key = abilityToKey(requestedRoll.ability);
      if (key) modifier = mod(stats[key]);
      label = requestedRoll.ability;
      dc = requestedRoll.dc;
    }
    const result = rollD20(mode, modifier, label, dc);
    animateRoll(result);
  }

  function handleCustomRoll(sides: number) {
    const r = rollCustom(sides);
    animateRoll(r, sides);
  }

  const currentNum = rolling ? displayNum : (lastRoll && lastRoll.die === 20 ? lastRoll.result : displayNum);

  return (
    <div className="dnd-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Dices size={18} className="text-[#c8aa6e]" />
        <span className="font-fantasy text-sm text-[#e8d5a8] font-semibold tracking-wide">Бросок кубиков</span>
      </div>

      <div className="flex flex-col items-center mb-4">
        <div
          className={cn(
            'w-20 h-20 border-2 rounded-xl flex items-center justify-center text-3xl font-fantasy font-bold transition-all no-select',
            rolling ? 'dice-rolling border-[#c8aa6e] text-[#c8aa6e]' : 'border-[#3d3528] text-[#d4c5a0]',
            lastRoll?.outcome === 'critical_success' && !rolling && 'border-[#f0ad4e] text-[#f0ad4e]',
            lastRoll?.outcome === 'critical_failure' && !rolling && 'border-[#e34d4d] text-[#e34d4d]',
          )}
        >
          {currentNum !== null ? currentNum : '—'}
        </div>
        {lastRoll && !rolling && (
          <div className="mt-3 text-center">
            <div className="text-xs text-[#9a8a6a]">
              {lastRoll.label} · d20{lastRoll.advantage !== 'normal' ? ` (${lastRoll.advantage === 'advantage' ? 'преим.' : 'помеха'})` : ''}
              {lastRoll.modifier !== 0 && ` ${modStr(lastRoll.modifier)}`}
            </div>
            <div className="text-sm text-[#d4c5a0] font-semibold mt-0.5">Итог: {lastRoll.total}</div>
            {lastRoll.outcome && (
              <div className={cn('text-sm font-bold mt-1', outcomeColor(lastRoll.outcome))}>
                {outcomeLabel(lastRoll.outcome)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-3 justify-center">
        <Tooltip content={<TooltipCard title={COMBAT_INFO.advantage.title}>{COMBAT_INFO.advantage.desc}</TooltipCard>}>
          <button onClick={() => setMode('normal')} className={cn('dnd-btn text-xs px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer', mode === 'normal' && 'dnd-btn-active')}>
            <Minus size={12} /> Обычный
          </button>
        </Tooltip>
        <Tooltip content={<TooltipCard title="Преимущество">Бросок двух d20 — берётся наибольший результат.</TooltipCard>}>
          <button onClick={() => setMode('advantage')} className={cn('dnd-btn text-xs px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer', mode === 'advantage' && 'dnd-btn-active')}>
            <TrendingUp size={12} /> Преимущ.
          </button>
        </Tooltip>
        <Tooltip content={<TooltipCard title="Помеха">Бросок двух d20 — берётся наименьший результат.</TooltipCard>}>
          <button onClick={() => setMode('disadvantage')} className={cn('dnd-btn text-xs px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer', mode === 'disadvantage' && 'dnd-btn-active')}>
            <TrendingDown size={12} /> Помеха
          </button>
        </Tooltip>
      </div>

      {requestedRoll ? (
        <button
          onClick={handleD20Roll}
          disabled={rolling}
          className="w-full mb-3 dnd-btn dnd-btn-primary text-xs py-2.5 rounded-lg disabled:opacity-50 no-select flex flex-col items-center gap-1"
        >
          <span className="uppercase tracking-wider">Бросить проверку {requestedRoll.ability} (Сл {requestedRoll.dc})</span>
          <span className="text-[10px] opacity-80 normal-case">{requestedRoll.reason}</span>
        </button>
      ) : (
        <button
          onClick={handleD20Roll}
          disabled={rolling}
          className="w-full mb-3 dnd-btn dnd-btn-primary text-xs py-2.5 rounded-lg uppercase tracking-wider disabled:opacity-50 no-select"
        >
          Бросить d20
        </button>
      )}

      <div className="grid grid-cols-4 gap-2">
        {DICE.map(d => (
          <button
            key={d.sides}
            onClick={() => handleCustomRoll(d.sides)}
            disabled={rolling}
            className="dnd-btn text-xs py-2.5 rounded-lg disabled:opacity-50 no-select font-fantasy font-semibold"
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
