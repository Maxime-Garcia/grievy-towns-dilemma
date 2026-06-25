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

  // ── NOUVELLES VILLES : SIDE QUESTS ─────────────────────────────

  // Ashford
  {
    id: 'sq_ash_01_pyrath_relic',
    name: 'La Relique de Pyrath',
    description: 'Brenn pense qu\'une relique du culte de Pyrath est enfouie dans les ruines au nord. Elle changerait la qualité de ses forges.',
    type: QuestType.SIDE,
    giverId: 'brenn',
    objectives: [
      { id: 'obj1', description: 'Fouiller les ruines du culte de Pyrath', type: 'EXPLORE', targetId: 'ignis_reach', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Vaincre le Gardien de la relique', type: 'KILL', targetId: 'pyrath_guardian', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Rapporter la relique à Brenn', type: 'DELIVER', targetId: 'brenn', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 500, gold: 200, items: [{ itemId: 'ember_core', quantity: 8 }, { itemId: 'iron_sword', quantity: 1 }] },
    unlockCondition: { level: 8 },
    lore: 'Pyrath était adoré avant d\'être combattu. Les forgerons d\'antan utilisaient ses reliques pour préparer les métaux. Brenn veut faire pareil.'
  },
  {
    id: 'sq_ash_02_the_ash_fever',
    name: 'La Fièvre des Cendres',
    description: 'Une maladie mystérieuse se propage dans les camps de réfugiés. Vareth pense savoir comment la traiter, si on lui rapporte les bons matériaux.',
    type: QuestType.SIDE,
    giverId: 'ember_doc',
    objectives: [
      { id: 'obj1', description: 'Collecter 5 Noyaux d\'Ember profonds', type: 'COLLECT', targetId: 'ember_core', quantity: 5, current: 0, completed: false },
      { id: 'obj2', description: 'Collecter 3 Herbes de Lune', type: 'COLLECT', targetId: 'moonpetal_herb', quantity: 3, current: 0, completed: false },
      { id: 'obj3', description: 'Rapporter les matériaux à Vareth', type: 'DELIVER', targetId: 'ember_doc', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 450, gold: 150, items: [{ itemId: 'elixir_of_vitality', quantity: 2 }] },
    unlockCondition: { level: 8 },
    lore: 'La cendre pénètre les poumons. Vareth dit qu\'elle peut aussi guérir, si on sait quoi chercher.'
  },
  // Pyrath's Crossing
  {
    id: 'sq_pyrath_01_scale_hunter',
    name: 'La Chasse aux Écailles',
    description: 'Keld a besoin d\'écailles de Pyrath pour forger sa meilleure œuvre. Elles se trouvent sur les Wyrms des profondeurs.',
    type: QuestType.SIDE,
    giverId: 'pyrath_smith',
    objectives: [
      { id: 'obj1', description: 'Tuer 6 Wyrms de Braise', type: 'KILL', targetId: 'ember_wyrm', quantity: 6, current: 0, completed: false },
      { id: 'obj2', description: 'Récupérer 4 Écailles de Pyrath', type: 'COLLECT', targetId: 'pyrath_scale', quantity: 4, current: 0, completed: false },
      { id: 'obj3', description: 'Rapporter les écailles à Keld', type: 'DELIVER', targetId: 'pyrath_smith', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 550, gold: 220, items: [{ itemId: 'magma_greatsword', quantity: 1 }] },
    unlockCondition: { level: 9 },
    lore: 'Pyrath couvre ses créatures de ses propres écailles. En récolter est une forme d\'impiété. Keld s\'en fiche.'
  },
  // Deepdelve
  {
    id: 'sq_deepdelve_01_crystal_forge',
    name: 'La Forge de Cristal',
    description: 'Gorak a découvert une recette oubliée qui demande des cristaux d\'une qualité qu\'il n\'a plus. Il faut aller les chercher dans les galeries les plus profondes.',
    type: QuestType.SIDE,
    giverId: 'deepdelve_smith',
    objectives: [
      { id: 'obj1', description: 'Atteindre les galeries du niveau 3', type: 'EXPLORE', targetId: 'terravast', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Collecter 10 Cristaux de Terravast de qualité', type: 'COLLECT', targetId: 'terravast_crystal', quantity: 10, current: 0, completed: false },
      { id: 'obj3', description: 'Rapporter les cristaux à Gorak', type: 'DELIVER', targetId: 'deepdelve_smith', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 600, gold: 250, items: [{ itemId: 'colossus_greatsword', quantity: 1 }] },
    unlockCondition: { level: 10, zoneCleared: ElementType.EARTH },
    lore: 'Les cristaux de surface manquent de profondeur. Ceux du fond portent l\'empreinte de Gorvun lui-même.'
  },
  // Stone Watch
  {
    id: 'sq_stonewatch_01_colossus_heart',
    name: 'Le Cœur du Colosse',
    description: 'Brilda a besoin d\'un cœur de Colosse de Ruine pour forger une armure digne du nom. Ces créatures rôdent au nord.',
    type: QuestType.SIDE,
    giverId: 'stonewatch_smith',
    objectives: [
      { id: 'obj1', description: 'Tuer un Colosse de Ruine majeur', type: 'KILL', targetId: 'ruin_colossus_major', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Récupérer le Cœur du Colosse', type: 'COLLECT', targetId: 'ruin_colossus_core', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Rapporter le cœur à Brilda', type: 'DELIVER', targetId: 'stonewatch_smith', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 650, gold: 280, items: [{ itemId: 'crystal_chest', quantity: 1 }] },
    unlockCondition: { level: 11 },
    lore: 'Les Colosses de Ruine n\'ont pas de cœur au sens propre. Mais ils ont quelque chose qui bat dedans. Brilda appelle ça un cœur.'
  },
  // Windherald
  {
    id: 'sq_wind_01_feather_blade',
    name: 'La Lame de Plumes',
    description: 'Ayle a besoin de plumes de Sylvael pour créer une lame jamais vue. Ces plumes ne se ramassent pas — elles se gagnent.',
    type: QuestType.SIDE,
    giverId: 'windherald_smith',
    objectives: [
      { id: 'obj1', description: 'Atteindre le temple de Sylvael', type: 'EXPLORE', targetId: 'zephyr_peaks', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Tuer 4 Harpies Sylvael gardiennes', type: 'KILL', targetId: 'sylvael_harpy', quantity: 4, current: 0, completed: false },
      { id: 'obj3', description: 'Récupérer 2 Plumes de Sylvael', type: 'COLLECT', targetId: 'sylvael_plume', quantity: 2, current: 0, completed: false },
      { id: 'obj4', description: 'Rapporter les plumes à Ayle', type: 'DELIVER', targetId: 'windherald_smith', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 700, gold: 300, items: [{ itemId: 'phoenix_bow', quantity: 1 }] },
    unlockCondition: { level: 12, zoneCleared: ElementType.WIND },
    lore: 'Sylvael donne ses plumes à ceux qui savent les demander. Ayle préfère une approche plus directe.'
  },
  // Cloudspire
  {
    id: 'sq_cloud_01_phoenix_materials',
    name: 'Les Matériaux du Phénix',
    description: 'Tevan peut créer l\'arc le plus puissant du monde — si on lui rapporte ce qu\'il faut. Des matériaux disséminés dans les hauteurs.',
    type: QuestType.SIDE,
    giverId: 'cloudspire_smith',
    objectives: [
      { id: 'obj1', description: 'Récupérer 3 Plumes de Sylvael', type: 'COLLECT', targetId: 'sylvael_plume', quantity: 3, current: 0, completed: false },
      { id: 'obj2', description: 'Récupérer 8 Pierres de Tempête', type: 'COLLECT', targetId: 'stormstone', quantity: 8, current: 0, completed: false },
      { id: 'obj3', description: 'Rapporter tout à Tevan', type: 'DELIVER', targetId: 'cloudspire_smith', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 750, gold: 350, items: [{ itemId: 'sky_titan_bow', quantity: 1 }] },
    unlockCondition: { level: 13, zoneCleared: ElementType.WIND },
    lore: 'Un arc forgé au sommet avec des matériaux du sommet. Ce n\'est pas de la superstition. C\'est de l\'artisanat.'
  },
  // Saltmourn
  {
    id: 'sq_salt_01_coral_armor',
    name: 'L\'Armure de Corail',
    description: 'Dorn peut forger une armure de corail des profondeurs, résistante comme de l\'acier. Il lui faut des matériaux rares.',
    type: QuestType.SIDE,
    giverId: 'saltmourn_smith',
    objectives: [
      { id: 'obj1', description: 'Plonger dans les ruines inondées', type: 'EXPLORE', targetId: 'abyssmar', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Tuer 5 Chevaliers Noyés gardiens', type: 'KILL', targetId: 'drowned_knight', quantity: 5, current: 0, completed: false },
      { id: 'obj3', description: 'Récolter 8 morceaux de Corail des Profondeurs', type: 'COLLECT', targetId: 'deep_coral', quantity: 8, current: 0, completed: false },
      { id: 'obj4', description: 'Rapporter à Dorn', type: 'DELIVER', targetId: 'saltmourn_smith', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 800, gold: 350, items: [{ itemId: 'coral_chest', quantity: 1 }] },
    unlockCondition: { level: 14, zoneCleared: ElementType.WATER },
    lore: 'Le corail des profondeurs se durcit à l\'air libre. Dorn le sait. Le problème c\'est d\'aller le chercher.'
  },
  // The Wreck
  {
    id: 'sq_wreck_01_leviathan_forge',
    name: 'La Forge du Léviathan',
    description: 'Boro a découvert les plans d\'une armure légendaire dans une épave submergée. Il lui manque les matériaux de Thalymor.',
    type: QuestType.SIDE,
    giverId: 'wreck_smith',
    objectives: [
      { id: 'obj1', description: 'Localiser l\'épave du Roi des Mers', type: 'EXPLORE', targetId: 'abyssmar', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Tuer le Gardien des profondeurs', type: 'KILL', targetId: 'thalymor_guardian', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Récupérer 2 Écailles de Thalymor', type: 'COLLECT', targetId: 'thalymor_scale', quantity: 2, current: 0, completed: false },
      { id: 'obj4', description: 'Rapporter à Boro', type: 'DELIVER', targetId: 'wreck_smith', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 900, gold: 400, items: [{ itemId: 'abyssal_chest', quantity: 1 }] },
    unlockCondition: { level: 15, zoneCleared: ElementType.WATER },
    lore: 'Thalymor armait ses champions avec ses propres écailles. Boro pense pouvoir reproduire ce travail. Avec les bonnes pièces.'
  },
  // The Circuit
  {
    id: 'sq_circuit_01_storm_forge',
    name: 'La Forge des Tempêtes',
    description: 'Rek maîtrise une technique unique : forger avec la foudre de Volkran. Il lui faut des matériaux conducteurs de qualité.',
    type: QuestType.SIDE,
    giverId: 'circuit_smith',
    objectives: [
      { id: 'obj1', description: 'Trouver le générateur central de Volterra', type: 'EXPLORE', targetId: 'volterra', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Tuer 4 Golems Électriques gardiens', type: 'KILL', targetId: 'electric_golem', quantity: 4, current: 0, completed: false },
      { id: 'obj3', description: 'Récupérer 10 unités de Métal Chargé', type: 'COLLECT', targetId: 'charged_metal', quantity: 10, current: 0, completed: false },
      { id: 'obj4', description: 'Rapporter à Rek', type: 'DELIVER', targetId: 'circuit_smith', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 950, gold: 420, items: [{ itemId: 'storm_plate', quantity: 1 }] },
    unlockCondition: { level: 16, zoneCleared: ElementType.LIGHTNING },
    lore: 'La foudre est outil quand on sait la tenir. Rek sait la tenir.'
  },
  // Spark's Rest
  {
    id: 'sq_sparks_01_thunder_weapons',
    name: 'Les Armes du Tonnerre',
    description: 'Thun peut forger des armes imprégnées de la foudre de Volkran. Il lui faut des composants rares du réseau électrique.',
    type: QuestType.SIDE,
    giverId: 'sparks_smith',
    objectives: [
      { id: 'obj1', description: 'Infiltrer le nœud de réseau principal', type: 'EXPLORE', targetId: 'volterra', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Vaincre le Drake du Tonnerre gardien', type: 'KILL', targetId: 'thunder_drake', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Récupérer 6 Bobines de Volkran', type: 'COLLECT', targetId: 'volkran_coil', quantity: 6, current: 0, completed: false },
      { id: 'obj4', description: 'Rapporter à Thun', type: 'DELIVER', targetId: 'sparks_smith', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 1000, gold: 450, items: [{ itemId: 'storm_herald_plate', quantity: 1 }] },
    unlockCondition: { level: 17, zoneCleared: ElementType.LIGHTNING },
    lore: 'Volkran s\'est fragmenté dans son réseau. Ces fragments ont encore quelque chose de lui. Thun veut le capturer dans du métal.'
  },
  // Frostveil
  {
    id: 'sq_frost_01_crysthea_forge',
    name: 'La Forge de Crysthea',
    description: 'Celd connaît une technique de forge transmise par Crysthea elle-même. Il faut des splinters de la divinité pour la pratiquer.',
    type: QuestType.SIDE,
    giverId: 'frostveil_smith',
    objectives: [
      { id: 'obj1', description: 'Atteindre le sanctuaire intérieur de Glaciem', type: 'EXPLORE', targetId: 'glaciem', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Vaincre 3 Titans de Permafrost', type: 'KILL', targetId: 'permafrost_titan', quantity: 3, current: 0, completed: false },
      { id: 'obj3', description: 'Récolter 2 Splinters de Crysthea', type: 'COLLECT', targetId: 'crysthea_splinter', quantity: 2, current: 0, completed: false },
      { id: 'obj4', description: 'Rapporter à Celd', type: 'DELIVER', targetId: 'frostveil_smith', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 1100, gold: 500, items: [{ itemId: 'glaciem_guardian_chest', quantity: 1 }] },
    unlockCondition: { level: 18, zoneCleared: ElementType.ICE },
    lore: 'Crysthea donnait des fragments d\'elle-même aux forgerons dignes de confiance. Celd est peut-être le dernier à connaître la technique.'
  },
  // The Last Hearth
  {
    id: 'sq_hearth_01_titan_heart',
    name: 'Le Cœur du Titan',
    description: 'Torak peut forger l\'ultime épée de Glaciem. Il lui faut le cœur d\'un Dragon de Cristal — une créature quasi-mythique.',
    type: QuestType.SIDE,
    giverId: 'lasthearth_smith',
    objectives: [
      { id: 'obj1', description: 'Trouver le nid des Dragons de Cristal', type: 'EXPLORE', targetId: 'glaciem', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Vaincre le Dragon de Cristal Alpha', type: 'BOSS', targetId: 'crystal_dragon_alpha', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Récupérer le Cœur du Dragon de Cristal', type: 'COLLECT', targetId: 'crystal_dragon_heart', quantity: 1, current: 0, completed: false },
      { id: 'obj4', description: 'Rapporter à Torak', type: 'DELIVER', targetId: 'lasthearth_smith', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 1500, gold: 700, items: [{ itemId: 'titan_greatsword', quantity: 1 }] },
    unlockCondition: { level: 19, zoneCleared: ElementType.ICE },
    lore: 'Les Dragons de Cristal ne meurent pas de vieillesse. Ils deviennent la glace. Vaincre l\'un d\'eux prend quelque chose du monde. Torak le sait.'
  },

  // ── NOUVELLES VILLES : FEDEX QUESTS ────────────────────────────

  // Ashford
  {
    id: 'fq_ash_01_forge_order',
    name: 'La Commande du Forgeron',
    description: 'Brenn a reçu une commande urgente mais il manque de matériaux. Il a besoin de noyaux d\'Ember.',
    type: QuestType.FEDEX,
    giverId: 'brenn',
    objectives: [
      { id: 'obj1', description: 'Collecter 8 Noyaux d\'Ember', type: 'COLLECT', targetId: 'ember_core', quantity: 8, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer les noyaux à Brenn', type: 'DELIVER', targetId: 'brenn', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 200, gold: 100, items: [{ itemId: 'iron_chest', quantity: 1 }] },
  },
  {
    id: 'fq_ash_02_ash_delivery',
    name: 'La Livraison de Cendres',
    description: 'Solenne attend une livraison de cendres purifiées du cratère nord. Le porteur n\'est pas revenu.',
    type: QuestType.FEDEX,
    giverId: 'solenne',
    objectives: [
      { id: 'obj1', description: 'Aller au cratère nord', type: 'EXPLORE', targetId: 'ignis_reach', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Trouver le porteur disparu', type: 'EXPLORE', targetId: 'ignis_reach', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Rapporter les cendres à Solenne', type: 'DELIVER', targetId: 'solenne', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 180, gold: 90, items: [{ itemId: 'volcanic_ash', quantity: 10 }] },
  },
  {
    id: 'fq_ash_03_ember_cure',
    name: 'Le Remède de la Fièvre',
    description: 'Vareth a besoin de noyaux d\'Ember des profondeurs pour préparer un remède contre la fièvre des cendres.',
    type: QuestType.FEDEX,
    giverId: 'ember_doc',
    objectives: [
      { id: 'obj1', description: 'Collecter 5 Noyaux d\'Ember profonds', type: 'COLLECT', targetId: 'ember_core', quantity: 5, current: 0, completed: false },
      { id: 'obj2', description: 'Rapporter à Vareth', type: 'DELIVER', targetId: 'ember_doc', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 220, gold: 110, items: [{ itemId: 'antidote', quantity: 5 }] },
  },
  // Pyrath's Crossing
  {
    id: 'fq_pyrath_01_lava_samples',
    name: 'Échantillons de Lave',
    description: 'Ila paie bien pour des échantillons de lave profonde — les vrais, pas les superficiels.',
    type: QuestType.FEDEX,
    giverId: 'crossing_merchant',
    objectives: [
      { id: 'obj1', description: 'Collecter 5 Échantillons de lave profonde', type: 'COLLECT', targetId: 'volcanic_ash', quantity: 5, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Ila', type: 'DELIVER', targetId: 'crossing_merchant', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 200, gold: 120 },
  },
  {
    id: 'fq_pyrath_02_brew_fire',
    name: 'Distillation de Cendres',
    description: 'Pyrion veut tester une nouvelle distillation avec de la cendre des hauteurs d\'Ignis Reach.',
    type: QuestType.FEDEX,
    giverId: 'crossing_alchemist',
    objectives: [
      { id: 'obj1', description: 'Collecter 8 unités de Cendre volcanique des hauteurs', type: 'COLLECT', targetId: 'volcanic_ash', quantity: 8, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Pyrion', type: 'DELIVER', targetId: 'crossing_alchemist', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 190, gold: 100, items: [{ itemId: 'elixir_of_vitality', quantity: 2 }] },
  },
  // Deepdelve
  {
    id: 'fq_deep_01_ore_run',
    name: 'Course au Minerai',
    description: 'Gorak manque de minerai de fer. La galerie est trop dangereuse en ce moment pour ses ouvriers.',
    type: QuestType.FEDEX,
    giverId: 'deepdelve_smith',
    objectives: [
      { id: 'obj1', description: 'Collecter 10 unités de Minerai de fer', type: 'COLLECT', targetId: 'iron_ore', quantity: 10, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Gorak', type: 'DELIVER', targetId: 'deepdelve_smith', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 180, gold: 90 },
  },
  {
    id: 'fq_deep_02_gem_trade',
    name: 'Le Commerce des Gemmes',
    description: 'Duru a besoin de gemmes des couches profondes — trop dangereux pour elle.',
    type: QuestType.FEDEX,
    giverId: 'deepdelve_merchant',
    objectives: [
      { id: 'obj1', description: 'Collecter 5 Cristaux de Terravast profonds', type: 'COLLECT', targetId: 'terravast_crystal', quantity: 5, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Duru', type: 'DELIVER', targetId: 'deepdelve_merchant', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 200, gold: 130, items: [{ itemId: 'health_potion', quantity: 3 }] },
  },
  {
    id: 'fq_deep_03_mossbrew',
    name: 'La Mousse des Profondeurs',
    description: 'Sable a besoin de mousse des galeries profondes pour ses distillations.',
    type: QuestType.FEDEX,
    giverId: 'deepdelve_alchemist',
    objectives: [
      { id: 'obj1', description: 'Collecter 10 Mousses des cavernes profondes', type: 'COLLECT', targetId: 'cave_moss', quantity: 10, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Sable', type: 'DELIVER', targetId: 'deepdelve_alchemist', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 185, gold: 95, items: [{ itemId: 'antidote', quantity: 4 }] },
  },
  // Stone Watch
  {
    id: 'fq_stone_01_rune_delivery',
    name: 'La Livraison de Runes',
    description: 'Orvin attend un colis de runes anciennes depuis Deepdelve. La messagère n\'est pas arrivée.',
    type: QuestType.FEDEX,
    giverId: 'stonewatch_merchant',
    objectives: [
      { id: 'obj1', description: 'Aller à Deepdelve chercher le colis', type: 'EXPLORE', targetId: 'terravast', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Retrouver la messagère', type: 'TALK', targetId: 'missing_messenger', quantity: 1, current: 0, completed: false },
      { id: 'obj3', description: 'Livrer les runes à Orvin', type: 'DELIVER', targetId: 'stonewatch_merchant', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 250, gold: 130, items: [{ itemId: 'ancient_stone_rune', quantity: 4 }] },
  },
  {
    id: 'fq_stone_02_cave_brew',
    name: 'Herbes Souterraines',
    description: 'Petra a besoin de mousse des grottes profondes pour ses potions.',
    type: QuestType.FEDEX,
    giverId: 'stonewatch_alchemist',
    objectives: [
      { id: 'obj1', description: 'Collecter 10 Mousses des cavernes', type: 'COLLECT', targetId: 'cave_moss', quantity: 10, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Petra', type: 'DELIVER', targetId: 'stonewatch_alchemist', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 200, gold: 100, items: [{ itemId: 'health_potion', quantity: 3 }] },
  },
  // Windherald
  {
    id: 'fq_wind_01_storm_harvest',
    name: 'La Récolte des Tempêtes',
    description: 'Cira cherche des pierres de tempête des îles les plus éloignées — les plus chargées.',
    type: QuestType.FEDEX,
    giverId: 'windherald_merchant',
    objectives: [
      { id: 'obj1', description: 'Collecter 6 Pierres de Tempête chargées', type: 'COLLECT', targetId: 'stormstone', quantity: 6, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Cira', type: 'DELIVER', targetId: 'windherald_merchant', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 250, gold: 140, items: [{ itemId: 'mana_potion', quantity: 3 }] },
  },
  {
    id: 'fq_wind_02_cloud_brew',
    name: 'Essences de Nuage',
    description: 'Zael a besoin d\'essences des nuages proches du sommet pour ses expériences.',
    type: QuestType.FEDEX,
    giverId: 'windherald_alchemist',
    objectives: [
      { id: 'obj1', description: 'Atteindre les couches hautes de Zephyr Peaks', type: 'EXPLORE', targetId: 'zephyr_peaks', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Collecter 5 Essences de nuage', type: 'COLLECT', targetId: 'cloudweave_silk', quantity: 5, current: 0, completed: false },
      { id: 'obj3', description: 'Livrer à Zael', type: 'DELIVER', targetId: 'windherald_alchemist', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 260, gold: 150, items: [{ itemId: 'mana_potion', quantity: 3 }] },
  },
  // Cloudspire
  {
    id: 'fq_cloud_01_plume_run',
    name: 'La Course des Plumes',
    description: 'Liss attend une livraison de plumes depuis Windherald. Le messager est en retard.',
    type: QuestType.FEDEX,
    giverId: 'cloudspire_merchant',
    objectives: [
      { id: 'obj1', description: 'Aller à Windherald récupérer les plumes', type: 'EXPLORE', targetId: 'zephyr_peaks', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Collecter 15 Plumes de Zephyr', type: 'COLLECT', targetId: 'zephyr_feather', quantity: 15, current: 0, completed: false },
      { id: 'obj3', description: 'Livrer à Liss', type: 'DELIVER', targetId: 'cloudspire_merchant', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 270, gold: 145 },
  },
  {
    id: 'fq_cloud_02_altitude_brew',
    name: 'Pierres du Sommet',
    description: 'Ara a besoin de pierres de tempête du sommet le plus haut — pas celles des îles basses.',
    type: QuestType.FEDEX,
    giverId: 'cloudspire_alchemist',
    objectives: [
      { id: 'obj1', description: 'Collecter 6 Pierres de Tempête du sommet', type: 'COLLECT', targetId: 'stormstone', quantity: 6, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Ara', type: 'DELIVER', targetId: 'cloudspire_alchemist', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 250, gold: 140, items: [{ itemId: 'major_mana_potion', quantity: 2 }] },
  },
  // Saltmourn
  {
    id: 'fq_salt_01_tide_map',
    name: 'La Carte des Marées',
    description: 'Vera a besoin d\'une carte des courants, perdue dans les ruines du port. Les Chevaliers Noyés y patrouillent.',
    type: QuestType.FEDEX,
    giverId: 'saltmourn_merchant',
    objectives: [
      { id: 'obj1', description: 'Fouiller les ruines du port', type: 'EXPLORE', targetId: 'abyssmar', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Vaincre 4 Chevaliers Noyés gardiens', type: 'KILL', targetId: 'drowned_knight', quantity: 4, current: 0, completed: false },
      { id: 'obj3', description: 'Récupérer la carte des courants', type: 'COLLECT', targetId: 'saltmourn_tide_map', quantity: 1, current: 0, completed: false },
      { id: 'obj4', description: 'Livrer à Vera', type: 'DELIVER', targetId: 'saltmourn_merchant', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 320, gold: 170, items: [{ itemId: 'health_potion', quantity: 4 }] },
  },
  {
    id: 'fq_salt_02_depth_brew',
    name: 'Corail des Profondeurs',
    description: 'Cora a besoin de corail des vraies profondeurs pour ses potions marines.',
    type: QuestType.FEDEX,
    giverId: 'saltmourn_alchemist',
    objectives: [
      { id: 'obj1', description: 'Collecter 5 morceaux de Corail profond', type: 'COLLECT', targetId: 'deep_coral', quantity: 5, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Cora', type: 'DELIVER', targetId: 'saltmourn_alchemist', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 280, gold: 150, items: [{ itemId: 'antidote', quantity: 4 }] },
  },
  // The Wreck
  {
    id: 'fq_wreck_01_relic_run',
    name: 'Reliques Noyées',
    description: 'Sirenne a besoin de reliques noyées du quartier est. C\'est inondé.',
    type: QuestType.FEDEX,
    giverId: 'wreck_merchant',
    objectives: [
      { id: 'obj1', description: 'Fouiller le quartier est inondé', type: 'EXPLORE', targetId: 'abyssmar', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Récupérer 3 Reliques Noyées', type: 'COLLECT', targetId: 'drowned_relic', quantity: 3, current: 0, completed: false },
      { id: 'obj3', description: 'Livrer à Sirenne', type: 'DELIVER', targetId: 'wreck_merchant', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 300, gold: 165, items: [{ itemId: 'deep_coral', quantity: 5 }] },
  },
  {
    id: 'fq_wreck_02_sea_distillation',
    name: 'Perles des Courants',
    description: 'Narin cherche des perles des courants profonds — pas du fond, du milieu.',
    type: QuestType.FEDEX,
    giverId: 'wreck_alchemist',
    objectives: [
      { id: 'obj1', description: 'Collecter 5 Perles des courants profonds', type: 'COLLECT', targetId: 'pearl', quantity: 5, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Narin', type: 'DELIVER', targetId: 'wreck_alchemist', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 290, gold: 160, items: [{ itemId: 'mana_potion', quantity: 3 }] },
  },
  // The Circuit
  {
    id: 'fq_circuit_01_component_run',
    name: 'Course aux Composants',
    description: 'Volt a besoin de bobines de Volkran depuis le générateur central. C\'est gardé par les Spark Imps.',
    type: QuestType.FEDEX,
    giverId: 'circuit_merchant',
    objectives: [
      { id: 'obj1', description: 'Atteindre le générateur central', type: 'EXPLORE', targetId: 'volterra', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Vaincre 5 Spark Imps', type: 'KILL', targetId: 'spark_imp', quantity: 5, current: 0, completed: false },
      { id: 'obj3', description: 'Récupérer 4 Bobines de Volkran', type: 'COLLECT', targetId: 'volkran_coil', quantity: 4, current: 0, completed: false },
      { id: 'obj4', description: 'Livrer à Volt', type: 'DELIVER', targetId: 'circuit_merchant', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 340, gold: 185, items: [{ itemId: 'charged_metal', quantity: 6 }] },
  },
  {
    id: 'fq_circuit_02_spark_brew',
    name: 'Verre de Tempête',
    description: 'Elka a besoin de verre de tempête de la plaine principale pour ses expériences.',
    type: QuestType.FEDEX,
    giverId: 'circuit_alchemist',
    objectives: [
      { id: 'obj1', description: 'Collecter 6 morceaux de Verre de Tempête', type: 'COLLECT', targetId: 'storm_glass', quantity: 6, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Elka', type: 'DELIVER', targetId: 'circuit_alchemist', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 300, gold: 170, items: [{ itemId: 'full_elixir', quantity: 1 }] },
  },
  // Spark's Rest
  {
    id: 'fq_sparks_01_pelt_trade',
    name: 'Fourrures de Volt Hound',
    description: 'Hessa paie bien pour 6 pelages de Volt Hound. En échange, de bonnes munitions.',
    type: QuestType.FEDEX,
    giverId: 'sparks_merchant',
    objectives: [
      { id: 'obj1', description: 'Tuer 6 Volt Hounds', type: 'KILL', targetId: 'volt_hound', quantity: 6, current: 0, completed: false },
      { id: 'obj2', description: 'Collecter 6 Pelages de Volt Hound', type: 'COLLECT', targetId: 'volt_hound_pelt', quantity: 6, current: 0, completed: false },
      { id: 'obj3', description: 'Livrer à Hessa', type: 'DELIVER', targetId: 'sparks_merchant', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 310, gold: 175, items: [{ itemId: 'thunder_rune', quantity: 4 }] },
  },
  {
    id: 'fq_sparks_02_chain_brew',
    name: 'Éclats Chargés',
    description: 'Gale a besoin d\'éclats de tempête des zones les plus chargées.',
    type: QuestType.FEDEX,
    giverId: 'sparks_alchemist',
    objectives: [
      { id: 'obj1', description: 'Collecter 8 Éclats de Tempête', type: 'COLLECT', targetId: 'storm_shard', quantity: 8, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Gale', type: 'DELIVER', targetId: 'sparks_alchemist', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 300, gold: 165, items: [{ itemId: 'major_mana_potion', quantity: 2 }] },
  },
  // Frostveil
  {
    id: 'fq_frost_01_ice_harvest',
    name: 'La Récolte du Givre',
    description: 'Sola a besoin de fleurs de givre des grottes du nord.',
    type: QuestType.FEDEX,
    giverId: 'frostveil_merchant',
    objectives: [
      { id: 'obj1', description: 'Atteindre les grottes du nord de Glaciem', type: 'EXPLORE', targetId: 'glaciem', quantity: 1, current: 0, completed: false },
      { id: 'obj2', description: 'Collecter 8 Fleurs de Givre', type: 'COLLECT', targetId: 'icebloom_flower', quantity: 8, current: 0, completed: false },
      { id: 'obj3', description: 'Livrer à Sola', type: 'DELIVER', targetId: 'frostveil_merchant', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 320, gold: 180, items: [{ itemId: 'frozen_essence', quantity: 3 }] },
  },
  {
    id: 'fq_frost_02_glaciem_brew',
    name: 'Essence des Profondeurs',
    description: 'Lyse a besoin d\'essence gelée des couches profondes.',
    type: QuestType.FEDEX,
    giverId: 'frostveil_alchemist',
    objectives: [
      { id: 'obj1', description: 'Collecter 5 Essences Gelées profondes', type: 'COLLECT', targetId: 'frozen_essence', quantity: 5, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Lyse', type: 'DELIVER', targetId: 'frostveil_alchemist', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 310, gold: 175, items: [{ itemId: 'elixir_of_arcana', quantity: 2 }] },
  },
  // The Last Hearth
  {
    id: 'fq_hearth_01_wolf_hunt',
    name: 'La Chasse aux Loups',
    description: 'Les loups de givre s\'approchent trop du dernier foyer. Bera veut qu\'on les repousse.',
    type: QuestType.FEDEX,
    giverId: 'lasthearth_merchant',
    objectives: [
      { id: 'obj1', description: 'Tuer 8 Loups de Givre', type: 'KILL', targetId: 'frost_wolf', quantity: 8, current: 0, completed: false },
      { id: 'obj2', description: 'Rapporter à Bera', type: 'DELIVER', targetId: 'lasthearth_merchant', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 350, gold: 200, items: [{ itemId: 'frost_wolf_pelt', quantity: 3 }] },
  },
  {
    id: 'fq_hearth_02_warmth_brew',
    name: 'Chaleur en Bouteille',
    description: 'Meld a besoin de fleurs de givre des grottes profondes pour distiller sa chaleur en fiole.',
    type: QuestType.FEDEX,
    giverId: 'lasthearth_alchemist',
    objectives: [
      { id: 'obj1', description: 'Collecter 10 Fleurs de Givre profondes', type: 'COLLECT', targetId: 'icebloom_flower', quantity: 10, current: 0, completed: false },
      { id: 'obj2', description: 'Livrer à Meld', type: 'DELIVER', targetId: 'lasthearth_alchemist', quantity: 1, current: 0, completed: false },
    ],
    rewards: { xp: 340, gold: 195, items: [{ itemId: 'full_elixir', quantity: 1 }] },
  },
];

export const QUEST_MAP: Record<string, Quest> = Object.fromEntries(QUESTS.map(q => [q.id, q]));
