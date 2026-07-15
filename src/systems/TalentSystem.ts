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

  // ── Génériques (branches élémentaires) ────────────────────────────────────
  atkMult: number;              // base 1.0 — multiplie l'ATK globale (physique + magique)
  attackSpeedMult: number;      // base 1.0 — multiplie la vitesse d'attaque
  elemBonusPct: number;         // % additif de dégâts élémentaires (cumulé avec la substat ELEM_BONUS_PCT de StatsSystem)
  manaMaxMult: number;          // base 1.0 — multiplie le mana max
  manaRegenPct: number;         // % du mana max régénéré / seconde hors combat (timestamp-based, jamais frame-based)
  lifestealPct: number;         // % de vol de vie sur attaques ET sorts (s'ajoute à la substat LIFESTEAL_PCT)

  // ── IGNIS ──────────────────────────────────────────────────────────────────
  burnChancePct: number;        // % de chance d'infliger BURN sur coup de base
  burnDmgPct: number;           // % bonus sur les ticks de BURN
  atkPerBurningPct: number;     // % d'ATK par ennemi en feu à l'écran
  lowHpDefPct: number;          // % de DEF bonus sous 50% HP
  magmaGuard: boolean;          // absorbe 1 coup par combat (1 charge, restaurée par zone)
  burnOnFinisher: boolean;      // finishers : BURN garanti 3s
  burningPackDmgPct: number;    // % de dégâts si 3+ ennemis brûlent simultanément

  // ── ZEPHYR ─────────────────────────────────────────────────────────────────
  dashCdReductionPct: number;   // % de réduction du cooldown de dash
  rangedCritPct: number;        // % de crit bonus sur cibles > 200px
  doubleDash: boolean;          // second dash immédiat autorisé (CD 8s)
  projectileRangePct: number;   // % de portée des projectiles
  projectileDmgPct: number;     // % de dégâts des projectiles
  cycloneFinisher: boolean;     // finisher : zone de vent qui repousse les ennemis
  dashDmgPct: number;           // % de dégâts infligés pendant un dash
  autoDodge: boolean;           // esquive automatique 1 attaque / 5s

  // ── ABYSSAL ────────────────────────────────────────────────────────────────
  slowOnHit: boolean;           // attaques : SLOW 20%, 2s
  freezeChancePct: number;      // % de chance de FREEZE sur sort
  aquaticDefPct: number;        // % de DEF en zone aquatique (Abyssmar, Glaciem)
  freezeOnFinisher: boolean;    // finisher : FREEZE garanti 2s
  manaOnKillPct: number;        // % du mana max restauré par kill
  burnBleedImmunity: boolean;   // immunité aux statuts BURN et BLEED

  // ── TENEBRES (NG+) ─────────────────────────────────────────────────────────
  darkDmgMult: number;          // base 1.0 — multiplie les dégâts sombres
  soulStackBonus: number;       // stacks Soul Echo bonus par zone cleared
  voidChannel: boolean;         // sacrifie 15% HP au cast → sort +100%
  darkBurn: boolean;            // les BURN infligés deviennent des dégâts sombres
  phantomStrikePct: number;     // % de chance de coup fantôme sans cooldown
  sacrificeFinisher: boolean;   // finisher : consume 20% HP max → dégâts ×3

  // ── TERRA ──────────────────────────────────────────────────────────────────
  knockbackResPct: number;      // % de réduction du knockback subi (cap 100)
  staggerBonusPct: number;      // % d'accumulation de jauge de stagger supplémentaire
  stunDmgPct: number;           // % de dégâts bonus contre ennemis sous CC dur
  retaliationDefPct: number;    // % de la DEF finale infligé en dégâts EARTH aux attaquants
  quakeFinisher: boolean;       // finisher : onde de choc au sol (r100, 40% ATK EARTH, stagger x2)
  unshakable: boolean;          // immunité totale au knockback et à l'interruption de stagger
  defToAtkPct: number;          // % de la DEF finale ajouté à l'ATK en bonus plat

  // ── FULGURIS ───────────────────────────────────────────────────────────────
  shockChancePct: number;       // % de chance d'infliger SHOCK sur coup de base
  critSurgeAspdPct: number;     // % de vitesse d'attaque après un critique (2s)
  arcChancePct: number;         // % de chance qu'un coup arque vers l'ennemi le plus proche
  staticRetortPct: number;      // % de chance d'émettre une nova électrique en subissant un coup
  chainFinisher: boolean;       // finisher : éclair en chaîne (3 ennemis max, LIGHTNING)
  critArc: boolean;             // tout critique déclenche l'arc automatiquement (60% dégâts)

  // ── GLACIUS ────────────────────────────────────────────────────────────────
  damageReductionPct: number;   // % de réduction de tous les dégâts subis (cap absolu 30)
  statusResDurationPct: number; // % de réduction de la durée des debuffs subis (cap 60)
  healingReceivedPct: number;   // % bonus sur tous les soins reçus
  chillAura: boolean;           // aura passive (r130) : -10% vitesse/ASPD des ennemis proches
  lastBastion: boolean;         // 1x/combat sous 30% HP → bouclier 25% HP max, 5s
  guardFinisher: boolean;       // finisher : bouclier 8% HP max, 3s
  preserved: boolean;           // 1x/zone, un coup fatal laisse à 1 HP + 2s d'invulnérabilité
}

