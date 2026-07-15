import { SaveSystem }  from '../systems/SaveSystem';
import { GameScene }   from './GameScene';
import { KeyBindings, DEFAULT_BINDINGS, loadBindings, saveBindings } from '../data/keybindings';
import { UI, TYPE, drawGlowPanel, drawDivider, uiStyle, titleStyle, addCloseButton, openScreenTransition, closeScreenTransition } from '../utils/UITheme';
import { t, getLang, setLang, type Lang } from '../i18n';

export type { KeyBindings };

const VFX_STORAGE_KEY = 'gtd_vfx';

export class PauseScene extends Phaser.Scene {
  private gameScene!:      GameScene;
  private tab:             'main' | 'keys' | 'settings' = 'main';
  private bindings!:       KeyBindings;
  private rebindTarget:    keyof KeyBindings | null = null;
  private rebindListener:  ((e: KeyboardEvent) => void) | null = null;
  // True dès que l'animation de FERMETURE (closeScreenTransition, ~170ms) est en
  // cours — ignore tout nouvel appel à resume() et tout lancement de sous-écran
  // tant qu'elle tourne (évite un scene.stop() dupliqué ou un Bestiaire lancé
  // par-dessus un menu en train de se dissoudre). Même patron que BestiaryScene.
  private closing = false;

  constructor() { super({ key: 'PauseScene' }); }

  init(data: { gameScene: GameScene }) {
    this.gameScene    = data.gameScene;
    this.tab          = 'main';
    this.bindings     = loadBindings();
    this.rebindTarget = null;
    this.closing      = false;
  }

  create() {
    // Phaser n'appelle PAS scene.shutdown() de lui-même : Systems.shutdown() se
    // contente d'ÉMETTRE l'événement SHUTDOWN. Sans cette ligne, la méthode
    // shutdown() ci-dessous est du CODE MORT — les listeners qu'elle est censée
    // retirer survivent à la scène, et chaque create() en empile une couche de plus.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    openScreenTransition(this);
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
    // Panneau translucide arcane fresh : le jeu figé reste perceptible derrière.
    // 400 → 440 : largeur calée sur l'ancienne typo — la nouvelle échelle (BODY 14)
    // et le canvas 960 justifient un panneau qui respire.
    const PANEL_W = 440;
    drawGlowPanel(frame, W / 2 - PANEL_W / 2, 20, PANEL_W, H - 40, UI.ACCENT_ARCANE, UI.BG_DEEP, 10, 0.85);

    // Title en police Boss (titleStyle — l'ancien uiStyle(15) retombait à la
    // taille du corps) + bouton × standard (règle inter-écrans §7.1)
    this.add.text(W / 2, 40, t('pause.title'), titleStyle(UI.TXT_GOLD, { stroke: true })).setOrigin(0.5);
    addCloseButton(this, W / 2 + PANEL_W / 2 - 24, 42, () => this.resume());

    // Separator below title (cyan = structure)
    const sep = this.add.graphics();
    drawDivider(sep, W / 2 - PANEL_W / 2 + 12, 64, PANEL_W - 24, UI.ACCENT_ARCANE, 0.35);

    // ── Tab buttons (3 tabs) ──────────────────────
    this.makeTabBtn(W / 2 - 126, 86, t('pause.tab.game'),     this.tab === 'main',     () => { this.tab = 'main';     this.renderUI(); });
    this.makeTabBtn(W / 2,       86, t('pause.tab.keys'),     this.tab === 'keys',     () => { this.tab = 'keys';     this.renderUI(); });
    this.makeTabBtn(W / 2 + 126, 86, t('pause.tab.settings'), this.tab === 'settings', () => { this.tab = 'settings'; this.renderUI(); });

    const sep2 = this.add.graphics();
    drawDivider(sep2, W / 2 - PANEL_W / 2 + 12, 108, PANEL_W - 24, UI.ACCENT_ARCANE, 0.2);

    if (this.tab === 'main')         this.renderMainTab(W, H);
    else if (this.tab === 'keys')    this.renderKeysTab(W, H);
    else                             this.renderSettingsTab(W, H);

    // ESC hint
    this.add.text(W / 2, H - 28, t('pause.esc_hint'), uiStyle(9, UI.TXT_HINT)).setOrigin(0.5);
  }

