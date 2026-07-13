/**
 * Découpe les planches d'ennemis/boss en strips d'état — Grievy Town's Dilemma
 * ------------------------------------------------------------------------
 * Les packs « Enemies/Bosses Sprites — Fantasy Dreamland » livrent chaque créature
 * dans UNE planche 192×240 : 4 colonnes (frames) × 5 rangées, et les 5 rangées sont
 * exactement les 5 états que le jeu attend déjà (idle, walk, attack, damage, dead —
 * cf. PreloaderScene.ENEMY_STATES). La dernière rangée est bien la mort (silhouette
 * écrasée), vérifié à l'œil sur plusieurs planches.
 *
 * Le projet, lui, charge des strips HORIZONTAUX `enemy_<id>_<state>.png`. On coupe
 * donc chaque rangée en un strip 192×48 de 4 frames.
 *
 * ⚠ Les strips existants font 6 frames (288×48) ; ceux-ci en font 4. C'est pour ça
 * que PreloaderScene ne code plus `end: 5` en dur mais dérive le nombre de frames
 * de la texture.
 *
 * Usage : node scripts/sliceEnemySheets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const BUNDLE = path.join(ROOT, 'assets', 'Bundle_extracted');
const OUT = path.join(ROOT, 'public', 'assets', 'sprites', 'enemies');

const STATES = ['idle', 'walk', 'attack', 'damage', 'dead'];
const F = 48;   // taille d'une frame
const COLS = 4; // frames par état

/**
 * Planches sources.
 *
 * Deux layouts coexistent dans les packs, et ils ne disent PAS la même chose :
 *
 * - `states` (192×240 = 4 frames × 5 rangées) — packs « Enemies Sprites 1 » et les
 *   deux packs de boss. Les 5 rangées SONT les 5 états du jeu. Découpage direct.
 *
 * - `dirs` (144×192 = 3 frames × 4 rangées) — pack « Enemies Sprites 2 ». Ici les
 *   rangées sont des DIRECTIONS (bas/gauche/droite/haut), à la RPG Maker : ces
 *   planches ne contiennent AUCUN art d'attaque, de dégât ni de mort. On dérive
 *   donc les 5 états de la rangée face-caméra. C'est une limite de la source, pas
 *   un raccourci : ces créatures n'ont pas d'animation de mort dédiée (la séquence
 *   de mort du jeu les fait disparaître en fondu, ce qui reste lisible).
 */
const SOURCES = [
  { dir: 'Enemies Sprites 1 - Fantasy Dreamland', sub: 'Enemy Sprites 48x48', prefix: 'fd_beast',  boss: false, layout: 'states' },
  { dir: 'Enemies Sprites 2 - Fantasy Dreamland', sub: '48x48',               prefix: 'fd_swarm',  boss: false, layout: 'dirs'   },
  { dir: 'Bosses Sprites 1 - Fantasy Dreamland',  sub: 'Boss Sprites 48x48',  prefix: 'fd_lord',   boss: true,  layout: 'states' },
  { dir: 'Bosses Sprites 2 - Fantasy Dreamland',  sub: 'Boss Sprites 48x48',  prefix: 'fd_tyrant', boss: true,  layout: 'states' },
];

const findDir = (dir, sub) => {
  const base = path.join(BUNDLE, dir);
  if (!fs.existsSync(base)) return null;
  let found = null;
  const walk = (d) => {
    if (found) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const p = path.join(d, e.name);
      if (e.name === sub) { found = p; return; }
      walk(p);
    }
  };
  walk(base);
  return found;
};

fs.mkdirSync(OUT, { recursive: true });

const manifest = [];
let written = 0;

for (const src of SOURCES) {
  const dir = findDir(src.dir, src.sub);
  if (!dir) { console.warn(`  ! dossier introuvable : ${src.dir}/${src.sub}`); continue; }

  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.png')).sort();
  let n = 0, skipped = 0;
  for (const file of files) {
    const png = PNG.sync.read(fs.readFileSync(path.join(dir, file)));

    // Géométrie EXACTE attendue selon le layout. On saute tout le reste plutôt que
    // de produire des strips décalés d'un pixel (les packs contiennent aussi des
    // planches multi-créatures 576×384, ambiguës : elles n'ont pas leur place ici).
    const isStates = src.layout === 'states' && png.width === COLS * F && png.height === STATES.length * F;
    const isDirs   = src.layout === 'dirs'   && png.width === 3 * F     && png.height === 4 * F;
    if (!isStates && !isDirs) { skipped++; continue; }

    n++;
    const id = `${src.prefix}_${String(n).padStart(2, '0')}`;
    const cols = isStates ? COLS : 3;

    STATES.forEach((state, row) => {
      // `states` : une rangée par état. `dirs` : pas d'art d'état → on reprend la
      // rangée 0 (face caméra) pour les cinq.
      const srcRow = isStates ? row : 0;
      const strip = new PNG({ width: cols * F, height: F });
      PNG.bitblt(png, strip, 0, srcRow * F, cols * F, F, 0, 0);
      fs.writeFileSync(path.join(OUT, `enemy_${id}_${state}.png`), PNG.sync.write(strip));
      written++;
    });

    manifest.push({ id, boss: src.boss, layout: src.layout, source: `${src.dir}/${file}` });
  }
  console.log(`${src.dir.padEnd(38)} → ${String(n).padStart(3)} créatures${skipped ? `  (${skipped} planches ignorées : géométrie non conforme)` : ''}`);
}

fs.writeFileSync(
  path.join(ROOT, 'scripts', '.enemySheets.json'),
  JSON.stringify(manifest, null, 2),
  'utf8',
);
console.log(`\ncréatures : ${manifest.length}  (dont boss : ${manifest.filter(m => m.boss).length})`);
console.log(`strips écrits : ${written}`);
