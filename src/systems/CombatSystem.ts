import {
  PlayerState, Enemy, ActiveEnemy, DamageResult,
  StatusEffect, ElementType, ELEMENT_WEAKNESS, DARK_MULTIPLIER, WEAKNESS_MULTIPLIER, Skill
} from '../types';
import { TalentModifiers } from './TalentSystem';
import { StatsSystem, ComputedStats } from './StatsSystem';
import { PassiveSystem } from './PassiveSystem';
import { SKILL_MAP } from '../data/skills';
import { scaledEnemyStats, depthOfZone } from '../data/enemyScaling';

const ELEMENTAL_ADVANTAGE = WEAKNESS_MULTIPLIER;
const ELEMENTAL_DISADVANTAGE = 0.80;

export class CombatSystem {

  /**
   * Instancie un ennemi de zone, mis à l'échelle par la PROFONDEUR de la zone où
   * on le rencontre — plus par le niveau du joueur.
   *
   * L'ancienne signature était `spawnEnemy(enemy, playerLevel)` et calculait
   * `scale = 1 + (SCALED_ENEMY_LEVEL(baseLevel, playerLevel) - baseLevel) * 0.08`.
   * Les niveaux ayant disparu, `playerLevel` valait 1 partout : pour un ennemi de
   * `baseLevel` 30 le facteur tombait à -0,44 et `maxHp` devenait NÉGATIF (mesuré :
   * 9 ennemis sur 57, dont 3 boss). Voir `src/data/enemyScaling.ts`.
   *
   * `level` n'est plus qu'un affichage : on garde `baseLevel` tel quel (le
   * Bestiaire et l'XP le lisent), il ne pilote plus aucune statistique.
   */
  static spawnEnemy(enemy: Enemy, zoneId: string): ActiveEnemy {
    const depth = depthOfZone(zoneId);
    const stats = scaledEnemyStats(enemy, depth);

    return {
      ...enemy,
      enemyId: enemy.id,
      instanceId: `${enemy.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      level: enemy.baseLevel,
      currentHp:   stats.baseHp,
      maxHp:       stats.baseHp,
      currentMana: stats.baseMana,
      maxMana:     stats.baseMana,
      stats,
      statusEffects: [],
      x: 0,
      y: 0,
      sprite: undefined,
    };
  }

  // Player basic attack on enemy
  // `precomputed` lets a caller resolving multiple hits from one swing (e.g. a
  // cone hitting several enemies) compute ComputedStats once instead of once
  // per target — StatsSystem.computeAll() iterates all equipped gear/substats.
  static playerAttack(player: PlayerState, target: ActiveEnemy, precomputed?: ComputedStats): DamageResult {
    const weapon = player.equipment.weapon;
    const cs = precomputed ?? StatsSystem.computeAll(player);
    // cs.atk includes DÉJÀ la main stat de l'arme (StatsSystem.computeAll) — ne
    // jamais réadditionner weapon.damage ici, sous peine de compter l'arme deux fois.
    const rawDamage = cs.atk;
    // FIRST_STRIKE_500_PCT (qa-agent BUG) : calculé AVANT le crit pour pouvoir
    // désactiver ce dernier sur le coup — évite le cumul ×5 × crit(×2) qui montait
    // à ×17,7 avec élément+Soul Echo. Réservé aux boss (cf. PassiveSystem).
    const firstStrikeMult = PassiveSystem.getFirstStrikeMultiplier(player, target.isBoss ?? false);
    const critRoll = firstStrikeMult > 1 ? false : Math.random() < cs.crit / 100;
    const mult = critRoll ? cs.critDmg : 1.0;
    // BUG2 fix: EXPOSE status reduces effective DEF before damage calculation
    const expose = target.statusEffects.find(e => e.type === 'EXPOSE');
    // DEF_IGNORE_100_PCT (hidden_stoneheart_maul) — traite la DEF cible comme 0,
    // prioritaire sur EXPOSE (qui ne fait de toute façon que la réduire davantage).
    const defIgnore = PassiveSystem.hasDefIgnore(player.equipment);
    const effectiveDef = defIgnore
      ? 0
      : expose
        ? Math.max(0, target.stats.baseDef * (1 - expose.strength / 100))
        : target.stats.baseDef;
    const reduced = rawDamage * (100 / (100 + effectiveDef));
    const weaponElement = weapon?.element;
    const elemMult = CombatSystem.elementalMultiplier(weaponElement, target);
    const elemBonusMult = weaponElement && weaponElement !== ElementType.NEUTRAL
      ? 1 + cs.elemBonus / 100
      : 1;
    const soulBonus = CombatSystem.getSoulEchoBonus(player);
    // Passifs d'objet — mêmes multiplicateurs appliqués dans playerAttack() ET
    // playerSkill() (cf. précédent Soul Echo : un passif de dégâts doit toucher
    // les deux chemins, sinon la moitié du kit du joueur en est exempté).
    const waterDmgMult = weaponElement === ElementType.WATER
      ? 1 + PassiveSystem.getWaterDmgBonusPct(player.equipment) / 100
      : 1;
    const killStackMult = PassiveSystem.getKillStackDamageMultiplier(player);
    // BOSS_DMG_PCT (loot stat rolls) — dégâts bonus contre boss ET élites (cap 40, cf. StatsSystem).
    const bossDmgMult = (target.isBoss || target.isElite) ? 1 + cs.bossDmg / 100 : 1;
    const damage = Math.max(1, Math.floor(
      reduced * mult * elemMult * elemBonusMult * (0.9 + Math.random() * 0.2)
      * soulBonus * waterDmgMult * killStackMult * firstStrikeMult * bossDmgMult,
    ));

    target.currentHp = Math.max(0, target.currentHp - damage);
    if (cs.lifesteal > 0) {
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + Math.floor(damage * cs.lifesteal / 100));
    }
    // OMNIVAMP_25_PCT (hidden_abyssal_talons) — distinct de cs.lifesteal (stat rolls),
    // s'additionne dessus : "25% de TOUS les dégâts infligés" par le porteur.
    const omnivampPct = PassiveSystem.getOmnivampPct(player.equipment);
    if (omnivampPct > 0) {
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + Math.floor(damage * omnivampPct / 100));
    }
    return { damage, isCrit: critRoll, element: weaponElement, isKill: target.currentHp <= 0 };
  }

  // Player uses a skill on enemy (or self for heals)
  static playerSkill(
    player: PlayerState,
    skill: Skill,
    target?: ActiveEnemy,
    mods?: TalentModifiers,
  ): DamageResult | null {
    const zeroManaCost = PassiveSystem.hasZeroManaCost(player.equipment);
    if (!zeroManaCost) {
      if (player.stats.mana < skill.manaCost) return null;
      player.stats.mana -= skill.manaCost;
    }

    if (skill.effect?.heal || skill.effect?.healPercent) {
      const healSkillMult = 1 + PassiveSystem.getHealSkillBonusPct(player.equipment) / 100;
      const amt = skill.effect.heal
        ? Math.round(skill.effect.heal * healSkillMult)
        : Math.round(player.stats.maxHp * (skill.effect.healPercent ?? 0) * healSkillMult);
      // PassiveSystem.applyHeal (au lieu d'un clamp manuel) — convertit le surplus
      // au-delà de maxHp en bouclier si OVERHEAL_SHIELD_50_PCT est équipé.
      PassiveSystem.applyHeal(player, amt);
      return { damage: 0, isCrit: false, isKill: false };
    }

    if (!target) return null;

    const cs = StatsSystem.computeAll(player);
    // cs.atk/cs.matk incluent DÉJÀ la main stat de l'arme — seul le bonus propre
    // au sort (skill.damage/magicDamage) s'additionne par-dessus.
    const rawMagic = cs.matk + (skill.magicDamage ?? 0);
    const rawPhys  = cs.atk  + (skill.damage      ?? 0);
    // FIRST_STRIKE_500_PCT : calculé avant le crit pour le désactiver sur ce coup
    // (même raisonnement que playerAttack — évite le cumul ×5 × crit).
    const firstStrikeMult = PassiveSystem.getFirstStrikeMultiplier(player, target.isBoss ?? false);
    const critRoll = firstStrikeMult > 1 ? false : Math.random() < cs.crit / 100;
    const mult = critRoll ? cs.critDmg : 1.0;

    const elemMult = CombatSystem.elementalMultiplier(skill.element, target);
    const elemBonusMult = skill.element && skill.element !== ElementType.NEUTRAL
      ? 1 + cs.elemBonus / 100
      : 1;

    const soulBonus = CombatSystem.getSoulEchoBonus(player);
    // Passifs d'objet dépendant de l'élément du sort — appliqués AVANT les
    // multiplicateurs de talents (mods) pour rester cohérent avec l'ordre déjà
    // établi (élément → talents), et AVANT de savoir si c'est un kill.
    const targetAlreadyStunned = target.statusEffects.some(e => e.type === 'STUN' || e.type === 'FREEZE');
    const lightningStunnedMult = skill.element === ElementType.LIGHTNING && targetAlreadyStunned
      ? 1 + PassiveSystem.getLightningStunnedDmgBonusPct(player.equipment) / 100
      : 1;
    const waterDmgMult = skill.element === ElementType.WATER
      ? 1 + PassiveSystem.getWaterDmgBonusPct(player.equipment) / 100
      : 1;
    const unboundDmgMult = 1 + PassiveSystem.getUnboundSkillDmgCdPct(player.equipment).dmgPct / 100;
    const killStackMult = PassiveSystem.getKillStackDamageMultiplier(player);
    // BOSS_DMG_PCT (loot stat rolls) — dégâts bonus contre boss ET élites (cap 40, cf. StatsSystem).
    const bossDmgMult = (target.isBoss || target.isElite) ? 1 + cs.bossDmg / 100 : 1;
    const passiveMult = lightningStunnedMult * waterDmgMult * unboundDmgMult * killStackMult * firstStrikeMult * bossDmgMult;

    const magicDmg = Math.floor(rawMagic * (100 / (100 + target.stats.baseMagicDef)) * mult * elemMult * elemBonusMult * soulBonus * passiveMult);
    const physDmg  = Math.floor(rawPhys  * (100 / (100 + target.stats.baseDef))      * mult * soulBonus * passiveMult);
    const total    = Math.max(1, magicDmg + physDmg);

    // BLOCKER-C: apply talent multipliers (skillDmgMult, projectileSkillMult, magicDmgMult)
    let finalTotal = total;
    if (mods) {
      finalTotal = Math.round(total * mods.skillDmgMult);
      if (skill.isProjectile) finalTotal = Math.round(finalTotal * mods.projectileSkillMult);
      if (skill.element)      finalTotal = Math.round(finalTotal * mods.magicDmgMult);
      finalTotal = Math.max(1, finalTotal);
    }

    target.currentHp = Math.max(0, target.currentHp - finalTotal);
    if (cs.lifesteal > 0) {
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + Math.floor(finalTotal * cs.lifesteal / 100));
    }

    let statusApplied: StatusEffect | undefined;
    const iceSlowBonusPct = PassiveSystem.getIceSlowBonusPct(player.equipment);
    if (skill.effect?.stun && Math.random() < 0.7) {
      statusApplied = { type: 'STUN', duration: skill.effect.stunDuration ?? 1, strength: 1 };
      target.statusEffects.push(statusApplied);
    } else if (skill.effect?.freeze && Math.random() < 0.8) {
      statusApplied = { type: 'FREEZE', duration: skill.effect.freezeDuration ?? 2, strength: 1 };
      target.statusEffects.push(statusApplied);
    } else if (skill.effect?.slow) {
      const baseSlow = skill.effect.slowAmount ?? 0.3;
      const slowStrength = skill.element === ElementType.ICE ? baseSlow * (1 + iceSlowBonusPct / 100) : baseSlow;
      statusApplied = { type: 'SLOW', duration: skill.effect.slowDuration ?? 3, strength: slowStrength };
      target.statusEffects.push(statusApplied);
    } else if (skill.element === ElementType.FIRE && skill.effect?.dot) {
      statusApplied = { type: 'BURN', duration: skill.effect.dotDuration ?? 3, strength: skill.effect.dotDamage ?? 8, sourceSkillId: skill.id };
      target.statusEffects.push(statusApplied);
    }

    return { damage: finalTotal, isCrit: critRoll, element: skill.element, isKill: target.currentHp <= 0, statusApplied };
  }

  /**
   * Un ennemi frappe le joueur (MÊLÉE — contact, charge, dash_melee, melee_basic).
   * Toujours PHYSIQUE : `baseAtk` réduit par la DEF. Applique les dégâts.
   */
  static enemyAttack(enemy: ActiveEnemy, player: PlayerState): DamageResult {
    const isStunned = enemy.statusEffects.some(e => e.type === 'STUN' || e.type === 'FREEZE');
    if (isStunned) return { damage: 0, isCrit: false, isKill: false };

    // DODGE_PCT (loot stat rolls) — chance d'esquiver totalement l'attaque, cap 20
    // (cf. StatsSystem.computeAll().dodge). Roll AVANT le calcul de dégâts.
    const dodge = StatsSystem.computeAll(player).dodge;
    if (dodge > 0 && Math.random() * 100 < dodge) {
      return { damage: 0, isCrit: false, isKill: false, wasDodged: true };
    }

    const damage = CombatSystem.mitigatedEnemyDamage(enemy, player, false, 1.0);
    player.stats.hp = Math.max(0, player.stats.hp - damage);
    return { damage, isCrit: false, isKill: player.stats.hp <= 0 };
  }

  /**
   * Dégâts d'une attaque À DISTANCE d'un ennemi (burst_fan, circular_burst,
   * homing) — RÉDUITS par la défense correspondante. Ne les applique PAS :
   * GameScene les fait passer par ses propres filtres (i-frames, garde, dash,
   * boucliers de passifs) avant de toucher les PV.
   *
   * ⚠ C'EST UN TROU DE COMBAT QUI SE FERME ICI.
   * Avant : `GameScene.executeEnemyAttackPattern` calculait `baseDmg =
   * round(ae.stats.baseAtk × damageMult)` et l'envoyait TEL QUEL à
   * `applyDamageToPlayer()`, qui n'applique aucune DEF (seulement les boucliers).
   * Autrement dit : **tout projectile ennemi ignorait 100% de la défense du
   * joueur.** 23 ennemis (dont les 7 boss) ont un pattern primaire à projectile.
   * La DEF n'était donc vraie que contre la moitié du jeu, en silence.
   *
   * Le canal dépend du `damageType` de l'ennemi :
   *   PHYSICAL → baseAtk      vs player.stats.def
   *   MAGIC    → baseMagicAtk vs player.stats.magicDef
   * C'est ce qui donne enfin une valeur à MDEF_FLAT (elle valait exactement 0).
   */
  static enemyRangedDamage(enemy: ActiveEnemy, player: PlayerState, damageMult = 1.0): number {
    const magic = enemy.damageType === 'MAGIC';
    return CombatSystem.mitigatedEnemyDamage(enemy, player, magic, damageMult);
  }

  /**
   * Le calcul de dégâts ennemi, canal unique. `Math.max(1, …)` : un coup touche
   * TOUJOURS pour au moins 1 — un ennemi ne doit jamais devenir décoratif.
   */
  private static mitigatedEnemyDamage(
    enemy: ActiveEnemy,
    player: PlayerState,
    magic: boolean,
    damageMult: number,
  ): number {
    const raw = magic ? enemy.stats.baseMagicAtk : enemy.stats.baseAtk;
    const def = magic ? player.stats.magicDef : player.stats.def;
    const reduced = raw * (100 / (100 + Math.max(0, def)));
    return Math.max(1, Math.floor(reduced * damageMult * (0.85 + Math.random() * 0.3)));
  }

  // Tick DoT effects each second
  static tickStatusEffects(enemy: ActiveEnemy): number {
    let dotDamage = 0;
    enemy.statusEffects = enemy.statusEffects
      .map(effect => {
        if (effect.type === 'BURN' || effect.type === 'POISON' || effect.type === 'BLEED') {
          dotDamage += effect.strength;
        }
        return { ...effect, duration: effect.duration - 1 };
      })
      .filter(e => e.duration > 0);

    enemy.currentHp = Math.max(0, enemy.currentHp - dotDamage);
    return dotDamage;
  }

  // Elemental multiplier — DARK is super-effective against all non-DARK/non-DIVINE elements
  static elementalMultiplier(skillElement: ElementType | undefined, enemy: { element: ElementType }): number {
    if (!skillElement || skillElement === ElementType.NEUTRAL) return 1.0;
    if (skillElement === ElementType.DARK && enemy.element !== ElementType.DARK && enemy.element !== ElementType.DIVINE) {
      return DARK_MULTIPLIER;
    }
    if (ELEMENT_WEAKNESS[enemy.element] === skillElement) return ELEMENTAL_ADVANTAGE;
    if (ELEMENT_WEAKNESS[skillElement] === enemy.element) return ELEMENTAL_DISADVANTAGE;
    return 1.0;
  }

  /**
   * PERMA_BURN_STACK_3_PCT (hidden_magma_cleaver) — dégâts d'un tick (1s) de la
   * Marque de Magma : 3% de l'ATK du porteur par stack (max 10 stacks gérés côté
   * GameScene). Lit cs.atk (main stat d'arme incluse) comme toutes les autres
   * formules de dégâts — jamais weapon.damage directement. Minimum 1 pour qu'un
   * stack se voie toujours (cohérent avec le Math.max(1, …) des autres formules).
   */
  static getMagmaBurnTickDamage(player: PlayerState, stacks: number): number {
    if (stacks <= 0) return 0;
    const atk = StatsSystem.computeAll(player).atk;
    return Math.max(1, Math.round(atk * PassiveSystem.MAGMA_BURN_PCT_PER_STACK / 100 * stacks));
  }

  // Soul Echo bonus (passive hidden skill)
  static getSoulEchoBonus(player: PlayerState): number {
    if (!player.unlockedSkills.includes('soul_echo')) return 1.0;
    return 1.0 + player.clearedZones.length * 0.03;
  }

  // Compute player mana regen tick (call every 2 seconds out of combat)
  static outOfCombatRegen(player: PlayerState): void {
    const hpRegen = player.unlockedSkills.includes('elaras_gift')
      ? Math.floor(player.stats.maxHp * 0.01)
      : 0;
    const manaRegen = Math.floor(player.stats.maxMana * 0.02);

    // PassiveSystem.applyHeal (au lieu d'un clamp manuel) — convertit le surplus HP
    // au-delà de maxHp en bouclier si OVERHEAL_SHIELD_50_PCT est équipé (cohérent
    // avec playerSkill et les soins de GameScene).
    PassiveSystem.applyHeal(player, hpRegen);
    player.stats.mana = Math.min(player.stats.maxMana, player.stats.mana + manaRegen);
  }
}
