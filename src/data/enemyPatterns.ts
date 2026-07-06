/**
 * Enemy attack patterns — pure data, zero Phaser.
 *
 * Each EnemyPattern defines a sequence of phases an enemy cycles through in combat.
 * The GameScene AI engine reads these and drives the Phaser sprites accordingly.
 *
 * Design philosophy: "telegraph before punish".
 * Every attack has a visible warning window. The window duration scales with the
 * pattern's danger level — more lethal attacks get longer telegraphs so a reading
 * player can always react.
 */

// ── PATTERN IDENTIFIERS ──────────────────────────────────────────────────────

export type AttackPatternId =
  | 'charge'          // Pattern 1 — line charge after telegraph
  | 'burst_fan'       // Pattern 2 — projectile fan spread
  | 'circular_burst'  // Pattern 3 — 8-direction radial (elite/boss)
  | 'dash_melee'      // Pattern 4 — quick dash + melee combo
  | 'homing'          // Pattern 5 — slow homing projectile
  | 'summon'          // Pattern 6 — boss summon at 50% HP
  | 'melee_basic';    // Fallback — simple contact attack no special telegraph

// ── PATTERN CONFIG ───────────────────────────────────────────────────────────

export interface PatternConfig {
  /** Identifier for the attack pattern. */
  id: AttackPatternId;
  /** ms for the visual telegraph before the attack fires. */
  telegraphMs: number;
  /** Hex tint applied to the sprite during telegraph (0 = no tint change). */
  telegraphTint: number;
  /** ms the ennemi is locked in the post-attack cooldown. */
  cooldownMs: number;
  /** ms the stun/paralysis state lasts when this enemy is hit mid-telegraph. */
  interruptMs: number;
  // ── Pattern-specific params ────────────────────────────────────────────────
  /** charge: speed multiplier applied to base moveSpeed during the dash. */
  chargeSpeedMult?: number;
  /** burst_fan / circular_burst: number of projectiles. */
  projectileCount?: number;
  /** burst_fan: total spread angle in radians. e.g. Math.PI/2 = 90°. */
  spreadAngle?: number;
  /** dash_melee: forward dash distance in px. */
  dashDistance?: number;
  /** homing: projectile speed px/s. */
  homingSpeed?: number;
  /** homing: how many degrees/s the projectile can turn. */
  homingRotateSpeedDeg?: number;
  /** homing: lifetime in ms before despawn. */
  homingLifetimeMs?: number;
  /** summon: number of minions to spawn. */
  minionCount?: number;
  /** summon: enemy id to spawn (must exist in ENEMY_MAP). */
  minionEnemyId?: string;
  /** summon: HP threshold (0–1) that triggers the summon phase. */
  summonHpThreshold?: number;
  /** Damage multiplier applied on top of base enemy ATK. */
  damageMult?: number;
}

// ── PATTERN CATALOGUE ────────────────────────────────────────────────────────
// All timings are in milliseconds.
// Colors: orange 0xff8800 = warning, red 0xff2200 = danger, violet 0x8833cc = magic.

