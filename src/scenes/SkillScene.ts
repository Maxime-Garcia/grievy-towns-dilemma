import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { PlayerState, TalentNode, TalentEffectKey } from '../types';
import { TALENT_MAP } from '../data/talents';
import { TalentSystem } from '../systems/TalentSystem';
import { UI, drawPanel, pxStyle } from '../utils/UITheme';

// ── Layout constants ──────────────────────────────────────────────────────────
const TAB_H    = 36;   // height of one tab row (px)
const CLOSE_W  = 44;   // width reserved at end of row-1 for the × button
const HDR_H    = 28;   // branch header height (name + points counter)
const BOTTOM_H = 148;  // bottom-sheet panel height
const NODE_SZ  = 60;   // node square size (px)
const TIER_GAP = 90;   // vertical distance between tier centres
const NODE_HIT = 7;    // extra px on each side to enlarge touch target

const TAB_ROW1 = ['VIGOR', 'INSTINCT', 'ARCANE'] as const;
const TAB_ROW2 = ['IGNIS', 'ZEPHYR', 'ABYSSAL', 'TENEBRES'] as const;
const BRANCH_KEYS: string[] = [...TAB_ROW1, ...TAB_ROW2];

// ── Branch visual metadata ────────────────────────────────────────────────────
const BRANCH_META: Record<string, { label: string; color: number; desc: string }> = {
  VIGOR:    { label: 'Corps',    color: 0xcc3333, desc: 'Force, endurance et puissance physique' },
  INSTINCT: { label: 'Instinct', color: 0xddaa22, desc: 'Vitesse, esquive et réflexes aiguisés' },
  ARCANE:   { label: 'Arcane',   color: 0x9933cc, desc: 'Magie, mana et arts ésotériques' },
  IGNIS:    { label: 'Flamme',   color: 0xff6600, desc: 'Magie du feu, brûlures et explosions' },
  ZEPHYR:   { label: 'Vent',     color: 0x44ddaa, desc: 'Vitesse du vent, dashes et projectiles' },
  ABYSSAL:  { label: 'Abyssal',  color: 0x2255ee, desc: 'Profondeurs, glace et vol de vie' },
  TENEBRES: { label: 'Ténèbres', color: 0x7700aa, desc: 'Magie interdite. NG+ uniquement.' },
};

// Points-spent gate per tier (mirrors TalentSystem.canUnlock logic)
const TIER_GATE: Record<1 | 2 | 3 | 4, number> = { 1: 0, 2: 2, 3: 4, 4: 6 };

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
function tierCenterY(tier: number, screenH: number): number {
  const contentTop    = TAB_H * 2 + HDR_H;         // 100 at 600 px
  const contentBottom = screenH - BOTTOM_H;         // 452 at 600 px
  const available     = contentBottom - contentTop;
  // span: 3 gaps + 1 node height to cover tiers 1-4
  const totalSpan = (4 - 1) * TIER_GAP + NODE_SZ;  // 270 + 60 = 330
  const topPad    = Math.max(10, (available - totalSpan) / 2);
  return contentTop + topPad + NODE_SZ / 2 + (tier - 1) * TIER_GAP;
}

// ── Node X positions for a tier with `count` nodes ───────────────────────────
function tierNodeXs(count: number, centerX: number, spacing = 110): number[] {
  return Array.from({ length: count }, (_, i) =>
    centerX + (i - (count - 1) / 2) * spacing,
  );
}

