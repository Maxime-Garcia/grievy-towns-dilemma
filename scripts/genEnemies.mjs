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

// ── Tables EN parallèles (mêmes longueurs, mêmes index) ────────────
// Le catalogue est généré : ses traductions le sont aussi. On tire un INDEX et on
// lit la même case dans les deux langues — l'anglais sort du générateur, et les deux
// versions ne peuvent pas diverger à la prochaine régénération.
const pickI = (a) => Math.floor(rnd() * a.length);

const BEAST_NOUN_EN = {
  FIRE:      ['Ashling', 'Emberling', 'Flamecrawler', 'Cinder', 'Furnace'],
  EARTH:     ['Rockswarm', 'Delver', 'Stonechewer', 'Scree', 'Cairn'],
  WIND:      ['Whistler', 'Cloudsplitter', 'Squall', 'Kite', 'Zephyrling'],
  WATER:     ['Drowner', 'Undertow', 'Tidedrool', 'Eel', 'Foamer'],
  LIGHTNING: ['Sleet', 'Quickarc', 'Crackler', 'Spark', 'Shortfuse'],
  ICE:       ['Rimeling', 'Chilblain', 'Crackleback', 'Hoarfrost', 'Blackice'],
  DARK:      ['Shadegnawer', 'The Faded', 'Nameless', 'Remnant', 'Silence'],
};
const ELITE_NOUN_EN = {
  FIRE:      ['Lord of Embers', 'Prince of Furnaces', 'Burning Heresiarch'],
  EARTH:     ['Colossus of the Rift', 'Elder of the Strata', 'Judge of Stone'],
  WIND:      ['Master of the Peaks', 'Watcher of the Heights', 'Greater Gale'],
  WATER:     ['Drowned Admiral', 'Warden of the Trenches', 'Voice of the Tide'],
  LIGHTNING: ['Architect of the Grid', 'Great Arc', 'Foreman of Thunder'],
  ICE:       ['Elder of the Permafrost', 'Sculptor of Silence', 'Numb King'],
  DARK:      ['Echo of Malachar', 'What Remains', 'The Refused'],
};
const EPITHET_EN = ['the Starving', 'the Patient', 'the Stubborn', 'the Ill-Stitched', 'the Overold', 'the Nameless', 'the Gaunt', 'the Sleepless'];

const LORE_BEAST_EN = {
  FIRE:      ['It does not hunt: it waits for the heat to do the work, then collects.', 'You smell it before you see it. By then it is already too late.'],
  EARTH:     ['It takes hours to cross a room. It has never needed to go faster.', 'What it crushes, it does not even eat. It simply passes.'],
  WIND:      ['It circles above the passes for days. It chooses.', 'It makes no sound as it falls. That is the whole problem.'],
  WATER:     ['It lives in water the light never reaches, and has never gone hungry.', 'It gives the bodies back. Three days later, always lighter.'],
  LIGHTNING: ['It strikes before the thunder arrives. The thunder, for its part, is late.', 'Volterra\'s engineers catalogued it as a fault in the grid.'],
  ICE:       ['It does not kill. It waits, and the cold concludes on its behalf.', 'It is sometimes found motionless for seasons. It was not dead.'],
  DARK:      ['It has no shadow. That is the last thing you notice.', 'Malachar made dozens of them. Not one remembers him.'],
};
const LORE_ELITE_EN = {
  FIRE:      ['It survived the first burning of Ignis Reach. It learned nothing from it.'],
  EARTH:     ['Terravast counts it among its strata, not among its creatures.'],
  WIND:      ['The passes howl when it descends. They say it does not like that either.'],
  WATER:     ['It commanded something, once. It commands still, for want of orders to the contrary.'],
  LIGHTNING: ['It is older than the grid. The grid was built around it.'],
  ICE:       ['It stopped moving the day Crysthea fell silent. It did not stop watching.'],
  DARK:      ['This is not Malachar. This is what he dropped along the way.'],
};

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
// Taux de drop par rareté (probabilité 0-1). HIDDEN à 0.0007 = 0,07% : c'est la
// valeur voulue côté design, et elle s'AFFICHE désormais telle quelle (le bestiaire
// arrondissait à l'entier — 0,07% tombait à « 0.00% », ce qui donnait l'impression
// d'un drop impossible).
const RARITY_DROP = { COMMON: 0.22, UNCOMMON: 0.14, RARE: 0.07, EPIC: 0.03, LEGENDARY: 0.012, MYTHIC: 0.005, HIDDEN: 0.0007 };

