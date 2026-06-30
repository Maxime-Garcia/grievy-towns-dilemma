# VISUAL ASSETS — Grievy Town's Dilemma
## Catalogue complet à destination de l'Environment Artist

---

## SECTION 1 : GUIDE ARTISTIQUE & INSPIRATIONS GRAPHIQUES

### 1.1 Style général

**Grievy Town's Dilemma** est un Action RPG 2D top-down en pixel art. Le style s'inspire principalement de **Pokémon Gen 3/4 (GBA/DS)** et de **Chrono Trigger (SNES)** pour ce qui est de la lisibilité et de l'identité visuelle de chaque zone.

Le pixel art de GTD n'est **pas** enfantin malgré ses références Gen 3. Il s'agit d'un pixel art **médiéval-fantasy sombre**, dans la lignée visuelle de l'anime **Frieren: Beyond Journey's End** — couleurs saturées mais non criardes, ambiances oppressantes, créatures reconnaissables au premier coup d'œil.

**Vue :** Top-down 2D, caméra fixe centrée sur le joueur. Pas d'isométrie.

**Résolution logique :** 800×600 px. Le canvas est centré dans la fenêtre du navigateur, rendu avec `image-rendering: pixelated` — les pixels doivent rester des pixels, jamais d'anti-aliasing.

**Hard pixel edges :** Zéro anti-aliasing, zéro sous-pixel rendering. Chaque bord est un bord net.

### 1.2 Tailles de référence

| Élément | Taille en canvas |
|---------|-----------------|
| Tile de sol | 16×16 px |
| Sprite joueur | 32×32 px |
| Sprites ennemis (standard) | 32×32 px |
| Sprites boss | 64×64 px |
| Sprites NPCs principaux | 32×32 px |
| NPCs de fond (background) | 16×16 ou 32×32 px |
| Icônes d'items | 16×16 px |
| Icônes de skills | 32×32 px |
| Portraits NPC (dialogue) | 64×64 px |
| Effets visuels (VFX) | Variable selon l'effet |

### 1.3 Palettes par zone — Couleurs exactes

Extraites de `zoneMaps.ts`. Chaque zone a une `bgColor` (sol/fond), une `pathColor` (chemins/routes), une `wallColor` (murs/obstacles) et une `accentColor` (détails/highlights).

#### Grievy Town (Hub neutre)
- `bgColor` `#3a4a2a` — Vert foncé terreux, herbe médiévale
- `pathColor` `#8a7a50` — Beige sableux, routes de terre battue
- `wallColor` `#5a4a30` — Brun moyen, pierre et bois médiéval
- `accentColor` `#6a8a4a` — Vert mousse, végétation douce

**Palette globale Grievy Town :** Bruns chauds, beige, gris pierre, vert médiéval. Ni trop sombre ni trop lumineux — c'est une ville normale dans un monde magique.

#### Ignis Reach (Feu)
- `bgColor` `#1a0800` — Noir presque absolu avec teinte rouge-brun, sol de lave refroidie
- `pathColor` `#6a3010` — Brun-rouge sombre, cendre et roche volcanique
- `wallColor` `#3a1808` — Brun très foncé, roche basaltique
- `accentColor` `#dd4400` — Rouge-orange vif, braises et lave incandescente

**Palette globale Ignis Reach :** Rouge, orange, noir obsidienne. Référence visuelle : les mines de Diablo I. Aucun vert, aucun bleu — la complémentarité doit renforcer l'impression de chaleur étouffante.

#### Terravast (Terre)
- `bgColor` `#0c0a04` — Presque noir, sol de caverne profonde
- `pathColor` `#4a3a18` — Brun ocre sombre, terre des tunnels
- `wallColor` `#2a200c` — Brun très foncé, roche de caverne
- `accentColor` `#6a5a30` — Or terne, reflets de cristaux bioluminescents

**Palette globale Terravast :** Brun sombre, gris caverne, or terni. Les cristaux bioluminescents sont l'élément distinctif — bleu pâle ou cyan pour les cristaux, contraste fort avec le fond sombre.

#### Zephyr Peaks (Vent)
- `bgColor` `#060818` — Bleu-noir, ciel nocturne de haute altitude
- `pathColor` `#4060a0` — Bleu moyen, pierre de falaise exposée au vent
- `wallColor` `#182848` — Bleu très foncé, parois de falaise
- `accentColor` `#8899dd` — Bleu-lavande clair, lumière d'altitude, ciel

**Palette globale Zephyr Peaks :** Bleu nuit, blanc nuage, or céleste, lavande. Référence : les îles flottantes de Tales of Symphonia. La lumière vient de partout (nuages lumineux).

#### Abyssmar (Eau)
- `bgColor` `#020810` — Bleu quasi-noir, profondeurs abyssales
- `pathColor` `#0a1835` — Bleu marine très foncé, sol marin
- `wallColor` `#061022` — Bleu nuit profond, corail et roche
- `accentColor` `#2a6a8a` — Teal, reflets bioluminescents d'eau profonde

**Palette globale Abyssmar :** Bleu nuit, teal, cyan bioluminescent. Référence : les caves marines de Final Fantasy VI. Tout est dans les bleus froids et les reflets teal/cyan.

#### Volterra (Foudre)
- `bgColor` `#06060e` — Presque noir, plaines brûlées
- `pathColor` `#141420` — Gris-bleu très foncé, sol conducteur
- `wallColor` `#202035` — Gris-bleu foncé, métal et béton de la grille
- `accentColor` `#ffee00` — Jaune électrique vif, foudre et arcs électriques

**Palette globale Volterra :** Violet sombre, gris métal, jaune électrique vif. Le jaune ne doit pas être utilisé partout — il doit rester un accent fort et immédiatement lisible pour la foudre.

#### Glaciem (Glace)
- `bgColor` `#7a9ab2` — Bleu-gris moyen, glace et ciel d'hiver
- `pathColor` `#a0c0d8` — Bleu glace pâle, chemins sur glace
- `wallColor` `#5a7a90` — Bleu-gris, parois de glace
- `accentColor` `#eeeeff` — Blanc cassé avec nuance bleue, givre, neige fraîche

**Palette globale Glaciem :** Blanc, bleu glace, argent givré. C'est la zone la plus lumineuse — paradoxalement, c'est aussi la plus froide et la plus silencieuse.

#### Malachar's Spire (Ombre)
- `bgColor` `#020204` — Noir quasi-absolu
- `pathColor` `#070710` — Noir avec légère teinte bleue-violette
- `wallColor` `#100820` — Noir avec teinte violette, pierre corrompue
- `accentColor` `#4a0a5a` — Violet fantôme, fissures de magie noire

**Palette globale Malachar's Spire :** Noir absolu, violet fantôme, fissures lumineuses. Référence : les niveaux de fin de Hollow Knight. Moins il y a de couleur, plus l'impact des accents violets est fort.

### 1.4 Références visuelles par zone

| Zone | Références directes |
|------|---------------------|
| Grievy Town | Pallet Town et Viridian City (Pokémon FR/LG), villages de Chrono Trigger |
| Ignis Reach | Cinnabar Island (Pokémon), zones volcaniques de Final Fantasy Tactics |
| Terravast | Mt. Moon (Pokémon), cavernes de Chrono Trigger (Denadoro Mountains), dark zones de Hollow Knight |
| Zephyr Peaks | Sky Pillar (Pokémon RSE), îles flottantes de Tales of Zestiria |
| Abyssmar | Seafloor Cavern (Pokémon RSE), Zora's Domain (Zelda), Atlantis iconographique |
| Volterra | Silph Co. (Pokémon RB), zones industrielles abandonnées, aesthetic "retro-futurist ruiné" |
| Glaciem | Snowpoint City (Pokémon DPP), Icicle Cave, Snowpeak Ruins (Zelda TP) |
| Malachar's Spire | Distortion World (Pokémon Pt), Abyss de Hollow Knight, Dark Shrine de Chrono Trigger |

### 1.5 Style des sprites

**Silhouette absolue :** Chaque créature doit être reconnaissable à 100% par sa silhouette seule — contour noir d'1px sur un fond de couleur. C'est la règle de lisibilité #1.

**Nombre max de couleurs par sprite :** 16 couleurs (palette indexée). En pratique : 8–12 couleurs suffisent. Les couleurs doivent être dans la gamme de la zone.

**Contour :** 1px de noir (ou couleur très sombre) sur tous les bords du sprite. Pas de "inner shadow", pas de glow (le glow est un effet Phaser, pas un sprite).

**Ombres :** Pas d'ombres portées dans les sprites — elles seraient incohérentes avec la vue top-down. Les ombres sont des ellipses noires semi-transparentes en code Phaser.

**Animations :** Tous les sprites animés sont des spritesheets horizontales. Chaque frame est adjacente sur une seule ligne. Format : `largeur_sprite × nombre_frames` × `hauteur_sprite`.

