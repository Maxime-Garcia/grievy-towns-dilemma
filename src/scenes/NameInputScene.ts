import { SaveSystem } from '../systems/SaveSystem';

export class NameInputScene extends Phaser.Scene {
  private nameInput!: HTMLInputElement;

  constructor() { super({ key: 'NameInputScene' }); }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.add.text(w / 2, 140, 'You wake up.', {
      fontSize: '18px', color: '#ccbbaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(w / 2, 175, 'You do not know your name.', {
      fontSize: '14px', color: '#998877', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(w / 2, 220, 'Choose one.', {
      fontSize: '13px', color: '#776655', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // HTML input element overlaid on the canvas
    this.nameInput = document.createElement('input');
    Object.assign(this.nameInput.style, {
      position: 'absolute',
      top: `${h / 2 - 20}px`,
      left: `${w / 2 - 120}px`,
      width: '240px',
      height: '36px',
      fontSize: '18px',
      textAlign: 'center',
      background: '#111111',
      color: '#ffffff',
      border: '1px solid #666666',
      fontFamily: 'monospace',
      outline: 'none',
    });
    this.nameInput.maxLength = 16;
    this.nameInput.placeholder = 'Enter your name...';
    document.body.appendChild(this.nameInput);
    this.nameInput.focus();

    const confirmBtn = this.add.text(w / 2, h / 2 + 60, '[ BEGIN ]', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#2a4a2a',
      padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    confirmBtn.on('pointerover', () => confirmBtn.setStyle({ color: '#88ff88' }));
    confirmBtn.on('pointerout',  () => confirmBtn.setStyle({ color: '#ffffff' }));
    confirmBtn.on('pointerdown', () => this.startGame());

    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.startGame();
    });

    this.events.on('shutdown', () => this.cleanupInput());
    this.events.on('destroy',  () => this.cleanupInput());
  }

  private startGame() {
    const name = this.nameInput.value.trim() || 'Stranger';
    this.cleanupInput();

    const gameState = SaveSystem.createNewGame(name);
    this.scene.start('GameScene', { gameState });
  }

  private cleanupInput() {
    if (this.nameInput && document.body.contains(this.nameInput)) {
      document.body.removeChild(this.nameInput);
    }
  }
}
