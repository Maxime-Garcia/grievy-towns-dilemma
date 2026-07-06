// src/systems/BestiarySystem.ts
// Système Bestiaire — logique pure, zéro import Phaser.
// Gère la découverte, les kills et la révélation des drops cachés.

import { WorldState } from '../types';
import { getBestiaryEntry } from '../data/bestiary';

export class BestiarySystem {
  /** Retourne l'entrée existante ou en crée une vierge. */
  static getOrCreate(world: WorldState, enemyId: string) {
    if (!world.bestiary) world.bestiary = {};
    if (!world.bestiary[enemyId]) {
      world.bestiary[enemyId] = { discovered: false, killed: false, revealedDrops: [] };
    }
    return world.bestiary[enemyId];
  }

  /** Retourne true si c'est la première découverte (pour déclencher la notif). */
  static discover(world: WorldState, enemyId: string): boolean {
    const entry = this.getOrCreate(world, enemyId);
    if (entry.discovered) return false;
    entry.discovered = true;
    return true;
  }

  /** Retourne true si c'est le premier kill (pour débloquer le lore). */
  static recordKill(world: WorldState, enemyId: string): boolean {
    const entry = this.getOrCreate(world, enemyId);
    if (entry.killed) return false;
    entry.killed = true;
    return true;
  }

  /** Retourne true si c'est le premier drop de cet item hidden (pour le révéler). */
  static revealDrop(world: WorldState, enemyId: string, itemId: string): boolean {
    const entry = this.getOrCreate(world, enemyId);
    const data = getBestiaryEntry(enemyId);
    if (!data) return false;
    const drop = data.drops.find(d => d.itemId === itemId && d.isHidden);
    if (!drop) return false;
    if (entry.revealedDrops.includes(itemId)) return false;
    entry.revealedDrops.push(itemId);
    return true;
  }

  /** Vérifie si un drop caché a déjà été révélé. */
  static isDropRevealed(world: WorldState, enemyId: string, itemId: string): boolean {
    const entry = world.bestiary?.[enemyId];
    return entry?.revealedDrops.includes(itemId) ?? false;
  }
}
