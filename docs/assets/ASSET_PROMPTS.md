# Prompts Copilot — Grievy Town's Dilemma

## Mode d'emploi — 3 étapes

**1.** Va sur **copilot.microsoft.com**, connecte-toi avec ton compte Microsoft, clique sur l'icône image dans la barre de saisie.

**2.** Trouve l'asset voulu ci-dessous, copie le bloc de texte entre les ``` et colle-le directement dans Copilot. Rien à modifier.

**3.** Parmi les 4 variantes générées, choisis la meilleure, télécharge-la, puis :
- Supprime le fond blanc sur **remove.bg**
- Redimensionne à la taille cible avec **Nearest Neighbor** (Paint.NET : Image > Resize > Nearest Neighbor)
- Dépose le fichier au chemin indiqué au-dessus du prompt → le jeu le charge automatiquement

---

## TILESETS — 40 fichiers (5 tuiles × 8 zones)

> **Nouveau workflow** : chaque prompt génère **une seule tuile**. Le code assemble automatiquement les 5 tuiles d'une zone en tileset au démarrage du jeu.
> Pas besoin de remove.bg (les tuiles sont opaques). Pas de redimensionnement manuel.
> **Workflow** : générer → télécharger → déposer dans `public/assets/tiles/`

---

### ZONE : Grievy Town (village médiéval)

#### `town_floor.png` — Sol praticable
`public/assets/tiles/town_floor.png`

```
pixel art tile texture, 16-bit SNES style, single seamless floor tile, worn stone floor with subtle cracks, warm brown and beige tones, medieval village ground, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `town_wall.png` — Mur solide
`public/assets/tiles/town_wall.png`

```
pixel art tile texture, 16-bit SNES style, single solid wall tile, grey stone bricks with mortar lines, dark shadow at edges, medieval castle wall, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `town_special.png` — Sol spécial (pavé)
`public/assets/tiles/town_special.png`

```
pixel art tile texture, 16-bit SNES style, single cobblestone pavement tile, rounded stones fitted together, light grey and beige, town square paving, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `town_path.png` — Chemin
`public/assets/tiles/town_path.png`

```
pixel art tile texture, 16-bit SNES style, single dirt path tile, compacted earth with small pebbles, warm brown tones, village road, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `town_deco.png` — Décoration (buisson)
`public/assets/tiles/town_deco.png`

```
pixel art tile texture, 16-bit SNES style, single decoration tile, dense green bush with dark shadows, leafy foliage cluster, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

### ZONE : Ignis Reach (lave volcanique)

#### `fire_floor.png`
`public/assets/tiles/fire_floor.png`

```
pixel art tile texture, 16-bit SNES style, single floor tile, cracked black volcanic rock with faint orange glow in cracks, dark red and charcoal tones, volcanic wasteland ground, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `fire_wall.png`
`public/assets/tiles/fire_wall.png`

```
pixel art tile texture, 16-bit SNES style, single wall tile, solid obsidian wall with glowing orange crack lines, black and dark red tones, volcanic barrier, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `fire_special.png`
`public/assets/tiles/fire_special.png`

```
pixel art tile texture, 16-bit SNES style, single special tile, bubbling molten lava surface with bright orange center, red orange and black tones, liquid fire floor, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `fire_path.png`
`public/assets/tiles/fire_path.png`

```
pixel art tile texture, 16-bit SNES style, single path tile, scorched obsidian pathway, dark grey with ember specks, volcanic road, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `fire_deco.png`
`public/assets/tiles/fire_deco.png`

```
pixel art tile texture, 16-bit SNES style, single decoration tile, obsidian spike or fire vent, dark black with orange glow at base, volcanic decoration, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

### ZONE : Terravast (caverne cristalline)

#### `earth_floor.png`
`public/assets/tiles/earth_floor.png`

```
pixel art tile texture, 16-bit SNES style, single floor tile, rough cave ground with dirt and small rocks, dark brown and earthy grey tones, underground cave floor, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `earth_wall.png`
`public/assets/tiles/earth_wall.png`

```
pixel art tile texture, 16-bit SNES style, single wall tile, solid dark rock wall with rough texture, dark brown and grey tones, cave wall, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `earth_special.png`
`public/assets/tiles/earth_special.png`

```
pixel art tile texture, 16-bit SNES style, single special tile, glowing blue crystal floor surface, pale blue and crystal white tones, luminescent mineral ground, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `earth_path.png`
`public/assets/tiles/earth_path.png`

```
pixel art tile texture, 16-bit SNES style, single path tile, narrow dirt tunnel floor, compacted brown earth, cave corridor ground, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `earth_deco.png`
`public/assets/tiles/earth_deco.png`

```
pixel art tile texture, 16-bit SNES style, single decoration tile, stalactite viewed from above or crystal cluster, grey and pale blue tones, cave decoration, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

### ZONE : Zephyr Peaks (îles célestes)

#### `wind_floor.png`
`public/assets/tiles/wind_floor.png`

```
pixel art tile texture, 16-bit SNES style, single floor tile, light sky stone tile, pale blue and white tones, floating island ground, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `wind_wall.png`
`public/assets/tiles/wind_wall.png`

```
pixel art tile texture, 16-bit SNES style, single wall tile, solid cloud-stone wall, fluffy white and pale grey tones, sky island barrier, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `wind_special.png`
`public/assets/tiles/wind_special.png`

```
pixel art tile texture, 16-bit SNES style, single special tile, fluffy cloud surface tile, white and light blue, walkable cloud platform, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `wind_path.png`
`public/assets/tiles/wind_path.png`

