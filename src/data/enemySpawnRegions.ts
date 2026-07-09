import { SpawnRegion } from '../types';

// PROVISIONAL/APPROXIMATE: one or two plausible spawn quadrants per enemy, assigned by
// simple narrative judgment (lore, behavior) — NOT based on real map geometry, since
// zone maps aren't finalized yet. Backs the Bestiary "roughly where it spawns" heatmap
// and the quadrant-biased spawn logic in GameScene.createEnemiesForZone(). Revisit once
// zone maps are final and real per-enemy placement can be authored.
// Les entrées `*_boss` sont ignorées par le spawn de GameScene.createEnemiesForZone()
// (les boss ont une position fixe, pas de tirage aléatoire) — elles existent uniquement
// pour que la future heatmap Bestiaire ait une région à afficher pour chaque boss.
export const ENEMY_SPAWN_REGIONS: Record<string, SpawnRegion[]> = {
  // ── Ignis Reach (Fire) ───────────────────────────────────────
  ember_wyrm:        ['n', 'ne'],
  lava_golem:        ['sw'],
  cinder_sprite:     ['e', 'se'],
  ash_revenant:      ['s'],
  magma_titan:       ['sw'],
  ember_broodmother: ['w'],
  scorch_sentinel:   ['center'],
  pyrath_boss:       ['center'],

  // ── Terravast (Earth) ────────────────────────────────────────
  stone_crawler:     ['sw', 's'],
  crystal_golem:     ['ne'],
  cave_lurker:       ['w'],
  terravast_serpent: ['se'],
  ruin_colossus:     ['center'],
  rune_shard_ghost:  ['n'],
  stone_hound:       ['e'],
  gorvun_boss:       ['center'],

  // ── Zephyr Peaks (Wind) ──────────────────────────────────────
  gale_harpy:    ['n'],
  storm_eagle:   ['ne'],
  wind_wraith:   ['center'],
  cyclone_sprite:['w'],
  sky_titan:     ['se'],
  storm_caller:  ['sw'],
  cloudpiercer:  ['e'],
  sylvael_boss:  ['center'],

  // ── Abyssmar (Water) ─────────────────────────────────────────
  tide_crawler:   ['s'],
  sea_wraith:     ['sw'],
  coral_golem:    ['se'],
  depth_serpent:  ['n'],
  drowned_knight: ['center'],
  tide_shaper:    ['ne'],
  abyssal_shade:  ['w'],
  thalymor_boss:  ['center'],

  // ── Volterra (Lightning) ─────────────────────────────────────
  spark_imp:      ['e'],
  thunder_drake:  ['n'],
  chain_revenant: ['center'],
  volt_hound:     ['w'],
  storm_herald:   ['ne'],
  arc_node:       ['s'],
  grid_architect: ['sw'],
  volkran_boss:   ['center'],

  // ── Glaciem (Ice) ────────────────────────────────────────────
  frost_wolf:        ['n'],
  ice_golem:         ['center'],
  blizzard_wraith:   ['w'],
  permafrost_titan:  ['s'],
  crystal_dragon:    ['ne'],
  glacial_shaper:    ['sw'],
  hoarfrost_stalker: ['e'],
  crysthea_boss:     ['center'],

  // ── Malachar's Spire (Dark) ──────────────────────────────────
  dark_revenant:    ['e'],
  shadow_construct: ['w'],
  void_sentinel:    ['center'],
  void_weaver:      ['n'],
  void_stalker:     ['sw'],
  malachar_boss:    ['center'],
};
