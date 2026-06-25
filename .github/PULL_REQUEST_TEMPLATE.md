## Type de changement

- [ ] `types/*` — Interfaces TypeScript (`src/types/index.ts`)
- [ ] `feat/*` — Nouveau système ou feature
- [ ] `content/*` — Data uniquement (items, quests, enemies, zones, npcs)
- [ ] `fix/*` — Correction de bug
- [ ] `ci/*` — CI/CD, configuration

## Description

<!-- Ce que cette PR fait et pourquoi. 2-3 phrases suffisent. -->

## Checklist

- [ ] La CI est verte (typecheck + build)
- [ ] L'agent `code-reviewer` a été invoqué et tous les BLOCKERs / BUGs sont résolus
- [ ] `src/types/index.ts` n'a pas été modifié (ou modification justifiée ci-dessus)
- [ ] Si `SaveSystem.ts` ou `PlayerState` sont modifiés : `SAVE_VERSION` bumpée + entrée dans `MIGRATION_MAP`
- [ ] `CHANGELOG.md` mis à jour

## Conflits potentiels

<!-- Y a-t-il d'autres branches en cours qui touchent les mêmes fichiers ? -->
<!-- Vérifier avec : git fetch && git diff --name-only origin/master -->