  private renderMainTab(W: number, _H: number) {
    const items: { label: string; action: () => void; color?: string }[] = [
      { label: t('pause.resume'),    action: () => this.resume()                                      },
      // Inventaire/Talents : l'ouverture est passée en callback `after` de
      // resume() — elle ne part qu'une fois l'animation de fermeture du menu
      // terminée. L'ancien enchaînement synchrone (resume puis open) ferait
      // désormais tomber le setPaused(false) différé de resume() APRÈS le
      // setPaused(true) d'openInventory → jeu dé-pausé sous l'inventaire.
      { label: t('pause.inventory'), action: () => this.resume(() => this.gameScene.openInventory()) },
      { label: t('pause.skills'),    action: () => this.resume(() => this.gameScene.openSkills())    },
      { label: t('pause.bestiary'),  action: () => this.openBestiary()                               },
      { label: t('pause.arsenal'),   action: () => this.openArsenal()                                },
      { label: t('pause.save'),      action: () => this.saveGame()                                    },
      { label: t('pause.mainmenu'),  action: () => this.goMainMenu(), color: UI.TXT_ORANGE            },
    ];

    items.forEach((item, i) => {
      // Pas de 52 (au lieu de 44) : les hit zones de 44px ne se touchent plus —
      // 8px de respiration entre deux actions, plus de tap ambigu en bord de bouton.
      const y = 132 + i * 52;
      this.makeMenuBtn(W / 2, y, 280, item.label, item.action, item.color);
    });
  }

