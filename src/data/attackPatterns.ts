import { WeaponType } from '../types';

// ============================================================
// ATTACK PATTERNS — la cadence et la géométrie de chaque type d'arme.
//
// Données PURES (zéro import Phaser) : c'est ce qui permet de les SIMULER hors
// du jeu. Elles vivaient dans GameScene.ts, donc le harnais de simulation en
// gardait une COPIE À LA MAIN (.tmp/lib.ts) — et une copie diverge toujours.
// Le bug du BOW l'a prouvé : le harnais lui prêtait un cône de portée 400 alors
// que l'arme réelle n'a AUCUN hit de cône (`hits: []`, elle tire un projectile).
// Toute mesure de DPS de l'arc était donc fausse. Un modèle qui recopie ses
// entrées ne mesure pas le jeu : il mesure la copie.
// ============================================================

export interface AttackHit {
  /** ms depuis (windupMs + début de l'attaque) */
  delay: number;
  range: number;
  halfArc: number;
  /** multiplicateur par-dessus les dégâts de base de CombatSystem — 1.0 = normal */
  damageMultiplier: number;
}

export interface AttackPattern {
  hits: AttackHit[];
  /** ms avant que le joueur puisse ré-attaquer */
  cooldown: number;
  /** ms avant le premier coup (sensation de charge des armes lourdes) */
  windupMs?: number;
  /** si vrai, l'arme tire un projectile physique au lieu d'un cône instantané */
  isProjectile?: boolean;
}

export const ATTACK_PATTERNS: Partial<Record<WeaponType, AttackPattern>> = {
  [WeaponType.DAGGER]: {
    hits: [{ delay: 0, range: 85, halfArc: Math.PI / 3, damageMultiplier: 1.0 }],
    cooldown: 400,
  },
  [WeaponType.DUAL_DAGGER]: {
    hits: [
      { delay: 0,   range: 85, halfArc: Math.PI / 3, damageMultiplier: 0.7 },
      { delay: 150, range: 85, halfArc: Math.PI / 3, damageMultiplier: 0.7 },
    ],
    cooldown: 500,
  },
  [WeaponType.SWORD]: {
    hits: [{ delay: 0, range: 115, halfArc: Math.PI / 3, damageMultiplier: 1.0 }],
    cooldown: 600,
  },
  [WeaponType.DUAL_SWORD]: {
    hits: [
      { delay: 0,   range: 105, halfArc: 11 * Math.PI / 18, damageMultiplier: 0.6 },
      { delay: 180, range: 105, halfArc: 11 * Math.PI / 18, damageMultiplier: 0.6 },
      { delay: 360, range: 105, halfArc: 11 * Math.PI / 18, damageMultiplier: 0.8 },
    ],
    cooldown: 800,
  },
  [WeaponType.GREATSWORD]: {
    hits: [{ delay: 0, range: 155, halfArc: 5 * Math.PI / 12, damageMultiplier: 1.8 }],
    cooldown: 1100,
    windupMs: 300,
  },
  [WeaponType.AXE]: {
    hits: [{ delay: 0, range: 125, halfArc: 11 * Math.PI / 18, damageMultiplier: 1.3 }],
    cooldown: 700,
    windupMs: 150,
  },
  [WeaponType.HAMMER]: {
    // +30% d'arc (Math.PI * 0.65 ≈ 117°) + multiplicateur massif
    hits: [{ delay: 0, range: 105, halfArc: Math.PI * 0.65, damageMultiplier: 2.5 }],
    cooldown: 1300,
    windupMs: 400,
  },
  [WeaponType.STAFF]: {
    hits: [{ delay: 0, range: 260, halfArc: Math.PI / 12, damageMultiplier: 1.0 }],
    cooldown: 700,
  },
  [WeaponType.BOW]: {
    // Flèche physique — les dégâts tombent à la collision, pas via un hit de cône
    // programmé. Le VFX (spawnArrowVfx) est purement cosmétique ; c'est le corps
    // physique qui décide du toucher. `hits: []` n'est donc PAS un oubli.
    hits: [],
    cooldown: 900,
    windupMs: 200,
    isProjectile: true,
  },
  [WeaponType.SPEAR]: {
    // ESTOC — l'identité de la lance est l'ALLONGE, pas la zone : la portée la plus
    // longue de toute la mêlée (175, devant le greatsword à 155), mais le cône le
    // plus étroit du jeu (20°, contre 60° pour l'épée). On perce une cible alignée,
    // on ne fauche pas une foule. Double coup (piqué-retrait) pour le rythme.
    hits: [
      { delay: 0,   range: 175, halfArc: Math.PI / 9, damageMultiplier: 0.85 },
      { delay: 130, range: 175, halfArc: Math.PI / 9, damageMultiplier: 0.65 },
    ],
    cooldown: 750,
    windupMs: 100,
  },
};

