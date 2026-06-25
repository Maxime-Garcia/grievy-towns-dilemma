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

  const frameW = 32;

  for (let i = 0; i < 12; i++) {
    const x   = i * frameW;
    const isIdle = i < 4;

    // Base fill
    const alpha = isIdle ? 0.75 + i * 0.08 : 1.0;
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = isIdle ? '#55cc55' : '#33aa33';
    ctx.fillRect(x, 0, frameW, frameW);
    ctx.globalAlpha = 1;

    // Border
    ctx.strokeStyle = isIdle ? '#88ee88' : '#55bb55';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, 0.5, frameW - 1, frameW - 1);

    if (!isIdle) {
      // Arrow indicating walk direction (alternates left/right)
      const walkFrame = i - 4; // 0-7
      const dir       = walkFrame % 2 === 0 ? 1 : -1;
      ctx.fillStyle   = '#ffffff';
      ctx.beginPath();
      const cx = x + 16;
      const cy = 16;
      if (dir > 0) {
        ctx.moveTo(cx - 6, cy - 5);
        ctx.lineTo(cx + 6, cy);
        ctx.lineTo(cx - 6, cy + 5);
      } else {
        ctx.moveTo(cx + 6, cy - 5);
        ctx.lineTo(cx - 6, cy);
        ctx.lineTo(cx + 6, cy + 5);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // Idle: small dot to show breathing
      ctx.fillStyle   = '#aaffaa';
      ctx.beginPath();
      ctx.arc(x + 16, 16, 3 + i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
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

// ── Main export ───────────────────────────────────────────────────────────────

export function generatePlaceholderAssets(scene: Phaser.Scene): void {

  // ── Tilesets ──────────────────────────────────────────────────
  const TILESETS: Record<string, number> = {
    tiles_town:      0x664422,
    tiles_fire:      0xff3300,
    tiles_earth:     0x553311,
    tiles_wind:      0xaaccff,
    tiles_water:     0x003377,
    tiles_lightning: 0x440066,
    tiles_ice:       0x88ccff,
    tiles_dark:      0x110011,
  };
  for (const [key, color] of Object.entries(TILESETS)) {
    addCanvas(scene, key, makeTileset(color));
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

  // ── Enemy sprites (32×32) ────────────────────────────────────

  // Fire zone enemies
  const fireEnemies: [string, string][] = [
    ['enemy_ember_wyrm',      'EW'],
    ['enemy_lava_golem',      'LG'],
    ['enemy_cinder_sprite',   'CS'],
    ['enemy_ash_revenant',    'AR'],
    ['enemy_magma_titan',     'MT'],
  ];
  for (const [key, label] of fireEnemies) {
    addCanvas(scene, key, makeSprite(0xcc2200, label, 32, 32));
  }

  // Earth zone enemies
  const earthEnemies: [string, string][] = [
    ['enemy_stone_crawler',     'SC'],
    ['enemy_crystal_golem',     'CG'],
    ['enemy_cave_lurker',       'CL'],
    ['enemy_terravast_serpent', 'TS'],
    ['enemy_ruin_colossus',     'RC'],
  ];
  for (const [key, label] of earthEnemies) {
    addCanvas(scene, key, makeSprite(0x553311, label, 32, 32));
  }

  // Wind zone enemies
  const windEnemies: [string, string][] = [
    ['enemy_gale_harpy',      'GH'],
    ['enemy_storm_eagle',     'SE'],
    ['enemy_wind_wraith',     'WW'],
    ['enemy_cyclone_sprite',  'CY'],
    ['enemy_sky_titan',       'ST'],
  ];
  for (const [key, label] of windEnemies) {
    addCanvas(scene, key, makeSprite(0x7799cc, label, 32, 32));
  }

  // Water zone enemies
  const waterEnemies: [string, string][] = [
    ['enemy_tide_crawler',   'TC'],
    ['enemy_sea_wraith',     'SW'],
    ['enemy_coral_golem',    'CG'],
    ['enemy_depth_serpent',  'DS'],
    ['enemy_drowned_knight', 'DK'],
  ];
  for (const [key, label] of waterEnemies) {
    addCanvas(scene, key, makeSprite(0x003377, label, 32, 32));
  }

  // Lightning zone enemies
  const lightningEnemies: [string, string][] = [
    ['enemy_spark_imp',       'SI'],
    ['enemy_thunder_drake',   'TD'],
    ['enemy_chain_revenant',  'CR'],
    ['enemy_volt_hound',      'VH'],
    ['enemy_storm_herald',    'SH'],
  ];
  for (const [key, label] of lightningEnemies) {
    addCanvas(scene, key, makeSprite(0x440066, label, 32, 32));
  }

  // Ice zone enemies
  const iceEnemies: [string, string][] = [
    ['enemy_frost_wolf',        'FW'],
    ['enemy_ice_golem',         'IG'],
    ['enemy_blizzard_wraith',   'BW'],
    ['enemy_permafrost_titan',  'PT'],
    ['enemy_crystal_dragon',    'CD'],
  ];
  for (const [key, label] of iceEnemies) {
    addCanvas(scene, key, makeSprite(0x88ccff, label, 32, 32));
  }

  // Dark zone enemies
  const darkEnemies: [string, string][] = [
    ['enemy_dark_revenant',    'DR'],
    ['enemy_shadow_construct', 'SC'],
    ['enemy_void_sentinel',    'VS'],
  ];
  for (const [key, label] of darkEnemies) {
    addCanvas(scene, key, makeSprite(0x220033, label, 32, 32));
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

  // ── NPC sprites (32×32) ──────────────────────────────────────
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
  for (const [key, color, label] of NPCS) {
    addCanvas(scene, key, makeSprite(color, label, 32, 32));
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
