import { NPC, PlayerState } from '../types';
import { DialogueSystem, DialogueSession } from '../systems/DialogueSystem';
import { UI, drawGlowPanel, pxStyle } from '../utils/UITheme';
import { t } from '../i18n';

// Petite palette d'accents attribués aux personnages (hash stable sur le nom)
const SPEAKER_ACCENTS: readonly number[] = [
  UI.ACCENT_VIOLET,  // magie
  UI.ACCENT_CYAN,    // vent / eau
  UI.GLOW_GOLD,      // chaleur
  0x88aaff,          // bleu doux
  0x55dd66,          // vert
  0xff9940,          // orange
];

function colorToCss(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}

export class DialogueScene extends Phaser.Scene {
  private session!:  DialogueSession;
  private player!:   PlayerState;
  private onClose!:  () => void;

  private panel!:        Phaser.GameObjects.Graphics;
  private portFrame!:    Phaser.GameObjects.Graphics;
  private speakerText!:  Phaser.GameObjects.Text;
  private bodyText!:     Phaser.GameObjects.Text;
  private choiceTexts:   Phaser.GameObjects.Text[]           = [];
  private choiceKeys:    Phaser.Input.Keyboard.Key[]         = [];
  private portrait!:     Phaser.GameObjects.Image;
  private placeholderGfx!: Phaser.GameObjects.Graphics;
  private placeholderTxt!: Phaser.GameObjects.Text;
  private panelRoot!:    Phaser.GameObjects.Container;
  private advanceKey!:   Phaser.Input.Keyboard.Key;
  private escKey!:       Phaser.Input.Keyboard.Key;
  private enterKey!:     Phaser.Input.Keyboard.Key;

  // Géométrie du panneau (calculée dans create, réutilisée à chaque ligne)
  private px = 0;
  private py = 0;
  private pw = 0;
  private ph = 0;
  private portCX = 0;
  private portCY = 0;
  private textX  = 0;

  constructor() { super({ key: 'DialogueScene' }); }

