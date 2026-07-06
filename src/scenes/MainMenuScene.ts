import { SaveSystem } from '../systems/SaveSystem';
import { UI, drawGlowPanel, drawGlow, pxStyle } from '../utils/UITheme';
import { t } from '../i18n';

const GAME_VERSION = 'v0.7.0';

// ── Fond animé — constantes ───────────────────────────────────────────────────
// Ciel crépusculaire : dégradé vertical en bandes (pixel art, pas de blur)
const SKY_TOP    = 0x0a0a1f;   // nuit profonde
const SKY_BOTTOM = 0x1a0a0a;   // braise à l'horizon (le monde qui se ternit)
const SKY_BANDS  = 16;

// Silhouettes de montagnes — 3 plans, du plus lointain au plus proche.
// Chaque ridge est périodique sur la largeur W (scroll infini sans couture).
// Points : [fraction de W, hauteur en px au-dessus de la baseline].
const RIDGE_FAR: ReadonlyArray<readonly [number, number]> = [
  [0.00, 34], [0.09, 58], [0.16, 40], [0.26, 76], [0.33, 52],
  [0.44, 66], [0.52, 30], [0.62, 84], [0.71, 48], [0.82, 62], [0.92, 38],
];
const RIDGE_MID: ReadonlyArray<readonly [number, number]> = [
  [0.00, 22], [0.11, 52], [0.20, 30], [0.30, 64], [0.41, 36],
  [0.50, 58], [0.61, 26], [0.73, 70], [0.84, 40], [0.93, 28],
];
const RIDGE_NEAR: ReadonlyArray<readonly [number, number]> = [
  [0.00, 14], [0.13, 40], [0.24, 20], [0.37, 50], [0.48, 26],
  [0.60, 44], [0.72, 18], [0.85, 54], [0.94, 24],
];

// Couleurs des plans (désaturées, sombres — INSPIRATIONS.md : lumière ternissante)
const COL_FAR   = 0x181832;
const COL_MID   = 0x121226;
const COL_NEAR  = 0x0d0c1c;
const COL_CLIFF = 0x0a0916;
const COL_HERO  = 0x08070f;

// Vitesses de parallax (px/s) — lointain lent, proche plus rapide
const SPEED_FAR  = 2.5;
const SPEED_MID  = 4.5;
const SPEED_NEAR = 7.5;

// Étoiles à pulsation — positions relatives fixes (rendu identique à chaque
// ouverture du menu, pas de Math.random dans create()).
const PULSE_STARS: ReadonlyArray<readonly [number, number, number]> = [
  // [fx, fy, durée de pulsation ms]
  [0.08, 0.14, 1900],
  [0.16, 0.42, 2600],
  [0.24, 0.09, 2200],
  [0.31, 0.36, 2900],
  [0.44, 0.06, 2400],
  [0.58, 0.31, 2100],
  [0.71, 0.08, 2700],
  [0.83, 0.35, 2000],
  [0.90, 0.17, 2500],
  [0.94, 0.40, 2300],
];

export class MainMenuScene extends Phaser.Scene {
  // Couches parallax (dessinées sur 2×W, translatées puis rebouclées)
  private layerFar!:  Phaser.GameObjects.Graphics;
  private layerMid!:  Phaser.GameObjects.Graphics;
  private layerNear!: Phaser.GameObjects.Graphics;
  private offFar  = 0;
  private offMid  = 0;
  private offNear = 0;

  // Silhouette du personnage (respiration sinusoïdale)
  private hero!:     Phaser.GameObjects.Graphics;
  private heroBaseY = 0;

  // Garde anti double-tap pendant le fade out de transition
  private transitioning = false;

  constructor() { super({ key: 'MainMenuScene' }); }

