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
import * as M from './balanceModel.mjs';

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

// ── Raretés ────────────────────────────────────────────────────────
// Le BUDGET (main stat, substats, fourchettes, valeur) ne vit plus ici : il vit
// dans scripts/balanceModel.mjs, que le recalage des items écrits à la main lit
// AUSSI. C'est tout l'objet de la manœuvre : les deux moitiés du catalogue
// avaient divergé au point que la progression était inversée (un Rare tuait
// moins vite qu'un Uncommon). Deux fichiers ne peuvent plus se contredire s'ils
// lisent le même.
//
// Pas de HIDDEN ici, volontairement : dans ce projet HIDDEN ne veut pas dire
// « très rare », il veut dire « porte un passif unique » (src/data/passiveEffects.ts).
// Générer des HIDDEN sans passif diluerait le sens du palier rouge — ils restent
// écrits à la main, un par un.
const RARITY_KEYS = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];

/**
 * La rareté est CYCLIQUE, plus tirée au sort.
 *
 * Avant : un tirage pondéré (26% Common … 5% Mythic). Résultat mesuré sur le
 * catalogue réel : 6 slots sur 10 n'avaient AUCUN Mythique — un « full Mythique »
 * était donc mathématiquement impossible, et personne ne s'en était aperçu.
 * Le hasard ne garantit pas la couverture ; un cycle, si. Chaque type d'arme
 * possède désormais exactement le même nombre d'objets de chaque rareté, à
 * chaque régénération, sans exception silencieuse possible.
 *
 * La composition du catalogue n'est PAS le taux de drop : celui-ci vit dans les
 * tables de butin des ennemis (LootSystem). Rééquilibrer l'un ne touche pas
 * l'autre — c'est précisément pour ça qu'on peut se le permettre.
 */
const rarityCounters = {};
const nextRarity = (bucket) => {
  rarityCounters[bucket] = (rarityCounters[bucket] ?? 0) + 1;
  return RARITY_KEYS[(rarityCounters[bucket] - 1) % RARITY_KEYS.length];
};

// ── Profils d'armes ────────────────────────────────────────────────
// Le coefficient de dégâts par type vit maintenant dans M.TYPE_COEF (modèle) ;
// ici ne restent que l'ICONOGRAPHIE et l'aspd d'affichage.
//
// ⚠ `aspd` est de la DONNÉE MORTE pour le combat : GameScene calcule le cooldown
// d'attaque avec `ATTACK_PATTERNS[weaponType].cooldown / cs.aspd` et ne lit
// JAMAIS `weapon.attackSpeed` (seul ArsenalScene l'affiche). On la conserve pour
// l'UI, mais elle n'a aucun effet mécanique — c'est un constat, pas un choix, et
// c'est l'étape 3 (parité des armes) qui tranchera son sort.
const WEAPON_PROFILES = {
  SWORD:      { pack: 'Sword Item Icons',  sub: 'Swords',  aspd: 1.0 },
  GREATSWORD: { pack: 'Sword Item Icons',  sub: 'Swords',  aspd: 0.8 },
  DAGGER:     { pack: 'Dagger Item Icons', sub: 'Daggers', aspd: 1.7 },
  AXE:        { pack: 'Axe Item Icons',    sub: 'Axe',     aspd: 0.95 },
  HAMMER:     { pack: 'Axe Item Icons',    sub: 'Axe',     aspd: 0.7 },
  SPEAR:      { pack: 'Spear Icons 32x32 Pixelart', sub: 'Spears', aspd: 1.1 },
  STAFF:      { pack: 'Staff Item Icons',  sub: 'Staff',   aspd: 1.0 },
  BOW:        { pack: 'Bow Item Icons',    sub: null,      aspd: 1.35 },
};

