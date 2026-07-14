import { GENERATED_BESTIARY } from './enemiesGenerated';
// ─────────────────────────────────────────────────────────────────
// BESTIAIRE — Grievy Town's Dilemma
//
// Données lore + drops pour tous les ennemis du jeu.
// - shortDesc : affiché dès la première rencontre (teaser)
// - lore      : débloqué après le premier kill (l'avant, la chute, le sens)
// - drops     : convertis depuis enemies.ts (dropRate 0-1 → dropRatePct 0-100)
//
// Règles hidden/mythic :
// - Chaque item HIDDEN est exclusif à UN SEUL ennemi (max 1 hidden par ennemi).
//   Affiché "???" dans le bestiaire tant qu'il n'a pas été looté.
// - Les items MYTHIC sont partagés entre 2-4 ennemis d'une même zone
//   (toujours le boss + éventuellement des élites), taux 0.2-1%.
//
// ⚠️ RÈGLE ABSOLUE : un `itemId` de cette table DOIT exister dans le catalogue.
//
// Ce fichier a longtemps référencé neuf items hidden « inventés ici, à créer dans
// items.ts » — wyrm_fang_shard, pilgrims_last_prayer, heart_of_the_mountain,
// sky_titans_oath, drowned_locket, tear_of_the_deep, engineers_final_schematic,
// primordial_ice_core, scholars_torn_page. Ils n'ont jamais été créés. Neuf gros
// ennemis (dont trois boss) affichaient donc au joueur un « ??? » qui ne pouvait
// être révélé par AUCUN nombre de kills : une promesse de butin que le jeu ne
// pouvait pas tenir. Ces neuf drops ont été retirés (07/2026).
//
// Un `itemId` fantôme ne casse rien à la compilation et ne lève aucune erreur au
// runtime — il se contente de mentir au joueur. Ne jamais en ajouter un « en
// attendant » de créer l'item : créer l'item D'ABORD, le référencer ensuite.
// ─────────────────────────────────────────────────────────────────

export interface BestiaryEnemyData {
  enemyId: string;
  name: string;
  habitat: string;      // courte description du lieu ("Rivières de lave, Ignis Reach")
  shortDesc: string;    // 1-2 phrases affichées dès la découverte (teaser)
  lore: string;         // paragraphe complet débloqué après premier kill
  drops: BestiaryDropData[];
}

export interface BestiaryDropData {
  itemId: string;
  dropRatePct: number;  // 0-100
  isHidden: boolean;    // true = item affiché "???" jusqu'au premier loot
}

