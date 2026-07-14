import {
  Item, ItemType, Weapon, Armor, Accessory,
  EquipStats, EquipStatRanges, RangedStat, SubstatKey,
  SUBSTAT_COUNT_BY_RARITY,
} from '../types';
import { HIDDEN_ROLL_EXCLUSIONS } from '../data/hiddenRollExclusions';

// ============================================================
// StatRollSystem — moteur de rolls de stats sur le loot, façon Dofus
// (docs/design/LOOT_STAT_ROLLS.md). Logique pure, zéro import Phaser.
//
// LootSystem reste responsable du QUOI (rareté, pity, quantité) ;
// StatRollSystem est responsable du COMBIEN (valeurs tirées dans les
// fourchettes du catalogue, cf. EquipStatRanges).
// ============================================================

/** Demi-largeur du jitter par ligne autour de la Résonance globale Q (±15 points). */
const LINE_JITTER = 0.30;

// ============================================================
// RENDEMENTS DÉCROISSANTS — remplacent les anciens PLAFONDS DURS
// (CDR_CAP_PCT 30 / DODGE_CAP_PCT 20 / BOSS_DMG_CAP_PCT 40).
// ============================================================
//
// Pourquoi les murs sont tombés. Un plafond dur est un garde-fou paresseux : il
// empêche l'abus au prix de la cohérence. Passé le mur, chaque ligne SUPPLÉMENTAIRE
// vaut EXACTEMENT ZÉRO — et le joueur ne le voit nulle part.
//
// Ce n'était pas théorique. Mesuré sur 3000 sets Mythique complets tirés du vrai
// catalogue : le CDR médian atteignait 65 pour un plafond de 30 — 100% des sets
// dépassaient le mur et 51% des points de CDR rollés partaient à la poubelle.
// Et une ligne DODGE_PCT de plus, sur un set Mythique déjà au plafond, valait
// 0,00 point de puissance : un drop qui ne rend rien.
//
// Le principe qui remplace le mur : UNE STAT NE DOIT JAMAIS VALOIR EXACTEMENT ZÉRO.
// Une ligne de loot qui ne sert à rien est une déception à chaque drop.
//
// La courbe : eff(x) = S·x / (x + S).
//   - strictement croissante : la 10e ligne rapporte encore, moins que la 1re,
//     jamais rien (dérivée = S²/(x+S)² > 0, toujours) ;
//   - asymptote S : on approche S sans jamais l'atteindre — l'abus est borné
//     par la forme de la courbe, pas par un mur ;
//   - eff(S) = S/2 : à x = S, on a la moitié de l'asymptote. Repère de lecture.
//
// Les valeurs de S sont choisies pour que le PIRE CAS simulé (build full Mythic
// optimisée sur une seule stat) reste jouable — cf. le rapport d'équilibrage.
export const CDR_SOFT_PCT = 70;        // esquive de recharge : plafond effectif ~45%
export const DODGE_SOFT_PCT = 75;      // esquive : plafond effectif ~55%
export const BOSS_DMG_SOFT_PCT = 150;  // dégâts vs boss : plafond effectif ~+90%

/**
 * Rendements décroissants. `raw` = somme brute des substats ; `soft` = asymptote.
 * Jamais négatif, jamais nul en marge, jamais au-dessus de `soft`.
 */
export function softcap(raw: number, soft: number): number {
  if (raw <= 0) return 0;
  return (soft * raw) / (raw + soft);
}

export type ResonanceLabel = 'Sourde' | 'Stable' | 'Claire' | 'Vibrante' | 'Parfaite';

/** Types d'items équipables portant potentiellement un equipRanges/equipStats. */
export type Equipable = Weapon | Armor | Accessory;

const EQUIPABLE_TYPES: ReadonlySet<ItemType> = new Set([
  ItemType.WEAPON, ItemType.HELM, ItemType.CHEST, ItemType.LEGS,
  ItemType.BOOTS, ItemType.GLOVES, ItemType.CAPE, ItemType.RING, ItemType.AMULET,
]);

