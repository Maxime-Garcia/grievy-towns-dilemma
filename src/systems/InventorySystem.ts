import { PlayerState, Item, ItemType, ItemRarity, Weapon, Armor, Accessory, Consumable, Equipment, InventorySlot } from '../types';
import { LootSystem } from './LootSystem';
import { StatsSystem } from './StatsSystem';
import { ALL_ITEMS } from '../data/items';

// ── Inventory display grouping (bag UI only — never touches equip/sell logic) ──

/** Broader browsing categories than ItemType: armor pieces (HELM..CAPE) are merged
 *  into one bucket so the bag stays scannable once loot rolls (Dofus-style random
 *  substats) start multiplying the number of distinct item instances. */
export type InventoryCategory =
  | 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'CONSUMABLE' | 'MATERIAL' | 'KEY_ITEM' | 'SKIN';

/** Fixed display order for bag categories — weapons first, key items/skins last
 *  (least frequently acted upon while browsing). */
export const INVENTORY_CATEGORY_ORDER: InventoryCategory[] = [
  'WEAPON', 'ARMOR', 'ACCESSORY', 'CONSUMABLE', 'MATERIAL', 'KEY_ITEM', 'SKIN',
];

const CATEGORY_BY_TYPE: Record<ItemType, InventoryCategory> = {
  [ItemType.WEAPON]:     'WEAPON',
  [ItemType.HELM]:       'ARMOR',
  [ItemType.CHEST]:      'ARMOR',
  [ItemType.LEGS]:       'ARMOR',
  [ItemType.BOOTS]:      'ARMOR',
  [ItemType.GLOVES]:     'ARMOR',
  [ItemType.CAPE]:       'ARMOR',
  [ItemType.RING]:       'ACCESSORY',
  [ItemType.AMULET]:     'ACCESSORY',
  [ItemType.CONSUMABLE]: 'CONSUMABLE',
  [ItemType.MATERIAL]:   'MATERIAL',
  [ItemType.KEY_ITEM]:   'KEY_ITEM',
  [ItemType.SKIN]:       'SKIN',
};

/** Ascending commonality (COMMON → HIDDEN) — mirrors the ItemRarity declaration
 *  order and RARITY_DROP_RATES; LootSystem.rarityFromRoll walks the same list
 *  in reverse. Kept as an explicit map (not enum iteration) so a future reorder
 *  of the enum can't silently reorder the bag. */
const RARITY_SORT_INDEX: Record<ItemRarity, number> = {
  [ItemRarity.COMMON]: 0,
  [ItemRarity.UNCOMMON]: 1,
  [ItemRarity.RARE]: 2,
  [ItemRarity.EPIC]: 3,
  [ItemRarity.LEGENDARY]: 4,
  [ItemRarity.MYTHIC]: 5,
  [ItemRarity.HIDDEN]: 6,
};

export interface InventoryGroup {
  category: InventoryCategory;
  slots: InventorySlot[];
}

export class InventorySystem {

  /**
   * Groups+sorts inventory slots for bag display: category first
   * (INVENTORY_CATEGORY_ORDER), then rarity ascending (common → rare) within a
   * category, then item name as a stable tie-break. Pure/read-only — returns new
   * arrays, never mutates `inventory` and never touches equip/sell/use logic.
   * Empty categories are omitted entirely.
   */
  static groupForDisplay(inventory: InventorySlot[]): InventoryGroup[] {
    const buckets = new Map<InventoryCategory, InventorySlot[]>();
    for (const slot of inventory) {
      const category = CATEGORY_BY_TYPE[slot.item.type];
      const bucket = buckets.get(category);
      if (bucket) bucket.push(slot); else buckets.set(category, [slot]);
    }

    return INVENTORY_CATEGORY_ORDER
      .map((category): InventoryGroup => ({ category, slots: buckets.get(category) ?? [] }))
      .filter(g => g.slots.length > 0)
      .map(g => ({
        category: g.category,
        slots: [...g.slots].sort((a, b) => {
          const byRarity = RARITY_SORT_INDEX[a.item.rarity] - RARITY_SORT_INDEX[b.item.rarity];
          return byRarity !== 0 ? byRarity : a.item.name.localeCompare(b.item.name);
        }),
      }));
  }

