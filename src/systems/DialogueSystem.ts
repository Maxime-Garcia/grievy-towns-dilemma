import { DialogueTree, DialogueLine, PlayerState, QuestStatus } from '../types';
import { QuestSystem } from './QuestSystem';
import { LootSystem } from './LootSystem';
import { ALL_ITEMS } from '../data/items';

export interface DialogueSession {
  npcId: string;
  tree: DialogueTree;
  currentLineId: string;
  finished: boolean;
}

export class DialogueSystem {

  static start(npcId: string, tree: DialogueTree, player: PlayerState): DialogueSession {
    const session: DialogueSession = {
      npcId,
      tree,
      currentLineId: tree.rootId,
      finished: false,
    };

    QuestSystem.onNpcTalked(player, npcId);
    return session;
  }

  static getCurrentLine(session: DialogueSession, player: PlayerState): DialogueLine | null {
    if (session.finished) return null;

    let line = session.tree.lines[session.currentLineId];
    while (line?.condition && !this.checkCondition(line.condition, player)) {
      if (!line.next) { session.finished = true; return null; }
      line = session.tree.lines[line.next];
    }
    return line ?? null;
  }

  static advance(session: DialogueSession, player: PlayerState, choiceIndex?: number): DialogueLine | null {
    const current = this.getCurrentLine(session, player);
    if (!current) { session.finished = true; return null; }

    this.processTrigger(current.trigger, player);

    if (current.choices && choiceIndex !== undefined) {
      const validChoices = current.choices.filter(c =>
        !c.condition || this.checkCondition(c.condition, player)
      );
      const choice = validChoices[choiceIndex];
      if (!choice) { session.finished = true; return null; }
      session.currentLineId = choice.next;
    } else if (current.next) {
      session.currentLineId = current.next;
    } else {
      session.finished = true;
      return null;
    }

    return this.getCurrentLine(session, player);
  }

  static getFilteredChoices(line: DialogueLine, player: PlayerState): DialogueLine['choices'] {
    if (!line.choices) return undefined;
    return line.choices.filter(c => !c.condition || this.checkCondition(c.condition, player));
  }

  private static checkCondition(cond: NonNullable<DialogueLine['condition']>, player: PlayerState): boolean {
    if (cond.level && player.level < cond.level) return false;
    if (cond.hasItem && LootSystem.getInventoryCount(player, cond.hasItem) < 1) return false;
    if (cond.questStatus) {
      const { id, status } = cond.questStatus;
      if (status === QuestStatus.COMPLETED && !player.completedQuests.includes(id)) return false;
      if (status === QuestStatus.ACTIVE    && !player.activeQuests.includes(id))    return false;
    }
    if (cond.zoneCleared && !player.clearedZones.includes(cond.zoneCleared)) return false;
    if (cond.flag && !player.flags[cond.flag]) return false;
    return true;
  }

  private static processTrigger(
    trigger: DialogueLine['trigger'] | undefined,
    player: PlayerState
  ): void {
    if (!trigger) return;

    if (trigger.startQuest)    QuestSystem.startQuest(player, trigger.startQuest);
    if (trigger.completeQuest) QuestSystem.completeQuest(player, trigger.completeQuest);
    if (trigger.setFlag)       player.flags[trigger.setFlag] = true;
    if (trigger.giveItem) {
      const item = ALL_ITEMS[trigger.giveItem.itemId];
      if (item) LootSystem.addToInventory(player, item, trigger.giveItem.quantity);
    }
  }
}
