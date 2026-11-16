import type { AbilityScore, Race, CharacterClass, Stats, Background } from '@/types';

export const ABILITY_SCORES: { key: AbilityScore; short: string; full: string }[] = [
  { key: 'str', short: 'СИЛ', full: 'Сила' },
  { key: 'dex', short: 'ЛОВ', full: 'Ловкость' },
  { key: 'con', short: 'ТЕЛ', full: 'Телосложение' },
  { key: 'int', short: 'ИНТ', full: 'Интеллект' },
  { key: 'wis', short: 'МДР', full: 'Мудрость' },
  { key: 'cha', short: 'ХАР', full: 'Харизма' },
];

export const ABILITY_INFO: Record<AbilityScore, { title: string; desc: string; skills: string[] }> = {
  str: {
    title: 'Сила (STR)',
    desc: 'Отвечает за физическую мощь, рукопашные атаки тяжёлым оружием и грузоподъёмность. Влияет на навык «Атлетика» и спасброски против сбивания с ног или захвата. Модификатор: (Значение − 10) / 2, округление вниз.',
    skills: ['Атлетика'],
  },
  dex: {
    title: 'Ловкость (DEX)',
    desc: 'Отвечает за реакцию, баланс и меткость. Добавляется к Классу Доспеха (КД) в лёгкой и средней броне, определяет Инициативу в бою, атаки дальнобойным и фехтовальным оружием.',
    skills: ['Акробатика', 'Ловкость рук', 'Скрытность'],
  },
  con: {
    title: 'Телосложение (CON)',
    desc: 'Определяет запас жизненных сил и выносливость. Модификатор Телосложения прибавляется к здоровью (HP) на каждом уровне. Используется для проверок Концентрации на заклинаниях при получении урона и сопротивления ядам и болезням.',
    skills: [],
  },
  int: {
    title: 'Интеллект (INT)',
    desc: 'Логика, память и образование. Основная характеристика для заклинаний Волшебника. Влияет на количество известных заклинаний.',
    skills: ['Магия', 'История', 'Расследование', 'Природа', 'Религия'],
  },
  wis: {
    title: 'Мудрость (WIS)',
    desc: 'Восприятие окружающего мира, интуиция и сила воли. Определяет Пассивную Внимательность (10 + мод. Восприятия). Влияет на заклинания Жреца, Друида и Следопыта.',
    skills: ['Восприятие', 'Проницательность', 'Медицина', 'Выживание', 'Уход за животными'],
  },
  cha: {
    title: 'Харизма (CHA)',
    desc: 'Сила личности, лидерство и красноречие. Основная характеристика для заклинаний Паладина, Барда, Колдуна и Чародея.',
    skills: ['Убеждение', 'Обман', 'Запугивание', 'Выступление'],
  },
};

// ─── All 18 Skills ─────────────────────────────────
export interface SkillInfo {
  name: string;
  ability: AbilityScore;
  desc: string;
}

export const SKILLS: SkillInfo[] = [
  { name: 'Акробатика', ability: 'dex', desc: 'Прыжки, кувырки, балансирование на узких поверхностях, уклонение от захвата.' },
  { name: 'Уход за животными', ability: 'wis', desc: 'Укрощение, дрессировка и взаимодействие с животными.' },
  { name: 'Магия', ability: 'int', desc: 'Знание магических традиций, формул и свойств артефактов.' },
  { name: 'Атлетика', ability: 'str', desc: 'Карабканье, плавание, прыжки в длину и высоту, преодоление физических препятствий.' },
  { name: 'Обман', ability: 'cha', desc: 'Убеждение других в неправде, блеф, сокрытие намерений.' },
  { name: 'История', ability: 'int', desc: 'Знание исторических событий, династий, войн и древних цивилизаций.' },
  { name: 'Проницательность', ability: 'wis', desc: 'Чтение эмоций, обнаружение лжи, понимание мотивов и намерений.' },
  { name: 'Запугивание', ability: 'cha', desc: 'Принуждение через страх или силу. Угрозы и демонстрация превосходства.' },
  { name: 'Расследование', ability: 'int', desc: 'Логический анализ улик, дедукция, разгадка механизмов и ловушек.' },
  { name: 'Медицина', ability: 'wis', desc: 'Диагностика болезней и ран, стабилизация умирающих, первая помощь.' },
  { name: 'Природа', ability: 'int', desc: 'Знание флоры, фауны, погоды, terrain и естественных циклов.' },
  { name: 'Восприятие', ability: 'wis', desc: 'Обнаружение скрытого: засады, тайники, подслушивание. Определяет пассивную внимательность.' },
  { name: 'Выступление', ability: 'cha', desc: 'Искусство развлечения: музыка, танец, ораторство, театр.' },
  { name: 'Убеждение', ability: 'cha', desc: 'Дипломатия, переговоры, влияние через аргументы и обаяние.' },
  { name: 'Религия', ability: 'int', desc: 'Знание богов, культов, священных символов и ритуалов.' },
  { name: 'Ловкость рук', ability: 'dex', desc: 'Фокусы, карманная кража, подбрасывание и сокрытие предметов.' },
  { name: 'Скрытность', ability: 'dex', desc: 'Бесшумное передвижение, прятки, избегание обнаружения.' },
  { name: 'Выживание', ability: 'wis', desc: 'Ориентирование, охота, чтение следов, поиск пищи и воды в дикой местности.' },
];

