import { RunState, RunBagSlot, Item } from '../types';

// Sac de run (RunSystem, docs/design/ROGUELITE_POC.md §3) : 20 emplacements FIXES
// dont 4 sûrs — "sûr" est une propriété de POSITION (l'index dans safeBag), pas de
// l'objet. Chemin délibérément séparé de LootSystem.addToInventory (sac de 400
// emplacements croissant de la banque de Grievy Town) : sémantique incompatible,
// cf. exploration du chantier RunSystem. rollLoot() reste réutilisé pour le tirage
// lui-même, seule la destination change (RunSystem branche ça).

export type RunBagKind = 'safe' | 'ordinary';

export interface AddToRunBagResult {
  ok: boolean;
  /** Message explicite à afficher côté scène si ok=false — jamais un échec silencieux. */
  reason?: string;
}

export class RunBagSystem {

  private static bagFor(run: RunState, kind: RunBagKind): (RunBagSlot | null)[] {
    return kind === 'safe' ? run.safeBag : run.ordinaryBag;
  }

  /** Tente d'empiler sur un slot existant du même item stackable dans le bag visé. */
  private static tryStack(bag: (RunBagSlot | null)[], item: Item, quantity: number): boolean {
    if (!('stackable' in item && (item as any).stackable)) return false;
    const slot = bag.find(s => s && s.item.id === item.id);
    if (!slot) return false;
    const maxStack = (item as any).maxStack ?? 99;
    slot.quantity = Math.min(slot.quantity + quantity, maxStack);
    return true;
  }

  /**
   * Ajoute au sac ORDINAIRE par défaut (c'est là que tombe tout loot de run) — le
   * joueur déplace ensuite lui-même vers les slots sûrs via moveToSafe(). Jamais
   * d'échec silencieux : renvoie un message explicite quand le sac est plein.
   */
  static addToRunBag(run: RunState, item: Item, quantity: number): AddToRunBagResult {
    const bag = run.ordinaryBag;
    if (this.tryStack(bag, item, quantity)) return { ok: true };

    const freeIdx = bag.findIndex(s => s === null);
    if (freeIdx === -1) return { ok: false, reason: 'Sac de run plein' };
    bag[freeIdx] = { item, quantity };
    return { ok: true };
  }

  /** Déplace le contenu d'un slot ordinaire vers un slot sûr précis (échange si occupé). */
  static moveToSafe(run: RunState, ordinaryIndex: number, safeIndex: number): boolean {
    if (ordinaryIndex < 0 || ordinaryIndex >= run.ordinaryBag.length) return false;
    if (safeIndex < 0 || safeIndex >= run.safeBag.length) return false;
    const moving = run.ordinaryBag[ordinaryIndex];
    if (!moving) return false;
    const displaced = run.safeBag[safeIndex];
    run.safeBag[safeIndex] = moving;
    run.ordinaryBag[ordinaryIndex] = displaced;
    return true;
  }

  /** Inverse de moveToSafe — renvoie un objet sûr vers un slot ordinaire précis. */
  static moveToOrdinary(run: RunState, safeIndex: number, ordinaryIndex: number): boolean {
    if (safeIndex < 0 || safeIndex >= run.safeBag.length) return false;
    if (ordinaryIndex < 0 || ordinaryIndex >= run.ordinaryBag.length) return false;
    const moving = run.safeBag[safeIndex];
    if (!moving) return false;
    const displaced = run.ordinaryBag[ordinaryIndex];
    run.ordinaryBag[ordinaryIndex] = moving;
    run.safeBag[safeIndex] = displaced;
    return true;
  }

  /** Vide complètement les deux bags (mort en run) — jamais de retour vers la banque. */
  static wipe(run: RunState): void {
    run.safeBag = run.safeBag.map(() => null);
    run.ordinaryBag = run.ordinaryBag.map(() => null);
  }

  static createEmptyBags(safeCapacity: number, ordinaryCapacity: number): {
    safeBag: (RunBagSlot | null)[];
    ordinaryBag: (RunBagSlot | null)[];
  } {
    // Garde défensive : ROGUELITE_POC.md §3 interdit explicitement que le ratio
    // sûrs/totaux tende vers 1 — un futur bug d'upgrade marchand qui ferait
    // dépasser runSafeSlotCapacity sur runBagCapacity ne doit jamais planter en
    // Array(-N), juste produire un sac ordinaire vide (contrat visiblement dégradé
    // plutôt qu'un crash de scène).
    return {
      safeBag: new Array(Math.max(0, safeCapacity)).fill(null),
      ordinaryBag: new Array(Math.max(0, ordinaryCapacity)).fill(null),
    };
  }
}
