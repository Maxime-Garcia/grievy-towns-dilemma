# HANDOFF — 18 juillet 2026 (RunSystem — polish UI en cours)

> **Point d'entrée pour reprendre.** Fichier stable, réécrit à neuf à chaque passation. **En cas
> de doute, le code fait foi, pas ce fichier.**

---

## 1. ÉTAT EN UNE MINUTE

Chantier en cours : **RunSystem** (tranche 1 du pivot roguelite, spec =
`docs/design/ROGUELITE_POC.md`). Branche `feat/roguelite-run-system` (greffée sur
`feat/roguelite`), **poussée sur origin, pas encore mergée**.

Code de base complet (9 phases), **5 passages code-reviewer** (2 BLOCKER + 11 BUG trouvés et
corrigés au total), **3 sessions de playtest manuel** par le créateur. La liste de retours UI/UX
du 18/07 sur `RunBagScene` (§4) **est maintenant traitée** (équipement depuis le sac de run,
icônes, overflow, textes, répartition 5/15) — **6e revue de code en cours en arrière-plan sur ce
dernier commit, pas encore reçue au moment de cette écriture.**

`master` intact, `feat/roguelite` intact — rien de ce chantier n'y est encore mergé.

---

## 2. CE QUI A ÉTÉ CONSTRUIT (RunSystem, 9 phases + polish UI)

- `src/systems/MapGenSystem.ts` — générateur procédural déterministe (grille + salles + arbre
  couvrant minimal + trous), validé par simulation (3200+ combos seed/legIndex, 0 échec de
  connectivité).
- `src/systems/RunBagSystem.ts` — sac de run (CRUD slots sûrs/ordinaires).
- `src/systems/RunSystem.ts` — orchestration (quota, boss, exfiltration, continuer, mort).
- `src/systems/InventorySystem.ts` — `equipFromRunBag()` (nouveau) : équiper directement un objet
  du sac de run, l'ancien équipement revient dans le MÊME emplacement (jamais perdu, jamais vers
  la banque). `applyConsumableEffect()` (nouveau) : logique de soin partagée banque/sac de run.
- `src/scenes/GameScene.ts` — intégration : bascule carte générée/statique, spawn fini, mécanisme
  des trous (`checkPitFall()`, test géométrique direct — pas de physique), hooks quota/boss dans
  `onEnemyKilled`, branche run-active dans `onPlayerDeath` (PV pleins au retour à GT).
