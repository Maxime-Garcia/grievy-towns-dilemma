// Item flottant au sol, présenté dans un sceau magique teinté par la rareté.
// GameObject de MONDE pur (Container Arcade) — aucune dépendance à UITheme.
import Phaser from 'phaser';
import { RARITY_VFX, RARITY_ORDER, type RarityKey, type RarityVFXConfig } from '../config/rarities';
import { ensureVFXTextures, SPARK_TEXTURE, GLOW_TEXTURE, SQUARE_TEXTURE, GLOW_TEXTURE_SIZE } from '../vfx/textures';
import { getIconInkMetrics, getIconInkScale } from '../utils/IconInk';

// Icône de référence pour la normalisation par surface d'encre (cf. buildSword) —
// wpn_sword est garantie chargée (PreloaderScene) et déjà validée visuellement.
const REFERENCE_ICON_KEY = 'wpn_sword';

export interface FloatingItemDropOptions {
  texture: string;
  frame?: string | number;
  rarity: RarityKey;
}

// Toutes les tailles sont calées sur l'échelle perso 32x32 : aura (couche la
// plus large) ~54px de diamètre, soit ~1.7x la largeur du joueur.
const PICKUP_RADIUS = 12;
const BOB_AMPLITUDE = 6;
const BOB_DURATION = 1400;
const ORBIT_RADIUS = 24;
// Vitesse orbitale de base (rad/s) avant application de ringSpeedMul.
const ORBIT_BASE_SPEED = Phaser.Math.DegToRad(40);
const OUTER_RING_RADIUS = 19;
const GRAVED_CIRCLE_RADIUS = 16;
const INNER_RING_RADIUS = 12;
const CARDINAL_RADIUS = 22;
const CARDINAL_HALF_SIZE = 2;
const AURA_DIAMETER = 54;
const CORE_OUTER_DIAMETER = 24;
const CORE_INNER_DIAMETER = 14;
const CULL_PADDING = 40;
// Chute + rebond à l'apparition (demande créateur, 19/07) : l'ensemble
// sceau+item tombe de FALL_HEIGHT au-dessus de sa position de repos et
// rebondit dessus (Bounce.easeOut, qui a nativement l'overshoot+repos d'un
// vrai rebond physique) — quelques frames, pas un vrai calcul de gravité.
const FALL_HEIGHT = 20;
const FALL_DURATION = 340;

export class FloatingItemDrop extends Phaser.GameObjects.Container {
  // Container ne déclare pas `body` (contrairement à Sprite/Image) — physics.add.existing()
  // l'attache quand même à l'exécution, `declare` comble juste le typage sans rien émettre au build.
  declare body: Phaser.Physics.Arcade.Body;

  private cfg: RarityVFXConfig;

  private readonly entourage: Phaser.GameObjects.Container;
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly aura: Phaser.GameObjects.Image;
  private readonly coreOuter: Phaser.GameObjects.Image;
  private readonly coreInner: Phaser.GameObjects.Image;
  private readonly outerRing: Phaser.GameObjects.Graphics;
  private readonly gravedCircle: Phaser.GameObjects.Graphics;
  private readonly innerRing: Phaser.GameObjects.Graphics;
  private readonly cardinals: Phaser.GameObjects.Graphics;
  private readonly sword: Phaser.GameObjects.Sprite;
  private readonly twinkleEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  private readonly orbitSparks: Phaser.GameObjects.Image[] = [];
  // Angle courant par spark orbitale — réutilisé chaque frame, aucune allocation.
  private readonly orbitAngles: number[] = [];
  private readonly flipProxy = { a: 0 };

  private outerRingTween?: Phaser.Tweens.Tween;
  private innerRingTween?: Phaser.Tweens.Tween;
  private readonly persistentTweens: Phaser.Tweens.Tween[] = [];

  private baseSwordScale = 0.9;
  // Capturée après setDisplaySize() — le tween scaleX de l'ombre doit rester
  // relatif à cette base (30x7), pas écraser la valeur absolue. Seul scaleX
  // respire (spec) ; scaleY reste figé à sa valeur de setDisplaySize.
  private shadowBaseScaleX = 1;
  private collected = false;
  private wasVisible = true;

