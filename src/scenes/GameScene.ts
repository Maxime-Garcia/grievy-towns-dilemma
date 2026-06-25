import Phaser from 'phaser';
import { GameState, ActiveEnemy, ElementType } from '../types';
import { CombatSystem } from '../systems/CombatSystem';
import { LootSystem } from '../systems/LootSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { SkillSystem } from '../systems/SkillSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { ENEMY_MAP } from '../data/enemies';
import { ZONE_MAP } from '../data/zones';
import { NPC_MAP } from '../data/npcs';

// Tile size in pixels
const TILE = 32;

export class GameScene extends Phaser.Scene {
  public  gameState!: GameState;

  private player!: Phaser.Physics.Arcade.Sprite;
  private enemies!: Phaser.Physics.Arcade.Group;
  private npcs!: Phaser.Physics.Arcade.StaticGroup;
  private map!: Phaser.Tilemaps.Tilemap;
  private layers: Phaser.Tilemaps.TilemapLayer[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  // AZERTY: Z(haut) Q(gauche) S(bas) D(droite)
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  // Compétences AZERTY: A / E / R / F
  private skillKeys!: { a: Phaser.Input.Keyboard.Key; e: Phaser.Input.Keyboard.Key; r: Phaser.Input.Keyboard.Key; f: Phaser.Input.Keyboard.Key };
  private attackKey!: Phaser.Input.Keyboard.Key;
  private dashKey!: Phaser.Input.Keyboard.Key;
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private skillMenuKey!: Phaser.Input.Keyboard.Key;

  private xpOrbs!: Phaser.Physics.Arcade.Group;
  private readonly XP_ATTRACT_RANGE = 96;

  private activeEnemies: Map<string, ActiveEnemy> = new Map();
  private cooldowns: Record<string, number> = {};
  private dashCooldown = 0;
  private isDashing = false;
  private isInDialogue = false;
  private lastAutoSave = 0;
  private playtimeAccumulator = 0;
  private lastRegenTime = 0;

  constructor() { super({ key: 'GameScene' }); }

  init(data: { gameState?: GameState }) {
    this.gameState = data?.gameState ?? SaveSystem.createNewGame('Héros');
  }

  create() {
    const zone = ZONE_MAP[this.gameState.player.currentZone] ?? ZONE_MAP['grievy_town'];
    this.loadZoneMap(zone.mapKey);
    this.createPlayer();
    this.createEnemiesForZone(zone.id);
    this.createNPCsForZone(zone.id);
    this.createXpOrbsGroup();
    this.setupInput();
    this.setupCamera();
    this.setupPhysics();

    // Launch persistent UI overlay
    this.scene.launch('UIScene', { gameScene: this });

    // Notify quest system of zone entry
    const completed = QuestSystem.onZoneEntered(this.gameState.player, zone.id);
    if (completed.length > 0) this.handleQuestCompletions(completed);

    this.applyWorldDegradation();
    this.events.emit('zone_entered', zone);
  }

  update(time: number, delta: number) {
    if (this.isInDialogue) return;

    const dt = delta / 1000;
    this.playtimeAccumulator += dt;
    this.gameState.player.playtime += dt;

    this.handleMovement(dt);
    this.handleSkillInput();
    this.handleAttackInput();

    SkillSystem.tickCooldowns(this.cooldowns, dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);

    this.tickEnemyAI(dt);
    this.tickXpOrbs();

    // Out of combat regen (every 2s when no enemy aggro)
    if (this.activeEnemies.size === 0 && time - this.lastRegenTime > 2000) {
      this.lastRegenTime = time;
      CombatSystem.outOfCombatRegen(this.gameState.player);
    }

    // Auto-save every 3 minutes
    if (this.playtimeAccumulator - this.lastAutoSave > 180) {
      this.lastAutoSave = this.playtimeAccumulator;
      SaveSystem.save(this.gameState, this.gameState.saveSlot);
    }

    this.events.emit('player_update', this.gameState.player);
  }

  // ── MOVEMENT ─────────────────────────────────────────────────

  private handleMovement(dt: number) {
    const player   = this.gameState.player;
    const speed    = 90 + player.stats.spd * 4;
    const body     = this.player.body as Phaser.Physics.Arcade.Body;
    let vx = 0, vy = 0;

    if (this.wasd.left.isDown  || this.cursors.left.isDown)  vx = -speed;
    if (this.wasd.right.isDown || this.cursors.right.isDown) vx =  speed;
    if (this.wasd.up.isDown    || this.cursors.up.isDown)    vy = -speed;
    if (this.wasd.down.isDown  || this.cursors.down.isDown)  vy =  speed;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    body.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      this.player.setFlipX(vx < 0);
      this.player.play('player_walk', true);
    } else {
      this.player.play('player_idle', true);
    }
  }