  init(data: { npc: NPC; player: PlayerState; onClose: () => void }) {
    this.player  = data.player;
    this.onClose = data.onClose;
    this.session = DialogueSystem.start(data.npc.id, data.npc.dialogue, this.player);
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Background panel (bottom strip) ──────────
    const PH = 168;         // panel height
    const PY = H - PH - 6;
    const PX = 8;
    const PW = W - 16;
    this.px = PX; this.py = PY; this.pw = PW; this.ph = PH;

    this.panel = this.add.graphics();
    drawGlowPanel(this.panel, PX, PY, PW, PH, UI.BORDER_LIT, UI.PANEL_BG, 5);

    // ── Portrait frame ────────────────────────────
    const PORTRAIT_SIZE = 72;
    const PORTRAIT_X    = PX + 12;
    const PORTRAIT_Y    = PY + (PH - PORTRAIT_SIZE) / 2;
    this.portCX = PORTRAIT_X + PORTRAIT_SIZE / 2;
    this.portCY = PORTRAIT_Y + PORTRAIT_SIZE / 2;

    this.portFrame = this.add.graphics();
    drawGlowPanel(
      this.portFrame,
      PORTRAIT_X - 2, PORTRAIT_Y - 2,
      PORTRAIT_SIZE + 4, PORTRAIT_SIZE + 4,
      UI.BORDER_LIT, UI.BG_DEEP, 3,
    );

    this.portrait = this.add.image(this.portCX, this.portCY, 'ui_portrait_bg')
      .setDisplaySize(PORTRAIT_SIZE, PORTRAIT_SIZE);

    // Placeholder si le portrait n'existe pas : cercle accent + initiales
    this.placeholderGfx = this.add.graphics().setVisible(false);
    this.placeholderTxt = this.add.text(this.portCX, this.portCY, '', {
      ...pxStyle(16, UI.TXT_PARCHMENT),
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setVisible(false);

    // ── Text area ─────────────────────────────────
    const TX = PORTRAIT_X + PORTRAIT_SIZE + 14;
    const TW = PW - (TX - PX) - 10;
    this.textX = TX;

    this.speakerText = this.add.text(TX, PY + 12, '', pxStyle(10, UI.TXT_GOLD));
    this.bodyText    = this.add.text(TX, PY + 32, '', {
      ...pxStyle(9, UI.TXT_PARCHMENT),
      wordWrap: { width: TW },
      lineSpacing: 4,
    });

    // ── Controls ──────────────────────────────────
    this.advanceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.escKey     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.enterKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.enterKey.on('down', () => this.advance());

    // Close button — text glyph for desktop hover; invisible 44×44 hit zone for touch.
    const closeBtn = this.add.text(PX + PW - 10, PY + 8, '×', {
      ...pxStyle(14, UI.TXT_RED),
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(10);
    // Invisible rectangle expands the click/tap area to 44×44 without visual change.
    const closeHit = this.add.rectangle(PX + PW - 26, PY + 22, 44, 44, 0, 0)
      .setInteractive({ useHandCursor: true }).setDepth(11);
    closeHit.on('pointerover', () => closeBtn.setStyle({ color: UI.TXT_ORANGE }));
    closeHit.on('pointerout',  () => closeBtn.setStyle({ color: UI.TXT_RED }));
    closeHit.on('pointerdown', () => this.closeDialogue());

    // Tap anywhere on the panel to advance — standard mobile dialogue UX.
    // Depth -1 keeps this below choice texts (depth 0) so Phaser's topOnly input
    // routing lets choice buttons win when the tap lands on them.
    // advance() already guards against choice lines for extra safety.
    const tapZone = this.add.rectangle(PX + PW / 2, PY + PH / 2, PW, PH, 0, 0)
      .setInteractive().setDepth(-1);
    tapZone.on('pointerdown', () => this.advance());

    // Hint
    const hint = this.add.text(PX + PW - 10, H - 10, t('dialogue.advance_hint'), pxStyle(6, UI.TXT_HINT))
      .setOrigin(1, 1);

    // ── Entrance animation : le panneau monte + fade-in (200 ms) ──
    // Les zones interactives (closeHit, tapZone) restent hors du container :
    // leurs positions correspondent à l'état final, atteint en 200 ms.
    this.panelRoot = this.add.container(0, 10, [
      this.panel, this.portFrame, this.portrait,
      this.placeholderGfx, this.placeholderTxt,
      this.speakerText, this.bodyText, closeBtn, hint,
    ]).setAlpha(0);
    this.tweens.add({
      targets: this.panelRoot,
      y: 0,
      alpha: 1,
      duration: 200,
      ease: 'Quad.easeOut',
    });

    this.renderCurrentLine();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.escKey))     { this.closeDialogue(); return; }
    if (Phaser.Input.Keyboard.JustDown(this.advanceKey)) { this.advance(); }
  }

  shutdown() {
    this.enterKey?.off('down');
    this.advanceKey?.removeAllListeners();
    this.escKey?.removeAllListeners();
    this.choiceKeys.forEach(k => k.off('down'));
    this.choiceKeys = [];
    this.input.keyboard?.removeKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.input.keyboard?.removeKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.input.keyboard?.removeKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  /** Accent stable par personnage : hash du nom vers la petite palette. */
  private speakerAccent(speaker: string): number {
    let hash = 0;
    for (let i = 0; i < speaker.length; i++) hash = (hash + speaker.charCodeAt(i) * 31) % 997;
    return SPEAKER_ACCENTS[hash % SPEAKER_ACCENTS.length];
  }

  private renderCurrentLine() {
    const line = DialogueSystem.getCurrentLine(this.session, this.player);
    if (!line) { this.closeDialogue(); return; }

    this.choiceTexts.forEach(t => t.destroy());
    this.choiceTexts = [];
    this.choiceKeys.forEach(k => k.off('down'));
    this.choiceKeys = [];

    const accent = this.speakerAccent(line.speaker);

    // Cadre + cadre portrait teintés à l'accent du personnage qui parle
    this.panel.clear();
    drawGlowPanel(this.panel, this.px, this.py, this.pw, this.ph, accent, UI.PANEL_BG, 5);
    this.portFrame.clear();
    drawGlowPanel(
      this.portFrame,
      this.portCX - 38, this.portCY - 38, 76, 76,
      accent, UI.BG_DEEP, 3,
    );

    this.speakerText.setText(line.speaker).setStyle({ color: colorToCss(accent) });
    this.bodyText.setText(line.text);

    // Portrait : texture si elle existe, sinon placeholder initiales + cercle accent
    const portraitKey = `portrait_${line.speaker.toLowerCase()}`;
    if (this.textures.exists(portraitKey)) {
      this.portrait.setTexture(portraitKey).setVisible(true);
      this.placeholderGfx.setVisible(false);
      this.placeholderTxt.setVisible(false);
    } else {
      this.portrait.setVisible(false);
      const initials = line.speaker
        .split(/\s+/)
        .map(w => w.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();
      this.placeholderGfx.clear();
      this.placeholderGfx.fillStyle(accent, 0.18);
      this.placeholderGfx.fillCircle(this.portCX, this.portCY, 28);
      this.placeholderGfx.lineStyle(1, accent, 0.75);
      this.placeholderGfx.strokeCircle(this.portCX, this.portCY, 28);
      this.placeholderGfx.setVisible(true);
      this.placeholderTxt.setText(initials).setVisible(true);
    }

    if (line.choices) {
      const filtered = DialogueSystem.getFilteredChoices(line, this.player) ?? [];

      filtered.forEach((choice, i) => {
        const cy  = this.py + 90 + i * 22;
        const txt = this.add.text(this.textX, cy, `▸ ${choice.text}`, pxStyle(9, UI.TXT_BLUE))
          .setInteractive({ useHandCursor: true });
        // Ajouté au container : même plan visuel que le panneau, rendu au-dessus
        // (ordre d'ajout), input prioritaire sur tapZone (depth -1).
        this.panelRoot.add(txt);

        txt.on('pointerover', () => txt.setStyle({ color: UI.TXT_WHITE }));
        txt.on('pointerout',  () => txt.setStyle({ color: UI.TXT_BLUE }));
        txt.on('pointerdown', () => {
          DialogueSystem.advance(this.session, this.player, i);
          this.renderCurrentLine();
        });

        const numCodes = [
          Phaser.Input.Keyboard.KeyCodes.ONE,
          Phaser.Input.Keyboard.KeyCodes.TWO,
          Phaser.Input.Keyboard.KeyCodes.THREE,
          Phaser.Input.Keyboard.KeyCodes.FOUR,
        ];
        if (numCodes[i] !== undefined) {
          const k = this.input.keyboard!.addKey(numCodes[i]);
          k.once('down', () => {
            DialogueSystem.advance(this.session, this.player, i);
            this.renderCurrentLine();
          });
          this.choiceKeys.push(k);
        }

        this.choiceTexts.push(txt);
      });
    }
  }

  private advance() {
    if (this.session.finished) { this.closeDialogue(); return; }
    const line = DialogueSystem.getCurrentLine(this.session, this.player);
    if (!line) { this.closeDialogue(); return; }
    if (line.choices) {
      const filtered = DialogueSystem.getFilteredChoices(line, this.player) ?? [];
      if (filtered.length > 0) return;
    }
    DialogueSystem.advance(this.session, this.player);
    this.renderCurrentLine();
  }

  private closeDialogue() {
    this.scene.stop();
    this.onClose();
  }
}
