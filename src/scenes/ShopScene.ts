import { GameScene } from './GameScene';
import { ALL_ITEMS } from '../data/items';
import { LootSystem } from '../systems/LootSystem';
import { SHOP_INVENTORY, ShopEntry } from '../data/shops';
import { UI, drawPanel, pxStyle } from '../utils/UITheme';
import { t } from '../i18n';

export class ShopScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private npcId!: string;

  // Live-update references (rebuilt only when affordability changes)
  private goldText!: Phaser.GameObjects.Text;
  private rowBgs:    Phaser.GameObjects.Rectangle[] = [];
  private rowNames:  Phaser.GameObjects.Text[]       = [];
  private rowPrices: Phaser.GameObjects.Text[]       = [];

  constructor() { super({ key: 'ShopScene' }); }

  init(data: { gameScene: GameScene; npcId: string }) {
    this.gameScene = data.gameScene;
    this.npcId     = data.npcId;
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0);
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Dark overlay + main panel (translucide : le jeu reste visible) ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88).setDepth(0);
    const frame = this.add.graphics().setDepth(0);
    drawPanel(frame, 20, 20, W - 40, H - 40, UI.PANEL_BG, 0.85);

    // ── Title ────────────────────────────────────────────────────
    const npcName = this.npcId.charAt(0).toUpperCase() + this.npcId.slice(1);
    this.add.text(W / 2, 36, t('shop.title').replace('{name}', npcName), {
      ...pxStyle(13, UI.TXT_GOLD, true),
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1);

    // ── Gold display ─────────────────────────────────────────────
    const gldGfx = this.add.graphics().setDepth(1);
    drawPanel(gldGfx, W - 162, 24, 136, 22, UI.SLOT_BG);
    this.goldText = this.add.text(W - 94, 35,
      t('shop.gold').replace('{gold}', String(this.gameScene.gameState.player.gold)),
      pxStyle(8, UI.TXT_GOLD),
    ).setOrigin(0.5).setDepth(2);

    // ── Column headers ───────────────────────────────────────────
    const headerY = 62;
    this.add.text(46,      headerY, t('shop.col.item'),  pxStyle(7, UI.TXT_MUTED)).setDepth(1);
    this.add.text(W - 158, headerY, t('shop.col.price'), pxStyle(7, UI.TXT_MUTED)).setOrigin(0, 0).setDepth(1);
    this.add.text(W - 58,  headerY, t('shop.col.stock'), pxStyle(7, UI.TXT_MUTED)).setOrigin(0, 0).setDepth(1);

    // Separator line
    const sep = this.add.graphics().setDepth(1);
    sep.lineStyle(1, UI.BORDER_LIT, 0.4);
    sep.beginPath(); sep.moveTo(30, 74); sep.lineTo(W - 30, 74); sep.strokePath();

    // ── Item rows ────────────────────────────────────────────────
    const entries: ShopEntry[] = SHOP_INVENTORY[this.npcId] ?? [];
    const rowH   = 44;
    const startY = 90;

    this.rowBgs    = [];
    this.rowNames  = [];
    this.rowPrices = [];

    entries.forEach((entry, i) => {
      const item = ALL_ITEMS[entry.itemId];
      if (!item) return;
      const rowY   = startY + i * rowH;
      const canBuy = this.gameScene.gameState.player.gold >= entry.price;

      const bg = this.add.rectangle(W / 2, rowY + rowH / 2, W - 60, rowH - 4,
        canBuy ? UI.BTN_BG : UI.PANEL_BG,
      ).setDepth(1).setInteractive({ useHandCursor: true });
      this.rowBgs.push(bg);

      const nameText = this.add.text(46, rowY + 8, item.name, pxStyle(11, canBuy ? UI.TXT_PARCHMENT : UI.TXT_MUTED))
        .setDepth(2);
      this.rowNames.push(nameText);

      this.add.text(46, rowY + 26, item.description.slice(0, 55), pxStyle(7, UI.TXT_HINT))
        .setDepth(2);

      const priceText = this.add.text(W - 153, rowY + rowH / 2, `${entry.price} G`,
        pxStyle(11, canBuy ? UI.TXT_GOLD : UI.TXT_HINT),
      ).setOrigin(0, 0.5).setDepth(2);
      this.rowPrices.push(priceText);

      const stockLabel = entry.stock !== undefined ? `${entry.stock}` : '∞';
      this.add.text(W - 53, rowY + rowH / 2, stockLabel, pxStyle(11, UI.TXT_MUTED))
        .setOrigin(0, 0.5).setDepth(2);

      bg.on('pointerover', () => {
        if (this.gameScene.gameState.player.gold >= entry.price) bg.setFillStyle(UI.BTN_BG_HOVER);
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(this.gameScene.gameState.player.gold >= entry.price ? UI.BTN_BG : UI.PANEL_BG);
      });
      bg.on('pointerdown', () => this.buyItem(entry));
    });

    // ── Bottom bar ───────────────────────────────────────────────
    const sepBot = this.add.graphics().setDepth(1);
    sepBot.lineStyle(1, UI.BORDER_LIT, 0.4);
    sepBot.beginPath(); sepBot.moveTo(30, H - 42); sepBot.lineTo(W - 30, H - 42); sepBot.strokePath();

    this.add.text(W / 2, H - 28, t('shop.close_hint'), pxStyle(8, UI.TXT_HINT))
      .setOrigin(0.5).setDepth(1);

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).once('down', () => this.closeShop());
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I).once('down',   () => this.closeShop());
  }

  private buyItem(entry: ShopEntry) {
    const player = this.gameScene.gameState.player;
    if (player.gold < entry.price) return;
    const item = ALL_ITEMS[entry.itemId];
    if (!item) return;

    player.gold -= entry.price;
    LootSystem.addToInventory(player, item, 1);
    this.gameScene.events.emit('item_looted',       { item, quantity: 1 });
    this.gameScene.events.emit('player_update',     player);
    this.gameScene.events.emit('show_notification', t('shop.bought').replace('{name}', item.name));

    // Update gold display
    this.goldText.setText(t('shop.gold').replace('{gold}', String(player.gold)));

    // Update affordability state for all rows without scene restart
    const entries = SHOP_INVENTORY[this.npcId] ?? [];
    entries.forEach((e, i) => {
      const bg    = this.rowBgs[i];
      const name  = this.rowNames[i];
      const price = this.rowPrices[i];
      if (!bg || !name || !price) return;
      const canAfford = player.gold >= e.price;
      bg.setFillStyle(canAfford ? UI.BTN_BG : UI.PANEL_BG);
      if (bg.input) bg.input.cursor = canAfford ? 'pointer' : 'default';
      name.setStyle({ color: canAfford ? UI.TXT_PARCHMENT : UI.TXT_MUTED });
      price.setStyle({ color: canAfford ? UI.TXT_GOLD : UI.TXT_HINT });
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
