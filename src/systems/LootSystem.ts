import { LootEntry, Item, ItemRarity, ItemType, ElementType, PlayerState, Weapon, Armor } from '../types';
import { ALL_ITEMS } from '../data/items';
import { RARITY_DROP_RATES } from '../types';

// Elements that can be assigned randomly at drop (excludes NEUTRAL which is the baseline)
const RANDOM_ELEMENTS: ElementType[] = [
  ElementType.NEUTRAL,
  ElementType.FIRE,
  ElementType.EARTH,
  ElementType.WIND,
  ElementType.WATER,
  ElementType.LIGHTNING,
  ElementType.ICE,
  ElementType.DARK,
];

// Weight table: NEUTRAL is most common, DARK is rare
const ELEMENT_WEIGHTS = [30, 12, 12, 12, 12, 12, 12, 3];

function rollRandomElement(): ElementType {
  const total = ELEMENT_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < ELEMENT_WEIGHTS.length; i++) {
    r -= ELEMENT_WEIGHTS[i];
    if (r <= 0) return RANDOM_ELEMENTS[i];
  }
  return ElementType.NEUTRAL;
}

function applyRandomElement(item: Item): Item {
  if (item.type !== ItemType.WEAPON && item.type !== ItemType.HELM &&
      item.type !== ItemType.CHEST && item.type !== ItemType.LEGS &&
      item.type !== ItemType.BOOTS && item.type !== ItemType.GLOVES &&
      item.type !== ItemType.CAPE) {
    return item;
  }
  const element = rollRandomElement();
  // Shallow clone to avoid mutating the template
  return { ...item, element } as Item;
}

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
        const qty = Math.floor(Math.random() * (entry.maxQty - entry.minQty + 1)) + entry.minQty;
        const droppedItem = applyRandomElement(item);
        items.push({ item: droppedItem, quantity: qty });

        if ([ItemRarity.EPIC, ItemRarity.LEGENDARY, ItemRarity.MYTHIC, ItemRarity.HIDDEN].includes(item.rarity)) {
          player.killsWithoutEpic = 0;
        }
        if ([ItemRarity.LEGENDARY, ItemRarity.MYTHIC, ItemRarity.HIDDEN].includes(item.rarity)) {
          player.killsWithoutLegendary = 0;
        }
      }
    }

    // Reset pity if no eligible item existed in this enemy's loot table
    if (pityEpicForced)   player.killsWithoutEpic      = 0;
    if (pityLegendForced) player.killsWithoutLegendary = 0;

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
