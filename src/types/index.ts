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
  DUAL_SWORD = 'DUAL_SWORD',
  GREATSWORD = 'GREATSWORD',
  DAGGER = 'DAGGER',
  DUAL_DAGGER = 'DUAL_DAGGER',
  AXE = 'AXE',
  HAMMER = 'HAMMER',
  STAFF = 'STAFF',
  BOW = 'BOW',
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

export enum TalentBranch {
  VIGOR = 'VIGOR',
  INSTINCT = 'INSTINCT',
  ARCANE = 'ARCANE',
  IGNIS = 'IGNIS',       // Voie de la Flamme — couleur UI #ff6600
  ZEPHYR = 'ZEPHYR',     // Voie du Vent — couleur UI #44ddaa
  ABYSSAL = 'ABYSSAL',   // Voie des Profondeurs — couleur UI #2244cc
  TERRA = 'TERRA',       // Voie du Roc — couleur UI #bb7733
  FULGURIS = 'FULGURIS', // Voie de l'Étincelle — couleur UI #ffdd22
  GLACIUS = 'GLACIUS',   // Voie de la Préservation — couleur UI #cceeff
  TENEBRES = 'TENEBRES', // Voie de la Magie Noire — NG+ uniquement — couleur UI #7700aa
}

export type TalentEffectKey =
  | 'MELEE_DMG_PCT' | 'DEF_PCT' | 'KILL_HEAL_PCT' | 'WINDUP_ARMOR'
  | 'HEAVY_FINISHER_BONUS' | 'LOW_HP_ATK_PCT' | 'HEAVY_CD_REDUCTION_PCT'
  | 'POST_FINISHER_BUFF'
  | 'CRIT_PCT' | 'MOVE_SPEED_PCT' | 'COMBO_GRACE_PCT' | 'DASH_PRESERVES_COMBO'
  | 'LIGHT_FINISHER_BLEED' | 'BOW_RANGE_DMG_PCT' | 'MAX_HP_PCT'
  | 'COMBO_STACK_DMG'
  | 'MAGIC_DMG_PCT' | 'MANA_COST_PCT' | 'SKILL_DMG_PCT' | 'STAFF_FINISHER_ZONE'
  | 'BOW_ELEMENTAL_ARROWS' | 'PROJECTILE_SKILL_PCT' | 'SHIELD_SKILL_PCT'
  | 'FINISHER_NOVA'
  // ── Génériques (branches élémentaires) ──────────────────────────────────────
  | 'ATK_PCT'              // % d'ATK globale (physique + magique)
  | 'ASPD_PCT'             // % de vitesse d'attaque
  | 'ELEM_BONUS_PCT'       // % bonus dégâts élémentaires (cumulé avec la substat homonyme)
  | 'MANA_MAX_PCT'         // % de mana max
  | 'MANA_REGEN_PCT'       // % du mana max régénéré / seconde hors combat
  | 'LIFESTEAL_PCT'        // % de lifesteal (attaques ET sorts)
  // ── IGNIS ────────────────────────────────────────────────────────────────────
  | 'BURN_CHANCE_PCT'      // % de chance d'infliger BURN sur coup de base
  | 'BURN_DMG_PCT'         // % bonus sur les ticks de BURN
  | 'ATK_PER_BURNING_PCT'  // % d'ATK par ennemi en feu à l'écran
  | 'LOW_HP_DEF_PCT'       // % de DEF sous 50% HP
  | 'MAGMA_GUARD'          // flag : absorbe 1 coup/combat (1 charge/zone)
  | 'BURN_ON_FINISHER'     // flag : finishers → BURN garanti 3s
  | 'BURNING_PACK_DMG_PCT' // % de dégâts si 3+ ennemis brûlent simultanément
  // ── ZEPHYR ───────────────────────────────────────────────────────────────────
  | 'DASH_CD_PCT'          // % de réduction du cooldown de dash
  | 'RANGED_CRIT_PCT'      // % de crit bonus sur cibles > 200px
  | 'DOUBLE_DASH'          // flag : 2e dash immédiat autorisé (CD 8s)
  | 'PROJECTILE_RANGE_PCT' // % de portée des projectiles
  | 'PROJECTILE_DMG_PCT'   // % de dégâts des projectiles
  | 'CYCLONE_FINISHER'     // flag : finisher → zone de vent qui repousse
  | 'DASH_DMG_PCT'         // % de dégâts infligés pendant un dash
  | 'AUTO_DODGE'           // flag : esquive automatique 1 attaque / 5s
  // ── ABYSSAL ──────────────────────────────────────────────────────────────────
  | 'SLOW_ON_HIT'          // flag : attaques → SLOW 20%, 2s
  | 'FREEZE_CHANCE_PCT'    // % de chance de FREEZE sur sort
  | 'AQUATIC_DEF_PCT'      // % de DEF en zone aquatique (Abyssmar, Glaciem)
  | 'FREEZE_ON_FINISHER'   // flag : finisher → FREEZE garanti 2s
  | 'MANA_ON_KILL_PCT'     // % du mana max restauré par kill
  | 'BURN_BLEED_IMMUNITY'  // flag : immunité BURN + BLEED
  // ── TERRA ────────────────────────────────────────────────────────────────────
  | 'KNOCKBACK_RES_PCT'    // % de réduction du knockback subi (cap 100 = immunité)
  | 'STAGGER_BONUS_PCT'    // % d'accumulation de jauge de stagger supplémentaire sur tous les coups
  | 'STUN_DMG_PCT'         // % de dégâts bonus contre les ennemis sous CC dur (stun/stagger plein/FREEZE)
  | 'RETALIATION_DEF_PCT'  // % de la DEF finale infligé en dégâts EARTH aux attaquants en mêlée
  | 'QUAKE_FINISHER'       // flag : finisher → onde de choc au sol (r100, 40% ATK EARTH, stagger ×2)
  | 'UNSHAKABLE'           // flag : immunité totale au knockback et à l'interruption de stagger
  | 'DEF_TO_ATK_PCT'       // % de la DEF finale ajouté à l'ATK en bonus plat
  // ── FULGURIS ─────────────────────────────────────────────────────────────────
  | 'SHOCK_CHANCE_PCT'     // % de chance d'infliger SHOCK (+10% dégâts subis, 3s) sur coup de base
  | 'CRIT_SURGE_ASPD_PCT'  // % de vitesse d'attaque après un critique (2s, refresh, no-stack)
  | 'ARC_CHANCE_PCT'       // % de chance qu'un coup arque vers l'ennemi le plus proche (≤120px)
  | 'STATIC_RETORT_PCT'    // % de chance d'émettre une nova électrique en subissant un coup (CD 1s)
  | 'CHAIN_FINISHER'       // flag : finisher → éclair en chaîne (3 ennemis max, LIGHTNING)
  | 'CRIT_ARC'             // flag : tout critique déclenche l'arc automatiquement (60% dégâts)
  // ── GLACIUS ──────────────────────────────────────────────────────────────────
  | 'DAMAGE_REDUCTION_PCT' // % de réduction de tous les dégâts subis (cap absolu 30)
  | 'STATUS_RES_DURATION_PCT' // % de réduction de la durée des debuffs subis (cap 60)
  | 'HEALING_RECEIVED_PCT' // % bonus sur tous les soins reçus
  | 'CHILL_AURA'           // flag : aura passive (r130) qui ralentit les ennemis proches (-10% vitesse/ASPD)
  | 'LAST_BASTION'         // flag : 1×/combat sous 30% HP → bouclier 25% HP max, 5s
  | 'GUARD_FINISHER'       // flag : finisher → bouclier 8% HP max, 3s
  | 'PRESERVED'            // flag : 1×/zone, un coup fatal laisse à 1 HP + 2s d'invulnérabilité
  // ── TENEBRES (NG+ uniquement) ────────────────────────────────────────────────
  | 'DARK_DMG_MULT'        // % de multiplicateur dégâts sombres
  | 'SOUL_STACK_BONUS'     // stacks Soul Echo bonus par zone cleared
  | 'VOID_CHANNEL'         // flag : sacrifie 15% HP au cast → sort +100%
  | 'DARK_BURN'            // flag : les BURN infligés deviennent des dégâts sombres
  | 'PHANTOM_STRIKE_PCT'   // % de chance de coup fantôme sans cooldown
  | 'SACRIFICE_FINISHER';  // flag : finisher consume 20% HP max → dégâts ×3

