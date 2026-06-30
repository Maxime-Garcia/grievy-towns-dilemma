# MUSIC — Grievy Town's Dilemma
## Catalogue de musiques à destination du Compositeur / Sound Designer

---

## INTRODUCTION : VISION MUSICALE DU JEU

### Contexte narratif

**Grievy Town's Dilemma** est un jeu de sacrifice. Chaque zone est une divinité en souffrance. Chaque victoire du joueur est une perte pour le monde. La musique doit incarner ce paradoxe : elle est belle et oppressante à la fois, héroïque et mélancolique sans jamais basculer dans l'un ou l'autre.

Le monde de Velmara se désature visuellement à mesure que les divinités meurent. La musique doit idéalement proposer des variations dégradées (versions désaturées, appauvries en couches) pour accompagner ce système. Si les ressources ne le permettent pas, prévoir au minimum un filtre low-pass applicable en runtime via Phaser.

### Références musicales (par ordre d'importance)

**1. Chrono Trigger (Yasunori Mitsuda) — référence principale**
Mitsuda crée des émotions durables avec une économie de moyens remarquable. Ses thèmes sont courts mais denses, avec une mélodie immédiatement identifiable sur un arrangement sobre. La basse est organique, les cordes jouent un rôle fondamental. Les thèmes de zones respirent — il y a du silence entre les phrases.

Ce que GTD doit emprunter : la capacité à rendre une zone reconnaissable avec 2-3 motifs musicaux, le mélange d'acoustique et de synthèse légère, la retenue émotionnelle.

**2. Dark Souls / Elden Ring (Motoi Sakuraba, Yuka Kitamura) — pour les boss**
Les thèmes de boss de Dark Souls ne sont pas des morceaux "épiques" au sens hollywoodien. Ce sont des œuvres qui jouent avec la tension et le relâchement, avec des chœurs qui ne chantent pas la victoire mais quelque chose de plus ambigu — une lamentation, une urgence, une question sans réponse.

Ce que GTD doit emprunter : la tension harmonique des thèmes de boss, l'utilisation des chœurs comme texture plutôt que comme mélodie principale, la capacité à rendre un boss tragique plutôt que menaçant.

**3. Vampire Survivors (Filippo Beck) — pour les zones de combat**
Vampire Survivors a compris que la musique de jeu à répétitions doit être : accrocheuse sur la première écoute, pas fatigante sur la centième. Ses thèmes sont simples, rythmiquement entêtants, jamais sur-arrangés.

Ce que GTD doit emprunter : l'efficacité mélodique, le rythme qui soutient le gameplay sans le dominer, la possibilité d'écouter la musique pendant 30+ minutes sans en avoir marre.

**4. Frieren: Beyond Journey's End (Evan Call) — pour Grievy Town et les fins**
L'anime Frieren utilise la musique de manière ultra-parcimonieuse — le silence porte autant que les notes. Quand la musique arrive, elle est immédiatement émotionnellement chargée parce qu'elle ne joue pas en permanence.

Ce que GTD doit emprunter : savoir quand ne pas jouer, la retenue des arrangements (cordes seules, luth seul, piano seul), la beauté mélancolique du thème principal.

### Palette d'instruments globale

**Acoustique (organicité, ancrage dans le monde)** : cordes (violons, altos, violoncelles), guitare acoustique / luth médiéval, harpe, flûte traversière, hautbois / cor anglais, piano ou clavecin, percussions organiques (tambours en peau, cloche)

**Synthèse légère (magie, élémentaire)** : pad synthétique très discret, effets de résonance numérique sur les instruments acoustiques, reverb de grotte ou d'espace ouvert selon la zone

**À éviter** : metal / heavy guitar (sauf si usage spécifique et sobre), EDM/électro, orchestration hollywoodienne gonflée (trop de cuivres héroïques), tout ce qui sonne "fantasy générique"

### Tempo général

- Grievy Town, routes : 70–90 BPM, mesures à 3/4 ou 4/4
- Zones de combat : 100–130 BPM selon l'urgence de la zone
- Boss : variable, souvent temps fort/temps faible, rythme organique qui ne suit pas une grille rigide
- Fins : pas de tempo fixe, libre

