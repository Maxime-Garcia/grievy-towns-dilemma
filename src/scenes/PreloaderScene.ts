import Phaser from 'phaser';
import { parseTMXtoTiledJSON } from '../utils/TMXParser';
import { RARITY_COLORS, ItemRarity } from '../types';
import { ALL_ITEMS } from '../data/items';

export class PreloaderScene extends Phaser.Scene {
  // PNJ de Grievy Town ayant un sprite bitmap réel (Characters Pack 06 — ELV Games).
  // Ajouter ici tout nouvel identifiant de PNJ au fur et à mesure de l'intégration
  // (voir public/assets/ASSET_SOURCES.md pour la correspondance vers le pack source).
  private static readonly GRIEVY_TOWN_NPC_IDS = [
    'aldric', 'brother_ovan', 'kelvar', 'theron', 'liria', 'mira', 'ysolde',
  ] as const;

  // Ennemis avec sprite bitmap réel (Rogue Adventure Enemy Pack 1-4 + boss packs
  // Molarbeast/Titan Guard, recolorés par élément — voir ASSET_SOURCES.md).
  // Chaque strip idle/walk/attack/damage/dead a 6 frames, taille fixe par ennemi
  // (dépend de la créature source, pas de l'élément) : 32, 48 ou 80px/frame.
  private static readonly ENEMY_FRAME_SIZE: Record<string, number> = {
    // 32×32
    cinder_sprite: 32, ember_broodmother: 32, crystal_golem: 32, terravast_serpent: 32,
    rune_shard_ghost: 32, stone_hound: 32, cloudpiercer: 32, tide_shaper: 32,
    spark_imp: 32, volt_hound: 32, arc_node: 32, glacial_shaper: 32,
    void_weaver: 32, void_stalker: 32,
    // 48×48
    ember_wyrm: 48, lava_golem: 48, ash_revenant: 48, magma_titan: 48,
    scorch_sentinel: 48, pyrath_boss: 48, stone_crawler: 48, cave_lurker: 48,
    ruin_colossus: 48, gale_harpy: 48, storm_eagle: 48, wind_wraith: 48,
    cyclone_sprite: 48, sky_titan: 48, storm_caller: 48, sylvael_boss: 48,
    tide_crawler: 48, sea_wraith: 48, coral_golem: 48, depth_serpent: 48,
    abyssal_shade: 48, drowned_knight: 48, thunder_drake: 48, chain_revenant: 48,
    grid_architect: 48, storm_herald: 48, volkran_boss: 48, frost_wolf: 48,
    ice_golem: 48, blizzard_wraith: 48, permafrost_titan: 48, crystal_dragon: 48,
    hoarfrost_stalker: 48, dark_revenant: 48, shadow_construct: 48, void_sentinel: 48,
    malachar_boss: 48,
    // 80×80 (Titan Guard boss)
    gorvun_boss: 80, thalymor_boss: 80, crysthea_boss: 80,
  };
  private static readonly ENEMY_STATES = ['idle', 'walk', 'attack', 'damage', 'dead'] as const;

  // Icônes d'armes réelles (packs Sword/Staff/Bow/Dagger/Axe Item Icons — voir
  // ASSET_SOURCES.md) — un fichier statique 32×32 par arme, pas de recolor par
  // élément (contrairement aux ennemis) : l'élément d'une arme looté est signalé
  // par la couleur de survol de son emplacement dans l'inventaire, pas l'icône.
  private static readonly WEAPON_ICON_KEYS = [
    'item_arc_sword', 'item_blizzard_gs', 'item_cinder_dagger', 'item_colossus_greatsword',
    'item_coral_sword', 'item_crystal_staff', 'item_depth_fang', 'item_divine_sword',
    'item_dragonfang_sword', 'item_drowned_sword', 'item_earth_tome', 'item_echo_blade',
    'item_fire_staff', 'item_first_blade', 'item_frost_dagger', 'item_frost_staff',
    'item_gale_dagger', 'item_gorvun_hammer', 'item_harpy_bow', 'item_herald_staff',
    'item_iron_sword', 'item_leviathan_staff', 'item_magma_greatsword', 'item_malachar_blade',
    'item_malachars_staff', 'item_memory_staff', 'item_phoenix_bow', 'item_pyroclast_bow',
    'item_seismic_staff', 'item_sentinel_sword', 'item_shadow_dagger', 'item_shadow_staff',
    'item_sky_bow', 'item_soul_bow', 'item_steel_sword', 'item_stone_dagger',
    'item_storm_sword', 'item_temporal_blade', 'item_test_axe', 'item_test_dual_dagger',
    'item_test_dual_sword', 'item_test_hammer', 'item_thunder_bow', 'item_thunder_staff',
    'item_tide_staff', 'item_titan_greatsword', 'item_velmara_blade', 'item_void_bow',
    'item_void_reaper', 'item_volkran_hammer', 'item_water_staff', 'item_wind_bow',
    'item_wind_greatsword', 'item_world_eater',
  ] as const;

