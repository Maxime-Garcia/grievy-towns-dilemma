import type { SpriteBBox } from '../data/spriteGeometry';

export interface SpriteFit {
  dispSize: number;
  bodyW: number;
  bodyH: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Real sprite frames (enemies, NPCs, player) have significant transparent
 * padding around the character — displaying/colliding against the full
 * native frame makes the creature look small and its hitbox balloon far
 * beyond its visible silhouette. This scales the frame so the VISIBLE
 * content reaches `targetContentPx` tall/wide, and returns a hitbox sized
 * and offset to hug that same visible content.
 */
export function fitSpriteToContent(bbox: SpriteBBox, targetContentPx: number): SpriteFit {
  const maxDim = Math.max(bbox.w, bbox.h);
  const scale = targetContentPx / maxDim;
  return {
    dispSize: Math.round(bbox.frameSize * scale),
    bodyW: Math.round(bbox.w * scale),
    bodyH: Math.round(bbox.h * scale),
    offsetX: Math.round(bbox.x * scale),
    offsetY: Math.round(bbox.y * scale),
  };
}
