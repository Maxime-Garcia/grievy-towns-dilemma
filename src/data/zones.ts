import { Zone, ElementType, ZoneStatus, Divine } from '../types';

export const DIVINES: Record<string, Divine> = {
  pyrath: {
    id: 'pyrath',
    name: 'Pyrath',
    title: 'The Flame Eternal',
    element: ElementType.FIRE,
    sprite: 'divine_pyrath',
    lore: 'Pyrath was the first divinity to claim a corner of Velmara. Where the land was dead rock, Pyrath breathed fire and the mountains rose, alive with heat and purpose. The dragon never spoke in words — only in the roar of geysers and the warmth of sacred springs. The people of Ignis Reach never needed words. Then Malachar\'s curse reached the dragon, and Pyrath\'s warmth became an inferno that remembered no boundaries.'
  },
  gorvun: {
    id: 'gorvun',
    name: 'Gorvun',
    title: 'The Unshaking Foundation',
    element: ElementType.EARTH,
    sprite: 'divine_gorvun',
    lore: 'Gorvun was patience given form — a titan of living stone who moved perhaps once a century, adjusting the shape of Terravast with geological care. The mines never collapsed. The tunnels never flooded. Crystal veins grew in perfect spirals. When the curse hit, Gorvun began to convulse. The seismic fury that followed levelled cities that had stood for four hundred years in a single night.'
  },
  sylvael: {
    id: 'sylvael',
    name: 'Sylvael',
    title: 'The Drifting Song',
    element: ElementType.WIND,
    sprite: 'divine_sylvael',
    lore: 'Sylvael was said to be the most beautiful of the divinities — a phoenix of light and wind who carried seeds across the world and cooled the summers. Travelers climbed to Zephyr Peaks for the moment Sylvael\'s feathers grazed the summit, said to bring clarity and peace. The phoenix is gone. What remains is a hurricane that tears the floating islands apart stone by stone.'
  },
  thalymor: {
    id: 'thalymor',
    name: 'Thalymor',
    title: 'The Deep Patience',
    element: ElementType.WATER,
    sprite: 'divine_thalymor',
    lore: 'Thalymor lay at the bottom of Velmara\'s oceans and breathed slowly, and the tides followed. The leviathan\'s patience was legendary — nothing in Abyssmar ever moved faster than it needed to. The coast was prosperous and safe. Then the curse reached the depths. The deep patience became a consuming rage. Abyssmar sank within a fortnight.'
  },
  volkran: {
    id: 'volkran',
    name: 'Volkran',
    title: 'The Directed Spark',
    element: ElementType.LIGHTNING,
    sprite: 'divine_volkran',
    lore: 'Volkran was the colossus who made Volterra great — a being of perfect electrical precision who powered the most advanced civilization in Velmara. Machines, communication, artificial light — all gifts from Volkran\'s directed storms. The engineers of Volterra understood their god better than any other people understood theirs. They had instruments. They measured him. Then the measurements stopped making sense.'
  },
  crysthea: {
    id: 'crysthea',
    name: 'Crysthea',
    title: 'The Keeper of What Was',
    element: ElementType.ICE,
    sprite: 'divine_crysthea',
    lore: 'Crysthea did not create or destroy. She preserved. The ice caves of Glaciem held the complete history of Velmara — every artifact, every manuscript, every seed of every extinct plant — all entombed in perfect ice. Scholars believed Crysthea had been conscious since before the other divinities existed. What she remembers in her current frenzied state, no one can say. The ice caves are unreachable. Everything she protected may be lost.'
  }
};

