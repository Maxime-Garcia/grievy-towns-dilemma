# Grievy Town's Dilemma — Référence complète des ennemis

---

## Comportements

| Behavior | Description | Déclencheur d'aggro | Attaque |
|----------|-------------|---------------------|---------|
| `chaser` | Fonce vers le joueur dès aggroRange. Ne lâche pas. | Distance ≤ aggroRange | Corps à corps, attackRange ~50-120 |
| `patrol` | Patrouille en cercle (patrolRadius). Aggro si joueur dans aggroRange. | Distance ≤ aggroRange pendant la patrouille | Corps à corps quand en portée d'attaque |
| `ranged` | Maintient une distance de sécurité, tire des projectiles élémentaires. | Distance ≤ aggroRange | Projectile à distance, attackRange ~160-320 |
| `charger` | Reste immobile jusqu'à aggroRange, puis dash rapide vers le joueur. | Distance ≤ aggroRange | Corps à corps, fort impact |
| `summoner` | Se déplace lentement, invoque des copies d'ennemis faibles à intervalles. | Distance ≤ aggroRange | Invocation + attaque légère |

**Note d'implémentation (pour l'agent GameScene) :** Ces champs sont déclaratifs — la logique IA est à implémenter dans `GameScene.ts`. Les champs `aggroRange`, `attackRange`, `moveSpeed`, `projectileColor` et `patrolRadius` fournissent toutes les valeurs nécessaires.

---

## Projets futurs (behaviors non encore implémentés)

- **Comportement de pack** : les `volt_hound` et `frost_wolf` devraient appeler des renforts si un membre du pack est attaqué dans un rayon de 300px. Nécessite un système d'événement entre instances.
- **Charger avec windup visuel** : les `charger` bénéficieraient d'une animation de préparation (0.5s d'immobilité + particules) avant le dash — actuellement non différencié des `chaser` par le code.
- **Summoner avec cap** : limiter les invocations simultanées à 3 par summoner pour éviter les situations ingérables.
- **Ranged repositionnement** : si le joueur entre dans attackRange/2, le ranged devrait reculer activement. Actuellement il reste statique si trop proche.

---

## Ignis Reach (Feu)

*Zone recommandée : niveau 8. Faiblesse commune : EAU. Couleur projectile : 0xff4400*

| ID | Nom | Type | Behavior | HP | Dégâts atk | Vitesse | Aggro | Attaque | Loot principal | Spawn Weight |
|----|-----|------|----------|----|------------|---------|-------|---------|----------------|-------------|
| `ember_wyrm` | Ember Wyrm | normal | charger | 120 | 18 | 90 | 150 | 60 | ember_core (45%), volcanic_ash (60%) | 3 |
| `lava_golem` | Lava Golem | normal | patrol | 220 | 28 | 50 | 100 | 70 | obsidian_shard (55%), ember_core (35%) | 2 |
| `cinder_sprite` | Cinder Sprite | normal | ranged | 55 | 12 | 140 | 200 | 180 | volcanic_ash (70%), ember_core (20%) | 5 |
| `ash_revenant` | Ash Revenant | normal | ranged | 95 | 14 | 75 | 160 | 200 | volcanic_ash (80%) | 2 |
| `ember_broodmother` | Ember Broodmother | normal | summoner | 160 | 15 | 40 | 130 | 60 | ember_core (55%), volcanic_ash (65%) | 1 |
| `scorch_sentinel` | Scorch Sentinel | normal | patrol | 175 | 24 | 45 | 110 | 65 | obsidian_shard (60%), ember_core (30%) | 2 |
| `magma_titan` | Magma Titan | **elite** | charger | 480 | 45 | 45 | 80 | 90 | ember_core (80%), pyrath_heart (0.3%) | 0.5 |
| `pyrath_boss` | Pyrath the Unbound | **boss** | charger | 1800 | 80 | 110 | 999 | 300 | pyrath_scale (100%), dragonfang_sword (25%) | — |

**Répartition comportements Ignis Reach :** charger 37.5% · ranged 25% · patrol 25% · summoner 12.5%

---

## Terravast (Terre)

*Zone recommandée : niveau 10. Faiblesse commune : VENT. Couleur projectile : 0x88aa33*

