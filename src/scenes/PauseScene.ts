import { SaveSystem }  from '../systems/SaveSystem';
import { GameScene }   from './GameScene';
import { KeyBindings, DEFAULT_BINDINGS, loadBindings, saveBindings, ACTION_LABELS } from '../data/keyBindings';

export type { KeyBindings };

export class PauseScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private tab: 'main' | 'keys' = 'main';
  private bindings!: KeyBindings;
  private rebindTarget: keyof KeyBindings | null = null;
  private rebindListener: ((e: KeyboardEvent) => void) | null = null;

  constructor() { super({ key: 'PauseScene' }); }

  init(data: { gameScene: GameScene }) {
    this.gameScene   = data.gameScene;
    this.tab         = 'main';
    this.bindings    = loadBindings();
    this.rebindTarget = null;
  }

  create() {
    this.renderUI();
  }

  private renderUI() {
    this.children.removeAll(true);
    // Re-register ESC after every render (removeAll destroys nothing but prior once() is now stale)
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      .removeAllListeners()
      .once('down', () => this.resume());
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Overlay
    this.add.rectangle(W / 2, H / 2, W - 60, H - 40, 0x06060e, 0.97)
      .setStrokeStyle(1, 0x336655);

    this.add.text(W / 2, 28, 'PAUSE', {
      fontSize: '20px', color: '#e8d5b0', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Tab buttons
    this.makeTabBtn(W / 2 - 80, 58, 'Jeu', this.tab === 'main', () => { this.tab = 'main'; this.renderUI(); });
    this.makeTabBtn(W / 2 + 80, 58, 'Touches', this.tab === 'keys', () => { this.tab = 'keys'; this.renderUI(); });
    this.add.rectangle(W / 2, 74, W - 60, 1, 0x336655);

    if (this.tab === 'main') this.renderMainTab(W, H);
    else                      this.renderKeysTab(W, H);

    // ESC hint
    this.add.text(W / 2, H - 14, '[Échap] reprendre', {
      fontSize: '9px', color: '#554433', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  private renderMainTab(W: number, H: number) {
    const items: { label: string; action: () => void; color?: string }[] = [
      { label: 'Reprendre',         action: () => this.resume()                                     },
      { label: 'Inventaire',        action: () => { this.resume(); this.gameScene.openInventory(); } },
      { label: 'Compétences',       action: () => { this.resume(); this.gameScene.openSkills();    } },
      { label: 'Sauvegarder',       action: () => this.saveGame()                                   },
      { label: 'Menu principal',    action: () => this.goMainMenu(),    color: '#ffaa44'             },
    ];

    items.forEach((item, i) => {
      const y = 110 + i * 50;
      const btn = this.add.rectangle(W / 2, y, 260, 36, 0x111122).setInteractive({ useHandCursor: true });
      this.add.text(W / 2, y, item.label, {
        fontSize: '14px', color: item.color ?? '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5);
      btn.on('pointerover', () => btn.setFillStyle(0x222244));
      btn.on('pointerout',  () => btn.setFillStyle(0x111122));
      btn.on('pointerdown', item.action);
    });
  }

  private renderKeysTab(W: number, H: number) {
    const actions = Object.keys(ACTION_LABELS) as (keyof KeyBindings)[];
    const rowH = 30;
    const startY = 88;

    this.add.text(W / 2 - 100, startY - 6, 'ACTION', { fontSize: '9px', color: '#887766', fontFamily: 'monospace' }).setOrigin(0.5);
    this.add.text(W / 2 + 100, startY - 6, 'TOUCHE', { fontSize: '9px', color: '#887766', fontFamily: 'monospace' }).setOrigin(0.5);

    actions.forEach((action, i) => {
      const y = startY + i * rowH;
      this.add.text(W / 2 - 100, y + rowH / 2, ACTION_LABELS[action], {
        fontSize: '11px', color: '#ccccbb', fontFamily: 'monospace',
      }).setOrigin(0.5);

      const isWaiting = this.rebindTarget === action;
      const keyCode   = this.bindings[action];
      const keyName   = isWaiting ? '...' : this.keyName(keyCode);
      const btnColor  = isWaiting ? 0x223355 : 0x111122;

      const keyBtn = this.add.rectangle(W / 2 + 100, y + rowH / 2, 90, 22, btnColor)
        .setStrokeStyle(1, isWaiting ? 0x4477aa : 0x332233)
        .setInteractive({ useHandCursor: true });

      this.add.text(W / 2 + 100, y + rowH / 2, keyName, {
        fontSize: '12px', color: isWaiting ? '#aaddff' : '#ffdd88', fontFamily: 'monospace',
      }).setOrigin(0.5);

      keyBtn.on('pointerdown', () => this.startRebind(action));
    });

    const resetBtn = this.add.rectangle(W / 2, H - 50, 160, 28, 0x221111)
      .setStrokeStyle(1, 0x553333).setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H - 50, 'Réinitialiser', {
      fontSize: '11px', color: '#ff8866', fontFamily: 'monospace',
    }).setOrigin(0.5);
    resetBtn.on('pointerdown', () => {
      this.bindings = { ...DEFAULT_BINDINGS };
      saveBindings(this.bindings);
      this.gameScene.applyKeyBindings(this.bindings);
      this.renderUI();
    });
  }

  private startRebind(action: keyof KeyBindings) {
    if (this.rebindListener) {
      window.removeEventListener('keydown', this.rebindListener);
      this.rebindListener = null;
    }
    this.rebindTarget = action;
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
      const phKey = Phaser.Input.Keyboard.KeyCodes[e.key.toUpperCase() as keyof typeof Phaser.Input.Keyboard.KeyCodes]
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

  private makeTabBtn(x: number, y: number, label: string, active: boolean, cb: () => void) {
    const btn = this.add.rectangle(x, y, 120, 24, active ? 0x223344 : 0x111122)
      .setStrokeStyle(1, active ? 0x336655 : 0x332233)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontSize: '12px', color: active ? '#aaddcc' : '#665544', fontFamily: 'monospace',
    }).setOrigin(0.5);
    if (!active) btn.on('pointerdown', cb);
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
    this.scene.stop();
    this.gameScene.scene.stop('UIScene');
    this.gameScene.scene.stop();
    this.scene.start('MainMenuScene');
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
