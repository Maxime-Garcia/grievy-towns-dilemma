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

## `npcs/`, `npcs/portraits/` — PNJ

*(rien intégré pour l'instant — prochaine étape de la pipeline : Grievy Town)*

## `enemies/`, `bosses/` — Ennemis & boss

*(rien intégré pour l'instant — étape ultérieure : ennemis zone 1 + boss)*

## `tilesets/` — Décor de zone

*(rien intégré pour l'instant)*

## `items/`, `skills/`, `ui/`, `vfx/`, `props/`, `skins/`

*(rien intégré pour l'instant)*
