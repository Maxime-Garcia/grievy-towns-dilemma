# GAME DESIGN DOCUMENT
## Grievy Town's Dilemma

---

## 1. VISION

A 2D top-down action RPG in the style of classic Pokémon (Gen 3/4) with deep RPG systems,
rich lore, and a morally ambiguous narrative centered on identity, sacrifice, and the price of order.

**Engine:** Phaser.js 3 + TypeScript  
**Style:** Pixel art, top-down perspective  
**Target:** PC Browser / Desktop  

---

## 2. SYNOPSIS

### The World: Velmara

Velmara is a world shaped by six elemental divinities who, a century ago, descended from the
celestial plane and carved the land in their image. Each divinity claimed a territory and breathed
their essence into it — mountains of living crystal, seas that whisper prophecies, skies crackling
with eternal storms. The six zones coexist in fragile but beautiful equilibrium.

The people of Velmara never met the gods directly. They were presences felt in the warmth of a
volcanic spring, in the way forests bent with a clean wind, in the salt taste of coastal fog.
Faith without proof — and it was enough.

**Grievy Town** sits at the geographic and spiritual center of Velmara, a modest town of
woodcutters, traders, and wanderers, untouched by any elemental domain. A crossroads. A breath
of neutral air between six worlds.

### The Villain: Malachar the Unbound

Malachar was born in Grievy Town. As a young scholar, he studied the six elemental domains and
became obsessed with a single question: *why do gods hoard their power while men remain frail?*

Over thirty years of isolation and forbidden research, he developed the **Unraveling Curse** — a
dark magic ritual capable of amplifying elemental energies beyond their natural state, then
twisting them into chaotic aggression. He did not want to destroy the gods. He wanted to destabilize
them, break the equilibrium, prove that the divine order was a lie — and emerge as the sole master
of a world that had forgotten its gods.

The curse worked beyond his expectations. The elemental zones erupted. The divinities, flooded with
corrupted power, became frenzied and unrecognizable. Creatures born of their essence turned violent.
Velmara began to fracture.

### The Hero

The hero wakes with no name, no past, no memory — lying in a ditch on the road outside Grievy Town.
A woodcutter named **Aldric** finds them and carries them home. When the hero recovers, they
discover they can *absorb and replicate* magical properties — a rare ability called **Echo Magic**.

Grievy Town, battered by tremors and fleeing refugees from the elemental zones, recognizes in this
stranger a fighter of unusual caliber. They implore the hero to investigate.

What begins as a quest of necessity becomes a journey of identity. With each elemental zone the hero
enters, they absorb power, grow stronger — and slowly realize: they are not just killing corrupted
creatures. When a divinity falls, it does not disperse. It *dies*. Permanently.

The world begins to change. Magic thins. Colors fade. Rivers slow.

The **Dilemma** becomes clear: to save Velmara from Malachar, the hero must kill the very gods that
give Velmara life. Every victory is a loss. Every step toward the mage is a step toward an empty world.

### The Ending

After defeating Malachar, the hero experiences a divine illumination. Fragments of memory return —
not human memories, but *ancient* ones. The hero is not a person who lost their memory. They are
the **God of All** — the primordial divine consciousness that predates the six elemental divinities,
who sent a fragment of itself into human form when the imbalance was detected.

Like Zeno in Dragon Ball Super, the hero holds the power of absolute creation and erasure.

**Choice:**

1. **Restore** — Sacrifice the accumulated elemental power to resurrect the six divinities, restore
   Velmara, and return magic to the world. The hero gives up their divine identity, remains human,
   returns to Grievy Town to live among the people they fought for.
   → Ending: Bittersweet. The world is reborn. The hero is at peace but forever ordinary.

2. **Erase** — Delete everything. A mercy for a world that suffered too much? Or pride? The hero
   erases Velmara and enters **New Game+** — the same world, rebuilt from nothing, harder,
   with echoes of the previous run woven into the lore.

---

## 3. WORLD MAP — VELMARA

```
                     [ ZEPHYR PEAKS ]
                      Wind / Floating Islands
                            |
         [ GLACIEM ] -------+------- [ VOLTERRA ]
          Ice / Tundra      |          Lightning / Plains
                     [ GRIEVY TOWN ]
                      Neutral Center
         [ TERRAVAST ] -----+------- [ ABYSSMAR ]
          Earth / Canyons   |          Water / Coast
                            |
                     [ IGNIS REACH ]
                      Fire / Volcano
                            
                    [ MALACHAR'S SPIRE ]
                   (unlocked after 6 zones)
                    Dark / Corrupted Ruins
```

