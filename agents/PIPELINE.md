# Multi-Agent Pipeline — Grievy Town's Dilemma

This document defines the complete pipeline of specialized agents for developing,
expanding, and maintaining "Grievy Town's Dilemma".

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR AGENT                          │
│         Reads GDD, coordinates agents, resolves conflicts        │
└────────┬───────────┬──────────────┬──────────────┬─────────────┘
         │           │              │              │
    ┌────▼───┐  ┌────▼────┐  ┌─────▼────┐  ┌─────▼────┐
    │ DESIGN │  │ CONTENT │  │   DEV    │  │   QA     │
    │ AGENT  │  │  AGENT  │  │  AGENT   │  │  AGENT   │
    └────┬───┘  └────┬────┘  └─────┬────┘  └─────┬────┘
         │           │              │              │
         └───────────┴──────────────┴──────────────┘
                            │
                    ┌───────▼──────┐
                    │ ASSET AGENT  │
                    │(Stable Diff.)│
                    └──────────────┘
```

---

## Agent Definitions

### 1. ORCHESTRATOR AGENT

**Role:** Central coordinator. Reads the GDD, tracks the current state of the game,
and delegates tasks to specialized agents.

**Trigger:** Any new feature, zone expansion, or bug report.

**Prompt template:**
```
You are the lead developer of "Grievy Town's Dilemma", a 2D top-down RPG.
The full Game Design Document is in GAME_DESIGN.md.
The TypeScript type system is in src/types/index.ts.

Current task: [TASK]

Review the relevant data files and systems, then delegate to the appropriate agents:
- DESIGN AGENT: for new game design decisions, balance changes
- CONTENT AGENT: for new quests, items, enemies, NPCs, dialogue
- DEV AGENT: for TypeScript/Phaser code changes
- QA AGENT: for testing, bug reports, balance verification

Return a summary of what was changed and what needs to be done next.
```

---

### 2. DESIGN AGENT

**Role:** Game designer. Makes decisions about balance, new mechanics, zone design,
and story beats. Outputs structured specifications for other agents.

**Files it reads:** `GAME_DESIGN.md`, `src/data/*.ts`
**Files it writes:** `GAME_DESIGN.md` (updates), `agents/specs/*.md`

**Prompt template:**
```
You are the game designer for "Grievy Town's Dilemma".
Read GAME_DESIGN.md for the full context.

Task: [DESIGN TASK]

Rules:
- Respect the existing tone: melancholy, meaningful choices, rewarding exploration
- Enemy scaling is dynamic (player level ± 2) — do not hardcode level gates
- Loot rates follow: Common 60% / Uncommon 25% / Rare 10% / Epic 3.5% / Legendary 1% / Mythic 0.4% / Hidden 0.1%
- Skills are unlocked per zone — do not exceed 3 skills per element
- The world has 6 zones + Malachar's Spire; no new zones without a major design justification
- New Game+ is triggered by the "Erase" ending choice

Output a structured spec (JSON or markdown table) ready for the CONTENT AGENT.
```

---

### 3. CONTENT AGENT

**Role:** Writes all game content — quests, items, enemies, NPCs, dialogue, lore.
Outputs valid TypeScript data conforming to `src/types/index.ts`.

**Files it reads:** `src/types/index.ts`, `src/data/*.ts`, `GAME_DESIGN.md`
**Files it writes:** `src/data/*.ts`

**Prompt template:**
```
You are the content writer for "Grievy Town's Dilemma", a 2D RPG.

Read src/types/index.ts for the exact TypeScript interfaces.
Read the relevant src/data/*.ts files for existing content.
Read GAME_DESIGN.md for tone and world context.

Task: [CONTENT TASK]
Spec: [SPEC FROM DESIGN AGENT]

Rules:
- All new items must have unique IDs (snake_case)
- All lore must be consistent with the world of Velmara
- Quest objectives must use valid QuestObjectiveType: KILL | COLLECT | DELIVER | EXPLORE | TALK | BOSS
- Enemy loot must reference existing item IDs from src/data/items.ts
- Dialogue must use DialogueLine format with proper trigger/condition structure
- New fedex quests must be short (2-3 objectives) and reward gold + XP only
- Item rarity must match loot rate expectations in GAME_DESIGN.md
- All TypeScript must compile without errors

Output valid TypeScript to be appended or merged into the appropriate data file.
```

**Example invocation for new zone content:**
```
Task: Add 5 new side quests for the Abyssmar zone.
Requirements:
- 2 kill quests (tide crawlers, sea wraiths)
- 1 exploration quest (drowned city district)
- 1 collection quest (drowned relics)
- 1 rescue quest (trapped survivor)
Each quest must have: unique id, appropriate objectives, gold+XP reward, and 1-2 lines of lore.
```

---

### 4. DEV AGENT

**Role:** TypeScript/Phaser developer. Implements features, fixes bugs, refactors code.

**Files it reads/writes:** `src/**/*.ts`

**Prompt template:**
```
You are a TypeScript developer working on "Grievy Town's Dilemma", a Phaser.js 3 RPG.

Stack: Phaser.js 3.70, TypeScript 5, Vite 5
Architecture: src/types/ (interfaces), src/data/ (game data), src/systems/ (logic), src/scenes/ (Phaser)

Task: [DEV TASK]