  constructor(scene: Phaser.Scene, x: number, y: number, opts: FloatingItemDropOptions) {
    super(scene, x, y);
    this.cfg = RARITY_VFX[opts.rarity];
    ensureVFXTextures(scene);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Container n'a pas d'origine sprite : son (x,y) EST déjà le pivot local (0,0),
    // donc un offset de -radius,-radius centre le cercle physique dessus.
    body.setCircle(PICKUP_RADIUS, -PICKUP_RADIUS, -PICKUP_RADIUS);
    // Désactivé pendant la chute+rebond (cf. fin du constructeur) : un corps
    // Arcade désactivé est ignoré par le monde physique, aucun overlap ne peut
    // se déclencher tant qu'il n'est pas explicitement réactivé — le joueur ne
    // peut donc pas ramasser le drop avant que l'animation d'apparition finisse,
    // sans qu'aucun appelant n'ait à connaître cet état ("quelques frames" où
    // le ramassage est désactivé, demande créateur 19/07).
    body.enable = false;

    this.shadow = this.buildShadow(scene);
    this.add(this.shadow);

    this.entourage = scene.add.container(0, 0);
    this.add(this.entourage);

    this.aura = this.buildAura(scene);
    [this.coreOuter, this.coreInner] = this.buildCore(scene);
    this.outerRing = this.buildTickRing(scene, OUTER_RING_RADIUS, 10);
    this.gravedCircle = this.buildGravedCircle(scene);
    this.innerRing = this.buildTickRing(scene, INNER_RING_RADIUS, 20);
    this.cardinals = this.buildCardinals(scene);
    this.sword = this.buildSword(scene, opts.texture, opts.frame);
    this.buildOrbitSparks(scene);
    this.twinkleEmitter = this.buildTwinkleEmitter(scene);
    this.dustEmitter = this.buildDustEmitter(scene);

    this.entourage.add([
      this.aura, this.coreOuter, this.coreInner,
      this.outerRing, this.gravedCircle, this.innerRing, this.cardinals,
      this.sword, this.twinkleEmitter, this.dustEmitter,
    ]);
    // buildOrbitSparks() les a ajoutées avant ce bloc (donc derrière) — les
    // ramener au premier plan pour qu'elles orbitent bien devant le sceau.
    for (const spark of this.orbitSparks) this.entourage.bringToTop(spark);

    this.startTweens(scene);

    // Chute + rebond : le sceau+item tombe de FALL_HEIGHT au-dessus de sa
    // position de repos et rebondit dessus — SEUL `entourage` (sceau+épée+
    // particules) bouge, `this.shadow` reste fixe à l'origine du container et
    // sert d'ancrage "sol" (l'ombre ne tombe pas, elle EST le sol). Le
    // container lui-même (donc le corps Arcade, cf. body.enable ci-dessus)
    // ne bouge jamais : sa position monde est déjà la position de repos finale
    // dès la construction, seul un enfant se décale visuellement.
    this.entourage.setY(-FALL_HEIGHT);
    this.setAlpha(0);
    const fall = scene.tweens.add({
      targets: this.entourage,
      y: 0,
      duration: FALL_DURATION,
      ease: 'Bounce.easeOut',
      // Réactivé seulement quand la chute+rebond est VISUELLEMENT finie, pas
      // avant — sinon le ramassage redeviendrait possible pendant que l'item
      // rebondit encore à l'écran (demande créateur : "quelques frames... et
      // ensuite c'est good", pas "à mi-chute").
      onComplete: () => { body.enable = true; },
    });
    const fadeIn = scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 120,
      ease: 'Quad.easeOut',
    });
    this.persistentTweens.push(fall, fadeIn);

    // Container n'a pas de boucle preUpdate automatique (contrairement à
    // Sprite/Image) : il faut s'enregistrer explicitement pour faire tourner
    // les sparks orbitales + la sync ombre/bob chaque frame.
    this.addToUpdateList();
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.removeFromUpdateList();
      this.persistentTweens.forEach(t => t.remove());
    });
  }

  // ── Construction ──────────────────────────────────────────────────────

  private buildShadow(scene: Phaser.Scene): Phaser.GameObjects.Image {
    const img = scene.add.image(0, 18, GLOW_TEXTURE);
    img.setTint(0x000000);
    img.setBlendMode(Phaser.BlendModes.NORMAL);
    img.setAlpha(0.55);
    // 30x7 : texture ronde étirée en ellipse plate.
    img.setDisplaySize(30, 7);
    this.shadowBaseScaleX = img.scaleX;
    return img;
  }

  private buildAura(scene: Phaser.Scene): Phaser.GameObjects.Image {
    const img = scene.add.image(0, 0, GLOW_TEXTURE);
    img.setBlendMode(Phaser.BlendModes.ADD);
    img.setTint(this.cfg.color);
    // Scale de repos au bas de la respiration (0.92) — le tween grimpe à 1.08.
    img.setScale((AURA_DIAMETER / GLOW_TEXTURE_SIZE) * 0.92);
    img.setAlpha(0.55);
    return img;
  }

  private buildCore(scene: Phaser.Scene): [Phaser.GameObjects.Image, Phaser.GameObjects.Image] {
    const outer = scene.add.image(0, 0, GLOW_TEXTURE);
    outer.setBlendMode(Phaser.BlendModes.ADD);
    outer.setTint(this.cfg.color);
    outer.setScale((CORE_OUTER_DIAMETER / GLOW_TEXTURE_SIZE) * 0.82);
    outer.setAlpha(0.4);

    // Cœur "blanc→rarity" : un halo blanc plus petit superposé au halo teinté.
    const inner = scene.add.image(0, 0, GLOW_TEXTURE);
    inner.setBlendMode(Phaser.BlendModes.ADD);
    inner.setTint(0xffffff);
    inner.setScale((CORE_INNER_DIAMETER / GLOW_TEXTURE_SIZE) * 0.82);
    inner.setAlpha(0.7);

    return [outer, inner];
  }

  private buildTickRing(scene: Phaser.Scene, radius: number, tickEveryDeg: number): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics();
    // 1px (pas 1.5) : à ce rayon réduit, plus épais fusionne les ticks en anneau plein.
    g.lineStyle(1, this.cfg.color, 1);
    const innerR = radius * 0.6;
    for (let deg = 0; deg < 360; deg += tickEveryDeg) {
      const a = Phaser.Math.DegToRad(deg);
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      g.lineBetween(cos * innerR, sin * innerR, cos * radius, sin * radius);
    }
    this.addGlowSafe(g, this.cfg.glow);
    return g;
  }

  private buildGravedCircle(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics();
    g.lineStyle(1, this.cfg.color, 1);
    g.strokeCircle(0, 0, GRAVED_CIRCLE_RADIUS);
    this.addGlowSafe(g, this.cfg.glow);
    return g;
  }

  private buildCardinals(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    const g = scene.add.graphics();
    g.fillStyle(this.cfg.color, 1);
    const positions: Array<[number, number]> = [
      [0, -CARDINAL_RADIUS], [CARDINAL_RADIUS, 0], [0, CARDINAL_RADIUS], [-CARDINAL_RADIUS, 0],
    ];
    const s = CARDINAL_HALF_SIZE;
    for (const [cx, cy] of positions) {
      g.fillPoints([
        { x: cx, y: cy - s }, { x: cx + s, y: cy }, { x: cx, y: cy + s }, { x: cx - s, y: cy },
      ], true);
    }
    this.addGlowSafe(g, this.cfg.glow * 0.7);
    return g;
  }

  private buildSword(scene: Phaser.Scene, textureKey: string, frame?: string | number): Phaser.GameObjects.Sprite {
    const sprite = scene.add.sprite(0, 0, textureKey, frame);
    sprite.setOrigin(0.5);
    // Normalise par EMPREINTE (bounding-box du contenu opaque), pas par
    // dimensions de canvas : une icône fine/centrée (ex: une clé) paraissait
    // minuscule à côté d'une épée qui remplit tout son cadre 32×32, à scale
    // nominale identique (cf. IconInk.ts en-tête pour l'itération surface→footprint).
    // wpn_sword sert de référence — c'est l'icône déjà validée visuellement à
    // baseSwordScale=0.9 (cf. retours du créateur en jeu). Ce facteur est
    // ENSUITE multiplié dans baseSwordScale : la boucle de flip (update()) qui
    // relit ce champ chaque frame reste donc correcte sans changement.
    const targetFootprint = getIconInkMetrics(scene, REFERENCE_ICON_KEY).footprint;
    const inkScale = getIconInkScale(scene, textureKey, frame, targetFootprint);
    this.baseSwordScale *= inkScale;
    sprite.setScale(this.baseSwordScale);
    this.addGlowSafe(sprite, this.cfg.glow * 0.5);
    return sprite;
  }

  private buildOrbitSparks(scene: Phaser.Scene): void {
    // Épique et au-dessus : 3 sparks orbitales ; en dessous : 2. Léger scaling
    // de "spectacle" avec la rareté, dans l'esprit de la spec (2-3 sparks).
    const rarityIndex = RARITY_ORDER.indexOf(this.cfg.key);
    const count = rarityIndex >= 3 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const img = scene.add.image(0, 0, SPARK_TEXTURE);
      img.setBlendMode(Phaser.BlendModes.ADD);
      img.setTint(this.cfg.color);
      img.setScale(0.35);
      this.entourage.add(img);
      this.orbitSparks.push(img);
      this.orbitAngles.push((Math.PI * 2 * i) / count);
      const twinkle = scene.tweens.add({
        targets: img,
        alpha: { from: 0.3, to: 1 },
        duration: 700 + i * 130,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.persistentTweens.push(twinkle);
    }
  }

  private buildTwinkleEmitter(scene: Phaser.Scene): Phaser.GameObjects.Particles.ParticleEmitter {
    // Densité inversement proportionnelle à sparkRate : commun (0.20) ~= 900ms
    // entre particules, caché (1.20) ~= 150ms. BASE choisie empiriquement pour
    // rester lisible en bas de rareté sans noyer le sceau en haut de rareté.
    const BASE_MS = 180;
    const frequency = Math.round(BASE_MS / this.cfg.sparkRate);
    return scene.add.particles(0, 0, SPARK_TEXTURE, {
      blendMode: Phaser.BlendModes.ADD,
      tint: [0xffffff, this.cfg.color],
      emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 18), quantity: 48 },
      quantity: 1,
      frequency,
      lifespan: { min: 1600, max: 2200 },
      scale: { values: [0, 0.5, 0] },
      alpha: { values: [0, 1, 0] },
      rotate: { start: 0, end: 90 },
    });
  }

  private buildDustEmitter(scene: Phaser.Scene): Phaser.GameObjects.Particles.ParticleEmitter {
    const frequency = Math.round(600 / this.cfg.sparkRate);
    return scene.add.particles(0, 7, SQUARE_TEXTURE, {
      blendMode: Phaser.BlendModes.ADD,
      tint: this.cfg.color,
      x: { min: -4, max: 4 },
      y: { min: -2, max: 2 },
      speedY: { min: -16, max: -8 },
      speedX: { min: -2, max: 2 },
      lifespan: { min: 2600, max: 3000 },
      alpha: { start: 1, end: 0 },
      scale: { min: 0.5, max: 0.75 },
      quantity: 1,
      frequency,
    });
  }

  private addGlowSafe(target: Phaser.GameObjects.GameObject, strength: number): void {
    try {
      const fx = (target as unknown as { postFX: Phaser.GameObjects.Components.FX }).postFX;
      fx.addGlow(this.cfg.color, strength);
    } catch {
      // Renderer Canvas (pas de pipeline FX) — dégradation silencieuse, le
      // sceau reste lisible sans glow plutôt que de casser la scène.
    }
  }

  private refreshGlow(target: Phaser.GameObjects.GameObject, strength: number): void {
    try {
      const fx = (target as unknown as { postFX: Phaser.GameObjects.Components.FX }).postFX;
      fx.clear();
    } catch {
      // Canvas : rien à nettoyer.
    }
    this.addGlowSafe(target, strength);
  }

  // ── Tweens ────────────────────────────────────────────────────────────

  private startTweens(scene: Phaser.Scene): void {
    // Phase ET période jitterées par drop : sans ça, tous les sceaux à l'écran
    // pulsent/flippent en parfaite synchro — effet mécanique immédiat.
    const jitter = () => Phaser.Math.FloatBetween(0.92, 1.08);
    // FALL_DURATION en tête du délai : le bob cible LE MÊME `entourage.y` que
    // la chute+rebond (cf. fin du constructeur) — sans ce décalage, les deux
    // tweens se disputeraient la propriété dès la frame 0 (jitter visuel,
    // aucun des deux ne "gagnant" proprement). Le bob ne doit prendre le
    // relais qu'une fois la chute visuellement terminée et posée à y=0.
    const bobDelay = FALL_DURATION + Phaser.Math.Between(0, BOB_DURATION);
    const bob = scene.tweens.add({
      targets: this.entourage,
      y: -BOB_AMPLITUDE,
      duration: BOB_DURATION,
      delay: bobDelay,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const auraBase = AURA_DIAMETER / GLOW_TEXTURE_SIZE;
    const aura = scene.tweens.add({
      targets: this.aura,
      scale: auraBase * 1.08,
      alpha: 0.9,
      duration: 2400 * jitter(),
      delay: Phaser.Math.Between(0, 800),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const coreBaseOuter = CORE_OUTER_DIAMETER / GLOW_TEXTURE_SIZE;
    const coreBaseInner = CORE_INNER_DIAMETER / GLOW_TEXTURE_SIZE;
    const core = scene.tweens.add({
      targets: [this.coreOuter, this.coreInner],
      scaleX: (target: Phaser.GameObjects.Image) =>
        (target === this.coreOuter ? coreBaseOuter : coreBaseInner) * 1.15,
      scaleY: (target: Phaser.GameObjects.Image) =>
        (target === this.coreOuter ? coreBaseOuter : coreBaseInner) * 1.15,
      alpha: 0.85,
      duration: 2000 * jitter(),
      delay: Phaser.Math.Between(0, 800),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.outerRingTween = scene.tweens.add({
      targets: this.outerRing,
      angle: 360,
      duration: 14000 / this.cfg.ringSpeedMul,
      repeat: -1,
      ease: 'Linear',
    });

    this.innerRingTween = scene.tweens.add({
      targets: this.innerRing,
      angle: -360,
      duration: 10000 / this.cfg.ringSpeedMul,
      repeat: -1,
      ease: 'Linear',
    });

    // Ease Linear volontaire : le cos() fournit déjà la courbe organique du flip.
    const flip = scene.tweens.add({
      targets: this.flipProxy,
      a: Math.PI * 2,
      duration: 4000 * jitter(),
      delay: Phaser.Math.Between(0, 2000),
      repeat: -1,
      ease: 'Linear',
      onUpdate: () => {
        this.sword.scaleX = this.baseSwordScale * Math.cos(this.flipProxy.a);
      },
    });

    this.persistentTweens.push(bob, aura, core, this.outerRingTween, this.innerRingTween, flip);
  }

  // ── Boucle ────────────────────────────────────────────────────────────

  preUpdate(_time: number, delta: number): void {
    if (this.collected) return;
    const dt = delta / 1000;
    const speed = ORBIT_BASE_SPEED * this.cfg.ringSpeedMul;
    for (let i = 0; i < this.orbitSparks.length; i++) {
      this.orbitAngles[i] += speed * dt;
      const a = this.orbitAngles[i];
      this.orbitSparks[i].x = Math.cos(a) * ORBIT_RADIUS;
      this.orbitSparks[i].y = Math.sin(a) * ORBIT_RADIUS;
    }

    // Ombre synchronisée en inverse du bob : lue directement depuis la
    // position courante de l'entourage plutôt qu'un 2e tween, pour garantir
    // une phase parfaitement inverse même avec le délai aléatoire du bob.
    const t = Phaser.Math.Clamp(-this.entourage.y / BOB_AMPLITUDE, 0, 1);
    this.shadow.scaleX = this.shadowBaseScaleX * Phaser.Math.Linear(1, 0.68, t);
    this.shadow.alpha = Phaser.Math.Linear(0.55, 0.32, t);

    this.updateCulling();
  }

  private updateCulling(): void {
    const view = this.scene.cameras.main.worldView;
    // Marge : le sceau déborde de ~27px autour de (x,y) — sans elle, les
    // emitters "popent" visiblement au bord de l'écran.
    const visible = this.x > view.x - CULL_PADDING && this.x < view.right + CULL_PADDING
      && this.y > view.y - CULL_PADDING && this.y < view.bottom + CULL_PADDING;
    if (visible === this.wasVisible) return;
    this.wasVisible = visible;
    if (visible) {
      this.twinkleEmitter.resume();
      this.dustEmitter.resume();
    } else {
      this.twinkleEmitter.pause();
      this.dustEmitter.pause();
    }
  }

  // ── API publique ──────────────────────────────────────────────────────

  collect(target: Phaser.GameObjects.Components.Transform, onComplete?: () => void): void {
    if (this.collected) return;
    this.collected = true;

    // Coupe le pop d'apparition s'il court encore (drop ramassé dès le spawn),
    // sinon il se dispute alpha/scale avec le tween de sortie.
    this.scene.tweens.killTweensOf(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.enable = false;

    this.twinkleEmitter.stop();
    this.dustEmitter.stop();
    // Burst plus généreux avec la rareté (10 sparks en Commun, 22 en Caché).
    this.twinkleEmitter.explode(10 + RARITY_ORDER.indexOf(this.cfg.key) * 2);

    // Flash blanc de saisie — le retour se lit dès la 1re frame.
    this.sword.setTintFill(0xffffff);

    const dx = (target.x - this.x) * 0.45;
    const dy = (target.y - this.y) * 0.45;

    // Pop court en easeOut : le punch arrive tout de suite, pas en fin de tween.
    this.scene.tweens.add({
      targets: this.entourage,
      scaleX: this.entourage.scaleX * 1.3,
      scaleY: this.entourage.scaleY * 1.3,
      duration: 90,
      ease: 'Back.easeOut',
    });

    // Cubic.easeIn : le sceau "dart" vers le joueur en accélérant avant de disparaître.
    this.scene.tweens.add({
      targets: this,
      x: this.x + dx,
      y: this.y + dy,
      alpha: 0,
      duration: 200,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        this.destroy();
        onComplete?.();
      },
    });
  }

  setRarity(r: RarityKey): void {
    this.cfg = RARITY_VFX[r];

    this.aura.setTint(this.cfg.color);
    this.coreOuter.setTint(this.cfg.color);

    this.redrawRing(this.outerRing, OUTER_RING_RADIUS, 10);
    this.redrawGravedCircle(this.gravedCircle);
    this.redrawRing(this.innerRing, INNER_RING_RADIUS, 20);
    this.redrawCardinals(this.cardinals);

    // Le postFX persiste au redraw — sans reset, le glow garde couleur et
    // intensité de l'ancienne rareté.
    this.refreshGlow(this.outerRing, this.cfg.glow);
    this.refreshGlow(this.gravedCircle, this.cfg.glow);
    this.refreshGlow(this.innerRing, this.cfg.glow);
    this.refreshGlow(this.cardinals, this.cfg.glow * 0.7);
    this.refreshGlow(this.sword, this.cfg.glow * 0.5);

    this.twinkleEmitter.setParticleTint([0xffffff, this.cfg.color]);
    this.twinkleEmitter.setFrequency(Math.round(180 / this.cfg.sparkRate));
    this.dustEmitter.setParticleTint(this.cfg.color);
    this.dustEmitter.setFrequency(Math.round(600 / this.cfg.sparkRate));

    for (const spark of this.orbitSparks) spark.setTint(this.cfg.color);

    // Les anciennes tweens sont retirées de persistentTweens (pas seulement
    // .remove()'ées) : sinon chaque appel à setRarity() fait grossir le tableau
    // de 2 références mortes, indéfiniment (cf. code-reviewer).
    this.outerRingTween?.remove();
    this.innerRingTween?.remove();
    for (const dead of [this.outerRingTween, this.innerRingTween]) {
      const idx = this.persistentTweens.indexOf(dead!);
      if (idx !== -1) this.persistentTweens.splice(idx, 1);
    }
    this.outerRing.setAngle(0);
    this.innerRing.setAngle(0);
    this.outerRingTween = this.scene.tweens.add({
      targets: this.outerRing, angle: 360, duration: 14000 / this.cfg.ringSpeedMul, repeat: -1, ease: 'Linear',
    });
    this.innerRingTween = this.scene.tweens.add({
      targets: this.innerRing, angle: -360, duration: 10000 / this.cfg.ringSpeedMul, repeat: -1, ease: 'Linear',
    });
    this.persistentTweens.push(this.outerRingTween, this.innerRingTween);

    this.syncOrbitSparkCount();
  }

  /** setRarity() peut faire passer le nombre de sparks orbitales de 2 à 3 (ou
   *  l'inverse) — buildOrbitSparks() ne tranche qu'une fois, à la construction. */
  private syncOrbitSparkCount(): void {
    const rarityIndex = RARITY_ORDER.indexOf(this.cfg.key);
    const targetCount = rarityIndex >= 3 ? 3 : 2;
    while (this.orbitSparks.length < targetCount) {
      const i = this.orbitSparks.length;
      const img = this.scene.add.image(0, 0, SPARK_TEXTURE);
      img.setBlendMode(Phaser.BlendModes.ADD);
      img.setTint(this.cfg.color);
      img.setScale(0.35);
      this.entourage.add(img);
      this.entourage.bringToTop(img);
      this.orbitSparks.push(img);
      this.orbitAngles.push((Math.PI * 2 * i) / targetCount);
      const twinkle = this.scene.tweens.add({
        targets: img,
        alpha: { from: 0.3, to: 1 },
        duration: 700 + i * 130,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      this.persistentTweens.push(twinkle);
    }
    while (this.orbitSparks.length > targetCount) {
      const img = this.orbitSparks.pop()!;
      this.scene.tweens.killTweensOf(img);
      img.destroy();
      this.orbitAngles.pop();
    }
  }

  private redrawRing(g: Phaser.GameObjects.Graphics, radius: number, tickEveryDeg: number): void {
    g.clear();
    g.lineStyle(1, this.cfg.color, 1);
    const innerR = radius * 0.6;
    for (let deg = 0; deg < 360; deg += tickEveryDeg) {
      const a = Phaser.Math.DegToRad(deg);
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      g.lineBetween(cos * innerR, sin * innerR, cos * radius, sin * radius);
    }
  }

  private redrawGravedCircle(g: Phaser.GameObjects.Graphics): void {
    g.clear();
    g.lineStyle(1, this.cfg.color, 1);
    g.strokeCircle(0, 0, GRAVED_CIRCLE_RADIUS);
  }

  private redrawCardinals(g: Phaser.GameObjects.Graphics): void {
    g.clear();
    g.fillStyle(this.cfg.color, 1);
    const positions: Array<[number, number]> = [
      [0, -CARDINAL_RADIUS], [CARDINAL_RADIUS, 0], [0, CARDINAL_RADIUS], [-CARDINAL_RADIUS, 0],
    ];
    const s = CARDINAL_HALF_SIZE;
    for (const [cx, cy] of positions) {
      g.fillPoints([
        { x: cx, y: cy - s }, { x: cx + s, y: cy }, { x: cx, y: cy + s }, { x: cx - s, y: cy },
      ], true);
    }
  }
}
