Contexte : jeu roguelite Heroic-Fantasy (univers type Frieren), moteur Phaser 3 (≥ 3.60),
TypeScript, pixel-art. Sprites d'armes 32×32 sur une spritesheet à filtre NEAREST.

⚙️ Invoque mes agents Phaser / gameplay et VFX pour cette tâche.

OBJECTIF
Créer un GameObject réutilisable `FloatingItemDrop` : un item posé au sol que le joueur
ramasse, présenté dans un SCEAU MAGIQUE (cercle de runes) teinté par la rareté, qui flotte,
tourne, et pétille. Les specs chiffrées ci-dessous viennent d'un mock validé.

FICHIERS ATTENDUS
- src/objects/FloatingItemDrop.ts        (la classe)
- src/config/rarities.ts                 (table des raretés)
- src/vfx/textures.ts                     (génération runtime des textures spark/glow)
- src/scenes/DropDemoScene.ts             (démo : 1 drop par rareté, alignés)

API
class FloatingItemDrop extends Phaser.GameObjects.Container {
  constructor(scene, x, y, opts: { texture: string; frame?: string|number; rarity: RarityKey });
  collect(target: Phaser.GameObjects.Components.Transform, onComplete?: () => void): void;
  setRarity(r: RarityKey): void;
}
- Body Arcade circulaire (rayon ~28px) pour l'overlap de ramassage.
- Le bob est purement visuel (n'affecte pas le body).

RARETÉS — couvrir les 7, dans cet ordre de puissance croissante :
  common      Commun
  uncommon    Peu Commun
  rare        Rare
  epic        Épique
  legendary   Légendaire
  mythic      Mythique
  hidden      Caché

⚠️ NE PAS inventer les couleurs. Chaque rareté est DÉJÀ documentée dans le code existant du
projet — va y chercher les codes couleur exacts (hex) et réutilise-les tels quels dans
src/config/rarities.ts. Repère la source de vérité (enum/const/table des raretés déjà
présente), importe-la ou aligne-toi dessus ; ne crée pas de doublon divergent.

Pour chaque rareté, définir : { key, label FR, color (depuis le code existant), swordFrame
(index réel dans ma spritesheet), glow, sparkRate, ringSpeedMul }. L'intensité (glow,
densité de particules, vitesse des anneaux) doit CROÎTRE avec la rareté — Commun le plus
sobre, Caché le plus spectaculaire (au-dessus de Mythique). Si un traitement spécial est
déjà prévu pour "Caché", respecte-le. Barème indicatif à ajuster :
  Commun     glow 1.0  sparkRate 0.20  ringSpeedMul 1.0
  Peu Commun glow 1.2  sparkRate 0.28  ringSpeedMul 1.05
  Rare       glow 1.5  sparkRate 0.40  ringSpeedMul 1.15
  Épique     glow 1.9  sparkRate 0.55  ringSpeedMul 1.3
  Légendaire glow 2.4  sparkRate 0.75  ringSpeedMul 1.5
  Mythique   glow 3.0  sparkRate 0.95  ringSpeedMul 1.7
  Caché      glow 3.6  sparkRate 1.20  ringSpeedMul 1.9