export const BESTIARY_DATA: BestiaryEnemyData[] = [

  // ── IGNIS REACH (Feu) ────────────────────────────────────────

  {
    enemyId: 'ember_wyrm',
    name: 'Wyrm de Braise',
    habitat: 'Ciel de cendre, Ignis Reach',
    shortDesc: 'Une petite créature ailée au visage pâle et brûlant, qui tournoie dans le ciel de cendre. Son piqué laisse des brûlures qui persistent des heures.',
    lore: 'Avant l\'Effondrement, les wyrms portaient la chaleur d\'une source sacrée à l\'autre sur leurs petites ailes — des créatures dociles que les pèlerins voyaient comme un bon présage. La corruption en a fait des prédateurs aveugles, mais quelque chose dans leur manière de tournoyer au-dessus des anciennes sources suggère qu\'ils les cherchent encore. Elles n\'existent plus.',
    drops: [
      { itemId: 'ember_core', dropRatePct: 45, isHidden: false },
      { itemId: 'volcanic_ash', dropRatePct: 60, isHidden: false },
      { itemId: 'iron_sword', dropRatePct: 8, isHidden: false },
      { itemId: 'flame_ring', dropRatePct: 1.5, isHidden: false },
    ],
  },
  {
    enemyId: 'lava_golem',
    name: 'Golem de Lave',
    habitat: 'Coulées refroidies, Ignis Reach',
    shortDesc: 'Une masse trapue de magma en refroidissement, une pioche de chantier au poing. Lent, immense, impossible à ignorer.',
    lore: 'Des golems de cette taille ont façonné les montagnes d\'Ignis Reach — c\'étaient des outils de chantier, pas des armes. La malédiction n\'a pas changé leurs gestes : on en voit encore empiler des blocs de pierre au bord des coulées, ériger des murs que personne ne leur a demandés. Ils bâtissent quelque chose. Puis ils vous voient, et le chantier attend.',
    drops: [
      { itemId: 'obsidian_shard', dropRatePct: 55, isHidden: false },
      { itemId: 'ember_core', dropRatePct: 35, isHidden: false },
      { itemId: 'fire_chest', dropRatePct: 6, isHidden: false },
      { itemId: 'obsidian_gauntlets', dropRatePct: 2, isHidden: false },
    ],
  },
  {
    enemyId: 'cinder_sprite',
    name: 'Esprit de Cendre',
    habitat: 'Champs de cendre, Ignis Reach',
    shortDesc: 'Un petit élémentaire de feu, rapide et nerveux, qui attaque toujours en groupe.',
    lore: 'Pyrath en a créé des millions pour transporter les braises sacrées d\'un bout de la zone à l\'autre — des messagers de flamme, chacun porteur d\'une étincelle du dieu. Ils portent toujours leur braise. Ils ne savent simplement plus à qui la livrer, alors ils la jettent sur tout ce qui bouge.',
    drops: [
      { itemId: 'volcanic_ash', dropRatePct: 70, isHidden: false },
      { itemId: 'ember_core', dropRatePct: 20, isHidden: false },
      { itemId: 'minor_health_potion', dropRatePct: 12, isHidden: false },
    ],
  },
  {
    enemyId: 'ash_revenant',
    name: 'Revenant des Cendres',
    habitat: 'Route des pèlerins, Ignis Reach',
    shortDesc: 'Une silhouette en linceul de cendre, un œil de braise sous la capuche — le fantôme d\'un pèlerin mort ici. Il bombarde à distance, comme s\'il vous refusait le passage.',
    lore: 'Les sources sacrées guérissaient. Des milliers de pèlerins ont fait la route au fil des siècles — les malades, les mourants, ceux qui espéraient encore. Ceux que l\'éruption a pris n\'ont jamais fini le trajet. Les revenants refont le chemin du pèlerinage, nuit après nuit, dans le même ordre, aux mêmes étapes. Ils arrivent aux sources. Ils repartent. Ils recommencent.',
    drops: [
      { itemId: 'volcanic_ash', dropRatePct: 80, isHidden: false },
      { itemId: 'pilgrim_robe', dropRatePct: 4, isHidden: false },
      { itemId: 'fire_staff', dropRatePct: 1.2, isHidden: false },
    ],
  },
  {
    enemyId: 'magma_titan',
    name: 'Titan de Magma',
    habitat: 'Cratères anciens, Ignis Reach (élite)',
    shortDesc: 'Un colosse rare et territorial. Il ne bouge pas tant que vous n\'êtes pas trop près. Ensuite, il ne s\'arrête plus.',
    lore: 'Les titans vivaient dans ces montagnes bien avant l\'arrivée de Pyrath. Le dieu ne les a pas créés — il les a revendiqués, et ils ont accepté, parce qu\'un dieu qui vous revendique est un dieu qui vous protège. Ils sont plus vieux que la malédiction. Ils sont aussi plus en colère : ils se souviennent d\'avoir eu un maître, et ils se souviennent de ce que ça a coûté.',
    drops: [
      { itemId: 'ember_core', dropRatePct: 80, isHidden: false },
      { itemId: 'obsidian_shard', dropRatePct: 70, isHidden: false },
      { itemId: 'magma_greatsword', dropRatePct: 8, isHidden: false },
      { itemId: 'titan_helm', dropRatePct: 5, isHidden: false },
      { itemId: 'pyrath_heart', dropRatePct: 0.3, isHidden: false },
    ],
  },
  {
    enemyId: 'ember_broodmother',
    name: 'Mère-Couvée de Braise',
    habitat: 'Failles obscures, Ignis Reach',
    shortDesc: 'Une petite créature féline aux oreilles pointues, les crocs découverts. Sa nichée n\'éclot pas — elle la crache : des braises vivantes.',
    lore: 'Rien de tel n\'existait avant le Délitement. Le feu de Pyrath avait une qualité génératrice — il faisait naître, il réchauffait, il rendait la vie possible dans un lieu qui aurait dû la refuser. La malédiction a gardé la génération et jeté tout le reste. La mère-couvée crache des portées de braises vivantes comme on jette des pierres. Elle est ce que la corruption invente quand on lui donne le pouvoir de créer sans la raison de créer.',
    drops: [
      { itemId: 'ember_core', dropRatePct: 55, isHidden: false },
      { itemId: 'volcanic_ash', dropRatePct: 65, isHidden: false },
      { itemId: 'minor_health_potion', dropRatePct: 10, isHidden: false },
    ],
  },
  {
    enemyId: 'scorch_sentinel',
    name: 'Sentinelle Brûlante',
    habitat: 'Sanctuaires en ruine, Ignis Reach',
    shortDesc: 'Un chevalier de pierre animé par un feu divin résiduel, épée et bouclier au poing. Il tourne autour des sanctuaires de Pyrath en cercles éternels.',
    lore: 'Les prêtres de Pyrath les ont placés là pour garder les sanctuaires. C\'était un poste d\'honneur : veiller sur ce que le dieu avait de plus précieux. Aucun nouvel ordre n\'est arrivé depuis trois cents ans. La malédiction n\'a rien eu à leur faire — elle a juste rendu leur consigne absolue. Les sanctuaires sont vides. Le cercle continue.',
    drops: [
      { itemId: 'obsidian_shard', dropRatePct: 60, isHidden: false },
      { itemId: 'ember_core', dropRatePct: 30, isHidden: false },
      { itemId: 'stone_shield_scroll', dropRatePct: 4, isHidden: false },
    ],
  },
  {
    enemyId: 'pyrath_boss',
    name: 'Pyrath le Déchaîné',
    habitat: 'Cœur du volcan, Ignis Reach (divinité)',
    shortDesc: 'Ce qui reste du dragon divin du feu — un mufle cornu, un œil unique, une fournaise sans direction.',
    lore: 'Pyrath fut la première divinité à descendre sur Velmara. Il réchauffait les sources, guidait les pèlerins, laissait les enfants toucher ses écailles une fois l\'an. Il sera la première à mourir. Il ne reconnaît pas le héros. Il ne reconnaît personne — ni ses titans, ni ses prêtres, ni ses propres sanctuaires. La malédiction a réduit sa forme à une seule chose : une gueule. Ce que vous tuez dans le cratère n\'est pas un monstre. C\'est ce qui reste d\'une bonté qui n\'a plus de mémoire.',
    drops: [
      { itemId: 'pyrath_scale', dropRatePct: 100, isHidden: false },
      { itemId: 'ember_core', dropRatePct: 100, isHidden: false },
      { itemId: 'dragonfang_sword', dropRatePct: 25, isHidden: false },
      { itemId: 'pyrath_armor', dropRatePct: 15, isHidden: false },
      { itemId: 'eternal_flame_ring', dropRatePct: 4, isHidden: false },
      { itemId: 'pyrath_heart', dropRatePct: 1, isHidden: false },
      { itemId: 'hidden_first_blade', dropRatePct: 0.07, isHidden: true },
    ],
  },

  // ── TERRAVAST (Terre) ────────────────────────────────────────

  {
    enemyId: 'stone_crawler',
    name: 'Rampeur de Pierre',
    habitat: 'Tunnels des canyons, Terravast',
    shortDesc: 'Un colosse voûté des tunnels, traînant une queue plate qui balaie les éboulis. Vous l\'entendez racler la pierre bien avant de le voir.',
    lore: 'Les bêtes de somme de Gorvun. Leur queue plate dégageait les éboulis, gardait les passages ouverts pour les mineurs et les voyageurs. C\'était un travail humble et ils le faisaient bien. Ils gardent toujours les tunnels — mais désormais, tout ce qui y entre est un intrus, y compris ceux pour qui les tunnels avaient été creusés.',
    drops: [
      { itemId: 'terravast_crystal', dropRatePct: 50, isHidden: false },
      { itemId: 'cave_moss', dropRatePct: 65, isHidden: false },
      { itemId: 'stone_shield_scroll', dropRatePct: 5, isHidden: false },
    ],
  },
  {
    enemyId: 'crystal_golem',
    name: 'Golem de Cristal',
    habitat: 'Grottes de cristal, Terravast',
    shortDesc: 'Le cœur-cristal d\'un golem dont le corps s\'est effondré depuis longtemps. Il flotte — et certaines attaques magiques rebondissent sur ses facettes.',
    lore: 'Les grottes de cristal les ont fait pousser sur des siècles, et Gorvun a façonné chacun d\'eux à la main — un dieu de la permanence qui prenait le temps de sculpter des gardiens un par un. Quand ses convulsions ont abattu leurs corps, les cœurs ont refusé de s\'arrêter. Ils flottent au-dessus de leurs propres gravats et ne protègent plus que la seule chose qui reste à protéger : eux-mêmes. Ils le font parfaitement.',
    drops: [
      { itemId: 'terravast_crystal', dropRatePct: 75, isHidden: false },
      { itemId: 'ancient_stone_rune', dropRatePct: 30, isHidden: false },
      { itemId: 'crystal_chest', dropRatePct: 5, isHidden: false },
      { itemId: 'hidden_mirror_helm', dropRatePct: 0.07, isHidden: true },
    ],
  },
  {
    enemyId: 'cave_lurker',
    name: 'Rôdeur des Caves',
    habitat: 'Tapis fongiques, Terravast',
    shortDesc: 'Un champignon violet au large chapeau, immobile parmi les inoffensifs. La différence ne se voit que quand il bouge. C\'est déjà trop tard.',
    lore: 'Des prédateurs naturels de l\'écosystème des cavernes — ils existaient avant Gorvun, avant les mineurs, avant tout. Ils fuyaient la lumière : une torche suffisait à sécuriser un campement. La malédiction ne les a pas transformés. Elle leur a juste retiré la peur. C\'est peut-être la chose la plus inquiétante qu\'elle ait faite dans ces grottes.',
    drops: [
      { itemId: 'cave_moss', dropRatePct: 70, isHidden: false },
      { itemId: 'terravast_crystal', dropRatePct: 25, isHidden: false },
      { itemId: 'dagger_of_shadow', dropRatePct: 0.8, isHidden: false },
    ],
  },
  {
    enemyId: 'terravast_serpent',
    name: 'Fureteur de Terravast',
    habitat: 'Fonds des canyons, Terravast',
    shortDesc: 'Une silhouette trapue et encapuchonnée qui hante les fonds des canyons. Elle s\'accroupit, attend, puis se détend comme un ressort.',
    lore: 'Ils fouinaient dans ces canyons bien avant l\'arrivée de Gorvun — petites silhouettes voûtées qui pillaient les filons sans lui demander la permission. Le dieu les trouvait amusants. Il les a laissés rester. C\'est peut-être le seul acte de tolérance gratuite qu\'on connaisse de lui. Ils fouinent toujours sur son domaine. Il n\'y a plus personne pour trouver ça amusant.',
    drops: [
      { itemId: 'ancient_stone_rune', dropRatePct: 40, isHidden: false },
      { itemId: 'terravast_crystal', dropRatePct: 55, isHidden: false },
      { itemId: 'serpent_scale_boots', dropRatePct: 2.5, isHidden: false },
    ],
  },
  {
    enemyId: 'rune_shard_ghost',
    name: 'Fantôme d\'Éclat de Rune',
    habitat: 'Parois gravées, Terravast',
    shortDesc: 'Un petit esprit encapuchonné né des runes anciennes brisées, un œil vert qui cligne lentement. Il projette des éclats de cristal à grande distance.',
    lore: 'Les runes gravées dans les parois de Terravast étaient le langage de Gorvun — chaque mur était une phrase, chaque canyon un chapitre. Quand la malédiction a fissuré la pierre, elle a fissuré les mots avec. Ces fantômes sont des phrases interrompues qui ont reçu du chagrin et du mouvement. Ils ne se souviennent pas de ce qu\'ils disaient. Seulement qu\'ils sont cassés.',
    drops: [
      { itemId: 'ancient_stone_rune', dropRatePct: 55, isHidden: false },
      { itemId: 'terravast_crystal', dropRatePct: 40, isHidden: false },
      { itemId: 'minor_mana_potion', dropRatePct: 12, isHidden: false },
    ],
  },
  {
    enemyId: 'stone_hound',
    name: 'Brute de Pierre',
    habitat: 'Mines profondes, Terravast',
    shortDesc: 'Une masse compacte de terre animée, un manche d\'outil serré entre les mâchoires. Elle vous a senti bien avant que vous ne la voyiez.',
    lore: 'Gorvun les gardait comme bêtes de somme dans les mines profondes. Elles portaient les outils, tiraient les chariots, dormaient au pied des puits. Les mineurs leur donnaient des noms. Le manche qu\'elles serrent encore entre leurs dents est un outil des mines. Le travail est fini depuis longtemps. Personne ne le leur a dit.',
    drops: [
      { itemId: 'cave_moss', dropRatePct: 55, isHidden: false },
      { itemId: 'terravast_crystal', dropRatePct: 30, isHidden: false },
      { itemId: 'minor_health_potion', dropRatePct: 10, isHidden: false },
    ],
  },
  {
    enemyId: 'ruin_colossus',
    name: 'Colosse des Ruines',
    habitat: 'Ruines effondrées, Terravast (élite)',
    shortDesc: 'Un assemblage de gravats des structures anciennes, tenu debout par quelque chose qui ressemble à de la volonté.',
    lore: 'Quand Gorvun tremble, les structures anciennes s\'effondrent et se reforment. La pierre de Terravast a de la mémoire — c\'est le domaine de la permanence, rien n\'y oublie sa forme. Mais parfois, la reformation se fait mal : un temple se relève avec les pierres d\'un pont, une tour avec les dalles d\'un tombeau. Le colosse est un bâtiment qui ne sait plus ce qu\'il était, animé, agressif, sans fonction. Il cherche son plan d\'origine. Il ne le trouvera pas.',
    drops: [
      { itemId: 'ancient_stone_rune', dropRatePct: 85, isHidden: false },
      { itemId: 'ruin_colossus_core', dropRatePct: 40, isHidden: false },
      { itemId: 'colossus_greatsword', dropRatePct: 6, isHidden: false },
      { itemId: 'runic_armor', dropRatePct: 4, isHidden: false },
    ],
  },
  {
    enemyId: 'gorvun_boss',
    name: 'Gorvun le Tremblant',
    habitat: 'Gouffre central, Terravast (divinité)',
    shortDesc: 'L\'avatar corrompu du titan divin de la terre — un gardien cornu, bouclier au bras, fléau au poing. Chaque coup fissure le sol.',
    lore: 'Gorvun n\'avait pas bougé volontairement depuis trois siècles. C\'était sa nature et son cadeau : la permanence. Les villes se construisaient sur ses épaules parce qu\'il avait promis de ne pas bouger, et un dieu de la terre tient ses promesses. Maintenant, il ne peut plus s\'arrêter. La malédiction n\'a laissé au dieu-gardien que deux objets : un bouclier qu\'il ne sait plus planter, un fléau qu\'il ne sait plus retenir. Le héros ne vient pas le vaincre. Il vient tenir la dernière promesse à sa place.',
    drops: [
      { itemId: 'gorvun_fragment', dropRatePct: 100, isHidden: false },
      { itemId: 'ancient_stone_rune', dropRatePct: 100, isHidden: false },
      { itemId: 'gorvun_hammer', dropRatePct: 22, isHidden: false },
      { itemId: 'titan_earth_armor', dropRatePct: 12, isHidden: false },
      { itemId: 'fragment_of_permanence', dropRatePct: 3.5, isHidden: false },
    ],
  },

  // ── ZEPHYR PEAKS (Vent) ──────────────────────────────────────

  {
    enemyId: 'gale_harpy',
    name: 'Harpie de Tempête',
    habitat: 'Temples de nuage, Zephyr Peaks',
    shortDesc: 'Une prédatrice ailée qui garde ses distances — jusqu\'à ce que vous approchiez trop, et alors elle plonge.',
    lore: 'Les harpies nichaient dans les temples de nuage et gardaient les sentiers qui montaient vers le domaine de Sylvael. Elles étaient protectrices, pas agressives : un voyageur égaré était escorté vers la vallée, pas attaqué. Certains guides de montagne juraient les reconnaître individuellement, année après année. Puis la tempête est venue, et les sentiers qu\'elles gardaient ont été arrachés du ciel. Elles gardent maintenant le vide où les sentiers passaient.',
    drops: [
      { itemId: 'zephyr_feather', dropRatePct: 65, isHidden: false },
      { itemId: 'stormstone', dropRatePct: 35, isHidden: false },
      { itemId: 'harpy_bow', dropRatePct: 2.5, isHidden: false },
    ],
  },
  {
    enemyId: 'storm_eagle',
    name: 'Aigle Orageux',
    habitat: 'Pics orageux, Zephyr Peaks',
    shortDesc: 'Un rapace trapu à la crête cornue, crépitant d\'électricité statique. Son piqué est annoncé — et presque impossible à esquiver quand même.',
    lore: 'Les rapaces qui nichaient près des pics d\'orage absorbaient l\'électricité ambiante depuis des générations. Ils étaient magnifiques — à distance raisonnable. Les habitants de Windherald montaient les observer aux solstices, quand leurs plumes chargées dessinaient des arcs dans le ciel. Personne ne monte plus. La tempête a plié leurs crêtes en cornes et rendu tout le ciel à portée de leurs serres.',
    drops: [
      { itemId: 'stormstone', dropRatePct: 60, isHidden: false },
      { itemId: 'zephyr_feather', dropRatePct: 45, isHidden: false },
      { itemId: 'storm_eagle_feather_cloak', dropRatePct: 1.8, isHidden: false },
    ],
  },
  {
    enemyId: 'wind_wraith',
    name: 'Spectre du Vent',
    habitat: 'Courants d\'altitude, Zephyr Peaks',
    shortDesc: 'Un être de vent compressé sous une capuche, un œil rouge dans le vide. Le combattre, c\'est frapper l\'air — et l\'air frappe en retour.',
    lore: 'Des concentrations naturelles d\'énergie éolienne, plus vieilles que Sylvael elle-même. Elles habitaient les Peaks comme des présences étranges et neutres — les bergers d\'altitude leur laissaient des rubans accrochés aux rochers, par superstition ou par politesse. Elles n\'avaient jamais rien voulu. C\'est ce que la malédiction leur a donné de pire : un but. Le but est la violence.',
    drops: [
      { itemId: 'cloudweave_silk', dropRatePct: 55, isHidden: false },
      { itemId: 'zephyr_feather', dropRatePct: 30, isHidden: false },
      { itemId: 'wraith_amulet', dropRatePct: 1.2, isHidden: false },
      { itemId: 'echo_blade', dropRatePct: 0.2, isHidden: false },
    ],
  },
  {
    enemyId: 'cyclone_sprite',
    name: 'Esprit Cyclone',
    habitat: 'Vallées ventées, Zephyr Peaks',
    shortDesc: 'Un nœud de vent condensé en une sphère pâle. Il tourne sur lui-même, trop vite pour qu\'on lise sa trajectoire.',
    lore: 'Sylvael a créé ces esprits pour porter le pollen et les graines à travers les montagnes — c\'est grâce à eux que des fleurs poussaient sur des îles flottantes où aucune abeille ne montait jamais. Chaque printemps des Peaks était leur œuvre. Sans direction, ils ne portent plus rien. Ils tournent. C\'est tout ce qui reste du printemps.',
    drops: [
      { itemId: 'zephyr_feather', dropRatePct: 70, isHidden: false },
      { itemId: 'minor_mana_potion', dropRatePct: 15, isHidden: false },
    ],
  },
  {
    enemyId: 'sky_titan',
    name: 'Titan du Ciel',
    habitat: 'Hauteurs des îles flottantes, Zephyr Peaks (élite)',
    shortDesc: 'Un ancien géant ailé, plus pâle que les nuages qu\'il arpente. Il vous ignore — jusqu\'à ce qu\'il ne puisse plus.',
    lore: 'Les titans du ciel précèdent Sylvael. Quand elle est arrivée, ils ne se sont pas battus : ils lui ont fait de la place, silencieusement, comme on s\'écarte pour laisser passer quelque chose de plus beau que soi. Elle a rempli cet espace de temples et de vent chantant pendant mille ans. L\'espace qu\'ils ont cédé est maintenant rempli de tempête, et ils l\'arpentent, perdus, trop grands pour se cacher et trop vieux pour partir.',
    drops: [
      { itemId: 'stormstone', dropRatePct: 80, isHidden: false },
      { itemId: 'cloudweave_silk', dropRatePct: 70, isHidden: false },
      { itemId: 'sky_titan_bow', dropRatePct: 7, isHidden: false },
      { itemId: 'air_walker_boots', dropRatePct: 4, isHidden: false },
      { itemId: 'echo_blade', dropRatePct: 0.3, isHidden: false },
    ],
  },
  {
    enemyId: 'storm_caller',
    name: 'Appeleur d\'Orages',
    habitat: 'Ruines des temples, Zephyr Peaks',
    shortDesc: 'Une petite silhouette cornue sous une capuche de vent, immobile dans la tempête. Ses murmures tissent de nouveaux esprits à partir de rien.',
    lore: 'Les prêtres de Sylvael ne sont pas morts quand la tempête a pris les Peaks. Ils sont devenus la tempête — une distinction qui n\'a d\'importance que pour eux. Ce que vous voyez sont les restes de leurs rituels : des gestes liturgiques répétés sans fin, sans fidèles, sans déesse, tissant des créatures que personne n\'a demandées. La prière continue. Il n\'y a plus personne à l\'autre bout.',
    drops: [
      { itemId: 'cloudweave_silk', dropRatePct: 60, isHidden: false },
      { itemId: 'stormstone', dropRatePct: 45, isHidden: false },
      { itemId: 'minor_mana_potion', dropRatePct: 15, isHidden: false },
    ],
  },
  {
    enemyId: 'cloudpiercer',
    name: 'Percenuage',
    habitat: 'Crêtes exposées, Zephyr Peaks',
    shortDesc: 'Un petit être encapuchonné dont l\'unique corne condense une lance d\'air — tirée à des distances invraisemblables avant qu\'il ne disparaisse dans les nuages.',
    lore: 'Certaines choses des Zephyr Peaks ont évolué pour être invisibles de loin. Le percenuage est l\'une d\'elles — même Sylvael, dit-on, les comptait mal. La première fois que vous en voyez un, il vous a déjà vu. La malédiction n\'a rien eu besoin d\'ajouter à cette créature. Elle a juste retiré ce qui lui donnait une raison de ne pas tirer.',
    drops: [
      { itemId: 'zephyr_feather', dropRatePct: 70, isHidden: false },
      { itemId: 'stormstone', dropRatePct: 30, isHidden: false },
      { itemId: 'cloudweave_silk', dropRatePct: 20, isHidden: false },
    ],
  },
  {
    enemyId: 'sylvael_boss',
    name: 'Sylvael la Tempête',
    habitat: 'Œil de l\'ouragan, Zephyr Peaks (divinité)',
    shortDesc: 'Ce qui reste de la déesse-phénix du vent — un visage cornu et pâle porté par un ouragan sans fin.',
    lore: 'Sylvael dansait. C\'est le mot que tous les récits emploient — pas "volait", pas "régnait" : dansait. Les vents des Peaks étaient sa chorégraphie, et mille ans de voyageurs ont gravi les montagnes juste pour la voir passer. Sa beauté est partie. Ce qui reste est le mouvement — pur, incontrôlé, dévastateur — et un visage que la malédiction donne à tous ses dieux. On ne raisonne pas avec une tempête. On ne console pas une danseuse qui ne peut plus s\'arrêter. On l\'arrête.',
    drops: [
      { itemId: 'sylvael_plume', dropRatePct: 100, isHidden: false },
      { itemId: 'zephyr_feather', dropRatePct: 100, isHidden: false },
      { itemId: 'phoenix_bow', dropRatePct: 20, isHidden: false },
      { itemId: 'tempest_cloak', dropRatePct: 12, isHidden: false },
      { itemId: 'ring_of_the_wind', dropRatePct: 4, isHidden: false },
      { itemId: 'echo_blade', dropRatePct: 0.5, isHidden: false },
      { itemId: 'hidden_fate_amulet', dropRatePct: 0.07, isHidden: true },
    ],
  },

  // ── ABYSSMAR (Eau) ───────────────────────────────────────────

  {
    enemyId: 'tide_crawler',
    name: 'Rampeur des Marées',
    habitat: 'Côtes submergées, Abyssmar',
    shortDesc: 'Une petite masse gélatineuse aux yeux jaunes fixes, gonflée par les marées corrompues. Immobile comme une flaque, jusqu\'à ce qu\'elle ne le soit plus.',
    lore: 'La côte en comptait des milliers avant le déluge — une nuisance, au pire. Les enfants de Saltmourn les attrapaient dans des seaux pour les regarder luire, et les pêcheurs les rejetaient à l\'eau sans y penser. Ils ont maintenant la taille de tonneaux et chassent activement. Les enfants qui les attrapaient ont grandi derrière des palissades, et certains reconnaissent, chez les plus vieux, les yeux jaunes qu\'ils avaient regardés luire dans leurs seaux.',
    drops: [
      { itemId: 'deep_coral', dropRatePct: 55, isHidden: false },
      { itemId: 'sea_glass', dropRatePct: 65, isHidden: false },
      { itemId: 'tidal_shell_armor', dropRatePct: 2, isHidden: false },
    ],
  },
  {
    enemyId: 'sea_wraith',
    name: 'Spectre des Mers',
    habitat: 'Ruines immergées, Abyssmar',
    shortDesc: 'La silhouette spectrale d\'un marin noyé, liée aux ruines. Elle garde toujours l\'eau entre elle et vous.',
    lore: 'Quand la mer est montée, tout le monde n\'a pas pu fuir. Leurs esprits sont restés dans les rues noyées, entre les maisons où ils ont vécu. Ils ne se souviennent pas de qui ils étaient — ni nom, ni visage, ni famille. Une seule chose leur reste : l\'eau les a pris. C\'est devenu toute leur identité, et ils la partagent avec quiconque approche.',
    drops: [
      { itemId: 'drowned_relic', dropRatePct: 50, isHidden: false },
      { itemId: 'sea_glass', dropRatePct: 45, isHidden: false },
      { itemId: 'sailor_ghost_ring', dropRatePct: 1.5, isHidden: false },
    ],
  },
  {
    enemyId: 'coral_golem',
    name: 'Golem de Corail',
    habitat: 'Catacombes de corail, Abyssmar',
    shortDesc: 'Un colosse de corail vivant, rose vif dans les eaux éteintes — la dernière couleur d\'Abyssmar. Il patrouille les récifs comme une frontière.',
    lore: 'Thalymor a fait pousser ces coraux sur des siècles pour protéger les fonds marins — un rempart vivant entre les tempêtes du large et les eaux calmes où tout le reste pouvait grandir. L\'instinct de protection a survécu à la malédiction. C\'est le discernement qui est mort. Tout est désormais un intrus : les poissons, les épaves, vous. Il est resté rose. C\'est la seule chose qui n\'a pas déteint.',
    drops: [
      { itemId: 'deep_coral', dropRatePct: 80, isHidden: false },
      { itemId: 'coral_chest', dropRatePct: 4.5, isHidden: false },
    ],
  },
  {
    enemyId: 'depth_serpent',
    name: 'Rôdeur des Profondeurs',
    habitat: 'Fosses abyssales, Abyssmar',
    shortDesc: 'Une créature accroupie des grandes fosses, une lame courbe de corail noir au poing. Plus rapide qu\'elle n\'en a l\'air — beaucoup plus.',
    lore: 'Les fosses profondes ont toujours été habitées. Thalymor gardait leurs occupants confinés aux abysses — une courtoisie envers les habitants de la surface, jamais formulée, jamais remerciée, maintenue pendant des siècles sans qu\'on sache même qu\'elle existait. La courtoisie a expiré avec la malédiction. Ce qui monte des fosses aujourd\'hui vous donne une idée de tout ce dont le dieu vous protégeait sans le dire.',
    drops: [
      { itemId: 'thalymor_scale', dropRatePct: 15, isHidden: false },
      { itemId: 'deep_coral', dropRatePct: 60, isHidden: false },
      { itemId: 'depth_serpent_fang_dagger', dropRatePct: 2.2, isHidden: false },
    ],
  },
  {
    enemyId: 'tide_shaper',
    name: 'Façonneur des Marées',
    habitat: 'Eaux noires, Abyssmar',
    shortDesc: 'Une sphère d\'eau profonde condensée, parcourue de pulsations bioluminescentes. Ses motifs lumineux appellent d\'autres créatures des eaux sombres.',
    lore: 'Avant le déluge, ces créatures vivaient dans les fosses les plus profondes, là où dérivaient les rêves de Thalymor. C\'est ainsi que les prêtres le décrivaient : le dieu dormait rarement, mais quand il rêvait, ses rêves coulaient vers le fond, et quelque chose devait bien s\'en nourrir. Les rêves ont tourné à l\'aigre. Les créatures qui s\'en nourrissaient aussi. Leurs pulsations lumineuses reproduisent encore les motifs des rêves — quiconque les regarde trop longtemps dit y voir des villes intactes.',
    drops: [
      { itemId: 'deep_coral', dropRatePct: 60, isHidden: false },
      { itemId: 'sea_glass', dropRatePct: 50, isHidden: false },
      { itemId: 'minor_mana_potion', dropRatePct: 12, isHidden: false },
    ],
  },
  {
    enemyId: 'abyssal_shade',
    name: 'Ombre Abyssale',
    habitat: 'Rues noyées, Abyssmar',
    shortDesc: 'Le contour d\'une personne, dessiné en pression d\'eau et en chagrin, une gaffe de pêcheur rouillée à la main. Elle vous a choisi. Elle ne s\'arrêtera pas.',
    lore: 'Tous les fantômes d\'Abyssmar n\'étaient pas des marins. Certains étaient juste des gens qui vivaient près de l\'eau et n\'ont jamais imaginé qu\'elle monterait. Certaines ombres serrent encore un outil courbe — une gaffe, une serpe à goémon. Des vies interrompues en plein geste. L\'ombre qui vous poursuit ne veut probablement pas vous tuer. Elle veut que quelqu\'un reste. C\'est la même chose, à la fin.',
    drops: [
      { itemId: 'drowned_relic', dropRatePct: 65, isHidden: false },
      { itemId: 'sea_glass', dropRatePct: 35, isHidden: false },
      { itemId: 'minor_health_potion', dropRatePct: 8, isHidden: false },
    ],
  },
  {
    enemyId: 'drowned_knight',
    name: 'Chevalier Noyé',
    habitat: 'Remparts engloutis, Abyssmar (élite)',
    shortDesc: 'Un guerrier en armure mort en défendant Abyssmar quand la mer est montée. Il combat encore.',
    lore: 'Ils sont restés à leur poste quand le déluge est venu. L\'honneur, ou le refus d\'accepter la mort — de sous l\'eau, la différence ne se voit plus. Ils gardent les ruines de la ville qu\'ils ont échoué à sauver, patrouillant des remparts que plus rien ne menace, saluant des officiers qui ne sont plus là. Si vous les vainquez, certains s\'immobilisent une seconde avant de tomber — comme si on venait enfin de les relever de leur garde.',
    drops: [
      { itemId: 'drowned_relic', dropRatePct: 85, isHidden: false },
      { itemId: 'drowned_knight_sword', dropRatePct: 9, isHidden: false },
      { itemId: 'seaguard_armor', dropRatePct: 6, isHidden: false },
      { itemId: 'thalymor_scale', dropRatePct: 2, isHidden: false },
      { itemId: 'hidden_undying_plate', dropRatePct: 0.07, isHidden: true },
    ],
  },
  {
    enemyId: 'thalymor_boss',
    name: 'Thalymor le Déluge',
    habitat: 'Cité engloutie, Abyssmar (divinité)',
    shortDesc: 'L\'avatar corrompu du dieu-léviathan — un gardien cornu des ruines noyées, bouclier au bras, fléau frappant comme la marée.',
    lore: 'Thalymor était le plus patient des six. Ses marées étaient un calendrier : les pêcheurs réglaient leurs vies dessus, les navires partaient et revenaient sur sa parole. Il n\'a jamais été en retard. Pas une fois en mille ans. La patience est partie — c\'est la première chose que la malédiction lui a prise, comme si elle savait que c\'était tout ce qu\'il était. Elle laisse aux dieux-gardiens un bouclier et un fléau ; les siens sont faits de mer. Le combattre dans les ruines noyées, c\'est se battre dans son élément, contre quelque chose qui ne compte plus les heures.',
    drops: [
      { itemId: 'thalymor_scale', dropRatePct: 100, isHidden: false },
      { itemId: 'deep_coral', dropRatePct: 100, isHidden: false },
      { itemId: 'leviathan_staff', dropRatePct: 22, isHidden: false },
      { itemId: 'abyssal_chest', dropRatePct: 13, isHidden: false },
      { itemId: 'tidal_ring', dropRatePct: 4, isHidden: false },
    ],
  },

  // ── VOLTERRA (Foudre) ────────────────────────────────────────

  {
    enemyId: 'spark_imp',
    name: 'Diablotin d\'Étincelles',
    habitat: 'Ruelles en ruine, Volterra',
    shortDesc: 'Une petite créature crépitante d\'énergie incontrôlée. Seule, elle est agaçante. Elles ne sont jamais seules.',
    lore: 'Les premiers petits constructs électriques que les ingénieurs de Volkran ont bâtis — pour alimenter les lampes des maisons, chauffer l\'eau, faire tourner les ateliers. Chaque foyer de Volterra en avait un, avec un nom peint sur le flanc. La civilisation la plus avancée de Velmara tenait sur leurs petites épaules. Ils se déchargent maintenant au hasard, dans des maisons vides, sur des habitants qui ne sont plus là.',
    drops: [
      { itemId: 'storm_shard', dropRatePct: 65, isHidden: false },
      { itemId: 'charged_metal', dropRatePct: 40, isHidden: false },
      { itemId: 'minor_mana_potion', dropRatePct: 12, isHidden: false },
    ],
  },
  {
    enemyId: 'thunder_drake',
    name: 'Drake du Tonnerre',
    habitat: 'Tours d\'orage, Volterra',
    shortDesc: 'Un élémentaire ailé qui canalise la foudre par ses ailes. Il charge en longs arcs — un missile guidé avec des serres.',
    lore: 'Les drakes nichaient dans les tours d\'orage avant que les ingénieurs ne construisent par-dessus. On les a tolérés : ils absorbaient l\'excès d\'énergie du réseau, et un problème qui en résout un autre est un problème qu\'on garde. Ils ont vécu trois générations au sommet d\'une civilisation qui les considérait comme un composant utile. Le réseau est mort. Il n\'y a plus rien à tolérer, ni personne pour tolérer.',
    drops: [
      { itemId: 'thunder_rune', dropRatePct: 45, isHidden: false },
      { itemId: 'storm_shard', dropRatePct: 55, isHidden: false },
      { itemId: 'thunder_drake_fang', dropRatePct: 8, isHidden: false },
      { itemId: 'storm_sword', dropRatePct: 1.8, isHidden: false },
    ],
  },
  {
    enemyId: 'chain_revenant',
    name: 'Revenant Enchaîné',
    habitat: 'Nœuds du réseau, Volterra',
    shortDesc: 'Un esprit électrocuté dans le réseau, cloué à l\'endroit de sa mort, serrant un arc de foudre solidifiée comme une lame. Sa portée compense son immobilité — largement.',
    lore: 'Quand le réseau s\'est déstabilisé, des ouvriers sont morts dans la décharge. Ils réparaient — c\'est l\'ironie que la zone n\'a jamais digérée : ils sont morts en essayant de sauver la machine qui les a tués. Leurs esprits sont ancrés aux pylônes et aux bobines, incapables de s\'éloigner de plus de quelques mètres. Ils attaquent tout ce qui approche assez pour le leur rappeler.',
    drops: [
      { itemId: 'charged_metal', dropRatePct: 60, isHidden: false },
      { itemId: 'thunder_rune', dropRatePct: 35, isHidden: false },
      { itemId: 'revenant_ring', dropRatePct: 1.5, isHidden: false },
    ],
  },
  {
    enemyId: 'volt_hound',
    name: 'Escarmoucheur Voltaïque',
    habitat: 'Plaines électrifiées, Volterra',
    shortDesc: 'Un pillard voûté drapé de toile isolante volée, la charge plein les poings. Le plus rapide de Volterra — et jamais seul.',
    lore: 'Ils vivaient en marge du réseau bien avant la chute — des pillards encapuchonnés qui dépouillaient les relais et s\'enveloppaient de toile isolante pour marcher entre les arcs. Les ingénieurs avaient des protocoles entiers pour protéger les lignes contre eux. Les protocoles supposaient qu\'ils avaient peur de quelque chose. Cette hypothèse ne tient plus.',
    drops: [
      { itemId: 'storm_shard', dropRatePct: 60, isHidden: false },
      { itemId: 'volt_hound_pelt', dropRatePct: 25, isHidden: false },
      { itemId: 'minor_health_potion', dropRatePct: 10, isHidden: false },
    ],
  },
  {
    enemyId: 'arc_node',
    name: 'Nœud d\'Arc',
    habitat: 'Lignes du réseau, Volterra',
    shortDesc: 'Une sphère de foudre contenue qui dérive le long des lignes du réseau, en routes programmées. Ne coupez pas sa route.',
    lore: 'Les ingénieurs de Volkran les ont construits pour entretenir le réseau, et ils l\'entretiennent encore — c\'est là tout le problème. Leurs routes programmées n\'ont pas changé d\'un mètre en trente ans. L\'entretien, dans le contexte actuel, consiste à détruire tout ce qui touche les lignes. Le réseau qu\'ils protègent n\'alimente plus rien. Aucune de leurs directives ne couvre ce cas.',
    drops: [
      { itemId: 'charged_metal', dropRatePct: 70, isHidden: false },
      { itemId: 'storm_shard', dropRatePct: 45, isHidden: false },
      { itemId: 'minor_mana_potion', dropRatePct: 10, isHidden: false },
    ],
  },
  {
    enemyId: 'grid_architect',
    name: 'Architecte du Réseau',
    habitat: 'Ateliers effondrés, Volterra',
    shortDesc: 'Une silhouette pâle et hagarde qui dérive dans les ateliers effondrés, assemblant de nouveaux nœuds d\'arc avec des gestes lents, appris par cœur.',
    lore: 'Le dernier ingénieur de Volterra a construit cette chose pour continuer son œuvre après sa mort. Il y a mis tout ce qu\'il savait : ses gestes, ses plans, sa précision — et sans le vouloir, sa silhouette. La chose l\'ignore. Il n\'avait pas envisagé une seule possibilité : que son œuvre ait déjà tout détruit. L\'architecte assemble donc, inlassablement, des mainteneurs pour un réseau qui a tué la ville qu\'il alimentait. C\'est le monument le plus honnête de Volterra : un homme brillant qui n\'a pas su s\'arrêter, réduit à un fantôme de gestes qui ne le peut pas.',
    drops: [
      { itemId: 'charged_metal', dropRatePct: 75, isHidden: false },
      { itemId: 'thunder_rune', dropRatePct: 50, isHidden: false },
      { itemId: 'storm_shard', dropRatePct: 60, isHidden: false },
    ],
  },
  {
    enemyId: 'storm_herald',
    name: 'Héraut de la Tempête',
    habitat: 'Sanctum du réseau, Volterra (élite)',
    shortDesc: 'Un chevalier de foudre pure, épée et bouclier parcourus d\'arcs, créé par les derniers ingénieurs. Il exécute encore son dernier ordre.',
    lore: 'Avant de mourir, les derniers ingénieurs de Volterra ont tenté de créer des porteurs artificiels du pouvoir de Volkran — si le dieu était devenu fou, peut-être qu\'une copie saine pourrait le remplacer. Ils ont réussi. C\'est la partie tragique : les hérauts fonctionnent parfaitement. Ils exécutent leur dernier ordre reçu — éliminer tous les intrus — avec la fidélité exacte pour laquelle ils ont été conçus. Personne n\'a survécu assez longtemps pour leur en donner un autre.',
    drops: [
      { itemId: 'volkran_coil', dropRatePct: 60, isHidden: false },
      { itemId: 'thunder_rune', dropRatePct: 80, isHidden: false },
      { itemId: 'herald_staff', dropRatePct: 7, isHidden: false },
      { itemId: 'storm_herald_plate', dropRatePct: 4.5, isHidden: false },
    ],
  },
  {
    enemyId: 'volkran_boss',
    name: 'Volkran le Maître des Orages',
    habitat: 'Sommet du réseau, Volterra (divinité)',
    shortDesc: 'Ce qui reste du colosse divin de la foudre — un visage cornu d\'orage, la précision effondrée en dévastation omnidirectionnelle.',
    lore: 'Les ingénieurs l\'avaient mesuré. Ils connaissaient ses motifs à la microseconde près — toute leur civilisation était bâtie autour de ces motifs. Volkran aimait ça, dit-on : être compris. Être utile avec exactitude. Leurs derniers instruments ont enregistré le colosse en train de perdre sa forme — s\'effondrant vers quelque chose de cornu, le même visage que portent tous les dieux déchus. Personne n\'est resté pour lire les relevés. C\'est peut-être ça qui hurle, dans le tonnerre.',
    drops: [
      { itemId: 'volkran_coil', dropRatePct: 100, isHidden: false },
      { itemId: 'thunder_rune', dropRatePct: 100, isHidden: false },
      { itemId: 'volkran_hammer', dropRatePct: 23, isHidden: false },
      { itemId: 'storm_plate', dropRatePct: 13, isHidden: false },
      { itemId: 'eye_of_the_storm_ring', dropRatePct: 4, isHidden: false },
      { itemId: 'hidden_temporal_blade', dropRatePct: 0.07, isHidden: true },
    ],
  },

  // ── GLACIEM (Glace) ──────────────────────────────────────────

  {
    enemyId: 'frost_wolf',
    name: 'Harfang du Givre',
    habitat: 'Ciel du blizzard, Glaciem',
    shortDesc: 'Un rapace cornu au plumage blanc-bleu qui chasse dans la tourmente. Vous ne l\'entendez pas venir. C\'est voulu.',
    lore: 'Les harfangs de Glaciem chassaient au-dessus de la toundra dans un silence parfait, et les voyageurs les tenaient pour un bon présage : un harfang en vol voulait dire que la tempête était passée. La tempête ne passe plus. Ils volent quand même — et ce qu\'ils prenaient à la toundra, ils le prennent désormais à tout ce qui marche.',
    drops: [
      { itemId: 'glaciem_ice_shard', dropRatePct: 60, isHidden: false },
      { itemId: 'frozen_essence', dropRatePct: 35, isHidden: false },
      { itemId: 'frost_wolf_pelt', dropRatePct: 20, isHidden: false },
    ],
  },
  {
    enemyId: 'ice_golem',
    name: 'Golem de Glace',
    habitat: 'Entrées des cavernes de glace, Glaciem',
    shortDesc: 'Un chevalier taillé d\'un seul bloc de glace glaciaire, épée et bouclier compris. Il ne distingue plus les amis des ennemis. Il n\'essaie plus.',
    lore: 'Crysthea les a bâtis pour garder les entrées de ses cavernes de glace. Ses archives étaient trop précieuses pour rester sans surveillance — des siècles de souvenirs préservés, les visages des morts, les voix des langues éteintes. Les golems gardent toujours. Simplement, ils gardent tout, contre tout le monde, y compris contre ceux qui viendraient sauver ce qu\'il y a derrière les portes.',
    drops: [
      { itemId: 'glaciem_ice_shard', dropRatePct: 80, isHidden: false },
      { itemId: 'ancient_frost_rune', dropRatePct: 40, isHidden: false },
      { itemId: 'glacial_shield', dropRatePct: 4, isHidden: false },
    ],
  },
  {
    enemyId: 'blizzard_wraith',
    name: 'Spectre du Blizzard',
    habitat: 'Cœur de la tempête de neige, Glaciem',
    shortDesc: 'Un esprit condensé du blizzard, presque invisible dans la tourmente. Sa magie frappe avant qu\'on le repère.',
    lore: 'Ce ne sont pas des fantômes de morts. Ce sont des manifestations du blizzard lui-même — la magie de préservation de Crysthea, condensée en une forme agressive. C\'est peut-être le plus troublant de Glaciem : ces créatures sont faites de la même magie qui gardait les souvenirs des défunts pour leurs familles. Le geste le plus tendre de la déesse, aiguisé en arme. La malédiction n\'invente rien. Elle retourne.',
    drops: [
      { itemId: 'frozen_essence', dropRatePct: 65, isHidden: false },
      { itemId: 'glaciem_ice_shard', dropRatePct: 40, isHidden: false },
      { itemId: 'wraith_ice_amulet', dropRatePct: 1.4, isHidden: false },
    ],
  },
  {
    enemyId: 'permafrost_titan',
    name: 'Titan du Pergélisol',
    habitat: 'Plaines de permafrost, Glaciem (élite)',
    shortDesc: 'Un géant du premier âge, dégelé par la rage du blizzard. Trois secondes d\'immobilité, puis une charge que rien n\'arrête.',
    lore: 'La glace de Crysthea préservait par accident autant que par intention. Les titans du premier âge de Glaciem ont été pris dans la grande tempête d\'il y a quatre cents ans — figés en pleine course, en plein cri, en plein geste. La déesse les a laissés dans la glace : c\'était plus doux que de les réveiller dans un monde qui avait continué sans eux. Le blizzard les a dégelés sans lui demander. Ils finissent la course commencée il y a quatre siècles, et rien de ce qu\'ils connaissaient n\'existe plus à l\'arrivée.',
    drops: [
      { itemId: 'ancient_frost_rune', dropRatePct: 75, isHidden: false },
      { itemId: 'frozen_essence', dropRatePct: 65, isHidden: false },
      { itemId: 'titan_greatsword', dropRatePct: 6, isHidden: false },
      { itemId: 'permafrost_armor', dropRatePct: 4, isHidden: false },
    ],
  },
  {
    enemyId: 'crystal_dragon',
    name: 'Feu Follet de Cristal',
    habitat: 'Montagnes profondes, Glaciem (élite)',
    shortDesc: 'Une simple sphère de lumière cristalline dérivant dans la glace profonde. Petite, silencieuse, plus vieille que les dieux. Ne la sous-estimez qu\'une fois.',
    lore: 'Personne n\'a fait ces lueurs. Elles sont vieilles — plus vieilles que Crysthea. Elles se sont condensées naturellement dans la glace des montagnes profondes, sur des millénaires, molécule par molécule, jusqu\'au jour où la glace s\'est mise à rêver de lumière. Quand Crysthea est arrivée, elles étaient déjà là. Elle les a laissées tranquilles. Une déesse qui savait tout préserver a jugé qu\'elles n\'avaient pas besoin d\'elle. C\'était sage. Ça l\'est toujours — mais vous n\'avez plus le choix.',
    drops: [
      { itemId: 'crysthea_splinter', dropRatePct: 25, isHidden: false },
      { itemId: 'ancient_frost_rune', dropRatePct: 80, isHidden: false },
      { itemId: 'crystal_dragon_fang_staff', dropRatePct: 8, isHidden: false },
      { itemId: 'ice_dragon_scale_chest', dropRatePct: 5, isHidden: false },
      { itemId: 'frozen_heart_amulet', dropRatePct: 1.2, isHidden: false },
    ],
  },
  {
    enemyId: 'glacial_shaper',
    name: 'Façonneur Glacial',
    habitat: 'Charniers gelés, Glaciem',
    shortDesc: 'Une silhouette voûtée et encapuchonnée de glace vivante, dont les mains traînent un feu bleu. Elle rappelle les morts du grand gel hors de la glace qui les gardait.',
    lore: 'Crysthea préservait les morts — c\'était son office le plus sacré, celui pour lequel les familles traversaient la toundra. Le façonneur n\'existait pas avant la malédiction : c\'est un effet secondaire de la magie de préservation appliquée sans limite ni jugement. Il ne comprend pas la différence entre préserver les morts et les réveiller. Personne ne la lui a apprise, et la seule qui aurait pu est en train de geler le monde.',
    drops: [
      { itemId: 'frozen_essence', dropRatePct: 70, isHidden: false },
      { itemId: 'ancient_frost_rune', dropRatePct: 45, isHidden: false },
      { itemId: 'minor_mana_potion', dropRatePct: 15, isHidden: false },
    ],
  },
  {
    enemyId: 'hoarfrost_stalker',
    name: 'Traqueur du Givre Blanc',
    habitat: 'Anciennes lignes de piégeage, Glaciem',
    shortDesc: 'Un chasseur de la toundra pris par le grand gel — hachette au poing, fourrures sur le dos, deux fois plus létal quand il se décide enfin.',
    lore: 'Les chasseurs de Glaciem marchaient les lignes de piégeage entre Frostveil et les archives, une hachette à la ceinture et des fourrures plein le dos. Le blizzard les a pris en pleine marche, et la glace de Crysthea a fait ce qu\'elle fait toujours : elle a préservé. La démarche, la hachette, la patience du métier — tout est intact. Il vérifie encore ses pièges. Quand il charge, il n\'y a pas de rage dans ses yeux. Seulement un geste de chasseur, préservé jusqu\'au bout.',
    drops: [
      { itemId: 'glaciem_ice_shard', dropRatePct: 70, isHidden: false },
      { itemId: 'frozen_essence', dropRatePct: 55, isHidden: false },
      { itemId: 'frost_wolf_pelt', dropRatePct: 35, isHidden: false },
      { itemId: 'ancient_frost_rune', dropRatePct: 20, isHidden: false },
      { itemId: 'hidden_soul_bow', dropRatePct: 0.07, isHidden: true },
    ],
  },
  {
    enemyId: 'crysthea_boss',
    name: 'Crysthea la Gelée',
    habitat: 'Archives de glace, Glaciem (divinité)',
    shortDesc: 'L\'avatar corrompu de la déesse de la préservation — une gardienne cornue au bouclier de glace, dont le fléau gèle ce qu\'il touche.',
    lore: 'Crysthea est peut-être l\'être le plus ancien de Velmara. Elle se souvient de tout — c\'était son don et son fardeau : les visages des morts, les langues éteintes, les promesses que les autres avaient oubliées. Dans son état actuel, elle ne se souvient pas que le héros essaie de sauver le monde. Elle se souvient d\'une seule chose : le monde doit être préservé. La malédiction laisse aux dieux-gardiens un bouclier et un fléau ; les siens sont de glace, et elle s\'en sert pour geler tout, tout le monde, pour toujours. C\'est encore de l\'amour. C\'est ça, le pire.',
    drops: [
      { itemId: 'crysthea_splinter', dropRatePct: 100, isHidden: false },
      { itemId: 'ancient_frost_rune', dropRatePct: 100, isHidden: false },
      { itemId: 'memory_staff', dropRatePct: 24, isHidden: false },
      { itemId: 'glaciem_guardian_chest', dropRatePct: 14, isHidden: false },
      { itemId: 'ring_of_preservation', dropRatePct: 4, isHidden: false },
      { itemId: 'hidden_eternity_ring', dropRatePct: 0.07, isHidden: true },
    ],
  },

  // ── MALACHAR'S SPIRE (Sombre) ────────────────────────────────

  {
    enemyId: 'dark_revenant',
    name: 'Revenant des Ombres',
    habitat: 'Couloirs bas de la Spire, Malachar\'s Spire',
    shortDesc: 'Un esprit encapuchonné à l\'œil rouge, entièrement consumé par la magie sombre. Le tireur le plus mobile que vous croiserez.',
    lore: 'Chaque personne que Malachar a lésée est ici. La magie sombre attire le grief comme la lumière attire les papillons — et trente ans de préparation lèsent beaucoup de monde : des fournisseurs ruinés, des curieux disparus, des proches tenus à distance jusqu\'à ce qu\'ils cessent de venir. La Spire en est saturée. Ils ne servent pas Malachar. Ils sont juste restés collés à ce qui les a brisés.',
    drops: [
      { itemId: 'dark_essence', dropRatePct: 70, isHidden: false },
      { itemId: 'void_shard', dropRatePct: 30, isHidden: false },
      { itemId: 'shadow_ring', dropRatePct: 2, isHidden: false },
    ],
  },
  {
    enemyId: 'shadow_construct',
    name: 'Construit d\'Ombre',
    habitat: 'Corridors de la Spire, Malachar\'s Spire',
    shortDesc: 'Une silhouette décharnée d\'ombre coulée, une longue griffe au bout du bras, bâtie d\'énergie sombre et de pouvoir élémentaire volé. L\'architecture elle-même vous chasse.',
    lore: 'Malachar a passé trente ans à se préparer. Ces constructs font partie de la préparation — toute sa recherche ne portait pas sur la malédiction. Il savait que quelqu\'un finirait par venir. Pas qui, pas quand, mais quelqu\'un : un homme qui passe trente ans à planifier la fin des dieux planifie aussi la visite de leurs défenseurs. Chaque couloir de la Spire est une phrase de cette préparation. Vous êtes en train de la lire.',
    drops: [
      { itemId: 'corrupted_rune', dropRatePct: 60, isHidden: false },
      { itemId: 'void_shard', dropRatePct: 50, isHidden: false },
      { itemId: 'construct_core', dropRatePct: 15, isHidden: false },
      { itemId: 'malachar_blade', dropRatePct: 2.5, isHidden: false },
    ],
  },
  {
    enemyId: 'void_weaver',
    name: 'Tisserand du Vide',
    habitat: 'Salles d\'étude abandonnées, Malachar\'s Spire',
    shortDesc: 'Une petite créature aux oreilles pointues qui trottine dans les salles d\'étude, tirant des fils d\'obscurité des murs saturés de chagrin pour en nouer de nouveaux revenants.',
    lore: 'Il y avait un érudit dans la maisonnée de Malachar, qui a aidé aux premières recherches. Des années de travail côte à côte, de découvertes partagées, de thé refroidi sur les manuscrits. Quand l\'érudit a compris à quoi servait la recherche, il a essayé de partir. Voilà ce qu\'il est devenu : quelque chose de petit, qui fut quelqu\'un. Le tisserand noue des revenants avec les gestes précis d\'un copiste — la même patience, les mêmes mains devenues pattes. Malachar ne passe jamais par ces salles. On ignore si c\'est du remords ou de l\'indifférence, et on ne sait pas ce qui serait pire.',
    drops: [
      { itemId: 'dark_essence', dropRatePct: 75, isHidden: false },
      { itemId: 'corrupted_rune', dropRatePct: 55, isHidden: false },
      { itemId: 'void_shard', dropRatePct: 40, isHidden: false },
    ],
  },
  {
    enemyId: 'void_stalker',
    name: 'Traqueur du Vide',
    habitat: 'Recoins sans lumière, Malachar\'s Spire',
    shortDesc: 'Une petite masse ronde d\'absence, deux cornes, deux yeux jaunes. Elle attend dans les angles morts et charge depuis l\'immobilité absolue.',
    lore: 'La Spire a été conçue avec les ombres en tête — Malachar savait ce que le noir peut cacher, et il a dessiné chaque couloir pour en avoir. Mais les traqueurs, il ne les a pas conçus. Ce sont les créatures que le noir a choisi d\'y mettre de lui-même, comme si l\'obscurité avait accepté l\'invitation puis amené ses propres invités. Même Malachar les évite. C\'est la seule chose de sa tour qu\'il n\'a pas voulue.',
    drops: [
      { itemId: 'void_shard', dropRatePct: 65, isHidden: false },
      { itemId: 'dark_essence', dropRatePct: 45, isHidden: false },
      { itemId: 'shadow_ring', dropRatePct: 2.5, isHidden: false },
    ],
  },
  {
    enemyId: 'void_sentinel',
    name: 'Sentinelle du Vide',
    habitat: 'Sanctum intérieur, Malachar\'s Spire (élite)',
    shortDesc: 'Un gardien d\'élite accroupi aux portes du sanctum, une lame courbe de vide au poing. Il ne recule jamais. Ce n\'est pas dans sa nature — littéralement.',
    lore: 'Malachar en a créé un pour chacune de ses trente années de préparation. Trente sentinelles, trente ans — l\'œuvre d\'une vie, rendue chair et fonction. On dit que chacune porte quelque chose de l\'année qui l\'a vue naître : la première est hésitante, presque prudente ; les dernières frappent sans le moindre doute. Les tuer, c\'est remonter sa vie à l\'envers. Quelque part vers la vingtième, on cesse de trouver l\'homme et on ne trouve plus que la décision.',
    drops: [
      { itemId: 'void_shard', dropRatePct: 85, isHidden: false },
      { itemId: 'dark_essence', dropRatePct: 80, isHidden: false },
      { itemId: 'sentinel_armor', dropRatePct: 7, isHidden: false },
      { itemId: 'sentinel_sword', dropRatePct: 5, isHidden: false },
      { itemId: 'ring_of_the_unbound', dropRatePct: 0.3, isHidden: false },
      { itemId: 'hidden_void_reaper', dropRatePct: 0.07, isHidden: true },
    ],
  },
  {
    enemyId: 'malachar_boss',
    name: 'Malachar le Déchaîné',
    habitat: 'Sommet de la Spire, Malachar\'s Spire',
    shortDesc: 'L\'érudit de Grievy Town qui a brisé le monde — portant désormais le visage cornu que sa malédiction a donné aux dieux.',
    lore: 'Malachar n\'est pas un monstre. C\'est un homme né à Grievy Town, qui a posé une question légitime — pourquoi les dieux gardent-ils le pouvoir pour eux ? — et qui a choisi un chemin il y a trente ans sans jamais en douter une seule fois. Au sommet de la Spire, il porte le même visage cornu que sa malédiction a donné aux dieux. Cette forme n\'a jamais appartenu ni à Pyrath, ni à Sylvael, ni à Volkran — elle appartenait à la malédiction, et la malédiction est venue chercher son auteur. Quand vous le tuerez, il ne s\'excusera pas. Mais il vous regardera vraiment — et ce sera peut-être la première fois en trente ans qu\'il regarde quelqu\'un.',
    drops: [
      { itemId: 'malachars_grimoire', dropRatePct: 100, isHidden: false },
      { itemId: 'void_shard', dropRatePct: 100, isHidden: false },
      { itemId: 'malachars_staff', dropRatePct: 50, isHidden: false },
      { itemId: 'unbound_robe', dropRatePct: 40, isHidden: false },
      { itemId: 'ring_of_the_unbound', dropRatePct: 15, isHidden: false },
      { itemId: 'hidden_world_eater_staff', dropRatePct: 0.07, isHidden: true },
    ],
  },

  // ── GRIEVY TOWN — MANNEQUINS DE KELVAR ───────────────────────
  // ⚠ DEV TOOL (LOOT_STAT_ROLLS.md §10) : visibles uniquement si
  // player.flags['dev_training_dummies'] === true. À retirer avant
  // tout milestone public. Ton des lore : Kelvar, laconique.

  {
    enemyId: 'training_dummy_straw',
    name: 'Mannequin de Kelvar',
    habitat: 'Cour de la caserne, Grievy Town',
    shortDesc: 'Paille, toile, et trente ans de coups encaissés sans se plaindre.',
    lore: 'Kelvar le répare lui-même, chaque hiver. « Un garde qui n\'entretient pas son mannequin n\'entretiendra pas un mur. » C\'est tout ce qu\'il dit à ce sujet.',
    drops: [
      { itemId: 'titan_greatsword', dropRatePct: 100, isHidden: false },
    ],
  },
  {
    enemyId: 'training_dummy_gilded',
    name: 'Mannequin Doré',
    habitat: 'Cour de la caserne, Grievy Town',
    shortDesc: 'Kelvar l\'a fait dorer le jour de sa promotion. Il le regrette.',
    lore: 'La dorure s\'écaille un peu plus à chaque coup. Kelvar n\'a jamais demandé à personne d\'arrêter.',
    drops: [
      { itemId: 'echo_blade', dropRatePct: 100, isHidden: false },
    ],
  },
  {
    enemyId: 'training_dummy_arsenal',
    name: 'Mannequin d\'Essai',
    habitat: 'Cour de la caserne, Grievy Town',
    shortDesc: 'Rend un exemplaire neuf de l\'arme que vous portez.',
    lore: 'Deux épées sorties de la même forge ne se valent jamais tout à fait. Kelvar le sait depuis qu\'il a survécu grâce à la meilleure des deux, un matin, sans savoir pourquoi.',
    // Drop dynamique (l'arme équipée) — aucune table figée à annoncer.
    drops: [],
  },
];

/** Bestiaire complet : entrées écrites à la main + les 139 créatures générées. */
export const ALL_BESTIARY: BestiaryEnemyData[] = [...BESTIARY_DATA, ...GENERATED_BESTIARY];

export function getBestiaryEntry(enemyId: string): BestiaryEnemyData | undefined {
  return ALL_BESTIARY.find(e => e.enemyId === enemyId);
}

/** IDs dans l'ordre canonique du bestiaire (même ordre que BESTIARY_DATA). */
export const BESTIARY_IDS: string[] = ALL_BESTIARY.map(e => e.enemyId);

/** Lookup rapide par enemyId — même données que BESTIARY_DATA. */
export const BESTIARY_RECORD: Record<string, BestiaryEnemyData> = Object.fromEntries(
  ALL_BESTIARY.map(e => [e.enemyId, e]),
);
