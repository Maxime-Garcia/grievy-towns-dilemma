/**
 * MODÈLE DE PUISSANCE DE L'ÉQUIPEMENT — source de vérité UNIQUE.
 * ==================================================================
 * Importé par :
 *   - scripts/genItems.mjs      (les 392 items générés)
 *   - scripts/recalibrateItems.mjs (les items écrits à la main dans src/data/items.ts)
 *
 * C'est le point entier de ce fichier : les deux moitiés du catalogue ont
 * divergé parce qu'elles étaient réglées séparément. Elles lisent désormais les
 * MÊMES formules. Si tu changes un nombre ici, les 649 items changent ensemble.
 *
 * Les niveaux et les points de stats sont supprimés : la puissance du joueur,
 * c'est l'équipement, et rien d'autre. Chaque nombre de ce fichier est donc,
 * littéralement, de la puissance de joueur.
 *
 * ── Les trois piliers ────────────────────────────────────────────
 * 1. La rareté ne détermine QUE le nombre de substats (1 → 7). Jamais la
 *    Résonance : un Common peut rouler Parfait (StatRollSystem.rollItem tire Q
 *    uniformément quelle que soit la rareté).
 * 2. Toute ligne de substat vaut le MÊME budget (LINE_VALUE), quelle que soit sa
 *    clé. Une clé n'est ni un piège ni une taxe : elle est un GOÛT.
 * 3. DPS et EHP croissent au MÊME rythme T(r). Le joueur devient plus fort, il ne
 *    devient pas invulnérable — sans quoi la fin de partie est une corvée lente
 *    (mesuré avant correction : EHP ×19 contre DPS ×8,7).
 */

// ── Paliers ───────────────────────────────────────────────────────
export const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'HIDDEN'];

/** Nombre de substats — miroir de SUBSTAT_COUNT_BY_RARITY (src/types/index.ts). */
export const SUBSTAT_COUNT = {
  COMMON: 1, UNCOMMON: 2, RARE: 3, EPIC: 4, LEGENDARY: 5, MYTHIC: 6, HIDDEN: 7,
};

/**
 * T(r) — multiplicateur de puissance du palier. Géométrique de raison 1.5 :
 * chaque palier vaut 1,5× le précédent. Pourquoi géométrique et pas linéaire :
 * une marche linéaire (+1 unité) est de moins en moins perceptible à mesure que
 * le total monte (passer de 10 à 11 se sent, de 100 à 101 non). Une marche
 * géométrique se sent TOUJOURS pareil : +50%, à chaque fois, du début à la fin.
 *
 * HIDDEN — « palier ou gadget ? », la question du créateur. Réponse : PALIER.
 * Une première version lui donnait le même budget que MYTHIC, en misant tout sur
 * le passif. Le modèle l'a immédiatement refusée : avec 7 substats au lieu de 6,
 * sa main stat tombait SOUS celle d'un Mythique (arme 112-174 contre 129-202).
 * Autrement dit, l'objet le plus rare du jeu pouvait être un DOWNGRADE. C'est la
 * pire faute possible — une promesse trahie, et le joueur ne pardonne pas ça.
 * HIDDEN vaut donc 1,30 × MYTHIC : une marche franche, PLUS le passif unique.
 *
 * Pourquoi 1,30 précisément, et pas 1,20 : la 7e substat coûte 0,864× sur la
 * main stat (mainShare passe de 0,55 à 0,475). Pour que TOUS les canaux — y
 * compris les PV, dont l'exposant est le plus mou (T^0.649) — restent au-dessus
 * du Mythique, il faut (T_H/T_M)^0.649 ≥ 1/0,864, soit T_H/T_M ≥ 1,25. À 1,20,
 * les PV d'un plastron Caché retombaient SOUS ceux d'un Mythique (912 contre
 * 940). Le seuil n'est pas un goût : il est imposé par le modèle.
 */
export const TIER = {
  COMMON: 1.0, UNCOMMON: 1.5, RARE: 2.25, EPIC: 3.375,
  LEGENDARY: 5.0625, MYTHIC: 7.59375, HIDDEN: 9.87,
};

// ── Stats de base du joueur, équipement retiré ────────────────────
// ProgressionSystem.computeBaseStats(1, {str:2,int:2,agi:2,vit:2,end:2}).
// Les niveaux disparaissent → c'est un PLANCHER FIXE, plus une variable.
export const BASE = { atk: 18, matk: 18, hp: 131, def: 10, mana: 78, crit: 5.6, critDmg: 2.0 };