**Travel:** The hero can reach any zone from Grievy Town at any time.
Zone difficulty scales dynamically to the player's level ± 2 levels.

---

## 4. ELEMENTAL ZONES

### 4.1 Ignis Reach (Fire)
- **Terrain:** Volcanic mountains, rivers of lava, obsidian spires, ash plains
- **Atmosphere:** Scorching heat, perpetual red sky, crackling embers
- **Divine:** Pyrath — once a serpentine dragon of living flame, now a frenzied inferno
- **Enemies:** Ember Wyrm, Lava Golem, Cinder Sprite, Ash Revenant, Magma Titan
- **Boss:** Pyrath the Unbound
- **Unlocks:** Fire skills (Fireball, Flame Dash, Inferno Burst)
- **Materials:** Ember Core, Obsidian Shard, Volcanic Ash, Pyrath Scale (boss drop)
- **Lore:** Pyrath never spoke to humans, but Ignis Reach was once a place of pilgrimage.
  Hot springs healed the sick. Smiths hammered divine-grade metal from Pyrath's mountains.
  Now the springs boil over. The smiths are ash.

### 4.2 Terravast (Earth)
- **Terrain:** Deep canyons, crystal caves, ancient ruins, underground rivers
- **Atmosphere:** Cool and dark, bioluminescent mushrooms, echoing silence
- **Divine:** Gorvun — once a titanic stone figure of calm permanence, now a seismic terror
- **Enemies:** Stone Crawler, Crystal Golem, Cave Lurker, Terravast Serpent, Ruin Colossus
- **Boss:** Gorvun the Trembling
- **Unlocks:** Earth skills (Stone Shield, Seismic Slam, Terra Surge)
- **Materials:** Terravast Crystal, Ancient Stone Rune, Cave Moss, Gorvun Fragment
- **Lore:** Gorvun gifted miners with rich veins and stable tunnels. Terravast had no quakes —
  ever. Children played in caves that hadn't shifted in decades. All of that is gone.

### 4.3 Zephyr Peaks (Wind)
- **Terrain:** Floating islands, sky bridges, cloud temples, waterfalls flowing upward
- **Atmosphere:** Blinding white, howling winds, thin air, impossible heights
- **Divine:** Sylvael — once a luminescent phoenix of gentle currents, now a hurricane
- **Enemies:** Gale Harpy, Storm Eagle, Wind Wraith, Cyclone Sprite, Sky Titan
- **Boss:** Sylvael the Tempest
- **Unlocks:** Wind skills (Gale Step, Tornado Spin, Skyward Strike)
- **Materials:** Zephyr Feather, Stormstone, Cloudweave Silk, Sylvael Plume
- **Lore:** Sylvael's winds once carried seeds across continents, ensuring harvests everywhere.
  Travelers climbed to Zephyr Peaks for the view that showed all of Velmara at once.

### 4.4 Abyssmar (Water)
- **Terrain:** Coastal ruins, flooded cities, deep sea trenches, coral catacombs
- **Atmosphere:** Dark blue-green depths, bioluminescent glow, crushing pressure
- **Divine:** Thalymor — once a leviathan of measured tides, now a drowning flood
- **Enemies:** Tide Crawler, Sea Wraith, Coral Golem, Depth Serpent, Drowned Knight
- **Boss:** Thalymor the Deluge
- **Unlocks:** Water skills (Tidal Wave, Healing Current, Frost Lance)
- **Materials:** Deep Coral, Drowned Relic, Sea Glass, Thalymor Scale
- **Lore:** Abyssmar's coast was Velmara's most prosperous trade hub. Thalymor kept storms
  tame and fish plentiful. Sailors prayed to him and were answered with fair wind and calm sea.

