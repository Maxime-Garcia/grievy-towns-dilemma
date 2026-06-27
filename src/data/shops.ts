// Shop inventories per NPC — price is the buy price in gold
// (sell price = 40% of item value, handled in ShopScene)

export interface ShopEntry {
  itemId: string;
  price:  number;
  stock?: number; // undefined = unlimited
}

export const SHOP_INVENTORY: Record<string, ShopEntry[]> = {
  // Theron — Blacksmith (Grievy Town)
  theron: [
    { itemId: 'iron_sword',        price: 60   },
    { itemId: 'steel_sword',       price: 180  },
    { itemId: 'iron_shield',       price: 80   },
    { itemId: 'leather_armor',     price: 70   },
    { itemId: 'chainmail',         price: 220  },
    { itemId: 'iron_ore',          price: 25   },
    { itemId: 'coal',              price: 15   },
  ],

  // Mira — Apothecary (Grievy Town)
  mira: [
    { itemId: 'minor_health_potion', price: 20  },
    { itemId: 'health_potion',       price: 55  },
    { itemId: 'minor_mana_potion',   price: 22  },
    { itemId: 'mana_potion',         price: 60  },
    { itemId: 'elixir_of_vitality',  price: 320 },
    { itemId: 'moonpetal_herb',      price: 12  },
  ],

  // Ysolde — Innkeeper (Grievy Town) — sells food/buffs
  ysolde: [
    { itemId: 'minor_health_potion', price: 18  },
    { itemId: 'minor_mana_potion',   price: 20  },
    { itemId: 'bird_feather',        price: 8   },
  ],
};
