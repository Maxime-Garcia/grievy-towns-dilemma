import { ZoneLayout, WallRect, PathRect, PitArea } from '../data/zoneMaps';

// Générateur procédural de carte de run (RunSystem, docs/design/ROGUELITE_POC.md §5).
// Logique pure, ZÉRO dépendance Phaser — GameScene.drawZoneMap()/wallGroup consomment
// le ZoneLayout produit exactement comme un zoneMaps.ts écrit à la main (aucune brique
// de rendu/collision à adapter, cf. exploration du chantier RunSystem).
//
// Déterministe : deux appels avec le même (seed, legIndex, params) produisent
// TOUJOURS le même résultat — une run sauvegardée puis rechargée doit retrouver
// la carte identique (MapGenSystem ne sérialise jamais lui-même, c'est RunSystem
// qui stocke seed+legIndex et rappelle generateZoneLayout()). Jamais Math.random().

type CellState = 'solid' | 'room' | 'corridor';

export interface MapGenParams {
  cols: number;
  rows: number;
  cellSize: number;
  /** 0..1 — proportion de cellules tirées comme salle avant le plancher minimum. */
  roomDensity: number;
  /** Garde-fou si le tirage roomDensity produit trop peu de salles. */
  minRoomCount: number;
  /** Arêtes supplémentaires hors arbre couvrant minimal — boucles d'exploration. */
  extraLoopEdges: number;
  pitCount: number;
  pitDamage: number;
  pitSizeMin: number;
  pitSizeMax: number;
  spawnPointsPerRoom: number;
  bgColor: number;
  pathColor: number;
  wallColor: number;
  accentColor: number;
}

/** Palette Ignis Reach (docs/design/ROGUELITE_POC.md — biome pilote tranche 1),
 *  reprise de zoneMaps.ts pour rester visuellement cohérente avec le reste du jeu. */
export const DEFAULT_IGNIS_PARAMS: MapGenParams = {
  cols: 6,
  rows: 5,
  cellSize: 640,
  roomDensity: 0.68,
  minRoomCount: 12,
  extraLoopEdges: 2,
  pitCount: 4,
  pitDamage: 14,
  pitSizeMin: 90,
  pitSizeMax: 160,
  spawnPointsPerRoom: 2,
  bgColor: 0x1a0800,
  pathColor: 0x6a3010,
  wallColor: 0x3a1808,
  accentColor: 0xdd4400,
};

export interface GeneratedMap {
  layout: ZoneLayout;
  spawnPoints: { x: number; y: number }[];
  bossRoomCenter: { x: number; y: number };
}

/** LCG déterministe — même motif que diorama-agent (arbres/fleurs procéduraux) :
 *  jamais Math.random(), toujours ce générateur seedé. */
function makeLcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** Mixe seed+legIndex en une seule seed 32 bits (finalizer type murmur) — chaque
 *  "Continuer" doit produire une carte différente de la précédente, déterministe. */
function mixSeed(seed: number, legIndex: number): number {
  let s = (seed ^ Math.imul(legIndex + 1, 0x9e3779b9)) >>> 0;
  s = Math.imul(s ^ (s >>> 16), 2246822507);
  s = Math.imul(s ^ (s >>> 13), 3266489909);
  s ^= s >>> 16;
  return s >>> 0;
}

class UnionFind {
  private parent: number[];
  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
  }
  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];
      x = this.parent[x];
    }
    return x;
  }
  union(a: number, b: number): boolean {
    const ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    this.parent[ra] = rb;
    return true;
  }
}

