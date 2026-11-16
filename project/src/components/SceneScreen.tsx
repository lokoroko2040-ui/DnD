import { useState, useEffect } from 'react';
import { MapPin, ScrollText, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import type { Party, GameCharacter, Player, RequestedRoll, RollResult } from '@/types';
import { CRTImage } from './CRTImage';
import { pollinationsUrl } from '@/lib/image';
import { DiceRoller } from './DiceRoller';
import { cn } from '@/lib/utils';

interface SceneScreenProps {
  party: Party;
  character: GameCharacter;
  player: Player;
  allPlayers: Player[];
  allCharacters: GameCharacter[];
  requestedRolls: RequestedRoll[];
  onRoll: (result: RollResult) => void;
  onActionChange: (action: string) => void;
  onToggleReady: () => void;
  sceneImageSeed: number;
}

export function SceneScreen({
  party, character, player, allPlayers, allCharacters,
  requestedRolls, onRoll, onActionChange, onToggleReady, sceneImageSeed,
}: SceneScreenProps) {
  const [action, setAction] = useState(player.round_action);
  const [localSeed, setLocalSeed] = useState(sceneImageSeed);

  useEffect(() => {
    setAction(player.round_action);
  }, [player.round_action]);

  useEffect(() => {
    setLocalSeed(sceneImageSeed);
  }, [sceneImageSeed, party.current_image_prompt]);

  const myRequestedRoll = requestedRolls.find(r => r.player_id === player.id);
  const allReady = allPlayers.every(p => p.ready);
  const hasCharacter = (p: Player) => allCharacters.some(c => c.player_id === p.id);

  const sceneImage = party.current_image_prompt
    ? pollinationsUrl(party.current_image_prompt, 800, 400, localSeed)
    : pollinationsUrl('dark fantasy dungeon scene torch lit', 800, 400, 1);

  return (
    <div className="space-y-4">
      {/* Location + round */}
      <div className="flex items-center justify-between border-b border-pip-greendark pb-2">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-pip-amber" />
          <span className="text-sm text-pip-amber text-glow-amber">{party.current_location || '—'}</span>
        </div>
        <span className="text-xs text-pip-greendim">Раунд {party.round_number}</span>
      </div>

      {/* Scene image */}
      <CRTImage
        src={sceneImage}
        alt={party.current_location || 'Сцена'}
        className="w-full h-48 md:h-56 rounded border border-pip-greendark"
      />

      {/* Narrative */}
      <div className="border border-pip-greendark rounded p-3 bg-pip-bgdark/40 max-h-48 overflow-y-auto">
        <div className="text-xs text-pip-greendim uppercase tracking-wider mb-1 flex items-center gap-1">
          <ScrollText size={12} /> Повествование ИИ-Мастера
        </div>
        {party.round_resolving ? (
          <div className="flex items-center gap-2 text-pip-amber text-glow-amber animate-pulse text-sm">
            <Loader2 size={16} className="animate-spin" />
            ИИ-МАСТЕР ОБРАБАТЫВАЕТ РАУНД...
          </div>
        ) : party.current_narrative ? (
          <div className="text-sm text-pip-green/90 leading-relaxed whitespace-pre-wrap">{party.current_narrative}</div>
        ) : (
          <div className="text-xs text-pip-greendark">Ожидание начала кампании...</div>
        )}
      </div>

      {/* Requested roll */}
      {myRequestedRoll && !party.round_resolving && (
        <div className="border border-pip-amber rounded p-3 bg-pip-amber/5 animate-slide-up">
          <div className="text-xs text-pip-amber text-glow-amber uppercase mb-1">Запрошена проверка</div>
          <div className="text-sm text-pip-amber">{myRequestedRoll.ability} (Сл {myRequestedRoll.dc})</div>
          <div className="text-[11px] text-pip-amber/70 mt-1">{myRequestedRoll.reason}</div>
        </div>
      )}

      {/* Dice roller */}
      <DiceRoller
        stats={character.stats}
        lastRoll={player.last_roll}
        onRoll={onRoll}
        requestedRoll={myRequestedRoll ? { ability: myRequestedRoll.ability, dc: myRequestedRoll.dc, reason: myRequestedRoll.reason } : null}
      />

      {/* Action input */}
      <div>
        <label className="text-xs text-pip-greendim uppercase tracking-wider block mb-1">Ваше действие в этом раунде</label>
        <textarea
          className="pip-input w-full text-sm h-20 resize-none"
          placeholder="Опишите, что делает ваш персонаж в этом раунде..."
          value={action}
          onChange={e => { setAction(e.target.value); onActionChange(e.target.value); }}
          disabled={player.ready}
        />
      </div>

      {/* Ready toggle */}
      <button
        onClick={onToggleReady}
        disabled={party.round_resolving}
        className={cn(
          'w-full py-3 rounded text-sm uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 border-2 disabled:opacity-50',
          player.ready
            ? 'border-pip-green bg-pip-green/20 text-pip-green text-glow'
            : 'border-pip-amber bg-pip-amber/10 text-pip-amber text-glow-amber hover:bg-pip-amber/20'
        )}
      >
        {player.ready ? <><CheckCircle2 size={18} /> ГОТОВ</> : <><Circle size={18} /> НЕ ГОТОВ — нажать когда готов</>}
      </button>

      {/* Party readiness */}
      <div className="border border-pip-greendark rounded p-3 bg-pip-bgdark/40">
        <div className="text-xs text-pip-greendim uppercase tracking-wider mb-2">Готовность партии</div>
        <div className="space-y-1">
          {allPlayers.map(p => {
            const char = allCharacters.find(c => c.player_id === p.id);
            return (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="text-pip-green/80">
                  {p.name} {char && `(${char.name})`}
                  {p.is_host && <span className="text-pip-amber ml-1">[ХОСТ]</span>}
                </span>
                <span className={cn('pip-led', p.ready ? 'pip-led-on' : 'pip-led-off')} />
              </div>
            );
          })}
        </div>
        {allReady && !party.round_resolving && (
          <div className="text-xs text-pip-green text-glow text-center mt-2 animate-pulse">
            ✓ Все готовы! Хост может запустить расчёт раунда.
          </div>
        )}
      </div>
    </div>
  );
}