export interface TalentNode {
  id: string;
  name: string;
  description: string;
  branch: TalentBranch;
  tier: 1 | 2 | 3 | 4 | 5; // capstone = dernier tier (4 pour VIGOR/INSTINCT/ARCANE, 5 pour les branches élémentaires)
  cost: number;             // 1–3 (branches élémentaires : t1-2 = 1, t3 = 2, t4-5 = 3)
  icon: string;
  effects: Partial<Record<TalentEffectKey, number>>;
  lore?: string;
  requires?: string[];      // prérequis directs (AND) — IDs de nodes du tier précédent
  ngPlusOnly?: boolean;     // node visible mais verrouillé tant que player.isNewGamePlus === false
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
  equipStats?: EquipStats;
}

export interface Armor extends BaseItem {
  type: ItemType.HELM | ItemType.CHEST | ItemType.LEGS | ItemType.BOOTS | ItemType.GLOVES | ItemType.CAPE;
  defense: number;
  magicDefense: number;
  bonusStats: StatBonus;
  passiveEffect?: string;
  equipStats?: EquipStats;
}

export interface Accessory extends BaseItem {
  type: ItemType.RING | ItemType.AMULET;
  bonusStats: StatBonus;
  passiveEffect?: string;
  equipStats?: EquipStats;
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
  isProjectile?: boolean;
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

// Coarse quadrant used to bias an enemy's random spawn position within its zone map
// (3x3 grid: 4 corners, 4 edges, 1 center). Backs the Bestiary "roughly where it spawns"
// heatmap. See src/data/enemySpawnRegions.ts for the per-enemy assignment.
export type SpawnRegion = 'nw' | 'ne' | 'sw' | 'se' | 'center' | 'n' | 's' | 'e' | 'w';

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
  // ── Behavior system ────────────────────────────────────────────
  /** AI pattern for this enemy. Defaults to 'chaser' when absent. */
  behavior?: 'chaser' | 'patrol' | 'ranged' | 'charger' | 'summoner';
  /** Hex color of projectile (0xRRGGBB). Only used when behavior === 'ranged'. */
  projectileColor?: number;
  /** Patrol radius in pixels. Used when behavior === 'patrol'. */
  patrolRadius?: number;
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
  questProgress: Record<string, QuestObjective[]>;
  talentPoints: number;       // points disponibles à dépenser (1 par niveau, cap 20)
  unlockedTalents: string[];  // IDs des nœuds débloqués
  respecCount: number;        // nombre de respecs effectués
}