// ─── Conditions ───────────────────────────────────
export interface ConditionInfo {
  name: string;
  desc: string;
  color: 'danger' | 'warn' | 'success';
}

export const CONDITIONS: ConditionInfo[] = [
  { name: 'Отравлен', desc: 'Помеха на броски атаки и проверки характеристик. Урон ядом в начале каждого хода.', color: 'danger' },
  { name: 'Ослеплен', desc: 'Помеха на броски атаки. Атаки по вам с преимуществом. Не может видеть.', color: 'danger' },
  { name: 'Оглушен', desc: 'Не может двигаться или действовать. Скидывает действие. Атаки по вам с преимуществом.', color: 'danger' },
  { name: 'Сбит с ног', desc: 'Единственное действие — встать (половина скорости). Атаки ближнего боя по вам с преимуществом.', color: 'danger' },
  { name: 'Очарован', desc: 'Не может атаковать очаровавшего. Очаровавший получает преимущество на социальные проверки против вас.', color: 'warn' },
  { name: 'Испуган', desc: 'Помеха на проверки и броски атаки пока источник страха в поле зрения. Не может приближаться к источнику.', color: 'warn' },
  { name: 'Истощён', desc: 'Скорость уменьшена вдвое. Помеха на проверки характеристик. После боя может потребоваться отдых.', color: 'warn' },
  { name: 'Ранен', desc: 'Скорость уменьшена вдвое. Помеха на броски атаки и проверки характеристик, основанные на Силе и Ловкости.', color: 'danger' },
  { name: 'Благословлён', desc: 'Может добавить к4 к броскам атаки и спасброскам.', color: 'success' },
  { name: 'В ярости', desc: 'Преимущество на проверки Силы. Сопротивление дробящему, колющему и рубящему урону. Бонус к урону в ближнем бою.', color: 'success' },
  { name: 'Скрыт', desc: 'Невидим для врагов. Атаки имеют преимущество. Атаки против вас с помехой.', color: 'success' },
];

// ─── Races ────────────────────────────────────────
export interface RaceTrait { name: string; desc: string; }
export interface RaceData {
  name: Race;
  bonuses: Partial<Stats>;
  speed: number;
  darkvision: number;
  imagePrompt: string;
  description: string;
  lore: string;
  traits: RaceTrait[];
}

