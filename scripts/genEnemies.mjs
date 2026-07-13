/**
 * Générateur d'ennemis — Grievy Town's Dilemma
 * ------------------------------------------------------------------
 * Produit `src/data/enemiesGenerated.ts` : 79 créatures issues des packs
 * « Enemies/Bosses Sprites — Fantasy Dreamland » (découpées en strips par
 * scripts/sliceEnemySheets.mjs), leurs entrées de Bestiaire, et surtout la
 * RÉPARTITION DE TOUT LE CATALOGUE dans leurs tables de loot.
 *
 * Deux partis pris :
 *
 * 1. Les 44 planches de « boss » deviennent des ÉLITES, pas des boss. Le jeu a
 *    un cadre de boss de zone très spécifique (un seul par zone, id
 *    `<zone>_boss`, séquence de mort dédiée, drop garanti) — y verser 44 boss
 *    l'aurait vidé de son sens. En élites, ils jouent le rôle qu'ils méritent :
 *    des rencontres dures et rentables, semées dans les zones.
 *
 * 2. Chaque item qui ne tombait NULLE PART (551 sur 649 — dont tout le catalogue
 *    généré) est affecté à des ennemis réels, en respectant deux accords :
 *    l'ÉLÉMENT (une lame de givre tombe à Glaciem, pas à Ignis Reach) et le
 *    NIVEAU (les raretés hautes sur les ennemis de fin de jeu). Un objet sans
 *    élément peut tomber n'importe où.
 *
 * Usage : node scripts/sliceEnemySheets.mjs && node scripts/genEnemies.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'src', 'data', 'enemiesGenerated.ts');

let _s = 0x1a2b3c4d;
const rnd = () => {
  _s |= 0; _s = (_s + 0x6d2b79f5) | 0;
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (a) => a[Math.floor(rnd() * a.length)];

// ── Zones (élément + niveau recommandé, sync avec src/data/zones.ts) ──
const ZONES = [
  { id: 'ignis_reach',     element: 'FIRE',      level: 8  },
  { id: 'terravast',       element: 'EARTH',     level: 10 },
  { id: 'zephyr_peaks',    element: 'WIND',      level: 12 },
  { id: 'abyssmar',        element: 'WATER',     level: 14 },
  { id: 'volterra',        element: 'LIGHTNING', level: 16 },
  { id: 'glaciem',         element: 'ICE',       level: 18 },
  { id: 'malachars_spire', element: 'DARK',      level: 25 },
];

// ── Vocabulaire par élément, pour que les noms sonnent juste ──
const BEAST_NOUN = {
  FIRE:      ['Cendrelin', 'Braisier', 'Rampe-Flamme', 'Escarbille', 'Fournaise'],
  EARTH:     ['Grouilleroc', 'Terrassier', 'Mâche-Pierre', 'Éboulis', 'Cairn'],
  WIND:      ['Siffleur', 'Fend-Nuage', 'Bourrasque', 'Aigrefin', 'Zéphyrin'],
  WATER:     ['Noyeur', 'Ressac', 'Bave-Marée', 'Anguille', 'Écumeur'],
  LIGHTNING: ['Grésil', 'Arc-Vif', 'Crépiteur', 'Étincelle', 'Court-Jus'],
  ICE:       ['Givreux', 'Engelure', 'Craquelin', 'Frimas', 'Verglas'],
  DARK:      ['Rongeombre', 'Estompé', 'Sans-Nom', 'Reliquat', 'Silence'],
};
const ELITE_NOUN = {
  FIRE:      ['Seigneur de Braise', 'Prince des Fournaises', 'Hérésiarque Ardent'],
  EARTH:     ['Colosse de Faille', 'Doyen des Strates', 'Juge de Roche'],
  WIND:      ['Maître des Cimes', 'Veilleur d\'Altitude', 'Souffle Majeur'],
  WATER:     ['Amiral Noyé', 'Gardien des Fosses', 'Voix de la Marée'],
  LIGHTNING: ['Architecte du Réseau', 'Grand Arc', 'Contremaître Foudre'],
  ICE:       ['Doyen du Permagel', 'Sculpteur de Silence', 'Roi Engourdi'],
  DARK:      ['Écho de Malachar', 'Ce Qui Reste', 'Le Refusé'],
};
const EPITHET = ['affamé', 'patient', 'obstiné', 'mal recousu', 'trop vieux', 'sans nom', 'décharné', 'insomniaque'];

const LORE_BEAST = {
  FIRE:      ['Il ne chasse pas : il attend que la chaleur fasse le travail, puis ramasse.', 'On le reconnaît à l\'odeur avant de le voir. C\'est déjà trop tard.'],
  EARTH:     ['Il met des heures à traverser une salle. Il n\'a jamais eu besoin d\'aller plus vite.', 'Ce qu\'il écrase, il ne le mange même pas. Il passe, simplement.'],
  WIND:      ['Il tourne au-dessus des cols pendant des jours. Il choisit.', 'Il ne fait aucun bruit en tombant. C\'est tout le problème.'],
  WATER:     ['Il vit dans une eau où la lumière ne descend pas, et n\'a jamais eu faim.', 'Il rend les corps. Trois jours plus tard, toujours plus légers.'],
  LIGHTNING: ['Il frappe avant que le tonnerre arrive. Le tonnerre, lui, est en retard.', 'Les ingénieurs de Volterra l\'ont catalogué comme un défaut du réseau.'],
  ICE:       ['Il ne tue pas. Il attend, et le froid conclut à sa place.', 'On le retrouve parfois immobile depuis des saisons. Il n\'était pas mort.'],
  DARK:      ['Il n\'a pas d\'ombre. C\'est ce qu\'on remarque en dernier.', 'Malachar en a fait des dizaines. Aucun ne se souvient de lui.'],
};
const LORE_ELITE = {
  FIRE:      ['Il a survécu à la première combustion d\'Ignis Reach. Il n\'a rien appris.'],
  EARTH:     ['Terravast le compte parmi ses strates, et non parmi ses créatures.'],
  WIND:      ['Les cols hurlent quand il descend. On dit qu\'il n\'aime pas ça non plus.'],
  WATER:     ['Il commandait quelque chose, autrefois. Il commande encore, faute d\'ordre contraire.'],
  LIGHTNING: ['Il est plus vieux que le réseau. Le réseau s\'est construit autour de lui.'],
  ICE:       ['Il a cessé de bouger le jour où Crysthea s\'est tue. Il n\'a pas cessé de veiller.'],
  DARK:      ['Ce n\'est pas Malachar. C\'est ce qu\'il a laissé tomber en chemin.'],
};

// ── Chargement du catalogue d'items ────────────────────────────────
const readIds = (file) => {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const out = [];
  for (const m of src.matchAll(/id: '([a-z0-9_]+)'/g)) {
    const chunk = src.slice(m.index, m.index + 900);
    out.push({
      id: m[1],
      rarity: chunk.match(/rarity:\s*ItemRarity\.([A-Z]+)/)?.[1] ?? 'COMMON',
      element: chunk.match(/element:\s*ElementType\.([A-Z]+)/)?.[1] ?? null,
      type: chunk.match(/type:\s*ItemType\.([A-Z_]+)/)?.[1] ?? null,
    });
  }
  return out;
};
const items = [...readIds('src/data/items.ts'), ...readIds('src/data/itemsGenerated.ts')];
const byId = new Map(items.map(i => [i.id, i]));

// Items déjà présents dans une table de loot écrite à la main : on ne les
// redistribue pas (l'ennemi signature garde son drop signature).
const enemiesSrc = fs.readFileSync(path.join(ROOT, 'src/data/enemies.ts'), 'utf8');
const alreadyLooted = new Set([...enemiesSrc.matchAll(/itemId: '([a-z0-9_]+)'/g)].map(m => m[1]));
const orphans = [...byId.values()].filter(i => !alreadyLooted.has(i.id) && i.type !== 'SKIN');

// ── Niveau minimum d'un ennemi pour porter une rareté ──────────────
// Une lame mythique ne tombe pas d'un rat de zone 1 : la progression du butin
// doit suivre celle des zones.
const RARITY_MIN_LEVEL = { COMMON: 1, UNCOMMON: 1, RARE: 8, EPIC: 12, LEGENDARY: 16, MYTHIC: 20, HIDDEN: 25 };
const RARITY_DROP = { COMMON: 0.22, UNCOMMON: 0.14, RARE: 0.07, EPIC: 0.03, LEGENDARY: 0.012, MYTHIC: 0.005, HIDDEN: 0.002 };

// ── Construction des ennemis ───────────────────────────────────────
const sheets = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/.enemySheets.json'), 'utf8'));
const beasts = sheets.filter(s => !s.boss);
const elites = sheets.filter(s => s.boss);

const enemies = [];
const assign = (sheet, zone, isElite, idx) => {
  const el = zone.element;
  const lvl = Math.max(1, zone.level + (isElite ? 3 : 0) + Math.floor(rnd() * 3) - 1);
  const mult = isElite ? 2.4 : 1;
  const name = isElite
    ? `${pick(ELITE_NOUN[el])}`
    : `${pick(BEAST_NOUN[el])} ${pick(EPITHET)}`;
  // Lore tiré UNE SEULE FOIS : il alimente à la fois la fiche d'ennemi et l'entrée
  // de Bestiaire. Le tirer deux fois donnait deux lores différents pour la même
  // créature, ce qui se voyait immédiatement en jeu.
  const lore = isElite ? pick(LORE_ELITE[el]) : pick(LORE_BEAST[el]);

  return {
    id: sheet.id,
    name,
    lore,
    zone: zone.id,
    element: el,
    level: lvl,
    isElite,
    stats: {
      baseHp:  Math.round((40 + lvl * 12) * mult),
      baseAtk: Math.round((8 + lvl * 2.2) * mult),
      baseDef: Math.round((3 + lvl * 1.1) * mult),
      baseMagicAtk: Math.round((5 + lvl * 1.6) * mult),
      baseMagicDef: Math.round((3 + lvl * 1.0) * mult),
      baseSpd: 5 + Math.floor(lvl / 4),
    },
    xp:   Math.round((12 + lvl * 6) * (isElite ? 3 : 1)),
    gold: { min: Math.round((4 + lvl) * (isElite ? 4 : 1)), max: Math.round((12 + lvl * 3) * (isElite ? 4 : 1)) },
    loot: [],
    idx,
  };
};

beasts.forEach((s, i) => {
  const zone = ZONES[i % ZONES.length];
  enemies.push(assign(s, zone, false, i));
});
elites.forEach((s, i) => {
  const zone = ZONES[i % ZONES.length];
  enemies.push(assign(s, zone, true, i));
});

// ── Répartition des items orphelins ────────────────────────────────
// Pour chaque item : on cherche les ennemis compatibles (élément + niveau), et on
// l'attache à 1..2 d'entre eux. Si aucun ne convient (rareté trop haute pour toute
// la faune générée), on retombe sur les ennemis les plus hauts en niveau plutôt que
// de laisser l'item inatteignable — c'est tout l'objet de l'exercice.
let placed = 0, fallbacks = 0;
for (const item of orphans) {
  const minLvl = RARITY_MIN_LEVEL[item.rarity] ?? 1;
  let cands = enemies.filter(e =>
    e.level >= minLvl && (item.element === null || item.element === 'NEUTRAL' || e.element === item.element));

  if (cands.length === 0) {
    // Élément sans zone (DIVINE) ou rareté trop haute : on prend le haut du panier.
    const maxLvl = Math.max(...enemies.map(e => e.level));
    cands = enemies.filter(e => e.level >= maxLvl - 4);
    fallbacks++;
  }
  const n = 1 + (rnd() < 0.35 ? 1 : 0);
  for (let k = 0; k < n; k++) {
    const e = cands[Math.floor(rnd() * cands.length)];
    if (e.loot.some(l => l.itemId === item.id)) continue;
    e.loot.push({ itemId: item.id, dropRate: RARITY_DROP[item.rarity] ?? 0.1 });
  }
  placed++;
}

// ── Émission ───────────────────────────────────────────────────────
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const defs = enemies.map(e => {
  const lore = e.lore;
  const loot = e.loot.map(l => `{ itemId: '${l.itemId}', dropRate: ${l.dropRate}, minQty: 1, maxQty: 1 }`).join(', ');
  return `  {
    id: '${e.id}',
    name: '${esc(e.name)}',
    description: '${esc(e.name)} — ${e.isElite ? 'rencontre d\\\'élite' : 'faune hostile'} de ${e.zone}.',
    sprite: 'enemy_${e.id}',
    zone: ElementType.${e.element},
    baseLevel: ${e.level},
    stats: { baseHp: ${e.stats.baseHp}, baseMana: 0, baseAtk: ${e.stats.baseAtk}, baseDef: ${e.stats.baseDef}, baseSpd: ${e.stats.baseSpd}, baseMagicAtk: ${e.stats.baseMagicAtk}, baseMagicDef: ${e.stats.baseMagicDef} },
    element: ElementType.${e.element},
    skills: [],
    loot: [${loot}],
    baseXp: ${e.xp},
    baseGold: { min: ${e.gold.min}, max: ${e.gold.max} },
    isBoss: false,
    isElite: ${e.isElite},
    // createEnemiesForZone fait Math.floor(spawnWeight * 4) : 0.5 → 2 exemplaires,
    // 0.25 → 1. À 1.2 (4 exemplaires) les zones montaient à ~135 ennemis simultanés,
    // soit ~540 GameObjects et autant de corps physiques en overlap permanent — le
    // plus gros coût runtime de toute cette passe. On reste au-dessus de l'existant
    // sans transformer chaque zone en foire.
    spawnWeight: ${e.isElite ? 0.25 : 0.5},
    aggroRange: ${e.isElite ? 260 : 220},
    attackRange: ${e.isElite ? 60 : 48},
    moveSpeed: ${e.isElite ? 75 : 90},
    behavior: '${e.isElite ? 'charger' : pick(['chaser', 'chaser', 'patrol'])}',
    lore: '${esc(lore)}',
  },`;
}).join('\n');

const bestiary = enemies.map(e => {
  const drops = e.loot.map(l => `{ itemId: '${l.itemId}', dropRatePct: ${Math.round(l.dropRate * 100)}, isHidden: ${byId.get(l.itemId)?.rarity === 'HIDDEN'} }`).join(', ');
  return `  { enemyId: '${e.id}', name: '${esc(e.name)}', habitat: '${e.zone}', shortDesc: '${esc(e.isElite ? 'Rencontre d\\\'élite' : 'Faune hostile')} — niveau ${e.level}.', lore: '${esc(e.lore)}', drops: [${drops}] },`;
}).join('\n');

// Répartition par zone, pour injection dans zones.ts
const byZone = {};
for (const e of enemies) (byZone[e.zone] ??= []).push(e.id);

const header = `// ⚠ FICHIER GÉNÉRÉ — ne pas éditer à la main.
// Produit par \`node scripts/sliceEnemySheets.mjs && node scripts/genEnemies.mjs\`.
// 79 créatures issues des packs Enemies/Bosses Sprites (Fantasy Dreamland), et la
// répartition de TOUT le catalogue d'items dans leurs tables de loot : avant cette
// passe, ${orphans.length} items sur ${byId.size} ne tombaient de NULLE PART.
//
// Les planches de « boss » des packs sont montées en ÉLITES, pas en boss : le jeu a
// un cadre de boss de zone dédié (un seul par zone, séquence de mort propre), et y
// verser 44 boss l'aurait vidé de son sens.
import { Enemy, ElementType } from '../types';
import type { BestiaryEnemyData } from './bestiary';

export const GENERATED_ENEMIES: Enemy[] = [
${defs}
];

export const GENERATED_BESTIARY: BestiaryEnemyData[] = [
${bestiary}
];

/** Ennemis générés par zone — à concaténer aux listes de src/data/zones.ts. */
export const GENERATED_ZONE_ENEMIES: Record<string, string[]> = ${JSON.stringify(byZone, null, 2)};
`;

fs.writeFileSync(OUT, header, 'utf8');
const totalLoot = enemies.reduce((s, e) => s + e.loot.length, 0);
console.log(`ennemis générés : ${enemies.length} (dont élites : ${enemies.filter(e => e.isElite).length})`);
console.log(`items orphelins : ${orphans.length} → répartis : ${placed} (fallback niveau : ${fallbacks})`);
console.log(`entrées de loot : ${totalLoot}`);
console.log(`→ ${path.relative(ROOT, OUT)}`);
