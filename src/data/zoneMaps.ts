export interface WallRect { x: number; y: number; w: number; h: number }
export interface TeleportZone {
  x: number; y: number; w: number; h: number;
  targetZone: string;
  targetX: number; targetY: number;
  label: string;
}
export interface NpcPlacement { id: string; x: number; y: number }

export interface ZoneLayout {
  mapWidth: number;
  mapHeight: number;
  bgColor: number;
  pathColor: number;
  wallColor: number;
  accentColor?: number;
  walls: WallRect[];
  npcs: NpcPlacement[];
  teleports: TeleportZone[];
  spawnX: number;
  spawnY: number;
}

const W2 = 2000, H2 = 2000;

export const ZONE_LAYOUTS: Record<string, ZoneLayout> = {
  grievy_town: {
    mapWidth: 1600, mapHeight: 1200,
    bgColor: 0x2d4a20, pathColor: 0x7a6040, wallColor: 0x4a3520,
    accentColor: 0x1a8040,
    walls: [
      // Inn (NW) — Liria
      { x: 60,   y: 60,   w: 260, h: 180 },
      // Guard Post (N center) — Kelvar
      { x: 660,  y: 40,   w: 280, h: 150 },
      // Blacksmith (NE) — Theron
      { x: 1280, y: 60,   w: 260, h: 180 },
      // Apothecary (W) — Mira
      { x: 40,   y: 480,  w: 170, h: 150 },
      // Aldric's house (SW)
      { x: 60,   y: 840,  w: 260, h: 180 },
      // Chapel (S center) — Brother Ovan
      { x: 620,  y: 870,  w: 360, h: 250 },
      // General Store (SE) — Ysolde
      { x: 1280, y: 640,  w: 260, h: 180 },
      // Central fountain
      { x: 756,  y: 556,  w: 88,  h: 88  },
    ],
    npcs: [
      { id: 'kelvar',       x: 800,  y: 110  },
      { id: 'liria',        x: 190,  y: 140  },
      { id: 'theron',       x: 1410, y: 140  },
      { id: 'mira',         x: 125,  y: 555  },
      { id: 'aldric',       x: 190,  y: 930  },
      { id: 'brother_ovan', x: 800,  y: 990  },
      { id: 'ysolde',       x: 1410, y: 730  },
    ],
    teleports: [
      { x: 580,  y: 0,    w: 440, h: 36,  targetZone: 'terravast',    targetX: 1000, targetY: 1880, label: '↑ Terravast'    },
      { x: 1564, y: 280,  w: 36,  h: 440, targetZone: 'ignis_reach',  targetX: 100,  targetY: 600,  label: '→ Ignis Reach'  },
      { x: 1564, y: 800,  w: 36,  h: 200, targetZone: 'volterra',     targetX: 100,  targetY: 600,  label: '→ Volterra'     },
      { x: 580,  y: 1164, w: 440, h: 36,  targetZone: 'zephyr_peaks', targetX: 1000, targetY: 100,  label: '↓ Zephyr Peaks' },
      { x: 0,    y: 280,  w: 36,  h: 440, targetZone: 'abyssmar',     targetX: 1880, targetY: 600,  label: '← Abyssmar'     },
      { x: 0,    y: 800,  w: 36,  h: 200, targetZone: 'glaciem',      targetX: 1880, targetY: 700,  label: '← Glaciem'      },
    ],
    spawnX: 800, spawnY: 600,
  },

  ignis_reach: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x1e0600, pathColor: 0x5a2010, wallColor: 0x2a1005,
    accentColor: 0xcc3300,
    walls: [
      { x: 100,  y: 100,  w: 300, h: 200 },
      { x: 600,  y: 180,  w: 200, h: 300 },
      { x: 1200, y: 100,  w: 300, h: 250 },
      { x: 1650, y: 400,  w: 250, h: 300 },
      { x: 300,  y: 700,  w: 200, h: 400 },
      { x: 850,  y: 500,  w: 300, h: 200 },
      { x: 1350, y: 800,  w: 200, h: 300 },
      { x: 500,  y: 1300, w: 400, h: 200 },
      { x: 1100, y: 1200, w: 300, h: 300 },
      { x: 100,  y: 1500, w: 250, h: 300 },
      { x: 1550, y: 1500, w: 300, h: 250 },
      { x: 600,  y: 1700, w: 200, h: 200 },
      { x: 1200, y: 1650, w: 250, h: 250 },
    ],
    npcs: [],
    teleports: [
      { x: 880, y: 0, w: 240, h: 36, targetZone: 'grievy_town', targetX: 1528, targetY: 500, label: '← Grievy Town' },
    ],
    spawnX: 1000, spawnY: 200,
  },

  terravast: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x0e0a04, pathColor: 0x3a2d18, wallColor: 0x1e1608,
    accentColor: 0x4a8a5a,
    walls: [
      { x: 0,      y: 0,      w: W2,  h: 80   },
      { x: 0,      y: H2-80,  w: W2,  h: 80   },
      { x: 0,      y: 0,      w: 80,  h: H2   },
      { x: W2-80,  y: 0,      w: 80,  h: H2   },
      { x: 300,  y: 250,  w: 200, h: 300 },
      { x: 800,  y: 180,  w: 300, h: 200 },
      { x: 1400, y: 250,  w: 200, h: 400 },
      { x: 500,  y: 800,  w: 200, h: 300 },
      { x: 1100, y: 700,  w: 300, h: 200 },
      { x: 300,  y: 1300, w: 200, h: 400 },
      { x: 900,  y: 1200, w: 300, h: 300 },
      { x: 1500, y: 1100, w: 200, h: 400 },
      { x: 600,  y: 1700, w: 400, h: 200 },
      { x: 1200, y: 1700, w: 300, h: 200 },
    ],
    npcs: [],
    teleports: [
      { x: 880, y: H2-40, w: 240, h: 40, targetZone: 'grievy_town', targetX: 800, targetY: 72, label: '↓ Grievy Town' },
    ],
    spawnX: 1000, spawnY: H2 - 200,
  },

  zephyr_peaks: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x0a1828, pathColor: 0x2a4060, wallColor: 0x1a3050,
    accentColor: 0xccddff,
    walls: [
      { x: 200,  y: 200,  w: 400, h: 200 },
      { x: 800,  y: 100,  w: 400, h: 200 },
      { x: 1400, y: 300,  w: 400, h: 200 },
      { x: 100,  y: 700,  w: 300, h: 200 },
      { x: 600,  y: 600,  w: 500, h: 200 },
      { x: 1300, y: 700,  w: 400, h: 200 },
      { x: 300,  y: 1200, w: 400, h: 200 },
      { x: 900,  y: 1100, w: 400, h: 200 },
      { x: 1500, y: 1200, w: 300, h: 200 },
      { x: 400,  y: 1700, w: 400, h: 200 },
      { x: 1000, y: 1700, w: 500, h: 200 },
    ],
    npcs: [],
    teleports: [
      { x: 880, y: 0, w: 240, h: 40, targetZone: 'grievy_town', targetX: 800, targetY: 1128, label: '↑ Grievy Town' },
    ],
    spawnX: 1000, spawnY: 100,
  },

  abyssmar: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x020810, pathColor: 0x0a1835, wallColor: 0x061022,
    accentColor: 0x2a6a8a,
    walls: [
      { x: 200,  y: 200,  w: 300, h: 200 },
      { x: 800,  y: 100,  w: 300, h: 300 },
      { x: 1400, y: 200,  w: 300, h: 200 },
      { x: 100,  y: 700,  w: 200, h: 400 },
      { x: 600,  y: 600,  w: 400, h: 200 },
      { x: 1300, y: 600,  w: 300, h: 300 },
      { x: 300,  y: 1300, w: 300, h: 300 },
      { x: 800,  y: 1200, w: 400, h: 200 },
      { x: 1400, y: 1300, w: 300, h: 300 },
      { x: 500,  y: 1700, w: 500, h: 200 },
      { x: 1200, y: 1700, w: 400, h: 200 },
    ],
    npcs: [],
    teleports: [
      { x: W2-40, y: 380, w: 40, h: 440, targetZone: 'grievy_town', targetX: 72, targetY: 600, label: '→ Grievy Town' },
    ],
    spawnX: 100, spawnY: 600,
  },

  volterra: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x06060e, pathColor: 0x141420, wallColor: 0x202035,
    accentColor: 0xffee00,
    walls: [
      { x: 200,  y: 100,  w: 400, h: 100 },
      { x: 800,  y: 200,  w: 200, h: 400 },
      { x: 1300, y: 100,  w: 400, h: 100 },
      { x: 100,  y: 600,  w: 100, h: 400 },
      { x: 500,  y: 700,  w: 600, h: 100 },
      { x: 1400, y: 600,  w: 100, h: 400 },
      { x: 200,  y: 1200, w: 400, h: 100 },
      { x: 800,  y: 1100, w: 200, h: 400 },
      { x: 1300, y: 1200, w: 400, h: 100 },
      { x: 100,  y: 1600, w: 100, h: 300 },
      { x: 1400, y: 1600, w: 100, h: 300 },
    ],
    npcs: [],
    teleports: [
      { x: W2-40, y: 380, w: 40, h: 440, targetZone: 'grievy_town', targetX: 72, targetY: 900, label: '→ Grievy Town' },
    ],
    spawnX: 100, spawnY: 600,
  },

  glaciem: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x7a9ab2, pathColor: 0xa0c0d8, wallColor: 0x5a7a90,
    accentColor: 0xeeeeff,
    walls: [
      { x: 200,  y: 200,  w: 200, h: 300 },
      { x: 700,  y: 100,  w: 300, h: 200 },
      { x: 1300, y: 200,  w: 200, h: 300 },
      { x: 100,  y: 700,  w: 300, h: 200 },
      { x: 600,  y: 600,  w: 200, h: 400 },
      { x: 1200, y: 700,  w: 300, h: 200 },
      { x: 300,  y: 1200, w: 200, h: 300 },
      { x: 800,  y: 1100, w: 300, h: 200 },
      { x: 1400, y: 1200, w: 200, h: 300 },
      { x: 500,  y: 1700, w: 500, h: 200 },
      { x: 1200, y: 1700, w: 400, h: 200 },
    ],
    npcs: [
      { id: 'elara', x: 1000, y: 1000 },
    ],
    teleports: [
      { x: W2-40, y: 380, w: 40, h: 440, targetZone: 'grievy_town', targetX: 72, targetY: 900, label: '→ Grievy Town' },
    ],
    spawnX: 100, spawnY: 600,
  },

  malachars_spire: {
    mapWidth: W2, mapHeight: H2,
    bgColor: 0x020204, pathColor: 0x070710, wallColor: 0x100820,
    accentColor: 0x4a0a5a,
    walls: [
      { x: 0,      y: 0,      w: W2,  h: 80   },
      { x: 0,      y: H2-80,  w: W2,  h: 80   },
      { x: 0,      y: 0,      w: 80,  h: H2   },
      { x: W2-80,  y: 0,      w: 80,  h: H2   },
      { x: 300,  y: 300,  w: 150, h: 400 },
      { x: 700,  y: 200,  w: 400, h: 150 },
      { x: 1400, y: 300,  w: 150, h: 400 },
      { x: 200,  y: 900,  w: 400, h: 150 },
      { x: 1300, y: 900,  w: 400, h: 150 },
      { x: 300,  y: 1400, w: 150, h: 400 },
      { x: 1400, y: 1400, w: 150, h: 400 },
      { x: 700,  y: 1600, w: 400, h: 150 },
      // Boss arena walls
      { x: 600,  y: 700,  w: 680, h: 50  },
      { x: 600,  y: 1150, w: 680, h: 50  },
      { x: 600,  y: 700,  w: 50,  h: 450 },
      { x: 1230, y: 700,  w: 50,  h: 450 },
    ],
    npcs: [],
    teleports: [
      { x: 880, y: H2-40, w: 240, h: 40, targetZone: 'grievy_town', targetX: 800, targetY: 200, label: '↓ Retreat' },
    ],
    spawnX: 1000, spawnY: H2 - 200,
  },
};

