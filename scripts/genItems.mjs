/**
 * Générateur d'items — Grievy Town's Dilemma
 * ------------------------------------------------------------------
 * Produit `src/data/itemsGenerated.ts` + copie les icônes correspondantes dans
 * `public/assets/sprites/items/`.
 *
 * Pourquoi un script plutôt que de la data écrite à la main : les packs d'icônes
 * fournissent ~3600 armes/armures en 32x32, déclinées selon SIX couleurs qui se
 * mappent proprement sur les éléments du jeu (Blue→eau/glace, Orange→feu,
 * Yellow→foudre, Purple→ténèbres, Green→terre/vent, Normal→neutre). Écrire à la
 * main les ~25 lignes de définition de chaque item serait des milliers de lignes
 * de boilerplate ; le script tient la partie mécanique (stats, fourchettes de roll,
 * budget de substats par rareté) et les tables ci-dessous tiennent la partie
 * éditoriale (noms, lore, thèmes).
 *
 * Usage : node scripts/genItems.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const BUNDLE = path.join(ROOT, 'assets', 'Bundle_extracted');
const OUT_ICONS = path.join(ROOT, 'public', 'assets', 'sprites', 'items');
const OUT_TS = path.join(ROOT, 'src', 'data', 'itemsGenerated.ts');

// ── RNG déterministe (mulberry32) — un même run produit toujours la même data,
// sinon chaque régénération réécrirait tout le catalogue et casserait les saves.
let _s = 0x9e3779b9;
const rnd = () => {
  _s |= 0; _s = (_s + 0x6d2b79f5) | 0;
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const ri = (a, b) => Math.floor(a + rnd() * (b - a + 1));

// ── Éléments par couleur de pack ───────────────────────────────────
// Chaque couleur porte deux éléments proches : on double la variété sans jamais
// mettre une icône bleue sur une arme de feu.
const COLOR_ELEMENTS = {
  Blue:   ['WATER', 'ICE'],
  Orange: ['FIRE'],
  Yellow: ['LIGHTNING'],
  Purple: ['DARK'],
  Green:  ['EARTH', 'WIND'],
  Normal: ['NEUTRAL', 'DIVINE'],
};

// ── Budget par rareté (docs/design/LOOT_STAT_ROLLS.md §2.1) ────────
// substats = TOTAL de lignes − 1 (la mainStat n'est pas comptée ici).
const RARITY = {
  COMMON:    { substats: 1, dmg: 14,  value: 40,    spread: 0.10, weight: 26 },
  UNCOMMON:  { substats: 2, dmg: 22,  value: 120,   spread: 0.15, weight: 24 },
  RARE:      { substats: 3, dmg: 32,  value: 380,   spread: 0.20, weight: 20 },
  EPIC:      { substats: 4, dmg: 46,  value: 1200,  spread: 0.25, weight: 14 },
  LEGENDARY: { substats: 5, dmg: 66,  value: 5000,  spread: 0.30, weight: 9  },
  MYTHIC:    { substats: 6, dmg: 88,  value: 12000, spread: 0.35, weight: 5  },
  // Pas de HIDDEN ici, volontairement : dans ce projet HIDDEN ne veut pas dire
  // « très rare », il veut dire « porte un passif unique game-breaking » (cf.
  // src/data/passiveEffects.ts). Générer des HIDDEN sans passif diluerait le sens
  // du palier rouge — les Hidden restent écrits à la main, un par un.
};
const RARITY_KEYS = Object.keys(RARITY);
const rollRarity = () => {
  const total = RARITY_KEYS.reduce((s, k) => s + RARITY[k].weight, 0);
  let r = rnd() * total;
  for (const k of RARITY_KEYS) { r -= RARITY[k].weight; if (r <= 0) return k; }
  return 'COMMON';
};

// ── Profils d'armes ────────────────────────────────────────────────
// dmgMult : le budget de dégâts relatif du type (cf. ATTACK_PATTERNS — une masse
// frappe fort et lentement, une dague vite et faible). magic : arme à MATK.
const WEAPON_PROFILES = {
  SWORD:      { pack: 'Sword Item Icons',  sub: 'Swords',  dmgMult: 1.00, aspd: 1.0, magic: 0.0, stats: ['str'] },
  GREATSWORD: { pack: 'Sword Item Icons',  sub: 'Swords',  dmgMult: 1.55, aspd: 0.8, magic: 0.0, stats: ['str', 'vit'] },
  DAGGER:     { pack: 'Dagger Item Icons', sub: 'Daggers', dmgMult: 0.78, aspd: 1.7, magic: 0.0, stats: ['agi', 'spd'] },
  AXE:        { pack: 'Axe Item Icons',    sub: 'Axe',     dmgMult: 1.25, aspd: 0.95, magic: 0.0, stats: ['str', 'end'] },
  HAMMER:     { pack: 'Axe Item Icons',    sub: 'Axe',     dmgMult: 1.65, aspd: 0.7, magic: 0.0, stats: ['str', 'end', 'vit'] },
  SPEAR:      { pack: 'Spear Icons 32x32 Pixelart', sub: 'Spears', dmgMult: 1.08, aspd: 1.1, magic: 0.0, stats: ['agi', 'str'] },
  STAFF:      { pack: 'Staff Item Icons',  sub: 'Staff',   dmgMult: 0.30, aspd: 1.0, magic: 1.55, stats: ['int', 'end'] },
  BOW:        { pack: 'Bow Item Icons',    sub: null,      dmgMult: 0.92, aspd: 1.35, magic: 0.0, stats: ['agi', 'int'] },
};

// ── Substats autorisées ────────────────────────────────────────────
// Armes : offensif d'abord, max 1 ligne défensive (LOOT_STAT_ROLLS §3).
const WEAPON_SUBS = [
  ['ATK_PCT', 5, 9, true], ['MATK_FLAT', 11, 23, false], ['CRIT_RATE', 4, 8, true],
  ['CRIT_DMG', 9, 19, true], ['ASPD_PCT', 7, 15, true], ['ELEM_BONUS_PCT', 7, 15, true],
  ['BOSS_DMG_PCT', 5, 9, true], ['LIFESTEAL_PCT', 3, 6, true], ['SPD_FLAT', 4, 8, false],
];
const WEAPON_DEF_SUBS = [['HP_FLAT', 41, 85, false], ['DEF_FLAT', 7, 15, false]];
// Armures : défensif d'abord, max 1 ligne offensive, jamais CRIT_DMG.
const ARMOR_SUBS = [
  ['MDEF_FLAT', 7, 15, false], ['HP_FLAT', 41, 85, false], ['HP_PCT', 5, 9, true],
  ['DEF_PCT', 5, 9, true], ['DEF_FLAT', 7, 15, false], ['MANA_FLAT', 18, 38, false],
  ['DODGE_PCT', 3, 6, true], ['SPD_FLAT', 4, 8, false], ['HP_ON_KILL_FLAT', 9, 19, false],
];
const ARMOR_OFF_SUBS = [['ATK_FLAT', 11, 23, false], ['MATK_FLAT', 11, 23, false], ['CRIT_RATE', 4, 8, true]];

// ══════════════════════════════════════════════════════════════════
// TABLES ÉDITORIALES — FR et EN en PARALLÈLE (mêmes longueurs, mêmes index)
//
// Le catalogue est généré ; le traduire à la main aurait voulu dire 486 items ×
// (nom + description + lore). On tire donc un INDEX, et on lit la même case dans
// les deux tables : l'anglais sort du générateur, gratuitement et sans dérive.
// C'est aussi ce qui garantit que les deux langues resteront synchronisées à la
// prochaine régénération.
// ══════════════════════════════════════════════════════════════════
/** Tire un INDEX (et non une valeur) — indispensable pour lire FR et EN en phase. */
const pickI = (arr) => Math.floor(rnd() * arr.length);

