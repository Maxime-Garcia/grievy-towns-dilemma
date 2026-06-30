import { SaveSystem }  from '../systems/SaveSystem';
import { GameScene }   from './GameScene';
import { KeyBindings, DEFAULT_BINDINGS, loadBindings, saveBindings } from '../data/keyBindings';
import { UI, drawPanel, pxStyle } from '../utils/UITheme';
import { t, getLang, setLang, type Lang } from '../i18n';

export type { KeyBindings };

const VFX_STORAGE_KEY = 'gtd_vfx';

export class PauseScene extends Phaser.Scene {
  private gameScene!:      GameScene;
  private tab:             'main' | 'keys' | 'settings' = 'main';
  private bindings!:       KeyBindings;
  private rebindTarget:    keyof KeyBindings | null = null;
  private rebindListener:  ((e: KeyboardEvent) => void) | null = null;

  constructor() { super({ key: 'PauseScene' }); }

  init(data: { gameScene: GameScene }) {
    this.gameScene    = data.gameScene;
    this.tab          = 'main';
    this.bindings     = loadBindings();
    this.rebindTarget = null;
  }

  create() {
    this.renderUI();
  }

  private renderUI() {
    this.children.removeAll(true);

    // Re-register ESC
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      .removeAllListeners()
      .once('down', () => this.resume());

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Overlay panel ─────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72);
    const frame = this.add.graphics();
    drawPanel(frame, W / 2 - 200, 20, 400, H - 40);

    // Title
    this.add.text(W / 2, 38, t('pause.title'), pxStyle(14, UI.TXT_GOLD, true)).setOrigin(0.5);

    // Separator below title
    const sep = this.add.graphics();
    sep.lineStyle(1, UI.BORDER_LIT, 0.6);
    sep.beginPath();
    sep.moveTo(W / 2 - 190, 62);
    sep.lineTo(W / 2 + 190, 62);
    sep.strokePath();

    // ── Tab buttons (3 tabs) ──────────────────────
    this.makeTabBtn(W / 2 - 110, 82, t('pause.tab.game'),     this.tab === 'main',     () => { this.tab = 'main';     this.renderUI(); });
    this.makeTabBtn(W / 2,       82, t('pause.tab.keys'),     this.tab === 'keys',     () => { this.tab = 'keys';     this.renderUI(); });
    this.makeTabBtn(W / 2 + 110, 82, t('pause.tab.settings'), this.tab === 'settings', () => { this.tab = 'settings'; this.renderUI(); });

    const sep2 = this.add.graphics();
    sep2.lineStyle(1, UI.BORDER_LIT, 0.4);
    sep2.beginPath();
    sep2.moveTo(W / 2 - 190, 100);
    sep2.lineTo(W / 2 + 190, 100);
    sep2.strokePath();

    if (this.tab === 'main')         this.renderMainTab(W, H);
    else if (this.tab === 'keys')    this.renderKeysTab(W, H);
    else                             this.renderSettingsTab(W, H);

