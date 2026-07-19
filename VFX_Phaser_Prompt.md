# Prompt Claude Code — Système VFX d'armes (Phaser 3)

> À coller tel quel à Claude Code. Objectif : reproduire EXACTEMENT le simulateur VFX validé (fichier de réf : `VFX Armes.dc.html`) sous forme d'un système Phaser 3 réutilisable, en primitives + tweens (aucun asset externe, textures générées au runtime). ⚙️ Invoque mes agents Phaser / gameplay et VFX.

## Contexte technique
- Action-RPG top-down 2D, univers Frieren (medieval fantasy adulte, sombre). Pixel art strict : `pixelArt:true`, `roundPixels:true`, `antialias:false`, zoom caméra entier.
- Tout est dessiné en primitives (Graphics / Rectangle / Arc / clip-équivalents) + tweens, détruit après coup. Aucune sprite-sheet d'effet. Les quelques textures utiles (étoile, glow radial, lame de swoosh) sont générées au runtime via `Graphics.generateTexture` (filtre NEAREST).
- Sprite joueur = 32×32 = échelle de référence. Dans la démo : origine du coup = joueur, attaques orientées vers le HAUT (−90°) ; cible (mannequin) droit devant. En jeu, orienter par l'angle d'attaque et attacher au monde.
- Budgets : coup de base 150–400 ms, finisher 300–740 ms, alt 230–620 ms. Windup éventuel = teinte du sprite joueur (`setTintFill` temporaire) + léger squash&stretch.

