# Grievy Town's Dilemma

> *« Tu t'es réveillé sur une route dont tu n'as aucun souvenir. Quelqu'un t'a trouvé. Le monde est en train de mourir. Et d'une certaine façon — c'est ta faute. »*

Un RPG d'action 2D vue de dessus développé avec Phaser.js 3 et TypeScript. Six zones élémentaires. Un villain qui a peut-être raison. Un héros qui est bien plus qu'il n'y paraît.

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Phaser](https://img.shields.io/badge/Phaser-3.70-orange?logo=phaser)
![Vite](https://img.shields.io/badge/Vite-5.0-purple?logo=vite)

---

## Histoire

Tu te réveilles aux abords de **Grievy Town**, sans aucun souvenir. Un bûcheron du nom d'**Aldric** te trouve et te recueille.

Le monde de **Velmara** est gouverné par six divinités élémentaires — Pyrath (Feu), Gorvun (Terre), Sylvael (Vent), Thalymor (Eau), Volkran (Foudre), Crysthea (Glace). Un mage nommé **Malachar** a lancé la *Malédiction du Dénouement*, déstabilisant l'équilibre élémentaire et détruisant lentement le monde.

Tu possèdes l'**Écho Magique** — la capacité de copier et d'absorber les propriétés magiques de toute source que tu rencontres. Cela fait de toi le seul capable d'affronter Malachar. Mais en traversant les six zones élémentaires, quelque chose devient évident : tuer le boss de chaque zone ne fait pas que vaincre un ennemi. Ça *tue un dieu*. Définitivement. Et le monde se dégrade à chaque mort divine.

À la fin, tu découvres la vérité : tu es le **Dieu Suprême** — un être absolu qui a choisi de s'oublier et de vivre en tant que mortel. Malachar le savait. Il voulait que tu te réveilles.

On te donne un choix.

**Restaurer** — Reverse ton essence divine dans le monde. Les six divinités renaissent. Grievy Town se remplit de vie. Tu redeviens ordinaire. C'est suffisant.

**Effacer** — Lâche prise sur tout. Velmara se défait comme un rêve. Quelque part dans le néant qui suit, une forme prend corps. Une route. Un corps. Aucun souvenir. Encore. *(Débloque le New Game+)*

---

## Fonctionnalités

### Combat
- Action en temps réel vue de dessus — **WASD** pour se déplacer, **Z** pour attaquer, **Espace** pour le dash
- **6 types élémentaires** avec un cycle de faiblesses : Feu → Eau → Foudre → Terre → Vent → Glace → Feu
- **4 slots de skills équipables** (Q / E / R / F) — mélange libre entre éléments
- Effets de statut : Brûlure, Gel, Étourdissement, Ralentissement
- Régénération HP et mana hors combat

### Progression
- Montée en niveau par XP avec répartition d'attributs (FOR, VIT, AGI, INT, SAG)
- Le niveau des ennemis **s'adapte dynamiquement** au joueur — aucun ordre de zone imposé
- Passif **Soul Echo** : chaque boss tué accorde +3% de dégâts permanents (cumulable jusqu'à ×6)

### Loot & Items
| Rareté | Taux de drop |
|--------|-------------|
| Commun | 60% |
| Peu commun | 25% |
| Rare | 10% |
| Épique | 3,5% |
| Légendaire | 1% |
| Mythique | 0,4% |
| Caché | 0,1% |

- **Système de pity** : 250 kills → drop Épique garanti, 500 kills → drop Légendaire garanti
- 130+ items : armes, armures, accessoires, consommables, matériaux d'artisanat, items de clé
- Slots d'équipement : arme, casque, plastron, jambières, bottes, gants, cape, 2× anneau, amulette

### Skills
- 24 skills au total : 2 par défaut, 3 débloquables par zone élémentaire, 4 cachés
- **Skills cachés** : Soul Echo (passif), Void Step (téléportation), Prism Burst (burst tous éléments), Don d'Elara (régén HP)
- Les skills se méritent — pas d'achat. Vide une zone, parle à un PNJ caché, ou complète une quête

### Quêtes
- **7 quêtes principales** enchaînées sur toute l'histoire
- **8 quêtes secondaires** avec lore et récompenses significatives
- **8 quêtes Fedex** données par les habitants de Grievy Town (livraison, collecte, chasse)

### Dégradation du monde
À mesure que tu vides chaque zone et que sa divinité tombe, le monde se désature visuellement. À 6/6 zones vidées, la caméra est entièrement grise. Le monde sait ce que tu as fait.

### Sauvegarde
- 3 emplacements de sauvegarde avec sauvegarde automatique toutes les 3 minutes
- New Game+ (fin Effacer) : ennemis plus durs, toutes les zones montent en difficulté, Prism Burst disponible dès le niveau 1

---

## Le monde — Velmara

| Zone | Élément | Boss | Lore |
|------|---------|------|------|
| Grievy Town | Neutre | — | Ville de départ. Aldric le bûcheron. Quelque chose cloche ici. |
| Ignis Reach | 🔥 Feu | Pyrath | Hautes terres volcaniques. Routes d'obsidienne. L'incendie ne s'est pas arrêté depuis des décennies. |
| Terravast | 🌍 Terre | Gorvun | Réseau de grottes ancestral. Formations cristallines. Ruines d'une civilisation enfouie. |
| Zephyr Peaks | 💨 Vent | Sylvael | Îles flottantes. Tempêtes éternelles. Le vent se souvient de choses que les gens ont oubliées. |
| Abyssmar | 💧 Eau | Thalymor | Ville noyée. Ruines de corail. La mer l'a engloutie il y a cent ans et ne l'a jamais rendue. |
| Volterra | ⚡ Foudre | Volkran | Plaines métalliques. Machines brisées. Un empire a essayé de domestiquer la foudre et a échoué. |
| Glaciem | ❄️ Glace | Crysthea | Toundra gelée. Grottes de glace. Quelqu'un vit ici seul depuis très, très longtemps. |
| La Flèche de Malachar | 🌑 Ténèbres | Malachar | Une tour qui ne devrait pas exister. Au sommet : l'homme qui a tout déclenché. Et la vérité. |

---

## PNJs

| Nom | Rôle | Emplacement |
|-----|------|-------------|
| **Aldric** | Bûcheron qui trouve le héros | Grievy Town |
| **Mira** | Herboriste, en sait plus qu'elle ne dit | Grievy Town |
| **Theron** | Forgeron, vieux soldat | Grievy Town |
| **Frère Ovan** | Moine archiviste, documente le Dénouement | Grievy Town |
| **Liria** | Fille de l'aubergiste, donne des quêtes Fedex | Grievy Town |
| **Kelvar** | Garde de la ville, pragmatique et sceptique | Grievy Town |
| **Ysolde** | Marchande, gère l'économie du loot | Grievy Town |
| **Elara** | Ermite cachée dans les grottes de Glaciem | Glaciem |

---

## Contrôles

| Touche | Action |
|--------|--------|
| WASD / Flèches directionnelles | Se déplacer |
| Z | Attaquer |
| Espace | Dash (1,5s de recharge, 0,3s d'invincibilité) |
| Q / E / R / F | Utiliser un skill équipé |
| I | Ouvrir l'inventaire |
| K | Ouvrir le menu des skills |

---

## Stack technique

- **[Phaser.js 3.70](https://phaser.io/)** — moteur de jeu 2D, physique arcade, rendu de tilemaps
- **[TypeScript 5](https://www.typescriptlang.org/)** — mode strict sur l'ensemble du projet
- **[Vite 5](https://vitejs.dev/)** — serveur de développement et outil de build
- Tous les assets visuels générés de façon procédurale via Canvas API — aucun PNG externe requis pour jouer
- Tilemaps : format Tiled JSON (8 zones, 40×30 tuiles de 32×32px chacune)
- Système de sauvegarde : `localStorage` avec 3 emplacements et versionnage

---

## Lancer le projet

```bash
git clone https://github.com/Maxime-Garcia/grievy-towns-dilemma.git
cd grievy-towns-dilemma
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

```bash
npm run build      # Build de production → dist/
npm run typecheck  # Vérification TypeScript
```

---

## Structure du projet

```
src/
├── types/          # Interfaces et enums TypeScript (source de vérité)
├── data/           # Données du jeu : zones, ennemis, items, skills, quêtes, PNJs
├── systems/        # Logique pure : combat, loot, progression, quêtes, dialogue, sauvegardes
├── scenes/         # Scènes Phaser : Boot, Menu, Jeu, HUD, Dialogue, Inventaire, Fin
└── utils/          # PlaceholderAssets — génération procédurale de textures

assets/
├── maps/           # 8 tilemaps Tiled JSON
└── (tuiles, sprites, audio — à venir)

agents/
└── PIPELINE.md     # Documentation du pipeline multi-agents

.claude/agents/
└── code-reviewer.md  # Agent d'audit qualité automatisé
```

---

## Pipeline d'agents

Ce projet a été construit et est maintenu à l'aide d'un **pipeline multi-agents Claude Code** :

- **Agent Design** — équilibrage, conception des zones, décisions scénaristiques
- **Agent Contenu** — données TypeScript (quêtes, items, ennemis, dialogues)
- **Agent Dev** — implémentation Phaser/TypeScript
- **Agent Asset** — prompts Stable Diffusion pour les sprites pixel art
- **Agent QA** — simulation de loot, validation des chaînes de quêtes, vérification des assets
- **Code Reviewer** — audit automatisé après chaque modification (TypeScript, cohérence des données, cycle de vie Phaser, balance)

Voir [`agents/PIPELINE.md`](agents/PIPELINE.md) pour la documentation complète.

---

## Crédits

- Game design, code & scénario — Maxime Garcia
- Musiques — *à venir*

---

## Roadmap

- [ ] Vrais assets pixel art (sprites, tilesets)
- [ ] Intégration des musiques
- [ ] Effets sonores
- [ ] Contrôles tactiles mobile
- [ ] Build web / sortie sur itch.io

---

---

# Grievy Town's Dilemma *(English)*

> *"You woke up on a road you don't remember. Someone found you. The world is ending. And somehow — it's your fault."*

A 2D top-down action RPG built with Phaser.js 3 and TypeScript. Six elemental zones. A villain who might be right. A hero who is more than they seem.

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