export const FISTS_PATTERN: AttackPattern = {
  hits: [
    { delay: 0,   range: 65, halfArc: Math.PI / 2.4, damageMultiplier: 0.5 },
    { delay: 200, range: 65, halfArc: Math.PI / 2.4, damageMultiplier: 0.5 },
  ],
  cooldown: 500,
};

/** Dégâts de la flèche du BOW (projectile physique — cf. fireArrowProjectile). */
export const BOW_ARROW_DAMAGE_MULT = 1.0;
/** Portée de vol de la flèche, px (fireArrowProjectile.RANGE). */
export const BOW_ARROW_RANGE = 460;

// ============================================================
// LA VITESSE D'ATTAQUE — ce qui se compresse, et ce qui ne se compresse pas.
// ============================================================
//
// L'aspd divise le COOLDOWN. Si elle ne divisait QUE lui, le personnage garderait
// une animation de longueur fixe dans un cycle qui rétrécit : à aspd 1,8 le marteau
// passerait 55% de son cycle en armement (contre 31% aujourd'hui, 400/1300) et
// aurait l'air BLOQUÉ à charger. Figer le windup croit protéger l'identité de
// l'arme ; en réalité il la déforme. En compressant, le ratio reste exactement
// 31% — la signature rythmique de l'arme est PRÉSERVÉE.
//
// Mais tout ne peut pas rétrécir sans fin : sous ~60 ms l'œil FUSIONNE deux
// impacts (ils deviennent un seul coup plus fort), et un windup réduit à rien
// n'annonce plus le coup. D'où les deux planchers.

/** Le windup ne se compresse jamais en dessous de 50% de sa valeur de base. */
export const ASPD_WINDUP_FLOOR = 0.5;
/** Un délai intra-pattern ne descend jamais sous 60 ms — en dessous, l'œil fusionne les impacts. */
export const HIT_DELAY_FLOOR_MS = 60;
/** Marge minimale entre le DERNIER coup d'un pattern et le début du suivant. */
export const PATTERN_SEPARATION_MS = 80;

/** Windup effectif à une aspd donnée (compressé, plancher à 50%). */
export function effectiveWindupMs(pattern: AttackPattern, aspd: number): number {
  const w = pattern.windupMs ?? 0;
  if (w <= 0) return 0;
  return Math.max(w / aspd, w * ASPD_WINDUP_FLOOR);
}

/** Délai intra-pattern effectif (compressé, plancher à HIT_DELAY_FLOOR_MS). */
export function effectiveHitDelayMs(delay: number, aspd: number): number {
  if (delay <= 0) return 0;
  return Math.max(delay / aspd, HIT_DELAY_FLOOR_MS);
}

/** Instant (ms depuis le début de l'attaque) où part le DERNIER coup du pattern. */
export function patternLastHitMs(hits: readonly AttackHit[], pattern: AttackPattern, aspd: number): number {
  const lastDelay = hits.length ? Math.max(...hits.map(h => h.delay)) : 0;
  return effectiveWindupMs(pattern, aspd) + effectiveHitDelayMs(lastDelay, aspd);
}

/**
 * PLANCHER D'INTÉGRITÉ DU PATTERN — le mur mécanique, pas économique.
 *
 * Une attaque ne peut pas être relancée AVANT que la précédente ait fini de
 * sortir ses coups : sinon les patterns se chevauchent et le combat devient
 * illisible (deux séries de coups qui partent en même temps, sans que le joueur
 * puisse relier un impact à une entrée).
 *
 * Ce n'est pas théorique. `NO_ATTACK_COOLDOWN` (hidden_temporal_blade) fixe le
 * cooldown à 250 ms POUR TOUTE ARME — or le pattern de la double épée met 360 ms
 * rien qu'à sortir son 3ᵉ coup. L'objet fait donc DÉJÀ se chevaucher deux patterns
 * aujourd'hui, sans aspd, sur une arme parfaitement normale. Le plancher règle ça.
 *
 * `hits` est passé à part : le FINISHER a ses propres coups (souvent plus longs
 * que ceux de l'attaque normale), et c'est LUI qui doit être protégé quand c'est
 * lui qui vient de partir.
 */
export function effectiveCooldownMs(
  pattern: AttackPattern, aspd: number, rawCooldownMs: number, hits: readonly AttackHit[] = pattern.hits,
): number {
  const floor = patternLastHitMs(hits, pattern, aspd) + PATTERN_SEPARATION_MS;
  return Math.max(rawCooldownMs, floor);
}

/** Cadence affichée : coups par seconde de l'attaque de base, à l'aspd du joueur. */
export function cadencePerSec(pattern: AttackPattern, aspd: number): number {
  return 1000 * aspd / pattern.cooldown;
}
