import { Coffee, Bed, Heart, Shield, Zap, Sparkles } from 'lucide-react';
import type { GameCharacter } from '@/types';
import { ABILITY_SCORES, ABILITY_INFO, modStr, proficiencyBonus, calcInitiative, CONDITIONS, COMBAT_INFO } from '@/data/dndRules';
import { cn, conditionColorClass } from '@/lib/utils';
import { FantasyImage } from './FantasyImage';
import { Tooltip, TooltipCard } from './Tooltip';
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
  const hpColor = hpPct > 60 ? '#5eba7d' : hpPct > 30 ? '#f0ad4e' : '#e34d4d';

  return (
    <div className="space-y-5 fade-in">
      <h2 className="font-fantasy text-xl text-[#e8d5a8] font-semibold tracking-wide">Лист Персонажа</h2>

      <div className="dnd-card p-5 flex gap-4 items-center">
        <FantasyImage
          src={character.portrait_url || pollinationsPortraitUrl(`${character.race} ${character.class} portrait`, character.name.length * 100)}
          alt={character.name}
          className="w-24 h-24 rounded-xl border border-[#3d3528] flex-shrink-0"
        />
        <div className="flex-1">
          <div className="font-fantasy text-xl text-[#e8d5a8] font-bold">{character.name}</div>
          <div className="text-sm text-[#c8aa6e] mt-0.5">{character.race} · {character.class}</div>
          <div className="text-xs text-[#9a8a6a] mt-1">Уровень {character.level} · {character.xp} XP</div>
          {character.background && <div className="text-xs text-[#8a7350] mt-0.5">Предыстория: {character.background}</div>}
        </div>
        <div className="flex flex-col gap-2 text-right">
          <div className="text-xs text-[#6a6050]">Золото</div>
          <div className="font-fantasy text-lg text-[#c8aa6e] font-bold">{character.gold} зм</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="dnd-card p-3 text-center">
          <Tooltip content={<TooltipCard title="Здоровье (HP)">Текущий и максимальный запас жизненных сил. При достижении 0 — без сознания.</TooltipCard>}>
            <div className="text-xs text-[#9a8a6a] flex items-center justify-center gap-1 cursor-help"><Heart size={12} className="text-[#e34d4d]" /> HP</div>
          </Tooltip>
          <div className="text-lg font-fantasy font-bold text-[#d4c5a0] mt-1">{character.hp_current} / {character.hp_max}</div>
          <div className="h-1.5 rounded bg-[#2a1515] overflow-hidden mt-2">
            <div className="h-full transition-all" style={{ width: `${hpPct}%`, background: hpColor }} />
          </div>
        </div>

        <div className="dnd-card p-3 text-center">
          <Tooltip content={<TooltipCard title={COMBAT_INFO.ac.title}>{COMBAT_INFO.ac.desc}</TooltipCard>}>
            <div className="text-xs text-[#9a8a6a] flex items-center justify-center gap-1 cursor-help"><Shield size={12} className="text-[#c8aa6e]" /> КД</div>
          </Tooltip>
          <div className="text-lg font-fantasy font-bold text-[#c8aa6e] mt-1">{character.ac}</div>
        </div>

        <div className="dnd-card p-3 text-center">
          <Tooltip content={<TooltipCard title={COMBAT_INFO.initiative.title}>{COMBAT_INFO.initiative.desc}</TooltipCard>}>
            <div className="text-xs text-[#9a8a6a] flex items-center justify-center gap-1 cursor-help"><Zap size={12} className="text-[#5b8def]" /> Инициатива</div>
          </Tooltip>
          <div className="text-lg font-fantasy font-bold text-[#d4c5a0] mt-1">{initiative >= 0 ? '+' : ''}{initiative}</div>
        </div>

        <div className="dnd-card p-3 text-center">
          <Tooltip content={<TooltipCard title={COMBAT_INFO.profBonus.title}>{COMBAT_INFO.profBonus.desc}</TooltipCard>}>
            <div className="text-xs text-[#9a8a6a] flex items-center justify-center gap-1 cursor-help">Бонус Мастерства</div>
          </Tooltip>
          <div className="text-lg font-fantasy font-bold text-[#5eba7d] mt-1">+{prof}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {ABILITY_SCORES.map(ab => {
          const info = ABILITY_INFO[ab.key];
          return (
            <div key={ab.key} className="stat-box p-3">
              <Tooltip content={<TooltipCard title={info.title}>{info.desc}<div className="mt-2 text-[10px] text-[#8a7350]">Навыки: {info.skills.length ? info.skills.join(', ') : 'нет прямых'}</div></TooltipCard>}>
                <div className="text-[10px] text-[#9a8a6a] uppercase cursor-help">{ab.short}</div>
              </Tooltip>
              <div className="text-xl font-fantasy font-bold text-[#e8d5a8] mt-1">{character.stats[ab.key]}</div>
              <div className="text-xs text-[#c8aa6e] mt-0.5">{modStr(character.stats[ab.key])}</div>
            </div>
          );
        })}
      </div>

      <div className="dnd-card p-4">
        <div className="text-xs text-[#9a8a6a] uppercase tracking-wider mb-2 flex items-center gap-2">
          <Sparkles size={12} className="text-[#c8aa6e]" /> Активные состояния
        </div>
        {character.conditions.length === 0 ? (
          <div className="text-sm text-[#5eba7d]">Здоров — нет активных состояний</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {character.conditions.map((c, i) => {
              const condInfo = CONDITIONS.find(co => co.name === c);
              return (
                <Tooltip key={i} content={<TooltipCard title={c}>{condInfo?.desc || 'Неизвестное состояние'}</TooltipCard>}>
                  <span className={cn('text-xs border rounded px-2.5 py-1 cursor-help', conditionColorClass(c), 'border-current/30')}>
                    {c}
                  </span>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>

      {Object.keys(character.spell_slots).length > 0 && (
        <div className="dnd-card p-4 border-[#5b8def]/30">
          <div className="text-xs text-[#5b8def] uppercase tracking-wider mb-2">Ячейки заклинаний</div>
          <div className="flex gap-4">
            {Object.entries(character.spell_slots).map(([level, slots]) => (
              <div key={level} className="text-center">
                <div className="text-[10px] text-[#9a8a6a]">Круг {level}</div>
                <div className="text-sm text-[#5b8def] font-fantasy font-bold">{slots}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dnd-card p-4">
        <div className="text-xs text-[#9a8a6a] uppercase tracking-wider mb-2 flex items-center gap-1">
          <Zap size={12} /> Кости Хитов
        </div>
        <div className="text-sm text-[#d4c5a0]">{character.hit_dice.current} / {character.hit_dice.total}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tooltip content={<TooltipCard title={COMBAT_INFO.shortRest.title}>{COMBAT_INFO.shortRest.desc}</TooltipCard>}>
          <button onClick={onShortRest} className="dnd-btn dnd-btn-primary px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer">
            <Coffee size={16} /> Короткий отдых
          </button>
        </Tooltip>
        <Tooltip content={<TooltipCard title={COMBAT_INFO.longRest.title}>{COMBAT_INFO.longRest.desc}</TooltipCard>}>
          <button onClick={onLongRest} className="dnd-btn dnd-btn-primary px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer">
            <Bed size={16} /> Длинный отдых
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