export const RACES: Record<Race, RaceData> = {
  'Человек': {
    name: 'Человек', bonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    speed: 30, darkvision: 0,
    imagePrompt: 'human adventurer portrait, Baldur\'s Gate 3 style, dark fantasy digital painting',
    description: 'Универсальная раса. Все характеристики +1.',
    lore: 'Люди — самая адаптивная и амбициозная раса. Короткая жизнь делает их нетерпеливыми и целеустремлёнными. Их общество варьируется от великих королевств до диких племён.',
    traits: [
      { name: 'Универсальность', desc: '+1 ко всем характеристикам.' },
      { name: 'Скорость', desc: 'Базовая скорость 30 футов.' },
      { name: 'Дополнительный язык', desc: 'Знает один дополнительный язык на выбор.' },
    ],
  },
  'Эльф': {
    name: 'Эльф', bonuses: { dex: 2 },
    speed: 30, darkvision: 60,
    imagePrompt: 'elf adventurer portrait, Baldur\'s Gate 3 style, ethereal fair features, dark fantasy digital painting',
    description: 'Ловкие и проницательные. +2 ЛОВ.',
    lore: 'Эльфы — долгоживущая раса, связанная с магией и природой. Их грация и острые чувства делают их превосходными разведчиками и стрелками.',
    traits: [
      { name: 'Ловкость эльфов', desc: '+2 к Ловкости.' },
      { name: 'Тёмное зрение', desc: 'Видит в темноте до 60 футов.' },
      { name: 'Острое чутьё', desc: 'Владение навыком Восприятие.' },
      { name: 'Наследие фей', desc: 'Преимущество против очарования. Не может быть усылён магией.' },
      { name: 'Транс', desc: 'Не спит, а погружается в медитацию 4 часа.' },
    ],
  },
  'Дварф': {
    name: 'Дварф', bonuses: { con: 2 },
    speed: 25, darkvision: 60,
    imagePrompt: 'dwarf warrior portrait, Baldur\'s Gate 3 style, stocky bearded, dark fantasy digital painting',
    description: 'Стойкие и выносливые. +2 ТЕЛ.',
    lore: 'Дварфы — крепкий народ гор и подземелий, мастера ремёсел и хранители древних традиций. Их стойкость легендарна.',
    traits: [
      { name: 'Стойкость дварфов', desc: '+2 к Телосложению.' },
      { name: 'Тёмное зрение', desc: 'Видит в темноте до 60 футов.' },
      { name: 'Дварфская устойчивость', desc: 'Преимущество против яда. Сопротивление урону ядом.' },
      { name: 'Скорость', desc: '25 футов — не снижается тяжёлой бронёй.' },
      { name: 'Боевая подготовка дварфов', desc: 'Владение боевым топором, ручным топором, лёгким молотом и молотом войны.' },
    ],
  },
  'Тифлинг': {
    name: 'Тифлинг', bonuses: { int: 1, cha: 2 },
    speed: 30, darkvision: 60,
    imagePrompt: 'tiefling adventurer portrait, Baldur\'s Gate 3 style, horns tail, dark fantasy digital painting',
    description: 'Потомки демонической крови. +2 ХАР, +1 ИНТ.',
    lore: 'Тифлинги несут на себе печать инфернального наследия — рога, хвост, следы серы. Их облик внушает страх, но многие стремятся доказать, что они больше, чем их происхождение.',
    traits: [
      { name: 'Инфернальное наследие', desc: '+2 Харизма, +1 Интеллект.' },
      { name: 'Тёмное зрение', desc: 'Видит в темноте до 60 футов.' },
      { name: 'Сопротивление адскому огню', desc: 'Сопротивление урону огнём.' },
      { name: 'Адское возмездие', desc: 'Заговор: может причинить 1d10 урона огнём при попадании по атакованному врагу.' },
      { name: 'Тёмное чутьё', desc: 'Владение навыком Тайна (обман).' },
    ],
  },
  'Полуорк': {
    name: 'Полуорк', bonuses: { str: 2, con: 1 },
    speed: 30, darkvision: 60,
    imagePrompt: 'half-orc warrior portrait, Baldur\'s Gate 3 style, tusks muscular, dark fantasy digital painting',
    description: 'Сильные и выносливые. +2 СИЛ, +1 ТЕЛ.',
    lore: 'Полуорки живут на грани двух миров — слишком дикие для людей, слишком мягкие для орков. Их сила и ярость в бою не знают равных.',
    traits: [
      { name: 'Дикая сила', desc: '+2 к Силе, +1 к Телосложению.' },
      { name: 'Тёмное зрение', desc: 'Видит в темноте до 60 футов.' },
      { name: 'Неистовая стойкость', desc: 'При снижении HP до 0 (но не мгновенной смерти) остаётся 1 HP. 1 раз на длинный отдых.' },
      { name: 'Угрожающий вид', desc: 'Владение навыком Запугивание.' },
      { name: 'Боевая подготовка', desc: 'Владение боевым топором, ручным топором и лёгким молотом.' },
    ],
  },
  'Полурослик': {
    name: 'Полурослик', bonuses: { dex: 2 },
    speed: 25, darkvision: 0,
    imagePrompt: 'halfling adventurer portrait, Baldur\'s Gate 3 style, small nimble, dark fantasy digital painting',
    description: 'Проворные и удачливые. +2 ЛОВ.',
    lore: 'Полурослики — малорослый, но отважный народ, ценящий уют, вкусную еду и хорошую компанию. Их врождённая удача спасала их бесчисленное множество раз.',
    traits: [
      { name: 'Удачливость', desc: 'При выпадении 1 на d20 можно перебросить.' },
      { name: 'Храбрость', desc: 'Преимущество против страха.' },
      { name: 'Проворство', desc: '+2 к Ловкости. Скорость 25 футов.' },
      { name: 'Незаметность', desc: 'Можно прятаться за существом крупнее вас.' },
    ],
  },
};