const EL_EN = {
  FIRE: 'of Embers', ICE: 'of Frost', WATER: 'of Tides', LIGHTNING: 'of Thunder',
  EARTH: 'of Stone', WIND: 'of the Peaks', DARK: 'of Shadows', DIVINE: 'of the Sanctuary',
  NEUTRAL: '',
};
const EL_ZONE_EN = {
  FIRE: 'Ignis Reach', ICE: 'Glaciem', WATER: 'Abyssmar', LIGHTNING: 'Volterra',
  EARTH: 'Terravast', WIND: 'the Zephyr Peaks', DARK: 'Malachar\'s Spire',
  DIVINE: 'the high sanctuaries', NEUTRAL: 'Grievy Town',
};
const WT_EN = {
  SWORD: ['Sword', 'Blade', 'Longsword', 'Falchion'],
  GREATSWORD: ['Greatsword', 'Great Blade', 'Colossus', 'Reaper'],
  DAGGER: ['Dagger', 'Stiletto', 'Shiv', 'Fang'],
  AXE: ['Axe', 'Hatchet', 'Cleaver', 'Bardiche'],
  HAMMER: ['Mace', 'Hammer', 'Mallet', 'Bludgeon'],
  SPEAR: ['Spear', 'Pike', 'Boar Spear', 'Halberd', 'Voulge'],
  STAFF: ['Staff', 'Sceptre', 'Crozier', 'Rod'],
  BOW: ['Bow', 'Longbow', 'Crossbow', 'Short Bow'],
};
const ADJ_EN = {
  COMMON: ['of the Militia', 'of the Barracks', 'of Makeshift', 'of the Ranks', 'of the Garrison'],
  UNCOMMON: ['of the Veteran', 'of the Watch', 'of the Campaign', 'of the Sergeant', 'of Ashford'],
  RARE: ['of the Rampart', 'of the Oath', 'of the March', 'of the Watcher', 'of the Convoy'],
  EPIC: ['of the Godhunter', 'of the Heretic', 'of the Last Circle', 'of Exile', 'of the Schism'],
  LEGENDARY: ['of the Collapse', 'of the Six', 'of the Great Silence', 'of the White Dawn'],
  MYTHIC: ['from Before the Sundering', 'of the Lost Name', 'of the First Hour'],
  HIDDEN: ['That Has No Name', 'No One Forged', 'of Refusal'],
};
const LORE_ORIGIN_EN = {
  COMMON: ['Turned out by the batch from the forges of %Z%, back when things were still ordered by the batch.', 'The kind of weapon you hand someone without asking their name.', 'Pulled off a rack in %Z%, between two that were worth nothing.'],
  UNCOMMON: ['An armourer in %Z% reworked it three times before calling it good.', 'It saw a full campaign, and came back from it.', 'Struck at the heel with a %Z% maker\'s mark no one stamps anymore.'],
  RARE: ['It was found buried in a door in %Z% — from the wrong side.', 'It changed hands four times, and every time out of necessity.', 'The last one to carry it never came back from %Z%. It did.'],
  EPIC: ['Forged in %Z% by someone who knew exactly what it would be used against.', 'It bears a notch the metal should not have been able to take.', 'The archives of %Z% mention it once, then never again.'],
  LEGENDARY: ['It is older than the charter of %Z%, and probably older than %Z% itself.', 'No smith claims it — and none dares say they could have made it.', 'It outlived the one who made it, the one who carried it, and the house of both.'],
  MYTHIC: ['It predates the sundering of the world between the six, when the elements had not yet learned to keep apart.', 'Ovan files it among the "antecedent" objects, and refuses to elaborate.', 'The metal matches no known vein in Velmara.'],
  HIDDEN: ['You do not forge it, you do not find it — it appears to those who have already accepted what it means.', 'It is mentioned nowhere, which to Ovan is precisely the problem.', 'It has been refused by everyone it offered itself to. Almost everyone.'],
};
const LORE_TWIST_EN = {
  FIRE: ['What it cuts goes on burning long after the blade has left.', 'The heat does not come from the metal. It comes from what the metal decided.'],
  ICE: ['The frost on it has never melted, not even against skin.', 'You do not fight the cold. You wait for it to finish.'],
  WATER: ['It is damp to the touch, always, even after years kept dry.', 'The tide loses nothing. It gives back, later, and heavier.'],
  LIGHTNING: ['It strikes before you have decided to strike; the arm follows, always a little late.', 'Volterra\'s lightning never strikes once — it checks its work.'],
  EARTH: ['It does not shatter defences: it acts as though they were never there.', 'The weight is not a burden. It is the argument.'],
  WIND: ['You do not carry it, you follow it — it decides the distance before you think of it.', 'The wind of the peaks has never had a dead moment. Neither has this.'],
  DARK: ['What it takes, it keeps; what it keeps, it returns only to its bearer.', 'Shadow has no edge. That is far worse.'],
  DIVINE: ['It was not made by a god: it was made to judge one.', 'The light it gives back illuminates nothing. It points.'],
  NEUTRAL: ['Nothing remarkable about it, except that it is still here.', 'It promises nothing. That is already more than most.'],
};

