// Textures runtime partagées pour FloatingItemDrop — générées UNE FOIS par
// instance de jeu (garde via textures.exists) et réutilisées par tous les
// drops, quelle que soit la rareté (le tint/blend fait la différence visuelle).
import Phaser from 'phaser';

export const SPARK_TEXTURE = 'fx_spark';
export const GLOW_TEXTURE = 'fx_soft_glow';
// 3e texture partagée (en plus des 2 demandées par la spec) : le dust "carrés"
// a besoin de son propre motif, la réutilisation du spark/glow ne rendait pas
// le grain carré demandé. Reste mutualisée à l'identique du principe demandé.
export const SQUARE_TEXTURE = 'fx_square';
/** Taille réelle de fx_soft_glow, générée dans drawGlowTexture() — exportée pour
 *  que FloatingItemDrop.ts dérive ses scales SANS redéclarer ce chiffre en dur
 *  (un changement ici casserait silencieusement les scales sans erreur TS). */
export const GLOW_TEXTURE_SIZE = 64;

export function ensureVFXTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(SPARK_TEXTURE)) drawSparkTexture(scene);
  if (!scene.textures.exists(GLOW_TEXTURE)) drawGlowTexture(scene);
  if (!scene.textures.exists(SQUARE_TEXTURE)) drawSquareTexture(scene);
}

function drawSparkTexture(scene: Phaser.Scene): void {
  const S = 16;
  const cx = S / 2;
  const cy = S / 2;
  const g = scene.make.graphics();
  g.fillStyle(0xffffff, 1);
  // Étoile 4 branches concave : 8 points alternant rayon extérieur/intérieur.
  const outer = 8;
  const inner = 2.4;
  const pts: Phaser.Types.Math.Vector2Like[] = [];
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 4) * i - Math.PI / 2;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  g.fillPoints(pts, true);
  g.generateTexture(SPARK_TEXTURE, S, S);
  g.destroy();
  scene.textures.get(SPARK_TEXTURE).setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function drawGlowTexture(scene: Phaser.Scene): void {
  const S = GLOW_TEXTURE_SIZE;
  const cx = S / 2;
  const cy = S / 2;
  const g = scene.make.graphics();
  // Fausse radiale : anneaux concentriques d'alpha croissant vers le centre,
  // du plus grand rayon (peu opaque) au plus petit (quasi plein) — pas de
  // vrai gradient radial en Graphics/Canvas sans shader dédié.
  const rings = 16;
  for (let i = rings; i >= 1; i--) {
    const r = (i / rings) * (S / 2);
    const alpha = Math.pow(1 - i / rings, 2);
    g.fillStyle(0xffffff, alpha);
    g.fillCircle(cx, cy, r);
  }
  g.generateTexture(GLOW_TEXTURE, S, S);
  g.destroy();
  scene.textures.get(GLOW_TEXTURE).setFilter(Phaser.Textures.FilterMode.NEAREST);
}

function drawSquareTexture(scene: Phaser.Scene): void {
  const S = 4;
  const g = scene.make.graphics();
  g.fillStyle(0xffffff, 1);
  g.fillRect(0, 0, S, S);
  g.generateTexture(SQUARE_TEXTURE, S, S);
  g.destroy();
  scene.textures.get(SQUARE_TEXTURE).setFilter(Phaser.Textures.FilterMode.NEAREST);
}
