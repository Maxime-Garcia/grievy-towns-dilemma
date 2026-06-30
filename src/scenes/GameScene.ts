import Phaser from 'phaser';
import { GameState, ActiveEnemy, ElementType, Enemy } from '../types';
import { CombatSystem } from '../systems/CombatSystem';
import { LootSystem } from '../systems/LootSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { SkillSystem } from '../systems/SkillSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { ENEMY_MAP } from '../data/enemies';
import { ZONE_MAP } from '../data/zones';
import { NPC_MAP } from '../data/npcs';
import { getZoneLayout, ZoneLayout, LootableObject, WaterArea } from '../data/zoneMaps';
import { ALL_ITEMS } from '../data/items';
import { loadBindings, KeyBindings } from '../data/keyBindings';
import { t, localizeItem } from '../i18n';

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
  private dashKey!: Phaser.Input.Keyboard.Key;
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private skillMenuKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private speedBoostKey!: Phaser.Input.Keyboard.Key;
  private debugSpeedMult = 1;

  private xpOrbs!: Phaser.Physics.Arcade.Group;
  private readonly XP_ATTRACT_RANGE = 96;
  private lootableGroup!: Phaser.Physics.Arcade.StaticGroup;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private projectileCollider: Phaser.Physics.Arcade.Collider | null = null;
  private lootableLooted: Set<string> = new Set();

  // Zone-scoped objects destroyed/recreated on each transition
  private zoneGraphics: Phaser.GameObjects.Graphics | null = null;
  private zoneLabels: Phaser.GameObjects.Text[] = [];
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
  private isDashing = false;
  private lastDirX = 0;
  private lastDirY = 1;
  private isInDialogue = false;
  private isTraveling = false;
  private lastAutoSave = 0;
  private playtimeAccumulator = 0;
  private lastRegenTime = 0;

  // Interaction tracking
  private nearbyNPC: string | null = null;
  private nearbyLootable: string | null = null;
  private interactHint!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'GameScene' }); }

  init(data: { gameState?: GameState }) {
    this.gameState = data?.gameState ?? SaveSystem.createNewGame('Héros');
    // Spells non fonctionnels pour l'instant — vider les slots équipés
    this.gameState.player.equippedSkills = { slot1: null, slot2: null, slot3: null, slot4: null };
    this.isTraveling    = false;
    this.isInDialogue   = false;
    this.nearbyNPC      = null;
    this.nearbyLootable = null;
    this.activeEnemies  = new Map();
    this.enemyHpBars    = new Map();
    this.enemyCrowns    = new Map();
    this.lootableLooted = new Set();
    this.cooldowns           = {};
    this.dashCooldown        = 0;
    this.playtimeAccumulator = 0;
    this.lastAutoSave        = 0;
    this.isDashing      = false;
    this.lastDirX       = 0;
    this.lastDirY       = 1;
    // Reset zone-scoped refs on each scene start (full Phaser restart)
    this.zoneGraphics       = null;
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
    this.setupCamera();
    this.setupPhysics();
    this.createProjectileGroup();

    this.interactHint = this.add.text(0, 0, '[W] Talk', {
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
    if (this.isInDialogue || this.isTraveling) return;

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

    // Interaction hint
    const showHint = !!this.nearbyNPC || !!this.nearbyLootable;
    this.interactHint.setVisible(showHint);
    if (showHint) {
      const hintText = this.nearbyNPC ? '[W] Talk' : '[W] Loot';
      if (this.interactHint.text !== hintText) this.interactHint.setText(hintText);
      this.interactHint.setPosition(this.player.x, this.player.y - 28);
    }

    SkillSystem.tickCooldowns(this.cooldowns, dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);

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

  // ── MOVEMENT ─────────────────────────────────────────────────

  private handleMovement(dt: number) {
    if (this.isDashing) return; // Don't override velocity during dash

    this.debugSpeedMult = this.speedBoostKey?.isDown ? 5 : 1;

    const player = this.gameState.player;
    const speed  = (90 + player.stats.spd * 4) * this.debugSpeedMult;
    const body   = this.player.body as Phaser.Physics.Arcade.Body;
    let vx = 0, vy = 0;

    if (this.wasd.left.isDown  || this.cursors.left.isDown)  vx = -speed;
    if (this.wasd.right.isDown || this.cursors.right.isDown) vx =  speed;
    if (this.wasd.up.isDown    || this.cursors.up.isDown)    vy = -speed;
    if (this.wasd.down.isDown  || this.cursors.down.isDown)  vy =  speed;

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    body.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      this.lastDirX = vx;
      this.lastDirY = vy;
      this.player.setFlipX(vx < 0);
    }
  }

  // ── DASH ────────────────────────────────────────────────────

  private handleDash() {
    if (this.dashCooldown > 0) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Use current velocity direction, or fall back to last known direction
    let dx = body.velocity.x;
    let dy = body.velocity.y;
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

    this.player.setAlpha(0.5);
    this.tweens.add({
      targets: this.player,
      alpha: 1,
      duration: 300,
      onComplete: () => { this.isDashing = false; },
    });

    this.cooldowns['dash'] = 1.5;
  }

  // ── SKILLS & ATTACK ──────────────────────────────────────────

  private handleAttackInput() {
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      if (this.nearbyNPC && !this.isInDialogue) {
        this.startNPCDialogue(this.nearbyNPC);
      } else if (this.nearbyLootable) {
        this.interactWithLootable(this.nearbyLootable);
      } else {
        this.performBasicAttack();
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.dashKey)) {
      this.handleDash();
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
    const nearest = this.findNearestEnemy(80);
    if (!nearest) return;

    const activeEnemy = this.activeEnemies.get(nearest.name);
    if (!activeEnemy) return;

    const result = CombatSystem.playerAttack(this.gameState.player, activeEnemy);
    this.showDamageNumber(nearest.x, nearest.y - 20, result.damage, result.isCrit);

    if (result.isKill) this.onEnemyKilled(activeEnemy, nearest);
  }

  private activateSkill(skillId: string) {
    const skill = SkillSystem.getSkill(skillId);
    if (!skill) return;
    if (!SkillSystem.canUseSkill(this.gameState.player, skillId, this.cooldowns)) return;

    const nearest = this.findNearestEnemy(skill.range ?? 200);
    const activeEnemy = nearest ? this.activeEnemies.get(nearest.name) : undefined;

    const result = CombatSystem.playerSkill(this.gameState.player, skill, activeEnemy);
    if (result) {
      if (result.damage > 0 && nearest) {
        if (skill.isProjectile) {
          this.spawnCosmeticProjectile(this.player.x, this.player.y, nearest.x, nearest.y, skill.element);
        }
        this.showDamageNumber(nearest.x, nearest.y - 20, result.damage, result.isCrit, skill.element);
        if (result.isKill) this.onEnemyKilled(activeEnemy!, nearest);
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
    if (paused) {
      this.physics.world.pause();
      this.scene.pause();
    } else {
      this.physics.world.resume();
      this.scene.resume();
    }
  }

  public openInventory() {
    if (this.scene.isActive('InventoryScene')) return;
    this.scene.launch('InventoryScene', { gameScene: this });
  }

  public openSkills() {
    if (this.scene.isActive('SkillScene')) return;
    this.scene.launch('SkillScene', { gameScene: this });
  }

  public goToMainMenu() {
    if (this.isTraveling) return;
    this.isTraveling = true;
    this.physics.world.pause();

    // Stop overlay scenes immediately
    for (const key of ['PauseScene', 'InventoryScene', 'SkillScene', 'DialogueScene', 'ShopScene']) {
      if (this.scene.isActive(key) || this.scene.isPaused(key)) this.scene.stop(key);
    }

    // GameScene may be paused (called from PauseScene via scene.pause()).
    // camera.update() only runs on RUNNING scenes, so FADE_OUT_COMPLETE would
    // never fire if we start the fade while paused. Resume the scene first.
    // scene.resume() is *queued* (takes effect next frame), so we wrap the
    // fade in delayedCall(0) — it fires after processQueue() in that same frame,
    // when GameScene is actually running again.
    if (this.sys.isPaused()) this.scene.resume();

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
    this.attackKey = kb.addKey(b.attack);
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
      if (this.scene.isActive('InventoryScene')) this.scene.stop('InventoryScene');
      else this.scene.launch('InventoryScene', { gameScene: this });
    });
    this.skillMenuKey.on('down', () => {
      if (this.scene.isActive('SkillScene')) this.scene.stop('SkillScene');
      else this.scene.launch('SkillScene', { gameScene: this });
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
      },
    });
  }

  // ── ENEMY AI ─────────────────────────────────────────────────

  private tickEnemyAI(dt: number) {
    const px = this.player.x;
    const py = this.player.y;

    this.activeEnemies.forEach((ae, instanceId) => {
      const sprite = this.enemies.getChildren().find(
        (c) => (c as Phaser.Physics.Arcade.Sprite).name === instanceId,
      ) as Phaser.Physics.Arcade.Sprite | undefined;
      if (!sprite || !sprite.active) return;

      const body = sprite.body as Phaser.Physics.Arcade.Body;
      const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, px, py);
      const def = ENEMY_MAP[ae.enemyId] as Enemy | undefined;
      if (!def) return;

      const behavior   = def.behavior ?? 'chaser';
      const aggroRange = def.aggroRange ?? 220;
      const attackRange = def.attackRange ?? (behavior === 'ranged' ? 300 : 50);
      const moveSpeed  = def.moveSpeed ?? 90;

      switch (behavior) {
        case 'patrol': {
          const patrolRadius = def.patrolRadius ?? 120;
          if (!sprite.getData('originX')) {
            sprite.setData('originX', sprite.x);
            sprite.setData('originY', sprite.y);
          }
          if (dist < aggroRange) {
            // Aggro : fonce vers le joueur
            this.moveEnemyToward(body, sprite, px, py, moveSpeed);
          } else {
            // Patrouille autour du point de spawn
            const originX = sprite.getData('originX') as number;
            const originY = sprite.getData('originY') as number;
            const t = (this.time.now / 1000) * 0.5;
            const seed = parseFloat(instanceId.slice(-3) || '0');
            const targetX = originX + Math.cos(t + seed) * patrolRadius;
            const targetY = originY + Math.sin(t + seed) * patrolRadius;
            this.moveEnemyToward(body, sprite, targetX, targetY, moveSpeed * 0.5);
          }
          break;
        }

        case 'ranged': {
          const projectileCdKey = `proj_${instanceId}`;
          if (!this.cooldowns[projectileCdKey]) this.cooldowns[projectileCdKey] = 0;

          if (dist < aggroRange) {
            if (dist < attackRange * 0.5) {
              // Trop près — reculer dans la direction opposée au joueur
              const awayAngle = Math.atan2(sprite.y - py, sprite.x - px);
              body.setVelocity(
                Math.cos(awayAngle) * moveSpeed,
                Math.sin(awayAngle) * moveSpeed,
              );
            } else if (dist > attackRange * 0.9) {
              // Trop loin — s'approcher
              this.moveEnemyToward(body, sprite, px, py, moveSpeed * 0.4);
            } else {
              body.setVelocity(0, 0);
            }

            // Tir de projectile
            if (this.cooldowns[projectileCdKey] <= 0) {
              this.spawnProjectile(
                sprite.x, sprite.y, px, py,
                def.element as ElementType | undefined, ae.stats.baseAtk, false,
              );
              this.cooldowns[projectileCdKey] = 2.5;
            }
          } else {
            body.setVelocity(0, 0);
          }
          break;
        }

        case 'charger': {
          const chargeKey = `charge_${instanceId}`;
          const chargeState = (sprite.getData(chargeKey) as string | null) ?? 'idle';

          if (chargeState === 'charging') {
            if (dist < 45) {
              body.setVelocity(0, 0);
              sprite.setData(chargeKey, 'cooldown');
              const atkKey = `atk_${instanceId}`;
              if (!this.cooldowns[atkKey] || this.cooldowns[atkKey] <= 0) {
                const result = CombatSystem.enemyAttack(ae, this.gameState.player);
                if (result.damage > 0) {
                  this.showDamageNumber(this.player.x, this.player.y - 20, result.damage, false, undefined, true);
                  this.cameras.main.shake(100, 0.005);
                }
                this.events.emit('player_update', this.gameState.player);
                this.cooldowns[atkKey] = 1.5;
                if (result.isKill) this.onPlayerDeath();
              }
              this.time.delayedCall(1500, () => {
                if (sprite.active) sprite.setData(chargeKey, 'idle');
              });
            }
          } else if (chargeState === 'idle' && dist < aggroRange) {
            sprite.setTint(0xffffff);
            sprite.setData(chargeKey, 'preparing');
            this.time.delayedCall(600, () => {
              if (!sprite.active) return;
              sprite.clearTint();
              sprite.setData(chargeKey, 'charging');
              const chargeAngle = Math.atan2(py - sprite.y, px - sprite.x);
              body.setVelocity(
                Math.cos(chargeAngle) * moveSpeed * 3,
                Math.sin(chargeAngle) * moveSpeed * 3,
              );
              this.time.delayedCall(800, () => {
                if (sprite.active) {
                  body.setVelocity(0, 0);
                  sprite.setData(chargeKey, 'cooldown');
                  this.time.delayedCall(2000, () => {
                    if (sprite.active) sprite.setData(chargeKey, 'idle');
                  });
                }
              });
            });
          }
          break;
        }

        case 'summoner': {
          if (dist < aggroRange) {
            this.moveEnemyToward(body, sprite, px, py, moveSpeed * 0.4);
            const summonKey = `summon_${instanceId}`;
            if (!this.cooldowns[summonKey] || this.cooldowns[summonKey] <= 0) {
              // Placeholder : invocation visuelle, pas de vrai add sans refactor majeur
              this.cooldowns[summonKey] = 8;
            }
          } else {
            body.setVelocity(0, 0);
          }
          break;
        }

        case 'chaser':
        default: {
          if (dist < aggroRange) {
            this.moveEnemyToward(body, sprite, px, py, moveSpeed);
          } else {
            body.setVelocity(0, 0);
          }
          break;
        }
      }

      // Attaque mêlée pour tous les non-ranged
      if (behavior !== 'ranged' && dist < 50) {
        const atkKey = `atk_${instanceId}`;
        if (!this.cooldowns[atkKey] || this.cooldowns[atkKey] <= 0) {
          const result = CombatSystem.enemyAttack(ae, this.gameState.player);
          if (result.damage > 0) {
            this.showDamageNumber(this.player.x, this.player.y - 20, result.damage, false, undefined, true);
            this.cameras.main.shake(100, 0.005);
          }
          this.events.emit('player_update', this.gameState.player);
          this.cooldowns[atkKey] = 1.2;
          if (result.isKill) this.onPlayerDeath();
        }
      }

      // Update HP bar position and fill
      const barData = this.enemyHpBars.get(instanceId);
      if (barData) {
        const dispH = sprite.displayHeight;
        const barY  = sprite.y - dispH / 2 - 8;
        const hpPct = Math.max(0, ae.currentHp / ae.maxHp);
        barData.bg.setPosition(sprite.x, barY);
        barData.bar.setPosition(sprite.x - barData.baseW / 2, barY);
        barData.bar.setSize(Math.max(1, barData.baseW * hpPct), 4);
      }
      const crown = this.enemyCrowns.get(instanceId);
      if (crown) {
        crown.setPosition(sprite.x, sprite.y - sprite.displayHeight / 2 - 18);
      }
    });
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
      this.time.delayedCall(80, () => { if (sprite.active) sprite.clearTint(); });
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
        const damage = (proj.getData('damage') as number) ?? 8;
        proj.destroy();
        this.gameState.player.stats.hp = Math.max(
          0,
          this.gameState.player.stats.hp - damage,
        );
        this.showDamageNumber(this.player.x, this.player.y - 20, damage, false, undefined, true);
        this.cameras.main.shake(80, 0.004);
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

    this.activeEnemies.delete(activeEnemy.instanceId);

    const barData = this.enemyHpBars.get(activeEnemy.instanceId);
    if (barData) { barData.bg.destroy(); barData.bar.destroy(); this.enemyHpBars.delete(activeEnemy.instanceId); }
    const crown = this.enemyCrowns.get(activeEnemy.instanceId);
    if (crown) { crown.destroy(); this.enemyCrowns.delete(activeEnemy.instanceId); }

    // XP bonus for elites
    const xpMult = activeEnemy.isElite ? 2.5 : 1;

    sprite.destroy();

    const loot = LootSystem.rollLoot(
      enemyDef.loot, enemyDef.baseGold, enemyDef.baseXp,
      activeEnemy.level, this.gameState.player,
    );

    this.gameState.player.gold += loot.gold;
    for (const { item, quantity } of loot.items) {
      LootSystem.addToInventory(this.gameState.player, item, quantity);
      this.events.emit('item_looted', { item, quantity });
    }

    this.spawnXpOrbs(sprite.x, sprite.y, Math.floor(loot.xp * xpMult));

    const questCompleted = QuestSystem.onEnemyKilled(this.gameState.player, activeEnemy.enemyId);
    for (const itemLoot of loot.items) {
      QuestSystem.onItemCollected(this.gameState.player, itemLoot.item.id, itemLoot.quantity);
    }
    if (questCompleted.length > 0) this.handleQuestCompletions(questCompleted);

    if (enemyDef.isBoss) {
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

  private showDamageNumber(x: number, y: number, amount: number, isCrit: boolean, element?: ElementType, isEnemy = false) {
    const ELEMENT_COLORS: Partial<Record<ElementType, string>> = {
      [ElementType.FIRE]: '#ff6622',
      [ElementType.WATER]: '#4488ff',
      [ElementType.LIGHTNING]: '#ffee22',
      [ElementType.ICE]: '#aaeeff',
      [ElementType.EARTH]: '#aa8844',
      [ElementType.WIND]: '#aaffcc',
      [ElementType.DARK]: '#aa44ff',
      [ElementType.DIVINE]: '#ffd700',
    };
    const color = isEnemy ? '#ff4444' : (element ? ELEMENT_COLORS[element] ?? '#ffffff' : '#ffffff');
    const size  = isCrit ? '18px' : '14px';

    const txt = this.add.text(x, y, isCrit ? `${amount}!` : `${amount}`, {
      fontSize: size, color, fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(100);

    this.tweens.add({ targets: txt, y: y - 40, alpha: 0, duration: 900, onComplete: () => txt.destroy() });
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

    // Background
    gfx.fillStyle(bgColor);
    gfx.fillRect(0, 0, mapWidth, mapHeight);

    // Paths (drawn over background, below walls)
    if (paths.length > 0) {
      gfx.fillStyle(pathColor);
      for (const p of paths) gfx.fillRect(p.x, p.y, p.w, p.h);
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
    this.ensureTexture('player', 0x44aaff);

    const pos = this.gameState.player.position;
    const startX = (pos.x > 0) ? pos.x : this.layout.spawnX;
    const startY = (pos.y > 0) ? pos.y : this.layout.spawnY;

    this.player = this.physics.add.sprite(startX, startY, 'player');
    this.player.setDisplaySize(28, 28);
    this.player.setBodySize(24, 24);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);
  }

  private createEnemiesForZone(zoneId: string) {
    this.enemies = this.physics.add.group();
    const zone = ZONE_MAP[zoneId];
    if (!zone || zone.enemies.length === 0) return;

    const enemyColor = ZONE_ENEMY_COLORS[zoneId] ?? 0xaa4444;
    const eliteColor = Phaser.Display.Color.IntegerToColor(enemyColor).brighten(30).color;
    const { mapWidth, mapHeight } = this.layout;

    for (const enemyId of zone.enemies) {
      const def = ENEMY_MAP[enemyId];
      if (!def || def.isBoss) continue;

      const texKey      = `enemy_${enemyId}`;
      const texKeyElite = `enemy_${enemyId}_elite`;
      this.ensureTexture(texKey, enemyColor);
      this.ensureTexture(texKeyElite, eliteColor, 44, 44);

      const count = Math.floor(def.spawnWeight * 4);
      for (let i = 0; i < count; i++) {
        const isElite = Math.random() < 0.20;
        const ex = Phaser.Math.Between(150, mapWidth - 150);
        const ey = Phaser.Math.Between(150, mapHeight - 150);

        const sprite = this.physics.add.sprite(ex, ey, isElite ? texKeyElite : texKey);
        const dispSize = isElite ? 44 : 28;
        sprite.setDisplaySize(dispSize, dispSize);
        (sprite.body as Phaser.Physics.Arcade.Body).setSize(dispSize - 4, dispSize - 4);
        sprite.setDepth(4);

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

        // HP bar (bg + foreground)
        const barW = dispSize + 4;
        const barBg  = this.add.rectangle(ex, ey - dispSize / 2 - 8, barW, 6, 0x220000).setDepth(8);
        const barFg  = this.add.rectangle(
          ex - barW / 2, ey - dispSize / 2 - 8, barW, 4, isElite ? 0xff8800 : 0xff2222,
        ).setDepth(9).setOrigin(0, 0.5);
        this.enemyHpBars.set(active.instanceId, { bg: barBg, bar: barFg, baseW: barW });

        // Crown for elites
        if (isElite) {
          const crown = this.add.text(ex, ey - dispSize / 2 - 18, '♛', {
            fontSize: '12px', color: '#ffdd00',
            stroke: '#000000', strokeThickness: 2,
          }).setOrigin(0.5, 1).setDepth(10);
          this.enemyCrowns.set(active.instanceId, crown);
        }
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

      const color = NPC_COLORS[npc.id] ?? 0x44aacc;
      const texKey = `npc_${npc.id}`;
      this.ensureTexture(texKey, color);

      const sprite = this.physics.add.staticImage(pos.x, pos.y, texKey);
      sprite.setDisplaySize(28, 28);
      (sprite.body as Phaser.Physics.Arcade.StaticBody).setSize(24, 24);
      sprite.setDepth(4);
      sprite.setData('npcId', npc.id);
      sprite.refreshBody();
      this.npcs.add(sprite);

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
    // ESC → pause menu (stored ref, cleaned up by shutdown's removeAllKeys)
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => {
      if (!this.isInDialogue && !this.scene.isActive('PauseScene')) {
        this.setPaused(true);
        this.scene.launch('PauseScene', { gameScene: this });
      }
    });
    // Debug: hold B to move at 5× speed
    this.speedBoostKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);
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

      const lootLabel = this.add.text(lo.x, lo.y - 16, lo.type, {
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
    // Destroy all tracked physics colliders/overlaps individually
    for (const c of this.physicsColliders) c.destroy();
    this.physicsColliders = [];
    for (const o of this.teleportOverlaps) o.destroy();
    this.teleportOverlaps = [];
    if (this.xpOrbOverlap) { this.xpOrbOverlap.destroy(); this.xpOrbOverlap = null; }
    if (this.lootableOverlap) { this.lootableOverlap.destroy(); this.lootableOverlap = null; }
    if (this.projectileCollider) { this.projectileCollider.destroy(); this.projectileCollider = null; }

    // Projectiles group
    if (this.projectiles) { this.projectiles.destroy(true); }

    // Zone graphics (map background, paths, walls, teleport highlights)
    if (this.zoneGraphics) {
      this.zoneGraphics.destroy();
      this.zoneGraphics = null;
    }

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

    // NPCs
    this.npcs.destroy(true);

    // Wall group
    this.wallGroup.destroy(true);

    // Lootables — do NOT reset lootableLooted (persists between transitions)
    this.lootableGroup.destroy(true);

    // XP orbs — destroy remaining orbs
    this.xpOrbs.destroy(true);
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

  shutdown() {
    this.time.removeAllEvents();
    this.input.keyboard?.removeAllKeys(true);
    // Do NOT call events.removeAllListeners() — it strips Phaser's internal
    // lifecycle listeners (physics, tweens, input) registered on sys.events,
    // which prevents the scene from resuming correctly.
  }
}