```
pixel art tile texture, 16-bit SNES style, single path tile, white marble sky bridge tile, pale white and gold trim, celestial pathway, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `wind_deco.png`
`public/assets/tiles/wind_deco.png`

```
pixel art tile texture, 16-bit SNES style, single decoration tile, wind swirl or small cloud tuft, white and teal tones, sky decoration, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

### ZONE : Abyssmar (ruines sous-marines)

#### `water_floor.png`
`public/assets/tiles/water_floor.png`

```
pixel art tile texture, 16-bit SNES style, single floor tile, sandy ocean floor with ripple marks, deep blue and sand beige tones, underwater ground, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `water_wall.png`
`public/assets/tiles/water_wall.png`

```
pixel art tile texture, 16-bit SNES style, single wall tile, mossy stone ruin wall underwater, dark navy and green tones, submerged barrier, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `water_special.png`
`public/assets/tiles/water_special.png`

```
pixel art tile texture, 16-bit SNES style, single special tile, murky water surface tile with caustic light patterns, dark navy and teal tones, water floor, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `water_path.png`
`public/assets/tiles/water_path.png`

```
pixel art tile texture, 16-bit SNES style, single path tile, coral-covered underwater path, pink and orange coral tones, sea floor road, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `water_deco.png`
`public/assets/tiles/water_deco.png`

```
pixel art tile texture, 16-bit SNES style, single decoration tile, seaweed cluster viewed from above, dark green tones, underwater plant decoration, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

### ZONE : Volterra (cité électrique en ruines)

#### `lightning_floor.png`
`public/assets/tiles/lightning_floor.png`

```
pixel art tile texture, 16-bit SNES style, single floor tile, dark metal floor plate with rivets, dark grey and metallic tones, industrial ruins ground, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `lightning_wall.png`
`public/assets/tiles/lightning_wall.png`

```
pixel art tile texture, 16-bit SNES style, single wall tile, ruined concrete wall with electric conduits, dark grey and purple tones, electric ruin barrier, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `lightning_special.png`
`public/assets/tiles/lightning_special.png`

```
pixel art tile texture, 16-bit SNES style, single special tile, electrified floor grid with yellow sparks, dark grey and bright yellow tones, electric hazard floor, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `lightning_path.png`
`public/assets/tiles/lightning_path.png`

```
pixel art tile texture, 16-bit SNES style, single path tile, metal grid catwalk tile, dark iron and metallic grey tones, industrial walkway, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `lightning_deco.png`
`public/assets/tiles/lightning_deco.png`

```
pixel art tile texture, 16-bit SNES style, single decoration tile, small tesla coil stub or broken antenna, metallic grey and yellow glow, electric decoration, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

### ZONE : Glaciem (toundra glacée)

#### `ice_floor.png`
`public/assets/tiles/ice_floor.png`

```
pixel art tile texture, 16-bit SNES style, single floor tile, compacted snow floor with sparkle highlights, white and pale blue tones, frozen tundra ground, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `ice_wall.png`
`public/assets/tiles/ice_wall.png`

```
pixel art tile texture, 16-bit SNES style, single wall tile, solid dark blue ice wall with frozen texture, deep blue and white tones, glacial barrier, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `ice_special.png`
`public/assets/tiles/ice_special.png`

```
pixel art tile texture, 16-bit SNES style, single special tile, cracked frozen lake surface tile, pale blue and white with dark crack lines, thin ice floor, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `ice_path.png`
`public/assets/tiles/ice_path.png`

```
pixel art tile texture, 16-bit SNES style, single path tile, snow-dusted cleared path, white and light grey tones, winter road, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `ice_deco.png`
`public/assets/tiles/ice_deco.png`

```
pixel art tile texture, 16-bit SNES style, single decoration tile, ice crystal formation viewed from above, pale blue and white tones, frozen decoration, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

### ZONE : Malchar's Spire (abysse des ténèbres)

#### `dark_floor.png`
`public/assets/tiles/dark_floor.png`

```
pixel art tile texture, 16-bit SNES style, single floor tile, dark abyss floor with void crack patterns, near-black with faint purple glow in cracks, shadow realm ground, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `dark_wall.png`
`public/assets/tiles/dark_wall.png`

```
pixel art tile texture, 16-bit SNES style, single wall tile, shadow wall pulsing with dark energy, black and dark purple tones, void barrier, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `dark_special.png`
`public/assets/tiles/dark_special.png`

```
pixel art tile texture, 16-bit SNES style, single special tile, void portal ground swirl, black with purple spiral energy, abyss floor, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `dark_path.png`
`public/assets/tiles/dark_path.png`

