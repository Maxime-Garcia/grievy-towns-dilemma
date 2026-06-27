// Zone layout definitions — colored-rectangle map system (no TMX)
// All coordinates in pixels. Physics bounds = mapWidth × mapHeight.

export interface WallRect      { x: number; y: number; w: number; h: number; }
export interface PathRect       { x: number; y: number; w: number; h: number; }
export interface NpcPlacement   { id: string; x: number; y: number; }
export interface TeleportZone   { x: number; y: number; w: number; h: number; targetZone: string; targetX: number; targetY: number; label: string; }
export interface LootableObject { id: string; type: 'chest' | 'plant' | 'mineral' | 'shrine'; x: number; y: number; itemPool: string[]; goldMin?: number; goldMax?: number; }

export interface ZoneLayout {
  mapWidth:    number;
  mapHeight:   number;
  bgColor:     number;
  pathColor:   number;
  wallColor:   number;
  accentColor?: number;
  walls:       WallRect[];
  paths:       PathRect[];
  npcs:        NpcPlacement[];
  teleports:   TeleportZone[];
  lootables:   LootableObject[];
  spawnX:      number;
  spawnY:      number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const W1 = 2400; const H1 = 1800;  // Grievy Town
const W2 = 4000; const H2 = 3200;  // Combat zones

// ── Zone layouts ─────────────────────────────────────────────────────────────
export const ZONE_LAYOUTS: Record<string, ZoneLayout> = {

  // ── GRIEVY TOWN ─────────────────────────────────────────────────────────────
  grievy_town: {
    mapWidth: W1, mapHeight: H1,
    bgColor: 0x3a4a2a, pathColor: 0x8a7a50, wallColor: 0x5a4a30,
    accentColor: 0x6a8a4a,

    paths: [
      // Main E-W road
      { x: 0,   y: 820, w: W1,  h: 140 },
      // Main N-S road
      { x: 1110, y: 0,  w: 140, h: H1  },
      // Secondary NW alley
      { x: 60,  y: 580, w: 180, h: 320 },
      // Secondary NE lane
      { x: 1380, y: 280, w: 120, h: 680 },
      // Secondary SE alley
      { x: 1600, y: 960, w: 120, h: 500 },
      // Secondary SW alley
      { x: 240,  y: 960, w: 120, h: 500 },
    ],

    walls: [
      // Guard posts (gates)
      { x: 960,  y: 40,   w: 300, h: 160 }, // Guard post N
      { x: 960,  y: 1600, w: 300, h: 160 }, // Guard post S
      { x: 40,   y: 780,  w: 160, h: 220 }, // Guard post W
      { x: 2200, y: 780,  w: 160, h: 220 }, // Guard post E
      // Inn (NW)
      { x: 80,   y: 200,  w: 300, h: 220 },
      // Blacksmith (NE)
      { x: 1500, y: 200,  w: 240, h: 200 },
      // Apothecary / herbalist (SW)
      { x: 80,   y: 1180, w: 220, h: 200 },
      // Chapel (SE)
      { x: 1700, y: 1180, w: 240, h: 220 },
      // Aldric's house (center-west)
      { x: 400,  y: 500,  w: 220, h: 180 },
      // General store (center-east)
      { x: 1700, y: 500,  w: 200, h: 180 },
      // Market stalls (around crossroads)
      { x: 700,  y: 600,  w: 200, h: 120 },
      { x: 700,  y: 1060, w: 200, h: 120 },
      { x: 1400, y: 600,  w: 200, h: 120 },
      { x: 1400, y: 1060, w: 200, h: 120 },
      // Fountain (decorative center — not walkable)
      { x: 1090, y: 870,  w: 100, h: 80  },
      // Warehouse (S of blacksmith)
      { x: 1700, y: 700,  w: 160, h: 120 },
      // Stables (W of inn)
      { x: 240,  y: 240,  w: 160, h: 160 },
    ],

    npcs: [
      { id: 'kelvar',       x: 1180, y: 160  }, // Guard north gate
      { id: 'liria',        x: 600,  y: 880  }, // Market road
      { id: 'theron',       x: 1620, y: 340  }, // Blacksmith
      { id: 'mira',         x: 200,  y: 1300 }, // Apothecary
      { id: 'aldric',       x: 520,  y: 600  }, // His house door
      { id: 'brother_ovan', x: 1820, y: 1310 }, // Chapel
      { id: 'ysolde',       x: 200,  y: 330  }, // Inn
    ],

    teleports: [
      { x: 1060, y: 0,    w: 200, h: 40, targetZone: 'terravast',    targetX: 1200, targetY: H2-80,  label: '↑ Terravast'    },
      { x: 1060, y: H1-40,w: 200, h: 40, targetZone: 'zephyr_peaks', targetX: 1200, targetY: 80,     label: '↓ Zephyr Peaks' },
      { x: W1-40,y: 240,  w: 40,  h: 400,targetZone: 'ignis_reach',  targetX: 72,   targetY: 600,    label: '→ Ignis Reach'  },
      { x: W1-40,y: 820,  w: 40,  h: 360,targetZone: 'volterra',     targetX: 72,   targetY: 1600,   label: '→ Volterra'     },
      { x: 0,    y: 240,  w: 40,  h: 400,targetZone: 'abyssmar',     targetX: W2-72,targetY: 600,    label: '← Abyssmar'     },
      { x: 0,    y: 820,  w: 40,  h: 360,targetZone: 'glaciem',      targetX: W2-72,targetY: 1600,   label: '← Glaciem'      },
    ],

    lootables: [
      { id: 'gt_herb_1',    type: 'plant',   x: 700,  y: 480,  itemPool: ['herb', 'minor_mana_potion'],    goldMin: 2,  goldMax: 5  },
      { id: 'gt_herb_2',    type: 'plant',   x: 1200, y: 540,  itemPool: ['herb', 'wild_root'],            goldMin: 0,  goldMax: 3  },
      { id: 'gt_mineral_1', type: 'mineral', x: 1600, y: 680,  itemPool: ['iron_ore', 'coal'],             goldMin: 5,  goldMax: 10 },
      { id: 'gt_chest_1',   type: 'chest',   x: 360,  y: 380,  itemPool: ['minor_health_potion', 'rope'],  goldMin: 20, goldMax: 40 },
      { id: 'gt_shrine_1',  type: 'shrine',  x: 1180, y: 980,  itemPool: [],                               goldMin: 10, goldMax: 25 },
    ],

    spawnX: 1180, spawnY: 920,
  },

  // ── IGNIS REACH ─────────────────────────────────────────────────────────────
  ignis_reach: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x1a0800, pathColor: 0x6a3010, wallColor: 0x3a1808,
    accentColor: 0xdd4400,

    paths: [
      // Main E-W corridor (entry level)
      { x: 0,    y: 480,  w: W2,   h: 240 },
      // North branch (lava caves)
      { x: 1400, y: 200,  w: 200,  h: 480 },
      { x: 1200, y: 200,  w: 600,  h: 200 },
      // South branch (ash plains)
      { x: 1600, y: 720,  w: 200,  h: 600 },
      { x: 1300, y: 1200, w: 800,  h: 200 },
      // East approach to boss
      { x: 3000, y: 200,  w: 1000, h: 1000 },
      // Boss arena clearing
      { x: 3200, y: 1200, w: 700,  h: 1000 },
      // Secondary path between north and main
      { x: 2200, y: 300,  w: 200,  h: 400 },
    ],

    walls: [
      // NW volcanic ridge
      { x: 80,   y: 80,   w: 1200, h: 300 },
      { x: 80,   y: 800,  w: 600,  h: 400 },
      // Central lava lake (impassable)
      { x: 700,  y: 780,  w: 600,  h: 300 },
      // NE thermal vents
      { x: 1700, y: 80,   w: 300,  h: 120 },
      { x: 2100, y: 80,   w: 300,  h: 200 },
      { x: 2600, y: 80,   w: 400,  h: 120 },
      // East ridge
      { x: 1300, y: 1500, w: 400,  h: 300 },
      { x: 2000, y: 1500, w: 300,  h: 400 },
      { x: 2500, y: 1700, w: 500,  h: 200 },
      // Boss arena walls
      { x: 3150, y: 1150, w: 800,  h: 80  },
      { x: 3150, y: 2250, w: 800,  h: 80  },
      { x: 3150, y: 1150, w: 80,   h: 1100},
      { x: 3870, y: 1150, w: 80,   h: 1100},
      // South ash dunes
      { x: 80,   y: 1400, w: 500,  h: 600 },
      { x: 700,  y: 1800, w: 700,  h: 400 },
      { x: 2000, y: 2200, w: 1600, h: 600 },
      // Western pillars
      { x: 80,   y: 1300, w: 80,   h: 800 },
    ],

    npcs: [],

    teleports: [
      { x: 0,    y: 380,  w: 40,  h: 440, targetZone: 'grievy_town', targetX: W1-80, targetY: 440,  label: '← Grievy Town' },
    ],

    lootables: [
      { id: 'ir_mineral_1', type: 'mineral', x: 1500, y: 300,  itemPool: ['ember_core', 'obsidian_shard', 'iron_ore'],  goldMin: 15, goldMax: 30 },
      { id: 'ir_mineral_2', type: 'mineral', x: 2300, y: 350,  itemPool: ['fire_crystal', 'obsidian_shard'],            goldMin: 20, goldMax: 40 },
      { id: 'ir_chest_1',   type: 'chest',   x: 1800, y: 1350, itemPool: ['fire_staff', 'ember_core', 'minor_health_potion'], goldMin: 40, goldMax: 80 },
      { id: 'ir_plant_1',   type: 'plant',   x: 900,  y: 580,  itemPool: ['ash_herb', 'fire_essence'],                  goldMin: 5,  goldMax: 15 },
      { id: 'ir_chest_2',   type: 'chest',   x: 3400, y: 1800, itemPool: ['volcanic_armor', 'fire_crystal'],            goldMin: 60, goldMax: 120},
    ],

    spawnX: 120, spawnY: 600,
  },

