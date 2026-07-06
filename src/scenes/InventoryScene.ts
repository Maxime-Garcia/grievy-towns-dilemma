import { GameScene } from './GameScene';
import {
  PlayerState, Item, ItemType, Weapon, Armor, Accessory, Consumable,
  StatBonus, RARITY_COLORS, EquipStats,
} from '../types';
import { InventorySystem, setInventoryPlayerContext } from '../systems/InventorySystem';
import { StatsSystem } from '../systems/StatsSystem';
import { ALL_ITEMS } from '../data/items';
import { UI, drawPanel, drawGlowPanel, pxStyle } from '../utils/UITheme';
import { itemTextureKey } from '../utils/ItemAssets';
import { t, localizeItem } from '../i18n';

// ── Layout constants ──────────────────────────────────────────────────────────
const MARGIN     = 8;
const HEADER_H   = 36;
const FOOTER_H   = 20;
const GAP        = 6;
const EQ_PAN_W   = 180;   // left panel: equipment paperdoll
const STAT_PAN_W = 220;   // center panel: stats / item detail
const EQ_SLOT    = 44;    // equipment slot size
const INV_SLOT   = 48;    // inventory slot size
const INV_COLS   = 7;     // inventory grid columns

// Excludes 'skins' which is not a display slot
type EquipSlotKey = 'helm' | 'cape' | 'chest' | 'gloves' | 'weapon' | 'legs' | 'boots' | 'ring1' | 'ring2' | 'amulet';
const EQ_ORDER: EquipSlotKey[] = [
  'helm', 'cape', 'chest', 'gloves', 'weapon', 'legs', 'boots', 'ring1', 'ring2', 'amulet',
];

// Item types that have a direct equipment slot (used by doMainAction + renderItemDetail)
const EQUIP_TYPES: ItemType[] = [
  ItemType.WEAPON, ItemType.HELM,   ItemType.CHEST, ItemType.LEGS,
  ItemType.BOOTS,  ItemType.GLOVES, ItemType.CAPE,  ItemType.RING, ItemType.AMULET,
];

interface PanelBounds { x: number; y: number; w: number; h: number }