// ── Effect description formatter (type-safe, no any) ─────────────────────────
function formatEffects(effects: Partial<Record<TalentEffectKey, number>>): string {
  const l: string[] = [];
  if (effects.MELEE_DMG_PCT          !== undefined) l.push(`+${effects.MELEE_DMG_PCT}% dégâts mêlée`);
  if (effects.DEF_PCT                !== undefined) l.push(`+${effects.DEF_PCT}% DEF`);
  if (effects.KILL_HEAL_PCT          !== undefined) l.push(`+${effects.KILL_HEAL_PCT}% HP par kill`);
  if (effects.WINDUP_ARMOR           !== undefined) l.push('Armure pendant windup (GS/HAMMER/AXE)');
  if (effects.HEAVY_FINISHER_BONUS   !== undefined) l.push(`+${effects.HEAVY_FINISHER_BONUS}% finishers lourds`);
  if (effects.LOW_HP_ATK_PCT         !== undefined) l.push(`+${effects.LOW_HP_ATK_PCT}% ATK sous 35% HP`);
  if (effects.HEAVY_CD_REDUCTION_PCT !== undefined) l.push(`-${effects.HEAVY_CD_REDUCTION_PCT}% CD arme lourde`);
  if (effects.POST_FINISHER_BUFF     !== undefined) l.push('Buff post-finisher (2.5s)');
  if (effects.CRIT_PCT               !== undefined) l.push(`+${effects.CRIT_PCT}% chance critique`);
  if (effects.MOVE_SPEED_PCT         !== undefined) l.push(`+${effects.MOVE_SPEED_PCT}% vitesse`);
  if (effects.COMBO_GRACE_PCT        !== undefined) l.push(`+${effects.COMBO_GRACE_PCT}% fenêtre combo`);
  if (effects.DASH_PRESERVES_COMBO   !== undefined) l.push('Dash gèle le timer combo (0.35s)');
  if (effects.LIGHT_FINISHER_BLEED   !== undefined) l.push('Finisher léger → saignement renforcé');
  if (effects.BOW_RANGE_DMG_PCT      !== undefined) l.push(`+${effects.BOW_RANGE_DMG_PCT}% dégâts distance (BOW)`);
  if (effects.MAX_HP_PCT             !== undefined) l.push(`+${effects.MAX_HP_PCT}% HP max`);
  if (effects.COMBO_STACK_DMG        !== undefined) l.push(`+${effects.COMBO_STACK_DMG}% dégâts par coup chaîné`);
  if (effects.MAGIC_DMG_PCT          !== undefined) l.push(`+${effects.MAGIC_DMG_PCT}% dégâts magiques`);
  if (effects.MANA_COST_PCT          !== undefined) l.push(`-${effects.MANA_COST_PCT}% coût mana`);
  if (effects.SKILL_DMG_PCT          !== undefined) l.push(`+${effects.SKILL_DMG_PCT}% dégâts skills`);
  if (effects.STAFF_FINISHER_ZONE    !== undefined) l.push('Finisher Staff → zone au sol (r70, 2s)');
  if (effects.BOW_ELEMENTAL_ARROWS   !== undefined) l.push('Flèches élémentaires si INT ≥ 10');
  if (effects.PROJECTILE_SKILL_PCT   !== undefined) l.push(`+${effects.PROJECTILE_SKILL_PCT}% skills projectiles`);
  if (effects.SHIELD_SKILL_PCT       !== undefined) l.push(`+${effects.SHIELD_SKILL_PCT}% boucliers magiques`);
  if (effects.FINISHER_NOVA          !== undefined) l.push('Finisher → nova élémentaire (r90)');
  return l.join('\n') || '—';
}

// ─────────────────────────────────────────────────────────────────────────────
export class SkillScene extends Phaser.Scene {
  private gameScene!:      GameScene;
  private player!:         PlayerState;
  private activeBranch   = 'VIGOR';
  private selectedNodeId: string | null = null;

  // Dynamic buckets — rebuilt on every branch/selection change
  private dynamicObjs: Phaser.GameObjects.GameObject[] = [];
  private sheetObjs:   Phaser.GameObjects.GameObject[] = [];

  // Persistent tab objects (updated, never destroyed mid-session)
  private tabBgGraphics: Phaser.GameObjects.Graphics[] = [];
  private tabTextObjs:   Phaser.GameObjects.Text[]     = [];

  // Persistent header refs
  private branchNameTxt!: Phaser.GameObjects.Text;
  private branchDescTxt!: Phaser.GameObjects.Text;
  private pointsText!:    Phaser.GameObjects.Text;

  // Swipe state
  private swipeX       = 0;
  private swipeY       = 0;
  private swipeActive  = false;
  private readonly SWIPE_MIN  = 60;
  private readonly SWIPE_YMAX = 40;

  // Input cleanup ref
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() { super({ key: 'SkillScene' }); }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  init(data: { gameScene: GameScene }) {
    this.gameScene      = data.gameScene;
    this.player         = data.gameScene.gameState.player;
    this.activeBranch   = 'VIGOR';
    this.selectedNodeId = null;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Full-screen dark overlay (0.88 standard — le jeu reste visible derrière)
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);

