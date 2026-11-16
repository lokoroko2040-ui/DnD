import { useState } from 'react';
import { Search, Eye, Sparkles } from 'lucide-react';
import type { GameCharacter, InventoryItem, ItemSlot } from '@/types';
import { cn, rarityColor, rarityLabel, slotLabel, typeLabel } from '@/lib/utils';
import { CRTImage } from './CRTImage';
import { pollinationsItemUrl, pollinationsUrl } from '@/lib/image';
import { mod } from '@/data/dndRules';

interface InventoryScreenProps {
  character: GameCharacter;
  items: InventoryItem[];
  onEquip: (itemId: string) => void;
  onUnequip: (itemId: string) => void;
  onAttune: (itemId: string) => void;
  onIdentify: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}

const EQUIP_SLOTS: { key: ItemSlot; label: string; gridArea: string }[] = [
  { key: 'head', label: 'Голова', gridArea: '2 / 2 / 3 / 3' },
  { key: 'amulet', label: 'Амулет', gridArea: '2 / 3 / 3 / 4' },
  { key: 'armor', label: 'Доспех', gridArea: '3 / 2 / 4 / 3' },
  { key: 'main_hand', label: 'Правая рука', gridArea: '3 / 1 / 4 / 2' },
  { key: 'off_hand', label: 'Левая рука', gridArea: '3 / 3 / 4 / 4' },
  { key: 'gloves', label: 'Перчатки', gridArea: '4 / 1 / 5 / 2' },
  { key: 'boots', label: 'Сапоги', gridArea: '4 / 3 / 5 / 4' },
  { key: 'ring', label: 'Кольцо', gridArea: '4 / 2 / 5 / 3' },
];

