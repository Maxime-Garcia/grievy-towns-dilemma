// Zone layout definitions — colored-rectangle map system (no TMX)
// All coordinates in pixels. Physics bounds = mapWidth × mapHeight.

export interface WallRect      { x: number; y: number; w: number; h: number; }
export interface PathRect       { x: number; y: number; w: number; h: number; }
export interface NpcPlacement   { id: string; x: number; y: number; }
export interface TeleportZone   { x: number; y: number; w: number; h: number; targetZone: string; targetX: number; targetY: number; label: string; }
export interface LootableObject { id: string; type: 'chest' | 'plant' | 'mineral' | 'shrine'; x: number; y: number; itemPool: string[]; goldMin?: number; goldMax?: number; }
export interface WaterArea      { x: number; y: number; w: number; h: number; }

export interface ZoneLayout {
  mapWidth:    number;
  mapHeight:   number;
  bgColor:     number;
  pathColor:   number;
  wallColor:   number;
  accentColor?: number;
  waterAreas?: WaterArea[];
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

    waterAreas: [
      // Petit ruisseau traversant le coin sud-ouest de la ville
      { x: 140, y: 1080, w: 60, h: 280 },
      { x: 140, y: 1360, w: 200, h: 60 },
    ],

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

    // Teleports now lead to route zones, not directly to combat zones
    teleports: [
      { x: 1060, y: 0,    w: 200, h: 40, targetZone: 'route_stone_path',    targetX: 800,      targetY: 1400,   label: '↑ Terravast'    },
      { x: 1060, y: H1-40,w: 200, h: 40, targetZone: 'route_zephyr_trail',  targetX: 800,      targetY: 200,    label: '↓ Zephyr Peaks' },
      { x: W1-40,y: 240,  w: 40,  h: 400,targetZone: 'route_ember_road',    targetX: 120,      targetY: 640,    label: '→ Ignis Reach'  },
      { x: W1-40,y: 820,  w: 40,  h: 360,targetZone: 'route_thunder_pass',  targetX: 120,      targetY: 640,    label: '→ Volterra'     },
      { x: 0,    y: 240,  w: 40,  h: 400,targetZone: 'route_coastal_road',  targetX: 1560-72,  targetY: 640,    label: '← Abyssmar'     },
      { x: 0,    y: 820,  w: 40,  h: 360,targetZone: 'route_frost_way',     targetX: 1560-72,  targetY: 640,    label: '← Glaciem'      },
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

    // Rivière de lave traversant le sud de la zone — bloquante, rendue en rouge-orange
    waterAreas: [
      { x: 700,  y: 780,  w: 600,  h: 300  }, // Lac de lave central (réutilise la wall existante comme référence visuelle)
      { x: 1300, y: 1080, w: 200,  h: 220  }, // Coulée sud-ouest
      { x: 800,  y: 1200, w: 500,  h: 160  }, // Bras de la coulée
    ],

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
      // Central lava lake (impassable — visual handled by waterAreas above)
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
      // Retour vers la route des Braises (qui mène à Grievy Town)
      { x: 0,    y: 380,  w: 40,  h: 440, targetZone: 'route_ember_road',   targetX: 1560-72, targetY: 640,  label: '← Route des Braises' },
      // Connexion vers le Pont de Lave (qui mène à Volterra)
      { x: 3960, y: 380,  w: 40,  h: 440, targetZone: 'route_lava_bridge',  targetX: 120,     targetY: 640,  label: '→ Pont de Lave'      },
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

    // Lac souterrain dans les profondeurs de la zone
    waterAreas: [
      { x: 600,  y: 1800, w: 400,  h: 300  }, // Lac souterrain principal
      { x: 1000, y: 1900, w: 200,  h: 200  }, // Bras du lac
      { x: 300,  y: 2100, w: 300,  h: 200  }, // Extension sud-ouest
    ],

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
      // Retour vers le Chemin de Pierre (qui mène à Grievy Town)
      { x: 1060, y: H2-40, w: 200, h: 40, targetZone: 'route_stone_path',        targetX: 800, targetY: 200,  label: '↓ Chemin de Pierre'    },
      // Connexion vers la Rivière Souterraine (qui mène à Abyssmar)
      { x: 40,   y: 1400, w: 40,  h: 200, targetZone: 'route_underground_river', targetX: 1200, targetY: 720, label: '← Rivière Souterraine' },
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

    // Cascade et lac de montagne au sommet
    waterAreas: [
      { x: 2200, y: 80,   w: 120,  h: 320  }, // Cascade est
      { x: 2200, y: 400,  w: 300,  h: 200  }, // Bassin de cascade
      { x: 80,   y: 600,  w: 200,  h: 200  }, // Petit lac d'altitude ouest
    ],

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
      // Retour vers le Sentier de Zephyr (qui mène à Grievy Town)
      { x: 1060,   y: 40,    w: 200, h: 40,  targetZone: 'route_zephyr_trail',  targetX: 800,      targetY: 1400, label: '↑ Sentier de Zephyr'   },
      // Connexion vers la Crête de Tempête (qui mène à Volterra)
      { x: W2-40,  y: 2600,  w: 40,  h: 400, targetZone: 'route_storm_crossing', targetX: 800,     targetY: 200,  label: '→ Crête de Tempête'    },
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

    // Canaux marins — la zone est déjà largement aquatique
    waterAreas: [
      { x: 80,   y: 1500, w: 1300, h: 200  }, // Canal principal (correspond à la path south reef)
      { x: 1380, y: 1600, w: 200,  h: 600  }, // Canal descendant vers le trench
      { x: 800,  y: 200,  w: 400,  h: 160  }, // Bassin des ruines du nord
      { x: 80,   y: 2700, w: 1100, h: 340  }, // Trench abyssal (boss area — déjà géré par walls)
    ],

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
      // Retour vers la Route Côtière (qui mène à Grievy Town)
      { x: W2-40, y: 380,        w: 40,  h: 440, targetZone: 'route_coastal_road',     targetX: 120,     targetY: 640,  label: '→ Route Côtière'         },
      // Connexion vers la Rivière Souterraine (qui mène à Terravast)
      { x: 1000,  y: H2-40,      w: 200, h: 40,  targetZone: 'route_underground_river', targetX: 200,    targetY: 720,  label: '↓ Rivière Souterraine'   },
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

    // Bassins électrifiés — eau conductrice bloquant le passage
    waterAreas: [
      { x: 1500, y: 1200, w: 300,  h: 200  }, // Bassin électrifié central
      { x: 500,  y: 2400, w: 200,  h: 400  }, // Réservoir de refroidissement sud
      { x: 2100, y: 2200, w: 300,  h: 200  }, // Bassin de condensation est
    ],

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
      // Retour vers le Col du Tonnerre (qui mène à Grievy Town)
      { x: 40,    y: 1380, w: 40,  h: 440, targetZone: 'route_thunder_pass',   targetX: 1440,     targetY: 640, label: '← Col du Tonnerre'      },
      // Connexion vers le Pont de Lave (qui mène à Ignis Reach)
      { x: 40,    y: 80,   w: 40,  h: 300, targetZone: 'route_lava_bridge',    targetX: 1560-72,  targetY: 640, label: '← Pont de Lave'          },
      // Connexion vers la Crête de Tempête (qui mène à Zephyr Peaks)
      { x: 2200,  y: 40,   w: 400, h: 40,  targetZone: 'route_storm_crossing', targetX: 800,      targetY: 1400, label: '↑ Crête de Tempête'     },
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

    // Lac gelé et fissures de glacier
    waterAreas: [
      { x: 700,  y: 2400, w: 500,  h: 300  }, // Lac gelé au sud (dessous du glacier)
      { x: 1600, y: 200,  w: 200,  h: 600  }, // Fissure de glace est (mince couloir d'eau)
      { x: 2500, y: 400,  w: 800,  h: 120  }, // Rivière sous-glaciaire nord
    ],

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
      // Retour vers la Voie Glaciale (qui mène à Grievy Town)
      { x: W2-40, y: 1380, w: 40, h: 440, targetZone: 'route_frost_way',     targetX: 120,     targetY: 640, label: '→ Voie Glaciale'      },
      // Connexion vers la Descente des Ombres (qui mène à Malachar's Spire)
      { x: 0,     y: 320,  w: 40, h: 440, targetZone: 'route_dark_descent',  targetX: 1560-72, targetY: 640, label: '← Descente des Ombres' },
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
      // Retour vers la Descente des Ombres (qui mène à Glaciem)
      { x: 1060, y: 40,    w: 200, h: 40, targetZone: 'route_dark_descent', targetX: 120, targetY: 1400, label: '↑ Descente des Ombres' },
    ],