export class TalentSystem {

  /** Points déjà dépensés dans une branche (somme des coûts des nœuds débloqués). */
  static pointsSpentInBranch(player: PlayerState, branch: TalentBranch): number {
    return player.unlockedTalents.reduce((sum, id) => {
      const node = TALENT_MAP[id];
      return node?.branch === branch ? sum + node.cost : sum;
    }, 0);
  }

  /** True si le joueur a débloqué au moins un nœud ARCANE de tier ≥ 3 (gate d'accès IGNIS). */
  static hasArcaneTier3(player: PlayerState): boolean {
    return player.unlockedTalents.some(id => {
      const n = TALENT_MAP[id];
      return n?.branch === TalentBranch.ARCANE && n.tier >= 3;
    });
  }

  /** True si le joueur a débloqué au moins un nœud VIGOR de tier ≥ 3 (gate d'accès TERRA). */
  static hasVigorTier3(player: PlayerState): boolean {
    return player.unlockedTalents.some(id => {
      const n = TALENT_MAP[id];
      return n?.branch === TalentBranch.VIGOR && n.tier >= 3;
    });
  }

  /** True si le joueur a débloqué au moins un nœud INSTINCT de tier ≥ 3 (gate d'accès FULGURIS). */
  static hasInstinctTier3(player: PlayerState): boolean {
    return player.unlockedTalents.some(id => {
      const n = TALENT_MAP[id];
      return n?.branch === TalentBranch.INSTINCT && n.tier >= 3;
    });
  }

