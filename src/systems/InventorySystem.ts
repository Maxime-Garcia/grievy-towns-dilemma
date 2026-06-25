import { PlayerState, Item, ItemType, Weapon, Armor, Accessory, Consumable, Equipment } from '../types';
import { LootSystem } from './LootSystem';
import { ProgressionSystem } from './ProgressionSystem';
import { ALL_ITEMS } from '../data/items';

export class InventorySystem {

  static equip(player: PlayerState, itemId: string): boolean {
    const item = ALL_ITEMS[itemId];
    if (!item) return false;

    const slot = this.getEquipSlot(item, player);
    if (!slot) return false;

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

  private static recalcStats(player: PlayerState): void {
    const base = ProgressionSystem.computeBaseStats(player.level, player.attributes);
    const withGear = ProgressionSystem.applyEquipmentBonuses(base, player.equipment);
    player.stats.maxHp    = withGear.maxHp;
    player.stats.maxMana  = withGear.maxMana;
    player.stats.atk      = withGear.atk;
    player.stats.def      = withGear.def;
    player.stats.spd      = withGear.spd;
    player.stats.magicAtk = withGear.magicAtk;
    player.stats.magicDef = withGear.magicDef;
    player.stats.hp   = Math.min(player.stats.hp,   player.stats.maxHp);
    player.stats.mana = Math.min(player.stats.mana, player.stats.maxMana);
  }
}