export function generateZoneLayout(seed: number, legIndex: number, params: MapGenParams): GeneratedMap {
  const rand = makeLcg(mixSeed(seed, legIndex));
  const { cols, rows, cellSize } = params;
  const cellCount = cols * rows;

  const idx = (col: number, row: number) => row * cols + col;
  const colOf = (i: number) => i % cols;
  const rowOf = (i: number) => Math.floor(i / cols);
  const neighbors4 = (i: number): number[] => {
    const col = colOf(i), row = rowOf(i);
    const out: number[] = [];
    if (col > 0) out.push(idx(col - 1, row));
    if (col < cols - 1) out.push(idx(col + 1, row));
    if (row > 0) out.push(idx(col, row - 1));
    if (row < rows - 1) out.push(idx(col, row + 1));
    return out;
  };
  const bfs = (startIdx: number): { dist: number[]; parent: number[] } => {
    const dist = new Array(cellCount).fill(-1);
    const parent = new Array(cellCount).fill(-1);
    dist[startIdx] = 0;
    const queue = [startIdx];
    let head = 0;
    while (head < queue.length) {
      const cur = queue[head++];
      for (const n of neighbors4(cur)) {
        if (dist[n] === -1) {
          dist[n] = dist[cur] + 1;
          parent[n] = cur;
          queue.push(n);
        }
      }
    }
    return { dist, parent };
  };
  const shortestPath = (a: number, b: number): number[] => {
    const { dist, parent } = bfs(a);
    if (dist[b] === -1) return [];
    const path: number[] = [];
    let cur = b;
    while (cur !== -1) {
      path.push(cur);
      if (cur === a) break;
      cur = parent[cur];
    }
    return path.reverse();
  };

  // 1. Cellule de spawn : ligne aléatoire de la colonne 0 (bord gauche de la carte).
  const state: CellState[] = new Array(cellCount).fill('solid');
  const spawnIdx = idx(0, Math.floor(rand() * rows));
  state[spawnIdx] = 'room';

  // 2. Tirage densité de salles (ordre déterministe : row-major).
  for (let i = 0; i < cellCount; i++) {
    if (state[i] === 'room') continue;
    if (rand() < params.roomDensity) state[i] = 'room';
  }
  const collectRooms = () => {
    const out: number[] = [];
    for (let i = 0; i < cellCount; i++) if (state[i] === 'room') out.push(i);
    return out;
  };
  let rooms = collectRooms();
  // Plancher minimum de salles — tirage supplémentaire déterministe si le premier
  // passage était trop clairsemé (rare avec roomDensity par défaut, garde-fou).
  let guard = 0;
  while (rooms.length < params.minRoomCount && guard < cellCount * 4) {
    const i = Math.floor(rand() * cellCount);
    if (state[i] === 'solid') state[i] = 'room';
    rooms = collectRooms();
    guard++;
  }

  // 3. Salle de boss = la plus éloignée du spawn (distance réelle sur la grille
  //    complète, toujours connexe à ce stade puisque rien n'est encore mur).
  const spawnBfs = bfs(spawnIdx);
  let bossIdx = spawnIdx;
  let bestDist = -1;
  for (const r of rooms) {
    if (r === spawnIdx) continue;
    if (spawnBfs.dist[r] > bestDist) { bestDist = spawnBfs.dist[r]; bossIdx = r; }
  }

  // 4. Arbre couvrant minimal sur le graphe COMPLET des salles (poids = distance
  //    de grille réelle entre chaque paire) — garantit que toutes les salles, y
  //    compris la salle de boss, sont atteignables. + quelques arêtes hors-MST
  //    (les moins chères restantes) pour casser le couloir unique.
  interface Edge { a: number; b: number; w: number; tie: number; }
  const distCache = new Map<number, { dist: number[]; parent: number[] }>();
  const bfsFrom = (i: number) => {
    let c = distCache.get(i);
    if (!c) { c = bfs(i); distCache.set(i, c); }
    return c;
  };
  const edges: Edge[] = [];
  for (let a = 0; a < rooms.length; a++) {
    const bfsA = bfsFrom(rooms[a]);
    for (let b = a + 1; b < rooms.length; b++) {
      edges.push({ a: rooms[a], b: rooms[b], w: bfsA.dist[rooms[b]], tie: rand() });
    }
  }
  // Tie-break précalculé (rand() jamais appelé DANS le comparateur — un
  // comparateur non stable romprait le contrat de sort()).
  edges.sort((e1, e2) => (e1.w - e2.w) || (e1.tie - e2.tie));

  const uf = new UnionFind(cellCount);
  const mstEdges: Edge[] = [];
  for (const e of edges) {
    if (uf.union(e.a, e.b)) mstEdges.push(e);
  }
  const usedKeys = new Set(mstEdges.map(e => `${e.a}-${e.b}`));
  let loopsAdded = 0;
  for (const e of edges) {
    if (loopsAdded >= params.extraLoopEdges) break;
    const key = `${e.a}-${e.b}`;
    if (usedKeys.has(key)) continue;
    mstEdges.push(e);
    usedKeys.add(key);
    loopsAdded++;
  }

  // 5. Réalise chaque arête retenue comme un chemin de cellules — celles encore
  //    'solid' deviennent 'corridor'. Jamais de traversée hors 4-connexité (le
  //    chemin BFS ne saute jamais une cellule), donc aucun couloir ne peut
  //    chevaucher un mur non-adjacent.
  for (const e of mstEdges) {
    for (const cell of shortestPath(e.a, e.b)) {
      if (state[cell] === 'solid') state[cell] = 'corridor';
    }
  }

  // 6. Rectangles de rendu/collision : chaque cellule = un rect plein cellSize×
  //    cellSize (room/corridor → PathRect walkable ; solid → WallRect). Zéro
  //    marge entre cellules adjacentes déjà walkable → jamais de "gap" invisible
  //    entre deux salles pourtant connectées.
  const walls: WallRect[] = [];
  const paths: PathRect[] = [];
  for (let i = 0; i < cellCount; i++) {
    const rect = { x: colOf(i) * cellSize, y: rowOf(i) * cellSize, w: cellSize, h: cellSize };
    if (state[i] === 'solid') walls.push(rect);
    else paths.push(rect);
  }

  // 7. Trous — un par salle éligible (ni spawn, ni boss), jamais dans un couloir
  //    (sinon risque de couper le seul chemin d'accès à une zone entière).
  const eligibleForPits = rooms.filter(r => r !== spawnIdx && r !== bossIdx);
  const shuffled = [...eligibleForPits];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const pits: PitArea[] = [];
  const pitCellCount = Math.min(params.pitCount, shuffled.length);
  for (let i = 0; i < pitCellCount; i++) {
    const cell = shuffled[i];
    const ox = colOf(cell) * cellSize, oy = rowOf(cell) * cellSize;
    const size = params.pitSizeMin + rand() * (params.pitSizeMax - params.pitSizeMin);
    const margin = cellSize * 0.2;
    const maxOffset = Math.max(0, cellSize - size - margin * 2);
    const px = ox + margin + rand() * maxOffset;
    const py = oy + margin + rand() * maxOffset;
    pits.push({ x: px, y: py, w: size, h: size, damage: params.pitDamage });
  }
  const overlapsPit = (x: number, y: number, r: number) =>
    pits.some(p => x > p.x - r && x < p.x + p.w + r && y > p.y - r && y < p.y + p.h + r);

  // 8. Points de spawn ennemis — validés hors trous par construction (jamais dans
  //    un mur : ils ne sont générés que dans des cellules déjà 'room').
  const spawnPoints: { x: number; y: number }[] = [];
  for (const cell of rooms) {
    if (cell === spawnIdx || cell === bossIdx) continue;
    const ox = colOf(cell) * cellSize, oy = rowOf(cell) * cellSize;
    for (let n = 0; n < params.spawnPointsPerRoom; n++) {
      const margin = cellSize * 0.22;
      for (let attempt = 0; attempt < 6; attempt++) {
        const x = ox + margin + rand() * (cellSize - margin * 2);
        const y = oy + margin + rand() * (cellSize - margin * 2);
        if (!overlapsPit(x, y, 30)) { spawnPoints.push({ x, y }); break; }
      }
    }
  }

  const spawnX = colOf(spawnIdx) * cellSize + cellSize / 2;
  const spawnY = rowOf(spawnIdx) * cellSize + cellSize / 2;
  const bossRoomCenter = {
    x: colOf(bossIdx) * cellSize + cellSize / 2,
    y: rowOf(bossIdx) * cellSize + cellSize / 2,
  };

  const layout: ZoneLayout = {
    mapWidth: cols * cellSize,
    mapHeight: rows * cellSize,
    bgColor: params.bgColor,
    pathColor: params.pathColor,
    wallColor: params.wallColor,
    accentColor: params.accentColor,
    walls,
    paths,
    npcs: [],
    teleports: [],
    lootables: [],
    pits,
    spawnX,
    spawnY,
  };

  return { layout, spawnPoints, bossRoomCenter };
}
