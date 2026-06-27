/**
 * PlaceholderAssets.ts
 * Generates all game textures programmatically via Canvas 2D API +
 * scene.textures.addCanvas() so the game can boot without any external PNG files.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width  = w;
  c.height = h;
  return c;
}

function hex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

function darken(color: number, factor = 0.5): number {
  const r = Math.floor(((color >> 16) & 0xff) * factor);
  const g = Math.floor(((color >>  8) & 0xff) * factor);
  const b = Math.floor(( color        & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

function lighter(color: number, add = 0x303030): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + ((add >> 16) & 0xff));
  const g = Math.min(255, ((color >>  8) & 0xff) + ((add >>  8) & 0xff));
  const b = Math.min(255, ( color        & 0xff) + ( add        & 0xff));
  return (r << 16) | (g << 8) | b;
}

/** Register a canvas texture only if the key is not already taken. */
function addCanvas(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement): void {
  if (scene.textures.exists(key)) return;
  scene.textures.addCanvas(key, canvas);
}

// ── Tileset generator ────────────────────────────────────────────────────────

/**
 * Generates a 256×256 tileset image with 5 representative tiles in row 0.
 * Each tile is 16×16 px.
 */
function makeTileset(baseColor: number): HTMLCanvasElement {
  const canvas = makeCanvas(256, 256);
  const ctx    = canvas.getContext('2d')!;

  // Fill entire sheet with darkened base (so unused tiles aren't pure black)
  ctx.fillStyle = hex(darken(baseColor, 0.3));
  ctx.fillRect(0, 0, 256, 256);

  const T = 16; // tile size

  // Tile 0,0 — solid floor
  ctx.fillStyle = hex(baseColor);
  ctx.fillRect(0, 0, T, T);

  // Tile 1,0 — wall (darker + 1-px inner border)
  const wallColor = darken(baseColor, 0.55);
  ctx.fillStyle = hex(wallColor);
  ctx.fillRect(T, 0, T, T);
  ctx.strokeStyle = hex(lighter(baseColor, 0x444444));
  ctx.lineWidth = 1;
  ctx.strokeRect(T + 1.5, 1.5, T - 3, T - 3);

  // Tile 2,0 — special (water/lava) — complementary tint
  const specialColor = lighter(baseColor, 0x1a1a40);
  ctx.fillStyle = hex(specialColor);
  ctx.fillRect(T * 2, 0, T, T);
  // wavy lines
  ctx.strokeStyle = hex(darken(baseColor, 0.7));
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(T * 2 + 2, 5);
  ctx.quadraticCurveTo(T * 2 + 6, 3, T * 2 + 10, 5);
  ctx.quadraticCurveTo(T * 2 + 14, 7, T * 2 + 14, 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(T * 2 + 2, 10);
  ctx.quadraticCurveTo(T * 2 + 6, 8, T * 2 + 10, 10);
  ctx.quadraticCurveTo(T * 2 + 14, 12, T * 2 + 14, 10);
  ctx.stroke();

  // Tile 3,0 — path (lighter blend)
  ctx.fillStyle = hex(lighter(baseColor, 0x202020));
  ctx.fillRect(T * 3, 0, T, T);

  // Tile 4,0 — decoration (dots pattern)
  ctx.fillStyle = hex(lighter(baseColor, 0x101010));
  ctx.fillRect(T * 4, 0, T, T);
  ctx.fillStyle = hex(darken(baseColor, 0.6));
  for (let dy = 2; dy < T; dy += 5) {
    for (let dx = 2; dx < T; dx += 5) {
      ctx.fillRect(T * 4 + dx, dy, 2, 2);
    }
  }

  return canvas;
}

// ── Simple sprite generator ───────────────────────────────────────────────────

/** Square sprite with a solid color + centred white label text. */
function makeSprite(color: number, label: string, w: number, h: number): HTMLCanvasElement {
  const canvas = makeCanvas(w, h);
  const ctx    = canvas.getContext('2d')!;

  ctx.fillStyle = hex(color);
  ctx.fillRect(0, 0, w, h);

  // Border
  ctx.strokeStyle = hex(lighter(color, 0x404040));
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  // Label
  const fontSize = Math.min(w, h) < 24 ? 8 : (Math.min(w, h) < 40 ? 10 : 12);
  ctx.font      = `bold ${fontSize}px monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor  = '#000000';
  ctx.shadowBlur   = 2;
  ctx.fillText(label, w / 2, h / 2);
  ctx.shadowBlur = 0;

  return canvas;
}

/** Boss sprite: larger, with a golden border. */
function makeBoss(color: number, label: string, size: number): HTMLCanvasElement {
  const canvas = makeCanvas(size, size);
  const ctx    = canvas.getContext('2d')!;

  ctx.fillStyle = hex(color);
  ctx.fillRect(0, 0, size, size);

  // Gold double-border
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth   = 3;
  ctx.strokeRect(1.5, 1.5, size - 3, size - 3);
  ctx.strokeStyle = hex(lighter(color, 0x303030));
  ctx.lineWidth   = 1;
  ctx.strokeRect(5, 5, size - 10, size - 10);

  const fontSize = size < 50 ? 12 : 16;
  ctx.font      = `bold ${fontSize}px monospace`;
  ctx.fillStyle = '#ffd700';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor  = '#000000';
  ctx.shadowBlur   = 3;
  ctx.fillText(label, size / 2, size / 2);
  ctx.shadowBlur = 0;

  return canvas;
}

/** Portrait (80×80): same fill + full name rendered in small text. */
function makePortrait(color: number, name: string): HTMLCanvasElement {
  const canvas = makeCanvas(80, 80);
  const ctx    = canvas.getContext('2d')!;

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 80, 80);
  grad.addColorStop(0, hex(lighter(color, 0x202020)));
  grad.addColorStop(1, hex(darken(color, 0.7)));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 80, 80);

  // Frame
  ctx.strokeStyle = hex(lighter(color, 0x505050));
  ctx.lineWidth   = 2;
  ctx.strokeRect(1, 1, 78, 78);

  // Name (may word-wrap very roughly)
  ctx.font      = 'bold 10px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor  = '#000000';
  ctx.shadowBlur   = 2;
  ctx.fillText(name, 40, 40);
  ctx.shadowBlur = 0;

  return canvas;
}

/** Skill icon: circle on square background + short label. */
function makeSkillIcon(color: number, label: string): HTMLCanvasElement {
  const canvas = makeCanvas(32, 32);
  const ctx    = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 32, 32);

  // Circle
  ctx.beginPath();
  ctx.arc(16, 16, 13, 0, Math.PI * 2);
  ctx.fillStyle = hex(color);
  ctx.fill();

  // Ring
  ctx.strokeStyle = hex(lighter(color, 0x606060));
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // Label
  const fontSize = label.length > 2 ? 7 : 9;
  ctx.font      = `bold ${fontSize}px monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor  = '#000000';
  ctx.shadowBlur   = 2;
  ctx.fillText(label, 16, 16);
  ctx.shadowBlur = 0;

  return canvas;
}

// ── Player spritesheet ────────────────────────────────────────────────────────

function makePlayerSheet(): HTMLCanvasElement {
  const canvas = makeCanvas(384, 32);
  const ctx    = canvas.getContext('2d')!;

  function drawFrame(fx: number, legL: number, legR: number, armL: number, armR: number) {
    const x = fx;

    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(x + 16, 31, 9, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#2244aa';
    ctx.fillRect(x + 11, 20 + Math.max(0, legL), 5, 10 - Math.max(0, legL));
    ctx.fillStyle = '#1a3388';
    ctx.fillRect(x + 16, 20 + Math.max(0, legR), 5, 10 - Math.max(0, legR));

    // Boots
    ctx.fillStyle = '#3d2211';
    ctx.fillRect(x + 10, 28, 6, 3);
    ctx.fillRect(x + 16, 28, 6, 3);

    // Torso
    ctx.fillStyle = '#3a9a3a';
    ctx.fillRect(x + 10, 12, 12, 10);

    // Belt
    ctx.fillStyle = '#5a3011';
    ctx.fillRect(x + 10, 20, 12, 2);

    // Left arm
    ctx.fillStyle = '#3a9a3a';
    ctx.fillRect(x + 6, 13 + armL, 4, 8);

    // Right arm + sword
    ctx.fillStyle = '#3a9a3a';
    ctx.fillRect(x + 22, 13 - armR, 4, 8);
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(x + 25, 8 - armR, 2, 13);
    ctx.fillStyle = '#cc8800';
    ctx.fillRect(x + 22, 19 - armR, 8, 2);

    // Head
    ctx.fillStyle = '#f0c080';
    ctx.fillRect(x + 12, 4, 8, 8);

    // Hair
    ctx.fillStyle = '#5a3311';
    ctx.fillRect(x + 11, 3, 10, 4);
    ctx.fillRect(x + 10, 5, 2, 4);

    // Eyes
    ctx.fillStyle = '#1a0800';
    ctx.fillRect(x + 13, 8, 2, 2);
    ctx.fillRect(x + 17, 8, 2, 2);

    // Cape
    ctx.fillStyle = '#883311';
    ctx.fillRect(x + 9, 12, 3, 8);
  }

  // Idle frames (0-3): slight breathing bob
  const idleBob = [0, 0, -1, 0];
  for (let i = 0; i < 4; i++) {
    drawFrame(i * 32, idleBob[i], idleBob[i], 0, 0);
  }

  // Walk frames (4-11): leg + arm swing
  const walk: [number, number, number, number][] = [
    [-2, 2,  1, -1], [-4, 4,  2, -2], [-2, 2,  1, -1], [0, 0, 0, 0],
    [ 2,-2, -1,  1], [ 4,-4, -2,  2], [ 2,-2, -1,  1], [0, 0, 0, 0],
  ];
  for (let i = 0; i < 8; i++) {
    const [lL, lR, aL, aR] = walk[i];
    drawFrame((4 + i) * 32, lL, lR, aL, aR);
  }

  return canvas;
}

// ── Logo ─────────────────────────────────────────────────────────────────────

function makeLogo(): HTMLCanvasElement {
  const canvas = makeCanvas(400, 100);
  const ctx    = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 400, 100);

  // Subtle gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 400, 0);
  grad.addColorStop(0,   'rgba(30,10,60,0.8)');
  grad.addColorStop(0.5, 'rgba(60,20,80,0.4)');
  grad.addColorStop(1,   'rgba(30,10,60,0.8)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 400, 100);

  ctx.font      = 'bold 22px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor  = '#aa88ff';
  ctx.shadowBlur   = 8;
  ctx.fillText("Grievy Town's Dilemma", 200, 50);
  ctx.shadowBlur = 0;

  // Decorative line
  ctx.strokeStyle = '#664488';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(20, 75); ctx.lineTo(380, 75);
  ctx.stroke();

  return canvas;
}

// ── UI elements ───────────────────────────────────────────────────────────────

function makeUIPanel(): HTMLCanvasElement {
  const canvas = makeCanvas(200, 150);
  const ctx    = canvas.getContext('2d')!;
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, 200, 150);
  ctx.strokeStyle = '#555544';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 198, 148);
  return canvas;
}

