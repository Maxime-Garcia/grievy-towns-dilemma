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
} as const;

export const FONT = "'Press Start 2P', monospace";

/**
 * Draw a pixel-art panel: dark fill + dark border + gold inner line + gold corner rivets.
 */
export function drawPanel(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  fill = UI.PANEL_BG,
): void {
  g.fillStyle(fill, 1);
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
