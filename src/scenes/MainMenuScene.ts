import { SaveSystem } from '../systems/SaveSystem';
import { UI, drawGlowPanel, pxStyle } from '../utils/UITheme';
import { t } from '../i18n';

const GAME_VERSION = 'v0.7.0';

// ── Diorama crépusculaire — palette ──────────────────────────────────────────
// Ciel gauche (coucher de soleil)
const SKY_LEFT_TOP    = 0xc45c28;
const SKY_LEFT_MID    = 0xe87a35;
const SKY_LEFT_HORIZ  = 0xf5a050;
// Ciel droit (nuit)
const SKY_RIGHT_TOP   = 0x0d1333;
const SKY_RIGHT_MID   = 0x1a2555;
const SKY_RIGHT_HORIZ = 0x2a3870;
// Soleil / Lune
const SUN_HALO  = 0xffe080;
const SUN_CORE  = 0xffffd0;
const MOON_COL  = 0xe8eeff;
// Montagnes
const MTNL1 = 0x3a4580;
const MTNL2 = 0x2a3570;
const MTNL3 = 0x1f4060;
const MTNL4 = 0x1a3040;
const SNOW  = 0xd0d8e0;
// Végétation
const GRASS_BRIGHT  = 0x4a9020;
const GRASS_MID     = 0x65b030;
const GRASS_DARK    = 0x2d6010;
const PINE_DARK     = 0x1a4028;
const PINE_TRUNK    = 0x3a2010;
// Roche
const ROCK_LIGHT    = 0x708090;
const ROCK_SHADOW   = 0x506070;
const ROCK_EDGE     = 0x3a4a5a;
// Fleurs
const FLOWER_PINK   = 0xff80a0;
const FLOWER_WHITE  = 0xfff0d0;
const FLOWER_YELLOW = 0xffff80;
// Héros
const HERO_COL = 0x1a1020;

export class MainMenuScene extends Phaser.Scene {
  // TileSprites nuages (scrollés dans update)
  private cloudsFar!:  Phaser.GameObjects.TileSprite;
  private cloudsNear!: Phaser.GameObjects.TileSprite;

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
    this.drawSky(W, H);              // depth 0–2
    this.drawClouds(W, H);           // depth 5 & 8
    this.drawMountainLayer(1, W, H); // depth 15
    this.drawMountainLayer(2, W, H); // depth 20
    this.drawMountainLayer(3, W, H); // depth 25
    this.drawMountainLayer(4, W, H); // depth 30
    this.drawForeground(W, H);       // depth 40–60
    this.drawHero(W, H);             // depth 70

    // Voile de lisibilité
    this.add.rectangle(W / 2, H / 2, W, H, 0x060810, 0.22)
      .setDepth(80).setScrollFactor(0);

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

    // ── Titre ── halo doré derrière le texte (dégradé radial pixel art)
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

    this.add.text(W / 2, 64, t('menu.subtitle'), pxStyle(8, UI.TXT_MUTED))
      .setOrigin(0.5).setDepth(91).setScrollFactor(0);
    this.add.text(W / 2, 82, '« Chaque victoire est une perte. »', pxStyle(7, UI.TXT_HINT))
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
    this.add.text(W / 2, 276, t('menu.save_slots'), pxStyle(7, UI.TXT_HINT))
      .setOrigin(0.5).setDepth(91).setScrollFactor(0);

