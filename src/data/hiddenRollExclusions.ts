import { SubstatKey } from '../types';

// ============================================================
// HIDDEN_ROLL_EXCLUSIONS — docs/design/LOOT_STAT_ROLLS.md §2.3
// ============================================================
//
// Table des SubstatKey interdites d'authoring sur chaque item HIDDEN, pour ne
// pas amplifier directement le vecteur de son passif game-breaking (ex: un
// HIDDEN qui annule déjà le cooldown d'attaque ne doit pas EN PLUS rouler de
// l'ASPD_PCT — ce serait cumuler deux fois le même axe de puissance).
//
// Vit ici (plutôt que dans StatRollSystem.ts) pour rester un fichier de DATA
// pur éditable par le content-agent sans toucher au moteur — cohérent avec
// la séparation src/data (données) / src/systems (logique) du projet.
//
// Consommée par StatRollSystem.finalizeCatalogue() en validation dev
// (console.warn si une ligne authorée viole une exclusion). N'empêche RIEN
// à l'exécution — c'est un garde-fou d'authoring, pas un filtre runtime.
export const HIDDEN_ROLL_EXCLUSIONS: Record<string, SubstatKey[]> = {
  hidden_temporal_blade:   ['ASPD_PCT'],                        // NO_ATTACK_COOLDOWN
  hidden_world_eater_staff: ['MANA_FLAT', 'MANA_ON_KILL_FLAT'], // ZERO_MANA_COST
  hidden_soul_bow:         ['ATK_PCT', 'MATK_PCT'],             // KILL_STACK_DAMAGE
  hidden_first_blade:      ['BOSS_DMG_PCT'],                    // FIRST_STRIKE_500_PCT
  hidden_void_reaper:      ['HP_ON_KILL_FLAT', 'LIFESTEAL_PCT'],// KILL_HEAL_15_PCT
  hidden_undying_plate:    ['DODGE_PCT'],                       // DMG_REDUCTION_40_DEATH_RESIST
  hidden_eternity_ring:    ['HP_ON_KILL_FLAT', 'MANA_ON_KILL_FLAT'], // PERMANENT_REGEN
  hidden_fate_amulet:      ['CDR_PCT'],                         // COMBAT_START_ZERO_CD
  // hidden_mirror_helm (MAGIC_REFLECT_25_PCT) : pas d'exclusion nécessaire.
};