| ID | Nom | Type | Behavior | HP | Dégâts atk | Vitesse | Aggro | Attaque | Loot principal | Spawn Weight |
|----|-----|------|----------|----|------------|---------|-------|---------|----------------|-------------|
| `stone_crawler` | Stone Crawler | normal | patrol | 140 | 22 | 65 | 120 | 55 | terravast_crystal (50%), cave_moss (65%) | 3 |
| `crystal_golem` | Crystal Golem | normal | charger | 250 | 32 | 40 | 90 | 65 | terravast_crystal (75%), ancient_stone_rune (30%) | 2 |
| `cave_lurker` | Cave Lurker | normal | chaser | 80 | 26 | 110 | 0* | 55 | cave_moss (70%), terravast_crystal (25%) | 4 |
| `terravast_serpent` | Terravast Serpent | normal | charger | 180 | 35 | 80 | 140 | 100 | ancient_stone_rune (40%), terravast_crystal (55%) | 2 |
| `rune_shard_ghost` | Rune Shard Ghost | normal | ranged | 85 | 10 | 70 | 180 | 250 | ancient_stone_rune (55%), terravast_crystal (40%) | 2 |
| `stone_hound` | Stone Hound | normal | chaser | 110 | 28 | 115 | 200 | 55 | cave_moss (55%), terravast_crystal (30%) | 3 |
| `ruin_colossus` | Ruin Colossus | **elite** | patrol | 550 | 55 | 35 | 70 | 80 | ancient_stone_rune (85%), ruin_colossus_core (40%) | 0.4 |
| `gorvun_boss` | Gorvun the Trembling | **boss** | charger | 2200 | 90 | 60 | 999 | 200 | gorvun_fragment (100%), gorvun_hammer (22%) | — |

*aggroRange 0 = aggro uniquement au contact (ambush placard)*

**Répartition comportements Terravast :** patrol 25% · charger 37.5% · chaser 25% · ranged 12.5%

---

## Zephyr Peaks (Vent)

*Zone recommandée : niveau 12. Faiblesse commune : GLACE. Couleur projectile : 0xaaddff*

| ID | Nom | Type | Behavior | HP | Dégâts atk | Vitesse | Aggro | Attaque | Loot principal | Spawn Weight |
|----|-----|------|----------|----|------------|---------|-------|---------|----------------|-------------|
| `gale_harpy` | Gale Harpy | normal | ranged | 100 | 25 | 160 | 200 | 180 | zephyr_feather (65%), stormstone (35%) | 4 |
| `storm_eagle` | Storm Eagle | normal | charger | 160 | 35 | 130 | 220 | 200 | stormstone (60%), zephyr_feather (45%) | 3 |
| `wind_wraith` | Wind Wraith | normal | ranged | 75 | 15 | 180 | 180 | 100 | cloudweave_silk (55%), zephyr_feather (30%) | 3 |
| `cyclone_sprite` | Cyclone Sprite | normal | chaser | 65 | 18 | 200 | 180 | 90 | zephyr_feather (70%) | 5 |
| `storm_caller` | Storm Caller | normal | summoner | 130 | 12 | 45 | 160 | 80 | cloudweave_silk (60%), stormstone (45%) | 1 |
| `cloudpiercer` | Cloudpiercer | normal | ranged | 70 | 10 | 100 | 250 | 320 | zephyr_feather (70%), stormstone (30%) | 2 |
| `sky_titan` | Sky Titan | **elite** | patrol | 600 | 65 | 70 | 90 | 100 | stormstone (80%), cloudweave_silk (70%) | 0.4 |
| `sylvael_boss` | Sylvael the Tempest | **boss** | ranged | 2000 | 75 | 220 | 999 | 350 | sylvael_plume (100%), phoenix_bow (20%) | — |

**Répartition comportements Zephyr Peaks :** ranged 37.5% · charger 12.5% · chaser 12.5% · summoner 6.25% · patrol 12.5% · boss ranged

---

## Abyssmar (Eau)

*Zone recommandée : niveau 14. Faiblesse commune : FOUDRE. Couleur projectile : 0x2266ff*

