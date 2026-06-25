import { GameScene } from './GameScene';
import { PlayerState, EquippedSkills, Skill } from '../types';
import { SkillSystem } from '../systems/SkillSystem';
import { SKILL_MAP } from '../data/skills';

export class SkillScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private player!: PlayerState;
  private selectedSkillId: string | null = null;

  constructor() { super({ key: 'SkillScene' }); }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
    this.player    = data.gameScene.gameState.player;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85);
    this.add.text(W / 2, 16, 'SKILLS', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    this.renderUnlockedSkills();
    this.renderEquippedSlots();

    this.add.text(W / 2, H - 20, '[K] Close  |  Click to select, then click a slot to equip', {
      fontSize: '9px', color: '#666666', fontFamily: 'monospace',
    }).setOrigin(0.5, 1);
  }

  private renderUnlockedSkills() {
    const W = this.cameras.main.width;
    this.add.text(20, 46, 'Unlocked Skills', {
      fontSize: '12px', color: '#aaaaaa', fontFamily: 'monospace',
    });

    this.player.unlockedSkills.forEach((skillId, i) => {
      const skill = SKILL_MAP[skillId];
      if (!skill) return;

      const col = i % 8;
      const row = Math.floor(i / 8);
      const x   = 20 + col * 80;
      const y   = 70 + row * 80;

      const bg = this.add.graphics();
      const isSelected = this.selectedSkillId === skillId;
      bg.fillStyle(isSelected ? 0x334433 : 0x222222);
      bg.fillRect(x, y, 72, 60);
      bg.lineStyle(1, isSelected ? 0x88ff88 : 0x444444);
      bg.strokeRect(x, y, 72, 60);

      try {
        this.add.image(x + 36, y + 20, skill.icon).setDisplaySize(28, 28);
      } catch {}

      this.add.text(x + 36, y + 48, skill.name, {
        fontSize: '8px', color: '#cccccc', fontFamily: 'monospace',
        wordWrap: { width: 70 },
      }).setOrigin(0.5, 0);

      if (skill.manaCost > 0) {
        this.add.text(x + 4, y + 4, `${skill.manaCost}mp`, {
          fontSize: '7px', color: '#6688ff', fontFamily: 'monospace',
        });
      }

      const hit = this.add.rectangle(x + 36, y + 30, 72, 60, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => {
        this.selectedSkillId = skillId;
        this.scene.restart({ gameScene: this.gameScene });
      });

      hit.on('pointerover', () => {
        this.showSkillTooltip(skill, x, y);
      });
    });
  }

  private renderEquippedSlots() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.text(20, H - 110, 'Equipped (Q / E / R / F)', {
      fontSize: '12px', color: '#aaaaaa', fontFamily: 'monospace',
    });

    const slotKeys: (keyof EquippedSkills)[] = ['slot1', 'slot2', 'slot3', 'slot4'];
    const slotLabels = ['Q', 'E', 'R', 'F'];

    slotKeys.forEach((slot, i) => {
      const x = 20 + i * 90;
      const y = H - 85;
      const skillId = this.player.equippedSkills[slot];
      const skill = skillId ? SKILL_MAP[skillId] : null;

      const bg = this.add.graphics();
      bg.fillStyle(0x333311);
      bg.fillRect(x, y, 80, 56);
      bg.lineStyle(1, 0x888844);
      bg.strokeRect(x, y, 80, 56);

      this.add.text(x + 4, y + 4, slotLabels[i], {
        fontSize: '9px', color: '#888844', fontFamily: 'monospace',
      });

      if (skill) {
        try { this.add.image(x + 40, y + 28, skill.icon).setDisplaySize(28, 28); } catch {}
        this.add.text(x + 40, y + 50, skill.name, {
          fontSize: '7px', color: '#ccccaa', fontFamily: 'monospace',
        }).setOrigin(0.5, 0);
      } else {
        this.add.text(x + 40, y + 28, '—', {
          fontSize: '14px', color: '#555533', fontFamily: 'monospace',
        }).setOrigin(0.5);
      }

      const hit = this.add.rectangle(x + 40, y + 28, 80, 56, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => {
        if (this.selectedSkillId) {
          SkillSystem.equipSkill(this.player, this.selectedSkillId, slot);
          this.selectedSkillId = null;
          this.scene.restart({ gameScene: this.gameScene });
        }
      });
    });
  }

  private showSkillTooltip(skill: Skill | null | undefined, sx: number, sy: number) {
    if (!skill) return;
    const existing = this.children.getByName('skill_tooltip');
    existing?.destroy();

    const W = this.cameras.main.width;
    const tooltip = this.add.container(Math.min(sx + 80, W - 220), sy).setName('skill_tooltip');

    const bg = this.add.graphics();
    bg.fillStyle(0x111111, 0.96);
    bg.fillRect(0, 0, 210, 80);
    bg.lineStyle(1, 0x555555);
    bg.strokeRect(0, 0, 210, 80);
    tooltip.add(bg);

    tooltip.add(this.add.text(8, 6, skill.name, { fontSize: '11px', color: '#ffffff', fontFamily: 'monospace' }));
    tooltip.add(this.add.text(8, 22, skill.description, { fontSize: '9px', color: '#aaaaaa', fontFamily: 'monospace', wordWrap: { width: 195 } }));
    tooltip.add(this.add.text(8, 56, `Mana: ${skill.manaCost}  CD: ${skill.cooldown}s`, { fontSize: '9px', color: '#6688ff', fontFamily: 'monospace' }));
  }
}
