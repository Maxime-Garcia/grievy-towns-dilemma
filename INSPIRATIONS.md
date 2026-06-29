# Inspirations — Grievy Town's Dilemma

> **Usage agents :** Ce fichier est la référence thématique du projet. Tout contenu créé (zones, ennemis, NPCs, dialogues, skills, items, assets, effets visuels, sons) doit être cohérent avec ces inspirations. Consultez ce document avant de générer du contenu ou du code de gamefeel.

---

## 1. STYLE VISUEL

### Référence principale : Pokémon Gen 3/4 + Chrono Trigger (SNES)
- **Vue :** Top-down 2D, caméra fixe sur le joueur, pas d'isométrique
- **Résolution logique :** 800×600 px, canvas centré, rendu pixelisé (`image-rendering: pixelated`)
- **Palette :** 16 couleurs max par sprite/tile, hard pixel edges, **zéro anti-aliasing**
- **Taille des sprites :** 32×32 px joueur/ennemis/NPCs, 64×64 px bosses, 48×48 px divinités
- **Taille des tiles :** 16×16 px, assemblés en tilesets
- **Style général :** Chrono Trigger (SNES) — lisibilité de silhouette absolue, chaque créature reconnaissable en un coup d'œil même à 32×32
- **Ton visuel :** Medieval Fantasy (Frieren) — pas enfantin malgré le pixel art. Couleurs sombres et saturées, ambiances oppressantes par zone.
- **Carte du monde :** Style Pokémon — une map vue du ciel avec les zones reliées par des routes, le joueur se déplace dessus

### Palettes par zone
| Zone | Couleurs dominantes |
|------|---------------------|
| Grievy Town | Brun chaud, beige, gris pierre médiéval |
| Ignis Reach | Rouge, orange, noir obsidienne, reflets de lave |
| Terravast | Brun sombre, gris caverne, bleu cristal bioluminescent |
| Zephyr Peaks | Bleu ciel pâle, blanc nuage, or céleste |
| Abyssmar | Bleu nuit profond, teal, reflets bioluminescents cyan |
| Volterra | Violet sombre, gris métal, jaune électrique |
| Glaciem | Blanc neige, bleu glace, argent givré |
| Malachar's Spire | Noir quasi-absolu, violet fantôme, fissures lumineuses |

---

## 2. INTERFACE & HUD

### Références : Sword Art Online (l'anime) + Alabaster Dawn

#### Alabaster Dawn — référence HUD principale
Alabaster Dawn (Radical Fish Games, 2026) est la référence esthétique de l'interface. Son HUD est pensé pour un combat rapide et lisible :
- Interface intégrée à l'univers médiéval fantasy — jamais générique, jamais tech/sci-fi
- Barres de vie claires mais **discrètes** : elles ne gênent pas la lecture de l'action en cours
- Chaque élément d'interface a une raison d'être visible — rien n'est affiché en permanence si ce n'est pas utile en combat
- Style pixel rétro avec personnalité — pas du HUD placeholder, du design d'UI cohérent avec le monde

#### SAO — référence pour les barres de vie
- **Barre HP :** Horizontale, dégradé progressif — **vert** (>50%) → **orange** (<50%) → **rouge** (<25%) avec surlignage lumineux
- **Barre MP :** Bleue uniforme avec surlignage
- **Barre XP :** Violette en bas d'écran
- **Style général :** Propre, sobre, pas encombrant — minimaliste et lisible en combat rapide

#### Notifications
- File de notifications montantes (level-up, item rare, quête, zone) — courtes, percutantes, disparaissent vite
- Drop d'item : nom + rareté colorée, icône à gauche — 2 secondes max

### Polices & textes
- Style pixel rétro, lisible sur fond sombre
- Boîtes de dialogue en bas d'écran avec portrait NPC à gauche (style SNES RPG classique)

---

## 3. GAMEFEEL & EFFETS VISUELS

### Référence principale : Alabaster Dawn (Radical Fish Games, 2026)

