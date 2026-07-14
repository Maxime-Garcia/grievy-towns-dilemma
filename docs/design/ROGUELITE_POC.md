# Le virage roguelite — spec du Proof of Concept

> **Statut : décidé par le créateur (juillet 2026). On assume le roguelite à fond.**
>
> Ce document est le **contrat commun** de tous les agents qui travaillent sur ce chantier.
> Il prime sur toute autre source. Un agent qui s'en écarte doit le dire, pas improviser.
>
> Branche d'intégration : **`feat/roguelite`**. Chaque lot part d'une branche de fonctionnalité
> qui s'y greffe (`feat/roguelite-run-system`, `feat/roguelite-ui-pity`, …).

---

## 0. La décision

Grievy Town's Dilemma devient un **roguelite d'extraction**, façon Wizard of Legend pour la boucle,
Moonlighter pour le risque d'extraction.

**Ce qu'on abandonne :**
- Le New Game+ / les fins Erase-Restore. Plus de méta-narration de reset.
- Toutes les villes **sauf Grievy Town**.
- **Toutes les zones existantes**, tous les `zoneMaps`, toutes les régions de spawn. On repart de zéro.
- **Le système de niveaux et de points de statistiques.** Toute la puissance passe désormais par
  **l'équipement et les sorts**. C'est une simplification radicale et volontaire.
- La localisation approximative dans le Bestiaire (feature bancale, supprimée).

