import { GameState, EndingChoice } from '../types';
import { SaveSystem } from '../systems/SaveSystem';
import { UI, TYPE, uiStyle, titleStyle } from '../utils/UITheme';
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

    // Pas de 22px pour ~28 lignes max : 60 + 27×22 = 654 < 720 — jamais de
    // débordement, et le corps est en TYPE.BODY (14) net sur la grille.
    const isEmpty = this.lines[this.lineIndex] === '';
    const txt = this.add.text(W / 2, 60 + this.lineIndex * 22,
      this.lines[this.lineIndex],
      uiStyle(isEmpty ? 5 : TYPE.BODY, UI.TXT_PARCHMENT, { align: 'center' }),
    ).setOrigin(0.5, 0).setAlpha(0);

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

    this.add.text(W / 2, H - 96, subtext, uiStyle(TYPE.BODY, UI.TXT_MUTED)).setOrigin(0.5);

    // ── New Game+ button (arrondi, visuel = hit zone 44 px) ─
    if (this.choice === EndingChoice.ERASE) {
      const BW = 240;
      const BH = 44;
      const BY = H - 60;
      const nbg = this.add.graphics();
      const ndraw = (hover: boolean) => {
        nbg.clear();
        nbg.fillStyle(hover ? UI.BTN_BG_HOVER : UI.BTN_BG, 1);
        nbg.fillRoundedRect(W / 2 - BW / 2, BY - BH / 2, BW, BH, 6);
        nbg.lineStyle(1, hover ? UI.ACCENT_ARCANE : UI.SEPARATOR, hover ? 0.9 : 1);
        nbg.strokeRoundedRect(W / 2 - BW / 2, BY - BH / 2, BW, BH, 6);
      };
      ndraw(false);

      const ngTxt = this.add.text(W / 2, BY, t('ending.begin_again'), uiStyle(13, UI.TXT_PARCHMENT, { bold: true }))
        .setOrigin(0.5);
      const nhit = this.add.rectangle(W / 2, BY, BW + 6, 44, 0, 0).setInteractive({ useHandCursor: true });
      nhit.on('pointerover', () => { ndraw(true);  ngTxt.setStyle({ color: UI.TXT_GOLD }); });
      nhit.on('pointerout',  () => { ndraw(false); ngTxt.setStyle({ color: UI.TXT_PARCHMENT }); });
      nhit.on('pointerdown', () => {
        this.tweens.add({ targets: ngTxt, scaleX: 0.96, scaleY: 0.96, duration: 50, yoyo: true });
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
      mbg.fillStyle(hover ? UI.BTN_BG_HOVER : UI.BTN_BG, 1);
      mbg.fillRoundedRect(W / 2 - MW / 2, MY - MH / 2, MW, MH, 5);
      mbg.lineStyle(1, hover ? UI.ACCENT_ARCANE : UI.SEPARATOR, hover ? 0.9 : 1);
      mbg.strokeRoundedRect(W / 2 - MW / 2, MY - MH / 2, MW, MH, 5);
    };
    mdraw(false);

    const mTxt = this.add.text(W / 2, MY, t('ending.return_menu'), uiStyle(10, UI.TXT_MUTED)).setOrigin(0.5);
    // Hit zone plafonnée par le bord bas de l'écran (36 px, centrée à H-22)
    const mhit = this.add.rectangle(W / 2, MY, MW + 6, 36, 0, 0).setInteractive({ useHandCursor: true });
    mhit.on('pointerover', () => { mdraw(true);  mTxt.setStyle({ color: UI.TXT_PARCHMENT }); });
    mhit.on('pointerout',  () => { mdraw(false); mTxt.setStyle({ color: UI.TXT_MUTED }); });
    mhit.on('pointerdown', () => {
      this.cameras.main.fadeOut(600);
      this.time.delayedCall(700, () => this.scene.start('MainMenuScene'));
    });

    // ── Credits — titre du jeu en police Boss (titleStyle), teinte muted :
    // identitaire mais recueilli, pas un titre d'écran actif ─────
    this.add.text(W / 2, H / 2 + 60, "Grievy Town's Dilemma", titleStyle(UI.TXT_MUTED)).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 86, 'Original story, design & code', uiStyle(9, UI.TXT_HINT)).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 106, 'Music by [your friend]', uiStyle(9, UI.TXT_HINT)).setOrigin(0.5);
  }
}
