/**
 * MISE À L'ÉCHELLE DES ENNEMIS — source de vérité UNIQUE.
 * ==================================================================
 * Remplace `SCALED_ENEMY_LEVEL` (ProgressionSystem), qui mettait les ennemis à
 * l'échelle du NIVEAU DU JOUEUR :
 *
 *     level = max(1, baseLevel + floor((playerLevel - baseLevel) * 0.6))
 *     scale = 1 + (level - baseLevel) * 0.08
 *
 * Les niveaux sont supprimés : `playerLevel` vaut 1 partout. Pour un ennemi de
 * `baseLevel` 30, cette formule donnait `scale = -0,44` — donc `maxHp` NÉGATIF.
 * Mesuré avant correction : 9 ennemis sur 57 spawnaient avec des PV négatifs,
 * dont 3 BOSS (malachar_boss à -1760 PV). Ce n'était pas un déséquilibre, c'était
 * une bombe.
 *
 * La seule variable qui a encore un sens dans un roguelite, c'est la PROFONDEUR.
 * Un ennemi ne vaut plus « son niveau » : il vaut CE QU'IL EST (son identité) ×
 * LÀ OÙ ON LE RENCONTRE (la profondeur de la zone).
 *
 * ── La formule ────────────────────────────────────────────────────
 *
 *     stat(e, d) = share(e) × ANCHOR[cat][canal] × RATIO[cat][canal]^(d - 1)
 *
 *   share(e) : la stat autorée de l'ennemi ÷ la moyenne autorée de son groupe
 *              (même zone d'origine, même catégorie). C'est son IDENTITÉ, et elle
 *              est intacte : un lava_golem reste plus tanky qu'un cinder_sprite,
 *              exactement dans le même rapport qu'avant.
 *   ANCHOR   : la puissance ABSOLUE que le groupe doit avoir à la profondeur 1.
 *   RATIO    : la marche par zone.
 *
 * L'exposant est `d - 1`, avec d ≥ 1 : il est TOUJOURS ≥ 0. La classe de bug des
 * PV négatifs est structurellement impossible — un multiplicateur ne peut plus
 * être qu'une puissance positive d'un nombre positif.
 *
 * ── Pourquoi la DEF n'est JAMAIS mise à l'échelle ─────────────────
 * `CombatSystem` réduit les dégâts par `100 / (100 + DEF)`. C'est une réduction
 * en POURCENTAGE, indépendante de la puissance du joueur : une DEF de 50 enlève
 * 33% des dégâts, que le joueur tape à 100 ou à 10 000. La faire croître avec la
 * profondeur rendrait les ennemis profonds de plus en plus IMMUNISÉS, quel que
 * soit l'équipement — la seule réponse serait « plus d'ATK », indéfiniment.
 * La DEF est donc une IDENTITÉ (un golem est blindé, un sprite ne l'est pas),
 * jamais une marche de progression. Elle reste à sa valeur autorée. Idem MDEF.
 *
 * ── D'où viennent ces nombres ─────────────────────────────────────
 * Ils sont RÉSOLUS, pas choisis. Harnais `.tmp/e2final.ts` : pour chaque
 * profondeur, on construit un panel de 14 joueurs à la rareté attendue de la zone
 * (COMMON en 1 → MYTHIC en 7, la courbe TIER de balanceModel.mjs), et on cherche
 * par dichotomie les PV et l'ATK qui atteignent les cibles ci-dessous, en faisant
 * tourner les VRAIS modules (CombatSystem.playerAttack / enemyAttack, StatsSystem).
 *
 *   CIBLES (chacune est un choix, défendu) :
 *     TRASH  TTK 2,0 s  ·  20 coups encaissés avant la mort
 *     ELITE  TTK 10 s   ·  12 coups
 *     BOSS   TTK 60 s   ·  8 coups
 *
 *   TTK = temps que le joueur met à le tuer → c'est le RYTHME.
 *   Coups = nombre de coups reçus avant de mourir → c'est la MENACE.
 *
 * Le trash meurt en 2 s parce qu'il est du rythme, pas du défi. Mais il frappe
 * assez fort pour qu'une MEUTE compte : trois trash au contact enlèvent ~70% des
 * PV du joueur le temps qu'il les tue. C'est là qu'est la difficulté — dans la
 * densité, pas dans la statistique d'un individu.
 *
 * ⚠ TOUT changement du modèle d'équipement (balanceModel.mjs) invalide ces
 * nombres : ils sont résolus CONTRE lui. Relancer `.tmp/e2final.ts`.
 */

