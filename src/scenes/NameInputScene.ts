import { SaveSystem } from '../systems/SaveSystem';
import { UI, drawPanel, pxStyle } from '../utils/UITheme';
import { t } from '../i18n';

export class NameInputScene extends Phaser.Scene {
  private nameInput!: HTMLInputElement;
  private placeholderStyle?: HTMLStyleElement;
  private slot = 0;
  private transitioning = false;

  constructor() { super({ key: 'NameInputScene' }); }

  init(data: { slot?: number }) {
    this.slot = data?.slot ?? 0;
    this.transitioning = false;
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Background frame ──────────────────────────
    const bg = this.add.graphics();
    drawPanel(bg, 6, 6, W - 12, H - 12);

    // Decorative separator lines (same as MainMenuScene)
    const deco = this.add.graphics();
    deco.lineStyle(1, UI.BORDER_LIT, 0.4);
    deco.beginPath(); deco.moveTo(18, 70);     deco.lineTo(W - 18, 70);     deco.strokePath();
    deco.beginPath(); deco.moveTo(18, H - 70); deco.lineTo(W - 18, H - 70); deco.strokePath();

    // ── Title (identique au MainMenuScene) ────────
    this.add.text(W / 2, 26, "GRIEVY TOWN'S DILEMMA", {
      ...pxStyle(16, UI.TXT_GOLD, true),
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, 52, t('menu.subtitle'), pxStyle(7, UI.TXT_MUTED)).setOrigin(0.5);

    // ── Slot indicator ────────────────────────────
    const slotGfx = this.add.graphics();
    drawPanel(slotGfx, W / 2 - 80, 82, 160, 22, UI.SLOT_BG);
    this.add.text(W / 2, 93, `${t('menu.slot')} ${this.slot + 1}`, pxStyle(7, UI.TXT_GOLD)).setOrigin(0.5);

    // ── Narrative ─────────────────────────────────
    const MID = H / 2 - 30;
    this.add.text(W / 2, MID - 80, t('name_input.wake'),    pxStyle(12, UI.TXT_PARCHMENT, true)).setOrigin(0.5);
    this.add.text(W / 2, MID - 52, t('name_input.no_name'), pxStyle(8,  UI.TXT_MUTED)).setOrigin(0.5);
    this.add.text(W / 2, MID - 28, t('name_input.choose'),  pxStyle(7,  UI.TXT_HINT)).setOrigin(0.5);

    // ── HTML input (pixel-styled) ─────────────────
    const canvas = this.game.canvas;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = rect.width  / W;
    const scaleY = rect.height / H;

    const INP_W = 280;
    const INP_H = 34;
    const INP_X = W / 2 - INP_W / 2;
    const INP_Y = MID - INP_H / 2;

    // Inject placeholder color once
    this.placeholderStyle = document.createElement('style');
    this.placeholderStyle.textContent = `#gtd-name-input::placeholder { color: ${UI.TXT_HINT}; opacity: 1; }`;
    document.head.appendChild(this.placeholderStyle);

    this.nameInput = document.createElement('input');
    this.nameInput.id = 'gtd-name-input';
    Object.assign(this.nameInput.style, {
      position:      'absolute',
      left:          `${rect.left + INP_X * scaleX}px`,
      top:           `${rect.top  + INP_Y * scaleY}px`,
      width:         `${INP_W * scaleX}px`,
      height:        `${INP_H * scaleY}px`,
      fontSize:      `${10 * scaleX}px`,
      textAlign:     'center',
      background:    '#0c0c18',
      color:         UI.TXT_PARCHMENT,
      border:        `1px solid #6a4a22`,
      fontFamily:    "'Press Start 2P', monospace",
      outline:       'none',
      letterSpacing: '2px',
      padding:       '0 8px',
      boxSizing:     'border-box',
    });
    this.nameInput.maxLength = 16;
    this.nameInput.placeholder = t('name_input.placeholder');
    document.body.appendChild(this.nameInput);
    this.nameInput.focus();

    this.nameInput.addEventListener('focus', () => {
      this.nameInput.style.border = `1px solid ${UI.TXT_GOLD}`;
    });
    this.nameInput.addEventListener('blur', () => {
      this.nameInput.style.border = '1px solid #6a4a22';
    });
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.startGame();
    });

    // ── BEGIN button (same makeBtn pattern as MainMenuScene) ──
    const BW = 220;
    const BH = 34;
    const BX = W / 2;
    const BY = MID + 70;

    const btnGfx = this.add.graphics();
    const drawBtn = (hover: boolean) => {
      btnGfx.clear();
      drawPanel(btnGfx, BX - BW / 2, BY - BH / 2, BW, BH, hover ? UI.BTN_BG_HOVER : UI.BTN_BG);
      if (hover) {
        btnGfx.lineStyle(1, UI.CORNER, 1);
        btnGfx.strokeRect(BX - BW / 2 + 1, BY - BH / 2 + 1, BW - 2, BH - 2);
      }
    };
    drawBtn(false);

    const btnTxt = this.add.text(BX, BY, t('name_input.begin'), pxStyle(9, UI.TXT_PARCHMENT)).setOrigin(0.5);
    const hit = this.add.rectangle(BX, BY, BW, BH, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover',  () => { drawBtn(true);  btnTxt.setStyle({ color: UI.TXT_GOLD }); });
    hit.on('pointerout',   () => { drawBtn(false); btnTxt.setStyle({ color: UI.TXT_PARCHMENT }); });
    hit.on('pointerdown',  () => this.startGame());

    // ── Footer hint ───────────────────────────────
    this.add.text(W / 2, H - 14, t('name_input.hint'), pxStyle(6, UI.TXT_HINT)).setOrigin(0.5, 1);

    this.events.on('shutdown', () => this.cleanupInput());
    this.events.on('destroy',  () => this.cleanupInput());
  }

  private startGame() {
    if (this.transitioning) return;
    this.transitioning = true;
    const name = this.nameInput.value.trim() || 'Stranger';
    this.cleanupInput();
    const gameState = SaveSystem.createNewGame(name, this.slot);
    SaveSystem.save(gameState, this.slot);
    // Transition standard : fade out 300 ms avant le changement de scène
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => this.scene.start('IntroScene', { gameState }),
    );
  }

  private cleanupInput() {
    if (this.nameInput && document.body.contains(this.nameInput)) {
      document.body.removeChild(this.nameInput);
    }
    if (this.placeholderStyle && document.head.contains(this.placeholderStyle)) {
      document.head.removeChild(this.placeholderStyle);
    }
  }
}
