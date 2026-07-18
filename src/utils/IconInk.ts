// Normalisation de taille d'icône par EMPREINTE VISIBLE (bounding-box du
// contenu opaque), pas par dimensions de canvas — deux icônes 32×32 peuvent
// avoir des tailles perçues très différentes si l'une remplit tout le cadre
// et l'autre dessine un petit motif fin et centré.
//
// PREMIÈRE VERSION (abandonnée) : normaliser par SURFACE de pixels opaques
// ("encre"). Testée en jeu par le créateur — résultat disproportionné dans
// l'autre sens : une épée fine tracée en diagonale a PEU de pixels opaques
// malgré une grande portée visuelle (bounding-box en coin-à-coin), donc la
// surface la sous-évaluait et le facteur 1/aire la faisait grossir énormément
// à côté d'un anneau compact qui remplit mieux son propre cadre. L'œil compare
// la PORTÉE d'une forme (jusqu'où elle s'étend), pas sa densité de pixels —
// d'où le passage à un footprint linéaire (plus grande dimension de la
// bounding-box), qui traite un trait fin coin-à-coin et un disque de même
// portée comme "aussi grands", conformément à la perception.
//
// Lecture pixel via un canvas offscreen dédié (un seul getImageData sur toute
// la frame, pas un appel par pixel comme TextureManager.getPixel — ce dernier
// fait un drawImage+getImageData PAR PIXEL, bien trop lent pour scanner une
// icône entière). Résultats mis en cache par clé de texture+frame : ce calcul
// ne doit tourner qu'une fois par icône réellement rencontrée en jeu.

import Phaser from 'phaser';

export interface IconInkMetrics {
  /** Nombre de pixels dont l'alpha dépasse le seuil — gardé pour diagnostic. */
  inkArea: number;
  /** Bounding box du contenu opaque. */
  boundsW: number;
  boundsH: number;
  /** max(boundsW, boundsH) — la métrique utilisée pour le rescale (cf. en-tête du fichier). */
  footprint: number;
}

// Sous ce seuil (0-255), un pixel est considéré comme un résidu d'anti-aliasing
// et ignoré — sinon un halo translucide de 1px autour de chaque icône gonflerait
// artificiellement leur surface mesurée.
const ALPHA_THRESHOLD = 16;

const FALLBACK_METRICS: IconInkMetrics = { inkArea: 1, boundsW: 1, boundsH: 1, footprint: 1 };

const metricsCache = new Map<string, IconInkMetrics>();

let scratchCanvas: HTMLCanvasElement | null = null;
let scratchCtx: CanvasRenderingContext2D | null = null;

function getScratchContext(w: number, h: number): CanvasRenderingContext2D | null {
  if (!scratchCanvas) {
    scratchCanvas = document.createElement('canvas');
    // willReadFrequently : on va appeler getImageData beaucoup plus souvent que
    // drawImage sur ce canvas au fil d'une session — évite l'avertissement
    // navigateur et la bascule silencieuse vers un backend plus lent après coup.
    scratchCtx = scratchCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (!scratchCtx) return null;
  scratchCanvas.width = w;
  scratchCanvas.height = h;
  return scratchCtx;
}

function computeMetrics(scene: Phaser.Scene, key: string, frame?: string | number): IconInkMetrics {
  const cacheKey = `${key}::${frame ?? ''}`;
  const cached = metricsCache.get(cacheKey);
  if (cached) return cached;

  const textureFrame = scene.textures.getFrame(key, frame);
  if (!textureFrame) {
    metricsCache.set(cacheKey, FALLBACK_METRICS);
    return FALLBACK_METRICS;
  }

  // cutX/cutY/cutWidth/cutHeight = rectangle réel de la frame DANS l'image
  // source (gère les spritesheets/atlas et le trim) — jamais la taille du
  // canvas nominal.
  const w = textureFrame.cutWidth;
  const h = textureFrame.cutHeight;
  if (w <= 0 || h <= 0) {
    metricsCache.set(cacheKey, FALLBACK_METRICS);
    return FALLBACK_METRICS;
  }

  // Texture compressée (Uint8Array) : pas un CanvasImageSource, jamais le cas
  // pour des icônes d'items — repli neutre plutôt qu'un crash sur ce chemin.
  const image = textureFrame.source.image;
  if (image instanceof Uint8Array) {
    metricsCache.set(cacheKey, FALLBACK_METRICS);
    return FALLBACK_METRICS;
  }

  const ctx = getScratchContext(w, h);
  if (!ctx) {
    metricsCache.set(cacheKey, FALLBACK_METRICS);
    return FALLBACK_METRICS;
  }

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(
    image,
    textureFrame.cutX, textureFrame.cutY, w, h,
    0, 0, w, h,
  );

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, w, h);
  } catch {
    // Image taintée (cross-origin) — ne devrait jamais arriver sur des assets
    // bundlés localement, mais un repli neutre vaut mieux qu'une exception qui
    // casserait le spawn d'un item.
    metricsCache.set(cacheKey, FALLBACK_METRICS);
    return FALLBACK_METRICS;
  }

  const data = imageData.data;
  let inkArea = 0;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > ALPHA_THRESHOLD) {
        inkArea++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const boundsW = maxX - minX + 1;
  const boundsH = maxY - minY + 1;
  const metrics: IconInkMetrics = inkArea > 0
    ? { inkArea, boundsW, boundsH, footprint: Math.max(boundsW, boundsH) }
    : FALLBACK_METRICS;
  metricsCache.set(cacheKey, metrics);
  return metrics;
}

/** Mesure brute — exposée pour du diagnostic (ex: un futur écran de debug). */
export function getIconInkMetrics(scene: Phaser.Scene, key: string, frame?: string | number): IconInkMetrics {
  return computeMetrics(scene, key, frame);
}

// Bornes de sécurité : une icône quasi vide (erreur de mesure, texture de
// repli 1×1) ne doit jamais produire un facteur délirant qui ferait disparaître
// ou exploser visuellement un item.
const MIN_SCALE = 0.5;
// Remonté de 2.2 (hérité de l'ancienne métrique en racine carrée) à 3.0 : en
// footprint linéaire, une icône très filiforme peut légitimement avoir besoin
// d'un facteur plus élevé pour rattraper la référence sans rester trop petite.
const MAX_SCALE = 3.0;

/**
 * Facteur multiplicatif à appliquer à l'échelle "native" d'une icône pour que
 * son EMPREINTE (plus grande dimension de sa bounding-box opaque) soit
 * comparable à `targetFootprint` (mesuré sur une icône de référence jugée
 * bien proportionnée par l'appelant). Facteur linéaire — le footprint est
 * déjà une dimension, pas une aire, donc pas de racine carrée ici.
 */
export function getIconInkScale(
  scene: Phaser.Scene,
  key: string,
  frame: string | number | undefined,
  targetFootprint: number,
): number {
  const { footprint } = computeMetrics(scene, key, frame);
  const scale = targetFootprint / footprint;
  return Phaser.Math.Clamp(scale, MIN_SCALE, MAX_SCALE);
}
