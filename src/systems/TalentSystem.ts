// Pure system — zero Phaser imports.
// Consomme PlayerState (types) et TALENT_MAP (data) uniquement.

import { PlayerState, TalentBranch } from '../types';
import { TALENT_MAP } from '../data/talents';

// Snapshot immutable des modificateurs actifs, calculé une seule fois après chaque
// unlock/respec/changement d'équipement. NE PAS appeler à chaque frame.
export interface TalentModifiers {
  meleeDmgMult: number;         // base 1.0 — multiplie tous les dégâts de mêlée
  magicDmgMult: number;         // base 1.0 — multiplie dégâts magiques + skills
  critBonus: number;            // % additionnel de chance de crit (s'ajoute au calcul de ProgressionSystem)
  moveSpeedMult: number;        // base 1.0 — multiplie la vitesse de déplacement
  comboGraceMult: number;       // multiplicateur sur graceMs des COMBO_CONFIGS
  dashPreservesCombo: boolean;  // si true, le dash gèle le timer combo 0.35s
  killHealPct: number;          // % des HP max rendus par kill mêlée
  maxHpMult: number;            // base 1.0 — multiplie maxHp (appliqué lors du recalcul de stats)
  lowHpAtkMult: number;         // base 1.0 — actif si HP < 35%, multiplie l'ATK
  comboStackDmg: number;        // % de dégâts supplémentaires par coup dans la chaîne (ins_deadly_dance)
  bowRangeDmgPct: number;       // % additionnel de dégâts BOW sur cibles > 250px
  skillDmgMult: number;         // base 1.0 — multiplie les dégâts de tous les skills actifs
  projectileSkillMult: number;  // base 1.0 — multiplie fireball, frost_lance, thunder_bolt, etc.
  shieldSkillMult: number;      // base 1.0 — multiplie stone_shield / ice_barrier
  finisherNova: boolean;        // si true, tout finisher déclenche une nova élémentaire
  staffFinisherZone: boolean;   // si true, finisher STAFF laisse une zone au sol
  bowElementalArrows: boolean;  // si true et INT≥10, flèches héritent l'élément de l'arc
  windupArmor: boolean;         // si true, aucun knockback durant windup GS/HAMMER/AXE
  heavyFinisherBonus: number;   // % additionnel sur les finishers GREATSWORD/HAMMER/AXE
  heavyCdReductionPct: number;  // % de réduction du cooldown GS/HAMMER/AXE
  lightFinisherBleed: boolean;  // si true, finishers DAGGER/DUAL_DAGGER/DUAL_SWORD appliquent saignement renforcé
}

export class TalentSystem {

  /** Points déjà dépensés dans une branche (somme des coûts des nœuds débloqués). */
  static pointsSpentInBranch(player: PlayerState, branch: TalentBranch): number {
    return player.unlockedTalents.reduce((sum, id) => {
      const node = TALENT_MAP[id];
      return node?.branch === branch ? sum + node.cost : sum;
    }, 0);
  }

  /**
   * Vérifie si un nœud peut être débloqué :
   * - non déjà acquis
   * - suffisamment de points disponibles
   * - gate par investissement : tier2=2pts, tier3=4pts, capstone=6pts dans la branche
   */
  static canUnlock(player: PlayerState, talentId: string): boolean {
    const node = TALENT_MAP[talentId];
    if (!node) return false;
    if (player.unlockedTalents.includes(talentId)) return false;
    if (player.talentPoints < node.cost) return false;

    const spent = TalentSystem.pointsSpentInBranch(player, node.branch);
    const GATE: Record<1 | 2 | 3 | 4, number> = { 1: 0, 2: 2, 3: 4, 4: 6 };
    if (spent < GATE[node.tier]) return false;

    return true;
  }

  /**
   * Tente de débloquer le nœud. Retourne true si réussi.
   * Mute player.unlockedTalents et player.talentPoints.
   */
  static unlock(player: PlayerState, talentId: string): boolean {
    if (!TalentSystem.canUnlock(player, talentId)) return false;
    const node = TALENT_MAP[talentId]!;
    player.talentPoints -= node.cost;
    player.unlockedTalents = [...player.unlockedTalents, talentId];
    return true;
  }

  /** Coût d'un respec : 200 × or × (respecCount + 1). */
  static respecCost(player: PlayerState): number {
    return 200 * (player.respecCount + 1);
  }