// ── Tables éditoriales (FR) ────────────────────────────────────────
const EL_FR = {
  FIRE: 'de Braise', ICE: 'de Givre', WATER: 'des Marées', LIGHTNING: 'de Foudre',
  EARTH: 'de Roche', WIND: 'des Cimes', DARK: 'des Ombres', DIVINE: 'du Sanctuaire',
  NEUTRAL: '',
};
const EL_ZONE = {
  FIRE: 'Ignis Reach', ICE: 'Glaciem', WATER: 'Abyssmar', LIGHTNING: 'Volterra',
  EARTH: 'Terravast', WIND: 'les Zephyr Peaks', DARK: 'la Spire de Malachar',
  DIVINE: 'les hauts sanctuaires', NEUTRAL: 'Grievy Town',
};
const WT_FR = {
  SWORD: ['Épée', 'Lame', 'Estramaçon', 'Braquemart'],
  GREATSWORD: ['Espadon', 'Grande Lame', 'Colosse', 'Fauchoir'],
  DAGGER: ['Dague', 'Stylet', 'Surin', 'Croc'],
  AXE: ['Hache', 'Cognée', 'Fendoir', 'Doloire'],
  HAMMER: ['Masse', 'Marteau', 'Maillet', 'Massue'],
  SPEAR: ['Lance', 'Pique', 'Épieu', 'Hallebarde', 'Vouge'],
  STAFF: ['Bâton', 'Sceptre', 'Crosse', 'Férule'],
  BOW: ['Arc', 'Long-Arc', 'Arbalète', 'Arc Court'],
};
const ADJ = {
  COMMON: ['de la Milice', 'de Caserne', 'de Fortune', 'du Rang', 'de Garnison'],
  UNCOMMON: ['du Vétéran', 'du Guet', 'de Campagne', 'du Sergent', 'd\'Ashford'],
  RARE: ['du Rempart', 'du Serment', 'de la Marche', 'du Veilleur', 'du Convoi'],
  EPIC: ['du Chasseur de Dieux', 'de l\'Hérétique', 'du Dernier Cercle', 'de l\'Exil', 'du Schisme'],
  LEGENDARY: ['de l\'Effondrement', 'des Six', 'du Grand Silence', 'de l\'Aube Blanche'],
  MYTHIC: ['d\'Avant le Partage', 'du Nom Perdu', 'de la Première Heure'],
  HIDDEN: ['qui n\'a pas de Nom', 'que nul n\'a forgée', 'du Refus'],
};
// Fragments de lore — assemblés en 2 phrases : une origine + une chute.
const LORE_ORIGIN = {
  COMMON: ['Sortie par lots des fourneaux de %Z%, du temps où l\'on commandait encore par lots.', 'Le genre d\'arme qu\'on remet à quelqu\'un sans lui demander son nom.', 'Récupérée sur un râtelier de %Z%, entre deux qui ne valaient rien.'],
  UNCOMMON: ['Un armurier de %Z% l\'a reprise trois fois avant de la juger correcte.', 'Elle a fait une campagne entière et en est revenue.', 'Marquée au talon d\'un poinçon de %Z% qu\'on ne frappe plus.'],
  RARE: ['On l\'a retrouvée plantée dans une porte de %Z%, du mauvais côté.', 'Elle a changé de main quatre fois, et chaque fois par nécessité.', 'Le dernier à l\'avoir portée n\'est pas revenu de %Z%, mais elle, si.'],
  EPIC: ['Forgée à %Z% par quelqu\'un qui savait exactement contre quoi elle servirait.', 'Elle porte une entaille que le métal n\'aurait pas dû pouvoir encaisser.', 'Les archives de %Z% en parlent une fois, puis plus jamais.'],
  LEGENDARY: ['Elle est plus vieille que la charte de %Z%, et probablement que %Z% elle-même.', 'Nul forgeron ne la revendique — et aucun n\'ose dire qu\'il en serait capable.', 'Elle a survécu à celui qui l\'a faite, à celui qui l\'a portée, et à la maison des deux.'],
  MYTHIC: ['Elle date d\'avant le partage du monde entre les six, quand les éléments ne savaient pas encore se tenir séparés.', 'Ovan la range parmi les objets « antérieurs », et refuse de développer.', 'Le métal ne correspond à aucune veine connue de Velmara.'],
  HIDDEN: ['On ne la forge pas, on ne la trouve pas — elle apparaît à ceux qui ont déjà accepté ce qu\'elle implique.', 'Elle n\'est mentionnée nulle part, ce qui, pour Ovan, est précisément le problème.', 'Elle a été refusée par tous ceux à qui elle s\'est offerte. Presque tous.'],
};
const LORE_TWIST = {
  FIRE: ['Ce qu\'elle entaille continue de brûler bien après qu\'elle est repartie.', 'La chaleur ne vient pas du métal. Elle vient de ce qu\'il a décidé.'],
  ICE: ['Le givre qui la couvre n\'a jamais fondu, pas même contre la peau.', 'On ne se bat pas contre le froid. On attend qu\'il ait fini.'],
  WATER: ['Elle est humide au toucher, toujours, même après des années au sec.', 'La marée ne perd rien. Elle rend, plus tard, et plus lourd.'],
  LIGHTNING: ['Elle frappe avant que tu aies décidé de frapper ; le bras suit, toujours un peu en retard.', 'La foudre de Volterra ne frappe jamais une seule fois — elle vérifie son travail.'],
  EARTH: ['Elle ne fracasse pas les défenses : elle fait comme si elles n\'existaient pas.', 'Le poids n\'est pas une gêne. C\'est l\'argument.'],
  WIND: ['On ne la porte pas, on la suit — elle décide de la distance avant que tu y penses.', 'Le vent des cimes n\'a jamais eu de temps mort. Elle non plus.'],
  DARK: ['Ce qu\'elle prend, elle le garde ; ce qu\'elle garde, elle ne le rend qu\'à son porteur.', 'L\'ombre n\'a pas de tranchant. C\'est bien pire.'],
  DIVINE: ['Elle n\'a pas été faite par un dieu : elle a été faite pour en juger un.', 'La lumière qu\'elle rend n\'éclaire rien. Elle désigne.'],
  NEUTRAL: ['Rien d\'extraordinaire, sinon qu\'elle est encore là.', 'Elle ne promet rien. C\'est déjà plus que la plupart.'],
};

