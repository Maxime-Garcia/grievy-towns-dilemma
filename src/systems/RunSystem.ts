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
    // BUG (créateur, 19/07) : les consommables choisis dans l'écran "PRÉPARER LA
    // DESCENTE" n'étaient jamais visibles ni utilisables en run — ils n'étaient
    // stockés QUE dans `consumableLoadout`, un champ que RunBagScene n'a jamais
    // rendu ni rendu interactif (aucun bouton Consommer/Jeter dessus). Le joueur
    // les perdait donc silencieusement : soit rendus à l'exfiltration sans avoir
    // jamais pu s'en servir, soit détruits à la mort sans avoir jamais existé
    // pour lui. Fix minimal : placer directement le loadout dans les SLOTS SÛRS
    // (mêmes garanties voulues pour `consumableLoadout` — revient à coup sûr à
    // l'exfiltration, perdu à la mort — et réutilise l'UI déjà testée du sac de
    // run au lieu d'une barre à part). Contrepartie à surveiller : emporter des
    // consommables mange une partie des 5 slots sûrs normalement destinés au
    // butin trouvé en run — compromis assumé pour corriger l'invisibilité
    // totale, pas encore passé par balance-agent.
    for (const item of consumableLoadout) {
      if (!item) continue;
      // Empile sur un slot existant du même item AVANT d'en ouvrir un nouveau —
      // même convention que RunBagSystem.tryStack/LootSystem.addToInventory.
      // Sans ça, choisir 2× la même potion dans "PRÉPARER LA DESCENTE" ouvrait
      // 2 slots sûrs séparés au lieu d'empiler sur 1 seul (trouvé en revue),
      // aggravant la contrepartie déjà assumée ci-dessus.
      const maxStack = (item as any).maxStack ?? 99;
      const stackSlot = safeBag.find(s => s && s.item.id === item.id && s.quantity < maxStack);
      if (stackSlot) { stackSlot.quantity++; continue; }
      const freeIdx = safeBag.findIndex(s => s === null);
      if (freeIdx === -1) break; // ne devrait pas arriver (MAX_LOADOUT=4 <= capacité sûre par défaut 5)
      safeBag[freeIdx] = { item, quantity: 1 };
    }
    return {
      active: true,
      biome,
      // Point de non-déterminisme UNIQUE et VOLONTAIRE de tout le RunSystem : chaque
      // nouvelle run doit différer. Une fois choisie, cette valeur est stockée et
      // TOUJOURS relue via mixSeed/generateZoneLayout (MapGenSystem) — jamais re-tirée.
      seed: Math.floor(Math.random() * 0xffffffff),
      legIndex: 0,
      quotaTarget: this.quotaForLeg(0),
      quotaKilled: 0,
      phase: 'exploring',
      safeBag,
      ordinaryBag,
      // Laissé vide : le loadout vit désormais dans safeBag (ci-dessus). Le champ
      // reste dans RunState (pas de migration de save nécessaire) — exfiltrate()/
      // onPlayerDeath() continuent de le référencer sans risque (toujours vide,
      // no-op garanti).
      consumableLoadout: [],
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
   * Les slots sûrs ET les consommables non-utilisés migrent vers la banque
   * (player.inventory) — "leur contenu remonte quoi qu'il arrive" (ROGUELITE_POC.md
   * §3), donc un item qui échoue à migrer (banque pleine, cas limite à MAX_SLOTS=400)
   * n'est PAS détruit : il reste dans son slot, `run` reste `active` tant qu'il en
   * reste un, et `failed` le signale pour un blocage UI explicite plutôt qu'une perte
   * silencieuse. Les ordinaires sont TOUJOURS perdus (c'est la règle du jeu, pas un
   * cas d'erreur). `run.active` ne passe à false QUE si tout a bien été transféré —
   * GameScene met alors gameState.run à null.
   */
  static exfiltrate(player: PlayerState, run: RunState, world?: WorldState): Item[] {
    const failed: Item[] = [];
    let allTransferred = true;
    const tryReturnAll = (bag: (RunState['safeBag'][number])[]) => {
      for (let i = 0; i < bag.length; i++) {
        const slot = bag[i];
        if (!slot) continue;
        const ok = LootSystem.addToInventory(player, slot.item, slot.quantity, world);
        if (ok) { bag[i] = null; } else { failed.push(slot.item); allTransferred = false; }
      }
    };
    tryReturnAll(run.safeBag);
    // consumableLoadout est TOUJOURS vide depuis startRun() (fix 19/07, cf. son
    // commentaire) — appel gardé no-op pour ne rien casser si un ancien save
    // (avant le fix) a encore des entrées dedans.
    tryReturnAll(run.consumableLoadout);
    run.ordinaryBag = run.ordinaryBag.map(() => null);
    if (allTransferred) run.active = false;
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

  /** Mort en run : sac ET consommables non-utilisés entièrement perdus (rien ne
   *  revient à la banque — contrairement à exfiltrate, la mort n'a pas de garantie
   *  "quoi qu'il arrive"), run.active passe à false — GameScene met gameState.run à
   *  null et renvoie vers Grievy Town (jamais performZoneTransition sur la même
   *  zone : la carte vient d'être invalidée). */
  static onPlayerDeath(run: RunState): void {
    RunBagSystem.wipe(run);
    run.consumableLoadout = run.consumableLoadout.map(() => null);
    run.active = false;
  }
}