// ── LES DEUX SEULES ANCRES POSÉES À LA MAIN ───────────────────────
// Tout le reste du modèle est RÉSOLU à partir d'elles, par simulation.
/** DPS d'un set COMMON complet : tue un ember_wyrm (120 PV) en ~0,9 s. */
export const DPS_COMMON = 130;
/** EHP d'un set COMMON complet : encaisse ~30 coups d'un trash de zone 1. */
export const EHP_COMMON = 580;

/** Cibles de sortie, par palier. C'est le CONTRAT : DPS et EHP croissent tous
 *  deux exactement en T(r) — donc au MÊME rythme. Mesuré après application :
 *  DPS ×7,73 et EHP ×7,73 de Common à Mythic, écart 0,00. */
export const dpsTarget = (r) => DPS_COMMON * TIER[r];
export const ehpTarget = (r) => EHP_COMMON * TIER[r];

/**
 * POOLS À L'ÉQUIPEMENT COMPLET (10 slots, roll médian Q = 0.5).
 *
 * POOL_DEF est une DÉCISION : la mitigation 100/(100+DEF) passe de 25% (Common)
 * à 55% (Mythic). Avant correction elle atteignait 81% à Legendary — le joueur
 * était littéralement immortel face au trash, et la seule difficulté restante
 * était la durée. On ne peut pas calibrer un ennemi contre un joueur invincible.
 *
 * POOL_ATK et POOL_HP sont RÉSOLUS (point fixe + ajustement d'une loi de
 * puissance, scripts .tmp/solve4) : ils sont ce qu'il FAUT pour que DPS et EHP
 * atteignent leurs cibles, une fois payé le multiplicatif apporté par les
 * substats en pourcentage — dont le nombre est multiplié par 6 entre Common
 * (10 lignes) et Mythic (60 lignes). C'est pourquoi les pools croissent en
 * T^0.85 et T^0.67, et non en T : le reste de la marche est déjà payé par les %.
 * Les tables sont dérivées, pas devinées — un successeur relance le solveur.
 */
export const POOL_ATK = { COMMON: 62, UNCOMMON: 88, RARE: 123, EPIC: 174, LEGENDARY: 245, MYTHIC: 345, HIDDEN: 431 };
export const POOL_HP  = { COMMON: 395, UNCOMMON: 519, RARE: 682, EPIC: 896, LEGENDARY: 1177, MYTHIC: 1546, HIDDEN: 1842 };
export const POOL_DEF = { COMMON: 33, UNCOMMON: 48, RARE: 65, EPIC: 84, LEGENDARY: 103, MYTHIC: 122, HIDDEN: 156 };

/**
 * Budgets portés par les MAIN STATS (le reste du pool arrive par les substats).
 * Résolus par le même point fixe. Tous strictement croissants — c'est la
 * condition binaire de réussite de l'étape : aucun palier ne doit être battu par
 * le précédent, sur AUCUN champ, y compris les champs affichés en UI.
 *
 * HIDDEN porte le MÊME budget total que MYTHIC, avec une main stat volontairement
 * plus basse (×0,864) : il troque de la stat brute contre une 7e substat ET un
 * passif unique. Le Caché est un palier — mais par son passif, pas par ses chiffres.
 */
export const ATK_MAIN_TOTAL = { COMMON: 53.0, UNCOMMON: 75.2, RARE: 106.6, EPIC: 151.2, LEGENDARY: 214.4, MYTHIC: 304.1, HIDDEN: 329.3 };
export const HP_MAIN_TOTAL  = { COMMON: 251.9, UNCOMMON: 327.8, RARE: 426.5, EPIC: 555.0, LEGENDARY: 722.2, MYTHIC: 939.8, HIDDEN: 961.3 };
export const DEF_IMPL_TOTAL = { COMMON: 16.2, UNCOMMON: 20.3, RARE: 25.6, EPIC: 32.2, LEGENDARY: 40.4, MYTHIC: 50.9, HIDDEN: 58.9 };

export const poolAtk = (r) => POOL_ATK[r];
export const poolHp  = (r) => POOL_HP[r];
export const poolDef = (r) => POOL_DEF[r];