// ============================================================
// BESTIARY
// ============================================================

export interface BestiaryEntryState {
  discovered: boolean;     // true au premier contact (notification affichée)
  killed: boolean;         // true au premier kill (lore complet débloqué)
  kills: number;           // compteur de kills (pour révélation progressive des drops)
  revealedDrops: string[]; // itemIds des drops hidden révélés après premier loot
}

/** Pendant "Arsenal" du BestiaryEntryState — pas d'équivalent kill, l'équipement
 *  n'a qu'un état discovered/non-discovered (débloqué dès la première obtention). */
export interface ArsenalEntryState {
  discovered: boolean;
}

// ============================================================
// WORLD STATE
// ============================================================

export interface WorldState {
  clearedZones: ElementType[];
  degradationLevel: number;
  malacharDefeated: boolean;
  endingChosen?: EndingChoice;
  bestiary: Record<string, BestiaryEntryState>;
  arsenal: Record<string, ArsenalEntryState>;
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
  type: 'BURN' | 'POISON' | 'STUN' | 'SLOW' | 'FREEZE' | 'SHOCK' | 'BLEED' | 'EXPOSE';
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
  isElite?: boolean;
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
// EQUIPMENT STATS — main stat + substats (couche loot ARPG)
// ============================================================

/** Clés de stats portables par un équipement (main stat ou substat). */
export type SubstatKey =
  | 'ATK_FLAT' | 'ATK_PCT' | 'MATK_FLAT' | 'MATK_PCT'
  | 'DEF_FLAT' | 'DEF_PCT' | 'HP_FLAT'   | 'HP_PCT'
  | 'CRIT_RATE' | 'CRIT_DMG' | 'ASPD_PCT' | 'SPD_FLAT'
  | 'ELEM_BONUS_PCT' | 'MANA_FLAT' | 'LIFESTEAL_PCT';

export interface ItemSubstat {
  key: SubstatKey;
  value: number;          // valeur flat ou % selon la clé
  isPercentage?: boolean; // true si la valeur s'affiche avec %
}

export interface ItemMainStat {
  key: SubstatKey;
  value: number;
  isPercentage?: boolean;
}

/**
 * Stats d'équipement style ARPG (cf. docs/design/INSPIRATIONS.md §4).
 * - mainStat : la stat qui définit l'item, fixée par son type.
 *   • Arme : mainStat.value est le MIROIR de damage/magicDamage — ne jamais
 *     cumuler les deux dans un calcul (StatsSystem.computeAll fait foi).
 *   • Armure/accessoire : bonus d'identité ADDITIF — defense/magicDefense
 *     legacy restent appliqués séparément par ProgressionSystem.
 * - substats : 1 (COMMON) → 4 (EPIC+) bonus secondaires thématiques.
 */
export interface EquipStats {
  mainStat: ItemMainStat;
  substats: ItemSubstat[];
}

/** Nombre de substats attendu par rareté (validation data + futurs rolls). */
export const SUBSTAT_COUNT_BY_RARITY: Record<ItemRarity, number> = {
  [ItemRarity.COMMON]: 1,
  [ItemRarity.UNCOMMON]: 2,
  [ItemRarity.RARE]: 3,
  [ItemRarity.EPIC]: 4,
  [ItemRarity.LEGENDARY]: 4,
  [ItemRarity.MYTHIC]: 4,
  [ItemRarity.HIDDEN]: 0, // les HIDDEN portent un passif unique, pas de substats
};

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
  [ItemRarity.EPIC]: '#7722cc',
  [ItemRarity.LEGENDARY]: '#ffd700',
  [ItemRarity.MYTHIC]: '#ff4fc0',
  [ItemRarity.HIDDEN]: '#ff4f4f',
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
