import Phaser from 'phaser';
import { GameState, ActiveEnemy, ElementType, Enemy, WeaponType } from '../types';
import { CombatSystem } from '../systems/CombatSystem';
import { StatsSystem } from '../systems/StatsSystem';
import { COMBO_CONFIGS, ComboConfig } from '../data/combos';
import { TalentSystem, TalentModifiers } from '../systems/TalentSystem';
import { LootSystem } from '../systems/LootSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { SkillSystem } from '../systems/SkillSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { ENEMY_MAP } from '../data/enemies';
import { ZONE_MAP } from '../data/zones';
import {
  PATTERNS,
  getEnemyPatternAssignment,
  type AttackPatternId,
} from '../data/enemyPatterns';
import { NPC_MAP } from '../data/npcs';
import { getZoneLayout, ZoneLayout, LootableObject, WaterArea } from '../data/zoneMaps';
import { ALL_ITEMS } from '../data/items';
import { loadBindings, KeyBindings } from '../data/keyBindings';
import { t, localizeItem } from '../i18n';
import { BestiarySystem } from '../systems/BestiarySystem';
import { getBestiaryEntry } from '../data/bestiary';
import { ENEMY_SPRITE_BBOX, NPC_SPRITE_BBOX, PLAYER_SPRITE_BBOX } from '../data/spriteGeometry';
import { fitSpriteToContent } from '../utils/SpriteFit';

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

// ── ATTACK PATTERNS ──────────────────────────────────────────────────────────
// Pure data — each weapon has a sequence of hits (timing, range, arc, dmg mult)
// and an overall cooldown. windupMs delays all hits so heavy weapons "charge".

interface AttackHit {
  /** ms offset from (windupMs + start of attack) */
  delay: number;
  range: number;
  halfArc: number;
  /** multiplier applied on top of CombatSystem base damage — 1.0 = normal */
  damageMultiplier: number;
}

interface AttackPattern {
  hits: AttackHit[];
  /** ms before the player can attack again */
  cooldown: number;
  /** ms before the first hit fires (windup charging feel for heavy weapons) */
  windupMs?: number;
  /** if true, this weapon fires a physical projectile instead of an instant cone hit */
  isProjectile?: boolean;
}

const ATTACK_PATTERNS: Partial<Record<WeaponType, AttackPattern>> = {
  [WeaponType.DAGGER]: {
    hits: [{ delay: 0, range: 85, halfArc: Math.PI / 3, damageMultiplier: 1.0 }],
    cooldown: 400,
  },
  [WeaponType.DUAL_DAGGER]: {
    hits: [
      { delay: 0,   range: 85, halfArc: Math.PI / 3, damageMultiplier: 0.7 },
      { delay: 150, range: 85, halfArc: Math.PI / 3, damageMultiplier: 0.7 },
    ],
    cooldown: 500,
  },
  [WeaponType.SWORD]: {
    hits: [{ delay: 0, range: 115, halfArc: Math.PI / 3, damageMultiplier: 1.0 }],
    cooldown: 600,
  },
  [WeaponType.DUAL_SWORD]: {
    hits: [
      { delay: 0,   range: 105, halfArc: 11 * Math.PI / 18, damageMultiplier: 0.6 },
      { delay: 180, range: 105, halfArc: 11 * Math.PI / 18, damageMultiplier: 0.6 },
      { delay: 360, range: 105, halfArc: 11 * Math.PI / 18, damageMultiplier: 0.8 },
    ],
    cooldown: 800,
  },
  [WeaponType.GREATSWORD]: {
    hits: [{ delay: 0, range: 155, halfArc: 5 * Math.PI / 12, damageMultiplier: 1.8 }],
    cooldown: 1100,
    windupMs: 300,
  },
  [WeaponType.AXE]: {
    hits: [{ delay: 0, range: 125, halfArc: 11 * Math.PI / 18, damageMultiplier: 1.3 }],
    cooldown: 700,
    windupMs: 150,
  },
  [WeaponType.HAMMER]: {
    // +30% arc (Math.PI * 0.65 ≈ 117°) + massive multiplier
    hits: [{ delay: 0, range: 105, halfArc: Math.PI * 0.65, damageMultiplier: 2.5 }],
    cooldown: 1300,
    windupMs: 400,
  },
  [WeaponType.STAFF]: {
    hits: [{ delay: 0, range: 260, halfArc: Math.PI / 12, damageMultiplier: 1.0 }],
    cooldown: 700,
  },
  [WeaponType.BOW]: {
    // Physical arrow projectile — damage lands on collision, not via timed cone hit.
    // VFX (spawnArrowVfx) is purely cosmetic; the physics body drives actual hit detection.
    hits: [],
    cooldown: 900,
    windupMs: 200,
    isProjectile: true,
  },
};

