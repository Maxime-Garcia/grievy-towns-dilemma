import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { PlayerState, TalentNode } from '../types';
import { TALENT_MAP } from '../data/talents';
import { TalentSystem } from '../systems/TalentSystem';
import { InventorySystem } from '../systems/InventorySystem';
import {
  UI, TYPE, LAYOUT, drawGlowPanel, uiStyle, fitText,
  drawConfirmCancelButtons, openScreenTransition, closeScreenTransition,
} from '../utils/UITheme';

// ── Layout constants ──────────────────────────────────────────────────────────
// TAB_H = 44 (au lieu de 36) : les hit zones étaient étirées à 44px par-dessus
// des rangées de 36px — les 4px de chevauchement créaient une bande ambiguë où
// le tap touchait la mauvaise rangée. À 44, hit = rangée, zéro chevauchement.
const TAB_H    = 44;   // height of one tab row (px) — = LAYOUT.TOUCH_MIN
const CLOSE_W  = 44;   // width reserved at end of row-1 for the × button
// 32 → 44 : le header accueille désormais le bouton Respec (hit 44px) — il
// vivait avant en bouton FLOTTANT par-dessus l'arbre, où il chevauchait les
// labels du dernier tier. Un contrôle global (respec, points) appartient au
// header, pas à la zone de contenu.
const HDR_H    = 44;   // branch header height (name + desc + respec + points)
const BOTTOM_H = 150;  // bottom-sheet panel height
// 60 → 52 : libère l'espace vertical nécessaire pour que le LIBELLÉ d'un nœud
// puisse s'écrire sur DEUX lignes (fin des noms tronqués « Braise au P… »).
// La cible tactile ne rétrécit pas : NODE_HIT passe de 7 à 10 (hit 72×72).
const NODE_SZ  = 52;   // node square size (px)
// Entraxe horizontal des nœuds d'un même tier — définit aussi la largeur
// de wrap des libellés (NODE_SPACING - 10).
const NODE_SPACING = 140;
// Calé pour que les branches à 5 TIERS (7 branches en ont) tiennent entre le
// header et la bottom sheet, libellés 2 lignes compris. LABEL_ZONE réserve la
// place du libellé sous le dernier nœud.
const TIER_GAP = 84;   // vertical distance between tier centres
const LABEL_ZONE = 30; // hauteur réservée au libellé (2 lignes) sous chaque nœud
const NODE_HIT = 10;   // extra px on each side to enlarge touch target (hit 72)

// Deux rangées au lieu de trois : rangée 1 = les 3 voies PRIMAIRES, rangée 2 =
// les 7 voies élémentaires. L'ancienne découpe 4+3 des élémentaires était
// arbitraire (aucune sémantique) et empilait trois barres visuellement
// identiques — illisible, et 44px de vertical perdus. Ténèbres (NG+) ferme la
// liste : c'est la voie la plus tardive du jeu.
const TAB_ROW1 = ['VIGOR', 'INSTINCT', 'ARCANE'] as const;
const TAB_ROW2 = ['IGNIS', 'ZEPHYR', 'ABYSSAL', 'TERRA', 'FULGURIS', 'GLACIUS', 'TENEBRES'] as const;
const BRANCH_KEYS: string[] = [...TAB_ROW1, ...TAB_ROW2];
const TAB_ROWS: readonly (readonly string[])[] = [TAB_ROW1, TAB_ROW2];
// Total vertical space occupied by the tab bar (all rows stacked).
const TAB_TOTAL_H = TAB_H * TAB_ROWS.length;

// ── Branch visual metadata ────────────────────────────────────────────────────
const BRANCH_META: Record<string, { label: string; color: number; desc: string }> = {
  VIGOR:    { label: 'Corps',    color: 0xcc3333, desc: 'Force, endurance et puissance physique' },
  INSTINCT: { label: 'Instinct', color: 0xddaa22, desc: 'Vitesse, esquive et réflexes aiguisés' },
  ARCANE:   { label: 'Arcane',   color: 0x9933cc, desc: 'Magie, mana et arts ésotériques' },
  IGNIS:    { label: 'Flamme',   color: 0xff6600, desc: 'Magie du feu, brûlures et explosions' },
  ZEPHYR:   { label: 'Vent',     color: 0x44ddaa, desc: 'Vitesse du vent, dashes et projectiles' },
  ABYSSAL:  { label: 'Abyssal',  color: 0x2255ee, desc: 'Profondeurs, glace et vol de vie' },
  TERRA:    { label: 'Roc',        color: 0xbb7733, desc: 'Terre, poise et résistance au knockback' },
  FULGURIS: { label: 'Étincelle',  color: 0xffdd22, desc: 'Foudre, critiques et vitesse d\'attaque' },
  GLACIUS:  { label: 'Préservation', color: 0xcceeff, desc: 'Glace, réduction de dégâts et survie' },
  TENEBRES: { label: 'Ténèbres', color: 0x7700aa, desc: 'Magie interdite. NG+ uniquement.' },
};

// Branches gatées par un tier 3 d'une branche de base (miroir de TalentSystem.canUnlock).
const BRANCH_GATE_REQUIREMENT: Record<string, string> = {
  IGNIS: 'ARCANE',
  TERRA: 'VIGOR',
  FULGURIS: 'INSTINCT',
};

/** True si la branche `branchKey` est gatée et que le prérequis (tier ≥ 3) n'est pas rempli. */
function isBranchGateUnmet(player: PlayerState, branchKey: string): boolean {
  switch (BRANCH_GATE_REQUIREMENT[branchKey]) {
    case 'ARCANE':   return !TalentSystem.hasArcaneTier3(player);
    case 'VIGOR':    return !TalentSystem.hasVigorTier3(player);
    case 'INSTINCT': return !TalentSystem.hasInstinctTier3(player);
    default:         return false;
  }
}

// Points-spent gate per tier (mirrors TalentSystem.canUnlock logic)
const TIER_GATE: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 2, 3: 4, 4: 6, 5: 10 };

// ── Node status ───────────────────────────────────────────────────────────────
type NodeStatus = 'unlocked' | 'available' | 'locked' | 'ngplus_only';

function getNodeStatus(player: PlayerState, nodeId: string): NodeStatus {
  const node = TALENT_MAP[nodeId];
  if (!node) return 'locked';
  // Forward-compat cast: future branches (IGNIS etc.) won't be in TalentBranch enum yet
  if ((node.branch as string) === 'TENEBRES' && !player.isNewGamePlus) return 'ngplus_only';
  if (player.unlockedTalents.includes(nodeId)) return 'unlocked';
  if (TalentSystem.canUnlock(player, nodeId)) return 'available';
  return 'locked';
}

