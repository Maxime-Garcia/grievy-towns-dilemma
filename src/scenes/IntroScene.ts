import { GameState } from '../types';
import { UI, drawPanel, pxStyle } from '../utils/UITheme';
import { t } from '../i18n';

export class IntroScene extends Phaser.Scene {
  private gameState!: GameState;
  private lineIndex = 0;
  private pages: string[][] = [];
  private panel!: Phaser.GameObjects.Graphics;
  private textObjs: Phaser.GameObjects.Text[] = [];
  private hintText!: Phaser.GameObjects.Text;
  private advanceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private canAdvance = true;

  constructor() { super({ key: 'IntroScene' }); }

  init(data: { gameState: GameState }) {
    this.gameState = data.gameState;
    this.lineIndex = 0;
    this.canAdvance = true;
  }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    const name = this.gameState.player.name;
    this.pages = [
      [
        'In the age before the tremors,',
        'the world of Velmara was in balance.',
      ],
      [
        'Six beings of immense power shaped the land.',
        'They claimed territories. They breathed life',
        'into rock and fire and sea.',
        'The people lived well under their protection.',
      ],
      [
        'Pyrath, dragon of flame — Ignis Reach.',
        'Gorvun, titan of earth — Terravast.',
        'Sylvael, phoenix of wind — Zephyr Peaks.',
        'Thalymor, leviathan of water — Abyssmar.',
        'Volkran, colossus of lightning — Volterra.',
        'Crysthea, keeper of ice — Glaciem.',
      ],
      [
        'Then came Malachar.',
        '',
        'A scholar. A believer.',
        'A man who thought the divine order was a cage.',
      ],
      [
        'He believed elemental power should flow freely.',
        'He found a way to break it.',
        '',
        'He may have been right about the logic.',
        'He was not right about the consequences.',
      ],
      [
        'The tremors began three weeks ago.',
        'The zones are tearing themselves apart.',
        'Refugees pour into Grievy Town from every direction.',
      ],
      [
        'You wake on the east road outside Grievy Town.',
        'Face down. Breathing. No visible wounds.',
        '',
        'You remember nothing.',
        'Not even your name.',
      ],
      [
        'Grievy Town needs someone who can fight.',
        'Someone who can enter the elemental zones.',
        'Someone who can find Malachar',
        'before there is nothing left to save.',
      ],
      [
        'That someone is you.',
        '',
        `— ${name} —`,
      ],
    ];

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(0);

    this.panel = this.add.graphics().setDepth(1);

    this.hintText = this.add.text(W - 24, H - 16, t('intro.hint_continue'), pxStyle(8, UI.TXT_HINT))
      .setOrigin(1, 1).setDepth(3);

    this.advanceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.enterKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.input.on('pointerdown', () => this.advance());

    this.renderPage();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.advanceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.advance();
    }
  }

  private renderPage() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.textObjs.forEach(obj => obj.destroy());
    this.textObjs = [];
    this.panel.clear();

    const page   = this.pages[this.lineIndex];
    const lineH  = 28;
    const boxPad = 32;
    const boxH   = boxPad * 2 + page.length * lineH;
    const boxY   = H / 2 - boxH / 2;

    drawPanel(this.panel, 60, boxY, W - 120, boxH);

    // Decorative separator inside panel
    this.panel.lineStyle(1, UI.BORDER_LIT, 0.4);
    this.panel.beginPath();
    this.panel.moveTo(72, boxY + boxPad - 8);
    this.panel.lineTo(W - 72, boxY + boxPad - 8);
    this.panel.strokePath();
    this.panel.beginPath();
    this.panel.moveTo(72, boxY + boxH - boxPad + 4);
    this.panel.lineTo(W - 72, boxY + boxH - boxPad + 4);
    this.panel.strokePath();

    page.forEach((line, i) => {
      const txt = this.add.text(W / 2, boxY + boxPad + i * lineH, line, {
        ...pxStyle(10, line.startsWith('—') ? UI.TXT_GOLD : UI.TXT_PARCHMENT),
        align: 'center',
        wordWrap: { width: W - 180 },
      }).setOrigin(0.5, 0).setDepth(2);
      this.textObjs.push(txt);
    });

    const isLast = this.lineIndex >= this.pages.length - 1;
    this.hintText.setText(isLast ? t('intro.hint_begin') : t('intro.hint_continue'));
    this.hintText.setStyle({ color: isLast ? UI.TXT_MUTED : UI.TXT_HINT });
  }

  shutdown() {
    this.input.keyboard?.removeAllKeys(true);
    this.input.off('pointerdown');
  }

  private advance() {
    if (!this.canAdvance) return;
    this.lineIndex++;
    if (this.lineIndex >= this.pages.length) {
      this.canAdvance = false;
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => { this.scene.start('GameScene', { gameState: this.gameState }); },
      );
      this.cameras.main.fade(600, 0, 0, 0);
    } else {
      this.renderPage();
    }
  }
}
