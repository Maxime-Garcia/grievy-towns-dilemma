# Traçabilité des assets réels — bundle ELV Games

Ce fichier trace, pour chaque asset réellement intégré dans `public/assets/`,
d'où il vient dans la bibliothèque source (`assets/Bundle_extracted/`, non
versionnée — voir `.gitignore`). Objectif : pouvoir toujours remonter à
l'origine (licence, pack, fichier précis) sans avoir à fouiller 229 dossiers.

Convention : un tableau par catégorie de `public/assets/sprites/`, une ligne
par fichier intégré. Mettre à jour ce fichier à chaque nouvel asset ajouté.

Licence (identique sur tout le bundle, vérifiée sur ~190 `License.txt`) :
usage personnel/commercial libre, modification libre, crédit ElvGames apprécié.
Interdits : entraînement IA, crypto/NFT, revente même modifiée. Détail complet :
https://elvgames.itch.io/terms

---

## `player/` — Héros

| Fichier destination | Pack source | Fichier source | Notes |
|---|---|---|---|
| `player_idle.png` | Characters Pack 06 - Fantasy Dreamland | `Sprites/fdr_character_012_idle.png` | Perso #012 (armure sombre) — 96×96, grille 4×4 (24px/frame), lignes bas/gauche/droite/haut |
| `player_walk.png` | Characters Pack 06 - Fantasy Dreamland | `Sprites/fdr_character_012_walk.png` | Idem, 96×96 |
| `player_attack.png` | Characters Pack 06 - Fantasy Dreamland | `Sprites/fdr_character_012_attack.png` | Idem mais 128×128 (32px/frame — plus grand à cause de l'arme) |
| `player_dead.png` | Characters Pack 06 - Fantasy Dreamland | `Sprites/fdr_character_012_dead.png` | Idem, 96×96 |

## `npcs/`, `npcs/portraits/` — PNJ (Grievy Town)

Même pack que le héros (Characters Pack 06), idle+walk uniquement (PNJ sans combat).

| PNJ (id) | Fichier destination | Perso source | Notes |
|---|---|---|---|
| `aldric` | `npc_aldric_idle.png` / `_walk.png` | `fdr_character_017` | Aîné barbu — aspect sage/mentor |
| `brother_ovan` | `npc_brother_ovan_idle.png` / `_walk.png` | `fdr_character_009` | Robe bleue — allure de prêtre |
| `kelvar` | `npc_kelvar_idle.png` / `_walk.png` | `fdr_character_003` | Garde porte nord |
| `theron` | `npc_theron_idle.png` / `_walk.png` | `fdr_character_026` | Forgeron |
| `liria` | `npc_liria_idle.png` / `_walk.png` | `fdr_character_005` | Marché |
| `mira` | `npc_mira_idle.png` / `_walk.png` | `fdr_character_014` | Herboriste |
| `ysolde` | `npc_ysolde_idle.png` / `_walk.png` | `fdr_character_022` | Aubergiste |

*(portraits de dialogue : pas encore intégrés)*

## `enemies/` — Ennemis & boss (54 entrées : 47 réguliers/élites + 7 boss)

Pack principal : **Enemy Sprites Pack 1-4 [Rogue Adventure]** (24 créatures
génériques `Enemy_01`–`Enemy_24`, 4 variantes de couleur A-D, frames
individuelles 32×32 ou 48×48 selon la créature : `Idle/Walk/Attack/Damage/
Dead_{1-6}.png`). Boss : **Molarbeast Boss [Rogue Adventure]** (48×48) et
**Titan Guard Boss [Rogue Adventure]** (80×80), même convention d'états mais
`Attack1`/`Attack2` au lieu de `Attack` (seul `Attack1` est utilisé, mappé sur
l'état `attack`).

Chaque `enemy_<id>_{idle,walk,attack,damage,dead}.png` est un strip 6 frames
généré par recolor HSV (rotation de teinte ou colorisation absolue selon la
saturation native de la source) — script `assemble_enemies.js` +
`final_mapping.js` (scratchpad de session, non versionnés dans le repo).
Deux modes de recolor :
- **rotate** : `hueDeg` est un delta ajouté à la teinte native de la source
  (mesurée par échantillonnage HSV pondéré saturation×valeur) ; `satMult`/
  `valMult` multiplient saturation/valeur existantes. Utilisé sur les sources
  déjà colorées (peau verte, bleue…).
- **colorize** : `hue` est une teinte cible absolue, `satTarget` remplace la
  saturation entièrement (préserve seulement la luminance pour le shading).
  Utilisé sur les sources quasi grises (aucune teinte à faire pivoter).

**Erreur de catalogue corrigée en session** : la session précédente avait
identifié `Enemy_21` comme un "fantôme/linceul gris" — décodage pixel par
pixel révèle en fait une créature accroupie brandissant une lame/griffe
courbe bleu-gris. Le vrai sprite de fantôme/wraith à capuche (silhouette
encapuchonnée, œil rouge unique) est `Enemy_20`. `Enemy_10` (cataloguée
"humanoïde sombre") est en réalité un petit chat/imp vert. `Enemy_23`/`24`
(cataloguées "chevalier var." et "chauve-souris var.") sont en fait une même
famille de spectre pâle hagard à griffe, distincte du chevalier `Enemy_22`.
Toutes les réutilisations ont été corrigées avant génération — voir tableaux
ci-dessous pour le mapping final vérifié visuellement (contact sheets
Idle/Walk/Attack par lot de 6, upscale ×4-6, inspection pixel par pixel).

### Ignis Reach (FIRE)

| Enemy id | Source | Recolor |
|---|---|---|
| ember_wyrm | Enemy_05_A | colorize hue=15° satTarget=0.75 valMult=2.3 |
| lava_golem | Enemy_19_A | rotate hueDeg=14 satMult=1.3 valMult=1.1 |
| cinder_sprite | Enemy_08_A | rotate hueDeg=0 satMult=1 valMult=1 |
| ash_revenant | Enemy_20_A | rotate hueDeg=13 satMult=1.4 valMult=1 |
| magma_titan (elite) | Enemy_15_A | rotate hueDeg=-135 satMult=1 valMult=1.15 |
| ember_broodmother | Enemy_10_A | rotate hueDeg=-135 satMult=1 valMult=1.2 |
| scorch_sentinel | Enemy_22_A | rotate hueDeg=-9 satMult=1.6 valMult=1 |
| pyrath_boss (boss) | Molarbeast Boss [A] | rotate hueDeg=21 satMult=1.2 valMult=1.05 |

### Terravast (EARTH)

| Enemy id | Source | Recolor |
|---|---|---|
| stone_crawler | Enemy_13_A | rotate hueDeg=-115 satMult=0.65 valMult=0.95 |
| crystal_golem | Enemy_06_A | rotate hueDeg=47 satMult=0.9 valMult=1 |
| cave_lurker | Enemy_16_A | rotate hueDeg=274 satMult=0.9 valMult=0.75 |
| terravast_serpent | Enemy_09_A | rotate hueDeg=-117 satMult=0.7 valMult=0.95 |
| rune_shard_ghost | Enemy_04_A | colorize hue=110° satTarget=0.55 valMult=2.2 |
| stone_hound | Enemy_02_A | colorize hue=32° satTarget=0.5 valMult=1.6 |
| ruin_colossus (elite) | Enemy_15_A | rotate hueDeg=-118 satMult=0.5 valMult=0.85 |
| gorvun_boss (boss) | Titan Guard Boss [A] | rotate hueDeg=26 satMult=1.1 valMult=0.95 |

### Zephyr Peaks (WIND)

| Enemy id | Source | Recolor |
|---|---|---|
| gale_harpy | Enemy_05_A | colorize hue=195° satTarget=0.3 valMult=2.4 |
| storm_eagle | Enemy_17_A | rotate hueDeg=-164 satMult=1.2 valMult=1.3 |
| wind_wraith | Enemy_20_A | rotate hueDeg=193 satMult=0.9 valMult=1.1 |
| cyclone_sprite | Enemy_12_A | rotate hueDeg=0 satMult=0.55 valMult=1.15 |
| sky_titan (elite) | Enemy_05_A | colorize hue=195° satTarget=0.25 valMult=2.6 |
| storm_caller | Enemy_18_A | colorize hue=195° satTarget=0.35 valMult=2.2 |
| cloudpiercer | Enemy_11_A | rotate hueDeg=55 satMult=0.75 valMult=1.2 |
| sylvael_boss (boss) | Molarbeast Boss [A] | rotate hueDeg=201 satMult=0.7 valMult=1.3 |

### Abyssmar (WATER)

| Enemy id | Source | Recolor |
|---|---|---|
| tide_crawler | Enemy_14_A | rotate hueDeg=63 satMult=1 valMult=1 |
| sea_wraith | Enemy_20_A | rotate hueDeg=210 satMult=0.9 valMult=1 |
| coral_golem | Enemy_13_A | rotate hueDeg=203 satMult=0.55 valMult=1.2 |
| depth_serpent | Enemy_21_A | rotate hueDeg=-52 satMult=2.2 valMult=0.85 |
| tide_shaper | Enemy_06_A | rotate hueDeg=9 satMult=1 valMult=1 |
| abyssal_shade | Enemy_21_A | rotate hueDeg=-4 satMult=2 valMult=0.5 |
| drowned_knight (elite) | Enemy_22_A | rotate hueDeg=188 satMult=1 valMult=0.9 |
| thalymor_boss (boss) | Titan Guard Boss [A] | rotate hueDeg=206 satMult=0.9 valMult=1 |

### Volterra (LIGHTNING)

| Enemy id | Source | Recolor |
|---|---|---|
| spark_imp | Enemy_03_A | colorize hue=50° satTarget=0.8 valMult=2.6 |
| thunder_drake | Enemy_05_A | colorize hue=50° satTarget=0.7 valMult=2.5 |
| chain_revenant | Enemy_21_A | colorize hue=50° satTarget=0.65 valMult=1.4 |
| volt_hound | Enemy_07_A | rotate hueDeg=-88 satMult=1 valMult=1.15 |
| arc_node | Enemy_06_A | rotate hueDeg=-153 satMult=1 valMult=1.2 |
| grid_architect | Enemy_24_A | rotate hueDeg=48 satMult=1.3 valMult=1.1 |
| storm_herald (elite) | Enemy_22_A | rotate hueDeg=26 satMult=1.5 valMult=1.1 |
| volkran_boss (boss) | Molarbeast Boss [A] | rotate hueDeg=56 satMult=1 valMult=1.2 |

### Glaciem (ICE)

| Enemy id | Source | Recolor |
|---|---|---|
| frost_wolf | Enemy_17_A | rotate hueDeg=197 satMult=0.4 valMult=1.6 |
| ice_golem | Enemy_22_A | rotate hueDeg=172 satMult=0.3 valMult=1.8 |
| blizzard_wraith | Enemy_20_A | rotate hueDeg=194 satMult=0.35 valMult=1.5 |
| permafrost_titan (elite) | Enemy_15_A | rotate hueDeg=46 satMult=0.4 valMult=1.5 |
| crystal_dragon (elite) | Enemy_12_A | rotate hueDeg=0 satMult=0.5 valMult=1.4 |
| glacial_shaper | Enemy_09_A | rotate hueDeg=47 satMult=0.45 valMult=1.4 |
| hoarfrost_stalker | Enemy_19_A | rotate hueDeg=195 satMult=0.4 valMult=1.7 |
| crysthea_boss (boss) | Titan Guard Boss [A] | rotate hueDeg=190 satMult=0.45 valMult=1.4 |

### Malachar's Spire (DARK)

| Enemy id | Source | Recolor |
|---|---|---|
| dark_revenant | Enemy_20_A | rotate hueDeg=276 satMult=0.9 valMult=0.6 |
| shadow_construct | Enemy_23_A | rotate hueDeg=276 satMult=1.4 valMult=0.55 |
| void_weaver | Enemy_10_A | rotate hueDeg=128 satMult=1 valMult=0.6 |
| void_stalker | Enemy_01_A | colorize hue=278° satTarget=0.5 valMult=1.6 |
| void_sentinel (elite) | Enemy_21_A | rotate hueDeg=20 satMult=2.2 valMult=0.55 |
| malachar_boss (boss) | Molarbeast Boss [A] | rotate hueDeg=284 satMult=1 valMult=0.55 |



## `tilesets/` — Décor de zone

| Fichier destination | Pack source | Fichier source | Notes |
|---|---|---|---|
| `tileset_grievy_town_ground.png` | Fantasy Dreamland World (Fantasy Dreamland Reborn) | `Tilesets/FDR_Overworld_Ground.png`, recadré à (x:8,y:72,16×16) | Herbe avec fleck subtil (2 teintes), texture réelle vérifiée par pavage 4×4, aucune couture — remplace `bgColor` de `grievy_town` |
| `tileset_grievy_town_path.png` | Fantasy Dreamland World (Fantasy Dreamland Reborn) | `Tilesets/FDR_Overworld_Ground.png`, recadré à (x:200,y:60,16×16) | Sable à vagues diagonales, vraie texture (3 teintes), même feuille source — remplace `pathColor` de `grievy_town` |

Convention de nommage : `tileset_<zoneId>_ground.png` / `tileset_<zoneId>_path.png`,
chargés dynamiquement par zone dans `GameScene.drawZoneMap()` (fallback `fillRect`
procédural si les textures n'existent pas pour une zone donnée).

Découpage effectué avec un décodeur/encodeur PNG maison (Node + zlib, aucune
lib externe), avec vérification pixel par pixel (comptage de couleurs uniques)
avant tout crop final — pas seulement un pavage visuel, qui peut donner un faux
positif sur une couleur plate. Historique des candidats écartés :
- `RA_Ground_Tiles_Godot.png` (Village Rogue Adventure) : planche d'auto-tuiles
  avec bords de raccordement, pas une texture plate.
- `FDR_Grasslands.png` (Green Plains Tileset) : le premier crop choisi ici
  provenait en fait d'un bandeau de 4 couleurs de référence dans le coin de la
  feuille (couleur unie à 100%, confirmé par décodage), pas d'une vraie tuile
  de jeu — détecté par le `code-reviewer` et corrigé. `FDR_Ground_Tiles.png`
  (même pack) a aussi été scanné : tuiles "pleines" toutes à ≤4 couleurs
  uniques sur 16×16 opaque — même limite dans tout ce pack.
- Recherche élargie sur plusieurs lignes du bundle (Fantasy Dreamland,
  Fantasy Dreamland Reborn, Rogue Adventure, Farming Game World) : la plupart
  des tuiles de sol "pleines" sont en aplat quasi total, le détail visuel de
  ce style venant des bordures et des props (fleurs, touffes) — c'est le style
  du bundle, pas une erreur de recadrage.
- `FDR_Overworld_Ground.png` (même pack Fantasy Dreamland Reborn, fichier
  distinct de `FDR_Grasslands.png`) est la seule feuille scannée qui contient
  de vraies zones texturées en 16×16 opaque (jusqu'à 18 couleurs uniques,
  contre ≤4 ailleurs) — c'est la source retenue ci-dessus.

## `items/` — Armes (54 icônes statiques)

Icônes 32×32 statiques `item_<id>.png`, une par arme de `src/data/items.ts`
(54 armes). Packs sources par famille d'arme (`weaponType`) :

| Famille(s) | Pack source | Notes |
|---|---|---|
| SWORD, GREATSWORD, DUAL_SWORD (test) | Sword Item Icons | GREATSWORD et DUAL_SWORD en réemploi du pack épées, faute de pack dédié |
| DAGGER, DUAL_DAGGER (test) | Dagger Item Icons | DUAL_DAGGER en réemploi du pack dagues |
| STAFF | Staff Item Icons | Couvre aussi sceptres et tomes (`earth_tome`) |
| BOW | Bow Item Icons | |
| AXE, HAMMER (test) | Axe Item Icons | HAMMER en réemploi du pack haches, faute de pack dédié |

**Contrairement aux ennemis, les icônes d'armes ne sont PAS recolorées par
élément** (choix utilisateur explicite). L'élément d'une arme looté est signalé
par un glyphe dédié dans la popup de détail de l'inventaire, pas par l'icône
elle-même (voir `src/scenes/InventoryScene.ts`, `ELEMENT_GLYPHS`).

## `items/` — Armures (en cours, lot par lot)

Contrairement aux armes, les icônes d'armure **sont recolorées par élément**
(même logique que les ennemis, `colorize()` HSV) quand le pack source ne
fournit pas nativement la couleur voulue. Sprites choisis puis vérifiés
pixel par pixel avant intégration (`assets/Bundle_extracted/Armory Item
Icons/`) — jamais à l'aveugle sur un nom de fichier.

### Lot 1/8 — Casques (`HELM`, 10/10)

| Item id | Source | Recolor |
|---|---|---|
| `leather_helm` | Armory Item Icons — Leather Helm (fichier dédié) | Aucun |
| `iron_helm` | Armory Item Icons — Steel Helm (fichier dédié) | Aucun |
| `titan_helm` | Armory Item Icons — Armor_Icons_2.png (23,12), casque-crâne | Aucun (déjà rouge/magma) |
| `fire_helm` | Armor_Icons_2.png (22,6), casque cornu + gemme | Aucun (déjà rouge) |
| `earth_helm` | Armor_Icons_2.png (18,6), casque rond + gemme | Aucun (déjà brun) |
| `wind_helm` | Armor_Icons_2.png (16,6), base grise | `colorize` hue 190 (cyan pâle) |
| `water_helm` | Armor_Icons_2.png (16,10), casque cornu grillagé, base grise | `colorize` hue 212 (bleu) |
| `lightning_helm` | Armor_Icons_2.png (16,13), base grise | `colorize` hue 48 (or) |
| `dark_helm` | Armor_Icons_2.png (21,12), casque-crâne | Aucun (déjà violet) |
| `hidden_mirror_helm` | Armor_Icons_2.png (16,1), casque fermé, base grise | `colorize` désaturé + éclairci (effet miroir/poli) |

Lots restants à traiter en sessions ultérieures, même méthodologie :
Plastrons (`CHEST`), Jambières (`LEGS`), Bottes (`BOOTS`), Gants (`GLOVES`),
Capes (`CAPE`), Anneaux (`RING`), Amulettes (`AMULET`).

## `skills/`, `ui/`, `vfx/`, `props/`, `skins/`

*(rien intégré pour l'instant)*
