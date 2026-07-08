import { SaveSystem } from '../systems/SaveSystem';
import { UI, drawGlowPanel, pxStyle, uiStyle } from '../utils/UITheme';
import { t } from '../i18n';

const GAME_VERSION = 'v0.7.0';

// ── Palette diorama verdoyant v2 ──────────────────────────────────────────────
// Ciel
const SKY_TOP    = 0x4da8d8;
const SKY_MID    = 0x72bfe0;
const SKY_HORIZ  = 0xa0d4e8;
const SKY_HAZE   = 0xd4eaf0;
// Nuages
const CLOUD_WHITE  = 0xf0f4f8;
const CLOUD_SHADOW = 0xc8d4dc;
const CLOUD_LIT    = 0xffffff;
// Montagnes
const MTN1 = 0x8090a0; // très loin, brumeux
const MTN2 = 0x5a7a6a; // plan 2, vert-gris
const MTN3 = 0x3a6040; // plan 3, vert montagne
const MTN4 = 0x2a4a30; // plan 4, forêt dense
const SNOW  = 0xe8eef4;
// Eau / Lac
const WATER_MAIN   = 0x2a8080;
const WATER_LIGHT  = 0x48a8a0;
const WATER_DARK   = 0x1a5858;
const WATER_HORIZ  = 0x60b0b0;
const WATER_REFLECT = 0x78c0b8;
const WATER_FOAM   = 0xa0d4d0; // écume claire à la jonction rive/lac
// Végétation
const GRASS_BRIGHT = 0x5ab82a;
const GRASS_MID    = 0x3a8818;
const GRASS_DARK   = 0x285a10;
const FOLIAGE_LIT  = 0x4a9830;
const FOLIAGE_MID  = 0x2a7020;
const CONIFER      = 0x1a4020;
const TRUNK        = 0x6a4020;
// Terrain & structure
const CLIFF_LIT    = 0x90a070;
const CLIFF_STONE  = 0x708060;
const ROCK_COL     = 0x888878;
const BRIDGE_LIT   = 0xc0b090;
const BRIDGE_SHADE = 0x808060;
// Fleurs
const FLOWER_PINK   = 0xff80a0;
const FLOWER_WHITE  = 0xfff0d0;
const FLOWER_YELLOW = 0xffee60;
// Héros
const HERO_COL = 0x1a1020;

export class MainMenuScene extends Phaser.Scene {
  // TileSprites animés dans update()
  private cloudsFar!:  Phaser.GameObjects.TileSprite;
  private cloudsMid!:  Phaser.GameObjects.TileSprite;
  private cloudsNear!: Phaser.GameObjects.TileSprite;
  private waterSprite!: Phaser.GameObjects.TileSprite;

  // Bornes horizontales du lac (posées par drawWater, lues par drawTerrain
  // pour poser l'écume de rive exactement à la jonction eau/falaise)
  private waterX0 = 0;
  private waterX1 = 0;

  // Silhouette héros
  private hero!:     Phaser.GameObjects.Graphics;
  private heroBaseY = 0;

  // Garde anti double-tap fade out
  private transitioning = false;

  constructor() { super({ key: 'MainMenuScene' }); }

