/**
 * Uniformise le CONTOUR des icônes d'items — Grievy Town's Dilemma
 * ------------------------------------------------------------------
 * Les icônes viennent d'une dizaine de packs différents, qui ne suivent pas la
 * même convention : la plupart cernent leur sprite d'un liseré sombre (c'est ce
 * qui le détache du fond bleu nuit du slot), mais certains packs — les arcs, une
 * partie des épées enchantées — livrent des sprites SANS liseré. Dans la grille,
 * ces items ressortaient « à plat » à côté de leurs voisins : le défaut reporté
 * (« certains équipements n'ont pas le même outline »).
 *
 * Ce script mesure, pour chaque icône, la proportion de pixels de BORD de la
 * silhouette qui sont sombres. Si elle est faible (< SEUIL), le sprite n'a pas
 * de liseré : on le lui dessine, par dilatation d'un pixel vers l'EXTÉRIEUR de
 * la silhouette. L'art d'origine n'est jamais réécrit — on ne peint que dans des
 * pixels totalement transparents.
 *
 * Idempotent : une fois cerné, le sprite mesure ~1 et le run suivant l'ignore.
 * À relancer après tout script qui repose des icônes (genItems, fillMissingIcons).
 *
 * Usage : node scripts/normalizeIconOutline.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const ROOT  = path.resolve(import.meta.dirname, '..');
const ICONS = path.join(ROOT, 'public', 'assets', 'sprites', 'items');
const DRY   = process.argv.includes('--dry');

/** En dessous de cette proportion de pixels de bord sombres, on considère qu'il
 *  n'y a PAS de liseré. Les packs cernés mesurent > 0,9, les autres ~0 — le seuil
 *  tombe dans un vide franc, il n'y a pas de population intermédiaire à trancher. */
const SEUIL = 0.5;

/** Luminance en dessous de laquelle un pixel compte comme « sombre ». */
const LUM_SOMBRE = 60;

/** Opacité au-delà de laquelle un pixel appartient à la silhouette. */
const OPAQUE = 128;
/** Opacité en dessous de laquelle un pixel est peignable (on préserve l'anti-alias). */
const VIDE = 16;

/** Liseré : un noir légèrement violacé, dans la famille des liserés déjà présents
 *  dans les packs (violine 41,15,51 · bordeaux 76,0,35 · gris 25,25,25) sans en
 *  copier aucun — il doit lire comme un CONTOUR, pas comme une teinte d'art. */
const LISERE = [26, 20, 32];

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Proportion de pixels de bord de silhouette qui sont sombres (0 = aucun liseré). */
function tauxLisere(png) {
  const { width: W, height: H, data } = png;
  const alpha = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : data[((W * y + x) << 2) + 3];
  let bord = 0;
  let sombre = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (alpha(x, y) < OPAQUE) continue;
      const estBord = alpha(x - 1, y) < OPAQUE || alpha(x + 1, y) < OPAQUE
                   || alpha(x, y - 1) < OPAQUE || alpha(x, y + 1) < OPAQUE;
      if (!estBord) continue;
      const i = (W * y + x) << 2;
      bord++;
      if (lum(data[i], data[i + 1], data[i + 2]) < LUM_SOMBRE) sombre++;
    }
  }
  return bord === 0 ? 1 : sombre / bord;
}

/** Dilate la silhouette d'un pixel, en LISERE, uniquement dans le vide. */
function cerner(png) {
  const { width: W, height: H, data } = png;
  const alpha = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : data[((W * y + x) << 2) + 3];
  // On collecte AVANT de peindre : peindre au fil de l'eau ferait grossir la
  // silhouette pendant le balayage et produirait un liseré de 2 px par endroits.
  const aPeindre = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (alpha(x, y) >= VIDE) continue; // pixel déjà occupé (ou anti-aliasé) : intouchable
      const touche = alpha(x - 1, y) >= OPAQUE || alpha(x + 1, y) >= OPAQUE
                  || alpha(x, y - 1) >= OPAQUE || alpha(x, y + 1) >= OPAQUE
                  // diagonales : sans elles, le liseré s'ouvre dans les angles
                  || alpha(x - 1, y - 1) >= OPAQUE || alpha(x + 1, y - 1) >= OPAQUE
                  || alpha(x - 1, y + 1) >= OPAQUE || alpha(x + 1, y + 1) >= OPAQUE;
      if (touche) aPeindre.push((W * y + x) << 2);
    }
  }
  for (const i of aPeindre) {
    data[i] = LISERE[0];
    data[i + 1] = LISERE[1];
    data[i + 2] = LISERE[2];
    data[i + 3] = 255;
  }
  return aPeindre.length;
}

let cernees = 0;
let deja = 0;
const touchees = [];

for (const f of fs.readdirSync(ICONS)) {
  if (!f.toLowerCase().endsWith('.png')) continue;
  const p = path.join(ICONS, f);
  let png;
  try { png = PNG.sync.read(fs.readFileSync(p)); } catch { continue; }

  if (tauxLisere(png) >= SEUIL) { deja++; continue; }

  const n = cerner(png);
  if (n === 0) { deja++; continue; }
  if (!DRY) fs.writeFileSync(p, PNG.sync.write(png));
  cernees++;
  touchees.push(f);
}

console.log(`${DRY ? '[DRY] ' : ''}icônes déjà cernées : ${deja}`);
console.log(`${DRY ? '[DRY] ' : ''}icônes cernées ici  : ${cernees}`);
if (touchees.length) console.log('   ex. :', touchees.slice(0, 6).join(', '));