import { Enemy, EnemyStats } from '../types';
import { ENEMY_MAP } from './enemies';
import { ZONES } from './zones';

export type EnemyCategory = 'TRASH' | 'ELITE' | 'BOSS';

/**
 * Profondeur des zones. Les 7 zones principales suivent la progression du jeu.
 *
 * Les ROUTES prennent la profondeur de leur extrémité la MOINS profonde. C'est
 * volontairement prudent : une route est accessible depuis les deux bouts, et un
 * joueur qui vient du côté peu profond ne doit pas tomber sur du contenu calibré
 * pour un équipement qu'il n'a pas. Un ennemi de zone profonde croisé sur une
 * route précoce est donc mis à l'échelle VERS LE BAS — c'est son avant-garde
 * affaiblie, pas une embuscade.
 */
export const ZONE_DEPTH: Record<string, number> = {
  grievy_town: 1,
  ignis_reach: 1,
  terravast: 2,
  zephyr_peaks: 3,
  abyssmar: 4,
  volterra: 5,
  glaciem: 6,
  malachars_spire: 7,
  // Routes — min(profondeur des deux extrémités).
  route_ember_road: 1,        // Grievy ↔ Ignis
  route_stone_path: 2,        // Ignis ↔ Terravast
  route_zephyr_trail: 3,      // Terravast ↔ Zephyr
  route_coastal_road: 4,      // Zephyr ↔ Abyssmar
  route_thunder_pass: 5,      // Abyssmar ↔ Volterra
  route_frost_way: 6,         // Volterra ↔ Glaciem
  route_dark_descent: 7,      // Glaciem ↔ Malachar
  route_lava_bridge: 1,       // Ignis ↔ Volterra — raccourci : reste au niveau d'Ignis
  route_underground_river: 2, // Terravast ↔ Abyssmar
  route_storm_crossing: 3,    // Zephyr ↔ Volterra
};

export const DEFAULT_DEPTH = 1;
export const MAX_DEPTH = 7;

/** Profondeur d'une zone — 1 par défaut (jamais 0 : l'exposant doit rester ≥ 0). */
export const depthOfZone = (zoneId: string): number =>
  Math.max(1, Math.min(MAX_DEPTH, ZONE_DEPTH[zoneId] ?? DEFAULT_DEPTH));

export const categoryOf = (e: Enemy): EnemyCategory =>
  e.isBoss ? 'BOSS' : e.isElite ? 'ELITE' : 'TRASH';

