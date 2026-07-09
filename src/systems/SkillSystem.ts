import { PlayerState, Skill, ElementType, EquippedSkills } from '../types';
import { SKILL_MAP } from '../data/skills';
import { PassiveSystem } from './PassiveSystem';

const SKILL_SLOTS: (keyof EquippedSkills)[] = ['slot1', 'slot2', 'slot3', 'slot4'];

export class SkillSystem {

  static getSkill(id: string): Skill | undefined {
    return SKILL_MAP[id];
  }

  static unlockSkill(player: PlayerState, skillId: string): boolean {
    if (player.unlockedSkills.includes(skillId)) return false;
    player.unlockedSkills.push(skillId);
    return true;
  }

  static unlockZoneSkills(player: PlayerState, element: ElementType): string[] {
    const unlocked: string[] = [];
    for (const skill of Object.values(SKILL_MAP)) {
      if (skill.unlockCondition?.zoneCleared === element) {
        if (this.unlockSkill(player, skill.id)) {
          unlocked.push(skill.id);
        }
      }
    }
    return unlocked;
  }

  static checkHiddenUnlocks(player: PlayerState): string[] {
    const unlocked: string[] = [];
    for (const skill of Object.values(SKILL_MAP)) {
      if (!skill.isHidden) continue;
      if (player.unlockedSkills.includes(skill.id)) continue;

      const cond = skill.unlockCondition;
      if (!cond) continue;

      if (cond.allZonesCleared && player.clearedZones.length < 6) continue;
      if (cond.level && player.level < cond.level) continue;
      if (cond.questCompleted && !player.completedQuests.includes(cond.questCompleted)) continue;

      if (this.unlockSkill(player, skill.id)) {
        unlocked.push(skill.id);
      }
    }
    return unlocked;
  }

  static equipSkill(player: PlayerState, skillId: string, slot: keyof EquippedSkills): boolean {
    if (!player.unlockedSkills.includes(skillId)) return false;
    const skill = SKILL_MAP[skillId];
    if (!skill || skill.isDefault) return false;

    for (const s of SKILL_SLOTS) {
      if (player.equippedSkills[s] === skillId) player.equippedSkills[s] = null;
    }
    player.equippedSkills[slot] = skillId;
    return true;
  }

  static unequipSkill(player: PlayerState, slot: keyof EquippedSkills): void {
    player.equippedSkills[slot] = null;
  }

  static getEquippedSkills(player: PlayerState): Array<Skill | null> {
    return SKILL_SLOTS.map(slot => {
      const id = player.equippedSkills[slot];
      return id ? (SKILL_MAP[id] ?? null) : null;
    });
  }

  static canUseSkill(player: PlayerState, skillId: string, cooldowns: Record<string, number>): boolean {
    const skill = SKILL_MAP[skillId];
    if (!skill) return false;
    if (!PassiveSystem.hasZeroManaCost(player.equipment) && player.stats.mana < skill.manaCost) return false;
    if ((cooldowns[skillId] ?? 0) > 0) return false;
    return true;
  }

  /**
   * Démarre le cooldown d'un skill, modulé par les passifs d'objet dépendant de
   * l'élément (ex: FIRE_SKILL_CD_15_PCT) ou globaux (SKILL_DMG_15_CD_10_PCT, qui
   * AUGMENTE le cooldown — trade-off de l'Anneau du Délié). `player` optionnel
   * pour ne pas casser les appels existants qui n'ont pas de passif à appliquer.
   */
  static startCooldown(cooldowns: Record<string, number>, skillId: string, player?: PlayerState): void {
    const skill = SKILL_MAP[skillId];
    if (!skill) return;
    let cd = skill.cooldown;
    if (player) {
      if (skill.element === ElementType.FIRE) {
        cd *= 1 - PassiveSystem.getFireSkillCdReductionPct(player.equipment) / 100;
      }
      cd *= 1 + PassiveSystem.getUnboundSkillDmgCdPct(player.equipment).cdPct / 100;
    }
    cooldowns[skillId] = Math.max(0, cd);
  }

  static tickCooldowns(cooldowns: Record<string, number>, delta: number): void {
    for (const id of Object.keys(cooldowns)) {
      cooldowns[id] = Math.max(0, cooldowns[id] - delta);
    }
  }
}
