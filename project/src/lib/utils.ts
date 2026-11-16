export function uid(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function partyCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function rarityColor(rarity: string): string {
  switch (rarity) {
    case 'mundane': return 'rarity-mundane';
    case 'common': return 'rarity-common';
    case 'uncommon': return 'rarity-uncommon';
    case 'rare': return 'rarity-rare';
    case 'very_rare': return 'rarity-very-rare';
    case 'legendary': return 'rarity-legendary';
    default: return 'rarity-mundane';
  }
}

export function rarityLabel(rarity: string): string {
  switch (rarity) {
    case 'mundane': return 'Обычный';
    case 'common': return 'Общий';
    case 'uncommon': return 'Необычный';
    case 'rare': return 'Редкий';
    case 'very_rare': return 'Очень редкий';
    case 'legendary': return 'Легендарный';
    default: return rarity;
  }
}

export function slotLabel(slot: string): string {
  switch (slot) {
    case 'main_hand': return 'Правая рука';
    case 'off_hand': return 'Левая рука';
    case 'armor': return 'Доспех';
    case 'head': return 'Голова';
    case 'gloves': return 'Перчатки';
    case 'boots': return 'Сапоги';
    case 'amulet': return 'Амулет';
    case 'ring': return 'Кольцо';
    case 'none': return 'Рюкзак';
    default: return slot;
  }
}

export function typeLabel(type: string): string {
  switch (type) {
    case 'weapon': return 'Оружие';
    case 'armor': return 'Броня';
    case 'potion': return 'Зелье';
    case 'relic': return 'Реликвия';
    case 'misc': return 'Разное';
    default: return type;
  }
}

export function conditionColorClass(cond: string): string {
  const danger = ['Отравлен', 'Ослеплен', 'Оглушен', 'Сбит с ног', 'Ранен'];
  const warn = ['Очарован', 'Испуган', 'Истощён'];
  if (danger.includes(cond)) return 'text-danger';
  if (warn.includes(cond)) return 'text-amber';
  return 'text-emerald';
}
