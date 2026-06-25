import {
  PlayerState, Enemy, ActiveEnemy, DamageResult,
  StatusEffect, ElementType, ELEMENT_WEAKNESS, DARK_MULTIPLIER, WEAKNESS_MULTIPLIER, Skill
} from '../types';
import { ProgressionSystem, SCALED_ENEMY_LEVEL } from './ProgressionSystem';
import { SKILL_MAP } from '../data/skills';

const ELEMENTAL_ADVANTAGE = WEAKNESS_MULTIPLIER;
const ELEMENTAL_DISADVANTAGE = 0.80;
const CRIT_MULTIPLIER = 1.5;

export class CombatSystem {

  // Instantiate a zone enemy scaled to player level
  static spawnEnemy(enemy: Enemy, playerLevel: number): ActiveEnemy {
    const level = SCALED_ENEMY_LEVEL(enemy.baseLevel, playerLevel);
    const scale = 1 + (level - enemy.baseLevel) * 0.08;

    return {
      enemyId: enemy.id,
      instanceId: `${enemy.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      level,
      currentHp:   Math.floor(enemy.stats.baseHp   * scale),
      maxHp:       Math.floor(enemy.stats.baseHp   * scale),
      currentMana: Math.floor(enemy.stats.baseMana * scale),
      maxMana:     Math.floor(enemy.stats.baseMana * scale),
      stats: {
        baseHp:       Math.floor(enemy.stats.baseHp       * scale),
        baseMana:     Math.floor(enemy.stats.baseMana     * scale),
        baseAtk:      Math.floor(enemy.stats.baseAtk      * scale),
        baseDef:      Math.floor(enemy.stats.baseDef      * scale),
        baseSpd:      Math.floor(enemy.stats.baseSpd      * scale),
        baseMagicAtk: Math.floor(enemy.stats.baseMagicAtk * scale),
        baseMagicDef: Math.floor(enemy.stats.baseMagicDef * scale),
      },
      statusEffects: [],
      x: 0,
      y: 0,
      ...enemy,
    };
  }

  // Player basic attack on enemy
  static playerAttack(player: PlayerState, target: ActiveEnemy): DamageResult {
    const weapon = player.equipment.weapon;
    const rawDamage = player.stats.atk + (weapon?.damage ?? 0);
    const critRoll = Math.random() < ProgressionSystem.critChance(player);
    const mult = critRoll ? CRIT_MULTIPLIER : 1.0;
    const reduced = rawDamage * (100 / (100 + target.stats.baseDef));
    const soulBonus = CombatSystem.getSoulEchoBonus(player);
    const damage = Math.max(1, Math.floor(reduced * mult * (0.9 + Math.random() * 0.2) * soulBonus));

    target.currentHp = Math.max(0, target.currentHp - damage);
    return { damage, isCrit: critRoll, isKill: target.currentHp <= 0 };
  }

  // Player uses a skill on enemy (or self for heals)
  static playerSkill(
    player: PlayerState,
    skill: Skill,
    target?: ActiveEnemy
  ): DamageResult | null {
    if (player.stats.mana < skill.manaCost) return null;
    player.stats.mana -= skill.manaCost;

    if (skill.effect?.heal || skill.effect?.healPercent) {
      const amt = skill.effect.heal
        ? skill.effect.heal
        : Math.floor(player.stats.maxHp * (skill.effect.healPercent ?? 0));
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + amt);
      return { damage: 0, isCrit: false, isKill: false };
    }

    if (!target) return null;

    const rawMagic = player.stats.magicAtk + (skill.magicDamage ?? 0);
    const rawPhys  = player.stats.atk      + (skill.damage      ?? 0);
    const critRoll = Math.random() < ProgressionSystem.critChance(player);
    const mult = critRoll ? CRIT_MULTIPLIER : 1.0;

    const elemMult = CombatSystem.elementalMultiplier(skill.element, target);

    const soulBonus = CombatSystem.getSoulEchoBonus(player);
    const magicDmg = Math.floor(rawMagic * (100 / (100 + target.stats.baseMagicDef)) * mult * elemMult * soulBonus);
    const physDmg  = Math.floor(rawPhys  * (100 / (100 + target.stats.baseDef))      * mult * soulBonus);
    const total    = Math.max(1, magicDmg + physDmg);

    target.currentHp = Math.max(0, target.currentHp - total);

    let statusApplied: StatusEffect | undefined;
    if (skill.effect?.stun && Math.random() < 0.7) {
      statusApplied = { type: 'STUN', duration: skill.effect.stunDuration ?? 1, strength: 1 };
      target.statusEffects.push(statusApplied);
    } else if (skill.effect?.freeze && Math.random() < 0.8) {
      statusApplied = { type: 'FREEZE', duration: skill.effect.freezeDuration ?? 2, strength: 1 };
      target.statusEffects.push(statusApplied);
    } else if (skill.effect?.slow) {
      statusApplied = { type: 'SLOW', duration: skill.effect.slowDuration ?? 3, strength: skill.effect.slowAmount ?? 0.3 };
      target.statusEffects.push(statusApplied);
    } else if (skill.element === ElementType.FIRE && skill.effect?.dot) {
      statusApplied = { type: 'BURN', duration: skill.effect.dotDuration ?? 3, strength: skill.effect.dotDamage ?? 8, sourceSkillId: skill.id };
      target.statusEffects.push(statusApplied);
    }

    return { damage: total, isCrit: critRoll, element: skill.element, isKill: target.currentHp <= 0, statusApplied };
  }

  // Enemy attacks player
  static enemyAttack(enemy: ActiveEnemy, player: PlayerState): DamageResult {
    const rawDmg = enemy.stats.baseAtk;
    const reduced = rawDmg * (100 / (100 + player.stats.def));
    const isStunned = enemy.statusEffects.some(e => e.type === 'STUN' || e.type === 'FREEZE');
    if (isStunned) return { damage: 0, isCrit: false, isKill: false };

    const damage = Math.max(1, Math.floor(reduced * (0.85 + Math.random() * 0.3)));
    player.stats.hp = Math.max(0, player.stats.hp - damage);
    return { damage, isCrit: false, isKill: player.stats.hp <= 0 };
  }

  // Tick DoT effects each second
  static tickStatusEffects(enemy: ActiveEnemy): number {
    let dotDamage = 0;
    enemy.statusEffects = enemy.statusEffects
      .map(effect => {
        if (effect.type === 'BURN' || effect.type === 'POISON') {
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

    player.stats.hp   = Math.min(player.stats.maxHp,   player.stats.hp   + hpRegen);
    player.stats.mana = Math.min(player.stats.maxMana, player.stats.mana + manaRegen);
  }
}