  /**
   * Vérifie si un nœud peut être débloqué :
   * - non déjà acquis
   * - suffisamment de points disponibles
   * - nœud NG+ (TENEBRES) : player.isNewGamePlus requis — l'UI affiche le nœud
   *   grisé avec "Je ne suis pas encore capable de maîtriser cette magie..."
   * - prérequis directs (node.requires, AND) tous débloqués
   * - accès IGNIS : au moins un nœud ARCANE tier ≥ 3 débloqué
   * - accès TERRA : au moins un nœud VIGOR tier ≥ 3 débloqué
   * - accès FULGURIS : au moins un nœud INSTINCT tier ≥ 3 débloqué
   * - GLACIUS (comme ZEPHYR/ABYSSAL) : accès libre, aucun gate
   * - gate par investissement : tier2=2pts, tier3=4pts, tier4=6pts, tier5=10pts dans la branche
   */
  static canUnlock(player: PlayerState, talentId: string): boolean {
    const node = TALENT_MAP[talentId];
    if (!node) return false;
    if (player.unlockedTalents.includes(talentId)) return false;
    if (player.talentPoints < node.cost) return false;

    if (node.ngPlusOnly && !player.isNewGamePlus) return false;

    if (node.requires?.some(req => !player.unlockedTalents.includes(req))) return false;

    if (node.branch === TalentBranch.IGNIS && !TalentSystem.hasArcaneTier3(player)) return false;
    if (node.branch === TalentBranch.TERRA && !TalentSystem.hasVigorTier3(player)) return false;
    if (node.branch === TalentBranch.FULGURIS && !TalentSystem.hasInstinctTier3(player)) return false;

    const spent = TalentSystem.pointsSpentInBranch(player, node.branch);
    const GATE: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 2, 3: 4, 4: 6, 5: 10 };
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
  /**
   * Vitesse d'attaque apportée par les TALENTS, en POINTS DE POURCENTAGE.
   *
   * `getModifiers().attackSpeedMult` existait depuis toujours et n'a JAMAIS été
   * consommé par une seule ligne de `src/scenes/` : les 4 talents de vitesse
   * d'attaque du jeu (r.451, r.555, r.946, r.1025, r.1051) ne faisaient
   * strictement RIEN. Le joueur dépensait des points dans du vide.
   *
   * La vitesse d'attaque n'a désormais qu'UN seul point d'entrée —
   * `StatsSystem.computeAll().aspd` — et les talents y sont additionnés AVANT le
   * softcap, exactement comme les substats d'équipement. Deux canaux qui portent
   * le même nom doivent se sommer dans la même monnaie, sinon l'un des deux ment.
   *
   * Accesseur DÉDIÉ (et non `getModifiers()`) parce que `computeAll()` est appelé
   * une fois par cône d'attaque : on ne construit pas un objet de 60 champs pour
   * lire un seul nombre.
   */
  static getAspdPct(player: PlayerState): number {
    // Les talents se MULTIPLIENT entre eux (cf. la boucle de getModifiers) ;
    // on reconvertit le produit en points de % pour l'additionner aux substats.
    let mult = 1;
    for (const id of player.unlockedTalents) {
      const e = TALENT_MAP[id]?.effects;
      if (e?.ASPD_PCT !== undefined) mult *= 1 + e.ASPD_PCT / 100;
    }
    return (mult - 1) * 100;
  }