### 1.6 UI déjà en place (ne pas redessiner)

L'interface UI utilise actuellement du code `Phaser.Graphics` pour les panneaux (drawPanel, drawRect). La font utilisée est **Press Start 2P** (Google Fonts, libre de droits). Palette UI : sombre médiévale-fantasy, panneaux noirs avec bordures.

Les éléments UI dessinés en code qui pourraient bénéficier d'un sprite :
- Barres de vie / mana / XP (actuellement en rectangles colorés)
- Bordures de dialogue
- Cadres d'inventaire
- Cadres de compétences dans le HUD

Ces éléments sont à traiter en **Priorité 2** — le jeu fonctionne sans eux.

### 1.7 Spécifications techniques

- **Format :** PNG-8 ou PNG-24 avec transparence (`alpha` channel)
- **Fond :** Transparent (pas de fond blanc ou magenta)
- **Spritesheets :** Une seule image horizontale par animation. Ex : `player_walk_down.png` = 4 frames de 32px = 128×32 px
- **Pas d'espacement / margin** entre les frames dans un spritesheet sauf si spécifié (le code actuel gère `spacing: 0, margin: 0`)
- **Dossier de livraison :** Voir `ASSETS_IMPORT_GUIDE.md` pour la structure exacte

---

## SECTION 2 : CATALOGUE DES ASSETS

---

### 2.1 TILESETS DE SOL

Un tile = 16×16 px. Les tilesets sont des images avec plusieurs tiles alignés.

#### Grievy Town

| Fichier | Contenu |
|---------|---------|
| `tileset_grievy_ground.png` | Sol d'herbe courte — tile de base (bgColor `#3a4a2a`). Variantes : herbe haute, patch de terre nue |
| `tileset_grievy_path.png` | Route de terre battue (pathColor `#8a7a50`). Variantes : bords arrondis de route, coins |
| `tileset_grievy_wall.png` | Mur de pierre médiéval (wallColor `#5a4a30`). Variantes : mur plein, mur avec fenêtre, porte de bâtiment |
| `tileset_grievy_accent.png` | Végétation douce (accentColor `#6a8a4a`) : buissons, haies basses, herbes décoratives |
| `tileset_grievy_water.png` | Ruisseau de Grievy Town : eau peu profonde, reflets animés si possible (4 frames) |

#### Ignis Reach

| Fichier | Contenu |
|---------|---------|
| `tileset_ignis_ground.png` | Sol de lave refroidie (bgColor `#1a0800`). Variantes : lisse, craquelé, avec fissures rougeoyantes |
| `tileset_ignis_path.png` | Roche volcanique praticable (pathColor `#6a3010`). Cendre et obsidienne |
| `tileset_ignis_wall.png` | Parois volcaniques (wallColor `#3a1808`). Basalte, formations de lave solidifiée |
| `tileset_ignis_lava.png` | Lave active (waterAreas). Rouge-orange animé. 4–6 frames pour l'animation |
| `tileset_ignis_accent.png` | Détails : braises au sol, blocs d'obsidienne, fissures incandescentes |

#### Terravast

| Fichier | Contenu |
|---------|---------|
| `tileset_terra_ground.png` | Sol de caverne (bgColor `#0c0a04`). Roche sombre, humus de caverne |
| `tileset_terra_path.png` | Chemins de caverne fréquentés (pathColor `#4a3a18`) |
| `tileset_terra_wall.png` | Parois de caverne (wallColor `#2a200c`). Roche sombre avec veines de quartz |
| `tileset_terra_crystal.png` | Cristaux bioluminescents (accentColor `#6a5a30` + bleu cyan) — animés (4 frames de pulsation) |
| `tileset_terra_water.png` | Lac souterrain / rivière souterraine (waterAreas). Eau sombre, reflets bleus |

#### Zephyr Peaks

| Fichier | Contenu |
|---------|---------|
| `tileset_zephyr_ground.png` | Roche de haute altitude (bgColor `#060818`). Pierre bleutée de falaise |
| `tileset_zephyr_path.png` | Chemin de montagne (pathColor `#4060a0`). Pierre exposée, légèrement humide |
| `tileset_zephyr_wall.png` | Falaises (wallColor `#182848`). Parois abruptes de roche bleue |
| `tileset_zephyr_water.png` | Cascade et lac d'altitude (waterAreas). Eau de montagne, animé |
| `tileset_zephyr_accent.png` | Nuages bas, rochers de sommet, plantes de haute altitude |

#### Abyssmar

| Fichier | Contenu |
|---------|---------|
| `tileset_abyssal_ground.png` | Fond marin (bgColor `#020810`). Sable abyssal, vase |
| `tileset_abyssal_path.png` | Routes sous-marines dégagées (pathColor `#0a1835`) |
| `tileset_abyssal_wall.png` | Corail massif et roche marine (wallColor `#061022`) |
| `tileset_abyssal_water.png` | Canaux marins et tranchées (waterAreas). Eau bioluminescente, animée |
| `tileset_abyssal_accent.png` | Coraux décoratifs, épaves, anémones, algues |

#### Volterra

| Fichier | Contenu |
|---------|---------|
| `tileset_volt_ground.png` | Plaines brûlées (bgColor `#06060e`). Sol conducteur noir |
| `tileset_volt_path.png` | Routes de métal et béton (pathColor `#141420`) |
| `tileset_volt_wall.png` | Murs industriels — béton, acier (wallColor `#202035`) |
| `tileset_volt_water.png` | Bassins électrifiés (waterAreas). Eau conductrice, arc électriques en animation |
| `tileset_volt_accent.png` | Arcs électriques, câbles, condensateurs, éclairs au sol |

#### Glaciem

| Fichier | Contenu |
|---------|---------|
| `tileset_glaciem_ground.png` | Toundra gelée (bgColor `#7a9ab2`). Neige tassée, surface de glace |
| `tileset_glaciem_path.png` | Chemins dégagés sur glace (pathColor `#a0c0d8`) |
| `tileset_glaciem_wall.png` | Formations de glace (wallColor `#5a7a90`). Stalactites, murs de glacier |
| `tileset_glaciem_water.png` | Lac gelé, fissures glaciaires (waterAreas). Animé avec légère distorsion |
| `tileset_glaciem_accent.png` | Cristaux de glace, givre sur roche, neige fraîche |

#### Malachar's Spire

| Fichier | Contenu |
|---------|---------|
| `tileset_spire_ground.png` | Sol de tour corrompue (bgColor `#020204`). Pierre noire, cendres de magie |
| `tileset_spire_path.png` | Corridors de la Spire (pathColor `#070710`) |
| `tileset_spire_wall.png` | Murs de pierre violacée (wallColor `#100820`) |
| `tileset_spire_accent.png` | Fissures lumineuses violettes, runes corrompues, fragments flottants |

#### Zones de Route (6 routes)

| Fichier | Zone | Notes |
|---------|------|-------|
| `tileset_route_ember.png` | Route des Braises | Partage des tiles avec ignis, sol de cendre |
| `tileset_route_stone.png` | Chemin de Pierre | Dalles de pierre millénaires fissurées |
| `tileset_route_zephyr.png` | Sentier de Zephyr | Pierre de montagne, arbres inclinés par le vent |
| `tileset_route_coastal.png` | Route Côtière | Falaise marine, débris de navires au bas |
| `tileset_route_thunder.png` | Col du Tonnerre | Poteaux électriques tombés, sol de col de montagne |
| `tileset_route_frost.png` | Voie Glaciale | Vieille route recouverte de givre, charrettes abandonnées |

---

### 2.2 SPRITES JOUEUR

Tous les sprites joueur sont 32×32 px. Les spritesheets sont horizontales.

| Fichier | Contenu | Frames | Dimensions totales |
|---------|---------|--------|--------------------|
| `player_idle_down.png` | Idle face au joueur (caméra) | 2 frames | 64×32 |
| `player_idle_up.png` | Idle de dos | 2 frames | 64×32 |
| `player_idle_left.png` | Idle profil gauche | 2 frames | 64×32 |
| `player_idle_right.png` | Idle profil droit | 2 frames | 64×32 |
| `player_walk_down.png` | Marche vers le bas | 4 frames | 128×32 |
| `player_walk_up.png` | Marche vers le haut | 4 frames | 128×32 |
| `player_walk_left.png` | Marche vers la gauche | 4 frames | 128×32 |
| `player_walk_right.png` | Marche vers la droite | 4 frames | 128×32 |
| `player_attack_down.png` | Attaque vers le bas | 3 frames | 96×32 |
| `player_attack_up.png` | Attaque vers le haut | 3 frames | 96×32 |
| `player_attack_left.png` | Attaque vers la gauche | 3 frames | 96×32 |
| `player_attack_right.png` | Attaque vers la droite | 3 frames | 96×32 |
| `player_dash_down.png` | Dash vers le bas | 2 frames | 64×32 |
| `player_dash_up.png` | Dash vers le haut | 2 frames | 64×32 |
| `player_dash_left.png` | Dash vers la gauche | 2 frames | 64×32 |
| `player_dash_right.png` | Dash vers la droite | 2 frames | 64×32 |
| `player_death.png` | Animation de mort | 5 frames | 160×32 |
| `player_hurt.png` | Flash de douleur (1 frame suffit — blanc ou rouge) | 1 frame | 32×32 |
| `player_cast.png` | Cast de sort (générique) | 3 frames | 96×32 |
| `player_afterimage.png` | Image fantôme pour le dash (légèrement transparent) | 1 frame | 32×32 |