// ── Tier vertical centre ──────────────────────────────────────────────────────
function tierCenterY(tier: number, screenH: number, maxTier = 4): number {
  const contentTop    = TAB_TOTAL_H + HDR_H;
  // -LABEL_ZONE : le libellé du DERNIER tier vit sous son nœud — sans cette
  // réserve, le centrage le poussait sous la bottom sheet (débordement tier 5).
  const contentBottom = screenH - BOTTOM_H - LABEL_ZONE;
  const available     = contentBottom - contentTop;
  const topMax        = Math.max(4, maxTier);
  const totalSpan     = (topMax - 1) * TIER_GAP + NODE_SZ;
  const topPad        = Math.max(10, (available - totalSpan) / 2);
  return contentTop + topPad + NODE_SZ / 2 + (tier - 1) * TIER_GAP;
}

// ── Node X positions for a tier with `count` nodes ───────────────────────────
// 110 → 140 : profite des 960px de large — les libellés sous les nœuds ont de
// la place (wrap 2 lignes) au lieu d'être tronqués.
function tierNodeXs(count: number, centerX: number, spacing = NODE_SPACING): number[] {
  return Array.from({ length: count }, (_, i) =>
    centerX + (i - (count - 1) / 2) * spacing,
  );
}

// NOTE : l'ancien formatEffects() (reformulation mécanique des `effects` typés)
// a été SUPPRIMÉ de la bottom sheet — il redisait mot pour mot ce que la
// `description` manuscrite du nœud affichait juste au-dessus (vérifié sur les
// 87 nœuds : la description couvre 100% des effects, et porte EN PLUS le
// contexte — armes ciblées, conditions, cumuls). Une seule formulation.

// ─────────────────────────────────────────────────────────────────────────────
export class SkillScene extends Phaser.Scene {
  private gameScene!:      GameScene;
  private player!:         PlayerState;
  private activeBranch   = 'VIGOR';
  private selectedNodeId: string | null = null;

  // Dynamic buckets — rebuilt on every branch/selection change
  private dynamicObjs: Phaser.GameObjects.GameObject[] = [];
  private sheetObjs:   Phaser.GameObjects.GameObject[] = [];
  // Modal de confirmation du respec (action destructrice — jamais en 1 tap)
  private modalObjs:   Phaser.GameObjects.GameObject[] = [];
  private modalOpen  = false;
  // True dès que l'animation de FERMETURE (closeScreenTransition, ~170ms) est en
  // cours — ignore tout nouvel appel à close() tant qu'elle tourne (évite un
  // scene.stop() dupliqué si × est cliqué puis ESC pressé pendant le fondu).
  // Même patron que BestiaryScene/ArsenalScene.
  private closing    = false;

  // Persistent tab objects (updated, never destroyed mid-session)
  private tabBgGraphics: Phaser.GameObjects.Graphics[] = [];
  private tabTextObjs:   Phaser.GameObjects.Text[]     = [];
  // Géométrie des onglets, calculée une fois (rangée 2 = largeurs
  // PROPORTIONNELLES aux labels : aucun label d'onglet ne peut être tronqué).
  private tabRects: { key: string; x: number; y: number; w: number; h: number; row: number }[] = [];

  // Persistent header refs
  private branchNameTxt!: Phaser.GameObjects.Text;
  private branchDescTxt!: Phaser.GameObjects.Text;
  private pointsText!:    Phaser.GameObjects.Text;

  // Micro-feedback (dette D4) : le re-render complet est conservé, mais le nœud
  // qu'on vient de sélectionner « pop » et le nœud débloqué flashe en blanc.
  private pulseNodeId:       string | null = null;
  private unlockFlashNodeId: string | null = null;

  // Swipe state
  private swipeX       = 0;
  private swipeY       = 0;
  private swipeActive  = false;
  private readonly SWIPE_MIN  = 60;
  private readonly SWIPE_YMAX = 40;

  constructor() { super({ key: 'SkillScene' }); }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  init(data: { gameScene: GameScene }) {
    this.gameScene          = data.gameScene;
    this.player             = data.gameScene.gameState.player;
    this.activeBranch       = 'VIGOR';
    this.selectedNodeId     = null;
    this.modalOpen          = false;
    this.pulseNodeId        = null;
    this.unlockFlashNodeId  = null;
    this.closing            = false;
  }

  create() {
    // Phaser n'appelle PAS scene.shutdown() de lui-même : Systems.shutdown() se
    // contente d'ÉMETTRE l'événement SHUTDOWN. Sans cette ligne, la méthode
    // shutdown() ci-dessous est du CODE MORT — les listeners qu'elle est censée
    // retirer survivent à la scène, et chaque create() en empile une couche de plus.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    openScreenTransition(this);

    // Full-screen dark overlay (0.88 standard — le jeu reste visible derrière)
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);

    // Outer frame (fond translucide 0.85) — panneau arrondi arcane fresh
    const frame = this.add.graphics();
    drawGlowPanel(frame, 4, 4, W - 8, H - 8, UI.ACCENT_ARCANE, UI.BG_DEEP, 10, 0.85);

    this.buildTabs(W);
    this.buildBranchHeader(W);
    this.buildCloseButton(W);
    this.setupSwipe();