### 4.5 Volterra (Lightning)
- **Terrain:** Endless flat plains, perpetual storm clouds, ruins of metal cities, lightning rods
- **Atmosphere:** Electric purple sky, constant thunder, burned ground, ozone smell
- **Divine:** Volkran — once a colossus of directed electricity, now a rampaging storm
- **Enemies:** Spark Imp, Thunder Drake, Chain Revenant, Volt Hound, Storm Herald
- **Boss:** Volkran the Stormbringer
- **Unlocks:** Lightning skills (Thunder Bolt, Chain Lightning, Volt Dash)
- **Materials:** Storm Shard, Charged Metal, Thunder Rune, Volkran Coil
- **Lore:** Volterra powered Velmara. Machines, forges, communication towers — all ran on
  Volkran's directed lightning. The most technologically advanced region of the world. Now a ruin.

### 4.6 Glaciem (Ice)
- **Terrain:** Frozen tundra, ice caves, crystalline fortresses, preserved ancient ruins
- **Atmosphere:** Pale blue silence, blizzards, frozen lakes, the world preserved in ice
- **Divine:** Crysthea — once an ice goddess of preservation and memory, now a blizzard
- **Enemies:** Frost Wolf, Ice Golem, Blizzard Wraith, Permafrost Titan, Crystal Dragon
- **Boss:** Crysthea the Frozen
- **Unlocks:** Ice skills (Frost Nova, Blizzard, Ice Barrier)
- **Materials:** Glaciem Ice Shard, Ancient Frost Rune, Frozen Essence, Crysthea Splinter
- **Lore:** Crysthea preserved history. The ice caves of Glaciem held artifacts from
  Velmara's first age. Scholars from all zones came to study. Nothing rots in Glaciem.

### 4.7 Malachar's Spire (Dark — Final Zone)
- **Unlocks:** After all 6 elemental zones are cleared
- **Terrain:** Corrupted ruins of what was once Grievy Town's eastern quarter, twisted spire
- **Atmosphere:** Ashen grey, colorless, drained of all magic, oppressive silence
- **Boss:** Malachar the Unbound (3 phases)
- **Lore:** The spire was always there, on the edge of town. No one paid it much attention.
  Malachar built it over twenty years. No one asked what he was doing. No one thought to ask.

---

## 5. PLAYER PROGRESSION

### Stats
| Stat | Base | Per Level | Per Attribute |
|------|------|-----------|---------------|
| HP | 100 | +15 | +8 (VIT) |
| Mana | 60 | +8 | +5 (INT) |
| ATK | 10 | +2 | +3 (STR) |
| DEF | 5 | +1 | +2 (END) |
| SPD | 5 | +0.5 | +2 (AGI) |
| MAGIC ATK | 10 | +2 | +3 (INT) |
| MAGIC DEF | 5 | +0.8 | +1 (END) +1 (INT) |

### Attributes
- **STR** (Strength): Increases ATK, carry weight
- **INT** (Intelligence): Increases MAGIC ATK, max Mana
- **AGI** (Agility): Increases SPD, crit chance
- **VIT** (Vitality): Increases max HP, HP regen
- **END** (Endurance): Increases DEF, MAGIC DEF, status resistance

**Attribute Points:** 3 per level up

### XP Formula
- XP to next level: `Math.floor(100 * Math.pow(level, 1.6))`
- Enemy XP: `Math.floor(8 * Math.pow(enemyLevel, 1.3))`
- Boss XP: `Math.floor(80 * Math.pow(bossLevel, 1.3))`

### Level Cap
- Normal: Level 60
- New Game+: Level 99

---

## 6. SKILL SYSTEM

### Equip Slots
- 4 active skill slots (mapped to Q, E, R, F keys)
- 1 always-active dash (Spacebar)
- Skills can be swapped at any campfire or in Grievy Town

### Default Skills (always available)
| Skill | Type | Description |
|-------|------|-------------|
| Echo Strike | Active | Absorb-powered melee burst, scales with total zones cleared |
| Dash | Active | Quick dodge in movement direction, brief invincibility frames |

### Skills Unlocked Per Zone
Each zone boss defeat unlocks 3 skills from that element.

**Fire (Ignis Reach):**
- Fireball — Launches an explosive projectile (medium mana, medium damage)
- Flame Dash — Dash that leaves a burning trail damaging enemies behind you
- Inferno Burst — Channel 1s, unleash a ring of fire around you (high damage, high mana)

**Earth (Terravast):**
- Stone Shield — Creates a shield absorbing damage proportional to DEF (low mana, 8s CD)
- Seismic Slam — Ground slam creating a shockwave in a line (medium mana, knockback)
- Terra Surge — Spike eruptions in a target area after 0.5s delay (high mana, AOE)