  /**
   * Effectue un respec : rend tous les points dépensés, défalque l'or, incrémente respecCount.
   * Retourne true si réussi (or suffisant).
   */
  static respec(player: PlayerState): boolean {
    const cost = TalentSystem.respecCost(player);
    if (player.gold < cost) return false;

    const totalSpent = player.unlockedTalents.reduce((sum, id) => {
      return sum + (TALENT_MAP[id]?.cost ?? 0);
    }, 0);

    player.gold -= cost;
    player.talentPoints += totalSpent;
    player.unlockedTalents = [];
    player.respecCount++;
    return true;
  }

  /**
   * Agrège les effets de tous les talents débloqués en un objet TalentModifiers.
   * À appeler après chaque unlock/respec/changement d'équipement — PAS à chaque frame.
   */
  static getModifiers(player: PlayerState): TalentModifiers {
    const mods: TalentModifiers = {
      meleeDmgMult: 1.0,
      magicDmgMult: 1.0,
      critBonus: 0,
      moveSpeedMult: 1.0,
      comboGraceMult: 1.0,
      dashPreservesCombo: false,
      killHealPct: 0,
      maxHpMult: 1.0,
      lowHpAtkMult: 1.0,
      comboStackDmg: 0,
      bowRangeDmgPct: 0,
      skillDmgMult: 1.0,
      projectileSkillMult: 1.0,
      shieldSkillMult: 1.0,
      finisherNova: false,
      staffFinisherZone: false,
      bowElementalArrows: false,
      windupArmor: false,
      heavyFinisherBonus: 0,
      heavyCdReductionPct: 0,
      lightFinisherBleed: false,
    };

    for (const id of player.unlockedTalents) {
      const node = TALENT_MAP[id];
      if (!node) continue;
      const e = node.effects;

      if (e.MELEE_DMG_PCT !== undefined)          mods.meleeDmgMult        *= 1 + e.MELEE_DMG_PCT / 100;
      if (e.MAGIC_DMG_PCT !== undefined)          mods.magicDmgMult        *= 1 + e.MAGIC_DMG_PCT / 100;
      if (e.CRIT_PCT !== undefined)               mods.critBonus           += e.CRIT_PCT;
      if (e.MOVE_SPEED_PCT !== undefined)         mods.moveSpeedMult       *= 1 + e.MOVE_SPEED_PCT / 100;
      if (e.COMBO_GRACE_PCT !== undefined)        mods.comboGraceMult      *= 1 + e.COMBO_GRACE_PCT / 100;
      if (e.DASH_PRESERVES_COMBO !== undefined)   mods.dashPreservesCombo   = true;
      if (e.KILL_HEAL_PCT !== undefined)          mods.killHealPct         += e.KILL_HEAL_PCT;
      if (e.MAX_HP_PCT !== undefined)             mods.maxHpMult           *= 1 + e.MAX_HP_PCT / 100;
      if (e.LOW_HP_ATK_PCT !== undefined)         mods.lowHpAtkMult        *= 1 + e.LOW_HP_ATK_PCT / 100;
      if (e.COMBO_STACK_DMG !== undefined)        mods.comboStackDmg       += e.COMBO_STACK_DMG;
      if (e.BOW_RANGE_DMG_PCT !== undefined)      mods.bowRangeDmgPct      += e.BOW_RANGE_DMG_PCT;
      if (e.SKILL_DMG_PCT !== undefined)          mods.skillDmgMult        *= 1 + e.SKILL_DMG_PCT / 100;
      if (e.PROJECTILE_SKILL_PCT !== undefined)   mods.projectileSkillMult *= 1 + e.PROJECTILE_SKILL_PCT / 100;
      if (e.SHIELD_SKILL_PCT !== undefined)       mods.shieldSkillMult     *= 1 + e.SHIELD_SKILL_PCT / 100;
      if (e.FINISHER_NOVA !== undefined)          mods.finisherNova         = true;
      if (e.STAFF_FINISHER_ZONE !== undefined)    mods.staffFinisherZone    = true;
      if (e.BOW_ELEMENTAL_ARROWS !== undefined)   mods.bowElementalArrows   = true;
      if (e.WINDUP_ARMOR !== undefined)           mods.windupArmor          = true;
      if (e.HEAVY_FINISHER_BONUS !== undefined)   mods.heavyFinisherBonus  += e.HEAVY_FINISHER_BONUS;
      if (e.HEAVY_CD_REDUCTION_PCT !== undefined) mods.heavyCdReductionPct += e.HEAVY_CD_REDUCTION_PCT;
      if (e.LIGHT_FINISHER_BLEED !== undefined)   mods.lightFinisherBleed   = true;
      // DEF_PCT, MANA_COST_PCT, POST_FINISHER_BUFF : consommés directement depuis node.effects
      // par les systèmes qui gèrent le calcul de stat ou le buff post-finisher — pas de champ TalentModifiers dédié.
    }

    return mods;
  }
}
