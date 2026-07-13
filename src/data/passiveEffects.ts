import { getLang } from '../i18n';

// ============================================================
// PASSIVE EFFECTS — libellés affichés dans l'Inventaire et l'Arsenal pour le
// champ `passiveEffect` des items (src/data/items.ts). Utiliser
// getPassiveEffectLabel(id) plutôt que d'indexer les dictionnaires directement,
// pour respecter la langue active (getLang()).
//
// Chaque id correspond à une implémentation réelle dans PassiveSystem.ts
// (aucun de ces textes n'est de la pure décoration — cf. CombatSystem/
// SkillSystem/GameScene pour les points de branchement).
// ============================================================

export const PASSIVE_EFFECT_LABELS: Record<string, string> = {
  // Anneaux/amulettes (texte reformulé depuis l'ancien passiveEffect anglais)
  WATER_DMG_15_SPEED_10_PCT:    'Attaques et compétences Eau : +15% de dégâts. Vitesse de déplacement +10%.',
  FIRE_SKILL_CD_15_PCT:         'Compétences Feu : temps de recharge -15%.',
  DASH_DISTANCE_20_PCT:         'Distance de dash +20%.',
  HEAL_SKILL_20_PCT:            'Efficacité des compétences de soin +20%.',
  LIGHTNING_DMG_STUNNED_20_PCT: 'Compétences Foudre : +20% de dégâts contre les cibles étourdies.',
  LOW_HP_SHIELD_30_PCT:         'Sous 20% HP : bouclier égal à 30% des HP max (recharge 120s).',
  SKILL_DMG_15_CD_10_PCT:       'Dégâts des compétences +15%, mais temps de recharge des compétences +10%.',
  ICE_SLOW_15_PCT:              'Compétences Glace : ralentissement infligé +15%.',

  // Armes/armures HIDDEN (le texte reprend celui déjà écrit dans description)
  KILL_HEAL_15_PCT:              'Chaque coup fatal rend 15% du HP maximum.',
  NO_ATTACK_COOLDOWN:            'Les attaques basiques n\'ont (presque) plus de temps de recharge.',
  ZERO_MANA_COST:                'Toutes les compétences actives coûtent 0 mana.',
  FIRST_STRIKE_500_PCT:          'Le premier coup porté à un boss inflige 500% des dégâts (sans critique). Une fois par combat.',
  KILL_STACK_DAMAGE:             'Chaque ennemi tué ajoute +2% aux dégâts permanents (jusqu\'à +200%). Ne se réinitialise pas.',
  DMG_REDUCTION_40_DEATH_RESIST: 'Réduit tous les dégâts reçus de 40%. Les coups fatals ont 30% de chance de vous laisser à 1 HP.',
  MAGIC_REFLECT_25_PCT:          'Renvoie 25% des dégâts magiques reçus à l\'attaquant.',
  PERMANENT_REGEN_1_PCT_PER_SEC: 'HP et Mana se régénèrent à 1% par seconde en permanence, même en combat.',
  COMBAT_START_ZERO_CD:          'Toutes les compétences actives sont disponibles sans délai de recharge au début de chaque combat.',

  // HIDDEN — VAGUE 2
  PERMA_BURN_STACK_3_PCT:        'Chaque coup pose une Marque de Magma (max 10) : 3% de l\'ATK par marque et par seconde. Ne s\'éteint pas.',
  DEF_IGNORE_100_PCT:            'Ignore 100% de la défense de la cible.',
  NO_DASH_COOLDOWN:              'Le dash n\'a (presque) plus de temps de recharge.',
  OMNIVAMP_25_PCT:               'Vous soigne de 25% de TOUS les dégâts infligés (attaques, compétences, brûlures).',
  SKILL_ECHO_50_PCT:             'Chaque compétence est rejouée 0,4s plus tard à 50% des dégâts, sans coûter de mana.',
  FREEZE_RETALIATION_1_5S:       'Gèle l\'attaquant 1,5s à chaque coup subi (ralentit les boss au lieu de les geler). Recharge 5s.',
  TRUE_DODGE_25_PCT:             '25% de chance d\'ignorer totalement un coup, indépendamment de l\'esquive normale.',
  SAME_TARGET_STACK_10_PCT:      'Chaque coup consécutif sur la même cible inflige +10% de dégâts (max +100%).',
  MOVE_25_DASH_ASPD_50_PCT:      'Vitesse de déplacement +25%. Chaque dash octroie +50% de vitesse d\'attaque pendant 2s.',
  BURNING_AURA_5_PCT_ATK:        'Une aura brûlante inflige 5% de l\'ATK par seconde aux ennemis proches.',
  OVERHEAL_SHIELD_50_PCT:        'Le surplus de soin au-delà des HP max devient un bouclier (jusqu\'à 50% des HP max).',
  CRIT_CD_RESET_1S:              'Chaque coup critique réduit d\'1s le temps de recharge de vos compétences (4 max/s).',
  FROZEN_SANCTUARY_30_PCT:       'Sous 25% des HP : invulnérabilité totale et soin de 10%/s pendant 3s. Une fois par combat.',
  DAMAGE_DEFERRAL_50_PCT:        'N\'encaisse que 50% des dégâts subis immédiatement ; les 50% restants sont étalés sur 5s.',
  AUTO_BOLT_150_PCT_MATK:        'Toutes les 5s, foudroie automatiquement l\'ennemi le plus proche pour 150% de la MATK.',
};