    lootables: [
      { id: 'ms_chest_1',   type: 'chest',   x: 800,  y: 2700, itemPool: ['dark_tome', 'void_shard'],             goldMin: 80,  goldMax: 160},
      { id: 'ms_chest_2',   type: 'chest',   x: 3400, y: 2100, itemPool: ['malachar_notes', 'void_shard'],        goldMin: 100, goldMax: 200},
      { id: 'ms_shrine_1',  type: 'shrine',  x: 1100, y: 1800, itemPool: [],                                      goldMin: 60,  goldMax: 120},
      { id: 'ms_mineral_1', type: 'mineral', x: 2800, y: 700,  itemPool: ['void_shard', 'chaos_crystal'],         goldMin: 60,  goldMax: 120},
    ],

    spawnX: 1200, spawnY: H2-160,
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // ── ZONES DE ROUTE ───────────────────────────────────────────────────────────
  // Zones de transition entre Grievy Town et les zones de combat.
  // Dimensions : 1600×1600. Spawn côté Grievy Town par défaut.
  // ══════════════════════════════════════════════════════════════════════════════

  // ── ROUTE DES BRAISES (Grievy Town ↔ Ignis Reach) ───────────────────────────
  // La terre se déshydrate à mesure qu'on approche d'Ignis Reach.
  // Une rivière de cendres traverse le milieu — tiède, pas mortelle, mais ça sent déjà la fumée.
  route_ember_road: {
    mapWidth: 1600, mapHeight: 1600,
    bgColor: 0x1e1008, pathColor: 0x6a3a18, wallColor: 0x3a1e0c,
    accentColor: 0xcc5522,

    waterAreas: [
      // Ruisseau de cendres liquides traversant le couloir central
      { x: 560, y: 0,   w: 80,  h: 480 },
      { x: 480, y: 440, w: 160, h: 80  },
      { x: 480, y: 480, w: 80,  h: 360 },
      { x: 480, y: 800, w: 200, h: 80  },
      { x: 640, y: 840, w: 80,  h: 280 },
    ],

    paths: [
      // Chemin principal E-W (légèrement sinueux)
      { x: 0,   y: 560, w: 1600, h: 200 },
      // Contournement nord du rocher central
      { x: 400, y: 360, w: 200,  h: 240 },
      { x: 400, y: 360, w: 600,  h: 80  },
      // Élargissement à l'approche d'Ignis Reach
      { x: 1100,y: 440, w: 500,  h: 320 },
      // Branche sud — contourne les formations de lave par le bas (carrefour au milieu)
      { x: 200, y: 760, w: 200,  h: 200 },  // Descente vers le carrefour sud
      { x: 200, y: 920, w: 900,  h: 160 },  // Couloir bas E-W
      { x: 1060,y: 760, w: 200,  h: 360 },  // Remontée vers le chemin principal
      // Carrefour central (jonction nord / sud)
      { x: 380, y: 720, w: 220,  h: 220 },
      { x: 1000,y: 680, w: 160,  h: 220 },
    ],

    walls: [
      // Bordures de la zone
      { x: 0,    y: 0,    w: 1600, h: 40   },
      { x: 0,    y: 1560, w: 1600, h: 40   },
      { x: 0,    y: 0,    w: 40,   h: 1600 },
      { x: 1560, y: 0,    w: 40,   h: 1600 },
      // Crête volcanique nord (deux rochers)
      { x: 80,   y: 60,   w: 300,  h: 200  },
      { x: 480,  y: 60,   w: 200,  h: 180  },
      { x: 780,  y: 80,   w: 250,  h: 160  },
      { x: 1100, y: 60,   w: 300,  h: 240  },
      // Bloc de roche centrale (divise le chemin)
      { x: 680,  y: 440,  w: 220,  h: 200  },
      // Formations de lave solidifiée (sud)
      { x: 80,   y: 900,  w: 300,  h: 200  },
      { x: 500,  y: 1000, w: 200,  h: 180  },
      { x: 820,  y: 920,  w: 280,  h: 160  },
      { x: 1200, y: 860,  w: 240,  h: 200  },
      // Pilier central isolé
      { x: 960,  y: 500,  w: 100,  h: 100  },
    ],

    npcs: [],

    teleports: [
      // Côté Grievy Town (bord ouest)
      { x: 0,    y: 480, w: 40, h: 240, targetZone: 'grievy_town',  targetX: W1-80, targetY: 440, label: '← Grievy Town'  },
      // Côté Ignis Reach (bord est)
      { x: 1560, y: 480, w: 40, h: 240, targetZone: 'ignis_reach',  targetX: 120,   targetY: 600, label: '→ Ignis Reach'  },
    ],

    lootables: [
      { id: 'rer_plant_1',   type: 'plant',   x: 280,  y: 640, itemPool: ['ash_herb', 'herb'],               goldMin: 5,  goldMax: 12 },
      { id: 'rer_mineral_1', type: 'mineral', x: 900,  y: 420, itemPool: ['ember_core', 'iron_ore'],         goldMin: 10, goldMax: 22 },
      { id: 'rer_chest_1',   type: 'chest',   x: 1280, y: 700, itemPool: ['minor_health_potion', 'ember_core'], goldMin: 20, goldMax: 45 },
      { id: 'rer_plant_2',   type: 'plant',   x: 700,  y: 1100,itemPool: ['ash_herb', 'fire_essence'],       goldMin: 5,  goldMax: 12 },
    ],

    spawnX: 80, spawnY: 600,
  },

