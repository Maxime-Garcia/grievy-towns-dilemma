import { Equipment, PlayerState } from '../types';
import { StatsSystem } from './StatsSystem';

// ============================================================
// PassiveSystem — passifs d'équipement (armes/armures/accessoires)
// Pure logic : lit uniquement `passiveEffect` (src/data/items.ts, libellés FR
// dans src/data/passiveEffects.ts) sur l'équipement porté. Pas de cache — appelé
// à la demande à chaque point de branchement (CombatSystem/SkillSystem/GameScene),
// donc toujours à jour après un changement d'équipement (pas d'invalidation à gérer).
// ============================================================

const KILL_STACK_MAX = 100; // 100 × 2% = +200% de dégâts max (cf. description item)
const KILL_STACK_PCT_PER_KILL = 2;

export class PassiveSystem {

  /**
   * Plancher de cooldown d'attaque pour NO_ATTACK_COOLDOWN — qa-agent BLOCKER :
   * un cooldown nul rendait le DPS quasi-infini (attaque à chaque frame, borné
   * uniquement par le débit d'input). 250ms = ~4 attaques/s, largement au-dessus
   * de la cadence de n'importe quelle arme de base, sans être un exploit de frame-rate.
   */
  static readonly NO_ATTACK_COOLDOWN_FLOOR_MS = 250;

  /** Tous les passiveEffect actifs sur l'équipement porté (armes+armure+accessoires). */
  static getActivePassiveIds(equipment: Equipment): string[] {
    return StatsSystem.getEquippedGear(equipment)
      .map(item => item.passiveEffect)
      .filter((id): id is string => !!id);
  }

  static hasPassive(equipment: Equipment, id: string): boolean {
    return PassiveSystem.getActivePassiveIds(equipment).includes(id);
  }

  // ── Kill triggers ─────────────────────────────────────────

  static getKillHealBonusPct(equipment: Equipment): number {
    return PassiveSystem.hasPassive(equipment, 'KILL_HEAL_15_PCT') ? 15 : 0;
  }

  /** Incrémente le stack permanent de KILL_STACK_DAMAGE (plafonné), no-op si l'arme n'est pas équipée. */
  static incrementKillStackIfEquipped(player: PlayerState): void {
    if (!PassiveSystem.hasPassive(player.equipment, 'KILL_STACK_DAMAGE')) return;
    const current = player.passiveStacks['KILL_STACK_DAMAGE'] ?? 0;
    player.passiveStacks['KILL_STACK_DAMAGE'] = Math.min(KILL_STACK_MAX, current + 1);
  }

  /**
   * Multiplicateur de dégâts depuis le stack permanent (1.0 = pas de bonus).
   * BUG (code-reviewer) : gate hasPassive manquant ici alors que tous les autres
   * getters l'ont — sans ça, déséquiper hidden_soul_bow après avoir stacké
   * conservait le bonus pour toujours sur n'importe quelle arme.
   */
  static getKillStackDamageMultiplier(player: PlayerState): number {
    if (!PassiveSystem.hasPassive(player.equipment, 'KILL_STACK_DAMAGE')) return 1.0;
    const stacks = player.passiveStacks['KILL_STACK_DAMAGE'] ?? 0;
    return 1 + Math.min(stacks, KILL_STACK_MAX) * KILL_STACK_PCT_PER_KILL / 100;
  }

  /**
   * Multiplicateur "premier coup du combat" (5x si FIRST_STRIKE_500_PCT équipé et
   * pas encore consommé ce combat) — consomme le flag en mutant player.firstStrikeReady.
   * Effet de bord assumé (même style que CombatSystem.getSoulEchoBonus/playerSkill).
   *
   * qa-agent BUG : réservé aux cibles isBoss=true — sans ça, le ×5 se cumule avec
   * crit(×2)/élément/Soul Echo (jusqu'à ×17,7) et se déclenchait sur CHAQUE combat,
   * one-shot systématique du trash mob. Contre un non-boss, le flag n'est PAS
   * consommé : il reste prêt pour le prochain boss rencontré.
   */
  static getFirstStrikeMultiplier(player: PlayerState, targetIsBoss: boolean): number {
    if (!player.firstStrikeReady) return 1.0;
    if (!targetIsBoss) return 1.0;
    if (!PassiveSystem.hasPassive(player.equipment, 'FIRST_STRIKE_500_PCT')) return 1.0;
    player.firstStrikeReady = false;
    return 5.0;
  }

