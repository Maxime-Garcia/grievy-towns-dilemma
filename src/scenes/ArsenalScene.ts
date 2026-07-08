// ============================================================
// ARSENAL SCENE — glossaire des armes et armures (pendant du Bestiaire)
// Liste scrollable à gauche (groupée par slot d'équipement), panneau détail
// à droite : icône, badges, stats, description/lore. Pas d'étape "kill" —
// un équipement est entièrement débloqué dès sa première obtention.
//
// Construit APRÈS la refonte "arcane fresh" de l'inventaire : utilise les
// primitives modernes (drawGlowPanel/drawCard, uiStyle) plutôt que le style
// pixel historique du Bestiaire (drawPanel/pxStyle).
// ============================================================

import { WorldState, ElementType, ItemType, ItemRarity, RARITY_COLORS, Item, Weapon, Armor } from '../types';
import { UI, drawGlowPanel, drawCard, drawBadge, uiStyle, addCloseButton, drawScrollbar } from '../utils/UITheme';
import { ALL_ITEMS } from '../data/items';
import { ArsenalSystem } from '../systems/ArsenalSystem';
import { itemTextureKey } from '../utils/ItemAssets';
import { t, localizeItem } from '../i18n';
import { GameScene } from './GameScene';

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

const BRIGHT_ELEMENTS: ElementType[] = [
  ElementType.LIGHTNING, ElementType.ICE, ElementType.WIND, ElementType.DIVINE,
];

/** Ordre d'affichage des sections — mirror de l'enum ItemType, équipement uniquement. */
const SECTION_ORDER: ItemType[] = [
  ItemType.WEAPON, ItemType.HELM, ItemType.CHEST, ItemType.LEGS,
  ItemType.BOOTS, ItemType.GLOVES, ItemType.CAPE, ItemType.RING, ItemType.AMULET,
];

const SECTION_LABEL_KEYS: Partial<Record<ItemType, string>> = {
  [ItemType.WEAPON]: 'arsenal.section_weapon',
  [ItemType.HELM]:   'arsenal.section_helm',
  [ItemType.CHEST]:  'arsenal.section_chest',
  [ItemType.LEGS]:   'arsenal.section_legs',
  [ItemType.BOOTS]:  'arsenal.section_boots',
  [ItemType.GLOVES]: 'arsenal.section_gloves',
  [ItemType.CAPE]:   'arsenal.section_cape',
  [ItemType.RING]:   'arsenal.section_ring',
  [ItemType.AMULET]: 'arsenal.section_amulet',
};

function rarityHex(rarity: ItemRarity): number {
  return parseInt((RARITY_COLORS[rarity] ?? '#888888').replace('#', ''), 16);
}

type RowDef =
  | { kind: 'header'; label: string }
  | { kind: 'item'; id: string };

const ITEM_ROW_H   = 46;
const HEADER_ROW_H = 22;
const ROW_GAP      = 2;