```
pixel art tile texture, 16-bit SNES style, single path tile, shadow path with dim purple glow at edges, near-black and faint violet, void road, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

#### `dark_deco.png`
`public/assets/tiles/dark_deco.png`

```
pixel art tile texture, 16-bit SNES style, single decoration tile, dark obelisk shard viewed from above or void crystal, black and deep purple tones, shadow decoration, top-down view, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG tileset tile
```

---

## JOUEUR — 8 frames

> Générer chaque frame séparément, redimensionner à 32×32 Nearest Neighbor.
> Assembler les 8 images côte à côte en une image de 256×32 px dans Aseprite ou Photoshop.
> Dupliquer les frames 4–7 pour avoir les frames 8–11 → image finale **384×32 px** = `player.png`.

`public/assets/sprites/player.png` · 384×32 px (spritesheet 12 frames de 32×32)

---

### Frame 0 — Idle A

```
pixel art character sprite, 16-bit SNES RPG style, Chrono Trigger inspired, fantasy warrior standing idle, green tunic with brown belt, short dark brown hair, small silver sword at hip, relaxed neutral standing pose, eyes forward, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, readable silhouette, retro RPG game sprite
```

---

### Frame 1 — Idle B

```
pixel art character sprite, 16-bit SNES RPG style, Chrono Trigger inspired, fantasy warrior standing idle, green tunic with brown belt, short dark brown hair, small silver sword at hip, slight breathing inhale pose head tilted slightly up, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, readable silhouette, retro RPG game sprite
```

---

### Frame 2 — Idle C

```
pixel art character sprite, 16-bit SNES RPG style, Chrono Trigger inspired, fantasy warrior standing idle, green tunic with brown belt, short dark brown hair, small silver sword at hip, neutral relaxed pose arms slightly lower, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, readable silhouette, retro RPG game sprite
```

---

### Frame 3 — Idle D

```
pixel art character sprite, 16-bit SNES RPG style, Chrono Trigger inspired, fantasy warrior standing idle, green tunic with brown belt, short dark brown hair, small silver sword at hip, eyes closed calm breathing pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, readable silhouette, retro RPG game sprite
```

---

### Frame 4 — Walk 1 (pied gauche en avant)

```
pixel art character sprite, 16-bit SNES RPG style, Chrono Trigger inspired, fantasy warrior walking, green tunic with brown belt, short dark brown hair, small silver sword at hip, left foot stepped forward, right arm swinging back, walking motion, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, readable silhouette, retro RPG game sprite
```

---

### Frame 5 — Walk 2 (transfert de poids)

```
pixel art character sprite, 16-bit SNES RPG style, Chrono Trigger inspired, fantasy warrior mid-walk, green tunic with brown belt, short dark brown hair, small silver sword at hip, both feet nearly together weight transfer, arms at sides, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, readable silhouette, retro RPG game sprite
```

---

### Frame 6 — Walk 3 (pied droit en avant)

```
pixel art character sprite, 16-bit SNES RPG style, Chrono Trigger inspired, fantasy warrior walking, green tunic with brown belt, short dark brown hair, small silver sword at hip, right foot stepped forward, left arm swinging back, walking motion, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, readable silhouette, retro RPG game sprite
```

---

### Frame 7 — Walk 4 (retour neutre)

```
pixel art character sprite, 16-bit SNES RPG style, Chrono Trigger inspired, fantasy warrior mid-walk, green tunic with brown belt, short dark brown hair, small silver sword at hip, feet returning to neutral step, arms neutral sides, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, readable silhouette, retro RPG game sprite
```

---

## ENNEMIS — 33 fichiers

> Destination : `public/assets/sprites/enemies/` · 32×32 px · générer à 512×512

---

### Zone Feu — Ignis Reach

#### `ember_wyrm.png`
`public/assets/sprites/enemies/ember_wyrm.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, small fire serpent creature, flame body with ember scales, orange red and dark gold colors, glowing eyes, coiled threatening pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `lava_golem.png`
`public/assets/sprites/enemies/lava_golem.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, molten rock golem creature, heavy blocky body made of lava and cooled rock, glowing orange cracks across body, orange red black and grey colors, menacing stance, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `cinder_sprite.png`
`public/assets/sprites/enemies/cinder_sprite.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, tiny ash fairy creature, small humanoid made of ash and cinders, flickering flame wings, grey orange and pale yellow colors, floating pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `ash_revenant.png`
`public/assets/sprites/enemies/ash_revenant.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, undead warrior made of compacted ash, hollow glowing red eyes, crumbling tattered armor, grey ash and dark red colors, reaching forward pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `magma_titan.png`
`public/assets/sprites/enemies/magma_titan.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, massive magma titan creature, towering body of volcanic rock with rivers of lava, enormous fists, deep red orange black colors, imposing wide stance, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

### Zone Terre — Terravast

#### `stone_crawler.png`
`public/assets/sprites/enemies/stone_crawler.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, armored rock crab creature, heavy stone shell, multiple short legs, earthy brown grey and dark green colors, low crawling stance, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `crystal_golem.png`
`public/assets/sprites/enemies/crystal_golem.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, translucent crystal golem creature, angular geometric body made of blue and grey gemstones, glowing inner light, arms raised, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `cave_lurker.png`
`public/assets/sprites/enemies/cave_lurker.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, dark cave spider creature, camouflage brown and black body, six glowing eyes in a row, long thin legs, lurking crouched pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `terravast_serpent.png`
`public/assets/sprites/enemies/terravast_serpent.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, large earth serpent creature, rocky scales like stone plates, burrowing snake body, dark brown and grey earth colors, head raised ready to strike, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `ruin_colossus.png`
`public/assets/sprites/enemies/ruin_colossus.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, ancient stone warrior colossus, carved runes glowing faintly, moss growing in cracks, massive arms, grey stone and green moss colors, threatening stance, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

### Zone Vent — Zephyr Peaks

#### `gale_harpy.png`
`public/assets/sprites/enemies/gale_harpy.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, wind harpy creature, humanoid with large feathered wings, clawed feet, teal white and light blue colors, swooping attack pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `storm_eagle.png`
`public/assets/sprites/enemies/storm_eagle.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, storm bird of prey, massive wings crackling with electricity, lightning feathers, steel blue and bright yellow colors, wings spread wide diving pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `wind_wraith.png`
`public/assets/sprites/enemies/wind_wraith.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, translucent wind ghost creature, swirling air form with visible spiral body, glowing pale blue core, light blue and white colors, floating ethereal pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `cyclone_sprite.png`
`public/assets/sprites/enemies/cyclone_sprite.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, tiny whirlwind elemental, spinning air funnel body with tiny face in the center, pale blue white and grey colors, spinning tornado shape, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `sky_titan.png`
`public/assets/sprites/enemies/sky_titan.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, cloud giant warrior, massive humanoid body made of storm clouds, lightning in its chest, enormous fists, white grey and dark blue colors, powerful stance, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

