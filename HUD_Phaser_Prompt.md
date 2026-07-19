# Prompt Claude Code — HUD Vie / Mana / Shield (variante 1C angulaire)

> À coller tel quel à Claude Code. Reproduire EXACTEMENT le HUD validé (réf : `HUD Vie-Mana.dc.html`, option 1C) comme overlay Phaser 3 réutilisable, sur **fond transparent** (pas de cadre : le panneau sombre de la démo n'est qu'un fond de preview). ⚙️ Invoque mes agents Phaser / UI.

## Contexte
- Action-RPG top-down pixel art, univers Frieren sombre. `pixelArt:true`, `roundPixels:true`, zoom entier.
- HUD ancré en **haut-gauche** de l'écran, dans une **UIScene** dédiée (ou un `Container` avec `setScrollFactor(0)`), au-dessus du gameplay. Fond 100 % transparent.
- Le jeu n'a que **Vie (HP)** et **Mana (MP)** ; le joueur peut aussi gagner du **Shield** (bouclier temporaire).
- Marge : la gemme est un losange (carré tourné à 45°) dont la boîte englobante déborde d'env. 14 px — prévoir ~16 px de marge autour du HUD pour ne pas la rogner.
- Polices pixel : `Silkscreen` (nom, niveau, labels, chiffres) et `Pixelify Sans` (secondaire). En Phaser, utiliser des `BitmapText` (fontes pixel équivalentes) ou WebFont + NEAREST.

## Composition 1C (de gauche à droite)
1. **Gemme de niveau** : carré 60×60 tourné 45°, coin arrondi ~10px, dégradé `#25304c→#111827`, bord `2px #e2b24e`, **halo doré pulsé** (glow qui respire, ~3 s). Numéro de **niveau** au centre, redressé (contre-rotation), `Silkscreen 18px #f2c65a`, ombre `#0a0d16`.
2. **Colonne droite** :
   - **Nom** du personnage : `Silkscreen 17px #eef2ff`, letter-spacing léger.
   - **Barre HP** (hauteur 20) puis **barre MP** (hauteur 16), en **parallélogramme biseauté** (bords penchés ~5 %). IMPORTANT : le **contour doit être fermé sur les 4 côtés, extrémités biseautées comprises** — dessiner le cadre comme une couche extérieure (couleur bord) + track intérieur inset ~1.5 px (dessin `Graphics.fillPoints` du parallélogramme, ou 2 polygones imbriqués), pas un simple `border` (qui laisse la fin de barre « ouverte »).
   - **Ligne shield** sous les barres : petite icône bouclier + `+N SHIELD` (`Silkscreen 10px #bfe9ff`), visible seulement si shield > 0.

## Couleurs
- Or : `#e2b24e` / `#f2c65a`. Texte clair : `#eef2ff`. Track sombre : `#0a0e18`.
- HP : dégradé `#ff5a72 → #b8253c`, bord track `#6b4756`, label « HP » `#ffd7de`.
- MP : dégradé `#63b0f0 → #2360b8`, bord track `#24455f`, label « MP » `#cfe6ff`.
- Shield : `#bfe9ff` / `#7fd0ff` (plaque hachurée cyan), highlight bord `#eaf7ff`.
- Chiffres `cur/max` alignés à droite, **décalés de ~18 px** du bord (ne pas coller au biseau) ; labels HP/MP décalés de ~18 px à gauche.

## Jauges & shield (mécanique)
- HP et MP : remplissage proportionnel `cur/max` (démo : HP 146, MP 86).
- **Shield = plaque progressive à l'AVANT (gauche) de la barre de vie** (hachures cyan ~115°, liseré droit clair) qui **encaisse avant les PV** : à l'impact, les dégâts retirent d'abord le shield, le surplus retire les PV. Le shield ne dépasse pas la largeur de la barre de vie. Plafond de shield = valeur de design (absolue ou % des PV max) — pas de limite dure imposée par le HUD.

## Animations (le point clé — tout est en tweens)
- **Drain « chip / fantôme »** : derrière la barre HP colorée, une couche **blanche** (`rgba(255,235,235,0.75)`). À la perte de PV, la couche colorée descend **vite** (~220 ms) tandis que la couche blanche descend **en retard** (~750 ms, léger delay) → on voit le morceau perdu « fondre ». Au soin, la couleur monte vite, le blanc rattrape.
- **Dégâts** : overlay rouge (`rgba(255,42,58,~0.85)`) sur la barre HP en flash (opacité 0.85→0, ~300 ms) + **shake** du HUD (~200 ms, ±3 px, aller-retour amorti).
- **Soin** : overlay vert (`rgba(125,255,154,0.6)`) en flash.
- **Vie basse (<25 %)** : **pouls rouge** en boucle (glow interne, opacité 0.15↔0.55, ~0.8 s).
- **Gain de shield** : la plaque apparaît/grandit avec un **pouls cyan** (glow qui respire, ~1.8 s) tant que shield > 0.
- **Dégâts sur le shield** : shake du HUD.
- **Casse du shield** (shield → 0) : la plaque fait un **squash vertical + fondu** (scaleY 1→1.4→0.2, opacité→0, ~340 ms) et projette **~6 éclats cyan** (petits carrés `#bfe9ff`, glow) qui volent vers le haut/extérieur en tournant puis s'estompent (~450 ms). Jouer l'anim AVANT de mettre shield à 0.
- Toutes les barres : léger **reflet** (bande blanche translucide qui balaie, ~2.6–3 s en boucle).

## API du composant demandé
`class PlayerHud extends Phaser.GameObjects.Container` (ou plugin) :
- `setNameLevel(name, level)`
- `setHP(cur, max)` / `setMP(cur, max)` / `setShield(cur, max?)` — mettent à jour les jauges avec les tweens ci-dessus (drain chip, low-hp pulse auto).
- `damage(amount)` — applique la mécanique shield→HP, déclenche flash rouge + shake.
- `heal(amount)` — flash vert.
- `addShield(amount)` — pouls cyan.
- `breakShield()` — anim de casse + éclats, puis shield = 0.
- Getters d'état (hp/mp/shield courants).

## Réglages de démo (facultatif, utile au tuning)
Valeurs de départ : HP 78 %, MP 55 %, shield 35 %, nom « TOTO », niveau 2. Boutons de test : Dégâts −22 (encaisse shield puis PV), Soin +25, +Shield +30, Casser shield, −Mana 20, +Mana 25, Reset.

## Critères d'acceptation
- HUD **transparent** ancré haut-gauche, gemme non rognée (marge), barres au contour **fermé** (biseaux compris), textes non collés aux bords.
- Shield = plaque progressive dans la barre de vie qui encaisse avant les PV.
- Toutes les animations présentes et correctes (drain chip, flash dégâts/soin, shake, pouls vie basse, pouls + casse de shield avec éclats).
- Pixel-perfect (NEAREST), 60 fps, aucun résidu de particule après une casse de shield.
- Fournir le code TypeScript commenté + une UIScene de démo avec les boutons de test.

## Notes d'implémentation Phaser
- Dessiner les parallélogrammes au `Graphics` (`fillPoints`/`strokePoints`) pour des bords pixel nets ; masquer les remplissages avec un `GeometryMask` de la même forme (fin de barre biseautée propre).
- Reflet/pouls/flash via tweens sur des overlays (blend `ADD` pour les glows) ; éclats de shield via un petit `ParticleEmitter` (texture carré générée au runtime) ou des sprites tweenés détruits à la fin.
- Regrouper tout le HUD dans un `Container` pour le shake (tween sur `x`).