// ── Armures ────────────────────────────────────────────────────────
const ARMOR_PROFILES = {
  HELM:  { pack: 'Armory Item Icons', folders: ['Leather Helm', 'Steel Helm'],   def: 0.55, mdef: 0.60,
           fr: ['Heaume', 'Casque', 'Salade', 'Bassinet'],
           en: ['Helm', 'Helmet', 'Sallet', 'Bascinet'], stats: ['end', 'int'] },
  CHEST: { pack: 'Armory Item Icons', folders: ['Leather Armor', 'Steel Armor'], def: 1.00, mdef: 0.85,
           fr: ['Cuirasse', 'Plastron', 'Broigne', 'Haubert'],
           en: ['Cuirass', 'Breastplate', 'Byrnie', 'Hauberk'], stats: ['end', 'vit'] },
};

/**
 * Liste récursivement les PNG d'un pack. Les packs du bundle ont un niveau de
 * dossier DUPLIQUÉ (`Sword Item Icons/Sword Item Icons/Swords Blue/…`) — on ne
 * reconstruit donc jamais un chemin à la main : on marche tout le pack et on
 * filtre sur le nom de dossier recherché.
 */
const listPngs = (packDir, folderFilter = null) => {
  const abs = path.join(BUNDLE, packDir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.toLowerCase().endsWith('.png')) out.push(p);
    }
  };
  walk(abs);
  const filtered = folderFilter
    ? out.filter(p => path.basename(path.dirname(p)).toLowerCase() === folderFilter.toLowerCase())
    : out;
  return filtered.sort();
};