    this.renderBranch(this.activeBranch);
  }

  shutdown() {
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointerup',   this.onPointerUp,   this);
    this.clearDynamic();
    this.clearSheet();
    this.clearModal();
    this.gameScene?.setPaused(false);
  }

  // ── Tab bar ───────────────────────────────────────────────────────────────

  /**
   * Calcule la géométrie des deux rangées d'onglets, UNE fois.
   * Rangée 1 : 3 largeurs égales (moins le slot du ×).
   * Rangée 2 : 7 largeurs PROPORTIONNELLES à la largeur réelle du label
   * (mesure par Text jetable) puis mises à l'échelle pour remplir W —
   * « Préservation » et « Roc » n'ont pas besoin de la même place, et aucun
   * label ne peut être tronqué quelle que soit la police.
   */
  private computeTabLayout(W: number) {
    this.tabRects = [];

    // Row 1 — primary branches, equal widths
    const row1W = W - CLOSE_W;
    const tab1W = Math.floor(row1W / TAB_ROW1.length);
    TAB_ROW1.forEach((key, i) => {
      const x = i * tab1W;
      const w = i === TAB_ROW1.length - 1 ? row1W - x : tab1W;
      this.tabRects.push({ key, x, y: 0, w, h: TAB_H, row: 0 });
    });

    // Row 2 — elemental branches, label-proportional widths
    const probeStyle = uiStyle(TYPE.BODY, UI.TXT_MUTED, { bold: true });
    const natural = TAB_ROW2.map(key => {
      const probe = this.make.text({ text: BRANCH_META[key]?.label ?? key, style: probeStyle }, false);
      const w = probe.width + 22; // padding minimal de part et d'autre
      probe.destroy();
      return Math.max(w, LAYOUT.TOUCH_MIN);
    });
    const total = natural.reduce((a, b) => a + b, 0);
    const scale = W / total;
    let x2 = 0;
    TAB_ROW2.forEach((key, i) => {
      const w = i === TAB_ROW2.length - 1
        ? W - x2                                   // le dernier absorbe l'arrondi
        : Math.round(natural[i]! * scale);
      this.tabRects.push({ key, x: x2, y: TAB_H, w, h: TAB_H, row: 1 });
      x2 += w;
    });
  }

  private buildTabs(W: number) {
    this.tabBgGraphics = [];
    this.tabTextObjs   = [];
    this.computeTabLayout(W);

    for (const rect of this.tabRects) {
      const meta = BRANCH_META[rect.key];

      const bg = this.add.graphics().setDepth(2);
      this.tabBgGraphics.push(bg);
      this.paintTab(bg, rect);

      // Onglets = navigation primaire : TYPE.BODY (14), pas du micro-texte.
      const txt = this.add.text(
        rect.x + rect.w / 2,
        rect.y + rect.h / 2,
        meta?.label ?? rect.key,
        uiStyle(TYPE.BODY, this.tabLabelColor(rect.key), { bold: true }),
      ).setOrigin(0.5).setDepth(3);
      this.tabTextObjs.push(txt);

      // Touch target — min 44 × 44 px (TAB_H = 44, la rangée EST la hit zone)
      const hit = this.add.rectangle(
        rect.x + rect.w / 2, rect.y + rect.h / 2,
        Math.max(rect.w, LAYOUT.TOUCH_MIN), Math.max(rect.h, LAYOUT.TOUCH_MIN), 0, 0,
      ).setInteractive({ useHandCursor: true }).setDepth(4);
      hit.on('pointerdown', () => this.switchBranch(rect.key));
    }
  }

  /**
   * Couleur du label d'onglet : blanc si actif, fantôme (TXT_HINT) si la
   * branche est verrouillée (gate tier 3 non rempli, ou Ténèbres hors NG+) —
   * le joueur voit d'un coup d'œil où il PEUT investir —, muted sinon.
   */
  private tabLabelColor(branchKey: string): string {
    if (branchKey === this.activeBranch) return UI.TXT_WHITE;
    if (branchKey === 'TENEBRES' && !this.player.isNewGamePlus) return UI.TXT_HINT;
    if (isBranchGateUnmet(this.player, branchKey)) return UI.TXT_HINT;
    return UI.TXT_MUTED;
  }

  private paintTab(
    g: Phaser.GameObjects.Graphics,
    rect: { key: string; x: number; y: number; w: number; h: number; row: number },
  ) {
    g.clear();
    const { x, y, w, h } = rect;
    const meta     = BRANCH_META[rect.key];
    const color    = meta?.color ?? 0x333333;
    const isActive = rect.key === this.activeBranch;
    // Rangée 2 (élémentaire) légèrement plus sombre : hiérarchie visuelle entre
    // la rangée primaire et la rangée secondaire, sans troisième barre.
    const idleBg = rect.row === 0 ? 0x0e0e1c : 0x0a0a14;

    g.fillStyle(isActive ? color : idleBg, isActive ? 0.85 : 1);
    g.fillRect(x, y, w, h);

    g.lineStyle(1, isActive ? color : 0x2a2a3a, 1);
    g.strokeRect(x, y, w, h);

    if (isActive) {
      // Bottom accent stripe
      g.lineStyle(3, color, 1);
      g.beginPath();
      g.moveTo(x + 6, y + h - 1);
      g.lineTo(x + w - 6, y + h - 1);
      g.strokePath();
    } else {
      // Liseré bas discret à la couleur de la branche : chaque onglet garde son
      // identité colorée même inactif (repérage rapide, réf. onglets Genshin).
      g.lineStyle(2, color, 0.28);
      g.beginPath();
      g.moveTo(x + 6, y + h - 1);
      g.lineTo(x + w - 6, y + h - 1);
      g.strokePath();
    }
  }

  private refreshTabs() {
    this.tabRects.forEach((rect, idx) => {
      const bg  = this.tabBgGraphics[idx];
      const txt = this.tabTextObjs[idx];
      if (bg)  this.paintTab(bg, rect);
      if (txt) txt.setColor(this.tabLabelColor(rect.key));
    });
  }

  // ── Branch header ─────────────────────────────────────────────────────────

  // Largeur réservée à droite du header : bouton Respec (RESPEC_W) + compteur
  // de points (~90px) + gouttières. La description est tronquée (fitText) pour
  // ne JAMAIS passer dessous — c'était le chevauchement reproché à l'écran.
  private static readonly RESPEC_W    = 150;
  private static readonly PTS_RESERVE = 92;
  private static readonly HDR_RIGHT_RESERVE =
    SkillScene.RESPEC_W + SkillScene.PTS_RESERVE + 14 + 8 + 12;

  private buildBranchHeader(W: number) {
    const y = TAB_TOTAL_H;

    // Separator between tabs and header
    const sep = this.add.graphics();
    sep.lineStyle(1, UI.BORDER_LIT, 0.45);
    sep.lineBetween(8, y, W - 8, y);

    // Nom de branche en HEADING (21) + description en BODY muted SUR LA MÊME
    // LIGNE (au lieu d'empilées) : hiérarchie nette sans grossir le header.
    this.branchNameTxt = this.add.text(
      14, y + 10,
      '',
      uiStyle(TYPE.HEADING, UI.TXT_GOLD, { bold: true, stroke: true }),
    ).setDepth(2);

    this.branchDescTxt = this.add.text(
      0, y + 16,
      '',
      uiStyle(TYPE.BODY, UI.TXT_MUTED),
    ).setDepth(2);

    // Compteur de points = LA ressource de l'écran : doré quand il reste des
    // points à dépenser, muted quand il n'y en a plus.
    this.pointsText = this.add.text(
      W - 14, y + HDR_H / 2,
      '',
      uiStyle(TYPE.BODY, UI.TXT_GOLD, { bold: true }),
    ).setOrigin(1, 0.5).setDepth(2);

    this.refreshBranchHeader();
  }

  private buildPointsLabel(): string {
    const n = this.player.talentPoints;
    return `✶ ${n} pt${n !== 1 ? 's' : ''}`;
  }

  private refreshBranchHeader() {
    const W    = this.cameras.main.width;
    const meta = BRANCH_META[this.activeBranch];
    this.branchNameTxt?.setText(meta?.label ?? this.activeBranch);

    // La description est inline à droite du nom — recalée sur la largeur du
    // nom et TRONQUÉE en pixels pour s'arrêter avant le bouton Respec.
    if (this.branchNameTxt && this.branchDescTxt) {
      const descX = 14 + this.branchNameTxt.width + 12;
      const maxW  = W - SkillScene.HDR_RIGHT_RESERVE - descX;
      const style = uiStyle(TYPE.BODY, UI.TXT_MUTED);
      this.branchDescTxt.setX(descX);
      this.branchDescTxt.setText(maxW > 30 ? fitText(this, meta?.desc ?? '', style, maxW) : '');
    }

    if (this.pointsText) {
      this.pointsText.setText(this.buildPointsLabel());
      this.pointsText.setColor(this.player.talentPoints > 0 ? UI.TXT_GOLD : UI.TXT_MUTED);
    }
  }

  // ── Close button ──────────────────────────────────────────────────────────

  private buildCloseButton(W: number) {
    // Sits in the top-right slot carved out of tab row 1
    const bx = W - CLOSE_W;
    const by = 0;
    const bw = CLOSE_W;
    const bh = TAB_H;

    const bg = this.add.graphics().setDepth(2);
    bg.fillStyle(0x1a0a0a, 1);
    bg.fillRect(bx, by, bw, bh);
    bg.lineStyle(1, 0x441111, 1);
    bg.strokeRect(bx, by, bw, bh);

    this.add.text(bx + bw / 2, by + bh / 2, '×', uiStyle(20, UI.TXT_RED, { bold: true, stroke: true }))
      .setOrigin(0.5).setDepth(3);

    // Touch target ≥ 44 × 44
    const hit = this.add.rectangle(bx + bw / 2, by + bh / 2, Math.max(bw, 44), Math.max(bh, 44), 0, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(4);
    hit.on('pointerdown', () => this.close());
    hit.on('pointerover', () => bg.setAlpha(0.7));
    hit.on('pointerout',  () => bg.setAlpha(1.0));
  }

  // ── Branch switching ──────────────────────────────────────────────────────

  private switchBranch(branchKey: string) {
    if (branchKey === this.activeBranch) return;
    this.activeBranch   = branchKey;
    this.selectedNodeId = null;
    this.refreshTabs();
    this.refreshBranchHeader();
    this.renderBranch(branchKey);
  }

  // ── Tree rendering ────────────────────────────────────────────────────────

  private renderBranch(branchKey: string) {
    this.clearDynamic();
    this.clearSheet();

    const W    = this.cameras.main.width;
    const H    = this.cameras.main.height;
    const meta = BRANCH_META[branchKey];
    const branchColor = meta?.color ?? 0x666666;

    // Forward-compat filter: cast branch to string for future non-enum branches
    const nodes = Object.values(TALENT_MAP).filter(
      n => (n.branch as string) === branchKey,
    );

    const isNgpLocked = branchKey === 'TENEBRES' && !this.player.isNewGamePlus;

    if (nodes.length === 0) {
      this.renderEmptyBranch(W, H, branchColor);
    } else {
      this.renderTree(nodes, W, H, branchColor, isNgpLocked);
    }

    if (isNgpLocked) {
      this.renderNgpOverlay(W, H);
    }

    this.renderHeaderRespec(W);
    this.renderBottomSheet(this.selectedNodeId, branchColor, W, H);
  }

  private renderEmptyBranch(W: number, H: number, branchColor: number) {
    const cy = TAB_TOTAL_H + HDR_H + (H - TAB_TOTAL_H - HDR_H - BOTTOM_H) / 2;

    // Decorative divider
    const g = this.add.graphics().setDepth(5);
    g.lineStyle(1, branchColor, 0.25);
    g.lineBetween(W * 0.2, cy - 24, W * 0.8, cy - 24);
    this.dynamicObjs.push(g);

    const t = this.add.text(W / 2, cy,
      'Cette voie n\'est pas encore\ndécouverte...',
      uiStyle(12, UI.TXT_HINT, { align: 'center', wordWrapWidth: W - 80 }),
    ).setOrigin(0.5).setDepth(5);
    this.dynamicObjs.push(t);
  }

  private renderTree(
    nodes: TalentNode[],
    W: number, H: number,
    branchColor: number,
    isNgpLocked: boolean,
  ) {
    // Group nodes by tier
    const byTier = new Map<number, TalentNode[]>();
    for (const n of nodes) {
      const list = byTier.get(n.tier) ?? [];
      list.push(n);
      byTier.set(n.tier, list);
    }

    const tiers   = [...byTier.keys()].sort((a, b) => a - b);
    const maxTier = tiers[tiers.length - 1] ?? 4;
    const centerX = W / 2;

    // Pre-compute (cx, cy) per node id
    const nodePos = new Map<string, { cx: number; cy: number }>();
    tiers.forEach(tier => {
      const tierNodes = byTier.get(tier)!;
      const cy  = tierCenterY(tier, H, maxTier);
      const cxs = tierNodeXs(tierNodes.length, centerX);
      tierNodes.forEach((node, i) => {
        nodePos.set(node.id, { cx: cxs[i]!, cy });
      });
    });

    // Connection lines (tier N → tier N+1)
    const lineG = this.add.graphics().setDepth(5);
    this.dynamicObjs.push(lineG);

    for (let t = 0; t < tiers.length - 1; t++) {
      const tA = tiers[t]!;
      const tB = tiers[t + 1]!;
      const nA = byTier.get(tA)!;
      const nB = byTier.get(tB)!;

      for (const a of nA) {
        for (const b of nB) {
          const pa = nodePos.get(a.id)!;
          const pb = nodePos.get(b.id)!;
          const bothUnlocked =
            this.player.unlockedTalents.includes(a.id) &&
            this.player.unlockedTalents.includes(b.id);
          const color = bothUnlocked ? branchColor : 0x2a2a3a;
          const alpha = isNgpLocked ? 0.15 : bothUnlocked ? 0.8 : 0.4;
          lineG.lineStyle(2, color, alpha);
          lineG.lineBetween(pa.cx, pa.cy + NODE_SZ / 2, pb.cx, pb.cy - NODE_SZ / 2);
        }
      }
    }

    // Nodes
    nodePos.forEach(({ cx, cy }, nodeId) => {
      const node   = TALENT_MAP[nodeId]!;
      const status = isNgpLocked ? 'ngplus_only' : getNodeStatus(this.player, nodeId);
      const isSelected = this.selectedNodeId === nodeId;
      this.buildNode(cx, cy, node, status, branchColor, isSelected);
    });
  }

  // ── Single node visual ────────────────────────────────────────────────────

  private buildNode(
    cx: number, cy: number,
    node: TalentNode,
    status: NodeStatus,
    branchColor: number,
    isSelected: boolean,
  ) {
    const x = cx - NODE_SZ / 2;
    const y = cy - NODE_SZ / 2;

    const g = this.add.graphics().setDepth(6);
    this.dynamicObjs.push(g);

    switch (status) {
      case 'unlocked':
        g.fillStyle(branchColor, 1);
        g.fillRect(x, y, NODE_SZ, NODE_SZ);
        g.lineStyle(2, 0xffffff, 1);
        g.strokeRect(x, y, NODE_SZ, NODE_SZ);
        break;

      case 'available':
        g.fillStyle(branchColor, 0.28);
        g.fillRect(x, y, NODE_SZ, NODE_SZ);
        g.lineStyle(2, branchColor, 1);
        g.strokeRect(x, y, NODE_SZ, NODE_SZ);
        // Inner glow ring
        g.lineStyle(1, branchColor, 0.35);
        g.strokeRect(x + 3, y + 3, NODE_SZ - 6, NODE_SZ - 6);
        break;

      case 'locked':
        g.fillStyle(0x14141e, 1);
        g.fillRect(x, y, NODE_SZ, NODE_SZ);
        g.lineStyle(1, 0x2a2a3a, 1);
        g.strokeRect(x, y, NODE_SZ, NODE_SZ);
        break;

      case 'ngplus_only':
        g.fillStyle(0x0e0e14, 1);
        g.fillRect(x, y, NODE_SZ, NODE_SZ);
        g.lineStyle(1, 0x440066, 0.7);
        g.strokeRect(x, y, NODE_SZ, NODE_SZ);
        // Diagonal cross
        g.lineStyle(1, 0x3a3a3a, 0.6);
        g.lineBetween(x + 8, y + 8, x + NODE_SZ - 8, y + NODE_SZ - 8);
        g.lineBetween(x + NODE_SZ - 8, y + 8, x + 8, y + NODE_SZ - 8);
        break;
    }

    // Selection ring
    if (isSelected) {
      g.lineStyle(2, UI.CORNER, 1);
      g.strokeRect(x - 4, y - 4, NODE_SZ + 8, NODE_SZ + 8);
    }

    // Icon
    let iconObj: Phaser.GameObjects.Image | Phaser.GameObjects.Text | null = null;
    if (status !== 'ngplus_only') {
      const alpha = status === 'locked' ? 0.3 : 1;
      if (this.textures.exists(node.icon)) {
        const img = this.add.image(cx, cy, node.icon)
          .setDisplaySize(32, 32)
          .setAlpha(alpha)
          .setDepth(7);
        this.dynamicObjs.push(img);
        iconObj = img;
      } else {
        const fb = this.add.text(cx, cy, `T${node.tier}`, uiStyle(12, '#ffffff', { bold: true, stroke: true }))
          .setOrigin(0.5).setAlpha(alpha).setDepth(7);
        this.dynamicObjs.push(fb);
        iconObj = fb;
      }
    }

    // Micro-feedback D4 : le nœud qu'on vient de sélectionner « pop » (l'icône
    // retombe à sa taille en 130ms) — le re-render sec ne suffisait pas à
    // localiser la sélection du regard.
    if (iconObj && this.pulseNodeId === node.id) {
      this.pulseNodeId = null;
      const fs = iconObj.scale;
      iconObj.setScale(fs * 1.35);
      this.tweens.add({ targets: iconObj, scale: fs, duration: 130, ease: 'Back.easeOut' });
    }

    // Flash blanc de confirmation sur le nœud fraîchement débloqué (400ms,
    // même langage que le tap-equip de l'inventaire).
    if (status === 'unlocked' && this.unlockFlashNodeId === node.id) {
      this.unlockFlashNodeId = null;
      const flash = this.add.rectangle(cx, cy, NODE_SZ, NODE_SZ, 0xffffff, 0.8).setDepth(9);
      this.dynamicObjs.push(flash);
      this.tweens.add({
        targets: flash, alpha: 0, duration: 400, ease: 'Quad.easeOut',
        onComplete: () => { if (flash.active) flash.destroy(); },
      });
    }

    // Label below node — wrap sur 2 lignes dans l'entraxe (NODE_SPACING - 10) :
    // le nom complet est TOUJOURS visible (fin des « Braise au P… »).
    // Locked = TXT_MUTED (lisible : savoir ce qu'on vise fait partie du jeu),
    // TXT_HINT réservé aux nœuds NG+ volontairement mystérieux.
    const labelColor = status === 'unlocked' ? UI.TXT_GOLD
                     : status === 'available' ? UI.TXT_PARCHMENT
                     : status === 'locked'    ? UI.TXT_MUTED
                     : UI.TXT_HINT;
    const labelTxt = this.add.text(cx, cy + NODE_SZ / 2 + 3, node.name,
      uiStyle(TYPE.SMALL, labelColor, { stroke: true, align: 'center', wordWrapWidth: NODE_SPACING - 10 }))
      .setOrigin(0.5, 0).setDepth(7);
    this.dynamicObjs.push(labelTxt);

    // Interactive touch zone (NODE_SZ + 2×NODE_HIT = 72 px — cible confortable)
    if (status !== 'ngplus_only') {
      const hitSz = NODE_SZ + NODE_HIT * 2;
      const hit   = this.add.rectangle(cx, cy, hitSz, hitSz, 0, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(8);
      this.dynamicObjs.push(hit);

      // Feedback immédiat au pointerdown, ACTION au pointerup + garde de
      // distance : les nœuds vivent dans la zone de swipe — sur pointerdown,
      // commencer un swipe sur un nœud le sélectionnait puis changeait de
      // branche dans la foulée (double action involontaire).
      hit.on('pointerdown', () => {
        if (this.modalOpen) return;
        g.setAlpha(0.7);
      });
      hit.on('pointerup', (p: Phaser.Input.Pointer) => {
        g.setAlpha(1);
        if (this.modalOpen) return;
        if (p.getDistance() > 12) return;   // c'était un swipe, pas un tap
        if (this.selectedNodeId === node.id) {
          // 2e tap sur le nœud déjà sélectionné :
          // - disponible → DÉBLOQUER sur place. Le 1er tap a affiché le détail
          //   (aucune dépense à l'aveugle), le 2e confirme sans trajet de pouce
          //   vers le bouton du bas — affordance écrite dans la ligne de statut.
          // - sinon      → désélectionner (toggle historique conservé).
          if (status === 'available') {
            this.unlockNode(node.id);
            return;
          }
          this.selectedNodeId = null;
          this.pulseNodeId    = null;
          this.renderBranch(this.activeBranch);
          return;
        }
        this.selectedNodeId = node.id;
        this.pulseNodeId    = node.id;
        this.renderBranch(this.activeBranch);
      });
      hit.on('pointerover', () => {
        if (status !== 'unlocked') g.setAlpha(0.8);
      });
      hit.on('pointerout', () => g.setAlpha(1));
    }
  }

  // ── NG+ lock overlay ──────────────────────────────────────────────────────

  private renderNgpOverlay(W: number, H: number) {
    const oy = TAB_TOTAL_H + HDR_H;
    const oh = H - oy - BOTTOM_H;

    const dim = this.add.rectangle(W / 2, oy + oh / 2, W - 16, oh, 0x000000, 0.76).setDepth(15);
    this.dynamicObjs.push(dim);

    const msg = this.add.text(
      W / 2, oy + oh / 2,
      'Je ne suis pas encore capable\nde maîtriser cette magie interdite...',
      uiStyle(13, '#9966cc', { italic: true, align: 'center', wordWrapWidth: W - 80 }),
    ).setOrigin(0.5).setDepth(16);
    this.dynamicObjs.push(msg);
  }

  // ── Respec button (dans le header, plus jamais flottant sur l'arbre) ─────

  private renderHeaderRespec(W: number) {
    const cost      = TalentSystem.respecCost(this.player);
    const hasSpent  = this.player.unlockedTalents.length > 0;
    const canAfford = this.player.gold >= cost;
    const canRespec = hasSpent && canAfford;

    const btnW = SkillScene.RESPEC_W;
    const btnH = 30;
    const btnX = W - 14 - SkillScene.PTS_RESERVE - 8 - btnW;
    const btnY = TAB_TOTAL_H + (HDR_H - btnH) / 2;

    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(canRespec ? 0x1e0a2a : 0x0e0e18, 1);
    bg.fillRoundedRect(btnX, btnY, btnW, btnH, 4);
    bg.lineStyle(1, canRespec ? 0x7700aa : 0x282830, 1);
    bg.strokeRoundedRect(btnX, btnY, btnW, btnH, 4);
    this.dynamicObjs.push(bg);

    const labelColor = canRespec ? '#cc99ff' : UI.TXT_HINT;
    const label      = `↺ Respec — ${cost} or`;
    const txt = this.add.text(btnX + btnW / 2, btnY + btnH / 2, label, uiStyle(10, labelColor, { bold: true }))
      .setOrigin(0.5).setDepth(11);
    this.dynamicObjs.push(txt);

    if (canRespec) {
      // Touch target — min 44 px height (le visuel reste 30, hit invisible 44)
      const hit = this.add.rectangle(
        btnX + btnW / 2, TAB_TOTAL_H + HDR_H / 2,
        btnW, LAYOUT.TOUCH_MIN, 0, 0,
      ).setInteractive({ useHandCursor: true }).setDepth(12);
      this.dynamicObjs.push(hit);

      // Action DESTRUCTRICE (rend tous les talents, débite l'or) → jamais en
      // un seul tap sur mobile : confirmation obligatoire.
      hit.on('pointerdown', () => this.showRespecConfirm(cost));
      hit.on('pointerover', () => bg.setAlpha(0.8));
      hit.on('pointerout',  () => bg.setAlpha(1.0));
    }
  }

  // ── Respec confirmation modal ─────────────────────────────────────────────

  private showRespecConfirm(cost: number) {
    if (this.modalOpen || this.closing) return;
    this.modalOpen = true;

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Voile plein écran : assombrit ET avale tous les taps (topOnly).
    // Tap hors du panneau = annuler (convention popup du projet).
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6)
      .setInteractive()
      .setDepth(40);
    dim.on('pointerdown', () => this.closeRespecConfirm());
    this.modalObjs.push(dim);

    const pw = 420;
    const ph = 168;
    const px = (W - pw) / 2;
    const py = (H - ph) / 2;

    const panel = this.add.graphics().setDepth(41);
    drawGlowPanel(panel, px, py, pw, ph, 0x9933cc, UI.BG_DEEP, 8, 0.97);
    this.modalObjs.push(panel);

    // Bouclier anti-tap-through : un tap SUR le panneau ne doit pas fermer.
    const shield = this.add.rectangle(W / 2, py + ph / 2, pw, ph, 0, 0)
      .setInteractive()
      .setDepth(42);
    this.modalObjs.push(shield);

    const title = this.add.text(W / 2, py + 18, 'Réinitialiser les talents ?',
      uiStyle(TYPE.BODY, UI.TXT_PARCHMENT, { bold: true })).setOrigin(0.5, 0).setDepth(43);
    this.modalObjs.push(title);

    const n = this.player.unlockedTalents.length;
    const body = this.add.text(
      W / 2, py + 46,
      `Rend les points de ${n} talent${n > 1 ? 's' : ''} débloqué${n > 1 ? 's' : ''}.\nCoût : ${cost} or.`,
      uiStyle(TYPE.SMALL, UI.TXT_MUTED, { align: 'center', lineSpacing: 4 }),
    ).setOrigin(0.5, 0).setDepth(43);
    this.modalObjs.push(body);

    const { objects } = drawConfirmCancelButtons(
      this,
      px + 20, py + ph - 56, pw - 40,
      'Réinitialiser', 'Annuler',
      () => this.doRespec(),
      () => this.closeRespecConfirm(),
      LAYOUT.TOUCH_MIN,
    );
    for (const o of objects) {
      (o as Phaser.GameObjects.GameObject & { setDepth?: (d: number) => void }).setDepth?.(43);
      this.modalObjs.push(o);
    }
  }

  private closeRespecConfirm() {
    this.modalOpen = false;
    this.clearModal();
  }

  /**
   * Échap : ferme d'abord la modale de confirmation de respec si elle est ouverte,
   * sinon laisse l'appelant fermer l'écran. Appelé par GameScene.escKey (unique
   * propriétaire de l'ESC — cf. InventoryScene.handleEscape pour le même patron).
   * True = appui CONSOMMÉ, l'écran de talents doit rester ouvert.
   */
  handleEscape(): boolean {
    if (this.modalOpen) { this.closeRespecConfirm(); return true; }
    return false;
  }

  // Public : GameScene (touche K, ESC après handleEscape, action mobile) et le
  // bouton × ci-dessus l'appellent pour fermer avec l'animation symétrique de
  // l'ouverture (closeScreenTransition) au lieu d'un scene.stop() brut — même
  // patron que BestiaryScene.close(). Le setPaused(false) est déjà garanti par
  // shutdown() (rejoué au stop), il n'a donc lieu qu'une fois l'écran dissous.
  public close(): void {
    if (this.closing) return;
    this.closing = true;
    closeScreenTransition(this, () => {
      this.scene.stop();
    });
  }

  private doRespec() {
    if (this.closing) return;
    this.closeRespecConfirm();
    const ok = TalentSystem.respec(this.player);
    if (ok) {
      // Le respec RETIRE tous les bonus de stats de talents : il faut
      // recalculer player.stats, sinon maxHp resterait gonflé après avoir
      // rendu les points (et hp serait clampé de travers au combat suivant).
      InventorySystem.recalcStats(this.player);
      this.selectedNodeId = null;
      this.refreshBranchHeader();
      this.refreshTabs();      // les gates tier 3 peuvent se re-verrouiller
      this.renderBranch(this.activeBranch);
    }
  }

  // ── Unlock (chemin UNIQUE : bouton Débloquer ET 2e tap sur le nœud) ──────

  /**
   * Débloque un talent et resynchronise toute l'UI. Appelé par le bouton
   * « Débloquer » de la bottom sheet ET par le second tap sur un nœud
   * disponible déjà sélectionné — le raccourci mobile : dépenser 3-5 points
   * d'affilée ne demande plus l'aller-retour grille ↔ bas d'écran à chaque
   * nœud, le pouce reste sur place (tap = lire, re-tap = confirmer).
   */
  private unlockNode(nodeId: string) {
    if (this.closing) return;
    const ok = TalentSystem.unlock(this.player, nodeId);
    if (!ok) return;
    // Les talents à stats (MAX_HP_PCT, DEF_PCT, MANA_MAX_PCT…) ne touchent
    // player.stats.maxHp/def/maxMana que via recalcStats — sans cet appel,
    // débloquer +25% HP ne relèverait la barre qu'au prochain changement
    // d'équipement. (atk/crit/lifesteal, eux, sont lus live via computeAll.)
    InventorySystem.recalcStats(this.player);
    this.selectedNodeId    = null;
    this.unlockFlashNodeId = nodeId;   // flash blanc sur le nœud débloqué
    this.refreshBranchHeader();
    this.refreshTabs();                // un gate tier 3 peut venir de s'ouvrir
    this.renderBranch(this.activeBranch);
  }

  // ── Bottom sheet ──────────────────────────────────────────────────────────

  private renderBottomSheet(
    nodeId: string | null,
    branchColor: number,
    W: number,
    H: number,
  ) {
    this.clearSheet();

    const sx = 4;
    const sy = H - BOTTOM_H - 4;
    const sw = W - 8;
    const sh = BOTTOM_H;

    // Panel — bottom sheet arrondi, liseré à la couleur de branche
    const bg = this.add.graphics().setDepth(20);
    drawGlowPanel(bg, sx, sy, sw, sh, branchColor, 0x080812, 8, 0.97);
    // Coloured top accent
    bg.lineStyle(2, branchColor, 0.55);
    bg.lineBetween(sx + 10, sy + 1, sx + sw - 10, sy + 1);
    this.sheetObjs.push(bg);

    if (!nodeId) {
      // Empty state — dit QUOI faire ET rappelle l'affordance de swipe
      // (invisible autrement sur mobile).
      const hint = this.add.text(
        W / 2, sy + sh / 2 - 16,
        'Touche un talent pour voir ses détails',
        uiStyle(TYPE.BODY, UI.TXT_MUTED),
      ).setOrigin(0.5).setDepth(21);
      this.sheetObjs.push(hint);
      const swipeHint = this.add.text(
        W / 2, sy + sh / 2 + 10,
        '← glisse sur l\'arbre pour changer de voie →',
        uiStyle(TYPE.SMALL, UI.TXT_HINT),
      ).setOrigin(0.5).setDepth(21);
      this.sheetObjs.push(swipeHint);
      return;
    }

    const node = TALENT_MAP[nodeId];
    if (!node) return;

    const status = getNodeStatus(this.player, nodeId);

    // ── Left column (icon + name, description = l'effet) ──────────────────
    // Layout en FLUX (chaque bloc sous le précédent) : les anciens y fixes
    // (sy+30/sy+50) faisaient chevaucher les blocs dès 2 lignes.
    const lx  = sx + 12;
    const colW = Math.floor(sw * 0.52) - 10;

    // Icône du talent à gauche du nom : lie visuellement la sheet au nœud
    // sélectionné dans l'arbre (repérage rapide, coût nul).
    let nameX = lx;
    if (this.textures.exists(node.icon)) {
      const icon = this.add.image(lx + 16, sy + 24, node.icon)
        .setDisplaySize(32, 32).setDepth(21);
      this.sheetObjs.push(icon);
      nameX = lx + 40;
    }

    const nameTxt = this.add.text(nameX, sy + 10, node.name,
      uiStyle(TYPE.HEADING, UI.TXT_GOLD, { bold: true, stroke: true })).setDepth(21);
    this.sheetObjs.push(nameTxt);

    // La description manuscrite EST l'effet (formulation unique, cf. note en
    // tête de fichier) → style PRIMAIRE parchemin, plus le muted de l'époque
    // où elle doublonnait avec la liste formatEffects.
    const descTxt = this.add.text(lx, nameTxt.y + nameTxt.height + 6, node.description,
      uiStyle(TYPE.BODY, UI.TXT_PARCHMENT, { wordWrapWidth: colW, lineSpacing: 3 })).setDepth(21);
    this.sheetObjs.push(descTxt);

    // ── Right column (status, cost, lore, unlock button) ─────────────────
    const rx   = sx + Math.floor(sw * 0.54);
    let   ry   = sy + 12;
    const rColW = sw - Math.floor(sw * 0.54) - 10;

    // canUnlock() vérifie déjà les points : 'available' ⟹ coût payable.
    const willShowButton = status === 'available';

    // Coût — affiché UNE seule fois, là où il sert :
    // - débloquable   → porté par le bouton « Débloquer — N pt(s) », pas de ligne
    // - verrouillé/NG+ → ligne dorée (info de planification de build)
    // - déjà débloqué → nulle part (points déjà dépensés : info morte)
    if (!willShowButton && status !== 'unlocked') {
      const costTxt = this.add.text(
        rx, ry,
        `Coût : ${node.cost} point${node.cost !== 1 ? 's' : ''}`,
        uiStyle(TYPE.BODY, UI.TXT_GOLD, { bold: true }),
      ).setDepth(21);
      this.sheetObjs.push(costTxt);
      ry += costTxt.height + 6;
    }

    // Status
    let statusStr: string;
    let statusColor: string;
    switch (status) {
      case 'unlocked':
        statusStr   = 'DÉBLOQUÉ ✓';
        statusColor = UI.TXT_GREEN;
        break;
      case 'available':
        // La ligne de statut porte AUSSI l'affordance du raccourci mobile
        // (2e tap sur le nœud = débloquer) — un élément, deux infos.
        statusStr   = 'Disponible — retouche le nœud pour débloquer';
        statusColor = UI.TXT_PARCHMENT;
        break;
      case 'locked': {
        const branchKey = node.branch as string;
        if (isBranchGateUnmet(this.player, branchKey)) {
          const reqBranch = BRANCH_GATE_REQUIREMENT[branchKey]!;
          const reqLabel  = BRANCH_META[reqBranch]?.label ?? reqBranch;
          statusStr = `Verrouillé — nécessite ${reqLabel} tier 3`;
        } else {
          const spent     = TalentSystem.pointsSpentInBranch(this.player, node.branch);
          const need      = TIER_GATE[node.tier];
          const remaining = Math.max(0, need - spent);
          if (remaining > 0) {
            statusStr = `Verrouillé — encore ${remaining} pt${remaining > 1 ? 's' : ''} requis`;
          } else {
            statusStr = 'Verrouillé — points insuffisants';
          }
        }
        statusColor = UI.TXT_MUTED;
        break;
      }
      case 'ngplus_only':
        statusStr   = 'NG+ uniquement';
        statusColor = '#9966cc';
        break;
    }

    const statusTxt = this.add.text(rx, ry, statusStr,
      uiStyle(TYPE.BODY, statusColor, { wordWrapWidth: rColW })).setDepth(21);
    this.sheetObjs.push(statusTxt);
    ry += statusTxt.height + 8;

    // Lore snippet — tronqué par HAUTEUR MESURÉE (l'ancien slice(0, 71)
    // tronquait au caractère, aveugle au wrap réel) : on coupe jusqu'à ce que
    // le bloc tienne au-dessus du bouton Débloquer / du bas de la sheet.
    if (node.lore && ry < sy + sh - 30) {
      const maxLoreH = (sy + sh - (willShowButton ? 56 : 10)) - ry;
      if (maxLoreH > 14) {
        const loreStyle = uiStyle(TYPE.SMALL, UI.TXT_HINT, { italic: true, wordWrapWidth: rColW, lineSpacing: 3 });
        let loreStr = `"${node.lore}"`;
        const loreTxt = this.add.text(rx, ry, loreStr, loreStyle).setDepth(21);
        while (loreTxt.height > maxLoreH && loreStr.length > 14) {
          loreStr = `${loreStr.slice(0, loreStr.length - 14).trimEnd()}…"`;
          loreTxt.setText(loreStr);
        }
        this.sheetObjs.push(loreTxt);
      }
    }

    // Unlock button (canUnlock inclut déjà la vérification du coût en points)
    if (willShowButton) {
      // 150 → 170 : le label embarque désormais le coût (« Débloquer — 3 pts »)
      const btnW = 170;
      const btnH = 40;
      const btnX = sx + sw - btnW - 8;
      const btnY = sy + sh - btnH - 8;

      const btnBg = this.add.graphics().setDepth(22);
      btnBg.fillStyle(branchColor, 0.88);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 5);
      btnBg.lineStyle(2, 0xffffff, 0.45);
      btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 5);
      this.sheetObjs.push(btnBg);

      const btnTxt = this.add.text(
        btnX + btnW / 2, btnY + btnH / 2,
        `Débloquer — ${node.cost} pt${node.cost !== 1 ? 's' : ''}`,
        uiStyle(13, UI.TXT_WHITE, { bold: true, stroke: true }),
      ).setOrigin(0.5).setDepth(23);
      this.sheetObjs.push(btnTxt);

      const btnHit = this.add.rectangle(btnX + btnW / 2, btnY + btnH / 2, btnW + 8, Math.max(44, btnH + 4), 0, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(24);
      this.sheetObjs.push(btnHit);

      btnHit.on('pointerdown', () => {
        if (this.modalOpen) return;
        this.unlockNode(nodeId);
      });
      btnHit.on('pointerover', () => btnBg.setAlpha(0.7));
      btnHit.on('pointerout',  () => btnBg.setAlpha(1.0));
    }
  }

  // ── Swipe detection ───────────────────────────────────────────────────────

  private setupSwipe() {
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointerup',   this.onPointerUp,   this);
  }

  private onPointerDown(p: Phaser.Input.Pointer) {
    // Only track swipes in the TREE area : sous le header ET au-dessus de la
    // bottom sheet. L'ancienne borne (header seul) faisait qu'un glissement
    // partant du bouton « Débloquer » déclenchait l'unlock PUIS changeait de
    // branche — deux actions pour un seul geste.
    if (this.modalOpen) return;
    if (p.y < TAB_TOTAL_H + HDR_H) return;
    if (p.y > this.cameras.main.height - BOTTOM_H - 4) return;
    this.swipeX      = p.x;
    this.swipeY      = p.y;
    this.swipeActive = true;
  }

  private onPointerUp(p: Phaser.Input.Pointer) {
    if (!this.swipeActive) return;
    this.swipeActive = false;
    if (this.modalOpen) return;

    const dx  = p.x - this.swipeX;
    const ady = Math.abs(p.y - this.swipeY);

    if (ady > this.SWIPE_YMAX)          return; // vertical — ignore
    if (Math.abs(dx) < this.SWIPE_MIN)  return; // too short — ignore

    const dir        = dx < 0 ? 1 : -1;
    const currentIdx = BRANCH_KEYS.indexOf(this.activeBranch);
    if (currentIdx < 0) return;
    const nextIdx = (currentIdx + dir + BRANCH_KEYS.length) % BRANCH_KEYS.length;
    const nextKey = BRANCH_KEYS[nextIdx];
    if (nextKey !== undefined) this.switchBranch(nextKey);
  }

  // ── Cleanup helpers ───────────────────────────────────────────────────────

  private clearDynamic() {
    for (const obj of this.dynamicObjs) {
      if (obj.active) obj.destroy();
    }
    this.dynamicObjs = [];
  }

  private clearSheet() {
    for (const obj of this.sheetObjs) {
      if (obj.active) obj.destroy();
    }
    this.sheetObjs = [];
  }

  private clearModal() {
    for (const obj of this.modalObjs) {
      if (obj.active) obj.destroy();
    }
    this.modalObjs = [];
  }
}
