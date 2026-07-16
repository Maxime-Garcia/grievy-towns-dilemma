import { GameScene } from './GameScene';
import {
  PlayerState, Item, ItemType, Weapon, Armor, Accessory, Consumable,
  StatBonus, RARITY_COLORS, EquipStats, ElementType, InventorySlot,
} from '../types';
import { InventorySystem, InventoryCategory } from '../systems/InventorySystem';
import { StatsSystem, BASE_CRIT_PCT, CRIT_PER_AGI_PCT, BASE_CRIT_MULT } from '../systems/StatsSystem';
import { StatRollSystem, isEquipableItem } from '../systems/StatRollSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { getPassiveEffectLabel } from '../data/passiveEffects';
import {
  UI, TYPE, LAYOUT, drawGlowPanel, drawCard, drawSlot, addUiFrame,
  drawDivider, addCloseButton, uiStyle, titleStyle, fitText, openScreenTransition,
  resonanceColor, formatRangedStatBounds, lineQuality, formatResonanceLine,
} from '../utils/UITheme';
import { SearchField, matchesSearch } from '../utils/SearchField';
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
// Les LARGEURS de panneaux ne sont plus des constantes : elles sont dérivées de
// la largeur caméra dans create() (seule la grille du sac, 7 col × 48 px, est
// une contrainte rigide — cf. renderGrid).
const MARGIN     = 8;
const HEADER_H   = 40;    // titre d'écran en police Boss (18 px) + respiration
const FOOTER_H   = 20;
const GAP        = 6;
const EQ_SLOT    = 48;    // slot d'équipement — aligné sur la grille du sac (48 px)
const INV_SLOT   = 48;    // inventory slot size
const INV_COLS   = 7;     // inventory grid columns
const GROUP_HEADER_H = 20; // bag category header band height
const GROUP_GAP      = 6;  // breathing room after a category's last row

// ── Onglets de filtrage du sac (dette D13 des guidelines, résorbée) ──────────
// 5 onglets au-dessus de la grille : réduisent le scroll dès que le loot ARPG
// multiplie les instances. Depuis la passe 07/2026 : ICÔNES cliquables (glyphes
// `bagtab_*` bakés au boot, cf. PreloaderScene.BAG_TAB_ICON_FRAME) au lieu des
// labels texte — `labelKey` reste la source du TOOLTIP au survol et le fallback
// affiché si la sheet d'icônes n'est pas chargée.
//
// `labelKey` et non `label` : les libellés étaient hardcodés en français, donc le
// tooltip d'un onglet restait « Consommables » en jeu anglais, à côté d'un panneau
// d'item traduit — le mélange FR/EN reporté par l'utilisateur.
type BagFilter = 'ALL' | 'EQUIP' | 'CONSUMABLE' | 'MATERIAL' | 'MISC';
const BAG_TABS: ReadonlyArray<{ id: BagFilter; labelKey: string; icon: string; cats: readonly InventoryCategory[] | null }> = [
  { id: 'ALL',        labelKey: 'inventory.tab_all',        icon: 'bagtab_all',        cats: null },
  { id: 'EQUIP',      labelKey: 'inventory.tab_equip',      icon: 'bagtab_equip',      cats: ['WEAPON', 'ARMOR', 'ACCESSORY'] },
  { id: 'CONSUMABLE', labelKey: 'inventory.tab_consumable', icon: 'bagtab_consumable', cats: ['CONSUMABLE'] },
  { id: 'MATERIAL',   labelKey: 'inventory.tab_material',   icon: 'bagtab_material',   cats: ['MATERIAL'] },
  { id: 'MISC',       labelKey: 'inventory.tab_misc',       icon: 'bagtab_misc',       cats: ['KEY_ITEM', 'SKIN'] },
];
// 26 → 34 : les onglets portent un glyphe 32×32 (échelle ×2 ENTIÈRE de la
// grille 16 px — tout autre facteur produirait des artefacts NEAREST).
const BAG_TABS_H = 34; // hauteur visuelle d'un onglet (hit zone élargie à 44)

// ── Recherche textuelle du sac (utils/SearchField.ts) ─────────────────────────
// Rangée dédiée SOUS les onglets : onglet = catégorie (grossier), recherche =
// nom (fin). Les deux se COMBINENT (cf. renderGrid) — un filtre ne remplace
// jamais l'autre. Le champ est créé une seule fois dans create() et SURVIT aux
// refresh() : le recréer à chaque frappe détruirait le <input> DOM qui a le
// focus, et la saisie s'arrêterait au premier caractère.
const BAG_SEARCH_H   = LAYOUT.TOUCH_MIN;  // le cadre EST la zone tactile
const BAG_SEARCH_GAP = 6;
/** Hauteur du bandeau de titre « SAC » — partagée par create() (qui pose le champ
 *  de recherche) et renderGrid() (qui pose les onglets et la grille) : les deux
 *  DOIVENT dériver du même chiffre, sinon le champ chevauche les onglets. */
