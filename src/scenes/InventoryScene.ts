import { GameScene } from './GameScene';
import {
  PlayerState, Item, ItemType, Weapon, Armor, Accessory, Consumable,
  StatBonus, RARITY_COLORS, EquipStats, ElementType, InventorySlot,
} from '../types';
import { InventorySystem, InventoryCategory } from '../systems/InventorySystem';
import { StatsSystem, BASE_CRIT_PCT, CRIT_PER_AGI_PCT, BASE_CRIT_MULT } from '../systems/StatsSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { ALL_ITEMS } from '../data/items';
import { getPassiveEffectLabel } from '../data/passiveEffects';
import {
  UI, drawGlowPanel, drawCard, drawSlot,
  drawDivider, addCloseButton, uiStyle, openScreenTransition,
} from '../utils/UITheme';
import { itemTextureKey } from '../utils/ItemAssets';
import { t, localizeItem } from '../i18n';

// Visual marker for an item's striking element, shown next to its name in the
// action popup (item.element is rolled per-instance at loot time — see
// LootSystem.applyRandomElement — so this reflects THIS specific item, not a
// fixed per-weapon theme).
const ELEMENT_GLYPHS: Partial<Record<ElementType, string>> = {
  [ElementType.FIRE]:      '🔥',
  [ElementType.EARTH]:     '⛰',
  [ElementType.WIND]:      '💨',
  [ElementType.WATER]:     '💧',
  [ElementType.LIGHTNING]: '⚡',
  [ElementType.ICE]:       '❄',
  [ElementType.DARK]:      '🌙',
  [ElementType.DIVINE]:    '✨',
};

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
const GROUP_HEADER_H = 20; // bag category header band height
const GROUP_GAP      = 6;  // breathing room after a category's last row

/** Bag category → i18n label key (mirrors ArsenalScene.SECTION_LABEL_KEYS style). */
const CATEGORY_LABEL_KEYS: Record<InventoryCategory, string> = {
  WEAPON:     'inventory.category_weapon',
  ARMOR:      'inventory.category_armor',
  ACCESSORY:  'inventory.category_accessory',
  CONSUMABLE: 'inventory.category_consumable',
  MATERIAL:   'inventory.category_material',
  KEY_ITEM:   'inventory.category_key_item',
  SKIN:       'inventory.category_skin',
};

// Minimal shape shared by every scrollable grid object (Graphics/Text/Image/Rectangle) —
// hoisted to module scope so both renderGrid() and its per-row helpers can reference it.
type ScrollableGO = { setY(y: number): unknown; setMask(m: Phaser.Display.Masks.GeometryMask): unknown };
type RegisterFn = (go: ScrollableGO & Phaser.GameObjects.GameObject, baseY: number) => void;

// Excludes 'skins' which is not a display slot
type EquipSlotKey = 'helm' | 'cape' | 'chest' | 'gloves' | 'weapon' | 'legs' | 'boots' | 'ring1' | 'ring2' | 'amulet';
const EQ_ORDER: EquipSlotKey[] = [
  'helm', 'cape', 'chest', 'gloves', 'weapon', 'legs', 'boots', 'ring1', 'ring2', 'amulet',
];