**Note :** Le joueur est sans nom et sans mémoire — son apparence est délibérément sobre et archétypale. Pas de couleur de cheveux flashy. Vêtements neutres de voyage. Son design doit permettre la projection.

---

### 2.3 SPRITES ENNEMIS

Tous les ennemis standards sont 32×32 px. Chaque ennemi a : idle (2 frames), walk (4 frames), attack (3 frames), death (4 frames), et hurt (1 frame flash).

Format de spritesheet par animation : même convention que le joueur.

#### Ignis Reach — Ennemis de Feu

| Fichier | Ennemi | Notes visuelles |
|---------|--------|-----------------|
| `enemy_ember_wyrm.png` | Ember Wyrm | Serpent de feu — corps sinueux, écailles rouge-orange, yeux jaunes. Corps qui ondule. |
| `enemy_lava_golem.png` | Lava Golem | Masse de lave refroidie — très grand pour 32×32, silhouette trapue et lourde. Fissures rougeoyantes. |
| `enemy_cinder_sprite.png` | Cinder Sprite | Petite flamme humanoïde — très simple, peu de couleurs, silhouette ronde-conique. |
| `enemy_ash_revenant.png` | Ash Revenant | Fantôme de pèlerin — silhouette humaine avec vêtements qui se défont en cendres. Translucide partiel. |
| `enemy_magma_titan.png` | Magma Titan | Elite — plus grand et imposant que les autres feu. Roche et lave en fusion, lent, lourd. |
| `enemy_ember_broodmother.png` | Ember Broodmother | Araignée de feu — corps bulbeux, pattes nombreuses (stylisées), oeufs de feu visibles. |
| `enemy_scorch_sentinel.png` | Scorch Sentinel | Gardien de pierre ancien — armure de roche avec feu en incrustation. Posture rigide, patrouille. |

#### Terravast — Ennemis de Terre

| Fichier | Ennemi | Notes visuelles |
|---------|--------|-----------------|
| `enemy_stone_crawler.png` | Stone Crawler | Insecte avec carapace de pierre — forme de scarabée, très plat, 6 pattes visibles. |
| `enemy_crystal_golem.png` | Crystal Golem | Golem de cristal — facettes multiples visibles dans les 32×32, bleu-cyan sur brun sombre. |
| `enemy_cave_lurker.png` | Cave Lurker | Prédateur de plafond — silhouette arachnéenne longue et fine. Yeux lumineux. |
| `enemy_terravast_serpent.png` | Terravast Serpent | Grand serpent aux écailles de pierre — similaire au ember_wyrm mais dans les tons brun-gris. |
| `enemy_rune_shard_ghost.png` | Rune Shard Ghost | Esprit de rune translucide — forme humanoïde avec des runes qui flottent autour de lui. |
| `enemy_stone_hound.png` | Stone Hound | Chien quadrupède à carapace de granit — silhouette de chien robuste, musclé, avec texture pierreuse. |
| `enemy_ruin_colossus.png` | Ruin Colossus | Elite — assemblage de pierres en ruine animé. Grand, inégal, fragments qui flottent autour. |

#### Zephyr Peaks — Ennemis de Vent

| Fichier | Ennemi | Notes visuelles |
|---------|--------|-----------------|
| `enemy_gale_harpy.png` | Gale Harpy | Hybride femme-rapace — ailes grandes, serres acérées, plumes bleutées. Regard prédateur. |
| `enemy_storm_eagle.png` | Storm Eagle | Grand aigle avec arcs électriques sur les ailes. Envergure qui déborde des 32×32 (wings folded). |
| `enemy_wind_wraith.png` | Wind Wraith | Silhouette humaine entièrement faite de vent — transparente, ondulante, yeux blancs vides. |
| `enemy_cyclone_sprite.png` | Cyclone Sprite | Petite tornade avec des yeux — spirale visible dans le sprite, rotation animée. |
| `enemy_sky_titan.png` | Sky Titan | Elite — géant humanoïde, vêtements de nuage, taille qui déborde visuellement. |
| `enemy_storm_caller.png` | Storm Caller | Figure enrobée de vent — robe flottante, gestes d'invocation, immobile lors des animations de sort. |
| `enemy_cloudpiercer.png` | Cloudpiercer | Créature fine et allongée — silhouette de lance vivante, corps quasiment inivisible (adaptation de camouflage). |

#### Abyssmar — Ennemis d'Eau

| Fichier | Ennemi | Notes visuelles |
|---------|--------|-----------------|
| `enemy_tide_crawler.png` | Tide Crawler | Crabe géant — pinces massives, carapace bleutée, yeux sur tiges. Couleur teal/brun. |
| `enemy_sea_wraith.png` | Sea Wraith | Fantôme de marin — silhouette humaine avec eau qui coule de lui, restes d'uniforme. |
| `enemy_coral_golem.png` | Coral Golem | Golem de corail — dentelé, asymétrique, rose-blanc sur bleu profond. |
| `enemy_depth_serpent.png` | Depth Serpent | Serpent des abysses — long, bioluminescent (quelques points lumineux cyan sur le corps). |
| `enemy_tide_shaper.png` | Tide Shaper | Méduse géante bioluminescente — tentacules, corps pulsant, couleurs bleu et violet. |
| `enemy_abyssal_shade.png` | Abyssal Shade | Ombre humaine sous l'eau — contour humain, intérieur vide sombre avec reflets bleutés. |
| `enemy_drowned_knight.png` | Drowned Knight | Elite — chevalier en armure sous-marine rouillée, algues incrustées, spectre de dignité passée. |

#### Volterra — Ennemis de Foudre

| Fichier | Ennemi | Notes visuelles |
|---------|--------|-----------------|
| `enemy_spark_imp.png` | Spark Imp | Petite créature électrique — silhouette d'imp avec des arcs jaunes partout. Instable. |
| `enemy_thunder_drake.png` | Thunder Drake | Drake draconique avec foudre dans les ailes — teintes gris-violet, éclairs yellow. |
| `enemy_chain_revenant.png` | Chain Revenant | Esprit électrocuté — silhouette humaine avec des câbles électriques qui pénètrent le corps. |
| `enemy_volt_hound.png` | Volt Hound | Chien prédateur électrique — fourrure hérissée d'électricité, yeux jaunes, meute. |
| `enemy_arc_node.png` | Arc Node | Machine flottante — forme cylindrique ou sphérique mécanique, arcs électriques en idle. |
| `enemy_grid_architect.png` | Grid Architect | Construct à 6 bras — mécanique complexe, pièces mobiles, construisent d'autres machines en idle. |
| `enemy_storm_herald.png` | Storm Herald | Elite — humanoïde en armure de conducteur, arcs majeurs, dents de foudre autour de lui. |

#### Glaciem — Ennemis de Glace

| Fichier | Ennemi | Notes visuelles |
|---------|--------|-----------------|
| `enemy_frost_wolf.png` | Frost Wolf | Loup arctique — fourrure blanc-bleue, haleine visible, yeux bleu pâle. Pack. |
| `enemy_ice_golem.png` | Ice Golem | Golem de glace transparente — on voit la roche à l'intérieur. Blanc-bleu, opaque. |
| `enemy_blizzard_wraith.png` | Blizzard Wraith | Esprit de tempête — presque invisible dans un blizzard. Silhouette floue, yeux d'un bleu intense. |
| `enemy_permafrost_titan.png` | Permafrost Titan | Elite — géant préhistorique sorti du permafrost. Glace incrustée dans le corps, imposant. |
| `enemy_crystal_dragon.png` | Crystal Dragon | Elite — dragon de cristal de glace, facettes visibles, très translucide. Naturellement ancien. |
| `enemy_glacial_shaper.png` | Glacial Shaper | Figure bossue de glace bleue — mains qui dégagent une "flamme de givre", invocateur. |
| `enemy_hoarfrost_stalker.png` | Hoarfrost Stalker | Loup alpha — plus grand que frost_wolf, cicatrices de givre, allure plus lente et plus grave. |

#### Malachar's Spire — Ennemis d'Ombre