export const ZONES: Zone[] = [
  {
    id: 'grievy_town',
    name: 'Grievy Town',
    description: 'A modest neutral town at the crossroads of Velmara. The hero\'s starting point.',
    element: ElementType.NEUTRAL,
    recommendedLevel: 1,
    mapKey: 'map_grievy_town',
    enemies: [],
    bossId: '',
    divine: { id: 'none', name: 'None', title: '', element: ElementType.NEUTRAL, sprite: '', lore: '' },
    unlockedSkills: [],
    materials: [],
    ambientColor: 0xffeedd,
    musicKey: 'music_grievy_town',
    lore: 'Grievy Town was always the quiet center of Velmara — not blessed by any divinity, not cursed by any power. Just people, living. Woodcutters, merchants, a blacksmith, an innkeeper. The kind of place travelers passed through without stopping. Until now.',
    worldPosition: { x: 400, y: 300 }
  },
  {
    id: 'ignis_reach',
    name: 'Ignis Reach',
    description: 'A volcanic wasteland of lava rivers and obsidian spires, once a place of pilgrimage.',
    element: ElementType.FIRE,
    recommendedLevel: 8,
    mapKey: 'map_ignis_reach',
    enemies: ['ember_wyrm', 'lava_golem', 'cinder_sprite', 'ash_revenant', 'magma_titan'],
    bossId: 'pyrath_boss',
    divine: DIVINES.pyrath,
    unlockedSkills: ['fireball', 'flame_dash', 'inferno_burst'],
    materials: ['ember_core', 'obsidian_shard', 'volcanic_ash', 'pyrath_scale'],
    ambientColor: 0xff4400,
    musicKey: 'music_ignis_reach',
    lore: 'The first of Velmara\'s elemental domains to succumb to Malachar\'s curse. Ignis Reach blazes with uncontrolled fire — the sacred springs now boil over, the mountains erupt without warning, and Pyrath\'s once-protective flame consumes everything it touches.',
    worldPosition: { x: 400, y: 520 }
  },
  {
    id: 'terravast',
    name: 'Terravast',
    description: 'Deep canyons and crystal caves, now wracked by endless seismic fury.',
    element: ElementType.EARTH,
    recommendedLevel: 10,
    mapKey: 'map_terravast',
    enemies: ['stone_crawler', 'crystal_golem', 'cave_lurker', 'terravast_serpent', 'ruin_colossus'],
    bossId: 'gorvun_boss',
    divine: DIVINES.gorvun,
    unlockedSkills: ['stone_shield', 'seismic_slam', 'terra_surge'],
    materials: ['terravast_crystal', 'ancient_stone_rune', 'cave_moss', 'gorvun_fragment'],
    ambientColor: 0x664422,
    musicKey: 'music_terravast',
    lore: 'Terravast was the steadiest place in Velmara — never an earthquake, never a landslide. Now the ground shakes constantly. The crystal caves collapse and reform. Ancient ruins, standing for centuries, crumble into new formations overnight.',
    worldPosition: { x: 200, y: 420 }
  },
  {
    id: 'zephyr_peaks',
    name: 'Zephyr Peaks',
    description: 'Floating islands and cloud temples, now consumed by an endless hurricane.',
    element: ElementType.WIND,
    recommendedLevel: 12,
    mapKey: 'map_zephyr_peaks',
    enemies: ['gale_harpy', 'storm_eagle', 'wind_wraith', 'cyclone_sprite', 'sky_titan'],
    bossId: 'sylvael_boss',
    divine: DIVINES.sylvael,
    unlockedSkills: ['gale_step', 'tornado_spin', 'skyward_strike'],
    materials: ['zephyr_feather', 'stormstone', 'cloudweave_silk', 'sylvael_plume'],
    ambientColor: 0xaaddff,
    musicKey: 'music_zephyr_peaks',
    lore: 'The sky routes to Zephyr Peaks are impassable now. Winds that once gently lifted travelers up the mountain paths now rip the floating islands apart. The cloud temples drift untethered, crashing into each other in a sky that hasn\'t been still in weeks.',
    worldPosition: { x: 400, y: 80 }
  },
  {
    id: 'abyssmar',
    name: 'Abyssmar',
    description: 'Drowned cities and coral catacombs beneath a raging sea.',
    element: ElementType.WATER,
    recommendedLevel: 14,
    mapKey: 'map_abyssmar',
    enemies: ['tide_crawler', 'sea_wraith', 'coral_golem', 'depth_serpent', 'drowned_knight'],
    bossId: 'thalymor_boss',
    divine: DIVINES.thalymor,
    unlockedSkills: ['tidal_wave', 'healing_current', 'frost_lance'],
    materials: ['deep_coral', 'drowned_relic', 'sea_glass', 'thalymor_scale'],
    ambientColor: 0x003366,
    musicKey: 'music_abyssmar',
    lore: 'Abyssmar\'s coast is gone. The sea rose over a fortnight and consumed the trade district entirely. What remains is accessible only through underwater passages and the half-submerged ruins of what was the wealthiest district in Velmara.',
    worldPosition: { x: 620, y: 420 }
  },
  {
    id: 'volterra',
    name: 'Volterra',
    description: 'The ruins of Velmara\'s most advanced civilization, struck by endless lightning.',
    element: ElementType.LIGHTNING,
    recommendedLevel: 16,
    mapKey: 'map_volterra',
    enemies: ['spark_imp', 'thunder_drake', 'chain_revenant', 'volt_hound', 'storm_herald'],
    bossId: 'volkran_boss',
    divine: DIVINES.volkran,
    unlockedSkills: ['thunder_bolt', 'chain_lightning', 'volt_dash'],
    materials: ['storm_shard', 'charged_metal', 'thunder_rune', 'volkran_coil'],
    ambientColor: 0x440066,
    musicKey: 'music_volterra',
    lore: 'Volterra\'s machines still stand, conducting Volkran\'s uncontrolled lightning into catastrophic discharges. The engineers who understood this system best are gone. The lightning grid, designed to power civilization, is now an unpredictable death trap across the plains.',
    worldPosition: { x: 620, y: 180 }
  },
  {
    id: 'glaciem',
    name: 'Glaciem',
    description: 'A frozen tundra of crystalline fortresses and preserved ruins, now blanketed in eternal blizzard.',
    element: ElementType.ICE,
    recommendedLevel: 18,
    mapKey: 'map_glaciem',
    enemies: ['frost_wolf', 'ice_golem', 'blizzard_wraith', 'permafrost_titan', 'crystal_dragon'],
    bossId: 'crysthea_boss',
    divine: DIVINES.crysthea,
    unlockedSkills: ['frost_nova', 'blizzard_skill', 'ice_barrier'],
    materials: ['glaciem_ice_shard', 'ancient_frost_rune', 'frozen_essence', 'crysthea_splinter'],
    ambientColor: 0xaaeeff,
    musicKey: 'music_glaciem',
    lore: 'Glaciem was always cold, but the blizzards were manageable. The eternal blizzard that now covers the tundra is Crysthea\'s doing — or rather, Malachar\'s curse channeled through her. The ice caves that held Velmara\'s history are sealed. No one has reached them since.',
    worldPosition: { x: 180, y: 180 }
  },
  {
    id: 'malachars_spire',
    name: "Malachar's Spire",
    description: 'The corrupted tower at the edge of Grievy Town, pulsing with dark magic.',
    element: ElementType.DARK,
    recommendedLevel: 25,
    mapKey: 'map_malachars_spire',
    enemies: ['dark_revenant', 'shadow_construct', 'void_sentinel'],
    bossId: 'malachar_boss',
    divine: { id: 'none', name: 'None', title: '', element: ElementType.DARK, sprite: '', lore: '' },
    unlockedSkills: ['void_step'],
    materials: ['dark_essence', 'void_shard', 'corrupted_rune'],
    ambientColor: 0x110022,
    musicKey: 'music_malachars_spire',
    lore: 'The Spire was always there. On the eastern edge of Grievy Town, past the old mill. Malachar built it over twenty years. The townspeople assumed it was a scholar\'s tower. No one asked questions. No one thought to. Now the tower pulses with dark energy and the town it once overlooked is nearly empty.',
    worldPosition: { x: 400, y: 300 }
  }
];

export const ZONE_MAP: Record<string, Zone> = Object.fromEntries(ZONES.map(z => [z.id, z]));
