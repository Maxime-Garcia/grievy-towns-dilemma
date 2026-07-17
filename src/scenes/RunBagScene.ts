import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { Consumable, ElementType, Item, ItemType, RARITY_COLORS, RunBagSlot } from '../types';
import { LootSystem } from '../systems/LootSystem';
import { RunSystem } from '../systems/RunSystem';
import { RunBagSystem } from '../systems/RunBagSystem';
import { InventorySystem } from '../systems/InventorySystem';
import {
  UI, TYPE, drawGlowPanel, drawCard, drawSlot, uiStyle, titleStyle,
  addCloseButton, openScreenTransition, closeScreenTransition,
} from '../utils/UITheme';

// Écran de sac de run (RunSystem, docs/design/ROGUELITE_POC.md §3) — UNE seule
// scène pour les trois moments qui utilisent la même mécanique de fond (choisir
// quoi emporter/garder/consommer dans un nombre fixe d'emplacements) :
//
// 'pack'    (avant de descendre) : choisir 3-4 consommables dans la banque.
// 'view'    (touche Inventaire pendant une run) : consulter/consommer le sac de
//            run en cours — remplace InventoryScene (la banque de GT) tant
//            qu'une run est active, cf. GameScene.inventoryKey.
// 'extract' (après le boss)      : arbitrer les 4 emplacements sûrs du sac 20/4,
//                                   puis S'exfiltrer ou Continuer.
//
// Volontairement simple visuellement pour cette tranche (pas d'icônes, cartes
// texte) — la polish complète de "l'inventaire intra-run" est son propre lot
// (feat/roguelite-ui, cf. HANDOFF.md). Le patron overlay (scene.launch +
// setPaused + openScreenTransition/closeScreenTransition + close() guardé) est
// le même que PityScene/InventoryScene.

const MAX_LOADOUT = 4;
const ROW_H = 40;
const SLOT = 56;
const SLOT_GAP = 10;

type RunBagMode = 'pack' | 'view' | 'extract';

