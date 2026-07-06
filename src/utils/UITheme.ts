// Shared pixel-art UI theme — medieval fantasy palette
// All scenes import from here to stay visually consistent.

export const UI = {
  // Panel backgrounds
  PANEL_BG:    0x0c0c18,
  BORDER:      0x2c1e10,
  BORDER_LIT:  0x6a4a22,
  CORNER:      0xc8a030,

  // Text colours (string form for Phaser text objects)
  TXT_PARCHMENT: '#f5edd0',
  TXT_GOLD:      '#c8a030',
  TXT_MUTED:     '#88776a',
  TXT_HINT:      '#443322',
  TXT_BLUE:      '#88aaff',
  TXT_GREEN:     '#55dd66',
  TXT_RED:       '#dd4433',
  TXT_ORANGE:    '#ff9940',
  TXT_WHITE:     '#ffffff',

  // Slot
  SLOT_BG:     0x0a0a18,
  SLOT_BORDER: 0x282040,
  SLOT_ACTIVE: 0xc8a030,

  // Buttons
  BTN_BG:        0x121020,
  BTN_BG_HOVER:  0x1e1a30,
  BTN_BORDER:    0x4a3520,
  BTN_BORDER_HOV: 0xc8a030,

  // HP
  HP_BG:     0x0a140a,
  HP_GREEN:  0x44cc55,
  HP_ORANGE: 0xdd9920,
  HP_RED:    0xcc2222,
  HP_SHINE:  0xaaffbb,

  // MP
  MP_BG:    0x05050f,
  MP_FILL:  0x2255ee,
  MP_SHINE: 0x99bbff,

  // XP
  XP_BG:    0x080012,
  XP_FILL:  0x8833cc,
  XP_SHINE: 0xcc88ff,

  // Modern accent palette (glow panels, badges, magic feedback)
  ACCENT_VIOLET: 0x9966ff,   // accents mana / magie
  ACCENT_CYAN:   0x44ddcc,   // accents vent / eau
  GLOW_GOLD:     0xffcc66,   // halos dorés (level up, EPIC)
  BG_DEEP:       0x060810,   // fond très sombre (menus overlay)
  BG_MID:        0x0e1520,   // fond panneau mid
  SEPARATOR:     0x1a2535,   // séparateurs discrets
} as const;

export const FONT = "'Press Start 2P', monospace";

/**
 * Draw a pixel-art panel: dark fill + dark border + gold inner line + gold corner rivets.
 *
 * @param fillAlpha Opacité du fond uniquement (bordures et rivets restent opaques).
 *                  0.85 = panneau principal translucide (le jeu reste visible derrière),
 *                  0.92 = panneau secondaire / tooltip, 1 = opaque (défaut, rétro-compatible).
 */
export function drawPanel(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  fill = UI.PANEL_BG,
  fillAlpha = 1,
): void {
  g.fillStyle(fill, fillAlpha);
  g.fillRect(x, y, w, h);

  g.lineStyle(1, UI.BORDER, 1);
  g.strokeRect(x, y, w, h);

  g.lineStyle(1, UI.BORDER_LIT, 0.7);
  g.strokeRect(x + 1, y + 1, w - 2, h - 2);

  const C = 3;
  g.fillStyle(UI.CORNER, 1);
  g.fillRect(x,         y,         C, C);
  g.fillRect(x + w - C, y,         C, C);
  g.fillRect(x,         y + h - C, C, C);
  g.fillRect(x + w - C, y + h - C, C, C);
}

/**
 * Draw a modern glow panel: dark rounded fill + fine outer separator line +
 * fine inner accent line at 30% alpha. The "pixel art + modern UI" look
 * (Hyper Light Drifter / Dead Cells / Hades) — subtle glow instead of
 * thick flat borders.
 *
 * Coexists with drawPanel(): existing scenes keep drawPanel, new/refreshed
 * surfaces use drawGlowPanel. Both are separate named exports.
 */