Alabaster Dawn est la référence de gamefeel **absolue** du projet. C'est un Action RPG 2.5D pixel art du studio Radical Fish Games (CrossCode). Ce que le joueur doit ressentir dans GTD doit s'en approcher le plus possible, adapté à la vue top-down 2D.

#### Ce qui définit le gamefeel d'Alabaster Dawn
- **Poids des coups :** Chaque arme a un poids et un timing distincts — une frappe d'épée et un coup de masse ne se sentent pas pareil. L'impact est immédiat et satisfaisant, les critiques ont un effet visuel plus marqué.
- **Fluidité des animations :** 16 directions d'animation (vs 8 dans la norme) — chaque mouvement et attaque se sent précis, coulant, vivant. Les transitions entre états (idle → walk → attack) sont invisibles.
- **Le dash a de la personnalité :** Ce n'est pas juste "accélérer" — c'est une grande foulée distincte avec un suivi visuel différent. On voit que c'est un dash, pas juste du déplacement rapide.
- **Break gauge (jauge de choc ennemi) :** Frapper un ennemi remplit une jauge de stagger. Quand elle est pleine, l'ennemi est étourdi et vulnérable — ouvre une fenêtre de combo. Ce feedback donne un sentiment de progression au sein même d'un combat.
- **Combat snappy :** Pas de lag entre l'input et l'action. Le joueur ne doit jamais attendre — l'intention se traduit instantanément.
- **Influences combat :** Zelda classique (lisibilité, spatialité) + Devil May Cry/Kingdom Hearts (chaînes de combos, mobilité, changement de style).

#### Ce qu'on adapte pour GTD (top-down 2D)
- Le poids des coups via screen shake léger + flash blanc + son distinct selon l'arme
- Le dash avec micro-trainée visible (afterimage), iframes visuelles (légère transparence 0.3s)
- Les nombres de dégâts colorés par élément qui s'envolent vers le haut
- Les ennemis ont un état "stagger" visible (flash rouge / ralentissement bref) quand très touchés

---

### Référence complémentaire : Vampire Survivors (orbes d'XP)
- **Orbes d'XP :** À la mort d'un ennemi, spawn d'orbes verts magnétiques aimantés vers le joueur dans un rayon de 96px. Satisfaisant, jamais bloquant.
- **Collecte :** Overlap direct, XP attribué instantanément — le ramassage est fluide et gratifiant

---

### Effets visuels détaillés

| Événement | Effet |
|-----------|-------|
| Hit physique | Flash blanc 1 frame sur l'ennemi + chiffre blanc qui monte |
| Hit élémentaire | Flash couleur élément + chiffre coloré (feu = 0xff4400, eau = 0x2266ff, foudre = 0xffee00, glace = 0x88ddff, vent = 0xaaddff, terre = 0x88aa33) |
| Coup critique | Flash jaune + chiffre plus grand + screen shake léger |
| Dash joueur | Micro-trainée (afterimage), légère transparence 0.3s |
| Mort d'ennemi | Dissolution sprite (flash → fondu, pas de ragdoll) |
| Mort de boss | Séquence plus longue — aura qui s'effondre, fondu lent |
| Entrée de boss | Annonce du nom en grand à l'écran, aura distinctive |
| Zone dégradée | Désaturation progressive des couleurs (divinité tuée) |

### Transitions & monde
- **Transitions de zone :** Fondu au noir propre (FADE_OUT_COMPLETE event Phaser)
- **Dégradation du monde :** À mesure que les divinités meurent, les zones complétées se désaturent visuellement — le monde perd ses couleurs, perd sa magie

### Principes gamefeel
- Chaque action du joueur doit avoir un retour immédiat (son, flash, ou animation) — jamais de silence
- La mort d'un boss est un moment — prendre le temps, ne pas juste despawn
- La satisfaction vient autant du feedback que des chiffres

---

## 4. GAMEPLAY & MÉCANIQUES

