import { Weapon, Armor, Accessory, Consumable, Material, KeyItem, Skin, ItemRarity, ItemType, WeaponType, ElementType } from '../types';
import { StatRollSystem } from '../systems/StatRollSystem';

// ── WEAPONS ────────────────────────────────────────────────────

export const WEAPONS: Weapon[] = [
  // Swords
  { id: 'iron_sword', lore: 'Forgée par dizaines à Grievy Town. La plupart n\'ont jamais servi. Celle-ci, si.', name: 'Épée de Fer', description: 'Une lame basique en fer. Fiable.', rarity: ItemRarity.COMMON, type: ItemType.WEAPON, icon: 'item_iron_sword', value: 40, weaponType: WeaponType.SWORD, damage: 14, magicDamage: 0, bonusStats: {}, attackSpeed: 1.0, equipStats: { mainStat: { key: 'ATK_FLAT', value: 14 }, substats: [{ key: 'CRIT_RATE', value: 2, isPercentage: true }] } },
  { id: 'steel_sword', lore: 'L\'acier vient des fourneaux d\'avant l\'Effondrement. On n\'en forge plus d\'aussi bon — plus personne n\'a le temps.', name: 'Épée d\'Acier', description: 'Une lame d\'acier bien forgée.', rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_steel_sword', value: 120, weaponType: WeaponType.SWORD, damage: 22, magicDamage: 0, bonusStats: { str: 1 }, attackSpeed: 1.0, equipStats: { mainStat: { key: 'ATK_FLAT', value: 22 }, substats: [{ key: 'CRIT_RATE', value: 3, isPercentage: true }, { key: 'ATK_PCT', value: 4, isPercentage: true }] } },
  { id: 'storm_sword', lore: 'Trempée dans un arc du réseau par un ingénieur de Volterra. Il n\'a essayé qu\'une seule fois.', name: 'Épée de Tempête', description: 'Une lame qui crépite de l\'éclair de Volterra.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_storm_sword', value: 380, element: ElementType.LIGHTNING, weaponType: WeaponType.SWORD, damage: 30, magicDamage: 20, bonusStats: { str: 2, agi: 1 }, attackSpeed: 1.1, equipStats: { mainStat: { key: 'ATK_FLAT', value: 30 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 8, isPercentage: true }, { key: 'ASPD_PCT', value: 6, isPercentage: true }, { key: 'CRIT_RATE', value: 4, isPercentage: true }] } },
  { id: 'dragonfang_sword', name: 'Croc-Dragon', description: 'Forgée à partir des crocs de Pyrath. Brûle à chaque frappe.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_dragonfang_sword', value: 1200, element: ElementType.FIRE, weaponType: WeaponType.SWORD, damage: 45, magicDamage: 35, bonusStats: { str: 4, vit: 2 }, attackSpeed: 1.0, equipStats: { mainStat: { key: 'ATK_FLAT', value: 45 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 12, isPercentage: true }, { key: 'CRIT_RATE', value: 6, isPercentage: true }, { key: 'CRIT_DMG', value: 15, isPercentage: true }, { key: 'HP_FLAT', value: 60 }] }, lore: 'Pyrath ne perdait ses crocs que par choix. Nul ne sait pourquoi il a laissé ceux-là.' },
  { id: 'velmara_blade', name: 'Lame de Velmara', description: 'Une lame qui change d\'élément à chaque frappe.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_velmara_blade', value: 5000, weaponType: WeaponType.SWORD, damage: 65, magicDamage: 65, bonusStats: { str: 6, int: 6, agi: 4 }, attackSpeed: 1.2, lore: 'Aucun forgeron de Velmara ne prétend l\'avoir créée. On la trouva dans la grotte la plus profonde de Terravast, intacte depuis des siècles.' },
  { id: 'echo_blade', name: 'Lame de l\'Écho', description: 'Une lame qui se duplique à chaque coup, frappant deux fois.', rarity: ItemRarity.MYTHIC, type: ItemType.WEAPON, icon: 'item_echo_blade', value: 18000, weaponType: WeaponType.SWORD, damage: 80, magicDamage: 80, bonusStats: { str: 8, int: 8, agi: 6, vit: 4 }, attackSpeed: 1.3, lore: 'Certaines armes sont fabriquées. D\'autres sont souhaitées à l\'existence. Celle-ci ressemble à la seconde.' },

  // Greatswords
  { id: 'magma_greatsword', lore: 'La lave d\'Ignis Reach refroidit parfois en formes étranges. Celle-ci avait déjà un tranchant quand on l\'a trouvée.', name: 'Espadon de Magma', description: 'Une lame massive en lave durcie. Lente mais dévastatrice.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_magma_greatsword', value: 450, element: ElementType.FIRE, weaponType: WeaponType.GREATSWORD, damage: 55, magicDamage: 18, bonusStats: { str: 3, end: 1 }, attackSpeed: 0.7, equipStats: { mainStat: { key: 'ATK_FLAT', value: 55 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 8, isPercentage: true }, { key: 'ATK_PCT', value: 6, isPercentage: true }, { key: 'HP_FLAT', value: 40 }] } },
  { id: 'colossus_greatsword', lore: 'Le colosse s\'est effondré sans la lâcher. Il a fallu attendre qu\'il oublie pourquoi il la tenait.', name: 'Espadon du Colosse', description: 'Arraché à un Colosse des Ruines. Pèse autant qu\'un cheval.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_colossus_greatsword', value: 1500, element: ElementType.EARTH, weaponType: WeaponType.GREATSWORD, damage: 80, magicDamage: 10, bonusStats: { str: 6, vit: 3, end: 2 }, attackSpeed: 0.65, equipStats: { mainStat: { key: 'ATK_FLAT', value: 80 }, substats: [{ key: 'ATK_PCT', value: 8, isPercentage: true }, { key: 'ELEM_BONUS_PCT', value: 10, isPercentage: true }, { key: 'DEF_FLAT', value: 15 }, { key: 'HP_FLAT', value: 80 }] } },
  { id: 'titan_greatsword', lore: 'Taillé dans un titan que la glace n\'a jamais fini de rendre. Le froid qu\'il dégage est le sien.', name: 'Espadon du Titan', description: 'Des titans gelés de Glaciem. Pulse d\'un froid intense.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_titan_greatsword', value: 6000, element: ElementType.ICE, weaponType: WeaponType.GREATSWORD, damage: 110, magicDamage: 50, bonusStats: { str: 8, end: 5, vit: 4 }, attackSpeed: 0.6 },

  // Staffs
  { id: 'fire_staff', lore: 'Les prêtres de Pyrath en donnaient aux pèlerins pour la traversée. La flamme ne devait servir qu\'à éclairer.', name: 'Sceptre de Braise', description: 'Un sceptre qui canalise la magie du feu.', rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_fire_staff', value: 150, element: ElementType.FIRE, weaponType: WeaponType.STAFF, damage: 5, magicDamage: 28, bonusStats: { int: 2 }, attackSpeed: 0.85, equipStats: { mainStat: { key: 'MATK_FLAT', value: 28 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 8, isPercentage: true }, { key: 'MANA_FLAT', value: 15 }] } },
  { id: 'leviathan_staff', name: 'Sceptre du Léviathan', description: 'Sculpté dans un os de la forme antique de Thalymor. Imprégné de magie océanique.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_leviathan_staff', value: 1800, element: ElementType.WATER, weaponType: WeaponType.STAFF, damage: 8, magicDamage: 80, bonusStats: { int: 7, vit: 3 }, attackSpeed: 0.9, lore: 'Thalymor perdait des os comme la mer perd de l\'écume. Celui-ci s\'est échoué il y a quatre cents ans.' },
  { id: 'memory_staff', name: 'Sceptre des Souvenirs', description: 'Chaque frappe ralentit la cible tandis que ses souvenirs refont surface.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_memory_staff', value: 7000, element: ElementType.ICE, weaponType: WeaponType.STAFF, damage: 10, magicDamage: 110, bonusStats: { int: 10, end: 4 }, attackSpeed: 0.95, lore: 'Crysthea préservait les souvenirs. Ce sceptre le fait encore.' },
  { id: 'crystal_dragon_fang_staff', lore: 'La dent s\'est brisée il y a des siècles et n\'a jamais tiédi. Certaines choses de Glaciem refusent de finir.', name: 'Sceptre-Croc de Cristal', description: 'Taillé dans la dent brisée d\'un dragon de cristal. Froid et tranchant.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_crystal_staff', value: 2200, element: ElementType.ICE, weaponType: WeaponType.STAFF, damage: 12, magicDamage: 90, bonusStats: { int: 8, agi: 2 }, attackSpeed: 1.0 },
  { id: 'herald_staff', lore: 'Conçu pour parler à Volkran d\'égal à égal. Le dieu n\'a jamais répondu.', name: 'Conducteur du Héraut', description: 'Conçu par les ingénieurs de Volterra pour canaliser Volkran directement.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_herald_staff', value: 1700, element: ElementType.LIGHTNING, weaponType: WeaponType.STAFF, damage: 6, magicDamage: 85, bonusStats: { int: 7, agi: 3 }, attackSpeed: 0.92 },
  { id: 'malachars_staff', name: 'Sceptre de Malachar', description: 'Le sceptre qui a lancé la Malédiction du Délitement. Il vibre du souvenir de chaque puissance élémentaire.', rarity: ItemRarity.MYTHIC, type: ItemType.WEAPON, icon: 'item_malachars_staff', value: 25000, element: ElementType.DARK, weaponType: WeaponType.STAFF, damage: 20, magicDamage: 160, bonusStats: { int: 15, end: 5, vit: 5 }, attackSpeed: 1.1, lore: 'Malachar l\'a porté trente ans. Il ne l\'a jamais posé. Pas une seule fois.' },

  // Bows
  { id: 'harpy_bow', lore: 'Les harpies escortaient les voyageurs égarés, autrefois. Cet arc est fait de ce qu\'elles ont laissé tomber en chemin.', name: 'Arc des Harpies', description: 'Léger comme une plume, précis dans le vent.', rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_harpy_bow', value: 180, element: ElementType.WIND, weaponType: WeaponType.BOW, damage: 18, magicDamage: 10, bonusStats: { agi: 2 }, attackSpeed: 1.3, equipStats: { mainStat: { key: 'ATK_FLAT', value: 18 }, substats: [{ key: 'ASPD_PCT', value: 10, isPercentage: true }, { key: 'CRIT_RATE', value: 3, isPercentage: true }] } },
  { id: 'sky_titan_bow', lore: 'Un titan du ciel l\'a bandé une seule fois, dit-on. Le trait n\'est jamais retombé.', name: 'Arc du Titan Céleste', description: 'Si grand qu\'il exige une force inhumaine. Tire des projectiles d\'air comprimé.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_sky_bow', value: 1600, element: ElementType.WIND, weaponType: WeaponType.BOW, damage: 55, magicDamage: 45, bonusStats: { agi: 5, str: 3 }, attackSpeed: 0.8 },
  { id: 'phoenix_bow', name: 'Arc du Phénix', description: 'Fait des plumes de Sylvael. Les flèches s\'enflamment au départ.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_phoenix_bow', value: 8000, element: ElementType.WIND, weaponType: WeaponType.BOW, damage: 70, magicDamage: 70, bonusStats: { agi: 8, int: 5 }, attackSpeed: 1.1, lore: 'Sylvael ne perdait jamais une plume par accident. Chaque plume était délibérée. À quelle fin, nul ne le sait.' },

  // Daggers
  { id: 'dagger_of_shadow', lore: 'Elle a changé de mains plus souvent qu\'aucune autre lame de Velmara. Rarement de gré.', name: 'Dague de l\'Ombre', description: 'Difficile à voir venir. Inflige des dégâts supplémentaires dans le dos.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_shadow_dagger', value: 500, weaponType: WeaponType.DAGGER, damage: 22, magicDamage: 15, bonusStats: { agi: 3, int: 1 }, attackSpeed: 1.6, equipStats: { mainStat: { key: 'ATK_FLAT', value: 22 }, substats: [{ key: 'ASPD_PCT', value: 10, isPercentage: true }, { key: 'CRIT_RATE', value: 5, isPercentage: true }, { key: 'CRIT_DMG', value: 12, isPercentage: true }] } },
  { id: 'depth_serpent_fang_dagger', lore: 'La dent est creuse. Ce qu\'elle contenait s\'est vidé depuis longtemps — c\'est du moins ce qu\'on espère.', name: 'Croc des Profondeurs', description: 'Taillée dans la dent creuse d\'un serpent des abysses. Dégoutte encore.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_depth_fang', value: 600, element: ElementType.WATER, weaponType: WeaponType.DAGGER, damage: 20, magicDamage: 22, bonusStats: { agi: 3, int: 2 }, attackSpeed: 1.5, equipStats: { mainStat: { key: 'ATK_FLAT', value: 20 }, substats: [{ key: 'ASPD_PCT', value: 8, isPercentage: true }, { key: 'ELEM_BONUS_PCT', value: 8, isPercentage: true }, { key: 'LIFESTEAL_PCT', value: 2, isPercentage: true }] } },
  { id: 'malachar_blade', lore: 'Il s\'en servait pour tailler ses plumes. Trente ans de notes ont commencé par ce canif.', name: 'Canif de Malachar', description: 'Sa lame personnelle. Rien d\'ornemental — juste fonctionnel. Comme l\'homme lui-même.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_malachar_blade', value: 2000, element: ElementType.DARK, weaponType: WeaponType.DAGGER, damage: 38, magicDamage: 40, bonusStats: { agi: 5, int: 4 }, attackSpeed: 1.8 },

  // Boss/zone weapons
  { id: 'gorvun_hammer', lore: 'Gorvun ne perdait rien — c\'était sa nature. Ce fragment est la preuve que la nature a cédé.', name: 'Fragment-Lame de Gorvun', description: 'Un éclat du corps de Gorvun, aiguisé en lame massive.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_gorvun_hammer', value: 9000, element: ElementType.EARTH, weaponType: WeaponType.GREATSWORD, damage: 100, magicDamage: 30, bonusStats: { str: 9, end: 5, vit: 3 }, attackSpeed: 0.55 },
  { id: 'volkran_hammer', lore: 'Il se décharge encore, à intervalles réguliers. Pas comme une machine. Comme un cœur qui n\'a pas compris.', name: 'Cœur de Volkran', description: 'Le cœur du corps de Volkran, façonné en arme. En décharge constante.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_volkran_hammer', value: 9500, element: ElementType.LIGHTNING, weaponType: WeaponType.GREATSWORD, damage: 85, magicDamage: 85, bonusStats: { str: 7, int: 7, agi: 3 }, attackSpeed: 0.75 },
  { id: 'sentinel_sword', lore: 'Forgée par le plus dévoué des serviteurs de Malachar, pour un maître qui ne demandait rien. La dévotion pèse plus lourd que l\'acier.', name: 'Lame du Sentinelle', description: 'Sombre et lourde. Forgée par le serviteur le plus dévoué de Malachar.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_sentinel_sword', value: 2500, element: ElementType.DARK, weaponType: WeaponType.SWORD, damage: 55, magicDamage: 50, bonusStats: { str: 5, int: 4, end: 2 }, attackSpeed: 0.95, equipStats: { mainStat: { key: 'ATK_FLAT', value: 55 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 12, isPercentage: true }, { key: 'MATK_FLAT', value: 20 }, { key: 'LIFESTEAL_PCT', value: 3, isPercentage: true }, { key: 'DEF_FLAT', value: 10 }] } },
  { id: 'drowned_knight_sword', lore: 'Le chevalier la tenait encore quand on l\'a remonté. Il a fallu choisir entre la lame et les doigts.', name: 'Épée du Chevalier Noyé', description: 'Lame récupérée sur un chevalier perdu dans les profondeurs d\'Abyssmar.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_drowned_sword', value: 380, element: ElementType.WATER, weaponType: WeaponType.SWORD, damage: 28, magicDamage: 0, bonusStats: { str: 2, end: 1 }, attackSpeed: 1.0, equipStats: { mainStat: { key: 'ATK_FLAT', value: 28 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 7, isPercentage: true }, { key: 'HP_FLAT', value: 45 }, { key: 'DEF_FLAT', value: 8 }] } },
];

