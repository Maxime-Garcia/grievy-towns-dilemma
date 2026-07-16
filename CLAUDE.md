# Grievy Town's Dilemma — Instructions Claude Code

## Stack
Phaser.js 3.70 · TypeScript 5 · Vite 5  
`src/types/` → interfaces | `src/data/` → game data | `src/systems/` → pure logic | `src/scenes/` → Phaser

## Règle absolue : Code Reviewer automatique

**Après TOUTE modification de code**, avant de reporter la tâche comme terminée :

1. Vérifier les types avec `npm run typecheck`.
2. Invoquer l'agent `code-reviewer` (`.claude/agents/code-reviewer.md`) via l'outil Agent si plus de 3 fichiers ont été modifiés, ou si un fichier système/données a changé.
3. Appliquer tous les BLOCKER et BUG avant de clore la tâche.

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

- `LootSystem` : comparer les raretés avec `.includes([...])`, jamais avec `>=` sur une string enum
- Toute nouvelle arme dans `src/data/items.ts` **doit** avoir un `equipStats.mainStat` (ATK_FLAT/MATK_FLAT miroir de `damage`/`magicDamage`) — `CombatSystem` lit exclusivement `StatsSystem.computeAll().atk/matk`, jamais `weapon.damage` directement ; sans `equipStats`, l'arme ne contribue quasiment aucun dégât (filet de sécurité dans `StatsSystem.collectEquipTotals` en attendant que la data soit complète)
- `GameScene` : regen hors-combat doit utiliser un timestamp (`lastRegenTime`), pas `% 2 === 0`
- `UIScene` : toujours définir `shutdown()` pour retirer les event listeners de GameScene
- Keyboard listeners dans `GameScene.setupInput()` : stocker les refs et retirer dans `shutdown()`
- `elaras_gift` : son unlock condition référence `'sq_08_find_elara'` (pas `'find_elara'`)
- Soul Echo : le bonus doit être multiplié dans `playerAttack()` ET `playerSkill()`

## Badge de build DEV — règle obligatoire

`src/scenes/UIScene.ts` contient un encadré vert en haut à gauche (variable `BUILD_LABEL`, ligne ~57) qui identifie la dernière feature en cours de test. Il sert à l'utilisateur pour savoir exactement quelle version tourne sans avoir à vider le cache manuellement.

**Le hash ne s'écrit PLUS à la main.** Il est injecté à la compilation par Vite via `__BUILD_HASH__` (`define` dans `vite.config.ts`, déclaré dans `src/vite-env.d.ts`), et suffixé `-dirty` si l'arbre de travail a des modifications non committées.

Motif : un hash n'existe qu'une fois le commit fait, mais l'écrire dans le code refait le commit — donc change le hash. Les badges collés à la main portaient tous le hash d'une version aussitôt remplacée, **introuvable dans l'historique**. Un badge censé identifier la build ne peut pas être maintenu à la main : il doit être dérivé.

**Après chaque commit de code**, ne mettre à jour que la **description** de `BUILD_LABEL` — le nom court de la feature (≤ 50 caractères) :

```ts
const BUILD_LABEL = `BOW: collision physique reelle (${__BUILD_HASH__})`;
```

Cette mise à jour fait partie du commit final de chaque tâche — ce n'est pas un commit séparé. Ne jamais laisser un `BUILD_LABEL` qui décrit une feature précédente.

## Référence thématique obligatoire

**`docs/design/INSPIRATIONS.md`** = source de vérité pour le style, le ton, le gamefeel et les inspirations du projet.  
Tout agent créant du contenu, des effets visuels, des dialogues, des ennemis ou des items **doit le lire en premier**.

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

**Workflow automatique à chaque nouvelle session / nouvelle demande :**

1. `git status` — vérifier l'état actuel
2. Si des modifications non-committées sur `master` → les committer sur une branche dédiée avant de commencer
3. Créer une branche du type correspondant à la tâche (voir tableau ci-dessus) : `git checkout -b feat/<nom>`
4. Implémenter, committer au fil des étapes
5. Invoquer `code-reviewer`, appliquer tous les BLOCKER et BUG (voir Gate ci-dessous)
6. Clore par un commit final (avec mise à jour du `BUILD_LABEL`), push, puis ouvrir une PR (`gh pr create`)
7. Si le code-reviewer signale encore des BLOCKER/BUG au moment de conclure → **ne pas** demander la validation finale, lister les problèmes restants à l'utilisateur d'abord
8. Sinon, poser une question explicite à l'utilisateur (« Merger `<branche>` dans `master` maintenant ? ») via un prompt de validation dédié
9. Si validé : `gh pr merge --delete-branch` (merge la PR + supprime la branche distante), puis `git checkout master && git pull && git branch -d <branche>` pour supprimer la branche locale
10. Objectif permanent : ne jamais laisser de branche mergée traîner — `master` doit rester la seule branche active en local et sur `origin`

> **Ce workflow s'applique automatiquement.** L'utilisateur n'a pas à le demander explicitement.

Chaque session ouvre sa branche, vérifie `git status` avant de commencer, et merge via PR uniquement après CI verte **et** validation explicite de l'utilisateur.

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

Tant qu'un BLOCKER ou un BUG reste ouvert, ne jamais poser la question de merge final à l'utilisateur — les lister explicitement à la place et corriger avant de redemander.
