# ASSETS IMPORT GUIDE — Grievy Town's Dilemma
## Guide d'intégration d'assets pour Claude (usage interne)

> Ce fichier est destiné à être lu par Claude Code avant toute session d'intégration d'assets visuels ou audio. Il décrit la procédure exacte pour intégrer des livraisons du Sound Designer et de l'Environment Artist dans le codebase.

---

## SECTION 1 : STRUCTURE DE DOSSIERS ATTENDUE

### 1.1 Arborescence du projet (assets)

```
public/
  assets/
    audio/
      sfx/
        [sfx_category_id.ogg]         ← Sons effets (préfixe: sfx_)
      music/
        [music_zone.ogg]              ← Musiques de zone (préfixe: music_)
    sprites/
      player/
        [player_action_direction.png] ← Spritesheets joueur
      enemies/
        [enemy_id.png]                ← Sprites ennemis (idle/walk/attack/death)
      bosses/
        [boss_id.png]                 ← Sprites boss (64×64)
      npcs/
        [npc_id.png]                  ← Sprites NPC in-game (32×32)
        portraits/
          [portrait_id.png]           ← Portraits dialogue (64×64)
      items/
        [item_id.png]                 ← Icônes items (16×16 ou 32×32)
      skills/
        [skill_id.png]                ← Icônes skills (32×32)
      tilesets/
        [tileset_zone_type.png]       ← Tilesets de sol/mur/accent
      vfx/
        [vfx_effect_name.png]         ← VFX spritesheets
      props/
        [prop_name.png]               ← Props et décors
      ui/
        [ui_element.png]              ← Éléments UI si livrés en sprite
      skins/
        [skin_id.png]                 ← Icônes de skins cosmétiques
    kenneys/
      rpg-full.png                    ← Asset placeholder (NE PAS SUPPRIMER)
```

### 1.2 Conventions de nommage obligatoires

Tout asset doit respecter ces conventions pour être compatible avec le code existant. Le code TypeScript référence les texture keys, qui sont dérivées directement du nom de fichier (sans extension).

| Catégorie | Convention | Exemple |
|-----------|-----------|---------|
| Sprite ennemi | `enemy_[id]` | `enemy_ember_wyrm` |
| Sprite boss | `boss_[id_sans_boss]` | `boss_pyrath` |
| Sprite NPC | `npc_[id]` | `npc_aldric` |
| Portrait | `portrait_[id]` | `portrait_aldric` |
| Icône item | `item_[suffix_de_item]` | `item_ember_core` |
| Icône skill | `skill_[id]` | `skill_fireball` |
| Tileset | `tileset_[zone]_[type]` | `tileset_ignis_ground` |
| VFX | `vfx_[description]` | `vfx_hit_fire` |
| SFX | `sfx_[category]_[id]` | `sfx_fireball_launch` |
| Musique | `music_[context]` | `music_ignis_reach` |

**Règle absolue :** Les clés (`key`) dans le code Phaser doivent correspondre exactement au nom de fichier sans extension. Si l'artist livre un fichier `enemy_ember-wyrm.png` (avec tiret), il faut renommer en `enemy_ember_wyrm.png` (underscore).

---

## SECTION 2 : PRÉCHARGEMENT — `PreloaderScene.ts`

Fichier concerné : `src/scenes/PreloaderScene.ts`

### 2.1 État actuel

Actuellement, le `PreloaderScene` ne charge que l'asset placeholder Kenney :
```typescript
this.load.image('rpg-full', 'assets/kenneys/rpg-full.png');
```

Toute la visualisation en jeu est générée avec `Phaser.GameObjects.Graphics` (rectangles colorés). Les sprites livrés par l'artist **remplacent** cette logique procédurale.

### 2.2 Méthode d'ajout — Images statiques

Pour chaque sprite **non-animé** (portraits, icônes, props sans animation) :

```typescript
// Dans preload() de PreloaderScene.ts
this.load.image('npc_aldric', 'assets/sprites/npcs/npc_aldric.png');
this.load.image('portrait_aldric', 'assets/sprites/npcs/portraits/portrait_aldric.png');
this.load.image('item_ember_core', 'assets/sprites/items/item_ember_core.png');
```

