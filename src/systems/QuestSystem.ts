import { Quest, QuestStatus, QuestObjective, PlayerState, ElementType, WorldState } from '../types';
import { QUEST_MAP } from '../data/quests';
import { ALL_ITEMS } from '../data/items';
import { LootSystem } from './LootSystem';
import { ProgressionSystem } from './ProgressionSystem';
import { SkillSystem } from './SkillSystem';
import { StatRollSystem } from './StatRollSystem';

export class QuestSystem {

  static getQuest(id: string): Quest | undefined {
    return QUEST_MAP[id] ? JSON.parse(JSON.stringify(QUEST_MAP[id])) : undefined;
  }

  static isUnlocked(quest: Quest, player: PlayerState): boolean {
    const cond = quest.unlockCondition;
    if (!cond) return true;

    if (cond.level && player.level < cond.level) return false;
    if (cond.zoneCleared && !player.clearedZones.includes(cond.zoneCleared)) return false;
    if (cond.zonesCleared && player.clearedZones.length < cond.zonesCleared) return false;
    if (cond.questsCompleted) {
      for (const qId of cond.questsCompleted) {
        if (!player.completedQuests.includes(qId)) return false;
      }
    }
    return true;
  }

  static startQuest(player: PlayerState, questId: string): boolean {
    const quest = QUEST_MAP[questId];
    if (!quest) return false;
    if (player.activeQuests.includes(questId)) return false;
    if (player.completedQuests.includes(questId)) return false;
    if (!this.isUnlocked(quest, player)) return false;

    player.activeQuests.push(questId);
    return true;
  }

  static getActiveQuestData(player: PlayerState): Array<{ quest: Quest; objectives: QuestObjective[] }> {
    return player.activeQuests
      .map(id => {
        const quest = QUEST_MAP[id];
        if (!quest) return null;
        const stored = player.questProgress?.[id] ?? quest.objectives;
        return { quest, objectives: stored };
      })
      .filter(Boolean) as Array<{ quest: Quest; objectives: QuestObjective[] }>;
  }

  static updateObjective(
    player: PlayerState,
    type: QuestObjective['type'],
    targetId: string,
    amount = 1,
    world?: WorldState
  ): string[] {
    const completedQuests: string[] = [];

    for (const questId of player.activeQuests) {
      const quest = QUEST_MAP[questId];
      if (!quest) continue;

      if (!player.questProgress) player.questProgress = {};
      if (!player.questProgress[questId]) {
        player.questProgress[questId] = JSON.parse(JSON.stringify(quest.objectives));
      }

      const objectives: QuestObjective[] = player.questProgress[questId];
      let updated = false;

      for (const obj of objectives) {
        if (obj.completed) continue;
        if (obj.type !== type) continue;
        if (obj.targetId && obj.targetId !== targetId) continue;

        const needed = obj.quantity ?? 1;
        obj.current = Math.min((obj.current ?? 0) + amount, needed);
        if (obj.current >= needed) obj.completed = true;
        updated = true;
      }

      if (updated && objectives.every(o => o.completed)) {
        completedQuests.push(questId);
        this.completeQuest(player, questId, world);
      }
    }

    return completedQuests;
  }

  static completeQuest(player: PlayerState, questId: string, world?: WorldState): boolean {
    const quest = QUEST_MAP[questId];
    if (!quest) return false;

    player.activeQuests   = player.activeQuests.filter(id => id !== questId);
    player.completedQuests.push(questId);

    // Deliver rewards
    const r = quest.rewards;
    if (r.gold)  player.gold += r.gold;
    if (r.xp)    ProgressionSystem.addXp(player, r.xp);
    if (r.items) {
      for (const entry of r.items) {
        const template = ALL_ITEMS[entry.itemId];
        if (!template) continue;
        // Récompense de quête = cadeau narratif, jamais une gifle : qFloor 0.35
        // (docs/design/LOOT_STAT_ROLLS.md §5). Point d'entrée unique identifié :
        // c'est le seul endroit qui distribue r.items, main/side confondues.
        const item = StatRollSystem.rollItem(template, 0.35);
        LootSystem.addToInventory(player, item, entry.quantity, world);
      }
    }
    if (r.skillUnlock) SkillSystem.unlockSkill(player, r.skillUnlock);

    if (quest.followupQuestId) {
      const followup = QUEST_MAP[quest.followupQuestId];
      if (followup && this.isUnlocked(followup, player)) {
        this.startQuest(player, quest.followupQuestId);
      }
    }

    return true;
  }

  static onBossKilled(player: PlayerState, bossId: string, zone: ElementType, world?: WorldState): string[] {
    const completed: string[] = [];

    completed.push(...this.updateObjective(player, 'BOSS', bossId, 1, world));
    player.clearedZones = [...new Set([...player.clearedZones, zone])];

    return completed;
  }

  static onEnemyKilled(player: PlayerState, enemyId: string, world?: WorldState): string[] {
    return this.updateObjective(player, 'KILL', enemyId, 1, world);
  }

  static onItemCollected(player: PlayerState, itemId: string, qty = 1, world?: WorldState): string[] {
    return this.updateObjective(player, 'COLLECT', itemId, qty, world);
  }

  static onZoneEntered(player: PlayerState, zoneId: string, world?: WorldState): string[] {
    return this.updateObjective(player, 'EXPLORE', zoneId, 1, world);
  }

  static onNpcTalked(player: PlayerState, npcId: string, world?: WorldState): string[] {
    return this.updateObjective(player, 'TALK', npcId, 1, world);
  }

  static getAvailableQuests(player: PlayerState): Quest[] {
    return Object.values(QUEST_MAP).filter(q => {
      if (player.activeQuests.includes(q.id)) return false;
      if (player.completedQuests.includes(q.id)) return false;
      if (q.prerequisites?.some(p => !player.completedQuests.includes(p))) return false;
      return this.isUnlocked(q, player);
    });
  }
}
