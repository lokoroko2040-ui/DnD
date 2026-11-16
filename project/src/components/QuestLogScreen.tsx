import { ScrollText, BookOpen } from 'lucide-react';
import type { Party, GameLogEntry } from '@/types';

interface QuestLogScreenProps {
  party: Party;
  logs: GameLogEntry[];
}

export function QuestLogScreen({ party, logs }: QuestLogScreenProps) {
  const questEntries = party.quest_log
    ? party.quest_log.split('\n').filter(Boolean)
    : [];

  const narrativeLogs = logs.filter(l => l.type === 'narrative' || l.type === 'system');

  return (
    <div className="space-y-4">
      <div className="text-pip-amber text-glow-amber text-sm uppercase tracking-wider flex items-center gap-2 border-b border-pip-greendark pb-2">
        <BookOpen size={16} /> Дневник квестов
      </div>

      {/* Active quest log */}
      <div className="border border-pip-greendark rounded p-3 bg-pip-bgdark/40">
        <div className="text-xs text-pip-greendim uppercase tracking-wider mb-2">Текущие задачи</div>
        {questEntries.length === 0 ? (
          <div className="text-xs text-pip-greendark">Квесты ещё не получены. Начните кампанию.</div>
        ) : (
          <div className="space-y-2">
            {questEntries.map((q, i) => (
              <div key={i} className="text-sm text-pip-green/90 leading-relaxed flex items-start gap-2">
                <span className="pip-led pip-led-amber mt-1.5 flex-shrink-0" />
                <span>{q}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Narrative history */}
      <div className="border border-pip-greendark rounded p-3 bg-pip-bgdark/40">
        <div className="text-xs text-pip-greendim uppercase tracking-wider mb-2 flex items-center gap-1">
          <ScrollText size={12} /> История партии
        </div>
        {narrativeLogs.length === 0 ? (
          <div className="text-xs text-pip-greendark">История пуста.</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {[...narrativeLogs].reverse().map((log) => (
              <div key={log.id} className="border-l-2 border-pip-greendark/50 pl-2">
                <div className="text-[9px] text-pip-greendim mb-0.5">
                  Раунд {log.round_number} · {log.type === 'system' ? 'СИСТЕМА' : 'НАРРАТИВ'}
                </div>
                <div className="text-xs text-pip-green/80 leading-relaxed whitespace-pre-wrap">{log.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
