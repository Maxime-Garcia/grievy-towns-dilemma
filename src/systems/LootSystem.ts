import { LootEntry, Item, ItemRarity, PlayerState } from '../types';
import { ALL_ITEMS } from '../data/items';
import { RARITY_DROP_RATES } from '../types';

const PITY_EPIC      = 250;
const PITY_LEGENDARY = 500;

export interface LootResult {
  items: { item: Item; quantity: number }[];
  gold: number;
  xp: number;
}

export class LootSystem {
  static rollLoot(
    entries: LootEntry[],
    goldRange: { min: number; max: number },
    baseXp: number,
    enemyLevel: number,
    player: PlayerState
  ): LootResult {
    const items: { item: Item; quantity: number }[] = [];
    const scaledXp = Math.floor(baseXp * (1 + (enemyLevel - player.level) * 0.05));
    const gold = Math.floor(goldRange.min + Math.random() * (goldRange.max - goldRange.min));

    player.killsWithoutEpic++;
    player.killsWithoutLegendary++;
    player.totalKills++;

    let pityEpicForced   = player.killsWithoutEpic     >= PITY_EPIC;
    let pityLegendForced = player.killsWithoutLegendary >= PITY_LEGENDARY;

    for (const entry of entries) {
      const item = ALL_ITEMS[entry.itemId];
      if (!item) continue;

      let roll = Math.random();

      if (pityEpicForced && item.rarity === ItemRarity.EPIC) {
        roll = 0;
        pityEpicForced = false;
        player.killsWithoutEpic = 0;
      }
      if (pityLegendForced && item.rarity === ItemRarity.LEGENDARY) {
        roll = 0;
        pityLegendForced = false;
        player.killsWithoutLegendary = 0;
      }

      if (roll <= entry.dropRate) {
        const qty = Math.floor(entry.minQty + Math.random() * (entry.maxQty - entry.minQty + 1));
        items.push({ item, quantity: qty });

        if ([ItemRarity.EPIC, ItemRarity.LEGENDARY, ItemRarity.MYTHIC, ItemRarity.HIDDEN].includes(item.rarity)) {
          player.killsWithoutEpic = 0;
        }
        if ([ItemRarity.LEGENDARY, ItemRarity.MYTHIC, ItemRarity.HIDDEN].includes(item.rarity)) {
          player.killsWithoutLegendary = 0;
        }
      }
    }

    return { items, gold, xp: Math.max(1, scaledXp) };
  }

  static addToInventory(
    player: PlayerState,
    item: Item,
    quantity: number
  ): boolean {
    if (player.inventory.length >= 60 && !('stackable' in item && (item as any).stackable)) {
      return false;
    }

    const existing = player.inventory.find(s => s.item.id === item.id);
    if (existing && 'stackable' in item && (item as any).stackable) {
      existing.quantity = Math.min(existing.quantity + quantity, (item as any).maxStack ?? 99);
      return true;
    }

    if (player.inventory.length >= 60) return false;
    player.inventory.push({ item, quantity });
    return true;
  }

  static removeFromInventory(
    player: PlayerState,
    itemId: string,
    quantity: number
  ): boolean {
    const slot = player.inventory.find(s => s.item.id === itemId);
    if (!slot || slot.quantity < quantity) return false;

    slot.quantity -= quantity;
    if (slot.quantity <= 0) {
      player.inventory = player.inventory.filter(s => s.item.id !== itemId);
    }
    return true;
  }

  static getInventoryCount(player: PlayerState, itemId: string): number {
    return player.inventory.find(s => s.item.id === itemId)?.quantity ?? 0;
  }

  static rarityFromRoll(roll: number): ItemRarity {
    let cumulative = 0;
    const order = [
      ItemRarity.HIDDEN,
      ItemRarity.MYTHIC,
      ItemRarity.LEGENDARY,
      ItemRarity.EPIC,
      ItemRarity.RARE,
      ItemRarity.UNCOMMON,
      ItemRarity.COMMON,
    ];
    for (const rarity of order) {
      cumulative += RARITY_DROP_RATES[rarity];
      if (roll <= cumulative) return rarity;
    }
    return ItemRarity.COMMON;
  }
}