### Références mélangées
- **Exploration :** Pokémon Gen 3/4 — carte du monde visible, zones connectées par des routes avec ennemis, villes de repos entre les zones de combat
- **Craft :** Sword Art Online — le joueur collecte des matériaux dans les zones et les **rapporte à un artisan** (Forgeron/Alchimiste/Costumier). Pas d'auto-craft, pas de menu flottant. L'artisan a ses recettes, le joueur lui apporte les ingrédients. Sentiment de dépendance aux NPCs.
- **Dash :** Cooldown 1.5s, 0.3s d'iframes — mobile mais pas broken
- **Skills :** 4 slots équipés (AZERTY : A/E/R/F), déblocage par zone — le joueur choisit sa build
- **Pity system loot :** 250 kills → Epic garanti, 500 kills → Legendary garanti (évite la frustration infinie)
- **Regen hors-combat :** Timestamp-based (une fois toutes les 2s), jamais frame-based

### Système de loot & items — ARPG (Diablo / Path of Exile influence)

> **Différenciation d'Alabaster Dawn :** Alabaster Dawn utilise un système de gems avec slots fixes et pas de loot aléatoire. GTD choisit l'approche ARPG classique : **drops aléatoires avec raretés, stats principales fixes, substats aléatoires.**

#### Raretés (du plus commun au plus rare)
| Rareté | Couleur | Substats | Drops |
|--------|---------|----------|-------|
| Common | Gris | 0 | Fréquent |
| Uncommon | Vert | 1 | Commun |
| Rare | Bleu | 2 | Peu fréquent |
| Epic | Violet | 3 | Rare |
| Legendary | Orange/Doré | 4 | Très rare |
| Hidden | Rouge/Noir | Passif unique | Exceptionnel |