  // ── TERRAVAST ────────────────────────────────────────────────────────────────
  terravast: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x0c0a04, pathColor: 0x4a3a18, wallColor: 0x2a200c,
    accentColor: 0x6a5a30,

    paths: [
      // Main N-S artery (entry at north)
      { x: 1100, y: 0,    w: 200,  h: H2   },
      // East branch (crystal caves)
      { x: 1300, y: 1200, w: 1200, h: 200  },
      { x: 2300, y: 800,  w: 200,  h: 600  },
      // West branch (ancient ruins)
      { x: 400,  y: 1000, w: 900,  h: 200  },
      { x: 400,  y: 800,  w: 200,  h: 600  },
      // Deep south (boss area)
      { x: 800,  y: 2400, w: 1800, h: 200  },
      { x: 1400, y: 2600, w: 600,  h: 600  },
      // Mid connecting corridor
      { x: 600,  y: 1800, w: 1800, h: 200  },
    ],

    walls: [
      // Western cliff face
      { x: 80,   y: 80,   w: 300,  h: 1600 },
      // Crystal formations (blocking off-path)
      { x: 500,  y: 80,   w: 500,  h: 400  },
      { x: 1400, y: 80,   w: 400,  h: 600  },
      { x: 2000, y: 80,   w: 600,  h: 800  },
      // Eastern cliff
      { x: 3600, y: 80,   w: 300,  h: 1800 },
      // Central deep ravine
      { x: 500,  y: 500,  w: 500,  h: 400  },
      { x: 1600, y: 700,  w: 600,  h: 400  },
      // Ruin structures
      { x: 200,  y: 1300, w: 200,  h: 300  },
      { x: 200,  y: 1700, w: 600,  h: 200  },
      // Crystal cluster E
      { x: 2600, y: 1000, w: 200,  h: 800  },
      { x: 3000, y: 1400, w: 400,  h: 400  },
      // South barrier (pre-boss)
      { x: 80,   y: 2200, w: 700,  h: 600  },
      { x: 2600, y: 2200, w: 1200, h: 600  },
      // Boss arena
      { x: 1100, y: 2850, w: 80,   h: 300  },
      { x: 2020, y: 2850, w: 80,   h: 300  },
      { x: 1100, y: 2850, w: 1000, h: 80   },
      { x: 1100, y: 3070, w: 1000, h: 80   },
      // Deep south walls
      { x: 80,   y: 2900, w: 900,  h: 220  },
      { x: 2300, y: 2900, w: 1600, h: 220  },
    ],

