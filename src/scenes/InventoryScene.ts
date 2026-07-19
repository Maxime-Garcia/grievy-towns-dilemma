import { GameScene } from './GameScene';
import {
  PlayerState, Item, ItemType,
  RARITY_COLORS, InventorySlot,
} from '../types';
import { InventorySystem, InventoryCategory } from '../systems/InventorySystem';
import {
  UI, TYPE, LAYOUT, drawGlowPanel, drawCard, drawSlot, addUiFrame,
  drawDivider, addCloseButton, uiStyle, titleStyle, fitText, openScreenTransition,
  closeScreenTransition,
  drawSlotRarityTint,
} from '../utils/UITheme';
import { SearchField, matchesSearch } from '../utils/SearchField';
import { renderStatsSections } from '../utils/StatsPanel';
import {
  renderEquipmentPanel, renderPlayerSprite, equipRowY, EQ_SLOT, EQ_ORDER,
  type EquipSlotKey,
} from '../utils/EquipmentPanel';
import { renderItemDetailContent, DOUBLE_CLICK_MS } from '../utils/ItemDetailPanel';
import { itemTextureKey } from '../utils/ItemAssets';
import { t, localizeItem } from '../i18n';

// ── Layout constants ──────────────────────────────────────────────────────────
// Les LARGEURS de panneaux ne sont plus des constantes : elles sont dérivées de
// la largeur caméra dans create() (seule la grille du sac, 7 col × 48 px, est
// une contrainte rigide — cf. renderGrid).
const MARGIN     = 8;
const HEADER_H   = 40;    // titre d'écran en police Boss (18 px) + respiration
const FOOTER_H   = 20;
const GAP        = 6;
// EQ_SLOT importé de utils/EquipmentPanel (partagé avec RunBagScene).
// 48 → 40 (retour créateur 17/07 : grille du sac "trop dense", capsules à réduire
// pour mieux distinguer les bordures de rareté) + INV_GAP introduit pour de
// l'espace RÉEL entre chaque capsule (avant : 0px, les slots se touchaient).
// INV_STRIDE = la distance ENTRE deux origines de colonne/ligne (taille + espace) ;
// INV_SLOT reste la taille RÉELLEMENT dessinée d'une capsule. Ne jamais utiliser
// INV_SLOT pour du positionnement (col*INV_SLOT) : c'est exactement l'erreur qui
// faisait toucher les capsules avant cette passe.
const INV_SLOT   = 40;    // inventory slot size (dessin)
const INV_GAP    = 8;     // espace entre deux capsules
const INV_STRIDE = INV_SLOT + INV_GAP; // pas de positionnement col/row
const INV_COLS   = 7;     // inventory grid columns
// Largeur RÉELLE occupée par INV_COLS colonnes : N strides moins le dernier gap
// de fin de ligne (inutile après la dernière colonne).
const INV_GRID_W = INV_COLS * INV_STRIDE - INV_GAP;
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

// EquipSlotKey/EQ_ORDER/PAPERDOLL_POS partagés avec RunBagScene — importés de
// utils/EquipmentPanel (2 col × 5 rangées, casque/arme, plastron/cape, jambes/
// bague 1, bottes/bague 2, gants/amulette, capture créateur 18/07).

