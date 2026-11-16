import { useState, useRef } from 'react';
import { Dices } from 'lucide-react';
import type { RollResult } from '@/types';
import { rollDie, rollD20, rollCustom, outcomeLabel, outcomeColor } from '@/lib/dice';
import { mod, modStr } from '@/data/dndRules';
import type { Stats, AbilityScore } from '@/types';
import { cn } from '@/lib/utils';

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

  function animateRoll(finalResult: RollResult) {
    setRolling(true);
    let frames = 0;
    const maxFrames = 15;
    animRef.current = setInterval(() => {
      setDisplayNum(Math.floor(Math.random() * 20) + 1);
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
      if (key) {
        modifier = mod(stats[key]);
      }
      label = requestedRoll.ability;
      dc = requestedRoll.dc;
    }

    const result = rollD20(mode, modifier, label, dc);
    animateRoll(result);
  }

  function handleCustomRoll(sides: number) {
    const r = rollCustom(sides);
    setRolling(true);
    let frames = 0;
    const maxFrames = 12;
    animRef.current = setInterval(() => {
      setDisplayNum(Math.floor(Math.random() * sides) + 1);
      frames++;
      if (frames >= maxFrames) {
        if (animRef.current) clearInterval(animRef.current);
        setDisplayNum(r.result);
        setRolling(false);
        onRoll(r);
      }
    }, 50);
  }

  const showD20 = requestedRoll !== undefined;
  const currentNum = rolling ? displayNum : (lastRoll && lastRoll.die === 20 ? lastRoll.result : displayNum);

  return (
    <div className="border border-pip-greendark bg-pip-bgdark/60 rounded p-3">
      <div className="flex items-center gap-2 mb-3">
        <Dices size={16} className="text-pip-green" />
        <span className="text-pip-green text-glow text-sm uppercase tracking-wider">Бросок кубиков</span>
      </div>

      {/* d20 display */}
      <div className="flex flex-col items-center mb-4">
        <div
          className={cn(
            'w-20 h-20 border-2 rounded-lg flex items-center justify-center text-3xl font-bold no-select transition-all',
            rolling ? 'animate-dice-roll border-pip-amber text-pip-amber text-glow-amber' : 'border-pip-greendark text-pip-green text-glow',
            lastRoll?.outcome === 'critical_success' && !rolling && 'border-pip-amber text-pip-amber text-glow-amber',
            lastRoll?.outcome === 'critical_failure' && !rolling && 'border-pip-red text-pip-red text-glow-red',
          )}
        >
          {currentNum !== null ? currentNum : '—'}
        </div>
        {lastRoll && !rolling && (
          <div className="mt-2 text-center">
            <div className="text-xs text-pip-greendim">
              {lastRoll.label} | d20{lastRoll.advantage !== 'normal' ? ` (${lastRoll.advantage === 'advantage' ? 'преим.' : 'помеха'})` : ''}
              {lastRoll.modifier !== 0 && ` ${modStr(lastRoll.modifier)}`}
            </div>
            <div className="text-sm text-pip-green text-glow">
              Итог: {lastRoll.total}
            </div>
            {lastRoll.outcome && (
              <div className={cn('text-sm font-bold mt-1', outcomeColor(lastRoll.outcome))}>
                {outcomeLabel(lastRoll.outcome)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advantage / Disadvantage toggle */}
      <div className="flex gap-2 mb-3 justify-center">
        <button
          onClick={() => setMode('normal')}
          className={cn('pip-btn text-xs px-3 py-1 rounded', mode === 'normal' && 'active')}
        >
          Обычный
        </button>
        <button
          onClick={() => setMode('advantage')}
          className={cn('pip-btn text-xs px-3 py-1 rounded', mode === 'advantage' && 'active')}
        >
          С Преимуществом
        </button>
        <button
          onClick={() => setMode('disadvantage')}
          className={cn('pip-btn text-xs px-3 py-1 rounded', mode === 'disadvantage' && 'active')}
        >
          С Помехой
        </button>
      </div>

      {/* Requested roll button */}
      {requestedRoll && (
        <button
          onClick={handleD20Roll}
          disabled={rolling}
          className="w-full mb-3 border border-pip-amber bg-pip-amber/10 text-pip-amber text-glow-amber text-xs uppercase tracking-wider py-2 rounded hover:bg-pip-amber/20 transition-all disabled:opacity-50 no-select"
        >
          БРОСИТЬ ПРОВЕРКУ {requestedRoll.ability} (Сл {requestedRoll.dc})
          <div className="text-[10px] text-pip-amber/70 normal-case mt-1">{requestedRoll.reason}</div>
        </button>
      )}

      {/* Free d20 roll */}
      {showD20 && !requestedRoll && (
        <button
          onClick={handleD20Roll}
          disabled={rolling}
          className="w-full mb-3 border border-pip-green bg-pip-green/10 text-pip-green text-glow text-xs uppercase tracking-wider py-2 rounded hover:bg-pip-green/20 transition-all disabled:opacity-50 no-select"
        >
          БРОСИТЬ d20
        </button>
      )}

      {/* Dice grid */}
      <div className="grid grid-cols-4 gap-2">
        {DICE.map(d => (
          <button
            key={d.sides}
            onClick={() => handleCustomRoll(d.sides)}
            disabled={rolling}
            className="pip-btn text-xs py-2 rounded disabled:opacity-50 no-select"
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
