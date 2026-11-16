import type { TabKey, GameCharacter, Player } from '@/types';
import { cn } from '@/lib/utils';
import {
  Map, ScrollText, Backpack, BookOpen, ListChecks,
  UserPlus, Crown, Swords, Heart, Shield
} from 'lucide-react';
import { FantasyImage } from './FantasyImage';
import { pollinationsPortraitUrl } from '@/lib/image';
import { calcInitiative } from '@/data/dndRules';

interface DashboardLayoutProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  isHost: boolean;
  hasCharacter: boolean;
  partyCode: string;
  roundNumber: number;
  players: Player[];
  characters: GameCharacter[];
  currentPlayerId: string;
  children: React.ReactNode;
}

const NAV_ITEMS: { key: TabKey; label: string; icon: typeof Map }[] = [
  { key: 'scene', label: 'Сцена и Поход', icon: Map },
  { key: 'character', label: 'Лист Персонажа', icon: ScrollText },
  { key: 'inventory', label: 'Снаряжение', icon: Backpack },
  { key: 'spells', label: 'Заклинания', icon: BookOpen },
  { key: 'quests', label: 'Журнал Квестов', icon: ListChecks },
  { key: 'builder', label: 'Создание Героя', icon: UserPlus },
];

export function DashboardLayout({
  activeTab, onTabChange, isHost, hasCharacter, partyCode, roundNumber,
  players, characters, currentPlayerId, children,
}: DashboardLayoutProps) {
  const navItems = [...NAV_ITEMS];
  if (isHost) navItems.push({ key: 'host', label: 'Пульт Мастера', icon: Crown });

  return (
    <div className="h-screen w-screen flex bg-[#0f1117] overflow-hidden">
      {/* Left Sidebar Navigation */}
      <nav className="w-60 flex-shrink-0 border-r border-[#3d3528] flex flex-col bg-[#0d0f15] hidden md:flex">
        <div className="px-5 py-5 border-b border-[#3d3528]">
          <div className="font-fantasy text-[#e8d5a8] text-lg font-bold tracking-wide">AI Dungeon</div>
          <div className="font-fantasy text-[#c8aa6e] text-sm font-semibold tracking-wider">MASTER</div>
          <div className="text-[#6a6050] text-[10px] mt-1 font-body tracking-wider">D&D 5e · Пошаговая игра</div>
        </div>

        <div className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            const disabled = item.key !== 'builder' && !hasCharacter;
            return (
              <button
                key={item.key}
                onClick={() => !disabled && onTabChange(item.key)}
                disabled={disabled}
                className={cn(
                  'w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-all no-select border-l-2',
                  active
                    ? 'border-[#c8aa6e] bg-gradient-to-r from-[#c8aa6e]/10 to-transparent text-[#e8d5a8]'
                    : 'border-transparent text-[#9a8a6a] hover:text-[#d4c5a0] hover:bg-[#1a1d27]/50',
                  disabled && 'opacity-30 cursor-not-allowed'
                )}
              >
                <Icon size={16} className={active ? 'text-[#c8aa6e]' : ''} />
                <span className="font-body font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-[#3d3528] space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[#6a6050]">
            <span>Код партии</span>
            <span className="font-fantasy text-[#c8aa6e] text-base font-bold tracking-widest">{partyCode}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#6a6050]">
            <span>Раунд</span>
            <span className="text-[#d4c5a0] font-body font-semibold">{roundNumber}</span>
          </div>
          {isHost && (
            <div className="flex items-center gap-1.5 pt-1">
              <Crown size={10} className="text-[#c8aa6e]" />
              <span className="text-[10px] text-[#c8aa6e] font-fantasy font-semibold">Хост · Мастер</span>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0d0f15] border-b border-[#3d3528] px-3 py-2 flex items-center gap-1 overflow-x-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          const disabled = item.key !== 'builder' && !hasCharacter;
          return (
            <button
              key={item.key}
              onClick={() => !disabled && onTabChange(item.key)}
              disabled={disabled}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] transition-all no-select',
                active ? 'dnd-btn-active' : 'dnd-btn',
                disabled && 'opacity-30'
              )}
            >
              <Icon size={13} />
              <span className="font-body">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Center Workspace */}
      <main className="flex-1 overflow-y-auto pt-12 md:pt-0">
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Right Party Column — desktop only */}
      <aside className="w-72 flex-shrink-0 border-l border-[#3d3528] bg-[#0d0f15] overflow-y-auto hidden lg:block">
        <div className="px-4 py-4 border-b border-[#3d3528]">
          <div className="font-fantasy text-[#e8d5a8] text-sm font-semibold tracking-wide flex items-center gap-2">
            <Swords size={14} className="text-[#c8aa6e]" /> Отряд
          </div>
          <div className="text-[#6a6050] text-[10px] mt-0.5">{players.length} игроков</div>
        </div>

        <div className="p-3 space-y-2">
          {players.map(p => {
            const char = characters.find(c => c.player_id === p.id);
            const isMe = p.id === currentPlayerId;
            const hpPct = char ? Math.max(0, (char.hp_current / char.hp_max) * 100) : 0;
            const init = char ? calcInitiative(char.stats) : 0;

            return (
              <div
                key={p.id}
                className={cn(
                  'dnd-card p-3 transition-all',
                  isMe && 'dnd-card-selected',
                  p.ready && 'border-[#5eba7d]/40'
                )}
              >
                <div className="flex gap-2.5">
                  {char ? (
                    <FantasyImage
                      src={char.portrait_url || pollinationsPortraitUrl(`${char.race} ${char.class} portrait`, char.name.length * 100)}
                      alt={char.name}
                      className="w-12 h-12 rounded border border-[#3d3528] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded border border-[#3d3528] flex-shrink-0 flex items-center justify-center bg-[#161922]">
                      <span className="text-[#6a6050] text-[10px]">нет</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('text-xs font-body font-semibold truncate', isMe ? 'text-[#e8d5a8]' : 'text-[#d4c5a0]')}>
                        {p.name}
                      </span>
                      {p.is_host && <Crown size={10} className="text-[#c8aa6e] flex-shrink-0" />}
                    </div>
                    {char ? (
                      <>
                        <div className="text-[10px] text-[#9a8a6a] truncate font-body">{char.race} {char.class} · Ур.{char.level}</div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="flex-1 h-1.5 rounded bg-[#2a1515] overflow-hidden">
                            <div
                              className={cn('h-full transition-all', hpPct > 60 ? 'bg-[#5eba7d]' : hpPct > 30 ? 'bg-[#f0ad4e]' : 'bg-[#e34d4d]')}
                              style={{ width: `${hpPct}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-[#d4c5a0] font-body whitespace-nowrap flex items-center gap-0.5">
                            <Heart size={8} className="text-[#e34d4d]" />{char.hp_current}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-[#9a8a6a] font-body">
                          <span className="flex items-center gap-0.5"><Shield size={8} />{char.ac}</span>
                          <span>Иниц. {init >= 0 ? '+' : ''}{init}</span>
                          <span className={cn('flex items-center gap-0.5 ml-auto', p.ready ? 'text-[#5eba7d]' : 'text-[#6a6050]')}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', p.ready ? 'bg-[#5eba7d]' : 'bg-[#6a6050]')} />
                            {p.ready ? 'Готов' : '—'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[10px] text-[#6a6050] mt-1">Персонаж не создан</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
