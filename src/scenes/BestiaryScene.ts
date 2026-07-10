// ============================================================
// BESTIARY SCENE — encyclopédie des créatures (style Dofus)
// Liste scrollable à gauche (groupée par zone), panneau détail
// à droite : portrait, badges, lore, butin avec drops cachés.
//
// UX (docs/design/UI_UX_GUIDELINES.md) :
//  - overlay 0.88 + fade-in 300 ms
//  - tap = action, feedback < 100 ms sur pointerdown
//  - scroll = molette + drag vertical + flèches + touches ↑↓
//  - bouton × rouge haut-droite (hit 48×48) + ESC (géré par GameScene)
//  - shutdown() complet (touches, wheel, drag, timers)
//
// Style "arcane fresh" (07/2026) : mirror direct d'ArsenalScene —
// drawGlowPanel/drawCard/drawSlot/uiStyle, structure cyan arcane,
// or réservé à l'identité/valeur (titre, boss, niveaux).
// ============================================================

import { WorldState, ElementType, ItemRarity, RARITY_COLORS, SpawnRegion } from '../types';
import {
  UI, drawGlowPanel, drawCard, drawSlot, drawBadge, uiStyle,
  addCloseButton, drawScrollbar, renderScrollableText, formatDropRate,
  fadeOutAndClose, drawConfirmCancelButtons,
} from '../utils/UITheme';
import { ENEMY_MAP } from '../data/enemies';
import { BESTIARY_IDS, BESTIARY_RECORD, BestiaryDropData } from '../data/bestiary';
import { BestiarySystem } from '../systems/BestiarySystem';
import { ArsenalSystem } from '../systems/ArsenalSystem';
import { ALL_ITEMS } from '../data/items';
import { ZONES } from '../data/zones';
import { getZoneLayout } from '../data/zoneMaps';
import { ENEMY_SPAWN_REGIONS } from '../data/enemySpawnRegions';
import { getSpawnRegionRect } from '../systems/SpawnRegionSystem';
import { t, localizeEnemy, localizeItem, localizeBestiaryEntry } from '../i18n';
import { GameScene } from './GameScene';

// Couleurs élémentaires — mêmes valeurs que GameScene.ELEMENT_PROJECTILE_COLORS
const ELEMENT_COLORS: Record<ElementType, number> = {
  [ElementType.FIRE]:      0xff4400,
  [ElementType.EARTH]:     0x88aa33,
  [ElementType.WIND]:      0xaaddff,
  [ElementType.WATER]:     0x2266ff,
  [ElementType.LIGHTNING]: 0xffee00,
  [ElementType.ICE]:       0x88ddff,
  [ElementType.DARK]:      0x8833cc,
  [ElementType.DIVINE]:    0xffffff,
  [ElementType.NEUTRAL]:   0x888888,
};

/** Éléments clairs → texte de badge sombre pour garder le contraste. */
const BRIGHT_ELEMENTS: ElementType[] = [
  ElementType.LIGHTNING, ElementType.ICE, ElementType.WIND, ElementType.DIVINE,
];

/** Mapping élément → clé de zone (groupement de la liste). Exporté pour que
 *  ArsenalScene puisse afficher le même habitat traduit dans sa mini-card monstre. */
export const ZONE_HABITAT_KEYS: Partial<Record<ElementType, string>> = {
  [ElementType.FIRE]:      'zone.ignis_reach',
  [ElementType.EARTH]:     'zone.terravast',
  [ElementType.WIND]:      'zone.zephyr_peaks',
  [ElementType.WATER]:     'zone.abyssmar',
  [ElementType.LIGHTNING]: 'zone.volterra',
  [ElementType.ICE]:       'zone.glaciem',
  [ElementType.DARK]:      'zone.malachars_spire',
  [ElementType.NEUTRAL]:   'zone.grievy_town',
  [ElementType.DIVINE]:    'zone.grievy_town',
};

type RowDef =
  | { kind: 'header'; label: string; color: number }
  | { kind: 'enemy'; id: string };

const ENEMY_ROW_H  = 50;
const HEADER_ROW_H = 22;
const ROW_GAP      = 2;

/** Pixels par cran de molette dans le viewport Histoire/lore. */
const LORE_SCROLL_STEP = 28;
/** Taille de la mini-carte de localisation approximative (chantier heatmap). */
const LOCATION_MAP_W = 140;
const LOCATION_MAP_H = 90;

