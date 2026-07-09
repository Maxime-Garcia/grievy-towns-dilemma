import { SpawnRegion } from '../types';

export interface SpawnRect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

// PROVISIONAL/APPROXIMATE: splits the playable rectangle of a zone map into a 3x3 grid
// (corners/edges/center) so enemies can be biased toward a plausible quadrant for the
// Bestiary heatmap, without any real pathfinding or wall-awareness. Replace with precise
// placement data once zone maps are finalized.
export function getSpawnRegionRect(
  region: SpawnRegion,
  mapWidth: number,
  mapHeight: number,
  margin = 150
): SpawnRect {
  const innerLeft = margin;
  const innerTop = margin;
  const innerW = Math.max(mapWidth - margin * 2, 1);
  const innerH = Math.max(mapHeight - margin * 2, 1);
  const xThird = innerW / 3;
  const yThird = innerH / 3;

  const cols: Array<[number, number]> = [
    [innerLeft, innerLeft + xThird],
    [innerLeft + xThird, innerLeft + xThird * 2],
    [innerLeft + xThird * 2, innerLeft + innerW],
  ];
  const rows: Array<[number, number]> = [
    [innerTop, innerTop + yThird],
    [innerTop + yThird, innerTop + yThird * 2],
    [innerTop + yThird * 2, innerTop + innerH],
  ];

  const grid: Record<SpawnRegion, [number, number]> = {
    nw: [0, 0], n: [1, 0], ne: [2, 0],
    w:  [0, 1], center: [1, 1], e: [2, 1],
    sw: [0, 2], s: [1, 2], se: [2, 2],
  };

  const [col, row] = grid[region];
  const [x0, x1] = cols[col];
  const [y0, y1] = rows[row];
  return { x0, x1, y0, y1 };
}

/** Picks one region at random from a list — used to alternate between an enemy's assigned regions on each spawn. */
export function pickSpawnRegion(regions: SpawnRegion[] | undefined): SpawnRegion | undefined {
  if (!regions || regions.length === 0) return undefined;
  return regions[Math.floor(Math.random() * regions.length)];
}