### 2.3 Méthode d'ajout — Spritesheets (sprites animés)

Pour chaque sprite animé (joueur, ennemis, NPCs in-game, VFX) :

```typescript
// Syntaxe spritesheet Phaser
this.load.spritesheet(
  'player_walk_down',
  'assets/sprites/player/player_walk_down.png',
  { frameWidth: 32, frameHeight: 32 }
);

// Ennemi (32×32, toutes animations sur fichiers séparés)
this.load.spritesheet(
  'enemy_ember_wyrm_walk',
  'assets/sprites/enemies/enemy_ember_wyrm_walk.png',
  { frameWidth: 32, frameHeight: 32 }
);

// Boss (64×64)
this.load.spritesheet(
  'boss_pyrath_idle',
  'assets/sprites/bosses/boss_pyrath_idle.png',
  { frameWidth: 64, frameHeight: 64 }
);
```

**Paramètres `frameWidth` / `frameHeight` :** Correspondent exactement à la taille du sprite individuel dans la spritesheet. Aucun `spacing`, aucun `margin` (0 par défaut).

### 2.4 Méthode d'ajout — Audio

```typescript
// SFX
this.load.audio('sfx_fireball_launch', 'assets/audio/sfx/sfx_fireball_launch.ogg');

// Musique de zone
this.load.audio('music_ignis_reach', 'assets/audio/music/music_ignis_reach.ogg');
```

**Note sur les formats audio Phaser :** Phaser 3.70 supporte `.ogg` et `.mp3`. Toujours utiliser `.ogg` en premier. Le fallback `.mp3` n'est pas requis pour une cible navigateur moderne.

### 2.5 Ordre de chargement recommandé dans `preload()`

Pour maintenir la lisibilité du fichier, respecter cet ordre :

```typescript
preload() {
  // 1. Assets existants (NE PAS SUPPRIMER)
  this.load.image('rpg-full', 'assets/kenneys/rpg-full.png');

  // 2. Joueur
  // ... load.spritesheet pour chaque animation du joueur

  // 3. Ennemis (par zone)
  // ... Ignis, Terravast, Zephyr, Abyssmar, Volterra, Glaciem, Spire

  // 4. Boss
  // ...

  // 5. NPCs in-game + portraits
  // ...

  // 6. Items (icônes)
  // ...

  // 7. Skills (icônes HUD)
  // ...

  // 8. Tilesets
  // ...

  // 9. VFX
  // ...

  // 10. Props
  // ...

  // 11. UI sprites (si livrés)
  // ...

  // 12. SFX
  // ...

  // 13. Musiques
  // ...
}
```

---

## SECTION 3 : CRÉATION DES ANIMATIONS — `create()`

Une fois les spritesheets chargées dans `preload()`, les animations doivent être enregistrées dans `create()`. Ces animations sont globales et réutilisables dans toutes les scènes.

### 3.1 Où créer les animations

Dans `src/scenes/PreloaderScene.ts`, méthode `create()`, **avant** le `this.scene.start('MainMenuScene')`.

Pour des raisons d'organisation avec de nombreux ennemis, envisager de déléguer à des helpers statiques :

```typescript
// Dans src/systems/AnimationFactory.ts (à créer)
export class AnimationFactory {
  static createPlayerAnims(anims: Phaser.Animations.AnimationManager): void { ... }
  static createEnemyAnims(anims: Phaser.Animations.AnimationManager): void { ... }
  static createBossAnims(anims: Phaser.Animations.AnimationManager): void { ... }
  static createVFXAnims(anims: Phaser.Animations.AnimationManager): void { ... }
}
```

### 3.2 Syntaxe d'animation Phaser

