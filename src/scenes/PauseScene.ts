import { SaveSystem }  from '../systems/SaveSystem';
import { GameScene }   from './GameScene';
import { KeyBindings, DEFAULT_BINDINGS, loadBindings, saveBindings, ACTION_LABELS } from '../data/keyBindings';
import { UI, drawPanel, pxStyle } from '../utils/UITheme';

export type { KeyBindings };

export class PauseScene extends Phaser.Scene {
  private gameScene!:      GameScene;
  private tab:             'main' | 'keys' = 'main';
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
    this.add.text(W / 2, 38, 'PAUSE', pxStyle(14, UI.TXT_GOLD, true)).setOrigin(0.5);

    // Separator below title
    const sep = this.add.graphics();
    sep.lineStyle(1, UI.BORDER_LIT, 0.6);
    sep.beginPath();
    sep.moveTo(W / 2 - 190, 62);
    sep.lineTo(W / 2 + 190, 62);
    sep.strokePath();

    // ── Tab buttons ───────────────────────────────
    this.makeTabBtn(W / 2 - 68, 82, 'Jeu',    this.tab === 'main', () => { this.tab = 'main'; this.renderUI(); });
    this.makeTabBtn(W / 2 + 68, 82, 'Touches', this.tab === 'keys', () => { this.tab = 'keys'; this.renderUI(); });

    const sep2 = this.add.graphics();
    sep2.lineStyle(1, UI.BORDER_LIT, 0.4);
    sep2.beginPath();
    sep2.moveTo(W / 2 - 190, 100);
    sep2.lineTo(W / 2 + 190, 100);
    sep2.strokePath();

    if (this.tab === 'main') this.renderMainTab(W, H);
    else                      this.renderKeysTab(W, H);

    // ESC hint
    this.add.text(W / 2, H - 28, '[Échap] reprendre', pxStyle(6, UI.TXT_HINT)).setOrigin(0.5);
  }

  private renderMainTab(W: number, _H: number) {
    const items: { label: string; action: () => void; color?: string }[] = [
      { label: 'Reprendre',       action: () => this.resume()                                      },
      { label: 'Inventaire',      action: () => { this.resume(); this.gameScene.openInventory(); } },
      { label: 'Compétences',     action: () => { this.resume(); this.gameScene.openSkills();    } },
      { label: 'Sauvegarder',     action: () => this.saveGame()                                    },
      { label: 'Menu principal',  action: () => this.goMainMenu(), color: UI.TXT_ORANGE            },
    ];

    items.forEach((item, i) => {
      const y = 122 + i * 50;
      this.makeMenuBtn(W / 2, y, 260, item.label, item.action, item.color);
    });
  }

  private renderKeysTab(W: number, H: number) {
    const actions = Object.keys(ACTION_LABELS) as (keyof KeyBindings)[];
    const rowH    = 30;
    const startY  = 110;

    this.add.text(W / 2 - 100, startY - 8, 'ACTION', pxStyle(7, UI.TXT_MUTED)).setOrigin(0.5);
    this.add.text(W / 2 + 100, startY - 8, 'TOUCHE', pxStyle(7, UI.TXT_MUTED)).setOrigin(0.5);

    actions.forEach((action, i) => {
      const y = startY + i * rowH;

      this.add.text(W / 2 - 100, y + rowH / 2, ACTION_LABELS[action], pxStyle(8, UI.TXT_PARCHMENT))
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

    const resetTxt = this.add.text(W / 2, H - 48, 'Réinitialiser', pxStyle(8, UI.TXT_RED))
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
    this.gameScene.events.emit('show_notification', 'Partie sauvegardée.');
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
