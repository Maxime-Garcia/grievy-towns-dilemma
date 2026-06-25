import { SaveSystem } from '../systems/SaveSystem';
import { GameState } from '../types';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MainMenuScene' }); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.text(w / 2, 100, "Grievy Town's Dilemma", {
      fontSize: '28px',
      color: '#e8d5b0',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(w / 2, 150, 'A tale of memory, sacrifice, and broken gods', {
      fontSize: '12px',
      color: '#998866',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    const slots = SaveSystem.listSlots();
    const hasAnySave = slots.some(s => s !== null);

    const buttonStyle = {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 },
    };

    // New Game
    const newGame = this.add.text(w / 2, 260, '  NEW GAME  ', buttonStyle)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    newGame.on('pointerover', () => newGame.setStyle({ color: '#ffdd88' }));
    newGame.on('pointerout',  () => newGame.setStyle({ color: '#ffffff' }));
    newGame.on('pointerdown', () => this.scene.start('NameInputScene'));

    // Continue / Load
    if (hasAnySave) {
      const loadGame = this.add.text(w / 2, 320, '  CONTINUE  ', buttonStyle)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      loadGame.on('pointerover', () => loadGame.setStyle({ color: '#ffdd88' }));
      loadGame.on('pointerout',  () => loadGame.setStyle({ color: '#ffffff' }));
      loadGame.on('pointerdown', () => this.showLoadMenu(slots));
    }

    // Save slots preview
    let yOff = 380;
    for (let i = 0; i < 3; i++) {
      const s = slots[i];
      const label = s
        ? `Slot ${i + 1} — ${s.playerName} Lv.${s.level}  [${SaveSystem.formatPlaytime(s.playtime)}]  ${s.clearedZones}/6 zones`
        : `Slot ${i + 1} — Empty`;
      this.add.text(w / 2, yOff, label, {
        fontSize: '11px',
        color: s ? '#88bb88' : '#666666',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
      yOff += 24;
    }
  }

  private showLoadMenu(slots: Array<ReturnType<typeof SaveSystem.listSlots>[0]>) {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const overlay = this.add.rectangle(w / 2, h / 2, 400, 300, 0x000000, 0.85).setDepth(10);
    const title   = this.add.text(w / 2, h / 2 - 110, 'LOAD GAME', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11);

    const elements: Phaser.GameObjects.GameObject[] = [overlay, title];

    for (let i = 0; i < 3; i++) {
      const s = slots[i];
      if (!s) continue;

      const label = `Slot ${i + 1} — ${s.playerName} Lv.${s.level} | ${s.clearedZones}/6 zones | ${SaveSystem.formatPlaytime(s.playtime)}`;
      const btn = this.add.text(w / 2, h / 2 - 50 + i * 50, label, {
        fontSize: '12px',
        color: '#88ff88',
        fontFamily: 'monospace',
        backgroundColor: '#222222',
        padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setStyle({ color: '#ffffff' }));
      btn.on('pointerout',  () => btn.setStyle({ color: '#88ff88' }));
      btn.on('pointerdown', () => {
        const state = SaveSystem.load(i);
        if (state) {
          this.scene.start('GameScene', { gameState: state });
        }
      });
      elements.push(btn);
    }

    const cancel = this.add.text(w / 2, h / 2 + 130, '[ CANCEL ]', {
      fontSize: '13px', color: '#ff6666', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(11).setInteractive({ useHandCursor: true });
    cancel.on('pointerdown', () => elements.forEach(e => e.destroy()));
    elements.push(cancel);
  }
}