```typescript
// Animation 4 frames, 8 fps, loop infinie
this.anims.create({
  key: 'player_walk_down',
  frames: this.anims.generateFrameNumbers('player_walk_down', { start: 0, end: 3 }),
  frameRate: 8,
  repeat: -1
});

// Animation 3 frames, 12 fps, pas de loop (attaque)
this.anims.create({
  key: 'player_attack_down',
  frames: this.anims.generateFrameNumbers('player_attack_down', { start: 0, end: 2 }),
  frameRate: 12,
  repeat: 0
});

// Animation idle 2 frames, 4 fps, loop
this.anims.create({
  key: 'player_idle_down',
  frames: this.anims.generateFrameNumbers('player_idle_down', { start: 0, end: 1 }),
  frameRate: 4,
  repeat: -1
});
```

### 3.3 Conventions de clé d'animation

La clé d'animation suit le format `[texture_key]` pour les animations simples, ou `[entity_id]_[action]_[direction]` pour les animations directionnelles.

| Animation | Clé attendue |
|-----------|-------------|
| Joueur idle bas | `player_idle_down` |
| Joueur marche droite | `player_walk_right` |
| Joueur attaque haut | `player_attack_up` |
| Joueur dash gauche | `player_dash_left` |
| Joueur mort | `player_death` |
| Ennemi idle | `enemy_ember_wyrm_idle` |
| Ennemi marche | `enemy_ember_wyrm_walk` |
| Ennemi attaque | `enemy_ember_wyrm_attack` |
| Ennemi mort | `enemy_ember_wyrm_death` |
| Boss idle | `boss_pyrath_idle` |
| Boss attaque phase 1 | `boss_pyrath_attack1` |
| Boss transition phase 2 | `boss_pyrath_phase2` |
| Boss mort | `boss_pyrath_death` |
| VFX hit feu | `vfx_hit_fire` |
| VFX mort ennemi | `vfx_enemy_death` |

### 3.4 Fréquences d'image recommandées

| Type d'animation | FPS recommandé |
|-----------------|----------------|
| Idle (joueur/ennemi) | 4–6 fps |
| Walk (joueur/ennemi) | 8 fps |
| Attack (joueur) | 12–16 fps |
| Attack (ennemi) | 10 fps |
| Death | 8–10 fps, repeat: 0 |
| Boss idle | 4–6 fps |
| Boss attack | 10–12 fps |
| VFX impact | 16–24 fps, repeat: 0 |
| VFX loop (blizzard, lava) | 8 fps, repeat: -1 |

---

## SECTION 4 : REMPLACEMENT DU CODE PROCÉDURAL

### 4.1 Logique actuelle

Le jeu utilise `Phaser.GameObjects.Graphics` pour dessiner tous les visuels :
- Les ennemis sont des rectangles colorés avec la couleur élémentaire
- Les zones sont remplies avec `bgColor`, `pathColor`, `wallColor`
- Les NPCs sont des rectangles avec texte de nom
- Les items dans l'inventaire sont des rectangles avec la couleur de rareté

### 4.2 Remplacement des ennemis

Dans `src/scenes/GameScene.ts`, la création d'ennemis utilise actuellement une `Graphics`. La remplacer par un sprite :

**Avant (procédural) :**
```typescript
// Exemple de logique à remplacer dans createEnemy()
const enemy = this.add.graphics();
enemy.fillStyle(0xff4400);
enemy.fillRect(-16, -16, 32, 32);
```

**Après (sprite) :**
```typescript
// Vérifier que la texture existe avant de créer le sprite
const textureKey = `enemy_${enemyData.id}`;
const hasTexture = this.textures.exists(textureKey + '_walk');

if (hasTexture) {
  const sprite = this.add.sprite(x, y, textureKey + '_idle');
  sprite.play(`${textureKey}_idle`);
  // Stocker sprite pour changer l'animation selon l'état (walk, attack, death)
} else {
  // Fallback procédural si le sprite n'est pas encore livré
  const fallback = this.add.graphics();
  fallback.fillStyle(enemyData.color ?? 0xffffff);
  fallback.fillRect(-16, -16, 32, 32);
}
```

**Principe :** Toujours implémenter le fallback procédural pour les sprites non encore livrés. Le jeu doit rester jouable même si seulement la moitié des sprites sont intégrés.