// ── ARMOR ──────────────────────────────────────────────────────

export const ARMORS: Armor[] = [
  // Helms
  { id: 'leather_helm', lore: 'Cousu à Grievy Town. Quand il revient cabossé, le tanneur ne pose pas de questions.', name: 'Heaume de Cuir', description: 'Protection basique pour la tête.', rarity: ItemRarity.COMMON, type: ItemType.HELM, icon: 'item_leather_helm', value: 25, defense: 5, magicDefense: 2, bonusStats: {}, equipStats: { mainStat: { key: 'HP_PCT', value: 3, isPercentage: true }, substats: [{ key: 'DEF_FLAT', value: 2 }] } },
  { id: 'iron_helm', lore: 'Le modèle n\'a pas changé depuis trois générations. Les têtes qu\'il protège, si.', name: 'Heaume de Fer', description: 'Casque en fer standard.', rarity: ItemRarity.UNCOMMON, type: ItemType.HELM, icon: 'item_iron_helm', value: 80, defense: 12, magicDefense: 4, bonusStats: { end: 1 }, equipStats: { mainStat: { key: 'HP_PCT', value: 5, isPercentage: true }, substats: [{ key: 'HP_FLAT', value: 20 }, { key: 'DEF_FLAT', value: 4 }] } },
  { id: 'titan_helm', name: 'Heaume du Titan Magma', description: 'Sculpté dans le crâne d\'un Titan de Magma. Extrêmement chaud à porter.', rarity: ItemRarity.RARE, type: ItemType.HELM, icon: 'item_titan_helm', value: 400, element: ElementType.FIRE, defense: 22, magicDefense: 8, bonusStats: { end: 2, vit: 1 }, lore: 'Les orbites sont restées vides. Ceux qui l\'ont porté disent qu\'elles regardent quand même.' },

  // Chests
  { id: 'leather_chest', lore: 'Il sent le cuir, la fumée et la route. Comme tous ceux qui le portent.', name: 'Plastron de Cuir', description: 'Protection basique pour le torse.', rarity: ItemRarity.COMMON, type: ItemType.CHEST, icon: 'item_leather_chest', value: 35, defense: 8, magicDefense: 3, bonusStats: {}, equipStats: { mainStat: { key: 'DEF_FLAT', value: 4 }, substats: [{ key: 'HP_FLAT', value: 15 }] } },
  { id: 'iron_chest', lore: 'Standard de l\'ancienne milice. La milice a disparu. Les plastrons circulent encore.', name: 'Plastron de Fer', description: 'Plastron en fer standard.', rarity: ItemRarity.UNCOMMON, type: ItemType.CHEST, icon: 'item_iron_chest', value: 110, defense: 20, magicDefense: 6, bonusStats: { end: 1 }, equipStats: { mainStat: { key: 'DEF_FLAT', value: 8 }, substats: [{ key: 'HP_FLAT', value: 30 }, { key: 'DEF_PCT', value: 4, isPercentage: true }] } },
  { id: 'fire_chest', lore: 'L\'obsidienne se souvient de la coulée qui l\'a faite. Rien de plus chaud ne l\'inquiète.', name: 'Cuirasse d\'Ignis', description: 'Forgée dans l\'obsidienne d\'Ignis Reach. Résiste au feu.', rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_fire_chest', value: 500, element: ElementType.FIRE, defense: 32, magicDefense: 14, bonusStats: { end: 2, vit: 2 } },
  { id: 'crystal_chest', lore: 'Le cristal de Terravast ne se raye pas. Il garde pourtant la trace de chaque coup, quelque part à l\'intérieur.', name: 'Cuirasse de Cristal', description: 'Cristal de Terravast. Extrêmement dur.', rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_crystal_chest', value: 550, element: ElementType.EARTH, defense: 38, magicDefense: 10, bonusStats: { end: 3, str: 1 } },
  { id: 'coral_chest', lore: 'Le corail était vivant quand on l\'a taillé. Les artisans de Saltmourn jurent qu\'il l\'est encore un peu.', name: 'Cuirasse de Corail', description: 'Plaque de corail d\'Abyssmar. Légère et résistante à la magie d\'eau.', rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_coral_chest', value: 520, element: ElementType.WATER, defense: 28, magicDefense: 20, bonusStats: { end: 2, int: 2 } },
  { id: 'pyrath_armor', lore: 'Tiède, des siècles après. Pyrath réchauffait tout ce qu\'il touchait — c\'est ce qui reste.', name: 'Cuirasse d\'Écailles de Pyrath', description: 'Une section des écailles divines de Pyrath. Aucune forge ne l\'a faite — elle est née.', rarity: ItemRarity.LEGENDARY, type: ItemType.CHEST, icon: 'item_pyrath_armor', value: 8000, element: ElementType.FIRE, defense: 65, magicDefense: 35, bonusStats: { end: 7, vit: 5, str: 3 } },
  { id: 'titan_earth_armor', lore: 'Gorvun avait promis de ne pas bouger. Un morceau de lui tient encore parole.', name: 'Cuirasse-Fragment de Gorvun', description: 'Un morceau de la surface de Gorvun, façonné en armure. D\'une lourdeur impossible.', rarity: ItemRarity.LEGENDARY, type: ItemType.CHEST, icon: 'item_earth_armor', value: 8500, element: ElementType.EARTH, defense: 80, magicDefense: 25, bonusStats: { end: 8, str: 5, vit: 4 } },
  { id: 'abyssal_chest', lore: 'Forgé sous l\'eau, à des pressions qu\'aucun poumon ne supporte. Personne ne demande comment.', name: 'Plastron Abyssal', description: 'Forgé du corail le plus profond et des écailles de Thalymor. Lourd comme le fond de l\'océan.', rarity: ItemRarity.LEGENDARY, type: ItemType.CHEST, icon: 'item_abyssal_chest', value: 8200, element: ElementType.WATER, defense: 70, magicDefense: 50, bonusStats: { end: 7, int: 5, vit: 4 } },
  { id: 'storm_plate', lore: 'Les ingénieurs le portaient pour approcher Volkran. Le dieu prenait ça pour de la politesse.', name: 'Plastron de Tempête de Volkran', description: 'Armure conductrice. Se décharge électriquement à chaque coup reçu.', rarity: ItemRarity.LEGENDARY, type: ItemType.CHEST, icon: 'item_storm_plate', value: 8800, element: ElementType.LIGHTNING, defense: 65, magicDefense: 45, bonusStats: { end: 6, agi: 5, int: 4 } },
  { id: 'glaciem_guardian_chest', lore: 'La glace de Crysthea préserve ce qu\'elle enferme. Porter cette cuirasse, c\'est accepter d\'être gardé.', name: 'Cuirasse de Glaciem', description: 'Une glace si froide qu\'elle gèle les coups qui l\'atteignent.', rarity: ItemRarity.LEGENDARY, type: ItemType.CHEST, icon: 'item_glaciem_chest', value: 9000, element: ElementType.ICE, defense: 75, magicDefense: 55, bonusStats: { end: 8, vit: 5, int: 3 } },
  { id: 'sentinel_armor', lore: 'Elle absorbe la magie comme son porteur absorbait les ordres : sans jamais rien rendre.', name: 'Plastron du Sentinelle du Vide', description: 'Armure sombre qui absorbe les attaques magiques et en convertit une partie en mana.', rarity: ItemRarity.EPIC, type: ItemType.CHEST, icon: 'item_sentinel_armor', value: 3000, element: ElementType.DARK, defense: 55, magicDefense: 55, bonusStats: { end: 5, int: 4, vit: 3 } },
  { id: 'permafrost_armor', lore: 'La glace de titan garde le geste de celui qu\'elle a pris. Quelque chose court encore à l\'intérieur.', name: 'Armure de Permafrost', description: 'Armure en glace de titan. Émet un froid qui blesse les ennemis proches.', rarity: ItemRarity.EPIC, type: ItemType.CHEST, icon: 'item_permafrost_armor', value: 2800, element: ElementType.ICE, defense: 50, magicDefense: 40, bonusStats: { end: 4, vit: 4, int: 2 } },
  { id: 'storm_herald_plate', lore: 'Conçu pour un porteur qui ne craignait rien. Les ingénieurs l\'ont fait beau quand même.', name: 'Plastron du Héraut', description: 'Conçu pour une conductivité maximale.', rarity: ItemRarity.EPIC, type: ItemType.CHEST, icon: 'item_herald_plate', value: 2600, element: ElementType.LIGHTNING, defense: 45, magicDefense: 45, bonusStats: { end: 4, int: 5, agi: 2 } },
  { id: 'unbound_robe', lore: 'Il l\'a cousue lui-même, la première année. Elle a tenu trente ans. Lui aussi.', name: 'Robe de Malachar', description: 'La robe de l\'homme qui a brisé le monde. Résonne encore avec les six éléments.', rarity: ItemRarity.MYTHIC, type: ItemType.CHEST, icon: 'item_unbound_robe', value: 30000, defense: 50, magicDefense: 100, bonusStats: { int: 15, end: 6, vit: 6 } },
  { id: 'pilgrim_robe', lore: 'L\'ourlet est usé dans le sens de la montée. Il n\'y a pas d\'usure pour la descente.', name: 'Robe du Pèlerin', description: 'Une robe portée par quelqu\'un venu à Ignis Reach pour guérir. Il ne l\'a pas trouvé.', rarity: ItemRarity.UNCOMMON, type: ItemType.CHEST, icon: 'item_pilgrim_robe', value: 95, defense: 10, magicDefense: 14, bonusStats: { int: 2, vit: 1 } },
  { id: 'ice_dragon_scale_chest', lore: 'Les écailles se sont détachées une à une, sur des siècles. Quelqu\'un a pris le temps de toutes les ramasser.', name: 'Cuirasse d\'Écailles de Dragon', description: 'Écailles de dragon de cristal superposées en armure. Réfléchit la magie de glace.', rarity: ItemRarity.EPIC, type: ItemType.CHEST, icon: 'item_dragon_chest', value: 2900, element: ElementType.ICE, defense: 52, magicDefense: 60, bonusStats: { end: 4, int: 5, vit: 2 } },
  { id: 'runic_armor', lore: 'Les runes forment une phrase de Gorvun que nul ne sait plus lire. Elle protège quand même.', name: 'Armure Runique', description: 'Plaques gravées de runes des profondeurs de Terravast.', rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_runic_armor', value: 450, element: ElementType.EARTH, defense: 14, magicDefense: 6, bonusStats: { str: 6 } },
  { id: 'seaguard_armor', lore: 'La garnison a coulé avec la ville. Les plastrons remontent, parfois. Les gardes, jamais.', name: 'Armure des Gardes-Mer', description: 'Plastron renforcé de corail de la garnison noyée.', rarity: ItemRarity.UNCOMMON, type: ItemType.CHEST, icon: 'item_seaguard_armor', value: 220, element: ElementType.WATER, defense: 10, magicDefense: 8, bonusStats: { end: 2 } },
  { id: 'glacial_shield', lore: 'Il a arrêté un coup de fléau de Crysthea, dit-on. Du bras qui le tenait, on ne dit rien.', name: 'Bouclier Glacial', description: 'Un bouclier formé de la glace ancienne de Glaciem — ne fond jamais.', rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_glacial_shield', value: 420, element: ElementType.ICE, defense: 16, magicDefense: 12, bonusStats: { end: 3, vit: 2 } },

  // Boots
  { id: 'leather_boots', lore: 'Ressemelées trois fois. Les routes de Velmara usent tout, sauf l\'envie de partir.', name: 'Bottes de Cuir', description: 'Protection basique pour les pieds.', rarity: ItemRarity.COMMON, type: ItemType.BOOTS, icon: 'item_leather_boots', value: 20, defense: 3, magicDefense: 1, bonusStats: {}, equipStats: { mainStat: { key: 'SPD_FLAT', value: 3 }, substats: [{ key: 'DEF_FLAT', value: 2 }] } },
  { id: 'serpent_scale_boots', lore: 'Les écailles n\'ont pas oublié la nage. Sur la pierre mouillée, elles retrouvent leurs habitudes.', name: 'Bottes d\'Écailles de Serpent', description: 'Légères, adhérentes et résistantes à l\'eau.', rarity: ItemRarity.RARE, type: ItemType.BOOTS, icon: 'item_serpent_boots', value: 380, defense: 14, magicDefense: 10, bonusStats: { agi: 3 } },
  { id: 'air_walker_boots', lore: 'Cousues pour les prêtres de Sylvael, qui marchaient d\'île en île. Le silence était une forme de prière.', name: 'Bottes du Marcheur des Airs', description: 'Réduisent le son de vos pas au silence.', rarity: ItemRarity.EPIC, type: ItemType.BOOTS, icon: 'item_air_boots', value: 1400, element: ElementType.WIND, defense: 18, magicDefense: 16, bonusStats: { agi: 6, spd: 4 }, equipStats: { mainStat: { key: 'SPD_FLAT', value: 8 }, substats: [{ key: 'ASPD_PCT', value: 6, isPercentage: true }, { key: 'HP_PCT', value: 5, isPercentage: true }, { key: 'DEF_FLAT', value: 8 }, { key: 'ELEM_BONUS_PCT', value: 8, isPercentage: true }] } },

  // Gloves
  { id: 'obsidian_gauntlets', lore: 'Un lutteur d\'Ashford les portait aux tournois. Plus personne ne lui serrait la main.', name: 'Gantelets d\'Obsidienne', description: 'Gantelets lourds qui écrasent tout ce qu\'ils saisissent.', rarity: ItemRarity.RARE, type: ItemType.GLOVES, icon: 'item_obsidian_gauntlets', value: 420, element: ElementType.FIRE, defense: 18, magicDefense: 5, bonusStats: { str: 3 }, equipStats: { mainStat: { key: 'ATK_PCT', value: 6, isPercentage: true }, substats: [{ key: 'CRIT_RATE', value: 4, isPercentage: true }, { key: 'ELEM_BONUS_PCT', value: 6, isPercentage: true }, { key: 'DEF_FLAT', value: 6 }] } },

  // Capes
  { id: 'storm_eagle_feather_cloak', lore: 'Les plumes ont été ramassées au sol, jamais arrachées. La différence se sent dans le vent.', name: 'Cape de l\'Aigle des Tempêtes', description: 'Réduit le recul des attaques de vent.', rarity: ItemRarity.RARE, type: ItemType.CAPE, icon: 'item_eagle_cloak', value: 350, element: ElementType.WIND, defense: 10, magicDefense: 12, bonusStats: { agi: 2, end: 1 }, equipStats: { mainStat: { key: 'ELEM_BONUS_PCT', value: 8, isPercentage: true }, substats: [{ key: 'SPD_FLAT', value: 4 }, { key: 'HP_FLAT', value: 35 }, { key: 'DEF_FLAT', value: 5 }] } },
  { id: 'tempest_cloak', lore: 'Un pan de la tempête de Sylvael, cousu à des épaules humaines. Elle tire vers le ciel, doucement, tout le temps.', name: 'Cape de la Tempête', description: 'Tissée de la tempête de Sylvael. Vous bougez comme si le vent la portait.', rarity: ItemRarity.LEGENDARY, type: ItemType.CAPE, icon: 'item_tempest_cloak', value: 7500, element: ElementType.WIND, defense: 20, magicDefense: 30, bonusStats: { agi: 8, spd: 5, int: 4 } },
  { id: 'tidal_shell_armor', lore: 'Le rampeur a grandi dedans toute sa vie. Elle garde la forme de quelque chose qui ne voulait pas mourir.', name: 'Cape-Coquille des Marées', description: 'La coquille d\'un rampeur des marées transformée en bouclier dorsal.', rarity: ItemRarity.RARE, type: ItemType.CAPE, icon: 'item_tidal_cape', value: 340, element: ElementType.WATER, defense: 16, magicDefense: 14, bonusStats: { end: 2, vit: 1 } },
];

// ── ACCESSORIES ────────────────────────────────────────────────

export const ACCESSORIES: Accessory[] = [
  // Rings
  { id: 'flame_ring', lore: 'Les fiancés d\'Ashford s\'en offraient, avant. La braise tient plus longtemps que la plupart des promesses.', name: 'Anneau des Braises', description: 'Dégâts de feu +5%.', rarity: ItemRarity.UNCOMMON, type: ItemType.RING, icon: 'item_flame_ring', value: 200, element: ElementType.FIRE, bonusStats: { int: 2, magicAtk: 3 }, equipStats: { mainStat: { key: 'MATK_FLAT', value: 8 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 5, isPercentage: true }, { key: 'MANA_FLAT', value: 12 }] } },
  { id: 'sailor_ghost_ring', lore: 'Le nom gravé à l\'intérieur est rongé par le sel. Quelqu\'un l\'attend peut-être encore.', name: 'Anneau du Marin Perdu', description: 'Porté par un marin qui s\'est noyé dans Abyssmar.', rarity: ItemRarity.RARE, type: ItemType.RING, icon: 'item_sailor_ring', value: 500, element: ElementType.WATER, bonusStats: { int: 3, vit: 2 }, passiveEffect: 'WATER_DMG_15_SPEED_10_PCT', equipStats: { mainStat: { key: 'HP_FLAT', value: 60 }, substats: [{ key: 'MATK_FLAT', value: 10 }, { key: 'MANA_FLAT', value: 20 }, { key: 'ELEM_BONUS_PCT', value: 5, isPercentage: true }] } },
  { id: 'revenant_ring', lore: 'Retiré à un esprit ancré au réseau. Le lien n\'a pas été coupé — juste transféré.', name: 'Anneau du Revenant Enchaîné', description: 'On se sent lié à lui.', rarity: ItemRarity.RARE, type: ItemType.RING, icon: 'item_revenant_ring', value: 480, element: ElementType.LIGHTNING, bonusStats: { int: 4, agi: 2 } },
  { id: 'eternal_flame_ring', lore: 'Allumé au dernier feu sacré de Pyrath. Tant qu\'il brûle, quelque chose du dieu n\'est pas tout à fait mort.', name: 'Anneau de la Flamme Éternelle', description: 'La flamme ne s\'éteint jamais. Vous non plus.', rarity: ItemRarity.EPIC, type: ItemType.RING, icon: 'item_eternal_ring', value: 2000, element: ElementType.FIRE, bonusStats: { int: 5, vit: 4, magicAtk: 8 }, passiveEffect: 'FIRE_SKILL_CD_15_PCT' },
  { id: 'ring_of_the_wind', lore: 'Forgé dans un temple flottant, à une altitude où tout pèse moins. Il n\'a jamais accepté de redescendre.', name: 'Anneau du Vent', description: 'Du domaine de Sylvael. On se sent plus léger.', rarity: ItemRarity.EPIC, type: ItemType.RING, icon: 'item_wind_ring', value: 2200, element: ElementType.WIND, bonusStats: { agi: 6, spd: 4 }, passiveEffect: 'DASH_DISTANCE_20_PCT' },
  { id: 'tidal_ring', lore: 'Thalymor n\'a jamais été en retard. L\'anneau bat encore à son heure.', name: 'Anneau des Marées', description: 'Pulse comme une marée.', rarity: ItemRarity.EPIC, type: ItemType.RING, icon: 'item_tidal_ring', value: 2400, element: ElementType.WATER, bonusStats: { int: 5, vit: 4 }, passiveEffect: 'HEAL_SKILL_20_PCT' },
  { id: 'eye_of_the_storm_ring', lore: 'Au centre exact de la tempête, il y a un endroit calme. Volkran y rangeait ce qu\'il voulait garder.', name: 'Œil de la Tempête', description: 'Vous êtes le centre calme. Tout le reste tourne autour de vous.', rarity: ItemRarity.LEGENDARY, type: ItemType.RING, icon: 'item_storm_ring', value: 7000, element: ElementType.LIGHTNING, bonusStats: { int: 8, agi: 6, str: 4 }, passiveEffect: 'LIGHTNING_DMG_STUNNED_20_PCT' },
  { id: 'ring_of_preservation', lore: 'Crysthea gardait les visages, les voix, les promesses. L\'anneau garde son porteur — c\'est le même geste.', name: 'Anneau de la Préservation', description: 'La nature de Crysthea, concentrée.', rarity: ItemRarity.LEGENDARY, type: ItemType.RING, icon: 'item_preservation_ring', value: 7500, element: ElementType.ICE, bonusStats: { end: 8, vit: 6, int: 4 }, passiveEffect: 'LOW_HP_SHIELD_30_PCT' },
  { id: 'ring_of_the_unbound', lore: 'Il ne l\'a jamais retiré. Pas par attachement — par certitude.', name: 'Anneau du Délié', description: 'L\'anneau de Malachar. Il le portait quand il a lancé la Malédiction du Délitement.', rarity: ItemRarity.MYTHIC, type: ItemType.RING, icon: 'item_unbound_ring', value: 20000, element: ElementType.DARK, bonusStats: { int: 12, str: 6, agi: 6, end: 5 }, passiveEffect: 'SKILL_DMG_15_CD_10_PCT' },
  { id: 'shadow_ring', lore: 'Froid avant la Spire, froid avant Malachar. Certaines choses n\'ont pas besoin d\'excuse.', name: 'Anneau des Ombres', description: 'Froid au toucher. A toujours été froid.', rarity: ItemRarity.RARE, type: ItemType.RING, icon: 'item_shadow_ring', value: 420, element: ElementType.DARK, bonusStats: { agi: 3, int: 3 }, equipStats: { mainStat: { key: 'MATK_FLAT', value: 12 }, substats: [{ key: 'CRIT_RATE', value: 4, isPercentage: true }, { key: 'ELEM_BONUS_PCT', value: 6, isPercentage: true }, { key: 'SPD_FLAT', value: 3 }] } },
  { id: 'wraith_amulet', lore: 'Il l\'avait sur lui en mourant. La mort n\'a pas jugé utile de le rendre.', name: 'Bracelet du Fantôme', description: 'Porté par le revenant qui hantait les grottes de son vivant.', rarity: ItemRarity.RARE, type: ItemType.RING, icon: 'item_wraith_band', value: 460, bonusStats: { int: 4, agi: 2 } },

  // Amulets
  { id: 'wraith_ice_amulet', lore: 'Le blizzard y tient tout entier, replié. Ne l\'écoutez pas trop longtemps.', name: 'Amulette du Fantôme Blizzard', description: 'Le froid de Glaciem sous forme condensée.', rarity: ItemRarity.RARE, type: ItemType.AMULET, icon: 'item_blizzard_amulet', value: 500, element: ElementType.ICE, bonusStats: { int: 4, end: 2 }, equipStats: { mainStat: { key: 'MATK_FLAT', value: 14 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 7, isPercentage: true }, { key: 'MANA_FLAT', value: 20 }, { key: 'HP_FLAT', value: 35 }] } },
  { id: 'frozen_heart_amulet', lore: 'Il bat une fois par heure, exactement. Personne ne sait pour qui.', name: 'Cœur Gelé', description: 'Le cœur d\'un dragon de cristal, préservé dans la glace. Bat encore.', rarity: ItemRarity.EPIC, type: ItemType.AMULET, icon: 'item_frozen_heart', value: 2600, element: ElementType.ICE, bonusStats: { int: 6, vit: 5, end: 3 }, passiveEffect: 'ICE_SLOW_15_PCT' },
  { id: 'thunder_drake_fang', lore: 'Les enfants de Volterra en portaient pour se donner du courage. Les pendentifs ont duré plus longtemps qu\'eux.', name: 'Pendentif-Croc du Drake', description: 'La dent brisée d\'un drake du tonnerre sur un cordon.', rarity: ItemRarity.UNCOMMON, type: ItemType.AMULET, icon: 'item_drake_fang', value: 170, element: ElementType.LIGHTNING, bonusStats: { str: 2, int: 1 }, equipStats: { mainStat: { key: 'ATK_FLAT', value: 8 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 5, isPercentage: true }, { key: 'CRIT_RATE', value: 2, isPercentage: true }] } },
];

// ── CONSUMABLES ────────────────────────────────────────────────

export const CONSUMABLES: Consumable[] = [
  { id: 'minor_health_potion', name: 'Potion de Soin Mineure', description: 'Restaure 80 PV.', rarity: ItemRarity.COMMON, type: ItemType.CONSUMABLE, icon: 'item_hp_minor', value: 15, effect: { hpRestore: 80 }, stackable: true, maxStack: 20 },
  { id: 'health_potion', name: 'Potion de Soin', description: 'Restaure 250 PV.', rarity: ItemRarity.COMMON, type: ItemType.CONSUMABLE, icon: 'item_hp_normal', value: 40, effect: { hpRestore: 250 }, stackable: true, maxStack: 20 },
  { id: 'major_health_potion', name: 'Grande Potion de Soin', description: 'Restaure 600 PV.', rarity: ItemRarity.UNCOMMON, type: ItemType.CONSUMABLE, icon: 'item_hp_major', value: 90, effect: { hpRestore: 600 }, stackable: true, maxStack: 10 },
  { id: 'elixir_of_vitality', name: 'Élixir de Vitalité', description: 'Restaure 100% des PV et accorde un bref effet de régénération.', rarity: ItemRarity.RARE, type: ItemType.CONSUMABLE, icon: 'item_elixir_hp', value: 250, effect: { hpPercent: 1.0, buffStat: 'hp', buffAmount: 5, buffDuration: 30 }, stackable: true, maxStack: 5 },
  { id: 'minor_mana_potion', name: 'Potion de Mana Mineure', description: 'Restaure 50 Mana.', rarity: ItemRarity.COMMON, type: ItemType.CONSUMABLE, icon: 'item_mp_minor', value: 18, effect: { manaRestore: 50 }, stackable: true, maxStack: 20 },
  { id: 'mana_potion', name: 'Potion de Mana', description: 'Restaure 150 Mana.', rarity: ItemRarity.COMMON, type: ItemType.CONSUMABLE, icon: 'item_mp_normal', value: 45, effect: { manaRestore: 150 }, stackable: true, maxStack: 20 },
  { id: 'major_mana_potion', name: 'Grande Potion de Mana', description: 'Restaure 400 Mana.', rarity: ItemRarity.UNCOMMON, type: ItemType.CONSUMABLE, icon: 'item_mp_major', value: 100, effect: { manaRestore: 400 }, stackable: true, maxStack: 10 },
  { id: 'elixir_of_arcana', name: 'Élixir d\'Arcane', description: 'Restaure 100% du Mana et réduit tous les cooldowns de 50%.', rarity: ItemRarity.RARE, type: ItemType.CONSUMABLE, icon: 'item_elixir_mp', value: 280, effect: { manaPercent: 1.0 }, stackable: true, maxStack: 5 },
  { id: 'full_elixir', name: 'Élixir Suprême', description: 'Restaure tous les PV et tout le Mana.', rarity: ItemRarity.EPIC, type: ItemType.CONSUMABLE, icon: 'item_full_elixir', value: 800, effect: { hpPercent: 1.0, manaPercent: 1.0 }, stackable: true, maxStack: 3 },
  { id: 'revive_crystal', name: 'Cristal de Résurrection', description: 'Vous ressuscite automatiquement avec 50% des PV à la mort. Consommé à l\'usage.', rarity: ItemRarity.RARE, type: ItemType.CONSUMABLE, icon: 'item_revive', value: 500, effect: { revive: true, hpPercent: 0.5 }, stackable: true, maxStack: 3 },
  { id: 'antidote', name: 'Antidote', description: 'Guérit tous les effets de statut.', rarity: ItemRarity.COMMON, type: ItemType.CONSUMABLE, icon: 'item_antidote', value: 30, effect: { statusCure: true }, stackable: true, maxStack: 20 },
  { id: 'aldrics_bread', lore: 'Il dit qu\'il en cuit pour tous les voyageurs. Le four ne chauffe plus que pour vous.', name: 'Pain d\'Aldric', description: 'Aldric l\'a cuit lui-même. Il a un goût de maison. Restaure 120 PV.', rarity: ItemRarity.UNCOMMON, type: ItemType.CONSUMABLE, icon: 'item_bread', value: 0, effect: { hpRestore: 120, buffStat: 'vit', buffAmount: 3, buffDuration: 120 }, stackable: true, maxStack: 5 },
];

// ── MATERIALS ──────────────────────────────────────────────────

export const MATERIALS: Material[] = [
  // Fire
  { id: 'ember_core', name: 'Noyau de Braise', description: 'Noyau solidifié d\'une créature ignée. Chaud au toucher.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_ember_core', value: 12, zone: ElementType.FIRE, stackable: true, maxStack: 99 },
  { id: 'obsidian_shard', name: 'Éclat d\'Obsidienne', description: 'Verre volcanique acéré. Prisé des artisans.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_obsidian', value: 15, zone: ElementType.FIRE, stackable: true, maxStack: 99 },
  { id: 'volcanic_ash', name: 'Cendre Volcanique', description: 'Cendre fine des éruptions d\'Ignis Reach. Prisée des alchimistes.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_volcanic_ash', value: 8, zone: ElementType.FIRE, stackable: true, maxStack: 99 },
  { id: 'pyrath_scale', lore: 'Tombée le jour de sa mort. Encore chaude. Elle le restera longtemps.', name: 'Écaille de Pyrath', description: 'Une écaille de dragon divin. Presque indestructible.', rarity: ItemRarity.LEGENDARY, type: ItemType.MATERIAL, icon: 'item_pyrath_scale', value: 3000, zone: ElementType.FIRE, stackable: true, maxStack: 5 },

  // Earth
  { id: 'terravast_crystal', name: 'Cristal de Terravast', description: 'Cristal bioluminescent des cavernes de Terravast.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_terravast_crystal', value: 18, zone: ElementType.EARTH, stackable: true, maxStack: 99 },
  { id: 'ancient_stone_rune', name: 'Rune de Pierre Antique', description: 'Une rune gravée dans une pierre qui survit depuis le premier âge.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_stone_rune', value: 45, zone: ElementType.EARTH, stackable: true, maxStack: 50 },
  { id: 'cave_moss', name: 'Mousse des Cavernes', description: 'Mousse lumineuse et douce qui pousse dans les tunnels.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_cave_moss', value: 6, zone: ElementType.EARTH, stackable: true, maxStack: 99 },
  { id: 'gorvun_fragment', lore: 'La pierre se souvient d\'avoir été un dieu. Elle attend qu\'on la repose.', name: 'Fragment de Gorvun', description: 'Un morceau du dieu de la terre, aussi dense que l\'histoire comprimée.', rarity: ItemRarity.LEGENDARY, type: ItemType.MATERIAL, icon: 'item_gorvun_fragment', value: 3200, zone: ElementType.EARTH, stackable: true, maxStack: 5 },
  { id: 'ruin_colossus_core', name: 'Cœur du Colosse des Ruines', description: 'La pierre animée qui propulsait un colosse. Encore vaguement chaude.', rarity: ItemRarity.RARE, type: ItemType.MATERIAL, icon: 'item_colossus_core', value: 200, zone: ElementType.EARTH, stackable: true, maxStack: 20 },

  // Wind
  { id: 'zephyr_feather', name: 'Plume de Zéphyr', description: 'Une plume si légère qu\'elle bouge dans l\'air calme.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_zephyr_feather', value: 14, zone: ElementType.WIND, stackable: true, maxStack: 99 },
  { id: 'stormstone', name: 'Pierre de Tempête', description: 'Une pierre des îles flottantes, chargée en permanence.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_stormstone', value: 40, zone: ElementType.WIND, stackable: true, maxStack: 50 },
  { id: 'cloudweave_silk', name: 'Soie de Nuages', description: 'Soie récoltée dans les tissus des temples flottants. D\'une finesse impossible.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_cloudweave', value: 50, zone: ElementType.WIND, stackable: true, maxStack: 50 },
  { id: 'sylvael_plume', lore: 'Elle ne touche jamais le sol quand on la lâche. Vieille habitude.', name: 'Plume de Sylvael', description: 'Une plume de la divine phénix elle-même.', rarity: ItemRarity.LEGENDARY, type: ItemType.MATERIAL, icon: 'item_sylvael_plume', value: 3500, zone: ElementType.WIND, stackable: true, maxStack: 5 },

  // Water
  { id: 'deep_coral', name: 'Corail des Profondeurs', description: 'Corail du fond de l\'océan. Plus dur que l\'acier.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_deep_coral', value: 16, zone: ElementType.WATER, stackable: true, maxStack: 99 },
  { id: 'drowned_relic', name: 'Relique Noyée', description: 'Un artefact préservé dans les ruines inondées.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_drowned_relic', value: 55, zone: ElementType.WATER, stackable: true, maxStack: 50 },
  { id: 'sea_glass', name: 'Verre de Mer', description: 'Verre poli des ruines. Lisse et translucide.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_sea_glass', value: 10, zone: ElementType.WATER, stackable: true, maxStack: 99 },
  { id: 'thalymor_scale', lore: 'Elle ne sèche pas. Quelque part, la marée continue.', name: 'Écaille de Thalymor', description: 'Du corps du léviathan. Encore dégoulinante.', rarity: ItemRarity.LEGENDARY, type: ItemType.MATERIAL, icon: 'item_thalymor_scale', value: 3100, zone: ElementType.WATER, stackable: true, maxStack: 5 },

  // Lightning
  { id: 'storm_shard', name: 'Éclat de Tempête', description: 'Un fragment cristallisé de la tempête perpétuelle de Volterra.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_storm_shard', value: 14, zone: ElementType.LIGHTNING, stackable: true, maxStack: 99 },
  { id: 'charged_metal', name: 'Métal Chargé', description: 'Métal des machines brisées de Volterra. Conduit encore.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_charged_metal', value: 20, zone: ElementType.LIGHTNING, stackable: true, maxStack: 99 },
  { id: 'thunder_rune', name: 'Rune du Tonnerre', description: 'Une inscription d\'ingénieur qui stocke une charge électrique.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_thunder_rune', value: 48, zone: ElementType.LIGHTNING, stackable: true, maxStack: 50 },
  { id: 'volkran_coil', lore: 'Elle se décharge selon les motifs exacts du dieu. Plus personne n\'est là pour les mesurer.', name: 'Bobine de Volkran', description: 'Du dieu des tempêtes lui-même. Se décharge aléatoirement. Manipuler avec précaution.', rarity: ItemRarity.LEGENDARY, type: ItemType.MATERIAL, icon: 'item_volkran_coil', value: 3400, zone: ElementType.LIGHTNING, stackable: true, maxStack: 5 },
  { id: 'volt_hound_pelt', name: 'Pelage de Lévrier Voltaïque', description: 'Fourrure conductrice qui crépite d\'électricité statique.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_volt_pelt', value: 60, zone: ElementType.LIGHTNING, stackable: true, maxStack: 30 },

  // Ice
  { id: 'glaciem_ice_shard', name: 'Éclat de Glace de Glaciem', description: 'Glace de Glaciem qui ne fond jamais.', rarity: ItemRarity.COMMON, type: ItemType.MATERIAL, icon: 'item_ice_shard', value: 15, zone: ElementType.ICE, stackable: true, maxStack: 99 },
  { id: 'ancient_frost_rune', name: 'Rune de Givre Ancienne', description: 'Rune des cavernes glacées, préservée depuis des millénaires.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_frost_rune', value: 52, zone: ElementType.ICE, stackable: true, maxStack: 50 },
  { id: 'frozen_essence', name: 'Essence Gelée', description: 'Énergie élémentaire condensée au cœur de Glaciem.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_frozen_essence', value: 65, zone: ElementType.ICE, stackable: true, maxStack: 50 },
  { id: 'crysthea_splinter', lore: 'Quelque chose est préservé au centre, trop petit pour être nommé. Elle, elle savait quoi.', name: 'Éclat de Crysthea', description: 'Un fragment de la déesse de glace elle-même.', rarity: ItemRarity.LEGENDARY, type: ItemType.MATERIAL, icon: 'item_crysthea_splinter', value: 3600, zone: ElementType.ICE, stackable: true, maxStack: 5 },
  { id: 'frost_wolf_pelt', name: 'Pelage de Loup du Givre', description: 'Fourrure épaisse, chaude, résistante à l\'eau.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_wolf_pelt', value: 55, zone: ElementType.ICE, stackable: true, maxStack: 30 },
  { id: 'frost_wolf_pelt_uncommon', name: 'Garniture de Loup du Givre', description: 'Fine garniture de fourrure d\'un loup du givre.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_wolf_fur', value: 40, zone: ElementType.ICE, stackable: true, maxStack: 30 },

  // Dark
  { id: 'dark_essence', name: 'Essence des Ténèbres', description: 'Magie sombre condensée. Les érudits paieraient bien pour ça.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_dark_essence', value: 80, zone: ElementType.DARK, stackable: true, maxStack: 50 },
  { id: 'void_shard', name: 'Éclat du Vide', description: 'Un fragment de rien. Il absorbe la lumière.', rarity: ItemRarity.RARE, type: ItemType.MATERIAL, icon: 'item_void_shard', value: 180, zone: ElementType.DARK, stackable: true, maxStack: 30 },
  { id: 'corrupted_rune', name: 'Rune Corrompue', description: 'Une rune élémentaire tordue par la magie sombre.', rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_corrupted_rune', value: 70, zone: ElementType.DARK, stackable: true, maxStack: 50 },
  { id: 'construct_core', name: 'Cœur de Construction', description: 'Le cœur animé d\'une construction d\'ombre.', rarity: ItemRarity.RARE, type: ItemType.MATERIAL, icon: 'item_construct_core', value: 220, zone: ElementType.DARK, stackable: true, maxStack: 20 },
  { id: 'pyrath_heart', lore: 'Le feu d\'un dieu ne s\'éteint pas avec lui. Il cherche juste un autre endroit où brûler.', name: 'Cœur de Pyrath', description: 'Un fragment du noyau divin de Pyrath. D\'une rareté impossible.', rarity: ItemRarity.MYTHIC, type: ItemType.MATERIAL, icon: 'item_pyrath_heart', value: 15000, zone: ElementType.FIRE, stackable: true, maxStack: 1 },
  { id: 'fragment_of_permanence', lore: 'Tenez-le assez longtemps et vos mains cessent de trembler. C\'était ça, Gorvun.', name: 'Fragment de Permanence', description: 'Un éclat de l\'essence divine de Gorvun — la terre se souvient.', rarity: ItemRarity.EPIC, type: ItemType.MATERIAL, icon: 'item_fragment_permanence', value: 800, zone: ElementType.EARTH, stackable: true, maxStack: 5 },
];

// ── KEY ITEMS ──────────────────────────────────────────────────

export const KEY_ITEMS: KeyItem[] = [
  { id: 'malachars_grimoire', name: 'Grimoire de Malachar', description: 'Les notes de recherche de trente ans. La théorie complète de la Malédiction du Délitement.', rarity: ItemRarity.HIDDEN, type: ItemType.KEY_ITEM, icon: 'item_grimoire', value: 0, lore: 'L\'écriture devient plus petite vers la fin. Soit plus prudente, soit plus certaine.' },
  { id: 'aldrics_letter', name: 'Lettre d\'Aldric', description: 'Une lettre qu\'Aldric a écrite mais n\'a jamais envoyée. Donnée à la fin de sa quête secondaire.', rarity: ItemRarity.HIDDEN, type: ItemType.KEY_ITEM, icon: 'item_letter', value: 0, lore: 'Certaines choses s\'écrivent pour être écrites, non pour être lues.' },
  { id: 'glaciem_archive_key', name: 'Clé des Archives de Glace', description: 'La clé d\'une des cavernes de glace de Crysthea. Lourde et très froide.', rarity: ItemRarity.HIDDEN, type: ItemType.KEY_ITEM, icon: 'item_archive_key', value: 0, questId: 'sq_03_crystal_archivist' },
  { id: 'stone_shield_scroll', name: 'Parchemin du Bouclier de Pierre', description: 'Une inscription ancienne de la terre accordant la connaissance du bouclier.', rarity: ItemRarity.UNCOMMON, type: ItemType.KEY_ITEM, icon: 'item_stone_scroll', value: 80 },
  { id: 'aldric_medallion', name: 'Médaillon d\'Aldric', description: 'L\'ancien médaillon de guilde d\'Aldric, usé et rayé.', rarity: ItemRarity.COMMON, type: ItemType.KEY_ITEM, icon: 'item_aldric_medallion', value: 0 },
  { id: 'family_photo', name: 'Photo de Famille', description: 'Une photographie délavée d\'une famille à Ignis Reach — prise avant l\'éruption.', rarity: ItemRarity.COMMON, type: ItemType.KEY_ITEM, icon: 'item_family_photo', value: 0 },
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
    description: 'Les attaques basiques ont un temps de recharge quasi nul. Frappe comme la foudre.',
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
    description: 'Le premier coup porté à un boss inflige 500% des dégâts, sans critique. Une fois par combat.',
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
  { id: 'cinder_dagger', lore: 'La marque qu\'elle laisse ne cicatrise jamais droit. Les vétérans d\'Ignis Reach se reconnaissent entre eux.', name: 'Dague de Braise', description: 'Rapide et brûlante. Laisse une marque.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_cinder_dagger', value: 420, element: ElementType.FIRE, weaponType: WeaponType.DAGGER, damage: 28, magicDamage: 20, bonusStats: { agi: 4, int: 2 }, attackSpeed: 1.7, equipStats: { mainStat: { key: 'ATK_FLAT', value: 28 }, substats: [{ key: 'ASPD_PCT', value: 9, isPercentage: true }, { key: 'ELEM_BONUS_PCT', value: 8, isPercentage: true }, { key: 'CRIT_RATE', value: 4, isPercentage: true }] } },
  { id: 'pyroclast_bow', lore: 'Monté avec des nerfs de wyrm par un chasseur d\'Ashford. Il ne ratait jamais les braises en vol.', name: 'Arc Pyroclaste', description: 'Flèches incandescentes qui explosent à l\'impact.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_pyroclast_bow', value: 1900, element: ElementType.FIRE, weaponType: WeaponType.BOW, damage: 60, magicDamage: 50, bonusStats: { agi: 6, int: 4 }, attackSpeed: 1.0, equipStats: { mainStat: { key: 'ATK_FLAT', value: 60 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 12, isPercentage: true }, { key: 'CRIT_RATE', value: 6, isPercentage: true }, { key: 'CRIT_DMG', value: 15, isPercentage: true }, { key: 'ASPD_PCT', value: 6, isPercentage: true }] } },
  // Earth
  { id: 'stone_dagger', lore: 'Les mineurs de Deepdelve s\'en servaient pour sonder les filons. Elle a fini par servir à autre chose.', name: 'Dague de Pierre', description: 'Taillée dans le cristal de Terravast. Tranchante.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_stone_dagger', value: 380, element: ElementType.EARTH, weaponType: WeaponType.DAGGER, damage: 30, magicDamage: 12, bonusStats: { str: 3, end: 2 }, attackSpeed: 1.5, equipStats: { mainStat: { key: 'ATK_FLAT', value: 30 }, substats: [{ key: 'ASPD_PCT', value: 6, isPercentage: true }, { key: 'DEF_FLAT', value: 8 }, { key: 'ELEM_BONUS_PCT', value: 7, isPercentage: true }] } },
  { id: 'seismic_staff', lore: 'La terre de Terravast répond à qui sait frapper. Elle ne pose jamais de questions.', name: 'Sceptre Sismique', description: 'Chaque frappe fait trembler le sol.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_seismic_staff', value: 1750, element: ElementType.EARTH, weaponType: WeaponType.STAFF, damage: 10, magicDamage: 88, bonusStats: { int: 7, end: 3 }, attackSpeed: 0.88, equipStats: { mainStat: { key: 'MATK_FLAT', value: 88 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 12, isPercentage: true }, { key: 'MATK_PCT', value: 8, isPercentage: true }, { key: 'MANA_FLAT', value: 35 }, { key: 'DEF_FLAT', value: 10 }] } },
  // Wind
  { id: 'gale_dagger', lore: 'Perdue en plein vol entre deux îles flottantes, dit-on. Personne ne raconte comment on l\'a retrouvée.', name: 'Dague du Vent', description: 'Si légère qu\'elle semble flotter.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_gale_dagger', value: 460, element: ElementType.WIND, weaponType: WeaponType.DAGGER, damage: 20, magicDamage: 25, bonusStats: { agi: 5 }, attackSpeed: 1.8, equipStats: { mainStat: { key: 'ATK_FLAT', value: 20 }, substats: [{ key: 'ASPD_PCT', value: 12, isPercentage: true }, { key: 'SPD_FLAT', value: 4 }, { key: 'CRIT_RATE', value: 4, isPercentage: true }] } },
  { id: 'wind_greatsword', lore: 'Trop lourd pour le vent, trop léger pour la main. Les bergers d\'altitude juraient qu\'il sifflait la nuit.', name: 'Espadon des Rafales', description: 'Aussi tranchant que le vent lui-même.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_wind_greatsword', value: 490, element: ElementType.WIND, weaponType: WeaponType.GREATSWORD, damage: 65, magicDamage: 22, bonusStats: { str: 4, agi: 3 }, attackSpeed: 0.72, equipStats: { mainStat: { key: 'ATK_FLAT', value: 65 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 8, isPercentage: true }, { key: 'ASPD_PCT', value: 6, isPercentage: true }, { key: 'CRIT_RATE', value: 3, isPercentage: true }] } },
  // Water
  { id: 'tide_staff', lore: 'Il pulse au rythme des marées de Thalymor. Les marées se sont arrêtées. Lui, non.', name: 'Bâton des Marées', description: 'Pulse comme un courant sous-marin.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_tide_staff', value: 410, element: ElementType.WATER, weaponType: WeaponType.STAFF, damage: 6, magicDamage: 68, bonusStats: { int: 5, vit: 3 }, attackSpeed: 0.9, equipStats: { mainStat: { key: 'MATK_FLAT', value: 68 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 9, isPercentage: true }, { key: 'MANA_FLAT', value: 25 }, { key: 'HP_FLAT', value: 40 }] } },
  { id: 'coral_sword', lore: 'Le corail a poussé autour d\'un fer de lance abandonné. Abyssmar finit tout ce qu\'on y laisse.', name: 'Épée de Corail', description: 'Forgée dans les profondeurs d\'Abyssmar.', rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_coral_sword', value: 200, element: ElementType.WATER, weaponType: WeaponType.SWORD, damage: 26, magicDamage: 14, bonusStats: { end: 2 }, attackSpeed: 1.0, equipStats: { mainStat: { key: 'ATK_FLAT', value: 26 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 6, isPercentage: true }, { key: 'DEF_FLAT', value: 5 }] } },
  // Lightning
  { id: 'arc_sword', lore: 'Un duelliste de Volterra la sortait les jours d\'orage. Il disait que la foudre reconnaît les siens.', name: 'Épée Arc Électrique', description: 'Inflige un choc à chaque touche.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_arc_sword', value: 440, element: ElementType.LIGHTNING, weaponType: WeaponType.SWORD, damage: 32, magicDamage: 28, bonusStats: { agi: 3, str: 2 }, attackSpeed: 1.15, equipStats: { mainStat: { key: 'ATK_FLAT', value: 32 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 9, isPercentage: true }, { key: 'ASPD_PCT', value: 8, isPercentage: true }, { key: 'CRIT_RATE', value: 3, isPercentage: true }] } },
  { id: 'thunder_bow', lore: 'Les guetteurs de Volterra tiraient des traits de foudre pour guider les convois de nuit. Le dernier convoi est passé il y a trente ans.', name: 'Arc du Tonnerre', description: 'Les flèches laissent une traîne de foudre.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_thunder_bow', value: 1850, element: ElementType.LIGHTNING, weaponType: WeaponType.BOW, damage: 52, magicDamage: 55, bonusStats: { agi: 6, int: 4 }, attackSpeed: 1.2, equipStats: { mainStat: { key: 'ATK_FLAT', value: 52 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 12, isPercentage: true }, { key: 'ASPD_PCT', value: 10, isPercentage: true }, { key: 'CRIT_RATE', value: 5, isPercentage: true }, { key: 'MATK_FLAT', value: 18 }] } },
  // Ice
  { id: 'frost_dagger', lore: 'Le givre qu\'elle laisse dans les plaies ne fond pas. Les guérisseurs de Frostveil ont appris à couper autour.', name: 'Dague du Givre', description: 'Gèle les plaies qu\'elle inflige.', rarity: ItemRarity.RARE, type: ItemType.WEAPON, icon: 'item_frost_dagger', value: 430, element: ElementType.ICE, weaponType: WeaponType.DAGGER, damage: 22, magicDamage: 26, bonusStats: { agi: 3, int: 3 }, attackSpeed: 1.6, equipStats: { mainStat: { key: 'ATK_FLAT', value: 22 }, substats: [{ key: 'ASPD_PCT', value: 9, isPercentage: true }, { key: 'ELEM_BONUS_PCT', value: 8, isPercentage: true }, { key: 'MATK_FLAT', value: 10 }] } },
  { id: 'blizzard_greatsword', lore: 'Son sillage met des jours à fondre. Celui de son dernier porteur s\'arrête au milieu de la toundra.', name: 'Espadon des Blizzards', description: 'Laisse derrière lui un sillage de glace.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_blizzard_gs', value: 1650, element: ElementType.ICE, weaponType: WeaponType.GREATSWORD, damage: 90, magicDamage: 40, bonusStats: { str: 7, int: 4, end: 3 }, attackSpeed: 0.62, equipStats: { mainStat: { key: 'ATK_FLAT', value: 90 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 12, isPercentage: true }, { key: 'ATK_PCT', value: 8, isPercentage: true }, { key: 'CRIT_DMG', value: 18, isPercentage: true }, { key: 'HP_FLAT', value: 70 }] } },
  // Dark
  { id: 'shadow_staff', lore: 'La lumière qu\'il absorbe ne ressort nulle part. Les érudits préfèrent ne pas chercher où elle va.', name: 'Sceptre des Ombres', description: 'Semble absorber la lumière environnante.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_shadow_staff', value: 2100, element: ElementType.DARK, weaponType: WeaponType.STAFF, damage: 15, magicDamage: 95, bonusStats: { int: 8, agi: 3 }, attackSpeed: 0.95, equipStats: { mainStat: { key: 'MATK_FLAT', value: 95 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 12, isPercentage: true }, { key: 'MATK_PCT', value: 9, isPercentage: true }, { key: 'CRIT_RATE', value: 5, isPercentage: true }, { key: 'LIFESTEAL_PCT', value: 3, isPercentage: true }] } },
  { id: 'void_bow', lore: 'Les flèches n\'arrivent jamais. Quelque chose arrive à leur place.', name: 'Arc du Vide', description: 'Les flèches disparaissent. Les ennemis aussi.', rarity: ItemRarity.EPIC, type: ItemType.WEAPON, icon: 'item_void_bow', value: 2200, element: ElementType.DARK, weaponType: WeaponType.BOW, damage: 58, magicDamage: 60, bonusStats: { agi: 7, int: 5 }, attackSpeed: 1.1, equipStats: { mainStat: { key: 'ATK_FLAT', value: 58 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 12, isPercentage: true }, { key: 'CRIT_DMG', value: 18, isPercentage: true }, { key: 'LIFESTEAL_PCT', value: 3, isPercentage: true }, { key: 'ASPD_PCT', value: 6, isPercentage: true }] } },
  // Divine
  { id: 'divine_sword', name: 'Épée Sacrée', description: 'Brille d\'une lumière douce. Les démons la fuient.', rarity: ItemRarity.LEGENDARY, type: ItemType.WEAPON, icon: 'item_divine_sword', value: 9500, element: ElementType.DIVINE, weaponType: WeaponType.SWORD, damage: 90, magicDamage: 90, bonusStats: { str: 8, int: 8, vit: 5 }, attackSpeed: 1.1, equipStats: { mainStat: { key: 'ATK_FLAT', value: 90 }, substats: [{ key: 'MATK_FLAT', value: 35 }, { key: 'CRIT_RATE', value: 8, isPercentage: true }, { key: 'CRIT_DMG', value: 25, isPercentage: true }, { key: 'HP_PCT', value: 6, isPercentage: true }] }, lore: 'La contre-réponse à Malachar, trouvée trop tard.' },
  { id: 'test_dual_dagger', lore: 'Le fourreau était fait pour deux. Elles n\'ont jamais été séparées.', name: 'Dagues Jumelles',   description: 'Une paire de dagues assorties, prises à un même fourreau.', rarity: ItemRarity.COMMON, type: ItemType.WEAPON, icon: 'item_test_dual_dagger', value: 10, weaponType: WeaponType.DUAL_DAGGER, damage: 20, magicDamage: 0, bonusStats: {}, attackSpeed: 1.5, equipStats: { mainStat: { key: 'ATK_FLAT', value: 20 }, substats: [{ key: 'ASPD_PCT', value: 6, isPercentage: true }] } },
  { id: 'test_dual_sword', lore: 'Un maître d\'armes de Grievy Town enseignait avec. Il n\'a jamais eu qu\'un seul élève.',  name: 'Lames Croisées',    description: 'Deux lames courtes, faites pour frapper en même temps.',  rarity: ItemRarity.COMMON, type: ItemType.WEAPON, icon: 'item_test_dual_sword',  value: 10, weaponType: WeaponType.DUAL_SWORD,  damage: 25, magicDamage: 0, bonusStats: {}, attackSpeed: 1.0, equipStats: { mainStat: { key: 'ATK_FLAT', value: 25 }, substats: [{ key: 'CRIT_RATE', value: 2, isPercentage: true }] } },
  { id: 'test_axe', lore: 'Elle a abattu plus d\'arbres que d\'ennemis. C\'est une bonne vie, pour une hache.',         name: 'Hache de Bûcheron', description: 'Simple, robuste, encore couverte de sève séchée.',        rarity: ItemRarity.COMMON, type: ItemType.WEAPON, icon: 'item_test_axe',         value: 10, weaponType: WeaponType.AXE,         damage: 30, magicDamage: 0, bonusStats: {}, attackSpeed: 0.9, equipStats: { mainStat: { key: 'ATK_FLAT', value: 30 }, substats: [{ key: 'ATK_PCT', value: 3, isPercentage: true }] } },
  { id: 'test_hammer', lore: 'Le forgeron le réclame encore. Personne ne se souvient le lui avoir emprunté.',      name: 'Marteau de Forge',  description: 'Emprunté à une forge. Lourd, mais ça ne pardonne pas.',   rarity: ItemRarity.COMMON, type: ItemType.WEAPON, icon: 'item_test_hammer',      value: 10, weaponType: WeaponType.HAMMER,      damage: 35, magicDamage: 0, bonusStats: {}, attackSpeed: 0.7, equipStats: { mainStat: { key: 'ATK_FLAT', value: 35 }, substats: [{ key: 'HP_FLAT', value: 25 }] } },
  // Zone chest rewards (referenced by zoneMaps lootable pools)
  { id: 'wind_bow', lore: 'Les guides des sommets s\'en servaient pour signaler les passages sûrs. Il n\'y a plus de passages sûrs.',      name: 'Arc des Sommets',     description: 'Léger comme l\'air de Zephyr Peaks.',       rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_wind_bow',      value: 220, element: ElementType.WIND,      weaponType: WeaponType.BOW,   damage: 30, magicDamage: 18, bonusStats: { agi: 3 }, attackSpeed: 1.3, equipStats: { mainStat: { key: 'ATK_FLAT', value: 30 }, substats: [{ key: 'ASPD_PCT', value: 8, isPercentage: true }, { key: 'ELEM_BONUS_PCT', value: 6, isPercentage: true }] } },
  { id: 'water_staff', lore: 'Tenu près de l\'oreille, on entend l\'eau profonde. Certains soirs, elle répond.',   name: 'Bâton des Abysses',   description: 'Murmure de l\'eau profonde.',               rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_water_staff',   value: 200, element: ElementType.WATER,     weaponType: WeaponType.STAFF, damage: 4,  magicDamage: 40, bonusStats: { int: 3 }, attackSpeed: 0.9, equipStats: { mainStat: { key: 'MATK_FLAT', value: 40 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 6, isPercentage: true }, { key: 'MANA_FLAT', value: 18 }] } },
  { id: 'thunder_staff', lore: 'Les orages de Volterra le trouvent, où qu\'il soit. Son porteur apprend à marcher vite.', name: 'Sceptre de Foudre',   description: 'Attire les éclairs de Volterra.',           rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_thunder_staff', value: 240, element: ElementType.LIGHTNING, weaponType: WeaponType.STAFF, damage: 5,  magicDamage: 45, bonusStats: { int: 4 }, attackSpeed: 0.9, equipStats: { mainStat: { key: 'MATK_FLAT', value: 45 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 7, isPercentage: true }, { key: 'CRIT_RATE', value: 2, isPercentage: true }] } },
  { id: 'frost_staff', lore: 'Taillé dans une stalactite des archives de Crysthea. Il garde le silence des lieux où il a grandi.',   name: 'Sceptre de Givre',    description: 'Chaque frappe refroidit l\'adversaire.',    rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_frost_staff',   value: 230, element: ElementType.ICE,       weaponType: WeaponType.STAFF, damage: 4,  magicDamage: 42, bonusStats: { int: 3, vit: 1 }, attackSpeed: 0.88, equipStats: { mainStat: { key: 'MATK_FLAT', value: 42 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 6, isPercentage: true }, { key: 'HP_FLAT', value: 30 }] } },
  { id: 'earth_tome', lore: 'Recopié à la main par des générations de géomanciens. La dernière main s\'est arrêtée en milieu de page.',    name: 'Tome de la Terre',    description: 'Recueil de sorts géomantiques de Terravast.',rarity: ItemRarity.UNCOMMON, type: ItemType.WEAPON, icon: 'item_earth_tome',    value: 210, element: ElementType.EARTH,     weaponType: WeaponType.STAFF, damage: 4,  magicDamage: 38, bonusStats: { int: 3, end: 1 }, attackSpeed: 0.85, equipStats: { mainStat: { key: 'MATK_FLAT', value: 38 }, substats: [{ key: 'ELEM_BONUS_PCT', value: 6, isPercentage: true }, { key: 'DEF_FLAT', value: 6 }] } },
];

// ── ADDITIONAL ARMORS ───────────────────────────────────────────

export const EXTRA_ARMORS: Armor[] = [
  // Legs
  { id: 'leather_legs', lore: 'La route de Velmara se lit à l\'usure des genoux.', name: 'Jambières de Cuir', description: 'Protection basique pour les jambes.', rarity: ItemRarity.COMMON, type: ItemType.LEGS, icon: 'item_leather_legs', value: 22, defense: 5, magicDefense: 2, bonusStats: {}, equipStats: { mainStat: { key: 'DEF_FLAT', value: 3 }, substats: [{ key: 'SPD_FLAT', value: 2 }] } },
  { id: 'iron_legs', lore: 'Le fer ralentit le pas. Ceux qui reviennent des zones disent que c\'est un prix honnête.', name: 'Jambières de Fer', description: 'Standard de fer.', rarity: ItemRarity.UNCOMMON, type: ItemType.LEGS, icon: 'item_iron_legs', value: 75, defense: 14, magicDefense: 4, bonusStats: { end: 1 } },
  { id: 'fire_legs', lore: 'Trempées dans la coulée, refroidies dans la cendre. Ignis Reach ne fait pas de demi-mesures.', name: 'Jambières Ignées', description: 'Forgées dans la lave d\'Ignis Reach.', rarity: ItemRarity.RARE, type: ItemType.LEGS, icon: 'item_fire_legs', value: 400, element: ElementType.FIRE, defense: 24, magicDefense: 10, bonusStats: { end: 2, str: 1 } },
  { id: 'earth_legs', lore: 'Le cristal s\'est déposé en couches, une par année. On porte un peu du temps de Terravast.', name: 'Braconnières de Pierre', description: 'Terravast crystal layered leg guards.', rarity: ItemRarity.RARE, type: ItemType.LEGS, icon: 'item_earth_legs', value: 420, element: ElementType.EARTH, defense: 30, magicDefense: 8, bonusStats: { end: 3 } },
  { id: 'wind_legs', lore: 'On oublie qu\'on les porte. Sur les crêtes de Zephyr Peaks, c\'est parfois un problème.', name: 'Jambières des Rafales', description: 'Légères comme le vent de Zephyr.', rarity: ItemRarity.RARE, type: ItemType.LEGS, icon: 'item_wind_legs', value: 380, element: ElementType.WIND, defense: 18, magicDefense: 12, bonusStats: { agi: 4 } },
  { id: 'water_legs', lore: 'Le corail plie avec le courant. Les artisans de Saltmourn n\'ont eu qu\'à l\'écouter.', name: 'Jambières Corallines', description: 'Corail d\'Abyssmar, souple et résistant.', rarity: ItemRarity.RARE, type: ItemType.LEGS, icon: 'item_water_legs', value: 390, element: ElementType.WATER, defense: 20, magicDefense: 16, bonusStats: { end: 2, int: 1 } },
  { id: 'lightning_legs', lore: 'Doublées de toile isolante. Celle des pillards — personne ne pose la question.', name: 'Jambières Conductrices', description: 'Conçues pour les terrains électrifiés de Volterra.', rarity: ItemRarity.RARE, type: ItemType.LEGS, icon: 'item_lightning_legs', value: 410, element: ElementType.LIGHTNING, defense: 22, magicDefense: 14, bonusStats: { agi: 3, end: 2 } },
  { id: 'ice_legs', lore: 'La glace de Glaciem ne fond pas. Le froid, lui, finit par devenir une compagnie.', name: 'Braies Givrées', description: 'La glace de Glaciem ne fond pas.', rarity: ItemRarity.RARE, type: ItemType.LEGS, icon: 'item_ice_legs', value: 430, element: ElementType.ICE, defense: 26, magicDefense: 18, bonusStats: { end: 2, vit: 2 } },
  // Gloves extra
  { id: 'leather_gloves', lore: 'Ils prennent la forme des mains en une semaine. Après, ils refusent d\'en changer.', name: 'Gants de Cuir', description: 'Protection basique des mains.', rarity: ItemRarity.COMMON, type: ItemType.GLOVES, icon: 'item_leather_gloves', value: 18, defense: 3, magicDefense: 1, bonusStats: {}, equipStats: { mainStat: { key: 'CRIT_RATE', value: 2, isPercentage: true }, substats: [{ key: 'ATK_FLAT', value: 3 }] } },
  { id: 'iron_gauntlets', lore: 'On y perd le toucher, on y garde ses doigts. Le marché est ancien.', name: 'Gantelets de Fer', description: 'Robustes et lourds.', rarity: ItemRarity.UNCOMMON, type: ItemType.GLOVES, icon: 'item_iron_gauntlets', value: 70, defense: 10, magicDefense: 3, bonusStats: { str: 1 } },
  { id: 'wind_gloves', lore: 'La main part avant la pensée. Les archers de Windherald appelaient ça le deuxième souffle.', name: 'Gants des Rafales', description: 'Augmentent la vitesse d\'attaque.', rarity: ItemRarity.RARE, type: ItemType.GLOVES, icon: 'item_wind_gloves', value: 380, element: ElementType.WIND, defense: 12, magicDefense: 8, bonusStats: { agi: 4, spd: 2 } },
  { id: 'frost_gauntlets', lore: 'Le givre remonte jusqu\'au coude, puis s\'arrête. Il connaît sa place.', name: 'Gantelets de Givre', description: 'Les ennemis frémissent à leur contact.', rarity: ItemRarity.EPIC, type: ItemType.GLOVES, icon: 'item_frost_gauntlets', value: 1600, element: ElementType.ICE, defense: 24, magicDefense: 18, bonusStats: { int: 5, str: 3 } },
  // Helms extra
  { id: 'fire_helm', name: 'Heaume Igné', description: 'La chaleur lui fait comme une couronne.', rarity: ItemRarity.RARE, type: ItemType.HELM, icon: 'item_fire_helm', value: 420, element: ElementType.FIRE, defense: 20, magicDefense: 8, bonusStats: { end: 2 }, lore: 'Le forgeron n\'a jamais réussi à éteindre la braise en son centre. Il a fini par arrêter d\'essayer.' },
  { id: 'earth_helm', name: 'Heaume de Terravast', description: 'Crystal sur cuir endurci.', rarity: ItemRarity.RARE, type: ItemType.HELM, icon: 'item_earth_helm', value: 410, element: ElementType.EARTH, defense: 25, magicDefense: 6, bonusStats: { end: 2, str: 1 }, lore: 'Le cristal pulse doucement quand la terre de Terravast tremble au loin.' },
  { id: 'wind_helm', name: 'Heaume du Vent', description: 'Aussi aérien qu\'une plume de Sylvael.', rarity: ItemRarity.RARE, type: ItemType.HELM, icon: 'item_wind_helm', value: 390, element: ElementType.WIND, defense: 16, magicDefense: 10, bonusStats: { agi: 3 }, lore: 'On l\'oublie sur la tête. C\'est bien le but.' },
  { id: 'water_helm', name: 'Heaume Marin', description: 'Casque de pillard des mers, cornes et grille de fer inclus.', rarity: ItemRarity.RARE, type: ItemType.HELM, icon: 'item_water_helm', value: 400, element: ElementType.WATER, defense: 18, magicDefense: 12, bonusStats: { end: 1, int: 2 }, lore: 'Récupéré sur l\'épave d\'un drakkar échoué à Abyssmar. Le sel n\'a jamais réussi à le ronger.' },
  { id: 'lightning_helm', name: 'Heaume du Foudroiement', description: 'Canalise sans griller.', rarity: ItemRarity.RARE, type: ItemType.HELM, icon: 'item_lightning_helm', value: 430, element: ElementType.LIGHTNING, defense: 18, magicDefense: 12, bonusStats: { agi: 2, int: 2 }, lore: 'Un léger bourdonnement, en permanence. On finit par ne plus l\'entendre.' },
  { id: 'dark_helm', name: 'Heaume du Vide', description: 'Masque les traits du porteur.', rarity: ItemRarity.EPIC, type: ItemType.HELM, icon: 'item_dark_helm', value: 1500, element: ElementType.DARK, defense: 28, magicDefense: 24, bonusStats: { int: 5, agi: 3 }, lore: 'Personne ne se souvient du visage sous ce casque. Peut-être qu\'il n\'y en a plus.' },
  // Boots extra
  { id: 'iron_boots', lore: 'On les entend arriver de loin. C\'est parfois le but.', name: 'Bottes de Fer', description: 'Lourdes mais solides.', rarity: ItemRarity.UNCOMMON, type: ItemType.BOOTS, icon: 'item_iron_boots', value: 65, defense: 8, magicDefense: 3, bonusStats: { end: 1 } },
  { id: 'fire_boots', lore: 'Le cordonnier d\'Ashford n\'a jamais dit comment il tanne ce cuir. Il n\'a plus de sourcils.', name: 'Bottes Ignées', description: 'Ne fondent pas dans la lave.', rarity: ItemRarity.RARE, type: ItemType.BOOTS, icon: 'item_fire_boots', value: 370, element: ElementType.FIRE, defense: 14, magicDefense: 6, bonusStats: { spd: 2, end: 1 } },
  { id: 'wind_boots', lore: 'Cousues de soie de nuages. Le sol n\'est plus qu\'une suggestion.', name: 'Bottes du Vent', description: 'La vitesse de marche augmente de 20%.', rarity: ItemRarity.EPIC, type: ItemType.BOOTS, icon: 'item_wind_boots', value: 1500, element: ElementType.WIND, defense: 16, magicDefense: 14, bonusStats: { agi: 5, spd: 5 } },
  { id: 'void_boots', lore: 'Aucune trace, même dans la cendre fraîche. La Spire n\'aime pas qu\'on sache qui la parcourt.', name: 'Bottes du Vide', description: 'Aucun son de pas. Aucune trace.', rarity: ItemRarity.LEGENDARY, type: ItemType.BOOTS, icon: 'item_void_boots', value: 6500, element: ElementType.DARK, defense: 25, magicDefense: 25, bonusStats: { agi: 8, spd: 6, int: 4 } },
  // Capes extra
  { id: 'fire_cape', lore: 'Le tissu a déjà brûlé une fois. Il a décidé que ce serait la seule.', name: 'Cape de Cendres', description: 'Tissu noir calciné qui protège des flammes.', rarity: ItemRarity.RARE, type: ItemType.CAPE, icon: 'item_fire_cape', value: 360, element: ElementType.FIRE, defense: 12, magicDefense: 14, bonusStats: { end: 2 } },
  { id: 'earth_cape', lore: 'Les runes cousues sont des copies de copies. Il reste quand même quelque chose de la phrase d\'origine.', name: 'Cape de Rune', description: 'Runes anciennes cousues dans le tissu.', rarity: ItemRarity.RARE, type: ItemType.CAPE, icon: 'item_earth_cape', value: 340, element: ElementType.EARTH, defense: 14, magicDefense: 10, bonusStats: { end: 2, str: 1 } },
  { id: 'water_cape', lore: 'Le sang glisse dessus comme la pluie. Les gardes-mer y tenaient beaucoup.', name: 'Cape des Profondeurs', description: 'Imperméable à l\'eau et au sang.', rarity: ItemRarity.RARE, type: ItemType.CAPE, icon: 'item_water_cape', value: 350, element: ElementType.WATER, defense: 12, magicDefense: 16, bonusStats: { vit: 2, int: 1 } },
  { id: 'ice_cape', lore: 'Elle boit le blizzard et n\'en rend rien. Frostveil doit ses dernières patrouilles à ce tissage.', name: 'Cape du Blizzard', description: 'Absorbe les tempêtes de Glaciem.', rarity: ItemRarity.EPIC, type: ItemType.CAPE, icon: 'item_ice_cape', value: 1400, element: ElementType.ICE, defense: 18, magicDefense: 22, bonusStats: { end: 3, int: 3 } },
  { id: 'dark_cape', lore: 'Dans le noir, elle disparaît. Le porteur aussi — en partie.', name: 'Cape des Ombres', description: 'Se fond dans l\'obscurité.', rarity: ItemRarity.EPIC, type: ItemType.CAPE, icon: 'item_dark_cape', value: 1600, element: ElementType.DARK, defense: 16, magicDefense: 20, bonusStats: { agi: 5, int: 4 } },
  { id: 'divine_cape', lore: 'Tissée d\'un fil de lumière laissé par une divinité morte. Le tisserand a pleuré tout du long, sans savoir pourquoi.', name: 'Cape de Lumière', description: 'Tissu divin que les ombres fuient.', rarity: ItemRarity.LEGENDARY, type: ItemType.CAPE, icon: 'item_divine_cape', value: 7000, element: ElementType.DIVINE, defense: 22, magicDefense: 35, bonusStats: { vit: 6, int: 5, end: 4 } },
  // Zone chest rewards (referenced by zoneMaps lootable pools)
  { id: 'volcanic_armor', lore: 'Forgée si près du cratère que le marteau sonnait faux. Elle a gardé la note.',   name: 'Armure Volcanique',  description: 'Forgée dans le magma d\'Ignis Reach.',    rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_fire_chest',     value: 450, element: ElementType.FIRE,      defense: 28, magicDefense: 10, bonusStats: { end: 2, str: 2 } },
  { id: 'lightning_armor', lore: 'La foudre la traverse sans s\'arrêter. Volterra a mis trente ans à comprendre que c\'était possible.',  name: 'Armure du Tonnerre', description: 'Conduit l\'électricité sans dommage.',    rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_storm_plate',    value: 480, element: ElementType.LIGHTNING, defense: 24, magicDefense: 18, bonusStats: { end: 2, agi: 2 } },
  { id: 'crystal_armor', lore: 'Le cristal a poussé autour d\'un mannequin de forge oublié. Il a fallu l\'en découper.',    name: 'Armure de Cristal',  description: 'Crystallisation de l\'énergie de Glaciem.',rarity: ItemRarity.RARE, type: ItemType.CHEST, icon: 'item_glaciem_chest',  value: 500, element: ElementType.ICE,       defense: 30, magicDefense: 20, bonusStats: { end: 3, vit: 1 } },
];


// ── SHOP ARMORS (referenced by shops.ts) ──────────────────────
const SHOP_ARMORS: Armor[] = [
  { id: 'leather_armor', lore: 'Le tanneur ne souhaite jamais bonne chance à ceux qui l\'achètent. Il dit seulement : revenez.', name: 'Armure de Cuir', description: 'Armure légère en cuir tanné. Fiable pour débuter.', rarity: ItemRarity.COMMON, type: ItemType.CHEST, icon: 'item_leather_chest', value: 55, defense: 8, magicDefense: 3, bonusStats: {} },
  { id: 'chainmail', lore: 'Mille anneaux, chacun fermé à la main. La patience est une armure comme une autre.',     name: 'Cotte de Mailles', description: 'Mailles de fer entrelacées. Bonne protection sans surpoids.', rarity: ItemRarity.UNCOMMON, type: ItemType.CHEST, icon: 'item_iron_chest', value: 160, defense: 18, magicDefense: 5, bonusStats: { end: 1 } },
  { id: 'iron_shield', lore: 'Cabossé exprès à la forge, avant la vente. Un bouclier neuf donne de mauvaises habitudes.',   name: 'Bouclier de Fer', description: 'Bouclier robuste forgé à Grievy Town.', rarity: ItemRarity.COMMON, type: ItemType.CHEST, icon: 'item_glacial_shield', value: 70, defense: 12, magicDefense: 2, bonusStats: {} },
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
  { id: 'leviathan_scale',  name: 'Écaille de Léviathan',  description: 'Armure naturelle arrachée au colosse abyssal.', rarity: ItemRarity.EPIC,     type: ItemType.MATERIAL, icon: 'item_leviathan_scale',value: 350, zone: ElementType.WATER,     stackable: true, maxStack: 5  },
  { id: 'volt_crystal',     name: 'Cristal Voltaïque',     description: 'Conduit l\'électricité sans résistance.',        rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_volt_crystal',   value: 38,  zone: ElementType.LIGHTNING, stackable: true, maxStack: 50 },
  { id: 'copper_coil',      name: 'Bobine de Cuivre',      description: 'Composant des installations de Volterra.',      rarity: ItemRarity.COMMON,   type: ItemType.MATERIAL, icon: 'item_copper_coil',    value: 12,  zone: ElementType.LIGHTNING, stackable: true, maxStack: 99 },
  { id: 'refined_copper',   name: 'Cuivre Raffiné',        description: 'Alliage conducteur de haute qualité.',          rarity: ItemRarity.UNCOMMON, type: ItemType.MATERIAL, icon: 'item_refined_copper', value: 28,  zone: ElementType.LIGHTNING, stackable: true, maxStack: 50 },
  { id: 'chaos_crystal',    name: 'Cristal du Chaos',      description: 'Stabilisé par magie seulement — éphémère.',     rarity: ItemRarity.EPIC,     type: ItemType.MATERIAL, icon: 'item_chaos_crystal',  value: 400, zone: ElementType.DARK,      stackable: true, maxStack: 5  },
];

// ── ITEM REGISTRY ──────────────────────────────────────────────

const ALL_ITEM_DEFS: import('../types').Item[] = [
  ...WEAPONS, ...ARMORS, ...ACCESSORIES, ...CONSUMABLES, ...MATERIALS, ...KEY_ITEMS,
  ...HIDDEN_WEAPONS, ...HIDDEN_ARMORS, ...HIDDEN_ACCESSORIES,
  ...SKINS, ...EXTRA_WEAPONS, ...EXTRA_ARMORS, ...EXTRA_MATERIALS, ...SHOP_ARMORS,
] as import('../types').Item[];

// Génère equipStats (centre de equipRanges) + valide la data en dev — no-op
// sûr pour tout item sans equipRanges (cf. docs/design/LOOT_STAT_ROLLS.md §1.2).
StatRollSystem.finalizeCatalogue(ALL_ITEM_DEFS);

export const ALL_ITEMS: Record<string, import('../types').Item> = {};
ALL_ITEM_DEFS.forEach(item => {
  ALL_ITEMS[item.id] = item;
});