  private renderKeysTab(W: number, H: number) {
    const actions: (keyof KeyBindings)[] = [
      'up', 'down', 'left', 'right', 'attack', 'dash',
      'skill1', 'skill2', 'skill3', 'skill4', 'inventory', 'skills',
    ];
    // rowH 30 → 36 : libellés en BODY 14 (l'ancien 10 tombait en Minimal) +
    // chips plus hautes. Les hit zones restent = rowH (non chevauchantes) :
    // deux zones de 44px espacées de 30 se voleraient les taps en bord de ligne.
    const rowH    = 36;
    const startY  = 122;

    this.add.text(W / 2 - 110, startY - 10, t('pause.keys.action'), uiStyle(9, UI.TXT_MUTED, { bold: true })).setOrigin(0.5);
    this.add.text(W / 2 + 110, startY - 10, t('pause.keys.key'),    uiStyle(9, UI.TXT_MUTED, { bold: true })).setOrigin(0.5);

    actions.forEach((action, i) => {
      const y = startY + i * rowH;

      // Zébrage discret une ligne sur deux — lecture rapide en colonne
      if (i % 2 === 0) {
        const zebra = this.add.graphics();
        zebra.fillStyle(0xffffff, 0.02);
        zebra.fillRoundedRect(W / 2 - 200, y + 2, 400, rowH - 4, 3);
      }

      this.add.text(W / 2 - 110, y + rowH / 2, t(`action.${action}`), uiStyle(TYPE.BODY, UI.TXT_PARCHMENT))
        .setOrigin(0.5);

      const isWaiting = this.rebindTarget === action;
      const keyName   = isWaiting ? '...' : this.keyName(this.bindings[action]);

      // Chip de touche : carte arrondie — en attente de rebind = liseré arcane
      const kbg = this.add.graphics();
      kbg.fillStyle(isWaiting ? 0x102028 : UI.SLOT_BG, 1);
      kbg.fillRoundedRect(W / 2 + 58, y + 4, 104, rowH - 8, 4);
      kbg.lineStyle(1, isWaiting ? UI.ACCENT_ARCANE : UI.SEPARATOR, isWaiting ? 0.9 : 1);
      kbg.strokeRoundedRect(W / 2 + 58, y + 4, 104, rowH - 8, 4);

      this.add.text(W / 2 + 110, y + rowH / 2, keyName,
        uiStyle(TYPE.BODY, isWaiting ? UI.TXT_BLUE : UI.TXT_GOLD, { bold: true }))
        .setOrigin(0.5);

      const hit = this.add.rectangle(W / 2 + 110, y + rowH / 2, 110, rowH, 0, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.startRebind(action));
    });

    // Reset button (visuel 36 px arrondi, hit zone tactile 44 px)
    const resetBg = this.add.graphics();
    const resetY  = H - 68;
    resetBg.fillStyle(0x1a0808, 1);
    resetBg.fillRoundedRect(W / 2 - 90, resetY, 180, 36, 4);
    resetBg.lineStyle(1, 0x553333, 0.9);
    resetBg.strokeRoundedRect(W / 2 - 90, resetY, 180, 36, 4);

    const resetTxt = this.add.text(W / 2, resetY + 18, t('pause.keys.reset'), uiStyle(TYPE.BODY, UI.TXT_RED, { bold: true }))
      .setOrigin(0.5);
    const resetHit = this.add.rectangle(W / 2, resetY + 18, 186, 44, 0, 0)
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
    let y = 126;

    // ── Langue ──────────────────────────────────────
    this.addSectionTitle(W, y, t('settings.section.language'));
    y += 28;

    const currentLang  = getLang();
    const langs: Lang[] = ['fr', 'en'];
    const btnW = 68;
    const gap  = 16;
    const totalW = langs.length * btnW + (langs.length - 1) * gap;
    const startX = W / 2 - totalW / 2 + btnW / 2;

    langs.forEach((lang, i) => {
      const lx       = startX + i * (btnW + gap);
      const isActive = currentLang === lang;
      const lbg      = this.add.graphics();
      lbg.fillStyle(isActive ? UI.BG_MID : UI.SLOT_BG, 1);
      lbg.fillRoundedRect(lx - btnW / 2, y - 16, btnW, 32, 4);
      lbg.lineStyle(isActive ? 1.5 : 1, isActive ? UI.ACCENT_ARCANE : UI.SEPARATOR, isActive ? 0.9 : 1);
      lbg.strokeRoundedRect(lx - btnW / 2, y - 16, btnW, 32, 4);
      // La valeur active reste dorée (or = valeur), l'inactive est muted
      const ltxt = this.add.text(lx, y, lang.toUpperCase(),
        uiStyle(TYPE.BODY, isActive ? UI.TXT_GOLD : UI.TXT_MUTED, { bold: isActive }))
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
    y += 52;

    // Séparateur
    const sepG = this.add.graphics();
    drawDivider(sepG, W / 2 - 160, y, 320, UI.ACCENT_ARCANE, 0.2);
    y += 24;

    // ── Graphismes ──────────────────────────────────
    this.addSectionTitle(W, y, t('settings.section.graphics'));
    y += 32;

    // Plein écran
    const isFs = !!this.scale.isFullscreen;
    this.renderToggleRow(W, y, t('settings.fullscreen'), () => {
      this.scale.toggleFullscreen();
      this.renderUI();
    }, isFs);
    y += 50;

    // VFX toggle
    const vfxOn = localStorage.getItem(VFX_STORAGE_KEY) !== 'false';
    this.renderToggleRow(W, y, t('settings.vfx'), () => {
      const next = !vfxOn;
      localStorage.setItem(VFX_STORAGE_KEY, next ? 'true' : 'false');
      this.gameScene.events.emit('vfx_changed', next);
      this.renderUI();
    }, vfxOn);
  }

  /** Titre de section des réglages : label cyan (structure, TYPE.BODY) + filets latéraux. */
  private addSectionTitle(W: number, y: number, label: string) {
    const txt = this.add.text(W / 2, y, label, uiStyle(TYPE.BODY, UI.TXT_CYAN, { bold: true })).setOrigin(0.5);
    const g = this.add.graphics();
    g.lineStyle(1, UI.ACCENT_ARCANE, 0.25);
    g.beginPath();
    g.moveTo(W / 2 - 160, y);
    g.lineTo(W / 2 - txt.width / 2 - 10, y);
    g.moveTo(W / 2 + txt.width / 2 + 10, y);
    g.lineTo(W / 2 + 160, y);
    g.strokePath();
  }

  private renderToggleRow(W: number, y: number, label: string, onToggle: () => void, current?: boolean) {
    // Libellé décalé à gauche (−150 au lieu de −80) : en BODY 14, il entrait en
    // collision avec la chip de valeur.
    this.add.text(W / 2 - 150, y, label, uiStyle(TYPE.BODY, UI.TXT_PARCHMENT)).setOrigin(0, 0.5);

    const valueLabel  = current === undefined ? '→' : current ? t('settings.on') : t('settings.off');
    const fillColor   = current === false ? 0x1a0808 : current === true ? 0x081a08 : UI.BTN_BG;
    const borderColor = current === false ? 0x553333 : current === true ? 0x2a5533 : UI.SEPARATOR;
    const txtColor    = current === false ? UI.TXT_RED : current === true ? UI.TXT_GREEN : UI.TXT_PARCHMENT;

    const bg = this.add.graphics();
    const drawChip = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? UI.BTN_BG_HOVER : fillColor, 1);
      bg.fillRoundedRect(W / 2 + 70, y - 16, 80, 32, 16);
      bg.lineStyle(1, hover ? UI.ACCENT_ARCANE : borderColor, hover ? 0.9 : 1);
      bg.strokeRoundedRect(W / 2 + 70, y - 16, 80, 32, 16);
    };
    drawChip(false);

    this.add.text(W / 2 + 110, y, valueLabel, uiStyle(TYPE.BODY, txtColor, { bold: true })).setOrigin(0.5);
    const hit = this.add.rectangle(W / 2 + 110, y, 86, 44, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => drawChip(true));
    hit.on('pointerout',  () => drawChip(false));
    hit.on('pointerdown', onToggle);
  }

