# Inspirations & État du projet — Grievy Town's Dilemma

> **Usage agents :** référence thématique ET état des lieux. Tout contenu créé (zones, ennemis, PNJ, dialogues, skills, items, assets, effets, sons) doit être cohérent avec ce document.
>
> **⚠️ Lisez le §0 avant tout.** Ce fichier a été périmé pendant plusieurs mois et a induit des agents en erreur : il décrivait un jeu qui n'existait plus. Les chiffres ci-dessous sont **vérifiés contre le code** (juillet 2026). En cas de contradiction entre ce document et le code, **le code gagne** — et il faut corriger ce document.

---

## 0. ÉTAT DU PROJET — juillet 2026

### Ce que le jeu EST aujourd'hui

Un **action-RPG top-down narratif**, jouable de bout en bout, avec une couche de loot **ARPG** (Diablo/PoE) nettement plus développée que ce que le projet visait à l'origine.

| | Réel (vérifié) |
|---|---|
| **Items** | **649** — dont 392 générés procéduralement (lore, stats, raretés, `equipRanges`) |
| **Ennemis** | **196** — dont 139 générés ; 7 divinités nommées |
| **Zones** | 8 principales + routes et villages (`zones.ts`, `zoneMaps.ts` — layouts écrits à la main) |
| **Quêtes / PNJ** | DAG de quêtes principales et secondaires, dialogues conditionnels, PNJ à position fixe |
| **Compétences** | 24 skills · **87 talents** (`TALENT_MAP`, ~70 effets implémentés) · 23 recettes de craft |
| **Langues** | FR + EN, **complet** (649/649 items, 196/196 ennemis, dialogues) |
| **Écrans** | Jeu, Inventaire, Compétences, **Arsenal**, **Bestiaire**, Boutique, Dialogue, Pause, Menu |
| **Canvas** | **960×720** (4:3), `pixelArt: true`, zoom monde entier (jamais fractionnaire) |

### Les 5 dérives que ce document ne disait plus

Corrigées ici. Elles étaient toutes des **pièges actifs** pour un agent :

1. **7 raretés, pas 6.** `MYTHIC` s'est intercalé entre LEGENDARY et HIDDEN.
2. **1 à 7 substats, pas 0 à 4.** COMMON en a **1**, HIDDEN en a **7** — le nombre de substats EST le signal de rareté.
3. **9 `ElementType`, pas 7.** `DIVINE` et `NEUTRAL` se sont ajoutés aux 7 élémentaires.
4. **Canvas 960×720, pas 800×600.** Et la police n'est plus Press Start 2P / Verdana mais **Neatpixels**.
5. **La Résonance existe** — un système central, absent de toute version précédente de ce fichier (cf. §4).

---

## 1. STYLE VISUEL

### Référence : Pokémon Gen 3/4 + Chrono Trigger (SNES)
- **Vue :** top-down 2D, caméra qui suit le joueur. **Pas d'isométrique** — une passe 2.5D/élévation a été tentée puis **rejetée visuellement**, ne pas la reproposer.
- **Canvas :** **960×720**, `pixelArt: true`, `image-rendering: pixelated`.
- **Zoom caméra monde : ENTIER, jamais fractionnaire.** Un zoom 1,2 rééchantillonne le monde par un facteur non entier sous NEAREST → doublement inégal des pixels → flou. Contrainte dure.
- **Sprites :** 32×32 joueur/ennemis/PNJ · 64×64 boss. **Tiles :** 16×16. **Icônes d'items :** 32×32.
- **Palette :** hard pixel edges, zéro anti-aliasing.
- **Ton :** medieval fantasy adulte (Frieren). Sombre, saturé, jamais enfantin.

### Typographie — contrainte dure
La police **Neatpixels** a quatre variantes, **chacune avec sa propre grille** :

| Variante | Grille | Tailles nettes |
|---|---|---|
| Standard (corps) | **7 px** | 7 / 14 / 21 / 28 |
| Minimal (HUD dense) | **10 px** | 10 / 20 / 30 |
| Boss (titres) | **18 px** | 18 / 36 |
| Blocks | 7 px | 7 / 14 / 21 |

**Une police pixel n'est nette qu'aux multiples entiers de sa grille.** Hors grille, le rastériseur du navigateur anti-aliase le glyphe, et le flou est **cuit dans la texture** avant que Phaser ne la voie : aucun réglage de filtrage ne le rattrape après coup. C'était la vraie cause du « texte flou » — pas le filtre pixel art. Toute taille passe par `snapFontSize()` / `uiStyle()` (`src/utils/UITheme.ts`). Ne jamais écrire une taille en dur.