// ── Construction des ennemis ───────────────────────────────────────
const sheets = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/.enemySheets.json'), 'utf8'));
const beasts = sheets.filter(s => !s.boss);
const elites = sheets.filter(s => s.boss);

const enemies = [];
const assign = (sheet, zone, isElite, idx) => {
  const el = zone.element;
  const lvl = Math.max(1, zone.level + (isElite ? 3 : 0) + Math.floor(rnd() * 3) - 1);
  const mult = isElite ? 2.4 : 1;
  // Tirage par INDEX : même case lue en FR et en EN — les deux langues sortent en phase.
  const nI = isElite ? pickI(ELITE_NOUN[el]) : pickI(BEAST_NOUN[el]);
  const eI = isElite ? 0 : pickI(EPITHET);
  const name = isElite
    ? ELITE_NOUN[el][nI]
    : `${BEAST_NOUN[el][nI]} ${EPITHET[eI]}`;
  const nameEn = isElite
    ? ELITE_NOUN_EN[el][nI]
    : `${BEAST_NOUN_EN[el][nI]} ${EPITHET_EN[eI]}`;
  // Lore tiré UNE SEULE FOIS : il alimente à la fois la fiche d'ennemi et l'entrée
  // de Bestiaire. Le tirer deux fois donnait deux lores différents pour la même
  // créature, ce qui se voyait immédiatement en jeu.
  const lI = isElite ? pickI(LORE_ELITE[el]) : pickI(LORE_BEAST[el]);
  const lore   = isElite ? LORE_ELITE[el][lI]    : LORE_BEAST[el][lI];
  const loreEn = isElite ? LORE_ELITE_EN[el][lI] : LORE_BEAST_EN[el][lI];

  return {
    id: sheet.id,
    name,
    nameEn,
    lore,
    loreEn,
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
  // PAS de Math.round : un taux de 0,07% (HIDDEN) ou 0,5% (MYTHIC) tombait à 0 et
  // s'affichait « 0.00% » dans le Bestiaire — un drop bien réel passait pour impossible.
  const drops = e.loot.map(l => `{ itemId: '${l.itemId}', dropRatePct: ${+(l.dropRate * 100).toFixed(2)}, isHidden: ${byId.get(l.itemId)?.rarity === 'HIDDEN'} }`).join(', ');
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

// ── Traductions anglaises ──────────────────────────────────────────
// Les données sont écrites en FRANÇAIS et l'i18n retombe dessus quand une clé manque
// (src/i18n/index.ts). Le FR marchait donc par repli — mais en ANGLAIS, les 139
// créatures générées affichaient du texte français, nom ET lore. Le catalogue étant
// généré, ses traductions le sont aussi : même tirage, tables parallèles.
const enTs = `// ⚠ FICHIER GÉNÉRÉ — ne pas éditer à la main (\`node scripts/genEnemies.mjs\`).
// Traductions EN des créatures générées (nom + entrée de Bestiaire).
export const GENERATED_ENEMIES_EN: Record<string, string> = {
${enemies.map(e => {
  const short = e.isElite ? 'Elite encounter' : 'Hostile wildlife';
  return `  'enemy.${e.id}.name': '${esc(e.nameEn)}',\n` +
         `  'bestiary.${e.id}.shortDesc': '${short} — level ${e.level}.',\n` +
         `  'bestiary.${e.id}.lore': '${esc(e.loreEn)}',`;
}).join('\n')}
};
`;
fs.writeFileSync(path.join(ROOT, 'src', 'i18n', 'generatedEnemiesEn.ts'), enTs, 'utf8');
console.log(`traductions EN  : ${enemies.length} créatures (× 3 clés)`);
const totalLoot = enemies.reduce((s, e) => s + e.loot.length, 0);
console.log(`ennemis générés : ${enemies.length} (dont élites : ${enemies.filter(e => e.isElite).length})`);
console.log(`items orphelins : ${orphans.length} → répartis : ${placed} (fallback niveau : ${fallbacks})`);
console.log(`entrées de loot : ${totalLoot}`);
console.log(`→ ${path.relative(ROOT, OUT)}`);