  private makeTabBtn(x: number, y: number, label: string, active: boolean, cb: () => void) {
    // 104×24 → 120×30 : onglets calés sur l'ancienne typo — les libellés en
    // BODY 14 y débordaient.
    const bg = this.add.graphics();
    bg.fillStyle(active ? UI.BG_MID : UI.BTN_BG, active ? 1 : 0.8);
    bg.fillRoundedRect(x - 60, y - 15, 120, 30, 5);
    if (active) {
      bg.lineStyle(1, UI.ACCENT_ARCANE, 0.8);
      bg.strokeRoundedRect(x - 60, y - 15, 120, 30, 5);
      // Bande d'accent basse — même langage que les tabs de SkillScene
      bg.fillStyle(UI.ACCENT_ARCANE, 0.9);
      bg.fillRoundedRect(x - 54, y + 12, 108, 3, 1.5);
    } else {
      bg.lineStyle(1, UI.SEPARATOR, 1);
      bg.strokeRoundedRect(x - 60, y - 15, 120, 30, 5);
    }
    const txt = this.add.text(x, y, label,
      uiStyle(TYPE.BODY, active ? UI.TXT_CYAN : UI.TXT_MUTED, { bold: active }))
      .setOrigin(0.5);
    if (!active) {
      // Hit zone tactile élargie (44 px de haut — résorption partielle dette D6)
      const hit = this.add.rectangle(x, y, 124, 44, 0, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => txt.setStyle({ color: UI.TXT_PARCHMENT }));
      hit.on('pointerout',  () => txt.setStyle({ color: UI.TXT_MUTED }));
      hit.on('pointerdown', () => { if (!this.closing) cb(); });
    }
  }

  private makeMenuBtn(x: number, y: number, w: number, label: string, action: () => void, color?: string) {
    // 34 → 40 : le bouton VISIBLE se rapproche du minimum tactile (la hit zone
    // reste à 44) et loge le libellé BODY 14 avec de la marge.
    const H   = 40;
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
      if (this.closing) return;
      // Feedback tap < 100 ms avant l'action
      this.tweens.add({ targets: txt, scaleX: 0.96, scaleY: 0.96, duration: 50, yoyo: true });
      action();
    });
  }

  private openBestiary() {
    if (this.closing || this.scene.isActive('BestiaryScene')) return;
    this.scene.launch('BestiaryScene', {
      gameScene: this.gameScene,
      world: this.gameScene.gameState.world,
    });
    this.scene.pause('PauseScene');
  }

  private openArsenal() {
    if (this.closing || this.scene.isActive('ArsenalScene')) return;
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
    // Pendant l'animation de fermeture, le menu est déjà en train de rendre la
    // main — goToMainMenu() stopperait la scène en plein tween (callback perdu).
    if (this.closing) return;
    if (this.rebindListener) {
      window.removeEventListener('keydown', this.rebindListener);
      this.rebindListener = null;
    }
    this.gameScene.goToMainMenu();
  }

  /**
   * Ferme le menu pause avec l'animation symétrique de l'ouverture
   * (closeScreenTransition) — le setPaused(false)/stop() d'origine est reporté
   * dans onClosed, une fois le panneau dissous. `after` (optionnel) s'exécute
   * juste après le stop : utilisé par les boutons Inventaire/Talents pour
   * enchaîner l'ouverture de l'écran suivant sans dé-pauser le jeu entre-temps.
   */
  private resume(after?: () => void) {
    if (this.closing) return;
    this.closing = true;
    if (this.rebindListener) {
      window.removeEventListener('keydown', this.rebindListener);
      this.rebindListener = null;
    }
    closeScreenTransition(this, () => {
      this.gameScene.setPaused(false);
      this.scene.stop();
      after?.();
    });
  }

  shutdown() {
    if (this.rebindListener) {
      window.removeEventListener('keydown', this.rebindListener);
      this.rebindListener = null;
    }
    this.input.keyboard?.removeAllKeys(true);
  }
}
