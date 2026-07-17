# HANDOFF — 17 juillet 2026 (fin de journée, avant le chantier RunSystem)

> **Point d'entrée pour reprendre.** Fichier stable, réécrit à neuf à chaque passation (plus
> d'accumulation par date — consolidation du 17/07). **En cas de doute, le code fait foi, pas ce
> fichier.**

---

## 1. ÉTAT EN UNE MINUTE

Chantier : **transformer le jeu en roguelite d'extraction** (spec = `docs/design/ROGUELITE_POC.md`,
elle prime sur tout). On avance par LOTS, chacun sur sa branche, mergé dans `feat/roguelite`.

| Étape / lot | État |
|---|---|
| 1. Budget de puissance de l'équipement | ✅ mergée |
| 2. Ennemis et boss | ✅ mergée |
| 3. Armes + vitesse d'attaque | ✅ mergée, validée en jeu (ASPD ×3,2) |
| 4. Sorts/talents/passifs — Talents Partie 1 | ✅ mergée |
| 4. Sorts/talents/passifs — Talents Partie 2 (55 nœuds) | ✅ **fermée et mergée le 17/07** |
| Système Pity (EPIC/LEGENDARY/MYTHIC) | ✅ **fermé et mergé le 17/07**, 2 passes de redesign UI faites |
| 4 correctifs UI (popup loot, grille inventaire, fermeture Pity, style) | ✅ **fermé et mergé le 17/07** |
| "Réglage des dégâts de sorts" | ⬜ **bloqué** — pas d'écran pour équiper un sort actif, gap non résolu |
| **RunSystem (le roguelite lui-même)** | ⬜ **prochain chantier, sur le point de démarrer** |
| Consommables (étape 5) | ⬜ repoussé en dernier par le créateur |

**`master` est intact** — le jeu d'histoire reste stable et jouable. Rien du roguelite n'y est.

**Branche courante : `feat/roguelite`** (branche d'intégration). Tout ce qui précède y est mergé et
poussé sur origin.

---

## 2. CE QUI S'EST PASSÉ LE 16-17/07 (résumé, détail en mémoire projet)

- **Talents Partie 2** fermée (10 phases, 55 nœuds rendus vivants, passage balance-agent final).
  Playtestée par le créateur le 16/07 : 1 bug d'off-by-one trouvé (boucle de finisher permanente au
  Marteau, `chainLength-2` au lieu de `chainLength-1`) et corrigé.
