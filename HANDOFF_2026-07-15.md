# HANDOFF — 15 juillet 2026 (session pausée en pleine étape 4)

> **Point d'entrée pour reprendre.** Ce fichier est réécrit à neuf pour refléter l'état EXACT.
> `HANDOFF_2026-07-14.md` reste valable pour le **contexte figé** (détail des étapes 1 et 2) — on y
> renvoie plutôt que de recopier. **En cas de doute, le code fait foi, pas ces fichiers.**
>
> ⚠️ **Session arrêtée volontairement** (le créateur relance une session pour prendre en compte une
> modification de permissions). **Tous les agents sont stoppés, aucun flux ne tourne.**
> `.claude/settings.json` est modifié et **non commité** : c'est la modif de permissions du créateur,
> **NE PAS committer, NE PAS toucher** — la nouvelle session la récupèrera.

---

## 1. ÉTAT EN UNE MINUTE

Chantier : **transformer le jeu en roguelite d'extraction** (spec = `docs/design/ROGUELITE_POC.md`, elle
prime sur tout). On avance **étape par étape**, chacune sur sa branche, mergée dans `feat/roguelite`.

| Étape | Sujet | État |
|---|---|---|
| 1 | Budget de puissance de l'équipement | ✅ mergée dans `feat/roguelite` |
| 2 | Ennemis et boss | ✅ mergée dans `feat/roguelite` |
| 3 | Armes + vitesse d'attaque | ✅ mergée dans `feat/roguelite`, **validée en jeu** (ASPD ×3,2) |
| **4** | **Sorts, talents, passifs** | 🔄 **EN COURS** sur `feat/roguelite-spells` — Partie 1 commitée, NON vérifiée par moi |
| 5 | Consommables | ⬜ à faire |
| — | Pity | ⬜ **vision du créateur dans `PITY/`, JAMAIS ouverte** |

**`master` est intact** — le jeu d'histoire reste stable et jouable. Rien du roguelite n'y est.
Le gate `code-reviewer` (obligatoire avant toute PR sur `master`) n'a PAS été passé sur le roguelite —
normal, on ne merge pas sur master. Il aura beaucoup à auditer le jour venu.

**Branche courante : `feat/roguelite-spells`.**

---

## 2. LE CONTEXTE (décidé, non rediscutable sans le créateur)

**On abandonne** : les niveaux + points de stats (toute la puissance passe par équipement + sorts +
talents) · toutes les zones existantes · toutes les villes sauf Grievy Town · les 91 PNJ / ~28 quêtes
des autres villes · le New Game+ / fins Erase-Restore.

**On garde** : Grievy Town (hub, un PNJ lance la run) · **le lore et le ton** (libérer le monde, pas
gagner un tournoi) · le loot ARPG entier (648 items, 7 raretés, la Résonance) · Bestiaire / Arsenal / or.