    npcs: [],

    teleports: [
      { x: 1060, y: 0,    w: 200, h: 40, targetZone: 'grievy_town', targetX: 1180, targetY: 80, label: '↑ Grievy Town' },
    ],

    lootables: [
      { id: 'tv_mineral_1', type: 'mineral', x: 450,  y: 1100, itemPool: ['earth_crystal', 'iron_ore', 'deepstone'],  goldMin: 20, goldMax: 40 },
      { id: 'tv_mineral_2', type: 'mineral', x: 2400, y: 1200, itemPool: ['deepstone', 'mana_crystal'],                goldMin: 25, goldMax: 50 },
      { id: 'tv_chest_1',   type: 'chest',   x: 300,  y: 1000, itemPool: ['earth_tome', 'deepstone', 'iron_shield'],   goldMin: 50, goldMax: 100},
      { id: 'tv_chest_2',   type: 'chest',   x: 1700, y: 2600, itemPool: ['ancient_rune', 'mana_crystal'],             goldMin: 70, goldMax: 140},
      { id: 'tv_plant_1',   type: 'plant',   x: 1300, y: 1300, itemPool: ['cave_mushroom', 'herb'],                    goldMin: 5,  goldMax: 10 },
      { id: 'tv_shrine_1',  type: 'shrine',  x: 1500, y: 2200, itemPool: [],                                           goldMin: 30, goldMax: 60 },
    ],