### Zone Eau — Abyssmar

#### `tide_crawler.png`
`public/assets/sprites/enemies/tide_crawler.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, armored deep sea crustacean, heavy shell with bioluminescent markings, pincers raised, deep blue teal and bioluminescent cyan colors, sideways crab stance, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `sea_wraith.png`
`public/assets/sprites/enemies/sea_wraith.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, drowned ghost creature, translucent blue-green body, seaweed for hair, sunken hollow eyes, arms outstretched, deep blue translucent and pale colors, floating undead pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `coral_golem.png`
`public/assets/sprites/enemies/coral_golem.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, living coral golem, body made of pink orange and red coral formations, barnacles growing on it, lumbering wide pose, pink orange and earthy brown colors, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `depth_serpent.png`
`public/assets/sprites/enemies/depth_serpent.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, deep sea anglerfish-like serpent, long eel body with glowing lure dangling above head, rows of sharp teeth, pitch black and bioluminescent blue colors, menacing jaws open, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `drowned_knight.png`
`public/assets/sprites/enemies/drowned_knight.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, undead soldier in waterlogged rusted armor, seaweed growing through the visor, hollow blue glowing eyes, corroded sword raised, dark rusty grey teal and pale blue colors, threatening stance, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

### Zone Foudre — Volterra

#### `spark_imp.png`
`public/assets/sprites/enemies/spark_imp.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, tiny electric demon imp, small horned creature with purple body, lightning horns, crackling energy around hands, purple dark blue and bright yellow colors, menacing little pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `thunder_drake.png`
`public/assets/sprites/enemies/thunder_drake.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, electric lizard creature, agile drake with lightning tail and crackling yellow scales, bright yellow electric blue and dark grey colors, coiled ready to pounce, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `chain_revenant.png`
`public/assets/sprites/enemies/chain_revenant.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, undead warrior bound in electrified chains, chains glowing with purple crackling energy, struggling restrained pose, dark purple grey and electric yellow colors, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `volt_hound.png`
`public/assets/sprites/enemies/volt_hound.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, mechanical electric dog creature, metal plating for body, spark collar around neck, glowing red eyes, metallic grey yellow and dark iron colors, aggressive crouched snarling pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `storm_herald.png`
`public/assets/sprites/enemies/storm_herald.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, winged electric priest creature, robed humanoid with feathered wings, holding a lightning staff, gold purple and electric blue colors, commanding raised staff pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

### Zone Glace — Glaciem