- **Système Pity** construit de zéro : garanties EPIC (existante)/LEGENDARY (existante)/**MYTHIC
  (nouvelle, seuil 1000 simulé)**. Piège du niveau 11 corrigé (une dette de pitié n'est plus jamais
  bloquée par le niveau de l'ennemi tué au moment du paiement). Panneau + chip HUD, 2 passes de
  redesign après retours playtest directs du créateur ("pas de texte, 3 lignes pour les 3 raretés").
- **Les deux branches ont mergé ensemble le 17/07** dans `feat/roguelite` — vrai conflit git (8 blocs
  dans `GameScene.ts`) résolu à la main, vérifié par code-reviewer avant push.
- **4 correctifs UI** (popup de loot mal positionnée, grille d'inventaire trop dense, PityScene sans
  fermeture animée, généralisation du style déjà faite — `drawPanel` mort supprimé) — mergés le
  même jour.
- **Deux branches pré-pivot abandonnées et supprimées** (`feat/item-popup-lore-passive`,
  `ci/playwright-visual-testing` — 150+ commits de retard, antérieures à la décision du pivot).
- **Le sac de run est corrigé à 4 emplacements sûrs sur 20** (pas 8 — le créateur avait le chiffre 4
  en tête depuis le début, `ROGUELITE_POC.md` mis à jour et committé).
- **Décision du créateur** : l'équipement de sorts actifs (gap découvert le 16/07 — aucune interface
  en jeu pour équiper un sort) est mis de côté, repris **seulement après** que tout le RunSystem soit
  construit.

## 3. GAP CONNU, NON BLOQUANT POUR LE RUNSYSTEM

**L'équipement de sorts actifs n'a aucune interface en jeu** (`GameScene.ts` vide `equippedSkills` à
chaque lancement, `SkillSystem.equipSkill` n'est appelé nulle part). Bloque "Réglage des dégâts de
sorts" et plusieurs bonus de talents `elementScoped`. **Volontairement laissé de côté** — à reprendre
après le RunSystem, pas avant (décision créateur du 17/07).

## 4. RETOURS GAMEPLAY.md — VOLONTAIREMENT APRÈS LE RUNSYSTEM

`GAMEPLAY.md` (racine du repo, maintenu par le créateur) liste des retours d'équilibrage (ordre
d'affichage des stats, le dash perd son intérêt, refonte des items façon Dofus, rareté/loot à revoir,
puissance du joueur vs trash mobs). **Explicitement repoussés après le RunSystem** : ces retours
touchent l'économie de loot que le RunSystem va redéfinir (sac limité, tension d'exfiltration) —
les traiter maintenant risquerait de les refaire.

---

## 5. LE CHANTIER QUI DÉMARRE — RunSystem

Spec complète : `docs/design/ROGUELITE_POC.md` (source de vérité, prime sur tout — la lire en entier
avant de coder, notamment §5 qui a été enrichi par le créateur le 17/07 avec des notes
d'exploration de zone/génération procédurale non encore digérées dans un plan).

**Découpage officiel en lots séparés** (§8 du doc), chacun sa branche greffée sur `feat/roguelite` :

| Lot | Branche | Livrable |
|---|---|---|
| `RunSystem` | `feat/roguelite-run-system` | État de run, sac, quota, exfiltration, mort |
| Zone pilote | `feat/roguelite-zone-pilot` | Une zone élémentaire, quota, spawn fini |
| Boss | `feat/roguelite-boss` | Échelle, patterns, mise en scène d'apparition |
| Gamefeel | `feat/roguelite-gamefeel` | Les 3 prérequis §7 (armure vs projectiles, son, hitstop) |
| UI | `feat/roguelite-ui` | HUD de pity (fait), écran d'extraction, **inventaire intra-run** |
| Nettoyage | `feat/roguelite-teardown` | Suppression niveaux/zones/villes/NG+ |

**Chiffres déjà arbitrés par le créateur** (§3 du doc, corrigés le 17/07) : sac de run 20
emplacements dont **4 sûrs** (16 ordinaires perdus à l'exfiltration). Plafond des emplacements sûrs
via upgrade marchand **non fixé** — à établir par simulation balance-agent, ne pas inventer de
nombre.

**Prérequis gamefeel marqué NON NÉGOCIABLE** (§7) : un vrai bug de combat existe —
`applyEnemyMeleeDamage` ne teste ni `isDashing` ni les i-frames, et l'overlap projectile retranche
les PV sans passer par la mitigation → **l'armure et la DEF ne protègent pas des projectiles**. À
corriger avant de juger le PoC, pas forcément avant de commencer à coder le RunSystem lui-même.

**Confirmé le 17/07** : l'inventaire intra-run (sac 20/4) sera une **interface distincte** de
l'inventaire actuel de Grievy Town (400 slots) — le doc le liste explicitement dans le lot UI
("inventaire intra-run"). L'inventaire actuel reste la banque de Grievy Town, jamais concerné par
l'exfiltration.

⚠️ **Bump `SAVE_VERSION` + `MIGRATION_MAP` obligatoire** dès qu'on touche `PlayerState`/`WorldState`/
`GameState` pour ce chantier (règle `CLAUDE.md`) — les sauvegardes actuelles ne survivront pas,
assumé (branche de PoC).

## 6. PIÈGES CONNUS — ne pas y retomber

- **NE JAMAIS relayer une conclusion d'agent sans la vérifier dans le code.** Plusieurs faux positifs
  trouvés en vérifiant a posteriori des sessions précédentes.
- **`weapon.attackSpeed` est mort et supprimé** ; l'Arsenal affiche une Cadence dérivée. Ne pas le
  ré-introduire.
- Deux fichiers restent volontairement non touchés par les sessions récentes : `GAMEPLAY.md` et
  `PITY/` (untracked, maintenus par le créateur).
- Le créateur édite parfois directement les docs de design (`ROGUELITE_POC.md` notamment) entre deux
  sessions — toujours vérifier `git status`/`git diff` sur ces fichiers avant de supposer leur état,
  ne jamais écraser une édition en cours non committée.

## 7. PROCHAINE ACTION CONCRÈTE

Démarrer le lot `RunSystem` (`feat/roguelite-run-system` depuis `feat/roguelite`) : état de run, sac
20/4, quota, exfiltration, mort. Lire `ROGUELITE_POC.md` en entier d'abord (fait), en particulier
les notes d'exploration de zone ajoutées le 17/07 par le créateur (§5) qui ne sont pas encore
traduites en plan technique.
