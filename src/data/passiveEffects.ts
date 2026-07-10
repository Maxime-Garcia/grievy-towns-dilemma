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
};

/** Libellé du passif dans la langue active (getLang()) — préférer à un indexage direct. */
export function getPassiveEffectLabel(id: string): string | undefined {
  const dict = getLang() === 'en' ? PASSIVE_EFFECT_LABELS_EN : PASSIVE_EFFECT_LABELS;
  return dict[id];
}
