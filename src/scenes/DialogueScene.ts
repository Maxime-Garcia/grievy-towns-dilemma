import { NPC, PlayerState, DialogueLine, WorldState } from '../types';
import { DialogueSystem, DialogueSession } from '../systems/DialogueSystem';
import { SHOP_INVENTORY } from '../data/shops';
import { UI, drawGlowPanel, uiStyle } from '../utils/UITheme';
import { t, localizeDialogueLine } from '../i18n';

// ─────────────────────────────────────────────────────────────────
// Couleurs d'accent par rôle de NPC — exception documentée aux
// tokens UI.* (voir docs/design/UI_UX_GUIDELINES.md §2.1) : le liseré
// du popup annonce la fonction du personnage avant même de lire.
// ─────────────────────────────────────────────────────────────────
type NpcRole = 'merchant' | 'blacksmith' | 'quest' | 'lore' | 'default';

const NPC_ROLE_COLORS: Record<NpcRole, number> = {
  merchant:   0xddaa22,  // or       = vend quelque chose
  blacksmith: 0xcc6622,  // orange   = forge / artisan d'armes
  quest:      0x4488cc,  // bleu     = donneur de quête
  lore:       0x8844cc,  // violet   = conteur / érudit
  default:    0x448844,  // vert     = habitant
};

/** NPCs « conteurs » identifiés dans les data (avant le check quest). */
const LORE_NPC_IDS: readonly string[] = ['brother_ovan', 'elara'];

function npcRole(npc: NPC): NpcRole {
  if (npc.id.includes('smith') || npc.id === 'theron' || npc.id === 'brenn') return 'blacksmith';
  if (npc.shopItems && npc.shopItems.length > 0) return 'merchant';
  if (LORE_NPC_IDS.includes(npc.id)) return 'lore';
  if (npc.questIds && npc.questIds.length > 0) return 'quest';
  return 'default';
}

function colorToCss(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}

/** Vitesse de la machine à écrire (ms par lettre). */
const TYPE_DELAY_MS = 30;

export class DialogueScene extends Phaser.Scene {
  private npc!:     NPC;
  private session!: DialogueSession;
  private player!:  PlayerState;
  private world?:   WorldState;
  private onClose!: () => void;

  private role: NpcRole = 'default';
  private accent = NPC_ROLE_COLORS.default;

  // ── Objets UI persistants ────────────────────────────────────
  private panel!:          Phaser.GameObjects.Graphics;
  private portFrame!:      Phaser.GameObjects.Graphics;
  private badgeGfx!:       Phaser.GameObjects.Graphics;
  private speakerText!:    Phaser.GameObjects.Text;
  private bodyText!:       Phaser.GameObjects.Text;
  private portrait!:       Phaser.GameObjects.Image;
  private placeholderGfx!: Phaser.GameObjects.Graphics;
  private placeholderTxt!: Phaser.GameObjects.Text;
  private nextIndicator!:  Phaser.GameObjects.Text;
  private panelRoot!:      Phaser.GameObjects.Container;

  // ── Objets recréés à chaque ligne (boutons de choix) ─────────
  private choiceObjs: Phaser.GameObjects.GameObject[] = [];
  private choiceKeys: Phaser.Input.Keyboard.Key[]     = [];

  // ── Machine à écrire ─────────────────────────────────────────
  private typeTimer: Phaser.Time.TimerEvent | null = null;
  private isTyping    = false;
  private fullText    = '';
  private currentLine: DialogueLine | null = null;

  // ── Clavier ──────────────────────────────────────────────────
  private advanceKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!:   Phaser.Input.Keyboard.Key;
  private escKey!:     Phaser.Input.Keyboard.Key;
  private enterKey!:   Phaser.Input.Keyboard.Key;

  // ── Géométrie (calculée dans create, réutilisée partout) ─────
  private px = 0;
  private py = 0;
  private pw = 0;
  private ph = 0;
  private portCX = 0;
  private portCY = 0;
  private textX  = 0;
  private textW  = 0;
  private shopBtnX = 0;   // bord gauche du bouton Commerce/Forge (0 = absent)

  private closing = false;

  constructor() { super({ key: 'DialogueScene' }); }

