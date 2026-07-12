import { Equipment, PlayerState } from '../types';
import { StatsSystem } from './StatsSystem';

// ── État éphémère "wave 2" (non persisté — possédé par GameScene, cf. dashCooldown/
// playerShieldHp) ─────────────────────────────────────────────────────────
// Ces objets sont de simples sacs de données (aucun import Phaser) mutés par les
// méthodes pures ci-dessous, à l'identique du principe déjà établi par
// player.passiveStacks (incrementKillStackIfEquipped) — seule différence : ils ne
// survivent pas à une sauvegarde (état de combat transitoire, reconstruit en jeu).

/** SAME_TARGET_STACK_10_PCT (hidden_serpentgrip_gauntlets) — stack courant contre
 *  la cible actuellement frappée. */
export interface SameTargetStackState {
  targetId: string | null;
  stacks: number;
  lastHitAt: number;
}

/** CRIT_CD_RESET_1S (hidden_stormchain_ring) — fenêtre glissante anti-spam (4 max/s). */
export interface CritCdResetState {
  windowStart: number;
  count: number;
}

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

  // ════════════════════════════════════════════════════════════════════
  // HIDDEN — VAGUE 2 (15 passifs, cf. docs de contenu content/hidden-wave2)
  // Implémentation système uniquement — les items eux-mêmes (hidden_magma_cleaver,
  // hidden_stoneheart_maul, etc.) sont ajoutés dans une PR content/* séparée qui
  // référence ces mêmes ids de passiveEffect.
  // ════════════════════════════════════════════════════════════════════

  // ── 1. PERMA_BURN_STACK_3_PCT (hidden_magma_cleaver) ──────────────────
  // Marque de Magma : cf. CombatSystem.getMagmaBurnTickDamage (calcul) +
  // GameScene.applyMagmaBurnStack/tickEnemyAI (état par cible + tick 1s, stocké
  // hors PlayerState car lié à l'instance ennemie, pas au joueur).
  static readonly MAGMA_BURN_STACK_MAX = 10;
  static readonly MAGMA_BURN_PCT_PER_STACK = 3;

  static hasMagmaBurn(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'PERMA_BURN_STACK_3_PCT');
  }

  // ── 2. DEF_IGNORE_100_PCT (hidden_stoneheart_maul) ────────────────────
  static hasDefIgnore(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'DEF_IGNORE_100_PCT');
  }

  // ── 3. NO_DASH_COOLDOWN (hidden_zephyr_fang) ──────────────────────────
  // Même garde-fou anti-exploit que NO_ATTACK_COOLDOWN_FLOOR_MS : un dash à 0s
  // de recharge serait un dash-spam d'invincibilité (iframes wallhack de fait).
  static readonly NO_DASH_COOLDOWN_FLOOR_S = 0.4;

  static hasNoDashCooldown(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'NO_DASH_COOLDOWN');
  }

  // ── 4. OMNIVAMP_25_PCT (hidden_abyssal_talons) ────────────────────────
  // Distinct de cs.lifesteal (StatsSystem/loot stat rolls) — s'additionne dessus,
  // "TOUS les dégâts infligés" (attaques de base, compétences, DoT).
  static getOmnivampPct(equipment: Equipment): number {
    return PassiveSystem.hasPassive(equipment, 'OMNIVAMP_25_PCT') ? 25 : 0;
  }

  // ── 5. SKILL_ECHO_50_PCT (hidden_stormheart_staff) ────────────────────
  static readonly SKILL_ECHO_DELAY_MS = 400;
  static readonly SKILL_ECHO_PCT = 50;

  static hasSkillEcho(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'SKILL_ECHO_50_PCT');
  }

  // ── 6. FREEZE_RETALIATION_1_5S (hidden_permafrost_greaves) ────────────
  static readonly FREEZE_RETALIATION_DURATION_S = 1.5;
  static readonly FREEZE_RETALIATION_COOLDOWN_S = 5;
  /** Contre un boss (isBoss) : SLOW au lieu de FREEZE — pas de stun-lock de boss. */
  static readonly FREEZE_RETALIATION_BOSS_SLOW_PCT = 30;

  static hasFreezeRetaliation(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'FREEZE_RETALIATION_1_5S');
  }

  // ── 7. TRUE_DODGE_25_PCT (hidden_voidwalker_boots) ────────────────────
  /** Jet indépendant de DODGE_PCT (StatsSystem) — ne s'additionne PAS à lui,
   *  cf. spec : "c'est un jet séparé". */
  static rollTrueDodge(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'TRUE_DODGE_25_PCT') && Math.random() < 0.25;
  }

  // ── 8. SAME_TARGET_STACK_10_PCT (hidden_serpentgrip_gauntlets) ────────
  static readonly SAME_TARGET_STACK_MAX = 10;
  static readonly SAME_TARGET_STACK_PCT_PER_HIT = 10;
  static readonly SAME_TARGET_STACK_RESET_MS = 3000;

  /**
   * Multiplicateur de dégâts contre la cible frappée (1.0 à 2.0, +10%/coup
   * consécutif jusqu'à 10 stacks). Mute `state` en place (même convention que
   * incrementKillStackIfEquipped sur player.passiveStacks) : reset si la cible
   * change ou si plus de 3s se sont écoulées depuis le dernier coup sur elle.
   */
  static getSameTargetStackMultiplier(
    equipment: Equipment,
    state: SameTargetStackState,
    targetId: string,
    now: number,
  ): number {
    if (!PassiveSystem.hasPassive(equipment, 'SAME_TARGET_STACK_10_PCT')) return 1.0;
    if (state.targetId !== targetId || now - state.lastHitAt > PassiveSystem.SAME_TARGET_STACK_RESET_MS) {
      state.targetId = targetId;
      state.stacks = 0;
    }
    const mult = 1 + Math.min(state.stacks, PassiveSystem.SAME_TARGET_STACK_MAX)
      * PassiveSystem.SAME_TARGET_STACK_PCT_PER_HIT / 100;
    state.stacks = Math.min(state.stacks + 1, PassiveSystem.SAME_TARGET_STACK_MAX);
    state.lastHitAt = now;
    return mult;
  }

  // ── 9. MOVE_25_DASH_ASPD_50_PCT (hidden_skyward_mantle) ───────────────
  static readonly DASH_ASPD_BUFF_PCT = 50;
  static readonly DASH_ASPD_BUFF_DURATION_MS = 2000;

  static hasDashAspdBuff(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'MOVE_25_DASH_ASPD_50_PCT');
  }

  // ── 10. BURNING_AURA_5_PCT_ATK (hidden_emberheart_carapace) ───────────
  static readonly BURNING_AURA_RADIUS_PX = 120;
  static readonly BURNING_AURA_PCT_PER_SEC = 5;
  static readonly BURNING_AURA_TICK_INTERVAL_MS = 500;

  static hasBurningAura(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'BURNING_AURA_5_PCT_ATK');
  }

  // ── 11. OVERHEAL_SHIELD_50_PCT (hidden_tideheart_ring) ────────────────
  static readonly OVERHEAL_SHIELD_CAP_PCT = 50;

  static hasOverhealShield(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'OVERHEAL_SHIELD_50_PCT');
  }

  /**
   * Point d'application UNIQUE pour tout soin reçu par le joueur (à utiliser à la
   * place d'un `Math.min(maxHp, hp + amount)` manuel partout où un soin est
   * appliqué — CombatSystem.outOfCombatRegen/playerSkill, GameScene kill-heal/
   * hpOnKill/regen permanent). Le surplus au-delà de maxHp est converti en
   * bouclier persistant (OVERHEAL_SHIELD_50_PCT) au lieu d'être perdu, cappé à
   * 50% des HP max, stocké dans player.passiveStacks['OVERHEAL_SHIELD_50_PCT']
   * — réutilisation assumée de ce sac générique (déjà utilisé pour KILL_STACK_DAMAGE)
   * plutôt que d'ajouter un champ dédié à PlayerState (cf. règle d'archi : pas de
   * modification de src/types/index.ts sans instruction explicite). Consommé
   * dans GameScene.mitigatePlayerDamage, juste après LOW_HP_SHIELD_30_PCT.
   */
  static applyHeal(player: PlayerState, amount: number): void {
    if (amount <= 0) return;
    const before = player.stats.hp;
    const uncappedTarget = before + amount;
    player.stats.hp = Math.min(player.stats.maxHp, uncappedTarget);
    const overflow = uncappedTarget - player.stats.hp;
    if (overflow > 0 && PassiveSystem.hasOverhealShield(player.equipment)) {
      const cap = player.stats.maxHp * PassiveSystem.OVERHEAL_SHIELD_CAP_PCT / 100;
      const current = player.passiveStacks['OVERHEAL_SHIELD_50_PCT'] ?? 0;
      player.passiveStacks['OVERHEAL_SHIELD_50_PCT'] = Math.min(cap, current + overflow);
    }
  }

  // ── 12. CRIT_CD_RESET_1S (hidden_stormchain_ring) ─────────────────────
  static readonly CRIT_CD_RESET_S = 1;
  /** Anti-spam build attack-speed élevée : max 4 déclenchements par seconde glissante. */
  static readonly CRIT_CD_RESET_MAX_PER_SEC = 4;

  /**
   * Tente de consommer un déclenchement de CRIT_CD_RESET_1S (fenêtre glissante 1s,
   * 4 max). Mute `state` en place. Retourne true si le déclenchement est accepté
   * (au caller de réduire effectivement les cooldowns de compétences actives).
   */
  static tryTriggerCritCdReset(equipment: Equipment, state: CritCdResetState, now: number): boolean {
    if (!PassiveSystem.hasPassive(equipment, 'CRIT_CD_RESET_1S')) return false;
    if (now - state.windowStart > 1000) {
      state.windowStart = now;
      state.count = 0;
    }
    if (state.count >= PassiveSystem.CRIT_CD_RESET_MAX_PER_SEC) return false;
    state.count++;
    return true;
  }

  // ── 13. FROZEN_SANCTUARY_30_PCT (hidden_frozen_sanctuary_ring) ────────
  static readonly FROZEN_SANCTUARY_THRESHOLD_PCT = 25;
  static readonly FROZEN_SANCTUARY_DURATION_MS = 3000;
  static readonly FROZEN_SANCTUARY_HEAL_PCT_PER_SEC = 10; // × 3s = 30% total

  static hasFrozenSanctuary(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'FROZEN_SANCTUARY_30_PCT');
  }

  /**
   * true si la stase doit se déclencher : équipé, pas déjà utilisée ce combat,
   * joueur vivant, et sous le seuil de 25% HP max. Ne mute rien — au caller
   * (GameScene.maybeTriggerFrozenSanctuary) de poser le flag "déjà utilisée" et
   * gérer timers/invulnérabilité (hooks Phaser, hors du périmètre pur de ce système).
   */
  static shouldTriggerFrozenSanctuary(
    equipment: Equipment,
    alreadyUsedThisCombat: boolean,
    currentHp: number,
    maxHp: number,
  ): boolean {
    if (alreadyUsedThisCombat) return false;
    if (!PassiveSystem.hasPassive(equipment, 'FROZEN_SANCTUARY_30_PCT')) return false;
    if (maxHp <= 0 || currentHp <= 0) return false;
    return currentHp / maxHp < PassiveSystem.FROZEN_SANCTUARY_THRESHOLD_PCT / 100;
  }

  // ── 14. DAMAGE_DEFERRAL_50_PCT (hidden_runebound_amulet) ──────────────
  static readonly DAMAGE_DEFERRAL_PCT = 50;
  static readonly DAMAGE_DEFERRAL_TICKS = 5;
  static readonly DAMAGE_DEFERRAL_INTERVAL_MS = 1000;

  static hasDamageDeferral(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'DAMAGE_DEFERRAL_50_PCT');
  }

  // ── 15. AUTO_BOLT_150_PCT_MATK (hidden_tempest_amulet) ────────────────
  static readonly AUTO_BOLT_INTERVAL_MS = 5000;
  static readonly AUTO_BOLT_RANGE_PX = 300;
  static readonly AUTO_BOLT_MATK_PCT = 150;

  static hasAutoBolt(equipment: Equipment): boolean {
    return PassiveSystem.hasPassive(equipment, 'AUTO_BOLT_150_PCT_MATK');
  }
}