// ─── Backgrounds ──────────────────────────────────
export interface BackgroundData {
  name: Background;
  skills: string[];
  description: string;
  equipment: string[];
  feature: string;
}

export const BACKGROUNDS: Record<Background, BackgroundData> = {
  'Солдат': {
    name: 'Солдат',
    skills: ['Атлетика', 'Запугивание'],
    description: 'Вы служили в армии, сражались на фронте и знаете цену дисциплине.',
    equipment: ['Знак отличия', 'Трофей с павшего врага', 'Игральные кости', 'Комплект путешественника'],
    feature: 'Воинское звание: у вас есть знакомые военные, которые могут предоставить ночлег или помощь.',
  },
  'Преступник': {
    name: 'Преступник',
    skills: ['Обман', 'Скрытность'],
    description: 'Вы жили вне закона, промышляя кражами, афёрами или контрабандой.',
    equipment: ['Воровские инструменты', 'Тёмная одежда с капюшоном', 'Мешочек с монетами', 'Комплект путешественника'],
    feature: 'Криминальный контакт: у вас есть надёжный informer в преступном мире.',
  },
  'Мудрец': {
    name: 'Мудрец',
    skills: ['Магия', 'История'],
    description: 'Годы, проведённые за книгами и свитками, сделали вас ходячей библиотекой.',
    equipment: ['Бутылка чернил', 'Перо', 'Маленький нож', 'Письмо от коллеги', 'Комплект учёного'],
    feature: 'Исследователь: вы знаете, где искать информацию. Библиотеки и архивы — ваша стихия.',
  },
  'Аколит': {
    name: 'Аколит',
    skills: ['Проницательность', 'Религия'],
    description: 'Вы служили при храме, проводя ритуалы и наставляя верующих.',
    equipment: ['Святой символ', 'Молитвенник', 'Пять палочек благовоний', 'Комплект путешественника'],
    feature: 'Убежище храма: вас примут в любом храме вашей веры, накормят и дадут ночлег.',
  },
  'Народный герой': {
    name: 'Народный герой',
    skills: ['Уход за животными', 'Выживание'],
    description: 'Вы вышли из простого народа и всегда готовы встать на защиту обычных людей.',
    equipment: ['Ремесленные инструменты', 'Лопата', 'Железный котелок', 'Комплект путешественника'],
    feature: 'Деревенское гостеприимство: простые люди всегда приютят вас и укроют от опасности.',
  },
  'Шарлатан': {
    name: 'Шарлатан',
    skills: ['Обман', 'Ловкость рук'],
    description: 'Вы жили обманом и фокусами, играя на доверии и жадности людей.',
    equipment: ['Комплект для фокусов', 'Изящная одежда', 'Поддельные документы', 'Комплект путешественника'],
    feature: 'Фальшивая репутация: вы умеете создавать себе новую личность и подделывать документы.',
  },
};

// ─── Classes ──────────────────────────────────────
export interface ClassFeature { name: string; level: number; desc: string; }
export interface ClassData {
  name: CharacterClass;
  hitDie: number;
  primaryAbility: AbilityScore;
  savingThrows: AbilityScore[];
  imagePrompt: string;
  description: string;
  lore: string;
  armorProf: string;
  weaponProf: string;
  skillChoices: string[];
  skillCount: number;
  level1Features: ClassFeature[];
  spellcaster: boolean;
  spellSlotsLevel1?: Record<string, number>;
  cantripsKnown?: number;
  spellsKnownLevel1?: number;
}