### 4.3 Remplacement du joueur

Dans `src/scenes/GameScene.ts`, le sprite joueur doit être instancié dans `createPlayer()` :

```typescript
createPlayer() {
  // Si les sprites joueur sont disponibles :
  if (this.textures.exists('player_idle_down')) {
    this.player = this.physics.add.sprite(spawnX, spawnY, 'player_idle_down');
    this.player.play('player_idle_down');
    // L'animation change selon la direction et l'état dans updatePlayerMovement()
  } else {
    // Fallback : Graphics rectangle
    // ... code actuel
  }
}
```

**Dans `updatePlayerMovement()` :** Changer l'animation selon direction et vitesse.

```typescript
updatePlayerMovement() {
  const isMoving = velocity.x !== 0 || velocity.y !== 0;
  const dir = this.getDirectionKey(); // 'up' | 'down' | 'left' | 'right'

  if (isMoving) {
    const animKey = `player_walk_${dir}`;
    if (this.player.anims.currentAnim?.key !== animKey) {
      this.player.play(animKey);
    }
  } else {
    const animKey = `player_idle_${dir}`;
    if (this.player.anims.currentAnim?.key !== animKey) {
      this.player.play(animKey);
    }
  }
}
```

### 4.4 Remplacement des tilesets

Actuellement, les zones utilisent `Phaser.GameObjects.Graphics` avec les couleurs de `zoneMaps.ts`. Le remplacement par des tilesets Tiled n'est PAS la cible — le jeu utilise un système de zones procédural basé sur des rectangles, pas des tilemaps.

Le remplacement visuel est une **couche décorative** : les tilesets sont utilisés comme **fonds texturés** (`add.tileSprite` ou `add.image` répété) par-dessus la logique de zone existante.

```typescript
// Ajout d'un fond texturé à la zone
createZoneBackground(zoneId: string) {
  const tilesetKey = `tileset_${zoneId}_ground`;
  if (this.textures.exists(tilesetKey)) {
    // TileSprite répète le tile sur toute la surface de la zone
    this.add.tileSprite(0, 0, ZONE_WIDTH, ZONE_HEIGHT, tilesetKey)
      .setOrigin(0, 0)
      .setDepth(-1);
  }
  // Le reste de la logique procédurale (wallColor, pathColor) reste en place
}
```

### 4.5 Remplacement des NPCs

Dans `GameScene.ts`, les NPCs affichent actuellement un rectangle. Remplacer par sprite + portrait dans le système de dialogue.

```typescript
// NPC sprite in-game
const npcKey = `npc_${npc.id}`;
if (this.textures.exists(npcKey)) {
  const npcSprite = this.add.sprite(npc.x, npc.y, npcKey);
  npcSprite.play(`${npcKey}_idle`); // Si animé, sinon setTexture suffit
}

// Portrait dans le dialogue (UIScene)
const portraitKey = `portrait_${npc.id}`;
if (this.textures.exists(portraitKey)) {
  const portrait = this.add.image(0, 0, portraitKey);
}
```

---

## SECTION 5 : GESTION AUDIO

### 5.1 Lecture des musiques de zone

Dans `GameScene.ts`, les musiques de zone sont définies via `musicKey` dans `zoneMaps.ts`. Le code actuel ne joue pas encore de musique — ajouter la logique quand les fichiers sont disponibles.

```typescript
// Dans changeZone() ou create() de GameScene.ts
startZoneMusic(musicKey: string) {
  // Arrêter la musique précédente avec fondu
  if (this.currentMusic) {
    this.tweens.add({
      targets: this.currentMusic,
      volume: 0,
      duration: 1000,
      onComplete: () => {
        this.currentMusic?.stop();
        this.currentMusic?.destroy();
      }
    });
  }

  // Vérifier que la clé existe avant de jouer
  if (this.cache.audio.exists(musicKey)) {
    this.currentMusic = this.sound.add(musicKey, {
      loop: true,
      volume: 0
    });
    this.currentMusic.play();
    this.tweens.add({
      targets: this.currentMusic,
      volume: 0.6, // Volume cible de musique
      duration: 1000
    });
  }
}
```

