import { NPC, PlayerState } from '../types';
import { DialogueSystem, DialogueSession } from '../systems/DialogueSystem';

export class DialogueScene extends Phaser.Scene {
  private session!: DialogueSession;
  private player!: PlayerState;
  private onClose!: () => void;

  private panel!: Phaser.GameObjects.Graphics;
  private speakerText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private choiceKeys:  Phaser.Input.Keyboard.Key[] = [];
  private portrait!: Phaser.GameObjects.Image;
  private advanceKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() { super({ key: 'DialogueScene' }); }

  init(data: { npc: NPC; player: PlayerState; onClose: () => void }) {
    this.player  = data.player;
    this.onClose = data.onClose;
    this.session = DialogueSystem.start(data.npc.id, data.npc.dialogue, this.player);
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Semi-transparent overlay (bottom third)
    this.panel = this.add.graphics();
    this.panel.fillStyle(0x111111, 0.92);
    this.panel.fillRect(20, H - 180, W - 40, 160);
    this.panel.lineStyle(1, 0x555544);
    this.panel.strokeRect(20, H - 180, W - 40, 160);

    // Portrait area
    this.portrait = this.add.image(70, H - 100, 'ui_portrait_bg').setDisplaySize(80, 80);

    this.speakerText = this.add.text(130, H - 175, '', {
      fontSize: '13px', color: '#ffdd88', fontFamily: 'monospace',
      fontStyle: 'bold',
    });

    this.bodyText = this.add.text(130, H - 155, '', {
      fontSize: '12px', color: '#ddddcc', fontFamily: 'monospace',
      wordWrap: { width: W - 180 },
    });

    this.advanceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.escKey     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', () => this.advance());

    // Bouton fermeture (×)
    const closeBtn = this.add.text(W - 28, H - 178, '×', {
      fontSize: '18px', color: '#ff8866', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    closeBtn.on('pointerover', () => closeBtn.setStyle({ color: '#ffccaa' }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ color: '#ff8866' }));
    closeBtn.on('pointerdown', () => this.closeDialogue());

    this.add.text(W - 40, H - 30, '[Z] continue   [Échap] fermer', {
      fontSize: '9px', color: '#666655', fontFamily: 'monospace',
    }).setOrigin(1, 0);

    this.renderCurrentLine();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.closeDialogue();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.advanceKey)) {
      this.advance();
    }
  }

  shutdown() {
    this.input.keyboard?.removeAllKeys(true);
  }

  private renderCurrentLine() {
    const line = DialogueSystem.getCurrentLine(this.session, this.player);
    if (!line) { this.closeDialogue(); return; }

    // Clear old choices and their keyboard listeners
    this.choiceTexts.forEach(t => t.destroy());
    this.choiceTexts = [];
    this.choiceKeys.forEach(k => k.removeAllListeners());
    this.choiceKeys = [];

    this.speakerText.setText(line.speaker);
    this.bodyText.setText(line.text);

    try { this.portrait.setTexture(`portrait_${line.speaker.toLowerCase()}`); } catch {}

    if (line.choices) {
      const filtered = DialogueSystem.getFilteredChoices(line, this.player) ?? [];
      filtered.forEach((choice, i) => {
        const H = this.cameras.main.height;
        const txt = this.add.text(130, H - 130 + i * 22, `${i + 1}. ${choice.text}`, {
          fontSize: '11px', color: '#aaddff', fontFamily: 'monospace',
        }).setInteractive({ useHandCursor: true });

        txt.on('pointerover', () => txt.setStyle({ color: '#ffffff' }));
        txt.on('pointerout',  () => txt.setStyle({ color: '#aaddff' }));
        txt.on('pointerdown', () => {
          DialogueSystem.advance(this.session, this.player, i);
          this.renderCurrentLine();
        });

        // Keyboard shortcut (1–4)
        const numKeyCodes = [
          Phaser.Input.Keyboard.KeyCodes.ONE,
          Phaser.Input.Keyboard.KeyCodes.TWO,
          Phaser.Input.Keyboard.KeyCodes.THREE,
          Phaser.Input.Keyboard.KeyCodes.FOUR,
        ];
        if (numKeyCodes[i] !== undefined) {
          const numKey = this.input.keyboard!.addKey(numKeyCodes[i]);
          numKey.once('down', () => {
            DialogueSystem.advance(this.session, this.player, i);
            this.renderCurrentLine();
          });
          this.choiceKeys.push(numKey);
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
      if (filtered.length > 0) return; // Waiting for player to pick a choice
      // All choices filtered out — advance anyway to avoid softlock
    }
    DialogueSystem.advance(this.session, this.player);
    this.renderCurrentLine();
  }

  private closeDialogue() {
    this.scene.stop();
    this.onClose();
  }
}
