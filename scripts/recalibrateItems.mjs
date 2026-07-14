/**
 * RECALAGE DES ITEMS ÉCRITS À LA MAIN — src/data/items.ts
 * ==================================================================
 * Les 396 items générés lisent scripts/balanceModel.mjs. Les 150 équipables
 * écrits à la main, eux, portaient des nombres saisis un par un, au fil des
 * mois, sans barème commun. C'est très exactement la cause du désordre :
 * deux moitiés de catalogue réglées séparément DIVERGENT, toujours.
 *
 * Ce script applique le MÊME modèle aux items manuels. Il ne touche QUE les
 * champs chiffrés :
 *     value · damage/magicDamage · defense/magicDefense · bonusStats · equipRanges
 * Il préserve intégralement l'éditorial : id, nom, description, lore, icône,
 * élément, rareté, type, weaponType, passiveEffect, et les commentaires.
 *
 * ⚠ Il lit les objets par APPARIEMENT D'ACCOLADES, pas ligne par ligne. Une
 * première version travaillait sur les lignes : elle a silencieusement sauté les
 * 24 items HIDDEN — ceux qui sont écrits en blocs multi-lignes, c'est-à-dire les
 * plus puissants du jeu. Un outil de recalage qui rate 24 items sans le dire
 * reproduit exactement la panne qu'il est censé réparer.
 *
 * Déterministe : le tirage des clés de substats est semé par le HASH DE L'ID.
 * Relancer le script sur un fichier déjà recalé ne change rien.
 *
 * Usage : node scripts/recalibrateItems.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import * as M from './balanceModel.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const FILE = path.join(ROOT, 'src', 'data', 'items.ts');
const DRY = process.argv.includes('--dry');

// Exclusions de rolls sur les HIDDEN (src/data/hiddenRollExclusions.ts) : une clé
// interdite ne doit pas amplifier l'axe du passif de l'objet. On les RELIT plutôt
// que de les dupliquer — une seule source de vérité, là aussi.
const exclSrc = fs.readFileSync(path.join(ROOT, 'src', 'data', 'hiddenRollExclusions.ts'), 'utf8');
const HIDDEN_EXCL = {};
for (const m of exclSrc.matchAll(/^\s{2}(\w+):\s*\[([^\]]*)\]/gm)) {
  HIDDEN_EXCL[m[1]] = [...m[2].matchAll(/'([A-Z_]+)'/g)].map(x => x[1]);
}

/** RNG déterministe semé par l'id — le recalage est reproductible au bit près. */
function seeded(id) {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  let s = h >>> 0;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fin de l'objet ouvert à `start` (index de son `{`), en ignorant les accolades
 * qui se trouvent DANS une chaîne (le lore en contient) et dans les commentaires.
 */
function matchBrace(src, start) {
  let depth = 0, i = start, inStr = false, inLine = false;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (inLine) { if (c === '\n') inLine = false; i++; continue; }
    if (inStr) {
      if (c === '\\') { i += 2; continue; }
      if (c === "'") inStr = false;
      i++; continue;
    }
    if (c === "'") { inStr = true; i++; continue; }
    if (c === '/' && n === '/') { inLine = true; i += 2; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i; }
    i++;
  }
  return -1;
}

const ARMOR = new Set(M.ARMOR_SLOTS);
const ACC = new Set(['RING', 'AMULET']);
const DEFENSIVE_MAINS = new Set(['HP_FLAT', 'HP_PCT', 'DEF_FLAT', 'DEF_PCT', 'MDEF_FLAT', 'DODGE_PCT']);

/** Taux de change ATK ↔ PV : 1 ATK vaut POOL_HP/POOL_ATK PV. Offense et défense
 *  sont posées d'égale valeur — c'est l'axiome de la monnaie commune. */
const atkToHp = (r) => M.POOL_HP[r] / M.POOL_ATK[r];

let src = fs.readFileSync(FILE, 'utf8');
const stats = { WEAPON: 0, ARMOR: 0, ACC: 0 };
const problems = [];
const seen = new Set();

// On collecte d'abord tous les blocs (index croissants), puis on réécrit de la
// FIN vers le DÉBUT : réécrire d'avant en arrière décalerait tous les index suivants.
const blocks = [];
for (const m of src.matchAll(/\bid: '([^']+)'/g)) {
  const idIdx = m.index;
  // remonter jusqu'au '{' ouvrant de l'objet qui contient cet id
  let open = src.lastIndexOf('{', idIdx);
  if (open < 0) continue;
  const close = matchBrace(src, open);
  if (close < 0) continue;
  blocks.push({ open, close, id: m[1] });
}