export class ArsenalScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private world!: WorldState;

  private rows: RowDef[] = [];
  private itemRowIndices: number[] = [];
  private scrollOffset = 0;
  private maxScrollOffset = 0;
  private lastVisibleIndex = 0;
  private selectedId: string | null = null;

  private listObjs:   Phaser.GameObjects.GameObject[] = [];
  private detailObjs: Phaser.GameObjects.GameObject[] = [];
  private scrollbarGfx!: Phaser.GameObjects.Graphics;

  private keyUp:   Phaser.Input.Keyboard.Key | null = null;
  private keyDown: Phaser.Input.Keyboard.Key | null = null;

  private dragging  = false;
  private dragAccum = 0;
  private wheelHandler:       ((p: Phaser.Input.Pointer, o: unknown, dx: number, dy: number) => void) | null = null;
  private pointerDownHandler: ((p: Phaser.Input.Pointer) => void) | null = null;
  private pointerMoveHandler: ((p: Phaser.Input.Pointer) => void) | null = null;
  private pointerUpHandler:   (() => void) | null = null;

  private LIST_X = 0; private LIST_Y = 0; private LIST_W = 0; private LIST_H = 0;
  private DET_X = 0;  private DET_Y = 0;  private DET_W = 0;  private DET_H = 0;
  private rowsTop = 0; private rowsBottom = 0;

  constructor() { super({ key: 'ArsenalScene' }); }

  init(data: { gameScene: GameScene; world?: WorldState }) {
    this.gameScene = data.gameScene;
    this.world     = data.world ?? data.gameScene.gameState.world;
    this.rows = [];
    this.itemRowIndices = [];
    this.scrollOffset = 0;
    this.selectedId = null;
    this.listObjs = [];
    this.detailObjs = [];
    this.dragging = false;
    this.dragAccum = 0;
  }

  create() {
    const { width: W, height: H } = this.cameras.main;
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);
    const frame = this.add.graphics();
    drawGlowPanel(frame, 6, 6, W - 12, H - 12, UI.ACCENT_ARCANE, UI.BG_DEEP, 10, 0.92);

    this.add.text(W / 2, 24, t('arsenal.title'), uiStyle(13, UI.TXT_GOLD, { bold: true, stroke: true })).setOrigin(0.5);

    const counts = ArsenalSystem.counts(this.world);
    const progressLabel = t('arsenal.progress')
      .replace('{seen}',  String(counts.seen))
      .replace('{total}', String(counts.total));
    this.add.text(20, 24, progressLabel, uiStyle(8, UI.TXT_MUTED)).setOrigin(0, 0.5);

    addCloseButton(this, W - 28, 24, () => this.close());

    const sep = this.add.graphics();
    sep.lineStyle(1, UI.ACCENT_ARCANE, 0.35);
    sep.beginPath(); sep.moveTo(16, 42); sep.lineTo(W - 16, 42); sep.strokePath();

    this.LIST_X = 16;  this.LIST_Y = 50;
    this.LIST_W = 212; this.LIST_H = H - 50 - 26;
    this.DET_X  = this.LIST_X + this.LIST_W + 8;
    this.DET_Y  = 50;
    this.DET_W  = W - this.DET_X - 16;
    this.DET_H  = H - 50 - 26;
    this.rowsTop    = this.LIST_Y + 24;
    this.rowsBottom = this.LIST_Y + this.LIST_H - 24;

    const listBg = this.add.graphics();
    drawGlowPanel(listBg, this.LIST_X, this.LIST_Y, this.LIST_W, this.LIST_H, UI.ACCENT_ARCANE, UI.BG_MID, 8, 0.55);

    // Depth explicite : sans ça, les lignes recréées à chaque renderList() finissent
    // plus tard dans la display list et passent PAR-DESSUS la scrollbar (bug reporté).
    this.scrollbarGfx = this.add.graphics().setDepth(5);

    this.add.text(W / 2, H - 16, t('arsenal.hint'), uiStyle(8, UI.TXT_HINT)).setOrigin(0.5);

    this.buildRows();
    this.maxScrollOffset = this.computeMaxOffset();

    const firstDiscovered = SECTION_ORDER
      .flatMap(type => Object.values(ALL_ITEMS).filter(i => i.type === type))
      .find(i => ArsenalSystem.peekEntry(this.world, i.id).discovered);
    this.selectedId = firstDiscovered?.id ?? (this.itemRowIndices.length > 0
      ? (this.rows[this.itemRowIndices[0]] as { kind: 'item'; id: string }).id
      : null);
    if (this.selectedId) this.ensureVisible(this.rowIndexOf(this.selectedId));

    this.renderList();
    this.renderDetail();

    this.setupInputs();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  // ════════════════════════════════════════════════════════════
  // DONNÉES DE LISTE
  // ════════════════════════════════════════════════════════════

  private buildRows() {
    for (const sectionType of SECTION_ORDER) {
      const items = Object.values(ALL_ITEMS).filter(i => i.type === sectionType);
      if (items.length === 0) continue;
      this.rows.push({ kind: 'header', label: t(SECTION_LABEL_KEYS[sectionType] ?? '').toUpperCase() });
      for (const item of items) {
        this.itemRowIndices.push(this.rows.length);
        this.rows.push({ kind: 'item', id: item.id });
      }
    }
  }

  private rowIndexOf(itemId: string): number {
    return this.rows.findIndex(r => r.kind === 'item' && r.id === itemId);
  }

  private lastVisibleFrom(offset: number): number {
    let y = this.rowsTop;
    let i = offset;
    while (i < this.rows.length) {
      const rh = this.rows[i].kind === 'header' ? HEADER_ROW_H : ITEM_ROW_H;
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
    this.renderList();
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
      const rh = row.kind === 'header' ? HEADER_ROW_H : ITEM_ROW_H;
      if (y + rh > this.rowsBottom) break;
      if (row.kind === 'header') this.renderHeaderRow(row.label, x, y, w);
      else                       this.renderItemRow(row.id, x, y, w);
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
    const hit = this.add.rectangle(cx, cy, this.LIST_W - 8, 26, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => txt.setAlpha(1));
    hit.on('pointerout',  () => txt.setAlpha(0.8));
    hit.on('pointerdown', () => onTap());
    this.listObjs.push(txt, hit);
  }

  private renderHeaderRow(label: string, x: number, y: number, w: number) {
    const cy = y + HEADER_ROW_H / 2;
    const g = this.add.graphics();
    g.fillStyle(UI.ACCENT_ARCANE, 0.9);
    g.fillRoundedRect(x + 6, cy - 3, 6, 6, 1.5);
    const txt = this.add.text(x + 18, cy, label, uiStyle(8, UI.TXT_CYAN, { bold: true })).setOrigin(0, 0.5);
    g.lineStyle(1, UI.ACCENT_ARCANE, 0.25);
    g.beginPath();
    g.moveTo(x + 22 + txt.width, cy);
    g.lineTo(x + w - 4, cy);
    g.strokePath();
    this.listObjs.push(g, txt);
  }

  private renderItemRow(id: string, x: number, y: number, w: number) {
    const item = ALL_ITEMS[id];
    if (!item) return;
    const entry = ArsenalSystem.peekEntry(this.world, id);
    const isSelected = id === this.selectedId;
    const rarHex = rarityHex(item.rarity);
    const cy = y + ITEM_ROW_H / 2;

    const bg = this.add.rectangle(x + w / 2, cy, w, ITEM_ROW_H, isSelected ? UI.BTN_BG_HOVER : UI.BTN_BG, 1)
      .setInteractive({ useHandCursor: true });
    this.listObjs.push(bg);

    const deco = this.add.graphics();
    if (isSelected) {
      deco.fillStyle(UI.ACCENT_ARCANE, 1);
      deco.fillRect(x, y, 3, ITEM_ROW_H);
    }
    deco.lineStyle(1, entry.discovered ? rarHex : UI.SLOT_BORDER, entry.discovered ? 0.8 : 0.5);
    deco.strokeRoundedRect(x + 2, y + 2, w - 4, ITEM_ROW_H - 4, 4);
    this.listObjs.push(deco);

    // Icône 32×32 (ou silhouette "?" si non découvert)
    const iconKey = this.resolveIcon(item);
    const icx = x + 24;
    if (entry.discovered) {
      this.listObjs.push(
        this.add.image(icx, cy, iconKey).setDisplaySize(28, 28),
      );
    } else {
      const ph = this.add.graphics();
      ph.fillStyle(0x232336, 1);
      ph.fillCircle(icx, cy, 14);
      this.listObjs.push(ph,
        this.add.text(icx, cy, '?', uiStyle(9, UI.TXT_WHITE, { bold: true })).setOrigin(0.5),
      );
    }

    const rawName = entry.discovered ? localizeItem(item).name : t('arsenal.unknown');
    const name = rawName.length > 16 ? rawName.slice(0, 15) + '..' : rawName;
    const nameColor = entry.discovered ? (RARITY_COLORS[item.rarity] ?? UI.TXT_PARCHMENT) : UI.TXT_MUTED;
    this.listObjs.push(
      this.add.text(x + 44, y + 9, name, uiStyle(9, nameColor, { bold: entry.discovered })),
    );
    this.listObjs.push(
      this.add.text(x + 44, y + 26, entry.discovered ? t(`rarity.${item.rarity}`) : t('arsenal.locked'),
        uiStyle(7, UI.TXT_MUTED)),
    );

    bg.on('pointerover', () => { if (id !== this.selectedId) bg.setFillStyle(0x181628, 1); });
    bg.on('pointerout',  () => { if (id !== this.selectedId) bg.setFillStyle(UI.BTN_BG, 1); });
    bg.on('pointerdown', () => this.selectItem(id));
  }

  private selectItem(id: string) {
    if (this.selectedId === id) return;
    this.selectedId = id;
    this.renderList();
    this.renderDetail();
  }

  // ════════════════════════════════════════════════════════════
  // PANNEAU DÉTAIL
  // ════════════════════════════════════════════════════════════

  private renderDetail() {
    this.detailObjs.forEach(o => o.destroy());
    this.detailObjs = [];
    if (!this.selectedId) return;

    const item = ALL_ITEMS[this.selectedId];
    if (!item) return;
    const entry = ArsenalSystem.peekEntry(this.world, this.selectedId);
    const rarHex = rarityHex(item.rarity);
    const accent = entry.discovered ? rarHex : UI.BORDER_LIT;
    const pad = 14;

    const bg = this.add.graphics();
    drawGlowPanel(bg, this.DET_X, this.DET_Y, this.DET_W, this.DET_H, accent, UI.BG_MID, 8, 0.55);
    this.detailObjs.push(bg);

    // ── Icône (96×96) ─────────────────────────────────────────
    const px = this.DET_X + pad;
    const py = this.DET_Y + pad;
    const pFrame = this.add.graphics();
    drawCard(pFrame, px, py, 96, 96, { bg: 0x080810, radius: 8, shadow: false });
    this.detailObjs.push(pFrame);

    const iconKey = this.resolveIcon(item);
    if (entry.discovered) {
      this.detailObjs.push(
        this.add.image(px + 48, py + 48, iconKey).setDisplaySize(76, 76),
      );
    } else {
      const ph = this.add.graphics();
      ph.fillStyle(0x2a2a3a, 0.9);
      ph.fillCircle(px + 48, py + 48, 32);
      this.detailObjs.push(ph,
        this.add.text(px + 48, py + 48, '?', uiStyle(18, UI.TXT_WHITE, { bold: true })).setOrigin(0.5),
      );
    }

    // ── Bloc identité ──────────────────────────────────────────
    const ix = px + 96 + 14;
    const iw = this.DET_X + this.DET_W - pad - ix;
    let iy = py + 2;

    const loc = localizeItem(item);
    const displayName = entry.discovered ? loc.name : t('arsenal.unknown');
    const nameColor = entry.discovered ? (RARITY_COLORS[item.rarity] ?? UI.TXT_PARCHMENT) : UI.TXT_MUTED;
    const nameTxt = this.add.text(ix, iy, displayName, uiStyle(13, nameColor, { bold: true, wordWrapWidth: iw }));
    this.detailObjs.push(nameTxt);
    iy += nameTxt.height + 10;

    let bx = ix;
    bx += this.addInfoBadge(bx, iy + 7,
      entry.discovered ? t(`rarity.${item.rarity}`) : t('arsenal.locked'),
      0x1a2030, entry.discovered ? nameColor : UI.TXT_MUTED);
    if (entry.discovered && item.element && item.element !== ElementType.NEUTRAL) {
      const elemColor = ELEMENT_COLORS[item.element] ?? ELEMENT_COLORS[ElementType.NEUTRAL];
      const elemTxt = BRIGHT_ELEMENTS.includes(item.element) ? '#101018' : '#f5edd0';
      bx += this.addInfoBadge(bx, iy + 7, t(`element.${item.element}`), elemColor, elemTxt);
    }
    iy += 26;

    // ── Stats principales (selon le type d'item) ───────────────
    if (entry.discovered) {
      for (const line of this.statLines(item)) {
        this.detailObjs.push(this.add.text(ix, iy, line, uiStyle(9, UI.TXT_PARCHMENT)));
        iy += 15;
      }
    }

    // ── Description / lore ──────────────────────────────────────
    const descY = this.DET_Y + pad + 96 + 18;
    this.addSectionTitle(t('arsenal.description_title'), descY);

    const descText = !entry.discovered
      ? t('arsenal.not_discovered')
      : (loc.lore ?? loc.description);
    const descColor = entry.discovered ? UI.TXT_PARCHMENT : UI.TXT_MUTED;
    this.detailObjs.push(
      this.add.text(this.DET_X + pad, descY + 18, descText,
        uiStyle(9, descColor, { wordWrapWidth: this.DET_W - pad * 2, lineSpacing: 5 })),
    );
  }

  /**
   * Résout la texture d'icône d'un item — priorité à `item.icon` (couvre les items
   * HIDDEN dont l'icon ne mirror pas l'id, ex: hidden_mirror_helm -> item_mirror_helm),
   * sinon fallback par type. Mirror de InventoryScene.resolveIcon().
   */
  private resolveIcon(item: Item): string {
    if (this.textures.exists(item.icon)) return item.icon;
    return itemTextureKey(item.id, item.type, k => this.textures.exists(k));
  }

  /** Lignes de stats affichées dans le panneau détail, selon le type d'objet. */
  private statLines(item: Item): string[] {
    const lines: string[] = [];
    if ('weaponType' in item) {
      const w = item as Weapon;
      if (w.damage)      lines.push(`${t('stats.atk')}: ${w.damage}`);
      if (w.magicDamage) lines.push(`${t('stats.matk')}: ${w.magicDamage}`);
      lines.push(`${t('stats.aspd')}: ×${w.attackSpeed.toFixed(1)}`);
    } else if ('defense' in item) {
      const a = item as Armor;
      lines.push(`${t('stats.def')}: ${a.defense}`);
      lines.push(`${t('stats.mdef')}: ${a.magicDefense}`);
    }
    // Accessory.passiveEffect n'est volontairement pas affiché ici : ce champ n'est
    // pas traduit dans la data (souvent écrit en anglais brut, ex: HIDDEN_ACCESSORIES)
    // — l'afficher tel quel montrerait de l'anglais à un joueur en FR. À revoir si
    // une passe de localisation dédiée est faite sur ce champ.
    return lines;
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

    const onWheel = (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) =>
      this.scroll(dy > 0 ? 1 : -1);
    this.wheelHandler = onWheel;
    this.input.on('wheel', onWheel);

    const onDown = (p: Phaser.Input.Pointer) => {
      if (p.x >= this.LIST_X && p.x <= this.LIST_X + this.LIST_W
        && p.y >= this.LIST_Y && p.y <= this.LIST_Y + this.LIST_H) {
        this.dragging = true;
        this.dragAccum = 0;
      }
    };
    const onMove = (p: Phaser.Input.Pointer) => {
      if (!this.dragging || !p.isDown) return;
      this.dragAccum += p.y - p.prevPosition.y;
      while (this.dragAccum <= -ITEM_ROW_H) { this.scroll(1);  this.dragAccum += ITEM_ROW_H; }
      while (this.dragAccum >=  ITEM_ROW_H) { this.scroll(-1); this.dragAccum -= ITEM_ROW_H; }
    };
    const onUp = () => { this.dragging = false; };
    this.pointerDownHandler = onDown;
    this.pointerMoveHandler = onMove;
    this.pointerUpHandler   = onUp;
    this.input.on('pointerdown', onDown);
    this.input.on('pointermove', onMove);
    this.input.on('pointerup',   onUp);
  }

  private navigate(dir: number) {
    if (!this.selectedId || this.itemRowIndices.length === 0) return;
    const currentRow = this.rowIndexOf(this.selectedId);
    const pos = this.itemRowIndices.indexOf(currentRow);
    const nextPos = (pos + dir + this.itemRowIndices.length) % this.itemRowIndices.length;
    const nextRow = this.rows[this.itemRowIndices[nextPos]];
    if (nextRow.kind !== 'item') return;
    this.selectedId = nextRow.id;
    this.ensureVisible(this.itemRowIndices[nextPos]);
    this.renderList();
    this.renderDetail();
  }

  // ════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ════════════════════════════════════════════════════════════

  // Public : GameScene.escKey l'appelle directement pour fermer proprement
  // (resume PauseScene sous-jacente au lieu d'un setPaused(false) qui la
  // laisserait bloquée en pause pour toujours — cf. bug ESC reporté).
  close() {
    this.scene.stop();
    if (this.scene.isPaused('PauseScene')) {
      this.scene.resume('PauseScene');
    } else if (this.gameScene) {
      this.gameScene.setPaused(false);
    }
  }

  shutdown() {
    if (this.keyUp)   { this.keyUp.removeAllListeners();   this.input.keyboard?.removeKey(this.keyUp, true);   this.keyUp = null; }
    if (this.keyDown) { this.keyDown.removeAllListeners(); this.input.keyboard?.removeKey(this.keyDown, true); this.keyDown = null; }
    if (this.wheelHandler)       { this.input.off('wheel', this.wheelHandler);             this.wheelHandler = null; }
    if (this.pointerDownHandler) { this.input.off('pointerdown', this.pointerDownHandler); this.pointerDownHandler = null; }
    if (this.pointerMoveHandler) { this.input.off('pointermove', this.pointerMoveHandler); this.pointerMoveHandler = null; }
    if (this.pointerUpHandler)   { this.input.off('pointerup', this.pointerUpHandler);     this.pointerUpHandler = null; }
    this.listObjs = [];
    this.detailObjs = [];
  }
}
