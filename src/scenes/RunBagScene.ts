import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { Consumable, ElementType, Item, ItemType, RARITY_COLORS, RunBagSlot, RunState } from '../types';
import { LootSystem } from '../systems/LootSystem';
import { RunSystem } from '../systems/RunSystem';
import { RunBagSystem } from '../systems/RunBagSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { itemTextureKey } from '../utils/ItemAssets';
import {
  UI, TYPE, LAYOUT, drawGlowPanel, drawCard, drawSlot, drawDivider, uiStyle, titleStyle,
  addCloseButton, openScreenTransition, closeScreenTransition, fitText, strokeDashedRect,
} from '../utils/UITheme';
import { SearchField, matchesSearch } from '../utils/SearchField';
import { renderStatsSections } from '../utils/StatsPanel';
import { renderEquipmentPanel, renderPlayerSprite, EQ_SLOT, type EquipSlotKey } from '../utils/EquipmentPanel';
import { renderItemDetailContent, addDetailActionButton, DETAIL_BTN_H, DETAIL_BTN_GAP } from '../utils/ItemDetailPanel';
import { t, localizeItem } from '../i18n';

// Écran de sac de run (RunSystem, docs/design/ROGUELITE_POC.md §3) — UNE seule
// scène pour les trois moments qui utilisent la même mécanique de fond (choisir
// quoi emporter/garder/consommer/équiper dans un nombre fixe d'emplacements) :
//
// 'pack'    (avant de descendre) : choisir 3-4 consommables dans la banque.
// 'view'    (touche Inventaire pendant une run) : consulter/consommer/équiper le
//            sac de run en cours — remplace InventoryScene (la banque de GT) tant
//            qu'une run est active, cf. GameScene.inventoryKey.
// 'extract' (après le boss) : arbitrer les emplacements sûrs du sac,
//            puis S'exfiltrer ou Continuer.
//
// Depuis la capture de référence du créateur (18/07), 'view' et 'extract'
// partagent une mise en page PLEIN ÉCRAN en trois colonnes, dans cet ordre
// (correction créateur du même jour) :
//   SAC (gauche : slots sûrs dorés + onglets + recherche + grille ordinaire)
//   ÉQUIPEMENT (milieu : 2 col × 5 slots + sprite du joueur + nom/niveau)
//   STATISTIQUES (droite : OFFENSE/DÉFENSE/UTILITAIRE — rendu partagé
//   utils/StatsPanel.ts, exactement le même panneau que InventoryScene).
//
// Patron overlay identique à PityScene/InventoryScene (scene.launch + setPaused +
// openScreenTransition/closeScreenTransition + close() guardé).

const MAX_LOADOUT = 4;
const ROW_H = 40;
const SLOT = 56;      // slots du mode 'pack' (loadout de consommables)
const SLOT_GAP = 10;

// ── Layout plein écran 'view'/'extract' (mêmes gabarits que InventoryScene) ──
const MARGIN   = 8;
const HEADER_H = 40;
const FOOTER_H = 20;
const GAP      = 6;
// EQ_SLOT importé de utils/EquipmentPanel (partagé avec InventoryScene).
const RB_SLOT  = 48;   // slot du sac de run
const RB_GAP   = 8;
const RB_STRIDE = RB_SLOT + RB_GAP;
const RB_COLS  = 5;    // 5 colonnes (capture créateur : rangée sûre + grille 5×3)
const RB_GRID_W = RB_COLS * RB_STRIDE - RB_GAP;
const BAG_TITLE_H = 22;
const RB_TABS_H   = 34;
const RB_SEARCH_H = LAYOUT.TOUCH_MIN;

// Paperdoll 2 colonnes × 5 rangées (casque/arme, plastron/cape, jambes/bague 1,
// bottes/bague 2, gants/amulette) — disposition + ordre partagés avec
// InventoryScene via utils/EquipmentPanel (EQ_ORDER/PAPERDOLL_POS).

/** Types équipables directement depuis le sac de run — tout le reste (consommables,
 *  matériaux, objets-clés) passe par consumeItem()/le réarrangement sûr↔ordinaire. */
const EQUIPPABLE_TYPES = new Set<ItemType>([
  ItemType.WEAPON, ItemType.HELM, ItemType.CHEST, ItemType.LEGS, ItemType.BOOTS,
  ItemType.GLOVES, ItemType.CAPE, ItemType.RING, ItemType.AMULET,
]);

// ── Onglets de filtrage de la grille ordinaire (capture créateur 18/07) ──────
// ICÔNES + tooltip, PAS de labels texte : la colonne fait 272 px utiles, soit
// 51 px par onglet — même les libellés courts de la capture (« ARMES »,
// « DIVERS ») y sortaient tronqués en « AR… »/« DIV… ». C'est très exactement
// le problème déjà tranché sur les onglets du sac d'InventoryScene (D13) :
// mêmes glyphes `bagtab_*` bakés au boot, `labelKey` = tooltip au survol +
// fallback texte si la sheet d'icônes manque — cohérence entre les deux façons
// de filtrer le même genre de sac.
// Le filtre + la recherche ESTOMPENT les slots non concernés (alpha réduit) au
// lieu de les masquer : le sac de run est POSITIONNEL (échanges sûr↔ordinaire
// par index), retirer des cases casserait la lecture spatiale et les échanges
// en cours.
type RunBagFilter = 'ALL' | 'EQUIP' | 'CONSUMABLE' | 'MATERIAL' | 'MISC';
const RUN_BAG_TABS: ReadonlyArray<{ id: RunBagFilter; labelKey: string; icon: string; types: ReadonlySet<ItemType> | null }> = [
  { id: 'ALL',        labelKey: 'inventory.tab_all',        icon: 'bagtab_all',        types: null },
  { id: 'EQUIP',      labelKey: 'inventory.tab_equip',      icon: 'bagtab_equip',      types: EQUIPPABLE_TYPES },
  { id: 'CONSUMABLE', labelKey: 'inventory.tab_consumable', icon: 'bagtab_consumable', types: new Set([ItemType.CONSUMABLE]) },
  { id: 'MATERIAL',   labelKey: 'inventory.tab_material',   icon: 'bagtab_material',   types: new Set([ItemType.MATERIAL]) },
  { id: 'MISC',       labelKey: 'inventory.tab_misc',       icon: 'bagtab_misc',       types: new Set([ItemType.KEY_ITEM, ItemType.SKIN]) },
];

type RunBagMode = 'pack' | 'view' | 'extract';

interface PanelBounds { x: number; y: number; w: number; h: number }

/** D'où vient l'item affiché dans le panneau de détail — détermine les boutons
 *  d'action proposés par renderItemDetail (Équiper/Consommer/Déplacer/Jeter
 *  pour un item du sac, Déséquiper pour un item du paperdoll). */
type DetailOrigin =
  | { kind: 'equip'; slotKey: EquipSlotKey }
  | { kind: 'bag'; bagKind: 'safe' | 'ordinary'; index: number };