#### `frost_wolf.png`
`public/assets/sprites/enemies/frost_wolf.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, large ice wolf creature, white and pale blue crystalline fur, frozen breath visible, piercing ice-blue eyes, snarling attack stance, white blue and silver colors, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `ice_golem.png`
`public/assets/sprites/enemies/ice_golem.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, transparent ice golem, glacial crystal body showing cold light within, slow imposing stance, arms wide, pale blue white and dark ice blue colors, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `blizzard_wraith.png`
`public/assets/sprites/enemies/blizzard_wraith.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, snow ghost creature, body made of swirling blizzard particles, barely visible face within the storm, pale white icy blue and grey colors, swirling ethereal form, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `permafrost_titan.png`
`public/assets/sprites/enemies/permafrost_titan.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, enormous ancient frozen giant, encased in permafrost armor of solid ice, body half buried in frost, tiny head on massive body, deep blue ice and dark grey colors, crushing raised fist pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `crystal_dragon.png`
`public/assets/sprites/enemies/crystal_dragon.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, small ice dragon hatchling, prismatic crystal scales reflecting rainbow light, stubby wings, sharp claws, pale blue white and prismatic multicolor hints, aggressive hatchling pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

### Zone Sombre — Malchar's Spire

#### `dark_revenant.png`
`public/assets/sprites/enemies/dark_revenant.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, shadow undead warrior, body made of solidified darkness, glowing violet hollow eyes, tattered shadow armor, reaching forward pose, dark purple black and faint violet colors, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `shadow_construct.png`
`public/assets/sprites/enemies/shadow_construct.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, living shadow creature, shifting dark amorphous form with visible purple energy core in center, tendrils extending outward, black deep purple and pulsing violet colors, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

#### `void_sentinel.png`
`public/assets/sprites/enemies/void_sentinel.png` · 32×32 px

```
pixel art enemy sprite, 16-bit SNES RPG style, Chrono Trigger inspired, floating dark guardian creature, black void armor with no face only darkness within helmet, void energy coursing around body, arms crossed, black dark grey and faint void purple colors, floating sentinel pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, dark fantasy RPG enemy, readable silhouette
```

---

## BOSSES — 7 fichiers

> Destination : `public/assets/sprites/bosses/` · 64×64 px · générer à 512×512

---

### `pyrath.png`
`public/assets/sprites/bosses/pyrath.png` · 64×64 px

```
pixel art boss sprite, 16-bit SNES RPG style, Chrono Trigger inspired, colossal fire dragon deity named Pyrath, massive volcanic wings spread wide, divine aura of flames, lava scale armor, overwhelming presence, deep red orange black and gold divine colors, imposing front-facing pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 64x64 size aesthetic, dark fantasy RPG final boss, powerful readable silhouette
```

---

### `gorvun.png`
`public/assets/sprites/bosses/gorvun.png` · 64×64 px

```
pixel art boss sprite, 16-bit SNES RPG style, Chrono Trigger inspired, ancient earth titan god named Gorvun, living mountain body with crystal eyes, earthquaking heavy presence, moss covered stone divine armor, deep brown grey and crystal blue divine colors, arms raised from the earth, white background, hard pixel edges, no anti-aliasing, 16-color palette, 64x64 size aesthetic, dark fantasy RPG final boss, powerful readable silhouette
```

---

### `sylvael.png`
`public/assets/sprites/bosses/sylvael.png` · 64×64 px

```
pixel art boss sprite, 16-bit SNES RPG style, Chrono Trigger inspired, corrupted wind phoenix deity named Sylvael, massive hurricane wings with torn feathers, mouth open screaming divine rage, teal white and corrupted dark grey colors, wings spread in corrupted divine fury, white background, hard pixel edges, no anti-aliasing, 16-color palette, 64x64 size aesthetic, dark fantasy RPG final boss, powerful readable silhouette
```

---

### `thalymor.png`
`public/assets/sprites/bosses/thalymor.png` · 64×64 px

```
pixel art boss sprite, 16-bit SNES RPG style, Chrono Trigger inspired, deep sea leviathan god named Thalymor, massive serpentine divine creature, bioluminescent markings across body, abyssal horror, deep navy and bright teal bioluminescent colors, coiled rising from below, white background, hard pixel edges, no anti-aliasing, 16-color palette, 64x64 size aesthetic, dark fantasy RPG final boss, powerful readable silhouette
```

---

### `volkran.png`
`public/assets/sprites/bosses/volkran.png` · 64×64 px

```
pixel art boss sprite, 16-bit SNES RPG style, Chrono Trigger inspired, electric colossus deity named Volkran, enormous mechanical lightning giant, arcing bolts of electricity between body parts, divine technological presence, dark metallic and electric yellow and purple divine colors, arms raised with lightning, white background, hard pixel edges, no anti-aliasing, 16-color palette, 64x64 size aesthetic, dark fantasy RPG final boss, powerful readable silhouette
```

---

### `crysthea.png`
`public/assets/sprites/bosses/crysthea.png` · 64×64 px

```
pixel art boss sprite, 16-bit SNES RPG style, Chrono Trigger inspired, glacial dragon goddess named Crysthea, crystalline ice form with ancient beauty partially corrupted, prismatic ice wings, tears frozen on face, ice blue white and corrupted dark blue divine colors, sad but dangerous divine pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 64x64 size aesthetic, dark fantasy RPG final boss, powerful readable silhouette
```

---

### `malachar.png`
`public/assets/sprites/bosses/malachar.png` · 64×64 px

```
pixel art boss sprite, 16-bit SNES RPG style, Chrono Trigger inspired, dark sorcerer final boss named Malachar, void robes with corrupted divine power emanating, shadowy aura consuming light around him, no visible face only darkness and glowing eyes, black deep purple and faint silver corrupted divine colors, arms outstretched ultimate dark power, white background, hard pixel edges, no anti-aliasing, 16-color palette, 64x64 size aesthetic, dark fantasy RPG ultimate final boss, powerful readable silhouette
```

---

## FORMES DIVINES — 6 fichiers

> Même créature que le boss correspondant mais dans son état pur et bienveillant, avant corruption.
> Destination : `public/assets/sprites/divines/` · 48×48 px · générer à 512×512

---

### `pyrath.png` (forme divine)
`public/assets/sprites/divines/pyrath.png` · 48×48 px

```
pixel art divine sprite, 16-bit SNES RPG style, Chrono Trigger inspired, radiant fire dragon deity Pyrath in pure benevolent form, golden flames instead of red, kind divine eyes, wings folded peacefully, deep gold orange and warm divine light colors, serene divine presence, white background, hard pixel edges, no anti-aliasing, 16-color palette, 48x48 size aesthetic, dark fantasy RPG divine being, peaceful readable silhouette
```

---

### `gorvun.png` (forme divine)
`public/assets/sprites/divines/gorvun.png` · 48×48 px

```
pixel art divine sprite, 16-bit SNES RPG style, Chrono Trigger inspired, radiant earth titan deity Gorvun in pure benevolent form, green growth and flowers on stone body instead of ruins, warm kind eyes, gentle open palm gesture, green brown and warm earthy light colors, nurturing divine presence, white background, hard pixel edges, no anti-aliasing, 16-color palette, 48x48 size aesthetic, dark fantasy RPG divine being, peaceful readable silhouette
```

---

### `sylvael.png` (forme divine)
`public/assets/sprites/divines/sylvael.png` · 48×48 px

```
pixel art divine sprite, 16-bit SNES RPG style, Chrono Trigger inspired, radiant wind phoenix deity Sylvael in pure benevolent form, pristine white and gold feathers, wings spread in blessing, serene song pose, pure white gold and sky blue colors, gentle divine wind presence, white background, hard pixel edges, no anti-aliasing, 16-color palette, 48x48 size aesthetic, dark fantasy RPG divine being, peaceful readable silhouette
```

---

### `thalymor.png` (forme divine)
`public/assets/sprites/divines/thalymor.png` · 48×48 px

```
pixel art divine sprite, 16-bit SNES RPG style, Chrono Trigger inspired, radiant sea deity Thalymor in pure benevolent form, luminous sea serpent with gentle glow, protective coiled form, deep blue and shimmering aquamarine divine colors, guardian of the deep, white background, hard pixel edges, no anti-aliasing, 16-color palette, 48x48 size aesthetic, dark fantasy RPG divine being, peaceful readable silhouette
```

---

### `volkran.png` (forme divine)
`public/assets/sprites/divines/volkran.png` · 48×48 px

```
pixel art divine sprite, 16-bit SNES RPG style, Chrono Trigger inspired, radiant storm deity Volkran in pure benevolent form, golden lightning instead of destructive bolts, glowing divine mechanical form, gold and blue white electric divine colors, protective storm divine presence, white background, hard pixel edges, no anti-aliasing, 16-color palette, 48x48 size aesthetic, dark fantasy RPG divine being, peaceful readable silhouette
```

---

### `crysthea.png` (forme divine)
`public/assets/sprites/divines/crysthea.png` · 48×48 px

```
pixel art divine sprite, 16-bit SNES RPG style, Chrono Trigger inspired, radiant ice goddess Crysthea in pure benevolent form, pristine crystal form with warm smile, ice flowers forming around her, pale divine blue white and gentle prismatic colors, serene winter guardian, white background, hard pixel edges, no anti-aliasing, 16-color palette, 48x48 size aesthetic, dark fantasy RPG divine being, peaceful readable silhouette
```

---

## NPCs — SPRITES — 8 fichiers

> Destination : `public/assets/sprites/npcs/` · 32×32 px · générer à 512×512

---

### `aldric.png`
`public/assets/sprites/npcs/aldric.png` · 32×32 px

```
pixel art NPC sprite, 16-bit SNES RPG style, Chrono Trigger inspired, elderly male blacksmith, brown leather apron over simple tunic, strong broad shoulders, short greying hair, warm trustworthy face, hammer at belt, facing forward friendly pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, retro RPG townsperson, readable silhouette
```

---

### `mira.png`
`public/assets/sprites/npcs/mira.png` · 32×32 px

```
pixel art NPC sprite, 16-bit SNES RPG style, Chrono Trigger inspired, female innkeeper, warm red dress with white apron, auburn hair tied in a bun, kind welcoming smile, hands on hips, facing forward friendly pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, retro RPG townsperson, readable silhouette
```

---

### `theron.png`
`public/assets/sprites/npcs/theron.png` · 32×32 px

```
pixel art NPC sprite, 16-bit SNES RPG style, Chrono Trigger inspired, male travelling merchant, grey hooded cloak, sharp observant eyes, coin purse visible at belt, confident salesman pose facing forward, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, retro RPG townsperson, readable silhouette
```

---

### `brother_ovan.png`
`public/assets/sprites/npcs/brother_ovan.png` · 32×32 px

```
pixel art NPC sprite, 16-bit SNES RPG style, Chrono Trigger inspired, male monk, long blue robes, shaved head, prayer beads around neck, serene peaceful expression, hands together in prayer pose facing forward, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, retro RPG townsperson, readable silhouette
```

---

### `liria.png`
`public/assets/sprites/npcs/liria.png` · 32×32 px

```
pixel art NPC sprite, 16-bit SNES RPG style, Chrono Trigger inspired, female alchemist, green robe with small potion vials on belt, curious intelligent expression, magnifying glass in hand, slightly hunched forward inquisitive pose, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, retro RPG townsperson, readable silhouette
```

---

### `kelvar.png`
`public/assets/sprites/npcs/kelvar.png` · 32×32 px

```
pixel art NPC sprite, 16-bit SNES RPG style, Chrono Trigger inspired, male town guard, teal plate armor, simple helmet pushed back, spear in hand, vigilant upright stance, serious expression facing forward, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, retro RPG townsperson, readable silhouette
```

---

### `ysolde.png`
`public/assets/sprites/npcs/ysolde.png` · 32×32 px

```
pixel art NPC sprite, 16-bit SNES RPG style, Chrono Trigger inspired, elderly female sage, flowing golden robes, long white hair, kind wise eyes, scroll held in one hand, dignified standing pose facing forward, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, retro RPG townsperson, readable silhouette
```

---

### `elara.png`
`public/assets/sprites/npcs/elara.png` · 32×32 px

```
pixel art NPC sprite, 16-bit SNES RPG style, Chrono Trigger inspired, mysterious young woman, pale skin, light ice-blue robes, silver hair, hidden partially in shadows, looking sideways secretive expression, one hand raised slightly, white background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, retro RPG mysterious NPC, readable silhouette
```

---

## NPCs — PORTRAITS — 8 fichiers

> Même personnage que le sprite NPC, en gros plan buste et visage pour les dialogues.
> Destination : `public/assets/sprites/portraits/` · 80×80 px · générer à 512×512

---

### `aldric.png` (portrait)
`public/assets/sprites/portraits/aldric.png` · 80×80 px

```
pixel art NPC portrait bust, 16-bit SNES RPG style, Chrono Trigger inspired, close-up face and shoulders of elderly male blacksmith, grey stubble, kind deep-set eyes, weathered skin, brown leather apron strap visible, warm expression, facing slightly left, white background, hard pixel edges, no anti-aliasing, 16-color palette, 80x80 size aesthetic, retro RPG dialogue portrait
```

---

### `mira.png` (portrait)
`public/assets/sprites/portraits/mira.png` · 80×80 px

```
pixel art NPC portrait bust, 16-bit SNES RPG style, Chrono Trigger inspired, close-up face and shoulders of female innkeeper, auburn hair in bun with loose strands, warm brown eyes, gentle smile, red dress collar visible, welcoming expression, facing slightly right, white background, hard pixel edges, no anti-aliasing, 16-color palette, 80x80 size aesthetic, retro RPG dialogue portrait
```

---

### `theron.png` (portrait)
`public/assets/sprites/portraits/theron.png` · 80×80 px

```
pixel art NPC portrait bust, 16-bit SNES RPG style, Chrono Trigger inspired, close-up face and shoulders of male merchant, sharp green eyes, slight smirk, grey hood framing face, calculating expression, facing slightly left, white background, hard pixel edges, no anti-aliasing, 16-color palette, 80x80 size aesthetic, retro RPG dialogue portrait
```

---

### `brother_ovan.png` (portrait)
`public/assets/sprites/portraits/brother_ovan.png` · 80×80 px

```
pixel art NPC portrait bust, 16-bit SNES RPG style, Chrono Trigger inspired, close-up face and shoulders of male monk, shaved head, gentle closed eyes in contemplation, prayer beads at neck, blue robe collar, serene expression, facing slightly right, white background, hard pixel edges, no anti-aliasing, 16-color palette, 80x80 size aesthetic, retro RPG dialogue portrait
```

---

### `liria.png` (portrait)
`public/assets/sprites/portraits/liria.png` · 80×80 px

```
pixel art NPC portrait bust, 16-bit SNES RPG style, Chrono Trigger inspired, close-up face and shoulders of female alchemist, short brown hair with goggles pushed up on forehead, wide curious eyes, green robe collar, excited expression, facing slightly left, white background, hard pixel edges, no anti-aliasing, 16-color palette, 80x80 size aesthetic, retro RPG dialogue portrait
```

---

### `kelvar.png` (portrait)
`public/assets/sprites/portraits/kelvar.png` · 80×80 px

```
pixel art NPC portrait bust, 16-bit SNES RPG style, Chrono Trigger inspired, close-up face and shoulders of male guard, square jaw, teal armor pauldron visible, short dark hair, serious neutral expression, scar across cheek, facing slightly right, white background, hard pixel edges, no anti-aliasing, 16-color palette, 80x80 size aesthetic, retro RPG dialogue portrait
```

---

### `ysolde.png` (portrait)
`public/assets/sprites/portraits/ysolde.png` · 80×80 px

```
pixel art NPC portrait bust, 16-bit SNES RPG style, Chrono Trigger inspired, close-up face and shoulders of elderly female sage, long white hair, kind crinkled eyes, golden robe collar, soft wise expression, facing slightly left, white background, hard pixel edges, no anti-aliasing, 16-color palette, 80x80 size aesthetic, retro RPG dialogue portrait
```

---

### `elara.png` (portrait)
`public/assets/sprites/portraits/elara.png` · 80×80 px

```
pixel art NPC portrait bust, 16-bit SNES RPG style, Chrono Trigger inspired, close-up face and shoulders of mysterious young woman, silver hair partly covering face, pale ice-blue eyes with sadness in them, light blue robe collar, guarded expression with hint of vulnerability, facing slightly right, white background, hard pixel edges, no anti-aliasing, 16-color palette, 80x80 size aesthetic, retro RPG dialogue portrait
```

---

## SKILLS — 24 fichiers

> Icônes d'interface, pas de sprites top-down. Vue de face, style emblème.
> Destination : `public/assets/sprites/skills/` · 32×32 px · générer à 512×512

---

### `dash.png`
`public/assets/sprites/skills/dash.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, speed dash ability, motion arrow with afterimage speed lines, white and light blue colors, facing right directional icon, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `echo_strike.png`
`public/assets/sprites/skills/echo_strike.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, echo strike ability, fist impact with golden resonating ripple rings emanating outward, gold and orange colors, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `fireball.png`
`public/assets/sprites/skills/fireball.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, fireball spell, glowing orange red burning orb with flame trail, fire magic ability, bright orange and dark red colors, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `flame_dash.png`
`public/assets/sprites/skills/flame_dash.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, flame dash ability, figure silhouette leaving orange fire trail behind, fire and speed combined, orange red and white blur colors, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `inferno_burst.png`
`public/assets/sprites/skills/inferno_burst.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, inferno burst ability, radial explosion of fire bursting outward from center, intense deep red and orange, explosive fire magic, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `stone_shield.png`
`public/assets/sprites/skills/stone_shield.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, stone shield ability, circular shield of assembled rocks and earth, brown and grey stone colors, defensive earth magic, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `seismic_slam.png`
`public/assets/sprites/skills/seismic_slam.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, seismic slam ability, ground crack impact with shockwave radiating outward, brown earthy and grey crack colors, earth smash magic, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `terra_surge.png`
`public/assets/sprites/skills/terra_surge.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, terra surge ability, earth spikes erupting upward in a column, green brown and grey earth tones, earth power surge, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `gale_step.png`
`public/assets/sprites/skills/gale_step.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, gale step ability, wind spiral footstep with air currents swirling, teal and white wind colors, wind step magic, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `tornado_spin.png`
`public/assets/sprites/skills/tornado_spin.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, tornado spin ability, spinning air vortex seen from above, rotating wind funnel, pale blue white and grey spiral, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `skyward_strike.png`
`public/assets/sprites/skills/skyward_strike.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, skyward strike ability, upward striking sword motion with air pressure lines, bright blue and white upward slash, sky attack, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `tidal_wave.png`
`public/assets/sprites/skills/tidal_wave.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, tidal wave ability, large ocean wave cresting from right side, deep blue and white foam colors, water magic, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `healing_current.png`
`public/assets/sprites/skills/healing_current.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, healing current ability, flowing stream of healing water with green glow, gentle restorative energy, teal green and white colors, healing magic, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `frost_lance.png`
`public/assets/sprites/skills/frost_lance.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, frost lance ability, sharp pointed icicle spear projectile, crystalline ice blue and white colors, ice lance magic, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `thunder_bolt.png`
`public/assets/sprites/skills/thunder_bolt.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, thunderbolt ability, jagged lightning bolt striking downward, bright yellow and white electric colors, lightning magic, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `chain_lightning.png`
`public/assets/sprites/skills/chain_lightning.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, chain lightning ability, three connected nodes with arcing electricity between them, purple and yellow chain arc colors, chaining electric magic, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `volt_dash.png`
`public/assets/sprites/skills/volt_dash.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, volt dash ability, electric speed dash with purple and yellow lightning trail, electric motion blur, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `frost_nova.png`
`public/assets/sprites/skills/frost_nova.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, frost nova ability, expanding ring of ice crystals bursting outward from center, pale ice blue and white radial burst, ice explosion magic, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `blizzard.png`
`public/assets/sprites/skills/blizzard.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, blizzard ability, swirling snowstorm vortex viewed from front, multiple snowflakes in circular pattern, icy blue white and dark blue colors, blizzard magic, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `ice_barrier.png`
`public/assets/sprites/skills/ice_barrier.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, ice barrier ability, hexagonal wall of ice crystal panels standing upright, translucent blue ice and white frost colors, defensive ice magic, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `soul_echo.png`
`public/assets/sprites/skills/soul_echo.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, soul echo ability, golden pulsing aura rings emanating from a central soul flame, mystical divine power, warm gold and pale yellow colors, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `void_step.png`
`public/assets/sprites/skills/void_step.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, void step ability, dark portal tear in space with purple void inside, shadow teleport, black and deep purple with void glow colors, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `prism_burst.png`
`public/assets/sprites/skills/prism_burst.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, prism burst ability, multicolor rainbow prismatic explosion radiating in all directions, all elemental colors combined, divine hidden power, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

