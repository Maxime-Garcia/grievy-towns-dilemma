import { SaveSystem } from '../systems/SaveSystem';
import { UI, drawGlowPanel, pxStyle } from '../utils/UITheme';
import { t } from '../i18n';

const GAME_VERSION = 'v0.7.0';

// Étoiles du fond — positions relatives (fractions de W/H) fixes, pas de
// Math.random dans create() : rendu identique à chaque ouverture du menu.
const STARS: ReadonlyArray<readonly [number, number, number]> = [
  // [fx, fy, durée de pulsation ms]
  [0.08, 0.14, 1900],
  [0.16, 0.62, 2600],
  [0.24, 0.09, 2200],
  [0.31, 0.86, 2900],
  [0.44, 0.06, 2400],
  [0.58, 0.91, 2100],
  [0.71, 0.08, 2700],
  [0.83, 0.55, 2000],
  [0.90, 0.17, 2500],
  [0.94, 0.80, 2300],
];

export class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MainMenuScene' }); }

  create() {
    this.cameras.main.fadeIn(500, 0, 0, 0);
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Deep background + frame ──────────────────
    this.add.rectangle(W / 2, H / 2, W, H, UI.BG_DEEP);
    const bg = this.add.graphics();
    drawGlowPanel(bg, 6, 6, W - 12, H - 12, UI.BORDER_LIT, UI.BG_DEEP, 6);

    // ── Pulsing stars (au-dessus du fond du cadre) ─
    STARS.forEach(([fx, fy, dur], i) => {
      const star = this.add.rectangle(
        Math.round(W * fx), Math.round(H * fy), 2, 2, 0xf5edd0, 1,
      ).setAlpha(0.12);
      // repeat: -1 sûr ici : le TweenManager de la scène détruit ces tweens
      // au shutdown de MainMenuScene (scene.start vers GameScene).
      this.tweens.add({
        targets: star,
        alpha: 0.5,
        duration: dur,
        delay: i * 180,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Subtle separator lines (top and bottom horizontal)
    const deco = this.add.graphics();
    deco.lineStyle(1, UI.SEPARATOR, 1);
    deco.beginPath(); deco.moveTo(18, 96);     deco.lineTo(W - 18, 96);     deco.strokePath();
    deco.beginPath(); deco.moveTo(18, H - 70); deco.lineTo(W - 18, H - 70); deco.strokePath();
    deco.lineStyle(1, UI.GLOW_GOLD, 0.18);
    deco.beginPath(); deco.moveTo(W / 2 - 120, 96); deco.lineTo(W / 2 + 120, 96); deco.strokePath();

    // ── Title ─────────────────────────────────────
    const title = this.add.text(W / 2, 36, "GRIEVY TOWN'S DILEMMA", {
      ...pxStyle(24, UI.TXT_GOLD, true),
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 500, ease: 'Quad.easeOut' });

    this.add.text(W / 2, 64, t('menu.subtitle'), pxStyle(8, UI.TXT_MUTED))
      .setOrigin(0.5);

    // Phrase inspirationnelle — le dilemme central (INSPIRATIONS.md §5)
    this.add.text(W / 2, 82, '« Chaque victoire est une perte. »', pxStyle(7, UI.TXT_HINT))
      .setOrigin(0.5);

    // ── Buttons (fade-in décalé : 0 / 150 / 300 ms) ─
    const slots      = SaveSystem.listSlots();
    const hasAnySave = slots.some(s => s !== null);

    this.makeBtn(W / 2, 160, t('menu.new_game'), UI.ACCENT_VIOLET, 0,
      () => this.showNewGameMenu(slots));
    if (hasAnySave) {
      this.makeBtn(W / 2, 216, t('menu.load_save'), UI.GLOW_GOLD, 150,
        () => this.showLoadMenu(slots));
    }

    // ── Save slot cards ───────────────────────────
    this.add.text(W / 2, 276, t('menu.save_slots'), pxStyle(7, UI.TXT_HINT)).setOrigin(0.5);

    for (let i = 0; i < 3; i++) {
      const s    = slots[i];
      const cy   = 298 + i * 56;
      const card = this.add.graphics().setAlpha(0);
      drawGlowPanel(card, W / 2 - 200, cy, 400, 44, UI.SEPARATOR, UI.BG_MID, 4);

      const cardTexts: Phaser.GameObjects.Text[] = [];
      if (s) {
        cardTexts.push(
          this.add.text(W / 2 - 188, cy + 8,  `${t('menu.slot')} ${i + 1}`, pxStyle(7, UI.TXT_GOLD)),
          this.add.text(W / 2 - 188, cy + 24, `${s.playerName}  Lv.${s.level}`, pxStyle(7, UI.TXT_PARCHMENT)),
          this.add.text(W / 2 + 190, cy + 8,  `${s.clearedZones}/6 zones`, pxStyle(7, UI.TXT_MUTED)).setOrigin(1, 0),
          this.add.text(W / 2 + 190, cy + 24, SaveSystem.formatPlaytime(s.playtime), pxStyle(7, UI.TXT_MUTED)).setOrigin(1, 0),
        );
      } else {
        cardTexts.push(
          this.add.text(W / 2, cy + 22, `${t('menu.slot')} ${i + 1}  —  ${t('menu.slot.empty')}`, pxStyle(7, UI.TXT_HINT)).setOrigin(0.5),
        );
      }
      cardTexts.forEach(txt => txt.setAlpha(0));
      this.tweens.add({
        targets: [card, ...cardTexts],
        alpha: 1,
        duration: 350,
        delay: 400 + i * 100,
        ease: 'Quad.easeOut',
      });
    }

    // ── Footer: controls hint (centre) + version (bas droite) ──
    this.add.text(W / 2, H - 14, t('menu.controls'), pxStyle(6, UI.TXT_HINT))
      .setOrigin(0.5, 1);
    this.add.text(W - 14, H - 14, GAME_VERSION, pxStyle(6, UI.TXT_HINT))
      .setOrigin(1, 1);
  }

  private makeBtn(
    x: number, y: number,
    label: string,
    accent: number,
    fadeDelay: number,
    action: () => void,
  ) {
    const W  = 240;
    const H  = 34;
    const bg = this.add.graphics();

    const draw = (hover: boolean) => {
      bg.clear();
      drawGlowPanel(
        bg, x - W / 2, y - H / 2, W, H,
        accent, hover ? UI.BTN_BG_HOVER : UI.BTN_BG, 4,
      );
      if (hover) {
        // Accent renforcé au survol / tap — feedback immédiat
        bg.lineStyle(1, accent, 0.85);
        bg.strokeRoundedRect(x - W / 2 + 2, y - H / 2 + 2, W - 4, H - 4, 2);
      }
    };

    draw(false);

    const txt = this.add.text(x, y, label, pxStyle(9, UI.TXT_PARCHMENT)).setOrigin(0.5);

    // Fade-in décalé (bg + label ensemble)
    bg.setAlpha(0);
    txt.setAlpha(0);
    this.tweens.add({
      targets: [bg, txt],
      alpha: 1,
      duration: 400,
      delay: fadeDelay,
      ease: 'Quad.easeOut',
    });

    const hit = this.add.rectangle(x, y, W, H + 10, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover',  () => { draw(true);  txt.setStyle({ color: UI.TXT_GOLD }); });
    hit.on('pointerout',   () => { draw(false); txt.setStyle({ color: UI.TXT_PARCHMENT }); });
    hit.on('pointerdown',  () => {
      // Feedback tap < 100ms : petit squash avant l'action
      this.tweens.add({
        targets: txt, scaleX: 0.94, scaleY: 0.94, duration: 50, yoyo: true,
      });
      action();
    });
  }

  private showNewGameMenu(slots: ReturnType<typeof SaveSystem.listSlots>) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const elems: Phaser.GameObjects.GameObject[] = [];

    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(20);
    elems.push(ov);

    const frame = this.add.graphics().setDepth(21);
    drawGlowPanel(frame, W / 2 - 240, H / 2 - 150, 480, 300, UI.ACCENT_VIOLET, UI.BG_DEEP, 6);
    elems.push(frame);

    elems.push(
      this.add.text(W / 2, H / 2 - 130, t('menu.select_slot'), pxStyle(11, UI.TXT_GOLD, true))
        .setOrigin(0.5).setDepth(22)
    );

    for (let i = 0; i < 3; i++) {
      const s    = slots[i];
      const by   = H / 2 - 60 + i * 62;
      const card = this.add.graphics().setDepth(21);
      drawGlowPanel(card, W / 2 - 200, by, 400, 48, UI.SEPARATOR, UI.BG_MID, 4);
      elems.push(card);

      const label = s
        ? `${t('menu.slot')} ${i + 1}  [${t('menu.slot.overwrite')}]  ${s.playerName} Lv.${s.level}`
        : `${t('menu.slot')} ${i + 1}  —  ${t('menu.new_game')}`;
      const col  = s ? UI.TXT_RED : UI.TXT_GREEN;

      const btn = this.add.text(W / 2, by + 24, label, pxStyle(8, col))
        .setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setStyle({ color: UI.TXT_WHITE }));
      btn.on('pointerout',  () => btn.setStyle({ color: col }));
      btn.on('pointerdown', () => {
        elems.forEach(e => e.destroy());
        this.scene.start('NameInputScene', { slot: i });
      });
      elems.push(btn);
    }

    const cancel = this.add.text(W / 2, H / 2 + 120, t('menu.cancel'), pxStyle(9, UI.TXT_MUTED))
      .setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
    cancel.on('pointerover', () => cancel.setStyle({ color: UI.TXT_RED }));
    cancel.on('pointerout',  () => cancel.setStyle({ color: UI.TXT_MUTED }));
    cancel.on('pointerdown', () => elems.forEach(e => e.destroy()));
    elems.push(cancel);
  }

  private showLoadMenu(slots: ReturnType<typeof SaveSystem.listSlots>) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const elems: Phaser.GameObjects.GameObject[] = [];

    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(20);
    elems.push(ov);

    const frame = this.add.graphics().setDepth(21);
    drawGlowPanel(frame, W / 2 - 240, H / 2 - 150, 480, 300, UI.GLOW_GOLD, UI.BG_DEEP, 6);
    elems.push(frame);

    elems.push(
      this.add.text(W / 2, H / 2 - 130, t('menu.load_title'), pxStyle(11, UI.TXT_GOLD, true))
        .setOrigin(0.5).setDepth(22)
    );

    let found = 0;
    for (let i = 0; i < 3; i++) {
      const s = slots[i];
      if (!s) continue;

      const by   = H / 2 - 60 + found * 62;
      const card = this.add.graphics().setDepth(21);
      drawGlowPanel(card, W / 2 - 200, by, 400, 48, UI.SEPARATOR, UI.BG_MID, 4);
      elems.push(card);

      const label = `${t('menu.slot')} ${i + 1}  ${s.playerName}  Lv.${s.level}  |  ${s.clearedZones}/6 zones`;
      const btn = this.add.text(W / 2, by + 24, label, pxStyle(8, UI.TXT_GREEN))
        .setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setStyle({ color: UI.TXT_WHITE }));
      btn.on('pointerout',  () => btn.setStyle({ color: UI.TXT_GREEN }));
      btn.on('pointerdown', () => {
        const state = SaveSystem.load(i);
        if (state) {
          state.saveSlot = i;
          elems.forEach(e => e.destroy());
          this.scene.start('GameScene', { gameState: state });
        }
      });
      elems.push(btn);
      found++;
    }

    const cancel = this.add.text(W / 2, H / 2 + 120, t('menu.cancel'), pxStyle(9, UI.TXT_MUTED))
      .setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
    cancel.on('pointerover', () => cancel.setStyle({ color: UI.TXT_RED }));
    cancel.on('pointerout',  () => cancel.setStyle({ color: UI.TXT_MUTED }));
    cancel.on('pointerdown', () => elems.forEach(e => e.destroy()));
    elems.push(cancel);
  }
}
