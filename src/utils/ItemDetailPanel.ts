// Contenu de la popup de détail d'un item (rareté/nom/résonance/stat principale/
// substats/passif/description) — partagé entre InventoryScene (hors run) et
// RunBagScene ('view'/'extract', intra-run). Même principe que StatsPanel.ts/
// EquipmentPanel.ts : factoriser ce qui est RÉELLEMENT identique.
//
// Les boutons d'action (Équiper/Déséquiper/Consommer/Vendre/Jeter/Déplacer/
// Fermer) restent scene-specific — leurs actions et leurs conditions d'affichage
// diffèrent réellement entre la banque et le sac de run (cf. RunBagScene).

import { Item, ItemType, Weapon, Armor, Accessory, Consumable, StatBonus, EquipStats, RARITY_COLORS } from '../types';
import { StatsSystem } from '../systems/StatsSystem';
import { StatRollSystem, isEquipableItem } from '../systems/StatRollSystem';
import { getPassiveEffectLabel } from '../data/passiveEffects';
import {
  UI, TYPE, uiStyle, drawDivider, resonanceColor, formatRangedStatBounds, lineQuality, formatResonanceLine,
} from './UITheme';
import { t, localizeItem } from '../i18n';

export interface PanelBounds { x: number; y: number; w: number; h: number }

// Fenêtre de détection du double-clic (premier clic = détail, second clic
// RAPPROCHÉ sur le MÊME slot = action directe) — partagée entre InventoryScene
// (paperdoll hors run) et RunBagScene (sac + paperdoll intra-run), pour que les
// deux écrans se comportent IDENTIQUEMENT (retour créateur 19/07).
export const DOUBLE_CLICK_MS = 350;

/** Résonance globale (§4/§7.2 LOOT_STAT_ROLLS.md) — null si l'item n'a pas
 *  d'equipRanges calculables (jamais affichée dans ce cas, pas un défaut). */
export function getResonance(item: Item): number | null {
  if (typeof item.rollQuality === 'number') return item.rollQuality;
  if (!isEquipableItem(item) || !item.equipStats || !item.equipRanges) return null;
  return StatRollSystem.computeQuality(item.equipStats, item.equipRanges);
}

/**
 * Ligne de stat principale — valeur RÉELLE de l'instance (jamais la valeur
 * centre du catalogue), teintée par la qualité locale du roll quand
 * `equipRanges` est disponible sur l'instance.
 */
export function getMainStatLineView(item: Item): { text: string; color: string; rangeText?: string } | null {
  const es = (item as { equipStats?: EquipStats }).equipStats;
  if (es) {
    const range = isEquipableItem(item) ? item.equipRanges?.mainStat : undefined;
    const text  = StatsSystem.formatStat(es.mainStat.key, es.mainStat.value, es.mainStat.isPercentage);
    const color = range ? resonanceColor(lineQuality(es.mainStat.value, range.min, range.max) * 100) : UI.TXT_GOLD;
    return { text, color, rangeText: range ? formatRangedStatBounds(range) : undefined };
  }
  if ('damage'  in item) return { text: `ATK : ${(item as Weapon).damage}`, color: UI.TXT_GOLD };
  if ('defense' in item) return { text: `DEF : ${(item as Armor).defense}`, color: UI.TXT_GOLD };
  if (item.type === ItemType.CONSUMABLE) {
    const e = (item as Consumable).effect;
    if (e.hpRestore)   return { text: `HP + ${e.hpRestore}`, color: UI.TXT_GOLD };
    if (e.manaRestore) return { text: `MP + ${e.manaRestore}`, color: UI.TXT_GOLD };
  }
  return null;
}

