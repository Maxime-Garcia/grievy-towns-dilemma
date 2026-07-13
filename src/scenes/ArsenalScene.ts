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
import {
  UI, TYPE, LAYOUT, drawGlowPanel, drawCard, drawBadge, uiStyle, titleStyle, fitText, drawDivider,
  addCloseButton, drawScrollbar,
  formatDropRate, drawConfirmCancelButtons, ARCANE_CONFIRM_ACCENT,
  openScreenTransition, closeScreenTransition, portalRedirectTransition,
  formatRangedStatLine,
} from '../utils/UITheme';
import { SearchField, matchesSearch } from '../utils/SearchField';
import { ALL_ITEMS } from '../data/items';
import { getPassiveEffectLabel } from '../data/passiveEffects';
import { ArsenalSystem } from '../systems/ArsenalSystem';
import { StatsSystem } from '../systems/StatsSystem';
import { isEquipableItem } from '../systems/StatRollSystem';
import { SHOP_INVENTORY } from '../data/shops';
import { NPC_MAP } from '../data/npcs';
import { ALL_BESTIARY, BESTIARY_RECORD, BestiaryDropData } from '../data/bestiary';
import { BestiarySystem } from '../systems/BestiarySystem';
import { ENEMY_MAP } from '../data/enemies';
import { itemTextureKey } from '../utils/ItemAssets';
import { t, localizeItem, localizeBestiaryEntry } from '../i18n';
import { GameScene } from './GameScene';
import { ZONE_HABITAT_KEYS } from './BestiaryScene';

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

/** Rang de rareté pour le tri (le plus haut = le plus prestigieux). */
const RARITY_RANK: Record<ItemRarity, number> = {
  [ItemRarity.COMMON]: 0,
  [ItemRarity.UNCOMMON]: 1,
  [ItemRarity.RARE]: 2,
  [ItemRarity.EPIC]: 3,
  [ItemRarity.LEGENDARY]: 4,
  [ItemRarity.MYTHIC]: 5,
  [ItemRarity.HIDDEN]: 6,
};

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

// Rangée d'item : nom en TYPE.BODY (14) + rareté en TYPE.SMALL (10) + respiration.
// L'ancienne valeur (46) était calée sur l'ancienne échelle typo (9/10px).
const ITEM_ROW_H   = 50;
const HEADER_ROW_H = 24;
const ROW_GAP      = 2;

/** Pixels par cran de molette dans le viewport lore/description (≈ 2 lignes BODY). */
const LORE_SCROLL_STEP = 36;
/** Hauteur d'une rangée "monstre" dans la section Obtenu auprès de — rangée
 *  INTERACTIVE (ouvre la mini-card) : alignée sur LAYOUT.TOUCH_MIN (44). */
const DROP_SOURCE_ROW_H = 44;
/** Nombre max de monstres affichés avant de replier en "+N autres". */
const DROP_SOURCE_MAX_ROWS = 6;

/**
 * Réserve verticale (px) sous les stats, avant le titre "Description" — marge
 * de sécurité du bloc identité (un nom en HEADING 21 peut wrapper sur 2 lignes,
 * suivi de jusqu'à 3 lignes de stats en BODY 14 au pas de 18). Fixe et
 * indépendante de l'item sélectionné : LORE_Y doit rester la même géométrie
 * pour tous les items (panneau uniforme, cf. create()).
 * NB : cette constante s'appelait PASSIVE_RESERVE_PX quand le passif était
 * rendu dans le bloc identité, clampé en hauteur — ce clamp TRONQUAIT les
 * passifs longs des items Hidden (bug reporté : « Vous soigne de 25% de tous
 * les dégâts in… »). Le passif vit désormais EN TÊTE du viewport scrollable
 * (cf. renderDetail) : visible sans scroll, et lisible EN ENTIER en scrollant.
 */
const IDENTITY_RESERVE_PX = 44;

/**
 * Sous-titre du bloc fourchettes (§7.1) — hardcodé FR (pas de clé i18n) : la
 * catégorie de contenu equipStats/equipRanges n'est pas encore localisée
 * ailleurs dans ce fichier (cf. StatsSystem.STAT_LABELS, même convention).
 */
// « Fourchettes à l'obtention » sonnait comme une note de spécification. Ce bloc
// annonce ce que l'objet PEUT rouler quand il tombe — c'est une promesse de butin,
// pas une plage de tolérance industrielle.
const RANGES_SUBTITLE = 'Jets possibles au butin';