### `elaras_gift.png`
`public/assets/sprites/skills/elaras_gift.png` · 32×32 px

```
pixel art skill icon, 16-bit SNES RPG style, elara's gift ability, soft glowing divine light emanating from open hand, gentle green and white holy light, blessed ability, centered on dark background, hard pixel edges, no anti-aliasing, 16-color palette, 32x32 size aesthetic, fantasy RPG UI icon, clean simple design
```

---

## ÉLÉMENTS UI — 5 fichiers

> Destination : `public/assets/sprites/ui/` · générer à 512×512 puis recadrer

---

### `panel.png`
`public/assets/sprites/ui/panel.png` · 200×150 px

```
pixel art UI panel background, 16-bit SNES RPG style, dark stone bordered frame, ornate carved fantasy border with corner decorations, semi-transparent dark interior, brown stone and dark grey colors, inventory or menu background panel, white background outside border, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG interface element
```

---

### `slot.png`
`public/assets/sprites/ui/slot.png` · 40×40 px

```
pixel art UI item slot, 16-bit SNES RPG style, small square dark stone slot frame, slightly glowing inner edge, sunken recessed look, dark brown and grey colors, inventory item slot, white background, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG interface element
```

---

### `portrait_bg.png`
`public/assets/sprites/ui/portrait_bg.png` · 80×80 px