    // ESC hint
    this.add.text(W / 2, H - 28, t('pause.esc_hint'), pxStyle(6, UI.TXT_HINT)).setOrigin(0.5);
  }

  private renderMainTab(W: number, _H: number) {
    const items: { label: string; action: () => void; color?: string }[] = [
      { label: t('pause.resume'),    action: () => this.resume()                                      },
      { label: t('pause.inventory'), action: () => { this.resume(); this.gameScene.openInventory(); } },
      { label: t('pause.skills'),    action: () => { this.resume(); this.gameScene.openSkills();    } },
      { label: t('pause.save'),      action: () => this.saveGame()                                    },
      { label: t('pause.mainmenu'),  action: () => this.goMainMenu(), color: UI.TXT_ORANGE            },
    ];

    items.forEach((item, i) => {
      const y = 122 + i * 50;
      this.makeMenuBtn(W / 2, y, 260, item.label, item.action, item.color);
    });
  }

  private renderKeysTab(W: number, H: number) {
    const actions: (keyof KeyBindings)[] = [
      'up', 'down', 'left', 'right', 'attack', 'dash',
      'skill1', 'skill2', 'skill3', 'skill4', 'inventory', 'skills',
    ];
    const rowH    = 30;
    const startY  = 110;

    this.add.text(W / 2 - 100, startY - 8, t('pause.keys.action'), pxStyle(7, UI.TXT_MUTED)).setOrigin(0.5);
    this.add.text(W / 2 + 100, startY - 8, t('pause.keys.key'),    pxStyle(7, UI.TXT_MUTED)).setOrigin(0.5);

    actions.forEach((action, i) => {
      const y = startY + i * rowH;

      this.add.text(W / 2 - 100, y + rowH / 2, t(`action.${action}`), pxStyle(8, UI.TXT_PARCHMENT))
        .setOrigin(0.5);

      const isWaiting = this.rebindTarget === action;
      const keyName   = isWaiting ? '...' : this.keyName(this.bindings[action]);

      const kbg = this.add.graphics();
      drawPanel(kbg, W / 2 + 55, y + 4, 90, rowH - 8, isWaiting ? 0x1a2030 : UI.SLOT_BG);
      if (isWaiting) {
        kbg.lineStyle(1, UI.CORNER, 0.8);
        kbg.strokeRect(W / 2 + 56, y + 5, 88, rowH - 10);
      }

      this.add.text(W / 2 + 100, y + rowH / 2, keyName, pxStyle(8, isWaiting ? UI.TXT_BLUE : UI.TXT_GOLD))
        .setOrigin(0.5);

      const hit = this.add.rectangle(W / 2 + 100, y + rowH / 2, 90, rowH - 8, 0, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.startRebind(action));
    });

    // Reset button
    const resetBg = this.add.graphics();
    drawPanel(resetBg, W / 2 - 80, H - 62, 160, 28, 0x1a0808);
    resetBg.lineStyle(1, 0x553333, 0.8);
    resetBg.strokeRect(W / 2 - 79, H - 61, 158, 26);

    const resetTxt = this.add.text(W / 2, H - 48, t('pause.keys.reset'), pxStyle(8, UI.TXT_RED))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    resetTxt.on('pointerover', () => resetTxt.setStyle({ color: UI.TXT_WHITE }));
    resetTxt.on('pointerout',  () => resetTxt.setStyle({ color: UI.TXT_RED }));
    resetTxt.on('pointerdown', () => {
      this.bindings = { ...DEFAULT_BINDINGS };
      saveBindings(this.bindings);
      this.gameScene.applyKeyBindings(this.bindings);
      this.renderUI();
    });
  }

  private renderSettingsTab(W: number, _H: number) {
    let y = 118;

    // ── Langue ──────────────────────────────────────
    this.add.text(W / 2, y, t('settings.section.language'), pxStyle(7, UI.TXT_MUTED)).setOrigin(0.5);
    y += 22;

    const currentLang  = getLang();
    const langs: Lang[] = ['fr', 'en'];
    const btnW = 60;
    const gap  = 16;
    const totalW = langs.length * btnW + (langs.length - 1) * gap;
    const startX = W / 2 - totalW / 2 + btnW / 2;

    langs.forEach((lang, i) => {
      const lx       = startX + i * (btnW + gap);
      const isActive = currentLang === lang;
      const lbg      = this.add.graphics();
      drawPanel(lbg, lx - btnW / 2, y - 14, btnW, 28, isActive ? 0x1a2a3a : UI.SLOT_BG);
      if (isActive) {
        lbg.lineStyle(1.5, UI.TXT_GOLD, 0.8);
        lbg.strokeRect(lx - btnW / 2 + 1, y - 13, btnW - 2, 26);
      }
      const ltxt = this.add.text(lx, y, lang.toUpperCase(), pxStyle(10, isActive ? UI.TXT_GOLD : UI.TXT_MUTED))
        .setOrigin(0.5);
      if (!isActive) {
        const hit = this.add.rectangle(lx, y, btnW, 28, 0, 0).setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => ltxt.setStyle({ color: UI.TXT_PARCHMENT }));
        hit.on('pointerout',  () => ltxt.setStyle({ color: UI.TXT_MUTED }));
        hit.on('pointerdown', () => {
          setLang(lang);
          this.gameScene.events.emit('language_changed');
          this.renderUI();
        });
      }
    });
    y += 48;

    // Séparateur
    const sepG = this.add.graphics();
    sepG.lineStyle(1, UI.BORDER_LIT, 0.4);
    sepG.beginPath(); sepG.moveTo(W / 2 - 140, y); sepG.lineTo(W / 2 + 140, y); sepG.strokePath();
    y += 20;

    // ── Graphismes ──────────────────────────────────
    this.add.text(W / 2, y, t('settings.section.graphics'), pxStyle(7, UI.TXT_MUTED)).setOrigin(0.5);
    y += 28;

    // Plein écran
    const isFs = !!this.scale.isFullscreen;
    this.renderToggleRow(W, y, t('settings.fullscreen'), () => {
      this.scale.toggleFullscreen();
      this.renderUI();
    }, isFs);
    y += 46;

    // VFX toggle
    const vfxOn = localStorage.getItem(VFX_STORAGE_KEY) !== 'false';
    this.renderToggleRow(W, y, t('settings.vfx'), () => {
      const next = !vfxOn;
      localStorage.setItem(VFX_STORAGE_KEY, next ? 'true' : 'false');
      this.gameScene.events.emit('vfx_changed', next);
      this.renderUI();
    }, vfxOn);
  }

  private renderToggleRow(W: number, y: number, label: string, onToggle: () => void, current?: boolean) {
    this.add.text(W / 2 - 80, y, label, pxStyle(9, UI.TXT_PARCHMENT)).setOrigin(0, 0.5);

    const valueLabel = current === undefined ? '→' : current ? t('settings.on') : t('settings.off');
    const btnColor   = current === false ? 0x1a0808 : current === true ? 0x081a08 : UI.BTN_BG;
    const txtColor   = current === false ? UI.TXT_RED : current === true ? UI.TXT_GREEN : UI.TXT_PARCHMENT;

    const bg = this.add.graphics();
    drawPanel(bg, W / 2 + 44, y - 13, 72, 26, btnColor);
    const txt = this.add.text(W / 2 + 80, y, valueLabel, pxStyle(9, txtColor)).setOrigin(0.5);
    const hit = this.add.rectangle(W / 2 + 80, y, 72, 26, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { bg.clear(); drawPanel(bg, W / 2 + 44, y - 13, 72, 26, UI.BTN_BG_HOVER); });
    hit.on('pointerout',  () => { bg.clear(); drawPanel(bg, W / 2 + 44, y - 13, 72, 26, btnColor); });
    hit.on('pointerdown', onToggle);
    void txt;
  }

  private makeTabBtn(x: number, y: number, label: string, active: boolean, cb: () => void) {
    const bg = this.add.graphics();
    drawPanel(bg, x - 60, y - 12, 120, 24, active ? 0x1a2030 : UI.SLOT_BG);
    if (active) {
      bg.lineStyle(1, UI.CORNER, 0.8);
      bg.strokeRect(x - 59, y - 11, 118, 22);
    }
    const txt = this.add.text(x, y, label, pxStyle(8, active ? UI.TXT_GOLD : UI.TXT_MUTED))
      .setOrigin(0.5);
    if (!active) {
      const hit = this.add.rectangle(x, y, 120, 24, 0, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => txt.setStyle({ color: UI.TXT_PARCHMENT }));
      hit.on('pointerout',  () => txt.setStyle({ color: UI.TXT_MUTED }));
      hit.on('pointerdown', cb);
    }
  }

  private makeMenuBtn(x: number, y: number, w: number, label: string, action: () => void, color?: string) {
    const H   = 34;
    const bg  = this.add.graphics();
    const col = color ?? UI.TXT_PARCHMENT;

    const draw = (hover: boolean) => {
      bg.clear();
      drawPanel(bg, x - w / 2, y - H / 2, w, H, hover ? UI.BTN_BG_HOVER : UI.BTN_BG);
      if (hover) {
        bg.lineStyle(1, UI.CORNER, 0.8);
        bg.strokeRect(x - w / 2 + 1, y - H / 2 + 1, w - 2, H - 2);
      }
    };
    draw(false);

    const txt = this.add.text(x, y, label, pxStyle(9, col)).setOrigin(0.5);
    const hit = this.add.rectangle(x, y, w, H, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover',  () => { draw(true);  txt.setStyle({ color: UI.TXT_GOLD });  });
    hit.on('pointerout',   () => { draw(false); txt.setStyle({ color: col }); });
    hit.on('pointerdown',  action);
  }

  private startRebind(action: keyof KeyBindings) {
    if (this.rebindListener) {
      window.removeEventListener('keydown', this.rebindListener);
      this.rebindListener = null;
    }
    this.rebindTarget  = action;
    this.renderUI();

    this.rebindListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.rebindTarget = null;
        window.removeEventListener('keydown', this.rebindListener!);
        this.rebindListener = null;
        this.renderUI();
        return;
      }
      e.preventDefault();
      const phKey =
        Phaser.Input.Keyboard.KeyCodes[e.key.toUpperCase() as keyof typeof Phaser.Input.Keyboard.KeyCodes]
        ?? e.keyCode;
      this.bindings[action] = phKey as number;
      saveBindings(this.bindings);
      this.gameScene.applyKeyBindings(this.bindings);
      this.rebindTarget = null;
      window.removeEventListener('keydown', this.rebindListener!);
      this.rebindListener = null;
      this.renderUI();
    };
    window.addEventListener('keydown', this.rebindListener, { once: false });
  }

  private keyName(code: number): string {
    for (const [name, val] of Object.entries(Phaser.Input.Keyboard.KeyCodes)) {
      if (val === code) return name;
    }
    return `#${code}`;
  }

  private saveGame() {
    SaveSystem.save(this.gameScene.gameState, this.gameScene.gameState.saveSlot);
    this.gameScene.events.emit('show_notification', t('notif.saved'));
    this.renderUI();
  }

  private goMainMenu() {
    if (this.rebindListener) {
      window.removeEventListener('keydown', this.rebindListener);
      this.rebindListener = null;
    }
    this.gameScene.goToMainMenu();
  }

  private resume() {
    if (this.rebindListener) {
      window.removeEventListener('keydown', this.rebindListener);
      this.rebindListener = null;
    }
    this.gameScene.setPaused(false);
    this.scene.stop();
  }

  shutdown() {
    if (this.rebindListener) {
      window.removeEventListener('keydown', this.rebindListener);
      this.rebindListener = null;
    }
    this.input.keyboard?.removeAllKeys(true);
  }
}
