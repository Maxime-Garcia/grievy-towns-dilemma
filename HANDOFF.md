# HANDOFF — 18 juillet 2026 (fin de journée, en plein playtest du RunSystem)

> **Point d'entrée pour reprendre.** Fichier stable, réécrit à neuf à chaque passation. **En cas
> de doute, le code fait foi, pas ce fichier.**

---

## 1. ÉTAT EN UNE MINUTE

Chantier en cours : **RunSystem** (tranche 1 du pivot roguelite, spec =
`docs/design/ROGUELITE_POC.md`). Branche `feat/roguelite-run-system` (greffée sur
`feat/roguelite`), **poussée sur origin, pas encore mergée**.

Code complet (9 phases faites), **4 passages code-reviewer** (2 BLOCKER + 8 BUG trouvés et
corrigés), **2 sessions de playtest manuel** par le créateur ont trouvé une dizaine de bugs
fonctionnels réels en plus — tous corrigés au fil de l'eau. **Une 3e session de playtest ce soir
a débouché sur une liste de retours UI/UX à traiter demain (§4), le créateur va dormir.**

`master` intact, `feat/roguelite` intact — rien de ce chantier n'y est encore mergé.

---

## 2. CE QUI A ÉTÉ CONSTRUIT (RunSystem, 9 phases)

- `src/systems/MapGenSystem.ts` — générateur procédural déterministe (grille + salles + arbre
  couvrant minimal + trous), validé par simulation (3200+ combos seed/legIndex, 0 échec de
  connectivité).
- `src/systems/RunBagSystem.ts` — sac de run (CRUD slots sûrs/ordinaires).
- `src/systems/RunSystem.ts` — orchestration (quota, boss, exfiltration, continuer, mort).
- `src/scenes/GameScene.ts` — intégration : bascule carte générée/statique, spawn fini, mécanisme
  des trous, hooks quota/boss dans `onEnemyKilled`, branche run-active dans `onPlayerDeath`.
- `src/scenes/RunBagScene.ts` — écran de sac de run, 3 modes : `pack` (avant de descendre),
  `view` (inventaire intra-run, touche Inventaire pendant une run), `extract` (post-boss,
  S'exfiltrer/Continuer).
- `.claude/agents/mapgen-agent.md` — nouvel agent pour régler l'algorithme du générateur.
- `SAVE_VERSION` 1.8.0 → 1.9.0 (état de run + capacités de sac).

**Touche debug `U`** ouvre le packing directement (aucun PNJ déclencheur livré — content-agent,
hors scope technique). **Touches G/T/M/P/Y désactivées** derrière `DEBUG_CHEAT_KEYS_ENABLED`
(`GameScene.ts`, code gardé, pas supprimé). **Touche `N`** repensée en fixture de test propre.

## 3. BUGS RÉELS TROUVÉS EN PLAYTEST (tous corrigés)

Le playtest manuel a été bien plus efficace que la revue de code seule pour trouver des bugs
fonctionnels — liste pour mémoire, ne pas re-découvrir :

1. **CRITIQUE** : le butin allait dans la banque de GT au lieu du sac de run (jamais câblé).
2. Pas de vrai inventaire intra-run — corrigé (mode `view`).
3. Les trous ne déclenchaient pas la chute — **corrigé deux fois**. Le 1er correctif (marge de
   sécurité sur `physics.add.overlap`) n'a pas suffi. Le 2e a **remplacé tout le mécanisme** par
   un test géométrique direct sur la position du joueur (`checkPitFall()`, appelé depuis
   `update()`) — plus aucune dépendance à `physics.add.overlap`/corps statique pour les trous.
4. Carte générée visuellement plate (textures bitmap réelles d'ignis_reach réutilisées à tort).
5. Pause ne mettait pas en pause les animations ennemies (`anims.pauseAll()` manquant).
6. **BLOCKER** : la touche Inventaire fermait l'écran d'extraction post-boss sans que le joueur
   choisisse Exfiltrer/Continuer → run softlock à vie. Corrigé (RunBagScene expose son mode,
   `pack`/`extract` sont bloquants, seul `view` réagit aux touches annexes).
7. Bug caché trouvé en marge : `InventorySystem.useConsumable` traitait `hpPercent`/`manaPercent`
   comme un SET absolu au lieu d'un ajout — un élixir "+20%" à 90% HP faisait tomber à 20% au lieu
   de monter à 100%. Corrigé et consolidé (`InventorySystem.applyConsumableEffect`, réutilisé par
   la banque ET le sac de run).
8. Sac vide à la création + aucun équipement = injouable. Épée de Fer équipée d'office désormais.
9. 50% HP au retour à Grievy Town après une mort en run — n'avait aucun sens (sac déjà perdu, GT
   est une zone sûre). PV pleins pour ce chemin ; le respawn legacy (même zone) garde 50%.

**Une 4e revue de code tourne peut-être encore en arrière-plan** sur le dernier commit (réécriture
des trous + PV pleins + arme de départ) — vérifier s'il y a une notification en attente avant de
continuer, et appliquer tout BLOCKER/BUG trouvé avant de reprendre.

## 4. À FAIRE DEMAIN — retours UI/UX du 18/07 (RunBagScene)

Le créateur a testé l'écran de sac de run (`RunBagScene`) et remonté cette liste précise, **rien
n'a encore été implémenté** :

1. **Équiper depuis le sac de run** : aujourd'hui seuls les consommables ont une action (clic =
   boire). Les objets récupérés (armes/armures) n'ont **aucun moyen d'être équipés** depuis
   `RunBagScene` — il manque un vrai "côté stuff équipé" (visualiser l'équipement actuel + pouvoir
   équiper une pièce trouvée en run directement depuis cet écran).