### Format de livraison

Format : `.ogg`, stéréo, 44.1 kHz, -9 dBFS RMS pour les boucles de gameplay (les boss peuvent être plus forts).

Toutes les boucles de jeu doivent être **seamless** (boucle sans rupture audible).

---

## MUSIQUES D'INTERFACE

### Menu Principal

**Fichier :** `music_main_menu.ogg`

**Mood :** Mélancolique, contemplatif, porteur de promesse. Le joueur voit le titre du jeu — il ne sait pas encore ce qui l'attend. La musique doit donner envie de commencer tout en installant le ton.

**Durée boucle :** 60–90 secondes

**Instruments suggérés :** Luth ou guitare acoustique en finger-picking, cordes légères en arrière-plan, peut-être une flûte qui entre à mi-chemin. Pas de percussion marquée.

**Notes compositeur :** Le thème principal du jeu devrait apparaître ici. Ce thème — appelons-le "Le Thème de Velmara" — reviendra dans les fins, dans les moments de boss et dans les crédits. C'est la mélodie que le joueur emmène avec lui.

---

### Écran de Game Over

**Fichier :** `music_game_over.ogg`

**Mood :** Pas de défaite triomphante. Le héros mourra souvent. Ce doit être sobre, un peu triste, pas punitif.

**Durée :** 8–15 secondes, pas de boucle (ou boucle très longue et statique si nécessaire techniquement)

**Instruments suggérés :** Quelques notes de piano ou de luth seul. Une phrase musicale incomplète.

---

### Écran de Victoire (fin de boss, quête)

**Fichier :** `music_victory.ogg`

**Mood :** Ambigu. Le joueur a gagné mais une divinité est morte. Pas de fanfare triomphante. Quelques notes satisfaisantes mais avec une couleur triste en dessous.

**Durée :** 5–10 secondes

**Instruments suggérés :** Cordes montantes puis une note tenue grave. Ou le thème de Velmara en mineur.

---

## GRIEVY TOWN (Hub principal)

**Fichier :** `music_grievy_town.ogg`

**Contexte :** Grievy Town est le centre du monde. C'est là que le héros commence, revient après chaque zone, et finit par se retrouver seul quand les habitants partent. La musique évolue avec la dégradation du monde.

**Mood :** Chaleureux mais vulnérable. C'est une vraie ville avec de vraies personnes qui ont peur. La musique doit donner envie d'y rester, tout en portant l'inquiétude.

**Durée boucle :** 90–120 secondes

**Instruments suggérés :** Luth/guitare acoustique en avant-plan, violoncelle doux, quelques notes de hautbois ou de flûte à intervalles. Rythme paisible, 3/4 ou 4/4 à 70–80 BPM.

**Variations — dégradation :**
- `music_grievy_town_3bosses.ogg` : Même mélodie principale, mais les couches de fond s'appauvrissent. Moins d'instruments. La flûte disparaît.
- `music_grievy_town_6bosses.ogg` : Seulement le luth, à peine joué. Quelques notes espacées. Presque le silence.

**Lien narratif :** Alderich (le mentor) dit "You look better than when I found you. That's something." Ce thème devrait avoir ce ton — chaleureux, direct, légèrement abîmé.

---

### Intérieurs de Grievy Town

**Fichier :** `music_grievy_interior.ogg`

**Contexte :** Utilisé dans les maisons, l'auberge, la chapelle. Variante plus douce et intime du thème de Grievy Town.

**Mood :** Refuge. Quand le joueur entre dans l'auberge de Liria ou chez Aldric, il est en sécurité.

**Durée boucle :** 60–90 secondes

**Instruments suggérés :** Piano très doux ou clavecin, peut-être luth seul. Pas de percussions. Volume général plus bas que la musique extérieure.

---

## ZONES DE ROUTE (Transitions)

Les six routes relient Grievy Town à chaque zone de combat. Elles ont une identité propre mais partagent une même famille musicale — "le voyage". Elles peuvent partager des **stems** (couches) avec les zones voisines : une route vers Ignis Reach pourrait avoir le stem de Grievy Town en couche inférieure et le stem de feu en couche supérieure qui monte progressivement.

