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
  /**
   * Réglage FIN des fenêtres, par ennemi. Fusionné par-dessus le catalogue PATTERNS.
   *
   * Un boss ne peut pas partager ses temps avec un mob de base : un pattern se juge
   * au temps qu'il LAISSE au joueur, pas aux dégâts qu'il enlève. C'est ici qu'on
   * chiffre le telegraph, la fenêtre de riposte et le temps mort. Cf. `pyrath_boss`.
   */
  windows?: Partial<Record<AttackPatternId, Partial<PatternConfig>>>;
}

export const ENEMY_PATTERN_ASSIGNMENT: Record<string, EnemyPatternAssignment> = {

  // ── IGNIS REACH ─────────────────────────────────────────────────────────
  ember_wyrm:        { primary: 'charge',      secondary: 'melee_basic' },
  lava_golem:        { primary: 'charge',      secondary: 'melee_basic' },
  cinder_sprite:     { primary: 'burst_fan',   secondary: 'homing',        minRangeForPattern: 60 },
  ash_revenant:      { primary: 'burst_fan',   secondary: 'homing' },
  magma_titan:       { primary: 'charge',      secondary: 'circular_burst' },
  // secondary était `melee_basic` : la broodmother est un LANCEUR (damageType MAGIC),
  // sa magie ne serait donc jamais sortie — summon + mêlée, aucun canal magique.
  // Elle crache des braises entre deux pontes.
  ember_broodmother: { primary: 'summon',      secondary: 'burst_fan',     summonMinionId: 'cinder_sprite' },
  scorch_sentinel:   { primary: 'melee_basic', secondary: 'charge' },

  /**
   * ── PYRATH — LE BOSS PILOTE. Ses fenêtres, en millisecondes. ────────────────
   *
   * Un boss se juge au TEMPS QU'IL LAISSE, pas à ce qu'il enlève. Voici le contrat,
   * et il est vérifiable au chronomètre :
   *
   *   circular_burst — LE CHÂTIMENT (8 projectiles radiaux, magiques → MDEF)
   *     telegraph ............ 900 ms   (le plus long du jeu ; il est IMMOBILE)
   *     exécution ............ 600 ms
   *     FENÊTRE DE RIPOSTE ... 2400 ms  ← le temps mort. ~4 coups d'épée.
   *     cycle ................ 3900 ms
   *
   *   charge — LA PRESSION (physique → DEF)
   *     telegraph ............ 500 ms   (plus long que les 400 ms d'un trash :
   *                                      un boss annonce plus FORT, pas moins)
   *     exécution ............ 600 ms
   *     FENÊTRE DE RIPOSTE ... 1400 ms
   *     cycle ................ 2500 ms
   *     Parade : un pas LATÉRAL l'évite entièrement (la cible est gelée au départ
   *     du telegraph). Ce n'est pas une question de PV, c'est une question de lecture.
   *
   *   summon — LE TOURNANT (à 50% PV, une seule fois)
   *     telegraph ............ 1200 ms  ← le boss est VULNÉRABLE et immobile :
   *                                      c'est une fenêtre de dégâts OFFERTE.
   *
   * Temps de réaction humain ≈ 250 ms. Le telegraph le plus court de Pyrath (500 ms)
   * laisse donc 250 ms de déplacement après lecture — assez pour un pas de côté.
   * Le plus long (900 ms) en laisse 650. Chaque coup pris est évitable, et le joueur
   * peut le SAVOIR : c'est la définition du « difficile ET juste » de la spec.
   *
   * Cycle moyen (70% burst / 30% charge) ≈ 3480 ms → ~17 attaques télégraphiées sur
   * les 60 s de combat visés. Le joueur en encaisse 8 avant de mourir : il a droit à
   * 7 fautes. Ni 3 (injuste), ni 30 (sans enjeu).
   */
  pyrath_boss: {
    primary: 'circular_burst',
    secondary: 'charge',
    summonMinionId: 'ember_wyrm',
    windows: {
      circular_burst: { telegraphMs: 900, cooldownMs: 2400, interruptMs: 600 },
      charge:         { telegraphMs: 500, cooldownMs: 1400, interruptMs: 400 },
      summon:         { telegraphMs: 1200 },
    },
  },

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

// ── LES CRÉATURES QUI N'AVAIENT AUCUN PATTERN ───────────────────────────────
//
// Mesuré : 151 des 186 ennemis spawnables n'étaient dans AUCUNE assignation. Ils
// retombaient tous sur `melee_basic` — un flash rouge de 150 ms et un coup de
// contact. Cent cinquante et une créatures qui font TOUTES la même chose.
//
// Pire : 7 d'entre elles sont des LANCEURS (rune_shard_ghost, storm_caller,
// cloudpiercer, tide_shaper, grid_architect, glacial_shaper, void_weaver). Sans
// pattern à projectile, leur `baseMagicAtk` — la raison même de leur existence —
// ne serait JAMAIS sorti. On leur aurait donné un canal magique qu'elles n'auraient
// jamais pu utiliser.

const HANDMADE_EXTRA: Record<string, EnemyPatternAssignment> = {
  // Lanceurs (damageType: MAGIC) — il leur FAUT un pattern à projectile.
  //
  // AUDIT POST-FIX PROJECTILES (cf. commit du fix spawnProjectile) — deux
  // réassignations, chiffrées par simulation réelle (CombatSystem.enemyRangedDamage
  // + scaledEnemyStats, panel 500 essais/pattern, joueur fraîchement créé) :
  //
  //   rune_shard_ghost (Terravast, profondeur 2, TRASH) était le SEUL ennemi de
  //   profondeur ≤2 avec homing en PRIMARY — la doc de design elle-même réserve le
  //   homing aux zones 3-4+ ("Zones 1-2 = Charge, Burst Fan"). Chiffré : son coup de
  //   homing retire 58,8% des PV d'un joueur non équipé en un seul jet (77 dmg
  //   médian), quasiment le double de terravast_serpent (28,2%, même profondeur,
  //   burst_fan). Rétrogradé en secondary (30% de pick), comme cinder_sprite/
  //   ash_revenant en zone 1 — même traitement, même logique.
  //
  //   grid_architect (Volterra, profondeur 5, TRASH invocateur immobile, spd 35)
  //   était le SEUL invocateur immobile de sa famille (storm_caller, tide_shaper,
  //   glacial_shaper) à porter circular_burst — le pattern 8 projectiles/360°,
  //   catalogué "elite/boss only" dans docs/design/ENEMY_PATTERNS.md §Pattern 3 —
  //   en PRIMARY plutôt que burst_fan. Chiffré : 51,1% des PV d'un joueur non
  //   équipé par jet (67 dmg médian) + 42% de chance de toucher un joueur
  //   totalement IMMOBILE à sa propre portée d'attaque (90px, Monte Carlo 20000
  //   essais) — une TRASH qui frappe à l'échelle d'une élite. Aligné sur le
  //   patron de ses pairs invocateurs immobiles : burst_fan primary / homing
  //   secondary (identique à storm_caller).
  rune_shard_ghost:  { primary: 'burst_fan',   secondary: 'homing' },
  storm_caller:      { primary: 'burst_fan',   secondary: 'homing' },
  cloudpiercer:      { primary: 'burst_fan',   secondary: 'homing',      minRangeForPattern: 60 },
  tide_shaper:       { primary: 'homing',      secondary: 'burst_fan' },
  grid_architect:    { primary: 'burst_fan',   secondary: 'homing' },
  glacial_shaper:    { primary: 'homing',      secondary: 'burst_fan' },
  void_weaver:       { primary: 'circular_burst', secondary: 'homing' },
  // Traqueurs physiques.
  stone_hound:       { primary: 'dash_melee',  secondary: 'melee_basic' },
  abyssal_shade:     { primary: 'dash_melee',  secondary: 'melee_basic' },
  arc_node:          { primary: 'burst_fan',   secondary: 'melee_basic' },
  hoarfrost_stalker: { primary: 'dash_melee',  secondary: 'charge' },
  void_stalker:      { primary: 'dash_melee',  secondary: 'charge' },
};

/**
 * ARCHÉTYPES GÉNÉRÉS (`fd_*`, scripts/genEnemies.mjs) — un pattern par famille.
 *
 * 139 créatures partagent 4 archétypes lisibles dans leur id. Leur donner un
 * pattern par famille coûte 4 lignes et rend 139 ennemis distincts d'un mob de base.
 * La densité fait la difficulté : encore faut-il que les corps qui la composent ne
 * fassent pas tous exactement la même chose.
 */
const ARCHETYPE_PATTERNS: { prefix: string; assignment: EnemyPatternAssignment }[] = [
  // Nuées : rapides, fragiles, nombreuses — elles fondent sur le joueur.
  { prefix: 'fd_swarm',  assignment: { primary: 'dash_melee', secondary: 'melee_basic' } },
  // Bêtes : elles chargent en ligne droite. Un pas de côté suffit.
  { prefix: 'fd_beast',  assignment: { primary: 'charge',     secondary: 'melee_basic' } },
  // Seigneurs (élites) : charge + châtiment radial.
  { prefix: 'fd_lord',   assignment: { primary: 'charge',     secondary: 'circular_burst' } },
  // Tyrans (élites) : châtiment radial + fonte. Les plus lourds.
  { prefix: 'fd_tyrant', assignment: { primary: 'circular_burst', secondary: 'dash_melee' } },
];

/** Returns the pattern assignment for a given enemy ID, or null if not configured. */
export function getEnemyPatternAssignment(enemyId: string): EnemyPatternAssignment | null {
  const direct = ENEMY_PATTERN_ASSIGNMENT[enemyId] ?? HANDMADE_EXTRA[enemyId];
  if (direct) return direct;
  const arch = ARCHETYPE_PATTERNS.find(a => enemyId.startsWith(a.prefix));
  return arch ? arch.assignment : null;
}

/**
 * Config EFFECTIVE d'un pattern pour un ennemi donné : le catalogue PATTERNS,
 * fusionné avec les `windows` de cet ennemi s'il en déclare.
 *
 * C'est le SEUL point d'où GameScene doit lire les temps d'un pattern. Lire
 * `PATTERNS[id]` directement ignorerait silencieusement les fenêtres du boss — et
 * un boss réglé dans la data mais pas dans le moteur, c'est un boss non réglé.
 */
export function resolvePattern(enemyId: string, patternId: AttackPatternId): PatternConfig {
  const w = getEnemyPatternAssignment(enemyId)?.windows?.[patternId];
  return w ? { ...PATTERNS[patternId], ...w } : PATTERNS[patternId];
}
