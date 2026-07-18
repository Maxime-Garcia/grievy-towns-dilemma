import Phaser from 'phaser';
import { GameState, ActiveEnemy, ElementType, Enemy, WeaponType, ItemRarity, ItemType, Equipment, Item, StatusEffect, RunState } from '../types';
import { CombatSystem } from '../systems/CombatSystem';
import { StatsSystem } from '../systems/StatsSystem';
import { PassiveSystem, SameTargetStackState, CritCdResetState } from '../systems/PassiveSystem';
import { COMBO_CONFIGS, ComboConfig } from '../data/combos';
import {
  ATTACK_PATTERNS, FISTS_PATTERN, AttackPattern, AttackHit,
  effectiveWindupMs, effectiveHitDelayMs, effectiveCooldownMs,
} from '../data/attackPatterns';
import { TalentSystem, TalentModifiers } from '../systems/TalentSystem';
import { LootSystem, PITY_THRESHOLDS } from '../systems/LootSystem';
import { StatRollSystem } from '../systems/StatRollSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { SkillSystem } from '../systems/SkillSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { SaveSystem } from '../systems/SaveSystem';
import { ENEMY_MAP } from '../data/enemies';
import { elitePromotionAt, depthOfZone } from '../data/enemyScaling';
import { ENEMY_SPAWN_REGIONS } from '../data/enemySpawnRegions';
import { getSpawnRegionRect, pickSpawnRegion } from '../systems/SpawnRegionSystem';
import { ZONE_MAP } from '../data/zones';
import {
  PATTERNS,
  resolvePattern,
  getEnemyPatternAssignment,
  type AttackPatternId,
} from '../data/enemyPatterns';
import { NPC_MAP } from '../data/npcs';
import { getZoneLayout, ZoneLayout, LootableObject, WaterArea, PitArea } from '../data/zoneMaps';
import { generateZoneLayout, GeneratedMap, DEFAULT_IGNIS_PARAMS } from '../systems/MapGenSystem';
import { RunSystem } from '../systems/RunSystem';
import { RunBagSystem } from '../systems/RunBagSystem';
import { ALL_ITEMS } from '../data/items';
import { loadBindings, KeyBindings } from '../data/keybindings';
import { keyIconFrame, keyCodeLabel } from '../utils/KeyIcons';
import { uiStyle, FONT, FONT_HUD, UI, snapFontSize } from '../utils/UITheme';
import { t, localizeItem } from '../i18n';
import { BestiarySystem } from '../systems/BestiarySystem';
import { ArsenalSystem, ARSENAL_ITEM_TYPES } from '../systems/ArsenalSystem';
import { getBestiaryEntry } from '../data/bestiary';
import type { BestiaryScene } from './BestiaryScene';
import type { ArsenalScene } from './ArsenalScene';
import type { InventoryScene } from './InventoryScene';
import type { SkillScene } from './SkillScene';
import type { PityScene } from './PityScene';
import type { RunBagScene } from './RunBagScene';
import { ENEMY_SPRITE_BBOX, NPC_SPRITE_BBOX, PLAYER_SPRITE_BBOX } from '../data/spriteGeometry';
import { fitSpriteToContent } from '../utils/SpriteFit';
import {
  enemyIdsForZone,
  queueEnemySprites,
  registerEnemyAnimations,
  ensureEnemyAssets,
} from '../utils/EnemyAssets';

/**
 * Bascule maître des touches de triche/debug (G/T/M/N/P/Y — équipement complet,
 * dummies, avance pity, points de talent, ennemis de test). `false` = désactivées
 * pour un playtest "propre" (retour créateur : elles polluaient l'état testé) —
 * gardées ICI, pas supprimées, pour réactivation en une ligne quand le besoin
 * revient. La touche U (packing de run direct) n'est PAS soumise à ce flag : ce
 * n'est pas une triche au même sens, c'est le seul point d'entrée du RunSystem
 * tant que le PNJ déclencheur n'est pas livré par content-agent.
 */
const DEBUG_CHEAT_KEYS_ENABLED = false;

const ELEMENT_PROJECTILE_COLORS: Partial<Record<ElementType, number>> = {
  [ElementType.FIRE]:      0xff4400,
  [ElementType.EARTH]:     0x88aa33,
  [ElementType.WIND]:      0xaaddff,
  [ElementType.WATER]:     0x2266ff,
  [ElementType.LIGHTNING]: 0xffee00,
  [ElementType.ICE]:       0x88ddff,
  [ElementType.DARK]:      0x8833cc,
  [ElementType.DIVINE]:    0xffffff,
};

const NPC_COLORS: Record<string, number> = {
  aldric:       0xaaaaaa,
  mira:         0x44aa66,
  theron:       0xcc6633,
  brother_ovan: 0x8844cc,
  liria:        0xddcc44,
  kelvar:       0x4466cc,
  ysolde:       0xddaa44,
  elara:        0xaaccee,
};

const ZONE_ENEMY_COLORS: Record<string, number> = {
  ignis_reach:    0xdd4422,
  terravast:      0x6a4a2a,
  zephyr_peaks:   0x88aadd,
  abyssmar:       0x2244aa,
  volterra:       0xddee22,
  glaciem:        0xaaddee,
  malachars_spire:0x6622aa,
};

/**
 * Zoom de la caméra du MONDE. **Doit rester ENTIER.**
 *
 * Il a valu 1,2 un temps, pour compenser l'agrandissement du canvas (800×600 → 960×720)
 * et garder un cadrage identique. C'était une erreur, et elle est instructive : le jeu
 * tourne en `pixelArt: true`, donc en filtrage NEAREST. Un zoom de 1,2 ré-échantillonne
 * TOUT le monde d'un facteur non entier À L'INTÉRIEUR du canvas — un sprite de 32 px
 * est dessiné sur 38,4 px, donc une colonne de pixels sur cinq est doublée et les
 * autres non. C'est exactement le défaut d'épaisseur irrégulière que toute la passe
 * typographique venait d'éliminer : on rajoutait une étape de rééchantillonnage pour
 * sauver un cadrage.
 *
 * À 1, le monde est dessiné 1:1 dans le canvas — net. Le canvas plus grand montre
 * simplement 20 % de monde en plus. La PHYSIQUE est en unités monde (inertie, dash,
 * portées d'armes, aggro) : elle est rigoureusement inchangée. Seul le champ de vision
 * s'élargit.
 *
 * Si le cadrage devait absolument être restauré un jour, la seule voie propre est un
 * zoom ENTIER (×2) avec un canvas doublé — pas un facteur fractionnaire.
 */
const WORLD_CAMERA_ZOOM = 1;

// ATTACK_PATTERNS / FISTS_PATTERN vivent désormais dans src/data/attackPatterns.ts
// (données pures, simulables hors Phaser — cf. l'en-tête de ce fichier).

/**
 * Dégâts de CONTACT — le coup que prend le joueur simplement parce qu'il se tient
 * DANS l'ennemi (toutes les 1,2 s, tant que dist < 50 px).
 *
 * Ce coup n'a AUCUN telegraph : ni tint, ni windup, ni animation. Il tombe, point.
 * La règle du projet est « telegraph before punish » — un coup qui touche sans
 * prévenir est un vol. Il tapait pourtant à ×1,0 de l'ATK, y compris pour les BOSS :
 * coller un boss coûtait donc son ATK pleine toutes les 1,2 s, sans aucune lecture
 * possible et sans aucune parade autre que « avoir plus de PV ». C'est exactement le
 * pattern raté que la spec interdit.
 *
 * Il devient un CHIP : la sanction d'un mauvais placement, pas une source de mort.
 * La menace réelle passe par les patterns, qui sont télégraphiés, eux.
 *   TRASH 0,6 — c'est la pression de meute, elle DOIT exister (cf. densité).
 *   ELITE 0,5
 *   BOSS  0,3 — un boss ne tue pas par du chip invisible. Il tue par ses patterns.
 */
const CONTACT_DAMAGE_MULT = (ae: ActiveEnemy): number =>
  ae.isBoss ? 0.3 : ae.isElite ? 0.5 : 0.6;

/**
 * Promotion ÉLITE aléatoire d'un mob banal, au spawn.
 *
 * Était à 0,20. Mesuré sur les zones réelles : avec les élites de data, cela portait
 * la population d'élites à ~27% (26 sur 97 à Ignis Reach). Une élite sur quatre
 * ennemis n'est plus une élite — c'est la norme, et la couronne ne veut plus rien
 * dire. Une élite doit PONCTUER la run.
 * À 0,06 la population d'élites retombe à ~13% (élites de data comprises) : ~12 par
 * zone, soit une rencontre notable toutes les ~45 s de terrain.
 */
const ELITE_PROMOTION_CHANCE = 0.06;

// ── ALT ATTACK CONFIGS ────────────────────────────────────────────────────────
// Pure cooldown / windup data per weapon. Execution logic lives in performAltAttack().

interface AltAttackConfig {
  cooldownMs: number;
  windupMs?: number;
}

const ALT_ATTACK_CONFIGS: Partial<Record<WeaponType, AltAttackConfig>> = {
  [WeaponType.SWORD]:       { cooldownMs: 350 },
  [WeaponType.GREATSWORD]:  { cooldownMs: 900,  windupMs: 250 },
  [WeaponType.DAGGER]:      { cooldownMs: 600 },
  [WeaponType.DUAL_DAGGER]: { cooldownMs: 700 },
  [WeaponType.DUAL_SWORD]:  { cooldownMs: 800 },
  [WeaponType.AXE]:         { cooldownMs: 900 },
  [WeaponType.HAMMER]:      { cooldownMs: 1400, windupMs: 400 },
  [WeaponType.STAFF]:       { cooldownMs: 1200, windupMs: 300 },
  [WeaponType.BOW]:         { cooldownMs: 700 },
  [WeaponType.SPEAR]:       { cooldownMs: 850,  windupMs: 180 },
};

const FISTS_ALT_CONFIG: AltAttackConfig = { cooldownMs: 500 };

export class GameScene extends Phaser.Scene {
  public  gameState!: GameState;

  private player!: Phaser.Physics.Arcade.Sprite;
  private enemies!: Phaser.Physics.Arcade.Group;
  private npcs!: Phaser.Physics.Arcade.StaticGroup;
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private layout!: ZoneLayout;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private skillKeys!: { a: Phaser.Input.Keyboard.Key; e: Phaser.Input.Keyboard.Key; r: Phaser.Input.Keyboard.Key; f: Phaser.Input.Keyboard.Key };
  private attackKey!: Phaser.Input.Keyboard.Key;
  private _attackHandler: ((e: KeyboardEvent) => void) | null = null;
  private _altAttackHandler: ((e: KeyboardEvent) => void) | null = null;
  private attackCooldownUntil = 0;
  private altAttackCooldownUntil = 0;
  private dashKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private interactKeyCode = 0;
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private skillMenuKey!: Phaser.Input.Keyboard.Key;
  private pityKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private speedBoostKey!: Phaser.Input.Keyboard.Key;
  private debugSpeedMult = 1;
  private giveAllWeaponsKey!: Phaser.Input.Keyboard.Key;
  private toggleDummiesKey!: Phaser.Input.Keyboard.Key;
  private advancePityKey!: Phaser.Input.Keyboard.Key;
  private fullLoadoutKey!: Phaser.Input.Keyboard.Key;
  private givePointsKey!: Phaser.Input.Keyboard.Key;
  private spawnTestEnemiesKey!: Phaser.Input.Keyboard.Key;
  private startRunDebugKey!: Phaser.Input.Keyboard.Key;

  private xpOrbs!: Phaser.Physics.Arcade.Group;
  private readonly XP_ATTRACT_RANGE = 96;
  private lootableGroup!: Phaser.Physics.Arcade.StaticGroup;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private projectileCollider: Phaser.Physics.Arcade.Collider | null = null;
  private weaponProjectiles!: Phaser.Physics.Arcade.Group;
  private _activeArrows: Array<{
    rect: Phaser.GameObjects.Rectangle;
    vx: number; vy: number;
    hit: boolean;
    destroyAt: number;
    dmgMult: number;
  }> = [];
  // STAFF_FINISHER_ZONE (arc_elemental_wake) — zones élémentaires laissées au sol
  // (posées depuis executeFinisherAttack, pas depuis les flèches — le finisher STAFF
  // est un cône, pas un projectile, cf. commentaire dans executeFinisherAttack).
  private _finisherZones: Array<{
    x: number; y: number;
    element: ElementType;
    radius: number;
    expiresAt: number;
    nextTickAt: number;
    gfx: Phaser.GameObjects.Arc;
  }> = [];
  private lootableLooted: Set<string> = new Set();

  // ── HOMING PROJECTILE TRACKING ───────────────────────────────
  // Each entry represents an active homing orb fired by an enemy.
  private _homingProjectiles: Array<{
    sprite: Phaser.GameObjects.Arc;
    halo: Phaser.GameObjects.Arc;
    vx: number;
    vy: number;
    rotateSpeedRad: number; // rad/s
    destroyAt: number;
    damage: number;
    hit: boolean;
    element: ElementType;
  }> = [];

  // Zone-scoped objects destroyed/recreated on each transition
  private zoneGraphics: Phaser.GameObjects.Graphics | null = null;
  // TileSprites de sol/chemin en asset bitmap réel (ELV Games) — zones opt-in
  // uniquement (cf. drawZoneMap()), fallback fillRect procédural sinon.
  private zoneTileSprites: Phaser.GameObjects.TileSprite[] = [];
  private zoneLabels: Phaser.GameObjects.Text[] = [];
  private bossDeathObjects: Phaser.GameObjects.GameObject[] = [];
  private teleportZoneImages: Phaser.Physics.Arcade.Image[] = [];
  private xpOrbOverlap: Phaser.Physics.Arcade.Collider | null = null;
  private physicsColliders: Phaser.Physics.Arcade.Collider[] = [];
  private teleportOverlaps: Phaser.Physics.Arcade.Collider[] = [];
  // RunSystem — trous (ZoneLayout.pits) : vérifiés par un test géométrique DIRECT
  // sur la position du joueur à chaque frame (checkPitFall(), appelé depuis
  // update()), PAS via physics.add.overlap()/un corps statique — retrouvé en
  // playtest à deux reprises que la chute ne se déclenchait pas de façon fiable
  // avec l'overlap ; un test point-dans-rectangle est trivial à vérifier par
  // lecture et ne dépend d'aucun comportement interne de Phaser.
  /** Timestamp (ms) jusqu'auquel les chutes sont ignorées — évite un retrigger
   *  immédiat sur le point de réapparition (même famille que iframeUntil). */
  private pitFallCooldownUntil = 0;
  /** Historique glissant (~500ms) des positions du joueur HORS trou — alimenté en
   *  update(), sert de point de réapparition (toujours hors trou par construction,
   *  sans avoir à calculer une sortie à la volée). */
  private safePositionBuffer: { x: number; y: number; t: number }[] = [];
  /** Carte générée de la run en cours (null hors run) — reconstruite depuis
   *  run.seed/run.legIndex si absente (ex: juste après un chargement de save),
   *  jamais sérialisée elle-même (cf. MapGenSystem). */
  private currentGeneratedMap: GeneratedMap | null = null;

  private activeEnemies: Map<string, ActiveEnemy> = new Map();
  private enemyHpBars: Map<string, { bg: Phaser.GameObjects.Rectangle; bar: Phaser.GameObjects.Rectangle; baseW: number }> = new Map();
  private enemyCrowns: Map<string, Phaser.GameObjects.Text> = new Map();
  private cooldowns: Record<string, number> = {};
  private dashCooldown = 0;
  /** Invincibilité post-hit : timestamp (ms) jusqu'auquel le joueur ne peut pas être touché. */
  private iframeUntil = 0;
  private wasDashReady = true;
  private isDashing = false;
  // DOUBLE_DASH (zephyr_double_dash) — charge bonus indépendante du cooldown
  // normal (dashCooldown, 1.5s) : recharge 8s, permet un second dash immédiat.
  private dashBonusChargeReadyAt = 0;
  // DASH_DMG_PCT (zephyr_aerial_mastery) — ennemis déjà touchés PENDANT le dash
  // en cours, vidé à chaque nouveau dash (sinon un dash lent sur un gros ennemi
  // le toucherait à chaque frame pendant les 300ms).
  private dashHitEnemyIds: Set<string> = new Set();
  private lastDirX = 0;
  private lastDirY = 1;
  private facingAngle = 0;
  private playerVx = 0;
  private playerVy = 0;
  private dashMomentumX = 0;
  private dashMomentumY = 0;
  // KNOCKBACK_RES_PCT/UNSHAKABLE (talents Partie 2) : overlay de vélocité additif
  // séparé de dashMomentumX/Y — même mécanisme (décroissance linéaire indépendante
  // du mouvement), mais un champ dédié pour ne pas mélanger la glisse post-dash
  // du joueur avec une poussée subie d'un coup ennemi.
  private knockbackX = 0;
  private knockbackY = 0;
  // Statuts subis par le joueur (talents Partie 2 — BURN_BLEED_IMMUNITY,
  // STATUS_RES_DURATION_PCT) : aucun ennemi n'infligeait de statut au joueur
  // avant ce chantier. Même StatusEffect[] que ActiveEnemy.statusEffects, tické
  // dans tickPlayerStatusEffects() (cf. handleMovement pour la consommation).
  private playerStatusEffects: StatusEffect[] = [];
  private playerSlowMult = 1;
  private playerImmobilized = false;
  // Debug aid (touche Y) : force rollPlayerStatusOnHit à 100% au lieu de 12%.
  private debugForceStatusProc = false;
  private menuOpen = false;
  private isInDialogue = false;
  private isTraveling = false;
  private lastAutoSave = 0;
  private playtimeAccumulator = 0;
  private lastRegenTime = 0;
  private lastPermanentRegenTime = 0;
  // LOW_HP_SHIELD_30_PCT (ring_of_preservation) — buffer de PV séparé de stats.hp,
  // absorbe les dégâts avant qu'ils n'atteignent les vrais PV. Transitoire (comme
  // dashCooldown/iframeUntil) : pas persisté en save, se reconstitue en jeu.
  private playerShieldHp = 0;
  private lowHpShieldCooldownUntil = 0;
  // AUTO_DODGE (zephyr_eye_of_storm) — esquive automatique d'UNE attaque toutes
  // les 5s, indépendante du jet DODGE_PCT et de TRUE_DODGE_25_PCT.
  private autoDodgeCooldownUntil = 0;
  // STATIC_RETORT_PCT (fulguris_static_retort) — cooldown 1s documenté dans le
  // commentaire du type TalentEffectKey (src/types/index.ts), absent de la
  // description du nœud lui-même — sans lui, plusieurs ennemis frappant le
  // joueur dans la même fenêtre déclenchaient chacun leur propre jet indépendant.
  private staticRetortCooldownUntil = 0;
  // ── État transitoire HIDDEN — VAGUE 2 (non persisté, même principe que
  // playerShieldHp/dashCooldown : reconstruit en jeu, remis à zéro dans init()
  // pour ne pas hériter de l'état d'une partie précédente sur Continuer) ──
  // PERMA_BURN_STACK_3_PCT : stacks de Marque de Magma par instance ennemie (hors
  // PlayerState car lié à la cible). Tické 1s dans tickEnemyAI comme le BLEED.
  private magmaBurnStacks: Map<string, number> = new Map();
  // SAME_TARGET_STACK_10_PCT : cible courante + stacks consécutifs.
  private sameTargetStackState: SameTargetStackState = { targetId: null, stacks: 0, lastHitAt: 0 };
  // CRIT_CD_RESET_1S : fenêtre glissante anti-spam (4 max/s).
  private critCdResetState: CritCdResetState = { windowStart: 0, count: 0 };
  // FREEZE_RETALIATION_1_5S : cooldown 5s propre à la riposte de gel.
  private freezeRetaliationCooldownUntil = 0;
  // MOVE_25_DASH_ASPD_50_PCT : fin du buff d'ASPD post-dash.
  private dashAspdBuffUntil = 0;
  // BURNING_AURA_5_PCT_ATK : dernier tick d'aura (cadence 500ms).
  private lastBurningAuraTime = 0;
  // AUTO_BOLT_150_PCT_MATK : dernier tir automatique (cadence 5s).
  private lastAutoBoltTime = 0;
  // FROZEN_SANCTUARY_30_PCT : fin de la fenêtre d'invulnérabilité/soin (3s) +
  // flag "déjà déclenchée ce combat" (reset quand activeEnemies repasse à 0).
  private frozenSanctuaryUntil = 0;
  private frozenSanctuaryUsedThisCombat = false;
  private lastFrozenSanctuaryHealTime = 0;
  // DAMAGE_DEFERRAL_50_PCT : file des moitiés de dégâts différées (5 ticks 1s).
  private deferredDamageQueue: Array<{ amountPerTick: number; ticksLeft: number }> = [];
  private lastDeferredTickTime = 0;
  // "En combat" = this.activeEnemies.size > 0 (même définition que le hors-combat
  // de outOfCombatRegen ci-dessus) — sert de point de transition pour les passifs
  // FIRST_STRIKE_500_PCT/COMBAT_START_ZERO_CD (cf. PassiveSystem).
  private wasInCombat = false;

  // ── COMBO STATE MACHINE ──────────────────────────────────────
  private comboCount = 0;
  private lastAttackEnd = 0;    // timestamp (ms) de fin du cooldown de la dernière attaque
  /**
   * Instant LIMITE (ms) auquel le coup suivant doit être porté pour que la chaîne
   * survive. Posé au moment du coup, sur les valeurs de BASE de l'arme : il ne
   * dépend PAS de l'aspd. C'est ce qui rend l'accélération PLUS permissive au lieu
   * de plus punitive — cf. le commentaire de performBasicAttack.
   */
  private comboDeadline = 0;
  /** Fin de la fenêtre de vitesse d'attaque octroyée par un critique (talent CRIT_SURGE_ASPD_PCT). */
  private critSurgeUntil = 0;
  /** POST_FINISHER_BUFF (vig_titans_echo) — fenêtre (2.5s) pendant laquelle la
   *  PROCHAINE attaque normale (mêlée/flèche, pas un sort — le combo est une
   *  notion d'arme) inflige +50%, consommée une seule fois au dispatch de cette
   *  attaque (pas par coup dans un swing multi-hits — un seul déclenchement par attaque). */
  private postFinisherBuffUntil = 0;
  /** Horodatage des coups portés sur la dernière seconde — sert à MESURER la cadence réelle (particules). */
  private recentHitTimes: number[] = [];
  private comboRushed = false;  // un input a été reçu en zone morte
  private bufferedAttack = false; // réservé pour implémentation future zone buffer
  private comboWeaponType: WeaponType | undefined = undefined;
  private guardUntil = 0;       // timestamp fin de la garde (Sword finisher)
  private inWindup = false;     // true pendant le chargement (windup) d'une arme lourde
  // Bouclier temporisé générique (GUARD_FINISHER 8%/3s, LAST_BASTION 25%/5s) —
  // le plus généreux gagne (jamais cumulatif), distinct de playerShieldHp
  // (LOW_HP_SHIELD_30_PCT, qui n'a pas de durée/expiry).
  private timedShieldHp = 0;
  private timedShieldUntil = 0;
  // MAGMA_GUARD (ignis_magma_armor) — 1 coup absorbé entièrement, 1 fois par combat.
  private magmaGuardUsedThisCombat = false;
  // LAST_BASTION (glacius_last_bastion) — 1 fois par combat.
  private lastBastionUsedThisCombat = false;
  // PRESERVED (glacius_deep_patience) — 1 fois par ZONE (pas par combat).
  private preservedUsedThisZone = false;
  private playerModifiers!: TalentModifiers; // recalculé après unlock/respec/équipement

  // Interaction tracking
  private nearbyNPC: string | null = null;
  private nearbyLootable: string | null = null;
  private interactHint!: Phaser.GameObjects.Text;
  private interactHintIcon!: Phaser.GameObjects.Image;

  constructor() { super({ key: 'GameScene' }); }

  init(data: { gameState?: GameState }) {
    this.gameState = data?.gameState ?? SaveSystem.createNewGame('Héros');
    // Spells non fonctionnels pour l'instant — vider les slots équipés
    this.gameState.player.equippedSkills = { slot1: null, slot2: null, slot3: null, slot4: null };
    this.menuOpen       = false;
    this.isTraveling    = false;
    this.isInDialogue   = false;
    this.nearbyNPC      = null;
    this.nearbyLootable = null;
    this.activeEnemies      = new Map();
    this.enemyHpBars        = new Map();
    this.enemyCrowns        = new Map();
    this.lootableLooted     = new Set();
    this._homingProjectiles = [];
    this.cooldowns           = {};
    this.dashCooldown        = 0;
    this.wasDashReady        = true;
    this.dashBonusChargeReadyAt = 0;
    this.dashHitEnemyIds.clear();
    this.playerVx            = 0;
    this.playerVy            = 0;
    this.dashMomentumX       = 0;
    this.dashMomentumY       = 0;
    this.knockbackX          = 0;
    this.knockbackY          = 0;
    this.playerStatusEffects = [];
    this.playerSlowMult      = 1;
    this.playerImmobilized   = false;
    this.debugForceStatusProc = false;
    this.playtimeAccumulator = 0;
    this.lastAutoSave        = 0;
    this.attackCooldownUntil    = 0;
    this.altAttackCooldownUntil = 0;
    this.iframeUntil            = 0;
    this.isDashing      = false;
    this.lastDirX       = 0;
    this.lastDirY       = 1;
    this.facingAngle    = 0;
    // Combo state machine reset
    this.comboCount      = 0;
    this.lastAttackEnd   = 0;
    this.comboDeadline   = 0;
    this.critSurgeUntil  = 0;
    this.postFinisherBuffUntil = 0;
    this.recentHitTimes  = [];
    this.comboGraceMs    = 0;
    // Les textes agrégés et l'anneau référencent des GameObjects de la scène
    // PRÉCÉDENTE : les garder ferait pointer une entrée sur un objet détruit au
    // changement de zone.
    this.dmgAggregates.clear();
    this.comboRing        = null;
    this.shakeWindowUntil = 0;
    this.shakeWindowPrio  = 0;
    // Écho : même raison que comboRing ci-dessus — container/textes/tween référencent
    // la scène PRÉCÉDENTE au redémarrage (menu principal → Continuer).
    this.echoTotal                 = 0;
    this.echoHits                  = 0;
    this.echoDeadline              = 0;
    this.echoAnchorInstanceId      = null;
    this.echoFrozen                = false;
    this.echoHasPosition           = false;
    this.echoX                     = 0;
    this.echoY                     = 0;
    this.echoTweenT                = 1;
    this.echoMoveTween             = null;
    this.echoContainer             = null;
    this.echoTotalText             = null;
    this.echoHitsText              = null;
    this.echoPendingAnchor         = null;
    this.echoAnchorCommitScheduled = false;
    this.echoTier                  = 0;
    this.echoDisplayTotal          = 0;
    this.echoCountTween            = null;
    this.echoPunchTween            = null;
    this.echoIdleTween             = null;
    this.echoStrokeFlashEvt        = null;
    this.comboRushed     = false;
    this.bufferedAttack  = false;
    this.comboWeaponType = undefined;
    this.guardUntil      = 0;
    this.inWindup        = false;
    this.timedShieldHp    = 0;
    this.timedShieldUntil = 0;
    this.magmaGuardUsedThisCombat = false;
    this.lastBastionUsedThisCombat = false;
    this.preservedUsedThisZone = false;
    for (const z of this._finisherZones) { if (z.gfx.active) z.gfx.destroy(); }
    this._finisherZones = [];
    this.playerModifiers = TalentSystem.getModifiers(this.gameState.player);
    // Passifs d'objet (code-reviewer BUG) : sans ce reset, recharger une partie
    // dans la même instance de Scene (menu principal → Continuer) hérite d'un
    // bouclier/état de combat résiduel de la session précédente.
    this.playerShieldHp          = 0;
    this.lowHpShieldCooldownUntil = 0;
    this.autoDodgeCooldownUntil  = 0;
    this.staticRetortCooldownUntil = 0;
    this.wasInCombat             = false;
    this.lastPermanentRegenTime  = 0;
    // HIDDEN — VAGUE 2 : même reset que playerShieldHp (état de combat transitoire).
    this.magmaBurnStacks              = new Map();
    this.sameTargetStackState         = { targetId: null, stacks: 0, lastHitAt: 0 };
    this.critCdResetState             = { windowStart: 0, count: 0 };
    this.freezeRetaliationCooldownUntil = 0;
    this.dashAspdBuffUntil            = 0;
    this.lastBurningAuraTime          = 0;
    this.lastAutoBoltTime             = 0;
    this.frozenSanctuaryUntil         = 0;
    this.frozenSanctuaryUsedThisCombat = false;
    this.lastFrozenSanctuaryHealTime  = 0;
    this.deferredDamageQueue          = [];
    this.lastDeferredTickTime         = 0;
    // Bouclier de surplus (OVERHEAL_SHIELD) : état de combat transitoire — ne pas
    // hériter d'un reliquat de la session précédente (Continuer) ou de la save.
    if (this.gameState.player.passiveStacks) this.gameState.player.passiveStacks['OVERHEAL_SHIELD_50_PCT'] = 0;
    // Reset zone-scoped refs on each scene start (full Phaser restart)
    this.zoneGraphics       = null;
    this.zoneTileSprites    = [];
    this.zoneLabels         = [];
    this.teleportZoneImages = [];
    this.physicsColliders   = [];
    this.teleportOverlaps   = [];
    this.pitFallCooldownUntil = 0;
    this.safePositionBuffer = [];
    this.currentGeneratedMap = null;
    this.xpOrbOverlap       = null;
    this.projectileCollider = null;
  }

  /**
   * Sprites d'ennemis de la zone où l'on entre — voir src/utils/EnemyAssets.ts.
   *
   * Ils ne sont plus chargés au boot (965 fichiers pour 193 créatures, dont ~90 %
   * ne servent jamais dans une session). Les mettre en file ICI plutôt que dans
   * create() n'est pas un détail : Phaser ne lance create() qu'une fois le loader
   * de preload() vidé. La garantie « la texture existe au moment du spawn » —
   * dont dépendent les gardes `textures.exists('enemy_X_idle')` de
   * createEnemiesForZone() — est donc tenue par le moteur, sans aucun await.
   *
   * Idempotent : au retour dans une zone déjà visitée, tout est en cache et le
   * loader n'a rien à faire.
   */
  preload() {
    queueEnemySprites(this, enemyIdsForZone(this.gameState.player.currentZone));
  }

  create() {
    // Phaser n'appelle PAS scene.shutdown() de lui-même : Systems.shutdown() se
    // contente d'ÉMETTRE l'événement SHUTDOWN. Sans cette ligne, la méthode
    // shutdown() ci-dessous est du CODE MORT — les listeners qu'elle est censée
    // retirer survivent à la scène, et chaque create() en empile une couche de plus.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    const zoneId = this.gameState.player.currentZone;
    // RunSystem — même résolution que buildZone() (cf. resolveZoneLayout). Sans ça,
    // un rechargement de save (F5, crash, "Continuer" depuis le menu) pendant une
    // run active en ignis_reach chargeait TOUJOURS la carte statique legacy et
    // n'appelait jamais spawnRunEnemies() — currentGeneratedMap
    // restait null, le hook boss (this.currentGeneratedMap requis) ne se déclenchait
    // jamais, et la run finissait softlock dès le quota atteint (BLOCKER trouvé en
    // revue de code — l'autosave 180s rend ce chemin trivialement atteignable en
    // jeu normal, pas un cas limite exotique).
    const isRunZone = this.resolveZoneLayout(zoneId);

    // Les animations ne peuvent être déclarées qu'une fois les textures présentes —
    // c'est-à-dire maintenant, preload() étant terminé.
    registerEnemyAnimations(this, enemyIdsForZone(zoneId));

    this.generatePixelTexture();
    this.drawZoneMap();
    this.createPlayer();
    if (isRunZone && this.currentGeneratedMap) {
      this.spawnRunEnemies(zoneId, this.gameState.run!, this.currentGeneratedMap);
    } else {
      this.createEnemiesForZone(zoneId);
    }
    this.createNPCsForZone(zoneId);
    this.createTeleportOverlaps();
    this.createLootables();
    this.createXpOrbsGroup();
    this.setupInput();
    this.applyKeyBindings(loadBindings());
    this.game.events.on('mobile_action', this.onMobileAction, this);
    this.setupCamera();
    this.setupPhysics();
    this.createProjectileGroup();
    this.weaponProjectiles = this.physics.add.group();

    // Indice d'interaction contextuel — icône de la touche réellement liée (rebindable,
    // cf. KeyIcons.ts) + libellé, positionné au-dessus du joueur uniquement quand un
    // PNJ/objet est à portée (voir update()). Fallback texte `[NOM]` si la touche
    // n'a pas de frame dédiée dans le spritesheet.
    this.interactHint = this.add.text(0, 0, '', uiStyle(11, '#ffee88', { bold: true, stroke: true }))
      .setOrigin(0, 0.5).setDepth(20).setVisible(false);
    this.interactHintIcon = this.add.image(0, 0, 'keyboard_ui', 0)
      .setOrigin(0.5).setDepth(20).setVisible(false).setDisplaySize(22, 22);

    // UIScene reste vivante entre les transitions — ne la lancer qu'une seule fois
    if (!this.scene.isActive('UIScene') && !this.scene.isPaused('UIScene')) {
      this.scene.launch('UIScene', { gameScene: this });
    }

    const { width: W, height: H } = this.cameras.main;
    const fadeRect = this.add.rectangle(W / 2, H / 2, W, H, 0x000000)
      .setDepth(999).setScrollFactor(0);
    this.tweens.add({
      targets: fadeRect,
      alpha: 0,
      duration: 300,
      onComplete: () => fadeRect.destroy(),
    });

    const zone = ZONE_MAP[zoneId];
    if (zone) {
      const completed = QuestSystem.onZoneEntered(this.gameState.player, zoneId, this.gameState.world);
      if (completed.length > 0) this.handleQuestCompletions(completed);
      this.applyWorldDegradation();
      // Defer by one frame: in Phaser 3.90 scene.launch() may run UIScene.create()
      // synchronously before this line, registering its listener. At that point the
      // Text canvas is not yet fully committed, so setText() crashes with
      // "Cannot read properties of null (reading 'drawImage')".
      this.time.delayedCall(0, () => this.events.emit('zone_entered', zone));
    }
  }

  update(time: number, delta: number) {
    if (this.isInDialogue || this.isTraveling || this.menuOpen) return;

    const dt = delta / 1000;
    this.playtimeAccumulator += dt;
    this.gameState.player.playtime += dt;

    // L'anneau de combo suit le joueur et clignote à l'approche de l'expiration.
    this.syncComboRing();
    // L'Écho suit son ancre et gère sa propre fenêtre d'expiration (2000ms fixes).
    this.updateEcho(time);
    // Statuts subis par le joueur (talents Partie 2) — AVANT handleMovement(dt)
    // plus bas : playerImmobilized/playerSlowMult doivent être à jour pour la
    // même frame.
    this.tickPlayerStatusEffects(dt);
    // Un tick BURN peut déclencher onPlayerDeath() ci-dessus (pose isTraveling) —
    // couper la frame ici, comme le garde déjà fait en haut d'update() pour tout
    // le reste (inputs, IA ennemie ne doivent pas tourner sur un joueur mort).
    if (this.isTraveling) return;

    // NPC proximity via distance (le collider empêche le vrai overlap physique)
    this.nearbyNPC = null;
    this.npcs.getChildren().forEach((go: Phaser.GameObjects.GameObject) => {
      const sprite = go as Phaser.Physics.Arcade.Image;
      const npcId  = sprite.getData('npcId') as string | null;
      if (!npcId) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (dist < 42) this.nearbyNPC = npcId;
    });

    // Lootables : même logique distance-based que les PNJ — l'ancien
    // physics.add.overlap() (voir createLootables) ratait des frames par
    // intermittence (clignotement de l'indice + F parfois ignoré, bug reporté).
    this.nearbyLootable = null;
    this.lootableGroup.getChildren().forEach((go: Phaser.GameObjects.GameObject) => {
      const sprite = go as Phaser.Physics.Arcade.Image;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (dist < 32) this.nearbyLootable = sprite.name;
    });

    this.handleMovement(dt);
    this.recordSafePosition(time);
    this.checkPitFall(time);
    this.tickDashDamage();
    this.handleAttackInput();
    this.handleSkillInput();
    this.updateArrowProjectiles(dt);

    // Touches de triche — désactivées par défaut (DEBUG_CHEAT_KEYS_ENABLED),
    // cf. commentaire en tête de fichier. Code gardé intact, pas supprimé.
    if (DEBUG_CHEAT_KEYS_ENABLED) {
      // Debug: press G to add one of every gear item (weapon/armor/accessory) to the inventory (asset-review aid)
      if (Phaser.Input.Keyboard.JustDown(this.giveAllWeaponsKey)) this.debugGiveAllWeapons();
      // Debug: press T to toggle the training dummies flag (loot stat rolls test aid, cf. LOOT_STAT_ROLLS.md §10)
      if (Phaser.Input.Keyboard.JustDown(this.toggleDummiesKey)) this.debugToggleTrainingDummies();
      if (Phaser.Input.Keyboard.JustDown(this.advancePityKey)) this.debugAdvancePity();
      // Debug: press P to grant 20 talent points (talent unlock test aid, étape 4 roguelite)
      if (Phaser.Input.Keyboard.JustDown(this.givePointsKey)) this.debugGiveTalentPoints();
      // Debug: press Y to spawn one enemy per element tested by Phase 0 (talents Partie 2) + a boss
      if (Phaser.Input.Keyboard.JustDown(this.spawnTestEnemiesKey)) this.debugSpawnTestEnemies();
    }
    // N reste HORS du flag — fixture de test propre pour le RunSystem (équipement
    // modeste + 2 potions + sac vidé), pas une triche au même sens que les autres.
    if (Phaser.Input.Keyboard.JustDown(this.fullLoadoutKey)) this.debugFullLoadoutEmptyBag();
    // Debug: press U to open the run-start packing screen directly (RunSystem test
    // aid) — le vrai PNJ déclencheur (flag start_run) est du contenu, hors scope de
    // ce chantier technique ; retirer cette touche une fois le PNJ livré par content-agent.
    // Garde run?.active : sans ça, ré-ouvrir le packing PENDANT une run en cours
    // écrase gameState.run à la confirmation "Descendre" — le sac de run déjà
    // rempli (butin non exfiltré) serait perdu sans confirmation (trouvé en revue).
    if (Phaser.Input.Keyboard.JustDown(this.startRunDebugKey) && !this.gameState.run?.active) {
      this.openRunBagScene('pack');
    }

    // ── IFRAMES : clignotement du joueur pendant l'invincibilité post-hit ──
    // Alterne alpha 0.25 / 1 toutes les 80ms ; alpha restauré à la fin de la fenêtre.
    if (this.iframeUntil > 0) {
      if (time < this.iframeUntil) {
        this.player.setAlpha(Math.floor(time / 80) % 2 === 0 ? 0.25 : 1);
      } else {
        this.iframeUntil = 0;
        this.player.setAlpha(1);
      }
    }

    // Interaction hint — icône de touche réelle (rebindable) + libellé, affiché
    // uniquement à proximité d'un PNJ/objet (jamais dans le HUD permanent).
    const showHint = !!this.nearbyNPC || !!this.nearbyLootable;
    if (showHint) {
      const actionLabel = this.nearbyNPC ? t('hint.talk_action') : t('hint.loot_action');
      const frame = keyIconFrame(this.interactKeyCode);
      const label = frame !== undefined ? actionLabel : `[${keyCodeLabel(this.interactKeyCode)}] ${actionLabel}`;
      if (this.interactHint.text !== label) this.interactHint.setText(label);

      const ICON_SZ = 22, GAP = 5;
      const hasIcon = frame !== undefined;
      const totalW = (hasIcon ? ICON_SZ + GAP : 0) + this.interactHint.width;
      const px = Math.round(this.player.x);
      const py = Math.round(this.player.y) - 28;
      const leftX = px - totalW / 2;

      this.interactHintIcon.setVisible(hasIcon);
      if (hasIcon) {
        this.interactHintIcon.setFrame(frame);
        this.interactHintIcon.setPosition(leftX + ICON_SZ / 2, py);
      }
      this.interactHint.setPosition(leftX + (hasIcon ? ICON_SZ + GAP : 0), py);
    }
    this.interactHint.setVisible(showHint);
    if (!showHint) this.interactHintIcon.setVisible(false);

    SkillSystem.tickCooldowns(this.cooldowns, dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    const dashReady = this.dashCooldown === 0;
    if (dashReady && !this.wasDashReady) this.flashDashReady();
    this.wasDashReady = dashReady;

    this.tickEnemyAI(dt);
    this.tickXpOrbs();

    if (this.activeEnemies.size === 0 && time - this.lastRegenTime > 2000) {
      this.lastRegenTime = time;
      CombatSystem.outOfCombatRegen(this.gameState.player);
    }

    // PERMANENT_REGEN_1_PCT_PER_SEC (hidden_eternity_ring) — même cadence que la
    // regen hors-combat ci-dessus, mais SANS la condition activeEnemies.size===0
    // (le point même de ce passif est de régénérer MÊME en combat).
    const permanentRegenPct = PassiveSystem.getPermanentRegenPctPerSec(this.gameState.player.equipment);
    if (permanentRegenPct > 0 && time - this.lastPermanentRegenTime > 2000) {
      this.lastPermanentRegenTime = time;
      const p = this.gameState.player;
      const regenFrac = permanentRegenPct / 100 * 2; // 1%/s × 2s d'intervalle
      // applyHeal pour convertir le surplus en bouclier si OVERHEAL_SHIELD équipé
      // (cf. §3.11) ; le mana n'a pas d'équivalent bouclier → clamp manuel.
      PassiveSystem.applyHeal(p, Math.floor(p.stats.maxHp * regenFrac), this.playerModifiers);
      p.stats.mana = Math.min(p.stats.maxMana, p.stats.mana + Math.floor(p.stats.maxMana * regenFrac));
    }

    // HIDDEN — VAGUE 2 : effets périodiques globaux (mêmes cadences internes).
    this.tickBurningAura(time);
    this.tickAutoBolt(time);
    this.tickDeferredDamage(time);
    this.tickFrozenSanctuaryHeal(time);
    this.tickFinisherZones(time);

    // Transition hors-combat → en-combat : reset des passifs "premier coup"/"cooldowns
    // à zéro au début du combat" (FIRST_STRIKE_500_PCT, COMBAT_START_ZERO_CD).
    const inCombatNow = this.activeEnemies.size > 0;
    if (inCombatNow && !this.wasInCombat) {
      this.gameState.player.firstStrikeReady = true;
      if (PassiveSystem.hasCombatStartZeroCd(this.gameState.player.equipment)) {
        for (const id of Object.keys(this.cooldowns)) this.cooldowns[id] = 0;
      }
    }
    // FROZEN_SANCTUARY_30_PCT / MAGMA_GUARD / LAST_BASTION : toutes « une fois par
    // combat » — les flags se réarment dès la sortie de combat (même transition
    // que firstStrikeReady).
    if (!inCombatNow) {
      this.frozenSanctuaryUsedThisCombat = false;
      this.magmaGuardUsedThisCombat = false;
      this.lastBastionUsedThisCombat = false;
    }
    this.wasInCombat = inCombatNow;

    if (this.playtimeAccumulator - this.lastAutoSave > 180) {
      this.lastAutoSave = this.playtimeAccumulator;
      SaveSystem.save(this.gameState, this.gameState.saveSlot);
    }

    this.events.emit('player_update', this.gameState.player);
  }

  /** Debug aid (press G): adds one of every piece of gear (weapons/armors/
   * accessories) in the game to the inventory, so newly-integrated icons/stats
   * can be reviewed in-game without grinding. Bypass volontaire du cap de 60
   * slots de LootSystem.addToInventory() : ~110+ items d'équipement au total,
   * ce n'est pas une mécanique de jeu normale — le but est de tout avoir sous
   * la main, y compris pour que l'Arsenal marque bien CHAQUE item comme
   * découvert (ArsenalSystem.discover), armures/accessoires inclus (avant ce
   * fix, seules les armes étaient données → les armures restaient jamais
   * "découvertes" côté Arsenal, d'où des stats masquées et le cross-link
   * Bestiaire → Arsenal absent pour elles, cf. bug reporté). */
  /** Debug aid (press M) : avance les 3 compteurs de pitié à 3 kills de leur
   *  garantie respective (pas directement au seuil : le joueur doit encore tuer
   *  quelque chose pour voir la garantie se déclencher ET la notif "Garantie
   *  honorée !" se jouer, plutôt que de sauter l'état "sur le point de payer"). */
  private debugAdvancePity(): void {
    const p = this.gameState.player;
    p.killsWithoutEpic      = Math.max(0, PITY_THRESHOLDS[ItemRarity.EPIC]!      - 3);
    p.killsWithoutLegendary = Math.max(0, PITY_THRESHOLDS[ItemRarity.LEGENDARY]! - 3);
    p.killsWithoutMythic    = Math.max(0, PITY_THRESHOLDS[ItemRarity.MYTHIC]!    - 3);
    this.events.emit('player_update', p);
    this.events.emit('show_notification', '[DEBUG] Pitié avancée à 3 kills de la garantie (Épique/Légendaire/Mythique)');
  }

  private debugGiveAllWeapons(): void {
    this.gameState.player.inventory = [];
    const gear = Object.values(ALL_ITEMS).filter(item => ARSENAL_ITEM_TYPES.has(item.type));
    for (const item of gear) {
      this.gameState.player.inventory.push({ item, quantity: 1 });
      ArsenalSystem.discover(this.gameState.world, item.id);
    }
    this.events.emit('player_update', this.gameState.player);
    this.events.emit('show_notification', `[DEBUG] Sac vidé — ${gear.length} équipements ajoutés (armes+armures+accessoires)`);
  }

  /** Debug aid (press N) : équipe une pièce de chaque slot (arme, 6 pièces
   *  d'armure, 2 anneaux, amulette) DIRECTEMENT — sac vide derrière. Contrairement
   *  à la touche G (tout dans le sac, non équipé), sert à tester le ramassage
   *  de loot sans se heurter tout de suite au plafond de 400 emplacements. */
  private debugFullLoadoutEmptyBag(): void {
    const player = this.gameState.player;
    const pick = (type: ItemType) => Object.values(ALL_ITEMS).find(item => item.type === type);
    const rings = Object.values(ALL_ITEMS).filter(item => item.type === ItemType.RING);

    const slots: [keyof Equipment, Item | undefined][] = [
      ['weapon', pick(ItemType.WEAPON)],
      ['helm',   pick(ItemType.HELM)],
      ['chest',  pick(ItemType.CHEST)],
      ['legs',   pick(ItemType.LEGS)],
      ['boots',  pick(ItemType.BOOTS)],
      ['gloves', pick(ItemType.GLOVES)],
      ['cape',   pick(ItemType.CAPE)],
      ['ring1',  rings[0]],
      // Clone si un seul RING existe dans ALL_ITEMS : ring1/ring2 ne doivent JAMAIS
      // partager la même référence d'objet — equippedSlotOf() (InventoryScene) résout
      // par identité (===) et ne retournerait jamais que ring1 pour cet objet,
      // laissant ring2 invisible/indéséquipable dans l'inventaire.
      ['ring2',  rings[1] ?? (rings[0] ? { ...rings[0] } : undefined)],
      ['amulet', pick(ItemType.AMULET)],
    ];

    player.inventory = [];
    // Fixture de test RunSystem (retour créateur) : "un petit équipement commun
    // et rien dans l'inventaire sauf 2 potions de soin banales" — pour tester
    // ramassage/inventaire intra-run/consommation sans bruit d'un sac déjà plein.
    const potion = ALL_ITEMS['minor_health_potion'];
    if (potion) player.inventory.push({ item: potion, quantity: 2 });
    for (const [slot, item] of slots) {
      if (!item) continue;
      (player.equipment as any)[slot] = item;
      ArsenalSystem.discover(this.gameState.world, item.id);
    }
    InventorySystem.recalcStats(player);
    this.events.emit('player_update', player);
    this.events.emit('show_notification', '[DEBUG] Équipement complet, sac vidé — prêt à tester le ramassage de loot');
  }

  /** Debug aid (press T) : bascule player.flags['dev_training_dummies'] pour tester
   * les rolls de stats (mannequins de Kelvar, cf. docs/design/LOOT_STAT_ROLLS.md §10).
   * Sans point d'entrée en jeu sinon (flag jamais posé par aucun autre chemin) —
   * createEnemiesForZone() ne relit layout.fixedEnemies qu'à l'entrée en zone, donc
   * il faut changer de zone (ou recharger) après bascule pour voir les mannequins. */
  private debugToggleTrainingDummies(): void {
    if (this.isTraveling) return;
    const flags = this.gameState.player.flags;
    const next = !flags['dev_training_dummies'];
    flags['dev_training_dummies'] = next;
    this.events.emit('show_notification',
      `[DEBUG] Mannequins de Kelvar ${next ? 'activés' : 'désactivés'}`);
    // createEnemiesForZone() ne relit layout.fixedEnemies qu'à l'entrée en zone :
    // on rejoue la transition sur place (même zone, position courante) pour que la
    // bascule soit visible immédiatement, sans avoir à sortir puis revenir.
    this.performZoneTransition(this.gameState.player.currentZone, this.player.x, this.player.y);
  }

  /** Debug aid (press P) : porte player.talentPoints au cap de 20 sans grinder l'XP
   * (cf. ProgressionSystem.addXp — cap identique). Sert à débloquer des talents pour
   * tester en jeu l'impact d'un unlock sur les dégâts (étape 4 roguelite, §2 handoff). */
  private debugGiveTalentPoints(): void {
    const gained = 20 - this.gameState.player.talentPoints;
    this.gameState.player.talentPoints = 20;
    this.events.emit('player_update', this.gameState.player);
    this.events.emit('show_notification', `[DEBUG] Talents au plafond (20) — +${Math.max(0, gained)}`);
  }

  // Un ennemi par élément testé par la Phase 0 (talents Partie 2) + un boss
  // pour vérifier l'exemption anti-stun-lock du stagger réel (SLOW au lieu
  // de STUN, cf. triggerRealStagger).
  private static readonly DEBUG_TEST_ENEMY_IDS = ['ember_wyrm', 'frost_wolf', 'spark_imp', 'pyrath_boss'];

  /** Debug aid (press Y) : invoque les ennemis nécessaires pour tester le
   *  knockback/statuts/stagger subis par le joueur (Phase 0 du chantier
   *  talents) sans voyager entre zones — FIRE→BURN, ICE→SLOW, LIGHTNING→SHOCK,
   *  + 1 boss. Positionnés en cercle autour du joueur. Jamais persistés,
   *  retirés comme n'importe quel ennemi normal en changeant de zone. */
  private debugSpawnTestEnemies(): void {
    if (this.isTraveling) return;
    const px = this.player.x, py = this.player.y, radius = 90;
    GameScene.DEBUG_TEST_ENEMY_IDS.forEach((enemyId, i) => {
      const angle = (i / GameScene.DEBUG_TEST_ENEMY_IDS.length) * Math.PI * 2;
      this.spawnDebugEnemy(enemyId, px + Math.cos(angle) * radius, py + Math.sin(angle) * radius);
    });
    // Force le jet de statut-sur-coup (rollPlayerStatusOnHit) à 100% — sans ça,
    // vérifier BURN/SLOW/SHOCK à 12% de chance demande beaucoup trop de coups
    // pour être un test fiable. Reste actif tant que la scène tourne (reset
    // par init(), donc à chaque nouvelle partie/rechargement) : c'est un outil
    // de test, pas un mode qui doit survivre discrètement à une vraie session.
    this.debugForceStatusProc = true;
    this.events.emit('show_notification', '[DEBUG] Ennemis de test invoqués (Feu/Glace/Foudre/Boss) — statuts à 100%');
  }

  /** Fait à la main ce que la boucle fixedEnemies/le spawn de boss font pour la
   *  population normale d'une zone (cf. les deux blocs dans createEnemiesForZone),
   *  généralisé pour accepter un ennemi OU un boss à une position arbitraire. */
  private spawnDebugEnemy(enemyId: string, x: number, y: number): void {
    const def = ENEMY_MAP[enemyId];
    if (!def) return;
    const zoneColor = ZONE_ENEMY_COLORS[def.zone] ?? 0xaa4444;
    const texKey = `enemy_${enemyId}`;
    const hasRealSprite = this.textures.exists(`${texKey}_idle`);
    const fallbackSize = def.isBoss ? 64 : 28;
    if (!hasRealSprite) this.ensureTexture(texKey, zoneColor, fallbackSize, fallbackSize);

    const bbox = ENEMY_SPRITE_BBOX[enemyId];
    const fit = hasRealSprite && bbox ? fitSpriteToContent(bbox, def.isBoss ? 68 : 36) : null;
    const dispSize = fit ? fit.dispSize : fallbackSize;
    const sprite = hasRealSprite
      ? this.physics.add.sprite(x, y, `${texKey}_idle`)
      : this.physics.add.sprite(x, y, texKey);
    sprite.setDisplaySize(dispSize, dispSize);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (fit && bbox) {
      body.setSize(bbox.w, bbox.h);
      body.setOffset(bbox.x, bbox.y);
    } else {
      body.setSize(dispSize - (def.isBoss ? 4 : 8), dispSize - (def.isBoss ? 4 : 8));
    }
    sprite.setDepth(def.isBoss ? 5 : 4);
    sprite.setData('baseScale', sprite.scale);
    if (hasRealSprite) {
      sprite.setData('hasRealSprite', true);
      sprite.play(`${texKey}_idle`);
    }

    const active = CombatSystem.spawnEnemy(def, this.gameState.player.currentZone);
    active.x = x;
    active.y = y;
    sprite.name = active.instanceId;
    this.activeEnemies.set(active.instanceId, active);
    this.enemies.add(sprite);

    const contentTopGap = fit ? dispSize / 2 - fit.offsetY : dispSize / 2;
    const barW = (fit ? fit.bodyW : dispSize) + 4;
    const barY = y - contentTopGap - (def.isBoss ? 12 : 8);
    const barBg = this.add.rectangle(x, barY, barW, def.isBoss ? 8 : 6, 0x220000).setDepth(8);
    const barFg = this.add.rectangle(x - barW / 2, barY, barW, def.isBoss ? 6 : 4, def.isBoss ? 0xffd700 : 0xff2222)
      .setDepth(9).setOrigin(0, 0.5);
    this.enemyHpBars.set(active.instanceId, { bg: barBg, bar: barFg, baseW: barW });

    // La population normale de zone annonce le nom du boss à l'apparition
    // (showBossAnnouncement, cf. createEnemiesForZone) — absent ici, le nom
    // n'apparaissait donc qu'à sa mort (playBossDeathSequence).
    if (def.isBoss) this.showBossAnnouncement(def.name, def.element);
  }

  // ── MOVEMENT ─────────────────────────────────────────────────

  private handleMovement(dt: number) {
    if (this.isDashing) return;
    // Statuts subis (talents Partie 2) — STUN/FREEZE/SHOCK immobilisent le joueur
    // exactement comme un ennemi (cf. tickPlayerStatusEffects) : aucun déplacement,
    // le knockback/dash-momentum continue de s'appliquer (subi, pas choisi).
    if (this.playerImmobilized) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      this.playerVx = 0;
      this.playerVy = 0;
      body.setVelocity(this.dashMomentumX + this.knockbackX, this.dashMomentumY + this.knockbackY);
      return;
    }

    this.debugSpeedMult = this.speedBoostKey?.isDown ? 5 : 1;

    const player = this.gameState.player;
    // WATER_DMG_15_SPEED_10_PCT (sailor_ghost_ring) + MOVE_25_DASH_ASPD_50_PCT
    // (hidden_skyward_mantle) — bonus de vitesse de déplacement permanents, cumulés.
    const passiveSpeedMult = 1
      + PassiveSystem.getMoveSpeedBonusPct(player.equipment) / 100
      + PassiveSystem.getSkywardMoveSpeedPct(player.equipment) / 100;
    // SLOW subi (talents Partie 2) : playerSlowMult ∈ [0,1], 1 = pas ralenti.
    const speed  = (90 + player.stats.spd * 4) * this.playerModifiers.moveSpeedMult * passiveSpeedMult * this.debugSpeedMult * this.playerSlowMult;
    const body   = this.player.body as Phaser.Physics.Arcade.Body;

    let targetVx = 0, targetVy = 0;
    if (this.wasd.left.isDown  || this.cursors.left.isDown)  targetVx = -speed;
    if (this.wasd.right.isDown || this.cursors.right.isDown) targetVx =  speed;
    if (this.wasd.up.isDown    || this.cursors.up.isDown)    targetVy = -speed;
    if (this.wasd.down.isDown  || this.cursors.down.isDown)  targetVy =  speed;

    if (targetVx !== 0 && targetVy !== 0) { targetVx *= 0.707; targetVy *= 0.707; }

    // Snap to 0 on direction change — immediate reversal, no momentum carry
    if (targetVx !== 0 && Math.sign(targetVx) !== Math.sign(this.playerVx)) this.playerVx = 0;
    if (targetVy !== 0 && Math.sign(targetVy) !== Math.sign(this.playerVy)) this.playerVy = 0;

    // Acceleration : lerp snappy (~4-5 frames à 90%)
    // Décélération : linéaire à taux fixe — la vitesse reste haute puis coupe net (~440ms, ~24px de glisse)
    const DECEL_RATE = 720; // px/s²  — ~8px de glisse depuis la vitesse max
    if (targetVx !== 0) {
      this.playerVx = Phaser.Math.Linear(this.playerVx, targetVx, 25 * dt);
    } else {
      const d = DECEL_RATE * dt;
      this.playerVx = Math.abs(this.playerVx) <= d ? 0 : this.playerVx - Math.sign(this.playerVx) * d;
    }
    if (targetVy !== 0) {
      this.playerVy = Phaser.Math.Linear(this.playerVy, targetVy, 25 * dt);
    } else {
      const d = DECEL_RATE * dt;
      this.playerVy = Math.abs(this.playerVy) <= d ? 0 : this.playerVy - Math.sign(this.playerVy) * d;
    }

    // Post-dash momentum : overlay additif qui s'estompe independamment du mouvement
    if (this.dashMomentumX !== 0 || this.dashMomentumY !== 0) {
      const dm = 560 * dt;
      this.dashMomentumX = Math.abs(this.dashMomentumX) <= dm ? 0 : this.dashMomentumX - Math.sign(this.dashMomentumX) * dm;
      this.dashMomentumY = Math.abs(this.dashMomentumY) <= dm ? 0 : this.dashMomentumY - Math.sign(this.dashMomentumY) * dm;
    }
    // Knockback subi (talents Partie 2) — même mécanisme que dashMomentum ci-dessus,
    // overlay séparé pour ne pas se mélanger à la glisse post-dash.
    if (this.knockbackX !== 0 || this.knockbackY !== 0) {
      const kb = 560 * dt;
      this.knockbackX = Math.abs(this.knockbackX) <= kb ? 0 : this.knockbackX - Math.sign(this.knockbackX) * kb;
      this.knockbackY = Math.abs(this.knockbackY) <= kb ? 0 : this.knockbackY - Math.sign(this.knockbackY) * kb;
    }

    body.setVelocity(
      this.playerVx + this.dashMomentumX + this.knockbackX,
      this.playerVy + this.dashMomentumY + this.knockbackY,
    );

    const isMoving = targetVx !== 0 || targetVy !== 0;

    if (isMoving) {
      this.lastDirX = targetVx;
      this.lastDirY = targetVy;
      this.facingAngle = Math.atan2(Math.sign(targetVy), Math.sign(targetVx));
    }

    // Animation directionnelle (sprite bitmap réel uniquement — no-op si fallback
    // procédural, cf. createPlayer()). Direction résolue sur l'axe dominant de
    // lastDirX/lastDirY (diagonales : on affiche la facette la plus proche),
    // pas sur facingAngle qui sert au combat et ne doit pas être touché ici.
    if (this.anims.exists('player_idle_down')) {
      const dir = Math.abs(this.lastDirY) > Math.abs(this.lastDirX)
        ? (this.lastDirY < 0 ? 'up' : 'down')
        : (this.lastDirX < 0 ? 'left' : 'right');
      this.player.play(`player_${isMoving ? 'walk' : 'idle'}_${dir}`, true);
    }
  }

  // ── DASH ────────────────────────────────────────────────────

  private flashDashReady() {
    this.player.setTintFill(0xaaeeff);
    this.time.delayedCall(70, () => this.player.clearTint());
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 50,
      yoyo: true,
      repeat: 2,
      ease: 'Linear',
      onComplete: () => this.player.setAlpha(1),
    });
  }

  private handleDash() {
    // DOUBLE_DASH (zephyr_double_dash) — une charge bonus (recharge 8s,
    // indépendante du cooldown normal) autorise un second dash même si
    // dashCooldown n'est pas encore retombé à 0.
    const useBonusCharge = this.dashCooldown > 0
      && this.playerModifiers.doubleDash
      && this.time.now >= this.dashBonusChargeReadyAt;
    if (this.dashCooldown > 0 && !useBonusCharge) return;
    if (this.playerImmobilized) return; // STUN/FREEZE/SHOCK subi (talents Partie 2)

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Use lerped velocity direction, or fall back to last known direction
    let dx = this.playerVx;
    let dy = this.playerVy;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      dx = this.lastDirX;
      dy = this.lastDirY;
    }

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    // DASH_DISTANCE_20_PCT (ring_of_the_wind) — durée du dash inchangée (300ms,
    // cf. tween plus bas), la distance parcourue augmente avec la vitesse.
    const dashSpeedMult = 1 + PassiveSystem.getDashDistanceBonusPct(this.gameState.player.equipment) / 100;
    const nx = (dx / len) * 300 * dashSpeedMult;
    const ny = (dy / len) * 300 * dashSpeedMult;

    // NO_DASH_COOLDOWN (hidden_zephyr_fang) — plancher anti-exploit à
    // NO_DASH_COOLDOWN_FLOOR_S (pas 0 : un dash-spam serait des iframes wallhack),
    // même garde-fou que NO_ATTACK_COOLDOWN sur l'attaque de base.
    // DASH_CD_PCT (zephyr_featherfall) — réduction % du cooldown de BASE ; le
    // plancher NO_DASH_COOLDOWN (objet) reste prioritaire, inchangé par le talent.
    const dashCd = PassiveSystem.hasNoDashCooldown(this.gameState.player.equipment)
      ? PassiveSystem.NO_DASH_COOLDOWN_FLOOR_S
      : Math.max(0.1, 1.5 * (1 - this.playerModifiers.dashCdReductionPct / 100));
    if (useBonusCharge) {
      // Le cooldown normal continue de tourner depuis le premier dash — seule la
      // charge bonus est consommée ici.
      this.dashBonusChargeReadyAt = this.time.now + 8000;
    } else {
      this.dashCooldown = dashCd;
    }
    this.isDashing = true;
    this.dashHitEnemyIds.clear(); // DASH_DMG_PCT — nouveau dash, nouvelle salve de touches
    body.setVelocity(nx, ny);

    // MOVE_25_DASH_ASPD_50_PCT (hidden_skyward_mantle) — un dash réussi octroie un
    // buff d'ASPD temporaire (lu dans performBasicAttack).
    if (PassiveSystem.hasDashAspdBuff(this.gameState.player.equipment)) {
      this.dashAspdBuffUntil = this.time.now + PassiveSystem.DASH_ASPD_BUFF_DURATION_MS;
    }

    // dashPreservesCombo — GEL de 350 ms de la fenêtre de combo. Repose désormais
    // sur `comboDeadline` (et non plus sur `lastAttackEnd`, dont la grâce ne dépend
    // plus). Sémantique inchangée : le dash offre 350 ms de sursis à la chaîne.
    if (this.playerModifiers.dashPreservesCombo) {
      this.comboDeadline = Math.max(this.comboDeadline, this.time.now + 350);
    }

    this.spawnDashAfterimages();

    this.player.setAlpha(0.6);
    this.tweens.add({
      targets: this.player,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        this.isDashing = false;
        this.playerVx = 0;
        this.playerVy = 0;
        this.dashMomentumX = nx * 0.48; // ~144px/s overlay → ~18px de slide post-dash
        this.dashMomentumY = ny * 0.48;
      },
    });

    // N'écrase ce miroir que si le cooldown normal a réellement bougé — sinon
    // (useBonusCharge) il mentirait sur l'état réel de dashCooldown.
    if (!useBonusCharge) this.cooldowns['dash'] = dashCd;
  }

  /** DASH_DMG_PCT (zephyr_aerial_mastery) — traverser un ennemi pendant un dash
   *  lui inflige dashDmgPct% ATK, une fois par ennemi par dash (dashHitEnemyIds).
   *  Avant ce talent, un dash n'inflige AUCUN dégât : c'est ce flag qui active la
   *  mécanique, pas seulement un bonus sur des dégâts déjà existants. */
  private tickDashDamage(): void {
    if (!this.isDashing) return;
    if (this.playerModifiers.dashDmgPct <= 0) return;
    const atk = StatsSystem.computeAll(this.gameState.player).atk;
    const dmg = Math.max(1, Math.round(atk * this.playerModifiers.dashDmgPct / 100));
    for (const go of this.enemies.getChildren()) {
      const sprite = go as Phaser.Physics.Arcade.Sprite;
      if (!sprite.active || this.dashHitEnemyIds.has(sprite.name)) continue;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y) > 36) continue;
      const ae = this.activeEnemies.get(sprite.name);
      if (!ae || ae.currentHp <= 0) continue;
      this.dashHitEnemyIds.add(sprite.name);
      this.showDamageNumber(sprite.x, sprite.y - 20, dmg, false, ElementType.WIND);
      this.spawnHitParticles(sprite.x, sprite.y, ElementType.WIND);
      this.applyDamageToEnemy(sprite.name, dmg, false);
    }
  }

  // ── SKILLS & ATTACK ──────────────────────────────────────────

  private handleAttackInput() {
    // Auto-fire a buffered attack the moment the cooldown expires.
    // This lets the player spam the attack key freely; the character simply
    // attacks as fast as the animation cooldown allows — no punish, no dead zone.
    if (this.bufferedAttack && this.time.now >= this.attackCooldownUntil) {
      this.bufferedAttack = false;
      this.performBasicAttack();
    }
    if (Phaser.Input.Keyboard.JustDown(this.dashKey)) {
      this.handleDash();
    }
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && !this.menuOpen && !this.isInDialogue && !this.isTraveling) {
      if (this.nearbyNPC) { this.startNPCDialogue(this.nearbyNPC); }
      else if (this.nearbyLootable) { this.interactWithLootable(this.nearbyLootable); }
    }
  }

  private handleSkillInput() {
    const slots = this.gameState.player.equippedSkills;
    const pairs: [Phaser.Input.Keyboard.Key, string | null][] = [
      [this.skillKeys.a, slots.slot1],
      [this.skillKeys.e, slots.slot2],
      [this.skillKeys.r, slots.slot3],
      [this.skillKeys.f, slots.slot4],
    ];
    for (const [key, skillId] of pairs) {
      if (skillId && Phaser.Input.Keyboard.JustDown(key)) {
        this.activateSkill(skillId);
      }
    }
  }

  private performBasicAttack() {
    if (this.playerImmobilized) return; // STUN/FREEZE/SHOCK subi (talents Partie 2)
    const now = this.time.now;

    const weapon = this.gameState.player.equipment.weapon;
    const weaponType = weapon?.weaponType;
    const pattern = (weaponType !== undefined ? ATTACK_PATTERNS[weaponType] : undefined) ?? FISTS_PATTERN;
    const comboConfig = weaponType !== undefined ? COMBO_CONFIGS[weaponType] : undefined;

    // ── BUFFER ───────────────────────────────────────────────────
    // Input received before cooldown ends → buffer; auto-fires in handleAttackInput().
    // No punishment for spam — the player simply waits for the animation cooldown.
    if (now < this.attackCooldownUntil) {
      this.bufferedAttack = true;
      return;
    }

    // ── CHANGEMENT D'ARME ────────────────────────────────────────
    if (weaponType !== this.comboWeaponType) {
      if (this.comboCount > 0) { this.events.emit('combo-broken'); this.burstComboRing(); }
      this.comboCount = 0;
    }

    // ── DEADLINE DE COMBO ────────────────────────────────────────
    // La grâce était mesurée depuis la FIN du cooldown (`lastAttackEnd`), donc la
    // fenêtre totale valait `cooldown/aspd + graceMs` : ACCÉLÉRER LA RÉTRÉCISSAIT.
    // Le joueur rapide était donc PUNI de sa vitesse, alors que la demande est
    // qu'elle soit PLUS PERMISSIVE. (Et faire grandir graceMs avec l'aspd ne suffit
    // pas : à ×1,3 la fenêtre vaudrait encore 774 ms contre 840 de base.)
    //
    // La deadline est désormais posée AU MOMENT DU COUP, sur les valeurs de BASE,
    // sans aucune division par l'aspd : elle ne bouge JAMAIS avec la vitesse.
    // Accélérer ne peut donc plus rien coûter — on ne donne rien de neuf, on
    // arrête simplement de reprendre.
    //
    // Fond du problème : ce qui casse un combo ici n'est pas un raté de rythme
    // (l'input est bufferisé, cf. plus haut), c'est l'ESQUIVE — et un dash coûte un
    // temps FIXE. Toute loi qui rétrécit la fenêtre punit le joueur rapide d'avoir
    // eu le droit de se défendre.
    if (comboConfig && this.comboCount > 0 && now > this.comboDeadline) {
      this.comboCount = 0;
      this.events.emit('combo-broken');
      this.burstComboRing();
    }

    this.comboWeaponType = weaponType;
    this.comboCount++;

    // ── VITESSE D'ATTAQUE ────────────────────────────────────────
    // `cs.aspd` agrège DÉJÀ les substats ASPD_PCT *et* les talents, softcap compris
    // (asymptote 80 → l'aspd permanente tend vers ×1,8 sans l'atteindre).
    // Les buffs TEMPORAIRES se multiplient APRÈS le softcap, PLEINS : un burst doit
    // se sentir plein. Le plafond borne ce qu'on PORTE, pas ce qu'on DÉCLENCHE.
    let aspd = StatsSystem.computeAll(this.gameState.player).aspd;
    // MOVE_25_DASH_ASPD_50_PCT (hidden_skyward_mantle) — fenêtre post-dash.
    if (now < this.dashAspdBuffUntil) aspd *= 1 + PassiveSystem.DASH_ASPD_BUFF_PCT / 100;
    // CRIT_SURGE_ASPD_PCT (talent) — fenêtre de 2 s après un critique. Ce modificateur
    // existait dans TalentSystem et n'était consommé NULLE PART : le talent ne faisait rien.
    if (now < this.critSurgeUntil) aspd *= 1 + this.playerModifiers.critSurgeAspdPct / 100;

    // HEAVY_CD_REDUCTION_PCT (vig_war_march) — GS/HAMMER/AXE uniquement. "Les
    // fenêtres de combo se recalculent" (description) : la réduction s'applique
    // sur le cooldown de BASE (avant aspd), donc comboDeadline plus bas (posé sur
    // cette même base) hérite automatiquement de la réduction.
    const isHeavyAtkWeapon = weaponType === WeaponType.GREATSWORD
      || weaponType === WeaponType.HAMMER
      || weaponType === WeaponType.AXE;
    const effectiveBaseCooldown = isHeavyAtkWeapon
      ? pattern.cooldown * (1 - this.playerModifiers.heavyCdReductionPct / 100)
      : pattern.cooldown;

    // NO_ATTACK_COOLDOWN (hidden_temporal_blade) : plus de cooldown propre à l'arme —
    // plancher à NO_ATTACK_COOLDOWN_FLOOR_MS (pas 0 : un cooldown nul rendait le DPS
    // quasi-infini, borné par le seul débit d'input).
    const noAttackCooldown = PassiveSystem.hasNoAttackCooldown(this.gameState.player.equipment);
    const rawCooldown = noAttackCooldown ? PassiveSystem.NO_ATTACK_COOLDOWN_FLOOR_MS : effectiveBaseCooldown / aspd;

    // ── FINISHER ─────────────────────────────────────────────────
    let finisherFired = false;
    if (comboConfig && this.comboCount >= comboConfig.chainLength) {
      finisherFired = true;
      this.executeFinisherAttack(weaponType, pattern, comboConfig, now, aspd);
      // POST_FINISHER_BUFF (vig_titans_echo) — la chaîne démarre à 2 (au lieu de 0)
      // ET la prochaine attaque normale a une fenêtre de 2.5s pour infliger +50%
      // (consommé dans la branche ATTAQUE NORMALE ci-dessous, cf. postFinisherBuffUntil).
      if (this.playerModifiers.postFinisherBuff) {
        // Clampé à chainLength-2 (PAS chainLength-1, erreur trouvée en playtest) :
        // comboCount++ tourne AU DÉBUT de chaque attaque, avant ce test — donc le
        // coup suivant part de (comboCount+1). Avec chainLength-1, HAMMER
        // (chainLength 2) démarrait à 1 : le TOUT PROCHAIN coup passait à 2 et
        // redéclenchait le finisher SANS AUCUN coup normal entre les deux — boucle
        // de finisher permanente, +50% jamais délivré (le joueur ne voit jamais la
        // branche ATTAQUE NORMALE où postFinisherMult est consommé). Avec
        // chainLength-2, HAMMER démarre à 0 (aucune avance possible sur une chaîne
        // de seulement 2 coups — dégrade proprement vers le rythme normal) ; les
        // armes à chainLength 3 démarrent à 1 (1 coup normal requis avant le
        // prochain finisher, au lieu de 2) : c'est ça, une "avance", pas un
        // deuxième finisher immédiat.
        this.comboCount = Math.max(0, Math.min(2, comboConfig.chainLength - 2));
        this.postFinisherBuffUntil = now + 2500;
        // Sans ceci, comboDeadline resterait à sa valeur PRÉ-finisher (déjà
        // dépassée) : la branche ATTAQUE NORMALE plus haut casserait le combo
        // (comboCount>0 && now>comboDeadline) dès le tout premier coup suivant,
        // annulant comboCount=2 avant même que le joueur ait pu en profiter.
        this.comboDeadline = now + 2500;
      } else {
        this.comboCount = 0;
      }
      // Le PLANCHER D'INTÉGRITÉ s'applique aussi ici, et sur les coups du FINISHER
      // (qui sont souvent plus étalés que ceux de l'attaque normale) : on ne relance
      // jamais une attaque avant que la précédente ait fini de sortir ses coups.
      const rawFinisherCd = noAttackCooldown
        ? PassiveSystem.NO_ATTACK_COOLDOWN_FLOOR_MS
        : rawCooldown * comboConfig.finisher.cooldownMult;
      const finisherCd = effectiveCooldownMs(pattern, aspd, rawFinisherCd, comboConfig.finisher.hits);
      this.lastAttackEnd      = now + finisherCd;
      this.attackCooldownUntil = this.lastAttackEnd;
      // Après un finisher le combo est remis à zéro (ou à 2 avec POST_FINISHER_BUFF,
      // cf. plus haut) : aucune deadline à poser côté finisher lui-même.
      // L'anneau se vide (sans éclat : ce n'est pas une rupture, c'est un ABOUTISSEMENT).
      this.comboGraceMs = 0;
      this.redrawComboRing(this.comboCount, comboConfig.chainLength, weaponType);
      this.spawnSpeedTierVfx(aspd, this.facingAngle);
    } else {
      // ── ATTAQUE NORMALE ──────────────────────────────────────
      // Les temps d'ANIMATION se compressent avec l'aspd (planchers dans
      // attackPatterns.ts) : sans ça, à aspd 1,8, le marteau passerait 55% de son
      // cycle en armement contre 31% aujourd'hui — il aurait l'air BLOQUÉ à charger.
      // En compressant, le ratio reste 31% : la signature rythmique de l'arme tient.
      const windupMs = effectiveWindupMs(pattern, aspd);

      // POST_FINISHER_BUFF — consommé UNE FOIS ici, au dispatch de CETTE attaque
      // (pas par coup individuel dans un swing multi-hits) : snapshot avant les
      // delayedCall plus bas, jamais relu à l'intérieur (état pourrait changer
      // entre le dispatch et l'exécution réelle du coup).
      const postFinisherMult = this.playerModifiers.postFinisherBuff && now < this.postFinisherBuffUntil
        ? 1.5 : 1;
      if (postFinisherMult > 1) this.postFinisherBuffUntil = 0;

      if (pattern.isProjectile) {
        // BOW : rectangle physique, pas un cône.
        if (windupMs > 0) this.spawnWindupVfx(windupMs);
        if (windupMs === 0) {
          this.fireArrowProjectile(postFinisherMult);
        } else {
          this.time.delayedCall(windupMs, () => {
            if (!this.isTraveling) this.fireArrowProjectile(postFinisherMult);
          });
        }
      } else {
        if (windupMs > 0) this.spawnWindupVfx(windupMs);
        for (let i = 0; i < pattern.hits.length; i++) {
          const hit = pattern.hits[i];
          const fireDelay = windupMs + effectiveHitDelayMs(hit.delay, aspd);
          const hitIndex  = i;
          const doHit = () => {
            if (this.isTraveling) return;
            const tx = this.player.x + Math.cos(this.facingAngle) * hit.range * 0.7;
            const ty = this.player.y + Math.sin(this.facingAngle) * hit.range * 0.7;
            this.spawnWeaponSwingVfx(this.player.x, this.player.y, tx, ty, weaponType, hitIndex, aspd);
            this.executeHitInCone(hit.range, hit.halfArc, hit.damageMultiplier * postFinisherMult);
          };
          if (fireDelay === 0) doHit();
          else this.time.delayedCall(fireDelay, doHit);
        }
      }

      const cooldown = effectiveCooldownMs(pattern, aspd, rawCooldown);
      this.lastAttackEnd      = now + cooldown;
      this.attackCooldownUntil = this.lastAttackEnd;

      // Deadline posée MAINTENANT, sur les valeurs de BASE (aucune division par
      // l'aspd) et STOCKÉE — donc robuste à un buff qui expirerait entre deux coups.
      if (comboConfig) {
        this.comboGraceMs  = comboConfig.graceMs * this.playerModifiers.comboGraceMult;
        this.comboDeadline = now + effectiveBaseCooldown + this.comboGraceMs;
        this.redrawComboRing(this.comboCount, comboConfig.chainLength, weaponType);
      }
      this.spawnSpeedTierVfx(aspd, this.facingAngle);
    }

    // ── ÉVÉNEMENT COMBO HUD ──────────────────────────────────────
    // BUG3 fix: ne pas émettre combo-changed si le finisher a réinitialisé l'état à
    // 0 — SAUF si POST_FINISHER_BUFF a posé un comboCount>0 (2, clampé), auquel cas
    // le HUD doit refléter ce nouveau départ plutôt que rester sur le fade-out de
    // 'finisher-executed' (sinon désync entre l'anneau en jeu, correct, et les pips
    // HUD, qui retombaient toujours à vide — trouvé en review).
    if (!finisherFired || this.comboCount > 0) {
      this.events.emit('combo-changed', {
        count: this.comboCount,
        max: comboConfig?.chainLength ?? 0,
        weaponType,
      });
    }
  }

  private executeHitInCone(range: number, halfArc: number, damageMultiplier = 1.0) {
    const hits = this.findEnemiesInCone(range, halfArc);
    if (hits.length === 0) return;

    // Talent modifiers — recalculés après chaque unlock/respec, pas à chaque frame.
    // BUG6 fix: meleeDmgMult ne s'applique pas aux armes à sort (STAFF).
    const currentWeaponType = this.gameState.player.equipment.weapon?.weaponType;
    const isSpellWeapon = currentWeaponType === WeaponType.STAFF;
    const appliedMeleeMult = isSpellWeapon ? 1.0 : this.playerModifiers.meleeDmgMult;
    // BLOCKER-B: comboStackDmg — bonus cumulatif par coup dans la chaîne
    const stackBonus = 1 + this.comboCount * this.playerModifiers.comboStackDmg / 100;

    // Calculé une seule fois par cône (et non par cible touchée) — StatsSystem.computeAll
    // itère tout l'équipement/substats, coûteux à répéter pour une arme qui touche une foule.
    const cs = StatsSystem.computeAll(this.gameState.player);

    let anyCrit = false;
    for (const sprite of hits) {
      const activeEnemy = this.activeEnemies.get(sprite.name);
      if (!activeEnemy) continue;
      // Snapshot BEFORE CombatSystem applies its own (unmultiplied) damage — it clamps
      // to 0 internally, so any hit whose unmultiplied damage would overkill loses the
      // "how much was it over" information. Recomputing the multiplied final damage
      // from this pre-hit snapshot (instead of patching a delta onto the already-clamped
      // currentHp) is what actually fixes the "enemy survives normal hits" bug: low
      // damageMultiplier hits (most non-finisher weapon hits are <1.0) used to have their
      // base damage clamp currentHp to 0, then get "corrected" back up past where the
      // real (smaller, multiplied) damage should have left it — sometimes back above 0
      // entirely, making the enemy unkillable by anything but a >=1.0 finisher hit.
      const hpBeforeHit = activeEnemy.currentHp;
      const result = CombatSystem.playerAttack(this.gameState.player, activeEnemy, cs);

      // SAME_TARGET_STACK_10_PCT (hidden_serpentgrip_gauntlets) — +10%/coup
      // consécutif sur la même cible (état muté en place, reset si la cible change).
      const sameTargetMult = PassiveSystem.getSameTargetStackMultiplier(
        this.gameState.player.equipment, this.sameTargetStackState, activeEnemy.instanceId, this.time.now,
      );
      // Talents Partie 1 : synergie Brûlure (ATK_PER_BURNING_PCT/BURNING_PACK_DMG_PCT,
      // globales) + bonus vs contrôle dur (STUN_DMG_PCT) + vulnérabilité SHOCK
      // (posée sur CETTE cible) — combinés au même niveau que les autres multiplicateurs.
      const burningSynergyMult = this.getBurningSynergyMult();
      const stunDmgMult = this.getStunDmgMult(activeEnemy);
      const shockVulnMult = this.getShockVulnMult(activeEnemy);
      const lowHpAtkMult = this.getLowHpAtkMult();
      // Combiné : multiplicateur du pattern + talents mêlée + bonus de chaîne + stack cible.
      const finalDamage = Math.round(
        result.damage * damageMultiplier * appliedMeleeMult * stackBonus * sameTargetMult
          * burningSynergyMult * stunDmgMult * shockVulnMult * lowHpAtkMult,
      );
      // ÉCHO — canal DIRECT #1/3 (mêlée). Plusieurs cibles dans la même salve de cône
      // sont gérées par le batching de stageEchoAnchor (clé = this.time.now).
      this.registerEchoDamage(activeEnemy.instanceId, finalDamage, true, result.isCrit);
      const isDummy = this.isInvincibleDummy(activeEnemy.enemyId);
      activeEnemy.currentHp = isDummy
        ? activeEnemy.maxHp
        : Math.max(0, Math.min(activeEnemy.maxHp, hpBeforeHit - finalDamage));
      const isKill = !isDummy && activeEnemy.currentHp <= 0;

      this.showEnemyDamageNumber(activeEnemy.instanceId, sprite.x, sprite.y - 20, finalDamage, result.isCrit, result.element);
      this.spawnHitParticles(sprite.x, sprite.y, result.element);
      this.applyHitFeedback(sprite, activeEnemy, finalDamage);
      // Le coup normal ne secoue plus la CAMÉRA : il pousse l'ENNEMI (5 px, 70 ms).
      // Le feedback passe de l'écran au monde — même punch, zéro coût de lisibilité.
      if (!isKill) this.spawnHitRecoil(sprite, this.facingAngle);
      if (result.isCrit) anyCrit = true;
      this.tryCritCdReset(result.isCrit);
      this.tryCritSurge(result.isCrit);
      if (isKill) {
        this.onEnemyKilled(activeEnemy, sprite);
      } else {
        this.addMagmaStackIfEquipped(activeEnemy.instanceId);
        this.checkStagger(sprite, activeEnemy, finalDamage);
        // Talents Partie 1 : statuts sur coup + arc en chaîne (pas sur un
        // coup qui tue — la cible n'existe plus pour porter un statut).
        this.applyOnHitTalentEffects(activeEnemy, finalDamage, false, result.element, result.isCrit);
      }
    }

    // Le micro-shake du coup banal (40 ms / 0.002) est SUPPRIMÉ — cf. requestShake.
    if (anyCrit) this.requestShake(120, 0.007, GameScene.SHAKE_PRIO.CRIT);
  }

  /** CRIT_SURGE_ASPD_PCT — un critique ouvre une fenêtre de vitesse d'attaque (2 s, refresh, no-stack). */
  private tryCritSurge(isCrit: boolean) {
    if (!isCrit || this.playerModifiers.critSurgeAspdPct <= 0) return;
    this.critSurgeUntil = this.time.now + 2000;
  }

  private findEnemiesInCone(range: number, halfArc: number): Phaser.Physics.Arcade.Sprite[] {
    const hits: Phaser.Physics.Arcade.Sprite[] = [];
    for (const go of this.enemies.children.getArray()) {
      const sprite = go as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (dist > range) continue;
      const angleToEnemy = Math.atan2(sprite.y - this.player.y, sprite.x - this.player.x);
      let diff = angleToEnemy - this.facingAngle;
      while (diff > Math.PI)  diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      if (Math.abs(diff) <= halfArc) hits.push(sprite);
    }
    return hits;
  }

  // ── BOW PROJECTILE ───────────────────────────────────────────
  // Un rectangle transparent suit la trajectoire de la flèche à chaque frame.
  // La détection de collision se fait manuellement dans updateArrowProjectiles()
  // — plus fiable que physics.add.overlap qui dépend d'une texture valide.

  private fireArrowProjectile(dmgMult = 1.0) {
    const mods = this.playerModifiers;
    // BOW_RANGE_DMG_PCT (ins_hunters_eye) — bundle "vitesse de projectile +20%" :
    // pas de champ numérique séparé pour cette partie de la description, la seule
    // source de ce bonus est ce talent (gate sur sa présence, pas sur sa valeur).
    const SPEED = 600 * (mods.bowRangeDmgPct > 0 ? 1.20 : 1);
    // PROJECTILE_RANGE_PCT (zephyr_wind_arrows) — portée de TOUS les projectiles
    // (flèches BOW normales ET finisher, seul canal qui passe par cette fonction).
    const RANGE = 460 * (1 + mods.projectileRangePct / 100);
    const angle = this.facingAngle;

    // Point de collision : rectangle transparent déplacé manuellement chaque frame
    const rect = this.add.rectangle(this.player.x, this.player.y, 16, 8, 0xffffff, 0);
    const travelMs = (RANGE / SPEED) * 1000; // ~767ms à vitesse/portée de base
    this._activeArrows.push({
      rect,
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
      hit: false,
      destroyAt: this.time.now + travelMs,
      // PROJECTILE_DMG_PCT (zephyr_wind_arrows) — dégâts de TOUS les projectiles.
      dmgMult: dmgMult * (1 + mods.projectileDmgPct / 100),
    });

    // VFX cosmétique — voyage en parallèle, purement visuel
    const toX = this.player.x + Math.cos(angle) * RANGE * 0.7;
    const toY = this.player.y + Math.sin(angle) * RANGE * 0.7;
    this.spawnArrowVfx(this.player.x, this.player.y, toX, toY, angle, 0xddcc77);
  }

  private updateArrowProjectiles(dt: number) {
    if (this._activeArrows.length === 0) return;
    // Calculé une fois par frame plutôt que par flèche touchée — cf. executeHitInCone.
    const cs = StatsSystem.computeAll(this.gameState.player);

    for (let i = this._activeArrows.length - 1; i >= 0; i--) {
      const arrow = this._activeArrows[i];

      if (arrow.hit || this.time.now >= arrow.destroyAt) {
        if (arrow.rect.active) arrow.rect.destroy();
        this._activeArrows.splice(i, 1);
        continue;
      }

      // Déplacer le point de collision frame par frame
      arrow.rect.x += arrow.vx * dt;
      arrow.rect.y += arrow.vy * dt;

      // Vérifier chaque ennemi vivant — test de recouvrement rectangle contre le VRAI
      // corps physique (déjà ajusté au contenu visible du sprite, cf. fitSpriteToContent),
      // pas un rayon fixe depuis le centre : un rayon unique ratait les silhouettes
      // larges/allongées et acceptait des touches trop généreuses sur les petites
      // (bug reporté : une flèche ne touchait pas certaines parties du corps).
      for (const go of this.enemies.getChildren()) {
        const sprite = go as Phaser.Physics.Arcade.Sprite;
        if (!sprite.active) continue;
        const body = sprite.body as Phaser.Physics.Arcade.Body | null;
        if (!body) continue;
        const enemyRect = new Phaser.Geom.Rectangle(body.left, body.top, body.width, body.height);
        const arrowRect  = new Phaser.Geom.Rectangle(arrow.rect.x - 8, arrow.rect.y - 4, 16, 8);
        if (!Phaser.Geom.Rectangle.Overlaps(enemyRect, arrowRect)) continue;

        // Impact — un seul ennemi touché
        arrow.hit = true;
        arrow.rect.destroy();
        this._activeArrows.splice(i, 1);

        const activeEnemy = this.activeEnemies.get(sprite.name);
        if (!activeEnemy) break;

        // RANGED_CRIT_PCT (zephyr_eagle_eye) — bonus de critique conditionnel à la
        // distance, mesurée au moment de l'impact. cs est PARTAGÉ (calculé une fois
        // par frame pour toutes les flèches) : jamais muté directement, un clone
        // ponctuel avec crit ajusté évite de faire fuiter le bonus vers d'autres tirs
        // résolus la même frame.
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
        const mods = this.playerModifiers;
        const csForHit = dist > 200 && mods.rangedCritPct > 0
          ? { ...cs, crit: cs.crit + mods.rangedCritPct }
          : cs;

        // See executeHitInCone() for why we snapshot HP before CombatSystem's own
        // (unmultiplied) clamped subtraction rather than patch a delta onto it.
        const hpBeforeHit = activeEnemy.currentHp;
        const result = CombatSystem.playerAttack(this.gameState.player, activeEnemy, csForHit);
        // SAME_TARGET_STACK_10_PCT (hidden_serpentgrip_gauntlets) — cf. executeHitInCone.
        const sameTargetMult = PassiveSystem.getSameTargetStackMultiplier(
          this.gameState.player.equipment, this.sameTargetStackState, activeEnemy.instanceId, this.time.now,
        );
        // Talents Partie 1 : mêmes synergies que executeHitInCone.
        const burningSynergyMult = this.getBurningSynergyMult();
        const stunDmgMult = this.getStunDmgMult(activeEnemy);
        const shockVulnMult = this.getShockVulnMult(activeEnemy);
        // BOW_RANGE_DMG_PCT (ins_hunters_eye) — même principe que RANGED_CRIT_PCT,
        // seuil de distance différent (250px).
        const rangeDmgMult = dist > 250 && mods.bowRangeDmgPct > 0 ? 1 + mods.bowRangeDmgPct / 100 : 1;
        const lowHpAtkMult = this.getLowHpAtkMult();
        // BUG4 fix: apply the dmgMult from the finisher (or 1.0 for normal shots)
        let arrowFinalDmg = Math.round(
          result.damage * arrow.dmgMult * sameTargetMult * burningSynergyMult * stunDmgMult
            * shockVulnMult * rangeDmgMult * lowHpAtkMult,
        );
        // BOW_ELEMENTAL_ARROWS (arc_imbued_arrows) — "Si INT ≥ 10" : bonus additif de
        // 10% Magic ATK, pas un multiplicateur (les flèches BOW scalent sur l'ATK
        // physique — un multiplicateur sur du Magic ATK n'aurait pas de sens ici).
        if (mods.bowElementalArrows && this.gameState.player.attributes.int >= 10) {
          arrowFinalDmg += Math.round(cs.matk * 0.10);
        }
        // ÉCHO — canal DIRECT #2/3 (flèches). Une flèche ne touche qu'un seul ennemi
        // (break juste après), donc aucun batching multi-cible n'est nécessaire ici.
        this.registerEchoDamage(activeEnemy.instanceId, arrowFinalDmg, true, result.isCrit);
        const isArrowDummy = this.isInvincibleDummy(activeEnemy.enemyId);
        activeEnemy.currentHp = isArrowDummy
          ? activeEnemy.maxHp
          : Math.max(0, Math.min(activeEnemy.maxHp, hpBeforeHit - arrowFinalDmg));
        const arrowIsKill = !isArrowDummy && activeEnemy.currentHp <= 0;
        this.showEnemyDamageNumber(activeEnemy.instanceId, sprite.x, sprite.y - 20, arrowFinalDmg, result.isCrit, result.element);
        this.spawnHitParticles(sprite.x, sprite.y, result.element);
        this.applyHitFeedback(sprite, activeEnemy, arrowFinalDmg);
        if (!arrowIsKill) this.spawnHitRecoil(sprite, Math.atan2(arrow.vy, arrow.vx));
        if (result.isCrit) this.requestShake(120, 0.007, GameScene.SHAKE_PRIO.CRIT);
        this.tryCritCdReset(result.isCrit);
        this.tryCritSurge(result.isCrit);
        if (arrowIsKill) this.onEnemyKilled(activeEnemy, sprite);
        else {
          this.addMagmaStackIfEquipped(activeEnemy.instanceId);
          this.checkStagger(sprite, activeEnemy, arrowFinalDmg);
          this.applyOnHitTalentEffects(activeEnemy, arrowFinalDmg, false, result.element, result.isCrit);
        }
        break;
      }
    }
  }

  private activateSkill(skillId: string) {
    if (this.playerImmobilized) return; // STUN/FREEZE/SHOCK subi (talents Partie 2)
    const skill = SkillSystem.getSkill(skillId);
    if (!skill) return;
    if (!SkillSystem.canUseSkill(this.gameState.player, skillId, this.cooldowns, this.playerModifiers)) return;

    const nearest = this.findNearestEnemy(skill.range ?? 200);
    const activeEnemy = nearest ? this.activeEnemies.get(nearest.name) : undefined;

    // Snapshot AVANT CombatSystem.playerSkill — même raison que executeHitInCone/
    // updateArrowProjectiles : CombatSystem mute currentHp en interne avec le
    // montant NON multiplié par les synergies talents Partie 1 (burningSynergy/
    // stunDmg/shockVuln, calculées côté scène) — il faut recalculer depuis ce
    // snapshot plutôt que patcher un delta sur un currentHp déjà clampé.
    const hpBeforeHit = activeEnemy?.currentHp;
    // Talents Partie 1 : synergies calculées AVANT l'appel, pas après — sinon un
    // sort qui pose lui-même STUN/FREEZE/BURN sur sa cible (CombatSystem.playerSkill
    // mute statusEffects EN INTERNE) bénéficierait de son propre statut fraîchement
    // posé sur CE MÊME cast (auto-synergie non voulue, trouvée en review).
    const burningSynergyMult = this.getBurningSynergyMult();
    const stunDmgMult = activeEnemy ? this.getStunDmgMult(activeEnemy) : 1;
    const shockVulnMult = activeEnemy ? this.getShockVulnMult(activeEnemy) : 1;
    const lowHpAtkMult = this.getLowHpAtkMult();
    const result = CombatSystem.playerSkill(this.gameState.player, skill, activeEnemy, this.playerModifiers);
    // CombatSystem.playerSkill mute target.currentHp EN INTERNE (systems/ reste
    // agnostique du concept de dev-tool) — le Mannequin de Fer est donc restauré
    // ICI, côté scène, et result.isKill (calculé avant restauration) est ignoré
    // pour lui plutôt que recâblé dans CombatSystem.
    const isSkillDummy = !!activeEnemy && this.isInvincibleDummy(activeEnemy.enemyId);
    if (isSkillDummy && activeEnemy) activeEnemy.currentHp = activeEnemy.maxHp;
    if (result) {
      if (result.damage > 0 && nearest && activeEnemy) {
        const extraMult = burningSynergyMult * stunDmgMult * shockVulnMult * lowHpAtkMult;
        const finalSkillDmg = extraMult === 1 ? result.damage : Math.max(1, Math.round(result.damage * extraMult));
        if (extraMult !== 1 && !isSkillDummy && hpBeforeHit !== undefined) {
          activeEnemy.currentHp = Math.max(0, Math.min(activeEnemy.maxHp, hpBeforeHit - finalSkillDmg));
        }
        // Toujours re-dérivé de currentHp (jamais result.isKill directement) —
        // reste correct que extraMult ait bougé la cible ou non.
        const isSkillKill = !isSkillDummy && activeEnemy.currentHp <= 0;

        // ÉCHO — canal DIRECT #3/3 (sorts). activateSkill ne cible jamais qu'un seul
        // ennemi (this.findNearestEnemy) : aucun batching multi-cible nécessaire.
        this.registerEchoDamage(activeEnemy.instanceId, finalSkillDmg, true, result.isCrit);
        if (skill.isProjectile) {
          this.spawnCosmeticProjectile(this.player.x, this.player.y, nearest.x, nearest.y, skill.element);
        }
        this.showDamageNumber(nearest.x, nearest.y - 20, finalSkillDmg, result.isCrit, skill.element);
        this.spawnHitParticles(nearest.x, nearest.y, skill.element);
        if (result.isCrit) this.requestShake(150, 0.009, GameScene.SHAKE_PRIO.CRIT);
        this.applyHitFeedback(nearest, activeEnemy, finalSkillDmg);
        this.tryCritCdReset(result.isCrit);
        if (isSkillKill) {
          this.onEnemyKilled(activeEnemy, nearest);
        } else {
          this.addMagmaStackIfEquipped(activeEnemy.instanceId);
          this.checkStagger(nearest, activeEnemy, finalSkillDmg);
          // FREEZE_CHANCE_PCT (abyssal_ice_veil) est réservé aux sorts — isSpell=true.
          this.applyOnHitTalentEffects(activeEnemy, finalSkillDmg, true, result.element, result.isCrit);
        }

        // SKILL_ECHO_50_PCT (hidden_stormheart_staff) — rejoue la compétence à 50%
        // des dégâts après un court délai sur la MÊME cible (si toujours en vie),
        // sans reconsommer de mana ni relancer le cooldown (coup "gratuit").
        if (PassiveSystem.hasSkillEcho(this.gameState.player.equipment) && finalSkillDmg > 0) {
          const echoTargetId = activeEnemy.instanceId;
          const echoElement = skill.element;
          const echoDmg = Math.round(finalSkillDmg * PassiveSystem.SKILL_ECHO_PCT / 100);
          this.time.delayedCall(PassiveSystem.SKILL_ECHO_DELAY_MS, () => {
            if (this.isTraveling) return;
            const echoTarget = this.activeEnemies.get(echoTargetId);
            if (!echoTarget || echoTarget.currentHp <= 0) return;
            const echoSprite = this.enemies.getChildren().find(
              (c) => (c as Phaser.Physics.Arcade.Sprite).name === echoTargetId,
            ) as Phaser.Physics.Arcade.Sprite | undefined;
            if (echoSprite?.active) {
              this.showDamageNumber(echoSprite.x, echoSprite.y - 20, echoDmg, false, echoElement);
              this.spawnHitParticles(echoSprite.x, echoSprite.y, echoElement);
            }
            this.applyPassiveDamageToEnemy(echoTargetId, echoDmg);
          });
        }
      }
      if (result.damage === 0 && skill.effect?.healPercent) {
        this.showHealNumber(this.player.x, this.player.y - 20,
          Math.floor(this.gameState.player.stats.maxHp * (skill.effect.healPercent ?? 0)));
      }
      // SHIELD_SKILL_PCT — stone_shield/ice_barrier accordent un bouclier plat
      // (même pool sans durée que LOW_HP_SHIELD_30_PCT, maybeTriggerLowHpShield) ;
      // Math.max plutôt qu'écrasement : ne pas gâcher un bouclier existant plus
      // généreux (ex. LOW_HP_SHIELD encore actif) en le recastant trop tôt.
      if (result.shieldAmount !== undefined) {
        this.playerShieldHp = Math.max(this.playerShieldHp, result.shieldAmount);
      }
    }

    SkillSystem.startCooldown(this.cooldowns, skillId, this.gameState.player);
  }

  // ── PUBLIC API FOR SUBSCENES ─────────────────────────────────

  public setShopOpen(open: boolean) { this.isInDialogue = open; }

  public setPaused(paused: boolean) {
    this.menuOpen = paused;
    if (paused) {
      this.physics.world.pause();
      // physics.world.pause() arrête les DÉPLACEMENTS (corps physiques) mais pas
      // les animations sprite (idle des monstres, du joueur...) : celles-ci
      // tournent sur l'AnimationManager global de Phaser, indépendant de la
      // physique — retrouvé en playtest ("les idles continuent en pause").
      this.anims.pauseAll();
    } else {
      this.physics.world.resume();
      this.anims.resumeAll();
    }
  }

  /** RunBagScene (consumeItem) a besoin des mêmes modificateurs que tout autre
   *  soin du jeu (HEALING_RECEIVED_PCT) — champ privé, exposé en lecture seule. */
  public getPlayerModifiers(): TalentModifiers {
    return this.playerModifiers;
  }

  /** RunBagScene enchaîne close() (fondu ~170ms) puis travelToZone() (fondu
   *  ~400ms+) sur confirmDescend/confirmExfiltrate/confirmContinue — sans ce
   *  garde, le shutdown() du fondu court réactive la physique (setPaused(false))
   *  EN PLEIN MILIEU du fondu long, qui compte justement sur la physique en
   *  pause pendant tout le chargement (cf. l'invariant documenté plus haut dans
   *  performZoneTransition). Exposé en lecture seule, jamais écrit hors de
   *  travelToZone/performZoneTransition. */
  public get isTravelingNow(): boolean {
    return this.isTraveling;
  }

  public openInventory() {
    if (this.scene.isActive('InventoryScene')) return;
    if (this.scene.isActive('SkillScene')) { this.setPaused(false); this.scene.stop('SkillScene'); }
    if (this.scene.isActive('PityScene'))  { this.setPaused(false); this.scene.stop('PityScene'); }
    this.setPaused(true);
    this.scene.launch('InventoryScene', { gameScene: this });
  }

  public openSkills() {
    if (this.scene.isActive('SkillScene')) return;
    if (this.scene.isActive('InventoryScene')) { this.setPaused(false); this.scene.stop('InventoryScene'); }
    if (this.scene.isActive('PityScene'))      { this.setPaused(false); this.scene.stop('PityScene'); }
    this.setPaused(true);
    this.scene.launch('SkillScene', { gameScene: this });
  }

  public openPity() {
    if (this.scene.isActive('PityScene')) return;
    if (this.scene.isActive('InventoryScene')) { this.setPaused(false); this.scene.stop('InventoryScene'); }
    if (this.scene.isActive('SkillScene'))     { this.setPaused(false); this.scene.stop('SkillScene'); }
    this.setPaused(true);
    this.scene.launch('PityScene', { gameScene: this });
  }

  /** RunSystem (Phase 6/7) — packing pré-run, inventaire intra-run ou arbitrage
   *  post-boss, cf. RunBagScene. */
  public openRunBagScene(mode: 'pack' | 'view' | 'extract') {
    if (this.scene.isActive('RunBagScene')) return;
    if (this.scene.isActive('InventoryScene')) { this.setPaused(false); this.scene.stop('InventoryScene'); }
    if (this.scene.isActive('SkillScene'))     { this.setPaused(false); this.scene.stop('SkillScene'); }
    if (this.scene.isActive('PityScene'))      { this.setPaused(false); this.scene.stop('PityScene'); }
    this.setPaused(true);
    this.scene.launch('RunBagScene', { gameScene: this, mode });
  }

  /**
   * BUG préexistant (trouvé pendant le chantier « Partie 2 des talents ») :
   * `this.playerModifiers` n'était calculé QU'UNE FOIS, dans le bloc de reset de
   * `init()` — aucun autre point du fichier ne le recalculait. Débloquer un talent
   * ou faire un respec EN COURS DE RUN n'avait donc aucun effet sur les flags
   * spéciaux (meleeDmgMult, comboStackDmg, windupArmor, heavyFinisherBonus,
   * skillDmgMult, magicDmgMult, projectileSkillMult, lightFinisherBleed,
   * critSurgeAspdPct, killHealPct, dashPreservesCombo, comboGraceMult,
   * moveSpeedMult) tant que la scène n'était pas rechargée — les stats simples
   * (ATK%/DEF%/CRIT%, via StatsSystem.computeAll → getStatContribs) restaient,
   * elles, bien live, d'où la découverte tardive. Appelé par SkillScene juste
   * après un unlock/respec réussi.
   */
  public refreshTalentModifiers() {
    this.playerModifiers = TalentSystem.getModifiers(this.gameState.player);
  }

  public goToMainMenu() {
    if (this.isTraveling) return;
    this.isTraveling = true;
    this.physics.world.pause();

    // Stop overlay scenes immediately
    for (const key of ['PauseScene', 'InventoryScene', 'SkillScene', 'PityScene', 'DialogueScene', 'ShopScene', 'BestiaryScene', 'ArsenalScene']) {
      if (this.scene.isActive(key) || this.scene.isPaused(key)) this.scene.stop(key);
    }

    // Reset menu flag so the scene can run its update + camera fade correctly.
    this.menuOpen = false;

    this.time.delayedCall(0, () => {
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          if (this.scene.isActive('UIScene') || this.scene.isPaused('UIScene')) {
            this.scene.stop('UIScene');
          }
          this.time.delayedCall(0, () => this.scene.start('MainMenuScene'));
        },
      );
      this.cameras.main.fade(300, 0, 0, 0);
    });
  }

  public applyKeyBindings(b: KeyBindings) {
    const kb = this.input.keyboard!;
    this.wasd = {
      up:    kb.addKey(b.up),
      down:  kb.addKey(b.down),
      left:  kb.addKey(b.left),
      right: kb.addKey(b.right),
    };
    // window.addEventListener bypasses every Phaser keyboard layer — guaranteed
    // delivery regardless of canvas focus, plugin state, or localStorage corruption.
    // Always remove the previous handler before registering a new one.
    if (this._attackHandler) {
      window.removeEventListener('keydown', this._attackHandler);
    }
    this._attackHandler = (e: KeyboardEvent) => {
      if (e.keyCode === b.attack && !this.menuOpen && !this.isInDialogue && !this.isTraveling) {
        this.performBasicAttack();
      }
    };
    window.addEventListener('keydown', this._attackHandler);
    // Alt attack — same window listener pattern, separate handler for H key.
    if (this._altAttackHandler) {
      window.removeEventListener('keydown', this._altAttackHandler);
    }
    this._altAttackHandler = (e: KeyboardEvent) => {
      if (e.keyCode === b.altAttack && !this.menuOpen && !this.isInDialogue && !this.isTraveling) {
        this.performAltAttack();
      }
    };
    window.addEventListener('keydown', this._altAttackHandler);
    // Interact — clé Phaser vérifiée dans update() (JustDown synchrone avec la physique).
    // N'utilise PAS window.addEventListener : nearbyLootable est reset en fin d'update,
    // un handler DOM asynchrone le verrait toujours null.
    this.interactKey = kb.addKey(b.interact);
    this.interactKeyCode = b.interact;
    this.dashKey   = kb.addKey(b.dash);
    this.skillKeys = {
      a: kb.addKey(b.skill1),
      e: kb.addKey(b.skill2),
      r: kb.addKey(b.skill3),
      f: kb.addKey(b.skill4),
    };
    // Rewire inventory / skill / pity menu keys with their handlers
    this.inventoryKey?.removeAllListeners();
    this.skillMenuKey?.removeAllListeners();
    this.pityKey?.removeAllListeners();
    this.inventoryKey = kb.addKey(b.inventory);
    this.skillMenuKey = kb.addKey(b.skills);
    this.pityKey      = kb.addKey(b.pity);
    // Fermeture (re-toggle) : via close() — animation symétrique de l'ouverture.
    // BASCULE d'un écran vers l'autre : stop BRUT conservé volontairement — le
    // nouvel écran se lance dans la même frame par-dessus, et le setPaused(false)
    // différé d'un close() animé tomberait APRÈS son setPaused(true) → jeu
    // dé-pausé sous l'overlay. (Stopper la scène tue le tween de fermeture, donc
    // aucun onClosed orphelin ne survit à une bascule pendant l'animation.)
    this.inventoryKey.on('down', () => {
      // RunSystem : pendant une run active, la touche Inventaire ouvre le sac de
      // run (RunBagScene mode 'view') — JAMAIS la banque de Grievy Town. C'est
      // l'inventaire "intra-run" distinct demandé dès le début du chantier
      // (confirmé dans ROGUELITE_POC.md — deux interfaces séparées).
      if (this.gameState.run?.active) {
        if (this.scene.isActive('RunBagScene')) {
          const bag = this.scene.get('RunBagScene') as RunBagScene;
          // 'pack'/'extract' sont des écrans BLOQUANTS (packing avant descente,
          // choix post-boss) — les fermer via cette touche annexe perdrait la
          // décision en cours (BLOCKER trouvé en revue : fermer l'écran
          // d'extraction ainsi softlockait la run à vie, aucun autre point du
          // code ne le rouvre). Seul 'view' (simple consultation) peut re-toggle.
          if (bag.currentMode === 'view') bag.close();
          return;
        }
        this.openRunBagScene('view');
        return;
      }
      // RunBagScene peut être ouverte en mode 'pack' même si run n'est pas
      // encore active (avant la confirmation "Descendre") — ne jamais empiler
      // InventoryScene par-dessus.
      if (this.scene.isActive('RunBagScene')) return;
      if (this.scene.isActive('InventoryScene')) { (this.scene.get('InventoryScene') as InventoryScene).close(); return; }
      if (this.scene.isActive('SkillScene'))     { this.setPaused(false); this.scene.stop('SkillScene'); }
      if (this.scene.isActive('PityScene'))      { this.setPaused(false); this.scene.stop('PityScene'); }
      this.setPaused(true);
      this.scene.launch('InventoryScene', { gameScene: this });
    });
    this.skillMenuKey.on('down', () => {
      // RunBagScene ('pack'/'extract' bloquants, ou 'view' consultatif) ne doit
      // jamais être empilée/masquée par un autre overlay — même raison que ci-dessus.
      if (this.scene.isActive('RunBagScene')) return;
      if (this.scene.isActive('SkillScene'))     { (this.scene.get('SkillScene') as SkillScene).close(); return; }
      if (this.scene.isActive('InventoryScene')) { this.setPaused(false); this.scene.stop('InventoryScene'); }
      if (this.scene.isActive('PityScene'))      { this.setPaused(false); this.scene.stop('PityScene'); }
      this.setPaused(true);
      this.scene.launch('SkillScene', { gameScene: this });
    });
    this.pityKey.on('down', () => {
      if (this.scene.isActive('RunBagScene')) return;
      if (this.scene.isActive('PityScene')) { (this.scene.get('PityScene') as PityScene).close(); return; }
      // BASCULE (pas re-toggle) : stop() brut, PAS close() animé — même raison
      // que ci-dessus (inventoryKey/skillMenuKey) : un close() différerait
      // setPaused(false) après le setPaused(true) de PityScene qui suit tout de
      // suite → jeu dé-pausé sous le panneau.
      if (this.scene.isActive('InventoryScene')) { this.setPaused(false); this.scene.stop('InventoryScene'); }
      if (this.scene.isActive('SkillScene'))     { this.setPaused(false); this.scene.stop('SkillScene'); }
      this.setPaused(true);
      this.scene.launch('PityScene', { gameScene: this });
    });
  }

  // ── NPC ──────────────────────────────────────────────────────

  private startNPCDialogue(npcId: string) {
    const npc = NPC_MAP[npcId];
    if (!npc) return;
    this.isInDialogue = true;
    this.scene.launch('DialogueScene', {
      npc,
      player: this.gameState.player,
      world: this.gameState.world,
      onClose: () => {
        this.isInDialogue = false;
        const flags = this.gameState.player.flags;

        if (flags['save_game']) {
          delete flags['save_game'];
          SaveSystem.save(this.gameState, this.gameState.saveSlot);
          this.events.emit('show_notification', t('notif.saved'));
        }
        if (flags['rest_inn']) {
          delete flags['rest_inn'];
          if (this.gameState.player.gold >= 20) {
            this.gameState.player.gold -= 20;
            this.gameState.player.stats.hp   = this.gameState.player.stats.maxHp;
            this.gameState.player.stats.mana = this.gameState.player.stats.maxMana;
            this.events.emit('player_update', this.gameState.player);
            this.events.emit('show_notification', t('notif.rest_done'));
          } else {
            this.events.emit('show_notification', t('notif.rest_no_gold'));
          }
        }

        // open_shop / open_shop_<npcId>: set by NPC dialogue trigger
        const shopFlagKey = Object.keys(flags).find(k => k === 'open_shop' || k.startsWith('open_shop_'));
        if (shopFlagKey) {
          // Derive npcId from flag name (open_shop_theron → theron) or fall back to current npc
          const shopNpcId = shopFlagKey.startsWith('open_shop_') ? shopFlagKey.slice('open_shop_'.length) : npcId;
          delete flags[shopFlagKey];
          this.isInDialogue = true;
          this.scene.launch('ShopScene', { gameScene: this, npcId: shopNpcId });
        }

        // open_craft / open_craft_<npcId>: set by forge/tailor NPC dialogue trigger
        // Re-uses ShopScene since CraftScene n'existe pas encore — l'inventaire
        // de la boutique du forgeron affiche ses items vendus comme référence.
        const craftFlagKey = Object.keys(flags).find(k => k === 'open_craft' || k.startsWith('open_craft_'));
        if (craftFlagKey) {
          const craftNpcId = craftFlagKey.startsWith('open_craft_') ? craftFlagKey.slice('open_craft_'.length) : npcId;
          delete flags[craftFlagKey];
          this.isInDialogue = true;
          this.scene.launch('ShopScene', { gameScene: this, npcId: craftNpcId });
        }

        // start_run : PNJ déclencheur de run (RunSystem, Phase 6) — même patron
        // que open_shop/open_craft. Lance le packing pré-run (mode 'pack'),
        // startRun()/travelToZone() sont déclenchés par RunBagScene lui-même
        // à la confirmation "Descendre". Garde run?.active (même raison que la
        // touche debug U) : ne jamais écraser une run déjà en cours.
        if (flags['start_run'] && !this.gameState.run?.active) {
          delete flags['start_run'];
          this.openRunBagScene('pack');
        }
      },
    });
  }

  // ── ENEMY AI ─────────────────────────────────────────────────
  //
  // State machine per enemy instance. State is stored via sprite.getData() to avoid
  // any modification to ActiveEnemy or the save schema.
  //
  // Per-instance keys stored in sprite data:
  //   'aiState'       : EnemyAiState — current FSM state
  //   'aiStateUntil'  : number       — time.now() when state expires
  //   'aiPattern'     : AttackPatternId — pattern currently executing
  //   'chargeTargetX' : number       — frozen player X at start of charge telegraph
  //   'chargeTargetY' : number       — frozen player Y at start of charge telegraph
  //   'summonFired'   : boolean      — summon pattern already triggered this fight
  //   'originX'/'originY' : patrol origin
  //
  // AI state machine:
  //   idle → patrol → chase → telegraph → attack → cooldown → chase/idle → ...
  //                               ↑ only when in aggro range AND attack cooldown ready

  private tickEnemyAI(dt: number) {
    const px = this.player.x;
    const py = this.player.y;
    const now = this.time.now;

    // Tick homing projectiles first (independent of enemy loop)
    this.tickHomingProjectiles(dt);

    this.activeEnemies.forEach((ae, instanceId) => {
      const sprite = this.enemies.getChildren().find(
        (c) => (c as Phaser.Physics.Arcade.Sprite).name === instanceId,
      ) as Phaser.Physics.Arcade.Sprite | undefined;
      if (!sprite || !sprite.active) return;

      const body = sprite.body as Phaser.Physics.Arcade.Body;
      const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, px, py);
      const def  = ENEMY_MAP[ae.enemyId] as Enemy | undefined;
      if (!def) return;

      const aggroRange  = def.aggroRange ?? 220;

      // ── SLOW tick ───────────────────────────────────────────
      // Décrémenté ICI (aucun autre chemin ne le faisait auparavant — un SLOW posé
      // par une compétence Glace ou par FREEZE_RETALIATION contre un boss ne doit
      // pas rester permanent) et appliqué au déplacement effectif (strength = fraction
      // de vitesse retirée, ex. 0.3 = -30%).
      const slowEffect = ae.statusEffects.find(e => e.type === 'SLOW');
      if (slowEffect) {
        slowEffect.duration -= dt;
        if (slowEffect.duration <= 0) ae.statusEffects = ae.statusEffects.filter(e => e !== slowEffect);
      }
      const slowMult = slowEffect && slowEffect.duration > 0 ? Math.max(0, 1 - slowEffect.strength) : 1;

      // CHILL_AURA (glacius_deep_stillness) — aura passive r130 : -10% vitesse de
      // déplacement ET d'attaque pour les ennemis proches. Pas un statusEffect (pas
      // de durée à décompter) : purement positionnel, recalculé chaque frame via
      // `dist` déjà connu ici. chillMoveMult réduit la vitesse ; chillAtkMult
      // ALLONGE les durées de télégraphe/cooldown (même -10%, sens inverse).
      const inChillAura  = this.playerModifiers.chillAura && dist <= 130;
      const chillMoveMult = inChillAura ? 0.90 : 1;
      const chillAtkMult  = inChillAura ? 1.10 : 1;
      const moveSpeed = (def.moveSpeed ?? 90) * slowMult * chillMoveMult;

      // ── Shock tick (talents Partie 2 — fulguris_spark_touch/overload) ────
      // Contrairement au SHOCK subi par le joueur (immobilise, cf. Phase 0),
      // le SHOCK posé sur un ENNEMI est une vulnérabilité temporaire (+dégâts
      // subis, `strength` = %), pas un CC — décompte simple, aucun effet sur
      // le déplacement. Lu par getShockVulnMult() au calcul de dégâts.
      const shockEffect = ae.statusEffects.find(e => e.type === 'SHOCK');
      if (shockEffect) {
        shockEffect.duration -= dt;
        if (shockEffect.duration <= 0) ae.statusEffects = ae.statusEffects.filter(e => e !== shockEffect);
      }

      // ── STUN / FREEZE check ─────────────────────────────────
      // FREEZE immobilise exactement comme STUN (CombatSystem.enemyAttack empêche
      // déjà l'attaque d'un ennemi gelé ; ici on stoppe aussi son déplacement — sinon
      // FREEZE_RETALIATION ne ferait que le rendre inoffensif tout en le laissant courir).
      const immobilize = ae.statusEffects.find(e => e.type === 'STUN' || e.type === 'FREEZE');
      if (immobilize && immobilize.duration > 0) {
        immobilize.duration -= dt;
        if (immobilize.duration <= 0) {
          ae.statusEffects = ae.statusEffects.filter(e => e !== immobilize);
        }
        body.setVelocity(0, 0);
        this.updateEnemyUiPositions(instanceId, sprite, ae);
        return;
      }

      // ── Bleed tick ──────────────────────────────────────────
      const bleedEffect = ae.statusEffects.find(e => e.type === 'BLEED');
      if (bleedEffect && bleedEffect.duration > 0) {
        bleedEffect.duration -= dt;
        const bleedKey = `bleed_${instanceId}`;
        if (!this.cooldowns[bleedKey] || this.cooldowns[bleedKey] <= 0) {
          if (!this.isInvincibleDummy(ae.enemyId)) {
            ae.currentHp = Math.max(0, ae.currentHp - bleedEffect.strength);
          }
          this.cooldowns[bleedKey] = 1.0;
          // ÉCHO — tick DOT : ne passe PAS par applyDamageToEnemy (mutation directe
          // de currentHp ci-dessus), donc pas instrumenté par elle. Total seulement
          // (direct=false) : pas de coup compté, jamais de déplacement d'ancre.
          this.registerEchoDamage(instanceId, bleedEffect.strength, false);
          if (ae.currentHp <= 0) {
            this.onEnemyKilled(ae, sprite);
            return;
          }
        }
        if (bleedEffect.duration <= 0) {
          ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'BLEED');
        }
      }

      // ── Burn tick (talents Partie 2 — ignis_dragon_soul BURN_DMG_PCT) ────
      // BUG préexistant corrigé au passage : BURN est posé sur les ennemis
      // depuis toujours (CombatSystem.playerSkill, sorts FEU) mais n'était
      // JAMAIS tické nulle part dans ce fichier (contrairement à SLOW/STUN/
      // FREEZE/BLEED juste au-dessus) — la durée ne décroissait jamais, aucun
      // dégât n'était appliqué. Même minuteur 1s que BLEED.
      const burnEffect = ae.statusEffects.find(e => e.type === 'BURN');
      if (burnEffect && burnEffect.duration > 0) {
        burnEffect.duration -= dt;
        const burnKey = `burn_${instanceId}`;
        if (!this.cooldowns[burnKey] || this.cooldowns[burnKey] <= 0) {
          this.cooldowns[burnKey] = 1.0;
          // DARK_BURN (ten_forbidden_flame) — la brûlure devient un dégât sombre :
          // change l'élément affiché ET bénéficie de darkDmgMult comme toute autre
          // source de dégâts sombres (cohérent avec le hook posé dans playerSkill).
          const isDarkBurn = this.playerModifiers.darkBurn;
          const darkMult = isDarkBurn ? this.playerModifiers.darkDmgMult : 1;
          const tickDmg = Math.max(1, Math.round(
            burnEffect.strength * (1 + this.playerModifiers.burnDmgPct / 100) * darkMult,
          ));
          if (!this.isInvincibleDummy(ae.enemyId)) {
            ae.currentHp = Math.max(0, ae.currentHp - tickDmg);
          }
          this.registerEchoDamage(instanceId, tickDmg, false);
          this.showDamageNumber(sprite.x, sprite.y - 12, tickDmg, false, isDarkBurn ? ElementType.DARK : ElementType.FIRE);
          if (ae.currentHp <= 0) {
            this.onEnemyKilled(ae, sprite);
            return;
          }
        }
        if (burnEffect.duration <= 0) {
          ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'BURN');
        }
      }

      // ── Marque de Magma tick (PERMA_BURN_STACK_3_PCT / hidden_magma_cleaver) ──
      // Même minuteur 1s par instance que le BLEED. Les stacks ne tickent que tant
      // que l'arme reste équipée ; démarquée, on purge les stacks résiduels.
      const magmaStacks = this.magmaBurnStacks.get(instanceId) ?? 0;
      if (magmaStacks > 0) {
        if (PassiveSystem.hasMagmaBurn(this.gameState.player.equipment)) {
          const magmaKey = `magma_${instanceId}`;
          if (!this.cooldowns[magmaKey] || this.cooldowns[magmaKey] <= 0) {
            const tickDmg = CombatSystem.getMagmaBurnTickDamage(this.gameState.player, magmaStacks);
            if (!this.isInvincibleDummy(ae.enemyId)) {
              ae.currentHp = Math.max(0, ae.currentHp - tickDmg);
            }
            this.cooldowns[magmaKey] = 1.0;
            // ÉCHO — tick DOT : même raison que le BLEED ci-dessus (mutation directe
            // de currentHp, pas de passage par applyDamageToEnemy).
            this.registerEchoDamage(instanceId, tickDmg, false);
            const omnivampPct = PassiveSystem.getOmnivampPct(this.gameState.player.equipment);
            if (omnivampPct > 0) {
              PassiveSystem.applyHeal(this.gameState.player, Math.floor(tickDmg * omnivampPct / 100), this.playerModifiers);
            }
            this.showDamageNumber(sprite.x, sprite.y - 12, tickDmg, false, ElementType.FIRE);
            if (ae.currentHp <= 0) {
              this.onEnemyKilled(ae, sprite);
              return;
            }
          }
        } else {
          this.magmaBurnStacks.delete(instanceId);
        }
      }

      // Bestiaire — découverte au premier contact (entrée dans la portée d'aggro)
      if (dist < aggroRange && !sprite.getData('bestiary_discovered')) {
        sprite.setData('bestiary_discovered', true);
        const isNew = BestiarySystem.discover(this.gameState.world, ae.enemyId);
        if (isNew) {
          const bestiaryData = getBestiaryEntry(ae.enemyId);
          const creatureName = bestiaryData?.name ?? def.name;
          this.events.emit('new_creature_discovered', { enemyId: ae.enemyId, name: creatureName });
        }
      }

      // ── Read FSM state ───────────────────────────────────────
      const aiState     = (sprite.getData('aiState') as string | null) ?? 'idle';
      const aiStateUntil = (sprite.getData('aiStateUntil') as number | null) ?? 0;

      // Fetch pattern assignment for this enemy
      const assignment = getEnemyPatternAssignment(ae.enemyId);
      const patternId: AttackPatternId = assignment?.primary ?? 'melee_basic';

      // Attack cooldown key
      const atkCdKey = `atkcd_${instanceId}`;
      if (!this.cooldowns[atkCdKey]) this.cooldowns[atkCdKey] = 0;

      // ── STATE: idle → patrol ─────────────────────────────────
      if (aiState === 'idle' || aiState === 'patrol') {
        // Store origin for patrol
        if (!sprite.getData('originX')) {
          sprite.setData('originX', sprite.x);
          sprite.setData('originY', sprite.y);
        }
        if (dist < aggroRange) {
          sprite.setData('aiState', 'chase');
          return;
        }
        // Patrol orbit around origin
        const behavior = def.behavior ?? 'chaser';
        if (behavior === 'patrol' || behavior === 'summoner') {
          const radius = def.patrolRadius ?? 100;
          const originX = sprite.getData('originX') as number;
          const originY = sprite.getData('originY') as number;
          // Use char code of last char as a numeric seed (always a number, never NaN)
          const seedChar = instanceId.charCodeAt(instanceId.length - 1) || 0;
          const tSeed = (now / 1000) * 0.4 + seedChar * 0.01;
          this.moveEnemyToward(body, sprite, originX + Math.cos(tSeed) * radius, originY + Math.sin(tSeed) * radius, moveSpeed * 0.45);
        } else {
          body.setVelocity(0, 0);
        }

      // ── STATE: chase ─────────────────────────────────────────
      } else if (aiState === 'chase') {
        if (dist > aggroRange * 1.4) {
          sprite.setData('aiState', 'idle');
          body.setVelocity(0, 0);
          return;
        }

        // Move toward player (ranged enemies keep a preferred distance)
        const behavior = def.behavior ?? 'chaser';
        const preferredRange = behavior === 'ranged' ? (def.attackRange ?? 220) * 0.75 : 0;

        if (preferredRange > 0 && dist < preferredRange * 0.5) {
          // Ranged: too close — back off
          const awayAngle = Math.atan2(sprite.y - py, sprite.x - px);
          body.setVelocity(Math.cos(awayAngle) * moveSpeed * 0.7, Math.sin(awayAngle) * moveSpeed * 0.7);
        } else if (preferredRange > 0 && dist < preferredRange) {
          body.setVelocity(0, 0); // in sweet spot — strafe or stand
        } else {
          this.moveEnemyToward(body, sprite, px, py, moveSpeed);
        }

        // Decide to telegraph if close enough AND cooldown is ready
        const attackRange = def.attackRange ?? (behavior === 'ranged' ? 240 : 55);
        const inRange = dist < attackRange + 30;
        if (inRange && this.cooldowns[atkCdKey] <= 0) {
          // Pick the best pattern given context
          const chosenPatternId = this.pickEnemyPattern(ae, dist, assignment);
          sprite.setData('aiState', 'telegraph');
          sprite.setData('aiStateUntil', now + resolvePattern(ae.enemyId, chosenPatternId).telegraphMs * chillAtkMult);
          sprite.setData('aiPattern', chosenPatternId);
          sprite.setData('chargeTargetX', px);
          sprite.setData('chargeTargetY', py);
          body.setVelocity(0, 0);
          this.startEnemyTelegraph(sprite, ae, chosenPatternId, chillAtkMult);
        }

      // ── STATE: telegraph ─────────────────────────────────────
      } else if (aiState === 'telegraph') {
        body.setVelocity(0, 0); // frozen during windup
        if (now >= aiStateUntil) {
          const currentPattern = (sprite.getData('aiPattern') as AttackPatternId | null) ?? patternId;
          sprite.setData('aiState', 'attack');
          sprite.setData('aiStateUntil', now + 600); // max attack execution window
          this.resetEnemyTint(sprite);
          // Force-restart the attack swing exactly at execution time — telegraph and
          // attack share the same animation key, so without this the swing (which
          // already played once at telegraph start) freezes on its last frame for the
          // remainder of a long telegraph instead of replaying when the hit lands.
          if (sprite.getData('hasRealSprite')) {
            const attackKey = `enemy_${ae.enemyId}_attack`;
            if (this.anims.exists(attackKey)) sprite.play(attackKey);
          }
          this.executeEnemyAttackPattern(sprite, ae, def, currentPattern);
          // BUG 1 fix: do NOT set this.cooldowns[atkCdKey] here — the FSM 'cooldown' state
          // (aiStateUntil set in 'attack' → 'cooldown' transition) is the sole clock. A parallel
          // this.cooldowns value caused the enemy to re-telegraph before the FSM cooldown expired.
        }

      // ── STATE: attack ─────────────────────────────────────────
      } else if (aiState === 'attack') {
        // Attack state is brief (execution fires via delayedCall)
        if (now >= aiStateUntil) {
          sprite.setData('aiState', 'cooldown');
          const cfg = resolvePattern(ae.enemyId, (sprite.getData('aiPattern') as AttackPatternId | null) ?? 'melee_basic');
          sprite.setData('aiStateUntil', now + cfg.cooldownMs * chillAtkMult);
        }

      // ── STATE: cooldown ───────────────────────────────────────
      } else if (aiState === 'cooldown') {
        if (dist < aggroRange) {
          // Keep chasing at half speed during recovery
          this.moveEnemyToward(body, sprite, px, py, moveSpeed * 0.5);
        } else {
          body.setVelocity(0, 0);
        }
        if (now >= aiStateUntil) {
          sprite.setData('aiState', dist < aggroRange ? 'chase' : 'idle');
        }
      }

      // ── CONTACT MELEE (always applies except stunned) ────────
      // Only for non-ranged enemies that are touching the player.
      // This is the cheap fallback when the pattern system hasn't triggered yet.
      const behavior = def.behavior ?? 'chaser';
      if (behavior !== 'ranged' && dist < 50 && aiState !== 'telegraph' && aiState !== 'attack') {
        const meleeCdKey = `melee_${instanceId}`;
        if (!this.cooldowns[meleeCdKey] || this.cooldowns[meleeCdKey] <= 0) {
          this.applyEnemyMeleeDamage(ae, CONTACT_DAMAGE_MULT(ae));
          this.cooldowns[meleeCdKey] = 1.2;
        }
      }

      // ── Real-sprite animation state (idle/walk/attack) ───────
      if (sprite.getData('hasRealSprite')) {
        this.updateEnemyAnimationState(sprite, ae.enemyId, aiState, body);
      }

      // ── Update HP bar & crown positions ──────────────────────
      this.updateEnemyUiPositions(instanceId, sprite, ae);
    });
  }

  /** Switches a real-sprite enemy's playing animation based on its current AI state/velocity. */
  private updateEnemyAnimationState(
    sprite: Phaser.Physics.Arcade.Sprite,
    enemyId: string,
    aiState: string,
    body: Phaser.Physics.Arcade.Body,
  ): void {
    const state = (aiState === 'telegraph' || aiState === 'attack')
      ? 'attack'
      : (Math.abs(body.velocity.x) > 5 || Math.abs(body.velocity.y) > 5)
        ? 'walk'
        : 'idle';
    const key = `enemy_${enemyId}_${state}`;
    if (!this.anims.exists(key)) return;
    if (sprite.anims.currentAnim?.key !== key) sprite.play(key, true);
  }

  /**
   * Clears a hit/telegraph tint flash without erasing an elite's persistent tint.
   * Elites carry their color via `setData('persistentTint', ...)` — a raw
   * `clearTint()` (used everywhere for the brief white hit-flash) would otherwise
   * strip that identity permanently on the enemy's first hit-taken or attack.
   */
  private resetEnemyTint(sprite: Phaser.Physics.Arcade.Sprite): void {
    const persistentTint = sprite.getData('persistentTint') as number | undefined;
    if (persistentTint !== undefined) sprite.setTint(persistentTint);
    else sprite.clearTint();
  }

  /** Pick which pattern to execute based on context. */
  private pickEnemyPattern(
    ae: ActiveEnemy,
    _dist: number,
    assignment: ReturnType<typeof getEnemyPatternAssignment>,
  ): AttackPatternId {
    if (!assignment) return 'melee_basic';

    // Summon at HP threshold (once per fight — applies whether primary or secondary is 'summon')
    const hasSummon = assignment.primary === 'summon' || assignment.secondary === 'summon';
    if (hasSummon) {
      const sprite = this.enemies.getChildren().find(
        c => (c as Phaser.Physics.Arcade.Sprite).name === ae.instanceId,
      ) as Phaser.Physics.Arcade.Sprite | undefined;
      const hpPct = ae.currentHp / ae.maxHp;
      const threshold = PATTERNS.summon.summonHpThreshold ?? 0.5;
      const alreadyFired = sprite?.getData('summonFired') as boolean | null;
      if (!alreadyFired && hpPct <= threshold) {
        return 'summon';
      }
      // Guard: if summon was already fired and primary IS summon, force secondary to avoid infinite loop
      if (alreadyFired && assignment.primary === 'summon') {
        return (assignment.secondary !== 'summon' ? assignment.secondary : null) ?? 'melee_basic';
      }
    }

    // Alternate between primary and secondary for variety
    if (assignment.secondary) {
      // Use secondary roughly 30% of the time
      if (Math.random() < 0.3) return assignment.secondary;
    }
    return assignment.primary;
  }

  /** Spawn the visual telegraph effect for the chosen pattern. */
  private startEnemyTelegraph(
    sprite: Phaser.Physics.Arcade.Sprite,
    ae: ActiveEnemy,
    patternId: AttackPatternId,
    durationMult = 1,
  ) {
    const cfg = resolvePattern(ae.enemyId, patternId);
    // CHILL_AURA (durationMult > 1 dans le rayon) : le tell visuel doit durer aussi
    // longtemps que le FSM attend réellement avant d'exécuter — sinon l'avertissement
    // s'arrête avant le coup, ce qui va à l'encontre de l'effet défensif du talent.
    const duration = cfg.telegraphMs * durationMult;
    const tint = cfg.telegraphTint;
    // Real sprites rest at a scale far from 1.0 (upscaled so their padded native frame
    // reads at a legible size — see fitSpriteToContent). These telegraph "juice" tweens
    // must animate relative to that resting scale, not jump to an absolute literal.
    const baseScale = (sprite.getData('baseScale') as number | undefined) ?? sprite.scale;

    switch (patternId) {
      case 'charge': {
        // Trembling orange tint — alternating flashes
        const flashInterval = 80;
        const flashCount = Math.floor(duration / flashInterval);
        let step = 0;
        const timerEvent = this.time.addEvent({
          delay: flashInterval,
          repeat: flashCount - 1,
          callback: () => {
            if (!sprite.active) return;
            step++;
            sprite.setTint(step % 2 === 0 ? tint : 0xff4400);
          },
        });
        // Store ref so we can cancel it if the enemy dies mid-telegraph
        sprite.setData('telegraphTimer', timerEvent);

        // Scale tremble
        this.tweens.add({
          targets: sprite,
          scaleX: baseScale * 1.04,
          scaleY: baseScale * 0.96,
          duration: 80,
          yoyo: true,
          repeat: Math.floor(duration / 160),
        });
        break;
      }

      case 'burst_fan': {
        // Scale pop (expand then contract) with orange tint
        sprite.setTint(tint);
        this.tweens.add({
          targets: sprite,
          scaleX: baseScale * 1.2,
          scaleY: baseScale * 1.2,
          duration: duration * 0.35,
          ease: 'Cubic.easeOut',
          yoyo: true,
          onComplete: () => { if (sprite.active) sprite.setScale(baseScale); },
        });
        // Concentric rings pulsing outward
        for (let i = 0; i < 2; i++) {
          const ring = this.add.graphics({ x: sprite.x, y: sprite.y }).setDepth(12);
          ring.lineStyle(3, tint, 0.8);
          ring.strokeCircle(0, 0, 10);
          this.tweens.add({
            targets: ring,
            scaleX: 4, scaleY: 4,
            alpha: 0,
            delay: i * (duration / 3),
            duration: duration * 0.55,
            ease: 'Linear',
            onUpdate: () => ring.setPosition(sprite.x, sprite.y),
            onComplete: () => ring.destroy(),
          });
        }
        break;
      }

      case 'circular_burst': {
        // Large pulsing ring — danger is obvious
        sprite.setTint(tint);
        const bigRing = this.add.graphics({ x: sprite.x, y: sprite.y }).setDepth(12);
        bigRing.lineStyle(5, tint, 0.9);
        bigRing.strokeCircle(0, 0, 20);
        this.tweens.add({
          targets: bigRing,
          scaleX: 3.5, scaleY: 3.5,
          alpha: 0.2,
          duration: duration * 0.6,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onUpdate: () => bigRing.setPosition(sprite.x, sprite.y),
          onComplete: () => bigRing.destroy(),
        });
        // Inner glow
        const glow = this.add.circle(sprite.x, sprite.y, sprite.displayWidth * 0.7, tint, 0.3).setDepth(11);
        this.tweens.add({
          targets: glow,
          alpha: 0.6,
          duration: duration * 0.4,
          yoyo: true,
          repeat: 1,
          onUpdate: () => glow.setPosition(sprite.x, sprite.y),
          onComplete: () => glow.destroy(),
        });
        break;
      }

      case 'dash_melee': {
        // Violet flash + slight compression
        sprite.setTint(tint);
        this.tweens.add({
          targets: sprite,
          scaleX: baseScale * 0.85,
          scaleY: baseScale * 1.15,
          duration: duration * 0.5,
          ease: 'Cubic.easeIn',
          yoyo: true,
        });
        // Particle burst telegraphing intent (toward the player)
        const intentAngle = Math.atan2(this.player.y - sprite.y, this.player.x - sprite.x);
        for (let i = 0; i < 3; i++) {
          const dot = this.add.circle(sprite.x, sprite.y, 4, tint, 0.8).setDepth(12);
          const dotAngle = intentAngle + (i - 1) * 0.35;
          const dotStartX = sprite.x;
          const dotStartY = sprite.y;
          this.tweens.add({
            targets: dot,
            x: dotStartX + Math.cos(dotAngle) * 22,
            y: dotStartY + Math.sin(dotAngle) * 22,
            alpha: 0,
            delay: i * 60,
            duration: 200,
            onComplete: () => dot.destroy(),
          });
        }
        break;
      }

      case 'homing': {
        // Violet glow building up — orb forms
        sprite.setTint(tint);
        const orb = this.add.circle(sprite.x, sprite.y, 4, tint, 0.7).setDepth(13);
        this.tweens.add({
          targets: orb,
          radius: 12,
          alpha: 1,
          duration: duration * 0.7,
          ease: 'Cubic.easeOut',
          onUpdate: () => orb.setPosition(sprite.x, sprite.y),
          onComplete: () => orb.destroy(),
        });
        break;
      }

      case 'summon': {
        // Gold aura builds — boss moment
        sprite.setTint(tint);
        const aura = this.add.circle(sprite.x, sprite.y, sprite.displayWidth, tint, 0.25).setDepth(11);
        this.tweens.add({
          targets: aura,
          radius: sprite.displayWidth * 3,
          alpha: 0.5,
          duration: duration * 0.8,
          ease: 'Sine.easeInOut',
          yoyo: true,
          onUpdate: () => aura.setPosition(sprite.x, sprite.y),
          onComplete: () => aura.destroy(),
        });
        break;
      }

      default:
        // melee_basic — quick red flash only
        sprite.setTint(tint);
        break;
    }
  }

  /** Execute the actual attack for the given pattern. */
  private executeEnemyAttackPattern(
    sprite: Phaser.Physics.Arcade.Sprite,
    ae: ActiveEnemy,
    def: Enemy,
    patternId: AttackPatternId,
  ) {
    const cfg = resolvePattern(ae.enemyId, patternId);
    const px  = this.player.x;
    const py  = this.player.y;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    // Dégâts des patterns À DISTANCE (burst_fan / circular_burst / homing) —
    // désormais RÉDUITS par la défense du joueur, via CombatSystem.
    //
    // Avant : `Math.round(ae.stats.baseAtk * (cfg.damageMult ?? 1.0))`, envoyé tel
    // quel à applyDamageToPlayer() — qui n'applique AUCUNE défense (seulement les
    // boucliers de passifs). Tout projectile ennemi ignorait donc 100% de la DEF du
    // joueur, sur 23 ennemis dont les 7 boss. La DEF n'était vraie que contre la
    // mêlée, et personne ne le savait.
    //
    // Le canal suit `def.damageType` : les 26 lanceurs (sprites, spectres, revenants,
    // et les 7 boss) tapent la MDEF avec `baseMagicAtk` — ce qui donne enfin un prix
    // à MDEF_FLAT, qui valait rigoureusement zéro. Un boss est ainsi hybride : sa
    // circular_burst passe par la MDEF, sa charge par la DEF.
    const baseDmg = CombatSystem.enemyRangedDamage(ae, this.gameState.player, cfg.damageMult ?? 1.0);

    switch (patternId) {

      // ── PATTERN 1: Charge ──────────────────────────────────────
      case 'charge': {
        // Use the frozen target position set when telegraph began
        const targetX = (sprite.getData('chargeTargetX') as number | null) ?? px;
        const targetY = (sprite.getData('chargeTargetY') as number | null) ?? py;
        const chargeAngle = Math.atan2(targetY - sprite.y, targetX - sprite.x);
        const chargeSpeed = (def.moveSpeed ?? 90) * (cfg.chargeSpeedMult ?? 3.0);

        // Charge force
        body.setVelocity(Math.cos(chargeAngle) * chargeSpeed, Math.sin(chargeAngle) * chargeSpeed);

        // Auto-stop after 600ms or on contact
        const chargeStopTimer = this.time.delayedCall(600, () => {
          if (sprite.active) body.setVelocity(0, 0);
        });
        sprite.setData('chargeStopTimer', chargeStopTimer);

        // Contact damage check every 50ms while charging
        let chargeHit = false;
        const chargeTick = this.time.addEvent({
          delay: 50,
          repeat: 12,
          callback: () => {
            if (chargeHit || !sprite.active) return;
            const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);
            if (d < 45) {
              chargeHit = true;
              // Knockback renforcé (280 vs 140 standard) passé à applyEnemyMeleeDamage
              // — un setVelocity() direct sur le joueur ici serait écrasé dès le
              // prochain handleMovement() (cf. applyKnockbackToPlayer, l'overlay
              // knockbackX/Y est le SEUL mécanisme qui survit à la frame suivante).
              this.applyEnemyMeleeDamage(ae, cfg.damageMult ?? 1.5, 280);
              // Camera shake on charge hit
              this.cameras.main.shake(130, 0.008);
              body.setVelocity(0, 0);
            }
          },
        });
        sprite.setData('chargeTick', chargeTick);
        break;
      }

      // ── PATTERN 2: Burst Fan ───────────────────────────────────
      case 'burst_fan': {
        const count = cfg.projectileCount ?? 4;
        const spread = cfg.spreadAngle ?? Math.PI / 3;
        const baseAngle = Math.atan2(py - sprite.y, px - sprite.x);
        const step = count > 1 ? spread / (count - 1) : 0;

        for (let i = 0; i < count; i++) {
          const angle = baseAngle - spread / 2 + step * i;
          this.spawnEnemyProjectile(sprite.x, sprite.y, angle, def.element as ElementType, baseDmg, false);
        }

        // VFX: muzzle flash
        const flash = this.add.circle(sprite.x, sprite.y, 16, cfg.telegraphTint, 0.8).setDepth(14);
        this.tweens.add({
          targets: flash,
          scaleX: 2.5, scaleY: 2.5, alpha: 0,
          duration: 200,
          onComplete: () => flash.destroy(),
        });
        break;
      }

      // ── PATTERN 3: Circular Burst ──────────────────────────────
      case 'circular_burst': {
        const count = cfg.projectileCount ?? 8;
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 / count) * i;
          this.spawnEnemyProjectile(sprite.x, sprite.y, angle, def.element as ElementType, baseDmg, false);
        }
        // Shockwave ring VFX
        const ring = this.add.graphics({ x: sprite.x, y: sprite.y }).setDepth(13);
        ring.lineStyle(6, cfg.telegraphTint, 0.9);
        ring.strokeCircle(0, 0, 12);
        this.tweens.add({
          targets: ring,
          scaleX: 8, scaleY: 8,
          alpha: 0,
          duration: 400,
          ease: 'Power2',
          onComplete: () => ring.destroy(),
        });
        this.cameras.main.shake(80, 0.006);
        break;
      }

      // ── PATTERN 4: Dash Melee ──────────────────────────────────
      case 'dash_melee': {
        const dashDist = cfg.dashDistance ?? 180;
        const dashAngle = Math.atan2(py - sprite.y, px - sprite.x);
        const dashSpeed = 400;

        body.setVelocity(Math.cos(dashAngle) * dashSpeed, Math.sin(dashAngle) * dashSpeed);

        // Trail VFX during dash
        for (let i = 0; i < 3; i++) {
          this.time.delayedCall(i * 60, () => {
            if (!sprite.active) return;
            const ghost = this.add.rectangle(sprite.x, sprite.y, sprite.displayWidth, sprite.displayHeight, cfg.telegraphTint, 0.35).setDepth(3);
            this.tweens.add({ targets: ghost, alpha: 0, duration: 180, onComplete: () => ghost.destroy() });
          });
        }

        // Stop after covering dashDist
        const dashTime = (dashDist / dashSpeed) * 1000;
        this.time.delayedCall(dashTime, () => {
          if (!sprite.active) return;
          body.setVelocity(0, 0);
          // Melee hit check on arrival
          const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);
          if (d < 55) {
            this.applyEnemyMeleeDamage(ae, cfg.damageMult ?? 1.2);
            // Slash VFX at impact
            const slashColor = cfg.telegraphTint;
            this.spawnSlashArcVfx(sprite.x, sprite.y, dashAngle, slashColor, { radius: 40, thickness: 5, halfArc: 0.9, duration: 200 });
          }
        });
        break;
      }

      // ── PATTERN 5: Homing ─────────────────────────────────────
      case 'homing': {
        this.spawnHomingProjectile(sprite.x, sprite.y, def.element as ElementType, baseDmg, cfg);
        break;
      }

      // ── PATTERN 6: Summon ─────────────────────────────────────
      case 'summon': {
        sprite.setData('summonFired', true);

        // Teleport to center of map
        const { mapWidth, mapHeight } = this.layout;
        const cx = mapWidth / 2;
        const cy = mapHeight / 2;
        body.reset(cx, cy);
        sprite.setPosition(cx, cy);

        // Gold flash
        sprite.setTintFill(0xffd700);
        this.time.delayedCall(300, () => { if (sprite.active) this.resetEnemyTint(sprite); });

        // Announcement
        const { width: W, height: H } = this.cameras.main;
        const lbl = this.add.text(W / 2, H / 2 - 40, '— Reinforcements —', {
          fontSize: '14px', color: '#ffd700', fontFamily: FONT,
          stroke: '#000000', strokeThickness: 3,
        }).setScrollFactor(0).setOrigin(0.5).setDepth(200).setAlpha(0);
        this.tweens.add({
          targets: lbl, alpha: 1, duration: 300, hold: 800, yoyo: true,
          onComplete: () => lbl.destroy(),
        });

        // Spawn minions
        const assignment = getEnemyPatternAssignment(ae.enemyId);
        const minionId = assignment?.summonMinionId ?? (PATTERNS.summon.minionEnemyId ?? '');
        const minionDef = minionId ? ENEMY_MAP[minionId] : null;
        const count = cfg.minionCount ?? 2;

        if (minionDef) {
          for (let i = 0; i < count; i++) {
            this.time.delayedCall(400 + i * 200, () => {
              if (!sprite.active) return;
              const angle = (Math.PI * 2 / count) * i;
              const mx = sprite.x + Math.cos(angle) * 80;
              const my = sprite.y + Math.sin(angle) * 80;
              this.spawnMinionEnemy(minionDef, mx, my);
            });
          }
        }
        break;
      }

      // ── Fallback: Melee Basic ─────────────────────────────────
      default: {
        const d = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);
        if (d < 55) this.applyEnemyMeleeDamage(ae, cfg.damageMult ?? 1.0);
        sprite.setTintFill(cfg.telegraphTint);
        this.time.delayedCall(80, () => { if (sprite.active) this.resetEnemyTint(sprite); });
        break;
      }
    }
  }

  /** Tick all active homing projectiles: rotate toward player, move, check collision. */
  private tickHomingProjectiles(dt: number) {
    const px = this.player.x;
    const py = this.player.y;
    const now = this.time.now;

    for (let i = this._homingProjectiles.length - 1; i >= 0; i--) {
      const h = this._homingProjectiles[i];

      if (h.hit || now >= h.destroyAt) {
        if (h.sprite.active) h.sprite.destroy();
        if (h.halo.active) h.halo.destroy();
        this._homingProjectiles.splice(i, 1);
        continue;
      }

      // Update position
      h.sprite.x += h.vx * dt;
      h.sprite.y += h.vy * dt;
      h.halo.x    = h.sprite.x;
      h.halo.y    = h.sprite.y;

      // Rotate velocity toward player (bounded turn rate)
      const currentAngle = Math.atan2(h.vy, h.vx);
      const desiredAngle = Math.atan2(py - h.sprite.y, px - h.sprite.x);
      let delta = desiredAngle - currentAngle;
      // Normalize
      while (delta >  Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      const maxTurn = h.rotateSpeedRad * dt;
      const turn = Phaser.Math.Clamp(delta, -maxTurn, maxTurn);
      const newAngle = currentAngle + turn;
      const speed = Math.sqrt(h.vx * h.vx + h.vy * h.vy);
      h.vx = Math.cos(newAngle) * speed;
      h.vy = Math.sin(newAngle) * speed;

      // Collision with player
      const dist = Phaser.Math.Distance.Between(h.sprite.x, h.sprite.y, px, py);
      if (dist < 20) {
        h.hit = true;
        // Position capturée AVANT destroy() — knockback (talents Partie 2) a besoin
        // d'une source, plus fiable que de relire h.sprite.x/y après destruction.
        const impactX = h.sprite.x, impactY = h.sprite.y;
        // Impact VFX
        const imp = this.add.circle(impactX, impactY, 14, 0x9933cc, 0.9).setDepth(14);
        this.tweens.add({
          targets: imp, scaleX: 3, scaleY: 3, alpha: 0, duration: 250,
          onComplete: () => imp.destroy(),
        });
        h.sprite.destroy();
        h.halo.destroy();
        this._homingProjectiles.splice(i, 1);
        // Apply damage
        this.applyDamageToPlayer(h.damage, impactX, impactY, h.element);
      }
    }
  }

  /** Spawn a homing projectile from an enemy. */
  private spawnHomingProjectile(
    fromX: number, fromY: number,
    element: ElementType,
    damage: number,
    cfg: typeof PATTERNS[AttackPatternId],
  ) {
    const ELEMENT_HEX: Partial<Record<ElementType, number>> = {
      [ElementType.FIRE]:      0xff4400,
      [ElementType.EARTH]:     0x88aa33,
      [ElementType.WIND]:      0xaaddff,
      [ElementType.WATER]:     0x2266ff,
      [ElementType.LIGHTNING]: 0xffee00,
      [ElementType.ICE]:       0x88ddff,
      [ElementType.DARK]:      0x9933cc,
    };
    const color = ELEMENT_HEX[element] ?? 0x9933cc;
    const speed = cfg.homingSpeed ?? 90;
    const rotateDeg = cfg.homingRotateSpeedDeg ?? 55;
    const lifetime = cfg.homingLifetimeMs ?? 3000;

    const px = this.player.x;
    const py = this.player.y;
    const angle = Math.atan2(py - fromY, px - fromX);

    const orb  = this.add.circle(fromX, fromY, 7, color, 1).setDepth(14);
    const halo = this.add.circle(fromX, fromY, 12, color, 0.35).setDepth(13);

    // Pulse the halo
    this.tweens.add({
      targets: halo, alpha: 0.7, duration: 350, yoyo: true, repeat: -1,
    });

    this._homingProjectiles.push({
      sprite: orb,
      halo,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotateSpeedRad: (rotateDeg * Math.PI) / 180,
      destroyAt: this.time.now + lifetime,
      damage,
      hit: false,
      element,
    });
  }

  /** Fire a straight enemy projectile at a given angle (bypasses spawnProjectile's atan2). */
  private spawnEnemyProjectile(
    fromX: number, fromY: number,
    angle: number,
    element: ElementType,
    damage: number,
    _isPlayer: boolean,
  ) {
    // spawnProjectile uses atan2(toY-fromY, toX-fromX) internally — supplying a point
    // exactly one unit along `angle` gives us the same direction at any distance.
    const FAR = 500; // px — far enough that atan2 precision is exact
    this.spawnProjectile(
      fromX, fromY,
      fromX + Math.cos(angle) * FAR,
      fromY + Math.sin(angle) * FAR,
      element, damage, false,
    );
  }

  /** Spawn a minion enemy at the given position. */
  private spawnMinionEnemy(minionDef: Enemy, x: number, y: number) {
    const zoneId  = this.gameState.player.currentZone;
    const ZONE_ENEMY_COLORS_LOCAL: Record<string, number> = {
      ignis_reach:    0xdd4422,
      terravast:      0x6a4a2a,
      zephyr_peaks:   0x88aadd,
      abyssmar:       0x2244aa,
      volterra:       0xddee22,
      glaciem:        0xaaddee,
      malachars_spire:0x6622aa,
    };
    const enemyColor = ZONE_ENEMY_COLORS_LOCAL[zoneId] ?? 0xaa4444;
    const texKey = `enemy_${minionDef.id}`;
    // enemyIdsForZone() inclut déjà les `summonMinionId` de la zone, donc les textures
    // ET les animations du sbire sont normalement là. Filet de sécurité : le def du
    // sbire arrive ici par paramètre (donc potentiellement hors liste de zone si la
    // data bouge), et depuis qu'AssetStreamScene précharge les strips `idle` de TOUT
    // le catalogue, `textures.exists(..._idle)` peut être vrai SANS que l'animation
    // correspondante existe — `play()` logerait alors une animation manquante.
    // registerEnemyAnimations est idempotent et ne coûte rien si tout est déjà déclaré.
    registerEnemyAnimations(this, [minionDef.id]);
    const hasRealSprite = this.textures.exists(`enemy_${minionDef.id}_idle`);
    if (!hasRealSprite) this.ensureTexture(texKey, enemyColor);

    const minionBbox = ENEMY_SPRITE_BBOX[minionDef.id];
    const minionFit = hasRealSprite && minionBbox ? fitSpriteToContent(minionBbox, 32) : null;
    const dispSize = minionFit ? minionFit.dispSize : 28;
    const sprite = hasRealSprite
      ? this.physics.add.sprite(x, y, `enemy_${minionDef.id}_idle`)
      : this.physics.add.sprite(x, y, texKey);
    sprite.setDisplaySize(dispSize, dispSize);
    const minionBody = sprite.body as Phaser.Physics.Arcade.Body;
    if (minionFit && minionBbox) {
      // DYNAMIC body — raw source-pixel bbox, not the scaled fit values (see createPlayer()).
      minionBody.setSize(minionBbox.w, minionBbox.h);
      minionBody.setOffset(minionBbox.x, minionBbox.y);
    } else {
      minionBody.setSize(dispSize - 8, dispSize - 8);
    }
    sprite.setDepth(4);
    sprite.setData('baseScale', sprite.scale);
    if (hasRealSprite) {
      sprite.setData('hasRealSprite', true);
      sprite.play(`enemy_${minionDef.id}_idle`);
    }

    const active = CombatSystem.spawnEnemy(minionDef, zoneId);
    active.x = x;
    active.y = y;
    sprite.name = active.instanceId;
    this.activeEnemies.set(active.instanceId, active);
    this.enemies.add(sprite);

    // HP bar
    const minionContentTopGap = minionFit ? dispSize / 2 - minionFit.offsetY : dispSize / 2;
    const barW = (minionFit ? minionFit.bodyW : dispSize) + 4;
    const barY = y - minionContentTopGap - 8;
    const barBg = this.add.rectangle(x, barY, barW, 6, 0x220000).setDepth(8);
    const barFg = this.add.rectangle(x - barW / 2, barY, barW, 4, 0xff2222).setDepth(9).setOrigin(0, 0.5);
    this.enemyHpBars.set(active.instanceId, { bg: barBg, bar: barFg, baseW: barW });

    // Re-add wall collider for this minion — register in physicsColliders to avoid zombie collider on zone transition
    const minionCollider = this.physics.add.collider(sprite, this.wallGroup);
    this.physicsColliders.push(minionCollider);

    // Spawn flash
    sprite.setTintFill(0xffd700);
    this.time.delayedCall(250, () => { if (sprite.active) this.resetEnemyTint(sprite); });
  }

  /**
   * Applique les passifs de mitigation de dégâts subis (DMG_REDUCTION_40_DEATH_RESIST)
   * — réduction % puis, si le coup serait fatal, chance de laisser le joueur à 1 HP
   * au lieu de mourir. Partagé entre applyEnemyMeleeDamage/applyDamageToPlayer pour
   * ne jamais l'oublier dans l'un des deux chemins (cf. précédent Soul Echo).
   */
  private mitigatePlayerDamage(rawDamage: number, hpBefore: number): number {
    const equipment = this.gameState.player.equipment;
    let dmg = rawDamage;

    // MAGMA_GUARD (ignis_magma_armor) — absorbe ENTIÈREMENT 1 coup par combat,
    // avant tout le reste (bouclier total, pas un pourcentage à empiler).
    if (this.playerModifiers.magmaGuard && !this.magmaGuardUsedThisCombat && dmg > 0) {
      this.magmaGuardUsedThisCombat = true;
      this.cameras.main.flash(150, 255, 100, 0);
      this.events.emit('show_notification', 'Garde de Magma — coup absorbé !');
      dmg = 0;
    }

    // Bouclier temporisé (GUARD_FINISHER/LAST_BASTION, cf. grantTimedShield) —
    // absorbe avant TOUT le reste (y compris LOW_HP_SHIELD) : c'est le plus frais
    // des deux, et il expire de toute façon tout seul si non consommé — autant
    // qu'il serve en premier.
    if (this.time.now > this.timedShieldUntil) this.timedShieldHp = 0;
    if (this.timedShieldHp > 0) {
      const absorbed = Math.min(this.timedShieldHp, dmg);
      this.timedShieldHp -= absorbed;
      dmg -= absorbed;
    }

    // LOW_HP_SHIELD_30_PCT — absorbe les dégâts en premier, avant tout le reste.
    if (this.playerShieldHp > 0) {
      const absorbed = Math.min(this.playerShieldHp, dmg);
      this.playerShieldHp -= absorbed;
      dmg -= absorbed;
    }

    // OVERHEAL_SHIELD_50_PCT (hidden_tideheart_ring) — bouclier de surplus de soin,
    // consommé juste APRÈS LOW_HP_SHIELD (ordre fixé par le docstring de
    // PassiveSystem.applyHeal). Gate hasOverhealShield (même précaution que
    // getKillStackDamageMultiplier) : le bouclier est banké dans passiveStacks (donc
    // sérialisé) — sans la garde, il absorberait encore après avoir déséquipé l'anneau.
    const overhealShield = this.gameState.player.passiveStacks['OVERHEAL_SHIELD_50_PCT'] ?? 0;
    if (overhealShield > 0 && dmg > 0 && PassiveSystem.hasOverhealShield(equipment)) {
      const absorbed = Math.min(overhealShield, dmg);
      this.gameState.player.passiveStacks['OVERHEAL_SHIELD_50_PCT'] = overhealShield - absorbed;
      dmg -= absorbed;
    }

    const reductionPct = PassiveSystem.getDamageReductionPct(equipment);
    dmg = reductionPct > 0 ? Math.round(dmg * (1 - reductionPct / 100)) : dmg;

    // LOW_HP_DEF_PCT — même canal que DAMAGE_REDUCTION_PCT ci-dessus (réduction
    // de dégâts, pas une vraie modification de la stat DEF), cf. getLowHpDefReductionPct.
    const lowHpDefPct = this.getLowHpDefReductionPct();
    dmg = lowHpDefPct > 0 ? Math.round(dmg * (1 - lowHpDefPct / 100)) : dmg;

    // AQUATIC_DEF_PCT — même canal, conditionnel à la zone au lieu des HP courants.
    const aquaticDefPct = this.getAquaticDefReductionPct();
    dmg = aquaticDefPct > 0 ? Math.round(dmg * (1 - aquaticDefPct / 100)) : dmg;

    // DAMAGE_DEFERRAL_50_PCT (hidden_runebound_amulet) — n'encaisse immédiatement
    // que 50% ; les 50% restants sont étalés sur 5 ticks 1s (tickDeferredDamage).
    if (PassiveSystem.hasDamageDeferral(equipment) && dmg > 0) {
      const deferred = Math.round(dmg * PassiveSystem.DAMAGE_DEFERRAL_PCT / 100);
      if (deferred > 0) {
        dmg -= deferred;
        if (this.deferredDamageQueue.length === 0) this.lastDeferredTickTime = this.time.now;
        this.deferredDamageQueue.push({
          amountPerTick: deferred / PassiveSystem.DAMAGE_DEFERRAL_TICKS,
          ticksLeft: PassiveSystem.DAMAGE_DEFERRAL_TICKS,
        });
      }
    }

    if (hpBefore - dmg <= 0) {
      const resistChance = PassiveSystem.getDeathResistChance(equipment);
      if (resistChance > 0 && Math.random() < resistChance) {
        dmg = Math.max(0, hpBefore - 1); // laisse le joueur à 1 HP pile
      } else if (this.playerModifiers.preserved && !this.preservedUsedThisZone) {
        // PRESERVED (glacius_deep_patience) — sauvetage GARANTI (pas une chance),
        // 1 fois par ZONE, contrairement au death-resist d'objet ci-dessus (par coup,
        // probabiliste). Fallback uniquement si l'objet n'a pas déjà sauvé le joueur.
        this.preservedUsedThisZone = true;
        dmg = Math.max(0, hpBefore - 1);
        this.iframeUntil = this.time.now + 2000;
        this.cameras.main.flash(220, 150, 220, 255);
        this.events.emit('show_notification', 'Patience de la Montagne — vous survivez !');
      }
    }

    this.maybeTriggerLowHpShield(hpBefore - dmg);
    this.maybeTriggerFrozenSanctuary(hpBefore - dmg);
    this.maybeTriggerLastBastion(hpBefore - dmg);
    return dmg;
  }

  /** Pool générique de bouclier temporisé (GUARD_FINISHER, LAST_BASTION) — le
   *  plus généreux gagne, jamais cumulatif, sur les DEUX axes indépendamment
   *  (HP ET expiration) : un Math.max sur un seul des deux aurait pu laisser une
   *  source plus généreuse en HP raccourcir la durée d'une source antérieure
   *  encore active (bug trouvé en review — GUARD_FINISHER écrasait Until sans
   *  Math.max, pouvant couper court à un LAST_BASTION en cours). */
  private grantTimedShield(hpAmount: number, durationMs: number): void {
    this.timedShieldHp = Math.max(this.timedShieldHp, hpAmount);
    this.timedShieldUntil = Math.max(this.timedShieldUntil, this.time.now + durationMs);
  }

  /** LAST_BASTION (glacius_last_bastion) — 1 fois par combat : passer sous 30%
   *  HP accorde un bouclier temporisé de 25% des HP max pendant 5s. */
  private maybeTriggerLastBastion(hpAfter: number): void {
    if (!this.playerModifiers.lastBastion || this.lastBastionUsedThisCombat) return;
    const maxHp = this.gameState.player.stats.maxHp;
    if (maxHp <= 0 || hpAfter / maxHp >= 0.30) return;
    this.lastBastionUsedThisCombat = true;
    this.grantTimedShield(Math.round(maxHp * 0.25), 5000);
    this.cameras.main.flash(200, 150, 220, 255);
    this.events.emit('show_notification', 'Dernier Bastion — bouclier !');
  }

  /** FROZEN_SANCTUARY_30_PCT — déclenche la stase (invulnérabilité + soin 10%/s
   *  pendant 3s) si les HP passent sous 25% et qu'elle n'a pas déjà servi ce combat. */
  private maybeTriggerFrozenSanctuary(hpAfter: number): void {
    const p = this.gameState.player;
    if (!PassiveSystem.shouldTriggerFrozenSanctuary(
      p.equipment, this.frozenSanctuaryUsedThisCombat, hpAfter, p.stats.maxHp,
    )) return;
    this.frozenSanctuaryUsedThisCombat = true;
    this.frozenSanctuaryUntil = this.time.now + PassiveSystem.FROZEN_SANCTUARY_DURATION_MS;
    this.lastFrozenSanctuaryHealTime = this.time.now; // premier soin ~1s plus tard
    this.cameras.main.flash(220, 150, 220, 255);
    this.events.emit('show_notification', 'Sanctuaire de Glace — invulnérable 3s !');
  }

  /** Déclenche le bouclier de ring_of_preservation si HP < 20% et pas en cooldown. */
  private maybeTriggerLowHpShield(hpAfter: number): void {
    const equipment = this.gameState.player.equipment;
    if (!PassiveSystem.hasLowHpShield(equipment)) return;
    if (this.playerShieldHp > 0) return; // déjà actif
    if (this.time.now < this.lowHpShieldCooldownUntil) return;
    const maxHp = this.gameState.player.stats.maxHp;
    if (maxHp <= 0 || hpAfter / maxHp >= PassiveSystem.LOW_HP_SHIELD_THRESHOLD_PCT / 100) return;
    this.playerShieldHp = Math.round(maxHp * PassiveSystem.LOW_HP_SHIELD_AMOUNT_PCT / 100);
    this.lowHpShieldCooldownUntil = this.time.now + PassiveSystem.LOW_HP_SHIELD_COOLDOWN_MS;
  }

  /** Apply melee damage from an enemy to the player, with guard/windup checks. */
  /** `knockbackForce` optionnel : certains patterns (ex. charge) veulent un
   *  recul plus fort que le standard PLAYER_KNOCKBACK_FORCE. */
  private applyEnemyMeleeDamage(ae: ActiveEnemy, damageMult: number, knockbackForce = GameScene.PLAYER_KNOCKBACK_FORCE) {
    if (this.inWindup && this.playerModifiers.windupArmor) return;
    if (damageMult <= 0) return; // summon pattern has damageMult 0

    // FROZEN_SANCTUARY_30_PCT — invulnérabilité totale pendant la fenêtre de stase.
    if (this.time.now < this.frozenSanctuaryUntil) return;
    // TRUE_DODGE_25_PCT (hidden_voidwalker_boots) — jet d'esquive INDÉPENDANT du
    // DODGE_PCT (loot rolls), avant tout calcul de dégâts (cf. spec : jet séparé).
    if (PassiveSystem.rollTrueDodge(this.gameState.player.equipment) || this.rollAutoDodge()) {
      this.showDodgeText(this.player.x, this.player.y - 20);
      return;
    }

    // Snapshot BEFORE CombatSystem applies its own (unmultiplied) clamped damage — same
    // reason as executeHitInCone()/updateArrowProjectiles(): patching a delta onto HP
    // already clamped to 0 loses the overkill amount, which could let a guard-block
    // "revive" the player from a hit that should have killed them.
    const guardActive = this.time.now < this.guardUntil;
    const hpBeforeHit = this.gameState.player.stats.hp;
    const result = CombatSystem.enemyAttack(ae, this.gameState.player);
    // DODGE_PCT (loot stat rolls) — feedback dédié ("no mechanic without feedback"),
    // distinct du silence d'un ennemi stun/freeze ci-dessous.
    if (result.wasDodged) {
      this.showDodgeText(this.player.x, this.player.y - 20);
      return;
    }
    if (result.damage <= 0) return; // stunned enemy — no hit landed

    let finalDmg = Math.round(result.damage * damageMult);
    if (guardActive) finalDmg -= Math.round(finalDmg * 0.3);
    finalDmg = this.mitigatePlayerDamage(finalDmg, hpBeforeHit);

    // MAGIC_REFLECT_25_PCT (hidden_mirror_helm) — renvoie une partie du coup à
    // l'attaquant. Aucune notion de dégâts "magiques" vs "physiques" n'existe côté
    // mêlée ennemie (CombatSystem.enemyAttack ne différencie pas) — appliqué à tout
    // coup de mêlée, simplification assumée en l'absence de ce tag dans le moteur.
    const reflectPct = PassiveSystem.getMagicReflectPct(this.gameState.player.equipment);
    if (reflectPct > 0 && finalDmg > 0) {
      this.applyDamageToEnemy(ae.instanceId, Math.round(finalDmg * reflectPct / 100));
    }

    // RETALIATION_DEF_PCT (terra_shale_skin) — tout coup de mêlée qui ATTEINT le
    // joueur (esquive/stun déjà filtrés plus haut, return anticipés) inflige X% de
    // la DEF finale à l'attaquant en dégâts de terre — indépendant des dégâts
    // réellement subis (contrairement à MAGIC_REFLECT_25_PCT ci-dessus, qui reflète
    // un % du COUP ; ceci reflète un % de la DEF, même si le coup a été réduit à 0).
    const retaliationPct = this.playerModifiers.retaliationDefPct;
    // Garde activeEnemies.has() : MAGIC_REFLECT_25_PCT juste au-dessus peut avoir
    // déjà tué ae (sprite disabled mais pas encore détruit, cf. onEnemyKilled) —
    // sans ça, un nombre de dégâts/particules fantômes apparaît sur un cadavre.
    if (retaliationPct > 0 && this.activeEnemies.has(ae.instanceId)) {
      const def = StatsSystem.computeAll(this.gameState.player).def;
      const retalDmg = Math.max(1, Math.round(def * retaliationPct / 100));
      const attackerSprite = this.findEnemySpriteByInstanceId(ae.instanceId);
      if (attackerSprite) {
        this.showDamageNumber(attackerSprite.x, attackerSprite.y - 20, retalDmg, false, ElementType.EARTH);
        this.spawnHitParticles(attackerSprite.x, attackerSprite.y, ElementType.EARTH);
      }
      this.applyDamageToEnemy(ae.instanceId, retalDmg, false);
    }

    this.rollStaticRetort();

    this.gameState.player.stats.hp = Math.max(0, Math.min(
      this.gameState.player.stats.maxHp, hpBeforeHit - finalDmg,
    ));
    const isKill = this.gameState.player.stats.hp <= 0;

    // FREEZE_RETALIATION_1_5S (hidden_permafrost_greaves) — riposte de gel sur
    // l'attaquant (seul point où l'ennemi source est disponible), gouvernée par son cd 5s.
    this.maybeFreezeRetaliation(ae);

    if (finalDmg > 0) {
      this.showDamageNumber(this.player.x, this.player.y - 20, finalDmg, false, undefined, true);
      this.cameras.main.shake(100, 0.005);
      // Knockback + statut subis (talents Partie 2) — pas sur le coup qui tue,
      // le joueur n'a plus la main sur son mouvement pendant la séquence de mort.
      if (!isKill) {
        this.applyKnockbackToPlayer(ae.x, ae.y, knockbackForce);
        this.rollPlayerStatusOnHit(ae.element, finalDmg);
      }
    }
    this.events.emit('player_update', this.gameState.player);
    if (isKill) this.onPlayerDeath();
  }

  /** FREEZE_RETALIATION_1_5S — gèle l'attaquant (ou le ralentit s'il est boss :
   *  pas de stun-lock), une fois toutes les FREEZE_RETALIATION_COOLDOWN_S. */
  private maybeFreezeRetaliation(ae: ActiveEnemy): void {
    if (!PassiveSystem.hasFreezeRetaliation(this.gameState.player.equipment)) return;
    if (this.time.now < this.freezeRetaliationCooldownUntil) return;
    this.freezeRetaliationCooldownUntil = this.time.now + PassiveSystem.FREEZE_RETALIATION_COOLDOWN_S * 1000;
    if (ae.isBoss) {
      ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'SLOW');
      ae.statusEffects.push({
        type: 'SLOW', duration: PassiveSystem.FREEZE_RETALIATION_DURATION_S,
        strength: PassiveSystem.FREEZE_RETALIATION_BOSS_SLOW_PCT / 100,
      });
    } else {
      ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'FREEZE');
      ae.statusEffects.push({ type: 'FREEZE', duration: PassiveSystem.FREEZE_RETALIATION_DURATION_S, strength: 1 });
    }
  }

  /**
   * KNOCKBACK_RES_PCT/UNSHAKABLE (talents Partie 2 — terra_mountain_patience,
   * terra_unshaking_foundation) — pousse le JOUEUR loin de (sourceX, sourceY)
   * avec la force donnée (px/s), réduite/annulée par les talents de résistance.
   * Overlay décroissant (knockbackX/Y, cf. handleMovement) — jamais un
   * setVelocity direct comme applyKnockback() (la version ennemi) : rien
   * d'autre ne pilote la vélocité ennemie au même tick, mais handleMovement()
   * écraserait un setVelocity direct sur le joueur dès la frame suivante.
   */
  /**
   * Statuts subis par le joueur (talents Partie 2) — même sémantique que côté
   * ennemi (SLOW = fraction de vitesse retirée sur handleMovement, STUN/FREEZE/
   * SHOCK = immobilise, BURN = tick 1×/s via this.cooldowns['player_burn'],
   * même gate 1s que le motif BLEED existant côté ennemi). Appelé chaque frame
   * depuis update().
   */
  private tickPlayerStatusEffects(dt: number): void {
    const slow = this.playerStatusEffects.find(e => e.type === 'SLOW');
    if (slow) {
      slow.duration -= dt;
      if (slow.duration <= 0) this.playerStatusEffects = this.playerStatusEffects.filter(e => e !== slow);
    }
    this.playerSlowMult = slow && slow.duration > 0 ? Math.max(0, 1 - slow.strength) : 1;

    const immobilize = this.playerStatusEffects.find(e => e.type === 'STUN' || e.type === 'FREEZE' || e.type === 'SHOCK');
    if (immobilize) {
      immobilize.duration -= dt;
      if (immobilize.duration <= 0) this.playerStatusEffects = this.playerStatusEffects.filter(e => e !== immobilize);
    }
    this.playerImmobilized = !!immobilize && immobilize.duration > 0;

    const burn = this.playerStatusEffects.find(e => e.type === 'BURN');
    if (burn && burn.duration > 0) {
      burn.duration -= dt;
      const burnKey = 'player_burn';
      if ((!this.cooldowns[burnKey] || this.cooldowns[burnKey] <= 0) && this.gameState.player.stats.hp > 0) {
        this.cooldowns[burnKey] = 1.0;
        const dmg = Math.round(burn.strength);
        if (dmg > 0) {
          this.gameState.player.stats.hp = Math.max(0, this.gameState.player.stats.hp - dmg);
          this.showDamageNumber(this.player.x, this.player.y - 20, dmg, false, ElementType.FIRE, true);
          this.events.emit('player_update', this.gameState.player);
          if (this.gameState.player.stats.hp <= 0) this.onPlayerDeath();
        }
      }
      if (burn.duration <= 0) this.playerStatusEffects = this.playerStatusEffects.filter(e => e.type !== 'BURN');
    }

    this.updatePlayerStatusTint();
  }

  private static readonly PLAYER_STATUS_ON_HIT_CHANCE = 0.12; // 12%, milieu de la fourchette validée 10-15%
  // Élément de l'ennemi ATTAQUANT → statut infligé au joueur. Seuls FIRE/ICE/
  // LIGHTNING sont mappés (validé avec le créateur) — les autres éléments
  // n'infligent aucun statut sur un coup de mêlée basique.
  private static readonly PLAYER_STATUS_ON_HIT_MAP: Partial<Record<ElementType, StatusEffect['type']>> = {
    [ElementType.FIRE]: 'BURN',
    [ElementType.ICE]: 'SLOW',
    [ElementType.LIGHTNING]: 'SHOCK',
  };

  /**
   * Jet de statut sur un coup ennemi (talents Partie 2). Prend l'élément +
   * les dégâts du coup plutôt qu'un `ActiveEnemy` directement : les 3 canaux
   * de dégâts subis (mêlée directe, projectile droit, projectile homing)
   * n'ont pas tous une référence `ae` vivante au moment de l'impact (un
   * projectile qui touche APRÈS la mort de sa source, par ex.) — l'élément
   * et les dégâts, eux, sont toujours connus. Jamais appelé depuis les
   * DOT/passifs (un statut ne doit pas en déclencher un autre en boucle).
   */
  private rollPlayerStatusOnHit(element: ElementType, hitDamage: number): void {
    const type = GameScene.PLAYER_STATUS_ON_HIT_MAP[element];
    if (!type) return;
    // BURN_BLEED_IMMUNITY (abyssal_soul_of_the_deep) — filtre BURN à la source,
    // jamais posé du tout plutôt que posé-puis-ignoré au tick.
    if (type === 'BURN' && this.playerModifiers.burnBleedImmunity) return;
    // debugForceStatusProc (touche Y) : 100% au lieu de 12%, pour valider en
    // quelques coups plutôt qu'en dizaines que le mécanisme se déclenche bien.
    if (!this.debugForceStatusProc && Math.random() >= GameScene.PLAYER_STATUS_ON_HIT_CHANCE) return;
    // STATUS_RES_DURATION_PCT (glacius_unmelting_memory, plafonné à 60 dans
    // TalentSystem) réduit la durée — jamais la chance d'être touché.
    const baseDurationS = type === 'BURN' ? 2 : type === 'SLOW' ? 1.75 : 1.5; // SHOCK, le plus dur, le plus court
    const durationS = baseDurationS * (1 - this.playerModifiers.statusResDurationPct / 100);
    if (durationS <= 0) return;
    this.playerStatusEffects = this.playerStatusEffects.filter(e => e.type !== type);
    this.playerStatusEffects.push({
      type,
      duration: durationS,
      // BURN : fraction du coup qui l'a posé plutôt que de l'ATK brut de la
      // source — évite un paramètre supplémentaire à faire voyager depuis les
      // 3 canaux d'appel, et reste cohérent ("la brûlure est proportionnelle
      // au coup qui l'a causée").
      strength: type === 'BURN' ? Math.max(1, Math.round(hitDamage * 0.4))
        : type === 'SLOW' ? 0.35
        : 1, // SHOCK : immobilise, strength non lue
    });
    this.showPlayerStatusAppliedText(type);
  }

  /** Force par défaut (px/s) du knockback subi par le joueur sur un coup de
   *  mêlée ennemi standard — modeste, un "recul" plutôt qu'une projection. */
  private static readonly PLAYER_KNOCKBACK_FORCE = 140;

  private applyKnockbackToPlayer(sourceX: number, sourceY: number, force: number): void {
    if (this.playerModifiers.unshakable) return;
    const reduced = force * (1 - this.playerModifiers.knockbackResPct / 100);
    if (reduced <= 0) return;
    const angle = Math.atan2(this.player.y - sourceY, this.player.x - sourceX);
    this.knockbackX = Math.cos(angle) * reduced;
    this.knockbackY = Math.sin(angle) * reduced;
  }

  /** Apply direct damage to the player (from homing projectile, AoE, etc.).
   *  `sourceX/sourceY` optionnels : position d'origine du coup pour le
   *  knockback (talents Partie 2) — absent pour les appelants qui n'ont pas
   *  de source directionnelle claire, auquel cas aucun knockback n'est appliqué.
   *  `sourceElement` optionnel : élément de la source pour le jet de statut
   *  subi (talents Partie 2) — absent pour les dégâts sans élément (AoE
   *  générique, dégâts scriptés, etc.). */
  private applyDamageToPlayer(damage: number, sourceX?: number, sourceY?: number, sourceElement?: ElementType) {
    if (damage <= 0) return;
    if (this.isDashing) return;
    if (this.time.now < this.iframeUntil) return; // iframes post-hit
    // FROZEN_SANCTUARY_30_PCT — invulnérabilité totale pendant la stase.
    if (this.time.now < this.frozenSanctuaryUntil) return;
    // TRUE_DODGE_25_PCT (hidden_voidwalker_boots) — jet indépendant du DODGE_PCT.
    // AUTO_DODGE partage le MÊME cooldown que le site mêlée (applyEnemyMeleeDamage) :
    // "une attaque toutes les 5s", pas une par canal.
    if (PassiveSystem.rollTrueDodge(this.gameState.player.equipment) || this.rollAutoDodge()) {
      this.showDodgeText(this.player.x, this.player.y - 20);
      return;
    }

    if (this.time.now < this.guardUntil) {
      const refund = Math.round(damage * 0.3);
      damage = Math.max(0, damage - refund);
      if (damage <= 0) return;
    }

    damage = this.mitigatePlayerDamage(damage, this.gameState.player.stats.hp);
    this.rollStaticRetort();
    this.gameState.player.stats.hp = Math.max(0, this.gameState.player.stats.hp - damage);
    this.iframeUntil = this.time.now + 800;
    this.showDamageNumber(this.player.x, this.player.y - 20, damage, false, undefined, true);
    this.applyPlayerHitFx();
    const isKill = this.gameState.player.stats.hp <= 0;
    // damage > 0 : un coup entièrement absorbé par un bouclier (LOW_HP_SHIELD_30_PCT/
    // OVERHEAL_SHIELD_50_PCT ramènent damage à 0 via mitigatePlayerDamage ci-dessus)
    // ne doit ni repousser ni poser de statut — même garde que applyEnemyMeleeDamage
    // (if (finalDmg > 0)), qui lui l'avait déjà correctement.
    if (!isKill && damage > 0 && sourceX !== undefined && sourceY !== undefined) {
      this.applyKnockbackToPlayer(sourceX, sourceY, GameScene.PLAYER_KNOCKBACK_FORCE);
    }
    if (!isKill && damage > 0 && sourceElement !== undefined) this.rollPlayerStatusOnHit(sourceElement, damage);
    this.events.emit('player_update', this.gameState.player);
    if (isKill) this.onPlayerDeath();
  }

  /** Update HP bar and crown positions for a given enemy. */
  private updateEnemyUiPositions(instanceId: string, sprite: Phaser.Physics.Arcade.Sprite, ae: ActiveEnemy) {
    // Anchor on the top of the body's hitbox (which hugs the visible content — see
    // fitSpriteToContent) rather than the padded display frame, so bars/crowns sit
    // right above the creature instead of floating above its transparent padding.
    const body = sprite.body as Phaser.Physics.Arcade.Body | null;
    const contentTopGap = body ? sprite.displayHeight / 2 - body.offset.y : sprite.displayHeight / 2;

    const barData = this.enemyHpBars.get(instanceId);
    if (barData) {
      const barY  = sprite.y - contentTopGap - 8;
      const hpPct = Math.max(0, ae.currentHp / ae.maxHp);
      barData.bg.setPosition(sprite.x, barY);
      barData.bar.setPosition(sprite.x - barData.baseW / 2, barY);
      barData.bar.setSize(Math.max(1, barData.baseW * hpPct), 4);
    }
    const crown = this.enemyCrowns.get(instanceId);
    if (crown) {
      crown.setPosition(sprite.x, sprite.y - contentTopGap - 18);
    }
  }

  private moveEnemyToward(
    body: Phaser.Physics.Arcade.Body,
    sprite: Phaser.Physics.Arcade.Sprite,
    tx: number,
    ty: number,
    speed: number,
  ) {
    const angle = Math.atan2(ty - sprite.y, tx - sprite.x);
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  /** Mannequin de Fer (dev tool, LOOT_STAT_ROLLS.md §10 bis) : seul ID invincible —
   *  les 3 autres mannequins (straw/gilded/arsenal) DOIVENT mourir pour tester le
   *  loot-roll / le re-tirage d'arme, donc PAS de `startsWith('training_dummy')`. */
  private isInvincibleDummy(enemyId: string): boolean {
    return enemyId === 'training_dummy_iron';
  }

  // ── Talents Partie 1 — statut-sur-coup + synergies (Phase 1) ────────────

  /** Nombre d'ennemis actuellement en feu (BURN actif) — ATK_PER_BURNING_PCT
   *  (ignis_volcanic_rage), BURNING_PACK_DMG_PCT (ignis_eruption). */
  private countBurningEnemies(): number {
    let count = 0;
    for (const ae of this.activeEnemies.values()) {
      if (ae.statusEffects.some(e => e.type === 'BURN' && e.duration > 0)) count++;
    }
    return count;
  }

  /** Multiplicateur combiné ATK_PER_BURNING_PCT (continu, par ennemi en feu)
   *  + BURNING_PACK_DMG_PCT (palier binaire, 3+ ennemis en feu simultanément). */
  private getBurningSynergyMult(): number {
    const burning = this.countBurningEnemies();
    let mult = 1 + (this.playerModifiers.atkPerBurningPct * burning) / 100;
    if (burning >= 3) mult *= 1 + this.playerModifiers.burningPackDmgPct / 100;
    return mult;
  }

  /** AUTO_DODGE (zephyr_eye_of_storm) — esquive automatique d'UNE attaque toutes
   *  les 5s (cooldown propre, indépendant de TRUE_DODGE_25_PCT/DODGE_PCT). Pose
   *  le cooldown ET retourne true en un seul appel — appelant doit `return` si
   *  true (même contrat que rollTrueDodge, testé juste avant à chaque site). */
  private rollAutoDodge(): boolean {
    if (!this.playerModifiers.autoDodge) return false;
    if (this.time.now < this.autoDodgeCooldownUntil) return false;
    this.autoDodgeCooldownUntil = this.time.now + 5000;
    return true;
  }

  /** STATIC_RETORT_PCT (fulguris_static_retort) — chance, en subissant un coup,
   *  d'émettre une nova électrique (r80 autour du joueur, 50% Magic ATK, applique
   *  SHOCK) — nœud resté mort après la Phase 1 (ARC_CHANCE_PCT câblé, celui-ci
   *  oublié — trouvé au balayage final du chantier). Appelé depuis les DEUX points
   *  de dégât subi (mêlée + tout le reste), même précédent qu'AUTO_DODGE ci-dessus. */
  private rollStaticRetort(): void {
    if (this.playerModifiers.staticRetortPct <= 0) return;
    if (this.time.now < this.staticRetortCooldownUntil) return;
    if (Math.random() >= this.playerModifiers.staticRetortPct / 100) return;
    this.staticRetortCooldownUntil = this.time.now + 1000;
    const matk = StatsSystem.computeAll(this.gameState.player).matk;
    const dmg = Math.max(1, Math.round(matk * 0.50));
    const px = this.player.x, py = this.player.y;
    for (const go of this.enemies.getChildren()) {
      const sprite = go as Phaser.Physics.Arcade.Sprite;
      if (!sprite.active) continue;
      if (Phaser.Math.Distance.Between(px, py, sprite.x, sprite.y) > 80) continue;
      const ae = this.activeEnemies.get(sprite.name);
      if (!ae || ae.currentHp <= 0) continue;
      this.showDamageNumber(sprite.x, sprite.y - 20, dmg, false, ElementType.LIGHTNING);
      this.spawnHitParticles(sprite.x, sprite.y, ElementType.LIGHTNING);
      this.applyDamageToEnemy(sprite.name, dmg, false);
      if (ae.currentHp <= 0) continue; // tué par la nova — pas de statut sur un cadavre
      // Même convention que rollOnHitStatuses (SHOCK = vulnérabilité +10%/3s, pas un CC).
      ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'SHOCK');
      ae.statusEffects.push({ type: 'SHOCK', duration: 3, strength: 10 });
    }
  }

  /** LOW_HP_ATK_PCT — état RUNTIME (HP courants), volontairement absent de
   *  getStatContribs (cf. commentaire de TalentSystem.getStatContribs) : lu ici,
   *  au moment du dégât, plutôt qu'agrégé en amont dans les stats équipement.
   *  Seuil 35%, cf. le seul nœud source (docstring lowHpAtkMult dans TalentSystem). */
  private getLowHpAtkMult(): number {
    const p = this.gameState.player.stats;
    if (p.maxHp <= 0 || p.hp / p.maxHp >= 0.35) return 1;
    return this.playerModifiers.lowHpAtkMult;
  }

  /** AQUATIC_DEF_PCT (abyssal_coral_armor) — +X% DEF dans les zones aquatiques
   *  (Abyssmar = WATER, Glaciem = ICE). Même modèle que LOW_HP_DEF_PCT (réduction
   *  de dégâts, pas une vraie modification de DEF) — pas de nouveau champ requis,
   *  la zone est déjà typée par élément (ZONE_MAP), cf. commentaire du plan d'origine. */
  private getAquaticDefReductionPct(): number {
    if (this.playerModifiers.aquaticDefPct <= 0) return 0;
    const zoneElement = ZONE_MAP[this.gameState.player.currentZone]?.element;
    const isAquatic = zoneElement === ElementType.WATER || zoneElement === ElementType.ICE;
    return isAquatic ? this.playerModifiers.aquaticDefPct : 0;
  }

  /** LOW_HP_DEF_PCT — même famille que getLowHpAtkMult ci-dessus, mais un seuil
   *  DIFFÉRENT (50%, cf. docstring lowHpDefPct — deux nœuds sources à 35%/50%
   *  agrégés en un seul nombre additif ; 50% retenu car c'est le seuil du nœud
   *  DEF-only, ignis_heat_shield — sous-délivrer légèrement pour le nœud à 35%
   *  plutôt que sur-délivrer pour celui à 50%). Traité comme une réduction de
   *  dégâts SUBIS (même modèle que DAMAGE_REDUCTION_PCT), pas une vraie
   *  modification de la stat DEF — évite de raisonner sur 100/(100+def) pour un
   *  bonus conditionnel/temporaire. Retourne 0 si inactif (pas un multiplicateur). */
  private getLowHpDefReductionPct(): number {
    const p = this.gameState.player.stats;
    if (p.maxHp <= 0 || p.hp / p.maxHp >= 0.50) return 0;
    return this.playerModifiers.lowHpDefPct;
  }

  /** STUN_DMG_PCT (terra_crushing_weight) — vrai sous STUN ou FREEZE actifs
   *  ("contrôle dur" au sens de la description du talent — un SLOW, même
   *  celui posé par un stagger de boss, n'est volontairement PAS visé ici). */
  private getStunDmgMult(ae: ActiveEnemy): number {
    const hardCC = ae.statusEffects.some(e => (e.type === 'STUN' || e.type === 'FREEZE') && e.duration > 0);
    return hardCC ? 1 + this.playerModifiers.stunDmgPct / 100 : 1;
  }

  /** SHOCK_CHANCE_PCT (fulguris_spark_touch/overload) — vulnérabilité posée
   *  sur un ennemi (tick de durée dans tickEnemyAI), lue ici au moment des
   *  dégâts. */
  private getShockVulnMult(ae: ActiveEnemy): number {
    const shock = ae.statusEffects.find(e => e.type === 'SHOCK' && e.duration > 0);
    return shock ? 1 + shock.strength / 100 : 1;
  }

  /**
   * Statuts sur coup (talents Partie 1) — BURN_CHANCE_PCT, SHOCK_CHANCE_PCT,
   * SLOW_ON_HIT, FREEZE_CHANCE_PCT (sorts uniquement, cf. abyssal_ice_veil :
   * « +15% de chance de FREEZE sur les sorts »). Appelé une fois par coup
   * DIRECT depuis les 3 points de contact (mêlée, flèche, sort).
   */
  private rollOnHitStatuses(ae: ActiveEnemy, hitDamage: number, isSpell: boolean): void {
    const mods = this.playerModifiers;

    // BURN — ignis_ember_touch/volcanic_rage. strength dérivée du coup qui l'a
    // posé, même convention que le BURN subi par le joueur (Phase 0).
    if (mods.burnChancePct > 0 && Math.random() < mods.burnChancePct / 100) {
      ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'BURN');
      ae.statusEffects.push({ type: 'BURN', duration: 3, strength: Math.max(1, Math.round(hitDamage * 0.3)) });
    }

    // SHOCK — fulguris_spark_touch/overload. Vulnérabilité +10%/3s (PAS un CC,
    // contrairement au SHOCK subi par le joueur en Phase 0) — valeur fixe du
    // talent, conforme à sa description ("+10% de dégâts subis pendant 3s").
    if (mods.shockChancePct > 0 && Math.random() < mods.shockChancePct / 100) {
      ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'SHOCK');
      ae.statusEffects.push({ type: 'SHOCK', duration: 3, strength: 10 });
    }

    // SLOW_ON_HIT — abyssal_frostbite. Flag booléen : s'applique à CHAQUE
    // coup, pas un jet de chance (la description n'a aucun %). Ne remplace un
    // SLOW déjà présent QUE s'il est plus faible — sinon ce coup écraserait le
    // SLOW de stagger d'un boss (triggerRealStagger, strength 0.6) par ce
    // 0.20 bien plus faible, sur le coup même qui vient de déclencher le
    // stagger (bug trouvé en review).
    const existingSlow = ae.statusEffects.find(e => e.type === 'SLOW');
    if (mods.slowOnHit && (!existingSlow || existingSlow.strength <= 0.20)) {
      ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'SLOW');
      ae.statusEffects.push({ type: 'SLOW', duration: 2, strength: 0.20 });
    }

    // FREEZE_CHANCE_PCT — abyssal_ice_veil. "Sur les sorts" uniquement.
    if (isSpell && mods.freezeChancePct > 0 && Math.random() < mods.freezeChancePct / 100) {
      ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'FREEZE');
      ae.statusEffects.push({ type: 'FREEZE', duration: 2, strength: 1 });
    }
  }

  /** ARC_CHANCE_PCT (fulguris_arc_conduit) — 8% de chance qu'un coup
   *  propage 40% de ses dégâts à l'ennemi le plus proche de la CIBLE (hors
   *  elle-même), en foudre. Pas un statut : dégâts directs (direct=false,
   *  même convention que les autres procs passifs — ne compte pas comme un
   *  coup pour l'Écho, ne déplace pas son ancre). */
  private rollArcChain(ae: ActiveEnemy, hitDamage: number, isCrit = false): void {
    // CRIT_ARC (fulguris_directed_spark) — "chaque coup critique déclenche un arc
    // GARANTI (60% des dégâts)" : nœud resté mort après la Phase 1 (ARC_CHANCE_PCT
    // câblé, CRIT_ARC oublié — trouvé en review lors du balayage final du chantier).
    // Priorité sur le jet normal plutôt que cumul : un seul arc par coup, jamais
    // les deux déclencheurs sur le même hit.
    const guaranteed = isCrit && this.playerModifiers.critArc;
    if (!guaranteed) {
      if (this.playerModifiers.arcChancePct <= 0) return;
      if (Math.random() >= this.playerModifiers.arcChancePct / 100) return;
    }
    let nearest: ActiveEnemy | null = null;
    let nearestDist = Infinity;
    for (const other of this.activeEnemies.values()) {
      if (other.instanceId === ae.instanceId) continue;
      const d = Phaser.Math.Distance.Between(ae.x, ae.y, other.x, other.y);
      if (d < nearestDist) { nearestDist = d; nearest = other; }
    }
    if (!nearest || nearestDist > 200) return; // portée d'arc raisonnable
    const arcDmg = Math.max(1, Math.round(hitDamage * (guaranteed ? 0.6 : 0.4)));
    this.applyDamageToEnemy(nearest.instanceId, arcDmg, false);
    const sprite = this.findEnemySpriteByInstanceId(nearest.instanceId);
    if (sprite) {
      this.showDamageNumber(sprite.x, sprite.y - 20, arcDmg, false, ElementType.LIGHTNING);
      this.spawnHitParticles(sprite.x, sprite.y, ElementType.LIGHTNING);
    }
  }

  /** PHANTOM_STRIKE_PCT (fulguris_directed_spark family) — chance qu'un coup
   *  direct soit doublé d'un coup fantôme identique, instantané, sans consommer
   *  de cooldown (juste une deuxième instance de dégâts sur la même cible). */
  private rollPhantomStrike(ae: ActiveEnemy, hitDamage: number, element: ElementType): void {
    if (this.playerModifiers.phantomStrikePct <= 0) return;
    if (Math.random() >= this.playerModifiers.phantomStrikePct / 100) return;
    if (ae.currentHp <= 0) return;
    const sprite = this.findEnemySpriteByInstanceId(ae.instanceId);
    if (sprite) {
      this.showDamageNumber(sprite.x, sprite.y - 20, hitDamage, false, element);
      this.spawnHitParticles(sprite.x, sprite.y, element);
    }
    this.applyDamageToEnemy(ae.instanceId, hitDamage, false);
  }

  /** Point d'entrée unique pour les 3 canaux directs (mêlée/flèche/sort) —
   *  statuts sur coup + arc en chaîne + coup fantôme. */
  private applyOnHitTalentEffects(
    ae: ActiveEnemy, hitDamage: number, isSpell: boolean, element?: ElementType, isCrit = false,
  ): void {
    this.rollOnHitStatuses(ae, hitDamage, isSpell);
    this.rollArcChain(ae, hitDamage, isCrit);
    this.rollPhantomStrike(ae, hitDamage, element ?? ElementType.NEUTRAL);
  }

  /**
   * `direct` (défaut false) : ÉCHO — true pour un coup direct (aucun appelant actuel
   * n'en a besoin, les 3 canaux directs — mêlée/flèches/sorts — mutent currentHp en
   * scène sans passer par cette fonction, cf. registerEchoDamage) ; faux pour tout le
   * reste (aura, riposte, écho de passif) — la sémantique "tick" par défaut de ce
   * funnel correspond exactement à la sémantique "tick" attendue par l'Écho.
   */
  private applyDamageToEnemy(instanceId: string, damage: number, direct: boolean = false) {
    const ae = this.activeEnemies.get(instanceId);
    if (!ae) return;
    // Le Mannequin de Fer compte NORMALEMENT pour l'Écho (banc de test de build
    // valide, pas un bug) — enregistré AVANT le clamp isTrainingDummy ci-dessous.
    this.registerEchoDamage(instanceId, damage, direct);
    // PV figés à 100% pour tester hitbox/dégâts en boucle sans le tuer — les
    // numéros de dégâts restent affichés (calculés en amont, indépendants de currentHp).
    const isTrainingDummy = this.isInvincibleDummy(ae.enemyId);
    if (!isTrainingDummy) ae.currentHp -= damage;

    // Flash visuel
    const sprite = this.enemies.getChildren().find(
      (c) => (c as Phaser.Physics.Arcade.Sprite).name === instanceId,
    ) as Phaser.Physics.Arcade.Sprite | undefined;
    if (sprite?.active) {
      sprite.setTint(0xffffff);
      this.time.delayedCall(80, () => { if (sprite.active) this.resetEnemyTint(sprite); });
    }

    if (!isTrainingDummy && ae.currentHp <= 0 && sprite?.active) {
      this.onEnemyKilled(ae, sprite);
    }
  }

  // ── HIDDEN — VAGUE 2 : helpers ───────────────────────────────

  /** Applique des dégâts « passifs » (Marque de Magma, aura, auto-bolt, écho de
   *  compétence) à un ennemi, en drainant l'OMNIVAMP_25_PCT au passage — le passif
   *  soigne sur « TOUS les dégâts infligés », pas seulement les attaques directes. */
  private applyPassiveDamageToEnemy(instanceId: string, damage: number): void {
    if (damage <= 0) return;
    // Cible réelle uniquement — sans ça, l'omnivol pourrait soigner sur un ennemi
    // déjà retiré (mannequin/sprite en cours de destruction) qui n'a rien encaissé.
    if (!this.activeEnemies.has(instanceId)) return;
    this.applyDamageToEnemy(instanceId, damage);
    const omnivampPct = PassiveSystem.getOmnivampPct(this.gameState.player.equipment);
    if (omnivampPct > 0) {
      PassiveSystem.applyHeal(this.gameState.player, Math.floor(damage * omnivampPct / 100), this.playerModifiers);
    }
  }

  /** PERMA_BURN_STACK_3_PCT — pose/incrémente un stack de Marque de Magma sur une
   *  cible (plafonné), no-op si hidden_magma_cleaver n'est pas équipé. */
  private addMagmaStackIfEquipped(instanceId: string): void {
    if (!PassiveSystem.hasMagmaBurn(this.gameState.player.equipment)) return;
    const cur = this.magmaBurnStacks.get(instanceId) ?? 0;
    this.magmaBurnStacks.set(instanceId, Math.min(PassiveSystem.MAGMA_BURN_STACK_MAX, cur + 1));
  }

  /** CRIT_CD_RESET_1S — sur un critique, réduit d'1s les cooldowns des SEULES
   *  compétences équipées (jamais les clés internes atkcd_/bleed_/magma_/dash de
   *  this.cooldowns : les réduire fausserait le timing des ennemis). */
  private tryCritCdReset(isCrit: boolean): void {
    if (!isCrit) return;
    if (!PassiveSystem.tryTriggerCritCdReset(this.gameState.player.equipment, this.critCdResetState, this.time.now)) return;
    const slots = this.gameState.player.equippedSkills;
    for (const skillId of [slots.slot1, slots.slot2, slots.slot3, slots.slot4]) {
      if (skillId && this.cooldowns[skillId] > 0) {
        this.cooldowns[skillId] = Math.max(0, this.cooldowns[skillId] - PassiveSystem.CRIT_CD_RESET_S);
      }
    }
  }

  /** BURNING_AURA_5_PCT_ATK (hidden_emberheart_carapace) — tick périodique (500ms)
   *  infligeant 5%/s d'ATK aux ennemis dans le rayon (part au prorata de l'intervalle). */
  private tickBurningAura(time: number): void {
    if (!PassiveSystem.hasBurningAura(this.gameState.player.equipment)) return;
    if (time - this.lastBurningAuraTime < PassiveSystem.BURNING_AURA_TICK_INTERVAL_MS) return;
    this.lastBurningAuraTime = time;
    const atk = StatsSystem.computeAll(this.gameState.player).atk;
    const perTick = Math.max(1, Math.round(
      atk * PassiveSystem.BURNING_AURA_PCT_PER_SEC / 100
      * PassiveSystem.BURNING_AURA_TICK_INTERVAL_MS / 1000,
    ));
    const px = this.player.x, py = this.player.y;
    // Snapshot des ids : applyPassiveDamageToEnemy peut tuer (mutation de la Map).
    const ids = Array.from(this.activeEnemies.keys());
    for (const id of ids) {
      const sprite = this.enemies.getChildren().find(
        (c) => (c as Phaser.Physics.Arcade.Sprite).name === id,
      ) as Phaser.Physics.Arcade.Sprite | undefined;
      if (!sprite?.active) continue;
      if (Phaser.Math.Distance.Between(px, py, sprite.x, sprite.y) > PassiveSystem.BURNING_AURA_RADIUS_PX) continue;
      this.showDamageNumber(sprite.x, sprite.y - 12, perTick, false, ElementType.FIRE);
      this.applyPassiveDamageToEnemy(id, perTick);
    }
  }

  /** STAFF_FINISHER_ZONE (arc_elemental_wake) — pose une zone élémentaire (r70, 2s,
   *  tick 500ms, 20% ATK/tick) au point VISÉ par le dernier hit du finisher STAFF
   *  (calculé via facingAngle/range, même formule que spawnWeaponSwingVfx — le
   *  finisher STAFF est un cône instantané, pas un projectile : il n'y a pas de
   *  position d'impact réelle à observer après coup, cf. executeFinisherAttack). */
  private spawnFinisherZone(x: number, y: number, element: ElementType): void {
    const radius = 70;
    const color = ELEMENT_PROJECTILE_COLORS[element] ?? 0xffffff;
    const gfx = this.add.circle(x, y, radius, color, 0.22).setDepth(2);
    this.tweens.add({ targets: gfx, alpha: 0.08, duration: 600, yoyo: true, repeat: -1 });
    this._finisherZones.push({
      x, y, element, radius,
      expiresAt: this.time.now + 2000,
      nextTickAt: this.time.now,
      gfx,
    });
  }

  private tickFinisherZones(time: number): void {
    if (this._finisherZones.length === 0) return;
    const atk = StatsSystem.computeAll(this.gameState.player).atk;
    for (let i = this._finisherZones.length - 1; i >= 0; i--) {
      const zone = this._finisherZones[i];
      if (time >= zone.expiresAt) {
        if (zone.gfx.active) zone.gfx.destroy();
        this._finisherZones.splice(i, 1);
        continue;
      }
      if (time < zone.nextTickAt) continue;
      zone.nextTickAt = time + 500;
      const dmg = Math.max(1, Math.round(atk * 0.20));
      // Snapshot des ids : applyDamageToEnemy peut tuer (mutation de la Map).
      const ids = Array.from(this.activeEnemies.keys());
      for (const id of ids) {
        const ae = this.activeEnemies.get(id);
        if (!ae || ae.currentHp <= 0) continue;
        // Position RÉELLE du sprite, jamais ActiveEnemy.x/y (jamais resynchronisé
        // après le spawn — cf. commentaire finisherNova/quakeFinisher).
        const sprite = this.findEnemySpriteByInstanceId(id);
        if (!sprite || Phaser.Math.Distance.Between(zone.x, zone.y, sprite.x, sprite.y) > zone.radius) continue;
        this.showDamageNumber(sprite.x, sprite.y - 12, dmg, false, zone.element);
        this.spawnHitParticles(sprite.x, sprite.y, zone.element);
        this.applyDamageToEnemy(id, dmg, false);
      }
    }
  }

  /** AUTO_BOLT_150_PCT_MATK (hidden_tempest_amulet) — toutes les 5s, foudroie
   *  l'ennemi le plus proche dans la portée pour 150% MATK. */
  private tickAutoBolt(time: number): void {
    if (!PassiveSystem.hasAutoBolt(this.gameState.player.equipment)) return;
    if (time - this.lastAutoBoltTime < PassiveSystem.AUTO_BOLT_INTERVAL_MS) return;
    const target = this.findNearestEnemy(PassiveSystem.AUTO_BOLT_RANGE_PX);
    if (!target) return; // pas de cible : on retente au prochain tick, sans reset du timer
    this.lastAutoBoltTime = time;
    const matk = StatsSystem.computeAll(this.gameState.player).matk;
    const dmg = Math.max(1, Math.round(matk * PassiveSystem.AUTO_BOLT_MATK_PCT / 100));
    this.spawnCosmeticProjectile(this.player.x, this.player.y, target.x, target.y, ElementType.LIGHTNING);
    this.showDamageNumber(target.x, target.y - 20, dmg, false, ElementType.LIGHTNING);
    this.spawnHitParticles(target.x, target.y, ElementType.LIGHTNING);
    this.applyPassiveDamageToEnemy(target.name, dmg);
  }

  /** DAMAGE_DEFERRAL_50_PCT (hidden_runebound_amulet) — tick 1s de la file différée.
   *  Appliqué DIRECTEMENT sur les HP (jamais via mitigatePlayerDamage : re-router un
   *  dégât différé le re-diviserait → boucle infinie de report). La stase le met en pause. */
  private tickDeferredDamage(time: number): void {
    if (this.deferredDamageQueue.length === 0) return;
    if (time < this.frozenSanctuaryUntil) return;
    if (time - this.lastDeferredTickTime < PassiveSystem.DAMAGE_DEFERRAL_INTERVAL_MS) return;
    this.lastDeferredTickTime = time;
    let total = 0;
    for (const entry of this.deferredDamageQueue) {
      total += Math.round(entry.amountPerTick);
      entry.ticksLeft--;
    }
    this.deferredDamageQueue = this.deferredDamageQueue.filter(e => e.ticksLeft > 0);
    if (total <= 0) return;
    const p = this.gameState.player;
    p.stats.hp = Math.max(0, p.stats.hp - total);
    this.showDamageNumber(this.player.x, this.player.y - 20, total, false, undefined, true);
    this.events.emit('player_update', p);
    if (p.stats.hp <= 0) this.onPlayerDeath();
  }

  /** FROZEN_SANCTUARY_30_PCT — soin de 10%/s pendant la fenêtre de stase
   *  (l'invulnérabilité est gérée aux points d'entrée des dégâts). */
  private tickFrozenSanctuaryHeal(time: number): void {
    if (time >= this.frozenSanctuaryUntil) return;
    if (time - this.lastFrozenSanctuaryHealTime < 1000) return;
    this.lastFrozenSanctuaryHealTime = time;
    const p = this.gameState.player;
    const heal = Math.round(p.stats.maxHp * PassiveSystem.FROZEN_SANCTUARY_HEAL_PCT_PER_SEC / 100);
    if (heal <= 0) return;
    PassiveSystem.applyHeal(p, heal, this.playerModifiers);
    this.showHealNumber(this.player.x, this.player.y - 20, heal);
    this.events.emit('player_update', p);
  }

  // ── PROJECTILES ──────────────────────────────────────────────

  private createProjectileGroup() {
    this.projectiles = this.physics.add.group();

    // Overlap : projectile joueur → ennemis
    const projPlayerOverlap = this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      (projGO, _enemyGO) => {
        const proj = projGO as Phaser.Physics.Arcade.Sprite;
        if (!proj.getData('isPlayer')) return;
        const damage     = (proj.getData('damage') as number) ?? 10;
        const instanceId = (_enemyGO as Phaser.Physics.Arcade.Sprite).name;
        if (instanceId) this.applyDamageToEnemy(instanceId, damage);
        proj.destroy();
      },
    );

    // Overlap : projectile ennemi → joueur
    const projEnemyOverlap = this.physics.add.overlap(
      this.player,
      this.projectiles,
      (_playerGO, projGO) => {
        const proj = projGO as Phaser.Physics.Arcade.Sprite;
        if (proj.getData('isPlayer')) return;
        const damage  = (proj.getData('damage') as number) ?? 8;
        const element = proj.getData('element') as ElementType | undefined;
        // Position capturée AVANT destroy() — même précaution que le homing
        // projectile (l'accès post-destroy à x/y est fragile, pas garanti).
        const impactX = proj.x, impactY = proj.y;
        proj.destroy();
        // Route désormais par applyDamageToPlayer() — auparavant ce bloc
        // mutait stats.hp en dur, en contournant iframes correctement gérées
        // ailleurs mais SURTOUT mitigatePlayerDamage() (boucliers,
        // DAMAGE_REDUCTION_PCT), FROZEN_SANCTUARY, le blocage de garde, le
        // TRUE_DODGE, ET les hooks knockback/statut subis (talents Partie 2)
        // — un projectile "burst_fan"/"circular_burst" (frost_wolf, spark_imp)
        // ne posait donc jamais SLOW/SHOCK, contrairement au contact mêlée.
        this.applyDamageToPlayer(damage, impactX, impactY, element);
      },
    );

    // Stocker les deux overlaps pour cleanup lors de la transition de zone
    this.projectileCollider = projPlayerOverlap;
    this.physicsColliders.push(projEnemyOverlap);
  }

  private spawnProjectile(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    element: ElementType | undefined,
    damage: number,
    isPlayer: boolean,
  ) {
    const color  = element ? (ELEMENT_PROJECTILE_COLORS[element] ?? 0xffffff) : 0xffffff;
    const texKey = `proj_${element ?? 'none'}`;

    if (!this.textures.exists(texKey)) {
      const g = this.make.graphics({ x: 0, y: 0, add: false } as any);
      g.fillStyle(color, 1);
      g.fillCircle(5, 5, 5);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(3, 3, 2);
      g.generateTexture(texKey, 10, 10);
      g.destroy();
    }

    const proj = this.physics.add.sprite(fromX, fromY, texKey);
    proj.setDepth(15);
    proj.setData('isPlayer', isPlayer);
    proj.setData('damage', damage);
    // Élément source — statuts subis par le joueur (talents Partie 2), lu à
    // l'impact dans createProjectileGroup(). undefined pour un projectile
    // joueur (isPlayer=true) : jamais lu dans ce cas.
    proj.setData('element', element);

    // BUG (préexistant, confirmé via node_modules/phaser/src/physics/arcade/
    // PhysicsGroup.js:217-229) : `this.projectiles.add(proj)` déclenche
    // createCallbackHandler(), qui réapplique les vélocités PAR DÉFAUT du
    // groupe (0,0, jamais configurées explicitement) sur TOUT enfant ajouté —
    // même un enfant qui a DÉJÀ un corps physique. Poser la vélocité AVANT
    // `add()` la faisait donc écraser à (0,0) immédiatement après : tous les
    // projectiles ennemis en ligne droite (burst_fan/circular_burst) partaient
    // figés sur leur point d'origine. Il faut `add()` D'ABORD, `setVelocity()`
    // APRÈS.
    this.projectiles.add(proj);

    const angle = Math.atan2(toY - fromY, toX - fromX);
    const speed = isPlayer ? 400 : 280;
    (proj.body as Phaser.Physics.Arcade.Body).setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
    );

    // Auto-destroy après 2s
    this.time.delayedCall(2000, () => { if (proj.active) proj.destroy(); });

    // Tween de pulsation
    this.tweens.add({
      targets: proj,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });
  }

  // Projectile cosmétique joueur : tween pur, pas de physique, damage déjà appliqué
  private spawnCosmeticProjectile(
    fromX: number, fromY: number,
    toX: number, toY: number,
    element?: ElementType,
  ) {
    const color = element ? (ELEMENT_PROJECTILE_COLORS[element] ?? 0xffffff) : 0xffffff;
    const size  = element === ElementType.WATER ? 8 : 5;
    const proj  = this.add.circle(fromX, fromY, size, color, 1).setDepth(16);
    // Halo lumineux
    const glow  = this.add.circle(fromX, fromY, size + 3, color, 0.3).setDepth(15);

    const dist = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
    const dur  = Math.max(120, Math.min(350, dist * 0.8));

    this.tweens.add({
      targets: [proj, glow],
      x: toX, y: toY,
      duration: dur,
      ease: 'Linear',
      onComplete: () => {
        // Explosion d'impact
        this.tweens.add({
          targets: [proj, glow],
          scaleX: 3, scaleY: 3, alpha: 0,
          duration: 120,
          onComplete: () => { proj.destroy(); glow.destroy(); },
        });
      },
    });
  }

  // ── EVENTS ──────────────────────────────────────────────────

  private onEnemyKilled(activeEnemy: ActiveEnemy, sprite: Phaser.Physics.Arcade.Sprite) {
    const enemyDef = ENEMY_MAP[activeEnemy.enemyId];
    if (!enemyDef) return;

    // BLOCKER-D: killHealPct — soin au kill (approximation : appliqué sur toute mort)
    // + bonus KILL_HEAL_15_PCT (hidden_void_reaper), cumulé au même % (même effet).
    const killHealPct = this.playerModifiers.killHealPct + PassiveSystem.getKillHealBonusPct(this.gameState.player.equipment);
    if (killHealPct > 0) {
      // PassiveSystem.applyHeal : convertit le surplus en bouclier si OVERHEAL_SHIELD
      // est équipé, au lieu d'un clamp manuel qui le perdrait.
      PassiveSystem.applyHeal(this.gameState.player, Math.round(this.gameState.player.stats.maxHp * killHealPct / 100), this.playerModifiers);
    }
    // HP_ON_KILL_FLAT / MANA_ON_KILL_FLAT (loot stat rolls) — additif avec
    // KILL_HEAL_15_PCT / MANA_ON_KILL_PCT (ABYSSAL), même point de branchement.
    const csOnKill = StatsSystem.computeAll(this.gameState.player);
    if (csOnKill.hpOnKill > 0) {
      PassiveSystem.applyHeal(this.gameState.player, csOnKill.hpOnKill, this.playerModifiers);
    }
    // MANA_ON_KILL_PCT (abyssal_void_drain) — % du mana MAX, additif avec le flat
    // manaOnKill des stat rolls ci-dessus (même point de branchement, sources
    // différentes : % vs plat).
    const manaOnKillTotal = csOnKill.manaOnKill
      + Math.round(this.gameState.player.stats.maxMana * this.playerModifiers.manaOnKillPct / 100);
    if (manaOnKillTotal > 0) {
      this.gameState.player.stats.mana = Math.min(
        this.gameState.player.stats.maxMana,
        this.gameState.player.stats.mana + manaOnKillTotal,
      );
    }
    // KILL_STACK_DAMAGE (hidden_soul_bow) — stack permanent, ne se réinitialise jamais.
    PassiveSystem.incrementKillStackIfEquipped(this.gameState.player);

    // BLOCKER 1: cancel charge timers to prevent ghost damage after death
    const telegraphTimer = sprite.getData('telegraphTimer') as Phaser.Time.TimerEvent | undefined;
    const chargeTick     = sprite.getData('chargeTick')     as Phaser.Time.TimerEvent | undefined;
    const chargeStop     = sprite.getData('chargeStopTimer') as Phaser.Time.TimerEvent | undefined;
    telegraphTimer?.remove(false);
    chargeTick?.remove(false);
    chargeStop?.remove(false);

    // BUG 4 fix: remove this enemy's cooldown entries immediately on death
    const iid = activeEnemy.instanceId;
    delete this.cooldowns[`atkcd_${iid}`];
    delete this.cooldowns[`melee_${iid}`];
    delete this.cooldowns[`bleed_${iid}`];
    delete this.cooldowns[`magma_${iid}`];
    delete this.cooldowns[`burn_${iid}`];
    this.magmaBurnStacks.delete(iid);

    this.activeEnemies.delete(activeEnemy.instanceId);

    const barData = this.enemyHpBars.get(activeEnemy.instanceId);
    if (barData) { barData.bg.destroy(); barData.bar.destroy(); this.enemyHpBars.delete(activeEnemy.instanceId); }
    const crown = this.enemyCrowns.get(activeEnemy.instanceId);
    if (crown) { crown.destroy(); this.enemyCrowns.delete(activeEnemy.instanceId); }

    const xpMult   = activeEnemy.isElite ? 2.5 : 1;
    const deathX   = sprite.x;
    const deathY   = sprite.y;
    const isBoss   = enemyDef.isBoss;

    // Bestiaire — premier kill (capturé AVANT le roll de loot : sert de qFloor
    // de Résonance boss ci-dessous — pas de notion distincte de "drop garanti"
    // ailleurs dans le code, recordKill() est le seul signal "premier kill").
    const isFirstKill = BestiarySystem.recordKill(this.gameState.world, activeEnemy.enemyId);

    // Remove from physics immediately so it no longer blocks or attacks
    sprite.disableBody(true, false);

    if (isBoss) {
      this.playBossDeathSequence(sprite, activeEnemy, enemyDef);
    } else {
      this.playEnemyDeathSequence(sprite);
    }

    // Drop garanti de boss (première mort) : Résonance plancher 0.5
    // (docs/design/LOOT_STAT_ROLLS.md §5 — "la mort d'une divinité ne récompense
    // jamais par une insulte"). Standard sinon (qFloor 0).
    const lootQFloor = (isBoss && isFirstKill) ? 0.5 : 0;
    const loot = LootSystem.rollLoot(
      enemyDef.loot, enemyDef.baseGold, enemyDef.baseXp,
      activeEnemy.level, this.gameState.player, lootQFloor,
      // Élites et boss ont une chance nettement accrue de world drop (catalogue
      // générique) — c'est ce qui rend leur mise à mort intéressante au-delà de
      // leur table fixe.
      { isElite: !!activeEnemy.isElite, isBoss: !!isBoss },
    );

    this.gameState.player.gold += loot.gold;
    // Raretés dont un item a RÉELLEMENT rejoint l'inventaire ce kill-ci — sert à
    // filtrer loot.pityPaid plus bas (même piège que item_looted : sac plein →
    // l'item est jeté au sol, la notif « Garantie honorée ! » ne doit pas mentir
    // en s'affichant quand même).
    const addedRarities = new Set<ItemRarity>();
    // RunSystem : pendant une run, le butin va dans le sac de run (20/4, perdu à
    // l'exfiltration sauf slots sûrs) — JAMAIS dans la banque de Grievy Town tant
    // que la run n'est pas terminée. Gap critique trouvé au premier playtest : le
    // loot continuait d'atterrir dans player.inventory sans jamais passer par
    // RunBagSystem, laissant le sac de run vide à l'extraction.
    const activeRun = this.gameState.run?.active ? this.gameState.run : null;
    for (const { item, quantity } of loot.items) {
      // Le retour d'addToInventory/addToRunBag était ignoré : sac plein → l'item
      // était jeté, MAIS la notification de loot s'affichait quand même. Le joueur
      // voyait un drop qu'il ne recevait jamais. On ne notifie que ce qui est
      // réellement pris.
      const added = activeRun
        ? RunBagSystem.addToRunBag(activeRun, item, quantity).ok
        : LootSystem.addToInventory(this.gameState.player, item, quantity, this.gameState.world);
      if (!added) {
        const reason = activeRun ? 'Sac de run plein' : 'Sac plein';
        this.events.emit('show_notification', `${reason} — ${item.name} laissé au sol !`);
        continue;
      }
      addedRarities.add(item.rarity);
      this.events.emit('item_looted', { item, quantity });
      // Bestiaire — révéler les drops hidden au premier loot (progression globale
      // du joueur, non concernée par la distinction run/banque — reste actif).
      BestiarySystem.revealDrop(this.gameState.world, activeEnemy.enemyId, item.id);
    }
    // Notif « Garantie honorée ! » APRÈS la boucle d'inventaire (pas avant) —
    // seulement pour les raretés dont l'item a survécu au test du sac plein.
    for (const rarity of loot.pityPaid) {
      if (addedRarities.has(rarity)) this.events.emit('pity_paid', rarity);
    }

    // ⚠ DEV TOOL — Mannequin d'Essai (training_dummy_arsenal) : au lieu d'une table
    // de loot figée, il redonne un TIRAGE NEUF de l'arme actuellement équipée. C'est
    // ce qui permet de tester les fourchettes de n'importe quel item : équiper la
    // pièce à observer, taper le mannequin en boucle, comparer les rolls obtenus au
    // range du catalogue. Gaté par le flag dev comme le spawn du mannequin lui-même.
    if (activeEnemy.enemyId === 'training_dummy_arsenal') {
      const equipped = this.gameState.player.equipment.weapon;
      const template = equipped ? ALL_ITEMS[equipped.id] : undefined;
      if (!template) {
        this.events.emit('show_notification', '[DEBUG] Équipez une arme : le Mannequin d\'Essai en rejoue le tirage.');
      } else {
        const rolled = StatRollSystem.rollItem(template, 0);
        // Défense en profondeur : ce mannequin n'existe aujourd'hui que dans
        // grievy_town (fixedEnemies), jamais atteignable en run — mais si un jour
        // il l'était, son loot doit suivre la même règle que le reste (sac de run).
        const added = activeRun
          ? RunBagSystem.addToRunBag(activeRun, rolled, 1).ok
          : LootSystem.addToInventory(this.gameState.player, rolled, 1, this.gameState.world);
        if (added) this.events.emit('item_looted', { item: rolled, quantity: 1 });
        else this.events.emit('show_notification', '[DEBUG] Sac plein — tirage perdu.');
      }
    }

    this.spawnXpOrbs(deathX, deathY, Math.floor(loot.xp * xpMult));

    const questCompleted = QuestSystem.onEnemyKilled(this.gameState.player, activeEnemy.enemyId, this.gameState.world);
    for (const itemLoot of loot.items) {
      QuestSystem.onItemCollected(this.gameState.player, itemLoot.item.id, itemLoot.quantity, this.gameState.world);
    }
    if (questCompleted.length > 0) this.handleQuestCompletions(questCompleted);

    // RunSystem (Phase 4) — +1 kill vers le quota ; quota atteint fait disparaître
    // les mobs restants et spawn le boss à bossRoomCenter (jamais le centre-carte).
    if (!isBoss && this.gameState.run?.active) {
      const quotaReached = RunSystem.registerKill(this.gameState.run);
      if (quotaReached && this.currentGeneratedMap) {
        this.spawnRunBoss(this.gameState.player.currentZone, this.currentGeneratedMap.bossRoomCenter);
      }
    }

    // Gaté par !run?.active : tuer le boss d'une run (Pyrath, potentiellement
    // plusieurs fois via "Continuer") n'est PAS un clear de zone legacy — sans
    // cette garde, "Zone libérée" (skills débloqués, dégradation du monde...)
    // se redéclenchait à chaque leg (trouvé en revue de code). Le boss de run a
    // son propre hook juste en dessous, indépendant de ce bloc.
    if (isBoss && !this.gameState.run?.active) {
      const zone = Object.values(ZONE_MAP).find(z => z.bossId === enemyDef.id);
      if (zone) {
        const zoneCompleted = QuestSystem.onBossKilled(this.gameState.player, enemyDef.id, zone.element as ElementType, this.gameState.world);
        this.gameState.world.clearedZones = this.gameState.player.clearedZones;

        const newSkills = SkillSystem.unlockZoneSkills(this.gameState.player, zone.element);
        newSkills.forEach(s => this.events.emit('skill_unlocked', s));

        this.gameState.world.degradationLevel = this.gameState.player.clearedZones.length;
        this.applyWorldDegradation();

        if (zoneCompleted.length > 0) this.handleQuestCompletions(zoneCompleted);
        this.events.emit('zone_cleared', zone);
      }
    }

    // RunSystem (Phase 4/7) — boss de run vaincu : bascule en awaiting_choice et
    // lance directement l'écran d'exfiltration/continuer (RunBagScene mode 'extract').
    if (isBoss && this.gameState.run?.active && this.gameState.run.phase === 'boss_fight') {
      RunSystem.onBossDefeated(this.gameState.run);
      this.time.delayedCall(1200, () => this.openRunBagScene('extract'));
    }

    const hidden = SkillSystem.checkHiddenUnlocks(this.gameState.player);
    hidden.forEach(s => this.events.emit('skill_unlocked', s));
  }

  private playEnemyDeathSequence(sprite: Phaser.Physics.Arcade.Sprite) {
    const baseScale = (sprite.getData('baseScale') as number | undefined) ?? sprite.scale;
    sprite.setTintFill(0xffffff);
    this.tweens.add({
      targets: sprite,
      alpha: 0,
      scaleX: baseScale * 0.2,
      scaleY: baseScale * 0.2,
      duration: 350,
      ease: 'Power3',
      // sprite.active est déjà à false ici (onEnemyKilled appelle
      // disableBody(true, false) avant playEnemyDeathSequence) — un garde
      // `if (sprite.active)` serait toujours faux (bug d'origine). `sprite.scene`
      // devient undefined UNIQUEMENT après un vrai destroy() (ex: transition de
      // zone qui a détruit ce sprite entre-temps) — garde précise plutôt qu'un
      // destroy() inconditionnel : destroy() est idempotent (no-op si déjà
      // détruit) donc les deux sont sans risque, mais celle-ci évite en plus
      // tout travail redondant sur un sprite déjà mort.
      onComplete: () => { if (sprite.scene) sprite.destroy(); },
    });
  }

  private playBossDeathSequence(
    sprite: Phaser.Physics.Arcade.Sprite,
    _ae: ActiveEnemy,
    _enemyDef: Enemy,
  ) {
    const baseScale = (sprite.getData('baseScale') as number | undefined) ?? sprite.scale;

    sprite.setTint(0xffffff);
    this.cameras.main.shake(200, 0.012);

    const aura = this.add.circle(sprite.x, sprite.y, 40, 0xffffff, 0.6).setDepth(30);
    this.bossDeathObjects.push(aura);
    this.tweens.add({
      targets: aura,
      scaleX: 5,
      scaleY: 5,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => { if (aura.active) aura.destroy(); },
    });

    this.time.delayedCall(600, () => {
      // BUG (préexistant, indépendant du chantier talents) : onEnemyKilled()
      // appelle sprite.disableBody(true, false) — qui met sprite.active À FALSE
      // — AVANT d'appeler playBossDeathSequence(). Un `if (sprite.active)` ici
      // était donc TOUJOURS faux : le tween de fondu ne se lançait jamais, le
      // sprite du boss restait visible à l'écran indéfiniment après sa mort.
      // sprite.visible reste true (disableBody(hideGameObject=false)) donc rien
      // n'empêche le tween lui-même de tourner sur un objet "inactive". Garde
      // sur `sprite.scene` (devient undefined seulement après un VRAI destroy(),
      // ex: destroyCurrentZoneObjects() si le joueur change de zone pendant
      // cette fenêtre de 600ms) plutôt qu'un lancement inconditionnel — évite
      // de programmer un tween pour rien sur un sprite déjà mort ailleurs.
      if (!sprite.scene) return;
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        scaleX: baseScale * 0.2,
        scaleY: baseScale * 0.2,
        duration: 800,
        ease: 'Power2',
        onComplete: () => { if (sprite.scene) sprite.destroy(); },
      });
    });
    // Le nom du boss ne s'affiche QU'à son apparition (showBossAnnouncement) —
    // le réafficher à sa mort n'a pas de sens (demande explicite du créateur,
    // 15/07/2026) : un ancien nameLabel centré-écran vivait ici, retiré.
  }

  private onPlayerDeath() {
    if (this.isTraveling) return;
    this.isTraveling = true;
    // Écho : mort du JOUEUR (pas de l'ancre) — destruction IMMÉDIATE, sans
    // l'animation de libération (réservée à l'expiration naturelle de la fenêtre).
    this.destroyEchoImmediate();
    this.gameState.player.deaths++;

    // RunSystem — mort EN RUN : le sac est entièrement perdu, jamais un respawn
    // sur la même carte (elle vient d'être invalidée) — retour direct à Grievy
    // Town, pas performZoneTransition(currentZone) comme le chemin legacy.
    const run = this.gameState.run;
    const wasInRun = !!run?.active;
    if (run?.active) {
      RunSystem.onPlayerDeath(run);
      this.gameState.run = null;
      this.currentGeneratedMap = null;
    }

    // Retour en run → Grievy Town est une zone sûre (aucun combat) ET le sac
    // vient déjà d'être perdu : laisser le joueur à moitié vie dans le hub
    // n'ajoute rien, juste une gêne (retour créateur). Le chemin legacy (respawn
    // SUR PLACE, toujours en danger) garde la pénalité de 50% comme avant.
    this.gameState.player.stats.hp = wasInRun
      ? this.gameState.player.stats.maxHp
      : Math.floor(this.gameState.player.stats.maxHp * 0.5);
    // DAMAGE_DEFERRAL_50_PCT : purger la file différée à la mort — sinon les moitiés
    // restantes continueraient de frapper stats.hp après le respawn (dégât
    // fantôme post-mortem, voire re-kill en chaîne). init() n'est pas rappelé au respawn.
    this.deferredDamageQueue = [];
    this.lastDeferredTickTime = 0;
    // La stase de glace et le bouclier de surplus sont de l'état de combat, mort avec
    // le joueur — repartir « propre » évite qu'un reliquat traverse le respawn.
    this.frozenSanctuaryUntil = 0;
    this.gameState.player.passiveStacks['OVERHEAL_SHIELD_50_PCT'] = 0;
    // Statuts/knockback subis (talents Partie 2) — même raison que ci-dessus,
    // repartir "propre" au respawn.
    this.playerStatusEffects = [];
    this.playerSlowMult      = 1;
    this.playerImmobilized   = false;
    this.knockbackX          = 0;
    this.knockbackY          = 0;

    this.physics.world.pause();
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.time.delayedCall(0, () => {
          this.gameState.player.position = { x: 0, y: 0 };
          const targetZone = wasInRun ? 'grievy_town' : this.gameState.player.currentZone;
          this.performZoneTransition(targetZone, 0, 0);
        });
      },
    );
    this.cameras.main.fade(500, 0, 0, 0);
  }

  private handleQuestCompletions(questIds: string[]) {
    questIds.forEach(id => this.events.emit('quest_completed', id));
  }

  // ── WORLD DEGRADATION ────────────────────────────────────────

  private applyWorldDegradation() {
    const deg = this.gameState.world.degradationLevel;
    const ambient = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xffffff),
      Phaser.Display.Color.ValueToColor(0x888888),
      6, deg,
    );
    this.cameras.main.setBackgroundColor(
      Phaser.Display.Color.GetColor(ambient.r, ambient.g, ambient.b),
    );
  }

  // ── HELPERS ─────────────────────────────────────────────────

  private findNearestEnemy(maxRange: number): Phaser.Physics.Arcade.Sprite | undefined {
    let nearest: Phaser.Physics.Arcade.Sprite | undefined;
    let minDist = maxRange;

    this.enemies.children.getArray().forEach((go: Phaser.GameObjects.GameObject) => {
      const sprite = go as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (dist < minDist) { minDist = dist; nearest = sprite; }
    });

    return nearest;
  }

  private spawnDashAfterimages() {
    const w = this.player.displayWidth;
    const h = this.player.displayHeight;
    const x = this.player.x;
    const y = this.player.y;

    for (let i = 0; i < 3; i++) {
      const ghost = this.add.rectangle(x, y, w, h, 0x44aaff, 0.3 - i * 0.08)
        .setDepth(3).setOrigin(0.5);
      this.tweens.add({
        targets: ghost,
        alpha: 0,
        duration: 200,
        delay: i * 50,
        onComplete: () => ghost.destroy(),
      });
    }
  }

  // ── ANNEAU DE COMBO (AU SOL) ────────────────────────────────
  /**
   * Les pips de combo vivaient dans le HUD, en haut de l'écran. À 4 coups/s ils
   * sont MORTS : l'œil du joueur ne quitte jamais le cône de danger autour de son
   * personnage — il n'a ni le temps ni la raison de monter lire un compteur.
   * Un signal que le joueur ne peut pas regarder n'est pas un signal.
   *
   * L'anneau vit donc AUX PIEDS du joueur, sous le sprite, exactement là où le
   * regard est déjà posé. Il dit trois choses sans un mot : où en est la chaîne,
   * que le prochain coup est le FINISHER (segments blanc-or, pulse), et qu'elle
   * va EXPIRER (clignotement).
   */
  private static readonly COMBO_RING_RADIUS = 26;
  private comboRing: Phaser.GameObjects.Container | null = null;
  /** Grâce effective de la chaîne en cours — sert à décider si un clignotement est LISIBLE. */
  private comboGraceMs = 0;

  private static readonly WEAPON_RING_COLOR: Partial<Record<WeaponType, number>> = {
    [WeaponType.DAGGER]: 0xcccccc,
    [WeaponType.DUAL_DAGGER]: 0xcccccc,
    [WeaponType.SWORD]: 0x88aaff,
    [WeaponType.DUAL_SWORD]: 0x88aaff,
    [WeaponType.GREATSWORD]: 0xffffff,
    [WeaponType.AXE]: 0xff6600,
    [WeaponType.HAMMER]: 0xffdd00,
    [WeaponType.STAFF]: 0x9944ff,
    [WeaponType.BOW]: 0xddcc77,
    [WeaponType.SPEAR]: 0xdff2ff,
  };

  private ensureComboRing(): Phaser.GameObjects.Container {
    if (!this.comboRing || !this.comboRing.active) {
      // Depth 2 : SOUS le sprite du joueur (depth 10) — l'anneau ne doit jamais
      // masquer le personnage ni ce qu'il y a devant lui.
      this.comboRing = this.add.container(this.player.x, this.player.y).setDepth(2);
    }
    return this.comboRing;
  }

  private redrawComboRing(count: number, max: number, weaponType: WeaponType | undefined) {
    const ring = this.ensureComboRing();
    ring.removeAll(true);
    ring.setAlpha(1);
    if (count <= 0 || max <= 0) return;

    const R = GameScene.COMBO_RING_RADIUS;
    const baseColor = (weaponType !== undefined ? GameScene.WEAPON_RING_COLOR[weaponType] : undefined) ?? 0xffffff;
    // Le coup SUIVANT est le finisher : l'anneau vire au blanc-or et pulse.
    const preFinisher = count >= max - 1 && max > 1;
    const color = preFinisher ? 0xffe58a : baseColor;

    const step = (Math.PI * 2) / max;
    const gap  = step * 0.16;

    for (let i = 0; i < count; i++) {
      const g = this.add.graphics();
      g.lineStyle(3, color, 0.95);
      g.beginPath();
      g.arc(0, 0, R, -Math.PI / 2 + i * step + gap / 2, -Math.PI / 2 + (i + 1) * step - gap / 2);
      g.strokePath();
      ring.add(g);
    }

    // Pop du segment qui vient d'être gagné — la chaîne « encaisse » le coup.
    const last = ring.list[ring.list.length - 1] as Phaser.GameObjects.Graphics | undefined;
    if (last) {
      last.setScale(1.4);
      this.tweens.add({ targets: last, scale: 1, duration: 60, ease: 'Back.easeOut' });
    }

    if (preFinisher) {
      // Pulse 2 Hz — « le prochain coup est LE coup ».
      this.tweens.add({
        targets: ring, alpha: 0.55,
        duration: 250, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
  }

  /** Rupture : les segments ÉCLATENT en fragments — aucun effet caméra (cf. budget de shake). */
  private burstComboRing() {
    const ring = this.comboRing;
    if (!ring || !ring.active || ring.list.length === 0) return;
    const cx = ring.x, cy = ring.y;
    const n = ring.list.length;
    this.tweens.killTweensOf(ring);

    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i + 0.5) * (Math.PI * 2 / Math.max(1, n));
      const frag = this.add.rectangle(
        cx + Math.cos(a) * GameScene.COMBO_RING_RADIUS,
        cy + Math.sin(a) * GameScene.COMBO_RING_RADIUS,
        4, 3, 0x99a0aa, 0.9,
      ).setDepth(2).setRotation(a);
      this.tweens.add({
        targets: frag,
        x: cx + Math.cos(a) * (GameScene.COMBO_RING_RADIUS + 14),
        y: cy + Math.sin(a) * (GameScene.COMBO_RING_RADIUS + 14),
        alpha: 0, duration: 220, ease: 'Power2',
        onComplete: () => frag.destroy(),
      });
    }
    ring.removeAll(true);
    ring.setAlpha(1);
  }

  /**
   * Suit le joueur, et fait CLIGNOTER l'anneau sur les derniers 40% de la grâce.
   *
   * Le clignotement n'est posé QUE si la grâce vaut au moins 250 ms. Pour la dague
   * (grâce 160 ms), les 40% ne feraient que 64 ms de clignotement à 8 Hz : le
   * joueur verrait une demi-alternance, c'est-à-dire rien. Mieux vaut aucun signal
   * qu'un signal illisible — on ne ment pas au joueur avec une alerte qu'il n'a
   * physiquement pas le temps de lire.
   */
  private static readonly COMBO_BLINK_MIN_GRACE_MS = 250;
  private syncComboRing() {
    const ring = this.comboRing;
    if (!ring || !ring.active) return;
    ring.setPosition(this.player.x, this.player.y);
    if (ring.list.length === 0 || this.comboCount === 0) return;

    if (this.comboGraceMs < GameScene.COMBO_BLINK_MIN_GRACE_MS) return;
    const now = this.time.now;
    const blinkFrom = this.comboDeadline - this.comboGraceMs * 0.4;
    if (now < blinkFrom || now > this.comboDeadline) return;

    // 8 Hz — piloté par l'horloge, pas par un tween : la deadline peut bouger (dash).
    ring.setAlpha(Math.floor(now / 62.5) % 2 === 0 ? 1 : 0.25);
  }

  // ── FEEDBACK DE VITESSE — PALIERS DISCRETS ──────────────────
  /**
   * Le joueur doit SENTIR un cran quand sa build franchit un seuil. Une rampe
   * continue ne se remarque pas : on ne perçoit pas +3% de cadence. Un palier, si.
   *   1,25 → arc fantôme (l'arme laisse une trace)
   *   1,50 → afterimage du joueur (même grammaire que le dash)
   *   1,75 → pulse d'outline (le personnage « vibre » de vitesse)
   */
  private spawnSpeedTierVfx(aspd: number, angle: number) {
    if (aspd < 1.25) return;

    // 1,25 — arc fantôme : un 2e arc, décalé de 40 ms, très pâle.
    this.time.delayedCall(40, () => {
      if (!this.player?.active) return;
      const g = this.add.graphics({ x: this.player.x, y: this.player.y }).setDepth(30);
      g.lineStyle(3, 0xffffff, 0.30);
      g.beginPath();
      g.arc(0, 0, 52, angle - 0.6, angle + 0.6);
      g.strokePath();
      this.tweens.add({ targets: g, alpha: 0, duration: 120, onComplete: () => g.destroy() });
    });

    // 1,50 — afterimage du joueur à chaque attaque.
    if (aspd >= 1.5) {
      const ghost = this.add.rectangle(
        this.player.x, this.player.y,
        this.player.displayWidth, this.player.displayHeight,
        0xffffff, 0.20,
      ).setDepth(3).setOrigin(0.5);
      this.tweens.add({ targets: ghost, alpha: 0, duration: 150, onComplete: () => ghost.destroy() });
    }

    // 1,75 — pulse d'outline : le personnage vibre.
    if (aspd >= 1.75) {
      const ring = this.add.circle(this.player.x, this.player.y, 16, 0x000000, 0)
        .setStrokeStyle(2, 0xffffff, 0.25).setDepth(4);
      this.tweens.add({
        targets: ring, scale: 1.3, alpha: 0,
        duration: 80, onComplete: () => ring.destroy(),
      });
    }
  }

  // ── PLAYER HIT FX ───────────────────────────────────────────
  // Feedback quand le joueur encaisse un coup : shake léger + flash rouge caméra
  // + burst de particules rouges. Appelé aux trois points de dégâts joueur
  // (mêlée charger, mêlée générique, projectile ennemi).
  private applyPlayerHitFx() {
    this.cameras.main.shake(150, 0.006);
    this.cameras.main.flash(100, 200, 0, 0, true);
    this.spawnHitParticles(this.player.x, this.player.y, undefined, 0xff3333);
  }

  /**
   * FEEDBACK DE COUP — et la décision la plus importante de cette passe :
   * LE TELEGRAPH EST INVIOLABLE.
   *
   * Le telegraph de l'ennemi et le flash de coup vivaient dans le MÊME canal
   * (`setTintFill`). Le flash du joueur ÉCRASAIT donc l'annonce de l'ennemi — et
   * plus le joueur frappait vite, plus il s'aveuglait lui-même : à aspd 1,5 le
   * sprite est blanc ~30% du temps et l'ennemi ne peut tout simplement plus
   * annoncer son coup. Sur un jeu dont la règle est « telegraph before punish »,
   * c'est la faute capitale : le joueur prend un coup qu'il ne pouvait PAS voir
   * venir, et c'est SA propre vitesse qui le lui a caché.
   *
   * Règle : si l'ennemi est en train de télégraphier, on ne touche PAS à son tint.
   * L'impact se lit alors sur une étoile blanche AU POINT DE CONTACT — un canal
   * différent, qui n'entre en concurrence avec rien.
   */
  private applyHitFeedback(sprite: Phaser.Physics.Arcade.Sprite, _ae: ActiveEnemy, _damage: number) {
    const aiState = sprite.getData('aiState');
    if (aiState === 'telegraph') {
      this.spawnImpactStar(sprite.x, sprite.y);
      return;
    }
    sprite.setTintFill(0xffffff);
    this.time.delayedCall(80, () => { if (sprite.active) this.resetEnemyTint(sprite); });
  }

  /** Étoile d'impact — le feedback de coup quand le tint est RÉSERVÉ au telegraph. */
  private spawnImpactStar(x: number, y: number) {
    const star = this.add.star(x, y, 4, 2, 10, 0xffffff, 1).setDepth(36);
    this.tweens.add({
      targets: star,
      scaleX: 0, scaleY: 0,
      duration: 60,
      ease: 'Power2',
      onComplete: () => star.destroy(),
    });
  }

  /**
   * RECUL DU SPRITE — remplace le micro-shake de caméra du coup normal.
   *
   * Le coup banal secouait la CAMÉRA (40 ms / 0.002). À 1 coup/s c'est du punch ;
   * à 4 coups/s (dague bufée) c'est un tremblement permanent qui rend le monde
   * illisible — et le joueur ne peut plus lire les telegraphs pendant qu'il tape.
   * Le feedback quitte donc la caméra pour le MONDE : c'est l'ennemi qui encaisse,
   * pas l'écran. Le retour d'information est le même, le coût de lisibilité est nul.
   */
  private spawnHitRecoil(sprite: Phaser.Physics.Arcade.Sprite, angle: number) {
    const homeX = sprite.x, homeY = sprite.y;
    this.tweens.add({
      targets: sprite,
      x: homeX + Math.cos(angle) * 5,
      y: homeY + Math.sin(angle) * 5,
      duration: 70,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  // ── BUDGET DE SHAKE ─────────────────────────────────────────
  /**
   * UN SEUL shake de caméra par fenêtre de 250 ms, arbitré par PRIORITÉ.
   *
   * Les shakes s'empilaient : un finisher de dague sort 3 coups en 120 ms, chacun
   * pouvant critiquer — donc jusqu'à 3 shakes qui se recouvrent, et l'écran ne se
   * stabilise plus jamais. Un shake permanent n'est plus un shake : c'est du bruit,
   * et il coûte exactement ce que le telegraph a besoin de payer, la lisibilité.
   *
   * Priorité : le plus GROS coup gagne la fenêtre (marteau/finisher > crit > lourd).
   * Un coup plus faible pendant la fenêtre est simplement IGNORÉ — il a déjà son
   * feedback dans le monde (recul du sprite, particules, chiffre).
   */
  private static readonly SHAKE_WINDOW_MS = 250;
  private static readonly SHAKE_PRIO = { HEAVY_SWING: 1, CRIT: 2, FINISHER: 3 };
  private shakeWindowUntil = 0;
  private shakeWindowPrio  = 0;

  private requestShake(durationMs: number, intensity: number, priority: number) {
    const now = this.time.now;
    if (now < this.shakeWindowUntil && priority <= this.shakeWindowPrio) return;
    this.shakeWindowUntil = now + GameScene.SHAKE_WINDOW_MS;
    this.shakeWindowPrio  = priority;
    this.cameras.main.shake(durationMs, intensity);
  }

  // Jauge de stagger réelle (talents Partie 2 — STAGGER_BONUS_PCT, STUN_DMG_PCT,
  // quakeFinisher "stagger ×2"). Seuil et fenêtre en % de maxHp / ms plutôt que
  // des valeurs absolues — reste valide quel que soit le tankiness de l'ennemi.
  private static readonly STAGGER_THRESHOLD_PCT = 0.60;
  private static readonly STAGGER_RESET_WINDOW_MS = 2500;

  private checkStagger(sprite: Phaser.Physics.Arcade.Sprite, ae: ActiveEnemy, damage: number) {
    // ── Jauge réelle : accumule TOUS les coups (pas seulement les gros isolés
    // ci-dessous), avec une fenêtre glissante — pas de decay continu, un coup
    // hors fenêtre repart juste de zéro plutôt que de s'additionner indéfiniment.
    const now = this.time.now;
    if (now > ae.staggerResetAt) ae.staggerMeter = 0;
    ae.staggerResetAt = now + GameScene.STAGGER_RESET_WINDOW_MS;
    ae.staggerMeter += damage * (1 + this.playerModifiers.staggerBonusPct / 100);
    if (ae.staggerMeter >= ae.maxHp * GameScene.STAGGER_THRESHOLD_PCT) {
      ae.staggerMeter = 0;
      this.triggerRealStagger(sprite, ae);
    }

    // ── Flash/ralentissement cosmétique existant — inchangé, réservé aux gros
    // coups isolés (≥20% maxHp EN UN SEUL coup, indépendant de la jauge ci-dessus).
    if (damage / ae.maxHp < 0.20) return;

    sprite.setTintFill(0xff3333);
    this.time.delayedCall(180, () => { if (sprite.active) this.resetEnemyTint(sprite); });

    const body = sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body || !body.enable) return;
    const origMaxVel = body.maxVelocity.x;
    body.setMaxVelocity(origMaxVel * 0.5);
    this.time.delayedCall(400, () => {
      if (sprite.active && sprite.body && (sprite.body as Phaser.Physics.Arcade.Body).enable) {
        (sprite.body as Phaser.Physics.Arcade.Body).setMaxVelocity(origMaxVel);
      }
    });
  }

  /** Jauge de stagger pleine : vrai CC dur (STUN), pas juste cosmétique — c'est
   *  ce qui donne un sens à STUN_DMG_PCT (terra_crushing_weight, lit déjà les
   *  statusEffects STUN/FREEZE existants). Feedback visuel plus marqué que le
   *  flash normal : la jauge vient de se vider d'un coup.
   *  Boss exemptés du vrai STUN — même raison que maybeFreezeRetaliation
   *  (pas de stun-lock : rien n'empêche de continuer à taper une cible stun,
   *  la jauge peut se reremplir avant l'expiration du STUN précédent). SLOW à
   *  la place, même patron que le boss-case de maybeFreezeRetaliation. */
  private triggerRealStagger(sprite: Phaser.Physics.Arcade.Sprite, ae: ActiveEnemy): void {
    if (ae.isBoss) {
      ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'SLOW');
      ae.statusEffects.push({ type: 'SLOW', duration: 1.5, strength: 0.6 });
    } else {
      ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'STUN');
      ae.statusEffects.push({ type: 'STUN', duration: 1.2, strength: 1 });
    }
    sprite.setTintFill(0xffee44);
    this.time.delayedCall(280, () => { if (sprite.active) this.resetEnemyTint(sprite); });
    // Le flash 280ms peut passer inaperçu au milieu du combat — texte explicite,
    // même patron que showDodgeText.
    const label = this.add.text(
      sprite.x + Phaser.Math.Between(-6, 6), sprite.y - sprite.displayHeight / 2 - 6,
      ae.isBoss ? 'Ralenti !' : 'Étourdi !',
      { fontSize: '13px', color: '#ffee44', fontFamily: FONT, stroke: '#000000', strokeThickness: 2 },
    ).setDepth(100).setOrigin(0.5, 1);
    this.tweens.add({
      targets: label, y: label.y - 40, alpha: 0, duration: 900, ease: 'Quad.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  private spawnHitParticles(x: number, y: number, element?: ElementType, colorOverride?: number) {
    const ELEMENT_HEX: Partial<Record<ElementType, number>> = {
      [ElementType.FIRE]:      0xff4400,
      [ElementType.WATER]:     0x2266ff,
      [ElementType.LIGHTNING]: 0xffee00,
      [ElementType.ICE]:       0x88ddff,
      [ElementType.EARTH]:     0x88aa33,
      [ElementType.WIND]:      0xaaddff,
      [ElementType.DARK]:      0xaa44ff,
      [ElementType.DIVINE]:    0xffd700,
    };
    const color = colorOverride ?? (element ? (ELEMENT_HEX[element] ?? 0xffffff) : 0xffffff);

    // DENSITÉ DE PARTICULES — dégressive avec la CADENCE RÉELLE.
    // 8 particules par coup est juste à 1-3 coups/s. À 6 coups/s (finisher de
    // double-dague sous buff), c'est 48 cercles tweenés par seconde et par cible :
    // le sprite disparaît sous ses propres particules, et l'ennemi ne peut plus
    // rien annoncer. On mesure la cadence observée plutôt que de la supposer.
    const now = this.time.now;
    this.recentHitTimes.push(now);
    while (this.recentHitTimes.length && now - this.recentHitTimes[0] > 1000) this.recentHitTimes.shift();
    const count = this.recentHitTimes.length > 3 ? 5 : 8;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Phaser.Math.Between(-10, 10) * 0.017;
      const dist  = Phaser.Math.Between(20, 44);
      const px    = x + Math.cos(angle) * dist;
      const py    = y + Math.sin(angle) * dist;
      const size  = Phaser.Math.Between(3, 6);
      const dot   = this.add.circle(x, y, size, color, 1).setDepth(50);
      this.tweens.add({
        targets: dot,
        x: px, y: py,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: Phaser.Math.Between(200, 380),
        ease: 'Power2',
        onComplete: () => dot.destroy(),
      });
    }
  }

  // ── WEAPON SWING VFX ────────────────────────────────────────
  // VFX directionnel de l'attaque de base : part du joueur vers l'ennemi.
  // Primitives Phaser uniquement (Graphics / shapes / tweens), ≤ 250ms,
  // tout objet détruit en onComplete — aucun résidu.

  /**
   * Durée d'un VFX de swing à l'aspd courante.
   *
   * Le VFX se compresse comme l'animation (sinon, à cadence élevée, trois arcs se
   * superposent et l'écran devient une bouillie), MAIS il a un PLANCHER : sous
   * ~100 ms un arc n'est plus lu, il clignote. Et les armes lourdes ont un plancher
   * PLUS HAUT (greatsword 250, marteau 300) parce que leur identité visuelle est
   * justement l'onde qui S'ÉTEND : un marteau dont l'onde de choc dure 80 ms n'est
   * plus un marteau, c'est une dague grise.
   */
  private swingVfxMs(baseMs: number, aspd: number, floorMs = 100): number {
    return Math.max(baseMs / aspd, floorMs);
  }

  // hitIndex = index of this hit within the pattern (0-based, for dual/multi weapons)
  private spawnWeaponSwingVfx(
    fromX: number, fromY: number,
    toX: number, toY: number,
    weaponType: WeaponType | undefined,
    hitIndex = 0,
    aspd = 1,
  ) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const dur = (baseMs: number, floorMs = 100) => this.swingVfxMs(baseMs, aspd, floorMs);

    switch (weaponType) {
      case WeaponType.DAGGER:
        // Silver, ultra-short, 150ms — instant stab feel (range 85 → radius ≈ 85 * 0.55)
        this.spawnSlashArcVfx(fromX, fromY, angle, 0xcccccc, { radius: 47, thickness: 4, halfArc: 0.55, duration: dur(150) });
        break;

      case WeaponType.DUAL_DAGGER: {
        // Each hit alternates left/right ±30° — double-stab rhythm (range 85 → radius ≈ 85 * 0.55)
        const ddOffset = hitIndex === 0 ? -0.52 : 0.52;
        this.spawnSlashArcVfx(fromX, fromY, angle + ddOffset, 0xcccccc, { radius: 46, thickness: 4, halfArc: 0.50, duration: dur(150) });
        break;
      }

      case WeaponType.SWORD:
        // Blue-steel, clean wide arc, 250ms (range 115 → radius ≈ 115 * 0.55)
        this.spawnSlashArcVfx(fromX, fromY, angle, 0x88aaff, { radius: 63, thickness: 6, halfArc: 0.85, duration: dur(250) });
        break;

      case WeaponType.DUAL_SWORD: {
        // 3 progressive arcs rotating ~20° each, alternating blue / white / blue
        // Range 105 → radius ≈ 105 * 0.55, full brightness for the flurry feel
        const dsAngle  = angle + (hitIndex - 1) * 0.35;
        const dsColor  = hitIndex === 1 ? 0xffffff : 0x88aaff;
        const dsRadius = 55 + hitIndex * 3;
        this.spawnSlashArcVfx(fromX, fromY, dsAngle, dsColor, { radius: dsRadius, thickness: 5, halfArc: 0.78, duration: dur(200), alpha: 1.0 });
        break;
      }

      case WeaponType.GREATSWORD: {
        // Enormous semi-circle + white impact flash (fires after the windup)
        // Range 155 → radius ≈ 155 * 0.55, thickness ≈ range * 0.08, full brightness
        // Plancher 250 ms : on doit VOIR l'onde s'étendre.
        this.spawnSlashArcVfx(fromX, fromY, angle, 0xffffff, { radius: 85, thickness: 12, halfArc: 1.20, duration: dur(400, 250), alpha: 1.0 });
        this.requestShake(60, 0.003, 2);
        const gsFlash = this.add.circle(fromX, fromY, 24, 0xffffff, 0.85).setDepth(32);
        this.tweens.add({
          targets: gsFlash,
          scaleX: 0.1, scaleY: 0.1, alpha: 0,
          duration: dur(250, 150),
          ease: 'Power3',
          onComplete: () => gsFlash.destroy(),
        });
        break;
      }

      case WeaponType.SPEAR:
        // Estoc : pas d'arc — un trait qui JAILLIT vers l'avant puis se rétracte.
        // Le 2e coup (retrait) est plus court et plus pâle : on lit le piqué-retrait.
        this.spawnSpearThrustVfx(
          fromX, fromY, angle,
          hitIndex === 0 ? 175 : 140,
          hitIndex === 0 ? 0xdff2ff : 0x8fb8cc,
        );
        break;

      case WeaponType.AXE:
        this.spawnAxeVfx(fromX, fromY, toX, toY, angle, 0xff6600, dur(300, 160));
        break;

      case WeaponType.HAMMER:
        // Plancher 300 ms : l'onde de choc EST l'identité du marteau.
        this.spawnHammerVfx(toX, toY, 0xffdd00, dur(500, 300));
        break;

      case WeaponType.STAFF:
        this.spawnStaffTrailVfx(fromX, fromY, toX, toY, 0x9944ff);
        break;

      case WeaponType.BOW:
        this.spawnArrowVfx(fromX, fromY, toX, toY, angle, 0xddcc77);
        break;

      default:
        // Fists: two short directional rays per hit, alternating left/right offset
        this.spawnPunchBurstVfx(toX, toY, angle, hitIndex);
        break;
    }
  }

  // Arc de slash : croissant Graphics qui balaie le cône vers la cible en fondu
  private spawnSlashArcVfx(
    x: number, y: number, angle: number, color: number,
    opts: { radius: number; thickness: number; halfArc: number; duration: number; alpha?: number },
  ) {
    const { radius, thickness, halfArc, duration, alpha = 0.95 } = opts;

    const g = this.add.graphics({ x, y }).setDepth(31);
    // Croissant principal (couleur de l'élément)
    g.lineStyle(thickness, color, alpha);
    g.beginPath();
    g.arc(0, 0, radius, -halfArc, halfArc);
    g.strokePath();
    // Traînée externe blanche plus fine
    g.lineStyle(Math.max(1, thickness - 2), 0xffffff, 0.5);
    g.beginPath();
    g.arc(0, 0, radius + 3, -halfArc * 0.8, halfArc * 0.8);
    g.strokePath();

    // Sweep : rotation de -50% à +50% du cône, fondu simultané
    g.rotation = angle - halfArc * 0.5;
    this.tweens.add({
      targets: g,
      rotation: angle + halfArc * 0.5,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => g.destroy(),
    });
  }

  /**
   * LANCE — estoc : un trait fin qui jaillit du joueur jusqu'à `range` puis se
   * rétracte, avec un éclat à la pointe. Volontairement à contre-courant des autres
   * armes : pas d'arc de cercle (spawnSlashArcVfx), parce que l'identité lisible de
   * la lance est la LIGNE, pas la zone (cf. gamefeel : chaque arme doit se sentir
   * différente au premier coup d'œil).
   */
  private spawnSpearThrustVfx(fromX: number, fromY: number, angle: number, range: number, color: number) {
    const cos = Math.cos(angle), sin = Math.sin(angle);

    // Hampe : rectangle fin, ancré au joueur, dont on étire la longueur (scaleX).
    const shaft = this.add.rectangle(fromX, fromY, range, 4, color, 0.9)
      .setOrigin(0, 0.5).setRotation(angle).setDepth(32).setScale(0.15, 1);
    // Pointe : petit éclat qui file jusqu'au bout de l'allonge.
    const tip = this.add.circle(fromX, fromY, 6, 0xffffff, 0.95).setDepth(33);

    this.tweens.add({
      targets: shaft,
      scaleX: 1,
      duration: 90,
      ease: 'Expo.easeOut',
      // Rétraction : la hampe revient au joueur, on lit le retrait de l'arme.
      yoyo: true,
      hold: 40,
      onComplete: () => shaft.destroy(),
    });
    this.tweens.add({
      targets: tip,
      x: fromX + cos * range,
      y: fromY + sin * range,
      duration: 90,
      ease: 'Expo.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: tip,
          scale: 0, alpha: 0,
          duration: 110,
          onComplete: () => tip.destroy(),
        });
      },
    });
  }

  // Bâton : orbe glowing qui voyage dans la direction facing puis explose à l'impact
  // Vitesse ~400px/s, total VFX ~600-800ms (travel + burst)
  private spawnStaffTrailVfx(fromX: number, fromY: number, toX: number, toY: number, color: number) {
    const orb  = this.add.circle(fromX, fromY, 10, color, 1).setDepth(32);
    const halo = this.add.circle(fromX, fromY, 17, color, 0.35).setDepth(31);

    const dist      = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
    const travelDur = Math.max(150, Math.min(600, (dist / 400) * 1000)); // 400 px/s cap

    // Fading trail behind the orb while it travels — bounded by finite repeat count
    const trailInterval = 45;
    this.time.addEvent({
      delay: trailInterval,
      repeat: Math.max(0, Math.floor(travelDur / trailInterval) - 1),
      callback: () => {
        const t = this.add.circle(orb.x, orb.y, 5, color, 0.5).setDepth(30);
        this.tweens.add({
          targets: t,
          alpha: 0, scaleX: 0.2, scaleY: 0.2,
          duration: 260,
          ease: 'Quad.easeOut',
          onComplete: () => t.destroy(),
        });
      },
    });

    this.tweens.add({
      targets: [orb, halo],
      x: toX, y: toY,
      duration: travelDur,
      ease: 'Linear',
      onComplete: () => {
        // Impact burst — expand and fade
        this.tweens.add({
          targets: [orb, halo],
          scaleX: 3.5, scaleY: 3.5, alpha: 0,
          duration: 200,
          ease: 'Quad.easeOut',
          onComplete: () => { orb.destroy(); halo.destroy(); },
        });
      },
    });
  }

  // Arc : flèche fine (brun/or) qui part dans la direction facing — tension + relâche
  // Shaft + pointe, vitesse ~600px/s, 80ms fade à l'impact
  private spawnArrowVfx(
    fromX: number, fromY: number,
    toX: number, toY: number,
    angle: number, color: number,
  ) {
    const shaft = this.add.rectangle(0, 0, 24, 2, 0xddcc77, 1);
    const head  = this.add.triangle(14, 0, 0, -3, 0, 3, 7, 0, color, 1);
    const arrow = this.add.container(fromX, fromY, [shaft, head]).setDepth(32);
    arrow.setRotation(angle);

    const dist = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
    // BOW has range 460 → travel 322px (460 * 0.7) ≈ 537ms at 600px/s, capped sensibly
    const dur  = Math.max(80, Math.min(600, (dist / 600) * 1000));

    this.tweens.add({
      targets: arrow,
      x: toX, y: toY,
      duration: dur,
      ease: 'Linear',
      onComplete: () => {
        this.tweens.add({
          targets: arrow,
          alpha: 0,
          duration: 80,
          onComplete: () => arrow.destroy(),
        });
      },
    });
  }

  // Hache : demi-cercle orange lourd (300ms) + éclats de métal rouges à l'impact
  private spawnAxeVfx(fromX: number, fromY: number, toX: number, toY: number, angle: number, color: number, durationMs = 300) {
    // Orange heavy arc — wider and thicker than sword (range 125 → radius ≈ 125 * 0.55)
    this.spawnSlashArcVfx(fromX, fromY, angle, color, { radius: 69, thickness: 10, halfArc: 0.80, duration: durationMs });
    // Red metal sparks fanning out from impact point (max speed ~280px/s)
    const sparkCount = 10;
    for (let i = 0; i < sparkCount; i++) {
      const spreadAngle = angle + Math.PI + (Math.PI / sparkCount) * (i - (sparkCount - 1) / 2);
      const dist = Phaser.Math.Between(14, 34);
      const spark = this.add.rectangle(toX, toY, 10, 3, 0xcc2200, 1).setDepth(32);
      spark.setRotation(spreadAngle);
      this.tweens.add({
        targets: spark,
        x: toX + Math.cos(spreadAngle) * dist,
        y: toY + Math.sin(spreadAngle) * dist,
        alpha: 0,
        scaleX: 0.1,
        duration: Phaser.Math.Between(120, 240),
        ease: 'Power2',
        onComplete: () => spark.destroy(),
      });
    }
  }

  // Marteau : onde de choc expansive + flash jaune intense + débris projetés
  // Le plus lent, l'impact le plus massif — shake le plus fort.
  // `durationMs` se compresse avec l'aspd mais ne descend JAMAIS sous 300 ms : on
  // doit VOIR l'onde s'étendre, sinon le marteau devient une dague grise.
  private spawnHammerVfx(x: number, y: number, color: number, durationMs = 500) {
    // Large expanding shockwave ring (range 105 → final radius ≈ 63px)
    const ring = this.add.graphics({ x, y }).setDepth(31);
    ring.lineStyle(8, color, 0.9);
    ring.strokeCircle(0, 0, 14);
    this.tweens.add({
      targets: ring,
      scaleX: 4.5, scaleY: 4.5,
      alpha: 0,
      duration: durationMs,
      ease: 'Power2.easeOut',
      onComplete: () => ring.destroy(),
    });
    // Second inner ring for depth
    const ring2 = this.add.graphics({ x, y }).setDepth(30);
    ring2.lineStyle(4, 0xffffff, 0.5);
    ring2.strokeCircle(0, 0, 7);
    this.tweens.add({
      targets: ring2,
      scaleX: 3.0, scaleY: 3.0,
      alpha: 0,
      duration: durationMs * 0.76,
      ease: 'Power2.easeOut',
      onComplete: () => ring2.destroy(),
    });
    // Intense yellow flash at center
    const flash  = this.add.circle(x, y, 21, 0xffffff, 0.95).setDepth(33);
    const inner  = this.add.circle(x, y, 12, color, 0.8).setDepth(34);
    this.tweens.add({
      targets: [flash, inner],
      scaleX: 0.1, scaleY: 0.1, alpha: 0,
      duration: 180,
      ease: 'Power3',
      onComplete: () => { flash.destroy(); inner.destroy(); },
    });
    // Debris chunks projected in a fan
    for (let i = 0; i < 8; i++) {
      const debrisAngle = -Math.PI / 2 + (Math.PI / 6.5) * (i - 3.5);
      const dist = Phaser.Math.Between(28, 55);
      const d = this.add.rectangle(x, y, 5, 5, color, 1).setDepth(31);
      this.tweens.add({
        targets: d,
        x: x + Math.cos(debrisAngle) * dist,
        y: y + Math.sin(debrisAngle) * dist,
        alpha: 0,
        angle: Phaser.Math.Between(90, 360),
        duration: Phaser.Math.Between(220, 380),
        ease: 'Power1',
        onComplete: () => d.destroy(),
      });
    }
    // Le marteau gagne TOUJOURS sa fenêtre de shake — c'est le coup le plus lourd du jeu.
    this.requestShake(150, 0.010, GameScene.SHAKE_PRIO.FINISHER);
  }

  // Windup : teinte jaune sur le joueur pendant le chargement d'une arme lourde
  private spawnWindupVfx(durationMs: number) {
    // BLOCKER-F: flag inWindup pour windupArmor dans tickEnemyAI
    this.inWindup = true;
    this.player.setTint(0xffffaa);
    this.time.delayedCall(durationMs, () => {
      this.inWindup = false;
      if (this.player.active) this.player.clearTint();
    });
  }

  // Mains nues : 2 rayons blancs courts par coup dans la direction du punch
  // hitIndex 0 = poing gauche (offset -0.20), hitIndex 1 = poing droit (offset +0.20)
  private spawnPunchBurstVfx(x: number, y: number, angle: number, hitIndex = 0) {
    const baseOffset = hitIndex === 0 ? -0.20 : 0.20;
    const rayAngles  = [angle + baseOffset - 0.12, angle + baseOffset + 0.12];
    for (const rayAngle of rayAngles) {
      const ray = this.add.rectangle(x, y, 28, 4, 0xffffff, 0.9).setDepth(32);
      ray.setRotation(rayAngle);
      this.tweens.add({
        targets: ray,
        x: x + Math.cos(rayAngle) * 26,
        y: y + Math.sin(rayAngle) * 26,
        scaleX: 0.1,
        alpha: 0,
        duration: 120,
        ease: 'Power2',
        onComplete: () => ray.destroy(),
      });
    }
  }

  // ── FINISHER VFX (combo system — COMBO_TALENT_SPEC.md §6.1) ──
  // Primitives Phaser uniquement (Graphics / shapes / tweens), tout objet
  // détruit en onComplete — aucun résidu. Appelé par la machine à états
  // combo quand comboCount atteint chainLength.

  /** Position écran du joueur (pour le HUD combo de UIScene — caméra parallèle). */
  getPlayerScreenPosition(): { x: number; y: number } | null {
    if (!this.player || !this.player.active) return null;
    // Conversion monde → ÉCRAN : le facteur de zoom est indispensable. `worldView` est
    // en unités de monde ; l'appelant (UIScene, caméra à zoom 1) travaille en pixels
    // écran. Sans le `* zoom`, les pips de combo se décalaient de tout le facteur de
    // zoom dès qu'il n'était plus 1 — jusqu'à 160 px en bord d'écran.
    const cam = this.cameras.main;
    return {
      x: (this.player.x - cam.worldView.x) * cam.zoom,
      y: (this.player.y - cam.worldView.y) * cam.zoom,
    };
  }

  private spawnFinisherVfx(weaponType: WeaponType | undefined, angle: number) {
    const px = this.player.x;
    const py = this.player.y;

    switch (weaponType) {
      case WeaponType.DAGGER:      this.spawnDaggerFinisherVfx(px, py, angle);    break;
      case WeaponType.DUAL_DAGGER: this.spawnDualDaggerFinisherVfx(px, py);       break;
      case WeaponType.SWORD:       this.spawnSwordFinisherVfx(px, py, angle);     break;
      case WeaponType.DUAL_SWORD:  this.spawnDualSwordFinisherVfx(px, py, angle); break;
      case WeaponType.GREATSWORD:  this.spawnGreatswordFinisherVfx(px, py);       break;
      case WeaponType.AXE:         this.spawnAxeFinisherVfx(px, py, angle);       break;
      case WeaponType.HAMMER:      this.spawnHammerFinisherVfx(px, py);           break;
      case WeaponType.STAFF:       this.spawnStaffFinisherVfx(px, py, angle);     break;
      case WeaponType.BOW:         this.spawnBowFinisherVfx(px, py, angle);       break;
      // SPEAR — « Broche » : même trait que l'estoc, mais à l'allonge du finisher
      // (280, cf. COMBO_CONFIGS) et en blanc glacé. Sans ce case, le finisher
      // infligeait ses dégâts, sa percée et son knockback SANS AUCUN VFX.
      case WeaponType.SPEAR:       this.spawnSpearThrustVfx(px, py, angle, 280, 0xeaffff); break;
      default: break; // FISTS : pas de combo, pas de finisher
    }
  }

  // Lacération : 3 traits blancs fins en éventail serré + afterimage de fente
  // + marqueur « Exposé » rouge qui pulse 2s au point d'impact.
  private spawnDaggerFinisherVfx(px: number, py: number, angle: number) {
    const offsets = [-0.17, 0, 0.17]; // éventail serré ±10°
    for (let i = 0; i < offsets.length; i++) {
      const a = angle + offsets[i];
      const streak = this.add
        .rectangle(px + Math.cos(a) * 30, py + Math.sin(a) * 30, 52, 2, 0xffffff, 0.95)
        .setDepth(32).setRotation(a);
      this.tweens.add({
        targets: streak,
        x: px + Math.cos(a) * 78,
        y: py + Math.sin(a) * 78,
        alpha: 0,
        duration: 150,
        delay: i * 40,
        ease: 'Power2',
        onComplete: () => streak.destroy(),
      });
    }

    // Afterimage du joueur sur la fente (même style que la trainée du dash)
    const ghost = this.add
      .rectangle(px, py, this.player.displayWidth, this.player.displayHeight, 0xf0e8d8, 0.5)
      .setDepth(3);
    this.tweens.add({ targets: ghost, alpha: 0, duration: 200, onComplete: () => ghost.destroy() });

    // Marqueur « Exposé » : cercle rouge 3px pulsant au-dessus du point d'impact
    const hitX = px + Math.cos(angle) * 60;
    const hitY = py + Math.sin(angle) * 60;
    const marker = this.add.circle(hitX, hitY - 16, 3, 0xcc2200).setDepth(30).setAlpha(0.8);
    const pulse = this.tweens.add({
      targets: marker, alpha: 0.2, duration: 400, yoyo: true, repeat: 2,
    });
    this.time.delayedCall(2000, () => { pulse.stop(); marker.destroy(); });
  }

  // Danse des Crocs : 6 petits arcs qui tournent autour du joueur (offset 60°),
  // blanc → ambre sur le dernier, 300ms total.
  private spawnDualDaggerFinisherVfx(_px: number, _py: number) {
    for (let i = 0; i < 6; i++) {
      const segAngle = (Math.PI / 3) * i;
      const color = i === 5 ? 0xffb347 : 0xffffff;
      this.time.delayedCall(i * 50, () => {
        if (!this.player.active) return;
        this.spawnSlashArcVfx(this.player.x, this.player.y, segAngle, color, {
          radius: 52, thickness: 4, halfArc: 0.45, duration: 160,
        });
      });
    }
  }

  // Estocade : trait de percée droit 140px + liseré de garde blanc cassé 1s.
  private spawnSwordFinisherVfx(px: number, py: number, angle: number) {
    const beam = this.add
      .rectangle(px + Math.cos(angle) * 70, py + Math.sin(angle) * 70, 140, 3, 0xffffff, 0.95)
      .setDepth(32).setRotation(angle);
    this.tweens.add({
      targets: beam, alpha: 0, scaleY: 0.2, duration: 200, ease: 'Power2',
      onComplete: () => beam.destroy(),
    });

    // Liseré de garde : contour 0xf0e8d8 alpha 0.3 qui pulse sur le joueur (1s)
    const guard = this.add
      .rectangle(px, py, this.player.displayWidth + 4, this.player.displayHeight + 4)
      .setDepth(3).setFillStyle(0x000000, 0).setStrokeStyle(2, 0xf0e8d8, 0.3);
    this.tweens.add({
      targets: guard,
      alpha: 0,
      duration: 500,
      yoyo: true,
      onUpdate: () => guard.setPosition(this.player.x, this.player.y),
      onComplete: () => guard.destroy(),
    });
  }

  // Croix d'Écho : deux arcs croisés rouge sombre (le 2e décalé 140ms)
  // + gouttes de saignement en chute lente.
  private spawnDualSwordFinisherVfx(px: number, py: number, angle: number) {
    this.spawnSlashArcVfx(px, py, angle + Math.PI / 2, 0x8a1a1a, {
      radius: 62, thickness: 6, halfArc: 1.22, duration: 220, alpha: 1.0,
    });
    this.time.delayedCall(140, () => {
      if (!this.player.active) return;
      this.spawnSlashArcVfx(this.player.x, this.player.y, angle - Math.PI / 2, 0x8a1a1a, {
        radius: 62, thickness: 6, halfArc: 1.22, duration: 220, alpha: 1.0,
      });
    });

    const hitX = px + Math.cos(angle) * 55;
    const hitY = py + Math.sin(angle) * 55;
    for (let i = 0; i < 4; i++) {
      const drop = this.add
        .circle(hitX + Phaser.Math.Between(-15, 15), hitY + Phaser.Math.Between(-6, 6), 2, 0x8a1a1a, 1)
        .setDepth(31).setAlpha(0);
      this.tweens.add({ targets: drop, alpha: 1, duration: 200, yoyo: true });
      this.tweens.add({
        targets: drop, y: drop.y + 30, duration: 400, ease: 'Quad.easeIn',
        onComplete: () => drop.destroy(),
      });
    }
  }

  // Fauchage du Colosse : arc 360° épais + trainée persistante + afterimage.
  private spawnGreatswordFinisherVfx(px: number, py: number) {
    this.spawnSlashArcVfx(px, py, 0, 0xffffff, {
      radius: 92, thickness: 14, halfArc: Math.PI, duration: 400, alpha: 1.0,
    });
    // Trainée blanche persistante ~150ms après le passage
    this.time.delayedCall(150, () => {
      if (!this.player.active) return;
      this.spawnSlashArcVfx(this.player.x, this.player.y, Math.PI, 0xf0e8d8, {
        radius: 88, thickness: 6, halfArc: Math.PI, duration: 250, alpha: 0.5,
      });
    });
    const ghost = this.add
      .rectangle(px, py, this.player.displayWidth, this.player.displayHeight, 0xffffff, 0.4)
      .setDepth(3);
    this.tweens.add({ targets: ghost, alpha: 0, duration: 150, onComplete: () => ghost.destroy() });
    this.cameras.main.shake(120, 0.005); // shake moyen (spec 6.1)
  }

  // Brise-Garde : arc montant orange vif + fragments d'armure gris éjectés.
  private spawnAxeFinisherVfx(px: number, py: number, angle: number) {
    this.spawnSlashArcVfx(px, py, angle - Math.PI / 2, 0xff8800, {
      radius: 80, thickness: 10, halfArc: Math.PI, duration: 300, alpha: 1.0,
    });
    const hitX = px + Math.cos(angle) * 60;
    const hitY = py + Math.sin(angle) * 60;
    const count = Phaser.Math.Between(4, 6);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = Phaser.Math.Between(40, 150);
      const frag = this.add
        .circle(hitX, hitY, Phaser.Math.Between(2, 3), 0xaaaaaa, 1)
        .setDepth(31);
      this.tweens.add({
        targets: frag,
        x: hitX + Math.cos(a) * dist,
        y: hitY + Math.sin(a) * dist,
        alpha: 0,
        duration: 300,
        ease: 'Power2',
        onComplete: () => frag.destroy(),
      });
    }
  }

  // Onde Tellurique : impact hammer amplifié — grand anneau 180px + fissures au sol.
  // spawnHammerVfx inclut déjà le shake fort (150ms, 0.010) — le plus lourd hors boss.
  private spawnHammerFinisherVfx(px: number, py: number) {
    this.spawnHammerVfx(px, py, 0xffdd00);

    // Anneau supplémentaire qui s'étend jusqu'à ~180px
    const bigRing = this.add.graphics({ x: px, y: py }).setDepth(31);
    bigRing.lineStyle(5, 0xffffff, 0.8);
    bigRing.strokeCircle(0, 0, 24);
    this.tweens.add({
      targets: bigRing,
      scaleX: 7.5, scaleY: 7.5, // 24 × 7.5 = 180px
      alpha: 0,
      duration: 320,
      ease: 'Power2.easeOut',
      onComplete: () => bigRing.destroy(),
    });

    // Fissures au sol : lignes brunes brisées partant de l'impact, fade 500ms
    const crackCount = Phaser.Math.Between(4, 5);
    for (let i = 0; i < crackCount; i++) {
      const a = ((Math.PI * 2) / crackCount) * i + Phaser.Math.FloatBetween(-0.3, 0.3);
      const len = Phaser.Math.Between(80, 120);
      const crack = this.add.graphics({ x: px, y: py }).setDepth(2);
      crack.lineStyle(3, 0x6a3a1a, 0.9);
      crack.beginPath();
      crack.moveTo(0, 0);
      crack.lineTo(
        Math.cos(a) * len * 0.5 + Phaser.Math.Between(-8, 8),
        Math.sin(a) * len * 0.5 + Phaser.Math.Between(-8, 8),
      );
      crack.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      crack.strokePath();
      this.tweens.add({
        targets: crack, alpha: 0, duration: 500, delay: 150,
        onComplete: () => crack.destroy(),
      });
    }
  }

  // Orbe Saturé : projectile perçant couleur élément, halo pulsant + trainée.
  private spawnStaffFinisherVfx(px: number, py: number, angle: number) {
    const ELEMENT_VFX_COLORS: Partial<Record<ElementType, number>> = {
      [ElementType.FIRE]:      0xff4400,
      [ElementType.WATER]:     0x2266ff,
      [ElementType.LIGHTNING]: 0xffee00,
      [ElementType.ICE]:       0x88ddff,
      [ElementType.WIND]:      0xaaddff,
      [ElementType.EARTH]:     0x88aa33,
      [ElementType.DARK]:      0xaa44ff,
      [ElementType.DIVINE]:    0xffd700,
    };
    const element = this.gameState.player.equipment.weapon?.element;
    const color = (element !== undefined ? ELEMENT_VFX_COLORS[element] : undefined) ?? 0x9944ff;

    const RANGE = 300;
    const toX = px + Math.cos(angle) * RANGE;
    const toY = py + Math.sin(angle) * RANGE;
    const travelDur = 600;

    const orb  = this.add.circle(px, py, 10, color, 1).setDepth(32);
    const halo = this.add.circle(px, py, 20, color, 0.5).setDepth(31);

    // Halo pulsant pendant le voyage (borné : 3 cycles = 600ms)
    this.tweens.add({ targets: halo, alpha: 0, duration: 100, yoyo: true, repeat: 2 });

    // Trainée de cercles 4px derrière l'orbe — répétition finie
    const trailInterval = 50;
    this.time.addEvent({
      delay: trailInterval,
      repeat: Math.floor(travelDur / trailInterval) - 1,
      callback: () => {
        if (!orb.active) return;
        const t = this.add.circle(orb.x, orb.y, 4, color, 0.5).setDepth(30);
        this.tweens.add({
          targets: t, alpha: 0, scaleX: 0.2, scaleY: 0.2, duration: 250,
          onComplete: () => t.destroy(),
        });
      },
    });

    this.tweens.add({
      targets: [orb, halo],
      x: toX, y: toY,
      duration: travelDur,
      ease: 'Linear',
      onComplete: () => {
        this.tweens.add({
          targets: [orb, halo],
          scaleX: 3, scaleY: 3, alpha: 0,
          duration: 200,
          ease: 'Quad.easeOut',
          onComplete: () => { orb.destroy(); halo.destroy(); },
        });
      },
    });
  }

  // Volée : 3 flèches simultanées en éventail ±12°, pointes ambre (finisher).
  private spawnBowFinisherVfx(px: number, py: number, angle: number) {
    const SPREAD = 0.21; // ~12°
    const RANGE = 460 * 0.7;
    for (const off of [-SPREAD, 0, SPREAD]) {
      const a = angle + off;
      const shaft = this.add.rectangle(0, 0, 24, 2, 0xddcc77, 1);
      const head  = this.add.triangle(14, 0, 0, -3, 0, 3, 7, 0, 0xffb347, 1);
      const arrow = this.add.container(px, py, [shaft, head]).setDepth(32);
      arrow.setRotation(a);
      const dur = (RANGE / 600) * 1000; // 600 px/s, ~537ms
      this.tweens.add({
        targets: arrow,
        x: px + Math.cos(a) * RANGE,
        y: py + Math.sin(a) * RANGE,
        duration: dur,
        ease: 'Linear',
        onComplete: () => {
          this.tweens.add({
            targets: arrow, alpha: 0, duration: 80,
            onComplete: () => arrow.destroy(),
          });
        },
      });
    }
  }

  private showBossAnnouncement(bossName: string, zoneElement: ElementType) {
    const ZONE_AURA_COLORS: Partial<Record<ElementType, number>> = {
      [ElementType.FIRE]:      0xff4400,
      [ElementType.EARTH]:     0x88aa33,
      [ElementType.WIND]:      0xaaddff,
      [ElementType.WATER]:     0x2266ff,
      [ElementType.LIGHTNING]: 0xffee00,
      [ElementType.ICE]:       0x88ddff,
      [ElementType.DARK]:      0xaa44ff,
      [ElementType.DIVINE]:    0xffd700,
    };
    const auraColor = ZONE_AURA_COLORS[zoneElement] ?? 0xffffff;
    const { width: W, height: H } = this.cameras.main;

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, auraColor, 0)
      .setScrollFactor(0).setDepth(190);
    this.tweens.add({
      targets: overlay,
      alpha: 0.08,
      duration: 600,
      yoyo: true,
      hold: 1400,
      onComplete: () => overlay.destroy(),
    });

    const label = this.add.text(W / 2, H / 2, bossName, {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: FONT,
      stroke: '#000000',
      strokeThickness: 5,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(200).setAlpha(0);

    this.tweens.add({
      targets: label,
      alpha: 1,
      duration: 500,
      hold: 1400,
      yoyo: true,
      onComplete: () => label.destroy(),
    });
  }

  // ── AGRÉGATION DES CHIFFRES DE DÉGÂTS ───────────────────────
  /**
   * Un texte par cible et par NATURE de coup (normal / critique), sur une fenêtre
   * de 300 ms : un coup supplémentaire dans la fenêtre INCRÉMENTE le chiffre au
   * lieu d'en créer un nouveau.
   *
   * Sans ça, un finisher de double-dague (6 coups en 360 ms) empile SIX textes qui
   * se chevauchent sur le même sprite : le joueur ne lit plus aucun d'entre eux, et
   * paie en plus le coût de rendu. Le chiffre qui monte est PLUS lisible que six
   * chiffres qui se marchent dessus — et il dit la même chose.
   *
   * Les critiques gardent leur propre texte (c'est l'information qu'on veut voir
   * ressortir), d'où la clé composite : au plus DEUX textes par cible.
   */
  private dmgAggregates: Map<string, { txt: Phaser.GameObjects.Text; total: number; expiresAt: number }> = new Map();
  private static readonly DMG_AGGREGATE_MS = 300;

  private showEnemyDamageNumber(
    instanceId: string, x: number, y: number, amount: number, isCrit: boolean, element?: ElementType,
  ) {
    const now = this.time.now;
    const key = `${instanceId}:${isCrit ? 'c' : 'n'}`;
    const entry = this.dmgAggregates.get(key);

    if (entry && now < entry.expiresAt && entry.txt.active) {
      entry.total += amount;
      entry.expiresAt = now + GameScene.DMG_AGGREGATE_MS;
      entry.txt.setText(isCrit ? `${entry.total}!` : `${entry.total}`);
      // Re-punch : le chiffre « encaisse » le coup supplémentaire.
      this.tweens.add({
        targets: entry.txt,
        scale: entry.txt.scale * 1.15,
        duration: 50, yoyo: true, ease: 'Quad.easeOut',
      });
      return;
    }

    const txt = this.showDamageNumber(x, y, amount, isCrit, element);
    this.dmgAggregates.set(key, { txt, total: amount, expiresAt: now + GameScene.DMG_AGGREGATE_MS });
  }

  private showDamageNumber(x: number, y: number, amount: number, isCrit: boolean, element?: ElementType, isEnemy = false): Phaser.GameObjects.Text {
    const ELEMENT_COLORS: Partial<Record<ElementType, string>> = {
      [ElementType.FIRE]:      '#ff4400',
      [ElementType.WATER]:     '#2266ff',
      [ElementType.LIGHTNING]: '#ffee00',
      [ElementType.ICE]:       '#88ddff',
      [ElementType.EARTH]:     '#88aa33',
      [ElementType.WIND]:      '#aaddff',
      [ElementType.DARK]:      '#aa44ff',
      [ElementType.DIVINE]:    '#ffd700',
    };
    // Un crit sur un coup élémentaire garde la teinte de l'élément (au lieu du
    // jaune plat) — seul un crit neutre retombe sur le jaune classique.
    const color = isEnemy
      ? '#ff4444'
      : element
        ? ELEMENT_COLORS[element] ?? (isCrit ? '#ffff00' : '#ffffff')
        : (isCrit ? '#ffff00' : '#ffffff');
    const size = isCrit ? '22px' : '14px';
    const label = isCrit ? `${amount}!` : `${amount}`;

    const txt = this.add.text(x + Phaser.Math.Between(-6, 6), y, label, {
      fontSize: size, color, fontFamily: FONT,
      stroke: isCrit ? '#ffffff' : '#000000', strokeThickness: isCrit ? 3 : 2,
    }).setDepth(100).setOrigin(0.5, 1);

    const floatY = isCrit ? y - 56 : y - 40;
    this.tweens.add({
      targets: txt,
      y: floatY,
      alpha: 0,
      duration: isCrit ? 1100 : 900,
      ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });

    // Punch d'échelle pour distinguer visuellement un critique d'un coup normal
    if (isCrit) {
      txt.setScale(1.5);
      this.tweens.add({
        targets: txt,
        scale: 1,
        duration: 220,
        ease: 'Back.easeOut',
      });
    }

    return txt;
  }

  // ── ÉCHO — COMPTEUR DE DÉGÂTS CUMULÉS ───────────────────────
  /**
   * Compteur in-world de dégâts infligés par le JOUEUR, ancré sur le dernier
   * ennemi touché par un coup DIRECT. Coexiste avec showEnemyDamageNumber
   * (chiffres par-cible, depth 100) sans le remplacer — l'Écho vit au-dessus
   * (depth 101) et raconte le CUMUL de la salve en cours, pas chaque coup.
   *
   * État purement transitoire côté scène — jamais dans PlayerState/WorldState,
   * aucun impact sur les saves. Le polish visuel (paliers couleur/taille par
   * nombre de coups, punchs par coup, count-up roulant, pulsation idle du
   * palier 4, motes de particules) vit dans les helpers echo* ci-dessous et ne
   * touche à AUCUNE règle mécanique (fenêtre, ancrage, reset).
   */
  private static readonly ECHO_WINDOW_MS = 2000; // fenêtre FIXE depuis le dernier dégât — jamais indexée sur l'aspd, même principe que comboDeadline (cf. ~ligne 883)
  private static readonly ECHO_WARN_MS = 600;    // pré-avertissement avant expiration
  private static readonly ECHO_WARN_HZ = 4;      // fréquence du clignotement de pré-avertissement
  private static readonly ECHO_ANCHOR_TWEEN_MS = 160;
  private static readonly ECHO_ANCHOR_Y_OFFSET = 70;
  private static readonly ECHO_RELEASE_MS = 350;

  private echoTotal = 0;
  private echoHits = 0;
  private echoDeadline = 0;
  private echoAnchorInstanceId: string | null = null;
  /** true : l'ancre est morte (ou introuvable) — l'Écho gèle à sa dernière position monde. */
  private echoFrozen = false;
  /** true dès qu'une position monde valide a été posée — distingue le tout premier
   *  ancrage (apparition directe, sans tween) d'un changement de cible (tween 160ms). */
  private echoHasPosition = false;
  private echoX = 0;
  private echoY = 0;
  private echoTweenStartX = 0;
  private echoTweenStartY = 0;
  /** 0→1 : progression du tween de transition d'ancrage. 1 = convergé — dans cet état,
   *  Phaser.Math.Linear(start, target, 1) === target quel que soit `start`, donc le
   *  MÊME calcul sert aussi bien pour "suit le sprite chaque frame" une fois convergé. */
  private echoTweenT = 1;
  private echoMoveTween: Phaser.Tweens.Tween | null = null;
  private echoContainer: Phaser.GameObjects.Container | null = null;
  private echoTotalText: Phaser.GameObjects.Text | null = null;
  private echoHitsText: Phaser.GameObjects.Text | null = null;

  // ── Polish visuel (spec design-agent) — purement cosmétique, aucune règle
  //    mécanique ici : paliers de couleur/taille, punchs, count-up, particules. ──
  /**
   * Paliers par nombre de coups DIRECTS (echoHits). Index = numéro de palier ;
   * l'index 0 est le palier invisible (< ECHO_VISIBILITY_HITS). Tailles 20/30 =
   * multiples entiers de la grille 10px de Neatpixels Minimal (FONT_HUD, cf.
   * FONT_GRIDS dans UITheme) — les seules tailles nettes de cette famille, d'où
   * la création du texte en famille Minimal (uiStyle(10)) puis le passage par
   * snapFontSize sur CETTE grille.
   */
  private static readonly ECHO_TIER_STYLES: ReadonlyArray<
    { minHits: number; color: string; colorNum: number; size: number; stroke: string; strokeW: number } | null
  > = [
    null, // palier 0 (1-2 coups) : invisible — géré par ECHO_VISIBILITY_HITS
    { minHits: 3,  color: '#ffffff', colorNum: 0xffffff, size: 20, stroke: '#000000', strokeW: 2 },
    { minHits: 10, color: '#ffe28a', colorNum: 0xffe28a, size: 20, stroke: '#000000', strokeW: 3 },
    { minHits: 20, color: '#ffd700', colorNum: 0xffd700, size: 30, stroke: '#000000', strokeW: 3 },
    { minHits: 35, color: '#fff3c4', colorNum: 0xfff3c4, size: 30, stroke: '#ffd700', strokeW: 3 },
  ];
  // Dérivé de ECHO_TIER_STYLES[1] (jamais une valeur dupliquée en dur) : palier 0
  // invisible tant que echoHits < ce seuil — sans ça, un seuil changé dans un seul
  // des deux endroits désynchronise echoTierFor() et la porte de visibilité de
  // updateEcho(). ECHO_TIER_STYLES doit rester déclaré AVANT (ordre d'init des
  // champs statiques de classe).
  private static readonly ECHO_VISIBILITY_HITS = GameScene.ECHO_TIER_STYLES[1]!.minHits;

  /** Palier courant du cycle — ne monte que par onEchoTierUp, reset avec le cycle. */
  private echoTier = 0;
  /** Valeur AFFICHÉE du total : rattrape echoTotal via un tween ~100ms (rolling count-up). */
  private echoDisplayTotal = 0;
  private echoCountTween: Phaser.Tweens.Tween | null = null;
  /** Punch/pulse d'échelle sur echoTotalText — un seul actif à la fois (même motif
   *  de nettoyage que le re-punch de showEnemyDamageNumber). */
  private echoPunchTween: Phaser.Tweens.Tween | null = null;
  /** Pulsation idle continue du palier 4 (scale container 1.0↔1.04 à 1.5Hz). */
  private echoIdleTween: Phaser.Tweens.Tween | null = null;
  /** Retour du stroke à la couleur du palier après le flash blanc de crit (80ms). */
  private echoStrokeFlashEvt: Phaser.Time.TimerEvent | null = null;
  /**
   * Batching d'ancrage AOE : plusieurs coups DIRECTS dans le MÊME appel synchrone
   * (un cône de mêlée qui touche 3 ennemis dans `executeHitInCone`) doivent ancrer
   * sur le PLUS GROS dégât de la salve, pas sur le dernier traité. Clé de lot =
   * `this.time.now`, identique pour tous les coups d'un même appel synchrone
   * puisque le temps ne change pas entre deux itérations d'une boucle JS. Le
   * commit réel est différé d'un tick (`delayedCall(0)`) pour laisser la boucle
   * se terminer avant de choisir le gagnant — même motif que les autres
   * `time.delayedCall(0, ...)` de ce fichier (cf. performZoneTransition).
   */
  private echoPendingAnchor: { batchTime: number; instanceId: string; damage: number } | null = null;
  private echoAnchorCommitScheduled = false;

  /**
   * Point d'entrée UNIQUE de tout dégât joueur pour l'Écho.
   *
   * `direct = true` : coup de mêlée/flèche/sort (voir executeHitInCone,
   * updateArrowProjectiles, activateSkill) — incrémente le total ET le compteur
   * de coups ET peut déplacer l'ancre.
   * `direct = false` (défaut, ticks/passifs) : incrémente SEULEMENT le total —
   * jamais de coup compté, jamais de déplacement d'ancre. Couvre applyDamageToEnemy
   * (aura, riposte, écho de passif, auto-bolt) ainsi que les deux ticks DOT qui
   * mutent currentHp directement sans passer par applyDamageToEnemy (bleed et
   * Marque de Magma, instrumentés séparément dans tickEnemyAI).
   */
  /** SOUL_STACK_BONUS (ins_soul_harvest) — +N stacks de Soul Echo par zone
   *  élémentaire nettoyée (boss vaincu) CETTE run, cf. clearedZones. Offset
   *  permanent ajouté à echoHits pour le calcul de palier ET l'affichage —
   *  jamais un multiplicateur de dégâts, echoTier est purement visuel
   *  (cf. ECHO_TIER_STYLES, aucun consommateur de combat). */
  private getSoulStackOffset(): number {
    return this.playerModifiers.soulStackBonus * this.gameState.player.clearedZones.length;
  }

  private registerEchoDamage(instanceId: string, damage: number, direct: boolean, isCrit = false): void {
    if (damage <= 0) return;
    this.echoTotal += damage;
    this.echoDeadline = this.time.now + GameScene.ECHO_WINDOW_MS;
    this.tweenEchoDisplayTotal();
    if (!direct) return; // ticks/passifs : total seulement — jamais de punch, de coup ni d'ancre
    this.echoHits += 1;
    // Un AOE massif peut faire passer echoHits de 0 à 10+ DANS LA MÊME frame,
    // avant que updateEcho() n'ait tourné une seule fois pour créer le conteneur
    // — sans cet appel, onEchoTierUp()/punchEchoText() ci-dessous seraient des
    // no-op silencieux (garde `if (!txt) return`) et le pulse de transition/les
    // motes de ce franchissement ne joueraient jamais.
    if (this.echoHits + this.getSoulStackOffset() >= GameScene.ECHO_VISIBILITY_HITS) this.ensureEchoContainer();

    const tier = this.echoTierFor(this.echoHits + this.getSoulStackOffset());
    if (tier > this.echoTier && this.echoTier > 0) {
      // Franchissement 1→2, 2→3 ou 3→4 : le pulse de transition (1.4) REMPLACE le
      // punch du coup qui franchit le seuil (1.12/1.25 < 1.4 — il serait invisible).
      this.onEchoTierUp(tier);
    } else {
      this.echoTier = Math.max(this.echoTier, tier); // 0→1 : style posé par ensureEchoContainer, sans pulse
      // Punch par coup direct. « Gros coup » = damage >= 25% du total APRÈS incrément.
      const big = damage >= this.echoTotal * 0.25;
      this.punchEchoText(big ? 1.25 : 1.12, 60);
    }
    if (isCrit) this.flashEchoStroke();

    this.stageEchoAnchor(instanceId, damage);
  }

  private echoTierFor(hits: number): number {
    for (let i = GameScene.ECHO_TIER_STYLES.length - 1; i >= 1; i--) {
      if (hits >= GameScene.ECHO_TIER_STYLES[i]!.minHits) return i;
    }
    return 0;
  }

  private applyEchoTierStyle(tier: number): void {
    const st = GameScene.ECHO_TIER_STYLES[tier];
    const txt = this.echoTotalText;
    if (!st || !txt || !txt.active) return;
    txt.setFontSize(snapFontSize(st.size, FONT_HUD));
    txt.setColor(st.color);
    txt.setStroke(st.stroke, st.strokeW);
  }

  /** Franchissement de palier : restyle + pulse 1.0→1.4→1.0 (~200ms), et aux
   *  paliers 3-4 uniquement, motes de pixels qui dérivent vers le haut. */
  private onEchoTierUp(tier: number): void {
    this.echoTier = tier;
    this.applyEchoTierStyle(tier);
    this.punchEchoText(1.4, 100);
    if (tier >= 3) this.spawnEchoTierParticles(tier);
    if (tier === 4) this.startEchoIdlePulse();
  }

  /** Punch d'échelle sur le texte du total. `duration` = demi-durée (yoyo).
   *  Un seul punch actif : on tue le précédent et on repart d'une échelle neutre
   *  (même motif que le re-punch de showEnemyDamageNumber). */
  private punchEchoText(scale: number, duration: number): void {
    const txt = this.echoTotalText;
    if (!txt || !txt.active) return;
    if (this.echoPunchTween) { this.echoPunchTween.remove(); this.echoPunchTween = null; }
    txt.setScale(1);
    this.echoPunchTween = this.tweens.add({
      targets: txt,
      scale,
      duration,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => { this.echoPunchTween = null; if (txt.active) txt.setScale(1); },
    });
  }

  /** Coup critique : stroke flashé en blanc 80ms, puis retour à celui du palier. */
  private flashEchoStroke(): void {
    const txt = this.echoTotalText;
    const st = GameScene.ECHO_TIER_STYLES[this.echoTier];
    if (!txt || !txt.active || !st) return;
    txt.setStroke('#ffffff', st.strokeW);
    if (this.echoStrokeFlashEvt) this.echoStrokeFlashEvt.remove();
    this.echoStrokeFlashEvt = this.time.delayedCall(80, () => {
      this.echoStrokeFlashEvt = null;
      // Le palier a pu monter pendant les 80ms — on restaure celui du moment.
      this.applyEchoTierStyle(this.echoTier);
    });
  }

  /** Palier 4 : pulsation idle continue (container 1.0↔1.04, cycle ~667ms = 1.5Hz),
   *  ADDITIVE avec les punchs par coup — le punch vit sur le texte, l'idle sur le
   *  container, les deux échelles se multiplient sans se disputer la propriété. */
  private startEchoIdlePulse(): void {
    if (this.echoIdleTween || !this.echoContainer || !this.echoContainer.active) return;
    this.echoIdleTween = this.tweens.add({
      targets: this.echoContainer,
      scale: 1.04,
      duration: 333, // demi-période
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** 4-6 motes de pixels couleur du palier, dérive douce vers le haut + fade —
   *  adaptation directe du motif de spawnHitParticles (primitives + tween,
   *  destruction en onComplete, aucun résidu), en version ascendante. */
  private spawnEchoTierParticles(tier: number): void {
    const st = GameScene.ECHO_TIER_STYLES[tier];
    const container = this.echoContainer;
    if (!st || !container || !container.active) return;
    const count = Phaser.Math.Between(4, 6);
    for (let i = 0; i < count; i++) {
      const size = Phaser.Math.Between(2, 3);
      const mote = this.add.rectangle(
        container.x + Phaser.Math.Between(-16, 16),
        container.y + Phaser.Math.Between(-8, 4),
        size, size, st.colorNum, 1,
      ).setDepth(101);
      this.tweens.add({
        targets: mote,
        x: mote.x + Phaser.Math.Between(-6, 6),
        y: mote.y - Phaser.Math.Between(18, 32),
        alpha: 0,
        duration: Phaser.Math.Between(500, 800),
        ease: 'Quad.easeOut',
        onComplete: () => mote.destroy(),
      });
    }
  }

  /** Rolling count-up : la valeur AFFICHÉE rattrape echoTotal en ~100ms ;
   *  snap immédiat si l'écart est < 3 (pas de tween pour 1-2 points de DOT). */
  private tweenEchoDisplayTotal(): void {
    if (this.echoCountTween) { this.echoCountTween.remove(); this.echoCountTween = null; }
    const target = this.echoTotal;
    if (Math.abs(target - this.echoDisplayTotal) < 3) {
      this.echoDisplayTotal = target;
      return;
    }
    this.echoCountTween = this.tweens.addCounter({
      from: this.echoDisplayTotal,
      to: target,
      duration: 100,
      ease: 'Quad.easeOut',
      onUpdate: (tw) => { this.echoDisplayTotal = tw.getValue() ?? target; },
      onComplete: () => { this.echoCountTween = null; this.echoDisplayTotal = target; },
    });
  }

  private stageEchoAnchor(instanceId: string, damage: number): void {
    const now = this.time.now;
    if (!this.echoPendingAnchor || this.echoPendingAnchor.batchTime !== now) {
      this.echoPendingAnchor = { batchTime: now, instanceId, damage };
    } else if (damage > this.echoPendingAnchor.damage) {
      this.echoPendingAnchor.instanceId = instanceId;
      this.echoPendingAnchor.damage = damage;
    }
    if (this.echoAnchorCommitScheduled) return;
    this.echoAnchorCommitScheduled = true;
    this.time.delayedCall(0, () => this.commitEchoAnchor());
  }

  private findEnemySpriteByInstanceId(instanceId: string): Phaser.Physics.Arcade.Sprite | undefined {
    return this.enemies.getChildren().find(
      (c) => (c as Phaser.Physics.Arcade.Sprite).name === instanceId,
    ) as Phaser.Physics.Arcade.Sprite | undefined;
  }

  /**
   * Résout le lot en attente (le plus gros dégât de la salve gagne) et pose la
   * nouvelle ancre. Si la cible retenue est déjà morte au moment du commit (kill
   * dans la même salve — `sprite.active` passe à false synchroniquement dans
   * onEnemyKilled via disableBody), l'Écho saute DIRECTEMENT sur sa dernière
   * position (pas de tween — il n'y a plus rien à suivre) puis gèle : décision
   * prise faute de pouvoir consulter le design sur ce cas précis, cohérente avec
   * la règle "l'ancre va à la cible ayant reçu le plus gros dégât de la salve".
   */
  private commitEchoAnchor(): void {
    this.echoAnchorCommitScheduled = false;
    const pending = this.echoPendingAnchor;
    this.echoPendingAnchor = null;
    if (!pending) return;

    const sprite = this.findEnemySpriteByInstanceId(pending.instanceId);
    if (!sprite) return; // introuvable (edge case) : l'Écho reste où il était

    this.echoAnchorInstanceId = pending.instanceId;
    const targetX = sprite.x;
    const targetY = sprite.y - sprite.displayHeight / 2 - GameScene.ECHO_ANCHOR_Y_OFFSET;
    this.echoFrozen = !sprite.active;

    if (this.echoMoveTween) { this.echoMoveTween.remove(); this.echoMoveTween = null; }

    if (!this.echoHasPosition || this.echoFrozen) {
      this.echoX = targetX;
      this.echoY = targetY;
      this.echoTweenT = 1;
      this.echoHasPosition = true;
      return;
    }

    this.echoTweenStartX = this.echoX;
    this.echoTweenStartY = this.echoY;
    this.echoTweenT = 0;
    this.echoMoveTween = this.tweens.addCounter({
      from: 0, to: 1, duration: GameScene.ECHO_ANCHOR_TWEEN_MS, ease: 'Quad.easeOut',
      onUpdate: (tw) => { this.echoTweenT = tw.getValue() ?? 1; },
    });
  }

  private echoFormatTotal(n: number): string {
    if (n >= 100000) return `${Math.floor(n / 1000)}k`;
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  private echoFormatHits(n: number): string {
    return n > 999 ? '999+' : String(n);
  }

  private ensureEchoContainer(): void {
    if (this.echoContainer && this.echoContainer.active) return;
    // uiStyle(10) route vers Neatpixels Minimal (grille 10px) : c'est la SEULE
    // famille où les tailles de palier 20/30 sont nettes — applyEchoTierStyle
    // pose ensuite la taille/couleur réelles du palier courant.
    this.echoTotalText = this.add.text(0, 0, '', uiStyle(10, UI.TXT_GOLD, { bold: true, stroke: true }))
      .setOrigin(0.5, 1);
    this.echoHitsText = this.add.text(0, 2, '', uiStyle(10, UI.TXT_PARCHMENT, { stroke: true }))
      .setOrigin(0.5, 0)
      .setAlpha(0.7);
    this.echoContainer = this.add.container(this.echoX, this.echoY, [this.echoTotalText, this.echoHitsText])
      .setDepth(101);
    this.applyEchoTierStyle(this.echoTierFor(this.echoHits + this.getSoulStackOffset()));
  }

  private renderEcho(time: number): void {
    if (!this.echoContainer || !this.echoContainer.active) return;
    const cam = this.cameras.main.worldView;
    const clampedX = Phaser.Math.Clamp(this.echoX, cam.x + 10, cam.right - 10);
    const clampedY = Phaser.Math.Clamp(this.echoY, cam.y + 10, cam.bottom - 10);
    this.echoContainer.setPosition(clampedX, clampedY);

    // Rolling count-up : on affiche la valeur qui ROULE vers echoTotal, pas echoTotal.
    this.echoTotalText?.setText(this.echoFormatTotal(Math.round(this.echoDisplayTotal)));
    this.echoHitsText?.setText(`${t('hud.echo_label')} ×${this.echoFormatHits(this.echoHits + this.getSoulStackOffset())}`);

    // Pré-avertissement : 600 dernières ms avant expiration, alpha 1.0↔0.65 à 4Hz.
    const warnStart = this.echoDeadline - GameScene.ECHO_WARN_MS;
    if (time >= warnStart) {
      const tSec = (time - warnStart) / 1000;
      const alpha = 0.65 + 0.35 * (0.5 + 0.5 * Math.sin(tSec * GameScene.ECHO_WARN_HZ * 2 * Math.PI));
      this.echoContainer.setAlpha(alpha);
    } else {
      this.echoContainer.setAlpha(1);
    }
  }

  /** Expiration de la fenêtre : reset logique INSTANTANÉ + animation de libération
   *  sur une COPIE détachée (le container n'est plus this.echoContainer dès cet
   *  appel) — un nouveau cycle peut démarrer dès le prochain coup direct sans
   *  attendre la fin des 350ms de fade. */
  private releaseEcho(): void {
    const container = this.echoContainer;
    // Le texte figé dans l'animation de libération montre le TOTAL final réel —
    // pas la valeur du count-up en cours (qui peut retarder de ~100ms).
    this.echoTotalText?.setText(this.echoFormatTotal(this.echoTotal));
    this.echoContainer  = null;
    this.echoTotalText  = null;
    this.echoHitsText   = null;
    if (this.echoMoveTween)  { this.echoMoveTween.remove();  this.echoMoveTween = null; }
    if (this.echoCountTween) { this.echoCountTween.remove(); this.echoCountTween = null; }
    if (this.echoPunchTween) { this.echoPunchTween.remove(); this.echoPunchTween = null; }
    if (this.echoIdleTween)  { this.echoIdleTween.remove();  this.echoIdleTween = null; }
    if (this.echoStrokeFlashEvt) { this.echoStrokeFlashEvt.remove(); this.echoStrokeFlashEvt = null; }
    this.echoPendingAnchor = null;

    this.echoTotal            = 0;
    this.echoHits             = 0;
    this.echoAnchorInstanceId = null;
    this.echoDeadline         = 0;
    this.echoFrozen           = false;
    this.echoHasPosition      = false;
    this.echoTweenT           = 1;
    this.echoTier             = 0;
    this.echoDisplayTotal     = 0;

    if (!container || !container.active) return;
    this.tweens.add({
      targets: container,
      scale: 1.3,
      y: container.y - 12,
      alpha: 0,
      duration: GameScene.ECHO_RELEASE_MS,
      ease: 'Quad.easeOut',
      onComplete: () => container.destroy(),
    });
  }

  /** Destruction SANS animation — mort du joueur, changement de zone, shutdown
   *  de la scène. Aucune de ces trois situations ne doit jouer la libération. */
  private destroyEchoImmediate(): void {
    if (this.echoMoveTween)  { this.echoMoveTween.remove();  this.echoMoveTween = null; }
    if (this.echoCountTween) { this.echoCountTween.remove(); this.echoCountTween = null; }
    if (this.echoPunchTween) { this.echoPunchTween.remove(); this.echoPunchTween = null; }
    if (this.echoIdleTween)  { this.echoIdleTween.remove();  this.echoIdleTween = null; }
    if (this.echoStrokeFlashEvt) { this.echoStrokeFlashEvt.remove(); this.echoStrokeFlashEvt = null; }
    this.echoPendingAnchor        = null;
    this.echoAnchorCommitScheduled = false;
    if (this.echoContainer) {
      this.tweens.killTweensOf(this.echoContainer);
      this.echoContainer.destroy();
      this.echoContainer = null;
    }
    this.echoTotalText  = null;
    this.echoHitsText   = null;
    this.echoTotal             = 0;
    this.echoHits              = 0;
    this.echoAnchorInstanceId  = null;
    this.echoDeadline          = 0;
    this.echoFrozen            = false;
    this.echoHasPosition       = false;
    this.echoTweenT            = 1;
    this.echoTier              = 0;
    this.echoDisplayTotal      = 0;
  }

  /** Appelé chaque frame depuis update() (déjà gardé par le early-return
   *  isInDialogue/isTraveling/menuOpen — la fenêtre ne "coule" donc pas pendant
   *  la pause, même principe que comboDeadline). */
  private updateEcho(time: number): void {
    if (!this.echoHasPosition && this.echoHits === 0 && this.echoTotal === 0) return;

    if (this.echoDeadline > 0 && time >= this.echoDeadline) {
      this.releaseEcho();
      return;
    }

    if (!this.echoFrozen && this.echoAnchorInstanceId) {
      const sprite = this.findEnemySpriteByInstanceId(this.echoAnchorInstanceId);
      if (!sprite || !sprite.active) {
        this.echoFrozen = true;
      } else {
        const targetX = sprite.x;
        const targetY = sprite.y - sprite.displayHeight / 2 - GameScene.ECHO_ANCHOR_Y_OFFSET;
        this.echoX = Phaser.Math.Linear(this.echoTweenStartX, targetX, this.echoTweenT);
        this.echoY = Phaser.Math.Linear(this.echoTweenStartY, targetY, this.echoTweenT);
      }
    }

    if (this.echoHits + this.getSoulStackOffset() >= GameScene.ECHO_VISIBILITY_HITS) {
      this.ensureEchoContainer();
      this.renderEcho(time);
    }
  }

  /** Feedback flottant DODGE_PCT (loot stat rolls) — même style que showDamageNumber. */
  /** « No mechanic without feedback » (cf. DODGE_PCT) — au moment où un statut
   *  est posé sur le JOUEUR (talents Partie 2), sans quoi rien à l'écran ne
   *  distingue "j'ai résisté" de "le jet a raté" de "le mécanisme est cassé". */
  private static readonly PLAYER_STATUS_LABEL: Record<StatusEffect['type'], string> = {
    BURN: 'Brûlure !', SLOW: 'Ralenti !', SHOCK: 'Choc !',
    FREEZE: 'Gelé !', STUN: 'Étourdi !', BLEED: 'Saignement !', POISON: 'Poison !', EXPOSE: 'Exposé !',
  };
  private static readonly PLAYER_STATUS_COLOR: Record<StatusEffect['type'], string> = {
    BURN: '#ff6644', SLOW: '#66ccff', SHOCK: '#ffee44',
    FREEZE: '#aaeeff', STUN: '#ffcc44', BLEED: '#ff4444', POISON: '#88cc44', EXPOSE: '#ffaa44',
  };

  private showPlayerStatusAppliedText(type: StatusEffect['type']) {
    const txt = this.add.text(
      this.player.x + Phaser.Math.Between(-6, 6), this.player.y - 26,
      GameScene.PLAYER_STATUS_LABEL[type],
      { fontSize: '13px', color: GameScene.PLAYER_STATUS_COLOR[type], fontFamily: FONT, stroke: '#000000', strokeThickness: 2 },
    ).setDepth(100).setOrigin(0.5, 1);
    this.tweens.add({
      targets: txt, y: txt.y - 40, alpha: 0, duration: 900, ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  /** Teinte le sprite joueur pendant qu'un statut subi est actif (talents
   *  Partie 2) — priorité SHOCK/FREEZE/STUN (immobilise, le plus visible)
   *  > SLOW > BURN si plusieurs sont actifs en même temps. Appelé chaque
   *  frame depuis tickPlayerStatusEffects ; ne touche pas à l'alpha (déjà
   *  utilisé par le clignotement i-frames, cf. update()). */
  private updatePlayerStatusTint() {
    const active = this.playerStatusEffects.find(e => e.type === 'SHOCK' || e.type === 'FREEZE' || e.type === 'STUN')
      ?? this.playerStatusEffects.find(e => e.type === 'SLOW')
      ?? this.playerStatusEffects.find(e => e.type === 'BURN');
    if (!active) { if (this.player.isTinted) this.player.clearTint(); return; }
    this.player.setTint(Phaser.Display.Color.HexStringToColor(GameScene.PLAYER_STATUS_COLOR[active.type]).color);
  }

  private showDodgeText(x: number, y: number) {
    const txt = this.add.text(x + Phaser.Math.Between(-6, 6), y, 'Esquive !', {
      fontSize: '13px', color: '#88ddff', fontFamily: FONT,
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(100).setOrigin(0.5, 1);

    this.tweens.add({
      targets: txt,
      y: y - 40,
      alpha: 0,
      duration: 900,
      ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  private showHealNumber(x: number, y: number, amount: number) {
    const txt = this.add.text(x, y, `+${amount}`, {
      fontSize: '14px', color: '#44ff88', fontFamily: FONT,
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(100);
    this.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
  }

  // ── MAP RENDERING ────────────────────────────────────────────

  private generatePixelTexture() {
    if (!this.textures.exists('_px')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false } as any);
      g.fillStyle(0xffffff);
      g.fillRect(0, 0, 1, 1);
      g.generateTexture('_px', 1, 1);
      g.destroy();
    }
  }

  private ensureTexture(key: string, color: number, w = 32, h = 32) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false } as any);
    g.fillStyle(color);
    g.fillRect(2, 2, w - 4, h - 4);
    g.lineStyle(2, 0x000000, 0.5);
    g.strokeRect(2, 2, w - 4, h - 4);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private drawZoneMap() {
    const { mapWidth, mapHeight, bgColor, pathColor, wallColor, accentColor, walls, paths, teleports } = this.layout;
    const zoneId = this.gameState.player.currentZone;
    // Une carte GÉNÉRÉE (RunSystem) ne doit jamais utiliser les textures bitmap
    // réelles d'ignis_reach : elles sont peintes pour l'ANCIEN tracé statique
    // (une rivière de lave à des coordonnées fixes, etc.) et, posées sur une
    // grille procédurale, donnaient un sol et des couloirs visuellement
    // identiques — aucune distinction perceptible entre salle/couloir/fond
    // (retour playtest : "carte vide, sans relief"). Le fallback couleur plate
    // + le contour par cellule ci-dessous restent la seule source de relief
    // tant qu'un art procédural dédié n'existe pas.
    const isGenerated = !!this.currentGeneratedMap;

    const gfx = this.add.graphics().setDepth(0);
    this.zoneGraphics = gfx;

    // Background — texture bitmap réelle si dispo pour cette zone (voir ASSET_SOURCES.md),
    // sinon fillRect procédural. Les TileSprites sont sous gfx (depth 0) donc les murs/
    // accents/highlights de téléport (dessinés dans gfx plus bas) restent bien par-dessus.
    const groundKey = `tileset_${zoneId}_ground`;
    if (!isGenerated && this.textures.exists(groundKey)) {
      const ground = this.add.tileSprite(0, 0, mapWidth, mapHeight, groundKey).setOrigin(0, 0).setDepth(-1);
      this.zoneTileSprites.push(ground);
    } else {
      // ATTENTION : ce fillRect est dans gfx (depth 0), donc au-dessus d'un éventuel
      // TileSprite de path (depth -0.5). Ne fonctionne que tant qu'une zone a soit
      // les deux textures, soit aucune — si un jour une zone n'a qu'une texture de
      // path sans texture de sol, ce fallback masquerait le path. Revoir l'ordonnancement
      // des depths si ce cas se présente.
      gfx.fillStyle(bgColor);
      gfx.fillRect(0, 0, mapWidth, mapHeight);
    }

    // Paths (drawn over background, below walls)
    if (paths.length > 0) {
      const pathKey = `tileset_${zoneId}_path`;
      if (!isGenerated && this.textures.exists(pathKey)) {
        for (const p of paths) {
          const pathTile = this.add.tileSprite(p.x, p.y, p.w, p.h, pathKey).setOrigin(0, 0).setDepth(-0.5);
          this.zoneTileSprites.push(pathTile);
        }
      } else {
        gfx.fillStyle(pathColor);
        for (const p of paths) gfx.fillRect(p.x, p.y, p.w, p.h);
        if (isGenerated) {
          // Chaque PathRect correspond à UNE cellule de MapGenSystem — un fin
          // contour par cellule donne la seule lisibilité de structure (salles/
          // couloirs) disponible tant qu'aucun art procédural dédié n'existe.
          gfx.lineStyle(1, 0x000000, 0.25);
          for (const p of paths) gfx.strokeRect(p.x, p.y, p.w, p.h);
        }
      }
    }

    // Accent details (lava, water, crystals, etc.) — coordonnées codées en dur
    // pour le tracé STATIQUE de chaque zone (cf. drawZoneAccents) : n'a aucun
    // sens sur une carte générée, sauterait potentiellement dans un mur.
    if (accentColor && !isGenerated) {
      gfx.fillStyle(accentColor, 0.45);
      this.drawZoneAccents(gfx, zoneId);
    }

    // Wall buildings/rocks
    gfx.fillStyle(wallColor);
    for (const w of walls) gfx.fillRect(w.x, w.y, w.w, w.h);

    // Wall outlines
    gfx.lineStyle(1, 0x000000, 0.35);
    for (const w of walls) gfx.strokeRect(w.x, w.y, w.w, w.h);

    // Teleport zone highlights
    this.zoneLabels = [];
    for (const tp of teleports) {
      gfx.fillStyle(0x44ff88, 0.35);
      gfx.fillRect(tp.x, tp.y, tp.w, tp.h);
      gfx.lineStyle(1, 0x44ff88, 0.6);
      gfx.strokeRect(tp.x, tp.y, tp.w, tp.h);
      const label = this.add.text(tp.x + tp.w / 2, tp.y + tp.h / 2, tp.label, {
        fontSize: '9px', color: '#88ffaa', fontFamily: FONT,
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(1);
      this.zoneLabels.push(label);
    }

    // Wall physics (static bodies)
    this.wallGroup = this.physics.add.staticGroup();
    for (const w of walls) {
      const cx  = w.x + w.w / 2;
      const cy  = w.y + w.h / 2;
      const img = this.wallGroup.create(cx, cy, '_px') as Phaser.Physics.Arcade.Image;
      img.setVisible(false);
      (img.body as Phaser.Physics.Arcade.StaticBody).setSize(w.w, w.h);
      img.refreshBody();
    }

    // Zones d'eau — rendu bleu + physique bloquante
    if (this.layout.waterAreas) {
      const waterAreas: WaterArea[] = this.layout.waterAreas;
      for (const wa of waterAreas) {
        // Fond profond
        gfx.fillStyle(0x0d2d4a, 1);
        gfx.fillRect(wa.x, wa.y, wa.w, wa.h);
        // Reflets de surface
        gfx.fillStyle(0x1a5080, 0.6);
        gfx.fillRect(wa.x + 4, wa.y + 4, wa.w - 8, Math.floor(wa.h / 3));
        // Corps d'eau bloquant (physique statique)
        const img = this.wallGroup.create(wa.x + wa.w / 2, wa.y + wa.h / 2, '_px') as Phaser.Physics.Arcade.Image;
        img.setVisible(false);
        (img.body as Phaser.Physics.Arcade.StaticBody).setSize(wa.w, wa.h);
        img.refreshBody();
      }
    }

    // Trous (RunSystem, ZoneLayout.pits) — rendu sombre + liseré, PAS de physique
    // bloquante ici (jamais dans wallGroup — la détection est un test direct sur
    // la position du joueur, cf. checkPitFall(), pas un corps physique).
    if (this.layout.pits && this.layout.pits.length > 0) {
      for (const pit of this.layout.pits) {
        gfx.fillStyle(0x000000, 0.85);
        gfx.fillRect(pit.x, pit.y, pit.w, pit.h);
        gfx.lineStyle(2, 0xff6600, 0.5);
        gfx.strokeRect(pit.x, pit.y, pit.w, pit.h);
      }
    }

    // Physics / camera bounds
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
  }

  private drawZoneAccents(gfx: Phaser.GameObjects.Graphics, zoneId: string) {
    const { mapWidth, mapHeight } = this.layout;
    switch (zoneId) {
      case 'ignis_reach':
        // Lava pools
        gfx.fillRect(400, 400, 200, 100);
        gfx.fillRect(900, 700, 300, 120);
        gfx.fillRect(1200, 1400, 250, 100);
        break;
      case 'terravast':
        // Crystal formations
        gfx.fillRect(600, 500, 60, 150);
        gfx.fillRect(1000, 800, 60, 180);
        gfx.fillRect(700, 1500, 80, 160);
        break;
      case 'zephyr_peaks':
        // Cloud wisps
        gfx.fillRect(300, 400, 200, 60);
        gfx.fillRect(1000, 900, 300, 60);
        gfx.fillRect(500, 1500, 250, 60);
        break;
      case 'abyssmar':
        // Coral/deep water
        gfx.fillRect(400, 500, 100, 300);
        gfx.fillRect(1100, 900, 120, 300);
        gfx.fillRect(600, 1600, 200, 150);
        break;
      case 'volterra':
        // Electric conduits
        gfx.fillRect(300, 300, 800, 8);
        gfx.fillRect(300, 1000, 800, 8);
        gfx.fillRect(300, 300, 8, 700);
        gfx.fillRect(1100, 300, 8, 700);
        break;
      case 'glaciem':
        // Ice patches
        gfx.fillRect(400, 400, 300, 100);
        gfx.fillRect(900, 800, 200, 150);
        gfx.fillRect(500, 1400, 400, 100);
        break;
      case 'grievy_town':
        // Grass tufts around buildings
        gfx.fillRect(370, 840, 200, 80);
        gfx.fillRect(420, 300, 160, 60);
        break;
      default:
        // Generic scatter
        for (let i = 0; i < 8; i++) {
          const ax = (mapWidth / 9) * (i + 1) - 50;
          const ay = ((mapHeight / 3) * ((i % 3) + 1)) - 60;
          gfx.fillRect(ax, ay, 80, 40);
        }
    }
  }

  // ── TELEPORT ZONES ───────────────────────────────────────────

  private createTeleportOverlaps() {
    this.teleportZoneImages = [];
    this.teleportOverlaps = [];
    for (const tp of this.layout.teleports) {
      const cx = tp.x + tp.w / 2;
      const cy = tp.y + tp.h / 2;
      const zone = this.physics.add.staticImage(cx, cy, '_px');
      zone.setVisible(false);
      (zone.body as Phaser.Physics.Arcade.StaticBody).setSize(tp.w, tp.h);
      zone.refreshBody();
      this.teleportZoneImages.push(zone);

      const overlap = this.physics.add.overlap(this.player, zone, () => {
        this.travelToZone(tp.targetZone, tp.targetX, tp.targetY);
      });
      this.teleportOverlaps.push(overlap);
    }
  }

  /**
   * Trous (RunSystem, ZoneLayout.pits) — test géométrique DIRECT sur la position
   * du joueur (PAS physics.add.overlap()/un corps statique, cf. commentaire sur
   * pitFallCooldownUntil) : retrouvé à deux reprises en playtest que la chute ne
   * se déclenchait pas de façon fiable avec l'overlap Arcade. Un point-dans-
   * rectangle appelé depuis update() est trivial à vérifier par lecture et ne
   * dépend d'aucun comportement interne de Phaser (corps statique, refreshBody,
   * timing de la détection de collision).
   *
   * Jamais de collision bloquante pour un trou (contradiction avec "tomber") —
   * dégâts via applyDamageToPlayer (seule fonction qui teste isDashing/i-frames :
   * un dash au-dessus d'un trou le traverse sans dégât, lecture "obstacle à
   * franchir" de la spec).
   */
  private checkPitFall(time: number) {
    if (time < this.pitFallCooldownUntil) return;
    const pit = (this.layout.pits ?? []).find(p =>
      this.player.x >= p.x && this.player.x <= p.x + p.w
      && this.player.y >= p.y && this.player.y <= p.y + p.h);
    if (!pit) return;

    const hpBefore = this.gameState.player.stats.hp;
    this.applyDamageToPlayer(pit.damage);
    // hp inchangé = absorbé (dash/iframe/dodge/bouclier) : pas une "vraie" chute,
    // ni cooldown ni réapparition — le joueur a simplement traversé le trou.
    if (this.gameState.player.stats.hp >= hpBefore) return;
    // Coup fatal : applyDamageToPlayer a déjà déclenché onPlayerDeath() (fade +
    // transition en cours) — repositionner ici serait inutile, voire visible
    // pendant le fondu. onPlayerDeath gère déjà tout, y compris le sac de run.
    if (this.gameState.player.stats.hp <= 0) return;
    this.pitFallCooldownUntil = time + 1200;
    const safe = this.safePositionBuffer[0] ?? { x: this.layout.spawnX, y: this.layout.spawnY };
    this.player.setPosition(safe.x, safe.y);
    (this.player.body as Phaser.Physics.Arcade.Body).reset(safe.x, safe.y);
  }

  /** `margin` élargit le rectangle testé — la détection Arcade réelle (overlap
   *  entre corps physiques, pas des points) peut déclencher la chute alors que
   *  le CENTRE du joueur n'est qu'à quelques pixels du bord du trou. Un point
   *  jugé "hors trou" sans marge peut donc être à peine à l'extérieur — repérer
   *  ce point comme "sûr" (recordSafePosition) puis y téléporter le joueur après
   *  une chute le laissait visuellement quasi au même endroit (retrouvé en
   *  playtest : plusieurs chutes rapprochées, aucune vraie sortie du trou). */
  private isInsideAnyPit(x: number, y: number, margin = 0): boolean {
    for (const pit of this.layout.pits ?? []) {
      if (x >= pit.x - margin && x <= pit.x + pit.w + margin
        && y >= pit.y - margin && y <= pit.y + pit.h + margin) return true;
    }
    return false;
  }

  /** Alimente le buffer de "dernière position hors trou" (~500ms glissants) —
   *  jamais enregistré tant que le joueur est DANS un trou (safePositionBuffer[0]
   *  doit toujours être un point sûr, jamais recalculé à la volée). Marge de 48px
   *  (~2× le rayon du joueur) : un point tout juste à l'extérieur du rectangle du
   *  trou n'est PAS considéré sûr — sinon la réapparition post-chute peut retomber
   *  à quelques pixels du bord, visuellement indiscernable du trou lui-même. */
  private recordSafePosition(time: number) {
    if (!this.layout.pits || this.layout.pits.length === 0) return;
    if (this.isInsideAnyPit(this.player.x, this.player.y, 48)) return;
    this.safePositionBuffer.push({ x: this.player.x, y: this.player.y, t: time });
    const cutoff = time - 500;
    while (this.safePositionBuffer.length > 1 && this.safePositionBuffer[0].t < cutoff) {
      this.safePositionBuffer.shift();
    }
  }

  // ── SETUP ────────────────────────────────────────────────────

  private createPlayer() {
    const pos = this.gameState.player.position;
    const startX = (pos.x > 0) ? pos.x : this.layout.spawnX;
    const startY = (pos.y > 0) ? pos.y : this.layout.spawnY;

    // Sprite bitmap réel (ELV Games, cf. public/assets/ASSET_SOURCES.md) si chargé,
    // sinon fallback procédural — le jeu doit rester jouable sans les assets
    // (règle ASSETS_IMPORT_GUIDE.md §7.1).
    const hasRealSprite = this.textures.exists('player_idle');
    if (!hasRealSprite) this.ensureTexture('player', 0x44aaff);

    this.player = this.physics.add.sprite(startX, startY, hasRealSprite ? 'player_idle' : 'player');
    // Frames idle/walk/dead natives 24×24 — échelle entière ×2 (48×48) pour rester
    // lisible à l'écran tout en évitant le "shimmer" du pixel art en filtrage
    // nearest-neighbor (pixelArt: true) — un ×1 (24×24) était net mais trop petit.
    // Hitbox dimensionnée sur le contenu opaque réel (le perso ne remplit qu'~38%
    // de son cadre natif) plutôt que sur le cadre entier, sinon la boîte de
    // collision déborde largement de la silhouette visible.
    if (hasRealSprite) {
      const fit = fitSpriteToContent(PLAYER_SPRITE_BBOX, 36);
      this.player.setDisplaySize(fit.dispSize, fit.dispSize);
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      // Body.setSize()/setOffset() on a DYNAMIC body take SOURCE (pre-scale) pixels —
      // Phaser re-multiplies by the sprite's current scale every physics tick, so the
      // already-scaled fit.bodyW/H/offsetX/Y would get scaled a second time. Pass the
      // raw bbox instead (StaticBody, used for NPCs below, is display-space and does
      // want fit.bodyW/H directly — different API despite the similar name).
      body.setSize(PLAYER_SPRITE_BBOX.w, PLAYER_SPRITE_BBOX.h);
      body.setOffset(PLAYER_SPRITE_BBOX.x, PLAYER_SPRITE_BBOX.y);
    } else {
      this.player.setDisplaySize(28, 28);
      this.player.setBodySize(24, 24);
    }
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
    if (hasRealSprite) this.player.play('player_idle_down');
  }

  private createEnemiesForZone(zoneId: string) {
    this.enemies = this.physics.add.group();
    const zone = ZONE_MAP[zoneId];
    if (!zone) return;

    const enemyColor = ZONE_ENEMY_COLORS[zoneId] ?? 0xaa4444;
    const eliteColor = Phaser.Display.Color.IntegerToColor(enemyColor).brighten(30).color;
    const { mapWidth, mapHeight } = this.layout;

    for (const enemyId of zone.enemies) {
      const def = ENEMY_MAP[enemyId];
      if (!def || def.isBoss) continue;

      const count = Math.floor(def.spawnWeight * 4);
      const spawnRegions = ENEMY_SPAWN_REGIONS[enemyId];
      // Les régions nw/ne/.../center sont arbitrées pour la géométrie ~carrée des zones
      // principales — sur un connecteur très étiré (ex: route_lava_bridge, 1200x3000),
      // le quadrant assigné pour la zone "maison" de l'ennemi peut chevaucher un mur/de la
      // lave. Désactiver le biais dès que le ratio d'aspect de la map est extrême évite ce
      // cas sans avoir à indexer ENEMY_SPAWN_REGIONS par (enemyId, zoneId).
      const aspectRatio = Math.max(mapWidth, mapHeight) / Math.min(mapWidth, mapHeight);
      const regionsUsable = aspectRatio <= 1.5;
      for (let i = 0; i < count; i++) {
        // Provisoire/approximatif : biaise le spawn vers un quadrant plausible de la zone
        // (ENEMY_SPAWN_REGIONS, cf. heatmap Bestiaire) au lieu d'un tirage uniforme sur
        // toute la map — à remplacer une fois les maps de zone finalisées. N'est PAS
        // utilisé pour les zones de run générées (spawnRunEnemies utilise les points
        // validés par MapGenSystem, hors murs par construction).
        const region = regionsUsable ? pickSpawnRegion(spawnRegions) : undefined;
        const rect = region ? getSpawnRegionRect(region, mapWidth, mapHeight) : null;
        const ex = rect
          ? Phaser.Math.Between(Math.floor(rect.x0), Math.ceil(rect.x1))
          : Phaser.Math.Between(150, mapWidth - 150);
        const ey = rect
          ? Phaser.Math.Between(Math.floor(rect.y0), Math.ceil(rect.y1))
          : Phaser.Math.Between(150, mapHeight - 150);
        this.spawnEnemyInstance(enemyId, ex, ey, zoneId);
      }
    }

    // Ennemis placés à la main (spawnWeight 0, ignorés par la boucle aléatoire
    // ci-dessus) — DEV TOOL, cf. docs/design/LOOT_STAT_ROLLS.md §10. Chacun ne
    // spawn que si son requiresFlag est vrai sur le joueur (même convention que
    // DialogueSystem.checkCondition). Position fixe, jamais élite.
    for (const placement of this.layout.fixedEnemies ?? []) {
      if (placement.requiresFlag && !this.gameState.player.flags[placement.requiresFlag]) continue;
      const def = ENEMY_MAP[placement.id];
      if (!def || def.isBoss) continue;

      const texKey        = `enemy_${placement.id}`;
      const texKeyElite    = `enemy_${placement.id}_elite`;
      const hasRealSprite = this.textures.exists(`enemy_${placement.id}_idle`);
      if (!hasRealSprite) {
        this.ensureTexture(texKey, enemyColor);
        this.ensureTexture(texKeyElite, eliteColor, 44, 44);
      }

      const ex = placement.x;
      const ey = placement.y;
      const enemyBbox = ENEMY_SPRITE_BBOX[placement.id];
      const enemyFit  = hasRealSprite && enemyBbox ? fitSpriteToContent(enemyBbox, 36) : null;
      const dispSize  = enemyFit ? enemyFit.dispSize : 28;
      const sprite = hasRealSprite
        ? this.physics.add.sprite(ex, ey, `enemy_${placement.id}_idle`)
        : this.physics.add.sprite(ex, ey, texKey);
      sprite.setDisplaySize(dispSize, dispSize);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      if (enemyFit && enemyBbox) {
        body.setSize(enemyBbox.w, enemyBbox.h);
        body.setOffset(enemyBbox.x, enemyBbox.y);
      } else {
        body.setSize(dispSize - 8, dispSize - 8);
      }
      sprite.setDepth(4);
      sprite.setData('baseScale', sprite.scale);
      if (hasRealSprite) {
        sprite.setData('hasRealSprite', true);
        sprite.play(`enemy_${placement.id}_idle`);
      }

      const active = CombatSystem.spawnEnemy(def, zoneId);
      active.x = ex;
      active.y = ey;
      sprite.name = active.instanceId;
      this.activeEnemies.set(active.instanceId, active);
      this.enemies.add(sprite);

      const contentTopGap = enemyFit ? dispSize / 2 - enemyFit.offsetY : dispSize / 2;
      const barY  = ey - contentTopGap - 8;
      const barW  = (enemyFit ? enemyFit.bodyW : dispSize) + 4;
      const barBg = this.add.rectangle(ex, barY, barW, 6, 0x220000).setDepth(8);
      const barFg = this.add.rectangle(ex - barW / 2, barY, barW, 4, 0xff2222).setDepth(9).setOrigin(0, 0.5);
      this.enemyHpBars.set(active.instanceId, { bg: barBg, bar: barFg, baseW: barW });
    }

    // Boss spawn — only if zone has a boss and it hasn't been cleared yet
    if (zone.bossId && !this.gameState.player.clearedZones.includes(zone.element as ElementType)) {
      const bossDef = ENEMY_MAP[zone.bossId];
      if (bossDef) {
        const bx = Math.floor(mapWidth / 2);
        const by = Math.floor(mapHeight / 2);
        const bossTexKey = `enemy_${zone.bossId}`;
        const bossHasRealSprite = this.textures.exists(`${bossTexKey}_idle`);
        if (!bossHasRealSprite) this.ensureTexture(bossTexKey, 0xffd700, 64, 64);

        // Contenu opaque réel mesuré (même raison que les ennemis réguliers ci-dessus) —
        // sinon le boss paraît petit et sa hitbox déborde largement de sa silhouette.
        const bossBbox = ENEMY_SPRITE_BBOX[zone.bossId];
        const bossFit = bossHasRealSprite && bossBbox ? fitSpriteToContent(bossBbox, 68) : null;
        const bossDispSize = bossFit ? bossFit.dispSize : 64;
        const bossSprite = bossHasRealSprite
          ? this.physics.add.sprite(bx, by, `${bossTexKey}_idle`)
          : this.physics.add.sprite(bx, by, bossTexKey);
        bossSprite.setDisplaySize(bossDispSize, bossDispSize);
        const bossBody = bossSprite.body as Phaser.Physics.Arcade.Body;
        if (bossFit && bossBbox) {
          // DYNAMIC body — raw source-pixel bbox, not the scaled fit values (see createPlayer()).
          bossBody.setSize(bossBbox.w, bossBbox.h);
          bossBody.setOffset(bossBbox.x, bossBbox.y);
        } else {
          bossBody.setSize(bossDispSize - 4, bossDispSize - 4);
        }
        bossSprite.setDepth(5);
        bossSprite.setData('baseScale', bossSprite.scale);
        if (bossHasRealSprite) {
          bossSprite.setData('hasRealSprite', true);
          bossSprite.play(`${bossTexKey}_idle`);
        }

        const activeBoss = CombatSystem.spawnEnemy(bossDef, zoneId);
        activeBoss.x = bx;
        activeBoss.y = by;
        bossSprite.name = activeBoss.instanceId;
        this.activeEnemies.set(activeBoss.instanceId, activeBoss);
        this.enemies.add(bossSprite);

        const bossContentTopGap = bossFit ? bossDispSize / 2 - bossFit.offsetY : bossDispSize / 2;
        const bossBarW = 72;
        const bossBarY = by - bossContentTopGap - 12;
        const bossBg = this.add.rectangle(bx, bossBarY, bossBarW, 8, 0x220000).setDepth(8);
        const bossFg = this.add.rectangle(bx - bossBarW / 2, bossBarY, bossBarW, 6, 0xffd700)
          .setDepth(9).setOrigin(0, 0.5);
        this.enemyHpBars.set(activeBoss.instanceId, { bg: bossBg, bar: bossFg, baseW: bossBarW });

        const crown = this.add.text(bx, by - bossContentTopGap - 20, '* BOSS *', {
          fontSize: '10px', color: '#ffd700', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5, 1).setDepth(10);
        this.enemyCrowns.set(activeBoss.instanceId, crown);

        this.time.delayedCall(1500, () => {
          this.showBossAnnouncement(bossDef.name, zone.element as ElementType);
        });
      }
    }
  }

  /**
   * Crée UNE instance ennemie à une position déjà décidée par l'appelant (uniforme
   * dans une région pour les zones classiques, cf. createEnemiesForZone ; point
   * validé par MapGenSystem pour une zone de run, cf. spawnRunEnemies). Extrait de
   * l'ancienne boucle unique de createEnemiesForZone (RunSystem Phase 4) pour être
   * réutilisable sans dupliquer ~120 lignes de fitting sprite/hp-bar/couronne.
   */
  private spawnEnemyInstance(enemyId: string, ex: number, ey: number, zoneId: string): ActiveEnemy | null {
    const def = ENEMY_MAP[enemyId];
    if (!def || def.isBoss) return null;

    const enemyColor = ZONE_ENEMY_COLORS[zoneId] ?? 0xaa4444;
    const eliteColor = Phaser.Display.Color.IntegerToColor(enemyColor).brighten(30).color;
    const texKey      = `enemy_${enemyId}`;
    const texKeyElite = `enemy_${enemyId}_elite`;
    const hasRealSprite = this.textures.exists(`enemy_${enemyId}_idle`);
    if (!hasRealSprite) {
      this.ensureTexture(texKey, enemyColor);
      this.ensureTexture(texKeyElite, eliteColor, 44, 44);
    }

    // Une créature peut être élite de DEUX façons : parce que sa data le dit
    // (def.isElite), ou par promotion aléatoire d'un mob banal.
    const rolledElite = Math.random() < ELITE_PROMOTION_CHANCE;
    const isElite = def.isElite || rolledElite;

    // Sprites bitmap réels ont un cadre natif très rembourré de transparence —
    // dimensionner l'affichage ET la hitbox sur le contenu opaque réel.
    const enemyBbox = ENEMY_SPRITE_BBOX[enemyId];
    const enemyFit = hasRealSprite && enemyBbox ? fitSpriteToContent(enemyBbox, isElite ? 46 : 36) : null;
    const dispSize = enemyFit ? enemyFit.dispSize : (isElite ? 44 : 28);
    const sprite = hasRealSprite
      ? this.physics.add.sprite(ex, ey, `enemy_${enemyId}_idle`)
      : this.physics.add.sprite(ex, ey, isElite ? texKeyElite : texKey);
    sprite.setDisplaySize(dispSize, dispSize);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    if (enemyFit && enemyBbox) {
      body.setSize(enemyBbox.w, enemyBbox.h);
      body.setOffset(enemyBbox.x, enemyBbox.y);
    } else {
      body.setSize(dispSize - 8, dispSize - 8);
    }
    sprite.setDepth(4);
    sprite.setData('baseScale', sprite.scale);
    if (hasRealSprite) {
      sprite.setData('hasRealSprite', true);
      if (isElite) {
        sprite.setTint(eliteColor);
        sprite.setData('persistentTint', eliteColor);
      }
      sprite.play(`enemy_${enemyId}_idle`);
    }

    const active = CombatSystem.spawnEnemy(def, zoneId);
    active.x       = ex;
    active.y       = ey;
    active.isElite = isElite;
    // ELITE_PROMOTION dérivé de l'écart d'ancres TRASH→ELITE (enemyScaling.ts) —
    // un élite promu vaut désormais autant qu'une élite de data.
    if (rolledElite && !def.isElite) {
      const promo = elitePromotionAt(depthOfZone(zoneId));
      const hp = Math.max(1, Math.floor(active.maxHp * promo.hp));
      active.currentHp = hp;
      active.maxHp     = hp;
      active.stats     = {
        ...active.stats,
        baseHp:       hp,
        baseAtk:      Math.max(1, Math.floor(active.stats.baseAtk      * promo.atk)),
        baseMagicAtk: Math.max(1, Math.floor(active.stats.baseMagicAtk * promo.matk)),
      };
    }
    sprite.name = active.instanceId;
    this.activeEnemies.set(active.instanceId, active);
    this.enemies.add(sprite);

    // HP bar ancrée sur le sommet du contenu VISIBLE, pas le cadre padded entier.
    const contentTopGap = enemyFit ? dispSize / 2 - enemyFit.offsetY : dispSize / 2;
    const barY = ey - contentTopGap - 8;
    const barW = (enemyFit ? enemyFit.bodyW : dispSize) + 4;
    const barBg = this.add.rectangle(ex, barY, barW, 6, 0x220000).setDepth(8);
    const barFg = this.add.rectangle(
      ex - barW / 2, barY, barW, 4, isElite ? 0xff8800 : 0xff2222,
    ).setDepth(9).setOrigin(0, 0.5);
    this.enemyHpBars.set(active.instanceId, { bg: barBg, bar: barFg, baseW: barW });

    if (isElite) {
      const crown = this.add.text(ex, ey - contentTopGap - 18, '♛', {
        fontSize: '12px', color: '#ffdd00',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(10);
      this.enemyCrowns.set(active.instanceId, crown);
    }

    return active;
  }

  /**
   * Spawn fini pour une zone de run (RunSystem, Phase 4) — jusqu'à run.quotaTarget
   * ennemis, sur les points de spawn validés par MapGenSystem (hors murs/trous par
   * construction, cf. MapGenSystem.generateZoneLayout). AUCUN respawn : contrairement
   * à createEnemiesForZone (zones classiques), une fois ces ennemis morts le quota
   * progresse vers le boss — pas de flux continu.
   */
  private spawnRunEnemies(zoneId: string, run: RunState, generated: GeneratedMap) {
    this.enemies = this.physics.add.group();
    const zone = ZONE_MAP[zoneId];
    if (!zone || generated.spawnPoints.length === 0) return;

    const weighted: { id: string; weight: number }[] = zone.enemies
      .map(id => ({ id, weight: ENEMY_MAP[id]?.spawnWeight ?? 0 }))
      .filter(e => e.weight > 0 && !ENEMY_MAP[e.id]?.isBoss);
    if (weighted.length === 0) return;
    const totalWeight = weighted.reduce((sum, e) => sum + e.weight, 0);
    const pickEnemyId = (): string => {
      let roll = Math.random() * totalWeight;
      for (const e of weighted) {
        roll -= e.weight;
        if (roll <= 0) return e.id;
      }
      return weighted[weighted.length - 1].id;
    };

    for (let i = 0; i < run.quotaTarget; i++) {
      const point = generated.spawnPoints[i % generated.spawnPoints.length];
      // Léger jitter (purement cosmétique, non-seedé comme le reste du spawn ennemi
      // classique) pour éviter un empilement parfait quand quotaTarget dépasse le
      // nombre de points disponibles (escalade "Continuer").
      const ex = point.x + Phaser.Math.Between(-20, 20);
      const ey = point.y + Phaser.Math.Between(-20, 20);
      this.spawnEnemyInstance(pickEnemyId(), ex, ey, zoneId);
    }
  }

  /**
   * Fait disparaître les mobs de run restants (quota atteint) et spawn le boss à
   * bossRoomCenter (position générée, remplace le centre-carte codé en dur des
   * zones classiques). Ne touche jamais aux ennemis d'une zone non-run.
   */
  private spawnRunBoss(zoneId: string, bossRoomCenter: { x: number; y: number }) {
    const zone = ZONE_MAP[zoneId];
    if (!zone?.bossId) return;
    const bossDef = ENEMY_MAP[zone.bossId];
    if (!bossDef) return;

    // Les mobs restants disparaissent (spec §5) — pas de mise à mort différée.
    for (const [instanceId, sprite] of Array.from(this.enemies.children.getArray()).map(
      go => [(go as Phaser.Physics.Arcade.Sprite).name, go as Phaser.Physics.Arcade.Sprite] as const,
    )) {
      const barData = this.enemyHpBars.get(instanceId);
      if (barData) { barData.bg.destroy(); barData.bar.destroy(); this.enemyHpBars.delete(instanceId); }
      const crown = this.enemyCrowns.get(instanceId);
      if (crown) { crown.destroy(); this.enemyCrowns.delete(instanceId); }
      this.activeEnemies.delete(instanceId);
      sprite.destroy();
    }

    const bx = Math.floor(bossRoomCenter.x);
    const by = Math.floor(bossRoomCenter.y);
    const bossTexKey = `enemy_${zone.bossId}`;
    const bossHasRealSprite = this.textures.exists(`${bossTexKey}_idle`);
    if (!bossHasRealSprite) this.ensureTexture(bossTexKey, 0xffd700, 64, 64);

    const bossBbox = ENEMY_SPRITE_BBOX[zone.bossId];
    const bossFit = bossHasRealSprite && bossBbox ? fitSpriteToContent(bossBbox, 68) : null;
    const bossDispSize = bossFit ? bossFit.dispSize : 64;
    const bossSprite = bossHasRealSprite
      ? this.physics.add.sprite(bx, by, `${bossTexKey}_idle`)
      : this.physics.add.sprite(bx, by, bossTexKey);
    bossSprite.setDisplaySize(bossDispSize, bossDispSize);
    const bossBody = bossSprite.body as Phaser.Physics.Arcade.Body;
    if (bossFit && bossBbox) {
      bossBody.setSize(bossBbox.w, bossBbox.h);
      bossBody.setOffset(bossBbox.x, bossBbox.y);
    } else {
      bossBody.setSize(bossDispSize - 4, bossDispSize - 4);
    }
    bossSprite.setDepth(5);
    bossSprite.setData('baseScale', bossSprite.scale);
    if (bossHasRealSprite) {
      bossSprite.setData('hasRealSprite', true);
      bossSprite.play(`${bossTexKey}_idle`);
    }

    const activeBoss = CombatSystem.spawnEnemy(bossDef, zoneId);
    activeBoss.x = bx;
    activeBoss.y = by;
    // Escalade "Continuer" (RunSystem) — multiplicateur simple appliqué APRÈS spawn,
    // même motif que la promotion élite (jamais via enemyScaling.ts/ZONE_DEPTH).
    const run = this.gameState.run;
    if (run && run.legIndex > 0) {
      const mult = RunSystem.enemyStatMultiplier(run.legIndex);
      const hp = Math.max(1, Math.floor(activeBoss.maxHp * mult));
      activeBoss.currentHp = hp;
      activeBoss.maxHp     = hp;
      activeBoss.stats     = {
        ...activeBoss.stats,
        baseHp:       hp,
        baseAtk:      Math.max(1, Math.floor(activeBoss.stats.baseAtk      * mult)),
        baseMagicAtk: Math.max(1, Math.floor(activeBoss.stats.baseMagicAtk * mult)),
      };
    }
    bossSprite.name = activeBoss.instanceId;
    this.activeEnemies.set(activeBoss.instanceId, activeBoss);
    this.enemies.add(bossSprite);

    const bossContentTopGap = bossFit ? bossDispSize / 2 - bossFit.offsetY : bossDispSize / 2;
    const bossBarW = 72;
    const bossBarY = by - bossContentTopGap - 12;
    const bossBg = this.add.rectangle(bx, bossBarY, bossBarW, 8, 0x220000).setDepth(8);
    const bossFg = this.add.rectangle(bx - bossBarW / 2, bossBarY, bossBarW, 6, 0xffd700)
      .setDepth(9).setOrigin(0, 0.5);
    this.enemyHpBars.set(activeBoss.instanceId, { bg: bossBg, bar: bossFg, baseW: bossBarW });

    const crown = this.add.text(bx, by - bossContentTopGap - 20, '* BOSS *', {
      fontSize: '10px', color: '#ffd700', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(10);
    this.enemyCrowns.set(activeBoss.instanceId, crown);

    this.time.delayedCall(1500, () => {
      this.showBossAnnouncement(bossDef.name, zone.element as ElementType);
    });
  }

  private createNPCsForZone(zoneId: string) {
    this.npcs = this.physics.add.staticGroup();

    // Combine layout-defined NPCs with zone NPCs from data
    const layoutNpcs = this.layout.npcs;
    const dataNpcs   = Object.values(NPC_MAP).filter(n => n.location === zoneId);

    // Build position map: layout positions take priority
    const posMap: Record<string, { x: number; y: number }> = {};
    for (const p of layoutNpcs) { posMap[p.id] = { x: p.x, y: p.y }; }

    // For data NPCs without a layout position, skip if we're not in grievy_town (too many zones)
    const npcsToRender = zoneId === 'grievy_town'
      ? dataNpcs
      : dataNpcs.filter(n => posMap[n.id]);

    for (const npc of npcsToRender) {
      const pos = posMap[npc.id];
      if (!pos) continue;

      // Sprite bitmap réel (ELV Games) si chargé pour ce PNJ, sinon fallback
      // procédural — même principe que createPlayer() (ASSETS_IMPORT_GUIDE.md §7.1).
      // Nécessite un vrai Sprite (pas staticImage, qui ne supporte pas .play()) —
      // this.npcs.create() donne un Sprite à corps statique, immobile mais animable.
      const hasRealSprite = this.textures.exists(`npc_${npc.id}_idle`);
      const color = NPC_COLORS[npc.id] ?? 0x44aacc;
      const texKey = `npc_${npc.id}`;
      if (!hasRealSprite) this.ensureTexture(texKey, color);

      // Contenu opaque réel mesuré (le perso ne remplit qu'~35-43% de son cadre natif) —
      // même raison que createPlayer()/createEnemiesForZone() : sinon le PNJ paraît petit
      // et sa hitbox déborde largement de sa silhouette visible.
      const npcBbox = NPC_SPRITE_BBOX[npc.id];
      const npcFit = hasRealSprite && npcBbox ? fitSpriteToContent(npcBbox, 36) : null;
      const npcDispSize = npcFit ? npcFit.dispSize : 28;

      const sprite = this.npcs.create(
        pos.x, pos.y, hasRealSprite ? `npc_${npc.id}_idle` : texKey,
      ) as Phaser.Physics.Arcade.Sprite;
      sprite.setDisplaySize(npcDispSize, npcDispSize);
      sprite.setDepth(4);
      sprite.setData('npcId', npc.id);
      // IMPORTANT : refreshBody() DOIT être appelé AVANT setSize()/setOffset(), pas après.
      // Phaser.Physics.Arcade.StaticBody#refreshBody() appelle updateFromGameObject(),
      // qui écrase width/height/offset du corps avec displayWidth/displayHeight du sprite —
      // tout setSize()/setOffset() appelé avant est donc silencieusement annulé.
      sprite.refreshBody();
      const npcBody = sprite.body as Phaser.Physics.Arcade.StaticBody;
      if (npcFit) {
        npcBody.setSize(npcFit.bodyW, npcFit.bodyH);
        npcBody.setOffset(npcFit.offsetX, npcFit.offsetY);
      } else {
        npcBody.setSize(24, 24);
      }
      if (hasRealSprite) sprite.play(`npc_${npc.id}_idle_down`);

      // Name label above NPC
      const nameLabel = this.add.text(pos.x, pos.y - 22, npc.name, {
        fontSize: '9px', color: '#ffee88', fontFamily: FONT,
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(5);
      this.zoneLabels.push(nameLabel);
      // nearbyNPC est détecté par distance dans update() — pas d'overlap nécessaire
    }
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.skillKeys = {
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      e: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      r: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      f: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F),
    };
    // ESC → ferme l'overlay actif ou ouvre le menu pause
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => {
      if (this.isInDialogue) return;
      // RunBagScene : 'view' (consultatif) se ferme normalement via ESC ; 'pack'/
      // 'extract' sont des écrans BLOQUANTS (packing avant descente, choix
      // post-boss) — ESC n'y fait rien plutôt que d'ouvrir Pause par-dessus
      // (même raison que la touche Inventaire, cf. BLOCKER trouvé en revue).
      if (this.scene.isActive('RunBagScene')) {
        const bag = this.scene.get('RunBagScene') as RunBagScene;
        if (bag.currentMode === 'view') bag.close();
        return;
      }
      // handleEscape() : l'écran a une chance de CONSOMMER l'appui avant qu'on ne
      // le ferme (popup ouvert, champ de recherche non vide → Échap vide d'abord).
      // GameScene est le propriétaire UNIQUE de l'ESC des overlays : un second
      // handler ESC dans la scène overlay la refermerait dans la foulée.
      if (this.scene.isActive('InventoryScene')) {
        const inv = this.scene.get('InventoryScene') as InventoryScene;
        if (inv.handleEscape()) return;
        inv.close(); return;
      }
      if (this.scene.isActive('SkillScene')) {
        const sk = this.scene.get('SkillScene') as SkillScene;
        if (sk.handleEscape()) return;
        sk.close(); return;
      }
      // PityScene n'a pas de handleEscape() (pas de champ de recherche/popup à
      // consommer avant de fermer) — close() direct.
      if (this.scene.isActive('PityScene')) { (this.scene.get('PityScene') as PityScene).close(); return; }
      // Bestiaire/Arsenal sont toujours ouverts depuis PauseScene (mise en pause
      // dessous) — leur propre close() sait la reprendre correctement, contrairement
      // à un setPaused(false) qui la laisserait bloquée en pause indéfiniment.
      if (this.scene.isActive('BestiaryScene')) {
        const bes = this.scene.get('BestiaryScene') as BestiaryScene;
        if (bes.handleEscape()) return;
        bes.close(); return;
      }
      if (this.scene.isActive('ArsenalScene')) {
        const ars = this.scene.get('ArsenalScene') as ArsenalScene;
        if (ars.handleEscape()) return;
        ars.close(); return;
      }
      if (!this.scene.isActive('PauseScene')) {
        this.setPaused(true);
        this.scene.launch('PauseScene', { gameScene: this });
      }
    });
    // Clic gauche souris → interaction uniquement (NPC / lootable)
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (!ptr.leftButtonDown() || this.menuOpen || this.isInDialogue) return;
      if (this.nearbyNPC) { this.startNPCDialogue(this.nearbyNPC); return; }
      if (this.nearbyLootable) { this.interactWithLootable(this.nearbyLootable); return; }
    });
    // Debug: hold B to move at 5× speed
    this.speedBoostKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    // Debug: press G to add one of every gear item (weapon/armor/accessory) to the inventory (asset-review aid)
    this.giveAllWeaponsKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.G);
    // Debug: press T to toggle the training dummies flag (loot stat rolls test aid)
    this.toggleDummiesKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    // Debug: press M to fast-forward the 3 pity counters near their guarantee (playtest aid)
    this.advancePityKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    // Debug: press N to equip one of every gear slot directly + empty the bag (loot-pickup test aid)
    this.fullLoadoutKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.N);
    // Debug: press P to grant 20 talent points (talent unlock test aid)
    this.givePointsKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    // Debug: press Y to spawn FIRE/ICE/LIGHTNING enemies + a boss around the player
    this.spawnTestEnemiesKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Y);
    // Debug: press U to open the run-start packing screen directly (RunSystem test aid)
    this.startRunDebugKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.U);
    // Remaining keys (attack, dash, inventory, skill menu, skill slots)
    // are all wired by applyKeyBindings() called right after setupInput().
  }

  private setupCamera() {
    // Le canvas est passé de 800×600 à 960×720 pour donner de l'air à l'UI (le texte
    // pixel est en 14 px et n'avait plus d'exutoire — cf. main.ts). Sans compensation,
    // la caméra montrerait 20 % de monde en plus et les sprites paraîtraient plus
    // petits : le gamefeel (inertie, dash, portée des armes, lisibilité des ennemis)
    // aurait changé alors qu'il est validé.
    //
    // 960/800 = 1,2 exactement. À ce zoom, la caméra recadre sur 800×600 unités de
    // monde : zone visible et taille apparente des sprites RIGOUREUSEMENT identiques
    // à avant. Seules les scènes d'UI (caméra à zoom 1) profitent des pixels gagnés.
    this.cameras.main.setZoom(WORLD_CAMERA_ZOOM);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    // Bounds already set in drawZoneMap
  }

  private setupPhysics() {
    this.physicsColliders = [
      this.physics.add.collider(this.player, this.wallGroup),
      this.physics.add.collider(this.enemies, this.wallGroup),
      this.physics.add.collider(this.player, this.npcs),
      this.physics.add.collider(this.player, this.enemies),
    ];
  }

  // ── XP ORBS ─────────────────────────────────────────────────

  private createXpOrbsGroup() {
    if (!this.textures.exists('xp_orb')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false } as any);
      g.fillStyle(0x88ffee);
      g.fillCircle(5, 5, 5);
      g.generateTexture('xp_orb', 10, 10);
      g.destroy();
    }

    this.xpOrbs = this.physics.add.group();
    this.xpOrbOverlap = this.physics.add.overlap(this.player, this.xpOrbs, (_p, orb) => {
      const sprite = orb as Phaser.Physics.Arcade.Sprite;
      const xpValue = sprite.getData('xpValue') as number ?? 1;
      sprite.destroy();
      const { leveled, newLevel } = ProgressionSystem.addXp(this.gameState.player, xpValue);
      if (leveled) this.events.emit('level_up', newLevel);
      this.events.emit('player_update', this.gameState.player);
    });
  }

  private spawnXpOrbs(x: number, y: number, totalXp: number) {
    const orbCount = Math.min(8, Math.max(1, Math.floor(totalXp / 20)));
    const xpPerOrb = Math.floor(totalXp / orbCount);

    for (let i = 0; i < orbCount; i++) {
      const ox = x + Phaser.Math.Between(-20, 20);
      const oy = y + Phaser.Math.Between(-20, 20);
      const orb = this.physics.add.sprite(ox, oy, 'xp_orb');
      orb.setDepth(3);
      orb.setDisplaySize(10, 10);
      orb.setData('xpValue', xpPerOrb);
      orb.setData('attracting', false);
      (orb.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      this.xpOrbs.add(orb);
    }
  }

  private tickXpOrbs() {
    this.xpOrbs.children.getArray().forEach((go: Phaser.GameObjects.GameObject) => {
      const sprite = go as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (dist < this.XP_ATTRACT_RANGE) {
        sprite.setData('attracting', true);
        const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
        const speed = Math.min(200, 80 + (this.XP_ATTRACT_RANGE - dist) * 2);
        (sprite.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      } else if (!sprite.getData('attracting')) {
        (sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    });
  }

  // ── LOOTABLES ────────────────────────────────────────────────

  private readonly LOOTABLE_COLORS: Record<LootableObject['type'], number> = {
    chest:   0xddaa44,
    plant:   0x44aa44,
    mineral: 0x8888cc,
    shrine:  0xddaaff,
  };

  private createLootables() {
    this.lootableGroup = this.physics.add.staticGroup();
    for (const lo of this.layout.lootables) {
      if (this.lootableLooted.has(lo.id)) continue;
      const key = `loot_${lo.type}`;
      this.ensureTexture(key, this.LOOTABLE_COLORS[lo.type], 20, 20);
      const sprite = this.physics.add.staticImage(lo.x, lo.y, key);
      sprite.setDisplaySize(20, 20);
      sprite.setName(lo.id);
      sprite.setDepth(3);
      (sprite.body as Phaser.Physics.Arcade.StaticBody).setSize(20, 20);
      sprite.refreshBody();
      this.lootableGroup.add(sprite);

      const firstItem  = lo.itemPool[0] ? ALL_ITEMS[lo.itemPool[0]] : null;
      const labelText  = (lo.type === 'mineral' || lo.type === 'plant') && firstItem
        ? localizeItem(firstItem).name
        : t(`notif.loot_${lo.type}` as const);
      const lootLabel = this.add.text(lo.x, lo.y - 16, labelText, {
        fontSize: '8px', color: '#ffeeaa', fontFamily: FONT,
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(4);
      this.zoneLabels.push(lootLabel);
      // Référencé sur le sprite pour être détruit avec lui dans interactWithLootable
      // (bug reporté : le texte au sol restait affiché après ramassage).
      sprite.setData('label', lootLabel);
    }

    // Proximité par distance (voir update()) — pas de physics.add.overlap ici :
    // ratait des frames par intermittence avec les colliders (clignotement de
    // l'indice + F parfois ignoré, même défaut déjà corrigé pour les PNJ).
  }

  private interactWithLootable(lootableId: string) {
    const lo = this.layout.lootables.find(l => l.id === lootableId);
    if (!lo) return;

    this.lootableLooted.add(lootableId);

    // Find and destroy the sprite + son label au sol (bug reporté : le texte
    // restait affiché après ramassage car seul le sprite était détruit ici).
    const sprite = this.lootableGroup.getChildren().find(
      (c) => (c as Phaser.Physics.Arcade.Image).name === lootableId,
    ) as Phaser.Physics.Arcade.Image | undefined;
    if (sprite) {
      const label = sprite.getData('label') as Phaser.GameObjects.Text | undefined;
      if (label) {
        label.destroy();
        this.zoneLabels = this.zoneLabels.filter(l => l !== label);
      }
      sprite.destroy();
    }
    this.nearbyLootable = null;

    // Gold reward
    const gold = lo.goldMin !== undefined
      ? Phaser.Math.Between(lo.goldMin, lo.goldMax ?? lo.goldMin)
      : 0;
    if (gold > 0) this.gameState.player.gold += gold;

    // Item reward (1 random from pool)
    if (lo.itemPool.length > 0) {
      const itemId  = lo.itemPool[Math.floor(Math.random() * lo.itemPool.length)];
      const template = ALL_ITEMS[itemId];
      // StatRollSystem.rollItem est un no-op sûr pour les items non équipables/sans
      // equipRanges — sûr à appeler inconditionnellement (cf. LootSystem.rollLoot).
      const item = template ? StatRollSystem.rollItem(template, 0) : undefined;
      if (item) {
        LootSystem.addToInventory(this.gameState.player, item, 1, this.gameState.world);
        this.events.emit('item_looted', { item, quantity: 1 });
        const typeKey = `notif.loot_${lo.type}` as const;
        // Un Common à Résonance notable (Vibrante+) déclenche déjà sa propre
        // notification enrichie via item_looted (nom + % + scintillement) —
        // répéter le nom ici empilerait deux popups pour un seul ramassage.
        // On garde uniquement la mention d'or, s'il y en a.
        const skipItemName = item.rarity === ItemRarity.COMMON
          && typeof item.rollQuality === 'number' && StatRollSystem.isNotableResonance(item.rollQuality);
        const itemPart = skipItemName ? '' : ` ${localizeItem(item).name}`;
        this.events.emit('show_notification', `${t(typeKey)}${itemPart}${gold > 0 ? ` +${gold}G` : ''}`);
      } else if (gold > 0) {
        this.events.emit('show_notification', t('notif.gold').replace('{gold}', String(gold)));
      }
    } else if (gold > 0) {
      this.events.emit('show_notification', t('notif.gold').replace('{gold}', String(gold)));
    }

    // Shrine: restore some HP/Mana
    if (lo.type === 'shrine') {
      this.gameState.player.stats.hp   = Math.min(this.gameState.player.stats.maxHp,   this.gameState.player.stats.hp   + Math.floor(this.gameState.player.stats.maxHp   * 0.3));
      this.gameState.player.stats.mana = Math.min(this.gameState.player.stats.maxMana, this.gameState.player.stats.mana + Math.floor(this.gameState.player.stats.maxMana * 0.3));
    }

    this.events.emit('player_update', this.gameState.player);

    const completions = QuestSystem.onItemCollected(this.gameState.player, lo.id, 1, this.gameState.world);
    if (completions.length > 0) this.handleQuestCompletions(completions);
  }

  // ── ZONE TRAVEL ──────────────────────────────────────────────

  travelToZone(zoneId: string, targetX = 200, targetY = 200) {
    if (this.isTraveling) return;
    const zone = ZONE_MAP[zoneId];
    if (!zone) return;

    this.isTraveling = true;
    SaveSystem.save(this.gameState, this.gameState.saveSlot);

    if (this.player?.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }

    // Pause physics immediately so no step runs on objects we're about to destroy
    this.physics.world.pause();

    for (const key of ['PauseScene', 'InventoryScene', 'SkillScene', 'DialogueScene', 'ShopScene']) {
      if (this.scene.isActive(key) || this.scene.isPaused(key)) {
        try { this.scene.stop(key); } catch (_) {}
      }
    }

    // FADE_OUT_COMPLETE fires exactly once, outside Phaser's render cycle.
    // delayedCall(0) defers to the next tick so we are fully clear of all
    // camera/physics internal state before touching any game objects.
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => { this.time.delayedCall(0, () => this.performZoneTransition(zoneId, targetX, targetY)); },
    );
    this.cameras.main.fade(400, 0, 0, 0);
  }

  private destroyCurrentZoneObjects() {
    // Reset iframes — pas de clignotement résiduel après une transition de zone
    this.iframeUntil = 0;
    if (this.player?.active) this.player.setAlpha(1);
    // Écho : changement de zone = reset dur SILENCIEUX, jamais l'animation de
    // libération (celle-ci n'a de sens que pour une expiration naturelle).
    this.destroyEchoImmediate();
    // Statuts/knockback subis (talents Partie 2) — un SLOW/BURN ne doit pas
    // traverser une transition de zone.
    this.playerStatusEffects = [];
    this.playerSlowMult      = 1;
    this.playerImmobilized   = false;
    this.knockbackX          = 0;
    this.knockbackY          = 0;
    // PRESERVED (glacius_deep_patience) — réarmé dans buildZone() UNIQUEMENT sur
    // un vrai changement de zone, PAS ici : cette fonction tourne aussi au respawn
    // sur place (même zoneId), qui ne doit pas réarmer le talent (cf. buildZone).

    // Destroy all tracked physics colliders/overlaps individually
    for (const c of this.physicsColliders) c.destroy();
    this.physicsColliders = [];
    for (const o of this.teleportOverlaps) o.destroy();
    this.teleportOverlaps = [];
    this.safePositionBuffer = [];
    if (this.xpOrbOverlap) { this.xpOrbOverlap.destroy(); this.xpOrbOverlap = null; }
    if (this.projectileCollider) { this.projectileCollider.destroy(); this.projectileCollider = null; }

    // Projectiles group (skill/enemy projectiles)
    if (this.projectiles) { this.projectiles.destroy(true); }
    // Flèches en vol — détruire les rectangles de collision et vider le tableau
    for (const arrow of this._activeArrows) {
      if (arrow.rect.active) arrow.rect.destroy();
    }
    this._activeArrows = [];
    // Homing projectiles — destroy orbs and halos
    for (const h of this._homingProjectiles) {
      if (h.sprite.active) h.sprite.destroy();
      if (h.halo.active)   h.halo.destroy();
    }
    this._homingProjectiles = [];
    // STAFF_FINISHER_ZONE — une zone laissée au sol ne doit pas traverser une
    // transition de zone (coordonnées locales à l'ancienne zone, cercle orphelin).
    for (const z of this._finisherZones) { if (z.gfx.active) z.gfx.destroy(); }
    this._finisherZones = [];
    this.weaponProjectiles?.clear(true, true);

    // Zone graphics (map background, paths, walls, teleport highlights)
    if (this.zoneGraphics) {
      this.zoneGraphics.destroy();
      this.zoneGraphics = null;
    }
    for (const ts of this.zoneTileSprites) ts.destroy();
    this.zoneTileSprites = [];

    // Text labels (teleport labels, NPC names, lootable type labels)
    for (const label of this.zoneLabels) label.destroy();
    this.zoneLabels = [];

    // Teleport static images
    for (const img of this.teleportZoneImages) img.destroy();
    this.teleportZoneImages = [];


    // Enemies — destroy HP bars and crowns first, then sprites
    this.enemyHpBars.forEach(({ bg, bar }) => { bg.destroy(); bar.destroy(); });
    this.enemyHpBars.clear();
    this.enemyCrowns.forEach(crown => crown.destroy());
    this.enemyCrowns.clear();
    this.activeEnemies.clear();
    // Marque de Magma : les stacks sont indexés par instance ennemie — les vider avec
    // les ennemis (sinon fuite d'une entrée par ennemi vivant à chaque transition).
    this.magmaBurnStacks.clear();
    this.enemies.destroy(true);

    // BUG 4 fix: purge orphaned enemy cooldown keys to prevent unbounded dict growth
    // (inclut magma_${id}/burn_${id}, ajoutés respectivement avec la Marque de
    // Magma et le tick BURN — même garde-fou).
    for (const key of Object.keys(this.cooldowns)) {
      if (key.startsWith('atkcd_') || key.startsWith('melee_') || key.startsWith('bleed_') || key.startsWith('magma_') || key.startsWith('burn_')) {
        delete this.cooldowns[key];
      }
    }

    // NPCs
    this.npcs.destroy(true);

    // Wall group
    this.wallGroup.destroy(true);

    // Lootables — do NOT reset lootableLooted (persists between transitions)
    this.lootableGroup.destroy(true);

    // XP orbs — destroy remaining orbs
    this.xpOrbs.destroy(true);

    // Boss death VFX objects (aura, nameLabel) — may outlive zone transition
    for (const o of this.bossDeathObjects) { if (o.active) o.destroy(); }
    this.bossDeathObjects = [];
  }

  /**
   * Entrée en zone. Les sprites de la zone cible sont garantis présents AVANT de
   * reconstruire quoi que ce soit (cf. EnemyAssets.ensureEnemyAssets) : sans ce
   * verrou, createEnemiesForZone() ne trouverait pas `enemy_X_idle` et retomberait
   * sur les carrés procéduraux.
   *
   * L'attente est gratuite en termes de gamefeel : on est déjà sous le fondu au
   * noir de travelToZone(), la physique est en pause et update() sort immédiatement
   * tant que `isTraveling` est vrai — rien ne tourne pendant le chargement. Et sur
   * une zone déjà visitée, le rappel est SYNCHRONE (tout est en cache).
   */
  private performZoneTransition(zoneId: string, targetX: number, targetY: number) {
    const loadingLabel = this.showZoneLoadingLabel();
    ensureEnemyAssets(this, enemyIdsForZone(zoneId), () => {
      loadingLabel.destroy();
      // La scène a pu être arrêtée pendant le chargement (retour au menu principal) :
      // reconstruire une zone sur une scène morte planterait sur des refs détruites.
      if (!this.scene.isActive()) return;
      this.buildZone(zoneId, targetX, targetY);
    });
  }

  /**
   * Indicateur discret pendant le chargement d'une zone jamais visitée.
   *
   * Créé AVANT ensureEnemyAssets et détruit dans son rappel : sur une zone déjà en
   * cache le rappel est synchrone, le label naît et meurt dans la même frame et
   * n'est donc jamais rendu. Il n'apparaît que quand il y a réellement à attendre.
   * Pas de i18n ici : aucune clé `common.loading` n'existe et `t()` renverrait la
   * clé brute à l'écran.
   */
  private showZoneLoadingLabel(): Phaser.GameObjects.Text {
    const { width: W, height: H } = this.cameras.main;
    return this.add.text(W / 2, H - 40, 'Chargement de la zone...', uiStyle(12, '#cccccc', { stroke: true }))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000);
  }

  /**
   * Résout la source de ZoneLayout pour `zoneId` et met à jour this.layout/
   * this.currentGeneratedMap en conséquence — toujours réassignés ENSEMBLE, jamais
   * désynchronisés. Renvoie true si une carte de run a été générée.
   *
   * Point de passage UNIQUE, appelé à la fois par create() (bootstrap initial —
   * y compris après un rechargement de save en pleine run, cf. autosave 180s) et
   * buildZone() (transitions). Coexiste avec l'ancien réseau de téléports
   * statiques vers ignis_reach tant que le teardown n'est pas fait — d'où le test
   * explicite sur run.active plutôt que sur zoneId seul.
   */
  private resolveZoneLayout(zoneId: string): boolean {
    // Run active mais on résout une zone HORS dungeon (`ignis_reach`) : soit le
    // réseau de téléports legacy a été emprunté pour revenir en ville sans
    // passer par "S'exfiltrer"/la mort (les deux seuls chemins qui nettoient
    // `run` normalement), soit une sauvegarde a figé cet état incohérent (bug
    // trouvé en playtest 19/07 — charger une save laissait `run.active` vrai
    // alors que le joueur était en ville, donc la touche Inventaire rouvrait le
    // sac de run limité au lieu de la banque). Aucun chemin propre ne permet de
    // reprendre cette run depuis une zone hors dungeon — on la clôture ici,
    // au point de passage unique de toute résolution de zone, pour que
    // l'incohérence ne puisse plus jamais persister (ni en session, ni via une
    // sauvegarde qui la figerait à nouveau).
    if (this.gameState.run?.active && zoneId !== 'ignis_reach') {
      this.gameState.run = null;
      // delayedCall(0) : ce garde-fou tourne aussi au tout premier appel de
      // resolveZoneLayout() dans create() (bootstrap après chargement d'une
      // save) — à ce stade UIScene n'a pas encore lancé son create()
      // (scene.launch('UIScene', ...) vient après), donc rien n'écoute encore
      // 'show_notification' : le message se perdrait silencieusement dans
      // EXACTEMENT le scénario que ce correctif cible. Même patron que
      // 'zone_entered' un peu plus haut dans ce fichier.
      this.time.delayedCall(0, () =>
        this.events.emit('show_notification', 'Run abandonnée (retour en zone sûre) — sac de run perdu'));
    }
    const run = this.gameState.run;
    const isRunZone = !!run?.active && zoneId === 'ignis_reach';
    if (isRunZone) {
      this.currentGeneratedMap = generateZoneLayout(run!.seed, run!.legIndex, DEFAULT_IGNIS_PARAMS);
      this.layout = this.currentGeneratedMap.layout;
    } else {
      this.currentGeneratedMap = null;
      this.layout = getZoneLayout(zoneId);
    }
    return isRunZone;
  }

  private buildZone(zoneId: string, targetX: number, targetY: number) {
    try {
    // PRESERVED (glacius_deep_patience) — « 1 fois par ZONE » : buildZone est
    // aussi le chemin de RESPAWN sur place (onPlayerDeath → performZoneTransition
    // avec le même zoneId) — sans cette garde, mourir réarmerait le talent à
    // chaque mort au lieu d'une seule fois par vraie visite de zone (bug trouvé
    // en review, le talent devenait "1 fois par vie" au lieu de "par zone").
    if (zoneId !== this.gameState.player.currentZone) this.preservedUsedThisZone = false;
    this.gameState.player.currentZone = zoneId;
    this.gameState.player.position    = { x: targetX, y: targetY };

    const isRunZone = this.resolveZoneLayout(zoneId);

    this.destroyCurrentZoneObjects();

    const spawnX = targetX > 0 ? targetX : this.layout.spawnX;
    const spawnY = targetY > 0 ? targetY : this.layout.spawnY;
    this.player.setPosition(spawnX, spawnY);
    (this.player.body as Phaser.Physics.Arcade.Body).reset(spawnX, spawnY);

    this.nearbyNPC      = null;
    this.nearbyLootable = null;

    this.drawZoneMap();
    if (isRunZone && this.currentGeneratedMap) {
      this.spawnRunEnemies(zoneId, this.gameState.run!, this.currentGeneratedMap);
    } else {
      this.createEnemiesForZone(zoneId);
    }
    this.createNPCsForZone(zoneId);
    this.createTeleportOverlaps();
    this.createLootables();
    this.createXpOrbsGroup();
    this.setupCamera();
    this.setupPhysics();
    this.createProjectileGroup();

    // Physics was paused in travelToZone/onPlayerDeath — safe to resume now
    this.physics.world.resume();
    // isTraveling stays true here — cleared in FADE_IN_COMPLETE (300ms later).
    // Clearing it early lets teleport overlaps fire on the very next physics step,
    // which immediately triggers another fade-out and causes the black-screen loop.

    this.events.emit('player_update', this.gameState.player);

    const zone = ZONE_MAP[zoneId];
    if (zone) {
      const completed = QuestSystem.onZoneEntered(this.gameState.player, zoneId, this.gameState.world);
      if (completed.length > 0) this.handleQuestCompletions(completed);
      this.applyWorldDegradation();
      this.events.emit('zone_entered', zone);
    }

    // cameras.main.fade() leaves a persistent black overlay (alpha=1) even after
    // FADE_OUT_COMPLETE fires. fadeIn() reverses the effect properly.
    // isTraveling is cleared only once the fade-in completes so teleport overlaps
    // cannot retrigger while the screen is still animating in.
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
      () => { this.isTraveling = false; },
    );
    this.cameras.main.fadeIn(300, 0, 0, 0);

    } catch (err) {
      console.error('[GameScene] performZoneTransition threw:', err);
      try { this.physics.world.resume(); } catch (_) {}
      this.isTraveling = false;
      this.cameras.main.fadeIn(300, 0, 0, 0);
    }
  }

  // ── COMBO FINISHER ──────────────────────────────────────────

  /**
   * Déclenche le finisher : fires chaque hit avec son délai, puis applique les
   * effets spéciaux (stun, knockback, statuts). Émet 'finisher-executed'.
   * Stub VFX séparé — implémenté par le gamefeel-agent.
   */
  private executeFinisherAttack(
    weaponType: WeaponType | undefined,
    pattern: AttackPattern,
    comboConfig: ComboConfig,
    _now: number,
    aspd = 1,
  ) {
    // Le finisher se compresse comme le reste : mêmes planchers (windup 50%,
    // délai 60 ms). Sinon un joueur rapide verrait son finisher — le coup qu'il a
    // travaillé toute la chaîne pour obtenir — rester à la vitesse d'un joueur lent.
    const windupMs = effectiveWindupMs(pattern, aspd);
    const finisher = comboConfig.finisher;
    const delayOf  = (d: number) => effectiveHitDelayMs(d, aspd);

    // Une transition de zone déjà en cours au moment du cast (mort par DOT, téléport)
    // annulerait de toute façon tous les hits différés plus bas (chacun gardé par
    // isTraveling) — autant ne pas prélever le coût de sacrificeFinisher pour rien.
    if (this.isTraveling) return;

    // BLOCKER-E: heavyFinisherBonus multiplie le damageMultiplier pour GS/HAMMER/AXE
    const isHeavyWeapon = weaponType === WeaponType.GREATSWORD
      || weaponType === WeaponType.HAMMER
      || weaponType === WeaponType.AXE;
    const heavyFinisherFactor = isHeavyWeapon
      ? (1 + this.playerModifiers.heavyFinisherBonus / 100)
      : 1.0;

    // SACRIFICE_FINISHER (ten_malchar_blessing, NG+) — consume 20% HP max au CAST
    // (pas au timing du dernier coup : le joueur paie même si la cible meurt avant),
    // DOUBLE les dégâts de TOUS les coups du finisher. Plancher à 1 HP — un finisher
    // ne doit jamais tuer son propre lanceur.
    // Passage balance-agent (fin du chantier talents Partie 2) : ×3 mesurait +72%
    // DPS solo pour 20% HP/finisher (BP/pt=4,00, 4× la référence "juste" du
    // projet) et faisait tomber le boss final à 8-15s — sous le temps minimum
    // pour qu'il délivre ne serait-ce que 2 cycles de pattern. Ramené à ×2.
    const sacrificeFinisher = this.playerModifiers.sacrificeFinisher;
    const sacrificeFactor = sacrificeFinisher ? 2 : 1;
    if (sacrificeFinisher) {
      const p = this.gameState.player;
      const cost = Math.max(1, Math.round(p.stats.maxHp * 0.20));
      p.stats.hp = Math.max(1, p.stats.hp - cost);
      this.showDamageNumber(this.player.x, this.player.y - 20, cost, false, undefined, true);
    }

    if (pattern.isProjectile) {
      // BOW finisher : projectiles en éventail via le système existant. Seul BOW
      // passe par cette branche — le pattern de base de STAFF (ATTACK_PATTERNS,
      // partagé avec son attaque normale) n'a PAS isProjectile:true, son finisher
      // est un cône (cf. combos.ts, effect.pierceCount 99) : branche `else` ci-dessous.
      // BUG4 fix: passe le damageMultiplier de chaque hit à fireArrowProjectile.
      if (windupMs > 0) this.spawnWindupVfx(windupMs);
      finisher.hits.forEach(hit => {
        this.time.delayedCall(windupMs + delayOf(hit.delay), () => {
          if (this.isTraveling) return;
          this.fireArrowProjectile(hit.damageMultiplier * sacrificeFactor);
        });
      });
    } else {
      if (windupMs > 0) this.spawnWindupVfx(windupMs);
      finisher.hits.forEach((hit, hitIndex) => {
        const effectiveDmgMult = hit.damageMultiplier * heavyFinisherFactor * sacrificeFactor;
        const fireAt = windupMs + delayOf(hit.delay);
        const doHit = () => {
          if (this.isTraveling) return;
          const tx = this.player.x + Math.cos(this.facingAngle) * hit.range * 0.7;
          const ty = this.player.y + Math.sin(this.facingAngle) * hit.range * 0.7;
          this.spawnWeaponSwingVfx(this.player.x, this.player.y, tx, ty, weaponType, hitIndex, aspd);
          this.executeHitInCone(hit.range, hit.halfArc, effectiveDmgMult);
        };
        if (fireAt === 0) doHit();
        else this.time.delayedCall(fireAt, doHit);
      });
    }

    // Effets spéciaux — appliqués au timing du dernier hit
    if (finisher.effect) {
      const lastHit  = finisher.hits[finisher.hits.length - 1];
      const effectAt = windupMs + delayOf(lastHit?.delay ?? 0);
      const effect   = finisher.effect;

      const applyEffect = () => {
        if (this.isTraveling) return;
        const range   = lastHit?.range   ?? 130;
        const halfArc = lastHit?.halfArc ?? Math.PI;
        const sprites = this.findEnemiesInCone(range, halfArc);

        for (const sprite of sprites) {
          const ae = this.activeEnemies.get(sprite.name);
          if (!ae || ae.currentHp <= 0) continue;

          if (effect.stunMs)   this.applyStun(sprite, effect.stunMs);
          if (effect.knockback) this.applyKnockback(sprite, effect.knockback);

          if (effect.expose) {
            // Expose : −15% DEF, 2s. Non-cumulable avec Sunder : garder le plus fort.
            const str = 15;
            const existing = ae.statusEffects.find(e => e.type === 'EXPOSE');
            if (!existing || existing.strength < str) {
              ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'EXPOSE');
              ae.statusEffects.push({ type: 'EXPOSE', duration: 2, strength: str });
            }
          }
          if (effect.sunder) {
            // Sunder : −20% DEF, 4s. Représenté via le type EXPOSE (plus fort, prioritaire).
            const str = 20;
            const existing = ae.statusEffects.find(e => e.type === 'EXPOSE');
            if (!existing || existing.strength < str) {
              ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'EXPOSE');
              ae.statusEffects.push({ type: 'EXPOSE', duration: 4, strength: str });
            }
          }
          {
            // Bleed : base (DUAL_SWORD, 10% ATK/s, 2s) OU ins_lacerate sur DAGGER/DUAL_DAGGER/DUAL_SWORD (30% ATK, 3s).
            // ins_lacerate s'applique même quand le finisher de base n'a pas effect.bleed.
            const isLightBleedWeapon = weaponType === WeaponType.DAGGER
              || weaponType === WeaponType.DUAL_DAGGER
              || weaponType === WeaponType.DUAL_SWORD;
            const useLacerate = this.playerModifiers.lightFinisherBleed && isLightBleedWeapon;
            if (effect.bleed || useLacerate) {
              const bleedStr = Math.max(1, Math.floor(
                this.gameState.player.stats.atk * (useLacerate ? 0.30 : 0.10),
              ));
              const bleedDur = useLacerate ? 3 : 2;
              ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'BLEED');
              ae.statusEffects.push({ type: 'BLEED', duration: bleedDur, strength: bleedStr });
            }
          }
        }

        // Garde (Sword finisher) : −30% dégâts subis pendant guardMs.
        // La réduction effective est appliquée dans tickEnemyAI via guardUntil.
        if (effect.guardMs) {
          this.guardUntil = this.time.now + effect.guardMs;
        }

        // AoE shake si le finisher a une zone explicite (GREATSWORD, HAMMER)
        if (effect.aoeRadius) {
          this.requestShake(150, 0.010, GameScene.SHAKE_PRIO.FINISHER);
        }
      };

      if (effectAt === 0) applyEffect();
      else this.time.delayedCall(effectAt, applyEffect);
    }

    // Effets spéciaux des TALENTS (Partie 2, Phase 2) — universels : tout finisher,
    // quelle que soit l'arme, les déclenche si le nœud est débloqué. Indépendants de
    // comboConfig.finisher.effect (au-dessus), qui est spécifique à l'arme et peut
    // être absent. SACRIFICE_FINISHER (coût payé au cast) est géré ailleurs dans
    // cette fonction.
    const mods = this.playerModifiers;
    const hasTalentFx = mods.finisherNova || mods.burnOnFinisher || mods.freezeOnFinisher
      || mods.cycloneFinisher || mods.quakeFinisher || mods.chainFinisher || mods.guardFinisher
      || (weaponType === WeaponType.STAFF && mods.staffFinisherZone);
    if (hasTalentFx) {
      const lastHit = finisher.hits[finisher.hits.length - 1];
      const talentEffectAt = windupMs + delayOf(lastHit?.delay ?? 0);

      const applyTalentEffects = () => {
        if (this.isTraveling) return;
        const px = this.player.x, py = this.player.y;

        // STAFF_FINISHER_ZONE (arc_elemental_wake) — le finisher STAFF est un cône
        // (combos.ts, pas un projectile — cf. commentaire plus haut), donc le "point
        // d'impact final" est le point visé par le dernier hit, comme le VFX de coup
        // (spawnWeaponSwingVfx) le calcule déjà pour ce même weaponType.
        if (weaponType === WeaponType.STAFF && mods.staffFinisherZone) {
          const range = lastHit?.range ?? 260;
          const tx = px + Math.cos(this.facingAngle) * range * 0.7;
          const ty = py + Math.sin(this.facingAngle) * range * 0.7;
          const zoneElement = this.gameState.player.equipment.weapon?.element ?? ElementType.NEUTRAL;
          this.spawnFinisherZone(tx, ty, zoneElement);
        }

        // BURN_ON_FINISHER / FREEZE_ON_FINISHER — mêmes cibles que effect.stunMs/
        // knockback ci-dessus : cône du dernier coup, proxy déjà établi pour "les
        // ennemis touchés par le finisher".
        if (mods.burnOnFinisher || mods.freezeOnFinisher) {
          const range   = lastHit?.range   ?? 130;
          const halfArc = lastHit?.halfArc ?? Math.PI;
          const atk = this.gameState.player.stats.atk;
          for (const sprite of this.findEnemiesInCone(range, halfArc)) {
            const ae = this.activeEnemies.get(sprite.name);
            if (!ae || ae.currentHp <= 0) continue;
            if (mods.burnOnFinisher) {
              ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'BURN');
              ae.statusEffects.push({ type: 'BURN', duration: 3, strength: Math.max(1, Math.round(atk * 0.3)) });
            }
            if (mods.freezeOnFinisher) {
              ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'FREEZE');
              ae.statusEffects.push({ type: 'FREEZE', duration: 2, strength: 1 });
            }
          }
        }

        // CYCLONE_FINISHER — zone de vent, repousse les ennemis proches (r150).
        if (mods.cycloneFinisher) {
          for (const sprite of this.enemies.getChildren()) {
            const s = sprite as Phaser.Physics.Arcade.Sprite;
            if (!s.active) continue;
            if (Phaser.Math.Distance.Between(px, py, s.x, s.y) > 150) continue;
            this.applyKnockback(s, 220);
          }
        }

        // FINISHER_NOVA — r90 autour du joueur, 60% Magic ATK (STAFF) ou ATK
        // (toute autre arme), élément de l'arme.
        // NB : distance mesurée sur la position RÉELLE du sprite (ActiveEnemy.x/y
        // n'est jamais resynchronisé après le spawn — bug préexistant, cf. rollArcChain/
        // applyKnockbackToPlayer — donc jamais utilisé ici comme source de position).
        // Passage balance-agent (fin du chantier) : scalait sur matk pour TOUTE
        // arme — sur les 9 armes non-STAFF, matk est une stat jamais investie
        // (~18 vs ~254 d'atk sur un build MYTHIC) : contenu mort en pratique.
        // Même garde que CombatSystem.playerAttack (isMagicWeapon).
        if (mods.finisherNova) {
          const csFinisher = StatsSystem.computeAll(this.gameState.player);
          const isMagicWeapon = weaponType === WeaponType.STAFF;
          const dmg = Math.max(1, Math.round((isMagicWeapon ? csFinisher.matk : csFinisher.atk) * 0.60));
          const novaElement = this.gameState.player.equipment.weapon?.element ?? ElementType.NEUTRAL;
          for (const id of Array.from(this.activeEnemies.keys())) {
            const ae = this.activeEnemies.get(id);
            if (!ae || ae.currentHp <= 0) continue;
            const sprite = this.findEnemySpriteByInstanceId(id);
            if (!sprite || Phaser.Math.Distance.Between(px, py, sprite.x, sprite.y) > 90) continue;
            this.showDamageNumber(sprite.x, sprite.y - 20, dmg, false, novaElement);
            this.spawnHitParticles(sprite.x, sprite.y, novaElement);
            this.applyDamageToEnemy(id, dmg, false);
          }
          this.requestShake(150, 0.010, GameScene.SHAKE_PRIO.FINISHER);
        }

        // QUAKE_FINISHER — onde de choc au sol (r100), 40% ATK terre, stagger ×2.
        if (mods.quakeFinisher) {
          const atk = StatsSystem.computeAll(this.gameState.player).atk;
          const dmg = Math.max(1, Math.round(atk * 0.40));
          for (const id of Array.from(this.activeEnemies.keys())) {
            const ae = this.activeEnemies.get(id);
            if (!ae || ae.currentHp <= 0) continue;
            const sprite = this.findEnemySpriteByInstanceId(id);
            if (!sprite || Phaser.Math.Distance.Between(px, py, sprite.x, sprite.y) > 100) continue;
            this.showDamageNumber(sprite.x, sprite.y - 20, dmg, false, ElementType.EARTH);
            this.spawnHitParticles(sprite.x, sprite.y, ElementType.EARTH);
            this.applyDamageToEnemy(id, dmg, false);
            if (ae.currentHp <= 0) continue; // tué par la secousse — pas de stagger sur un cadavre
            this.checkStagger(sprite, ae, dmg * 2);
          }
          this.requestShake(180, 0.012, GameScene.SHAKE_PRIO.FINISHER);
        }

        // CHAIN_FINISHER — éclair en chaîne depuis le joueur, jusqu'à 3 ennemis,
        // 60% Magic ATK (STAFF) ou ATK (toute autre arme) — même correctif que
        // FINISHER_NOVA ci-dessus (matk mort sur les armes non-STAFF).
        if (mods.chainFinisher) {
          const csChain = StatsSystem.computeAll(this.gameState.player);
          const isMagicWeaponChain = weaponType === WeaponType.STAFF;
          const dmg = Math.max(1, Math.round((isMagicWeaponChain ? csChain.matk : csChain.atk) * 0.60));
          const hitIds = new Set<string>();
          let originX = px, originY = py;
          for (let hop = 0; hop < 3; hop++) {
            let nearest: ActiveEnemy | null = null;
            let nearestSprite: Phaser.Physics.Arcade.Sprite | null = null;
            let nearestDist = Infinity;
            for (const other of this.activeEnemies.values()) {
              if (hitIds.has(other.instanceId) || other.currentHp <= 0) continue;
              const s = this.findEnemySpriteByInstanceId(other.instanceId);
              if (!s) continue;
              const d = Phaser.Math.Distance.Between(originX, originY, s.x, s.y);
              if (d < nearestDist) { nearestDist = d; nearest = other; nearestSprite = s; }
            }
            if (!nearest || !nearestSprite || nearestDist > 250) break;
            hitIds.add(nearest.instanceId);
            this.showDamageNumber(nearestSprite.x, nearestSprite.y - 20, dmg, false, ElementType.LIGHTNING);
            this.spawnHitParticles(nearestSprite.x, nearestSprite.y, ElementType.LIGHTNING);
            this.applyDamageToEnemy(nearest.instanceId, dmg, false);
            originX = nearestSprite.x; originY = nearestSprite.y;
          }
        }

        // GUARD_FINISHER — bouclier temporisé 8% HP max, 3s. Partage grantTimedShield
        // (donc le pool) avec LAST_BASTION — le plus généreux gagne sur les deux axes.
        if (mods.guardFinisher) {
          this.grantTimedShield(Math.round(this.gameState.player.stats.maxHp * 0.08), 3000);
        }
      };

      if (talentEffectAt === 0) applyTalentEffects();
      else this.time.delayedCall(talentEffectAt, applyTalentEffects);
    }

    this.spawnFinisherVfx(weaponType, this.facingAngle);
    this.events.emit('finisher-executed', { weaponType });
  }

  /** Applique un stun à un ennemi. Ne se cumule pas — garde la durée la plus longue. */
  private applyStun(sprite: Phaser.Physics.Arcade.Sprite, stunMs: number) {
    const ae = this.activeEnemies.get(sprite.name);
    if (!ae) return;
    const durationSecs = stunMs / 1000;
    const existing = ae.statusEffects.find(e => e.type === 'STUN');
    if (existing) {
      existing.duration = Math.max(existing.duration, durationSecs);
    } else {
      ae.statusEffects.push({ type: 'STUN', duration: durationSecs, strength: 1 });
    }
    const body = sprite.body as Phaser.Physics.Arcade.Body | null;
    if (body?.enable) body.setVelocity(0, 0);
  }

  /** Projette un ennemi à partir de la position joueur avec la force donnée (px/s). */
  private applyKnockback(sprite: Phaser.Physics.Arcade.Sprite, force: number) {
    const body = sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body?.enable) return;
    const angle = Math.atan2(sprite.y - this.player.y, sprite.x - this.player.x);
    body.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
  }

  // ── ALT ATTACK SYSTEM ────────────────────────────────────────
  // H key triggers the weapon-specific alternate attack.
  // All VFX use violet/magenta palette to distinguish from the normal blue/cyan swings.

  private performAltAttack() {
    const now = this.time.now;
    if (now < this.altAttackCooldownUntil) return;

    const weaponType = this.gameState.player.equipment.weapon?.weaponType;
    const config = (weaponType !== undefined ? ALT_ATTACK_CONFIGS[weaponType] : undefined)
      ?? FISTS_ALT_CONFIG;

    this.altAttackCooldownUntil = now + config.cooldownMs;

    switch (weaponType) {
      case WeaponType.SWORD:       this.performAltSword(config);      break;
      case WeaponType.GREATSWORD:  this.performAltGreatsword(config); break;
      case WeaponType.DAGGER:      this.performAltDagger(config);     break;
      case WeaponType.DUAL_DAGGER: this.performAltDualDagger(config); break;
      case WeaponType.DUAL_SWORD:  this.performAltDualSword(config);  break;
      case WeaponType.AXE:         this.performAltAxe(config);        break;
      case WeaponType.HAMMER:      this.performAltHammer(config);     break;
      case WeaponType.STAFF:       this.performAltStaff(config);      break;
      case WeaponType.BOW:         this.performAltBow(config);        break;
      case WeaponType.SPEAR:       this.performAltSpear(config);      break;
      default:                      this.performAltFists(config);      break;
    }
  }

  // SPEAR — Percée : charge en avant, embroche TOUT ce qui est aligné (cône très
  // étroit mais très long) et repousse. C'est le pendant offensif de l'allonge :
  // la lance ne contrôle pas une zone, elle contrôle une LIGNE.
  private performAltSpear(config: AltAttackConfig) {
    const windupMs = config.windupMs ?? 0;
    this.inWindup = true;
    this.player.setTint(0x99ddff); // liseré glacé — telegraph distinct du windup lourd
    this.time.delayedCall(windupMs, () => {
      this.inWindup = false;
      if (this.player.active) this.player.clearTint();
      if (this.isTraveling) return;

      const angle = this.facingAngle;
      const range = 240; // allonge encore accrue sur la percée
      this.spawnSpearThrustVfx(this.player.x, this.player.y, angle, range, 0xaaddff);
      this.executeHitInCone(range, Math.PI / 10, 1.6);
      for (const sprite of this.findEnemiesInCone(range, Math.PI / 10)) {
        this.applyKnockback(sprite, 220);
      }

      // Petit bond en avant : la charge se SENT (cf. gamefeel — le dash a de la personnalité).
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * 320, Math.sin(angle) * 320);
      this.time.delayedCall(120, () => {
        if (this.player.active && !this.isDashing) body.setVelocity(0, 0);
      });
    });
  }

  // SWORD — Estoc : narrow cone (PI/12), range x1.8, dmgMult=0.85, rapid, 350ms cd.
  // Note: 30% DEF pierce is a design intent; CombatSystem has no pierce param.
  private performAltSword(_config: AltAttackConfig) {
    const range = Math.round(115 * 1.8); // 207px
    this.spawnAltSwordEstocVfx(this.player.x, this.player.y, this.facingAngle);
    this.executeHitInCone(range, Math.PI / 12, 0.85);
  }

  // GREATSWORD — Frappe circulaire : 360°, range x0.7, dmgMult=1.4, windup 250ms, knockback.
  private performAltGreatsword(config: AltAttackConfig) {
    const windupMs = config.windupMs ?? 0;
    this.inWindup = true;
    this.player.setTint(0xff8888); // reddish windup (distinct from normal yellow)
    this.time.delayedCall(windupMs, () => {
      this.inWindup = false;
      if (this.player.active) this.player.clearTint();
      if (this.isTraveling) return;
      const range = Math.round(155 * 0.7); // 108px
      this.spawnAltGreatswordCircleVfx(this.player.x, this.player.y);
      this.executeHitInCone(range, Math.PI, 1.4); // 360°
      const hitSprites = this.findEnemiesInCone(range, Math.PI);
      for (const sprite of hitSprites) this.applyKnockback(sprite, 180);
    });
  }

  // DAGGER — Contre-attaque : dash toward nearest enemy + hit (dmgMult=1.6), or dash fwd.
  private performAltDagger(_config: AltAttackConfig) {
    const angle  = this.facingAngle;
    const target = this.findNearestEnemy(85);
    const fromX  = this.player.x;
    const fromY  = this.player.y;

    if (target) {
      // Land just behind the enemy relative to attack direction
      const toX = target.x - Math.cos(angle) * 20;
      const toY = target.y - Math.sin(angle) * 20;
      this.player.setPosition(toX, toY);
      (this.player.body as Phaser.Physics.Arcade.Body).reset(toX, toY);
      this.spawnAltDaggerCounterVfx(fromX, fromY, toX, toY);
      this.executeHitInCone(85, Math.PI, 1.6); // 360° backstab reach
    } else {
      // No target — simple forward dash
      const toX = fromX + Math.cos(angle) * 80;
      const toY = fromY + Math.sin(angle) * 80;
      this.player.setPosition(toX, toY);
      (this.player.body as Phaser.Physics.Arcade.Body).reset(toX, toY);
      this.spawnAltDaggerCounterVfx(fromX, fromY, toX, toY);
    }
  }

  // DUAL_DAGGER — Tornade : 360°, 3 hits × 80ms, each dmgMult=0.4, range x0.8.
  private performAltDualDagger(_config: AltAttackConfig) {
    const range = Math.round(85 * 0.8); // 68px
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 80, () => {
        if (this.isTraveling) return;
        this.executeHitInCone(range, Math.PI, 0.4);
        this.spawnAltDualDaggerTornadoVfx(i);
      });
    }
  }

  // DUAL_SWORD — Parade-riposte : 600ms guard → auto-counter dmgMult=1.2 if hit, 0.7 if not.
  private performAltDualSword(_config: AltAttackConfig) {
    const guardMs  = 600;
    const hpBefore = this.gameState.player.stats.hp;
    this.guardUntil = this.time.now + guardMs;
    this.spawnAltDualSwordParadeVfx(this.player.x, this.player.y);
    this.time.delayedCall(guardMs, () => {
      if (this.isTraveling) return;
      const wasHit   = this.gameState.player.stats.hp < hpBefore;
      const dmgMult  = wasHit ? 1.2 : 0.7;
      this.executeHitInCone(105, Math.PI * 0.6, dmgMult);
      this.spawnAltDualSwordCounterVfx(this.player.x, this.player.y, this.facingAngle);
    });
  }

  // AXE — Lancer : physics projectile, range=150, dmgMult=1.0.
  private performAltAxe(_config: AltAttackConfig) {
    this.fireAltProjectile(150, 1.0);
    this.spawnAltAxeThrowVfx(this.player.x, this.player.y, this.facingAngle);
  }

  // HAMMER — Saut écrasement : windup 400ms (red tint), 360° AOE=100, dmgMult=2.5, stun 800ms.
  private performAltHammer(config: AltAttackConfig) {
    const windupMs = config.windupMs ?? 0;
    this.inWindup  = true;
    this.player.setTint(0xff3333); // bright red windup signal
    this.time.delayedCall(windupMs, () => {
      this.inWindup = false;
      if (this.player.active) this.player.clearTint();
      if (this.isTraveling) return;
      const AOE = 100;
      this.spawnAltHammerSlamVfx(this.player.x, this.player.y);
      this.executeHitInCone(AOE, Math.PI, 2.5);
      const hitSprites = this.findEnemiesInCone(AOE, Math.PI);
      for (const sprite of hitSprites) this.applyStun(sprite, 800);
    });
  }

  // STAFF — Tir chargé : windup 300ms (purple tint), projectile range x1.5, dmgMult=1.8.
  private performAltStaff(config: AltAttackConfig) {
    const windupMs = config.windupMs ?? 0;
    this.inWindup  = true;
    this.player.setTint(0xcc44ff); // purple charge
    this.time.delayedCall(windupMs, () => {
      this.inWindup = false;
      if (this.player.active) this.player.clearTint();
      if (this.isTraveling) return;
      const range = Math.round(260 * 1.5); // 390px
      const angle = this.facingAngle;
      this.fireAltProjectile(range, 1.8);
      const toX = this.player.x + Math.cos(angle) * range;
      const toY = this.player.y + Math.sin(angle) * range;
      this.spawnStaffTrailVfx(this.player.x, this.player.y, toX, toY, 0xff44ff);
    });
  }

  // BOW — Tir de précision : straight projectile, range x1.6, dmgMult=1.5.
  private performAltBow(_config: AltAttackConfig) {
    const range = Math.round(460 * 1.6); // 736px
    const angle = this.facingAngle;
    this.fireAltProjectile(range, 1.5);
    const toX = this.player.x + Math.cos(angle) * range;
    const toY = this.player.y + Math.sin(angle) * range;
    this.spawnArrowVfx(this.player.x, this.player.y, toX, toY, angle, 0xcc44ff);
  }

  // FISTS — Coup retourné : dash back 80px → pause 150ms → dash fwd 120px + hit dmgMult=1.2.
  private performAltFists(_config: AltAttackConfig) {
    const angle = this.facingAngle;
    const fromX = this.player.x;
    const fromY = this.player.y;
    const backX = fromX - Math.cos(angle) * 80;
    const backY = fromY - Math.sin(angle) * 80;

    // Afterimage at starting position
    const ghost = this.add.rectangle(fromX, fromY, this.player.displayWidth, this.player.displayHeight, 0xff44ff, 0.5).setDepth(3);
    this.tweens.add({ targets: ghost, alpha: 0, duration: 200, onComplete: () => ghost.destroy() });

    // Snap backward
    this.player.setPosition(backX, backY);
    (this.player.body as Phaser.Physics.Arcade.Body).reset(backX, backY);

    this.time.delayedCall(150, () => {
      if (this.isTraveling) return;
      const fwdX = this.player.x + Math.cos(angle) * 120;
      const fwdY = this.player.y + Math.sin(angle) * 120;

      // Afterimage at back position before lunge
      const ghost2 = this.add.rectangle(this.player.x, this.player.y, this.player.displayWidth, this.player.displayHeight, 0xff44ff, 0.5).setDepth(3);
      this.tweens.add({ targets: ghost2, alpha: 0, duration: 200, onComplete: () => ghost2.destroy() });

      this.player.setPosition(fwdX, fwdY);
      (this.player.body as Phaser.Physics.Arcade.Body).reset(fwdX, fwdY);
      this.executeHitInCone(65, Math.PI / 2.4, 1.2);
      // Magenta punch burst at impact point
      const impX = this.player.x + Math.cos(angle) * 30;
      const impY = this.player.y + Math.sin(angle) * 30;
      const burst = this.add.circle(impX, impY, 14, 0xff44ff, 0.85).setDepth(33);
      this.tweens.add({ targets: burst, scaleX: 2, scaleY: 2, alpha: 0, duration: 200, ease: 'Power2', onComplete: () => burst.destroy() });
    });
  }

  // ── ALT ATTACK PROJECTILE HELPER ──────────────────────────────
  // Fires a physics-collision rectangle along facingAngle (reuses _activeArrows pool).
  // No cosmetic VFX — each caller spawns its own visual to match the weapon feel.

  private fireAltProjectile(range: number, dmgMult: number) {
    const SPEED = 600; // px/s — same as bow
    const angle = this.facingAngle;
    const rect  = this.add.rectangle(this.player.x, this.player.y, 16, 8, 0xffffff, 0);
    this._activeArrows.push({
      rect,
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
      hit: false,
      destroyAt: this.time.now + (range / SPEED) * 1000,
      dmgMult,
    });
  }

  // ── ALT ATTACK VFX ───────────────────────────────────────────
  // All use violet/magenta palette (0xcc44ff / 0xff44ff / 0xff00ff) to signal
  // "this is H, not J" at a glance. Pure Phaser primitives, destroyed in onComplete.

  // SWORD estoc — fast thin purple thrust beam along facing angle.
  private spawnAltSwordEstocVfx(px: number, py: number, angle: number) {
    const len = 140;
    const cx = px + Math.cos(angle) * len / 2;
    const cy = py + Math.sin(angle) * len / 2;
    const beam = this.add.rectangle(cx, cy, len, 4, 0xcc44ff, 0.9).setDepth(32).setRotation(angle);
    this.tweens.add({
      targets: beam,
      scaleX: 0.05, alpha: 0,
      duration: 180,
      ease: 'Power3',
      onComplete: () => beam.destroy(),
    });
    const tip = this.add.circle(px + Math.cos(angle) * len, py + Math.sin(angle) * len, 8, 0xee88ff, 0.8).setDepth(33);
    this.tweens.add({ targets: tip, scaleX: 0, scaleY: 0, alpha: 0, duration: 150, ease: 'Power2', onComplete: () => tip.destroy() });
  }

  // GREATSWORD frappe circulaire — red expanding ring.
  private spawnAltGreatswordCircleVfx(px: number, py: number) {
    const ring = this.add.graphics({ x: px, y: py }).setDepth(32);
    ring.lineStyle(10, 0xff2244, 0.9);
    ring.strokeCircle(0, 0, 14);
    this.tweens.add({
      targets: ring,
      scaleX: 5.5, scaleY: 5.5, alpha: 0,
      duration: 500,
      ease: 'Power2.easeOut',
      onComplete: () => ring.destroy(),
    });
    const inner = this.add.circle(px, py, 18, 0xff0000, 0.4).setDepth(31);
    this.tweens.add({ targets: inner, alpha: 0, duration: 280, onComplete: () => inner.destroy() });
  }

  // DAGGER contre — orange dash trail + impact flash at destination.
  private spawnAltDaggerCounterVfx(fromX: number, fromY: number, toX: number, toY: number) {
    const trailAngle = Math.atan2(toY - fromY, toX - fromX);
    const trailLen   = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
    const trail = this.add.rectangle(
      (fromX + toX) / 2, (fromY + toY) / 2,
      trailLen, 3, 0xff8800, 0.8,
    ).setDepth(31).setRotation(trailAngle);
    this.tweens.add({ targets: trail, alpha: 0, duration: 220, onComplete: () => trail.destroy() });
    const flash = this.add.circle(toX, toY, 12, 0xff6600, 0.9).setDepth(33);
    this.tweens.add({ targets: flash, scaleX: 2.2, scaleY: 2.2, alpha: 0, duration: 200, ease: 'Power2', onComplete: () => flash.destroy() });
  }

  // DUAL_DAGGER tornade — three purple arcs spread 120° apart per hit cycle.
  private spawnAltDualDaggerTornadoVfx(hitIndex: number) {
    const px = this.player.x;
    const py = this.player.y;
    const baseAngle = (Math.PI * 2 / 3) * hitIndex;
    for (let i = 0; i < 3; i++) {
      const a = baseAngle + (Math.PI * 2 / 3) * i;
      this.spawnSlashArcVfx(px, py, a, 0xcc44ff, { radius: 50, thickness: 4, halfArc: 0.6, duration: 200 });
    }
  }

  // DUAL_SWORD parade — pulsing purple shield ring that follows the player.
  private spawnAltDualSwordParadeVfx(px: number, py: number) {
    const shield = this.add.graphics({ x: px, y: py }).setDepth(30);
    shield.lineStyle(3, 0xcc44ff, 0.85);
    shield.strokeCircle(0, 0, 20);
    this.tweens.add({
      targets: shield,
      scaleX: 1.5, scaleY: 1.5, alpha: 0.1,
      duration: 300,
      yoyo: true, repeat: 1,
      onUpdate: () => shield.setPosition(this.player.x, this.player.y),
      onComplete: () => shield.destroy(),
    });
  }

  // DUAL_SWORD counter — magenta counter slash + glow flash.
  private spawnAltDualSwordCounterVfx(px: number, py: number, angle: number) {
    this.spawnSlashArcVfx(px, py, angle, 0xff00ff, { radius: 70, thickness: 8, halfArc: 0.80, duration: 200, alpha: 1.0 });
    const flash = this.add.circle(px, py, 18, 0xff44ff, 0.7).setDepth(33);
    this.tweens.add({ targets: flash, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 200, ease: 'Power2', onComplete: () => flash.destroy() });
  }

  // AXE lancer — purple spinning rectangle flying along facing angle.
  private spawnAltAxeThrowVfx(fromX: number, fromY: number, angle: number) {
    const toX    = fromX + Math.cos(angle) * 150;
    const toY    = fromY + Math.sin(angle) * 150;
    const axe    = this.add.rectangle(fromX, fromY, 18, 6, 0xcc44ff, 1).setDepth(32);
    axe.setRotation(angle);
    this.tweens.add({
      targets: axe,
      x: toX, y: toY,
      angle: 720, // two full rotations during flight
      duration: 250,
      ease: 'Linear',
      onComplete: () => {
        this.tweens.add({ targets: axe, alpha: 0, scaleX: 0.1, scaleY: 0.1, duration: 100, onComplete: () => axe.destroy() });
      },
    });
  }

  // HAMMER saut écrasement — massive red shockwave ring + center implosion.
  private spawnAltHammerSlamVfx(px: number, py: number) {
    const ring = this.add.graphics({ x: px, y: py }).setDepth(31);
    ring.lineStyle(10, 0xff0000, 0.9);
    ring.strokeCircle(0, 0, 14);
    this.tweens.add({
      targets: ring,
      scaleX: 7.2, scaleY: 7.2, alpha: 0, // ~100px final radius
      duration: 600,
      ease: 'Power2.easeOut',
      onComplete: () => ring.destroy(),
    });
    const inner = this.add.circle(px, py, 26, 0xff2222, 0.85).setDepth(32);
    this.tweens.add({ targets: inner, scaleX: 0.1, scaleY: 0.1, alpha: 0, duration: 220, ease: 'Power3', onComplete: () => inner.destroy() });
    this.cameras.main.shake(180, 0.014);
  }

  /** Trigger a skill by slot index (0–3). Called from UIScene mobile buttons. */
  public triggerSkillBySlot(slot: 0 | 1 | 2 | 3): void {
    if (this.menuOpen || this.isInDialogue || this.isTraveling) return;
    const s = this.gameState.player.equippedSkills;
    const skillId = ([s.slot1, s.slot2, s.slot3, s.slot4] as (string | null)[])[slot];
    if (skillId) this.activateSkill(skillId);
  }

  private onMobileAction(action: string): void {
    switch (action) {
      case 'attack':
        if (!this.menuOpen && !this.isInDialogue && !this.isTraveling) this.performBasicAttack();
        break;
      case 'dash':
        if (!this.menuOpen && !this.isInDialogue && !this.isTraveling) this.handleDash();
        break;
      case 'skill0': this.triggerSkillBySlot(0); break;
      case 'skill1': this.triggerSkillBySlot(1); break;
      case 'skill2': this.triggerSkillBySlot(2); break;
      case 'skill3': this.triggerSkillBySlot(3); break;
      // Fermeture via close() (animation symétrique) ; bascule d'un écran vers
      // l'autre en stop BRUT — même raison que les handlers clavier I/K de
      // applyKeyBindings() (setPaused(false) différé sous le nouvel overlay).
      case 'inventory':
        if (this.scene.isActive('InventoryScene')) {
          (this.scene.get('InventoryScene') as InventoryScene).close();
        } else {
          if (this.scene.isActive('SkillScene')) { this.setPaused(false); this.scene.stop('SkillScene'); }
          if (this.scene.isActive('PityScene'))  { this.setPaused(false); this.scene.stop('PityScene'); }
          this.setPaused(true);
          this.scene.launch('InventoryScene', { gameScene: this });
        }
        break;
      case 'skills':
        if (this.scene.isActive('SkillScene')) {
          (this.scene.get('SkillScene') as SkillScene).close();
        } else {
          if (this.scene.isActive('InventoryScene')) { this.setPaused(false); this.scene.stop('InventoryScene'); }
          if (this.scene.isActive('PityScene'))      { this.setPaused(false); this.scene.stop('PityScene'); }
          this.setPaused(true);
          this.scene.launch('SkillScene', { gameScene: this });
        }
        break;
      case 'pity':
        if (this.scene.isActive('PityScene')) { (this.scene.get('PityScene') as PityScene).close(); }
        else this.openPity();
        break;
    }
  }

  shutdown() {
    this.time.removeAllEvents();
    // Écho : reset dur silencieux — même règle que destroyCurrentZoneObjects().
    this.destroyEchoImmediate();
    this.input.keyboard?.removeAllKeys(true);
    // Clean up native window listeners — no memory leak on scene stop/restart.
    if (this._attackHandler) {
      window.removeEventListener('keydown', this._attackHandler);
      this._attackHandler = null;
    }
    if (this._altAttackHandler) {
      window.removeEventListener('keydown', this._altAttackHandler);
      this._altAttackHandler = null;
    }
    this.game.events.off('mobile_action', this.onMobileAction, this);
    // Do NOT call events.removeAllListeners() — it strips Phaser's internal
    // lifecycle listeners (physics, tweens, input) registered on sys.events,
    // which prevents the scene from resuming correctly.
  }
}
