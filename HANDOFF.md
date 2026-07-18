# HANDOFF — 19 juillet 2026 (RunSystem — refonte inventaire SAC/ÉQUIPEMENT/STATS)

> **Point d'entrée pour reprendre.** Fichier stable, réécrit à neuf à chaque passation. **En cas
> de doute, le code fait foi, pas ce fichier.**

---

## 1. ÉTAT EN UNE MINUTE

Chantier en cours : **RunSystem** (tranche 1 du pivot roguelite, spec =
`docs/design/ROGUELITE_POC.md`). Branche `feat/roguelite-run-system` (greffée sur
`feat/roguelite`), **poussée sur origin, pas encore mergée**.

Code de base complet (9 phases), **7 passages code-reviewer** (2 BLOCKER + 13 BUG trouvés et
corrigés au total), **3 sessions de playtest manuel** par le créateur. Dernier chantier : refonte
complète de l'inventaire hors run (`InventoryScene`) ET intra-run (`RunBagScene` modes
`view`/`extract`) pour reproduire EXACTEMENT la capture de référence du créateur (18/07) — layout
plein écran 3 colonnes **SAC | ÉQUIPEMENT | STATISTIQUES**, paperdoll 2×5 + sprite joueur central,
rareté généralisée (bordure dorée fine + fond teinté par rareté), onglets + recherche sur le sac de
run. **7e revue de code reçue et appliquée (2 BUG), pas encore testé en jeu par le créateur.**

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

**6 passages code-reviewer reçus sur la boucle de run**, tous BLOCKER/BUG appliqués. Le 6e (commit
`ddb9a6b` — équipement sac de run + icônes + polish UI) est revenu **clean** (0 BLOCKER, 0 BUG).

## 4. REFONTE INVENTAIRE SAC/ÉQUIPEMENT/STATS (commit `6c36b5e`) — CODÉE, PAS ENCORE TESTÉE EN JEU

