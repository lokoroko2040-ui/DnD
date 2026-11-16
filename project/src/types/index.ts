export type AbilityScore = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type Stats = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
};

export type Race = 'Человек' | 'Эльф' | 'Дварф' | 'Тифлинг' | 'Полуорк' | 'Полурослик';
export type CharacterClass = 'Воин' | 'Плут' | 'Волшебник' | 'Жрец' | 'Паладин' | 'Следопыт' | 'Варвар' | 'Бард' | 'Колдун';

export type Background = 'Солдат' | 'Преступник' | 'Мудрец' | 'Аколит' | 'Народный герой' | 'Шарлатан';

export type ItemSlot = 'main_hand' | 'off_hand' | 'armor' | 'head' | 'gloves' | 'boots' | 'amulet' | 'ring' | 'none';
export type ItemType = 'weapon' | 'armor' | 'potion' | 'relic' | 'misc';
export type Rarity = 'mundane' | 'common' | 'uncommon' | 'rare';

export interface InventoryItem {
  id: string;
  character_id: string;
  name: string;
  unidentified_name: string | null;
  type: ItemType;
  slot: ItemSlot;
  rarity: Rarity;
  is_magical: boolean;
  is_identified: boolean;
  requires_attunement: boolean;
  is_attuned: boolean;
  is_equipped: boolean;
  ac_bonus: number;
  attack_bonus: number;
  damage_dice: string | null;
  weight: number;
  value_gp: number;
  description: string | null;
  magical_properties: string | null;
  image_prompt: string | null;
}

export interface GameCharacter {
  id: string;
  player_id: string;
  party_id: string;
  name: string;
  race: Race;
  class: CharacterClass;
  background: string | null;
  level: number;
  xp: number;
  stats: Stats;
  hp_current: number;
  hp_max: number;
  ac: number;
  gold: number;
  conditions: string[];
  spell_slots: Record<string, number>;
  hit_dice: { total: number; current: number };
  portrait_url: string | null;
  portrait_prompt: string | null;
  appearance: string | null;
}

export interface Player {
  id: string;
  party_id: string;
  name: string;
  is_host: boolean;
  ready: boolean;
  round_action: string;
  last_roll: RollResult | null;
}

export interface Party {
  id: string;
  code: string;
  name: string;
  host_player_id: string | null;
  campaign_id: string;
  campaign_intro: string | null;
  current_narrative: string | null;
  current_location: string | null;
  current_image_prompt: string | null;
  round_number: number;
  quest_log: string;
  round_resolving: boolean;
}

export interface RollResult {
  die: number;
  result: number;
  rolls: number[];
  modifier: number;
  total: number;
  advantage: 'normal' | 'advantage' | 'disadvantage';
  label: string;
  dc: number | null;
  outcome: 'success' | 'failure' | 'critical_success' | 'critical_failure' | null;
}

export interface RequestedRoll {
  player_id: string;
  character_name: string;
  type: 'skill_check' | 'saving_throw' | 'attack_roll';
  ability: string;
  dc: number;
  reason: string;
}

export interface StateUpdate {
  player_id: string;
  hp_change: number;
  xp_gain: number;
  gold_change: number;
  conditions_add: string[];
  conditions_remove: string[];
  inventory_add: InventoryItemDraft[];
  inventory_remove: string[];
}

export interface InventoryItemDraft {
  name: string;
  unidentified_name: string;
  type: ItemType;
  slot: ItemSlot;
  rarity: Rarity;
  is_magical: boolean;
  is_identified: boolean;
  requires_attunement: boolean;
  ac_bonus: number;
  attack_bonus: number;
  damage_dice: string;
  weight: number;
  value_gp: number;
  description: string;
  magical_properties: string;
  image_prompt: string;
}

export interface AIResponse {
  narrative: string;
  location_name: string;
  image_prompt: string;
  requested_rolls: RequestedRoll[];
  state_updates: StateUpdate[];
  quest_log_update: string;
}

export interface GameLogEntry {
  id: string;
  party_id: string;
  round_number: number;
  type: 'narrative' | 'system' | 'roll' | 'loot';
  content: string;
  created_at: string;
}

export type TabKey = 'scene' | 'character' | 'inventory' | 'spells' | 'quests' | 'builder' | 'host';
