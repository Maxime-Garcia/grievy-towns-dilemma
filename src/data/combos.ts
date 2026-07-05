import { WeaponType } from '../types';

export interface ComboFinisherEffect {
  stunMs?: number;
  knockback?: number;
  aoeRadius?: number;
  bleed?: boolean;
  expose?: boolean;
  sunder?: boolean;
  guardMs?: number;
  pierceCount?: number;
  elemental?: boolean;
}

export interface ComboFinisher {
  hits: Array<{ delay: number; range: number; halfArc: number; damageMultiplier: number }>;
  effect?: ComboFinisherEffect;
  cooldownMult: number;
}

export interface ComboConfig {
  chainLength: number;
  graceMs: number;
  finisher: ComboFinisher;
}

export const COMBO_CONFIGS: Partial<Record<WeaponType, ComboConfig>> = {
  [WeaponType.DAGGER]: {
    chainLength: 5,
    graceMs: 160,
    finisher: {
      hits: [
        { delay: 0,   range: 85, halfArc: Math.PI / 6, damageMultiplier: 0.73 },
        { delay: 60,  range: 85, halfArc: Math.PI / 6, damageMultiplier: 0.73 },
        { delay: 120, range: 85, halfArc: Math.PI / 6, damageMultiplier: 0.73 },
      ],
      effect: { expose: true },
      cooldownMult: 1.2,
    },
  },

  [WeaponType.DUAL_DAGGER]: {
    chainLength: 4,
    graceMs: 200,
    finisher: {
      hits: Array.from({ length: 6 }, (_, i) => ({
        delay: i * 60,
        range: 95,
        halfArc: Math.PI,
        damageMultiplier: 0.45,
      })),
      effect: { knockback: 60 },
      cooldownMult: 1.2,
    },
  },

  [WeaponType.SWORD]: {
    chainLength: 4,
    graceMs: 240,
    finisher: {
      hits: [{ delay: 0, range: 140, halfArc: Math.PI / 8, damageMultiplier: 2.0 }],
      effect: { knockback: 120, guardMs: 1000 },
      cooldownMult: 1.2,
    },
  },

  [WeaponType.DUAL_SWORD]: {
    chainLength: 3,
    graceMs: 320,
    finisher: {
      hits: [
        { delay: 0,   range: 105, halfArc: 7 * Math.PI / 18, damageMultiplier: 1.6 },
        { delay: 140, range: 105, halfArc: 7 * Math.PI / 18, damageMultiplier: 1.6 },
      ],
      effect: { bleed: true },
      cooldownMult: 1.2,
    },
  },

  [WeaponType.GREATSWORD]: {
    chainLength: 3,
    graceMs: 440,
    finisher: {
      hits: [{ delay: 0, range: 165, halfArc: Math.PI, damageMultiplier: 3.1 }],
      effect: { knockback: 180, aoeRadius: 165 },
      cooldownMult: 1.2,
    },
  },

  [WeaponType.AXE]: {
    chainLength: 4,
    graceMs: 280,
    finisher: {
      hits: [{ delay: 0, range: 125, halfArc: 11 * Math.PI / 18, damageMultiplier: 2.6 }],
      effect: { sunder: true },
      cooldownMult: 1.2,
    },
  },

  [WeaponType.HAMMER]: {
    chainLength: 2,
    graceMs: 450,
    finisher: {
      hits: [{ delay: 0, range: 130, halfArc: Math.PI, damageMultiplier: 3.8 }],
      effect: { stunMs: 1000, aoeRadius: 130 },
      cooldownMult: 1.2,
    },
  },

  [WeaponType.STAFF]: {
    chainLength: 4,
    graceMs: 280,
    finisher: {
      hits: [{ delay: 0, range: 300, halfArc: Math.PI / 12, damageMultiplier: 2.0 }],
      effect: { pierceCount: 99, elemental: true },
      cooldownMult: 1.2,
    },
  },

  [WeaponType.BOW]: {
    chainLength: 3,
    graceMs: 360,
    finisher: {
      hits: [
        { delay: 0,  range: 460, halfArc: Math.PI / 18, damageMultiplier: 0.6 },
        { delay: 30, range: 460, halfArc: Math.PI / 18, damageMultiplier: 0.6 },
        { delay: 60, range: 460, halfArc: Math.PI / 18, damageMultiplier: 0.6 },
      ],
      effect: { pierceCount: 1 },
      cooldownMult: 1.2,
    },
  },
};