  // ── CHEMIN DE PIERRE (Grievy Town ↔ Terravast) ───────────────────────────────
  // Un vieux chemin de pèlerinage qui plonge progressivement dans la terre.
  // Les dalles millénaires sont fissurées par les tremblements. Des cristaux percent le sol.
  route_stone_path: {
    mapWidth: 1600, mapHeight: 1600,
    bgColor: 0x0e0c06, pathColor: 0x4a3a1a, wallColor: 0x282010,
    accentColor: 0x7a6a40,

    waterAreas: [
      // Nappe souterraine affleurant en surface — lac souterrain à ciel ouvert
      { x: 900,  y: 700,  w: 300, h: 180 },
      { x: 800,  y: 820,  w: 100, h: 100 },
    ],

    paths: [
      // Chemin principal N-S
      { x: 720, y: 0,    w: 160, h: 1600 },
      // Bifurcation ouest (ruines) — agrandie
      { x: 280, y: 480,  w: 480, h: 200  },
      { x: 280, y: 480,  w: 160, h: 480  },
      { x: 280, y: 920,  w: 480, h: 160  },  // Retour vers le chemin principal (bas)
      // Salle de repos (zone élargie dans les ruines)
      { x: 100, y: 620,  w: 360, h: 300  },
      // Passage nord alternatif (contourne par l'est)
      { x: 880, y: 200,  w: 200, h: 400  },
      { x: 880, y: 200,  w: 360, h: 160  },
      // Élargissement vers Terravast (bas)
      { x: 600, y: 1200, w: 500, h: 360  },
    ],

    walls: [
      // Bordures
      { x: 0,    y: 0,    w: 1600, h: 40   },
      { x: 0,    y: 1560, w: 1600, h: 40   },
      { x: 0,    y: 0,    w: 40,   h: 1600 },
      { x: 1560, y: 0,    w: 40,   h: 1600 },
      // Falaise ouest
      { x: 60,   y: 60,   w: 240,  h: 400  },
      { x: 60,   y: 560,  w: 200,  h: 600  },
      { x: 60,   y: 1260, w: 600,  h: 240  },
      // Formations cristallines est
      { x: 960,  y: 80,   w: 200,  h: 300  },
      { x: 1260, y: 60,   w: 240,  h: 500  },
      { x: 1060, y: 500,  w: 440,  h: 200  },
      { x: 1200, y: 800,  w: 300,  h: 400  },
      // Ruines centrales
      { x: 380,  y: 680,  w: 160,  h: 160  },
      { x: 550,  y: 780,  w: 100,  h: 100  },
      // Bloc pré-Terravast
      { x: 920,  y: 1300, w: 200,  h: 200  },
      { x: 1180, y: 1200, w: 300,  h: 300  },
    ],

    npcs: [],

    teleports: [
      // Côté Terravast (nord, bord haut — 40px dans la zone jouable)
      { x: 680, y: 40,   w: 240, h: 40, targetZone: 'terravast',   targetX: 1200, targetY: H2-160, label: '↑ Terravast'   },
      // Côté Grievy Town (sud, bord bas — 40px dans la zone jouable)
      { x: 680, y: 1520, w: 240, h: 40, targetZone: 'grievy_town', targetX: 1180, targetY: 200,    label: '↓ Grievy Town' },
    ],

    lootables: [
      { id: 'rsp_mineral_1', type: 'mineral', x: 420,  y: 580,  itemPool: ['iron_ore', 'deepstone'],             goldMin: 10, goldMax: 20 },
      { id: 'rsp_plant_1',   type: 'plant',   x: 820,  y: 300,  itemPool: ['cave_mushroom', 'herb'],             goldMin: 5,  goldMax: 12 },
      { id: 'rsp_chest_1',   type: 'chest',   x: 350,  y: 800,  itemPool: ['minor_health_potion', 'deepstone'],  goldMin: 20, goldMax: 45 },
      { id: 'rsp_mineral_2', type: 'mineral', x: 1050, y: 1100, itemPool: ['earth_crystal', 'iron_ore'],         goldMin: 12, goldMax: 25 },
      // Salle de repos dans les ruines (bifurcation ouest)
      { id: 'rsp_shrine_1',  type: 'shrine',  x: 200,  y: 760,  itemPool: [],                                    goldMin: 15, goldMax: 35 },
    ],

    spawnX: 800, spawnY: 800,
  },

