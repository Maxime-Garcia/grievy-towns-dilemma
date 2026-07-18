// Panneau ÉQUIPEMENT partagé entre InventoryScene (hors run) et RunBagScene
// ('view'/'extract', intra-run) — même principe que StatsPanel.ts : une seule
// source pour ce qui est RÉELLEMENT identique entre les deux écrans (capture
// de référence du créateur, 18/07), pour ne plus jamais avoir à corriger le
// même bug deux fois (cf. le fix wrapLabel du 19/07, dupliqué à la main dans
// les deux scènes faute de ce partage).
//
// Le rendu d'un slot OCCUPÉ reste scene-specific (callback `renderOccupied`) :
// InventoryScene y ajoute un cadre asset + interactivité (survol/clic/détail),
// RunBagScene reste purement visuel — unifier ce comportement changerait le
// gameplay de l'un des deux écrans, ce qui dépasse un refactor de présentation.

import Phaser from 'phaser';
import { PlayerState, Item, RARITY_COLORS } from '../types';
import { UI, TYPE, uiStyle, wrapLabel, strokeDashedRect } from './UITheme';
import { t } from '../i18n';

export type EquipSlotKey =
  | 'helm' | 'chest' | 'legs' | 'boots' | 'gloves'
  | 'weapon' | 'cape' | 'ring1' | 'ring2' | 'amulet';

/** Disposition EXACTE de la capture de référence du créateur (18/07) :
 *    casque   | arme
 *    plastron | cape
 *    jambes   | bague 1
 *    bottes   | bague 2
 *    gants    | amulette */
export const EQ_ORDER: readonly EquipSlotKey[] = [
  'helm', 'cape', 'chest', 'gloves', 'weapon', 'legs', 'boots', 'ring1', 'ring2', 'amulet',
];

export const PAPERDOLL_POS: Record<EquipSlotKey, { col: 0 | 1; row: number }> = {
  helm:   { col: 0, row: 0 }, weapon: { col: 1, row: 0 },
  chest:  { col: 0, row: 1 }, cape:   { col: 1, row: 1 },
  legs:   { col: 0, row: 2 }, ring1:  { col: 1, row: 2 },
  boots:  { col: 0, row: 3 }, ring2:  { col: 1, row: 3 },
  gloves: { col: 0, row: 4 }, amulet: { col: 1, row: 4 },
};

/** Taille d'un slot d'équipement — alignée sur la grille du sac (48px). */
export const EQ_SLOT = 48;

const ROW_GAP_Y = 14;
/** Décalage Y du haut de la rangée 0 par rapport au haut du panneau — commun
 *  aux deux scènes (titre de panneau + filet, cf. rowY des deux implémentations
 *  d'origine, valeurs identiques avant ce refactor). */
const ROW0_OFFSET_Y = 38;

export interface PanelBounds { x: number; y: number; w: number; h: number }

export function equipRowY(bounds: PanelBounds, row: number): number {
  return bounds.y + ROW0_OFFSET_Y + row * (EQ_SLOT + ROW_GAP_Y);
}

export interface EquipmentPanelOpts {
  /** Marge horizontale entre le bord du panneau et chaque colonne de slots —
   *  14 dans InventoryScene, 16 dans RunBagScene à l'origine ; gardé en
   *  paramètre pour ne régresser aucun des deux pixel-perfect. */
  colInset: number;
  /** Rendu d'un slot OCCUPÉ — scene-specific (cf. en-tête du fichier). */
  renderOccupied: (ctx: { sx: number; sy: number; key: EquipSlotKey; item: Item; rarHex: number }) => void;
}

/**
 * Rend le sprite du joueur (ou un repli silhouette procédurale) entre les deux
 * colonnes du paperdoll. Identique dans les deux scènes avant ce refactor pour
 * le CAS NORMAL (texture présente) — extrait tel quel. Nuance relevée en revue
 * de code : l'ancien RunBagScene n'avait PAS de repli silhouette (juste rien si
 * la texture manquait) ; ce composant partagé lui en donne un, comme
 * InventoryScene en avait déjà un. Sans risque en pratique (`player_idle` est
 * chargée une fois au boot dans PreloaderScene, toujours présente en jeu réel),
 * mais c'est une unification, pas une extraction strictement neutre.
 */
