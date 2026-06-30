import { GameScene } from './GameScene';
import { PlayerState, Item, ItemType, RARITY_COLORS } from '../types';
import { InventorySystem, setInventoryPlayerContext } from '../systems/InventorySystem';
import { ALL_ITEMS } from '../data/items';
import { UI, drawPanel, pxStyle } from '../utils/UITheme';
import { t, localizeItem } from '../i18n';

const COLS    = 8;
const SLOT    = 48;
const GRID_X  = 12;
const GRID_Y  = 52;

export class InventoryScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private player!: PlayerState;

  constructor() { super({ key: 'InventoryScene' }); }

  init(data: { gameScene: GameScene }) {
    if (!data?.gameScene) return;
    this.gameScene = data.gameScene;
    this.player    = data.gameScene.gameState.player;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Dark overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);

    // Main frame
    const frame = this.add.graphics();
    drawPanel(frame, 6, 6, W - 12, H - 12);

    // Header title
    this.add.text(W / 2, 18, t('inventory.title'), pxStyle(12, UI.TXT_GOLD, true)).setOrigin(0.5, 0);

    // Header separator
    const sep = this.add.graphics();
    sep.lineStyle(1, UI.BORDER_LIT, 0.6);
    sep.beginPath();
    sep.moveTo(18, 42);
    sep.lineTo(W - 18, 42);
    sep.strokePath();

    // Gold display (top-right)
    const gldGfx = this.add.graphics();
    drawPanel(gldGfx, W - 148, 10, 136, 22, UI.SLOT_BG);
    this.add.text(W - 80, 21, `${this.player.gold} ${t('inventory.gold')}`, pxStyle(8, UI.TXT_GOLD)).setOrigin(0.5);

    // Grid + equipment
    this.renderGrid();
    this.renderEquipment(W);

    // Footer close hint
    this.add.text(W / 2, H - 12, t('inventory.close'), pxStyle(7, UI.TXT_HINT))
      .setOrigin(0.5, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.stop());
  }

  private renderGrid() {
    this.player.inventory.forEach((slot, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x   = GRID_X + col * SLOT;
      const y   = GRID_Y + row * SLOT;

      const rarityHex = parseInt(
        (RARITY_COLORS[slot.item.rarity] ?? '#666666').replace('#', ''), 16
      );

      const bg = this.add.graphics();
      bg.fillStyle(UI.SLOT_BG, 1);
      bg.fillRect(x, y, SLOT - 2, SLOT - 2);
      bg.lineStyle(1, rarityHex, 1);
      bg.strokeRect(x, y, SLOT - 2, SLOT - 2);
      bg.lineStyle(1, 0x000000, 0.35);
      bg.strokeRect(x + 1, y + 1, SLOT - 4, SLOT - 4);

      try {
        this.add.image(x + SLOT / 2 - 1, y + SLOT / 2 - 1, slot.item.icon)
          .setDisplaySize(28, 28);
      } catch {}

      if (slot.quantity > 1) {
        this.add.text(x + SLOT - 5, y + SLOT - 5, `${slot.quantity}`, pxStyle(7, UI.TXT_WHITE))
          .setOrigin(1, 1);
      }

      const hit = this.add.rectangle(
        x + SLOT / 2 - 1, y + SLOT / 2 - 1,
        SLOT - 2, SLOT - 2,
        0x000000, 0
      ).setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => this.showItemDetail(slot.item.id));
      hit.on('pointerover', () => {
        bg.lineStyle(2, 0xffffff, 0.9);
        bg.strokeRect(x, y, SLOT - 2, SLOT - 2);
      });
      hit.on('pointerout', () => {
        bg.lineStyle(1, rarityHex, 1);
        bg.strokeRect(x, y, SLOT - 2, SLOT - 2);
      });
    });
  }

  private renderEquipment(W: number) {
    const EX = W - 186;
    const EY = GRID_Y;

    const panGfx = this.add.graphics();
    drawPanel(panGfx, EX - 8, EY - 18, 178, 294, UI.SLOT_BG);
    this.add.text(EX + 81, EY - 12, t('inventory.equipment'), pxStyle(7, UI.TXT_GOLD)).setOrigin(0.5, 0);

    const slots: [keyof typeof this.player.equipment, string][] = [
      ['weapon', t('inventory.slot.weapon')],  ['helm',   t('inventory.slot.helm')],   ['chest', t('inventory.slot.chest')],
      ['legs',   t('inventory.slot.legs')],    ['boots',  t('inventory.slot.boots')],  ['gloves', t('inventory.slot.gloves')],
      ['cape',   t('inventory.slot.cape')],    ['ring1',  t('inventory.slot.ring1')],  ['ring2',  t('inventory.slot.ring2')],
      ['amulet', t('inventory.slot.amulet')],
    ];

    slots.forEach(([key, label], i) => {
      const y   = EY + 4 + i * 26;
      const item = this.player.equipment[key] as Item | undefined;

      this.add.text(EX, y, `${label}:`, pxStyle(6, UI.TXT_MUTED));

      const raw  = item?.name ?? '—';
      const name = raw.length > 12 ? raw.slice(0, 10) + '..' : raw;
      const col  = item ? (RARITY_COLORS[item.rarity] ?? UI.TXT_PARCHMENT) : UI.TXT_HINT;
      this.add.text(EX + 72, y, name, pxStyle(6, col));
    });
  }

  private showItemDetail(itemId: string) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const item = ALL_ITEMS[itemId];
    if (!item) return;

    // Destroy any existing detail panel
    this.children.getByName('detail_panel')?.destroy();

    const PANEL_W = 490;
    const PANEL_H = 108;
    const px      = (W - PANEL_W) / 2;
    const py      = H - PANEL_H - 10;

    const panel = this.add.container(0, 0).setName('detail_panel').setDepth(20);

    const bg = this.add.graphics();
    drawPanel(bg, px, py, PANEL_W, PANEL_H);
    panel.add(bg);

    const rarColor = RARITY_COLORS[item.rarity] ?? UI.TXT_PARCHMENT;
    const locItem  = localizeItem(item);
    panel.add(
      this.add.text(px + 12, py + 10, `[${item.rarity}]  ${locItem.name}`, pxStyle(9, rarColor))
    );
    panel.add(
      this.add.text(px + 12, py + 30, locItem.description, {
        ...pxStyle(8, UI.TXT_MUTED),
        wordWrap: { width: PANEL_W - 24 },
      })
    );

    const actions: string[] = [];
    const equipTypes = [
      ItemType.WEAPON, ItemType.HELM, ItemType.CHEST, ItemType.LEGS,
      ItemType.BOOTS,  ItemType.GLOVES, ItemType.CAPE, ItemType.RING, ItemType.AMULET,
    ];
    if (equipTypes.includes(item.type))    actions.push(t('inventory.equip_hint'));
    if (item.type === ItemType.CONSUMABLE) actions.push(t('inventory.use_hint'));
    if (item.type !== ItemType.KEY_ITEM)   actions.push(t('inventory.sell_hint').replace('{value}', String(item.value)));
    actions.push(t('inventory.close_hint'));

    panel.add(
      this.add.text(px + PANEL_W - 12, py + PANEL_H - 14, actions.join('   '), pxStyle(7, UI.TXT_HINT))
        .setOrigin(1, 0)
    );

    // Remove any leftover listeners from a previous detail panel click
    const KB = this.input.keyboard!;
    KB.removeKey(Phaser.Input.Keyboard.KeyCodes.Z);
    KB.removeKey(Phaser.Input.Keyboard.KeyCodes.X);
    KB.removeKey(Phaser.Input.Keyboard.KeyCodes.C);
    const z = KB.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    const x = KB.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    const c = KB.addKey(Phaser.Input.Keyboard.KeyCodes.C);

    z.once('down', () => {
      setInventoryPlayerContext(this.player);
      if (item.type === ItemType.CONSUMABLE) {
        InventorySystem.useConsumable(this.player, itemId);
      } else {
        InventorySystem.equip(this.player, itemId);
      }
      panel.destroy();
      this.scene.restart({ gameScene: this.gameScene });
    });
    x.once('down', () => {
      InventorySystem.sell(this.player, itemId, 1);
      panel.destroy();
      this.scene.restart({ gameScene: this.gameScene });
    });
    c.once('down', () => panel.destroy());
  }

  shutdown() {
    this.input.keyboard?.removeAllKeys(true);
  }
}
