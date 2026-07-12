import { GameScene } from './GameScene';
import { ALL_ITEMS } from '../data/items';
import { LootSystem } from '../systems/LootSystem';
import { StatRollSystem } from '../systems/StatRollSystem';
import { SHOP_INVENTORY, ShopEntry } from '../data/shops';
import { RARITY_COLORS } from '../types';
import { UI, drawGlowPanel, drawCard, drawDivider, uiStyle, addCloseButton, openScreenTransition } from '../utils/UITheme';
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
    openScreenTransition(this);
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Dark overlay + main panel (translucide : le jeu reste visible) ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88).setDepth(0);
    const frame = this.add.graphics().setDepth(0);
    drawGlowPanel(frame, 20, 20, W - 40, H - 40, UI.ACCENT_ARCANE, UI.BG_DEEP, 10, 0.92);

    // ── Title (or = identité) ────────────────────────────────────
    const npcName = this.npcId.charAt(0).toUpperCase() + this.npcId.slice(1);
    this.add.text(W / 2, 36, t('shop.title').replace('{name}', npcName),
      uiStyle(15, UI.TXT_GOLD, { bold: true, stroke: true }),
    ).setOrigin(0.5).setDepth(1);

    // ── Close button × (règle inter-écrans §7.1) ─────────────────
    addCloseButton(this, W - 44, 38, () => this.closeShop());

    // ── Gold display (pilule arrondie — or = valeur) ─────────────
    const gldGfx = this.add.graphics().setDepth(1);
    drawCard(gldGfx, W - 200, 26, 130, 24, { bg: UI.BG_MID, radius: 12, shadow: false });
    this.goldText = this.add.text(W - 135, 38,
      t('shop.gold').replace('{gold}', String(this.gameScene.gameState.player.gold)),
      uiStyle(11, UI.TXT_GOLD, { bold: true }),
    ).setOrigin(0.5).setDepth(2);

    // ── Column headers (cyan = structure) ────────────────────────
    const headerY = 60;
    this.add.text(46,      headerY, t('shop.col.item'),  uiStyle(9, UI.TXT_CYAN, { bold: true })).setDepth(1);
    this.add.text(W - 158, headerY, t('shop.col.price'), uiStyle(9, UI.TXT_CYAN, { bold: true })).setOrigin(0, 0).setDepth(1);
    this.add.text(W - 58,  headerY, t('shop.col.stock'), uiStyle(9, UI.TXT_CYAN, { bold: true })).setOrigin(0, 0).setDepth(1);

    // Separator line
    const sep = this.add.graphics().setDepth(1);
    drawDivider(sep, 30, 76, W - 60, UI.ACCENT_ARCANE, 0.35);

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
      const rarColor = RARITY_COLORS[item.rarity] ?? UI.TXT_PARCHMENT;
      const rarHex   = parseInt(rarColor.replace('#', ''), 16);

      const bg = this.add.rectangle(W / 2, rowY + rowH / 2, W - 60, rowH - 4,
        canBuy ? UI.BTN_BG : UI.PANEL_BG,
      ).setDepth(1).setInteractive({ useHandCursor: true });
      this.rowBgs.push(bg);

      // Liseré arrondi à la couleur de rareté (règle §7.5 : la rareté colore tout)
      const deco = this.add.graphics().setDepth(1);
      deco.lineStyle(1, rarHex, 0.5);
      deco.strokeRoundedRect(32, rowY + 2, W - 64, rowH - 8, 4);

      const nameText = this.add.text(46, rowY + 6, item.name,
        uiStyle(11, canBuy ? rarColor : UI.TXT_MUTED, { bold: true }))
        .setDepth(2);
      this.rowNames.push(nameText);

      this.add.text(46, rowY + 23, item.description.slice(0, 55), uiStyle(9, UI.TXT_MUTED, { italic: true }))
        .setDepth(2);

      const priceText = this.add.text(W - 153, rowY + rowH / 2, `${entry.price} G`,
        uiStyle(11, canBuy ? UI.TXT_GOLD : UI.TXT_HINT, { bold: true }),
      ).setOrigin(0, 0.5).setDepth(2);
      this.rowPrices.push(priceText);

      const stockLabel = entry.stock !== undefined ? `${entry.stock}` : '∞';
      this.add.text(W - 53, rowY + rowH / 2, stockLabel, uiStyle(11, UI.TXT_MUTED))
        .setOrigin(0, 0.5).setDepth(2);

      bg.on('pointerover', () => {
        if (this.gameScene.gameState.player.gold >= entry.price) bg.setFillStyle(UI.BTN_BG_HOVER);
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(this.gameScene.gameState.player.gold >= entry.price ? UI.BTN_BG : UI.PANEL_BG);
      });
      bg.on('pointerdown', () => {
        // Feedback tap < 100 ms (flash blanc bref sur la ligne)
        const flash = this.add.rectangle(W / 2, rowY + rowH / 2, W - 60, rowH - 4, 0xffffff, 0.2).setDepth(3);
        this.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });
        this.buyItem(entry);
      });
    });

    // ── Bottom bar ───────────────────────────────────────────────
    const sepBot = this.add.graphics().setDepth(1);
    drawDivider(sepBot, 30, H - 42, W - 60, UI.ACCENT_ARCANE, 0.25);

    this.add.text(W / 2, H - 28, t('shop.close_hint'), uiStyle(9, UI.TXT_HINT))
      .setOrigin(0.5).setDepth(1);

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).once('down', () => this.closeShop());
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I).once('down',   () => this.closeShop());
  }

  private buyItem(entry: ShopEntry) {
    const player = this.gameScene.gameState.player;
    if (player.gold < entry.price) return;
    const template = ALL_ITEMS[entry.itemId];
    if (!template) return;

    player.gold -= entry.price;
    // Chaque achat est un tirage propre (qFloor 0) — les marchands de zone
    // deviennent un gold sink de re-roll (docs/design/LOOT_STAT_ROLLS.md §5).
    const item = StatRollSystem.rollItem(template, 0);
    LootSystem.addToInventory(player, item, 1, this.gameScene.gameState.world);
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
      const rowItem   = ALL_ITEMS[e.itemId];
      const rarColor  = rowItem ? (RARITY_COLORS[rowItem.rarity] ?? UI.TXT_PARCHMENT) : UI.TXT_PARCHMENT;
      const canAfford = player.gold >= e.price;
      bg.setFillStyle(canAfford ? UI.BTN_BG : UI.PANEL_BG);
      if (bg.input) bg.input.cursor = canAfford ? 'pointer' : 'default';
      name.setStyle({ color: canAfford ? rarColor : UI.TXT_MUTED });
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
