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
// Items hidden INVENTÉS ici (à créer dans items.ts, rareté HIDDEN) :
//   wyrm_fang_shard, pilgrims_last_prayer, heart_of_the_mountain,
//   sky_titans_oath, drowned_locket, tear_of_the_deep,
//   engineers_final_schematic, primordial_ice_core, scholars_torn_page
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
    name: 'Ember Wyrm',
    habitat: 'Rivières de lave, Ignis Reach',
    shortDesc: 'Un serpent de feu vivant qui glisse le long des coulées de lave. Sa morsure laisse des brûlures qui persistent des heures.',
    lore: 'Avant l\'Effondrement, les wyrms réchauffaient les sources sacrées de Pyrath — des créatures dociles que les pèlerins voyaient comme un bon présage. La corruption les a transformés en prédateurs aveugles, mais quelque chose dans leur manière de remonter les coulées à contre-courant suggère qu\'ils cherchent encore les sources. Elles n\'existent plus.',
    drops: [
      { itemId: 'ember_core', dropRatePct: 45, isHidden: false },
      { itemId: 'volcanic_ash', dropRatePct: 60, isHidden: false },
      { itemId: 'iron_sword', dropRatePct: 8, isHidden: false },
      { itemId: 'flame_ring', dropRatePct: 1.5, isHidden: false },
      { itemId: 'wyrm_fang_shard', dropRatePct: 1.5, isHidden: true },
    ],
  },
  {
    enemyId: 'lava_golem',
    name: 'Lava Golem',
    habitat: 'Coulées refroidies, Ignis Reach',
    shortDesc: 'Une masse de magma en refroidissement qui marche. Lent, immense, impossible à ignorer.',
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
    name: 'Cinder Sprite',
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
    name: 'Ash Revenant',
    habitat: 'Route des pèlerins, Ignis Reach',
    shortDesc: 'Le fantôme d\'un pèlerin mort dans les cendres. Il bombarde à distance, comme s\'il vous refusait le passage.',
    lore: 'Les sources sacrées guérissaient. Des milliers de pèlerins ont fait la route au fil des siècles — les malades, les mourants, ceux qui espéraient encore. Ceux que l\'éruption a pris n\'ont jamais fini le trajet. Les revenants refont le chemin du pèlerinage, nuit après nuit, dans le même ordre, aux mêmes étapes. Ils arrivent aux sources. Ils repartent. Ils recommencent.',
    drops: [
      { itemId: 'volcanic_ash', dropRatePct: 80, isHidden: false },
      { itemId: 'pilgrim_robe', dropRatePct: 4, isHidden: false },
      { itemId: 'fire_staff', dropRatePct: 1.2, isHidden: false },
      { itemId: 'pilgrims_last_prayer', dropRatePct: 1, isHidden: true },
    ],
  },
  {
    enemyId: 'magma_titan',
    name: 'Magma Titan',
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
    name: 'Ember Broodmother',
    habitat: 'Failles obscures, Ignis Reach',
    shortDesc: 'Une araignée de feu boursouflée qui pond des sacs de braises vivantes. Tuez-la avant que la nichée n\'éclose.',
    lore: 'Rien de tel n\'existait avant le Délitement. Le feu de Pyrath avait une qualité génératrice — il faisait naître, il réchauffait, il rendait la vie possible dans un lieu qui aurait dû la refuser. La malédiction a gardé la génération et jeté tout le reste. La broodmother est ce que la corruption invente quand on lui donne le pouvoir de créer sans la raison de créer.',
    drops: [
      { itemId: 'ember_core', dropRatePct: 55, isHidden: false },
      { itemId: 'volcanic_ash', dropRatePct: 65, isHidden: false },
      { itemId: 'minor_health_potion', dropRatePct: 10, isHidden: false },
    ],
  },
  {
    enemyId: 'scorch_sentinel',
    name: 'Scorch Sentinel',
    habitat: 'Sanctuaires en ruine, Ignis Reach',
    shortDesc: 'Un gardien de pierre animé par un feu divin résiduel. Il tourne autour des sanctuaires de Pyrath en cercles éternels.',
    lore: 'Les prêtres de Pyrath les ont placés là pour garder les sanctuaires. C\'était un poste d\'honneur : veiller sur ce que le dieu avait de plus précieux. Aucun nouvel ordre n\'est arrivé depuis trois cents ans. La malédiction n\'a rien eu à leur faire — elle a juste rendu leur consigne absolue. Les sanctuaires sont vides. Le cercle continue.',
    drops: [
      { itemId: 'obsidian_shard', dropRatePct: 60, isHidden: false },
      { itemId: 'ember_core', dropRatePct: 30, isHidden: false },
      { itemId: 'stone_shield_scroll', dropRatePct: 4, isHidden: false },
    ],
  },
  {
    enemyId: 'pyrath_boss',
    name: 'Pyrath the Unbound',
    habitat: 'Cœur du volcan, Ignis Reach (divinité)',
    shortDesc: 'Le dragon divin du feu. Sa puissance sans limite n\'a plus de direction — seulement de la destruction.',
    lore: 'Pyrath fut la première divinité à descendre sur Velmara. Il réchauffait les sources, guidait les pèlerins, laissait les enfants toucher ses écailles une fois l\'an. Il sera la première à mourir. Il ne reconnaît pas le héros. Il ne reconnaît personne — ni ses titans, ni ses prêtres, ni ses propres sanctuaires. Il ne fait que brûler. Ce que vous tuez dans le cratère n\'est pas un monstre. C\'est ce qui reste d\'une bonté qui n\'a plus de mémoire.',
    drops: [
      { itemId: 'pyrath_scale', dropRatePct: 100, isHidden: false },
      { itemId: 'ember_core', dropRatePct: 100, isHidden: false },
      { itemId: 'dragonfang_sword', dropRatePct: 25, isHidden: false },
      { itemId: 'pyrath_armor', dropRatePct: 15, isHidden: false },
      { itemId: 'eternal_flame_ring', dropRatePct: 4, isHidden: false },
      { itemId: 'pyrath_heart', dropRatePct: 1, isHidden: false },
      { itemId: 'hidden_first_blade', dropRatePct: 1, isHidden: true },
    ],
  },

  // ── TERRAVAST (Terre) ────────────────────────────────────────

  {
    enemyId: 'stone_crawler',
    name: 'Stone Crawler',
    habitat: 'Tunnels des canyons, Terravast',
    shortDesc: 'Un insecte cuirassé qui se confond avec la roche des canyons. Vous ne le voyez que quand il bouge.',
    lore: 'Les plus petits serviteurs de Gorvun. Ils entretenaient les tunnels, dégageaient les éboulis, gardaient les passages ouverts pour les mineurs et les voyageurs. C\'était un travail humble et ils le faisaient bien. Ils gardent toujours les tunnels — mais désormais, tout ce qui y entre est un intrus, y compris ceux pour qui les tunnels avaient été creusés.',
    drops: [
      { itemId: 'terravast_crystal', dropRatePct: 50, isHidden: false },
      { itemId: 'cave_moss', dropRatePct: 65, isHidden: false },
      { itemId: 'stone_shield_scroll', dropRatePct: 5, isHidden: false },
    ],
  },
  {
    enemyId: 'crystal_golem',
    name: 'Crystal Golem',
    habitat: 'Grottes de cristal, Terravast',
    shortDesc: 'Un golem né des formations cristallines. Certaines attaques magiques rebondissent sur ses facettes.',
    lore: 'Les grottes de cristal les ont fait pousser sur des siècles, et Gorvun a façonné chacun d\'eux à la main — un dieu de la permanence qui prenait le temps de sculpter des gardiens un par un. Chaque facette était polie pour renvoyer la lumière au cœur de la grotte. Elles renvoient toujours quelque chose. Sous la malédiction, ils ne protègent plus les grottes. Ils ne protègent plus qu\'eux-mêmes, et ils le font parfaitement.',
    drops: [
      { itemId: 'terravast_crystal', dropRatePct: 75, isHidden: false },
      { itemId: 'ancient_stone_rune', dropRatePct: 30, isHidden: false },
      { itemId: 'crystal_chest', dropRatePct: 5, isHidden: false },
      { itemId: 'hidden_mirror_helm', dropRatePct: 0.5, isHidden: true },
    ],
  },
  {
    enemyId: 'cave_lurker',
    name: 'Cave Lurker',
    habitat: 'Plafonds des cavernes, Terravast',
    shortDesc: 'Un prédateur d\'embuscade qui tombe des plafonds. Vous l\'entendez atterrir. C\'est déjà trop tard.',
    lore: 'Des prédateurs naturels de l\'écosystème des cavernes — ils existaient avant Gorvun, avant les mineurs, avant tout. Ils fuyaient la lumière : une torche suffisait à sécuriser un campement. La malédiction ne les a pas transformés. Elle leur a juste retiré la peur. C\'est peut-être la chose la plus inquiétante qu\'elle ait faite dans ces grottes.',
    drops: [
      { itemId: 'cave_moss', dropRatePct: 70, isHidden: false },
      { itemId: 'terravast_crystal', dropRatePct: 25, isHidden: false },
      { itemId: 'dagger_of_shadow', dropRatePct: 0.8, isHidden: false },
    ],
  },
  {
    enemyId: 'terravast_serpent',
    name: 'Terravast Serpent',
    habitat: 'Fonds des canyons, Terravast',
    shortDesc: 'Un serpent massif aux écailles de pierre. Il s\'enroule, attend, puis se détend comme un ressort.',
    lore: 'Ils vivaient dans ces canyons bien avant l\'arrivée de Gorvun. Le dieu les trouvait amusants — ces créatures de pierre qui l\'avaient précédé, qui rampaient sur son domaine sans lui demander la permission. Il les a laissés rester. C\'est peut-être le seul acte de tolérance gratuite qu\'on connaisse de lui. Ils rampent toujours sur son domaine. Il n\'y a plus personne pour trouver ça amusant.',
    drops: [
      { itemId: 'ancient_stone_rune', dropRatePct: 40, isHidden: false },
      { itemId: 'terravast_crystal', dropRatePct: 55, isHidden: false },
      { itemId: 'serpent_scale_boots', dropRatePct: 2.5, isHidden: false },
    ],
  },
  {
    enemyId: 'rune_shard_ghost',
    name: 'Rune Shard Ghost',
    habitat: 'Parois gravées, Terravast',
    shortDesc: 'Un esprit translucide né des runes anciennes brisées. Il projette des éclats de cristal à grande distance.',
    lore: 'Les runes gravées dans les parois de Terravast étaient le langage de Gorvun — chaque mur était une phrase, chaque canyon un chapitre. Quand la malédiction a fissuré la pierre, elle a fissuré les mots avec. Ces fantômes sont des phrases interrompues qui ont reçu du chagrin et du mouvement. Ils ne se souviennent pas de ce qu\'ils disaient. Seulement qu\'ils sont cassés.',
    drops: [
      { itemId: 'ancient_stone_rune', dropRatePct: 55, isHidden: false },
      { itemId: 'terravast_crystal', dropRatePct: 40, isHidden: false },
      { itemId: 'minor_mana_potion', dropRatePct: 12, isHidden: false },
    ],
  },
  {
    enemyId: 'stone_hound',
    name: 'Stone Hound',
    habitat: 'Mines profondes, Terravast',
    shortDesc: 'Un quadrupède à la peau fusionnée de granit. Il vous a senti bien avant que vous ne le voyiez.',
    lore: 'Gorvun les gardait comme bêtes de travail dans les mines profondes. Ils naviguaient dans l\'obscurité totale, guidaient les mineurs perdus vers la sortie, dormaient au pied des puits. Les mineurs leur donnaient des noms. L\'obscurité est toujours là — elle est partout, maintenant. Ils y naviguent toujours. Mais plus personne ne redescend, et ils ont cessé de chercher qui guider.',
    drops: [
      { itemId: 'cave_moss', dropRatePct: 55, isHidden: false },
      { itemId: 'terravast_crystal', dropRatePct: 30, isHidden: false },
      { itemId: 'minor_health_potion', dropRatePct: 10, isHidden: false },
    ],
  },
  {
    enemyId: 'ruin_colossus',
    name: 'Ruin Colossus',
    habitat: 'Ruines effondrées, Terravast (élite)',
    shortDesc: 'Un assemblage de gravats des structures anciennes, tenu debout par quelque chose qui ressemble à de la volonté.',
    lore: 'Quand Gorvun tremble, les structures anciennes s\'effondrent et se reforment. La pierre de Terravast a de la mémoire — c\'est le domaine de la permanence, rien n\'y oublie sa forme. Mais parfois, la reformation se fait mal : un temple se relève avec les pierres d\'un pont, une tour avec les dalles d\'un tombeau. Le colossus est un bâtiment qui ne sait plus ce qu\'il était, animé, agressif, sans fonction. Il cherche son plan d\'origine. Il ne le trouvera pas.',
    drops: [
      { itemId: 'ancient_stone_rune', dropRatePct: 85, isHidden: false },
      { itemId: 'ruin_colossus_core', dropRatePct: 40, isHidden: false },
      { itemId: 'colossus_greatsword', dropRatePct: 6, isHidden: false },
      { itemId: 'runic_armor', dropRatePct: 4, isHidden: false },
    ],
  },
  {
    enemyId: 'gorvun_boss',
    name: 'Gorvun the Trembling',
    habitat: 'Gouffre central, Terravast (divinité)',
    shortDesc: 'Le titan divin de la terre, secoué de convulsions sismiques qu\'il ne contrôle plus.',
    lore: 'Gorvun n\'avait pas bougé volontairement depuis trois siècles. C\'était sa nature et son cadeau : la permanence. Les villes se construisaient sur ses épaules parce qu\'il avait promis de ne pas bouger, et un dieu de la terre tient ses promesses. Maintenant, il ne peut plus s\'arrêter. Chaque pas fissure la terre sur des kilomètres — et quelque part sous les convulsions, il y a un dieu qui sent chaque promesse se rompre une par une. Le héros ne vient pas le vaincre. Il vient tenir la dernière promesse à sa place.',
    drops: [
      { itemId: 'gorvun_fragment', dropRatePct: 100, isHidden: false },
      { itemId: 'ancient_stone_rune', dropRatePct: 100, isHidden: false },
      { itemId: 'gorvun_hammer', dropRatePct: 22, isHidden: false },
      { itemId: 'titan_earth_armor', dropRatePct: 12, isHidden: false },
      { itemId: 'fragment_of_permanence', dropRatePct: 3.5, isHidden: false },
      { itemId: 'heart_of_the_mountain', dropRatePct: 0.8, isHidden: true },
    ],
  },

  // ── ZEPHYR PEAKS (Vent) ──────────────────────────────────────

  {
    enemyId: 'gale_harpy',
    name: 'Gale Harpy',
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
    name: 'Storm Eagle',
    habitat: 'Pics orageux, Zephyr Peaks',
    shortDesc: 'Un aigle immense crépitant d\'électricité statique. Son piqué est annoncé — et presque impossible à esquiver quand même.',
    lore: 'Les aigles qui nichaient près des pics d\'orage absorbaient l\'électricité ambiante depuis des générations. Ils étaient magnifiques — à distance raisonnable. Les habitants de Windherald montaient les observer aux solstices, quand leurs plumes chargées dessinaient des arcs dans le ciel. Personne ne monte plus. La distance raisonnable n\'existe plus : la tempête a rendu tout le ciel à portée de leurs serres.',
    drops: [
      { itemId: 'stormstone', dropRatePct: 60, isHidden: false },
      { itemId: 'zephyr_feather', dropRatePct: 45, isHidden: false },
      { itemId: 'storm_eagle_feather_cloak', dropRatePct: 1.8, isHidden: false },
    ],
  },
  {
    enemyId: 'wind_wraith',
    name: 'Wind Wraith',
    habitat: 'Courants d\'altitude, Zephyr Peaks',
    shortDesc: 'Un être de vent compressé qui traverse les obstacles. Le combattre, c\'est frapper l\'air — et l\'air frappe en retour.',
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
    name: 'Cyclone Sprite',
    habitat: 'Vallées ventées, Zephyr Peaks',
    shortDesc: 'Une tornade miniature qui grossit en absorbant le vent autour d\'elle. Elle tourne trop vite pour qu\'on lise sa trajectoire.',
    lore: 'Sylvael a créé les sprites pour porter le pollen et les graines à travers les montagnes — c\'est grâce à eux que des fleurs poussaient sur des îles flottantes où aucune abeille ne montait jamais. Chaque printemps des Peaks était leur œuvre. Sans direction, ils ne portent plus rien. Ils tournent. C\'est tout ce qui reste du printemps.',
    drops: [
      { itemId: 'zephyr_feather', dropRatePct: 70, isHidden: false },
      { itemId: 'minor_mana_potion', dropRatePct: 15, isHidden: false },
    ],
  },
  {
    enemyId: 'sky_titan',
    name: 'Sky Titan',
    habitat: 'Ponts d\'air comprimé, Zephyr Peaks (élite)',
    shortDesc: 'Un géant qui marche entre les îles flottantes sur des ponts d\'air. Il vous ignore — jusqu\'à ce qu\'il ne puisse plus.',
    lore: 'Les titans du ciel précèdent Sylvael. Quand elle est arrivée, ils ne se sont pas battus : ils lui ont fait de la place, silencieusement, comme on s\'écarte pour laisser passer quelque chose de plus beau que soi. Elle a rempli cet espace de temples et de vent chantant pendant mille ans. L\'espace qu\'ils ont cédé est maintenant rempli de tempête, et ils l\'arpentent, perdus, trop grands pour se cacher et trop vieux pour partir.',
    drops: [
      { itemId: 'stormstone', dropRatePct: 80, isHidden: false },
      { itemId: 'cloudweave_silk', dropRatePct: 70, isHidden: false },
      { itemId: 'sky_titan_bow', dropRatePct: 7, isHidden: false },
      { itemId: 'air_walker_boots', dropRatePct: 4, isHidden: false },
      { itemId: 'echo_blade', dropRatePct: 0.3, isHidden: false },
      { itemId: 'sky_titans_oath', dropRatePct: 0.8, isHidden: true },
    ],
  },
  {
    enemyId: 'storm_caller',
    name: 'Storm Caller',
    habitat: 'Ruines des temples, Zephyr Peaks',
    shortDesc: 'Une silhouette drapée de vent compressé, immobile dans la tempête. Ses gestes tissent de nouveaux sprites à partir de rien.',
    lore: 'Les prêtres de Sylvael ne sont pas morts quand la tempête a pris les Peaks. Ils sont devenus la tempête — une distinction qui n\'a d\'importance que pour eux. Ce que vous voyez sont les restes de leurs rituels : des gestes liturgiques répétés sans fin, sans fidèles, sans déesse, tissant des créatures que personne n\'a demandées. La prière continue. Il n\'y a plus personne à l\'autre bout.',
    drops: [
      { itemId: 'cloudweave_silk', dropRatePct: 60, isHidden: false },
      { itemId: 'stormstone', dropRatePct: 45, isHidden: false },
      { itemId: 'minor_mana_potion', dropRatePct: 15, isHidden: false },
    ],
  },
  {
    enemyId: 'cloudpiercer',
    name: 'Cloudpiercer',
    habitat: 'Crêtes exposées, Zephyr Peaks',
    shortDesc: 'Une créature effilée qui projette une lance d\'air condensé à des distances invraisemblables, puis disparaît dans les nuages.',
    lore: 'Certaines choses des Zephyr Peaks ont évolué pour être invisibles de loin. Le cloudpiercer est l\'une d\'elles — même Sylvael, dit-on, les comptait mal. La première fois que vous en voyez un, il vous a déjà vu. La malédiction n\'a rien eu besoin d\'ajouter à cette créature. Elle a juste retiré ce qui lui donnait une raison de ne pas tirer.',
    drops: [
      { itemId: 'zephyr_feather', dropRatePct: 70, isHidden: false },
      { itemId: 'stormstone', dropRatePct: 30, isHidden: false },
      { itemId: 'cloudweave_silk', dropRatePct: 20, isHidden: false },
    ],
  },
  {
    enemyId: 'sylvael_boss',
    name: 'Sylvael the Tempest',
    habitat: 'Œil de l\'ouragan, Zephyr Peaks (divinité)',
    shortDesc: 'La déesse-phénix du vent. Sa grâce s\'est brisée en un ouragan sans fin.',
    lore: 'Sylvael dansait. C\'est le mot que tous les récits emploient — pas "volait", pas "régnait" : dansait. Les vents des Peaks étaient sa chorégraphie, et mille ans de voyageurs ont gravi les montagnes juste pour la voir passer. Sa beauté est partie. Ce qui reste est le mouvement — pur, incontrôlé, dévastateur. On ne raisonne pas avec une tempête. On ne console pas une danseuse qui ne peut plus s\'arrêter. On l\'arrête.',
    drops: [
      { itemId: 'sylvael_plume', dropRatePct: 100, isHidden: false },
      { itemId: 'zephyr_feather', dropRatePct: 100, isHidden: false },
      { itemId: 'phoenix_bow', dropRatePct: 20, isHidden: false },
      { itemId: 'tempest_cloak', dropRatePct: 12, isHidden: false },
      { itemId: 'ring_of_the_wind', dropRatePct: 4, isHidden: false },
      { itemId: 'echo_blade', dropRatePct: 0.5, isHidden: false },
      { itemId: 'hidden_fate_amulet', dropRatePct: 1, isHidden: true },
    ],
  },

  // ── ABYSSMAR (Eau) ───────────────────────────────────────────

  {
    enemyId: 'tide_crawler',
    name: 'Tide Crawler',
    habitat: 'Côtes submergées, Abyssmar',
    shortDesc: 'Un crustacé gonflé par les marées corrompues. Immobile comme un rocher, jusqu\'à ce qu\'il ne le soit plus.',
    lore: 'La côte en comptait des milliers avant le déluge — une nuisance, au pire. Les enfants de Saltmourn les retournaient sur le dos pour rire, et les pêcheurs les rejetaient à l\'eau sans y penser. Ils ont maintenant la taille de chariots et chassent activement. Les enfants qui les retournaient ont grandi derrière des palissades, et certains reconnaissent, dans les plus vieux crawlers, des carapaces qu\'ils avaient tenues dans leurs mains.',
    drops: [
      { itemId: 'deep_coral', dropRatePct: 55, isHidden: false },
      { itemId: 'sea_glass', dropRatePct: 65, isHidden: false },
      { itemId: 'tidal_shell_armor', dropRatePct: 2, isHidden: false },
    ],
  },
  {
    enemyId: 'sea_wraith',
    name: 'Sea Wraith',
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
    name: 'Coral Golem',
    habitat: 'Catacombes de corail, Abyssmar',
    shortDesc: 'Un golem poussé à même les formations coralliennes massives. Il patrouille les récifs comme une frontière.',
    lore: 'Thalymor a fait pousser ces coraux sur des siècles pour protéger les fonds marins — un rempart vivant entre les tempêtes du large et les eaux calmes où tout le reste pouvait grandir. L\'instinct de protection a survécu à la malédiction. C\'est le discernement qui est mort. Tout est désormais un intrus : les poissons, les épaves, vous. Le rempart protège des eaux vides contre un monde vide.',
    drops: [
      { itemId: 'deep_coral', dropRatePct: 80, isHidden: false },
      { itemId: 'coral_chest', dropRatePct: 4.5, isHidden: false },
    ],
  },
  {
    enemyId: 'depth_serpent',
    name: 'Depth Serpent',
    habitat: 'Fosses abyssales, Abyssmar',
    shortDesc: 'Un serpent des grandes fosses qui remonte en surface. Plus rapide qu\'il n\'en a l\'air — beaucoup plus.',
    lore: 'Les fosses profondes ont toujours été habitées. Thalymor gardait leurs occupants confinés aux abysses — une courtoisie envers les habitants de la surface, jamais formulée, jamais remerciée, maintenue pendant des siècles sans qu\'on sache même qu\'elle existait. La courtoisie a expiré avec la malédiction. Ce qui monte des fosses aujourd\'hui vous donne une idée de tout ce dont le dieu vous protégeait sans le dire.',
    drops: [
      { itemId: 'thalymor_scale', dropRatePct: 15, isHidden: false },
      { itemId: 'deep_coral', dropRatePct: 60, isHidden: false },
      { itemId: 'depth_serpent_fang_dagger', dropRatePct: 2.2, isHidden: false },
    ],
  },
  {
    enemyId: 'tide_shaper',
    name: 'Tide Shaper',
    habitat: 'Eaux noires, Abyssmar',
    shortDesc: 'Une méduse boursouflée aux pulsations bioluminescentes. Ses motifs lumineux appellent d\'autres créatures des eaux sombres.',
    lore: 'Avant le déluge, ces créatures vivaient dans les fosses les plus profondes, là où dérivaient les rêves de Thalymor. C\'est ainsi que les prêtres le décrivaient : le dieu dormait rarement, mais quand il rêvait, ses rêves coulaient vers le fond, et quelque chose devait bien s\'en nourrir. Les rêves ont tourné à l\'aigre. Les créatures qui s\'en nourrissaient aussi. Leurs pulsations lumineuses reproduisent encore les motifs des rêves — quiconque les regarde trop longtemps dit y voir des villes intactes.',
    drops: [
      { itemId: 'deep_coral', dropRatePct: 60, isHidden: false },
      { itemId: 'sea_glass', dropRatePct: 50, isHidden: false },
      { itemId: 'minor_mana_potion', dropRatePct: 12, isHidden: false },
    ],
  },
  {
    enemyId: 'abyssal_shade',
    name: 'Abyssal Shade',
    habitat: 'Rues noyées, Abyssmar',
    shortDesc: 'Le contour d\'une personne, dessiné en pression d\'eau et en chagrin. Elle vous a choisi. Elle ne s\'arrêtera pas.',
    lore: 'Tous les fantômes d\'Abyssmar n\'étaient pas des marins. Certains étaient juste des gens qui vivaient près de l\'eau et n\'ont jamais imaginé qu\'elle monterait — des boulangers, des mères, des vieillards qui regardaient la mer depuis quarante ans sans la craindre. Ils ne pouvaient pas imaginer grand-chose de ce qui est arrivé. L\'ombre qui vous poursuit ne veut probablement pas vous tuer. Elle veut que quelqu\'un reste. C\'est la même chose, à la fin.',
    drops: [
      { itemId: 'drowned_relic', dropRatePct: 65, isHidden: false },
      { itemId: 'sea_glass', dropRatePct: 35, isHidden: false },
      { itemId: 'minor_health_potion', dropRatePct: 8, isHidden: false },
      { itemId: 'drowned_locket', dropRatePct: 1, isHidden: true },
    ],
  },
  {
    enemyId: 'drowned_knight',
    name: 'Drowned Knight',
    habitat: 'Remparts engloutis, Abyssmar (élite)',
    shortDesc: 'Un guerrier en armure mort en défendant Abyssmar quand la mer est montée. Il combat encore.',
    lore: 'Ils sont restés à leur poste quand le déluge est venu. L\'honneur, ou le refus d\'accepter la mort — de sous l\'eau, la différence ne se voit plus. Ils gardent les ruines de la ville qu\'ils ont échoué à sauver, patrouillant des remparts que plus rien ne menace, saluant des officiers qui ne sont plus là. Si vous les vainquez, certains s\'immobilisent une seconde avant de tomber — comme si on venait enfin de les relever de leur garde.',
    drops: [
      { itemId: 'drowned_relic', dropRatePct: 85, isHidden: false },
      { itemId: 'drowned_knight_sword', dropRatePct: 9, isHidden: false },
      { itemId: 'seaguard_armor', dropRatePct: 6, isHidden: false },
      { itemId: 'thalymor_scale', dropRatePct: 2, isHidden: false },
      { itemId: 'hidden_undying_plate', dropRatePct: 0.8, isHidden: true },
    ],
  },
  {
    enemyId: 'thalymor_boss',
    name: 'Thalymor the Deluge',
    habitat: 'Cité engloutie, Abyssmar (divinité)',
    shortDesc: 'Le dieu-léviathan de l\'eau. Ses marées mesurées sont devenues un déluge qui dévore tout.',
    lore: 'Thalymor était le plus patient des six. Ses marées étaient un calendrier : les pêcheurs réglaient leurs vies dessus, les navires partaient et revenaient sur sa parole. Il n\'a jamais été en retard. Pas une fois en mille ans. La patience est partie — c\'est la première chose que la malédiction lui a prise, comme si elle savait que c\'était tout ce qu\'il était. Il ne reste que la profondeur. Le combattre dans les ruines noyées, c\'est se battre dans son élément, contre quelque chose de plus grand que les bâtiments, qui ne compte plus les heures.',
    drops: [
      { itemId: 'thalymor_scale', dropRatePct: 100, isHidden: false },
      { itemId: 'deep_coral', dropRatePct: 100, isHidden: false },
      { itemId: 'leviathan_staff', dropRatePct: 22, isHidden: false },
      { itemId: 'abyssal_chest', dropRatePct: 13, isHidden: false },
      { itemId: 'tidal_ring', dropRatePct: 4, isHidden: false },
      { itemId: 'tear_of_the_deep', dropRatePct: 0.8, isHidden: true },
    ],
  },

  // ── VOLTERRA (Foudre) ────────────────────────────────────────

  {
    enemyId: 'spark_imp',
    name: 'Spark Imp',
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
    name: 'Thunder Drake',
    habitat: 'Tours d\'orage, Volterra',
    shortDesc: 'Un drake qui canalise la foudre par ses ailes. Il charge en longs arcs — un missile guidé avec des serres.',
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
    name: 'Chain Revenant',
    habitat: 'Nœuds du réseau, Volterra',
    shortDesc: 'Un esprit électrocuté dans le réseau, cloué à l\'endroit de sa mort. Sa portée compense son immobilité — largement.',
    lore: 'Quand le réseau s\'est déstabilisé, des ouvriers sont morts dans la décharge. Ils réparaient — c\'est l\'ironie que la zone n\'a jamais digérée : ils sont morts en essayant de sauver la machine qui les a tués. Leurs esprits sont ancrés aux pylônes et aux bobines, incapables de s\'éloigner de plus de quelques mètres. Ils attaquent tout ce qui approche assez pour le leur rappeler.',
    drops: [
      { itemId: 'charged_metal', dropRatePct: 60, isHidden: false },
      { itemId: 'thunder_rune', dropRatePct: 35, isHidden: false },
      { itemId: 'revenant_ring', dropRatePct: 1.5, isHidden: false },
    ],
  },
  {
    enemyId: 'volt_hound',
    name: 'Volt Hound',
    habitat: 'Plaines électrifiées, Volterra',
    shortDesc: 'Un prédateur de meute qui coordonne ses frappes de foudre. Le plus rapide de Volterra — et jamais seul.',
    lore: 'Des prédateurs des plaines qui ont évolué pour utiliser l\'électricité ambiante de Volterra comme camouflage et comme arme. Ils ont toujours été dangereux — les ingénieurs avaient des protocoles entiers pour traverser leur territoire. La malédiction de Volkran en a fait autre chose : les protocoles supposaient que les hounds avaient peur de quelque chose. Cette hypothèse ne tient plus.',
    drops: [
      { itemId: 'storm_shard', dropRatePct: 60, isHidden: false },
      { itemId: 'volt_hound_pelt', dropRatePct: 25, isHidden: false },
      { itemId: 'minor_health_potion', dropRatePct: 10, isHidden: false },
    ],
  },
  {
    enemyId: 'arc_node',
    name: 'Arc Node',
    habitat: 'Lignes du réseau, Volterra',
    shortDesc: 'Une machine flottante de la taille d\'un tonneau, dérivant le long des lignes du réseau. Ne coupez pas sa route.',
    lore: 'Les ingénieurs de Volkran les ont construits pour entretenir le réseau, et ils l\'entretiennent encore — c\'est là tout le problème. Leurs routes programmées n\'ont pas changé d\'un mètre en trente ans. L\'entretien, dans le contexte actuel, consiste à détruire tout ce qui touche les lignes. Le réseau qu\'ils protègent n\'alimente plus rien. Aucune de leurs directives ne couvre ce cas.',
    drops: [
      { itemId: 'charged_metal', dropRatePct: 70, isHidden: false },
      { itemId: 'storm_shard', dropRatePct: 45, isHidden: false },
      { itemId: 'minor_mana_potion', dropRatePct: 10, isHidden: false },
    ],
  },
  {
    enemyId: 'grid_architect',
    name: 'Grid Architect',
    habitat: 'Ateliers effondrés, Volterra',
    shortDesc: 'Un grand construct à six bras qui assemble de nouveaux arc nodes en temps réel, à partir de foudre et de ferraille.',
    lore: 'Le dernier ingénieur de Volterra a construit cette machine pour continuer son œuvre après sa mort. Il y a mis tout ce qu\'il savait : ses gestes, ses plans, sa précision. Il n\'a pas envisagé une possibilité — que son œuvre ait déjà tout détruit. L\'architecte assemble donc, inlassablement, des mainteneurs pour un réseau qui a tué la ville qu\'il alimentait. C\'est le monument le plus honnête de Volterra : un homme brillant qui n\'a pas su s\'arrêter, réduit à une machine qui ne le peut pas.',
    drops: [
      { itemId: 'charged_metal', dropRatePct: 75, isHidden: false },
      { itemId: 'thunder_rune', dropRatePct: 50, isHidden: false },
      { itemId: 'storm_shard', dropRatePct: 60, isHidden: false },
      { itemId: 'engineers_final_schematic', dropRatePct: 1, isHidden: true },
    ],
  },
  {
    enemyId: 'storm_herald',
    name: 'Storm Herald',
    habitat: 'Sanctum du réseau, Volterra (élite)',
    shortDesc: 'Un construct humanoïde de foudre pure, créé par les derniers ingénieurs. Il exécute encore son dernier ordre.',
    lore: 'Avant de mourir, les derniers ingénieurs de Volterra ont tenté de créer des porteurs artificiels du pouvoir de Volkran — si le dieu était devenu fou, peut-être qu\'une copie saine pourrait le remplacer. Ils ont réussi. C\'est la partie tragique : les heralds fonctionnent parfaitement. Ils exécutent leur dernier ordre reçu — éliminer tous les intrus — avec la fidélité exacte pour laquelle ils ont été conçus. Personne n\'a survécu assez longtemps pour leur en donner un autre.',
    drops: [
      { itemId: 'volkran_coil', dropRatePct: 60, isHidden: false },
      { itemId: 'thunder_rune', dropRatePct: 80, isHidden: false },
      { itemId: 'herald_staff', dropRatePct: 7, isHidden: false },
      { itemId: 'storm_herald_plate', dropRatePct: 4.5, isHidden: false },
    ],
  },
  {
    enemyId: 'volkran_boss',
    name: 'Volkran the Stormbringer',
    habitat: 'Sommet du réseau, Volterra (divinité)',
    shortDesc: 'Le colosse divin de la foudre. Sa précision dirigée est devenue une dévastation omnidirectionnelle.',
    lore: 'Les ingénieurs l\'avaient mesuré. Ils connaissaient ses motifs à la microseconde près — toute leur civilisation était bâtie autour de ces motifs, chaque tour, chaque ligne, chaque foyer alimenté par un dieu ponctuel comme une horloge. Volkran aimait ça, dit-on : être compris. Être utile avec exactitude. Les motifs ont disparu. Ce qui marche à travers Volterra est une catastrophe électromagnétique qui a la forme d\'un dieu, et plus personne ne comprend rien de lui. C\'est peut-être ça qui hurle, dans le tonnerre.',
    drops: [
      { itemId: 'volkran_coil', dropRatePct: 100, isHidden: false },
      { itemId: 'thunder_rune', dropRatePct: 100, isHidden: false },
      { itemId: 'volkran_hammer', dropRatePct: 23, isHidden: false },
      { itemId: 'storm_plate', dropRatePct: 13, isHidden: false },
      { itemId: 'eye_of_the_storm_ring', dropRatePct: 4, isHidden: false },
      { itemId: 'hidden_temporal_blade', dropRatePct: 1, isHidden: true },
    ],
  },

  // ── GLACIEM (Glace) ──────────────────────────────────────────

  {
    enemyId: 'frost_wolf',
    name: 'Frost Wolf',
    habitat: 'Toundra gelée, Glaciem',
    shortDesc: 'Un prédateur de meute rendu fou par le blizzard. Vous les entendez avant de les voir. C\'est voulu.',
    lore: 'Les loups de Glaciem chassaient en meutes de huit. Ils étaient territoriaux mais pas agressifs — les voyageurs qui connaissaient les bons chemins passaient sans encombre, et les guides de la toundra apprenaient leurs territoires comme on apprend une carte. Le blizzard a effacé les chemins. Il n\'y a plus de bons chemins. Il n\'y a plus que le territoire, partout, et vous êtes dedans.',
    drops: [
      { itemId: 'glaciem_ice_shard', dropRatePct: 60, isHidden: false },
      { itemId: 'frozen_essence', dropRatePct: 35, isHidden: false },
      { itemId: 'frost_wolf_pelt', dropRatePct: 20, isHidden: false },
    ],
  },
  {
    enemyId: 'ice_golem',
    name: 'Ice Golem',
    habitat: 'Entrées des cavernes de glace, Glaciem',
    shortDesc: 'Un gardien massif taillé dans la glace glaciaire. Il ne distingue plus les amis des ennemis. Il n\'essaie plus.',
    lore: 'Crysthea les a bâtis pour garder les entrées de ses cavernes de glace. Ses archives étaient trop précieuses pour rester sans surveillance — des siècles de souvenirs préservés, les visages des morts, les voix des langues éteintes. Les golems gardent toujours. Simplement, ils gardent tout, contre tout le monde, y compris contre ceux qui viendraient sauver ce qu\'il y a derrière les portes.',
    drops: [
      { itemId: 'glaciem_ice_shard', dropRatePct: 80, isHidden: false },
      { itemId: 'ancient_frost_rune', dropRatePct: 40, isHidden: false },
      { itemId: 'glacial_shield', dropRatePct: 4, isHidden: false },
    ],
  },
  {
    enemyId: 'blizzard_wraith',
    name: 'Blizzard Wraith',
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
    name: 'Permafrost Titan',
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
    name: 'Crystal Dragon',
    habitat: 'Montagnes profondes, Glaciem (élite)',
    shortDesc: 'Le prédateur suprême de Glaciem. Il souffle depuis les hauteurs, gèle le terrain, puis descend finir le travail.',
    lore: 'Personne n\'a fait ces dragons. Ils sont vieux — plus vieux que Crysthea. Ils se sont formés naturellement dans la glace des montagnes profondes, sur des millénaires, molécule par molécule, jusqu\'au jour où la glace a ouvert les yeux. Quand Crysthea est arrivée, ils étaient déjà là. Elle les a laissés tranquilles. Une déesse qui savait tout préserver a jugé qu\'eux n\'avaient pas besoin d\'elle. C\'était sage. Ça l\'est toujours — mais vous n\'avez plus le choix.',
    drops: [
      { itemId: 'crysthea_splinter', dropRatePct: 25, isHidden: false },
      { itemId: 'ancient_frost_rune', dropRatePct: 80, isHidden: false },
      { itemId: 'crystal_dragon_fang_staff', dropRatePct: 8, isHidden: false },
      { itemId: 'ice_dragon_scale_chest', dropRatePct: 5, isHidden: false },
      { itemId: 'frozen_heart_amulet', dropRatePct: 1.2, isHidden: false },
      { itemId: 'primordial_ice_core', dropRatePct: 0.8, isHidden: true },
    ],
  },
  {
    enemyId: 'glacial_shaper',
    name: 'Glacial Shaper',
    habitat: 'Charniers gelés, Glaciem',
    shortDesc: 'Une silhouette voûtée de glace vivante, dont les mains traînent un feu bleu. Elle rappelle les loups morts du grand gel.',
    lore: 'Crysthea préservait les morts — c\'était son office le plus sacré, celui pour lequel les familles traversaient la toundra. Le shaper n\'existait pas avant la malédiction : c\'est un effet secondaire de la magie de préservation appliquée sans limite ni jugement. Il ne comprend pas la différence entre préserver les morts et les réveiller. Personne ne la lui a apprise, et la seule qui aurait pu est en train de geler le monde.',
    drops: [
      { itemId: 'frozen_essence', dropRatePct: 70, isHidden: false },
      { itemId: 'ancient_frost_rune', dropRatePct: 45, isHidden: false },
      { itemId: 'minor_mana_potion', dropRatePct: 15, isHidden: false },
    ],
  },
  {
    enemyId: 'hoarfrost_stalker',
    name: 'Hoarfrost Stalker',
    habitat: 'Lisières de la meute, Glaciem',
    shortDesc: 'L\'alpha d\'une meute de loups du givre — plus grand, plus patient, deux fois plus létal quand il se décide enfin.',
    lore: 'L\'alpha n\'a pas perdu l\'esprit comme la meute. C\'est là toute l\'horreur : il a regardé les siens sombrer un par un dans la folie du blizzard, lucide, et puis il les a suivis. Volontairement. Parce que la meute était tout ce qu\'il avait, et qu\'un alpha ne survit pas à sa meute — il la précède ou il l\'accompagne. Quand il charge, il n\'y a pas de rage dans ses yeux. Seulement une décision, prise il y a longtemps, tenue jusqu\'au bout.',
    drops: [
      { itemId: 'glaciem_ice_shard', dropRatePct: 70, isHidden: false },
      { itemId: 'frozen_essence', dropRatePct: 55, isHidden: false },
      { itemId: 'frost_wolf_pelt', dropRatePct: 35, isHidden: false },
      { itemId: 'ancient_frost_rune', dropRatePct: 20, isHidden: false },
      { itemId: 'hidden_soul_bow', dropRatePct: 0.6, isHidden: true },
    ],
  },
  {
    enemyId: 'crysthea_boss',
    name: 'Crysthea the Frozen',
    habitat: 'Archives de glace, Glaciem (divinité)',
    shortDesc: 'La déesse de la préservation. Sa curation délicate est devenue un blizzard qui annihile tout.',
    lore: 'Crysthea est peut-être l\'être le plus ancien de Velmara. Elle se souvient de tout — c\'était son don et son fardeau : les visages des morts, les langues éteintes, les promesses que les autres avaient oubliées. Les gens venaient à ses archives pour retrouver ce qu\'ils avaient perdu, et repartaient en pleurant de gratitude. Dans son état actuel, elle ne se souvient pas que le héros essaie de sauver le monde. Elle se souvient d\'une seule chose : le monde doit être préservé. Alors elle le gèle — tout, tout le monde, pour toujours. C\'est encore de l\'amour. C\'est ça, le pire.',
    drops: [
      { itemId: 'crysthea_splinter', dropRatePct: 100, isHidden: false },
      { itemId: 'ancient_frost_rune', dropRatePct: 100, isHidden: false },
      { itemId: 'memory_staff', dropRatePct: 24, isHidden: false },
      { itemId: 'glaciem_guardian_chest', dropRatePct: 14, isHidden: false },
      { itemId: 'ring_of_preservation', dropRatePct: 4, isHidden: false },
      { itemId: 'hidden_eternity_ring', dropRatePct: 1, isHidden: true },
    ],
  },

  // ── MALACHAR'S SPIRE (Sombre) ────────────────────────────────

  {
    enemyId: 'dark_revenant',
    name: 'Dark Revenant',
    habitat: 'Couloirs bas de la Spire, Malachar\'s Spire',
    shortDesc: 'Un esprit entièrement consumé par la magie sombre. Le tireur le plus mobile que vous croiserez.',
    lore: 'Chaque personne que Malachar a lésée est ici. La magie sombre attire le grief comme la lumière attire les papillons — et trente ans de préparation lèsent beaucoup de monde : des fournisseurs ruinés, des curieux disparus, des proches tenus à distance jusqu\'à ce qu\'ils cessent de venir. La Spire en est saturée. Ils ne servent pas Malachar. Ils sont juste restés collés à ce qui les a brisés.',
    drops: [
      { itemId: 'dark_essence', dropRatePct: 70, isHidden: false },
      { itemId: 'void_shard', dropRatePct: 30, isHidden: false },
      { itemId: 'shadow_ring', dropRatePct: 2, isHidden: false },
    ],
  },
  {
    enemyId: 'shadow_construct',
    name: 'Shadow Construct',
    habitat: 'Corridors de la Spire, Malachar\'s Spire',
    shortDesc: 'Un gardien mécanique bâti d\'énergie sombre et de pouvoir élémentaire volé. L\'architecture elle-même vous chasse.',
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
    name: 'Void Weaver',
    habitat: 'Salles d\'étude abandonnées, Malachar\'s Spire',
    shortDesc: 'Une entité aux membres d\'araignée qui coud de nouveaux revenants à partir des murs saturés de chagrin.',
    lore: 'Il y avait un érudit dans la maisonnée de Malachar, qui a aidé aux premières recherches. Des années de travail côte à côte, de découvertes partagées, de thé refroidi sur les manuscrits. Quand l\'érudit a compris à quoi servait la recherche, il a essayé de partir. Voilà ce qu\'il est devenu. Le weaver coud des revenants avec les gestes précis d\'un copiste — les mêmes mains, la même patience. Malachar ne passe jamais par ces salles. On ignore si c\'est du remords ou de l\'indifférence, et on ne sait pas ce qui serait pire.',
    drops: [
      { itemId: 'dark_essence', dropRatePct: 75, isHidden: false },
      { itemId: 'corrupted_rune', dropRatePct: 55, isHidden: false },
      { itemId: 'void_shard', dropRatePct: 40, isHidden: false },
      { itemId: 'scholars_torn_page', dropRatePct: 1, isHidden: true },
    ],
  },
  {
    enemyId: 'void_stalker',
    name: 'Void Stalker',
    habitat: 'Recoins sans lumière, Malachar\'s Spire',
    shortDesc: 'Un prédateur efflanqué d\'ombre pure. Il disparaît dans les angles morts et charge depuis l\'immobilité absolue.',
    lore: 'La Spire a été conçue avec les ombres en tête — Malachar savait ce que le noir peut cacher, et il a dessiné chaque couloir pour en avoir. Mais les stalkers, il ne les a pas conçus. Ce sont les créatures que le noir a choisi d\'y mettre de lui-même, comme si l\'obscurité avait accepté l\'invitation puis amené ses propres invités. Même Malachar les évite. C\'est la seule chose de sa tour qu\'il n\'a pas voulue.',
    drops: [
      { itemId: 'void_shard', dropRatePct: 65, isHidden: false },
      { itemId: 'dark_essence', dropRatePct: 45, isHidden: false },
      { itemId: 'shadow_ring', dropRatePct: 2.5, isHidden: false },
    ],
  },
  {
    enemyId: 'void_sentinel',
    name: 'Void Sentinel',
    habitat: 'Sanctum intérieur, Malachar\'s Spire (élite)',
    shortDesc: 'Un gardien d\'élite de magie sombre pure, posté aux portes du sanctum. Il ne recule jamais. Ce n\'est pas dans sa nature — littéralement.',
    lore: 'Malachar en a créé un pour chacune de ses trente années de préparation. Trente sentinelles, trente ans — l\'œuvre d\'une vie, rendue chair et fonction. On dit que chacune porte quelque chose de l\'année qui l\'a vue naître : la première est hésitante, presque prudente ; les dernières frappent sans le moindre doute. Les tuer, c\'est remonter sa vie à l\'envers. Quelque part vers la vingtième, on cesse de trouver l\'homme et on ne trouve plus que la décision.',
    drops: [
      { itemId: 'void_shard', dropRatePct: 85, isHidden: false },
      { itemId: 'dark_essence', dropRatePct: 80, isHidden: false },
      { itemId: 'sentinel_armor', dropRatePct: 7, isHidden: false },
      { itemId: 'sentinel_sword', dropRatePct: 5, isHidden: false },
      { itemId: 'ring_of_the_unbound', dropRatePct: 0.3, isHidden: false },
      { itemId: 'hidden_void_reaper', dropRatePct: 0.8, isHidden: true },
    ],
  },
  {
    enemyId: 'malachar_boss',
    name: 'Malachar the Unbound',
    habitat: 'Sommet de la Spire, Malachar\'s Spire',
    shortDesc: 'L\'érudit de Grievy Town qui a brisé le monde, debout au sommet de trente ans d\'obsession.',
    lore: 'Malachar n\'est pas un monstre. C\'est un homme né à Grievy Town, qui a posé une question légitime — pourquoi les dieux gardent-ils le pouvoir pour eux ? — et qui a choisi un chemin il y a trente ans sans jamais en douter une seule fois. La tour était là depuis le début, visible depuis la place du village. Personne n\'a demandé ce qu\'il y faisait. Il a regardé le monde se défaire avec quelque chose qui ressemble à de la satisfaction. Il n\'a sous-estimé qu\'une chose : que le monde renverrait quelqu\'un. Quand vous le tuerez, il ne s\'excusera pas. Mais il vous regardera vraiment — et ce sera peut-être la première fois en trente ans qu\'il regarde quelqu\'un.',
    drops: [
      { itemId: 'malachars_grimoire', dropRatePct: 100, isHidden: false },
      { itemId: 'void_shard', dropRatePct: 100, isHidden: false },
      { itemId: 'malachars_staff', dropRatePct: 50, isHidden: false },
      { itemId: 'unbound_robe', dropRatePct: 40, isHidden: false },
      { itemId: 'ring_of_the_unbound', dropRatePct: 15, isHidden: false },
      { itemId: 'hidden_world_eater_staff', dropRatePct: 1.5, isHidden: true },
    ],
  },
];

export function getBestiaryEntry(enemyId: string): BestiaryEnemyData | undefined {
  return BESTIARY_DATA.find(e => e.enemyId === enemyId);
}
