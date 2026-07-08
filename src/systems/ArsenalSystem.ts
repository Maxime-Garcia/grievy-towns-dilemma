// src/systems/ArsenalSystem.ts
// Système Arsenal — pendant du Bestiaire pour les armes/armures. Logique pure,
// zéro import Phaser. Contrairement au Bestiaire, pas d'étape "kill" : un
// équipement est entièrement débloqué (stats + lore) dès sa première obtention.

import { WorldState, ArsenalEntryState, ItemType } from '../types';
import { ALL_ITEMS } from '../data/items';

/** Types d'objets considérés comme "équipement" pour l'Arsenal (armes + armures/accessoires). */
export const ARSENAL_ITEM_TYPES: ReadonlySet<ItemType> = new Set([
  ItemType.WEAPON, ItemType.HELM, ItemType.CHEST, ItemType.LEGS,
  ItemType.BOOTS, ItemType.GLOVES, ItemType.CAPE, ItemType.RING, ItemType.AMULET,
]);

/** Tous les ids d'équipement du jeu (armes + armures + accessoires), ordre `ALL_ITEMS`. */
export const ARSENAL_IDS: string[] = Object.values(ALL_ITEMS)
  .filter(item => ARSENAL_ITEM_TYPES.has(item.type))
  .map(item => item.id);

export class ArsenalSystem {
  /** Retourne l'entrée existante ou en crée une vierge. */
  static getOrCreate(world: WorldState, itemId: string): ArsenalEntryState {
    if (!world.arsenal) world.arsenal = {};
    if (!world.arsenal[itemId]) world.arsenal[itemId] = { discovered: false };
    return world.arsenal[itemId];
  }

  /** Lecture seule — ne crée pas d'entrée si absente (pour l'affichage UI). */
  static peekEntry(world: WorldState, itemId: string): ArsenalEntryState {
    return world.arsenal?.[itemId] ?? { discovered: false };
  }

  /** Compteurs globaux pour le header de l'Arsenal. */
  static counts(world: WorldState): { seen: number; total: number } {
    let seen = 0;
    for (const id of ARSENAL_IDS) {
      if (world.arsenal?.[id]?.discovered) seen++;
    }
    return { seen, total: ARSENAL_IDS.length };
  }

  /**
   * Marque un item comme découvert s'il s'agit d'équipement (arme/armure/accessoire).
   * Retourne true si c'est la première découverte (pour une éventuelle notif future).
   * Pas d'effet pour les consommables/matériaux/clés/skins.
   */
  static discover(world: WorldState, itemId: string): boolean {
    const item = ALL_ITEMS[itemId];
    if (!item || !ARSENAL_ITEM_TYPES.has(item.type)) return false;
    const entry = this.getOrCreate(world, itemId);
    if (entry.discovered) return false;
    entry.discovered = true;
    return true;
  }
}