COMPOSITION (du fond vers l'avant), tout centré sur le container :
1. Ombre au sol : ellipse (Graphics/Image) 76×17, alpha 0.55, blend NORMAL, posée à y=+46.
   Tween scaleX 1↔0.68 + alpha 0.55↔0.32, 1400ms yoyo Sine.inOut, SYNCHRO INVERSE du bob.
2. Aura : image "soft-glow" radiale teintée rarity, ø ~134, blend ADD, alpha 0.55↔0.9,
   scale 0.92↔1.08 (2400ms yoyo).
3. Cœur d'énergie : "soft-glow" blanc→rarity, ø ~60, blend ADD, tween scale 0.82↔1.15 +
   alpha 0.4↔0.85 (2000ms yoyo Sine.inOut).
4. Anneau de runes EXTÉRIEUR : Graphics, cercle ø96 (rayon 48), traits radiaux (ticks)
   tous les ~10° (trait ~1.5px sur ~40% du rayon près du bord), couleur rarity,
   postFX.addGlow(rarityColor, glow). Rotation continue CW = 360°/(14s / ringSpeedMul).
5. Cercle gravé : Graphics strokeCircle rayon 39, lineWidth 1, glow (postFX).
6. Anneau de runes INTÉRIEUR : Graphics ø62 (rayon 31), ticks tous les ~20°, rotation
   CCW = 360°/(10s / ringSpeedMul) (sens opposé à l'extérieur).
7. Marqueurs cardinaux : 4 petits losanges (carrés rotate 45°) ~9px à N/E/S/O sur rayon ~54,
   couleur rarity + glow.
8. Épée : Sprite depuis la spritesheet (frame = rarity.swordFrame), setOrigin 0.5,
   scale de base ≈ 1.7 (32→~54px), roundPixels, filtre NEAREST, drop glow léger.
   - Flottement (bob) : tween y 0↔-15, 1400ms yoyo Sine.inOut, delay = phase aléatoire par drop.
   - Rotation "flip Minecraft" (2D) : proxy {a:0}→{a:2π}, 4000ms repeat -1 linéaire,
     onUpdate → epee.scaleX = baseScale * Math.cos(a) (passe par 0 = tranche).
   Le groupe {aura, cœur, anneaux, cardinaux, épée, sparkles} monte/descend ensemble avec le bob.

VFX PÉTILLANT (point important)
- Textures générées au runtime dans src/vfx/textures.ts via Graphics.generateTexture (NEAREST) :
  "spark" = étoile 4 branches fines (polygone concave), blanche, ~16px ; "soft-glow" radiale.
- Emitter "twinkle" : particules spark, blend ADD, tint blanc→léger rarity,
  emitZone = bord d'un cercle rayon ~46 autour de l'épée, quantity 1,
  frequency ∝ rarity.sparkRate, lifespan 1600–2200ms, pop (scale 0→1→0 via keyframes),
  rotate 0→90°, alpha 0→1→0.
- Emitter "dust" : petits carrés 3–4px teintés rarity, blend ADD, speedY -20..-40,
  lifespan 2600–3000ms, alpha 1→0, quantité faible, émis sous l'épée.
- Halo orbital : 2–3 sparks "attachées" tournant en cercle (rayon ~60) via update() + angle,
  chacune avec un twinkle d'alpha.
- Toutes les particules et l'intensité scalent avec la rareté.

RAMASSAGE (collect)
- Stopper les emitters en douceur, burst final ~12 sparks, tween épée+sceau : scale ×1.3,
  alpha→0, léger déplacement vers target, 220ms, puis destroy(). Callback onComplete.

CONFIG MOTEUR / PERF
- game config: pixelArt:true, roundPixels:true, antialias:false.
- Une seule texture "spark" et une seule "soft-glow" partagées.
- Mutualiser les ParticleEmitterManager ; couper les emitters hors écran (visible check).
- Pas d'allocation dans update() (réutiliser vecteurs).

CRITÈRES D'ACCEPTATION
- DropDemoScene affiche les 7 raretés alignées (Commun → Caché), une par sceau :
  2 anneaux contra-rotatifs + cercle gravé + cardinaux + cœur pulsé, épée qui flotte et "flip",
  ombre synchronisée inverse, scintillements plus denses selon la rareté.
- Passer devant un drop (overlap) déclenche collect() avec burst + fondu.
- 60 fps avec 20 drops simultanés à l'écran.
- Zéro warning de texture floue (tout en NEAREST).
- Les couleurs proviennent bien de la table de raretés existante (aucun hex codé en dur ailleurs).

Livrer le code TypeScript commenté et les textures générées au runtime.
Découpe les épées depuis ma spritesheet existante (frames 32×32) ; expose swordFrame par rareté