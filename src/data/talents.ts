import { TalentNode, TalentBranch } from '../types';

// 68 nœuds.
// Branches de base : VIGOR / INSTINCT / ARCANE — 8 nœuds, capstone tier 4 (cost 2).
// Branches élémentaires : IGNIS / ZEPHYR / ABYSSAL / TENEBRES — 9 nœuds sur 5 tiers,
//   coûts : t1-2 = 1pt, t3 = 2pts, t4-5 = 3pts. Capstone tier 5 (requiert les deux tier 4).
// IDs préfixés : vig_ / ins_ / arc_ / ignis_ / zephyr_ / abyssal_ / ten_
// icons : talent_<id>
// Gates d'accès gérés dans TalentSystem (pas dans les données) :
//   - IGNIS exige au moins un nœud ARCANE de tier ≥ 3 débloqué
//   - TENEBRES exige player.isNewGamePlus === true (nœuds ngPlusOnly)

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

  // ── BRANCHE IGNIS (Voie de la Flamme) — #ff6600 — Ignis Reach ───────────────
  // Guerrier-mage du volcan : magie explosive, brûlures persistantes.
  // Accès : au moins un nœud ARCANE tier ≥ 3 débloqué (vérifié dans TalentSystem).

  {
    id: 'ignis_ember_touch',
    name: 'Braise au Poing',
    description: 'Les coups de base ont 15% de chance d\'infliger BURN.',
    branch: TalentBranch.IGNIS,
    tier: 1,
    cost: 1,
    icon: 'talent_ignis_ember_touch',
    requires: [],
    effects: { BURN_CHANCE_PCT: 15 },
    lore: 'Ce que la flamme prend, elle ne le rend pas. À Ignis Reach, on forgeait sans enclume : la roche elle-même cédait.',
  },

  {
    id: 'ignis_flame_body',
    name: 'Corps de Flamme',
    description: '+8% ATK.',
    branch: TalentBranch.IGNIS,
    tier: 1,
    cost: 1,
    icon: 'talent_ignis_flame_body',
    requires: [],
    effects: { ATK_PCT: 8 },
    lore: 'Ce que la flamme prend, elle ne le rend pas.',
  },

  {
    id: 'ignis_volcanic_rage',
    name: 'Rage Volcanique',
    description: '+10% de chance de BURN, et +5% ATK par ennemi en feu à l\'écran.',
    branch: TalentBranch.IGNIS,
    tier: 2,
    cost: 1,
    icon: 'talent_ignis_volcanic_rage',
    requires: ['ignis_ember_touch'],
    effects: { BURN_CHANCE_PCT: 10, ATK_PER_BURNING_PCT: 5 },
    lore: 'Ce que la flamme prend, elle ne le rend pas.',
  },

  {
    id: 'ignis_heat_shield',
    name: 'Bouclier de Chaleur',
    description: 'Sous 50% HP : +12% DEF.',
    branch: TalentBranch.IGNIS,
    tier: 2,
    cost: 1,
    icon: 'talent_ignis_heat_shield',
    requires: ['ignis_flame_body'],
    effects: { LOW_HP_DEF_PCT: 12 },
    lore: 'Ce que la flamme prend, elle ne le rend pas.',
  },

  {
    id: 'ignis_pyroclast',
    name: 'Pyroclaste',
    description: 'Sorts de feu : +35% de dégâts élémentaires.',
    branch: TalentBranch.IGNIS,
    tier: 3,
    cost: 2,
    icon: 'talent_ignis_pyroclast',
    requires: ['ignis_volcanic_rage'],
    // ELEM_BONUS_PCT restreint aux sorts de feu — vérification d'élément côté combat.
    effects: { ELEM_BONUS_PCT: 35 },
    lore: 'Ce que la flamme prend, elle ne le rend pas.',
  },

  {
    id: 'ignis_magma_armor',
    name: 'Armure de Magma',
    description: 'Absorbe entièrement 1 coup par combat (1 charge, restaurée à chaque zone).',
    branch: TalentBranch.IGNIS,
    tier: 3,
    cost: 2,
    icon: 'talent_ignis_magma_armor',
    requires: ['ignis_heat_shield'],
    effects: { MAGMA_GUARD: 1 },
    lore: 'Ce que la flamme prend, elle ne le rend pas.',
  },

  {
    id: 'ignis_inferno_finisher',
    name: 'Fournaise',
    description: 'Les finishers infligent un BURN garanti pendant 3s.',
    branch: TalentBranch.IGNIS,
    tier: 4,
    cost: 3,
    icon: 'talent_ignis_inferno_finisher',
    requires: ['ignis_pyroclast'],
    effects: { BURN_ON_FINISHER: 1 },
    lore: 'Ce que la flamme prend, elle ne le rend pas.',
  },

  {
    id: 'ignis_eruption',
    name: 'Éruption',
    description: '+20% de dégâts tant que 3 ennemis ou plus brûlent simultanément.',
    branch: TalentBranch.IGNIS,
    tier: 4,
    cost: 3,
    icon: 'talent_ignis_eruption',
    requires: ['ignis_magma_armor'],
    effects: { BURNING_PACK_DMG_PCT: 20 },
    lore: 'Ce que la flamme prend, elle ne le rend pas.',
  },

  {
    id: 'ignis_dragon_soul',
    name: 'Âme du Dragon',
    description: '+30% ATK, +15% dégâts élémentaires, +20% dégâts de BURN.',
    branch: TalentBranch.IGNIS,
    tier: 5,
    cost: 3,
    icon: 'talent_ignis_dragon_soul',
    requires: ['ignis_inferno_finisher', 'ignis_eruption'],
    effects: { ATK_PCT: 30, ELEM_BONUS_PCT: 15, BURN_DMG_PCT: 20 },
    lore: 'L\'âme du dragon vit en moi. Ce que la flamme prend, elle ne le rend pas — et je ne demande rien en retour.',
  },

  // ── BRANCHE ZEPHYR (Voie du Vent) — #44ddaa — Zephyr Peaks ──────────────────
  // Acrobate des airs : vitesse, esquive, flèches enchantées.

  {
    id: 'zephyr_tailwind',
    name: 'Vent Arrière',
    description: '+8% vitesse de déplacement, +5% vitesse d\'attaque.',
    branch: TalentBranch.ZEPHYR,
    tier: 1,
    cost: 1,
    icon: 'talent_zephyr_tailwind',
    requires: [],
    effects: { MOVE_SPEED_PCT: 8, ASPD_PCT: 5 },
    lore: 'Ce que le vent porte ne pèse rien. Aux Zephyr Peaks, on apprenait à tomber avant d\'apprendre à marcher.',
  },

  {
    id: 'zephyr_featherfall',
    name: 'Chute de Plume',
    description: 'Cooldown du dash −15%.',
    branch: TalentBranch.ZEPHYR,
    tier: 1,
    cost: 1,
    icon: 'talent_zephyr_featherfall',
    requires: [],
    effects: { DASH_CD_PCT: 15 },
    lore: 'Ce que le vent porte ne pèse rien.',
  },

  {
    id: 'zephyr_storm_step',
    name: 'Pas d\'Orage',
    description: 'Le dash préserve la chaîne de combo (timer gelé pendant le dash).',
    branch: TalentBranch.ZEPHYR,
    tier: 2,
    cost: 1,
    icon: 'talent_zephyr_storm_step',
    requires: ['zephyr_featherfall'],
    effects: { DASH_PRESERVES_COMBO: 1 },
    lore: 'Ce que le vent porte ne pèse rien.',
  },

  {
    id: 'zephyr_eagle_eye',
    name: 'Œil d\'Aigle',
    description: '+10% chance de critique sur les cibles à plus de 200px.',
    branch: TalentBranch.ZEPHYR,
    tier: 2,
    cost: 1,
    icon: 'talent_zephyr_eagle_eye',
    requires: ['zephyr_tailwind'],
    effects: { RANGED_CRIT_PCT: 10 },
    lore: 'Ce que le vent porte ne pèse rien.',
  },

  {
    id: 'zephyr_double_dash',
    name: 'Double Foulée',
    description: 'Autorise un second dash immédiat après le premier (cooldown 8s).',
    branch: TalentBranch.ZEPHYR,
    tier: 3,
    cost: 2,
    icon: 'talent_zephyr_double_dash',
    requires: ['zephyr_storm_step'],
    effects: { DOUBLE_DASH: 1 },
    lore: 'Ce que le vent porte ne pèse rien.',
  },

  {
    id: 'zephyr_wind_arrows',
    name: 'Flèches de Vent',
    description: '+25% portée des projectiles, +10% dégâts des projectiles.',
    branch: TalentBranch.ZEPHYR,
    tier: 3,
    cost: 2,
    icon: 'talent_zephyr_wind_arrows',
    requires: ['zephyr_eagle_eye'],
    effects: { PROJECTILE_RANGE_PCT: 25, PROJECTILE_DMG_PCT: 10 },
    lore: 'Ce que le vent porte ne pèse rien.',
  },

  {
    id: 'zephyr_cyclone_finisher',
    name: 'Cyclone',
    description: 'Les finishers créent une zone de vent qui repousse les ennemis proches.',
    branch: TalentBranch.ZEPHYR,
    tier: 4,
    cost: 3,
    icon: 'talent_zephyr_cyclone_finisher',
    requires: ['zephyr_wind_arrows'],
    effects: { CYCLONE_FINISHER: 1 },
    lore: 'Ce que le vent porte ne pèse rien.',
  },

  {
    id: 'zephyr_aerial_mastery',
    name: 'Maîtrise Aérienne',
    description: '+15% dégâts infligés pendant un dash.',
    branch: TalentBranch.ZEPHYR,
    tier: 4,
    cost: 3,
    icon: 'talent_zephyr_aerial_mastery',
    requires: ['zephyr_double_dash'],
    effects: { DASH_DMG_PCT: 15 },
    lore: 'Ce que le vent porte ne pèse rien.',
  },

  {
    id: 'zephyr_eye_of_storm',
    name: 'L\'Œil de la Tempête',
    description: '+20% vitesse de déplacement, +20% vitesse d\'attaque, esquive automatique d\'une attaque toutes les 5s.',
    branch: TalentBranch.ZEPHYR,
    tier: 5,
    cost: 3,
    icon: 'talent_zephyr_eye_of_storm',
    requires: ['zephyr_cyclone_finisher', 'zephyr_aerial_mastery'],
    effects: { MOVE_SPEED_PCT: 20, ASPD_PCT: 20, AUTO_DODGE: 1 },
    lore: 'Au centre de la tempête, il n\'y a pas de silence. Il y a quelqu\'un qui a cessé d\'avoir peur du bruit.',
  },

  // ── BRANCHE ABYSSAL (Voie des Profondeurs) — #2244cc — Abyssmar + Glaciem ───
  // Magie aquatique et glaciale : contrôle, vol de vie, survivabilité.

  {
    id: 'abyssal_tidal_flow',
    name: 'Flux des Marées',
    description: '+8% HP max, +3% de vol de vie (attaques et sorts).',
    branch: TalentBranch.ABYSSAL,
    tier: 1,
    cost: 1,
    icon: 'talent_abyssal_tidal_flow',
    requires: [],
    effects: { MAX_HP_PCT: 8, LIFESTEAL_PCT: 3 },
    lore: 'Ce que la profondeur garde, elle le garde en silence. Les pêcheurs d\'Abyssmar ne juraient jamais par les dieux — seulement par la marée.',
  },

  {
    id: 'abyssal_frostbite',
    name: 'Morsure du Givre',
    description: 'Les attaques appliquent SLOW 20% pendant 2s.',
    branch: TalentBranch.ABYSSAL,
    tier: 1,
    cost: 1,
    icon: 'talent_abyssal_frostbite',
    requires: [],
    effects: { SLOW_ON_HIT: 1 },
    lore: 'Ce que la profondeur garde, elle le garde en silence.',
  },

  {
    id: 'abyssal_deep_current',
    name: 'Courant Profond',
    description: '+10% mana max, et régénère 5% du mana max par seconde hors combat.',
    branch: TalentBranch.ABYSSAL,
    tier: 2,
    cost: 1,
    icon: 'talent_abyssal_deep_current',
    requires: ['abyssal_tidal_flow'],
    effects: { MANA_MAX_PCT: 10, MANA_REGEN_PCT: 5 },
    lore: 'Ce que la profondeur garde, elle le garde en silence.',
  },

  {
    id: 'abyssal_ice_veil',
    name: 'Voile de Glace',
    description: '+15% de chance de FREEZE sur les sorts.',
    branch: TalentBranch.ABYSSAL,
    tier: 2,
    cost: 1,
    icon: 'talent_abyssal_ice_veil',
    requires: ['abyssal_frostbite'],
    effects: { FREEZE_CHANCE_PCT: 15 },
    lore: 'Ce que la profondeur garde, elle le garde en silence.',
  },

  {
    id: 'abyssal_leviathan_call',
    name: 'Appel du Léviathan',
    description: 'Sorts de glace et d\'eau : +30% de dégâts élémentaires.',
    branch: TalentBranch.ABYSSAL,
    tier: 3,
    cost: 2,
    icon: 'talent_abyssal_leviathan_call',
    requires: ['abyssal_deep_current'],
    // ELEM_BONUS_PCT restreint aux sorts WATER/ICE — vérification d'élément côté combat.
    effects: { ELEM_BONUS_PCT: 30 },
    lore: 'Ce que la profondeur garde, elle le garde en silence.',
  },

  {
    id: 'abyssal_coral_armor',
    name: 'Armure de Corail',
    description: '+20% DEF dans les zones aquatiques (Abyssmar, Glaciem).',
    branch: TalentBranch.ABYSSAL,
    tier: 3,
    cost: 2,
    icon: 'talent_abyssal_coral_armor',
    requires: ['abyssal_ice_veil'],
    effects: { AQUATIC_DEF_PCT: 20 },
    lore: 'Ce que la profondeur garde, elle le garde en silence.',
  },

  {
    id: 'abyssal_glacial_burst',
    name: 'Éclat Glaciaire',
    description: 'Les finishers infligent un FREEZE garanti pendant 2s.',
    branch: TalentBranch.ABYSSAL,
    tier: 4,
    cost: 3,
    icon: 'talent_abyssal_glacial_burst',
    requires: ['abyssal_coral_armor'],
    effects: { FREEZE_ON_FINISHER: 1 },
    lore: 'Ce que la profondeur garde, elle le garde en silence.',
  },

  {
    id: 'abyssal_void_drain',
    name: 'Drain des Abysses',
    description: '+8% de vol de vie, et chaque kill restaure 5% du mana max.',
    branch: TalentBranch.ABYSSAL,
    tier: 4,
    cost: 3,
    icon: 'talent_abyssal_void_drain',
    requires: ['abyssal_leviathan_call'],
    effects: { LIFESTEAL_PCT: 8, MANA_ON_KILL_PCT: 5 },
    lore: 'Ce que la profondeur garde, elle le garde en silence.',
  },

  {
    id: 'abyssal_soul_of_the_deep',
    name: 'Âme des Profondeurs',
    description: '+25% HP max, +15% de vol de vie, immunité à BURN et BLEED.',
    branch: TalentBranch.ABYSSAL,
    tier: 5,
    cost: 3,
    icon: 'talent_abyssal_soul_of_the_deep',
    requires: ['abyssal_glacial_burst', 'abyssal_void_drain'],
    effects: { MAX_HP_PCT: 25, LIFESTEAL_PCT: 15, BURN_BLEED_IMMUNITY: 1 },
    lore: 'Tout ce qui coule finit par toucher le fond. Ce qui remonte n\'est plus tout à fait la même chose.',
  },

  // ── BRANCHE TENEBRES (Voie de la Magie Noire) — #7700aa — NG+ UNIQUEMENT ────
  // Corruption de l'âme : dégâts sombres, puissance payée en vie.
  // Nœuds visibles dans l'UI mais grisés (overlay) tant que isNewGamePlus === false,
  // avec le texte : "Je ne suis pas encore capable de maîtriser cette magie..."

  {
    id: 'ten_shadow_veil',
    name: 'Voile d\'Ombre',
    description: '+8% dégâts sombres.',
    branch: TalentBranch.TENEBRES,
    tier: 1,
    cost: 1,
    icon: 'talent_ten_shadow_veil',
    requires: [],
    ngPlusOnly: true,
    effects: { DARK_DMG_MULT: 8 },
    lore: 'Ce chemin, quelqu\'un l\'a déjà pris. Ses notes commencent proprement. Elles finissent autrement.',
  },

  {
    id: 'ten_blood_pact',
    name: 'Pacte de Sang',
    description: '−10% HP max, +20% ATK.',
    branch: TalentBranch.TENEBRES,
    tier: 1,
    cost: 1,
    icon: 'talent_ten_blood_pact',
    requires: [],
    ngPlusOnly: true,
    effects: { MAX_HP_PCT: -10, ATK_PCT: 20 },
    lore: 'Ce chemin, quelqu\'un l\'a déjà pris.',
  },

  {
    id: 'ten_void_channeling',
    name: 'Canalisation du Vide',
    description: 'Sacrifie 15% des HP au lancement d\'un sort : ce sort inflige +100% de dégâts.',
    branch: TalentBranch.TENEBRES,
    tier: 2,
    cost: 1,
    icon: 'talent_ten_void_channeling',
    requires: ['ten_shadow_veil'],
    ngPlusOnly: true,
    effects: { VOID_CHANNEL: 1 },
    lore: 'Ce chemin, quelqu\'un l\'a déjà pris.',
  },

  {
    id: 'ten_soul_harvest',
    name: 'Moisson d\'Âmes',
    description: '+2 stacks de Soul Echo par zone nettoyée.',
    branch: TalentBranch.TENEBRES,
    tier: 2,
    cost: 1,
    icon: 'talent_ten_soul_harvest',
    requires: ['ten_blood_pact'],
    ngPlusOnly: true,
    effects: { SOUL_STACK_BONUS: 2 },
    lore: 'Ce chemin, quelqu\'un l\'a déjà pris.',
  },

  {
    id: 'ten_forbidden_flame',
    name: 'Flamme Interdite',
    description: 'Les brûlures que vous infligez deviennent des dégâts sombres.',
    branch: TalentBranch.TENEBRES,
    tier: 3,
    cost: 2,
    icon: 'talent_ten_forbidden_flame',
    requires: ['ten_void_channeling'],
    ngPlusOnly: true,
    effects: { DARK_BURN: 1 },
    lore: 'Ce chemin, quelqu\'un l\'a déjà pris.',
  },

  {
    id: 'ten_shadow_clone',
    name: 'Clone d\'Ombre',
    description: '25% de chance qu\'une attaque soit doublée d\'un coup fantôme, sans cooldown.',
    branch: TalentBranch.TENEBRES,
    tier: 3,
    cost: 2,
    icon: 'talent_ten_shadow_clone',
    requires: ['ten_soul_harvest'],
    ngPlusOnly: true,
    effects: { PHANTOM_STRIKE_PCT: 25 },
    lore: 'Ce chemin, quelqu\'un l\'a déjà pris.',
  },

  {
    id: 'ten_malchar_blessing',
    name: 'Bénédiction de Malachar',
    description: 'Les finishers consument 20% des HP max pour tripler leurs dégâts.',
    branch: TalentBranch.TENEBRES,
    tier: 4,
    cost: 3,
    icon: 'talent_ten_malchar_blessing',
    requires: ['ten_forbidden_flame'],
    ngPlusOnly: true,
    effects: { SACRIFICE_FINISHER: 1 },
    lore: 'Il ne bénissait personne. Il posait juste la question que personne d\'autre n\'osait poser.',
  },

  {
    id: 'ten_abyss_pact',
    name: 'Pacte de l\'Abîme',
    description: '+12% de vol de vie, +20% dégâts sombres.',
    branch: TalentBranch.TENEBRES,
    tier: 4,
    cost: 3,
    icon: 'talent_ten_abyss_pact',
    requires: ['ten_shadow_clone'],
    ngPlusOnly: true,
    effects: { LIFESTEAL_PCT: 12, DARK_DMG_MULT: 20 },
    lore: 'Ce chemin, quelqu\'un l\'a déjà pris.',
  },

  {
    id: 'ten_world_ender',
    name: 'Celui Qui Efface',
    description: '+40% dégâts sombres, +30% ATK.',
    branch: TalentBranch.TENEBRES,
    tier: 5,
    cost: 3,
    icon: 'talent_ten_world_ender',
    requires: ['ten_malchar_blessing', 'ten_abyss_pact'],
    ngPlusOnly: true,
    effects: { DARK_DMG_MULT: 40, ATK_PCT: 30 },
    lore: 'Le monde tremble sous mes pas. Je suis devenu ce que je combattais.',
  },
];

export const TALENT_MAP: Record<string, TalentNode> = Object.fromEntries(
  TALENTS.map(t => [t.id, t]),
);
