import { GameScene } from './GameScene';
import { PlayerState, EquippedSkills, Skill } from '../types';
import { SkillSystem } from '../systems/SkillSystem';
import { SKILL_MAP } from '../data/skills';
import { UI, drawPanel, pxStyle } from '../utils/UITheme';
import { t, localizeSkill } from '../i18n';

export class SkillScene extends Phaser.Scene {
  private gameScene!:        GameScene;
  private player!:           PlayerState;
  private selectedSkillId:   string | null = null;

  constructor() { super({ key: 'SkillScene' }); }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
    this.player    = data.gameScene.gameState.player;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);

    // Main frame
    const frame = this.add.graphics();
    drawPanel(frame, 6, 6, W - 12, H - 12);

    // Title
    this.add.text(W / 2, 18, t('skills.title'), pxStyle(12, UI.TXT_GOLD, true)).setOrigin(0.5, 0);

    // Separator
    const sep = this.add.graphics();
    sep.lineStyle(1, UI.BORDER_LIT, 0.6);
    sep.beginPath();
    sep.moveTo(18, 42);
    sep.lineTo(W - 18, 42);
    sep.strokePath();

    // Sections
    this.renderUnlockedSkills(W, H);
    this.renderEquippedSlots(W, H);

    // Footer hint
    this.add.text(W / 2, H - 12, t('skills.close_hint'), pxStyle(6, UI.TXT_HINT))
      .setOrigin(0.5, 1);
  }

  private renderUnlockedSkills(W: number, _H: number) {
    this.add.text(18, 50, t('skills.unlocked'), pxStyle(8, UI.TXT_MUTED));

    const CELL_W = 78;
    const CELL_H = 66;
    const GAP    = 4;
    const COLS   = Math.floor((W - 36) / (CELL_W + GAP));

    this.player.unlockedSkills.forEach((skillId, i) => {
      const skill = SKILL_MAP[skillId];
      if (!skill) return;

      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x   = 18 + col * (CELL_W + GAP);
      const y   = 68  + row * (CELL_H + GAP);

      const isSelected = this.selectedSkillId === skillId;

      const bg = this.add.graphics();
      drawPanel(
        bg, x, y, CELL_W, CELL_H,
        isSelected ? 0x1a2a1a : UI.SLOT_BG
      );

      // Gold border overlay when selected
      if (isSelected) {
        bg.lineStyle(2, UI.CORNER, 1);
        bg.strokeRect(x + 1, y + 1, CELL_W - 2, CELL_H - 2);
      }

      try {
        this.add.image(x + CELL_W / 2, y + 24, skill.icon).setDisplaySize(28, 28);
      } catch {}

      this.add.text(x + CELL_W / 2, y + 44, localizeSkill(skill).name, {
        ...pxStyle(6, isSelected ? UI.TXT_GREEN : UI.TXT_MUTED),
        wordWrap: { width: CELL_W - 6 },
        align: 'center',
      }).setOrigin(0.5, 0);

      if (skill.manaCost > 0) {
        this.add.text(x + 4, y + 4, `${skill.manaCost}`, pxStyle(6, UI.TXT_BLUE));
      }

      const hit = this.add.rectangle(x + CELL_W / 2, y + CELL_H / 2, CELL_W, CELL_H, 0, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerdown', () => {
        this.selectedSkillId = skillId;
        this.scene.restart({ gameScene: this.gameScene });
      });
      hit.on('pointerover', () => { this.showTooltip(skill, x, y); });
    });
  }

  private renderEquippedSlots(W: number, H: number) {
    const SLOT_W  = 86;
    const SLOT_H  = 64;
    const GAP     = 6;
    const TOTAL_W = 4 * SLOT_W + 3 * GAP;
    const SX      = W / 2 - TOTAL_W / 2;
    const SY      = H - SLOT_H - 28;

    this.add.text(W / 2, SY - 14, t('skills.equipped'), pxStyle(8, UI.TXT_MUTED)).setOrigin(0.5, 1);

    const slotKeys: (keyof EquippedSkills)[] = ['slot1', 'slot2', 'slot3', 'slot4'];
    const labels = ['A', 'E', 'R', 'F'];

    slotKeys.forEach((slot, i) => {
      const x       = SX + i * (SLOT_W + GAP);
      const skillId = this.player.equippedSkills[slot];
      const skill   = skillId ? SKILL_MAP[skillId] : null;

      // When a skill is selected: empty slots pulse with a subtle gold tint to invite dropping,
      // occupied slots stay darker so the distinction is clear.
      const slotFill = this.selectedSkillId
        ? (skill ? 0x14141e : 0x1a1828)
        : UI.SLOT_BG;
      const bg = this.add.graphics();
      drawPanel(bg, x, SY, SLOT_W, SLOT_H, slotFill);

      // Key label
      this.add.text(x + 5, SY + 5, labels[i], pxStyle(7, UI.TXT_GOLD));

      if (skill) {
        try { this.add.image(x + SLOT_W / 2, SY + 30, skill.icon).setDisplaySize(28, 28); } catch {}
        this.add.text(x + SLOT_W / 2, SY + SLOT_H - 10, localizeSkill(skill).name, {
          ...pxStyle(6, UI.TXT_PARCHMENT),
          wordWrap: { width: SLOT_W - 6 },
          align: 'center',
        }).setOrigin(0.5, 1);
      } else {
        this.add.text(x + SLOT_W / 2, SY + SLOT_H / 2, '—', pxStyle(14, UI.TXT_HINT))
          .setOrigin(0.5);
      }

      // Glow hint when a skill is selected: bright gold on empty slots, dim on occupied
      if (this.selectedSkillId) {
        bg.lineStyle(1, UI.CORNER, skill ? 0.35 : 0.85);
        bg.strokeRect(x + 1, SY + 1, SLOT_W - 2, SLOT_H - 2);
      }

      const hit = this.add.rectangle(x + SLOT_W / 2, SY + SLOT_H / 2, SLOT_W, SLOT_H, 0, 0)
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

  private showTooltip(skill: Skill, sx: number, sy: number) {
    this.children.getByName('skill_tip')?.destroy();

    const W   = this.cameras.main.width;
    const TW  = 216;
    const TH  = 82;
    const tx  = Math.min(sx + 84, W - TW - 8);
    const tip = this.add.container(tx, sy).setName('skill_tip').setDepth(30);

    const bg = this.add.graphics();
    drawPanel(bg, 0, 0, TW, TH);
    tip.add(bg);

    const locSkill = localizeSkill(skill);
    tip.add(this.add.text(8, 8,  locSkill.name,        pxStyle(9,  UI.TXT_GOLD)));
    tip.add(this.add.text(8, 24, locSkill.description, {
      ...pxStyle(7, UI.TXT_MUTED),
      wordWrap: { width: TW - 16 },
      lineSpacing: 3,
    }));
    tip.add(this.add.text(8, TH - 16,
      `${t('skills.mana')} : ${skill.manaCost}   ${t('skills.cd')} : ${skill.cooldown}s`,
      pxStyle(7, UI.TXT_BLUE)
    ));
  }

  shutdown() {
    this.input.keyboard?.removeAllKeys(true);
  }
}