fs.mkdirSync(OUT_ICONS, { recursive: true });

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const usedIds = new Set();
const weapons = [];
const armors = [];
/** [id, nameEn, descriptionEn, loreEn] — alimente src/i18n/generatedEn.ts. */
const enKeys = [];
let copied = 0;

const copyIcon = (src, key) => {
  const dest = path.join(OUT_ICONS, `${key}.png`);
  if (!fs.existsSync(dest)) { fs.copyFileSync(src, dest); copied++; }
};

// ── Génération des armes ───────────────────────────────────────────
// Nombre d'items par (type d'arme × couleur). 8 types × 6 couleurs × N.
const PER_BUCKET = 7;

for (const [wt, prof] of Object.entries(WEAPON_PROFILES)) {
  for (const [color, elements] of Object.entries(COLOR_ELEMENTS)) {
    // Le pack d'arcs n'est pas décliné en couleurs (dossier plat "Single Sprites").
    let pool = [];
    if (!prof.sub) {
      pool = listPngs(prof.pack);
    } else {
      pool = listPngs(prof.pack, `${prof.sub} ${color}`);
      // Le pack de dagues nomme un dossier "Dagger Purple" (singulier) au lieu de
      // "Daggers Purple" — on retente au singulier avant d'abandonner.
      if (pool.length === 0) pool = listPngs(prof.pack, `${prof.sub.replace(/s$/, '')} ${color}`);
    }
    if (pool.length === 0) { console.warn(`  ! aucun PNG pour ${wt} / ${color}`); continue; }

    for (let i = 0; i < PER_BUCKET; i++) {
      const element = pick(elements);
      const rarity = rollRarity();
      const R = RARITY[rarity];
      // Tirage par INDEX : la même case est lue dans la table FR et dans la table EN,
      // donc les deux langues sortent en phase, sans traduction manuelle.
      const nounI = pickI(WT_FR[wt]);
      const adjI  = pickI(ADJ[rarity]);
      const useElem = rnd() < 0.55 && !!EL_FR[element];
      const noun    = WT_FR[wt][nounI];
      const nounEn  = WT_EN[wt][nounI];
      const suffix   = useElem ? EL_FR[element] : ADJ[rarity][adjI];
      const suffixEn = useElem ? EL_EN[element] : ADJ_EN[rarity][adjI];
      const name   = `${noun} ${suffix}`.trim().replace(/\s+/g, ' ');
      const nameEn = `${nounEn} ${suffixEn}`.trim().replace(/\s+/g, ' ');

      const id = `gen_${wt.toLowerCase()}_${element.toLowerCase()}_${i + 1}`;
      if (usedIds.has(id)) continue;
      usedIds.add(id);

      const iconKey = `item_${id}`;
      copyIcon(pool[Math.floor(rnd() * pool.length)], iconKey);

      const isMagic = prof.magic > 0;
      const dmg = Math.max(1, Math.round(R.dmg * prof.dmgMult));
      const mdmg = isMagic ? Math.round(R.dmg * prof.magic) : Math.round(dmg * 0.45);
      const mainKey = isMagic ? 'MATK_FLAT' : 'ATK_FLAT';
      const mainVal = isMagic ? mdmg : dmg;
      const lo = Math.max(1, Math.round(mainVal * (1 - R.spread)));
      const hi = Math.round(mainVal * (1 + R.spread));

      // Substats : offensives, + au plus 1 défensive.
      // JAMAIS la clé de la mainStat, ni deux fois la même clé : StatsSystem
      // additionne mainStat ET substats dans le même total (collectEquipTotals),
      // donc une clé dupliquée sort l'item de la fourchette annoncée (double-dip)
      // et StatRollSystem.validateItemRanges la signale comme une erreur de data.
      const subs = [];
      const taken = new Set([mainKey]);
      const takeFrom = (poolArr) => {
        const cands = poolArr.filter(s => !taken.has(s[0]));
        if (cands.length === 0) return null;
        const s = cands[Math.floor(rnd() * cands.length)];
        taken.add(s[0]);
        return s;
      };
      const nDef = R.substats >= 4 && rnd() < 0.6 ? 1 : 0;
      for (let k = 0; k < R.substats - nDef; k++) {
        const s = takeFrom(WEAPON_SUBS);
        if (s) subs.push(s);
      }
      if (nDef) { const s = takeFrom(WEAPON_DEF_SUBS); if (s) subs.push(s); }
      // Si le pool s'est épuisé (rareté haute), on complète pour tenir le compte
      // exigé par SUBSTAT_COUNT_BY_RARITY.
      while (subs.length < R.substats) {
        const s = takeFrom([...WEAPON_SUBS, ...WEAPON_DEF_SUBS]);
        if (!s) break;
        subs.push(s);
      }

      const bonus = {};
      for (const s of prof.stats) bonus[s] = Math.max(1, Math.round(R.dmg / 12));

      const oriI  = pickI(LORE_ORIGIN[rarity]);
      const twiI  = pickI(LORE_TWIST[element]);
      const lore   = `${LORE_ORIGIN[rarity][oriI].replace(/%Z%/g, EL_ZONE[element])} ${LORE_TWIST[element][twiI]}`;
      const loreEn = `${LORE_ORIGIN_EN[rarity][oriI].replace(/%Z%/g, EL_ZONE_EN[element])} ${LORE_TWIST_EN[element][twiI]}`;
      const desc   = `${noun} ${suffix}`.trim();
      const descEn = `${nounEn} ${suffixEn}`.trim();
      enKeys.push([id, nameEn, `${descEn}.`, loreEn]);

      weapons.push(`  { id: '${id}', name: '${esc(name)}', description: '${esc(desc)}.', rarity: ItemRarity.${rarity}, type: ItemType.WEAPON, icon: '${iconKey}', value: ${R.value}, ${element !== 'NEUTRAL' ? `element: ElementType.${element}, ` : ''}weaponType: WeaponType.${wt}, damage: ${dmg}, magicDamage: ${mdmg}, bonusStats: ${JSON.stringify(bonus)}, attackSpeed: ${prof.aspd}, lore: '${esc(lore)}', equipRanges: { mainStat: { key: '${mainKey}', min: ${lo}, max: ${hi} }, substats: [${subs.map(([k, a, b, p]) => `{ key: '${k}', min: ${ri(a, Math.round((a + b) / 2))}, max: ${ri(Math.round((a + b) / 2), b)}${p ? ', isPercentage: true' : ''} }`).join(', ')}] } },`);
    }
  }
}