    // Outer frame (fond translucide 0.85)
    const frame = this.add.graphics();
    drawPanel(frame, 4, 4, W - 8, H - 8, UI.PANEL_BG, 0.85);

    this.buildTabs(W);
    this.buildBranchHeader(W);
    this.buildCloseButton(W);
    this.setupSwipe();
    this.setupEscKey();

    this.renderBranch(this.activeBranch);
  }

  shutdown() {
    this.input.keyboard?.removeKey(this.escKey);
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointerup',   this.onPointerUp,   this);
    this.clearDynamic();
    this.clearSheet();
    this.gameScene?.setPaused(false);
  }

  // ── Tab bar ───────────────────────────────────────────────────────────────

  private buildTabs(W: number) {
    this.tabBgGraphics = [];
    this.tabTextObjs   = [];

    const rows: readonly string[][] = [
      [...TAB_ROW1],
      [...TAB_ROW2],
    ];

    rows.forEach((row, rowIdx) => {
      const y = rowIdx * TAB_H;
      // Row 1 leaves CLOSE_W px on the right for the × button
      const rowW  = rowIdx === 0 ? W - CLOSE_W : W;
      const tabW  = Math.floor(rowW / row.length);

      row.forEach((branchKey, colIdx) => {
        const x    = colIdx * tabW;
        const meta = BRANCH_META[branchKey];

        const bg = this.add.graphics().setDepth(2);
        this.tabBgGraphics.push(bg);
        this.paintTab(bg, x, y, tabW, TAB_H, branchKey);

        const isActive = branchKey === this.activeBranch;
        const txt = this.add.text(
          x + tabW / 2,
          y + TAB_H / 2,
          meta?.label ?? branchKey,
          pxStyle(7, isActive ? UI.TXT_WHITE : UI.TXT_MUTED),
        ).setOrigin(0.5).setDepth(3);
        this.tabTextObjs.push(txt);

        // Touch target — min 44 × 44 px
        const hitW = Math.max(tabW, 44);
        const hitH = Math.max(TAB_H, 44);
        const hit  = this.add.rectangle(x + tabW / 2, y + TAB_H / 2, hitW, hitH, 0, 0)
          .setInteractive({ useHandCursor: true })
          .setDepth(4);
        hit.on('pointerdown', () => this.switchBranch(branchKey));
      });
    });
  }

  private paintTab(
    g: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, h: number,
    branchKey: string,
  ) {
    g.clear();
    const meta     = BRANCH_META[branchKey];
    const color    = meta?.color ?? 0x333333;
    const isActive = branchKey === this.activeBranch;

    g.fillStyle(isActive ? color : 0x0e0e1c, isActive ? 0.85 : 1);
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
    }
  }

  private refreshTabs() {
    const rows: readonly string[][] = [[...TAB_ROW1], [...TAB_ROW2]];
    let idx = 0;
    rows.forEach((row, rowIdx) => {
      const W    = this.cameras.main.width;
      const rowW = rowIdx === 0 ? W - CLOSE_W : W;
      const tabW = Math.floor(rowW / row.length);

      row.forEach((branchKey, colIdx) => {
        const x = colIdx * tabW;
        const y = rowIdx * TAB_H;

        const bg  = this.tabBgGraphics[idx];
        const txt = this.tabTextObjs[idx];
        if (bg)  this.paintTab(bg, x, y, tabW, TAB_H, branchKey);
        if (txt) txt.setColor(branchKey === this.activeBranch ? UI.TXT_WHITE : UI.TXT_MUTED);
        idx++;
      });
    });
  }

  // ── Branch header ─────────────────────────────────────────────────────────

  private buildBranchHeader(W: number) {
    const y    = TAB_H * 2;
    const meta = BRANCH_META[this.activeBranch];

    // Separator between tabs and header
    const sep = this.add.graphics();
    sep.lineStyle(1, UI.BORDER_LIT, 0.45);
    sep.lineBetween(8, y, W - 8, y);

    this.branchNameTxt = this.add.text(
      14, y + 7,
      meta?.label ?? this.activeBranch,
      pxStyle(9, UI.TXT_GOLD, true),
    ).setDepth(2);

    this.branchDescTxt = this.add.text(
      14, y + 18,
      meta?.desc ?? '',
      pxStyle(5, UI.TXT_MUTED),
    ).setDepth(2);

    this.pointsText = this.add.text(
      W - 52, y + 7,
      this.buildPointsLabel(),
      pxStyle(6, UI.TXT_PARCHMENT),
    ).setOrigin(1, 0).setDepth(2);
  }

  private buildPointsLabel(): string {
    const n = this.player.talentPoints;
    return `✶ ${n} pt${n !== 1 ? 's' : ''}`;
  }

  private refreshBranchHeader() {
    const meta = BRANCH_META[this.activeBranch];
    this.branchNameTxt?.setText(meta?.label ?? this.activeBranch);
    this.branchDescTxt?.setText(meta?.desc ?? '');
    this.pointsText?.setText(this.buildPointsLabel());
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

    this.add.text(bx + bw / 2, by + bh / 2, '×', pxStyle(12, UI.TXT_RED, true))
      .setOrigin(0.5).setDepth(3);

    // Touch target ≥ 44 × 44
    const hit = this.add.rectangle(bx + bw / 2, by + bh / 2, Math.max(bw, 44), Math.max(bh, 44), 0, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(4);
    hit.on('pointerdown', () => this.gameScene.closeOverlay('SkillScene'));
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

    this.renderRespecButton(W, H);
    this.renderBottomSheet(this.selectedNodeId, branchColor, W, H);
  }

  private renderEmptyBranch(W: number, H: number, branchColor: number) {
    const cy = TAB_H * 2 + HDR_H + (H - TAB_H * 2 - HDR_H - BOTTOM_H) / 2;

    // Decorative divider
    const g = this.add.graphics().setDepth(5);
    g.lineStyle(1, branchColor, 0.25);
    g.lineBetween(W * 0.2, cy - 24, W * 0.8, cy - 24);
    this.dynamicObjs.push(g);

    const t = this.add.text(W / 2, cy,
      'Cette voie n\'est pas encore\ndécouverte...',
      { ...pxStyle(8, UI.TXT_HINT), align: 'center', wordWrap: { width: W - 80 } },
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
    const centerX = W / 2;

    // Pre-compute (cx, cy) per node id
    const nodePos = new Map<string, { cx: number; cy: number }>();
    tiers.forEach(tier => {
      const tierNodes = byTier.get(tier)!;
      const cy  = tierCenterY(tier, H);
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
    if (status !== 'ngplus_only') {
      const alpha = status === 'locked' ? 0.3 : 1;
      try {
        const img = this.add.image(cx, cy, node.icon)
          .setDisplaySize(34, 34)
          .setAlpha(alpha)
          .setDepth(7);
        this.dynamicObjs.push(img);
      } catch {
        const fb = this.add.text(cx, cy, `T${node.tier}`, pxStyle(8, '#ffffff', true))
          .setOrigin(0.5).setAlpha(alpha).setDepth(7);
        this.dynamicObjs.push(fb);
      }
    }

    // Label below node
    const rawName    = node.name;
    const label      = rawName.length > 10 ? rawName.slice(0, 9) + '…' : rawName;
    const labelColor = status === 'unlocked' ? UI.TXT_GOLD
                     : status === 'available' ? UI.TXT_PARCHMENT
                     : UI.TXT_HINT;
    const labelTxt = this.add.text(cx, cy + NODE_SZ / 2 + 4, label, pxStyle(5, labelColor))
      .setOrigin(0.5, 0).setDepth(7);
    this.dynamicObjs.push(labelTxt);

    // Interactive touch zone (min 44 × 44 px)
    if (status !== 'ngplus_only') {
      const hitSz = NODE_SZ + NODE_HIT * 2;
      const hit   = this.add.rectangle(cx, cy, hitSz, hitSz, 0, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(8);
      this.dynamicObjs.push(hit);

      hit.on('pointerdown', () => {
        // Toggle selection
        this.selectedNodeId = this.selectedNodeId === node.id ? null : node.id;
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
    const oy = TAB_H * 2 + HDR_H;
    const oh = H - oy - BOTTOM_H;

    const dim = this.add.rectangle(W / 2, oy + oh / 2, W - 16, oh, 0x000000, 0.76).setDepth(15);
    this.dynamicObjs.push(dim);

    const msg = this.add.text(
      W / 2, oy + oh / 2,
      'Je ne suis pas encore capable\nde maîtriser cette magie interdite...',
      {
        ...pxStyle(10, '#9966cc'),
        align: 'center',
        fontStyle: 'italic',
        wordWrap: { width: W - 80 },
      },
    ).setOrigin(0.5).setDepth(16);
    this.dynamicObjs.push(msg);
  }

  // ── Respec button ─────────────────────────────────────────────────────────

  private renderRespecButton(W: number, H: number) {
    const cost      = TalentSystem.respecCost(this.player);
    const hasSpent  = this.player.unlockedTalents.length > 0;
    const canAfford = this.player.gold >= cost;
    const canRespec = hasSpent && canAfford;

    const btnW = 160;
    const btnH = 22;
    const btnX = W - 8 - btnW;
    const btnY = H - BOTTOM_H - btnH - 8;

    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(canRespec ? 0x1e0a2a : 0x0e0e18, 1);
    bg.fillRect(btnX, btnY, btnW, btnH);
    bg.lineStyle(1, canRespec ? 0x7700aa : 0x282830, 1);
    bg.strokeRect(btnX, btnY, btnW, btnH);
    this.dynamicObjs.push(bg);

    const labelColor = canRespec ? '#cc99ff' : UI.TXT_HINT;
    const label      = `↺ Réspec — ${cost} or`;
    const txt = this.add.text(btnX + btnW / 2, btnY + btnH / 2, label, pxStyle(5, labelColor))
      .setOrigin(0.5).setDepth(11);
    this.dynamicObjs.push(txt);

    if (canRespec) {
      // Touch target — min 44 px height
      const hitH = Math.max(btnH, 44);
      const hit  = this.add.rectangle(btnX + btnW / 2, btnY + btnH / 2, btnW, hitH, 0, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(12);
      this.dynamicObjs.push(hit);

      hit.on('pointerdown', () => {
        const ok = TalentSystem.respec(this.player);
        if (ok) {
          this.selectedNodeId = null;
          this.pointsText?.setText(this.buildPointsLabel());
          this.renderBranch(this.activeBranch);
        }
      });
      hit.on('pointerover', () => bg.setAlpha(0.8));
      hit.on('pointerout',  () => bg.setAlpha(1.0));
    }
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

    // Panel
    const bg = this.add.graphics().setDepth(20);
    drawPanel(bg, sx, sy, sw, sh, 0x080812);
    // Coloured top accent
    bg.lineStyle(2, branchColor, 0.55);
    bg.lineBetween(sx + 10, sy + 1, sx + sw - 10, sy + 1);
    this.sheetObjs.push(bg);

    if (!nodeId) {
      // Empty state hint
      const hint = this.add.text(
        W / 2, sy + sh / 2 - 8,
        'Sélectionne un talent pour voir ses détails',
        pxStyle(6, UI.TXT_HINT),
      ).setOrigin(0.5).setDepth(21);
      this.sheetObjs.push(hint);
      return;
    }

    const node = TALENT_MAP[nodeId];
    if (!node) return;

    const status = getNodeStatus(this.player, nodeId);

    // ── Left column (name, description, effects) ──────────────────────────
    const lx  = sx + 10;
    const ly0 = sy + 10;
    const ly1 = sy + 24;
    const ly2 = sy + 40;
    const colW = Math.floor(sw * 0.52) - 10;

    const nameTxt = this.add.text(lx, ly0, node.name, pxStyle(9, UI.TXT_GOLD, true)).setDepth(21);
    this.sheetObjs.push(nameTxt);

    const descTxt = this.add.text(lx, ly1, node.description, {
      ...pxStyle(6, UI.TXT_MUTED),
      wordWrap: { width: colW },
    }).setDepth(21);
    this.sheetObjs.push(descTxt);

    const effTxt = this.add.text(lx, ly2, formatEffects(node.effects), {
      ...pxStyle(6, UI.TXT_PARCHMENT),
      wordWrap: { width: colW },
      lineSpacing: 2,
    }).setDepth(21);
    this.sheetObjs.push(effTxt);

    // ── Right column (cost, status, lore, unlock button) ─────────────────
    const rx   = sx + Math.floor(sw * 0.54);
    let   ry   = sy + 10;
    const rColW = sw - Math.floor(sw * 0.54) - 10;

    // Cost
    const costTxt = this.add.text(
      rx, ry,
      `Coût : ${node.cost} point${node.cost !== 1 ? 's' : ''}`,
      pxStyle(7, UI.TXT_GOLD),
    ).setDepth(21);
    this.sheetObjs.push(costTxt);
    ry += 16;

    // Status
    let statusStr: string;
    let statusColor: string;
    switch (status) {
      case 'unlocked':
        statusStr   = 'DÉBLOQUÉ ✓';
        statusColor = UI.TXT_GREEN;
        break;
      case 'available':
        statusStr   = 'Disponible';
        statusColor = UI.TXT_PARCHMENT;
        break;
      case 'locked': {
        const spent     = TalentSystem.pointsSpentInBranch(this.player, node.branch);
        const need      = TIER_GATE[node.tier];
        const remaining = Math.max(0, need - spent);
        if (remaining > 0) {
          statusStr = `Verrouillé — encore ${remaining} pt${remaining > 1 ? 's' : ''} requis`;
        } else {
          statusStr = 'Verrouillé — points insuffisants';
        }
        statusColor = UI.TXT_MUTED;
        break;
      }
      case 'ngplus_only':
        statusStr   = 'NG+ uniquement';
        statusColor = '#9966cc';
        break;
    }

    const statusTxt = this.add.text(rx, ry, statusStr, pxStyle(6, statusColor)).setDepth(21);
    this.sheetObjs.push(statusTxt);
    ry += 18;

    // Lore snippet (if vertical space allows)
    if (node.lore && ry < sy + sh - 50) {
      const loreSnip = node.lore.length > 72 ? node.lore.slice(0, 71) + '…' : node.lore;
      const loreTxt  = this.add.text(rx, ry, `"${loreSnip}"`, {
        ...pxStyle(5, UI.TXT_HINT),
        fontStyle: 'italic',
        wordWrap: { width: rColW },
      }).setDepth(21);
      this.sheetObjs.push(loreTxt);
    }

    // Unlock button (only when available + enough points)
    if (status === 'available' && this.player.talentPoints >= node.cost) {
      const btnW = 124;
      const btnH = 36;
      const btnX = sx + sw - btnW - 4;
      const btnY = sy + sh - btnH - 8;

      const btnBg = this.add.graphics().setDepth(22);
      btnBg.fillStyle(branchColor, 0.88);
      btnBg.fillRect(btnX, btnY, btnW, btnH);
      btnBg.lineStyle(2, 0xffffff, 0.45);
      btnBg.strokeRect(btnX, btnY, btnW, btnH);
      this.sheetObjs.push(btnBg);

      const btnTxt = this.add.text(
        btnX + btnW / 2, btnY + btnH / 2,
        'Débloquer',
        pxStyle(8, UI.TXT_WHITE, true),
      ).setOrigin(0.5).setDepth(23);
      this.sheetObjs.push(btnTxt);

      const btnHit = this.add.rectangle(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH, 0, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(24);
      this.sheetObjs.push(btnHit);

      btnHit.on('pointerdown', () => {
        const ok = TalentSystem.unlock(this.player, nodeId);
        if (ok) {
          this.selectedNodeId = null;
          this.pointsText?.setText(this.buildPointsLabel());
          this.renderBranch(this.activeBranch);
        }
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
    // Only track swipes in the tree content area (below header)
    if (p.y < TAB_H * 2 + HDR_H) return;
    this.swipeX      = p.x;
    this.swipeY      = p.y;
    this.swipeActive = true;
  }

  private onPointerUp(p: Phaser.Input.Pointer) {
    if (!this.swipeActive) return;
    this.swipeActive = false;

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

  // ── ESC key ───────────────────────────────────────────────────────────────

  private setupEscKey() {
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => this.gameScene.closeOverlay('SkillScene'));
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
}
