// src/systems/BestiarySystem.ts
// Système Bestiaire — logique pure, zéro import Phaser.
// Gère la découverte, les kills et la révélation des drops cachés.

import { WorldState, BestiaryEntryState } from '../types';
import { BESTIARY_IDS, getBestiaryEntry } from '../data/bestiary';

export class BestiarySystem {
  /** Retourne l'entrée existante ou en crée une vierge. */
  static getOrCreate(world: WorldState, enemyId: string): BestiaryEntryState {
    if (!world.bestiary) world.bestiary = {};
    if (!world.bestiary[enemyId]) {
      world.bestiary[enemyId] = { discovered: false, killed: false, kills: 0, revealedDrops: [] };
    }
    const entry = world.bestiary[enemyId];
    if (typeof entry.kills !== 'number') entry.kills = 0;
    return entry;
  }

  /** Lecture seule — ne crée pas d'entrée si absente (pour l'affichage UI). */
  static peekEntry(world: WorldState, enemyId: string): BestiaryEntryState {
    const e = world.bestiary?.[enemyId];
    return e
      ? { ...e, kills: e.kills ?? 0 }
      : { discovered: false, killed: false, kills: 0, revealedDrops: [] };
  }

  /** Compteurs globaux pour le header du bestiaire. */
  static counts(world: WorldState): { seen: number; slain: number; total: number } {
    let seen = 0; let slain = 0;
    for (const id of BESTIARY_IDS) {
      const e = world.bestiary?.[id];
      if (e?.discovered) seen++;
      if (e?.killed) slain++;
    }
    return { seen, slain, total: BESTIARY_IDS.length };
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
    entry.kills = (entry.kills ?? 0) + 1;
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

  /** [DEBUG] Débloque instantanément toutes les entrées (vu + tué + tous les drops
   *  cachés révélés) — outil de review de contenu, pas une mécanique de jeu normale. */
  static discoverAll(world: WorldState): void {
    for (const id of BESTIARY_IDS) {
      const entry = this.getOrCreate(world, id);
      entry.discovered = true;
      entry.killed = true;
      const data = getBestiaryEntry(id);
      if (!data) continue;
      for (const drop of data.drops) {
        if (drop.isHidden && !entry.revealedDrops.includes(drop.itemId)) {
          entry.revealedDrops.push(drop.itemId);
        }
      }
    }
  }
}