export const CLASSES: Record<CharacterClass, ClassData> = {
  'Воин': {
    name: 'Воин', hitDie: 10, primaryAbility: 'str', savingThrows: ['str', 'con'],
    imagePrompt: 'fighter knight in plate armor, Baldur\'s Gate 3 style, dark fantasy digital painting',
    description: 'Мастер оружия и брони. Высокий запас HP, боевые стили и_regenerative способности.',
    lore: 'Воины — профессиональные солдаты, гладиаторы и телохранители. Их мастерство с оружием не имеет равных, а закалённое тело выдерживает удары, которые убили бы мага.',
    armorProf: 'Вся броня, щиты', weaponProf: 'Простое и воинское оружие',
    skillChoices: ['Акробатика', 'Уход за животными', 'Атлетика', 'История', 'Проницательность', 'Запугивание', 'Расследование', 'Восприятие', 'Выживание'],
    skillCount: 2,
    level1Features: [
      { name: 'Боевой стиль', level: 1, desc: 'Выберите боевой стиль: Стрельба (+2 к броскам атаки дальнобойным оружием), Защита (+1 КД при ношении брони), Двуручное оружие (+2 к урону при использовании оружия в двух руках), Фехтование (+2 к броску атаки при использовании одного оружия в одной руке), или Дуэлянт.' },
      { name: 'Второе дыхание', level: 1, desc: 'Бонусное действие: восстановите 1d10 + уровень HP. 1 раз на короткий/длинный отдых.' },
      { name: 'Лечение без магии', level: 1, desc: 'В начале хода восстанавливаете 1 HP, если HP > 0. Удвоить за короткий отдых.' },
    ],
    spellcaster: false,
  },
  'Плут': {
    name: 'Плут', hitDie: 8, primaryAbility: 'dex', savingThrows: ['dex', 'int'],
    imagePrompt: 'rogue thief hooded with daggers, Baldur\'s Gate 3 style, dark fantasy digital painting',
    description: 'Мастер скрытности, ловкости и скрытых атак. Наносит огромный урон из тени.',
    lore: 'Плуты — воры, шпионы, ассасины и авантюристы. Они полагаются на хитрость, ловкость и точные удары, а не на грубую силу.',
    armorProf: 'Лёгкая броня', weaponProf: 'Простое оружие, рапиры, короткие мечи, длинные луки, ручные арбалеты',
    skillChoices: ['Акробатика', 'Атлетика', 'Обман', 'Проницательность', 'Запугивание', 'Расследование', 'Восприятие', 'Выступление', 'Убеждение', 'Ловкость рук', 'Скрытность'],
    skillCount: 4,
    level1Features: [
      { name: 'Экспертиза', level: 1, desc: 'Удвоенный бонус мастерства к двум выбранным навыкам (или одному навыку и воровским инструментам).' },
      { name: 'Скрытая атака (Sneak Attack)', level: 1, desc: 'Один раз за ход, если у вас преимущество на атаку или рядом есть союзник, добавляете 1d6 к урону. Урон растёт с уровнем.' },
      { name: 'Воровской жаргон', level: 1, desc: 'Тайный язык воров. Можете общаться скрытно с другими плутами.' },
    ],
    spellcaster: false,
  },
  'Волшебник': {
    name: 'Волшебник', hitDie: 6, primaryAbility: 'int', savingThrows: ['int', 'wis'],
    imagePrompt: 'wizard mage with spellbook and staff, Baldur\'s Gate 3 style, dark fantasy digital painting',
    description: 'Повелитель тайной магии. Учит заклинания из книги, самый широкий выбор заклинаний.',
    lore: 'Волшебники годами изучают магию по книгам и свиткам. Их сила — в знании: они могут выучить любое заклинание из своей школы магии.',
    armorProf: 'Нет', weaponProf: 'Кинжалы, дротики, пращи, посохи, лёгкие арбалеты',
    skillChoices: ['Магия', 'История', 'Проницательность', 'Расследование', 'Медицина', 'Религия'],
    skillCount: 2,
    level1Features: [
      { name: 'Тайная магия', level: 1, desc: 'Заклинания из книги заклинаний. Можно копировать новые заклинания из свитков.' },
      { name: 'Восстановление магии', level: 1, desc: 'При коротком отдыхе можете восстановить ячейки заклинаний (уровень равен половине волшебника).' },
      { name: 'Ритуальное колдовство', level: 1, desc: 'Может накладывать заклинания с меткой «ритуал» как ритуал (без траты ячейки).' },
    ],
    spellcaster: true, spellSlotsLevel1: { '1': 2 }, cantripsKnown: 3, spellsKnownLevel1: 6,
  },
  'Жрец': {
    name: 'Жрец', hitDie: 8, primaryAbility: 'wis', savingThrows: ['wis', 'cha'],
    imagePrompt: 'cleric priest with holy symbol and mace, Baldur\'s Gate 3 style, dark fantasy digital painting',
    description: 'Слуга божеств. Лечение, поддержка и божественная магия. Сила воли и веры.',
    lore: 'Жрецы получают силу от своих божеств. Они — целители, наставники и воины веры, чьи молитвы способны как спасти жизнь, так и покарать врагов.',
    armorProf: 'Лёгкая и средняя броня, щиты', weaponProf: 'Простое оружие',
    skillChoices: ['История', 'Проницательность', 'Медицина', 'Религия', 'Убеждение'],
    skillCount: 2,
    level1Features: [
      { name: 'Божественная магия', level: 1, desc: 'Заклинания от божества. Подготовка заклинаний из списка жреца (мудрость + уровень).' },
      { name: 'Изгнание нежити', level: 1, desc: 'Может изгонять или обращать нежить. Спасбросок Мудрости Сл = 10 + бонус мастерства + мод. Мудрости.' },
      { name: 'Святой символ', level: 1, desc: 'Святой символ как фокус для заклинаний. Носится на щите или амулете.' },
    ],
    spellcaster: true, spellSlotsLevel1: { '1': 2 }, cantripsKnown: 3,
  },
  'Паладин': {
    name: 'Паладин', hitDie: 10, primaryAbility: 'str', savingThrows: ['wis', 'cha'],
    imagePrompt: 'paladin holy warrior with shield and sword, Baldur\'s Gate 3 style, dark fantasy digital painting',
    description: 'Святой воин, связанный священной клятвой. Мощный боец и целитель одновременно.',
    lore: 'Паладины — воины веры, чьи клятвы наделяют их божественной силой. Они стоят на страже добра, карая зло и защищая невинных.',
    armorProf: 'Вся броня, щиты', weaponProf: 'Простое и воинское оружие',
    skillChoices: ['Атлетика', 'Проницательность', 'Запугивание', 'Медицина', 'Убеждение', 'Религия'],
    skillCount: 2,
    level1Features: [
      { name: 'Божественное чувство', level: 1, desc: 'Действием можно обнаружить нежить, фей и демонов в пределах 60 футов. Расходует ячейку.' },
      { name: 'Наложение рук', level: 1, desc: 'Действием касаетесь существа и восстанавливаете HP в размере 5 × уровень паладина. Лечит одну болезнь или яд. 1 раз на длинный отдых.' },
      { name: 'Боевой стиль', level: 1, desc: 'Выберите боевой стиль: Защита, Дуэлянт, Великий бой или Защитник.' },
    ],
    spellcaster: false,
  },
  'Следопыт': {
    name: 'Следопыт', hitDie: 10, primaryAbility: 'dex', savingThrows: ['str', 'dex'],
    imagePrompt: 'ranger archer hooded with bow, Baldur\'s Gate 3 style, dark fantasy digital painting',
    description: 'Охотник на границах цивилизации. Лук, ловкость и знание дикой природы.',
    lore: 'Следопыты — стражи диких земель, разведчики и охотники. Они одинаково комфортно чувствуют себя в лесу и в городе, а их стрелы всегда находят цель.',
    armorProf: 'Лёгкая и средняя броня, щиты', weaponProf: 'Простое и воинское оружие',
    skillChoices: ['Уход за животными', 'Атлетика', 'Проницательность', 'Расследование', 'Природа', 'Восприятие', 'Скрытность', 'Выживание'],
    skillCount: 3,
    level1Features: [
      { name: 'Избранный враг', level: 1, desc: 'Выберите тип врагов (аберрации, драконы, гиганты и т.д.). Преимущество на проверки Восприятия и Выживания против них. +2 к урону.' },
      { name: 'Следопыт-исследователь', level: 1, desc: 'Можете передвигаться в труднопроходимой местности без снижения скорости. Не теряете ориентацию.' },
      { name: 'Боевой стиль', level: 1, desc: 'Выберите боевой стиль: Стрельба или Защита.' },
    ],
    spellcaster: false,
  },
  'Варвар': {
    name: 'Варвар', hitDie: 12, primaryAbility: 'str', savingThrows: ['str', 'con'],
    imagePrompt: 'barbarian berserker with fur and great axe, Baldur\'s Gate 3 style, dark fantasy digital painting',
    description: 'Дикий воин, сражающийся в ярости. Высочайший запас HP и сопротивление урону.',
    lore: 'Варвары — ярость, облечённая в плоть. Их боевой клич заставляет врагов дрожать, а удары пробивают каменные стены. В бою они не знают страха и боли.',
    armorProf: 'Лёгкая и средняя броня, щиты', weaponProf: 'Простое и воинское оружие',
    skillChoices: ['Уход за животными', 'Атлетика', 'Запугивание', 'Природа', 'Восприятие', 'Выживание'],
    skillCount: 2,
    level1Features: [
      { name: 'Ярость', level: 1, desc: 'Бонусное действие: входите в ярость. Преимущество на проверки Силы. Сопротивление дробящему/колющему/рубящему урону. +2 к урону в ближнем бою. Длится 1 минута. 2 раза на длинный отдых.' },
      { name: 'Защита без доспехов', level: 1, desc: 'Без брони: КД = 10 + мод. Ловкости + мод. Телосложения.' },
    ],
    spellcaster: false,
  },
  'Бард': {
    name: 'Бард', hitDie: 8, primaryAbility: 'cha', savingThrows: ['dex', 'cha'],
    imagePrompt: 'bard musician with lute and rapier, Baldur\'s Gate 3 style, dark fantasy digital painting',
    description: 'Мастер песен и магии. Поддержка союзников, обаяние и универсальность.',
    lore: 'Барды — странствующие музыканты, сказители и маги слова. Их песни вдохновляют союзников и проклинают врагов, а их обаяние открывает любые двери.',
    armorProf: 'Лёгкая броня', weaponProf: 'Простое оружие, рапиры, длинные мечи, короткие мечи, ручные арбалеты',
    skillChoices: ['Все навыки на выбор'],
    skillCount: 3,
    level1Features: [
      { name: 'Бардовская магия', level: 1, desc: 'Заклинания, основанные на Харизме. Заклинания известны (не подготовляются).' },
      { name: 'Вдохновение барда', level: 1, desc: 'Бонусное действие: союзник может добавить к4 к одному броску. 1 раз на короткий/длинный отдых (на 1 уровне).' },
      { name: 'Мастер на все руки', level: 1, desc: 'Половина бонуса мастерства (округление вниз) ко всем навыки, в которых нет владения.' },
    ],
    spellcaster: true, spellSlotsLevel1: { '1': 2 }, cantripsKnown: 2, spellsKnownLevel1: 4,
  },
  'Колдун': {
    name: 'Колдун', hitDie: 8, primaryAbility: 'cha', savingThrows: ['wis', 'cha'],
    imagePrompt: 'warlock with eldritch blast, Baldur\'s Gate 3 style, dark fantasy digital painting',
    description: 'Заклинатель, заключивший пакт с могущественным существом. Ограниченные, но мощные заклинания.',
    lore: 'Колдуны получают свою магию от сделки с потусторонним покровителем — демоном, феей или Великим Древним. Их сила растёт по мере углубления пакта.',
    armorProf: 'Лёгкая броня', weaponProf: 'Простое оружие',
    skillChoices: ['Магия', 'Обман', 'История', 'Запугивание', 'Расследование', 'Природа', 'Религия'],
    skillCount: 2,
    level1Features: [
      { name: 'Пакт с покровителем', level: 1, desc: 'Выберите покровителя: Архифея (обман и иллюзии), Демон (огонь и разрушение) или Великий Древний (космический ужас).' },
      { name: 'Магия пакта', level: 1, desc: 'Заклинания от покровителя. Все ячейки одного уровня. Короткий отдых восстанавливает ячейки.' },
    ],
    spellcaster: true, spellSlotsLevel1: { '1': 1 }, cantripsKnown: 2, spellsKnownLevel1: 2,
  },
};

