# HANDOFF — 19 juillet 2026 (RunSystem — refonte inventaire SAC/ÉQUIPEMENT/STATS)

> **Point d'entrée pour reprendre.** Fichier stable, réécrit à neuf à chaque passation. **En cas
> de doute, le code fait foi, pas ce fichier.**

---

## 1. ÉTAT EN UNE MINUTE

Chantier en cours : **RunSystem** (tranche 1 du pivot roguelite, spec =
`docs/design/ROGUELITE_POC.md`). **`feat/roguelite-run-system` MERGÉE dans `feat/roguelite`** (fast-forward,
0 conflit, branche supprimée locale+distante) — `master` reste intact et à part.

Code de base complet (9 phases), **7 passages code-reviewer** (2 BLOCKER + 13 BUG trouvés et
corrigés au total), **3 sessions de playtest manuel** par le créateur. Dernier chantier : refonte
complète de l'inventaire hors run (`InventoryScene`) ET intra-run (`RunBagScene` modes
`view`/`extract`) pour reproduire EXACTEMENT la capture de référence du créateur (18/07) — layout
plein écran 3 colonnes **SAC | ÉQUIPEMENT | STATISTIQUES**, paperdoll 2×5 + sprite joueur central,
rareté généralisée (bordure dorée fine + fond teinté par rareté), onglets + recherche sur le sac de
run. **7e revue de code reçue et appliquée (2 BUG), pas encore testé en jeu par le créateur.**

**Corrigé (19/07, plus tard dans la nuit)** : les 3 retours de playtest sur la popup d'item
intra-run (`RunBagScene`) — voir §4bis, code-reviewer passé (0 BLOCKER/BUG), poussé. **Pas encore
testé en jeu par le créateur.**

**Premier vrai playtest de la boucle complète (19/07 nuit)** — voir §4ter : 6 retours. 3 fermés
(potion du pack invisible en run + aucune notification à la mort, corrigés ; épée du début perdue à
la mort, confirmé comportement voulu). 1 tranché par balance-agent + design-agent (pity ne doit
jamais reset — probable régression save déjà connue, pas un choix de design). **2 mis au BACKLOG sur
demande du créateur** (root cause non trouvée malgré recherche approfondie, pas de correctif à
l'aveugle) : les trous qui ne déclenchent jamais la chute, et la touche U qui rouvre le pack pendant
une run active — les deux nécessiteraient un indicateur de debug en direct pour capturer une vraie
preuve au prochain repro.

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
10. **Run active fantôme après un chargement de save** (19/07) : `run.active` restait `true` même
    en zone `grievy_town` si le joueur empruntait le réseau de téléports LEGACY (pré-RunSystem,
    toujours actif en parallèle) pour rentrer en ville sans passer par "S'exfiltrer"/la mort — la
    touche Inventaire ouvrait alors `RunBagScene` (20 emplacements) au lieu de `InventoryScene`
    (banque, 400 emplacements), incohérence qui se figeait dans la sauvegarde. Corrigé dans
    `resolveZoneLayout()` (point de passage unique boot+transitions) : `run.active` + zone hors
    `ignis_reach` → run clôturée (`run = null` + notification, différée d'une frame pour ne pas se
    perdre au tout premier appel du boot, avant que `UIScene` écoute).

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

## 4bis. BUGS PLAYTEST 19/07 SOIR — popup item intra-run (CORRIGÉ, PAS ENCORE TESTÉ EN JEU)

Trouvés par le créateur en testant `RunBagScene` juste après le fix loot-drop (commit `6192177`).
**Corrigé la même nuit** — le créateur a tranché sur la portée avant l'implémentation : le nouveau
modèle premier-clic/double-clic s'applique à TOUS les types d'items du sac (pas seulement les
consommables), pas seulement à l'équipement/matériaux. Code-reviewer passé (0 BLOCKER, 0 BUG),
poussé. **Reste à tester en jeu par le créateur** (clic simple = description, double-clic rapproché
sur le même slot = consommer/équiper, plus de badge "i").

**Root cause identifiée** (lecture de `RunBagScene.onBagSlotClicked`, ligne ~924) : le clic sur la
zone principale d'un slot occupé ne mène QUE rarement à `renderItemDetail` :
- Slot `CONSUMABLE` → clic simple appelle directement `consumeItem()` (ligne 936-939) — **aucun
  affichage de description avant l'action**, c'est le bug rapporté (potion bue au 1er clic).
- Slot équipement/matériau/autre → clic simple fait `this.selected = {kind, index}` (sélection pour
  échange/déplacement, ligne 940) — **ne montre pas non plus la description**.
- Seul le petit badge rond "i" (ajouté en bas-gauche de CHAQUE slot occupé, ligne ~887-904, hit zone
  séparée avec `stopPropagation()`) ouvre réellement `renderItemDetail`. C'est précisément CE badge
  que le créateur a rejeté explicitement : *"Tu as mis une zone dans laquelle on peut taper pour
  faire afficher la description, je ne veux pas ça."*

**Comportement demandé par le créateur (verbatim, 19/07 soir)** — remplace le badge "i" et le clic
simple → action directe :
1. Un **premier clic** sur un item (n'importe quel slot occupé, toute la zone du slot — pas une
   sous-zone séparée) affiche sa description (le panneau `renderItemDetail`/`renderItemDetailContent`
   existant, juste déclenché différemment).
2. Un **second clic rapproché** (double-clic, les deux clics doivent être **proches dans le temps**
   — prévoir un seuil, ex. ~300-400ms comme un double-clic standard) déclenche l'action directe
   (consommer pour une potion). Passé le délai, un nouveau clic isolé recommence au point 1
   (réaffiche/rafraîchit la description), pas d'action.
3. Explicitement PAS de zone de clic séparée ("i" badge ou équivalent) — la détection doit se faire
   sur le clic du slot lui-même, en mesurant le temps entre deux `pointerdown` consécutifs sur le
   MÊME slot (garder une trace du dernier slot cliqué + timestamp, comparer à `scene.time.now`).

**Portée tranchée par le créateur** : le double-clic s'applique à TOUS les items (pas seulement les
consommables) — clic simple = description pour n'importe quel slot occupé, second clic rapproché =
action directe SI applicable (consommer pour un consommable, équiper via `onEquipClicked` pour un
équipable ; matériaux/objets-clés n'ont pas d'action directe, le second clic ne fait alors rien de
plus que garder la description affichée).

