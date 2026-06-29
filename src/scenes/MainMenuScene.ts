import { SaveSystem } from '../systems/SaveSystem';
import { UI, drawPanel, pxStyle } from '../utils/UITheme';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MainMenuScene' }); }

  create() {
    this.cameras.main.fadeIn(500, 0, 0, 0);
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Background frame ─────────────────────────
    const bg = this.add.graphics();
    drawPanel(bg, 6, 6, W - 12, H - 12);

    // Subtle inner decorative lines (top and bottom horizontal)
    const deco = this.add.graphics();
    deco.lineStyle(1, UI.BORDER_LIT, 0.4);
    deco.beginPath(); deco.moveTo(18, 70);  deco.lineTo(W - 18, 70);  deco.strokePath();
    deco.beginPath(); deco.moveTo(18, H - 70); deco.lineTo(W - 18, H - 70); deco.strokePath();

    // ── Title ─────────────────────────────────────
    this.add.text(W / 2, 26, "GRIEVY TOWN'S DILEMMA", {
      ...pxStyle(16, UI.TXT_GOLD, true),
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, 52, 'un conte de mémoire, de sacrifice et de dieux brisés', pxStyle(7, UI.TXT_MUTED))
      .setOrigin(0.5);

    // ── Buttons ───────────────────────────────────
    const slots      = SaveSystem.listSlots();
    const hasAnySave = slots.some(s => s !== null);

    this.makeBtn(W / 2, 160, 'NOUVELLE PARTIE', () => this.showNewGameMenu(slots));
    if (hasAnySave) {
      this.makeBtn(W / 2, 216, 'CHARGER', () => this.showLoadMenu(slots));
    }

    // ── Save slot cards ───────────────────────────
    this.add.text(W / 2, 276, 'SAUVEGARDES', pxStyle(7, UI.TXT_HINT)).setOrigin(0.5);

    for (let i = 0; i < 3; i++) {
      const s    = slots[i];
      const cy   = 298 + i * 56;
      const card = this.add.graphics();
      drawPanel(card, W / 2 - 200, cy, 400, 44, UI.SLOT_BG);

      if (s) {
        this.add.text(W / 2 - 188, cy + 8,  `Slot ${i + 1}`, pxStyle(7, UI.TXT_GOLD));
        this.add.text(W / 2 - 188, cy + 24, `${s.playerName}  Lv.${s.level}`, pxStyle(7, UI.TXT_PARCHMENT));
        this.add.text(W / 2 + 190, cy + 8,  `${s.clearedZones}/6 zones`, pxStyle(7, UI.TXT_MUTED)).setOrigin(1, 0);
        this.add.text(W / 2 + 190, cy + 24, SaveSystem.formatPlaytime(s.playtime), pxStyle(7, UI.TXT_MUTED)).setOrigin(1, 0);
      } else {
        this.add.text(W / 2, cy + 22, `Slot ${i + 1}  —  Vide`, pxStyle(7, UI.TXT_HINT)).setOrigin(0.5);
      }
    }

    // ── Footer controls hint ──────────────────────
    this.add.text(W / 2, H - 14, 'ZQSD / Flèches — déplacement   W — attaque   Espace — dash', pxStyle(6, UI.TXT_HINT))
      .setOrigin(0.5, 1);
  }

  private makeBtn(x: number, y: number, label: string, action: () => void) {
    const W  = 240;
    const H  = 34;
    const bg = this.add.graphics();

    const draw = (hover: boolean) => {
      bg.clear();
      drawPanel(bg, x - W / 2, y - H / 2, W, H, hover ? UI.BTN_BG_HOVER : UI.BTN_BG);
      if (hover) {
        bg.lineStyle(1, UI.CORNER, 1);
        bg.strokeRect(x - W / 2 + 1, y - H / 2 + 1, W - 2, H - 2);
      }
    };

    draw(false);

    const txt = this.add.text(x, y, label, pxStyle(9, UI.TXT_PARCHMENT)).setOrigin(0.5);
    const hit = this.add.rectangle(x, y, W, H, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover',  () => { draw(true);  txt.setStyle({ color: UI.TXT_GOLD }); });
    hit.on('pointerout',   () => { draw(false); txt.setStyle({ color: UI.TXT_PARCHMENT }); });
    hit.on('pointerdown',  action);
  }

  private showNewGameMenu(slots: ReturnType<typeof SaveSystem.listSlots>) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const elems: Phaser.GameObjects.GameObject[] = [];

    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(20);
    elems.push(ov);

    const frame = this.add.graphics().setDepth(21);
    drawPanel(frame, W / 2 - 240, H / 2 - 150, 480, 300);
    elems.push(frame);

    elems.push(
      this.add.text(W / 2, H / 2 - 130, 'CHOISIR UN SLOT', pxStyle(11, UI.TXT_GOLD, true))
        .setOrigin(0.5).setDepth(22)
    );

    for (let i = 0; i < 3; i++) {
      const s    = slots[i];
      const by   = H / 2 - 60 + i * 62;
      const card = this.add.graphics().setDepth(21);
      drawPanel(card, W / 2 - 200, by, 400, 48, UI.SLOT_BG);
      elems.push(card);

      const label = s
        ? `Slot ${i + 1}  [ÉCRASER]  ${s.playerName} Lv.${s.level}`
        : `Slot ${i + 1}  —  Nouvelle partie`;
      const col  = s ? UI.TXT_RED : UI.TXT_GREEN;

      const btn = this.add.text(W / 2, by + 24, label, pxStyle(8, col))
        .setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setStyle({ color: UI.TXT_WHITE }));
      btn.on('pointerout',  () => btn.setStyle({ color: col }));
      btn.on('pointerdown', () => {
        elems.forEach(e => e.destroy());
        this.scene.start('NameInputScene', { slot: i });
      });
      elems.push(btn);
    }

    const cancel = this.add.text(W / 2, H / 2 + 120, '[ ANNULER ]', pxStyle(9, UI.TXT_MUTED))
      .setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
    cancel.on('pointerover', () => cancel.setStyle({ color: UI.TXT_RED }));
    cancel.on('pointerout',  () => cancel.setStyle({ color: UI.TXT_MUTED }));
    cancel.on('pointerdown', () => elems.forEach(e => e.destroy()));
    elems.push(cancel);
  }

  private showLoadMenu(slots: ReturnType<typeof SaveSystem.listSlots>) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const elems: Phaser.GameObjects.GameObject[] = [];

    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75).setDepth(20);
    elems.push(ov);

    const frame = this.add.graphics().setDepth(21);
    drawPanel(frame, W / 2 - 240, H / 2 - 150, 480, 300);
    elems.push(frame);

    elems.push(
      this.add.text(W / 2, H / 2 - 130, 'CHARGER UNE PARTIE', pxStyle(11, UI.TXT_GOLD, true))
        .setOrigin(0.5).setDepth(22)
    );

    let found = 0;
    for (let i = 0; i < 3; i++) {
      const s = slots[i];
      if (!s) continue;

      const by   = H / 2 - 60 + found * 62;
      const card = this.add.graphics().setDepth(21);
      drawPanel(card, W / 2 - 200, by, 400, 48, UI.SLOT_BG);
      elems.push(card);

      const label = `Slot ${i + 1}  ${s.playerName}  Lv.${s.level}  |  ${s.clearedZones}/6 zones`;
      const btn = this.add.text(W / 2, by + 24, label, pxStyle(8, UI.TXT_GREEN))
        .setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => btn.setStyle({ color: UI.TXT_WHITE }));
      btn.on('pointerout',  () => btn.setStyle({ color: UI.TXT_GREEN }));
      btn.on('pointerdown', () => {
        const state = SaveSystem.load(i);
        if (state) {
          state.saveSlot = i;
          elems.forEach(e => e.destroy());
          this.scene.start('GameScene', { gameState: state });
        }
      });
      elems.push(btn);
      found++;
    }

    const cancel = this.add.text(W / 2, H / 2 + 120, '[ ANNULER ]', pxStyle(9, UI.TXT_MUTED))
      .setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
    cancel.on('pointerover', () => cancel.setStyle({ color: UI.TXT_RED }));
    cancel.on('pointerout',  () => cancel.setStyle({ color: UI.TXT_MUTED }));
    cancel.on('pointerdown', () => elems.forEach(e => e.destroy()));
    elems.push(cancel);
  }
}
