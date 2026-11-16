import { Coffee, Bed, Heart, Shield, Zap } from 'lucide-react';
import type { GameCharacter } from '@/types';
import { ABILITY_SCORES, modStr, proficiencyBonus, calcInitiative } from '@/data/dndRules';
import { cn, conditionColor } from '@/lib/utils';
import { CRTImage } from './CRTImage';
import { pollinationsPortraitUrl } from '@/lib/image';

interface StatusScreenProps {
  character: GameCharacter;
  onShortRest: () => void;
  onLongRest: () => void;
}

export function StatusScreen({ character, onShortRest, onLongRest }: StatusScreenProps) {
  const hpPct = Math.max(0, (character.hp_current / character.hp_max) * 100);
  const prof = proficiencyBonus(character.level);
  const initiative = calcInitiative(character.stats);

  const hpColor = hpPct > 60 ? 'bg-pip-green' : hpPct > 30 ? 'bg-pip-amber' : 'bg-pip-red';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex gap-3 items-center border-b border-pip-greendark pb-3">
        <CRTImage
          src={character.portrait_url || pollinationsPortraitUrl(`${character.race} ${character.class} portrait`, character.name.length * 100)}
          alt={character.name}
          className="w-20 h-20 rounded border border-pip-greendark flex-shrink-0"
        />
        <div>
          <div className="text-pip-green text-glow text-lg">{character.name}</div>
          <div className="text-sm text-pip-amber">{character.race} {character.class}</div>
          <div className="text-xs text-pip-greendim">Уровень {character.level} | {character.xp} XP</div>
        </div>
      </div>

      {/* Pip-Boy silhouette + HP bar */}
      <div className="flex gap-4">
        <div className="flex-shrink-0 relative">
          <svg viewBox="0 0 120 200" className="w-24 h-40 text-pip-green" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Head */}
            <circle cx="60" cy="25" r="15" className={character.conditions.includes('Ранен') ? 'text-pip-red' : ''} />
            {/* Body */}
            <path d="M 45 40 L 75 40 L 80 80 L 75 120 L 65 120 L 60 90 L 55 120 L 45 120 L 40 80 Z" />
            {/* Arms */}
            <path d="M 40 45 L 25 70 L 22 100" />
            <path d="M 80 45 L 95 70 L 98 100" />
            {/* Legs */}
            <path d="M 50 120 L 45 170 L 42 195" />
            <path d="M 70 120 L 75 170 L 78 195" />
            {/* Heart indicator */}
            <circle cx="60" cy="60" r="4" fill={hpPct > 30 ? 'currentColor' : '#ef4444'} className={hpPct <= 30 ? 'text-pip-red animate-pulse' : ''} />
            {/* Condition indicators */}
            {character.conditions.includes('Отравлен') && (
              <circle cx="60" cy="75" r="3" fill="#22c55e" className="animate-pulse" />
            )}
            {character.conditions.includes('Благословлён') && (
              <path d="M 60 35 L 62 42 L 69 42 L 63 47 L 65 54 L 60 50 L 55 54 L 57 47 L 51 42 L 58 42 Z" fill="#f59e0b" />
            )}
          </svg>
        </div>

        <div className="flex-1 space-y-3">
          {/* HP */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-pip-red flex items-center gap-1"><Heart size={12} /> Здоровье</span>
              <span className="text-pip-green text-glow">{character.hp_current} / {character.hp_max}</span>
            </div>
            <div className="h-3 bg-pip-bgdark border border-pip-greendark rounded overflow-hidden">
              <div className={cn('h-full transition-all duration-500', hpColor)} style={{ width: `${hpPct}%` }} />
            </div>
          </div>

          {/* AC */}
          <div className="flex items-center justify-between border border-pip-greendark rounded px-3 py-1">
            <span className="text-xs text-pip-greendim flex items-center gap-1"><Shield size={12} /> Класс Доспеха</span>
            <span className="text-lg text-pip-green text-glow">{character.ac}</span>
          </div>

          {/* Initiative + Proficiency */}
          <div className="grid grid-cols-2 gap-2">
            <div className="border border-pip-greendark rounded px-3 py-1 flex items-center justify-between">
              <span className="text-[10px] text-pip-greendim">Инициатива</span>
              <span className="text-sm text-pip-green text-glow">{initiative >= 0 ? '+' : ''}{initiative}</span>
            </div>
            <div className="border border-pip-greendark rounded px-3 py-1 flex items-center justify-between">
              <span className="text-[10px] text-pip-greendim">Бонус Мастерства</span>
              <span className="text-sm text-pip-green text-glow">+{prof}</span>
            </div>
          </div>

          {/* Gold */}
          <div className="flex items-center justify-between border border-pip-amber/30 rounded px-3 py-1">
            <span className="text-xs text-pip-amber/70">Золото</span>
            <span className="text-sm text-pip-amber text-glow-amber">{character.gold} зм</span>
          </div>

          {/* Hit Dice */}
          <div className="flex items-center justify-between border border-pip-greendark rounded px-3 py-1">
            <span className="text-[10px] text-pip-greendim flex items-center gap-1"><Zap size={10} /> Кости Хитов</span>
            <span className="text-sm text-pip-green">{character.hit_dice.current} / {character.hit_dice.total}</span>
          </div>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="grid grid-cols-3 gap-2">
        {ABILITY_SCORES.map(ab => (
          <div key={ab.key} className="border border-pip-greendark rounded p-2 text-center bg-pip-bgdark/40">
            <div className="text-[9px] text-pip-greendim uppercase">{ab.short}</div>
            <div className="text-lg text-pip-green text-glow">{character.stats[ab.key]}</div>
            <div className="text-[10px] text-pip-amber">{modStr(character.stats[ab.key])}</div>
          </div>
        ))}
      </div>

      {/* Conditions */}
      <div className="border border-pip-greendark rounded p-3 bg-pip-bgdark/40">
        <div className="text-xs text-pip-greendim uppercase tracking-wider mb-2">Активные статусы</div>
        {character.conditions.length === 0 ? (
          <div className="text-xs text-pip-green/50 flex items-center gap-1"><span className="pip-led pip-led-on" /> Здоров</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {character.conditions.map((c, i) => (
              <span key={i} className={cn('text-xs border rounded px-2 py-1', conditionColor(c), 'border-current/30')}>
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Spell slots */}
      {Object.keys(character.spell_slots).length > 0 && (
        <div className="border border-pip-cyan/30 rounded p-3 bg-pip-bgdark/40">
          <div className="text-xs text-pip-cyan uppercase tracking-wider mb-2">Ячейки заклинаний</div>
          <div className="flex gap-3">
            {Object.entries(character.spell_slots).map(([level, slots]) => (
              <div key={level} className="text-center">
                <div className="text-[10px] text-pip-greendim">Ур. {level}</div>
                <div className="text-sm text-pip-cyan">{slots}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rest buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onShortRest} className="pip-btn active px-3 py-2 rounded text-xs flex items-center justify-center gap-1">
          <Coffee size={14} /> Короткий отдых
        </button>
        <button onClick={onLongRest} className="pip-btn active px-3 py-2 rounded text-xs flex items-center justify-center gap-1">
          <Bed size={14} /> Длинный отдых
        </button>
      </div>
    </div>
  );
}
