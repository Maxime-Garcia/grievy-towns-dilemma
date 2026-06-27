import { Weapon, Armor, Accessory, Consumable, Material, KeyItem, Skin, ItemRarity, ItemType, WeaponType, ElementType } from '../types';

// ── WEAPONS ────────────────────────────────────────────────────

export const WEAPONS: Weapon[] = [
  // Swords
  { id: 'iron_sword', name: 'Iron Sword', description: 'A basic iron sword. Reliable.', rarity: ItemRarity.COMMON, type: ItemType.WEAPON, icon: 'item_iron_sword', value: 40, weaponType: WeaponType.SWORD, damage: 14, magicDamage: 0, bonusStats: {}, attackSpeed: 1.0 },
  { id: 'steel_sword', name: 'Steel Sword', description: 'A well-forged steel blade.', rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_steel_sword', value: 120, weaponType: WeaponType.SWORD, damage: 22, magicDamage: 0, bonusStats: { str: 1 }, attackSpeed: 1.0 },
  { id: 'storm_sword', name: 'Storm Sword', description: 'A blade that crackles with Volterra lightning.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_storm_sword', value: 380, element: ElementType.LIGHTNING, weaponType: WeaponType.SWORD, damage: 30, magicDamage: 20, bonusStats: { str: 2, agi: 1 }, attackSpeed: 1.1 },
  { id: 'dragonfang_sword', name: 'Dragonfang Sword', description: 'Forged from Pyrath\'s fangs. Burns with every strike.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_dragonfang_sword', value: 1200, element: ElementType.FIRE, weaponType: WeaponType.SWORD, damage: 45, magicDamage: 35, bonusStats: { str: 4, vit: 2 }, attackSpeed: 1.0, lore: 'Pyrath shed fangs only when he chose to. No one knows why he left these ones.' },
  { id: 'velmara_blade', name: 'Velmara Blade', description: 'A blade that shifts between elements with each strike.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_velmara_blade', value: 5000, weaponType: WeaponType.SWORD, damage: 65, magicDamage: 65, bonusStats: { str: 6, int: 6, agi: 4 }, attackSpeed: 1.2, lore: 'No craftsman in Velmara claims to have made this. It was found in Terravast\'s deepest cave, untouched for centuries.' },
  { id: 'echo_blade', name: 'Echo Blade', description: 'A blade that duplicates itself on each hit, striking twice.', rarity: ItemRarity.MYTHIC, type: ItemType.WEAPON, icon: 'item_echo_blade', value: 18000, weaponType: WeaponType.SWORD, damage: 80, magicDamage: 80, bonusStats: { str: 8, int: 8, agi: 6, vit: 4 }, attackSpeed: 1.3, lore: 'Some weapons are made. Some are wished into existence. This one feels like the latter.' },

  // Greatswords
  { id: 'magma_greatsword', name: 'Magma Greatsword', description: 'A massive blade of hardened magma. Slow but devastating.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_magma_greatsword', value: 450, element: ElementType.FIRE, weaponType: WeaponType.GREATSWORD, damage: 55, magicDamage: 18, bonusStats: { str: 3, end: 1 }, attackSpeed: 0.7 },
  { id: 'colossus_greatsword', name: 'Colossus Greatsword', description: 'A greatsword torn from a Ruin Colossus. Weighs as much as a small horse.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_colossus_greatsword', value: 1500, element: ElementType.EARTH, weaponType: WeaponType.GREATSWORD, damage: 80, magicDamage: 10, bonusStats: { str: 6, vit: 3, end: 2 }, attackSpeed: 0.65 },
  { id: 'titan_greatsword', name: 'Titan Greatsword', description: 'From the frozen titans of Glaciem. Pulses with cold.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_titan_greatsword', value: 6000, element: ElementType.ICE, weaponType: WeaponType.GREATSWORD, damage: 110, magicDamage: 50, bonusStats: { str: 8, end: 5, vit: 4 }, attackSpeed: 0.6 },

  // Staffs
  { id: 'fire_staff', name: 'Ember Staff', description: 'A staff that channels fire magic.', rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_fire_staff', value: 150, element: ElementType.FIRE, weaponType: WeaponType.STAFF, damage: 5, magicDamage: 28, bonusStats: { int: 2 }, attackSpeed: 0.85 },
  { id: 'leviathan_staff', name: 'Leviathan Staff', description: 'Carved from a bone of Thalymor\'s ancient form. Soaked in ocean magic.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_leviathan_staff', value: 1800, element: ElementType.WATER, weaponType: WeaponType.STAFF, damage: 8, magicDamage: 80, bonusStats: { int: 7, vit: 3 }, attackSpeed: 0.9, lore: 'Thalymor shed bones like the sea sheds foam. This one washed up on shore four hundred years ago.' },
  { id: 'memory_staff', name: 'Memory Staff', description: 'Each strike makes the target slow as their memory surfaces.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_memory_staff', value: 7000, element: ElementType.ICE, weaponType: WeaponType.STAFF, damage: 10, magicDamage: 110, bonusStats: { int: 10, end: 4 }, attackSpeed: 0.95, lore: 'Crysthea preserved memories. This staff still does.' },
  { id: 'crystal_dragon_fang_staff', name: 'Crystal Fang Staff', description: 'Made from a crystal dragon\'s broken fang. Cold and sharp.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_crystal_staff', value: 2200, element: ElementType.ICE, weaponType: WeaponType.STAFF, damage: 12, magicDamage: 90, bonusStats: { int: 8, agi: 2 }, attackSpeed: 1.0 },
  { id: 'herald_staff', name: 'Herald\'s Conduit', description: 'Designed by Volterra engineers to channel Volkran directly.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_herald_staff', value: 1700, element: ElementType.LIGHTNING, weaponType: WeaponType.STAFF, damage: 6, magicDamage: 85, bonusStats: { int: 7, agi: 3 }, attackSpeed: 0.92 },
  { id: 'malachars_staff', name: "Malachar's Staff", description: 'The staff that cast the Unraveling Curse. It hums with the memory of every elemental power.', rarity: ItemRarity.MYTHIC, type: ItemType.WEAPON, icon: 'item_malachars_staff', value: 25000, element: ElementType.DARK, weaponType: WeaponType.STAFF, damage: 20, magicDamage: 160, bonusStats: { int: 15, end: 5, vit: 5 }, attackSpeed: 1.1, lore: 'Malachar carried this for thirty years. He never put it down. Not once.' },

  // Bows
  { id: 'harpy_bow', name: 'Harpy Bow', description: 'Light as a feather, accurate in wind.', rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_harpy_bow', value: 180, element: ElementType.WIND, weaponType: WeaponType.BOW, damage: 18, magicDamage: 10, bonusStats: { agi: 2 }, attackSpeed: 1.3 },
  { id: 'sky_titan_bow', name: 'Sky Titan Bow', description: 'A bow so large it requires inhuman strength. Fires bolts of compressed air.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_sky_bow', value: 1600, element: ElementType.WIND, weaponType: WeaponType.BOW, damage: 55, magicDamage: 45, bonusStats: { agi: 5, str: 3 }, attackSpeed: 0.8 },
  { id: 'phoenix_bow', name: 'Phoenix Bow', description: 'Made from Sylvael\'s plumes. Arrows ignite on release.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_phoenix_bow', value: 8000, element: ElementType.WIND, weaponType: WeaponType.BOW, damage: 70, magicDamage: 70, bonusStats: { agi: 8, int: 5 }, attackSpeed: 1.1, lore: 'Sylvael never lost a feather accidentally. Every plume was deliberate. What they were meant for, no one knows.' },

  // Daggers
  { id: 'dagger_of_shadow', name: 'Shadow Dagger', description: 'Hard to see coming. Deals extra damage from behind.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_shadow_dagger', value: 500, weaponType: WeaponType.DAGGER, damage: 22, magicDamage: 15, bonusStats: { agi: 3, int: 1 }, attackSpeed: 1.6 },
  { id: 'depth_serpent_fang_dagger', name: 'Depth Fang', description: 'A dagger carved from a depth serpent\'s hollow fang. Drips water.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_depth_fang', value: 600, element: ElementType.WATER, weaponType: WeaponType.DAGGER, damage: 20, magicDamage: 22, bonusStats: { agi: 3, int: 2 }, attackSpeed: 1.5 },
  { id: 'malachar_blade', name: 'Malachar\'s Penknife', description: 'His personal blade. Nothing ornate — just functional. Like the man himself.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_malachar_blade', value: 2000, element: ElementType.DARK, weaponType: WeaponType.DAGGER, damage: 38, magicDamage: 40, bonusStats: { agi: 5, int: 4 }, attackSpeed: 1.8 },

  // Boss/zone weapons
  { id: 'gorvun_hammer', name: "Gorvun's Shard Hammer", description: 'A fragment of Gorvun shaped into a weapon.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_gorvun_hammer', value: 9000, element: ElementType.EARTH, weaponType: WeaponType.GREATSWORD, damage: 100, magicDamage: 30, bonusStats: { str: 9, end: 5, vit: 3 }, attackSpeed: 0.55 },
  { id: 'volkran_hammer', name: "Volkran's Core", description: 'The core of Volkran\'s body, shaped into a weapon. Constantly discharging.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_volkran_hammer', value: 9500, element: ElementType.LIGHTNING, weaponType: WeaponType.GREATSWORD, damage: 85, magicDamage: 85, bonusStats: { str: 7, int: 7, agi: 3 }, attackSpeed: 0.75 },
  { id: 'sentinel_sword', name: 'Sentinel Blade', description: 'Dark and heavy. Made by Malachar\'s most devoted construct.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_sentinel_sword', value: 2500, element: ElementType.DARK, weaponType: WeaponType.SWORD, damage: 55, magicDamage: 50, bonusStats: { str: 5, int: 4, end: 2 }, attackSpeed: 0.95 },
  { id: 'drowned_knight_sword', name: 'Drowned Knight Sword', description: 'Blade recovered from a knight lost to Abyssmar\'s depths.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_drowned_sword', value: 380, element: ElementType.WATER, weaponType: WeaponType.SWORD, damage: 28, magicDamage: 0, bonusStats: { str: 2, end: 1 }, attackSpeed: 1.0 },
];

// ── ARMOR ──────────────────────────────────────────────────────

export const ARMORS: Armor[] = [
  // Helms
  { id: 'leather_helm', name: 'Leather Helm', description: 'Basic head protection.', rarity: ItemRarity.COMMON, type: ItemType.HELM, icon: 'item_leather_helm', value: 25, defense: 5, magicDefense: 2, bonusStats: {} },
  { id: 'iron_helm', name: 'Iron Helm', description: 'Standard iron helmet.', rarity: ItemRarity.UNCOMMON, type: ItemType.HELM, icon: 'item_iron_helm', value: 80, defense: 12, magicDefense: 4, bonusStats: { end: 1 } },
  { id: 'titan_helm', name: 'Magma Titan Helm', description: 'Carved from a Magma Titan\'s skull. Extremely hot to wear.', rarity: ItemRarity.RARE, type: ItemType.HELM, icon: 'item_titan_helm', value: 400, element: ElementType.FIRE, defense: 22, magicDefense: 8, bonusStats: { end: 2, vit: 1 } },

  // Chests
  { id: 'leather_chest', name: 'Leather Chest', description: 'Basic chest protection.', rarity: ItemRarity.COMMON, type: ItemType.CHEST, icon: 'item_leather_chest', value: 35, defense: 8, magicDefense: 3, bonusStats: {} },
  { id: 'iron_chest', name: 'Iron Chest', description: 'Standard iron chestplate.', rarity: ItemRarity.UNCOMMON, type: ItemType.CHEST, icon: 'item_iron_chest', value: 110, defense: 20, magicDefense: 6, bonusStats: { end: 1 } },
  { id: 'fire_chest', name: 'Ignis Chest', description: 'Forged from Ignis Reach obsidian. Resists fire.', rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_fire_chest', value: 500, element: ElementType.FIRE, defense: 32, magicDefense: 14, bonusStats: { end: 2, vit: 2 } },
  { id: 'crystal_chest', name: 'Crystal Chest', description: 'Terravast crystal chest. Extremely hard.', rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_crystal_chest', value: 550, element: ElementType.EARTH, defense: 38, magicDefense: 10, bonusStats: { end: 3, str: 1 } },
  { id: 'coral_chest', name: 'Coral Chest', description: 'Abyssmar coral plate. Light and resistant to water magic.', rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_coral_chest', value: 520, element: ElementType.WATER, defense: 28, magicDefense: 20, bonusStats: { end: 2, int: 2 } },
  { id: 'pyrath_armor', name: "Pyrath's Scale Chest", description: 'A section of Pyrath\'s divine scales. No forge made this — it was born.', rarity: ItemRarity.LEGENDARY, type: ItemType.CHEST, icon: 'item_pyrath_armor', value: 8000, element: ElementType.FIRE, defense: 65, magicDefense: 35, bonusStats: { end: 7, vit: 5, str: 3 } },
  { id: 'titan_earth_armor', name: "Gorvun's Fragment Chest", description: 'A piece of Gorvun\'s surface, shaped into armor. Impossibly heavy.', rarity: ItemRarity.LEGENDARY, type: ItemType.CHEST, icon: 'item_earth_armor', value: 8500, element: ElementType.EARTH, defense: 80, magicDefense: 25, bonusStats: { end: 8, str: 5, vit: 4 } },
  { id: 'abyssal_chest', name: 'Abyssal Plate', description: 'Forged from the deepest coral and Thalymor\'s scales. Heavy as the ocean floor.', rarity: ItemRarity.LEGENDARY, type: ItemType.CHEST, icon: 'item_abyssal_chest', value: 8200, element: ElementType.WATER, defense: 70, magicDefense: 50, bonusStats: { end: 7, int: 5, vit: 4 } },
  { id: 'storm_plate', name: 'Volkran Storm Plate', description: 'Conducting armor. Discharges electricity on every hit received.', rarity: ItemRarity.LEGENDARY, type: ItemType.CHEST, icon: 'item_storm_plate', value: 8800, element: ElementType.LIGHTNING, defense: 65, magicDefense: 45, bonusStats: { end: 6, agi: 5, int: 4 } },
  { id: 'glaciem_guardian_chest', name: 'Glaciem Chest', description: 'Ice so cold it freezes strikes that land on it.', rarity: ItemRarity.LEGENDARY, type: ItemType.CHEST, icon: 'item_glaciem_chest', value: 9000, element: ElementType.ICE, defense: 75, magicDefense: 55, bonusStats: { end: 8, vit: 5, int: 3 } },
  { id: 'sentinel_armor', name: 'Void Sentinel Plate', description: 'Dark armor that absorbs magical attacks and converts some to mana.', rarity: ItemRarity.EPIC, type: ItemType.CHEST, icon: 'item_sentinel_armor', value: 3000, element: ElementType.DARK, defense: 55, magicDefense: 55, bonusStats: { end: 5, int: 4, vit: 3 } },
  { id: 'permafrost_armor', name: 'Permafrost Armor', description: 'Armor made from titan ice. Sheds cold damaging nearby enemies.', rarity: ItemRarity.EPIC, type: ItemType.CHEST, icon: 'item_permafrost_armor', value: 2800, element: ElementType.ICE, defense: 50, magicDefense: 40, bonusStats: { end: 4, vit: 4, int: 2 } },
  { id: 'storm_herald_plate', name: 'Herald\'s Plate', description: 'Built for maximum conductivity.', rarity: ItemRarity.EPIC, type: ItemType.CHEST, icon: 'item_herald_plate', value: 2600, element: ElementType.LIGHTNING, defense: 45, magicDefense: 45, bonusStats: { end: 4, int: 5, agi: 2 } },
  { id: 'unbound_robe', name: "Malachar's Robe", description: 'The robe of the man who broke the world. Still resonates with all six elements.', rarity: ItemRarity.MYTHIC, type: ItemType.CHEST, icon: 'item_unbound_robe', value: 30000, defense: 50, magicDefense: 100, bonusStats: { int: 15, end: 6, vit: 6 } },
  { id: 'pilgrim_robe', name: 'Pilgrim\'s Robe', description: 'A robe worn by someone who came to Ignis Reach for healing. They did not find it.', rarity: ItemRarity.UNCOMMON, type: ItemType.CHEST, icon: 'item_pilgrim_robe', value: 95, defense: 10, magicDefense: 14, bonusStats: { int: 2, vit: 1 } },
  { id: 'ice_dragon_scale_chest', name: 'Dragon Scale Chest', description: 'Crystal dragon scales layered into armor. Reflects ice magic.', rarity: ItemRarity.EPIC, type: ItemType.CHEST, icon: 'item_dragon_chest', value: 2900, element: ElementType.ICE, defense: 52, magicDefense: 60, bonusStats: { end: 4, int: 5, vit: 2 } },
  { id: 'runic_armor', name: 'Runic Armor', description: 'Ruin-carved plates from the Terravast deep.', rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_runic_armor', value: 450, element: ElementType.EARTH, defense: 14, magicDefense: 6, bonusStats: { str: 6 } },
  { id: 'seaguard_armor', name: 'Seaguard Armor', description: 'Coral-reinforced breastplate from the drowned garrison.', rarity: ItemRarity.UNCOMMON, type: ItemType.CHEST, icon: 'item_seaguard_armor', value: 220, element: ElementType.WATER, defense: 10, magicDefense: 8, bonusStats: { end: 2 } },
  { id: 'glacial_shield', name: 'Glacial Shield', description: 'A shield formed from Glaciem\'s ancient ice — never melts.', rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_glacial_shield', value: 420, element: ElementType.ICE, defense: 16, magicDefense: 12, bonusStats: { end: 3, vit: 2 } },

  // Boots
  { id: 'leather_boots', name: 'Leather Boots', description: 'Basic foot protection.', rarity: ItemRarity.COMMON, type: ItemType.BOOTS, icon: 'item_leather_boots', value: 20, defense: 3, magicDefense: 1, bonusStats: {} },
  { id: 'serpent_scale_boots', name: 'Serpent Scale Boots', description: 'Light, grippy, and water-resistant.', rarity: ItemRarity.RARE, type: ItemType.BOOTS, icon: 'item_serpent_boots', value: 380, defense: 14, magicDefense: 10, bonusStats: { agi: 3 } },
  { id: 'air_walker_boots', name: 'Air Walker Boots', description: 'Reduce the sound of your footsteps to nothing.', rarity: ItemRarity.EPIC, type: ItemType.BOOTS, icon: 'item_air_boots', value: 1400, element: ElementType.WIND, defense: 18, magicDefense: 16, bonusStats: { agi: 6, spd: 4 } },

  // Gloves
  { id: 'obsidian_gauntlets', name: 'Obsidian Gauntlets', description: 'Heavy gauntlets that crush what they grip.', rarity: ItemRarity.RARE, type: ItemType.GLOVES, icon: 'item_obsidian_gauntlets', value: 420, element: ElementType.FIRE, defense: 18, magicDefense: 5, bonusStats: { str: 3 } },

  // Capes
  { id: 'storm_eagle_feather_cloak', name: 'Storm Eagle Cloak', description: 'Reduces the knockback you receive from wind attacks.', rarity: ItemRarity.RARE, type: ItemType.CAPE, icon: 'item_eagle_cloak', value: 350, element: ElementType.WIND, defense: 10, magicDefense: 12, bonusStats: { agi: 2, end: 1 } },
  { id: 'tempest_cloak', name: 'Tempest Cloak', description: 'Woven from Sylvael\'s storm. You move like wind wears it.', rarity: ItemRarity.LEGENDARY, type: ItemType.CAPE, icon: 'item_tempest_cloak', value: 7500, element: ElementType.WIND, defense: 20, magicDefense: 30, bonusStats: { agi: 8, spd: 5, int: 4 } },
  { id: 'tidal_shell_armor', name: 'Tidal Shell Cape', description: 'The shell of a tide crawler turned into a back shield.', rarity: ItemRarity.RARE, type: ItemType.CAPE, icon: 'item_tidal_cape', value: 340, element: ElementType.WATER, defense: 16, magicDefense: 14, bonusStats: { end: 2, vit: 1 } },
];

// ── ACCESSORIES ────────────────────────────────────────────────

export const ACCESSORIES: Accessory[] = [
  // Rings
  { id: 'flame_ring', name: 'Ring of Embers', description: 'Fire damage +5%.', rarity: ItemRarity.UNCOMMON, type: ItemType.RING, icon: 'item_flame_ring', value: 200, element: ElementType.FIRE, bonusStats: { int: 2, magicAtk: 3 } },
  { id: 'sailor_ghost_ring', name: 'Ring of the Lost Sailor', description: 'Worn by a sailor who drowned in Abyssmar.', rarity: ItemRarity.RARE, type: ItemType.RING, icon: 'item_sailor_ring', value: 500, element: ElementType.WATER, bonusStats: { int: 3, vit: 2 }, passiveEffect: 'Breathing underwater lasts 50% longer.' },
  { id: 'revenant_ring', name: 'Chain Revenant Ring', description: 'You feel bound to it.', rarity: ItemRarity.RARE, type: ItemType.RING, icon: 'item_revenant_ring', value: 480, element: ElementType.LIGHTNING, bonusStats: { int: 4, agi: 2 } },
  { id: 'eternal_flame_ring', name: 'Ring of Eternal Flame', description: 'The flame never goes out. Neither do you.', rarity: ItemRarity.EPIC, type: ItemType.RING, icon: 'item_eternal_ring', value: 2000, element: ElementType.FIRE, bonusStats: { int: 5, vit: 4, magicAtk: 8 }, passiveEffect: 'Fire skills cooldown reduced by 15%.' },
  { id: 'ring_of_the_wind', name: 'Ring of the Wind', description: 'From Sylvael\'s domain. You feel lighter.', rarity: ItemRarity.EPIC, type: ItemType.RING, icon: 'item_wind_ring', value: 2200, element: ElementType.WIND, bonusStats: { agi: 6, spd: 4 }, passiveEffect: 'Dash distance +20%.' },
  { id: 'tidal_ring', name: 'Tidal Ring', description: 'Pulses like a tide.', rarity: ItemRarity.EPIC, type: ItemType.RING, icon: 'item_tidal_ring', value: 2400, element: ElementType.WATER, bonusStats: { int: 5, vit: 4 }, passiveEffect: 'Healing skills +20% effectiveness.' },
  { id: 'eye_of_the_storm_ring', name: 'Eye of the Storm', description: 'You are the calm center. Everything else moves around you.', rarity: ItemRarity.LEGENDARY, type: ItemType.RING, icon: 'item_storm_ring', value: 7000, element: ElementType.LIGHTNING, bonusStats: { int: 8, agi: 6, str: 4 }, passiveEffect: 'Lightning skills deal 20% more damage to stunned targets.' },
  { id: 'ring_of_preservation', name: 'Ring of Preservation', description: 'Crysthea\'s nature, concentrated.', rarity: ItemRarity.LEGENDARY, type: ItemType.RING, icon: 'item_preservation_ring', value: 7500, element: ElementType.ICE, bonusStats: { end: 8, vit: 6, int: 4 }, passiveEffect: 'When HP drops below 20%, gain a shield equal to 30% max HP. 120s cooldown.' },
  { id: 'ring_of_the_unbound', name: 'Ring of the Unbound', description: 'Malachar\'s ring. He wore this when he cast the Unraveling Curse.', rarity: ItemRarity.MYTHIC, type: ItemType.RING, icon: 'item_unbound_ring', value: 20000, element: ElementType.DARK, bonusStats: { int: 12, str: 6, agi: 6, end: 5 }, passiveEffect: 'All skill damage +15%. All skill cooldowns +10%.' },
  { id: 'shadow_ring', name: 'Shadow Ring', description: 'Cold to the touch. Has always been cold.', rarity: ItemRarity.RARE, type: ItemType.RING, icon: 'item_shadow_ring', value: 420, element: ElementType.DARK, bonusStats: { agi: 3, int: 3 } },
  { id: 'wraith_amulet', name: 'Wraith Band', description: 'Worn by the revenant who haunted the caves in life.', rarity: ItemRarity.RARE, type: ItemType.RING, icon: 'item_wraith_band', value: 460, bonusStats: { int: 4, agi: 2 } },

  // Amulets
  { id: 'wraith_ice_amulet', name: 'Blizzard Wraith Amulet', description: 'The cold of Glaciem in condensed form.', rarity: ItemRarity.RARE, type: ItemType.AMULET, icon: 'item_blizzard_amulet', value: 500, element: ElementType.ICE, bonusStats: { int: 4, end: 2 } },
  { id: 'frozen_heart_amulet', name: 'Frozen Heart', description: 'A crystal dragon\'s heart, preserved in ice. Still beating.', rarity: ItemRarity.EPIC, type: ItemType.AMULET, icon: 'item_frozen_heart', value: 2600, element: ElementType.ICE, bonusStats: { int: 6, vit: 5, end: 3 }, passiveEffect: 'Ice skills slow amount +15%.' },
  { id: 'thunder_drake_fang', name: 'Drake Fang Pendant', description: 'A thunder drake\'s broken fang on a cord.', rarity: ItemRarity.UNCOMMON, type: ItemType.AMULET, icon: 'item_drake_fang', value: 170, element: ElementType.LIGHTNING, bonusStats: { str: 2, int: 1 } },
];

// ── CONSUMABLES ────────────────────────────────────────────────

export const CONSUMABLES: Consumable[] = [
  { id: 'minor_health_potion', name: 'Minor Health Potion', description: 'Restores 80 HP.', rarity: ItemRarity.COMMON, type: ItemType.CONSUMABLE, icon: 'item_hp_minor', value: 15, effect: { hpRestore: 80 }, stackable: true, maxStack: 20 },
  { id: 'health_potion', name: 'Health Potion', description: 'Restores 250 HP.', rarity: ItemRarity.COMMON, type: ItemType.CONSUMABLE, icon: 'item_hp_normal', value: 40, effect: { hpRestore: 250 }, stackable: true, maxStack: 20 },
  { id: 'major_health_potion', name: 'Major Health Potion', description: 'Restores 600 HP.', rarity: ItemRarity.UNCOMMON, type: ItemType.CONSUMABLE, icon: 'item_hp_major', value: 90, effect: { hpRestore: 600 }, stackable: true, maxStack: 10 },
  { id: 'elixir_of_vitality', name: 'Elixir of Vitality', description: 'Restores 100% HP and grants a brief regeneration effect.', rarity: ItemRarity.RARE, type: ItemType.CONSUMABLE, icon: 'item_elixir_hp', value: 250, effect: { hpPercent: 1.0, buffStat: 'hp', buffAmount: 5, buffDuration: 30 }, stackable: true, maxStack: 5 },
  { id: 'minor_mana_potion', name: 'Minor Mana Potion', description: 'Restores 50 Mana.', rarity: ItemRarity.COMMON, type: ItemType.CONSUMABLE, icon: 'item_mp_minor', value: 18, effect: { manaRestore: 50 }, stackable: true, maxStack: 20 },
  { id: 'mana_potion', name: 'Mana Potion', description: 'Restores 150 Mana.', rarity: ItemRarity.COMMON, type: ItemType.CONSUMABLE, icon: 'item_mp_normal', value: 45, effect: { manaRestore: 150 }, stackable: true, maxStack: 20 },
  { id: 'major_mana_potion', name: 'Major Mana Potion', description: 'Restores 400 Mana.', rarity: ItemRarity.UNCOMMON, type: ItemType.CONSUMABLE, icon: 'item_mp_major', value: 100, effect: { manaRestore: 400 }, stackable: true, maxStack: 10 },
  { id: 'elixir_of_arcana', name: 'Elixir of Arcana', description: 'Restores 100% Mana and reduces all cooldowns by 50%.', rarity: ItemRarity.RARE, type: ItemType.CONSUMABLE, icon: 'item_elixir_mp', value: 280, effect: { manaPercent: 1.0 }, stackable: true, maxStack: 5 },
  { id: 'full_elixir', name: 'Full Elixir', description: 'Restores all HP and Mana.', rarity: ItemRarity.EPIC, type: ItemType.CONSUMABLE, icon: 'item_full_elixir', value: 800, effect: { hpPercent: 1.0, manaPercent: 1.0 }, stackable: true, maxStack: 3 },
  { id: 'revive_crystal', name: 'Revive Crystal', description: 'Automatically revives you with 50% HP upon death. Consumed on use.', rarity: ItemRarity.RARE, type: ItemType.CONSUMABLE, icon: 'item_revive', value: 500, effect: { revive: true, hpPercent: 0.5 }, stackable: true, maxStack: 3 },
  { id: 'antidote', name: 'Antidote', description: 'Cures all status effects.', rarity: ItemRarity.COMMON, type: ItemType.CONSUMABLE, icon: 'item_antidote', value: 30, effect: { statusCure: true }, stackable: true, maxStack: 20 },
  { id: 'aldrics_bread', name: "Aldric's Bread", description: 'Aldric baked this. It tastes like home. Restores 120 HP.', rarity: ItemRarity.UNCOMMON, type: ItemType.CONSUMABLE, icon: 'item_bread', value: 0, effect: { hpRestore: 120, buffStat: 'vit', buffAmount: 3, buffDuration: 120 }, stackable: true, maxStack: 5 },
];

// ── MATERIALS ──────────────────────────────────────────────────

export const MATERIALS: Material[] = [
  // Fire
  { id: 'ember_core', name: 'Ember Core', description: 'The solidified core of an ember creature. Warm to the touch.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_ember_core', value: 12, zone: ElementType.FIRE, stackable: true, maxStack: 99 },
  { id: 'obsidian_shard', name: 'Obsidian Shard', description: 'Sharp volcanic glass. Excellent for crafting.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_obsidian', value: 15, zone: ElementType.FIRE, stackable: true, maxStack: 99 },
  { id: 'volcanic_ash', name: 'Volcanic Ash', description: 'Fine ash from Ignis Reach\'s eruptions. Alchemists prize it.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_volcanic_ash', value: 8, zone: ElementType.FIRE, stackable: true, maxStack: 99 },
  { id: 'pyrath_scale', name: "Pyrath's Scale", description: 'A divine dragon scale. Nearly indestructible.', rarity: ItemRarity.LEGENDARY, type: ItemType.MATERIAL, icon: 'item_pyrath_scale', value: 3000, zone: ElementType.FIRE, stackable: true, maxStack: 5 },

  // Earth
  { id: 'terravast_crystal', name: 'Terravast Crystal', description: 'Bioluminescent crystal from Terravast\'s caves.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_terravast_crystal', value: 18, zone: ElementType.EARTH, stackable: true, maxStack: 99 },
  { id: 'ancient_stone_rune', name: 'Ancient Stone Rune', description: 'A rune carved into a stone that survived since the first age.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_stone_rune', value: 45, zone: ElementType.EARTH, stackable: true, maxStack: 50 },
  { id: 'cave_moss', name: 'Cave Moss', description: 'Soft glowing moss that grows in the tunnels.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_cave_moss', value: 6, zone: ElementType.EARTH, stackable: true, maxStack: 99 },
  { id: 'gorvun_fragment', name: "Gorvun's Fragment", description: 'A piece of the earth god, dense as compressed history.', rarity: ItemRarity.LEGENDARY, type: ItemType.MATERIAL, icon: 'item_gorvun_fragment', value: 3200, zone: ElementType.EARTH, stackable: true, maxStack: 5 },
  { id: 'ruin_colossus_core', name: 'Ruin Colossus Core', description: 'The animated stone that drove a colossus. Still faintly warm.', rarity: ItemRarity.RARE, type: ItemType.MATERIAL, icon: 'item_colossus_core', value: 200, zone: ElementType.EARTH, stackable: true, maxStack: 20 },

  // Wind
  { id: 'zephyr_feather', name: 'Zephyr Feather', description: 'A feather so light it moves in still air.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_zephyr_feather', value: 14, zone: ElementType.WIND, stackable: true, maxStack: 99 },
  { id: 'stormstone', name: 'Stormstone', description: 'A stone from the floating islands, perpetually charged.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_stormstone', value: 40, zone: ElementType.WIND, stackable: true, maxStack: 50 },
  { id: 'cloudweave_silk', name: 'Cloudweave Silk', description: 'Silk harvested from cloud temple fabrics. Impossibly fine.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_cloudweave', value: 50, zone: ElementType.WIND, stackable: true, maxStack: 50 },
  { id: 'sylvael_plume', name: "Sylvael's Plume", description: 'A plume from the divine phoenix herself.', rarity: ItemRarity.LEGENDARY, type: ItemType.MATERIAL, icon: 'item_sylvael_plume', value: 3500, zone: ElementType.WIND, stackable: true, maxStack: 5 },

  // Water
  { id: 'deep_coral', name: 'Deep Coral', description: 'Coral from the ocean floor. Harder than steel.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_deep_coral', value: 16, zone: ElementType.WATER, stackable: true, maxStack: 99 },
  { id: 'drowned_relic', name: 'Drowned Relic', description: 'An artifact preserved in the flooded ruins.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_drowned_relic', value: 55, zone: ElementType.WATER, stackable: true, maxStack: 50 },
  { id: 'sea_glass', name: 'Sea Glass', description: 'Tumbled glass from the ruins. Smooth and translucent.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_sea_glass', value: 10, zone: ElementType.WATER, stackable: true, maxStack: 99 },
  { id: 'thalymor_scale', name: "Thalymor's Scale", description: 'From the leviathan\'s body. Still dripping.', rarity: ItemRarity.LEGENDARY, type: ItemType.MATERIAL, icon: 'item_thalymor_scale', value: 3100, zone: ElementType.WATER, stackable: true, maxStack: 5 },

  // Lightning
  { id: 'storm_shard', name: 'Storm Shard', description: 'A crystallized fragment of Volterra\'s perpetual storm.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_storm_shard', value: 14, zone: ElementType.LIGHTNING, stackable: true, maxStack: 99 },
  { id: 'charged_metal', name: 'Charged Metal', description: 'Metal from Volterra\'s broken machines. Still conducting.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_charged_metal', value: 20, zone: ElementType.LIGHTNING, stackable: true, maxStack: 99 },
  { id: 'thunder_rune', name: 'Thunder Rune', description: 'An engineer\'s inscription that stores electrical charge.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_thunder_rune', value: 48, zone: ElementType.LIGHTNING, stackable: true, maxStack: 50 },
  { id: 'volkran_coil', name: "Volkran's Coil", description: 'From the storm god himself. Discharges randomly. Handle with care.', rarity: ItemRarity.LEGENDARY, type: ItemType.MATERIAL, icon: 'item_volkran_coil', value: 3400, zone: ElementType.LIGHTNING, stackable: true, maxStack: 5 },
  { id: 'volt_hound_pelt', name: 'Volt Hound Pelt', description: 'Conducting fur that crackles with static.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_volt_pelt', value: 60, zone: ElementType.LIGHTNING, stackable: true, maxStack: 30 },

  // Ice
  { id: 'glaciem_ice_shard', name: 'Glaciem Ice Shard', description: 'Ice from Glaciem that never melts.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_ice_shard', value: 15, zone: ElementType.ICE, stackable: true, maxStack: 99 },
  { id: 'ancient_frost_rune', name: 'Ancient Frost Rune', description: 'A rune from the ice caves, preserved for millennia.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_frost_rune', value: 52, zone: ElementType.ICE, stackable: true, maxStack: 50 },
  { id: 'frozen_essence', name: 'Frozen Essence', description: 'Condensed elemental energy from Glaciem\'s heart.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_frozen_essence', value: 65, zone: ElementType.ICE, stackable: true, maxStack: 50 },
  { id: 'crysthea_splinter', name: "Crysthea's Splinter", description: 'A fragment of the ice goddess herself.', rarity: ItemRarity.LEGENDARY, type: ItemType.MATERIAL, icon: 'item_crysthea_splinter', value: 3600, zone: ElementType.ICE, stackable: true, maxStack: 5 },
  { id: 'frost_wolf_pelt', name: 'Frost Wolf Pelt', description: 'Thick, warm, water-resistant fur.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_wolf_pelt', value: 55, zone: ElementType.ICE, stackable: true, maxStack: 30 },
  { id: 'frost_wolf_pelt_uncommon', name: 'Frost Wolf Fur Trim', description: 'Fine fur trim from a frost wolf.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_wolf_fur', value: 40, zone: ElementType.ICE, stackable: true, maxStack: 30 },

  // Dark
  { id: 'dark_essence', name: 'Dark Essence', description: 'Condensed dark magic. Scholars would pay well for this.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_dark_essence', value: 80, zone: ElementType.DARK, stackable: true, maxStack: 50 },
  { id: 'void_shard', name: 'Void Shard', description: 'A fragment of nothing. It absorbs light.', rarity: ItemRarity.RARE, type: ItemType.MATERIAL, icon: 'item_void_shard', value: 180, zone: ElementType.DARK, stackable: true, maxStack: 30 },
  { id: 'corrupted_rune', name: 'Corrupted Rune', description: 'An elemental rune twisted by dark magic.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_corrupted_rune', value: 70, zone: ElementType.DARK, stackable: true, maxStack: 50 },
  { id: 'construct_core', name: 'Construct Core', description: 'The animated heart of a shadow construct.', rarity: ItemRarity.RARE, type: ItemType.MATERIAL, icon: 'item_construct_core', value: 220, zone: ElementType.DARK, stackable: true, maxStack: 20 },
  { id: 'pyrath_heart', name: "Pyrath's Heart Core", description: 'A fragment of Pyrath\'s divine core. Impossibly rare.', rarity: ItemRarity.MYTHIC, type: ItemType.MATERIAL, icon: 'item_pyrath_heart', value: 15000, zone: ElementType.FIRE, stackable: true, maxStack: 1 },
  { id: 'fragment_of_permanence', name: 'Fragment of Permanence', description: "A shard of Gorvun's divine essence — the earth remembers.", rarity: ItemRarity.EPIC, type: ItemType.MATERIAL, icon: 'item_fragment_permanence', value: 800, zone: ElementType.EARTH, stackable: true, maxStack: 5 },
];

// ── KEY ITEMS ──────────────────────────────────────────────────

export const KEY_ITEMS: KeyItem[] = [
  { id: 'malachars_grimoire', name: "Malachar's Grimoire", description: 'The research notes of thirty years. The complete theory of the Unraveling Curse.', rarity: ItemRarity.HIDDEN, type: ItemType.KEY_ITEM, icon: 'item_grimoire', value: 0, lore: 'The handwriting gets smaller near the end. Either more careful, or more certain.' },
  { id: 'aldrics_letter', name: "Aldric's Letter", description: 'A letter Aldric wrote but never sent. Given to you at the end of his side quest.', rarity: ItemRarity.HIDDEN, type: ItemType.KEY_ITEM, icon: 'item_letter', value: 0, lore: 'Some things get written to be written, not to be read.' },
  { id: 'glaciem_archive_key', name: 'Ice Archive Key', description: 'The key to one of Crysthea\'s ice caves. Heavy and very cold.', rarity: ItemRarity.HIDDEN, type: ItemType.KEY_ITEM, icon: 'item_archive_key', value: 0, questId: 'sq_03_crystal_archivist' },
  { id: 'stone_shield_scroll', name: 'Stone Shield Scroll', description: 'An ancient earth-inscription granting shield knowledge.', rarity: ItemRarity.UNCOMMON, type: ItemType.KEY_ITEM, icon: 'item_stone_scroll', value: 80 },
  { id: 'aldric_medallion', name: "Aldric's Medallion", description: "Aldric's old guild medallion, worn and scratched.", rarity: ItemRarity.COMMON, type: ItemType.KEY_ITEM, icon: 'item_aldric_medallion', value: 0 },
  { id: 'family_photo', name: 'Family Photo', description: 'A faded photograph of a family in Ignis Reach — taken before the eruption.', rarity: ItemRarity.COMMON, type: ItemType.KEY_ITEM, icon: 'item_family_photo', value: 0 },
  // Quest items for new towns
  { id: 'ashford_seal', name: 'Sceau d\'Ashford', description: 'Preuve de passage par le refuge des cendres.', rarity: ItemRarity.COMMON, type: ItemType.KEY_ITEM, icon: 'item_seal', value: 0 },
  { id: 'deepdelve_gem', name: 'Gemme de Deepdelve', description: 'Cristal de la mine profonde. Luit dans le noir.', rarity: ItemRarity.UNCOMMON, type: ItemType.KEY_ITEM, icon: 'item_gem', value: 50 },
  { id: 'saltmourn_tide_map', name: 'Carte des Marées', description: 'Une carte des courants d\'Abyssmar tracée par un vieux marin.', rarity: ItemRarity.COMMON, type: ItemType.KEY_ITEM, icon: 'item_map', value: 0 },
  { id: 'circuit_blueprint', name: 'Schéma du Circuit', description: 'Plans du réseau électrique de Volterra.', rarity: ItemRarity.UNCOMMON, type: ItemType.KEY_ITEM, icon: 'item_blueprint', value: 80 },
  // Items requis par les quêtes existantes (fq_08_childstoy, sq_03_crystal_archivist, sq_07_malachars_notes)
  { id: 'wooden_horse', name: 'Cheval de Bois', description: 'Un jouet sculpté dans du bois de chêne. L\'enfant l\'a perdu dans la vieille grange.', rarity: ItemRarity.COMMON, type: ItemType.KEY_ITEM, icon: 'item_wooden_horse', value: 0 },
  { id: 'ice_archive_tablet', name: 'Tablette d\'Archive Glaciale', description: 'Une plaque de glace gravée par Crysthea. Porte la mémoire d\'un âge révolu.', rarity: ItemRarity.RARE, type: ItemType.KEY_ITEM, icon: 'item_ice_tablet', value: 200, questId: 'sq_03_crystal_archivist' },
  { id: 'research_page_fire', name: 'Page de Recherche — Feu', description: 'Notes de Malachar sur Ignis Reach. L\'écriture est précise et froide.', rarity: ItemRarity.UNCOMMON, type: ItemType.KEY_ITEM, icon: 'item_research_page', value: 0, questId: 'sq_07_malachars_notes' },
  { id: 'research_page_earth', name: 'Page de Recherche — Terre', description: 'Notes de Malachar sur Terravast. Densément annotées.', rarity: ItemRarity.UNCOMMON, type: ItemType.KEY_ITEM, icon: 'item_research_page', value: 0, questId: 'sq_07_malachars_notes' },
  { id: 'research_page_wind', name: 'Page de Recherche — Vent', description: 'Notes de Malachar sur Zephyr Peaks. Certains mots sont raturés.', rarity: ItemRarity.UNCOMMON, type: ItemType.KEY_ITEM, icon: 'item_research_page', value: 0, questId: 'sq_07_malachars_notes' },
  { id: 'research_page', name: 'Page de Recherche', description: 'Fragment des notes de Malachar. L\'écriture change vers la fin.', rarity: ItemRarity.UNCOMMON, type: ItemType.KEY_ITEM, icon: 'item_research_page', value: 0, questId: 'sq_07_malachars_notes' },
  // Lootable zone findings
  { id: 'dark_tome',       name: 'Tome des Ombres',   description: 'Contient des rites que Malachar ne voulait pas qu\'on retrouve.', rarity: ItemRarity.RARE, type: ItemType.KEY_ITEM, icon: 'item_dark_tome',       value: 500 },
  { id: 'malachar_notes',  name: 'Notes de Malachar', description: 'Griffonnages en marge d\'un journal de recherche.',               rarity: ItemRarity.RARE, type: ItemType.KEY_ITEM, icon: 'item_malachar_notes',  value: 500 },
];

// ── HIDDEN ITEMS (uniques, quasi game-breaker) ─────────────────
// Chaque item HIDDEN est unique en son genre avec un passif dévastateur.

export const HIDDEN_WEAPONS: Weapon[] = [
  {
    id: 'hidden_void_reaper',
    name: 'Faucheur du Néant',
    description: 'Chaque coup fatal rend 15% du HP maximum. Soif de néant.',
    rarity: ItemRarity.HIDDEN,
    type: ItemType.WEAPON,
    icon: 'item_void_reaper',
    value: 99999,
    element: ElementType.DARK,
    weaponType: WeaponType.GREATSWORD,
    damage: 120,
    magicDamage: 120,
    bonusStats: { str: 12, int: 12, agi: 8 },
    attackSpeed: 0.9,
    passiveEffect: 'KILL_HEAL_15_PCT',
    lore: 'Ce n\'est pas une arme. C\'est une décision.',
  },
  {
    id: 'hidden_temporal_blade',
    name: 'Lame Temporelle',
    description: 'Les attaques basiques ne consomment aucun temps de recharge. Frappe comme la foudre.',
    rarity: ItemRarity.HIDDEN,
    type: ItemType.WEAPON,
    icon: 'item_temporal_blade',
    value: 99999,
    element: ElementType.LIGHTNING,
    weaponType: WeaponType.SWORD,
    damage: 95,
    magicDamage: 95,
    bonusStats: { agi: 15, str: 10, spd: 8 },
    attackSpeed: 2.0,
    passiveEffect: 'NO_ATTACK_COOLDOWN',
    lore: 'Elle frappe avant que tu aies décidé de frapper.',
  },
  {
    id: 'hidden_world_eater_staff',
    name: 'Bâton du Dévoreur de Mondes',
    description: 'Toutes les compétences actives coûtent 0 mana. Le pouvoir de Malachar sans le prix.',
    rarity: ItemRarity.HIDDEN,
    type: ItemType.WEAPON,
    icon: 'item_world_eater',
    value: 99999,
    element: ElementType.DARK,
    weaponType: WeaponType.STAFF,
    damage: 30,
    magicDamage: 200,
    bonusStats: { int: 20, end: 8, vit: 8 },
    attackSpeed: 1.0,
    passiveEffect: 'ZERO_MANA_COST',
    lore: 'Malachar a passé trente ans à comprendre ce principe. Tu le tiens dans les mains.',
  },
  {
    id: 'hidden_first_blade',
    name: 'Épée Originelle',
    description: 'Le premier coup de chaque combat inflige 500% des dégâts. Une seule chance.',
    rarity: ItemRarity.HIDDEN,
    type: ItemType.WEAPON,
    icon: 'item_first_blade',
    value: 99999,
    weaponType: WeaponType.SWORD,
    damage: 85,
    magicDamage: 85,
    bonusStats: { str: 14, int: 10 },
    attackSpeed: 1.1,
    passiveEffect: 'FIRST_STRIKE_500_PCT',
    lore: 'Il n\'y a pas de deuxième coup. Pas si tu fais bien le premier.',
  },
  {
    id: 'hidden_soul_bow',
    name: 'Arc des Âmes',
    description: 'Chaque ennemi tué ajoute +2% aux dégâts permanents (jusqu\'à +200%). Ne se réinitialise pas.',
    rarity: ItemRarity.HIDDEN,
    type: ItemType.WEAPON,
    icon: 'item_soul_bow',
    value: 99999,
    element: ElementType.DIVINE,
    weaponType: WeaponType.BOW,
    damage: 75,
    magicDamage: 75,
    bonusStats: { agi: 12, int: 8, str: 6 },
    attackSpeed: 1.4,
    passiveEffect: 'KILL_STACK_DAMAGE',
    lore: 'Il se souvient de chaque vie qu\'il a prise. Il les collectionne.',
  },
];

export const HIDDEN_ARMORS: Armor[] = [
  {
    id: 'hidden_undying_plate',
    name: 'Armure de l\'Indestructible',
    description: 'Réduit tous les dégâts reçus de 40%. Les coups fatals ont 30% de chance de vous laisser à 1 HP.',
    rarity: ItemRarity.HIDDEN,
    type: ItemType.CHEST,
    icon: 'item_undying_plate',
    value: 99999,
    defense: 100,
    magicDefense: 100,
    bonusStats: { end: 20, vit: 15 },
    passiveEffect: 'DMG_REDUCTION_40_DEATH_RESIST',
    lore: 'Ceux qui l\'ont portée ne se souviennent pas de leur mort. Parce qu\'elle n\'a jamais eu lieu.',
  },
  {
    id: 'hidden_mirror_helm',
    name: 'Heaume du Miroir',
    description: 'Renvoie 25% des dégâts magiques reçus à l\'attaquant. Reflète aussi les malédictions.',
    rarity: ItemRarity.HIDDEN,
    type: ItemType.HELM,
    icon: 'item_mirror_helm',
    value: 99999,
    defense: 40,
    magicDefense: 80,
    bonusStats: { int: 12, magicDef: 20 },
    passiveEffect: 'MAGIC_REFLECT_25_PCT',
    lore: 'Ce n\'est pas une protection. C\'est une réponse.',
  },
];

export const HIDDEN_ACCESSORIES: Accessory[] = [
  {
    id: 'hidden_eternity_ring',
    name: 'Anneau de l\'Éternité',
    description: 'HP et Mana se régénèrent à 1% par seconde en permanence, même en combat.',
    rarity: ItemRarity.HIDDEN,
    type: ItemType.RING,
    icon: 'item_eternity_ring',
    value: 99999,
    bonusStats: { vit: 15, end: 15, int: 10 },
    passiveEffect: 'PERMANENT_REGEN_1_PCT_PER_SEC',
    lore: 'L\'éternité n\'est pas une durée. C\'est une propriété.',
  },
  {
    id: 'hidden_fate_amulet',
    name: 'Amulette du Destin',
    description: 'Toutes les compétences actives sont disponibles sans délai de recharge au début de chaque combat.',
    rarity: ItemRarity.HIDDEN,
    type: ItemType.AMULET,
    icon: 'item_fate_amulet',
    value: 99999,
    bonusStats: { int: 18, agi: 12 },
    passiveEffect: 'COMBAT_START_ZERO_CD',
    lore: 'Le destin n\'attend pas. Et maintenant, toi non plus.',
  },
];

// ── SKINS (Costumier) ─────────────────────────────────────────

export const SKINS: Skin[] = [
  { id: 'skin_ember_cloak',       name: 'Manteau des Cendres',   description: 'Teinté des cendres d\'Ignis Reach. Lueurs rouges sur tissu noir.', rarity: ItemRarity.RARE,   type: ItemType.SKIN, icon: 'skin_ember_cloak',   value: 400,  targetSlot: ItemType.CAPE,  visualKey: 'vis_ember_cloak',   stackable: false },
  { id: 'skin_crystal_regalia',   name: 'Tenue des Cristaux',    description: 'Éclats de Terravast tissés dans l\'armure. Brille dans l\'obscurité.', rarity: ItemRarity.RARE,   type: ItemType.SKIN, icon: 'skin_crystal_regalia',   value: 450,  targetSlot: ItemType.CHEST, visualKey: 'vis_crystal_regalia', stackable: false },
  { id: 'skin_storm_vestments',   name: 'Habit des Tempêtes',    description: 'La soie des temples flottants. Ondule sans vent.', rarity: ItemRarity.EPIC,   type: ItemType.SKIN, icon: 'skin_storm_vestments',   value: 700,  targetSlot: ItemType.CHEST, visualKey: 'vis_storm_vestments', stackable: false },
  { id: 'skin_abyssal_robe',      name: 'Robe Abyssale',         description: 'La profondeur des océans d\'Abyssmar en une robe.', rarity: ItemRarity.EPIC,   type: ItemType.SKIN, icon: 'skin_abyssal_robe',      value: 750,  targetSlot: ItemType.CHEST, visualKey: 'vis_abyssal_robe',   stackable: false },
  { id: 'skin_frost_shroud',      name: 'Linceul de Givre',      description: 'Fourrure de loup de givre. Craquèle dans le froid.', rarity: ItemRarity.EPIC,   type: ItemType.SKIN, icon: 'skin_frost_shroud',      value: 800,  targetSlot: ItemType.CHEST, visualKey: 'vis_frost_shroud',   stackable: false },
  { id: 'skin_pilgrim_garb',      name: 'Vêtement du Pèlerin',   description: 'Simple et discret. Celui qui voyage léger voyage loin.', rarity: ItemRarity.UNCOMMON, type: ItemType.SKIN, icon: 'skin_pilgrim_garb', value: 150,  targetSlot: ItemType.CHEST, visualKey: 'vis_pilgrim_garb',   stackable: false },
  { id: 'skin_divine_vestments',  name: 'Vêtements Divins',      description: 'Tissé à partir des fils de lumière laissés par les divinités.', rarity: ItemRarity.LEGENDARY, type: ItemType.SKIN, icon: 'skin_divine_vestments', value: 3000, targetSlot: ItemType.CHEST, visualKey: 'vis_divine_vestments', stackable: false },
  { id: 'skin_void_mantle',       name: 'Manteau du Vide',       description: 'Absorbe la lumière. Ne reflète rien.', rarity: ItemRarity.LEGENDARY, type: ItemType.SKIN, icon: 'skin_void_mantle', value: 3500, targetSlot: ItemType.CAPE, visualKey: 'vis_void_mantle', stackable: false },
  { id: 'skin_lightning_coil_helm', name: 'Casque Spire de Foudre', description: 'Réplique des casques des ingénieurs de Volterra.', rarity: ItemRarity.RARE, type: ItemType.SKIN, icon: 'skin_lightning_helm', value: 500, targetSlot: ItemType.HELM, visualKey: 'vis_lightning_helm', stackable: false },
  { id: 'skin_glaciem_crown',     name: 'Couronne de Glaciem',   description: 'La glace de Crysthea taillée en couronne.', rarity: ItemRarity.EPIC, type: ItemType.SKIN, icon: 'skin_glaciem_crown', value: 900, targetSlot: ItemType.HELM, visualKey: 'vis_glaciem_crown', stackable: false },
];

// ── ADDITIONAL WEAPONS (zone-specific, varied elements) ─────────

export const EXTRA_WEAPONS: Weapon[] = [
  // Fire
  { id: 'cinder_dagger', name: 'Dague de Braise', description: 'Rapide et brûlante. Laisse une marque.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_cinder_dagger', value: 420, element: ElementType.FIRE, weaponType: WeaponType.DAGGER, damage: 28, magicDamage: 20, bonusStats: { agi: 4, int: 2 }, attackSpeed: 1.7 },
  { id: 'pyroclast_bow', name: 'Arc Pyroclaste', description: 'Flèches incandescentes qui explosent à l\'impact.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_pyroclast_bow', value: 1900, element: ElementType.FIRE, weaponType: WeaponType.BOW, damage: 60, magicDamage: 50, bonusStats: { agi: 6, int: 4 }, attackSpeed: 1.0 },
  // Earth
  { id: 'stone_dagger', name: 'Dague de Pierre', description: 'Taillée dans le cristal de Terravast. Tranchante.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_stone_dagger', value: 380, element: ElementType.EARTH, weaponType: WeaponType.DAGGER, damage: 30, magicDamage: 12, bonusStats: { str: 3, end: 2 }, attackSpeed: 1.5 },
  { id: 'seismic_staff', name: 'Sceptre Sismique', description: 'Chaque frappe fait trembler le sol.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_seismic_staff', value: 1750, element: ElementType.EARTH, weaponType: WeaponType.STAFF, damage: 10, magicDamage: 88, bonusStats: { int: 7, end: 3 }, attackSpeed: 0.88 },
  // Wind
  { id: 'gale_dagger', name: 'Dague du Vent', description: 'Si légère qu\'elle semble flotter.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_gale_dagger', value: 460, element: ElementType.WIND, weaponType: WeaponType.DAGGER, damage: 20, magicDamage: 25, bonusStats: { agi: 5 }, attackSpeed: 1.8 },
  { id: 'wind_greatsword', name: 'Espadon des Rafales', description: 'Aussi tranchant que le vent lui-même.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_wind_greatsword', value: 490, element: ElementType.WIND, weaponType: WeaponType.GREATSWORD, damage: 65, magicDamage: 22, bonusStats: { str: 4, agi: 3 }, attackSpeed: 0.72 },
  // Water
  { id: 'tide_staff', name: 'Bâton des Marées', description: 'Pulse comme un courant sous-marin.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_tide_staff', value: 410, element: ElementType.WATER, weaponType: WeaponType.STAFF, damage: 6, magicDamage: 68, bonusStats: { int: 5, vit: 3 }, attackSpeed: 0.9 },
  { id: 'coral_sword', name: 'Épée de Corail', description: 'Forgée dans les profondeurs d\'Abyssmar.', rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_coral_sword', value: 200, element: ElementType.WATER, weaponType: WeaponType.SWORD, damage: 26, magicDamage: 14, bonusStats: { end: 2 }, attackSpeed: 1.0 },
  // Lightning
  { id: 'arc_sword', name: 'Épée Arc Électrique', description: 'Inflige un choc à chaque touche.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_arc_sword', value: 440, element: ElementType.LIGHTNING, weaponType: WeaponType.SWORD, damage: 32, magicDamage: 28, bonusStats: { agi: 3, str: 2 }, attackSpeed: 1.15 },
  { id: 'thunder_bow', name: 'Arc du Tonnerre', description: 'Les flèches laissent une traîne de foudre.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_thunder_bow', value: 1850, element: ElementType.LIGHTNING, weaponType: WeaponType.BOW, damage: 52, magicDamage: 55, bonusStats: { agi: 6, int: 4 }, attackSpeed: 1.2 },
  // Ice
  { id: 'frost_dagger', name: 'Dague du Givre', description: 'Gèle les plaies qu\'elle inflige.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_frost_dagger', value: 430, element: ElementType.ICE, weaponType: WeaponType.DAGGER, damage: 22, magicDamage: 26, bonusStats: { agi: 3, int: 3 }, attackSpeed: 1.6 },
  { id: 'blizzard_greatsword', name: 'Espadon des Blizzards', description: 'Laisse derrière lui un sillage de glace.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_blizzard_gs', value: 1650, element: ElementType.ICE, weaponType: WeaponType.GREATSWORD, damage: 90, magicDamage: 40, bonusStats: { str: 7, int: 4, end: 3 }, attackSpeed: 0.62 },
  // Dark
  { id: 'shadow_staff', name: 'Sceptre des Ombres', description: 'Semble absorber la lumière environnante.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_shadow_staff', value: 2100, element: ElementType.DARK, weaponType: WeaponType.STAFF, damage: 15, magicDamage: 95, bonusStats: { int: 8, agi: 3 }, attackSpeed: 0.95 },
  { id: 'void_bow', name: 'Arc du Vide', description: 'Les flèches disparaissent. Les ennemis aussi.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_void_bow', value: 2200, element: ElementType.DARK, weaponType: WeaponType.BOW, damage: 58, magicDamage: 60, bonusStats: { agi: 7, int: 5 }, attackSpeed: 1.1 },
  // Divine
  { id: 'divine_sword', name: 'Épée Sacrée', description: 'Brille d\'une lumière douce. Les démons la fuient.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_divine_sword', value: 9500, element: ElementType.DIVINE, weaponType: WeaponType.SWORD, damage: 90, magicDamage: 90, bonusStats: { str: 8, int: 8, vit: 5 }, attackSpeed: 1.1, lore: 'La contre-réponse à Malachar, trouvée trop tard.' },
  // Zone chest rewards (referenced by zoneMaps lootable pools)
  { id: 'wind_bow',      name: 'Arc des Sommets',     description: 'Léger comme l\'air de Zephyr Peaks.',       rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_wind_bow',      value: 220, element: ElementType.WIND,      weaponType: WeaponType.BOW,   damage: 30, magicDamage: 18, bonusStats: { agi: 3 }, attackSpeed: 1.3 },
  { id: 'water_staff',   name: 'Bâton des Abysses',   description: 'Murmure de l\'eau profonde.',               rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_water_staff',   value: 200, element: ElementType.WATER,     weaponType: WeaponType.STAFF, damage: 4,  magicDamage: 40, bonusStats: { int: 3 }, attackSpeed: 0.9 },
  { id: 'thunder_staff', name: 'Sceptre de Foudre',   description: 'Attire les éclairs de Volterra.',           rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_thunder_staff', value: 240, element: ElementType.LIGHTNING, weaponType: WeaponType.STAFF, damage: 5,  magicDamage: 45, bonusStats: { int: 4 }, attackSpeed: 0.9 },
  { id: 'frost_staff',   name: 'Sceptre de Givre',    description: 'Chaque frappe refroidit l\'adversaire.',    rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_frost_staff',   value: 230, element: ElementType.ICE,       weaponType: WeaponType.STAFF, damage: 4,  magicDamage: 42, bonusStats: { int: 3, vit: 1 }, attackSpeed: 0.88 },
  { id: 'earth_tome',    name: 'Tome de la Terre',    description: 'Recueil de sorts géomantiques de Terravast.',rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_earth_tome',    value: 210, element: ElementType.EARTH,     weaponType: WeaponType.STAFF, damage: 4,  magicDamage: 38, bonusStats: { int: 3, end: 1 }, attackSpeed: 0.85 },
];

// ── ADDITIONAL ARMORS ───────────────────────────────────────────

export const EXTRA_ARMORS: Armor[] = [
  // Legs
  { id: 'leather_legs', name: 'Jambières de Cuir', description: 'Protection basique pour les jambes.', rarity: ItemRarity.COMMON, type: ItemType.LEGS, icon: 'item_leather_legs', value: 22, defense: 5, magicDefense: 2, bonusStats: {} },
  { id: 'iron_legs', name: 'Jambières de Fer', description: 'Standard de fer.', rarity: ItemRarity.UNCOMMON, type: ItemType.LEGS, icon: 'item_iron_legs', value: 75, defense: 14, magicDefense: 4, bonusStats: { end: 1 } },
  { id: 'fire_legs', name: 'Jambières Ignées', description: 'Forgées dans la lave d\'Ignis Reach.', rarity: ItemRarity.RARE, type: ItemType.LEGS, icon: 'item_fire_legs', value: 400, element: ElementType.FIRE, defense: 24, magicDefense: 10, bonusStats: { end: 2, str: 1 } },
  { id: 'earth_legs', name: 'Braconnières de Pierre', description: 'Terravast crystal layered leg guards.', rarity: ItemRarity.RARE, type: ItemType.LEGS, icon: 'item_earth_legs', value: 420, element: ElementType.EARTH, defense: 30, magicDefense: 8, bonusStats: { end: 3 } },
  { id: 'wind_legs', name: 'Jambières des Rafales', description: 'Légères comme le vent de Zephyr.', rarity: ItemRarity.RARE, type: ItemType.LEGS, icon: 'item_wind_legs', value: 380, element: ElementType.WIND, defense: 18, magicDefense: 12, bonusStats: { agi: 4 } },
  { id: 'water_legs', name: 'Jambières Corallines', description: 'Corail d\'Abyssmar, souple et résistant.', rarity: ItemRarity.RARE, type: ItemType.LEGS, icon: 'item_water_legs', value: 390, element: ElementType.WATER, defense: 20, magicDefense: 16, bonusStats: { end: 2, int: 1 } },
  { id: 'lightning_legs', name: 'Jambières Conductrices', description: 'Conçues pour les terrains électrifiés de Volterra.', rarity: ItemRarity.RARE, type: ItemType.LEGS, icon: 'item_lightning_legs', value: 410, element: ElementType.LIGHTNING, defense: 22, magicDefense: 14, bonusStats: { agi: 3, end: 2 } },
  { id: 'ice_legs', name: 'Braies Givrées', description: 'La glace de Glaciem ne fond pas.', rarity: ItemRarity.RARE, type: ItemType.LEGS, icon: 'item_ice_legs', value: 430, element: ElementType.ICE, defense: 26, magicDefense: 18, bonusStats: { end: 2, vit: 2 } },
  // Gloves extra
  { id: 'leather_gloves', name: 'Gants de Cuir', description: 'Protection basique des mains.', rarity: ItemRarity.COMMON, type: ItemType.GLOVES, icon: 'item_leather_gloves', value: 18, defense: 3, magicDefense: 1, bonusStats: {} },
  { id: 'iron_gauntlets', name: 'Gantelets de Fer', description: 'Robustes et lourds.', rarity: ItemRarity.UNCOMMON, type: ItemType.GLOVES, icon: 'item_iron_gauntlets', value: 70, defense: 10, magicDefense: 3, bonusStats: { str: 1 } },
  { id: 'wind_gloves', name: 'Gants des Rafales', description: 'Augmentent la vitesse d\'attaque.', rarity: ItemRarity.RARE, type: ItemType.GLOVES, icon: 'item_wind_gloves', value: 380, element: ElementType.WIND, defense: 12, magicDefense: 8, bonusStats: { agi: 4, spd: 2 } },
  { id: 'frost_gauntlets', name: 'Gantelets de Givre', description: 'Les ennemis frémissent à leur contact.', rarity: ItemRarity.EPIC, type: ItemType.GLOVES, icon: 'item_frost_gauntlets', value: 1600, element: ElementType.ICE, defense: 24, magicDefense: 18, bonusStats: { int: 5, str: 3 } },
  // Helms extra
  { id: 'fire_helm', name: 'Heaume Igné', description: 'La chaleur lui fait comme une couronne.', rarity: ItemRarity.RARE, type: ItemType.HELM, icon: 'item_fire_helm', value: 420, element: ElementType.FIRE, defense: 20, magicDefense: 8, bonusStats: { end: 2 } },
  { id: 'earth_helm', name: 'Heaume de Terravast', description: 'Crystal sur cuir endurci.', rarity: ItemRarity.RARE, type: ItemType.HELM, icon: 'item_earth_helm', value: 410, element: ElementType.EARTH, defense: 25, magicDefense: 6, bonusStats: { end: 2, str: 1 } },
  { id: 'wind_helm', name: 'Heaume du Vent', description: 'Aussi aérien qu\'une plume de Sylvael.', rarity: ItemRarity.RARE, type: ItemType.HELM, icon: 'item_wind_helm', value: 390, element: ElementType.WIND, defense: 16, magicDefense: 10, bonusStats: { agi: 3 } },
  { id: 'water_helm', name: 'Heaume Marin', description: 'Protège aussi sous l\'eau.', rarity: ItemRarity.RARE, type: ItemType.HELM, icon: 'item_water_helm', value: 400, element: ElementType.WATER, defense: 18, magicDefense: 12, bonusStats: { end: 1, int: 2 } },
  { id: 'lightning_helm', name: 'Heaume du Foudroiement', description: 'Canalise sans griller.', rarity: ItemRarity.RARE, type: ItemType.HELM, icon: 'item_lightning_helm', value: 430, element: ElementType.LIGHTNING, defense: 18, magicDefense: 12, bonusStats: { agi: 2, int: 2 } },
  { id: 'dark_helm', name: 'Heaume du Vide', description: 'Masque les traits du porteur.', rarity: ItemRarity.EPIC, type: ItemType.HELM, icon: 'item_dark_helm', value: 1500, element: ElementType.DARK, defense: 28, magicDefense: 24, bonusStats: { int: 5, agi: 3 } },
  // Boots extra
  { id: 'iron_boots', name: 'Bottes de Fer', description: 'Lourdes mais solides.', rarity: ItemRarity.UNCOMMON, type: ItemType.BOOTS, icon: 'item_iron_boots', value: 65, defense: 8, magicDefense: 3, bonusStats: { end: 1 } },
  { id: 'fire_boots', name: 'Bottes Ignées', description: 'Ne fondent pas dans la lave.', rarity: ItemRarity.RARE, type: ItemType.BOOTS, icon: 'item_fire_boots', value: 370, element: ElementType.FIRE, defense: 14, magicDefense: 6, bonusStats: { spd: 2, end: 1 } },
  { id: 'wind_boots', name: 'Bottes du Vent', description: 'La vitesse de marche augmente de 20%.', rarity: ItemRarity.EPIC, type: ItemType.BOOTS, icon: 'item_wind_boots', value: 1500, element: ElementType.WIND, defense: 16, magicDefense: 14, bonusStats: { agi: 5, spd: 5 } },
  { id: 'void_boots', name: 'Bottes du Vide', description: 'Aucun son de pas. Aucune trace.', rarity: ItemRarity.LEGENDARY, type: ItemType.BOOTS, icon: 'item_void_boots', value: 6500, element: ElementType.DARK, defense: 25, magicDefense: 25, bonusStats: { agi: 8, spd: 6, int: 4 } },
  // Capes extra
  { id: 'fire_cape', name: 'Cape de Cendres', description: 'Tissu noir calciné qui protège des flammes.', rarity: ItemRarity.RARE, type: ItemType.CAPE, icon: 'item_fire_cape', value: 360, element: ElementType.FIRE, defense: 12, magicDefense: 14, bonusStats: { end: 2 } },
  { id: 'earth_cape', name: 'Cape de Rune', description: 'Runes anciennes cousues dans le tissu.', rarity: ItemRarity.RARE, type: ItemType.CAPE, icon: 'item_earth_cape', value: 340, element: ElementType.EARTH, defense: 14, magicDefense: 10, bonusStats: { end: 2, str: 1 } },
  { id: 'water_cape', name: 'Cape des Profondeurs', description: 'Imperméable à l\'eau et au sang.', rarity: ItemRarity.RARE, type: ItemType.CAPE, icon: 'item_water_cape', value: 350, element: ElementType.WATER, defense: 12, magicDefense: 16, bonusStats: { vit: 2, int: 1 } },
  { id: 'ice_cape', name: 'Cape du Blizzard', description: 'Absorbe les tempêtes de Glaciem.', rarity: ItemRarity.EPIC, type: ItemType.CAPE, icon: 'item_ice_cape', value: 1400, element: ElementType.ICE, defense: 18, magicDefense: 22, bonusStats: { end: 3, int: 3 } },
  { id: 'dark_cape', name: 'Cape des Ombres', description: 'Se fond dans l\'obscurité.', rarity: ItemRarity.EPIC, type: ItemType.CAPE, icon: 'item_dark_cape', value: 1600, element: ElementType.DARK, defense: 16, magicDefense: 20, bonusStats: { agi: 5, int: 4 } },
  { id: 'divine_cape', name: 'Cape de Lumière', description: 'Tissu divin que les ombres fuient.', rarity: ItemRarity.LEGENDARY, type: ItemType.CAPE, icon: 'item_divine_cape', value: 7000, element: ElementType.DIVINE, defense: 22, magicDefense: 35, bonusStats: { vit: 6, int: 5, end: 4 } },
  // Zone chest rewards (referenced by zoneMaps lootable pools)
  { id: 'volcanic_armor',   name: 'Armure Volcanique',  description: 'Forgée dans le magma d\'Ignis Reach.',    rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_fire_chest',     value: 450, element: ElementType.FIRE,      defense: 28, magicDefense: 10, bonusStats: { end: 2, str: 2 } },
  { id: 'lightning_armor',  name: 'Armure du Tonnerre', description: 'Conduit l\'électricité sans dommage.',    rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_storm_plate',    value: 480, element: ElementType.LIGHTNING, defense: 24, magicDefense: 18, bonusStats: { end: 2, agi: 2 } },
  { id: 'crystal_armor',    name: 'Armure de Cristal',  description: 'Crystallisation de l\'énergie de Glaciem.',rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_glaciem_chest',  value: 500, element: ElementType.ICE,       defense: 30, magicDefense: 20, bonusStats: { end: 3, vit: 1 } },
];


// ── SHOP ARMORS (referenced by shops.ts) ──────────────────────
const SHOP_ARMORS: Armor[] = [
  { id: 'leather_armor', name: 'Armure de Cuir', description: 'Armure légère en cuir tanné. Fiable pour débuter.', rarity: ItemRarity.COMMON, type: ItemType.CHEST, icon: 'item_leather_chest', value: 55, defense: 8, magicDefense: 3, bonusStats: {} },
  { id: 'chainmail',     name: 'Cotte de Mailles', description: 'Mailles de fer entrelacées. Bonne protection sans surpoids.', rarity: ItemRarity.UNCOMMON, type: ItemType.CHEST, icon: 'item_iron_chest', value: 160, defense: 18, magicDefense: 5, bonusStats: { end: 1 } },
  { id: 'iron_shield',   name: 'Bouclier de Fer', description: 'Bouclier robuste forgé à Grievy Town.', rarity: ItemRarity.COMMON, type: ItemType.CHEST, icon: 'item_glacial_shield', value: 70, defense: 12, magicDefense: 2, bonusStats: {} },
];

// ── EXTRA MATERIALS (needed by new quests/NPCs) ─────────────────

export const EXTRA_MATERIALS: Material[] = [
  { id: 'moonpetal_herb', name: 'Herbe Lunaire', description: 'Herb rare qui pousse à la lisière des forêts. Utilisée en alchimie.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_moonpetal', value: 8, stackable: true, maxStack: 99 },
  { id: 'bird_feather', name: 'Plume d\'Oiseau des Bois', description: 'Plume douce d\'un oiseau de forêt.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_bird_feather', value: 5, stackable: true, maxStack: 99 },
  { id: 'ash_residue', name: 'Résidu de Cendre', description: 'Cendre purifiée par la magie d\'Ignis Reach.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_ash_residue', value: 10, zone: ElementType.FIRE, stackable: true, maxStack: 99 },
  { id: 'iron_ore', name: 'Minerai de Fer', description: 'Métal brut extrait des mines de Deepdelve.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_iron_ore', value: 12, zone: ElementType.EARTH, stackable: true, maxStack: 99 },
  { id: 'pearl', name: 'Perle d\'Abyssmar', description: 'Formée dans les profondeurs. Translucide.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_pearl', value: 35, zone: ElementType.WATER, stackable: true, maxStack: 50 },
  { id: 'storm_glass', name: 'Verre de Tempête', description: 'Sable fondu par la foudre de Volterra.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_storm_glass', value: 45, zone: ElementType.LIGHTNING, stackable: true, maxStack: 50 },
  { id: 'icebloom_flower', name: 'Fleur de Givre', description: 'Pousse uniquement dans les anfractuosités gelées de Glaciem.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_icebloom', value: 40, zone: ElementType.ICE, stackable: true, maxStack: 50 },
  { id: 'void_crystal', name: 'Cristal du Vide', description: 'Transparent mais sombre. Ne reflète rien.', rarity: ItemRarity.RARE, type: ItemType.MATERIAL, icon: 'item_void_crystal', value: 160, zone: ElementType.DARK, stackable: true, maxStack: 20 },
  { id: 'ancient_tome_page', name: 'Page de Tome Ancien', description: 'Fragment d\'un savoir perdu. Ovan en ferait quelque chose.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_tome_page', value: 55, stackable: true, maxStack: 30 },

  // ── Zone lootable materials ──────────────────────────────────
  { id: 'herb',             name: 'Herbe Sauvage',       description: 'Plante médicinale commune.',                       rarity: ItemRarity.COMMON,   type: ItemType.MATERIAL, icon: 'item_herb',           value: 5,   stackable: true, maxStack: 99 },
  { id: 'wild_root',        name: 'Racine Sauvage',       description: 'Racine arrachée du sol de Grievy Town.',          rarity: ItemRarity.COMMON,   type: ItemType.MATERIAL, icon: 'item_wild_root',      value: 4,   stackable: true, maxStack: 99 },
  { id: 'rope',             name: 'Corde',                description: 'Corde tressée. Toujours utile.',                  rarity: ItemRarity.COMMON,   type: ItemType.MATERIAL, icon: 'item_rope',           value: 8,   stackable: true, maxStack: 20 },
  { id: 'coal',             name: 'Charbon',              description: 'Combustible de base pour la forge.',              rarity: ItemRarity.COMMON,   type: ItemType.MATERIAL, icon: 'item_coal',           value: 6,   zone: ElementType.FIRE,      stackable: true, maxStack: 99 },
  { id: 'obsidian_shard',   name: 'Éclat d\'Obsidienne', description: 'Verre volcanique tranchant.',                     rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_obsidian',       value: 22,  zone: ElementType.FIRE,      stackable: true, maxStack: 50 },
  { id: 'fire_crystal',     name: 'Cristal de Feu',       description: 'Cristallisation d\'énergie ignée.',               rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_fire_crystal',   value: 35,  zone: ElementType.FIRE,      stackable: true, maxStack: 50 },
  { id: 'ash_herb',         name: 'Herbe des Cendres',    description: 'Pousse dans les coulées de lave refroidies.',     rarity: ItemRarity.COMMON,   type: ItemType.MATERIAL, icon: 'item_ash_herb',       value: 10,  zone: ElementType.FIRE,      stackable: true, maxStack: 99 },
  { id: 'fire_essence',     name: 'Essence de Feu',       description: 'Concentration pure de magie ignée.',              rarity: ItemRarity.RARE,     type: ItemType.MATERIAL, icon: 'item_fire_essence',   value: 80,  zone: ElementType.FIRE,      stackable: true, maxStack: 20 },
  { id: 'earth_crystal',    name: 'Cristal de Terre',     description: 'Formé par millennia de pression tellurique.',     rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_earth_crystal',  value: 30,  zone: ElementType.EARTH,     stackable: true, maxStack: 50 },
  { id: 'deepstone',        name: 'Pierre Profonde',       description: 'Roche dense extraite des couches inférieures.',  rarity: ItemRarity.COMMON,   type: ItemType.MATERIAL, icon: 'item_deepstone',      value: 15,  zone: ElementType.EARTH,     stackable: true, maxStack: 99 },
  { id: 'mana_crystal',     name: 'Cristal de Mana',      description: 'Pur concentré d\'énergie magique.',               rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_mana_crystal',   value: 40,  stackable: true, maxStack: 30 },
  { id: 'ancient_rune',     name: 'Rune Ancienne',         description: 'Glyphe gravé par une civilisation disparue.',    rarity: ItemRarity.RARE,     type: ItemType.MATERIAL, icon: 'item_ancient_rune',   value: 90,  zone: ElementType.EARTH,     stackable: true, maxStack: 10 },
  { id: 'cave_mushroom',    name: 'Champignon des Caves',  description: 'Bioluminescent, légèrement toxique cru.',        rarity: ItemRarity.COMMON,   type: ItemType.MATERIAL, icon: 'item_cave_mushroom',  value: 7,   zone: ElementType.EARTH,     stackable: true, maxStack: 99 },
  { id: 'wind_crystal',     name: 'Cristal de Vent',       description: 'Condensation de courants d\'air magique.',       rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_wind_crystal',   value: 32,  zone: ElementType.WIND,      stackable: true, maxStack: 50 },
  { id: 'skystone',         name: 'Pierre du Ciel',        description: 'Météorite tombée sur Zephyr Peaks.',              rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_skystone',       value: 45,  zone: ElementType.WIND,      stackable: true, maxStack: 30 },
  { id: 'wind_flower',      name: 'Fleur du Vent',         description: 'Pétales qui flottent sans tomber.',              rarity: ItemRarity.COMMON,   type: ItemType.MATERIAL, icon: 'item_wind_flower',    value: 9,   zone: ElementType.WIND,      stackable: true, maxStack: 99 },
  { id: 'cloud_herb',       name: 'Herbe Nuageuse',        description: 'Légère comme une brise, arôme de montagne.',    rarity: ItemRarity.COMMON,   type: ItemType.MATERIAL, icon: 'item_cloud_herb',     value: 8,   zone: ElementType.WIND,      stackable: true, maxStack: 99 },
  { id: 'phoenix_feather',  name: 'Plume de Phénix',       description: 'Relique rarissime, chaude au toucher.',          rarity: ItemRarity.RARE,     type: ItemType.MATERIAL, icon: 'item_phoenix_feather',value: 200, zone: ElementType.WIND,      stackable: true, maxStack: 5  },
  { id: 'sea_kelp',         name: 'Varech Marin',          description: 'Algue des profondeurs d\'Abyssmar.',             rarity: ItemRarity.COMMON,   type: ItemType.MATERIAL, icon: 'item_sea_kelp',       value: 6,   zone: ElementType.WATER,     stackable: true, maxStack: 99 },
  { id: 'thalymor_shard',   name: 'Éclat de Thalymor',     description: 'Fragment de l\'exosquelette du Léviathan.',      rarity: ItemRarity.RARE,     type: ItemType.MATERIAL, icon: 'item_thalymor_shard', value: 120, zone: ElementType.WATER,     stackable: true, maxStack: 10 },
  { id: 'deep_coral',       name: 'Corail Profond',        description: 'Corail vivant de l\'Abysse.',                    rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_deep_coral',     value: 25,  zone: ElementType.WATER,     stackable: true, maxStack: 50 },
  { id: 'leviathan_scale',  name: 'Écaille de Léviathan',  description: 'Armure naturelle arrachée au colosse abyssal.', rarity: ItemRarity.EPIC,     type: ItemType.MATERIAL, icon: 'item_leviathan_scale',value: 350, zone: ElementType.WATER,     stackable: true, maxStack: 5  },
  { id: 'volt_crystal',     name: 'Cristal Voltaïque',     description: 'Conduit l\'électricité sans résistance.',        rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_volt_crystal',   value: 38,  zone: ElementType.LIGHTNING, stackable: true, maxStack: 50 },
  { id: 'copper_coil',      name: 'Bobine de Cuivre',      description: 'Composant des installations de Volterra.',      rarity: ItemRarity.COMMON,   type: ItemType.MATERIAL, icon: 'item_copper_coil',    value: 12,  zone: ElementType.LIGHTNING, stackable: true, maxStack: 99 },
  { id: 'refined_copper',   name: 'Cuivre Raffiné',        description: 'Alliage conducteur de haute qualité.',          rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_refined_copper', value: 28,  zone: ElementType.LIGHTNING, stackable: true, maxStack: 50 },
  { id: 'glaciem_ice_shard',name: 'Éclat de Glace Éternelle', description: 'Glace de Glaciem qui ne fond jamais.',       rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_glaciem_ice',    value: 35,  zone: ElementType.ICE,       stackable: true, maxStack: 50 },
  { id: 'frozen_essence',   name: 'Essence Gelée',         description: 'Magie de Glaciem compressée en cristal.',       rarity: ItemRarity.RARE,     type: ItemType.MATERIAL, icon: 'item_frozen_essence', value: 85,  zone: ElementType.ICE,       stackable: true, maxStack: 20 },
  { id: 'ancient_frost_rune', name: 'Rune de Givre Ancien', description: 'Rune gravée dans la glace par l\'archiviste.', rarity: ItemRarity.RARE,     type: ItemType.MATERIAL, icon: 'item_frost_rune',     value: 100, zone: ElementType.ICE,       stackable: true, maxStack: 10 },
  { id: 'void_shard',       name: 'Éclat du Vide',         description: 'Matière sombre arrachée à la Flèche.',           rarity: ItemRarity.EPIC,     type: ItemType.MATERIAL, icon: 'item_void_shard',     value: 300, zone: ElementType.DARK,      stackable: true, maxStack: 5  },
  { id: 'chaos_crystal',    name: 'Cristal du Chaos',      description: 'Stabilisé par magie seulement — éphémère.',     rarity: ItemRarity.EPIC,     type: ItemType.MATERIAL, icon: 'item_chaos_crystal',  value: 400, zone: ElementType.DARK,      stackable: true, maxStack: 5  },
];

// ── ITEM REGISTRY ──────────────────────────────────────────────

export const ALL_ITEMS: Record<string, import('../types').Item> = {};
[
  ...WEAPONS, ...ARMORS, ...ACCESSORIES, ...CONSUMABLES, ...MATERIALS, ...KEY_ITEMS,
  ...HIDDEN_WEAPONS, ...HIDDEN_ARMORS, ...HIDDEN_ACCESSORIES,
  ...SKINS, ...EXTRA_WEAPONS, ...EXTRA_ARMORS, ...EXTRA_MATERIALS, ...SHOP_ARMORS,
].forEach(item => {
  ALL_ITEMS[item.id] = item as import('../types').Item;
});