  /**
   * Contributions de talents à des STATS que StatsSystem calcule déjà, en POINTS
   * DE POURCENTAGE ADDITIFS. Même logique que `getAspdPct` (précédent exact,
   * étape 3) : ces points s'ADDITIONNENT aux substats d'équipement DANS
   * `computeAll`, AVANT toute application — jamais en produit.
   *
   * Pourquoi additif et non le canal multiplicatif de `getModifiers()` :
   * `dragon_soul` (+30% ATK) × `blood_pact` (+20%) × `world_ender` (+30%) en
   * produit donnerait ×2,03 (+103%) au lieu de +80% ; c'est ainsi que naissent
   * les builds runaway. En additif, trois nœuds à +30% valent +90%, toujours.
   *
   * NE contient QUE les effets INCONDITIONNELS mappant sur une stat existante.
   * Sont volontairement EXCLUS (conditionnels / multiplicatifs — chantiers
   * séparés, cf. rapport d'étape 4) :
   *   - ELEM_BONUS_PCT des nœuds `elementScoped` (bonus restreint à UN élément :
   *     il faut une vérification d'élément côté combat qui n'existe pas encore) ;
   *   - LOW_HP_ATK_PCT / LOW_HP_DEF_PCT / ATK_PER_BURNING_PCT … (état runtime) ;
   *   - MELEE_DMG_PCT / MAGIC_DMG_PCT / SKILL_DMG_PCT (canaux multiplicatifs
   *     déjà consommés par GameScene/CombatSystem via `getModifiers`).
   *
   * NB — ATK_PCT s'applique à atk ET matk (« ATK globale physique + magique »,
   * cf. TalentEffectKey). Un build physique n'utilise que atk, un mage que matk.
   */
  static getStatContribs(player: PlayerState): {
    atkPct: number; hpPct: number; defPct: number; critPct: number;
    elemBonusPct: number; lifestealPct: number; manaMaxPct: number; manaRegenPct: number;
  } {
    const c = {
      atkPct: 0, hpPct: 0, defPct: 0, critPct: 0,
      elemBonusPct: 0, lifestealPct: 0, manaMaxPct: 0, manaRegenPct: 0,
    };
    for (const id of player.unlockedTalents) {
      const node = TALENT_MAP[id];
      if (!node) continue;
      const e = node.effects;
      if (e.ATK_PCT        !== undefined) c.atkPct       += e.ATK_PCT;
      if (e.MAX_HP_PCT     !== undefined) c.hpPct        += e.MAX_HP_PCT;
      if (e.DEF_PCT        !== undefined) c.defPct       += e.DEF_PCT;
      if (e.CRIT_PCT       !== undefined) c.critPct      += e.CRIT_PCT;
      if (e.LIFESTEAL_PCT  !== undefined) c.lifestealPct += e.LIFESTEAL_PCT;
      if (e.MANA_MAX_PCT   !== undefined) c.manaMaxPct   += e.MANA_MAX_PCT;
      if (e.MANA_REGEN_PCT !== undefined) c.manaRegenPct += e.MANA_REGEN_PCT;
      // ELEM_BONUS_PCT : seulement les nœuds NON restreints à un élément.
      // Les nœuds `elementScoped` (pyroclast fire, leviathan water/ice, …) sont
      // conditionnels — hors scope tant que le combat ne teste pas l'élément.
      if (e.ELEM_BONUS_PCT !== undefined && !node.elementScoped) c.elemBonusPct += e.ELEM_BONUS_PCT;
    }
    return c;
  }

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

      atkMult: 1.0,
      attackSpeedMult: 1.0,
      elemBonusPct: 0,
      manaMaxMult: 1.0,
      manaRegenPct: 0,
      lifestealPct: 0,

      burnChancePct: 0,
      burnDmgPct: 0,
      atkPerBurningPct: 0,
      lowHpDefPct: 0,
      magmaGuard: false,
      burnOnFinisher: false,
      burningPackDmgPct: 0,

      dashCdReductionPct: 0,
      rangedCritPct: 0,
      doubleDash: false,
      projectileRangePct: 0,
      projectileDmgPct: 0,
      cycloneFinisher: false,
      dashDmgPct: 0,
      autoDodge: false,

      slowOnHit: false,
      freezeChancePct: 0,
      aquaticDefPct: 0,
      freezeOnFinisher: false,
      manaOnKillPct: 0,
      burnBleedImmunity: false,

      darkDmgMult: 1.0,
      soulStackBonus: 0,
      voidChannel: false,
      darkBurn: false,
      phantomStrikePct: 0,
      sacrificeFinisher: false,

      knockbackResPct: 0,
      staggerBonusPct: 0,
      stunDmgPct: 0,
      retaliationDefPct: 0,
      quakeFinisher: false,
      unshakable: false,
      defToAtkPct: 0,

      shockChancePct: 0,
      critSurgeAspdPct: 0,
      arcChancePct: 0,
      staticRetortPct: 0,
      chainFinisher: false,
      critArc: false,