  // ── DASH ────────────────────────────────────────────────────

  private handleDash() {
    if (this.dashCooldown > 0) return;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const vel  = body.velocity;
    if (vel.length() < 10) return;

    this.dashCooldown = 1.5;
    this.isDashing = true;

    const norm = vel.normalize().scale(280);
    body.setVelocity(norm.x, norm.y);

    this.player.setAlpha(0.5);
    this.time.delayedCall(300, () => {
      this.isDashing = false;
      this.player.setAlpha(1);
    });

    this.cooldowns['dash'] = 1.5;
  }

  // ── SKILLS & ATTACK ──────────────────────────────────────────

  private handleAttackInput() {
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.performBasicAttack();
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

    const activeEnemy = this.activeEnemies.get(nearest.instanceId);
    if (!activeEnemy) return;

    const result = CombatSystem.playerAttack(this.gameState.player, activeEnemy);
    this.showDamageNumber(nearest.x, nearest.y - 20, result.damage, result.isCrit);

    if (result.isKill) {
      this.onEnemyKilled(activeEnemy, nearest);
    }
  }

  private activateSkill(skillId: string) {
    const skill = SkillSystem.getSkill(skillId);
    if (!skill) return;
    if (!SkillSystem.canUseSkill(this.gameState.player, skillId, this.cooldowns)) return;

    const nearest = this.findNearestEnemy(skill.range ?? 200);
    const activeEnemy = nearest ? this.activeEnemies.get(nearest.instanceId) : undefined;

    const result = CombatSystem.playerSkill(this.gameState.player, skill, activeEnemy);
    if (result) {
      if (result.damage > 0 && nearest) {
        this.showDamageNumber(nearest.x, nearest.y - 20, result.damage, result.isCrit, skill.element);
        if (result.isKill) this.onEnemyKilled(activeEnemy!, nearest);
      }
      if (result.damage === 0 && skill.effect?.healPercent) {
        this.showHealNumber(this.player.x, this.player.y - 20, Math.floor(this.gameState.player.stats.maxHp * (skill.effect.healPercent ?? 0)));
      }
    }

    SkillSystem.startCooldown(this.cooldowns, skillId);
  }

  // ── ENEMY AI ─────────────────────────────────────────────────