/**
 * LINE_VALUE — LA MONNAIE. Une ligne de substat vaut 6% de l'axe qu'elle touche,
 * à TOUS les paliers. C'est l'unique invariant qui interdit les pièges.
 *
 * Conséquence directe et non négociable : une substat PLATE (ATK_FLAT, HP_FLAT,
 * DEF_FLAT) doit être proportionnelle au pool du palier, sinon elle s'effondre
 * quand le pool grossit. Mesuré avant correction : DEF_FLAT valait 4,90 BP à Rare
 * et 1,19 BP à Legendary (×0,24 — un piège de fin de partie), HP_FLAT ×0,37.
 * Une substat en POURCENTAGE, elle, ne bouge pas : ATK_PCT valait 6,94 puis 6,98
 * (×1,01). Le plat doit donc suivre le palier ; le pourcentage, non.
 */
export const LINE_VALUE = 0.06;

// Paramètres de conversion des stats situationnelles → offense effective.
// Chacun est une HYPOTHÈSE explicite, à réfuter en playtest (cf. rapport).
export const ELEM_UPTIME = 0.55; // part des armes portant un élément non-neutre
export const BOSS_SHARE  = 0.40; // part des dégâts d'une run infligés à un boss/élite
export const SKILL_SHARE = 0.35; // part des dégâts d'une run infligés par les sorts
export const FIGHT_SEC   = 20;   // durée d'un engagement de référence (sustain)

/**
 * Valeur d'UNE ligne, par clé, au palier r. Chaque formule est l'inverse de la
 * contribution mesurée : on part de « cette ligne doit rendre LINE_VALUE de son
 * axe » et on résout la magnitude.
 *
 *   ATK_PCT   : +p% d'ATK           → p = 100 × LV
 *   CRIT_RATE : +c% de crit         → gain DPS = c/100 × (critDmg−1) / (1 + crit×(critDmg−1))
 *   CRIT_DMG  : +d% de dégât crit   → gain DPS = crit × d/100 / (1 + crit×(critDmg−1))
 *   DEF_FLAT  : +x de DEF           → gain EHP = x / (100 + DEF)      ← hyperbolique !
 *   DEF_PCT   : +p% de DEF          → gain EHP = p/100 × DEF/(100+DEF) ← vaut MOINS que DEF_FLAT à DEF basse
 *
 * On assume une base de crit de 20% et un critDmg de 2.0 à l'équipement complet
 * (vérifié par simulation : le set médian atterrit entre 18% et 24%).
 */
const REF_CRIT = 0.20;
const REF_CDMG = 2.0;
const CRIT_DENOM = 1 + REF_CRIT * (REF_CDMG - 1); // 1.20

/** Valeur centrale d'une ligne de clé `key` au palier `r`. */
export function lineCenter(key, r) {
  const LV = LINE_VALUE;
  const A = poolAtk(r), H = poolHp(r), D = poolDef(r);
  switch (key) {
    // ── Offense ────────────────────────────────────────────────
    case 'ATK_FLAT':        return LV * A;
    case 'ATK_PCT':         return LV * 100;
    case 'CRIT_RATE':       return LV * 100 * CRIT_DENOM / (REF_CDMG - 1);
    case 'CRIT_DMG':        return LV * 100 * CRIT_DENOM / REF_CRIT;
    case 'ASPD_PCT':        return LV * 100;
    case 'ELEM_BONUS_PCT':  return LV * 100 / ELEM_UPTIME;
    case 'BOSS_DMG_PCT':    return LV * 100 / BOSS_SHARE;
    // ── Offense magique (n'agit que par les sorts — cf. SKILL_SHARE) ──
    case 'MATK_FLAT':       return LV * A / SKILL_SHARE;
    case 'MATK_PCT':        return LV * 100 / SKILL_SHARE;
    case 'CDR_PCT':         return LV * 100 / SKILL_SHARE;
    // ── Défense ────────────────────────────────────────────────
    case 'HP_FLAT':         return LV * H;
    case 'HP_PCT':          return LV * 100;
    case 'DEF_FLAT':        return LV * (100 + D);
    case 'DODGE_PCT':       return LV * 100 * (1 - 0.10); // référence : 10% de dodge déjà porté
    // ── Sustain : soins convertis en EHP sur un engagement de FIGHT_SEC ──
    // Un point de lifesteal rend DPS×1% PV/s. Sur 20 s : DPS×0.2 PV.
    // Pour valoir LV × EHP, il faut : ls × DPS × FIGHT_SEC/100 = LV × H × (1+D/100)
    case 'LIFESTEAL_PCT':   return LV * H * (1 + D / 100) * 100 / (refDps(r) * FIGHT_SEC);
    case 'HP_ON_KILL_FLAT': return LV * H * (1 + D / 100) / killsPerFight(r);
    // ── Utilitaire / ressource ─────────────────────────────────
    case 'SPD_FLAT':        return LV * 100 * 0.9; // cf. note SPD ci-dessous
    case 'MANA_FLAT':       return LV * BASE.mana * 4;
    case 'MANA_ON_KILL_FLAT': return LV * BASE.mana * 4 / killsPerFight(r);
    default: throw new Error(`lineCenter: clé inconnue ${key}`);
  }
}

