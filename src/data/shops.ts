// Shop inventories per NPC — price is the buy price in gold
// (sell price = 40% of item value, handled in ShopScene)
//
// Strategy:
//   1. Hand-curated entries (CURATED_SHOPS) override auto-generated prices.
//   2. For every NPC that has shopItems in npcs.ts but is NOT in CURATED_SHOPS,
//      prices are auto-derived from item.value with a 1.6× markup.
//      This covers every town NPC without maintaining 50+ manual price lists.

import { ALL_ITEMS } from './items';
import { NPCS } from './npcs';

export interface ShopEntry {
  itemId: string;
  price:  number;
  stock?: number; // undefined = unlimited
}

// ── Hand-curated shops (Grievy Town core + any special pricing) ─────────────

const CURATED_SHOPS: Record<string, ShopEntry[]> = {
  // Theron — Blacksmith (Grievy Town)
  theron: [
    { itemId: 'iron_sword',        price: 60   },
    { itemId: 'steel_sword',       price: 180  },
    { itemId: 'iron_helm',         price: 90   },
    { itemId: 'iron_chest',        price: 165  },
    { itemId: 'leather_boots',     price: 30   },
    { itemId: 'leather_chest',     price: 50   },
    { itemId: 'leather_helm',      price: 35   },
    { itemId: 'iron_ore',          price: 25   },
  ],

  // Mira — Apothecary (Grievy Town)
  mira: [
    { itemId: 'minor_health_potion', price: 20  },
    { itemId: 'health_potion',       price: 55  },
    { itemId: 'major_health_potion', price: 130 },
    { itemId: 'minor_mana_potion',   price: 22  },
    { itemId: 'mana_potion',         price: 60  },
    { itemId: 'antidote',            price: 40  },
    { itemId: 'revive_crystal',      price: 700 },
  ],

  // Ysolde — General Store (Grievy Town)
  ysolde: [
    { itemId: 'minor_health_potion', price: 18  },
    { itemId: 'minor_mana_potion',   price: 20  },
    { itemId: 'antidote',            price: 38  },
    { itemId: 'aldrics_bread',       price: 10  },
  ],
};

// ── Auto-generation from NPC.shopItems ──────────────────────────────────────

/** Buy-price markup over item.value. 1.6 = 60% above base value. */
const SHOP_MARKUP = 1.6;

/** Minimum price floor so even value-0 items (e.g. aldrics_bread) cost something. */
const MIN_PRICE = 5;

function autoShopEntries(itemIds: string[]): ShopEntry[] {
  return itemIds
    .map((itemId): ShopEntry | null => {
      const item = ALL_ITEMS[itemId];
      if (!item) return null;
      const price = Math.max(MIN_PRICE, Math.round(item.value * SHOP_MARKUP));
      return { itemId, price };
    })
    .filter((e): e is ShopEntry => e !== null);
}

// Build the full map: curated takes priority, rest auto-generated.
function buildShopInventory(): Record<string, ShopEntry[]> {
  const result: Record<string, ShopEntry[]> = { ...CURATED_SHOPS };

  for (const npc of NPCS) {
    if (!npc.shopItems || npc.shopItems.length === 0) continue;
    if (result[npc.id]) continue; // already curated
    result[npc.id] = autoShopEntries(npc.shopItems);
  }

  return result;
}

export const SHOP_INVENTORY: Record<string, ShopEntry[]> = buildShopInventory();
