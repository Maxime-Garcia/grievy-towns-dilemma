import { RunState, PlayerState, WorldState, ElementType, Item } from '../types';
import { RunBagSystem } from './RunBagSystem';
import { LootSystem } from './LootSystem';

// Orchestration de la run (RunSystem, docs/design/ROGUELITE_POC.md). Logique pure,
// zéro dépendance Phaser — consomme MapGenSystem (indirectement, via seed+legIndex
// stockés ici, jamais la ZoneLayout elle-même) et RunBagSystem. GameScene est le
// seul point qui possède gameState.run : ce système mute une RunState existante ou
// en construit une nouvelle, mais ne décide jamais lui-même de la remettre à null —
// c'est à l'appelant (GameScene) de le faire après avoir lu le résultat, cf. Phase 4.

const BASE_QUOTA = 12;
const QUOTA_GROWTH_PER_LEG = 1.4;
/** Escalade "simple" décidée par le créateur pour cette tranche (pas de vraie
 *  courbe de difficulté encore) — un vrai passage balance-agent viendra une fois
 *  la boucle jouable. */
const ENEMY_STAT_GROWTH_PER_LEG = 0.35;

export class RunSystem {

  static quotaForLeg(legIndex: number): number {
    return Math.round(BASE_QUOTA * Math.pow(QUOTA_GROWTH_PER_LEG, legIndex));
  }

  /** Multiplicateur appliqué aux stats ennemies APRÈS spawn — même motif que la
   *  promotion élite existante (GameScene.ts), jamais via enemyScaling.ts/ZONE_DEPTH
   *  (table indexée par zoneId, candidate au teardown de l'ancien monde). */
  static enemyStatMultiplier(legIndex: number): number {
    return 1 + legIndex * ENEMY_STAT_GROWTH_PER_LEG;
  }

  static startRun(
    player: PlayerState,
    biome: ElementType,
    consumableLoadout: (Item | null)[] = [],
  ): RunState {
    const { safeBag, ordinaryBag } = RunBagSystem.createEmptyBags(
      player.runSafeSlotCapacity,
      player.runBagCapacity - player.runSafeSlotCapacity,
    );
    return {
      active: true,
      biome,
      seed: Math.floor(Math.random() * 0xffffffff),
      legIndex: 0,
      quotaTarget: this.quotaForLeg(0),
      quotaKilled: 0,
      phase: 'exploring',
      safeBag,
      ordinaryBag,
      consumableLoadout: consumableLoadout.map(item => item ? { item, quantity: 1 } : null),
      startedAt: Date.now(),
    };
  }

  /** +1 kill vers le quota. Renvoie true si le quota vient d'être atteint CE
   *  kill-ci (transition 'exploring' -> 'boss_fight') — GameScene s'en sert pour
   *  savoir quand faire disparaître les mobs restants et spawn le boss. */
  static registerKill(run: RunState): boolean {
    if (run.phase !== 'exploring') return false;
    run.quotaKilled++;
    if (run.quotaKilled >= run.quotaTarget) {
      run.phase = 'boss_fight';
      return true;
    }
    return false;
  }

  static onBossDefeated(run: RunState): void {
    run.phase = 'awaiting_choice';
  }

  /**
   * Les slots sûrs migrent vers la banque (player.inventory), les ordinaires sont
   * perdus. `run.active` passe à false — GameScene met gameState.run à null après
   * cet appel. Renvoie les items qui n'ont PAS pu être transférés (banque pleine,
   * cas limite) pour feedback UI — normalement toujours vide.
   */
  static exfiltrate(player: PlayerState, run: RunState, world?: WorldState): Item[] {
    const failed: Item[] = [];
    for (const slot of run.safeBag) {
      if (!slot) continue;
      const ok = LootSystem.addToInventory(player, slot.item, slot.quantity, world);
      if (!ok) failed.push(slot.item);
    }
    RunBagSystem.wipe(run);
    run.active = false;
    return failed;
  }

  /** Nouvelle carte (même biome), quota plus grand, stats ennemies plus hautes —
   *  le sac (safe + ordinaire) est conservé tel quel, rien ne migre vers la banque. */
  static continueRun(run: RunState): void {
    run.legIndex++;
    run.quotaTarget = this.quotaForLeg(run.legIndex);
    run.quotaKilled = 0;
    run.phase = 'exploring';
  }

  /** Mort en run : sac entièrement perdu (rien ne revient à la banque), run.active
   *  passe à false — GameScene met gameState.run à null et renvoie vers Grievy Town
   *  (jamais performZoneTransition sur la même zone : la carte vient d'être invalidée). */
  static onPlayerDeath(run: RunState): void {
    RunBagSystem.wipe(run);
    run.active = false;
  }
}