/** DPS de référence au palier r — approximation analytique servant UNIQUEMENT à
 *  convertir le lifesteal ; la validation finale, elle, passe par CombatSystem. */
const refDps = (r) => poolAtk(r) * 2.0 * CRIT_DENOM;
/** Kills encaissés pendant un engagement de FIGHT_SEC (pour tarifer les *_ON_KILL). */
const killsPerFight = () => 6;

/**
 * SPD_FLAT — LA SEULE VALEUR QUE JE N'AI PAS PU SIMULER, ET JE LE DIS.
 * La vitesse de déplacement est une stat DÉFENSIVE dans un jeu d'action (on
 * évite le coup au lieu de l'encaisser), mais mon harnais fait frapper l'ennemi
 * sur une horloge : il ne peut pas mesurer l'esquive par le placement. Mesurée
 * telle quelle, SPD_FLAT vaut 0,04 BP — un mort. Je la tarife donc par DÉCRET à
 * 0,9 × la valeur d'une ligne, en assumant qu'un joueur qui bouge 10% plus vite
 * évite ~10% des coups. C'est le nombre à réfuter en premier en playtest.
 */

// ── Pondération des slots ─────────────────────────────────────────
// Les poids sont RELATIFS À L'INTÉRIEUR DE LEUR GROUPE (offensif / armure) : ils
// répartissent ATK_MAIN_TOTAL entre arme+accessoires, et HP_MAIN_TOTAL entre les
// six pièces d'armure. Ils ne changent donc jamais le budget global — seulement
// sa distribution.
//
// L'arme prend la moitié du budget offensif : c'est elle l'identité du build.
// Les bagues valaient 0,4 dans une première passe : à Common leur main stat
// tombait à 4-6 ATK, c'est-à-dire rien — un slot mort qu'on n'a aucune raison
// de remplir. Une bague pèse désormais 0,9 : elle vaut 15% de l'offense, on en
// porte deux, elles comptent.
export const SLOT_WEIGHT = {
  WEAPON: 3.0, AMULET: 1.2, RING: 0.9,
  CHEST: 1.3, HELM: 0.9, LEGS: 0.9, BOOTS: 0.7, GLOVES: 0.7, CAPE: 0.7,
};
export const OFFENSE_SLOTS = ['WEAPON', 'RING', 'AMULET'];
export const ARMOR_SLOTS   = ['HELM', 'CHEST', 'LEGS', 'BOOTS', 'GLOVES', 'CAPE'];

/**
 * TYPE_COEF — coefficient de main stat par type d'arme.
 * ⚠ HORS SCOPE DE CETTE ÉTAPE : ce sont les rapports actuels (genItems.dmgMult),
 * simplement NORMALISÉS pour que leur moyenne vaille 1.0 — sans quoi le budget
 * global dériverait avec le type d'arme tiré. La PARITÉ des 10 armes (DPS
 * effectif à portée et temps d'animation égaux) est l'étape 3 ; c'est là qu'on
 * touchera à ces rapports, pas ici.
 */
const RAW_DMG_MULT = {
  SWORD: 1.00, GREATSWORD: 1.55, DAGGER: 0.78, AXE: 1.25, HAMMER: 1.65,
  SPEAR: 1.08, STAFF: 1.55, BOW: 0.92, DUAL_DAGGER: 0.85, DUAL_SWORD: 1.10,
};
const RAW_MEAN = Object.values(RAW_DMG_MULT).reduce((a, b) => a + b, 0) / Object.keys(RAW_DMG_MULT).length;
export const TYPE_COEF = Object.fromEntries(
  Object.entries(RAW_DMG_MULT).map(([k, v]) => [k, v / RAW_MEAN]),
);
/** Armes dont la main stat est MATK_FLAT (dégâts magiques). */
export const MAGIC_WEAPONS = new Set(['STAFF']);

