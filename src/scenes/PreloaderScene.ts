import Phaser from 'phaser';
import { parseTMXtoTiledJSON } from '../utils/TMXParser';

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

    // Full Kenney RPG tileset — used by real Tiled maps
    this.load.image('rpg-full', 'assets/kenneys/rpg-full.png');

    // Real Tiled TMX maps loaded as text — parsed into Tiled JSON in create()
    this.load.text('tmx_town_raw',    'assets/maps/town.tmx');
    this.load.text('tmx_volcano_raw', 'assets/maps/volcano.tmx');
    this.load.text('tmx_swamp_raw',   'assets/maps/swamp.tmx');
    this.load.text('tmx_air_raw',     'assets/maps/air.tmx');
    this.load.text('tmx_sea_raw',     'assets/maps/sea.tmx');

    // Legacy JSON tilemaps (fallback for zones without a TMX)
    // Failed fetches (404) fire loaderror, which Phaser handles gracefully — no try/catch needed.
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.key.startsWith('map_')) {
        // JSON map not found — GameScene falls back to drawFallbackFloor()
      }
    });
    ['grievy_town', 'ignis_reach', 'terravast', 'zephyr_peaks',
      'abyssmar', 'volterra', 'glaciem', 'malachars_spire'].forEach(m => {
      this.load.tilemapTiledJSON(`map_${m}`, `assets/maps/${m}.json`);
    });
  }

  create() {
    // Parse loaded TMX text files into Tiled JSON and inject into the tilemap cache
    const tmxEntries: Array<[string, string]> = [
      ['tmx_town',    'tmx_town_raw'],
      ['tmx_volcano', 'tmx_volcano_raw'],
      ['tmx_swamp',   'tmx_swamp_raw'],
      ['tmx_air',     'tmx_air_raw'],
      ['tmx_sea',     'tmx_sea_raw'],
    ];
    for (const [cacheKey, textKey] of tmxEntries) {
      const xmlText = this.cache.text.get(textKey) as string | null;
      if (!xmlText) continue;
      const json = parseTMXtoTiledJSON(xmlText);
      if (!json) continue;
      this.cache.tilemap.add(cacheKey, { format: Phaser.Tilemaps.Formats.TILED_JSON, data: json });
    }

    this.scene.start('MainMenuScene');
  }
}
