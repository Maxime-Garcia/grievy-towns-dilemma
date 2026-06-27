import Phaser from 'phaser';
import {
  generatePlaceholderAssets,
  assembleTilesets,
  applyKenneyTiles,
  applyKenneyCharacters,
  REAL_ASSET_MANIFEST,
} from '../utils/PlaceholderAssets';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // Silently attempt to load real PNG assets.
    // Any that fail are caught by the error handler and ignored — placeholders fill the gaps.
    this.load.on('loaderror', () => {});

    for (const { key, path, type, frameWidth, frameHeight, spacing, margin } of REAL_ASSET_MANIFEST) {
      if (type === 'spritesheet' && frameWidth && frameHeight) {
        this.load.spritesheet(key, path, { frameWidth, frameHeight, spacing: spacing ?? 0, margin: margin ?? 0 });
      } else {
        this.load.image(key, path);
      }
    }
  }

  create() {
    // 1. Generate canvas placeholders for every key not loaded from a real file
    generatePlaceholderAssets(this);

    // 2. Override tile placeholders with Kenney frames — MUST run before assembleTilesets
    applyKenneyTiles(this);

    // 3. Assemble zone tilesets from individual tile textures (Kenney or placeholder)
    assembleTilesets(this);

    // 4. Override player + NPC placeholders with Kenney character sprites
    applyKenneyCharacters(this);

    this.scene.start('PreloaderScene');
  }
}