---

### Route des Braises — `music_route_ember_road.ogg`

**Lien :** Grievy Town ↔ Ignis Reach

**Mood :** La chaleur commence à se faire sentir. La musique de Grievy Town s'estompe, les cordes deviennent plus tendues, un bourdonnement grave apparaît. La route est une menace qui monte.

**Durée boucle :** 60s

**Instruments suggérés :** Cordes frottées légèrement dissonantes, percussions douces qui commencent à battre, bourdonnement grave de type bourdon (drone). La mélodie de Grievy Town apparaît en sourdine avant de s'effacer.

**Partage de stems :** Peut partager le stem de basses avec `music_ignis_reach.ogg`.

---

### Chemin de Pierre — `music_route_stone_path.ogg`

**Lien :** Grievy Town ↔ Terravast

**Mood :** Descente progressive. La lumière diminue. La terre devient plus lourde à mesure qu'on approche des cavernes. Musique cave-like, résonante.

**Durée boucle :** 60s

**Instruments suggérés :** Percussions sourdes (caisse en peau, pas de métal), violoncelle dans le grave, écho artificiel qui s'allonge. La flûte de Grievy Town s'éteint dans les premiers bars.

---

### Sentier de Zephyr — `music_route_zephyr_trail.ogg`

**Lien :** Grievy Town ↔ Zephyr Peaks

**Mood :** Ascension. Le vent commence. La musique devient plus aérienne, plus légère, plus fragile. Le danger est dans la beauté.

**Durée boucle :** 60s

**Instruments suggérés :** Flûte traversière (légèreté), cordes qui montent en registre, vent simulé en arrière-plan sonore (ambiance fondue dans la musique). Progressivement plus rapide.

---

### Route Côtière — `music_route_coastal_road.ogg`

**Lien :** Grievy Town ↔ Abyssmar

**Mood :** La mer est là mais elle est menaçante. La route longe une falaise avec des débris de navires. Mélancolique et légèrement inquiétant.

**Durée boucle :** 60s

**Instruments suggérés :** Cor anglais (son marin, nostalgique), cordes basses, quelques notes de harpe. Rythme legato, peu de percussions.

---

### Col du Tonnerre — `music_route_thunder_pass.ogg`

**Lien :** Grievy Town ↔ Volterra

**Mood :** Un col abandonné avec des câbles électriques qui crépitent. Tension industrielle, espace mort, danger latent.

**Durée boucle :** 60s

**Instruments suggérés :** Cordes tendues avec harmoniques, bourdonnement électronique très bas (comme un câble sous tension), percussions métalliques très espacées.

---

### Voie Glaciale — `music_route_frost_way.ogg`

**Lien :** Grievy Town ↔ Glaciem

**Mood :** Une vieille route commerciale maintenant ensevelie sous le givre. Des charrettes abandonnées. Beauté froide et triste.

**Durée boucle :** 60s

**Instruments suggérés :** Piano en touches espacées, sons cristallins de clochettes ou glockenspiel très discrets, cordes légères qui s'amenuisent. Peu de notes, beaucoup de silence.

---

## ZONES DE COMBAT

### Ignis Reach (Feu)

**Fichier :** `music_ignis_reach.ogg`

**Contexte :** Montagnes volcaniques, lave, cendres, Pyrath le dragon qui n'est plus lui-même. C'était un lieu de pèlerinage et de guérison. C'est maintenant un enfer.

**Mood :** Urgence et chaleur oppressante. Pas de majesté heroïque — quelque chose qui brûle sans raison. La musique doit éviter la "cool fire music" habituelle des JRPGs.

**Durée boucle :** 90–120 secondes

**BPM :** 115–125

**Instruments suggérés :** Cordes agitées (ostinato de cordes), percussions tribales (peaux, pas de batterie), bourdonnement de basses très grave (comme la montagne qui gronde), quelques notes de cuivres dissonantes. Le thème mélodique est en mode phrygien ou dorien — modal, pas tonal "heroïque".