/**
 * TARGET — la puissance ABSOLUE moyenne d'un groupe, par catégorie et profondeur.
 * Index 0 = profondeur 1.
 *
 * ⚠ CE SONT LES VALEURS RÉSOLUES, PAS UNE COURBE AJUSTÉE. Et c'est une correction :
 * j'avais d'abord remplacé ces 63 nombres par un modèle propre (ancre + raison
 * géométrique ~1,36/zone), parce que les points résolus « avaient l'air » d'une
 * belle exponentielle. La vérification l'a immédiatement réfuté : le boss de la
 * zone 3 tombait en 31,9 s au lieu des 60 s visées — un facteur DEUX.
 *
 * La raison est structurelle, et elle interdit toute courbe lisse : la DEF d'un
 * boss est son IDENTITÉ (Sylvaël 30, Gorvun 60), et elle n'est pas mise à l'échelle
 * (cf. ci-dessus). Or la DEF absorbe une part des dégâts. À TTK égal, un boss peu
 * blindé a donc besoin de PLUS de PV qu'un boss blindé — et cet écart n'a aucune
 * raison de suivre une exponentielle. La courbe des PV n'est pas lisse parce que la
 * DEF ne l'est pas.
 *
 * Une courbe ajustée est un nombre DEVINÉ. Ces nombres-là sont MESURÉS.
 *
 * Croissance totale zone 1 → zone 7 : PV ×5,8 (trash) à ×7,5 (boss), ATK ×5,8 à
 * ×6,0. C'est l'ordre de grandeur de la croissance du joueur (DPS ×6,7, EHP ×6,0
 * mesurés sur les panels) — c'est le but : il devient plus fort, pas invulnérable.
 *
 * La MATK monte moins vite que l'ATK (×4,0 contre ×5,8), et ce n'est pas une
 * erreur : la MDEF du joueur croît moins vite que sa DEF (elle ne reçoit que
 * MDEF_FLAT et la `magicDefense` des pièces ; la DEF reçoit EN PLUS DEF_PCT). Il
 * faut donc moins de MATK brute pour enlever la même fraction de PV. Conséquence
 * assumée : plus le joueur descend, plus la magie fait mal S'IL N'A PAS investi en
 * MDEF. C'est précisément ce qui donne un prix à cette stat.
 *
 * (Monotonie forcée par maximum courant : le solveur, sur des panels de 14 joueurs,
 * produit un bruit de quelques % qui pouvait rendre une zone ponctuellement plus
 * faible que la précédente. Un ennemi de zone N+1 ne doit JAMAIS être plus faible
 * qu'un ennemi de zone N.)
 */
const TARGET: Record<EnemyCategory, { hp: number[]; atk: number[]; matk: number[] }> = {
  TRASH: {
    hp:   [236, 310, 549, 899, 1116, 1116, 1360],
    atk:  [26, 43, 43, 81, 83, 112, 150],
    matk: [25, 39, 39, 55, 57, 78, 100],
  },
  ELITE: {
    hp:   [964, 1238, 3076, 3681, 4329, 4614, 6172],
    atk:  [42, 71, 71, 135, 136, 185, 247],
    matk: [41, 64, 64, 88, 93, 130, 162],
  },
  BOSS: {
    hp:   [5591, 6578, 20595, 20595, 26907, 28220, 41965],
    atk:  [62, 106, 106, 203, 205, 277, 372],
    matk: [60, 94, 94, 134, 138, 192, 244],
  },
};

// ── share(e) : l'identité de l'ennemi dans son groupe ────────────────────────
// Dérivée des données réelles (ENEMY_MAP + ZONES), donc jamais périmée : ajouter
// un ennemi à une zone met à jour les moyennes de son groupe automatiquement.
//
// Calcul PARESSEUX (mémoïsé au premier appel) et non au chargement du module :
// `zones.ts` complète `zone.enemies` avec les 139 créatures générées dans un
// effet de bord au niveau du module. Lire ZONES trop tôt donnerait des groupes
// incomplets — donc des moyennes fausses, donc des `share` faux, silencieusement.

interface Share { hp: number; atk: number; matk: number; depth: number }
let SHARES: Record<string, Share> | null = null;

function buildShares(): Record<string, Share> {
  // Zone D'ORIGINE d'un ennemi = la première zone PRINCIPALE (non-route) qui le
  // liste. Les routes ne définissent pas une origine : elles réutilisent.
  const homeDepth: Record<string, number> = {};
  for (const z of ZONES) {
    if (z.id.startsWith('route_')) continue;
    const d = depthOfZone(z.id);
    for (const id of z.enemies) if (homeDepth[id] === undefined) homeDepth[id] = d;
    if (z.bossId && homeDepth[z.bossId] === undefined) homeDepth[z.bossId] = d;
  }

  // Moyennes autorées par (profondeur d'origine, catégorie).
  const sums: Record<string, { hp: number; atk: number; matk: number; n: number }> = {};
  const key = (d: number, c: EnemyCategory) => `${d}|${c}`;
  for (const e of Object.values(ENEMY_MAP)) {
    const d = homeDepth[e.id];
    if (d === undefined) continue; // hors zone (mannequins d'entraînement) → pas de mise à l'échelle
    const k = key(d, categoryOf(e));
    const s = (sums[k] ??= { hp: 0, atk: 0, matk: 0, n: 0 });
    s.hp += e.stats.baseHp; s.atk += e.stats.baseAtk; s.matk += e.stats.baseMagicAtk; s.n++;
  }

  const out: Record<string, Share> = {};
  for (const e of Object.values(ENEMY_MAP)) {
    const d = homeDepth[e.id];
    if (d === undefined) continue;
    const s = sums[key(d, categoryOf(e))];
    // Garde-fou : un groupe dont la moyenne d'un canal est 0 (aucun ennemi n'a de
    // MATK, par ex.) ne doit pas produire de NaN — la part retombe à 1 (neutre).
    out[e.id] = {
      hp:   s.hp   > 0 ? (e.stats.baseHp       * s.n) / s.hp   : 1,
      atk:  s.atk  > 0 ? (e.stats.baseAtk      * s.n) / s.atk  : 1,
      matk: s.matk > 0 ? (e.stats.baseMagicAtk * s.n) / s.matk : 1,
      depth: d,
    };
  }
  return out;
}