  // ── SENTIER DE ZEPHYR (Grievy Town ↔ Zephyr Peaks) ──────────────────────────
  // Un sentier de montagne qui monte en spirale. Le vent devient de plus en plus fort.
  // Les arbres se penchent tous dans la même direction. Quelque chose pousse ici.
  route_zephyr_trail: {
    mapWidth: 1600, mapHeight: 1600,
    bgColor: 0x08091a, pathColor: 0x384880, wallColor: 0x182040,
    accentColor: 0x6677bb,

    waterAreas: [
      // Torrent de montagne descendant
      { x: 1060, y: 0,   w: 80,  h: 300 },
      { x: 960,  y: 260, w: 160, h: 80  },
      { x: 820,  y: 300, w: 80,  h: 200 },
      { x: 820,  y: 460, w: 200, h: 80  },
    ],

    paths: [
      // Sentier principal N-S (sinueux)
      { x: 680,  y: 0,    w: 200,  h: 400  },
      { x: 500,  y: 360,  w: 400,  h: 160  },
      { x: 500,  y: 480,  w: 160,  h: 400  },
      { x: 500,  y: 840,  w: 500,  h: 160  },
      { x: 940,  y: 800,  w: 160,  h: 400  },
      { x: 760,  y: 1160, w: 500,  h: 160  },
      { x: 760,  y: 1280, w: 160,  h: 280  },
      // Élargissement vers Grievy Town (bas)
      { x: 600,  y: 1400, w: 400,  h: 160  },
      // Branche est — escalade alternative par les falaises
      { x: 1100, y: 200,  w: 200,  h: 240  },  // Départ de la branche est (depuis le sommet)
      { x: 1100, y: 400,  w: 400,  h: 160  },  // Traversée vers la falaise
      { x: 1460, y: 200,  w: 160,  h: 360  },  // Montée le long de la falaise est
      // Jonction haute (rejoint le sentier principal au sommet)
      { x: 880,  y: 200,  w: 260,  h: 160  },
      // Zone panoramique haute (point de vue)
      { x: 1200, y: 560,  w: 320,  h: 200  },
      { x: 1200, y: 720,  w: 160,  h: 280  },
      { x: 1060, y: 880,  w: 300,  h: 160  },  // Jonction bas avec le sentier principal
    ],

    walls: [
      // Bordures
      { x: 0,    y: 0,    w: 1600, h: 40   },
      { x: 0,    y: 1560, w: 1600, h: 40   },
      { x: 0,    y: 0,    w: 40,   h: 1600 },
      { x: 1560, y: 0,    w: 40,   h: 1600 },
      // Falaises ouest
      { x: 60,   y: 60,   w: 400,  h: 280  },
      { x: 60,   y: 440,  w: 360,  h: 480  },
      { x: 60,   y: 1040, w: 640,  h: 460  },
      // Falaises est
      { x: 980,  y: 60,   w: 520,  h: 340  },
      { x: 1160, y: 480,  w: 340,  h: 280  },
      { x: 1160, y: 840,  w: 340,  h: 220  },
      { x: 980,  y: 1140, w: 520,  h: 360  },
      // Rochers épars sur le sentier
      { x: 680,  y: 200,  w: 100,  h: 100  },
      { x: 820,  y: 540,  w: 80,   h: 80   },
      { x: 600,  y: 880,  w: 120,  h: 120  },
    ],

    npcs: [],

    teleports: [
      // Côté Grievy Town (nord, bord haut — 40px dans la zone jouable)
      { x: 640, y: 40,   w: 280, h: 40, targetZone: 'grievy_town',  targetX: 1180, targetY: 1400,   label: '↑ Grievy Town'  },
      // Côté Zephyr Peaks (sud, bord bas — 40px dans la zone jouable)
      { x: 640, y: 1520, w: 280, h: 40, targetZone: 'zephyr_peaks', targetX: 1200, targetY: 160,    label: '↓ Zephyr Peaks' },
    ],

    lootables: [
      { id: 'rzt_plant_1',   type: 'plant',   x: 580,  y: 540,  itemPool: ['wind_flower', 'herb'],               goldMin: 6,  goldMax: 14 },
      { id: 'rzt_mineral_1', type: 'mineral', x: 1060, y: 200,  itemPool: ['skystone', 'iron_ore'],              goldMin: 10, goldMax: 22 },
      { id: 'rzt_chest_1',   type: 'chest',   x: 360,  y: 700,  itemPool: ['minor_health_potion', 'wind_crystal'], goldMin: 22, goldMax: 48 },
      { id: 'rzt_plant_2',   type: 'plant',   x: 980,  y: 1000, itemPool: ['cloud_herb', 'wind_flower'],         goldMin: 6,  goldMax: 14 },
    ],

    spawnX: 800, spawnY: 800,
  },

  // ── ROUTE CÔTIÈRE (Grievy Town ↔ Abyssmar) ───────────────────────────────────
  // Une route qui longe une falaise maritime. La mer monte. Des débris de navires
  // jonchent le bas de la falaise. L'odeur de sel est partout.
  route_coastal_road: {
    mapWidth: 1600, mapHeight: 1600,
    bgColor: 0x030810, pathColor: 0x0c2040, wallColor: 0x081830,
    accentColor: 0x1a5070,

    waterAreas: [
      // Mer envahissante sur tout le flanc sud
      { x: 0,    y: 1080, w: 1600, h: 40   },
      { x: 0,    y: 1120, w: 1600, h: 440  },
      // Crique envahissant le chemin (brèche dans la falaise)
      { x: 600,  y: 880,  w: 200,  h: 240  },
      { x: 800,  y: 960,  w: 160,  h: 160  },
    ],

    paths: [
      // Chemin principal E-W (longe la falaise)
      { x: 0,   y: 640, w: 1600, h: 200 },
      // Contournement de la crique
      { x: 500, y: 500, w: 200,  h: 340  },
      { x: 500, y: 500, w: 500,  h: 160  },
      { x: 860, y: 500, w: 200,  h: 340  },
    ],

    walls: [
      // Bordures (sauf le bas — remplacé par l'eau)
      { x: 0,    y: 0,    w: 1600, h: 40   },
      { x: 0,    y: 0,    w: 40,   h: 1080 },
      { x: 1560, y: 0,    w: 40,   h: 1080 },
      // Falaise nord (haute muraille de roche)
      { x: 60,   y: 60,   w: 1480, h: 500  },
      // Débris de navires (obstacle côté falaise)
      { x: 80,   y: 620,  w: 120,  h: 120  },
      { x: 300,  y: 800,  w: 160,  h: 80   },
      // Rochers de falaise effondrés sur la route
      { x: 720,  y: 660,  w: 120,  h: 80   },
      { x: 1060, y: 640,  w: 140,  h: 80   },
      { x: 1300, y: 620,  w: 180,  h: 120  },
    ],

    npcs: [],

    teleports: [
      // Côté Grievy Town (bord est)
      { x: 1560, y: 560, w: 40, h: 240, targetZone: 'grievy_town', targetX: 80,      targetY: 440, label: '→ Grievy Town' },
      // Côté Abyssmar (bord ouest)
      { x: 0,    y: 560, w: 40, h: 240, targetZone: 'abyssmar',    targetX: W2-160,  targetY: 600, label: '← Abyssmar'   },
    ],

    lootables: [
      { id: 'rcr_plant_1',   type: 'plant',   x: 200,  y: 700,  itemPool: ['sea_kelp', 'herb'],               goldMin: 6,  goldMax: 14 },
      { id: 'rcr_mineral_1', type: 'mineral', x: 1000, y: 720,  itemPool: ['deep_coral', 'iron_ore'],         goldMin: 10, goldMax: 22 },
      { id: 'rcr_chest_1',   type: 'chest',   x: 700,  y: 580,  itemPool: ['minor_health_potion', 'sea_kelp'], goldMin: 22, goldMax: 48 },
      { id: 'rcr_plant_2',   type: 'plant',   x: 1380, y: 700,  itemPool: ['sea_kelp', 'pearl'],              goldMin: 8,  goldMax: 18 },
    ],

    spawnX: 1520, spawnY: 720,
  },