// ── Génération des armures ─────────────────────────────────────────
for (const [slot, prof] of Object.entries(ARMOR_PROFILES)) {
  const pool = prof.folders.flatMap(f => listPngs(prof.pack, f));
  if (pool.length === 0) { console.warn(`  ! aucun PNG pour l'armure ${slot}`); continue; }
  for (let i = 0; i < 28; i++) {
    const rarity = rollRarity();
    const R = RARITY[rarity];
    const element = pick(['NEUTRAL', 'FIRE', 'ICE', 'WATER', 'LIGHTNING', 'EARTH', 'DARK']);
    const id = `gen_${slot.toLowerCase()}_${i + 1}`;
    if (usedIds.has(id)) continue;
    usedIds.add(id);

    const iconKey = `item_${id}`;
    copyIcon(pool[Math.floor(rnd() * pool.length)], iconKey);

    const nounI  = pickI(prof.fr);
    const adjI   = pickI(ADJ[rarity]);
    const useEl  = rnd() < 0.5 && !!EL_FR[element];
    const noun   = prof.fr[nounI];
    const nounEn = prof.en[nounI];
    const sfx    = useEl ? EL_FR[element] : ADJ[rarity][adjI];
    const sfxEn  = useEl ? EL_EN[element] : ADJ_EN[rarity][adjI];
    const name   = `${noun} ${sfx}`.trim().replace(/\s+/g, ' ');
    const nameEn = `${nounEn} ${sfxEn}`.trim().replace(/\s+/g, ' ');
    const def = Math.max(1, Math.round(R.dmg * prof.def));
    const mdef = Math.max(1, Math.round(R.dmg * prof.mdef));
    const mainVal = Math.max(4, Math.round(def * 0.45));
    const lo = Math.max(1, Math.round(mainVal * (1 - R.spread)));
    const hi = Math.round(mainVal * (1 + R.spread));

    // Même règle que pour les armes : jamais la clé de la mainStat (DEF_FLAT ici),
    // jamais deux fois la même clé — sinon double-dip dans collectEquipTotals.
    const subs = [];
    const taken = new Set(['DEF_FLAT']);
    const takeFrom = (poolArr) => {
      const cands = poolArr.filter(s => !taken.has(s[0]));
      if (cands.length === 0) return null;
      const s = cands[Math.floor(rnd() * cands.length)];
      taken.add(s[0]);
      return s;
    };
    const nOff = R.substats >= 4 && rnd() < 0.5 ? 1 : 0;
    for (let k = 0; k < R.substats - nOff; k++) {
      const s = takeFrom(ARMOR_SUBS);
      if (s) subs.push(s);
    }
    if (nOff) { const s = takeFrom(ARMOR_OFF_SUBS); if (s) subs.push(s); }
    while (subs.length < R.substats) {
      const s = takeFrom([...ARMOR_SUBS, ...ARMOR_OFF_SUBS]);
      if (!s) break;
      subs.push(s);
    }

    const bonus = {};
    for (const s of prof.stats) bonus[s] = Math.max(1, Math.round(R.dmg / 14));

    const oriI = pickI(LORE_ORIGIN[rarity]);
    const twiI = pickI(LORE_TWIST[element]);
    const lore   = `${LORE_ORIGIN[rarity][oriI].replace(/%Z%/g, EL_ZONE[element])} ${LORE_TWIST[element][twiI]}`;
    const loreEn = `${LORE_ORIGIN_EN[rarity][oriI].replace(/%Z%/g, EL_ZONE_EN[element])} ${LORE_TWIST_EN[element][twiI]}`;
    const descEn = `${nounEn} of ${rarity === 'COMMON' ? 'ordinary' : 'fine'} make.`;
    enKeys.push([id, nameEn, descEn, loreEn]);

    // `element` était tiré mais jamais émis : le nom annonçait « de Givre » et l'item
    // sortait NEUTRAL (l'ELEM_BONUS_PCT ne se rattachait à rien de lisible).
    armors.push(`  { id: '${id}', name: '${esc(name)}', description: '${esc(noun)} de facture ${rarity === 'COMMON' ? 'ordinaire' : 'soignée'}.', rarity: ItemRarity.${rarity}, type: ItemType.${slot}, icon: '${iconKey}', value: ${R.value}, ${element !== 'NEUTRAL' ? `element: ElementType.${element}, ` : ''}defense: ${def}, magicDefense: ${mdef}, bonusStats: ${JSON.stringify(bonus)}, lore: '${esc(lore)}', equipRanges: { mainStat: { key: 'DEF_FLAT', min: ${lo}, max: ${hi} }, substats: [${subs.map(([k, a, b, p]) => `{ key: '${k}', min: ${ri(a, Math.round((a + b) / 2))}, max: ${ri(Math.round((a + b) / 2), b)}${p ? ', isPercentage: true' : ''} }`).join(', ')}] } },`);
  }
}