2. **Aucune icône nulle part** dans `RunBagScene` — capsules 100% texte actuellement (scope
   délibérément minimal de la tranche technique, cf. commentaire en tête de `RunBagScene.ts`).
   Le créateur veut de vraies icônes maintenant.
3. **Overflow de texte toujours présent** sur les noms d'objets dans les slots (ex: "SCEPTRE",
   "HALLEBAR" qui débordent visuellement sur le slot voisin) — le `wordWrapWidth` déjà posé ne
   suffit pas quand un mot seul est plus large que le slot (Phaser ne coupe pas un mot, seulement
   aux espaces). Il faudra soit tronquer avec `fitText` (déjà utilisé ailleurs dans `UITheme.ts`),
   soit réduire la police, soit — plus probable vu le point 2 — remplacer le texte par une icône.
4. **Titre "SAC DE RUN" → "SAC"** (raccourci).
5. **Supprimer entièrement le sous-titre instructionnel** ("Clique un consommable pour le
   boire...") — le joueur doit comprendre sans texte d'aide.
6. **Supprimer les libellés "SÛRS"/"ORDINAIRES"** — la distinction visuelle (bordure dorése vs
   grise, regroupement spatial) doit suffire, pas besoin de texte.
7. **Changer la répartition du sac : 5 sûrs / 15 ordinaires** (au lieu de 4/16 actuellement) — sac
   total inchangé à 20. Touche `PlayerState.runSafeSlotCapacity` (défaut 4 → 5 dans
   `ProgressionSystem.createFreshPlayer` et la migration de save `SaveSystem.ts`),
   `runBagCapacity` reste 20. **Note** : ceci REVIENT sur la décision du 17/07 ("4 sûrs, pas 8" —
   `ROGUELITE_POC.md` déjà corrigé une fois dans ce sens) — c'est le créateur qui change à nouveau
   le chiffre lui-même, pas une erreur à corriger, juste à appliquer et à refléter dans
   `ROGUELITE_POC.md` §3 pour que la doc reste synchronisée avec le code.
8. **Les boulettes d'expérience"** — le créateur veut qu'elles soient satisfaisantes à voir et à collecter,
  faire intervenir les agents de gamefeel, vfx, ui/ux sur ce sujet
9. **Les bulles d'objets à ramasser par terre toujours pas faite** - même demande que le point 8 : 
faire intervenir les agents cités.

Tout ça est de la **polish d'écran**, pas des bugs fonctionnels — mais assez conséquent (icônes +
équipement depuis le sac de run) pour mériter son propre passage réfléchi plutôt qu'un rustinage
rapide. Possiblement du ressort d'un passage `ux-agent` pour les décisions de layout/hiérarchie
visuelle, avec `dev-agent` pour le câblage (équiper depuis le sac de run touche
`InventorySystem.equip`, qui ne connaît aujourd'hui que `player.inventory`/`player.equipment` — il
faudra un chemin équivalent pour `run.safeBag`/`ordinaryBag`, même distinction que le loot déjà
faite pour `addToRunBag`). Le créateur souhaite faire intervenir les agents d'UI/UX, de gamedesign,
gamefeel