export function InventoryScreen({
  character, items, onEquip, onUnequip, onAttune, onIdentify, onDelete,
}: InventoryScreenProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const equipped = items.filter(i => i.is_equipped);
  const backpack = items.filter(i => !i.is_equipped);
  const attunedCount = items.filter(i => i.is_attuned).length;
  const totalWeight = items.reduce((s, i) => s + (i.weight || 0), 0);

  function getEquipped(slot: ItemSlot): InventoryItem | undefined {
    return equipped.find(i => i.slot === slot);
  }

  function getACFromEquipment(): number {
    let ac = 10 + mod(character.stats.dex);
    const armor = getEquipped('armor');
    if (armor && armor.is_identified) {
      ac = 10 + mod(character.stats.dex) + (armor.ac_bonus || 0);
    }
    const shield = getEquipped('off_hand');
    if (shield && shield.is_identified && shield.ac_bonus > 0) {
      ac += shield.ac_bonus;
    }
    equipped.forEach(i => {
      if (i.slot !== 'armor' && i.slot !== 'off_hand' && i.is_identified) {
        ac += i.ac_bonus || 0;
      }
    });
    return ac;
  }

  const calculatedAC = getACFromEquipment();

  return (
    <div className="space-y-4">
      {/* Attunement indicator */}
      <div className="flex items-center justify-between border border-pip-greendark rounded px-3 py-2 bg-pip-bgdark/40">
        <span className="text-xs text-pip-amber uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={12} /> Настройка
        </span>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map(i => (
            <span key={i} className={cn('pip-led', i < attunedCount ? 'pip-led-amber' : 'pip-led-off')} />
          ))}
          <span className="text-xs text-pip-amber">{attunedCount}/3</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Left: Equipment doll */}
        <div>
          <div className="text-xs text-pip-greendim uppercase tracking-wider mb-2">Кукла персонажа</div>
          <div className="grid grid-cols-3 gap-2" style={{ gridTemplateRows: 'auto auto auto' }}>
            {EQUIP_SLOTS.map(slot => {
              const item = getEquipped(slot.key);
              return (
                <button
                  key={slot.key}
                  onClick={() => item && setSelectedItem(item)}
                  className={cn(
                    'border rounded p-2 min-h-[60px] text-center transition-all',
                    item ? 'border-pip-green bg-pip-green/5' : 'border-pip-greendark/50 bg-pip-bgdark/40'
                  )}
                >
                  <div className="text-[9px] text-pip-greendim uppercase mb-1">{slot.label}</div>
                  {item ? (
                    <div>
                      <div className={cn('text-[10px] truncate', item.is_identified ? rarityColor(item.rarity) : 'text-pip-amber')}>
                        {item.is_identified ? item.name : item.unidentified_name || '???'}
                      </div>
                      {item.is_magical && !item.is_identified && <div className="text-[8px] text-pip-amber animate-pulse">МАГИЯ</div>}
                    </div>
                  ) : (
                    <div className="text-[10px] text-pip-greendark">— пусто —</div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-pip-green text-center">
            AC (с экипировкой): <span className="text-glow text-pip-green">{calculatedAC}</span>
          </div>
        </div>

        {/* Right: Item scanner */}
        <div>
          <div className="text-xs text-pip-greendim uppercase tracking-wider mb-2 flex items-center gap-1">
            <Search size={12} /> Окно сканера предмета
          </div>
          {selectedItem ? (
            <div className="border border-pip-greendark rounded p-3 bg-pip-bgdark/60 animate-fade-in">
              <CRTImage
                src={pollinationsItemUrl(selectedItem.image_prompt || selectedItem.name + ' dark fantasy RPG item icon', selectedItem.name.length * 100)}
                alt={selectedItem.name}
                className="w-full h-32 rounded border border-pip-greendark mb-2"
              />
              <div className={cn('text-sm mb-1', selectedItem.is_identified ? rarityColor(selectedItem.rarity) : 'text-pip-amber')}>
                {selectedItem.is_identified ? selectedItem.name : selectedItem.unidentified_name || '[НЕОПОЗНАННЫЙ АРТЕФАКТ]'}
              </div>
              {!selectedItem.is_identified && (
                <div className="text-[10px] text-pip-amber animate-pulse mb-2">Фиксируется магический фон...</div>
              )}
              <div className="text-[10px] text-pip-greendim mb-1">
                {typeLabel(selectedItem.type)} | {slotLabel(selectedItem.slot)} | {rarityLabel(selectedItem.rarity)}
              </div>
              {selectedItem.is_identified ? (
                <>
                  {selectedItem.ac_bonus > 0 && <div className="text-[11px] text-pip-green">+{selectedItem.ac_bonus} AC</div>}
                  {selectedItem.attack_bonus > 0 && <div className="text-[11px] text-pip-green">+{selectedItem.attack_bonus} к атаке</div>}
                  {selectedItem.damage_dice && <div className="text-[11px] text-pip-amber">Урон: {selectedItem.damage_dice}</div>}
                  {selectedItem.is_magical && selectedItem.magical_properties && (
                    <div className="text-[11px] text-pip-cyan mt-1 border-t border-pip-greendark/30 pt-1">
                      <Sparkles size={10} className="inline mr-1" />{selectedItem.magical_properties}
                    </div>
                  )}
                  {selectedItem.description && <div className="text-[10px] text-pip-greendim mt-1">{selectedItem.description}</div>}
                </>
              ) : (
                <div className="space-y-1 mt-1">
                  <div className="text-[11px] text-pip-greendark">AC бонус: ???</div>
                  <div className="text-[11px] text-pip-greendark">Урон: ???</div>
                  <div className="text-[11px] text-pip-greendark">Свойства: ???</div>
                </div>
              )}
              <div className="text-[10px] text-pip-greendim mt-1">
                Вес: {selectedItem.weight} | Цена: {selectedItem.value_gp} зм
              </div>

              {/* Actions */}
              <div className="mt-2 space-y-1">
                {!selectedItem.is_identified && selectedItem.is_magical && (
                  <button onClick={() => onIdentify(selectedItem.id)} className="pip-btn active w-full text-xs py-1 rounded flex items-center justify-center gap-1">
                    <Eye size={12} /> Изучить на Коротком отдыхе
                  </button>
                )}
                {selectedItem.requires_attunement && !selectedItem.is_attuned && attunedCount < 3 && selectedItem.is_identified && (
                  <button onClick={() => onAttune(selectedItem.id)} className="pip-btn active w-full text-xs py-1 rounded flex items-center justify-center gap-1">
                    <Sparkles size={12} /> Настроиться
                  </button>
                )}
                {selectedItem.is_attuned && (
                  <button onClick={() => onAttune(selectedItem.id)} className="pip-btn w-full text-xs py-1 rounded">Отменить настройку</button>
                )}
                {selectedItem.is_equipped ? (
                  <button onClick={() => onUnequip(selectedItem.id)} className="pip-btn w-full text-xs py-1 rounded">Снять</button>
                ) : (
                  selectedItem.slot !== 'none' && <button onClick={() => onEquip(selectedItem.id)} className="pip-btn active w-full text-xs py-1 rounded">Надеть</button>
                )}
                <button onClick={() => { onDelete(selectedItem.id); setSelectedItem(null); }} className="pip-btn w-full text-xs py-1 rounded text-pip-red hover:text-pip-red">Выбросить</button>
              </div>
            </div>
          ) : (
            <div className="border border-pip-greendark/50 rounded p-6 bg-pip-bgdark/40 text-center">
              <div className="text-xs text-pip-greendark">Выберите предмет для сканирования</div>
              <div className="scan-sweep mt-4" style={{ position: 'relative', height: '2px' }} />
            </div>
          )}
        </div>
      </div>

      {/* Backpack list */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-pip-greendim uppercase tracking-wider">Рюкзак ({backpack.length})</span>
          <span className="text-[10px] text-pip-greendim">Общий вес: {totalWeight.toFixed(1)}</span>
        </div>
        {backpack.length === 0 ? (
          <div className="text-xs text-pip-greendark text-center py-4 border border-pip-greendark/30 rounded bg-pip-bgdark/30">
            Рюкзак пуст
          </div>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {backpack.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={cn(
                  'w-full border rounded px-2 py-1.5 text-left flex items-center gap-2 transition-all',
                  selectedItem?.id === item.id ? 'border-pip-green bg-pip-green/10' : 'border-pip-greendark/40 hover:border-pip-greendim bg-pip-bgdark/30'
                )}
              >
                <CRTImage
                  src={pollinationsItemUrl(item.image_prompt || item.name + ' dark fantasy RPG item', item.name.length * 50)}
                  alt={item.name}
                  className="w-10 h-10 rounded border border-pip-greendark/50 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className={cn('text-xs truncate', item.is_identified ? rarityColor(item.rarity) : 'text-pip-amber')}>
                    {item.is_identified ? item.name : item.unidentified_name || '[НЕОПОЗНАННЫЙ]'}
                  </div>
                  <div className="text-[9px] text-pip-greendim">
                    {typeLabel(item.type)} | {item.weight} фнт | {item.value_gp} зм
                  </div>
                </div>
                {item.is_magical && !item.is_identified && <span className="pip-led pip-led-amber" />}
                {item.is_attuned && <Sparkles size={10} className="text-pip-amber" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