export class ArsenalScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private world!: WorldState;
  /** Item à pré-sélectionner au démarrage (navigation depuis le Bestiaire) — n'est
   *  honoré que si l'item est déjà découvert par ce joueur (cf. create()). */
  private focusItemId?: string;

  private rows: RowDef[] = [];
  private itemRowIndices: number[] = [];
  private scrollOffset = 0;
  private maxScrollOffset = 0;
  private lastVisibleIndex = 0;
  private selectedId: string | null = null;

  /** Champ de recherche (saisie DOM + rendu Phaser — cf. utils/SearchField.ts).
   *  `searchQuery` est la requête NORMALISÉE : c'est elle que buildRows() lit. */
  private search: SearchField | null = null;
  private searchQuery = '';

  private listObjs:   Phaser.GameObjects.GameObject[] = [];
  private detailObjs: Phaser.GameObjects.GameObject[] = [];
  private scrollbarGfx!: Phaser.GameObjects.Graphics;

  // Scroll interne du bloc passif/fourchettes/lore (viewport masqué à taille
  // fixe — cf. renderDetail) : offset en pixels, indépendant du scroll de la liste.
  private loreScrollPx = 0;
  private loreMaxScrollPx = 0;

  // Mini-card "monstre" ouverte depuis la section "Obtenu auprès de".
  private monsterCard: Phaser.GameObjects.Container | null = null;
  private monsterCardJustOpened = false;

  // Garde anti double-déclenchement : un fondu de sortie (fermeture ou
  // redirection) est en cours — ignore tout nouvel appel tant qu'il tourne
  // (évite un scene.stop()/launch() dupliqué si le bouton est tapé deux fois
  // pendant les ~200ms de fondu).
  private closing = false;

  private keyUp:   Phaser.Input.Keyboard.Key | null = null;
  private keyDown: Phaser.Input.Keyboard.Key | null = null;

  private dragging  = false;
  private dragAccum = 0;
  private wheelHandler:       ((p: Phaser.Input.Pointer, o: unknown, dx: number, dy: number) => void) | null = null;
  private pointerDownHandler: ((p: Phaser.Input.Pointer) => void) | null = null;
  private pointerMoveHandler: ((p: Phaser.Input.Pointer) => void) | null = null;
  private pointerUpHandler:   (() => void) | null = null;

  private readonly PAD = 14;

  private LIST_X = 0; private LIST_Y = 0; private LIST_W = 0; private LIST_H = 0;
  private DET_X = 0;  private DET_Y = 0;  private DET_W = 0;  private DET_H = 0;
  // 100 → 140 : le canvas 720px de haut offre la place d'un vrai bloc de lecture
  // (≈ 7 lignes de BODY 14 visibles au lieu de ~5 lignes de micro-texte).
  private LORE_X = 0; private LORE_Y = 0; private LORE_W = 0; private readonly LORE_H = 140;
  private rowsTop = 0; private rowsBottom = 0;

  constructor() { super({ key: 'ArsenalScene' }); }

  init(data: { gameScene: GameScene; world?: WorldState; focusItemId?: string }) {
    this.gameScene = data.gameScene;
    this.world     = data.world ?? data.gameScene.gameState.world;
    this.focusItemId = data.focusItemId;
    this.rows = [];
    this.itemRowIndices = [];
    this.scrollOffset = 0;
    this.selectedId = null;
    this.search = null;
    this.searchQuery = '';
    this.listObjs = [];
    this.detailObjs = [];
    this.loreScrollPx = 0;
    this.loreMaxScrollPx = 0;
    this.monsterCard = null;
    this.monsterCardJustOpened = false;
    this.closing = false;
    this.dragging = false;
    this.dragAccum = 0;
  }

  create() {
    const { width: W, height: H } = this.cameras.main;
    // focusItemId présent = arrivée via le portail du Bestiaire (teinte or,
    // même couleur que le fondu de départ) ; sinon ouverture normale.
    openScreenTransition(this, this.focusItemId !== undefined ? { portalTint: UI.CORNER } : {});

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);
    const frame = this.add.graphics();
    drawGlowPanel(frame, 6, 6, W - 12, H - 12, UI.ACCENT_ARCANE, UI.BG_DEEP, 10, 0.92);

    // Titre d'écran en police Boss (titleStyle) — même convention que
    // InventoryScene : c'est ce qui redonne la hiérarchie (l'ancien uiStyle(13)
    // tombait à la même taille que le corps de texte).
    this.add.text(W / 2, 26, t('arsenal.title'), titleStyle(UI.TXT_GOLD, { stroke: true })).setOrigin(0.5);

    const counts = ArsenalSystem.counts(this.world);
    const progressLabel = t('arsenal.progress')
      .replace('{seen}',  String(counts.seen))
      .replace('{total}', String(counts.total));
    this.add.text(20, 26, progressLabel, uiStyle(TYPE.SMALL, UI.TXT_MUTED)).setOrigin(0, 0.5);

    addCloseButton(this, W - 28, 26, () => this.close());

    const sep = this.add.graphics();
    drawDivider(sep, 16, 48, W - 32, UI.ACCENT_ARCANE, 0.35);

    this.LIST_X = 16;
    // Largeur de liste RELATIVE au canvas (l'ancien 212 en dur avait été calé
    // sur 800px de large) — ~27% laisse un panneau détail confortable à droite.
    this.LIST_W = Math.round(W * 0.27);
    // Le champ de recherche s'insère AU-DESSUS de la liste (542 entrées : la
    // recherche est le premier geste, pas une option). Seule la LISTE recule —
    // le panneau détail garde exactement sa géométrie (DET_Y/DET_H inchangés :
    // tout son layout interne, viewport de lore et section sources, en dépend).
    const SEARCH_Y = 56;
    const SEARCH_H = LAYOUT.TOUCH_MIN;
    this.LIST_Y = SEARCH_Y + SEARCH_H + 6;
    this.LIST_H = H - this.LIST_Y - 28;
    this.DET_X  = this.LIST_X + this.LIST_W + 8;
    this.DET_Y  = SEARCH_Y;
    this.DET_W  = W - this.DET_X - 16;
    this.DET_H  = H - this.DET_Y - 28;
    this.rowsTop    = this.LIST_Y + 24;
    this.rowsBottom = this.LIST_Y + this.LIST_H - 24;

    // Viewport fixe du bloc description/lore — même géométrie pour tous les items
    // (panneau uniforme), le texte défile DEDANS au lieu de faire varier la taille
    // du panneau ou de déborder hors-cadre (cf. renderDetail, blocs masqués).
    // +IDENTITY_RESERVE_PX : marge de sécurité sous le bloc identité (nom +
    // badges + stats) avant le titre "Description" — voir la constante.
    this.LORE_X = this.DET_X + this.PAD;
    this.LORE_Y = this.DET_Y + this.PAD + 96 + 18 + IDENTITY_RESERVE_PX + 14;
    this.LORE_W = this.DET_W - this.PAD * 2;

    const listBg = this.add.graphics();
    drawGlowPanel(listBg, this.LIST_X, this.LIST_Y, this.LIST_W, this.LIST_H, UI.ACCENT_ARCANE, UI.BG_MID, 8, 0.55);

    this.search = new SearchField(this, {
      x: this.LIST_X, y: SEARCH_Y, w: this.LIST_W, h: SEARCH_H,
      placeholder: t('search.placeholder_item'),
      onChange: (q) => this.applySearch(q),
      onEscape: () => this.close(),
    });

    // Depth explicite : sans ça, les lignes recréées à chaque renderList() finissent
    // plus tard dans la display list et passent PAR-DESSUS la scrollbar (bug reporté).
    this.scrollbarGfx = this.add.graphics().setDepth(5);

    this.add.text(W / 2, H - 16, t('arsenal.hint'), uiStyle(TYPE.SMALL, UI.TXT_HINT)).setOrigin(0.5);

    this.buildRows();
    this.maxScrollOffset = this.computeMaxOffset();

    // Priorité à focusItemId (navigation depuis le Bestiaire) — seulement s'il est
    // déjà découvert par ce joueur, sinon on retombe sur le comportement par défaut.
    const focusValid = this.focusItemId && ArsenalSystem.peekEntry(this.world, this.focusItemId).discovered
      ? this.focusItemId : undefined;
    const firstDiscovered = SECTION_ORDER
      .flatMap(type => Object.values(ALL_ITEMS).filter(i => i.type === type))
      .find(i => ArsenalSystem.peekEntry(this.world, i.id).discovered);
    this.selectedId = focusValid ?? firstDiscovered?.id ?? (this.itemRowIndices.length > 0
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

  /**
   * Prédicat de recherche d'un item — sur le nom LOCALISÉ (`localizeItem`), pas
   * sur le nom brut de la data : le joueur cherche ce qu'il LIT à l'écran.
   * La rareté est aussi indexée (« legendaire » liste les légendaires).
   *
   * Un item NON DÉCOUVERT ne matche jamais une requête : son nom est masqué
   * (« ??? ») dans cette UI, le faire remonter par son vrai nom le divulguerait.
   */
  private matchesQuery(item: Item, discovered: boolean): boolean {
    if (this.searchQuery.length === 0) return true;
    if (!discovered) return false;
    return matchesSearch(this.searchQuery, localizeItem(item).name, t(`rarity.${item.rarity}`));
  }

  private buildRows() {
    for (const sectionType of SECTION_ORDER) {
      // Tri à DEUX niveaux : la section donne la catégorie (armes, casques…), et à
      // l'intérieur on classe par RARETÉ CROISSANTE — Commun en tête, Hidden en fin
      // de section. La liste se lit donc comme une progression : on descend vers les
      // pièces d'exception, et le bas de chaque section est la récompense du scroll.
      // À rareté égale, ordre alphabétique pour que la liste soit stable et qu'un
      // item se retrouve à l'œil.
      const items = Object.values(ALL_ITEMS)
        .filter(i => i.type === sectionType)
        // La recherche filtre AVANT le groupement : une section vidée par le
        // filtre ne pousse pas d'en-tête (`items.length === 0` ci-dessous).
        .filter(i => this.matchesQuery(i, ArsenalSystem.peekEntry(this.world, i.id).discovered))
        .sort((a, b) => {
          const dr = RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity];
          return dr !== 0 ? dr : a.name.localeCompare(b.name, 'fr');
        });
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

  /**
   * Recherche appliquée à la frappe : on reconstruit les rangées (le filtre vit
   * dans buildRows, donc les en-têtes de section vidés disparaissent d'eux-mêmes),
   * on remet le scroll à zéro et on garde une sélection COHÉRENTE — si l'item
   * affiché à droite n'est plus dans les résultats, on bascule sur le premier
   * résultat. Le panneau détail n'est jamais vidé tant qu'un item reste
   * sélectionnable : une recherche infructueuse ne doit pas effacer le contexte.
   */
  private applySearch(query: string) {
    this.searchQuery = query;
    this.rows = [];
    this.itemRowIndices = [];
    this.buildRows();
    this.maxScrollOffset = this.computeMaxOffset();
    this.scrollOffset = 0;
    this.destroyMonsterCard();

    if (this.itemRowIndices.length > 0 && (this.selectedId === null || this.rowIndexOf(this.selectedId) === -1)) {
      const firstRow = this.rows[this.itemRowIndices[0]];
      if (firstRow && firstRow.kind === 'item') {
        this.selectedId = firstRow.id;
        this.loreScrollPx = 0;
      }
    }
    if (this.selectedId) this.ensureVisible(this.rowIndexOf(this.selectedId));

    this.renderList();
    this.renderDetail();
  }

  /**
   * Échap : vide d'abord la recherche, ferme seulement si elle est déjà vide.
   * Appelé par GameScene.escKey (l'ESC du jeu est central — cf. son commentaire)
   * ET par le champ lui-même quand il a le focus clavier.
   * Retourne true si l'appui a été CONSOMMÉ (ne pas fermer l'écran).
   */
  handleEscape(): boolean {
    return this.search?.clear() ?? false;
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
    this.destroyMonsterCard();
    this.renderList();
  }

  /** Scroll interne du viewport description/lore (en pixels) — indépendant du scroll
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
      const rh = row.kind === 'header' ? HEADER_ROW_H : ITEM_ROW_H;
      if (y + rh > this.rowsBottom) break;
      if (row.kind === 'header') this.renderHeaderRow(row.label, x, y, w);
      else                       this.renderItemRow(row.id, x, y, w);
      y += rh + ROW_GAP;
      i++;
    }
    this.lastVisibleIndex = i - 1;

    // État vide — jamais un panneau blanc : on nomme la requête qui n'a rien donné.
    if (this.rows.length === 0) this.renderEmptyState(x, w);

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

  /** « Aucun résultat » + rappel de la requête, centré dans le panneau de liste. */
  private renderEmptyState(x: number, w: number) {
    const cx = x + w / 2;
    const cy = this.LIST_Y + this.LIST_H / 2;
    const hintStyle = uiStyle(TYPE.SMALL, UI.TXT_HINT, { align: 'center', wordWrapWidth: w - 8 });
    this.listObjs.push(
      this.add.text(cx, cy - 12, t('search.no_results'),
        uiStyle(TYPE.BODY, UI.TXT_MUTED, { bold: true })).setOrigin(0.5),
      this.add.text(cx, cy + 12,
        // Texte TEL QUE TAPÉ (« Épée »), pas la forme normalisée (« epee ») :
        // c'est ce que le joueur reconnaît.
        t('search.no_results_hint').replace('{q}', this.search?.text ?? this.searchQuery),
        hintStyle).setOrigin(0.5),
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
    const txt = this.add.text(x + 18, cy, label, uiStyle(TYPE.SMALL, UI.TXT_CYAN, { bold: true })).setOrigin(0, 0.5);
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
    const icx = x + 25;
    if (entry.discovered) {
      this.listObjs.push(
        this.add.image(icx, cy, iconKey).setDisplaySize(32, 32),
      );
    } else {
      const ph = this.add.graphics();
      ph.fillStyle(0x232336, 1);
      ph.fillCircle(icx, cy, 15);
      this.listObjs.push(ph,
        this.add.text(icx, cy, '?', uiStyle(9, UI.TXT_WHITE, { bold: true })).setOrigin(0.5),
      );
    }

    const rawName = entry.discovered ? localizeItem(item).name : t('arsenal.unknown');
    const nameColor = entry.discovered ? (RARITY_COLORS[item.rarity] ?? UI.TXT_PARCHMENT) : UI.TXT_MUTED;
    // Nom en TYPE.BODY (14) + troncature en PIXELS (fitText) — l'ancien
    // slice(0, 15) tronquait au caractère, sans rien savoir de la police.
    const nameStyle = uiStyle(TYPE.BODY, nameColor, { bold: entry.discovered });
    this.listObjs.push(
      this.add.text(x + 46, y + 8, fitText(this, rawName, nameStyle, w - 46 - 6), nameStyle),
    );
    this.listObjs.push(
      this.add.text(x + 46, y + 27, entry.discovered ? t(`rarity.${item.rarity}`) : t('arsenal.locked'),
        uiStyle(TYPE.SMALL, UI.TXT_MUTED)),
    );

    bg.on('pointerover', () => { if (id !== this.selectedId) bg.setFillStyle(0x181628, 1); });
    bg.on('pointerout',  () => { if (id !== this.selectedId) bg.setFillStyle(UI.BTN_BG, 1); });
    bg.on('pointerdown', () => this.selectItem(id));
  }

  private selectItem(id: string) {
    if (this.selectedId === id) return;
    this.selectedId = id;
    this.loreScrollPx = 0;
    this.destroyMonsterCard();
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
    // Le nom est le héros du panneau : TYPE.HEADING (21), couleur de rareté —
    // même convention que le panneau détail de l'inventaire.
    const nameTxt = this.add.text(ix, iy, displayName, uiStyle(TYPE.HEADING, nameColor, { bold: true, wordWrapWidth: iw }));
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
      // Valeurs en TYPE.BODY (14) : « les valeurs importantes en grand » — le
      // micro-texte reste réservé aux fourchettes/badges (TYPE.SMALL).
      // PARCHEMIN partout (retour utilisateur : le TXT_MUTED rendait ATK/M.ATK/
      // Vit. d'attaque « ternes » face au blanc de la section sources). La
      // fourchette catalogue (muted) se distingue désormais par l'ITALIQUE,
      // les valeurs figées par le GRAS — plus jamais par une couleur éteinte.
      for (const line of this.statLines(item)) {
        this.detailObjs.push(this.add.text(ix, iy, line.text,
          uiStyle(TYPE.BODY, UI.TXT_PARCHMENT, line.muted ? { italic: true } : { bold: true })));
        iy += 18;
      }
      // Le passif n'est plus rendu ici : il vit en tête du viewport scrollable
      // ci-dessous — jamais tronqué (cf. doc de IDENTITY_RESERVE_PX).
    }

    // ── Description / lore ──────────────────────────────────────
    // Viewport fixe (this.LORE_X/Y/W/H, calculé une fois dans create()) : le texte
    // défile DEDANS (molette + scrollbar) au lieu de faire varier la taille du
    // panneau ou de déborder hors-cadre — garantit un panneau UNIFORME pour tous
    // les items tout en gardant tout le contenu accessible (blocs masqués ci-dessous).
    const descY = this.DET_Y + pad + 96 + 18 + IDENTITY_RESERVE_PX;
    this.addSectionTitle(t('arsenal.description_title'), descY);

    const baseDesc = loc.lore ?? loc.description;
    const descText = entry.discovered ? baseDesc : t('arsenal.not_discovered');
    const descColor = entry.discovered ? UI.TXT_PARCHMENT : UI.TXT_MUTED;

    // Contenu du viewport scrollable — blocs empilés partageant UN masque et
    // UN scroll (garde LORE_Y/dropTitleY strictement inchangés) :
    //  1. PASSIF (or gras, TYPE.BODY) : info capitale d'un item Hidden. En TÊTE
    //     du viewport, donc visible sans scroller dans tous les cas courants —
    //     et le scroll garantit sa lecture EN ENTIER quelle que soit sa longueur
    //     (l'ancien clamp du bloc identité le tronquait, bug reporté).
    //  2. Fourchettes de roll (§7.1) : longueur VARIABLE (2 lignes en COMMON,
    //     jusqu'à 8 en HIDDEN) — seul le viewport scrollable peut l'absorber.
    //  3. Lore/description : corps de lecture en TYPE.BODY.
    const blocks: { text: string; style: Phaser.Types.GameObjects.Text.TextStyle }[] = [];
    const passiveLabel = entry.discovered && 'passiveEffect' in item && item.passiveEffect
      ? getPassiveEffectLabel(item.passiveEffect)
      : undefined;
    if (passiveLabel) {
      blocks.push({
        text: `${t('arsenal.passive_label')} ${passiveLabel}`,
        style: uiStyle(TYPE.BODY, UI.TXT_GOLD, { bold: true, lineSpacing: 4, wordWrapWidth: this.LORE_W }),
      });
    }
    const rangeLines = entry.discovered ? this.equipRangeLines(item) : [];
    if (rangeLines.length > 0) {
      blocks.push({
        text: `${RANGES_SUBTITLE}\n${rangeLines.join('\n')}`,
        style: uiStyle(TYPE.SMALL, UI.TXT_MUTED, { italic: true, lineSpacing: 4, wordWrapWidth: this.LORE_W }),
      });
    }
    blocks.push({
      text: descText,
      style: uiStyle(TYPE.BODY, descColor, { lineSpacing: 5, wordWrapWidth: this.LORE_W }),
    });

    const GAP_Y = 10;
    const blockTexts: Phaser.GameObjects.Text[] = [];
    let blockY = this.LORE_Y - this.loreScrollPx;
    for (const block of blocks) {
      const txt = this.add.text(this.LORE_X, blockY, block.text, block.style);
      blockTexts.push(txt);
      blockY += txt.height + GAP_Y;
    }
    const contentPx = blockY + this.loreScrollPx - this.LORE_Y - GAP_Y;
    const maxScrollPx = Math.max(0, Math.ceil(contentPx) - this.LORE_H);
    if (this.loreScrollPx > maxScrollPx) {
      // Offset devenu trop grand pour ce contenu (changement d'item) : on
      // remonte tous les blocs d'un même delta avant le clamp ci-dessous.
      const dy = this.loreScrollPx - maxScrollPx;
      for (const txt of blockTexts) txt.setY(txt.y + dy);
    }

    const maskGfx = this.make.graphics(undefined, false);
    maskGfx.fillStyle(0xffffff, 1);
    maskGfx.fillRect(this.LORE_X, this.LORE_Y, this.LORE_W, this.LORE_H);
    const geomMask = maskGfx.createGeometryMask();
    for (const txt of blockTexts) txt.setMask(geomMask);
    this.detailObjs.push(...blockTexts, maskGfx);

    this.loreMaxScrollPx = maxScrollPx;
    if (this.loreScrollPx > this.loreMaxScrollPx) this.loreScrollPx = this.loreMaxScrollPx;
    if (maxScrollPx > 0) {
      const sbGfx = this.add.graphics();
      drawScrollbar(
        sbGfx, this.LORE_X + this.LORE_W - 6, this.LORE_Y, 4, this.LORE_H,
        this.loreScrollPx, maxScrollPx, this.LORE_H / (this.LORE_H + maxScrollPx),
      );
      this.detailObjs.push(sbGfx);
    }

    // ── Obtenu auprès de (cross-link vers le Bestiaire) ─────────
    // Position fixe sous le viewport lore — jamais de chevauchement possible
    // puisque le lore ci-dessus est clippé à this.LORE_H, quelle que soit sa longueur.
    if (entry.discovered) {
      const dropTitleY = this.LORE_Y + this.LORE_H + 20;
      this.renderDroppedBySection(item.id, dropTitleY);
    }
  }

  // ════════════════════════════════════════════════════════════
  // OBTENU AUPRÈS DE (cross-link Bestiaire)
  // ════════════════════════════════════════════════════════════

  /**
   * Marchands qui VENDENT cet objet, avec leur ville et le prix affiché.
   * Beaucoup d'objets (consommables, matériaux, équipement de base) ne tombent
   * d'aucun monstre : sans ça l'Arsenal affichait « Source inconnue » pour un objet
   * en vente à deux pas, ce qui est une impasse pour le joueur.
   */
  private findVendors(itemId: string): { name: string; location: string; price: number }[] {
    const out: { name: string; location: string; price: number }[] = [];
    for (const [npcId, entries] of Object.entries(SHOP_INVENTORY)) {
      const entry = entries.find(e => e.itemId === itemId);
      if (!entry) continue;
      const npc = NPC_MAP[npcId];
      // `t()` renvoie la clé elle-même si elle est absente — on retombe donc sur le
      // nom brut de la zone plutôt que d'afficher « zone.grievy_town » au joueur.
      const locKey = npc?.location ? `zone.${npc.location}` : '';
      const locLabel = locKey ? t(locKey) : '';
      out.push({
        name: npc?.name ?? npcId,
        location: locLabel === locKey ? (npc?.location ?? '') : locLabel,
        price: entry.price,
      });
    }
    return out;
  }

  /** Scanne ALL_BESTIARY (les 196 monstres, generes compris — BESTIARY_DATA seul
   *  ne couvrait que les 57 ecrits a la main, d'ou les "Source inconnue" sur tout
   *  item ne tombant que des monstres generes) pour lister ses sources —
   *  respecte isHidden/isDropRevealed (jamais de spoil d'un drop caché non révélé).
   *
   *  Le TITRE de la section suit le contenu réel (retour utilisateur : « Obtenu
   *  auprès de » suivi d'un monstre sonnait comme un achat chez un PNJ) :
   *  monstres → « Lâché par », marchands → « En vente chez », rien → « Provenance ». */
  private renderDroppedBySection(itemId: string, titleY: number) {
    const contentX = this.DET_X + this.PAD;
    const contentY = titleY + 18;
    const contentW = this.DET_W - this.PAD * 2;

    const sources: { enemyId: string; drop: BestiaryDropData }[] = [];
    for (const data of ALL_BESTIARY) {
      const drop = data.drops.find(d => d.itemId === itemId);
      if (!drop) continue;
      if (drop.isHidden && !BestiarySystem.isDropRevealed(this.world, data.enemyId, itemId)) continue;
      sources.push({ enemyId: data.enemyId, drop });
    }

    if (sources.length === 0) {
      // Aucun monstre ne le lâche : c'est probablement un article de boutique
      // (consommables, matériaux, équipement de base). Dire « Source inconnue » là où
      // l'objet est en vente à deux pas était une impasse pour le joueur — on nomme
      // le marchand et sa ville.
      const vendors = this.findVendors(itemId);
      if (vendors.length === 0) {
        this.addSectionTitle(t('arsenal.source_title'), titleY);
        this.detailObjs.push(
          this.add.text(contentX, contentY, t('arsenal.loot_unknown'), uiStyle(9, UI.TXT_MUTED)),
        );
        return;
      }
      this.addSectionTitle(t('arsenal.sold_by_title'), titleY);
      const vendorStyle = uiStyle(TYPE.BODY, UI.TXT_GOLD);
      vendors.slice(0, 4).forEach((v, i) => {
        const line = `${v.name}${v.location ? ` — ${v.location}` : ''}   ${v.price} or`;
        this.detailObjs.push(
          this.add.text(contentX, contentY + i * 20,
            fitText(this, line, vendorStyle, contentW), vendorStyle),
        );
      });
      return;
    }
    this.addSectionTitle(t('arsenal.dropped_by_title'), titleY);

    // Nombre de lignes réellement calculé depuis l'espace restant sous contentY
    // (pas un DROP_SOURCE_MAX_ROWS fixe) : le budget vertical au-dessus de ce
    // point varie désormais avec IDENTITY_RESERVE_PX (cf. sa doc) — un plafond
    // fixe déborderait hors du panneau pour un item à 7+ sources de drop non
    // cachées (ex: ember_core, minor_mana_potion). -18 = marge de sécurité avant
    // le bord du panneau, -14 = place réservée pour la ligne "+N autres".
    const bottomLimit = this.DET_Y + this.DET_H - 18;
    const maxRows = Math.max(1, Math.min(
      DROP_SOURCE_MAX_ROWS,
      Math.floor((bottomLimit - contentY - 14) / DROP_SOURCE_ROW_H),
    ));
    const visible = sources.slice(0, maxRows);
    visible.forEach((src, i) => this.renderDroppedByRow(
      src.enemyId, src.drop, contentX, contentY + i * DROP_SOURCE_ROW_H, contentW, DROP_SOURCE_ROW_H,
    ));
    if (sources.length > visible.length) {
      this.detailObjs.push(
        this.add.text(contentX, contentY + visible.length * DROP_SOURCE_ROW_H + 2,
          t('arsenal.dropped_by_more').replace('{n}', String(sources.length - visible.length)),
          uiStyle(TYPE.SMALL, UI.TXT_HINT)),
      );
    }
  }

  private renderDroppedByRow(enemyId: string, drop: BestiaryDropData, x: number, y: number, w: number, h: number) {
    const data = BESTIARY_RECORD[enemyId];
    if (!data) return;
    const cy = y + h / 2;
    // Ne jamais révéler le portrait/nom d'un monstre que CE joueur n'a pas encore
    // rencontré — même gating que BestiaryScene.renderDetail() (entry.discovered).
    const discovered = BestiarySystem.peekEntry(this.world, enemyId).discovered;

    const hit = this.add.rectangle(x + w / 2, cy, w, h, 0, 0).setInteractive({ useHandCursor: true });
    this.detailObjs.push(hit);

    const pcx = x + 18;
    const portraitKey = `enemy_${enemyId}_idle`;
    if (discovered && this.textures.exists(portraitKey)) {
      this.detailObjs.push(this.add.image(pcx, cy, portraitKey, 0).setDisplaySize(32, 32));
    } else {
      const ph = this.add.graphics();
      ph.fillStyle(discovered ? 0x2a2a3a : 0x3a3a44, 0.9);
      ph.fillCircle(pcx, cy, 16);
      const glyph = discovered ? data.name.split(' ').map(wd => wd[0] ?? '').join('').slice(0, 2).toUpperCase() : '?';
      this.detailObjs.push(ph,
        this.add.text(pcx, cy, glyph, uiStyle(discovered ? TYPE.SMALL : 10, UI.TXT_WHITE, { bold: true })).setOrigin(0.5),
      );
    }

    const name = discovered ? localizeBestiaryEntry(data).name : t('bestiary.unknown');
    const nameStyle = uiStyle(TYPE.BODY, discovered ? UI.TXT_PARCHMENT : UI.TXT_MUTED, { bold: discovered });
    this.detailObjs.push(this.add.text(x + 40, y + 5, fitText(this, name, nameStyle, w - 46), nameStyle));
    const rate = drop.dropRatePct / 100;
    this.detailObjs.push(
      this.add.text(x + 40, y + 24, t('bestiary.drop_rate').replace('{rate}', formatDropRate(rate)),
        uiStyle(TYPE.SMALL, UI.TXT_MUTED)),
    );

    hit.on('pointerover', () => hit.setFillStyle(0xffffff, 0.05));
    hit.on('pointerout',  () => hit.setFillStyle(0, 0));
    hit.on('pointerdown', () => this.openMonsterCard(enemyId));
  }

  /** Mini-card monstre — nom, habitat, teaser + boutons Aller (Bestiaire, focus)/Annuler. */
  private openMonsterCard(enemyId: string) {
    this.destroyMonsterCard();
    const data = BESTIARY_RECORD[enemyId];
    if (!data) return;
    this.monsterCardJustOpened = true;

    // Même gating que BestiaryScene.renderDetail() : nom + teaser masqués tant que
    // ce monstre n'a pas été rencontré par CE joueur (l'habitat reste toujours
    // visible — c'est un indice délibéré, cf. commentaire de BestiaryScene).
    const discovered = BestiarySystem.peekEntry(this.world, enemyId).discovered;
    const loc = localizeBestiaryEntry(data);
    // 260 → 300 : la card contient deux boutons côte à côte de 44px de haut —
    // l'ancienne largeur les rendait étriqués, et le canvas a la place.
    const CW = 300;
    const padC = 14;
    const parts: Phaser.GameObjects.GameObject[] = [];
    let cy = padC;

    const nameTxt = this.add.text(padC, cy, discovered ? loc.name : t('bestiary.unknown'),
      uiStyle(TYPE.BODY, discovered ? UI.TXT_GOLD : UI.TXT_MUTED, { bold: true, wordWrapWidth: CW - padC * 2 }));
    parts.push(nameTxt);
    cy += nameTxt.height + 6;

    // Même logique que BestiaryScene.renderDetail() : préfère la clé de zone traduite,
    // ne retombe sur le texte libre (souvent non traduit) que si l'élément n'a pas de clé.
    const enemyDef = ENEMY_MAP[enemyId];
    const zoneKey = enemyDef ? ZONE_HABITAT_KEYS[enemyDef.element] : undefined;
    const habitatStr = zoneKey ? t(zoneKey) : data.habitat;
    const habitatTxt = this.add.text(padC, cy, habitatStr,
      uiStyle(TYPE.SMALL, UI.TXT_MUTED, { wordWrapWidth: CW - padC * 2 }));
    parts.push(habitatTxt);
    cy += habitatTxt.height + 6;

    const descTxt = this.add.text(padC, cy, discovered ? loc.shortDesc : t('bestiary.not_discovered'),
      uiStyle(TYPE.BODY, discovered ? UI.TXT_PARCHMENT : UI.TXT_MUTED, { wordWrapWidth: CW - padC * 2, lineSpacing: 4 }));
    parts.push(descTxt);
    cy += descTxt.height + 12;

    const subtitleTxt = this.add.text(CW / 2, cy, t('arsenal.view_in_bestiary'),
      uiStyle(TYPE.SMALL, UI.TXT_CYAN)).setOrigin(0.5, 0);
    parts.push(subtitleTxt);
    cy += subtitleTxt.height + 6;

    // Aller (bleu/cyan arcane — même teinte que le liseré du cadre et le
    // portail de destination, plutôt qu'un vert générique) / Annuler (rouge,
    // referme la card sans quitter l'Arsenal) — même convention que
    // InventoryScene.showActionConfirmPopup().
    const { objects: navBtns, height: navBtnH } = drawConfirmCancelButtons(
      this, padC, cy, CW - padC * 2,
      t('nav.go'), t('nav.cancel'),
      () => {
        if (this.closing) return;
        this.closing = true;
        portalRedirectTransition(this, UI.ACCENT_ARCANE, () => {
          this.scene.stop();
          this.scene.launch('BestiaryScene', { gameScene: this.gameScene, world: this.world, focusEnemyId: enemyId });
        });
      },
      () => this.destroyMonsterCard(),
      undefined,
      ARCANE_CONFIRM_ACCENT,
    );
    parts.push(...navBtns);
    cy += navBtnH + padC;

    const g = this.add.graphics();
    drawGlowPanel(g, 0, 0, CW, cy, UI.ACCENT_ARCANE, UI.PANEL_BG, 6, 0.98);

    const cx = this.DET_X + (this.DET_W - CW) / 2;
    const cyPos = this.DET_Y + (this.DET_H - cy) / 2;
    this.monsterCard = this.add.container(cx, cyPos, [g, ...parts]).setDepth(50);
  }

  private destroyMonsterCard() {
    if (this.monsterCard) { this.monsterCard.destroy(); this.monsterCard = null; }
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

  /**
   * Lignes de stats affichées dans le panneau détail, selon le type d'objet.
   * Le mainStat (miroir ATK/MATK pour une arme, ligne d'identité pour une
   * armure/accessoire) est affiché en fourchette (`muted: true` → rendu en
   * italique parchemin) au lieu de sa valeur figée — §7.1 : « au lieu des
   * valeurs figées actuelles pour le mainStat ». Le dégât secondaire (non
   * mainStat) et l'ASPD ne roll jamais (§1.3) et restent figés, en gras
   * parchemin. Les SUBSTATS (nombre variable,
   * 1 à 7 lignes) ne sont PAS ici : cette zone a un budget vertical fixe (déjà
   * ~pleine avec 3 lignes) — elles vivent dans le bloc lore scrollable
   * (cf. equipRangeLines + renderDetail).
   */
  private statLines(item: Item): { text: string; muted?: boolean }[] {
    const lines: { text: string; muted?: boolean }[] = [];
    const ranges = isEquipableItem(item) ? item.equipRanges : undefined;

    if ('weaponType' in item) {
      const w = item as Weapon;
      if (ranges) {
        lines.push({ text: formatRangedStatLine(ranges.mainStat), muted: true });
        if (ranges.mainStat.key === 'ATK_FLAT' && w.magicDamage > 0) {
          lines.push({ text: `${t('stats.matk')}: ${w.magicDamage}` });
        } else if (ranges.mainStat.key === 'MATK_FLAT' && w.damage > 0) {
          lines.push({ text: `${t('stats.atk')}: ${w.damage}` });
        }
      } else {
        if (w.damage)      lines.push({ text: `${t('stats.atk')}: ${w.damage}` });
        if (w.magicDamage) lines.push({ text: `${t('stats.matk')}: ${w.magicDamage}` });
      }
      lines.push({ text: `${t('stats.aspd')}: ×${w.attackSpeed.toFixed(1)}` });
    } else if ('defense' in item) {
      const a = item as Armor;
      lines.push({ text: `${t('stats.def')}: ${a.defense}` });
      lines.push({ text: `${t('stats.mdef')}: ${a.magicDefense}` });
      if (ranges) lines.push({ text: formatRangedStatLine(ranges.mainStat), muted: true });
    } else if (ranges) {
      // Accessoires (ring/amulet) : ni arme ni armure — seule la ligne d'identité existe ici.
      lines.push({ text: formatRangedStatLine(ranges.mainStat), muted: true });
    }
    // Le passif n'est PAS inclus ici : il est rendu en tête du viewport
    // scrollable de renderDetail() (gras + couleur or, jamais tronqué) —
    // cf. doc de IDENTITY_RESERVE_PX.
    return lines;
  }

  /**
   * Fourchettes de roll de chaque SUBSTAT (§7.1) — SOURCE : le catalogue
   * (`item.equipRanges`), jamais une instance possédée (l'Arsenal est un
   * glossaire du monde, pas un inventaire). Le mainStat est traité séparément
   * dans `statLines` (zone identité, budget fixe) ; les substats (1 à 7
   * lignes selon la rareté) vivent ici, dans le bloc lore scrollable — seul
   * viewport capable d'absorber un nombre de lignes variable sans déborder.
   * Filet défensif si un item équipable n'a pas encore `equipRanges` : retombe
   * sur les valeurs figées `equipStats` (centre), sinon liste vide (ne
   * devrait plus arriver après la migration de contenu, cf. §6.2).
   */
  private equipRangeLines(item: Item): string[] {
    if (!isEquipableItem(item)) return [];
    const r = item.equipRanges;
    if (r) return r.substats.map(formatRangedStatLine);

    const es = item.equipStats;
    if (es) return es.substats.map(s => StatsSystem.formatStat(s.key, s.value, s.isPercentage));

    return [];
  }

  /** Badge d'info compact — retourne la largeur occupée (badge + marge).
   *  La largeur est MESURÉE en pixels (probe Text, même style que drawBadge) :
   *  l'ancienne estimation `length * 6` était une troncature au caractère
   *  déguisée — fausse dès que la police ou la casse changeait. */
  private addInfoBadge(x: number, cy: number, label: string, bgColor: number, textColor: string): number {
    const probe = this.make.text({ text: label, style: uiStyle(9, textColor, { bold: true }) }, false);
    const w = Math.ceil(probe.width) + 12;
    probe.destroy();
    const badge = drawBadge(this, x + w / 2, cy, label, bgColor, textColor);
    this.detailObjs.push(badge);
    return w + 8;
  }

  private addSectionTitle(label: string, y: number) {
    // Titre de section en TYPE.BODY cyan gras + drawDivider — même convention
    // que les titres de panneaux de l'inventaire (un cran net sous HEADING).
    const txt = this.add.text(this.DET_X + 14, y, label, uiStyle(TYPE.BODY, UI.TXT_CYAN, { bold: true })).setOrigin(0, 0.5);
    const g = this.add.graphics();
    drawDivider(g, this.DET_X + 14 + txt.width + 8, y,
      this.DET_X + this.DET_W - 14 - (this.DET_X + 14 + txt.width + 8), UI.ACCENT_ARCANE, 0.25);
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

    const onWheel = (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      const overLore = p.x >= this.LORE_X && p.x <= this.LORE_X + this.LORE_W
        && p.y >= this.LORE_Y && p.y <= this.LORE_Y + this.LORE_H;
      if (overLore) this.scrollLore(dy > 0 ? LORE_SCROLL_STEP : -LORE_SCROLL_STEP);
      else          this.scroll(dy > 0 ? 1 : -1);
    };
    this.wheelHandler = onWheel;
    this.input.on('wheel', onWheel);

    const onDown = (p: Phaser.Input.Pointer) => {
      if (this.monsterCardJustOpened) { this.monsterCardJustOpened = false; }
      else this.destroyMonsterCard();
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
    this.loreScrollPx = 0;
    this.destroyMonsterCard();
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
    if (this.closing) return;
    this.closing = true;
    closeScreenTransition(this, () => {
      this.scene.stop();
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
    // fondu lancé par portalRedirectTransition(), le listener .once(FADE_OUT_COMPLETE) reste
    // sinon attaché à cameras.main et pourrait se déclencher au prochain fondu avec
    // un callback obsolète — no-op si le fondu s'est déjà terminé normalement.
    // `?.` : au moment où Phaser émet SHUTDOWN, son propre CameraManager.shutdown()
    // a déjà pu remettre `main` à undefined (crash reporté sans ce garde).
    this.cameras.main?.off(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE);
    // Le champ de recherche possède un <input> DOM dans <body> et un listener de
    // resize sur le Scale Manager : sans ce destroy(), l'input SURVIT à la scène
    // (il resterait focalisable, invisible, par-dessus le jeu).
    if (this.search) { this.search.destroy(); this.search = null; }
    this.destroyMonsterCard();
    // Détruit explicitement (pas juste vidage de tableau) : le masque de scroll du
    // bloc lore (renderScrollableText) n'est jamais ajouté à la display list —
    // Phaser ne le nettoie pas tout seul à l'arrêt de la scène.
    this.listObjs.forEach(o => o.destroy());
    this.detailObjs.forEach(o => o.destroy());
    this.listObjs = [];
    this.detailObjs = [];
  }
}