| Fichier | Ennemi | Notes visuelles |
|---------|--------|-----------------|
| `enemy_dark_revenant.png` | Dark Revenant | Esprit de magie noire — silhouette humaine avec "smoke" violet qui s'en échappe. |
| `enemy_shadow_construct.png` | Shadow Construct | Gardien mécanique d'ombre — machine sombre avec runes violettes incrustées. Patrouille. |
| `enemy_void_weaver.png` | Void Weaver | Araignée d'ombre à membres multiples — tisse des filaments de néant. Corps central petit, appendices longs. |
| `enemy_void_stalker.png` | Void Stalker | Prédateur de pure ombre — fine silhouette qui disparaît quand immobile (frame idle = quasi-invisible). |
| `enemy_void_sentinel.png` | Void Sentinel | Elite — gardien massif d'ombre, armure noire avec fissures violettes lumineuses. |

---

### 2.4 SPRITES BOSS

Les boss sont 64×64 px. Ils ont plus de frames par animation et sont visuellement plus complexes.

Structure d'animations par boss : idle (4 frames), phase 1 attack A (4 frames), phase 1 attack B (4 frames), phase 2 form (4 frames transition), phase 2 attack A (4 frames), death (8 frames).

| Fichier | Boss | Notes visuelles clés |
|---------|------|----------------------|
| `boss_pyrath.png` | Pyrath the Unbound | Dragon serpentaire de feu — pas quatre pattes, coils de serpent. Corps entier dans 64×64, tête dominante. Flammes qui jaillissent des écailles. Phase 2 : corps entièrement en feu. |
| `boss_gorvun.png` | Gorvun the Trembling | Titan de pierre — silhouette humanoïde massive, peau de roche stratifiée, yeux de magma rouge. Il TREMBLE à l'idle. Phase 2 : des fragments de lui se détachent mais il reste entier. |
| `boss_sylvael.png` | Sylvael the Tempest | Phénix — ailes déployées dominantes dans le sprite, plumage de lumière bleue-blanche. Trop beau pour son état. Phase 2 : plumes déchirées, couleurs qui s'assombrissent. |
| `boss_thalymor.png` | Thalymor the Deluge | Léviathan — serpent marin colossal. Dans 64×64 : corps courbé visible, tête en avant. Bioluminescent, bleu abyssal. Phase 2 : eau qui le couvre entièrement. |
| `boss_volkran.png` | Volkran the Stormbringer | Colosse humanoid de foudre — corps fait d'arcs électriques condensés. Yeux de plasma. Phase 2 : arcs qui partent dans tous les sens. |
| `boss_crysthea.png` | Crysthea the Frozen | Déesse de glace — forme humanoïde gracieuse, cristaux qui émanent d'elle, couronne de glace. La plus ancienne — son design doit le montrer. Phase 2 : cristaux qui se multiplient, elle se "gèle" elle-même. |
| `boss_malachar.png` | Malachar the Unbound | Homme en robe sombre — PAS un monstre. Silhouette humaine avec bâton. Phase 1 : contrôlé, élégant. Phase 2 : les 6 éléments éclatent de lui. Phase 3 : son apparence se fragmente, on voit l'homme derrière le pouvoir. |

---

### 2.5 SPRITES NPCs PRINCIPAUX — Grievy Town

Les NPCs principaux de Grievy Town sont 32×32 px pour le sprite in-game et 64×64 px pour les portraits de dialogue.

| Fichier sprite | Fichier portrait | NPC | Notes visuelles |
|----------------|-----------------|-----|-----------------|
| `npc_aldric.png` | `portrait_aldric.png` | Aldric | Homme fort d'âge moyen, bûcheron. Hache visible sur le dos. Vêtements simples et robustes. Regard direct. |
| `npc_mira.png` | `portrait_mira.png` | Mira | Femme d'âge moyen, herboriste. Tablier, herbes pendues à la ceinture, regard inquiet mais doux. |
| `npc_theron.png` | `portrait_theron.png` | Theron | Forgeron imposant. Tablier de cuir, bras forts, marteau à la ceinture. Regard professionnel. |
| `npc_ysolde.png` | `portrait_ysolde.png` | Ysolde | Marchande d'âge moyen. Habits de commerçante, regard observateur, une légère malice. |
| `npc_brother_ovan.png` | `portrait_brother_ovan.png` | Brother Ovan | Érudit/prêtre. Robe de moine, lunettes (anachronisme assumé), tas de livres. Regard pensif. |
| `npc_liria.png` | `portrait_liria.png` | Liria | Aubergiste. Habits pratiques d'intérieur, tablier, carnet de notes. Regard attentif, discret. |
| `npc_kelvar.png` | `portrait_kelvar.png` | Kelvar | Capitaine de garde. Armure partielle, épée au côté. Regard de quelqu'un habitué à porter des responsabilités. |
| `npc_elara.png` | `portrait_elara.png` | Elara | Mystérieuse. Vieille femme ou pas si vieille — temps difficile à lire. Vêtements de glace et d'étude. Dans les caves de Glaciem depuis 30 ans. |

**Portraits de dialogue :** Les portraits NPC doivent être expressifs en 64×64. Un seul portrait de base est requis, avec variants d'expression si possible (au moins neutre + triste pour les NPCs principaux dans la version finale).

---

### 2.6 NPCs DES ZONES (Towns secondaires)

Les NPCs de fond (`bgNpc`) utilisent le même sprite générique pour les arrière-plans. Les NPCs importants des villes secondaires ont leurs propres sprites.

#### Ashford (Ignis Reach)

| Sprite | Portrait | NPC |
|--------|----------|-----|
| `npc_brenn.png` | `portrait_brenn.png` | Brenn (Forgeron) — forgeron avec armure renforcée contre la chaleur |
| `npc_solenne.png` | `portrait_solenne.png` | Solenne (Marchande) — habits de marchande poussiéreux de cendres |
| `npc_ember_doc.png` | `portrait_ember_doc.png` | Vareth (Alchimiste) — habits de savant noircis de fumée |
| `npc_cinder_tailor.png` | `portrait_cinder_tailor.png` | Ash (Costumier) — habits teints de cendres, aiguilles dans les cheveux |
| `npc_ashford_guard_1.png` | — | Karol (Garde) — générique garde |
| `npc_ashford_refugee_1.png` | — | Tomas (Réfugié) — civil abîmé |
| `npc_ashford_child_1.png` | — | Linn (Enfant) — enfant de zone feu |
| `npc_ashford_elder.png` | — | Vieille Maren — vieille femme du peuple |
| `npc_ashford_miner.png` | — | Ruck (Mineur) — équipement de mine |
| `npc_ashford_healer.png` | — | Sira (Soigneuse) — habits simples de soignante |
| `npc_ashford_scout.png` | — | Dael (Eclaireur) — équipement léger de scout |

#### Pyrath's Crossing (Ignis Reach)

| Sprite | Portrait | NPC |
|--------|----------|-----|
| `npc_pyrath_smith.png` | `portrait_pyrath_smith.png` | Keld (Forgeron) |
| `npc_crossing_merchant.png` | `portrait_crossing_merchant.png` | Ila (Marchande) |
| `npc_crossing_alchemist.png` | `portrait_crossing_alchemist.png` | Pyrion (Alchimiste) |
| `npc_crossing_tailor.png` | `portrait_crossing_tailor.png` | Nessa (Costumière) |
| `npc_crossing_pilgrim_1.png` | — | Ancien Pèlerin |
| `npc_crossing_guard.png` | — | Garde Haruk |
| `npc_crossing_cook.png` | — | Melle (Cuisinière) |
| `npc_crossing_priest.png` | — | Frère (type Ovan) |
| `npc_crossing_refugee_2.png` | — | Harek |
| `npc_crossing_kid.png` | — | Piko (Enfant) |

#### Deepdelve (Terravast)

| Sprite | Portrait | NPC |
|--------|----------|-----|
| `npc_deepdelve_smith.png` | `portrait_deepdelve_smith.png` | Gorak (Forgeron) |
| `npc_deepdelve_merchant.png` | `portrait_deepdelve_merchant.png` | Duru (Marchande) |
| `npc_deepdelve_alchemist.png` | `portrait_deepdelve_alchemist.png` | Sable (Alchimiste) |
| `npc_deepdelve_tailor.png` | `portrait_deepdelve_tailor.png` | Roka (Costumière) |
| `npc_deepdelve_miner_1.png` | — | Ulv (Mineur) |
| `npc_deepdelve_guard_1.png` | — | Petra (Garde) |
| `npc_deepdelve_scholar.png` | — | Torsten (Érudit) |
| `npc_deepdelve_cook.png` | — | Mamie Helsa (Cuisinière) |
| `npc_deepdelve_child_1.png` | — | Brek (Enfant) |
| `npc_deepdelve_refugee.png` | — | Cara (Réfugiée) |

#### Stone Watch (Terravast)

