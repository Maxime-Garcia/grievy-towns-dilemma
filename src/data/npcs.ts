import { NPC, QuestStatus } from '../types';

export const GRIEVY_NPCS: NPC[] = [
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

// ── NPCs DES NOUVELLES VILLES ────────────────────────────────────────────────

// Helpers pour NPC basiques (fond de décor)
function bgNpc(id: string, name: string, location: string, text: string): NPC {
  return {
    id, name,
    sprite: `npc_${id}`,
    portrait: `portrait_${id}`,
    location,
    questIds: [],
    dialogue: {
      rootId: `${id}_default`,
      lines: {
        [`${id}_default`]: { id: `${id}_default`, speaker: name, text }
      }
    }
  };
}

// ══════════════════════════════════════════════════════════════════
// ASHFORD (Ignis Reach — ville 1)
// ══════════════════════════════════════════════════════════════════

export const ASHFORD_NPCS: NPC[] = [
  {
    id: 'brenn',
    name: 'Brenn le Forgeron',
    sprite: 'npc_brenn',
    portrait: 'portrait_brenn',
    location: 'ashford',
    questIds: ['fq_ash_01_forge_order', 'sq_ash_01_pyrath_relic'],
    shopItems: ['iron_sword', 'steel_sword', 'magma_greatsword', 'iron_helm', 'iron_chest', 'obsidian_gauntlets', 'fire_boots'],
    dialogue: {
      rootId: 'brenn_default',
      lines: {
        brenn_default: { id: 'brenn_default', speaker: 'Brenn', text: 'La forge tient bon. Le reste, on verra. Tu veux acheter ou faire forger ?', choices: [
          { text: 'Voir ta marchandise.', next: 'brenn_shop' },
          { text: 'Je cherche quelque chose de spécial.', next: 'brenn_craft' },
          { text: 'Rien pour l\'instant.', next: 'brenn_bye' },
        ]},
        brenn_shop: { id: 'brenn_shop', speaker: 'Brenn', text: 'Fais ton choix.', trigger: { setFlag: 'open_shop_brenn' } },
        brenn_craft: { id: 'brenn_craft', speaker: 'Brenn', text: 'Ramène-moi des matériaux de la zone et je verrai ce que je peux faire. Les noyaux d\'Ember et l\'obsidienne font du bon métal.', trigger: { setFlag: 'open_craft_brenn' } },
        brenn_bye: { id: 'brenn_bye', speaker: 'Brenn', text: 'Reviens quand tu as besoin.' }
      }
    }
  },
  {
    id: 'solenne',
    name: 'Solenne la Marchande',
    sprite: 'npc_solenne',
    portrait: 'portrait_solenne',
    location: 'ashford',
    questIds: ['fq_ash_02_ash_delivery'],
    shopItems: ['ember_core', 'obsidian_shard', 'volcanic_ash', 'ash_residue', 'iron_ore', 'minor_health_potion', 'antidote', 'aldrics_bread'],
    dialogue: {
      rootId: 'solenne_default',
      lines: {
        solenne_default: { id: 'solenne_default', speaker: 'Solenne', text: 'Les cendres ne valent pas grand-chose. Mais si tu en as beaucoup... elles valent quelque chose.', choices: [
          { text: 'Montrez-moi votre stock.', next: 'solenne_shop' },
          { text: 'Vous avez besoin d\'aide ?', next: 'solenne_quest' },
          { text: 'Pas maintenant.', next: 'solenne_bye' },
        ]},
        solenne_shop: { id: 'solenne_shop', speaker: 'Solenne', text: 'Voilà ce qui me reste.', trigger: { setFlag: 'open_shop_solenne' } },
        solenne_quest: { id: 'solenne_quest', speaker: 'Solenne', text: 'J\'attends une livraison de cendres purifiées du cratère nord. Le porteur n\'est pas revenu.', trigger: { startQuest: 'fq_ash_02_ash_delivery' }, next: 'solenne_default' },
        solenne_bye: { id: 'solenne_bye', speaker: 'Solenne', text: 'Reviens.' }
      }
    }
  },
  {
    id: 'ember_doc',
    name: 'Vareth l\'Alchimiste',
    sprite: 'npc_ember_doc',
    portrait: 'portrait_ember_doc',
    location: 'ashford',
    questIds: ['fq_ash_03_ember_cure', 'sq_ash_02_the_ash_fever'],
    shopItems: ['minor_health_potion', 'health_potion', 'major_health_potion', 'minor_mana_potion', 'mana_potion', 'antidote', 'revive_crystal'],
    dialogue: {
      rootId: 'vareth_default',
      lines: {
        vareth_default: { id: 'vareth_default', speaker: 'Vareth', text: 'La fièvre des cendres progresse dans le camp. J\'ai besoin de matériaux que je ne peux pas aller chercher moi-même.', choices: [
          { text: 'Qu\'est-ce que vous vendez ?', next: 'vareth_shop' },
          { text: 'Que vous faut-il ?', next: 'vareth_quest' },
          { text: 'Je reviendrai.', next: 'vareth_bye' },
        ]},
        vareth_shop: { id: 'vareth_shop', speaker: 'Vareth', text: 'Prends ce qu\'il te faut.', trigger: { setFlag: 'open_shop_vareth' } },
        vareth_quest: { id: 'vareth_quest', speaker: 'Vareth', text: 'Des noyaux d\'Ember des profondeurs du volcan — pas les superficiels, les vrais. Cinq devrait suffire.', trigger: { startQuest: 'fq_ash_03_ember_cure' }, next: 'vareth_default' },
        vareth_bye: { id: 'vareth_bye', speaker: 'Vareth', text: 'Fais vite.' }
      }
    }
  },
  {
    id: 'cinder_tailor',
    name: 'Ash le Costumier',
    sprite: 'npc_cinder_tailor',
    portrait: 'portrait_cinder_tailor',
    location: 'ashford',
    questIds: [],
    shopItems: ['skin_ember_cloak', 'skin_pilgrim_garb'],
    dialogue: {
      rootId: 'ash_tailor_default',
      lines: {
        ash_tailor_default: { id: 'ash_tailor_default', speaker: 'Ash', text: 'La cendre teint bien. Et ça dure. Tu veux quelque chose de particulier ?', choices: [
          { text: 'Voir les skins disponibles.', next: 'ash_shop' },
          { text: 'Vous pouvez fabriquer sur commande ?', next: 'ash_craft' },
          { text: 'Non merci.', next: 'ash_bye' },
        ]},
        ash_shop: { id: 'ash_shop', speaker: 'Ash', text: 'Voilà mes créations.', trigger: { setFlag: 'open_shop_ash_tailor' } },
        ash_craft: { id: 'ash_craft', speaker: 'Ash', text: 'Ramène-moi les matières premières et je te taillerai ce que tu veux.', trigger: { setFlag: 'open_craft_ash_tailor' } },
        ash_bye: { id: 'ash_bye', speaker: 'Ash', text: 'Porte quelque chose de bien.' }
      }
    }
  },
  bgNpc('ashford_guard_1',  'Karol',       'ashford', 'Le mur tient. Tant qu\'il tient, on tient.'),
  bgNpc('ashford_refugee_1','Tomas',        'ashford', 'J\'ai quitté ma maison avec juste ça dans les bras. Le reste a brûlé.'),
  bgNpc('ashford_child_1',  'Linn',         'ashford', 'Papa dit que le volcan va s\'arrêter. Moi j\'y crois plus trop.'),
  bgNpc('ashford_elder',    'Vieille Maren','ashford', 'Ignis Reach brûlait déjà de mon temps. Mais pas comme ça.'),
  bgNpc('ashford_miner',    'Ruck le Mineur','ashford','Je cherche encore des noyaux. Brenn en a besoin. Vous aussi, j\'imagine.'),
  bgNpc('ashford_healer',   'Sira',         'ashford', 'Je manque de herbes. Tout le monde manque de quelque chose ici.'),
  bgNpc('ashford_scout',    'Dael',         'ashford', 'Les Ember Wyrms ont gagné du terrain. Ne prenez pas la route du nord.'),
];

// ══════════════════════════════════════════════════════════════════
// PYRATH'S CROSSING (Ignis Reach — ville 2)
// ══════════════════════════════════════════════════════════════════

export const PYRATH_CROSSING_NPCS: NPC[] = [
  {
    id: 'pyrath_smith',
    name: 'Keld le Forgeron',
    sprite: 'npc_pyrath_smith',
    portrait: 'portrait_pyrath_smith',
    location: 'pyrath_crossing',
    questIds: ['sq_pyrath_01_scale_hunter'],
    shopItems: ['steel_sword', 'magma_greatsword', 'fire_chest', 'titan_helm', 'iron_legs', 'fire_boots', 'obsidian_gauntlets'],
    dialogue: {
      rootId: 'keld_default',
      lines: {
        keld_default: { id: 'keld_default', speaker: 'Keld', text: 'Les écailles de Pyrath font la meilleure armure du monde. Le problème c\'est qu\'elles appartiennent à Pyrath.', choices: [
          { text: 'Voir ta marchandise.', next: 'keld_shop' },
          { text: 'Parle-moi de ces écailles.', next: 'keld_scale' },
          { text: 'À bientôt.', next: 'keld_bye' },
        ]},
        keld_shop: { id: 'keld_shop', speaker: 'Keld', text: 'Choisis bien.', trigger: { setFlag: 'open_shop_keld' } },
        keld_scale: { id: 'keld_scale', speaker: 'Keld', text: 'Les wyrms en portent des fragments. Récupère-les et reviens.', trigger: { startQuest: 'sq_pyrath_01_scale_hunter' }, next: 'keld_default' },
        keld_bye: { id: 'keld_bye', speaker: 'Keld', text: 'Le marteau attend.' }
      }
    }
  },
  {
    id: 'crossing_merchant',
    name: 'Ila la Marchande',
    sprite: 'npc_crossing_merchant',
    portrait: 'portrait_crossing_merchant',
    location: 'pyrath_crossing',
    questIds: ['fq_pyrath_01_lava_samples'],
    shopItems: ['ember_core', 'obsidian_shard', 'volcanic_ash', 'pyrath_scale', 'minor_health_potion', 'health_potion', 'antidote'],
    dialogue: {
      rootId: 'ila_default',
      lines: {
        ila_default: { id: 'ila_default', speaker: 'Ila', text: 'Le carrefour de Pyrath était célèbre pour ses marchés. Il en reste quelque chose. Pas grand-chose, mais quelque chose.', choices: [
          { text: 'Que vendez-vous ?', next: 'ila_shop' },
          { text: 'J\'ai besoin d\'aide.', next: 'ila_quest' },
          { text: 'Une autre fois.', next: 'ila_bye' },
        ]},
        ila_shop: { id: 'ila_shop', speaker: 'Ila', text: 'Tout ce que j\'ai.', trigger: { setFlag: 'open_shop_ila' } },
        ila_quest: { id: 'ila_quest', speaker: 'Ila', text: 'Je paie bien pour des échantillons de lave profonde. Les vrais, pas les superficiels.', trigger: { startQuest: 'fq_pyrath_01_lava_samples' }, next: 'ila_default' },
        ila_bye: { id: 'ila_bye', speaker: 'Ila', text: 'À bientôt.' }
      }
    }
  },
  {
    id: 'crossing_alchemist',
    name: 'Pyrion l\'Alchimiste',
    sprite: 'npc_crossing_alchemist',
    portrait: 'portrait_crossing_alchemist',
    location: 'pyrath_crossing',
    questIds: ['fq_pyrath_02_brew_fire'],
    shopItems: ['minor_health_potion', 'health_potion', 'major_health_potion', 'minor_mana_potion', 'mana_potion', 'elixir_of_vitality', 'antidote'],
    dialogue: {
      rootId: 'pyrion_default',
      lines: {
        pyrion_default: { id: 'pyrion_default', speaker: 'Pyrion', text: 'J\'étudie les propriétés de la cendre depuis vingt ans. Depuis quelques semaines, elles ont changé.', choices: [
          { text: 'Voir vos potions.', next: 'pyrion_shop' },
          { text: 'Qu\'est-ce qui a changé ?', next: 'pyrion_quest' },
          { text: 'Pas maintenant.', next: 'pyrion_bye' },
        ]},
        pyrion_shop: { id: 'pyrion_shop', speaker: 'Pyrion', text: 'Prends ce qu\'il te faut.', trigger: { setFlag: 'open_shop_pyrion' } },
        pyrion_quest: { id: 'pyrion_quest', speaker: 'Pyrion', text: 'La cendre de zone est plus dense. Si tu m\'en rapportes des hautes altitudes, je peux distiller quelque chose d\'utile.', trigger: { startQuest: 'fq_pyrath_02_brew_fire' }, next: 'pyrion_default' },
        pyrion_bye: { id: 'pyrion_bye', speaker: 'Pyrion', text: 'La science attend.' }
      }
    }
  },
  {
    id: 'crossing_tailor',
    name: 'Nessa la Costumière',
    sprite: 'npc_crossing_tailor',
    portrait: 'portrait_crossing_tailor',
    location: 'pyrath_crossing',
    questIds: [],
    shopItems: ['skin_ember_cloak', 'skin_pilgrim_garb', 'skin_crystal_regalia'],
    dialogue: {
      rootId: 'nessa_default',
      lines: {
        nessa_default: { id: 'nessa_default', speaker: 'Nessa', text: 'Le feu peut être élégant. Tout dépend comment on le porte.', choices: [
          { text: 'Voir vos créations.', next: 'nessa_shop' },
          { text: 'Fabrication sur commande ?', next: 'nessa_craft' },
          { text: 'Non merci.', next: 'nessa_bye' },
        ]},
        nessa_shop: { id: 'nessa_shop', speaker: 'Nessa', text: 'Voilà ce que j\'ai en stock.', trigger: { setFlag: 'open_shop_nessa' } },
        nessa_craft: { id: 'nessa_craft', speaker: 'Nessa', text: 'Rapporte-moi des matériaux du coin. Je fais ce que les autres ne savent pas faire.', trigger: { setFlag: 'open_craft_nessa' } },
        nessa_bye: { id: 'nessa_bye', speaker: 'Nessa', text: 'Bonne route.' }
      }
    }
  },
  bgNpc('crossing_pilgrim_1', 'Ancien Pèlerin', 'pyrath_crossing', 'Je venais ici deux fois par an. Pyrath me parlait. Pas en mots. En chaleur.'),
  bgNpc('crossing_guard',     'Garde Haruk',   'pyrath_crossing', 'On surveille la route du sud. Elle est encore praticable. Pour l\'instant.'),
  bgNpc('crossing_cook',      'Melle',          'pyrath_crossing', 'Je fais la soupe avec ce que j\'ai. Ash pour le goût. C\'est tout ce qu\'il reste.'),
  bgNpc('crossing_priest',    'Frère Ovan-type','pyrath_crossing', 'Pyrath était bon. Ce n\'est pas lui qui a changé.'),
  bgNpc('crossing_refugee_2', 'Harek',          'pyrath_crossing', 'Ma famille est quelque part dans les ruines. Je ne suis pas encore prêt à chercher.'),
  bgNpc('crossing_kid',       'Piko',           'pyrath_crossing', 'Tu as vu un dragon rouge ? J\'en cherche un. Petit. Pas dangereux. Peut-être.'),
];

// ══════════════════════════════════════════════════════════════════
// DEEPDELVE (Terravast — ville 1)
// ══════════════════════════════════════════════════════════════════

export const DEEPDELVE_NPCS: NPC[] = [
  {
    id: 'deepdelve_smith',
    name: 'Gorak le Forgeron',
    sprite: 'npc_deepdelve_smith',
    portrait: 'portrait_deepdelve_smith',
    location: 'deepdelve',
    questIds: ['sq_deepdelve_01_crystal_forge', 'fq_deep_01_ore_run'],
    shopItems: ['steel_sword', 'colossus_greatsword', 'crystal_chest', 'earth_helm', 'iron_legs', 'earth_legs', 'iron_gauntlets'],
    dialogue: {
      rootId: 'gorak_default',
      lines: {
        gorak_default: { id: 'gorak_default', speaker: 'Gorak', text: 'La mine donne encore. Je forge encore. Le monde peut bien trembler.', choices: [
          { text: 'Voir ta marchandise.', next: 'gorak_shop' },
          { text: 'Tu peux fabriquer quelque chose ?', next: 'gorak_craft' },
          { text: 'Pas maintenant.', next: 'gorak_bye' },
        ]},
        gorak_shop: { id: 'gorak_shop', speaker: 'Gorak', text: 'Choisis.', trigger: { setFlag: 'open_shop_gorak' } },
        gorak_craft: { id: 'gorak_craft', speaker: 'Gorak', text: 'Ramène-moi les cristaux et les runes. Je ferai le reste.', trigger: { setFlag: 'open_craft_gorak' } },
        gorak_bye: { id: 'gorak_bye', speaker: 'Gorak', text: 'Je serai là.' }
      }
    }
  },
  {
    id: 'deepdelve_merchant',
    name: 'Duru la Marchande',
    sprite: 'npc_deepdelve_merchant',
    portrait: 'portrait_deepdelve_merchant',
    location: 'deepdelve',
    questIds: ['fq_deep_02_gem_trade'],
    shopItems: ['terravast_crystal', 'ancient_stone_rune', 'cave_moss', 'ruin_colossus_core', 'iron_ore', 'fragment_of_permanence', 'minor_health_potion'],
    dialogue: {
      rootId: 'duru_default',
      lines: {
        duru_default: { id: 'duru_default', speaker: 'Duru', text: 'La mine profonde donne des cristaux que personne d\'autre ne peut obtenir. Tu as quelque chose à échanger ?', choices: [
          { text: 'Voir votre stock.', next: 'duru_shop' },
          { text: 'Vous avez besoin de quelque chose ?', next: 'duru_quest' },
          { text: 'Non.', next: 'duru_bye' },
        ]},
        duru_shop: { id: 'duru_shop', speaker: 'Duru', text: 'Voilà.', trigger: { setFlag: 'open_shop_duru' } },
        duru_quest: { id: 'duru_quest', speaker: 'Duru', text: 'J\'ai besoin de gemmes spéciales des couches profondes. Trop dangereux pour moi.', trigger: { startQuest: 'fq_deep_02_gem_trade' }, next: 'duru_default' },
        duru_bye: { id: 'duru_bye', speaker: 'Duru', text: 'Reviens.' }
      }
    }
  },
  {
    id: 'deepdelve_alchemist',
    name: 'Sable l\'Alchimiste',
    sprite: 'npc_deepdelve_alchemist',
    portrait: 'portrait_deepdelve_alchemist',
    location: 'deepdelve',
    questIds: ['fq_deep_03_mossbrew'],
    shopItems: ['minor_health_potion', 'health_potion', 'major_health_potion', 'mana_potion', 'antidote', 'elixir_of_vitality'],
    dialogue: {
      rootId: 'sable_default',
      lines: {
        sable_default: { id: 'sable_default', speaker: 'Sable', text: 'La mousse des cavernes a des propriétés remarquables. Trop peu de gens savent ça.', choices: [
          { text: 'Voir vos potions.', next: 'sable_shop' },
          { text: 'Que vous faut-il ?', next: 'sable_quest' },
          { text: 'Bonne continuation.', next: 'sable_bye' },
        ]},
        sable_shop: { id: 'sable_shop', speaker: 'Sable', text: 'Ce que j\'ai distillé.', trigger: { setFlag: 'open_shop_sable' } },
        sable_quest: { id: 'sable_quest', speaker: 'Sable', text: 'De la mousse des galeries profondes — pas celle qu\'on trouve à l\'entrée. Si tu en trouves, rapporte-en dix.', trigger: { startQuest: 'fq_deep_03_mossbrew' }, next: 'sable_default' },
        sable_bye: { id: 'sable_bye', speaker: 'Sable', text: 'Prends soin de toi.' }
      }
    }
  },
  {
    id: 'deepdelve_tailor',
    name: 'Roka la Costumière',
    sprite: 'npc_deepdelve_tailor',
    portrait: 'portrait_deepdelve_tailor',
    location: 'deepdelve',
    questIds: [],
    shopItems: ['skin_crystal_regalia', 'skin_pilgrim_garb'],
    dialogue: {
      rootId: 'roka_default',
      lines: {
        roka_default: { id: 'roka_default', speaker: 'Roka', text: 'Le cristal de Terravast brille dans les ténèbres. Autant en profiter.', choices: [
          { text: 'Voir vos créations.', next: 'roka_shop' },
          { text: 'Fabrication sur commande ?', next: 'roka_craft' },
          { text: 'Merci.', next: 'roka_bye' },
        ]},
        roka_shop: { id: 'roka_shop', speaker: 'Roka', text: 'Mes tenues.', trigger: { setFlag: 'open_shop_roka' } },
        roka_craft: { id: 'roka_craft', speaker: 'Roka', text: 'Cristaux et rune. C\'est tout ce qu\'il me faut.', trigger: { setFlag: 'open_craft_roka' } },
        roka_bye: { id: 'roka_bye', speaker: 'Roka', text: 'Reviens brillant.' }
      }
    }
  },
  bgNpc('deepdelve_miner_1',  'Ulv le Mineur', 'deepdelve', 'Les cristaux poussent vite depuis le tremblement. C\'est beau. C\'est aussi un peu effrayant.'),
  bgNpc('deepdelve_guard_1',  'Petra',          'deepdelve', 'On ferme les galeries du bas. Trop instable. Les Golems y pullulent.'),
  bgNpc('deepdelve_scholar',  'Torsten',        'deepdelve', 'Je documente les nouvelles formations cristallines. Gorvun laisse des traces.'),
  bgNpc('deepdelve_cook',     'Mamie Helsa',    'deepdelve', 'Soupe à la mousse. C\'est pas terrible mais ça nourrit.'),
  bgNpc('deepdelve_child_1',  'Brek',           'deepdelve', 'J\'ai trouvé un cristal qui bouge. Tout seul. Je l\'ai mis dans une boîte.'),
  bgNpc('deepdelve_refugee',  'Cara',           'deepdelve', 'Je venais de Stone Watch. La route entre les deux est encore sûre. Plus ou moins.'),
];

// ══════════════════════════════════════════════════════════════════
// STONE WATCH (Terravast — ville 2)
// ══════════════════════════════════════════════════════════════════

export const STONE_WATCH_NPCS: NPC[] = [
  {
    id: 'stonewatch_smith',
    name: 'Brilda la Forgeronne',
    sprite: 'npc_stonewatch_smith',
    portrait: 'portrait_stonewatch_smith',
    location: 'stone_watch',
    questIds: ['sq_stonewatch_01_colossus_heart'],
    shopItems: ['colossus_greatsword', 'gorvun_hammer', 'crystal_chest', 'earth_helm', 'earth_legs', 'iron_gauntlets', 'frost_gauntlets'],
    dialogue: {
      rootId: 'brilda_default',
      lines: {
        brilda_default: { id: 'brilda_default', speaker: 'Brilda', text: 'Les colosses de ruine donnent d\'excellents matériaux. Enfin, une fois qu\'on les a abattus.', choices: [
          { text: 'Voir ta marchandise.', next: 'brilda_shop' },
          { text: 'Tu peux forger sur commande ?', next: 'brilda_craft' },
          { text: 'À une autre fois.', next: 'brilda_bye' },
        ]},
        brilda_shop: { id: 'brilda_shop', speaker: 'Brilda', text: 'Mon stock.', trigger: { setFlag: 'open_shop_brilda' } },
        brilda_craft: { id: 'brilda_craft', speaker: 'Brilda', text: 'Rapporte-moi un cœur de Colosse de Ruine et je fabrique ce que tu veux.', trigger: { startQuest: 'sq_stonewatch_01_colossus_heart' }, next: 'brilda_default' },
        brilda_bye: { id: 'brilda_bye', speaker: 'Brilda', text: 'Je suis là.' }
      }
    }
  },
  {
    id: 'stonewatch_merchant',
    name: 'Orvin le Marchand',
    sprite: 'npc_stonewatch_merchant',
    portrait: 'portrait_stonewatch_merchant',
    location: 'stone_watch',
    questIds: ['fq_stone_01_rune_delivery'],
    shopItems: ['ancient_stone_rune', 'terravast_crystal', 'gorvun_fragment', 'ruin_colossus_core', 'minor_health_potion', 'antidote', 'health_potion'],
    dialogue: {
      rootId: 'orvin_default',
      lines: {
        orvin_default: { id: 'orvin_default', speaker: 'Orvin', text: 'Les runes de pierre se trouvent dans les ruines les plus anciennes. Je paie le prix juste.', choices: [
          { text: 'Voir ton stock.', next: 'orvin_shop' },
          { text: 'T\'as besoin de quelque chose ?', next: 'orvin_quest' },
          { text: 'Non.', next: 'orvin_bye' },
        ]},
        orvin_shop: { id: 'orvin_shop', speaker: 'Orvin', text: 'Ce que j\'ai.', trigger: { setFlag: 'open_shop_orvin' } },
        orvin_quest: { id: 'orvin_quest', speaker: 'Orvin', text: 'Un colis de runes anciennes doit arriver de Deepdelve. La messagère est en retard.', trigger: { startQuest: 'fq_stone_01_rune_delivery' }, next: 'orvin_default' },
        orvin_bye: { id: 'orvin_bye', speaker: 'Orvin', text: 'Bonne route.' }
      }
    }
  },
  {
    id: 'stonewatch_alchemist',
    name: 'Petra l\'Alchimiste',
    sprite: 'npc_stonewatch_alchemist',
    portrait: 'portrait_stonewatch_alchemist',
    location: 'stone_watch',
    questIds: ['fq_stone_02_cave_brew'],
    shopItems: ['minor_health_potion', 'health_potion', 'major_health_potion', 'mana_potion', 'antidote', 'revive_crystal'],
    dialogue: {
      rootId: 'petra_alch_default',
      lines: {
        petra_alch_default: { id: 'petra_alch_default', speaker: 'Petra', text: 'La mousse des cavernes et les cristaux ensemble — ça donne quelque chose d\'étrange. Et d\'utile.', choices: [
          { text: 'Voir vos potions.', next: 'petra_alch_shop' },
          { text: 'Qu\'est-ce qu\'il vous faut ?', next: 'petra_alch_quest' },
          { text: 'À bientôt.', next: 'petra_alch_bye' },
        ]},
        petra_alch_shop: { id: 'petra_alch_shop', speaker: 'Petra', text: 'Prends ce qu\'il te faut.', trigger: { setFlag: 'open_shop_petra_alch' } },
        petra_alch_quest: { id: 'petra_alch_quest', speaker: 'Petra', text: 'De la mousse des grottes profondes — dix unités. Je ne peux pas y aller seule.', trigger: { startQuest: 'fq_stone_02_cave_brew' }, next: 'petra_alch_default' },
        petra_alch_bye: { id: 'petra_alch_bye', speaker: 'Petra', text: 'Prends soin de toi.' }
      }
    }
  },
  {
    id: 'stonewatch_tailor',
    name: 'Veth le Costumier',
    sprite: 'npc_stonewatch_tailor',
    portrait: 'portrait_stonewatch_tailor',
    location: 'stone_watch',
    questIds: [],
    shopItems: ['skin_crystal_regalia', 'skin_pilgrim_garb', 'skin_storm_vestments'],
    dialogue: {
      rootId: 'veth_default',
      lines: {
        veth_default: { id: 'veth_default', speaker: 'Veth', text: 'La pierre peut être portée. Il faut juste savoir la travailler.', choices: [
          { text: 'Voir vos skins.', next: 'veth_shop' },
          { text: 'Commande personnalisée ?', next: 'veth_craft' },
          { text: 'Non merci.', next: 'veth_bye' },
        ]},
        veth_shop: { id: 'veth_shop', speaker: 'Veth', text: 'Mes créations.', trigger: { setFlag: 'open_shop_veth' } },
        veth_craft: { id: 'veth_craft', speaker: 'Veth', text: 'Je travaille sur commande. Matériaux contre expertise.', trigger: { setFlag: 'open_craft_veth' } },
        veth_bye: { id: 'veth_bye', speaker: 'Veth', text: 'À bientôt.' }
      }
    }
  },
  bgNpc('stonewatch_guard_1',   'Hrolk',         'stone_watch', 'La vue depuis ici est magnifique. Et terrifiante.'),
  bgNpc('stonewatch_watcher',   'Olde',          'stone_watch', 'Je compte les tremblements. Aujourd\'hui : sept. Hier : neuf. La tendance est bonne.'),
  bgNpc('stonewatch_scholar',   'Dram',          'stone_watch', 'Je tente de cartographier les nouvelles formations. Elles bougent trop vite.'),
  bgNpc('stonewatch_child',     'Kessa',         'stone_watch', 'La terre tremble mais ma maison ne tombe pas. Papa l\'a construite avec des cristaux dedans.'),
  bgNpc('stonewatch_refugee_1', 'Lort',          'stone_watch', 'Je viens de Deepdelve. La galerie n°7 s\'est effondrée cette nuit.'),
  bgNpc('stonewatch_cook',      'Wura la Cuisinière','stone_watch', 'Soupe de crystalle. C\'est meilleur que ça en a l\'air.'),
];

// ══════════════════════════════════════════════════════════════════
// WINDHERALD (Zephyr Peaks — ville 1)
// ══════════════════════════════════════════════════════════════════

export const WINDHERALD_NPCS: NPC[] = [
  {
    id: 'windherald_smith',
    name: 'Ayle la Forgeronne',
    sprite: 'npc_windherald_smith',
    portrait: 'portrait_windherald_smith',
    location: 'windherald',
    questIds: ['sq_wind_01_feather_blade'],
    shopItems: ['harpy_bow', 'sky_titan_bow', 'phoenix_bow', 'gale_dagger', 'wind_greatsword', 'wind_helm', 'storm_eagle_feather_cloak'],
    dialogue: {
      rootId: 'ayle_default',
      lines: {
        ayle_default: { id: 'ayle_default', speaker: 'Ayle', text: 'Je forge avec les plumes de Sylvael. Tu ne trouves ça nulle part ailleurs.', choices: [
          { text: 'Voir ta marchandise.', next: 'ayle_shop' },
          { text: 'Tu peux forger sur commande ?', next: 'ayle_craft' },
          { text: 'À bientôt.', next: 'ayle_bye' },
        ]},
        ayle_shop: { id: 'ayle_shop', speaker: 'Ayle', text: 'Choisis.', trigger: { setFlag: 'open_shop_ayle' } },
        ayle_craft: { id: 'ayle_craft', speaker: 'Ayle', text: 'Plumes de Zephyr, soie de nuage, pierres de tempête. Ramène-moi ça.', trigger: { startQuest: 'sq_wind_01_feather_blade' }, next: 'ayle_default' },
        ayle_bye: { id: 'ayle_bye', speaker: 'Ayle', text: 'Le vent attend.' }
      }
    }
  },
  {
    id: 'windherald_merchant',
    name: 'Cira la Marchande',
    sprite: 'npc_windherald_merchant',
    portrait: 'portrait_windherald_merchant',
    location: 'windherald',
    questIds: ['fq_wind_01_storm_harvest'],
    shopItems: ['zephyr_feather', 'stormstone', 'cloudweave_silk', 'sylvael_plume', 'minor_health_potion', 'minor_mana_potion', 'health_potion'],
    dialogue: {
      rootId: 'cira_default',
      lines: {
        cira_default: { id: 'cira_default', speaker: 'Cira', text: 'La soie de nuage ne pousse pas. Elle se récolte. Je paie bien pour les bonnes plumes.', choices: [
          { text: 'Voir votre stock.', next: 'cira_shop' },
          { text: 'Vous cherchez quelque chose ?', next: 'cira_quest' },
          { text: 'Plus tard.', next: 'cira_bye' },
        ]},
        cira_shop: { id: 'cira_shop', speaker: 'Cira', text: 'Tout ça vient d\'ici.', trigger: { setFlag: 'open_shop_cira' } },
        cira_quest: { id: 'cira_quest', speaker: 'Cira', text: 'Je cherche des pierres de tempête des îles les plus éloignées. Les plus chargées.', trigger: { startQuest: 'fq_wind_01_storm_harvest' }, next: 'cira_default' },
        cira_bye: { id: 'cira_bye', speaker: 'Cira', text: 'À bientôt.' }
      }
    }
  },
  {
    id: 'windherald_alchemist',
    name: 'Zael l\'Alchimiste',
    sprite: 'npc_windherald_alchemist',
    portrait: 'portrait_windherald_alchemist',
    location: 'windherald',
    questIds: ['fq_wind_02_cloud_brew'],
    shopItems: ['minor_health_potion', 'health_potion', 'major_health_potion', 'minor_mana_potion', 'mana_potion', 'major_mana_potion', 'antidote'],
    dialogue: {
      rootId: 'zael_default',
      lines: {
        zael_default: { id: 'zael_default', speaker: 'Zael', text: 'L\'air ici a des propriétés particulières. Je l\'embouteille. Littéralement.', choices: [
          { text: 'Voir vos potions.', next: 'zael_shop' },
          { text: 'Qu\'est-ce qu\'il vous faut ?', next: 'zael_quest' },
          { text: 'Non merci.', next: 'zael_bye' },
        ]},
        zael_shop: { id: 'zael_shop', speaker: 'Zael', text: 'De l\'air en bouteille.', trigger: { setFlag: 'open_shop_zael' } },
        zael_quest: { id: 'zael_quest', speaker: 'Zael', text: 'Des essences de nuage — les nuages proches du sommet, pas les bas. Cinq flacons si tu peux.', trigger: { startQuest: 'fq_wind_02_cloud_brew' }, next: 'zael_default' },
        zael_bye: { id: 'zael_bye', speaker: 'Zael', text: 'Le vent est avec toi.' }
      }
    }
  },
  {
    id: 'windherald_tailor',
    name: 'Syl la Costumière',
    sprite: 'npc_windherald_tailor',
    portrait: 'portrait_windherald_tailor',
    location: 'windherald',
    questIds: [],
    shopItems: ['skin_storm_vestments', 'skin_pilgrim_garb', 'skin_ember_cloak'],
    dialogue: {
      rootId: 'syl_tailor_default',
      lines: {
        syl_tailor_default: { id: 'syl_tailor_default', speaker: 'Syl', text: 'La soie de nuage ne dure pas éternellement mais elle est incomparable pendant qu\'elle tient.', choices: [
          { text: 'Voir vos créations.', next: 'syl_shop' },
          { text: 'Commande sur mesure ?', next: 'syl_craft' },
          { text: 'Non.', next: 'syl_bye' },
        ]},
        syl_shop: { id: 'syl_shop', speaker: 'Syl', text: 'Mes tenues.', trigger: { setFlag: 'open_shop_syl_tailor' } },
        syl_craft: { id: 'syl_craft', speaker: 'Syl', text: 'Soie de nuage et plumes de Zephyr. C\'est tout ce qu\'il me faut.', trigger: { setFlag: 'open_craft_syl' } },
        syl_bye: { id: 'syl_bye', speaker: 'Syl', text: 'Bonne route.' }
      }
    }
  },
  bgNpc('windherald_keeper',  'Keeped Aerin', 'windherald', 'Je surveille les chaînes. Si une lâche, l\'île coule. Simple.'),
  bgNpc('windherald_scholar', 'Mireth',       'windherald', 'Sylvael est dans le vent. Chaque rafale en porte un fragment.'),
  bgNpc('windherald_child',   'Nilo',         'windherald', 'J\'ai sauté d\'une île à l\'autre ce matin. Maman dit que c\'est dangereux. Elle a tort.'),
  bgNpc('windherald_guard_2', 'Taven',        'windherald', 'Les Harpies rôdent plus près depuis la semaine dernière. On les surveille.'),
  bgNpc('windherald_pilgrim', 'Ancien Pèlerin Du Vent', 'windherald', 'J\'ai vu Sylvael une fois. Juste ses ailes. C\'était assez.'),
  bgNpc('windherald_farmer',  'Brisl',        'windherald', 'On cultive des légumes dans des jarres suspendues ici. C\'est du jardinage créatif.'),
];

// ══════════════════════════════════════════════════════════════════
// CLOUDSPIRE (Zephyr Peaks — ville 2)
// ══════════════════════════════════════════════════════════════════

export const CLOUDSPIRE_NPCS: NPC[] = [
  {
    id: 'cloudspire_smith',
    name: 'Tevan le Forgeron',
    sprite: 'npc_cloudspire_smith',
    portrait: 'portrait_cloudspire_smith',
    location: 'cloudspire',
    questIds: ['sq_cloud_01_phoenix_materials'],
    shopItems: ['phoenix_bow', 'sky_titan_bow', 'wind_helm', 'wind_legs', 'wind_gloves', 'tempest_cloak', 'wind_boots'],
    dialogue: {
      rootId: 'tevan_default',
      lines: {
        tevan_default: { id: 'tevan_default', speaker: 'Tevan', text: 'Du sommet, on voit tout. Et on forge avec ce qu\'on voit.', choices: [
          { text: 'Voir ta marchandise.', next: 'tevan_shop' },
          { text: 'Forge sur commande ?', next: 'tevan_craft' },
          { text: 'Plus tard.', next: 'tevan_bye' },
        ]},
        tevan_shop: { id: 'tevan_shop', speaker: 'Tevan', text: 'Ce que j\'ai.', trigger: { setFlag: 'open_shop_tevan' } },
        tevan_craft: { id: 'tevan_craft', speaker: 'Tevan', text: 'Les plumes de Sylvael et la soie des temples. Rapporte ça.', trigger: { startQuest: 'sq_cloud_01_phoenix_materials' }, next: 'tevan_default' },
        tevan_bye: { id: 'tevan_bye', speaker: 'Tevan', text: 'Le vent t\'accompagne.' }
      }
    }
  },
  {
    id: 'cloudspire_merchant',
    name: 'Liss la Marchande',
    sprite: 'npc_cloudspire_merchant',
    portrait: 'portrait_cloudspire_merchant',
    location: 'cloudspire',
    questIds: ['fq_cloud_01_plume_run'],
    shopItems: ['sylvael_plume', 'cloudweave_silk', 'stormstone', 'zephyr_feather', 'minor_health_potion', 'antidote'],
    dialogue: {
      rootId: 'liss_default',
      lines: {
        liss_default: { id: 'liss_default', speaker: 'Liss', text: 'Cloudspire n\'est pas vraiment un marché. Mais tout le monde finit par acheter quelque chose.', choices: [
          { text: 'Voir votre stock.', next: 'liss_shop' },
          { text: 'Besoin d\'aide ?', next: 'liss_quest' },
          { text: 'Non.', next: 'liss_bye' },
        ]},
        liss_shop: { id: 'liss_shop', speaker: 'Liss', text: 'Voilà ce que j\'ai.', trigger: { setFlag: 'open_shop_liss' } },
        liss_quest: { id: 'liss_quest', speaker: 'Liss', text: 'J\'attends une livraison de plumes de Windherald. Le messager n\'est pas arrivé.', trigger: { startQuest: 'fq_cloud_01_plume_run' }, next: 'liss_default' },
        liss_bye: { id: 'liss_bye', speaker: 'Liss', text: 'À bientôt.' }
      }
    }
  },
  {
    id: 'cloudspire_alchemist',
    name: 'Ara l\'Alchimiste',
    sprite: 'npc_cloudspire_alchemist',
    portrait: 'portrait_cloudspire_alchemist',
    location: 'cloudspire',
    questIds: ['fq_cloud_02_altitude_brew'],
    shopItems: ['minor_health_potion', 'health_potion', 'minor_mana_potion', 'mana_potion', 'major_mana_potion', 'antidote'],
    dialogue: {
      rootId: 'ara_default',
      lines: {
        ara_default: { id: 'ara_default', speaker: 'Ara', text: 'Distiller à haute altitude change tout. La pression, la température, même l\'esprit des ingrédients.', choices: [
          { text: 'Voir vos potions.', next: 'ara_shop' },
          { text: 'Que vous faut-il ?', next: 'ara_quest' },
          { text: 'Bonne journée.', next: 'ara_bye' },
        ]},
        ara_shop: { id: 'ara_shop', speaker: 'Ara', text: 'Mes créations d\'altitude.', trigger: { setFlag: 'open_shop_ara' } },
        ara_quest: { id: 'ara_quest', speaker: 'Ara', text: 'Des pierres de tempête du sommet le plus haut — pas celles des îles basses. Six unités.', trigger: { startQuest: 'fq_cloud_02_altitude_brew' }, next: 'ara_default' },
        ara_bye: { id: 'ara_bye', speaker: 'Ara', text: 'Bon vent.' }
      }
    }
  },
  {
    id: 'cloudspire_tailor',
    name: 'Fen le Costumier',
    sprite: 'npc_cloudspire_tailor',
    portrait: 'portrait_cloudspire_tailor',
    location: 'cloudspire',
    questIds: [],
    shopItems: ['skin_storm_vestments', 'skin_abyssal_robe', 'skin_pilgrim_garb'],
    dialogue: {
      rootId: 'fen_tailor_default',
      lines: {
        fen_tailor_default: { id: 'fen_tailor_default', speaker: 'Fen', text: 'Porter le vent, c\'est un art. Je suis l\'artiste.', choices: [
          { text: 'Voir vos créations.', next: 'fen_shop' },
          { text: 'Commande personnalisée ?', next: 'fen_craft' },
          { text: 'Non.', next: 'fen_bye' },
        ]},
        fen_shop: { id: 'fen_shop', speaker: 'Fen', text: 'Mes tenues.', trigger: { setFlag: 'open_shop_fen_tailor' } },
        fen_craft: { id: 'fen_craft', speaker: 'Fen', text: 'Soie de nuage, plumes de Zephyr. Ramène ça.', trigger: { setFlag: 'open_craft_fen' } },
        fen_bye: { id: 'fen_bye', speaker: 'Fen', text: 'Vole haut.' }
      }
    }
  },
  bgNpc('cloudspire_monk',     'Moine Ivel',    'cloudspire', 'Le temple du nuage n\'est pas détruit. Il est juste... en mouvement. Comme toujours.'),
  bgNpc('cloudspire_child',    'Pella',         'cloudspire', 'Je peux voir trois îles depuis ma fenêtre. Hier il y en avait quatre.'),
  bgNpc('cloudspire_guard_3',  'Hadel',         'cloudspire', 'On sécurise l\'accès au sommet. Les Cyclones Sprites ont augmenté.'),
  bgNpc('cloudspire_watcher',  'Serel',         'cloudspire', 'Je surveille l\'horizon depuis dix jours. Sylvael n\'est pas là. Mais quelque chose l\'est.'),
  bgNpc('cloudspire_elderly',  'Vieille Ari',   'cloudspire', 'Quand j\'étais jeune, on montait ici pour demander à Sylvael de nous porter. Elle portait.'),
  bgNpc('cloudspire_engineer', 'Bolt',          'cloudspire', 'Les chaînes qui tiennent l\'île sont en alliage Volterra. Ironie.'),
];

// ══════════════════════════════════════════════════════════════════
// SALTMOURN (Abyssmar — ville 1)
// ══════════════════════════════════════════════════════════════════

export const SALTMOURN_NPCS: NPC[] = [
  {
    id: 'saltmourn_smith',
    name: 'Dorn le Forgeron',
    sprite: 'npc_saltmourn_smith',
    portrait: 'portrait_saltmourn_smith',
    location: 'saltmourn',
    questIds: ['sq_salt_01_coral_armor'],
    shopItems: ['coral_sword', 'drowned_knight_sword', 'coral_chest', 'water_helm', 'water_legs', 'serpent_scale_boots', 'tidal_shell_armor'],
    dialogue: {
      rootId: 'dorn_default',
      lines: {
        dorn_default: { id: 'dorn_default', speaker: 'Dorn', text: 'On forge du corail ici. Dur comme de l\'acier, léger comme l\'eau. Si tu sais comment faire.', choices: [
          { text: 'Voir ta marchandise.', next: 'dorn_shop' },
          { text: 'Forge sur commande ?', next: 'dorn_craft' },
          { text: 'Une autre fois.', next: 'dorn_bye' },
        ]},
        dorn_shop: { id: 'dorn_shop', speaker: 'Dorn', text: 'Mon stock.', trigger: { setFlag: 'open_shop_dorn' } },
        dorn_craft: { id: 'dorn_craft', speaker: 'Dorn', text: 'Corail des profondeurs et reliques noyées. Ramène ça et je fais du bon travail.', trigger: { startQuest: 'sq_salt_01_coral_armor' }, next: 'dorn_default' },
        dorn_bye: { id: 'dorn_bye', speaker: 'Dorn', text: 'Reviens avec des matériaux.' }
      }
    }
  },
  {
    id: 'saltmourn_merchant',
    name: 'Vera la Marchande',
    sprite: 'npc_saltmourn_merchant',
    portrait: 'portrait_saltmourn_merchant',
    location: 'saltmourn',
    questIds: ['fq_salt_01_tide_map'],
    shopItems: ['deep_coral', 'drowned_relic', 'sea_glass', 'thalymor_scale', 'pearl', 'minor_health_potion', 'antidote'],
    dialogue: {
      rootId: 'vera_default',
      lines: {
        vera_default: { id: 'vera_default', speaker: 'Vera', text: 'L\'océan prend tout. Mais il laisse aussi des choses. On ramasse ce qu\'il laisse.', choices: [
          { text: 'Voir votre stock.', next: 'vera_shop' },
          { text: 'Vous avez besoin d\'aide ?', next: 'vera_quest' },
          { text: 'Non.', next: 'vera_bye' },
        ]},
        vera_shop: { id: 'vera_shop', speaker: 'Vera', text: 'Ce qu\'on a trouvé.', trigger: { setFlag: 'open_shop_vera' } },
        vera_quest: { id: 'vera_quest', speaker: 'Vera', text: 'J\'ai besoin d\'une carte des courants. Elle était dans les ruines du port. Mais les Drowned Knights y sont.', trigger: { startQuest: 'fq_salt_01_tide_map' }, next: 'vera_default' },
        vera_bye: { id: 'vera_bye', speaker: 'Vera', text: 'À bientôt.' }
      }
    }
  },
  {
    id: 'saltmourn_alchemist',
    name: 'Cora l\'Alchimiste',
    sprite: 'npc_saltmourn_alchemist',
    portrait: 'portrait_saltmourn_alchemist',
    location: 'saltmourn',
    questIds: ['fq_salt_02_depth_brew'],
    shopItems: ['minor_health_potion', 'health_potion', 'major_health_potion', 'mana_potion', 'antidote', 'revive_crystal', 'elixir_of_vitality'],
    dialogue: {
      rootId: 'cora_default',
      lines: {
        cora_default: { id: 'cora_default', speaker: 'Cora', text: 'Le sel et les herbes marines font des potions particulières. Pas les meilleures. Mais efficaces.', choices: [
          { text: 'Voir vos potions.', next: 'cora_shop' },
          { text: 'Que vous faut-il ?', next: 'cora_quest' },
          { text: 'Non.', next: 'cora_bye' },
        ]},
        cora_shop: { id: 'cora_shop', speaker: 'Cora', text: 'Ce que j\'ai.', trigger: { setFlag: 'open_shop_cora' } },
        cora_quest: { id: 'cora_quest', speaker: 'Cora', text: 'Du corail des profondeurs — les vraies profondeurs. Cinq morceaux.', trigger: { startQuest: 'fq_salt_02_depth_brew' }, next: 'cora_default' },
        cora_bye: { id: 'cora_bye', speaker: 'Cora', text: 'Bonne route.' }
      }
    }
  },
  {
    id: 'saltmourn_tailor',
    name: 'Lund le Costumier',
    sprite: 'npc_saltmourn_tailor',
    portrait: 'portrait_saltmourn_tailor',
    location: 'saltmourn',
    questIds: [],
    shopItems: ['skin_abyssal_robe', 'skin_pilgrim_garb', 'skin_frost_shroud'],
    dialogue: {
      rootId: 'lund_default',
      lines: {
        lund_default: { id: 'lund_default', speaker: 'Lund', text: 'La mer a un style propre. Sombre, froid, mais élégant.', choices: [
          { text: 'Voir vos créations.', next: 'lund_shop' },
          { text: 'Commande ?', next: 'lund_craft' },
          { text: 'Non.', next: 'lund_bye' },
        ]},
        lund_shop: { id: 'lund_shop', speaker: 'Lund', text: 'Mes créations.', trigger: { setFlag: 'open_shop_lund' } },
        lund_craft: { id: 'lund_craft', speaker: 'Lund', text: 'Corail, verre de mer, reliques. Je fais le reste.', trigger: { setFlag: 'open_craft_lund' } },
        lund_bye: { id: 'lund_bye', speaker: 'Lund', text: 'À bientôt.' }
      }
    }
  },
  bgNpc('saltmourn_fisherman',  'Vael le Pêcheur','saltmourn', 'Ma fille est entrée dans les ruines. Elle n\'est pas sortie. Quelqu\'un peut regarder ?'),
  bgNpc('saltmourn_survivor_1', 'Nade',           'saltmourn', 'J\'ai vu la mer monter. Pas lentement. D\'un coup.'),
  bgNpc('saltmourn_guard_4',    'Treck',          'saltmourn', 'On surveille les passages sous-marins. Tide Crawlers de plus en plus proches.'),
  bgNpc('saltmourn_old_sailor', 'Vieux Marin Erd','saltmourn', 'Thalymor nous protégeait. La mer ne montait pas. Maintenant elle monte.'),
  bgNpc('saltmourn_child',      'Mael',           'saltmourn', 'Je veux voir les ruines sous l\'eau. Mais personne me laisse.'),
  bgNpc('saltmourn_cook',       'Brice',          'saltmourn', 'Poisson grillé. Poisson bouilli. Poisson séché. C\'est ce qu\'on mange. C\'est poisson.'),
];

// ══════════════════════════════════════════════════════════════════
// THE WRECK (Abyssmar — ville 2)
// ══════════════════════════════════════════════════════════════════

export const WRECK_NPCS: NPC[] = [
  {
    id: 'wreck_smith',
    name: 'Boro le Forgeron',
    sprite: 'npc_wreck_smith',
    portrait: 'portrait_wreck_smith',
    location: 'the_wreck',
    questIds: ['sq_wreck_01_leviathan_forge'],
    shopItems: ['drowned_knight_sword', 'leviathan_staff', 'abyssal_chest', 'coral_chest', 'water_helm', 'water_legs', 'seaguard_armor'],
    dialogue: {
      rootId: 'boro_default',
      lines: {
        boro_default: { id: 'boro_default', speaker: 'Boro', text: 'Je forge dans les coques des navires. C\'est plus solide que ça en a l\'air.', choices: [
          { text: 'Voir ta marchandise.', next: 'boro_shop' },
          { text: 'Forge sur commande ?', next: 'boro_craft' },
          { text: 'À plus.', next: 'boro_bye' },
        ]},
        boro_shop: { id: 'boro_shop', speaker: 'Boro', text: 'Ce que j\'ai forgé.', trigger: { setFlag: 'open_shop_boro' } },
        boro_craft: { id: 'boro_craft', speaker: 'Boro', text: 'Écailles de Thalymor et reliques noyées. Rare mais pas introuvable.', trigger: { startQuest: 'sq_wreck_01_leviathan_forge' }, next: 'boro_default' },
        boro_bye: { id: 'boro_bye', speaker: 'Boro', text: 'L\'eau ne rouille pas ce que je fais.' }
      }
    }
  },
  {
    id: 'wreck_merchant',
    name: 'Sirenne la Marchande',
    sprite: 'npc_wreck_merchant',
    portrait: 'portrait_wreck_merchant',
    location: 'the_wreck',
    questIds: ['fq_wreck_01_relic_run'],
    shopItems: ['thalymor_scale', 'drowned_relic', 'deep_coral', 'pearl', 'sea_glass', 'health_potion', 'minor_mana_potion'],
    dialogue: {
      rootId: 'sirenne_default',
      lines: {
        sirenne_default: { id: 'sirenne_default', speaker: 'Sirenne', text: 'L\'eau qui monte expose des choses que personne n\'avait vues depuis des siècles.', choices: [
          { text: 'Voir votre stock.', next: 'sirenne_shop' },
          { text: 'Besoin de quelque chose ?', next: 'sirenne_quest' },
          { text: 'Non.', next: 'sirenne_bye' },
        ]},
        sirenne_shop: { id: 'sirenne_shop', speaker: 'Sirenne', text: 'Ce que j\'ai récupéré.', trigger: { setFlag: 'open_shop_sirenne' } },
        sirenne_quest: { id: 'sirenne_quest', speaker: 'Sirenne', text: 'J\'ai besoin de trois reliques noyées du quartier est. C\'est inondé. Tu peux nager ?', trigger: { startQuest: 'fq_wreck_01_relic_run' }, next: 'sirenne_default' },
        sirenne_bye: { id: 'sirenne_bye', speaker: 'Sirenne', text: 'Reviens.' }
      }
    }
  },
  {
    id: 'wreck_alchemist',
    name: 'Narin l\'Alchimiste',
    sprite: 'npc_wreck_alchemist',
    portrait: 'portrait_wreck_alchemist',
    location: 'the_wreck',
    questIds: ['fq_wreck_02_sea_distillation'],
    shopItems: ['minor_health_potion', 'health_potion', 'major_health_potion', 'mana_potion', 'major_mana_potion', 'antidote', 'elixir_of_vitality'],
    dialogue: {
      rootId: 'narin_default',
      lines: {
        narin_default: { id: 'narin_default', speaker: 'Narin', text: 'L\'eau des profondeurs a des propriétés uniques. À condition de savoir où la chercher.', choices: [
          { text: 'Voir vos potions.', next: 'narin_shop' },
          { text: 'Qu\'est-ce qu\'il vous faut ?', next: 'narin_quest' },
          { text: 'À bientôt.', next: 'narin_bye' },
        ]},
        narin_shop: { id: 'narin_shop', speaker: 'Narin', text: 'Mes distillats.', trigger: { setFlag: 'open_shop_narin' } },
        narin_quest: { id: 'narin_quest', speaker: 'Narin', text: 'Perles des courants profonds — pas celles du fond, celles du milieu. Cinq.', trigger: { startQuest: 'fq_wreck_02_sea_distillation' }, next: 'narin_default' },
        narin_bye: { id: 'narin_bye', speaker: 'Narin', text: 'Bonne plongée.' }
      }
    }
  },
  {
    id: 'wreck_tailor',
    name: 'Coral le Costumier',
    sprite: 'npc_wreck_tailor',
    portrait: 'portrait_wreck_tailor',
    location: 'the_wreck',
    questIds: [],
    shopItems: ['skin_abyssal_robe', 'skin_pilgrim_garb', 'skin_crystal_regalia'],
    dialogue: {
      rootId: 'coral_tailor_default',
      lines: {
        coral_tailor_default: { id: 'coral_tailor_default', speaker: 'Coral', text: 'Le corail d\'Abyssmar donne des teintes uniques. Comme les profondeurs elles-mêmes.', choices: [
          { text: 'Voir vos créations.', next: 'coral_shop' },
          { text: 'Commande ?', next: 'coral_craft' },
          { text: 'Non.', next: 'coral_bye' },
        ]},
        coral_shop: { id: 'coral_shop', speaker: 'Coral', text: 'Voilà.', trigger: { setFlag: 'open_shop_coral_tailor' } },
        coral_craft: { id: 'coral_craft', speaker: 'Coral', text: 'Corail, verre de mer, perles. Je taille et je couds.', trigger: { setFlag: 'open_craft_coral' } },
        coral_bye: { id: 'coral_bye', speaker: 'Coral', text: 'Reste sec.' }
      }
    }
  },
  bgNpc('wreck_diver',        'Plongeur Kast',  'the_wreck', 'J\'ai vu des trucs sous l\'eau. Des constructions. Très anciennes. Pas Abyssmar.'),
  bgNpc('wreck_survivor_2',   'Mara',           'the_wreck', 'Mon navire s\'est échoué ici il y a trois semaines. Finalement c\'est pas si mal.'),
  bgNpc('wreck_old_captain',  'Capitaine Vorn', 'the_wreck', 'J\'ai navigué quarante ans. L\'océan m\'a vaincu en une nuit. Thalymor a voulu ça.'),
  bgNpc('wreck_child_2',      'Sian',           'the_wreck', 'Mon bateau en bois de l\'épave flotte encore. Je l\'appelle Thalymor Junior.'),
  bgNpc('wreck_guard_5',      'Dreck',          'the_wreck', 'Les Serpents des Profondeurs rôdent à moins de cent mètres.'),
  bgNpc('wreck_cook_2',       'Sina',           'the_wreck', 'Ragoût de crabe et de poisson. On s\'améliore. À force d\'habitude.'),
];

// ══════════════════════════════════════════════════════════════════
// THE CIRCUIT (Volterra — ville 1)
// ══════════════════════════════════════════════════════════════════

export const CIRCUIT_NPCS: NPC[] = [
  {
    id: 'circuit_smith',
    name: 'Rek le Forgeron',
    sprite: 'npc_circuit_smith',
    portrait: 'portrait_circuit_smith',
    location: 'the_circuit',
    questIds: ['sq_circuit_01_storm_forge'],
    shopItems: ['arc_sword', 'volkran_hammer', 'storm_plate', 'storm_herald_plate', 'lightning_helm', 'lightning_legs', 'air_walker_boots'],
    dialogue: {
      rootId: 'rek_default',
      lines: {
        rek_default: { id: 'rek_default', speaker: 'Rek', text: 'Les machines de Volterra marchent encore. Et tant qu\'elles marchent, je forge.', choices: [
          { text: 'Voir ta marchandise.', next: 'rek_shop' },
          { text: 'Forge sur commande ?', next: 'rek_craft' },
          { text: 'À bientôt.', next: 'rek_bye' },
        ]},
        rek_shop: { id: 'rek_shop', speaker: 'Rek', text: 'Ce que j\'ai produit.', trigger: { setFlag: 'open_shop_rek' } },
        rek_craft: { id: 'rek_craft', speaker: 'Rek', text: 'Métal chargé, éclats de tempête, runes de tonnerre. Rapporte ça.', trigger: { startQuest: 'sq_circuit_01_storm_forge' }, next: 'rek_default' },
        rek_bye: { id: 'rek_bye', speaker: 'Rek', text: 'Reviens.' }
      }
    }
  },
  {
    id: 'circuit_merchant',
    name: 'Volt la Marchande',
    sprite: 'npc_circuit_merchant',
    portrait: 'portrait_circuit_merchant',
    location: 'the_circuit',
    questIds: ['fq_circuit_01_component_run'],
    shopItems: ['storm_shard', 'charged_metal', 'thunder_rune', 'volkran_coil', 'volt_hound_pelt', 'storm_glass', 'circuit_blueprint'],
    dialogue: {
      rootId: 'volt_merchant_default',
      lines: {
        volt_merchant_default: { id: 'volt_merchant_default', speaker: 'Volt', text: 'Les composants de Volterra valent de l\'or ailleurs. Ici, ils valent la survie.', choices: [
          { text: 'Voir votre stock.', next: 'volt_shop' },
          { text: 'Vous cherchez quelque chose ?', next: 'volt_quest' },
          { text: 'Non.', next: 'volt_bye' },
        ]},
        volt_shop: { id: 'volt_shop', speaker: 'Volt', text: 'Ce que j\'ai.', trigger: { setFlag: 'open_shop_volt_merchant' } },
        volt_quest: { id: 'volt_quest', speaker: 'Volt', text: 'Des bobines de Volkran — les reliques des machines du générateur central. C\'est gardé par les Spark Imps.', trigger: { startQuest: 'fq_circuit_01_component_run' }, next: 'volt_merchant_default' },
        volt_bye: { id: 'volt_bye', speaker: 'Volt', text: 'À bientôt.' }
      }
    }
  },
  {
    id: 'circuit_alchemist',
    name: 'Elka l\'Alchimiste',
    sprite: 'npc_circuit_alchemist',
    portrait: 'portrait_circuit_alchemist',
    location: 'the_circuit',
    questIds: ['fq_circuit_02_spark_brew'],
    shopItems: ['minor_health_potion', 'health_potion', 'major_health_potion', 'mana_potion', 'major_mana_potion', 'antidote', 'full_elixir'],
    dialogue: {
      rootId: 'elka_default',
      lines: {
        elka_default: { id: 'elka_default', speaker: 'Elka', text: 'L\'électricité et l\'alchimie ont plus en commun qu\'on le croit. J\'ai eu le temps de vérifier.', choices: [
          { text: 'Voir vos potions.', next: 'elka_shop' },
          { text: 'Que vous faut-il ?', next: 'elka_quest' },
          { text: 'Bonne journée.', next: 'elka_bye' },
        ]},
        elka_shop: { id: 'elka_shop', speaker: 'Elka', text: 'Ce que j\'ai distillé.', trigger: { setFlag: 'open_shop_elka' } },
        elka_quest: { id: 'elka_quest', speaker: 'Elka', text: 'Du verre de tempête de la plaine principale — l\'électricité le transforme en quelque chose d\'utile. Six morceaux.', trigger: { startQuest: 'fq_circuit_02_spark_brew' }, next: 'elka_default' },
        elka_bye: { id: 'elka_bye', speaker: 'Elka', text: 'Ne te fais pas griller.' }
      }
    }
  },
  {
    id: 'circuit_tailor',
    name: 'Wren le Costumier',
    sprite: 'npc_circuit_tailor',
    portrait: 'portrait_circuit_tailor',
    location: 'the_circuit',
    questIds: [],
    shopItems: ['skin_lightning_coil_helm', 'skin_storm_vestments', 'skin_pilgrim_garb'],
    dialogue: {
      rootId: 'wren_default',
      lines: {
        wren_default: { id: 'wren_default', speaker: 'Wren', text: 'Les ingénieurs de Volterra avaient un style particulier. Je le reproduis. Avec améliorations.', choices: [
          { text: 'Voir vos créations.', next: 'wren_shop' },
          { text: 'Commande ?', next: 'wren_craft' },
          { text: 'Non.', next: 'wren_bye' },
        ]},
        wren_shop: { id: 'wren_shop', speaker: 'Wren', text: 'Mes répliques.', trigger: { setFlag: 'open_shop_wren' } },
        wren_craft: { id: 'wren_craft', speaker: 'Wren', text: 'Métal chargé et verre de tempête. Je fais le reste.', trigger: { setFlag: 'open_craft_wren' } },
        wren_bye: { id: 'wren_bye', speaker: 'Wren', text: 'À bientôt.' }
      }
    }
  },
  bgNpc('circuit_engineer_1', 'Ingénieur Kasyl',  'the_circuit', 'Les relais tiennent encore. Mais pas pour longtemps si personne ne comprend les plans.'),
  bgNpc('circuit_guard_6',    'Drex',             'the_circuit', 'On protège les générateurs. S\'ils lâchent, tout lâche.'),
  bgNpc('circuit_scientist',  'Prof. Vara',        'the_circuit', 'Volkran était un dieu mais aussi une source d\'énergie. On l\'a utilisé. Il s\'en souvient peut-être.'),
  bgNpc('circuit_child_3',    'Zap',               'the_circuit', 'Mon père dit que les éclairs parlent. Je l\'écoute mais je comprends pas encore.'),
  bgNpc('circuit_survivor_3', 'Lome',              'the_circuit', 'J\'ai couru depuis la plaine principale. Les arcs électriques font des tours de vingt mètres maintenant.'),
  bgNpc('circuit_cook',       'Mira-Volt',         'the_circuit', 'Je fais cuire avec la grille électrique. Pratique. Un peu risqué. Très pratique.'),
];

// ══════════════════════════════════════════════════════════════════
// SPARK'S REST (Volterra — ville 2)
// ══════════════════════════════════════════════════════════════════

export const SPARKS_REST_NPCS: NPC[] = [
  {
    id: 'sparks_smith',
    name: 'Thun le Forgeron',
    sprite: 'npc_sparks_smith',
    portrait: 'portrait_sparks_smith',
    location: 'sparks_rest',
    questIds: ['sq_sparks_01_thunder_weapons'],
    shopItems: ['thunder_bow', 'arc_sword', 'storm_sword', 'lightning_helm', 'lightning_legs', 'storm_herald_plate', 'air_walker_boots'],
    dialogue: {
      rootId: 'thun_default',
      lines: {
        thun_default: { id: 'thun_default', speaker: 'Thun', text: 'La foudre de Volkran forge mieux que n\'importe quel feu. Faut juste pas se trouver sur la trajectoire.', choices: [
          { text: 'Voir ta marchandise.', next: 'thun_shop' },
          { text: 'Forge sur commande ?', next: 'thun_craft' },
          { text: 'Plus tard.', next: 'thun_bye' },
        ]},
        thun_shop: { id: 'thun_shop', speaker: 'Thun', text: 'Mes créations foudrovées.', trigger: { setFlag: 'open_shop_thun' } },
        thun_craft: { id: 'thun_craft', speaker: 'Thun', text: 'Métal chargé et runes de tonnerre. Rapporte ça.', trigger: { startQuest: 'sq_sparks_01_thunder_weapons' }, next: 'thun_default' },
        thun_bye: { id: 'thun_bye', speaker: 'Thun', text: 'Ne te fais pas griller.' }
      }
    }
  },
  {
    id: 'sparks_merchant',
    name: 'Hessa la Marchande',
    sprite: 'npc_sparks_merchant',
    portrait: 'portrait_sparks_merchant',
    location: 'sparks_rest',
    questIds: ['fq_sparks_01_pelt_trade'],
    shopItems: ['storm_shard', 'charged_metal', 'thunder_rune', 'volt_hound_pelt', 'storm_glass', 'minor_health_potion', 'health_potion'],
    dialogue: {
      rootId: 'hessa_default',
      lines: {
        hessa_default: { id: 'hessa_default', speaker: 'Hessa', text: 'Les chiens de Volt font des fourrures conductrices. Utiles pour isoler certaines choses.', choices: [
          { text: 'Voir votre stock.', next: 'hessa_shop' },
          { text: 'Vous avez besoin d\'aide ?', next: 'hessa_quest' },
          { text: 'Non.', next: 'hessa_bye' },
        ]},
        hessa_shop: { id: 'hessa_shop', speaker: 'Hessa', text: 'Ce que j\'ai.', trigger: { setFlag: 'open_shop_hessa' } },
        hessa_quest: { id: 'hessa_quest', speaker: 'Hessa', text: 'J\'ai besoin de six pelages de Volt Hound. En échange j\'offre de bonnes munitions.', trigger: { startQuest: 'fq_sparks_01_pelt_trade' }, next: 'hessa_default' },
        hessa_bye: { id: 'hessa_bye', speaker: 'Hessa', text: 'Reviens.' }
      }
    }
  },
  {
    id: 'sparks_alchemist',
    name: 'Gale l\'Alchimiste',
    sprite: 'npc_sparks_alchemist',
    portrait: 'portrait_sparks_alchemist',
    location: 'sparks_rest',
    questIds: ['fq_sparks_02_chain_brew'],
    shopItems: ['minor_health_potion', 'health_potion', 'mana_potion', 'major_mana_potion', 'antidote', 'revive_crystal'],
    dialogue: {
      rootId: 'gale_alch_default',
      lines: {
        gale_alch_default: { id: 'gale_alch_default', speaker: 'Gale', text: 'On distille ici avec une source d\'énergie qu\'aucune autre ville ne peut utiliser. Avantage concurrentiel.', choices: [
          { text: 'Voir vos potions.', next: 'gale_shop' },
          { text: 'Que vous faut-il ?', next: 'gale_quest' },
          { text: 'Non merci.', next: 'gale_bye' },
        ]},
        gale_shop: { id: 'gale_shop', speaker: 'Gale', text: 'Ce que j\'ai électro-distillé.', trigger: { setFlag: 'open_shop_gale_alch' } },
        gale_quest: { id: 'gale_quest', speaker: 'Gale', text: 'Des éclats de tempête des zones les plus chargées. Huit. Je ne peux pas y aller.', trigger: { startQuest: 'fq_sparks_02_chain_brew' }, next: 'gale_alch_default' },
        gale_bye: { id: 'gale_bye', speaker: 'Gale', text: 'Prends soin de toi.' }
      }
    }
  },
  {
    id: 'sparks_tailor',
    name: 'Niss la Costumière',
    sprite: 'npc_sparks_tailor',
    portrait: 'portrait_sparks_tailor',
    location: 'sparks_rest',
    questIds: [],
    shopItems: ['skin_lightning_coil_helm', 'skin_storm_vestments', 'skin_pilgrim_garb'],
    dialogue: {
      rootId: 'niss_default',
      lines: {
        niss_default: { id: 'niss_default', speaker: 'Niss', text: 'Du style dans la tempête. C\'est possible. Je le prouve.', choices: [
          { text: 'Voir vos créations.', next: 'niss_shop' },
          { text: 'Commande ?', next: 'niss_craft' },
          { text: 'Non.', next: 'niss_bye' },
        ]},
        niss_shop: { id: 'niss_shop', speaker: 'Niss', text: 'Mes tenues.', trigger: { setFlag: 'open_shop_niss' } },
        niss_craft: { id: 'niss_craft', speaker: 'Niss', text: 'Fourrure de Volt Hound et métal chargé. C\'est tout ce qu\'il faut.', trigger: { setFlag: 'open_craft_niss' } },
        niss_bye: { id: 'niss_bye', speaker: 'Niss', text: 'Reste debout.' }
      }
    }
  },
  bgNpc('sparks_engineer_2', 'Tech Larn',     'sparks_rest', 'On a stabilisé les relais locaux. Mais le réseau principal est hors contrôle.'),
  bgNpc('sparks_refugee_4',  'Beld',          'sparks_rest', 'J\'ai vu un arc de foudre traverser trois maisons. En ligne droite.'),
  bgNpc('sparks_watcher',    'Observateur Ora','sparks_rest', 'Je mesure la fréquence des éclairs. La tendance n\'est pas bonne.'),
  bgNpc('sparks_child_4',    'Pip',           'sparks_rest', 'Je collectionne les pierres calcinées par la foudre. J\'en ai 47.'),
  bgNpc('sparks_guard_7',    'Halke',         'sparks_rest', 'Les Thunder Drakes s\'approchent de plus en plus. On les tient à distance pour l\'instant.'),
  bgNpc('sparks_cook',       'Kriss',         'sparks_rest', 'Les plats goûtent différemment quand on cuisine sous les éclairs. En mieux, bizarrement.'),
];

// ══════════════════════════════════════════════════════════════════
// FROSTVEIL (Glaciem — ville 1)
// ══════════════════════════════════════════════════════════════════

export const FROSTVEIL_NPCS: NPC[] = [
  {
    id: 'frostveil_smith',
    name: 'Celd le Forgeron',
    sprite: 'npc_frostveil_smith',
    portrait: 'portrait_frostveil_smith',
    location: 'frostveil',
    questIds: ['sq_frost_01_crysthea_forge'],
    shopItems: ['titan_greatsword', 'blizzard_greatsword', 'memory_staff', 'glaciem_guardian_chest', 'permafrost_armor', 'ice_dragon_scale_chest', 'frost_gauntlets'],
    dialogue: {
      rootId: 'celd_default',
      lines: {
        celd_default: { id: 'celd_default', speaker: 'Celd', text: 'La glace de Glaciem ne fond jamais. Ce que je forge avec ne rouille jamais non plus.', choices: [
          { text: 'Voir ta marchandise.', next: 'celd_shop' },
          { text: 'Forge sur commande ?', next: 'celd_craft' },
          { text: 'À plus.', next: 'celd_bye' },
        ]},
        celd_shop: { id: 'celd_shop', speaker: 'Celd', text: 'Mon stock.', trigger: { setFlag: 'open_shop_celd' } },
        celd_craft: { id: 'celd_craft', speaker: 'Celd', text: 'Éclats de glace ancienne et runes de givre. Des splinters de Crysthea si tu peux en trouver.', trigger: { startQuest: 'sq_frost_01_crysthea_forge' }, next: 'celd_default' },
        celd_bye: { id: 'celd_bye', speaker: 'Celd', text: 'Reviens.' }
      }
    }
  },
  {
    id: 'frostveil_merchant',
    name: 'Sola la Marchande',
    sprite: 'npc_frostveil_merchant',
    portrait: 'portrait_frostveil_merchant',
    location: 'frostveil',
    questIds: ['fq_frost_01_ice_harvest'],
    shopItems: ['glaciem_ice_shard', 'ancient_frost_rune', 'frozen_essence', 'crysthea_splinter', 'frost_wolf_pelt', 'icebloom_flower', 'minor_health_potion'],
    dialogue: {
      rootId: 'sola_default',
      lines: {
        sola_default: { id: 'sola_default', speaker: 'Sola', text: 'Tout ce que Glaciem produit finit ici. Si tu cherches quelque chose de rare, j\'ai peut-être ça.', choices: [
          { text: 'Voir votre stock.', next: 'sola_shop' },
          { text: 'Vous avez besoin d\'aide ?', next: 'sola_quest' },
          { text: 'Non.', next: 'sola_bye' },
        ]},
        sola_shop: { id: 'sola_shop', speaker: 'Sola', text: 'Voilà ce que j\'ai.', trigger: { setFlag: 'open_shop_sola' } },
        sola_quest: { id: 'sola_quest', speaker: 'Sola', text: 'J\'ai besoin de fleurs de givre des grottes du nord. Elles ne poussent que là-bas.', trigger: { startQuest: 'fq_frost_01_ice_harvest' }, next: 'sola_default' },
        sola_bye: { id: 'sola_bye', speaker: 'Sola', text: 'Reviens.' }
      }
    }
  },
  {
    id: 'frostveil_alchemist',
    name: 'Lyse l\'Alchimiste',
    sprite: 'npc_frostveil_alchemist',
    portrait: 'portrait_frostveil_alchemist',
    location: 'frostveil',
    questIds: ['fq_frost_02_glaciem_brew'],
    shopItems: ['minor_health_potion', 'health_potion', 'major_health_potion', 'mana_potion', 'antidote', 'revive_crystal', 'elixir_of_arcana'],
    dialogue: {
      rootId: 'lyse_default',
      lines: {
        lyse_default: { id: 'lyse_default', speaker: 'Lyse', text: 'La glace de Glaciem contient de la mémoire. Je la distille. C\'est plus complexe qu\'il n\'y paraît.', choices: [
          { text: 'Voir vos potions.', next: 'lyse_shop' },
          { text: 'Que vous faut-il ?', next: 'lyse_quest' },
          { text: 'À bientôt.', next: 'lyse_bye' },
        ]},
        lyse_shop: { id: 'lyse_shop', speaker: 'Lyse', text: 'Mes distillats de glace.', trigger: { setFlag: 'open_shop_lyse' } },
        lyse_quest: { id: 'lyse_quest', speaker: 'Lyse', text: 'De l\'essence gelée des couches profondes. Cinq unités. Je ne peux pas y aller seule.', trigger: { startQuest: 'fq_frost_02_glaciem_brew' }, next: 'lyse_default' },
        lyse_bye: { id: 'lyse_bye', speaker: 'Lyse', text: 'Prends soin de toi.' }
      }
    }
  },
  {
    id: 'frostveil_tailor',
    name: 'Isel la Costumière',
    sprite: 'npc_frostveil_tailor',
    portrait: 'portrait_frostveil_tailor',
    location: 'frostveil',
    questIds: [],
    shopItems: ['skin_frost_shroud', 'skin_glaciem_crown', 'skin_pilgrim_garb'],
    dialogue: {
      rootId: 'isel_default',
      lines: {
        isel_default: { id: 'isel_default', speaker: 'Isel', text: 'La fourrure de loup de givre est la plus belle de Velmara. Et la plus chaude.', choices: [
          { text: 'Voir vos créations.', next: 'isel_shop' },
          { text: 'Commande sur mesure ?', next: 'isel_craft' },
          { text: 'Non.', next: 'isel_bye' },
        ]},
        isel_shop: { id: 'isel_shop', speaker: 'Isel', text: 'Mes tenues.', trigger: { setFlag: 'open_shop_isel' } },
        isel_craft: { id: 'isel_craft', speaker: 'Isel', text: 'Fourrure de Loup de Givre et glace ancienne. Je taille et je couds.', trigger: { setFlag: 'open_craft_isel' } },
        isel_bye: { id: 'isel_bye', speaker: 'Isel', text: 'Reste au chaud.' }
      }
    }
  },
  bgNpc('frostveil_archivist',  'Archivist Ord',    'frostveil', 'Crysthea gardait tout ici. Tout. J\'essaie de faire pareil avec ce qui reste.'),
  bgNpc('frostveil_guard_8',    'Frel',              'frostveil', 'Les Permafrost Titans bougent vers le sud. Lentement. Mais ils bougent.'),
  bgNpc('frostveil_scholar_2',  'Mira la Savante',  'frostveil', 'Les runes de givre racontent l\'histoire de Velmara. Je les lis. C\'est long.'),
  bgNpc('frostveil_child_5',    'Neva',              'frostveil', 'J\'ai sculpté un bonhomme de glace. Crysthea en ferait peut-être quelque chose.'),
  bgNpc('frostveil_elderly_2',  'Veran',             'frostveil', 'Je me souviens quand le blizzard n\'était pas éternel. Il y a longtemps.'),
  bgNpc('frostveil_hunter',     'Grim le Chasseur', 'frostveil', 'Je chasse les loups de givre. Pas par nécessité. Parce que c\'est tout ce que je sais faire.'),
];

// ══════════════════════════════════════════════════════════════════
// THE LAST HEARTH (Glaciem — ville 2)
// ══════════════════════════════════════════════════════════════════

export const LAST_HEARTH_NPCS: NPC[] = [
  {
    id: 'lasthearth_smith',
    name: 'Torak le Forgeron',
    sprite: 'npc_lasthearth_smith',
    portrait: 'portrait_lasthearth_smith',
    location: 'last_hearth',
    questIds: ['sq_hearth_01_titan_heart'],
    shopItems: ['titan_greatsword', 'memory_staff', 'crystal_dragon_fang_staff', 'glaciem_guardian_chest', 'ice_dragon_scale_chest', 'frost_gauntlets', 'ice_cape'],
    dialogue: {
      rootId: 'torak_default',
      lines: {
        torak_default: { id: 'torak_default', speaker: 'Torak', text: 'Le dernier feu de Glaciem. Et je forge dessus. C\'est poétique, non ?', choices: [
          { text: 'Voir ta marchandise.', next: 'torak_shop' },
          { text: 'Forge sur commande ?', next: 'torak_craft' },
          { text: 'À bientôt.', next: 'torak_bye' },
        ]},
        torak_shop: { id: 'torak_shop', speaker: 'Torak', text: 'Le meilleur de ce que j\'ai.', trigger: { setFlag: 'open_shop_torak' } },
        torak_craft: { id: 'torak_craft', speaker: 'Torak', text: 'Splinters de Crysthea et essence gelée. Je fais le reste.', trigger: { startQuest: 'sq_hearth_01_titan_heart' }, next: 'torak_default' },
        torak_bye: { id: 'torak_bye', speaker: 'Torak', text: 'Garde le feu.' }
      }
    }
  },
  {
    id: 'lasthearth_merchant',
    name: 'Bera la Marchande',
    sprite: 'npc_lasthearth_merchant',
    portrait: 'portrait_lasthearth_merchant',
    location: 'last_hearth',
    questIds: ['fq_hearth_01_wolf_hunt'],
    shopItems: ['frost_wolf_pelt', 'frost_wolf_pelt_uncommon', 'frozen_essence', 'ancient_frost_rune', 'crysthea_splinter', 'minor_health_potion', 'antidote'],
    dialogue: {
      rootId: 'bera_default',
      lines: {
        bera_default: { id: 'bera_default', speaker: 'Bera', text: 'The Last Hearth. Le nom dit tout. Ce qu\'on a ici, on ne l\'a que ici.', choices: [
          { text: 'Voir votre stock.', next: 'bera_shop' },
          { text: 'Vous avez besoin d\'aide ?', next: 'bera_quest' },
          { text: 'Non.', next: 'bera_bye' },
        ]},
        bera_shop: { id: 'bera_shop', speaker: 'Bera', text: 'Ce que j\'ai.', trigger: { setFlag: 'open_shop_bera' } },
        bera_quest: { id: 'bera_quest', speaker: 'Bera', text: 'Les loups de givre s\'approchent du foyer. J\'ai besoin que quelqu\'un les repousse.', trigger: { startQuest: 'fq_hearth_01_wolf_hunt' }, next: 'bera_default' },
        bera_bye: { id: 'bera_bye', speaker: 'Bera', text: 'À bientôt.' }
      }
    }
  },
  {
    id: 'lasthearth_alchemist',
    name: 'Meld l\'Alchimiste',
    sprite: 'npc_lasthearth_alchemist',
    portrait: 'portrait_lasthearth_alchemist',
    location: 'last_hearth',
    questIds: ['fq_hearth_02_warmth_brew'],
    shopItems: ['minor_health_potion', 'health_potion', 'major_health_potion', 'mana_potion', 'antidote', 'full_elixir', 'revive_crystal'],
    dialogue: {
      rootId: 'meld_default',
      lines: {
        meld_default: { id: 'meld_default', speaker: 'Meld', text: 'Le dernier feu chaud de Glaciem sert aussi à distiller. Tant qu\'il brûle.', choices: [
          { text: 'Voir vos potions.', next: 'meld_shop' },
          { text: 'Que vous faut-il ?', next: 'meld_quest' },
          { text: 'Non merci.', next: 'meld_bye' },
        ]},
        meld_shop: { id: 'meld_shop', speaker: 'Meld', text: 'Ce que j\'ai fait.', trigger: { setFlag: 'open_shop_meld' } },
        meld_quest: { id: 'meld_quest', speaker: 'Meld', text: 'Des fleurs de givre des grottes profondes. Dix. Je les transforme en chaleur en bouteille.', trigger: { startQuest: 'fq_hearth_02_warmth_brew' }, next: 'meld_default' },
        meld_bye: { id: 'meld_bye', speaker: 'Meld', text: 'Reviens.' }
      }
    }
  },
  {
    id: 'lasthearth_tailor',
    name: 'Renn la Costumière',
    sprite: 'npc_lasthearth_tailor',
    portrait: 'portrait_lasthearth_tailor',
    location: 'last_hearth',
    questIds: [],
    shopItems: ['skin_frost_shroud', 'skin_glaciem_crown', 'skin_divine_vestments'],
    dialogue: {
      rootId: 'renn_default',
      lines: {
        renn_default: { id: 'renn_default', speaker: 'Renn', text: 'Je couds pour garder chaud. Et pour garder beau. Les deux sont importants.', choices: [
          { text: 'Voir vos créations.', next: 'renn_shop' },
          { text: 'Commande ?', next: 'renn_craft' },
          { text: 'Non.', next: 'renn_bye' },
        ]},
        renn_shop: { id: 'renn_shop', speaker: 'Renn', text: 'Mes tenues.', trigger: { setFlag: 'open_shop_renn' } },
        renn_craft: { id: 'renn_craft', speaker: 'Renn', text: 'Fourrure, glace ancienne, essence gelée. Je fais le reste.', trigger: { setFlag: 'open_craft_renn' } },
        renn_bye: { id: 'renn_bye', speaker: 'Renn', text: 'Reste au chaud.' }
      }
    }
  },
  bgNpc('lasthearth_keeper',    'Gardien Volk',   'last_hearth', 'Je garde ce feu depuis vingt ans. Ce n\'est pas le blizzard qui l\'éteindra.'),
  bgNpc('lasthearth_scholar',   'Tor l\'Érudit',  'last_hearth', 'The Last Hearth est mentionné dans les archives de Crysthea. Pas par ce nom. Par un nom plus ancien.'),
  bgNpc('lasthearth_hunter_2',  'Skar',           'last_hearth', 'Les Dragons de Cristal s\'approchent. Je ne les chasse pas. Je les observe.'),
  bgNpc('lasthearth_child_6',   'Ven',            'last_hearth', 'Papa dit que le feu ne s\'éteindra jamais. C\'est pour ça qu\'on est restés.'),
  bgNpc('lasthearth_elderly_3', 'Mirna la Vieille','last_hearth', 'Crysthea préservait même la chaleur des choses mortes. Ce foyer, elle l\'a peut-être allumé.'),
  bgNpc('lasthearth_guard_9',   'Gral',           'last_hearth', 'Les Blizzard Wraiths tournent autour depuis trois nuits. Ils n\'entrent pas. Encore.'),
];

// ═══════════════════════════════════════════════════════════════════
// Regroupement final
// ═══════════════════════════════════════════════════════════════════

export const NPCS: NPC[] = [
  // Grievy Town (originaux)
  ...GRIEVY_NPCS,
  // Ignis Reach
  ...ASHFORD_NPCS,
  ...PYRATH_CROSSING_NPCS,
  // Terravast
  ...DEEPDELVE_NPCS,
  ...STONE_WATCH_NPCS,
  // Zephyr Peaks
  ...WINDHERALD_NPCS,
  ...CLOUDSPIRE_NPCS,
  // Abyssmar
  ...SALTMOURN_NPCS,
  ...WRECK_NPCS,
  // Volterra
  ...CIRCUIT_NPCS,
  ...SPARKS_REST_NPCS,
  // Glaciem
  ...FROSTVEIL_NPCS,
  ...LAST_HEARTH_NPCS,
];

export const NPC_MAP: Record<string, NPC> = Object.fromEntries(NPCS.map(n => [n.id, n]));