  // ── COL DU TONNERRE (Grievy Town ↔ Volterra) ────────────────────────────────
  // Un col montagneux traversé par des fils électriques abandonnés de l'ère Volterra.
  // Les poteaux sont encore debout. Certains crépitent encore. Personne ne sait pourquoi.
  route_thunder_pass: {
    mapWidth: 1600, mapHeight: 1600,
    bgColor: 0x050508, pathColor: 0x101018, wallColor: 0x1a1a28,
    accentColor: 0xddcc00,

    waterAreas: [
      // Bassins d'eau stagnante conductrice (dangereux)
      { x: 560,  y: 600,  w: 160, h: 160 },
      { x: 1060, y: 820,  w: 200, h: 120 },
    ],

    paths: [
      // Chemin principal E-W
      { x: 0,    y: 620, w: 1600, h: 200 },
      // Détour nord (évite un bassin conducteur)
      { x: 440,  y: 440, w: 200,  h: 220 },
      { x: 440,  y: 440, w: 400,  h: 160 },
      { x: 800,  y: 440, w: 200,  h: 220 },
    ],

    walls: [
      // Bordures
      { x: 0,    y: 0,    w: 1600, h: 40   },
      { x: 0,    y: 1560, w: 1600, h: 40   },
      { x: 0,    y: 0,    w: 40,   h: 1600 },
      { x: 1560, y: 0,    w: 40,   h: 1600 },
      // Parois du col (nord et sud)
      { x: 60,   y: 60,   w: 1480, h: 340  },
      { x: 60,   y: 920,  w: 1480, h: 580  },
      // Poteaux électriques écroulés (blocs)
      { x: 240,  y: 620,  w: 60,   h: 160  },
      { x: 660,  y: 720,  w: 60,   h: 120  },
      { x: 880,  y: 620,  w: 60,   h: 160  },
      { x: 1160, y: 660,  w: 60,   h: 160  },
      { x: 1380, y: 620,  w: 60,   h: 200  },
      // Condensateurs industriels effondrés
      { x: 340,  y: 800,  w: 120,  h: 80   },
      { x: 1060, y: 700,  w: 100,  h: 80   },
    ],

    npcs: [],

    teleports: [
      // Côté Grievy Town (bord ouest)
      { x: 0,    y: 560, w: 40, h: 240, targetZone: 'grievy_town', targetX: W1-80,  targetY: 920, label: '← Grievy Town' },
      // Côté Volterra (bord est)
      { x: 1560, y: 560, w: 40, h: 240, targetZone: 'volterra',    targetX: 160,    targetY: 1600, label: '→ Volterra'    },
    ],

    lootables: [
      { id: 'rtp_mineral_1', type: 'mineral', x: 300,  y: 700,  itemPool: ['copper_coil', 'iron_ore'],          goldMin: 10, goldMax: 22 },
      { id: 'rtp_mineral_2', type: 'mineral', x: 1100, y: 560,  itemPool: ['volt_crystal', 'copper_coil'],      goldMin: 12, goldMax: 26 },
      { id: 'rtp_chest_1',   type: 'chest',   x: 760,  y: 740,  itemPool: ['minor_health_potion', 'volt_crystal'], goldMin: 24, goldMax: 50 },
      { id: 'rtp_plant_1',   type: 'plant',   x: 1360, y: 700,  itemPool: ['herb', 'iron_ore'],                  goldMin: 5,  goldMax: 12 },
    ],

    spawnX: 80, spawnY: 720,
  },

  // ── VOIE GLACIALE (Grievy Town ↔ Glaciem) ───────────────────────────────────
  // Une vieille route commerciale maintenant recouverte de givre. Les charrettes
  // abandonnées sont encore là, leurs marchandises gelées à l'intérieur.
  route_frost_way: {
    mapWidth: 1600, mapHeight: 1600,
    bgColor: 0x5a7888, pathColor: 0x8aaabb, wallColor: 0x4a6070,
    accentColor: 0xccddee,

    waterAreas: [
      // Lac gelé (rendu différent — surface blanche/bleue, mais bloquant)
      { x: 200,  y: 900,  w: 400, h: 280 },
      // Rigole de fonte qui traverse la route
      { x: 860,  y: 600,  w: 60,  h: 200 },
      { x: 800,  y: 760,  w: 120, h: 60  },
    ],

    paths: [
      // Chemin principal E-W
      { x: 0,    y: 580, w: 1600, h: 200 },
      // Déviation sud (contourne le lac gelé)
      { x: 100,  y: 740, w: 200,  h: 200 },
      { x: 100,  y: 900, w: 300,  h: 200 },
      { x: 360,  y: 1040,w: 300,  h: 200 },
      { x: 620,  y: 940, w: 200,  h: 200 },
    ],

    walls: [
      // Bordures
      { x: 0,    y: 0,    w: 1600, h: 40   },
      { x: 0,    y: 1560, w: 1600, h: 40   },
      { x: 0,    y: 0,    w: 40,   h: 1600 },
      { x: 1560, y: 0,    w: 40,   h: 1600 },
      // Parois nord de neige compactée
      { x: 60,   y: 60,   w: 1480, h: 460  },
      // Formations de glace sud
      { x: 60,   y: 1220, w: 280,  h: 280  },
      { x: 460,  y: 1300, w: 300,  h: 200  },
      { x: 880,  y: 1200, w: 400,  h: 300  },
      { x: 1360, y: 1080, w: 140,  h: 420  },
      // Charrettes abandonnées (obstacles)
      { x: 320,  y: 600,  w: 80,   h: 60   },
      { x: 660,  y: 620,  w: 80,   h: 60   },
      { x: 1120, y: 600,  w: 80,   h: 60   },
      // Stalactites de glace effondrées
      { x: 1260, y: 700,  w: 180,  h: 100  },
    ],

    npcs: [],

    teleports: [
      // Côté Grievy Town (bord est)
      { x: 1560, y: 520, w: 40, h: 240, targetZone: 'grievy_town', targetX: 80,      targetY: 920, label: '→ Grievy Town' },
      // Côté Glaciem (bord ouest)
      { x: 0,    y: 520, w: 40, h: 240, targetZone: 'glaciem',     targetX: W2-160,  targetY: 1600, label: '← Glaciem'    },
    ],

    lootables: [
      { id: 'rfw_mineral_1', type: 'mineral', x: 720,  y: 460,  itemPool: ['glaciem_ice_shard', 'iron_ore'],    goldMin: 12, goldMax: 26 },
      { id: 'rfw_plant_1',   type: 'plant',   x: 1300, y: 650,  itemPool: ['herb', 'frozen_essence'],           goldMin: 6,  goldMax: 14 },
      { id: 'rfw_chest_1',   type: 'chest',   x: 360,  y: 1100, itemPool: ['minor_health_potion', 'glaciem_ice_shard'], goldMin: 24, goldMax: 52 },
      { id: 'rfw_mineral_2', type: 'mineral', x: 1080, y: 720,  itemPool: ['ancient_frost_rune', 'iron_ore'],   goldMin: 14, goldMax: 28 },
    ],

    spawnX: 1520, spawnY: 680,
  },