      damageReductionPct: 0,
      statusResDurationPct: 0,
      healingReceivedPct: 0,
      chillAura: false,
      lastBastion: false,
      guardFinisher: false,
      preserved: false,
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
      // ATK_PCT / MAX_HP_PCT / CRIT_PCT / ELEM_BONUS_PCT / LIFESTEAL_PCT /
      // MANA_MAX_PCT / MANA_REGEN_PCT / DEF_PCT sont désormais LUS via
      // getStatContribs() → StatsSystem.computeAll (additif), et outOfCombatRegen
      // pour la régén. Les champs atkMult/critBonus/… de getModifiers ci-dessous
      // restent calculés mais sont VESTIGIAUX (aucun consommateur) — exactement
      // comme attackSpeedMult coexiste avec getAspdPct (étape 3). NE PAS les
      // recâbler : le canal vivant est getStatContribs, et lui seul.
      // TODO(combat-signature): MANA_COST_PCT → playerSkill(), POST_FINISHER_BUFF
      // → executeFinisherAttack(), LOW_HP_ATK/DEF_PCT (conditionnels runtime).

      // ── Génériques (branches élémentaires) ──────────────────────────────
      if (e.ATK_PCT !== undefined)                mods.atkMult             *= 1 + e.ATK_PCT / 100;
      if (e.ASPD_PCT !== undefined)               mods.attackSpeedMult     *= 1 + e.ASPD_PCT / 100;
      if (e.ELEM_BONUS_PCT !== undefined)         mods.elemBonusPct        += e.ELEM_BONUS_PCT;
      if (e.MANA_MAX_PCT !== undefined)           mods.manaMaxMult         *= 1 + e.MANA_MAX_PCT / 100;
      if (e.MANA_REGEN_PCT !== undefined)         mods.manaRegenPct        += e.MANA_REGEN_PCT;
      if (e.LIFESTEAL_PCT !== undefined)          mods.lifestealPct        += e.LIFESTEAL_PCT;

      // ── IGNIS ────────────────────────────────────────────────────────────
      if (e.BURN_CHANCE_PCT !== undefined)        mods.burnChancePct       += e.BURN_CHANCE_PCT;
      if (e.BURN_DMG_PCT !== undefined)           mods.burnDmgPct          += e.BURN_DMG_PCT;
      if (e.ATK_PER_BURNING_PCT !== undefined)    mods.atkPerBurningPct    += e.ATK_PER_BURNING_PCT;
      if (e.LOW_HP_DEF_PCT !== undefined)         mods.lowHpDefPct         += e.LOW_HP_DEF_PCT;
      if (e.MAGMA_GUARD !== undefined)            mods.magmaGuard           = true;
      if (e.BURN_ON_FINISHER !== undefined)       mods.burnOnFinisher       = true;
      if (e.BURNING_PACK_DMG_PCT !== undefined)   mods.burningPackDmgPct   += e.BURNING_PACK_DMG_PCT;

      // ── ZEPHYR ───────────────────────────────────────────────────────────
      if (e.DASH_CD_PCT !== undefined)            mods.dashCdReductionPct  += e.DASH_CD_PCT;
      if (e.RANGED_CRIT_PCT !== undefined)        mods.rangedCritPct       += e.RANGED_CRIT_PCT;
      if (e.DOUBLE_DASH !== undefined)            mods.doubleDash           = true;
      if (e.PROJECTILE_RANGE_PCT !== undefined)   mods.projectileRangePct  += e.PROJECTILE_RANGE_PCT;
      if (e.PROJECTILE_DMG_PCT !== undefined)     mods.projectileDmgPct    += e.PROJECTILE_DMG_PCT;
      if (e.CYCLONE_FINISHER !== undefined)       mods.cycloneFinisher      = true;
      if (e.DASH_DMG_PCT !== undefined)           mods.dashDmgPct          += e.DASH_DMG_PCT;
      if (e.AUTO_DODGE !== undefined)             mods.autoDodge            = true;

      // ── ABYSSAL ──────────────────────────────────────────────────────────
      if (e.SLOW_ON_HIT !== undefined)            mods.slowOnHit            = true;
      if (e.FREEZE_CHANCE_PCT !== undefined)      mods.freezeChancePct     += e.FREEZE_CHANCE_PCT;
      if (e.AQUATIC_DEF_PCT !== undefined)        mods.aquaticDefPct       += e.AQUATIC_DEF_PCT;
      if (e.FREEZE_ON_FINISHER !== undefined)     mods.freezeOnFinisher     = true;
      if (e.MANA_ON_KILL_PCT !== undefined)       mods.manaOnKillPct       += e.MANA_ON_KILL_PCT;
      if (e.BURN_BLEED_IMMUNITY !== undefined)    mods.burnBleedImmunity    = true;

