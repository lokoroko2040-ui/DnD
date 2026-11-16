import { Users, Crown, Dices } from 'lucide-react';
import type { Player, GameCharacter, RollResult } from '@/types';
import { CRTImage } from './CRTImage';
import { pollinationsPortraitUrl } from '@/lib/image';
import { cn } from '@/lib/utils';
import { outcomeLabel, outcomeColor } from '@/lib/dice';

interface PartyLogScreenProps {
  players: Player[];
  characters: GameCharacter[];
  currentPlayerId: string;
}

export function PartyLogScreen({ players, characters, currentPlayerId }: PartyLogScreenProps) {
  return (
    <div className="space-y-4">
      <div className="text-pip-amber text-glow-amber text-sm uppercase tracking-wider flex items-center gap-2 border-b border-pip-greendark pb-2">
        <Users size={16} /> Лог партии
      </div>

      <div className="space-y-3">
        {players.map(p => {
          const char = characters.find(c => c.player_id === p.id);
          const isMe = p.id === currentPlayerId;
          const hpPct = char ? (char.hp_current / char.hp_max) * 100 : 0;

          return (
            <div key={p.id} className={cn(
              'border rounded p-3',
              isMe ? 'border-pip-green bg-pip-green/5' : 'border-pip-greendark bg-pip-bgdark/40'
            )}>
              <div className="flex gap-3">
                {char && (
                  <CRTImage
                    src={char.portrait_url || pollinationsPortraitUrl(`${char.race} ${char.class} portrait`, char.name.length * 100)}
                    alt={char.name}
                    className="w-14 h-14 rounded border border-pip-greendark flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm', isMe ? 'text-pip-green text-glow' : 'text-pip-green')}>{p.name}</span>
                    {p.is_host && <Crown size={12} className="text-pip-amber" />}
                    {isMe && <span className="text-[9px] text-pip-greendim">[ВЫ]</span>}
                  </div>
                  {char ? (
                    <>
                      <div className="text-xs text-pip-amber">{char.name} — {char.race} {char.class} Ур.{char.level}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-pip-bgdark border border-pip-greendark/50 rounded overflow-hidden">
                          <div className={cn('h-full transition-all', hpPct > 60 ? 'bg-pip-green' : hpPct > 30 ? 'bg-pip-amber' : 'bg-pip-red')} style={{ width: `${hpPct}%` }} />
                        </div>
                        <span className="text-[10px] text-pip-green">{char.hp_current}/{char.hp_max}</span>
                      </div>
                      <div className="flex gap-2 text-[10px] text-pip-greendim mt-1">
                        <span>AC {char.ac}</span>
                        <span>XP {char.xp}</span>
                        <span>{char.gold} зм</span>
                        {char.conditions.length > 0 && <span className="text-pip-red">{char.conditions.join(', ')}</span>}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-pip-greendark">Персонаж не создан</div>
                  )}

                  {/* Last roll */}
                  {p.last_roll && (
                    <div className="mt-1 flex items-center gap-1 text-[10px]">
                      <Dices size={10} className="text-pip-greendim" />
                      <span className="text-pip-greendim">d{p.last_roll.die}:</span>
                      <span className="text-pip-green">{p.last_roll.total}</span>
                      {p.last_roll.outcome && (
                        <span className={outcomeColor(p.last_roll.outcome)}>{outcomeLabel(p.last_roll.outcome)}</span>
                      )}
                    </div>
                  )}

                  {/* Round action */}
                  {p.round_action && (
                    <div className="mt-1 text-[10px] text-pip-greendim border-l border-pip-greendark/30 pl-2">
                      <span className="text-pip-amber/70">Действие: </span>{p.round_action}
                    </div>
                  )}

                  {/* Ready status */}
                  <div className="mt-1 flex items-center gap-1">
                    <span className={cn('pip-led', p.ready ? 'pip-led-on' : 'pip-led-off')} />
                    <span className={cn('text-[10px]', p.ready ? 'text-pip-green' : 'text-pip-greendark')}>
                      {p.ready ? 'ГОТОВ' : 'НЕ ГОТОВ'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