for (const b of blocks.reverse()) {
  const block = src.slice(b.open, b.close + 1);
  const mType = block.match(/\btype: ItemType\.(\w+)/);
  const mRar = block.match(/\brarity: ItemRarity\.(\w+)/);
  if (!mType || !mRar) continue;
  const type = mType[1], rarity = mRar[1], id = b.id;
  const isWeapon = type === 'WEAPON', isArmor = ARMOR.has(type), isAcc = ACC.has(type);
  if (!isWeapon && !isArmor && !isAcc) continue;
  if (seen.has(id)) continue;
  seen.add(id);
  if (!M.SUBSTAT_COUNT[rarity]) { problems.push(`${id} : rareté inconnue « ${rarity} »`); continue; }

  const rnd = seeded(id);
  const forbidden = HIDDEN_EXCL[id] ?? [];
  const wt = (block.match(/\bweaponType: WeaponType\.(\w+)/) ?? [])[1] ?? 'SWORD';

  // ── Les CHIFFRES viennent de la fabrique unique du modèle ────────
  // MÊME fonction que celle qu'appelle genItems.mjs et que mesure le solveur.
  // C'est tout l'objet de la manœuvre : trois fabriques d'items, c'étaient trois
  // vérités, et donc la divergence garantie.
  const T = M.buildTemplate(type, rarity, { weaponType: wt, rnd, forbidden });
  if (T.substats.length < M.SUBSTAT_COUNT[rarity]) {
    problems.push(`${id} : ${T.substats.length}/${M.SUBSTAT_COUNT[rarity]} substats (pool épuisé après exclusions)`);
  }
  if (forbidden.includes(T.mainKey)) problems.push(`${id} : main stat ${T.mainKey} interdite par exclusion HIDDEN`);

  // ── Réécriture des champs chiffrés ──────────────────────────────
  let B = block;
  B = B.replace(/\bvalue: \d+/, `value: ${T.value}`);
  B = B.replace(/\bbonusStats: \{[^}]*\}/, 'bonusStats: {}');

  if (isWeapon) {
    B = B.replace(/\bdamage: \d+/, `damage: ${T.damage}`);
    B = B.replace(/\bmagicDamage: \d+/, `magicDamage: ${T.magicDamage}`);
    stats.WEAPON++;
  } else if (isArmor) {
    B = B.replace(/\bdefense: \d+/, `defense: ${T.defense}`);
    B = B.replace(/\bmagicDefense: \d+/, `magicDefense: ${T.magicDefense}`);
    stats.ARMOR++;
  } else {
    // Les accessoires ne portent pas de défense implicite : tout leur budget passe
    // par equipRanges. Une `defense` sur une bague sortait du budget → 0.
    B = B.replace(/\bdefense: \d+/, 'defense: 0');
    B = B.replace(/\bmagicDefense: \d+/, 'magicDefense: 0');
    stats.ACC++;
  }

  // equipRanges : bloc imbriqué → appariement d'accolades, pas de regex gloutonne.
  const subTxt = T.substats.map(s =>
    `{ key: '${s.key}', min: ${s.min}, max: ${s.max}${s.isPercentage ? ', isPercentage: true' : ''} }`,
  ).join(', ');
  const rangesTxt = `equipRanges: { mainStat: { key: '${T.mainKey}', min: ${T.mainStat.min}, max: ${T.mainStat.max} }, substats: [${subTxt}] }`;

  const erIdx = B.indexOf('equipRanges:');
  if (erIdx >= 0) {
    const braceIdx = B.indexOf('{', erIdx);
    const end = matchBrace(B, braceIdx);
    B = B.slice(0, erIdx) + rangesTxt + B.slice(end + 1);
  } else {
    // Équipable sans equipRanges (data incomplète) : on l'ajoute avant l'accolade finale.
    B = B.replace(/\s*\}$/, `,\n    ${rangesTxt},\n  }`);
  }

  src = src.slice(0, b.open) + B + src.slice(b.close + 1);
}

if (problems.length) {
  console.log('\n⚠ PROBLÈMES :');
  for (const p of problems) console.log(`   ${p}`);
}
console.log(`\narmes recalées       : ${stats.WEAPON}`);
console.log(`armures recalées     : ${stats.ARMOR}`);
console.log(`accessoires recalés  : ${stats.ACC}`);
console.log(`TOTAL                : ${stats.WEAPON + stats.ARMOR + stats.ACC}`);

if (DRY) { console.log('\n--dry : rien écrit.'); process.exit(0); }
fs.writeFileSync(FILE, src, 'utf8');
console.log(`\n→ ${path.relative(ROOT, FILE)} réécrit.`);