| Sprite | Portrait | NPC |
|--------|----------|-----|
| `npc_stonewatch_smith.png` | `portrait_stonewatch_smith.png` | Brilda (Forgeronne) |
| `npc_stonewatch_merchant.png` | `portrait_stonewatch_merchant.png` | Orvin (Marchand) |
| `npc_stonewatch_alchemist.png` | `portrait_stonewatch_alchemist.png` | Petra (Alchimiste) |
| `npc_stonewatch_tailor.png` | `portrait_stonewatch_tailor.png` | Veth (Costumier) |
| `npc_stonewatch_guard_1.png` | — | Hrolk (Garde) |
| `npc_stonewatch_watcher.png` | — | Olde (Sentinelle) |
| `npc_stonewatch_scholar.png` | — | Dram (Érudit) |
| `npc_stonewatch_child.png` | — | Kessa (Enfant) |
| `npc_stonewatch_refugee_1.png` | — | Lort (Réfugié) |
| `npc_stonewatch_cook.png` | — | Wura (Cuisinière) |

#### Windherald (Zephyr Peaks)

| Sprite | Portrait | NPC |
|--------|----------|-----|
| `npc_windherald_smith.png` | `portrait_windherald_smith.png` | Ayle (Forgeronne) |
| `npc_windherald_merchant.png` | `portrait_windherald_merchant.png` | Cira (Marchande) |
| `npc_windherald_alchemist.png` | `portrait_windherald_alchemist.png` | Zael (Alchimiste) |
| `npc_windherald_tailor.png` | `portrait_windherald_tailor.png` | Syl (Costumière) |
| `npc_windherald_keeper.png` | — | Keeped Aerin |
| `npc_windherald_scholar.png` | — | Mireth |
| `npc_windherald_child.png` | — | Nilo (Enfant) |
| `npc_windherald_guard_2.png` | — | Taven (Garde) |
| `npc_windherald_pilgrim.png` | — | Ancien Pèlerin du Vent |
| `npc_windherald_farmer.png` | — | Brisl (Fermier) |

#### Cloudspire (Zephyr Peaks)

| Sprite | Portrait | NPC |
|--------|----------|-----|
| `npc_cloudspire_smith.png` | `portrait_cloudspire_smith.png` | Tevan (Forgeron) |
| `npc_cloudspire_merchant.png` | `portrait_cloudspire_merchant.png` | Liss (Marchande) |
| `npc_cloudspire_alchemist.png` | `portrait_cloudspire_alchemist.png` | Ara (Alchimiste) |
| `npc_cloudspire_tailor.png` | `portrait_cloudspire_tailor.png` | Fen (Costumier) |
| `npc_cloudspire_monk.png` | — | Moine Ivel |
| `npc_cloudspire_child.png` | — | Pella (Enfant) |
| `npc_cloudspire_guard_3.png` | — | Hadel (Garde) |
| `npc_cloudspire_watcher.png` | — | Serel |
| `npc_cloudspire_elderly.png` | — | Vieille Ari |
| `npc_cloudspire_engineer.png` | — | Bolt (Ingénieur) |

**Note :** Saltmourn (Abyssmar), Tidecove (Abyssmar), Voltspire (Volterra), Grimforge (Volterra), Frostholm (Glaciem), Crystalveil (Glaciem) ont des NPCs similaires en structure. Voir `src/data/npcs.ts` lignes 1065+ pour les listes complètes. La convention de nommage est identique : `npc_[id].png` / `portrait_[id].png`.

---

### 2.7 ICÔNES D'ITEMS

Toutes les icônes d'items sont **16×16 px** (ou 32×32 pour les weapons/armor importantes). Format unique par item.

#### Armes

