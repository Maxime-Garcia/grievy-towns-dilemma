// src/data/bestiary.ts
// Données statiques du Bestiaire — rempli par content-agent.
// Ce fichier ne contient que des données pures : zero Phaser, zero import de types du moteur.

export interface BestiaryDropData {
  itemId: string;
  dropRatePct: number;  // 0-100
  isHidden: boolean;    // si true → affiché "???" jusqu'au premier loot
}

export interface BestiaryEnemyData {
  enemyId: string;
  name: string;
  habitat: string;
  shortDesc: string;    // affiché immédiatement à la découverte
  lore: string;         // débloqué après premier kill
  drops: BestiaryDropData[];
}

export const BESTIARY_DATA: BestiaryEnemyData[] = [
  // rempli par content-agent
];

export function getBestiaryEntry(enemyId: string): BestiaryEnemyData | undefined {
  return BESTIARY_DATA.find(e => e.enemyId === enemyId);
}
