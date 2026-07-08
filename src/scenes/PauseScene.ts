import { SaveSystem }  from '../systems/SaveSystem';
import { GameScene }   from './GameScene';
import { KeyBindings, DEFAULT_BINDINGS, loadBindings, saveBindings } from '../data/keyBindings';
import { UI, drawGlowPanel, drawDivider, uiStyle, addCloseButton } from '../utils/UITheme';
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
    this.cameras.main.fadeIn(300, 0, 0, 0);
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
    // Panneau translucide arcane fresh : le jeu figé reste perceptible derrière
    drawGlowPanel(frame, W / 2 - 200, 20, 400, H - 40, UI.ACCENT_ARCANE, UI.BG_DEEP, 10, 0.85);

    // Title (or = identité) + bouton × standard (règle inter-écrans §7.1)
    this.add.text(W / 2, 38, t('pause.title'), uiStyle(15, UI.TXT_GOLD, { bold: true, stroke: true })).setOrigin(0.5);
    addCloseButton(this, W / 2 + 178, 40, () => this.resume());

    // Separator below title (cyan = structure)
    const sep = this.add.graphics();
    drawDivider(sep, W / 2 - 190, 62, 380, UI.ACCENT_ARCANE, 0.35);

    // ── Tab buttons (3 tabs) ──────────────────────
    this.makeTabBtn(W / 2 - 110, 82, t('pause.tab.game'),     this.tab === 'main',     () => { this.tab = 'main';     this.renderUI(); });
    this.makeTabBtn(W / 2,       82, t('pause.tab.keys'),     this.tab === 'keys',     () => { this.tab = 'keys';     this.renderUI(); });
    this.makeTabBtn(W / 2 + 110, 82, t('pause.tab.settings'), this.tab === 'settings', () => { this.tab = 'settings'; this.renderUI(); });

    const sep2 = this.add.graphics();
    drawDivider(sep2, W / 2 - 190, 100, 380, UI.ACCENT_ARCANE, 0.2);

    if (this.tab === 'main')         this.renderMainTab(W, H);
    else if (this.tab === 'keys')    this.renderKeysTab(W, H);
    else                             this.renderSettingsTab(W, H);

    // ESC hint
    this.add.text(W / 2, H - 28, t('pause.esc_hint'), uiStyle(9, UI.TXT_HINT)).setOrigin(0.5);
  }

  private renderMainTab(W: number, _H: number) {
    const items: { label: string; action: () => void; color?: string }[] = [
      { label: t('pause.resume'),    action: () => this.resume()                                      },
      { label: t('pause.inventory'), action: () => { this.resume(); this.gameScene.openInventory(); } },
      { label: t('pause.skills'),    action: () => { this.resume(); this.gameScene.openSkills();    } },
      { label: t('pause.bestiary'),  action: () => this.openBestiary()                               },
      { label: t('pause.arsenal'),   action: () => this.openArsenal()                                },
      { label: t('pause.save'),      action: () => this.saveGame()                                    },
      { label: t('pause.mainmenu'),  action: () => this.goMainMenu(), color: UI.TXT_ORANGE            },
    ];

    items.forEach((item, i) => {
      const y = 116 + i * 44;
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

    this.add.text(W / 2 - 100, startY - 8, t('pause.keys.action'), uiStyle(9, UI.TXT_MUTED, { bold: true })).setOrigin(0.5);
    this.add.text(W / 2 + 100, startY - 8, t('pause.keys.key'),    uiStyle(9, UI.TXT_MUTED, { bold: true })).setOrigin(0.5);

    actions.forEach((action, i) => {
      const y = startY + i * rowH;

      // Zébrage discret une ligne sur deux — lecture rapide en colonne
      if (i % 2 === 0) {
        const zebra = this.add.graphics();
        zebra.fillStyle(0xffffff, 0.02);
        zebra.fillRoundedRect(W / 2 - 186, y + 2, 372, rowH - 4, 3);
      }

      this.add.text(W / 2 - 100, y + rowH / 2, t(`action.${action}`), uiStyle(10, UI.TXT_PARCHMENT))
        .setOrigin(0.5);

      const isWaiting = this.rebindTarget === action;
      const keyName   = isWaiting ? '...' : this.keyName(this.bindings[action]);

      // Chip de touche : carte arrondie — en attente de rebind = liseré arcane
      const kbg = this.add.graphics();
      kbg.fillStyle(isWaiting ? 0x102028 : UI.SLOT_BG, 1);
      kbg.fillRoundedRect(W / 2 + 55, y + 4, 90, rowH - 8, 4);
      kbg.lineStyle(1, isWaiting ? UI.ACCENT_ARCANE : UI.SEPARATOR, isWaiting ? 0.9 : 1);
      kbg.strokeRoundedRect(W / 2 + 55, y + 4, 90, rowH - 8, 4);

      this.add.text(W / 2 + 100, y + rowH / 2, keyName,
        uiStyle(10, isWaiting ? UI.TXT_BLUE : UI.TXT_GOLD, { bold: true }))
        .setOrigin(0.5);

      const hit = this.add.rectangle(W / 2 + 100, y + rowH / 2, 96, rowH, 0, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.startRebind(action));
    });

    // Reset button (visuel 30 px arrondi, hit zone tactile 44 px)
    const resetBg = this.add.graphics();
    const resetY  = H - 64;
    resetBg.fillStyle(0x1a0808, 1);
    resetBg.fillRoundedRect(W / 2 - 80, resetY, 160, 30, 4);
    resetBg.lineStyle(1, 0x553333, 0.9);
    resetBg.strokeRoundedRect(W / 2 - 80, resetY, 160, 30, 4);

    const resetTxt = this.add.text(W / 2, resetY + 15, t('pause.keys.reset'), uiStyle(10, UI.TXT_RED, { bold: true }))
      .setOrigin(0.5);
    const resetHit = this.add.rectangle(W / 2, resetY + 15, 166, 44, 0, 0)
      .setInteractive({ useHandCursor: true });
    resetHit.on('pointerover', () => resetTxt.setStyle({ color: UI.TXT_WHITE }));
    resetHit.on('pointerout',  () => resetTxt.setStyle({ color: UI.TXT_RED }));
    resetHit.on('pointerdown', () => {
      this.bindings = { ...DEFAULT_BINDINGS };
      saveBindings(this.bindings);
      this.gameScene.applyKeyBindings(this.bindings);
      this.renderUI();
    });
  }

  private renderSettingsTab(W: number, _H: number) {
    let y = 118;

    // ── Langue ──────────────────────────────────────
    this.addSectionTitle(W, y, t('settings.section.language'));
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
      lbg.fillStyle(isActive ? UI.BG_MID : UI.SLOT_BG, 1);
      lbg.fillRoundedRect(lx - btnW / 2, y - 14, btnW, 28, 4);
      lbg.lineStyle(isActive ? 1.5 : 1, isActive ? UI.ACCENT_ARCANE : UI.SEPARATOR, isActive ? 0.9 : 1);
      lbg.strokeRoundedRect(lx - btnW / 2, y - 14, btnW, 28, 4);
      // La valeur active reste dorée (or = valeur), l'inactive est muted
      const ltxt = this.add.text(lx, y, lang.toUpperCase(),
        uiStyle(11, isActive ? UI.TXT_GOLD : UI.TXT_MUTED, { bold: isActive }))
        .setOrigin(0.5);
      if (!isActive) {
        const hit = this.add.rectangle(lx, y, btnW + 6, 44, 0, 0).setInteractive({ useHandCursor: true });
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
    drawDivider(sepG, W / 2 - 140, y, 280, UI.ACCENT_ARCANE, 0.2);
    y += 20;

    // ── Graphismes ──────────────────────────────────
    this.addSectionTitle(W, y, t('settings.section.graphics'));
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

  /** Titre de section des réglages : pastille + label cyan (structure) + filets latéraux. */
  private addSectionTitle(W: number, y: number, label: string) {
    const txt = this.add.text(W / 2, y, label, uiStyle(10, UI.TXT_CYAN, { bold: true })).setOrigin(0.5);
    const g = this.add.graphics();
    g.lineStyle(1, UI.ACCENT_ARCANE, 0.25);
    g.beginPath();
    g.moveTo(W / 2 - 140, y);
    g.lineTo(W / 2 - txt.width / 2 - 10, y);
    g.moveTo(W / 2 + txt.width / 2 + 10, y);
    g.lineTo(W / 2 + 140, y);
    g.strokePath();
  }

  private renderToggleRow(W: number, y: number, label: string, onToggle: () => void, current?: boolean) {
    this.add.text(W / 2 - 80, y, label, uiStyle(11, UI.TXT_PARCHMENT)).setOrigin(0, 0.5);

    const valueLabel  = current === undefined ? '→' : current ? t('settings.on') : t('settings.off');
    const fillColor   = current === false ? 0x1a0808 : current === true ? 0x081a08 : UI.BTN_BG;
    const borderColor = current === false ? 0x553333 : current === true ? 0x2a5533 : UI.SEPARATOR;
    const txtColor    = current === false ? UI.TXT_RED : current === true ? UI.TXT_GREEN : UI.TXT_PARCHMENT;

    const bg = this.add.graphics();
    const drawChip = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? UI.BTN_BG_HOVER : fillColor, 1);
      bg.fillRoundedRect(W / 2 + 44, y - 14, 72, 28, 14);
      bg.lineStyle(1, hover ? UI.ACCENT_ARCANE : borderColor, hover ? 0.9 : 1);
      bg.strokeRoundedRect(W / 2 + 44, y - 14, 72, 28, 14);
    };
    drawChip(false);

    this.add.text(W / 2 + 80, y, valueLabel, uiStyle(10, txtColor, { bold: true })).setOrigin(0.5);
    const hit = this.add.rectangle(W / 2 + 80, y, 78, 44, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => drawChip(true));
    hit.on('pointerout',  () => drawChip(false));
    hit.on('pointerdown', onToggle);
  }

  private makeTabBtn(x: number, y: number, label: string, active: boolean, cb: () => void) {
    const bg = this.add.graphics();
    bg.fillStyle(active ? UI.BG_MID : UI.BTN_BG, active ? 1 : 0.8);
    bg.fillRoundedRect(x - 52, y - 12, 104, 24, 5);
    if (active) {
      bg.lineStyle(1, UI.ACCENT_ARCANE, 0.8);
      bg.strokeRoundedRect(x - 52, y - 12, 104, 24, 5);
      // Bande d'accent basse — même langage que les tabs de SkillScene
      bg.fillStyle(UI.ACCENT_ARCANE, 0.9);
      bg.fillRoundedRect(x - 46, y + 9, 92, 3, 1.5);
    } else {
      bg.lineStyle(1, UI.SEPARATOR, 1);
      bg.strokeRoundedRect(x - 52, y - 12, 104, 24, 5);
    }
    const txt = this.add.text(x, y, label,
      uiStyle(11, active ? UI.TXT_CYAN : UI.TXT_MUTED, { bold: active }))
      .setOrigin(0.5);
    if (!active) {
      // Hit zone tactile élargie (44 px de haut — résorption partielle dette D6)
      const hit = this.add.rectangle(x, y, 110, 44, 0, 0).setInteractive({ useHandCursor: true });
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
      bg.fillStyle(hover ? UI.BTN_BG_HOVER : UI.BTN_BG, 1);
      bg.fillRoundedRect(x - w / 2, y - H / 2, w, H, 5);
      bg.lineStyle(1, hover ? UI.ACCENT_ARCANE : UI.SEPARATOR, hover ? 0.9 : 1);
      bg.strokeRoundedRect(x - w / 2, y - H / 2, w, H, 5);
    };
    draw(false);

    const txt = this.add.text(x, y, label, uiStyle(12, col, { bold: true })).setOrigin(0.5);
    // Hit zone 44 px de haut (norme tactile) — le visuel reste à 34 px
    const hit = this.add.rectangle(x, y, w + 6, 44, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover',  () => {
      draw(true);
      txt.setStyle({ color: UI.TXT_GOLD });
      this.tweens.add({ targets: txt, scaleX: 1.03, scaleY: 1.03, duration: 100, ease: 'Quad.easeOut' });
    });
    hit.on('pointerout',   () => {
      draw(false);
      txt.setStyle({ color: col });
      this.tweens.add({ targets: txt, scaleX: 1, scaleY: 1, duration: 100, ease: 'Quad.easeOut' });
    });
    hit.on('pointerdown',  () => {
      // Feedback tap < 100 ms avant l'action
      this.tweens.add({ targets: txt, scaleX: 0.96, scaleY: 0.96, duration: 50, yoyo: true });
      action();
    });
  }

  private openBestiary() {
    if (this.scene.isActive('BestiaryScene')) return;
    this.scene.launch('BestiaryScene', {
      gameScene: this.gameScene,
      world: this.gameScene.gameState.world,
    });
    this.scene.pause('PauseScene');
  }

  private openArsenal() {
    if (this.scene.isActive('ArsenalScene')) return;
    this.scene.launch('ArsenalScene', {
      gameScene: this.gameScene,
      world: this.gameScene.gameState.world,
    });
    this.scene.pause('PauseScene');
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
    const slot = this.gameScene.gameState.saveSlot;
    const ok   = typeof slot === 'number' && SaveSystem.save(this.gameScene.gameState, slot);
    const W    = this.cameras.main.width;
    const msg  = this.add.text(
      W / 2, this.cameras.main.height / 2,
      ok ? t('notif.saved') : t('notif.save_error').replace('{slot}', String(slot)),
      uiStyle(13, ok ? UI.TXT_GREEN : UI.TXT_RED, { bold: true, stroke: true }),
    ).setOrigin(0.5).setDepth(50).setAlpha(0);

    this.tweens.add({ targets: msg, alpha: 1, duration: 150 });
    this.time.delayedCall(1600, () => {
      this.tweens.add({ targets: msg, alpha: 0, duration: 300, onComplete: () => msg.destroy() });
    });
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
