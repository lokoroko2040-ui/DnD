import { useState, useEffect } from 'react';
import { MapPin, ScrollText, CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import type { Party, GameCharacter, Player, RequestedRoll, RollResult } from '@/types';
import { FantasyImage } from './FantasyImage';
import { pollinationsSceneUrl } from '@/lib/image';
import { DiceRoller } from './DiceRoller';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipCard } from './Tooltip';

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

  useEffect(() => { setAction(player.round_action); }, [player.round_action]);
  useEffect(() => { setLocalSeed(sceneImageSeed); }, [sceneImageSeed, party.current_image_prompt]);

  const myRequestedRoll = requestedRolls.find(r => r.player_id === player.id);
  const allReady = allPlayers.filter(p => allCharacters.some(c => c.player_id === p.id)).every(p => p.ready);

  const sceneImage = party.current_image_prompt
    ? pollinationsSceneUrl(party.current_image_prompt, localSeed)
    : pollinationsSceneUrl('dark fantasy dungeon scene torch lit', 1);

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-[#c8aa6e]" />
          <span className="font-fantasy text-lg text-[#e8d5a8] font-semibold">{party.current_location || '—'}</span>
        </div>
        <span className="text-xs text-[#9a8a6a] font-body">Раунд {party.round_number}</span>
      </div>

      <FantasyImage
        src={sceneImage}
        alt={party.current_location || 'Сцена'}
        className="w-full h-64 md:h-80 rounded-xl border border-[#3d3528]"
      />

      <div className="dnd-card p-5 max-h-72 overflow-y-auto">
        <div className="text-xs text-[#9a8a6a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ScrollText size={14} className="text-[#c8aa6e]" /> Повествование ИИ-Мастера
        </div>
        {party.round_resolving ? (
          <div className="flex items-center gap-3 text-[#c8aa6e] animate-pulse text-sm font-fantasy">
            <Loader2 size={20} className="animate-spin" />
            ИИ-Мастер обрабатывает раунд...
          </div>
        ) : party.current_narrative ? (
          <div className="text-sm text-[#d4c5a0] leading-relaxed whitespace-pre-wrap font-body">{party.current_narrative}</div>
        ) : (
          <div className="text-sm text-[#6a6050]">Ожидание начала кампании...</div>
        )}
      </div>

      {myRequestedRoll && !party.round_resolving && (
        <div className="dnd-card p-4 border-[#f0ad4e]/50 fade-in">
          <div className="flex items-center gap-2 text-[#f0ad4e] mb-1">
            <AlertCircle size={16} />
            <span className="font-fantasy text-sm font-semibold uppercase tracking-wider">Запрошена проверка</span>
          </div>
          <div className="text-sm text-[#e8d5a8]">{myRequestedRoll.ability} (Сл {myRequestedRoll.dc})</div>
          <div className="text-xs text-[#b8862e] mt-1">{myRequestedRoll.reason}</div>
        </div>
      )}

      <DiceRoller
        stats={character.stats}
        lastRoll={player.last_roll}
        onRoll={onRoll}
        requestedRoll={myRequestedRoll ? { ability: myRequestedRoll.ability, dc: myRequestedRoll.dc, reason: myRequestedRoll.reason } : null}
      />

      <div>
        <label className="text-xs text-[#9a8a6a] uppercase tracking-wider block mb-2 font-body">Ваше действие в этом раунде</label>
        <textarea
          className="dnd-input w-full text-sm h-24 resize-none font-body"
          placeholder="Опишите, что делает ваш персонаж в этом раунде..."
          value={action}
          onChange={e => { setAction(e.target.value); onActionChange(e.target.value); }}
          disabled={player.ready}
        />
      </div>

      <button
        onClick={onToggleReady}
        disabled={party.round_resolving}
        className={cn(
          'w-full py-3.5 rounded-lg text-sm font-fantasy font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer',
          player.ready
            ? 'dnd-btn dnd-btn-active border-2 border-[#5eba7d]'
            : 'dnd-btn dnd-btn-primary'
        )}
      >
        {player.ready ? <><CheckCircle2 size={18} /> Готов</> : <><Circle size={18} /> Отметить готовность</>}
      </button>

      <div className="dnd-card p-4">
        <div className="text-xs text-[#9a8a6a] uppercase tracking-wider mb-3 font-body">Готовность партии</div>
        <div className="space-y-2">
          {allPlayers.map(p => {
            const char = allCharacters.find(c => c.player_id === p.id);
            if (!char) return null;
            return (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-[#d4c5a0] font-body">
                  {p.name} <span className="text-[#9a8a6a]">({char.name})</span>
                  {p.is_host && <span className="text-[#c8aa6e] ml-1.5 text-xs">[Хост]</span>}
                </span>
                <span className={cn('flex items-center gap-1.5 text-xs', p.ready ? 'text-[#5eba7d]' : 'text-[#6a6050]')}>
                  <span className={cn('w-2 h-2 rounded-full', p.ready ? 'bg-[#5eba7d] pulse-ready' : 'bg-[#6a6050]')} />
                  {p.ready ? 'Готов' : 'Не готов'}
                </span>
              </div>
            );
          })}
        </div>
        {allReady && !party.round_resolving && (
          <div className="text-xs text-[#5eba7d] text-center mt-3 animate-pulse font-fantasy">
            Все готовы! Хост может запустить расчёт раунда.
          </div>
        )}
      </div>
    </div>
  );
}