  // ── Dégâts subis ──────────────────────────────────────────

  static getDamageReductionPct(equipment: Equipment): number {
    return PassiveSystem.hasPassive(equipment, 'DMG_REDUCTION_40_DEATH_RESIST') ? 40 : 0;
  }

  /** Probabilité (0-1) qu'un coup normalement fatal laisse le joueur à 1 HP. */
  static getDeathResistChance(equipment: Equipment): number {
    return PassiveSystem.hasPassive(equipment, 'DMG_REDUCTION_40_DEATH_RESIST') ? 0.30 : 0;
  }

  static getMagicReflectPct(equipment: Equipment): number {
    return PassiveSystem.hasPassive(equipment, 'MAGIC_REFLECT_25_PCT') ? 25 : 0;
  }

  // ── Régénération / mana / cooldowns ───────────────────────

  static getPermanentRegenPctPerSec(equipment: Equipment): number {
    return PassiveSystem.hasPassive(equipment, 'PERMANENT_REGEN_1_PCT_PER_SEC') ? 1 : 0;
  }

  static hasZeroManaCost(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'ZERO_MANA_COST');
  }

  static hasNoAttackCooldown(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'NO_ATTACK_COOLDOWN');
  }

  static hasCombatStartZeroCd(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'COMBAT_START_ZERO_CD');
  }

  // ── Bonus par élément de compétence ───────────────────────

  static getFireSkillCdReductionPct(equipment: Equipment): number {
    return PassiveSystem.hasPassive(equipment, 'FIRE_SKILL_CD_15_PCT') ? 15 : 0;
  }

  static getIceSlowBonusPct(equipment: Equipment): number {
    return PassiveSystem.hasPassive(equipment, 'ICE_SLOW_15_PCT') ? 15 : 0;
  }

  static getLightningStunnedDmgBonusPct(equipment: Equipment): number {
    return PassiveSystem.hasPassive(equipment, 'LIGHTNING_DMG_STUNNED_20_PCT') ? 20 : 0;
  }

  static getHealSkillBonusPct(equipment: Equipment): number {
    return PassiveSystem.hasPassive(equipment, 'HEAL_SKILL_20_PCT') ? 20 : 0;
  }

  static getWaterDmgBonusPct(equipment: Equipment): number {
    return PassiveSystem.hasPassive(equipment, 'WATER_DMG_15_SPEED_10_PCT') ? 15 : 0;
  }

  /** Anneau du Délié : +dégâts de compétences MAIS +temps de recharge (trade-off mythique). */
  static getUnboundSkillDmgCdPct(equipment: Equipment): { dmgPct: number; cdPct: number } {
    const active = PassiveSystem.hasPassive(equipment, 'SKILL_DMG_15_CD_10_PCT');
    return { dmgPct: active ? 15 : 0, cdPct: active ? 10 : 0 };
  }

  // ── Déplacement ───────────────────────────────────────────

  static getDashDistanceBonusPct(equipment: Equipment): number {
    return PassiveSystem.hasPassive(equipment, 'DASH_DISTANCE_20_PCT') ? 20 : 0;
  }

  static getMoveSpeedBonusPct(equipment: Equipment): number {
    return PassiveSystem.hasPassive(equipment, 'WATER_DMG_15_SPEED_10_PCT') ? 10 : 0;
  }

  // ── Bouclier bas HP (ring_of_preservation) ────────────────

  static hasLowHpShield(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'LOW_HP_SHIELD_30_PCT');
  }

  static readonly LOW_HP_SHIELD_THRESHOLD_PCT = 20;
  static readonly LOW_HP_SHIELD_AMOUNT_PCT = 30;
  static readonly LOW_HP_SHIELD_COOLDOWN_MS = 120_000;
}