  // ── PONT DE LAVE (Ignis Reach ↔ Volterra) ───────────────────────────────────
  // Un pont de pierre volcanique suspendu au-dessus d'une fissure tectonique.
  // Pyrath et Volkran se partageaient ce territoire — deux types de destruction différents
  // cohabitaient ici. Maintenant ils se mélangent. C'est pire.
  route_lava_bridge: {
    mapWidth: 1600, mapHeight: 1600,
    bgColor: 0x100608, pathColor: 0x2a1408, wallColor: 0x1c0c08,
    accentColor: 0xee8800,

    waterAreas: [
      // Fissure de lave centrale (le vrai pont est étroit)
      { x: 0,    y: 0,    w: 400,  h: 460  },
      { x: 0,    y: 660,  w: 400,  h: 940  },
      { x: 460,  y: 0,    w: 1140, h: 180  },
      { x: 460,  y: 1420, w: 1140, h: 180  },
      { x: 1280, y: 180,  w: 320,  h: 1240 },
      // Projections de lave (flaques)
      { x: 500,  y: 560,  w: 120,  h: 80   },
      { x: 900,  y: 700,  w: 100,  h: 80   },
    ],

    paths: [
      // Le pont en lui-même — étroit et sinueux
      { x: 360, y: 460, w: 920, h: 200 },
      // Élargissement côté Ignis Reach
      { x: 80,  y: 420, w: 360, h: 280 },
      // Élargissement côté Volterra
      { x: 1200,y: 420, w: 320, h: 280 },
    ],

    walls: [
      // Bordures (remplacées en grande partie par la lave)
      { x: 0,    y: 0,    w: 40,   h: 500  },
      { x: 0,    y: 620,  w: 40,   h: 980  },
      { x: 1560, y: 0,    w: 40,   h: 1600 },
      // Parapets du pont (garde-fous en pierre volcanique)
      { x: 360,  y: 420,  w: 920,  h: 40   },
      { x: 360,  y: 660,  w: 920,  h: 40   },
      // Ruines de l'ancien relais de garde
      { x: 120,  y: 440,  w: 120,  h: 120  },
      { x: 1320, y: 440,  w: 120,  h: 120  },
      // Colonnes effondrées
      { x: 580,  y: 440,  w: 60,   h: 60   },
      { x: 740,  y: 440,  w: 60,   h: 60   },
      { x: 900,  y: 440,  w: 60,   h: 60   },
      { x: 1060, y: 440,  w: 60,   h: 60   },
      // Même chose côté sud
      { x: 580,  y: 620,  w: 60,   h: 60   },
      { x: 740,  y: 620,  w: 60,   h: 60   },
      { x: 900,  y: 620,  w: 60,   h: 60   },
      { x: 1060, y: 620,  w: 60,   h: 60   },
    ],

    npcs: [],

    teleports: [
      // Côté Ignis Reach (bord ouest)
      { x: 0,    y: 400, w: 40, h: 280, targetZone: 'ignis_reach', targetX: W2-160, targetY: 600,  label: '← Ignis Reach' },
      // Côté Volterra (bord est)
      { x: 1560, y: 400, w: 40, h: 280, targetZone: 'volterra',    targetX: 160,    targetY: 200,  label: '→ Volterra'    },
    ],

    lootables: [
      { id: 'rlb_mineral_1', type: 'mineral', x: 200,  y: 520,  itemPool: ['ember_core', 'obsidian_shard'],     goldMin: 14, goldMax: 30 },
      { id: 'rlb_mineral_2', type: 'mineral', x: 1300, y: 520,  itemPool: ['volt_crystal', 'copper_coil'],      goldMin: 14, goldMax: 30 },
      { id: 'rlb_chest_1',   type: 'chest',   x: 780,  y: 530,  itemPool: ['fire_essence', 'volt_crystal', 'minor_health_potion'], goldMin: 35, goldMax: 70 },
    ],

    spawnX: 80, spawnY: 540,
  },

