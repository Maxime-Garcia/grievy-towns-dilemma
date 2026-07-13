/**
 * Comble les icônes manquantes — Grievy Town's Dilemma
 * ------------------------------------------------------------------
 * Beaucoup d'items du catalogue référencent un `icon: 'item_xxx'` dont le PNG
 * n'a jamais existé (l'UI retombait alors sur `item_type_generic`). Ce script
 * attribue à chacun une vraie icône 32x32 tirée des packs du bundle, choisie
 * selon le TYPE de l'item (et, pour les armes, selon son ÉLÉMENT — les packs
 * sont déclinés en six couleurs qui correspondent aux éléments du jeu).
 *
 * Aucune modification de data : on écrit simplement le fichier PNG que le
 * catalogue attendait déjà. Le choix est déterministe (hash de l'id), donc
 * relancer le script ne réattribue jamais une autre icône à un item existant.
 *
 * Usage : node scripts/fillMissingIcons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const BUNDLE = path.join(ROOT, 'assets', 'Bundle_extracted');
const ICONS = path.join(ROOT, 'public', 'assets', 'sprites', 'items');
const ITEMS_TS = path.join(ROOT, 'src', 'data', 'items.ts');

// hash stable id -> entier (FNV-1a) : garantit qu'un item garde SON icône entre deux runs
const hash = (s) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
};

const walk = (dir) => {
  const abs = path.join(BUNDLE, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const rec = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) rec(p);
      else if (e.name.toLowerCase().endsWith('.png')) out.push(p);
    }
  };
  rec(abs);
  return out;
};
/** PNG d'un pack dont le dossier parent porte exactement `folder` (les packs ont un niveau dupliqué). */
const inFolder = (pack, folder) =>
  walk(pack).filter(p => path.basename(path.dirname(p)).toLowerCase() === folder.toLowerCase()).sort();

// Couleur de pack correspondant à l'élément du jeu
const ELEM_COLOR = {
  FIRE: 'Orange', ICE: 'Blue', WATER: 'Blue', LIGHTNING: 'Yellow',
  EARTH: 'Green', WIND: 'Green', DARK: 'Purple', DIVINE: 'Normal', NEUTRAL: 'Normal',
};
const WEAPON_PACK = {
  SWORD: ['Sword Item Icons', 'Swords'], GREATSWORD: ['Sword Item Icons', 'Swords'],
  DUAL_SWORD: ['Sword Item Icons', 'Swords'],
  DAGGER: ['Dagger Item Icons', 'Daggers'], DUAL_DAGGER: ['Dagger Item Icons', 'Daggers'],
  AXE: ['Axe Item Icons', 'Axe'], HAMMER: ['Axe Item Icons', 'Axe'],
  SPEAR: ['Spear Icons 32x32 Pixelart', 'Spears'],
  STAFF: ['Staff Item Icons', 'Staff'],
  BOW: ['Bow Item Icons', null],
};

// Caches de pools
const pools = new Map();
const pool = (key, fn) => { if (!pools.has(key)) pools.set(key, fn()); return pools.get(key); };

const weaponPool = (wt, element) => {
  const entry = WEAPON_PACK[wt];
  if (!entry) return [];
  const [pack, sub] = entry;
  if (!sub) return pool(pack, () => walk(pack));
  const color = ELEM_COLOR[element] ?? 'Normal';
  return pool(`${pack}|${sub}|${color}`, () => {
    let p = inFolder(pack, `${sub} ${color}`);
    if (p.length === 0) p = inFolder(pack, `${sub.replace(/s$/, '')} ${color}`); // "Dagger Purple"
    return p;
  });
};
const armorPool = (type) => {
  const folders = type === 'HELM' ? ['Leather Helm', 'Steel Helm'] : ['Leather Armor', 'Steel Armor'];
  return pool(`armory|${type}`, () => folders.flatMap(f => inFolder('Armory Item Icons', f)));
};
// Fourre-tout : 990 icônes génériques — DERNIER recours uniquement (cf. TYPE_RANGES).
const genericPool = () =>
  pool('generic', () => inFolder('Item Icons [Rogue Adventure]', 'Single Sprites'));

