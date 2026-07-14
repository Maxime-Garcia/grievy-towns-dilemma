import Phaser from 'phaser';
import { ENEMY_MAP } from '../data/enemies';
import { ZONE_MAP } from '../data/zones';
import { getZoneLayout } from '../data/zoneMaps';
import { ENEMY_PATTERN_ASSIGNMENT } from '../data/enemyPatterns';

/**
 * Chargement des sprites d'ennemis — POINT UNIQUE.
 *
 * Historique du problème : PreloaderScene chargeait les 5 strips (idle/walk/
 * attack/damage/dead) des 193 créatures du catalogue, soit 965 fichiers PNG et
 * autant de textures WebGL, AVANT que le menu principal ne s'affiche. Or une zone
 * n'en fait spawner qu'une vingtaine, et Grievy Town — la zone de départ — n'en a
 * AUCUN. On payait donc au boot la quasi-totalité d'un travail dont ~90 % ne sert
 * jamais dans la session en cours.
 *
 * Nouveau contrat :
 *   - GameScene.preload()      → charge la liste EXACTE de la zone où l'on entre
 *                                (Phaser bloque create() tant que le loader tourne :
 *                                 la garantie « sprite présent au spawn » est tenue).
 *   - GameScene.performZoneTransition() → même chose, mais à la volée (ensureEnemyAssets),
 *                                sous le fondu au noir déjà existant.
 *   - AssetStreamScene         → précharge en TÂCHE DE FOND les strips `idle` de TOUTES
 *                                les créatures, car le Bestiaire et l'Arsenal en font
 *                                des portraits (frame 0) pour les ennemis déjà découverts,
 *                                y compris hors de la zone courante.
 *
 * Invariant conservé : le nombre de frames d'une animation reste DÉRIVÉ de la
 * texture (`getFrameNames().length`) — les strips historiques en ont 6, ceux
 * découpés des packs Fantasy Dreamland en ont 4. Aucun `end:` codé en dur.
 */

export const ENEMY_STATES = ['idle', 'walk', 'attack', 'damage', 'dead'] as const;
export type EnemyState = typeof ENEMY_STATES[number];

/**
 * Taille de frame par créature (dépend de la créature source, pas de l'élément).
 * Les 139 créatures Fantasy Dreamland (`fd_*`, scripts/sliceEnemySheets.mjs) sont
 * toutes en 48×48 et sont résolues dynamiquement — les lister à la main serait
 * exactement le genre d'oubli qui a déjà laissé des dizaines d'items sans skin.
 */