// ── Substats ───────────────────────────────────────────────────────
// Les POOLS et les FOURCHETTES viennent du modèle (M.WEAPON_SUBS, M.substatRange…).
// Elles ne sont plus écrites ici : une fourchette codée en dur dans le générateur
// est une fourchette que le recalage des items manuels ne connaît pas.
//
// Biais par slot : chaque pièce garde une IDENTITÉ sans casser le budget. Une
// ligne « signature » est garantie dès UNCOMMON, tirée dans une liste courte
// propre au slot ; le reste du tirage est libre. Les bottes parlent de vitesse,
// les gants de coups critiques — mais toutes les lignes valent le même budget,
// donc aucun slot n'est mécaniquement supérieur à un autre.
const SLOT_SIGNATURE = {
  HELM:   ['ELEM_BONUS_PCT', 'HP_PCT'],
  CHEST:  ['HP_PCT', 'DEF_FLAT', 'HP_ON_KILL_FLAT'],
  LEGS:   ['DEF_FLAT', 'HP_PCT', 'SPD_FLAT'],
  BOOTS:  ['SPD_FLAT', 'DODGE_PCT'],
  GLOVES: ['CRIT_RATE', 'ATK_PCT', 'ASPD_PCT'],
  CAPE:   ['DODGE_PCT', 'ELEM_BONUS_PCT', 'SPD_FLAT'],
};

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
// `def`/`mdef`/`stats` ont disparu du profil : la défense d'une pièce découle
// désormais de son POIDS DE SLOT dans le modèle (M.armorDefense), pas d'un
// coefficient écrit ici. Ne restent que l'iconographie et le vocabulaire.
//
// Seuls HELM et CHEST sont générés : les packs d'icônes du bundle ne couvrent
// que ces deux pièces (Leather/Steel Armor + Helm). Jambières, bottes, gants,
// capes, anneaux et amulettes n'ont pas d'icônes en pack — ils restent écrits à
// la main. C'est exactement POURQUOI ce sont eux qui avaient des trous de rareté.
const ARMOR_PROFILES = {
  HELM:  { pack: 'Armory Item Icons', folders: ['Leather Helm', 'Steel Helm'], count: 30,
           fr: ['Heaume', 'Casque', 'Salade', 'Bassinet'],
           en: ['Helm', 'Helmet', 'Sallet', 'Bascinet'] },
  CHEST: { pack: 'Armory Item Icons', folders: ['Leather Armor', 'Steel Armor'], count: 30,
           fr: ['Cuirasse', 'Plastron', 'Broigne', 'Haubert'],
           en: ['Cuirass', 'Breastplate', 'Byrnie', 'Hauberk'] },

  // ── Slots SANS pack d'icônes ──────────────────────────────────
  // Jambières, bottes, gants, capes (et plus bas anneaux/amulettes) n'existent
  // dans aucun pack du bundle : ils étaient donc écrits à la main, un par un — et
  // c'est très exactement POURQUOI ce sont eux qui portaient les 13 trous de
  // rareté. Personne ne les avait comptés.
  //
  // Boucher les trous avec UN item par trou ne suffisait pas : avec un seul objet
  // par (slot × rareté), le tirage de substats de cet unique objet DEVIENT la
  // statistique du palier — il n'y a plus de moyenne. Mesuré : les PV d'un set
  // Mythique complet (1540) tombaient SOUS ceux d'un Legendary (1554), parce que
  // les six objets Mythiques uniques n'avaient, par malchance de tirage, presque
  // aucune ligne de PV. La couverture ne suffit pas : il faut de la PROFONDEUR.
  //
  // On réutilise donc les icônes déjà présentes (dette cosmétique assumée : des
  // objets partagent une image) pour générer 24 pièces par slot, soit 4 par
  // rareté. La moyenne existe à nouveau.
  LEGS:   { icons: ['item_earth_legs', 'item_fire_legs', 'item_ice_legs', 'item_iron_legs', 'item_leather_legs', 'item_lightning_legs', 'item_water_legs', 'item_wind_legs'], count: 24,
            fr: ['Jambières', 'Grèves', 'Cuissardes', 'Cuissots'],
            en: ['Greaves', 'Legguards', 'Cuisses', 'Tassets'] },
  BOOTS:  { icons: ['item_air_boots', 'item_fire_boots', 'item_iron_boots', 'item_leather_boots', 'item_serpent_boots', 'item_void_boots', 'item_voidwalker_boots', 'item_wind_boots'], count: 24,
            fr: ['Bottes', 'Brodequins', 'Solerets', 'Chausses'],
            en: ['Boots', 'Greaves', 'Sabatons', 'Treads'] },
  GLOVES: { icons: ['item_frost_gauntlets', 'item_iron_gauntlets', 'item_leather_gloves', 'item_obsidian_gauntlets', 'item_serpentgrip_gauntlets', 'item_wind_gloves'], count: 24,
            fr: ['Gantelets', 'Gants', 'Mitons', 'Poignes'],
            en: ['Gauntlets', 'Gloves', 'Mitts', 'Grips'] },
  CAPE:   { icons: ['item_dark_cape', 'item_divine_cape', 'item_eagle_cloak', 'item_earth_cape', 'item_fire_cape', 'item_ice_cape', 'item_tempest_cloak', 'item_tidal_cape', 'item_water_cape'], count: 24,
            fr: ['Cape', 'Manteau', 'Mante', 'Chape'],
            en: ['Cape', 'Cloak', 'Mantle', 'Shroud'] },
};

