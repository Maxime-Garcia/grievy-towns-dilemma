import Phaser from 'phaser';
import { allSpritedEnemyIds, queueEnemySprites } from '../utils/EnemyAssets';

/**
 * Scène de service — ne rend RIEN, ne prend aucune entrée.
 *
 * Depuis que les sprites d'ennemis sont chargés par zone (cf. EnemyAssets.ts), le
 * boot ne connaît plus les 193 créatures du catalogue. Or le Bestiaire et l'Arsenal
 * affichent le PORTRAIT (frame 0 du strip `idle`) de toute créature déjà découverte
 * — y compris celles d'une zone qu'on ne visite pas dans la session courante, parce
 * que la découverte est persistée dans la sauvegarde.
 *
 * Cette scène rattrape ce cas SANS repayer le boot : lancée juste avant le menu
 * principal, elle télécharge en tâche de fond le seul strip `idle` de chaque
 * créature (193 fichiers au lieu de 965), par petits lots espacés pour ne jamais
 * bloquer le thread principal ni voler de la bande passante à un chargement de zone.
 *
 * Si un portrait n'est pas encore arrivé, les deux scènes retombent déjà sur leur
 * placeholder (`textures.exists` gardé des deux côtés) — la dégradation est
 * transitoire et purement cosmétique, jamais un crash.
 */
export class AssetStreamScene extends Phaser.Scene {
  constructor() { super({ key: 'AssetStreamScene', active: false }); }

  /** Fichiers par lot — assez petit pour que l'upload GPU tienne dans une frame. */
  private static readonly BATCH_SIZE = 16;
  /** Respiration entre deux lots (ms) — laisse le rendu et les entrées passer. */
  private static readonly BATCH_DELAY = 120;

  private pending: string[] = [];
  private batchTimer?: Phaser.Time.TimerEvent;

  create(): void {
    this.pending = allSpritedEnemyIds();
    this.scheduleNextBatch(0);

    // Une scène de service ne doit jamais survivre à son propre travail : sans ça,
    // le timer continuerait de tourner après un retour au menu principal.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  private cleanup(): void {
    this.batchTimer?.remove();
    this.batchTimer = undefined;
    this.load.off(Phaser.Loader.Events.COMPLETE, this.onBatchComplete, this);
  }

  private scheduleNextBatch(delay: number): void {
    this.batchTimer?.remove();
    this.batchTimer = this.time.delayedCall(delay, this.loadNextBatch, undefined, this);
  }

  private loadNextBatch(): void {
    if (this.pending.length === 0) {
      // Plus rien à faire — la scène se retire d'elle-même.
      this.scene.stop();
      return;
    }

    // Priorité absolue au chargement de zone : GameScene tient la garantie « sprite
    // présent au moment du spawn », pas nous. Tant que son loader tourne, on attend —
    // ça évite aussi de demander deux fois le même fichier.
    //
    // Reste une fenêtre étroite : un lot déjà EN VOL au moment où GameScene.preload()
    // démarre peut porter un strip `idle` que la zone demande aussi (textures.exists
    // est encore faux des deux côtés). Les deux requêtes partent, la seconde arrivée
    // est refusée par le TextureManager (clé déjà prise) et Phaser log une erreur.
    // C'est BÉNIN — la texture finit correcte dans tous les cas, et le coût est au
    // pire de BATCH_SIZE petits fichiers redemandés une fois dans la session.
    // ⚠ `scene.load` n'est PAS installé tant que la scène n'a pas booté (les plugins
    // locaux le sont dans Systems.init(), depuis SceneManager.bootScene()). Or on
    // tourne justement AVANT que GameScene n'existe vraiment — au menu principal.
    // Un `gameScene.load.isLoading()` direct lèverait un TypeError. D'où le cast
    // explicite en `| undefined` : le typage Phaser le déclare non-nullable, il ment
    // pour une scène jamais démarrée.
    //
    // `scene.isActive('GameScene')` ne conviendrait pas non plus : pendant preload(),
    // le statut est START et non RUNNING — isActive() serait faux exactement au
    // moment où l'on veut céder la priorité.
    const gameLoader = this.scene.get('GameScene')?.load as Phaser.Loader.LoaderPlugin | undefined;
    if (gameLoader?.isLoading()) {
      this.scheduleNextBatch(AssetStreamScene.BATCH_DELAY);
      return;
    }

    const batch = this.pending.splice(0, AssetStreamScene.BATCH_SIZE);
    // `['idle']` uniquement : c'est tout ce dont les portraits ont besoin. Les 4 autres
    // états (walk/attack/damage/dead) ne servent qu'en combat, donc dans une zone —
    // et sont donc chargés par GameScene.preload()/ensureEnemyAssets().
    const queued = queueEnemySprites(this, batch, ['idle']);

    if (queued === 0) {
      // Lot entièrement déjà en cache (zone déjà visitée) — enchaîner sans attendre.
      this.loadNextBatch();
      return;
    }

    this.load.once(Phaser.Loader.Events.COMPLETE, this.onBatchComplete, this);
    this.load.start();
  }

  private onBatchComplete(): void {
    this.scheduleNextBatch(AssetStreamScene.BATCH_DELAY);
  }
}
