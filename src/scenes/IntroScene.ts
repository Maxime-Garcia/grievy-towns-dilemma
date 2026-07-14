import { GameState } from '../types';
import { UI, TYPE, drawGlowPanel, drawDivider, uiStyle } from '../utils/UITheme';
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
    // Phaser n'appelle PAS scene.shutdown() de lui-même : Systems.shutdown() se
    // contente d'ÉMETTRE l'événement SHUTDOWN. Sans cette ligne, la méthode
    // shutdown() ci-dessous est du CODE MORT — les listeners qu'elle est censée
    // retirer survivent à la scène, et chaque create() en empile une couche de plus.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    this.cameras.main.fadeIn(400, 0, 0, 0);
    const name = this.gameState.player.name;
    this.pages = Array.from({ length: 9 }, (_, i) =>
      t(`intro.p${i}`)
        .replace('{name}', `— ${name} —`)
        .split('\n')
    );

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000).setDepth(0);

    this.panel = this.add.graphics().setDepth(1);

    this.hintText = this.add.text(W - 24, H - 16, t('intro.hint_continue'), uiStyle(9, UI.TXT_HINT))
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
    const GAP    = 12;
    const boxPad = 36;

    // Crée et MESURE d'abord chaque ligne : le wordWrap peut produire plusieurs
    // lignes rendues — l'ancien pas fixe de 28px faisait chevaucher toute ligne
    // wrappée sur la suivante. Le panneau est ensuite dimensionné sur la somme
    // mesurée (zéro débordement, quelle que soit la traduction).
    // « — {name} — » = identité → HEADING or ; le récit reste en BODY parchemin.
    const texts = page.map(line => {
      const isName = line.startsWith('—');
      return this.add.text(W / 2, 0, line,
        uiStyle(isName ? TYPE.HEADING : TYPE.BODY, isName ? UI.TXT_GOLD : UI.TXT_PARCHMENT, {
          bold: isName, align: 'center', wordWrapWidth: W - 200,
        }),
      ).setOrigin(0.5, 0).setDepth(2);
    });
    const contentH = texts.reduce((sum, txt) => sum + txt.height, 0) + GAP * Math.max(0, texts.length - 1);
    const boxH = boxPad * 2 + contentH;
    const boxY = H / 2 - boxH / 2;

    let ty = boxY + boxPad;
    texts.forEach(txt => { txt.setY(ty); ty += txt.height + GAP; });
    this.textObjs = texts;

    // Panneau arrondi arcane fresh (structure cyan discrète sur fond noir)
    drawGlowPanel(this.panel, 60, boxY, W - 120, boxH, UI.ACCENT_ARCANE, UI.PANEL_BG, 10, 1);

    // Decorative separators inside panel
    drawDivider(this.panel, 72, boxY + boxPad - 14,        W - 144, UI.ACCENT_ARCANE, 0.25);
    drawDivider(this.panel, 72, boxY + boxH - boxPad + 14, W - 144, UI.ACCENT_ARCANE, 0.25);

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
