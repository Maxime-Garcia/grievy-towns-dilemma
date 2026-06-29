import { SaveSystem } from '../systems/SaveSystem';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MainMenuScene' }); }

  create() {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.text(w / 2, 90, "Grievy Town's Dilemma", {
      fontSize: '28px',
      color: '#e8d5b0',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(w / 2, 138, 'A tale of memory, sacrifice, and broken gods', {
      fontSize: '12px',
      color: '#998866',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const slots = SaveSystem.listSlots();
    const hasAnySave = slots.some(s => s !== null);

    const btnStyle = {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#2a2a2a',
      padding: { x: 20, y: 10 },
    };

    // New Game → slot selection
    const newGame = this.add.text(w / 2, 240, '  NEW GAME  ', btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    newGame.on('pointerover', () => newGame.setStyle({ color: '#ffdd88' }));
    newGame.on('pointerout',  () => newGame.setStyle({ color: '#ffffff' }));
    newGame.on('pointerdown', () => this.showNewGameSlotMenu(slots));

    // Load
    if (hasAnySave) {
      const loadGame = this.add.text(w / 2, 300, '  LOAD SAVE  ', btnStyle)
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      loadGame.on('pointerover', () => loadGame.setStyle({ color: '#ffdd88' }));
      loadGame.on('pointerout',  () => loadGame.setStyle({ color: '#ffffff' }));
      loadGame.on('pointerdown', () => this.showLoadMenu(slots));
    }

    // Save slots preview
    let yOff = 380;
    this.add.text(w / 2, yOff - 20, 'SAVE SLOTS', {
      fontSize: '10px', color: '#554433', fontFamily: 'monospace',
    }).setOrigin(0.5);
    for (let i = 0; i < 3; i++) {
      const s = slots[i];
      const label = s
        ? `Slot ${i + 1} — ${s.playerName}  Lv.${s.level}  [${SaveSystem.formatPlaytime(s.playtime)}]  ${s.clearedZones}/6 zones`
        : `Slot ${i + 1} — Empty`;
      this.add.text(w / 2, yOff, label, {
        fontSize: '11px',
        color: s ? '#88bb88' : '#444433',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
      yOff += 24;
    }

    // Controls hint
    this.add.text(w / 2, h - 30, 'ZQSD / Arrows — move   W — attack   SPACE — dash   I — inventory   K — skills', {
      fontSize: '9px', color: '#443322', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  private showNewGameSlotMenu(slots: ReturnType<typeof SaveSystem.listSlots>) {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const elements: Phaser.GameObjects.GameObject[] = [];
    const overlay = this.add.rectangle(w / 2, h / 2, 480, 320, 0x000000, 0.9).setDepth(10);
    const title   = this.add.text(w / 2, h / 2 - 120, 'SELECT SAVE SLOT', {
      fontSize: '16px', color: '#e8d5b0', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11);
    elements.push(overlay, title);

    for (let i = 0; i < 3; i++) {
      const s = slots[i];
      const occupied = s !== null;
      const label = occupied
        ? `Slot ${i + 1}  [OVERWRITE]  ${s!.playerName} Lv.${s!.level}`
        : `Slot ${i + 1}  [ EMPTY — new game ]`;

      const btn = this.add.text(w / 2, h / 2 - 50 + i * 56, label, {
        fontSize: '13px',
        color: occupied ? '#ff8888' : '#88ff88',
        fontFamily: 'monospace',
        backgroundColor: '#1a1a1a',
        padding: { x: 16, y: 10 },
      }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setStyle({ color: '#ffffff' }));
      btn.on('pointerout',  () => btn.setStyle({ color: occupied ? '#ff8888' : '#88ff88' }));
      btn.on('pointerdown', () => {
        elements.forEach(e => e.destroy());
        this.scene.start('NameInputScene', { slot: i });
      });
      elements.push(btn);
    }

    const cancel = this.add.text(w / 2, h / 2 + 130, '[ CANCEL ]', {
      fontSize: '13px', color: '#666655', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });
    cancel.on('pointerover', () => cancel.setStyle({ color: '#ff8888' }));
    cancel.on('pointerout',  () => cancel.setStyle({ color: '#666655' }));
    cancel.on('pointerdown', () => elements.forEach(e => e.destroy()));
    elements.push(cancel);
  }

  private showLoadMenu(slots: ReturnType<typeof SaveSystem.listSlots>) {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const elements: Phaser.GameObjects.GameObject[] = [];
    const overlay = this.add.rectangle(w / 2, h / 2, 480, 320, 0x000000, 0.9).setDepth(10);
    const title   = this.add.text(w / 2, h / 2 - 120, 'LOAD SAVE', {
      fontSize: '16px', color: '#e8d5b0', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11);
    elements.push(overlay, title);

    let found = 0;
    for (let i = 0; i < 3; i++) {
      const s = slots[i];
      if (!s) continue;

      const label = `Slot ${i + 1}  ${s.playerName}  Lv.${s.level}  |  ${s.clearedZones}/6 zones  |  ${SaveSystem.formatPlaytime(s.playtime)}`;
      const btn = this.add.text(w / 2, h / 2 - 50 + found * 56, label, {
        fontSize: '12px',
        color: '#88ff88',
        fontFamily: 'monospace',
        backgroundColor: '#1a1a1a',
        padding: { x: 16, y: 10 },
      }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setStyle({ color: '#ffffff' }));
      btn.on('pointerout',  () => btn.setStyle({ color: '#88ff88' }));
      btn.on('pointerdown', () => {
        const state = SaveSystem.load(i);
        if (state) {
          state.saveSlot = i; // Ensure correct slot is tracked
          elements.forEach(e => e.destroy());
          this.scene.start('GameScene', { gameState: state });
        }
      });
      elements.push(btn);
      found++;
    }

    const cancel = this.add.text(w / 2, h / 2 + 130, '[ CANCEL ]', {
      fontSize: '13px', color: '#666655', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });
    cancel.on('pointerover', () => cancel.setStyle({ color: '#ff8888' }));
    cancel.on('pointerout',  () => cancel.setStyle({ color: '#666655' }));
    cancel.on('pointerdown', () => elements.forEach(e => e.destroy()));
    elements.push(cancel);
  }
}