export function drawGlowPanel(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  accentColor: number = UI.BORDER_LIT,
  bgColor: number = UI.PANEL_BG,
  radius: number = 4,
  fillAlpha: number = 0.97,
): void {
  g.fillStyle(bgColor, fillAlpha);
  g.fillRoundedRect(x, y, w, h, radius);
  g.lineStyle(1, UI.SEPARATOR, 1);
  g.strokeRoundedRect(x, y, w, h, radius);
  g.lineStyle(1, accentColor, 0.3);
  g.strokeRoundedRect(x + 2, y + 2, w - 4, h - 4, Math.max(1, radius - 2));
}

/**
 * Draw a soft luminous halo around a rectangular area — a stack of
 * progressively larger, progressively more transparent stroked rects.
 * Pixel-art friendly (straight edges, no blur filter), très léger à
 * redessiner. Utilisé derrière les titres et panneaux "héros"
 * (référence : lueurs discrètes d'Alabaster Dawn).
 *
 * @param intensity 0..1 — multiplie l'alpha de chaque anneau (défaut 1).
 */
export function drawGlow(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  color: number = UI.GLOW_GOLD,
  intensity: number = 1,
): void {
  const RINGS = 4;
  for (let i = 1; i <= RINGS; i++) {
    const pad   = i * 3;                                  // 3, 6, 9, 12 px
    const alpha = 0.10 * (1 - (i - 1) / RINGS) * intensity;
    g.lineStyle(3, color, alpha);
    g.strokeRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
  }
}

/**
 * Small coloured badge (rarity, element, status): rounded background +
 * centred label, returned as a Container positioned at (x, y) — the
 * container's origin is the badge centre.
 */
export function drawBadge(
  scene: Phaser.Scene,
  x: number, y: number,
  label: string,
  bgColor: number,
  textColor: string = '#ffffff',
): Phaser.GameObjects.Container {
  const txt = scene.add.text(0, 0, label, pxStyle(6, textColor)).setOrigin(0.5);
  const padX = 6;
  const padY = 4;
  const w = Math.ceil(txt.width)  + padX * 2;
  const h = Math.ceil(txt.height) + padY * 2;

  const g = scene.add.graphics();
  g.fillStyle(bgColor, 0.9);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 3);
  g.lineStyle(1, bgColor, 0.45);
  g.strokeRoundedRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, 4);

  return scene.add.container(x, y, [g, txt]);
}

/**
 * Draw a pixel-art progress bar with shine stripe and segment ticks.
 */
export function drawBar(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  pct: number,
  fill: number, bg: number, shine: number,
): void {
  const fw = Math.max(0, Math.floor(w * Math.max(0, Math.min(1, pct))));

  g.fillStyle(bg, 1);
  g.fillRect(x, y, w, h);

  if (fw > 0) {
    g.fillStyle(fill, 1);
    g.fillRect(x, y, fw, h);

    // Top shine stripe
    g.fillStyle(shine, 0.22);
    g.fillRect(x, y, fw, Math.max(2, Math.ceil(h * 0.32)));

    // Pixel segment ticks every 25 px
    if (w > 50) {
      g.fillStyle(0x000000, 0.22);
      for (let tx = x + 25; tx < x + fw; tx += 25) {
        g.fillRect(tx, y, 1, h);
      }
    }
  }

  g.lineStyle(1, 0x000000, 0.45);
  g.strokeRect(x, y, w, h);
}

/**
 * Return a Phaser text style using the pixel font.
 */
export function pxStyle(
  size: number,
  color = UI.TXT_PARCHMENT,
  stroke = false,
): Phaser.Types.GameObjects.Text.TextStyle {
  const s: Phaser.Types.GameObjects.Text.TextStyle = {
    fontSize: `${size}px`,
    color,
    fontFamily: FONT,
  };
  if (stroke) {
    s.stroke = '#000000';
    s.strokeThickness = 3;
  }
  return s;
}