function makeBar(w: number, h: number, color: string): HTMLCanvasElement {
  const canvas = makeCanvas(w, h);
  const ctx    = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  return canvas;
}

function makeSlot(): HTMLCanvasElement {
  const canvas = makeCanvas(40, 40);
  const ctx    = canvas.getContext('2d')!;
  ctx.fillStyle = '#222222';
  ctx.fillRect(0, 0, 40, 40);
  ctx.strokeStyle = '#555555';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, 39, 39);
  return canvas;
}

function makePortraitBg(): HTMLCanvasElement {
  const canvas = makeCanvas(80, 80);
  const ctx    = canvas.getContext('2d')!;
  ctx.fillStyle = '#222222';
  ctx.fillRect(0, 0, 80, 80);
  ctx.strokeStyle = '#885544';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 78, 78);
  return canvas;
}

// ── Element-themed enemy sprite ───────────────────────────────────────────────

function makeEnemyCanvas(element: string, label: string, w = 32, h = 32): HTMLCanvasElement {
  const canvas = makeCanvas(w, h);
  const ctx    = canvas.getContext('2d')!;
  const cx = w / 2, cy = h / 2;

  const SHAPES: Record<string, { color: number; shape: string }> = {
    FIRE:      { color: 0xcc2200, shape: 'flame'   },
    EARTH:     { color: 0x553311, shape: 'block'   },
    WIND:      { color: 0x7799cc, shape: 'wisp'    },
    WATER:     { color: 0x003377, shape: 'drop'    },
    LIGHTNING: { color: 0x5500aa, shape: 'zap'     },
    ICE:       { color: 0x88ccff, shape: 'crystal' },
    DARK:      { color: 0x220033, shape: 'shadow'  },
  };
  const cfg = SHAPES[element] ?? { color: 0x555566, shape: 'block' };
  const c   = cfg.color;

  switch (cfg.shape) {
    case 'flame': {
      ctx.fillStyle = hex(c);
      ctx.beginPath();
      ctx.moveTo(cx, 2);
      ctx.bezierCurveTo(cx + 11, cy - 4, cx + 10, cy + 4, cx, h - 2);
      ctx.bezierCurveTo(cx - 10, cy + 4, cx - 11, cy - 4, cx, 2);
      ctx.fill();
      ctx.fillStyle = '#ff8844';
      ctx.beginPath();
      ctx.moveTo(cx, 6);
      ctx.bezierCurveTo(cx + 5, cy - 1, cx + 5, cy + 2, cx, h - 8);
      ctx.bezierCurveTo(cx - 5, cy + 2, cx - 5, cy - 1, cx, 6);
      ctx.fill();
      break;
    }
    case 'block': {
      ctx.fillStyle = hex(c);
      ctx.fillRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = hex(lighter(c, 0x303030));
      ctx.fillRect(3, 3, w - 6, 4);
      ctx.fillRect(3, 3, 4, h - 6);
      ctx.fillStyle = hex(darken(c, 0.5));
      ctx.fillRect(w - 7, 3, 4, h - 6);
      ctx.fillRect(3, h - 7, w - 6, 4);
      break;
    }
    case 'wisp': {
      for (let i = 3; i >= 0; i--) {
        ctx.globalAlpha = 0.3 + i * 0.18;
        ctx.fillStyle = hex(lighter(c, i * 0x1a1a1a));
        ctx.beginPath();
        ctx.ellipse(cx + (i % 2 === 0 ? 2 : -2), cy, cx - 2 - i * 2, cy - 2 - i * 1, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'drop': {
      ctx.fillStyle = hex(c);
      ctx.beginPath();
      ctx.moveTo(cx, 2);
      ctx.bezierCurveTo(cx + 12, cy, cx + 11, h - 4, cx, h - 2);
      ctx.bezierCurveTo(cx - 11, h - 4, cx - 12, cy, cx, 2);
      ctx.fill();
      ctx.fillStyle = hex(lighter(c, 0x446688));
      ctx.beginPath();
      ctx.ellipse(cx - 3, cy - 2, 4, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'zap': {
      ctx.fillStyle = hex(darken(c, 0.6));
      ctx.fillRect(2, 2, w - 4, h - 4);
      ctx.fillStyle = '#ffdd22';
      ctx.beginPath();
      ctx.moveTo(cx + 4, 3);
      ctx.lineTo(cx - 2, cy - 1);
      ctx.lineTo(cx + 3, cy - 1);
      ctx.lineTo(cx - 4, h - 3);
      ctx.lineTo(cx + 2, cy + 3);
      ctx.lineTo(cx - 3, cy + 3);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'crystal': {
      ctx.fillStyle = hex(c);
      ctx.beginPath();
      ctx.moveTo(cx, 2);
      ctx.lineTo(w - 3, cy);
      ctx.lineTo(cx, h - 2);
      ctx.lineTo(3, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = hex(lighter(c, 0x404040));
      ctx.beginPath();
      ctx.moveTo(cx, 2);
      ctx.lineTo(w - 3, cy);
      ctx.lineTo(cx, cy - 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'shadow': {
      ctx.fillStyle = hex(c);
      ctx.beginPath();
      ctx.ellipse(cx, cy, cx - 2, cy - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#aa00ff';
      ctx.beginPath();
      ctx.ellipse(cx - 5, cy - 2, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 5, cy - 2, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  const fs = label.length > 2 ? 7 : 8;
  ctx.font      = `bold ${fs}px monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor  = '#000000';
  ctx.shadowBlur   = 3;
  ctx.fillText(label, cx, h - 5);
  ctx.shadowBlur   = 0;

  return canvas;
}

// ── NPC sprite ────────────────────────────────────────────────────────────────

function makeNPCCanvas(color: number, initial: string): HTMLCanvasElement {
  const canvas = makeCanvas(32, 32);
  const ctx    = canvas.getContext('2d')!;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(16, 31, 8, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Robe
  ctx.fillStyle = hex(color);
  ctx.fillRect(10, 13, 12, 14);
  ctx.fillStyle = hex(darken(color, 0.7));
  ctx.fillRect(6, 14, 4, 8);
  ctx.fillRect(22, 14, 4, 8);

  // Head
  ctx.fillStyle = '#f0c080';
  ctx.fillRect(11, 4, 10, 10);
  ctx.fillStyle = hex(darken(color, 0.55));
  ctx.fillRect(10, 3, 12, 4);

  // Eyes
  ctx.fillStyle = '#1a0800';
  ctx.fillRect(13, 8, 2, 2);
  ctx.fillRect(17, 8, 2, 2);

  // Initial label in body
  ctx.font      = 'bold 8px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor  = '#000000';
  ctx.shadowBlur   = 2;
  ctx.fillText(initial.charAt(0), 16, 21);
  ctx.shadowBlur   = 0;

  return canvas;
}

// ── XP orb ────────────────────────────────────────────────────────────────────

function makeXpOrb(): HTMLCanvasElement {
  const canvas = makeCanvas(12, 12);
  const ctx    = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(5, 5, 1, 6, 6, 6);
  grad.addColorStop(0,   '#ffffff');
  grad.addColorStop(0.4, '#88ffaa');
  grad.addColorStop(1,   'rgba(30, 150, 60, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(6, 6, 5, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

// ── Real-asset manifest ───────────────────────────────────────────────────────
// Drop matching PNG files in public/assets/ to override the placeholder for that key.

export interface AssetEntry {
  key: string;
  path: string;
  type: 'image' | 'spritesheet';
  frameWidth?: number;
  frameHeight?: number;
  spacing?: number;
  margin?: number;
}

export const REAL_ASSET_MANIFEST: AssetEntry[] = [
  // Kenney spritesheets — 16×16 tiles, 1px spacing
  { key: 'kenney_chars', path: 'assets/kenneys/characters/Spritesheet/roguelikeChar_transparent.png',         type: 'spritesheet', frameWidth: 16, frameHeight: 16, spacing: 1 },
  { key: 'kenney_dun',   path: 'assets/kenneys/caves-dungeons/Spritesheet/roguelikeDungeon_transparent.png',  type: 'spritesheet', frameWidth: 16, frameHeight: 16, spacing: 1 },

  // Individual rpg-base 64×64 tiles — used as source for tile assembly
  { key: 'rpgbase_003', path: 'assets/kenneys/rpg-base/PNG/rpgTile003.png', type: 'image' },
  { key: 'rpgbase_013', path: 'assets/kenneys/rpg-base/PNG/rpgTile013.png', type: 'image' },
  { key: 'rpgbase_015', path: 'assets/kenneys/rpg-base/PNG/rpgTile015.png', type: 'image' },
  { key: 'rpgbase_050', path: 'assets/kenneys/rpg-base/PNG/rpgTile050.png', type: 'image' },
  { key: 'rpgbase_060', path: 'assets/kenneys/rpg-base/PNG/rpgTile060.png', type: 'image' },
  { key: 'rpgbase_110', path: 'assets/kenneys/rpg-base/PNG/rpgTile110.png', type: 'image' },
  { key: 'rpgbase_120', path: 'assets/kenneys/rpg-base/PNG/rpgTile120.png', type: 'image' },
  { key: 'rpgbase_130', path: 'assets/kenneys/rpg-base/PNG/rpgTile130.png', type: 'image' },
  { key: 'rpgbase_160', path: 'assets/kenneys/rpg-base/PNG/rpgTile160.png', type: 'image' },
  { key: 'rpgbase_180', path: 'assets/kenneys/rpg-base/PNG/rpgTile180.png', type: 'image' },
  { key: 'rpgbase_200', path: 'assets/kenneys/rpg-base/PNG/rpgTile200.png', type: 'image' },

  // Player spritesheet — 12 frames × 32×32 px in a single row (384×32 PNG)
  { key: 'player', path: 'assets/sprites/player.png', type: 'spritesheet', frameWidth: 32, frameHeight: 32 },

  // Individual tiles — any size PNG, auto-assembled into 256×256 tilesets at boot
  // Destination: public/assets/tiles/{zone}_{type}.png
  { key: 'tile_town_floor',           path: 'assets/tiles/town_floor.png',           type: 'image' },
  { key: 'tile_town_wall',            path: 'assets/tiles/town_wall.png',            type: 'image' },
  { key: 'tile_town_special',         path: 'assets/tiles/town_special.png',         type: 'image' },
  { key: 'tile_town_path',            path: 'assets/tiles/town_path.png',            type: 'image' },
  { key: 'tile_town_deco',            path: 'assets/tiles/town_deco.png',            type: 'image' },
  { key: 'tile_fire_floor',           path: 'assets/tiles/fire_floor.png',           type: 'image' },
  { key: 'tile_fire_wall',            path: 'assets/tiles/fire_wall.png',            type: 'image' },
  { key: 'tile_fire_special',         path: 'assets/tiles/fire_special.png',         type: 'image' },
  { key: 'tile_fire_path',            path: 'assets/tiles/fire_path.png',            type: 'image' },
  { key: 'tile_fire_deco',            path: 'assets/tiles/fire_deco.png',            type: 'image' },
  { key: 'tile_earth_floor',          path: 'assets/tiles/earth_floor.png',          type: 'image' },
  { key: 'tile_earth_wall',           path: 'assets/tiles/earth_wall.png',           type: 'image' },
  { key: 'tile_earth_special',        path: 'assets/tiles/earth_special.png',        type: 'image' },
  { key: 'tile_earth_path',           path: 'assets/tiles/earth_path.png',           type: 'image' },
  { key: 'tile_earth_deco',           path: 'assets/tiles/earth_deco.png',           type: 'image' },
  { key: 'tile_wind_floor',           path: 'assets/tiles/wind_floor.png',           type: 'image' },
  { key: 'tile_wind_wall',            path: 'assets/tiles/wind_wall.png',            type: 'image' },
  { key: 'tile_wind_special',         path: 'assets/tiles/wind_special.png',         type: 'image' },
  { key: 'tile_wind_path',            path: 'assets/tiles/wind_path.png',            type: 'image' },
  { key: 'tile_wind_deco',            path: 'assets/tiles/wind_deco.png',            type: 'image' },
  { key: 'tile_water_floor',          path: 'assets/tiles/water_floor.png',          type: 'image' },
  { key: 'tile_water_wall',           path: 'assets/tiles/water_wall.png',           type: 'image' },
  { key: 'tile_water_special',        path: 'assets/tiles/water_special.png',        type: 'image' },
  { key: 'tile_water_path',           path: 'assets/tiles/water_path.png',           type: 'image' },
  { key: 'tile_water_deco',           path: 'assets/tiles/water_deco.png',           type: 'image' },
  { key: 'tile_lightning_floor',      path: 'assets/tiles/lightning_floor.png',      type: 'image' },
  { key: 'tile_lightning_wall',       path: 'assets/tiles/lightning_wall.png',       type: 'image' },
  { key: 'tile_lightning_special',    path: 'assets/tiles/lightning_special.png',    type: 'image' },
  { key: 'tile_lightning_path',       path: 'assets/tiles/lightning_path.png',       type: 'image' },
  { key: 'tile_lightning_deco',       path: 'assets/tiles/lightning_deco.png',       type: 'image' },
  { key: 'tile_ice_floor',            path: 'assets/tiles/ice_floor.png',            type: 'image' },
  { key: 'tile_ice_wall',             path: 'assets/tiles/ice_wall.png',             type: 'image' },
  { key: 'tile_ice_special',          path: 'assets/tiles/ice_special.png',          type: 'image' },
  { key: 'tile_ice_path',             path: 'assets/tiles/ice_path.png',             type: 'image' },
  { key: 'tile_ice_deco',             path: 'assets/tiles/ice_deco.png',             type: 'image' },
  { key: 'tile_dark_floor',           path: 'assets/tiles/dark_floor.png',           type: 'image' },
  { key: 'tile_dark_wall',            path: 'assets/tiles/dark_wall.png',            type: 'image' },
  { key: 'tile_dark_special',         path: 'assets/tiles/dark_special.png',         type: 'image' },
  { key: 'tile_dark_path',            path: 'assets/tiles/dark_path.png',            type: 'image' },
  { key: 'tile_dark_deco',            path: 'assets/tiles/dark_deco.png',            type: 'image' },

  // Enemies — 32×32 PNG per enemy
  { key: 'enemy_ember_wyrm',       path: 'assets/sprites/enemies/ember_wyrm.png',       type: 'image' },
  { key: 'enemy_lava_golem',       path: 'assets/sprites/enemies/lava_golem.png',       type: 'image' },
  { key: 'enemy_cinder_sprite',    path: 'assets/sprites/enemies/cinder_sprite.png',    type: 'image' },
  { key: 'enemy_ash_revenant',     path: 'assets/sprites/enemies/ash_revenant.png',     type: 'image' },
  { key: 'enemy_magma_titan',      path: 'assets/sprites/enemies/magma_titan.png',      type: 'image' },
  { key: 'enemy_stone_crawler',    path: 'assets/sprites/enemies/stone_crawler.png',    type: 'image' },
  { key: 'enemy_crystal_golem',    path: 'assets/sprites/enemies/crystal_golem.png',    type: 'image' },
  { key: 'enemy_cave_lurker',      path: 'assets/sprites/enemies/cave_lurker.png',      type: 'image' },
  { key: 'enemy_terravast_serpent',path: 'assets/sprites/enemies/terravast_serpent.png',type: 'image' },
  { key: 'enemy_ruin_colossus',    path: 'assets/sprites/enemies/ruin_colossus.png',    type: 'image' },
  { key: 'enemy_gale_harpy',       path: 'assets/sprites/enemies/gale_harpy.png',       type: 'image' },
  { key: 'enemy_storm_eagle',      path: 'assets/sprites/enemies/storm_eagle.png',      type: 'image' },
  { key: 'enemy_wind_wraith',      path: 'assets/sprites/enemies/wind_wraith.png',      type: 'image' },
  { key: 'enemy_cyclone_sprite',   path: 'assets/sprites/enemies/cyclone_sprite.png',   type: 'image' },
  { key: 'enemy_sky_titan',        path: 'assets/sprites/enemies/sky_titan.png',        type: 'image' },
  { key: 'enemy_tide_crawler',     path: 'assets/sprites/enemies/tide_crawler.png',     type: 'image' },
  { key: 'enemy_sea_wraith',       path: 'assets/sprites/enemies/sea_wraith.png',       type: 'image' },
  { key: 'enemy_coral_golem',      path: 'assets/sprites/enemies/coral_golem.png',      type: 'image' },
  { key: 'enemy_depth_serpent',    path: 'assets/sprites/enemies/depth_serpent.png',    type: 'image' },
  { key: 'enemy_drowned_knight',   path: 'assets/sprites/enemies/drowned_knight.png',   type: 'image' },
  { key: 'enemy_spark_imp',        path: 'assets/sprites/enemies/spark_imp.png',        type: 'image' },
  { key: 'enemy_thunder_drake',    path: 'assets/sprites/enemies/thunder_drake.png',    type: 'image' },
  { key: 'enemy_chain_revenant',   path: 'assets/sprites/enemies/chain_revenant.png',   type: 'image' },
  { key: 'enemy_volt_hound',       path: 'assets/sprites/enemies/volt_hound.png',       type: 'image' },
  { key: 'enemy_storm_herald',     path: 'assets/sprites/enemies/storm_herald.png',     type: 'image' },
  { key: 'enemy_frost_wolf',       path: 'assets/sprites/enemies/frost_wolf.png',       type: 'image' },
  { key: 'enemy_ice_golem',        path: 'assets/sprites/enemies/ice_golem.png',        type: 'image' },
  { key: 'enemy_blizzard_wraith',  path: 'assets/sprites/enemies/blizzard_wraith.png',  type: 'image' },
  { key: 'enemy_permafrost_titan', path: 'assets/sprites/enemies/permafrost_titan.png', type: 'image' },
  { key: 'enemy_crystal_dragon',   path: 'assets/sprites/enemies/crystal_dragon.png',   type: 'image' },
  { key: 'enemy_dark_revenant',    path: 'assets/sprites/enemies/dark_revenant.png',    type: 'image' },
  { key: 'enemy_shadow_construct', path: 'assets/sprites/enemies/shadow_construct.png', type: 'image' },
  { key: 'enemy_void_sentinel',    path: 'assets/sprites/enemies/void_sentinel.png',    type: 'image' },

  // NPCs — 32×32 PNG per NPC
  { key: 'npc_aldric',       path: 'assets/sprites/npcs/aldric.png',       type: 'image' },
  { key: 'npc_mira',         path: 'assets/sprites/npcs/mira.png',         type: 'image' },
  { key: 'npc_theron',       path: 'assets/sprites/npcs/theron.png',       type: 'image' },
  { key: 'npc_brother_ovan', path: 'assets/sprites/npcs/brother_ovan.png', type: 'image' },
  { key: 'npc_liria',        path: 'assets/sprites/npcs/liria.png',        type: 'image' },
  { key: 'npc_kelvar',       path: 'assets/sprites/npcs/kelvar.png',       type: 'image' },
  { key: 'npc_ysolde',       path: 'assets/sprites/npcs/ysolde.png',       type: 'image' },
  { key: 'npc_elara',        path: 'assets/sprites/npcs/elara.png',        type: 'image' },

  // NPC portraits — 80×80 PNG
  { key: 'portrait_aldric',       path: 'assets/sprites/portraits/aldric.png',       type: 'image' },
  { key: 'portrait_mira',         path: 'assets/sprites/portraits/mira.png',         type: 'image' },
  { key: 'portrait_theron',       path: 'assets/sprites/portraits/theron.png',       type: 'image' },
  { key: 'portrait_brother_ovan', path: 'assets/sprites/portraits/brother_ovan.png', type: 'image' },
  { key: 'portrait_liria',        path: 'assets/sprites/portraits/liria.png',        type: 'image' },
  { key: 'portrait_kelvar',       path: 'assets/sprites/portraits/kelvar.png',       type: 'image' },
  { key: 'portrait_ysolde',       path: 'assets/sprites/portraits/ysolde.png',       type: 'image' },
  { key: 'portrait_elara',        path: 'assets/sprites/portraits/elara.png',        type: 'image' },

  // Bosses — 64×64 PNG
  { key: 'boss_pyrath',   path: 'assets/sprites/bosses/pyrath.png',   type: 'image' },
  { key: 'boss_gorvun',   path: 'assets/sprites/bosses/gorvun.png',   type: 'image' },
  { key: 'boss_sylvael',  path: 'assets/sprites/bosses/sylvael.png',  type: 'image' },
  { key: 'boss_thalymor', path: 'assets/sprites/bosses/thalymor.png', type: 'image' },
  { key: 'boss_volkran',  path: 'assets/sprites/bosses/volkran.png',  type: 'image' },
  { key: 'boss_crysthea', path: 'assets/sprites/bosses/crysthea.png', type: 'image' },
  { key: 'boss_malachar', path: 'assets/sprites/bosses/malachar.png', type: 'image' },

  // Divine forms — 48×48 PNG
  { key: 'divine_pyrath',   path: 'assets/sprites/divines/pyrath.png',   type: 'image' },
  { key: 'divine_gorvun',   path: 'assets/sprites/divines/gorvun.png',   type: 'image' },
  { key: 'divine_sylvael',  path: 'assets/sprites/divines/sylvael.png',  type: 'image' },
  { key: 'divine_thalymor', path: 'assets/sprites/divines/thalymor.png', type: 'image' },
  { key: 'divine_volkran',  path: 'assets/sprites/divines/volkran.png',  type: 'image' },
  { key: 'divine_crysthea', path: 'assets/sprites/divines/crysthea.png', type: 'image' },

  // Skill icons — 32×32 PNG
  { key: 'skill_dash',            path: 'assets/sprites/skills/dash.png',            type: 'image' },
  { key: 'skill_echo_strike',     path: 'assets/sprites/skills/echo_strike.png',     type: 'image' },
  { key: 'skill_fireball',        path: 'assets/sprites/skills/fireball.png',        type: 'image' },
  { key: 'skill_flame_dash',      path: 'assets/sprites/skills/flame_dash.png',      type: 'image' },
  { key: 'skill_inferno_burst',   path: 'assets/sprites/skills/inferno_burst.png',   type: 'image' },
  { key: 'skill_stone_shield',    path: 'assets/sprites/skills/stone_shield.png',    type: 'image' },
  { key: 'skill_seismic_slam',    path: 'assets/sprites/skills/seismic_slam.png',    type: 'image' },
  { key: 'skill_terra_surge',     path: 'assets/sprites/skills/terra_surge.png',     type: 'image' },
  { key: 'skill_gale_step',       path: 'assets/sprites/skills/gale_step.png',       type: 'image' },
  { key: 'skill_tornado_spin',    path: 'assets/sprites/skills/tornado_spin.png',    type: 'image' },
  { key: 'skill_skyward_strike',  path: 'assets/sprites/skills/skyward_strike.png',  type: 'image' },
  { key: 'skill_tidal_wave',      path: 'assets/sprites/skills/tidal_wave.png',      type: 'image' },
  { key: 'skill_healing_current', path: 'assets/sprites/skills/healing_current.png', type: 'image' },
  { key: 'skill_frost_lance',     path: 'assets/sprites/skills/frost_lance.png',     type: 'image' },
  { key: 'skill_thunder_bolt',    path: 'assets/sprites/skills/thunder_bolt.png',    type: 'image' },
  { key: 'skill_chain_lightning', path: 'assets/sprites/skills/chain_lightning.png', type: 'image' },
  { key: 'skill_volt_dash',       path: 'assets/sprites/skills/volt_dash.png',       type: 'image' },
  { key: 'skill_frost_nova',      path: 'assets/sprites/skills/frost_nova.png',      type: 'image' },
  { key: 'skill_blizzard',        path: 'assets/sprites/skills/blizzard.png',        type: 'image' },
  { key: 'skill_ice_barrier',     path: 'assets/sprites/skills/ice_barrier.png',     type: 'image' },
  { key: 'skill_soul_echo',       path: 'assets/sprites/skills/soul_echo.png',       type: 'image' },
  { key: 'skill_void_step',       path: 'assets/sprites/skills/void_step.png',       type: 'image' },
  { key: 'skill_prism_burst',     path: 'assets/sprites/skills/prism_burst.png',     type: 'image' },
  { key: 'skill_elaras_gift',     path: 'assets/sprites/skills/elaras_gift.png',     type: 'image' },

  // UI elements
  { key: 'ui_panel',       path: 'assets/sprites/ui/panel.png',       type: 'image' },
  { key: 'ui_slot',        path: 'assets/sprites/ui/slot.png',        type: 'image' },
  { key: 'ui_portrait_bg', path: 'assets/sprites/ui/portrait_bg.png', type: 'image' },
  { key: 'ui_healthbar',   path: 'assets/sprites/ui/healthbar.png',   type: 'image' },
  { key: 'ui_manabar',     path: 'assets/sprites/ui/manabar.png',     type: 'image' },

  // Misc
  { key: 'xp_orb', path: 'assets/sprites/xp_orb.png', type: 'image' },
  { key: 'logo',   path: 'assets/sprites/logo.png',   type: 'image' },
];

// ── Main export ───────────────────────────────────────────────────────────────

export function generatePlaceholderAssets(scene: Phaser.Scene): void {

  // ── Individual tiles (assembled into tilesets by assembleTilesets()) ──────
  const ZONE_COLORS: Array<[string, number]> = [
    ['town',      0x664422],
    ['fire',      0xff3300],
    ['earth',     0x553311],
    ['wind',      0xaaccff],
    ['water',     0x003377],
    ['lightning', 0x440066],
    ['ice',       0x88ccff],
    ['dark',      0x110011],
  ];
  const TILE_TYPES  = ['floor', 'wall', 'special', 'path', 'deco'] as const;
  const TILE_LABELS = ['FL',    'WL',   'SP',      'PT',   'DC'];
  for (const [zone, color] of ZONE_COLORS) {
    const tints = [
      color,
      darken(color, 0.55),
      lighter(color, 0x1a1a40),
      lighter(color, 0x202020),
      lighter(color, 0x101010),
    ];
    for (let i = 0; i < TILE_TYPES.length; i++) {
      addCanvas(scene, `tile_${zone}_${TILE_TYPES[i]}`, makeSprite(tints[i], TILE_LABELS[i], 64, 64));
    }
  }

  // ── Player spritesheet ────────────────────────────────────────
  // Register as a regular texture; GameScene uses generateFrameNumbers which
  // works on any texture with explicit frameWidth set during animation creation.
  // We add it as an image texture and then add frame data manually.
  if (!scene.textures.exists('player')) {
    const playerCanvas = makePlayerSheet();
    scene.textures.addCanvas('player', playerCanvas);
    // Add frame data so generateFrameNumbers works
    const tex = scene.textures.get('player');
    for (let i = 0; i < 12; i++) {
      tex.add(i, 0, i * 32, 0, 32, 32);
    }
  }

  // ── XP orb ───────────────────────────────────────────────────
  addCanvas(scene, 'xp_orb', makeXpOrb());

  // ── Enemy sprites (32×32) — element-themed shapes ────────────
  const ENEMIES: [string, string, string][] = [
    // key,                         element,     label
    ['enemy_ember_wyrm',      'FIRE',      'EW'],
    ['enemy_lava_golem',      'FIRE',      'LG'],
    ['enemy_cinder_sprite',   'FIRE',      'CS'],
    ['enemy_ash_revenant',    'FIRE',      'AR'],
    ['enemy_magma_titan',     'FIRE',      'MT'],
    ['enemy_stone_crawler',   'EARTH',     'SC'],
    ['enemy_crystal_golem',   'EARTH',     'CG'],
    ['enemy_cave_lurker',     'EARTH',     'CL'],
    ['enemy_terravast_serpent','EARTH',    'TS'],
    ['enemy_ruin_colossus',   'EARTH',     'RC'],
    ['enemy_gale_harpy',      'WIND',      'GH'],
    ['enemy_storm_eagle',     'WIND',      'SE'],
    ['enemy_wind_wraith',     'WIND',      'WW'],
    ['enemy_cyclone_sprite',  'WIND',      'CY'],
    ['enemy_sky_titan',       'WIND',      'ST'],
    ['enemy_tide_crawler',    'WATER',     'TC'],
    ['enemy_sea_wraith',      'WATER',     'SW'],
    ['enemy_coral_golem',     'WATER',     'CG'],
    ['enemy_depth_serpent',   'WATER',     'DS'],
    ['enemy_drowned_knight',  'WATER',     'DK'],
    ['enemy_spark_imp',       'LIGHTNING', 'SI'],
    ['enemy_thunder_drake',   'LIGHTNING', 'TD'],
    ['enemy_chain_revenant',  'LIGHTNING', 'CR'],
    ['enemy_volt_hound',      'LIGHTNING', 'VH'],
    ['enemy_storm_herald',    'LIGHTNING', 'SH'],
    ['enemy_frost_wolf',      'ICE',       'FW'],
    ['enemy_ice_golem',       'ICE',       'IG'],
    ['enemy_blizzard_wraith', 'ICE',       'BW'],
    ['enemy_permafrost_titan','ICE',       'PT'],
    ['enemy_crystal_dragon',  'ICE',       'CD'],
    ['enemy_dark_revenant',   'DARK',      'DR'],
    ['enemy_shadow_construct','DARK',      'SC'],
    ['enemy_void_sentinel',   'DARK',      'VS'],
  ];
  for (const [key, element, label] of ENEMIES) {
    addCanvas(scene, key, makeEnemyCanvas(element, label));
  }

  // ── Bosses (64×64) with gold border ─────────────────────────
  const BOSSES: [string, number, string][] = [
    ['boss_pyrath',   0xcc2200, 'PYR'],
    ['boss_gorvun',   0x553311, 'GOR'],
    ['boss_sylvael',  0x7799cc, 'SYL'],
    ['boss_thalymor', 0x003377, 'THA'],
    ['boss_volkran',  0x440066, 'VOL'],
    ['boss_crysthea', 0x88ccff, 'CRY'],
    ['boss_malachar', 0x220033, 'MAL'],
  ];
  for (const [key, color, label] of BOSSES) {
    addCanvas(scene, key, makeBoss(color, label, 64));
  }

  // ── Divine forms (48×48) ────────────────────────────────────
  const DIVINES: [string, number, string][] = [
    ['divine_pyrath',   0xff4400, 'D-PYR'],
    ['divine_gorvun',   0x886633, 'D-GOR'],
    ['divine_sylvael',  0xaaccff, 'D-SYL'],
    ['divine_thalymor', 0x2255aa, 'D-THA'],
    ['divine_volkran',  0x8800cc, 'D-VOL'],
    ['divine_crysthea', 0xaaddff, 'D-CRY'],
  ];
  for (const [key, color, label] of DIVINES) {
    addCanvas(scene, key, makeBoss(color, label, 48));
  }

  // ── NPC sprites (32×32) — humanoid figures ───────────────────
  const NPCS: [string, number, string][] = [
    ['npc_aldric',       0x664422, 'A'],
    ['npc_mira',         0xcc3344, 'M'],
    ['npc_theron',       0x888888, 'T'],
    ['npc_brother_ovan', 0x5544aa, 'O'],
    ['npc_liria',        0x336633, 'L'],
    ['npc_kelvar',       0x556677, 'K'],
    ['npc_ysolde',       0xccaa22, 'Y'],
    ['npc_elara',        0x88bbcc, 'E'],
  ];
  for (const [key, color, initial] of NPCS) {
    addCanvas(scene, key, makeNPCCanvas(color, initial));
  }

  // ── NPC portraits (80×80) ────────────────────────────────────
  const PORTRAITS: [string, number, string][] = [
    ['portrait_aldric',       0x664422, 'Aldric'],
    ['portrait_mira',         0xcc3344, 'Mira'],
    ['portrait_theron',       0x888888, 'Theron'],
    ['portrait_brother_ovan', 0x5544aa, 'Br.Ovan'],
    ['portrait_liria',        0x336633, 'Liria'],
    ['portrait_kelvar',       0x556677, 'Kelvar'],
    ['portrait_ysolde',       0xccaa22, 'Ysolde'],
    ['portrait_elara',        0x88bbcc, 'Elara'],
  ];
  for (const [key, color, name] of PORTRAITS) {
    addCanvas(scene, key, makePortrait(color, name));
  }

  // ── UI elements ───────────────────────────────────────────────
  addCanvas(scene, 'ui_panel',       makeUIPanel());
  addCanvas(scene, 'ui_healthbar',   makeBar(120, 10, '#330000'));
  addCanvas(scene, 'ui_manabar',     makeBar(120, 10, '#000033'));
  addCanvas(scene, 'ui_slot',        makeSlot());
  addCanvas(scene, 'ui_portrait_bg', makePortraitBg());

  // ── Skill icons (32×32) ───────────────────────────────────────
  const SKILLS: [string, number, string][] = [
    ['skill_dash',           0xffffff, 'D'],
    ['skill_echo_strike',    0xffdd44, 'E'],
    ['skill_fireball',       0xff2200, 'F'],
    ['skill_flame_dash',     0xff7700, 'FD'],
    ['skill_inferno_burst',  0xcc1100, 'IB'],
    ['skill_stone_shield',   0x888888, 'SS'],
    ['skill_seismic_slam',   0x664422, 'SL'],
    ['skill_terra_surge',    0x557733, 'TS'],
    ['skill_gale_step',      0x44cccc, 'GS'],
    ['skill_tornado_spin',   0x88bbff, 'TN'],
    ['skill_skyward_strike', 0x4488ff, 'SK'],
    ['skill_tidal_wave',     0x003388, 'TW'],
    ['skill_healing_current',0x22cc66, 'HC'],
    ['skill_frost_lance',    0xaaddff, 'FL'],
    ['skill_thunder_bolt',   0xffee22, 'TB'],
    ['skill_chain_lightning',0x8833cc, 'CL'],
    ['skill_volt_dash',      0xbb55ee, 'VD'],
    ['skill_frost_nova',     0x33aacc, 'FN'],
    ['skill_blizzard',       0x99ccff, 'BL'],
    ['skill_ice_barrier',    0xcceeff, 'IB'],
    ['skill_soul_echo',      0xffcc44, 'SE'],
    ['skill_void_step',      0x440066, 'VS'],
    ['skill_prism_burst',    0xff88ff, 'PB'],
    ['skill_elaras_gift',    0x88ffaa, 'EG'],
  ];
  for (const [key, color, label] of SKILLS) {
    addCanvas(scene, key, makeSkillIcon(color, label));
  }

  // ── Logo ──────────────────────────────────────────────────────
  addCanvas(scene, 'logo', makeLogo());
}

// ── Tileset assembler ─────────────────────────────────────────────────────────
/**
 * Builds each zone's 256×256 tileset texture from 5 individual tile PNGs.
 * Call this in BootScene.create() AFTER generatePlaceholderAssets() so every
 * tile key is guaranteed to exist (real PNG or placeholder).
 * Accepts any source image size — scales each tile to 16×16 when drawing.
 */
export function assembleTilesets(scene: Phaser.Scene): void {
  const ZONES: Array<[string, string]> = [
    ['town',      'tiles_town'],
    ['fire',      'tiles_fire'],
    ['earth',     'tiles_earth'],
    ['wind',      'tiles_wind'],
    ['water',     'tiles_water'],
    ['lightning', 'tiles_lightning'],
    ['ice',       'tiles_ice'],
    ['dark',      'tiles_dark'],
  ];
  const TYPES = ['floor', 'wall', 'special', 'path', 'deco'];

  for (const [zone, tilesetKey] of ZONES) {
    const canvas = makeCanvas(256, 256);
    const ctx    = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < TYPES.length; i++) {
      const tileKey = `tile_${zone}_${TYPES[i]}`;
      if (!scene.textures.exists(tileKey)) continue;
      const src = scene.textures.get(tileKey).getSourceImage();
      ctx.drawImage(src as CanvasImageSource, i * 16, 0, 16, 16);
    }

    if (scene.textures.exists(tilesetKey)) scene.textures.remove(tilesetKey);
    scene.textures.addCanvas(tilesetKey, canvas);
  }
}

// ── Kenney tile extractor ─────────────────────────────────────────────────────
/**
 * Replaces placeholder tile_{zone}_{type} textures with verified Kenney tiles.
 *
 * Sources:
 *  - 'base' : individual rpg-base 64×64 PNGs (loaded via REAL_ASSET_MANIFEST)
 *  - 'dun'  : frame extracted from kenney_dun spritesheet (28 cols × 17 rows)
 *
 * Frame formula for dun: row * 28 + col
 * Only overrides textures that are still canvas placeholders (real user PNGs win).
 * Must be called BEFORE assembleTilesets().
 */
export function applyKenneyTiles(scene: Phaser.Scene): void {
  const DUN_COLS = 28;

  type TileSrc =
    | { kind: 'base'; key: string }
    | { kind: 'dun';  row: number; col: number };

  // Visually verified mappings.
  // fire / wind / lightning have no matching Kenney tiles → kept as coloured canvas placeholders.
  const ZONE_TILES: Record<string, Record<string, TileSrc>> = {
    town: {
      floor:   { kind: 'base', key: 'rpgbase_003' },  // solid green grass
      wall:    { kind: 'base', key: 'rpgbase_060' },  // blue-grey brick wall
      special: { kind: 'base', key: 'rpgbase_050' },  // stone/cream interior floor
      path:    { kind: 'base', key: 'rpgbase_120' },  // light tan dirt path
      deco:    { kind: 'base', key: 'rpgbase_160' },  // small green bush
    },
    earth: {
      floor:   { kind: 'dun',  row: 2, col: 8 },      // grey stone interior
      wall:    { kind: 'dun',  row: 2, col: 6 },      // stone wall top-edge
      special: { kind: 'base', key: 'rpgbase_110' },  // dark grey stone
      path:    { kind: 'base', key: 'rpgbase_120' },  // dirt path
      deco:    { kind: 'dun',  row: 0, col: 1 },      // cave decoration
    },
    water: {
      floor:   { kind: 'base', key: 'rpgbase_013' },  // solid teal water
      wall:    { kind: 'base', key: 'rpgbase_060' },  // stone wall at water edge
      special: { kind: 'dun',  row: 12, col: 3 },     // blue water variant
      path:    { kind: 'base', key: 'rpgbase_050' },  // stone path through water
      deco:    { kind: 'base', key: 'rpgbase_200' },  // full green tree
    },
    ice: {
      floor:   { kind: 'base', key: 'rpgbase_015' },  // white/ice tile
      wall:    { kind: 'dun',  row: 2, col: 7 },      // grey stone wall
      special: { kind: 'dun',  row: 12, col: 4 },     // blue/ice interior
      path:    { kind: 'base', key: 'rpgbase_050' },  // stone path on ice
      deco:    { kind: 'base', key: 'rpgbase_180' },  // tree/bush
    },
    dark: {
      floor:   { kind: 'base', key: 'rpgbase_130' },  // very dark diagonal
      wall:    { kind: 'dun',  row: 1, col: 19 },     // dark charcoal tile
      special: { kind: 'base', key: 'rpgbase_110' },  // dark grey stone
      path:    { kind: 'dun',  row: 2, col: 8 },      // grey stone path
      deco:    { kind: 'dun',  row: 0, col: 2 },      // cave deco item
    },
  };

  const TYPES = ['floor', 'wall', 'special', 'path', 'deco'] as const;

  function copyBaseTexture(srcKey: string, destKey: string): void {
    if (!scene.textures.exists(srcKey)) return;
    const src    = scene.textures.get(srcKey).getSourceImage() as CanvasImageSource;
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, 64, 64);
    if (scene.textures.exists(destKey)) scene.textures.remove(destKey);
    scene.textures.addCanvas(destKey, canvas);
  }

  function extractDunFrame(row: number, col: number, destKey: string): void {
    if (!scene.textures.exists('kenney_dun')) return;
    const texture = scene.textures.get('kenney_dun');
    const frame   = texture.get(row * DUN_COLS + col);
    const canvas  = document.createElement('canvas');
    canvas.width  = 16; canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    if (frame) {
      ctx.drawImage(
        frame.source.image as HTMLImageElement,
        frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
        0, 0, 16, 16
      );
    }
    if (scene.textures.exists(destKey)) scene.textures.remove(destKey);
    scene.textures.addCanvas(destKey, canvas);
  }

  for (const [zone, types] of Object.entries(ZONE_TILES)) {
    for (const type of TYPES) {
      const src     = types[type];
      if (!src) continue;
      const destKey = `tile_${zone}_${type}`;

      // Skip if a real user PNG was loaded (texture source is not a canvas)
      const existing = scene.textures.get(destKey);
      if (existing?.source?.[0] && !existing.source[0].isCanvas) continue;

      if (src.kind === 'base') {
        copyBaseTexture(src.key, destKey);
      } else {
        extractDunFrame(src.row, src.col, destKey);
      }
    }
  }
}

// ── Kenney character extractor ────────────────────────────────────────────────
/**
 * Replaces placeholder player + NPC textures with real sprites from the
 * Kenney roguelike character sheet (kenney_chars, loaded in BootScene.preload).
 * Silently skips if the sheet failed to load.
 *
 * Frame indices: row * 54 + col  (54 columns, 16×16 tiles, 1px spacing)
 * Adjust CHAR_MAP to pick different characters from the sheet.
 */
export function applyKenneyCharacters(scene: Phaser.Scene): void {
  if (!scene.textures.exists('kenney_chars')) return;

  const COLS = 54; // columns in the kenney sheet

  // [destKey, row, col] — change col/row to pick a different character
  const CHAR_MAP: Array<[string, number, number]> = [
    ['npc_aldric',       0, 0],
    ['npc_mira',         1, 0],
    ['npc_theron',       2, 0],
    ['npc_brother_ovan', 3, 0],
    ['npc_liria',        4, 0],
    ['npc_kelvar',       5, 0],
    ['npc_ysolde',       6, 0],
  ];
  // Player row/col — separate because it needs a 12-frame spritesheet canvas
  const PLAYER_ROW = 7;
  const PLAYER_COL = 0;

  function drawFrame(ctx: CanvasRenderingContext2D, row: number, col: number, destX: number, destY: number, size: number) {
    const texture = scene.textures.get('kenney_chars');
    const frame = texture.get(row * COLS + col);
    if (!frame) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      frame.source.image as HTMLImageElement,
      frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
      destX, destY, size, size
    );
  }

  // Replace static NPC textures (32×32)
  for (const [key, row, col] of CHAR_MAP) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    drawFrame(canvas.getContext('2d')!, row, col, 0, 0, 32);
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas);
  }

  // Replace player as 12-frame spritesheet only if no real player.png was loaded
  // (detect canvas placeholder by checking source type)
  const playerTex = scene.textures.get('player');
  const playerIsCanvas = playerTex?.source?.[0]?.isCanvas ?? true;
  if (playerIsCanvas) {
    const sheet = document.createElement('canvas');
    sheet.width = 384; // 12 × 32
    sheet.height = 32;
    const ctx = sheet.getContext('2d')!;
    for (let i = 0; i < 12; i++) {
      drawFrame(ctx, PLAYER_ROW, PLAYER_COL, i * 32, 0, 32);
    }
    if (scene.textures.exists('player')) scene.textures.remove('player');
    scene.textures.addCanvas('player', sheet);
    const tex = scene.textures.get('player');
    for (let i = 0; i < 12; i++) tex.add(i, 0, i * 32, 0, 32, 32);
  }
}