/**
 * Part de la main stat dans le budget de l'item : 1 − 0.075 × n(r).
 * Common 92,5% → Mythic 55% → Hidden 47,5%.
 *
 * C'est la réponse chiffrée à la question du créateur (« la main stat
 * écrase-t-elle tout ? ») : à Common, OUI, et c'est voulu — un Common est un
 * bloc de stat brute, sans jeu. À Mythic, 45% de la puissance de l'objet est
 * dans ses substats : c'est là que le build commence. La rareté ne change donc
 * pas seulement la quantité, elle change la NATURE de l'objet.
 */
export const mainShare = (r) => 1 - 0.075 * SUBSTAT_COUNT[r];

/**
 * ± largeur de la fourchette de roll, autour du centre. IDENTIQUE à tous les
 * paliers — pilier n°1. Avant correction elle allait de ±10% (Common) à ±35%
 * (Mythic) : un Common Parfait ne valait que 1,12× un Common Sourd (personne ne
 * regarde), un Mythique Sourd valait 0,40× un Mythique Parfait (tout ce qui
 * n'est pas Vibrant est une déception). Une largeur unique rend la Résonance
 * LISIBLE : elle veut dire la même chose sur tous les objets du jeu.
 */
export const ROLL_SPREAD = 0.22;

/** Fourchette [min,max] arrondie autour d'un centre, à ±ROLL_SPREAD. */
export function range(center, spread = ROLL_SPREAD) {
  const min = Math.max(1, Math.round(center * (1 - spread)));
  const max = Math.max(min + 1, Math.round(center * (1 + spread)));
  return { min, max };
}

/** Fourchette d'une ligne de substat (clé, rareté). */
export function substatRange(key, r) {
  return range(lineCenter(key, r));
}

const OFFENSE_WEIGHT_TOTAL = SLOT_WEIGHT.WEAPON + 2 * SLOT_WEIGHT.RING + SLOT_WEIGHT.AMULET;
const ARMOR_WEIGHT_TOTAL   = ARMOR_SLOTS.reduce((s, k) => s + SLOT_WEIGHT[k], 0);

/**
 * Main stat d'une ARME : ATK_FLAT (ou MATK_FLAT pour un bâton).
 * L'arme prend sa part du budget de main stat offensif (ATK_MAIN_TOTAL), au
 * prorata de son poids de slot, × le coefficient de son type.
 */
export function weaponMainRange(weaponType, r) {
  const center = ATK_MAIN_TOTAL[r] * (SLOT_WEIGHT.WEAPON / OFFENSE_WEIGHT_TOTAL) * (TYPE_COEF[weaponType] ?? 1);
  return range(center);
}

/** Main stat d'un ACCESSOIRE (anneau, amulette) : ATK_FLAT. */
export function accessoryMainRange(slot, r) {
  const center = ATK_MAIN_TOTAL[r] * (SLOT_WEIGHT[slot] / OFFENSE_WEIGHT_TOTAL);
  return range(center);
}

/**
 * Main stat d'une ARMURE : HP_FLAT — et non DEF_FLAT.
 *
 * Pourquoi ce changement : StatsSystem additionne DÉJÀ `armor.defense` ET la
 * main stat DEF_FLAT dans le même total (collectEquipTotals + la boucle legacy
 * `if ('defense' in item) def += item.defense`). La DEF passait donc par DEUX
 * canaux et personne ne budgétait la somme — d'où une DEF de 438 à l'équipement
 * Legendary complet, soit 81% de réduction de dégâts, soit un joueur immortel
 * face au trash. La DEF ne coule plus désormais que par `defense` (l'implicite
 * de la pièce) et les substats DEF_FLAT ; la main stat de l'armure porte les PV,
 * qui sont rollables, lisibles, et le véritable axe de survie.
 * Aucun code ne dépendait de la clé DEF_FLAT en main stat (vérifié par grep).
 */
export function armorMainRange(slot, r) {
  const center = HP_MAIN_TOTAL[r] * (SLOT_WEIGHT[slot] / ARMOR_WEIGHT_TOTAL);
  return range(center);
}