**Implémentation** (`RunBagScene.onBagSlotClicked`) : champ `lastDetailShownAt` (horodatage du dernier
affichage de détail sur CE slot) comparé à `DOUBLE_CLICK_MS = 350` au clic suivant sur le même slot.
Badge "i" séparé entièrement retiré (plus aucune zone de clic dédiée à la description) — **ne pas le
réintroduire** en le déplaçant/redimensionnant, c'est le principe qui était rejeté, pas son
emplacement/taille.

**Extension au paperdoll (même soir, sur demande explicite)** : le déséquipement suit maintenant le
même modèle — clic simple sur un slot équipé = détail (inchangé), second clic rapproché sur le MÊME
slot = déséquipe direct (nouveau, via `performUnequip()`, extrait du bouton "Déséquiper" existant qui
reste utilisable en parallèle). `lastDetailShownAt` est PARTAGÉ entre sac et paperdoll mais sans
risque de croisement : les deux gardes vérifient `origin.kind` (`'bag'` vs `'equip'`) ET l'identité
exacte du slot avant de comparer le timestamp (vérifié par code-reviewer, 0 BLOCKER/BUG).

**Étendu à `InventoryScene` (hors run) le même soir** : le créateur a signalé "ça ne marche pas dans
l'inventaire hors run" — le double-clic n'existait que dans `RunBagScene`. Même modèle porté vers le
paperdoll d'`InventoryScene` (`performUnequip()` propre à cette scène, `DOUBLE_CLICK_MS` déplacé en
constante PARTAGÉE dans `utils/ItemDetailPanel.ts` pour que les deux scènes restent synchronisées).
**1 BUG trouvé et corrigé par code-reviewer** : `InventoryScene.selectedItem` n'a pas d'origine
discriminée comme `RunBagScene.selectedDetail` — sans garde supplémentaire, fermer le détail (bouton
Fermer/Vendre/Équiper un autre item) puis recliquer le MÊME slot paperdoll <350ms plus tard
déséquipait par erreur (le timestamp/la clé n'étaient jamais nettoyés par ces autres actions). Corrigé
en exigeant AUSSI `this.selectedItem === item` dans la garde de double-clic (le détail doit être
ENCORE affiché sur cet item précis, pas juste "un clic est survenu il y a peu"). Note : la grille
principale du SAC d'`InventoryScene` garde son modèle preexistant tap-immédiat/appui-long (500ms) —
volontairement pas touchée à ce moment-là, le créateur parlait spécifiquement de déséquiper
(paperdoll).

**Grille du sac banque uniformisée aussi (même soir, suite)** : le créateur a signalé "je ne peux pas
double clic pour équiper un objet" dans l'inventaire hors run — question de scope posée
(`AskUserQuestion`), réponse : uniformiser entièrement. L'ancien modèle tap-immédiat (→
`showActionConfirmPopup`, popup flottant Équiper/Utiliser + Annuler) / appui-long 500ms (→ détail) est
**entièrement retiré** (`longPressTimer` et ses 4 sites d'usage supprimés). Nouveau : clic simple =
détail (comme partout ailleurs), double-clic rapproché sur le MÊME item = action directe via
`performQuickAction()` (équiper/consommer, sans passer par le popup de confirmation — le double-clic
EST la confirmation). `doMainAction()`/`showActionConfirmPopup` restent utilisés par le raccourci
clavier `Z` uniquement (pas touché). **1 BUG trouvé et corrigé par code-reviewer** : le texte d'aide
`inventory.tap_hint` ("Tap = action • Maintenir = détail") contredisait le nouveau comportement —
corrigé en fr/en ("Clic = détail • Double-clic = action").

**Les 4 zones du jeu se comportent maintenant IDENTIQUEMENT** : sac RunBagScene, paperdoll
RunBagScene, sac InventoryScene, paperdoll InventoryScene = clic simple/détail, double-clic/action.

**Derniers écarts corrigés aussi (même soir, sur confirmation du créateur)** : la touche `Z` et le
bouton "Utiliser" du panneau docké routent maintenant vers `performQuickAction()` (action directe),
comme le bouton "Équiper" et le double-clic. `doMainAction()`/`showActionConfirmPopup()` (l'ancien
popup de confirmation flottant, ~400 lignes) sont devenus morts (0 appelant) et **entièrement
supprimés** avec toute leur mécanique annexe (`closeConsumePopup`, `getConsumableEffectLine`,
`addColorSquareAbove`, champs `consumePopupObjects`/`consumePopupTimer`/`consumePopupDismissHit`,
imports orphelins). Fichier passé de 1801 à 1320 lignes. Code-reviewer : 0 BLOCKER/BUG — a confirmé
au passage un effet de bord positif (le flash de confirmation à l'équipement se déclenche désormais
aussi pour le bouton "Équiper", qui ne le faisait pas avant la fusion).

**Notes de suivi (non bloquantes, pas dans ce diff)** : 3 commentaires dans `ArsenalScene.ts`,
`BestiaryScene.ts`, `UITheme.ts` référencent encore `InventoryScene.showActionConfirmPopup()` (qui
n'existe plus) comme convention visuelle — cosmétique, à corriger en passant si un de ces fichiers
est retouché. 5 clés i18n (`inventory.use_item`/`equip_item`/`cancel`/`effect_revive`/`effect_cure`)
sont désormais orphelines (n'étaient utilisées QUE par le popup supprimé) — laissées telles quelles
(règle CLAUDE.md : `content/*` = data uniquement, pas de nettoyage i18n dans une PR `feat/*`).

## 4ter. PLAYTEST 19/07 NUIT — 6 retours sur la boucle de run (partiellement corrigé)

Premier vrai playtest de la boucle complète (pack → descente → run → mort/exfiltration → save/load)
depuis le début du chantier. 6 retours simultanés, tous investigués — 2 corrigés en code, 1 délégué
aux agents (réponse reçue), 3 nécessitent une clarification du créateur avant de coder un correctif
(root cause pas certaine à 100% depuis la seule lecture du code, pas de playtest automatisé possible).

**✅ CORRIGÉ — potion emportée invisible en run.** `RunSystem.startRun()` stockait les consommables
choisis dans "PRÉPARER LA DESCENTE" dans un champ `RunState.consumableLoadout` séparé, jamais rendu
ni interactif nulle part dans `RunBagScene` (ni `view` ni `extract`) — le joueur les perdait de facto
(invisibles toute la run, rendus à la banque SEULEMENT si exfiltration réussie, wipés à la mort sans
avoir jamais pu servir). Fix : les items choisis sont maintenant placés DIRECTEMENT dans les slots
SÛRS (`safeBag`) à `startRun()` — mêmes garanties qu'avant (retour garanti à l'exfiltration, perdu à
la mort) mais visibles/consommables via l'UI déjà testée du sac de run (double-clic). `consumableLoadout`
reste dans le type (pas de migration de save) mais toujours vide pour les nouvelles runs — gardé
pour ne pas perdre les items d'une save en cours faite AVANT ce fix. Code-reviewer a trouvé 1 BUG
(items identiques n'empilaient pas — 4× la même potion ouvrait 4 slots sûrs au lieu d'empiler sur 1),
corrigé. **Contrepartie assumée, pas encore passée par balance-agent** : emporter des consommables
mange une partie des 5 slots sûrs normalement réservés au butin trouvé en run.

**✅ CORRIGÉ — aucune notification à la mort en run.** Mourir en run wipait déjà correctement le sac
et renvoyait à Grievy Town à PV pleins (comportement voulu, cf. §3 point 9) mais SANS AUCUN message —
lu par le créateur comme "comme si rien n'avait changé". Ajout d'une notification claire ("Vous êtes
mort — le sac de run est perdu. Retour à Grievy Town.") dans `GameScene.onPlayerDeath()`.

**✅ Pity — avis des agents obtenus, pas un bug de design.** Le créateur a signalé "la Pity se reset
à chaque mort" et a demandé l'avis de balance-agent + design-agent. **Les deux convergent** : aucun
code ne touche `player.killsWithoutEpic/Legendary/Mythic` à la mort (vérifié — ces compteurs vivent
sur `PlayerState`, jamais sur `RunState`) ; le reset qu'il observe est très probablement LA régression
save/pity déjà documentée ci-dessous (§5), qui se manifeste autour de l'événement de mort (autosave/
reload proche dans le temps), pas un vrai lien causal mort→reset. Recommandation unanime : **garder**
la pity comme filet de sécurité de banque qui survit à la mort (seul le sac de run est la perte
voulue) — un reset systématique rendrait le seuil MYTHIC quasi inatteignable pour un joueur qui meurt
normalement (balance-agent : ~35-80 legs sans mourir une seule fois pour l'atteindre). Le sujet réel
reste la régression save/pity elle-même (§5), à traiter par un dev-agent dédié — pas un choix de
design supplémentaire. J'ai vérifié la piste technique de balance-agent (`SaveSystem.ts:151`, cast
`as any` sur `killsWithoutMythic`) : c'est un chemin de migration mort pour toute save déjà à la
version courante (1.9.0), donc PAS la cause active pour une partie jouée ce soir — la vraie cause
reste à trouver dans une session dédiée.

**✅ RÉSOLU (comportement voulu) — mort en run, perte de l'épée du début.** Confirmé par le créateur :
il avait équipé une meilleure arme trouvée en run, l'Épée de Fer de départ avait été reléguée dans le
sac (via `equipFromRunBag`) et a été perdue avec le reste au wipe de mort — pas un bug,
`RunBagSystem.wipe()` ne touche jamais `player.equipment`. La notification de mort ajoutée ci-dessus
devrait suffire à clarifier l'expérience à l'avenir. Fermé.

**🔧 Indicateur de debug — FAIT (19/07, nuit suivante).** `GameScene.getDebugSnapshot()` (public,
lecture seule) + un petit texte monospace dans `UIScene` juste sous le panneau de stats affichent en
direct : `zone`, `run.active`, nombre de trous chargés (`pitCount`), `isDashing`, i-frames restantes
(`iframeMsLeft`), et les 3 compteurs de pity. **Gardé derrière `DEBUG_CHEAT_KEYS_ENABLED`** (exporté
depuis `GameScene.ts`, toujours `false` par défaut) — basculer ce flag à `true` localement pour le
voir apparaître au prochain repro d'un des 3 bugs ci-dessous. Rien à activer côté UIScene, il se crée
tout seul si le flag est `true` au boot.

**📌 BACKLOG (root cause non trouvée, créateur OK pour reporter) — les trous (pits) ne déclenchent
jamais la chute.** Le créateur confirme : ça échoue MÊME en marchant lentement, à froid, en plein
centre du trou — élimine l'hypothèse i-frames/dash. Code relu en profondeur (`checkPitFall`,
`applyDamageToPlayer`, `mitigatePlayerDamage`, `rollAutoDodge`/`rollTrueDodge`, le cycle de vie
d'`isDashing`) : rien d'évident trouvé en lecture statique pour un personnage de base sans passif
spécial. Seul suspect théorique restant, non confirmé : si un dash récent n'a pas fini proprement son
tween d'alpha (300ms, interrompu par une pause/un autre effet touchant `player.alpha`), `isDashing`
pourrait rester bloqué à `true` et bloquer TOUS les dégâts (pas seulement les trous) — mais le
créateur n'a signalé aucune invincibilité face aux ennemis, donc peu probable. **Prochaine étape** :
activer `DEBUG_CHEAT_KEYS_ENABLED` (ci-dessus) et regarder `pits`/`dash` au moment où ça échoue.

**📌 BACKLOG (root cause non trouvée, créateur OK pour reporter) — touche U pendant une run active
affiche quand même l'écran de pack.** Le créateur confirme qu'il explorait ENCORE activement le
donjon (`ignis_reach`) au moment d'appuyer sur U — élimine l'hypothèse "conséquence du bug
consumableLoadout après une mort déjà passée". Le garde `!this.gameState.run?.active` existe pourtant
bien sur LES DEUX points d'entrée de `openRunBagScene('pack')` (touche debug U, flag NPC `start_run`).
Recherche exhaustive de tout ce qui pourrait mettre `run.active`/`gameState.run` à faux PENDANT une
exploration active (mort, exfiltration, garde-fou de zone dans `resolveZoneLayout`, réseau de
téléports legacy) : AUCUN chemin trouvé qui pourrait se déclencher sans que le joueur meure/exfiltre/
quitte réellement `ignis_reach` — et confirmé que la carte générée d'une run n'a de toute façon AUCUN
téléporteur (`MapGenSystem` produit `teleports: []`), donc pas de téléporteur legacy accessible en
run. Root cause non identifiée malgré une recherche approfondie. **Prochaine étape** : activer
`DEBUG_CHEAT_KEYS_ENABLED` et regarder `run.active`/`zone` juste avant d'appuyer sur U.

**✅ Vraisemblablement expliqué (pas un bug distinct) — save/load en cours de run → Grievy Town avec
le même inventaire.** Pas reposé séparément au créateur (fortement probable que ce soit la MÊME
séquence que "mort en run" ci-dessus : mort → correctement renvoyé à GT avec le sac déjà perdu →
sauvegarde → Menu → recharge → GT avec l'inventaire de BANQUE inchangé depuis avant la descente).
`SaveSystem`/`GameScene.create()`/`resolveZoneLayout()` relus : la restauration d'une run VRAIMENT
active est déjà correctement câblée (régénère la carte depuis le seed sauvegardé). À revalider avec
le créateur seulement si le symptôme revient après un save fait alors qu'il est CONFIRMÉ toujours en
run active (pas juste après une mort).

## 5. AUTRES POINTS OUVERTS (non bloquants, notés)

- **Régression save/pity non résolue — BACKLOG (19/07 nuit)** : le créateur a signalé que la mémoire
  de pity disparaît après un cycle sauvegarder → Menu Principal → Charger partie. balance-agent/
  design-agent consultés (cf. §4ter) : confirment que ce n'est PAS un reset lié à la mort, très
  probablement CETTE régression qui se manifeste autour de l'événement. Creusé plus loin ce soir :
  migration `SAVE_VERSION` écartée (chemin mort pour une save déjà en 1.9.0, `SaveSystem.ts:151`
  ne s'exécute jamais sur une partie jouée avec la version courante) ; autosave écarté (ne peut pas
  se déclencher pendant une transition de mort, `isTraveling` bloque tout `update()`). Root cause non
  trouvée sans pouvoir reproduire le cycle sauvegarder→charger soi-même (pas de playtest automatisé)
  — **mis au backlog sur demande explicite du créateur**, comme les trous/touche U (§4ter). Prochaine
  étape si repris : l'indicateur de debug ajouté (§4ter, `DEBUG_CHEAT_KEYS_ENABLED`) affiche déjà les
  3 compteurs pity en direct — le créateur relève leurs valeurs avant/après le cycle complet
  sauvegarder→charger, avec et sans mort entre les deux, pour isoler la vraie cause.
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

## 5ter. BACKLOG — écran de mort (Game Over), spec prête (pas commencé)

Le créateur a produit `EcranMort_Phaser_Prompt.md` (racine du repo, non commité — même statut que
`VFX_Phaser_Prompt.md`/`GAMEPLAY.md`/`PITY/`/`BULLE.md`, maintenu par lui) : spec complète d'une
scène `GameOverScene`/`PlayerDeathOverlay` — révélation en cascade façon "Vous êtes mort" (blason,
titre Silkscreen, trait doré qui se trace, stats de run ÉTAGE/OR/DURÉE, invite "Touchez pour
continuer"), braises montantes en particules, vignette pulsée, fondu au noir sur n'importe quel input
→ callback `onContinue`. Timings précis (~2.6s de révélation totale) et critères d'acceptation
détaillés dans le fichier — ne pas retranscrire de mémoire, le lire en premier le jour où ce chantier
démarre.

**Lien avec le travail de cette nuit** : la notification texte ajoutée à la mort en run
("Vous êtes mort — le sac de run est perdu...", cf. §4ter) est un pansement minimal en attendant cet
écran — pas en concurrence avec lui, à remplacer/compléter le jour où `GameOverScene` existe (garder
le hook `onContinue` compatible avec le retour vers Grievy Town déjà câblé dans
`GameScene.onPlayerDeath()`).

**Précision du créateur (19/07, après coup)** : la séquence voulue est fondu au noir LENT (pas le
`this.cameras.main.fade(500, 0, 0, 0)` actuel de `onPlayerDeath()`, bien trop rapide — la spec du
fichier parle d'une révélation ~2.6s, donc le fondu qui la précède doit être du même ordre de
grandeur, pas 500ms) **puis** apparition de `GameOverScene` par-dessus l'écran déjà noir. Câblage
probable le jour venu : remplacer le fondu rapide + `performZoneTransition` immédiat par un fondu
lent, puis lancer `GameOverScene` (avec les stats du run) une fois le noir atteint ; le retour vers
Grievy Town (`performZoneTransition`) se fait EN ARRIÈRE-PLAN pendant que l'écran de mort est affiché,
ou juste après son `onContinue` — à trancher au moment de l'implémentation, pas maintenant.

**Volontairement pas lancé maintenant** — même raison que le chantier VFX (§5bis) : proposer une fois
`feat/roguelite` stabilisé par un vrai playtest, pas en parallèle d'un autre chantier qui bouge
`GameScene.ts`. Portée plus petite que le VFX (une scène autonome, pas un re-câblage du système de
combo) — candidat raisonnable à lancer AVANT le VFX si le créateur veut une victoire rapide sur du
gamefeel/polish visuel.

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

0. **EN PREMIER** : faire tester en jeu les 2 fix de §4ter (potion du pack visible en run,
   notification de mort) ET le modèle double-clic du sac/paperdoll intra-run (§4bis, jamais testé en
   jeu depuis son écriture).
1. **Confirmation finale du créateur** sur la refonte inventaire (§4) ET le refactor `EquipmentPanel`
   (§4, fait le 19/07) — les défauts trouvés au premier test sont corrigés, en attente d'un dernier
   passage en jeu pour clore ce chantier et merger `feat/roguelite-run-system`.
2. Reprendre le badge équiper/icônes/grille 5-15 du sac de run (déjà testés une fois avant cette
   refonte visuelle, à revérifier que rien n'a régressé).
3. Backlog non bloquant (§4ter, §5) : 3 bugs mis de côté sur demande explicite du créateur, tous
   bloqués sur la même limite (root cause non trouvable sans reproduction en direct, pas de playtest
   automatisé) — les trous qui ne déclenchent jamais la chute, la touche U qui rouvre le pack en run
   active, et la régression save/pity. Reprendre avec le créateur quand il peut reproduire et donner
   des valeurs/observations exactes (proposition : un indicateur de debug en direct pour les 3 d'un
   coup, pas encore codé).
4. Une fois ce qui précède mergé : proposer le chantier VFX armes (§5bis) — pas avant, pour éviter
   de faire bouger `GameScene.ts` sur deux fronts en parallèle.
5. Plus loin : `balance-agent` sur le quota/l'escalade du RunSystem (dont la contrepartie potions
   emportées/slots sûrs, §4ter), puis les lots suivants du pivot (Boss mise en scène, Gamefeel,
   Nettoyage, Consommables étape 5).
