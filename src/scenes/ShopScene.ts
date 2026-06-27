import { GameScene } from './GameScene';
import { ALL_ITEMS } from '../data/items';
import { LootSystem } from '../systems/LootSystem';
import { SHOP_INVENTORY, ShopEntry } from '../data/shops';

export class ShopScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private npcId!: string;

  // Live-update references (rebuilt only when affording changes)
  private goldText!: Phaser.GameObjects.Text;
  private rowBgs:   Phaser.GameObjects.Rectangle[] = [];
  private rowNames: Phaser.GameObjects.Text[]       = [];
  private rowPrices: Phaser.GameObjects.Text[]      = [];

  constructor() { super({ key: 'ShopScene' }); }

  init(data: { gameScene: GameScene; npcId: string }) {
    this.gameScene = data.gameScene;
    this.npcId     = data.npcId;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Static overlay ───────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W - 40, H - 40, 0x0a0a18, 0.97)
      .setStrokeStyle(1, 0x554433).setDepth(0);

    const npcName = this.npcId.charAt(0).toUpperCase() + this.npcId.slice(1);
    this.add.text(W / 2, 30, `Boutique — ${npcName}`, {
      fontSize: '16px', color: '#e8d5b0', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(1);

    this.goldText = this.add.text(W - 30, 30, `Or : ${this.gameScene.gameState.player.gold} G`, {
      fontSize: '13px', color: '#ffdd44', fontFamily: 'monospace',
    }).setOrigin(1, 0.5).setDepth(1);

    this.add.text(30,      60, 'ARTICLE', { fontSize: '10px', color: '#887766', fontFamily: 'monospace' }).setDepth(1);
    this.add.text(W - 160, 60, 'PRIX',    { fontSize: '10px', color: '#887766', fontFamily: 'monospace' }).setOrigin(0, 0).setDepth(1);
    this.add.text(W - 60,  60, 'STOCK',   { fontSize: '10px', color: '#887766', fontFamily: 'monospace' }).setOrigin(0, 0).setDepth(1);
    this.add.rectangle(W / 2, 72, W - 40, 1, 0x554433).setDepth(1);

    // ── Item rows ────────────────────────────────────────────────
    const entries: ShopEntry[] = SHOP_INVENTORY[this.npcId] ?? [];
    const rowH    = 44;
    const startY  = 90;

    this.rowBgs    = [];
    this.rowNames  = [];
    this.rowPrices = [];

    entries.forEach((entry, i) => {
      const item = ALL_ITEMS[entry.itemId];
      if (!item) return;
      const rowY   = startY + i * rowH;
      const canBuy = this.gameScene.gameState.player.gold >= entry.price;

      const bg = this.add.rectangle(W / 2, rowY + rowH / 2, W - 60, rowH - 4, canBuy ? 0x111122 : 0x0a0a0a)
        .setDepth(1).setInteractive({ useHandCursor: true });
      this.rowBgs.push(bg);

      const nameText = this.add.text(40, rowY + 8, item.name, {
        fontSize: '13px', color: canBuy ? '#ffffff' : '#665544', fontFamily: 'monospace',
      }).setDepth(2);
      this.rowNames.push(nameText);

      this.add.text(40, rowY + 26, item.description.slice(0, 55), {
        fontSize: '9px', color: '#665544', fontFamily: 'monospace',
      }).setDepth(2);

      const priceText = this.add.text(W - 155, rowY + 18, `${entry.price} G`, {
        fontSize: '13px', color: canBuy ? '#ffdd44' : '#554433', fontFamily: 'monospace',
      }).setOrigin(0, 0.5).setDepth(2);
      this.rowPrices.push(priceText);

      const stockLabel = entry.stock !== undefined ? `${entry.stock}` : '∞';
      this.add.text(W - 55, rowY + 18, stockLabel, {
        fontSize: '13px', color: '#aaaaaa', fontFamily: 'monospace',
      }).setOrigin(0, 0.5).setDepth(2);

      bg.on('pointerover', () => {
        if (this.gameScene.gameState.player.gold >= entry.price) bg.setFillStyle(0x222244);
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(this.gameScene.gameState.player.gold >= entry.price ? 0x111122 : 0x0a0a0a);
      });
      bg.on('pointerdown', () => this.buyItem(entry, i));
    });

    // ── Bottom bar ───────────────────────────────────────────────
    this.add.rectangle(W / 2, H - 30, W - 40, 1, 0x554433).setDepth(1);
    this.add.text(W / 2, H - 16, '[Échap] / [I] fermer', {
      fontSize: '10px', color: '#554433', fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5).setDepth(1);

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).once('down', () => this.closeShop());
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I).once('down',   () => this.closeShop());
  }

  private buyItem(entry: ShopEntry, rowIndex: number) {
    const player = this.gameScene.gameState.player;
    if (player.gold < entry.price) return;
    const item = ALL_ITEMS[entry.itemId];
    if (!item) return;

    player.gold -= entry.price;
    LootSystem.addToInventory(player, item, 1);
    this.gameScene.events.emit('item_looted',       { item, quantity: 1 });
    this.gameScene.events.emit('player_update',     player);
    this.gameScene.events.emit('show_notification', `Acheté : ${item.name}`);

    // Update gold display
    this.goldText.setText(`Or : ${player.gold} G`);

    // Update affordability state for all rows (no scene restart needed)
    const entries = SHOP_INVENTORY[this.npcId] ?? [];
    entries.forEach((e, i) => {
      const bg    = this.rowBgs[i];
      const name  = this.rowNames[i];
      const price = this.rowPrices[i];
      if (!bg || !name || !price) return;
      const canAfford = player.gold >= e.price;
      bg.setFillStyle(canAfford ? 0x111122 : 0x0a0a0a);
      bg.input!.cursor = canAfford ? 'pointer' : 'default';
      name.setStyle({ color: canAfford ? '#ffffff' : '#665544' });
      price.setStyle({ color: canAfford ? '#ffdd44' : '#554433' });
    });
  }

  private closeShop() {
    this.gameScene.setShopOpen(false);
    this.scene.stop();
  }

  shutdown() {
    this.input.keyboard?.removeAllKeys(true);
  }
}
