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

## `enemies/`, `bosses/` — Ennemis & boss

*(rien intégré pour l'instant — étape ultérieure : ennemis zone 1 + boss)*

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

## `items/`, `skills/`, `ui/`, `vfx/`, `props/`, `skins/`

*(rien intégré pour l'instant)*