- `src/scenes/RunBagScene.ts` — écran de sac de run, 3 modes (`pack`/`view`/`extract`). **Icônes
  partout** (`resolveIcon()`, même chaîne de repli qu'InventoryScene), **badge "E" pour équiper**
  directement un objet équipable (hit zone séparée + `stopPropagation`), bande d'équipement actuel
  affichée en haut, titre court, aucun sous-titre, aucun label "SÛRS"/"ORDINAIRES".
- `.claude/agents/mapgen-agent.md` — nouvel agent pour régler l'algorithme du générateur.
- `SAVE_VERSION` 1.8.0 → 1.9.0 (état de run + capacités de sac : **5 sûrs / 15 ordinaires**,
  révisé le 18/07 — `ROGUELITE_POC.md` §3 synchronisée).

**Touche debug `U`** ouvre le packing directement (aucun PNJ déclencheur livré — content-agent,
hors scope technique). **Touches G/T/M/P/Y désactivées** derrière `DEBUG_CHEAT_KEYS_ENABLED`
(`GameScene.ts`, code gardé, pas supprimé). **Touche `N`** repensée en fixture de test propre
(équipement modeste + 2 potions + sac vide).

## 3. BUGS RÉELS TROUVÉS EN PLAYTEST (tous corrigés)

Le playtest manuel a été bien plus efficace que la revue de code seule pour trouver des bugs
fonctionnels — liste pour mémoire, ne pas re-découvrir :

1. **CRITIQUE** : le butin allait dans la banque de GT au lieu du sac de run (jamais câblé).
2. Pas de vrai inventaire intra-run — corrigé (mode `view`).
3. Les trous ne déclenchaient pas la chute — **corrigé deux fois**. Le 1er correctif (marge de
   sécurité sur `physics.add.overlap`) n'a pas suffi. Le 2e a **remplacé tout le mécanisme** par
   un test géométrique direct sur la position du joueur (`checkPitFall()`), plus aucune dépendance
   à `physics.add.overlap`/corps statique pour les trous.
4. Carte générée visuellement plate (textures bitmap réelles d'ignis_reach réutilisées à tort).
5. Pause ne mettait pas en pause les animations ennemies (`anims.pauseAll()` manquant).
6. **BLOCKER** : la touche Inventaire fermait l'écran d'extraction post-boss sans que le joueur
   choisisse Exfiltrer/Continuer → run softlock à vie. Corrigé (RunBagScene expose son mode,
   `pack`/`extract` sont bloquants, seul `view` réagit aux touches annexes).
7. `InventorySystem.useConsumable` traitait `hpPercent`/`manaPercent` comme un SET absolu au lieu
   d'un ajout — un élixir "+20%" à 90% HP faisait tomber à 20% au lieu de monter à 100%. Corrigé et
   consolidé (`applyConsumableEffect`, réutilisé banque + sac de run).
8. Sac vide à la création + aucun équipement = injouable. Épée de Fer équipée d'office désormais.
9. 50% HP au retour à Grievy Town après une mort en run — n'avait aucun sens (sac déjà perdu, GT
   est une zone sûre). PV pleins pour ce chemin ; le respawn legacy (même zone) garde 50%.

**5 passages code-reviewer reçus, tous BLOCKER/BUG appliqués.** Un **6e tourne en arrière-plan**
sur le commit `ddb9a6b` (équipement sac de run + icônes + polish UI, §4 ci-dessous) — vérifier s'il
y a une notification en attente avant de continuer, appliquer tout BLOCKER/BUG trouvé en premier.

## 4. RETOURS UI/UX DU 18/07 (RunBagScene) — TRAITÉS

Tous les points fonctionnels/visuels demandés par le créateur après son 3e playtest sont
implémentés (commit `ddb9a6b`) :

1. ✅ **Équiper depuis le sac de run** — badge "E" sur chaque objet équipable, bande d'équipement
   actuel affichée en haut de l'écran.
2. ✅ **Icônes partout** — `resolveIcon()`, plus aucune capsule 100% texte.
3. ✅ **Overflow de texte** — résolu par les icônes (le nom en texte n'apparaît quasiment plus) +
   `fitText()` en repli pour le peu de texte restant (mode `pack`).
4. ✅ **Titre raccourci** — "SAC" (mode `view`).
5. ✅ **Sous-titre instructionnel retiré.**
6. ✅ **Labels "SÛRS"/"ORDINAIRES" retirés** — bordure dorée/grise + regroupement spatial suffisent.
7. ✅ **Répartition 5 sûrs / 15 ordinaires** (était 4/16) — `ProgressionSystem`, `SaveSystem`,
   `ROGUELITE_POC.md` §3 synchronisés.

**Restent délégués, pas traités ici** (décision explicite du créateur — VFX/gamefeel, pas du
ressort d'un correctif de passage) :
8. **Orbes XP** — dérive sans fin au lieu de se poser, veut une pulsation/brillance satisfaisante à
   collecter. → `gamefeel-agent`/`design-agent`.
9. **Bulles de loot au sol** — toujours pas implémentées (spec déjà écrite dans
   `ROGUELITE_POC.md`), même délégation.

**Non vérifié en jeu** : ce commit n'a pas encore été retesté manuellement par le créateur (écrit
juste après implémentation, avant la fin de session). À tester en priorité à la prochaine session :
badge équiper (swap correct, rien perdu/dupliqué en cas limite ring1/ring2 occupés par deux objets
différents), rendu des icônes (vraies textures vs carré de repli), lisibilité de la grille 5/15.

## 5. AUTRES POINTS OUVERTS (non bloquants, notés)

- **Régression save/pity non résolue** : le créateur a signalé que la mémoire de pity disparaît
  après un cycle sauvegarder → Menu Principal → Charger partie. Migration `SAVE_VERSION` relue à
  la main (chaîne complète), aucun bug trouvé côté migration — reste à investiguer en profondeur
  (le créateur a demandé un passage dédié dev-agent + design-agent, pas un correctif à l'aveugle).
- **Indicateur de direction vers le boss** — aucun repère aujourd'hui pour savoir où il est sur la
  carte générée. Délégué à `design-agent`/`gamefeel-agent`.
- **Consommables — gap partiel** : `buffStat`/`buffDuration`/`revive`/`statusCure` d'un
  consommable ne sont toujours appliqués nulle part (seuls hpRestore/manaRestore/hpPercent/
  manaPercent le sont, cf. mémoire `project_consumable_use_gap`).

## 6. PIÈGES CONNUS — ne pas y retomber

- **NE JAMAIS relayer une conclusion d'agent sans la vérifier dans le code.**
- `GAMEPLAY.md` et `PITY/` restent volontairement non touchés (maintenus par le créateur).
- Le créateur édite parfois directement `ROGUELITE_POC.md`/`HANDOFF.md` en parallèle d'une session
  — toujours vérifier `git status`/`git diff` avant de supposer l'état d'un fichier, et en cas
  d'édition concurrente détectée, fusionner proprement plutôt qu'écraser (un fragment de phrase
  interrompue vaut mieux qu'un contenu perdu ou deviné à sa place).
- Le créateur teste **manuellement** en navigateur — jamais de Playwright pour driver une
  vérification de gameplay.
- Les décisions VFX/gamefeel/direction artistique se délèguent à un agent spécialisé
  (gamefeel-agent/design-agent), ne pas les improviser en passant.

## 7. PROCHAINE ACTION CONCRÈTE

1. Vérifier si la revue de code en arrière-plan (commit `ddb9a6b`) a rendu un résultat — appliquer
   tout BLOCKER/BUG trouvé.
2. Faire tester au créateur le badge équiper + les icônes + la grille 5/15 (§4, jamais vérifié en
   jeu par un humain pour l'instant).
3. Une fois §4 validé en jeu : envisager le passage `balance-agent` sur le quota/l'escalade (encore
   des valeurs volontairement provisoires), puis les lots suivants du pivot (Boss mise en scène,
   Gamefeel, Nettoyage, Consommables étape 5) une fois cette tranche jugée aboutie par le créateur.