  // ── DESCENTE DES OMBRES (Glaciem ↔ Malachar's Spire) ────────────────────────
  // Une ancienne route creusée dans la glace noire. Elle descend. Elle descend encore.
  // Les murs sont translucides — on voit des formes à l'intérieur du glacier.
  // Ce sont des archives. Ce sont des morts. Ce sont les deux.
  route_dark_descent: {
    mapWidth: 1600, mapHeight: 1600,
    bgColor: 0x030308, pathColor: 0x0a0818, wallColor: 0x080620,
    accentColor: 0x220a44,

    waterAreas: [
      // Eau noire stagnante — ni froide ni chaude. Elle ne reflète rien.
      { x: 60,   y: 800,  w: 300, h: 200 },
      { x: 1180, y: 600,  w: 300, h: 300 },
      // Fissure entre les deux zones — l'obscurité coule comme un liquide
      { x: 720,  y: 1300, w: 160, h: 260 },
    ],

    paths: [
      // Couloir principal (légèrement en spirale vers le bas)
      { x: 0,    y: 580, w: 1600, h: 200 },
      // Antichambres (alcôves de glace noire)
      { x: 100,  y: 380, w: 200,  h: 280 },
      { x: 1300, y: 400, w: 200,  h: 380 },
      // Passage vers la descente finale
      { x: 680,  y: 760, w: 200,  h: 600 },
      { x: 500,  y: 1280,w: 560,  h: 240 },
    ],

    walls: [
      // Bordures
      { x: 0,    y: 0,    w: 1600, h: 40   },
      { x: 0,    y: 1560, w: 1600, h: 40   },
      { x: 0,    y: 0,    w: 40,   h: 580  },
      { x: 0,    y: 900,  w: 40,   h: 700  },
      { x: 1560, y: 0,    w: 40,   h: 580  },
      { x: 1560, y: 900,  w: 40,   h: 700  },
      // Murs de glace noire (translucides avec formes dedans)
      { x: 60,   y: 60,   w: 1480, h: 280  },
      { x: 60,   y: 1200, w: 440,  h: 300  },
      { x: 1100, y: 1100, w: 440,  h: 400  },
      // Colonnes de glace dans le couloir
      { x: 360,  y: 640,  w: 80,   h: 80   },
      { x: 540,  y: 700,  w: 80,   h: 60   },
      { x: 980,  y: 640,  w: 80,   h: 80   },
      { x: 1160, y: 700,  w: 80,   h: 60   },
      // Blocs de glace effondrés
      { x: 440,  y: 400,  w: 240,  h: 160  },
      { x: 900,  y: 420,  w: 240,  h: 160  },
      // Alcôve archivée (mur épais dans la chambre de gauche)
      { x: 60,   y: 400,  w: 80,   h: 380  },
    ],

    npcs: [],

    teleports: [
      // Côté Glaciem (bord ouest)
      { x: 0,    y: 520, w: 40, h: 240, targetZone: 'glaciem',         targetX: W2-160,  targetY: 400,     label: '← Glaciem'           },
      // Côté Malachar's Spire (bord sud, via le passage descendant)
      { x: 560,  y: 1560,w: 440,h: 40,  targetZone: 'malachars_spire', targetX: 1200,    targetY: 160,     label: '↓ La Flèche de Malachar' },
    ],

    lootables: [
      { id: 'rdd_mineral_1', type: 'mineral', x: 200,  y: 460,  itemPool: ['ancient_frost_rune', 'void_shard'],  goldMin: 20, goldMax: 44 },
      { id: 'rdd_chest_1',   type: 'chest',   x: 780,  y: 660,  itemPool: ['dark_tome', 'frozen_essence'],       goldMin: 40, goldMax: 80 },
      { id: 'rdd_mineral_2', type: 'mineral', x: 1320, y: 500,  itemPool: ['void_shard', 'glaciem_ice_shard'],   goldMin: 22, goldMax: 46 },
      { id: 'rdd_shrine_1',  type: 'shrine',  x: 780,  y: 1100, itemPool: [],                                    goldMin: 30, goldMax: 60 },
    ],

    spawnX: 1520, spawnY: 680,
  },

  // ── RIVIÈRE SOUTERRAINE (Terravast ↔ Abyssmar) ──────────────────────────────
  // Un réseau de galeries creusées par l'eau qui relie les profondeurs de la terre
  // aux abysses marins. L'air est humide, les murs suintent, et une rivière souterraine
  // traverse la zone du nord au sud dans un fracas sourd.
  route_underground_river: {
    mapWidth: 1600, mapHeight: 1600,
    bgColor: 0x030608, pathColor: 0x0a1825, wallColor: 0x060e18,
    accentColor: 0x1a4a5a,

    waterAreas: [
      // Rivière souterraine traversant la zone du nord au sud
      { x: 760, y: 0,    w: 80,  h: 400  },
      { x: 720, y: 360,  w: 120, h: 80   },
      { x: 680, y: 400,  w: 80,  h: 400  },
      { x: 640, y: 760,  w: 120, h: 80   },
      { x: 760, y: 800,  w: 80,  h: 400  },
      { x: 760, y: 1160, w: 120, h: 80   },
      { x: 800, y: 1200, w: 80,  h: 400  },
    ],

    paths: [
      // Couloir principal E-W (niveau d'entrée)
      { x: 0,   y: 640, w: 1600, h: 200  },
      // Grande caverne centrale
      { x: 600, y: 440, w: 400,  h: 560  },
      // Branche nord (vers les stalactites)
      { x: 600, y: 160, w: 200,  h: 320  },
      { x: 400, y: 120, w: 400,  h: 120  },
      // Branche centrale basse (vers la rivière)
      { x: 560, y: 840, w: 480,  h: 200  },
      { x: 680, y: 1000,w: 240,  h: 280  },
      // Branche sud (effondrement — passage alternatif)
      { x: 200, y: 800, w: 440,  h: 160  },
      { x: 200, y: 800, w: 160,  h: 400  },
      { x: 200, y: 1160,w: 600,  h: 160  },
      // Couloir est haut (connexion Terravast)
      { x: 1100,y: 440, w: 500,  h: 280  },
      // Couloir ouest bas (connexion Abyssmar)
      { x: 0,   y: 800, w: 300,  h: 200  },
    ],

    walls: [
      // Bordures extérieures
      { x: 0,    y: 0,    w: 1600, h: 40   },
      { x: 0,    y: 1560, w: 1600, h: 40   },
      { x: 0,    y: 0,    w: 40,   h: 600  },
      { x: 0,    y: 1040, w: 40,   h: 560  },
      { x: 1560, y: 0,    w: 40,   h: 600  },
      { x: 1560, y: 880,  w: 40,   h: 720  },
      // Stalactites nord (formations plafond effondrées)
      { x: 80,   y: 60,   w: 280,  h: 200  },
      { x: 460,  y: 60,   w: 120,  h: 100  },
      { x: 860,  y: 60,   w: 220,  h: 160  },
      { x: 1200, y: 60,   w: 300,  h: 200  },
      // Rochers centraux divisant la caverne
      { x: 480,  y: 480,  w: 120,  h: 160  },
      { x: 1000, y: 520,  w: 160,  h: 120  },
      { x: 840,  y: 680,  w: 100,  h: 100  },
      // Effondrement créant des passages alternatifs
      { x: 380,  y: 640,  w: 200,  h: 60   },
      { x: 960,  y: 760,  w: 200,  h: 80   },
      // Formations de pierre est (avant Terravast)
      { x: 1100, y: 200,  w: 200,  h: 240  },
      { x: 1380, y: 80,   w: 160,  h: 360  },
      // Blocs de roche sud
      { x: 80,   y: 1000, w: 120,  h: 200  },
      { x: 380,  y: 1060, w: 160,  h: 120  },
      { x: 880,  y: 1380, w: 260,  h: 160  },
      { x: 1200, y: 1200, w: 300,  h: 300  },
      // Paroi entre couloir principal et branche nord
      { x: 80,   y: 360,  w: 300,  h: 280  },
      { x: 900,  y: 280,  w: 200,  h: 160  },
    ],

    npcs: [],

    teleports: [
      // Côté Terravast (40px dans la zone jouable)
      { x: 1520, y: 640, w: 40, h: 200, targetZone: 'terravast', targetX: 500,  targetY: 1100, label: '→ Terravast'  },
      // Côté Abyssmar (40px dans la zone jouable)
      { x: 40,   y: 720, w: 40, h: 200, targetZone: 'abyssmar',  targetX: 400,  targetY: 2000, label: '← Abyssmar'   },
    ],

    lootables: [
      { id: 'rur_mineral_1', type: 'mineral', x: 420,  y: 180,  itemPool: ['deepstone', 'iron_ore', 'earth_crystal'],  goldMin: 18, goldMax: 36 },
      { id: 'rur_mineral_2', type: 'mineral', x: 1300, y: 500,  itemPool: ['deep_coral', 'thalymor_shard'],            goldMin: 20, goldMax: 40 },
      { id: 'rur_plant_1',   type: 'plant',   x: 300,  y: 680,  itemPool: ['sea_kelp', 'cave_mushroom'],               goldMin: 8,  goldMax: 18 },
      { id: 'rur_chest_1',   type: 'chest',   x: 780,  y: 540,  itemPool: ['minor_health_potion', 'thalymor_shard', 'deepstone'], goldMin: 30, goldMax: 65 },
    ],

    spawnX: 800, spawnY: 720,
  },