**Ce qu'on garde :**
- Grievy Town comme **hub**. Un PNJ y lance la run (le rôle du Maître de l'Arène dans WoL).
- **Le lore et le ton.** Le but n'est pas de prouver qu'on est le meilleur : c'est de **libérer le monde**.
  Chaque descente est une tentative de délivrance, pas un tournoi.
- Le loot ARPG **entier** : 649 items, 7 raretés, substats 1→7, la **Résonance**.
- Le Bestiaire, l'Arsenal, l'Équipement, l'or.
- Les identités élémentaires de zones (feu, eau, glace, foudre, terre, vent, ténèbres…).

---

## 0 bis. Décisions du créateur (14/07/2026) — non rediscutables sans lui

1. **Narration : tout supprimer sauf Grievy Town.** Les 91 PNJ, les ~28 quêtes et les dialogues des
   autres villes disparaissent. On assume : un roguelite n'a pas de DAG de quêtes. Seuls survivent les
   PNJ de Grievy Town — le lanceur de run, les marchands, l'artisan.
   *(Décision coûteuse et lucide : c'est du contenu écrit qu'on jette. Elle est prise en connaissance de
   cause, ne la re-litigez pas.)*
2. **Zone pilote : le FEU (Ignis).** Le plus d'assets existants, et Pyrath fournit une base de boss.
3. **Séquencement : l'équilibrage d'abord.** Le `balance-agent` simule l'exfiltration et le pity AVANT
   qu'une ligne soit codée. Si l'exfiltration est mathématiquement cassée, on l'apprend en une heure au
   lieu de trois semaines.

**Conséquences à traiter :**
- Supprimer les niveaux touche `PlayerState` → **bump obligatoire de `SAVE_VERSION` + `MIGRATION_MAP`**.
  Les sauvegardes existantes ne survivront pas. Assumé (branche de PoC).
- L'or est conservé, mais **les marchands vivent dans les villes qu'on supprime** : il faut les
  rapatrier à Grievy Town, sinon l'économie n'a plus de robinet.

---

## 1. La boucle

```
GRIEVY TOWN (hub)
  │  On équipe ce qu'on a sécurisé. On choisit 3-4 consommables. On choisit une VOIE élémentaire.
  │  Le PNJ ouvre la descente.
  ▼
ZONE (élémentaire)
  │  Quota d'ennemis à abattre. Le loot tombe dans le sac de run.
  ▼
LE BOSS APPARAÎT
  │  Les autres créatures disparaissent. Nom en fondu, mise en scène.
  │  Boss à grande échelle, patterns propres, difficile.
  ▼
VICTOIRE → CHOIX
  ├─ S'EXFILTRER  → on remonte à Grievy Town. On ne garde PAS tout (cf. §3).
  └─ CONTINUER    → zone suivante, plus dure. Le sac grossit, le risque aussi.
  ▼
MORT → on perd le sac de run. (Ce qui est en banque à Grievy Town est intouchable.)
FIN DE PARCOURS (dernière zone vaincue) → on conserve TOUT.
```

**La tension centrale, et elle est unique au genre :** ce n'est pas « survivrai-je ? », c'est
**« est-ce que je crois assez en mon équipement pour ne pas m'enfuir maintenant ? »**

---

## 2. Ce que le joueur emporte EN DESCENDANT

- **Équipement** : librement, sans limite. C'est sa build, il l'a méritée.
- **Consommables : 3 ou 4 slots, pas plus.** Valeur arbitraire pour le PoC — à équilibrer plus tard.
  C'est le seul vrai arbitrage d'avant-run, et il doit faire mal.

---

## 3. L'EXTRACTION — la mécanique signature

Inspirée de Moonlighter. **À arbitrer par le `balance-agent`, pas à décider à l'intuition.**

Règles posées par le créateur :
- **Aller au bout du parcours → on conserve TOUT.** Sans exception. C'est la récompense de la foi.
- **S'exfiltrer en cours de route → on ne conserve PAS tout.**
- Il doit y avoir **de l'aléatoire** dans ce qu'on ramène : partir tôt doit comporter un vrai risque,
  pas juste une taxe prévisible qu'on optimise.

### La mécanique est TRANCHÉE — elle ne se rediscute pas

C'est **celle de Moonlighter**, et son cœur est l'**arbitrage**, pas la punition.

**Il y a DEUX contraintes distinctes, et c'est ce qui fait la richesse du système. Ne pas les
confondre — deux étages de décision, pas un.**

**Étage 1 — le sac de run est LIMITÉ.** C'est l'arbitrage seconde par seconde.
- Le sac a une **capacité**. Il se remplit.
- Ramasser alors qu'il est plein est **impossible** → message **« Inventaire plein »**.
- Les objets sont **jetables au sol**, à tout moment, pour faire de la place.
- Question posée au joueur en permanence : *ce butin vaut-il plus que celui que je porte déjà ?*

**Étage 2 — l'exfiltration.** C'est l'arbitrage global, une fois, au moment de partir.
- **Aller au bout de toutes les zones → on conserve TOUT.** Sans limite, sans slot, sans condition.
  C'est la récompense de la foi, et le seul moyen de tout ramener.
- **S'exfiltrer en route → on ne dispose que de N emplacements.** Le joueur **choisit** ce qu'il y met.
  **Tout le reste est perdu, au sol.** Il doit donc abandonner, de sa propre main, un butin pour lequel
  il vient de se battre.
- **N s'améliore.** On achète des emplacements supplémentaires **chez un marchand**, avec de l'or.

> **La douleur ne vient pas d'une perte subie : elle vient d'une décision.** C'est ce qui fait la force
> de Moonlighter, et c'est ce qu'on reproduit.

**Deux bénéfices dérivés, et ils ne sont pas anecdotiques** — ils comblent des trous ouverts par la
suppression des niveaux :
- **Une méta-progression** : le nombre de slots est ce qui grandit d'une run à l'autre. C'est la courbe
  de puissance long terme du joueur, à la place des niveaux.
- **Un puits à or** : l'or retrouve une raison d'exister, et une bonne — il achète de la *capacité à
  garder*, pas de la puissance brute.

### ⚠️ L'aléatoire est ABANDONNÉ

Le créateur avait d'abord évoqué « un peu d'aléatoire pour qu'il y ait des inconvénients à s'exfiltrer
tôt ». **Les slots le rendent inutile, et il serait même nuisible :** avec un tirage par-dessus, le
joueur perdrait des objets qu'il a *délibérément choisi de sauver*. Ça se vit comme du vol, pas comme un
pari — et ça détruit exactement l'agentivité qui fait tout le sel de la mécanique. Le risque est déjà
là, et il est **choisi**.

### L'objet au sol — demandes explicites du créateur (→ `ux-agent`)

Le loot au sol devient un objet de première classe du jeu, plus un détail :

1. **Une belle bulle d'item au sol** — à la **couleur de la rareté** de l'objet, avec **l'asset de
   l'item dedans**. C'est ce que le joueur regarde en permanence : il doit pouvoir juger un butin *sans
   le ramasser*.
2. **Message « Inventaire plein »** quand on tente de ramasser alors qu'on n'a plus de place.
3. **Une touche pour jeter**, ajoutée dans la **popup d'item**.

Ces trois éléments forment la boucle de l'étage 1. Si jeter est pénible, le jeu entier est pénible :
c'est le geste le plus répété de la run.

### Ce qui reste ouvert : le RÉGLAGE

Le `balance-agent` doit établir, par simulation :
0. **La capacité du sac de run** — c'est elle qui crée l'arbitrage seconde par seconde. Trop grande :
   on ramasse tout sans réfléchir, l'étage 1 disparaît. Trop petite : on passe la run dans les menus.
1. **N de départ** — le nombre d'emplacements d'exfiltration au premier run. Trop peu : on ne s'exfiltre
   jamais, autant mourir. Trop : on ne perd rien, il n'y a plus d'arbitrage.
2. **La courbe d'upgrade chez le marchand** — coût en or de chaque emplacement supplémentaire, et
   plafond éventuel. C'est le puits à or principal du jeu : il doit rester désirable longtemps.
3. **Le point d'indifférence** — la profondeur à laquelle la valeur espérée de « pousser » rattrape
   celle de « s'exfiltrer maintenant ». C'est lui qui produit le serrement de ventre. Il ne doit tomber
   ni à la zone 1 (on partirait toujours) ni à la dernière (on pousserait toujours).

---

## 4. LE PITY, VISIBLE ET VERBEUX

Demande explicite du créateur, et c'est un **contrat affiché** : ce qu'on promet doit être tenu
**au kill près, sur tous les ennemis**. Le pity actuel ne tenait pas sa promesse (il se réinitialisait
sans rien donner sur 131 ennemis sur 196). Cette erreur ne doit pas se reproduire.

Interface temps réel, à partir de **l'Épique** :

```
PITY ÉQUIPEMENT
  Épique      3
  Légendaire  103
  Mythique    156
  Caché       13
```

(Le nombre = ennemis restants à tuer avant l'obtention garantie.)

Contraintes :
- Toujours visible en run, sans ouvrir de menu — c'est un moteur de motivation, pas une statistique.
- Lisible d'un coup d'œil pendant un combat. Ne mange pas l'action.
- Le compteur **descend** — on voit la récompense approcher.
- Design confié au `ux-agent` : « un truc un peu fancy ».

---

## 5. LA ZONE — refaite de zéro

**Pilote : UNE seule zone, un seul élément.** On généralise seulement après validation.

- Combat contre les créatures de cette zone (identité élémentaire forte).
- **Quota** d'ennemis à abattre. Nombre fini, réparti sur la carte — pas de respawn infini.
- Quota atteint → **les créatures restantes disparaissent**, le **boss apparaît**.
- **Mise en scène du boss** : fondu, nom en grand, « badass et stylé ». C'est un moment.
- **Boss à plus grande échelle que le joueur**, avec des patterns qui lui sont propres.
  Il doit être **difficile**.

---

## 6. Ce qui disparaît du code

À supprimer ou neutraliser (pas à conserver « au cas où » — le code mort ment) :
- Système de niveaux, XP, points d'attributs. La puissance = équipement + sorts.
- Zones et `zoneMaps` existants, régions de spawn.
- Villes autres que Grievy Town.
- Localisation approximative du Bestiaire.
- New Game+ / fins Erase-Restore.

⚠️ Toute modification de `PlayerState` / `WorldState` / `GameState` **oblige** à bumper
`SAVE_VERSION` et à ajouter une entrée dans `MIGRATION_MAP` (règle `CLAUDE.md`).

---

## 7. Le ticket d'entrée gamefeel — NON NÉGOCIABLE

Un roguelite ne tient **que** par sa sensation : le joueur refait la même chose cinquante fois, et il
ne reste que la seconde par seconde. Trois trous doivent être bouchés **avant** de juger le PoC, sans
quoi on jugera un jeu qui n'a pas eu sa chance :

1. **Unifier les chemins de dégâts joueur.** *(C'est un bug, vérifié dans le code.)*
   `applyDamageToPlayer` teste `isDashing` et les i-frames. `applyEnemyMeleeDamage` ne teste **ni l'un
   ni l'autre**. L'overlap projectile ignore `isDashing` **et** retranche les PV directement, sans
   passer par la mitigation — **l'armure et la DEF ne protègent pas des projectiles.**
   Dans un roguelite, chaque mort « j'avais pourtant dashé » se vit comme un vol.
2. **Le son.** Il n'y a **aucun** `this.sound` dans tout `src/`. La moitié de la sensation d'impact est
   sonore. Même des sons synthétiques (WebAudio, sans assets) valent mieux que le silence.
3. **Le hitstop.** Aucune pause de frame à l'impact : les coups traversent les ennemis au lieu de
   s'arrêter dedans.

Acquis validés par le créateur, **à ne PAS re-tuner** : mouvement inertiel, dash à momentum, blink azur.

---

## 8. Découpage du PoC

| Lot | Branche | Livrable |
|---|---|---|
| Spec d'extraction & pity | — | Nombres simulés, pas des intuitions (`balance-agent`) |
| `RunSystem` | `feat/roguelite-run-system` | État de run, sac, quota, exfiltration, mort |
| Zone pilote | `feat/roguelite-zone-pilot` | Une zone élémentaire, quota, spawn fini |
| Boss | `feat/roguelite-boss` | Échelle, patterns, mise en scène d'apparition |
| Gamefeel | `feat/roguelite-gamefeel` | Les 3 prérequis du §7 |
| UI | `feat/roguelite-ui` | HUD de pity, écran d'extraction, inventaire intra-run |
| Nettoyage | `feat/roguelite-teardown` | Suppression des niveaux, zones, villes, NG+ |

**Critère de succès du PoC** — une seule question, et elle est bête exprès :

> *Après avoir vaincu le boss, est-ce que la décision « s'exfiltrer ou continuer » me tord le ventre ?*

Si oui, l'idée tient et on généralise. Si non, aucun volume de contenu ne la sauvera.
