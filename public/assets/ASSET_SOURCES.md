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

*(en attente — tuile de sol Grievy Town à fournir par l'utilisateur, recadrée
manuellement depuis `Village Tileset 16x16 Pixelart [Rogue Adventure]`, le
fichier source `RA_Ground_Tiles_Godot.png` étant une planche d'auto-tuiles
trop complexe à découper à l'aveugle sans vérification visuelle)

## `items/`, `skills/`, `ui/`, `vfx/`, `props/`, `skins/`

*(rien intégré pour l'instant)*