// ─── Combat mechanics info ────────────────────────
export const COMBAT_INFO = {
  ac: { title: 'Класс Доспеха (КД / AC)', desc: 'Сколько нужно выбросить врагу на d20 + бонус атаки, чтобы пробить вашу защиту. Базовый КД без брони = 10 + мод. Ловкости. Броня добавляет свой бонус.' },
  profBonus: { title: 'Бонус Мастерства', desc: 'Отражает общую опытность героя (на 1–4 уровнях равен +2). Прибавляется к броскам атаки оружием, которым вы владеете, а также к выбранным навыкам, спасброскам и сложности ваших заклинаний.' },
  spellDC: { title: 'Сложность Заклинаний (Spell Save DC)', desc: 'Равна 8 + Бонус Мастерства + модификатор базовой заклинательной характеристики. Враг должен выбросить спасбросок не ниже этого значения, чтобы resisted.' },
  advantage: { title: 'Преимущество и Помеха', desc: 'Бросок двух костей d20 вместо одной — при Преимуществе выбирается наибольший результат, при Помехе — наименьший.' },
  shortRest: { title: 'Короткий отдых (1 час)', desc: 'Позволяет потратить Кости Хитов для лечения. Можно опознать магические артефакты. Некоторые способности восстанавливаются.' },
  longRest: { title: 'Длинный отдых (8 часов)', desc: 'Полностью восстанавливает HP и ячейки заклинаний. Восстанавливает Кости Хитов (половину от максимума). Снимает大部分 состояния.' },
  initiative: { title: 'Инициатива', desc: 'Определяет очерёдность ходов в бою. Бросок d20 + мод. Ловкости. Самый высокий ходит первым.' },
  hitDice: { title: 'Кости Хитов', desc: 'Используются для лечения во время короткого отдыха. Количество костей = уровню персонажа. Кость определяется классом: d6 (Волшебник), d8 (Плут/Жрец/Бард/Колдун), d10 (Воин/Паладин/Следопыт), d12 (Варвар).' },
  passivePerception: { title: 'Пассивная Внимательность', desc: 'Равна 10 + мод. Восприятия + бонус мастерства (если есть). Используется Мастером для определения, замечаете ли вы скрытые объекты без броска.' },
};

