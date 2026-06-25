# Grievy Town's Dilemma

> *"You woke up on a road you don't remember. Someone found you. The world is ending. And somehow — it's your fault."*

A 2D top-down action RPG built with Phaser.js 3 and TypeScript. Six elemental zones. A villain who might be right. A hero who is more than they seem.

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Phaser](https://img.shields.io/badge/Phaser-3.70-orange?logo=phaser)
![Vite](https://img.shields.io/badge/Vite-5.0-purple?logo=vite)

---

## Story

You wake up on the outskirts of **Grievy Town** with no memory. A woodcutter named **Aldric** finds you and takes you in.

The world of **Velmara** is governed by six elemental divinities — Pyrath (Fire), Gorvun (Earth), Sylvael (Wind), Thalymor (Water), Volkran (Lightning), Crysthea (Ice). A mage named **Malachar** has cast the *Unraveling Curse*, destabilizing the elemental balance and slowly destroying the world.

You possess **Echo Magic** — the ability to copy and absorb magical properties from any source you encounter. It makes you uniquely capable of challenging Malachar. But as you fight your way through the six elemental zones, something becomes clear: killing the boss of each zone doesn't just defeat an enemy. It *kills a god*. Permanently. And the world degrades with every divine death.

At the end, you discover the truth: you are the **God of All** — a supreme being who chose to forget themselves and live as a mortal. Malachar knew. He wanted you to wake up.

You are given a choice.

**Restore** — Pour your divine essence back into the world. The six divinities are reborn. Grievy Town fills with life. You become ordinary. It is enough.

**Erase** — Let go of everything. Velmara unravels like a dream. Somewhere in the nothing that follows, a shape assembles itself. A road. A body. No memory. Again. *(Unlocks New Game+)*

---

## Features

### Combat
- Real-time top-down action — **WASD** to move, **Z** to attack, **Space** to dash
- **6 elemental types** with a weakness cycle: Fire → Water → Lightning → Earth → Wind → Ice → Fire
- **4 equippable skill slots** (Q / E / R / F) — mix and match across elements
- Status effects: Burn, Freeze, Stun, Slow
- Out-of-combat HP and mana regeneration

### Progression
- XP-based leveling with attribute allocation (STR, VIT, AGI, INT, WIS)
- Enemy level **dynamically scales** to the player — no fixed zone order required
- **Soul Echo** passive: each boss killed grants +3% permanent damage (stacks up to ×6)

### Loot & Items
| Rarity | Drop Rate |
|--------|-----------|
| Common | 60% |
| Uncommon | 25% |
| Rare | 10% |
| Epic | 3.5% |
| Legendary | 1% |
| Mythic | 0.4% |
| Hidden | 0.1% |

- **Pity system**: 250 kills → guaranteed Epic drop, 500 kills → guaranteed Legendary
- 130+ items: weapons, armor, accessories, consumables, crafting materials, key items
- Equipment slots: weapon, helm, chest, legs, boots, gloves, cape, 2× ring, amulet

### Skills
- 24 skills total: 2 default, 3 unlockable per elemental zone, 4 hidden
- **Hidden skills**: Soul Echo (passive), Void Step (teleport), Prism Burst (all-element burst), Elara's Gift (HP regen)
- Skills are earned — not bought. Clear a zone, talk to a hidden NPC, or complete a quest

### Quests
- **7 main quests** chained across the full story
- **8 side quests** with lore and meaningful rewards
- **8 Fedex quests** from Grievy Town villagers (delivery, collection, kill tasks)

### World Degradation
As you clear each zone and its divinity falls, the world visually desaturates. At 6/6 zones cleared, the camera is fully grey. The world knows what you've done.

### Save System
- 3 save slots with auto-save every 3 minutes
- New Game+ (Erase ending): harder enemies, all zones scale harder, Prism Burst available from level 1

---

## World — Velmara

| Zone | Element | Boss | Lore |
|------|---------|------|------|
| Grievy Town | Neutral | — | Starting town. Aldric the woodcutter. Something feels wrong here. |
| Ignis Reach | 🔥 Fire | Pyrath | Volcanic highlands. Obsidian roads. The fire hasn't stopped in decades. |
| Terravast | 🌍 Earth | Gorvun | Ancient cave network. Crystal formations. Ruins of a buried civilization. |
| Zephyr Peaks | 💨 Wind | Sylvael | Floating islands. Eternal storms. The wind remembers things people forget. |
| Abyssmar | 💧 Water | Thalymor | Drowned city. Coral ruins. The sea swallowed it a hundred years ago and never gave it back. |
| Volterra | ⚡ Lightning | Volkran | Metallic plains. Shattered machinery. An empire tried to harness lightning and failed. |
| Glaciem | ❄️ Ice | Crysthea | Frozen tundra. Ice caves. Someone has been living here alone for a very long time. |
| Malachar's Spire | 🌑 Dark | Malachar | A tower that shouldn't exist. At the top: the man who started all of this. And the truth. |

---

## NPCs

| Name | Role | Location |
|------|------|----------|
| **Aldric** | Woodcutter who finds the hero | Grievy Town |
| **Mira** | Herbalist, knows more than she says | Grievy Town |
| **Theron** | Blacksmith, old soldier | Grievy Town |
| **Brother Ovan** | Archivist monk, documents the Unraveling | Grievy Town |
| **Liria** | Innkeeper's daughter, gives Fedex quests | Grievy Town |
| **Kelvar** | Town guard, practical and skeptical | Grievy Town |
| **Ysolde** | Merchant, tracks the loot economy | Grievy Town |
| **Elara** | Hidden hermit in the Glaciem ice caves | Glaciem |

---

## Controls

| Key | Action |
|-----|--------|
| WASD / Arrow keys | Move |
| Z | Attack |
| Space | Dash (1.5s cooldown, 0.3s invincibility) |
| Q / E / R / F | Use equipped skill |
| I | Open inventory |
| K | Open skill menu |

---

## Tech Stack

- **[Phaser.js 3.70](https://phaser.io/)** — 2D game engine, arcade physics, tilemap rendering
- **[TypeScript 5](https://www.typescriptlang.org/)** — strict mode throughout
- **[Vite 5](https://vitejs.dev/)** — dev server and build tool
- All visual assets generated procedurally via Canvas API — no external PNGs required to run
- Tilemaps: Tiled JSON format (8 zones, 40×30 tiles each at 32×32px)
- Save system: `localStorage` with 3 slots and versioning

---

## Getting Started

```bash
git clone https://github.com/Maxime-Garcia/grievy-towns-dilemma.git
cd grievy-towns-dilemma
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build      # Production build → dist/
npm run typecheck  # TypeScript check
```

---

## Project Structure

```
src/
├── types/          # TypeScript interfaces and enums (source of truth)
├── data/           # Game data: zones, enemies, items, skills, quests, NPCs
├── systems/        # Pure logic: combat, loot, progression, quests, dialogue, saves
├── scenes/         # Phaser scenes: Boot, Menu, Game, UI, Dialogue, Inventory, Ending
└── utils/          # PlaceholderAssets — procedural texture generation

assets/
├── maps/           # 8 Tiled JSON tilemaps
└── (tiles, sprites, audio — to be added)

agents/
└── PIPELINE.md     # Multi-agent development pipeline documentation

.claude/agents/
└── code-reviewer.md  # Automated code quality auditor
```

---

## Agent Pipeline

This project was built and is maintained using a **multi-agent Claude Code pipeline**:

- **Design Agent** — game balance, zone design, story decisions
- **Content Agent** — TypeScript data (quests, items, enemies, dialogue)
- **Dev Agent** — Phaser/TypeScript implementation
- **Asset Agent** — Stable Diffusion prompts for pixel art sprites
- **QA Agent** — loot simulation, quest chain validation, asset checks
- **Code Reviewer** — automated audit after every modification (TypeScript, data consistency, Phaser lifecycle, balance)

See [`agents/PIPELINE.md`](agents/PIPELINE.md) for full documentation.

---

## Credits

- Game design, code & story — Maxime Garcia
- Music — *coming soon*

---

## Roadmap

- [ ] Real pixel art assets (sprites, tilesets)
- [ ] Music integration
- [ ] Sound effects
- [ ] Mobile touch controls
- [ ] Web build / itch.io release