export class BestiaryScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private world!: WorldState;
  /** Ennemi à pré-sélectionner au démarrage (navigation depuis l'Arsenal) — n'est
   *  honoré que s'il est déjà découvert par ce joueur (cf. create()). */
  private focusEnemyId?: string;

  private rows: RowDef[] = [];
  private enemyRowIndices: number[] = [];
  private scrollOffset = 0;
  private maxScrollOffset = 0;
  private lastVisibleIndex = 0;
  private selectedId: string | null = null;

  private listObjs:   Phaser.GameObjects.GameObject[] = [];
  private detailObjs: Phaser.GameObjects.GameObject[] = [];
  private scrollbarGfx!: Phaser.GameObjects.Graphics;
  private tooltip: Phaser.GameObjects.Container | null = null;
  private tooltipTimer: Phaser.Time.TimerEvent | null = null;
  private tooltipJustOpened = false;

  // Garde anti double-déclenchement : un fondu de sortie (fermeture ou
  // redirection) est en cours — ignore tout nouvel appel tant qu'il tourne
  // (évite un scene.stop()/launch() dupliqué si le bouton est tapé deux fois
  // pendant les ~200ms de fondu).
  private closing = false;

  // Scroll interne du bloc Histoire/lore (viewport masqué à taille fixe — voir
  // renderScrollableText) : offset en pixels, indépendant du scroll de la liste.
  private loreScrollPx = 0;
  private loreMaxScrollPx = 0;

  private keyUp:   Phaser.Input.Keyboard.Key | null = null;
  private keyDown: Phaser.Input.Keyboard.Key | null = null;

  private dragging  = false;
  private dragAccum = 0;
  private wheelHandler:   ((p: Phaser.Input.Pointer, o: unknown, dx: number, dy: number) => void) | null = null;
  private pointerDownHandler: ((p: Phaser.Input.Pointer) => void) | null = null;
  private pointerMoveHandler: ((p: Phaser.Input.Pointer) => void) | null = null;
  private pointerUpHandler:   (() => void) | null = null;

  private readonly PAD = 14;

  // Layout (calculé dans create() depuis la caméra)
  private LIST_X = 0; private LIST_Y = 0; private LIST_W = 0; private LIST_H = 0;
  private DET_X = 0;  private DET_Y = 0;  private DET_W = 0;  private DET_H = 0;
  private LORE_X = 0; private LORE_Y = 0; private LORE_W = 0; private readonly LORE_H = 100;
  private rowsTop = 0; private rowsBottom = 0;

  constructor() { super({ key: 'BestiaryScene' }); }

  init(data: { gameScene: GameScene; world?: WorldState; focusEnemyId?: string }) {
    this.gameScene = data.gameScene;
    this.world     = data.world ?? data.gameScene.gameState.world;
    this.focusEnemyId = data.focusEnemyId;
    this.rows = [];
    this.enemyRowIndices = [];
    this.scrollOffset = 0;
    this.selectedId = null;
    this.listObjs = [];
    this.detailObjs = [];
    this.tooltip = null;
    this.tooltipTimer = null;
    this.closing = false;
    this.loreScrollPx = 0;
    this.loreMaxScrollPx = 0;
    this.dragging = false;
    this.dragAccum = 0;
  }

  create() {
    const { width: W, height: H } = this.cameras.main;
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // ── Overlay + cadre ──────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);
    const frame = this.add.graphics();
    drawGlowPanel(frame, 6, 6, W - 12, H - 12, UI.ACCENT_ARCANE, UI.BG_DEEP, 10, 0.92);

    // ── Header ───────────────────────────────────────────────
    this.add.text(W / 2, 24, t('bestiary.title'), uiStyle(13, UI.TXT_GOLD, { bold: true, stroke: true })).setOrigin(0.5);

    const counts = BestiarySystem.counts(this.world);
    const progressLabel = t('bestiary.progress')
      .replace('{seen}',  String(counts.seen))
      .replace('{slain}', String(counts.slain))
      .replace('{total}', String(counts.total));
    this.add.text(20, 24, progressLabel, uiStyle(8, UI.TXT_MUTED)).setOrigin(0, 0.5);

    // Bouton × (règle inter-écrans §7.1 : rouge, haut-droite, hit ≥ 44 px)
    addCloseButton(this, W - 28, 24, () => this.close());

    const sep = this.add.graphics();
    sep.lineStyle(1, UI.ACCENT_ARCANE, 0.35);
    sep.beginPath(); sep.moveTo(16, 42); sep.lineTo(W - 16, 42); sep.strokePath();

    // ── Layout des panneaux ──────────────────────────────────
    this.LIST_X = 16;  this.LIST_Y = 50;
    this.LIST_W = 212; this.LIST_H = H - 50 - 26;
    this.DET_X  = this.LIST_X + this.LIST_W + 8;
    this.DET_Y  = 50;
    this.DET_W  = W - this.DET_X - 16;
    this.DET_H  = H - 50 - 26;
    this.rowsTop    = this.LIST_Y + 24;
    this.rowsBottom = this.LIST_Y + this.LIST_H - 24;

    // Viewport fixe du bloc Histoire/lore — même géométrie pour tous les monstres
    // (panneau uniforme), le texte défile DEDANS au lieu de faire varier la taille
    // du panneau ou de déborder sur la section Butin (cf. renderScrollableText).
    this.LORE_X = this.DET_X + this.PAD;
    this.LORE_Y = this.DET_Y + this.PAD + 96 + 18 + 14;
    this.LORE_W = this.DET_W - this.PAD * 2;

    const listBg = this.add.graphics();
    drawGlowPanel(listBg, this.LIST_X, this.LIST_Y, this.LIST_W, this.LIST_H, UI.ACCENT_ARCANE, UI.BG_MID, 8, 0.55);

    // Depth explicite : sans ça, les lignes recréées à chaque renderList() finissent
    // plus tard dans la display list et passent PAR-DESSUS la scrollbar (bug reporté).
    this.scrollbarGfx = this.add.graphics().setDepth(5);

    // Hint navigation (bas d'écran, hors des panneaux)
    this.add.text(W / 2, H - 16, t('bestiary.hint'), uiStyle(8, UI.TXT_HINT)).setOrigin(0.5);

    // ── Construction des lignes (groupées par zone) ──────────
    this.buildRows();
    this.maxScrollOffset = this.computeMaxOffset();

    // Sélection initiale : focusEnemyId (navigation depuis l'Arsenal, si découvert)
    // en priorité, sinon premier ennemi découvert, sinon premier tout court.
    const focusValid = this.focusEnemyId && BestiarySystem.peekEntry(this.world, this.focusEnemyId).discovered
      ? this.focusEnemyId : undefined;
    const firstDiscovered = BESTIARY_IDS.find(id => BestiarySystem.peekEntry(this.world, id).discovered);
    this.selectedId = focusValid ?? firstDiscovered ?? BESTIARY_IDS[0] ?? null;
    if (this.selectedId) this.ensureVisible(this.rowIndexOf(this.selectedId));

    this.renderList();
    this.renderDetail();

    // ── Inputs ───────────────────────────────────────────────
    this.setupInputs();

    // Phaser n'appelle pas shutdown() automatiquement — câblage explicite
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  // ════════════════════════════════════════════════════════════
  // DONNÉES DE LISTE
  // ════════════════════════════════════════════════════════════

  private buildRows() {
    let lastZoneKey = '';
    for (const id of BESTIARY_IDS) {
      const data = BESTIARY_RECORD[id];
      const def  = ENEMY_MAP[id];
      if (!data || !def) continue;
      const zoneKey = ZONE_HABITAT_KEYS[def.element] ?? 'zone.grievy_town';
      if (zoneKey !== lastZoneKey) {
        lastZoneKey = zoneKey;
        this.rows.push({
          kind: 'header',
          label: t(zoneKey).toUpperCase(),
          color: ELEMENT_COLORS[def.element] ?? ELEMENT_COLORS[ElementType.NEUTRAL],
        });
      }
      this.enemyRowIndices.push(this.rows.length);
      this.rows.push({ kind: 'enemy', id });
    }
  }

  private rowIndexOf(enemyId: string): number {
    return this.rows.findIndex(r => r.kind === 'enemy' && r.id === enemyId);
  }

  /** Dernier index de ligne entièrement visible depuis un offset donné. */
  private lastVisibleFrom(offset: number): number {
    let y = this.rowsTop;
    let i = offset;
    while (i < this.rows.length) {
      const rh = this.rows[i].kind === 'header' ? HEADER_ROW_H : ENEMY_ROW_H;
      if (y + rh > this.rowsBottom) break;
      y += rh + ROW_GAP;
      i++;
    }
    return i - 1;
  }

  private computeMaxOffset(): number {
    for (let off = 0; off < this.rows.length; off++) {
      if (this.lastVisibleFrom(off) >= this.rows.length - 1) return off;
    }
    return Math.max(0, this.rows.length - 1);
  }

  private ensureVisible(rowIndex: number) {
    if (rowIndex < 0) return;
    if (rowIndex < this.scrollOffset) {
      const prev = this.rows[rowIndex - 1];
      this.scrollOffset = prev && prev.kind === 'header' ? rowIndex - 1 : rowIndex;
      return;
    }
    let guard = 0;
    while (rowIndex > this.lastVisibleFrom(this.scrollOffset)
           && this.scrollOffset < this.maxScrollOffset
           && guard++ < this.rows.length) {
      this.scrollOffset++;
    }
  }

  private scroll(delta: number) {
    const next = Phaser.Math.Clamp(this.scrollOffset + delta, 0, this.maxScrollOffset);
    if (next === this.scrollOffset) return;
    this.scrollOffset = next;
    this.destroyTooltip();
    this.renderList();
  }

  /** Scroll interne du viewport Histoire/lore (en pixels) — indépendant du scroll
   *  de la liste ; déclenche un re-rendu complet du panneau détail (cf. renderDetail). */
  private scrollLore(deltaPx: number) {
    const next = Phaser.Math.Clamp(this.loreScrollPx + deltaPx, 0, this.loreMaxScrollPx);
    if (next === this.loreScrollPx) return;
    this.loreScrollPx = next;
    this.renderDetail();
  }

  // ════════════════════════════════════════════════════════════
  // RENDU DE LA LISTE
  // ════════════════════════════════════════════════════════════

  private renderList() {
    this.listObjs.forEach(o => o.destroy());
    this.listObjs = [];

    const x = this.LIST_X + 4;
    const w = this.LIST_W - 16; // marge à droite pour la scrollbar (ne pas chevaucher)

    let y = this.rowsTop;
    let i = this.scrollOffset;
    while (i < this.rows.length) {
      const row = this.rows[i];
      const rh = row.kind === 'header' ? HEADER_ROW_H : ENEMY_ROW_H;
      if (y + rh > this.rowsBottom) break;
      if (row.kind === 'header') this.renderHeaderRow(row, x, y, w);
      else                       this.renderEnemyRow(row.id, x, y, w);
      y += rh + ROW_GAP;
      i++;
    }
    this.lastVisibleIndex = i - 1;

    if (this.scrollOffset > 0) {
      this.renderScrollArrow(this.LIST_Y + 11, '▲', () => this.scroll(-1));
    }
    if (this.lastVisibleIndex < this.rows.length - 1) {
      this.renderScrollArrow(this.LIST_Y + this.LIST_H - 11, '▼', () => this.scroll(1));
    }

    this.scrollbarGfx.clear();
    const visibleCount = this.lastVisibleIndex - this.scrollOffset + 1;
    drawScrollbar(
      this.scrollbarGfx,
      this.LIST_X + this.LIST_W - 10, this.rowsTop, 4, this.rowsBottom - this.rowsTop,
      this.scrollOffset, this.maxScrollOffset, visibleCount / Math.max(1, this.rows.length),
    );
  }

  private renderScrollArrow(cy: number, glyph: string, onTap: () => void) {
    const cx = this.LIST_X + this.LIST_W / 2;
    const txt = this.add.text(cx, cy, glyph, uiStyle(9, UI.TXT_GOLD)).setOrigin(0.5).setAlpha(0.8);
    const hit = this.add.rectangle(cx, cy, this.LIST_W - 8, 26, 0, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => txt.setAlpha(1));
    hit.on('pointerout',  () => txt.setAlpha(0.8));
    hit.on('pointerdown', () => {
      this.flashAt(cx, cy, this.LIST_W - 8, 22);
      onTap();
    });
    this.listObjs.push(txt, hit);
  }

  private renderHeaderRow(row: { label: string; color: number }, x: number, y: number, w: number) {
    const cy = y + HEADER_ROW_H / 2;
    const g = this.add.graphics();
    // Pastille = couleur élémentaire de la zone (info), filet = structure arcane
    g.fillStyle(row.color, 0.9);
    g.fillRoundedRect(x + 6, cy - 3, 6, 6, 1.5);
    const txt = this.add.text(x + 18, cy, row.label, uiStyle(8, UI.TXT_CYAN, { bold: true })).setOrigin(0, 0.5);
    g.lineStyle(1, UI.ACCENT_ARCANE, 0.25);
    g.beginPath();
    g.moveTo(x + 22 + txt.width, cy);
    g.lineTo(x + w - 4, cy);
    g.strokePath();
    this.listObjs.push(g, txt);
  }

  private renderEnemyRow(id: string, x: number, y: number, w: number) {
    const def = ENEMY_MAP[id];
    if (!def) return;
    const entry = BestiarySystem.peekEntry(this.world, id);
    const isSelected = id === this.selectedId;
    const elemColor  = ELEMENT_COLORS[def.element] ?? ELEMENT_COLORS[ElementType.NEUTRAL];
    const cy = y + ENEMY_ROW_H / 2;

    const baseFill = isSelected ? UI.BTN_BG_HOVER : UI.BTN_BG;
    const bg = this.add.rectangle(x + w / 2, cy, w, ENEMY_ROW_H, baseFill, 1)
      .setInteractive({ useHandCursor: true });

    const deco = this.add.graphics();
    if (isSelected) {
      deco.fillStyle(UI.ACCENT_ARCANE, 1);
      deco.fillRect(x, y, 3, ENEMY_ROW_H);
    }
    deco.lineStyle(1, entry.discovered ? elemColor : UI.SLOT_BORDER, entry.discovered ? 0.7 : 0.5);
    deco.strokeRoundedRect(x + 2, y + 2, w - 4, ENEMY_ROW_H - 4, 4);

    // Pastille d'élément
    deco.fillStyle(entry.discovered ? elemColor : 0x3a3a44, 1);
    deco.fillCircle(x + 19, cy, 9);
    deco.lineStyle(1, 0x000000, 0.6);
    deco.strokeCircle(x + 19, cy, 9);
    if (def.isBoss && entry.discovered) {
      // Anneau doré = valeur/prestige (boss)
      deco.lineStyle(1, UI.CORNER, 0.9);
      deco.strokeCircle(x + 19, cy, 12);
    }
    this.listObjs.push(bg, deco);

    if (!entry.discovered) {
      this.listObjs.push(
        this.add.text(x + 19, cy, '?', uiStyle(9, UI.TXT_WHITE, { bold: true })).setOrigin(0.5),
      );
    }

    const rawName = entry.discovered ? localizeEnemy(def).name : t('bestiary.unknown');
    const name = rawName.length > 16 ? rawName.slice(0, 15) + '..' : rawName;
    const nameColor = !entry.discovered ? UI.TXT_MUTED
      : def.isBoss  ? UI.TXT_GOLD
      : def.isElite ? UI.TXT_ORANGE
      : UI.TXT_PARCHMENT;
    this.listObjs.push(
      this.add.text(x + 36, y + 10, name, uiStyle(9, nameColor, { bold: entry.discovered })),
    );

    const lvlLabel = entry.discovered
      ? t('bestiary.level').replace('{lvl}', String(def.baseLevel))
      : t('bestiary.level_unknown');
    this.listObjs.push(
      this.add.text(x + 36, y + 28, lvlLabel, uiStyle(7, UI.TXT_MUTED)),
    );
    if (entry.killed) {
      this.listObjs.push(
        this.add.text(x + w - 8, y + 28, t('bestiary.slain'), uiStyle(7, UI.TXT_RED, { bold: true })).setOrigin(1, 0),
      );
    } else if (entry.discovered) {
      this.listObjs.push(
        this.add.text(x + w - 8, y + 28, t('bestiary.seen'), uiStyle(7, UI.TXT_GREEN)).setOrigin(1, 0),
      );
    }

    bg.on('pointerover', () => { if (id !== this.selectedId) bg.setFillStyle(0x181628, 1); });
    bg.on('pointerout',  () => { if (id !== this.selectedId) bg.setFillStyle(UI.BTN_BG, 1); });
    bg.on('pointerdown', () => {
      this.flashAt(x + w / 2, cy, w, ENEMY_ROW_H);
      this.selectEnemy(id);
    });
  }

  private selectEnemy(id: string) {
    if (this.selectedId === id) return;
    this.selectedId = id;
    this.loreScrollPx = 0;
    this.destroyTooltip();
    this.renderList();
    this.renderDetail();
  }

  // ════════════════════════════════════════════════════════════
  // PANNEAU DÉTAIL
  // ════════════════════════════════════════════════════════════

  private renderDetail() {
    this.detailObjs.forEach(o => o.destroy());
    this.detailObjs = [];
    this.destroyTooltip();
    if (!this.selectedId) return;

    const def   = ENEMY_MAP[this.selectedId];
    const data  = BESTIARY_RECORD[this.selectedId];
    if (!def || !data) return;
    const entry = BestiarySystem.peekEntry(this.world, this.selectedId);
    const elemColor = ELEMENT_COLORS[def.element] ?? ELEMENT_COLORS[ElementType.NEUTRAL];
    const accent    = entry.discovered ? elemColor : UI.BORDER_LIT;
    const pad = 14;

    const bg = this.add.graphics();
    drawGlowPanel(bg, this.DET_X, this.DET_Y, this.DET_W, this.DET_H, accent, UI.BG_MID, 8, 0.55);
    this.detailObjs.push(bg);

    // ── Portrait (96×96) ─────────────────────────────────────
    const px = this.DET_X + pad;
    const py = this.DET_Y + pad;
    const pFrame = this.add.graphics();
    drawCard(pFrame, px, py, 96, 96, { bg: 0x080810, radius: 8, shadow: false });
    this.detailObjs.push(pFrame);

    const portraitTexKey = `enemy_${def.id}_idle`;
    if (entry.discovered && this.textures.exists(portraitTexKey)) {
      this.detailObjs.push(
        this.add.image(px + 48, py + 48, portraitTexKey, 0).setDisplaySize(80, 80),
      );
    } else {
      const ph = this.add.graphics();
      ph.fillStyle(entry.discovered ? elemColor : 0x444450, 0.85);
      ph.fillCircle(px + 48, py + 48, 32);
      ph.lineStyle(2, 0x000000, 0.5);
      ph.strokeCircle(px + 48, py + 48, 32);
      this.detailObjs.push(ph);
      const glyph = entry.discovered
        ? def.name.split(' ').map(wd => wd[0] ?? '').join('').slice(0, 2).toUpperCase()
        : '?';
      this.detailObjs.push(
        this.add.text(px + 48, py + 48, glyph,
          uiStyle(entry.discovered ? 14 : 18, UI.TXT_WHITE, { bold: true, stroke: true })).setOrigin(0.5),
      );
    }

    // ── Bloc identité (à droite du portrait) ─────────────────
    const ix = px + 96 + 14;
    const iw = this.DET_X + this.DET_W - pad - ix;
    let iy = py + 2;

    const displayName = entry.discovered ? localizeEnemy(def).name : t('bestiary.unknown');
    const nameHex = entry.discovered ? '#' + elemColor.toString(16).padStart(6, '0') : UI.TXT_MUTED;
    const nameTxt = this.add.text(ix, iy, displayName,
      uiStyle(13, nameHex, { bold: true, stroke: true, wordWrapWidth: iw }));
    this.detailObjs.push(nameTxt);
    iy += nameTxt.height + 8;

    // Habitat — toujours visible : guide le joueur vers la créature manquante
    const zoneKey = ZONE_HABITAT_KEYS[def.element];
    const habitatStr = zoneKey ? t(zoneKey) : data.habitat;
    this.detailObjs.push(
      this.add.text(ix, iy, `${t('bestiary.habitat')} ${habitatStr}`, uiStyle(9, UI.TXT_MUTED)),
    );
    iy += 17;

    // Badges : niveau, élément, boss/élite
    let bx = ix;
    bx += this.addInfoBadge(bx, iy + 7,
      entry.discovered ? t('bestiary.level').replace('{lvl}', String(def.baseLevel)) : t('bestiary.level_unknown'),
      0x1a2030, UI.TXT_GOLD);
    if (entry.discovered) {
      const elemTxtColor = BRIGHT_ELEMENTS.includes(def.element) ? '#101018' : '#f5edd0';
      bx += this.addInfoBadge(bx, iy + 7, t(`element.${def.element}`), elemColor, elemTxtColor);
      if (def.isBoss)       bx += this.addInfoBadge(bx, iy + 7, t('bestiary.boss'),  0x551111, '#ffdddd');
      else if (def.isElite) bx += this.addInfoBadge(bx, iy + 7, t('bestiary.elite'), 0x553311, '#ffe6cc');
    }
    iy += 26;

    // Faiblesse + compteur de victoires
    if (entry.discovered && def.weakness) {
      const wkColor = ELEMENT_COLORS[def.weakness] ?? ELEMENT_COLORS[ElementType.NEUTRAL];
      const wkLabel = this.add.text(ix, iy, t('bestiary.weakness'), uiStyle(9, UI.TXT_MUTED));
      const wkValue = this.add.text(ix + wkLabel.width + 6, iy, t(`element.${def.weakness}`),
        uiStyle(9, '#' + wkColor.toString(16).padStart(6, '0'), { bold: true }));
      this.detailObjs.push(wkLabel, wkValue);
      iy += 15;
    }
    if (entry.kills > 0) {
      this.detailObjs.push(
        this.add.text(ix, iy, t('bestiary.kills').replace('{n}', String(entry.kills)), uiStyle(9, UI.TXT_MUTED)),
      );
    }

    // ── Section Histoire ─────────────────────────────────────
    // Viewport fixe (this.LORE_X/Y/W/H, calculé une fois dans create()) : le texte
    // défile DEDANS (molette + scrollbar) au lieu de faire varier la taille du
    // panneau ou de déborder sur la section Butin ci-dessous (cf. renderScrollableText).
    const loreY = this.DET_Y + pad + 96 + 18;
    this.addSectionTitle(t('bestiary.lore_title'), loreY);

    let loreText: string;
    let loreColor: string;
    if (!entry.discovered)   { loreText = t('bestiary.not_discovered'); loreColor = UI.TXT_MUTED; }
    else if (!entry.killed)  { loreText = t('bestiary.lore_locked');    loreColor = UI.TXT_MUTED; }
    else {
      loreText  = localizeBestiaryEntry(data).lore;
      loreColor = UI.TXT_PARCHMENT;
    }

    const loreResult = renderScrollableText(
      this, this.LORE_X, this.LORE_Y, this.LORE_W, this.LORE_H,
      loreText, uiStyle(9, loreColor, { lineSpacing: 5 }), this.loreScrollPx,
    );
    this.detailObjs.push(loreResult.text, loreResult.mask);
    this.loreMaxScrollPx = loreResult.maxScrollPx;
    if (this.loreScrollPx > this.loreMaxScrollPx) this.loreScrollPx = this.loreMaxScrollPx;
    if (loreResult.maxScrollPx > 0) {
      const sbGfx = this.add.graphics();
      drawScrollbar(
        sbGfx, this.LORE_X + this.LORE_W - 6, this.LORE_Y, 4, this.LORE_H,
        this.loreScrollPx, loreResult.maxScrollPx, this.LORE_H / (this.LORE_H + loreResult.maxScrollPx),
      );
      this.detailObjs.push(sbGfx);
    }

    // ── Mini-carte de localisation approximative ─────────────
    // Toujours affichée (même monstre non découvert) — même logique que l'habitat
    // ci-dessus ("guide le joueur vers la créature manquante"). PROVISIONAL/APPROXIMATE :
    // les vraies maps de zone ne sont pas finalisées (cf. enemySpawnRegions.ts /
    // SpawnRegionSystem.ts) — à revoir une fois le placement réel des ennemis connu.
    this.renderLocationMap(def.id, this.LORE_Y + this.LORE_H + 10);

    // ── Section Butin (zone basse = zone de pouce) ───────────
    const dropsY = this.DET_Y + this.DET_H - 130;
    this.addSectionTitle(t('bestiary.loot_title'), dropsY);

    if (!entry.discovered) {
      this.detailObjs.push(
        this.add.text(this.DET_X + pad, dropsY + 22, t('bestiary.loot_unknown'), uiStyle(9, UI.TXT_MUTED)),
      );
      return;
    }

    const SLOT = 48;
    const GAP  = 10;
    data.drops.forEach((drop, idx) => {
      const sx = this.DET_X + pad + idx * (SLOT + GAP);
      const sy = dropsY + 22;
      this.renderDropSlot(drop, entry.revealedDrops, sx, sy, SLOT);
    });
  }

  /** Badge d'info compact — retourne la largeur occupée (badge + marge). */
  private addInfoBadge(x: number, cy: number, label: string, bgColor: number, textColor: string): number {
    const w = label.length * 6 + 12;
    const badge = drawBadge(this, x + w / 2, cy, label, bgColor, textColor);
    this.detailObjs.push(badge);
    return w + 8;
  }

  private addSectionTitle(label: string, y: number) {
    const txt = this.add.text(this.DET_X + 14, y, label, uiStyle(9, UI.TXT_CYAN, { bold: true })).setOrigin(0, 0.5);
    const g = this.add.graphics();
    g.lineStyle(1, UI.ACCENT_ARCANE, 0.25);
    g.beginPath();
    g.moveTo(this.DET_X + 14 + txt.width + 8, y);
    g.lineTo(this.DET_X + this.DET_W - 14, y);
    g.strokePath();
    this.detailObjs.push(txt, g);
  }

  /**
   * Mini heatmap floue de localisation — carte proportionnelle de la zone du
   * monstre avec un ou deux blobs flous marquant sa région de spawn approximative.
   * PROVISIONAL/APPROXIMATE (voir enemySpawnRegions.ts / SpawnRegionSystem.ts) :
   * les régions ne sont pas la vraie géométrie de spawn (maps non finalisées) —
   * ne rien afficher plutôt que crasher si les données manquent pour ce monstre.
   */
  private renderLocationMap(enemyId: string, y: number) {
    const zone = ZONES.find(z => z.enemies.includes(enemyId));
    const regions: SpawnRegion[] | undefined = ENEMY_SPAWN_REGIONS[enemyId];
    if (!zone || !regions || regions.length === 0) return;

    const layout = getZoneLayout(zone.id);
    const mapX = this.DET_X + this.PAD;
    const mapY = y;
    const scaleX = LOCATION_MAP_W / layout.mapWidth;
    const scaleY = LOCATION_MAP_H / layout.mapHeight;

    const g = this.add.graphics();
    g.fillStyle(zone.ambientColor ?? 0x222233, 0.22);
    g.fillRoundedRect(mapX, mapY, LOCATION_MAP_W, LOCATION_MAP_H, 4);
    g.lineStyle(1, UI.SEPARATOR, 1);
    g.strokeRoundedRect(mapX, mapY, LOCATION_MAP_W, LOCATION_MAP_H, 4);

    const radii  = [18, 13, 8];
    const alphas = [0.15, 0.25, 0.4];
    for (const region of regions) {
      const rect = getSpawnRegionRect(region, layout.mapWidth, layout.mapHeight);
      const rcx = mapX + ((rect.x0 + rect.x1) / 2) * scaleX;
      const rcy = mapY + ((rect.y0 + rect.y1) / 2) * scaleY;
      for (let i = 0; i < radii.length; i++) {
        g.fillStyle(UI.GLOW_GOLD, alphas[i]);
        g.fillCircle(rcx, rcy, radii[i]);
      }
    }
    this.detailObjs.push(g);

    this.detailObjs.push(
      this.add.text(mapX + LOCATION_MAP_W / 2, mapY + LOCATION_MAP_H + 8, t('bestiary.location_approx'),
        uiStyle(7, UI.TXT_HINT)).setOrigin(0.5, 0),
    );
  }

  private renderDropSlot(drop: BestiaryDropData, revealedDrops: string[], sx: number, sy: number, size: number) {
    const item = ALL_ITEMS[drop.itemId];
    const revealed = !drop.isHidden || revealedDrops.includes(drop.itemId);
    const rarityHexStr = item ? RARITY_COLORS[item.rarity] : RARITY_COLORS[ItemRarity.COMMON];
    const rarityHex = parseInt(rarityHexStr.slice(1), 16);

    // Slot arrondi moderne : bordure = rareté (révélé) ou fantôme (caché)
    const g = this.add.graphics();
    if (revealed) {
      drawSlot(g, sx, sy, size, rarityHex, { occupied: true });
    } else {
      drawSlot(g, sx, sy, size, UI.SLOT_BORDER, { occupied: false, bg: 0x111111 });
    }
    this.detailObjs.push(g);

    if (revealed && item) {
      if (this.textures.exists(item.icon)) {
        this.detailObjs.push(
          this.add.image(sx + size / 2, sy + size / 2, item.icon).setDisplaySize(32, 32),
        );
      } else {
        const sq = this.add.graphics();
        sq.fillStyle(rarityHex, 0.5);
        sq.fillRoundedRect(sx + 10, sy + 10, size - 20, size - 20, 3);
        this.detailObjs.push(sq);
      }
    } else {
      this.detailObjs.push(
        this.add.text(sx + size / 2, sy + size / 2, '???', uiStyle(9, UI.TXT_WHITE, { bold: true, stroke: true })).setOrigin(0.5),
      );
    }

    // Taux de drop sous le slot — info immédiate sans tap (dropRatePct / 100 → ratio 0-1)
    const rate = drop.dropRatePct / 100;
    this.detailObjs.push(
      this.add.text(sx + size / 2, sy + size + 10, formatDropRate(rate),
        uiStyle(8, revealed ? UI.TXT_MUTED : UI.TXT_HINT)).setOrigin(0.5),
    );

    // Hit zone élargie : tap = tooltip détaillé
    const hit = this.add.rectangle(sx + size / 2, sy + size / 2, size + 6, size + 6, 0, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      this.flashAt(sx + size / 2, sy + size / 2, size, size);
      this.showDropTooltip(drop, revealed, sx, sy);
    });
    this.detailObjs.push(hit);
  }

  // ════════════════════════════════════════════════════════════
  // TOOLTIP DE DROP
  // ════════════════════════════════════════════════════════════

  private showDropTooltip(drop: BestiaryDropData, revealed: boolean, slotX: number, slotY: number) {
    this.destroyTooltip();
    this.tooltipJustOpened = true;

    const item = revealed ? ALL_ITEMS[drop.itemId] : undefined;
    const TW = 208;
    const padT = 10;

    const parts: Phaser.GameObjects.GameObject[] = [];
    let ty = padT;

    const nameLabel = item ? localizeItem(item).name : t('bestiary.hidden_drop_name');
    const nameColor = item ? RARITY_COLORS[item.rarity] : UI.TXT_WHITE;
    const nameTxt = this.add.text(padT, ty, nameLabel,
      uiStyle(10, nameColor, { bold: true, wordWrapWidth: TW - padT * 2 }));
    parts.push(nameTxt);
    ty += nameTxt.height + 6;

    const rate = drop.dropRatePct / 100;
    const rateTxt = this.add.text(padT, ty,
      t('bestiary.drop_rate').replace('{rate}', formatDropRate(rate)),
      uiStyle(9, UI.TXT_GOLD, { bold: true }));
    parts.push(rateTxt);
    ty += rateTxt.height + 6;

    const descRaw = item ? localizeItem(item).description : t('bestiary.hidden_drop_desc');
    const desc = descRaw.length > 110 ? descRaw.slice(0, 108) + '..' : descRaw;
    const descTxt = this.add.text(padT, ty, desc,
      uiStyle(8, UI.TXT_MUTED, { wordWrapWidth: TW - padT * 2, lineSpacing: 3 }));
    parts.push(descTxt);
    ty += descTxt.height + padT;

    // Cross-link vers l'Arsenal — uniquement si CE joueur a déjà découvert l'item
    // (jamais de raccourci vers un équipement qu'il n'a pas encore obtenu).
    const canViewInArsenal = !!item && ArsenalSystem.peekEntry(this.world, item.id).discovered;
    if (canViewInArsenal && item) {
      const subtitleTxt = this.add.text(padT, ty, t('bestiary.view_in_arsenal'), uiStyle(8, UI.TXT_CYAN));
      parts.push(subtitleTxt);
      ty += subtitleTxt.height + 6;

      // Aller (vert, redirection teintée or) / Annuler (rouge, referme le tooltip
      // sans quitter le Bestiaire) — même convention que
      // InventoryScene.showActionConfirmPopup().
      const { objects: navBtns, height: navBtnH } = drawConfirmCancelButtons(
        this, padT, ty, TW - padT * 2,
        t('nav.go'), t('nav.cancel'),
        () => {
          if (this.closing) return;
          this.closing = true;
          fadeOutAndClose(this, () => {
            this.scene.stop();
            this.scene.launch('ArsenalScene', { gameScene: this.gameScene, world: this.world, focusItemId: item.id });
          }, 220, UI.CORNER);
        },
        () => this.destroyTooltip(),
      );
      parts.push(...navBtns);
      ty += navBtnH + padT;
    }

    const g = this.add.graphics();
    drawGlowPanel(g, 0, 0, TW, ty, UI.ACCENT_ARCANE, UI.PANEL_BG, 4, 0.97);

    const tx = Phaser.Math.Clamp(slotX + 24 - TW / 2, this.DET_X + 6, this.DET_X + this.DET_W - TW - 6);
    const tyPos = Math.max(this.DET_Y + 6, slotY - ty - 8);
    this.tooltip = this.add.container(tx, tyPos, [g, ...parts]).setDepth(30);

    // Les boutons Aller/Annuler ont besoin de temps pour être cliqués — pas
    // d'auto-dismiss dans ce cas (fermeture uniquement via Annuler ou tap en
    // dehors, cf. onDown/tooltipJustOpened).
    if (!canViewInArsenal) {
      this.tooltipTimer = this.time.delayedCall(3000, () => this.destroyTooltip());
    }
  }

  private destroyTooltip() {
    if (this.tooltipTimer) { this.tooltipTimer.remove(); this.tooltipTimer = null; }
    if (this.tooltip) { this.tooltip.destroy(); this.tooltip = null; }
  }

  // ════════════════════════════════════════════════════════════
  // INPUTS
  // ════════════════════════════════════════════════════════════

  private setupInputs() {
    const kb = this.input.keyboard;
    if (kb) {
      this.keyUp   = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP,   true, true);
      this.keyDown = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN, true, true);
      this.keyUp.on('down',   () => this.navigate(-1));
      this.keyDown.on('down', () => this.navigate(1));
    }

    const onWheel = (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      const overLore = p.x >= this.LORE_X && p.x <= this.LORE_X + this.LORE_W
        && p.y >= this.LORE_Y && p.y <= this.LORE_Y + this.LORE_H;
      if (overLore) this.scrollLore(dy > 0 ? LORE_SCROLL_STEP : -LORE_SCROLL_STEP);
      else          this.scroll(dy > 0 ? 1 : -1);
    };
    this.wheelHandler = onWheel;
    this.input.on('wheel', onWheel);

    const onDown = (p: Phaser.Input.Pointer) => {
      if (this.tooltipJustOpened) { this.tooltipJustOpened = false; }
      else this.destroyTooltip();
      if (p.x >= this.LIST_X && p.x <= this.LIST_X + this.LIST_W
        && p.y >= this.LIST_Y && p.y <= this.LIST_Y + this.LIST_H) {
        this.dragging = true;
        this.dragAccum = 0;
      }
    };
    const onMove = (p: Phaser.Input.Pointer) => {
      if (!this.dragging || !p.isDown) return;
      this.dragAccum += p.y - p.prevPosition.y;
      while (this.dragAccum <= -ENEMY_ROW_H) { this.scroll(1);  this.dragAccum += ENEMY_ROW_H; }
      while (this.dragAccum >=  ENEMY_ROW_H) { this.scroll(-1); this.dragAccum -= ENEMY_ROW_H; }
    };
    const onUp = () => { this.dragging = false; };
    this.pointerDownHandler = onDown;
    this.pointerMoveHandler = onMove;
    this.pointerUpHandler   = onUp;
    this.input.on('pointerdown', onDown);
    this.input.on('pointermove', onMove);
    this.input.on('pointerup',   onUp);
  }

  /** Navigation clavier ↑/↓ dans les ennemis (headers sautés), avec wrap. */
  private navigate(dir: number) {
    if (!this.selectedId || this.enemyRowIndices.length === 0) return;
    const currentRow = this.rowIndexOf(this.selectedId);
    const pos = this.enemyRowIndices.indexOf(currentRow);
    const nextPos = (pos + dir + this.enemyRowIndices.length) % this.enemyRowIndices.length;
    const nextRow = this.rows[this.enemyRowIndices[nextPos]];
    if (nextRow.kind !== 'enemy') return;
    this.selectedId = nextRow.id;
    this.loreScrollPx = 0;
    this.ensureVisible(this.enemyRowIndices[nextPos]);
    this.destroyTooltip();
    this.renderList();
    this.renderDetail();
  }

  // ════════════════════════════════════════════════════════════
  // HELPERS / LIFECYCLE
  // ════════════════════════════════════════════════════════════

  /** Flash blanc bref — feedback tactile < 100 ms. */
  private flashAt(cx: number, cy: number, w: number, h: number) {
    const flash = this.add.rectangle(cx, cy, w, h, 0xffffff, 0.2).setDepth(40);
    this.tweens.add({
      targets: flash, alpha: 0, duration: 150,
      onComplete: () => flash.destroy(),
    });
  }

  // Public : GameScene.escKey l'appelle directement pour fermer proprement
  // (resume PauseScene sous-jacente au lieu d'un setPaused(false) qui la
  // laisserait bloquée en pause pour toujours — cf. bug ESC reporté).
  close() {
    if (this.closing) return;
    this.closing = true;
    fadeOutAndClose(this, () => {
      this.scene.stop();
      // Reprendre PauseScene si elle était en pause (cas nominal : ouvert depuis PauseScene)
      if (this.scene.isPaused('PauseScene')) {
        this.scene.resume('PauseScene');
      } else if (this.gameScene) {
        this.gameScene.setPaused(false);
      }
    });
  }

  shutdown() {
    if (this.keyUp)   { this.keyUp.removeAllListeners();   this.input.keyboard?.removeKey(this.keyUp, true);   this.keyUp = null; }
    if (this.keyDown) { this.keyDown.removeAllListeners(); this.input.keyboard?.removeKey(this.keyDown, true); this.keyDown = null; }
    if (this.wheelHandler)       { this.input.off('wheel', this.wheelHandler);             this.wheelHandler = null; }
    if (this.pointerDownHandler) { this.input.off('pointerdown', this.pointerDownHandler); this.pointerDownHandler = null; }
    if (this.pointerMoveHandler) { this.input.off('pointermove', this.pointerMoveHandler); this.pointerMoveHandler = null; }
    if (this.pointerUpHandler)   { this.input.off('pointerup', this.pointerUpHandler);     this.pointerUpHandler = null; }
    // Si la scène est stoppée de force (ex: GameScene.goToMainMenu()) pendant un
    // fondu lancé par fadeOutAndClose(), le listener .once(FADE_OUT_COMPLETE) reste
    // sinon attaché à cameras.main (qui persiste entre stop/relaunch d'une même
    // clé de scène) et pourrait se déclencher au prochain fondu avec un callback
    // obsolète — no-op si le fondu s'est déjà terminé normalement.
    this.cameras.main.off(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE);
    this.destroyTooltip();
    // Détruit explicitement (pas juste vidage de tableau) : le masque de scroll du
    // bloc lore (renderScrollableText) n'est jamais ajouté à la display list —
    // Phaser ne le nettoie pas tout seul à l'arrêt de la scène.
    this.listObjs.forEach(o => o.destroy());
    this.detailObjs.forEach(o => o.destroy());
    this.listObjs = [];
    this.detailObjs = [];
  }
}