**La boucle** : Grievy Town (on s'équipe, 3 consommables, on choisit une voie élémentaire) → la zone
(quota d'ennemis, le butin tombe dans le sac) → **le boss apparaît** → **choix : s'exfiltrer ou
continuer** → mort = on perd le sac de run · aller au bout = on garde TOUT.
**Critère de succès du PoC** : *après le boss, le choix s'exfiltrer-ou-continuer te tord-il le ventre ?*

**L'exfiltration (Moonlighter)** : un seul sac de **20 emplacements dont 4 SÛRS** (l'équilibrage a
corrigé le 8 initial → 4). Aller au bout → on garde les 20 ; s'exfiltrer → seuls les 4 sûrs remontent,
le reste est perdu. **Pas d'aléatoire.** Les deux nombres s'achètent chez un marchand. ⚠️ Garde-fou
vital : nombre ABSOLU de slots sûrs plafonné à **6** (jamais le ratio — 12/20 et 12/32 remontent la
même valeur). **Zone pilote : le FEU (Ignis).**

Zoom sur les étapes 1-3 : `HANDOFF_2026-07-14.md`. En bref : la progression de rareté était INVERSÉE
(réparée, monotone) ; 9 ennemis spawnaient à PV négatifs et Pyrath tombait en 5 s (réparés, boss = 62 s) ;
la vitesse d'attaque avait 3 canaux dont 2 morts (unifiés) ; source de vérité unique du budget =
`scripts/balanceModel.mjs`, lu par le générateur ET le recalage manuel.

---

## 3. OÙ EN EST L'ÉTAPE 4 (branche `feat/roguelite-spells`)

### La découverte (audit VÉRIFIÉ par moi dans le code)
**68 nœuds de talents sur 87 étaient MORTS** : effets calculés par `TalentSystem` puis **jamais lus par
le moteur de combat**. Vérifié — `atkMult`, `maxHpMult`, `critBonus`, esquive, vol de vie, **tous les
effets élémentaires** consommés dans 0 fichier. `SkillScene` affichait des chiffres FAUX (« +30% ATK »
sur des effets nuls). Deux morts de plus : `skill.castTime` (les sorts « à canalisation » partent
instantanément) et le défaut structurel « **pas de multiplicateur par sort** » (les sorts chers, dont
l'ultime Caché `prism_burst`, sont mathématiquement dominés par les pas chers).

**Point que j'ai connecté et vérifié :** les points de talent viennent EXCLUSIVEMENT des niveaux
(`ProgressionSystem.addXp` → `talentPoints++`), que le roguelite supprime. L'arbre perd sa source de
points de toute façon.

### DÉCISION CRÉATEUR (15/07) : RESSUSCITER l'arbre + lui donner une nouvelle source de points.
« Ressusciter » = **trois travaux distincts**, séquencés :

**Partie 1 — COMMITÉE (`98b12d9`), mais NON VÉRIFIÉE PAR MOI ⚠️**
Rebrancher les effets INCONDITIONNELS (ATK/PV/DEF/crit/élém/vol de vie/mana) en **ADDITIF via
`StatsSystem`** (précédent `getAspdPct` — surtout PAS le canal multiplicatif de `getModifiers` qui
ferait exploser la courbe). L'agent dit avoir créé une fonction `getStatContribs` (nouveau chemin
additif) lue par `StatsSystem.computeAll` + `CombatSystem.outOfCombatRegen`, quarantainé 4 nœuds
ELEM_BONUS élément-restreints (`elementScoped`), re-clé `vig_dull_rage` en conditionnel, et fait
rappeler `recalcStats` par `SkillScene`. Il annonce : 0,00 % avant → vivant après, **IGNIS +44 % DPS,
ABYSSAL +22 % EHP, TERRA +21 % EHP**. `npx tsc --noEmit` vert.
➡️ **À FAIRE EN PREMIER À LA REPRISE : VÉRIFIER ces chiffres dans le code** (mon spot-check rapide était
trompeur : l'agent n'a pas rebranché les vieux champs `atkMult`, il a fait un nouveau chemin
`getStatContribs` — donc grep sur les anciens noms ne prouve rien). Ne rien merger avant vérif.

**Partie 2 — PAS COMMENCÉE (chantier séparé, plus gros)**
Les effets « signature » (`BURN_*`, `SHOCK_*`, `FREEZE_*`, novas/quake/cyclone/chain/guard finishers,
`MAGMA_GUARD`, `DOUBLE_DASH`, `AUTO_DODGE`, `DAMAGE_REDUCTION_PCT`, `LOW_HP_*`, conditionnels runtime…)
exigent de VRAIS nouveaux systèmes de combat dans `GameScene` — feature dédiée (design + gamefeel + dev),
pas de la data. Toujours morts.

**Partie 3 — BLOQUÉE sur le RunSystem**
La nouvelle source de points de talent = décision de méta-progression roguelite. À câbler quand le
`RunSystem` existera (les niveaux, source actuelle, disparaissent).

### Encore à traiter dans l'étape 4 (pas fait)
- **Le mensonge de `SkillScene`** : plusieurs capstones (`glacius_deep_patience`,
  `terra_unshaking_foundation`, `terra_mountain_patience`…) affichent encore des lignes de promesse non
  tenues (leurs effets sont en Partie 2, toujours morts). Soit l'effet devient vrai (Partie 2), soit on
  cesse de l'afficher — inacceptable de laisser un chiffre faux.
- **Les SORTS** : fonctionnent mais les chers sont dominés ; `prism_burst` (ultime Caché) frappe comme
  ~1,4 attaque de base pour 80 mana. Réparable dans `skills.ts`, MAIS le calibrage propre est bloqué par
  le défaut structurel « pas de multiplicateur par sort » (ajouter un champ `damageMultiplier`/`scaling`
  au type `Skill`, lu par `CombatSystem.playerSkill`) — décision à prendre. `skill.castTime` mort à
  brancher ou retirer.
- **Recalibrage des ennemis** : la Partie 1 remonte la puissance du joueur (+21 à +44 % selon la
  branche). L'étape 2 (ennemis) a été calibrée SANS talents. Décider : recalibrer les ennemis contre un
  investissement de talents représentatif, ou assumer que les talents sont l'« edge » du joueur
  (acceptable en roguelite). `balance-agent` a le delta, ne l'a pas appliqué.
- **Les PASSIFS d'objet** sont, eux, **100 % câblés** (`PassiveSystem`) — c'est le modèle à suivre.

---

## 4. POUR REPRENDRE — DANS L'ORDRE

1. **`git checkout feat/roguelite-spells`** (tu y es déjà). L'arbre est propre hors `settings.json`.
2. **VÉRIFIER la Partie 1** (`98b12d9`) dans le code : le nouveau chemin `getStatContribs` est-il
   réellement additif, réellement lu, et les +21/+44 % tiennent-ils ? Lancer `npm run dev` et débloquer
   un talent ATK sur un mannequin : le nombre de dégâts doit maintenant BOUGER (avant : 0). Si OK →
   merger l'étape 4 (partielle) ou continuer ; si faux → corriger avant tout.
3. **Décider le recalibrage ennemis** (cf. delta ci-dessus).
4. **Traiter le mensonge de `SkillScene`** pour les effets encore morts.
5. **Les sorts** : trancher le multiplicateur par sort, puis rééquilibrer + `prism_burst`.
6. **Étape 5** (consommables) — rappel : le vrai levier n'est pas le nombre de slots mais la taille des
   piles (9 résurrections = 100 % de runs finies). 3 slots + plafonds de pile EN RUN (résu 1, élixir 2,
   potion 5).
7. **Lire `PITY/`** (vision du créateur, jamais ouverte).
8. **Puis construire le roguelite lui-même** : `RunSystem` (état, sac 20/4, quota, exfiltration, mort) ·
   la zone pilote (feu, refaite de zéro, spawn fini) · l'UI (bulle d'objet au sol à la couleur de rareté
   + VFX + animation de ramassage + bouton + message « Inventaire plein » — cf. spec §3, → ux + gamefeel ;
   déséquiper sac plein = objet à terre) · l'écran d'exfiltration Moonlighter · le teardown (supprimer
   niveaux/zones/villes/NG+ → **bump `SAVE_VERSION` + `MIGRATION_MAP`**, les saves actuelles ne
   survivront pas) · les 3 prérequis de gamefeel (dont un VRAI bug : l'armure ne protège pas des
   projectiles — cf. plus bas).