/** Lignes de substats — même caveat que getMainStatLineView (valeurs d'instance). */
export function getSubstatLineViews(item: Item): { text: string; color: string; rangeText?: string }[] {
  const es = (item as { equipStats?: EquipStats }).equipStats;
  if (es && es.substats.length > 0) {
    const ranges = isEquipableItem(item) ? item.equipRanges?.substats : undefined;
    return es.substats.map((s, i) => {
      const range = ranges?.[i];
      const text  = StatsSystem.formatStat(s.key, s.value, s.isPercentage);
      const color = range ? resonanceColor(lineQuality(s.value, range.min, range.max) * 100) : UI.TXT_PARCHMENT;
      return { text, color, rangeText: range ? formatRangedStatBounds(range) : undefined };
    });
  }

  if (!('bonusStats' in item)) return [];
  const bonus  = (item as Weapon | Armor | Accessory).bonusStats;
  const NAMES: Record<string, string> = {
    hp: 'HP', mana: 'Mana', atk: 'ATK', def: 'DEF', spd: 'SPD',
    magicAtk: 'MATK', magicDef: 'MDEF',
    str: 'FOR', int: 'INT', agi: 'AGI', vit: 'VIT', end: 'END',
  };
  const lines: { text: string; color: string }[] = [];
  for (const [k, v] of Object.entries(bonus as StatBonus)) {
    if (v == null || v === 0) continue;
    lines.push({ text: `${NAMES[k] ?? k} : ${v > 0 ? '+' : ''}${v}`, color: UI.TXT_PARCHMENT });
  }
  return lines;
}

/**
 * Rend l'en-tête + l'identité + les stats + la description d'un item dans le
 * panneau `bounds` (rareté, nom, résonance, stat principale + fourchette,
 * substats + fourchettes, passif, description). N'inclut PAS les boutons
 * d'action (scene-specific, cf. en-tête du fichier) ni le lien "retour" —
 * `onBack` est câblé par l'appelant sur SON propre lien, positionné pareil
 * dans les deux scènes (coin haut-gauche du panneau).
 *
 * Retourne le curseur Y atteint sous la description, pour information (les
 * boutons se positionnent en pratique depuis le BAS du panneau, indépendamment).
 */
export function renderItemDetailContent(
  scene: Phaser.Scene,
  item: Item,
  bounds: PanelBounds,
  push: (go: Phaser.GameObjects.GameObject) => void,
  onBack: () => void,
): number {
  const { x: PX, y: PY, w: PW } = bounds;
  const locItem  = localizeItem(item);
  const rarColor = RARITY_COLORS[item.rarity] ?? UI.TXT_PARCHMENT;

  // ── Header ───────────────────────────────────────────────────────────
  const back = scene.add.text(PX + 12, PY + 8, t('inventory.back_stats'), uiStyle(TYPE.SMALL, UI.TXT_BLUE, { bold: true }));
  const backHit = scene.add.rectangle(
    PX + 12 + back.width / 2, PY + 8 + back.height / 2,
    back.width + 24, 44, 0x000000, 0,
  )
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => back.setColor(UI.TXT_GOLD))
    .on('pointerout',  () => back.setColor(UI.TXT_BLUE))
    .on('pointerdown', onBack);
  push(back); push(backHit);

  push(scene.add.text(PX + PW / 2, PY + 6, t('inventory.detail'), uiStyle(TYPE.BODY, UI.TXT_CYAN, { bold: true })).setOrigin(0.5, 0));

  const sepTop = scene.add.graphics();
  drawDivider(sepTop, PX + 8, PY + 26, PW - 16, UI.ACCENT_ARCANE, 0.22);
  push(sepTop);

  // ── Item identity ─────────────────────────────────────────────────────
  let curY = PY + 38;

  push(scene.add.text(PX + PW / 2, curY, `[${t(`rarity.${item.rarity}`)}]`, uiStyle(TYPE.SMALL, rarColor, { bold: true })).setOrigin(0.5, 0));
  curY += 18;

  const nameTxt = scene.add.text(PX + PW / 2, curY, locItem.name, uiStyle(TYPE.HEADING, rarColor, {
    bold: true, stroke: true, wordWrapWidth: PW - 24, align: 'center',
  })).setOrigin(0.5, 0);
  push(nameTxt);
  curY += nameTxt.height + 10;

  const resonance = getResonance(item);
  if (resonance !== null) {
    const resTxt = scene.add.text(
      PX + PW / 2, curY, formatResonanceLine(resonance),
      uiStyle(9, resonanceColor(resonance), { bold: true }),
    ).setOrigin(0.5, 0);
    push(resTxt);
    curY += resTxt.height + 6;
  }

  const mainView = getMainStatLineView(item);
  if (mainView) {
    const valueTxt = scene.add.text(0, curY, mainView.text, uiStyle(TYPE.BODY, mainView.color, { bold: true, stroke: true }));
    let pairW = valueTxt.width;
    let rangeTxt: Phaser.GameObjects.Text | undefined;
    if (mainView.rangeText) {
      rangeTxt = scene.add.text(0, curY + 3, mainView.rangeText, uiStyle(TYPE.SMALL, UI.TXT_MUTED));
      pairW += 4 + rangeTxt.width;
    }
    let lx = PX + PW / 2 - pairW / 2;
    valueTxt.setPosition(lx, curY);
    lx += valueTxt.width + 4;
    if (rangeTxt) rangeTxt.setPosition(lx, curY + 4);
    push(valueTxt);
    if (rangeTxt) push(rangeTxt);
    curY += valueTxt.height + 10;
  }

  const sepMid = scene.add.graphics();
  drawDivider(sepMid, PX + 8, curY, PW - 16, UI.BORDER_LIT, 0.3);
  push(sepMid);
  curY += 10;

  for (const view of getSubstatLineViews(item)) {
    const bulletTxt = scene.add.text(PX + 16, curY, `• ${view.text}`, uiStyle(TYPE.BODY, view.color));
    push(bulletTxt);
    if (view.rangeText) {
      push(scene.add.text(PX + 16 + bulletTxt.width + 6, curY + 3, view.rangeText, uiStyle(TYPE.SMALL, UI.TXT_MUTED)));
    }
    curY += 20;
  }
  curY += 8;

  const detailPassive = ('passiveEffect' in item && item.passiveEffect)
    ? getPassiveEffectLabel(item.passiveEffect)
    : undefined;
  if (detailPassive) {
    const passiveTxt = scene.add.text(PX + 14, curY,
      `${t('arsenal.passive_label')} ${detailPassive}`,
      uiStyle(TYPE.SMALL, UI.TXT_BLUE, { bold: true, wordWrapWidth: PW - 28, lineSpacing: 4 }));
    push(passiveTxt);
    curY += passiveTxt.height + 8;
  }

  const descTxt = scene.add.text(PX + 14, curY, locItem.description, uiStyle(TYPE.SMALL, UI.TXT_MUTED, {
    italic: true, wordWrapWidth: PW - 28, lineSpacing: 4,
  }));
  push(descTxt);
  curY += descTxt.height;

  return curY;
}