  constructor() { super({ key: 'PreloaderScene' }); }

  preload() {
    // Continues the boot-loading overlay's bar (see index.html) from where
    // BootScene left off (PROGRESS_SHARE%) up to 100% — this scene loads the
    // vast majority of assets (270 enemy sprite files + player/npc/tilesets/
    // maps), so it owns the bulk of the bar's range.
    const BOOT_SHARE = 15;
    this.load.on('progress', (value: number) => {
      window.__bootLoading?.setProgress(BOOT_SHARE + value * (100 - BOOT_SHARE), 'Chargement des sprites');
    });

    // Full Kenney RPG tileset — used by real Tiled maps
    this.load.image('rpg-full', 'assets/kenneys/rpg-full.png');

    // ── Héros — premier asset bitmap réel du jeu (ELV Games, voir public/assets/ASSET_SOURCES.md) ──
    // Grille 4×4 par feuille : ligne 0=bas, 1=gauche, 2=droite, 3=haut, 4 frames/ligne.
    // idle/walk/dead = 24px/frame (96×96) ; attack = 32px/frame (128×128, plus grand à cause de l'arme).
    this.load.spritesheet('player_idle',   'assets/sprites/player/player_idle.png',   { frameWidth: 24, frameHeight: 24 });
    this.load.spritesheet('player_walk',   'assets/sprites/player/player_walk.png',   { frameWidth: 24, frameHeight: 24 });
    this.load.spritesheet('player_attack', 'assets/sprites/player/player_attack.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('player_dead',   'assets/sprites/player/player_dead.png',   { frameWidth: 24, frameHeight: 24 });

    // ── PNJ de Grievy Town — même pack/grille que le héros (Characters Pack 06) ──
    // Idle+Walk uniquement (pas de combat) : voir public/assets/ASSET_SOURCES.md.
    for (const npcId of PreloaderScene.GRIEVY_TOWN_NPC_IDS) {
      this.load.spritesheet(`npc_${npcId}_idle`, `assets/sprites/npcs/npc_${npcId}_idle.png`, { frameWidth: 24, frameHeight: 24 });
      this.load.spritesheet(`npc_${npcId}_walk`, `assets/sprites/npcs/npc_${npcId}_walk.png`, { frameWidth: 24, frameHeight: 24 });
    }

    // ── Ennemis — Rogue Adventure Enemy Pack recoloré par élément (voir ASSET_SOURCES.md) ──
    // Strip horizontal 6 frames, une seule direction (pas de flip directionnel pour les ennemis).
    for (const [enemyId, size] of Object.entries(PreloaderScene.ENEMY_FRAME_SIZE)) {
      for (const state of PreloaderScene.ENEMY_STATES) {
        this.load.spritesheet(
          `enemy_${enemyId}_${state}`,
          `assets/sprites/enemies/enemy_${enemyId}_${state}.png`,
          { frameWidth: size, frameHeight: size },
        );
      }
    }

    // ── Icônes d'armes réelles (voir ASSET_SOURCES.md) ──
    for (const key of PreloaderScene.WEAPON_ICON_KEYS) {
      this.load.image(key, `assets/sprites/items/${key}.png`);
    }

    // ── Tileset de sol Grievy Town — Fantasy Dreamland Reborn (voir ASSET_SOURCES.md) ──
    // Convention : tileset_<zoneId>_ground / _path, chargé par zone dans GameScene.drawZoneMap().
    this.load.image('tileset_grievy_town_ground', 'assets/sprites/tilesets/tileset_grievy_town_ground.png');
    this.load.image('tileset_grievy_town_path', 'assets/sprites/tilesets/tileset_grievy_town_path.png');

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
    this.generateItemIcons();
    this.createPlayerAnimations();
    this.createNpcAnimations();
    this.createEnemyAnimations();

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

    window.__bootLoading?.hide();
    this.scene.start('MainMenuScene');
  }

  // ── Animations du héros (asset bitmap réel) ──────────────────────────────
  // Chaque feuille (idle/walk/attack/dead) est une grille 4×4 : ligne 0=bas,
  // 1=gauche, 2=droite, 3=haut — 4 frames par ligne. Voir preload() pour les
  // dimensions par feuille. Clés d'animation : player_<etat>_<direction>.
  private createPlayerAnimations(): void {
    const DIRS: Array<{ name: string; row: number }> = [
      { name: 'down',  row: 0 },
      { name: 'left',  row: 1 },
      { name: 'right', row: 2 },
      { name: 'up',    row: 3 },
    ];

    const register = (state: string, textureKey: string, frameRate: number, repeat: number) => {
      if (!this.textures.exists(textureKey)) return;
      for (const { name, row } of DIRS) {
        const key = `player_${state}_${name}`;
        if (this.anims.exists(key)) continue;
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(textureKey, { start: row * 4, end: row * 4 + 3 }),
          frameRate,
          repeat,
        });
      }
    };