/** Exporté : réutilisé par SaveSystem (migration) pour narrower un Item en Equipable sans `any`. */
export function isEquipableItem(item: Item): item is Equipable {
  return EQUIPABLE_TYPES.has(item.type);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Tire une valeur entière dans [min, max] à qualité locale q = Q ± jitter, clampée. */
function rollLine(min: number, max: number, Q: number): number {
  if (max <= min) return min; // ligne fixe autorisée (max === min)
  const q = clamp01(Q + (Math.random() - 0.5) * LINE_JITTER);
  return Math.round(min + (max - min) * q);
}

/** Roll d'une stat implicite d'armure (defense/magicDefense) autour de sa valeur catalogue ±width. */
function rollImplicit(centerValue: number, width: number, Q: number): number {
  if (centerValue <= 0) return centerValue; // pas de ligne implicite significative
  const min = centerValue * (1 - width);
  const max = centerValue * (1 + width);
  const q = clamp01(Q + (Math.random() - 0.5) * LINE_JITTER);
  return Math.round(min + (max - min) * q);
}

function validateItemRanges(item: Equipable, R: EquipStatRanges): void {
  const expected = SUBSTAT_COUNT_BY_RARITY[item.rarity];
  if (R.substats.length !== expected) {
    // eslint-disable-next-line no-console
    console.warn(`[StatRollSystem] ${item.id} : ${R.substats.length} substat(s) — attendu ${expected} pour ${item.rarity}.`);
  }

  const allLines: RangedStat[] = [R.mainStat, ...R.substats];
  const seenKeys = new Set<SubstatKey>();
  for (const line of allLines) {
    if (seenKeys.has(line.key)) {
      // eslint-disable-next-line no-console
      console.warn(`[StatRollSystem] ${item.id} : clé "${line.key}" dupliquée.`);
    }
    seenKeys.add(line.key);

    if (line.max < line.min) {
      // eslint-disable-next-line no-console
      console.warn(`[StatRollSystem] ${item.id} : ligne "${line.key}" invalide (max ${line.max} < min ${line.min}).`);
    }
  }

  const forbidden = HIDDEN_ROLL_EXCLUSIONS[item.id];
  if (forbidden) {
    for (const key of seenKeys) {
      if (forbidden.includes(key)) {
        // eslint-disable-next-line no-console
        console.warn(`[StatRollSystem] ${item.id} (HIDDEN) : clé "${key}" interdite par exclusion de passif (§2.3).`);
      }
    }
  }
}

export class StatRollSystem {
  /**
   * Roll une instance à partir du template catalogue.
   * - `qFloor` (0–1) : plancher de Résonance — 0 pour un drop ennemi standard
   *   ou un achat en boutique, 0.5 pour un drop garanti de boss (première
   *   mort) ou une migration de save, 0.35 pour une récompense de quête.
   * - No-op sûr (retourne un clone superficiel du template) pour tout item non
   *   équipable, ou équipable mais sans `equipRanges` authoré (data
   *   incomplète — laissé tel quel, cf. content-agent §6.2).
   */
  static rollItem(template: Item, qFloor = 0): Item {
    if (!isEquipableItem(template)) return { ...template };
    const R = template.equipRanges;
    if (!R) return { ...template };

    // 1) Résonance globale de l'instance — UNIFORME (la rareté détermine le
    //    nombre de lignes et la largeur des fourchettes, jamais la qualité max).
    const Q = clamp01(qFloor + Math.random() * (1 - qFloor));

    const mainStatValue = rollLine(R.mainStat.min, R.mainStat.max, Q);
    const equipStats: EquipStats = {
      mainStat: { key: R.mainStat.key, value: mainStatValue, isPercentage: R.mainStat.isPercentage },
      substats: R.substats.map(s => ({
        key: s.key,
        value: rollLine(s.min, s.max, Q),
        isPercentage: s.isPercentage,
      })),
    };

    const instance = { ...template, equipStats } as Equipable;

    // 3) Miroir arme (règle absolue CLAUDE.md — dans les DEUX sens)
    // Narrowing sur `template` (pas `instance`, structurellement identique ici
    // mais TS ne le sait pas) — évite un accès invalide à des champs absents
    // du type large `Equipable` sur la variable qu'on lit.
    if ('weaponType' in template) {
      const w = instance as Weapon;
      if (R.mainStat.key === 'ATK_FLAT')  w.damage      = mainStatValue;
      if (R.mainStat.key === 'MATK_FLAT') w.magicDamage = mainStatValue;
    }

    // 4) Stats implicites d'armure (defense / magicDefense), même Q, largeur ±implicitWidth
    if ('defense' in template) {
      const a = instance as Armor;
      const w = R.implicitWidth ?? 0.10;
      a.defense      = rollImplicit(template.defense, w, Q);
      a.magicDefense = rollImplicit(template.magicDefense, w, Q);
    }

    // 5) Cache de Résonance
    instance.rollQuality = StatRollSystem.computeQuality(equipStats, R);

    return instance;
  }

  /**
   * Résonance globale (0–100) d'une instance déjà rollée : moyenne des
   * qualités normalisées de chaque ligne rollable (q_ligne = (value-min)/(max-min)),
   * lignes fixes (max === min) exclues du calcul (§4.2 point 5).
   */
  static computeQuality(equipStats: EquipStats, ranges: EquipStatRanges): number {
    const lines: { min: number; max: number; value: number }[] = [
      { min: ranges.mainStat.min, max: ranges.mainStat.max, value: equipStats.mainStat.value },
      ...ranges.substats.map((r, i) => ({
        min: r.min, max: r.max, value: equipStats.substats[i]?.value ?? r.min,
      })),
    ];

    const rollable = lines.filter(l => l.max > l.min);
    if (rollable.length === 0) return 50; // toutes lignes fixes — ne devrait pas arriver en pratique

    const avgQ = rollable.reduce((sum, l) => sum + (l.value - l.min) / (l.max - l.min), 0) / rollable.length;
    return Math.round(clamp01(avgQ) * 100);
  }

  /**
   * Libellé de Résonance affiché en UI (docs/design/LOOT_STAT_ROLLS.md §4.3).
   * Pure fonction de mapping valeur → libellé — aucune UI ici.
   */
  static getResonanceLabel(quality: number): ResonanceLabel {
    if (quality >= 98) return 'Parfaite';
    if (quality >= 85) return 'Vibrante';
    if (quality >= 60) return 'Claire';
    if (quality >= 30) return 'Stable';
    return 'Sourde';
  }

  /**
   * True si la Résonance mérite une notification même sur un Common (§7.2 :
   * Vibrante ou mieux) — seuil unique, ne JAMAIS réécrire `>= 85` ailleurs.
   */
  static isNotableResonance(quality: number): boolean {
    const label = this.getResonanceLabel(quality);
    return label === 'Vibrante' || label === 'Parfaite';
  }

  /**
   * À appeler UNE FOIS au chargement de src/data/items.ts, juste avant le
   * remplissage de ALL_ITEMS. Mute les items en place :
   * - calcule `equipStats` = centre de chaque fourchette pour tout item ayant
   *   `equipRanges` (le catalogue reste lisible par tout le code existant
   *   sans modification défensive) ;
   * - écrase le miroir arme (`damage`/`magicDamage`) depuis le centre du mainStat ;
   * - valide en dev (console.warn) : compte de substats, clés dupliquées,
   *   `max >= min`, exclusions HIDDEN (§2.3).
   * Items sans `equipRanges` : laissés tels quels (no-op sûr — data
   * incomplète en attente du content-agent, cf. §6.2).
   */
  static finalizeCatalogue(items: Item[]): void {
    for (const item of items) {
      if (!isEquipableItem(item)) continue;
      const R = item.equipRanges;
      if (!R) continue;

      const mainCenter = Math.round((R.mainStat.min + R.mainStat.max) / 2);
      const equipStats: EquipStats = {
        mainStat: { key: R.mainStat.key, value: mainCenter, isPercentage: R.mainStat.isPercentage },
        substats: R.substats.map(s => ({
          key: s.key,
          value: Math.round((s.min + s.max) / 2),
          isPercentage: s.isPercentage,
        })),
      };
      item.equipStats = equipStats;

      if ('weaponType' in item) {
        if (R.mainStat.key === 'ATK_FLAT')  item.damage      = mainCenter;
        if (R.mainStat.key === 'MATK_FLAT') item.magicDamage = mainCenter;
      }

      if (import.meta.env.DEV) validateItemRanges(item, R);
    }
  }
}
