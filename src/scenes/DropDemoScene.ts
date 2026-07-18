// Démo autonome de FloatingItemDrop — 7 raretés alignées, un curseur
// déplaçable au clavier pour valider le ramassage (overlap -> collect()).
// Scène injectable indépendamment du flux de boot normal (cf. main.ts) :
// lancer via `game.scene.start('DropDemoScene')` en console, ou l'URL
// `?dropdemo=1` (gérée dans main.ts).
import Phaser from 'phaser';
import { FloatingItemDrop } from '../objects/FloatingItemDrop';
import { RARITY_ORDER, RARITY_VFX } from '../config/rarities';

const WPN_SWORD_TEXTURE = 'wpn_sword';
const PLAYER_SPEED = 220;

export class DropDemoScene extends Phaser.Scene {
  private drops: FloatingItemDrop[] = [];
  // Arc ne déclare pas `body` — même remarque que FloatingItemDrop, le cast
  // se fait une fois à la création plutôt que sur chaque accès.
  private player!: Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
  private keyUp!: Phaser.Input.Keyboard.Key;
  private keyDown!: Phaser.Input.Keyboard.Key;
  private keyLeft!: Phaser.Input.Keyboard.Key;
  private keyRight!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('DropDemoScene');
  }

  preload(): void {
    // Scène autonome : ne dépend pas de PreloaderScene ayant déjà tourné.
    if (!this.textures.exists(WPN_SWORD_TEXTURE)) {
      this.load.image(WPN_SWORD_TEXTURE, 'assets/sprites/items/wpn_sword.png');
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0a0a14);

    const spacing = 130;
    const startX = 960 / 2 - (spacing * (RARITY_ORDER.length - 1)) / 2;
    const y = 260;

    RARITY_ORDER.forEach((key, i) => {
      const drop = new FloatingItemDrop(this, startX + i * spacing, y, {
        texture: WPN_SWORD_TEXTURE,
        rarity: key,
      });
      this.add.text(drop.x, y + 90, RARITY_VFX[key].label, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: RARITY_VFX[key].colorHex,
      }).setOrigin(0.5);
      this.drops.push(drop);
    });

    this.player = this.add.circle(960 / 2, 560, 10, 0xffffff) as Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
    this.physics.add.existing(this.player);
    this.player.body.setCircle(10);
    this.physics.world.setBounds(0, 0, 960, 720);
    this.player.body.setCollideWorldBounds(true);

    for (const drop of this.drops) {
      this.physics.add.overlap(this.player, drop, () => {
        this.drops = this.drops.filter(d => d !== drop);
        drop.collect(this.player);
      });
    }

    const kb = this.input.keyboard!;
    this.keyUp = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyDown = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyLeft = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyRight = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.events.once('shutdown', () => this.shutdown());
  }

  update(): void {
    const body = this.player.body;
    const left = this.keyLeft.isDown;
    const right = this.keyRight.isDown;
    const up = this.keyUp.isDown;
    const down = this.keyDown.isDown;
    const diagonal = (left || right) && (up || down);
    const factor = diagonal ? Math.SQRT1_2 : 1;
    body.setVelocity(
      ((right ? 1 : 0) - (left ? 1 : 0)) * PLAYER_SPEED * factor,
      ((down ? 1 : 0) - (up ? 1 : 0)) * PLAYER_SPEED * factor,
    );
  }

  shutdown(): void {
    const kb = this.input.keyboard!;
    kb.removeKey(this.keyUp);
    kb.removeKey(this.keyDown);
    kb.removeKey(this.keyLeft);
    kb.removeKey(this.keyRight);
  }
}