const BAG_TITLE_H    = 22;

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
  /** Détruit les objets de la fenêtre virtualisée courante de la grille (cf.
   *  renderGrid) — ils vivent hors de dynamicObjs puisqu'ils sont reconstruits au
   *  fil du scroll, pas seulement au refresh. */
  private gridWindowDispose: (() => void) | null = null;
  /** Position de scroll du sac, PRÉSERVÉE entre les refresh().
   *  Équiper/utiliser/vendre appelle refresh() qui reconstruit la grille : sans ce
   *  report, elle repartait toujours du haut, et le joueur perdait sa place à
   *  chaque action. Remis à 0 seulement quand le contenu change vraiment (onglet,
   *  recherche) — cf. renderGrid, l'init clampe au nouveau contentH. */
  private bagScrollY = 0;

  // Static objects set once in create(), updated in refresh()
  private goldText!: Phaser.GameObjects.Text;

  // Panel bounds — computed in create() and reused
  private eqBounds!: PanelBounds;   // left  — equipment
  private stBounds!: PanelBounds;   // center — stats / detail
  private bagBounds!: PanelBounds;  // right  — inventory grid

  // Which item INSTANCE is currently shown in the detail panel (null → show
  // stats). Holds the real object reference (inventory slot / equipment slot),
  // never just an id — two non-stackable instances of the same item id can
  // coexist with different rolls, and an id alone can't disambiguate them
  // (cf. docs/design/LOOT_STAT_ROLLS.md §9 step 8 audit).
  private selectedItem: Item | null = null;

  private keyZ?: Phaser.Input.Keyboard.Key;

  /** Recherche textuelle du sac — créée dans create(), détruite dans shutdown().
   *  Hors de `dynamicObjs` : elle doit survivre aux refresh() (cf. BAG_SEARCH_H). */
  private search: SearchField | null = null;
  private searchQuery = '';

  // Long-press detection: single ref, cleared on pointerup / pointerout / shutdown
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  // Onglet de filtrage actif du sac (D13) — reset à 'ALL' à chaque ouverture
  private bagFilter: BagFilter = 'ALL';
  // Tooltip transient du survol d'un onglet à icône (accessibilité : le glyphe
  // seul ne suffit pas) — détruit sur pointerout / refresh / shutdown.
  private tabTooltip: Phaser.GameObjects.Container | null = null;
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
    this.gameScene   = data.gameScene;
    this.player      = data.gameScene.gameState.player;
    this.selectedItem = null;
    this.bagFilter    = 'ALL';
    this.search       = null;
    this.searchQuery  = '';
  }

  create() {
    this.dynamicObjs = [];
    openScreenTransition(this);

    const W      = this.cameras.main.width;
    const H      = this.cameras.main.height;
    const CONT_Y = HEADER_H + 4;
    const CONT_H = H - CONT_Y - FOOTER_H - MARGIN;

    // ── Largeurs de panneaux DÉRIVÉES de l'écran (plus aucune largeur en dur) ──
    // Le sac est dimensionné sur sa grille FIXE (INV_COLS × INV_SLOT, + 8 px de
    // marge de chaque côté, cf. GRID_PAD dans renderGrid) : c'est la seule
    // contrainte rigide. Équipement et stats se partagent le reste — le panneau
    // de LECTURE (stats/détail) reçoit la plus grande part.
    const bagW  = INV_COLS * INV_SLOT + 16;
    const sideW = W - (MARGIN + 2) * 2 - bagW - GAP * 2;
    const eqW   = Math.round(sideW * 0.42);
    const stW   = sideW - eqW;
    const eqX   = MARGIN + 2;
    const stX   = eqX + eqW + GAP;
    const bagX  = stX + stW + GAP;

    this.eqBounds  = { x: eqX,  y: CONT_Y, w: eqW,  h: CONT_H };
    this.stBounds  = { x: stX,  y: CONT_Y, w: stW,  h: CONT_H };
    this.bagBounds = { x: bagX, y: CONT_Y, w: bagW, h: CONT_H };

    // ── Background overlay (0.88 standard — le jeu reste visible derrière) ─
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);

    // ── Outer frame — panneau moderne arrondi, liseré arcane (refonte 07/2026)
    const frameGfx = this.add.graphics();
    drawGlowPanel(frameGfx, MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2, UI.ACCENT_ARCANE, UI.BG_DEEP, 10, 0.92);

    // ── Header title — police Boss (titre d'écran, cf. TYPE.TITLE) ────────
    this.add.text(W / 2, MARGIN + 6, t('inventory.title'), titleStyle(UI.TXT_GOLD, { stroke: true }))
      .setOrigin(0.5, 0);

    // ── Header separator ──────────────────────────────────────────────────
    const sepGfx = this.add.graphics();
    drawDivider(sepGfx, MARGIN + 4, HEADER_H, W - (MARGIN + 4) * 2, UI.ACCENT_ARCANE, 0.35);

    // ── Close button × (haut-droite, hit 48×48) ───────────────────────────
    addCloseButton(this, W - MARGIN - 20, MARGIN + 16, () => this.close());

    // ── Gold display (pilule arrondie, à gauche du bouton ×) ──────────────
    // 26 px de haut pour un texte de 14 px — l'ancienne pilule 130×24 écrasait
    // la valeur. Posée à gauche de la hit zone 48 px du bouton ×.
    const PILL_W = 150;
    const PILL_H = 26;
    const pillX  = W - MARGIN - 52 - PILL_W;
    const pillY  = MARGIN + 5;
    const goldBg = this.add.graphics();
    drawCard(goldBg, pillX, pillY, PILL_W, PILL_H, { bg: UI.BG_MID, radius: 13, shadow: false });
    this.goldText = this.add.text(
      pillX + PILL_W / 2, pillY + PILL_H / 2,
      `${this.player.gold} ${t('inventory.gold')}`,
      uiStyle(TYPE.BODY, UI.TXT_GOLD, { bold: true }),
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
    // Titres de panneaux en TYPE.BODY (14) cyan gras : un cran net sous le
    // titre d'écran (Boss 18) et un cran au-dessus des libellés muted — la
    // hiérarchie se lit à la taille ET à la couleur.
    this.add.text(
      this.eqBounds.x  + this.eqBounds.w  / 2, this.eqBounds.y  + 6,
      t('inventory.equipment'), uiStyle(TYPE.BODY, UI.TXT_CYAN, { bold: true }),
    ).setOrigin(0.5, 0);

    // Le titre SAC est calé plus haut : les onglets de filtrage (renderBagTabs,
    // posés à y + 22 par renderGrid) servent eux-mêmes de séparateur visuel —
    // pas de filet supplémentaire qui doublerait leur bordure.
    this.add.text(
      this.bagBounds.x + this.bagBounds.w / 2, this.bagBounds.y + 4,
      t('inventory.bag'), uiStyle(TYPE.BODY, UI.TXT_CYAN, { bold: true }),
    ).setOrigin(0.5, 0);

    // Filet discret sous le titre ÉQUIPEMENT (cohérence §7.7)
    const titleSepGfx = this.add.graphics();
    drawDivider(titleSepGfx, this.eqBounds.x + 10, this.eqBounds.y + 26, this.eqBounds.w - 20, UI.ACCENT_ARCANE, 0.22);

    // ── Recherche du sac (rangée sous les onglets) ────────────────────────
    // Créée UNE FOIS ici, jamais dans renderGrid() : renderGrid est rejoué à
    // chaque refresh (donc à chaque frappe), et recréer le <input> DOM lui
    // ferait perdre le focus au premier caractère tapé.
    const searchY = this.bagBounds.y + BAG_TITLE_H + BAG_TABS_H + 4;
    this.search = new SearchField(this, {
      x: this.bagBounds.x + 8,   // = GRID_X (GRID_PAD de renderGrid)
      y: searchY,
      w: INV_COLS * INV_SLOT,
      h: BAG_SEARCH_H,
      placeholder: t('search.placeholder_bag'),
      // Le sac s'OUVRE ET SE FERME avec `I`. Un champ auto-focalisé consomme
      // chaque frappe : le `I` de fermeture s'écrivait dans la recherche au lieu
      // de refermer le sac, et `Z` (l'action principale sur un item) était morte
      // dès l'ouverture. Ici on clique le champ pour chercher — le sac se
      // manipule d'abord au clic. Cf. SearchFieldOpts.autoFocus.
      autoFocus: false,
      onChange: (q) => {
        this.searchQuery = q;
        this.bagScrollY = 0; // la liste filtrée change : on repart du haut
        // refresh() détruit `dynamicObjs` — le champ n'y est PAS, il survit.
        this.refresh();
      },
      onEscape: () => this.close(),
    });

    // ── Keyboard ──────────────────────────────────────────────────────────
    // Pas de touche ESC ici : GameScene.escKey est le propriétaire unique de
    // l'ESC pour les overlays (il stoppe déjà cette scène de son côté). Deux
    // handlers ESC concurrents rendaient impossible tout comportement
    // « Échap vide la recherche AVANT de fermer » — GameScene passe désormais
    // par handleEscape() ci-dessous.
    //
    // Z → trigger main action on the currently selected item (equip / use).
    // Safe to use: GameScene.update() bails out early when menuOpen = true, so
    // the ZQSD movement poll never runs while the inventory is open. Pendant la
    // saisie dans le champ de recherche, SearchField stoppe la propagation des
    // touches : taper « zweihander » ne déclenche donc pas cette action.
    this.keyZ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyZ.on('down', () => {
      if (this.selectedItem !== null) this.doMainAction(this.selectedItem);
    });

    // Phaser n'appelle PAS scene.shutdown() tout seul (cf. Systems.shutdown : il
    // se contente d'émettre l'événement) — sans ce câblage, la scène ne nettoyait
    // ni ses touches ni ses listeners, et le <input> DOM du champ de recherche
    // survivrait à la fermeture de l'inventaire. Même câblage que
    // Arsenal/Bestiary/Dialogue.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    // Survol ré-évalué à CHAQUE frame, et pas seulement au mouvement du curseur.
    //
    // `MOUSE_WHEEL` est le seul type d'événement que Phaser traite sans appeler
    // `processOverOutEvents()`. Or la grille scrolle à la molette : les slots
    // glissent SOUS un curseur immobile, donc aucun `pointerout` n'est émis. Le
    // slot survolé gardait son anneau blanc en partant, et celui qui arrivait sous
    // le curseur ne s'allumait pas — jusqu'au prochain mouvement de souris.
    // La grille étant virtualisée, la liste de hit-test reste courte : le poll
    // permanent est ici sans coût mesurable.
    this.input.setPollAlways();

    // ── Dynamic content ───────────────────────────────────────────────────
    this.renderEquipment();
    this.renderCenter();
    this.renderGrid();
  }

  /**
   * Échap : ferme d'abord le popup s'il est ouvert, sinon vide la recherche,
   * sinon laisse l'appelant fermer l'écran. Appelé par GameScene.escKey (unique
   * propriétaire de l'ESC) et par le champ de recherche quand il a le focus.
   * True = appui CONSOMMÉ, l'inventaire doit rester ouvert.
   */
  handleEscape(): boolean {
    if (this.consumePopupObjects.length > 0) { this.closeConsumePopup(); return true; }
    return this.search?.clear() ?? false;
  }

  // ── Equipment paperdoll (left panel, style Dofus) ─────────────────────────
  // Silhouette centrale + slots positionnés autour (PAPERDOLL_POS) :
  //   amulette | casque | cape
  //   arme     | plastron | gants
  //   anneau 1 | jambes  | anneau 2
  //            | bottes  |
  private renderEquipment() {
    const { x: PX, y: PY, w: PW, h: PH } = this.eqBounds;
    const TITLE_H = 28;   // titre 14 px + filet à y + 26
    const GAP_Y   = 16;   // respiration verticale (le canvas 720 la permet)
    const colX: [number, number, number] = [
      PX + 12,                       // gauche
      PX + (PW - EQ_SLOT) / 2,       // centre (sur la silhouette)
      PX + PW - 12 - EQ_SLOT,        // droite
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

      // Cadre pixel art réel (Retro Inventory) par-dessus le fond — cf. grille.
      // Slot VIDE → variante `ui_slot_frame_empty` (bakée au boot) : même cadre,
      // même gris, mais SANS l'emblème d'épée gravé au centre de l'asset — sur
      // un slot vide il se lisait comme une arme déjà équipée et noyait le
      // libellé fantôme (bug UX reporté). Cf. PreloaderScene.generateEmptySlotFrame.
      const frame = addUiFrame(this, sx + EQ_SLOT / 2, sy + EQ_SLOT / 2, EQ_SLOT, EQ_SLOT,
        item ? 'ui_slot_frame' : 'ui_slot_frame_empty');
      if (frame) this.dynamicObjs.push(frame);

      // Anneau de rareté/survol au-dessus du cadre (slots occupés uniquement —
      // un slot vide garde la bordure discrète de drawSlot sous le cadre).
      const ring = this.add.graphics();
      const drawRing = (color: number) => {
        ring.clear();
        ring.lineStyle(2, color, 1);
        ring.strokeRoundedRect(sx, sy, EQ_SLOT, EQ_SLOT, 5);
      };
      if (item) drawRing(rarHex);
      this.dynamicObjs.push(ring);

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
        // Slot vide : libellé fantôme COURT (`inventory.slot_short.*`, ≤ 7
        // caractères — « Poitrine »/« Amulette » sortaient tronqués en
        // « POITRI… ») + fitText en filet de sécurité (jamais de slice(n)).
        // Les slots numérotés passent sur deux lignes : le numéro survit toujours.
        // Mesure INTERIM en attendant les icônes de slot (assets à fournir).
        const style    = uiStyle(TYPE.SMALL, UI.TXT_HINT, { bold: true, align: 'center' });
        const full     = t(`inventory.slot_short.${key}`).toUpperCase();
        const numbered = full.match(/^(.*\S)\s+(\d+)$/);
        const label    = numbered
          ? `${fitText(this, numbered[1]!, style, EQ_SLOT - 6)}\n${numbered[2]}`
          : fitText(this, full, style, EQ_SLOT - 6);
        this.dynamicObjs.push(
          this.add.text(sx + EQ_SLOT / 2, sy + EQ_SLOT / 2, label, style).setOrigin(0.5),
        );
      }

      // Hit zone (occupé → détail) — élargie de +4 px au-delà du visuel
      if (item) {
        const hit = this.add.rectangle(
          sx + EQ_SLOT / 2, sy + EQ_SLOT / 2, EQ_SLOT + 8, EQ_SLOT + 8, 0x000000, 0,
        ).setInteractive({ useHandCursor: true });
        this.dynamicObjs.push(hit);
        // Survol : seul l'anneau est redessiné (clear + stroke) — fond et cadre
        // asset intacts, aucune commande de tracé ne s'empile.
        hit.on('pointerover', () => drawRing(0xffffff));
        hit.on('pointerout',  () => drawRing(rarHex));
        hit.on('pointerdown', () => this.showDetail(item));

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

    const nameStyle = uiStyle(TYPE.BODY, UI.TXT_GOLD, { bold: true });
    this.dynamicObjs.push(
      this.add.text(PX + PW / 2, infoY + 12,
        fitText(this, this.player.name, nameStyle, PW - 24), nameStyle)
        .setOrigin(0.5, 0),
      this.add.text(
        PX + PW / 2, infoY + 32,
        t('inventory.level').replace('{level}', String(this.player.level)),
        uiStyle(TYPE.SMALL, UI.TXT_PARCHMENT),
      ).setOrigin(0.5, 0),
      this.add.text(PX + PW / 2, PY + PH - 10, t('inventory.slot_hint'),
        uiStyle(TYPE.SMALL, UI.TXT_HINT, { wordWrapWidth: PW - 20, align: 'center' }))
        .setOrigin(0.5, 1),
    );
  }

  // ── Center panel dispatcher ───────────────────────────────────────────────

  private renderCenter() {
    if (this.selectedItem !== null) {
      this.renderItemDetail(this.selectedItem);
    } else {
      this.renderStats();
    }
  }

  // ── Stats view (center panel, default) ───────────────────────────────────

  private renderStats() {
    const { x: PX, y: PY, w: PW, h: PH } = this.stBounds;

    this.dynamicObjs.push(
      this.add.text(PX + PW / 2, PY + 6, t('inventory.stats'), uiStyle(TYPE.BODY, UI.TXT_CYAN, { bold: true })).setOrigin(0.5, 0),
    );

    const sepTop = this.add.graphics();
    drawDivider(sepTop, PX + 8, PY + 26, PW - 16, UI.ACCENT_ARCANE, 0.22);
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

    const COL1  = PX + 16;
    const COL2  = PX + PW - 16;
    // 26 px de ligne pour un texte de 14 px : 12 px d'air. L'ancien ROW_H = 22
    // datait d'un texte de 10/11 px et collait les lignes les unes aux autres.
    const ROW_H = 26;
    let   y     = PY + 36;

    for (const sec of sections) {
      // En-tête de section : pastille d'accent + label coloré + filet
      const hdrGfx = this.add.graphics();
      hdrGfx.fillStyle(sec.accent, 0.9);
      hdrGfx.fillRoundedRect(PX + 10, y + 1, 3, 10, 1.5);
      this.dynamicObjs.push(hdrGfx);

      const title = this.add.text(PX + 18, y, sec.title, uiStyle(TYPE.SMALL, sec.titleColor, { bold: true }));
      this.dynamicObjs.push(title);
      drawDivider(hdrGfx, PX + 24 + title.width, y + 6, COL2 - (PX + 24 + title.width), sec.accent, 0.18);

      y += 22;

      sec.rows.forEach((row, i) => {
        // Zébrage discret une ligne sur deux — lecture rapide en colonne
        if (i % 2 === 0) {
          const zebra = this.add.graphics();
          zebra.fillStyle(0xffffff, 0.02);
          zebra.fillRoundedRect(PX + 8, y - 4, PW - 16, ROW_H - 2, 3);
          this.dynamicObjs.push(zebra);
        }
        // Libellé et valeur à la MÊME taille (TYPE.LABEL/BODY = 14 : la grille
        // de 7 px n'offre pas de palier entre 10 et 14) — la hiérarchie passe
        // par la couleur et la graisse : libellé muted maigre, valeur grasse
        // (or si un équipement la booste réellement, parchemin sinon).
        this.dynamicObjs.push(
          this.add.text(COL1, y, row.label, uiStyle(TYPE.LABEL, UI.TXT_MUTED)),
          this.add.text(COL2, y, row.value, uiStyle(TYPE.BODY, row.boosted ? UI.TXT_GOLD : UI.TXT_PARCHMENT, { bold: true }))
            .setOrigin(1, 0),
        );
        y += ROW_H;
      });

      y += 12; // respiration entre sections
    }

    this.dynamicObjs.push(
      this.add.text(PX + PW / 2, PY + PH - 12, t('inventory.tap_hint'), uiStyle(TYPE.SMALL, UI.TXT_HINT)).setOrigin(0.5, 1),
    );
  }

  // ── Item detail view (center panel, when item selected) ───────────────────

  // `item` is always the actual instance (inventory slot / equipment slot) the
  // player tapped — NEVER `ALL_ITEMS[id]` (catalogue centre values). See
  // docs/design/LOOT_STAT_ROLLS.md §9 step 8 : the whole Résonance/roll-value
  // display is meaningless if this reads the wrong object.
  private renderItemDetail(item: Item) {
    const { x: PX, y: PY, w: PW, h: PH } = this.stBounds;
    const locItem  = localizeItem(item);
    const rarColor = RARITY_COLORS[item.rarity] ?? UI.TXT_PARCHMENT;

    // ── Header ───────────────────────────────────────────────────────────
    // Lien retour avec hit zone élargie à 44 px de haut — le texte seul
    // (10 px) était très en dessous de la norme tactile.
    const back = this.add.text(PX + 12, PY + 8, t('inventory.back_stats'), uiStyle(TYPE.SMALL, UI.TXT_BLUE, { bold: true }));
    const backHit = this.add.rectangle(
      PX + 12 + back.width / 2, PY + 8 + back.height / 2,
      back.width + 24, 44, 0x000000, 0,
    )
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => back.setColor(UI.TXT_GOLD))
      .on('pointerout',  () => back.setColor(UI.TXT_BLUE))
      .on('pointerdown', () => { this.selectedItem = null; this.refresh(); });
    this.dynamicObjs.push(back, backHit);

    this.dynamicObjs.push(
      this.add.text(PX + PW / 2, PY + 6, t('inventory.detail'), uiStyle(TYPE.BODY, UI.TXT_CYAN, { bold: true })).setOrigin(0.5, 0),
    );

    const sepTop = this.add.graphics();
    drawDivider(sepTop, PX + 8, PY + 26, PW - 16, UI.ACCENT_ARCANE, 0.22);
    this.dynamicObjs.push(sepTop);

    // ── Item identity ─────────────────────────────────────────────────────
    let curY = PY + 38;

    this.dynamicObjs.push(
      this.add.text(PX + PW / 2, curY, `[${t(`rarity.${item.rarity}`)}]`, uiStyle(TYPE.SMALL, rarColor, { bold: true })).setOrigin(0.5, 0),
    );
    curY += 18;

    // Le NOM est le héros du panneau : TYPE.HEADING (21), couleur de rareté —
    // un vrai cran au-dessus des stats (14) et de la description (10).
    const nameTxt = this.add.text(PX + PW / 2, curY, locItem.name, uiStyle(TYPE.HEADING, rarColor, {
      bold: true, stroke: true, wordWrapWidth: PW - 24, align: 'center',
    })).setOrigin(0.5, 0);
    this.dynamicObjs.push(nameTxt);
    curY += nameTxt.height + 10;

    // ── Résonance globale (§4/§7.2) — instance réellement possédée uniquement,
    // absente si l'item n'a pas d'equipRanges calculables (skip silencieux). ──
    const resonance = this.getResonance(item);
    if (resonance !== null) {
      const resTxt = this.add.text(
        PX + PW / 2, curY, formatResonanceLine(resonance),
        uiStyle(9, resonanceColor(resonance), { bold: true }),
      ).setOrigin(0.5, 0);
      this.dynamicObjs.push(resTxt);
      curY += resTxt.height + 6;
    }

    // ── Main stat (valeur rollée en gras/doré + teinte de qualité locale,
    // fourchette catalogue en petit gris juste après — §7.2) ───────────────
    const mainView = this.getMainStatLineView(item);
    if (mainView) {
      const valueTxt = this.add.text(0, curY, mainView.text, uiStyle(TYPE.BODY, mainView.color, { bold: true, stroke: true }));
      let pairW = valueTxt.width;
      let rangeTxt: Phaser.GameObjects.Text | undefined;
      if (mainView.rangeText) {
        rangeTxt = this.add.text(0, curY + 3, mainView.rangeText, uiStyle(TYPE.SMALL, UI.TXT_MUTED));
        pairW += 4 + rangeTxt.width;
      }
      let lx = PX + PW / 2 - pairW / 2;
      valueTxt.setPosition(lx, curY);
      lx += valueTxt.width + 4;
      if (rangeTxt) rangeTxt.setPosition(lx, curY + 4);
      this.dynamicObjs.push(valueTxt);
      if (rangeTxt) this.dynamicObjs.push(rangeTxt);
      curY += valueTxt.height + 10;
    }

    const sepMid = this.add.graphics();
    drawDivider(sepMid, PX + 8, curY, PW - 16, UI.BORDER_LIT, 0.3);
    this.dynamicObjs.push(sepMid);
    curY += 10;

    // ── Substats (teinte de qualité locale par ligne + fourchette en petit
    // gris — §7.2) ──────────────────────────────────────────────────────────
    for (const view of this.getSubstatLineViews(item)) {
      const bulletTxt = this.add.text(PX + 16, curY, `• ${view.text}`, uiStyle(TYPE.BODY, view.color));
      this.dynamicObjs.push(bulletTxt);
      if (view.rangeText) {
        this.dynamicObjs.push(
          this.add.text(PX + 16 + bulletTxt.width + 6, curY + 3, view.rangeText, uiStyle(TYPE.SMALL, UI.TXT_MUTED)),
        );
      }
      curY += 20;   // 14 px de texte + 6 d'air — l'ancien 17 collait les puces
    }
    curY += 8;

    // ── Passif — ENTRE les stats et la description, en bleu clair gras :
    // c'est l'info décisive d'un équipement (Hidden en particulier), elle doit
    // ressortir au lieu de se fondre dans l'italique muted du lore. Même
    // convention que le popup de confirmation (showActionConfirmPopup).
    const detailPassive = ('passiveEffect' in item && item.passiveEffect)
      ? getPassiveEffectLabel(item.passiveEffect)
      : undefined;
    if (detailPassive) {
      const passiveTxt = this.add.text(PX + 14, curY,
        `${t('arsenal.passive_label')} ${detailPassive}`,
        uiStyle(TYPE.SMALL, UI.TXT_BLUE, { bold: true, wordWrapWidth: PW - 28, lineSpacing: 4 }));
      this.dynamicObjs.push(passiveTxt);
      curY += passiveTxt.height + 8;
    }

    // ── Description ───────────────────────────────────────────────────────
    const descTxt = this.add.text(PX + 14, curY, locItem.description, uiStyle(TYPE.SMALL, UI.TXT_MUTED, {
      italic: true, wordWrapWidth: PW - 28, lineSpacing: 4,
    }));
    this.dynamicObjs.push(descTxt);

    // ── Action buttons (bottom of panel — zone de pouce) ─────────────────
    const isEquip = EQUIP_TYPES.includes(item.type);
    const isUse    = item.type === ItemType.CONSUMABLE;
    const isSell   = item.type !== ItemType.KEY_ITEM;
    const btnCount = (isEquip || isUse ? 1 : 0) + (isSell ? 1 : 0) + 1; // +1 for close
    const BTN_H    = 36;   // visuel 36 px (label 14 px), hit zone ≥ 44 px (norme tactile)
    const BTN_GAP  = 10;
    const BTN_W    = PW - 24;
    const BTN_X    = PX + 12;
    let   btnY     = PY + PH - btnCount * (BTN_H + BTN_GAP) - 6;

    const addBtn = (label: string, color: string, onClick: () => void) => {
      const y       = btnY;
      const bgGfx   = this.add.graphics();
      bgGfx.fillStyle(UI.BTN_BG, 1);
      bgGfx.fillRoundedRect(BTN_X, y, BTN_W, BTN_H, 4);
      bgGfx.lineStyle(1, UI.BTN_BORDER, 1);
      bgGfx.strokeRoundedRect(BTN_X, y, BTN_W, BTN_H, 4);
      const txt = this.add.text(BTN_X + BTN_W / 2, y + BTN_H / 2, label, uiStyle(TYPE.BODY, color, { bold: true })).setOrigin(0.5);
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
      // Un item DÉJÀ équipé (le paperdoll ouvre la même popup) : « Déséquiper »
      // REMPLACE « Équiper » — sinon la popup proposait d'équiper un objet qui
      // l'était déjà, et il n'existait AUCUN moyen de retirer une pièce.
      const equippedSlot = this.equippedSlotOf(item);
      if (equippedSlot) {
        const rowY = btnY; // capturé AVANT addBtn (qui incrémente btnY) — sinon le
                            // toast se positionnerait sur la ligne du bouton SUIVANT.
        addBtn(t('inventory.unequip_hint'), UI.TXT_ORANGE, () => {
          // unequip renvoie false si le sac est plein — improbable mais pas
          // impossible avant que le sac de run à 20 emplacements arrive avec le
          // RunSystem (le vrai fix, objet qui tombe au sol, est documenté et
          // délibérément reporté à ce chantier-là, cf. ROGUELITE_POC.md). En
          // attendant, ne pas échouer SILENCIEUSEMENT — le joueur doit comprendre
          // pourquoi rien ne s'est passé plutôt que de croire le bouton cassé.
          if (InventorySystem.unequip(this.player, equippedSlot)) {
            this.selectedItem = null;
            this.refresh();
          } else {
            // PAS this.gameScene.events.emit('show_notification', ...) : InventoryScene
            // se rend au-dessus de UIScene (ordre fixe dans main.ts), son overlay
            // 0.88 d'opacité rendrait ce toast invisible — le "ne pas échouer
            // silencieusement" resterait silencieux. Toast local, garanti visible.
            this.showLocalToast(t('inventory.unequip_bag_full'), BTN_X + BTN_W / 2, rowY - 14);
          }
        });
      } else {
        addBtn(t('inventory.equip_hint'), UI.TXT_GREEN, () => {
          InventorySystem.equip(this.player, item);
          this.selectedItem = null;
          this.refresh();
        });
      }
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
          InventorySystem.sell(this.player, item, 1);
          this.selectedItem = null;
          this.refresh();
        },
      );
    }
    addBtn(t('inventory.close_hint'), UI.TXT_MUTED, () => {
      this.selectedItem = null;
      this.refresh();
    });
  }

  /** Message éphémère au-dessus d'un bouton, garanti visible (contrairement à un
   *  `show_notification` cross-scène : InventoryScene se rend au-dessus de UIScene,
   *  cf. ordre dans main.ts). Poussé dans dynamicObjs pour être nettoyé au refresh(). */
  private showLocalToast(msg: string, x: number, y: number) {
    const txt = this.add.text(x, y, msg, uiStyle(TYPE.SMALL, UI.TXT_ORANGE, { bold: true }))
      .setOrigin(0.5).setDepth(50);
    this.dynamicObjs.push(txt);
    this.tweens.add({ targets: txt, alpha: 0, delay: 1400, duration: 500, onComplete: () => txt.destroy() });
  }

  /** Slot d'équipement occupé par CETTE instance d'item, ou null si non équipée.
   *  Comparaison par IDENTITÉ (`===`) et non par `id` : deux exemplaires rollés du
   *  même item ont le même id mais sont des objets distincts — seule l'instance
   *  réellement équipée doit matcher. */
  private equippedSlotOf(item: Item): EquipSlotKey | null {
    for (const slot of EQ_ORDER) {
      if (this.player.equipment[slot] === item) return slot;
    }
    return null;
  }

  // ── Inventory grid (right panel) ──────────────────────────────────────────

  private renderGrid() {
    this.input.off('wheel');
    this.input.off('pointermove');

    const { x: PX, y: PY, w: PW, h: PH } = this.bagBounds;
    const TITLE_H   = BAG_TITLE_H;
    const GRID_PAD  = 8;
    const GRID_X    = PX + GRID_PAD;

    // ── Onglets de filtrage (D13) — rangée fixe entre le titre SAC et la grille
    this.renderBagTabs(GRID_X, PY + TITLE_H, INV_COLS * INV_SLOT);

    // Le champ de recherche (créé dans create(), pas ici) occupe la bande entre
    // les onglets et la grille : la grille démarre sous lui.
    const SEARCH_BAND = BAG_SEARCH_H + BAG_SEARCH_GAP;
    const GRID_Y    = PY + TITLE_H + BAG_TABS_H + 4 + SEARCH_BAND;
    const VISIBLE_H = PH - TITLE_H - BAG_TABS_H - 4 - SEARCH_BAND;

    // Grouped by category (weapons / armor / accessories / ...), rarity-sorted within
    // each group — see InventorySystem.groupForDisplay. A layout pass computes every
    // group's header/item pixel offsets up front so contentH (and thus the scroll
    // mask + max scroll) is known before anything is drawn.
    // Les DEUX filtres (onglet de catégorie + recherche textuelle) s'appliquent
    // AVANT la passe de layout — c'est la condition pour que `contentH`, le masque
    // de scroll et la virtualisation se recalculent sur le contenu RÉELLEMENT
    // affiché. Ils se COMBINENT : la recherche cherche dans l'onglet actif.
    const activeTab = BAG_TABS.find(tb => tb.id === this.bagFilter) ?? BAG_TABS[0]!;
    const groups = InventorySystem.groupForDisplay(this.player.inventory)
      .filter(g => activeTab.cats === null || activeTab.cats.includes(g.category))
      .map(g => ({ ...g, slots: g.slots.filter(s => this.matchesQuery(s.item)) }))
      .filter(g => g.slots.length > 0);
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
    // Reprend la position préservée, clampée au contenu courant (le sac a pu
    // rétrécir depuis le dernier rendu — un équipement retiré de la grille).
    let   scrollY  = Phaser.Math.Clamp(this.bagScrollY, 0, Math.max(0, contentH - VISIBLE_H));

    // Geometry mask clips the scrollable grid area
    const maskGfx = this.make.graphics({ x: 0, y: 0 });
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRect(GRID_X - 2, GRID_Y, INV_COLS * INV_SLOT + 4, VISIBLE_H);
    const geomMask = maskGfx.createGeometryMask();
    this.scrollMaskGfx = maskGfx;

    // ══════════════════════════════════════════════════════════════════
    // VIRTUALISATION DE LA GRILLE
    //
    // Avant : chaque slot du sac était instancié, quel qu'en soit le nombre.
    // Un slot coûte ~5 GameObjects (fond Graphics + cadre NineSlice + anneau de
    // survol + icône + zone cliquable) — avec un sac de 400 items, ça faisait
    // ~2 000 objets créés à CHAQUE refresh (ouverture, clic d'onglet, équipement,
    // vente), et le scroll repositionnait les 2 000 à chaque cran de molette.
    // D'où le freeze : le jeu devenait injouable dès que le sac se remplissait.
    //
    // Maintenant : on ne rend que la fenêtre visible + une marge de RENDER_BUFFER
    // px au-dessus et en dessous. Le scroll se contente de déplacer ce petit lot ;
    // on ne reconstruit la fenêtre que lorsqu'on sort de la marge. Le coût devient
    // fonction de la HAUTEUR DU PANNEAU, plus de la taille du sac : un sac de 40
    // items et un sac de 1 000 rendent exactement le même nombre d'objets.
    // ══════════════════════════════════════════════════════════════════
    const RENDER_BUFFER = INV_SLOT * 2; // 2 rangées de marge de part et d'autre

    let scrollables: { obj: ScrollableGO; baseY: number }[] = [];
    /** Objets de la fenêtre courante — détruits/reconstruits à chaque re-fenêtrage,
     *  séparés de dynamicObjs (qui, lui, ne bouge pas tant qu'on ne refresh() pas). */
    let windowObjs: Phaser.GameObjects.GameObject[] = [];
    /**
     * Zones cliquables des slots, suivies à part.
     *
     * Un masque géométrique découpe le RENDU, jamais l'INPUT : un slot scrollé
     * au-dessus de la grille reste invisible mais toujours cliquable, à cheval
     * sur la rangée d'onglets. D'où le bug reporté — « après avoir scrollé, si je
     * clique sur une catégorie ça clique sur l'item en dessous » : les deux zones
     * se déclenchaient. On coupe donc l'input des slots sortis du viewport, à
     * chaque déplacement (cf. syncHitZones).
     */
    let hitZones: { obj: Phaser.GameObjects.GameObject; baseY: number }[] = [];

    const reg: RegisterFn = (go, baseY) => {
      go.setMask(geomMask);
      scrollables.push({ obj: go, baseY });
      windowObjs.push(go);
      if (go.input) hitZones.push({ obj: go, baseY });
    };

    /** N'accepte le clic que si le slot est ENTIÈREMENT dans la bande visible —
     *  un slot à moitié coupé par le bord ne doit pas être actionnable non plus.
     *  `baseY` d'une zone cliquable est son CENTRE (cf. renderInventorySlot). */
    const syncHitZones = (sy: number) => {
      const half = INV_SLOT / 2;
      for (const { obj, baseY } of hitZones) {
        const cy = baseY - sy;
        if (obj.input) obj.input.enabled = (cy - half >= GRID_Y) && (cy + half <= GRID_Y + VISIBLE_H);
      }
    };

    const gridW = INV_COLS * INV_SLOT;

    /** (Re)construit les seuls objets qui tombent dans la fenêtre visible. */
    const renderWindow = (sy: number) => {
      for (const go of windowObjs) { if (go.active) go.destroy(); }
      windowObjs = [];
      scrollables = [];
      hitZones = [];

      const top    = sy - RENDER_BUFFER;
      const bottom = sy + VISIBLE_H + RENDER_BUFFER;

      for (const layout of layouts) {
        // En-tête de groupe
        if (layout.headerY + GROUP_HEADER_H >= top && layout.headerY <= bottom) {
          this.renderInventoryGroupHeader(
            layout.category, layout.slots.length,
            GRID_X, GRID_Y + layout.headerY, gridW, reg,
          );
        }
        // Slots : on saute directement aux rangées concernées, sans balayer le reste
        const rows      = Math.ceil(layout.slots.length / INV_COLS);
        const firstRow  = Math.max(0, Math.floor((top - layout.itemsY) / INV_SLOT));
        const lastRow   = Math.min(rows - 1, Math.floor((bottom - layout.itemsY) / INV_SLOT));
        for (let row = firstRow; row <= lastRow; row++) {
          for (let col = 0; col < INV_COLS; col++) {
            const idx = row * INV_COLS + col;
            const slot = layout.slots[idx];
            if (!slot) break;
            this.renderInventorySlot(
              slot,
              GRID_X + col * INV_SLOT,
              GRID_Y + layout.itemsY + row * INV_SLOT,
              reg,
            );
          }
        }
      }
      // Repositionner le lot fraîchement créé selon le scroll courant
      for (const { obj, baseY } of scrollables) obj.setY(baseY - sy);
      syncHitZones(sy);
    };

    // État vide — sac vide, onglet sans item, OU recherche sans résultat : on
    // distingue les cas, sinon « Inventaire vide » sur une recherche infructueuse
    // ferait croire à un sac réellement vidé.
    if (groups.length === 0) {
      const hasQuery = this.searchQuery.length > 0;
      this.dynamicObjs.push(
        this.add.text(
          PX + PW / 2, GRID_Y + VISIBLE_H / 2 - (hasQuery ? 10 : 0),
          hasQuery ? t('search.no_results') : t('inventory.empty'),
          uiStyle(TYPE.BODY, UI.TXT_MUTED, { bold: hasQuery }),
        ).setOrigin(0.5),
      );
      if (hasQuery) {
        this.dynamicObjs.push(
          this.add.text(
            PX + PW / 2, GRID_Y + VISIBLE_H / 2 + 14,
            // Texte TEL QUE TAPÉ (« Épée »), pas la forme normalisée (« epee »).
            t('search.no_results_hint').replace('{q}', this.search?.text ?? this.searchQuery),
            uiStyle(TYPE.SMALL, UI.TXT_HINT, { align: 'center', wordWrapWidth: PW - 20 }),
          ).setOrigin(0.5),
        );
      }
    }

    renderWindow(scrollY);
    /** Scroll auquel la fenêtre courante a été construite. */
    let windowScrollY = scrollY;
    // Les objets de fenêtre doivent mourir avec le reste au prochain refresh() :
    // on branche un porteur dans dynamicObjs qui les détruit en cascade.
    this.gridWindowDispose = () => {
      for (const go of windowObjs) { if (go.active) go.destroy(); }
      windowObjs = [];
      scrollables = [];
      // `hitZones` référence les MÊMES objets : le vider aussi, sinon syncHitZones
      // pourrait un jour être appelé sur des GameObjects détruits. Inoffensif
      // aujourd'hui (clearDynamic retire les handlers de scroll avant d'appeler
      // ceci), mais l'asymétrie piégerait le prochain appelant.
      hitZones = [];
    };

    // Scroll : molette (desktop) + drag vertical (tactile — dette D2 résorbée)
    if (contentH > VISIBLE_H) {
      const maxScroll = contentH - VISIBLE_H;

      const applyScroll = (next: number) => {
        scrollY = Phaser.Math.Clamp(next, 0, maxScroll);
        this.bagScrollY = scrollY; // préservé pour le prochain refresh()
        // Tant qu'on reste dans la marge, il suffit de déplacer le petit lot déjà
        // rendu. On ne reconstruit la fenêtre que lorsqu'on en sort.
        if (Math.abs(scrollY - windowScrollY) >= RENDER_BUFFER) {
          renderWindow(scrollY);
          windowScrollY = scrollY;
        } else {
          for (const { obj, baseY } of scrollables) obj.setY(baseY - scrollY);
          syncHitZones(scrollY);
        }
      };

      this.input.on('wheel', (_p: unknown, _g: unknown, _dx: number, dy: number) => {
        applyScroll(scrollY + dy * 0.8);
      });

      const gridRight = GRID_X + INV_COLS * INV_SLOT + 4;
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
        if (!p.isDown) return;
        // Seuls les drags démarrés dans la zone de la grille scrollent
        if (p.downX < GRID_X - 4 || p.downX > gridRight) return;
        if (p.downY < GRID_Y || p.downY > GRID_Y + VISIBLE_H) return;
        const dy = p.y - p.prevPosition.y;
        if (dy === 0) return;
        applyScroll(scrollY - dy);
        // Un drag en cours annule le long-press (le doigt scrolle, il ne maintient pas)
        if (p.getDistance() > 10 && this.longPressTimer !== null) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
      });
    }
  }

  /**
   * Rangée d'onglets de filtrage du sac (D13) : Tous | Équipement |
   * Consommables | Matériaux | Quête & divers — en ICÔNES (glyphes `bagtab_*`
   * bakés au boot, tooltip texte au survol pour l'accessibilité), fallback
   * label texte si la sheet d'icônes n'est pas chargée.
   *
   * Fond : pilule Graphics sobre (vocabulaire des tabs de PauseScene). L'asset
   * `ui_tab_frame` a été retiré ici : étiré en NineSlice sur ~64×26, son motif
   * produisait le fond « sale » reporté par l'utilisateur.
   *
   * Onglet actif : fond BG_MID + liseré et bande basse arcane + glyphe alpha
   * plein ; hit zone 44 px de haut (norme tactile). Le changement d'onglet
   * re-rend tout (refresh) — l'état actif EST le feedback.
   */
  private renderBagTabs(x: number, y: number, w: number): void {
    const GAP = 4;
    const tw  = Math.floor((w - GAP * (BAG_TABS.length - 1)) / BAG_TABS.length);

    BAG_TABS.forEach((tab, i) => {
      const tx     = x + i * (tw + GAP);
      const active = tab.id === this.bagFilter;
      const cx     = tx + tw / 2;
      const cy     = y + BAG_TABS_H / 2;

      const g = this.add.graphics();
      g.fillStyle(active ? UI.BG_MID : UI.BG_DEEP, 1);
      g.fillRoundedRect(tx, y, tw, BAG_TABS_H, 4);
      g.lineStyle(1, active ? UI.ACCENT_ARCANE : UI.SEPARATOR, active ? 0.9 : 1);
      g.strokeRoundedRect(tx, y, tw, BAG_TABS_H, 4);
      if (active) {
        // Bande d'accent basse — même vocabulaire que les tabs de SkillScene/Pause
        g.fillStyle(UI.ACCENT_ARCANE, 0.9);
        g.fillRect(tx + 4, y + BAG_TABS_H - 3, tw - 8, 2);
      }
      this.dynamicObjs.push(g);

      // Glyphe 32×32 à sa taille NATIVE (bake ×2 de la grille 16 px — tout
      // redimensionnement non entier réintroduirait du flou NEAREST).
      const inactiveAlpha = 0.45;
      let icon: Phaser.GameObjects.Image | null = null;
      if (this.textures.exists(tab.icon)) {
        icon = this.add.image(cx, cy, tab.icon).setAlpha(active ? 1 : inactiveAlpha);
        this.dynamicObjs.push(icon);
      } else {
        // Fallback texte (sheet ui_icons_16 absente) — comportement historique,
        // clampé en pixels (les labels complets servent d'abord au tooltip).
        const tabStyle = uiStyle(TYPE.SMALL, active ? UI.TXT_CYAN : UI.TXT_MUTED, { bold: active });
        this.dynamicObjs.push(
          this.add.text(cx, cy, fitText(this, t(tab.labelKey), tabStyle, tw - 8), tabStyle).setOrigin(0.5),
        );
      }

      const hit = this.add.rectangle(cx, cy, tw + GAP, 44, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => {
        if (icon && !active) icon.setAlpha(0.8);
        this.showTabTooltip(cx, y, t(tab.labelKey));
      });
      hit.on('pointerout', () => {
        if (icon && tab.id !== this.bagFilter) icon.setAlpha(inactiveAlpha);
        this.hideTabTooltip();
      });
      hit.on('pointerdown', () => {
        this.hideTabTooltip();
        if (this.bagFilter === tab.id) return;
        this.bagFilter = tab.id;
        this.bagScrollY = 0; // catégorie différente : on repart du haut
        this.refresh(); // re-rend immédiatement — l'état actif EST le feedback
      });
      this.dynamicObjs.push(hit);
    });
  }

  /**
   * Tooltip du survol d'un onglet à icône — nom complet du filtre, au-dessus de
   * la rangée (depth 30, convention tooltips §2.5). Un seul à la fois.
   *
   * Panneau OPAQUE, pas un simple `add.text` : la rangée d'onglets a le champ de
   * recherche juste au-dessus, et un texte nu s'y superposait lettre sur lettre
   * (défaut reporté : « les hover se chevauchent avec le reste »). Un fond qui
   * masque ce qu'il recouvre est la seule façon de rendre un tooltip lisible
   * quand il déborde forcément sur un voisin.
   */
  private showTabTooltip(cx: number, tabTopY: number, label: string): void {
    this.hideTabTooltip();

    const PAD_X = 8;
    const PAD_Y = 4;
    const txt = this.add.text(0, 0, label,
      uiStyle(TYPE.SMALL, UI.TXT_PARCHMENT, { bold: true })).setOrigin(0.5);
    const w = txt.width  + PAD_X * 2;
    const h = txt.height + PAD_Y * 2;

    const bg = this.add.graphics();
    bg.fillStyle(UI.BG_DEEP, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 3);
    bg.lineStyle(1, UI.ACCENT_ARCANE, 0.7);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 3);

    // Origine du conteneur = centre du panneau : on le pose à h/2 au-dessus du
    // bord haut des onglets pour que son BAS affleure la rangée.
    this.tabTooltip = this.add.container(cx, tabTopY - 4 - h / 2, [bg, txt]).setDepth(30);

    // Clamp horizontal : le tooltip du premier/dernier onglet ne doit pas sortir
    // du cadre — on borne le CENTRE du panneau, pas celui du texte.
    const W = this.cameras.main.width;
    const min = MARGIN + 4 + w / 2;
    const max = W - MARGIN - 4 - w / 2;
    this.tabTooltip.setX(Phaser.Math.Clamp(cx, Math.min(min, max), max));
  }

  private hideTabTooltip(): void {
    if (this.tabTooltip) { this.tabTooltip.destroy(); this.tabTooltip = null; }
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

    const txt = this.add.text(x + 12, headerTopY + localCy, label, uiStyle(TYPE.SMALL, UI.TXT_CYAN, { bold: true })).setOrigin(0, 0.5);
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

    // Cadre pixel art réel (Retro Inventory) par-dessus le fond, sous l'icône —
    // absent (script de copie pas lancé) : le rendu drawSlot reste tel quel.
    //
    // Variante `_empty` (intérieur aplati au gris de fond) et NON l'asset brut :
    // `ui_slot_frame` porte une épée gravée au centre, qui transparaissait sous
    // les icônes d'items à fond ajouré — d'où « certaines armes ont une glyphe et
    // d'autres non » (les icônes opaques la masquaient, les autres pas). Une case
    // de sac PLEINE n'a rien à annoncer : son contenu est déjà dessiné dessus.
    const frame = addUiFrame(
      this, sx + (INV_SLOT - 2) / 2, midY, INV_SLOT - 2, INV_SLOT - 2, 'ui_slot_frame_empty',
    );
    if (frame) reg(frame, midY);

    // Anneau de rareté/survol AU-DESSUS du cadre (la bordure de drawSlot passe
    // sous le cadre asset) — les handlers hover redessinent cet anneau, plus
    // jamais le bg complet (même géométrie/épaisseur que la bordure drawSlot).
    const ring = this.add.graphics();
    const drawRing = (color: number) => {
      ring.clear();
      ring.lineStyle(2, color, 1);
      ring.strokeRoundedRect(sx, 0, INV_SLOT - 2, INV_SLOT - 2, 4);
    };
    drawRing(rarHex);
    ring.setY(topY);
    reg(ring, topY);

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
        this.showDetail(slot.item);
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
        this.doMainAction(slot.item, screenX, screenY);
      }
    });
    // Survol : seul l'anneau est redessiné (clear + stroke) — le fond et le
    // cadre asset restent intacts, aucune commande de tracé ne s'empile.
    hit.on('pointerover', () => drawRing(0xffffff));
    hit.on('pointerout',  () => {
      // Cancel long-press if the pointer leaves before 500 ms
      if (this.longPressTimer !== null) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
      drawRing(rarHex);
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Prédicat de recherche d'un objet du sac — sur le nom LOCALISÉ (`localizeItem`),
   * la rareté et la catégorie affichée : le joueur cherche ce qu'il LIT à l'écran,
   * pas l'id de data. Insensible à la casse ET aux accents (« epee » → « Épée »),
   * cf. normalizeSearch/matchesSearch.
   */
  private matchesQuery(item: Item): boolean {
    if (this.searchQuery.length === 0) return true;
    return matchesSearch(this.searchQuery, localizeItem(item).name, t(`rarity.${item.rarity}`));
  }

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
   * Résonance globale (0–100) de l'INSTANCE, si calculable (docs/design/
   * LOOT_STAT_ROLLS.md §4/§7.2). Priorité au cache `rollQuality` (posé par
   * `StatRollSystem.rollItem` à l'acquisition — évite un recalcul dans les
   * listes) ; recalcule via `computeQuality` sinon. `null` — et donc AUCUNE
   * ligne Résonance affichée — si l'item n'a pas d'`equipRanges`/`equipStats`
   * exploitables (catalogue incomplet, item non équipable).
   */
  private getResonance(item: Item): number | null {
    if (typeof item.rollQuality === 'number') return item.rollQuality;
    if (!isEquipableItem(item) || !item.equipStats || !item.equipRanges) return null;
    return StatRollSystem.computeQuality(item.equipStats, item.equipRanges);
  }

  /**
   * Returns the main stat line for the detail panel, as the INSTANCE's rolled
   * value (never the catalogue centre — caller must pass the real object).
   * Colored by local roll quality (§7.2) when `equipRanges` is available on
   * the instance ; `rangeText` is the catalogue fourchette suffix, e.g. "(91–150)".
   */
  private getMainStatLineView(item: Item): { text: string; color: string; rangeText?: string } | null {
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

  /**
   * Returns sub-stat line views for the detail panel (instance values — same
   * caveat as `getMainStatLineView`). Prefers `equipStats.substats`, falls
   * back to legacy `bonusStats` (fixed, never rolled — §1.3 of the design doc).
   */
  private getSubstatLineViews(item: Item): { text: string; color: string; rangeText?: string }[] {
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
  private doMainAction(item: Item, slotScreenX?: number, slotScreenY?: number): void {
    if (EQUIP_TYPES.includes(item.type) || item.type === ItemType.CONSUMABLE) {
      // Show confirmation popup instead of equipping/using immediately —
      // also shows stats/lore for gear, since a stray tap shouldn't swap weapons.
      this.showActionConfirmPopup(item, slotScreenX ?? this.cameras.main.width / 2, slotScreenY ?? this.cameras.main.height / 2);
    } else {
      // Key items, materials, skins: open the detail panel
      this.showDetail(item);
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

    // Le popup est ancré sur le slot touché : il peut remonter jusque sur la bande
    // du champ de recherche. Or la surface de capture du champ est un élément DOM,
    // qui flotte AU-DESSUS du canvas quelle que soit la profondeur Phaser du popup
    // — elle avalerait les taps sur les boutons du popup. On la neutralise tant que
    // le popup est ouvert (la requête, elle, est conservée).
    this.search?.setEnabled(false);

    const isConsumable = item.type === ItemType.CONSUMABLE;
    const isEquip       = EQUIP_TYPES.includes(item.type);

    const W       = this.cameras.main.width;
    const H       = this.cameras.main.height;
    // Aération : le popup était compact au point d'être illisible une fois la police
    // passée en 14 px. On donne de la largeur (le canvas fait maintenant 960), de la
    // marge intérieure, et surtout de l'INTERLIGNE — c'est lui qui manquait le plus :
    // sept substats collées les unes aux autres se lisent comme un bloc, pas comme
    // une liste.
    const PW        = isEquip ? 340 : 260;
    const MARGIN    = 12;   // 6 → 12 : padding intérieur réel
    // 18 → 14 : les substats sont passées de BODY (Standard 14) à SMALL (Minimal
    // 10) — elles pesaient autant que le nom de l'item et écrasaient la bulle.
    // 10 px est le PLANCHER : Neatpixels Minimal a une grille de 10, descendre
    // en dessous rasteriserait les glyphes hors grille et les rendrait flous
    // (c'est la raison du flou qu'on a éliminé, on ne le réintroduit pas ici).
    // Le passif est déjà à ce plancher.
    const LINE_H    = 14;
    const BLOCK_GAP = 12;   // respiration entre blocs (stats | lore | passif)
    // La case de la popup a EXACTEMENT le gabarit d'une case du sac (INV_SLOT - 2),
    // et l'art dedans la même taille (32) : c'est ce qui la rend indiscernable
    // d'une case de la grille — le but même de la correction. Deux constantes et
    // non une : le cadre pixel occupe la couronne entre les deux, il lui faut
    // cette marge pour exister (un art à 46 dans une case de 46 le recouvrirait).
    const ICON_SIZE = INV_SLOT - 2;  // case
    const ICON_ART  = 32;            // icône
    const BTN_H     = 44;   // ≥44px touch target (Apple HIG)

    // Hauteur du panneau calculée depuis le contenu réel (plus de troncature à 90
    // caractères ni de taille fixe trop courte pour un lore long) : on mesure le
    // texte de description avec un Text jetable au wordWrapWidth final, AVANT de
    // décider PH, puis on le détruit — le vrai texte est recréé plus bas une fois
    // la position finale connue.
    const locItem    = localizeItem(item);
    // Plus de plafond à 3 lignes. Le nombre de substats EST le signal de rareté
    // (1 en COMMON → 7 en HIDDEN, cf. SUBSTAT_COUNT_BY_RARITY) : en tronquer
    // l'affichage rendait un Hidden à 7 lignes strictement identique à un RARE à 3,
    // et effaçait la hiérarchie que toute la table de raretés sert à établir.
    // La hauteur du panneau est déjà dérivée de substatCount, il s'adapte donc seul.
    const substatCount = isEquip ? this.getSubstatLineViews(item).length : 0;
    const passiveLabel = ('passiveEffect' in item && item.passiveEffect)
      ? getPassiveEffectLabel(item.passiveEffect)
      : undefined;
    const baseDesc0  = isEquip ? (locItem.lore ?? locItem.description) : '';
    // Passif SÉPARÉ du lore (il était concaténé en fin de description) : rendu
    // ENTRE les stats et le lore, en BLEU CLAIR gras — c'est l'info décisive
    // d'un équipement, elle ne doit plus se fondre dans l'italique du lore.
    const passiveText  = (isEquip && passiveLabel) ? `${t('arsenal.passive_label')} ${passiveLabel}` : undefined;
    const passiveStyle = uiStyle(TYPE.SMALL, UI.TXT_BLUE, { bold: true, wordWrapWidth: PW - MARGIN * 2, lineSpacing: 4 });
    let passiveHeight = 0;
    if (passiveText) {
      const probe = this.add.text(0, 0, passiveText, passiveStyle);
      passiveHeight = probe.height;
      probe.destroy();
    }
    let descHeight = 0;
    if (isEquip && baseDesc0) {
      const probe = this.add.text(0, 0, baseDesc0, uiStyle(TYPE.SMALL, UI.TXT_MUTED, {
        italic: true, wordWrapWidth: PW - MARGIN * 2, lineSpacing: 4,
      }));
      descHeight = probe.height;
      probe.destroy();
    }
    // Résonance (instance réellement possédée) : une ligne compacte sous le nom,
    // seulement pour les équipements et si calculable.
    const resonance = isEquip ? this.getResonance(item) : null;
    const hasResonanceLine = resonance !== null;

    // ── Hauteur du bandeau d'en-tête — MESURÉE, plus supposée ──
    // L'ancien calcul postulait que le nom tenait sur UNE ligne à côté de l'icône
    // (`headerH = MARGIN + ICON_SIZE + MARGIN`). Depuis que la police est calée sur
    // la grille de 7 px, le nom est rendu en 14 px : un nom long passe sur deux
    // lignes, écrase la ligne de Résonance, et décale tout le corps vers le bas —
    // au point de faire sortir le passif du panneau. On mesure donc le nom pour de
    // vrai, exactement comme on mesure déjà la description.
    // Nom en TYPE.BODY (14) gras — plus HEADING (21) : dans une bulle compacte,
    // le HEADING écrasait tout (retour utilisateur « titre beaucoup trop gros ») ;
    // la hiérarchie est déjà portée par la couleur de rareté et le gras.
    const nameWrapW = PW - (MARGIN * 2 + ICON_SIZE + 2) - MARGIN - (item.element ? 17 : 0);
    const nameProbe = this.add.text(0, 0, locItem.name,
      uiStyle(TYPE.BODY, '#ffffff', { bold: true, wordWrapWidth: Math.max(40, nameWrapW) }));
    const nameH = nameProbe.height;
    nameProbe.destroy();

    // Colonne de droite : nom (1-2 lignes) + Résonance + ligne de stat principale.
    const rightColH = nameH + (hasResonanceLine ? 14 : 0) + (isEquip || isConsumable ? 16 : 0);
    const headerH = MARGIN + Math.max(ICON_SIZE, rightColH) + MARGIN;

    const contentH = isEquip
      ? headerH + substatCount * LINE_H + (passiveText ? passiveHeight + 6 : 0)
        + BLOCK_GAP + descHeight + BLOCK_GAP + BTN_H + MARGIN * 2
      : 130;
    // Bornes : jamais plus petit que l'ancien minimum (évite une régression visuelle
    // sur les items courts), jamais plus grand que l'écran moins une marge de sécurité.
    const PH = Math.min(Math.max(contentH, isEquip ? 150 : 130), H - MARGIN * 4);

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

    // ── Icône de l'item : une VRAIE case, identique à celles du sac ────────
    //
    // Elle n'avait qu'un trait rectangulaire à la couleur de rareté — pas le
    // cadre pixel `ui_slot_frame` (le « liseré doré » du pack Retro Inventory),
    // que seuls le paperdoll, la grille du sac et la barre de sorts posaient.
    // Ouverte contre une rangée du sac, la popup exhibait donc une case nue au
    // milieu de cases cernées d'or : le défaut lisait comme « cette arme-là n'a
    // pas de liseré », alors que la différence était par ÉCRAN, jamais par item.
    //
    // Même vocabulaire et même ordre d'empilement que renderInventorySlot :
    // fond arrondi → cadre pixel → anneau de rareté → icône par-dessus.
    const rarHexStr = RARITY_COLORS[item.rarity] ?? '#ffffff';
    const rarHex    = parseInt(rarHexStr.replace('#', ''), 16);
    const iconKey   = this.resolveIcon(item);
    const slotX     = px + MARGIN;
    const slotY     = py + MARGIN;
    const iconX     = slotX + ICON_SIZE / 2;
    const iconY     = slotY + ICON_SIZE / 2;

    const slotGfx = this.add.graphics().setDepth(depth + 1);
    drawSlot(slotGfx, slotX, slotY, ICON_SIZE, rarHex, { occupied: true, radius: 4 });
    this.consumePopupObjects.push(slotGfx);

    const slotFrame = addUiFrame(this, iconX, iconY, ICON_SIZE, ICON_SIZE, 'ui_slot_frame_empty');
    if (slotFrame) {
      slotFrame.setDepth(depth + 1);
      this.consumePopupObjects.push(slotFrame);
    }

    // Anneau de rareté AU-DESSUS du cadre (sinon le cadre asset le recouvre) —
    // même géométrie que la bordure de drawSlot.
    const ringGfx = this.add.graphics().setDepth(depth + 1);
    ringGfx.lineStyle(2, rarHex, 1);
    ringGfx.strokeRoundedRect(slotX, slotY, ICON_SIZE, ICON_SIZE, 4);
    this.consumePopupObjects.push(ringGfx);

    if (iconKey) {
      try {
        const img = this.add.image(iconX, iconY, iconKey)
          .setDisplaySize(ICON_ART, ICON_ART)
          .setDepth(depth + 2);
        this.consumePopupObjects.push(img);
      } catch {
        this.addColorSquareAbove(slotX, slotY, ICON_SIZE, 0x44cc66, depth + 2);
      }
    } else {
      this.addColorSquareAbove(slotX, slotY, ICON_SIZE, 0x44cc66, depth + 2);
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
    // Plus de troncature à 22 caractères : elle datait d'une police plus étroite et
    // amputait les noms (« Faucheur du Néa.. »). Le nom wrappe sur deux lignes si
    // besoin — la hauteur du panneau en tient compte (cf. nameProbe plus haut).
    // TYPE.BODY gras (même style que la sonde nameProbe — les deux doivent
    // rester synchronisés) : cf. commentaire de la sonde.
    this.consumePopupObjects.push(
      this.add.text(nameX, py + MARGIN, locItem.name,
        uiStyle(TYPE.BODY, rarHexStr, {
          bold: true, wordWrapWidth: px + PW - MARGIN - nameX,
        }),
      ).setDepth(depth + 1),
    );

    // Les lignes suivantes se posent SOUS le nom réellement mesuré, plus à un offset
    // fixe : c'est ce qui les faisait se chevaucher dès que le nom passait sur 2 lignes.
    let headerCursorY = py + MARGIN + nameH;
    if (hasResonanceLine && resonance !== null) {
      this.consumePopupObjects.push(
        this.add.text(textX, headerCursorY, formatResonanceLine(resonance),
          uiStyle(TYPE.SMALL, resonanceColor(resonance), { bold: true })).setDepth(depth + 1),
      );
      headerCursorY += 14;
    }

    // ── Body: effect line (consumable) or stats + description (equip) ─────
    const bodyLineY = headerCursorY;
    if (isConsumable) {
      const effectLine = this.getConsumableEffectLine(item as Consumable);
      this.consumePopupObjects.push(
        this.add.text(textX, bodyLineY, effectLine, uiStyle(10, UI.TXT_GREEN)).setDepth(depth + 1),
      );
    } else {
      const mainView = this.getMainStatLineView(item);
      if (mainView) {
        const mainTxt = this.add.text(textX, bodyLineY, mainView.text, uiStyle(10, mainView.color, { bold: true })).setDepth(depth + 1);
        this.consumePopupObjects.push(mainTxt);
        if (mainView.rangeText) {
          this.consumePopupObjects.push(
            this.add.text(textX + mainTxt.width + 4, bodyLineY + 1, mainView.rangeText, uiStyle(TYPE.SMALL, UI.TXT_MUTED)).setDepth(depth + 1),
          );
        }
      }
    }

    // ── Separator ─────────────────────────────────────────────────────────
    const sepGfx = this.add.graphics().setDepth(depth + 1);
    drawDivider(sepGfx, px + 6, py + headerH, PW - 12, UI.ACCENT_ARCANE, 0.3);
    this.consumePopupObjects.push(sepGfx);

    // ── Equip-only: substats + description (the "lore etc." the popup lacked) ──
    if (isEquip) {
      let bodyY = py + headerH + 6;
      for (const view of this.getSubstatLineViews(item)) {
        const lineTxt = this.add.text(px + MARGIN, bodyY, `• ${view.text}`, uiStyle(TYPE.SMALL, view.color)).setDepth(depth + 1);
        this.consumePopupObjects.push(lineTxt);
        if (view.rangeText) {
          // Même corps que la ligne : la fourchette n'a plus à être RÉDUITE pour
          // se distinguer, la couleur grise suffit — et sur la même ligne de base
          // (plus d'offset +3, qui compensait deux tailles différentes).
          this.consumePopupObjects.push(
            this.add.text(px + MARGIN + lineTxt.width + 6, bodyY, view.rangeText, uiStyle(TYPE.SMALL, UI.TXT_MUTED)).setDepth(depth + 1),
          );
        }
        bodyY += LINE_H;
      }
      // Passif ENTRE les stats et le lore, en bleu clair gras (même style que
      // la sonde passiveStyle — hauteur déjà comptée dans contentH plus haut).
      if (passiveText) {
        bodyY += 6;
        const passiveTxt = this.add.text(px + MARGIN, bodyY, passiveText, passiveStyle)
          .setDepth(depth + 1);
        this.consumePopupObjects.push(passiveTxt);
        bodyY += passiveTxt.height;
      }
      bodyY += BLOCK_GAP;
      // Texte complet (plus de troncature à 90 caractères) — lore/description
      // seul (cf. baseDesc0/descHeight mesurés plus haut, avant que PH ne soit
      // fixé — doit rester identique à ce texte-ci).
      this.consumePopupObjects.push(
        this.add.text(px + MARGIN, bodyY, baseDesc0, uiStyle(TYPE.SMALL, UI.TXT_MUTED, {
          italic: true, wordWrapWidth: PW - MARGIN * 2, lineSpacing: 4,
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
          InventorySystem.useConsumable(this.player, item);
        } else {
          this.lastFlashSlotKey = this.getSlotKeyForItem(item);
          InventorySystem.equip(this.player, item);
        }
        this.selectedItem = null;
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
    // Le champ redevient saisissable (cf. showActionConfirmPopup). Appelé aussi
    // depuis shutdown() via clearDynamic() : `search` y est déjà null → no-op.
    this.search?.setEnabled(true);
  }

  // ── State transitions ──────────────────────────────────────────────────────

  private showDetail(item: Item): void {
    this.selectedItem = item;
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
    // Tooltip d'onglet hors dynamicObjs (transient) — détruit explicitement
    this.hideTabTooltip();
    // Fenêtre virtualisée de la grille : ses objets ne sont PAS dans dynamicObjs
    // (ils vont et viennent au fil du scroll) — les détruire explicitement, sinon
    // chaque refresh en laisserait un lot orphelin derrière lui.
    this.gridWindowDispose?.();
    this.gridWindowDispose = null;
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
    if (KB && this.keyZ) { this.keyZ.removeAllListeners(); KB.removeKey(this.keyZ); this.keyZ = undefined; }
    // Cancel any in-flight long-press timer to prevent stale callbacks
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.input.off('wheel');
    this.input.off('pointermove');
    // Le champ de recherche possède un <input> DOM dans <body> et un listener de
    // resize sur le Scale Manager — Phaser n'en sait rien : sans ce destroy(),
    // l'input survivrait à la fermeture de l'inventaire (invisible mais
    // focalisable, il avalerait les frappes du jeu).
    if (this.search) { this.search.destroy(); this.search = null; }
    // clearDynamic() calls closeConsumePopup() internally
    this.clearDynamic();
  }
}
