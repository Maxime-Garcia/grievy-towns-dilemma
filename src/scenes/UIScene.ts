import { PlayerState, ItemRarity, RARITY_COLORS } from '../types';
import { GameScene } from './GameScene';
import { SKILL_MAP } from '../data/skills';
import { ZONE_MAP } from '../data/zones';

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;

  private hpBar!: Phaser.GameObjects.Graphics;
  private manaBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private manaText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Graphics;

  private skillSlots: Phaser.GameObjects.Image[]    = [];
  private skillCdOverlays: Phaser.GameObjects.Graphics[] = [];
  private skillCdTexts: Phaser.GameObjects.Text[]   = [];

  private notifQueue: string[] = [];
  private notifText!: Phaser.GameObjects.Text;
  private notifTimer = 0;

  private zoneText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'UIScene' }); }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
  }

  create() {
    const { width: W, height: H } = this.cameras.main;

    // ── Health bar ─────────────────────────
    this.add.text(12, 12, 'HP', { fontSize: '10px', color: '#ff8888', fontFamily: 'monospace' });
    this.hpBar = this.add.graphics();
    this.hpText = this.add.text(12, 24, '', { fontSize: '10px', color: '#ffaaaa', fontFamily: 'monospace' });

    // ── Mana bar ───────────────────────────
    this.add.text(12, 44, 'MP', { fontSize: '10px', color: '#8888ff', fontFamily: 'monospace' });
    this.manaBar = this.add.graphics();
    this.manaText = this.add.text(12, 56, '', { fontSize: '10px', color: '#aaaaff', fontFamily: 'monospace' });

    // ── XP bar ────────────────────────────
    this.xpBar = this.add.graphics();

    // ── Level & Gold ──────────────────────
    this.levelText = this.add.text(12, 80, '', { fontSize: '11px', color: '#ffdd88', fontFamily: 'monospace' });
    this.goldText  = this.add.text(12, 94, '', { fontSize: '11px', color: '#ffcc44', fontFamily: 'monospace' });

    // ── Skill slots ───────────────────────
    const slotKeys: string[] = ['Q','E','R','F'];
    for (let i = 0; i < 4; i++) {
      const sx = W / 2 - 90 + i * 48;
      const sy = H - 52;

      const bg = this.add.graphics();
      bg.fillStyle(0x222222);
      bg.fillRect(sx, sy, 40, 40);
      bg.lineStyle(1, 0x555555);
      bg.strokeRect(sx, sy, 40, 40);

      const icon = this.add.image(sx + 20, sy + 20, 'skill_dash').setDisplaySize(32, 32);
      this.skillSlots.push(icon);

      const cdOverlay = this.add.graphics();
      this.skillCdOverlays.push(cdOverlay);

      const keyLabel = this.add.text(sx + 2, sy + 2, slotKeys[i], {
        fontSize: '8px', color: '#aaaaaa', fontFamily: 'monospace',
      });

      const cdText = this.add.text(sx + 20, sy + 20, '', {
        fontSize: '10px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.skillCdTexts.push(cdText);
    }

    // ── Notification text ─────────────────
    this.notifText = this.add.text(W / 2, H - 110, '', {
      fontSize: '13px',
      color: '#ffff88',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    // ── Zone name ─────────────────────────
    this.zoneText = this.add.text(W - 12, 12, '', {
      fontSize: '11px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(1, 0);

    // ── Help hints ────────────────────────
    this.add.text(W - 12, H - 30, '[I] Inventory  [K] Skills', {
      fontSize: '9px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(1, 0);

    // Listen to GameScene events
    this.gameScene.events.on('player_update', this.onPlayerUpdate, this);
    this.gameScene.events.on('level_up',      this.onLevelUp,      this);
    this.gameScene.events.on('item_looted',   this.onItemLooted,   this);
    this.gameScene.events.on('quest_completed', this.onQuestCompleted, this);
    this.gameScene.events.on('skill_unlocked',  this.onSkillUnlocked, this);
    this.gameScene.events.on('zone_cleared',    this.onZoneCleared,  this);
    this.gameScene.events.on('zone_entered',    this.onZoneEntered,  this);
  }

  shutdown() {
    this.gameScene.events.off('player_update', this.onPlayerUpdate, this);
    this.gameScene.events.off('level_up',      this.onLevelUp,      this);
    this.gameScene.events.off('item_looted',   this.onItemLooted,   this);
    this.gameScene.events.off('quest_completed', this.onQuestCompleted, this);
    this.gameScene.events.off('skill_unlocked',  this.onSkillUnlocked, this);
    this.gameScene.events.off('zone_cleared',    this.onZoneCleared,  this);
    this.gameScene.events.off('zone_entered',    this.onZoneEntered,  this);
  }

  update(_time: number, delta: number) {
    if (this.notifTimer > 0) {
      this.notifTimer -= delta;
      if (this.notifTimer <= 0) {
        this.tweens.add({ targets: this.notifText, alpha: 0, duration: 400, onComplete: () => this.showNextNotif() });
      }
    }
  }

  private onPlayerUpdate(player: PlayerState) {
    const W = this.cameras.main.width;

    // HP bar
    const hpPct = player.stats.hp / player.stats.maxHp;
    this.hpBar.clear();
    this.hpBar.fillStyle(0x330000); this.hpBar.fillRect(28, 14, 120, 10);
    this.hpBar.fillStyle(0xcc2222); this.hpBar.fillRect(28, 14, Math.floor(120 * hpPct), 10);
    this.hpText.setText(`${player.stats.hp}/${player.stats.maxHp}`);

    // Mana bar
    const mpPct = player.stats.mana / player.stats.maxMana;
    this.manaBar.clear();
    this.manaBar.fillStyle(0x000033); this.manaBar.fillRect(28, 46, 120, 10);
    this.manaBar.fillStyle(0x2255cc); this.manaBar.fillRect(28, 46, Math.floor(120 * mpPct), 10);
    this.manaText.setText(`${player.stats.mana}/${player.stats.maxMana}`);

    // XP bar
    const xpPct = player.xp / player.xpToNext;
    this.xpBar.clear();
    this.xpBar.fillStyle(0x221133); this.xpBar.fillRect(0, this.cameras.main.height - 4, W, 4);
    this.xpBar.fillStyle(0x8833cc); this.xpBar.fillRect(0, this.cameras.main.height - 4, Math.floor(W * xpPct), 4);

    this.levelText.setText(`Lv. ${player.level}`);
    this.goldText.setText(`${player.gold} G`);

    // Skill icons
    const slots = [player.equippedSkills.slot1, player.equippedSkills.slot2, player.equippedSkills.slot3, player.equippedSkills.slot4];
    for (let i = 0; i < 4; i++) {
      const skillId = slots[i];
      if (skillId) {
        const skill = SKILL_MAP[skillId];
        if (skill) {
          try { this.skillSlots[i].setTexture(skill.icon); } catch {}
        }
      }
    }
  }

  private onLevelUp(level: number) {
    this.pushNotif(`Level Up! You are now level ${level}`);
  }

  private onItemLooted({ item, quantity }: { item: any; quantity: number }) {
    const colorMap: Partial<Record<string, string>> = RARITY_COLORS as any;
    const color = colorMap[item.rarity] ?? '#ffffff';
    if (item.rarity !== 'COMMON') {
      this.pushNotif(`${item.rarity}: ${item.name} x${quantity}`, color);
    }
  }

  private onQuestCompleted(questId: string) {
    this.pushNotif(`Quest Complete!`, '#ffff88');
  }

  private onSkillUnlocked(skillId: string) {
    const skill = SKILL_MAP[skillId];
    if (skill) this.pushNotif(`Skill Unlocked: ${skill.name}`, '#aaffff');
  }

  private onZoneCleared(zone: any) {
    this.pushNotif(`${zone.name} Cleared`, '#ff8844');
  }

  private onZoneEntered(zone: any) {
    this.zoneText.setText(zone.name);
    this.tweens.add({ targets: this.zoneText, alpha: 1, duration: 300 });
    this.time.delayedCall(3000, () => {
      this.tweens.add({ targets: this.zoneText, alpha: 0.4, duration: 800 });
    });
  }

  private pushNotif(msg: string, color = '#ffff88') {
    this.notifQueue.push(`${color}|${msg}`);
    if (this.notifTimer <= 0) this.showNextNotif();
  }

  private showNextNotif() {
    if (this.notifQueue.length === 0) return;
    const [color, msg] = this.notifQueue.shift()!.split('|');
    this.notifText.setText(msg).setStyle({ color }).setAlpha(1);
    this.notifTimer = 2500;
  }
}
