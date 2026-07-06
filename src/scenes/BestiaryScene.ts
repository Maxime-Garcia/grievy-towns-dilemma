// src/scenes/BestiaryScene.ts
// Scène Bestiaire — UI en 2 colonnes : liste gauche + détail droite.
// Lancée depuis PauseScene, fermée via ESC.

import Phaser from 'phaser';
import { WorldState } from '../types';
import { BESTIARY_DATA } from '../data/bestiary';
import { BestiarySystem } from '../systems/BestiarySystem';
import { ENEMY_MAP } from '../data/enemies';
import { UI, drawPanel, pxStyle } from '../utils/UITheme';

// Largeur de la colonne liste gauche
const LIST_W = 240;
// Taille d'une ligne de liste
const ITEM_H = 32;
// Couleur par élément (pour l'icône de preview)
const ELEMENT_COLORS: Record<string, number> = {
  FIRE:      0xff4400,
  EARTH:     0x88aa33,
  WIND:      0xaaddff,
  WATER:     0x2266ff,
  LIGHTNING: 0xffee00,
  ICE:       0x88ddff,
  DARK:      0x8833cc,
  DIVINE:    0xffd700,
  NEUTRAL:   0xaaaaaa,
};

export class BestiaryScene extends Phaser.Scene {
  private world!: WorldState;
  private selectedIndex = 0;

  // Keyboard refs pour cleanup dans shutdown()
  private keyUp!:   Phaser.Input.Keyboard.Key;
  private keyDown!: Phaser.Input.Keyboard.Key;
  private keyEsc!:  Phaser.Input.Keyboard.Key;

  // Refs aux objets UI régénérés lors d'un changement de sélection
  private detailPanel!: Phaser.GameObjects.Container;
  private listPanel!:   Phaser.GameObjects.Container;

  constructor() { super({ key: 'BestiaryScene' }); }

  init(data: { world: WorldState }) {
    this.world = data.world;
    this.selectedIndex = 0;
  }

  create() {
    const { width: W, height: H } = this.cameras.main;

    this.cameras.main.fadeIn(200, 0, 0, 0);

    // Overlay opaque
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);

    // Panneau principal
    const panelG = this.add.graphics();
    drawPanel(panelG, 8, 8, W - 16, H - 16, UI.PANEL_BG, 0.97);

    // Titre
    this.add.text(W / 2, 22, 'BESTIAIRE', pxStyle(12, UI.TXT_GOLD, true)).setOrigin(0.5);

    // Séparateur titre
    const sepG = this.add.graphics();
    sepG.lineStyle(1, UI.BORDER_LIT, 0.6);
    sepG.beginPath();
    sepG.moveTo(16, 38); sepG.lineTo(W - 16, 38);
    sepG.strokePath();

    // Séparateur vertical liste/détail
    const sepV = this.add.graphics();
    sepV.lineStyle(1, UI.BORDER_LIT, 0.4);
    sepV.beginPath();
    sepV.moveTo(LIST_W + 16, 42); sepV.lineTo(LIST_W + 16, H - 24);
    sepV.strokePath();

    // Hint navigation
    this.add.text(W / 2, H - 14, '↑ ↓  naviguer   ESC  fermer', pxStyle(5, UI.TXT_HINT)).setOrigin(0.5);

    // Containers mutables
    this.listPanel   = this.add.container(0, 0);
    this.detailPanel = this.add.container(0, 0);

    // Input
    this.keyUp   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keyEsc  = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.keyUp.on('down',   () => this.navigate(-1));
    this.keyDown.on('down', () => this.navigate(1));
    this.keyEsc.on('down',  () => this.close());

