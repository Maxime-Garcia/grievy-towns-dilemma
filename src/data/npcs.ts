import { NPC, QuestStatus } from '../types';

export const NPCS: NPC[] = [
  {
    id: 'aldric',
    name: 'Aldric',
    sprite: 'npc_aldric',
    portrait: 'portrait_aldric',
    location: 'grievy_town',
    questIds: ['mq_00_awakening', 'mq_04_point_of_no_return', 'mq_05_malachar', 'sq_01_aldrics_past'],
    dialogue: {
      rootId: 'aldric_default',
      lines: {
        aldric_default: {
          id: 'aldric_default',
          speaker: 'Aldric',
          text: 'You look better than when I found you. That\'s something.',
          choices: [
            { text: 'Tell me what happened when you found me.', next: 'aldric_story' },
            { text: 'What\'s going on in the town?', next: 'aldric_town' },
            { text: 'Nothing. Just passing by.', next: 'aldric_goodbye' },
          ]
        },
        aldric_story: {
          id: 'aldric_story',
          speaker: 'Aldric',
          text: 'Found you on the east road. Face down, breathing. No wounds I could see. Brought you home. You\'ve been out for two days.',
          next: 'aldric_story2'
        },
        aldric_story2: {
          id: 'aldric_story2',
          speaker: 'Aldric',
          text: 'You don\'t remember anything? Nothing at all? Name, where you came from, where you were going?',
          choices: [
            { text: 'Nothing. Not even my name.', next: 'aldric_name' },
            { text: 'I\'ll figure it out.', next: 'aldric_nod' },
          ]
        },
        aldric_name: {
          id: 'aldric_name',
          speaker: 'Aldric',
          text: 'Well. You\'ll need something to go by. Pick something. Names can be replaced. The person wearing them can\'t.',
          next: 'aldric_default'
        },
        aldric_nod: {
          id: 'aldric_nod',
          speaker: 'Aldric',
          text: 'That\'s the spirit. Bread\'s on the table if you want it.',
          next: 'aldric_default'
        },
        aldric_town: {
          id: 'aldric_town',
          speaker: 'Aldric',
          text: 'Tremors. Started about three weeks ago. Refugees coming in from all directions — Ignis Reach first, then Terravast. They say the elemental zones have gone mad.',
          next: 'aldric_town2'
        },
        aldric_town2: {
          id: 'aldric_town2',
          speaker: 'Aldric',
          text: 'People here are scared. I\'d be scared too if I let myself. Talk to Kelvar at the guard post — he knows more than I do.',
          trigger: { setFlag: 'met_aldric' },
          next: 'aldric_default'
        },
        aldric_goodbye: {
          id: 'aldric_goodbye',
          speaker: 'Aldric',
          text: 'Bread\'s on the table. Help yourself.',
        }
      }
    }
  },

  {
    id: 'mira',
    name: 'Mira',
    sprite: 'npc_mira',
    portrait: 'portrait_mira',
    location: 'grievy_town',
    questIds: ['fq_01_mirasherbs'],
    shopItems: ['minor_health_potion', 'health_potion', 'major_health_potion', 'minor_mana_potion', 'mana_potion', 'antidote', 'revive_crystal'],
    dialogue: {
      rootId: 'mira_default',
      lines: {
        mira_default: {
          id: 'mira_default',
          speaker: 'Mira',
          text: 'The tremors are getting worse. I\'ve been running low on everything. What do you need?',
          choices: [
            { text: 'I\'d like to buy something.', next: 'mira_shop' },
            { text: 'What can you tell me about the tremors?', next: 'mira_tremors' },
            { text: 'Nothing right now.', next: 'mira_bye' },
          ]
        },
        mira_shop: {
          id: 'mira_shop',
          speaker: 'Mira',
          text: 'I have what I have. Take a look.',
          trigger: { setFlag: 'open_shop_mira' }
        },
        mira_tremors: {
          id: 'mira_tremors',
          speaker: 'Mira',
          text: 'First one woke me up three weeks ago. Small — I thought it was nothing. Then the refugees started arriving. They say the zones are... violent. That\'s the word they use.',
          next: 'mira_tremors2'
        },
        mira_tremors2: {
          id: 'mira_tremors2',
          speaker: 'Mira',
          text: 'I\'ve been selling everything I have to the people coming through. I\'m almost out of herbs. The forest edge ones are too dangerous to reach now. Could you—',
          trigger: { startQuest: 'fq_01_mirasherbs' },
          next: 'mira_default'
        },
        mira_bye: {
          id: 'mira_bye',
          speaker: 'Mira',
          text: 'Stay safe out there.'
        }
      }
    }
  },

  {
    id: 'theron',
    name: 'Theron',
    sprite: 'npc_theron',
    portrait: 'portrait_theron',
    location: 'grievy_town',
    questIds: ['fq_02_theronsmetal'],
    shopItems: ['iron_sword', 'steel_sword', 'iron_helm', 'iron_chest', 'leather_boots', 'leather_chest', 'leather_helm'],
    dialogue: {
      rootId: 'theron_default',
      lines: {
        theron_default: {
          id: 'theron_default',
          speaker: 'Theron',
          text: 'I can sharpen what you have or sell you something new. What\'s it to be?',
          choices: [
            { text: 'Let me see what you have.', next: 'theron_shop' },
            { text: 'Can you upgrade my gear?', next: 'theron_upgrade' },
            { text: 'Just passing.', next: 'theron_bye' },
          ]
        },
        theron_shop: {
          id: 'theron_shop',
          speaker: 'Theron',
          text: 'Basic stock. Better than nothing.',
          trigger: { setFlag: 'open_shop_theron' }
        },
        theron_upgrade: {
          id: 'theron_upgrade',
          speaker: 'Theron',
          text: 'Bring me materials and I\'ll see what I can do. Zone materials are best — that stuff doesn\'t come through regular channels.',
          next: 'theron_default'
        },
        theron_bye: {
          id: 'theron_bye',
          speaker: 'Theron',
          text: 'Come back when you need something.'
        }
      }
    }
  },

  {
    id: 'brother_ovan',
    name: 'Brother Ovan',
    sprite: 'npc_brother_ovan',
    portrait: 'portrait_brother_ovan',
    location: 'grievy_town',
    questIds: ['mq_02_price_of_power', 'sq_03_crystal_archivist', 'sq_06_fragments_of_gorvun', 'sq_07_malachars_notes', 'fq_04_ovanresearch'],
    dialogue: {
      rootId: 'ovan_default',
      lines: {
        ovan_default: {
          id: 'ovan_default',
          speaker: 'Brother Ovan',
          text: 'I\'ve been studying the records of the six divinities for twenty years. I think I finally understand what they were. I\'m less sure I understand what they\'re becoming.',
          choices: [
            { text: 'Tell me about the divinities.', next: 'ovan_divinities' },
            { text: 'What do you know about Malachar?', next: 'ovan_malachar' },
            { text: 'I\'ll let you get back to your research.', next: 'ovan_bye' },
          ]
        },
        ovan_divinities: {
          id: 'ovan_divinities',
          speaker: 'Brother Ovan',
          text: 'Six beings. Six elements. Each claimed a territory a century ago and shaped it to their nature. The world was better for it. That\'s the frustrating part — they were beneficial. And now someone decided that wasn\'t enough.',
          next: 'ovan_default'
        },
        ovan_malachar: {
          id: 'ovan_malachar',
          speaker: 'Brother Ovan',
          text: 'I knew Malachar. Not well — he kept to himself, always working. I thought he was eccentric. I didn\'t ask the right questions.',
          next: 'ovan_malachar2'
        },
        ovan_malachar2: {
          id: 'ovan_malachar2',
          speaker: 'Brother Ovan',
          text: 'He believed the divine order was a theft. That the elemental power should flow freely rather than be held by six beings who never asked for our consent. There\'s a kind of logic to it, if you remove the part about the consequences.',
          next: 'ovan_default'
        },
        ovan_bye: {
          id: 'ovan_bye',
          speaker: 'Brother Ovan',
          text: 'I\'ll be here. Reading. Trying to figure out what we\'re supposed to do next.'
        }
      }
    }
  },

  {
    id: 'liria',
    name: 'Liria',
    sprite: 'npc_liria',
    portrait: 'portrait_liria',
    location: 'grievy_town',
    questIds: ['mq_03_world_grows_silent', 'fq_03_liriascat'],
    dialogue: {
      rootId: 'liria_default',
      lines: {
        liria_default: {
          id: 'liria_default',
          speaker: 'Liria',
          text: 'The inn has rooms. I can also keep your progress safe — think of me as someone who remembers for you.',
          choices: [
            { text: 'I\'d like to save my progress.', next: 'liria_save' },
            { text: 'A room for the night.', next: 'liria_rest' },
            { text: 'What\'s the word around town?', next: 'liria_gossip' },
            { text: 'Nothing right now.', next: 'liria_bye' },
          ]
        },
        liria_save: {
          id: 'liria_save',
          speaker: 'Liria',
          text: 'Of course. I\'ll make note of where you are and what you\'ve done.',
          trigger: { setFlag: 'save_game' }
        },
        liria_rest: {
          id: 'liria_rest',
          speaker: 'Liria',
          text: '20 gold for the night. You\'ll wake up with full HP and Mana.',
          trigger: { setFlag: 'rest_inn' }
        },
        liria_gossip: {
          id: 'liria_gossip',
          speaker: 'Liria',
          text: 'People are leaving. Every day, a few more gone. I understand it — I don\'t blame them. But the ones who stay deserve to know what\'s happening.',
          next: 'liria_gossip2'
        },
        liria_gossip2: {
          id: 'liria_gossip2',
          speaker: 'Liria',
          text: 'The tremors are connected to the zones — everyone knows that now. What they don\'t know is what you\'ve told Kelvar and Ovan. I suspect it\'s worse than it looks.',
          next: 'liria_default'
        },
        liria_bye: {
          id: 'liria_bye',
          speaker: 'Liria',
          text: 'The rooms are here if you need them.'
        }
      }
    }
  },

  {
    id: 'kelvar',
    name: 'Kelvar',
    sprite: 'npc_kelvar',
    portrait: 'portrait_kelvar',
    location: 'grievy_town',
    questIds: ['mq_00_awakening', 'fq_05_kelvarsrounds'],
    dialogue: {
      rootId: 'kelvar_default',
      lines: {
        kelvar_default: {
          id: 'kelvar_default',
          speaker: 'Kelvar',
          text: 'I heard about you from Aldric. A stranger with no name who fights better than anyone I\'ve trained. We could use that.',
          choices: [
            { text: 'Tell me about the situation.', next: 'kelvar_situation' },
            { text: 'What do you need from me?', next: 'kelvar_quest' },
            { text: 'Not now.', next: 'kelvar_bye' },
          ]
        },
        kelvar_situation: {
          id: 'kelvar_situation',
          speaker: 'Kelvar',
          text: 'Six elemental zones. All of them erupted over the past month. The pattern suggests it\'s not natural — something triggered it simultaneously. Or someone.',
          next: 'kelvar_situation2'
        },
        kelvar_situation2: {
          id: 'kelvar_situation2',
          speaker: 'Kelvar',
          text: 'The people here can\'t do anything about it. I\'ve got twelve guards and a town wall. You\'re the first person to walk in here in weeks who looked like they could actually fight.',
          next: 'kelvar_default'
        },
        kelvar_quest: {
          id: 'kelvar_quest',
          speaker: 'Kelvar',
          text: 'Go to the zones. Find out what\'s happening. If you can stop it — stop it. That\'s all I can ask.',
          trigger: { startQuest: 'mq_01_first_tremor' },
          next: 'kelvar_default'
        },
        kelvar_bye: {
          id: 'kelvar_bye',
          speaker: 'Kelvar',
          text: 'Come back when you\'re ready.'
        }
      }
    }
  },

  {
    id: 'ysolde',
    name: 'Ysolde',
    sprite: 'npc_ysolde',
    portrait: 'portrait_ysolde',
    location: 'grievy_town',
    questIds: ['sq_04_volterra_engineer', 'fq_06_ysoldedeliver', 'fq_07_feathers'],
    shopItems: ['minor_health_potion', 'minor_mana_potion', 'antidote', 'aldrics_bread'],
    dialogue: {
      rootId: 'ysolde_default',
      lines: {
        ysolde_default: {
          id: 'ysolde_default',
          speaker: 'Ysolde',
          text: 'You hear things in a general shop. People talk when they think no one\'s listening. Can I help you?',
          choices: [
            { text: 'Let me see your stock.', next: 'ysolde_shop' },
            { text: 'What have you heard lately?', next: 'ysolde_gossip' },
            { text: 'Nothing right now.', next: 'ysolde_bye' },
          ]
        },
        ysolde_shop: {
          id: 'ysolde_shop',
          speaker: 'Ysolde',
          text: 'Take a look. I keep what sells.',
          trigger: { setFlag: 'open_shop_ysolde' }
        },
        ysolde_gossip: {
          id: 'ysolde_gossip',
          speaker: 'Ysolde',
          text: 'Someone came through from Volterra. An engineer, I think — hands like someone who works with machines. He looked like he\'d been running for days.',
          next: 'ysolde_gossip2'
        },
        ysolde_gossip2: {
          id: 'ysolde_gossip2',
          speaker: 'Ysolde',
          text: 'He kept saying there was someone still there. Someone who knew how to shut the grid down. I don\'t suppose you\'re going to Volterra?',
          trigger: { startQuest: 'sq_04_volterra_engineer' },
          next: 'ysolde_default'
        },
        ysolde_bye: {
          id: 'ysolde_bye',
          speaker: 'Ysolde',
          text: 'Come back any time.'
        }
      }
    }
  },

  {
    id: 'elara',
    name: 'Elara',
    sprite: 'npc_elara',
    portrait: 'portrait_elara',
    location: 'glaciem',
    questIds: ['sq_08_find_elara'],
    isHidden: true,
    dialogue: {
      rootId: 'elara_default',
      lines: {
        elara_default: {
          id: 'elara_default',
          speaker: 'Elara',
          text: 'You found me. That\'s not easy. Sit down. The ice doesn\'t bite if you know how to ask.',
          choices: [
            { text: 'How long have you been here?', next: 'elara_time' },
            { text: 'Can you teach me something?', next: 'elara_teach' },
            { text: 'What do you know about Crysthea?', next: 'elara_crysthea' },
          ]
        },
        elara_time: {
          id: 'elara_time',
          speaker: 'Elara',
          text: 'Thirty years. I came to study. I stayed because the records here are more complete than anywhere else in Velmara.',
          next: 'elara_time2'
        },
        elara_time2: {
          id: 'elara_time2',
          speaker: 'Elara',
          text: 'When the blizzard started, I couldn\'t leave. By the time it slowed enough to try, I wasn\'t sure I wanted to. This place knows things.',
          next: 'elara_default'
        },
        elara_teach: {
          id: 'elara_teach',
          speaker: 'Elara',
          text: 'The water here carries memory. If you let it, it will sustain you — slowly repair what the world damages. I\'ve lived on it for thirty years.',
          next: 'elara_teach2'
        },
        elara_teach2: {
          id: 'elara_teach2',
          speaker: 'Elara',
          text: 'Here. I\'ll show you how it works.',
          trigger: { startQuest: 'sq_08_find_elara' },
          next: 'elara_default'
        },
        elara_crysthea: {
          id: 'elara_crysthea',
          speaker: 'Elara',
          text: 'She was the oldest. I don\'t know how old. The records she preserved go back before the other divinities arrived. Before Velmara was what it is now.',
          next: 'elara_crysthea2'
        },
        elara_crysthea2: {
          id: 'elara_crysthea2',
          speaker: 'Elara',
          text: 'I think she knew this would happen someday. She preserved everything as if she expected someone might need it later. She was right. She\'s always right.',
          next: 'elara_default'
        }
      }
    }
  }
];

export const NPC_MAP: Record<string, NPC> = Object.fromEntries(NPCS.map(n => [n.id, n]));