### 5.2 Lecture des SFX

Les SFX sont joués ponctuellement dans `GameScene.ts` :

```typescript
playSound(key: string, volume = 1.0) {
  if (this.cache.audio.exists(key)) {
    this.sound.play(key, { volume });
  }
  // Si la clé n'existe pas : silence (le jeu continue sans erreur)
}
```

**Exemple d'utilisation :**
```typescript
// Dans playerAttack()
this.playSound('sfx_player_attack_swing', 0.8);

// Dans enemyDeath()
this.playSound(`sfx_enemy_death_${enemy.id}`, 0.9);

// Dans skillActivation()
this.playSound(`sfx_skill_${skill.id}_launch`, 1.0);
```

### 5.3 Volume recommandé par catégorie

| Catégorie | Volume cible |
|-----------|-------------|
| Musique de zone | 0.5–0.6 |
| Musique de boss | 0.7 |
| SFX de combat | 0.8–0.9 |
| SFX d'UI | 0.6 |
| Ambiance de zone | 0.3–0.4 |
| SFX de skill | 1.0 |

---

## SECTION 6 : CHECKLIST D'INTÉGRATION

### 6.1 Avant de commencer

- [ ] Lire `VISUAL_ASSETS.md` pour connaître la liste complète et les conventions
- [ ] Lire `SOUND_EFFECTS.md` pour les SFX
- [ ] Lire `MUSIC.md` pour les musiques
- [ ] Vérifier que les fichiers livrés respectent les conventions de nommage (section 1.2)
- [ ] Renommer les fichiers non conformes avant de les copier dans `public/assets/`

### 6.2 Pour chaque batch de sprites livrés

1. **Copier les fichiers** dans le bon sous-dossier de `public/assets/`
2. **Ajouter le chargement** dans `PreloaderScene.ts` (`preload()`)
   - `this.load.image()` pour les non-animés
   - `this.load.spritesheet()` pour les animés avec `{ frameWidth, frameHeight }`
3. **Créer les animations** dans `PreloaderScene.ts` (`create()`)
   - Pour chaque spritesheet animée : `this.anims.create({ key, frames, frameRate, repeat })`
4. **Remplacer le rendu procédural** dans `GameScene.ts` par des sprites
   - Toujours conserver le fallback procédural (avec `this.textures.exists()`)
5. **Lancer une vérification manuelle** : inspecter visuellement le résultat en jeu
6. **Vérifier les types** : s'assurer qu'aucun `any` non typé n'a été introduit

### 6.3 Pour chaque batch audio livré

1. **Copier les fichiers** dans `public/assets/audio/sfx/` ou `/music/`
2. **Ajouter le chargement** dans `PreloaderScene.ts` (`preload()`)
   - `this.load.audio(key, path)`
3. **Connecter les événements** dans `GameScene.ts`
   - Trouver les points d'appel appropriés (attaque, mort, compétence)
   - Ajouter `this.playSound(key)` ou `this.startZoneMusic(key)`
4. **Tester les volumes** manuellement (voir tableau section 5.3)

### 6.4 Gate code-reviewer