**Variations dégradée :** `music_ignis_reach_degraded.ogg` — une fois Pyrath tué, la zone devient plus calme mais désaturée. Même thème en version appauvrie, filtre passe-bas.

---

### Terravast (Terre)

**Fichier :** `music_terravast.ogg`

**Contexte :** Cavernes profondes bioluminescentes, cristaux, ruines anciennes. Gorvun était une permanence calme. Il tremble maintenant sans s'arrêter.

**Mood :** Souterrain, mystérieux, légèrement menaçant mais pas de panique. Les cristaux donnent une teinte presque étrange et belle à l'horreur.

**Durée boucle :** 90–120 secondes

**BPM :** 95–110

**Instruments suggérés :** Percussions sourdes et profondes (taiko bas, frame drums), cordes basses en ostinato, gong ou bol tibétain pour les cristaux, lignes mélodiques au violoncelle. Écho long, réverbération de caverne artificielle.

---

### Zephyr Peaks (Vent)

**Fichier :** `music_zephyr_peaks.ogg`

**Contexte :** Îles flottantes, ponts de ciel, chutes d'eau qui remontent. Sylvael était une lumière douce. Elle est devenue un ouragan.

**Mood :** Hauteur vertigineuse, beauté dangereuse. La musique doit donner le sentiment d'être très haut, exposé, avec quelque chose d'incroyablement beau autour de soi et qui veut vous tuer.

**Durée boucle :** 90–120 secondes

**BPM :** 110–130

**Instruments suggérés :** Flûte en premier plan (mélodie aérienne), cordes légères et rapides (figuration de vent), harpe en arpèges montants, percussions légères à contretemps. Le thème est en mode lydien — lumineux mais instable.

---

### Abyssmar (Eau)

**Fichier :** `music_abyssmar.ogg`

**Contexte :** Ruines côtières inondées, cathédrales sous l'eau, bioluminescence, Thalymor le léviathan qui noie tout.

**Mood :** Pression abyssale. La beauté de ce qui était et la destruction de ce qui est. Quelque chose de bleu, de profond, de dense.

**Durée boucle :** 90–120 secondes