```
pixel art UI portrait frame, 16-bit SNES RPG style, ornate square frame for character portraits, carved dark fantasy border with small gem insets at corners, brown and gold colors, dialogue box portrait frame, white background outside, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG interface element
```

---

### `healthbar.png`
`public/assets/sprites/ui/healthbar.png` · 120×10 px

> Générer à 512×512, puis recadrer manuellement en une bande horizontale 120×10 dans ton éditeur d'image.

```
pixel art UI health bar, 16-bit SNES RPG style, horizontal thin bar element, deep red filled portion against dark sunken trough background, simple clean design, red and dark grey colors, HP health bar for RPG interface, white background, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG interface element
```

---

### `manabar.png`
`public/assets/sprites/ui/manabar.png` · 120×10 px

> Générer à 512×512, puis recadrer manuellement en une bande horizontale 120×10 dans ton éditeur d'image.

```
pixel art UI mana bar, 16-bit SNES RPG style, horizontal thin bar element, deep blue filled portion against dark sunken trough background, simple clean design, blue and dark grey colors, MP mana bar for RPG interface, white background, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG interface element
```

---

## DIVERS — 2 fichiers

---

### `xp_orb.png`
`public/assets/sprites/xp_orb.png` · 12×12 px

> Générer à 512×512 puis redimensionner à 12×12 en Nearest Neighbor. À cette taille, 2-3 pixels de contour + 1 pixel highlight blanc suffisent.