      // ── TENEBRES (NG+) ───────────────────────────────────────────────────
      if (e.DARK_DMG_MULT !== undefined)          mods.darkDmgMult         *= 1 + e.DARK_DMG_MULT / 100;
      if (e.SOUL_STACK_BONUS !== undefined)       mods.soulStackBonus      += e.SOUL_STACK_BONUS;
      if (e.VOID_CHANNEL !== undefined)           mods.voidChannel          = true;
      if (e.DARK_BURN !== undefined)              mods.darkBurn             = true;
      if (e.PHANTOM_STRIKE_PCT !== undefined)     mods.phantomStrikePct    += e.PHANTOM_STRIKE_PCT;
      if (e.SACRIFICE_FINISHER !== undefined)     mods.sacrificeFinisher    = true;

      // ── TERRA ────────────────────────────────────────────────────────────
      if (e.KNOCKBACK_RES_PCT !== undefined)      mods.knockbackResPct      = Math.min(100, mods.knockbackResPct + e.KNOCKBACK_RES_PCT);
      if (e.STAGGER_BONUS_PCT !== undefined)      mods.staggerBonusPct     += e.STAGGER_BONUS_PCT;
      if (e.STUN_DMG_PCT !== undefined)           mods.stunDmgPct          += e.STUN_DMG_PCT;
      if (e.RETALIATION_DEF_PCT !== undefined)    mods.retaliationDefPct   += e.RETALIATION_DEF_PCT;
      if (e.QUAKE_FINISHER !== undefined)         mods.quakeFinisher        = true;
      if (e.UNSHAKABLE !== undefined)             mods.unshakable           = true;
      if (e.DEF_TO_ATK_PCT !== undefined)         mods.defToAtkPct         += e.DEF_TO_ATK_PCT;

      // ── FULGURIS ─────────────────────────────────────────────────────────
      if (e.SHOCK_CHANCE_PCT !== undefined)       mods.shockChancePct      += e.SHOCK_CHANCE_PCT;
      if (e.CRIT_SURGE_ASPD_PCT !== undefined)    mods.critSurgeAspdPct    += e.CRIT_SURGE_ASPD_PCT;
      if (e.ARC_CHANCE_PCT !== undefined)         mods.arcChancePct        += e.ARC_CHANCE_PCT;
      if (e.STATIC_RETORT_PCT !== undefined)      mods.staticRetortPct     += e.STATIC_RETORT_PCT;
      if (e.CHAIN_FINISHER !== undefined)         mods.chainFinisher        = true;
      if (e.CRIT_ARC !== undefined)               mods.critArc              = true;

      // ── GLACIUS ──────────────────────────────────────────────────────────
      if (e.DAMAGE_REDUCTION_PCT !== undefined)   mods.damageReductionPct   = Math.min(30, mods.damageReductionPct + e.DAMAGE_REDUCTION_PCT);
      if (e.STATUS_RES_DURATION_PCT !== undefined) mods.statusResDurationPct = Math.min(60, mods.statusResDurationPct + e.STATUS_RES_DURATION_PCT);
      if (e.HEALING_RECEIVED_PCT !== undefined)   mods.healingReceivedPct  += e.HEALING_RECEIVED_PCT;
      if (e.CHILL_AURA !== undefined)              mods.chillAura            = true;
      if (e.LAST_BASTION !== undefined)            mods.lastBastion          = true;
      if (e.GUARD_FINISHER !== undefined)          mods.guardFinisher        = true;
      if (e.PRESERVED !== undefined)               mods.preserved            = true;
    }

    return mods;
  }
}