    register('idle',   'player_idle',   4,  -1);
    register('walk',   'player_walk',   8,  -1);
    register('attack', 'player_attack', 14,  0);
    register('dead',   'player_dead',   8,   0);
  }

  // ── Animations des PNJ (même grille 4×4 que le héros, idle+walk seulement) ──
  private createNpcAnimations(): void {
    const DIRS: Array<{ name: string; row: number }> = [
      { name: 'down',  row: 0 },
      { name: 'left',  row: 1 },
      { name: 'right', row: 2 },
      { name: 'up',    row: 3 },
    ];

    for (const npcId of PreloaderScene.GRIEVY_TOWN_NPC_IDS) {
      for (const state of ['idle', 'walk'] as const) {
        const textureKey = `npc_${npcId}_${state}`;
        if (!this.textures.exists(textureKey)) continue;
        for (const { name, row } of DIRS) {
          const key = `${textureKey}_${name}`;
          if (this.anims.exists(key)) continue;
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(textureKey, { start: row * 4, end: row * 4 + 3 }),
            frameRate: state === 'idle' ? 4 : 8,
            repeat: -1,
          });
        }
      }
    }
  }

  // ── Animations des ennemis (strip 6 frames, une seule direction) ─────────
  private createEnemyAnimations(): void {
    const STATE_CONFIG: Record<typeof PreloaderScene.ENEMY_STATES[number], { frameRate: number; repeat: number }> = {
      idle:   { frameRate: 5,  repeat: -1 },
      walk:   { frameRate: 8,  repeat: -1 },
      attack: { frameRate: 10, repeat: 0 },
      damage: { frameRate: 10, repeat: 0 },
      dead:   { frameRate: 8,  repeat: 0 },
    };

    for (const enemyId of Object.keys(PreloaderScene.ENEMY_FRAME_SIZE)) {
      for (const state of PreloaderScene.ENEMY_STATES) {
        const textureKey = `enemy_${enemyId}_${state}`;
        if (!this.textures.exists(textureKey)) continue;
        if (this.anims.exists(textureKey)) continue;
        const { frameRate, repeat } = STATE_CONFIG[state];
        this.anims.create({
          key: textureKey,
          frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: 5 }),
          frameRate,
          repeat,
        });
      }
    }
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

  // ── Procedural item icons for all non-weapon categories ─────────────────────
  //
  // Strategy:
  //   1. Generate one "type-level" fallback texture per category/slot
  //      (e.g. `item_type_consumable_hp`, `item_type_helm`, …)
  //   2. For each item whose specific icon texture does not yet exist, bake a
  //      coloured variant using the type icon + rarity tint.
  //
  // The keys follow the pattern `item_<itemId>` (same as item.icon).  The
  // InventoryScene.resolveIcon() method will find them via this.textures.exists().
  //
  private generateItemIcons(): void {
    const S = 32; // all icons are 32×32 px (matches sprite size from INSPIRATIONS §1)

    // ── Helper: bake a Graphics → texture and destroy the Graphics ────────────
    const mk = (key: string, fn: (g: Phaser.GameObjects.Graphics) => void): void => {
      if (this.textures.exists(key)) return; // already created (hot-reload guard)
      const g = this.make.graphics({ add: false });
      fn(g);
      g.generateTexture(key, S, S);
      g.destroy();
    };

    // ── Rarity accent colour (numeric) — mirrors RARITY_COLORS string table ──
    const rarityNum = (r: ItemRarity): number =>
      parseInt(RARITY_COLORS[r].replace('#', ''), 16);

    // ─────────────────────────────────────────────────────────────────────────
    // BASE SHAPE GENERATORS — one per visual "slot"
    // ─────────────────────────────────────────────────────────────────────────

    // HP potion — round flask, red body, cork brown
    const drawPotionHp = (g: Phaser.GameObjects.Graphics, tint: number): void => {
      g.fillStyle(0x2a0a06, 1);   // dark shadow
      g.fillCircle(16, 19, 10);
      g.fillStyle(tint !== 0 ? tint : 0xcc2222, 1);
      g.fillCircle(16, 18, 9);
      g.fillStyle(0xff6666, 0.45); // shine
      g.fillCircle(12, 14, 4);
      g.fillStyle(0x8b5a2b, 1);   // cork
      g.fillRect(12, 5, 8, 6);
      g.lineStyle(1, 0x5a3010, 1);
      g.strokeRect(12, 5, 8, 6);
      g.fillStyle(0xffffff, 0.15); // cross highlight
      g.fillRect(14, 15, 4, 7);
      g.fillRect(11, 18, 10, 4);
    };

    // MP potion — same shape, blue body
    const drawPotionMp = (g: Phaser.GameObjects.Graphics, tint: number): void => {
      g.fillStyle(0x02061a, 1);
      g.fillCircle(16, 19, 10);
      g.fillStyle(tint !== 0 ? tint : 0x2255ee, 1);
      g.fillCircle(16, 18, 9);
      g.fillStyle(0x99bbff, 0.4);
      g.fillCircle(12, 14, 4);
      g.fillStyle(0x8b5a2b, 1);
      g.fillRect(12, 5, 8, 6);
      g.lineStyle(1, 0x5a3010, 1);
      g.strokeRect(12, 5, 8, 6);
      g.fillStyle(0xffffff, 0.12);
      g.fillRect(14, 15, 4, 7);
      g.fillRect(11, 18, 10, 4);
    };

    // Full elixir — purple/gold body
    const drawPotionFull = (g: Phaser.GameObjects.Graphics): void => {
      g.fillStyle(0x110020, 1);
      g.fillCircle(16, 19, 10);
      g.fillStyle(0x8833dd, 1);
      g.fillCircle(16, 18, 9);
      g.fillStyle(0xcc88ff, 0.4);
      g.fillCircle(12, 14, 4);
      g.fillStyle(0xffd700, 1);
      g.fillRect(12, 5, 8, 6);
      g.lineStyle(1, 0xaa8800, 1);
      g.strokeRect(12, 5, 8, 6);
    };

    // Revive crystal — clear faceted gem with golden glow
    const drawReviveCrystal = (g: Phaser.GameObjects.Graphics): void => {
      g.fillStyle(0xffd700, 0.3);
      g.fillCircle(16, 16, 13);
      g.fillStyle(0xffffff, 0.9);
      g.fillTriangle(16, 4, 6, 14, 26, 14);
      g.fillStyle(0xffe066, 0.8);
      g.fillTriangle(16, 4, 26, 14, 16, 22);
      g.fillStyle(0xffd700, 0.7);
      g.fillTriangle(16, 22, 6, 14, 26, 14);
      g.fillStyle(0xfff9cc, 0.5);
      g.fillTriangle(13, 8, 10, 13, 16, 10);
    };

    // Antidote — green small vial
    const drawAntidote = (g: Phaser.GameObjects.Graphics): void => {
      g.fillStyle(0x0a1a0a, 1);
      g.fillEllipse(16, 20, 14, 16);
      g.fillStyle(0x33bb44, 1);
      g.fillEllipse(16, 19, 12, 14);
      g.fillStyle(0xaaffbb, 0.35);
      g.fillEllipse(13, 15, 5, 6);
      g.fillStyle(0x8b5a2b, 1);
      g.fillRect(13, 7, 6, 5);
    };

    // Bread / food — beige rounded loaf
    const drawBread = (g: Phaser.GameObjects.Graphics): void => {
      g.fillStyle(0xaa7733, 1);   // crust shadow
      g.fillEllipse(16, 19, 24, 16);
      g.fillStyle(0xd4a055, 1);   // top crust
      g.fillEllipse(16, 16, 22, 14);
      g.fillStyle(0xf0c880, 1);   // bread highlight
      g.fillEllipse(14, 13, 12, 8);
      g.lineStyle(1, 0xd4a055, 1); // score line
      g.lineBetween(10, 13, 22, 13);
    };

    // Helm — demi-circle + visor line
    const drawHelm = (g: Phaser.GameObjects.Graphics, tint: number): void => {
      g.fillStyle(0x222233, 1);
      g.fillRect(5, 14, 22, 14);
      g.fillStyle(tint, 1);
      g.fillRect(6, 14, 20, 12);
      g.fillStyle(tint, 1);
      g.fillEllipse(16, 15, 20, 16);
      g.fillStyle(0xffffff, 0.18); // visor slit
      g.fillRect(8, 18, 16, 3);
      g.lineStyle(1, 0x000020, 0.6);
      g.strokeEllipse(16, 15, 20, 16);
    };

    // Chest — rectangle with epaulettes
    const drawChest = (g: Phaser.GameObjects.Graphics, tint: number): void => {
      // Shoulder pads
      g.fillStyle(tint, 1);
      g.fillRect(3, 8, 8, 7);
      g.fillRect(21, 8, 8, 7);
      // Main plate
      g.fillStyle(tint, 1);
      g.fillRect(7, 11, 18, 18);
      // Collar
      g.fillStyle(tint, 0.8);
      g.fillRect(11, 7, 10, 6);
      // Center detail
      g.fillStyle(0xffffff, 0.12);
      g.fillRect(12, 13, 8, 12);
      g.lineStyle(1, 0x000020, 0.5);
      g.strokeRect(7, 11, 18, 18);
    };

    // Legs — stylized greave pair
    const drawLegs = (g: Phaser.GameObjects.Graphics, tint: number): void => {
      g.fillStyle(tint, 1);
      g.fillRect(5, 6, 10, 22);
      g.fillRect(17, 6, 10, 22);
      g.fillStyle(0xffffff, 0.12);
      g.fillRect(7, 8, 6, 4);
      g.fillRect(19, 8, 6, 4);
      g.lineStyle(1, 0x000020, 0.5);
      g.strokeRect(5, 6, 10, 22);
      g.strokeRect(17, 6, 10, 22);
    };

    // Boots — stylized boot silhouette
    const drawBoots = (g: Phaser.GameObjects.Graphics, tint: number): void => {
      // Shaft
      g.fillStyle(tint, 1);
      g.fillRect(8, 5, 16, 16);
      // Foot
      g.fillStyle(tint, 1);
      g.fillRect(6, 19, 20, 8);
      // Toe cap
      g.fillRect(5, 22, 10, 5);
      // Shine
      g.fillStyle(0xffffff, 0.14);
      g.fillRect(10, 7, 6, 8);
      g.lineStyle(1, 0x000020, 0.5);
      g.strokeRect(8, 5, 16, 16);
    };

    // Gloves — small rectangular pair with finger lines
    const drawGloves = (g: Phaser.GameObjects.Graphics, tint: number): void => {
      g.fillStyle(tint, 1);
      g.fillRect(4, 10, 11, 16);
      g.fillRect(17, 10, 11, 16);
      // Finger stubs
      g.fillStyle(tint, 0.85);
      for (let i = 0; i < 3; i++) {
        g.fillRect(5 + i * 3, 5, 2, 7);
        g.fillRect(18 + i * 3, 5, 2, 7);
      }
      g.fillStyle(0xffffff, 0.12);
      g.fillRect(6, 12, 7, 10);
      g.fillRect(19, 12, 7, 10);
    };

    // Cape — flowing trapezoid
    const drawCape = (g: Phaser.GameObjects.Graphics, tint: number): void => {
      // Collar band
      g.fillStyle(tint, 0.8);
      g.fillRect(10, 4, 12, 5);
      // Body
      g.fillStyle(tint, 1);
      g.fillTriangle(5, 8, 27, 8, 21, 30, 11, 30);
      // Fold highlight
      g.fillStyle(0xffffff, 0.1);
      g.fillTriangle(14, 9, 20, 9, 17, 24);
      g.lineStyle(1, 0x000020, 0.5);
      g.strokeTriangle(5, 8, 27, 8, 21, 30, 11, 30);
    };

    // Ring — circle with gem
    const drawRing = (g: Phaser.GameObjects.Graphics, tint: number): void => {
      g.lineStyle(4, tint, 1);
      g.strokeCircle(16, 18, 10);
      g.lineStyle(4, tint, 0.5);
      g.strokeCircle(16, 18, 12);
      g.fillStyle(tint, 1);
      g.fillCircle(16, 7, 5);
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(14, 5, 2);
    };

    // Amulet — diamond (losange) + chain hint
    const drawAmulet = (g: Phaser.GameObjects.Graphics, tint: number): void => {
      // Chain
      g.lineStyle(1, 0x888888, 0.7);
      g.lineBetween(8, 2, 16, 8);
      g.lineBetween(16, 8, 24, 2);
      // Pendant
      g.fillStyle(tint, 1);
      g.fillTriangle(16, 9, 6, 18, 16, 29);
      g.fillTriangle(16, 9, 26, 18, 16, 29);
      // Facet shine
      g.fillStyle(0xffffff, 0.3);
      g.fillTriangle(16, 9, 22, 16, 16, 18);
    };

    // Material crystal — hexagonal shape
    const drawCrystal = (g: Phaser.GameObjects.Graphics, tint: number): void => {
      const cx = 16; const cy = 16;
      const r = 12;
      const pts: Phaser.Types.Math.Vector2Like[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i - 30);
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
      g.fillStyle(tint, 0.85);
      g.fillPoints(pts, true);
      g.fillStyle(0xffffff, 0.25);
      const p2: Phaser.Types.Math.Vector2Like[] = [pts[0]!, pts[1]!, { x: cx, y: cy }];
      g.fillPoints(p2, true);
      g.lineStyle(1, 0xffffff, 0.3);
      g.strokePoints(pts, true);
    };

    // Quest item — 5-branch star with golden halo
    const drawQuestItem = (g: Phaser.GameObjects.Graphics): void => {
      // Outer glow ring
      g.lineStyle(3, 0xffd700, 0.25);
      g.strokeCircle(16, 16, 14);
      // 5-branch star
      const cx = 16; const cy = 16;
      const outerR = 12; const innerR = 5;
      const pts: Phaser.Types.Math.Vector2Like[] = [];
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 180) * (36 * i - 90);
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
      g.fillStyle(0xffd700, 1);
      g.fillPoints(pts, true);
      g.fillStyle(0xfff9cc, 0.4);
      g.fillPoints([pts[0]!, pts[9]!, pts[1]!], true);
    };

    // Key — simple pixel key silhouette
    const drawKey = (g: Phaser.GameObjects.Graphics): void => {
      // Bow (round head)
      g.lineStyle(3, 0xd4a055, 1);
      g.strokeCircle(10, 12, 7);
      g.lineStyle(3, 0xd4a055, 0.4);
      g.strokeCircle(10, 12, 4);
      // Shaft
      g.lineStyle(3, 0xd4a055, 1);
      g.lineBetween(17, 12, 29, 12);
      // Teeth
      g.lineBetween(22, 12, 22, 17);
      g.lineBetween(26, 12, 26, 16);
    };

    // Gold coin — circle with relief border
    const drawGold = (g: Phaser.GameObjects.Graphics): void => {
      g.fillStyle(0xb8860b, 1);
      g.fillCircle(16, 16, 13);
      g.fillStyle(0xffd700, 1);
      g.fillCircle(16, 15, 12);
      g.fillStyle(0xfff0aa, 0.4);
      g.fillCircle(13, 12, 5);
      g.lineStyle(2, 0xb8860b, 0.7);
      g.strokeCircle(16, 15, 9);
      g.fillStyle(0xffd700, 0.5);
      // "G" relief hint
      g.fillRect(13, 12, 6, 7);
      g.fillStyle(0xffd700, 1);
      g.fillRect(14, 13, 4, 5);
    };

    // Skin token — small palette square with shine
    const drawSkin = (g: Phaser.GameObjects.Graphics, tint: number): void => {
      g.fillStyle(tint, 0.9);
      g.fillRoundedRect(4, 4, 24, 24, 4);
      g.fillStyle(0xffffff, 0.2);
      g.fillTriangle(4, 4, 16, 4, 4, 16);
      g.lineStyle(1, 0xffffff, 0.25);
      g.strokeRoundedRect(4, 4, 24, 24, 4);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // NAMED TYPE-LEVEL FALLBACK TEXTURES
    // (used by InventoryScene.resolveIcon() fallback chain)
    // ─────────────────────────────────────────────────────────────────────────

    // Consumables
    mk('item_type_potion_hp',  g => drawPotionHp(g, 0xcc2222));
    mk('item_type_potion_mp',  g => drawPotionMp(g, 0x2255ee));
    mk('item_type_consumable', g => {
      g.fillStyle(0x1a1a2e, 1);
      g.fillRoundedRect(4, 4, 24, 24, 5);
      g.fillStyle(0xc8a030, 0.8);
      // ✦ (four-point star)
      g.fillTriangle(16, 5, 12, 16, 20, 16);
      g.fillTriangle(16, 27, 12, 16, 20, 16);
      g.fillTriangle(5, 16, 16, 12, 16, 20);
      g.fillTriangle(27, 16, 16, 12, 16, 20);
    });

    // Armor slots
    mk('item_type_helm',   g => drawHelm(g, 0x556677));
    mk('item_type_chest',  g => drawChest(g, 0x4a5568));
    mk('item_type_legs',   g => drawLegs(g, 0x4a5568));
    mk('item_type_boots',  g => drawBoots(g, 0x5a4030));
    mk('item_type_gloves', g => drawGloves(g, 0x5a4030));
    mk('item_type_cape',   g => drawCape(g, 0x553344));

    // Accessories
    mk('item_type_ring',   g => drawRing(g, 0xc8a030));
    mk('item_type_amulet', g => drawAmulet(g, 0x9966ff));

    // Materials / resources
    mk('item_type_material', g => drawCrystal(g, 0x44ddcc));

    // Quest items
    mk('item_type_key_item', g => drawQuestItem(g));

    // Skins
    mk('item_type_skin', g => drawSkin(g, 0x9966ff));

    // Weapon fallback — crossed blades silhouette, neutral silver
    mk('item_type_weapon', g => {
      // Blade 1: diagonal top-left → bottom-right
      g.fillStyle(0x8899bb, 1);
      g.fillTriangle(6, 4, 10, 4, 26, 28, 22, 28);
      // Blade 2: diagonal top-right → bottom-left
      g.fillTriangle(22, 4, 26, 4, 10, 28, 6, 28);
      // Crossguard center
      g.fillStyle(0x445566, 1);
      g.fillRect(11, 13, 10, 4);
    });

    // Generic fallback — dark square with a centered diamond, for unknown types
    mk('item_type_generic', g => {
      g.fillStyle(0x445566, 1);
      g.fillRect(2, 2, 28, 28);
      g.fillStyle(0xaabbcc, 1);
      g.fillTriangle(16, 6, 26, 16, 16, 26);
      g.fillTriangle(16, 6, 6, 16, 16, 26);
      g.lineStyle(1, 0x667788, 0.5);
      g.strokeRect(2, 2, 28, 28);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // PER-ITEM SPECIFIC ICONS
    // Only generated for items that do NOT already have a real texture file.
    // ─────────────────────────────────────────────────────────────────────────

    for (const item of Object.values(ALL_ITEMS)) {
      const key = item.icon;
      if (this.textures.exists(key)) continue;

      const rar = rarityNum(item.rarity);

      switch (item.type) {
        // ── CONSUMABLES ──────────────────────────────────────────────────────
        case 'CONSUMABLE': {
          const cons = item as import('../types').Consumable;
          if (cons.effect.hpRestore !== undefined || cons.effect.hpPercent !== undefined) {
            // HP potions — red tint, intensity by rarity brightness
            mk(key, g => drawPotionHp(g, rar));
          } else if (cons.effect.manaRestore !== undefined || cons.effect.manaPercent !== undefined) {
            // MP potions — blue tint
            mk(key, g => drawPotionMp(g, rar));
          } else if (cons.effect.revive) {
            mk(key, g => drawReviveCrystal(g));
          } else if (cons.effect.statusCure) {
            mk(key, g => drawAntidote(g));
          } else if (key.includes('bread') || key.includes('food')) {
            mk(key, g => drawBread(g));
          } else if (key.includes('elixir') && !key.includes('mp')) {
            // Combined elixirs (full_elixir, elixir_vitality mixed)
            mk(key, g => drawPotionFull(g));
          } else {
            // Generic consumable: ✦ symbol
            mk(key, g => {
              g.fillStyle(0x0c0c1e, 1);
              g.fillRoundedRect(3, 3, 26, 26, 5);
              g.fillStyle(rar, 0.85);
              g.fillTriangle(16, 4, 11, 16, 21, 16);
              g.fillTriangle(16, 28, 11, 16, 21, 16);
              g.fillTriangle(4, 16, 16, 11, 16, 21);
              g.fillTriangle(28, 16, 16, 11, 16, 21);
            });
          }
          break;
        }

        // ── ARMOR ─────────────────────────────────────────────────────────────
        case 'HELM':
          mk(key, g => drawHelm(g, rar));
          break;
        case 'CHEST':
          mk(key, g => drawChest(g, rar));
          break;
        case 'LEGS':
          mk(key, g => drawLegs(g, rar));
          break;
        case 'BOOTS':
          mk(key, g => drawBoots(g, rar));
          break;
        case 'GLOVES':
          mk(key, g => drawGloves(g, rar));
          break;
        case 'CAPE':
          mk(key, g => drawCape(g, rar));
          break;

        // ── ACCESSORIES ───────────────────────────────────────────────────────
        case 'RING':
          mk(key, g => drawRing(g, rar));
          break;
        case 'AMULET':
          mk(key, g => drawAmulet(g, rar));
          break;

        // ── MATERIALS ─────────────────────────────────────────────────────────
        case 'MATERIAL':
          mk(key, g => drawCrystal(g, rar));
          break;

        // ── KEY ITEMS ─────────────────────────────────────────────────────────
        case 'KEY_ITEM':
          if (key.includes('key') || key.includes('archive_key')) {
            mk(key, g => drawKey(g));
          } else {
            mk(key, g => drawQuestItem(g));
          }
          break;

        // ── SKINS ─────────────────────────────────────────────────────────────
        case 'SKIN':
          mk(key, g => drawSkin(g, rar));
          break;

        // ── WEAPONS — already handled by generateWeaponIcons(), skip ─────────
        case 'WEAPON':
          break;

        default:
          break;
      }
    }
  }
}