## Palette (source de vérité)
Élémentaire (couleur du coup = élément de l'arme équipée) :
`Feu #ff4400 · Eau #2266ff · Foudre #ffee00 · Glace #88ddff · Terre #88aa33 · Vent #aaddff · Ténèbres #aa44ff · Divin #ffd700`.
Neutre tranchant (aciers) : cœur `#eef2ff`, lame `#f2f4ff`, gris `#c8ccd6`. Chroma (dague/poings) : blanc `#ffffff`, cyan `#33ffff`, magenta `#ff33cc`. Violet/magenta = couche « alternative ».
Adapter aux vraies raretés/éléments déjà définis dans mon code si présents (ne pas dupliquer une table divergente).

## Architecture demandée
- `VfxSystem` (ou un plugin de scène) exposant `play(weapon, layer, opts)` où `weapon` ∈ {epee, epeedouble, grandeepee, dague, daguesdouble, hache, marteau, baton, arc, lance, poings}, `layer` ∈ {base, fin, alt}, `opts = { origin:{x,y}, target:{x,y}, angleDeg, element, intensity=1, slowmo=false }`.
- Chaque effet = composition de PRIMITIVES (ci-dessous) ordonnancées par une timeline (`scene.time`/`Phaser.Tweens.Timeline`). `slowmo` multiplie toutes les durées par 1.7 ; `intensity` multiplie le nombre de particules et l'ampleur du shake.
- **Auto-cleanup** : chaque primitive détruit son GameObject à la fin de son tween (équivalent du filet `onComplete` + timeout de sécurité `durée+160ms`). `play()` purge les VFX en cours de l'émetteur au démarrage d'une nouvelle attaque.
- Glows : `postFX.addGlow(color, strength)` ou blend `ADD` sur les particules/formes lumineuses.

## Bibliothèque de primitives (à implémenter 1:1)
Toutes centrées/orientées sur l'origine ou la cible ; `dur` en ms.
- `arc(cx,cy,r,th,color,dur,fromDeg,toDeg)` — croissant simple : anneau fin qui balaie de `from` à `to` en s'estompant.
- `crescent(cx,cy,r,span,th,color,dur,fromDeg,toDeg)` — **swoosh de lame** : arc épais (span en degrés) à **tranchant blanc lumineux**, masqué en anneau (rayon intérieur = (r−th)/r), qui balaie + s'estompe. Spawn en plus un **écho flou** (blur 3px, opacité 0.5, durée ×1.25) → traînée soyeuse.
- `streak(cx,cy,angle,len,w,color,dur)` — trait/dash effilé (dégradé transparent→couleur→blanc→couleur→transparent), scaleX 0→1 depuis l'origine. Spawn en plus un **sous-trait flou** large (blur 3px, opacité 0.4, durée ×1.3) = afterglow.
- `glint(cx,cy,angle,dist,color,dur)` — point brillant qui file le long d'une direction en laissant 3 points de traîne (reflet de lame).
- `thrust(cx,cy,len,w,color,dur)` / `thrustRetract(...)` — estoc qui jaillit (et se rétracte).
- `ring(cx,cy,maxR,color,dur,th,flat)` — onde circulaire qui se dilate (flat = aplatie en ellipse pour le sol).
- `fullring(cx,cy,r,th,color,dur)` — anneau complet qui apparaît en tournant (sweep 360°).
- `polyWave(cx,cy,r,sides,color,dur,rot,flat)` — **onde polygonale** (losange=4, hexa=6, triangle=3) : contour qui se dilate + s'estompe (clip-path polygone / dessin Graphics).
- `shatterRing(cx,cy,r,color,dur,segs)` — anneau d'**éclats** (tirets courts) projetés vers l'extérieur.
- `spikes(cx,cy,n,len,thk,color,dur,spread,base)` — **gerbe de lignes de vitesse** radiales (effilées), scaleY 0→1 depuis le centre ; `spread`=360 (radial) ou angle + `base` (éventail orienté).
- `impactStar(cx,cy,size,color,dur)` — **étoile d'impact** anime : 4 barres lumineuses (0/90/±45°) + **cœur blanc radial** + petite gerbe de débris blancs ; pop scale 0→1.15→0.82.
- `bloom(cx,cy,r,color,dur)` — flash radial doux (blanc→couleur→transparent).
- `debris(cx,cy,n,color,spread,dur,rise)` — petits carrés pixel projetés + rotation + fondu (`rise` = biais vers le haut).
- `bolt(cx,cy,tx,ty,color,dur)` — éclair déchiqueté (polyligne zigzag) qui grandit + scintille.
- `scorch(cx,cy,rx,ry,color,dur)` — **décal de brûlure** au sol (ellipse sombre + liseré coloré) qui persiste puis s'estompe (~600–700 ms).
- `crossCut(cx,cy,size,color,dur)` — deux traits qui se croisent en X puis flash + `impactStar` (entaille façon Sekiro).
- `ghostDash(x1,y1,x2,y2,color,dur)` — dash : gros streak + 4 silhouettes du joueur qui s'estompent le long du trajet.
- `vortex(cx,cy,n,color,dur,r)` — particules en spirale (rayon décroissant, aplaties top-down).
- `arcTravel(cx,cy,r,fromDeg,toDeg,color,dur,size,onEnd)` — projectile qui suit un **arc de cercle** en tournant, avec traîne ; `onEnd` à l'arrivée.
- `spinProj(cx,cy,tx,ty,color,edge,onImpact)` — projectile qui **tourne** (900°) en translatant vers la cible, avec traîne ; `onImpact(tx,ty)`.
- `converge(cx,cy,n,color,dur,fromR)` — particules qui **convergent** vers le centre (windup de charge).
- `squash(sx,sy,dur)` — squash&stretch du sprite joueur (anticipation/impact).
- `tint(color,dur)` — teinte lumineuse temporaire du sprite joueur (windup).
- `afterimg()` — une silhouette fantôme du joueur qui s'estompe.
- `flash(color,alpha,dur)` — flash plein écran (bref).
- `shake(px,dur)` — camera shake (px ×intensity).
- `edgeLines(color,dur)` — **lignes de focus** plein écran : ~12 traits qui pointent vers le centre (temps forts).
- `crit(cx,cy,color,big)` = `flash(blanc,.13–.2)` + `bloom` + `spikes(8–10)` + `impactStar` + `shake` → signature d'impact des finishers.

## Couche « polish » (appliquée à CHAQUE attaque, après l'effet)
`polish(weapon,layer)` :
- `groundGlow(origin)` : lueur douce au sol (ellipse radiale, opacité ~0.26, 700 ms).
- `elementFlair(pos, element)` : particules dédiées —
  - **Feu** : braises orange (`#ff4400`/`#ff8a2e`) qui montent + scintillent.
  - **Glace** : éclats de cristal (`#bfe9ff`) projetés en losanges qui tournent.
  - **Foudre** : 3 micro-`bolt` (`#ffee00`) autour du point.
  - **Vent** : volutes latérales (`#cfeaff`) qui montent en dérivant.
  - **autres** : `motes` douces teintées élément (fines particules flottantes montantes).
  - Sur un finisher : `elementFlair` aussi sur la cible.

## Composition EXACTE des 33 effets (ordre + timings ; ms = avant slowmo)
Convention : `S(t,…)` = délai t ms ; `A` = couleur élément ; `V`=#aa44ff, `M`=#ff33cc, `CY`=#33ffff.

**Épée** — base : squash(1.14,.9,90) → S70: crescent(r66,span120,th10,#eef2ff,210) + crescent(r58,120,4,A,230) + glint + debris(3). fin : tint(A,110) → S110: streak(len200,w12,A) + afterimg + crit(cible,big) + debris(6). alt : streak(150,14,V) + bloom(cible+30,20,V) + debris(4,M).

**Épée double** — base : converge(6,A,fromR40,180) → S120: 3× crescent staggerés (S i·80), angles −30/0/30, dernier blanc + glint. fin : streak(dummy,45°,120,#ff3344) → S140: streak(135°,120,#aa1122) + crit(cible,big,#ff3344) + debris(7 gouttes #7a0d18, rise) ; shake(2). alt : ring(54,V) + arc(56,V) → S320: streak(130,M) + bloom.

**Grande épée** — base : squash(.86,1.2,150) → S150: crescent(r98,span150,th16,#f2f4ff,330) + polyWave(losange r92,A,flat) + scorch(58×26) + debris(7) + shake(3). fin : tint(A,180) → S180: fullring(r110,#fff) + shatterRing(120,A,14) + afterimg + crit(big) + shake(5). alt : tint(#ff3322,250) → S250: ring(150,#ff3322)+ring(120,#ffd0c0) + shatterRing(140) + shake(3).

**Dague** — base : squash(1.12,.9,50) + streak(64,#fff) + streak(58,CY)+streak(58,M) (décalés ±3px, chroma) + glint. fin : 5× streak chroma (S i·60) traversant la cible à angles variés → S360: crossCut(cible,40,#fff) + edgeLines(#fff) + shake(4). alt : arc(#88ddff parade) + flash(#88ddff) → S180: ghostDash(→ derrière la cible) + crossCut(#ff7a1e) + shake(3).

**Dagues doubles** — base : streak(#fff)+streak(CY) puis S80: streak(#fff)+streak(M) en X + debris(3). fin : vortex(12,#e8ecff,r50) + debris(5,#ffb24a) → S320: ghostDash(→cible) + impactStar(cible,34,#ffb24a) + spikes(8) + edgeLines(#ffb24a) + shake(4). alt : vortex(14,V,r72) + scorch + debris(10,V,rise) + 3× polyWave triangle (S i·130).

**Hache** — base : squash(1.1,.9,80) → S80: crescent(r62,span160,th16,#ff5a1e,300) + crescent(r52,160,7,#ffb060) + scorch + debris(6,#cc2a1a) + shake(2). fin : tint(#ff7a1e,200) + arcTravel(r70, −90→270°, 440, size16) → onEnd: crescent slam + polyWave(hexa r120,#ff7a1e,flat) + scorch(80×32) + debris(10 #8a8f9c fragments) + edgeLines + impactStar + shake(6). alt : spinProj(→cible, V/M) → onImpact: polyWave(losange 40,V) + debris(6,M) + impactStar(26,V) + shake(2) + S120: streak retour vers le joueur (boomerang).

**Marteau** — base : tint(#ffee00,150) → S150: ring(120,#ffee00,flat)+ring(88,#fff6a0,flat) + debris(6,rise) + shake(4). fin : tint(#ffee00,200) → S200: ring(180,flat) + shatterRing(150,#c9a83a,16) + spikes(8,len50,#6b4a2a) + bloom(40) + shake(6). alt : tint(#ff2a1a,200) → S200: ring(160,#ff2a1a,flat)+ring(120,#ffd0c0,flat) + spikes(10) + shake(5).

**Bâton** — base : orbTo(→cible,A,size18) → impact: bloom(24,A)+spikes(7). fin : tint(A,120) → S120: halo qui pulse + orbTo(perçant, size26) → impact: crit(A). alt : bloom(charge,V) → S250: bolt(→cible,#cc66ff) + orbTo(#cc66ff,size30) → impact: crit(M).

**Arc** — base : tint(#8a5a2a,80) → S80: projUp(portée210, tip #e8d8b0) + streak court. fin : 3 flèches en éventail (−18/0/18°, portée220, pointes #ffb24a) → S300: bloom(cible). alt : projUp(portée300,V, tip #fff) → S360: bloom(cible).

**Lance** — base : squash(1.12,.9,70) → S70: streak(len150,w10,A)+streak(150,4,#fff) + glint(pointe) + polyWave(losange26,A) + debris(3) au bout de l'allonge. fin : converge(7,A,44) + tint(A,160) → S200: streak(len320,w14,A)+streak(320,5,#fff) + **multi-impact** = 3× impactStar échelonnés le long de la file (S i·60) + spikes(éventail base −90°) + polyWave(losange58) + edgeLines + shake(3). alt : converge(7,V,44) → S200: ghostDash(→ à travers la cible) + streak(300,#fff) + scorch vertical (trace de perçage) + polyWave(losange58,M) + shake(3).

**Poings** — base : squash(1.1,.92,60) + streak(#fff)+streak(CY) puis S90: streak(#fff)+streak(M) + polyWave(losange26,#fff) (one-two chroma). fin : 6× streak flurry (S i·55) → S340: crit(M). alt : crescent(sweep 360° r48,M) + afterimg → S260: streak(54,M)+streak(46,#ff8adf) + polyWave(30,#ff8adf) + debris(7,#ff8adf) + shake(2).

## Réglages exposés (comme la démo)
`intensity` (0.5–2, densité particules + shake), `slowmo` (bool, ×1.7 durées) — utiles au debug/tuning.

## Critères d'acceptation
- Une scène de démo reproduit le simulateur : sélection arme (11) × couche (3) × élément (8), bouton rejouer, nom+timing affichés.
- Chaque effet correspond à la composition ci-dessus (formes, ordres, couleurs, timings, shake) ; la couche polish + `elementFlair` s'appliquent partout.
- **Aucun GameObject résiduel** après un effet (auto-cleanup) ; 60 fps avec ~20 effets simultanés ; tout en NEAREST (aucune texture floue).
- Les couleurs proviennent de la table de raretés/éléments existante (aucun hex codé en dur divergent).

Livrer le code TypeScript commenté, les textures générées au runtime, et la scène de démo.
