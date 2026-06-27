import { PlayerState, ItemRarity, RARITY_COLORS } from '../types';
import { GameScene } from './GameScene';
import { SKILL_MAP } from '../data/skills';
import { ZONE_MAP } from '../data/zones';

const BAR_W  = 180;
const HP_H   = 14;
const MP_H   = 10;
const BAR_X  = 48;
const HP_Y   = 18;
const MP_Y   = 40;

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;

  private hpBar!: Phaser.GameObjects.Graphics;
  private manaBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private manaText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Graphics;
  private playerNameText!: Phaser.GameObjects.Text;

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

    // ── Panel fond SAO (top-left) ──────────────
    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(0x000000, 0.55);
    panelGfx.fillRoundedRect(6, 6, BAR_X + BAR_W + 12, 58, 6);
    panelGfx.lineStyle(1, 0x334466, 1);
    panelGfx.strokeRoundedRect(6, 6, BAR_X + BAR_W + 12, 58, 6);

    // ── Nom du joueur + niveau (style SAO) ────
    this.playerNameText = this.add.text(14, 10, '', {
      fontSize: '10px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    });
    this.levelText = this.add.text(BAR_X + BAR_W - 10, 10, '', {
      fontSize: '10px', color: '#ffdd88', fontFamily: 'monospace',
    }).setOrigin(1, 0);

    // ── HP bar (vert SAO) ──────────────────────
    const hpLabel = this.add.text(14, HP_Y + 1, 'HP', {
      fontSize: '9px', color: '#88ff88', fontFamily: 'monospace', fontStyle: 'bold',
    });
    this.hpBar = this.add.graphics();
    this.hpText = this.add.text(BAR_X + BAR_W + 4, HP_Y, '', {
      fontSize: '9px', color: '#aaffaa', fontFamily: 'monospace',
    });

    // ── MP bar (bleu SAO) ──────────────────────
    this.add.text(14, MP_Y + 1, 'MP', {
      fontSize: '9px', color: '#8888ff', fontFamily: 'monospace', fontStyle: 'bold',
    });
    this.manaBar = this.add.graphics();
    this.manaText = this.add.text(BAR_X + BAR_W + 4, MP_Y, '', {
      fontSize: '9px', color: '#aaaaff', fontFamily: 'monospace',
    });

    // ── Or ────────────────────────────────────
    this.goldText = this.add.text(14, 56, '', {
      fontSize: '10px', color: '#ffcc44', fontFamily: 'monospace',
    });

    // ── XP bar (bas de l'écran) ───────────────
    this.xpBar = this.add.graphics();

    // ── Skill slots (AZERTY: A / E / R / F) ───
    const slotKeys: string[] = ['A','E','R','F'];
    for (let i = 0; i < 4; i++) {
      const sx = W / 2 - 98 + i * 52;
      const sy = H - 58;

      const bg = this.add.graphics();
      bg.fillStyle(0x111122, 0.85);
      bg.fillRoundedRect(sx, sy, 44, 44, 4);
      bg.lineStyle(1.5, 0x334477, 1);
      bg.strokeRoundedRect(sx, sy, 44, 44, 4);

      const icon = this.add.image(sx + 22, sy + 22, 'skill_dash').setDisplaySize(34, 34);
      this.skillSlots.push(icon);

      const cdOverlay = this.add.graphics();
      this.skillCdOverlays.push(cdOverlay);

      this.add.text(sx + 3, sy + 3, slotKeys[i], {
        fontSize: '8px', color: '#6688cc', fontFamily: 'monospace', fontStyle: 'bold',
      });

      const cdText = this.add.text(sx + 22, sy + 22, '', {
        fontSize: '11px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      this.skillCdTexts.push(cdText);
    }

    // ── Légende touches ────────────────────────
    this.add.text(W - 12, H - 18, '[I] Inv  [K] Skills  [W] Attaque  [Espace] Dash', {
      fontSize: '8px', color: '#445566', fontFamily: 'monospace',
    }).setOrigin(1, 0);

    // ── Notification ──────────────────────────
    this.notifText = this.add.text(W / 2, H - 110, '', {
      fontSize: '13px', color: '#ffff88', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);

    // ── Nom de zone (haut-droite) ─────────────
    this.zoneText = this.add.text(W - 12, 12, '', {
      fontSize: '11px', color: '#8899bb', fontFamily: 'monospace',
    }).setOrigin(1, 0).setAlpha(0);

    this.gameScene.events.on('player_update',   this.onPlayerUpdate,    this);
    this.gameScene.events.on('level_up',        this.onLevelUp,         this);
    this.gameScene.events.on('item_looted',     this.onItemLooted,      this);
    this.gameScene.events.on('quest_completed', this.onQuestCompleted,  this);
    this.gameScene.events.on('skill_unlocked',  this.onSkillUnlocked,   this);
    this.gameScene.events.on('zone_cleared',    this.onZoneCleared,     this);
    this.gameScene.events.on('zone_entered',      this.onZoneEntered,      this);
    this.gameScene.events.on('show_notification', this.onShowNotification, this);
  }

  shutdown() {
    this.gameScene.events.off('player_update',    this.onPlayerUpdate,     this);
    this.gameScene.events.off('level_up',         this.onLevelUp,          this);
    this.gameScene.events.off('item_looted',      this.onItemLooted,       this);
    this.gameScene.events.off('quest_completed',  this.onQuestCompleted,   this);
    this.gameScene.events.off('skill_unlocked',   this.onSkillUnlocked,    this);
    this.gameScene.events.off('zone_cleared',     this.onZoneCleared,      this);
    this.gameScene.events.off('zone_entered',     this.onZoneEntered,      this);
    this.gameScene.events.off('show_notification',this.onShowNotification, this);
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

    this.playerNameText.setText(player.name);
    this.levelText.setText(`Lv.${player.level}`);

    // ── HP bar SAO-style ──────────────────────
    const hpPct = Math.max(0, player.stats.hp / player.stats.maxHp);
    const hpFill = Math.floor(BAR_W * hpPct);
    this.hpBar.clear();
    // Fond sombre
    this.hpBar.fillStyle(0x0a1a0a, 1);
    this.hpBar.fillRect(BAR_X, HP_Y, BAR_W, HP_H);
    // Remplissage vert SAO (gradient simulé avec deux rectangles)
    const hpColor = hpPct > 0.5 ? 0x22cc44 : hpPct > 0.25 ? 0xddaa11 : 0xcc2211;
    this.hpBar.fillStyle(hpColor, 1);
    this.hpBar.fillRect(BAR_X, HP_Y, hpFill, HP_H);
    // Reflet clair (top highlight)
    this.hpBar.fillStyle(0xffffff, 0.12);
    this.hpBar.fillRect(BAR_X, HP_Y, hpFill, Math.floor(HP_H / 3));
    // Bordure
    this.hpBar.lineStyle(1, 0x336633, 1);
    this.hpBar.strokeRect(BAR_X, HP_Y, BAR_W, HP_H);
    this.hpText.setText(`${player.stats.hp}/${player.stats.maxHp}`);

    // ── MP bar SAO-style ──────────────────────
    const mpPct = Math.max(0, player.stats.mana / player.stats.maxMana);
    const mpFill = Math.floor(BAR_W * mpPct);
    this.manaBar.clear();
    this.manaBar.fillStyle(0x05050f, 1);
    this.manaBar.fillRect(BAR_X, MP_Y, BAR_W, MP_H);
    this.manaBar.fillStyle(0x1144cc, 1);
    this.manaBar.fillRect(BAR_X, MP_Y, mpFill, MP_H);
    this.manaBar.fillStyle(0xffffff, 0.10);
    this.manaBar.fillRect(BAR_X, MP_Y, mpFill, Math.floor(MP_H / 3));
    this.manaBar.lineStyle(1, 0x224488, 1);
    this.manaBar.strokeRect(BAR_X, MP_Y, BAR_W, MP_H);
    this.manaText.setText(`${player.stats.mana}/${player.stats.maxMana}`);

    // ── XP bar (bas, violet) ──────────────────
    const xpPct = player.xpToNext > 0 ? player.xp / player.xpToNext : 0;
    this.xpBar.clear();
    this.xpBar.fillStyle(0x110022, 0.9);
    this.xpBar.fillRect(0, this.cameras.main.height - 5, W, 5);
    this.xpBar.fillStyle(0x8833cc, 1);
    this.xpBar.fillRect(0, this.cameras.main.height - 5, Math.floor(W * xpPct), 5);

    this.goldText.setText(`⬡ ${player.gold} G`);

    // ── Skill icons ───────────────────────────
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
    this.pushNotif(`✦ Level ${level} ! ✦`, '#ffffaa');
  }

  private onItemLooted({ item, quantity }: { item: any; quantity: number }) {
    const colorMap: Partial<Record<string, string>> = RARITY_COLORS as any;
    const color = colorMap[item.rarity] ?? '#ffffff';
    if (item.rarity !== 'COMMON') {
      this.pushNotif(`[${item.rarity}] ${item.name} ×${quantity}`, color);
    }
  }

  private onQuestCompleted(_questId: string) {
    this.pushNotif(`Quête accomplie !`, '#ffff88');
  }

  private onSkillUnlocked(skillId: string) {
    const skill = SKILL_MAP[skillId];
    if (skill) this.pushNotif(`Compétence : ${skill.name}`, '#aaffff');
  }

  private onZoneCleared(zone: any) {
    this.pushNotif(`${zone.name} — Zone libérée`, '#ff8844');
  }

  private onShowNotification(msg: string) {
    this.pushNotif(msg, '#aaddff');
  }

  private onZoneEntered(zone: any) {
    this.zoneText.setText(zone.name);
    this.tweens.add({ targets: this.zoneText, alpha: 1, duration: 400 });
    this.time.delayedCall(3500, () => {
      this.tweens.add({ targets: this.zoneText, alpha: 0.35, duration: 1000 });
    });
  }

  private pushNotif(msg: string, color = '#ffff88') {
    this.notifQueue.push(`${color}|${msg}`);
    if (this.notifTimer <= 0) this.showNextNotif();
  }

  private showNextNotif() {
    if (this.notifQueue.length === 0) return;
    const entry = this.notifQueue.shift()!;
    const pipeIdx = entry.indexOf('|');
    const color = entry.slice(0, pipeIdx);
    const msg   = entry.slice(pipeIdx + 1);
    this.notifText.setText(msg).setStyle({ color }).setAlpha(1);
    this.notifTimer = 2500;
  }
}