/** Anneaux et amulettes : type Accessory — PAS de champ `defense`. */
const ACCESSORY_PROFILES = {
  RING:   { icons: ['item_eternal_ring', 'item_flame_ring', 'item_frozen_sanctuary_ring', 'item_preservation_ring', 'item_revenant_ring', 'item_sailor_ring', 'item_shadow_ring', 'item_storm_ring', 'item_stormchain_ring', 'item_tidal_ring', 'item_tideheart_ring', 'item_wind_ring'], count: 24,
            fr: ['Anneau', 'Bague', 'Chevalière', 'Jonc'],
            en: ['Ring', 'Band', 'Signet', 'Circlet'] },
  AMULET: { icons: ['item_blizzard_amulet', 'item_runebound_amulet', 'item_tempest_amulet'], count: 24,
            fr: ['Amulette', 'Pendentif', 'Talisman', 'Médaillon'],
            en: ['Amulet', 'Pendant', 'Talisman', 'Medallion'] },
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
  // Certains packs rangent, à côté de leurs sprites, la PLANCHE DE CONTACT qui
  // les regroupe tous. Sans ce filtre elle entre dans le pool et peut être tirée
  // comme icône d'item : `item_gen_bow_dark_5` était ainsi un PNG de 512×768,
  // écrasé dans un slot de 32 px. On ne garde que ce qui a la taille d'une icône.
  return filtered.filter(isIconSized).sort();
};

/** Taille d'un PNG lue dans l'en-tête IHDR — pas de décodage de l'image. */
function isIconSized(file) {
  try {
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    return buf.readUInt32BE(16) <= 64 && buf.readUInt32BE(20) <= 64;
  } catch { return false; }
}

fs.mkdirSync(OUT_ICONS, { recursive: true });

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const usedIds = new Set();
const weapons = [];
const armors = [];
const accessories = [];
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
      // Rareté cyclique PAR TYPE D'ARME : chaque type reçoit exactement le même
      // nombre d'objets de chaque rareté. Plus de type sans Mythique.
      const rarity = nextRarity(wt);
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

      // ── Les CHIFFRES viennent de la fabrique unique du modèle ─────
      // Le générateur ne décide plus d'aucune valeur : il fournit l'éditorial.
      // C'est la MÊME fonction qu'appellent le recalage des items manuels et le
      // solveur — ils ne peuvent donc plus décrire trois items différents.
      const T = M.buildTemplate('WEAPON', rarity, { weaponType: wt, rnd });
      const lo = T.mainStat.min, hi = T.mainStat.max;
      const mainKey = T.mainKey;
      const dmg = T.damage, mdmg = T.magicDamage;
      const subs = T.substats;
      const subLine = (s) =>
        `{ key: '${s.key}', min: ${s.min}, max: ${s.max}${s.isPercentage ? ', isPercentage: true' : ''} }`;

      // `bonusStats` est VIDE, désormais, et c'est un correctif de fond.
      // StatsSystem le lit encore (str×3 → atk, vit×8 → hp, end×2 → def…) :
      // c'était un TROISIÈME canal de puissance, à côté de la main stat et des
      // substats, qu'aucun budget ne comptait. Un item pouvait donc valoir
      // beaucoup plus que sa rareté ne l'annonçait, sans que rien ne le montre.
      // Toute la puissance passe maintenant par equipRanges — visible, rollable,
      // budgétée. Le champ reste dans le type pour la compat des saves.
      const bonus = {};

      const oriI  = pickI(LORE_ORIGIN[rarity]);
      const twiI  = pickI(LORE_TWIST[element]);
      const lore   = `${LORE_ORIGIN[rarity][oriI].replace(/%Z%/g, EL_ZONE[element])} ${LORE_TWIST[element][twiI]}`;
      const loreEn = `${LORE_ORIGIN_EN[rarity][oriI].replace(/%Z%/g, EL_ZONE_EN[element])} ${LORE_TWIST_EN[element][twiI]}`;
      const desc   = `${noun} ${suffix}`.trim();
      const descEn = `${nounEn} ${suffixEn}`.trim();
      enKeys.push([id, nameEn, `${descEn}.`, loreEn]);

      weapons.push(`  { id: '${id}', name: '${esc(name)}', description: '${esc(desc)}.', rarity: ItemRarity.${rarity}, type: ItemType.WEAPON, icon: '${iconKey}', value: ${M.VALUE[rarity]}, ${element !== 'NEUTRAL' ? `element: ElementType.${element}, ` : ''}weaponType: WeaponType.${wt}, damage: ${dmg}, magicDamage: ${mdmg}, bonusStats: ${JSON.stringify(bonus)}, attackSpeed: ${prof.aspd}, lore: '${esc(lore)}', equipRanges: { mainStat: { key: '${mainKey}', min: ${lo}, max: ${hi} }, substats: [${subs.map(subLine).join(', ')}] } },`);
    }
  }
}