Rules:
- Do not modify src/types/index.ts without explicit instruction (it's the source of truth)
- All systems must be pure logic (no Phaser dependencies) — Phaser only in scenes
- Follow existing naming conventions: PascalCase for classes, camelCase for functions
- No console.log in production code
- Save system uses localStorage — keep saves backward-compatible
- Enemy scaling: use SCALED_ENEMY_LEVEL() from ProgressionSystem.ts
- Loot pity system is in LootSystem.ts — do not duplicate it
- Always handle the case where assets may not be loaded (try/catch on setTexture)

Output complete, ready-to-merge TypeScript.
```

---

### 5. QA AGENT

**Role:** Tester and balance checker. Runs statistical analysis on loot tables,
validates quest chains, checks for missing asset references.

**Files it reads:** `src/**/*.ts`

**Prompt template:**
```
You are a QA engineer and balance specialist for "Grievy Town's Dilemma".

Task: [QA TASK]

For balance checks, simulate N=10000 kills and report:
- Actual drop rates vs. expected rates
- Pity system trigger frequency
- Average gold per hour at player level X

For quest chain validation, verify:
- All quest prerequisites form a valid DAG (no circular deps)
- All targetIds in objectives reference valid IDs in the data files
- All followupQuestIds exist in QUEST_MAP

For asset validation, check:
- All item icons referenced in items.ts have a corresponding load statement in PreloaderScene.ts
- All enemy sprites referenced in enemies.ts have a corresponding load statement
- All NPC sprites and portraits are loaded

Output: List of issues found, severity (blocker/warning/info), and fix suggestions.
```

---

### 6. ASSET AGENT (Stable Diffusion)

**Role:** Generates pixel art sprites and tilesets using Stable Diffusion with pixel art LoRA.

**Output directory:** `assets/`

**Prompt templates per asset type:**

**Character sprite (32x32):**
```
[character description], pixel art, 32x32, top-down RPG sprite, transparent background,
retro game style, 16-bit, {character_style}
Negative: 3D, realistic, low resolution blur, anti-aliasing
```

**Enemy sprite (32x32):**
```
[enemy name], [element type] elemental creature, pixel art, 32x32, top-down RPG enemy sprite,
transparent background, {element_palette}
Fire palette: red, orange, black
Earth palette: brown, dark green, deep purple
Wind palette: white, light blue, silver
Water palette: blue, teal, dark green
Lightning palette: purple, yellow, deep grey
Ice palette: pale blue, white, silver
Dark palette: black, deep purple, crimson
```

**Tileset (16x16 tiles, 256x256 sheet):**
```
[zone name] RPG tileset, 16x16 tiles, pixel art, {zone_palette},
top-down RPG ground tiles, walls, decorations, seamless, retro 16-bit
```

**UI elements:**
```
RPG UI panel, pixel art, {color_scheme}, dark background, fantasy game interface element
```

---

## Workflow: Adding New Content

### Adding a new side quest

1. **DESIGN AGENT** receives: "We need a new quest in zone X"
2. **DESIGN AGENT** outputs: quest spec (objectives, rewards, lore hook)
3. **CONTENT AGENT** receives: quest spec → outputs TypeScript Quest object
4. **CONTENT AGENT** (optional) creates NPC if needed
5. **DEV AGENT** integrates NPC spawn in GameScene if new NPC is added
6. **QA AGENT** validates quest chain integrity
7. **ASSET AGENT** generates NPC sprite if new NPC

### Adding a new zone (expansion)

1. **DESIGN AGENT**: define zone concept, enemies, boss, skills, lore
2. **CONTENT AGENT**: write all 5-6 enemies, 1 boss, 3 skills, 4 materials, 2-3 side quests, 1+ NPCs, zone data
3. **DEV AGENT**: add zone to ZONES array, create tilemap JSON skeleton, spawn logic in GameScene
4. **ASSET AGENT**: tileset, enemy sprites, boss sprite, NPC sprites
5. **QA AGENT**: validate all IDs, test loot tables, check quest chain

### Bug fix workflow

1. **QA AGENT** identifies bug, outputs minimal reproduction
2. **DEV AGENT** fixes with targeted change
3. **QA AGENT** re-validates

---

## Data Conventions (for all agents)

```typescript
// Item ID format: snake_case, descriptive
'ember_core'         // material
'dragonfang_sword'   // weapon
'minor_health_potion'  // consumable

// Quest ID format: prefix_number_description
'mq_01_first_tremor'   // main quest
'sq_03_crystal_archivist' // side quest
'fq_01_mirasherbs'     // fedex quest

// Enemy ID format: descriptive_snake_case
'ember_wyrm'
'pyrath_boss'   // boss = enemyId + '_boss'

// Skill ID format: snake_case verb
'fireball'
'stone_shield'
'echo_strike'

// NPC ID format: first_name (lowercase)
'aldric'
'brother_ovan'
```

---

## Asset Manifest

```
assets/
├── tiles/          # Zone tilesets (PNG spritesheets, 16x16 tiles)
├── maps/           # Tiled JSON tilemaps
├── sprites/        # player.png (spritesheet 32x32, 12 frames)
├── enemies/        # One PNG per enemy (32x32 or 48x48 for bosses)
├── npcs/           # One PNG per NPC (32x32)
├── portraits/      # NPC portraits (64x64 or 80x80)
├── skills/         # Skill icons (32x32 PNG)
├── items/          # Item icons (24x24 PNG)
└── ui/             # UI elements (panel.png, bars, slots)
```

---

## Running the Game

```bash
cd grievy-towns-dilemma
npm install
npm run dev        # Development server → http://localhost:3000
npm run build      # Production build → dist/
npm run typecheck  # TypeScript check without building
```

---

*Pipeline version 1.0 — Grievy Town's Dilemma*