  // ─────────────────────────────────────────────────────────────────────────────
  // create
  // ─────────────────────────────────────────────────────────────────────────────
  create() {
    this.transitioning = false;
    this.cameras.main.fadeIn(400, 0, 0, 0);
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Fond diorama (depth croissant arrière → avant)
    this.drawSky(W, H);           // depth 0
    this.drawSunRays(W, H);       // depth 2
    this.drawClouds(W, H);        // depth 3, 5, 6
    this.drawFarMountains(W, H);  // depth 8, 12
    this.drawMidMountains(W, H);  // depth 18
    this.drawWater(W, H);         // depth 22
    this.drawRiverForest(W, H);   // depth 28
    this.drawTerrain(W, H);       // depth 35
    this.drawBridge(W, H);        // depth 40
    this.drawForeground(W, H);    // depth 50
    this.drawHero(W, H);          // depth 60

    // Voile de lisibilité — corridor central assombri (colonne UI) + bande
    // pied de page, plutôt qu'un voile plat uniforme : les flancs gauche/droit
    // (où vivent le pont et le héros) restent lumineux et saturés, tandis que
    // la colonne centrale (titre, boutons, cartes de sauvegarde) gagne le
    // contraste nécessaire à la lecture des textes discrets (TXT_MUTED/HINT).
    this.drawReadabilityScrim(W, H); // depth 79

    // ── Cadre décoratif ──
    const frame = this.add.graphics().setDepth(85).setScrollFactor(0);
    frame.lineStyle(1, UI.SEPARATOR, 1);
    frame.strokeRoundedRect(6, 6, W - 12, H - 12, 6);
    frame.lineStyle(1, UI.BORDER_LIT, 0.3);
    frame.strokeRoundedRect(8, 8, W - 16, H - 16, 4);

    const deco = this.add.graphics().setDepth(85).setScrollFactor(0);
    deco.lineStyle(1, UI.SEPARATOR, 1);
    deco.beginPath(); deco.moveTo(18, 96);     deco.lineTo(W - 18, 96);     deco.strokePath();
    deco.beginPath(); deco.moveTo(18, H - 70); deco.lineTo(W - 18, H - 70); deco.strokePath();
    deco.lineStyle(1, UI.GLOW_GOLD, 0.18);
    deco.beginPath(); deco.moveTo(W / 2 - 120, 96); deco.lineTo(W / 2 + 120, 96); deco.strokePath();

    // ── Titre ── halo doré derrière le texte
    const titleGlow = this.add.graphics().setAlpha(0).setDepth(90).setScrollFactor(0);
    titleGlow.fillStyle(UI.GLOW_GOLD, 0.06); titleGlow.fillEllipse(W / 2, 40, 520, 60);
    titleGlow.fillStyle(UI.GLOW_GOLD, 0.10); titleGlow.fillEllipse(W / 2, 40, 400, 44);
    titleGlow.fillStyle(UI.GLOW_GOLD, 0.15); titleGlow.fillEllipse(W / 2, 40, 300, 32);

    const title = this.add.text(W / 2, 36, "GRIEVY TOWN'S DILEMMA", {
      ...pxStyle(24, UI.TXT_GOLD, true),
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0).setDepth(91).setScrollFactor(0);

    this.tweens.add({
      targets: [title, titleGlow], alpha: 1, duration: 500, ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: title, alpha: 0.9, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
        this.tweens.add({
          targets: titleGlow, alpha: 0.55, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      },
    });

    this.add.text(W / 2, 64, t('menu.subtitle'), uiStyle(11, UI.TXT_MUTED))
      .setOrigin(0.5).setDepth(91).setScrollFactor(0);
    this.add.text(W / 2, 82, '« Chaque victoire est une perte. »', uiStyle(10, UI.TXT_HINT, { italic: true }))
      .setOrigin(0.5).setDepth(91).setScrollFactor(0);

    // ── Boutons ──
    const slots      = SaveSystem.listSlots();
    const hasAnySave = slots.some(s => s !== null);

    this.makeBtn(W / 2, 160, t('menu.new_game'), UI.ACCENT_VIOLET, 0,
      () => this.showNewGameMenu(slots));
    if (hasAnySave) {
      this.makeBtn(W / 2, 216, t('menu.load_save'), UI.GLOW_GOLD, 80,
        () => this.showLoadMenu(slots));
    }

    // ── Save slot cards ──
    this.add.text(W / 2, 276, t('menu.save_slots'), uiStyle(10, UI.TXT_HINT))
      .setOrigin(0.5).setDepth(91).setScrollFactor(0);

    for (let i = 0; i < 3; i++) {
      const s    = slots[i];
      const cy   = 298 + i * 56;
      const card = this.add.graphics().setAlpha(0).setDepth(90).setScrollFactor(0);
      drawGlowPanel(card, W / 2 - 200, cy, 400, 44, UI.SEPARATOR, UI.BG_MID, 4);

      const cardTexts: Phaser.GameObjects.Text[] = [];
      if (s) {
        cardTexts.push(
          this.add.text(W / 2 - 188, cy + 6,
            `${t('menu.slot')} ${i + 1}`, uiStyle(10, UI.TXT_GOLD, { bold: true })).setDepth(91).setScrollFactor(0),
          this.add.text(W / 2 - 188, cy + 23,
            `${s.playerName}  Lv.${s.level}`, uiStyle(11, UI.TXT_PARCHMENT)).setDepth(91).setScrollFactor(0),
          this.add.text(W / 2 + 190, cy + 6,
            `${s.clearedZones}/6 zones`, uiStyle(10, UI.TXT_MUTED)).setOrigin(1, 0).setDepth(91).setScrollFactor(0),
          this.add.text(W / 2 + 190, cy + 23,
            SaveSystem.formatPlaytime(s.playtime), uiStyle(10, UI.TXT_MUTED)).setOrigin(1, 0).setDepth(91).setScrollFactor(0),
        );
      } else {
        cardTexts.push(
          this.add.text(W / 2, cy + 22,
            `${t('menu.slot')} ${i + 1}  —  ${t('menu.slot.empty')}`, uiStyle(10, UI.TXT_HINT))
            .setOrigin(0.5).setDepth(91).setScrollFactor(0),
        );
      }
      cardTexts.forEach(txt => txt.setAlpha(0));
      this.tweens.add({
        targets: [card, ...cardTexts], alpha: 1, duration: 350,
        delay: 400 + i * 100, ease: 'Quad.easeOut',
      });
    }

    // ── Footer ──
    this.add.text(W / 2, H - 14, t('menu.controls'), uiStyle(9, UI.TXT_HINT))
      .setOrigin(0.5, 1).setDepth(91).setScrollFactor(0);
    this.add.text(W - 14, H - 14, GAME_VERSION, uiStyle(9, UI.TXT_HINT))
      .setOrigin(1, 1).setDepth(91).setScrollFactor(0);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // update : drift des nuages + eau
  // ─────────────────────────────────────────────────────────────────────────────
  update(_time: number, delta: number) {
    const dt = delta / 16;
    if (this.cloudsFar)  this.cloudsFar.tilePositionX  += 0.03 * dt;
    if (this.cloudsMid)  this.cloudsMid.tilePositionX  += 0.05 * dt;
    if (this.cloudsNear) this.cloudsNear.tilePositionX += 0.06 * dt;
    if (this.waterSprite) this.waterSprite.tilePositionX += 0.015 * dt;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LCG déterministe
  // ─────────────────────────────────────────────────────────────────────────────
  private makeLcg(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 0x100000000;
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawSky — gradient bleu clair zenith → haze horizon
  // ─────────────────────────────────────────────────────────────────────────────
  private drawSky(W: number, H: number): void {
    const g = this.add.graphics().setDepth(0).setScrollFactor(0);
    const BANDS = 16;
    const bandH = Math.ceil(H / BANDS);

    const topC   = Phaser.Display.Color.ValueToColor(SKY_TOP);
    const midC   = Phaser.Display.Color.ValueToColor(SKY_MID);
    const horizC = Phaser.Display.Color.ValueToColor(SKY_HORIZ);
    const hazeC  = Phaser.Display.Color.ValueToColor(SKY_HAZE);

    for (let i = 0; i < BANDS; i++) {
      const tf = i / (BANDS - 1);
      let c: Phaser.Types.Display.ColorObject;
      if (tf < 0.45) {
        c = Phaser.Display.Color.Interpolate.ColorWithColor(topC, midC, 1, tf / 0.45);
      } else if (tf < 0.78) {
        c = Phaser.Display.Color.Interpolate.ColorWithColor(midC, horizC, 1, (tf - 0.45) / 0.33);
      } else {
        c = Phaser.Display.Color.Interpolate.ColorWithColor(horizC, hazeC, 1, (tf - 0.78) / 0.22);
      }
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, i * bandH, W, bandH + 1);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawSunRays — rayons de lumière diagonaux très subtils
  // ─────────────────────────────────────────────────────────────────────────────
  private drawSunRays(W: number, H: number): void {
    const g = this.add.graphics().setDepth(2).setScrollFactor(0);
    // Rayons partant du coin haut-gauche vers la droite-bas
    const originX = Math.round(W * 0.05);
    const originY = 0;
    const rays = [
      { angle: 0.28, width: 80, alpha: 0.05 },
      { angle: 0.38, width: 60, alpha: 0.07 },
      { angle: 0.50, width: 100, alpha: 0.04 },
      { angle: 0.62, width: 70, alpha: 0.06 },
      { angle: 0.75, width: 50, alpha: 0.05 },
    ];
    rays.forEach(ray => {
      const endX = originX + Math.round(Math.cos(ray.angle) * W * 1.4);
      const endY = originY + Math.round(Math.sin(ray.angle) * H * 1.4);
      const perpX = Math.round(-Math.sin(ray.angle) * ray.width * 0.5);
      const perpY = Math.round(Math.cos(ray.angle) * ray.width * 0.5);
      g.fillStyle(0xffffdd, ray.alpha);
      g.fillTriangle(
        originX + perpX, originY + perpY,
        originX - perpX, originY - perpY,
        endX, endY,
      );
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawReadabilityScrim — assombrissement ciblé plutôt qu'un voile plat :
  // un "corridor" vertical centré sur la colonne UI (titre/boutons/cartes),
  // qui s'estompe avant d'atteindre les flancs où vivent le pont et le héros,
  // plus une bande pied de page pour les libellés footer (souvent hors-carte).
  // ─────────────────────────────────────────────────────────────────────────────
  private drawReadabilityScrim(W: number, H: number): void {
    const g = this.add.graphics().setDepth(79).setScrollFactor(0);

    // Wash global très léger — garde une base de contraste partout
    g.fillStyle(0x000818, 0.08);
    g.fillRect(0, 0, W, H);

    // Corridor central : la zone occupée par le titre/boutons/cartes de
    // sauvegarde va de x≈190 à x≈610 (colonne 400±200 + marge). Au-delà,
    // l'assombrissement retombe à ~0 pour préserver la vivacité des flancs.
    const cx      = W / 2;
    const halfHot = W * 0.26;   // bords du corridor ≈ 190 / 610 sur 800px
    const step    = 10;
    for (let x = 0; x < W; x += step) {
      const dist  = Math.abs((x + step / 2) - cx);
      const t     = Math.max(0, 1 - dist / halfHot);
      const extra = 0.22 * Math.pow(t, 1.3);
      if (extra > 0.004) {
        g.fillStyle(0x000818, extra);
        g.fillRect(x, 0, step, H);
      }
    }

    // Bande pied de page — les libellés footer (contrôles + version) sont
    // en TXT_HINT (très sombre) sur l'herbe déjà sombre : renforcer là aussi,
    // y compris sur les flancs (le texte version est collé au coin droit).
    const footerH = 34;
    g.fillStyle(0x000000, 0.28);
    g.fillRect(0, H - footerH, W, footerH);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawClouds — 3 couches TileSprite
  // ─────────────────────────────────────────────────────────────────────────────
  private drawClouds(W: number, H: number): void {
    // ─ Couche lointaine : petits nuages grisés ─
    const gFar    = this.add.graphics();
    const farTexW = W * 2;
    const farTexH = 50;
    const farPositions = [0.06, 0.22, 0.38, 0.58, 0.74, 0.90];
    farPositions.forEach((fx, idx) => {
      const cx = Math.round(fx * farTexW);
      const cy = Math.round(farTexH * 0.45 + (idx % 3) * 6);
      this.drawCloudBlob(gFar, cx, cy, 40 + (idx % 3) * 10, 14, 0xe0e8f0, 0.65);
    });
    gFar.generateTexture('clouds_far_v2', farTexW, farTexH);
    gFar.destroy();
    this.cloudsFar = this.add
      .tileSprite(0, Math.round(H * 0.20), farTexW, farTexH, 'clouds_far_v2')
      .setOrigin(0, 0.5).setDepth(3).setScrollFactor(0);

    // ─ Couche médiane : nuages moyens ─
    const gMid    = this.add.graphics();
    const midTexW = W * 2;
    const midTexH = 70;
    const midPositions: Array<[number, number, number]> = [
      [0.10, 0.5, 65], [0.30, 0.42, 60], [0.62, 0.48, 70], [0.84, 0.5, 62],
    ];
    midPositions.forEach(([fx, fy, cw]) => {
      this.drawCloudBlob(gMid,
        Math.round(fx * midTexW),
        Math.round(fy * midTexH),
        cw, 22, CLOUD_WHITE, 0.80,
      );
    });
    gMid.generateTexture('clouds_mid_v2', midTexW, midTexH);
    gMid.destroy();
    this.cloudsMid = this.add
      .tileSprite(0, Math.round(H * 0.27), midTexW, midTexH, 'clouds_mid_v2')
      .setOrigin(0, 0.5).setDepth(5).setScrollFactor(0);

    // ─ Couche proche : gros cumulus ─
    const gNear    = this.add.graphics();
    const nearTexW = W * 2;
    const nearTexH = 100;
    const nearPositions: Array<[number, number, number]> = [
      [0.10, 0.55, 120], [0.38, 0.45, 105], [0.62, 0.50, 135], [0.85, 0.48, 110],
    ];
    nearPositions.forEach(([fx, fy, cw]) => {
      this.drawCloudBlob(gNear,
        Math.round(fx * nearTexW),
        Math.round(fy * nearTexH),
        cw, 42, CLOUD_WHITE, 1.0,
      );
    });
    gNear.generateTexture('clouds_near_v2', nearTexW, nearTexH);
    gNear.destroy();
    this.cloudsNear = this.add
      .tileSprite(0, Math.round(H * 0.18), nearTexW, nearTexH, 'clouds_near_v2')
      .setOrigin(0, 0.5).setDepth(6).setScrollFactor(0);
  }

  private drawCloudBlob(
    g: Phaser.GameObjects.Graphics,
    cx: number, cy: number,
    w: number, h: number,
    color: number, alpha: number,
  ): void {
    const steps = Math.max(2, Math.ceil(w / 8));
    for (let i = 0; i < steps; i++) {
      const tStep = i / (steps - 1);
      const bumpH = Math.sin(tStep * Math.PI) * h;
      const topY  = cy - Math.round(bumpH * 0.68);
      const botY  = cy + Math.round(bumpH * 0.32);
      const bx    = cx - Math.round(w / 2) + i * 8;
      const bh    = Math.max(2, botY - topY);
      // Corps principal
      g.fillStyle(color, alpha);
      g.fillRect(bx, topY, 8, bh);
      // Reflet lumineux en haut
      g.fillStyle(CLOUD_LIT, alpha * 0.55);
      g.fillRect(bx, topY, 8, Math.min(5, Math.round(bh * 0.3)));
      // Ombre douce en bas
      g.fillStyle(CLOUD_SHADOW, alpha * 0.5);
      g.fillRect(bx, botY - Math.min(6, Math.round(bh * 0.3)), 8, Math.min(6, Math.round(bh * 0.3)));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawFarMountains — plans 1 et 2 brumeux avec neige
  // ─────────────────────────────────────────────────────────────────────────────
  private drawFarMountains(W: number, H: number): void {
    // Plan 1 — très loin, brumeux gris
    // baseY relevé (0.40 au lieu de 0.50) : la base du plan lointain doit
    // rester au-dessus du lac (voir drawWater, waterY≈0.46H) pour ne pas
    // disparaître entièrement derrière l'eau, et ses pics doivent garder
    // une marge nette sous le titre/sous-titre/citation (y max ≈ 96).
    this.buildMountainImage('mtn_far1_v2', W, H, {
      color:    MTN1,
      baseYR:   0.40,
      minH:     60,
      maxH:     90,
      snow:     true,
      snowR:    0.18,
      conifer:  false,
      depth:    8,
      lcgSeed:  11,
    });
    // Plan 2 — vert-gris
    this.buildMountainImage('mtn_far2_v2', W, H, {
      color:    MTN2,
      baseYR:   0.45,
      minH:     90,
      maxH:     125,
      snow:     true,
      snowR:    0.15,
      conifer:  false,
      depth:    12,
      lcgSeed:  22,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawMidMountains — plans 3 et 4 verts avec pins
  // ─────────────────────────────────────────────────────────────────────────────
  private drawMidMountains(W: number, H: number): void {
    // baseY relevé (0.52) : la base plonge dans le lac (comportement voulu,
    // "montagne qui se noie derrière l'eau"), mais les pics restent bien
    // au-dessus de la ligne d'eau et loin sous le bloc titre/citation.
    this.buildMountainImage('mtn_mid_v2', W, H, {
      color:    MTN3,
      baseYR:   0.52,
      minH:     140,
      maxH:     190,
      snow:     false,
      snowR:    0,
      conifer:  true,
      depth:    18,
      lcgSeed:  33,
    });
  }

  private buildMountainImage(
    key: string,
    W: number,
    H: number,
    cfg: {
      color: number;
      baseYR: number;
      minH: number;
      maxH: number;
      snow: boolean;
      snowR: number;
      conifer: boolean;
      depth: number;
      lcgSeed: number;
    },
  ): void {
    const g      = this.add.graphics();
    const baseY  = Math.round(H * cfg.baseYR);
    const rng    = this.makeLcg(cfg.lcgSeed);

    // Remplissage du bas
    g.fillStyle(cfg.color, 1);
    g.fillRect(0, baseY, W, H - baseY);

    const numPeaks = Math.round(W / 44);
    const peaks: Array<{ px: number; ph: number }> = [];
    for (let i = 0; i <= numPeaks; i++) {
      peaks.push({
        px: Math.round((i / numPeaks) * W),
        ph: Math.round(cfg.minH + rng() * (cfg.maxH - cfg.minH)),
      });
    }

    peaks.forEach(({ px, ph }, idx) => {
      if (idx === 0) return;
      const prevPx = peaks[idx - 1].px;
      const peakX  = Math.round((prevPx + px) / 2);
      const peakTopY = baseY - ph;
      const steps  = Math.max(1, Math.round(ph / 4));

      g.fillStyle(cfg.color, 1);
      for (let s = 0; s < steps; s++) {
        const stepT = s / steps;
        const stepW = Math.max(2, Math.round((px - prevPx) * stepT * 0.9));
        g.fillRect(
          peakX - Math.round(stepW / 2),
          peakTopY + Math.round(stepT * ph),
          stepW, 4,
        );
      }

      if (cfg.snow) {
        g.fillStyle(SNOW, 1);
        const snowH = Math.max(4, Math.round(ph * cfg.snowR));
        for (let s = 0; s < Math.round(snowH / 2); s++) {
          const sw = Math.max(2, (snowH - s) * 2);
          g.fillRect(peakX - Math.round(sw / 2), peakTopY + s * 2, sw, 2);
        }
        g.fillStyle(cfg.color, 1);
      }

      if (cfg.conifer) {
        const numPines = 2 + Math.round(rng() * 3);
        for (let p = 0; p < numPines; p++) {
          const pineX    = prevPx + Math.round(rng() * (px - prevPx));
          const pineBase = baseY - Math.round(rng() * ph * 0.35 + ph * 0.05);
          this.drawConifer(g, pineX, pineBase, 16);
        }
      }
    });

    g.generateTexture(key, W, H);
    g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(cfg.depth).setScrollFactor(0);
  }

  private drawConifer(g: Phaser.GameObjects.Graphics, x: number, baseY: number, h: number): void {
    const rows = Math.max(1, Math.round(h * 0.75 / 3));
    const tw   = Math.round(h * 0.55);
    g.fillStyle(CONIFER, 1);
    for (let r = 0; r < rows; r++) {
      const rw = Math.max(2, Math.round((tw * (r + 1)) / rows));
      g.fillRect(x - Math.round(rw / 2), baseY - h + r * 3, rw, 3);
    }
    g.fillStyle(TRUNK, 1);
    g.fillRect(x - 2, baseY - 7, 4, 7);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawWater — lac central avec TileSprite animé
  // ─────────────────────────────────────────────────────────────────────────────
  private drawWater(W: number, H: number): void {
    // waterY/waterH resserrés (0.46/0.22 au lieu de 0.57/0.26) : dans la
    // version précédente, la falaise avant-plan (cliffY≈0.64H) recouvrait
    // près des 3/4 de la hauteur du lac, qui se réduisait à un mince filet
    // turquoise. Ici le lac se termine à 0.68H et la falaise ne commence
    // qu'à 0.66H : ~90% du lac reste visible, seule la rive proche (dernier
    // 10%) se fond sous l'herbe, comme une vraie perspective de bord d'eau.
    const waterY = Math.round(H * 0.46);
    const waterH = Math.round(H * 0.22);
    const waterX = Math.round(W * 0.12);
    const waterW = Math.round(W * 0.76);
    this.waterX0 = waterX;
    this.waterX1 = waterX + waterW;

    // Bande herbeuse sur la rive supérieure (berge opposée)
    const bankG = this.add.graphics().setDepth(21).setScrollFactor(0);
    bankG.fillStyle(GRASS_MID, 1);
    bankG.fillRect(waterX, waterY - 4, waterW, 5);
    bankG.fillStyle(GRASS_BRIGHT, 1);
    bankG.fillRect(waterX, waterY - 5, waterW, 2);

    // Génération texture eau avec reflets
    const g = this.add.graphics();
    const colors = [WATER_MAIN, WATER_LIGHT, WATER_DARK, WATER_LIGHT, WATER_MAIN];
    for (let y = 0; y < waterH; y++) {
      const tDepth = y / waterH;
      // Dégradé : plus clair à l'horizon (haut), plus sombre au premier plan (bas)
      const baseCol = tDepth < 0.15
        ? WATER_HORIZ
        : colors[y % colors.length];
      g.fillStyle(baseCol, 1);
      g.fillRect(0, y, waterW, 1);
      // Reflets larges toutes les 3 lignes
      if (y % 3 === 0) {
        const refX = Math.round((waterW * 0.08) + ((y * 0.7) % (waterW * 0.65)));
        g.fillStyle(WATER_REFLECT, 0.32);
        g.fillRect(refX, y, 24, 1);
      }
    }
    g.generateTexture('water_v2', waterW, waterH);
    g.destroy();

    this.waterSprite = this.add
      .tileSprite(
        waterX + Math.round(waterW / 2),
        waterY + Math.round(waterH / 2),
        waterW, waterH,
        'water_v2',
      )
      .setScrollFactor(0)
      .setDepth(22);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawRiverForest — rangée d'arbres feuillus sur la rive opposée
  // ─────────────────────────────────────────────────────────────────────────────
  private drawRiverForest(W: number, H: number): void {
    const g   = this.add.graphics().setDepth(28).setScrollFactor(0);
    const ry  = Math.round(H * 0.44); // rive opposée, juste au-dessus de la nouvelle ligne d'eau
    const rng = this.makeLcg(55);

    // Sol de la rive
    g.fillStyle(GRASS_MID, 1);
    g.fillRect(Math.round(W * 0.12), ry, Math.round(W * 0.76), 6);

    // Arbres feuillus espacés le long de la rive
    const numTrees = 18;
    for (let i = 0; i < numTrees; i++) {
      const tx = Math.round(W * 0.13 + (i / numTrees) * W * 0.74 + rng() * 16 - 8);
      const th = 28 + Math.round(rng() * 20);
      const tw = 22 + Math.round(rng() * 16);
      this.drawLeafyTree(g, tx, ry, tw, th);
    }
  }

  private drawLeafyTree(
    g: Phaser.GameObjects.Graphics,
    x: number, baseY: number,
    canopyW: number, h: number,
  ): void {
    // Tronc
    g.fillStyle(TRUNK, 1);
    const trunkH = Math.round(h * 0.30);
    g.fillRect(x - 3, baseY - trunkH, 6, trunkH);

    // Canopée en forme ovale (colonnes de hauteur variable)
    const canopyBase = baseY - trunkH;
    const canopyCY   = canopyBase - Math.round(h * 0.35);
    const colW       = 6;
    const cols       = Math.ceil(canopyW / colW);
    for (let c = 0; c < cols; c++) {
      const tCol    = c / (cols - 1);
      const profile = Math.sin(tCol * Math.PI);
      const colH    = Math.round(profile * h * 0.70);
      const cx      = x - Math.round(canopyW / 2) + c * colW;
      const topY    = canopyCY - Math.round(colH * 0.55);
      const botY    = canopyCY + Math.round(colH * 0.45);
      // Couche principale
      g.fillStyle(FOLIAGE_MID, 1);
      g.fillRect(cx, topY, colW, botY - topY);
      // Reflet lumière (haut tiers)
      g.fillStyle(FOLIAGE_LIT, 1);
      g.fillRect(cx, topY, colW, Math.max(3, Math.round((botY - topY) * 0.30)));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawTerrain — falaise herbeuse avant-plan
  // ─────────────────────────────────────────────────────────────────────────────
  private drawTerrain(W: number, H: number): void {
    const g      = this.add.graphics().setDepth(35).setScrollFactor(0);
    const cliffY = Math.round(H * 0.66);
    const rng    = this.makeLcg(7);

    // Masse principale falaise
    g.fillStyle(CLIFF_LIT, 1);
    g.fillRect(0, cliffY, W, H - cliffY);

    // Bord irrégulier de la falaise (LCG seed=7)
    for (let bx = 0; bx < W; bx += 8) {
      const bump = 4 + Math.round(rng() * 12);
      g.fillStyle(CLIFF_LIT, 1);
      g.fillRect(bx, cliffY - bump, 8, bump + 2);
      g.fillStyle(CLIFF_STONE, 1);
      g.fillRect(bx, cliffY - bump, 8, 2);
    }

    // Écume claire à la jonction rive/lac — uniquement sous la largeur du
    // lac (this.waterX0..waterX1, posée par drawWater), pour lier visuellement
    // la falaise avant-plan et le lac au lieu d'un simple aplat qui les recouvre.
    if (this.waterX1 > this.waterX0) {
      const foamW = this.waterX1 - this.waterX0;
      g.fillStyle(WATER_FOAM, 0.5);
      g.fillRect(this.waterX0, cliffY - 3, foamW, 2);
      g.fillStyle(WATER_FOAM, 0.22);
      g.fillRect(this.waterX0, cliffY - 1, foamW, 1);
    }

    // Quelques rochers épars sur la falaise (moins nombreux qu'avant pour
    // laisser respirer l'herbe/fleurs plutôt que d'encombrer le premier plan)
    const rngR = this.makeLcg(43);
    for (let i = 0; i < 4; i++) {
      const rx = Math.round(rngR() * W);
      const ry = cliffY + Math.round(rngR() * (H - cliffY - 10));
      const rw = 12 + Math.round(rngR() * 14);
      const rh = 8 + Math.round(rngR() * 8);
      g.fillStyle(ROCK_COL, 1);
      g.fillEllipse(rx, ry, rw, rh);
      g.fillStyle(0xa8a898, 1);
      g.fillEllipse(rx - 3, ry - 2, Math.round(rw * 0.55), Math.round(rh * 0.55));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawBridge — pont de pierre en arc sur le lac
  // ─────────────────────────────────────────────────────────────────────────────
  private drawBridge(W: number, H: number): void {
    const g = this.add.graphics().setDepth(40).setScrollFactor(0);

    // Position du pont : flanc gauche du lac, délibérément HORS de la
    // colonne centrale (x≈190-610) occupée par le titre/boutons/cartes de
    // sauvegarde (panneaux quasi-opaques, depth 90+) — dans la version
    // précédente le pont était centré (0.32W ≈ x256, en plein dans cette
    // colonne) et se retrouvait presque entièrement masqué derrière elles.
    const bridgeCX = Math.round(W * 0.15);
    const bridgeY  = Math.round(H * 0.56);
    const archW    = 90;
    const archH    = 28;
    const deckH    = 8;

    // Piliers gauche et droit
    g.fillStyle(BRIDGE_SHADE, 1);
    g.fillRect(bridgeCX - Math.round(archW / 2) - 6, bridgeY - archH, 12, archH + 10);
    g.fillRect(bridgeCX + Math.round(archW / 2) - 6, bridgeY - archH, 12, archH + 10);

    // Arche : approximée par une série de fillRect horizontaux décroissants
    const archSteps = 10;
    for (let s = 0; s < archSteps; s++) {
      const tArch = s / (archSteps - 1);
      const archW2 = Math.round(archW * (1 - Math.pow((tArch - 0.5) * 2, 2) * 0.55));
      const archX  = bridgeCX - Math.round(archW2 / 2);
      const archYy = bridgeY - Math.round(Math.sin(tArch * Math.PI) * archH * 0.7);
      g.fillStyle(BRIDGE_SHADE, 1);
      g.fillRect(archX, archYy, archW2, 4);
    }

    // Tablier du pont
    g.fillStyle(BRIDGE_LIT, 1);
    g.fillRect(bridgeCX - Math.round(archW / 2) - 4, bridgeY - deckH - archH + 4, archW + 8, deckH);

    // Parapet (muret de garde)
    g.fillStyle(BRIDGE_SHADE, 1);
    g.fillRect(bridgeCX - Math.round(archW / 2) - 4, bridgeY - deckH - archH - 2, archW + 8, 4);

    // Légère ombre sous le pont sur l'eau
    g.fillStyle(0x1a6060, 0.4);
    g.fillRect(bridgeCX - Math.round(archW / 2), bridgeY - archH + 12, archW, 6);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawForeground — herbe haute, fleurs
  // ─────────────────────────────────────────────────────────────────────────────
  private drawForeground(W: number, H: number): void {
    const cliffY = Math.round(H * 0.66);

    // Herbe sur la falaise (partie supérieure)
    const grassG = this.add.graphics().setDepth(50).setScrollFactor(0);
    const rngG   = this.makeLcg(17);
    for (let gx = 0; gx < W; gx += 2) {
      const gh  = 6 + Math.round(rngG() * 8);
      const cp  = rngG();
      const col = cp < 0.33 ? GRASS_BRIGHT : cp < 0.66 ? GRASS_MID : GRASS_DARK;
      grassG.fillStyle(col, 1);
      grassG.fillRect(gx, cliffY - gh, 2, gh);
    }

    // Bande herbe basse (avant-plan)
    const grassBotY = Math.round(H * 0.90);
    const rngG2     = this.makeLcg(23);
    for (let gx = 0; gx < W; gx += 2) {
      const gh  = 8 + Math.round(rngG2() * 10);
      const cp  = rngG2();
      const col = cp < 0.35 ? GRASS_BRIGHT : cp < 0.68 ? GRASS_MID : GRASS_DARK;
      grassG.fillStyle(col, 1);
      grassG.fillRect(gx, grassBotY - gh, 2, gh);
    }
    // Remplissage bas
    grassG.fillStyle(GRASS_DARK, 1);
    grassG.fillRect(0, grassBotY, W, H - grassBotY);

    // Fleurs (LCG seed=31) — sur la falaise
    const flowerG    = this.add.graphics().setDepth(52).setScrollFactor(0);
    const rngF       = this.makeLcg(31);
    const flowerCols = [FLOWER_PINK, FLOWER_WHITE, FLOWER_YELLOW];
    for (let i = 0; i < 40; i++) {
      const fx = Math.round(rngF() * W);
      const fy = cliffY - Math.round(rngF() * 14) - 2;
      flowerG.fillStyle(flowerCols[Math.floor(rngF() * 3)], 1);
      flowerG.fillRect(fx, fy, 2, 2);
    }
    // Fleurs avant-plan bas
    for (let i = 0; i < 20; i++) {
      const fx = Math.round(rngF() * W);
      const fy = grassBotY - Math.round(rngF() * 8) - 2;
      flowerG.fillStyle(flowerCols[Math.floor(rngF() * 3)], 1);
      flowerG.fillRect(fx, fy, 2, 2);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawHero — silhouette + breathing tween
  // ─────────────────────────────────────────────────────────────────────────────
  private drawHero(W: number, H: number): void {
    const cliffY    = Math.round(H * 0.66);
    this.heroBaseY  = cliffY - 14;

    // Flanc droit, délibérément HORS de la colonne centrale (x≈190-610)
    // occupée par le titre/boutons/cartes de sauvegarde — dans la version
    // précédente le héros était centré (0.55W ≈ x440) et se retrouvait
    // presque entièrement masqué derrière la 2e carte de sauvegarde
    // (panneau quasi-opaque, depth 90 > depth 60 du héros). Ici il se
    // détache pleinement sur le ciel/lac, silhouette au bord de la falaise.
    const heroX = Math.round(W * 0.855);

    // Ombre de contact au sol — ancre visuellement le héros sur la falaise
    const shadow = this.add.graphics().setDepth(59).setScrollFactor(0);
    shadow.fillStyle(0x000000, 0.28);
    shadow.fillEllipse(heroX, this.heroBaseY + 1, 20, 6);

    this.hero = this.add.graphics().setDepth(60).setScrollFactor(0);
    this.hero.setPosition(heroX, this.heroBaseY);
    this.hero.fillStyle(HERO_COL, 1);

    // Jambes légèrement écartées, posture debout regardant l'horizon
    this.hero.fillRect(-5, -14,  4, 12); // jambe gauche
    this.hero.fillRect(  1, -14,  4, 12); // jambe droite
    this.hero.fillRect(-6, -28, 12, 15); // torse
    this.hero.fillRect(-4, -36,  8,  8); // tête
    // Cape courte derrière
    this.hero.fillRect(-9, -30, 4, 12);  // pan de cape gauche
    this.hero.fillRect( 5, -30, 4, 10);  // pan de cape droit
    // Arme sur l'épaule (lance / bâton)
    this.hero.fillRect( 7, -50, 2, 32);

    this.tweens.add({
      targets: this.hero,
      y: this.heroBaseY - 1.5,
      duration: 3000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Transition sortante
  // ─────────────────────────────────────────────────────────────────────────────
  private transitionTo(key: string, data?: object) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => this.scene.start(key, data),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // makeBtn
  // ─────────────────────────────────────────────────────────────────────────────
  private makeBtn(
    x: number, y: number,
    label: string,
    accent: number,
    entryDelay: number,
    action: () => void,
  ) {
    const BW = 240;
    const BH = 44;   // hauteur tactile standard (≥ 44 px)
    const bg = this.add.graphics().setScrollFactor(0);

    const draw = (hover: boolean) => {
      bg.clear();
      drawGlowPanel(bg, -BW / 2, -BH / 2, BW, BH, accent,
        hover ? UI.BTN_BG_HOVER : UI.BTN_BG, 4);
      if (hover) {
        bg.lineStyle(1, accent, 0.85);
        bg.strokeRoundedRect(-BW / 2 + 2, -BH / 2 + 2, BW - 4, BH - 4, 2);
      }
    };
    draw(false);

    const txt = this.add.text(0, 0, label, uiStyle(13, UI.TXT_PARCHMENT, { bold: true }))
      .setOrigin(0.5).setScrollFactor(0);
    const box = this.add.container(x, y + 8, [bg, txt])
      .setAlpha(0).setDepth(90).setScrollFactor(0);

    this.time.delayedCall(entryDelay, () => {
      this.tweens.add({ targets: box, alpha: 1, y, duration: 350, ease: 'Quad.easeOut' });
    });

    const hit = this.add.rectangle(x, y, BW, BH + 10, 0, 0)
      .setInteractive({ useHandCursor: true }).setDepth(92).setScrollFactor(0);
    hit.on('pointerover',  () => {
      draw(true); txt.setStyle({ color: UI.TXT_GOLD });
      this.tweens.add({ targets: box, scaleX: 1.03, scaleY: 1.03, duration: 100, ease: 'Quad.easeOut' });
    });
    hit.on('pointerout',   () => {
      draw(false); txt.setStyle({ color: UI.TXT_PARCHMENT });
      this.tweens.add({ targets: box, scaleX: 1, scaleY: 1, duration: 100, ease: 'Quad.easeOut' });
    });
    hit.on('pointerdown',  () => {
      this.tweens.add({ targets: box, scaleX: 0.96, scaleY: 0.96, duration: 50, yoyo: true });
      action();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // showNewGameMenu
  // ─────────────────────────────────────────────────────────────────────────────
  private showNewGameMenu(slots: ReturnType<typeof SaveSystem.listSlots>) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const elems: Phaser.GameObjects.GameObject[] = [];

    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(95);
    elems.push(ov);
    const frame = this.add.graphics().setDepth(96);
    drawGlowPanel(frame, W / 2 - 240, H / 2 - 150, 480, 300, UI.ACCENT_VIOLET, UI.BG_DEEP, 6);
    elems.push(frame);
    elems.push(
      this.add.text(W / 2, H / 2 - 130, t('menu.select_slot'), uiStyle(14, UI.TXT_GOLD, { bold: true, stroke: true }))
        .setOrigin(0.5).setDepth(97),
    );

    for (let i = 0; i < 3; i++) {
      const s    = slots[i];
      const by   = H / 2 - 60 + i * 62;
      const card = this.add.graphics().setDepth(96);
      drawGlowPanel(card, W / 2 - 200, by, 400, 48, UI.SEPARATOR, UI.BG_MID, 4);
      elems.push(card);

      const label = s
        ? `${t('menu.slot')} ${i + 1}  [${t('menu.slot.overwrite')}]  ${s.playerName} Lv.${s.level}`
        : `${t('menu.slot')} ${i + 1}  —  ${t('menu.new_game')}`;
      const col = s ? UI.TXT_RED : UI.TXT_GREEN;
      const btn = this.add.text(W / 2, by + 24, label, uiStyle(11, col, { bold: true }))
        .setOrigin(0.5).setDepth(97);
      // Hit zone = toute la carte (400×48 ≥ 44 px), pas seulement le texte
      const hit = this.add.rectangle(W / 2, by + 24, 400, 48, 0, 0)
        .setDepth(98).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => btn.setStyle({ color: UI.TXT_WHITE }));
      hit.on('pointerout',  () => btn.setStyle({ color: col }));
      hit.on('pointerdown', () => { elems.forEach(e => e.destroy()); this.transitionTo('NameInputScene', { slot: i }); });
      elems.push(btn, hit);
    }

    const cancel = this.add.text(W / 2, H / 2 + 120, t('menu.cancel'), uiStyle(12, UI.TXT_MUTED))
      .setOrigin(0.5).setDepth(97);
    const cancelHit = this.add.rectangle(W / 2, H / 2 + 120, 200, 44, 0, 0)
      .setDepth(98).setInteractive({ useHandCursor: true });
    cancelHit.on('pointerover', () => cancel.setStyle({ color: UI.TXT_RED }));
    cancelHit.on('pointerout',  () => cancel.setStyle({ color: UI.TXT_MUTED }));
    cancelHit.on('pointerdown', () => elems.forEach(e => e.destroy()));
    elems.push(cancel, cancelHit);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // showLoadMenu
  // ─────────────────────────────────────────────────────────────────────────────
  private showLoadMenu(slots: ReturnType<typeof SaveSystem.listSlots>) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const elems: Phaser.GameObjects.GameObject[] = [];

    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(95);
    elems.push(ov);
    const frame = this.add.graphics().setDepth(96);
    drawGlowPanel(frame, W / 2 - 240, H / 2 - 150, 480, 300, UI.GLOW_GOLD, UI.BG_DEEP, 6);
    elems.push(frame);
    elems.push(
      this.add.text(W / 2, H / 2 - 130, t('menu.load_title'), uiStyle(14, UI.TXT_GOLD, { bold: true, stroke: true }))
        .setOrigin(0.5).setDepth(97),
    );

    let found = 0;
    for (let i = 0; i < 3; i++) {
      const s = slots[i];
      if (!s) continue;
      const by   = H / 2 - 60 + found * 62;
      const card = this.add.graphics().setDepth(96);
      drawGlowPanel(card, W / 2 - 200, by, 400, 48, UI.SEPARATOR, UI.BG_MID, 4);
      elems.push(card);
      const label = `${t('menu.slot')} ${i + 1}  ${s.playerName}  Lv.${s.level}  |  ${s.clearedZones}/6 zones`;
      const btn   = this.add.text(W / 2, by + 24, label, uiStyle(11, UI.TXT_GREEN, { bold: true }))
        .setOrigin(0.5).setDepth(97);
      // Hit zone = toute la carte (400×48 ≥ 44 px), pas seulement le texte
      const hit = this.add.rectangle(W / 2, by + 24, 400, 48, 0, 0)
        .setDepth(98).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => btn.setStyle({ color: UI.TXT_WHITE }));
      hit.on('pointerout',  () => btn.setStyle({ color: UI.TXT_GREEN }));
      hit.on('pointerdown', () => {
        const state = SaveSystem.load(i);
        if (state) {
          state.saveSlot = i;
          elems.forEach(e => e.destroy());
          this.transitionTo('GameScene', { gameState: state });
        }
      });
      elems.push(btn, hit);
      found++;
    }

    const cancel = this.add.text(W / 2, H / 2 + 120, t('menu.cancel'), uiStyle(12, UI.TXT_MUTED))
      .setOrigin(0.5).setDepth(97);
    const cancelHit = this.add.rectangle(W / 2, H / 2 + 120, 200, 44, 0, 0)
      .setDepth(98).setInteractive({ useHandCursor: true });
    cancelHit.on('pointerover', () => cancel.setStyle({ color: UI.TXT_RED }));
    cancelHit.on('pointerout',  () => cancel.setStyle({ color: UI.TXT_MUTED }));
    cancelHit.on('pointerdown', () => elems.forEach(e => e.destroy()));
    elems.push(cancel, cancelHit);
  }
}