export const PATTERNS: Record<AttackPatternId, PatternConfig> = {

  // ── PATTERN 1 — Charge ──────────────────────────────────────────────────
  // Enemy trembles with orange tint → freezes at target position → rockets forward.
  // Telegraph 400ms (readable but short). Deals high damage on contact.
  // Weak: if player moves laterally, the charge misses entirely.
  charge: {
    id: 'charge',
    telegraphMs: 400,
    telegraphTint: 0xff8800,
    cooldownMs: 800,
    interruptMs: 300,
    chargeSpeedMult: 3.2,
    damageMult: 1.5,
  },

  // ── PATTERN 2 — Burst Fan ───────────────────────────────────────────────
  // Enemy pulses (scale pop) with orange glow → fires 3-5 projectiles in a spread.
  // Telegraph 600ms. Fires toward the player's position at telegraph start.
  // Weak: the fan has gaps — a calm step to one side dodges all projectiles.
  burst_fan: {
    id: 'burst_fan',
    telegraphMs: 600,
    telegraphTint: 0xff6600,
    cooldownMs: 2000,
    interruptMs: 400,
    projectileCount: 4,
    spreadAngle: Math.PI / 3,   // 60° total = 15° between each of 4 shots
    damageMult: 0.8,
  },

  // ── PATTERN 3 — Circular Burst ─────────────────────────────────────────
  // Enemy pulses a large glowing ring → fires 8 projectiles in all directions.
  // Telegraph 800ms (long — this is the boss/elite punishment pattern).
  // Weak: stay close, dodge toward the enemy to pass between projectiles at short range.
  circular_burst: {
    id: 'circular_burst',
    telegraphMs: 800,
    telegraphTint: 0xcc3300,
    cooldownMs: 3000,
    interruptMs: 500,
    projectileCount: 8,
    damageMult: 1.0,
  },

  // ── PATTERN 4 — Dash Melee ─────────────────────────────────────────────
  // Enemy freezes briefly with violet flash → dashes at player → swipes on arrival.
  // Telegraph 350ms (shortest visual — fast pattern, moderate damage).
  // Weak: dash forward slightly to let the enemy overshoot, then punish.
  dash_melee: {
    id: 'dash_melee',
    telegraphMs: 350,
    telegraphTint: 0x8833cc,
    cooldownMs: 1200,
    interruptMs: 200,
    dashDistance: 180,
    damageMult: 1.2,
  },

  // ── PATTERN 5 — Homing ─────────────────────────────────────────────────
  // Enemy glows violet → launches a slow projectile that tracks the player.
  // Telegraph 700ms. Projectile is slow (90px/s) but persistently follows.
  // Weak: lead the projectile into a wall, or outrun it past its 3s lifetime.
  homing: {
    id: 'homing',
    telegraphMs: 700,
    telegraphTint: 0x9933cc,
    cooldownMs: 4000,
    interruptMs: 400,
    homingSpeed: 90,
    homingRotateSpeedDeg: 55,   // deg/s max turn rate
    homingLifetimeMs: 3000,
    damageMult: 1.3,
  },

  // ── PATTERN 6 — Summon ─────────────────────────────────────────────────
  // Boss only. Fires at 50% HP. Enemy teleports to map center → glows gold →
  // spawns 2-3 minions around itself.
  // Telegraph 1000ms — the longest, most dramatic. Boss is vulnerable during it.
  summon: {
    id: 'summon',
    telegraphMs: 1000,
    telegraphTint: 0xffd700,
    cooldownMs: 15000,          // once per fight effectively
    interruptMs: 800,
    minionCount: 3,
    minionEnemyId: '',          // overridden per-enemy in ENEMY_PATTERN_ASSIGNMENT
    summonHpThreshold: 0.5,
    damageMult: 0,
  },

  // ── Fallback — Melee Basic ─────────────────────────────────────────────
  // Simple contact melee with a minimal 150ms red flash. Used for regular enemies
  // that don't have a special pattern but still need *some* visual feedback.
  melee_basic: {
    id: 'melee_basic',
    telegraphMs: 150,
    telegraphTint: 0xff3333,
    cooldownMs: 1200,
    interruptMs: 100,
    damageMult: 1.0,
  },
};

// ── ENEMY → PATTERN ASSIGNMENT ──────────────────────────────────────────────
// Map from enemy ID to the ordered list of patterns they can use.
// The AI picks from this list based on context (range, HP, etc.).
// First entry = default / most frequent. Additional entries = situational.

export interface EnemyPatternAssignment {
  /** Primary pattern — used most often. */
  primary: AttackPatternId;
  /** Secondary pattern — used when conditions allow (elite, HP phase, range). */
  secondary?: AttackPatternId;
  /** Override for summon minion id (bosses only). */
  summonMinionId?: string;
  /** Minimum distance to player before the primary pattern can trigger (px). */
  minRangeForPattern?: number;
}