  // ── CRÊTE DE TEMPÊTE (Zephyr Peaks ↔ Volterra) ──────────────────────────────
  // La crête orageuse où le vent de Zephyr Peaks rencontre l'électricité de Volterra.
  // Tempête permanente. Les éclairs frappent les falaises. Le sol tremble à chaque décharge.
  // Deux chemins — un haut exposé, un bas abrité — se rejoignent dans le chaos central.
  route_storm_crossing: {
    mapWidth: 1600, mapHeight: 1600,
    bgColor: 0x040408, pathColor: 0x151525, wallColor: 0x0a0a1a,
    accentColor: 0xaacc00,

    waterAreas: [
      // Bassins électrifiés (eau conductrice, bloquants)
      { x: 560,  y: 680,  w: 160, h: 120 },
      { x: 920,  y: 820,  w: 200, h: 140 },
      { x: 280,  y: 340,  w: 120, h: 100 },
    ],

    paths: [
      // Chemin haut (exposé, nord) — du bord nord jusqu'au carrefour central
      { x: 680,  y: 0,    w: 200, h: 200  },
      { x: 500,  y: 160,  w: 400, h: 160  },
      { x: 400,  y: 280,  w: 200, h: 200  },
      { x: 400,  y: 440,  w: 600, h: 160  },
      // Chemin bas (abrité, sud) — depuis le bord nord en zigzag
      { x: 680,  y: 0,    w: 200, h: 120  },
      { x: 900,  y: 80,   w: 200, h: 200  },
      { x: 1000, y: 240,  w: 160, h: 300  },
      { x: 840,  y: 500,  w: 320, h: 160  },
      // Carrefour central (les deux chemins se rejoignent)
      { x: 540,  y: 560,  w: 620, h: 200  },
      // Sortie vers Volterra (bord sud)
      { x: 640,  y: 720,  w: 200, h: 160  },
      { x: 560,  y: 840,  w: 360, h: 160  },
      { x: 680,  y: 960,  w: 200, h: 400  },
      { x: 580,  y: 1320, w: 400, h: 160  },
      { x: 680,  y: 1440, w: 200, h: 160  },
    ],

    walls: [
      // Bordures extérieures
      { x: 0,    y: 0,    w: 1600, h: 40   },
      { x: 0,    y: 1560, w: 1600, h: 40   },
      { x: 0,    y: 0,    w: 40,   h: 1600 },
      { x: 1560, y: 0,    w: 40,   h: 1600 },
      // Falaises délimitant le chemin haut (nord)
      { x: 80,   y: 60,   w: 520,  h: 200  },
      { x: 80,   y: 320,  w: 280,  h: 400  },
      { x: 60,   y: 480,  w: 300,  h: 120  },
      // Falaises est (entre les deux chemins)
      { x: 1160, y: 80,   w: 360,  h: 240  },
      { x: 1200, y: 300,  w: 320,  h: 280  },
      { x: 1200, y: 600,  w: 300,  h: 200  },
      // Précipices et débris de pylônes foudroyés (milieu de zone)
      { x: 440,  y: 600,  w: 100,  h: 80   },
      { x: 1160, y: 620,  w: 80,   h: 100  },
      { x: 820,  y: 440,  w: 60,   h: 120  },
      { x: 680,  y: 360,  w: 80,   h: 80   },
      // Rochers de falaise (passage vers Volterra, sud)
      { x: 80,   y: 720,  w: 440,  h: 600  },
      { x: 80,   y: 1380, w: 460,  h: 160  },
      { x: 1080, y: 760,  w: 440,  h: 560  },
      { x: 1060, y: 1380, w: 440,  h: 160  },
      // Pylônes foudroyés effondrés (obstacles décoratifs bloquants)
      { x: 340,  y: 220,  w: 60,   h: 120  },
      { x: 1060, y: 160,  w: 60,   h: 120  },
      { x: 500,  y: 740,  w: 40,   h: 100  },
      { x: 1100, y: 900,  w: 40,   h: 100  },
    ],

    npcs: [],

    teleports: [
      // Côté Zephyr Peaks (40px dans la zone jouable)
      { x: 640,  y: 40,   w: 200, h: 40, targetZone: 'zephyr_peaks', targetX: 2800, targetY: 1350, label: '↑ Zephyr Peaks' },
      // Côté Volterra (40px dans la zone jouable)
      { x: 640,  y: 1520, w: 200, h: 40, targetZone: 'volterra',     targetX: 2400, targetY: 120,  label: '↓ Volterra'     },
    ],

    lootables: [
      { id: 'rsc_mineral_1', type: 'mineral', x: 460,  y: 340,  itemPool: ['skystone', 'volt_crystal'],           goldMin: 16, goldMax: 34 },
      { id: 'rsc_mineral_2', type: 'mineral', x: 1060, y: 260,  itemPool: ['copper_coil', 'wind_crystal'],        goldMin: 14, goldMax: 30 },
      { id: 'rsc_chest_1',   type: 'chest',   x: 760,  y: 620,  itemPool: ['minor_health_potion', 'volt_crystal', 'skystone'], goldMin: 28, goldMax: 58 },
    ],

    spawnX: 800, spawnY: 800,
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
        { x: 780, y: 40, w: 200, h: 40, targetZone: 'grievy_town', targetX: 1180, targetY: 200, label: '↑ Grievy Town' },
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