// ── Génération des armures ET des accessoires ──────────────────────
// Un seul corps de boucle : la seule différence entre une armure et un accessoire
// est que l'accessoire ne porte PAS de `defense` (le type Accessory n'a pas le
// champ), et que sa main stat est ATK_FLAT au lieu de HP_FLAT.
const ALL_GEAR_PROFILES = { ...ARMOR_PROFILES, ...ACCESSORY_PROFILES };
for (const [slot, prof] of Object.entries(ALL_GEAR_PROFILES)) {
  const isAccessory = slot in ACCESSORY_PROFILES;
  // Deux sources d'icônes : un PACK du bundle (on copie le PNG) ou une LISTE
  // d'icônes déjà présentes dans public/ (on les réutilise, sans copie).
  const pool = prof.icons ? null : prof.folders.flatMap(f => listPngs(prof.pack, f));
  if (pool && pool.length === 0) { console.warn(`  ! aucun PNG pour ${slot}`); continue; }
  for (let i = 0; i < prof.count; i++) {
    // Rareté cyclique par slot : couverture garantie, à chaque régénération.
    // Le tirage pondéré d'avant laissait 6 slots sur 10 sans aucun Mythique.
    const rarity = nextRarity(slot);
    const element = pick(['NEUTRAL', 'FIRE', 'ICE', 'WATER', 'LIGHTNING', 'EARTH', 'DARK']);
    const id = `gen_${slot.toLowerCase()}_${i + 1}`;
    if (usedIds.has(id)) continue;
    usedIds.add(id);

    let iconKey;
    if (prof.icons) {
      iconKey = prof.icons[Math.floor(rnd() * prof.icons.length)]; // icône réutilisée
    } else {
      iconKey = `item_${id}`;
      copyIcon(pool[Math.floor(rnd() * pool.length)], iconKey);
    }

    const nounI  = pickI(prof.fr);
    const adjI   = pickI(ADJ[rarity]);
    const useEl  = rnd() < 0.5 && !!EL_FR[element];
    const noun   = prof.fr[nounI];
    const nounEn = prof.en[nounI];
    const sfx    = useEl ? EL_FR[element] : ADJ[rarity][adjI];
    const sfxEn  = useEl ? EL_EN[element] : ADJ_EN[rarity][adjI];
    const name   = `${noun} ${sfx}`.trim().replace(/\s+/g, ' ');
    const nameEn = `${nounEn} ${sfxEn}`.trim().replace(/\s+/g, ' ');

    // ── Les CHIFFRES viennent de la fabrique unique du modèle ───────
    // ARMURE → main stat HP_FLAT (et non DEF_FLAT : StatsSystem comptait la DEF
    // DEUX FOIS — le champ `defense` ET la main stat — d'où 438 de DEF en
    // Legendary complet = 81% de réduction = un joueur invulnérable).
    // ACCESSOIRE → main stat ATK_FLAT, et AUCUN champ `defense` (le type ne l'a pas).
    const T = M.buildTemplate(slot, rarity, { rnd });
    const mainKey = T.mainKey;
    const lo = T.mainStat.min, hi = T.mainStat.max;
    const def  = T.defense ?? 0;
    const mdef = T.magicDefense ?? 0;
    const subs = T.substats;
    const subLine = (s) =>
      `{ key: '${s.key}', min: ${s.min}, max: ${s.max}${s.isPercentage ? ', isPercentage: true' : ''} }`;

    // Vide : `bonusStats` était un troisième canal de puissance non budgété
    // (end×2 → def, vit×8 → hp). Cf. la note dans la génération des armes.
    const bonus = {};

    const oriI = pickI(LORE_ORIGIN[rarity]);
    const twiI = pickI(LORE_TWIST[element]);
    const lore   = `${LORE_ORIGIN[rarity][oriI].replace(/%Z%/g, EL_ZONE[element])} ${LORE_TWIST[element][twiI]}`;
    const loreEn = `${LORE_ORIGIN_EN[rarity][oriI].replace(/%Z%/g, EL_ZONE_EN[element])} ${LORE_TWIST_EN[element][twiI]}`;
    const descEn = `${nounEn} of ${rarity === 'COMMON' ? 'ordinary' : 'fine'} make.`;
    enKeys.push([id, nameEn, descEn, loreEn]);

    // `element` était tiré mais jamais émis : le nom annonçait « de Givre » et l'item
    // sortait NEUTRAL (l'ELEM_BONUS_PCT ne se rattachait à rien de lisible).
    const common = `id: '${id}', name: '${esc(name)}', description: '${esc(noun)} de facture ${rarity === 'COMMON' ? 'ordinaire' : 'soignée'}.', rarity: ItemRarity.${rarity}, type: ItemType.${slot}, icon: '${iconKey}', value: ${M.VALUE[rarity]}, ${element !== 'NEUTRAL' ? `element: ElementType.${element}, ` : ''}`;
    const ranges = `equipRanges: { mainStat: { key: '${mainKey}', min: ${lo}, max: ${hi} }, substats: [${subs.map(subLine).join(', ')}] }`;
    if (isAccessory) {
      // Accessory n'a NI `defense` NI `magicDefense` dans le type (src/types) :
      // tout son budget passe par equipRanges.
      accessories.push(`  { ${common}bonusStats: ${JSON.stringify(bonus)}, lore: '${esc(lore)}', ${ranges} },`);
    } else {
      armors.push(`  { ${common}defense: ${def}, magicDefense: ${mdef}, bonusStats: ${JSON.stringify(bonus)}, lore: '${esc(lore)}', ${ranges} },`);
    }
  }
}

const header = `// ⚠ FICHIER GÉNÉRÉ — ne pas éditer à la main.
// Produit par \`node scripts/genItems.mjs\` à partir des packs d'icônes 32x32 du
// bundle (Sword/Dagger/Axe/Staff/Spear/Bow Item Icons, Armory Item Icons).
// Les six déclinaisons de couleur des packs sont mappées sur les éléments du jeu ;
// stats, fourchettes de roll et budget de substats suivent docs/design/LOOT_STAT_ROLLS.md.
// Pour modifier le catalogue : éditer les tables du script, puis le relancer.
import { Weapon, Armor, Accessory, ItemRarity, ItemType, WeaponType, ElementType } from '../types';

export const GENERATED_WEAPONS: Weapon[] = [
${weapons.join('\n')}
];

export const GENERATED_ARMORS: Armor[] = [
${armors.join('\n')}
];

export const GENERATED_ACCESSORIES: Accessory[] = [
${accessories.join('\n')}
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
console.log(`accessoires gén. : ${accessories.length}`);
console.log(`icônes copiées   : ${copied}`);
console.log(`→ ${path.relative(ROOT, OUT_TS)}`);
