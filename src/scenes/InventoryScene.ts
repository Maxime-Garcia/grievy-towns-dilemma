import { GameScene } from './GameScene';
import { PlayerState, ItemType, RARITY_COLORS, ItemRarity } from '../types';
import { InventorySystem, setInventoryPlayerContext } from '../systems/InventorySystem';
import { ALL_ITEMS } from '../data/items';

const COLS = 8;
const SLOT = 48;
const PADDING = 12;

export class InventoryScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private player!: PlayerState;
  private selectedIndex = 0;

  constructor() { super({ key: 'InventoryScene' }); }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
    this.player    = data.gameScene.gameState.player;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Dark overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8);

    // Title
    this.add.text(W / 2, 16, 'INVENTORY', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    this.add.text(W - 16, 16, `Gold: ${this.player.gold}`, {
      fontSize: '13px', color: '#ffcc44', fontFamily: 'monospace',
    }).setOrigin(1, 0);

    this.renderGrid();
    this.renderEquipment();

    // Close button
    const closeBtn = this.add.text(W / 2, H - 20, '[I] Close', {
      fontSize: '11px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.scene.stop());
  }

  private renderGrid() {
    const startX = PADDING;
    const startY = 50;

    this.player.inventory.forEach((slot, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = startX + col * SLOT;
      const y = startY + row * SLOT;

      const bg = this.add.graphics();
      bg.fillStyle(0x222222); bg.fillRect(x, y, SLOT - 2, SLOT - 2);
      bg.lineStyle(1, 0x444444); bg.strokeRect(x, y, SLOT - 2, SLOT - 2);

      const rarityColor = parseInt(RARITY_COLORS[slot.item.rarity]?.replace('#', '') ?? 'ffffff', 16);
      bg.lineStyle(2, rarityColor); bg.strokeRect(x, y, SLOT - 2, SLOT - 2);

      try {
        this.add.image(x + SLOT / 2 - 1, y + SLOT / 2 - 1, slot.item.icon).setDisplaySize(28, 28);
      } catch {}

      if (slot.quantity > 1) {
        this.add.text(x + SLOT - 4, y + SLOT - 4, `${slot.quantity}`, {
          fontSize: '9px', color: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(1, 1);
      }

      // Click to show item detail + actions
      const hitArea = this.add.rectangle(x + SLOT / 2 - 1, y + SLOT / 2 - 1, SLOT - 2, SLOT - 2, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => this.showItemDetail(slot.item.id, i));
      hitArea.on('pointerover', () => bg.lineStyle(2, 0xffffff));
      hitArea.on('pointerout',  () => bg.lineStyle(2, rarityColor));
    });
  }

  private renderEquipment() {
    const W = this.cameras.main.width;
    const startX = W - 180;
    const startY = 50;

    this.add.text(startX, startY - 14, 'EQUIPMENT', {
      fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace',
    });

    const slots: [keyof typeof this.player.equipment, string][] = [
      ['weapon', 'Weapon'], ['helm', 'Helm'], ['chest', 'Chest'],
      ['legs', 'Legs'], ['boots', 'Boots'], ['gloves', 'Gloves'],
      ['cape', 'Cape'], ['ring1', 'Ring 1'], ['ring2', 'Ring 2'], ['amulet', 'Amulet'],
    ];

    slots.forEach(([slot, label], i) => {
      const y = startY + i * 26;
      this.add.text(startX, y, label, {
        fontSize: '10px', color: '#666666', fontFamily: 'monospace',
      });
      const item = this.player.equipment[slot];
      const name = item ? item.name : '—';
      const color = item ? (RARITY_COLORS[item.rarity] ?? '#ffffff') : '#444444';
      this.add.text(startX + 70, y, name, {
        fontSize: '10px', color, fontFamily: 'monospace',
      });
    });
  }

  private showItemDetail(itemId: string, index: number) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const item = ALL_ITEMS[itemId];
    if (!item) return;

    // Remove previous detail panel
    this.children.getByName('detail_panel')?.destroy();

    const panel = this.add.container(W / 2, H - 100).setName('detail_panel');
    const bg = this.add.graphics();
    bg.fillStyle(0x111111, 0.98);
    bg.fillRect(-200, -50, 400, 90);
    bg.lineStyle(1, parseInt(RARITY_COLORS[item.rarity].replace('#', ''), 16));
    bg.strokeRect(-200, -50, 400, 90);
    panel.add(bg);

    panel.add(this.add.text(-190, -45, `${item.name}`, {
      fontSize: '13px', color: RARITY_COLORS[item.rarity], fontFamily: 'monospace',
    }));
    panel.add(this.add.text(-190, -28, item.description, {
      fontSize: '10px', color: '#aaaaaa', fontFamily: 'monospace',
      wordWrap: { width: 380 },
    }));

    const actions: string[] = [];
    if ([ItemType.WEAPON, ItemType.HELM, ItemType.CHEST, ItemType.LEGS,
         ItemType.BOOTS, ItemType.GLOVES, ItemType.CAPE, ItemType.RING, ItemType.AMULET]
        .includes(item.type)) {
      actions.push('[Z] Equip');
    }
    if (item.type === ItemType.CONSUMABLE) {
      actions.push('[Z] Use');
    }
    if (item.type !== ItemType.KEY_ITEM) {
      actions.push(`[X] Sell (${item.value}G)`);
    }
    actions.push('[C] Close');

    panel.add(this.add.text(190, 20, actions.join('  '), {
      fontSize: '10px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(1, 1));

    const z = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    const x = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    const c = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C);

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
}