/** DEF implicite d'une armure (champ `defense`) — l'unique canal de DEF restant. */
export function armorDefense(slot, r) {
  return Math.max(1, Math.round(DEF_IMPL_TOTAL[r] * (SLOT_WEIGHT[slot] / ARMOR_WEIGHT_TOTAL)));
}

/**
 * `magicDefense` — conservée pour l'affichage et pour l'étape 2, mais elle ne
 * réduit RIEN aujourd'hui : CombatSystem.enemyAttack ne lit que
 * `enemy.stats.baseAtk`. Elle ne consomme donc AUCUN budget (elle est un miroir
 * cosmétique de `defense`), et aucune substat MDEF_FLAT n'est plus générée.
 */
export function armorMagicDefense(slot, r) {
  return Math.max(1, Math.round(armorDefense(slot, r) * 0.8));
}

// ── Pools de substats autorisés par slot ──────────────────────────
// MDEF_FLAT est ABSENT, volontairement, des deux pools : CombatSystem.enemyAttack
// ne lit que `enemy.stats.baseAtk` — aucun ennemi du jeu n'inflige de dégâts
// magiques. magicDef ne réduit donc RIEN. Toute ligne MDEF_FLAT était un vol de
// budget déguisé en défense (mesurée à 0,61 BP à Rare puis −1,91 à Legendary,
// c'est-à-dire du bruit). On la réintroduira le jour où un ennemi lancera un
// sort (étape 2), pas avant.
//
// DEF_PCT est ABSENT lui aussi, et pour une autre raison — instructive.
// Sa valeur juste est LV × 100 × (100+DEF)/DEF : +24% à Common (DEF 33), +11% à
// Mythic (DEF 122). Elle DÉPEND du pool qu'elle multiplie, donc elle ne peut pas
// être tarifée une fois pour toutes. Pire : avec 60 lignes à Mythic, les lignes
// DEF dépassaient la cible de DEF, ce qui forçait la `defense` implicite des
// armures à DÉCROÎTRE avec la rareté (14 → 25 → 11) — un plastron Mythique
// affichait moins de défense qu'un Épique. C'est exactement la progression
// inversée qu'on répare. DEF_FLAT couvre déjà l'axe ; DEF_PCT est redondante.
export const WEAPON_SUBS = [
  'ATK_PCT', 'CRIT_RATE', 'CRIT_DMG', 'ASPD_PCT', 'ELEM_BONUS_PCT',
  'BOSS_DMG_PCT', 'LIFESTEAL_PCT', 'MATK_FLAT', 'MATK_PCT', 'CDR_PCT',
];
export const WEAPON_DEF_SUBS = ['HP_FLAT', 'SPD_FLAT'];
export const ARMOR_SUBS = [
  'HP_PCT', 'DEF_FLAT', 'DODGE_PCT', 'SPD_FLAT',
  'HP_ON_KILL_FLAT', 'MANA_FLAT', 'MANA_ON_KILL_FLAT', 'CDR_PCT',
];
export const ARMOR_OFF_SUBS = ['ATK_FLAT', 'ATK_PCT', 'MATK_FLAT', 'CRIT_RATE'];
export const ACCESSORY_SUBS = [
  'ATK_PCT', 'CRIT_RATE', 'CRIT_DMG', 'ASPD_PCT', 'ELEM_BONUS_PCT', 'BOSS_DMG_PCT',
  'LIFESTEAL_PCT', 'HP_FLAT', 'HP_PCT', 'DEF_FLAT', 'DODGE_PCT', 'CDR_PCT',
  'MATK_FLAT', 'MATK_PCT', 'HP_ON_KILL_FLAT', 'SPD_FLAT',
];

/** Clés affichées en pourcentage (miroir de PERCENT_KEYS, StatsSystem). */
export const PCT_KEYS = new Set([
  'ATK_PCT', 'MATK_PCT', 'DEF_PCT', 'HP_PCT', 'CRIT_RATE', 'CRIT_DMG',
  'ASPD_PCT', 'ELEM_BONUS_PCT', 'LIFESTEAL_PCT', 'CDR_PCT', 'DODGE_PCT', 'BOSS_DMG_PCT',
]);

/** Valeur marchande — indexée sur le budget réel, plus sur une table arbitraire. */
export const VALUE = {
  COMMON: 40, UNCOMMON: 120, RARE: 380, EPIC: 1200,
  LEGENDARY: 5000, MYTHIC: 12000, HIDDEN: 20000,
};