#### Stats principales (Main stat)
- Fixées par le **type d'item** (arme → ATK, armure → DEF, accessoire → HP ou stats hybrides)
- Scalent avec la rareté (un Epic a une valeur de main stat plus haute qu'un Rare du même type)

#### Substats aléatoires
- Tirées d'un pool par type d'item au moment du drop
- Exemples : % critique, vitesse d'attaque, résistance élémentaire (%), regain de HP/kill, réduction de cooldown, bonus de dégâts élémentaires
- Le joueur ne sait pas quelles substats il aura avant d'identifier/ramasser l'item → tension de l'ouverture
- **La rareté détermine le nombre de substats, jamais leur qualité maximale** — un Rare peut rouler une substat parfaite

#### Affichage dans l'UI
- Nom de l'item coloré selon sa rareté dans toutes les interfaces
- Panneau d'item : nom (coloré) → main stat → ligne de séparation → substats (chaque substat sur une ligne, valeur dorée)
- Comparaison avec l'item équipé : flèches vertes/rouges pour chaque stat

### Système élémentaire
- 7 éléments : Feu, Terre, Vent, Eau, Foudre, Glace, Sombre
- Faiblesses classiques (Feu < Eau, Terre < Vent, Vent < Glace, etc.)
- **DARK est super-effectif (×1.5) contre TOUS les éléments non-DARK/DIVINE**
- NEUTRAL ne résiste à rien, ne prend pas de bonus/malus

---

## 5. NARRATION & LORE

### Références : Dragon Ball Super + Frieren (ton narratif)

#### Structure narrative
- **Ton :** Sobre, jamais grandiloquent. Le lore est dans les descriptions courtes, les dialogues directs, les petites phrases des NPCs. Style "show don't tell" — le monde parle à travers ses détails.
- **Inspiré de Frieren :** Un monde medieval fantasy où la magie et les dieux sont réels, mais présentés avec une distance humaine et mélancolique. Le monde a une histoire longue et des blessures silencieuses. Les personnages sont fatigués, pas dramatiques. La profondeur vient des détails, pas des révélations spectaculaires.
- **Aldric comme modèle de ton :** "You look better than when I found you. That's something." — voilà le style. Laconique, chaleureux, réel.

#### Révélation finale : Dragon Ball Super / Zeno
- Le héros n'est pas un humain ordinaire : c'est un **fragment du Dieu Primordial** (le "God of All"), envoyé en forme humaine quand l'équilibre a été brisé
- Comme Zeno dans DBS : puissance absolue de création ET d'effacement, mais innocence/neutralité dans la façon d'exister
- **Fin "Erase"** : effacement complet de Velmara → New Game+ — le monde se reconstruit, plus difficile, avec des échos du run précédent dans le lore
- **Fin "Restore"** : sacrifice du pouvoir divin accumulé, résurrection des 6 divinités, le héros redevient humain et rentre à Grievy Town — fin mélancolique, monde rebâti mais héros ordinaire

#### Le Dilemme central
- Chaque boss tué = une divinité **morte pour toujours**. Le monde perd sa magie.
- Chaque victoire est une perte. Le héros doit tuer les dieux pour sauver les gens des dieux.
- Les couleurs de Velmara se ternissent visuellement au fil des boss vaincus.
- Ce n'est pas un jeu où on gagne proprement. C'est un jeu de sacrifice.

#### Malachar
- Né à Grievy Town. Pas un démon — un homme, un érudit. Sa question était légitime : *pourquoi les dieux gardent-ils le pouvoir pour eux ?*
- 30 ans d'isolement, de recherche interdite. La tour était là depuis le début. Personne n'a demandé.
- Le vrai monstre du jeu c'est l'indifférence, pas Malachar lui-même.

---

## 6. AUDIO (À DÉFINIR)

> Section à compléter quand les inspirations musicales seront précisées. Pour l'instant, les clés de musique sont définies par zone (`musicKey`) mais aucun fichier audio n'est intégré.

### Pistes de travail proposées
- **Grievy Town :** Acoustique, guitare ou luth, chaleureux et mélancolique — pas de thème épique, juste une ville ordinaire qui souffre
- **Zones élémentaires :** Orchestral + synthétique par élément (cordes pour l'eau, cuivres pour le feu, percussions pour la terre, vent pour les flûtes, etc.)
- **Boss :** Montée en intensité, thème unique par divinité
- **Fin Restore :** Mélancolique, beau, lacunaire
- **Fin Erase :** Silence progressif, puis le vide

---

## 7. PERSONNAGES — PRINCIPES DE DESIGN

### NPCs
- Chaque NPC doit exister en dehors de sa fonction (ne pas être juste "le forgeron"). Il a une vie, une peur, une petite phrase qui révèle son caractère.
- Dialogues courts et directs — une révélation par échange, pas un roman.
- Jamais de NPC générique "Can I help you?" — chaque ligne doit être unique à ce personnage dans cette situation.

### Ennemis
- Chaque ennemi porte l'histoire de sa zone dans son lore (une phrase, pas plus)
- Concept de créature clairement lisible dans son comportement (chaser, patrol, ranged, summoner, charger) — le comportement IA doit refléter la personnalité de la créature
- Élites et boss ont un sentiment de poids et de présence que les ennemis normaux n'ont pas

### Divinités (Bosses)
- Avant corruption : protecteur, bienveillant, profondément lié à sa zone
- Après corruption : la même essence, mais hors de contrôle. Pas maléfique — brisé.
- Le joueur ne combat pas un ennemi. Il met fin à une souffrance.

---

## 8. MOTS-CLÉS THÉMATIQUES

Pour guider toute création de contenu :

```
sacrifice · identité · perte · dieux brisés · monde qui meurt
lumière ternissante · douleur sans méchanceté · héros sans mémoire
dilemme moral · victoire pyrrhique · dernier survivant
pixel art medieval fantasy · Chrono Trigger · SAO · Vampire Survivors
Pokémon · Dragon Ball Super · Frieren (ton narratif)
Alabaster Dawn (gamefeel · HUD) · ARPG loot (Diablo/PoE)
```

---

*Ce fichier est une référence vivante — il doit être mis à jour quand de nouvelles inspirations sont mentionnées par le créateur du projet.*