| Fichier | Item |
|---------|------|
| `item_iron_sword.png` | Épée de fer — simple, reconnaissable |
| `item_steel_sword.png` | Épée d'acier — même forme, métal plus brillant |
| `item_storm_sword.png` | Épée de tempête — éclairs sur la lame |
| `item_dragonfang_sword.png` | Dragonfang — couleur de lave, forme de dent de dragon |
| `item_velmara_blade.png` | Lame de Velmara — multicolore (change d'élément) |
| `item_echo_blade.png` | Echo Blade — dupliquée dans l'icône |
| `item_magma_greatsword.png` | Greatsword de magma — grand, lourd visuellement |
| `item_colossus_greatsword.png` | Greatsword du Colosse — décombres dans la forme |
| `item_titan_greatsword.png` | Greatsword du Titan de glace — glace dans la lame |
| `item_fire_staff.png` | Bâton de feu (Ember Staff) |
| `item_leviathan_staff.png` | Bâton Léviathan — os marin |
| `item_memory_staff.png` | Bâton des Souvenirs — glace + lumière |
| `item_crystal_staff.png` | Crystal Fang Staff |
| `item_herald_staff.png` | Herald's Conduit — conducteur électrique |
| `item_malachars_staff.png` | Bâton de Malachar — noir, toutes les couleurs élémentaires en fissure |
| `item_harpy_bow.png` | Arc Harpy — plumes de vent |
| `item_sky_bow.png` | Sky Titan Bow — énorme, primitif |
| `item_phoenix_bow.png` | Phoenix Bow — plumes de Sylvael |
| `item_shadow_dagger.png` | Dague d'Ombre |
| `item_depth_fang.png` | Depth Fang — croc de serpent marin |
| `item_malachar_blade.png` | Penknife de Malachar — sobre, pratique |
| `item_gorvun_hammer.png` | Marteau de Gorvun — fragment de dieu de terre |
| `item_volkran_hammer.png` | Core de Volkran — éclair condensé |
| `item_sentinel_sword.png` | Lame Sentinelle |
| `item_drowned_sword.png` | Épée du Chevalier Noyé |
| `item_cinder_dagger.png` | Dague de Braise |
| `item_pyroclast_bow.png` | Arc Pyroclaste |
| `item_stone_dagger.png` | Dague de Pierre |
| `item_seismic_staff.png` | Sceptre Sismique |
| `item_gale_dagger.png` | Dague du Vent |
| `item_wind_greatsword.png` | Espadon des Rafales |
| `item_tide_staff.png` | Bâton des Marées |
| `item_coral_sword.png` | Épée de Corail |
| `item_arc_sword.png` | Épée Arc Électrique |
| `item_thunder_bow.png` | Arc du Tonnerre |
| `item_frost_dagger.png` | Dague du Givre |
| `item_blizzard_gs.png` | Espadon des Blizzards |
| `item_shadow_staff.png` | Sceptre des Ombres |
| `item_void_bow.png` | Arc du Vide |
| `item_divine_sword.png` | Épée Sacrée |
| `item_wind_bow.png` | Arc des Sommets |
| `item_water_staff.png` | Bâton des Abysses |
| `item_thunder_staff.png` | Sceptre de Foudre |
| `item_frost_staff.png` | Sceptre de Givre |
| `item_earth_tome.png` | Tome de la Terre |
| `item_void_reaper.png` | Faucheur du Néant (Hidden) |
| `item_temporal_blade.png` | Lame Temporelle (Hidden) |
| `item_world_eater.png` | Bâton du Dévoreur de Mondes (Hidden) |
| `item_first_blade.png` | Épée Originelle (Hidden) |
| `item_soul_bow.png` | Arc des Âmes (Hidden) |

#### Armures

| Fichier | Item |
|---------|------|
| `item_leather_helm.png` | Heaume de cuir |
| `item_iron_helm.png` | Heaume de fer |
| `item_titan_helm.png` | Heaume du Titan de Magma |
| `item_leather_chest.png` | Plastron de cuir |
| `item_iron_chest.png` | Plastron de fer |
| `item_fire_chest.png` | Plastron Ignis |
| `item_crystal_chest.png` | Plastron de Cristal |
| `item_coral_chest.png` | Plastron de Corail |
| `item_pyrath_armor.png` | Plastron de Pyrath |
| `item_earth_armor.png` | Plastron de Gorvun |
| `item_abyssal_chest.png` | Plaque Abyssale |
| `item_storm_plate.png` | Plaque de Tempête Volkran |
| `item_glaciem_chest.png` | Plastron de Glaciem |
| `item_sentinel_armor.png` | Plaque Sentinelle du Vide |
| `item_permafrost_armor.png` | Armure de Permafrost |
| `item_herald_plate.png` | Plaque du Héraut |
| `item_unbound_robe.png` | Robe de Malachar |
| `item_pilgrim_robe.png` | Robe du Pèlerin |
| `item_dragon_chest.png` | Plastron Dragon de Cristal |
| `item_runic_armor.png` | Armure Runique |
| `item_seaguard_armor.png` | Armure de la Garde Marine |
| `item_glacial_shield.png` | Bouclier Glaciaire |
| `item_leather_boots.png` | Bottes de cuir |
| `item_serpent_boots.png` | Bottes Écaille de Serpent |
| `item_air_boots.png` | Bottes de Marcheur de l'Air |
| `item_obsidian_gauntlets.png` | Gantelets d'Obsidienne |
| `item_eagle_cloak.png` | Cape d'Aigle de Tempête |
| `item_tempest_cloak.png` | Cape de Tempête |
| `item_tidal_cape.png` | Cape Coquille de Marée |
| `item_leather_legs.png` | Jambières de Cuir |
| `item_iron_legs.png` | Jambières de Fer |
| `item_fire_legs.png` | Jambières Ignées |
| `item_earth_legs.png` | Braconnières de Pierre |
| `item_wind_legs.png` | Jambières des Rafales |
| `item_water_legs.png` | Jambières Corallines |
| `item_lightning_legs.png` | Jambières Conductrices |
| `item_ice_legs.png` | Braies Givrées |
| `item_leather_gloves.png` | Gants de Cuir |
| `item_iron_gauntlets.png` | Gantelets de Fer |
| `item_wind_gloves.png` | Gants des Rafales |
| `item_frost_gauntlets.png` | Gantelets de Givre |
| `item_fire_helm.png` | Heaume Igné |
| `item_earth_helm.png` | Heaume de Terravast |
| `item_wind_helm.png` | Heaume du Vent |
| `item_water_helm.png` | Heaume Marin |
| `item_lightning_helm.png` | Heaume du Foudroiement |
| `item_dark_helm.png` | Heaume du Vide |
| `item_iron_boots.png` | Bottes de Fer |
| `item_fire_boots.png` | Bottes Ignées |
| `item_wind_boots.png` | Bottes du Vent |
| `item_void_boots.png` | Bottes du Vide |
| `item_fire_cape.png` | Cape de Cendres |
| `item_earth_cape.png` | Cape de Rune |
| `item_water_cape.png` | Cape des Profondeurs |
| `item_ice_cape.png` | Cape du Blizzard |
| `item_dark_cape.png` | Cape des Ombres |
| `item_divine_cape.png` | Cape de Lumière |
| `item_undying_plate.png` | Armure de l'Indestructible (Hidden) |
| `item_mirror_helm.png` | Heaume du Miroir (Hidden) |

#### Accessoires

| Fichier | Item |
|---------|------|
| `item_flame_ring.png` | Anneau de Braises |
| `item_sailor_ring.png` | Anneau du Marin Perdu |
| `item_revenant_ring.png` | Anneau du Revenant à Chaîne |
| `item_eternal_ring.png` | Anneau de Flamme Éternelle |
| `item_wind_ring.png` | Anneau du Vent |
| `item_tidal_ring.png` | Anneau des Marées |
| `item_storm_ring.png` | Oeil de la Tempête |
| `item_preservation_ring.png` | Anneau de Préservation |
| `item_unbound_ring.png` | Anneau du Déchaîné |
| `item_shadow_ring.png` | Anneau d'Ombre |
| `item_wraith_band.png` | Bague du Revenant |
| `item_blizzard_amulet.png` | Amulette du Revenant Blizzard |
| `item_frozen_heart.png` | Coeur Gelé |
| `item_drake_fang.png` | Pendentif Croc de Drake |
| `item_eternity_ring.png` | Anneau de l'Éternité (Hidden) |
| `item_fate_amulet.png` | Amulette du Destin (Hidden) |

#### Consommables

| Fichier | Item |
|---------|------|
| `item_hp_minor.png` | Petite Potion de Vie (flacon rouge petit) |
| `item_hp_normal.png` | Potion de Vie (flacon rouge moyen) |
| `item_hp_major.png` | Grande Potion de Vie (flacon rouge grand) |
| `item_elixir_hp.png` | Élixir de Vitalité (flacon dorée) |
| `item_mp_minor.png` | Petite Potion de Mana (flacon bleu petit) |
| `item_mp_normal.png` | Potion de Mana (flacon bleu moyen) |
| `item_mp_major.png` | Grande Potion de Mana (flacon bleu grand) |
| `item_elixir_mp.png` | Élixir d'Arcane (flacon bleu-doré) |
| `item_full_elixir.png` | Élixir Complet (flacon pourpre — combiné) |
| `item_revive.png` | Cristal de Revie (cristal blanc lumineux) |
| `item_antidote.png` | Antidote (flacon vert) |
| `item_bread.png` | Pain d'Aldric (pain simple, chaleureux) |

#### Matériaux

| Fichier | Item | Zone |
|---------|------|------|
| `item_ember_core.png` | Noyau d'Ember | Feu |
| `item_obsidian.png` | Éclat d'Obsidienne | Feu |
| `item_volcanic_ash.png` | Cendre Volcanique | Feu |
| `item_pyrath_scale.png` | Écaille de Pyrath | Feu |
| `item_terravast_crystal.png` | Cristal de Terravast | Terre |
| `item_stone_rune.png` | Rune de Pierre Ancienne | Terre |
| `item_cave_moss.png` | Mousse des Cavernes | Terre |
| `item_gorvun_fragment.png` | Fragment de Gorvun | Terre |
| `item_colossus_core.png` | Noyau de Colosse | Terre |
| `item_zephyr_feather.png` | Plume de Zephyr | Vent |
| `item_stormstone.png` | Pierretemps | Vent |
| `item_cloudweave.png` | Soie de Nuage | Vent |
| `item_sylvael_plume.png` | Plume de Sylvael | Vent |
| `item_deep_coral.png` | Corail Profond | Eau |
| `item_drowned_relic.png` | Relique Noyée | Eau |
| `item_sea_glass.png` | Verre de Mer | Eau |
| `item_thalymor_scale.png` | Écaille de Thalymor | Eau |
| `item_storm_shard.png` | Éclat de Tempête | Foudre |
| `item_charged_metal.png` | Métal Chargé | Foudre |
| `item_thunder_rune.png` | Rune de Tonnerre | Foudre |
| `item_volkran_coil.png` | Bobine de Volkran | Foudre |
| `item_volt_pelt.png` | Fourrure de Volt Hound | Foudre |
| `item_ice_shard.png` | Éclat de Glace de Glaciem | Glace |
| `item_frost_rune.png` | Rune de Givre Ancienne | Glace |
| `item_frozen_essence.png` | Essence Gelée | Glace |
| `item_crysthea_splinter.png` | Éclat de Crysthea | Glace |
| `item_wolf_pelt.png` | Fourrure de Loup Givre | Glace |
| `item_wolf_fur.png` | Fourrure Fine de Loup Givre | Glace |
| `item_dark_essence.png` | Essence Sombre | Ombre |
| `item_void_shard.png` | Éclat du Vide | Ombre |
| `item_corrupted_rune.png` | Rune Corrompue | Ombre |
| `item_construct_core.png` | Noyau de Construct | Ombre |
| `item_pyrath_heart.png` | Noyau du Coeur de Pyrath | Mythique |
| `item_fragment_permanence.png` | Fragment de Permanence | Terre |
| `item_moonpetal.png` | Herbe Lunaire | Neutre |
| `item_bird_feather.png` | Plume d'Oiseau | Neutre |
| `item_ash_residue.png` | Résidu de Cendre | Feu |
| `item_iron_ore.png` | Minerai de Fer | Neutre |
| `item_pearl.png` | Perle d'Abyssmar | Eau |
| `item_storm_glass.png` | Verre de Tempête | Foudre |
| `item_icebloom.png` | Fleur de Givre | Glace |
| `item_void_crystal.png` | Cristal du Vide | Ombre |
| `item_tome_page.png` | Page de Tome Ancien | Neutre |
| `item_herb.png` | Herbe Sauvage | Neutre |
| `item_wild_root.png` | Racine Sauvage | Neutre |
| `item_rope.png` | Corde | Neutre |
| `item_coal.png` | Charbon | Feu |
| `item_fire_crystal.png` | Cristal de Feu | Feu |
| `item_ash_herb.png` | Herbe des Cendres | Feu |
| `item_fire_essence.png` | Essence de Feu | Feu |
| `item_earth_crystal.png` | Cristal de Terre | Terre |
| `item_deepstone.png` | Pierre Profonde | Terre |
| `item_mana_crystal.png` | Cristal de Mana | Neutre |
| `item_ancient_rune.png` | Rune Ancienne | Terre |
| `item_cave_mushroom.png` | Champignon des Caves | Terre |
| `item_wind_crystal.png` | Cristal de Vent | Vent |
| `item_skystone.png` | Pierre du Ciel | Vent |
| `item_wind_flower.png` | Fleur du Vent | Vent |
| `item_cloud_herb.png` | Herbe Nuageuse | Vent |
| `item_phoenix_feather.png` | Plume de Phénix | Vent |
| `item_sea_kelp.png` | Varech Marin | Eau |
| `item_thalymor_shard.png` | Éclat de Thalymor | Eau |
| `item_leviathan_scale.png` | Écaille de Léviathan | Eau |
| `item_volt_crystal.png` | Cristal Voltaïque | Foudre |
| `item_copper_coil.png` | Bobine de Cuivre | Foudre |
| `item_refined_copper.png` | Cuivre Raffiné | Foudre |
| `item_chaos_crystal.png` | Cristal du Chaos | Ombre |

#### Key Items

| Fichier | Item |
|---------|------|
| `item_grimoire.png` | Grimoire de Malachar — livre noir épais |
| `item_letter.png` | Lettre d'Aldric — enveloppe pliée |
| `item_archive_key.png` | Clé des Archives de Glace |
| `item_stone_scroll.png` | Parchemin de Pierre |
| `item_aldric_medallion.png` | Médaillon d'Aldric |
| `item_family_photo.png` | Photo de Famille |
| `item_seal.png` | Sceau d'Ashford |
| `item_gem.png` | Gemme de Deepdelve |
| `item_map.png` | Carte des Marées |
| `item_blueprint.png` | Schéma du Circuit |
| `item_wooden_horse.png` | Cheval de Bois |
| `item_ice_tablet.png` | Tablette d'Archive Glaciale |
| `item_research_page.png` | Page de Recherche |
| `item_dark_tome.png` | Tome des Ombres |
| `item_malachar_notes.png` | Notes de Malachar |

---

### 2.8 ICÔNES DE SKILLS (HUD)

Toutes les icônes de skills sont **32×32 px**. Elles apparaissent dans le HUD en bas d'écran.

| Fichier | Skill | Couleur dominante |
|---------|-------|------------------|
| `skill_dash.png` | Dash | Blanc/neutre — silhouette en mouvement |
| `skill_echo_strike.png` | Echo Strike | Doré/divin — énergie pure |
| `skill_fireball.png` | Fireball | Rouge-orange — boule de feu |
| `skill_flame_dash.png` | Flame Dash | Orange — traîne de feu |
| `skill_inferno_burst.png` | Inferno Burst | Rouge vif — anneau de feu |
| `skill_stone_shield.png` | Stone Shield | Brun/gris — bouclier de pierre |
| `skill_seismic_slam.png` | Seismic Slam | Brun — onde de choc |
| `skill_terra_surge.png` | Terra Surge | Brun-vert — pics de terre |
| `skill_gale_step.png` | Gale Step | Bleu clair — silhouette en téléport |
| `skill_tornado_spin.png` | Tornado Spin | Bleu-blanc — tornade |
| `skill_skyward_strike.png` | Skyward Strike | Bleu clair/or — frappe céleste |
| `skill_tidal_wave.png` | Tidal Wave | Bleu — vague |
| `skill_healing_current.png` | Healing Current | Bleu-vert — courant guérisseur |
| `skill_frost_lance.png` | Frost Lance | Bleu glacé — lance de glace |
| `skill_thunder_bolt.png` | Thunder Bolt | Jaune électrique — éclair |
| `skill_chain_lightning.png` | Chain Lightning | Jaune — chaîne d'éclairs |
| `skill_volt_dash.png` | Volt Dash | Jaune-blanc — téléport électrique |
| `skill_frost_nova.png` | Frost Nova | Blanc-bleu — explosion de glace |
| `skill_blizzard.png` | Blizzard | Bleu pale — nuage de blizzard |
| `skill_ice_barrier.png` | Ice Barrier | Bleu-blanc — murs de glace |
| `skill_soul_echo.png` | Soul Echo | Doré/violet — passif, éclat d'âme |
| `skill_void_step.png` | Void Step | Noir-violet — portail dimensionnel |
| `skill_prism_burst.png` | Prism Burst | Arc-en-ciel — explosion multi-élémentaire |
| `skill_elaras_gift.png` | Elara's Gift | Bleu-vert doux — passif, goutte d'eau |

---

### 2.9 DÉCORS & PROPS

#### Props génériques (toutes zones)

| Fichier | Description | Dimensions |
|---------|-------------|------------|
| `prop_campfire.png` | Campfire (point de save) — flammes animées (4 frames) | 32×32 |
| `prop_chest_closed.png` | Coffre fermé | 32×32 |
| `prop_chest_open.png` | Coffre ouvert (après interaction) | 32×32 |
| `prop_shrine.png` | Sanctuaire — animé, pulsation lumineuse (4 frames) | 32×32 |
| `prop_plant_collectible.png` | Plante/herbe récoltable — légèrement brillante | 16×16 |
| `prop_plant_harvested.png` | Plante récoltée (sans ressource) | 16×16 |
| `prop_mineral_node.png` | Noeud de minéral générique | 16×16 |
| `prop_mineral_depleted.png` | Noeud épuisé | 16×16 |
| `prop_sign.png` | Panneau directionnel médiéval | 32×16 |
| `prop_tree_1.png` | Arbre générique (décor bloquant) | 32×48 |
| `prop_tree_2.png` | Arbre variant | 32×48 |
| `prop_rock_small.png` | Petit rocher (décor) | 16×16 |
| `prop_rock_medium.png` | Rocher moyen (bloquant) | 32×32 |
| `prop_rock_large.png` | Grand rocher (bloquant) | 32×48 |
| `prop_fence.png` | Clôture médiévale | 16×16 (tile) |
| `prop_crate.png` | Caisse en bois | 16×16 |
| `prop_barrel.png` | Tonneau | 16×16 |
| `prop_fountain.png` | Fontaine (décor Grievy Town) — animée (4 frames) | 32×32 |
| `prop_well.png` | Puits | 32×32 |

#### Props spécifiques par zone

| Fichier | Zone | Description |
|---------|------|-------------|
| `prop_ignis_obsidian_pillar.png` | Ignis Reach | Pilier d'obsidienne |
| `prop_ignis_lava_crack.png` | Ignis Reach | Fissure de lave (décor sol animé) |
| `prop_ignis_ember_shrine.png` | Ignis Reach | Sanctuaire de Pyrath dégradé |
| `prop_terra_crystal_formation.png` | Terravast | Formation de cristaux bioluminescents |
| `prop_terra_ancient_column.png` | Terravast | Colonne de rune ancienne |
| `prop_terra_glowing_mushroom.png` | Terravast | Champignon bioluminescent (décor) |
| `prop_zephyr_cloud_bridge.png` | Zephyr Peaks | Pont de nuage condensé |
| `prop_zephyr_sky_chain.png` | Zephyr Peaks | Chaîne qui maintient une île flottante |
| `prop_zephyr_cloud_temple_pillar.png` | Zephyr Peaks | Pilier de temple de nuage |
| `prop_abyssal_shipwreck.png` | Abyssmar | Épave de navire (décor) |
| `prop_abyssal_coral_arch.png` | Abyssmar | Arche de corail |
| `prop_abyssal_ruin_column.png` | Abyssmar | Colonne de ruine sous-marine |
| `prop_volt_pylon.png` | Volterra | Pylône électrique (debout ou tombé) |
| `prop_volt_capacitor.png` | Volterra | Condensateur industriel |
| `prop_volt_dead_machine.png` | Volterra | Machine de l'ère Volterra — éteinte |
| `prop_glaciem_ice_stalactite.png` | Glaciem | Stalactite de glace |
| `prop_glaciem_frozen_cart.png` | Glaciem | Charrette abandonnée gelée |
| `prop_glaciem_ice_archive.png` | Glaciem | Bloc d'archive de Crysthea |
| `prop_spire_dark_rune.png` | Malachar's Spire | Rune sombre de recherche |
| `prop_spire_research_notes.png` | Malachar's Spire | Notes éparpillées de Malachar |
| `prop_spire_void_crystal_cluster.png` | Malachar's Spire | Cluster de cristaux du Vide |

#### Props de Grievy Town spécifiques

| Fichier | Description |
|---------|-------------|
| `prop_gt_inn_sign.png` | Enseigne de l'auberge de Liria |
| `prop_gt_blacksmith_anvil.png` | Enclume de Theron |
| `prop_gt_market_stall.png` | Étal de marché (vide ou avec marchandises) |
| `prop_gt_chapel_pew.png` | Banc de chapelle de Brother Ovan |
| `prop_gt_stable_fence.png` | Clôture de l'écurie |
| `prop_gt_guard_post.png` | Poste de garde (tour minimale) |
| `prop_gt_memorial_statue.png` | Statue mémoriale (New Game+ seulement) |

---

### 2.10 EFFETS VISUELS (VFX)

Les VFX sont des spritesheets animées. Fond transparent obligatoire.

| Fichier | Effet | Frames | Dimensions |
|---------|-------|--------|------------|
| `vfx_hit_white.png` | Flash blanc d'impact physique | 3 frames | 48×16 |
| `vfx_hit_fire.png` | Hit élémentaire Feu (#ff4400) | 4 frames | 64×16 |
| `vfx_hit_earth.png` | Hit élémentaire Terre (#88aa33) | 4 frames | 64×16 |
| `vfx_hit_wind.png` | Hit élémentaire Vent (#aaddff) | 4 frames | 64×16 |
| `vfx_hit_water.png` | Hit élémentaire Eau (#2266ff) | 4 frames | 64×16 |
| `vfx_hit_lightning.png` | Hit élémentaire Foudre (#ffee00) | 4 frames | 64×16 |
| `vfx_hit_ice.png` | Hit élémentaire Glace (#88ddff) | 4 frames | 64×16 |
| `vfx_hit_dark.png` | Hit élémentaire Ombre (#8833cc) | 4 frames | 64×16 |
| `vfx_hit_critical.png` | Hit critique (flash jaune + plus grand) | 4 frames | 80×20 |
| `vfx_enemy_death.png` | Dissolution générique d'ennemi (flash → fondu) | 6 frames | 192×32 |
| `vfx_boss_death.png` | Dissolution de boss (plus longue, plus dramatique) | 10 frames | 640×64 |
| `vfx_xp_orb.png` | Orbe d'XP magnétique (vert, style Vampire Survivors) | 4 frames | 64×8 |
| `vfx_heal.png` | Effet de soin | 4 frames | 64×32 |
| `vfx_levelup.png` | Explosion de level up | 6 frames | 192×32 |
| `vfx_dash_afterimage.png` | Image fantôme du dash (légèrement transparente) | 1 frame | 32×32 |
| `vfx_fireball_projectile.png` | Projectile fireball en mouvement | 4 frames | 64×16 |
| `vfx_fireball_impact.png` | Explosion fireball | 6 frames | 192×32 |
| `vfx_flame_dash_trail.png` | Traîne de feu après Flame Dash | 4 frames | 64×16 |
| `vfx_inferno_burst_ring.png` | Anneau de feu d'Inferno Burst | 6 frames | 192×32 |
| `vfx_seismic_slam.png` | Onde de choc de Seismic Slam | 6 frames | 192×32 |
| `vfx_terra_surge_spike.png` | Pic de terre individuel | 4 frames | 64×32 |
| `vfx_tidal_wave.png` | Vague de Tidal Wave | 6 frames | 192×32 |
| `vfx_frost_lance_proj.png` | Projectile Frost Lance | 4 frames | 64×16 |
| `vfx_frost_lance_impact.png` | Impact Frost Lance | 4 frames | 64×32 |
| `vfx_thunder_bolt_proj.png` | Projectile Thunder Bolt | 4 frames | 64×16 |
| `vfx_chain_lightning.png` | Éclair de chaîne | 4 frames | 64×16 |
| `vfx_volt_dash_explosion.png` | Explosion électrique Volt Dash | 6 frames | 192×32 |
| `vfx_frost_nova_ring.png` | Anneau de Frost Nova | 6 frames | 192×32 |
| `vfx_blizzard_zone.png` | Zone de Blizzard (tileable) | 4 frames | 64×32 |
| `vfx_ice_barrier_wall.png` | Mur de glace d'Ice Barrier | 4 frames | 128×64 |
| `vfx_prism_burst.png` | Explosion Prism Burst (multicolore) | 8 frames | 512×64 |
| `vfx_boss_intro_aura.png` | Aura d'entrée de boss | 6 frames | 192×64 |
| `vfx_world_degrade.png` | Overlay de désaturation (appliqué en code mais peut être une texture) | 1 frame | 800×600 |
| `vfx_stagger_flash.png` | Flash rouge de stagger ennemi | 2 frames | 32×32 |
| `vfx_freeze.png` | Effet de gel sur cible | 4 frames | 64×32 |
| `vfx_slow.png` | Effet de ralenti sur cible | 3 frames | 48×32 |
| `vfx_stone_shield_active.png` | Bouclier de pierre actif | 4 frames | 64×64 |

---

### 2.11 ÉLÉMENTS D'INTERFACE UTILISATEUR

Ces éléments sont actuellement générés en code Phaser (drawRect, drawPanel). Les sprites suivants permettraient une interface plus polish.

**Priorité 2 — le jeu fonctionne sans eux, ils améliorent l'expérience.**

| Fichier | Description | Dimensions |
|---------|-------------|------------|
| `ui_healthbar_bg.png` | Fond de barre de vie | 200×12 |
| `ui_healthbar_fill.png` | Remplissage HP (9-slice ou scalable) | 200×12 |
| `ui_manabar_bg.png` | Fond de barre de mana | 200×12 |
| `ui_manabar_fill.png` | Remplissage MP | 200×12 |
| `ui_xpbar_bg.png` | Fond de barre d'XP | 780×8 |
| `ui_xpbar_fill.png` | Remplissage XP | 780×8 |
| `ui_skill_slot.png` | Cadre de slot de compétence | 40×40 |
| `ui_skill_slot_active.png` | Slot de compétence activé | 40×40 |
| `ui_skill_cooldown_overlay.png` | Overlay grisé pour cooldown | 40×40 |
| `ui_dialogue_box.png` | Boîte de dialogue 9-slice | 720×120 |
| `ui_dialogue_portrait_frame.png` | Cadre de portrait NPC | 72×72 |
| `ui_inventory_panel.png` | Panneau d'inventaire | 400×500 |
| `ui_inventory_slot.png` | Slot d'item dans inventaire | 36×36 |
| `ui_inventory_slot_hover.png` | Slot hover | 36×36 |
| `ui_item_panel.png` | Panneau de détail d'item | 250×300 |
| `ui_rarity_border_common.png` | Bordure grise (Common) | 36×36 |
| `ui_rarity_border_uncommon.png` | Bordure verte (Uncommon) | 36×36 |
| `ui_rarity_border_rare.png` | Bordure bleue (Rare) | 36×36 |
| `ui_rarity_border_epic.png` | Bordure violette (Epic) | 36×36 |
| `ui_rarity_border_legendary.png` | Bordure dorée (Legendary) | 36×36 |
| `ui_rarity_border_mythic.png` | Bordure rouge (Mythic) | 36×36 |
| `ui_rarity_border_hidden.png` | Bordure or-noir (Hidden) | 36×36 |
| `ui_minimap_bg.png` | Fond de minimap | 150×150 |
| `ui_button_normal.png` | Bouton UI standard | 200×40 |
| `ui_button_hover.png` | Bouton UI hover | 200×40 |
| `ui_button_pressed.png` | Bouton UI pressé | 200×40 |

---

### 2.12 SKINS (Costumier)

Chaque skin est un remplacement visuel du sprite du joueur dans la zone de slot correspondante.

| Fichier | Skin | Slot |
|---------|------|------|
| `skin_ember_cloak.png` | Manteau des Cendres (icône 32×32) | Cape |
| `skin_crystal_regalia.png` | Tenue des Cristaux (icône 32×32) | Chest |
| `skin_storm_vestments.png` | Habit des Tempêtes (icône 32×32) | Chest |
| `skin_abyssal_robe.png` | Robe Abyssale (icône 32×32) | Chest |
| `skin_frost_shroud.png` | Linceul de Givre (icône 32×32) | Chest |
| `skin_pilgrim_garb.png` | Vêtement du Pèlerin (icône 32×32) | Chest |
| `skin_divine_vestments.png` | Vêtements Divins (icône 32×32) | Chest |
| `skin_void_mantle.png` | Manteau du Vide (icône 32×32) | Cape |
| `skin_lightning_helm.png` | Casque Spire de Foudre (icône 32×32) | Helm |
| `skin_glaciem_crown.png` | Couronne de Glaciem (icône 32×32) | Helm |

Les fichiers `vis_[id].png` correspondants sont les sprites complets du joueur avec le skin appliqué (même convention de spritesheet que le joueur normal).

---

### 2.13 LOOTABLES (Objets interactifs dans les zones)

| Fichier | Type | Description |
|---------|------|-------------|
| `loot_chest.png` | Coffre | 32×32, 2 frames (fermé / ouvert) |
| `loot_mineral.png` | Minéral | 16×16, brillant. Couleur variable par zone |
| `loot_plant.png` | Plante | 16×16, plante collectible stylisée |
| `loot_shrine.png` | Sanctuaire | 32×32, pulsant (4 frames), doré |

---

## SECTION 3 : NOTES PRIORITAIRES

**Priorité 1 (MVP jouable) :**
- Sprites joueur (toutes directions, walk + idle + attack)
- 3 tilesets de sol (Grievy Town, Ignis Reach, Terravast)
- 5 sprites ennemis (ember_wyrm, lava_golem, stone_crawler, crystal_golem, cave_lurker)
- 2 sprites boss (pyrath, gorvun)
- NPCs principaux de Grievy Town (Aldric, Mira, Kelvar, Theron + portraits)
- VFX de hit (white + fire + earth)
- Icônes skills de base (dash, echo_strike, fireball, stone_shield)

**Priorité 2 (Version complète jouable) :**
- Tous les ennemis des 6 zones
- Tous les tilesets de sol et de mur
- Tous les boss
- Tous les NPCs de zones secondaires
- Toutes les icônes d'items
- VFX complets

**Priorité 3 (Polish) :**
- Sprites UI (actuellement générés en code)
- Animations de props
- Skins du Costumier
- Variations dégradées de zones
