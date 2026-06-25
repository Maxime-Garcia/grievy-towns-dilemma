import { generatePlaceholderAssets } from '../utils/PlaceholderAssets';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    const { width: W, height: H } = this.cameras.main;

    // Black background
    this.cameras.main.setBackgroundColor(0x000000);

    const label = this.add.text(W / 2, H / 2, 'Generating assets...', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Generate all placeholder textures synchronously
    generatePlaceholderAssets(this);

    label.destroy();
    this.scene.start('PreloaderScene');
  }
}
