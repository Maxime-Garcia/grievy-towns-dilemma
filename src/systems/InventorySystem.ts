import { PlayerState, Item, ItemType, ItemRarity, Weapon, Armor, Accessory, Consumable, ConsumableEffect, Equipment, InventorySlot, RunState, RunBagSlot } from '../types';
import { LootSystem } from './LootSystem';
import { StatsSystem } from './StatsSystem';
import { PassiveSystem } from './PassiveSystem';
import { TalentModifiers } from './TalentSystem';
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

  static equip(player: PlayerState, item: Item): boolean {
    // BLOCKER (loot stat rolls, risque n°1 de docs/design/LOOT_STAT_ROLLS.md) :
    // l'appelant transmet désormais l'INSTANCE réelle du slot cliqué, jamais un
    // itemId seul — deux instances non-stackables du même item peuvent porter
    // des rolls différents, et un lookup par id ne peut jamais distinguer LA
    // bonne des deux (cf. LootSystem.removeFromInventory). On résout donc le
    // slot par IDENTITÉ (===) pour équiper/retirer précisément CET objet.
    const slotIndex = player.inventory.findIndex(s => s.item === item);
    if (slotIndex === -1) return false;

    const slot = this.getEquipSlot(item, player);
    if (!slot) return false;

    // Le nouvel item doit quitter le sac avant d'occuper le slot — sans ça, il
    // restait dupliqué dans l'inventaire à chaque équipement (bug reporté :
    // rééquiper une arme la faisait réapparaître en plus dans le sac).
    // removeFromInventory retrouve CE MÊME slot par identité (instance passée
    // explicitement) plutôt que par id.
    const removed = LootSystem.removeFromInventory(player, item.id, 1, item);
    if (!removed) return false;

    // BUG (perte d'item) : le retour d'unequip était ignoré. Quand le sac est plein,
    // addToInventory refuse, unequip échoue… mais le slot était quand même écrasé —
    // l'ancien équipement disparaissait purement et simplement. C'est ce que déclenche
    // la touche debug G, qui remplit le sac au-delà du cap de 60.
    // Un swap est NEUTRE en taille de sac (le nouvel item vient d'en être retiré
    // ci-dessus), donc le retour de l'ancien est autorisé même au-delà du cap.
    const current = (player.equipment as any)[slot];
    if (current) {
      const swappedOut = this.unequip(player, slot, true);
      if (!swappedOut) {
        // Impossible de rendre l'ancien équipement : on annule tout plutôt que de
        // le détruire — le nouvel item retourne dans le sac, l'équipement est inchangé.
        LootSystem.addToInventory(player, item, 1, undefined, true);
        return false;
      }
    }

    (player.equipment as any)[slot] = item;
    this.recalcStats(player);
    return true;
  }

  /**
   * @param ignoreCap true uniquement depuis equip() (swap net-neutre, cf. ci-dessus).
   *   Un déséquipement « sec » reste soumis au cap : refuser est correct là, puisqu'il
   *   fait bel et bien grossir le sac d'un item.
   */
  static unequip(player: PlayerState, slot: keyof Equipment, ignoreCap = false): boolean {
    const item = player.equipment[slot];
    if (!item) return false;

    const added = LootSystem.addToInventory(player, item as Item, 1, undefined, ignoreCap);
    if (!added) return false;

    (player.equipment as any)[slot] = undefined;
    this.recalcStats(player);
    return true;
  }

  /**
   * Équipe directement un objet trouvé EN RUN (RunSystem, `RunBagScene` mode
   * 'view'/'extract') — jamais via la banque. L'ancien équipement revient dans
   * le MÊME emplacement du sac de run (jamais vers `player.inventory`, jamais
   * perdu) : un swap net-neutre en taille de sac, pas de cas "sac plein" possible
   * puisque l'index libéré est celui qu'on vient de vider.
   *
   * Choix de design assumé : équiper depuis le sac de run RETIRE l'objet du sac
   * (donc de la perte à la mort/l'exfiltration partielle) — l'équiper, c'est le
   * garder à coup sûr, contrairement à le laisser dans un slot ordinaire. C'est
   * un vrai arbitrage stratégique du roguelite, pas un bug.
   */
  static equipFromRunBag(player: PlayerState, run: RunState, kind: 'safe' | 'ordinary', index: number): boolean {
    const bag = kind === 'safe' ? run.safeBag : run.ordinaryBag;
    const slot = bag[index];
    if (!slot) return false;

    const equipSlot = this.getEquipSlot(slot.item, player);
    if (!equipSlot) return false;

    const current = (player.equipment as any)[equipSlot] as Item | undefined;
    bag[index] = current ? ({ item: current, quantity: 1 } as RunBagSlot) : null;
    (player.equipment as any)[equipSlot] = slot.item;
    this.recalcStats(player);
    return true;
  }

  /**
   * Applique hpRestore/manaRestore/hpPercent/manaPercent d'un consommable — PAS
   * buffStat/revive/statusCure (non câblés nulle part dans le jeu, cf. mémoire
   * projet `project_consumable_use_gap`). Ne touche jamais l'inventaire : réutilisé
   * par useConsumable (banque, retire via LootSystem) et RunBagScene.consumeItem
   * (sac de run, retire son propre slot) — chacun gère son propre conteneur.
   *
   * hpPercent/manaPercent sont ADDITIFS comme hpRestore/manaRestore — un bug fixé
   * ici les traitait comme un SET absolu (`hp = maxHp * pct`), donc un élixir
   * "+20%" bu à 90% HP faisait TOMBER le joueur à 20% au lieu de le monter à
   * 100%. Passe par PassiveSystem.applyHeal (comme tout autre soin du jeu) pour
   * la conversion overheal→bouclier et le bonus HEALING_RECEIVED_PCT.
   */
  static applyConsumableEffect(player: PlayerState, effect: ConsumableEffect, mods?: TalentModifiers): boolean {
    let applied = false;
    if (effect.hpRestore) { PassiveSystem.applyHeal(player, effect.hpRestore, mods); applied = true; }
    if (effect.hpPercent) { PassiveSystem.applyHeal(player, Math.round(player.stats.maxHp * effect.hpPercent), mods); applied = true; }
    if (effect.manaRestore) {
      player.stats.mana = Math.min(player.stats.maxMana, player.stats.mana + effect.manaRestore);
      applied = true;
    }
    if (effect.manaPercent) {
      player.stats.mana = Math.min(player.stats.maxMana, player.stats.mana + Math.round(player.stats.maxMana * effect.manaPercent));
      applied = true;
    }
    if (effect.statusCure) { /* clear status effects — handled by CombatSystem */ }
    return applied;
  }

  static useConsumable(player: PlayerState, item: Item, mods?: TalentModifiers): boolean {
    if (item.type !== ItemType.CONSUMABLE) return false;

    const consumable = item as Consumable;
    // Consommables jamais rollés (docs/design/LOOT_STAT_ROLLS.md §1.3) et
    // toujours stackables — une seule entrée par id possible, donc l'identité
    // n'apporte rien de plus qu'un lookup par id ici, mais on la transmet quand
    // même par cohérence avec equip/sell plutôt que de rouvrir un chemin par id.
    const removed = LootSystem.removeFromInventory(player, item.id, 1, item);
    if (!removed) return false;

    this.applyConsumableEffect(player, consumable.effect, mods);
    return true;
  }

  static sell(player: PlayerState, item: Item, quantity: number): number {
    if (item.type === ItemType.KEY_ITEM) return 0;

    const removed = LootSystem.removeFromInventory(player, item.id, quantity, item);
    if (!removed) return 0;

    const gold = item.value * quantity;
    player.gold += gold;
    return gold;
  }

  // NOTE (loot stat rolls audit) : méthode actuellement sans appelant dans le
  // code (ShopScene.buyItem est le flux d'achat réellement utilisé, et lui
  // roll via StatRollSystem). Si ce chemin est un jour câblé à une UI, il
  // faudra y appeler StatRollSystem.rollItem() comme dans ShopScene.buyItem —
  // sinon les items achetés via cette méthode resteraient non rollés (valeurs
  // centre du catalogue).
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