// ─── Stat calculation helpers ─────────────────────
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
export const POINT_BUY_TOTAL = 27;
export const POINT_BUY_COST: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

export function mod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function modStr(score: number): string {
  const m = mod(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

export function calcHP(cls: CharacterClass, con: number, level: number = 1): number {
  const hitDie = CLASSES[cls].hitDie;
  const conMod = mod(con);
  if (level === 1) return hitDie + conMod;
  let hp = hitDie + conMod;
  for (let i = 2; i <= level; i++) {
    hp += Math.ceil(hitDie / 2) + conMod;
  }
  return Math.max(1, hp);
}

export function calcAC(stats: Stats, armorBonus: number = 0): number {
  return 10 + mod(stats.dex) + armorBonus;
}

export function calcInitiative(stats: Stats): number {
  return mod(stats.dex);
}

export function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export function spellSaveDC(level: number, primaryStat: number): number {
  return 8 + proficiencyBonus(level) + mod(primaryStat);
}

export function rollStat(): number {
  const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  rolls.sort((a, b) => b - a);
  return rolls.slice(0, 3).reduce((s, v) => s + v, 0);
}

export function applyRaceBonuses(stats: Stats, race: Race): Stats {
  const bonuses = RACES[race].bonuses;
  return {
    str: stats.str + (bonuses.str || 0),
    dex: stats.dex + (bonuses.dex || 0),
    con: stats.con + (bonuses.con || 0),
    int: stats.int + (bonuses.int || 0),
    wis: stats.wis + (bonuses.wis || 0),
    cha: stats.cha + (bonuses.cha || 0),
  };
}

export function getStartingHP(cls: CharacterClass, finalStats: Stats): number {
  return calcHP(cls, finalStats.con, 1);
}

export function getStartingAC(finalStats: Stats): number {
  return 10 + mod(finalStats.dex);
}

export function xpForLevel(level: number): number {
  const table = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000];
  return table[Math.min(level, table.length - 1)] || 0;
}

export function levelFromXP(xp: number): number {
  const table = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 100000];
  let lvl = 1;
  for (let i = 0; i < table.length; i++) {
    if (xp >= table[i]) lvl = i + 1;
  }
  return Math.min(lvl, 20);
}

export function getSkillMod(skillName: string, stats: Stats, level: number, proficientSkills: string[]): number {
  const skill = SKILLS.find(s => s.name === skillName);
  if (!skill) return 0;
  const base = mod(stats[skill.ability]);
  if (proficientSkills.includes(skillName)) return base + proficiencyBonus(level);
  return base;
}