export class RunBagScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private mode!: RunBagMode;
  private closing = false;
  private dynamicObjs: Phaser.GameObjects.GameObject[] = [];

  // mode 'pack' — sélection en cours, retirée de la banque seulement à la confirmation.
  private loadout: (Item | null)[] = [];

  // mode 'extract'/'view' — slot actuellement sélectionné pour un échange.
  private selected: { kind: 'safe' | 'ordinary'; index: number } | null = null;

  constructor() { super({ key: 'RunBagScene' }); }

  /** Lu par GameScene (touche Inventaire) pour décider si un re-toggle peut
   *  fermer cette scène : 'view' est un simple consultatif (peut se fermer),
   *  'pack'/'extract' sont des choix BLOQUANTS (packing avant descente, boss
   *  vaincu) — les fermer via une touche annexe perdrait la décision en cours
   *  (trouvé en revue de code : la touche Inventaire fermait l'écran
   *  d'extraction post-boss sans que le joueur ait choisi Exfiltrer/Continuer,
   *  softlock permanent — aucun autre point du code ne rouvre cet écran). */
  public get currentMode(): RunBagMode { return this.mode; }

  init(data: { gameScene: GameScene; mode: RunBagMode }) {
    this.gameScene = data.gameScene;
    this.mode = data.mode;
    this.closing = false;
    this.dynamicObjs = [];
    this.loadout = new Array(MAX_LOADOUT).fill(null);
    this.selected = null;
  }

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    openScreenTransition(this);
    this.refresh();
  }

  private refresh(): void {
    this.clearDynamic();
    if (this.mode === 'pack') this.renderPack();
    else this.renderBagGrid();
  }

  private clearDynamic(): void {
    for (const go of this.dynamicObjs) if (go.active) go.destroy();
    this.dynamicObjs = [];
  }

  private track<T extends Phaser.GameObjects.GameObject>(go: T): T {
    this.dynamicObjs.push(go);
    return go;
  }

  // ── MODE PACK ────────────────────────────────────────────────

  private renderPack() {
    const { width: W, height: H } = this.cameras.main;
    const player = this.gameScene.gameState.player;

    this.track(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88));
    const PANEL_W = 640, PANEL_H = 460;
    const px = (W - PANEL_W) / 2, py = (H - PANEL_H) / 2;
    const frame = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
    drawGlowPanel(frame, px, py, PANEL_W, PANEL_H, UI.ACCENT_ARCANE, UI.BG_DEEP, 8, 0.95);

    this.track(this.add.text(W / 2, py + 16, 'PRÉPARER LA DESCENTE', titleStyle(UI.TXT_GOLD, { stroke: true })).setOrigin(0.5, 0));
    const closeBtn = addCloseButton(this, px + PANEL_W - 24, py + 24, () => this.close());
    this.track(closeBtn.glyph); this.track(closeBtn.hit);

    // Colonne gauche — consommables de la banque, non déjà pris dans le sac emporté.
    const listX = px + 24, listY = py + 76, listW = 300, listH = PANEL_H - 150;
    this.track(this.add.text(listX, listY - 20, 'Banque — consommables', uiStyle(TYPE.LABEL, UI.TXT_CYAN, { wordWrapWidth: listW })).setOrigin(0, 0));

    const consumables = player.inventory.filter(s => s.item.type === ItemType.CONSUMABLE);
    let rowY = listY;
    if (consumables.length === 0) {
      this.track(this.add.text(listX, rowY + 8, 'Aucun consommable dans la banque.',
        uiStyle(TYPE.SMALL, UI.TXT_MUTED, { wordWrapWidth: listW })).setOrigin(0, 0));
    }
    for (const slot of consumables) {
      const alreadyTaken = this.loadout.filter(l => l?.id === slot.item.id).length;
      const remaining = slot.quantity - alreadyTaken;
      if (remaining <= 0) continue;
      if (rowY + ROW_H > listY + listH) break; // pas de scroll pour cette tranche — peu de types de consommables en jeu aujourd'hui

      const rowG = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
      const color = parseInt((RARITY_COLORS[slot.item.rarity] ?? '#888888').slice(1), 16);
      drawCard(rowG, listX, rowY, listW, ROW_H - 6, { accent: color, radius: 4 });
      this.track(this.add.text(listX + 12, rowY + (ROW_H - 6) / 2, `${slot.item.name}  ×${remaining}`,
        uiStyle(TYPE.BODY, UI.TXT_PARCHMENT, { wordWrapWidth: listW - 20 })).setOrigin(0, 0.5));
      const hit = this.track(this.add.rectangle(listX + listW / 2, rowY + (ROW_H - 6) / 2, listW, ROW_H - 6, 0, 0)
        .setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Rectangle;
      hit.on('pointerdown', () => {
        if (this.addToLoadout(slot.item)) this.refresh();
      });
      rowY += ROW_H;
    }

    // Colonne droite — sac emporté (MAX_LOADOUT slots).
    const slotsColW = SLOT * 2 + SLOT_GAP;
    const slotsX = px + PANEL_W - 24 - slotsColW;
    const slotsY = py + 84;
    this.track(this.add.text(slotsX + slotsColW / 2, slotsY - 24, `Sac emporté\n(${MAX_LOADOUT} max)`,
      uiStyle(TYPE.SMALL, UI.TXT_CYAN, { align: 'center', wordWrapWidth: slotsColW + 40 })).setOrigin(0.5, 1));
    for (let i = 0; i < MAX_LOADOUT; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const sx = slotsX + col * (SLOT + SLOT_GAP);
      const sy = slotsY + row * (SLOT + SLOT_GAP);
      const item = this.loadout[i];
      const g = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
      const color = item ? parseInt((RARITY_COLORS[item.rarity] ?? '#888888').slice(1), 16) : UI.SLOT_BORDER;
      drawSlot(g, sx, sy, SLOT, color, { occupied: !!item });
      if (item) {
        this.track(this.add.text(sx + SLOT / 2, sy + SLOT / 2, item.name.slice(0, 8),
          uiStyle(TYPE.SMALL, UI.TXT_PARCHMENT, { align: 'center', wordWrapWidth: SLOT - 6 })).setOrigin(0.5));
      }
      const hit = this.track(this.add.rectangle(sx + SLOT / 2, sy + SLOT / 2, SLOT, SLOT, 0, 0)
        .setInteractive({ useHandCursor: !!item })) as Phaser.GameObjects.Rectangle;
      hit.on('pointerdown', () => {
        if (this.loadout[i]) { this.loadout[i] = null; this.refresh(); }
      });
    }

    // Bouton Descendre
    const btnY = py + PANEL_H - 36;
    const btnG = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
    drawCard(btnG, W / 2 - 100, btnY - 18, 200, 36, { accent: parseInt(UI.TXT_GOLD.slice(1), 16), radius: 6 });
    this.track(this.add.text(W / 2, btnY, 'DESCENDRE', uiStyle(TYPE.BODY, UI.TXT_GOLD, { bold: true })).setOrigin(0.5));
    const btnHit = this.track(this.add.rectangle(W / 2, btnY, 200, 36, 0, 0)
      .setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Rectangle;
    btnHit.on('pointerdown', () => this.confirmDescend());
  }

  /** Renvoie false (et laisse la banque intacte) si le sac emporté est déjà plein. */
  private addToLoadout(item: Item): boolean {
    const freeIdx = this.loadout.findIndex(l => l === null);
    if (freeIdx === -1) {
      this.events.emit('show_notification', 'Sac emporté plein (4 max)');
      return false;
    }
    this.loadout[freeIdx] = item;
    return true;
  }

  private confirmDescend() {
    // closeScreenTransition() ne désactive pas l'input pendant son animation (~170ms) —
    // sans cette garde, un double-clic rapide re-déduit les consommables choisis de
    // la banque une seconde fois (trouvé en revue de code).
    if (this.closing) return;
    const player = this.gameScene.gameState.player;
    const chosen = this.loadout.filter((i): i is Item => i !== null);
    // Retire réellement les consommables choisis de la banque — jusqu'ici ils n'ont
    // fait qu'être RÉSERVÉS visuellement (cf. addToLoadout), la banque n'a pas bougé.
    for (const item of chosen) {
      LootSystem.removeFromInventory(player, item.id, 1);
    }
    // Biome pilote unique de cette tranche (docs/design/ROGUELITE_POC.md — "UNE
    // seule zone, un seul élément" avant généralisation) : Feu/Ignis Reach.
    const run = RunSystem.startRun(player, ElementType.FIRE, chosen);
    this.gameScene.gameState.run = run;
    this.close();
    this.gameScene.travelToZone('ignis_reach', 0, 0);
  }

  // ── MODE VIEW / EXTRACT (même grille, cadrage différent) ─────

  private renderBagGrid() {
    const { width: W, height: H } = this.cameras.main;
    const run = this.gameScene.gameState.run;
    if (!run) { this.close(); return; }

    const isExtract = this.mode === 'extract';
    this.track(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88));
    const PANEL_W = 620, PANEL_H = isExtract ? 520 : 480;
    const px = (W - PANEL_W) / 2, py = (H - PANEL_H) / 2;
    const frame = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
    drawGlowPanel(frame, px, py, PANEL_W, PANEL_H, parseInt(UI.TXT_GOLD.slice(1), 16), UI.BG_DEEP, 8, 0.95);

    const title = isExtract ? 'BOSS VAINCU' : 'SAC DE RUN';
    this.track(this.add.text(W / 2, py + 16, title, titleStyle(UI.TXT_GOLD, { stroke: true })).setOrigin(0.5, 0));
    const subtitle = isExtract
      ? `${run.safeBag.filter(s => s).length}/${run.safeBag.length} emplacements sûrs remplis — le reste est perdu à l'exfiltration`
      : 'Clique un consommable pour le boire. Clique un objet puis un emplacement sûr pour le protéger.';
    this.track(this.add.text(W / 2, py + 44, subtitle,
      uiStyle(TYPE.SMALL, UI.TXT_MUTED, { align: 'center', wordWrapWidth: PANEL_W - 48 })).setOrigin(0.5, 0));
    if (!isExtract) {
      const closeBtn = addCloseButton(this, px + PANEL_W - 24, py + 24, () => this.close());
      this.track(closeBtn.glyph); this.track(closeBtn.hit);
    }

    const cols = 5;
    const gridX = px + (PANEL_W - (cols * (SLOT + SLOT_GAP) - SLOT_GAP)) / 2;
    const safeY = py + (isExtract ? 84 : 96);
    const ordinaryY = safeY + SLOT + SLOT_GAP + 28;

    this.track(this.add.text(gridX, safeY - 18, 'SÛRS', uiStyle(TYPE.SMALL, UI.TXT_GOLD, { bold: true })));
    for (let i = 0; i < run.safeBag.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      this.renderBagSlot('safe', i, gridX + col * (SLOT + SLOT_GAP), safeY + row * (SLOT + SLOT_GAP), run.safeBag[i]);
    }
    this.track(this.add.text(gridX, ordinaryY - 18, isExtract ? 'ORDINAIRES (perdus)' : 'ORDINAIRES',
      uiStyle(TYPE.SMALL, UI.TXT_MUTED)));
    for (let i = 0; i < run.ordinaryBag.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      this.renderBagSlot('ordinary', i, gridX + col * (SLOT + SLOT_GAP), ordinaryY + row * (SLOT + SLOT_GAP), run.ordinaryBag[i]);
    }

    if (isExtract) {
      const btnY = py + PANEL_H - 36;
      this.renderChoiceButton(W / 2 - 110, btnY, "S'EXFILTRER", UI.TXT_GOLD, () => this.confirmExfiltrate());
      this.renderChoiceButton(W / 2 + 110, btnY, 'CONTINUER', UI.TXT_RED, () => this.confirmContinue());
    }
  }

  private renderBagSlot(kind: 'safe' | 'ordinary', index: number, x: number, y: number, slot: RunBagSlot | null) {
    const isSelected = this.selected?.kind === kind && this.selected.index === index;
    const g = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
    const baseColor = kind === 'safe' ? parseInt(UI.TXT_GOLD.slice(1), 16) : UI.SLOT_BORDER;
    const color = slot ? parseInt((RARITY_COLORS[slot.item.rarity] ?? '#888888').slice(1), 16) : baseColor;
    drawSlot(g, x, y, SLOT, isSelected ? 0xffffff : color, { occupied: !!slot, borderAlpha: isSelected ? 1 : undefined });
    if (slot) {
      const label = slot.quantity > 1 ? `${slot.item.name.slice(0, 7)} ×${slot.quantity}` : slot.item.name.slice(0, 8);
      this.track(this.add.text(x + SLOT / 2, y + SLOT / 2, label,
        uiStyle(TYPE.SMALL, UI.TXT_PARCHMENT, { align: 'center', wordWrapWidth: SLOT - 6 })).setOrigin(0.5));
    }
    const hit = this.track(this.add.rectangle(x + SLOT / 2, y + SLOT / 2, SLOT, SLOT, 0, 0)
      .setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Rectangle;
    hit.on('pointerdown', () => this.onBagSlotClicked(kind, index));
  }

  private onBagSlotClicked(kind: 'safe' | 'ordinary', index: number) {
    const run = this.gameScene.gameState.run;
    if (!run) return;
    const bag = kind === 'safe' ? run.safeBag : run.ordinaryBag;

    if (!this.selected) {
      const slot = bag[index];
      if (!slot) return; // rien à sélectionner sur un slot vide
      // Consommer directement au premier clic sur un consommable — cf. spec
      // "clique pour boire". Rearranger un consommable reste possible via un
      // second clic si un AUTRE slot est déjà sélectionné (branche plus bas).
      if (slot.item.type === ItemType.CONSUMABLE) {
        this.consumeItem(kind, index);
        return;
      }
      this.selected = { kind, index };
      this.refresh();
      return;
    }

    if (this.selected.kind === kind && this.selected.index === index) {
      this.selected = null; // re-clic sur le même slot = désélection
      this.refresh();
      return;
    }

    if (this.selected.kind !== kind) {
      // Échange entre sûr et ordinaire — les deux sens sont symétriques.
      if (this.selected.kind === 'ordinary') RunBagSystem.moveToSafe(run, this.selected.index, index);
      else RunBagSystem.moveToOrdinary(run, this.selected.index, index);
    } else {
      // Deux slots du même bag — simple échange de contenu.
      const tmp = bag[index];
      bag[index] = bag[this.selected.index];
      bag[this.selected.index] = tmp;
    }
    this.selected = null;
    this.refresh();
  }

  /**
   * Consomme UN exemplaire du consommable au slot donné. Gère uniquement les
   * effets numériques directs (hpRestore/hpPercent/manaRestore/manaPercent) —
   * buffStat/revive/statusCure ne sont pas encore appliqués nulle part dans le
   * jeu (gap préexistant, comme l'équipement de sorts actifs) ; notifie plutôt
   * que d'ignorer silencieusement un effet non pris en charge.
   */
  private consumeItem(kind: 'safe' | 'ordinary', index: number) {
    const run = this.gameScene.gameState.run;
    if (!run) return;
    const bag = kind === 'safe' ? run.safeBag : run.ordinaryBag;
    const slot = bag[index];
    if (!slot || slot.item.type !== ItemType.CONSUMABLE) return;

    const player = this.gameScene.gameState.player;
    const effect = (slot.item as Consumable).effect;
    // Même logique que la banque (InventorySystem.useConsumable) — seul le
    // retrait diffère (slot du sac de run ici, LootSystem côté banque).
    const applied = InventorySystem.applyConsumableEffect(player, effect, this.gameScene.getPlayerModifiers());
    if (!applied) {
      this.events.emit('show_notification', 'Effet de cet objet pas encore pris en charge en run.');
      return;
    }
    this.gameScene.events.emit('player_update', player);
    slot.quantity--;
    if (slot.quantity <= 0) bag[index] = null;
    this.refresh();
  }

  private renderChoiceButton(cx: number, y: number, label: string, color: string, onClick: () => void) {
    const w = 190, h = 40;
    const g = this.track(this.add.graphics()) as Phaser.GameObjects.Graphics;
    drawCard(g, cx - w / 2, y - h / 2, w, h, { accent: parseInt(color.slice(1), 16), radius: 6 });
    this.track(this.add.text(cx, y, label, uiStyle(TYPE.BODY, color, { bold: true })).setOrigin(0.5));
    const hit = this.track(this.add.rectangle(cx, y, w, h, 0, 0).setInteractive({ useHandCursor: true })) as Phaser.GameObjects.Rectangle;
    hit.on('pointerdown', onClick);
  }

  private confirmExfiltrate() {
    if (this.closing) return;
    const player = this.gameScene.gameState.player;
    const run = this.gameScene.gameState.run;
    if (!run) return;
    const failed = RunSystem.exfiltrate(player, run, this.gameScene.gameState.world);
    if (failed.length > 0) {
      this.events.emit('show_notification', `Banque pleine — ${failed.length} objet(s) restent dans le sac de run`);
      this.refresh();
      return;
    }
    this.gameScene.gameState.run = null;
    this.close();
    this.gameScene.travelToZone('grievy_town', 0, 0);
  }

  private confirmContinue() {
    if (this.closing) return;
    const run = this.gameScene.gameState.run;
    if (!run) return;
    RunSystem.continueRun(run);
    this.close();
    this.gameScene.travelToZone('ignis_reach', 0, 0);
  }

  public close(): void {
    if (this.closing) return;
    this.closing = true;
    closeScreenTransition(this, () => { this.scene.stop(); });
  }

  shutdown() {
    this.gameScene?.setPaused(false);
  }
}