const FISTS_PATTERN: AttackPattern = {
  hits: [
    { delay: 0,   range: 65, halfArc: Math.PI / 2.4, damageMultiplier: 0.5 },
    { delay: 200, range: 65, halfArc: Math.PI / 2.4, damageMultiplier: 0.5 },
  ],
  cooldown: 500,
};

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
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private skillMenuKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private speedBoostKey!: Phaser.Input.Keyboard.Key;
  private debugSpeedMult = 1;
  private giveAllWeaponsKey!: Phaser.Input.Keyboard.Key;

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
  private lootableOverlap: Phaser.Physics.Arcade.Collider | null = null;
  private physicsColliders: Phaser.Physics.Arcade.Collider[] = [];
  private teleportOverlaps: Phaser.Physics.Arcade.Collider[] = [];

  private activeEnemies: Map<string, ActiveEnemy> = new Map();
  private enemyHpBars: Map<string, { bg: Phaser.GameObjects.Rectangle; bar: Phaser.GameObjects.Rectangle; baseW: number }> = new Map();
  private enemyCrowns: Map<string, Phaser.GameObjects.Text> = new Map();
  private cooldowns: Record<string, number> = {};
  private dashCooldown = 0;
  /** Invincibilité post-hit : timestamp (ms) jusqu'auquel le joueur ne peut pas être touché. */
  private iframeUntil = 0;
  private wasDashReady = true;
  private isDashing = false;
  private lastDirX = 0;
  private lastDirY = 1;
  private facingAngle = 0;
  private playerVx = 0;
  private playerVy = 0;
  private dashMomentumX = 0;
  private dashMomentumY = 0;
  private menuOpen = false;
  private isInDialogue = false;
  private isTraveling = false;
  private lastAutoSave = 0;
  private playtimeAccumulator = 0;
  private lastRegenTime = 0;

  // ── COMBO STATE MACHINE ──────────────────────────────────────
  private comboCount = 0;
  private lastAttackEnd = 0;    // timestamp (ms) de fin du cooldown de la dernière attaque
  private comboRushed = false;  // un input a été reçu en zone morte
  private bufferedAttack = false; // réservé pour implémentation future zone buffer
  private comboWeaponType: WeaponType | undefined = undefined;
  private guardUntil = 0;       // timestamp fin de la garde (Sword finisher)
  private inWindup = false;     // true pendant le chargement (windup) d'une arme lourde
  private playerModifiers!: TalentModifiers; // recalculé après unlock/respec/équipement

  // Interaction tracking
  private nearbyNPC: string | null = null;
  private nearbyLootable: string | null = null;
  private interactHint!: Phaser.GameObjects.Text;

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
    this.playerVx            = 0;
    this.playerVy            = 0;
    this.dashMomentumX       = 0;
    this.dashMomentumY       = 0;
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
    this.comboRushed     = false;
    this.bufferedAttack  = false;
    this.comboWeaponType = undefined;
    this.guardUntil      = 0;
    this.inWindup        = false;
    this.playerModifiers = TalentSystem.getModifiers(this.gameState.player);
    // Reset zone-scoped refs on each scene start (full Phaser restart)
    this.zoneGraphics       = null;
    this.zoneTileSprites    = [];
    this.zoneLabels         = [];
    this.teleportZoneImages = [];
    this.physicsColliders   = [];
    this.teleportOverlaps   = [];
    this.xpOrbOverlap       = null;
    this.lootableOverlap    = null;
    this.projectileCollider = null;
  }

  create() {
    const zoneId = this.gameState.player.currentZone;
    this.layout = getZoneLayout(zoneId);

    this.generatePixelTexture();
    this.drawZoneMap();
    this.createPlayer();
    this.createEnemiesForZone(zoneId);
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

    this.interactHint = this.add.text(0, 0, t('hint.talk'), {
      fontSize: '11px', color: '#ffee88',
      fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(20).setVisible(false);

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
      const completed = QuestSystem.onZoneEntered(this.gameState.player, zoneId);
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

    // NPC proximity via distance (le collider empêche le vrai overlap physique)
    this.nearbyNPC = null;
    this.npcs.getChildren().forEach((go: Phaser.GameObjects.GameObject) => {
      const sprite = go as Phaser.Physics.Arcade.Image;
      const npcId  = sprite.getData('npcId') as string | null;
      if (!npcId) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (dist < 42) this.nearbyNPC = npcId;
    });

    this.handleMovement(dt);
    this.handleAttackInput();
    this.handleSkillInput();
    this.updateArrowProjectiles(dt);

    // Debug: press G to add one of every weapon to the inventory (asset-review aid)
    if (Phaser.Input.Keyboard.JustDown(this.giveAllWeaponsKey)) this.debugGiveAllWeapons();

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

    // Interaction hint
    const showHint = !!this.nearbyNPC || !!this.nearbyLootable;
    this.interactHint.setVisible(showHint);
    if (showHint) {
      const hintText = this.nearbyNPC ? t('hint.talk') : t('hint.loot');
      if (this.interactHint.text !== hintText) this.interactHint.setText(hintText);
      this.interactHint.setPosition(Math.round(this.player.x), Math.round(this.player.y) - 28);
    }

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

    if (this.playtimeAccumulator - this.lastAutoSave > 180) {
      this.lastAutoSave = this.playtimeAccumulator;
      SaveSystem.save(this.gameState, this.gameState.saveSlot);
    }

    this.events.emit('player_update', this.gameState.player);

    // nearbyNPC est recalculé en début d'update — seulement nearbyLootable à vider ici
    this.nearbyLootable = null;
  }

  /** Debug aid (press G): adds one of every weapon in the game to the inventory,
   * so newly-integrated weapon icons/stats can be reviewed in-game without grinding. */
  private debugGiveAllWeapons(): void {
    const weapons = Object.values(ALL_ITEMS).filter(item => 'weaponType' in item && item.weaponType);
    let added = 0;
    for (const weapon of weapons) {
      if (LootSystem.addToInventory(this.gameState.player, weapon, 1)) added++;
    }
    this.events.emit('show_notification', `[DEBUG] ${added}/${weapons.length} armes ajoutées à l'inventaire`);
  }

  // ── MOVEMENT ─────────────────────────────────────────────────

  private handleMovement(dt: number) {
    if (this.isDashing) return;

    this.debugSpeedMult = this.speedBoostKey?.isDown ? 5 : 1;

    const player = this.gameState.player;
    const speed  = (90 + player.stats.spd * 4) * this.playerModifiers.moveSpeedMult * this.debugSpeedMult;
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

    body.setVelocity(this.playerVx + this.dashMomentumX, this.playerVy + this.dashMomentumY);

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
    if (this.dashCooldown > 0) return;

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

    const nx = (dx / len) * 300;
    const ny = (dy / len) * 300;

    this.dashCooldown = 1.5;
    this.isDashing = true;
    body.setVelocity(nx, ny);

    // BUG5 fix: dashPreservesCombo gèle le timer de grace pendant 350ms
    if (this.playerModifiers.dashPreservesCombo) {
      this.lastAttackEnd = Math.max(this.lastAttackEnd, this.time.now + 350);
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

    this.cooldowns['dash'] = 1.5;
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
      if (this.comboCount > 0) this.events.emit('combo-broken');
      this.comboCount = 0;
    }

    // ── GRACE TIMER ──────────────────────────────────────────────
    // If the player waited past the grace window, the chain resets to 1.
    // Grace is measured from when the previous cooldown ended (lastAttackEnd).
    if (comboConfig && this.comboCount > 0) {
      const effectiveGrace = comboConfig.graceMs * this.playerModifiers.comboGraceMult;
      if (now - this.lastAttackEnd > effectiveGrace) {
        this.comboCount = 0;
        this.events.emit('combo-broken');
      }
    }

    this.comboWeaponType = weaponType;
    this.comboCount++;

    // ASPD_PCT (equipStats) accélère le cooldown d'attaque de base — cf. StatsSystem.
    const aspd = StatsSystem.computeAll(this.gameState.player).aspd;
    const cooldown = pattern.cooldown / aspd;

    // ── FINISHER ─────────────────────────────────────────────────
    let finisherFired = false;
    if (comboConfig && this.comboCount >= comboConfig.chainLength) {
      finisherFired = true;
      this.executeFinisherAttack(weaponType, pattern, comboConfig, now);
      this.comboCount = 0;
      const finisherCd = cooldown * comboConfig.finisher.cooldownMult;
      this.lastAttackEnd      = now + finisherCd;
      this.attackCooldownUntil = this.lastAttackEnd;
    } else {
      // ── ATTAQUE NORMALE ──────────────────────────────────────
      const windupMs = pattern.windupMs ?? 0;

      if (pattern.isProjectile) {
        // BOW fires a physics rectangle, not a cone.
        if (windupMs > 0) this.spawnWindupVfx(windupMs);
        if (windupMs === 0) {
          this.fireArrowProjectile();
        } else {
          this.time.delayedCall(windupMs, () => {
            if (!this.isTraveling) this.fireArrowProjectile();
          });
        }
      } else {
        if (windupMs > 0) this.spawnWindupVfx(windupMs);
        for (let i = 0; i < pattern.hits.length; i++) {
          const hit = pattern.hits[i];
          const fireDelay = windupMs + hit.delay;
          const hitIndex  = i;
          const doHit = () => {
            if (this.isTraveling) return;
            const tx = this.player.x + Math.cos(this.facingAngle) * hit.range * 0.7;
            const ty = this.player.y + Math.sin(this.facingAngle) * hit.range * 0.7;
            this.spawnWeaponSwingVfx(this.player.x, this.player.y, tx, ty, weaponType, hitIndex);
            this.executeHitInCone(hit.range, hit.halfArc, hit.damageMultiplier);
          };
          if (fireDelay === 0) doHit();
          else this.time.delayedCall(fireDelay, doHit);
        }
      }

      this.lastAttackEnd      = now + cooldown;
      this.attackCooldownUntil = this.lastAttackEnd;
    }

    // ── ÉVÉNEMENT COMBO HUD ──────────────────────────────────────
    // BUG3 fix: ne pas émettre combo-changed si le finisher a déjà réinitialisé l'état
    if (!finisherFired) {
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

      // Combiné : multiplicateur du pattern + talents mêlée + bonus de chaîne.
      const finalDamage = Math.round(result.damage * damageMultiplier * appliedMeleeMult * stackBonus);
      activeEnemy.currentHp = Math.max(0, Math.min(activeEnemy.maxHp, hpBeforeHit - finalDamage));
      const isKill = activeEnemy.currentHp <= 0;

      this.showDamageNumber(sprite.x, sprite.y - 20, finalDamage, result.isCrit, result.element);
      this.spawnHitParticles(sprite.x, sprite.y, result.element);
      this.applyHitFeedback(sprite, activeEnemy, finalDamage);
      if (result.isCrit) anyCrit = true;
      if (isKill) {
        this.onEnemyKilled(activeEnemy, sprite);
      } else {
        this.checkStagger(sprite, activeEnemy, finalDamage);
      }
    }

    if (anyCrit) {
      this.cameras.main.shake(120, 0.007);
    } else {
      this.cameras.main.shake(40, 0.002);
    }
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
    const SPEED = 600;  // px/s
    const RANGE = 460;
    const angle = this.facingAngle;

    // Point de collision : rectangle transparent déplacé manuellement chaque frame
    const rect = this.add.rectangle(this.player.x, this.player.y, 16, 8, 0xffffff, 0);
    const travelMs = (RANGE / SPEED) * 1000; // ~767ms
    this._activeArrows.push({
      rect,
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
      hit: false,
      destroyAt: this.time.now + travelMs,
      dmgMult,
    });

    // VFX cosmétique — voyage en parallèle, purement visuel
    const toX = this.player.x + Math.cos(angle) * RANGE * 0.7;
    const toY = this.player.y + Math.sin(angle) * RANGE * 0.7;
    this.spawnArrowVfx(this.player.x, this.player.y, toX, toY, angle, 0xddcc77);
  }

  private updateArrowProjectiles(dt: number) {
    if (this._activeArrows.length === 0) return;
    const HIT_RADIUS = 22; // px
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

      // Vérifier chaque ennemi vivant
      for (const go of this.enemies.getChildren()) {
        const sprite = go as Phaser.Physics.Arcade.Sprite;
        if (!sprite.active) continue;
        const dist = Phaser.Math.Distance.Between(arrow.rect.x, arrow.rect.y, sprite.x, sprite.y);
        if (dist > HIT_RADIUS) continue;

        // Impact — un seul ennemi touché
        arrow.hit = true;
        arrow.rect.destroy();
        this._activeArrows.splice(i, 1);

        const activeEnemy = this.activeEnemies.get(sprite.name);
        if (!activeEnemy) break;

        // See executeHitInCone() for why we snapshot HP before CombatSystem's own
        // (unmultiplied) clamped subtraction rather than patch a delta onto it.
        const hpBeforeHit = activeEnemy.currentHp;
        const result = CombatSystem.playerAttack(this.gameState.player, activeEnemy, cs);
        // BUG4 fix: apply the dmgMult from the finisher (or 1.0 for normal shots)
        const arrowFinalDmg = Math.round(result.damage * arrow.dmgMult);
        activeEnemy.currentHp = Math.max(0, Math.min(activeEnemy.maxHp, hpBeforeHit - arrowFinalDmg));
        const arrowIsKill = activeEnemy.currentHp <= 0;
        this.showDamageNumber(sprite.x, sprite.y - 20, arrowFinalDmg, result.isCrit, result.element);
        this.spawnHitParticles(sprite.x, sprite.y, result.element);
        this.applyHitFeedback(sprite, activeEnemy, arrowFinalDmg);
        if (result.isCrit) this.cameras.main.shake(120, 0.007);
        else               this.cameras.main.shake(40, 0.002);
        if (arrowIsKill) this.onEnemyKilled(activeEnemy, sprite);
        else             this.checkStagger(sprite, activeEnemy, arrowFinalDmg);
        break;
      }
    }
  }

  private activateSkill(skillId: string) {
    const skill = SkillSystem.getSkill(skillId);
    if (!skill) return;
    if (!SkillSystem.canUseSkill(this.gameState.player, skillId, this.cooldowns)) return;

    const nearest = this.findNearestEnemy(skill.range ?? 200);
    const activeEnemy = nearest ? this.activeEnemies.get(nearest.name) : undefined;

    const result = CombatSystem.playerSkill(this.gameState.player, skill, activeEnemy, this.playerModifiers);
    if (result) {
      if (result.damage > 0 && nearest) {
        if (skill.isProjectile) {
          this.spawnCosmeticProjectile(this.player.x, this.player.y, nearest.x, nearest.y, skill.element);
        }
        this.showDamageNumber(nearest.x, nearest.y - 20, result.damage, result.isCrit, skill.element);
        this.spawnHitParticles(nearest.x, nearest.y, skill.element);
        if (result.isCrit) {
          this.cameras.main.shake(150, 0.009);
        } else {
          this.cameras.main.shake(50, 0.003);
        }
        this.applyHitFeedback(nearest, activeEnemy!, result.damage);
        if (result.isKill) {
          this.onEnemyKilled(activeEnemy!, nearest);
        } else {
          this.checkStagger(nearest, activeEnemy!, result.damage);
        }
      }
      if (result.damage === 0 && skill.effect?.healPercent) {
        this.showHealNumber(this.player.x, this.player.y - 20,
          Math.floor(this.gameState.player.stats.maxHp * (skill.effect.healPercent ?? 0)));
      }
    }

    SkillSystem.startCooldown(this.cooldowns, skillId);
  }

  // ── PUBLIC API FOR SUBSCENES ─────────────────────────────────

  public setShopOpen(open: boolean) { this.isInDialogue = open; }

  public setPaused(paused: boolean) {
    this.menuOpen = paused;
    if (paused) this.physics.world.pause();
    else        this.physics.world.resume();
  }

  public closeOverlay(key: string) {
    this.setPaused(false);
    this.scene.stop(key);
  }

  public openInventory() {
    if (this.scene.isActive('InventoryScene')) return;
    this.setPaused(true);
    this.scene.launch('InventoryScene', { gameScene: this });
  }

  public openSkills() {
    if (this.scene.isActive('SkillScene')) return;
    this.setPaused(true);
    this.scene.launch('SkillScene', { gameScene: this });
  }

  public goToMainMenu() {
    if (this.isTraveling) return;
    this.isTraveling = true;
    this.physics.world.pause();

    // Stop overlay scenes immediately
    for (const key of ['PauseScene', 'InventoryScene', 'SkillScene', 'DialogueScene', 'ShopScene', 'BestiaryScene']) {
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
    this.dashKey   = kb.addKey(b.dash);
    this.skillKeys = {
      a: kb.addKey(b.skill1),
      e: kb.addKey(b.skill2),
      r: kb.addKey(b.skill3),
      f: kb.addKey(b.skill4),
    };
    // Rewire inventory / skill menu keys with their handlers
    this.inventoryKey?.removeAllListeners();
    this.skillMenuKey?.removeAllListeners();
    this.inventoryKey = kb.addKey(b.inventory);
    this.skillMenuKey = kb.addKey(b.skills);
    this.inventoryKey.on('down', () => {
      if (this.scene.isActive('InventoryScene')) { this.setPaused(false); this.scene.stop('InventoryScene'); return; }
      if (this.scene.isActive('SkillScene'))     { this.setPaused(false); this.scene.stop('SkillScene'); }
      this.setPaused(true);
      this.scene.launch('InventoryScene', { gameScene: this });
    });
    this.skillMenuKey.on('down', () => {
      if (this.scene.isActive('SkillScene'))     { this.setPaused(false); this.scene.stop('SkillScene'); return; }
      if (this.scene.isActive('InventoryScene')) { this.setPaused(false); this.scene.stop('InventoryScene'); }
      this.setPaused(true);
      this.scene.launch('SkillScene', { gameScene: this });
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
      const moveSpeed   = def.moveSpeed  ?? 90;

      // ── STUN check ──────────────────────────────────────────
      const stunEffect = ae.statusEffects.find(e => e.type === 'STUN');
      if (stunEffect && stunEffect.duration > 0) {
        stunEffect.duration -= dt;
        if (stunEffect.duration <= 0) {
          ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'STUN');
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
          ae.currentHp = Math.max(0, ae.currentHp - bleedEffect.strength);
          this.cooldowns[bleedKey] = 1.0;
          if (ae.currentHp <= 0) {
            this.onEnemyKilled(ae, sprite);
            return;
          }
        }
        if (bleedEffect.duration <= 0) {
          ae.statusEffects = ae.statusEffects.filter(e => e.type !== 'BLEED');
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
          sprite.setData('aiStateUntil', now + PATTERNS[chosenPatternId].telegraphMs);
          sprite.setData('aiPattern', chosenPatternId);
          sprite.setData('chargeTargetX', px);
          sprite.setData('chargeTargetY', py);
          body.setVelocity(0, 0);
          this.startEnemyTelegraph(sprite, ae, chosenPatternId);
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
          const cfg = PATTERNS[(sprite.getData('aiPattern') as AttackPatternId | null) ?? 'melee_basic'];
          sprite.setData('aiStateUntil', now + cfg.cooldownMs);
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
          this.applyEnemyMeleeDamage(ae, 1.0);
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
    _ae: ActiveEnemy,
    patternId: AttackPatternId,
  ) {
    const cfg = PATTERNS[patternId];
    const duration = cfg.telegraphMs;
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
    const cfg = PATTERNS[patternId];
    const px  = this.player.x;
    const py  = this.player.y;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    const baseDmg = Math.round(ae.stats.baseAtk * (cfg.damageMult ?? 1.0));

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
              this.applyEnemyMeleeDamage(ae, cfg.damageMult ?? 1.5);
              // Camera shake on charge hit
              this.cameras.main.shake(130, 0.008);
              // Knockback
              const kb = this.player.body as Phaser.Physics.Arcade.Body;
              const kbAngle = Math.atan2(this.player.y - sprite.y, this.player.x - sprite.x);
              kb.setVelocity(Math.cos(kbAngle) * 280, Math.sin(kbAngle) * 280);
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
          fontSize: '14px', color: '#ffd700', fontFamily: 'monospace',
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
        // Impact VFX
        const imp = this.add.circle(h.sprite.x, h.sprite.y, 14, 0x9933cc, 0.9).setDepth(14);
        this.tweens.add({
          targets: imp, scaleX: 3, scaleY: 3, alpha: 0, duration: 250,
          onComplete: () => imp.destroy(),
        });
        h.sprite.destroy();
        h.halo.destroy();
        this._homingProjectiles.splice(i, 1);
        // Apply damage
        this.applyDamageToPlayer(h.damage);
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

    const active = CombatSystem.spawnEnemy(minionDef, this.gameState.player.level);
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

  /** Apply melee damage from an enemy to the player, with guard/windup checks. */
  private applyEnemyMeleeDamage(ae: ActiveEnemy, damageMult: number) {
    if (this.inWindup && this.playerModifiers.windupArmor) return;
    if (damageMult <= 0) return; // summon pattern has damageMult 0

    // Snapshot BEFORE CombatSystem applies its own (unmultiplied) clamped damage — same
    // reason as executeHitInCone()/updateArrowProjectiles(): patching a delta onto HP
    // already clamped to 0 loses the overkill amount, which could let a guard-block
    // "revive" the player from a hit that should have killed them.
    const guardActive = this.time.now < this.guardUntil;
    const hpBeforeHit = this.gameState.player.stats.hp;
    const result = CombatSystem.enemyAttack(ae, this.gameState.player);
    if (result.damage <= 0) return; // stunned enemy — no hit landed

    let finalDmg = Math.round(result.damage * damageMult);
    if (guardActive) finalDmg -= Math.round(finalDmg * 0.3);

    this.gameState.player.stats.hp = Math.max(0, Math.min(
      this.gameState.player.stats.maxHp, hpBeforeHit - finalDmg,
    ));
    const isKill = this.gameState.player.stats.hp <= 0;

    if (finalDmg > 0) {
      this.showDamageNumber(this.player.x, this.player.y - 20, finalDmg, false, undefined, true);
      this.cameras.main.shake(100, 0.005);
    }
    this.events.emit('player_update', this.gameState.player);
    if (isKill) this.onPlayerDeath();
  }

  /** Apply direct damage to the player (from homing projectile, AoE, etc.). */
  private applyDamageToPlayer(damage: number) {
    if (damage <= 0) return;
    if (this.isDashing) return;
    if (this.time.now < this.iframeUntil) return; // iframes post-hit

    if (this.time.now < this.guardUntil) {
      const refund = Math.round(damage * 0.3);
      damage = Math.max(0, damage - refund);
      if (damage <= 0) return;
    }

    this.gameState.player.stats.hp = Math.max(0, this.gameState.player.stats.hp - damage);
    this.iframeUntil = this.time.now + 800;
    this.showDamageNumber(this.player.x, this.player.y - 20, damage, false, undefined, true);
    this.applyPlayerHitFx();
    this.events.emit('player_update', this.gameState.player);
    if (this.gameState.player.stats.hp <= 0) this.onPlayerDeath();
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

  private applyDamageToEnemy(instanceId: string, damage: number) {
    const ae = this.activeEnemies.get(instanceId);
    if (!ae) return;
    ae.currentHp -= damage;

    // Flash visuel
    const sprite = this.enemies.getChildren().find(
      (c) => (c as Phaser.Physics.Arcade.Sprite).name === instanceId,
    ) as Phaser.Physics.Arcade.Sprite | undefined;
    if (sprite?.active) {
      sprite.setTint(0xffffff);
      this.time.delayedCall(80, () => { if (sprite.active) this.resetEnemyTint(sprite); });
    }

    if (ae.currentHp <= 0 && sprite?.active) {
      this.onEnemyKilled(ae, sprite);
    }
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
        // IFRAMES : le joueur est invincible — le projectile est absorbé sans dégâts
        if (this.time.now < this.iframeUntil) { proj.destroy(); return; }
        const damage = (proj.getData('damage') as number) ?? 8;
        proj.destroy();
        this.gameState.player.stats.hp = Math.max(
          0,
          this.gameState.player.stats.hp - damage,
        );
        this.iframeUntil = this.time.now + 800;
        this.showDamageNumber(this.player.x, this.player.y - 20, damage, false, undefined, true);
        this.applyPlayerHitFx();
        this.events.emit('player_update', this.gameState.player);
        if (this.gameState.player.stats.hp <= 0) this.onPlayerDeath();
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

    const angle = Math.atan2(toY - fromY, toX - fromX);
    const speed = isPlayer ? 400 : 280;
    (proj.body as Phaser.Physics.Arcade.Body).setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
    );

    this.projectiles.add(proj);

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
    if (this.playerModifiers.killHealPct > 0) {
      const heal = Math.round(this.gameState.player.stats.maxHp * this.playerModifiers.killHealPct / 100);
      this.gameState.player.stats.hp = Math.min(
        this.gameState.player.stats.maxHp,
        this.gameState.player.stats.hp + heal,
      );
    }

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

    this.activeEnemies.delete(activeEnemy.instanceId);

    const barData = this.enemyHpBars.get(activeEnemy.instanceId);
    if (barData) { barData.bg.destroy(); barData.bar.destroy(); this.enemyHpBars.delete(activeEnemy.instanceId); }
    const crown = this.enemyCrowns.get(activeEnemy.instanceId);
    if (crown) { crown.destroy(); this.enemyCrowns.delete(activeEnemy.instanceId); }

    const xpMult   = activeEnemy.isElite ? 2.5 : 1;
    const deathX   = sprite.x;
    const deathY   = sprite.y;
    const isBoss   = enemyDef.isBoss;

    // Remove from physics immediately so it no longer blocks or attacks
    sprite.disableBody(true, false);

    if (isBoss) {
      this.playBossDeathSequence(sprite, activeEnemy, enemyDef);
    } else {
      this.playEnemyDeathSequence(sprite);
    }

    const loot = LootSystem.rollLoot(
      enemyDef.loot, enemyDef.baseGold, enemyDef.baseXp,
      activeEnemy.level, this.gameState.player,
    );

    // Bestiaire — premier kill
    BestiarySystem.recordKill(this.gameState.world, activeEnemy.enemyId);

    this.gameState.player.gold += loot.gold;
    for (const { item, quantity } of loot.items) {
      LootSystem.addToInventory(this.gameState.player, item, quantity);
      this.events.emit('item_looted', { item, quantity });
      // Bestiaire — révéler les drops hidden au premier loot
      BestiarySystem.revealDrop(this.gameState.world, activeEnemy.enemyId, item.id);
    }

    this.spawnXpOrbs(deathX, deathY, Math.floor(loot.xp * xpMult));

    const questCompleted = QuestSystem.onEnemyKilled(this.gameState.player, activeEnemy.enemyId);
    for (const itemLoot of loot.items) {
      QuestSystem.onItemCollected(this.gameState.player, itemLoot.item.id, itemLoot.quantity);
    }
    if (questCompleted.length > 0) this.handleQuestCompletions(questCompleted);

    if (isBoss) {
      const zone = Object.values(ZONE_MAP).find(z => z.bossId === enemyDef.id);
      if (zone) {
        const zoneCompleted = QuestSystem.onBossKilled(this.gameState.player, enemyDef.id, zone.element as ElementType);
        this.gameState.world.clearedZones = this.gameState.player.clearedZones;

        const newSkills = SkillSystem.unlockZoneSkills(this.gameState.player, zone.element);
        newSkills.forEach(s => this.events.emit('skill_unlocked', s));

        this.gameState.world.degradationLevel = this.gameState.player.clearedZones.length;
        this.applyWorldDegradation();

        if (zoneCompleted.length > 0) this.handleQuestCompletions(zoneCompleted);
        this.events.emit('zone_cleared', zone);
      }
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
      onComplete: () => { if (sprite.active) sprite.destroy(); },
    });
  }

  private playBossDeathSequence(
    sprite: Phaser.Physics.Arcade.Sprite,
    _ae: ActiveEnemy,
    enemyDef: Enemy,
  ) {
    const { width: W, height: H } = this.cameras.main;
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
      if (sprite.active) {
        this.tweens.add({
          targets: sprite,
          alpha: 0,
          scaleX: baseScale * 0.2,
          scaleY: baseScale * 0.2,
          duration: 800,
          ease: 'Power2',
          onComplete: () => { if (sprite.active) sprite.destroy(); },
        });
      }
    });

    const bossName = enemyDef.name;
    const nameLabel = this.add.text(W / 2, H / 2 - 30, bossName, {
      fontSize: '20px',
      color: '#ffff00',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 4,
    }).setScrollFactor(0).setOrigin(0.5).setDepth(200).setAlpha(0);
    this.bossDeathObjects.push(nameLabel);

    this.tweens.add({
      targets: nameLabel,
      alpha: 1,
      duration: 400,
      hold: 1600,
      yoyo: true,
      onComplete: () => { if (nameLabel.active) nameLabel.destroy(); },
    });
  }

  private onPlayerDeath() {
    if (this.isTraveling) return;
    this.isTraveling = true;
    this.gameState.player.deaths++;
    this.gameState.player.stats.hp = Math.floor(this.gameState.player.stats.maxHp * 0.5);

    this.physics.world.pause();
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.time.delayedCall(0, () => {
          this.gameState.player.position = { x: 0, y: 0 };
          this.performZoneTransition(this.gameState.player.currentZone, 0, 0);
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

  // ── PLAYER HIT FX ───────────────────────────────────────────
  // Feedback quand le joueur encaisse un coup : shake léger + flash rouge caméra
  // + burst de particules rouges. Appelé aux trois points de dégâts joueur
  // (mêlée charger, mêlée générique, projectile ennemi).
  private applyPlayerHitFx() {
    this.cameras.main.shake(150, 0.006);
    this.cameras.main.flash(100, 200, 0, 0, true);
    this.spawnHitParticles(this.player.x, this.player.y, undefined, 0xff3333);
  }

  private applyHitFeedback(sprite: Phaser.Physics.Arcade.Sprite, _ae: ActiveEnemy, _damage: number) {
    sprite.setTintFill(0xffffff);
    this.time.delayedCall(80, () => { if (sprite.active) this.resetEnemyTint(sprite); });
  }

  private checkStagger(sprite: Phaser.Physics.Arcade.Sprite, ae: ActiveEnemy, damage: number) {
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
    const count = 8;

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

  // hitIndex = index of this hit within the pattern (0-based, for dual/multi weapons)
  private spawnWeaponSwingVfx(
    fromX: number, fromY: number,
    toX: number, toY: number,
    weaponType: WeaponType | undefined,
    hitIndex = 0,
  ) {
    const angle = Math.atan2(toY - fromY, toX - fromX);

    switch (weaponType) {
      case WeaponType.DAGGER:
        // Silver, ultra-short, 150ms — instant stab feel (range 85 → radius ≈ 85 * 0.55)
        this.spawnSlashArcVfx(fromX, fromY, angle, 0xcccccc, { radius: 47, thickness: 4, halfArc: 0.55, duration: 150 });
        break;

      case WeaponType.DUAL_DAGGER: {
        // Each hit alternates left/right ±30° — double-stab rhythm (range 85 → radius ≈ 85 * 0.55)
        const ddOffset = hitIndex === 0 ? -0.52 : 0.52;
        this.spawnSlashArcVfx(fromX, fromY, angle + ddOffset, 0xcccccc, { radius: 46, thickness: 4, halfArc: 0.50, duration: 150 });
        break;
      }

      case WeaponType.SWORD:
        // Blue-steel, clean wide arc, 250ms (range 115 → radius ≈ 115 * 0.55)
        this.spawnSlashArcVfx(fromX, fromY, angle, 0x88aaff, { radius: 63, thickness: 6, halfArc: 0.85, duration: 250 });
        break;

      case WeaponType.DUAL_SWORD: {
        // 3 progressive arcs rotating ~20° each, alternating blue / white / blue
        // Range 105 → radius ≈ 105 * 0.55, full brightness for the flurry feel
        const dsAngle  = angle + (hitIndex - 1) * 0.35;
        const dsColor  = hitIndex === 1 ? 0xffffff : 0x88aaff;
        const dsRadius = 55 + hitIndex * 3;
        this.spawnSlashArcVfx(fromX, fromY, dsAngle, dsColor, { radius: dsRadius, thickness: 5, halfArc: 0.78, duration: 200, alpha: 1.0 });
        break;
      }

      case WeaponType.GREATSWORD: {
        // Enormous semi-circle + white impact flash (fires after 300ms windup)
        // Range 155 → radius ≈ 155 * 0.55, thickness ≈ range * 0.08, full brightness
        this.spawnSlashArcVfx(fromX, fromY, angle, 0xffffff, { radius: 85, thickness: 12, halfArc: 1.20, duration: 400, alpha: 1.0 });
        this.cameras.main.shake(60, 0.003);
        const gsFlash = this.add.circle(fromX, fromY, 24, 0xffffff, 0.85).setDepth(32);
        this.tweens.add({
          targets: gsFlash,
          scaleX: 0.1, scaleY: 0.1, alpha: 0,
          duration: 250,
          ease: 'Power3',
          onComplete: () => gsFlash.destroy(),
        });
        break;
      }

      case WeaponType.AXE:
        this.spawnAxeVfx(fromX, fromY, toX, toY, angle, 0xff6600);
        break;

      case WeaponType.HAMMER:
        this.spawnHammerVfx(toX, toY, 0xffdd00);
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
  private spawnAxeVfx(fromX: number, fromY: number, toX: number, toY: number, angle: number, color: number) {
    // Orange heavy arc — wider and thicker than sword, 300ms (range 125 → radius ≈ 125 * 0.55)
    this.spawnSlashArcVfx(fromX, fromY, angle, color, { radius: 69, thickness: 10, halfArc: 0.80, duration: 300 });
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

  // Marteau : onde de choc expansive (500ms) + flash jaune intense + débris projetés
  // Le plus lent, l'impact le plus massif — shake le plus fort
  private spawnHammerVfx(x: number, y: number, color: number) {
    // Large expanding shockwave ring — 500ms lifetime (range 105 → final radius ≈ 63px)
    const ring = this.add.graphics({ x, y }).setDepth(31);
    ring.lineStyle(8, color, 0.9);
    ring.strokeCircle(0, 0, 14);
    this.tweens.add({
      targets: ring,
      scaleX: 4.5, scaleY: 4.5,
      alpha: 0,
      duration: 500,
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
      duration: 380,
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
    this.cameras.main.shake(150, 0.010);
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
    const wv = this.cameras.main.worldView;
    return { x: this.player.x - wv.x, y: this.player.y - wv.y };
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
      fontFamily: 'monospace',
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

  private showDamageNumber(x: number, y: number, amount: number, isCrit: boolean, element?: ElementType, isEnemy = false) {
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
      fontSize: size, color, fontFamily: 'monospace',
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
  }

  private showHealNumber(x: number, y: number, amount: number) {
    const txt = this.add.text(x, y, `+${amount}`, {
      fontSize: '14px', color: '#44ff88', fontFamily: 'monospace',
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

    const gfx = this.add.graphics().setDepth(0);
    this.zoneGraphics = gfx;

    // Background — texture bitmap réelle si dispo pour cette zone (voir ASSET_SOURCES.md),
    // sinon fillRect procédural. Les TileSprites sont sous gfx (depth 0) donc les murs/
    // accents/highlights de téléport (dessinés dans gfx plus bas) restent bien par-dessus.
    const groundKey = `tileset_${zoneId}_ground`;
    if (this.textures.exists(groundKey)) {
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
      if (this.textures.exists(pathKey)) {
        for (const p of paths) {
          const pathTile = this.add.tileSprite(p.x, p.y, p.w, p.h, pathKey).setOrigin(0, 0).setDepth(-0.5);
          this.zoneTileSprites.push(pathTile);
        }
      } else {
        gfx.fillStyle(pathColor);
        for (const p of paths) gfx.fillRect(p.x, p.y, p.w, p.h);
      }
    }

    // Accent details (lava, water, crystals, etc.)
    if (accentColor) {
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
        fontSize: '9px', color: '#88ffaa', fontFamily: 'monospace',
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

      const texKey      = `enemy_${enemyId}`;
      const texKeyElite = `enemy_${enemyId}_elite`;
      const hasRealSprite = this.textures.exists(`enemy_${enemyId}_idle`);
      if (!hasRealSprite) {
        this.ensureTexture(texKey, enemyColor);
        this.ensureTexture(texKeyElite, eliteColor, 44, 44);
      }

      const count = Math.floor(def.spawnWeight * 4);
      for (let i = 0; i < count; i++) {
        const isElite = Math.random() < 0.20;
        const ex = Phaser.Math.Between(150, mapWidth - 150);
        const ey = Phaser.Math.Between(150, mapHeight - 150);

        // Sprites bitmap réels ont un cadre natif très rembourré de transparence (10-40%
        // de remplissage) — dimensionner l'affichage ET la hitbox sur le contenu opaque
        // réel (mesuré dans spriteGeometry.ts), pas sur le cadre entier, sinon le monstre
        // paraît minuscule et sa boîte de collision déborde largement de sa silhouette.
        const enemyBbox = ENEMY_SPRITE_BBOX[enemyId];
        const enemyFit = hasRealSprite && enemyBbox ? fitSpriteToContent(enemyBbox, isElite ? 46 : 36) : null;
        const dispSize = enemyFit ? enemyFit.dispSize : (isElite ? 44 : 28);
        const sprite = hasRealSprite
          ? this.physics.add.sprite(ex, ey, `enemy_${enemyId}_idle`)
          : this.physics.add.sprite(ex, ey, isElite ? texKeyElite : texKey);
        sprite.setDisplaySize(dispSize, dispSize);
        const body = sprite.body as Phaser.Physics.Arcade.Body;
        if (enemyFit && enemyBbox) {
          // DYNAMIC body: setSize()/setOffset() take SOURCE (pre-scale) pixels, re-scaled
          // by Phaser every tick — use the raw bbox, not the already-scaled fit values.
          body.setSize(enemyBbox.w, enemyBbox.h);
          body.setOffset(enemyBbox.x, enemyBbox.y);
        } else {
          body.setSize(dispSize - 8, dispSize - 8);
        }
        sprite.setDepth(4);
        // Resting scale, read back by attack-telegraph tweens (charge/burst_fan/dash_melee)
        // so their "scale pop" juice is relative to this sprite's actual size instead of
        // assuming a resting scale of 1.0 (true for the old procedural squares, not for
        // real sprites which are scaled up to make their padded frame content readable).
        sprite.setData('baseScale', sprite.scale);
        if (hasRealSprite) {
          sprite.setData('hasRealSprite', true);
          if (isElite) {
            sprite.setTint(eliteColor);
            sprite.setData('persistentTint', eliteColor);
          }
          sprite.play(`enemy_${enemyId}_idle`);
        }

        const active = CombatSystem.spawnEnemy(def, this.gameState.player.level);
        active.x       = ex;
        active.y       = ey;
        active.isElite = isElite;
        if (isElite) {
          active.currentHp = Math.floor(active.currentHp * 1.5);
          active.maxHp     = Math.floor(active.maxHp     * 1.5);
          active.stats     = { ...active.stats, baseAtk: Math.floor(active.stats.baseAtk * 1.4) };
        }
        sprite.name = active.instanceId;
        this.activeEnemies.set(active.instanceId, active);
        this.enemies.add(sprite);

        // HP bar (bg + foreground) — ancrée sur le sommet du contenu VISIBLE, pas sur le
        // cadre padded entier (pour les sprites très clairsemés, dispSize/2 seul ferait
        // flotter la barre bien au-dessus de la silhouette réelle).
        const contentTopGap = enemyFit ? dispSize / 2 - enemyFit.offsetY : dispSize / 2;
        const barY = ey - contentTopGap - 8;
        const barW = (enemyFit ? enemyFit.bodyW : dispSize) + 4;
        const barBg  = this.add.rectangle(ex, barY, barW, 6, 0x220000).setDepth(8);
        const barFg  = this.add.rectangle(
          ex - barW / 2, barY, barW, 4, isElite ? 0xff8800 : 0xff2222,
        ).setDepth(9).setOrigin(0, 0.5);
        this.enemyHpBars.set(active.instanceId, { bg: barBg, bar: barFg, baseW: barW });

        // Crown for elites
        if (isElite) {
          const crown = this.add.text(ex, ey - contentTopGap - 18, '♛', {
            fontSize: '12px', color: '#ffdd00',
            stroke: '#000000', strokeThickness: 2,
          }).setOrigin(0.5, 1).setDepth(10);
          this.enemyCrowns.set(active.instanceId, crown);
        }
      }
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

        const activeBoss = CombatSystem.spawnEnemy(bossDef, this.gameState.player.level);
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
        fontSize: '9px', color: '#ffee88', fontFamily: 'monospace',
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
      if (this.scene.isActive('InventoryScene')) { this.setPaused(false); this.scene.stop('InventoryScene'); return; }
      if (this.scene.isActive('SkillScene'))     { this.setPaused(false); this.scene.stop('SkillScene');     return; }
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
    // Debug: press G to add one of every weapon to the inventory (asset-review aid)
    this.giveAllWeaponsKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.G);
    // Remaining keys (attack, dash, inventory, skill menu, skill slots)
    // are all wired by applyKeyBindings() called right after setupInput().
  }

  private setupCamera() {
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
        fontSize: '8px', color: '#ffeeaa', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(4);
      this.zoneLabels.push(lootLabel);
    }

    // Single group overlap — sprite.name holds the lootable ID
    this.lootableOverlap = this.physics.add.overlap(
      this.player,
      this.lootableGroup,
      (_player, obj) => {
        this.nearbyLootable = (obj as Phaser.Physics.Arcade.Image).name;
      },
    );
  }

  private interactWithLootable(lootableId: string) {
    const lo = this.layout.lootables.find(l => l.id === lootableId);
    if (!lo) return;

    this.lootableLooted.add(lootableId);

    // Find and destroy the sprite
    const sprite = this.lootableGroup.getChildren().find(
      (c) => (c as Phaser.Physics.Arcade.Image).name === lootableId,
    ) as Phaser.Physics.Arcade.Image | undefined;
    if (sprite) sprite.destroy();

    // Gold reward
    const gold = lo.goldMin !== undefined
      ? Phaser.Math.Between(lo.goldMin, lo.goldMax ?? lo.goldMin)
      : 0;
    if (gold > 0) this.gameState.player.gold += gold;

    // Item reward (1 random from pool)
    if (lo.itemPool.length > 0) {
      const itemId = lo.itemPool[Math.floor(Math.random() * lo.itemPool.length)];
      const item   = ALL_ITEMS[itemId];
      if (item) {
        LootSystem.addToInventory(this.gameState.player, item, 1);
        this.events.emit('item_looted', { item, quantity: 1 });
        const typeKey = `notif.loot_${lo.type}` as const;
        this.events.emit('show_notification', `${t(typeKey)} ${localizeItem(item).name}${gold > 0 ? ` +${gold}G` : ''}`);
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

    const completions = QuestSystem.onItemCollected(this.gameState.player, lo.id, 1);
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

    // Destroy all tracked physics colliders/overlaps individually
    for (const c of this.physicsColliders) c.destroy();
    this.physicsColliders = [];
    for (const o of this.teleportOverlaps) o.destroy();
    this.teleportOverlaps = [];
    if (this.xpOrbOverlap) { this.xpOrbOverlap.destroy(); this.xpOrbOverlap = null; }
    if (this.lootableOverlap) { this.lootableOverlap.destroy(); this.lootableOverlap = null; }
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
    this.enemies.destroy(true);

    // BUG 4 fix: purge orphaned enemy cooldown keys to prevent unbounded dict growth
    for (const key of Object.keys(this.cooldowns)) {
      if (key.startsWith('atkcd_') || key.startsWith('melee_') || key.startsWith('bleed_')) {
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

  private performZoneTransition(zoneId: string, targetX: number, targetY: number) {
    try {
    this.gameState.player.currentZone = zoneId;
    this.gameState.player.position    = { x: targetX, y: targetY };
    this.layout = getZoneLayout(zoneId);

    this.destroyCurrentZoneObjects();

    const spawnX = targetX > 0 ? targetX : this.layout.spawnX;
    const spawnY = targetY > 0 ? targetY : this.layout.spawnY;
    this.player.setPosition(spawnX, spawnY);
    (this.player.body as Phaser.Physics.Arcade.Body).reset(spawnX, spawnY);

    this.nearbyNPC      = null;
    this.nearbyLootable = null;

    this.drawZoneMap();
    this.createEnemiesForZone(zoneId);
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
      const completed = QuestSystem.onZoneEntered(this.gameState.player, zoneId);
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
    pattern: { hits: AttackHit[]; cooldown: number; windupMs?: number; isProjectile?: boolean },
    comboConfig: ComboConfig,
    _now: number,
  ) {
    const windupMs = pattern.windupMs ?? 0;
    const finisher = comboConfig.finisher;

    // BLOCKER-E: heavyFinisherBonus multiplie le damageMultiplier pour GS/HAMMER/AXE
    const isHeavyWeapon = weaponType === WeaponType.GREATSWORD
      || weaponType === WeaponType.HAMMER
      || weaponType === WeaponType.AXE;
    const heavyFinisherFactor = isHeavyWeapon
      ? (1 + this.playerModifiers.heavyFinisherBonus / 100)
      : 1.0;

    if (pattern.isProjectile) {
      // BOW finisher : 3 flèches en éventail via le système de projectile existant.
      // BUG4 fix: passe le damageMultiplier de chaque hit à fireArrowProjectile.
      if (windupMs > 0) this.spawnWindupVfx(windupMs);
      finisher.hits.forEach(hit => {
        this.time.delayedCall(windupMs + hit.delay, () => {
          if (!this.isTraveling) this.fireArrowProjectile(hit.damageMultiplier);
        });
      });
    } else {
      if (windupMs > 0) this.spawnWindupVfx(windupMs);
      finisher.hits.forEach((hit, hitIndex) => {
        const effectiveDmgMult = hit.damageMultiplier * heavyFinisherFactor;
        const fireAt = windupMs + hit.delay;
        const doHit = () => {
          if (this.isTraveling) return;
          const tx = this.player.x + Math.cos(this.facingAngle) * hit.range * 0.7;
          const ty = this.player.y + Math.sin(this.facingAngle) * hit.range * 0.7;
          this.spawnWeaponSwingVfx(this.player.x, this.player.y, tx, ty, weaponType, hitIndex);
          this.executeHitInCone(hit.range, hit.halfArc, effectiveDmgMult);
        };
        if (fireAt === 0) doHit();
        else this.time.delayedCall(fireAt, doHit);
      });
    }

    // Effets spéciaux — appliqués au timing du dernier hit
    if (finisher.effect) {
      const lastHit  = finisher.hits[finisher.hits.length - 1];
      const effectAt = windupMs + (lastHit?.delay ?? 0);
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
          this.cameras.main.shake(120, 0.010);
        }
      };

      if (effectAt === 0) applyEffect();
      else this.time.delayedCall(effectAt, applyEffect);
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
      default:                      this.performAltFists(config);      break;
    }
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
      case 'inventory':
        if (this.scene.isActive('InventoryScene')) {
          this.setPaused(false); this.scene.stop('InventoryScene');
        } else {
          if (this.scene.isActive('SkillScene')) { this.setPaused(false); this.scene.stop('SkillScene'); }
          this.setPaused(true);
          this.scene.launch('InventoryScene', { gameScene: this });
        }
        break;
      case 'skills':
        if (this.scene.isActive('SkillScene')) {
          this.setPaused(false); this.scene.stop('SkillScene');
        } else {
          if (this.scene.isActive('InventoryScene')) { this.setPaused(false); this.scene.stop('InventoryScene'); }
          this.setPaused(true);
          this.scene.launch('SkillScene', { gameScene: this });
        }
        break;
    }
  }

  shutdown() {
    this.time.removeAllEvents();
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