    for (let i = 0; i < 3; i++) {
      const s    = slots[i];
      const cy   = 298 + i * 56;
      const card = this.add.graphics().setAlpha(0).setDepth(90).setScrollFactor(0);
      drawGlowPanel(card, W / 2 - 200, cy, 400, 44, UI.SEPARATOR, UI.BG_MID, 4);

      const cardTexts: Phaser.GameObjects.Text[] = [];
      if (s) {
        cardTexts.push(
          this.add.text(W / 2 - 188, cy + 8,
            `${t('menu.slot')} ${i + 1}`, pxStyle(7, UI.TXT_GOLD)).setDepth(91).setScrollFactor(0),
          this.add.text(W / 2 - 188, cy + 24,
            `${s.playerName}  Lv.${s.level}`, pxStyle(7, UI.TXT_PARCHMENT)).setDepth(91).setScrollFactor(0),
          this.add.text(W / 2 + 190, cy + 8,
            `${s.clearedZones}/6 zones`, pxStyle(7, UI.TXT_MUTED)).setOrigin(1, 0).setDepth(91).setScrollFactor(0),
          this.add.text(W / 2 + 190, cy + 24,
            SaveSystem.formatPlaytime(s.playtime), pxStyle(7, UI.TXT_MUTED)).setOrigin(1, 0).setDepth(91).setScrollFactor(0),
        );
      } else {
        cardTexts.push(
          this.add.text(W / 2, cy + 22,
            `${t('menu.slot')} ${i + 1}  —  ${t('menu.slot.empty')}`, pxStyle(7, UI.TXT_HINT))
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
    this.add.text(W / 2, H - 14, t('menu.controls'), pxStyle(6, UI.TXT_HINT))
      .setOrigin(0.5, 1).setDepth(91).setScrollFactor(0);
    this.add.text(W - 14, H - 14, GAME_VERSION, pxStyle(6, UI.TXT_HINT))
      .setOrigin(1, 1).setDepth(91).setScrollFactor(0);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // update : drift des nuages
  // ─────────────────────────────────────────────────────────────────────────────
  update(_time: number, delta: number) {
    const dt = delta / 16;
    if (this.cloudsFar)  this.cloudsFar.tilePositionX  += 0.04 * dt;
    if (this.cloudsNear) this.cloudsNear.tilePositionX += 0.02 * dt;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LCG déterministe (stable entre frames, pas de Math.random)
  // ─────────────────────────────────────────────────────────────────────────────
  private makeLcg(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 0x100000000;
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawSky — gradient split gauche/droite avec dithering central
  // ─────────────────────────────────────────────────────────────────────────────
  private drawSky(W: number, H: number) {
    const g = this.add.graphics().setDepth(0).setScrollFactor(0);
    const BANDS = 24;
    const bandH = Math.ceil(H / BANDS);

    for (let i = 0; i < BANDS; i++) {
      const tBand = i / (BANDS - 1);

      const lTop = Phaser.Display.Color.ValueToColor(SKY_LEFT_TOP);
      const lMid = Phaser.Display.Color.ValueToColor(SKY_LEFT_MID);
      const lBot = Phaser.Display.Color.ValueToColor(SKY_LEFT_HORIZ);
      const leftC = tBand < 0.5
        ? Phaser.Display.Color.Interpolate.ColorWithColor(lTop, lMid, 1, tBand * 2)
        : Phaser.Display.Color.Interpolate.ColorWithColor(lMid, lBot, 1, (tBand - 0.5) * 2);

      const rTop = Phaser.Display.Color.ValueToColor(SKY_RIGHT_TOP);
      const rMid = Phaser.Display.Color.ValueToColor(SKY_RIGHT_MID);
      const rBot = Phaser.Display.Color.ValueToColor(SKY_RIGHT_HORIZ);
      const rightC = tBand < 0.5
        ? Phaser.Display.Color.Interpolate.ColorWithColor(rTop, rMid, 1, tBand * 2)
        : Phaser.Display.Color.Interpolate.ColorWithColor(rMid, rBot, 1, (tBand - 0.5) * 2);

      const ly       = i * bandH;
      const splitX   = W / 2;
      const ditherW  = 100;
      const leftEnd  = Math.round(splitX - ditherW / 2);
      const rightSt  = Math.round(splitX + ditherW / 2);

      g.fillStyle(Phaser.Display.Color.GetColor(leftC.r, leftC.g, leftC.b), 1);
      g.fillRect(0, ly, leftEnd, bandH);
      g.fillStyle(Phaser.Display.Color.GetColor(rightC.r, rightC.g, rightC.b), 1);
      g.fillRect(rightSt, ly, W - rightSt, bandH);

      // Dithering en bandes de 2px
      for (let dx = leftEnd; dx < rightSt; dx += 2) {
        const mixT     = (dx - leftEnd) / (rightSt - leftEnd);
        const useRight = (Math.floor(dx / 2) % 2 === 0) ? mixT > 0.5 : mixT > 0.3;
        const c = useRight ? rightC : leftC;
        g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
        g.fillRect(dx, ly, 2, bandH);
      }
    }

    // ── Soleil bas-gauche ──
    const sunX = Math.round(W * 0.22);
    const sunY = Math.round(H * 0.68);
    g.fillStyle(SUN_HALO, 0.15); g.fillCircle(sunX, sunY, 80);
    g.fillStyle(SUN_HALO, 0.25); g.fillCircle(sunX, sunY, 55);
    g.fillStyle(SUN_HALO, 0.40); g.fillCircle(sunX, sunY, 38);
    g.fillStyle(SUN_HALO, 0.70); g.fillCircle(sunX, sunY, 22);
    g.fillStyle(SUN_CORE, 1);    g.fillCircle(sunX, sunY, 12);

    // ── Lune croissant haut-droite ──
    const moonX = Math.round(W * 0.82);
    const moonY = Math.round(H * 0.13);
    g.fillStyle(MOON_COL, 1);       g.fillCircle(moonX, moonY, 22);
    g.fillStyle(SKY_RIGHT_TOP, 1);  g.fillCircle(moonX + 8, moonY - 2, 18);

    // ── Étoiles (moitié droite, LCG seed=42) ──
    const rng42 = this.makeLcg(42);
    const starG = this.add.graphics().setDepth(1).setScrollFactor(0);
    for (let i = 0; i < 32; i++) {
      const sx  = Math.round(W / 2 + 20 + rng42() * (W / 2 - 30));
      const sy  = Math.round(rng42() * H * 0.50);
      const sz  = rng42() < 0.75 ? 1 : 2;
      const col = rng42() < 0.5 ? 0xffffff : 0xffd0a0;
      starG.fillStyle(col, 0.3 + rng42() * 0.5);
      starG.fillRect(sx, sy, sz, sz);
    }

    // Étoiles scintillantes (tweens yoyo)
    const twinkles: Array<[number, number]> = [
      [0.58, 0.08], [0.65, 0.22], [0.73, 0.06], [0.79, 0.30],
      [0.85, 0.12], [0.91, 0.25], [0.96, 0.09], [0.70, 0.40],
    ];
    twinkles.forEach(([fx, fy], idx) => {
      const star = this.add.rectangle(
        Math.round(W * fx), Math.round(H * fy), 2, 2,
        idx % 2 === 0 ? 0xffffff : 0xffd0a0, 1,
      ).setAlpha(0.15).setDepth(2).setScrollFactor(0);
      this.tweens.add({
        targets: star, alpha: 0.85,
        duration: 1600 + idx * 300, delay: idx * 220,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawClouds — 2 couches TileSprite
  // ─────────────────────────────────────────────────────────────────────────────
  private drawClouds(W: number, H: number) {
    // Couche lointaine
    const gFar     = this.add.graphics();
    const farTexW  = W * 2;
    const farTexH  = 80;
    const farPos   = [0.05, 0.18, 0.30, 0.45, 0.57, 0.68, 0.80, 0.92];
    farPos.forEach((fx, idx) => {
      const cx = Math.round(fx * farTexW);
      const cy = Math.round(farTexH * 0.5 + (idx % 3) * 10);
      this.drawCloudShape(gFar, cx, cy, 50, 10, 0x8090b0, 0.6);
    });
    gFar.generateTexture('clouds_far', farTexW, farTexH);
    gFar.destroy();
    this.cloudsFar = this.add
      .tileSprite(0, Math.round(H * 0.25), farTexW, farTexH, 'clouds_far')
      .setOrigin(0, 0.5).setDepth(5).setScrollFactor(0);

    // Couche proche
    const gNear     = this.add.graphics();
    const nearTexW  = W * 2;
    const nearTexH  = 90;
    const nearPos: Array<[number, number, number, string]> = [
      [0.06, 0.5, 100, 'warm'], [0.20, 0.4,  85, 'warm'],
      [0.38, 0.6,  95, 'cool'], [0.52, 0.45, 80, 'cool'],
      [0.70, 0.55, 90, 'cool'], [0.86, 0.4, 110, 'warm'],
    ];
    nearPos.forEach(([fx, fy, cw, side]) => {
      const col = side === 'warm' ? 0xfff0d0 : 0xa0b0c0;
      this.drawCloudShape(gNear, Math.round(fx * nearTexW), Math.round(fy * nearTexH), cw, 20, col, 0.75);
    });
    gNear.generateTexture('clouds_near', nearTexW, nearTexH);
    gNear.destroy();
    this.cloudsNear = this.add
      .tileSprite(0, Math.round(H * 0.30), nearTexW, nearTexH, 'clouds_near')
      .setOrigin(0, 0.5).setDepth(8).setScrollFactor(0);
  }

  private drawCloudShape(
    g: Phaser.GameObjects.Graphics,
    cx: number, cy: number, width: number, height: number,
    color: number, alpha: number,
  ) {
    g.fillStyle(color, alpha);
    [
      { w: Math.round(width * 0.4), h: 4, oy: -height },
      { w: Math.round(width * 0.7), h: 6, oy: -height + 4 },
      { w: width,                   h: 8, oy: -height + 10 },
      { w: Math.round(width * 0.9), h: 6, oy: -height + 18 },
      { w: Math.round(width * 0.6), h: 4, oy: -height + 24 },
    ].forEach(({ w, h, oy }) => g.fillRect(cx - Math.round(w / 2), cy + oy, w, h));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawMountainLayer — texture générée puis Image fixe
  // ─────────────────────────────────────────────────────────────────────────────
  private drawMountainLayer(layer: number, W: number, H: number) {
    const key = `mountain_layer_${layer}`;
    const g   = this.add.graphics();

    type LayerCfg = { color: number; baseYR: number; minH: number; maxH: number; snow: boolean; pines: boolean; depth: number };
    const cfgs: Record<number, LayerCfg> = {
      1: { color: MTNL1, baseYR: 0.62, minH: 80,  maxH: 120, snow: true,  pines: false, depth: 15 },
      2: { color: MTNL2, baseYR: 0.70, minH: 130, maxH: 180, snow: true,  pines: false, depth: 20 },
      3: { color: MTNL3, baseYR: 0.78, minH: 180, maxH: 250, snow: false, pines: true,  depth: 25 },
      4: { color: MTNL4, baseYR: 0.85, minH: 250, maxH: 350, snow: false, pines: true,  depth: 30 },
    };
    const cfg   = cfgs[layer];
    const baseY = Math.round(H * cfg.baseYR);
    const rng   = this.makeLcg(layer * 137 + 99);

    // Fond plein sous la ligne de base
    g.fillStyle(cfg.color, 1);
    g.fillRect(0, baseY, W, H - baseY);

    const numPeaks = Math.round(W / (40 + layer * 8));
    const peaks: Array<{ px: number; ph: number }> = [];
    for (let i = 0; i <= numPeaks; i++) {
      peaks.push({
        px: Math.round((i / numPeaks) * W),
        ph: Math.round(cfg.minH + rng() * (cfg.maxH - cfg.minH)),
      });
    }

    peaks.forEach(({ px, ph }, idx) => {
      if (idx === 0) return;
      const prevPx   = peaks[idx - 1].px;
      const peakX    = Math.round((prevPx + px) / 2);
      const peakTopY = baseY - ph;
      const steps    = Math.max(1, Math.round(ph / 4));

      g.fillStyle(cfg.color, 1);
      for (let s = 0; s < steps; s++) {
        const stepT = s / steps;
        const stepW = Math.max(2, Math.round(((px - prevPx) * stepT) * 0.9));
        g.fillRect(peakX - Math.round(stepW / 2), peakTopY + Math.round(stepT * ph), stepW, 4);
      }

      if (cfg.snow) {
        g.fillStyle(SNOW, 1);
        const snowH = Math.max(2, Math.round(ph * 0.12));
        for (let s = 0; s < Math.round(snowH / 2); s++) {
          const sw = Math.max(2, (snowH - s) * 2);
          g.fillRect(peakX - Math.round(sw / 2), peakTopY + s * 2, sw, 2);
        }
        g.fillStyle(cfg.color, 1);
      }

      if (cfg.pines) {
        const numPines = 2 + Math.round(rng() * 3);
        for (let p = 0; p < numPines; p++) {
          const px2      = prevPx + Math.round(rng() * (px - prevPx));
          const pineBase = baseY - Math.round(rng() * ph * 0.4 + ph * 0.05);
          this.drawPine(g, px2, pineBase, layer === 4 ? 18 : 12);
        }
      }
    });

    g.generateTexture(key, W, H);
    g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(cfg.depth).setScrollFactor(0);
  }

  private drawPine(g: Phaser.GameObjects.Graphics, x: number, baseY: number, h: number) {
    const tw   = Math.round(h * 0.6);
    const rows = Math.max(1, Math.round(h * 0.75 / 3));
    g.fillStyle(PINE_DARK, 1);
    for (let r = 0; r < rows; r++) {
      const rw = Math.max(2, Math.round((tw * (r + 1)) / rows));
      g.fillRect(x - Math.round(rw / 2), baseY - h + r * 3, rw, 3);
    }
    g.fillStyle(PINE_TRUNK, 1);
    g.fillRect(x - 2, baseY - 8, 4, 8);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawForeground — falaise, herbe, fleurs, rochers
  // ─────────────────────────────────────────────────────────────────────────────
  private drawForeground(W: number, H: number) {
    const cliffBaseW = 160;
    const cliffBaseH = 120;
    const cliffX     = Math.round(W / 2 - cliffBaseW / 2);
    const cliffY     = H - cliffBaseH;

    // Falaise
    const cliffG = this.add.graphics().setDepth(40).setScrollFactor(0);
    cliffG.fillStyle(ROCK_LIGHT, 1);
    cliffG.fillRect(cliffX, cliffY, cliffBaseW, cliffBaseH);
    cliffG.fillStyle(ROCK_SHADOW, 1);
    cliffG.fillRect(cliffX + Math.round(cliffBaseW * 0.6), cliffY + 10,
      Math.round(cliffBaseW * 0.4), cliffBaseH - 10);
    cliffG.fillStyle(ROCK_EDGE, 1);
    cliffG.fillRect(cliffX + cliffBaseW - 6, cliffY, 6, cliffBaseH);
    cliffG.fillRect(cliffX, cliffY, 4, cliffBaseH);

    // Bord irrégulier
    const rngC = this.makeLcg(7);
    for (let bx = cliffX; bx < cliffX + cliffBaseW; bx += 8) {
      const bump = Math.round(rngC() * 16);
      cliffG.fillStyle(ROCK_LIGHT, 1);
      cliffG.fillRect(bx, cliffY - bump, 8, bump + 2);
      cliffG.fillStyle(ROCK_EDGE, 1);
      cliffG.fillRect(bx, cliffY - bump, 8, 2);
    }

    // Herbe bande du bas
    const grassG = this.add.graphics().setDepth(50).setScrollFactor(0);
    const grassY = H - 30;
    const rngG   = this.makeLcg(17);
    for (let gx = 0; gx < W; gx += 2) {
      const h2  = 4 + Math.round(rngG() * 4);
      const cp  = rngG();
      const col = cp < 0.33 ? GRASS_BRIGHT : cp < 0.66 ? GRASS_MID : GRASS_DARK;
      grassG.fillStyle(col, 1);
      grassG.fillRect(gx, grassY, 2, h2);
    }
    grassG.fillStyle(GRASS_DARK, 1);
    grassG.fillRect(0, grassY + 8, W, H - grassY - 8);
    // Herbe sur la falaise
    for (let gx = cliffX; gx < cliffX + cliffBaseW; gx += 2) {
      const h2  = 3 + Math.round(rngG() * 3);
      const col = rngG() < 0.5 ? GRASS_BRIGHT : GRASS_MID;
      grassG.fillStyle(col, 1);
      grassG.fillRect(gx, cliffY - h2, 2, h2);
    }

    // Fleurs (seed=31)
    const flowerG    = this.add.graphics().setDepth(55).setScrollFactor(0);
    const rngF       = this.makeLcg(31);
    const flowerCols = [FLOWER_PINK, FLOWER_WHITE, FLOWER_YELLOW];
    for (let i = 0; i < 28; i++) {
      const fx = Math.round(rngF() * W);
      const fy = grassY - Math.round(rngF() * 6);
      flowerG.fillStyle(flowerCols[Math.floor(rngF() * 3)], 1);
      flowerG.fillRect(fx, fy, 2, 2);
    }
    for (let i = 0; i < 12; i++) {
      const fx = cliffX + Math.round(rngF() * cliffBaseW);
      const fy = cliffY - Math.round(rngF() * 10) - 4;
      flowerG.fillStyle(flowerCols[Math.floor(rngF() * 3)], 1);
      flowerG.fillRect(fx, fy, 2, 2);
    }

    // Petits rochers avant-plan
    const rockFG = this.add.graphics().setDepth(60).setScrollFactor(0);
    ([
      [30,      H - 28, 22, 14],
      [62,      H - 22, 16, 10],
      [W - 48,  H - 26, 20, 12],
      [W - 80,  H - 20, 14,  9],
    ] as Array<[number, number, number, number]>).forEach(([rx, ry, rw, rh]) => {
      rockFG.fillStyle(ROCK_SHADOW, 1);
      rockFG.fillEllipse(rx, ry, rw, rh);
      rockFG.fillStyle(ROCK_LIGHT, 1);
      rockFG.fillEllipse(rx - 3, ry - 2, Math.round(rw * 0.6), Math.round(rh * 0.6));
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // drawHero — silhouette + breathing tween
  // ─────────────────────────────────────────────────────────────────────────────
  private drawHero(W: number, H: number) {
    this.heroBaseY = H - 120 - 10;   // cliffY - bump moyen
    this.hero = this.add.graphics().setDepth(70).setScrollFactor(0);
    this.hero.setPosition(Math.round(W / 2), this.heroBaseY);
    this.hero.fillStyle(HERO_COL, 1);
    this.hero.fillRect(-5, -28, 10, 14); // torse
    this.hero.fillRect(-5, -14,  4, 10); // jambe gauche
    this.hero.fillRect( 1, -14,  4, 10); // jambe droite
    this.hero.fillRect(-3, -38,  8,  8); // tête
    this.hero.fillRect(-7, -32, 12, 10); // cape/sac
    this.hero.fillRect( 6, -48,  2, 30); // bâton

    this.tweens.add({
      targets: this.hero, y: this.heroBaseY - 1.5,
      duration: 3000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
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
    const BH = 34;
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

    const txt = this.add.text(0, 0, label, pxStyle(9, UI.TXT_PARCHMENT))
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
      this.add.text(W / 2, H / 2 - 130, t('menu.select_slot'), pxStyle(11, UI.TXT_GOLD, true))
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
      const btn = this.add.text(W / 2, by + 24, label, pxStyle(8, col))
        .setOrigin(0.5).setDepth(97).setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setStyle({ color: UI.TXT_WHITE }));
      btn.on('pointerout',  () => btn.setStyle({ color: col }));
      btn.on('pointerdown', () => { elems.forEach(e => e.destroy()); this.transitionTo('NameInputScene', { slot: i }); });
      elems.push(btn);
    }

    const cancel = this.add.text(W / 2, H / 2 + 120, t('menu.cancel'), pxStyle(9, UI.TXT_MUTED))
      .setOrigin(0.5).setDepth(97).setInteractive({ useHandCursor: true });
    cancel.on('pointerover', () => cancel.setStyle({ color: UI.TXT_RED }));
    cancel.on('pointerout',  () => cancel.setStyle({ color: UI.TXT_MUTED }));
    cancel.on('pointerdown', () => elems.forEach(e => e.destroy()));
    elems.push(cancel);
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
      this.add.text(W / 2, H / 2 - 130, t('menu.load_title'), pxStyle(11, UI.TXT_GOLD, true))
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
      const btn   = this.add.text(W / 2, by + 24, label, pxStyle(8, UI.TXT_GREEN))
        .setOrigin(0.5).setDepth(97).setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setStyle({ color: UI.TXT_WHITE }));
      btn.on('pointerout',  () => btn.setStyle({ color: UI.TXT_GREEN }));
      btn.on('pointerdown', () => {
        const state = SaveSystem.load(i);
        if (state) {
          state.saveSlot = i;
          elems.forEach(e => e.destroy());
          this.transitionTo('GameScene', { gameState: state });
        }
      });
      elems.push(btn);
      found++;
    }

    const cancel = this.add.text(W / 2, H / 2 + 120, t('menu.cancel'), pxStyle(9, UI.TXT_MUTED))
      .setOrigin(0.5).setDepth(97).setInteractive({ useHandCursor: true });
    cancel.on('pointerover', () => cancel.setStyle({ color: UI.TXT_RED }));
    cancel.on('pointerout',  () => cancel.setStyle({ color: UI.TXT_MUTED }));
    cancel.on('pointerdown', () => elems.forEach(e => e.destroy()));
    elems.push(cancel);
  }
}
