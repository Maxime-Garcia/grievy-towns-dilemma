import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { PlayerState, TalentNode, TalentEffectKey } from '../types';
import { TALENT_MAP } from '../data/talents';
import { TalentSystem } from '../systems/TalentSystem';
import { UI, drawGlowPanel, uiStyle, openScreenTransition } from '../utils/UITheme';

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
const TAB_ROW3 = ['TERRA', 'FULGURIS', 'GLACIUS'] as const;
const BRANCH_KEYS: string[] = [...TAB_ROW1, ...TAB_ROW2, ...TAB_ROW3];
// All tab rows, in display order — used by buildTabs/refreshTabs so the layout
// scales automatically if more rows are added later.
const TAB_ROWS: readonly (readonly string[])[] = [TAB_ROW1, TAB_ROW2, TAB_ROW3];
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
  const contentBottom = screenH - BOTTOM_H;
  const available     = contentBottom - contentTop;
  const topMax        = Math.max(4, maxTier);
  const totalSpan     = (topMax - 1) * TIER_GAP + NODE_SZ;
  const topPad        = Math.max(10, (available - totalSpan) / 2);
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
  // ── Génériques (branches élémentaires) ────────────────────────────────
  if (effects.ATK_PCT                !== undefined) l.push(`+${effects.ATK_PCT}% ATK`);
  if (effects.ASPD_PCT               !== undefined) l.push(`+${effects.ASPD_PCT}% vitesse d'attaque`);
  if (effects.ELEM_BONUS_PCT         !== undefined) l.push(`+${effects.ELEM_BONUS_PCT}% dégâts élémentaires`);
  if (effects.MANA_MAX_PCT           !== undefined) l.push(`+${effects.MANA_MAX_PCT}% mana max`);
  if (effects.MANA_REGEN_PCT         !== undefined) l.push(`+${effects.MANA_REGEN_PCT}% mana max régénéré/s hors combat`);
  if (effects.LIFESTEAL_PCT          !== undefined) l.push(`+${effects.LIFESTEAL_PCT}% vol de vie`);
  // ── IGNIS ───────────────────────────────────────────────────────────────
  if (effects.BURN_CHANCE_PCT        !== undefined) l.push(`+${effects.BURN_CHANCE_PCT}% chance de BURN`);
  if (effects.BURN_DMG_PCT           !== undefined) l.push(`+${effects.BURN_DMG_PCT}% dégâts de BURN`);
  if (effects.ATK_PER_BURNING_PCT    !== undefined) l.push(`+${effects.ATK_PER_BURNING_PCT}% ATK par ennemi en feu`);
  if (effects.LOW_HP_DEF_PCT         !== undefined) l.push(`+${effects.LOW_HP_DEF_PCT}% DEF sous 50% HP`);
  if (effects.MAGMA_GUARD            !== undefined) l.push('Absorbe entièrement 1 coup par combat');
  if (effects.BURN_ON_FINISHER       !== undefined) l.push('Finisher → BURN garanti (3s)');
  if (effects.BURNING_PACK_DMG_PCT   !== undefined) l.push(`+${effects.BURNING_PACK_DMG_PCT}% dégâts si 3+ ennemis brûlent`);
  // ── ZEPHYR ──────────────────────────────────────────────────────────────
  if (effects.DASH_CD_PCT            !== undefined) l.push(`-${effects.DASH_CD_PCT}% cooldown de dash`);
  if (effects.RANGED_CRIT_PCT        !== undefined) l.push(`+${effects.RANGED_CRIT_PCT}% critique à distance`);
  if (effects.DOUBLE_DASH            !== undefined) l.push('Second dash immédiat autorisé (CD 8s)');
  if (effects.PROJECTILE_RANGE_PCT   !== undefined) l.push(`+${effects.PROJECTILE_RANGE_PCT}% portée des projectiles`);
  if (effects.PROJECTILE_DMG_PCT     !== undefined) l.push(`+${effects.PROJECTILE_DMG_PCT}% dégâts des projectiles`);
  if (effects.CYCLONE_FINISHER       !== undefined) l.push('Finisher → zone de vent qui repousse');
  if (effects.DASH_DMG_PCT           !== undefined) l.push(`+${effects.DASH_DMG_PCT}% dégâts pendant un dash`);
  if (effects.AUTO_DODGE             !== undefined) l.push('Esquive automatique 1 attaque / 5s');
  // ── ABYSSAL ─────────────────────────────────────────────────────────────
  if (effects.SLOW_ON_HIT            !== undefined) l.push('Attaques → SLOW 20% (2s)');
  if (effects.FREEZE_CHANCE_PCT      !== undefined) l.push(`+${effects.FREEZE_CHANCE_PCT}% chance de FREEZE`);
  if (effects.AQUATIC_DEF_PCT        !== undefined) l.push(`+${effects.AQUATIC_DEF_PCT}% DEF en zone aquatique`);
  if (effects.FREEZE_ON_FINISHER     !== undefined) l.push('Finisher → FREEZE garanti (2s)');
  if (effects.MANA_ON_KILL_PCT       !== undefined) l.push(`+${effects.MANA_ON_KILL_PCT}% mana max par kill`);
  if (effects.BURN_BLEED_IMMUNITY    !== undefined) l.push('Immunité BURN et BLEED');
  // ── TERRA ───────────────────────────────────────────────────────────────
  if (effects.KNOCKBACK_RES_PCT      !== undefined) l.push(`-${effects.KNOCKBACK_RES_PCT}% knockback subi`);
  if (effects.STAGGER_BONUS_PCT      !== undefined) l.push(`+${effects.STAGGER_BONUS_PCT}% accumulation de stagger`);
  if (effects.STUN_DMG_PCT           !== undefined) l.push(`+${effects.STUN_DMG_PCT}% dégâts contre CC dur`);
  if (effects.RETALIATION_DEF_PCT    !== undefined) l.push(`${effects.RETALIATION_DEF_PCT}% de la DEF renvoyé en dégâts de terre`);
  if (effects.QUAKE_FINISHER         !== undefined) l.push('Finisher → onde de choc au sol (r100)');
  if (effects.UNSHAKABLE             !== undefined) l.push('Immunité totale au knockback et à l\'interruption');
  if (effects.DEF_TO_ATK_PCT         !== undefined) l.push(`+${effects.DEF_TO_ATK_PCT}% de la DEF ajouté à l'ATK`);
  // ── FULGURIS ────────────────────────────────────────────────────────────
  if (effects.SHOCK_CHANCE_PCT       !== undefined) l.push(`+${effects.SHOCK_CHANCE_PCT}% chance de SHOCK`);
  if (effects.CRIT_SURGE_ASPD_PCT    !== undefined) l.push(`+${effects.CRIT_SURGE_ASPD_PCT}% vitesse d'attaque après critique`);
  if (effects.ARC_CHANCE_PCT         !== undefined) l.push(`+${effects.ARC_CHANCE_PCT}% chance d'arc électrique`);
  if (effects.STATIC_RETORT_PCT      !== undefined) l.push(`+${effects.STATIC_RETORT_PCT}% chance de nova en étant touché`);
  if (effects.CHAIN_FINISHER         !== undefined) l.push('Finisher → éclair en chaîne (3 ennemis)');
  if (effects.CRIT_ARC               !== undefined) l.push('Critique → arc électrique automatique');
  // ── GLACIUS ─────────────────────────────────────────────────────────────
  if (effects.DAMAGE_REDUCTION_PCT    !== undefined) l.push(`-${effects.DAMAGE_REDUCTION_PCT}% dégâts subis`);
  if (effects.STATUS_RES_DURATION_PCT !== undefined) l.push(`-${effects.STATUS_RES_DURATION_PCT}% durée des debuffs subis`);
  if (effects.HEALING_RECEIVED_PCT    !== undefined) l.push(`+${effects.HEALING_RECEIVED_PCT}% soins reçus`);
  if (effects.CHILL_AURA              !== undefined) l.push('Aura : ralentit les ennemis proches (r130)');
  if (effects.LAST_BASTION            !== undefined) l.push('1×/combat sous 30% HP → bouclier (5s)');
  if (effects.GUARD_FINISHER          !== undefined) l.push('Finisher → bouclier (3s)');
  if (effects.PRESERVED               !== undefined) l.push('1×/zone : coup fatal → 1 HP + invulnérabilité (2s)');
  // ── TENEBRES (NG+) ──────────────────────────────────────────────────────
  if (effects.DARK_DMG_MULT          !== undefined) l.push(`+${effects.DARK_DMG_MULT}% dégâts sombres`);
  if (effects.SOUL_STACK_BONUS       !== undefined) l.push(`+${effects.SOUL_STACK_BONUS} stacks Soul Echo par zone nettoyée`);
  if (effects.VOID_CHANNEL           !== undefined) l.push('Sacrifie 15% HP au cast → sort +100%');
  if (effects.DARK_BURN              !== undefined) l.push('BURN infligés → dégâts sombres');
  if (effects.PHANTOM_STRIKE_PCT     !== undefined) l.push(`+${effects.PHANTOM_STRIKE_PCT}% chance de coup fantôme`);
  if (effects.SACRIFICE_FINISHER     !== undefined) l.push('Finisher : sacrifie 20% HP max → dégâts ×3');
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

    const rows: readonly (readonly string[])[] = TAB_ROWS;

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
          uiStyle(11, isActive ? UI.TXT_WHITE : UI.TXT_MUTED, { bold: true }),
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
    const rows: readonly (readonly string[])[] = TAB_ROWS;
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
    const y    = TAB_TOTAL_H;
    const meta = BRANCH_META[this.activeBranch];

    // Separator between tabs and header
    const sep = this.add.graphics();
    sep.lineStyle(1, UI.BORDER_LIT, 0.45);
    sep.lineBetween(8, y, W - 8, y);

    this.branchNameTxt = this.add.text(
      14, y + 3,
      meta?.label ?? this.activeBranch,
      uiStyle(13, UI.TXT_GOLD, { bold: true, stroke: true }),
    ).setDepth(2);

    this.branchDescTxt = this.add.text(
      14, y + 18,
      meta?.desc ?? '',
      uiStyle(9, UI.TXT_MUTED),
    ).setDepth(2);

    this.pointsText = this.add.text(
      W - 52, y + 6,
      this.buildPointsLabel(),
      uiStyle(11, UI.TXT_PARCHMENT, { bold: true }),
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

    this.add.text(bx + bw / 2, by + bh / 2, '×', uiStyle(20, UI.TXT_RED, { bold: true, stroke: true }))
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
    if (status !== 'ngplus_only') {
      const alpha = status === 'locked' ? 0.3 : 1;
      try {
        const img = this.add.image(cx, cy, node.icon)
          .setDisplaySize(34, 34)
          .setAlpha(alpha)
          .setDepth(7);
        this.dynamicObjs.push(img);
      } catch {
        const fb = this.add.text(cx, cy, `T${node.tier}`, uiStyle(12, '#ffffff', { bold: true, stroke: true }))
          .setOrigin(0.5).setAlpha(alpha).setDepth(7);
        this.dynamicObjs.push(fb);
      }
    }

    // Label below node — lisible (9px moderne, tronqué à 13 caractères)
    const rawName    = node.name;
    const label      = rawName.length > 13 ? rawName.slice(0, 12) + '…' : rawName;
    const labelColor = status === 'unlocked' ? UI.TXT_GOLD
                     : status === 'available' ? UI.TXT_PARCHMENT
                     : UI.TXT_HINT;
    const labelTxt = this.add.text(cx, cy + NODE_SZ / 2 + 4, label, uiStyle(9, labelColor, { stroke: true }))
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

  // ── Respec button ─────────────────────────────────────────────────────────

  private renderRespecButton(W: number, H: number) {
    const cost      = TalentSystem.respecCost(this.player);
    const hasSpent  = this.player.unlockedTalents.length > 0;
    const canAfford = this.player.gold >= cost;
    const canRespec = hasSpent && canAfford;

    const btnW = 160;
    const btnH = 26;
    const btnX = W - 8 - btnW;
    const btnY = H - BOTTOM_H - btnH - 8;

    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(canRespec ? 0x1e0a2a : 0x0e0e18, 1);
    bg.fillRoundedRect(btnX, btnY, btnW, btnH, 4);
    bg.lineStyle(1, canRespec ? 0x7700aa : 0x282830, 1);
    bg.strokeRoundedRect(btnX, btnY, btnW, btnH, 4);
    this.dynamicObjs.push(bg);

    const labelColor = canRespec ? '#cc99ff' : UI.TXT_HINT;
    const label      = `↺ Réspec — ${cost} or`;
    const txt = this.add.text(btnX + btnW / 2, btnY + btnH / 2, label, uiStyle(10, labelColor, { bold: true }))
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

    // Panel — bottom sheet arrondi, liseré à la couleur de branche
    const bg = this.add.graphics().setDepth(20);
    drawGlowPanel(bg, sx, sy, sw, sh, branchColor, 0x080812, 8, 0.97);
    // Coloured top accent
    bg.lineStyle(2, branchColor, 0.55);
    bg.lineBetween(sx + 10, sy + 1, sx + sw - 10, sy + 1);
    this.sheetObjs.push(bg);

    if (!nodeId) {
      // Empty state hint
      const hint = this.add.text(
        W / 2, sy + sh / 2 - 8,
        'Sélectionne un talent pour voir ses détails',
        uiStyle(11, UI.TXT_HINT),
      ).setOrigin(0.5).setDepth(21);
      this.sheetObjs.push(hint);
      return;
    }

    const node = TALENT_MAP[nodeId];
    if (!node) return;

    const status = getNodeStatus(this.player, nodeId);

    // ── Left column (name, description, effects) ──────────────────────────
    const lx  = sx + 12;
    const ly0 = sy + 10;
    const ly1 = sy + 30;
    const ly2 = sy + 50;
    const colW = Math.floor(sw * 0.52) - 10;

    const nameTxt = this.add.text(lx, ly0, node.name, uiStyle(13, UI.TXT_GOLD, { bold: true, stroke: true })).setDepth(21);
    this.sheetObjs.push(nameTxt);

    const descTxt = this.add.text(lx, ly1, node.description, uiStyle(10, UI.TXT_MUTED, {
      wordWrapWidth: colW,
    })).setDepth(21);
    this.sheetObjs.push(descTxt);

    const effTxt = this.add.text(lx, ly2, formatEffects(node.effects), uiStyle(10, UI.TXT_PARCHMENT, {
      wordWrapWidth: colW, lineSpacing: 3,
    })).setDepth(21);
    this.sheetObjs.push(effTxt);

    // ── Right column (cost, status, lore, unlock button) ─────────────────
    const rx   = sx + Math.floor(sw * 0.54);
    let   ry   = sy + 10;
    const rColW = sw - Math.floor(sw * 0.54) - 10;

    // Cost
    const costTxt = this.add.text(
      rx, ry,
      `Coût : ${node.cost} point${node.cost !== 1 ? 's' : ''}`,
      uiStyle(11, UI.TXT_GOLD, { bold: true }),
    ).setDepth(21);
    this.sheetObjs.push(costTxt);
    ry += 18;

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

    const statusTxt = this.add.text(rx, ry, statusStr, uiStyle(10, statusColor)).setDepth(21);
    this.sheetObjs.push(statusTxt);
    ry += 20;

    // Lore snippet (if vertical space allows)
    if (node.lore && ry < sy + sh - 50) {
      const loreSnip = node.lore.length > 72 ? node.lore.slice(0, 71) + '…' : node.lore;
      const loreTxt  = this.add.text(rx, ry, `"${loreSnip}"`, uiStyle(9, UI.TXT_HINT, {
        italic: true, wordWrapWidth: rColW,
      })).setDepth(21);
      this.sheetObjs.push(loreTxt);
    }

    // Unlock button (only when available + enough points)
    if (status === 'available' && this.player.talentPoints >= node.cost) {
      const btnW = 136;
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
        'Débloquer',
        uiStyle(13, UI.TXT_WHITE, { bold: true, stroke: true }),
      ).setOrigin(0.5).setDepth(23);
      this.sheetObjs.push(btnTxt);

      const btnHit = this.add.rectangle(btnX + btnW / 2, btnY + btnH / 2, btnW + 8, Math.max(44, btnH + 4), 0, 0)
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
    if (p.y < TAB_TOTAL_H + HDR_H) return;
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
