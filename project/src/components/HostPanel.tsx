import { useState } from 'react';
import { Key, Play, Clipboard, ClipboardPaste, Loader2, Crown, Settings } from 'lucide-react';
import type { Party, Player, GameCharacter, AIResponse } from '@/types';
import { CAMPAIGNS } from '@/data/campaigns';
import { cn } from '@/lib/utils';

interface HostPanelProps {
  party: Party;
  players: Player[];
  characters: GameCharacter[];
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onCampaignChange: (campaignId: string, intro?: string) => void;
  onRunRound: () => void;
  onManualPaste: (json: string) => void;
  roundResolving: boolean;
  onCampaignIntroChange: (intro: string) => void;
}

export function HostPanel({
  party, players, characters, apiKey, onApiKeyChange,
  onCampaignChange, onRunRound, onManualPaste, roundResolving, onCampaignIntroChange,
}: HostPanelProps) {
  const [showManual, setShowManual] = useState(false);
  const [manualJson, setManualJson] = useState('');
  const [copied, setCopied] = useState(false);
  const [sandboxIntro, setSandboxIntro] = useState(party.campaign_intro || '');

  const allReady = players.filter(p => characters.some(c => c.player_id === p.id)).every(p => p.ready);
  const playersWithChars = players.filter(p => characters.some(c => c.player_id === p.id));

  const campaign = CAMPAIGNS[party.campaign_id] || CAMPAIGNS.mine_curse;

  function buildManualPromptText() {
    const charInfo = characters.map(c => {
      const p = players.find(pl => pl.id === c.player_id);
      return `- ${c.name} (${c.race} ${c.class}, Ур.${c.level}): HP ${c.hp_current}/${c.hp_max}, AC ${c.ac}, Золото ${c.gold}
  СИЛ${c.stats.str} ЛОВ${c.stats.dex} ТЕЛ${c.stats.con} ИНТ${c.stats.int} МДР${c.stats.wis} ХАР${c.stats.cha}
  Состояния: ${c.conditions.length ? c.conditions.join(', ') : 'нет'}`;
    }).join('\n');

    const actions = players.map(p => {
      const c = characters.find(ch => ch.player_id === p.id);
      const roll = p.last_roll ? ` [Бросок: ${p.last_roll.total} (${p.last_roll.label})]` : '';
      return `- ${p.name} (${c?.name || 'нет'}): ${p.round_action || 'ожидает'}${roll}`;
    }).join('\n');

    return `Текущий раунд: ${party.round_number + 1}
Локация: ${party.current_location || '—'}
Кампания: ${campaign.title}

История: ${party.current_narrative || campaign.intro}

Персонажи:
${charInfo}

Действия игроков:
${actions}

Дневник квестов: ${party.quest_log || 'пусто'}

Опиши результаты действий в формате JSON согласно схеме. Все тексты на русском, image_prompt на английском.`;
  }

  function copyPrompt() {
    const text = buildManualPromptText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleManualSubmit() {
    try {
      JSON.parse(manualJson);
      onManualPaste(manualJson);
      setManualJson('');
      setShowManual(false);
    } catch {
      // validation error
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-pip-amber text-glow-amber text-sm uppercase tracking-wider flex items-center gap-2 border-b border-pip-greendark pb-2">
        <Crown size={16} /> Пульт Хоста
      </div>

      {/* API Key */}
      <div className="border border-pip-greendark rounded p-3 bg-pip-bgdark/40">
        <label className="text-xs text-pip-greendim uppercase tracking-wider flex items-center gap-1 mb-2">
          <Key size={12} /> Ключ Google Gemini API
        </label>
        <input
          type="password"
          className="pip-input w-full text-sm"
          placeholder="AIza..."
          value={apiKey}
          onChange={e => onApiKeyChange(e.target.value)}
        />
        <div className="text-[10px] text-pip-greendim mt-1">
          Бесплатный ключ: aistudio.google.com → Get API Key. Хранится только в вашем браузере.
        </div>
      </div>

      {/* Campaign selection */}
      <div className="border border-pip-greendark rounded p-3 bg-pip-bgdark/40">
        <label className="text-xs text-pip-greendim uppercase tracking-wider flex items-center gap-1 mb-2">
          <Settings size={12} /> Выбор кампании
        </label>
        <div className="space-y-2">
          {Object.values(CAMPAIGNS).map(c => (
            <button
              key={c.id}
              onClick={() => onCampaignChange(c.id, c.intro)}
              className={cn(
                'w-full border rounded p-2 text-left transition-all',
                party.campaign_id === c.id ? 'border-pip-green bg-pip-green/10' : 'border-pip-greendark hover:border-pip-greendim'
              )}
            >
              <div className={cn('text-sm', party.campaign_id === c.id ? 'text-pip-green text-glow' : 'text-pip-green')}>{c.title}</div>
              <div className="text-[10px] text-pip-greendim mt-0.5">{c.description}</div>
              <div className="text-[9px] text-pip-amber mt-0.5">{c.difficulty} · {c.levelRange}</div>
            </button>
          ))}
        </div>

        {/* Sandbox intro */}
        {party.campaign_id === 'sandbox' && (
          <div className="mt-2">
            <label className="text-[10px] text-pip-greendim uppercase block mb-1">Завязка для песочницы</label>
            <textarea
              className="pip-input w-full text-xs h-16 resize-none"
              placeholder="Введите 2-3 предложения завязки мира..."
              value={sandboxIntro}
              onChange={e => { setSandboxIntro(e.target.value); onCampaignIntroChange(e.target.value); }}
            />
          </div>
        )}
      </div>

      {/* Party readiness */}
      <div className="border border-pip-greendark rounded p-3 bg-pip-bgdark/40">
        <div className="text-xs text-pip-greendim uppercase tracking-wider mb-2">Готовность партии к раунду</div>
        <div className="space-y-1">
          {playersWithChars.map(p => (
            <div key={p.id} className="flex items-center justify-between text-xs">
              <span className="text-pip-green/80">
                {p.name}
                {p.is_host && <span className="text-pip-amber ml-1">[ХОСТ]</span>}
              </span>
              <span className={cn('pip-led', p.ready ? 'pip-led-on' : 'pip-led-off')} />
            </div>
          ))}
        </div>
        <div className={cn('text-xs mt-2 text-center', allReady ? 'text-pip-green text-glow' : 'text-pip-greendark')}>
          {allReady ? '✓ Все готовы!' : `Готово: ${playersWithChars.filter(p => p.ready).length}/${playersWithChars.length}`}
        </div>
      </div>

      {/* Run round button */}
      <button
        onClick={onRunRound}
        disabled={!allReady || roundResolving || !apiKey || playersWithChars.length === 0}
        className={cn(
          'w-full py-4 rounded text-sm uppercase tracking-wider font-bold transition-all border-2',
          allReady && apiKey && !roundResolving
            ? 'border-pip-green bg-pip-green/20 text-pip-green text-glow hover:bg-pip-green/30 animate-pulse-slow'
            : 'border-pip-greendark text-pip-greendark cursor-not-allowed'
        )}
      >
        {roundResolving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" /> ИИ-МАСТЕР РАССЧИТЫВАЕТ...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Play size={18} /> ЗАПУСТИТЬ РАСЧЁТ РАУНДА (ИИ-МАСТЕР)
          </span>
        )}
      </button>
      {!apiKey && !roundResolving && (
        <div className="text-[10px] text-pip-amber text-center">Введите API-ключ для автоматического режима</div>
      )}

      {/* Manual bridge */}
      <div className="border border-pip-greendark/50 rounded p-3 bg-pip-bgdark/30">
        <button
          onClick={() => setShowManual(!showManual)}
          className="pip-btn w-full text-xs py-2 rounded flex items-center justify-center gap-1"
        >
          <Clipboard size={12} /> Ручной мост (Скопировать промпт / Вставить JSON)
        </button>

        {showManual && (
          <div className="mt-3 space-y-2 animate-slide-up">
            <button onClick={copyPrompt} className="pip-btn active w-full text-xs py-1.5 rounded flex items-center justify-center gap-1">
              <Clipboard size={12} /> {copied ? 'СКОПИРОВАНО!' : 'Скопировать промпт для ИИ'}
            </button>
            <div>
              <label className="text-[10px] text-pip-greendim uppercase block mb-1">Вставить JSON-ответ ИИ</label>
              <textarea
                className="pip-input w-full text-xs h-32 resize-none font-mono"
                placeholder='{"narrative":"...","location_name":"...","image_prompt":"...","requested_rolls":[],"state_updates":[],"quest_log_update":"..."}'
                value={manualJson}
                onChange={e => setManualJson(e.target.value)}
              />
            </div>
            <button
              onClick={handleManualSubmit}
              disabled={!manualJson.trim()}
              className="pip-btn active w-full text-xs py-1.5 rounded flex items-center justify-center gap-1 disabled:opacity-30"
            >
              <ClipboardPaste size={12} /> Применить JSON
            </button>
          </div>
        )}
      </div>

      {/* Party code */}
      <div className="border border-pip-amber/30 rounded p-3 bg-pip-bgdark/40 text-center">
        <div className="text-[10px] text-pip-greendim uppercase">Код партии</div>
        <div className="text-2xl text-pip-amber text-glow-amber tracking-widest">{party.code}</div>
        <div className="text-[9px] text-pip-greendim mt-1">Поделитесь с друзьями для подключения</div>
      </div>
    </div>
  );
}