export function renderPlayerSprite(
  scene: Phaser.Scene,
  bounds: PanelBounds,
  push: (go: Phaser.GameObjects.GameObject) => void,
): void {
  const cx = bounds.x + bounds.w / 2;
  const cySprite = Math.round((equipRowY(bounds, 0) + equipRowY(bounds, 4) + EQ_SLOT) / 2);
  const sprite = scene.textures.exists('player_idle')
    ? scene.add.image(cx, cySprite, 'player_idle', 0)
    : scene.textures.exists('player')
      ? scene.add.image(cx, cySprite, 'player')
      : null;
  if (sprite) {
    sprite.setScale(Math.max(2, Math.floor(120 / Math.max(1, sprite.height))));
    push(sprite);
    return;
  }
  // Repli : silhouette procédurale (teinte arcane) si aucune texture joueur
  const silG = scene.add.graphics();
  silG.fillStyle(UI.ACCENT_ARCANE, 0.05);
  silG.fillCircle(cx, equipRowY(bounds, 0) + 20, 22);
  silG.lineStyle(1, UI.ACCENT_ARCANE, 0.14);
  silG.strokeCircle(cx, equipRowY(bounds, 0) + 20, 22);
  const bodyTop = equipRowY(bounds, 0) + 44;
  const bodyBot = equipRowY(bounds, 4) + EQ_SLOT - 8;
  silG.fillStyle(UI.ACCENT_ARCANE, 0.04);
  silG.fillRoundedRect(cx - 22, bodyTop, 44, bodyBot - bodyTop, 20);
  silG.lineStyle(1, UI.ACCENT_ARCANE, 0.11);
  silG.strokeRoundedRect(cx - 22, bodyTop, 44, bodyBot - bodyTop, 20);
  push(silG);
}

/**
 * Rend les 10 slots du paperdoll : occupés via le callback scene-specific,
 * vides via le traitement partagé (bordure pointillée + libellé fantôme
 * TOUJOURS complet, wrapLabel, jamais d'ellipse). N'inclut PAS le sprite
 * (cf. renderPlayerSprite, appelé séparément) ni le nom/niveau (positionnement
 * réellement différent entre les deux scènes, cf. commentaire en fin de
 * fonction) — chaque appelant garde ces deux blocs.
 */
export function renderEquipmentPanel(
  scene: Phaser.Scene,
  bounds: PanelBounds,
  player: PlayerState,
  push: (go: Phaser.GameObjects.GameObject) => void,
  opts: EquipmentPanelOpts,
): void {
  const { x: PX, w: PW } = bounds;
  const colX: [number, number] = [PX + opts.colInset, PX + PW - opts.colInset - EQ_SLOT];

  for (const key of EQ_ORDER) {
    const pos = PAPERDOLL_POS[key];
    const sx = colX[pos.col];
    const sy = equipRowY(bounds, pos.row);
    const item = player.equipment[key] as Item | undefined;

    if (item) {
      const rarHex = parseInt((RARITY_COLORS[item.rarity] ?? '#666666').replace('#', ''), 16);
      opts.renderOccupied({ sx, sy, key, item, rarHex });
      continue;
    }

    // Slot vide : bordure POINTILLÉE grise + libellé fantôme TOUJOURS complet
    // (capture créateur : jamais de "CO…") — wrapLabel coupe en plusieurs
    // lignes mesurées plutôt que de tronquer (cf. fix du 19/07).
    const g = scene.add.graphics();
    g.fillStyle(UI.SLOT_BG, 0.94);
    g.fillRoundedRect(sx, sy, EQ_SLOT, EQ_SLOT, 5);
    strokeDashedRect(g, sx, sy, EQ_SLOT, EQ_SLOT, UI.SLOT_BORDER, { alpha: 1, lineWidth: 1 });
    push(g);

    const style = uiStyle(TYPE.SMALL, UI.TXT_HINT, { bold: true, align: 'center' });
    const full  = t(`inventory.slot_short.${key}`).toUpperCase();
    const label = wrapLabel(scene, full, style, EQ_SLOT - 4);
    push(scene.add.text(sx + EQ_SLOT / 2, sy + EQ_SLOT / 2, label, style).setOrigin(0.5));
  }
  // Nom/niveau du joueur SCIEMMENT PAS partagé ici : InventoryScene l'ancre
  // juste sous le paperdoll (rowY(4)+EQ_SLOT+16) tandis que RunBagScene l'ancre
  // près du bas du panneau (eqB.h-64) — différence réelle et déjà existante
  // entre les deux écrans, pas une divergence accidentelle à corriger en douce
  // dans ce refactor de présentation. Chaque scène garde ce bloc.
}