Rappel de méthode pour l'agent d'équilibrage : il **simule → applique → re-simule** sur les vrais
modules, distributions p10/p50/p90 + pire cas, commits atomiques, `tsc` vert. Il ne propose jamais un
nombre qu'il n'a pas simulé.

---

## 5. DÉCISIONS OUVERTES / EN ATTENTE DU CRÉATEUR
- **La dague domine le combat mono-cible** même à son coefficient plancher (étape 3). Le seul levier
  pour égaliser = toucher aux fenêtres d'attaque, au risque de changer la sensation. Non tranché.
- **`MDEF_FLAT` sur-payé ×5** (étape 2) : la magie ne fait que 3-18 % des dégâts entrants sur le terrain,
  sa vraie valeur est sur les boss. Mettre plus de lanceurs, ou re-tarifer. Non tranché.
- **Recalibrage ennemis vs talents** (étape 4, cf. §3).
- **Multiplicateur par sort** (étape 4) : ajouter un champ de scaling au type `Skill` ou non.

---

## 6. PIÈGES CONNUS — ne pas y retomber
- **Le pity ment encore** : le world drop refuse un Épique sous le niveau 11, or `ember_wyrm` (ennemi de
  base de la zone Feu) est niveau 8 → 0 Épique en 200 000 kills. **Ne pas afficher le HUD de pity avant
  de régler ça.** Le pool de pity ne contient aucun item Caché.
- **`weapon.attackSpeed` est mort et supprimé** ; l'Arsenal affiche une Cadence dérivée. Ne pas le
  ré-introduire. Idem `TalentSystem.attackSpeedMult` (branché à l'étape 3).
- **Le générateur d'items EST déterministe** — une diff `md5sum` après régénération = artefact LF/CRLF.
  Comparer avec `diff --strip-trailing-cr`. Ne pas repartir en chasse.
- **Un VRAI bug de combat attend** (trouvé par le gamefeel-agent, vérifié) : `applyEnemyMeleeDamage` ne
  teste ni `isDashing` ni les i-frames, et l'overlap projectile **retranche les PV sans passer par la
  mitigation** → **l'armure ne protège pas des projectiles**. À corriger dans les prérequis gamefeel.
- **NE JAMAIS relayer une conclusion d'agent sans la vérifier dans le code.** Ça m'a piégé plusieurs
  fois cette session (« 27 Cachés introuvables » — tous lootables ; « 4 skins orphelins » — 1 seul ;
  greps naïfs sur les patterns). L'audit talents ci-dessus, LUI, a été vérifié — mais la Partie 1
  commitée par l'agent ne l'est PAS encore.

---

## 7. LES BRANCHES
```
master                       ← stable, jouable, intouché par le roguelite
└── feat/roguelite           ← intégration : étapes 1 + 2 + 3 mergées (HEAD 2585228)
    └── feat/roguelite-spells ← étape 4 EN COURS (COURANTE) : audit + décision + Partie 1 (98b12d9)
```
Commits de l'étape 4 sur `feat/roguelite-spells` (au-dessus de `feat/roguelite`) :
- `98b12d9` feat(talents): ressusciter les stats inconditionnelles — NON vérifié par moi
- `c88e33d` docs: étape 4 — 68/87 talents morts, décision créateur = ressusciter