Sur demande explicite du créateur (capture de référence + correction d'ordre des colonnes),
déléguée à `ux-agent` pour reproduire EXACTEMENT le mockup, "et rien d'autre", dans les deux
inventaires (hors run et intra-run) :

1. ✅ **Layout 3 colonnes** dans cet ordre : **SAC | ÉQUIPEMENT | STATISTIQUES** — même ordre dans
   `InventoryScene` (hors run) et `RunBagScene` modes `view`/`extract` (intra-run).
2. ✅ **Paperdoll 2 colonnes × 5 rangées** + sprite du joueur au centre (remplace l'ancienne
   silhouette procédurale style Dofus 3 colonnes) — disposition identique dans les deux écrans.
3. ✅ **Rareté généralisée** : bordure dorée fine + fond teinté par la rareté de l'item, sur TOUS
   les slots (équipement, sac de run, sac hors run, popup de confirmation) —
   `UITheme.drawSlotRarityTint()` (nouveau) posé par-dessus les cadres d'asset opaques.
4. ✅ **Slots vides en bordure pointillée** (`UITheme.strokeDashedRect()`, nouveau — Phaser Graphics
   n'a pas de pointillé natif) + libellé fantôme court.
5. ✅ **Onglets TOUT/ARMES/CONSO/MATER/DIVERS + recherche** sur la grille ordinaire du sac de run
   (`RunBagScene`) — jusqu'ici réservés à `InventoryScene`.
6. ✅ **Slots sûrs** : bordure dorée épaisse + badge numéroté (1..N) + affordance "+" sur les vides.
7. ✅ **Panneau de stats unifié** — extrait dans `utils/StatsPanel.ts` (nouveau), consommé par les
   deux écrans : garantit qu'ils ne peuvent plus diverger à la prochaine passe d'équilibrage.

**Différé, explicitement pas prioritaire** (demande du créateur) : un vrai visuel de personnage
(portrait/rendu réel) à la place du sprite `player_idle` générique actuel dans le panneau
Équipement — mémoire `project_character_visual_inventory`. Non traités non plus (visibles sur la
2e capture mais jamais demandés) : le contrôle de rotation "PIVOTER" et la rangée "TENUES".

**Production notable** : `ux-agent` a été dispatché avec `isolation: "worktree"`, qui s'est avéré
basé sur un commit `master` PÉRIMÉ (`96bc790`, sans RunSystem/RunBagSystem/PityScene, sans accès
shell). L'agent a lu le vrai code de la branche feat pour écrire du code ciblant ses APIs réelles,
sans jamais pouvoir le compiler lui-même. Intégration manuelle ensuite (diffs `UITheme.ts`/
`InventoryScene.ts`/`UI_UX_GUIDELINES.md` appliqués proprement via `git apply`, `RunBagScene.ts`
réécrit intégralement) — `npm run typecheck` clean du premier coup. **7e revue code-reviewer** a
trouvé et corrigé 2 BUG (non détectables par `tsc`) : trois toasts d'erreur de `RunBagScene` émis
sur le mauvais event emitter (jamais affichés à l'écran) ; une course entre le fondu de fermeture de
`RunBagScene` et `GameScene.travelToZone()` qui pouvait réactiver la physique en plein milieu d'un
fondu de zone (nouveau `GameScene.isTravelingNow` pour lever la garde). Worktree/branche de
l'agent supprimés après extraction complète.

**Testé en jeu le 19/07 (960×720 réel)** — plusieurs défauts trouvés vs la capture de référence,
tous corrigés depuis (commits jusqu'à `bf5eb95`) :
- Chevauchement de texte dans le bandeau "SLOTS SÛRS"/"GARDÉS À L'EXTRACTION" → dégradation
  progressive mesurée (vrai `Text.width`, jamais une estimation).
- Onglets `RunBagScene` tronqués ("TO...", "AR...") → passés en icônes bakées `bagtab_*` + tooltip,
  même pattern déjà validé sur `InventoryScene` (jamais repris jusqu'ici).
- Labels de slots d'équipement vides tronqués ("COLLIER"→"CO...") → nouveau `UITheme.wrapLabel()`
  (coupe en plusieurs lignes par mesure réelle, ne produit JAMAIS d'ellipse), appliqué aux DEUX
  scènes qui partageaient le bug.
- Placeholder de recherche tronqué → raccourci en fr/en.
- "+" des slots sûrs vides jugé inutile → retiré ; pointillé dorée remonté en alpha/glow pour rester
  visible sans lui.

**Reste ouvert** : le créateur a signalé une impression de hauteur différente entre slots sûrs et
ordinaires — vérifié dans le code, dimensions strictement identiques (`RB_SLOT=48` des deux côtés),
probablement un effet de poids visuel déjà atténué (alpha du "+" réduit puis "+" supprimé). Pas de
retour de confirmation finale du créateur sur ce point précis au moment de cette écriture.

**Refactor `EquipmentPanel` — FAIT (commit `5d38ccc`)** : `InventoryScene`/`RunBagScene` partagent
désormais le rendu du paperdoll via `utils/EquipmentPanel.ts` (même principe que `StatsPanel.ts`).
Le rendu d'un slot OCCUPÉ reste scene-specific (callback) — InventoryScene garde son interactivité
(cadre asset, survol, clic→détail, flash tap-equip), RunBagScene reste purement visuel. Deux
différences pré-existantes délibérément pas unifiées (documentées dans le fichier) : `colInset`
(14 vs 16) et position du nom/niveau (sous le paperdoll vs bas du panneau). Code-reviewer : 0
BLOCKER, 0 BUG, formules de layout vérifiées identiques ligne à ligne contre l'ancien code.
**Pas encore retesté en jeu après ce refactor** — aucun changement visuel attendu, mais à confirmer.

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

## 5bis. BACKLOG — refonte VFX armes (pas commencé, spec prête)

Le créateur a produit `VFX_Phaser_Prompt.md` (racine du repo, fichier maintenu par lui comme
`GAMEPLAY.md`/`PITY/`/`BULLE.md` — non commité) : spec complète d'un `VfxSystem` Phaser réutilisable
remplaçant les ~15-20 fonctions VFX ad-hoc actuelles de `GameScene.ts` (`spawnWeaponSwingVfx`,
`spawnXFinisherVfx`, `performAltX`) par ~25 primitives composables (arc, crescent, streak, ring,
polyWave, impactStar, bloom, debris, bolt, scorch, crossCut, ghostDash, vortex, etc.) + une couche
polish (`groundGlow`, `elementFlair` par élément). Composition EXACTE donnée pour 33 effets (11
armes × 3 couches base/finisher/alt) — voir le fichier, ne pas retranscrire de mémoire.

**Précision du créateur (19/07)** : ce n'est pas qu'un remplacement visuel — il faudra aussi
re-câbler le système de combo (`src/data/combos.ts`, `comboCount`/`chainLength`, les points de
déclenchement finisher/alt déjà existants dans `GameScene.ts`) pour qu'il appelle `VfxSystem.play()`
avec le bon `layer` et les bons `opts` au bon moment — une vraie passe d'intégration, pas juste
substituer les fonctions de dessin.

**Volontairement pas lancé maintenant** (demande explicite du créateur, cf. mémoire
`project_weapon_vfx_overhaul_backlog`) : c'est le plus gros chantier VFX à ce jour, touche
`GameScene.ts` de façon extensive — à ne pas lancer en parallèle du chantier RunSystem qui bouge
déjà ce fichier. Proposer une fois §4/§5bis-refactor validés et mergés. Prévoir plusieurs passes
(dev-agent pour l'architecture/primitives, gamefeel-agent pour le polish des 33 compositions) et
plusieurs allers-retours de playtest — pas un one-shot comme `FloatingItemDrop`.

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

1. **Confirmation finale du créateur** sur la refonte inventaire (§4) ET le refactor `EquipmentPanel`
   (§4, fait le 19/07) — les défauts trouvés au premier test sont corrigés, en attente d'un dernier
   passage en jeu pour clore ce chantier et merger `feat/roguelite-run-system`.
2. Reprendre le badge équiper/icônes/grille 5-15 du sac de run (déjà testés une fois avant cette
   refonte visuelle, à revérifier que rien n'a régressé).
3. Une fois ce qui précède mergé : proposer le chantier VFX armes (§5bis) — pas avant, pour éviter
   de faire bouger `GameScene.ts` sur deux fronts en parallèle.
4. Plus loin : `balance-agent` sur le quota/l'escalade du RunSystem, puis les lots suivants du pivot
   (Boss mise en scène, Gamefeel, Nettoyage, Consommables étape 5).