// ── Pools par TYPE d'objet, tirés du pack Rogue Adventure ────────────────────
//
// Le pack « Single Sprites » n'est PAS un tas informe : ses 990 fichiers sont
// numérotés (RA_Item_Icons_N.png) et rangés par blocs de 8 — une série de 8
// gants, puis 8 bottes, puis 8 anneaux, etc., déclinés en 4 à 8 coloris.
// L'ancienne version de ce script l'ignorait et piochait au HASARD dans les 990
// pour tout ce qui n'était ni arme, ni casque, ni plastron. D'où le poisson sur
// une paire de bottes et la sacoche sur une cape (bug reporté) : les poissons
// (817-832) et les bourses (733-736, 665-672) sont dans le même tas.
//
// Les plages ci-dessous ont été relevées À L'ŒIL sur des planches de contact
// générées depuis les PNG (cf. .tmp/blocks*.png) — pas devinées.
//
// Cas particuliers assumés :
//  - LEGS : le pack n'a AUCUNE jambière. Faute de mieux, on prend la série des
//    ceinturons/cuissards (taille basse) — c'est de l'équipement de bas du corps,
//    donc lisible, là où une icône au hasard ne l'était pas.
//  - CAPE : série des manteaux/robes ouverts à revers (les 5 dernières cases de
//    chaque bloc d'armure), le plus proche d'une cape dans le pack.
const TYPE_RANGES = {
  GLOVES:     [[25, 32], [57, 64], [89, 96], [121, 128]],
  LEGS:       [[145, 152], [177, 184], [209, 216], [241, 248]], // ceinturons
  BOOTS:      [[153, 160], [185, 192], [217, 224], [249, 256]],
  AMULET:     [[273, 280], [305, 312], [337, 344], [369, 376]],
  RING:       [[281, 288], [313, 320], [345, 352], [377, 384]],
  CAPE:       [[780, 784], [812, 816], [844, 848], [876, 880],
               [908, 912], [940, 944], [972, 976], [1004, 1008]],
  // Fioles : les blocs 401-416 et 433-448 — PAS 417-432, qui est une série de
  // haches glissée au milieu (une plage 401-448 d'un bloc mettait des haches
  // dans les consommables).
  CONSUMABLE: [[401, 416], [433, 448]],
  MATERIAL:   [[497, 512], [529, 544], [561, 576], [593, 608],   // gemmes
               [625, 640], [657, 664], [689, 696], [721, 728]],  // minerais/lingots
  KEY_ITEM:   [[465, 480]],                                      // clés
};

const SINGLES = path.join(
  BUNDLE, 'Item Icons [Rogue Adventure]', 'Item Icons [Rogue Adventure]', 'Single Sprites',
);
/** Chemins existants d'une liste de plages [début, fin] inclusives. */
const typePool = (type) => pool(`type|${type}`, () => {
  const ranges = TYPE_RANGES[type];
  if (!ranges) return [];
  const out = [];
  for (const [from, to] of ranges) {
    for (let n = from; n <= to; n++) {
      const p = path.join(SINGLES, `RA_Item_Icons_${n}.png`);
      if (fs.existsSync(p)) out.push(p);
    }
  }
  return out;
});

// ── Lecture du catalogue ───────────────────────────────────────────
const src = fs.readFileSync(ITEMS_TS, 'utf8');
const items = [];
for (const m of src.matchAll(/id:\s*'([a-z0-9_]+)'/g)) {
  // Fenêtre autour de la déclaration : suffisant, chaque item tient sur une ligne
  const start = m.index;
  const chunk = src.slice(start, start + 900);
  const icon = chunk.match(/icon:\s*'(item_[a-z0-9_]+)'/)?.[1];
  if (!icon) continue;
  items.push({
    id: m[1],
    icon,
    type: chunk.match(/type:\s*ItemType\.([A-Z_]+)/)?.[1],
    weaponType: chunk.match(/weaponType:\s*WeaponType\.([A-Z_]+)/)?.[1],
    element: chunk.match(/element:\s*ElementType\.([A-Z_]+)/)?.[1] ?? 'NEUTRAL',
  });
}

fs.mkdirSync(ICONS, { recursive: true });
let filled = 0, skipped = 0;
const byKind = {};

// Les types qui ont GAGNÉ un pool dédié (TYPE_RANGES) portent aujourd'hui une
// icône tirée du fourre-tout : il faut la REMPLACER, pas la conserver. On ne
// réécrit que si le PNG en place vient effectivement du pool générique (hash du
// contenu) — une icône dessinée à la main reste intouchable.
const genericHashes = new Set(
  genericPool().map(p => crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex')),
);
const isGenericArtwork = (file) =>
  genericHashes.has(crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex'));

for (const it of items) {
  const dest = path.join(ICONS, `${it.icon}.png`);
  const hasDedicatedPool = TYPE_RANGES[it.type] !== undefined;
  if (fs.existsSync(dest) && !(hasDedicatedPool && isGenericArtwork(dest))) { skipped++; continue; }

  let p = [];
  let kind;
  if (it.type === 'WEAPON' && it.weaponType) { p = weaponPool(it.weaponType, it.element); kind = it.weaponType; }
  else if (it.type === 'HELM' || it.type === 'CHEST') { p = armorPool(it.type); kind = it.type; }
  else if (hasDedicatedPool) { p = typePool(it.type); kind = it.type; }
  else { p = genericPool(); kind = it.type ?? 'AUTRE'; }

  if (p.length === 0) { p = genericPool(); kind = `${kind}(fallback)`; }
  if (p.length === 0) continue;

  fs.copyFileSync(p[hash(it.id) % p.length], dest);
  filled++;
  byKind[kind] = (byKind[kind] ?? 0) + 1;
}

console.log(`icônes déjà présentes : ${skipped}`);
console.log(`icônes comblées       : ${filled}`);
for (const [k, n] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) console.log(`   ${k.padEnd(22)} ${n}`);
