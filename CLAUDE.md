# Grievy Town's Dilemma — Instructions Claude Code

## Stack
Phaser.js 3.70 · TypeScript 5 · Vite 5  
`src/types/` → interfaces | `src/data/` → game data | `src/systems/` → pure logic | `src/scenes/` → Phaser

## Règle absolue : Code Reviewer automatique

**⚠️ Environnement : ordinateur professionnel avec security policies — aucune commande shell (npm, node, tsc) ne peut être exécutée automatiquement.**

**Après TOUTE modification de code**, avant de reporter la tâche comme terminée :

1. Vérifier les types manuellement par lecture du code (pas d'exécution de `npm run typecheck`).
2. Invoquer l'agent `code-reviewer` (`.claude/agents/code-reviewer.md`) via l'outil Agent si plus de 3 fichiers ont été modifiés, ou si un fichier système/données a changé.
3. Appliquer tous les BLOCKER et BUG avant de clore la tâche.

Pour jouer au jeu (`npm run dev`) ou builder (`npm run build`), lancer les commandes manuellement depuis un terminal sur cette machine ou sur une machine sans restrictions.

## Conventions de données

```
Item IDs     : snake_case descriptif           (ex: ember_core, iron_sword)
Quest IDs    : prefix_nn_description           (ex: mq_01_awakening, sq_03_crystal_archivist)
Enemy IDs    : descriptif_snake_case           (boss = zoneId + '_boss')
Skill IDs    : snake_case verb/noun            (ex: fireball, stone_shield)
NPC IDs      : prénom en minuscules            (ex: aldric, brother_ovan)
Texture keys : catégorie_id                    (ex: enemy_ember_wyrm, npc_aldric, portrait_aldric)
```

## Points critiques (issus de l'audit)

- `InventorySystem.equip()` : toujours appeler `setInventoryPlayerContext(player)` avant
- `LootSystem` : comparer les raretés avec `.includes([...])`, jamais avec `>=` sur une string enum
- `GameScene` : regen hors-combat doit utiliser un timestamp (`lastRegenTime`), pas `% 2 === 0`
- `UIScene` : toujours définir `shutdown()` pour retirer les event listeners de GameScene
- Keyboard listeners dans `GameScene.setupInput()` : stocker les refs et retirer dans `shutdown()`
- `elaras_gift` : son unlock condition référence `'sq_08_find_elara'` (pas `'find_elara'`)
- Soul Echo : le bonus doit être multiplié dans `playerAttack()` ET `playerSkill()`

## Architecture agents

- `code-reviewer` → audit complet (6 étapes : TS, données, Phaser lifecycle, balance, saves, rapport)
- Invoquer avec : `Agent({ subagent_type: "claude", prompt: "Lis .claude/agents/code-reviewer.md puis exécute le protocole sur src/" })`

## Commandes

```bash
npm run dev        # Dev server → localhost:3000
npm run build      # Production build
npm run typecheck  # Vérification TypeScript sans build
```

---

## Gouvernance du projet

### Stratégie de branches

Ne jamais commiter directement sur `master`. `master` est toujours buildable et jouable.

```
master           → stable, toujours jouable, CI obligatoire
feat/<nom>       → nouvelle feature ou système (ex: feat/mobile, feat/crafting-ui)
content/<nom>    → data uniquement (items, quests, enemies, npcs)
fix/<nom>        → correction de bug ciblée
ci/<nom>         → CI/CD, configuration, scripts
```

Chaque session ouvre sa branche, vérifie `git status` avant de commencer, et merge via PR uniquement après CI verte.

### Types de PR — ne jamais mélanger

| Branche | Contenu autorisé |
|---------|-----------------|
| `types/*` | `src/types/index.ts` uniquement |
| `feat/*` | Un seul système ou feature à la fois |
| `content/*` | Fichiers `src/data/` uniquement |
| `fix/*` | Un seul bug, fichiers minimaux |

### Save schema

Toute modification de `PlayerState`, `WorldState` ou `GameState` dans `src/types/index.ts` **oblige** :
1. Bumper `SAVE_VERSION` dans `SaveSystem.ts` (semver : `1.0.0` → `1.1.0`)
2. Ajouter une entrée dans `MIGRATION_MAP` avec les valeurs par défaut des nouveaux champs

### Milestones jouables

Tagger après chaque zone complète ou feature majeure :
```bash
git tag v<X>.<Y>.0-<description>   # ex: v0.8.0-terravast-zone
git push --tags
```

### Gate code-reviewer

Invoquer `code-reviewer` avant toute PR sur `master`. Résoudre tous les BLOCKERs et BUGs avant de merge.
