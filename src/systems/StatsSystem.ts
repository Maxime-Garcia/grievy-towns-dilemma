import {
  PlayerState,
  Equipment,
  SubstatKey,
  StatBonus,
  Weapon,
  Armor,
  Accessory,
} from '../types';
import { ProgressionSystem } from './ProgressionSystem';

// ============================================================
// StatsSystem — agrégation des stats joueur + équipement
// (main stat + substats ARPG, cf. docs/design/INSPIRATIONS.md §4)
// ============================================================

/**
 * Stats finales du joueur, équipement inclus.
 *
 * IMPORTANT — intégration combat :
 * - `atk` / `matk` incluent DÉJÀ la main stat de l'arme (miroir de
 *   weapon.damage / weapon.magicDamage). Un consommateur de ComputedStats
 *   ne doit PAS ré-ajouter weapon.damage dans sa formule de dégâts.
 * - `crit` est un pourcentage total (ex: 9.5 → 9.5% de chance).
 * - `critDmg` est un multiplicateur (1.5 = +50% de dégâts en critique).
 * - `aspd` est un multiplicateur GLOBAL (1.1 = +10%) à appliquer PAR-DESSUS
 *   le `attackSpeed` propre à l'arme équipée.
 * - `elemBonus` / `lifesteal` sont des pourcentages totaux.
 */
export interface ComputedStats {
  atk: number;
  matk: number;
  def: number;
  magicDef: number; // complément : cohérence avec Stats (pas de substat dédiée)
  hp: number;
  mana: number;
  crit: number;      // % total (base + items)
  critDmg: number;   // multiplicateur (ex: 1.5 = +50%)
  aspd: number;      // multiplicateur (ex: 1.1 = +10%)
  spd: number;
  elemBonus: number; // % bonus élémentaire global
  lifesteal: number; // % lifesteal
}

type GearPiece = Weapon | Armor | Accessory;

// GDD §Combat : crit chance = 5% + AGI * 0.3%, crit multiplier = 2.0x (un crit double les dégâts)
const BASE_CRIT_PCT = 5;
const CRIT_PER_AGI_PCT = 0.3;
const BASE_CRIT_MULT = 2.0;

/** Clés dont la valeur s'affiche en % (fallback si isPercentage absent). */
const PERCENT_KEYS: ReadonlySet<SubstatKey> = new Set<SubstatKey>([
  'ATK_PCT', 'MATK_PCT', 'DEF_PCT', 'HP_PCT',
  'CRIT_RATE', 'CRIT_DMG', 'ASPD_PCT', 'ELEM_BONUS_PCT', 'LIFESTEAL_PCT',
]);

/** Libellés lisibles par le joueur (UI panneaux d'items, comparaisons). */
const STAT_LABELS: Record<SubstatKey, string> = {
  ATK_FLAT: 'ATK',
  ATK_PCT: 'ATK',
  MATK_FLAT: 'M.ATK',
  MATK_PCT: 'M.ATK',
  DEF_FLAT: 'DEF',
  DEF_PCT: 'DEF',
  HP_FLAT: 'PV',
  HP_PCT: 'PV Max',
  CRIT_RATE: 'Taux CRIT',
  CRIT_DMG: 'DGT CRIT',
  ASPD_PCT: 'Vit. d\'attaque',
  SPD_FLAT: 'VIT',
  ELEM_BONUS_PCT: 'Dégâts élém.',
  MANA_FLAT: 'Mana',
  LIFESTEAL_PCT: 'Vol de vie',
};

const ZERO_TOTALS = (): Record<SubstatKey, number> => ({
  ATK_FLAT: 0, ATK_PCT: 0, MATK_FLAT: 0, MATK_PCT: 0,
  DEF_FLAT: 0, DEF_PCT: 0, HP_FLAT: 0, HP_PCT: 0,
  CRIT_RATE: 0, CRIT_DMG: 0, ASPD_PCT: 0, SPD_FLAT: 0,
  ELEM_BONUS_PCT: 0, MANA_FLAT: 0, LIFESTEAL_PCT: 0,
});

