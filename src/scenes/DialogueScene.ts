import { NPC, PlayerState } from '../types';
import { DialogueSystem, DialogueSession } from '../systems/DialogueSystem';
import { UI, drawPanel, pxStyle } from '../utils/UITheme';

export class DialogueScene extends Phaser.Scene {
  private session!:  DialogueSession;
  private player!:   PlayerState;
  private onClose!:  () => void;

  private panel!:        Phaser.GameObjects.Graphics;
  private speakerText!:  Phaser.GameObjects.Text;
  private bodyText!:     Phaser.GameObjects.Text;
  private choiceTexts:   Phaser.GameObjects.Text[]           = [];
  private choiceKeys:    Phaser.Input.Keyboard.Key[]         = [];
  private portrait!:     Phaser.GameObjects.Image;
  private advanceKey!:   Phaser.Input.Keyboard.Key;
  private escKey!:       Phaser.Input.Keyboard.Key;

  constructor() { super({ key: 'DialogueScene' }); }

  init(data: { npc: NPC; player: PlayerState; onClose: () => void }) {
    this.player  = data.player;
    this.onClose = data.onClose;
    this.session = DialogueSystem.start(data.npc.id, data.npc.dialogue, this.player);
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Background panel (bottom strip) ──────────
    const PH = 168;         // panel height
    const PY = H - PH - 6;
    const PX = 8;
    const PW = W - 16;

    this.panel = this.add.graphics();
    drawPanel(this.panel, PX, PY, PW, PH);

    // ── Portrait frame ────────────────────────────
    const PORTRAIT_SIZE = 72;
    const PORTRAIT_X    = PX + 12;
    const PORTRAIT_Y    = PY + (PH - PORTRAIT_SIZE) / 2;

    // Frame around portrait
    const portFrame = this.add.graphics();
    drawPanel(portFrame, PORTRAIT_X - 2, PORTRAIT_Y - 2, PORTRAIT_SIZE + 4, PORTRAIT_SIZE + 4, 0x080810);

    this.portrait = this.add.image(
      PORTRAIT_X + PORTRAIT_SIZE / 2,
      PORTRAIT_Y + PORTRAIT_SIZE / 2,
      'ui_portrait_bg'
    ).setDisplaySize(PORTRAIT_SIZE, PORTRAIT_SIZE);

    // ── Text area ─────────────────────────────────
    const TX = PORTRAIT_X + PORTRAIT_SIZE + 14;
    const TW = PW - (TX - PX) - 10;

    this.speakerText = this.add.text(TX, PY + 12, '', pxStyle(10, UI.TXT_GOLD));
    this.bodyText    = this.add.text(TX, PY + 32, '', {
      ...pxStyle(9, UI.TXT_PARCHMENT),
      wordWrap: { width: TW },
      lineSpacing: 4,
    });

    // ── Controls ──────────────────────────────────
    this.advanceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.escKey     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', () => this.advance());

    // Close button
    const closeBtn = this.add.text(PX + PW - 10, PY + 8, '×', {
      ...pxStyle(14, UI.TXT_RED),
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(10);
    closeBtn.on('pointerover', () => closeBtn.setStyle({ color: UI.TXT_ORANGE }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ color: UI.TXT_RED }));
    closeBtn.on('pointerdown', () => this.closeDialogue());

    // Hint
    this.add.text(PX + PW - 10, H - 10, '[Z] suite   [Échap] fermer', pxStyle(6, UI.TXT_HINT))
      .setOrigin(1, 1);

    this.renderCurrentLine();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.escKey))     { this.closeDialogue(); return; }
    if (Phaser.Input.Keyboard.JustDown(this.advanceKey)) { this.advance(); }
  }

  shutdown() {
    this.input.keyboard?.removeAllKeys(true);
  }

  private renderCurrentLine() {
    const line = DialogueSystem.getCurrentLine(this.session, this.player);
    if (!line) { this.closeDialogue(); return; }

    this.choiceTexts.forEach(t => t.destroy());
    this.choiceTexts = [];
    this.choiceKeys.forEach(k => k.removeAllListeners());
    this.choiceKeys = [];

    this.speakerText.setText(line.speaker);
    this.bodyText.setText(line.text);

    try { this.portrait.setTexture(`portrait_${line.speaker.toLowerCase()}`); } catch {}

    if (line.choices) {
      const H        = this.cameras.main.height;
      const PH       = 168;
      const PY       = H - PH - 6;
      const TX       = 8 + 12 + 72 + 14;
      const filtered = DialogueSystem.getFilteredChoices(line, this.player) ?? [];

      filtered.forEach((choice, i) => {
        const cy  = PY + 90 + i * 22;
        const txt = this.add.text(TX, cy, `▸ ${choice.text}`, pxStyle(9, UI.TXT_BLUE))
          .setInteractive({ useHandCursor: true });

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