    spawnX: 1200, spawnY: 120,
  },

  // ── ZEPHYR PEAKS ─────────────────────────────────────────────────────────────
  zephyr_peaks: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x060818, pathColor: 0x4060a0, wallColor: 0x182848,
    accentColor: 0x8899dd,

    paths: [
      // Entry from south
      { x: 1100, y: H2-300, w: 200, h: 300 },
      // Main ascent path (winding up)
      { x: 900,  y: 2200,  w: 600,  h: 200 },
      { x: 900,  y: 1600,  w: 200,  h: 800 },
      { x: 600,  y: 1400,  w: 600,  h: 200 },
      { x: 600,  y: 800,   w: 200,  h: 800 },
      { x: 600,  y: 600,   w: 1000, h: 200 },
      { x: 1400, y: 400,   w: 200,  h: 600 },
      { x: 1400, y: 400,   w: 1000, h: 200 },
      // Summit plateau
      { x: 1200, y: 80,    w: 1600, h: 400 },
      // East route
      { x: 2800, y: 400,   w: 200,  h: 1000},
      { x: 2600, y: 1200,  w: 600,  h: 200 },
    ],

    walls: [
      // South face cliffs
      { x: 80,   y: H2-300, w: 900, h: 300 },
      { x: 1400, y: H2-300, w: 2420,h: 300 },
      // Cliff steps
      { x: 80,   y: 2000,  w: 700,  h: 200 },
      { x: 1200, y: 2200,  w: 1200, h: 200 },
      { x: 2600, y: 2000,  w: 1300, h: 200 },
      // Rock formations mid
      { x: 80,   y: 1200,  w: 400,  h: 600 },
      { x: 900,  y: 1200,  w: 300,  h: 200 },
      { x: 1400, y: 1400,  w: 1200, h: 200 },
      { x: 2800, y: 1500,  w: 1100, h: 400 },
      // Summit walls
      { x: 80,   y: 200,   w: 1000, h: 400 },
      { x: 2900, y: 200,   w: 1020, h: 400 },
      // Boss perch
      { x: 1600, y: 80,    w: 80,   h: 500 },
      { x: 1600, y: 80,    w: 500,  h: 80  },
      { x: 2020, y: 80,    w: 80,   h: 500 },
      { x: 1600, y: 500,   w: 500,  h: 80  },
    ],

    npcs: [],

    teleports: [
      { x: 1060, y: H2-40, w: 200, h: 40, targetZone: 'grievy_town', targetX: 1180, targetY: H1-80, label: '↓ Grievy Town' },
    ],

    lootables: [
      { id: 'zp_mineral_1', type: 'mineral', x: 700,  y: 1500, itemPool: ['wind_crystal', 'skystone'],             goldMin: 20, goldMax: 40 },
      { id: 'zp_plant_1',   type: 'plant',   x: 1100, y: 1800, itemPool: ['wind_flower', 'cloud_herb'],            goldMin: 8,  goldMax: 16 },
      { id: 'zp_chest_1',   type: 'chest',   x: 2700, y: 1350, itemPool: ['wind_bow', 'skystone', 'wind_crystal'], goldMin: 50, goldMax: 100},
      { id: 'zp_chest_2',   type: 'chest',   x: 1800, y: 200,  itemPool: ['phoenix_feather', 'wind_boots'],        goldMin: 80, goldMax: 160},
      { id: 'zp_shrine_1',  type: 'shrine',  x: 1200, y: 1000, itemPool: [],                                       goldMin: 40, goldMax: 80 },
    ],

    spawnX: 1200, spawnY: H2-160,
  },

  // ── ABYSSMAR ─────────────────────────────────────────────────────────────────
  abyssmar: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x020810, pathColor: 0x0a1835, wallColor: 0x061022,
    accentColor: 0x2a6a8a,

    paths: [
      // Entry from east
      { x: W2-300, y: 480,  w: 300,  h: 240 },
      // Main west-going corridor
      { x: 1200,   y: 480,  w: W2-1200, h: 240 },
      { x: 1000,   y: 380,  w: 400,  h: 440 },
      // North branch (sunken ruins)
      { x: 800,    y: 200,  w: 400,  h: 400 },
      { x: 200,    y: 200,  w: 800,  h: 200 },
      // South branch (kelp forest)
      { x: 900,    y: 800,  w: 400,  h: 600 },
      { x: 400,    y: 1200, w: 900,  h: 200 },
      // Deep west (boss trench)
      { x: 80,     y: 300,  w: 1000, h: 1000},
      { x: 80,     y: 1800, w: 800,  h: 800 },
      // Mid corridor
      { x: 600,    y: 1600, w: 2000, h: 200 },
    ],

    walls: [
      // Eastern coral shelf
      { x: W2-300, y: 80,  w: 300,  h: 300 },
      { x: W2-300, y: 820, w: 300,  h: 2300},
      // Coral reef clusters
      { x: 1600,   y: 80,  w: 400,  h: 300 },
      { x: 2200,   y: 80,  w: 600,  h: 400 },
      { x: 1800,   y: 800, w: 400,  h: 600 },
      { x: 2400,   y: 900, w: 800,  h: 400 },
      { x: 3000,   y: 1400,w: 800,  h: 400 },
      // South reef wall
      { x: 80,     y: 1500,w: 400,  h: 200 },
      { x: 1500,   y: 1500,w: 1000, h: 200 },
      { x: 2700,   y: 1500,w: 1200, h: 200 },
      // Abyss trench walls
      { x: 80,     y: 1300,w: 800,  h: 200 },
      // Ruins (north)
      { x: 200,    y: 80,  w: 500,  h: 120 },
      { x: 200,    y: 80,  w: 120,  h: 400 },
      // Boss trench barriers
      { x: 80,     y: 2700,w: 1000, h: 80  },
      { x: 1180,   y: 2700,w: 80,   h: 420 },
      { x: 80,     y: 3040,w: 1000, h: 80  },
    ],

    npcs: [],

    teleports: [
      { x: W2-40, y: 380, w: 40, h: 440, targetZone: 'grievy_town', targetX: 80, targetY: 440, label: '→ Grievy Town' },
    ],

    lootables: [
      { id: 'ab_plant_1',   type: 'plant',   x: 1000, y: 300,  itemPool: ['sea_kelp', 'pearl'],                      goldMin: 10, goldMax: 20 },
      { id: 'ab_chest_1',   type: 'chest',   x: 400,  y: 1350, itemPool: ['water_staff', 'pearl', 'sea_kelp'],       goldMin: 50, goldMax: 100},
      { id: 'ab_mineral_1', type: 'mineral', x: 700,  y: 700,  itemPool: ['deep_coral', 'thalymor_shard'],           goldMin: 25, goldMax: 50 },
      { id: 'ab_chest_2',   type: 'chest',   x: 300,  y: 2000, itemPool: ['leviathan_scale', 'thalymor_shard'],      goldMin: 70, goldMax: 140},
      { id: 'ab_shrine_1',  type: 'shrine',  x: 600,  y: 900,  itemPool: [],                                         goldMin: 40, goldMax: 80 },
    ],

    spawnX: W2-160, spawnY: 600,
  },

  // ── VOLTERRA ─────────────────────────────────────────────────────────────────
  volterra: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x06060e, pathColor: 0x141420, wallColor: 0x202035,
    accentColor: 0xffee00,

    paths: [
      // Entry from east (lower)
      { x: W2-300, y: 1480, w: 300,  h: 240 },
      // Main artery (zigzag)
      { x: 2000,   y: 1480, w: W2-2300, h: 240 },
      { x: 1800,   y: 1200, w: 400,  h: 520 },
      { x: 1000,   y: 1000, w: 1000, h: 200 },
      { x: 800,    y: 600,  w: 400,  h: 600 },
      { x: 200,    y: 400,  w: 1000, h: 200 },
      // North circuits
      { x: 2400,   y: 400,  w: 800,  h: 200 },
      { x: 3000,   y: 200,  w: 200,  h: 600 },
      // South generator area
      { x: 400,    y: 1800, w: 1200, h: 200 },
      { x: 400,    y: 2000, w: 200,  h: 800 },
      // Boss chamber
      { x: 200,    y: 200,  w: 600,  h: 600 },
    ],

    walls: [
      // Eastern industrial wall
      { x: W2-300, y: 80,   w: 300,  h: 1300},
      { x: W2-300, y: 1820, w: 300,  h: 1300},
      // Power conduits (thick walls)
      { x: 2200,   y: 80,   w: 80,   h: 1000},
      { x: 2200,   y: 1200, w: 80,   h: 1000},
      { x: 1400,   y: 80,   w: 80,   h: 800 },
      { x: 1400,   y: 1300, w: 80,   h: 800 },
      // Capacitor blocks
      { x: 2600,   y: 600,  w: 300,  h: 300 },
      { x: 3300,   y: 300,  w: 500,  h: 300 },
      { x: 2800,   y: 1400, w: 400,  h: 400 },
      // Generator cores
      { x: 700,    y: 1800, w: 400,  h: 200 },
      { x: 1400,   y: 2000, w: 400,  h: 400 },
      { x: 700,    y: 2600, w: 1400, h: 400 },
      { x: 2400,   y: 2400, w: 1400, h: 600 },
      // Boss chamber walls
      { x: 80,     y: 80,   w: 80,   h: 920 },
      { x: 80,     y: 80,   w: 920,  h: 80  },
      { x: 920,    y: 80,   w: 80,   h: 920 },
      { x: 80,     y: 920,  w: 920,  h: 80  },
    ],

    npcs: [],

    teleports: [
      { x: W2-40, y: 1380, w: 40, h: 440, targetZone: 'grievy_town', targetX: 80, targetY: 920, label: '→ Grievy Town' },
    ],

    lootables: [
      { id: 'vt_mineral_1', type: 'mineral', x: 2500, y: 700,  itemPool: ['volt_crystal', 'copper_coil'],          goldMin: 20, goldMax: 40 },
      { id: 'vt_mineral_2', type: 'mineral', x: 1200, y: 1100, itemPool: ['volt_crystal', 'refined_copper'],       goldMin: 25, goldMax: 50 },
      { id: 'vt_chest_1',   type: 'chest',   x: 500,  y: 2100, itemPool: ['thunder_staff', 'volt_crystal'],        goldMin: 50, goldMax: 100},
      { id: 'vt_chest_2',   type: 'chest',   x: 3200, y: 400,  itemPool: ['lightning_armor', 'copper_coil'],       goldMin: 60, goldMax: 120},
      { id: 'vt_shrine_1',  type: 'shrine',  x: 500,  y: 500,  itemPool: [],                                       goldMin: 40, goldMax: 80 },
    ],

    spawnX: W2-160, spawnY: 1600,
  },

  // ── GLACIEM ───────────────────────────────────────────────────────────────────
  glaciem: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x7a9ab2, pathColor: 0xa0c0d8, wallColor: 0x5a7a90,
    accentColor: 0xeeeeff,

    paths: [
      // Entry from east (lower)
      { x: W2-300, y: 1480, w: 300,  h: 240 },
      // Main path westward
      { x: 1200,   y: 1480, w: W2-1500, h: 240 },
      // North ice gallery
      { x: 1200,   y: 800,  w: 200,  h: 880 },
      { x: 400,    y: 600,  w: 1000, h: 200 },
      { x: 400,    y: 200,  w: 200,  h: 600 },
      // South glacier
      { x: 400,    y: 1800, w: 1200, h: 200 },
      { x: 400,    y: 2000, w: 200,  h: 800 },
      // Crystal archive (boss area)
      { x: 80,     y: 400,  w: 600,  h: 1600},
      // Eastern corridors
      { x: 1600,   y: 200,  w: 200,  h: 1200},
      { x: 2400,   y: 400,  w: 1400, h: 200 },
    ],

    walls: [
      // Eastern ice shelf
      { x: W2-300, y: 80,   w: 300,  h: 1300},
      { x: W2-300, y: 1820, w: 300,  h: 1300},
      // Ice formations
      { x: 1500,   y: 80,   w: 200,  h: 600 },
      { x: 1900,   y: 80,   w: 300,  h: 300 },
      { x: 2400,   y: 80,   w: 200,  h: 300 },
      { x: 2800,   y: 80,   w: 400,  h: 600 },
      { x: 3400,   y: 80,   w: 500,  h: 400 },
      // Southern glacier ridges
      { x: 1700,   y: 1800, w: 400,  h: 300 },
      { x: 2300,   y: 2000, w: 600,  h: 300 },
      { x: 3000,   y: 1800, w: 800,  h: 600 },
      { x: 700,    y: 2400, w: 500,  h: 600 },
      { x: 1400,   y: 2600, w: 1200, h: 600 },
      // Archive walls (boss area)
      { x: 80,     y: 80,   w: 80,   h: 800 },
      { x: 80,     y: 2100, w: 80,   h: 1000},
      { x: 80,     y: 80,   w: 600,  h: 80  },
      { x: 80,     y: 2020, w: 600,  h: 80  },
      // Mid dividers
      { x: 1000,   y: 800,  w: 80,   h: 600 },
      { x: 1800,   y: 1200, w: 200,  h: 200 },
    ],

    npcs: [
      { id: 'elara', x: 400, y: 1200 },
    ],

    teleports: [
      { x: W2-40, y: 1380, w: 40, h: 440, targetZone: 'grievy_town', targetX: 80, targetY: 920, label: '→ Grievy Town' },
    ],

    lootables: [
      { id: 'gl_mineral_1', type: 'mineral', x: 600,  y: 500,  itemPool: ['glaciem_ice_shard', 'ancient_frost_rune'], goldMin: 25, goldMax: 50 },
      { id: 'gl_mineral_2', type: 'mineral', x: 2600, y: 500,  itemPool: ['glaciem_ice_shard', 'frozen_essence'],     goldMin: 20, goldMax: 40 },
      { id: 'gl_chest_1',   type: 'chest',   x: 400,  y: 1800, itemPool: ['frost_staff', 'frozen_essence'],           goldMin: 60, goldMax: 120},
      { id: 'gl_chest_2',   type: 'chest',   x: 300,  y: 700,  itemPool: ['crystal_armor', 'ancient_frost_rune'],     goldMin: 70, goldMax: 140},
      { id: 'gl_shrine_1',  type: 'shrine',  x: 500,  y: 1600, itemPool: [],                                          goldMin: 50, goldMax: 100},
    ],

    spawnX: W2-160, spawnY: 1600,
  },

  // ── MALACHAR'S SPIRE ─────────────────────────────────────────────────────────
  malachars_spire: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x020204, pathColor: 0x070710, wallColor: 0x100820,
    accentColor: 0x4a0a5a,

    paths: [
      // Entry from south
      { x: 1100,   y: H2-300, w: 200,  h: 300  },
      // Ascent spiral (counter-clockwise)
      { x: 900,    y: 2600,   w: 600,  h: 200  },
      { x: 700,    y: 1800,   w: 200,  h: 1000 },
      { x: 700,    y: 1600,   w: 800,  h: 200  },
      { x: 1300,   y: 1000,   w: 200,  h: 800  },
      { x: 800,    y: 800,    w: 700,  h: 200  },
      { x: 800,    y: 400,    w: 200,  h: 600  },
      { x: 800,    y: 400,    w: 1200, h: 200  },
      { x: 1800,   y: 400,    w: 200,  h: 800  },
      { x: 1400,   y: 1000,   w: 600,  h: 200  },
      // Inner sanctum approach
      { x: 1400,   y: 200,    w: 1000, h: 400  },
      { x: 1000,   y: 80,     w: 1800, h: 400  },
    ],

    walls: [
      // Outer spire walls (ring)
      { x: 80,     y: 80,     w: W2-160, h: 120  },
      { x: 80,     y: H2-200, w: W2-160, h: 120  },
      { x: 80,     y: 80,     w: 120,    h: H2-160},
      { x: W2-200, y: 80,     w: 120,    h: H2-160},
      // Spiral barriers
      { x: 500,    y: 2800,   w: 2800,   h: 120  },
      { x: 500,    y: 2800,   w: 120,    h: 800  },
      { x: 500,    y: 3480,   w: 2800,   h: 120  },
      { x: 1000,   y: 2000,   w: 2700,   h: 120  },
      { x: 3580,   y: 2000,   w: 120,    h: 1000 },
      { x: 1000,   y: 1200,   w: 120,    h: 1000 },
      { x: 1000,   y: 1200,   w: 2000,   h: 120  },
      { x: 2880,   y: 600,    w: 120,    h: 800  },
      { x: 1800,   y: 600,    w: 1200,   h: 120  },
      // Boss arena (inner sanctum)
      { x: 1200,   y: 80,     w: 80,     h: 800  },
      { x: 2680,   y: 80,     w: 80,     h: 800  },
      { x: 1200,   y: 800,    w: 1560,   h: 80   },
    ],

    npcs: [],

    teleports: [
      { x: 1060, y: H2-40, w: 200, h: 40, targetZone: 'grievy_town', targetX: 1180, targetY: H1-80, label: '↓ Retreat' },
    ],

    lootables: [
      { id: 'ms_chest_1',   type: 'chest',   x: 800,  y: 2700, itemPool: ['dark_tome', 'void_shard'],             goldMin: 80,  goldMax: 160},
      { id: 'ms_chest_2',   type: 'chest',   x: 3400, y: 2100, itemPool: ['malachar_notes', 'void_shard'],        goldMin: 100, goldMax: 200},
      { id: 'ms_shrine_1',  type: 'shrine',  x: 1100, y: 1800, itemPool: [],                                      goldMin: 60,  goldMax: 120},
      { id: 'ms_mineral_1', type: 'mineral', x: 2800, y: 700,  itemPool: ['void_shard', 'chaos_crystal'],         goldMin: 60,  goldMax: 120},
    ],

    spawnX: 1200, spawnY: H2-160,
  },
};

