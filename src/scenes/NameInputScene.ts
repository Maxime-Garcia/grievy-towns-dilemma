import { SaveSystem } from '../systems/SaveSystem';
import { UI, TYPE, FONT_UI, drawGlowPanel, drawDivider, uiStyle, titleStyle } from '../utils/UITheme';
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

    // ── Background frame (arcane fresh) ───────────
    const bg = this.add.graphics();
    drawGlowPanel(bg, 6, 6, W - 12, H - 12, UI.ACCENT_ARCANE, UI.BG_DEEP, 10, 1);

    // Decorative separator lines (structure = cyan arcane)
    const deco = this.add.graphics();
    drawDivider(deco, 18, 78,     W - 36, UI.ACCENT_ARCANE, 0.25);
    drawDivider(deco, 18, H - 70, W - 36, UI.ACCENT_ARCANE, 0.25);

    // ── HIÉRARCHIE SIMPLIFIÉE (même effort que MainMenuScene) ─────────────
    // L'écran empilait 8 niveaux de lecture (titre + sous-titre + pilule Slot
    // + 3 lignes narratives + input + bouton + hint). Il n'en reste que 4 dans
    // le flux : titre (identité) → accroche narrative → consigne → action
    // (input + bouton). Le sous-titre du jeu disparaît (il appartient au
    // MainMenu), la pilule « Slot N » devient une métadonnée discrète en coin,
    // et « Tu ne te souviens plus de ton nom. » / « Choisis-en un. » fusionnent
    // en UNE consigne.

    // Titre — mirror du titre de MainMenuScene : police Boss via titleStyle
    this.add.text(W / 2, 44, "GRIEVY TOWN'S DILEMMA",
      titleStyle(UI.TXT_GOLD, { stroke: true })).setOrigin(0.5);

    // Slot ciblé — métadonnée hors du flux de lecture (coin haut-droit, hint) :
    // l'info reste disponible sans concurrencer la narration.
    this.add.text(W - 24, 44, `${t('menu.slot')} ${this.slot + 1}`,
      uiStyle(TYPE.SMALL, UI.TXT_HINT)).setOrigin(1, 0.5);

    // ── Narrative ─────────────────────────────────
    // L'accroche passe en HEADING (21) : cœur émotionnel de l'écran — la
    // consigne redescend en BODY muted, sur une seule ligne.
    const MID = H / 2 - 20;
    this.add.text(W / 2, MID - 96, t('name_input.wake'),
      uiStyle(TYPE.HEADING, UI.TXT_PARCHMENT, { bold: true, stroke: true })).setOrigin(0.5);
    this.add.text(W / 2, MID - 60, `${t('name_input.no_name')} ${t('name_input.choose')}`,
      uiStyle(TYPE.BODY, UI.TXT_MUTED)).setOrigin(0.5);

    // ── HTML input (style moderne, coins arrondis, focus arcane) ──
    const canvas = this.game.canvas;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = rect.width  / W;
    const scaleY = rect.height / H;

    // 280×36 → 320×44 : le champ atteint la hauteur tactile minimale et
    // respire pour du texte à 14px (grille de la police).
    const INP_W = 320;
    const INP_H = 44;
    const INP_X = W / 2 - INP_W / 2;
    const INP_Y = MID - INP_H / 2;

    // Inject placeholder color once
    this.placeholderStyle = document.createElement('style');
    this.placeholderStyle.textContent = `#gtd-name-input::placeholder { color: ${UI.TXT_MUTED}; opacity: 0.7; }`;
    document.head.appendChild(this.placeholderStyle);

    this.nameInput = document.createElement('input');
    this.nameInput.id = 'gtd-name-input';
    Object.assign(this.nameInput.style, {
      position:      'absolute',
      left:          `${rect.left + INP_X * scaleX}px`,
      top:           `${rect.top  + INP_Y * scaleY}px`,
      width:         `${INP_W * scaleX}px`,
      height:        `${INP_H * scaleY}px`,
      // 14 = grille de Neatpixels (13 tombait entre les pixels → glyphes flous)
      fontSize:      `${14 * scaleX}px`,
      textAlign:     'center',
      background:    '#0e1520',            // UI.BG_MID
      color:         UI.TXT_PARCHMENT,
      border:        '1px solid #1a2535',  // UI.SEPARATOR
      borderRadius:  `${6 * scaleX}px`,
      fontFamily:    FONT_UI,
      outline:       'none',
      letterSpacing: '1px',
      padding:       '0 8px',
      boxSizing:     'border-box',
    });
    this.nameInput.maxLength = 16;
    this.nameInput.placeholder = t('name_input.placeholder');
    document.body.appendChild(this.nameInput);
    this.nameInput.focus();

    this.nameInput.addEventListener('focus', () => {
      this.nameInput.style.border = '1px solid #59e0c8'; // UI.ACCENT_ARCANE
    });
    this.nameInput.addEventListener('blur', () => {
      this.nameInput.style.border = '1px solid #1a2535';
    });
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.startGame();
    });

    // ── BEGIN button (240×44 — norme tactile MainMenuScene) ──
    const BW = 240;
    const BH = 44;
    const BX = W / 2;
    const BY = MID + 70;

    const btnGfx = this.add.graphics();
    const drawBtn = (hover: boolean) => {
      btnGfx.clear();
      btnGfx.fillStyle(hover ? UI.BTN_BG_HOVER : UI.BTN_BG, 1);
      btnGfx.fillRoundedRect(BX - BW / 2, BY - BH / 2, BW, BH, 6);
      btnGfx.lineStyle(1, hover ? UI.ACCENT_ARCANE : UI.SEPARATOR, hover ? 0.9 : 1);
      btnGfx.strokeRoundedRect(BX - BW / 2, BY - BH / 2, BW, BH, 6);
    };
    drawBtn(false);

    const btnTxt = this.add.text(BX, BY, t('name_input.begin'), uiStyle(13, UI.TXT_PARCHMENT, { bold: true })).setOrigin(0.5);
    const hit = this.add.rectangle(BX, BY, BW + 6, BH + 4, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover',  () => { drawBtn(true);  btnTxt.setStyle({ color: UI.TXT_GOLD }); });
    hit.on('pointerout',   () => { drawBtn(false); btnTxt.setStyle({ color: UI.TXT_PARCHMENT }); });
    hit.on('pointerdown',  () => {
      // Feedback tap < 100 ms avant la transition
      this.tweens.add({ targets: btnTxt, scaleX: 0.96, scaleY: 0.96, duration: 50, yoyo: true });
      this.startGame();
    });

    // ── Footer hint ───────────────────────────────
    this.add.text(W / 2, H - 14, t('name_input.hint'), uiStyle(9, UI.TXT_HINT)).setOrigin(0.5, 1);

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