export class StatsSystem {
  /**
   * Calcule toutes les stats du joueur en agrégeant :
   * 1. Les stats de base (niveau + attributs — source de vérité recalculée,
   *    indépendante des mutations passées de player.stats)
   * 2. Les bonusStats legacy + defense/magicDefense des équipements
   *    (compatibilité totale avec l'ancien système, toujours additifs)
   * 3. Les equipStats.mainStat de chaque pièce équipée
   * 4. Les substats de chaque pièce équipée
   * Ordre d'application : flats d'abord, puis pourcentages (multiplicatifs).
   */
  static computeAll(player: PlayerState): ComputedStats {
    const base = ProgressionSystem.computeBaseStats(player.level, player.attributes);
    const gear = StatsSystem.getEquippedGear(player.equipment);

    let atk = base.atk;
    let matk = base.magicAtk;
    let def = base.def;
    let magicDef = base.magicDef;
    let hp = base.maxHp;
    let mana = base.maxMana;
    let spd = base.spd;

    // ── 2) Ancien système : bonusStats + defense/magicDefense ──
    for (const item of gear) {
      const b: StatBonus = item.bonusStats ?? {};
      if (b.hp)       hp   += b.hp;
      if (b.mana)     mana += b.mana;
      if (b.atk)      atk  += b.atk;
      if (b.def)      def  += b.def;
      if (b.spd)      spd  += b.spd;
      if (b.magicAtk) matk += b.magicAtk;
      if (b.magicDef) magicDef += b.magicDef;
      if (b.str)      atk  += b.str * 3;
      if (b.int)      { matk += b.int * 3; mana += b.int * 5; }
      if (b.agi)      spd  += b.agi * 2;
      if (b.vit)      hp   += b.vit * 8;
      if (b.end)      { def += b.end * 2; magicDef += b.end; }

      if ('defense' in item) {
        def      += item.defense;
        magicDef += item.magicDefense;
      }
    }

    // ── 3 + 4) Nouveau système : main stats + substats ──
    const t = StatsSystem.collectEquipTotals(gear);

    // Flats puis pourcentages (les % s'appliquent au total flat inclus)
    atk  = Math.round((atk  + t.ATK_FLAT)  * (1 + t.ATK_PCT  / 100));
    matk = Math.round((matk + t.MATK_FLAT) * (1 + t.MATK_PCT / 100));
    def  = Math.round((def  + t.DEF_FLAT)  * (1 + t.DEF_PCT  / 100));
    hp   = Math.round((hp   + t.HP_FLAT)   * (1 + t.HP_PCT   / 100));
    mana = Math.round(mana + t.MANA_FLAT);
    spd  = Math.round(spd  + t.SPD_FLAT);

    return {
      atk,
      matk,
      def,
      magicDef,
      hp,
      mana,
      crit: BASE_CRIT_PCT + player.attributes.agi * CRIT_PER_AGI_PCT + t.CRIT_RATE,
      critDmg: BASE_CRIT_MULT + t.CRIT_DMG / 100,
      aspd: Math.max(0.1, 1 + t.ASPD_PCT / 100),
      spd,
      elemBonus: t.ELEM_BONUS_PCT,
      lifesteal: t.LIFESTEAL_PCT,
    };
  }

  /**
   * Somme la valeur d'une substat spécifique sur tous les équipements
   * équipés (substats uniquement — les main stats ne comptent pas ici).
   */
  static getTotalSubstat(player: PlayerState, key: SubstatKey): number {
    let total = 0;
    for (const item of StatsSystem.getEquippedGear(player.equipment)) {
      if (!item.equipStats) continue;
      for (const sub of item.equipStats.substats) {
        if (sub.key === key) total += sub.value;
      }
    }
    return total;
  }

  /**
   * Libellé lisible d'une stat (ex: 'ATK_FLAT', 18 → '+18 ATK',
   * 'ASPD_PCT', 8 → '+8% Vit. d'attaque').
   * `isPercentage` prime s'il est fourni, sinon déduit de la clé.
   */
  static formatStat(key: SubstatKey, value: number, isPercentage?: boolean): string {
    const pct = isPercentage ?? PERCENT_KEYS.has(key);
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}${pct ? '%' : ''} ${STAT_LABELS[key]}`;
  }

  // ── Internes ──────────────────────────────────────────────

  private static getEquippedGear(equipment: Equipment): GearPiece[] {
    const slots: (GearPiece | undefined)[] = [
      equipment.weapon,
      equipment.helm,
      equipment.chest,
      equipment.legs,
      equipment.boots,
      equipment.gloves,
      equipment.cape,
      equipment.ring1,
      equipment.ring2,
      equipment.amulet,
    ];
    return slots.filter((i): i is GearPiece => i !== undefined);
  }

  /** Totaux main stat + substats par clé, sur tout l'équipement porté. */
  private static collectEquipTotals(gear: GearPiece[]): Record<SubstatKey, number> {
    const totals = ZERO_TOTALS();
    for (const item of gear) {
      const es = item.equipStats;
      if (es) {
        totals[es.mainStat.key] += es.mainStat.value;
        for (const sub of es.substats) {
          totals[sub.key] += sub.value;
        }
      } else if ('weaponType' in item) {
        // Filet de sécurité : certaines armes n'ont pas (encore) d'equipStats —
        // sans ce fallback leur damage/magicDamage ne contribuerait à AUCUNE
        // formule de combat (CombatSystem lit cs.atk/cs.matk, jamais weapon.damage
        // directement). Mirror direct tant que la data n'est pas complétée.
        if (item.damage)      totals.ATK_FLAT  += item.damage;
        if (item.magicDamage) totals.MATK_FLAT += item.magicDamage;
      }
    }
    return totals;
  }
}