## 5. AUTRES POINTS OUVERTS (non bloquants, notés)

- **Régression save/pity non résolue** : le créateur a signalé que la mémoire de pity disparaît
  après un cycle sauvegarder → Menu Principal → Charger partie. Migration `SAVE_VERSION` relue à
  la main (chaîne complète), aucun bug trouvé côté migration — reste à investiguer en profondeur
  (le créateur a demandé un passage dédié dev-agent + design-agent, pas un correctif à l'aveugle).
- **Délégué à design/gamefeel-agent** (pas encore fait, pas oublié) : indicateur de direction vers
  le boss (aucun repère aujourd'hui), animation des orbes XP (dérive sans fin + pulsation/brillance
  à ajouter).
- **Bulle de loot au sol** : toujours en attente (spec déjà écrite dans `ROGUELITE_POC.md`),
  volontairement après la fin du RunSystem — le sac de run à 20 slots existe maintenant, donc
  "sac plein" peut réellement arriver, ce gap devient pertinent à traiter bientôt.
- **Consommables — gap partiel** : `buffStat`/`buffDuration`/`revive`/`statusCure` d'un
  consommable ne sont toujours appliqués nulle part (seuls hpRestore/manaRestore/hpPercent/
  manaPercent le sont, cf. mémoire `project_consumable_use_gap`).

## 6. PIÈGES CONNUS — ne pas y retomber

- **NE JAMAIS relayer une conclusion d'agent sans la vérifier dans le code.**
- `GAMEPLAY.md` et `PITY/` restent volontairement non touchés (maintenus par le créateur).
- Le créateur édite parfois directement `ROGUELITE_POC.md` entre deux sessions — vérifier
  `git status`/`git diff` avant de supposer son état.
- Le créateur teste **manuellement** en navigateur — jamais de Playwright pour driver une
  vérification de gameplay.
- Les décisions VFX/gamefeel/direction artistique se délèguent à un agent spécialisé
  (gamefeel-agent/design-agent), ne pas les improviser en passant.

## 7. PROCHAINE ACTION CONCRÈTE

1. Vérifier si la revue de code en arrière-plan (commit `4f20cc4`) a rendu un résultat — appliquer
   tout BLOCKER/BUG trouvé.
2. Traiter la liste UI/UX du §4 (RunBagScene : équipement, icônes, overflow, textes, répartition
   5/15) — c'est explicitement la prochaine tâche demandée par le créateur pour la prochaine
   session.
3. Une fois §4 fait et retesté : envisager le passage `balance-agent` sur le quota/l'escalade
   (encore des valeurs volontairement provisoires), puis les lots suivants du pivot (Boss mise en
   scène, Gamefeel, Nettoyage, Consommables étape 5) une fois cette tranche jugée aboutie par le
   créateur.