**BPM :** 90–105 (plus lent que les autres — l'eau ralentit tout)

**Instruments suggérés :** Cor anglais ou hautbois grave, cordes basses en pizzicato (simulation de bulle d'eau), harpe très présente, reverb aquatique artificielle sur toute la production. La mélodie doit sonner comme quelque chose qu'on entend de sous l'eau — déformée, belle, triste.

---

### Volterra (Foudre)

**Fichier :** `music_volterra.ogg`

**Contexte :** Plaines dévastées, machines mortes, grille électrique folle, Volkran le colosse de foudre qui détruit ce que ses ingénieurs ont construit.

**Mood :** Technologie en ruines. Quelque chose d'industriel mort. La musique doit avoir un côté mécanique — comme une machine qui tourne mais dont les rouages sont brisés.

**Durée boucle :** 90–120 secondes

**BPM :** 120–135

**Instruments suggérés :** Cordes en ostinato rapide et répétitif (mécanique), percussions métalliques (cymbales, etc.), synthèse électronique très sobre (pas d'électro — juste un bourdon technologique), moments de silence brisés par des percussions soudaines. Rythme asymétrique ou en 5/4 pour simuler quelque chose de dérégulé.

---

### Glaciem (Glace)

**Fichier :** `music_glaciem.ogg`

**Contexte :** Toundra gelée, archives de glace, Crysthea l'ancienne déesse de la préservation qui gèle tout sans discrimination.

**Mood :** Silence dense, beauté froide, profondeur du temps. C'est la zone la plus vieille, celle qui contient le plus de mémoire. La musique doit sonner comme quelque chose d'ancien et de perdu.

**Durée boucle :** 90–120 secondes

**BPM :** 75–90

**Instruments suggérés :** Piano en touches espacées (cristal de glace), sons de cristaux (glockenspiel, vibraphone), cordes très légères et hautes, silence entre les phrases. La mélodie est en mode aeolien (naturellement mélancolique). Très peu d'éléments simultanément.

---

### Malachar's Spire (Ombre)

**Fichier :** `music_malachars_spire.ogg`

**Contexte :** La tour de Malachar, bâtie sur trente ans dans l'indifférence des habitants de Grievy Town. Ruines corrompues. Zone finale (hors boss).

**Mood :** Oppressant, quasi-silencieux, vide de magie. Cette zone n'est pas impressionnante — elle est triste. Un homme a construit tout ça et personne n'a demandé pourquoi.

**Durée boucle :** 90–120 secondes (peut être plus longue — le joueur passe du temps ici)

**BPM :** Très variable, quasi-libre. Quelque chose d'atonale ou de très libre harmoniquement.

**Instruments suggérés :** Cordes en harmoniques (sons de "bow pressure" très aigus et fragiles), bourdonnement très grave quasi-inaudible, notes de piano isolées très espacées, beaucoup de silence. Aucune mélodie reconnaissable — juste une atmosphère de vide peuplé.

---

## THÈMES DE BOSS

Chaque boss est une divinité brisée. Les thèmes ne doivent pas être de la musique de "méchant" mais de la musique de "quelque chose de grand qui souffre". Les joueurs doivent ressentir de la pitié autant que de l'urgence.

**Structure suggérée pour les thèmes de boss :**
- Intro (10–15s) : annonce, tension montante
- Phase 1 : tension soutenue, mélodie reconnaissable
- Phase 2 : escalade, plus de percussions, chœurs si possible
- Phase 3 (Malachar uniquement) : rupture totale, chaos contrôlé
- Finale (10–15s) : résolution amère après la mort du boss

---

### Pyrath the Unbound

**Fichier :** `music_boss_pyrath.ogg`

**Description du boss :** Premier dragon de Velmara. Il ne reconnaît plus personne. Il brûle.

**Mood musical :** Puissance brute et douleur. Un être de feu pur qui ne peut plus se contrôler. La musique doit être intense mais pas vulgairement héroïque.

**Durée :** 3–5 minutes (boucle de phase, transitions marquées)

**Instruments :** Orchestre de cordes en ostinato rapide, percussions tribales intenses (peaux), cuivres dissonants, bourdonnement de basses. Chœurs possibles mais texto latin ou syllabique — pas de paroles lisibles.

**Motif mélodique :** Un motif de 4 notes, chromatique, descendant. Répété et transformé. C'est le thème de Pyrath — ce qu'il était avant la malédiction, maintenant méconnaissable.

---

### Gorvun the Trembling

**Fichier :** `music_boss_gorvun.ogg`

**Description du boss :** Titan de pierre qui n'a pas bougé en trois siècles et ne peut plus s'arrêter.

**Mood musical :** Implacable, lourd, inexorable. La musique doit sembler aussi lourde que le boss.

**Durée :** 3–5 minutes

**Instruments :** Percussions très graves (taiko, grosse caisse), cordes basses en octaves, tuba ou contrebasson en bourdonnement continu. Peu de registre aigu. La mélodie est dans le grave.

**Motif :** 5 notes en croches régulières, comme des pas de géant, qui ne s'accélèrent jamais mais deviennent plus denses.

---

### Sylvael the Tempest

**Fichier :** `music_boss_sylvael.ogg`

**Description du boss :** Phénix de lumière douce devenu hurricane incontrôlable.

**Mood musical :** Vertigineux, rapide, presque beau. La plus dynamique des musiques de boss.

**Durée :** 3–5 minutes

**Instruments :** Cordes en pizzicato rapide, flûtes en staccato, percussions légères et rapides, piano en gammes ascendantes. Vitesse élevée — 130+ BPM en phase 2.

**Motif :** Deux notes en tierces alternées, très rapides — comme le battement d'ailes. Ce motif accélère en phase 2 jusqu'à presque se fondre dans le tissu orchestral.

---

### Thalymor the Deluge

**Fichier :** `music_boss_thalymor.ogg`

**Description du boss :** Léviathan qui remplit tout d'eau sans discrimination.

**Mood musical :** Oppressant, profond, comme être sous l'eau et ressentir la pression augmenter.

**Durée :** 3–5 minutes

**Instruments :** Cor anglais et cordes basses, harpe en arpèges plongeants, reverb très longue sur tout. Chœurs en "ah" très graves. BPM plus lent que les autres boss (95–105) — la résistance de l'eau.

**Motif :** Une ligne de basse qui monte puis plonge, répétée. Symbolise la marée.

---

### Volkran the Stormbringer

**Fichier :** `music_boss_volkran.ogg`

**Description du boss :** Colosse de foudre dirigée devenu catastrophe électromagnétique.

**Mood musical :** Brutal, mécanique, inexorable. Quelque chose qui était de la précision et est devenu du chaos.

**Durée :** 3–5 minutes

**Instruments :** Cordes en ostinato très rapide (+ 140 BPM en phase 2), percussions métalliques, synthèse électronique ponctuelle (arcs), cuivres en staccato.

**Motif :** Répétition en quintes vides — dissonant et décalé. En phase 2, ce motif se brise et devient irrégulier.

---

### Crysthea the Frozen

**Fichier :** `music_boss_crysthea.ogg`

**Description du boss :** Déesse la plus ancienne, qui préservait la mémoire du monde, maintenant prisonnière de sa propre magie.

**Mood musical :** Le plus émotionnellement complexe des boss. Elle est ancienne, elle se souvient de tout, elle est brisée par quelque chose qu'elle n'a pas choisi. La musique doit être la plus "triste" des musiques de boss — un chef-d'œuvre de préservation qui tourne sur lui-même.

**Durée :** 3–5 minutes

**Instruments :** Piano en avant-plan (mélodie principale), cordes en harmoniques, glockenspiel et vibraphone, chœurs très fins en registre aigu. Contraste extrême entre les silences et les moments intenses.

**Motif :** Le thème de Velmara (le thème principal du jeu) joué en mode mineur, fragmenté. Le joueur reconnaît quelque chose de familier dans ce combat.

---

### Malachar the Unbound — 3 phases

**Fichier :** `music_boss_malachar.ogg` (ou 3 fichiers séparés : `_phase1`, `_phase2`, `_phase3`)

**Description du boss :** Un homme. Un érudit. Trente ans de travail. Il n'est pas fou — il est convaincu.

**Mood musical phase 1 :** Tension intellectuelle. Quelque chose de contrôlé, presque de l'orgueil calme. La musique de phase 1 est la plus "froide" des musiques de boss — Malachar est en contrôle.

**Mood musical phase 2 :** Il commence à sentir que quelque chose lui résiste. Les six éléments qu'il contrôle commencent à se mélanger de façon chaotique. Les thèmes de zone apparaissent en fragments — Pyrath, Gorvun, Sylvael — qui se heurtent.

**Mood musical phase 3 :** Il lâche tout. C'est la réponse musicale la plus intense du jeu, mais elle n'est pas triomphante — c'est la libération désespérée d'un homme qui n'a plus rien à perdre.

**Finale :** Quand Malachar meurt, la musique ne s'arrête pas brutalement. Elle se dissout lentement en quelques notes — le thème de Grievy Town, pianissimo. Il était de là.

**Durée :** 6–10 minutes total (phases combinées)

**Instruments phase 1 :** Cordes en pizzicato précis, piano en contrepoints — mécanique, mathématique.

**Instruments phase 2 :** Tous les instruments des six zones en conflit — fragments du thème de feu sur des cordes de glace, etc. Dissonance calculée.

**Instruments phase 3 :** Tout l'orchestre, chœurs, percussions maximum. Puis dissolution vers le silence.

---

## MUSIQUES DE FIN

### Fin "Restore"

**Fichier :** `music_ending_restore.ogg`

**Contexte :** Le héros sacrifie ses pouvoirs divins pour ressusciter les six divinités et rendre la magie au monde. Il redevient humain. Il retourne à Grievy Town.

**Mood :** Bittersweet. Quelque chose est gagné. Quelque chose d'immense est perdu. Le monde est sauvé mais le héros ne sera jamais ce qu'il était. C'est la fin la plus mélancolique du jeu — et c'est la plus belle.

**Durée :** 3–5 minutes (long, narratif — accompagne une séquence de fin)

**Structure :** Commence par le silence de Malachar. Puis, très doucement, une note de luth. Le thème de Velmara, entier, pour la première fois dans le jeu. Les six thèmes de zone s'y tissent progressivement, chacun retrouvant sa couleur. Les cordes arrivent. C'est doux. C'est presque insupportable de beauté.

---

### Fin "Erase"

**Fichier :** `music_ending_erase.ogg`

**Contexte :** Le héros efface Velmara. Tout. Un monde qui souffrait trop. Ou de la fierté. Le jeu ne juge pas.

**Mood :** Le silence progressif. La musique n'arrive pas — elle disparaît. Ce que le joueur entend, c'est ce qui reste une fois que tout s'en va.

**Durée :** 3–5 minutes

**Structure :** Commence avec le thème de Velmara complet. Puis, une à une, les couches disparaissent. Chaque instrument s'éteint. Les couleurs harmoniques s'appauvrissent. À la fin, une seule note très basse, seule, puis le silence absolu. Puis, très doucement, dans le silence — les premières notes du New Game+. Un écho.

---

### New Game+ (Après "Erase")

**Fichier :** `music_new_game_plus.ogg`

**Contexte :** Le monde se reconstruit. Mais le joueur qui a connu le run précédent reconnaît des "échos" dans le lore.

**Mood :** Familier mais décalé. Le thème de Grievy Town, mais légèrement différent — une note changée, un tempo légèrement plus rapide, quelque chose qui n'est pas tout à fait juste. Le monde se souvient vaguement.

**Durée boucle :** Peut être identique à `music_grievy_town.ogg` avec variation subtile

---

## TABLEAU RÉCAPITULATIF — FICHIERS À LIVRER

| Fichier | Durée | Priorité |
|---------|-------|----------|
| `music_main_menu.ogg` | 60–90s boucle | P1 |
| `music_game_over.ogg` | 10–15s | P1 |
| `music_victory.ogg` | 5–10s | P2 |
| `music_grievy_town.ogg` | 90–120s boucle | P1 |
| `music_grievy_town_3bosses.ogg` | 90–120s boucle | P2 |
| `music_grievy_town_6bosses.ogg` | 90–120s boucle | P3 |
| `music_grievy_interior.ogg` | 60–90s boucle | P3 |
| `music_route_ember_road.ogg` | 60s boucle | P2 |
| `music_route_stone_path.ogg` | 60s boucle | P2 |
| `music_route_zephyr_trail.ogg` | 60s boucle | P2 |
| `music_route_coastal_road.ogg` | 60s boucle | P2 |
| `music_route_thunder_pass.ogg` | 60s boucle | P2 |
| `music_route_frost_way.ogg` | 60s boucle | P2 |
| `music_ignis_reach.ogg` | 90–120s boucle | P1 |
| `music_ignis_reach_degraded.ogg` | 90–120s boucle | P3 |
| `music_terravast.ogg` | 90–120s boucle | P1 |
| `music_zephyr_peaks.ogg` | 90–120s boucle | P1 |
| `music_abyssmar.ogg` | 90–120s boucle | P1 |
| `music_volterra.ogg` | 90–120s boucle | P1 |
| `music_glaciem.ogg` | 90–120s boucle | P1 |
| `music_malachars_spire.ogg` | 90–120s boucle | P1 |
| `music_boss_pyrath.ogg` | 3–5min | P1 |
| `music_boss_gorvun.ogg` | 3–5min | P1 |
| `music_boss_sylvael.ogg` | 3–5min | P1 |
| `music_boss_thalymor.ogg` | 3–5min | P1 |
| `music_boss_volkran.ogg` | 3–5min | P1 |
| `music_boss_crysthea.ogg` | 3–5min | P1 |
| `music_boss_malachar.ogg` | 6–10min | P1 |
| `music_ending_restore.ogg` | 3–5min | P1 |
| `music_ending_erase.ogg` | 3–5min | P1 |
| `music_new_game_plus.ogg` | 90–120s boucle | P2 |

**P1 = requis pour une version jouable complète**
**P2 = requis pour une expérience complète**
**P3 = polish et nuance supplémentaires**