    this.renderList();
    this.renderDetail();
  }

  // ── Navigation ───────────────────────────────────────────────

  private navigate(dir: -1 | 1) {
    const total = BESTIARY_DATA.length;
    if (total === 0) return;
    this.selectedIndex = (this.selectedIndex + dir + total) % total;
    this.renderList();
    this.renderDetail();
  }

  // ── Rendu liste gauche ───────────────────────────────────────

  private renderList() {
    const { height: H } = this.cameras.main;
    this.listPanel.removeAll(true);

    const maxVisible = Math.floor((H - 70) / ITEM_H);
    const total = BESTIARY_DATA.length;

    if (total === 0) {
      const empty = this.add.text(16 + LIST_W / 2, H / 2, 'Aucune créature\ndans le bestiaire', {
        ...pxStyle(7, UI.TXT_MUTED),
        align: 'center',
      }).setOrigin(0.5);
      this.listPanel.add(empty);
      return;
    }

    // Calcul fenêtre de scroll centrée sur la sélection
    let startIdx = Math.max(0, this.selectedIndex - Math.floor(maxVisible / 2));
    startIdx = Math.min(startIdx, Math.max(0, total - maxVisible));

    for (let i = 0; i < maxVisible && startIdx + i < total; i++) {
      const dataIdx  = startIdx + i;
      const entry    = BESTIARY_DATA[dataIdx];
      const state    = this.world.bestiary?.[entry.enemyId];
      const isKnown  = state?.discovered ?? false;
      const isActive = dataIdx === this.selectedIndex;

      const itemY = 46 + i * ITEM_H;

      // Fond de sélection
      if (isActive) {
        const selBg = this.add.graphics();
        selBg.fillStyle(0x1a2a3a, 0.9);
        selBg.fillRect(12, itemY - 2, LIST_W, ITEM_H - 2);
        selBg.lineStyle(1, UI.CORNER, 0.6);
        selBg.strokeRect(12, itemY - 2, LIST_W, ITEM_H - 2);
        this.listPanel.add(selBg);
      }

      // Icône colorée (cercle représentant l'élément)
      const enemyDef = ENEMY_MAP[entry.enemyId];
      const elemColor = enemyDef
        ? (ELEMENT_COLORS[enemyDef.element as string] ?? ELEMENT_COLORS['NEUTRAL'])
        : ELEMENT_COLORS['NEUTRAL'];

      const iconG = this.add.graphics();
      if (isKnown) {
        iconG.fillStyle(elemColor, 0.85);
        iconG.fillCircle(26, itemY + ITEM_H / 2 - 2, 8);
        iconG.lineStyle(1, 0xffffff, 0.3);
        iconG.strokeCircle(26, itemY + ITEM_H / 2 - 2, 8);
      } else {
        iconG.fillStyle(0x333333, 0.5);
        iconG.fillCircle(26, itemY + ITEM_H / 2 - 2, 8);
      }
      this.listPanel.add(iconG);

      // Nom (ou ???)
      const nameStr = isKnown ? entry.name : '???';
      const col     = isKnown ? (isActive ? UI.TXT_GOLD : UI.TXT_PARCHMENT) : UI.TXT_MUTED;
      const nameTxt = this.add.text(42, itemY + ITEM_H / 2 - 2, nameStr, pxStyle(7, col)).setOrigin(0, 0.5);
      this.listPanel.add(nameTxt);
    }

    // Indicateurs de scroll si nécessaire
    if (startIdx > 0) {
      const arrowUp = this.add.text(LIST_W / 2 + 16, 44, '▲', pxStyle(6, UI.TXT_MUTED)).setOrigin(0.5);
      this.listPanel.add(arrowUp);
    }
    if (startIdx + maxVisible < total) {
      const arrowDown = this.add.text(LIST_W / 2 + 16, H - 28, '▼', pxStyle(6, UI.TXT_MUTED)).setOrigin(0.5);
      this.listPanel.add(arrowDown);
    }
  }

  // ── Rendu panneau détail droite ──────────────────────────────

  private renderDetail() {
    const { width: W, height: H } = this.cameras.main;
    this.detailPanel.removeAll(true);

    if (BESTIARY_DATA.length === 0) return;

    const entry      = BESTIARY_DATA[this.selectedIndex];
    if (!entry) return;

    const state      = this.world.bestiary?.[entry.enemyId];
    const isDiscov   = state?.discovered ?? false;
    const isKilled   = state?.killed     ?? false;

    const detailX = LIST_W + 24;
    const detailW = W - detailX - 16;
    let   curY    = 48;

    if (!isDiscov) {
      // Créature jamais rencontrée
      const unk = this.add.text(detailX + detailW / 2, H / 2, '???', {
        ...pxStyle(16, UI.TXT_MUTED),
        align: 'center',
      }).setOrigin(0.5);
      this.detailPanel.add(unk);
      const subunk = this.add.text(detailX + detailW / 2, H / 2 + 28, 'Explorez le monde\npour découvrir cette créature.', {
        ...pxStyle(7, UI.TXT_HINT),
        align: 'center',
      }).setOrigin(0.5);
      this.detailPanel.add(subunk);
      return;
    }

    // Nom + habitat
    const nameTxt = this.add.text(detailX, curY, entry.name, pxStyle(10, UI.TXT_GOLD, true)).setOrigin(0, 0);
    this.detailPanel.add(nameTxt);
    curY += 18;

    const habTxt = this.add.text(detailX, curY, entry.habitat, pxStyle(6, UI.TXT_MUTED)).setOrigin(0, 0);
    this.detailPanel.add(habTxt);
    curY += 18;

    // Séparateur
    const sepG = this.add.graphics();
    sepG.lineStyle(1, UI.BORDER_LIT, 0.4);
    sepG.beginPath(); sepG.moveTo(detailX, curY); sepG.lineTo(detailX + detailW, curY); sepG.strokePath();
    this.detailPanel.add(sepG);
    curY += 10;

    // Description courte
    const descTxt = this.add.text(detailX, curY, entry.shortDesc, {
      ...pxStyle(7, UI.TXT_PARCHMENT),
      wordWrap: { width: detailW, useAdvancedWrap: true },
    }).setOrigin(0, 0);
    this.detailPanel.add(descTxt);
    curY += descTxt.height + 14;

    // Lore (débloqué après premier kill)
    if (isKilled) {
      const loreG = this.add.graphics();
      loreG.fillStyle(0x0a0a18, 0.5);
      loreG.fillRect(detailX - 4, curY - 4, detailW + 8, 0); // sera étiré dynamiquement
      this.detailPanel.add(loreG);

      const loreTxt = this.add.text(detailX, curY, entry.lore, {
        ...pxStyle(6, UI.TXT_MUTED),
        wordWrap: { width: detailW, useAdvancedWrap: true },
        fontStyle: 'italic',
      }).setOrigin(0, 0);
      this.detailPanel.add(loreTxt);
      // Retracer le fond lore avec la vraie hauteur
      loreG.clear();
      loreG.fillStyle(0x0a0a18, 0.5);
      loreG.fillRect(detailX - 4, curY - 4, detailW + 8, loreTxt.height + 10);
      curY += loreTxt.height + 18;
    } else {
      const loreHint = this.add.text(detailX, curY, '[ Lore débloqué après le premier kill ]', {
        ...pxStyle(6, UI.TXT_HINT),
        fontStyle: 'italic',
      }).setOrigin(0, 0);
      this.detailPanel.add(loreHint);
      curY += 20;
    }

    // Séparateur drops
    const sepG2 = this.add.graphics();
    sepG2.lineStyle(1, UI.BORDER_LIT, 0.3);
    sepG2.beginPath(); sepG2.moveTo(detailX, curY); sepG2.lineTo(detailX + detailW, curY); sepG2.strokePath();
    this.detailPanel.add(sepG2);
    curY += 10;

    // Titre section drops
    const dropTitle = this.add.text(detailX, curY, 'BUTINS', pxStyle(7, UI.TXT_GOLD)).setOrigin(0, 0);
    this.detailPanel.add(dropTitle);
    curY += 16;

    if (entry.drops.length === 0) {
      const noDrops = this.add.text(detailX, curY, 'Aucun butin connu.', pxStyle(6, UI.TXT_MUTED)).setOrigin(0, 0);
      this.detailPanel.add(noDrops);
    } else {
      for (const drop of entry.drops) {
        if (curY > H - 40) break; // eviter de sortir de l'écran

        const isRevealed = !drop.isHidden || BestiarySystem.isDropRevealed(this.world, entry.enemyId, drop.itemId);

        // Puce
        const dotG = this.add.graphics();
        dotG.fillStyle(isRevealed ? UI.CORNER : 0x333333, 1);
        dotG.fillCircle(detailX + 4, curY + 6, 3);
        this.detailPanel.add(dotG);

        // Nom de l'item (ou ???)
        const itemName = isRevealed ? drop.itemId : '???';
        const itemCol  = isRevealed ? UI.TXT_PARCHMENT : UI.TXT_MUTED;
        const itemTxt  = this.add.text(detailX + 14, curY, itemName, pxStyle(6, itemCol)).setOrigin(0, 0);
        this.detailPanel.add(itemTxt);

        // Taux de drop
        const rateTxt = this.add.text(detailX + detailW, curY, `${drop.dropRatePct}%`, pxStyle(6, UI.TXT_MUTED)).setOrigin(1, 0);
        this.detailPanel.add(rateTxt);

        curY += 14;
      }
    }
  }

  // ── Fermeture ────────────────────────────────────────────────

  private close() {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.stop();
      // Relancer PauseScene si elle est pausée (elle se met en pause lors du launch de BestiaryScene)
      if (this.scene.isPaused('PauseScene')) {
        this.scene.resume('PauseScene');
      }
    });
  }

  shutdown() {
    if (this.keyUp)   this.input.keyboard?.removeKey(this.keyUp);
    if (this.keyDown) this.input.keyboard?.removeKey(this.keyDown);
    if (this.keyEsc)  this.input.keyboard?.removeKey(this.keyEsc);
  }
}