const ENEMY_FRAME_SIZE: Record<string, number> = {
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

/** Taille de frame d'une créature, ou `undefined` si elle n'a pas de sprite bitmap. */
export function enemyFrameSize(enemyId: string): number | undefined {
  const fixed: number | undefined = ENEMY_FRAME_SIZE[enemyId];
  if (fixed !== undefined) return fixed;
  // Créatures générées (Fantasy Dreamland) : toutes en 48×48.
  if (enemyId.startsWith('fd_') && ENEMY_MAP[enemyId]) return 48;
  return undefined;
}

/** Toutes les créatures possédant un sprite bitmap (les autres restent procédurales). */
export function allSpritedEnemyIds(): string[] {
  const ids = new Set<string>(Object.keys(ENEMY_FRAME_SIZE));
  for (const id of Object.keys(ENEMY_MAP)) {
    if (id.startsWith('fd_')) ids.add(id);
  }
  return [...ids];
}

/**
 * Liste EXACTE des créatures qu'une zone peut faire apparaître :
 *   - `zone.enemies` (spawner aléatoire, fd_* inclus via GENERATED_ZONE_ENEMIES) ;
 *   - le boss de zone ;
 *   - les `fixedEnemies` du layout (mannequins DEV, gated par flag) ;
 *   - les sbires invoqués (`summonMinionId`) par n'importe lequel des précédents —
 *     sinon une invocation en plein combat tomberait sur un carré procédural.
 */
export function enemyIdsForZone(zoneId: string): string[] {
  const ids = new Set<string>();

  const zone = ZONE_MAP[zoneId];
  if (zone) {
    for (const id of zone.enemies) ids.add(id);
    if (zone.bossId) ids.add(zone.bossId);
  }

  const layout = getZoneLayout(zoneId);
  for (const placement of layout.fixedEnemies ?? []) ids.add(placement.id);

  // Sbires invoqués — deuxième passe sur l'ensemble déjà constitué.
  for (const id of [...ids]) {
    const minionId = ENEMY_PATTERN_ASSIGNMENT[id]?.summonMinionId;
    if (minionId) ids.add(minionId);
  }

  // Ne garder que celles qui ont réellement un sprite bitmap.
  return [...ids].filter(id => enemyFrameSize(id) !== undefined);
}

/** Clé de texture d'un strip. Convention `enemy_<id>_<state>` (cf. CLAUDE.md). */
export function enemyTextureKey(enemyId: string, state: EnemyState): string {
  return `enemy_${enemyId}_${state}`;
}

/**
 * Met en file d'attente les strips manquants sur le loader de la scène.
 * Ne fait RIEN pour une texture déjà présente — c'est ce qui rend l'appel
 * idempotent et permet de le refaire à chaque entrée de zone sans surcoût.
 *
 * @returns le nombre de fichiers effectivement mis en file.
 */
export function queueEnemySprites(
  scene: Phaser.Scene,
  enemyIds: readonly string[],
  states: readonly EnemyState[] = ENEMY_STATES,
): number {
  let queued = 0;
  for (const enemyId of enemyIds) {
    const size = enemyFrameSize(enemyId);
    if (size === undefined) continue;
    for (const state of states) {
      const key = enemyTextureKey(enemyId, state);
      if (scene.textures.exists(key)) continue;
      scene.load.spritesheet(key, `assets/sprites/enemies/${key}.png`, {
        frameWidth: size,
        frameHeight: size,
      });
      queued++;
    }
  }
  return queued;
}

/**
 * Enregistre les animations des créatures dont les textures sont chargées.
 * Idempotent (`anims.exists`) — appelable à chaque entrée de zone.
 *
 * Le nombre de frames est DÉRIVÉ de la texture, jamais codé en dur : strips
 * historiques = 6 frames, strips Fantasy Dreamland = 4. Un `end: 5` fixe
 * produirait des frames fantômes sur les seconds.
 */
export function registerEnemyAnimations(scene: Phaser.Scene, enemyIds: readonly string[]): void {
  const STATE_CONFIG: Record<EnemyState, { frameRate: number; repeat: number }> = {
    idle:   { frameRate: 5,  repeat: -1 },
    walk:   { frameRate: 8,  repeat: -1 },
    attack: { frameRate: 10, repeat: 0 },
    damage: { frameRate: 10, repeat: 0 },
    dead:   { frameRate: 8,  repeat: 0 },
  };

  for (const enemyId of enemyIds) {
    for (const state of ENEMY_STATES) {
      const key = enemyTextureKey(enemyId, state);
      if (!scene.textures.exists(key)) continue;
      if (scene.anims.exists(key)) continue;
      const frameCount = scene.textures.get(key).getFrameNames().length;
      if (frameCount === 0) continue;
      const { frameRate, repeat } = STATE_CONFIG[state];
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(key, { start: 0, end: frameCount - 1 }),
        frameRate,
        repeat,
      });
    }
  }
}

/**
 * Garantit que les sprites + animations d'une liste de créatures sont disponibles,
 * puis appelle `onReady`.
 *
 * Chemin rapide : si tout est déjà en cache (zone déjà visitée dans la session),
 * `onReady` est appelé SYNCHRONEMENT — aucune frame perdue sur un aller-retour en
 * ville. Sinon on démarre le loader de la scène et on attend `COMPLETE`.
 *
 * `once` sur COMPLETE (et non `on`) : le loader d'une scène est réutilisé à chaque
 * transition, un listener persistant rejouerait la transition précédente.
 */
export function ensureEnemyAssets(
  scene: Phaser.Scene,
  enemyIds: readonly string[],
  onReady: () => void,
): void {
  const queued = queueEnemySprites(scene, enemyIds);

  if (queued === 0) {
    registerEnemyAnimations(scene, enemyIds);
    onReady();
    return;
  }

  const finish = () => {
    registerEnemyAnimations(scene, enemyIds);
    onReady();
  };

  // Un 404 (sprite absent du disque) déclenche `loaderror`, pas `complete`… mais
  // Phaser émet quand même `complete` en fin de file, erreurs comprises. La
  // créature retombe alors sur le carré procédural de GameScene (`ensureTexture`),
  // exactement comme avant cette passe : jamais de blocage sur un asset manquant.
  scene.load.once(Phaser.Loader.Events.COMPLETE, finish);
  scene.load.start();
}
