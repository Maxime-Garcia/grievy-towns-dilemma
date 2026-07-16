import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { ItemRarity, RARITY_COLORS } from '../types';
import { PITY_THRESHOLDS } from '../systems/LootSystem';
import {
  UI, TYPE, drawGlowPanel, drawCard, drawBar, drawBadge, drawDivider,
  uiStyle, titleStyle, addCloseButton, openScreenTransition,
} from '../utils/UITheme';
import { t } from '../i18n';

// Système Pity (PITY/PITY.md) : panneau overlay listant, pour chaque rareté
// protégée (EPIC/LEGENDARY/MYTHIC — HIDDEN exclu, uniques hors du pool générique,
// cf. project_pity_system memory), le nombre de kills restants avant garantie.
//
// Le jeu est en pause pendant que ce panneau est ouvert (comme Inventaire/
// Talents) : les compteurs sont donc figés, aucune mise à jour "live" nécessaire.

const ROW_H   = 84;
const ROW_GAP = 10;
const PANEL_W = 460;
const HEADER_H = 48;
const FOOTER_H = 40;
const PAD = 14;

// Ordre d'affichage : croissant en rareté (la lecture descend vers le plus précieux).
const DISPLAY_ORDER: ItemRarity[] = [ItemRarity.EPIC, ItemRarity.LEGENDARY, ItemRarity.MYTHIC];

function rarityColorNum(rarity: ItemRarity): number {
  return parseInt((RARITY_COLORS[rarity] ?? '#888888').slice(1), 16);
}

/** Texte de badge lisible : LEGENDARY (#ffd700) et MYTHIC (#ff4fc0) sont trop
 *  clairs pour du blanc — texte blanc/rose ≈ 2.9:1, sous le seuil 4.5:1 (WCAG AA,
 *  petit texte). EPIC (#7722cc, ≈7.3:1) reste en blanc. */
function badgeTextColor(rarity: ItemRarity): string {
  return rarity === ItemRarity.LEGENDARY || rarity === ItemRarity.MYTHIC ? '#1a1408' : '#ffffff';
}