// ── Fallback for sub-zones (ashford → ignis_reach, etc.) ─────────────────────
const PARENT_ZONE: Record<string, string> = {
  ashford: 'ignis_reach',      pyrath_crossing: 'ignis_reach',
  deepdelve: 'terravast',      stone_watch: 'terravast',
  windherald: 'zephyr_peaks',  cloudspire: 'zephyr_peaks',
  saltmourn: 'abyssmar',       the_wreck: 'abyssmar',
  the_circuit: 'volterra',     sparks_rest: 'volterra',
  frostveil: 'glaciem',        last_hearth: 'glaciem',
};

export function getZoneLayout(zoneId: string): ZoneLayout {
  if (ZONE_LAYOUTS[zoneId]) return ZONE_LAYOUTS[zoneId];
  const parent = PARENT_ZONE[zoneId];
  if (parent && ZONE_LAYOUTS[parent]) {
    return {
      ...ZONE_LAYOUTS[parent],
      npcs: [],
      lootables: [],
      teleports: [
        { x: 780, y: 0, w: 200, h: 40, targetZone: 'grievy_town', targetX: 1180, targetY: 80, label: '↑ Grievy Town' },
      ],
    };
  }
  // Generic fallback
  return {
    mapWidth: 2400, mapHeight: 1800,
    bgColor: 0x1a1a2a, pathColor: 0x333355, wallColor: 0x2a2a44,
    walls: [], paths: [], npcs: [], teleports: [
      { x: 780, y: 0, w: 200, h: 40, targetZone: 'grievy_town', targetX: 1180, targetY: 80, label: '↑ Grievy Town' },
    ],
    lootables: [], spawnX: 1200, spawnY: 900,
  };
}
