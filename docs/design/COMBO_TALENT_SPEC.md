# Design Spec — Système de Combos & Arbre de Talents

> **Statut :** Spec de référence v1.0 — à implémenter par le dev-agent et le gamefeel-agent.
> **Sources :** `docs/design/GAME_DESIGN.md`, `docs/design/INSPIRATIONS.md`, `src/scenes/GameScene.ts` (ATTACK_PATTERNS), `src/systems/CombatSystem.ts`, `src/data/skills.ts`, `src/types/index.ts`.
> **Références gamefeel :** Alabaster Dawn (rythme, poids, lisibilité), Zelda (spatialité), PAS Devil May Cry (aucune mémorisation d'inputs).

---

## 1. Résumé des principes de design

### Problème / Objectif
Le combat actuel est fonctionnel mais plat : chaque arme a un pattern fixe, et spammer J produit exactement le même résultat que jouer avec intention. Il manque :
1. Une **récompense au rythme** — le joueur qui épouse la cadence de son arme doit sentir la différence.
2. Une **identité de build** — les attributs (STR/INT/AGI/VIT/END) donnent des stats, mais aucun choix ne dit *"je suis un joueur Hammer"* ou *"je suis un kiter Bow"*.

### Décision de design

**Combos = rythme, pas mémorisation.** Un seul bouton d'attaque. Le combo n'est pas une séquence d'inputs à apprendre : c'est le **tempo naturel de l'arme**. Chaque arme a une pulsation (son cooldown) ; frapper *sur* la pulsation enchaîne, frapper *contre* elle (spam paniqué ou pause trop longue) ramène au coup de base. Au bout de la chaîne : un **finisher automatique** — le jeu récompense la discipline, il ne la teste pas.

**Le spam n'est jamais puni, il est juste ordinaire.** Un joueur qui mash J attaque normalement, sans finisher. Zéro frustration, zéro malus — juste pas la récompense. C'est le même principe que les orbes d'XP : satisfaisant, jamais bloquant.

**Talents = amplificateurs de style, pas de puissance brute.** 3 branches (Vigueur / Instinct / Arcane), 24 nœuds, 20 points maximum sur toute la partie. Chaque branche rend 2–3 armes clairement meilleures et amplifie les skills actifs existants. Les points sont rares : choisir, c'est renoncer — cohérent avec le thème du jeu.

**Justification thématique.** Le héros pratique l'Echo Magic : il copie, absorbe, répète. Le combo EST un écho — chaque coup résonne dans le suivant si le rythme est tenu. Les talents sont des « échos gravés » : ce que le héros choisit de retenir de ce qu'il a absorbé. Le HUD reste discret (règle Alabaster Dawn : rien de visible en permanence si ce n'est pas utile en combat).

### Impact joueur
- **Avant :** attaquer = maintenir/spammer J. Aucune texture entre les armes au-delà de la vitesse.
- **Après :** chaque arme a un groove. Le Hammer devient un métronome lent à deux temps dont le second coup fait trembler l'écran ; le Dagger une percussion rapide dont le 5e coup lacère. Le joueur *entend* son arme dans ses doigts. Les talents transforment ce groove en identité : « je suis un Instinct/Arcane au Bow enflammé ».

### Contraintes (ne PAS toucher)
- Le scaling ennemi reste `level ± 2` (aucun gate de niveau, ni sur les combos ni sur les talents).
- Les 4 slots de skills actifs (A/E/R/F) et le dash (1.5s cd, 0.3s iframes) restent inchangés.
- Les taux de loot, la formule de dégâts de base et les skills existants de `src/data/skills.ts` ne changent pas — les talents s'y greffent par multiplicateurs.
- Le tuning mouvement/dash validé (lerp 25·dt, DECEL 720, dashMomentum 0.48/560) est intouchable.
- Maximum 3 skills actifs par zone élémentaire — les talents sont des **passifs**, ils ne comptent pas dans ce quota.

---

## 2. Système de Combos

### 2.1 Mécanisme central

État runtime (non sauvegardé, vit dans `GameScene`) :

```
comboCount        : number   // 0..chainLength, coups réussis dans la chaîne courante
lastAttackStart   : number   // timestamp (time.now) du début de la dernière attaque
comboRushed       : boolean  // un input est arrivé dans la zone morte
bufferedAttack    : boolean  // un input valide attend la fin du cooldown
```

Chronologie d'une attaque (t = 0 au déclenchement, `cd` = cooldown de l'arme) :

```
t=0                    0.85·cd              cd                cd + grace
|——— ZONE MORTE ———————|—— ZONE BUFFER ————|—— ZONE GRACE ————|—— reset
   input → comboRushed    input → buffered     input → attaque    input → attaque
   (la chaîne cassera)    (part à t=cd,        immédiate,          normale,
                           chaîne continue)     chaîne continue     comboCount = 1
```

**Règles :**
1. **Zone morte** `[0, 0.85·cd)` : tout press d'attaque lève `comboRushed`. L'attaque suivante partira normalement à la fin du cooldown, mais `comboCount` repart à 1. Le spammeur attaque à pleine cadence — il ne voit juste jamais de finisher.
2. **Zone buffer** `[0.85·cd, cd)` : press = input buffering (règle "snappy" Alabaster Dawn — le joueur ne perd jamais un input à 50ms près). L'attaque part exactement à `t = cd`, la chaîne continue.
3. **Zone grace** `[cd, cd + grace]` : press = attaque immédiate, `comboCount++`.
4. **Après la grace** : press = attaque normale, `comboCount = 1` (nouveau départ, pas une punition).
5. Seul le **premier** press après le début d'une attaque compte pour l'évaluation de zone ; les suivants sont ignorés jusqu'au déclenchement suivant.
6. **Finisher** : quand `comboCount` atteint `chainLength`, l'attaque déclenchée est **remplacée** par le finisher (pattern de hits dédié). Après le finisher : `comboCount = 0` et le cooldown appliqué est `cd × 1.2` (recovery — le finisher a du poids, il ne s'enchaîne pas en boucle perpétuelle).

