// ============================================================
// ENUMS
// ============================================================

export enum ElementType {
  FIRE = 'FIRE',
  EARTH = 'EARTH',
  WIND = 'WIND',
  WATER = 'WATER',
  LIGHTNING = 'LIGHTNING',
  ICE = 'ICE',
  DARK = 'DARK',
  DIVINE = 'DIVINE',
  NEUTRAL = 'NEUTRAL'
}

export enum ItemRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
  HIDDEN = 'HIDDEN'
}

export enum ItemType {
  WEAPON = 'WEAPON',
  HELM = 'HELM',
  CHEST = 'CHEST',
  LEGS = 'LEGS',
  BOOTS = 'BOOTS',
  GLOVES = 'GLOVES',
  CAPE = 'CAPE',
  RING = 'RING',
  AMULET = 'AMULET',
  CONSUMABLE = 'CONSUMABLE',
  MATERIAL = 'MATERIAL',
  KEY_ITEM = 'KEY_ITEM',
  SKIN = 'SKIN'
}

export enum WeaponType {
  SWORD = 'SWORD',
  GREATSWORD = 'GREATSWORD',
  STAFF = 'STAFF',
  BOW = 'BOW',
  DAGGER = 'DAGGER'
}

export enum SkillType {
  ACTIVE = 'ACTIVE',
  PASSIVE = 'PASSIVE'
}

export enum QuestStatus {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum QuestType {
  MAIN = 'MAIN',
  SIDE = 'SIDE',
  FEDEX = 'FEDEX'
}

export enum ZoneStatus {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  CLEARED = 'CLEARED'
}

export enum EndingChoice {
  RESTORE = 'RESTORE',
  ERASE = 'ERASE'
}

// ============================================================
// STATS & ATTRIBUTES
// ============================================================

export interface Stats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  atk: number;
  def: number;
  spd: number;
  magicAtk: number;
  magicDef: number;
}

export interface Attributes {
  str: number;
  int: number;
  agi: number;
  vit: number;
  end: number;
}

export interface StatBonus {
  hp?: number;
  mana?: number;
  atk?: number;
  def?: number;
  spd?: number;
  magicAtk?: number;
  magicDef?: number;
  str?: number;
  int?: number;
  agi?: number;
  vit?: number;
  end?: number;
}

// ============================================================
// ITEMS
// ============================================================

export interface BaseItem {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  type: ItemType;
  icon: string;
  value: number;
  element?: ElementType;
  lore?: string;
}

export interface Weapon extends BaseItem {
  type: ItemType.WEAPON;
  weaponType: WeaponType;
  damage: number;
  magicDamage: number;
  bonusStats: StatBonus;
  attackSpeed: number;
  passiveEffect?: string;
}

export interface Armor extends BaseItem {
  type: ItemType.HELM | ItemType.CHEST | ItemType.LEGS | ItemType.BOOTS | ItemType.GLOVES | ItemType.CAPE;
  defense: number;
  magicDefense: number;
  bonusStats: StatBonus;
  passiveEffect?: string;
}

export interface Accessory extends BaseItem {
  type: ItemType.RING | ItemType.AMULET;
  bonusStats: StatBonus;
  passiveEffect?: string;
}

export interface ConsumableEffect {
  hpRestore?: number;
  manaRestore?: number;
  hpPercent?: number;
  manaPercent?: number;
  buffStat?: keyof StatBonus;
  buffAmount?: number;
  buffDuration?: number;
  revive?: boolean;
  statusCure?: boolean;
}

export interface Consumable extends BaseItem {
  type: ItemType.CONSUMABLE;
  effect: ConsumableEffect;
  stackable: true;
  maxStack: number;
}

export interface Material extends BaseItem {
  type: ItemType.MATERIAL;
  zone?: ElementType;
  stackable: true;
  maxStack: number;
}

export interface KeyItem extends BaseItem {
  type: ItemType.KEY_ITEM;
  questId?: string;
}

export interface Skin extends BaseItem {
  type: ItemType.SKIN;
  targetSlot: ItemType;
  visualKey: string;
  stackable: false;
}

export interface CraftRecipe {
  id: string;
  name: string;
  craftType: 'FORGE' | 'BREW' | 'TAILOR';
  resultItemId: string;
  resultQuantity: number;
  ingredients: { itemId: string; quantity: number }[];
  goldCost: number;
  levelRequired: number;
  zoneRequired?: ElementType;
  lore?: string;
}

export type Item = Weapon | Armor | Accessory | Consumable | Material | KeyItem | Skin;

// ============================================================
// EQUIPMENT
// ============================================================

export interface Equipment {
  weapon?: Weapon;
  helm?: Armor;
  chest?: Armor;
  legs?: Armor;
  boots?: Armor;
  gloves?: Armor;
  cape?: Armor;
  ring1?: Accessory;
  ring2?: Accessory;
  amulet?: Accessory;
  skins?: Partial<Record<string, string>>;
}