```
pixel art XP orb sprite, 16-bit SNES RPG style, tiny glowing green orb, soft inner light emission, soul energy drop, bright green and white highlight colors, simple round glowing orb, white background, hard pixel edges, no anti-aliasing, 16-color palette, retro RPG collectible orb, readable at very small size, simple iconic shape
```

---

### `logo.png`
`public/assets/sprites/logo.png` · 400×100 px

> Générer à 512×512, puis recadrer en rectangle horizontal 400×100.

```
pixel art fantasy game title logo, 16-bit SNES RPG style, text reading "Grievy Town's Dilemma", gothic dark fantasy lettering with ornate styling, deep purple and dark grey with faint glow outline, horizontal banner composition, centered text, dark fantasy adventure game title, white background, hard pixel edges, no anti-aliasing, retro RPG game logo
```

---

## Ordre de priorité de génération

| Priorité | Catégorie | Fichiers | Impact sur le jeu |
|----------|-----------|----------|-------------------|
| 1 | Tilesets | 8 | Les zones ont un vrai décor |
| 2 | Joueur (frames) | 8 | Le personnage est reconnaissable |
| 3 | Ennemis | 33 | Le combat est immersif |
| 4 | NPCs sprites + portraits | 16 | Les dialogues fonctionnent |
| 5 | Skills icons | 24 | L'interface de compétences est lisible |
| 6 | Bosses + Divines | 13 | Contenu endgame |
| 7 | UI + Divers | 7 | Finition visuelle |
| **Total** | | **109** | |