const PARENT_ZONE: Record<string, string> = {
  ashford: 'ignis_reach', pyrath_crossing: 'ignis_reach',
  deepdelve: 'terravast',  stone_watch: 'terravast',
  windherald: 'zephyr_peaks', cloudspire: 'zephyr_peaks',
  saltmourn: 'abyssmar',   the_wreck: 'abyssmar',
  the_circuit: 'volterra', sparks_rest: 'volterra',
  frostveil: 'glaciem',    last_hearth: 'glaciem',
};

export function getZoneLayout(zoneId: string): ZoneLayout {
  if (ZONE_LAYOUTS[zoneId]) return ZONE_LAYOUTS[zoneId];
  const parent = PARENT_ZONE[zoneId];
  if (parent && ZONE_LAYOUTS[parent]) {
    return { ...ZONE_LAYOUTS[parent], npcs: [], teleports: [
      { x: 780, y: 0, w: 40, h: 36, targetZone: 'grievy_town', targetX: 800, targetY: 600, label: '↑ Grievy Town' },
    ]};
  }
  return {
    mapWidth: 1600, mapHeight: 1200,
    bgColor: 0x334455, pathColor: 0x445566, wallColor: 0x223344,
    walls: [],
    npcs: [],
    teleports: [{ x: 780, y: 0, w: 40, h: 36, targetZone: 'grievy_town', targetX: 800, targetY: 600, label: '↑ Grievy Town' }],
    spawnX: 800, spawnY: 600,
  };
}