export class InventoryScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private player!: PlayerState;

  // Dynamic objects are destroyed and recreated on every refresh
  private dynamicObjs: Phaser.GameObjects.GameObject[] = [];
  private scrollMaskGfx?: Phaser.GameObjects.Graphics;

  // Static objects set once in create(), updated in refresh()
  private goldText!: Phaser.GameObjects.Text;

  // Panel bounds — computed in create() and reused
  private eqBounds!: PanelBounds;   // left  — equipment
  private stBounds!: PanelBounds;   // center — stats / detail
  private bagBounds!: PanelBounds;  // right  — inventory grid

  // Which item is currently shown in the detail panel (null → show stats)
  private selectedItemId: string | null = null;

  private keyEsc?: Phaser.Input.Keyboard.Key;
  private keyZ?: Phaser.Input.Keyboard.Key;

  // Long-press detection: single ref, cleared on pointerup / pointerout / shutdown
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  // Which paperdoll slot to flash after a successful tap-equip
  private lastFlashSlotKey: EquipSlotKey | null = null;

  // Consume-confirm popup state
  private consumePopupObjects: Phaser.GameObjects.GameObject[] = [];
  private consumePopupTimer: Phaser.Time.TimerEvent | null = null;
  private consumePopupDismissHit: Phaser.GameObjects.Rectangle | null = null;

  constructor() { super({ key: 'InventoryScene' }); }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  init(data?: { gameScene?: GameScene }) {
    if (!data?.gameScene) { this.scene.stop(); return; }
    this.gameScene      = data.gameScene;
    this.player         = data.gameScene.gameState.player;
    this.selectedItemId = null;
  }

  create() {
    this.dynamicObjs = [];
    this.cameras.main.fadeIn(300, 0, 0, 0);

    const W      = this.cameras.main.width;
    const H      = this.cameras.main.height;
    const CONT_Y = HEADER_H + 4;
    const CONT_H = H - CONT_Y - FOOTER_H - MARGIN;

    // Compute the three panel bounds once
    const eqX   = MARGIN + 2;
    const stX   = eqX  + EQ_PAN_W   + GAP;
    const bagX  = stX  + STAT_PAN_W + GAP;
    const bagW  = W - MARGIN - 2 - bagX;

    this.eqBounds  = { x: eqX,  y: CONT_Y, w: EQ_PAN_W,   h: CONT_H };
    this.stBounds  = { x: stX,  y: CONT_Y, w: STAT_PAN_W, h: CONT_H };
    this.bagBounds = { x: bagX, y: CONT_Y, w: bagW,        h: CONT_H };

    // ── Background overlay (0.88 standard — le jeu reste visible derrière) ─
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);

    // ── Outer frame (fond translucide 0.85) ──────────────────────────────
    const frameGfx = this.add.graphics();
    drawPanel(frameGfx, MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2, UI.PANEL_BG, 0.85);

    // ── Header title ──────────────────────────────────────────────────────
    this.add.text(W / 2, MARGIN + 6, t('inventory.title'), pxStyle(11, UI.TXT_GOLD, true)).setOrigin(0.5, 0);

    // ── Header separator ──────────────────────────────────────────────────
    const sepGfx = this.add.graphics();
    sepGfx.lineStyle(1, UI.BORDER_LIT, 0.6);
    sepGfx.beginPath();
    sepGfx.moveTo(MARGIN + 4, HEADER_H);
    sepGfx.lineTo(W - MARGIN - 4, HEADER_H);
    sepGfx.strokePath();

    // ── Gold display (top-right) ──────────────────────────────────────────
    const goldBg = this.add.graphics();
    drawPanel(goldBg, W - MARGIN - 132, MARGIN + 4, 122, 20, UI.SLOT_BG);
    this.goldText = this.add.text(
      W - MARGIN - 71, MARGIN + 14,
      `${this.player.gold} ${t('inventory.gold')}`,
      pxStyle(7, UI.TXT_GOLD),
    ).setOrigin(0.5);

    // ── Footer close hint ─────────────────────────────────────────────────
    this.add.text(W / 2, H - MARGIN - 4, t('inventory.close'), pxStyle(7, UI.TXT_HINT))
      .setOrigin(0.5, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.close());

    // ── Static panel backgrounds ──────────────────────────────────────────
    const eqBg  = this.add.graphics();
    drawPanel(eqBg,  this.eqBounds.x,  this.eqBounds.y,  this.eqBounds.w,  this.eqBounds.h,  UI.SLOT_BG);

    const stBg  = this.add.graphics();
    drawPanel(stBg,  this.stBounds.x,  this.stBounds.y,  this.stBounds.w,  this.stBounds.h,  UI.SLOT_BG);

    const bagBg = this.add.graphics();
    drawPanel(bagBg, this.bagBounds.x, this.bagBounds.y, this.bagBounds.w, this.bagBounds.h, UI.SLOT_BG);

    // ── Static panel titles ───────────────────────────────────────────────
    this.add.text(
      this.eqBounds.x  + this.eqBounds.w  / 2, this.eqBounds.y  + 6,
      t('inventory.equipment'), pxStyle(7, UI.TXT_GOLD),
    ).setOrigin(0.5, 0);

    this.add.text(
      this.bagBounds.x + this.bagBounds.w / 2, this.bagBounds.y + 6,
      'SACS', pxStyle(7, UI.TXT_GOLD),
    ).setOrigin(0.5, 0);

    // ── Keyboard ──────────────────────────────────────────────────────────
    this.keyEsc = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyEsc.on('down', () => this.close());

    // Z → trigger main action on the currently selected item (equip / use).
    // Safe to use: GameScene.update() bails out early when menuOpen = true, so
    // the ZQSD movement poll never runs while the inventory is open.
    this.keyZ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyZ.on('down', () => {
      if (this.selectedItemId !== null) this.doMainAction(this.selectedItemId);
    });

    // ── Dynamic content ───────────────────────────────────────────────────
    this.renderEquipment();
    this.renderCenter();
    this.renderGrid();
  }

  // ── Equipment paperdoll (left panel) ──────────────────────────────────────

  private renderEquipment() {
    const { x: PX, y: PY, h: PH } = this.eqBounds;
    const TITLE_H  = 22;
    const PAD_X    = 8;
    const PAD_Y    = 4;
    const LABEL_X  = PX + PAD_X + EQ_SLOT + 8;
    const availH   = PH - TITLE_H;
    const rowStep  = Math.min(EQ_SLOT + 6, Math.floor(availH / EQ_ORDER.length));

    EQ_ORDER.forEach((key, i) => {
      const sy       = PY + TITLE_H + PAD_Y + i * rowStep;
      const sx       = PX + PAD_X;
      const item     = this.player.equipment[key] as Item | undefined;
      const rarHex   = item
        ? parseInt((RARITY_COLORS[item.rarity] ?? '#666666').replace('#', ''), 16)
        : UI.SLOT_BORDER;

      // Slot background
      const bg = this.add.graphics();
      bg.fillStyle(UI.SLOT_BG, 1);
      bg.fillRect(sx, sy, EQ_SLOT, EQ_SLOT);
      bg.lineStyle(2, rarHex, item ? 1 : 0.3);
      bg.strokeRect(sx, sy, EQ_SLOT, EQ_SLOT);
      this.dynamicObjs.push(bg);

      if (item) {
        const iconKey = this.resolveIcon(item);
        if (iconKey) {
          try {
            const img = this.add.image(sx + EQ_SLOT / 2, sy + EQ_SLOT / 2, iconKey).setDisplaySize(32, 32);
            this.dynamicObjs.push(img);
          } catch {
            this.addColorSquare(sx + 4, sy + 4, EQ_SLOT - 8, rarHex);
          }
        } else {
          this.addColorSquare(sx + 4, sy + 4, EQ_SLOT - 8, rarHex);
        }
      } else {
        // Empty slot: abbreviated slot label centered inside
        const abbr = t(`inventory.slot.${key}`).slice(0, 3).toUpperCase();
        this.dynamicObjs.push(
          this.add.text(sx + EQ_SLOT / 2, sy + EQ_SLOT / 2, abbr, pxStyle(5, UI.TXT_HINT)).setOrigin(0.5),
        );
      }

      // Slot name label
      this.dynamicObjs.push(
        this.add.text(LABEL_X, sy + 4, t(`inventory.slot.${key}`), pxStyle(5, UI.TXT_MUTED)).setOrigin(0, 0),
      );

      // Item name (truncated to fit label area)
      if (item) {
        const raw   = localizeItem(item).name;
        const name  = raw.length > 11 ? `${raw.slice(0, 9)}..` : raw;
        const color = RARITY_COLORS[item.rarity] ?? UI.TXT_PARCHMENT;
        this.dynamicObjs.push(
          this.add.text(LABEL_X, sy + 16, name, pxStyle(5, color)).setOrigin(0, 0),
        );
      }

      // Interactive hit zone on occupied slot
      if (item) {
        const hit = this.add.rectangle(sx + EQ_SLOT / 2, sy + EQ_SLOT / 2, EQ_SLOT, EQ_SLOT, 0x000000, 0)
          .setInteractive({ useHandCursor: true });
        this.dynamicObjs.push(hit);
        hit.on('pointerover', () => { bg.lineStyle(2, 0xffffff, 0.8); bg.strokeRect(sx, sy, EQ_SLOT, EQ_SLOT); });
        hit.on('pointerout',  () => { bg.lineStyle(2, rarHex, 1);     bg.strokeRect(sx, sy, EQ_SLOT, EQ_SLOT); });
        hit.on('pointerdown', () => this.showDetail(item.id));

        // White flash overlay — drawn last so it renders above icon/hit zone.
        // Triggered when this slot was just filled by a tap-equip action.
        if (this.lastFlashSlotKey === key) {
          this.lastFlashSlotKey = null;
          const flash = this.add.graphics();
          flash.fillStyle(0xffffff, 0.8);
          flash.fillRect(sx, sy, EQ_SLOT, EQ_SLOT);
          this.dynamicObjs.push(flash);
          this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 400,
            ease: 'Quad.easeOut',
            onComplete: () => { if (flash.active) flash.destroy(); },
          });
        }
      }
    });
  }

  // ── Center panel dispatcher ───────────────────────────────────────────────

  private renderCenter() {
    if (this.selectedItemId !== null) {
      this.renderItemDetail(this.selectedItemId);
    } else {
      this.renderStats();
    }
  }

  // ── Stats view (center panel, default) ───────────────────────────────────

  private renderStats() {
    const { x: PX, y: PY, w: PW, h: PH } = this.stBounds;

    this.dynamicObjs.push(
      this.add.text(PX + PW / 2, PY + 6, 'STATISTIQUES', pxStyle(7, UI.TXT_GOLD)).setOrigin(0.5, 0),
    );

    const sepTop = this.add.graphics();
    sepTop.lineStyle(1, UI.BORDER_LIT, 0.5);
    sepTop.beginPath();
    sepTop.moveTo(PX + 8, PY + 22);
    sepTop.lineTo(PX + PW - 8, PY + 22);
    sepTop.strokePath();
    this.dynamicObjs.push(sepTop);

    const s = this.player.stats;
    const a = this.player.attributes;
    const rows: [string, string][] = [
      ['ATK',     String(s.atk + (this.player.equipment.weapon?.damage ?? 0))],
      ['MATK',    String(s.magicAtk)],
      ['DEF',     String(s.def)],
      ['MDEF',    String(s.magicDef)],
      ['HP max',  String(s.maxHp)],
      ['MP max',  String(s.maxMana)],
      ['CRIT %',  `${(5 + a.agi * 0.3).toFixed(1)}%`],
      ['Vitesse', String(s.spd)],
    ];

    const COL1   = PX + 10;
    const COL2   = PX + PW - 10;
    const STARTY = PY + 28;
    const ROW_H  = 18;

    rows.forEach(([label, value], i) => {
      const y = STARTY + i * ROW_H;
      this.dynamicObjs.push(
        this.add.text(COL1, y, label, pxStyle(6, UI.TXT_MUTED)),
        this.add.text(COL2, y, value, pxStyle(6, UI.TXT_PARCHMENT)).setOrigin(1, 0),
      );
    });

    const sepBot = this.add.graphics();
    sepBot.lineStyle(1, UI.BORDER_LIT, 0.35);
    sepBot.beginPath();
    sepBot.moveTo(PX + 8,      STARTY + rows.length * ROW_H + 4);
    sepBot.lineTo(PX + PW - 8, STARTY + rows.length * ROW_H + 4);
    sepBot.strokePath();
    this.dynamicObjs.push(sepBot);

    this.dynamicObjs.push(
      this.add.text(PX + PW / 2, PY + PH - 12, 'Tap = action  •  Maintenir = détail', pxStyle(5, UI.TXT_HINT)).setOrigin(0.5, 1),
    );
  }

  // ── Item detail view (center panel, when item selected) ───────────────────

  private renderItemDetail(itemId: string) {
    const item = ALL_ITEMS[itemId];
    if (!item) { this.selectedItemId = null; this.renderStats(); return; }

    const { x: PX, y: PY, w: PW, h: PH } = this.stBounds;
    const locItem  = localizeItem(item);
    const rarColor = RARITY_COLORS[item.rarity] ?? UI.TXT_PARCHMENT;

    // ── Header ───────────────────────────────────────────────────────────
    const back = this.add.text(PX + 8, PY + 6, '← Stats', pxStyle(6, UI.TXT_BLUE))
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => back.setColor(UI.TXT_GOLD))
      .on('pointerout',  () => back.setColor(UI.TXT_BLUE))
      .on('pointerdown', () => { this.selectedItemId = null; this.refresh(); });
    this.dynamicObjs.push(back);

    this.dynamicObjs.push(
      this.add.text(PX + PW / 2, PY + 6, 'DÉTAIL', pxStyle(7, UI.TXT_GOLD)).setOrigin(0.5, 0),
    );

    const sepTop = this.add.graphics();
    sepTop.lineStyle(1, UI.BORDER_LIT, 0.5);
    sepTop.beginPath();
    sepTop.moveTo(PX + 8, PY + 22);
    sepTop.lineTo(PX + PW - 8, PY + 22);
    sepTop.strokePath();
    this.dynamicObjs.push(sepTop);

    // ── Item identity ─────────────────────────────────────────────────────
    let curY = PY + 28;

    this.dynamicObjs.push(
      this.add.text(PX + PW / 2, curY, `[${item.rarity}]`, pxStyle(6, rarColor)).setOrigin(0.5, 0),
    );
    curY += 14;

    const nameTxt = this.add.text(PX + PW / 2, curY, locItem.name, {
      ...pxStyle(8, rarColor, true),
      wordWrap: { width: PW - 20 },
      align: 'center',
    }).setOrigin(0.5, 0);
    this.dynamicObjs.push(nameTxt);
    curY += nameTxt.height + 8;

    // ── Main stat ─────────────────────────────────────────────────────────
    const mainLine = this.getItemMainStat(item);
    if (mainLine) {
      this.dynamicObjs.push(
        this.add.text(PX + PW / 2, curY, mainLine, pxStyle(9, UI.TXT_GOLD, true)).setOrigin(0.5, 0),
      );
      curY += 22;
    }

    const sepMid = this.add.graphics();
    sepMid.lineStyle(1, UI.BORDER_LIT, 0.3);
    sepMid.beginPath();
    sepMid.moveTo(PX + 8, curY);
    sepMid.lineTo(PX + PW - 8, curY);
    sepMid.strokePath();
    this.dynamicObjs.push(sepMid);
    curY += 8;

    // ── Substats ──────────────────────────────────────────────────────────
    for (const line of this.getItemSubstats(item)) {
      this.dynamicObjs.push(
        this.add.text(PX + 14, curY, `• ${line}`, pxStyle(6, UI.TXT_PARCHMENT)),
      );
      curY += 13;
    }
    curY += 4;

    // ── Description ───────────────────────────────────────────────────────
    const descTxt = this.add.text(PX + 10, curY, locItem.description, {
      ...pxStyle(6, UI.TXT_MUTED),
      wordWrap: { width: PW - 20 },
    });
    this.dynamicObjs.push(descTxt);

    // ── Action buttons (bottom of panel) ─────────────────────────────────
    const isEquip = EQUIP_TYPES.includes(item.type);
    const isUse    = item.type === ItemType.CONSUMABLE;
    const isSell   = item.type !== ItemType.KEY_ITEM;
    const btnCount = (isEquip || isUse ? 1 : 0) + (isSell ? 1 : 0) + 1; // +1 for close
    const BTN_H    = 20;
    const BTN_W    = PW - 20;
    const BTN_X    = PX + 10;
    let   btnY     = PY + PH - btnCount * (BTN_H + 6) - 4;

    const addBtn = (label: string, color: string, onClick: () => void) => {
      const y       = btnY;
      const bgGfx   = this.add.graphics();
      bgGfx.fillStyle(UI.BTN_BG, 1);
      bgGfx.fillRect(BTN_X, y, BTN_W, BTN_H);
      bgGfx.lineStyle(1, UI.BTN_BORDER, 1);
      bgGfx.strokeRect(BTN_X, y, BTN_W, BTN_H);
      const txt = this.add.text(BTN_X + BTN_W / 2, y + BTN_H / 2, label, pxStyle(6, color)).setOrigin(0.5);
      const hit = this.add.rectangle(BTN_X + BTN_W / 2, y + BTN_H / 2, BTN_W, BTN_H, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          bgGfx.lineStyle(1, UI.BTN_BORDER_HOV, 1);
          bgGfx.strokeRect(BTN_X, y, BTN_W, BTN_H);
          txt.setColor(UI.TXT_GOLD);
        })
        .on('pointerout', () => {
          bgGfx.lineStyle(1, UI.BTN_BORDER, 1);
          bgGfx.strokeRect(BTN_X, y, BTN_W, BTN_H);
          txt.setColor(color);
        })
        .on('pointerdown', onClick);
      this.dynamicObjs.push(bgGfx, txt, hit);
      btnY += BTN_H + 6;
    };

    if (isEquip) {
      addBtn(t('inventory.equip_hint'), UI.TXT_GREEN, () => {
        setInventoryPlayerContext(this.player);
        InventorySystem.equip(this.player, itemId);
        this.selectedItemId = null;
        this.refresh();
      });
    }
    if (isUse) {
      addBtn(t('inventory.use_hint'), UI.TXT_GREEN, () => {
        // Route through the confirm popup — the popup centres itself in the
        // detail panel area when no slot coords are given
        const cx = this.stBounds.x + this.stBounds.w / 2;
        const cy = this.stBounds.y + this.stBounds.h / 2;
        this.showConsumeConfirmPopup(item as Consumable, cx, cy);
      });
    }
    if (isSell) {
      addBtn(
        t('inventory.sell_hint').replace('{value}', String(item.value)),
        UI.TXT_ORANGE,
        () => {
          InventorySystem.sell(this.player, itemId, 1);
          this.selectedItemId = null;
          this.refresh();
        },
      );
    }
    addBtn(t('inventory.close_hint'), UI.TXT_MUTED, () => {
      this.selectedItemId = null;
      this.refresh();
    });
  }

  // ── Inventory grid (right panel) ──────────────────────────────────────────

  private renderGrid() {
    this.input.off('wheel');

    const { x: PX, y: PY, w: PW, h: PH } = this.bagBounds;
    const TITLE_H   = 22;
    const GRID_PAD  = 8;
    const GRID_X    = PX + GRID_PAD;
    const GRID_Y    = PY + TITLE_H;
    const VISIBLE_H = PH - TITLE_H;
    const rows      = Math.ceil(this.player.inventory.length / INV_COLS);
    const contentH  = rows * INV_SLOT;
    let   scrollY   = 0;

    // Geometry mask clips the scrollable grid area
    const maskGfx = this.make.graphics({ x: 0, y: 0 });
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRect(GRID_X - 2, GRID_Y, INV_COLS * INV_SLOT + 4, VISIBLE_H);
    const geomMask = maskGfx.createGeometryMask();
    this.scrollMaskGfx = maskGfx;

    type Settable = { setY(y: number): unknown; setMask(m: Phaser.Display.Masks.GeometryMask): unknown };
    const scrollables: { obj: Settable; baseY: number }[] = [];

    const reg = (go: Settable & Phaser.GameObjects.GameObject, baseY: number) => {
      go.setMask(geomMask);
      scrollables.push({ obj: go, baseY });
      this.dynamicObjs.push(go);
    };

    // Empty state
    if (this.player.inventory.length === 0) {
      this.dynamicObjs.push(
        this.add.text(
          PX + PW / 2, GRID_Y + VISIBLE_H / 2,
          'Inventaire vide', pxStyle(7, UI.TXT_HINT),
        ).setOrigin(0.5),
      );
    }

    this.player.inventory.forEach((slot, idx) => {
      const col    = idx % INV_COLS;
      const row    = Math.floor(idx / INV_COLS);
      const sx     = GRID_X + col * INV_SLOT;
      const topY   = GRID_Y  + row * INV_SLOT;
      const midY   = topY   + INV_SLOT / 2 - 1;
      const rarHex = parseInt((RARITY_COLORS[slot.item.rarity] ?? '#666666').replace('#', ''), 16);

      // Slot background — drawn at y=0, positioned via setY
      const bg = this.add.graphics();
      bg.fillStyle(UI.SLOT_BG, 1);
      bg.fillRect(sx, 0, INV_SLOT - 2, INV_SLOT - 2);
      bg.lineStyle(1, rarHex, 1);
      bg.strokeRect(sx, 0, INV_SLOT - 2, INV_SLOT - 2);
      bg.lineStyle(1, 0x000000, 0.3);
      bg.strokeRect(sx + 1, 1, INV_SLOT - 4, INV_SLOT - 4);
      bg.setY(topY);
      reg(bg, topY);

      // Icon (try texture, fallback to colored square)
      const iconKey = this.resolveIcon(slot.item);
      if (iconKey) {
        try {
          const img = this.add.image(sx + INV_SLOT / 2 - 1, midY, iconKey).setDisplaySize(32, 32);
          reg(img, midY);
        } catch { /* fallback below */ }
      } else {
        const sqGfx = this.add.graphics();
        sqGfx.fillStyle(rarHex, 0.5);
        sqGfx.fillRect(sx + 6, 6, INV_SLOT - 14, INV_SLOT - 14);
        sqGfx.setY(topY);
        reg(sqGfx, topY);
      }

      // Stack quantity badge
      if (slot.quantity > 1) {
        const qBaseY = topY + INV_SLOT - 5;
        const qty    = this.add.text(sx + INV_SLOT - 5, qBaseY, `${slot.quantity}`, pxStyle(6, UI.TXT_WHITE)).setOrigin(1, 1);
        reg(qty, qBaseY);
      }

      // Hit zone (invisible rectangle, interactive)
      const hit = this.add.rectangle(sx + INV_SLOT / 2 - 1, midY, INV_SLOT - 2, INV_SLOT - 2, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      reg(hit, midY);

      // Tap → immediate action (equip / use / open detail for key items).
      // Long-press ≥ 500 ms → always open the detail panel.
      hit.on('pointerdown', () => {
        this.longPressTimer = setTimeout(() => {
          this.longPressTimer = null;
          this.showDetail(slot.item.id);
        }, 500);
      });
      hit.on('pointerup', () => {
        if (this.longPressTimer !== null) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
          // Pass screen coords so the popup can anchor near the tapped slot
          const screenX = sx + INV_SLOT / 2 - 1;
          const screenY = topY + INV_SLOT / 2 - 1;
          this.doMainAction(slot.item.id, screenX, screenY);
        }
      });
      hit.on('pointerover', () => { bg.lineStyle(2, 0xffffff, 0.9); bg.strokeRect(sx, 0, INV_SLOT - 2, INV_SLOT - 2); });
      hit.on('pointerout',  () => {
        // Cancel long-press if the pointer leaves before 500 ms
        if (this.longPressTimer !== null) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
        bg.lineStyle(1, rarHex, 1); bg.strokeRect(sx, 0, INV_SLOT - 2, INV_SLOT - 2);
      });
    });

    // Mousewheel scroll
    if (contentH > VISIBLE_H) {
      const maxScroll = contentH - VISIBLE_H;
      this.input.on('wheel', (_p: unknown, _g: unknown, _dx: number, dy: number) => {
        scrollY = Phaser.Math.Clamp(scrollY + dy * 0.8, 0, maxScroll);
        for (const { obj, baseY } of scrollables) obj.setY(baseY - scrollY);
      });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Returns a valid texture key for the item icon, or null (caller draws a colored square). */
  private resolveIcon(item: Item): string | null {
    // 1. Specific per-item texture (baked in PreloaderScene.generateItemIcons)
    if (this.textures.exists(item.icon)) return item.icon;

    // 2. Weapon type sprite (baked in PreloaderScene.generateWeaponIcons)
    if ('weaponType' in item && item.weaponType) {
      const key = `wpn_${String(item.weaponType).toLowerCase()}`;
      if (this.textures.exists(key)) return key;
    }

    // 3. Category-level fallback texture (item_type_<ItemType>)
    const typeKey = itemTextureKey(item.id, item.type, k => this.textures.exists(k));
    if (typeKey !== 'item_type_generic' && this.textures.exists(typeKey)) return typeKey;

    // 4. Generic fallback if any type-level texture was generated
    if (this.textures.exists('item_type_generic')) return 'item_type_generic';

    return null;
  }

  /** Draws an opaque colored square and registers it as a dynamic object. */
  private addColorSquare(x: number, y: number, size: number, colorHex: number): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(colorHex, 0.5);
    gfx.fillRect(x, y, size, size);
    this.dynamicObjs.push(gfx);
  }

  /**
   * Returns the main stat line for the detail panel.
   * Checks for the optional `equipStats` field (future SubstatKey agent) first,
   * then falls back to the raw weapon damage / armor defense.
   */
  private getItemMainStat(item: Item): string | null {
    const es = (item as { equipStats?: EquipStats }).equipStats;
    if (es) {
      return StatsSystem.formatStat(es.mainStat.key, es.mainStat.value, es.mainStat.isPercentage);
    }
    if ('damage'  in item) return `ATK : ${(item as Weapon).damage}`;
    if ('defense' in item) return `DEF : ${(item as Armor).defense}`;
    if (item.type === ItemType.CONSUMABLE) {
      const e = (item as Consumable).effect;
      if (e.hpRestore)   return `HP + ${e.hpRestore}`;
      if (e.manaRestore) return `MP + ${e.manaRestore}`;
    }
    return null;
  }

  /**
   * Returns sub-stat lines for the detail panel.
   * Prefers `equipStats.substats` (future system), falls back to `bonusStats`.
   */
  private getItemSubstats(item: Item): string[] {
    const es = (item as { equipStats?: EquipStats }).equipStats;
    if (es && es.substats.length > 0) {
      return es.substats.map(s => StatsSystem.formatStat(s.key, s.value, s.isPercentage));
    }

    if (!('bonusStats' in item)) return [];
    const bonus  = (item as Weapon | Armor | Accessory).bonusStats;
    const NAMES: Record<string, string> = {
      hp: 'HP', mana: 'Mana', atk: 'ATK', def: 'DEF', spd: 'SPD',
      magicAtk: 'MATK', magicDef: 'MDEF',
      str: 'FOR', int: 'INT', agi: 'AGI', vit: 'VIT', end: 'END',
    };
    const lines: string[] = [];
    for (const [k, v] of Object.entries(bonus as StatBonus)) {
      if (v == null || v === 0) continue;
      lines.push(`${NAMES[k] ?? k} : ${v > 0 ? '+' : ''}${v}`);
    }
    return lines;
  }

  // ── Action helpers ─────────────────────────────────────────────────────────

  /**
   * Maps an item's type to the paperdoll slot key it will occupy after equipping.
   * Mirrors InventorySystem.getEquipSlot() so the flash targets the correct slot.
   */
  private getSlotKeyForItem(item: Item): EquipSlotKey | null {
    switch (item.type) {
      case ItemType.WEAPON:  return 'weapon';
      case ItemType.HELM:    return 'helm';
      case ItemType.CHEST:   return 'chest';
      case ItemType.LEGS:    return 'legs';
      case ItemType.BOOTS:   return 'boots';
      case ItemType.GLOVES:  return 'gloves';
      case ItemType.CAPE:    return 'cape';
      case ItemType.AMULET:  return 'amulet';
      case ItemType.RING:
        // Matches InventorySystem fallback: overwrite ring1 when both slots occupied
        if (!this.player.equipment.ring1) return 'ring1';
        if (!this.player.equipment.ring2) return 'ring2';
        return 'ring1';
      default:
        return null;
    }
  }

  /**
   * Executes the primary action for an item:
   *   - Equippable  → equip immediately + flash the paperdoll slot
   *   - Consumable  → show confirmation popup (prevents accidental use)
   *   - Key / other → open the detail panel
   *
   * Called on quick tap in the grid and by the Z key shortcut in detail view.
   */
  private doMainAction(itemId: string, slotScreenX?: number, slotScreenY?: number): void {
    const item = ALL_ITEMS[itemId];
    if (!item) return;

    if (EQUIP_TYPES.includes(item.type)) {
      setInventoryPlayerContext(this.player);
      // Compute target slot before equip() mutates player.equipment
      this.lastFlashSlotKey = this.getSlotKeyForItem(item);
      InventorySystem.equip(this.player, itemId);
      this.selectedItemId = null;
      this.refresh();
    } else if (item.type === ItemType.CONSUMABLE) {
      // Show confirmation popup instead of using immediately
      this.showConsumeConfirmPopup(item as Consumable, slotScreenX ?? this.cameras.main.width / 2, slotScreenY ?? this.cameras.main.height / 2);
    } else {
      // Key items, materials, skins: open the detail panel
      this.showDetail(itemId);
    }
  }

  // ── Consume confirmation popup ────────────────────────────────────────────

  /**
   * Builds and shows a small confirmation popup near the tapped inventory slot.
   *
   * Layout (200×110 px):
   *   • drawGlowPanel with green accent
   *   • Item icon 32×32 | item name (truncated) | effect summary
   *   • [Utiliser] button (green, ≥44 px tall) | [Annuler] button (red)
   *   • Auto-dismiss after 3 s if no action
   *   • Click outside → dismiss
   */
  private showConsumeConfirmPopup(item: Consumable, nearX: number, nearY: number): void {
    // Only one popup at a time — dismiss any existing one first
    this.closeConsumePopup();

    const W       = this.cameras.main.width;
    const H       = this.cameras.main.height;
    const PW      = 210;
    const PH      = 116;
    const MARGIN  = 6;

    // Anchor near the slot, clamp so the popup stays fully on screen
    let px = nearX - PW / 2;
    let py = nearY - PH - 6; // above the slot by default
    if (py < MARGIN)         py = nearY + INV_SLOT / 2 + 6; // below if not enough room
    if (px < MARGIN)         px = MARGIN;
    if (px + PW > W - MARGIN) px = W - MARGIN - PW;
    if (py + PH > H - MARGIN) py = H - MARGIN - PH;

    const depth = 50; // above all inventory objects

    // ── Full-screen dismiss hit zone (behind the popup) ───────────────────
    const dismissHit = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0)
      .setDepth(depth - 1)
      .setInteractive({ useHandCursor: false });
    dismissHit.on('pointerdown', () => this.closeConsumePopup());
    this.consumePopupDismissHit = dismissHit;
    this.consumePopupObjects.push(dismissHit);

    // ── Panel background ──────────────────────────────────────────────────
    const panelGfx = this.add.graphics().setDepth(depth);
    drawGlowPanel(panelGfx, px, py, PW, PH, 0x44cc66 /* green accent */, UI.PANEL_BG, 4, 0.97);
    this.consumePopupObjects.push(panelGfx);

    // ── Item icon (left side) ─────────────────────────────────────────────
    const iconKey  = this.resolveIcon(item);
    const iconSize = 32;
    const iconX    = px + MARGIN + iconSize / 2;
    const iconY    = py + MARGIN + iconSize / 2;

    if (iconKey) {
      try {
        const img = this.add.image(iconX, iconY, iconKey)
          .setDisplaySize(iconSize, iconSize)
          .setDepth(depth + 1);
        this.consumePopupObjects.push(img);
      } catch {
        this.addColorSquareAbove(px + MARGIN, py + MARGIN, iconSize, 0x44cc66, depth + 1);
      }
    } else {
      this.addColorSquareAbove(px + MARGIN, py + MARGIN, iconSize, 0x44cc66, depth + 1);
    }

    // ── Item name ─────────────────────────────────────────────────────────
    const locItem = localizeItem(item);
    const rawName = locItem.name;
    const name    = rawName.length > 18 ? `${rawName.slice(0, 16)}..` : rawName;
    this.consumePopupObjects.push(
      this.add.text(px + MARGIN * 2 + iconSize + 2, py + MARGIN + 2, name, {
        ...pxStyle(6, RARITY_COLORS[item.rarity] ?? UI.TXT_PARCHMENT, false),
        wordWrap: { width: PW - iconSize - MARGIN * 3 - 2 },
      }).setDepth(depth + 1),
    );

    // ── Effect summary ────────────────────────────────────────────────────
    const effectLine = this.getConsumableEffectLine(item);
    this.consumePopupObjects.push(
      this.add.text(
        px + MARGIN * 2 + iconSize + 2,
        py + MARGIN + 16,
        effectLine,
        pxStyle(6, UI.TXT_GREEN),
      ).setDepth(depth + 1),
    );

    // ── Separator ─────────────────────────────────────────────────────────
    const sepGfx = this.add.graphics().setDepth(depth + 1);
    sepGfx.lineStyle(1, UI.BORDER_LIT, 0.5);
    sepGfx.beginPath();
    sepGfx.moveTo(px + 6,      py + MARGIN * 2 + iconSize + 2);
    sepGfx.lineTo(px + PW - 6, py + MARGIN * 2 + iconSize + 2);
    sepGfx.strokePath();
    this.consumePopupObjects.push(sepGfx);

    // ── Action buttons ────────────────────────────────────────────────────
    const BTN_H  = 44; // ≥44 px for touch targets (Apple HIG)
    const BTN_W  = (PW - MARGIN * 3) / 2;
    const BTN_Y  = py + PH - BTN_H - MARGIN;
    const BTN_X1 = px + MARGIN;
    const BTN_X2 = BTN_X1 + BTN_W + MARGIN;

    // Confirm button (Utiliser)
    const confirmGfx = this.add.graphics().setDepth(depth + 1);
    confirmGfx.fillStyle(0x0d2010, 1);
    confirmGfx.fillRoundedRect(BTN_X1, BTN_Y, BTN_W, BTN_H, 3);
    confirmGfx.lineStyle(1, 0x44cc66, 1);
    confirmGfx.strokeRoundedRect(BTN_X1, BTN_Y, BTN_W, BTN_H, 3);

    const confirmTxt = this.add.text(
      BTN_X1 + BTN_W / 2, BTN_Y + BTN_H / 2,
      'Utiliser',
      pxStyle(7, UI.TXT_GREEN, true),
    ).setOrigin(0.5).setDepth(depth + 2);

    const confirmHit = this.add.rectangle(BTN_X1 + BTN_W / 2, BTN_Y + BTN_H / 2, BTN_W, BTN_H, 0x000000, 0)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        confirmGfx.lineStyle(1, 0xaaffcc, 1);
        confirmGfx.strokeRoundedRect(BTN_X1, BTN_Y, BTN_W, BTN_H, 3);
        confirmTxt.setColor(UI.TXT_GOLD);
      })
      .on('pointerout', () => {
        confirmGfx.lineStyle(1, 0x44cc66, 1);
        confirmGfx.strokeRoundedRect(BTN_X1, BTN_Y, BTN_W, BTN_H, 3);
        confirmTxt.setColor(UI.TXT_GREEN);
      })
      .on('pointerdown', () => {
        this.closeConsumePopup();
        setInventoryPlayerContext(this.player);
        InventorySystem.useConsumable(this.player, item.id);
        this.selectedItemId = null;
        this.refresh();
      });

    // Cancel button (Annuler)
    const cancelGfx = this.add.graphics().setDepth(depth + 1);
    cancelGfx.fillStyle(0x1a0808, 1);
    cancelGfx.fillRoundedRect(BTN_X2, BTN_Y, BTN_W, BTN_H, 3);
    cancelGfx.lineStyle(1, 0xcc3322, 1);
    cancelGfx.strokeRoundedRect(BTN_X2, BTN_Y, BTN_W, BTN_H, 3);

    const cancelTxt = this.add.text(
      BTN_X2 + BTN_W / 2, BTN_Y + BTN_H / 2,
      'Annuler',
      pxStyle(7, UI.TXT_RED, false),
    ).setOrigin(0.5).setDepth(depth + 2);

    const cancelHit = this.add.rectangle(BTN_X2 + BTN_W / 2, BTN_Y + BTN_H / 2, BTN_W, BTN_H, 0x000000, 0)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        cancelGfx.lineStyle(1, 0xff6655, 1);
        cancelGfx.strokeRoundedRect(BTN_X2, BTN_Y, BTN_W, BTN_H, 3);
        cancelTxt.setColor(UI.TXT_ORANGE);
      })
      .on('pointerout', () => {
        cancelGfx.lineStyle(1, 0xcc3322, 1);
        cancelGfx.strokeRoundedRect(BTN_X2, BTN_Y, BTN_W, BTN_H, 3);
        cancelTxt.setColor(UI.TXT_RED);
      })
      .on('pointerdown', () => this.closeConsumePopup());

    this.consumePopupObjects.push(
      confirmGfx, confirmTxt, confirmHit,
      cancelGfx, cancelTxt, cancelHit,
    );

    // ── Auto-dismiss timer (3 s) ───────────────────────────────────────────
    this.consumePopupTimer = this.time.addEvent({
      delay: 3000,
      callback: () => { this.consumePopupTimer = null; this.closeConsumePopup(); },
    });
  }

  /** Returns a short human-readable effect line for the popup. */
  private getConsumableEffectLine(item: Consumable): string {
    const e = item.effect;
    if (e.hpRestore)   return `HP +${e.hpRestore}`;
    if (e.manaRestore) return `MP +${e.manaRestore}`;
    if (e.hpPercent === 1.0 && e.manaPercent === 1.0) return 'HP + MP 100%';
    if (e.hpPercent)   return `HP ${Math.round(e.hpPercent * 100)}%`;
    if (e.manaPercent) return `MP ${Math.round(e.manaPercent * 100)}%`;
    if (e.revive)      return 'Résurrection HP 50%';
    if (e.statusCure)  return 'Soigne les statuts';
    return item.description.slice(0, 22);
  }

  /**
   * Draw a colored square at absolute scene coords with an explicit depth.
   * Used only by the consume popup (the normal addColorSquare() is depth-less).
   */
  private addColorSquareAbove(x: number, y: number, size: number, colorHex: number, depth: number): void {
    const gfx = this.add.graphics().setDepth(depth);
    gfx.fillStyle(colorHex, 0.5);
    gfx.fillRect(x, y, size, size);
    this.consumePopupObjects.push(gfx);
  }

  /** Destroy all popup objects and cancel the auto-dismiss timer. */
  private closeConsumePopup(): void {
    if (this.consumePopupTimer !== null) {
      this.consumePopupTimer.remove(false);
      this.consumePopupTimer = null;
    }
    for (const go of this.consumePopupObjects) {
      if (go.active) go.destroy();
    }
    this.consumePopupObjects = [];
    this.consumePopupDismissHit = null;
  }

  // ── State transitions ──────────────────────────────────────────────────────

  private showDetail(itemId: string): void {
    this.selectedItemId = itemId;
    this.refresh();
  }

  private close(): void {
    this.gameScene.closeOverlay('InventoryScene');
  }

  private refresh(): void {
    this.clearDynamic();
    this.player = this.gameScene.gameState.player;
    this.goldText.setText(`${this.player.gold} ${t('inventory.gold')}`);
    this.renderEquipment();
    this.renderCenter();
    this.renderGrid();
  }

  private clearDynamic(): void {
    this.input.off('wheel');
    // Close any open consume popup before rebuilding the scene
    this.closeConsumePopup();
    for (const go of this.dynamicObjs) {
      if (go.active) go.destroy();
    }
    this.dynamicObjs = [];
    this.scrollMaskGfx?.destroy();
    this.scrollMaskGfx = undefined;
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  shutdown() {
    const KB = this.input.keyboard;
    if (KB && this.keyEsc) KB.removeKey(this.keyEsc);
    if (KB && this.keyZ)   KB.removeKey(this.keyZ);
    // Cancel any in-flight long-press timer to prevent stale callbacks
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.input.off('wheel');
    // clearDynamic() calls closeConsumePopup() internally
    this.clearDynamic();
  }
}