  private tickEnemyAI(dt: number) {
    this.enemies.children.each((go: Phaser.GameObjects.GameObject) => {
      const sprite = go as Phaser.Physics.Arcade.Sprite;
      const active = this.activeEnemies.get(sprite.name);
      if (!active) return;

      const enemyDef = ENEMY_MAP[active.enemyId];
      if (!enemyDef) return;

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);

      if (dist < enemyDef.aggroRange) {
        const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
        const spd   = enemyDef.moveSpeed;
        (sprite.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);

        if (dist < enemyDef.attackRange) {
          (sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
          if (!sprite.getData('attackTimer') || sprite.getData('attackTimer') <= 0) {
            const result = CombatSystem.enemyAttack(active, this.gameState.player);
            if (result.damage > 0) {
              this.showDamageNumber(this.player.x, this.player.y - 20, result.damage, false, undefined, true);
              this.cameras.main.shake(100, 0.005);
            }
            if (result.isKill) this.onPlayerDeath();
            sprite.setData('attackTimer', 1.2);
          }
        }
      } else {
        (sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }

      const timer = (sprite.getData('attackTimer') ?? 0) - dt;
      sprite.setData('attackTimer', Math.max(0, timer));
    });
  }

  // ── EVENTS ──────────────────────────────────────────────────

  private onEnemyKilled(activeEnemy: ActiveEnemy, sprite: Phaser.Physics.Arcade.Sprite) {
    const enemyDef = ENEMY_MAP[activeEnemy.enemyId];
    if (!enemyDef) return;

    this.activeEnemies.delete(activeEnemy.instanceId);
    sprite.destroy();

    const loot = LootSystem.rollLoot(
      enemyDef.loot,
      enemyDef.baseGold,
      enemyDef.baseXp,
      activeEnemy.level,
      this.gameState.player
    );

    // Add gold
    this.gameState.player.gold += loot.gold;

    // Add items to inventory
    for (const { item, quantity } of loot.items) {
      LootSystem.addToInventory(this.gameState.player, item, quantity);
      this.events.emit('item_looted', { item, quantity });
    }

    // Spawn XP orbs — collectés par magnétisme, XP accordé à l'overlap
    this.spawnXpOrbs(sprite.x, sprite.y, loot.xp);

    // Quest tracking
    const questCompleted = QuestSystem.onEnemyKilled(this.gameState.player, activeEnemy.enemyId);
    for (const itemLoot of loot.items) {
      QuestSystem.onItemCollected(this.gameState.player, itemLoot.item.id, itemLoot.quantity);
    }
    if (questCompleted.length > 0) this.handleQuestCompletions(questCompleted);

    // Boss killed?
    if (enemyDef.isBoss) {
      const zone = Object.values(ZONE_MAP).find(z => z.bossId === enemyDef.id);
      if (zone) {
        const zoneCompleted = QuestSystem.onBossKilled(this.gameState.player, enemyDef.id, zone.element as ElementType);
        this.gameState.world.clearedZones = this.gameState.player.clearedZones;

        const newSkills = SkillSystem.unlockZoneSkills(this.gameState.player, zone.element);
        newSkills.forEach(s => this.events.emit('skill_unlocked', s));

        const degradation = this.gameState.player.clearedZones.length;
        this.gameState.world.degradationLevel = degradation;
        this.applyWorldDegradation();

        if (zoneCompleted.length > 0) this.handleQuestCompletions(zoneCompleted);
        this.events.emit('zone_cleared', zone);
      }
    }

    // Hidden skill checks
    const hidden = SkillSystem.checkHiddenUnlocks(this.gameState.player);
    hidden.forEach(s => this.events.emit('skill_unlocked', s));
  }

  private onPlayerDeath() {
    this.gameState.player.deaths++;
    this.gameState.player.stats.hp = Math.floor(this.gameState.player.stats.maxHp * 0.5);

    this.cameras.main.fade(500, 0, 0, 0);
    this.time.delayedCall(600, () => {
      this.scene.restart({ gameState: this.gameState });
    });
  }

  private handleQuestCompletions(questIds: string[]) {
    questIds.forEach(id => this.events.emit('quest_completed', id));
  }

  // ── NPC INTERACTION ──────────────────────────────────────────

  private setupNPCInteraction(npcSprite: Phaser.Physics.Arcade.Image, npcId: string) {
    this.physics.add.overlap(this.player, npcSprite, () => {
      if (!this.isInDialogue && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
        const npc = NPC_MAP[npcId];
        if (!npc) return;
        this.isInDialogue = true;
        this.scene.launch('DialogueScene', {
          npc,
          player: this.gameState.player,
          onClose: () => { this.isInDialogue = false; }
        });
      }
    });
  }

  // ── WORLD DEGRADATION ────────────────────────────────────────

  private applyWorldDegradation() {
    const deg = this.gameState.world.degradationLevel;
    const saturation = 1.0 - (deg / 6) * 0.9;
    this.cameras.main.setPostPipeline?.('saturation' as any);

    const ambient = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xffffff),
      Phaser.Display.Color.ValueToColor(0x888888),
      6,
      deg
    );
    this.cameras.main.setBackgroundColor(
      Phaser.Display.Color.GetColor(ambient.r, ambient.g, ambient.b)
    );
  }

  // ── HELPERS ─────────────────────────────────────────────────

  private findNearestEnemy(maxRange: number): Phaser.Physics.Arcade.Sprite | undefined {
    let nearest: Phaser.Physics.Arcade.Sprite | undefined;
    let minDist = maxRange;

    this.enemies.children.each((go: Phaser.GameObjects.GameObject) => {
      const sprite = go as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (dist < minDist) { minDist = dist; nearest = sprite; }
    });

    return nearest;
  }

  private showDamageNumber(
    x: number, y: number, amount: number,
    isCrit: boolean, element?: ElementType, isEnemy = false
  ) {
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

    this.tweens.add({
      targets: txt,
      y: y - 40,
      alpha: 0,
      duration: 900,
      onComplete: () => txt.destroy(),
    });
  }

  private showHealNumber(x: number, y: number, amount: number) {
    const txt = this.add.text(x, y, `+${amount}`, {
      fontSize: '14px', color: '#44ff88', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(100);
    this.tweens.add({
      targets: txt, y: y - 40, alpha: 0, duration: 900,
      onComplete: () => txt.destroy(),
    });
  }

  // ── SETUP ────────────────────────────────────────────────────

  private loadZoneMap(mapKey: string) {
    try {
      this.map = this.make.tilemap({ key: mapKey });
      const tileset = this.map.addTilesetImage('tiles', 'tiles_town');
      if (tileset) {
        const ground = this.map.createLayer('Ground', tileset, 0, 0);
        const above  = this.map.createLayer('Above',  tileset, 0, 0);
        if (ground) { ground.setCollisionByProperty({ collides: true }); this.layers.push(ground); }
        if (above)  { above.setDepth(10); this.layers.push(above); }
      }
    } catch {
      // Placeholder when no tilemap exists yet: draw a grey floor
      const gfx = this.add.graphics();
      gfx.fillStyle(0x334455);
      gfx.fillRect(0, 0, 2000, 2000);
    }
  }

  private createPlayer() {
    const { x, y } = this.gameState.player.position;
    this.player = this.physics.add.sprite(x, y, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(5);

    if (!this.anims.exists('player_idle')) {
      this.anims.create({ key: 'player_idle', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 4, repeat: -1 });
      this.anims.create({ key: 'player_walk', frames: this.anims.generateFrameNumbers('player', { start: 4, end: 11 }), frameRate: 8, repeat: -1 });
    }
    this.player.play('player_idle');
  }

  private createEnemiesForZone(zoneId: string) {
    this.enemies = this.physics.add.group();
    const zone = ZONE_MAP[zoneId];
    if (!zone || zone.enemies.length === 0) return;

    const mapW = this.map?.widthInPixels  ?? 1600;
    const mapH = this.map?.heightInPixels ?? 1200;

    for (const enemyId of zone.enemies) {
      const def = ENEMY_MAP[enemyId];
      if (!def || def.isBoss) continue;

      const count = Math.floor(def.spawnWeight * 4);
      for (let i = 0; i < count; i++) {
        const ex = Phaser.Math.Between(100, mapW - 100);
        const ey = Phaser.Math.Between(100, mapH - 100);

        const sprite = this.physics.add.sprite(ex, ey, `enemy_${enemyId}`);
        sprite.setDepth(4);

        const active = CombatSystem.spawnEnemy(def, this.gameState.player.level);
        active.x = ex;
        active.y = ey;
        sprite.name = active.instanceId;
        this.activeEnemies.set(active.instanceId, active);
        this.enemies.add(sprite);
      }
    }
  }

  private createNPCsForZone(zoneId: string) {
    this.npcs = this.physics.add.staticGroup();
    const zoneNpcs = Object.values(NPC_MAP).filter(n => n.location === zoneId);

    const positions: Record<string, { x: number; y: number }> = {
      aldric: { x: 200, y: 300 },
      mira:   { x: 350, y: 250 },
      theron: { x: 150, y: 380 },
      brother_ovan: { x: 500, y: 280 },
      liria:  { x: 440, y: 340 },
      kelvar: { x: 300, y: 180 },
      ysolde: { x: 250, y: 350 },
    };

    for (const npc of zoneNpcs) {
      const pos = positions[npc.id] ?? { x: 400, y: 300 };
      const sprite = this.physics.add.image(pos.x, pos.y, `npc_${npc.id}`).setDepth(4) as unknown as Phaser.Physics.Arcade.Image;
      this.setupNPCInteraction(sprite, npc.id);
    }
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    // Clavier AZERTY : Z haut, Q gauche, S bas, D droite
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    // Compétences : A / E / R / F (AZERTY)
    this.skillKeys = {
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      e: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      r: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      f: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F),
    };
    // Attaque : W | Dash : ESPACE | Inventaire : I | Compétences : K
    this.attackKey      = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.dashKey        = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.inventoryKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.skillMenuKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    this.inventoryKey.on('down', () => {
      if (this.scene.isActive('InventoryScene')) {
        this.scene.stop('InventoryScene');
      } else {
        this.scene.launch('InventoryScene', { gameScene: this });
      }
    });

    this.skillMenuKey.on('down', () => {
      if (this.scene.isActive('SkillScene')) {
        this.scene.stop('SkillScene');
      } else {
        this.scene.launch('SkillScene', { gameScene: this });
      }
    });
  }

  private setupCamera() {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    if (this.map) {
      this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
      this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }
  }

  private setupPhysics() {
    for (const layer of this.layers) {
      this.physics.add.collider(this.player, layer);
      this.physics.add.collider(this.enemies, layer);
    }
    this.physics.add.collider(this.player, this.enemies);
  }

  // ── XP ORBS (Vampire Survivors style) ───────────────────────

  private createXpOrbsGroup() {
    this.xpOrbs = this.physics.add.group();
    this.physics.add.overlap(this.player, this.xpOrbs, (_player, orb) => {
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

      // Tiny color circle fallback if no sprite
      if (!this.textures.exists('xp_orb')) {
        const gfx = this.add.graphics().setDepth(3);
        gfx.fillStyle(0x88ffaa, 1);
        gfx.fillCircle(ox, oy, 5);
        this.time.delayedCall(8000, () => gfx.destroy());
      }
    }
  }

  private tickXpOrbs() {
    this.xpOrbs.children.each((go: Phaser.GameObjects.GameObject) => {
      const sprite = go as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sprite.x, sprite.y);
      if (dist < this.XP_ATTRACT_RANGE) {
        sprite.setData('attracting', true);
        const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
        const speed = Math.min(200, 80 + (this.XP_ATTRACT_RANGE - dist) * 2);
        (sprite.body as Phaser.Physics.Arcade.Body).setVelocity(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed
        );
      } else if (!sprite.getData('attracting')) {
        (sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      }
    });
  }

  shutdown() {
    this.input.keyboard?.removeAllKeys(true);
    this.events.removeAllListeners();
  }

  // Travel to another zone
  travelToZone(zoneId: string) {
    const zone = ZONE_MAP[zoneId];
    if (!zone) return;

    this.gameState.player.currentZone  = zoneId;
    this.gameState.player.position     = { x: 200, y: 200 };
    this.activeEnemies.clear();
    this.layers = [];
    this.xpOrbs.clear(true, true);

    SaveSystem.save(this.gameState, this.gameState.saveSlot);
    this.scene.restart({ gameState: this.gameState });
  }
}