export interface InventorySlot {
  item: Item;
  quantity: number;
}

// ============================================================
// SKILLS
// ============================================================

export interface SkillEffect {
  heal?: number;
  healPercent?: number;
  shield?: number;
  dashEffect?: boolean;
  teleport?: boolean;
  aoe?: boolean;
  aoeRadius?: number;
  dot?: boolean;
  dotDamage?: number;
  dotDuration?: number;
  stun?: boolean;
  stunDuration?: number;
  slow?: boolean;
  slowAmount?: number;
  slowDuration?: number;
  chain?: number;
  knockback?: number;
  freeze?: boolean;
  freezeDuration?: number;
}

export interface SkillUnlockCondition {
  zoneCleared?: ElementType;
  level?: number;
  questCompleted?: string;
  hidden?: boolean;
  allZonesCleared?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: SkillType;
  element?: ElementType;
  manaCost: number;
  cooldown: number;
  damage?: number;
  magicDamage?: number;
  range?: number;
  castTime?: number;
  effect?: SkillEffect;
  unlockCondition?: SkillUnlockCondition;
  isDefault?: boolean;
  isHidden?: boolean;
  lore?: string;
}

export interface EquippedSkills {
  slot1: string | null;
  slot2: string | null;
  slot3: string | null;
  slot4: string | null;
}

// ============================================================
// ENEMIES
// ============================================================

export interface LootEntry {
  itemId: string;
  dropRate: number;
  minQty: number;
  maxQty: number;
}

export interface EnemyStats {
  baseHp: number;
  baseMana: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  baseMagicAtk: number;
  baseMagicDef: number;
}

export interface Enemy {
  id: string;
  name: string;
  description: string;
  sprite: string;
  zone: ElementType | 'NEUTRAL';
  baseLevel: number;
  stats: EnemyStats;
  element: ElementType;
  weakness?: ElementType;
  skills: string[];
  loot: LootEntry[];
  baseXp: number;
  baseGold: { min: number; max: number };
  isBoss: boolean;
  isElite: boolean;
  spawnWeight: number;
  aggroRange: number;
  attackRange: number;
  moveSpeed: number;
  lore?: string;
}

// ============================================================
// ZONES
// ============================================================

export interface Divine {
  id: string;
  name: string;
  title: string;
  element: ElementType;
  sprite: string;
  lore: string;
}

export interface Zone {
  id: string;
  name: string;
  description: string;
  element: ElementType;
  recommendedLevel: number;
  mapKey: string;
  enemies: string[];
  bossId: string;
  divine: Divine;
  unlockedSkills: string[];
  materials: string[];
  ambientColor: number;
  musicKey: string;
  lore: string;
  worldPosition: { x: number; y: number };
}

// ============================================================
// QUESTS
// ============================================================

export type QuestObjectiveType = 'KILL' | 'COLLECT' | 'DELIVER' | 'EXPLORE' | 'TALK' | 'BOSS';

export interface QuestObjective {
  id: string;
  description: string;
  type: QuestObjectiveType;
  targetId?: string;
  quantity?: number;
  current: number;
  completed: boolean;
}

export interface QuestReward {
  xp: number;
  gold: number;
  items?: { itemId: string; quantity: number }[];
  skillUnlock?: string;
}

export interface QuestUnlockCondition {
  level?: number;
  questsCompleted?: string[];
  zoneCleared?: ElementType;
  zonesCleared?: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  giverId?: string;
  objectives: QuestObjective[];
  rewards: QuestReward;
  prerequisites?: string[];
  unlockCondition?: QuestUnlockCondition;
  lore?: string;
  followupQuestId?: string;
  isHidden?: boolean;
}

// ============================================================
// NPCS & DIALOGUE
// ============================================================

export interface DialogueChoice {
  text: string;
  next: string;
  condition?: DialogueCondition;
}

export interface DialogueCondition {
  hasItem?: string;
  questStatus?: { id: string; status: QuestStatus };
  zoneCleared?: ElementType;
  level?: number;
  flag?: string;
}

export interface DialogueTrigger {
  startQuest?: string;
  completeQuest?: string;
  giveItem?: { itemId: string; quantity: number };
  setFlag?: string;
  teleport?: string;
}

export interface DialogueLine {
  id: string;
  speaker: string;
  text: string;
  portrait?: string;
  next?: string;
  choices?: DialogueChoice[];
  condition?: DialogueCondition;
  trigger?: DialogueTrigger;
}

export interface DialogueTree {
  rootId: string;
  lines: Record<string, DialogueLine>;
}

export interface NPC {
  id: string;
  name: string;
  sprite: string;
  portrait: string;
  location: string;
  dialogue: DialogueTree;
  shopItems?: string[];
  questIds?: string[];
  isHidden?: boolean;
}