| ID | Nom | Type | Behavior | HP | Dégâts atk | Vitesse | Aggro | Attaque | Loot principal | Spawn Weight |
|----|-----|------|----------|----|------------|---------|-------|---------|----------------|-------------|
| `tide_crawler` | Tide Crawler | normal | charger | 160 | 28 | 70 | 130 | 60 | deep_coral (55%), sea_glass (65%) | 3 |
| `sea_wraith` | Sea Wraith | normal | ranged | 90 | 16 | 80 | 160 | 200 | drowned_relic (50%), sea_glass (45%) | 3 |
| `coral_golem` | Coral Golem | normal | patrol | 280 | 38 | 40 | 90 | 70 | deep_coral (80%) | 2 |
| `depth_serpent` | Depth Serpent | normal | chaser | 200 | 42 | 90 | 150 | 110 | thalymor_scale (15%), deep_coral (60%) | 2 |
| `tide_shaper` | Tide Shaper | normal | summoner | 145 | 14 | 35 | 140 | 80 | deep_coral (60%), sea_glass (50%) | 1 |
| `abyssal_shade` | Abyssal Shade | normal | chaser | 100 | 35 | 105 | 200 | 60 | drowned_relic (65%), sea_glass (35%) | 2 |
| `drowned_knight` | Drowned Knight | **elite** | patrol | 620 | 60 | 60 | 80 | 70 | drowned_relic (85%), drowned_knight_sword (9%) | 0.4 |
| `thalymor_boss` | Thalymor the Deluge | **boss** | ranged | 2400 | 85 | 70 | 999 | 400 | thalymor_scale (100%), leviathan_staff (22%) | — |

**Répartition comportements Abyssmar :** charger 21.4% · ranged 14.3% · patrol 21.4% · chaser 28.6% · summoner 7.1% · boss ranged

---

## Volterra (Foudre)

*Zone recommandée : niveau 16. Faiblesse commune : TERRE. Couleur projectile : 0xffee00*

| ID | Nom | Type | Behavior | HP | Dégâts atk | Vitesse | Aggro | Attaque | Loot principal | Spawn Weight |
|----|-----|------|----------|----|------------|---------|-------|---------|----------------|-------------|
| `spark_imp` | Spark Imp | normal | ranged | 75 | 20 | 145 | 180 | 200 | storm_shard (65%), charged_metal (40%) | 5 |
| `thunder_drake` | Thunder Drake | normal | charger | 190 | 40 | 120 | 200 | 250 | thunder_rune (45%), storm_shard (55%) | 3 |
| `chain_revenant` | Chain Revenant | normal | ranged | 110 | 18 | 85 | 150 | 220 | charged_metal (60%), thunder_rune (35%) | 3 |
| `volt_hound` | Volt Hound | normal | chaser | 120 | 30 | 155 | 200 | 70 | storm_shard (60%), volt_hound_pelt (25%) | 4 |
| `arc_node` | Arc Node | normal | patrol | 95 | 8 | 45 | 120 | 180 | charged_metal (70%), storm_shard (45%) | 3 |
| `grid_architect` | Grid Architect | normal | summoner | 200 | 22 | 35 | 150 | 90 | charged_metal (75%), thunder_rune (50%) | 1 |
| `storm_herald` | Storm Herald | **elite** | ranged | 700 | 70 | 100 | 100 | 300 | volkran_coil (60%), thunder_rune (80%) | 0.35 |
| `volkran_boss` | Volkran the Stormbringer | **boss** | ranged | 2600 | 95 | 130 | 999 | 500 | volkran_coil (100%), volkran_hammer (23%) | — |

**Répartition comportements Volterra :** ranged 37.5% · charger 12.5% · chaser 12.5% · patrol 12.5% · summoner 6.25% · elite ranged · boss ranged

---

## Glaciem (Glace)

*Zone recommandée : niveau 18. Faiblesse commune : FEU. Couleur projectile : 0x88ddff*

| ID | Nom | Type | Behavior | HP | Dégâts atk | Vitesse | Aggro | Attaque | Loot principal | Spawn Weight |
|----|-----|------|----------|----|------------|---------|-------|---------|----------------|-------------|
| `frost_wolf` | Frost Wolf | normal | chaser | 150 | 32 | 130 | 180 | 70 | glaciem_ice_shard (60%), frost_wolf_pelt (20%) | 4 |
| `ice_golem` | Ice Golem | normal | patrol | 300 | 45 | 35 | 80 | 70 | glaciem_ice_shard (80%), ancient_frost_rune (40%) | 2 |
| `blizzard_wraith` | Blizzard Wraith | normal | ranged | 90 | 12 | 100 | 140 | 180 | frozen_essence (65%), glaciem_ice_shard (40%) | 3 |
| `permafrost_titan` | Permafrost Titan | **elite** | charger | 420 | 55 | 45 | 75 | 85 | ancient_frost_rune (75%), frozen_essence (65%) | 0.35 |
| `glacial_shaper` | Glacial Shaper | normal | summoner | 155 | 16 | 40 | 150 | 80 | frozen_essence (70%), ancient_frost_rune (45%) | 1 |
| `hoarfrost_stalker` | Hoarfrost Stalker | normal | charger | 240 | 48 | 140 | 100 | 80 | glaciem_ice_shard (70%), frost_wolf_pelt (35%) | 1 |
| `crystal_dragon` | Crystal Dragon | **elite** | ranged | 750 | 75 | 80 | 120 | 200 | crysthea_splinter (25%), ancient_frost_rune (80%) | 0.25 |
| `crysthea_boss` | Crysthea the Frozen | **boss** | ranged | 2800 | 80 | 90 | 999 | 350 | crysthea_splinter (100%), memory_staff (24%) | — |