export class PityScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private glowTweens: Phaser.Tweens.Tween[] = [];

  constructor() { super({ key: 'PityScene' }); }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
    this.glowTweens = [];
  }

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    openScreenTransition(this);

    const { width: W, height: H } = this.cameras.main;
    const player = this.gameScene.gameState.player;

    const rows = DISPLAY_ORDER
      .map(rarity => ({ rarity, threshold: PITY_THRESHOLDS[rarity] }))
      .filter((r): r is { rarity: ItemRarity; threshold: number } => r.threshold !== undefined);

    const panelH = PAD + HEADER_H + rows.length * ROW_H + (rows.length - 1) * ROW_GAP + PAD + FOOTER_H + PAD;
    const panelX = (W - PANEL_W) / 2;
    const panelY = (H - panelH) / 2;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);
    const frame = this.add.graphics();
    drawGlowPanel(frame, panelX, panelY, PANEL_W, panelH, UI.ACCENT_ARCANE, UI.BG_DEEP, 6, 0.92);

    this.add.text(W / 2, panelY + PAD + 6, t('pity.title'), titleStyle(UI.TXT_GOLD, { stroke: true }))
      .setOrigin(0.5, 0);
    addCloseButton(this, panelX + PANEL_W - 24, panelY + PAD + 10, () => this.gameScene.closeOverlay('PityScene'));

    const sepGfx = this.add.graphics();
    drawDivider(sepGfx, panelX + PAD, panelY + PAD + HEADER_H - 6, PANEL_W - PAD * 2, UI.ACCENT_ARCANE, 0.35);

    const killsFor = (rarity: ItemRarity): number => {
      switch (rarity) {
        case ItemRarity.EPIC:      return player.killsWithoutEpic;
        case ItemRarity.LEGENDARY: return player.killsWithoutLegendary;
        case ItemRarity.MYTHIC:    return player.killsWithoutMythic;
        default:                   return 0;
      }
    };

    let rowY = panelY + PAD + HEADER_H;
    for (const { rarity, threshold } of rows) {
      this.renderRow(panelX + PAD, rowY, PANEL_W - PAD * 2, rarity, killsFor(rarity), threshold);
      rowY += ROW_H + ROW_GAP;
    }

    this.add.text(
      W / 2, panelY + panelH - PAD - FOOTER_H / 2, t('pity.footer'),
      uiStyle(TYPE.SMALL, UI.TXT_MUTED, { align: 'center', wordWrapWidth: PANEL_W - PAD * 2 }),
    ).setOrigin(0.5);

    // Pas de handler ESC ici : GameScene.escKey est le propriétaire UNIQUE de
    // l'ESC des overlays (cf. son commentaire) et gère déjà 'PityScene' — un
    // second handler ici la refermerait en double (pattern InventoryScene, pas
    // SkillScene qui enfreint la même règle).
  }

  private renderRow(x: number, y: number, w: number, rarity: ItemRarity, kills: number, threshold: number) {
    const color     = rarityColorNum(rarity);
    const remaining = Math.max(0, threshold - kills);
    const ready     = remaining <= 0;
    const pct       = Math.max(0, Math.min(1, kills / threshold));

    const card = this.add.graphics();
    drawCard(card, x, y, w, ROW_H, { accent: color, radius: 6 });

    // Badge nom de rareté (haut-gauche)
    const badgeLabel = t(`rarity.${rarity}`).toUpperCase();
    drawBadge(this, x + 14 + 30, y + 10 + 10, badgeLabel, color, badgeTextColor(rarity));

    // Nombre restant (héros de la ligne, haut-droite) + libellé sous lui
    const heroText = ready ? t('pity.guaranteed') : String(remaining);
    this.add.text(x + w - 14, y + 8, heroText,
      uiStyle(TYPE.HEADING, ready ? UI.TXT_GOLD : UI.TXT_PARCHMENT, { bold: true, stroke: ready }),
    ).setOrigin(1, 0);
    if (!ready) {
      this.add.text(x + w - 14, y + 30, t('pity.remaining_label'),
        uiStyle(TYPE.SMALL, UI.TXT_MUTED),
      ).setOrigin(1, 0);
    }

    // Barre de progression
    const barY = y + 46;
    const barW = w;
    const bar = this.add.graphics();
    drawBar(bar, x, barY, barW, 10, pct, color, UI.BG_DEEP, 0xffffff);

    // Sous-ligne : kills / seuil
    this.add.text(x, barY + 16, t('pity.since')
      .replace('{n}', String(kills))
      .replace('{max}', String(threshold))
      .replace('{rarity}', t(`rarity.${rarity}`)),
      uiStyle(TYPE.SMALL, UI.TXT_MUTED),
    ).setOrigin(0, 0);

    // État GARANTI : halo pulsant discret autour de la carte. Ne se déclenche pas
    // en jeu normal (LootSystem paie la dette dans le MÊME rollLoot qui fait
    // franchir le seuil — le compteur ne reste jamais visible à "0 restant" non
    // payé), sauf si le pool générique venait à se vider pour une rareté (garde
    // défensive, cf. LootSystem.ts, pas un chemin normal).
    if (ready) {
      const glow = this.add.graphics();
      glow.lineStyle(2, color, 0.5);
      glow.strokeRoundedRect(x - 2, y - 2, w + 4, ROW_H + 4, 8);
      const tw = this.tweens.add({
        targets: glow, alpha: { from: 0.5, to: 1 }, duration: 900, yoyo: true, repeat: -1,
      });
      this.glowTweens.push(tw);
    }
  }

  shutdown() {
    for (const tw of this.glowTweens) tw.stop();
    this.glowTweens = [];
  }
}
