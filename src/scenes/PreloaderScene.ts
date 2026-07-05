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
    this.generateWeaponIcons();

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

  private generateWeaponIcons(): void {
    const S = 32;
    const mk = (key: string, fn: (g: Phaser.GameObjects.Graphics) => void) => {
      const g = this.make.graphics({ add: false });
      fn(g);
      g.generateTexture(key, S, S);
      g.destroy();
    };

    // SWORD — blade argenté, garde bleue
    mk('wpn_sword', g => {
      g.fillStyle(0x8899cc); g.fillTriangle(9, 29, 13, 29, 26, 5, 22, 5);
      g.fillStyle(0x223366); g.fillRect(7, 23, 16, 3);
      g.fillStyle(0x997755); g.fillRect(12, 26, 6, 6);
    });

    // GREATSWORD — lame plus large, gris foncé
    mk('wpn_greatsword', g => {
      g.fillStyle(0x556688); g.fillTriangle(7, 30, 13, 30, 28, 2, 22, 2);
      g.fillStyle(0x223344); g.fillRect(4, 24, 22, 4);
      g.fillStyle(0x775533); g.fillRect(12, 28, 7, 4);
    });

    // DAGGER — courte, ambre
    mk('wpn_dagger', g => {
      g.fillStyle(0xddaa33); g.fillTriangle(12, 25, 17, 25, 23, 9, 19, 9);
      g.fillStyle(0x554422); g.fillRect(10, 22, 12, 4);
      g.fillStyle(0x886633); g.fillRect(12, 26, 8, 6);
    });

    // DUAL_DAGGER — deux dagues ambre
    mk('wpn_dual_dagger', g => {
      g.fillStyle(0xddaa33);
      g.fillTriangle(4, 27, 8, 27, 14, 8, 10, 8);
      g.fillTriangle(18, 27, 22, 27, 28, 8, 24, 8);
      g.fillStyle(0x886633);
      g.fillRect(4, 25, 5, 7); g.fillRect(18, 25, 5, 7);
      g.fillStyle(0x554422);
      g.fillRect(3, 22, 7, 3); g.fillRect(17, 22, 7, 3);
    });

    // DUAL_SWORD — deux lames bleues
    mk('wpn_dual_sword', g => {
      g.fillStyle(0x8899cc);
      g.fillTriangle(3, 29, 8, 29, 17, 4, 12, 4);
      g.fillTriangle(16, 29, 21, 29, 30, 4, 25, 4);
      g.fillStyle(0x334466);
      g.fillRect(2, 22, 13, 3); g.fillRect(16, 22, 13, 3);
      g.fillStyle(0x997755);
      g.fillRect(3, 25, 5, 7); g.fillRect(17, 25, 5, 7);
    });

    // AXE — coin rouge + manche brun
    mk('wpn_axe', g => {
      g.fillStyle(0x997755); g.fillRect(14, 15, 5, 17);
      g.fillStyle(0xcc3322); g.fillTriangle(4, 4, 4, 22, 19, 13);
      g.fillStyle(0xaa2211); g.fillRect(13, 9, 6, 9);
    });

    // HAMMER — tête grise en T
    mk('wpn_hammer', g => {
      g.fillStyle(0x997755); g.fillRect(14, 15, 5, 17);
      g.fillStyle(0x778899); g.fillRect(5, 5, 22, 11);
      g.fillStyle(0x556677); g.fillRect(5, 3, 22, 3);
    });

    // STAFF — bâton violet + orbe
    mk('wpn_staff', g => {
      g.fillStyle(0x5522aa); g.fillRect(14, 9, 5, 23);
      g.fillStyle(0xaa55ff); g.fillCircle(16, 7, 7);
      g.fillStyle(0xdd99ff); g.fillCircle(14, 5, 3);
    });

    // BOW — arc vert courbé + corde
    mk('wpn_bow', g => {
      g.lineStyle(3, 0x44aa22, 1);
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        pts.push({ x: 22 - Math.round(Math.sin(t * Math.PI) * 13), y: 2 + Math.round(t * 28) });
      }
      g.strokePoints(pts, false, false);
      g.lineStyle(1, 0xddcc88, 1);
      g.lineBetween(22, 2, 22, 30);
    });
  }
}
