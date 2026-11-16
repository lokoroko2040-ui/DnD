import type { TabKey } from '@/types';
import { cn } from '@/lib/utils';

interface PipBoyFrameProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  isHost: boolean;
  children: React.ReactNode;
}

const TABS: { key: TabKey; label: string; short: string }[] = [
  { key: 'scene', label: 'СЦЕНА', short: 'СЦН' },
  { key: 'status', label: 'СТАТУС', short: 'СТТ' },
  { key: 'inventory', label: 'ИНВЕНТАРЬ', short: 'ИНВ' },
  { key: 'quests', label: 'КВЕСТЫ', short: 'КВС' },
  { key: 'party', label: 'ЛОГ ПАРТИИ', short: 'ПРТ' },
  { key: 'host', label: 'ПУЛЬТ ХОСТА', short: 'ХСТ' },
];

export function PipBoyFrame({ activeTab, onTabChange, isHost, children }: PipBoyFrameProps) {
  return (
    <div className="min-h-screen w-full flex items-start justify-center p-2 md:p-4">
      <div className="pip-frame max-w-2xl w-full relative md:p-5 p-3">
        {/* Rivets — corners + midpoints */}
        <div className="absolute top-3 left-3 pip-rivet" />
        <div className="absolute top-3 right-3 pip-rivet" />
        <div className="absolute bottom-3 left-3 pip-rivet" />
        <div className="absolute bottom-3 right-3 pip-rivet" />

        {/* Screen bezel */}
        <div className="pip-bezel p-2.5 md:p-3">
          {/* Header strip inside bezel */}
          <div className="pip-header flex items-center justify-between px-3 py-1.5 mb-2 rounded-t-md">
            <div className="flex items-center gap-2">
              <span className="pip-led pip-led-on" />
              <span className="pip-led pip-led-amber" />
              <span className="pip-led pip-led-off" />
            </div>
            <div className="text-[10px] text-pip-greendim tracking-[0.2em] no-select">
              PIP-BOY 2000
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn('pip-led', isHost ? 'pip-led-amber' : 'pip-led-on')} />
              <span className="text-[9px] text-pip-greendim no-select">{isHost ? 'HOST' : 'PLYR'}</span>
            </div>
          </div>

          {/* CRT Screen */}
          <div className="pip-screen crt-scanlines crt-flicker p-3 md:p-4 min-h-[500px] rounded-md">
            <div className="text-pip-green">
              {children}
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="mt-3 grid grid-cols-6 gap-1.5 md:gap-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              disabled={tab.key === 'host' && !isHost}
              className={cn(
                'pip-btn text-[9px] md:text-xs py-2.5 px-1 no-select transition-all',
                activeTab === tab.key && 'active',
                tab.key === 'host' && !isHost && 'opacity-30 cursor-not-allowed'
              )}
            >
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden">{tab.short}</span>
            </button>
          ))}
        </div>

        {/* Bottom indicator strip */}
        <div className="mt-3 flex items-center justify-between px-3">
          <div className="flex items-center gap-1.5">
            <span className="pip-led pip-led-on" />
            <span className="text-[8px] text-pip-greendim tracking-wider no-select">PWR</span>
          </div>
          <div className="text-[8px] text-pip-greendark tracking-[0.15em] no-select">
            ROBCO INDUSTRIES © 2000
          </div>
          <div className="flex items-center gap-1.5">
            <span className="pip-led pip-led-on animate-blink" />
            <span className="text-[8px] text-pip-greendim tracking-wider no-select">SIG</span>
          </div>
        </div>
      </div>
    </div>
  );
}
