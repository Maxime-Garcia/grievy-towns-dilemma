// ============================================================
// PASSIVE EFFECTS — libellés FR affichés dans l'Inventaire et l'Arsenal
// pour le champ `passiveEffect` des items (src/data/items.ts).
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
  NO_ATTACK_COOLDOWN:            'Les attaques basiques ne consomment aucun temps de recharge.',
  ZERO_MANA_COST:                'Toutes les compétences actives coûtent 0 mana.',
  FIRST_STRIKE_500_PCT:          'Le premier coup de chaque combat inflige 500% des dégâts. Une seule chance.',
  KILL_STACK_DAMAGE:             'Chaque ennemi tué ajoute +2% aux dégâts permanents (jusqu\'à +200%). Ne se réinitialise pas.',
  DMG_REDUCTION_40_DEATH_RESIST: 'Réduit tous les dégâts reçus de 40%. Les coups fatals ont 30% de chance de vous laisser à 1 HP.',
  MAGIC_REFLECT_25_PCT:          'Renvoie 25% des dégâts magiques reçus à l\'attaquant.',
  PERMANENT_REGEN_1_PCT_PER_SEC: 'HP et Mana se régénèrent à 1% par seconde en permanence, même en combat.',
  COMBAT_START_ZERO_CD:          'Toutes les compétences actives sont disponibles sans délai de recharge au début de chaque combat.',
};
