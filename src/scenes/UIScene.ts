import { PlayerState, Item, ItemRarity, RARITY_COLORS } from '../types';
import { GameScene } from './GameScene';
import { SKILL_MAP } from '../data/skills';
import { UI, drawPanel, drawBar, pxStyle } from '../utils/UITheme';

const BAR_W = 178;
const HP_H  = 16;
const MP_H  = 9;
const BAR_X = 42;

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;

  private hpBar!: Phaser.GameObjects.Graphics;
  private manaBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private manaText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Graphics;
  private playerNameText!: Phaser.GameObjects.Text;

  private HP_Y!: number;
  private MP_Y!: number;

  private skillSlots: Phaser.GameObjects.Image[]          = [];
  private skillCdOverlays: Phaser.GameObjects.Graphics[]  = [];
  private skillCdTexts: Phaser.GameObjects.Text[]         = [];

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

    // ── Player stat panel (bottom-left) ─────────
    const PANEL_H   = 66;
    const PANEL_W   = BAR_X + BAR_W + 8;
    const PANEL_TOP = H - PANEL_H - 4;
    this.HP_Y = PANEL_TOP + 22;
    this.MP_Y = PANEL_TOP + 44;

    const panelGfx = this.add.graphics();
    drawPanel(panelGfx, 4, PANEL_TOP, PANEL_W, PANEL_H);

    // Label badges HP / MP
    this.add.text(10, this.HP_Y + 1, 'HP', pxStyle(7, UI.TXT_GREEN));
    this.add.text(10, this.MP_Y + 2, 'MP', pxStyle(7, UI.TXT_BLUE));

    // Player name (top of panel)
    this.playerNameText = this.add.text(10, PANEL_TOP + 6, '', pxStyle(8, UI.TXT_GOLD));

    // Level (top-right of panel)
    this.levelText = this.add.text(PANEL_W, PANEL_TOP + 6, '', pxStyle(8, UI.TXT_PARCHMENT))
      .setOrigin(1, 0);

    // HP bar + centred text
    this.hpBar  = this.add.graphics();
    this.hpText = this.add.text(BAR_X + BAR_W / 2, this.HP_Y + HP_H / 2, '', {
      ...pxStyle(7, UI.TXT_WHITE),
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1);

    // MP bar + centred text
    this.manaBar  = this.add.graphics();
    this.manaText = this.add.text(BAR_X + BAR_W / 2, this.MP_Y + MP_H / 2, '', {
      ...pxStyle(7, UI.TXT_WHITE),
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1);

    // ── XP bar (bottom strip) ────────────────────
    this.xpBar = this.add.graphics();

    // ── Skill slots (centered bottom) ────────────
    const SLOT_SZ  = 46;
    const SLOT_GAP = 5;
    const TOTAL_W  = 4 * SLOT_SZ + 3 * SLOT_GAP;
    const SX_START = W / 2 - TOTAL_W / 2;
    const SY       = H - SLOT_SZ - 7;
    const keys     = ['A', 'E', 'R', 'F'];

    for (let i = 0; i < 4; i++) {
      const sx = SX_START + i * (SLOT_SZ + SLOT_GAP);

      const slotGfx = this.add.graphics();
      drawPanel(slotGfx, sx, SY, SLOT_SZ, SLOT_SZ, UI.SLOT_BG);

      const icon = this.add.image(sx + SLOT_SZ / 2, SY + SLOT_SZ / 2, 'skill_dash')
        .setDisplaySize(30, 30);
      this.skillSlots.push(icon);

      const cdOverlay = this.add.graphics();
      this.skillCdOverlays.push(cdOverlay);

      // Key label badge (top-left corner of slot)
      const badge = this.add.graphics();
      badge.fillStyle(0x08080f, 0.88);
      badge.fillRect(sx + 2, SY + 2, 13, 11);
      this.add.text(sx + 8, SY + 7, keys[i], pxStyle(6, UI.TXT_GOLD)).setOrigin(0.5);

      const cdText = this.add.text(sx + SLOT_SZ / 2, SY + SLOT_SZ / 2, '', {
        ...pxStyle(10, UI.TXT_WHITE),
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5);
      this.skillCdTexts.push(cdText);
    }

    // ── Notification (above skill slots) ─────────
    this.notifText = this.add.text(W / 2, H - SLOT_SZ - 20, '', {
      ...pxStyle(9, UI.TXT_PARCHMENT, true),
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    // ── Zone name (top-right) ─────────────────────
    this.zoneText = this.add.text(W - 10, 10, '', pxStyle(9, UI.TXT_GOLD))
      .setOrigin(1, 0).setAlpha(0).setDepth(5);

    // ── Hint (bottom-right) ───────────────────────
    this.add.text(W - 8, H - 20, '[I] Inv  [K] Skills', pxStyle(6, UI.TXT_HINT))
      .setOrigin(1, 0);

    // ── Events ───────────────────────────────────
    this.gameScene.events.on('player_update',    this.onPlayerUpdate,    this);
    this.gameScene.events.on('level_up',         this.onLevelUp,         this);
    this.gameScene.events.on('item_looted',      this.onItemLooted,      this);
    this.gameScene.events.on('quest_completed',  this.onQuestCompleted,  this);
    this.gameScene.events.on('skill_unlocked',   this.onSkillUnlocked,   this);
    this.gameScene.events.on('zone_cleared',     this.onZoneCleared,     this);
    this.gameScene.events.on('zone_entered',     this.onZoneEntered,     this);
    this.gameScene.events.on('show_notification',this.onShowNotification,this);
  }

  shutdown() {
    this.gameScene.events.off('player_update',    this.onPlayerUpdate,    this);
    this.gameScene.events.off('level_up',         this.onLevelUp,         this);
    this.gameScene.events.off('item_looted',      this.onItemLooted,      this);
    this.gameScene.events.off('quest_completed',  this.onQuestCompleted,  this);
    this.gameScene.events.off('skill_unlocked',   this.onSkillUnlocked,   this);
    this.gameScene.events.off('zone_cleared',     this.onZoneCleared,     this);
    this.gameScene.events.off('zone_entered',     this.onZoneEntered,     this);
    this.gameScene.events.off('show_notification',this.onShowNotification,this);
  }

  update(_t: number, delta: number) {
    if (this.notifTimer > 0) {
      this.notifTimer -= delta;
      if (this.notifTimer <= 0) {
        this.tweens.add({
          targets: this.notifText,
          alpha: 0,
          duration: 400,
          onComplete: () => this.showNextNotif(),
        });
      }
    }
  }

  // ── Event handlers ───────────────────────────────

  private onPlayerUpdate(player: PlayerState) {
    if (!this.sys.isActive()) return;
    const { width: W, height: H } = this.cameras.main;

    this.playerNameText.setText(player.name);
    this.levelText.setText(`Lv.${player.level}`);

    // HP bar
    const hpPct   = Math.max(0, player.stats.hp / player.stats.maxHp);
    const hpColor = hpPct > 0.5 ? UI.HP_GREEN : hpPct > 0.25 ? UI.HP_ORANGE : UI.HP_RED;
    this.hpBar.clear();
    drawBar(this.hpBar, BAR_X, this.HP_Y, BAR_W, HP_H, hpPct, hpColor, UI.HP_BG, UI.HP_SHINE);
    this.hpText.setText(`${player.stats.hp}/${player.stats.maxHp}`);

    // MP bar
    const mpPct = Math.max(0, player.stats.mana / player.stats.maxMana);
    this.manaBar.clear();
    drawBar(this.manaBar, BAR_X, this.MP_Y, BAR_W, MP_H, mpPct, UI.MP_FILL, UI.MP_BG, UI.MP_SHINE);
    this.manaText.setText(`${player.stats.mana}/${player.stats.maxMana}`);

    // XP bar (bottom 4-px strip)
    const xpPct = player.xpToNext > 0 ? player.xp / player.xpToNext : 0;
    const xpFW  = Math.floor(W * Math.max(0, Math.min(1, xpPct)));
    this.xpBar.clear();
    this.xpBar.fillStyle(UI.XP_BG, 1);
    this.xpBar.fillRect(0, H - 4, W, 4);
    if (xpFW > 0) {
      this.xpBar.fillStyle(UI.XP_FILL, 1);
      this.xpBar.fillRect(0, H - 4, xpFW, 4);
      this.xpBar.fillStyle(UI.XP_SHINE, 0.3);
      this.xpBar.fillRect(0, H - 4, xpFW, 2);
    }

    // Skill icons
    const slots = [
      player.equippedSkills.slot1, player.equippedSkills.slot2,
      player.equippedSkills.slot3, player.equippedSkills.slot4,
    ];
    for (let i = 0; i < 4; i++) {
      const skillId = slots[i];
      if (skillId) {
        const skill = SKILL_MAP[skillId];
        if (skill) try { this.skillSlots[i].setTexture(skill.icon); } catch {}
      }
    }
  }

  private onLevelUp(level: number) {
    this.pushNotif(`★ Level ${level} ★`, UI.TXT_GOLD);
  }

  private onItemLooted({ item, quantity }: { item: Item; quantity: number }) {
    const color = RARITY_COLORS[item.rarity] ?? '#ffffff';
    if (item.rarity !== ItemRarity.COMMON) {
      this.pushNotif(`${item.name}  ×${quantity}`, color);
    }
  }

  private onQuestCompleted() {
    this.pushNotif('Quête accomplie !', UI.TXT_ORANGE);
  }

  private onSkillUnlocked(skillId: string) {
    const skill = SKILL_MAP[skillId];
    if (skill) this.pushNotif(`Compétence : ${skill.name}`, UI.TXT_BLUE);
  }

  private onZoneCleared(zone: { name: string }) {
    this.pushNotif(`${zone.name} — Libérée`, UI.TXT_GREEN);
  }

  private onShowNotification(msg: string) {
    this.pushNotif(msg, UI.TXT_PARCHMENT);
  }

  private onZoneEntered(zone: { name: string }) {
    if (!this.sys.isActive()) return;
    this.zoneText.setText(zone.name);
    this.tweens.add({ targets: this.zoneText, alpha: 1, duration: 400 });
    this.time.delayedCall(3500, () => {
      this.tweens.add({ targets: this.zoneText, alpha: 0.4, duration: 1000 });
    });
  }

  private pushNotif(msg: string, color = UI.TXT_PARCHMENT) {
    this.notifQueue.push(`${color}|${msg}`);
    if (this.notifTimer <= 0) this.showNextNotif();
  }

  private showNextNotif() {
    if (!this.notifQueue.length) return;
    const entry  = this.notifQueue.shift()!;
    const pipe   = entry.indexOf('|');
    const color  = entry.slice(0, pipe);
    const msg    = entry.slice(pipe + 1);
    this.notifText.setText(msg).setStyle({ color }).setAlpha(1);
    this.notifTimer = 2500;
  }
}