// Item types that have a direct equipment slot (used by performQuickAction + renderItemDetail)
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

  // Détection du double-clic sur le paperdoll (même modèle que RunBagScene,
  // retour créateur 19/07) : un second clic RAPPROCHÉ sur le MÊME slot déjà
  // équipé déséquipe directement, sans repasser par le bouton "Déséquiper" du
  // panneau de détail. `selectedItem` n'a pas d'origine (paperdoll vs sac) —
  // on retient donc directement la clé de slot du dernier clic paperdoll.
  private lastEquipDetailKey: EquipSlotKey | null = null;
  private lastEquipDetailAt = 0;

  // Même modèle pour la grille du SAC (remplace l'ancien tap-immédiat/appui-long,
  // retour créateur 19/07 : "je ne peux pas double clic pour équiper un objet" —
  // uniformisé sur clic simple = détail / double-clic rapproché = action, comme
  // le paperdoll et RunBagScene). Comparaison par IDENTITÉ d'item (pas de clé de
  // slot fixe ici, contrairement au paperdoll).
  private lastBagDetailItem: Item | null = null;
  private lastBagDetailAt = 0;

  private keyZ?: Phaser.Input.Keyboard.Key;

  /** Recherche textuelle du sac — créée dans create(), détruite dans shutdown().
   *  Hors de `dynamicObjs` : elle doit survivre aux refresh() (cf. BAG_SEARCH_H). */
  private search: SearchField | null = null;
  private searchQuery = '';
  // Onglet de filtrage actif du sac (D13) — reset à 'ALL' à chaque ouverture
  private bagFilter: BagFilter = 'ALL';
  // Tooltip transient du survol d'un onglet à icône (accessibilité : le glyphe
  // seul ne suffit pas) — détruit sur pointerout / refresh / shutdown.
  private tabTooltip: Phaser.GameObjects.Container | null = null;
  // Which paperdoll slot to flash after a successful tap-equip
  private lastFlashSlotKey: EquipSlotKey | null = null;

  // True dès que l'animation de FERMETURE (closeScreenTransition, ~170ms) est en
  // cours — ignore tout nouvel appel à close() tant qu'elle tourne (évite un
  // scene.stop() dupliqué si × est cliqué puis ESC pressé pendant le fondu).
  // Même patron que BestiaryScene/ArsenalScene.
  private closing = false;

  constructor() { super({ key: 'InventoryScene' }); }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  init(data?: { gameScene?: GameScene }) {
    if (!data?.gameScene) { this.scene.stop(); return; }
    this.gameScene   = data.gameScene;
    this.player      = data.gameScene.gameState.player;
    this.selectedItem = null;
    this.lastEquipDetailKey = null;
    this.lastEquipDetailAt  = 0;
    this.lastBagDetailItem  = null;
    this.lastBagDetailAt    = 0;
    this.bagFilter    = 'ALL';
    this.search       = null;
    this.searchQuery  = '';
    this.closing      = false;
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
    const bagW  = INV_GRID_W + 16;
    const sideW = W - (MARGIN + 2) * 2 - bagW - GAP * 2;
    const eqW   = Math.round(sideW * 0.42);
    const stW   = sideW - eqW;
    // ORDRE DES COLONNES (correction créateur 18/07) : SAC | ÉQUIPEMENT | STATS
    // — même ordre que RunBagScene 'view', cohérence inter-écrans.
    const bagX  = MARGIN + 2;
    const eqX   = bagX + bagW + GAP;
    const stX   = eqX + eqW + GAP;

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
      w: INV_GRID_W,
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
    // Z → action directe sur l'item actuellement sélectionné (équiper/consommer),
    // même chemin que le double-clic souris/tactile (performQuickAction, sans
    // popup de confirmation intermédiaire — uniformisé le 19/07, cf. HANDOFF.md).
    // Safe to use: GameScene.update() bails out early when menuOpen = true, so
    // the ZQSD movement poll never runs while the inventory is open. Pendant la
    // saisie dans le champ de recherche, SearchField stoppe la propagation des
    // touches : taper « zweihander » ne déclenche donc pas cette action.
    this.keyZ = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyZ.on('down', () => {
      if (this.selectedItem !== null) this.performQuickAction(this.selectedItem);
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
   * Échap : vide la recherche si elle contient du texte, sinon laisse l'appelant
   * fermer l'écran. Appelé par GameScene.escKey (unique propriétaire de l'ESC)
   * et par le champ de recherche quand il a le focus.
   * True = appui CONSOMMÉ, l'inventaire doit rester ouvert.
   */
  handleEscape(): boolean {
    return this.search?.clear() ?? false;
  }

  // ── Equipment paperdoll (2 col × 5 rangées + sprite central) ──────────────
  // Disposition de la capture créateur (18/07) — cf. PAPERDOLL_POS :
  //   casque   | arme
  //   plastron | cape
  //   jambes   | bague 1
  //   bottes   | bague 2
  //   gants    | amulette
  private renderEquipment() {
    const { x: PX, y: PY, w: PW, h: PH } = this.eqBounds;

    // Sprite du joueur + paperdoll (positions/slot vide) partagés avec
    // RunBagScene (utils/EquipmentPanel) — seul le rendu d'un slot OCCUPÉ reste
    // ici : cadre asset + teinte de rareté + interactivité (survol/clic/détail
    // + flash de confirmation tap-equip), propres à cet écran hors run.
    renderPlayerSprite(this, this.eqBounds, go => this.dynamicObjs.push(go));

    renderEquipmentPanel(this, this.eqBounds, this.player, go => this.dynamicObjs.push(go), {
      colInset: 14,
      renderOccupied: ({ sx, sy, key, item, rarHex }) => {
        // Slot arrondi moderne — bordure = couleur de rareté (règle §7.5),
        // fond teinté par la rareté (drawSlot).
        const bg = this.add.graphics();
        drawSlot(bg, sx, sy, EQ_SLOT, rarHex, { occupied: true });
        this.dynamicObjs.push(bg);

        // Cadre pixel art réel (Retro Inventory) par-dessus le fond. L'intérieur
        // du cadre est un gris OPAQUE : la teinte de rareté est reposée
        // PAR-DESSUS (drawSlotRarityTint), sinon le « fond coloré par rareté »
        // de la capture resterait invisible.
        const frame = addUiFrame(this, sx + EQ_SLOT / 2, sy + EQ_SLOT / 2, EQ_SLOT, EQ_SLOT, 'ui_slot_frame');
        if (frame) {
          this.dynamicObjs.push(frame);
          const tintG = this.add.graphics();
          drawSlotRarityTint(tintG, sx, sy, EQ_SLOT, rarHex);
          this.dynamicObjs.push(tintG);
        }

        // Anneau de rareté/survol au-dessus du cadre.
        const ring = this.add.graphics();
        const drawRing = (color: number) => {
          ring.clear();
          ring.lineStyle(2, color, 1);
          ring.strokeRoundedRect(sx, sy, EQ_SLOT, EQ_SLOT, 5);
        };
        drawRing(rarHex);
        this.dynamicObjs.push(ring);

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

        // Hit zone → détail — élargie de +4 px au-delà du visuel
        const hit = this.add.rectangle(
          sx + EQ_SLOT / 2, sy + EQ_SLOT / 2, EQ_SLOT + 8, EQ_SLOT + 8, 0x000000, 0,
        ).setInteractive({ useHandCursor: true });
        this.dynamicObjs.push(hit);
        // Survol : seul l'anneau est redessiné (clear + stroke) — fond et cadre
        // asset intacts, aucune commande de tracé ne s'empile.
        hit.on('pointerover', () => drawRing(0xffffff));
        hit.on('pointerout',  () => drawRing(rarHex));
        hit.on('pointerdown', () => {
          // Même modèle premier-clic/double-clic que RunBagScene (retour créateur
          // 19/07, étendu ici pour que le paperdoll hors run se comporte pareil) :
          // un second clic RAPPROCHÉ sur ce MÊME slot déséquipe directement, sans
          // repasser par le bouton "Déséquiper" du panneau de détail.
          // `selectedItem === item` en plus du timestamp : contrairement à
          // RunBagScene (dont `selectedDetail` est remis à null par TOUTE
          // fermeture/action), InventoryScene n'a pas ce garde-fou naturel — sans
          // cette vérification, fermer le détail (bouton Fermer/Vendre/Équiper un
          // autre item) puis recliquer ce même slot <350ms plus tard déséquipait
          // par erreur (cf. code-reviewer). Exiger que CE détail soit ENCORE
          // affiché élimine toute la classe de faux positifs sans avoir à traquer
          // chaque site qui remet selectedItem à null.
          const isRapidSecondClick = this.selectedItem === item
            && this.lastEquipDetailKey === key
            && (this.time.now - this.lastEquipDetailAt) <= DOUBLE_CLICK_MS;

          if (isRapidSecondClick) {
            this.performUnequip(key, sx + EQ_SLOT / 2, sy - 14);
            return;
          }

          this.lastEquipDetailKey = key;
          this.lastEquipDetailAt = this.time.now;
          this.showDetail(item);
        });

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
      },
    });

    // ── Identité du personnage sous le paperdoll ──────────────────────────
    const infoY = equipRowY(this.eqBounds, 4) + EQ_SLOT + 16;
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

    // Sections OFFENSE / DÉFENSE / UTILITAIRE — rendu PARTAGÉ avec RunBagScene
    // (utils/StatsPanel.ts) : la capture de référence du créateur (18/07) exige
    // exactement le même panneau dans les deux inventaires. Toutes les valeurs
    // viennent de StatsSystem.computeAll (source de vérité) — voir le composant.
    renderStatsSections(this, this.player, PX, PW, PY + 36, go => this.dynamicObjs.push(go));

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

    // Contenu (en-tête, rareté, nom, résonance, stats, passif, description)
    // partagé avec RunBagScene — cf. utils/ItemDetailPanel.ts. Seuls les
    // boutons d'action ci-dessous restent propres à cette scène.
    renderItemDetailContent(this, item, this.stBounds, go => this.dynamicObjs.push(go), () => {
      this.selectedItem = null;
      this.refresh();
    });

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
        // this.closing : l'écran est en train de se dissoudre (closeScreenTransition,
        // ~170ms) — un tap résiduel ne doit plus équiper/déséquiper/consommer/jeter.
        .on('pointerdown', () => { if (!this.closing) onClick(); });
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
          this.performUnequip(equippedSlot, BTN_X + BTN_W / 2, rowY - 14);
        });
      } else {
        addBtn(t('inventory.equip_hint'), UI.TXT_GREEN, () => {
          this.performQuickAction(item);
        });
      }
    }
    if (isUse) {
      // performQuickAction (direct, sans popup intermédiaire) — même chemin que
      // le double-clic et la touche Z, uniformisé le 19/07 (auparavant : routait
      // vers showActionConfirmPopup, une confirmation redondante avec CE bouton
      // qui EST déjà la confirmation).
      addBtn(t('inventory.use_hint'), UI.TXT_GREEN, () => {
        this.performQuickAction(item);
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

  /** Déséquipe un slot vers la banque — code partagé entre le bouton
   *  "Déséquiper" du panneau de détail et le double-clic direct sur le
   *  paperdoll (cf. renderGrid, callback renderOccupied). */
  private performUnequip(slot: EquipSlotKey, toastX: number, toastY: number): void {
    // unequip renvoie false si le sac est plein — improbable mais pas impossible
    // avant que le sac de run à 20 emplacements arrive avec le RunSystem (le vrai
    // fix, objet qui tombe au sol, est documenté et délibérément reporté à ce
    // chantier-là, cf. ROGUELITE_POC.md). En attendant, ne pas échouer
    // SILENCIEUSEMENT — le joueur doit comprendre pourquoi rien ne s'est passé
    // plutôt que de croire le bouton/double-clic cassé.
    if (InventorySystem.unequip(this.player, slot)) {
      this.selectedItem = null;
      this.refresh();
    } else {
      // PAS this.gameScene.events.emit('show_notification', ...) : InventoryScene
      // se rend au-dessus de UIScene (ordre fixe dans main.ts), son overlay
      // 0.88 d'opacité rendrait ce toast invisible — le "ne pas échouer
      // silencieusement" resterait silencieux. Toast local, garanti visible.
      this.showLocalToast(t('inventory.unequip_bag_full'), toastX, toastY);
    }
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
    this.renderBagTabs(GRID_X, PY + TITLE_H, INV_GRID_W);

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
      cursorY = itemsY + rows * INV_STRIDE + GROUP_GAP;
      return { category: g.category, slots: g.slots, headerY, itemsY };
    });
    const contentH = Math.max(0, cursorY - GROUP_GAP);
    // Reprend la position préservée, clampée au contenu courant (le sac a pu
    // rétrécir depuis le dernier rendu — un équipement retiré de la grille).
    let   scrollY  = Phaser.Math.Clamp(this.bagScrollY, 0, Math.max(0, contentH - VISIBLE_H));

    // Geometry mask clips the scrollable grid area
    const maskGfx = this.make.graphics({ x: 0, y: 0 });
    maskGfx.fillStyle(0xffffff);
    maskGfx.fillRect(GRID_X - 2, GRID_Y, INV_GRID_W + 4, VISIBLE_H);
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
    const RENDER_BUFFER = INV_STRIDE * 2; // 2 rangées de marge de part et d'autre

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

    const gridW = INV_GRID_W;

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
        const firstRow  = Math.max(0, Math.floor((top - layout.itemsY) / INV_STRIDE));
        const lastRow   = Math.min(rows - 1, Math.floor((bottom - layout.itemsY) / INV_STRIDE));
        for (let row = firstRow; row <= lastRow; row++) {
          for (let col = 0; col < INV_COLS; col++) {
            const idx = row * INV_COLS + col;
            const slot = layout.slots[idx];
            if (!slot) break;
            this.renderInventorySlot(
              slot,
              GRID_X + col * INV_STRIDE,
              GRID_Y + layout.itemsY + row * INV_STRIDE,
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

      const gridRight = GRID_X + INV_GRID_W + 4;
      this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
        if (!p.isDown) return;
        // Seuls les drags démarrés dans la zone de la grille scrollent
        if (p.downX < GRID_X - 4 || p.downX > gridRight) return;
        if (p.downY < GRID_Y || p.downY > GRID_Y + VISIBLE_H) return;
        const dy = p.y - p.prevPosition.y;
        if (dy === 0) return;
        applyScroll(scrollY - dy);
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
    if (frame) {
      reg(frame, midY);
      // Fond teinté par la rareté PAR-DESSUS le cadre asset (intérieur gris
      // opaque — il masquerait la teinte que drawSlot pose dessous). Règle
      // « bordure + fond colorés par rareté » de la capture créateur (18/07).
      const tintG = this.add.graphics();
      drawSlotRarityTint(tintG, sx, 0, INV_SLOT - 2, rarHex);
      tintG.setY(topY);
      reg(tintG, topY);
    }

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

    // Icon (try texture, fallback to colored square) — taille proportionnelle à
    // INV_SLOT (même ratio ~0,67 qu'avant : 32/48), pas figée à 32px : sinon une
    // capsule réduite laisserait une icône proportionnellement trop grande, sans
    // la marge qui aide justement à distinguer l'anneau de rareté autour d'elle.
    const ICON_DISPLAY_SIZE = Math.round(INV_SLOT * 0.65);
    const iconKey = this.resolveIcon(slot.item);
    if (iconKey) {
      try {
        const img = this.add.image(sx + INV_SLOT / 2 - 1, midY, iconKey).setDisplaySize(ICON_DISPLAY_SIZE, ICON_DISPLAY_SIZE);
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

    // Clic simple → panneau de détail (comme le paperdoll/RunBagScene). Second
    // clic RAPPROCHÉ (≤ DOUBLE_CLICK_MS) sur le MÊME item → action directe
    // (équiper/consommer, cf. performQuickAction), retour créateur 19/07 :
    // "je ne peux pas double clic pour équiper un objet" — uniformisé sur le
    // modèle sac/paperdoll plutôt que l'ancien tap-immédiat/appui-long.
    // pointerup (pas pointerdown) + vérif de distance : un drag de scroll qui
    // démarre sur un slot ne doit déclencher NI le détail NI l'action.
    hit.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (p.getDistance() > 10) return; // scroll tactile, pas un clic

      const isRapidSecondClick = this.selectedItem === slot.item
        && this.lastBagDetailItem === slot.item
        && (this.time.now - this.lastBagDetailAt) <= DOUBLE_CLICK_MS;

      if (isRapidSecondClick) {
        this.performQuickAction(slot.item);
        return;
      }

      this.lastBagDetailItem = slot.item;
      this.lastBagDetailAt = this.time.now;
      this.showDetail(slot.item);
    });
    // Survol : seul l'anneau est redessiné (clear + stroke) — le fond et le
    // cadre asset restent intacts, aucune commande de tracé ne s'empile.
    hit.on('pointerover', () => drawRing(0xffffff));
    hit.on('pointerout',  () => drawRing(rarHex));
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

  /** Action directe (équiper/consommer) SANS popup de confirmation intermédiaire
   *  — même principe que RunBagScene.onEquipClicked/consumeItem. Point d'entrée
   *  unique appelé par : le second clic RAPPROCHÉ sur un slot du sac déjà en
   *  détail (cf. renderInventorySlot), la touche Z sur l'item sélectionné, et
   *  les boutons Équiper/Utiliser du panneau de détail docké (uniformisé le
   *  19/07 — l'ancien showActionConfirmPopup, seul point qui ouvrait encore un
   *  popup séparé, a été retiré entièrement). Matériaux/objets-clés : aucune
   *  action directe définie, comme dans RunBagScene. */
  private performQuickAction(item: Item): void {
    if (item.type === ItemType.CONSUMABLE) {
      InventorySystem.useConsumable(this.player, item, this.gameScene.getPlayerModifiers());
    } else if (EQUIP_TYPES.includes(item.type)) {
      this.lastFlashSlotKey = this.getSlotKeyForItem(item);
      InventorySystem.equip(this.player, item);
    } else {
      return;
    }
    this.selectedItem = null;
    this.refresh();
  }

  // ── State transitions ──────────────────────────────────────────────────────

  private showDetail(item: Item): void {
    this.selectedItem = item;
    this.refresh();
  }

  // Public : GameScene (touche I, ESC après handleEscape, action mobile) l'appelle
  // directement pour fermer avec l'animation symétrique de l'ouverture
  // (closeScreenTransition) au lieu d'un scene.stop() brut — même patron que
  // BestiaryScene.close(). Le setPaused(false) qui vivait chez les appelants est
  // reporté dans onClosed : le jeu ne reprend qu'une fois l'écran dissous.
  public close(): void {
    if (this.closing) return;
    this.closing = true;
    closeScreenTransition(this, () => {
      this.scene.stop();
      this.gameScene.setPaused(false);
    });
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
    this.input.off('wheel');
    this.input.off('pointermove');
    // Le champ de recherche possède un <input> DOM dans <body> et un listener de
    // resize sur le Scale Manager — Phaser n'en sait rien : sans ce destroy(),
    // l'input survivrait à la fermeture de l'inventaire (invisible mais
    // focalisable, il avalerait les frappes du jeu).
    if (this.search) { this.search.destroy(); this.search = null; }
    this.clearDynamic();
  }
}