const header = `// ⚠ FICHIER GÉNÉRÉ — ne pas éditer à la main.
// Produit par \`node scripts/genItems.mjs\` à partir des packs d'icônes 32x32 du
// bundle (Sword/Dagger/Axe/Staff/Spear/Bow Item Icons, Armory Item Icons).
// Les six déclinaisons de couleur des packs sont mappées sur les éléments du jeu ;
// stats, fourchettes de roll et budget de substats suivent docs/design/LOOT_STAT_ROLLS.md.
// Pour modifier le catalogue : éditer les tables du script, puis le relancer.
import { Weapon, Armor, ItemRarity, ItemType, WeaponType, ElementType } from '../types';

export const GENERATED_WEAPONS: Weapon[] = [
${weapons.join('\n')}
];

export const GENERATED_ARMORS: Armor[] = [
${armors.join('\n')}
];
`;

fs.writeFileSync(OUT_TS, header, 'utf8');

// ── Traductions anglaises ──────────────────────────────────────────
// Les données du jeu sont écrites en FRANÇAIS et l'i18n retombe dessus quand une clé
// manque (cf. src/i18n/index.ts : `lookup(key) ?? item.name`). Le français marchait
// donc « par accident » — mais en ANGLAIS, les 486 items générés affichaient du
// texte français. Le catalogue étant généré, ses traductions le sont aussi : même
// tirage, tables parallèles, zéro dérive possible entre les deux langues.
const enTs = `// ⚠ FICHIER GÉNÉRÉ — ne pas éditer à la main (\`node scripts/genItems.mjs\`).
// Traductions EN du catalogue généré. Le FR vit dans les données elles-mêmes
// (src/data/itemsGenerated.ts) et l'i18n y retombe naturellement.
export const GENERATED_ITEMS_EN: Record<string, string> = {
${enKeys.map(([id, n, d, l]) =>
  `  'item.${id}.name': '${esc(n)}',\n  'item.${id}.description': '${esc(d)}',\n  'item.${id}.lore': '${esc(l)}',`
).join('\n')}
};
`;
fs.writeFileSync(path.join(ROOT, 'src', 'i18n', 'generatedItemsEn.ts'), enTs, 'utf8');

console.log(`traductions EN   : ${enKeys.length} items (× 3 clés)`);
console.log(`armes générées   : ${weapons.length}`);
console.log(`armures générées : ${armors.length}`);
console.log(`icônes copiées   : ${copied}`);
console.log(`→ ${path.relative(ROOT, OUT_TS)}`);