  static equip(player: PlayerState, itemId: string): boolean {
    const item = ALL_ITEMS[itemId];
    if (!item) return false;

    const slot = this.getEquipSlot(item, player);
    if (!slot) return false;

    // Le nouvel item doit quitter le sac avant d'occuper le slot — sans ça, il
    // restait dupliqué dans l'inventaire à chaque équipement (bug reporté :
    // rééquiper une arme la faisait réapparaître en plus dans le sac).
    const removed = LootSystem.removeFromInventory(player, itemId, 1);
    if (!removed) return false;

    const current = (player.equipment as any)[slot];
    if (current) this.unequip(player, slot);

    (player.equipment as any)[slot] = item;
    this.recalcStats(player);
    return true;
  }

  static unequip(player: PlayerState, slot: keyof Equipment): boolean {
    const item = player.equipment[slot];
    if (!item) return false;

    const added = LootSystem.addToInventory(player, item as Item, 1);
    if (!added) return false;

    (player.equipment as any)[slot] = undefined;
    this.recalcStats(player);
    return true;
  }

  static useConsumable(player: PlayerState, itemId: string): boolean {
    const item = ALL_ITEMS[itemId];
    if (!item || item.type !== ItemType.CONSUMABLE) return false;

    const consumable = item as Consumable;
    const removed = LootSystem.removeFromInventory(player, itemId, 1);
    if (!removed) return false;

    const e = consumable.effect;
    if (e.hpRestore)    player.stats.hp   = Math.min(player.stats.maxHp,   player.stats.hp   + e.hpRestore);
    if (e.manaRestore)  player.stats.mana = Math.min(player.stats.maxMana, player.stats.mana + e.manaRestore);
    if (e.hpPercent)    player.stats.hp   = Math.min(player.stats.maxHp,   Math.floor(player.stats.maxHp   * e.hpPercent));
    if (e.manaPercent)  player.stats.mana = Math.min(player.stats.maxMana, Math.floor(player.stats.maxMana * e.manaPercent));
    if (e.statusCure)   { /* clear status effects — handled by CombatSystem */ }

    return true;
  }

  static sell(player: PlayerState, itemId: string, quantity: number): number {
    const item = ALL_ITEMS[itemId];
    if (!item) return 0;
    if (item.type === ItemType.KEY_ITEM) return 0;

    const removed = LootSystem.removeFromInventory(player, itemId, quantity);
    if (!removed) return 0;

    const gold = item.value * quantity;
    player.gold += gold;
    return gold;
  }

  static buy(player: PlayerState, itemId: string, quantity: number): boolean {
    const item = ALL_ITEMS[itemId];
    if (!item) return false;

    const cost = item.value * quantity;
    if (player.gold < cost) return false;

    const added = LootSystem.addToInventory(player, item, quantity);
    if (!added) return false;

    player.gold -= cost;
    return true;
  }

  private static getEquipSlot(item: Item, player: PlayerState): keyof Equipment | null {
    switch (item.type) {
      case ItemType.WEAPON:  return 'weapon';
      case ItemType.HELM:    return 'helm';
      case ItemType.CHEST:   return 'chest';
      case ItemType.LEGS:    return 'legs';
      case ItemType.BOOTS:   return 'boots';
      case ItemType.GLOVES:  return 'gloves';
      case ItemType.CAPE:    return 'cape';
      case ItemType.AMULET:  return 'amulet';
      case ItemType.RING:
        if (!player.equipment.ring1) return 'ring1';
        if (!player.equipment.ring2) return 'ring2';
        return 'ring1';
      default: return null;
    }
  }

  /**
   * Recomputes derived stats (atk/def/spd/magicAtk/magicDef/maxHp/maxMana) from
   * scratch via StatsSystem.computeAll() — the ONLY complete aggregator (base
   * stats + legacy bonusStats + the newer equipStats mainStat/substats). This
   * used to call ProgressionSystem.applyEquipmentBonuses(), which only knew
   * about legacy bonusStats and silently ignored equipStats entirely — meaning
   * an item's mainStat/substats (ATK_FLAT, CRIT_RATE, etc.) never actually
   * reached player.stats, no matter what the item's tooltip promised.
   * Public so ProgressionSystem can re-apply gear bonuses after a level-up
   * recomputes base stats (see ProgressionSystem.addXp).
   */
  static recalcStats(player: PlayerState): void {
    const cs = StatsSystem.computeAll(player);
    player.stats.maxHp    = cs.hp;
    player.stats.maxMana  = cs.mana;
    player.stats.atk      = cs.atk;
    player.stats.def      = cs.def;
    player.stats.spd      = cs.spd;
    player.stats.magicAtk = cs.matk;
    player.stats.magicDef = cs.magicDef;
    player.stats.hp   = Math.min(player.stats.hp,   player.stats.maxHp);
    player.stats.mana = Math.min(player.stats.mana, player.stats.maxMana);
  }
}