export const ENEMY_PATTERN_ASSIGNMENT: Record<string, EnemyPatternAssignment> = {

  // ── IGNIS REACH ─────────────────────────────────────────────────────────
  ember_wyrm:        { primary: 'charge',      secondary: 'melee_basic' },
  lava_golem:        { primary: 'charge',      secondary: 'melee_basic' },
  cinder_sprite:     { primary: 'burst_fan',   secondary: 'homing',        minRangeForPattern: 60 },
  ash_revenant:      { primary: 'burst_fan',   secondary: 'homing' },
  magma_titan:       { primary: 'charge',      secondary: 'circular_burst' },
  ember_broodmother: { primary: 'summon',      secondary: 'melee_basic',   summonMinionId: 'cinder_sprite' },
  scorch_sentinel:   { primary: 'melee_basic', secondary: 'charge' },
  pyrath_boss:       { primary: 'circular_burst', secondary: 'charge',     summonMinionId: 'ember_wyrm' },

  // ── TERRAVAST ────────────────────────────────────────────────────────────
  stone_crawler:     { primary: 'dash_melee',  secondary: 'melee_basic' },
  crystal_golem:     { primary: 'charge',      secondary: 'circular_burst' },
  cave_lurker:       { primary: 'dash_melee',  secondary: 'melee_basic' },
  terravast_serpent: { primary: 'charge',      secondary: 'burst_fan' },
  ruin_colossus:     { primary: 'circular_burst', secondary: 'charge',    summonMinionId: 'stone_crawler' },
  gorvun_boss:       { primary: 'circular_burst', secondary: 'charge',    summonMinionId: 'crystal_golem' },

  // ── ZEPHYR PEAKS ────────────────────────────────────────────────────────
  gale_harpy:        { primary: 'dash_melee',  secondary: 'burst_fan' },
  storm_eagle:       { primary: 'burst_fan',   secondary: 'charge' },
  wind_wraith:       { primary: 'homing',      secondary: 'burst_fan' },
  cyclone_sprite:    { primary: 'burst_fan',   secondary: 'melee_basic' },
  sky_titan:         { primary: 'circular_burst', secondary: 'charge',    summonMinionId: 'cyclone_sprite' },
  sylvael_boss:      { primary: 'circular_burst', secondary: 'homing',    summonMinionId: 'storm_eagle' },

  // ── ABYSSMAR ────────────────────────────────────────────────────────────
  tide_crawler:      { primary: 'dash_melee',  secondary: 'melee_basic' },
  sea_wraith:        { primary: 'homing',      secondary: 'burst_fan' },
  coral_golem:       { primary: 'charge',      secondary: 'melee_basic' },
  depth_serpent:     { primary: 'charge',      secondary: 'burst_fan' },
  drowned_knight:    { primary: 'dash_melee',  secondary: 'circular_burst' },
  thalymor_boss:     { primary: 'circular_burst', secondary: 'summon',    summonMinionId: 'tide_crawler' },

  // ── VOLTERRA ─────────────────────────────────────────────────────────────
  spark_imp:         { primary: 'burst_fan',   secondary: 'dash_melee',    minRangeForPattern: 50 },
  thunder_drake:     { primary: 'charge',      secondary: 'burst_fan' },
  chain_revenant:    { primary: 'homing',      secondary: 'dash_melee' },
  volt_hound:        { primary: 'dash_melee',  secondary: 'melee_basic' },
  storm_herald:      { primary: 'circular_burst', secondary: 'homing',    summonMinionId: 'spark_imp' },
  volkran_boss:      { primary: 'circular_burst', secondary: 'charge',    summonMinionId: 'thunder_drake' },

  // ── GLACIEM ──────────────────────────────────────────────────────────────
  frost_wolf:        { primary: 'dash_melee',  secondary: 'charge' },
  ice_golem:         { primary: 'charge',      secondary: 'circular_burst' },
  blizzard_wraith:   { primary: 'homing',      secondary: 'burst_fan' },
  permafrost_titan:  { primary: 'circular_burst', secondary: 'charge',    summonMinionId: 'frost_wolf' },
  crystal_dragon:    { primary: 'circular_burst', secondary: 'homing' },
  crysthea_boss:     { primary: 'circular_burst', secondary: 'summon',    summonMinionId: 'ice_golem' },

  // ── MALACHAR'S SPIRE ─────────────────────────────────────────────────────
  dark_revenant:     { primary: 'homing',      secondary: 'burst_fan' },
  shadow_construct:  { primary: 'dash_melee',  secondary: 'circular_burst' },
  void_sentinel:     { primary: 'circular_burst', secondary: 'homing' },
  malachar_boss:     { primary: 'circular_burst', secondary: 'summon',    summonMinionId: 'shadow_construct' },
};

/** Returns the pattern assignment for a given enemy ID, or null if not configured. */
export function getEnemyPatternAssignment(enemyId: string): EnemyPatternAssignment | null {
  return ENEMY_PATTERN_ASSIGNMENT[enemyId] ?? null;
}