// ── Paperdoll (style Dofus) : silhouette centrale + slots autour ─────────────
// colonne 0 = gauche, 1 = centre (sur la silhouette), 2 = droite ; rangée 0-3.
const PAPERDOLL_POS: Record<EquipSlotKey, { col: 0 | 1 | 2; row: number }> = {
  amulet: { col: 0, row: 0 }, helm:  { col: 1, row: 0 }, cape:   { col: 2, row: 0 },
  weapon: { col: 0, row: 1 }, chest: { col: 1, row: 1 }, gloves: { col: 2, row: 1 },
  ring1:  { col: 0, row: 2 }, legs:  { col: 1, row: 2 }, ring2:  { col: 2, row: 2 },
  boots:  { col: 1, row: 3 },
};

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
    openScreenTransition(this);

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

    // ── Outer frame — panneau moderne arrondi, liseré arcane (refonte 07/2026)
    const frameGfx = this.add.graphics();
    drawGlowPanel(frameGfx, MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2, UI.ACCENT_ARCANE, UI.BG_DEEP, 10, 0.92);

    // ── Header title ──────────────────────────────────────────────────────
    this.add.text(W / 2, MARGIN + 8, t('inventory.title'), uiStyle(15, UI.TXT_GOLD, { bold: true, stroke: true }))
      .setOrigin(0.5, 0);

    // ── Header separator ──────────────────────────────────────────────────
    const sepGfx = this.add.graphics();
    drawDivider(sepGfx, MARGIN + 4, HEADER_H, W - (MARGIN + 4) * 2, UI.ACCENT_ARCANE, 0.35);

    // ── Close button × (haut-droite, hit 48×48) ───────────────────────────
    addCloseButton(this, W - MARGIN - 20, MARGIN + 14, () => this.close());

    // ── Gold display (pilule arrondie, à gauche du bouton ×) ──────────────
    const goldBg = this.add.graphics();
    drawCard(goldBg, W - MARGIN - 178, MARGIN + 4, 130, 24, { bg: UI.BG_MID, radius: 12, shadow: false });
    this.goldText = this.add.text(
      W - MARGIN - 113, MARGIN + 16,
      `${this.player.gold} ${t('inventory.gold')}`,
      uiStyle(11, UI.TXT_GOLD, { bold: true }),
    ).setOrigin(0.5);

    // ── Footer close hint ─────────────────────────────────────────────────
    this.add.text(W / 2, H - MARGIN - 4, t('inventory.close'), uiStyle(9, UI.TXT_HINT))
      .setOrigin(0.5, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.close());

    // ── Static panel backgrounds (cartes arrondies posées sur le fond deep) ─
    const eqBg  = this.add.graphics();
    drawGlowPanel(eqBg,  this.eqBounds.x,  this.eqBounds.y,  this.eqBounds.w,  this.eqBounds.h,  UI.ACCENT_ARCANE, UI.BG_MID, 8, 0.55);

    const stBg  = this.add.graphics();
    drawGlowPanel(stBg,  this.stBounds.x,  this.stBounds.y,  this.stBounds.w,  this.stBounds.h,  UI.ACCENT_ARCANE, UI.BG_MID, 8, 0.55);

    const bagBg = this.add.graphics();
    drawGlowPanel(bagBg, this.bagBounds.x, this.bagBounds.y, this.bagBounds.w, this.bagBounds.h, UI.ACCENT_ARCANE, UI.BG_MID, 8, 0.55);

    // ── Static panel titles (cyan arcane = structure ; l'or reste réservé
    //    à l'identité et à la valeur — titre d'écran, monnaie, raretés) ─────
    this.add.text(
      this.eqBounds.x  + this.eqBounds.w  / 2, this.eqBounds.y  + 6,
      t('inventory.equipment'), uiStyle(11, UI.TXT_CYAN, { bold: true }),
    ).setOrigin(0.5, 0);

    this.add.text(
      this.bagBounds.x + this.bagBounds.w / 2, this.bagBounds.y + 6,
      t('inventory.bag'), uiStyle(11, UI.TXT_CYAN, { bold: true }),
    ).setOrigin(0.5, 0);

    // Filets discrets sous les titres ÉQUIPEMENT et SAC (cohérence §7.7)
    const titleSepGfx = this.add.graphics();
    drawDivider(titleSepGfx, this.eqBounds.x  + 10, this.eqBounds.y  + 20, this.eqBounds.w  - 20, UI.ACCENT_ARCANE, 0.22);
    drawDivider(titleSepGfx, this.bagBounds.x + 10, this.bagBounds.y + 20, this.bagBounds.w - 20, UI.ACCENT_ARCANE, 0.22);

    // ── Keyboard ──────────────────────────────────────────────────────────
    this.keyEsc = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyEsc.on('down', () => {
      if (this.consumePopupObjects.length > 0) { this.closeConsumePopup(); return; }
      this.close();
    });

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

  // ── Equipment paperdoll (left panel, style Dofus) ─────────────────────────
  // Silhouette centrale + slots positionnés autour (PAPERDOLL_POS) :
  //   amulette | casque | cape
  //   arme     | plastron | gants
  //   anneau 1 | jambes  | anneau 2
  //            | bottes  |
  private renderEquipment() {
    const { x: PX, y: PY, w: PW, h: PH } = this.eqBounds;
    const TITLE_H = 24;
    const GAP_Y   = 14;
    const colX: [number, number, number] = [
      PX + 10,                       // gauche
      PX + (PW - EQ_SLOT) / 2,       // centre (sur la silhouette)
      PX + PW - 10 - EQ_SLOT,        // droite
    ];
    const rowY = (r: number) => PY + TITLE_H + 10 + r * (EQ_SLOT + GAP_Y);

    // ── Silhouette du personnage — teinte arcane, effet « projection » ────
    const cx   = colX[1] + EQ_SLOT / 2;
    const silG = this.add.graphics();
    // Tête
    silG.fillStyle(UI.ACCENT_ARCANE, 0.05);
    silG.fillCircle(cx, rowY(0) + EQ_SLOT / 2, 26);
    silG.lineStyle(1, UI.ACCENT_ARCANE, 0.14);
    silG.strokeCircle(cx, rowY(0) + EQ_SLOT / 2, 26);
    // Corps (capsule verticale : torse → bottes)
    const bodyTop = rowY(0) + EQ_SLOT + 2;
    const bodyBot = rowY(3) + EQ_SLOT - 4;
    silG.fillStyle(UI.ACCENT_ARCANE, 0.04);
    silG.fillRoundedRect(cx - 26, bodyTop, 52, bodyBot - bodyTop, 22);
    silG.lineStyle(1, UI.ACCENT_ARCANE, 0.11);
    silG.strokeRoundedRect(cx - 26, bodyTop, 52, bodyBot - bodyTop, 22);
    this.dynamicObjs.push(silG);

    // ── Slots ──────────────────────────────────────────────────────────────
    EQ_ORDER.forEach((key) => {
      const pos  = PAPERDOLL_POS[key];
      const sx   = colX[pos.col];
      const sy   = rowY(pos.row);
      const item = this.player.equipment[key] as Item | undefined;
      const rarHex = item
        ? parseInt((RARITY_COLORS[item.rarity] ?? '#666666').replace('#', ''), 16)
        : UI.SLOT_BORDER;

      // Slot arrondi moderne — bordure = couleur de rareté (règle §7.5),
      // halo interne de rareté quand le slot est occupé (drawSlot)
      const bg = this.add.graphics();
      drawSlot(bg, sx, sy, EQ_SLOT, rarHex, { occupied: !!item });
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
        // Slot vide : abréviation lisible centrée à l'intérieur (ghost label)
        const abbr = t(`inventory.slot.${key}`).slice(0, 4).toUpperCase();
        this.dynamicObjs.push(
          this.add.text(sx + EQ_SLOT / 2, sy + EQ_SLOT / 2, abbr, uiStyle(9, UI.TXT_HINT, { bold: true }))
            .setOrigin(0.5),
        );
      }

      // Hit zone (occupé → détail) — élargie de +4 px au-delà du visuel
      if (item) {
        const hit = this.add.rectangle(
          sx + EQ_SLOT / 2, sy + EQ_SLOT / 2, EQ_SLOT + 8, EQ_SLOT + 8, 0x000000, 0,
        ).setInteractive({ useHandCursor: true });
        this.dynamicObjs.push(hit);
        // clear() + redraw complet (pas juste un stroke par-dessus) : sinon chaque
        // survol empile une nouvelle commande de tracé sur le même Graphics (fuite).
        hit.on('pointerover', () => { bg.clear(); drawSlot(bg, sx, sy, EQ_SLOT, 0xffffff, { occupied: true }); });
        hit.on('pointerout',  () => { bg.clear(); drawSlot(bg, sx, sy, EQ_SLOT, rarHex,    { occupied: true }); });
        hit.on('pointerdown', () => this.showDetail(item.id));

        // White flash overlay — confirmation visuelle après un tap-equip.
        if (this.lastFlashSlotKey === key) {
          this.lastFlashSlotKey = null;
          const flash = this.add.graphics();
          flash.fillStyle(0xffffff, 0.8);
          flash.fillRoundedRect(sx, sy, EQ_SLOT, EQ_SLOT, 5);
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

    // ── Identité du personnage sous le paperdoll ──────────────────────────
    const infoY = rowY(3) + EQ_SLOT + 16;
    const sepG  = this.add.graphics();
    drawDivider(sepG, PX + 10, infoY, PW - 20, UI.ACCENT_ARCANE, 0.22);
    this.dynamicObjs.push(sepG);

    this.dynamicObjs.push(
      this.add.text(PX + PW / 2, infoY + 10, this.player.name, uiStyle(12, UI.TXT_GOLD, { bold: true }))
        .setOrigin(0.5, 0),
      this.add.text(
        PX + PW / 2, infoY + 28,
        t('inventory.level').replace('{level}', String(this.player.level)),
        uiStyle(10, UI.TXT_PARCHMENT),
      ).setOrigin(0.5, 0),
      this.add.text(PX + PW / 2, PY + PH - 10, t('inventory.slot_hint'), uiStyle(9, UI.TXT_HINT))
        .setOrigin(0.5, 1),
    );
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
      this.add.text(PX + PW / 2, PY + 6, t('inventory.stats'), uiStyle(11, UI.TXT_CYAN, { bold: true })).setOrigin(0.5, 0),
    );

    const sepTop = this.add.graphics();
    drawDivider(sepTop, PX + 8, PY + 20, PW - 16, UI.ACCENT_ARCANE, 0.22);
    this.dynamicObjs.push(sepTop);

    // TOUTES les valeurs viennent de StatsSystem.computeAll (source de vérité) :
    // cs.atk/matk incluent DÉJÀ la main stat de l'arme — ne rien réadditionner.
    // Les dérivées critDmg / aspd / elemBonus / lifesteal influencent réellement
    // CombatSystem + GameScene et sont désormais affichées (refonte 07/2026).
    const cs = StatsSystem.computeAll(this.player);
    // Baseline "sans aucun équipement" (mêmes formules que StatsSystem.computeAll,
    // juste sans la contribution du gear) — sert uniquement à savoir quelles
    // stats afficher en gras/doré parce qu'un équipement les booste réellement.
    const base = ProgressionSystem.computeBaseStats(this.player.level, this.player.attributes);
    const baseCrit    = BASE_CRIT_PCT + this.player.attributes.agi * CRIT_PER_AGI_PCT;
    const baseCritDmg = BASE_CRIT_MULT;
    const baseAspd    = 1;
    const hexOf = (c: string) => parseInt(c.replace('#', ''), 16);

    type Row = { label: string; value: string; boosted: boolean };
    interface Section { title: string; titleColor: string; accent: number; rows: Row[] }
    const sections: Section[] = [
      {
        title: t('stats.section_offense'),
        titleColor: UI.TXT_ORANGE, accent: hexOf(UI.TXT_ORANGE),
        rows: [
          { label: t('stats.atk'),        value: String(cs.atk),                     boosted: cs.atk > base.atk },
          { label: t('stats.matk'),       value: String(cs.matk),                    boosted: cs.matk > base.magicAtk },
          { label: t('stats.crit_rate'),  value: `${cs.crit.toFixed(1)}%`,           boosted: cs.crit > baseCrit },
          { label: t('stats.crit_dmg'),   value: `×${cs.critDmg.toFixed(2)}`,        boosted: cs.critDmg > baseCritDmg },
          { label: t('stats.aspd'),       value: `×${cs.aspd.toFixed(2)}`,           boosted: cs.aspd > baseAspd },
          { label: t('stats.elem_bonus'), value: `+${cs.elemBonus.toFixed(0)}%`,     boosted: cs.elemBonus > 0 },
        ],
      },
      {
        title: t('stats.section_defense'),
        titleColor: UI.TXT_BLUE, accent: hexOf(UI.TXT_BLUE),
        rows: [
          { label: t('stats.def'),    value: String(cs.def),    boosted: cs.def > base.def },
          { label: t('stats.mdef'),   value: String(cs.magicDef), boosted: cs.magicDef > base.magicDef },
          { label: t('stats.hp_max'), value: String(cs.hp),     boosted: cs.hp > base.maxHp },
          { label: t('stats.mp_max'), value: String(cs.mana),   boosted: cs.mana > base.maxMana },
        ],
      },
      {
        title: t('stats.section_utility'),
        titleColor: UI.TXT_CYAN, accent: UI.ACCENT_ARCANE,
        rows: [
          { label: t('stats.speed'),     value: String(cs.spd), boosted: cs.spd > base.spd },
          { label: t('stats.lifesteal'), value: `${cs.lifesteal.toFixed(0)}%`, boosted: cs.lifesteal > 0 },
        ],
      },
    ];

    const COL1  = PX + 14;
    const COL2  = PX + PW - 14;
    const ROW_H = 22;
    let   y     = PY + 30;

    for (const sec of sections) {
      // En-tête de section : pastille d'accent + label coloré + filet
      const hdrGfx = this.add.graphics();
      hdrGfx.fillStyle(sec.accent, 0.9);
      hdrGfx.fillRoundedRect(PX + 10, y + 2, 3, 10, 1.5);
      this.dynamicObjs.push(hdrGfx);

      const title = this.add.text(PX + 18, y, sec.title, uiStyle(9, sec.titleColor, { bold: true }));
      this.dynamicObjs.push(title);
      drawDivider(hdrGfx, PX + 24 + title.width, y + 7, COL2 - (PX + 24 + title.width), sec.accent, 0.18);

      y += 20;

      sec.rows.forEach((row, i) => {
        // Zébrage discret une ligne sur deux — lecture rapide en colonne
        if (i % 2 === 0) {
          const zebra = this.add.graphics();
          zebra.fillStyle(0xffffff, 0.02);
          zebra.fillRoundedRect(PX + 8, y - 3, PW - 16, ROW_H - 2, 3);
          this.dynamicObjs.push(zebra);
        }
        // Une stat réellement boostée par l'équipement (vs. la baseline sans
        // gear) ressort en gras doré — sinon poids normal, couleur parchemin.
        this.dynamicObjs.push(
          this.add.text(COL1, y, row.label, uiStyle(10, UI.TXT_MUTED)),
          this.add.text(COL2, y, row.value, uiStyle(11, row.boosted ? UI.TXT_GOLD : UI.TXT_PARCHMENT, { bold: row.boosted }))
            .setOrigin(1, 0),
        );
        y += ROW_H;
      });

      y += 10; // respiration entre sections
    }

    this.dynamicObjs.push(
      this.add.text(PX + PW / 2, PY + PH - 12, t('inventory.tap_hint'), uiStyle(9, UI.TXT_HINT)).setOrigin(0.5, 1),
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
    const back = this.add.text(PX + 10, PY + 6, t('inventory.back_stats'), uiStyle(10, UI.TXT_BLUE, { bold: true }))
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => back.setColor(UI.TXT_GOLD))
      .on('pointerout',  () => back.setColor(UI.TXT_BLUE))
      .on('pointerdown', () => { this.selectedItemId = null; this.refresh(); });
    this.dynamicObjs.push(back);

    this.dynamicObjs.push(
      this.add.text(PX + PW / 2, PY + 6, t('inventory.detail'), uiStyle(11, UI.TXT_CYAN, { bold: true })).setOrigin(0.5, 0),
    );

    const sepTop = this.add.graphics();
    drawDivider(sepTop, PX + 8, PY + 22, PW - 16, UI.ACCENT_ARCANE, 0.22);
    this.dynamicObjs.push(sepTop);

    // ── Item identity ─────────────────────────────────────────────────────
    let curY = PY + 32;

    this.dynamicObjs.push(
      this.add.text(PX + PW / 2, curY, `[${t(`rarity.${item.rarity}`)}]`, uiStyle(9, rarColor, { bold: true })).setOrigin(0.5, 0),
    );
    curY += 16;

    const nameTxt = this.add.text(PX + PW / 2, curY, locItem.name, uiStyle(13, rarColor, {
      bold: true, stroke: true, wordWrapWidth: PW - 20, align: 'center',
    })).setOrigin(0.5, 0);
    this.dynamicObjs.push(nameTxt);
    curY += nameTxt.height + 10;

    // ── Main stat ─────────────────────────────────────────────────────────
    const mainLine = this.getItemMainStat(item);
    if (mainLine) {
      this.dynamicObjs.push(
        this.add.text(PX + PW / 2, curY, mainLine, uiStyle(12, UI.TXT_GOLD, { bold: true, stroke: true })).setOrigin(0.5, 0),
      );
      curY += 24;
    }

    const sepMid = this.add.graphics();
    drawDivider(sepMid, PX + 8, curY, PW - 16, UI.BORDER_LIT, 0.3);
    this.dynamicObjs.push(sepMid);
    curY += 10;

    // ── Substats ──────────────────────────────────────────────────────────
    for (const line of this.getItemSubstats(item)) {
      this.dynamicObjs.push(
        this.add.text(PX + 14, curY, `• ${line}`, uiStyle(10, UI.TXT_PARCHMENT)),
      );
      curY += 17;
    }
    curY += 6;

    // ── Description ───────────────────────────────────────────────────────
    const descTxt = this.add.text(PX + 12, curY, locItem.description, uiStyle(10, UI.TXT_MUTED, {
      italic: true, wordWrapWidth: PW - 24, lineSpacing: 3,
    }));
    this.dynamicObjs.push(descTxt);

    // ── Action buttons (bottom of panel — zone de pouce) ─────────────────
    const isEquip = EQUIP_TYPES.includes(item.type);
    const isUse    = item.type === ItemType.CONSUMABLE;
    const isSell   = item.type !== ItemType.KEY_ITEM;
    const btnCount = (isEquip || isUse ? 1 : 0) + (isSell ? 1 : 0) + 1; // +1 for close
    const BTN_H    = 32;   // visuel 32 px, hit zone 44 px (norme tactile)
    const BTN_GAP  = 8;
    const BTN_W    = PW - 20;
    const BTN_X    = PX + 10;
    let   btnY     = PY + PH - btnCount * (BTN_H + BTN_GAP) - 4;

    const addBtn = (label: string, color: string, onClick: () => void) => {
      const y       = btnY;
      const bgGfx   = this.add.graphics();
      bgGfx.fillStyle(UI.BTN_BG, 1);
      bgGfx.fillRoundedRect(BTN_X, y, BTN_W, BTN_H, 4);
      bgGfx.lineStyle(1, UI.BTN_BORDER, 1);
      bgGfx.strokeRoundedRect(BTN_X, y, BTN_W, BTN_H, 4);
      const txt = this.add.text(BTN_X + BTN_W / 2, y + BTN_H / 2, label, uiStyle(11, color, { bold: true })).setOrigin(0.5);
      const hit = this.add.rectangle(BTN_X + BTN_W / 2, y + BTN_H / 2, BTN_W + 6, Math.max(44, BTN_H + BTN_GAP), 0x000000, 0)
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
        .on('pointerdown', onClick);
      this.dynamicObjs.push(bgGfx, txt, hit);
      btnY += BTN_H + BTN_GAP;
    };

    if (isEquip) {
      addBtn(t('inventory.equip_hint'), UI.TXT_GREEN, () => {
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
        this.showActionConfirmPopup(item, cx, cy);
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
    this.input.off('pointermove');

    const { x: PX, y: PY, w: PW, h: PH } = this.bagBounds;
    const TITLE_H   = 22;
    const GRID_PAD  = 8;
    const GRID_X    = PX + GRID_PAD;
    const GRID_Y    = PY + TITLE_H;
    const VISIBLE_H = PH - TITLE_H;

    // Grouped by category (weapons / armor / accessories / ...), rarity-sorted within
    // each group — see InventorySystem.groupForDisplay. A layout pass computes every
    // group's header/item pixel offsets up front so contentH (and thus the scroll
    // mask + max scroll) is known before anything is drawn.
    const groups = InventorySystem.groupForDisplay(this.player.inventory);
    interface GroupLayout { category: InventoryCategory; slots: InventorySlot[]; headerY: number; itemsY: number }
    let cursorY = 0;
    const layouts: GroupLayout[] = groups.map((g) => {
      const headerY = cursorY;
      const itemsY  = headerY + GROUP_HEADER_H;
      const rows    = Math.ceil(g.slots.length / INV_COLS);
      cursorY = itemsY + rows * INV_SLOT + GROUP_GAP;
      return { category: g.category, slots: g.slots, headerY, itemsY };
    });
    const contentH = Math.max(0, cursorY - GROUP_GAP);
    let   scrollY  = 0;

    // Geometry mask clips the scrollable grid area
    const maskGfx = this.make.graphics({ x: 0, y: 0 });
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRect(GRID_X - 2, GRID_Y, INV_COLS * INV_SLOT + 4, VISIBLE_H);
    const geomMask = maskGfx.createGeometryMask();
    this.scrollMaskGfx = maskGfx;

    const scrollables: { obj: ScrollableGO; baseY: number }[] = [];
    const reg: RegisterFn = (go, baseY) => {
      go.setMask(geomMask);
      scrollables.push({ obj: go, baseY });
      this.dynamicObjs.push(go);
    };

    // Empty state
    if (this.player.inventory.length === 0) {
      this.dynamicObjs.push(
        this.add.text(
          PX + PW / 2, GRID_Y + VISIBLE_H / 2,
          t('inventory.empty'), uiStyle(11, UI.TXT_HINT),
        ).setOrigin(0.5),
      );
    }

    const gridW = INV_COLS * INV_SLOT;
    for (const layout of layouts) {
      this.renderInventoryGroupHeader(layout.category, layout.slots.length, GRID_X, GRID_Y + layout.headerY, gridW, reg);
      layout.slots.forEach((slot, idx) => {
        const col  = idx % INV_COLS;
        const row  = Math.floor(idx / INV_COLS);
        const sx   = GRID_X + col * INV_SLOT;
        const topY = GRID_Y + layout.itemsY + row * INV_SLOT;
        this.renderInventorySlot(slot, sx, topY, reg);
      });
    }

    // Scroll : molette (desktop) + drag vertical (tactile — dette D2 résorbée)
    if (contentH > VISIBLE_H) {
      const maxScroll = contentH - VISIBLE_H;
      this.input.on('wheel', (_p: unknown, _g: unknown, _dx: number, dy: number) => {
        scrollY = Phaser.Math.Clamp(scrollY + dy * 0.8, 0, maxScroll);
        for (const { obj, baseY } of scrollables) obj.setY(baseY - scrollY);
      });

      const gridRight = GRID_X + INV_COLS * INV_SLOT + 4;
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
        if (!p.isDown) return;
        // Seuls les drags démarrés dans la zone de la grille scrollent
        if (p.downX < GRID_X - 4 || p.downX > gridRight) return;
        if (p.downY < GRID_Y || p.downY > GRID_Y + VISIBLE_H) return;
        const dy = p.y - p.prevPosition.y;
        if (dy === 0) return;
        scrollY = Phaser.Math.Clamp(scrollY - dy, 0, maxScroll);
        for (const { obj, baseY } of scrollables) obj.setY(baseY - scrollY);
        // Un drag en cours annule le long-press (le doigt scrolle, il ne maintient pas)
        if (p.getDistance() > 10 && this.longPressTimer !== null) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
      });
    }
  }

  /**
   * Draws one bag category header band (accent dot + label + count + divider),
   * scrolling in lockstep with the grid content below it — same registration
   * pattern as the slots (drawn at a local y baseline, shifted via setY/reg).
   */
  private renderInventoryGroupHeader(
    category: InventoryCategory, count: number, x: number, headerTopY: number, w: number, reg: RegisterFn,
  ): void {
    const localCy = GROUP_HEADER_H / 2;
    const label = `${t(CATEGORY_LABEL_KEYS[category])} (${count})`;

    const dotG = this.add.graphics();
    dotG.fillStyle(UI.ACCENT_ARCANE, 0.9);
    dotG.fillRoundedRect(x + 2, localCy - 3, 6, 6, 1.5);
    dotG.setY(headerTopY);
    reg(dotG, headerTopY);

    const txt = this.add.text(x + 12, headerTopY + localCy, label, uiStyle(8, UI.TXT_CYAN, { bold: true })).setOrigin(0, 0.5);
    reg(txt, headerTopY + localCy);

    const sepG = this.add.graphics();
    sepG.lineStyle(1, UI.ACCENT_ARCANE, 0.22);
    sepG.beginPath();
    sepG.moveTo(x + 16 + txt.width, localCy);
    sepG.lineTo(x + w, localCy);
    sepG.strokePath();
    sepG.setY(headerTopY);
    reg(sepG, headerTopY);
  }

  /** Renders a single bag slot (icon, rarity frame, stack badge, hit zone) at the
   *  given absolute grid coordinates. Extracted from renderGrid() so the grouped
   *  layout pass can place slots at per-category offsets instead of a flat index. */
  private renderInventorySlot(slot: InventorySlot, sx: number, topY: number, reg: RegisterFn): void {
    const midY   = topY + INV_SLOT / 2 - 1;
    const rarHex = parseInt((RARITY_COLORS[slot.item.rarity] ?? '#666666').replace('#', ''), 16);

    // Slot arrondi moderne (drawSlot) — drawn at y=0, positioned via setY
    const bg = this.add.graphics();
    drawSlot(bg, sx, 0, INV_SLOT - 2, rarHex, { occupied: true, radius: 4 });
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
      sqGfx.fillRoundedRect(sx + 6, 6, INV_SLOT - 14, INV_SLOT - 14, 3);
      sqGfx.setY(topY);
      reg(sqGfx, topY);
    }

    // Stack quantity badge — lisible sur n'importe quelle icône (stroke noir)
    if (slot.quantity > 1) {
      const qBaseY = topY + INV_SLOT - 4;
      const qty    = this.add.text(
        sx + INV_SLOT - 5, qBaseY, `${slot.quantity}`,
        uiStyle(10, UI.TXT_WHITE, { bold: true, stroke: true }),
      ).setOrigin(1, 1);
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
    hit.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (this.longPressTimer !== null) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
        // Un déplacement > 10 px = scroll tactile, pas un tap → aucune action
        if (p.getDistance() > 10) return;
        // Pass screen coords so the popup can anchor near the tapped slot
        const screenX = sx + INV_SLOT / 2 - 1;
        const screenY = topY + INV_SLOT / 2 - 1;
        this.doMainAction(slot.item.id, screenX, screenY);
      }
    });
    // clear() + redraw complet — cf. note équivalente sur le paperdoll plus haut.
    hit.on('pointerover', () => { bg.clear(); drawSlot(bg, sx, 0, INV_SLOT - 2, 0xffffff, { occupied: true, radius: 4 }); });
    hit.on('pointerout',  () => {
      // Cancel long-press if the pointer leaves before 500 ms
      if (this.longPressTimer !== null) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
      bg.clear(); drawSlot(bg, sx, 0, INV_SLOT - 2, rarHex, { occupied: true, radius: 4 });
    });
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
    gfx.fillRoundedRect(x, y, size, size, 3);
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
   *   - Equippable/Consumable → show confirmation popup (prevents an accidental
   *     tap from instantly swapping gear or draining a potion; also doubles as
   *     a compact detail view for gear — stats, element, description)
   *   - Key / other → open the detail panel
   *
   * Called on quick tap in the grid and by the Z key shortcut in detail view.
   */
  private doMainAction(itemId: string, slotScreenX?: number, slotScreenY?: number): void {
    const item = ALL_ITEMS[itemId];
    if (!item) return;

    if (EQUIP_TYPES.includes(item.type) || item.type === ItemType.CONSUMABLE) {
      // Show confirmation popup instead of equipping/using immediately —
      // also shows stats/lore for gear, since a stray tap shouldn't swap weapons.
      this.showActionConfirmPopup(item, slotScreenX ?? this.cameras.main.width / 2, slotScreenY ?? this.cameras.main.height / 2);
    } else {
      // Key items, materials, skins: open the detail panel
      this.showDetail(itemId);
    }
  }

  // ── Action confirmation popup (consommables ET équipement) ────────────────

  /**
   * Builds and shows a confirmation popup near the tapped inventory slot.
   * Generalized across both consumables ("Utiliser") and equippable items
   * ("Équiper") so a stray tap never instantly consumes/equips something —
   * the popup also doubles as a compact detail view for gear (main stat,
   * substats, description) since a weapon/armor deserves more than the
   * one-line effect summary a potion gets.
   *
   * Layout: drawGlowPanel accent | icon (rarity-colored frame, always) +
   * element glyph + name | consumable: effect line — equip: main stat +
   * substats + description | [Utiliser/Équiper] (green) | [Annuler] (red).
   * Auto-dismiss after 4 s if no action; click outside also dismisses.
   */
  private showActionConfirmPopup(item: Item, nearX: number, nearY: number): void {
    // Only one popup at a time — dismiss any existing one first
    this.closeConsumePopup();

    const isConsumable = item.type === ItemType.CONSUMABLE;
    const isEquip       = EQUIP_TYPES.includes(item.type);

    const W       = this.cameras.main.width;
    const H       = this.cameras.main.height;
    const PW      = isEquip ? 240 : 210;
    const MARGIN  = 6;
    const ICON_SIZE = 32; // seule source de vérité — réutilisé pour la mesure ET le rendu
    const BTN_H     = 44; // idem — ≥44px touch target (Apple HIG)

    // Hauteur du panneau calculée depuis le contenu réel (plus de troncature à 90
    // caractères ni de taille fixe trop courte pour un lore long) : on mesure le
    // texte de description avec un Text jetable au wordWrapWidth final, AVANT de
    // décider PH, puis on le détruit — le vrai texte est recréé plus bas une fois
    // la position finale connue.
    const locItem    = localizeItem(item);
    const substatCount = isEquip ? this.getItemSubstats(item).slice(0, 3).length : 0;
    const passiveLabel = ('passiveEffect' in item && item.passiveEffect)
      ? getPassiveEffectLabel(item.passiveEffect)
      : undefined;
    const baseDesc0  = isEquip ? (locItem.lore ?? locItem.description) : '';
    const descRaw0   = passiveLabel ? `${baseDesc0}\n\n${t('arsenal.passive_label')} ${passiveLabel}` : baseDesc0;
    let   descHeight = 0;
    if (isEquip && descRaw0) {
      const probe = this.add.text(0, 0, descRaw0, uiStyle(9, UI.TXT_MUTED, {
        italic: true, wordWrapWidth: PW - MARGIN * 2, lineSpacing: 2,
      }));
      descHeight = probe.height;
      probe.destroy();
    }
    const headerH = MARGIN + ICON_SIZE + MARGIN; // icône + marges
    const contentH = isEquip
      ? headerH + substatCount * 14 + 4 + descHeight + 10 + BTN_H + MARGIN * 2
      : 116;
    // Bornes : jamais plus petit que l'ancien minimum (évite une régression visuelle
    // sur les items courts), jamais plus grand que l'écran moins une marge de sécurité.
    const PH = Math.min(Math.max(contentH, isEquip ? 130 : 116), H - MARGIN * 4);

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

    // ── Item icon (left side), always framed in its rarity color ──────────
    const rarHexStr = RARITY_COLORS[item.rarity] ?? '#ffffff';
    const rarHex    = parseInt(rarHexStr.replace('#', ''), 16);
    const iconKey   = this.resolveIcon(item);
    const iconX     = px + MARGIN + ICON_SIZE / 2;
    const iconY     = py + MARGIN + ICON_SIZE / 2;

    const frameGfx = this.add.graphics().setDepth(depth + 1);
    frameGfx.lineStyle(2, rarHex, 1);
    frameGfx.strokeRoundedRect(px + MARGIN - 2, py + MARGIN - 2, ICON_SIZE + 4, ICON_SIZE + 4, 4);
    this.consumePopupObjects.push(frameGfx);

    if (iconKey) {
      try {
        const img = this.add.image(iconX, iconY, iconKey)
          .setDisplaySize(ICON_SIZE, ICON_SIZE)
          .setDepth(depth + 1);
        this.consumePopupObjects.push(img);
      } catch {
        this.addColorSquareAbove(px + MARGIN, py + MARGIN, ICON_SIZE, 0x44cc66, depth + 1);
      }
    } else {
      this.addColorSquareAbove(px + MARGIN, py + MARGIN, ICON_SIZE, 0x44cc66, depth + 1);
    }

    // ── Item name + element glyph (marks THIS instance's rolled element —
    // LootSystem.applyRandomElement rolls it per drop, not per weapon def) ──
    const textX    = px + MARGIN * 2 + ICON_SIZE + 2;
    let   nameX    = textX;
    const glyph    = item.element ? ELEMENT_GLYPHS[item.element] : undefined;
    if (glyph) {
      this.consumePopupObjects.push(
        this.add.text(nameX, py + MARGIN + 1, glyph, uiStyle(12, '#ffffff')).setDepth(depth + 1),
      );
      nameX += 17;
    }
    const rawName = locItem.name;
    const name    = rawName.length > 22 ? `${rawName.slice(0, 20)}..` : rawName;
    this.consumePopupObjects.push(
      this.add.text(nameX, py + MARGIN + 2, name,
        uiStyle(11, rarHexStr, {
          bold: true, wordWrapWidth: px + PW - MARGIN - nameX,
        }),
      ).setDepth(depth + 1),
    );

    // ── Body: effect line (consumable) or stats + description (equip) ─────
    if (isConsumable) {
      const effectLine = this.getConsumableEffectLine(item as Consumable);
      this.consumePopupObjects.push(
        this.add.text(textX, py + MARGIN + 18, effectLine, uiStyle(10, UI.TXT_GREEN)).setDepth(depth + 1),
      );
    } else {
      const mainLine = this.getItemMainStat(item);
      if (mainLine) {
        this.consumePopupObjects.push(
          this.add.text(textX, py + MARGIN + 18, mainLine, uiStyle(10, UI.TXT_GOLD, { bold: true })).setDepth(depth + 1),
        );
      }
    }

    // ── Separator ─────────────────────────────────────────────────────────
    const sepGfx = this.add.graphics().setDepth(depth + 1);
    drawDivider(sepGfx, px + 6, py + headerH, PW - 12, UI.ACCENT_ARCANE, 0.3);
    this.consumePopupObjects.push(sepGfx);

    // ── Equip-only: substats + description (the "lore etc." the popup lacked) ──
    if (isEquip) {
      let bodyY = py + headerH + 6;
      for (const line of this.getItemSubstats(item).slice(0, 3)) {
        this.consumePopupObjects.push(
          this.add.text(px + MARGIN, bodyY, `• ${line}`, uiStyle(9, UI.TXT_PARCHMENT)).setDepth(depth + 1),
        );
        bodyY += 14;
      }
      bodyY += 4;
      // Texte complet (plus de troncature à 90 caractères), lore/description +
      // passif éventuel sur la même chaîne (cf. descRaw0/descHeight mesurés plus
      // haut, avant que PH ne soit fixé — doit rester identique à ce texte-ci).
      this.consumePopupObjects.push(
        this.add.text(px + MARGIN, bodyY, descRaw0, uiStyle(9, UI.TXT_MUTED, {
          italic: true, wordWrapWidth: PW - MARGIN * 2, lineSpacing: 2,
        })).setDepth(depth + 1),
      );
    }

    // ── Action buttons ────────────────────────────────────────────────────
    const BTN_W  = (PW - MARGIN * 3) / 2;
    const BTN_Y  = py + PH - BTN_H - MARGIN;
    const BTN_X1 = px + MARGIN;
    const BTN_X2 = BTN_X1 + BTN_W + MARGIN;

    // Confirm button (Utiliser / Équiper)
    const confirmGfx = this.add.graphics().setDepth(depth + 1);
    confirmGfx.fillStyle(0x0d2010, 1);
    confirmGfx.fillRoundedRect(BTN_X1, BTN_Y, BTN_W, BTN_H, 3);
    confirmGfx.lineStyle(1, 0x44cc66, 1);
    confirmGfx.strokeRoundedRect(BTN_X1, BTN_Y, BTN_W, BTN_H, 3);

    const confirmTxt = this.add.text(
      BTN_X1 + BTN_W / 2, BTN_Y + BTN_H / 2,
      isConsumable ? t('inventory.use_item') : t('inventory.equip_item'),
      uiStyle(11, UI.TXT_GREEN, { bold: true, stroke: true }),
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
        if (isConsumable) {
          InventorySystem.useConsumable(this.player, item.id);
        } else {
          this.lastFlashSlotKey = this.getSlotKeyForItem(item);
          InventorySystem.equip(this.player, item.id);
        }
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
      t('inventory.cancel'),
      uiStyle(11, UI.TXT_RED, { bold: true }),
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

    // Timer re-armé quand le joueur survole un bouton (évite fermeture sous le doigt)
    const rearmTimer = () => {
      this.consumePopupTimer?.remove(false);
      this.consumePopupTimer = this.time.addEvent({
        delay: 4000,
        callback: () => { this.consumePopupTimer = null; this.closeConsumePopup(); },
      });
    };
    confirmHit.on('pointerover', rearmTimer);
    cancelHit.on('pointerover', rearmTimer);

    this.consumePopupObjects.push(
      confirmGfx, confirmTxt, confirmHit,
      cancelGfx, cancelTxt, cancelHit,
    );

    // ── Pop-in animation (scale 0.9→1 + alpha 0→1, Back.easeOut) ─────────
    // Toutes les pièces du popup sauf la zone de dismiss (elle doit rester en place)
    const popObjects = this.consumePopupObjects.filter(o => o !== dismissHit);
    popObjects.forEach(o => {
      if ('setAlpha' in o) (o as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(0);
    });
    this.tweens.add({
      targets: popObjects.filter(o => 'setScale' in o),
      scaleX: { from: 0.9, to: 1 },
      scaleY: { from: 0.9, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 90,
      ease: 'Back.easeOut',
    });

    // ── Auto-dismiss timer (4 s) ───────────────────────────────────────────
    this.consumePopupTimer = this.time.addEvent({
      delay: 4000,
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
    if (e.revive)      return t('inventory.effect_revive');
    if (e.statusCure)  return t('inventory.effect_cure');
    return item.description.slice(0, 22);
  }

  /**
   * Draw a colored square at absolute scene coords with an explicit depth.
   * Used only by the consume popup (the normal addColorSquare() is depth-less).
   */
  private addColorSquareAbove(x: number, y: number, size: number, colorHex: number, depth: number): void {
    const gfx = this.add.graphics().setDepth(depth);
    gfx.fillStyle(colorHex, 0.5);
    gfx.fillRoundedRect(x, y, size, size, 3);
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
    this.input.off('pointermove');
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
    this.input.off('pointermove');
    // clearDynamic() calls closeConsumePopup() internally
    this.clearDynamic();
  }
}
