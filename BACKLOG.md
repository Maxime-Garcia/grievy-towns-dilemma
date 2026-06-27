# Backlog — Grievy Town's Dilemma

## Prochaines étapes prioritaires

### 1. Assets visuels
Remplacer tous les sprites placeholder (carrés colorés) par de vrais assets graphiques pixel art.

**Scope :**
- Sprites joueur (4 directions + animations : idle, walk, attack)
- Sprites ennemis (un spritesheet par ennemi)
- Sprites NPCs
- Icônes d'items (inventaire, équipement)
- Icônes de skills
- Portraits pour les dialogues
- UI (barres HP/MP, cadres, boutons)
- Effets visuels (sorts, dégâts, XP orbs)

**Sources possibles (libre de droits / CC0) :**
- [itch.io](https://itch.io/game-assets/free/tag-pixel-art)
- [OpenGameArt.org](https://opengameart.org)
- [Kenney.nl](https://kenney.nl/assets)
- Génération IA (Midjourney, DALL-E, Stable Diffusion) avec post-traitement pixel art

**Format cible :** PNG spritesheets · 16×16 ou 32×32 px par tile · Phaser texture atlas (JSON + PNG)

---

### 2. Tilemaps
Remplacer les zones générées procéduralement par de vraies maps construites avec des tilesets.

**Scope :**
- Choisir un éditeur : **Tiled** (recommandé, export JSON natif Phaser)
- Créer un tileset de base (sol, murs, obstacles, décorations)
- Mapper chaque zone du jeu (Terravast Plains, Emberveil Wastes, etc.)
- Intégrer les tilemaps dans `GameScene` via `this.make.tilemap()`
- Gérer les collisions via layers Tiled
- Placer les spawn points ennemis et les points d'entrée/sortie de zone dans les objets Tiled

**Références Phaser + Tiled :**
- `Phaser.Tilemaps.Tilemap`
- `tilemap.createLayer()`
- `tilemap.getObjectLayer()` pour spawn points
