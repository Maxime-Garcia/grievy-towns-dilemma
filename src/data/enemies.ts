import { Enemy, ElementType } from '../types';

// Base stat scaling formula applied at runtime: stat * (1 + (level - baseLevel) * 0.08)

export const ENEMIES: Enemy[] = [

  // ── IGNIS REACH (Fire) ───────────────────────────────────────

  // Creature concept: a small winged fire-kin that circles high and dives — the charger
  // pattern is the stoop of a bird of prey made of embers. The player never quite reads it in time.
  {
    id: 'ember_wyrm',
    name: 'Ember Wyrm',
    description: 'A small winged fire-kin with a pale, searing face, circling the ash skies of Ignis Reach.',
    sprite: 'enemy_ember_wyrm',
    zone: ElementType.FIRE,
    baseLevel: 8,
    stats: { baseHp: 120, baseMana: 30, baseAtk: 18, baseDef: 8, baseSpd: 7, baseMagicAtk: 22, baseMagicDef: 10 },
    element: ElementType.FIRE,
    weakness: ElementType.WATER,
    skills: ['fireball'],
    loot: [
      { itemId: 'ember_core', dropRate: 0.45, minQty: 1, maxQty: 2 },
      { itemId: 'volcanic_ash', dropRate: 0.60, minQty: 1, maxQty: 3 },
      { itemId: 'iron_sword', dropRate: 0.08, minQty: 1, maxQty: 1 },
      { itemId: 'flame_ring', dropRate: 0.015, minQty: 1, maxQty: 1 }
    ],
    baseXp: 35,
    baseGold: { min: 5, max: 15 },
    isBoss: false,
    isElite: false,
    spawnWeight: 3,
    aggroRange: 150,
    attackRange: 60,
    moveSpeed: 90,
    behavior: 'charger',
    lore: 'The least of Pyrath\'s fire-born. They carried warmth between the sacred springs on their small wings. Now they circle where the springs used to be, and dive at anything that moves.'
  },

  // Creature concept: a slow colossus that marks territory — the patrol behavior
  // makes the lava golem feel like an obstacle of the world rather than a hunter.
  {
    id: 'lava_golem',
    name: 'Lava Golem',
    description: 'A squat hulk of cooling magma, still gripping its digger\'s pick.',
    sprite: 'enemy_lava_golem',
    zone: ElementType.FIRE,
    baseLevel: 9,
    stats: { baseHp: 220, baseMana: 10, baseAtk: 28, baseDef: 18, baseSpd: 3, baseMagicAtk: 12, baseMagicDef: 6 },
    element: ElementType.FIRE,
    weakness: ElementType.WATER,
    skills: [],
    loot: [
      { itemId: 'obsidian_shard', dropRate: 0.55, minQty: 1, maxQty: 2 },
      { itemId: 'ember_core', dropRate: 0.35, minQty: 1, maxQty: 1 },
      { itemId: 'fire_chest', dropRate: 0.06, minQty: 1, maxQty: 1 },
      { itemId: 'obsidian_gauntlets', dropRate: 0.02, minQty: 1, maxQty: 1 }
    ],
    baseXp: 55,
    baseGold: { min: 8, max: 20 },
    isBoss: false,
    isElite: false,
    spawnWeight: 2,
    aggroRange: 100,
    attackRange: 70,
    moveSpeed: 50,
    behavior: 'patrol',
    patrolRadius: 180,
    lore: 'Golems like this shaped the mountains — construction tools, not weapons. They still carry their picks. The curse never told them the work was over.'
  },

  // Creature concept: fast, fragile, ranged — a swarm intelligence that pelts the player
  // from angles, making retreat feel unsafe. The fireball volley is disorienting.
  {
    id: 'cinder_sprite',
    name: 'Cinder Sprite',
    description: 'A small, fast fire elemental that swarms in groups.',
    sprite: 'enemy_cinder_sprite',
    zone: ElementType.FIRE,
    baseLevel: 8,
    stats: { baseHp: 55, baseMana: 40, baseAtk: 12, baseDef: 4, baseSpd: 14, baseMagicAtk: 18, baseMagicDef: 8 },
    element: ElementType.FIRE,
    weakness: ElementType.WATER,
    skills: ['fireball'],
    loot: [
      { itemId: 'volcanic_ash', dropRate: 0.70, minQty: 1, maxQty: 4 },
      { itemId: 'ember_core', dropRate: 0.20, minQty: 1, maxQty: 1 },
      { itemId: 'minor_health_potion', dropRate: 0.12, minQty: 1, maxQty: 1 }
    ],
    baseXp: 20,
    baseGold: { min: 2, max: 8 },
    isBoss: false,
    isElite: false,
    spawnWeight: 5,
    aggroRange: 200,
    attackRange: 180,
    moveSpeed: 140,
    behavior: 'ranged',
    projectileColor: 0xff4400,
    lore: 'Sprites that never became more. Pyrath created millions of them to carry embers across the zone. Without direction, they burn at everything.'
  },

  // Creature concept: a spirit that lingers at distance and bombards — the
  // ranged behavior with high magic attack makes revenants feel like ghosts
  // punishing players who ignore their periphery.
  {
    id: 'ash_revenant',
    name: 'Ash Revenant',
    description: 'A shrouded spirit of ash with a single ember eye — the ghost of a pilgrim who died in Ignis Reach.',
    sprite: 'enemy_ash_revenant',
    zone: ElementType.FIRE,
    baseLevel: 10,
    stats: { baseHp: 95, baseMana: 60, baseAtk: 14, baseDef: 6, baseSpd: 10, baseMagicAtk: 30, baseMagicDef: 14 },
    element: ElementType.FIRE,
    weakness: ElementType.WATER,
    skills: ['inferno_burst'],
    loot: [
      { itemId: 'volcanic_ash', dropRate: 0.80, minQty: 2, maxQty: 5 },
      { itemId: 'pilgrim_robe', dropRate: 0.04, minQty: 1, maxQty: 1 },
      { itemId: 'fire_staff', dropRate: 0.012, minQty: 1, maxQty: 1 }
    ],
    baseXp: 42,
    baseGold: { min: 6, max: 18 },
    isBoss: false,
    isElite: false,
    spawnWeight: 2,
    aggroRange: 160,
    attackRange: 200,
    moveSpeed: 75,
    behavior: 'ranged',
    projectileColor: 0xff4400,
    lore: 'The sacred springs had healing power. Thousands came over the centuries. Those who died here during the eruption couldn\'t leave.'
  },

  // Creature concept: territorial elite that holds ground until triggered —
  // the charger makes the magma titan feel like a land mine that announces itself
  // one second before impact.
  {
    id: 'magma_titan',
    name: 'Magma Titan',
    description: 'An elite colossus of muscle and magma. Rare, enormous, and territorial.',
    sprite: 'enemy_magma_titan',
    zone: ElementType.FIRE,
    baseLevel: 12,
    stats: { baseHp: 480, baseMana: 50, baseAtk: 45, baseDef: 30, baseSpd: 4, baseMagicAtk: 35, baseMagicDef: 20 },
    element: ElementType.FIRE,
    weakness: ElementType.WATER,
    skills: ['inferno_burst', 'seismic_slam'],
    loot: [
      { itemId: 'ember_core', dropRate: 0.80, minQty: 2, maxQty: 4 },
      { itemId: 'obsidian_shard', dropRate: 0.70, minQty: 2, maxQty: 3 },
      { itemId: 'magma_greatsword', dropRate: 0.08, minQty: 1, maxQty: 1 },
      { itemId: 'titan_helm', dropRate: 0.05, minQty: 1, maxQty: 1 },
      { itemId: 'pyrath_heart', dropRate: 0.003, minQty: 1, maxQty: 1 }
    ],
    baseXp: 180,
    baseGold: { min: 30, max: 80 },
    isBoss: false,
    isElite: true,
    spawnWeight: 0.5,
    aggroRange: 80,
    attackRange: 90,
    moveSpeed: 45,
    behavior: 'charger',
    lore: 'Titans were ancient. Before Pyrath arrived, they lived in the volcanic mountains. Pyrath did not create them — only claimed them. They are now older than the curse and angrier.'
  },

  // Creature concept: a feline fire-imp that spits its brood into being —
  // the first time the player encounters a swarm they did not expect.
  // NEW ENEMY — Ignis Reach
  {
    id: 'ember_broodmother',
    name: 'Ember Broodmother',
    description: 'A sharp-eared feline imp, teeth bared, that shrieks litters of living cinders into existence.',
    sprite: 'enemy_ember_broodmother',
    zone: ElementType.FIRE,
    baseLevel: 10,
    stats: { baseHp: 160, baseMana: 70, baseAtk: 15, baseDef: 10, baseSpd: 5, baseMagicAtk: 20, baseMagicDef: 12 },
    element: ElementType.FIRE,
    weakness: ElementType.WATER,
    skills: ['fireball'],
    loot: [
      { itemId: 'ember_core', dropRate: 0.55, minQty: 1, maxQty: 2 },
      { itemId: 'volcanic_ash', dropRate: 0.65, minQty: 2, maxQty: 4 },
      { itemId: 'minor_health_potion', dropRate: 0.10, minQty: 1, maxQty: 2 }
    ],
    baseXp: 70,
    baseGold: { min: 10, max: 25 },
    isBoss: false,
    isElite: false,
    spawnWeight: 1,
    aggroRange: 130,
    attackRange: 60,
    moveSpeed: 40,
    behavior: 'summoner',
    lore: 'Pyrath\'s fire has a generative quality that the curse twisted. Nothing like the broodmother existed before the Unraveling. It is what corruption invents when given the power to create without the reason to.'
  },

  // NEW ENEMY — Ignis Reach: patrol guardian that circles lava pools
  {
    id: 'scorch_sentinel',
    name: 'Scorch Sentinel',
    description: 'A stone knight animated by residual divine fire, sword and shield in hand, walking eternal circles around Pyrath\'s shrines.',
    sprite: 'enemy_scorch_sentinel',
    zone: ElementType.FIRE,
    baseLevel: 9,
    stats: { baseHp: 175, baseMana: 20, baseAtk: 24, baseDef: 20, baseSpd: 4, baseMagicAtk: 16, baseMagicDef: 14 },
    element: ElementType.FIRE,
    weakness: ElementType.WATER,
    skills: [],
    loot: [
      { itemId: 'obsidian_shard', dropRate: 0.60, minQty: 1, maxQty: 2 },
      { itemId: 'ember_core', dropRate: 0.30, minQty: 1, maxQty: 1 },
      { itemId: 'stone_shield_scroll', dropRate: 0.04, minQty: 1, maxQty: 1 }
    ],
    baseXp: 48,
    baseGold: { min: 7, max: 18 },
    isBoss: false,
    isElite: false,
    spawnWeight: 2,
    aggroRange: 110,
    attackRange: 65,
    moveSpeed: 45,
    behavior: 'patrol',
    patrolRadius: 220,
    lore: 'These were placed by Pyrath\'s priests to guard the shrines. They have not received a new order in three centuries. The curse made their purpose absolute.'
  },

  {
    id: 'pyrath_boss',
    name: 'Pyrath the Unbound',
    description: 'What remains of the divine dragon of fire — a single horned visage of flame, all hunger and no memory.',
    sprite: 'boss_pyrath',
    zone: ElementType.FIRE,
    baseLevel: 14,
    stats: { baseHp: 1800, baseMana: 200, baseAtk: 80, baseDef: 40, baseSpd: 10, baseMagicAtk: 95, baseMagicDef: 45 },
    element: ElementType.FIRE,
    weakness: ElementType.WATER,
    skills: ['fireball', 'inferno_burst', 'flame_dash'],
    loot: [
      { itemId: 'pyrath_scale', dropRate: 1.0, minQty: 1, maxQty: 1 },
      { itemId: 'ember_core', dropRate: 1.0, minQty: 5, maxQty: 8 },
      { itemId: 'dragonfang_sword', dropRate: 0.25, minQty: 1, maxQty: 1 },
      { itemId: 'pyrath_armor', dropRate: 0.15, minQty: 1, maxQty: 1 },
      { itemId: 'eternal_flame_ring', dropRate: 0.04, minQty: 1, maxQty: 1 }
    ],
    baseXp: 1200,
    baseGold: { min: 150, max: 300 },
    isBoss: true,
    isElite: false,
    spawnWeight: 0,
    aggroRange: 999,
    attackRange: 300,
    moveSpeed: 110,
    behavior: 'charger',
    lore: 'Pyrath was the first divinity. He will be the first to die. The curse burned away everything he was and left one shape: a maw. He does not recognize the hero. He does not recognize anyone. He only burns.'
  },

  // ── TERRAVAST (Earth) ────────────────────────────────────────

  // Creature concept: an ambush patrol — slow but covers large areas,
  // appears when the player thinks they have a clear path.
  {
    id: 'stone_crawler',
    name: 'Stone Crawler',
    description: 'A hunched tunnel-hulk that drags a flat tail behind it, sweeping the canyon passages as it goes.',
    sprite: 'enemy_stone_crawler',
    zone: ElementType.EARTH,
    baseLevel: 10,
    stats: { baseHp: 140, baseMana: 10, baseAtk: 22, baseDef: 20, baseSpd: 5, baseMagicAtk: 8, baseMagicDef: 12 },
    element: ElementType.EARTH,
    weakness: ElementType.WIND,
    skills: [],
    loot: [
      { itemId: 'terravast_crystal', dropRate: 0.50, minQty: 1, maxQty: 2 },
      { itemId: 'cave_moss', dropRate: 0.65, minQty: 1, maxQty: 3 },
      { itemId: 'stone_shield_scroll', dropRate: 0.05, minQty: 1, maxQty: 1 }
    ],
    baseXp: 40,
    baseGold: { min: 6, max: 16 },
    isBoss: false,
    isElite: false,
    spawnWeight: 3,
    aggroRange: 120,
    attackRange: 55,
    moveSpeed: 65,
    behavior: 'patrol',
    patrolRadius: 200,
    lore: 'Gorvun\'s beasts of burden. Their flat tails kept the tunnels clear of rubble for miners and travelers. They still keep the tunnels — but now everything that enters is an intruder.'
  },

  // Creature concept: the surviving heart-stone of a fallen golem — an immovable
  // point of will that rams when approached; a fight that rewards patience over aggression.
  {
    id: 'crystal_golem',
    name: 'Crystal Golem',
    description: 'The floating heart-crystal of a golem whose body crumbled long ago. Some magic still glances off its facets.',
    sprite: 'enemy_crystal_golem',
    zone: ElementType.EARTH,
    baseLevel: 11,
    stats: { baseHp: 250, baseMana: 0, baseAtk: 32, baseDef: 28, baseSpd: 3, baseMagicAtk: 0, baseMagicDef: 35 },
    element: ElementType.EARTH,
    weakness: ElementType.WIND,
    skills: [],
    loot: [
      { itemId: 'terravast_crystal', dropRate: 0.75, minQty: 2, maxQty: 4 },
      { itemId: 'ancient_stone_rune', dropRate: 0.30, minQty: 1, maxQty: 1 },
      { itemId: 'crystal_chest', dropRate: 0.05, minQty: 1, maxQty: 1 }
    ],
    baseXp: 65,
    baseGold: { min: 10, max: 25 },
    isBoss: false,
    isElite: false,
    spawnWeight: 2,
    aggroRange: 90,
    attackRange: 65,
    moveSpeed: 40,
    behavior: 'charger',
    lore: 'Gorvun shaped each golem by hand over centuries. The quakes brought their bodies down; the hearts refused to stop. They hover over their own rubble, protecting the only thing left to protect.'
  },

  // Creature concept: a mimic fungus — perfectly still among ordinary mushrooms
  // until the player walks past; then it closes instantly.
  {
    id: 'cave_lurker',
    name: 'Cave Lurker',
    description: 'A wide-capped cave fungus, indistinguishable from the harmless ones. The difference only shows when it moves.',
    sprite: 'enemy_cave_lurker',
    zone: ElementType.EARTH,
    baseLevel: 10,
    stats: { baseHp: 80, baseMana: 20, baseAtk: 26, baseDef: 8, baseSpd: 12, baseMagicAtk: 15, baseMagicDef: 7 },
    element: ElementType.EARTH,
    weakness: ElementType.WIND,
    skills: [],
    loot: [
      { itemId: 'cave_moss', dropRate: 0.70, minQty: 1, maxQty: 3 },
      { itemId: 'terravast_crystal', dropRate: 0.25, minQty: 1, maxQty: 1 },
      { itemId: 'dagger_of_shadow', dropRate: 0.008, minQty: 1, maxQty: 1 }
    ],
    baseXp: 30,
    baseGold: { min: 4, max: 12 },
    isBoss: false,
    isElite: false,
    spawnWeight: 4,
    aggroRange: 0,
    attackRange: 55,
    moveSpeed: 110,
    behavior: 'chaser',
    lore: 'Native to the cave ecosystem, older than Gorvun himself. They used to shun light — a single torch secured a camp. The curse didn\'t change them. It just took away their fear.'
  },

  // Creature concept: a hooded scavenger that crouches, waits, and uncoils like
  // a spring — the canyon floor itself seems to lunge.
  {
    id: 'terravast_serpent',
    name: 'Terravast Skulker',
    description: 'A squat, hooded figure that haunts the deep canyon floors, crouching motionless until something passes.',
    sprite: 'enemy_terravast_serpent',
    zone: ElementType.EARTH,
    baseLevel: 12,
    stats: { baseHp: 180, baseMana: 30, baseAtk: 35, baseDef: 15, baseSpd: 9, baseMagicAtk: 20, baseMagicDef: 10 },
    element: ElementType.EARTH,
    weakness: ElementType.WIND,
    skills: ['seismic_slam'],
    loot: [
      { itemId: 'ancient_stone_rune', dropRate: 0.40, minQty: 1, maxQty: 2 },
      { itemId: 'terravast_crystal', dropRate: 0.55, minQty: 1, maxQty: 2 },
      { itemId: 'serpent_scale_boots', dropRate: 0.025, minQty: 1, maxQty: 1 }
    ],
    baseXp: 60,
    baseGold: { min: 9, max: 22 },
    isBoss: false,
    isElite: false,
    spawnWeight: 2,
    aggroRange: 140,
    attackRange: 100,
    moveSpeed: 80,
    behavior: 'charger',
    lore: 'They picked over these canyons long before Gorvun arrived — small hunched things looting his domain without permission. The god found them amusing. He let them stay. No one is left to find it amusing.'
  },

  // NEW ENEMY — Terravast: ranged earth-shaman spirit that hurls crystal shards
  {
    id: 'rune_shard_ghost',
    name: 'Rune Shard Ghost',
    description: 'A small hooded spirit with one slow-blinking eye, formed from broken ancient runes, flinging crystal fragments at intruders.',
    sprite: 'enemy_rune_shard_ghost',
    zone: ElementType.EARTH,
    baseLevel: 11,
    stats: { baseHp: 85, baseMana: 65, baseAtk: 10, baseDef: 5, baseSpd: 9, baseMagicAtk: 32, baseMagicDef: 18 },
    element: ElementType.EARTH,
    weakness: ElementType.WIND,
    skills: ['terra_surge'],
    loot: [
      { itemId: 'ancient_stone_rune', dropRate: 0.55, minQty: 1, maxQty: 2 },
      { itemId: 'terravast_crystal', dropRate: 0.40, minQty: 1, maxQty: 1 },
      { itemId: 'minor_mana_potion', dropRate: 0.12, minQty: 1, maxQty: 1 }
    ],
    baseXp: 38,
    baseGold: { min: 5, max: 14 },
    isBoss: false,
    isElite: false,
    spawnWeight: 2,
    aggroRange: 180,
    attackRange: 250,
    moveSpeed: 70,
    behavior: 'ranged',
    projectileColor: 0x88aa33,
    lore: 'The ancient runes carved into Terravast\'s walls were Gorvun\'s language. The curse gave them grief and motion. They remember only that they are broken.'
  },

  // NEW ENEMY — Terravast: a lump of living tunnel-earth with a tool-haft clenched
  // in its jaws — it chases relentlessly through the cave systems
  {
    id: 'stone_hound',
    name: 'Stone Brute',
    description: 'A compact mass of animated earth with a mining haft clenched in its jaws, charging through the dark tunnels.',
    sprite: 'enemy_stone_hound',
    zone: ElementType.EARTH,
    baseLevel: 10,
    stats: { baseHp: 110, baseMana: 10, baseAtk: 28, baseDef: 12, baseSpd: 13, baseMagicAtk: 8, baseMagicDef: 8 },
    element: ElementType.EARTH,
    weakness: ElementType.WIND,
    skills: [],
    loot: [
      { itemId: 'cave_moss', dropRate: 0.55, minQty: 1, maxQty: 2 },
      { itemId: 'terravast_crystal', dropRate: 0.30, minQty: 1, maxQty: 1 },
      { itemId: 'minor_health_potion', dropRate: 0.10, minQty: 1, maxQty: 1 }
    ],
    baseXp: 32,
    baseGold: { min: 5, max: 13 },
    isBoss: false,
    isElite: false,
    spawnWeight: 3,
    aggroRange: 200,
    attackRange: 55,
    moveSpeed: 115,
    behavior: 'chaser',
    lore: 'Gorvun kept them as working beasts in the deep mines. They hauled, they carried, and the miners gave them names. The haft in its jaws is a tool of the mines. The work ended long ago. No one told them.'
  },

  {
    id: 'ruin_colossus',
    name: 'Ruin Colossus',
    description: 'An elite colossus of stone muscle, assembled from the rubble of collapsed ancient structures.',
    sprite: 'enemy_ruin_colossus',
    zone: ElementType.EARTH,
    baseLevel: 14,
    stats: { baseHp: 550, baseMana: 20, baseAtk: 55, baseDef: 40, baseSpd: 3, baseMagicAtk: 25, baseMagicDef: 25 },
    element: ElementType.EARTH,
    weakness: ElementType.WIND,
    skills: ['terra_surge', 'stone_shield'],
    loot: [
      { itemId: 'ancient_stone_rune', dropRate: 0.85, minQty: 2, maxQty: 3 },
      { itemId: 'ruin_colossus_core', dropRate: 0.40, minQty: 1, maxQty: 1 },
      { itemId: 'colossus_greatsword', dropRate: 0.06, minQty: 1, maxQty: 1 },
      { itemId: 'runic_armor', dropRate: 0.04, minQty: 1, maxQty: 1 }
    ],
    baseXp: 200,
    baseGold: { min: 35, max: 90 },
    isBoss: false,
    isElite: true,
    spawnWeight: 0.4,
    aggroRange: 70,
    attackRange: 80,
    moveSpeed: 35,
    behavior: 'patrol',
    patrolRadius: 160,
    lore: 'When Gorvun trembles, ancient structures collapse and reform. Sometimes they reform wrong — animated, aggressive, purposeless.'
  },

  {
    id: 'gorvun_boss',
    name: 'Gorvun the Trembling',
    description: 'The corrupted avatar of the earth god — a horned warden bearing a shield he no longer plants, and a flail that cracks the ground with every swing.',
    sprite: 'boss_gorvun',
    zone: ElementType.EARTH,
    baseLevel: 16,
    stats: { baseHp: 2200, baseMana: 150, baseAtk: 90, baseDef: 60, baseSpd: 5, baseMagicAtk: 70, baseMagicDef: 50 },
    element: ElementType.EARTH,
    weakness: ElementType.WIND,
    skills: ['terra_surge', 'seismic_slam', 'stone_shield'],
    loot: [
      { itemId: 'gorvun_fragment', dropRate: 1.0, minQty: 1, maxQty: 1 },
      { itemId: 'ancient_stone_rune', dropRate: 1.0, minQty: 5, maxQty: 8 },
      { itemId: 'gorvun_hammer', dropRate: 0.22, minQty: 1, maxQty: 1 },
      { itemId: 'titan_earth_armor', dropRate: 0.12, minQty: 1, maxQty: 1 },
      { itemId: 'fragment_of_permanence', dropRate: 0.035, minQty: 1, maxQty: 1 }
    ],
    baseXp: 1500,
    baseGold: { min: 180, max: 350 },
    isBoss: true,
    isElite: false,
    spawnWeight: 0,
    aggroRange: 999,
    attackRange: 200,
    moveSpeed: 60,
    behavior: 'charger',
    lore: 'Gorvun has not moved intentionally in three centuries. Now he cannot stop. The curse leaves the keeper-gods two things: a shield, and a flail. The hero must end what Malachar started — and keep the last promise in Gorvun\'s place.'
  },

  // ── ZEPHYR PEAKS (Wind) ──────────────────────────────────────

  // Creature concept: a ranged harpy that keeps its distance and dive-bombs
  // if the player gets too close — the kind of enemy that punishes greedy approaches.
  {
    id: 'gale_harpy',
    name: 'Gale Harpy',
    description: 'A winged predator native to Zephyr Peaks, now maddened by the tempest.',
    sprite: 'enemy_gale_harpy',
    zone: ElementType.WIND,
    baseLevel: 12,
    stats: { baseHp: 100, baseMana: 35, baseAtk: 25, baseDef: 7, baseSpd: 16, baseMagicAtk: 28, baseMagicDef: 12 },
    element: ElementType.WIND,
    weakness: ElementType.ICE,
    skills: ['gale_step'],
    loot: [
      { itemId: 'zephyr_feather', dropRate: 0.65, minQty: 1, maxQty: 3 },
      { itemId: 'stormstone', dropRate: 0.35, minQty: 1, maxQty: 2 },
      { itemId: 'harpy_bow', dropRate: 0.025, minQty: 1, maxQty: 1 }
    ],
    baseXp: 45,
    baseGold: { min: 7, max: 18 },
    isBoss: false,
    isElite: false,
    spawnWeight: 4,
    aggroRange: 200,
    attackRange: 180,
    moveSpeed: 160,
    behavior: 'ranged',
    projectileColor: 0xaaddff,
    lore: 'Harpies nested in the cloud temples and guarded the paths up to Sylvael\'s domain. They were protective, not aggressive. Then the storm came.'
  },

  // Creature concept: a heavy charger that swoops from altitude —
  // telegraphed enough to dodge, devastating if you don't.
  {
    id: 'storm_eagle',
    name: 'Storm Eagle',
    description: 'A compact, horn-crested raptor crackling with static electricity.',
    sprite: 'enemy_storm_eagle',
    zone: ElementType.WIND,
    baseLevel: 13,
    stats: { baseHp: 160, baseMana: 25, baseAtk: 35, baseDef: 12, baseSpd: 13, baseMagicAtk: 22, baseMagicDef: 15 },
    element: ElementType.WIND,
    weakness: ElementType.ICE,
    skills: ['thunder_bolt'],
    loot: [
      { itemId: 'stormstone', dropRate: 0.60, minQty: 1, maxQty: 2 },
      { itemId: 'zephyr_feather', dropRate: 0.45, minQty: 1, maxQty: 2 },
      { itemId: 'storm_eagle_feather_cloak', dropRate: 0.018, minQty: 1, maxQty: 1 }
    ],
    baseXp: 55,
    baseGold: { min: 8, max: 20 },
    isBoss: false,
    isElite: false,
    spawnWeight: 3,
    aggroRange: 220,
    attackRange: 200,
    moveSpeed: 130,
    behavior: 'charger',
    lore: 'The raptors that nested near Zephyr Peaks\' storm summits absorbed ambient electricity for generations. The storm bent their crests into horns. They were beautiful from a safe distance. There is no safe distance now.'
  },

  // Creature concept: ethereal pure ranged — no physical presence, only magic
  // projection; makes the player feel like they're fighting the wind itself.
  {
    id: 'wind_wraith',
    name: 'Wind Wraith',
    description: 'A hooded being of compressed wind with a single red eye, phasing through obstacles.',
    sprite: 'enemy_wind_wraith',
    zone: ElementType.WIND,
    baseLevel: 13,
    stats: { baseHp: 75, baseMana: 70, baseAtk: 15, baseDef: 2, baseSpd: 18, baseMagicAtk: 42, baseMagicDef: 25 },
    element: ElementType.WIND,
    weakness: ElementType.ICE,
    skills: ['tornado_spin'],
    loot: [
      { itemId: 'cloudweave_silk', dropRate: 0.55, minQty: 1, maxQty: 2 },
      { itemId: 'zephyr_feather', dropRate: 0.30, minQty: 1, maxQty: 1 },
      { itemId: 'wraith_amulet', dropRate: 0.012, minQty: 1, maxQty: 1 }
    ],
    baseXp: 38,
    baseGold: { min: 5, max: 14 },
    isBoss: false,
    isElite: false,
    spawnWeight: 3,
    aggroRange: 180,
    attackRange: 100,
    moveSpeed: 180,
    behavior: 'ranged',
    projectileColor: 0xaaddff,
    lore: 'Natural concentrations of wind energy. They existed long before Sylvael, inhabiting the Peaks as strange neutral presences. The curse gave them purpose: violence.'
  },

  // Creature concept: a chaotic chaser that spins and grows — the constant
  // motion makes it hard to read its direction until it's already on you.
  {
    id: 'cyclone_sprite',
    name: 'Cyclone Sprite',
    description: 'A knot of wind condensed into a pale sphere, spinning too fast to read its course.',
    sprite: 'enemy_cyclone_sprite',
    zone: ElementType.WIND,
    baseLevel: 12,
    stats: { baseHp: 65, baseMana: 45, baseAtk: 18, baseDef: 5, baseSpd: 20, baseMagicAtk: 30, baseMagicDef: 14 },
    element: ElementType.WIND,
    weakness: ElementType.ICE,
    skills: ['gale_step'],
    loot: [
      { itemId: 'zephyr_feather', dropRate: 0.70, minQty: 1, maxQty: 3 },
      { itemId: 'minor_mana_potion', dropRate: 0.15, minQty: 1, maxQty: 1 }
    ],
    baseXp: 22,
    baseGold: { min: 3, max: 10 },
    isBoss: false,
    isElite: false,
    spawnWeight: 5,
    aggroRange: 180,
    attackRange: 90,
    moveSpeed: 200,
    behavior: 'chaser',
    lore: 'Sylvael created sprites to carry pollen and seeds across the mountains. Direction-less now, they just spin.'
  },

  // Creature concept: a patrolling winged elder above the floating islands — slow,
  // imposing, treats the player as a footnote until they can't be ignored.
  {
    id: 'sky_titan',
    name: 'Sky Titan',
    description: 'An elite winged giant, paler than the clouds it once carried, drifting above the shattered islands.',
    sprite: 'enemy_sky_titan',
    zone: ElementType.WIND,
    baseLevel: 15,
    stats: { baseHp: 600, baseMana: 80, baseAtk: 65, baseDef: 25, baseSpd: 7, baseMagicAtk: 55, baseMagicDef: 30 },
    element: ElementType.WIND,
    weakness: ElementType.ICE,
    skills: ['tornado_spin', 'skyward_strike'],
    loot: [
      { itemId: 'stormstone', dropRate: 0.80, minQty: 2, maxQty: 4 },
      { itemId: 'cloudweave_silk', dropRate: 0.70, minQty: 2, maxQty: 3 },
      { itemId: 'sky_titan_bow', dropRate: 0.07, minQty: 1, maxQty: 1 },
      { itemId: 'air_walker_boots', dropRate: 0.04, minQty: 1, maxQty: 1 }
    ],
    baseXp: 220,
    baseGold: { min: 40, max: 100 },
    isBoss: false,
    isElite: true,
    spawnWeight: 0.4,
    aggroRange: 90,
    attackRange: 100,
    moveSpeed: 70,
    behavior: 'patrol',
    patrolRadius: 300,
    lore: 'These titans predate Sylvael. She arrived and they made space for her. Now the space they made is filled with storm, and they wander it lost.'
  },

  // NEW ENEMY — Zephyr Peaks: a wind summoner that calls cyclone sprites
  {
    id: 'storm_caller',
    name: 'Storm Caller',
    description: 'A small horned figure hooded in wind, motionless in the tempest, its whispers weaving new cyclone sprites from thin air.',
    sprite: 'enemy_storm_caller',
    zone: ElementType.WIND,
    baseLevel: 13,
    stats: { baseHp: 130, baseMana: 100, baseAtk: 12, baseDef: 8, baseSpd: 6, baseMagicAtk: 38, baseMagicDef: 22 },
    element: ElementType.WIND,
    weakness: ElementType.ICE,
    skills: ['tornado_spin'],
    loot: [
      { itemId: 'cloudweave_silk', dropRate: 0.60, minQty: 1, maxQty: 2 },
      { itemId: 'stormstone', dropRate: 0.45, minQty: 1, maxQty: 2 },
      { itemId: 'minor_mana_potion', dropRate: 0.15, minQty: 1, maxQty: 1 }
    ],
    baseXp: 65,
    baseGold: { min: 10, max: 24 },
    isBoss: false,
    isElite: false,
    spawnWeight: 1,
    aggroRange: 160,
    attackRange: 80,
    moveSpeed: 45,
    behavior: 'summoner',
    lore: 'Sylvael\'s priests did not die when the storm took the Peaks. They became the storm. These are what remain of their rituals — endless, purposeless, terrible.'
  },

  // NEW ENEMY — Zephyr Peaks: glass-fragile ranged sniper on exposed ridgelines
  {
    id: 'cloudpiercer',
    name: 'Cloudpiercer',
    description: 'A small hooded creature whose single horn condenses a lance of air, fired across vast distances before it slips back into cloud cover.',
    sprite: 'enemy_cloudpiercer',
    zone: ElementType.WIND,
    baseLevel: 14,
    stats: { baseHp: 70, baseMana: 80, baseAtk: 10, baseDef: 4, baseSpd: 15, baseMagicAtk: 45, baseMagicDef: 20 },
    element: ElementType.WIND,
    weakness: ElementType.ICE,
    skills: ['gale_step'],
    loot: [
      { itemId: 'zephyr_feather', dropRate: 0.70, minQty: 2, maxQty: 3 },
      { itemId: 'stormstone', dropRate: 0.30, minQty: 1, maxQty: 1 },
      { itemId: 'cloudweave_silk', dropRate: 0.20, minQty: 1, maxQty: 1 }
    ],
    baseXp: 40,
    baseGold: { min: 6, max: 16 },
    isBoss: false,
    isElite: false,
    spawnWeight: 2,
    aggroRange: 250,
    attackRange: 320,
    moveSpeed: 100,
    behavior: 'ranged',
    projectileColor: 0xaaddff,
    lore: 'Some things in Zephyr Peaks evolved to be invisible from a distance. The cloudpiercer is one of those things. The first time you see one, it has already seen you.'
  },

  {
    id: 'sylvael_boss',
    name: 'Sylvael the Tempest',
    description: 'What remains of the phoenix goddess of wind — a pale horned visage riding an endless hurricane.',
    sprite: 'boss_sylvael',
    zone: ElementType.WIND,
    baseLevel: 18,
    stats: { baseHp: 2000, baseMana: 300, baseAtk: 75, baseDef: 30, baseSpd: 20, baseMagicAtk: 110, baseMagicDef: 55 },
    element: ElementType.WIND,
    weakness: ElementType.ICE,
    skills: ['gale_step', 'tornado_spin', 'skyward_strike'],
    loot: [
      { itemId: 'sylvael_plume', dropRate: 1.0, minQty: 1, maxQty: 1 },
      { itemId: 'zephyr_feather', dropRate: 1.0, minQty: 6, maxQty: 10 },
      { itemId: 'phoenix_bow', dropRate: 0.20, minQty: 1, maxQty: 1 },
      { itemId: 'tempest_cloak', dropRate: 0.12, minQty: 1, maxQty: 1 },
      { itemId: 'ring_of_the_wind', dropRate: 0.04, minQty: 1, maxQty: 1 }
    ],
    baseXp: 1400,
    baseGold: { min: 165, max: 320 },
    isBoss: true,
    isElite: false,
    spawnWeight: 0,
    aggroRange: 999,
    attackRange: 350,
    moveSpeed: 220,
    behavior: 'ranged',
    projectileColor: 0xaaddff,
    lore: 'Sylvael\'s beauty is gone. What remains is motion — pure, uncontrolled, devastating. Those who have seen more than one fallen god report the same thing: under the curse, they all wear the same face. The hero cannot reason with a storm.'
  },

  // ── ABYSSMAR (Water) ─────────────────────────────────────────

  // Creature concept: slow tank that charges when triggered —
  // still as a puddle until it isn't.
  {
    id: 'tide_crawler',
    name: 'Tide Crawler',
    description: 'A gelatinous scuttler with fixed yellow eyes, swollen by Thalymor\'s corrupted tides.',
    sprite: 'enemy_tide_crawler',
    zone: ElementType.WATER,
    baseLevel: 14,
    stats: { baseHp: 160, baseMana: 15, baseAtk: 28, baseDef: 22, baseSpd: 6, baseMagicAtk: 12, baseMagicDef: 16 },
    element: ElementType.WATER,
    weakness: ElementType.LIGHTNING,
    skills: [],
    loot: [
      { itemId: 'deep_coral', dropRate: 0.55, minQty: 1, maxQty: 2 },
      { itemId: 'sea_glass', dropRate: 0.65, minQty: 1, maxQty: 3 },
      { itemId: 'tidal_shell_armor', dropRate: 0.02, minQty: 1, maxQty: 1 }
    ],
    baseXp: 50,
    baseGold: { min: 8, max: 20 },
    isBoss: false,
    isElite: false,
    spawnWeight: 3,
    aggroRange: 130,
    attackRange: 60,
    moveSpeed: 70,
    behavior: 'charger',
    lore: 'The coast had thousands of these before the flood — a nuisance at worst; children caught them in buckets to watch them glow. They\'ve grown to the size of barrels now, and they hunt.'
  },

  // Creature concept: spectral ranged shooter that keeps water between
  // itself and the player — the drowned memory as an aggressor.
  {
    id: 'sea_wraith',
    name: 'Sea Wraith',
    description: 'A spectral figure of a drowned sailor, bound to the submerged ruins.',
    sprite: 'enemy_sea_wraith',
    zone: ElementType.WATER,
    baseLevel: 15,
    stats: { baseHp: 90, baseMana: 80, baseAtk: 16, baseDef: 5, baseSpd: 11, baseMagicAtk: 48, baseMagicDef: 28 },
    element: ElementType.WATER,
    weakness: ElementType.LIGHTNING,
    skills: ['tidal_wave'],
    loot: [
      { itemId: 'drowned_relic', dropRate: 0.50, minQty: 1, maxQty: 2 },
      { itemId: 'sea_glass', dropRate: 0.45, minQty: 1, maxQty: 2 },
      { itemId: 'sailor_ghost_ring', dropRate: 0.015, minQty: 1, maxQty: 1 }
    ],
    baseXp: 42,
    baseGold: { min: 6, max: 16 },
    isBoss: false,
    isElite: false,
    spawnWeight: 3,
    aggroRange: 160,
    attackRange: 200,
    moveSpeed: 80,
    behavior: 'ranged',
    projectileColor: 0x2266ff,
    lore: 'When the sea rose, not everyone escaped. Their spirits remain. They don\'t remember who they were — only that the water took them.'
  },

  // Creature concept: a territorial patrol — the coral reef as border guard,
  // making the underwater ruins feel like occupied territory.
  {
    id: 'coral_golem',
    name: 'Coral Golem',
    description: 'A hulking golem of living coral, rose-pink in the drowned grey — the last vivid color left in Abyssmar.',
    sprite: 'enemy_coral_golem',
    zone: ElementType.WATER,
    baseLevel: 15,
    stats: { baseHp: 280, baseMana: 0, baseAtk: 38, baseDef: 30, baseSpd: 4, baseMagicAtk: 5, baseMagicDef: 40 },
    element: ElementType.WATER,
    weakness: ElementType.LIGHTNING,
    skills: [],
    loot: [
      { itemId: 'deep_coral', dropRate: 0.80, minQty: 2, maxQty: 4 },
      { itemId: 'coral_chest', dropRate: 0.045, minQty: 1, maxQty: 1 }
    ],
    baseXp: 72,
    baseGold: { min: 12, max: 28 },
    isBoss: false,
    isElite: false,
    spawnWeight: 2,
    aggroRange: 90,
    attackRange: 70,
    moveSpeed: 40,
    behavior: 'patrol',
    patrolRadius: 190,
    lore: 'Thalymor grew these coral formations over centuries to protect the seabed. The protection instinct survived the curse; the judgment did not. It is still pink. It is the only thing that didn\'t fade.'
  },

  // Creature concept: a crouched trench-thing with a hooked blade — faster than
  // it looks, closing distance from off-screen in seconds.
  {
    id: 'depth_serpent',
    name: 'Depth Lurker',
    description: 'A crouched creature of the deep trenches, gripping a hooked blade of black coral. Faster than it looks — much faster.',
    sprite: 'enemy_depth_serpent',
    zone: ElementType.WATER,
    baseLevel: 16,
    stats: { baseHp: 200, baseMana: 40, baseAtk: 42, baseDef: 18, baseSpd: 10, baseMagicAtk: 28, baseMagicDef: 14 },
    element: ElementType.WATER,
    weakness: ElementType.LIGHTNING,
    skills: ['tidal_wave'],
    loot: [
      { itemId: 'thalymor_scale', dropRate: 0.15, minQty: 1, maxQty: 1 },
      { itemId: 'deep_coral', dropRate: 0.60, minQty: 1, maxQty: 2 },
      { itemId: 'depth_serpent_fang_dagger', dropRate: 0.022, minQty: 1, maxQty: 1 }
    ],
    baseXp: 68,
    baseGold: { min: 10, max: 24 },
    isBoss: false,
    isElite: false,
    spawnWeight: 2,
    aggroRange: 150,
    attackRange: 110,
    moveSpeed: 90,
    behavior: 'chaser',
    lore: 'The deep trenches were always inhabited. Thalymor kept them contained to the depths as a courtesy to surface-dwellers. That courtesy expired with the curse.'
  },

  // NEW ENEMY — Abyssmar: water summoner that calls tide crawlers
  {
    id: 'tide_shaper',
    name: 'Tide Shaper',
    description: 'A drifting sphere of condensed deep water, pulsing with bioluminescent patterns that summon smaller sea creatures from the dark.',
    sprite: 'enemy_tide_shaper',
    zone: ElementType.WATER,
    baseLevel: 15,
    stats: { baseHp: 145, baseMana: 90, baseAtk: 14, baseDef: 8, baseSpd: 5, baseMagicAtk: 35, baseMagicDef: 20 },
    element: ElementType.WATER,
    weakness: ElementType.LIGHTNING,
    skills: ['tidal_wave'],
    loot: [
      { itemId: 'deep_coral', dropRate: 0.60, minQty: 1, maxQty: 2 },
      { itemId: 'sea_glass', dropRate: 0.50, minQty: 1, maxQty: 2 },
      { itemId: 'minor_mana_potion', dropRate: 0.12, minQty: 1, maxQty: 1 }
    ],
    baseXp: 75,
    baseGold: { min: 11, max: 26 },
    isBoss: false,
    isElite: false,
    spawnWeight: 1,
    aggroRange: 140,
    attackRange: 80,
    moveSpeed: 35,
    behavior: 'summoner',
    lore: 'Before the flood, these creatures lived in the deepest trenches where Thalymor\'s dreams drifted. The dreams have soured. So have they.'
  },

  // NEW ENEMY — Abyssmar: a ghost that chases through ruins relentlessly
  {
    id: 'abyssal_shade',
    name: 'Abyssal Shade',
    description: 'The outline of a person, rendered in water pressure and grief, dragging a rusted fisherman\'s hook. It fixates on the living and does not stop.',
    sprite: 'enemy_abyssal_shade',
    zone: ElementType.WATER,
    baseLevel: 16,
    stats: { baseHp: 100, baseMana: 50, baseAtk: 35, baseDef: 6, baseSpd: 14, baseMagicAtk: 30, baseMagicDef: 15 },
    element: ElementType.WATER,
    weakness: ElementType.LIGHTNING,
    skills: ['tidal_wave'],
    loot: [
      { itemId: 'drowned_relic', dropRate: 0.65, minQty: 1, maxQty: 2 },
      { itemId: 'sea_glass', dropRate: 0.35, minQty: 1, maxQty: 1 },
      { itemId: 'minor_health_potion', dropRate: 0.08, minQty: 1, maxQty: 1 }
    ],
    baseXp: 52,
    baseGold: { min: 8, max: 18 },
    isBoss: false,
    isElite: false,
    spawnWeight: 2,
    aggroRange: 200,
    attackRange: 60,
    moveSpeed: 105,
    behavior: 'chaser',
    lore: 'Not every ghost in Abyssmar was a sailor. Some were just people who lived near the water and never imagined it would rise. Some still clutch a curved tool — a gaff, a kelp sickle. Lives interrupted mid-gesture.'
  },

  {
    id: 'drowned_knight',
    name: 'Drowned Knight',
    description: 'An elite armored warrior who died defending Abyssmar when the sea rose. Still fighting.',
    sprite: 'enemy_drowned_knight',
    zone: ElementType.WATER,
    baseLevel: 18,
    stats: { baseHp: 620, baseMana: 60, baseAtk: 60, baseDef: 45, baseSpd: 7, baseMagicAtk: 30, baseMagicDef: 35 },
    element: ElementType.WATER,
    weakness: ElementType.LIGHTNING,
    skills: ['stone_shield', 'seismic_slam'],
    loot: [
      { itemId: 'drowned_relic', dropRate: 0.85, minQty: 2, maxQty: 3 },
      { itemId: 'drowned_knight_sword', dropRate: 0.09, minQty: 1, maxQty: 1 },
      { itemId: 'seaguard_armor', dropRate: 0.06, minQty: 1, maxQty: 1 },
      { itemId: 'thalymor_scale', dropRate: 0.02, minQty: 1, maxQty: 1 }
    ],
    baseXp: 240,
    baseGold: { min: 45, max: 110 },
    isBoss: false,
    isElite: true,
    spawnWeight: 0.4,
    aggroRange: 80,
    attackRange: 70,
    moveSpeed: 60,
    behavior: 'patrol',
    patrolRadius: 150,
    lore: 'They stayed at their posts when the flood came. Honor, or refusal to accept death. Now they guard ruins of the city they failed to save.'
  },

  {
    id: 'thalymor_boss',
    name: 'Thalymor the Deluge',
    description: 'The corrupted avatar of the leviathan god — a horned warden of the drowned city, shield in one hand, flail striking like the tide.',
    sprite: 'boss_thalymor',
    zone: ElementType.WATER,
    baseLevel: 20,
    stats: { baseHp: 2400, baseMana: 250, baseAtk: 85, baseDef: 50, baseSpd: 8, baseMagicAtk: 100, baseMagicDef: 60 },
    element: ElementType.WATER,
    weakness: ElementType.LIGHTNING,
    skills: ['tidal_wave', 'healing_current', 'frost_lance'],
    loot: [
      { itemId: 'thalymor_scale', dropRate: 1.0, minQty: 1, maxQty: 1 },
      { itemId: 'deep_coral', dropRate: 1.0, minQty: 6, maxQty: 10 },
      { itemId: 'leviathan_staff', dropRate: 0.22, minQty: 1, maxQty: 1 },
      { itemId: 'abyssal_chest', dropRate: 0.13, minQty: 1, maxQty: 1 },
      { itemId: 'tidal_ring', dropRate: 0.04, minQty: 1, maxQty: 1 }
    ],
    baseXp: 1600,
    baseGold: { min: 190, max: 360 },
    isBoss: true,
    isElite: false,
    spawnWeight: 0,
    aggroRange: 999,
    attackRange: 400,
    moveSpeed: 70,
    behavior: 'ranged',
    projectileColor: 0x2266ff,
    lore: 'The curse leaves the keeper-gods a shield and a flail; Thalymor\'s are made of the sea. In the flooded ruins of Abyssmar, fighting him means fighting in his element. The patience is gone. Only the depth remains.'
  },

  // ── VOLTERRA (Lightning) ─────────────────────────────────────

  // Creature concept: a swarm of electric constructs that circles
  // the player and fires — overwhelming through sheer quantity.
  {
    id: 'spark_imp',
    name: 'Spark Imp',
    description: 'A small creature crackling with uncontrolled electrical energy.',
    sprite: 'enemy_spark_imp',
    zone: ElementType.LIGHTNING,
    baseLevel: 16,
    stats: { baseHp: 75, baseMana: 50, baseAtk: 20, baseDef: 5, baseSpd: 15, baseMagicAtk: 35, baseMagicDef: 12 },
    element: ElementType.LIGHTNING,
    weakness: ElementType.EARTH,
    skills: ['thunder_bolt'],
    loot: [
      { itemId: 'storm_shard', dropRate: 0.65, minQty: 1, maxQty: 3 },
      { itemId: 'charged_metal', dropRate: 0.40, minQty: 1, maxQty: 2 },
      { itemId: 'minor_mana_potion', dropRate: 0.12, minQty: 1, maxQty: 1 }
    ],
    baseXp: 45,
    baseGold: { min: 7, max: 18 },
    isBoss: false,
    isElite: false,
    spawnWeight: 5,
    aggroRange: 180,
    attackRange: 200,
    moveSpeed: 145,
    behavior: 'ranged',
    projectileColor: 0xffee00,
    lore: 'The original small electrical constructs Volkran\'s engineers built to power household devices. Now they discharge randomly.'
  },

  // Creature concept: a drake that swoops and charges in long arcing runs —
  // the charge pattern with high speed makes it feel like a guided missile.
  {
    id: 'thunder_drake',
    name: 'Thunder Drake',
    description: 'A winged storm-elemental that channels Volkran\'s lightning through its wings.',
    sprite: 'enemy_thunder_drake',
    zone: ElementType.LIGHTNING,
    baseLevel: 17,
    stats: { baseHp: 190, baseMana: 55, baseAtk: 40, baseDef: 16, baseSpd: 14, baseMagicAtk: 50, baseMagicDef: 20 },
    element: ElementType.LIGHTNING,
    weakness: ElementType.EARTH,
    skills: ['chain_lightning'],
    loot: [
      { itemId: 'thunder_rune', dropRate: 0.45, minQty: 1, maxQty: 2 },
      { itemId: 'storm_shard', dropRate: 0.55, minQty: 1, maxQty: 2 },
      { itemId: 'thunder_drake_fang', dropRate: 0.08, minQty: 1, maxQty: 1 },
      { itemId: 'storm_sword', dropRate: 0.018, minQty: 1, maxQty: 1 }
    ],
    baseXp: 65,
    baseGold: { min: 10, max: 24 },
    isBoss: false,
    isElite: false,
    spawnWeight: 3,
    aggroRange: 200,
    attackRange: 250,
    moveSpeed: 120,
    behavior: 'charger',
    lore: 'Drakes nested in Volterra\'s storm towers before the engineers built over them. They were tolerated because they helped discharge excess energy. Now there\'s nothing to tolerate.'
  },

  // Creature concept: an anchored ranged spirit that cannot move far
  // but has devastating range — a turret made of grief.
  {
    id: 'chain_revenant',
    name: 'Chain Revenant',
    description: 'The spirit of a grid worker, anchored where it died, gripping an arc of solidified lightning like a blade.',
    sprite: 'enemy_chain_revenant',
    zone: ElementType.LIGHTNING,
    baseLevel: 17,
    stats: { baseHp: 110, baseMana: 90, baseAtk: 18, baseDef: 6, baseSpd: 9, baseMagicAtk: 52, baseMagicDef: 25 },
    element: ElementType.LIGHTNING,
    weakness: ElementType.EARTH,
    skills: ['chain_lightning', 'thunder_bolt'],
    loot: [
      { itemId: 'charged_metal', dropRate: 0.60, minQty: 1, maxQty: 2 },
      { itemId: 'thunder_rune', dropRate: 0.35, minQty: 1, maxQty: 1 },
      { itemId: 'revenant_ring', dropRate: 0.015, minQty: 1, maxQty: 1 }
    ],
    baseXp: 48,
    baseGold: { min: 7, max: 16 },
    isBoss: false,
    isElite: false,
    spawnWeight: 3,
    aggroRange: 150,
    attackRange: 220,
    moveSpeed: 85,
    behavior: 'ranged',
    projectileColor: 0xffee00,
    lore: 'When the grid destabilized, workers died in the discharge. Their spirits are anchored to the machines that killed them. They attack anything that comes close enough to remind them of it.'
  },

  // Creature concept: hooded scavengers in insulator-cloth that dart along the
  // dead grid — the fastest enemies in Volterra, dangerous in numbers.
  {
    id: 'volt_hound',
    name: 'Volt Skirmisher',
    description: 'A hooded scavenger wrapped in stolen insulator-cloth, fists full of charge, hunting in coordinated packs.',
    sprite: 'enemy_volt_hound',
    zone: ElementType.LIGHTNING,
    baseLevel: 16,
    stats: { baseHp: 120, baseMana: 30, baseAtk: 30, baseDef: 10, baseSpd: 17, baseMagicAtk: 25, baseMagicDef: 10 },
    element: ElementType.LIGHTNING,
    weakness: ElementType.EARTH,
    skills: ['thunder_bolt'],
    loot: [
      { itemId: 'storm_shard', dropRate: 0.60, minQty: 1, maxQty: 2 },
      { itemId: 'volt_hound_pelt', dropRate: 0.25, minQty: 1, maxQty: 1 },
      { itemId: 'minor_health_potion', dropRate: 0.10, minQty: 1, maxQty: 1 }
    ],
    baseXp: 38,
    baseGold: { min: 5, max: 15 },
    isBoss: false,
    isElite: false,
    spawnWeight: 4,
    aggroRange: 200,
    attackRange: 70,
    moveSpeed: 155,
    behavior: 'chaser',
    lore: 'They lived at the edge of the grid long before the fall — hunched looters who stripped the relays and wrapped themselves in insulation to walk between the arcs. The engineers\' protocols assumed they feared something. That assumption no longer holds.'
  },

  // NEW ENEMY — Volterra: a floating construct that patrols the grid nodes
  {
    id: 'arc_node',
    name: 'Arc Node',
    description: 'A drifting sphere of contained lightning, humming along the dead grid\'s programmed routes, discharging lethal arcs at anything that breaks its patrol.',
    sprite: 'enemy_arc_node',
    zone: ElementType.LIGHTNING,
    baseLevel: 16,
    stats: { baseHp: 95, baseMana: 40, baseAtk: 8, baseDef: 15, baseSpd: 5, baseMagicAtk: 40, baseMagicDef: 18 },
    element: ElementType.LIGHTNING,
    weakness: ElementType.EARTH,
    skills: ['thunder_bolt'],
    loot: [
      { itemId: 'charged_metal', dropRate: 0.70, minQty: 1, maxQty: 2 },
      { itemId: 'storm_shard', dropRate: 0.45, minQty: 1, maxQty: 1 },
      { itemId: 'minor_mana_potion', dropRate: 0.10, minQty: 1, maxQty: 1 }
    ],
    baseXp: 42,
    baseGold: { min: 6, max: 16 },
    isBoss: false,
    isElite: false,
    spawnWeight: 3,
    aggroRange: 120,
    attackRange: 180,
    moveSpeed: 45,
    behavior: 'patrol',
    patrolRadius: 250,
    lore: 'Volkran\'s engineers built these to maintain the grid. They still maintain it. Maintenance, in the current context, means destroying anything that touches the lines.'
  },

  // NEW ENEMY — Volterra: the pale imprint of the last engineer, still assembling —
  // a summoner made of habit that spawns arc nodes
  {
    id: 'grid_architect',
    name: 'Grid Architect',
    description: 'A gaunt, pale figure drifting through the collapsed workshops, assembling new arc nodes with slow, remembered gestures.',
    sprite: 'enemy_grid_architect',
    zone: ElementType.LIGHTNING,
    baseLevel: 18,
    stats: { baseHp: 200, baseMana: 110, baseAtk: 22, baseDef: 18, baseSpd: 4, baseMagicAtk: 45, baseMagicDef: 28 },
    element: ElementType.LIGHTNING,
    weakness: ElementType.EARTH,
    skills: ['chain_lightning'],
    loot: [
      { itemId: 'charged_metal', dropRate: 0.75, minQty: 2, maxQty: 3 },
      { itemId: 'thunder_rune', dropRate: 0.50, minQty: 1, maxQty: 2 },
      { itemId: 'storm_shard', dropRate: 0.60, minQty: 1, maxQty: 2 }
    ],
    baseXp: 95,
    baseGold: { min: 14, max: 32 },
    isBoss: false,
    isElite: false,
    spawnWeight: 1,
    aggroRange: 150,
    attackRange: 90,
    moveSpeed: 35,
    behavior: 'summoner',
    lore: 'The last engineer of Volterra built it to continue his work after he was gone. He poured in his gestures, his plans, his precision — and without meaning to, his silhouette. It does not know that. It also does not know the work already destroyed everything.'
  },

  {
    id: 'storm_herald',
    name: 'Storm Herald',
    description: 'An elite knight of pure lightning, sword and shield arcing, created by Volkran\'s last engineers.',
    sprite: 'enemy_storm_herald',
    zone: ElementType.LIGHTNING,
    baseLevel: 20,
    stats: { baseHp: 700, baseMana: 120, baseAtk: 70, baseDef: 30, baseSpd: 12, baseMagicAtk: 85, baseMagicDef: 45 },
    element: ElementType.LIGHTNING,
    weakness: ElementType.EARTH,
    skills: ['chain_lightning', 'volt_dash', 'thunder_bolt'],
    loot: [
      { itemId: 'volkran_coil', dropRate: 0.60, minQty: 1, maxQty: 2 },
      { itemId: 'thunder_rune', dropRate: 0.80, minQty: 2, maxQty: 3 },
      { itemId: 'herald_staff', dropRate: 0.07, minQty: 1, maxQty: 1 },
      { itemId: 'storm_herald_plate', dropRate: 0.045, minQty: 1, maxQty: 1 }
    ],
    baseXp: 260,
    baseGold: { min: 50, max: 120 },
    isBoss: false,
    isElite: true,
    spawnWeight: 0.35,
    aggroRange: 100,
    attackRange: 300,
    moveSpeed: 100,
    behavior: 'ranged',
    projectileColor: 0xffee00,
    lore: 'The last Volterra engineers, before dying, tried to create artificial wielders of Volkran\'s power. They succeeded. The heralds carry out their last order: eliminate all intruders.'
  },

  {
    id: 'volkran_boss',
    name: 'Volkran the Stormbringer',
    description: 'What remains of the colossus god of lightning — a horned visage of storm, precision collapsed into omnidirectional devastation.',
    sprite: 'boss_volkran',
    zone: ElementType.LIGHTNING,
    baseLevel: 22,
    stats: { baseHp: 2600, baseMana: 350, baseAtk: 95, baseDef: 45, baseSpd: 15, baseMagicAtk: 120, baseMagicDef: 65 },
    element: ElementType.LIGHTNING,
    weakness: ElementType.EARTH,
    skills: ['chain_lightning', 'volt_dash', 'thunder_bolt'],
    loot: [
      { itemId: 'volkran_coil', dropRate: 1.0, minQty: 1, maxQty: 1 },
      { itemId: 'thunder_rune', dropRate: 1.0, minQty: 6, maxQty: 10 },
      { itemId: 'volkran_hammer', dropRate: 0.23, minQty: 1, maxQty: 1 },
      { itemId: 'storm_plate', dropRate: 0.13, minQty: 1, maxQty: 1 },
      { itemId: 'eye_of_the_storm_ring', dropRate: 0.04, minQty: 1, maxQty: 1 }
    ],
    baseXp: 1750,
    baseGold: { min: 210, max: 400 },
    isBoss: true,
    isElite: false,
    spawnWeight: 0,
    aggroRange: 999,
    attackRange: 500,
    moveSpeed: 130,
    behavior: 'ranged',
    projectileColor: 0xffee00,
    lore: 'The engineers measured him. Their last instruments recorded the colossus losing his shape — collapsing toward something horned, the same face every fallen god wears. No one was left to read the measurements.'
  },

  // ── GLACIEM (Ice) ─────────────────────────────────────────────

  // Creature concept: a silent swooping hunter through blizzard conditions —
  // fast, aggressive; the player never hears it coming, by design.
  {
    id: 'frost_wolf',
    name: 'Frost Owl',
    description: 'A horned white owl of the frozen tundra, hunting in total silence through Crysthea\'s blizzard.',
    sprite: 'enemy_frost_wolf',
    zone: ElementType.ICE,
    baseLevel: 18,
    stats: { baseHp: 150, baseMana: 20, baseAtk: 32, baseDef: 12, baseSpd: 16, baseMagicAtk: 20, baseMagicDef: 12 },
    element: ElementType.ICE,
    weakness: ElementType.FIRE,
    skills: ['frost_lance'],
    loot: [
      { itemId: 'glaciem_ice_shard', dropRate: 0.60, minQty: 1, maxQty: 2 },
      { itemId: 'frozen_essence', dropRate: 0.35, minQty: 1, maxQty: 1 },
      { itemId: 'frost_wolf_pelt', dropRate: 0.20, minQty: 1, maxQty: 1 }
    ],
    baseXp: 55,
    baseGold: { min: 8, max: 22 },
    isBoss: false,
    isElite: false,
    spawnWeight: 4,
    aggroRange: 180,
    attackRange: 70,
    moveSpeed: 130,
    behavior: 'chaser',
    lore: 'The owls of Glaciem hunted above the tundra in silence, and travelers called them a good omen — an owl in flight meant the storm had passed. The storm no longer passes. They fly anyway.'
  },

  // Creature concept: territorial patrol golem that moves circuit-like
  // through frozen corridors — feels like navigating a minefield.
  {
    id: 'ice_golem',
    name: 'Ice Golem',
    description: 'A knight carved from a single block of glacial ice, sword and shield included, now blind to friend and foe.',
    sprite: 'enemy_ice_golem',
    zone: ElementType.ICE,
    baseLevel: 19,
    stats: { baseHp: 300, baseMana: 0, baseAtk: 45, baseDef: 35, baseSpd: 3, baseMagicAtk: 10, baseMagicDef: 45 },
    element: ElementType.ICE,
    weakness: ElementType.FIRE,
    skills: [],
    loot: [
      { itemId: 'glaciem_ice_shard', dropRate: 0.80, minQty: 2, maxQty: 4 },
      { itemId: 'ancient_frost_rune', dropRate: 0.40, minQty: 1, maxQty: 1 },
      { itemId: 'glacial_shield', dropRate: 0.04, minQty: 1, maxQty: 1 }
    ],
    baseXp: 80,
    baseGold: { min: 14, max: 30 },
    isBoss: false,
    isElite: false,
    spawnWeight: 2,
    aggroRange: 80,
    attackRange: 70,
    moveSpeed: 35,
    behavior: 'patrol',
    patrolRadius: 170,
    lore: 'Crysthea built these to guard the ice cave entrances. Her archives were too important to leave unguarded. The golems still guard — just everything now.'
  },

  // Creature concept: a wraith that ambushes from blizzard cover with heavy
  // ranged magic — nearly invisible, catastrophically powerful.
  {
    id: 'blizzard_wraith',
    name: 'Blizzard Wraith',
    description: 'A spirit condensed from Crysthea\'s blizzard, nearly invisible in the snowstorm.',
    sprite: 'enemy_blizzard_wraith',
    zone: ElementType.ICE,
    baseLevel: 19,
    stats: { baseHp: 90, baseMana: 100, baseAtk: 12, baseDef: 3, baseSpd: 13, baseMagicAtk: 58, baseMagicDef: 30 },
    element: ElementType.ICE,
    weakness: ElementType.FIRE,
    skills: ['blizzard_skill', 'frost_nova'],
    loot: [
      { itemId: 'frozen_essence', dropRate: 0.65, minQty: 1, maxQty: 2 },
      { itemId: 'glaciem_ice_shard', dropRate: 0.40, minQty: 1, maxQty: 2 },
      { itemId: 'wraith_ice_amulet', dropRate: 0.014, minQty: 1, maxQty: 1 }
    ],
    baseXp: 50,
    baseGold: { min: 7, max: 18 },
    isBoss: false,
    isElite: false,
    spawnWeight: 3,
    aggroRange: 140,
    attackRange: 180,
    moveSpeed: 100,
    behavior: 'ranged',
    projectileColor: 0x88ddff,
    lore: 'Not ghosts of the dead. Manifestations of the blizzard itself. Crysthea\'s preservation magic given aggressive form.'
  },

  // Creature concept: a recently-thawed prehistoric charger — three seconds
  // of stillness followed by an unstoppable rush.
  {
    id: 'permafrost_titan',
    name: 'Permafrost Titan',
    description: 'An ancient giant locked in permafrost for centuries, now freed by the blizzard\'s rage.',
    sprite: 'enemy_permafrost_titan',
    zone: ElementType.ICE,
    baseLevel: 21,
    stats: { baseHp: 420, baseMana: 30, baseAtk: 55, baseDef: 38, baseSpd: 5, baseMagicAtk: 35, baseMagicDef: 28 },
    element: ElementType.ICE,
    weakness: ElementType.FIRE,
    skills: ['frost_nova', 'seismic_slam'],
    loot: [
      { itemId: 'ancient_frost_rune', dropRate: 0.75, minQty: 2, maxQty: 3 },
      { itemId: 'frozen_essence', dropRate: 0.65, minQty: 1, maxQty: 2 },
      { itemId: 'titan_greatsword', dropRate: 0.06, minQty: 1, maxQty: 1 },
      { itemId: 'permafrost_armor', dropRate: 0.04, minQty: 1, maxQty: 1 }
    ],
    baseXp: 190,
    baseGold: { min: 38, max: 95 },
    isBoss: false,
    isElite: true,
    spawnWeight: 0.35,
    aggroRange: 75,
    attackRange: 85,
    moveSpeed: 45,
    behavior: 'charger',
    lore: 'Crysthea\'s ice preserved things accidentally as well as deliberately. The titans of Glaciem\'s first age were frozen in the great storm of 400 years ago. They\'re unfrozen now.'
  },

  // Creature concept: a mote of ancient light — deceptively small, catastrophically
  // old; the elite the player underestimates exactly once.
  {
    id: 'crystal_dragon',
    name: 'Crystal Wisp',
    description: 'An elite mote of crystalline light adrift in the deep ice — small, silent, and older than the gods.',
    sprite: 'enemy_crystal_dragon',
    zone: ElementType.ICE,
    baseLevel: 23,
    stats: { baseHp: 750, baseMana: 100, baseAtk: 75, baseDef: 40, baseSpd: 9, baseMagicAtk: 80, baseMagicDef: 55 },
    element: ElementType.ICE,
    weakness: ElementType.FIRE,
    skills: ['blizzard_skill', 'ice_barrier', 'frost_lance'],
    loot: [
      { itemId: 'crysthea_splinter', dropRate: 0.25, minQty: 1, maxQty: 1 },
      { itemId: 'ancient_frost_rune', dropRate: 0.80, minQty: 2, maxQty: 3 },
      { itemId: 'crystal_dragon_fang_staff', dropRate: 0.08, minQty: 1, maxQty: 1 },
      { itemId: 'ice_dragon_scale_chest', dropRate: 0.05, minQty: 1, maxQty: 1 },
      { itemId: 'frozen_heart_amulet', dropRate: 0.012, minQty: 1, maxQty: 1 }
    ],
    baseXp: 300,
    baseGold: { min: 60, max: 140 },
    isBoss: false,
    isElite: true,
    spawnWeight: 0.25,
    aggroRange: 120,
    attackRange: 200,
    moveSpeed: 80,
    behavior: 'ranged',
    projectileColor: 0x88ddff,
    lore: 'No one made the wisps. They condensed in the mountain ice over millennia, molecule by molecule, until the ice began to dream of light. They were already here when Crysthea arrived. She left them alone. Wise.'
  },

  // NEW ENEMY — Glaciem: an ice summoner that calls the preserved dead out of the deep freeze
  {
    id: 'glacial_shaper',
    name: 'Glacial Shaper',
    description: 'A hunched, hooded figure of living ice whose hands trail blue fire, calling the preserved dead back out of the deep freeze.',
    sprite: 'enemy_glacial_shaper',
    zone: ElementType.ICE,
    baseLevel: 20,
    stats: { baseHp: 155, baseMana: 110, baseAtk: 16, baseDef: 12, baseSpd: 6, baseMagicAtk: 52, baseMagicDef: 30 },
    element: ElementType.ICE,
    weakness: ElementType.FIRE,
    skills: ['frost_nova'],
    loot: [
      { itemId: 'frozen_essence', dropRate: 0.70, minQty: 1, maxQty: 2 },
      { itemId: 'ancient_frost_rune', dropRate: 0.45, minQty: 1, maxQty: 1 },
      { itemId: 'minor_mana_potion', dropRate: 0.15, minQty: 1, maxQty: 1 }
    ],
    baseXp: 80,
    baseGold: { min: 12, max: 28 },
    isBoss: false,
    isElite: false,
    spawnWeight: 1,
    aggroRange: 150,
    attackRange: 80,
    moveSpeed: 40,
    behavior: 'summoner',
    lore: 'Crysthea preserved the dead. The Glacial Shaper did not exist before the curse — it is preservation magic applied without limit or judgment. It does not understand the difference between keeping the dead and waking them.'
  },

  // NEW ENEMY — Glaciem: a frozen tundra hunter finishing a patrol it began before
  // the storm — slow to notice you, impossible to outlast
  {
    id: 'hoarfrost_stalker',
    name: 'Hoarfrost Stalker',
    description: 'A tundra hunter taken whole by the great freeze — hatchet in hand, furs still on its back, slow to aggro and twice as lethal when it finally moves.',
    sprite: 'enemy_hoarfrost_stalker',
    zone: ElementType.ICE,
    baseLevel: 20,
    stats: { baseHp: 240, baseMana: 30, baseAtk: 48, baseDef: 20, baseSpd: 14, baseMagicAtk: 28, baseMagicDef: 18 },
    element: ElementType.ICE,
    weakness: ElementType.FIRE,
    skills: ['frost_lance', 'frost_nova'],
    loot: [
      { itemId: 'glaciem_ice_shard', dropRate: 0.70, minQty: 1, maxQty: 2 },
      { itemId: 'frozen_essence', dropRate: 0.55, minQty: 1, maxQty: 2 },
      { itemId: 'frost_wolf_pelt', dropRate: 0.35, minQty: 1, maxQty: 1 },
      { itemId: 'ancient_frost_rune', dropRate: 0.20, minQty: 1, maxQty: 1 }
    ],
    baseXp: 130,
    baseGold: { min: 22, max: 55 },
    isBoss: false,
    isElite: false,
    spawnWeight: 1,
    aggroRange: 100,
    attackRange: 80,
    moveSpeed: 140,
    behavior: 'charger',
    lore: 'The hunters of Glaciem walked the trap lines between Frostveil and the archives. The blizzard took them mid-stride, and Crysthea\'s ice did what it always does: it preserved. The gait, the hatchet, the patience of the trade — all intact. It still checks its traps.'
  },

  {
    id: 'crysthea_boss',
    name: 'Crysthea the Frozen',
    description: 'The corrupted avatar of the goddess of preservation — a horned warden with a shield of ice and a flail that freezes what it touches.',
    sprite: 'boss_crysthea',
    zone: ElementType.ICE,
    baseLevel: 25,
    stats: { baseHp: 2800, baseMana: 400, baseAtk: 80, baseDef: 55, baseSpd: 12, baseMagicAtk: 115, baseMagicDef: 75 },
    element: ElementType.ICE,
    weakness: ElementType.FIRE,
    skills: ['frost_nova', 'blizzard_skill', 'ice_barrier', 'frost_lance'],
    loot: [
      { itemId: 'crysthea_splinter', dropRate: 1.0, minQty: 1, maxQty: 1 },
      { itemId: 'ancient_frost_rune', dropRate: 1.0, minQty: 6, maxQty: 10 },
      { itemId: 'memory_staff', dropRate: 0.24, minQty: 1, maxQty: 1 },
      { itemId: 'glaciem_guardian_chest', dropRate: 0.14, minQty: 1, maxQty: 1 },
      { itemId: 'ring_of_preservation', dropRate: 0.04, minQty: 1, maxQty: 1 }
    ],
    baseXp: 1900,
    baseGold: { min: 220, max: 420 },
    isBoss: true,
    isElite: false,
    spawnWeight: 0,
    aggroRange: 999,
    attackRange: 350,
    moveSpeed: 90,
    behavior: 'ranged',
    projectileColor: 0x88ddff,
    lore: 'Crysthea may be the oldest being in Velmara. She remembers everything. The curse leaves the keeper-gods a shield and a flail; hers are made of ice, and she uses them to preserve the world the only way she still can — by freezing everything in it.'
  },

  // ── MALACHAR'S SPIRE (Dark) ──────────────────────────────────

  // Creature concept: a fast ranged spirit that channels every grievance
  // in the Spire outward — the most mobile ranged unit in the game.
  {
    id: 'dark_revenant',
    name: 'Dark Revenant',
    description: 'A hooded spirit with a single red eye, consumed entirely by Malachar\'s dark magic.',
    sprite: 'enemy_dark_revenant',
    zone: ElementType.DARK,
    baseLevel: 25,
    stats: { baseHp: 140, baseMana: 100, baseAtk: 25, baseDef: 10, baseSpd: 12, baseMagicAtk: 65, baseMagicDef: 35 },
    element: ElementType.DARK,
    weakness: ElementType.DIVINE,
    skills: ['echo_strike'],
    loot: [
      { itemId: 'dark_essence', dropRate: 0.70, minQty: 1, maxQty: 2 },
      { itemId: 'void_shard', dropRate: 0.30, minQty: 1, maxQty: 1 },
      { itemId: 'shadow_ring', dropRate: 0.02, minQty: 1, maxQty: 1 }
    ],
    baseXp: 80,
    baseGold: { min: 15, max: 35 },
    isBoss: false,
    isElite: false,
    spawnWeight: 4,
    aggroRange: 200,
    attackRange: 200,
    moveSpeed: 95,
    behavior: 'ranged',
    projectileColor: 0x8833cc,
    lore: 'Every person Malachar ever wronged is here. Dark magic attracts grievance. The Spire is full of it.'
  },

  // Creature concept: a gaunt patrol-construct that walks the Spire's corridors —
  // the architecture itself as an enemy.
  {
    id: 'shadow_construct',
    name: 'Shadow Construct',
    description: 'A gaunt, man-shaped thing of poured shadow with a single long claw, built by Malachar from dark energy and stolen elemental power.',
    sprite: 'enemy_shadow_construct',
    zone: ElementType.DARK,
    baseLevel: 26,
    stats: { baseHp: 300, baseMana: 60, baseAtk: 50, baseDef: 35, baseSpd: 8, baseMagicAtk: 45, baseMagicDef: 40 },
    element: ElementType.DARK,
    weakness: ElementType.DIVINE,
    skills: ['stone_shield', 'thunder_bolt'],
    loot: [
      { itemId: 'corrupted_rune', dropRate: 0.60, minQty: 1, maxQty: 2 },
      { itemId: 'void_shard', dropRate: 0.50, minQty: 1, maxQty: 2 },
      { itemId: 'construct_core', dropRate: 0.15, minQty: 1, maxQty: 1 },
      { itemId: 'malachar_blade', dropRate: 0.025, minQty: 1, maxQty: 1 }
    ],
    baseXp: 100,
    baseGold: { min: 18, max: 42 },
    isBoss: false,
    isElite: false,
    spawnWeight: 2,
    aggroRange: 150,
    attackRange: 75,
    moveSpeed: 75,
    behavior: 'patrol',
    patrolRadius: 200,
    lore: 'Malachar spent twenty years preparing. These constructs were part of the preparation. Not all research was about the curse.'
  },

  // NEW ENEMY — Malachar's Spire: something small that used to be someone —
  // a summoner whose precision is the last trace of the scholar it was
  {
    id: 'void_weaver',
    name: 'Void Weaver',
    description: 'A small pointed-eared creature that pads through the study halls, pulling threads of dark from the grief-saturated walls and knotting them into revenants.',
    sprite: 'enemy_void_weaver',
    zone: ElementType.DARK,
    baseLevel: 26,
    stats: { baseHp: 220, baseMana: 130, baseAtk: 20, baseDef: 18, baseSpd: 7, baseMagicAtk: 60, baseMagicDef: 45 },
    element: ElementType.DARK,
    weakness: ElementType.DIVINE,
    skills: ['echo_strike'],
    loot: [
      { itemId: 'dark_essence', dropRate: 0.75, minQty: 1, maxQty: 2 },
      { itemId: 'corrupted_rune', dropRate: 0.55, minQty: 1, maxQty: 2 },
      { itemId: 'void_shard', dropRate: 0.40, minQty: 1, maxQty: 1 }
    ],
    baseXp: 110,
    baseGold: { min: 20, max: 45 },
    isBoss: false,
    isElite: false,
    spawnWeight: 1,
    aggroRange: 160,
    attackRange: 90,
    moveSpeed: 55,
    behavior: 'summoner',
    lore: 'There was a scholar in Malachar\'s household who helped with the early research. When they understood what it was for, they tried to leave. This small thing is what became of them. It still works with a copyist\'s precision.'
  },

  // NEW ENEMY — Malachar's Spire: a dark charger that launches from shadows
  {
    id: 'void_stalker',
    name: 'Void Stalker',
    description: 'A small round absence with two horns and two yellow eyes, waiting in dark corners to launch devastating charges from absolute stillness.',
    sprite: 'enemy_void_stalker',
    zone: ElementType.DARK,
    baseLevel: 27,
    stats: { baseHp: 180, baseMana: 60, baseAtk: 65, baseDef: 14, baseSpd: 18, baseMagicAtk: 40, baseMagicDef: 20 },
    element: ElementType.DARK,
    weakness: ElementType.DIVINE,
    skills: ['echo_strike'],
    loot: [
      { itemId: 'void_shard', dropRate: 0.65, minQty: 1, maxQty: 2 },
      { itemId: 'dark_essence', dropRate: 0.45, minQty: 1, maxQty: 1 },
      { itemId: 'shadow_ring', dropRate: 0.025, minQty: 1, maxQty: 1 }
    ],
    baseXp: 90,
    baseGold: { min: 16, max: 38 },
    isBoss: false,
    isElite: false,
    spawnWeight: 2,
    aggroRange: 120,
    attackRange: 60,
    moveSpeed: 160,
    behavior: 'charger',
    lore: 'Malachar\'s Spire was designed with shadows in mind. He knew what the dark could hide. These creatures were not designed — they are what the dark chose to put there on its own.'
  },

  {
    id: 'void_sentinel',
    name: 'Void Sentinel',
    description: 'An elite guardian crouched at the doors of the inner sanctum, gripping a curved blade of pure void.',
    sprite: 'enemy_void_sentinel',
    zone: ElementType.DARK,
    baseLevel: 28,
    stats: { baseHp: 800, baseMana: 150, baseAtk: 80, baseDef: 50, baseSpd: 10, baseMagicAtk: 90, baseMagicDef: 60 },
    element: ElementType.DARK,
    weakness: ElementType.DIVINE,
    skills: ['echo_strike', 'terra_surge', 'chain_lightning'],
    loot: [
      { itemId: 'void_shard', dropRate: 0.85, minQty: 2, maxQty: 3 },
      { itemId: 'dark_essence', dropRate: 0.80, minQty: 2, maxQty: 3 },
      { itemId: 'sentinel_armor', dropRate: 0.07, minQty: 1, maxQty: 1 },
      { itemId: 'sentinel_sword', dropRate: 0.05, minQty: 1, maxQty: 1 }
    ],
    baseXp: 320,
    baseGold: { min: 65, max: 150 },
    isBoss: false,
    isElite: true,
    spawnWeight: 0.3,
    aggroRange: 120,
    attackRange: 100,
    moveSpeed: 85,
    behavior: 'patrol',
    patrolRadius: 140,
    lore: 'Malachar created one of these for each of his thirty years of preparation. They are his life\'s work, made flesh and purpose.'
  },

  {
    id: 'malachar_boss',
    name: 'Malachar the Unbound',
    description: 'The scholar of Grievy Town who broke the world — wearing, at the top of his Spire, the same horned face his curse gave the gods.',
    sprite: 'boss_malachar',
    zone: ElementType.DARK,
    baseLevel: 30,
    stats: { baseHp: 4000, baseMana: 600, baseAtk: 100, baseDef: 60, baseSpd: 14, baseMagicAtk: 150, baseMagicDef: 90 },
    element: ElementType.DARK,
    weakness: ElementType.DIVINE,
    skills: ['fireball', 'chain_lightning', 'frost_nova', 'terra_surge', 'tidal_wave', 'tornado_spin', 'echo_strike'],
    loot: [
      { itemId: 'malachars_grimoire', dropRate: 1.0, minQty: 1, maxQty: 1 },
      { itemId: 'void_shard', dropRate: 1.0, minQty: 8, maxQty: 12 },
      { itemId: 'malachars_staff', dropRate: 0.50, minQty: 1, maxQty: 1 },
      { itemId: 'unbound_robe', dropRate: 0.40, minQty: 1, maxQty: 1 },
      { itemId: 'ring_of_the_unbound', dropRate: 0.15, minQty: 1, maxQty: 1 }
    ],
    baseXp: 5000,
    baseGold: { min: 500, max: 1000 },
    isBoss: true,
    isElite: false,
    spawnWeight: 0,
    aggroRange: 999,
    attackRange: 600,
    moveSpeed: 120,
    behavior: 'ranged',
    projectileColor: 0x8833cc,
    lore: 'Malachar is not a monster. He is a man who chose a path thirty years ago and never once doubted it. The horned shape was never Pyrath\'s, or Sylvael\'s, or Volkran\'s — it always belonged to the curse, and the curse has come for its author. He underestimated one thing: that the world would send someone back.'
  }
];

export const ENEMY_MAP: Record<string, Enemy> = Object.fromEntries(ENEMIES.map(e => [e.id, e]));
