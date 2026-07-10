# Design Spec — Stat Rolls sur le Loot (système de fourchettes façon Dofus)

> Statut : **conception validée en attente d'implémentation** — aucun code modifié.
> Références : `docs/design/INSPIRATIONS.md` §4 (intention ARPG), `docs/design/GAME_DESIGN.md` §7,
> `src/types/index.ts` (~l. 760-806), `src/data/items.ts`, `src/systems/LootSystem.ts`,
> `src/systems/StatsSystem.ts`, `src/systems/SaveSystem.ts`, `src/data/passiveEffects.ts`.

---

### Problem / Goal

Aujourd'hui, chaque item équipable a des stats **100 % fixes et déterministes** dans
`src/data/items.ts`. Deux joueurs qui lootent `storm_sword` ont exactement le même objet.
Conséquences :

1. **Aucune tension à l'ouverture** — l'intention documentée dans INSPIRATIONS §4
   (« le joueur ne sait pas quelles substats il aura avant de ramasser l'item ») n'existe pas en jeu.
2. **Aucune boucle de farm long-terme** — une fois l'item obtenu, le re-drop du même item est
   du bruit pur. Pas de chasse au « roll parfait ».
3. **Data incomplète** — ~40 items (surtout LEGENDARY/MYTHIC : `titan_greatsword`,
   `velmara_blade`, `echo_blade`, `leviathan_staff`, `memory_staff`, `sky_titan_bow`,
   `phoenix_bow`…) n'ont **aucun `equipStats`** et ne survivent que grâce au filet de sécurité
   de `StatsSystem.collectEquipTotals`. Les HIDDEN n'ont aucune substat.

**Objectif** : chaque instance lootée tire ses valeurs aléatoirement dans une **fourchette
min–max définie par item** (modèle Dofus : 91–150 PV, 10–35 force), figée au moment du drop.
Tous les items ont des stats complètes, en quantité croissante avec la rareté.

---

### Design Decision

Trois architectures ont été évaluées — décision tranchée, pas de compromis :

| Option | Description | Verdict |
|---|---|---|
| **A — Dofus pur : lignes fixes, valeurs rollées** | Chaque item définit ses lignes de stats dans le catalogue (identité gravée), seules les **valeurs** sont tirées dans une fourchette au drop. | ✅ **RETENUE** |
| B — Diablo : clés de substats tirées d'un pool | Les lignes elles-mêmes sont aléatoires par type d'item. | ❌ Rejetée : dilue l'identité des items. GTD a ~120 items **nommés, avec un lore individuel** — un `dragonfang_sword` qui roll des stats de tank trahit l'objet. Diablo fonctionne parce que ses items sont génériques ; les nôtres ne le sont pas. |
| C — Hybride : lignes fixes + 1-2 lignes aléatoires sur Legendary+ | Compromis. | ❌ Rejetée : complexité d'implémentation et d'affichage (Arsenal ne peut plus afficher un catalogue exact) pour un gain de variance déjà couvert par la largeur des ranges (±30-35 % sur Legendary+). C'est le compromis mou qu'on refuse. |

**Choix A**, complété par trois décisions structurantes :

1. **Roll par « Résonance » globale** (qualité d'instance) plutôt que lignes indépendantes —
   un objet peut être *globalement* bon ou mauvais, avec un jitter par ligne. C'est le
   « objet parfait » de Dofus, et ça donne UNE valeur lisible par le joueur (cf. §4).
2. **La rareté détermine le nombre de lignes et la largeur des fourchettes, jamais le
   plafond de qualité** — règle déjà gravée dans INSPIRATIONS §4, conservée : un Common
   peut être parfait (mais un Common parfait reste un Common).
3. **HIDDEN : beaucoup de lignes, valeurs contenues** — 7 substats mais budgétées au niveau
   EPIC, pas MYTHIC, + interdiction des lignes qui amplifient leur propre passif (cf. §2.3).

---

### Mechanical Spec

## 1. Modèle de données des ranges

### 1.1 Nouveaux types (`src/types/index.ts`)

```ts
/** Fourchette de roll pour une ligne de stat (catalogue uniquement). */
export interface RangedStat {
  key: SubstatKey;
  min: number;            // borne incluse, entier
  max: number;            // borne incluse, entier — max >= min ; si max === min la ligne est fixe
  isPercentage?: boolean; // même sémantique que ItemSubstat.isPercentage
}

/**
 * Fourchettes de stats d'un item équipable — SOURCE DE VÉRITÉ du catalogue.
 * Portées par la définition dans src/data/items.ts. Les instances lootées
 * portent, elles, un `equipStats` classique avec les valeurs tirées.
 */
export interface EquipStatRanges {
  mainStat: RangedStat;
  substats: RangedStat[];   // longueur imposée par SUBSTAT_COUNT_BY_RARITY[rarity]
  /**
   * Demi-largeur relative appliquée aux stats implicites d'armure
   * (defense / magicDefense) autour de leur valeur catalogue. Défaut : 0.10.
   * Les armes n'en ont pas besoin : damage/magicDamage sont le MIROIR du mainStat rollé.
   */
  implicitWidth?: number;
}
```

Extension des interfaces d'items (champ **catalogue**, jamais sérialisé en save avec des valeurs utiles) :

```ts
export interface Weapon extends BaseItem {
  // ... existant inchangé ...
  equipStats?: EquipStats;        // INSTANCE : valeurs rollées (ou centre pour le catalogue, cf. 1.2)
  equipRanges?: EquipStatRanges;  // CATALOGUE : fourchettes de roll
}
// idem Armor et Accessory
```

Et un champ d'instance optionnel sur `BaseItem` :

```ts
export interface BaseItem {
  // ... existant inchangé ...
  /**
   * Résonance de l'instance (0–100) — cache dérivé, recomputable depuis
   * equipRanges du catalogue. Présent uniquement sur les instances rollées.
   */
  rollQuality?: number;
}
```

### 1.2 Règle anti-dérive : le centre est GÉNÉRÉ, pas ré-authoré

Pour éviter de maintenir `equipStats` (valeurs) ET `equipRanges` (fourchettes) à la main sur
120 items — dérive garantie à terme — **le catalogue n'authore QUE `equipRanges`**.
Une fonction `finalizeCatalogue()` exécutée au chargement de `items.ts` (juste avant le
remplissage de `ALL_ITEMS`) :

- calcule `equipStats` = centre de chaque fourchette (`Math.round((min + max) / 2)`)
  pour tout item ayant `equipRanges` — le catalogue reste donc lisible par TOUT le code
  existant (Arsenal, boutiques, StatsSystem) sans modification défensive ;
- pour les armes, vérifie/écrase le miroir : `damage = mainStat centre` si
  `mainStat.key === 'ATK_FLAT'`, `magicDamage = mainStat centre` si `'MATK_FLAT'`
  (règle absolue CLAUDE.md conservée : `CombatSystem` ne lit jamais `weapon.damage`) ;
- **valide en dev** (console.warn) : nombre de substats conforme à
  `SUBSTAT_COUNT_BY_RARITY[rarity]`, pas de clé dupliquée sur un même item, `max >= min`,
  respect des interdits HIDDEN (§2.3).

Les `equipStats` littéraux actuellement écrits dans `items.ts` sont **supprimés** lors de la
migration de contenu (§6) et remplacés par `equipRanges` — une seule source de vérité.

### 1.3 Ce qui roll et ce qui ne roll pas

| Donnée | Roll ? | Détail |
|---|---|---|
| `equipStats.mainStat.value` | ✅ | Tiré dans `equipRanges.mainStat` |
| `equipStats.substats[].value` | ✅ | Tiré dans `equipRanges.substats[]` |
| `weapon.damage` / `magicDamage` | ✅ (miroir) | Réécrits = valeur rollée du mainStat correspondant — jamais tirés indépendamment |
| `armor.defense` / `magicDefense` | ✅ (implicite) | Tirés à ±`implicitWidth` (défaut ±10 %) autour de la valeur catalogue, avec la même Résonance Q que le reste de l'item |
| `bonusStats` (str/int/agi/vit/end legacy) | ❌ **fixes** | Identité de l'item (lore), et éviter le double-dipping : ces attributs alimentent déjà atk/matk/hp via StatsSystem. Les faire roller doublerait la variance réelle sans lisibilité. |
| `attackSpeed`, `element` (roll d'élément existant), `value` (prix), passifs | ❌ | Inchangés. Le roll d'élément (`applyRandomElement`) reste et s'applique sur le même clone. |
| Consommables, matériaux, skins, key items | ❌ | Jamais rollés. |

---

## 2. Nombre de lignes de stats par rareté

### 2.1 Table (remplace `SUBSTAT_COUNT_BY_RARITY`)

| Rareté | mainStat | Substats | **Total lignes** | Largeur de fourchette (±, cf. §6) | Raisonnement |
|---|---|---|---|---|---|
| COMMON | 1 | 1 | **2** | ±10 % | Prévisible, presque déterministe. Le joueur débutant compare des objets simples ; la variance serait du bruit illisible à ce stade. |
| UNCOMMON | 1 | 2 | **3** | ±15 % | Première « vraie » comparaison de rolls. |
| RARE | 1 | 3 | **4** | ±20 % | Palier où la chasse au roll commence à exister. |
| EPIC | 1 | 4 | **5** | ±25 % | Aligné sur la data actuelle (les Epic ont déjà 4 substats). |
| LEGENDARY | 1 | 5 | **6** | ±30 % | +1 ligne vs aujourd'hui. La largeur ±30 % rend deux drops du même Legendary réellement différents. |
| MYTHIC | 1 | 6 | **7** | ±35 % | Le sommet statistique du jeu. Range large = loterie assumée, compensée par la rareté (0.4 %). |
| HIDDEN | 1 | 7 | **8** | ±35 % | Le plus grand nombre de lignes du jeu, mais **budget par ligne EPIC** (§2.3). |

```ts
export const SUBSTAT_COUNT_BY_RARITY: Record<ItemRarity, number> = {
  [ItemRarity.COMMON]: 1,
  [ItemRarity.UNCOMMON]: 2,
  [ItemRarity.RARE]: 3,
  [ItemRarity.EPIC]: 4,
  [ItemRarity.LEGENDARY]: 5,
  [ItemRarity.MYTHIC]: 6,
  [ItemRarity.HIDDEN]: 7,
};
```

Impact contenu : tous les LEGENDARY existants gagnent +1 substat authorée, les MYTHIC +2,
les HIDDEN +7 (de zéro). Les Common/Uncommon/Rare/Epic déjà équipés de substats sont conformes.

### 2.2 Budget de valeur par ligne (référentiel d'authoring)

Valeur **centre** de référence par clé, au palier RARE, puis multiplicateur par rareté.
C'est la grille qui permet à un content-agent de remplir les ~40 items sans `equipStats`
et les nouvelles lignes Legendary/Mythic/Hidden de façon cohérente avec l'existant
(vérifié contre `storm_sword`, `dragonfang_sword`, `colossus_greatsword`…).

**Multiplicateurs de palier** (appliqués au centre, puis fourchette = centre ± largeur §2.1) :

| COMMON | UNCOMMON | RARE | EPIC | LEGENDARY | MYTHIC | HIDDEN |
|---|---|---|---|---|---|---|
| ×0.5 | ×0.75 | ×1.0 | ×1.4 | ×1.9 | ×2.5 | **×1.4** (budget Epic) |

**Centres de référence au palier RARE (substats)** :

| Clé | Centre RARE | Note |
|---|---|---|
| ATK_FLAT (substat) | 10 | En substat uniquement — le mainStat d'arme suit `damage`, pas cette grille |
| ATK_PCT | 5 | |
| MATK_FLAT (substat) | 12 | |
| MATK_PCT | 5 | |
| DEF_FLAT | 8 | |
| DEF_PCT | 5 | |
| HP_FLAT | 45 | |
| HP_PCT | 5 | |
| CRIT_RATE | 4 | |
| CRIT_DMG | 10 | |
| ASPD_PCT | 8 | |
| SPD_FLAT | 4 | |
| ELEM_BONUS_PCT | 8 | |
| MANA_FLAT | 20 | |
| LIFESTEAL_PCT | 2 | Clé volontairement chiche — très forte en pratique |
| **MDEF_FLAT** *(nouvelle)* | 8 | |
| **CDR_PCT** *(nouvelle)* | 4 | Cap total équipement : 30 % |
| **DODGE_PCT** *(nouvelle)* | 3 | Cap total équipement : 20 % |
| **BOSS_DMG_PCT** *(nouvelle)* | 5 | Cap total équipement : 40 % |
| **HP_ON_KILL_FLAT** *(nouvelle)* | 10 | |
| **MANA_ON_KILL_FLAT** *(nouvelle)* | 4 | |

Exemple d'application — `titan_greatsword` (LEGENDARY, ICE, damage 110) :
mainStat `ATK_FLAT` 77–143 (110 ±30 %), 5 substats, ex. :
`ATK_PCT` 7–13 (centre 9.5→10), `ELEM_BONUS_PCT` 11–20, `HP_FLAT` 60–111,
`DEF_FLAT` 11–20, `CRIT_DMG` 13–25.

### 2.3 HIDDEN — la solution retenue et sa justification

**Problème** : les passifs HIDDEN sont volontairement game-breaking (`NO_ATTACK_COOLDOWN`,
`ZERO_MANA_COST`, `KILL_STACK_DAMAGE` +200 % permanent…). Le design actuel les équilibre par
l'absence totale de substats. Leur donner 7 lignes au budget MYTHIC (×2.5) transformerait
chaque HIDDEN en no-brainer absolu et tuerait toute décision d'équipement en endgame —
inacceptable (« The Dilemma is real » vaut aussi pour les builds).

**Solution retenue — « lignes nombreuses, valeurs contenues » :**

1. **7 substats au budget EPIC (×1.4)**. Budget statistique total ≈ 7 × 1.4 = 9.8 unités-Rare,
   contre 15 pour un Mythic (6 × 2.5). La feuille de stats d'un HIDDEN vaut ~65 % de celle
   d'un Mythic — **le passif fait le reste**, et c'est lui qu'on vient chercher.
2. **Largeur ±35 %** (la plus large du jeu, avec Mythic) : un HIDDEN mal résonné se sent
   vraiment capricieux — cohérent avec leur lore (« il apparaît à ceux qui ont déjà accepté
   ce qu'il implique »). L'objet le plus rare du jeu reste une rencontre, pas un chèque.
3. **Interdit d'authoring : aucune ligne qui amplifie directement le vecteur du passif.**
   Validé par `finalizeCatalogue()` via une table d'exclusions par item :
   - `hidden_temporal_blade` (NO_ATTACK_COOLDOWN) → interdit `ASPD_PCT`
   - `hidden_world_eater_staff` (ZERO_MANA_COST) → interdit `MANA_FLAT`, `MANA_ON_KILL_FLAT`
   - `hidden_soul_bow` (KILL_STACK_DAMAGE) → interdit `ATK_PCT` et `MATK_PCT` (le stack est déjà un multiplicateur de dégâts permanent)
   - `hidden_first_blade` (FIRST_STRIKE_500_PCT) → interdit `BOSS_DMG_PCT`
   - `hidden_void_reaper` (KILL_HEAL_15_PCT) → interdit `HP_ON_KILL_FLAT`, `LIFESTEAL_PCT`
   - `hidden_undying_plate` (DMG_REDUCTION_40) → interdit `DODGE_PCT`
   - `hidden_eternity_ring` (PERMANENT_REGEN) → interdit `HP_ON_KILL_FLAT`, `MANA_ON_KILL_FLAT`
   - `hidden_fate_amulet` (COMBAT_START_ZERO_CD) → interdit `CDR_PCT`
   - `hidden_mirror_helm` (MAGIC_REFLECT_25_PCT) → pas d'exclusion nécessaire

**Options rejetées** : (H2) statu quo 0 substat — contredit la demande explicite de
l'utilisateur ; (H3) budget Mythic + nerf des passifs — les passifs sont l'âme des HIDDEN
et leur raison narrative d'exister, on n'y touche pas.

---

## 3. Pool de stats — clés existantes et nouvelles

Avec 15 clés pour 7-8 lignes sans duplication, le pool existant *suffit techniquement* mais
produit des items HIDDEN/Mythic qui se ressemblent tous (tout le monde finit avec CRIT + ASPD
+ ELEM + HP). **6 nouvelles clés** sont ajoutées, chacune avec un branchement réel :

| Nouvelle clé | Effet | Où la lire (branchement RÉEL) |
|---|---|---|
| `MDEF_FLAT` | Défense magique plate | `StatsSystem.computeAll()` : ajouter `magicDef += t.MDEF_FLAT` (comble le trou signalé en commentaire de `ComputedStats.magicDef` — « pas de substat dédiée »). Ajouter la clé à `ZERO_TOTALS`, `STAT_LABELS` (« DEF Mag. »). |
| `CDR_PCT` | Réduction des cooldowns de compétences (%) | Exposer `cdr` dans `ComputedStats` (somme `t.CDR_PCT`, **cap 30**). Appliquer au démarrage d'un cooldown dans `SkillSystem` : `cooldown * (1 - cs.cdr / 100)`. Se cumule multiplicativement avec `FIRE_SKILL_CD_15_PCT` (PassiveSystem) et `SKILL_DMG_15_CD_10_PCT`. |
| `DODGE_PCT` | Chance d'esquiver totalement une attaque ennemie (%) | `CombatSystem.enemyAttack()` : avant le calcul de dégâts, `if (Math.random() * 100 < cs.dodge) return { damage: 0, ... }` + nouveau champ `wasDodged: true` sur `DamageResult` pour le feedback (« Esquive ! » flottant — règle « no mechanic without feedback »). **Cap 20**. |
| `BOSS_DMG_PCT` | Dégâts bonus contre boss ET élites (%) | `CombatSystem.playerAttack()` / `playerSkill()` : multiplier par `1 + cs.bossDmg / 100` quand `target.isBoss === true`. Pour les élites : propager `isElite` sur `ActiveEnemy` (même mécanisme que `isBoss`, déjà documenté l. ~700 des types). **Cap 40**. |
| `HP_ON_KILL_FLAT` | PV rendus à chaque kill (plat) | Point de branchement du kill (là où `PassiveSystem.getKillHealBonusPct` est déjà consommé — GameScene/CombatSystem) : `hp += t.HP_ON_KILL_FLAT`. Additif avec `KILL_HEAL_15_PCT`. |
| `MANA_ON_KILL_FLAT` | Mana rendu à chaque kill (plat) | Même point de branchement que ci-dessus, symétrique mana. Cohabite avec le talent `MANA_ON_KILL_PCT` (ABYSSAL). |

Clés **évaluées et rejetées** :
- *Résistance élémentaire %* : demanderait une matrice élément-par-élément dans
  `enemyAttack()` qui n'a aujourd'hui aucune notion d'élément d'attaque ennemie — coût
  d'implémentation disproportionné, à revoir quand les attaques ennemies seront élémentaires.
- *Réduction de dégâts globale %* : entre en collision avec `DMG_REDUCTION_40_DEATH_RESIST`
  (HIDDEN) et le talent GLACIUS `DAMAGE_REDUCTION_PCT` (cap 30) — empiler trois sources de
  la même stat défensive la plus forte du jeu est le chemin le plus court vers un joueur immortel.

**Règles d'authoring par slot** (guidelines, validées à l'œil en review de contenu, pas par code) :
- Armes : offensif d'abord (ATK/MATK %, CRIT, ASPD, ELEM, BOSS_DMG, LIFESTEAL) ; max 1 ligne défensive.
- Armures : défensif d'abord (HP, DEF, MDEF, DODGE) ; max 1 ligne offensive, jamais CRIT_DMG.
- Accessoires : hybrides et utilitaires (MANA, CDR, SPD, HP/MANA_ON_KILL) — c'est là que
  CDR_PCT et DODGE_PCT vivent principalement, pour qu'ils restent des choix de build et
  pas des lignes automatiques.
- `CRIT_RATE` + `CRIT_DMG` + `ASPD_PCT` jamais tous les trois sur le même item non-arme.

---

## 4. Algorithme de roll — « Résonance »

### 4.1 Modèle : qualité globale + jitter par ligne

Trois options évaluées :

| Option | Description | Verdict |
|---|---|---|
| Uniforme par ligne | Chaque ligne indépendante, `min + rand() * (max - min)` | ❌ Aucun « objet parfait » possible en pratique (P(toutes lignes > 90 %) ≈ 0.1^7 sur un HIDDEN). Pas de moment mémorable. |
| Pondéré centre (2d) | Moyenne de deux tirages par ligne | ❌ Écrase la variance — tout le monde a des objets moyens, la chasse au roll meurt. |
| **Qualité globale + jitter** | Une Résonance Q par instance, chaque ligne = Q ± bruit | ✅ **RETENUE** — objets globalement bons/mauvais (lisible en UN nombre), moments « roll parfait » à fréquence contrôlée, exactement le feel Dofus recherché. |

### 4.2 Formule (pseudo-code de référence pour `StatRollSystem`)

```ts
const LINE_JITTER = 0.30; // ± 15 points de qualité par ligne autour de Q

function rollItem(template: Item, qFloor = 0): Item {
  if (!isEquippable(template) || !template.equipRanges) return { ...template };
  const R = template.equipRanges;

  // 1) Résonance globale de l'instance — UNIFORME (pas de biais par rareté :
  //    « la rareté détermine le nombre de lignes, jamais leur qualité maximale »)
  const Q = qFloor + Math.random() * (1 - qFloor);

  // 2) Roll d'une ligne : qualité locale = Q ± jitter, clampée
  const rollLine = (min: number, max: number): number => {
    if (max <= min) return min; // ligne fixe autorisée (max === min)
    const q = clamp01(Q + (Math.random() - 0.5) * LINE_JITTER);
    return Math.round(min + (max - min) * q);
  };

  const instance: Item = {
    ...template,
    equipStats: {
      mainStat: { key: R.mainStat.key, value: rollLine(R.mainStat.min, R.mainStat.max),
                  isPercentage: R.mainStat.isPercentage },
      substats: R.substats.map(s => ({ key: s.key, value: rollLine(s.min, s.max),
                                       isPercentage: s.isPercentage })),
    },
  };

  // 3) Miroir arme (règle absolue CLAUDE.md — dans les DEUX sens)
  if ('weaponType' in instance) {
    if (R.mainStat.key === 'ATK_FLAT')  instance.damage      = instance.equipStats.mainStat.value;
    if (R.mainStat.key === 'MATK_FLAT') instance.magicDamage = instance.equipStats.mainStat.value;
  }

  // 4) Stats implicites d'armure (defense / magicDefense), même Q, largeur ±implicitWidth
  if ('defense' in instance) {
    const w = R.implicitWidth ?? 0.10;
    instance.defense      = rollImplicit(template.defense, w, Q);      // rollLine sur [V(1-w), V(1+w)]
    instance.magicDefense = rollImplicit(template.magicDefense, w, Q);
  }

  // 5) Cache de Résonance (0–100) : moyenne des qualités normalisées des lignes
  //    rollables — q_ligne = (value - min) / (max - min), lignes fixes exclues.
  instance.rollQuality = computeQuality(instance, R);
  return instance;
}
```

Propriétés :
- **Valeurs entières partout** (lisibilité pixel-art). Contrainte d'authoring : toute
  fourchette % doit avoir une largeur ≥ 2 points pour que le roll existe réellement.
- Espérance de chaque ligne = centre de la fourchette → **la balance moyenne du jeu est
  strictement inchangée** par rapport aux valeurs fixes actuelles.
- P(Résonance ≥ 90) ≈ 10 %, P(≥ 98, « Parfaite ») ≈ 2 % — par instance lootée, toutes
  raretés confondues. La perfection sur un Mythic reste un événement de fin de jeu.

### 4.3 Paliers de Résonance (affichage)

| Résonance | Libellé | Couleur UI |
|---|---|---|
| 0–29 | Sourde | Gris sombre |
| 30–59 | Stable | Blanc |
| 60–84 | Claire | Cyan |
| 85–97 | Vibrante | Or |
| 98–100 | **Parfaite** | Or + scintillement (même traitement visuel qu'un drop Legendary) |

---

## 5. Où et quand le roll se déclenche

**Nouveau système dédié : `src/systems/StatRollSystem.ts`** (logique pure, zéro Phaser),
appelé partout où une instance équipable entre en possession du joueur. `LootSystem` reste
responsable du QUOI (rareté, pity, quantité), `StatRollSystem` du COMBIEN.

| Point d'acquisition | Roll | Contrainte de qualité |
|---|---|---|
| Drop d'ennemi (`LootSystem.rollLoot`, après le succès de `entry.dropRate`, sur le clone déjà produit par `applyRandomElement`) | ✅ | Q ∈ [0, 1] |
| Drop garanti de boss (première mort) | ✅ | **Q ∈ [0.5, 1]** — la mort d'une divinité ne récompense jamais par une insulte |
| Récompense de quête (main/side) | ✅ | **Q ∈ [0.35, 1]** — un cadeau narratif ne doit pas être une gifle |
| Achat boutique (Theron, Ysolde, marchands de zone) | ✅ au moment de l'achat | Q ∈ [0, 1] — chaque achat est un tirage : **les marchands de zone deviennent un gold sink de re-roll**, ce qui donne enfin un débouché long-terme à l'or (GDD §7 « no gold cap ») |
| Contenu déjà en inventaire/équipé (saves existantes) | Migration §8 | Q = 0.5 exactement |

**Règles dures :**
- Le roll a lieu **une seule fois, à l'acquisition, puis est figé** — aucun re-roll à
  l'équipement, au dépôt, à la vente/rachat (l'instance vendue disparaît ; en racheter une
  chez un marchand est un NOUVEAU tirage).
- **Aucune interaction avec le pity** : `killsWithoutEpic` / `killsWithoutLegendary` et
  `rarityFromRoll` sont strictement inchangés. Le pity garantit une rareté, jamais une
  Résonance. **Pas de pity de qualité** — décision explicite : la chasse à la Résonance EST
  la boucle de farm long-terme ; un pity la tuerait.
- Doublons non-stackables : `addToInventory` pousse déjà une entrée distincte par instance
  non-stackable (deux `storm_sword` = deux slots, chacun ses rolls) — comportement conservé,
  le commentaire anti-`filter` de `removeFromInventory` devient encore plus critique.

---

## 6. Migration des ~120 items existants (valeurs fixes → fourchettes)

### 6.1 Formule de conversion

Pour chaque ligne existante de valeur fixe `V` sur un item de rareté `r` :

```
largeur(r) = { COMMON: 0.10, UNCOMMON: 0.15, RARE: 0.20, EPIC: 0.25,
               LEGENDARY: 0.30, MYTHIC: 0.35, HIDDEN: 0.35 }

min = max(1, round(V * (1 - largeur(r))))
max = round(V * (1 + largeur(r)))
si max < min + 1 et V > 0 :  max = min + 1   // toute ligne rollable a au moins 2 valeurs
                                             // (sauf choix délibéré de ligne fixe min === max)
```

L'espérance du roll = `V` → **aucun nivellement de la balance globale**. La progression de
la largeur par rareté est le cœur du feel : un Common est quasi prévisible (un débutant
compare sereinement), un Mythic est une loterie assumée (±35 % : `echo_blade` peut sortir
mainStat 52 ou 108 — deux objets qui ne se jouent pas pareil).

Stats implicites d'armure : `defense`/`magicDefense` gardent leur valeur catalogue actuelle
comme centre, `implicitWidth` par défaut 0.10 pour toutes raretés (la variance « intéressante »
vit dans les lignes explicites, pas dans le socle).

### 6.2 Travail de contenu à produire (content-agent, grille §2.2)

1. **~80 items avec `equipStats`** : conversion mécanique valeur→fourchette (formule §6.1),
   suppression du littéral `equipStats`, écriture de `equipRanges`.
   Legendary : +1 substat à authorer ; Mythic : +2.
2. **~40 items SANS `equipStats`** (dont `titan_greatsword`, `velmara_blade`, `echo_blade`,
   `leviathan_staff`, `memory_staff`, `sky_titan_bow`, `phoenix_bow`, la plupart des
   Legendary d'armure de zone, plusieurs Epic/Rare) : authoring complet — mainStat miroir de
   `damage`/`magicDamage` (armes) ou ligne d'identité (armures/accessoires), substats au
   compte exact §2.1, valeurs par la grille §2.2, thème des clés cohérent avec le lore de
   l'item (ex. `memory_staff` ICE/ralentissement → `MATK_PCT`, `ELEM_BONUS_PCT`, `CDR_PCT`,
   `MANA_FLAT`, `MDEF_FLAT`).
3. **9 items HIDDEN** : 7 substats chacun, budget ×1.4, exclusions §2.3.
4. Passage de `finalizeCatalogue()` en dev : zéro warning = data conforme.

---

## 7. Affichage UI (conceptuel)

### 7.1 Deux vues, deux vérités

| Vue | Ce qu'elle montre | Format de ligne |
|---|---|---|
| **Arsenal (catalogue)** — l'item en tant que « connaissance du monde » | Les fourchettes possibles | `PV  91 – 150` (valeurs grises, tiret médian). Sous-titre discret du panneau : « Fourchettes à l'obtention ». |
| **Inventaire / équipé (instance)** — l'objet que JE possède | Les valeurs rollées + leur position dans la fourchette | `+127 PV` (valeur dorée, format `formatStat` actuel) suivi de la fourchette en petit gris : `(91–150)`. |

### 7.2 Lire la qualité d'un coup d'œil

- **Résonance globale** : affichée sous le nom/rareté de l'instance — `Résonance 82 % — Claire`,
  colorée selon les paliers §4.3. C'est LE chiffre que le joueur compare entre deux drops
  identiques.
- **Par ligne** : la valeur rollée prend une teinte selon sa qualité locale
  (q = (value−min)/(max−min)) : gris < 30 %, blanc 30–59 %, cyan 60–84 %, or ≥ 85 %.
  Pas de barre de progression par ligne — trop encombrant pour un panneau pixel-art 800×600.
- **Comparaison équipé vs candidat** : les flèches vertes/rouges existantes comparent les
  **valeurs rollées réelles** (aucun changement de logique).
- **Notification de drop** : format actuel conservé (nom + rareté, 2 s max) ; ajout de la
  mention de Résonance uniquement si ≥ 85 (« Vibrante ») — et traitement « drop rare »
  complet (son + scintillement) si Parfaite, même sur un Common. Un Common parfait est un
  petit événement ; il doit se sentir.
- La Résonance est recalculable depuis `equipRanges` (source de vérité) ; `rollQuality`
  n'est qu'un cache pour éviter le lookup catalogue dans les listes d'inventaire.

---

## 8. Migration de sauvegarde

### 8.1 Schéma

Le contenu des saves change de forme : les items possédés portent désormais des valeurs
rollées propres + `rollQuality`, et le catalogue attend des instances complètes.

- **`SAVE_VERSION` : `1.6.0` → `1.7.0`** (`src/systems/SaveSystem.ts`).
- **Entrée `MIGRATION_MAP['1.6.0']`** :

```
Pour chaque item équipable de player.inventory[].item ET des 10 slots de player.equipment :
  template = ALL_ITEMS[item.id]
  si template?.equipRanges existe :
    remplacer l'objet par StatRollSystem.rollItem(template, /* Q forcé = */ 0.5)
    en PRÉSERVANT les champs d'instance existants : element (roll d'élément déjà
    appliqué à l'époque du drop), et toute mutation d'instance future
  sinon : conserver tel quel (consommables, matériaux, key items, skins)
```

### 8.2 Pourquoi Q = 0.5 (et pas le max, ni un tirage aléatoire)

- **Q = 0.5 = le centre = exactement les valeurs fixes que le joueur avait avant le patch**
  (le centre des fourchettes EST l'ancienne valeur, par construction §6.1). La migration est
  **invisible en puissance** : personne ne perd rien, personne ne gagne rien. Zéro
  frustration, zéro cadeau non mérité.
- Le max offrirait un spike de puissance gratuit ET détruirait la boucle : plus rien à
  chasser sur tout l'équipement déjà possédé.
- Un tirage aléatoire pourrait *affaiblir* rétroactivement l'équipement d'un joueur en
  cours de partie — inacceptable (« Exploration is rewarded, never punished » ; a fortiori
  la simple continuité de save).
- Effet de bord assumé et désirable : les items qui n'avaient AUCUN `equipStats`
  (Legendary/Mythic/HIDDEN) **gagnent** leurs nouvelles lignes à Q = 0.5 — c'est la
  correction du bug de data constaté en jeu, pas un buff de migration.

---

## 9. Plan d'implémentation ordonné (pour le dev-agent)

Découpage conforme à la gouvernance branches/PR de CLAUDE.md (types → systèmes → contenu → UI).

| # | Branche / fichier | Portée (une phrase) |
|---|---|---|
| 1 | `types/loot-stat-ranges` — `src/types/index.ts` | Ajouter les 6 nouvelles `SubstatKey`, `RangedStat`, `EquipStatRanges`, `equipRanges?` sur Weapon/Armor/Accessory, `rollQuality?` sur BaseItem, `wasDodged?` sur DamageResult, `isElite?` sur ActiveEnemy, et remplacer `SUBSTAT_COUNT_BY_RARITY` par la table §2.1. |
| 2 | `feat/stat-roll-system` — `src/systems/StatRollSystem.ts` *(nouveau)* | Implémenter `rollItem(template, qFloor)`, `computeQuality`, les paliers de Résonance, et les caps (CDR 30, DODGE 20, BOSS_DMG 40) exposés en constantes. |
| 3 | même branche — `src/systems/StatsSystem.ts` | Étendre `ZERO_TOTALS`/`STAT_LABELS`/`PERCENT_KEYS` aux 6 nouvelles clés, ajouter `magicDef += MDEF_FLAT` et exposer `cdr`/`dodge`/`bossDmg`/`hpOnKill`/`manaOnKill` (cappés) dans `ComputedStats` — sans casser le filet de sécurité `collectEquipTotals`. |
| 4 | même branche — `src/systems/CombatSystem.ts` | Brancher DODGE_PCT dans `enemyAttack` (avec `wasDodged`), BOSS_DMG_PCT dans `playerAttack`/`playerSkill`, HP/MANA_ON_KILL au point de kill existant (là où KILL_HEAL est consommé). |
| 5 | même branche — `src/systems/SkillSystem.ts` (ou équivalent cooldowns) | Appliquer `cs.cdr` au démarrage de chaque cooldown de compétence, cumulé multiplicativement avec les passifs CD existants. |
| 6 | même branche — `src/systems/LootSystem.ts` | Appeler `StatRollSystem.rollItem` sur chaque équipable droppé (après `applyRandomElement`), avec qFloor 0.5 pour les drops garantis de boss ; vérifier que les flux boutique/récompense de quête passent aussi par `rollItem` (qFloor 0.35 pour les quêtes). |
| 7 | même branche — `src/systems/SaveSystem.ts` | Bump `SAVE_VERSION` 1.7.0 + entrée `MIGRATION_MAP['1.6.0']` (re-roll Q = 0.5 de l'inventaire et des 10 slots d'équipement, préservation de `element`). |
| 8 | même branche — audit flux d'équipement | Vérifier que InventoryScene/équipement manipulent **l'instance** de l'inventaire (jamais `ALL_ITEMS[id]`) et que rien ne « ré-hydrate » un item par son id — c'est le seul vrai risque de régression du modèle instance. |
| 9 | `content/stat-ranges` — `src/data/items.ts` | `finalizeCatalogue()` (centres générés + validations + exclusions HIDDEN), conversion des ~80 items (formule §6.1), authoring des ~40 items sans equipStats + lignes manquantes Legendary/Mythic + 7 substats × 9 HIDDEN (grille §2.2). |
| 10 | même branche — `src/data/enemies.ts` (ou équivalent) | Ajouter les 2 mannequins d'entraînement (§10), spawn gaté derrière le flag dev. |
| 11 | `feat/loot-roll-ui` — InventoryScene / ArsenalScene / notifications | Affichage fourchettes (catalogue) vs valeurs+Résonance (instances), teintes par ligne, mention Vibrante/Parfaite au drop — avec `shutdown()` propre (règle UIScene). |
| 12 | Transverse | `code-reviewer` avant chaque PR, mise à jour `BUILD_LABEL`, tag milestone après merge complet. |

---

## 10. Monstres de test — les mannequins de Kelvar

Deux ennemis inoffensifs à drop garanti, pour constater l'aléatoire des rolls en enchaînant
les kills. Thématiquement intégrés : Kelvar (capitaine de la garde, donneur du tutoriel de
combat) a des mannequins d'entraînement dans la cour de la caserne de Grievy Town.

**Gate : `player.flags['dev_training_dummies'] === true` uniquement (build de dev).**
À retirer ou reconvertir en props muets avant tout milestone jouable public — un drop
garanti Legendary/Mythic est un exploit de farm évident sinon.

| Champ | `training_dummy_straw` | `training_dummy_gilded` |
|---|---|---|
| Nom | Mannequin de Kelvar | Mannequin Doré |
| Description | Paille, toile, et trente ans de coups encaissés sans se plaindre. | Kelvar l'a fait dorer le jour de sa promotion. Il le regrette. |
| Zone / placement | NEUTRAL — cour de la caserne, Grievy Town, à côté de Kelvar | Idem, 2 tiles à droite |
| `baseLevel` | 1 | 1 |
| Stats | HP 1 · ATK 1 · DEF 0 · MDEF 0 · SPD 0 · MATK 0 | Identiques |
| Comportement | `patrol`, `patrolRadius: 0`, `aggroRange: 0`, `attackRange: 0`, `moveSpeed: 0` — il ne bouge pas, ne riposte pas, meurt en un coup | Identique |
| `isBoss` / `isElite` / `spawnWeight` | false / false / 0 (placé à la main) | Identique |
| `baseXp` / `baseGold` | 1 / {0, 0} — pas de farm d'XP ou d'or possible | Identique |
| **Loot (100 %)** | `titan_greatsword` — LEGENDARY ±30 %, 6 lignes : mainStat 77–143, la variance saute aux yeux dès 2 kills | `echo_blade` — MYTHIC ±35 %, 7 lignes : le range le plus large du jeu (mainStat 52–108) |
| Respawn | À chaque ré-entrée dans la scène (standard) | Identique |

Protocole de test manuel : tuer chaque mannequin 5×, ouvrir l'inventaire — 5 instances du
même item avec des valeurs, teintes de lignes et Résonances différentes ; vérifier qu'un
équipement/déséquipement ne re-roll rien ; vérifier la migration en chargeant une save 1.6.0.

---

### Thematic Justification

- **La Résonance EST l'Echo Magic.** Le héros absorbe et réplique les propriétés magiques ;
  un objet « résonne » plus ou moins fort avec lui. Le vocabulaire UI (Sourde → Parfaite)
  prolonge le système central du personnage au lieu de plaquer un « item quality: 87% »
  générique — cohérent avec le refus du HUD générique d'INSPIRATIONS §2.
- **Un monde qui se délite produit des objets irréguliers.** Deux lames sorties de la même
  forge ne sont plus identiques dans une Velmara dont la magie s'affaiblit — la variance des
  drops raconte la dégradation sans un mot de dialogue (environmental storytelling).
- **Les HIDDEN restent des rencontres, pas des chèques.** Leur large variance (±35 %) et
  leur budget contenu préservent ce que dit leur lore : ce sont des décisions, pas des
  récompenses. « Ce n'est pas une arme. C'est une décision. »
- Ton sobre conservé : pas de jackpot clinquant façon casino — une Parfaite scintille comme
  un drop Legendary, rien de plus.

### Player Impact

- **Avant** : ramasser un doublon = néant émotionnel ; l'or ne sert à rien en endgame ;
  plusieurs Legendary/Mythic sont fonctionnellement vides (bug de data ressenti en jeu).
- **Après** : chaque drop équipable pose deux questions (« quelle rareté ? » puis « quelle
  Résonance ? ») ; re-tuer un boss ou farmer une zone a un objectif au-delà du premier drop ;
  les marchands de zone deviennent une machine à re-roll qui donne un sens à l'or ; comparer
  deux instances identiques devient une vraie décision d'équipement ; les HIDDEN gagnent une
  feuille de stats digne de leur rareté sans écraser les Mythic.
- Le joueur mobile/session courte (5-15 min) gagne un objectif micro-session naturel :
  « encore quelques kills pour tenter une meilleure Résonance ».

### Constraints

- **Ne change PAS** : taux de drop par rareté (`RARITY_DROP_RATES` — toute modification
  exigerait une re-simulation économique complète, règle projet), pity (250/500), roll
  d'élément au drop, formule de dégâts, passifs HIDDEN (valeurs intouchées), `bonusStats`
  legacy (fixes), scaling ennemis niveau ± 2, doublement des taux en NG+.
- **Invariants techniques** : miroir arme `mainStat ⟷ damage/magicDamage` maintenu dans les
  deux sens ; filet de sécurité `collectEquipTotals` conservé ; `CombatSystem` continue de
  lire exclusivement `computeAll()` ; comparaison de raretés par `.includes([...])`, jamais
  `>=` sur string enum ; toute UI nouvelle définit `shutdown()`.
- **Hors scope v1** (notés pour plus tard) : prix de revente indexé sur la Résonance,
  re-roll payant chez Theron (« upgrade gear » du GDD), identification différée à la Diablo,
  résistances élémentaires en substat.

### Handoff to Content Agent / Dev Agent

- **Dev-agent** : suivre le plan §9 dans l'ordre (types → systèmes → data → UI), pseudo-code
  §4.2, points de branchement exacts des nouvelles clés §3, migration §8. Risque n°1 à
  auditer : tout code qui reconstruit un item depuis `ALL_ITEMS[id]` au lieu d'utiliser
  l'instance d'inventaire (étape 8).
- **Content-agent** : lire `docs/design/INSPIRATIONS.md` d'abord (règle projet), puis
  produire les `equipRanges` des ~120 items avec la formule §6.1, la grille de budget §2.2,
  les comptes de lignes §2.1, les exclusions HIDDEN §2.3 et les guidelines par slot §3 ;
  ajouter les 2 mannequins §10 (avec leur ligne de lore chacun, ton Kelvar : laconique).
- **Validation** : `finalizeCatalogue()` doit tourner sans warning ; les mannequins
  permettent le test visuel de bout en bout ; charger une save 1.6.0 doit produire des stats
  strictement identiques à l'avant-patch (Q = 0.5).