/**
 * Bouton d'action générique du panneau de détail (fond carte + hover + hit
 * zone tactile) — partagé pour que les deux scènes empilent leurs boutons
 * (contextuels, donc scene-specific) de façon visuellement identique.
 * `btnY` est la position de CE bouton ; l'appelant gère l'incrément.
 */
export function addDetailActionButton(
  scene: Phaser.Scene,
  bounds: PanelBounds,
  btnY: number,
  label: string,
  color: string,
  push: (go: Phaser.GameObjects.GameObject) => void,
  onClick: () => void,
  isClosing: () => boolean,
): void {
  const BTN_H = 36;
  const BTN_W = bounds.w - 24;
  const BTN_X = bounds.x + 12;
  const y = btnY;
  const bgGfx = scene.add.graphics();
  bgGfx.fillStyle(UI.BTN_BG, 1);
  bgGfx.fillRoundedRect(BTN_X, y, BTN_W, BTN_H, 4);
  bgGfx.lineStyle(1, UI.BTN_BORDER, 1);
  bgGfx.strokeRoundedRect(BTN_X, y, BTN_W, BTN_H, 4);
  const txt = scene.add.text(BTN_X + BTN_W / 2, y + BTN_H / 2, label, uiStyle(TYPE.BODY, color, { bold: true })).setOrigin(0.5);
  const hit = scene.add.rectangle(BTN_X + BTN_W / 2, y + BTN_H / 2, BTN_W + 6, Math.max(44, BTN_H + 10), 0x000000, 0)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      bgGfx.lineStyle(1, UI.BTN_BORDER_HOV, 1);
      bgGfx.strokeRoundedRect(BTN_X, y, BTN_W, BTN_H, 4);
      txt.setColor(UI.TXT_GOLD);
    })
    .on('pointerout', () => {
      bgGfx.lineStyle(1, UI.BTN_BORDER, 1);
      bgGfx.strokeRoundedRect(BTN_X, y, BTN_W, BTN_H, 4);
      txt.setColor(color);
    })
    // isClosing() : l'écran est en train de se dissoudre (closeScreenTransition,
    // ~170ms) — un tap résiduel ne doit plus déclencher d'action.
    .on('pointerdown', () => { if (!isClosing()) onClick(); });
  push(bgGfx); push(txt); push(hit);
}

/** Hauteur d'un bouton d'action + son espacement — pour calculer btnY de départ. */
export const DETAIL_BTN_H = 36;
export const DETAIL_BTN_GAP = 10;