export const PASSIVE_EFFECT_LABELS_EN: Record<string, string> = {
  WATER_DMG_15_SPEED_10_PCT:    'Water attacks and skills: +15% damage. Movement speed +10%.',
  FIRE_SKILL_CD_15_PCT:         'Fire skills: cooldown -15%.',
  DASH_DISTANCE_20_PCT:         'Dash distance +20%.',
  HEAL_SKILL_20_PCT:            'Healing skills +20% effectiveness.',
  LIGHTNING_DMG_STUNNED_20_PCT: 'Lightning skills: +20% damage against stunned targets.',
  LOW_HP_SHIELD_30_PCT:         'Below 20% HP: shield equal to 30% max HP (120s cooldown).',
  SKILL_DMG_15_CD_10_PCT:       'Skill damage +15%, but skill cooldowns +10%.',
  ICE_SLOW_15_PCT:              'Ice skills: slow amount +15%.',

  KILL_HEAL_15_PCT:              'Every fatal blow restores 15% of max HP.',
  NO_ATTACK_COOLDOWN:            'Basic attacks have (almost) no cooldown.',
  ZERO_MANA_COST:                'All active skills cost 0 mana.',
  FIRST_STRIKE_500_PCT:          'The first hit on a boss deals 500% damage (cannot crit). Once per combat.',
  KILL_STACK_DAMAGE:             'Every kill adds +2% permanent damage (up to +200%). Never resets.',
  DMG_REDUCTION_40_DEATH_RESIST: 'Reduces all damage taken by 40%. Fatal hits have a 30% chance to leave you at 1 HP.',
  MAGIC_REFLECT_25_PCT:          'Reflects 25% of magic damage taken back to the attacker.',
  PERMANENT_REGEN_1_PCT_PER_SEC: 'HP and Mana regenerate 1% per second at all times, even in combat.',
  COMBAT_START_ZERO_CD:          'All active skills start with zero cooldown at the beginning of each combat.',

  // HIDDEN — WAVE 2
  PERMA_BURN_STACK_3_PCT:        'Every hit applies a Magma Mark (max 10): 3% of ATK per mark per second. Never fades.',
  DEF_IGNORE_100_PCT:            'Ignores 100% of the target\'s defense.',
  NO_DASH_COOLDOWN:              'Dash has (almost) no cooldown.',
  OMNIVAMP_25_PCT:               'Heals you for 25% of ALL damage dealt (attacks, skills, burns).',
  SKILL_ECHO_50_PCT:             'Each skill is echoed 0.4s later at 50% damage, at no mana cost.',
  FREEZE_RETALIATION_1_5S:       'Freezes the attacker for 1.5s on every hit taken (slows bosses instead of freezing). 5s cooldown.',
  TRUE_DODGE_25_PCT:             '25% chance to completely ignore a hit, independent of normal dodge.',
  SAME_TARGET_STACK_10_PCT:      'Each consecutive hit on the same target deals +10% damage (up to +100%).',
  MOVE_25_DASH_ASPD_50_PCT:      'Movement speed +25%. Each dash grants +50% attack speed for 2s.',
  BURNING_AURA_5_PCT_ATK:        'A burning aura deals 5% of ATK per second to nearby enemies.',
  OVERHEAL_SHIELD_50_PCT:        'Healing beyond max HP becomes a shield (up to 50% of max HP).',
  CRIT_CD_RESET_1S:              'Every critical hit reduces your skill cooldowns by 1s (max 4/s).',
  FROZEN_SANCTUARY_30_PCT:       'Below 25% HP: full invulnerability and 10%/s healing for 3s. Once per combat.',
  DAMAGE_DEFERRAL_50_PCT:        'Only 50% of damage taken is applied immediately; the other 50% is spread over 5s.',
  AUTO_BOLT_150_PCT_MATK:        'Every 5s, automatically strikes the nearest enemy for 150% of MATK.',
};

/** Libellé du passif dans la langue active (getLang()) — préférer à un indexage direct. */
export function getPassiveEffectLabel(id: string): string | undefined {
  const dict = getLang() === 'en' ? PASSIVE_EFFECT_LABELS_EN : PASSIVE_EFFECT_LABELS;
  return dict[id];
}
