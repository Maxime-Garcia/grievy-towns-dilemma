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
 * HIDDEN vaut donc 1,45 × MYTHIC : une marche franche, PLUS le passif unique.
 *
 * Pourquoi 1,45 et pas 1,20 : la 7e substat coûte 0,864× sur la main stat
 * (mainShare passe de 0,55 à 0,475). Pour que TOUS les canaux restent au-dessus
 * du Mythique — y compris les PV, dont l'exposant résolu est le plus mou
 * (T^0.478) — il faut (T_H/T_M)^0.478 ≥ 1/0,864, soit T_H/T_M ≥ 1,36. En dessous,
 * les PV d'un plastron CACHÉ retombent SOUS ceux d'un Mythique (mesuré : 607
 * contre 620 à 1,30×). Le seuil n'est pas un goût, il est imposé par le modèle —
 * et il se re-vérifie à chaque changement d'exposant.
 */
export const TIER = {
  COMMON: 1.0, UNCOMMON: 1.5, RARE: 2.25, EPIC: 3.375,
  LEGENDARY: 5.0625, MYTHIC: 7.59375, HIDDEN: 11.0,
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
 * POOL_ATK et POOL_HP sont RÉSOLUS (point fixe sur les vrais modules, puis
 * ajustement d'une loi de puissance pour lisser le bruit d'échantillonnage) :
 * ils sont ce qu'il FAUT pour que DPS et EHP atteignent leurs cibles, une fois
 * payé le multiplicatif qu'apportent les substats en POURCENTAGE — dont le
 * nombre est multiplié par 6 entre Common (10 lignes) et Mythic (60 lignes).
 * C'est pourquoi les pools croissent en T^0.77 et T^0.69, et non en T : le reste
 * de la marche est déjà payé par les %.
 *
 * ⚠ CES TABLES DÉPENDENT DES POOLS DE SUBSTATS. Retirer une clé d'un pool change
 * la fréquence de toutes les autres, donc les totaux, donc ces tables. Je m'y
 * suis fait prendre : après avoir sorti CDR/MANA des pools, le pool d'armure est
 * passé de 8 à 7 clés — HP_PCT et DEF_FLAT se sont mis à sortir bien plus
 * souvent, les PV ont dépassé leur cible de 39% à Legendary et le DPS a fini à
 * ×11,5 contre ×7,5 pour l'EHP. TOUTE modification d'un pool oblige à relancer le
 * solveur. Ce n'est pas une précaution : c'est une dépendance.
 */
export const POOL_ATK = { COMMON: 58, UNCOMMON: 77, RARE: 103, EPIC: 138, LEGENDARY: 185, MYTHIC: 247, HIDDEN: 321 };
export const POOL_HP  = { COMMON: 416, UNCOMMON: 512, RARE: 631, EPIC: 778, LEGENDARY: 959, MYTHIC: 1183, HIDDEN: 1432 };
export const POOL_DEF = { COMMON: 37, UNCOMMON: 51, RARE: 70, EPIC: 96, LEGENDARY: 132, MYTHIC: 182, HIDDEN: 243 };

/**
 * Budgets portés par les MAIN STATS (le reste du pool arrive par les substats).
 * Résolus par le même point fixe. Tous strictement croissants — c'est la
 * condition binaire de réussite de l'étape : aucun palier ne doit être battu par
 * le précédent, sur AUCUN champ, y compris les champs affichés en UI.
 *
 * HIDDEN porte une main stat pénalisée de ×0,864 (il paie sa 7e substat), mais
 * sur un budget de palier 1,30× supérieur : le net est donc positif sur CHAQUE
 * canal — ATK, PV, DEF. Un Caché ne peut jamais être un downgrade.
 */
export const ATK_MAIN_TOTAL = { COMMON: 41.9, UNCOMMON: 56.0, RARE: 74.9, EPIC: 100.2, LEGENDARY: 134.0, MYTHIC: 179.2, HIDDEN: 201.9 };
export const HP_MAIN_TOTAL  = { COMMON: 235.8, UNCOMMON: 286.1, RARE: 347.2, EPIC: 421.2, LEGENDARY: 511.1, MYTHIC: 620.2, HIDDEN: 639.1 };
export const DEF_IMPL_TOTAL = { COMMON: 19.0, UNCOMMON: 21.5, RARE: 24.2, EPIC: 27.4, LEGENDARY: 30.9, MYTHIC: 34.9, HIDDEN: 39.0 };

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
//
// ⚠ ELEM_UPTIME = 1.0, et c'est une correction, pas un oubli.
// Il valait 0,55 (« seules 55% des armes portent un élément »). Erreur de
// raisonnement : le joueur CHOISIT son arme. Une condition qu'il contrôle n'est
// pas un risque, c'est une case à cocher. Résultat de la remise de 0,55 : chaque
// ligne ELEM_BONUS_PCT valait 11% au lieu de 6% — presque le double d'ATK_PCT —
// et comme la quasi-totalité des armes du catalogue sont élémentaires, elle était
// TOUJOURS active. J'avais fabriqué la substat impérative que je suis censé
// traquer : la taxe déguisée. Mesuré : le DPS d'un set Mythique montait à ×11,9
// quand l'EHP ne faisait que ×6,7.
// BOSS_SHARE, lui, reste une vraie condition SUBIE (on ne choisit pas de croiser
// un boss) : sa remise est légitime.
export const ELEM_UPTIME = 1.0;
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

/**
 * CALIB — LA CORRECTION QUE LA MESURE IMPOSE À LA FORMULE.
 * ==================================================================
 * Les formules ci-dessous donnent la STRUCTURE (quelle grandeur dépend de quel
 * pool, et comment elle croît avec le palier). Elles ne donnent pas le bon
 * NOMBRE, parce qu'elles supposent toutes que les stats sont indépendantes.
 * Elles ne le sont pas.
 *
 * Le cas d'école, et il est instructif : CRIT_RATE. La formule la tarife en
 * supposant critDmg = 2.0. Mais CRIT_DMG est elle-même une substat, et un build
 * réel en accumule assez pour monter à ×3.0. Or crit et critDmg se MULTIPLIENT.
 * Résultat mesuré : une ligne de CRIT_RATE valait ×2,4 le barème — la substat
 * impérative, celle qu'on prend toujours. Aucune formule linéaire ne peut prévoir
 * ça : il faut le mesurer.
 *
 * CALIB est donc obtenu par RÉSOLUTION (harnais .tmp/calib) : pour chaque clé, on
 * cherche la magnitude qui fait valoir la ligne exactement LINE_VALUE, en mesure
 * APPARIÉE (même set, avec et sans la ligne) sur les vrais modules, offense
 * (trash + boss pondéré par BOSS_SHARE) et survie (EHP + sustain) confondues.
 *
 * Lire CALIB, c'est lire de combien la formule se trompait :
 *   CRIT_RATE 0.52 → elle surévaluait le crit d'un facteur 2 (synergie critDmg)
 *   ATK_FLAT  0.61 → idem (l'ATK plate profite de TOUS les multiplicateurs)
 *   HP_PCT    2.26 → elle sous-évaluait la défense d'un facteur 2
 *   DODGE_PCT ...  → cf. note sur les rendements décroissants
 */
export const CALIB = {
  ATK_FLAT: 0.649, ATK_PCT: 1.090, CRIT_RATE: 0.552, CRIT_DMG: 1.140,
  ASPD_PCT: 1.010, ELEM_BONUS_PCT: 1.187, BOSS_DMG_PCT: 2.003,
  HP_FLAT: 1.040, HP_PCT: 1.729, DEF_FLAT: 1.294, DEF_PCT: 1.295,
  DODGE_PCT: 1.883, LIFESTEAL_PCT: 1.337, HP_ON_KILL_FLAT: 2.022,
  // ⚠ NON CALIBRÉES — et je le dis plutôt que de faire semblant.
  // Leur valeur est une fonction de l'équilibrage des SORTS (étape 4) : un point
  // de CDR ne vaut quelque chose que si un sort vaut la peine d'être lancé, et je
  // ne peux pas encore le mesurer. Elles gardent leur prix de formule (SKILL_SHARE
  // = 35%), qui est une HYPOTHÈSE, pas une mesure. À recalibrer à l'étape 4.
  MATK_FLAT: 1.000, MATK_PCT: 1.000, CDR_PCT: 1.000,
  MANA_FLAT: 1.000, MANA_ON_KILL_FLAT: 1.000,
  // MDEF_FLAT vaut RÉELLEMENT ZÉRO : aucun ennemi n'inflige de dégâts magiques
  // (CombatSystem.enemyAttack ne lit que baseAtk). Aucun calibrage ne peut le
  // réparer — c'est un trou de COMBAT, à combler à l'étape 2.
  MDEF_FLAT: 1.000,
  // SPD_FLAT : la SEULE valeur que je n'ai pas pu simuler, et je le dis.
  // La vitesse de déplacement est une stat défensive dans un jeu d'action (on
  // évite le coup au lieu de l'encaisser), mais mon harnais fait frapper l'ennemi
  // sur une horloge : il ne sait pas mesurer l'esquive par le placement. Tarifée
  // par DÉCRET. C'est le premier nombre à réfuter en playtest.
  SPD_FLAT: 1.000,
};

/** Valeur centrale d'une ligne de clé `key` au palier `r` — CALIB inclus. */
export function lineCenter(key, r) {
  return rawLineCenter(key, r) * (CALIB[key] ?? 1);
}

function rawLineCenter(key, r) {
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
    // DEF_PCT : tarifée sur une DEF de RÉFÉRENCE (celle de Rare), et non sur la DEF
    // du palier. Sinon sa fourchette DÉCROÎT avec la rareté (12-19% à Rare, 9-13% à
    // Mythic — un objet Mythique affichant MOINS qu'un Rare), parce qu'un point de
    // DEF vaut d'autant plus cher qu'on en a déjà. C'est juste comptablement et
    // absurde à l'écran. Comme toutes les substats en POURCENTAGE, elle ne dépend
    // pas du palier : c'est le NOMBRE de lignes qui fait la marche.
    case 'DEF_PCT':         return LV * 100 * (100 + POOL_DEF.RARE) / POOL_DEF.RARE;
    // MDEF_FLAT : miroir de DEF_FLAT. ⚠ vaut RÉELLEMENT 0 tant qu'aucun ennemi
    // n'inflige de dégâts magiques (CombatSystem.enemyAttack ne lit que baseAtk).
    // Trou de COMBAT, pas de budget — à régler à l'étape 2.
    case 'MDEF_FLAT':       return LV * (100 + D);
    // DODGE_PCT : plus de plafond dur, des rendements décroissants
    // (StatRollSystem.softcap, asymptote 75). La ligne rapporte donc toujours
    // quelque chose, de moins en moins — jamais zéro.
    case 'DODGE_PCT':       return LV * 100 * (1 - 0.10);
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
//
// LES 21 SUBSTATS SONT TOUTES DANS LE JEU. Aucune n'est retirée.
//
// J'avais proposé d'en sortir trois (CDR_PCT, DODGE_PCT, MANA_*) parce que je ne
// savais pas les tarifer : plafonnées, elles valaient zéro une fois le mur
// atteint. Le diagnostic était juste, la solution était mauvaise — retirer une
// substat est une décision de DESIGN, pas d'équilibrage, et une stat en moins,
// c'est de la diversité de build en moins.
//
// La vraie réponse : ON A LEVÉ LES MURS (StatRollSystem.softcap). Une stat ne
// doit jamais valoir exactement zéro ; elle a le droit de valoir de moins en
// moins. Les rendements décroissants font le travail du plafond sans sa brutalité.
//
// MATK_FLAT / MATK_PCT restent réservées aux armes MAGIQUES (le bâton) — et ce
// n'est pas un retrait, c'est un placement. Une ligne peut être « au budget » et
// rester un PIÈGE si elle atterrit sur le mauvais objet : une régénération a sorti
// une ÉPÉE dont les trois substats étaient MATK_PCT, CDR_PCT et MATK_FLAT.
// Comptablement juste ; concrètement, une épée qui ne tape pas — CombatSystem.
// playerAttack ne lit que cs.atk. Sur une arme physique, MATK ne fait rien.
//
// ⚠ MDEF_FLAT est dans les pools, mais elle vaut RÉELLEMENT ZÉRO aujourd'hui, et
// je ne peux pas le corriger ici : CombatSystem.enemyAttack ne lit que
// `enemy.stats.baseAtk` — AUCUN ennemi du jeu n'inflige de dégâts magiques, donc
// magicDef ne réduit rien. Ce n'est pas un problème de budget, c'est un trou de
// COMBAT. Il se règle à l'étape 2 (ennemis), en donnant enfin des attaques
// magiques aux ennemis. Je le signale en gras plutôt que de le cacher.
export const WEAPON_SUBS = [
  'ATK_PCT', 'CRIT_RATE', 'CRIT_DMG', 'ASPD_PCT', 'ELEM_BONUS_PCT',
  'BOSS_DMG_PCT', 'LIFESTEAL_PCT', 'CDR_PCT',
];
export const WEAPON_MAGIC_SUBS = [
  'MATK_PCT', 'MATK_FLAT', 'CRIT_RATE', 'CRIT_DMG', 'ASPD_PCT', 'ELEM_BONUS_PCT',
  'BOSS_DMG_PCT', 'LIFESTEAL_PCT', 'CDR_PCT',
];
export const WEAPON_DEF_SUBS = ['HP_FLAT', 'SPD_FLAT', 'DEF_FLAT'];
export const ARMOR_SUBS = [
  'HP_PCT', 'DEF_FLAT', 'DEF_PCT', 'MDEF_FLAT', 'DODGE_PCT', 'SPD_FLAT',
  'HP_ON_KILL_FLAT', 'LIFESTEAL_PCT', 'ELEM_BONUS_PCT',
  'MANA_FLAT', 'MANA_ON_KILL_FLAT', 'CDR_PCT',
];
export const ARMOR_OFF_SUBS = ['ATK_FLAT', 'ATK_PCT', 'CRIT_RATE'];
export const ACCESSORY_SUBS = [
  'ATK_PCT', 'CRIT_RATE', 'CRIT_DMG', 'ASPD_PCT', 'ELEM_BONUS_PCT', 'BOSS_DMG_PCT',
  'LIFESTEAL_PCT', 'HP_FLAT', 'HP_PCT', 'DEF_FLAT', 'DODGE_PCT', 'CDR_PCT',
  'HP_ON_KILL_FLAT', 'SPD_FLAT', 'MANA_FLAT', 'MANA_ON_KILL_FLAT',
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

/**
 * Ligne « signature » par slot : l'identité de la pièce. Une botte parle de
 * vitesse, un gant de coups critiques. Budget strictement égal (toute ligne vaut
 * LINE_VALUE) : c'est un GOÛT, pas un avantage.
 */
export const SLOT_SIGNATURE = {
  HELM:   ['ELEM_BONUS_PCT', 'HP_PCT'],
  CHEST:  ['HP_PCT', 'DEF_FLAT', 'HP_ON_KILL_FLAT'],
  LEGS:   ['DEF_FLAT', 'HP_PCT', 'SPD_FLAT'],
  BOOTS:  ['SPD_FLAT', 'DODGE_PCT'],
  GLOVES: ['CRIT_RATE', 'ATK_PCT', 'ASPD_PCT'],
  CAPE:   ['DODGE_PCT', 'ELEM_BONUS_PCT', 'SPD_FLAT'],
  RING:   ['CRIT_DMG', 'ATK_PCT'],
  AMULET: ['CRIT_RATE', 'ELEM_BONUS_PCT'],
};

const ACCESSORY_SLOTS = ['RING', 'AMULET'];

/**
 * buildTemplate — LA FABRIQUE D'ITEM, ET LA SEULE.
 * ==================================================================
 * Rend les CHIFFRES d'un item : main stat, substats, défense implicite, valeur.
 * (L'éditorial — nom, lore, icône — reste chez l'appelant.)
 *
 * Pourquoi cette fonction existe : le générateur, le recalage des items manuels
 * ET le solveur construisaient chacun leurs items, chacun à leur façon. Ils ont
 * donc divergé — encore. Le générateur appliquait une ligne « signature » par
 * slot que le solveur ignorait ; les tables résolues ne décrivaient donc pas les
 * items réellement produits, et le DPS d'un set Mythique sortait à ×11,9 au lieu
 * de ×7,6. Trois fabriques = trois vérités.
 *
 * Il n'y en a plus qu'une. Le solveur mesure EXACTEMENT ce que le générateur
 * produit, par construction, et non parce que quelqu'un a pensé à synchroniser.
 *
 * @param {string} slot     WEAPON | HELM | CHEST | LEGS | BOOTS | GLOVES | CAPE | RING | AMULET
 * @param {string} rarity   COMMON … HIDDEN
 * @param {object} opts     { weaponType?, rnd?, forbidden? }
 */
export function buildTemplate(slot, rarity, opts = {}) {
  const rnd = opts.rnd ?? Math.random;
  const wt = opts.weaponType ?? 'SWORD';
  const forbidden = new Set(opts.forbidden ?? []);
  const isWeapon = slot === 'WEAPON';
  const isAccessory = ACCESSORY_SLOTS.includes(slot);
  const isArmor = ARMOR_SLOTS.includes(slot);
  if (!isWeapon && !isAccessory && !isArmor) throw new Error(`buildTemplate: slot inconnu ${slot}`);

  const magic = isWeapon && MAGIC_WEAPONS.has(wt);
  const mainKey = isWeapon ? (magic ? 'MATK_FLAT' : 'ATK_FLAT')
    : isAccessory ? 'ATK_FLAT' : 'HP_FLAT';
  const mainRange = isWeapon ? weaponMainRange(wt, rarity)
    : isAccessory ? accessoryMainRange(slot, rarity)
      : armorMainRange(slot, rarity);

  const nSub = SUBSTAT_COUNT[rarity];
  const taken = new Set([mainKey]); // jamais la clé de la mainStat → pas de double-dip
  const subs = [];
  const takeFrom = (keys) => {
    const cands = keys.filter(k => !taken.has(k) && !forbidden.has(k));
    if (!cands.length) return null;
    const k = cands[Math.floor(rnd() * cands.length)];
    taken.add(k);
    return k;
  };

  const basePool = isWeapon ? (magic ? WEAPON_MAGIC_SUBS : WEAPON_SUBS)
    : isAccessory ? ACCESSORY_SUBS : ARMOR_SUBS;
  const altPool = isWeapon ? WEAPON_DEF_SUBS : isArmor ? ARMOR_OFF_SUBS : [];

  // Ligne signature dès UNCOMMON (les armes n'en ont pas : leur identité, c'est leur type).
  if (nSub >= 2 && !isWeapon) { const s = takeFrom(SLOT_SIGNATURE[slot] ?? []); if (s) subs.push(s); }
  const nAlt = nSub >= 4 && altPool.length && rnd() < 0.5 ? 1 : 0;
  while (subs.length < nSub - nAlt) { const s = takeFrom(basePool); if (!s) break; subs.push(s); }
  if (nAlt) { const s = takeFrom(altPool); if (s) subs.push(s); }
  while (subs.length < nSub) { const s = takeFrom([...basePool, ...altPool]); if (!s) break; subs.push(s); }

  const mainCenter = Math.round((mainRange.min + mainRange.max) / 2);
  return {
    mainKey,
    mainStat: { key: mainKey, ...mainRange },
    substats: subs.map(k => ({ key: k, ...substatRange(k, rarity), isPercentage: PCT_KEYS.has(k) })),
    // Miroir arme (règle absolue CLAUDE.md) : damage/magicDamage = centre du mainStat.
    damage:      isWeapon ? (magic ? Math.round(mainCenter * 0.45) : mainCenter) : undefined,
    magicDamage: isWeapon ? (magic ? mainCenter : Math.round(mainCenter * 0.45)) : undefined,
    defense:      isArmor ? armorDefense(slot, rarity) : undefined,
    magicDefense: isArmor ? armorMagicDefense(slot, rarity) : undefined,
    value: VALUE[rarity],
  };
}