Si **plus de 3 fichiers ont été modifiés** (ce qui sera le cas pour tout batch d'intégration), invoquer le `code-reviewer` avant de proposer une PR :

```
Agent({ 
  subagent_type: "claude", 
  prompt: "Lis .claude/agents/code-reviewer.md puis exécute le protocole sur src/" 
})
```

---

## SECTION 7 : GESTION DES DÉPENDANCES ET FALLBACKS

### 7.1 Principe du fallback obligatoire

Le jeu doit rester jouable à tout moment, même si les sprites ne sont pas encore intégrés. Chaque remplacement de rendu procédural par un sprite doit inclure un test `this.textures.exists(key)` avec fallback sur le code procédural.

Ce principe garantit que l'intégration peut se faire **progressivement**, par zone ou par catégorie, sans casser le jeu.

### 7.2 Ordre d'intégration recommandé

Intégrer dans cet ordre pour maximiser la valeur visible à chaque étape :

1. **Joueur** — visible dans chaque zone, impact immédiat sur le ressenti du jeu
2. **Grievy Town** (tileset + NPCs principaux) — hub vu à chaque retour
3. **Icônes d'items et de skills** — visibles dans l'UI à chaque session
4. **Ennemis de la zone 1** (Ignis Reach) — première zone de combat
5. **Boss Pyrath** — premier boss, moment clé
6. **Zones 2–6 + leurs ennemis** — dans l'ordre de progression principale
7. **Boss restants** — au fur et à mesure de l'avancement
8. **NPCs secondaires** (smiths, merchants, alchemists, tailors)
9. **VFX** — polish visible dans le combat
10. **Musiques** — ambiance globale
11. **SFX** — polish sonore
12. **UI sprites** — polish de l'interface (priorité 3)

### 7.3 Clés de texture critiques

Ces clés sont référencées directement dans le code existant. Elles ne doivent PAS changer de nom lors de l'intégration :

| Clé | Fichier source |
|-----|----------------|
| `rpg-full` | `assets/kenneys/rpg-full.png` (NE PAS SUPPRIMER) |
| `npc_[id]` | Défini dans `src/data/npcs.ts` → champ `textureKey` |
| `enemy_[id]` | Défini dans `src/data/enemies.ts` → champ `textureKey` |
| `boss_[id]` | Défini dans `src/data/enemies.ts` → champ `textureKey` (boss uniquement) |
| `portrait_[id]` | Référencé dans la logique de dialogue de `GameScene.ts` |
| `item_[suffix]` | Défini dans `src/data/items.ts` → champ `icon` |
| `skill_[id]` | Défini dans `src/data/skills.ts` → champ `icon` |
| `music_[zone]` | Défini dans `src/data/zoneMaps.ts` → champ `musicKey` |

**Vérification :** Avant d'utiliser une clé dans le code, la croiser avec la valeur réelle dans le fichier de données correspondant. La clé dans `this.load.*` et la clé dans le fichier de données doivent être identiques.

---

## SECTION 8 : EXEMPLES COMPLETS

### 8.1 Exemple : intégration complète d'un ennemi (ember_wyrm)

**Étape 1 — Fichiers livrés :**
```
assets/sprites/enemies/enemy_ember_wyrm_idle.png    (2 frames, 64×32)
assets/sprites/enemies/enemy_ember_wyrm_walk.png    (4 frames, 128×32)
assets/sprites/enemies/enemy_ember_wyrm_attack.png  (3 frames, 96×32)
assets/sprites/enemies/enemy_ember_wyrm_death.png   (4 frames, 128×32)
```

**Étape 2 — `PreloaderScene.ts` → `preload()` :**
```typescript
this.load.spritesheet('enemy_ember_wyrm_idle', 'assets/sprites/enemies/enemy_ember_wyrm_idle.png', { frameWidth: 32, frameHeight: 32 });
this.load.spritesheet('enemy_ember_wyrm_walk', 'assets/sprites/enemies/enemy_ember_wyrm_walk.png', { frameWidth: 32, frameHeight: 32 });
this.load.spritesheet('enemy_ember_wyrm_attack', 'assets/sprites/enemies/enemy_ember_wyrm_attack.png', { frameWidth: 32, frameHeight: 32 });
this.load.spritesheet('enemy_ember_wyrm_death', 'assets/sprites/enemies/enemy_ember_wyrm_death.png', { frameWidth: 32, frameHeight: 32 });
```

**Étape 3 — `PreloaderScene.ts` → `create()` :**
```typescript
this.anims.create({ key: 'enemy_ember_wyrm_idle', frames: this.anims.generateFrameNumbers('enemy_ember_wyrm_idle', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
this.anims.create({ key: 'enemy_ember_wyrm_walk', frames: this.anims.generateFrameNumbers('enemy_ember_wyrm_walk', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
this.anims.create({ key: 'enemy_ember_wyrm_attack', frames: this.anims.generateFrameNumbers('enemy_ember_wyrm_attack', { start: 0, end: 2 }), frameRate: 10, repeat: 0 });
this.anims.create({ key: 'enemy_ember_wyrm_death', frames: this.anims.generateFrameNumbers('enemy_ember_wyrm_death', { start: 0, end: 3 }), frameRate: 8, repeat: 0 });
```

**Étape 4 — `GameScene.ts` → logique d'ennemi :**
```typescript
// Dans la fonction de création d'ennemi, chercher la clé idle en priorité
const baseKey = `enemy_${enemy.id}`;
if (this.textures.exists(`${baseKey}_idle`)) {
  enemy.sprite = this.add.sprite(enemy.x, enemy.y, `${baseKey}_idle`);
  enemy.sprite.play(`${baseKey}_idle`);
} else {
  // Fallback procédural
}

// Dans la mise à jour de l'ennemi selon son état
if (enemy.state === 'walking') {
  if (this.anims.exists(`${baseKey}_walk`)) {
    enemy.sprite?.play(`${baseKey}_walk`, true);
  }
}
```

### 8.2 Exemple : intégration d'un tileset de sol

**Fichier livré :**
```
assets/sprites/tilesets/tileset_ignis_ground.png   (un tile 16×16 ou sheet de plusieurs tiles)
```

**`PreloaderScene.ts` → `preload()` :**
```typescript
this.load.image('tileset_ignis_ground', 'assets/sprites/tilesets/tileset_ignis_ground.png');
```

**`GameScene.ts` → utilisation comme fond :**
```typescript
// Fond répété sur toute la zone
if (this.textures.exists('tileset_ignis_ground')) {
  this.add.tileSprite(
    ZONE_BOUNDS.x, ZONE_BOUNDS.y,
    ZONE_BOUNDS.width, ZONE_BOUNDS.height,
    'tileset_ignis_ground'
  ).setOrigin(0, 0).setDepth(-2);
}
// La logique procédurale de wallColor/pathColor reste actif par-dessus en depth supérieur
```

### 8.3 Exemple : intégration d'une musique de zone

**Fichier livré :**
```
assets/audio/music/music_ignis_reach.ogg
```

**`PreloaderScene.ts` → `preload()` :**
```typescript
this.load.audio('music_ignis_reach', 'assets/audio/music/music_ignis_reach.ogg');
```

**`GameScene.ts` → déclenchement lors du changement de zone :**
```typescript
// musicKey est défini dans zoneMaps.ts pour chaque zone (ex: 'music_ignis_reach')
if (newZone.musicKey && this.cache.audio.exists(newZone.musicKey)) {
  this.startZoneMusic(newZone.musicKey);
}
```

---

## SECTION 9 : POINTS D'ATTENTION

### 9.1 Performance

- Ne jamais charger des spritesheets de plus de **2048×2048 px** — limite WebGL standard
- Les musiques (fichiers lourds) peuvent être chargées en `lazy` si nécessaire, mais le `PreloaderScene` standard est préféré pour la simplicité
- Les VFX créés avec `add.sprite()` doivent être détruits après leur animation (`once('animationcomplete', destroy)`)

### 9.2 Gestion mémoire

```typescript
// Après une animation VFX, toujours détruire le sprite
vfxSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
  vfxSprite.destroy();
});
```

### 9.3 TypeScript strict

- Ne jamais utiliser `any` pour les références de sprite — utiliser `Phaser.GameObjects.Sprite`
- Déclarer les propriétés sprite dans les interfaces d'état d'ennemi si elles sont ajoutées à l'objet enemy

### 9.4 Sauvegarde de l'état des assets

Si une livraison d'asset modifie un fichier de données (`enemies.ts`, `items.ts`, `skills.ts`) pour corriger un `textureKey`, vérifier que `SAVE_VERSION` dans `SaveSystem.ts` n'a pas besoin d'être bumped. Seules les modifications des interfaces `PlayerState`, `WorldState` ou `GameState` dans `src/types/index.ts` déclenchent un bump de version.