export class RunBagScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private mode!: RunBagMode;
  private closing = false;
  private dynamicObjs: Phaser.GameObjects.GameObject[] = [];

  // mode 'pack' — sélection en cours, retirée de la banque seulement à la confirmation.
  private loadout: (Item | null)[] = [];

  // mode 'extract'/'view' — slot actuellement sélectionné pour un échange.
  private selected: { kind: 'safe' | 'ordinary'; index: number } | null = null;

  // Item actuellement affiché dans le panneau STATISTIQUES (remplacé par le
  // détail le temps de la consultation) — même patron qu'InventoryScene
  // .selectedItem, avec en plus l'origine (paperdoll ou sac) pour savoir quels
  // boutons d'action proposer (cf. renderItemDetail).
  private selectedDetail: { item: Item; origin: DetailOrigin } | null = null;

  // Panneaux du layout plein écran 'view'/'extract' (calculés dans createBagStatics)
  private bagB!: PanelBounds;
  private eqB!: PanelBounds;
  private stB!: PanelBounds;

  // Onglet actif + recherche de la grille ordinaire ('view'/'extract').
  // Le champ est créé UNE FOIS dans createBagStatics() et survit aux refresh()
  // (le recréer détruirait le <input> DOM qui a le focus — cf. InventoryScene).
  private bagFilter: RunBagFilter = 'ALL';
  private search: SearchField | null = null;
  private searchQuery = '';
  // Tooltip texte des onglets à icônes (un seul à la fois — cf. InventoryScene).
  private tabTooltip: Phaser.GameObjects.Container | null = null;

  constructor() { super({ key: 'RunBagScene' }); }

  /** Lu par GameScene (touche Inventaire) pour décider si un re-toggle peut
   *  fermer cette scène : 'view' est un simple consultatif (peut se fermer),
   *  'pack'/'extract' sont des choix BLOQUANTS (packing avant descente, boss
   *  vaincu) — les fermer via une touche annexe perdrait la décision en cours
   *  (trouvé en revue de code : la touche Inventaire fermait l'écran
   *  d'extraction post-boss sans que le joueur ait choisi Exfiltrer/Continuer,
   *  softlock permanent — aucun autre point du code ne rouvre cet écran). */
  public get currentMode(): RunBagMode { return this.mode; }

  /**
   * Échap : si le panneau de détail d'un item est ouvert, le referme d'abord
   * (true = appui CONSOMMÉ, la scène reste ouverte) — sinon laisse l'appelant
   * fermer l'écran (false). Même patron qu'InventoryScene.handleEscape,
   * appelé par GameScene.escKey (propriétaire unique de l'ESC des overlays).
   */
  public handleEscape(): boolean {
    if (this.selectedDetail) { this.selectedDetail = null; this.refresh(); return true; }
    return false;
  }

  init(data: { gameScene: GameScene; mode: RunBagMode }) {
    this.gameScene = data.gameScene;
    this.mode = data.mode;
    this.closing = false;
    this.dynamicObjs = [];
    this.loadout = new Array(MAX_LOADOUT).fill(null);
    this.selected = null;
    this.selectedDetail = null;
    this.bagFilter = 'ALL';
    this.search = null;
    this.searchQuery = '';
    this.tabTooltip = null;
  }

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    openScreenTransition(this);
    if (this.mode !== 'pack') this.createBagStatics();
    this.refresh();
  }

  private refresh(): void {
    this.clearDynamic();
    if (this.mode === 'pack') this.renderPack();
    else this.renderBagGrid();
  }

  private clearDynamic(): void {
    // Un refresh() peut survenir tooltip affiché (le hit survolé est détruit
    // sans que pointerout ne parte) — jamais de tooltip orphelin.
    this.hideTabTooltip();
    for (const go of this.dynamicObjs) if (go.active) go.destroy();
    this.dynamicObjs = [];
  }

  private track<T extends Phaser.GameObjects.GameObject>(go: T): T {
    this.dynamicObjs.push(go);
    return go;
  }

  /** Même chaîne de repli que InventoryScene.resolveIcon : icône spécifique de
   *  l'objet → sprite de type d'arme → icône générique de catégorie → null
   *  (l'appelant dessine alors un carré coloré par rareté). */
  private resolveIcon(item: Item): string | null {
    if (this.textures.exists(item.icon)) return item.icon;
    if ('weaponType' in item && item.weaponType) {
      const key = `wpn_${String(item.weaponType).toLowerCase()}`;
      if (this.textures.exists(key)) return key;
    }
    const typeKey = itemTextureKey(item.id, item.type, k => this.textures.exists(k));
    if (typeKey !== 'item_type_generic' && this.textures.exists(typeKey)) return typeKey;
    if (this.textures.exists('item_type_generic')) return 'item_type_generic';
    return null;
  }

  /** Dessine l'icône d'un objet centrée sur (cx, cy), ou un carré coloré par
   *  rareté si aucune texture ne se résout — jamais de texte qui pourrait
   *  déborder. Renvoie l'objet créé (pour l'estompage des slots filtrés). */
  private renderItemIcon(item: Item, cx: number, cy: number, size: number):
    Phaser.GameObjects.Image | Phaser.GameObjects.Graphics | null {
    const iconKey = this.resolveIcon(item);
    const rarHex = parseInt((RARITY_COLORS[item.rarity] ?? '#888888').slice(1), 16);
    if (iconKey) {
      try {
        return this.track(this.add.image(cx, cy, iconKey).setDisplaySize(size, size));
      } catch { /* fallback ci-dessous */ }
    }
    const sq = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
    sq.fillStyle(rarHex, 0.55);
    sq.fillRoundedRect(cx - size / 2, cy - size / 2, size, size, 3);
    return sq;
  }

  // ── MODE PACK ────────────────────────────────────────────────

  private renderPack() {
    const { width: W, height: H } = this.cameras.main;
    const player = this.gameScene.gameState.player;

    this.track(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88));
    const PANEL_W = 640, PANEL_H = 460;
    const px = (W - PANEL_W) / 2, py = (H - PANEL_H) / 2;
    const frame = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
    drawGlowPanel(frame, px, py, PANEL_W, PANEL_H, UI.ACCENT_ARCANE, UI.BG_DEEP, 8, 0.95);

    this.track(this.add.text(W / 2, py + 16, 'PRÉPARER LA DESCENTE', titleStyle(UI.TXT_GOLD, { stroke: true })).setOrigin(0.5, 0));
    const closeBtn = addCloseButton(this, px + PANEL_W - 24, py + 24, () => this.close());
    this.track(closeBtn.glyph); this.track(closeBtn.hit);

    // Colonne gauche — consommables de la banque, non déjà pris dans le sac emporté.
    const listX = px + 24, listY = py + 76, listW = 300, listH = PANEL_H - 150;
    this.track(this.add.text(listX, listY - 20, 'Banque — consommables', uiStyle(TYPE.LABEL, UI.TXT_CYAN, { wordWrapWidth: listW })).setOrigin(0, 0));

    const consumables = player.inventory.filter(s => s.item.type === ItemType.CONSUMABLE);
    let rowY = listY;
    if (consumables.length === 0) {
      this.track(this.add.text(listX, rowY + 8, 'Aucun consommable dans la banque.',
        uiStyle(TYPE.SMALL, UI.TXT_MUTED, { wordWrapWidth: listW })).setOrigin(0, 0));
    }
    for (const slot of consumables) {
      const alreadyTaken = this.loadout.filter(l => l?.id === slot.item.id).length;
      const remaining = slot.quantity - alreadyTaken;
      if (remaining <= 0) continue;
      if (rowY + ROW_H > listY + listH) break; // pas de scroll pour cette tranche — peu de types de consommables en jeu aujourd'hui

      const rowG = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
      const color = parseInt((RARITY_COLORS[slot.item.rarity] ?? '#888888').slice(1), 16);
      drawCard(rowG, listX, rowY, listW, ROW_H - 6, { accent: color, radius: 4 });
      this.renderItemIcon(slot.item, listX + 20, rowY + (ROW_H - 6) / 2, 26);
      const nameStyle = uiStyle(TYPE.BODY, UI.TXT_PARCHMENT);
      const label = fitText(this, `${slot.item.name}  ×${remaining}`, nameStyle, listW - 48);
      this.track(this.add.text(listX + 40, rowY + (ROW_H - 6) / 2, label, nameStyle).setOrigin(0, 0.5));
      const hit = this.track(this.add.rectangle(listX + listW / 2, rowY + (ROW_H - 6) / 2, listW, ROW_H - 6, 0, 0)
        .setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Rectangle;
      hit.on('pointerdown', () => {
        if (this.addToLoadout(slot.item)) this.refresh();
      });
      rowY += ROW_H;
    }

    // Colonne droite — sac emporté (MAX_LOADOUT slots).
    const slotsColW = SLOT * 2 + SLOT_GAP;
    const slotsX = px + PANEL_W - 24 - slotsColW;
    const slotsY = py + 84;
    this.track(this.add.text(slotsX + slotsColW / 2, slotsY - 24, `Sac emporté\n(${MAX_LOADOUT} max)`,
      uiStyle(TYPE.SMALL, UI.TXT_CYAN, { align: 'center', wordWrapWidth: slotsColW + 40 })).setOrigin(0.5, 1));
    for (let i = 0; i < MAX_LOADOUT; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const sx = slotsX + col * (SLOT + SLOT_GAP);
      const sy = slotsY + row * (SLOT + SLOT_GAP);
      const item = this.loadout[i];
      const g = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
      const color = item ? parseInt((RARITY_COLORS[item.rarity] ?? '#888888').slice(1), 16) : UI.SLOT_BORDER;
      drawSlot(g, sx, sy, SLOT, color, { occupied: !!item });
      if (item) this.renderItemIcon(item, sx + SLOT / 2, sy + SLOT / 2, Math.round(SLOT * 0.65));
      const hit = this.track(this.add.rectangle(sx + SLOT / 2, sy + SLOT / 2, SLOT, SLOT, 0, 0)
        .setInteractive({ useHandCursor: !!item })) as Phaser.GameObjects.Rectangle;
      hit.on('pointerdown', () => {
        if (this.loadout[i]) { this.loadout[i] = null; this.refresh(); }
      });
    }

    // Bouton Descendre
    const btnY = py + PANEL_H - 36;
    const btnG = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
    drawCard(btnG, W / 2 - 100, btnY - 18, 200, 36, { accent: parseInt(UI.TXT_GOLD.slice(1), 16), radius: 6 });
    this.track(this.add.text(W / 2, btnY, 'DESCENDRE', uiStyle(TYPE.BODY, UI.TXT_GOLD, { bold: true })).setOrigin(0.5));
    const btnHit = this.track(this.add.rectangle(W / 2, btnY, 200, 36, 0, 0)
      .setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Rectangle;
    btnHit.on('pointerdown', () => this.confirmDescend());
  }

  /** Renvoie false (et laisse la banque intacte) si le sac emporté est déjà plein. */
  private addToLoadout(item: Item): boolean {
    const freeIdx = this.loadout.findIndex(l => l === null);
    if (freeIdx === -1) {
      this.gameScene.events.emit('show_notification', 'Sac emporté plein (4 max)');
      return false;
    }
    this.loadout[freeIdx] = item;
    return true;
  }

  private confirmDescend() {
    // closeScreenTransition() ne désactive pas l'input pendant son animation (~170ms) —
    // sans cette garde, un double-clic rapide re-déduit les consommables choisis de
    // la banque une seconde fois (trouvé en revue de code).
    if (this.closing) return;
    const player = this.gameScene.gameState.player;
    const chosen = this.loadout.filter((i): i is Item => i !== null);
    // Retire réellement les consommables choisis de la banque — jusqu'ici ils n'ont
    // fait qu'être RÉSERVÉS visuellement (cf. addToLoadout), la banque n'a pas bougé.
    for (const item of chosen) {
      LootSystem.removeFromInventory(player, item.id, 1);
    }
    // Biome pilote unique de cette tranche (docs/design/ROGUELITE_POC.md — "UNE
    // seule zone, un seul élément" avant généralisation) : Feu/Ignis Reach.
    const run = RunSystem.startRun(player, ElementType.FIRE, chosen);
    this.gameScene.gameState.run = run;
    this.close();
    this.gameScene.travelToZone('ignis_reach', 0, 0);
  }

  // ── MODES VIEW / EXTRACT — layout plein écran 3 colonnes ─────
  //
  // Partie STATIQUE (une fois, dans create) : overlay, cadre, titre, fonds et
  // titres des trois panneaux, sprite du joueur, champ de recherche, boutons
  // Exfiltrer/Continuer (extract). Partie DYNAMIQUE (refresh) : slots
  // d'équipement, sections de stats, onglets, slots du sac, compteurs.

  private createBagStatics(): void {
    const { width: W, height: H } = this.cameras.main;
    const isExtract = this.mode === 'extract';

    const CONT_Y = HEADER_H + 4;
    const CONT_H = H - CONT_Y - FOOTER_H - MARGIN;

    // Largeurs dérivées de l'écran — seule la grille du sac (5 col × 48 px) est
    // une contrainte rigide ; équipement et stats se partagent le reste.
    // ORDRE DES COLONNES (correction créateur 18/07) : SAC | ÉQUIPEMENT | STATS.
    const bagW = RB_GRID_W + 16;
    const sideW = W - (MARGIN + 2) * 2 - bagW - GAP * 2;
    const eqW = Math.round(sideW * 0.42);
    const stW = sideW - eqW;
    const bagX = MARGIN + 2;
    const eqX = bagX + bagW + GAP;
    const stX = eqX + eqW + GAP;

    this.bagB = { x: bagX, y: CONT_Y, w: bagW, h: CONT_H };
    this.eqB  = { x: eqX,  y: CONT_Y, w: eqW,  h: CONT_H };
    this.stB  = { x: stX,  y: CONT_Y, w: stW,  h: CONT_H };

    // Overlay + cadre externe (mêmes valeurs que InventoryScene : 0.88 / arcane)
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);
    const frameGfx = this.add.graphics();
    drawGlowPanel(frameGfx, MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2,
      isExtract ? parseInt(UI.TXT_GOLD.slice(1), 16) : UI.ACCENT_ARCANE, UI.BG_DEEP, 10, 0.92);

    // Titre d'écran — 'view' EST l'inventaire pendant une run (capture :
    // fenêtre « INVENTAIRE ») ; 'extract' garde son titre de moment fort.
    this.add.text(W / 2, MARGIN + 6, isExtract ? 'BOSS VAINCU' : t('inventory.title'),
      titleStyle(UI.TXT_GOLD, { stroke: true })).setOrigin(0.5, 0);
    const sepGfx = this.add.graphics();
    drawDivider(sepGfx, MARGIN + 4, HEADER_H, W - (MARGIN + 4) * 2, UI.ACCENT_ARCANE, 0.35);

    if (!isExtract) {
      addCloseButton(this, W - MARGIN - 20, MARGIN + 16, () => this.close());
      // Hint de fermeture (footer) — même libellé que InventoryScene ([I] Fermer)
      this.add.text(W / 2, H - MARGIN - 4, t('inventory.close'), uiStyle(9, UI.TXT_HINT))
        .setOrigin(0.5, 1)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.close());
    }

    // Fonds des trois panneaux
    for (const b of [this.bagB, this.eqB, this.stB]) {
      const g = this.add.graphics();
      drawGlowPanel(g, b.x, b.y, b.w, b.h, UI.ACCENT_ARCANE, UI.BG_MID, 8, 0.55);
    }

    // Titres des panneaux (cyan = structure, cf. guidelines §6.2). Le titre
    // STATISTIQUES n'est PAS ici : il devient dynamique (renderBagGrid), pour
    // laisser la place au titre "DÉTAIL" du popup d'item quand un item est
    // sélectionné — même patron qu'InventoryScene.renderStats/renderItemDetail.
    this.add.text(this.bagB.x + this.bagB.w / 2, this.bagB.y + 4, t('inventory.bag'),
      uiStyle(TYPE.BODY, UI.TXT_CYAN, { bold: true })).setOrigin(0.5, 0);
    this.add.text(this.eqB.x + this.eqB.w / 2, this.eqB.y + 6, t('inventory.equipment'),
      uiStyle(TYPE.BODY, UI.TXT_CYAN, { bold: true })).setOrigin(0.5, 0);
    const titleSep = this.add.graphics();
    drawDivider(titleSep, this.eqB.x + 10, this.eqB.y + 26, this.eqB.w - 20, UI.ACCENT_ARCANE, 0.22);

    // Sprite du joueur entre les deux colonnes d'équipement — partagé avec
    // InventoryScene (utils/EquipmentPanel.renderPlayerSprite). Statique : posé
    // une seule fois ici (comme le reste de createBagStatics, aucun de ces
    // objets n'est suivi dans un tableau — nettoyage via l'arrêt natif de la
    // scène, jamais dans refresh()/renderBagGrid()).
    renderPlayerSprite(this, this.eqB, () => {});

    // Champ de recherche du sac — créé UNE FOIS (jamais dans refresh()). Sa
    // position dépend du nombre de rangées sûres : même calcul que le rendu
    // dynamique (cf. bagLayoutYs), sinon le champ chevaucherait la grille.
    const safeCount = this.gameScene.gameState.run?.safeBag.length ?? RB_COLS;
    this.search = new SearchField(this, {
      x: this.bagB.x + 8,
      y: this.bagLayoutYs(safeCount).searchY,
      w: RB_GRID_W,
      h: RB_SEARCH_H,
      placeholder: t('search.placeholder_bag'),
      // Même raison que InventoryScene : la touche Inventaire ouvre ET ferme cet
      // écran — un champ auto-focalisé avalerait le `I` de fermeture.
      autoFocus: false,
      domId: 'runbag',
      onChange: (q) => {
        this.searchQuery = q;
        this.refresh(); // le champ n'est PAS dans dynamicObjs, il survit
      },
      // Échap champ vide + focalisé : 'view' se ferme ; 'pack'/'extract' sont
      // bloquants (cf. currentMode), Échap n'y ferme rien.
      onEscape: () => { if (this.mode === 'view') this.close(); },
    });

    // Boutons de choix post-boss — statiques (leurs handlers sont guardés par
    // this.closing) ; en bas du panneau de droite = zone de pouce.
    if (isExtract) {
      const btnW = 170, btnH = 44, btnGap = 12;
      const cxPanel = this.stB.x + this.stB.w / 2;
      const btnY = this.stB.y + this.stB.h - 14 - btnH / 2;
      this.renderChoiceButton(cxPanel - (btnW + btnGap) / 2, btnY, btnW, btnH, "S'EXFILTRER", UI.TXT_GOLD, () => this.confirmExfiltrate());
      this.renderChoiceButton(cxPanel + (btnW + btnGap) / 2, btnY, btnW, btnH, 'CONTINUER', UI.TXT_RED, () => this.confirmContinue());
    }
  }

  private renderBagGrid() {
    const run = this.gameScene.gameState.run;
    if (!run) { this.close(); return; }

    this.renderEquipmentColumn();
    // Panneau de droite : détail d'un item sélectionné (paperdoll ou sac) si
    // présent, sinon les stats — même dispatch qu'InventoryScene.renderCenter.
    if (this.selectedDetail) {
      this.renderItemDetail(this.selectedDetail);
    } else {
      this.renderStatsColumn();
    }
    this.renderBagColumn(run);
  }

  private renderStatsColumn(): void {
    const { x: PX, y: PY, w: PW } = this.stB;
    this.track(this.add.text(PX + PW / 2, PY + 6, t('inventory.stats'),
      uiStyle(TYPE.BODY, UI.TXT_CYAN, { bold: true })).setOrigin(0.5, 0));
    const sepTop = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
    drawDivider(sepTop, PX + 8, PY + 26, PW - 16, UI.ACCENT_ARCANE, 0.22);
    // Sections de stats — rendu PARTAGÉ avec InventoryScene (utils/StatsPanel.ts) :
    // exactement le même panneau dans les deux inventaires (capture créateur).
    renderStatsSections(this, this.gameScene.gameState.player,
      PX, PW, PY + 36, go => this.track(go));
  }

  /**
   * Détail d'un item sélectionné (paperdoll OU sac de run) — contenu partagé
   * avec InventoryScene (utils/ItemDetailPanel.ts), boutons d'action propres à
   * cette scène : Équiper/Consommer/Déplacer/Jeter pour un item du sac,
   * Déséquiper pour un item du paperdoll (jamais les deux à la fois, l'origine
   * tranche). "Déplacer" arme this.selected et ferme le détail — le clic
   * suivant sur un slot du sac termine l'échange via onBagSlotClicked, code
   * inchangé (même mécanisme que le clic direct, juste déclenché depuis ici).
   */
  private renderItemDetail(detail: { item: Item; origin: DetailOrigin }): void {
    const { item, origin } = detail;
    const bounds = this.stB;
    const run    = this.gameScene.gameState.run;
    const player = this.gameScene.gameState.player;
    const push   = (go: Phaser.GameObjects.GameObject) => this.track(go);
    const isClosing = () => this.closing;

    renderItemDetailContent(this, item, bounds, push, () => {
      this.selectedDetail = null;
      this.refresh();
    });

    const showEquip   = origin.kind === 'bag' && EQUIPPABLE_TYPES.has(item.type);
    const showUnequip = origin.kind === 'equip';
    const showConsume = origin.kind === 'bag' && item.type === ItemType.CONSUMABLE;
    const showMove    = origin.kind === 'bag';
    const showDrop    = origin.kind === 'bag';

    const btnCount = [showEquip, showUnequip, showConsume, showMove, showDrop].filter(Boolean).length + 1; // +1 Fermer
    let btnY = bounds.y + bounds.h - btnCount * (DETAIL_BTN_H + DETAIL_BTN_GAP) - 6;
    const nextBtnY = () => { const y = btnY; btnY += DETAIL_BTN_H + DETAIL_BTN_GAP; return y; };

    if (showEquip && origin.kind === 'bag') {
      const { bagKind, index } = origin;
      addDetailActionButton(this, bounds, nextBtnY(), t('inventory.equip_hint'), UI.TXT_GREEN, push, () => {
        if (!run) return;
        if (InventorySystem.equipFromRunBag(player, run, bagKind, index)) {
          this.gameScene.events.emit('player_update', player);
          this.selectedDetail = null;
          this.refresh();
        }
      }, isClosing);
    }

    if (showUnequip && origin.kind === 'equip') {
      const { slotKey } = origin;
      // unequipToRunBag priorise un slot SÛR libre, mais tombe dans l'ordinaire
      // (perdu à coup sûr à la mort/l'exfiltration) si aucun n'est libre — le
      // libellé/couleur du bouton doit prévenir CE risque-là avant le clic,
      // pas seulement après coup (cf. code-reviewer : même bouton/couleur que
      // la version bancaire garantie sûre, un joueur ne s'y attendrait pas).
      const hasSafeSlot = !!run && run.safeBag.some(s => s === null);
      const unequipLabel = hasSafeSlot ? t('inventory.unequip_hint') : `${t('inventory.unequip_hint')} (sac ordinaire, risqué)`;
      const unequipColor = hasSafeSlot ? UI.TXT_ORANGE : UI.TXT_RED;
      const unequipBtnY = nextBtnY();
      addDetailActionButton(this, bounds, unequipBtnY, unequipLabel, unequipColor, push, () => {
        if (!run) return;
        if (InventorySystem.unequipToRunBag(player, run, slotKey)) {
          this.gameScene.events.emit('player_update', player);
          this.selectedDetail = null;
          this.refresh();
        } else {
          // Sac de run plein (20 emplacements fixes, contrairement à la banque) —
          // ne jamais échouer silencieusement (cf. RunBagSystem). showLocalToast,
          // PAS show_notification : invisible sous le propre overlay de la scène.
          this.showLocalToast(t('inventory.runbag_unequip_full'), bounds.x + bounds.w / 2, unequipBtnY - 14);
        }
      }, isClosing);
    }

    if (showConsume && origin.kind === 'bag') {
      const { bagKind, index } = origin;
      addDetailActionButton(this, bounds, nextBtnY(), t('inventory.use_hint'), UI.TXT_GREEN, push, () => {
        this.selectedDetail = null;
        this.consumeItem(bagKind, index); // appelle déjà this.refresh()
      }, isClosing);
    }

    if (showMove && origin.kind === 'bag') {
      const { bagKind, index } = origin;
      addDetailActionButton(this, bounds, nextBtnY(), t('inventory.move_hint'), UI.TXT_BLUE, push, () => {
        // Arme la sélection comme un premier clic direct sur ce slot (cf.
        // onBagSlotClicked) — le clic suivant sur un slot du sac termine
        // l'échange/déplacement, code de swap inchangé.
        this.selected = { kind: bagKind, index };
        this.selectedDetail = null;
        this.refresh();
      }, isClosing);
    }

    if (showDrop && origin.kind === 'bag') {
      const { bagKind, index } = origin;
      addDetailActionButton(this, bounds, nextBtnY(), t('inventory.drop_hint'), UI.TXT_RED, push, () => {
        if (run) {
          const bag = bagKind === 'safe' ? run.safeBag : run.ordinaryBag;
          const bagSlot = bag[index];
          // Jette UNE unité à la fois — même granularité que consumeItem()/
          // InventoryScene.sell() (1 clic = 1 unité), jamais tout le stack
          // d'un coup (un slot de 20 matériaux ne doit pas partir en 1 clic).
          if (bagSlot) {
            bagSlot.quantity--;
            if (bagSlot.quantity <= 0) bag[index] = null;
          }
        }
        this.selectedDetail = null;
        this.refresh();
      }, isClosing);
    }

    addDetailActionButton(this, bounds, nextBtnY(), t('inventory.close_hint'), UI.TXT_MUTED, push, () => {
      this.selectedDetail = null;
      this.refresh();
    }, isClosing);
  }

  // ── Colonne ÉQUIPEMENT (2 col × 5 slots + identité) ──────────

  private renderEquipmentColumn(): void {
    const player = this.gameScene.gameState.player;
    const { x: PX, w: PW } = this.eqB;

    // Paperdoll partagé avec InventoryScene (utils/EquipmentPanel) — le rendu
    // d'un slot OCCUPÉ reste propre à cette scène (pas de cadre asset/survol
    // ici, contrairement à InventoryScene), mais ouvre désormais le même
    // panneau de détail au clic (avec un bouton Déséquiper contextuel).
    renderEquipmentPanel(this, this.eqB, player, go => this.track(go), {
      colInset: 16,
      renderOccupied: ({ sx, sy, key, item, rarHex }) => {
        const g = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
        drawSlot(g, sx, sy, EQ_SLOT, rarHex, { occupied: true });
        this.renderItemIcon(item, sx + EQ_SLOT / 2, sy + EQ_SLOT / 2, Math.round(EQ_SLOT * 0.7));

        const hit = this.track(this.add.rectangle(sx + EQ_SLOT / 2, sy + EQ_SLOT / 2, EQ_SLOT + 4, EQ_SLOT + 4, 0, 0)
          .setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Rectangle;
        hit.on('pointerdown', () => {
          this.selectedDetail = { item, origin: { kind: 'equip', slotKey: key } };
          this.refresh();
        });
      },
    });

    // Identité — nom + niveau tout en bas de la colonne (capture créateur)
    const nameY = this.eqB.y + this.eqB.h - 64;
    const sepG = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
    drawDivider(sepG, PX + 10, nameY - 10, PW - 20, UI.ACCENT_ARCANE, 0.22);
    const nameStyle = uiStyle(TYPE.BODY, UI.TXT_GOLD, { bold: true });
    this.track(this.add.text(PX + PW / 2, nameY,
      fitText(this, player.name, nameStyle, PW - 24), nameStyle).setOrigin(0.5, 0));
    this.track(this.add.text(PX + PW / 2, nameY + 22,
      t('inventory.level').replace('{level}', String(player.level)),
      uiStyle(TYPE.SMALL, UI.TXT_PARCHMENT)).setOrigin(0.5, 0));
  }

  // ── Colonne SAC (slots sûrs PUIS onglets + recherche PUIS grille) ──

  /** Ordonnées de la colonne SAC — capture créateur (18/07), de haut en bas :
   *  bandeau + rangée des slots SÛRS, onglets, recherche, grille ordinaire.
   *  Partagé entre createBagStatics (position du champ de recherche, statique)
   *  et renderBagColumn (tout le reste, dynamique) : les deux DOIVENT dériver
   *  des mêmes chiffres. */
  private bagLayoutYs(safeCount: number): { safeHdrY: number; safeY: number; tabsY: number; searchY: number; ordY: number } {
    const safeRows = Math.max(1, Math.ceil(safeCount / RB_COLS));
    const safeHdrY = this.bagB.y + BAG_TITLE_H + 6;
    const safeY    = safeHdrY + 20;
    const tabsY    = safeY + safeRows * RB_STRIDE - RB_GAP + 12;
    const searchY  = tabsY + RB_TABS_H + 4;
    const ordY     = searchY + RB_SEARCH_H + 10;
    return { safeHdrY, safeY, tabsY, searchY, ordY };
  }

  private renderBagColumn(run: RunState): void {
    const bx = this.bagB.x + 8;
    const { safeHdrY, safeY, tabsY, ordY } = this.bagLayoutYs(run.safeBag.length);

    // Bandeau des slots sûrs : libellé à gauche, compteur gardés/total à droite,
    // sur UNE seule ligne SANS chevauchement (capture créateur). La version
    // longue de la capture (« GARDÉS À L'EXTRACTION : 0/5 », ~27 glyphes de
    // Minimal 10) ne tient PAS avec le titre dans les 272 px de la colonne —
    // les deux textes se superposaient. On garde le libellé le plus complet qui
    // tient RÉELLEMENT (largeurs MESURÉES sur les Text rendus, jamais estimées),
    // avec dégradation progressive jusqu'au compteur nu qui tient toujours.
    const safeFilled = run.safeBag.filter(s => s !== null).length;
    const safeTitle = this.track(this.add.text(bx, safeHdrY, '◆ SLOTS SÛRS',
      uiStyle(TYPE.SMALL, UI.TXT_GOLD, { bold: true })).setOrigin(0, 0)) as Phaser.GameObjects.Text;
    const counterLabels = [
      `GARDÉS À L'EXTRACTION : ${safeFilled}/${run.safeBag.length}`,
      `GARDÉS : ${safeFilled}/${run.safeBag.length}`,
      `${safeFilled}/${run.safeBag.length}`,
    ];
    const safeCounter = this.track(this.add.text(bx + RB_GRID_W, safeHdrY, '',
      uiStyle(TYPE.SMALL, UI.TXT_MUTED)).setOrigin(1, 0)) as Phaser.GameObjects.Text;
    for (const label of counterLabels) {
      safeCounter.setText(label);
      if (safeTitle.width + 8 + safeCounter.width <= RB_GRID_W) break;
    }

    for (let i = 0; i < run.safeBag.length; i++) {
      const col = i % RB_COLS, row = Math.floor(i / RB_COLS);
      this.renderBagSlot('safe', i, bx + col * RB_STRIDE, safeY + row * RB_STRIDE, run.safeBag[i]);
    }

    // Onglets + (champ de recherche statique juste en dessous, cf. createBagStatics)
    this.renderRunBagTabs(bx, tabsY, RB_GRID_W);

    for (let i = 0; i < run.ordinaryBag.length; i++) {
      const col = i % RB_COLS, row = Math.floor(i / RB_COLS);
      this.renderBagSlot('ordinary', i, bx + col * RB_STRIDE, ordY + row * RB_STRIDE, run.ordinaryBag[i]);
    }

    // Compteur de remplissage de la grille ordinaire (capture : « 15 / 15
    // EMPLACEMENTS »)
    const ordRows = Math.ceil(run.ordinaryBag.length / RB_COLS);
    const ordFilled = run.ordinaryBag.filter(s => s !== null).length;
    this.track(this.add.text(bx + RB_GRID_W / 2, ordY + ordRows * RB_STRIDE - RB_GAP + 10,
      `${ordFilled} / ${run.ordinaryBag.length} EMPLACEMENTS`,
      uiStyle(TYPE.SMALL, UI.TXT_MUTED)).setOrigin(0.5, 0));
  }

  /** Onglets de filtrage à ICÔNES (glyphes `bagtab_*`, tooltip texte au survol,
   *  fallback label si la sheet manque) — même solution que les onglets du sac
   *  de InventoryScene (D13) : à 51 px par onglet, aucun label texte ne tient
   *  sans troncature. Pilule sombre, actif = fond BG_MID + liseré et bande
   *  basse arcane + glyphe alpha plein, hit zone 44 px. */
  private renderRunBagTabs(x: number, y: number, w: number): void {
    const TAB_GAP = 4;
    const tw = Math.floor((w - TAB_GAP * (RUN_BAG_TABS.length - 1)) / RUN_BAG_TABS.length);

    RUN_BAG_TABS.forEach((tab, i) => {
      const tx = x + i * (tw + TAB_GAP);
      const active = tab.id === this.bagFilter;
      const cx = tx + tw / 2;
      const cy = y + RB_TABS_H / 2;

      const g = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
      g.fillStyle(active ? UI.BG_MID : UI.BG_DEEP, 1);
      g.fillRoundedRect(tx, y, tw, RB_TABS_H, 4);
      g.lineStyle(1, active ? UI.ACCENT_ARCANE : UI.SEPARATOR, active ? 0.9 : 1);
      g.strokeRoundedRect(tx, y, tw, RB_TABS_H, 4);
      if (active) {
        g.fillStyle(UI.ACCENT_ARCANE, 0.9);
        g.fillRect(tx + 4, y + RB_TABS_H - 3, tw - 8, 2);
      }

      // Glyphe 32×32 à sa taille NATIVE (bake ×2 de la grille 16 px — tout
      // redimensionnement non entier réintroduirait du flou NEAREST).
      const inactiveAlpha = 0.45;
      let icon: Phaser.GameObjects.Image | null = null;
      if (this.textures.exists(tab.icon)) {
        icon = this.track(this.add.image(cx, cy, tab.icon).setAlpha(active ? 1 : inactiveAlpha)) as Phaser.GameObjects.Image;
      } else {
        // Fallback texte (sheet ui_icons_16 absente) — clampé en pixels, le
        // label complet reste toujours lisible via le tooltip.
        const tabStyle = uiStyle(TYPE.SMALL, active ? UI.TXT_CYAN : UI.TXT_MUTED, { bold: active });
        this.track(this.add.text(cx, cy, fitText(this, t(tab.labelKey), tabStyle, tw - 6), tabStyle).setOrigin(0.5));
      }

      const hit = this.track(this.add.rectangle(cx, cy, tw + TAB_GAP, 44, 0, 0)
        .setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Rectangle;
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
        this.refresh(); // l'état actif EST le feedback (cf. InventoryScene)
      });
    });
  }

  /** Tooltip du survol d'un onglet à icône — nom complet du filtre, panneau
   *  OPAQUE au-dessus de la rangée (depth 30, §2.5), un seul à la fois, clampé
   *  dans le cadre. Porté de InventoryScene.showTabTooltip (mêmes raisons : un
   *  texte nu se superposerait au champ de recherche voisin). */
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

    this.tabTooltip = this.add.container(cx, tabTopY - 4 - h / 2, [bg, txt]).setDepth(30);

    const W = this.cameras.main.width;
    const min = MARGIN + 4 + w / 2;
    const max = W - MARGIN - 4 - w / 2;
    this.tabTooltip.setX(Phaser.Math.Clamp(cx, Math.min(min, max), max));
  }

  private hideTabTooltip(): void {
    if (this.tabTooltip) { this.tabTooltip.destroy(); this.tabTooltip = null; }
  }

  /** Vrai si l'objet passe l'onglet actif ET la recherche — les slots qui ne
   *  passent pas sont ESTOMPÉS (jamais masqués : le sac est positionnel). */
  private matchesFilter(item: Item): boolean {
    const tab = RUN_BAG_TABS.find(tb => tb.id === this.bagFilter) ?? RUN_BAG_TABS[0]!;
    if (tab.types && !tab.types.has(item.type)) return false;
    if (this.searchQuery.length === 0) return true;
    return matchesSearch(this.searchQuery, localizeItem(item).name, t(`rarity.${item.rarity}`));
  }

  private renderBagSlot(kind: 'safe' | 'ordinary', index: number, x: number, y: number, slot: RunBagSlot | null) {
    const isSelected = this.selected?.kind === kind && this.selected.index === index;
    const goldHex = UI.SLOT_ACTIVE; // 0xc8a030 — même or que les rivets/titres
    // Filtre/recherche : uniquement sur la grille ordinaire (les onglets et le
    // champ sont posés SOUS la rangée sûre — c'est leur périmètre visuel).
    const dimmed = kind === 'ordinary' && !!slot && !this.matchesFilter(slot.item);
    const DIM_ALPHA = 0.25;
    const dim = (go: { setAlpha(alpha: number): unknown } | null): void => {
      if (dimmed && go) go.setAlpha(DIM_ALPHA);
    };

    const g = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
    if (kind === 'safe') {
      // Slot SÛR (capture créateur) : fond légèrement doré ; plein = bordure
      // dorée ÉPAISSE + badge d'index ; vide = pointillé doré fin + « + ».
      g.fillStyle(UI.SLOT_BG, 0.94);
      g.fillRoundedRect(x, y, RB_SLOT, RB_SLOT, 5);
      g.fillStyle(goldHex, slot ? 0.13 : 0.05);
      g.fillRoundedRect(x + 1, y + 1, RB_SLOT - 2, RB_SLOT - 2, 4);
      if (slot) {
        g.lineStyle(3, isSelected ? 0xffffff : goldHex, 1);
        g.strokeRoundedRect(x, y, RB_SLOT, RB_SLOT, 5);
      } else {
        // Le pointillé doré seul suffit à signaler "slot sûr vide" — le "+" ne
        // servait à rien de plus (retiré à la demande du créateur). Alpha
        // remonté (0.5→0.85) + léger glow pour le mettre en valeur ("shiny") ;
        // même couleur, juste plus vif — cf. addGlowSafe de FloatingItemDrop
        // pour le même patron try/catch (postFX indisponible en Canvas).
        strokeDashedRect(g, x, y, RB_SLOT, RB_SLOT, goldHex, { alpha: 0.85, lineWidth: 1.5 });
        try {
          (g as unknown as { postFX: Phaser.GameObjects.Components.FX }).postFX.addGlow(goldHex, 0.6);
        } catch { /* Canvas : pas de pipeline FX, dégradation silencieuse */ }
      }
    } else {
      const rarHex = slot ? parseInt((RARITY_COLORS[slot.item.rarity] ?? '#888888').slice(1), 16) : UI.SLOT_BORDER;
      // Bordure fine + fond teinté par la rareté (drawSlot occupé — règle
      // généralisée par la capture créateur, cf. UITheme.RARITY_TINT_ALPHA)
      drawSlot(g, x, y, RB_SLOT, isSelected ? 0xffffff : rarHex,
        { occupied: !!slot, borderAlpha: isSelected ? 1 : undefined });
      dim(g);
    }

    if (slot) {
      dim(this.renderItemIcon(slot.item, x + RB_SLOT / 2, y + RB_SLOT / 2, Math.round(RB_SLOT * 0.65)));
      if (slot.quantity > 1) {
        dim(this.track(this.add.text(x + RB_SLOT - 4, y + RB_SLOT - 4, `×${slot.quantity}`,
          uiStyle(TYPE.SMALL, UI.TXT_GOLD, { bold: true, stroke: true })).setOrigin(1, 1)));
      }
      if (kind === 'safe') {
        // Badge d'INDEX du slot sûr (1..N), coin haut-gauche — la capture montre
        // un petit badge numéroté à cet endroit ; l'index d'emplacement est la
        // seule donnée réelle qui lui corresponde (cf. rapport).
        const bg = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
        bg.fillStyle(UI.BG_DEEP, 0.92);
        bg.fillCircle(x + 10, y + 10, 8);
        bg.lineStyle(1, goldHex, 0.8);
        bg.strokeCircle(x + 10, y + 10, 8);
        this.track(this.add.text(x + 10, y + 10, String(index + 1),
          uiStyle(TYPE.SMALL, UI.TXT_GOLD, { bold: true })).setOrigin(0.5));
      }
    }

    const hit = this.track(this.add.rectangle(x + RB_SLOT / 2, y + RB_SLOT / 2, RB_SLOT + 4, RB_SLOT + 4, 0, 0)
      .setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Rectangle;
    hit.on('pointerdown', () => this.onBagSlotClicked(kind, index));

    // Badge "équiper" — objets équipables uniquement. Hit zone SÉPARÉE et
    // au-dessus de celle du slot (ajoutée après = prioritaire à l'input Phaser),
    // stopPropagation() empêche le clic de retomber sur le slot en dessous
    // (sinon un clic sur le badge sélectionnerait AUSSI le slot pour un échange).
    if (slot && EQUIPPABLE_TYPES.has(slot.item.type)) {
      const br = 9;
      const bx = x + RB_SLOT - br - 2, by = y + br + 2;
      const badgeG = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
      badgeG.fillStyle(UI.ACCENT_ARCANE, 0.95);
      badgeG.fillCircle(bx, by, br);
      badgeG.lineStyle(1, 0x000000, 0.6);
      badgeG.strokeCircle(bx, by, br);
      dim(badgeG);
      dim(this.track(this.add.text(bx, by, 'E', uiStyle(TYPE.SMALL, '#0a0a18', { bold: true })).setOrigin(0.5)));
      const badgeHit = this.track(this.add.rectangle(bx, by, br * 2 + 6, br * 2 + 6, 0, 0)
        .setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Rectangle;
      badgeHit.on('pointerdown', (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        this.onEquipClicked(kind, index);
      });
    }

    // Badge "détail" (i) — TOUT objet occupé, pas seulement les équipables :
    // ouvre le panneau de détail partagé avec InventoryScene (stats, résonance,
    // description) + les boutons Consommer/Déplacer/Jeter contextuels. Coin
    // bas-gauche : le seul coin libre (haut-gauche = index sûr, haut-droite =
    // badge E, bas-droite = quantité). Même patron stopPropagation que le
    // badge E — sans ça le clic retomberait AUSSI sur le slot (swap/consommer).
    if (slot) {
      const br = 9;
      const ibx = x + br + 2, iby = y + RB_SLOT - br - 2;
      const infoG = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
      infoG.fillStyle(parseInt(UI.TXT_BLUE.slice(1), 16), 0.95);
      infoG.fillCircle(ibx, iby, br);
      infoG.lineStyle(1, 0x000000, 0.6);
      infoG.strokeCircle(ibx, iby, br);
      dim(infoG);
      dim(this.track(this.add.text(ibx, iby, 'i', uiStyle(TYPE.SMALL, '#0a0a18', { bold: true })).setOrigin(0.5)));
      const infoHit = this.track(this.add.rectangle(ibx, iby, br * 2 + 6, br * 2 + 6, 0, 0)
        .setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Rectangle;
      infoHit.on('pointerdown', (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        this.selectedDetail = { item: slot.item, origin: { kind: 'bag', bagKind: kind, index } };
        this.refresh();
      });
    }
  }

  /** Équipe directement l'objet du slot cliqué (badge "E") — l'ancien équipement
   *  revient dans le MÊME emplacement du sac (cf. InventorySystem.equipFromRunBag). */
  private onEquipClicked(kind: 'safe' | 'ordinary', index: number) {
    const run = this.gameScene.gameState.run;
    if (!run) return;
    const player = this.gameScene.gameState.player;
    if (InventorySystem.equipFromRunBag(player, run, kind, index)) {
      this.gameScene.events.emit('player_update', player);
      this.selected = null;
      // Une équipe/déséquipe ailleurs peut invalider ce que montrait le détail
      // (ex: le slot qu'il décrivait vient de changer de contenu) — on ferme
      // plutôt que de risquer un bouton qui agit sur le mauvais item.
      this.selectedDetail = null;
      this.refresh();
    }
  }

  private onBagSlotClicked(kind: 'safe' | 'ordinary', index: number) {
    const run = this.gameScene.gameState.run;
    if (!run) return;
    const bag = kind === 'safe' ? run.safeBag : run.ordinaryBag;
    this.selectedDetail = null;

    if (!this.selected) {
      const slot = bag[index];
      if (!slot) return; // rien à sélectionner sur un slot vide
      // Consommer directement au premier clic sur un consommable — cf. spec
      // "clique pour boire". Rearranger un consommable reste possible via un
      // second clic si un AUTRE slot est déjà sélectionné (branche plus bas).
      if (slot.item.type === ItemType.CONSUMABLE) {
        this.consumeItem(kind, index);
        return;
      }
      this.selected = { kind, index };
      this.refresh();
      return;
    }

    if (this.selected.kind === kind && this.selected.index === index) {
      this.selected = null; // re-clic sur le même slot = désélection
      this.refresh();
      return;
    }

    if (this.selected.kind !== kind) {
      // Échange entre sûr et ordinaire — les deux sens sont symétriques.
      if (this.selected.kind === 'ordinary') RunBagSystem.moveToSafe(run, this.selected.index, index);
      else RunBagSystem.moveToOrdinary(run, this.selected.index, index);
    } else {
      // Deux slots du même bag — simple échange de contenu.
      const tmp = bag[index];
      bag[index] = bag[this.selected.index];
      bag[this.selected.index] = tmp;
    }
    this.selected = null;
    this.refresh();
  }

  /**
   * Consomme UN exemplaire du consommable au slot donné. Gère uniquement les
   * effets numériques directs (hpRestore/hpPercent/manaRestore/manaPercent) —
   * buffStat/revive/statusCure ne sont pas encore appliqués nulle part dans le
   * jeu (gap préexistant, comme l'équipement de sorts actifs) ; notifie plutôt
   * que d'ignorer silencieusement un effet non pris en charge.
   */
  private consumeItem(kind: 'safe' | 'ordinary', index: number) {
    const run = this.gameScene.gameState.run;
    if (!run) return;
    const bag = kind === 'safe' ? run.safeBag : run.ordinaryBag;
    const slot = bag[index];
    if (!slot || slot.item.type !== ItemType.CONSUMABLE) return;

    const player = this.gameScene.gameState.player;
    const effect = (slot.item as Consumable).effect;
    // Même logique que la banque (InventorySystem.useConsumable) — seul le
    // retrait diffère (slot du sac de run ici, LootSystem côté banque).
    const applied = InventorySystem.applyConsumableEffect(player, effect, this.gameScene.getPlayerModifiers());
    if (!applied) {
      this.gameScene.events.emit('show_notification', 'Effet de cet objet pas encore pris en charge en run.');
      return;
    }
    this.gameScene.events.emit('player_update', player);
    slot.quantity--;
    if (slot.quantity <= 0) bag[index] = null;
    this.selectedDetail = null;
    this.refresh();
  }

  /** Bouton de choix post-boss — STATIQUE (créé une fois dans createBagStatics,
   *  jamais dans refresh) : les handlers sont guardés par this.closing. */
  private renderChoiceButton(cx: number, cy: number, w: number, h: number, label: string, color: string, onClick: () => void) {
    const g = this.add.graphics();
    drawCard(g, cx - w / 2, cy - h / 2, w, h, { accent: parseInt(color.slice(1), 16), radius: 6 });
    this.add.text(cx, cy, label, uiStyle(TYPE.BODY, color, { bold: true })).setOrigin(0.5);
    const hit = this.add.rectangle(cx, cy, w + 6, Math.max(44, h), 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', onClick);
  }

  /** Message éphémère GARANTI visible (contrairement à un `show_notification`
   *  cross-scène : RunBagScene pose son propre overlay 0.88 par-dessus UIScene,
   *  cf. createBagStatics — le toast de UIScene s'y assombrit à ~12%, quasi
   *  invisible). Même patron qu'InventoryScene.showLocalToast. Poussé dans
   *  dynamicObjs pour être nettoyé au refresh(). */
  private showLocalToast(msg: string, x: number, y: number) {
    const txt = this.track(this.add.text(x, y, msg, uiStyle(TYPE.SMALL, UI.TXT_ORANGE, { bold: true }))
      .setOrigin(0.5).setDepth(50)) as Phaser.GameObjects.Text;
    this.tweens.add({ targets: txt, alpha: 0, delay: 1400, duration: 500, onComplete: () => { if (txt.active) txt.destroy(); } });
  }

  private confirmExfiltrate() {
    if (this.closing) return;
    const player = this.gameScene.gameState.player;
    const run = this.gameScene.gameState.run;
    if (!run) return;
    const failed = RunSystem.exfiltrate(player, run, this.gameScene.gameState.world);
    if (failed.length > 0) {
      // showLocalToast, PAS show_notification : le toast cross-scène de UIScene
      // se retrouverait assombri sous le propre overlay 0.88 de cette scène
      // (cf. code-reviewer) — garanti invisible pile au moment où l'échec
      // compte le plus.
      this.showLocalToast(`Banque pleine — ${failed.length} objet(s) restent dans le sac de run`,
        this.stB.x + this.stB.w / 2, this.stB.y + this.stB.h - 70);
      this.refresh();
      return;
    }
    this.gameScene.gameState.run = null;
    this.close();
    this.gameScene.travelToZone('grievy_town', 0, 0);
  }

  private confirmContinue() {
    if (this.closing) return;
    const run = this.gameScene.gameState.run;
    if (!run) return;
    RunSystem.continueRun(run);
    this.close();
    this.gameScene.travelToZone('ignis_reach', 0, 0);
  }

  public close(): void {
    if (this.closing) return;
    this.closing = true;
    closeScreenTransition(this, () => { this.scene.stop(); });
  }

  shutdown() {
    // Le champ de recherche possède un <input> DOM dans <body> et un listener de
    // resize sur le Scale Manager — Phaser n'en sait rien : sans ce destroy(),
    // l'input survivrait à la fermeture du sac de run (invisible mais
    // focalisable, il avalerait les frappes du jeu). Cf. guidelines §3.14bis.
    if (this.search) { this.search.destroy(); this.search = null; }
    // confirmDescend/confirmExfiltrate/confirmContinue enchaînent close() puis
    // travelToZone() — si une transition de zone est déjà en cours, sa propre
    // gestion pause/resume de la physique fait autorité ; réactiver ici la
    // resortirait de pause en plein fondu (cf. GameScene.isTravelingNow).
    if (!this.gameScene?.isTravelingNow) this.gameScene?.setPaused(false);
  }
}
