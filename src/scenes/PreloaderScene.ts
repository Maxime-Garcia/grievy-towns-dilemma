export class PreloaderScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloaderScene' }); }

  preload() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Progress bar background
    const barBg = this.add.graphics();
    barBg.fillStyle(0x222222);
    barBg.fillRect(w / 2 - 200, h / 2 - 16, 400, 32);

    const bar = this.add.graphics();
    const title = this.add.text(w / 2, h / 2 - 60, "Grievy Town's Dilemma", {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const pct = this.add.text(w / 2, h / 2 + 30, '0%', {
      fontSize: '12px',
      color: '#aaaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.clear();
      bar.fillStyle(0xffffff);
      bar.fillRect(w / 2 - 198, h / 2 - 14, 396 * value, 28);
      pct.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      title.destroy();
      bar.destroy();
      barBg.destroy();
      pct.destroy();
    });

    // All image/spritesheet assets (tilesets, player, enemies, NPCs, UI, skills, logo)
    // are already generated as canvas textures by BootScene → generatePlaceholderAssets().
    // We only need to load the tilemap JSON files here.
    const maps = [
      'grievy_town',
      'ignis_reach',
      'terravast',
      'zephyr_peaks',
      'abyssmar',
      'volterra',
      'glaciem',
      'malachars_spire',
    ];
    maps.forEach(m => {
      try {
        this.load.tilemapTiledJSON(`map_${m}`, `assets/maps/${m}.json`);
      } catch {
        // Map file not present yet — game handles missing maps gracefully
      }
    });
  }

  create() {
    this.scene.start('MainMenuScene');
  }
}