// ============================================================
// PLAYER STATE
// ============================================================

export interface PlayerState {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  stats: Stats;
  attributes: Attributes;
  attributePoints: number;
  equipment: Equipment;
  inventory: InventorySlot[];
  gold: number;
  unlockedSkills: string[];
  equippedSkills: EquippedSkills;
  clearedZones: ElementType[];
  activeQuests: string[];
  completedQuests: string[];
  currentZone: string;
  position: { x: number; y: number };
  flags: Record<string, boolean>;
  playtime: number;
  deaths: number;
  totalKills: number;
  killsWithoutEpic: number;
  killsWithoutLegendary: number;
  isNewGamePlus: boolean;
  ngPlusCount: number;
}

// ============================================================
// WORLD STATE
// ============================================================

export interface WorldState {
  clearedZones: ElementType[];
  degradationLevel: number;
  malacharDefeated: boolean;
  endingChosen?: EndingChoice;
}

// ============================================================
// GAME STATE
// ============================================================

export interface GameState {
  player: PlayerState;
  world: WorldState;
  saveSlot: number;
  saveTimestamp: number;
  version: string;
}

// ============================================================
// COMBAT
// ============================================================

export interface StatusEffect {
  type: 'BURN' | 'POISON' | 'STUN' | 'SLOW' | 'FREEZE' | 'SHOCK';
  duration: number;
  strength: number;
  sourceSkillId?: string;
}

export interface ActiveEnemy {
  enemyId: string;
  instanceId: string;
  level: number;
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  stats: EnemyStats;
  element: ElementType;
  statusEffects: StatusEffect[];
  x: number;
  y: number;
  sprite?: Phaser.GameObjects.Sprite;
}

export interface DamageResult {
  damage: number;
  isCrit: boolean;
  element?: ElementType;
  isKill: boolean;
  statusApplied?: StatusEffect;
}

export interface CombatLog {
  timestamp: number;
  attacker: string;
  target: string;
  damage: number;
  isCrit: boolean;
  skillUsed?: string;
  isKill: boolean;
}

// ============================================================
// SAVE DATA
// ============================================================

export interface SaveData {
  version: string;
  timestamp: number;
  gameState: GameState;
  slot: number;
  playtime: number;
  playerName: string;
  level: number;
  clearedZones: number;
}

// ============================================================
// EVENTS
// ============================================================

export interface GameEvent {
  type: GameEventType;
  payload: unknown;
}

export type GameEventType =
  | 'LEVEL_UP'
  | 'ITEM_DROPPED'
  | 'QUEST_STARTED'
  | 'QUEST_COMPLETED'
  | 'ZONE_CLEARED'
  | 'BOSS_KILLED'
  | 'SKILL_UNLOCKED'
  | 'PLAYER_DIED'
  | 'GAME_SAVED'
  | 'ENDING_REACHED';

// ============================================================
// ELEMENTAL AFFINITY (weakness/resistance table)
// ============================================================

// NEUTRAL has no weakness (it is truly neutral).
// DARK is super-effective against every non-DARK element (handled in CombatSystem via DARK_MULTIPLIER).
export const ELEMENT_WEAKNESS: Partial<Record<ElementType, ElementType>> = {
  [ElementType.FIRE]: ElementType.WATER,
  [ElementType.WATER]: ElementType.LIGHTNING,
  [ElementType.LIGHTNING]: ElementType.EARTH,
  [ElementType.EARTH]: ElementType.WIND,
  [ElementType.WIND]: ElementType.ICE,
  [ElementType.ICE]: ElementType.FIRE,
  [ElementType.DARK]: ElementType.DIVINE,
};

export const DARK_MULTIPLIER = 1.5;
export const WEAKNESS_MULTIPLIER = 1.5;

export const RARITY_COLORS: Record<ItemRarity, string> = {
  [ItemRarity.COMMON]: '#b0b0b0',
  [ItemRarity.UNCOMMON]: '#4fc04f',
  [ItemRarity.RARE]: '#4f9fff',
  [ItemRarity.EPIC]: '#a04fff',
  [ItemRarity.LEGENDARY]: '#ffa04f',
  [ItemRarity.MYTHIC]: '#ff4f4f',
  [ItemRarity.HIDDEN]: '#ffd700',
};

export const RARITY_DROP_RATES: Record<ItemRarity, number> = {
  [ItemRarity.COMMON]: 0.600,
  [ItemRarity.UNCOMMON]: 0.250,
  [ItemRarity.RARE]: 0.100,
  [ItemRarity.EPIC]: 0.035,
  [ItemRarity.LEGENDARY]: 0.010,
  [ItemRarity.MYTHIC]: 0.004,
  [ItemRarity.HIDDEN]: 0.001,
};