### Palettes par zone
| Zone | Couleurs dominantes |
|------|---------------------|
| Grievy Town | Brun chaud, beige, gris pierre |
| Ignis Reach | Rouge, orange, noir obsidienne, lave |
| Terravast | Brun sombre, gris caverne, bleu cristal bioluminescent |
| Zephyr Peaks | Bleu ciel pâle, blanc nuage, or céleste |
| Abyssmar | Bleu nuit, teal, bioluminescence cyan |
| Volterra | Violet sombre, gris métal, jaune électrique |
| Glaciem | Blanc neige, bleu glace, argent givré |
| Malachar's Spire | Noir quasi absolu, violet fantôme, fissures lumineuses |

---

## 2. INTERFACE & HUD

**Références :** Sword Art Online (barres) + Alabaster Dawn (esthétique d'ensemble).

- Interface **intégrée à l'univers** — jamais générique, jamais sci-fi.
- Barres HP/MP claires mais **discrètes** : elles ne mangent pas l'action.
- HP : vert (>50 %) → orange (<50 %) → rouge (<25 %). MP : bleu. XP : bande basse.
- Notifications montantes, courtes (~2 s) — level-up, drop, quête, zone.
- Dialogues en bas d'écran, portrait PNJ à gauche (SNES).

**Règles d'UI acquises, non négociables** (`docs/design/UI_UX_GUIDELINES.md`) :
- **Aucune troncature au nombre de caractères.** `fitText()` mesure en pixels. `slice(n)` est banni — c'était la cause structurelle des débordements.
- Toute largeur de panneau **dérive de `cameras.main.width/height`**, jamais en dur.
- `wordWrapWidth` partout. Zéro débordement horizontal, sur tous les écrans.
- Toute scène d'overlay câble `this.events.once(SHUTDOWN, this.shutdown, this)` — **Phaser n'appelle pas `shutdown()` tout seul**, il se contente d'émettre l'événement. Sans ce câblage, la méthode est du code mort et les listeners fuient.

---

## 3. GAMEFEEL

**Référence absolue : Alabaster Dawn** (Radical Fish Games — les auteurs de CrossCode).

- **Poids des coups** : une épée et un marteau ne se sentent pas pareil. Impact immédiat.
- **Snappy** : zéro latence entre l'intention et l'action.
- **Le dash a une personnalité** — ce n'est pas « aller plus vite ».
- **Break gauge** : frapper remplit une jauge de stagger ; pleine → l'ennemi est vulnérable, fenêtre de combo.
- Influences combat : Zelda (lisibilité, spatialité) + DMC/Kingdom Hearts (chaînes, mobilité).

### Acquis validés par le créateur — NE PAS RE-TUNER
- **Mouvement inertiel**, **dash à momentum**, **blink azur** : validés « PARFAIT » après une passe de tuning dédiée. C'est le socle du mouvement. On construit **dessus**.

### Effets
| Événement | Effet |
|---|---|
| Hit physique | Flash blanc 1 frame + chiffre blanc montant |
| Hit élémentaire | Flash de l'élément + chiffre coloré |
| Critique | Flash jaune + chiffre plus grand + screen shake léger |
| Dash | Afterimage + transparence brève (i-frames lisibles) |
| Mort d'ennemi | Dissolution (flash → fondu), pas de ragdoll |
| Mort de boss | Séquence longue — l'aura s'effondre. **C'est un moment, on prend le temps.** |
| Orbes d'XP | Aimantés vers le joueur (Vampire Survivors) — fluide, jamais bloquant |

**Principe :** chaque action du joueur a un retour immédiat. Jamais de silence.

---

## 4. LOOT & PROGRESSION — le cœur ARPG

> C'est **le système le plus développé du jeu**, et de loin celui qui a le plus grossi depuis la conception initiale. Influence : Diablo / Path of Exile.

### Raretés — **7**, pas 6
| Rareté | Couleur | Substats |
|---|---|---|
| Common | Gris `#b0b0b0` | 1 |
| Uncommon | Vert `#4fc04f` | 2 |
| Rare | Bleu `#4f9fff` | 3 |
| Epic | Violet `#7722cc` | 4 |
| Legendary | **Or `#ffd700`** | 5 |
| **Mythic** | Rose `#ff4fc0` | 6 |
| **Hidden** | Rouge `#ff4f4f` | 7 + **passif unique** |

**Le nombre de substats EST le signal de rareté** (1 → 7). Ne jamais tronquer leur affichage : un Hidden à 7 lignes deviendrait indiscernable d'un Rare à 3.

### Résonance — le système que ce document ignorait
Chaque **instance** d'item est rollée à l'acquisition (`StatRollSystem`) : ses stats tombent dans une fourchette (`equipRanges`), et la qualité globale du jet donne une note **0-100**, la **Résonance**, en 5 paliers : Sourde · Stable · Claire · **Vibrante** · **Parfaite**.

- Deux exemplaires du même item ne se valent pas. C'est la tension de l'ouverture.
- La rareté détermine le NOMBRE de substats, **jamais leur qualité maximale** : un Common peut rouler Parfait — et c'est un petit événement, qui déclenche sa propre notification.
- Voir `docs/design/LOOT_STAT_ROLLS.md`.

### Règles de loot acquises
- **Pity system** : 250 kills → Epic garanti, 500 → Legendary garanti. **La dette passe par le world drop**, jamais effacée sans contrepartie (elle ne payait pas : 131 ennemis sur 196 n'ont aucun Epic dans leur table fixe).
- **World drop** : pool des 392 items générés, 18 % de base (×2,5 élite, ×4 boss), verrouillé par niveau.
- **Hidden : 0,07 %.** Les 27 sont lootables, un par gros ennemi.
- **Le Bestiaire ne ment pas.** Un `itemId` de table de butin DOIT exister ET être dans la table de loot de CET ennemi. Un id fantôme ne casse ni la compilation ni le runtime — il se contente de mentir au joueur.
- Toute nouvelle arme **doit** avoir un `equipStats.mainStat` (miroir ATK_FLAT/MATK_FLAT de `damage`/`magicDamage`) : `CombatSystem` ne lit jamais `weapon.damage` directement.

### Armes — 10 types
SWORD · DUAL_SWORD · GREATSWORD · DAGGER · DUAL_DAGGER · AXE · HAMMER · STAFF · BOW · **SPEAR**

### Éléments — **9**
FIRE · EARTH · WIND · WATER · LIGHTNING · ICE · DARK · **DIVINE** · **NEUTRAL**
- **DARK est super-efficace (×1,5) contre tout ce qui n'est ni DARK ni DIVINE.**
- NEUTRAL ne résiste à rien et ne prend aucun bonus.

### Progression
Niveaux, points d'attributs, **arbre de talents (87 nœuds, ~70 effets réels)**, combos, 4 skills équipés (touches **1-4**), craft par artisan PNJ (SAO — on rapporte les matériaux, pas d'auto-craft).

---

## 5. NARRATION & LORE

**Références : Frieren (ton) + Dragon Ball Super (révélation).**

- **Ton :** sobre, jamais grandiloquent. Le lore vit dans les descriptions courtes et les petites phrases. *Show, don't tell.* Les personnages sont **fatigués, pas dramatiques**.
- **Aldric comme étalon :** « You look better than when I found you. That's something. » Laconique, chaleureux, réel.
- **Le héros** est un fragment du Dieu Primordial, en forme humaine.
- **Deux fins :** *Erase* (effacement de Velmara → New Game+) · *Restore* (sacrifice du pouvoir, le héros redevient humain et rentre à Grievy Town).

### Le Dilemme central — l'identité du jeu
**Chaque boss tué est une divinité morte pour toujours.** Le monde perd sa magie et **se désature visuellement** à mesure. Chaque victoire est une perte. Le héros doit tuer les dieux pour sauver les gens des dieux.

> Ce n'est pas un jeu où l'on gagne proprement. C'est un jeu de sacrifice.

**Malachar** n'est pas un démon : un homme, un érudit de Grievy Town. Sa question était légitime — *pourquoi les dieux gardent-ils le pouvoir pour eux ?* Le vrai monstre du jeu, c'est l'indifférence.

---

## 6. DIRECTION ENVISAGÉE — le virage roguelite *(en évaluation, non décidé)*

> **Statut : à l'étude, juillet 2026.** Aucun code n'a été écrit dans ce sens. Cette section existe pour qu'un agent sache où le projet regarde — pas pour qu'il agisse dessus.

### L'intention du créateur
Passer d'un jeu d'histoire linéaire à une boucle **roguelite façon Wizard of Legend** : une **run**, on tente de vaincre toutes les zones, on meurt, on recommence. Zones générées procéduralement par thème, quantité finie d'ennemis, loot conservé, upgrades de stats intra-run perdus à la mort.

### Ce que l'analyse de design en dit — à lire avant de proposer quoi que ce soit

**Le pivot intégral détruirait l'identité du jeu.** Le Dilemme n'existe que si la partie est **persistante** : dans une run qui reset, tuer une divinité ne coûte rien, puisqu'on recommencera. La désaturation du monde n'a plus de sujet. Le DAG de quêtes, les PNJ, les dialogues conditionnels — tout cela suppose un monde qui dure.

**Le procédural n'évite pas la galère des zones — il la déplace.** Wizard of Legend, Dead Cells et Hades **n'engendrent pas leurs niveaux** : ils recombinent des salles **dessinées à la main**. Le « procédural » des bons roguelites, c'est de l'assemblage de contenu authored. Il faut donc quand même dessiner les salles — et écrire, en plus, un générateur qui garantit connectivité, spawns valides, rythme et identité de zone.

**Le loot ARPG et la boucle roguelite ne portent pas la même chose.** Comparer 4 substats et une Résonance en plein combat est trop lent pour rythmer une run. La puissance intra-run doit venir d'un canal **rapide** (choisir 1 boon parmi 3 en 5 secondes), et les 649 items rester du **butin**, pas de la puissance de run.

### Piste privilégiée : greffer, ne pas pivoter
Instancier les zones **déjà mortes** en runs (une divinité tuée laisse une « faille » où sa zone rejoue un souvenir corrompu d'elle-même). Le mode run devient alors une **conséquence du Dilemme**, pas un mode annexe — et le thème le porte. Les upgrades de run se branchent sur le moteur de talents **existant** (~70 effets déjà implémentés) ; le loot devient une boucle d'**extraction** (banquer ou pousser ?), ce qui recycle la Résonance telle quelle.

**Rien n'est tranché.** Un agent qui touche à ce sujet doit demander avant d'implémenter.

---

## 7. PERSONNAGES — PRINCIPES

- **PNJ :** chacun existe **en dehors de sa fonction**. Jamais de « Can I help you ? ». Une révélation par échange, pas un roman.
- **Ennemis :** le lore de la zone tient en une phrase. Le comportement IA (chaser, patrol, ranged, summoner, charger) **est** la personnalité.
- **Divinités :** avant la corruption, protectrices et liées à leur zone. Après, la même essence hors de contrôle. **Pas maléfiques — brisées.** Le joueur ne combat pas un ennemi : il met fin à une souffrance.

---

## 8. AUDIO — à définir

Aucun fichier audio intégré. `musicKey` est défini par zone.
Pistes : Grievy Town acoustique et mélancolique (pas de thème épique — une ville ordinaire qui souffre) · zones élémentaires orchestral + synthétique · boss à thème unique · fin *Restore* belle et lacunaire · fin *Erase* silence progressif, puis le vide.

---

## 9. MOTS-CLÉS

```
sacrifice · identité · perte · dieux brisés · monde qui meurt
lumière ternissante · douleur sans méchanceté · héros sans mémoire
dilemme moral · victoire pyrrhique

Chrono Trigger · Pokémon (exploration) · Frieren (ton)
Alabaster Dawn (gamefeel, HUD) · SAO (barres, craft par artisan)
Vampire Survivors (orbes) · Diablo / PoE (loot)
Wizard of Legend (piste roguelite — à l'étude)
```

---

## 10. HISTORIQUE — d'où vient le projet

À conserver : ça explique des choix qu'on ne comprend plus sans contexte, et ça évite de reproposer ce qui a déjà été rejeté.

| Époque | Ce qui a changé |
|---|---|
| Conception | Action-RPG narratif, 6 raretés, loot simple. 800×600. Press Start 2P + Verdana. |
| — | **Isométrique / 2.5D tenté puis REJETÉ** visuellement. Ne pas reproposer. |
| — | Le loot devient un vrai ARPG : MYTHIC apparaît, les substats passent à 1-7, la **Résonance** est créée. C'est là que le jeu a le plus dérivé de son intention initiale. |
| — | Génération de masse : +392 items, +139 ennemis. Le contenu écrit à la main devient minoritaire en nombre. |
| — | Passe UI/UX complète : canvas 960×720, police **Neatpixels**, `fitText`, virtualisation de l'inventaire. |
| — | i18n FR/EN complet, Arsenal et Bestiaire, recherche. |
| 07/2026 | Le créateur envisage le **virage roguelite** (§6). |

---

*Référence vivante. **Ce fichier a menti pendant des mois** — il décrivait 6 raretés quand il y en avait 7, 800×600 quand le canvas faisait 960×720, et ignorait la Résonance. Un document qui ment coûte plus cher qu'un document absent : chaque agent qui le lit part avec une carte fausse. **Le mettre à jour fait partie de toute tâche qui change le jeu.***
