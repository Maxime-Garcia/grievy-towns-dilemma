// Config VFX du sceau de drop par rareté — la COULEUR vient exclusivement de
// RARITY_COLORS (src/types/index.ts), source de vérité canonique. Tout le
// reste (label FR, intensité VFX) est propre à FloatingItemDrop et n'a pas
// vocation à être réutilisé ailleurs.
import { ItemRarity, RARITY_COLORS } from '../types';

export type RarityKey =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'
  | 'hidden';

// Ordre de puissance croissante — piloté toute logique qui scale avec la rareté
// (ex: nombre de sparks orbitales dans FloatingItemDrop).
export const RARITY_ORDER: readonly RarityKey[] = [
  'common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'hidden',
];

const KEY_TO_ITEM_RARITY: Record<RarityKey, ItemRarity> = {
  common: ItemRarity.COMMON,
  uncommon: ItemRarity.UNCOMMON,
  rare: ItemRarity.RARE,
  epic: ItemRarity.EPIC,
  legendary: ItemRarity.LEGENDARY,
  mythic: ItemRarity.MYTHIC,
  hidden: ItemRarity.HIDDEN,
};

const hexStringToNumber = (hex: string): number => parseInt(hex.replace('#', ''), 16);

export interface RarityVFXConfig {
  key: RarityKey;
  label: string;
  /** Numérique (0xRRGGBB), dérivé de RARITY_COLORS — jamais codé en dur. */
  color: number;
  /** Forme string, telle qu'exposée par RARITY_COLORS — pratique pour les tints CSS/UI. */
  colorHex: string;
  /**
   * Frame/texture de l'épée pour cette rareté. PLACEHOLDER : aucune spritesheet
   * `items_sword` par rareté n'existe encore dans le repo (les armes sont des
   * images séparées `wpn_<type>`, cf. PreloaderScene.ts ~L180). Ce champ est
   * réservé pour recevoir le vrai frame index le jour où l'asset arrive — en
   * attendant, DropDemoScene ignore ce champ et réutilise `wpn_sword` tel quel
   * pour les 7 raretés.
   */
  swordFrame: number;
  /** Intensité du postFX.addGlow (outerStrength), croît avec la rareté. */
  glow: number;
  /** Densité des scintillements (twinkle emitter) — plus haut = plus fréquent. */
  sparkRate: number;
  /** Multiplicateur de vitesse des anneaux de runes (plus haut = plus rapide). */
  ringSpeedMul: number;
}

// Barème élargi vs spec "indicative" : progression quasi géométrique, sinon les
// paliers du milieu (Rare/Épique) sont indifférenciables à l'œil — le glow postFX
// est le signal le plus faible, la densité de sparks et la vitesse des anneaux
// portent la lecture de rareté.
export const RARITY_VFX: Record<RarityKey, RarityVFXConfig> = {
  common: {
    key: 'common', label: 'Commun',
    color: hexStringToNumber(RARITY_COLORS[ItemRarity.COMMON]),
    colorHex: RARITY_COLORS[ItemRarity.COMMON],
    swordFrame: 0, glow: 1.0, sparkRate: 0.20, ringSpeedMul: 1.0,
  },
  uncommon: {
    key: 'uncommon', label: 'Peu Commun',
    color: hexStringToNumber(RARITY_COLORS[ItemRarity.UNCOMMON]),
    colorHex: RARITY_COLORS[ItemRarity.UNCOMMON],
    swordFrame: 0, glow: 1.2, sparkRate: 0.30, ringSpeedMul: 1.1,
  },
  rare: {
    key: 'rare', label: 'Rare',
    color: hexStringToNumber(RARITY_COLORS[ItemRarity.RARE]),
    colorHex: RARITY_COLORS[ItemRarity.RARE],
    swordFrame: 0, glow: 1.6, sparkRate: 0.45, ringSpeedMul: 1.25,
  },
  epic: {
    key: 'epic', label: 'Épique',
    color: hexStringToNumber(RARITY_COLORS[ItemRarity.EPIC]),
    colorHex: RARITY_COLORS[ItemRarity.EPIC],
    swordFrame: 0, glow: 2.1, sparkRate: 0.65, ringSpeedMul: 1.45,
  },
  legendary: {
    key: 'legendary', label: 'Légendaire',
    color: hexStringToNumber(RARITY_COLORS[ItemRarity.LEGENDARY]),
    colorHex: RARITY_COLORS[ItemRarity.LEGENDARY],
    swordFrame: 0, glow: 2.7, sparkRate: 0.90, ringSpeedMul: 1.7,
  },
  mythic: {
    key: 'mythic', label: 'Mythique',
    color: hexStringToNumber(RARITY_COLORS[ItemRarity.MYTHIC]),
    colorHex: RARITY_COLORS[ItemRarity.MYTHIC],
    swordFrame: 0, glow: 3.4, sparkRate: 1.25, ringSpeedMul: 2.0,
  },
  hidden: {
    key: 'hidden', label: 'Caché',
    color: hexStringToNumber(RARITY_COLORS[ItemRarity.HIDDEN]),
    colorHex: RARITY_COLORS[ItemRarity.HIDDEN],
    swordFrame: 0, glow: 4.2, sparkRate: 1.70, ringSpeedMul: 2.4,
  },
};

export function rarityKeyToItemRarity(key: RarityKey): ItemRarity {
  return KEY_TO_ITEM_RARITY[key];
}

export function getRarityConfig(key: RarityKey): RarityVFXConfig {
  return RARITY_VFX[key];
}
