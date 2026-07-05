import { PlayerState, Item, ItemRarity, RARITY_COLORS } from '../types';
import { GameScene } from './GameScene';
import { SKILL_MAP } from '../data/skills';
import { UI, drawPanel, drawBar, pxStyle } from '../utils/UITheme';
import { t, localizeItem, localizeSkill } from '../i18n';

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

  // ── Combo HUD (pips sous le joueur — COMBO_TALENT_SPEC.md §2.3 / §6.2) ──
  private comboPips!: Phaser.GameObjects.Container;
  private comboMaxPips = 0;
  private comboCurrentCount = 0;
  private pipObjects: Phaser.GameObjects.Graphics[] = [];
  private pipTween: Phaser.Tweens.Tween | null = null;
  private comboShownAt = 0;
  private comboFading = false;

  private lerpHp          = 1;
  private lerpMp          = 1;
  private targetHp        = 1;
  private targetMp        = 1;
  private barsInitialized = false;
  private cachedMaxHp     = 1;
  private cachedMaxMp     = 1;
  private cachedHpInt     = 1;
  private cachedMpInt     = 1;

  constructor() { super({ key: 'UIScene' }); }

  init(data: { gameScene: GameScene }) {
    this.gameScene      = data.gameScene;
    this.barsInitialized = false;
  }

  create() {
    const { width: W, height: H } = this.cameras.main;

    // ── DEV: build badge (top-left) — retirer avant release ─────────
    const BUILD_LABEL = 'fix: substats ARPG actifs + UI stats correctes (d06c4f3)';
    const badgePad = 6;
    const badgeText = this.add.text(badgePad + 4, badgePad + 4, BUILD_LABEL, {
      fontSize: '10px', color: '#000000', fontFamily: 'monospace', fontStyle: 'bold',
    }).setDepth(200);
    const bw = badgeText.width + 8;
    const bh = badgeText.height + 8;
    this.add.rectangle(badgePad, badgePad, bw, bh, 0x00cc55, 1)
      .setOrigin(0, 0).setDepth(199);
    badgeText.setPosition(badgePad + 4, badgePad + 4);

    // ── Player stat panel (bottom-left) ─────────
    const PANEL_H   = 66;
    const PANEL_W   = BAR_X + BAR_W + 8;
    const PANEL_TOP = H - PANEL_H - 4;
    this.HP_Y = PANEL_TOP + 22;
    this.MP_Y = PANEL_TOP + 44;

    const panelGfx = this.add.graphics();
    drawPanel(panelGfx, 4, PANEL_TOP, PANEL_W, PANEL_H);

    // Label badges HP / MP
    this.add.text(10, this.HP_Y + 1, t('ui.hp'), pxStyle(7, UI.TXT_GREEN));
    this.add.text(10, this.MP_Y + 2, t('ui.mp'), pxStyle(7, UI.TXT_BLUE));

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
    this.add.text(W - 8, H - 20, t('ui.hint'), pxStyle(6, UI.TXT_HINT))
      .setOrigin(1, 0);

    // ── Combo HUD (pips qui suivent le joueur) ────
    // Reset explicite : scene.restart() réutilise l'instance, les
    // initialiseurs de champs ne sont pas re-exécutés.
    this.comboPips = this.add.container(0, 0).setDepth(50).setAlpha(0.75).setVisible(false);
    this.pipObjects = [];
    this.pipTween = null;
    this.comboMaxPips = 0;
    this.comboCurrentCount = 0;
    this.comboShownAt = 0;
    this.comboFading = false;

    // ── Events ───────────────────────────────────
    this.gameScene.events.on('player_update',    this.onPlayerUpdate,    this);
    this.gameScene.events.on('level_up',         this.onLevelUp,         this);
    this.gameScene.events.on('item_looted',      this.onItemLooted,      this);
    this.gameScene.events.on('quest_completed',  this.onQuestCompleted,  this);
    this.gameScene.events.on('skill_unlocked',   this.onSkillUnlocked,   this);
    this.gameScene.events.on('zone_cleared',     this.onZoneCleared,     this);
    this.gameScene.events.on('zone_entered',     this.onZoneEntered,     this);
    this.gameScene.events.on('show_notification',this.onShowNotification,this);
    this.gameScene.events.on('language_changed', this.onLanguageChanged,  this);
    this.gameScene.events.on('combo-changed',     this.onComboChanged,     this);
    this.gameScene.events.on('combo-broken',      this.onComboBroken,      this);
    this.gameScene.events.on('finisher-executed', this.onFinisherExecuted, this);
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
    this.gameScene.events.off('language_changed', this.onLanguageChanged,  this);
    this.gameScene.events.off('combo-changed',     this.onComboChanged,     this);
    this.gameScene.events.off('combo-broken',      this.onComboBroken,      this);
    this.gameScene.events.off('finisher-executed', this.onFinisherExecuted, this);
    this.pipTween = null;
  }

  private onLanguageChanged() {
    this.scene.restart({ gameScene: this.gameScene });
  }

  update(_t: number, delta: number) {
    this.updateComboPips();

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

    const speed = 8 * (delta / 1000);
    const prevHp = this.lerpHp;
    const prevMp = this.lerpMp;
    this.lerpHp = Phaser.Math.Linear(this.lerpHp, this.targetHp, Math.min(1, speed));
    this.lerpMp = Phaser.Math.Linear(this.lerpMp, this.targetMp, Math.min(1, speed));

    if (Math.abs(this.lerpHp - prevHp) > 0.001 || Math.abs(this.lerpMp - prevMp) > 0.001) {
      this.drawLerpedBars();
    }
  }

  // ── Combo HUD ────────────────────────────────────
  // Losanges 4×4px sous le sprite du joueur (offset +26px), espacés de 7px.
  // Blanc cassé 0xf0e8d8 = validé, gris 0x444444 = restant, ambre 0xffb347 =
  // finisher prêt. Interdits : azur 0x66ddff, doré 0xffe066 (INSPIRATIONS.md).

  private updateComboPips() {
    if (this.comboMaxPips === 0) {
      this.comboPips.setVisible(false);
      return;
    }

    // UIScene est une scène parallèle : convertir world → screen via la caméra de GameScene
    const pos = this.gameScene.getPlayerScreenPosition();
    if (!pos) {
      this.comboPips.setVisible(false);
      return;
    }
    this.comboPips.setVisible(true);
    this.comboPips.setPosition(pos.x, pos.y + 26);

    // Fade out complet après 2s sans attaque (spec §2.3) — rien hors combat
    if (!this.comboFading && this.comboShownAt > 0 && this.time.now - this.comboShownAt > 2000) {
      this.comboFading = true;
      this.stopPipTween();
      this.tweens.add({
        targets: this.comboPips,
        alpha: 0,
        duration: 250,
        onComplete: () => this.hideComboPips(),
      });
    }
  }

  private onComboChanged({ count, max }: { count: number; max: number }) {
    if (!this.sys.isActive()) return;
    this.tweens.killTweensOf(this.comboPips);
    this.comboFading = false;
    this.comboPips.setAlpha(0.75).setVisible(true);

    const prevCount = this.comboCurrentCount;
    this.comboCurrentCount = count;
    this.comboMaxPips = max;
    this.comboShownAt = this.time.now;
    this.redrawPips();

    // Pop du pip qui vient de s'allumer : 1.0→1.4→1.0 en 120ms (spec §6.2)
    if (count > prevCount && count > 0 && count <= this.pipObjects.length) {
      const lit = this.pipObjects[count - 1];
      this.tweens.add({
        targets: lit, scaleX: 1.4, scaleY: 1.4,
        duration: 60, yoyo: true, ease: 'Back.easeOut',
      });
    }
  }

  private onComboBroken() {
    if (!this.sys.isActive() || this.comboMaxPips === 0) return;
    this.comboFading = true;
    this.stopPipTween();

    // Pips en gris — un blink, puis fade out 250ms. Échec silencieux, jamais humiliant.
    for (const g of this.pipObjects) {
      g.clear();
      g.fillStyle(0x777777, 1);
      g.fillRect(-2, -2, 4, 4);
    }
    this.tweens.killTweensOf(this.comboPips);
    this.tweens.add({
      targets: this.comboPips,
      alpha: 0.15,
      duration: 80,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: this.comboPips,
          alpha: 0,
          duration: 250,
          onComplete: () => this.hideComboPips(),
        });
      },
    });
  }

  private onFinisherExecuted(_data: { weaponType?: unknown }) {
    if (!this.sys.isActive() || this.comboMaxPips === 0) return;
    this.comboFading = true;
    this.stopPipTween();

    // Les pips éclatent en 3–4 particules ambre qui s'envolent en arc (300ms)
    const { x, y } = this.comboPips;
    const count = Phaser.Math.Between(3, 4);
    for (let i = 0; i < count; i++) {
      const p = this.add
        .circle(x + Phaser.Math.Between(-10, 10), y, 2, 0xffb347, 1)
        .setDepth(51);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-18, 18),
        y: y - Phaser.Math.Between(10, 18),
        duration: 150,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: p,
            y: y + Phaser.Math.Between(14, 22),
            alpha: 0,
            duration: 150,
            ease: 'Quad.easeIn',
            onComplete: () => p.destroy(),
          });
        },
      });
    }

    this.tweens.killTweensOf(this.comboPips);
    this.hideComboPips();
  }

  private redrawPips() {
    const max = this.comboMaxPips;

    // Reconstruire si le nombre de pips a changé (changement d'arme)
    if (this.pipObjects.length !== max) {
      this.stopPipTween();
      for (const p of this.pipObjects) p.destroy();
      this.pipObjects = [];
      for (let i = 0; i < max; i++) {
        const g = this.add.graphics();
        g.setRotation(Math.PI / 4); // carré 4×4 tourné à 45° = losange
        g.x = (i - (max - 1) / 2) * 7;
        this.comboPips.add(g);
        this.pipObjects.push(g);
      }
    }

    const finisherReady = max > 0 && this.comboCurrentCount === max - 1;
    for (let i = 0; i < max; i++) {
      const g = this.pipObjects[i];
      let color = i < this.comboCurrentCount ? 0xf0e8d8 : 0x444444;
      if (i === max - 1 && finisherReady) color = 0xffb347;
      g.clear();
      g.fillStyle(color, 1);
      g.fillRect(-2, -2, 4, 4);
    }

    // Pulsation lente du pip finisher quand le prochain coup est le finisher
    this.stopPipTween();
    if (finisherReady) {
      this.pipTween = this.tweens.add({
        targets: this.pipObjects[max - 1],
        scaleX: 1.3, scaleY: 1.3,
        duration: 400,
        yoyo: true,
        repeat: -1, // arrêté systématiquement par stopPipTween() à chaque changement d'état
      });
    }
  }

  private stopPipTween() {
    if (this.pipTween) {
      this.pipTween.stop();
      this.pipTween = null;
    }
    for (const g of this.pipObjects) g.setScale(1);
  }

  private hideComboPips() {
    this.comboMaxPips = 0;
    this.comboCurrentCount = 0;
    this.comboShownAt = 0;
    this.comboFading = false;
    this.comboPips.setVisible(false).setAlpha(0.75);
  }

  // ── Event handlers ───────────────────────────────

  private onPlayerUpdate(player: PlayerState) {
    if (!this.sys.isActive()) return;
    const { width: W, height: H } = this.cameras.main;

    this.playerNameText.setText(player.name);
    this.levelText.setText(`${t('ui.level')}${player.level}`);

    this.targetHp    = Math.max(0, player.stats.hp / player.stats.maxHp);
    this.targetMp    = Math.max(0, player.stats.mana / player.stats.maxMana);
    this.cachedMaxHp = player.stats.maxHp;
    this.cachedMaxMp = player.stats.maxMana;
    this.cachedHpInt = player.stats.hp;
    this.cachedMpInt = player.stats.mana;
    if (!this.barsInitialized) {
      this.lerpHp = this.targetHp;
      this.lerpMp = this.targetMp;
      this.barsInitialized = true;
      this.drawLerpedBars();
    }

    // XP bar (bottom 4-px strip) — no lerp needed
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

  private drawLerpedBars() {
    const hpColor = this.lerpHp > 0.5 ? UI.HP_GREEN : this.lerpHp > 0.25 ? UI.HP_ORANGE : UI.HP_RED;
    this.hpBar.clear();
    drawBar(this.hpBar, BAR_X, this.HP_Y, BAR_W, HP_H, this.lerpHp, hpColor, UI.HP_BG, UI.HP_SHINE);
    this.hpText.setText(`${this.cachedHpInt}/${this.cachedMaxHp}`);

    this.manaBar.clear();
    drawBar(this.manaBar, BAR_X, this.MP_Y, BAR_W, MP_H, this.lerpMp, UI.MP_FILL, UI.MP_BG, UI.MP_SHINE);
    this.manaText.setText(`${this.cachedMpInt}/${this.cachedMaxMp}`);
  }

  private onLevelUp(level: number) {
    this.pushNotif(t('notif.level_up').replace('{level}', String(level)), UI.TXT_GOLD);
  }

  private onItemLooted({ item, quantity }: { item: Item; quantity: number }) {
    const color = RARITY_COLORS[item.rarity] ?? '#ffffff';
    if (item.rarity !== ItemRarity.COMMON) {
      this.pushNotif(`${localizeItem(item).name}  ×${quantity}`, color);
    }
  }

  private onQuestCompleted() {
    this.pushNotif(t('notif.quest_done'), UI.TXT_ORANGE);
  }

  private onSkillUnlocked(skillId: string) {
    const skill = SKILL_MAP[skillId];
    if (skill) this.pushNotif(t('notif.skill_unlocked').replace('{name}', localizeSkill(skill).name), UI.TXT_BLUE);
  }

  private onZoneCleared(zone: { id: string; name: string }) {
    const zoneName = t(`zone.${zone.id}`) || zone.name;
    this.pushNotif(t('notif.zone_cleared').replace('{name}', zoneName), UI.TXT_GREEN);
  }

  private onShowNotification(msg: string) {
    this.pushNotif(msg, UI.TXT_PARCHMENT);
  }

  private onZoneEntered(zone: { id: string; name: string }) {
    if (!this.sys.isActive()) return;
    this.zoneText.setText(t(`zone.${zone.id}`) || zone.name);
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
