import { TalentNode, TalentBranch } from '../types';

// 24 nœuds — 8 par branche, 1 capstone par branche (tier 4, cost 2)
// IDs préfixés : vig_ / ins_ / arc_
// icons : talent_<id>

export const TALENTS: TalentNode[] = [

  // ── BRANCHE VIGUEUR (STR/END) — corps à corps, survie, armes lourdes ─────────
  // Armes cibles : HAMMER, GREATSWORD, AXE

  {
    id: 'vig_iron_grip',
    name: 'Poigne de Fer',
    description: '+12% dégâts de mêlée (toutes armes sauf STAFF/BOW).',
    branch: TalentBranch.VIGOR,
    tier: 1,
    cost: 1,
    icon: 'talent_vig_iron_grip',
    effects: { MELEE_DMG_PCT: 12 },
    lore: 'Ce que le corps retient. Aldric dirait : tiens-toi droit, frappe une fois, frappe juste.',
  },

  {
    id: 'vig_stone_skin',
    name: 'Peau de Pierre',
    description: '+10% DEF et Magic DEF.',
    branch: TalentBranch.VIGOR,
    tier: 1,
    cost: 1,
    icon: 'talent_vig_stone_skin',
    effects: { DEF_PCT: 10 },
    lore: 'Ce que le corps retient. Aldric dirait : tiens-toi droit, frappe une fois, frappe juste.',
  },

  {
    id: 'vig_woodcutters_blood',
    name: 'Sang du Bûcheron',
    description: 'Chaque kill en mêlée rend 3% des HP max.',
    branch: TalentBranch.VIGOR,
    tier: 2,
    cost: 1,
    icon: 'talent_vig_woodcutters_blood',
    effects: { KILL_HEAL_PCT: 3 },
    lore: 'Ce que le corps retient.',
  },

  {
    id: 'vig_unstoppable',
    name: 'Inarrêtable',
    description: 'Pendant un windup (GS/HAMMER/AXE) : aucun knockback subi, et le coup chargé inflige +10%.',
    branch: TalentBranch.VIGOR,
    tier: 2,
    cost: 1,
    icon: 'talent_vig_unstoppable',
    effects: { WINDUP_ARMOR: 1, HEAVY_FINISHER_BONUS: 10 },
    lore: 'Ce que le corps retient.',
  },

  {
    id: 'vig_shattering_echo',
    name: 'Fracas',
    description: 'Finishers GREATSWORD/HAMMER/AXE : durée de stun +0.5s, zone/portée +30%.',
    branch: TalentBranch.VIGOR,
    tier: 3,
    cost: 1,
    icon: 'talent_vig_shattering_echo',
    effects: { HEAVY_FINISHER_BONUS: 30 },
    lore: 'Ce que le corps retient.',
  },

  {
    id: 'vig_dull_rage',
    name: 'Colère Sourde',
    description: 'Sous 35% HP : +20% ATK, +10% DEF.',
    branch: TalentBranch.VIGOR,
    tier: 3,
    cost: 1,
    icon: 'talent_vig_dull_rage',
    effects: { LOW_HP_ATK_PCT: 20, DEF_PCT: 10 },
    lore: 'Ce que le corps retient.',
  },

  {
    id: 'vig_war_march',
    name: 'Marche de Guerre',
    description: 'GS/HAMMER/AXE : cooldown d\'attaque −10% (les fenêtres de combo se recalculent).',
    branch: TalentBranch.VIGOR,
    tier: 3,
    cost: 1,
    icon: 'talent_vig_war_march',
    effects: { HEAVY_CD_REDUCTION_PCT: 10 },
    lore: 'Ce que le corps retient.',
  },

  {
    id: 'vig_titans_echo',
    name: 'Écho du Titan',
    description: 'Après un finisher : la prochaine attaque dans les 2.5s inflige +50% et démarre la chaîne à 2.',
    branch: TalentBranch.VIGOR,
    tier: 4,
    cost: 2,
    icon: 'talent_vig_titans_echo',
    effects: { POST_FINISHER_BUFF: 1 },
    lore: 'Ce que le corps retient. Aldric dirait : tiens-toi droit, frappe une fois, frappe juste.',
  },

  // ── BRANCHE INSTINCT (AGI/VIT) — vitesse, critiques, esquive ────────────────
  // Armes cibles : DAGGER, DUAL_DAGGER, DUAL_SWORD, BOW

  {
    id: 'ins_honed_reflexes',
    name: 'Réflexes Affûtés',
    description: '+6% chance de critique.',
    branch: TalentBranch.INSTINCT,
    tier: 1,
    cost: 1,
    icon: 'talent_ins_honed_reflexes',
    effects: { CRIT_PCT: 6 },
    lore: 'Ce que le corps devine avant la pensée. Sylvael comprenait : le mouvement est une forme de mémoire.',
  },

  {
    id: 'ins_fleet_footwork',
    name: 'Jeu de Jambes',
    description: '+8% vitesse de déplacement (+5% supplémentaires pendant une chaîne active).',
    branch: TalentBranch.INSTINCT,
    tier: 1,
    cost: 1,
    icon: 'talent_ins_fleet_footwork',
    effects: { MOVE_SPEED_PCT: 8 },
    lore: 'Ce que le corps devine avant la pensée.',
  },

  {
    id: 'ins_perfect_tempo',
    name: 'Tempo Parfait',
    description: 'Fenêtre de grace des combos +25% (toutes armes).',
    branch: TalentBranch.INSTINCT,
    tier: 2,
    cost: 1,
    icon: 'talent_ins_perfect_tempo',
    effects: { COMBO_GRACE_PCT: 25 },
    lore: 'Ce que le corps devine avant la pensée.',
  },

  {
    id: 'ins_ghost_step',
    name: 'Pas Fantôme',
    description: 'Dash : cooldown −0.3s, et le timer de combo est gelé pendant le dash (0.35s).',
    branch: TalentBranch.INSTINCT,
    tier: 2,
    cost: 1,
    icon: 'talent_ins_ghost_step',
    effects: { DASH_PRESERVES_COMBO: 1 },
    lore: 'Ce que le corps devine avant la pensée.',
  },

  {
    id: 'ins_lacerate',
    name: 'Entaille',
    description: 'Finishers DAGGER/DUAL_DAGGER/DUAL_SWORD : saignement 30% de l\'ATK sur 3s.',
    branch: TalentBranch.INSTINCT,
    tier: 3,
    cost: 1,
    icon: 'talent_ins_lacerate',
    effects: { LIGHT_FINISHER_BLEED: 1 },
    lore: 'Ce que le corps devine avant la pensée.',
  },

  {
    id: 'ins_hunters_eye',
    name: 'Œil du Chasseur',
    description: 'BOW : +15% dégâts sur cibles à plus de 250px, vitesse de projectile +20%.',
    branch: TalentBranch.INSTINCT,
    tier: 3,
    cost: 1,
    icon: 'talent_ins_hunters_eye',
    effects: { BOW_RANGE_DMG_PCT: 15 },
    lore: 'Ce que le corps devine avant la pensée.',
  },

  {
    id: 'ins_wild_vitality',
    name: 'Vitalité Sauvage',
    description: '+10% HP max, régénération hors-combat ×1.5.',
    branch: TalentBranch.INSTINCT,
    tier: 3,
    cost: 1,
    icon: 'talent_ins_wild_vitality',
    effects: { MAX_HP_PCT: 10 },
    lore: 'Ce que le corps devine avant la pensée.',
  },

  {
    id: 'ins_deadly_dance',
    name: 'Danse Mortelle',
    description: '+5% dégâts par coup consécutif de la chaîne (max +25%), reset si la chaîne casse.',
    branch: TalentBranch.INSTINCT,
    tier: 4,
    cost: 2,
    icon: 'talent_ins_deadly_dance',
    effects: { COMBO_STACK_DMG: 5 },
    lore: 'Ce que le corps devine avant la pensée. Sylvael comprenait : le mouvement est une forme de mémoire.',
  },

  // ── BRANCHE ARCANE (INT) — magie, Staff, effets élémentaires ────────────────
  // Armes cibles : STAFF, BOW (hybride), + tous les skills actifs

  {
    id: 'arc_focus',
    name: 'Focalisation',
    description: '+12% dégâts magiques (attaques et skills).',
    branch: TalentBranch.ARCANE,
    tier: 1,
    cost: 1,
    icon: 'talent_arc_focus',
    effects: { MAGIC_DMG_PCT: 12 },
    lore: 'Ce que l\'esprit refuse d\'oublier. Malachar a suivi ce chemin jusqu\'au bout. Le héros décide où s\'arrêter.',
  },

  {
    id: 'arc_deep_reservoir',
    name: 'Réservoir Profond',
    description: 'Coûts de mana −10%, mana max +15%.',
    branch: TalentBranch.ARCANE,
    tier: 1,
    cost: 1,
    icon: 'talent_arc_deep_reservoir',
    effects: { MANA_COST_PCT: 10 },
    lore: 'Ce que l\'esprit refuse d\'oublier.',
  },

  {
    id: 'arc_echo_resonance',
    name: 'Résonance d\'Écho',
    description: 'Skills actifs +10% dégâts ; echo_strike +25%.',
    branch: TalentBranch.ARCANE,
    tier: 2,
    cost: 1,
    icon: 'talent_arc_echo_resonance',
    effects: { SKILL_DMG_PCT: 10 },
    lore: 'Ce que l\'esprit refuse d\'oublier.',
  },

  {
    id: 'arc_elemental_wake',
    name: 'Sillage Élémentaire',
    description: 'Le finisher du STAFF laisse une zone élémentaire au point d\'impact final (rayon 70, 2s).',
    branch: TalentBranch.ARCANE,
    tier: 2,
    cost: 1,
    icon: 'talent_arc_elemental_wake',
    effects: { STAFF_FINISHER_ZONE: 1 },
    lore: 'Ce que l\'esprit refuse d\'oublier.',
  },

  {
    id: 'arc_imbued_arrows',
    name: 'Flèches Imprégnées',
    description: 'Si INT ≥ 10 : les flèches du BOW prennent l\'élément de l\'arc et gagnent +10% Magic ATK.',
    branch: TalentBranch.ARCANE,
    tier: 3,
    cost: 1,
    icon: 'talent_arc_imbued_arrows',
    effects: { BOW_ELEMENTAL_ARROWS: 1 },
    lore: 'Ce que l\'esprit refuse d\'oublier.',
  },

  {
    id: 'arc_amplification',
    name: 'Amplification Arcane',
    description: 'Skills projectiles (fireball, frost_lance, thunder_bolt, tidal_wave, chain_lightning) : +25% dégâts.',
    branch: TalentBranch.ARCANE,
    tier: 3,
    cost: 1,
    icon: 'talent_arc_amplification',
    effects: { PROJECTILE_SKILL_PCT: 25 },
    lore: 'Ce que l\'esprit refuse d\'oublier.',
  },

  {
    id: 'arc_steel_ward',
    name: 'Garde d\'Acier',
    description: 'stone_shield / ice_barrier : valeur +25%, durée +1s.',
    branch: TalentBranch.ARCANE,
    tier: 3,
    cost: 1,
    icon: 'talent_arc_steel_ward',
    effects: { SHIELD_SKILL_PCT: 25 },
    lore: 'Ce que l\'esprit refuse d\'oublier.',
  },

  {
    id: 'arc_convergence',
    name: 'Convergence',
    description: 'Tout finisher déclenche une nova élémentaire : rayon 90, 60% Magic ATK, élément de l\'arme.',
    branch: TalentBranch.ARCANE,
    tier: 4,
    cost: 2,
    icon: 'talent_arc_convergence',
    effects: { FINISHER_NOVA: 1 },
    lore: 'Ce que l\'esprit refuse d\'oublier. Malachar a suivi ce chemin jusqu\'au bout. Le héros décide où s\'arrêter.',
  },
];

export const TALENT_MAP: Record<string, TalentNode> = Object.fromEntries(
  TALENTS.map(t => [t.id, t]),
);