**Répartition comportements Glaciem :** chaser 25% · patrol 12.5% · ranged 25% · charger 25% · summoner 12.5%

---

## Malachar's Spire (Sombre)

*Zone recommandée : niveau 25. Faiblesse commune : DIVIN. Couleur projectile : 0x8833cc*

| ID | Nom | Type | Behavior | HP | Dégâts atk | Vitesse | Aggro | Attaque | Loot principal | Spawn Weight |
|----|-----|------|----------|----|------------|---------|-------|---------|----------------|-------------|
| `dark_revenant` | Dark Revenant | normal | ranged | 140 | 25 | 95 | 200 | 200 | dark_essence (70%), void_shard (30%) | 4 |
| `shadow_construct` | Shadow Construct | normal | patrol | 300 | 50 | 75 | 150 | 75 | corrupted_rune (60%), void_shard (50%) | 2 |
| `void_weaver` | Void Weaver | normal | summoner | 220 | 20 | 55 | 160 | 90 | dark_essence (75%), corrupted_rune (55%) | 1 |
| `void_stalker` | Void Stalker | normal | charger | 180 | 65 | 160 | 120 | 60 | void_shard (65%), dark_essence (45%) | 2 |
| `void_sentinel` | Void Sentinel | **elite** | patrol | 800 | 80 | 85 | 120 | 100 | void_shard (85%), dark_essence (80%) | 0.3 |
| `malachar_boss` | Malachar the Unbound | **boss** | ranged | 4000 | 100 | 120 | 999 | 600 | malachars_grimoire (100%), malachars_staff (50%) | — |

**Répartition comportements Malachar's Spire :** ranged 40% · patrol 30% · summoner 10% · charger 20%

---

## Statistiques globales

| Zone | Ennemis normaux | Elites | Boss | Nouveaux ennemis ajoutés |
|------|----------------|--------|------|--------------------------|
| Ignis Reach | 6 | 1 | 1 | ember_broodmother, scorch_sentinel |
| Terravast | 6 | 1 | 1 | rune_shard_ghost, stone_hound |
| Zephyr Peaks | 6 | 1 | 1 | storm_caller, cloudpiercer |
| Abyssmar | 6 | 1 | 1 | tide_shaper, abyssal_shade |
| Volterra | 6 | 1 | 1 | arc_node, grid_architect |
| Glaciem | 6 | 2 | 1 | glacial_shaper, hoarfrost_stalker |
| Malachar's Spire | 4 | 1 | 1 | void_weaver, void_stalker |
| **Total** | **40** | **7** | **7** | **14 nouveaux ennemis** |

---

## Index des IDs par behavior

**chaser** : cave_lurker, stone_hound, depth_serpent, abyssal_shade, volt_hound, frost_wolf, cyclone_sprite

**patrol** : lava_golem, stone_crawler, scorch_sentinel, coral_golem, drowned_knight, arc_node, ice_golem, ruin_colossus, shadow_construct, void_sentinel

**ranged** : cinder_sprite, ash_revenant, gale_harpy, wind_wraith, cloudpiercer, sea_wraith, spark_imp, chain_revenant, blizzard_wraith, crystal_dragon, dark_revenant, storm_herald, sylvael_boss, thalymor_boss, volkran_boss, crysthea_boss, malachar_boss

**charger** : ember_wyrm, magma_titan, pyrath_boss, crystal_golem, terravast_serpent, gorvun_boss, storm_eagle, tide_crawler, thunder_drake, permafrost_titan, hoarfrost_stalker, void_stalker

**summoner** : ember_broodmother, storm_caller, tide_shaper, grid_architect, glacial_shaper, void_weaver