const shareOf = (id: string): Share | undefined => (SHARES ??= buildShares())[id];

/**
 * Stats effectives d'un ennemi rencontré à la profondeur `depth`.
 *
 * Un ennemi hors de toute zone (les mannequins d'entraînement) garde ses stats
 * autorées telles quelles : ils sont des OUTILS de mesure, pas du contenu — les
 * mettre à l'échelle rendrait le Mannequin d'Essai inutilisable comme référence.
 */
export function scaledEnemyStats(enemy: Enemy, depth: number): EnemyStats {
  const share = shareOf(enemy.id);
  if (!share) return { ...enemy.stats };

  const d = Math.max(1, Math.min(MAX_DEPTH, Math.floor(depth)));
  const t = TARGET[categoryOf(enemy)];
  const i = d - 1; // index TOUJOURS ≥ 0 — la classe de bug des PV négatifs est morte

  return {
    baseHp:       Math.max(1, Math.round(share.hp   * t.hp[i])),
    baseAtk:      Math.max(1, Math.round(share.atk  * t.atk[i])),
    baseMagicAtk: Math.max(1, Math.round(share.matk * t.matk[i])),
    // DEF / MDEF : identité, jamais de progression (cf. en-tête).
    baseDef:      enemy.stats.baseDef,
    baseMagicDef: enemy.stats.baseMagicDef,
    // Mana : cosmétique côté ennemi (aucune formule ne le lit) — laissé tel quel.
    baseMana:     enemy.stats.baseMana,
    baseSpd:      enemy.stats.baseSpd,
  };
}

/** Profondeur d'origine d'un ennemi (la zone principale qui le liste). */
export const homeDepthOf = (enemyId: string): number => shareOf(enemyId)?.depth ?? DEFAULT_DEPTH;

/**
 * PROMOTION ÉLITE — ce qu'on multiplie à un mob banal tiré au sort comme élite
 * (`ELITE_PROMOTION_CHANCE`, GameScene) pour qu'il vaille vraiment une élite.
 *
 * DÉRIVÉ de la table, pas choisi : c'est EXACTEMENT l'écart entre le budget d'une
 * élite et celui d'un trash, à la profondeur où on se trouve. Avant, la promotion
 * appliquait ×1,5 PV / ×1,4 ATK — un « élite » promu avait donc 354 PV là où une
 * élite de data en a 964, soit moins du tiers. Même couronne, même XP ×2,5, même
 * butin : trois fois moins d'ennemi. Les deux sortes d'élite veulent dire la même
 * chose maintenant, et à toutes les profondeurs (≈ ×4,1 PV / ×1,6 ATK en zone 1).
 */
export function elitePromotionAt(depth: number): { hp: number; atk: number; matk: number } {
  const i = Math.max(1, Math.min(MAX_DEPTH, Math.floor(depth))) - 1;
  return {
    hp:   TARGET.ELITE.hp[i]   / TARGET.TRASH.hp[i],
    atk:  TARGET.ELITE.atk[i]  / TARGET.TRASH.atk[i],
    matk: TARGET.ELITE.matk[i] / TARGET.TRASH.matk[i],
  };
}
