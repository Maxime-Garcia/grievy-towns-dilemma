import { GameState, EndingChoice } from '../types';
import { SaveSystem } from '../systems/SaveSystem';
import { UI, drawPanel, pxStyle } from '../utils/UITheme';
import { t } from '../i18n';

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

  constructor() { super({ key: 'EndingScene' }); }

  init(data: { gameState: GameState; choice: EndingChoice }) {
    this.gameState = data.gameState;
    this.choice    = data.choice;
    this.lines     = data.choice === EndingChoice.RESTORE ? RESTORE_TEXT : ERASE_TEXT;
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    // Cinematic 2-second fade — intentional, not the standard 400ms
    this.cameras.main.fadeIn(2000);

    this.displayedLines = [];
    this.lineIndex = 0;

    this.time.addEvent({
      delay: 1800,
      repeat: this.lines.length - 1,
      callback: this.showNextLine,
      callbackScope: this,
    });

    // After all lines, show final screen
    this.time.delayedCall(this.lines.length * 1800 + 3000, () => this.showFinalScreen());
  }

  private showNextLine() {
    if (this.lineIndex >= this.lines.length) return;
    const W = this.cameras.main.width;

    const isEmpty = this.lines[this.lineIndex] === '';
    const txt = this.add.text(W / 2, 60 + this.lineIndex * 22, this.lines[this.lineIndex], {
      ...pxStyle(isEmpty ? 4 : 9, UI.TXT_PARCHMENT),
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

    // ── Subtext ───────────────────────────────────
    const subtext = this.choice === EndingChoice.RESTORE
      ? t('ending.thanks')
      : t('ending.ng_plus_unlocked');

    this.add.text(W / 2, H - 92, subtext, pxStyle(9, UI.TXT_MUTED)).setOrigin(0.5);

    // ── New Game+ button ──────────────────────────
    if (this.choice === EndingChoice.ERASE) {
      const BW = 220;
      const BH = 36;
      const BY = H - 60;
      const nbg = this.add.graphics();
      const ndraw = (hover: boolean) => {
        nbg.clear();
        drawPanel(nbg, W / 2 - BW / 2, BY - BH / 2, BW, BH, hover ? UI.BTN_BG_HOVER : UI.BTN_BG);
        if (hover) {
          nbg.lineStyle(1, UI.CORNER, 1);
          nbg.strokeRect(W / 2 - BW / 2 + 1, BY - BH / 2 + 1, BW - 2, BH - 2);
        }
      };
      ndraw(false);

      const ngTxt = this.add.text(W / 2, BY, t('ending.begin_again'), pxStyle(10, UI.TXT_PARCHMENT))
        .setOrigin(0.5);
      const nhit = this.add.rectangle(W / 2, BY, BW, BH, 0, 0).setInteractive({ useHandCursor: true });
      nhit.on('pointerover', () => { ndraw(true);  ngTxt.setStyle({ color: UI.TXT_GOLD }); });
      nhit.on('pointerout',  () => { ndraw(false); ngTxt.setStyle({ color: UI.TXT_PARCHMENT }); });
      nhit.on('pointerdown', () => {
        const ngState = SaveSystem.createNewGamePlus(this.gameState, EndingChoice.ERASE);
        this.cameras.main.fadeOut(800);
        this.time.delayedCall(900, () => {
          this.scene.start('GameScene', { gameState: ngState });
        });
      });
    }

    // ── Return to menu ────────────────────────────
    const MW = 200;
    const MH = 26;
    const MY = H - 22;
    const mbg = this.add.graphics();
    const mdraw = (hover: boolean) => {
      mbg.clear();
      drawPanel(mbg, W / 2 - MW / 2, MY - MH / 2, MW, MH, hover ? UI.BTN_BG_HOVER : UI.BTN_BG);
    };
    mdraw(false);

    const mTxt = this.add.text(W / 2, MY, t('ending.return_menu'), pxStyle(8, UI.TXT_MUTED)).setOrigin(0.5);
    const mhit = this.add.rectangle(W / 2, MY, MW, MH, 0, 0).setInteractive({ useHandCursor: true });
    mhit.on('pointerover', () => { mdraw(true);  mTxt.setStyle({ color: UI.TXT_PARCHMENT }); });
    mhit.on('pointerout',  () => { mdraw(false); mTxt.setStyle({ color: UI.TXT_MUTED }); });
    mhit.on('pointerdown', () => {
      this.cameras.main.fadeOut(600);
      this.time.delayedCall(700, () => this.scene.start('MainMenuScene'));
    });

    // ── Credits ───────────────────────────────────
    this.add.text(W / 2, H / 2 + 60, "Grievy Town's Dilemma", pxStyle(14, UI.TXT_MUTED)).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 82, 'Original story, design & code', pxStyle(8, UI.TXT_HINT)).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 102, 'Music by [your friend]', pxStyle(8, UI.TXT_HINT)).setOrigin(0.5);
  }
}
