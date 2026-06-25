import { GameState, EndingChoice } from '../types';
import { SaveSystem } from '../systems/SaveSystem';

const RESTORE_TEXT = [
  'The six zones grow quiet.',
  '',
  'You close your eyes.',
  '',
  'You remember — not human memories, not the tavern in Grievy Town,',
  'not Aldric\'s bread, not the road you woke up on.',
  '',
  'You remember being everything.',
  'And choosing to be nothing, for a while.',
  '',
  'The six divinities return. Reborn from the energy you pour',
  'back into the world. Pyrath stirs in the volcanic mountains.',
  'Gorvun settles into the deep canyons. Thalymor descends',
  'to the ocean floor. Sylvael glides over the floating islands.',
  'Volkran crackles quietly across the plains. Crysthea',
  'seals the ice caves back shut, preserving everything.',
  '',
  'Grievy Town fills with noise again.',
  '',
  'Aldric never asks what you gave up to be standing here.',
  'You never tell him.',
  '',
  'The world is whole.',
  'You are ordinary.',
  '',
  'It is enough.',
];

const ERASE_TEXT = [
  'You hold everything.',
  '',
  'Six elements. One world. All of it, in your hands.',
  '',
  'You think about Aldric. You think about Mira\'s herbs.',
  'You think about Brother Ovan and his endless notes.',
  'You think about Elara in the ice caves.',
  '',
  'And you let go.',
  '',
  'Not destruction.',
  'Not anger.',
  '',
  'A mercy, perhaps.',
  'Or something older than mercy.',
  '',
  'Velmara unravels like a dream.',
  '',
  'Somewhere, in the nothing that follows,',
  'a shape assembles itself.',
  '',
  'A road.',
  'A body.',
  'No memory.',
  '',
  'Again.',
];

export class EndingScene extends Phaser.Scene {
  private gameState!: GameState;
  private choice!: EndingChoice;
  private lines: string[] = [];
  private displayedLines: Phaser.GameObjects.Text[] = [];
  private lineIndex = 0;
  private typewriterTimer = 0;

  constructor() { super({ key: 'EndingScene' }); }

  init(data: { gameState: GameState; choice: EndingChoice }) {
    this.gameState = data.gameState;
    this.choice    = data.choice;
    this.lines     = data.choice === EndingChoice.RESTORE ? RESTORE_TEXT : ERASE_TEXT;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(2000);

    this.displayedLines = [];
    this.lineIndex = 0;

    this.time.addEvent({
      delay: 1800,
      repeat: this.lines.length - 1,
      callback: this.showNextLine,
      callbackScope: this,
    });

    // After all lines, show final choice / credits
    this.time.delayedCall(this.lines.length * 1800 + 3000, () => this.showFinalScreen());
  }

  private showNextLine() {
    if (this.lineIndex >= this.lines.length) return;
    const W = this.cameras.main.width;

    const txt = this.add.text(W / 2, 60 + this.lineIndex * 22, this.lines[this.lineIndex], {
      fontSize: this.lines[this.lineIndex] === '' ? '4px' : '12px',
      color: '#ccbbaa',
      fontFamily: 'monospace',
      align: 'center',
    }).setOrigin(0.5, 0).setAlpha(0);

    this.tweens.add({ targets: txt, alpha: 1, duration: 600 });
    this.displayedLines.push(txt);
    this.lineIndex++;
  }

  private showFinalScreen() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.cameras.main.fadeIn(800);

    const subtext = this.choice === EndingChoice.RESTORE
      ? 'Thank you for playing.'
      : 'New Game+ unlocked. The world remembers.';

    this.add.text(W / 2, H - 80, subtext, {
      fontSize: '14px', color: '#998877', fontFamily: 'monospace',
    }).setOrigin(0.5);

    if (this.choice === EndingChoice.ERASE) {
      const ngPlusBtn = this.add.text(W / 2, H - 40, '[ BEGIN AGAIN ]', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'monospace',
        backgroundColor: '#1a0a2a',
        padding: { x: 20, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      ngPlusBtn.on('pointerover', () => ngPlusBtn.setStyle({ color: '#cc88ff' }));
      ngPlusBtn.on('pointerout',  () => ngPlusBtn.setStyle({ color: '#ffffff' }));
      ngPlusBtn.on('pointerdown', () => {
        const ngState = SaveSystem.createNewGamePlus(this.gameState, EndingChoice.ERASE);
        this.cameras.main.fadeOut(800);
        this.time.delayedCall(900, () => {
          this.scene.start('GameScene', { gameState: ngState });
        });
      });
    }

    const mainMenuBtn = this.add.text(W / 2, H - 12, '[ Return to Menu ]', {
      fontSize: '12px', color: '#666655', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    mainMenuBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(600);
      this.time.delayedCall(700, () => this.scene.start('MainMenuScene'));
    });

    // Credits
    this.add.text(W / 2, H / 2 + 60, "Grievy Town's Dilemma", {
      fontSize: '18px', color: '#553322', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 85, 'Original story, design & code', {
      fontSize: '10px', color: '#443322', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 105, 'Music by [your friend]', {
      fontSize: '10px', color: '#443322', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