**Formule de grace :** `grace = clamp(round(cd × 0.40), 150, 450)` ms. Les armes lentes ont une fenêtre absolue plus large (on ne demande pas la précision d'un rythm game sur un Hammer à 1300ms).

**Resets de chaîne :** changement d'arme, changement de zone/scène, mort, utilisation d'un skill de téléportation (gale_step, volt_dash — le repositionnement casse le tempo, c'est voulu et lisible). **Ne resettent PAS** : subir un coup, dash (le timer continue de courir — sans le talent Pas Fantôme, dasher consomme souvent la fenêtre : c'est le trade-off mobilité/pression), ramasser du loot, skills non-téléport.

### 2.2 Table des combos par arme

`chainLength` = nombre de coups dont le dernier est le finisher. Les multiplicateurs de finisher sont **absolus** (ils remplacent le `damageMultiplier` du pattern normal, appliqués sur les dégâts de base CombatSystem). Budget d'équilibrage : une chaîne complète ≈ **+20–30% de DPS** vs. attaques hors-tempo, plus un effet utilitaire.

| Arme | cd (ms) | Chaîne | Buffer dès | Grace jusqu'à | Finisher | Mult. | Effet spécial |
|---|---|---|---|---|---|---|---|
| **DAGGER** | 400 | 5 | 340 | 560 | **Lacération** — fente avant (60px) en triple micro-frappe | ×2.2 (3 hits ×0.73, 0/60/120ms) | Repositionnement court + la cible est *Exposée* (−15% DEF, 2s) |
| **DUAL_DAGGER** | 500 | 4 | 425 | 700 | **Danse des Crocs** — tourbillon 360°, rayon 95 | ×2.7 (6 hits ×0.45, tous les 60ms) | Dernier hit : mini-knockback 60 |
| **SWORD** | 600 | 4 | 510 | 840 | **Estocade** — poussée en ligne, range 140, arc étroit | ×2.0 | Knockback 120 + le héros gagne une garde brève (−30% dégâts subis, 1s) |
| **DUAL_SWORD** | 800 | 3 | 680 | 1120 | **Croix d'Écho** — deux taillades croisées, arc 140° | ×3.2 (2 hits ×1.6, 0/140ms) | Saignement léger (10% ATK/s, 2s) sur toutes les cibles touchées |
| **GREATSWORD** | 1100 (windup 300) | 3 | 935 | 1540 | **Fauchage du Colosse** — rotation 360°, range 165 | ×3.1 | Knockback lourd 180 sur toutes les cibles |
| **AXE** | 700 (windup 150) | 4 | 595 | 980 | **Brise-Garde** — coup montant, arc 110° | ×2.6 | *Sunder* : −20% DEF sur la cible, 4s |
| **HAMMER** | 1300 (windup 400) | **2** | 1105 | 1750 | **Onde Tellurique** — impact au sol, AoE circulaire rayon 130 | ×3.8 | Stun 1.0s (zone entière) + screenshake fort |
| **STAFF** | 700 | 4 | 595 | 980 | **Orbe Saturé** — projectile perçant (traverse tout), range 300 | ×2.0 (magique) | Applique l'effet élémentaire de l'arme : FIRE→burn 3s, ICE/WATER→slow 40% 2.5s, LIGHTNING→stun 0.4s, EARTH→knockback 100, autre→rien |
| **BOW** | 900 (windup 200) | 3 | 765 | 1260 | **Volée** — 3 flèches en éventail (±12°) | ×1.8 (3 proj. ×0.6) | Chaque flèche perce 1 ennemi supplémentaire |
| FISTS | 500 | — | — | — | *(pas de combo — arme de fortune)* | — | — |

**Lecture par archétype :**
- **Agressif rapide** (Dagger, Dual Dagger, Dual Sword) : chaînes longues ou tempo serré, finishers multi-hits nerveux, la récompense arrive toutes les 2–3 secondes.
- **Lourd calculé** (Hammer, Greatsword) : chaînes courtes (2–3), fenêtres larges en absolu, finishers cataclysmiques. Le Hammer est LE cas d'école : un-deux, BOOM. Deux inputs bien placés = un stun de zone.
- **Polyvalent** (Sword, Axe) : chaînes moyennes, finishers utilitaires (garde, sunder) qui préparent la suite plutôt que de tout tuer.
- **Range/Kiter** (Bow, Staff) : le combo se construit en mouvement ; les finishers contrôlent l'espace (percée, effet élémentaire).
- **Hybride** : Staff + talents Arcane, ou Bow + Flèches Imprégnées — le finisher devient un vecteur d'élément.

### 2.3 HUD combo (discret — règle Alabaster Dawn)

- **Pips de chaîne** : `chainLength` losanges de 4×4 px, centrés **sous le sprite du joueur** (offset y +22px), espacés de 6px. Alpha 0.75.
- Pip validé : blanc cassé `0xf0e8d8`. Pip du finisher (le dernier) : s'allume **ambre** `0xffb347` avec une pulsation lente (scale 1.0→1.3, 400ms yoyo) quand `comboCount === chainLength − 1` (= prochain coup est le finisher).
- Chaîne cassée : les pips clignotent une fois en gris puis fade out 250ms. Pas de croix rouge, pas de "MISS" — l'échec est silencieux, jamais humiliant.
- Fade out complet après 2s sans attaque. **Rien n'est affiché hors combat.**
- Interdit : ne PAS réutiliser l'azur `0x66ddff` (réservé au blink dash-ready) ni le doré pur `0xffe066` (refusé par l'utilisateur pour le dash — l'ambre 0xffb347 du finisher doit rester visuellement distinct).

---

## 3. Arbre de Talents — 3 branches, 24 nœuds, 20 points

### 3.1 Règles structurelles

- **1 point de talent par niveau, plafonné à 20 points** (atteint au niveau 20 ; les niveaux 21–60 donnent des points d'attributs comme avant).
- Coût : **1 point par nœud, 2 points pour le capstone** de chaque branche. Branche complète = 9 points.
- **Gating par investissement, jamais par niveau** : Tier 1 libre · Tier 2 exige 2 pts déjà dépensés dans la branche · Tier 3 exige 4 pts · Capstone exige 6 pts.
- Conséquence arithmétique : 2 branches complètes = 18 pts, il reste 2 pts pour un dip Tier 1 ailleurs. **Impossible de compléter 3 branches** — le choix est structurel, pas arbitraire.
- **Respec** : chez Brother Ovan à Grievy Town, coût `200 × or × (nombre de respecs déjà effectués + 1)`. Thème : « réordonner les échos ». Jamais gratuit (le choix doit peser), jamais bloquant (l'expérimentation reste possible).
- Les talents sont des **passifs permanents** — ils n'occupent aucun slot de skill.

### 3.2 Branche VIGUEUR (STR/END) — corps à corps, survie, armes lourdes

*Armes cibles : HAMMER, GREATSWORD, AXE.*

| Tier | ID | Nom | Effet |
|---|---|---|---|
| 1 | `vig_iron_grip` | **Poigne de Fer** | +12% dégâts de mêlée (toutes armes sauf STAFF/BOW) |
| 1 | `vig_stone_skin` | **Peau de Pierre** | +10% DEF et Magic DEF |
| 2 | `vig_woodcutters_blood` | **Sang du Bûcheron** | Chaque kill en mêlée rend 3% des HP max |
| 2 | `vig_unstoppable` | **Inarrêtable** | Pendant un windup (GS/HAMMER/AXE) : aucun knockback subi, et le coup chargé inflige +10% |
| 3 | `vig_shattering_echo` | **Fracas** | Finishers GREATSWORD/HAMMER/AXE : durée de stun +0.5s, zone/portée +30% |
| 3 | `vig_dull_rage` | **Colère Sourde** | Sous 35% HP : +20% ATK, +10% DEF |
| 3 | `vig_war_march` | **Marche de Guerre** | GS/HAMMER/AXE : cooldown d'attaque −10% (les fenêtres de combo se recalculent sur le cd réduit) |
| Cap (2 pts) | `vig_titans_echo` | **Écho du Titan** | Après un finisher : la prochaine attaque dans les 2.5s inflige +50% et démarre la chaîne directement à 2 |

*Lore branche : « Ce que le corps retient. Aldric dirait : tiens-toi droit, frappe une fois, frappe juste. »*

### 3.3 Branche INSTINCT (AGI/VIT) — vitesse, critiques, esquive

*Armes cibles : DAGGER, DUAL_DAGGER, DUAL_SWORD, BOW.*

| Tier | ID | Nom | Effet |
|---|---|---|---|
| 1 | `ins_honed_reflexes` | **Réflexes Affûtés** | +6% chance de critique |
| 1 | `ins_fleet_footwork` | **Jeu de Jambes** | +8% vitesse de déplacement (+5% supplémentaires pendant une chaîne active) |
| 2 | `ins_perfect_tempo` | **Tempo Parfait** | Fenêtre de grace des combos +25% (toutes armes) |
| 2 | `ins_ghost_step` | **Pas Fantôme** | Dash : cooldown −0.3s, et le timer de combo est **gelé** pendant le dash (0.35s) — dasher ne casse plus le tempo |
| 3 | `ins_lacerate` | **Entaille** | Finishers DAGGER/DUAL_DAGGER/DUAL_SWORD : saignement 30% de l'ATK sur 3s (remplace/étend les saignements de base) |
| 3 | `ins_hunters_eye` | **Œil du Chasseur** | BOW : +15% dégâts sur cibles à plus de 250px, vitesse de projectile +20% |
| 3 | `ins_wild_vitality` | **Vitalité Sauvage** | +10% HP max, régénération hors-combat ×1.5 |
| Cap (2 pts) | `ins_deadly_dance` | **Danse Mortelle** | +5% dégâts par coup consécutif de la chaîne (max +25%), reset si la chaîne casse ; un critique pendant la chaîne étend la fenêtre courante de +100ms |

*Lore branche : « Ce que le corps devine avant la pensée. Sylvael comprenait : le mouvement est une forme de mémoire. »*

### 3.4 Branche ARCANE (INT) — magie, Staff, effets élémentaires

*Armes cibles : STAFF, BOW (hybride), + tous les skills actifs.*

| Tier | ID | Nom | Effet |
|---|---|---|---|
| 1 | `arc_focus` | **Focalisation** | +12% dégâts magiques (attaques et skills) |
| 1 | `arc_deep_reservoir` | **Réservoir Profond** | Coûts de mana −10%, mana max +15% |
| 2 | `arc_echo_resonance` | **Résonance d'Écho** | Skills actifs +10% dégâts ; `echo_strike` +25% |
| 2 | `arc_elemental_wake` | **Sillage Élémentaire** | Le finisher du STAFF laisse une zone élémentaire au point d'impact final (rayon 70, 30% Magic ATK/s, 2s), élément de l'arme |
| 3 | `arc_imbued_arrows` | **Flèches Imprégnées** | Si INT ≥ 10 : les flèches du BOW prennent l'élément de l'arc et gagnent +10% Magic ATK en dégâts additionnels (NEUTRAL si l'arc n'a pas d'élément) |
| 3 | `arc_amplification` | **Amplification Arcane** | Skills projectiles (`fireball`, `frost_lance`, `thunder_bolt`, `tidal_wave`, `chain_lightning`) : +25% dégâts |
| 3 | `arc_steel_ward` | **Garde d'Acier** | `stone_shield` / `ice_barrier` : valeur +25%, durée +1s |
| Cap (2 pts) | `arc_convergence` | **Convergence** | Tout finisher (n'importe quelle arme) déclenche une nova élémentaire : rayon 90, 60% Magic ATK, élément de l'arme (NEUTRAL sinon) |

*Lore branche : « Ce que l'esprit refuse d'oublier. Malachar a suivi ce chemin jusqu'au bout. Le héros décide où s'arrêter. »*

### 3.5 Intégration avec les skills actifs

Les skills de `src/data/skills.ts` ne changent pas d'une ligne. Les talents s'appliquent en **multiplicateurs au moment du calcul** dans `CombatSystem.playerSkill()` : `arc_focus` (+12% magique global), `arc_echo_resonance` (+10% skills), `arc_amplification` (+25% projectiles listés), `arc_steel_ward` (shield ×1.25, durée +1s), `arc_deep_reservoir` (mana ×0.9). Cumul multiplicatif : un fireball avec Focalisation + Résonance + Amplification = `×1.12 × 1.10 × 1.25 ≈ ×1.54` — c'est le plafond volontaire du build full-Arcane (9 pts investis).

---

## 4. Équilibrage inter-armes

| Arme | Point fort | Point faible | Archétype | Synergie de talent signature |
|---|---|---|---|---|
| **DAGGER** | Cadence la plus élevée, finisher qui *Expose* (setup parfait avant un gros skill) | Range 85 = zone de danger permanente ; DPS brut moyen sans la chaîne | Agressif rapide | Instinct — **Danse Mortelle** : la chaîne de 5 monte à +25%, le Dagger est l'arme qui stacke le plus vite |
| **DUAL_DAGGER** | Meilleur DPS mono-cible au contact ; finisher 360° gère l'encerclement | Aucune portée, aucun contrôle ; dépend totalement du positionnement | Agressif rapide | Instinct — **Entaille** + **Pas Fantôme** : saigner, sortir en dash sans casser la chaîne, revenir |
| **SWORD** | La plus tolérante : bon range, bon tempo, finisher défensif (garde 1s) | Ne domine aucune situation ; pas de scaling explosif | Polyvalent / première arme | Fonctionne dans les 3 branches — c'est SON identité ; **Poigne de Fer** ou **Danse Mortelle** au choix du joueur |
| **DUAL_SWORD** | Arcs très larges (140°+), roi du groupe de trash mobs ; chaîne courte = finishers fréquents | Multiplicateurs par hit faibles vs. cibles à haute DEF (la réduction s'applique 3×) | Agressif rapide | Instinct — **Entaille** : 3 hits × saignement = pression continue sur les packs |
| **GREATSWORD** | Range mêlée max (155→165), fauchage 360° ; frappe avant d'être frappé | Windup 300ms punissable ; vulnérable aux ennemis rapides en essaim | Lourd calculé | Vigueur — **Inarrêtable** : le windup devient une fenêtre de force, plus une faiblesse |
| **AXE** | Le meilleur ratio tempo/poids ; *Sunder* du finisher augmente les dégâts de TOUTE la suite (skills inclus) | Ni la vitesse du Sword, ni le poids du Hammer — exige la chaîne complète pour briller | Polyvalent offensif | Vigueur — **Fracas** + **Marche de Guerre** : l'Axe devient une machine à débuff |
| **HAMMER** | Burst + contrôle inégalés : chaîne de 2 → stun AoE 1s toutes les ~3.3s | Cadence la plus lente du jeu ; rater la fenêtre coûte cher en DPS | Lourd calculé | Vigueur — **Écho du Titan** : finisher → coup à +50% qui relance la chaîne à 2 → le Hammer boucle stun sur stun (c'est le fantasme, il se le paie 9 pts) |
| **STAFF** | Seule arme magique ; range 260 ; finisher perçant + statut élémentaire au choix de l'arme équipée | Dégâts physiques nuls, arc très étroit (15°) : précision requise, fragile au corps à corps | Range/Kiter, Hybride | Arcane — **Sillage Élémentaire** + **Convergence** : le Staff peint le sol en zones de contrôle |
| **BOW** | Range 460, sécurité totale ; Volée perçante = meilleur outil anti-ligne | Windup 200ms + projectile à esquiver ; DPS le plus bas si les flèches ratent | Range/Kiter, Hybride | Instinct (**Œil du Chasseur**) OU Arcane (**Flèches Imprégnées**) — le Bow est la seule arme avec deux builds de branche distincts, c'est sa profondeur |

**Garde-fous d'équilibrage :**
- Aucun talent ne donne plus de +25% d'un coup ; les capstones donnent du *gameplay* (boucle, stack, nova), pas des stats plates.
- Le cumul plein build ≈ +50–60% de dégâts sur l'arme signature à 20 points — significatif, jamais trivialisant (le scaling ennemi ±2 absorbe cette courbe).
- `vig_war_march` (−10% cd) réduit aussi les fenêtres en valeur absolue : le buff a un coût de précision. Vérifier en playtest que Hammer 1170ms reste confortable ; sinon exclure Hammer de ce nœud.
- Les effets *Exposée* (Dagger) et *Sunder* (Axe) ne se cumulent pas entre eux : le plus fort des deux s'applique.

---

## 5. Notes d'implémentation (dev-agent)

### 5.1 Types — `src/types/index.ts` (branche `types/*` dédiée)

```typescript
export enum TalentBranch {
  VIGOR = 'VIGOR',
  INSTINCT = 'INSTINCT',
  ARCANE = 'ARCANE',
}

export interface TalentNode {
  id: string;                 // snake_case prefixé : vig_ / ins_ / arc_
  name: string;
  description: string;
  branch: TalentBranch;
  tier: 1 | 2 | 3 | 4;        // 4 = capstone
  cost: number;               // 1, capstone = 2
  icon: string;               // talent_<id>
  /** Clés d'effet consommées par TalentSystem.getModifiers() — voir 5.3 */
  effects: Partial<Record<TalentEffectKey, number>>;
  lore?: string;
}

export type TalentEffectKey =
  | 'MELEE_DMG_PCT' | 'DEF_PCT' | 'KILL_HEAL_PCT' | 'WINDUP_ARMOR'
  | 'HEAVY_FINISHER_BONUS' | 'LOW_HP_ATK_PCT' | 'HEAVY_CD_REDUCTION_PCT'
  | 'POST_FINISHER_BUFF'
  | 'CRIT_PCT' | 'MOVE_SPEED_PCT' | 'COMBO_GRACE_PCT' | 'DASH_PRESERVES_COMBO'
  | 'LIGHT_FINISHER_BLEED' | 'BOW_RANGE_DMG_PCT' | 'MAX_HP_PCT'
  | 'COMBO_STACK_DMG'
  | 'MAGIC_DMG_PCT' | 'MANA_COST_PCT' | 'SKILL_DMG_PCT' | 'STAFF_FINISHER_ZONE'
  | 'BOW_ELEMENTAL_ARROWS' | 'PROJECTILE_SKILL_PCT' | 'SHIELD_SKILL_PCT'
  | 'FINISHER_NOVA';
```

**Modifications `PlayerState`** (⚠️ oblige un bump `SAVE_VERSION` + entrée `MIGRATION_MAP` dans `SaveSystem.ts`, cf. CLAUDE.md) :

```typescript
talentPoints: number;        // migration : Math.min(player.level, 20)
unlockedTalents: string[];   // migration : []
respecCount: number;         // migration : 0
```

**`StatusEffect`** : ajouter `'BLEED'` et `'EXPOSE'` (−DEF%) au union type. `StatusEffect` n'est pas persisté → pas d'impact save. `tickStatusEffects()` doit traiter BLEED comme BURN/POISON, et `EXPOSE`/Sunder doit être lu dans le calcul de DEF de la cible (non cumulables entre eux : garder le `strength` max).

### 5.2 Données — `src/data/talents.ts` (branche `content/*`)

`export const TALENTS: TalentNode[]` (les 24 nœuds de la section 3) + `export const TALENT_MAP: Record<string, TalentNode>` (même pattern que `SKILL_MAP`).

### 5.3 Système — `src/systems/TalentSystem.ts` (logique pure, zéro Phaser)

```typescript
class TalentSystem {
  static pointsSpentInBranch(player: PlayerState, branch: TalentBranch): number;
  static canUnlock(player: PlayerState, talentId: string): boolean;
  //  → points restants >= cost, gate tier (2/4/6 pts dans la branche), pas déjà pris
  static unlock(player: PlayerState, talentId: string): boolean;
  static respecCost(player: PlayerState): number;  // 200 * (respecCount + 1)
  static respec(player: PlayerState): boolean;     // rend tous les points, gold -= cost
  static getModifiers(player: PlayerState): TalentModifiers;
  //  → objet agrégé { meleeDmgMult, critBonus, graceMult, ... } calculé une fois
  //    et recalculé à chaque unlock/respec/équipement — PAS à chaque frame
}
```

### 5.4 Combos — `GameScene.ts` + `src/data/combos.ts`

Nouveau fichier data `src/data/combos.ts` :

```typescript
export interface ComboConfig {
  chainLength: number;          // finisher = coup n° chainLength
  graceMs: number;              // table section 2.2 (précalculé, pas la formule)
  finisher: {
    hits: AttackHit[];          // délais/range/arc/mult de la section 2.2
    effect?: { stunMs?: number; knockback?: number; aoeRadius?: number;
               bleed?: boolean; expose?: boolean; sunder?: boolean;
               guardMs?: number; pierce?: boolean; elemental?: boolean };
    cooldownMult: number;       // 1.2 partout
  };
}
export const COMBO_CONFIGS: Partial<Record<WeaponType, ComboConfig>>;
```

Machine à états dans `GameScene` (section 2.1). Points d'attention :

- **L'évaluation de zone se fait sur `keydown`** (déjà migré vers `kb.on('keydown')` — ne pas régresser vers `key.on(down)`). Stocker la ref du handler et la retirer dans `shutdown()` (règle CLAUDE.md).
- `CombatSystem.playerAttack(player, target)` → ajouter un paramètre optionnel `damageMultiplier = 1` (le finisher passe son mult ; les hits normaux passent le `damageMultiplier` du pattern comme aujourd'hui). Les modificateurs de talents (`meleeDmgMult`, `comboStackMult`, `lowHpAtkMult`…) se multiplient dans `playerAttack` **ET** `playerSkill` — même règle que le bonus Soul Echo (point critique CLAUDE.md).
- **BOW** : le combo s'incrémente **au tir**, pas à l'impact (le joueur contrôle son tempo, pas la trajectoire). La Volée spawne 3 projectiles avec `pierceCount = 1`.
- **Événements émis** (pour UIScene) : `combo-changed { count, max }`, `finisher-ready`, `finisher-executed { weaponType }`, `combo-broken`. UIScene doit les retirer dans `shutdown()` (point critique CLAUDE.md).
- `ins_perfect_tempo` : `graceMs × 1.25` appliqué à la lecture, pas dans la data.
- `vig_war_march` : le cd réduit sert de base au calcul des zones (0.85·cd', cd'+grace').

### 5.5 Cas limites

| Cas | Règle |
|---|---|
| `hidden_temporal_blade` (NO_ATTACK_COOLDOWN) | Chaque attaque incrémente `comboCount` sans condition de fenêtre. C'est un item HIDDEN game-breaker assumé : il pleut des finishers. Ne rien brider. |
| `hidden_first_blade` (FIRST_STRIKE_500_PCT) | Le ×5 s'applique au premier coup du combat, jamais cumulé avec un mult de finisher (prendre `max(5.0, finisherMult)`). |
| Changement d'arme via inventaire | `comboCount = 0`, pips fade out. |
| Skill de téléport (gale_step, volt_dash, void_step) | Reset la chaîne (section 2.1). Autres skills : timer continue. |
| Ennemi meurt pendant la chaîne | La chaîne continue — elle mesure le rythme du joueur, pas la cible. |
| Aucune cible touchée par un coup | La chaîne continue aussi (même raison). Frapper dans le vide en rythme garde le tempo — utile pour "précharger" un finisher avant un pack. À surveiller en playtest ; si abusé sur les boss, passer à "au moins 1 hit requis" en v1.1. |
| `arc_convergence` + `arc_elemental_wake` sur Staff | Les deux se déclenchent (nova + zone). C'est le build 9 pts Arcane, c'est censé être spectaculaire. |
| Pause / changement de scène | Reset silencieux de l'état combo. |

### 5.6 Ordre de livraison suggéré (branches Git)

1. `types/combo-talents` — types + bump `SAVE_VERSION` + `MIGRATION_MAP`
2. `feat/combo-system` — `combos.ts`, machine à états GameScene, HUD pips, param `damageMultiplier`
3. `feat/talent-system` — `talents.ts`, `TalentSystem`, hooks CombatSystem, UI d'arbre (écran accessible depuis le menu skills), respec chez Brother Ovan
4. Gate `code-reviewer` avant chaque PR sur `master` (règle CLAUDE.md).

---

## 6. Notes VFX & gamefeel (gamefeel-agent)

Règles globales (INSPIRATIONS.md) : flash blanc 1 frame par hit, chiffres colorés par élément, screenshake réservé aux crits et aux impacts lourds, dissolution à la mort. **Jamais de silence après une action.** Couleurs interdites de réemploi : azur `0x66ddff` (dash-ready), doré `0xffe066` (refusé).

### 6.1 Par finisher

| Finisher | VFX | Hitstop | Screenshake |
|---|---|---|---|
| Lacération (Dagger) | 3 traits blancs fins superposés en éventail serré + afterimage du joueur sur la fente (réutiliser la trainée du dash) ; icône « armure fissurée » 6px au-dessus de la cible Exposée (2s) | 40ms sur le 3e hit | non |
| Danse des Crocs (Dual Dagger) | Cercle de slash-arcs qui tourne (6 segments, un par hit), teinte blanc→ambre sur le dernier | 30ms dernier hit | micro (1px, 60ms) |
| Estocade (Sword) | Trait de percée long et droit + liseré bref `0xf0e8d8` sur le sprite joueur pendant la garde 1s (pulse discret, alpha 0.3) | 60ms | micro |
| Croix d'Écho (Dual Sword) | Deux arcs croisés en X, le second légèrement décalé (140ms) ; gouttes de saignement : particules rouge sombre `0x8a1a1a`, 2px, chute lente | 40ms ×2 | micro |
| Fauchage du Colosse (Greatsword) | Arc 360° épais avec trainée persistante 150ms ; les ennemis knockback laissent une afterimage | 90ms | moyen (3px, 120ms) |
| Brise-Garde (Axe) | Arc montant + éclat de « fragments d'armure » (4–6 particules grises) sur la cible ; icône Sunder 6px (4s) | 60ms | micro |
| Onde Tellurique (Hammer) | Anneau de choc au sol qui s'étend 0→130px en 200ms (ligne blanche 2px puis fissures brunes 400ms) + poussière | **120ms** (le plus lourd du jeu) | fort (5px, 200ms) — le seul shake « fort » hors boss |
| Orbe Saturé (Staff) | Projectile 8px de la couleur de l'élément (table INSPIRATIONS) avec halo pulsant, trainée de particules ; traverse les ennemis avec un flash coloré par cible | 30ms par cible | non |
| Volée (Bow) | 3 flèches simultanées avec trainées fines ; son de corde plus grave que le tir normal | 30ms par impact | non |

**Audio (quand le pipeline audio existera)** : chaque coup de chaîne monte d'un demi-ton ; le finisher a une couche basse en plus. Le joueur doit pouvoir jouer les yeux fermés et *entendre* où il en est dans la chaîne.

### 6.2 Combo HUD

- Pip qui s'allume : scale pop 1.0→1.4→1.0 en 120ms (ease Back.Out).
- Avant-dernier coup réussi → pip finisher pulse ambre `0xffb347` (section 2.3).
- Chaîne cassée : pips → gris `0x777777`, un blink, fade 250ms. Aucun son négatif, aucun texte.
- Finisher exécuté : les pips éclatent en 3–4 particules ambre qui retombent (300ms) puis disparaissent.

### 6.3 Talents visibles en jeu

Un talent qui ne se voit pas n'existe pas dans l'esprit du joueur. Chaque talent à trigger doit avoir un feedback :

| Talent | Feedback |
|---|---|
| Sang du Bûcheron | Chiffre de soin vert pâle `+X` au kill (petit, discret, monte comme les dégâts) |
| Inarrêtable | Liseré terre `0x88aa33` 1px sur le sprite pendant le windup |
| Colère Sourde | Vignette rouge très légère (alpha 0.06) aux bords de l'écran tant que HP < 35% — double usage : danger + rage active |
| Écho du Titan | Le sprite de l'arme scintille blanc chaud pendant la fenêtre 2.5s ; l'attaque buffée a un flash d'impact 2× |
| Pas Fantôme | Les pips de combo restent allumés (légèrement translucides) pendant le dash au lieu de continuer à « vieillir » |
| Danse Mortelle | Micro-particules blanches (1px) autour de l'arme, +1 particule par stack (max 5) |
| Entaille / saignements | DoT ticks : chiffres rouge sombre plus petits que les hits directs |
| Sillage Élémentaire | Zone au sol : cercle semi-transparent couleur élément, bord net (pas de dégradé — pixel art), particules montantes 1px |
| Flèches Imprégnées | Trainée de flèche colorée par l'élément de l'arc |
| Convergence | Nova : anneau élémentaire 0→90px en 150ms, 8 particules radiales |
| Level-up avec point de talent dispo | Notification standard « +1 écho à graver » dans la file de notifs — pas de popup bloquant |

### 6.4 Ce qui est explicitement hors scope v1

- Break gauge / stagger ennemi à la Alabaster Dawn (système séparé, futur candidat — le hook `finisher-executed` est prévu pour s'y brancher).
- Combos aériens, juggles, switch d'arme en cours de chaîne.
- Talents de rang multiple (chaque nœud = 1 rang unique).
- Rééquilibrage des drops ou des skills existants (constraint : toute retouche de rareté = re-simulation économique complète).

---

*Spec v1.0 — lead game design. Les valeurs de multiplicateurs et de fenêtres sont des points de départ calibrés sur un budget +20–30% DPS par chaîne complète ; playtest obligatoire sur Hammer (fenêtre 1105–1750ms) et Dagger (grace 160ms) qui bornent le spectre.*