  init(data: { npc: NPC; player: PlayerState; world?: WorldState; onClose: () => void }) {
    this.npc     = data.npc;
    this.player  = data.player;
    this.world   = data.world;
    this.onClose = data.onClose;
    this.session = DialogueSystem.start(data.npc.id, data.npc.dialogue, this.player, this.world);
    this.closing = false;
    this.choiceObjs = [];
    this.choiceKeys = [];
    this.typeTimer  = null;
    this.isTyping   = false;
    this.shopBtnX   = 0;
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const { width: W, height: H } = this.cameras.main;

    this.role   = npcRole(this.npc);
    this.accent = NPC_ROLE_COLORS[this.role];

    // ── Panneau : bande basse, zone de pouce ────────────────────
    const PH = 180;
    const PY = H - PH - 6;
    const PX = 8;
    const PW = W - 16;
    this.px = PX; this.py = PY; this.pw = PW; this.ph = PH;

    this.panel = this.add.graphics();
    drawGlowPanel(this.panel, PX, PY, PW, PH, this.accent, UI.PANEL_BG, 5);

    // ── Portrait 80×80, haut-gauche du panneau ─────────────────
    const PORTRAIT_SIZE = 80;
    const PORTRAIT_X    = PX + 12;
    const PORTRAIT_Y    = PY + 14;
    this.portCX = PORTRAIT_X + PORTRAIT_SIZE / 2;
    this.portCY = PORTRAIT_Y + PORTRAIT_SIZE / 2;

    this.portFrame = this.add.graphics();
    drawGlowPanel(
      this.portFrame,
      PORTRAIT_X - 3, PORTRAIT_Y - 3,
      PORTRAIT_SIZE + 6, PORTRAIT_SIZE + 6,
      this.accent, UI.BG_DEEP, 3,
    );

    this.portrait = this.add.image(this.portCX, this.portCY, '__DEFAULT')
      .setDisplaySize(PORTRAIT_SIZE, PORTRAIT_SIZE)
      .setVisible(false);

    // Placeholder si aucune texture de portrait : cercle accent + initiales
    this.placeholderGfx = this.add.graphics().setVisible(false);
    this.placeholderTxt = this.add.text(this.portCX, this.portCY, '',
      uiStyle(20, UI.TXT_PARCHMENT, { bold: true, stroke: true }),
    ).setOrigin(0.5).setVisible(false);

    // ── Zone de texte ──────────────────────────────────────────
    this.textX = PORTRAIT_X + PORTRAIT_SIZE + 14;
    this.textW = PW - (this.textX - PX) - 16;

    // Badge de nom (fond redessiné à chaque ligne, largeur = texte)
    this.badgeGfx    = this.add.graphics();
    this.speakerText = this.add.text(0, 0, '', uiStyle(13, UI.TXT_GOLD, { bold: true, stroke: true }))
      .setOrigin(0, 0.5);

    this.bodyText = this.add.text(this.textX, PY + 44, '', uiStyle(13, UI.TXT_PARCHMENT, {
      wordWrapWidth: this.textW,
      lineSpacing: 6,
    }));

    // ── Bouton Commerce / Forge (marchands & forgerons) ────────
    const shopVisuals: Phaser.GameObjects.GameObject[] = [];
    const hasShop = (SHOP_INVENTORY[this.npc.id] ?? []).length > 0;
    if (hasShop) {
      const SB_W = 128;
      const SB_H = 36;
      const sbX  = PX + PW - SB_W - 12;
      const sbY  = PY + PH - SB_H - 10;
      this.shopBtnX = sbX;

      const sbGfx  = this.add.graphics();
      const sbGold = this.role === 'blacksmith' ? NPC_ROLE_COLORS.blacksmith : UI.GLOW_GOLD;
      const drawShopBtn = (hover: boolean) => {
        sbGfx.clear();
        drawGlowPanel(sbGfx, sbX, sbY, SB_W, SB_H, sbGold, hover ? UI.BTN_BG_HOVER : UI.BTN_BG, 4);
        sbGfx.lineStyle(1, sbGold, hover ? 0.9 : 0.45);
        sbGfx.strokeRoundedRect(sbX, sbY, SB_W, SB_H, 4);
      };
      drawShopBtn(false);

      const sbLabel = this.role === 'blacksmith' ? t('dialogue.forge') : t('dialogue.shop');
      const sbTxt = this.add.text(sbX + SB_W / 2, sbY + SB_H / 2, sbLabel, uiStyle(11, UI.TXT_GOLD, { bold: true }))
        .setOrigin(0.5);

      // Hit zone élargie (≥ 44 px de haut) — reste hors du container
      const sbHit = this.add.rectangle(sbX + SB_W / 2, sbY + SB_H / 2, SB_W + 8, 44, 0, 0)
        .setInteractive({ useHandCursor: true }).setDepth(5);
      sbHit.on('pointerover', () => { drawShopBtn(true);  sbTxt.setStyle({ color: UI.TXT_PARCHMENT }); });
      sbHit.on('pointerout',  () => { drawShopBtn(false); sbTxt.setStyle({ color: UI.TXT_GOLD }); });
      sbHit.on('pointerdown', () => {
        if (this.closing) return;
        // Feedback immédiat puis fermeture : GameScene lit le flag 'open_shop'
        // dans onClose et lance ShopScene avec ce NPC.
        const flash = this.add.rectangle(sbX + SB_W / 2, sbY + SB_H / 2, SB_W, SB_H, 0xffffff, 0.25)
          .setDepth(6);
        this.tweens.add({ targets: flash, alpha: 0, duration: 90 });
        this.player.flags['open_shop'] = true;
        this.time.delayedCall(90, () => this.closeDialogue());
      });

      shopVisuals.push(sbGfx, sbTxt);
    }

    // ── Indicateur de suite ▼ (clignotant) ─────────────────────
    const indX = this.shopBtnX > 0 ? this.shopBtnX - 12 : PX + PW - 14;
    this.nextIndicator = this.add.text(indX, PY + PH - 10, '▼', uiStyle(12, colorToCss(this.accent)))
      .setOrigin(1, 1).setVisible(false);
    this.tweens.add({
      targets: this.nextIndicator,
      alpha: 0.25,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Clavier ────────────────────────────────────────────────
    const KC = Phaser.Input.Keyboard.KeyCodes;
    this.advanceKey = this.input.keyboard!.addKey(KC.Z);
    this.spaceKey   = this.input.keyboard!.addKey(KC.SPACE);
    this.escKey     = this.input.keyboard!.addKey(KC.ESC);
    this.enterKey   = this.input.keyboard!.addKey(KC.ENTER);
    this.enterKey.on('down', () => this.onAdvanceInput());

    // ── Bouton × (glyphe visible + hit zone 44×44 invisible) ───
    const closeBtn = this.add.text(PX + PW - 10, PY + 6, '×',
      uiStyle(20, UI.TXT_RED, { bold: true, stroke: true }),
    ).setOrigin(1, 0).setDepth(10);
    const closeHit = this.add.rectangle(PX + PW - 26, PY + 22, 44, 44, 0, 0)
      .setInteractive({ useHandCursor: true }).setDepth(11);
    closeHit.on('pointerover', () => closeBtn.setStyle({ color: UI.TXT_ORANGE }));
    closeHit.on('pointerout',  () => closeBtn.setStyle({ color: UI.TXT_RED }));
    closeHit.on('pointerdown', () => this.closeDialogue());

    // ── Tap n'importe où sur le panneau = avancer / skip ───────
    // Depth -1 : les boutons de choix (depth 0) et le bouton commerce
    // (depth 5) gagnent le routing d'input (topOnly).
    const tapZone = this.add.rectangle(PX + PW / 2, PY + PH / 2, PW, PH, 0, 0)
      .setInteractive().setDepth(-1);
    tapZone.on('pointerdown', () => this.onAdvanceInput());

    // Hint clavier (bonus desktop)
    const hint = this.add.text(PX + 12, H - 10, t('dialogue.advance_hint'), uiStyle(8, UI.TXT_HINT))
      .setOrigin(0, 1);

    // ── Animation d'entrée : le panneau monte + fade (200 ms) ──
    // Les hit zones (closeHit, tapZone, sbHit) restent hors du container :
    // leurs positions correspondent à l'état final, atteint en 200 ms.
    this.panelRoot = this.add.container(0, 10, [
      this.panel, this.portFrame, this.portrait,
      this.placeholderGfx, this.placeholderTxt,
      this.badgeGfx, this.speakerText, this.bodyText,
      this.nextIndicator, closeBtn, hint,
      ...shopVisuals,
    ]).setAlpha(0);
    this.tweens.add({
      targets: this.panelRoot,
      y: 0,
      alpha: 1,
      duration: 200,
      ease: 'Quad.easeOut',
    });

    // Nettoyage garanti : Phaser n'appelle pas shutdown() tout seul.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    this.renderCurrentLine();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) { this.closeDialogue(); return; }
    if (Phaser.Input.Keyboard.JustDown(this.advanceKey) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.onAdvanceInput();
    }
  }

  shutdown() {
    this.typeTimer?.remove();
    this.typeTimer = null;
    this.isTyping  = false;
    this.enterKey?.off('down');
    this.choiceKeys.forEach(k => k.off('down'));
    this.choiceKeys = [];
    const KC = Phaser.Input.Keyboard.KeyCodes;
    [KC.ENTER, KC.Z, KC.ESC, KC.SPACE].forEach(k => this.input.keyboard?.removeKey(k));
  }

  // ── Rendu d'une ligne ─────────────────────────────────────────

  private renderCurrentLine() {
    const rawLine = DialogueSystem.getCurrentLine(this.session, this.player);
    if (!rawLine) { this.closeDialogue(); return; }
    const line = localizeDialogueLine(this.npc.id, rawLine);
    this.currentLine = line;

    this.clearLineObjects();
    this.drawSpeakerBadge(line.speaker);
    this.updatePortrait(line);
    this.startTypewriter(line.text);
  }

  /** Détruit les objets propres à la ligne courante (choix, timer, ▼). */
  private clearLineObjects() {
    this.typeTimer?.remove();
    this.typeTimer = null;
    this.isTyping  = false;
    this.nextIndicator.setVisible(false);
    this.choiceObjs.forEach(o => o.destroy());
    this.choiceObjs = [];
    this.choiceKeys.forEach(k => { k.off('down'); this.input.keyboard?.removeKey(k); });
    this.choiceKeys = [];
  }

  /** Badge arrondi teinté à l'accent du NPC, largeur adaptée au nom. */
  private drawSpeakerBadge(speaker: string) {
    this.speakerText.setText(speaker);
    const bw = Math.ceil(this.speakerText.width) + 16;
    const bh = 20;
    const bx = this.textX;
    const by = this.py + 12;
    this.badgeGfx.clear();
    this.badgeGfx.fillStyle(this.accent, 0.22);
    this.badgeGfx.fillRoundedRect(bx, by, bw, bh, 4);
    this.badgeGfx.lineStyle(1, this.accent, 0.6);
    this.badgeGfx.strokeRoundedRect(bx, by, bw, bh, 4);
    this.speakerText.setPosition(bx + 8, by + bh / 2);
  }

  /** Portrait : texture si disponible, sinon cercle accent + initiales. */
  private updatePortrait(line: DialogueLine) {
    const candidates: (string | undefined)[] = [
      line.portrait,
      line.speaker === this.npc.name ? this.npc.portrait : undefined,
      `portrait_${line.speaker.toLowerCase()}`,
    ];
    const key = candidates.find(k => !!k && this.textures.exists(k));
    if (key) {
      this.portrait.setTexture(key).setDisplaySize(80, 80).setVisible(true);
      this.placeholderGfx.setVisible(false);
      this.placeholderTxt.setVisible(false);
      return;
    }

    this.portrait.setVisible(false);
    const initials = line.speaker
      .split(/\s+/)
      .map(w => w.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
    this.placeholderGfx.clear();
    this.placeholderGfx.fillStyle(this.accent, 0.18);
    this.placeholderGfx.fillCircle(this.portCX, this.portCY, 32);
    this.placeholderGfx.lineStyle(1, this.accent, 0.75);
    this.placeholderGfx.strokeCircle(this.portCX, this.portCY, 32);
    this.placeholderGfx.setVisible(true);
    this.placeholderTxt.setText(initials).setVisible(true);
  }

  // ── Machine à écrire ──────────────────────────────────────────

  private startTypewriter(text: string) {
    this.fullText = text;
    this.bodyText.setText('');
    if (text.length === 0) { this.isTyping = false; this.showLineExtras(); return; }

    this.isTyping = true;
    let i = 0;
    this.typeTimer = this.time.addEvent({
      delay: TYPE_DELAY_MS,
      loop:  true,
      callback: () => {
        i++;
        this.bodyText.setText(this.fullText.slice(0, i));
        if (i >= this.fullText.length) {
          this.typeTimer?.remove();
          this.typeTimer = null;
          this.isTyping  = false;
          this.showLineExtras();
        }
      },
    });
  }

  private skipTypewriter() {
    if (!this.isTyping) return;
    this.typeTimer?.remove();
    this.typeTimer = null;
    this.isTyping  = false;
    this.bodyText.setText(this.fullText);
    this.showLineExtras();
  }

  /** Après le texte : boutons de choix, ou indicateur de suite ▼. */
  private showLineExtras() {
    const line = this.currentLine;
    if (!line) return;
    const choices = DialogueSystem.getFilteredChoices(line, this.player) ?? [];
    if (choices.length === 0) {
      this.nextIndicator.setVisible(true);
      return;
    }
    this.buildChoiceButtons(choices.slice(0, 4));
  }

  // ── Boutons de réponse ────────────────────────────────────────

  private buildChoiceButtons(choices: NonNullable<DialogueLine['choices']>) {
    const COLS = choices.length > 1 ? 2 : 1;
    const rows = Math.ceil(choices.length / COLS);
    const BH   = 36;
    const GAP  = 6;
    const areaLeft  = this.textX;
    const areaRight = this.shopBtnX > 0 ? this.shopBtnX - 10 : this.px + this.pw - 12;
    const areaW     = areaRight - areaLeft;
    const bw        = COLS === 1 ? areaW : Math.floor((areaW - GAP) / 2);
    const bottom    = this.py + this.ph - 10;

    const numCodes = [
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
      Phaser.Input.Keyboard.KeyCodes.FOUR,
    ];

    choices.forEach((choice, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const bx  = areaLeft + col * (bw + GAP);
      const by  = bottom - (rows - row) * BH - (rows - 1 - row) * GAP;

      const g = this.add.graphics();
      const drawBtn = (hover: boolean) => {
        g.clear();
        drawGlowPanel(g, bx, by, bw, BH, this.accent, hover ? UI.BTN_BG_HOVER : UI.BTN_BG, 4);
        if (hover) {
          g.lineStyle(1, this.accent, 0.85);
          g.strokeRoundedRect(bx, by, bw, BH, 4);
        }
      };
      drawBtn(false);

      // Hint de touche [1..4] — bonus desktop, discret
      const num = this.add.text(bx + 8, by + BH / 2, `${i + 1}`, uiStyle(9, UI.TXT_HINT))
        .setOrigin(0, 0.5);
      const txt = this.add.text(bx + 22, by + BH / 2, choice.text, uiStyle(11, UI.TXT_BLUE, {
        wordWrapWidth: bw - 32,
      })).setOrigin(0, 0.5);

      // Alignés au plan du panneau (container) pour suivre l'animation d'entrée
      this.panelRoot.add([g, num, txt]);

      // Hit zone élargie : ≥ 44 px de haut quel que soit le visuel
      const hit = this.add.rectangle(bx + bw / 2, by + BH / 2, bw + 6, Math.max(44, BH + 8), 0, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { drawBtn(true);  txt.setStyle({ color: UI.TXT_WHITE }); });
      hit.on('pointerout',  () => { drawBtn(false); txt.setStyle({ color: UI.TXT_BLUE }); });
      hit.on('pointerdown', () => {
        const flash = this.add.rectangle(bx + bw / 2, by + BH / 2, bw, BH, 0xffffff, 0.25);
        this.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
        this.pickChoice(i);
      });

      this.choiceObjs.push(g, num, txt, hit);

      if (numCodes[i] !== undefined) {
        const k = this.input.keyboard!.addKey(numCodes[i]);
        k.once('down', () => this.pickChoice(i));
        this.choiceKeys.push(k);
      }
    });
  }

  private pickChoice(i: number) {
    if (this.closing) return;
    DialogueSystem.advance(this.session, this.player, i, this.world);
    this.renderCurrentLine();
  }

  // ── Avancement ────────────────────────────────────────────────

  /** Tap / Z / ESPACE / Entrée : skip du typewriter, sinon ligne suivante. */
  private onAdvanceInput() {
    if (this.isTyping) { this.skipTypewriter(); return; }
    this.advance();
  }

  private advance() {
    if (this.closing) return;
    if (this.session.finished) { this.closeDialogue(); return; }
    const line = DialogueSystem.getCurrentLine(this.session, this.player);
    if (!line) { this.closeDialogue(); return; }
    if (line.choices) {
      const filtered = DialogueSystem.getFilteredChoices(line, this.player) ?? [];
      if (filtered.length > 0) return;   // il faut choisir — tap hors bouton ignoré
    }
    DialogueSystem.advance(this.session, this.player, undefined, this.world);
    this.renderCurrentLine();
  }

  private closeDialogue() {
    if (this.closing) return;
    this.closing = true;
    this.scene.stop();
    this.onClose();
  }
}