  create() {
    this.transitioning = false;
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Fond animé (ciel → astres → montagnes → falaise + héros) ──
    this.drawSky(W, H);
    this.drawStars(W, H);
    this.drawMoons(W, H);

    this.layerFar  = this.buildRidge(COL_FAR,  Math.round(H * 0.62), RIDGE_FAR,  W, H);
    this.layerMid  = this.buildRidge(COL_MID,  Math.round(H * 0.74), RIDGE_MID,  W, H);
    this.layerNear = this.buildRidge(COL_NEAR, Math.round(H * 0.86), RIDGE_NEAR, W, H);

    this.drawCliffAndHero(W, H);

    // Voile de lisibilité : assombrit légèrement le fond sous les textes
    this.add.rectangle(W / 2, H / 2, W, H, 0x060810, 0.28);

    // Cadre décoratif — bordure seule, le fond reste visible
    const frame = this.add.graphics();
    frame.lineStyle(1, UI.SEPARATOR, 1);
    frame.strokeRoundedRect(6, 6, W - 12, H - 12, 6);
    frame.lineStyle(1, UI.BORDER_LIT, 0.3);
    frame.strokeRoundedRect(8, 8, W - 16, H - 16, 4);

    // Subtle separator lines (top and bottom horizontal)
    const deco = this.add.graphics();
    deco.lineStyle(1, UI.SEPARATOR, 1);
    deco.beginPath(); deco.moveTo(18, 96);     deco.lineTo(W - 18, 96);     deco.strokePath();
    deco.beginPath(); deco.moveTo(18, H - 70); deco.lineTo(W - 18, H - 70); deco.strokePath();
    deco.lineStyle(1, UI.GLOW_GOLD, 0.18);
    deco.beginPath(); deco.moveTo(W / 2 - 120, 96); deco.lineTo(W / 2 + 120, 96); deco.strokePath();

    // ── Title (halo doré + pulsation lumineuse douce) ──
    const titleGlow = this.add.graphics().setAlpha(0);
    drawGlow(titleGlow, W / 2 - 250, 22, 500, 30, UI.GLOW_GOLD, 0.9);

    const title = this.add.text(W / 2, 36, "GRIEVY TOWN'S DILEMMA", {
      ...pxStyle(24, UI.TXT_GOLD, true),
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [title, titleGlow],
      alpha: 1,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // Pulsation infinie : le titre respire entre 0.9 et 1.0
        this.tweens.add({
          targets: title, alpha: 0.9, duration: 2000,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
        this.tweens.add({
          targets: titleGlow, alpha: 0.55, duration: 2000,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      },
    });

    this.add.text(W / 2, 64, t('menu.subtitle'), pxStyle(8, UI.TXT_MUTED))
      .setOrigin(0.5);

    // Phrase inspirationnelle — le dilemme central (INSPIRATIONS.md §5)
    this.add.text(W / 2, 82, '« Chaque victoire est une perte. »', pxStyle(7, UI.TXT_HINT))
      .setOrigin(0.5);

    // ── Buttons (entrée échelonnée : 0 / 80 / 160 ms) ─
    const slots      = SaveSystem.listSlots();
    const hasAnySave = slots.some(s => s !== null);

    this.makeBtn(W / 2, 160, t('menu.new_game'), UI.ACCENT_VIOLET, 0,
      () => this.showNewGameMenu(slots));
    if (hasAnySave) {
      this.makeBtn(W / 2, 216, t('menu.load_save'), UI.GLOW_GOLD, 80,
        () => this.showLoadMenu(slots));
    }

    // ── Save slot cards ───────────────────────────
    this.add.text(W / 2, 276, t('menu.save_slots'), pxStyle(7, UI.TXT_HINT)).setOrigin(0.5);

    for (let i = 0; i < 3; i++) {
      const s    = slots[i];
      const cy   = 298 + i * 56;
      const card = this.add.graphics().setAlpha(0);
      drawGlowPanel(card, W / 2 - 200, cy, 400, 44, UI.SEPARATOR, UI.BG_MID, 4, 0.92);

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

  // ── Boucle : parallax + respiration du héros ────────────────────────────────
  update(time: number, delta: number) {
    if (!this.layerFar) return;
    const W  = this.cameras.main.width;
    const dt = delta / 1000;

    this.offFar  = (this.offFar  + SPEED_FAR  * dt) % W;
    this.offMid  = (this.offMid  + SPEED_MID  * dt) % W;
    this.offNear = (this.offNear + SPEED_NEAR * dt) % W;

    // Les couches sont dessinées sur [0, 2W] : translater de -offset puis
    // reboucler à W suffit pour un scroll infini sans redraw.
    this.layerFar.x  = -Math.round(this.offFar);
    this.layerMid.x  = -Math.round(this.offMid);
    this.layerNear.x = -Math.round(this.offNear);

    // Micro-oscillation verticale du héros (respiration, période ~3 s, ±1.5 px)
    if (this.hero) {
      this.hero.y = this.heroBaseY + Math.round(Math.sin((time / 3000) * Math.PI * 2) * 1.5);
    }
  }

  // ── Fond animé — dessin ─────────────────────────────────────────────────────

  /** Ciel crépusculaire en bandes horizontales (dégradé pixel art, sans blur). */
  private drawSky(W: number, H: number) {
    const g = this.add.graphics();
    const top    = Phaser.Display.Color.ValueToColor(SKY_TOP);
    const bottom = Phaser.Display.Color.ValueToColor(SKY_BOTTOM);
    const bandH  = Math.ceil(H / SKY_BANDS);
    for (let i = 0; i < SKY_BANDS; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, SKY_BANDS - 1, i);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, i * bandH, W, bandH);
    }
  }

  /** ~50 étoiles fixes (LCG déterministe) + 10 étoiles à pulsation douce. */
  private drawStars(W: number, H: number) {
    // Étoiles statiques — générées par un LCG à graine fixe : même ciel à
    // chaque ouverture, zéro Math.random.
    let seed = 1337;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

    const g = this.add.graphics();
    for (let i = 0; i < 42; i++) {
      const x    = Math.round(rnd() * W);
      const y    = Math.round(rnd() * H * 0.55);           // au-dessus des montagnes
      const size = rnd() < 0.8 ? 1 : 2;
      g.fillStyle(0xf5edd0, 0.10 + rnd() * 0.25);
      g.fillRect(x, y, size, size);
    }

    // Étoiles à pulsation (tweens détruits au shutdown de la scène)
    PULSE_STARS.forEach(([fx, fy, dur], i) => {
      const star = this.add.rectangle(
        Math.round(W * fx), Math.round(H * fy), 2, 2, 0xf5edd0, 1,
      ).setAlpha(0.12);
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
  }

  /** Deux astres : lune principale (lueur douce) + compagne lointaine. */
  private drawMoons(W: number, H: number) {
    const g = this.add.graphics();

    // Lune principale — haut droite, halo en cercles concentriques
    const mx = Math.round(W * 0.80);
    const my = Math.round(H * 0.20);
    g.fillStyle(0xcfc8b8, 0.02); g.fillCircle(mx, my, 36);
    g.fillStyle(0xcfc8b8, 0.04); g.fillCircle(mx, my, 27);
    g.fillStyle(0xcfc8b8, 0.07); g.fillCircle(mx, my, 21);
    g.fillStyle(0xcfc8b8, 1);    g.fillCircle(mx, my, 15);
    // Cratères (pixels sombres)
    g.fillStyle(0x9a9284, 0.7);
    g.fillRect(mx - 6, my - 4, 4, 4);
    g.fillRect(mx + 3, my + 2, 3, 3);
    g.fillRect(mx - 1, my + 7, 2, 2);

    // Compagne lointaine — plus petite, violacée, discrète
    const sx = Math.round(W * 0.14);
    const sy = Math.round(H * 0.31);
    g.fillStyle(0x9088a8, 0.04); g.fillCircle(sx, sy, 12);
    g.fillStyle(0x9088a8, 0.85); g.fillCircle(sx, sy, 6);
    g.fillStyle(0x6f688a, 0.8);  g.fillRect(sx - 2, sy - 1, 2, 2);
  }

  /**
   * Silhouette de montagnes en escaliers (pixel art), périodique sur W et
   * dessinée deux fois (largeur 2W) pour un scroll infini par translation.
   */
  private buildRidge(
    color: number,
    baseY: number,
    pts: ReadonlyArray<readonly [number, number]>,
    W: number,
    H: number,
  ): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(0, H);
    let lastY = baseY - pts[0][1];
    g.lineTo(0, lastY);
    for (let copy = 0; copy < 2; copy++) {
      for (const [fx, rise] of pts) {
        const px = Math.round((copy + fx) * W);
        const py = baseY - rise;
        // Marches horizontales puis verticales → crêtes en escalier 8-bit
        g.lineTo(px, lastY);
        g.lineTo(px, py);
        lastY = py;
      }
    }
    // Refermer la 2e copie sur la hauteur du point de départ (sans couture)
    g.lineTo(2 * W, lastY);
    g.lineTo(2 * W, H);
    g.closePath();
    g.fillPath();
    return g;
  }

  /** Falaise fixe en bas-gauche + silhouette du héros qui regarde l'horizon. */
  private drawCliffAndHero(W: number, H: number) {
    const cliffTop = H - 92;

    // Falaise : promontoire en marches descendantes vers la droite
    const cliff = this.add.graphics();
    cliff.fillStyle(COL_CLIFF, 1);
    cliff.beginPath();
    cliff.moveTo(0, H);
    cliff.lineTo(0, cliffTop);
    cliff.lineTo(118, cliffTop);
    cliff.lineTo(118, cliffTop + 14);
    cliff.lineTo(142, cliffTop + 14);
    cliff.lineTo(142, cliffTop + 34);
    cliff.lineTo(160, cliffTop + 34);
    cliff.lineTo(160, H);
    cliff.closePath();
    cliff.fillPath();
    // Arête éclairée par la lune (1 px, très discret)
    cliff.lineStyle(1, 0x2a2440, 0.8);
    cliff.beginPath();
    cliff.moveTo(0, cliffTop); cliff.lineTo(118, cliffTop);
    cliff.strokePath();

    // Héros — silhouette pixel : corps 4×16, tête 6×6, tourné vers l'horizon
    this.heroBaseY = cliffTop;
    this.hero = this.add.graphics({ x: 84, y: this.heroBaseY });
    this.hero.fillStyle(COL_HERO, 1);
    this.hero.fillRect(-2, -16, 4, 16);       // corps (pieds sur la falaise)
    this.hero.fillRect(-3, -22, 6, 6);        // tête
    this.hero.fillRect(2, -14, 2, 7);         // bras vers l'horizon (droite)
    // Liseré lunaire sur l'épaule — le seul pixel de lumière du personnage
    this.hero.fillStyle(0x4a4468, 0.9);
    this.hero.fillRect(-3, -17, 1, 4);
  }

  // ── Transition sortante standard : fade out 300 ms puis scene.start ─────────
  private transitionTo(key: string, data?: object) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => this.scene.start(key, data),
    );
  }

  private makeBtn(
    x: number, y: number,
    label: string,
    accent: number,
    entryDelay: number,
    action: () => void,
  ) {
    const W  = 240;
    const H  = 34;
    const bg = this.add.graphics();

    const draw = (hover: boolean) => {
      bg.clear();
      drawGlowPanel(
        bg, -W / 2, -H / 2, W, H,
        accent, hover ? UI.BTN_BG_HOVER : UI.BTN_BG, 4, 0.92,
      );
      if (hover) {
        // Accent renforcé au survol / tap — feedback immédiat
        bg.lineStyle(1, accent, 0.85);
        bg.strokeRoundedRect(-W / 2 + 2, -H / 2 + 2, W - 4, H - 4, 2);
      }
    };

    draw(false);

    const txt = this.add.text(0, 0, label, pxStyle(9, UI.TXT_PARCHMENT)).setOrigin(0.5);

    // Container centré : permet le scale hover autour du centre du bouton
    const box = this.add.container(x, y + 8, [bg, txt]).setAlpha(0);

    // Entrée échelonnée : fade + petite montée, déclenchée par delayedCall
    this.time.delayedCall(entryDelay, () => {
      this.tweens.add({
        targets: box, alpha: 1, y, duration: 350, ease: 'Quad.easeOut',
      });
    });

    const hit = this.add.rectangle(x, y, W, H + 10, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover',  () => {
      draw(true);
      txt.setStyle({ color: UI.TXT_GOLD });
      this.tweens.add({ targets: box, scaleX: 1.03, scaleY: 1.03, duration: 100, ease: 'Quad.easeOut' });
    });
    hit.on('pointerout',   () => {
      draw(false);
      txt.setStyle({ color: UI.TXT_PARCHMENT });
      this.tweens.add({ targets: box, scaleX: 1, scaleY: 1, duration: 100, ease: 'Quad.easeOut' });
    });
    hit.on('pointerdown',  () => {
      // Feedback tap < 100ms : petit squash avant l'action
      this.tweens.add({
        targets: box, scaleX: 0.96, scaleY: 0.96, duration: 50, yoyo: true,
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
        this.transitionTo('NameInputScene', { slot: i });
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
          this.transitionTo('GameScene', { gameState: state });
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