**Wind (Zephyr Peaks):**
- Gale Step — Short-range teleport in facing direction, phase through enemies
- Tornado Spin — Spin rapidly dealing continuous damage in melee range
- Skyward Strike — Launch target upward then crash them down (single target, high damage)

**Water (Abyssmar):**
- Tidal Wave — Send a wave that pushes and damages enemies in a line
- Healing Current — Channel 2s, restore HP (useful in boss fights)
- Frost Lance — Ice projectile that slows on hit

**Lightning (Volterra):**
- Thunder Bolt — Fast projectile that stuns on hit (0.5s stun)
- Chain Lightning — Hits one enemy, chains to 3 nearby enemies
- Volt Dash — Instantly teleport to target location leaving an electric explosion at origin

**Ice (Glaciem):**
- Frost Nova — Freeze all nearby enemies for 2s (AOE, high mana)
- Blizzard — Summon a blizzard zone that damages enemies per second for 5s
- Ice Barrier — Create ice walls blocking enemy movement (lasts 4s)

### Hidden Skills (discover through exploration or conditions)
- **Soul Echo** — Absorb the essence of a defeated boss permanently (passive, +3% dmg per boss)
- **Void Step** — Teleport to any previously visited location (unlocked: Malachar's first phase)
- **Prism Burst** — Unleash all 6 elements simultaneously (unlocked: all zones cleared + lv50+)
- **Elara's Gift** — Passive HP regen (find the hidden NPC Elara in Glaciem ice caves)

---

## 7. ITEM SYSTEM

### Rarity & Drop Rates
| Rarity | Color | Drop Rate | Drop Rate (Boss) |
|--------|-------|-----------|-----------------|
| Common | Grey | 60% | 25% |
| Uncommon | Green | 25% | 30% |
| Rare | Blue | 10% | 25% |
| Epic | Purple | 3.5% | 12% |
| Legendary | Orange | 1% | 6% |
| Mythic | Red | 0.4% | 1.5% |
| Hidden | Gold | 0.1% | 0.5% |

**Pity System:** After 250 kills without an Epic drop, the next kill guarantees one.
After 500 kills without Legendary, guaranteed Legendary. Resets per rarity tier.

### Item Categories
- **Weapons:** Sword, Greatsword, Staff, Bow, Dagger
- **Armor:** Helm, Chest, Legs, Boots, Gloves, Cape
- **Accessories:** Ring (2 slots), Amulet
- **Consumables:** Potions, Elixirs, Food, Scrolls
- **Materials:** Zone-specific crafting/selling resources
- **Key Items:** Story items, quest items (unstackable, cannot be sold)

### Economy
- **Selling:** Materials are the primary income source from farming
- **Buying:** Grievy Town has a general shop (basic gear, potions)
- **Zone Merchants:** Hidden merchants in each zone sell rare zone-specific gear
- **Gold cap per session:** No cap — reward long farming sessions

---

## 8. QUEST SYSTEM

### Quest Types
- **Main:** Tied to the core narrative (zone bosses, Malachar, epilogue)
- **Side:** Deeper lore, optional but rewarding
- **Fedex:** Villager delivery quests, quick gold + XP, no narrative weight

### Main Quest Chain
1. Awakening in Grievy Town (prologue)
2. The First Tremor (choose any zone, investigate)
3. The Price of Power (after first boss, hero realizes divinity = death)
4. The World Grows Silent (after 3 bosses, Velmara visibly degrading)
5. The Point of No Return (after all 6 bosses, Malachar's Spire revealed)
6. Malachar (final confrontation, 3 phases)
7. The Illumination (divine revelation)
8. The Choice (Restore or Erase)

### Side Quests (sample)
- "The Woodcutter's Past" (Aldric's backstory, Grievy Town)
- "Embers of Memory" (find a survivor's family in Ignis Reach ruins)
- "The Crystal Archivist" (retrieve Glaciem records before they're lost)
- "Volterra's Last Engineer" (save the scientist who maintained the lightning grid)
- "The Tide Caller" (Abyssmar fisherman's daughter was taken)
- "Fragments of Gorvun" (collect shards of Gorvun's original form for a scholar)
- "Malachar's Notes" (optional lore: find pages of his research scattered across zones)

### Fedex Quests (sample)
- Deliver herbs to the herbalist
- Bring a lost cat back from the forest
- Carry a letter to a merchant in the next region
- Gather 10 feathers from the forest birds
- Find a child's wooden toy lost in the fields

---

## 9. WORLD DEGRADATION SYSTEM

As the hero clears zones and kills divinities, the world responds.

| Zones Cleared | Visual State | Narrative |
|---------------|-------------|-----------|
| 0 | Vibrant, colorful | Velmara is corrupted but alive |
| 1-2 | Slight desaturation | Tremors in Grievy Town |
| 3 | Noticeably grey | NPCs begin to worry |
| 4 | Dull, muted | First villagers leave |
| 5 | Nearly colorless | Grievy Town half-empty |
| 6 | Ashen, lifeless | Only Aldric remains |

This is communicated through Phaser's camera color matrix / tint system and NPC dialogue changes.

---

## 10. NEW GAME+

**Trigger:** Choose "Erase" at the ending.

**Changes:**
- All enemies +50% HP and +30% damage
- Loot rates for Legendary/Mythic/Hidden doubled
- New "shadow" variants of zone bosses appear as optional encounters
- Grievy Town has a memorial statue of the previous hero
- Aldric references "the one who came before"
- Hidden dialogue unlocked with all NPCs (they "feel" the echo of the previous run)
- Prism Burst skill available from level 1
- A sealed door in Malachar's Spire opens, revealing the true origin story

---

## 11. NPCs — GRIEVY TOWN

| Name | Role | Notes |
|------|------|-------|
| Aldric | Woodcutter / First NPC | Warm, gruff. Found the hero. Father figure. |
| Mira | Herbalist / Healer | Sells potions. Worries about the tremors. |
| Theron | Blacksmith | Sells basic weapons and armor. Can upgrade gear. |
| Ysolde | Merchant | Runs the general shop. Gossip source. |
| Brother Ovan | Scholar / Priest | Knows elemental lore. Gives side quests. |
| Liria | Innkeeper | Saves the game. Gossip source. |
| Kelvar | Guard Captain | Gives combat tutorial. Fedex quest giver. |
| Elara | Mystery NPC | Hidden in Glaciem. Gives hidden skill. |

---

## 12. COMBAT — ACTION RPG

### Movement
- WASD: Move
- Spacebar: Dash (always available, 1.5s cooldown)
- Left click / Z: Basic attack
- Q, E, R, F: Skill slots 1-4

### Combat Feel
- Real-time action, no turn-based pauses
- Enemies telegraph attacks (0.5s wind-up animation)
- Invincibility frames during dash (0.3s)
- Knockback on heavy hits (player and enemy)
- Combo counter (no mechanical effect, visual reward)

### Damage Formula
- Physical: `(ATK + weapon.damage) * (100 / (100 + enemy.DEF)) * critMultiplier`
- Magical: `(MAGIC_ATK + skill.magicDamage) * elementalMult * (100 / (100 + enemy.MAGIC_DEF))`
- Crit chance: `5% + (AGI * 0.3%)`, Crit multiplier: `1.5x`
- Elemental advantage: `1.25x` when hero's element hits enemy weakness

### Respawn
- Hero respawns at last campfire with 50% HP and Mana
- No item loss on death
- Death counter tracked (no mechanical penalty, cosmetic achievement)

---

## 13. SAVE SYSTEM

- 3 save slots
- Auto-save at: campfires, zone entrances, Grievy Town entry, after boss kills
- Manual save: any time at campfire or Grievy Town inn (Liria)
- Save data stored in localStorage

---

## 14. AUDIO

- Music by: [Friend's compositions]
- SFX: Procedural / open-source (Freesound.org)
- Audio cues: Level up jingle, rare item drop sound, boss entry theme, world degradation ambient shift

---

## 15. ART DIRECTION

- **Style:** 16x16 or 32x32 pixel art tiles
- **Palette per zone:** Distinct color palette for each element
  - Fire: Reds, oranges, blacks
  - Earth: Browns, greens, deep purples
  - Wind: Whites, light blues, silver
  - Water: Blues, teals, dark greens
  - Lightning: Purples, yellows, deep grey
  - Ice: Pale blues, whites, silver
  - Grievy Town: Warm browns, soft greens (neutral)
- **UI:** Dark panels with element-colored accents
- **Font:** Pixel font (Press Start 2P or Kenney Pixel)

---

*Document version 1.0 — Grievy Town's Dilemma*
