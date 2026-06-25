import { Quest, QuestType, ElementType } from '../types';

export const QUESTS: Quest[] = [

  // ── MAIN QUESTS ────────────────────────────────────────────────

  {
    id: 'mq_00_awakening',
    name: 'Awakening',
    description: 'You woke up in a stranger\'s house with no memory. Find out where you are and what\'s happening.',
    type: QuestType.MAIN,
    giverId: 'aldric',
    objectives: [
      { id: 'obj1', description: 'Talk to Aldric', type: 'TALK', targetId: 'aldric', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Explore Grievy Town', type: 'EXPLORE', targetId: 'grievy_town', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Talk to Kelvar at the guard post', type: 'TALK', targetId: 'kelvar', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 100, gold: 20, items: [{ itemId: 'minor_health_potion', quantity: 3 }, { itemId: 'minor_mana_potion', quantity: 2 }] },
    lore: 'A road outside Grievy Town. A woodcutter. A stranger with no name and no past. Every story starts somewhere.',
    followupQuestId: 'mq_01_first_tremor'
  },
  {
    id: 'mq_01_first_tremor',
    name: 'The First Tremor',
    description: 'Grievy Town has felt tremors. Refugees from the elemental zones describe chaos. Choose a zone to investigate.',
    type: QuestType.MAIN,
    giverId: 'kelvar',
    objectives: [
      { id: 'obj1', description: 'Investigate any elemental zone', type: 'EXPLORE', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Defeat a zone boss', type: 'BOSS', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 500, gold: 100 },
    prerequisites: ['mq_00_awakening'],
    lore: 'The tremors are getting worse. Something is wrong with the elemental zones. Someone needs to go and see. The town has decided that someone is you.',
    followupQuestId: 'mq_02_price_of_power'
  },
  {
    id: 'mq_02_price_of_power',
    name: 'The Price of Power',
    description: 'You killed a divinity. The world felt it. Brother Ovan has something to tell you.',
    type: QuestType.MAIN,
    giverId: 'brother_ovan',
    objectives: [
      { id: 'obj1', description: 'Return to Grievy Town', type: 'EXPLORE', targetId: 'grievy_town', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Talk to Brother Ovan', type: 'TALK', targetId: 'brother_ovan', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Defeat two more zone bosses', type: 'BOSS', quantity: 2, current: 0, completed: false },
    ],
    rewards: { xp: 800, gold: 200 },
    prerequisites: ['mq_01_first_tremor'],
    unlockCondition: { questsCompleted: ['mq_01_first_tremor'] },
    lore: 'Brother Ovan has been researching the divine records. He found something. You are not going to like it.',
    followupQuestId: 'mq_03_world_grows_silent'
  },
  {
    id: 'mq_03_world_grows_silent',
    name: 'The World Grows Silent',
    description: 'Velmara is dying. Every divinity you kill takes part of the world with it. But the alternative is worse. Press on.',
    type: QuestType.MAIN,
    giverId: 'liria',
    objectives: [
      { id: 'obj1', description: 'Defeat three more zone bosses', type: 'BOSS', quantity: 3, current: 0, completed: false },
    ],
    rewards: { xp: 1200, gold: 350 },
    prerequisites: ['mq_02_price_of_power'],
    unlockCondition: { questsCompleted: ['mq_02_price_of_power'], zonesCleared: 3 },
    lore: 'Grievy Town is quieter than it was. Some people have left. The ones who stayed do not ask questions. They just watch you leave each time, and wait.',
    followupQuestId: 'mq_04_point_of_no_return'
  },
  {
    id: 'mq_04_point_of_no_return',
    name: 'The Point of No Return',
    description: 'All six zones are clear. The world is grey. And Malachar\'s Spire is open.',
    type: QuestType.MAIN,
    giverId: 'aldric',
    objectives: [
      { id: 'obj1', description: 'Defeat all six zone bosses', type: 'BOSS', quantity: 6, current: 0, completed: false },
      { id: 'obj2', description: 'Return to Grievy Town', type: 'EXPLORE', targetId: 'grievy_town', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Speak with Aldric', type: 'TALK', targetId: 'aldric', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 2000, gold: 500 },
    prerequisites: ['mq_03_world_grows_silent'],
    unlockCondition: { questsCompleted: ['mq_03_world_grows_silent'], zonesCleared: 6 },
    lore: 'Only Aldric is still in Grievy Town. He baked bread. He says he knew you wouldn\'t leave without saying goodbye.',
    followupQuestId: 'mq_05_malachar'
  },
  {
    id: 'mq_05_malachar',
    name: 'Malachar',
    description: 'Enter the Spire and face the man who started all of this.',
    type: QuestType.MAIN,
    giverId: 'aldric',
    objectives: [
      { id: 'obj1', description: 'Enter Malachar\'s Spire', type: 'EXPLORE', targetId: 'malachars_spire', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Defeat Malachar the Unbound', type: 'BOSS', targetId: 'malachar_boss', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 5000, gold: 1000, items: [{ itemId: 'malachars_grimoire', quantity: 1 }] },
    prerequisites: ['mq_04_point_of_no_return'],
    unlockCondition: { questsCompleted: ['mq_04_point_of_no_return'] },
    lore: 'The Spire was built by a man from Grievy Town, over thirty years, with patience and certainty. The certainty was wrong. The patience was not.',
    followupQuestId: 'mq_06_illumination'
  },
  {
    id: 'mq_06_illumination',
    name: 'The Illumination',
    description: 'Malachar is defeated. Something stirs inside you. Something ancient.',
    type: QuestType.MAIN,
    objectives: [
      { id: 'obj1', description: 'Experience the divine illumination', type: 'EXPLORE', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Make your choice', type: 'TALK', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 10000, gold: 0 },
    prerequisites: ['mq_05_malachar'],
    lore: 'You are not who you thought you were. You never were. And the choice you are about to make will define not just who you are, but whether Velmara was ever real at all.'
  },

  // ── SIDE QUESTS ─────────────────────────────────────────────────

  {
    id: 'sq_01_aldrics_past',
    name: "The Woodcutter's Secret",
    description: 'Aldric found you on the road. He never explained why he was out there at that hour.',
    type: QuestType.SIDE,
    giverId: 'aldric',
    objectives: [
      { id: 'obj1', description: 'Talk to Aldric about his past', type: 'TALK', targetId: 'aldric', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Find the old mill east of town', type: 'EXPLORE', targetId: 'old_mill', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Recover Aldric\'s lost medallion', type: 'COLLECT', targetId: 'aldric_medallion', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 300, gold: 80, items: [{ itemId: 'aldrics_bread', quantity: 5 }] },
    lore: 'He was out there for a reason. He just doesn\'t talk about reasons.'
  },
  {
    id: 'sq_02_embers_of_memory',
    name: 'Embers of Memory',
    description: 'A survivor from Ignis Reach is looking for his family. He knows they escaped. He doesn\'t know where they went.',
    type: QuestType.SIDE,
    giverId: 'ignis_survivor',
    objectives: [
      { id: 'obj1', description: 'Talk to the Ignis survivor', type: 'TALK', targetId: 'ignis_survivor', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Find clues in Ignis Reach ruins', type: 'EXPLORE', targetId: 'ignis_reach', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Kill 10 Ember Wyrms searching the ruins', type: 'KILL', targetId: 'ember_wyrm', quantity: 10, current: 0, completed: false },
      { id: 'obj4', description: 'Bring back the survivor\'s family photo', type: 'COLLECT', targetId: 'family_photo', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 400, gold: 120, items: [{ itemId: 'health_potion', quantity: 3 }, { itemId: 'ember_core', quantity: 5 }] },
    unlockCondition: { zoneCleared: undefined },
    lore: 'The pilgrimage routes to Ignis Reach are gone. But whatever the pilgrims left behind is still there, under the ash.'
  },
  {
    id: 'sq_03_crystal_archivist',
    name: 'The Crystal Archivist',
    description: 'A scholar in Grievy Town is desperate to recover records from Glaciem\'s ice caves before they\'re destroyed.',
    type: QuestType.SIDE,
    giverId: 'brother_ovan',
    objectives: [
      { id: 'obj1', description: 'Enter Glaciem\'s ice caves', type: 'EXPLORE', targetId: 'glaciem', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Retrieve 3 ice archive tablets', type: 'COLLECT', targetId: 'ice_archive_tablet', quantity: 3, current: 0, completed: false },
    ],
    rewards: { xp: 500, gold: 200, items: [{ itemId: 'glaciem_ice_shard', quantity: 10 }, { itemId: 'ancient_frost_rune', quantity: 3 }] },
    unlockCondition: { level: 15 },
    lore: 'Four centuries of history. Crysthea preserved it all. Brother Ovan has been in contact with scholars across what\'s left of Velmara. They want to preserve what Crysthea preserved, before the blizzard takes it.'
  },
  {
    id: 'sq_04_volterra_engineer',
    name: "Volterra's Last Engineer",
    description: 'Somewhere in the ruins of Volterra, the last engineer who understood the lightning grid is alive.',
    type: QuestType.SIDE,
    giverId: 'ysolde',
    objectives: [
      { id: 'obj1', description: 'Find the engineer\'s workshop in Volterra', type: 'EXPLORE', targetId: 'volterra', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Defeat the Storm Heralds blocking the workshop', type: 'KILL', targetId: 'storm_herald', quantity: 3, current: 0, completed: false },
      { id: 'obj3', description: 'Rescue Engineer Kasyr', type: 'TALK', targetId: 'kasyr', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 600, gold: 250, items: [{ itemId: 'charged_metal', quantity: 8 }, { itemId: 'thunder_rune', quantity: 4 } ] },
    unlockCondition: { level: 14 },
    lore: 'Kasyr designed the containment systems. Without those systems, Volterra\'s grid becomes something else. He\'s been trying to activate the failsafe for weeks. Alone.'
  },
  {
    id: 'sq_05_tide_caller',
    name: 'The Tide Caller',
    description: 'An Abyssmar fisherman\'s daughter went into the flooded ruins to look for something. She hasn\'t come back.',
    type: QuestType.SIDE,
    giverId: 'fisherman_vael',
    objectives: [
      { id: 'obj1', description: 'Find Vael\'s daughter Sera in Abyssmar', type: 'EXPLORE', targetId: 'abyssmar', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Defeat 8 Drowned Knights blocking the path', type: 'KILL', targetId: 'drowned_knight', quantity: 8, current: 0, completed: false },
      { id: 'obj3', description: 'Bring Sera safely back', type: 'TALK', targetId: 'sera', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 450, gold: 150, items: [{ itemId: 'deep_coral', quantity: 6 }, { itemId: 'health_potion', quantity: 4 }] },
    lore: 'Sera said she saw something in the ruins. A light. Her father says she always saw things others didn\'t. He\'s afraid she was right this time.'
  },
  {
    id: 'sq_06_fragments_of_gorvun',
    name: 'Fragments of Gorvun',
    description: 'A scholar believes Gorvun can be partially understood through the fragments he shed. Collect them.',
    type: QuestType.SIDE,
    giverId: 'brother_ovan',
    objectives: [
      { id: 'obj1', description: 'Collect 5 Terravast Crystals with high resonance', type: 'COLLECT', targetId: 'terravast_crystal', quantity: 5, current: 0, completed: false },
      { id: 'obj2', description: 'Collect a Gorvun Fragment', type: 'COLLECT', targetId: 'gorvun_fragment', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Return to Brother Ovan', type: 'TALK', targetId: 'brother_ovan', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 350, gold: 100, items: [{ itemId: 'ancient_stone_rune', quantity: 5 }] },
    unlockCondition: { zoneCleared: ElementType.EARTH },
    lore: 'Gorvun shed matter the way mountains shed rock. Slowly, under pressure, over time. Brother Ovan believes those fragments retain something of Gorvun\'s consciousness.'
  },
  {
    id: 'sq_07_malachars_notes',
    name: "Malachar's Notes",
    description: 'Pages from Malachar\'s research are scattered across the elemental zones. Collect them to understand what he was thinking.',
    type: QuestType.SIDE,
    giverId: 'brother_ovan',
    objectives: [
      { id: 'obj1', description: 'Find a research page in Ignis Reach', type: 'COLLECT', targetId: 'research_page_fire', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Find a research page in Terravast', type: 'COLLECT', targetId: 'research_page_earth', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Find a research page in Zephyr Peaks', type: 'COLLECT', targetId: 'research_page_wind', quantity: 1, current: 0, completed: false },
      { id: 'obj4', description: 'Find research pages in the remaining zones', type: 'COLLECT', targetId: 'research_page', quantity: 3, current: 0, completed: false },
    ],
    rewards: { xp: 700, gold: 300, items: [{ itemId: 'mana_potion', quantity: 5 }], skillUnlock: 'soul_echo' },
    unlockCondition: { zonesCleared: 2 },
    lore: 'Malachar\'s handwriting gets smaller toward the end of the pages. The early ones are academic. The late ones are something else. Brother Ovan wants to understand the progression. You suspect he wants to understand how a person gets from one to the other.'
  },
  {
    id: 'sq_08_find_elara',
    name: 'The Woman in the Ice',
    description: 'A rumor persists among the Glaciem survivors — a woman who lives alone in the deepest ice caves. Alone for thirty years.',
    type: QuestType.SIDE,
    giverId: 'glaciem_survivor',
    objectives: [
      { id: 'obj1', description: 'Search the deep ice caves of Glaciem', type: 'EXPLORE', targetId: 'glaciem', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Find Elara', type: 'TALK', targetId: 'elara', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 800, gold: 0, skillUnlock: 'elaras_gift' },
    unlockCondition: { level: 16, zoneCleared: ElementType.ICE },
    isHidden: true,
    lore: 'She has been there for thirty years. She went in to study the archives and when she came out, everything was different. She decided to go back in. Some people find peace in what they know.',
  },

  // ── FEDEX QUESTS ────────────────────────────────────────────────

  {
    id: 'fq_01_mirasherbs',
    name: "Mira's Missing Herbs",
    description: 'Mira needs moonpetal herbs from the forest edge. Simple enough.',
    type: QuestType.FEDEX,
    giverId: 'mira',
    objectives: [
      { id: 'obj1', description: 'Collect 5 Moonpetal Herbs from the forest', type: 'COLLECT', targetId: 'moonpetal_herb', quantity: 5, current: 0, completed: false },
      { id: 'obj2', description: 'Bring them back to Mira', type: 'DELIVER', targetId: 'mira', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 80, gold: 35, items: [{ itemId: 'minor_health_potion', quantity: 3 }] },
  },
  {
    id: 'fq_02_theronsmetal',
    name: "Theron's Metal Order",
    description: 'Theron needs volcanic metal from a traveler\'s pack in the old road. He\'s convinced someone dropped it.',
    type: QuestType.FEDEX,
    giverId: 'theron',
    objectives: [
      { id: 'obj1', description: 'Find the traveler\'s pack on the east road', type: 'EXPLORE', targetId: 'east_road', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Deliver the metal to Theron', type: 'DELIVER', targetId: 'theron', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 60, gold: 40, items: [{ itemId: 'iron_sword', quantity: 1 }] },
  },
  {
    id: 'fq_03_liriascat',
    name: "Liria's Cat",
    description: 'Liria\'s cat, Ember, has gone exploring toward the forest. She\'s worried.',
    type: QuestType.FEDEX,
    giverId: 'liria',
    objectives: [
      { id: 'obj1', description: 'Find Ember at the forest edge', type: 'EXPLORE', targetId: 'forest_edge', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Return Ember to Liria', type: 'DELIVER', targetId: 'liria', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 50, gold: 25, items: [{ itemId: 'aldrics_bread', quantity: 2 }] },
  },
  {
    id: 'fq_04_ovanresearch',
    name: "Ovan's Research Run",
    description: 'Brother Ovan needs an elemental sample from each of two zones for his research.',
    type: QuestType.FEDEX,
    giverId: 'brother_ovan',
    objectives: [
      { id: 'obj1', description: 'Collect an Ember Core from Ignis Reach', type: 'COLLECT', targetId: 'ember_core', quantity: 3, current: 0, completed: false },
      { id: 'obj2', description: 'Collect a Terravast Crystal from Terravast', type: 'COLLECT', targetId: 'terravast_crystal', quantity: 3, current: 0, completed: false },
      { id: 'obj3', description: 'Deliver samples to Brother Ovan', type: 'DELIVER', targetId: 'brother_ovan', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 120, gold: 60, items: [{ itemId: 'mana_potion', quantity: 2 }] },
    unlockCondition: { zonesCleared: 1 },
  },
  {
    id: 'fq_05_kelvarsrounds',
    name: "Kelvar's Rounds",
    description: 'Kelvar asks you to patrol the town perimeter and report back on any strange activity.',
    type: QuestType.FEDEX,
    giverId: 'kelvar',
    objectives: [
      { id: 'obj1', description: 'Check the north gate', type: 'EXPLORE', targetId: 'north_gate', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Check the south road', type: 'EXPLORE', targetId: 'south_road', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Report back to Kelvar', type: 'TALK', targetId: 'kelvar', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 70, gold: 30 },
  },
  {
    id: 'fq_06_ysoldedeliver',
    name: "Ysolde's Delivery",
    description: 'Ysolde needs a package delivered to a farmer outside town who hasn\'t been to market in weeks.',
    type: QuestType.FEDEX,
    giverId: 'ysolde',
    objectives: [
      { id: 'obj1', description: 'Deliver the package to Farmer Roth', type: 'DELIVER', targetId: 'farmer_roth', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 60, gold: 50 },
  },
  {
    id: 'fq_07_feathers',
    name: 'Feather Collection',
    description: 'Someone in town is making something. They need feathers. Forest birds, specifically.',
    type: QuestType.FEDEX,
    giverId: 'ysolde',
    objectives: [
      { id: 'obj1', description: 'Collect 8 forest bird feathers', type: 'COLLECT', targetId: 'bird_feather', quantity: 8, current: 0, completed: false },
      { id: 'obj2', description: 'Return to Ysolde', type: 'DELIVER', targetId: 'ysolde', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 55, gold: 30 },
  },
  {
    id: 'fq_08_childstoy',
    name: "The Lost Toy",
    description: 'A child in town lost a carved wooden horse in the old barn south of town.',
    type: QuestType.FEDEX,
    giverId: 'child_npc',
    objectives: [
      { id: 'obj1', description: 'Find the toy in the old barn', type: 'COLLECT', targetId: 'wooden_horse', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Return it to the child', type: 'DELIVER', targetId: 'child_npc', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 40, gold: 15, items: [{ itemId: 'minor_health_potion', quantity: 2 }] },
    lore: 'It\'s a small thing. In a world falling apart, sometimes a small thing is enough.'
  },
];

export const QUEST_MAP: Record<string, Quest> = Object.fromEntries(QUESTS.map(q => [q.id, q]));
