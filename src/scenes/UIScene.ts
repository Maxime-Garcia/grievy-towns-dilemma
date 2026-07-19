import { PlayerState, Item, ItemRarity, RARITY_COLORS } from '../types';
import { GameScene } from './GameScene';
import { SKILL_MAP } from '../data/skills';
import { UI, drawGlowPanel, drawSlot, drawBar, addUiFrame, uiStyle, resonanceColor, TYPE, fitText, formatResonanceLine } from '../utils/UITheme';
import { StatRollSystem } from '../systems/StatRollSystem';
import { PITY_THRESHOLDS } from '../systems/LootSystem';
import { t, localizeItem, localizeSkill } from '../i18n';

const BAR_W = 210;
const HP_H  = 16;
const MP_H  = 11;
const BAR_X = 42;

// Barre de sorts retirée temporairement du HUD (demande utilisateur 2026-07-08) —
// on verra plus tard comment on organise ça. Repasser à true pour la réafficher.
const SHOW_SKILL_BAR = false;

/**
 * Entrée de la file de notifications — enrichie pour les drops à Résonance
 * (docs/design/LOOT_STAT_ROLLS.md §7.2). Les champs optionnels ont les
 * défauts historiques : glow SEPARATOR, 2500 ms, pas de scintillement.
 */
interface NotifEntry {
  msg: string;
  /** Couleur du texte (pour un drop d'item : toujours la couleur de rareté). */
  color: string;
  /** Couleur d'accent du panneau drawGlowPanel (défaut : UI.SEPARATOR). */
  glow?: number;
  /** Durée d'affichage en ms (défaut : 2500). */
  duration?: number;
  /** Résonance Parfaite : pulse doré borné du panneau + micro-scale du texte. */
  shimmer?: boolean;
}

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;

  private hpBar!: Phaser.GameObjects.Graphics;
  private manaBar!: Phaser.GameObjects.Graphics;
  private hpText!: Phaser.GameObjects.Text;
  private manaText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Graphics;
  private playerNameText!: Phaser.GameObjects.Text;
  /** Largeur max du nom du joueur (px) — calculee dans create(), appliquee via fitText. */
  private nameMaxW = 160;
  /** Style du nom, conserve pour que fitText mesure avec EXACTEMENT la meme police. */
  private nameStyle!: Phaser.Types.GameObjects.Text.TextStyle;
  /** Dernier nom BRUT passe a fitText — evite de le recalculer a chaque frame. */
  private lastRawName = '';

  private HP_Y!: number;
  private MP_Y!: number;

  private skillSlots: Phaser.GameObjects.Image[]          = [];
  private skillCdOverlays: Phaser.GameObjects.Graphics[]  = [];
  private skillCdTexts: Phaser.GameObjects.Text[]         = [];

  private notifQueue: NotifEntry[] = [];
  private notifText!: Phaser.GameObjects.Text;
  private notifBg!: Phaser.GameObjects.Graphics;
  private notifTimer = 0;
  /** Tweens du scintillement « Parfaite » en cours — tués avant tout fade/notif suivante. */
  private notifShimmerTweens: Phaser.Tweens.Tween[] = [];

  private zoneText!: Phaser.GameObjects.Text;
  private zoneBg!: Phaser.GameObjects.Graphics;

  // ── Chip HUD Pity (PITY/PITY.md) — 3 lignes (Épique/Légendaire/Mythique),
  // chacune un losange coloré + le nombre restant. Aucun texte (retour créateur
  // 16/07, 2e passe : "pas de texte", losange + nombre suffisent, une ligne par
  // rareté plutôt qu'un résumé de la plus proche).
  private pityChipBg!: Phaser.GameObjects.Graphics;
  private pityChipDiamonds: Phaser.GameObjects.Graphics[] = [];
  private pityChipTexts: Phaser.GameObjects.Text[] = [];
  private pityChipX = 0;
  private pityChipY = 0;
  private pityChipW = 0;
  private pityChipH = 0;
  /** Dernière valeur affichée par rareté (index = DISPLAY_ORDER) — évite un
   *  setText()/redraw par frame sur une ligne dont rien n'a changé. */
  private lastPityRemaining: number[] = [-1, -1, -1];

  // ── Combo HUD (pips sous le joueur — COMBO_TALENT_SPEC.md §2.3 / §6.2) ──
  private comboPips!: Phaser.GameObjects.Container;
  private comboMaxPips = 0;
  private comboCurrentCount = 0;
  private pipObjects: Phaser.GameObjects.Graphics[] = [];
  private pipTween: Phaser.Tweens.Tween | null = null;
  private comboShownAt = 0;
  private comboFading = false;

  private lerpHp          = 1;
  private lerpMp          = 1;
  /** Traîne "drain retardé" : suit le ratio HP réel avec du retard (lerp 6/s). */
  private hpBarDelayed    = 1.0;
  private targetHp        = 1;
  private targetMp        = 1;
  private barsInitialized = false;
  private cachedMaxHp     = 1;
  private cachedMaxMp     = 1;
  private cachedHpInt     = 1;
  private cachedMpInt     = 1;

  constructor() { super({ key: 'UIScene' }); }

  init(data: { gameScene: GameScene }) {
    this.gameScene      = data.gameScene;
    this.barsInitialized = false;
  }

  create() {
    // Phaser n'appelle PAS scene.shutdown() de lui-même : Systems.shutdown() se
    // contente d'ÉMETTRE l'événement SHUTDOWN. Sans cette ligne, la méthode
    // shutdown() ci-dessous est du CODE MORT — les listeners qu'elle est censée
    // retirer survivent à la scène, et chaque create() en empile une couche de plus.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    const { width: W, height: H } = this.cameras.main;

    // ── DEV: build badge (top-left) — retirer avant release ─────────
    // Version discrète : petite pastille verte + texte 9px (plancher TYPE.SMALL)
    // sur fond translucide. Exclue volontairement de la règle "toujours uiStyle()" :
    // c'est un badge de debug monospace (lisibilité console), pas un texte de jeu —
    // uiStyle() impose FONT_UI (Verdana), incompatible avec l'esthétique recherchée ici.
    // Seul le NOM de la feature est écrit ici. Le hash est injecté au build par
    // Vite (__BUILD_HASH__, cf. vite.config.ts) : l'écrire à la main était voué
    // à mentir, puisqu'un hash n'existe qu'une fois le commit fait — et l'écrire
    // dans le code refait le commit.
    const BUILD_LABEL = `EQUIP: double-clic paperdoll deseq. (comme sac) (${__BUILD_HASH__})`;
    const badgePad = 6;
    const badgeText = this.add.text(badgePad + 10, badgePad + 3, BUILD_LABEL, {
      fontSize: '9px', color: '#7dffa8', fontFamily: 'monospace',
    }).setDepth(200).setAlpha(0.85);
    const bw = badgeText.width + 16;
    const bh = badgeText.height + 6;
    this.add.rectangle(badgePad, badgePad, bw, bh, 0x02160a, 0.75)
      .setOrigin(0, 0).setDepth(199);
    this.add.rectangle(badgePad, badgePad, 3, bh, 0x00cc55, 1)
      .setOrigin(0, 0).setDepth(199);
    badgeText.setPosition(badgePad + 10, badgePad + 3);

    // ── Player stat panel (top-left, sous le badge de build) ─────────
    // Le panneau est reconstruit sur une BANDE DE TITRE dimensionnée pour le texte
    // réel. Avant : le nom démarrait à PANEL_TOP+5 et, rendu en 14 px, descendait
    // jusqu'à +24 — alors que la barre HP commençait à +22. Le nom mordait la barre.
    // Le budget de la bande n'était que de 17 px pour un texte qui en fait 18.
    const TITLE_BAND = 24;                 // nom + niveau (14 px) + respiration
    const BAR_GAP    = 6;
    const PANEL_H    = TITLE_BAND + HP_H + BAR_GAP + MP_H + 12;
    const PANEL_W    = BAR_X + BAR_W + 12;
    // Ancré juste SOUS le badge de build DEV (jamais par-dessus : règle CLAUDE.md,
    // le badge identifie la build en cours). Dérivé de la hauteur RÉELLE du badge
    // (badgePad + bh) et non d'une valeur en dur : le jour où le badge disparaît
    // en prod (bh = 0 si on le retire), le panneau remonte tout seul à y = 10
    // au lieu de laisser un trou.
    const PANEL_TOP  = badgePad + bh + 4;
    this.HP_Y = PANEL_TOP + TITLE_BAND;
    this.MP_Y = this.HP_Y + HP_H + BAR_GAP;
    // Largeur disponible pour le nom : tout ce qui reste à gauche du « Nv.XX ».
    // Mesurée, pas devinée — c'est ce qui manquait (aucun clamp : un nom de 16
    // caractères, le maximum autorisé par NameInputScene, entrait dans le niveau).
    this.nameMaxW = PANEL_W - 10 - 44;

    // Glow panel : accent vert (vie) sur le cadre, ticks colorés par barre
    const panelGfx = this.add.graphics();
    drawGlowPanel(panelGfx, 4, PANEL_TOP, PANEL_W, PANEL_H, UI.HP_GREEN, UI.BG_MID, 4);
    // Tick d'accent vertical devant chaque barre (vert = HP, bleu = MP)
    panelGfx.fillStyle(UI.HP_GREEN, 0.8);
    panelGfx.fillRect(BAR_X - 5, this.HP_Y, 2, HP_H);
    panelGfx.fillStyle(UI.MP_FILL, 0.8);
    panelGfx.fillRect(BAR_X - 5, this.MP_Y, 2, MP_H);

    // Label badges HP / MP
    this.add.text(10, this.HP_Y + 3, t('ui.hp'), uiStyle(10, UI.TXT_GREEN, { bold: true }));
    this.add.text(10, this.MP_Y + 1, t('ui.mp'), uiStyle(10, UI.TXT_BLUE, { bold: true }));

    // Player name (top of panel) — tronqué à la largeur réelle dans updateStats()
    this.nameStyle = uiStyle(TYPE.BODY, UI.TXT_GOLD, { bold: true });
    this.playerNameText = this.add.text(10, PANEL_TOP + 4, '', this.nameStyle);

    // Level (top-right of panel)
    this.levelText = this.add.text(PANEL_W - 4, PANEL_TOP + 5, '', uiStyle(TYPE.SMALL, UI.TXT_PARCHMENT))
      .setOrigin(1, 0);

    // HP bar + centred text
    this.hpBar  = this.add.graphics();
    this.hpText = this.add.text(BAR_X + BAR_W / 2, this.HP_Y + HP_H / 2, '',
      uiStyle(10, UI.TXT_WHITE, { bold: true, stroke: true }),
    ).setOrigin(0.5).setDepth(1);

    // MP bar + centred text
    this.manaBar  = this.add.graphics();
    this.manaText = this.add.text(BAR_X + BAR_W / 2, this.MP_Y + MP_H / 2, '',
      uiStyle(9, UI.TXT_WHITE, { bold: true, stroke: true }),
    ).setOrigin(0.5).setDepth(1);

    // ── Chip Pity v3 (à droite du panneau stats) ────
    // Pilule discrète en permanence à l'écran (demande explicite du créateur :
    // « affiche le restant », pas seulement sur demande) — le détail complet vit
    // dans PityScene, ouverte par tap ou par la touche 'pity' (rebindable).
    // Redesign 16/07, 2e passe (retour créateur sur le v2 texte+jauge : "pas
    // lisible, pas de texte, 3 lignes pour les 3 raretés") — 3 lignes fixes
    // (Épique/Légendaire/Mythique, toujours dans cet ordre), chacune un losange
    // de la couleur de rareté + le nombre restant, zéro texte.
    const CHIP_ROW_H = 16;
    const CHIP_GAP   = 2;
    const CHIP_PAD   = 6;
    // 66 → 72 : "1000" (seuil MYTHIC, visible dès le tout début de partie et à
    // chaque reset du compteur — pas un cas limite rare) mesure ~44px en
    // Minimal 10px, débordait des 40px dispo entre le texte (x+26) et le bord
    // du chip à 66px. Un chiffre tronqué serait pire qu'un chip 6px plus large
    // (trouvé en review, mesure des glyphes réels du .ttf).
    const CHIP_W = 72;
    const CHIP_H = CHIP_PAD * 2 + 3 * CHIP_ROW_H + 2 * CHIP_GAP;
    const CHIP_X = PANEL_W + 12;
    const CHIP_Y = PANEL_TOP + PANEL_H / 2 - CHIP_H / 2;
    this.pityChipX = CHIP_X;
    this.pityChipY = CHIP_Y;
    this.pityChipW = CHIP_W;
    this.pityChipH = CHIP_H;
    this.pityChipBg = this.add.graphics();
    drawGlowPanel(this.pityChipBg, CHIP_X, CHIP_Y, CHIP_W, CHIP_H, UI.ACCENT_ARCANE, UI.BTN_BG, 8, 0.92);
    this.pityChipDiamonds = [];
    this.pityChipTexts = [];
    for (let i = 0; i < 3; i++) {
      const rowY = CHIP_Y + CHIP_PAD + i * (CHIP_ROW_H + CHIP_GAP) + CHIP_ROW_H / 2;
      const diamond = this.add.graphics();
      diamond.fillStyle(0x888888, 1);
      diamond.fillRect(-4, -4, 8, 8);
      diamond.setRotation(Math.PI / 4).setPosition(CHIP_X + 14, rowY);
      this.pityChipDiamonds.push(diamond);
      const txt = this.add.text(CHIP_X + 26, rowY, '—',
        uiStyle(TYPE.SMALL, UI.TXT_PARCHMENT, { bold: true }),
      ).setOrigin(0, 0.5);
      this.pityChipTexts.push(txt);
    }
    const chipHit = this.add.rectangle(
      CHIP_X + CHIP_W / 2, CHIP_Y + CHIP_H / 2, CHIP_W + 4, CHIP_H + 10, 0, 0,
    ).setInteractive({ useHandCursor: true }).setDepth(6);
    chipHit.on('pointerdown', () => {
      this.pityChipBg.setAlpha(0.6);
      this.tweens.add({ targets: this.pityChipBg, alpha: 1, duration: 150 });
      this.game.events.emit('mobile_action', 'pity');
    });

    // ── XP bar (bottom strip) ────────────────────
    this.xpBar = this.add.graphics();

    // ── Skill slots (centered bottom) — retirée temporairement (retour prévu
    // une fois qu'on aura décidé de l'organisation finale de la barre de sorts) ──
    // SLOT_SZ ≥ 52 so the touch hit zone meets the 44px accessibility minimum.
    const SLOT_SZ  = 52;
    const SLOT_GAP = 5;
    const TOTAL_W  = 4 * SLOT_SZ + 3 * SLOT_GAP;
    const SX_START = W / 2 - TOTAL_W / 2;
    const SY       = H - SLOT_SZ - 7;
    const keys     = ['A', 'E', 'R', 'F'];

    for (let i = 0; SHOW_SKILL_BAR && i < 4; i++) {
      const sx = SX_START + i * (SLOT_SZ + SLOT_GAP);

      const slotGfx = this.add.graphics();
      // Slot arrondi moderne (arcane fresh) — même primitive que l'inventaire
      drawSlot(slotGfx, sx, SY, SLOT_SZ, UI.SLOT_BORDER, { occupied: true, radius: 6 });
      // Cadre pixel art réel (Retro Inventory) — même asset que les slots de
      // l'inventaire (cohérence §7 guidelines) ; null si non copié, sans effet.
      addUiFrame(this, sx + SLOT_SZ / 2, SY + SLOT_SZ / 2, SLOT_SZ, SLOT_SZ);

      const icon = this.add.image(sx + SLOT_SZ / 2, SY + SLOT_SZ / 2, 'skill_dash')
        .setDisplaySize(34, 34);
      this.skillSlots.push(icon);

      const cdOverlay = this.add.graphics();
      this.skillCdOverlays.push(cdOverlay);

      // Key label badge (top-left corner of slot)
      const badge = this.add.graphics();
      badge.fillStyle(0x08080f, 0.88);
      badge.fillRect(sx + 2, SY + 2, 15, 13);
      this.add.text(sx + 9, SY + 8, keys[i], uiStyle(9, UI.TXT_GOLD, { bold: true })).setOrigin(0.5);

      const cdText = this.add.text(sx + SLOT_SZ / 2, SY + SLOT_SZ / 2, '',
        uiStyle(14, UI.TXT_WHITE, { bold: true, stroke: true }),
      ).setOrigin(0.5);
      this.skillCdTexts.push(cdText);

      // Invisible hit zone — slightly larger than visual slot for comfortable tapping.
      // Emits mobile_action so GameScene fires the same code path as the keyboard.
      const slotIdx = i;
      const hitZone = this.add.rectangle(
        sx + SLOT_SZ / 2, SY + SLOT_SZ / 2,
        SLOT_SZ + 6, SLOT_SZ + 6, 0, 0,
      ).setInteractive({ useHandCursor: true }).setDepth(5);
      hitZone.on('pointerdown', () => {
        this.game.events.emit('mobile_action', `skill${slotIdx}`);
        const ic = this.skillSlots[slotIdx];
        this.tweens.killTweensOf(ic);
        ic.setAlpha(0.6);
        this.tweens.add({
          targets: ic,
          alpha: 1,
          duration: 80,
          onComplete: () => {
            this.tweens.add({
              targets: ic,
              scaleX: 1.15, scaleY: 1.15,
              duration: 60,
              yoyo: true,
              ease: 'Back.easeOut',
            });
          },
        });
      });
    }

    // ── Nav buttons: Inventory (I) and Skills (K) — bottom-right ────────
    // Give mobile players the same access as the keyboard shortcuts.
    const NAV_W = 54;
    const NAV_H = 44;
    const NAV_Y = SY + (SLOT_SZ - NAV_H) / 2;
    const sklX  = W - 8 - NAV_W;
    const invX  = sklX - 6 - NAV_W;

    // Icônes réelles (pochette en cuir / grimoire — Rogue Adventure Item Icons) au
    // lieu du texte "INV"/"SKL" brut.
    const buildNavBtn = (bx: number, iconKey: string, action: string) => {
      const gfx = this.add.graphics();
      // Bouton nav arrondi, liseré arcane discret (structure)
      drawGlowPanel(gfx, bx, NAV_Y, NAV_W, NAV_H, UI.ACCENT_ARCANE, UI.BTN_BG, 6, 0.92);
      // Icônes non carrées (pochette/grimoire) — scale uniforme pour ne pas les
      // écraser (setDisplaySize forcerait un ratio 1:1 et les déformerait).
      const icon = this.add.image(bx + NAV_W / 2, NAV_Y + NAV_H / 2, iconKey).setDepth(6);
      icon.setScale(Math.min(26 / icon.width, 26 / icon.height));
      const flash = this.add.rectangle(
        bx + NAV_W / 2, NAV_Y + NAV_H / 2, NAV_W - 2, NAV_H - 2, 0xffffff, 0,
      ).setDepth(6);
      // Hit zone includes a 4px margin on all sides for comfortable tapping.
      const hit = this.add.rectangle(
        bx + NAV_W / 2, NAV_Y + NAV_H / 2, NAV_W + 4, NAV_H + 4, 0, 0,
      ).setInteractive({ useHandCursor: true }).setDepth(7);
      hit.on('pointerdown', () => {
        flash.setAlpha(0.25);
        this.tweens.add({ targets: flash, alpha: 0, duration: 150 });
        this.game.events.emit('mobile_action', action);
      });
    };

    buildNavBtn(invX, 'nav_inventory', 'inventory');
    buildNavBtn(sklX, 'nav_skills',    'skills');

    // ── Notification (sous le panneau stats + chip Pity) ─────────
    // Positionnée sous la bande de HUD haut-gauche (panneau + chip), PAS "au-dessus
    // des slots de compétences" comme avant : cet ancrage vivait H-SLOT_SZ-20, une
    // position basse calée sur une barre de sorts DÉSACTIVÉE (SHOW_SKILL_BAR=false)
    // — la notif atterrissait donc tout en bas de l'écran sans aucune vraie raison,
    // et chevauchait le HUD juste au-dessus d'elle (retour créateur 16/07 : "trop
    // basse, chevauche le reste"). Dérivée de PANEL_TOP/PANEL_H (le vrai bloc
    // au-dessus, pas un magic number) : suit automatiquement le panneau si sa
    // hauteur change un jour — c'est ça, être "responsive entre les éléments".
    const NOTIF_Y = PANEL_TOP + PANEL_H + 30;
    // Fond semi-opaque derrière la notif : lisible même sur zone claire.
    this.notifBg = this.add.graphics().setAlpha(0).setDepth(9);
    this.notifText = this.add.text(W / 2, NOTIF_Y, '',
      uiStyle(12, UI.TXT_PARCHMENT, { bold: true, stroke: true }),
    ).setOrigin(0.5).setAlpha(0).setDepth(10);
    // Reset explicite (scene.restart() réutilise l'instance) : les tweens de la
    // scène précédente ont été détruits avec elle, on repart sans référence morte.
    this.notifShimmerTweens = [];

    // ── Zone name (top-right) — encadré discret ───
    this.zoneBg = this.add.graphics().setAlpha(0).setDepth(4);
    this.zoneText = this.add.text(W - 18, 15, '', uiStyle(12, UI.TXT_GOLD, { bold: true }))
      .setOrigin(1, 0).setAlpha(0).setDepth(5);

    // Hint HUD permanent retiré (demande utilisateur 2026-07-08) — les indices de
    // touches sont maintenant contextuels uniquement (voir GameScene.interactHint).

    // ── Combo HUD (pips qui suivent le joueur) ────
    // Reset explicite : scene.restart() réutilise l'instance, les
    // initialiseurs de champs ne sont pas re-exécutés.
    this.comboPips = this.add.container(0, 0).setDepth(50).setAlpha(0.75).setVisible(false);
    this.pipObjects = [];
    this.pipTween = null;
    this.comboMaxPips = 0;
    this.comboCurrentCount = 0;
    this.comboShownAt = 0;
    this.comboFading = false;

    // ── Events ───────────────────────────────────
    this.gameScene.events.on('player_update',    this.onPlayerUpdate,    this);
    this.gameScene.events.on('level_up',         this.onLevelUp,         this);
    this.gameScene.events.on('item_looted',      this.onItemLooted,      this);
    this.gameScene.events.on('quest_completed',  this.onQuestCompleted,  this);
    this.gameScene.events.on('skill_unlocked',   this.onSkillUnlocked,   this);
    this.gameScene.events.on('zone_cleared',     this.onZoneCleared,     this);
    this.gameScene.events.on('zone_entered',     this.onZoneEntered,     this);
    this.gameScene.events.on('show_notification',this.onShowNotification,this);
    this.gameScene.events.on('language_changed', this.onLanguageChanged,  this);
    this.gameScene.events.on('combo-changed',           this.onComboChanged,          this);
    this.gameScene.events.on('combo-broken',            this.onComboBroken,           this);
    this.gameScene.events.on('finisher-executed',       this.onFinisherExecuted,      this);
    this.gameScene.events.on('new_creature_discovered', this.onNewCreatureDiscovered, this);
    this.gameScene.events.on('pity_paid',               this.onPityPaid,              this);
  }

  shutdown() {
    this.gameScene.events.off('player_update',           this.onPlayerUpdate,          this);
    this.gameScene.events.off('level_up',                this.onLevelUp,               this);
    this.gameScene.events.off('item_looted',             this.onItemLooted,            this);
    this.gameScene.events.off('quest_completed',         this.onQuestCompleted,        this);
    this.gameScene.events.off('skill_unlocked',          this.onSkillUnlocked,         this);
    this.gameScene.events.off('zone_cleared',            this.onZoneCleared,           this);
    this.gameScene.events.off('zone_entered',            this.onZoneEntered,           this);
    this.gameScene.events.off('show_notification',       this.onShowNotification,      this);
    this.gameScene.events.off('language_changed',        this.onLanguageChanged,       this);
    this.gameScene.events.off('combo-changed',           this.onComboChanged,          this);
    this.gameScene.events.off('combo-broken',            this.onComboBroken,           this);
    this.gameScene.events.off('finisher-executed',       this.onFinisherExecuted,      this);
    this.gameScene.events.off('new_creature_discovered', this.onNewCreatureDiscovered, this);
    this.gameScene.events.off('pity_paid',               this.onPityPaid,              this);
    this.pipTween = null;
    this.notifShimmerTweens = [];
  }

  private onLanguageChanged() {
    this.scene.restart({ gameScene: this.gameScene });
  }

  update(_t: number, delta: number) {
    this.updateComboPips();

    if (this.notifTimer > 0) {
      this.notifTimer -= delta;
      if (this.notifTimer <= 0) {
        this.stopNotifShimmer(); // évite un conflit alpha entre pulse et fade-out
        this.tweens.add({
          targets: [this.notifText, this.notifBg],
          alpha: 0,
          duration: 400,
          onComplete: () => this.showNextNotif(),
        });
      }
    }

    const dt = delta / 1000;
    const speed = 8 * dt;
    const prevHp = this.lerpHp;
    const prevMp = this.lerpMp;
    const prevDelayed = this.hpBarDelayed;
    this.lerpHp = Phaser.Math.Linear(this.lerpHp, this.targetHp, Math.min(1, speed));
    this.lerpMp = Phaser.Math.Linear(this.lerpMp, this.targetMp, Math.min(1, speed));
    // Traîne "drain retardé" : converge plus lentement (6/s) vers le ratio HP réel —
    // reste visible en orange derrière la barre verte le temps de rattraper.
    // Traîne uniquement vers le bas (drain) — snap immédiat sur soin pour éviter
    // une bande orange visible au-dessus de la barre verte.
    if (this.hpBarDelayed > this.targetHp) {
      this.hpBarDelayed = Phaser.Math.Linear(this.hpBarDelayed, this.targetHp, Math.min(1, 1.5 * dt));
      // Snap sub-pixel : évite l'orange résiduel dû au seuil de redraw ci-dessous
      if (this.hpBarDelayed - this.targetHp < 0.003) this.hpBarDelayed = this.targetHp;
    } else {
      this.hpBarDelayed = this.targetHp;
    }

    if (
      Math.abs(this.lerpHp - prevHp) > 0.0005 ||
      Math.abs(this.lerpMp - prevMp) > 0.0005 ||
      Math.abs(this.hpBarDelayed - prevDelayed) > 0.0005
    ) {
      this.drawLerpedBars();
    }
  }

  // ── Combo HUD ────────────────────────────────────
  // Losanges 4×4px sous le sprite du joueur (offset +26px), espacés de 7px.
  // Blanc cassé 0xf0e8d8 = validé, gris 0x444444 = restant, ambre 0xffb347 =
  // finisher prêt. Interdits : azur 0x66ddff, doré 0xffe066 (INSPIRATIONS.md).

  private updateComboPips() {
    if (this.comboMaxPips === 0) {
      this.comboPips.setVisible(false);
      return;
    }

    // UIScene est une scène parallèle : convertir world → screen via la caméra de GameScene
    const pos = this.gameScene.getPlayerScreenPosition();
    if (!pos) {
      this.comboPips.setVisible(false);
      return;
    }
    this.comboPips.setVisible(true);
    this.comboPips.setPosition(pos.x, pos.y + 26);

    // Fade out complet après 2s sans attaque (spec §2.3) — rien hors combat
    if (!this.comboFading && this.comboShownAt > 0 && this.time.now - this.comboShownAt > 2000) {
      this.comboFading = true;
      this.stopPipTween();
      this.tweens.add({
        targets: this.comboPips,
        alpha: 0,
        duration: 250,
        onComplete: () => this.hideComboPips(),
      });
    }
  }

  private onComboChanged({ count, max }: { count: number; max: number }) {
    if (!this.sys.isActive()) return;
    this.tweens.killTweensOf(this.comboPips);
    this.comboFading = false;
    this.comboPips.setAlpha(0.75).setVisible(true);

    const prevCount = this.comboCurrentCount;
    this.comboCurrentCount = count;
    this.comboMaxPips = max;
    this.comboShownAt = this.time.now;
    this.redrawPips();

    // Pop du pip qui vient de s'allumer : 1.0→1.4→1.0 en 120ms (spec §6.2)
    if (count > prevCount && count > 0 && count <= this.pipObjects.length) {
      const lit = this.pipObjects[count - 1];
      this.tweens.add({
        targets: lit, scaleX: 1.4, scaleY: 1.4,
        duration: 60, yoyo: true, ease: 'Back.easeOut',
      });
    }
  }

  private onComboBroken() {
    if (!this.sys.isActive() || this.comboMaxPips === 0) return;
    this.comboFading = true;
    this.stopPipTween();

    // Pips en gris — un blink, puis fade out 250ms. Échec silencieux, jamais humiliant.
    for (const g of this.pipObjects) {
      g.clear();
      g.fillStyle(0x777777, 1);
      g.fillRect(-2, -2, 4, 4);
    }
    this.tweens.killTweensOf(this.comboPips);
    this.tweens.add({
      targets: this.comboPips,
      alpha: 0.15,
      duration: 80,
      yoyo: true,
      onComplete: () => {
        this.tweens.add({
          targets: this.comboPips,
          alpha: 0,
          duration: 250,
          onComplete: () => this.hideComboPips(),
        });
      },
    });
  }

  private onFinisherExecuted(_data: { weaponType?: unknown }) {
    if (!this.sys.isActive() || this.comboMaxPips === 0) return;
    this.comboFading = true;
    this.stopPipTween();

    // Les pips éclatent en 3–4 particules ambre qui s'envolent en arc (300ms)
    const { x, y } = this.comboPips;
    const count = Phaser.Math.Between(3, 4);
    for (let i = 0; i < count; i++) {
      const p = this.add
        .circle(x + Phaser.Math.Between(-10, 10), y, 2, 0xffb347, 1)
        .setDepth(51);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-18, 18),
        y: y - Phaser.Math.Between(10, 18),
        duration: 150,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: p,
            y: y + Phaser.Math.Between(14, 22),
            alpha: 0,
            duration: 150,
            ease: 'Quad.easeIn',
            onComplete: () => p.destroy(),
          });
        },
      });
    }

    this.tweens.killTweensOf(this.comboPips);
    this.hideComboPips();
  }

  private redrawPips() {
    const max = this.comboMaxPips;

    // Reconstruire si le nombre de pips a changé (changement d'arme)
    if (this.pipObjects.length !== max) {
      this.stopPipTween();
      for (const p of this.pipObjects) p.destroy();
      this.pipObjects = [];
      for (let i = 0; i < max; i++) {
        const g = this.add.graphics();
        g.setRotation(Math.PI / 4); // carré 4×4 tourné à 45° = losange
        g.x = (i - (max - 1) / 2) * 7;
        this.comboPips.add(g);
        this.pipObjects.push(g);
      }
    }

    const finisherReady = max > 0 && this.comboCurrentCount === max - 1;
    for (let i = 0; i < max; i++) {
      const g = this.pipObjects[i];
      let color = i < this.comboCurrentCount ? 0xf0e8d8 : 0x444444;
      if (i === max - 1 && finisherReady) color = 0xffb347;
      g.clear();
      g.fillStyle(color, 1);
      g.fillRect(-2, -2, 4, 4);
    }

    // Pulsation lente du pip finisher quand le prochain coup est le finisher
    this.stopPipTween();
    if (finisherReady) {
      this.pipTween = this.tweens.add({
        targets: this.pipObjects[max - 1],
        scaleX: 1.3, scaleY: 1.3,
        duration: 400,
        yoyo: true,
        repeat: -1, // arrêté systématiquement par stopPipTween() à chaque changement d'état
      });
    }
  }

  private stopPipTween() {
    if (this.pipTween) {
      this.pipTween.stop();
      this.pipTween = null;
    }
    for (const g of this.pipObjects) g.setScale(1);
  }

  private hideComboPips() {
    this.comboMaxPips = 0;
    this.comboCurrentCount = 0;
    this.comboShownAt = 0;
    this.comboFading = false;
    this.comboPips.setVisible(false).setAlpha(0.75);
  }

  // ── Event handlers ───────────────────────────────

  private onPlayerUpdate(player: PlayerState) {
    if (!this.sys.isActive()) return;
    const { width: W, height: H } = this.cameras.main;

    // Nom tronqué à la LARGEUR RÉELLE disponible (fitText mesure en pixels), plus à un
    // nombre de caractères. Un nom de 16 lettres — le maximum autorisé à la création —
    // entrait sinon dans le « Nv.XX » ancré à droite.
    //
    // MIS EN CACHE : cette méthode est appelée à CHAQUE FRAME (GameScene.update émet
    // `player_update` sans condition), et fitText alloue un canvas + une texture GPU à
    // chaque appel. Le nom, lui, ne change jamais en cours de partie — on ne recalcule
    // que s'il a bougé.
    if (player.name !== this.lastRawName) {
      this.lastRawName = player.name;
      this.playerNameText.setText(fitText(this, player.name, this.nameStyle, this.nameMaxW));
    }
    this.levelText.setText(`${t('ui.level')}${player.level}`);

    // Chip Pity — une ligne par rareté protégée, toutes affichées en permanence
    // (retour créateur 16/07, 2e passe : "3 lignes pour les 3 raretés, pas de
    // texte"). Comparaison sur le nombre affiché par ligne, pas sur un objet :
    // évite un setText()/redraw à chaque frame quand rien n'a changé sur CETTE ligne.
    {
      const rows: [ItemRarity, number][] = [
        [ItemRarity.EPIC,      Math.max(0, (PITY_THRESHOLDS[ItemRarity.EPIC]      ?? 0) - player.killsWithoutEpic)],
        [ItemRarity.LEGENDARY, Math.max(0, (PITY_THRESHOLDS[ItemRarity.LEGENDARY] ?? 0) - player.killsWithoutLegendary)],
        [ItemRarity.MYTHIC,    Math.max(0, (PITY_THRESHOLDS[ItemRarity.MYTHIC]    ?? 0) - player.killsWithoutMythic)],
      ];
      rows.forEach(([rarity, remaining], i) => {
        if (remaining === this.lastPityRemaining[i]) return;
        this.lastPityRemaining[i] = remaining;
        const color = RARITY_COLORS[rarity] ?? '#888888';
        const colorNum = parseInt(color.slice(1), 16);
        const diamond = this.pityChipDiamonds[i];
        diamond.clear();
        diamond.fillStyle(colorNum, 1);
        diamond.fillRect(-4, -4, 8, 8);
        // "0" (pas de mot "GARANTI") + couleur pleine de la rareté : le nombre
        // à zéro dans SA couleur suffit à signaler l'état, sans texte (règle
        // stricte du 2e retour créateur).
        this.pityChipTexts[i].setText(String(remaining));
        this.pityChipTexts[i].setColor(remaining <= 0 ? color : UI.TXT_PARCHMENT);
      });
    }

    this.targetHp    = Math.max(0, player.stats.hp / player.stats.maxHp);
    this.targetMp    = Math.max(0, player.stats.mana / player.stats.maxMana);
    this.cachedMaxHp = player.stats.maxHp;
    this.cachedMaxMp = player.stats.maxMana;
    this.cachedHpInt = player.stats.hp;
    this.cachedMpInt = player.stats.mana;
    if (!this.barsInitialized) {
      this.lerpHp = this.targetHp;
      this.lerpMp = this.targetMp;
      this.hpBarDelayed = this.targetHp;
      this.barsInitialized = true;
      this.drawLerpedBars();
    }

    // XP bar (bottom 4-px strip) — no lerp needed
    const xpPct = player.xpToNext > 0 ? player.xp / player.xpToNext : 0;
    const xpFW  = Math.floor(W * Math.max(0, Math.min(1, xpPct)));
    this.xpBar.clear();
    this.xpBar.fillStyle(UI.XP_BG, 1);
    this.xpBar.fillRect(0, H - 4, W, 4);
    if (xpFW > 0) {
      // Gradient simulé : base violette + moitié basse assombrie
      // + fine bande lumineuse 1px sur le dessus.
      this.xpBar.fillStyle(UI.XP_FILL, 1);
      this.xpBar.fillRect(0, H - 4, xpFW, 4);
      this.xpBar.fillStyle(0x000000, 0.28);
      this.xpBar.fillRect(0, H - 2, xpFW, 2);
      this.xpBar.fillStyle(UI.XP_SHINE, 0.65);
      this.xpBar.fillRect(0, H - 4, xpFW, 1);
    }

    // Skill icons
    const slots = [
      player.equippedSkills.slot1, player.equippedSkills.slot2,
      player.equippedSkills.slot3, player.equippedSkills.slot4,
    ];
    // SHOW_SKILL_BAR=false laisse skillSlots vide — guard explicite plutôt que
    // compter sur le try/catch pour avaler silencieusement l'accès hors-limites.
    if (SHOW_SKILL_BAR) {
      for (let i = 0; i < 4; i++) {
        const skillId = slots[i];
        if (skillId) {
          const skill = SKILL_MAP[skillId];
          if (skill) try { this.skillSlots[i].setTexture(skill.icon); } catch {}
        }
      }
    }
  }

  private drawLerpedBars() {
    const hpColor = this.lerpHp > 0.5 ? UI.HP_GREEN : this.lerpHp > 0.25 ? UI.HP_ORANGE : UI.HP_RED;
    // Barre HP dessinée à la main (drawBar repeindrait le fond par-dessus la traîne).
    // Ordre : fond → traîne orange retardée → barre verte → shine → ticks → bordure.
    const g = this.hpBar;
    g.clear();
    g.fillStyle(UI.HP_BG, 1);
    g.fillRect(BAR_X, this.HP_Y, BAR_W, HP_H);

    // Traîne "drain retardé" — orange, AVANT la barre verte, même X de départ
    const trailW = Math.max(0, Math.floor(BAR_W * Math.min(1, this.hpBarDelayed)));
    if (trailW > 0) {
      g.fillStyle(0xffaa00, 1);
      g.fillRect(BAR_X, this.HP_Y, trailW, HP_H);
    }

    // Barre HP réelle (lissée) par-dessus la traîne
    const fw = Math.max(0, Math.floor(BAR_W * Math.max(0, Math.min(1, this.lerpHp))));
    if (fw > 0) {
      g.fillStyle(hpColor, 1);
      g.fillRect(BAR_X, this.HP_Y, fw, HP_H);
      g.fillStyle(UI.HP_SHINE, 0.22);
      g.fillRect(BAR_X, this.HP_Y, fw, Math.max(2, Math.ceil(HP_H * 0.32)));
    }

    // Ticks de segments tous les 25px + bordure (mêmes valeurs que drawBar)
    const segEnd = Math.max(fw, trailW);
    if (segEnd > 0) {
      g.fillStyle(0x000000, 0.22);
      for (let tx = BAR_X + 25; tx < BAR_X + segEnd; tx += 25) {
        g.fillRect(tx, this.HP_Y, 1, HP_H);
      }
    }
    g.lineStyle(1, 0x000000, 0.45);
    g.strokeRect(BAR_X, this.HP_Y, BAR_W, HP_H);

    this.hpText.setText(`${this.cachedHpInt}/${this.cachedMaxHp}`);

    this.manaBar.clear();
    drawBar(this.manaBar, BAR_X, this.MP_Y, BAR_W, MP_H, this.lerpMp, UI.MP_FILL, UI.MP_BG, UI.MP_SHINE);
    this.manaText.setText(`${this.cachedMpInt}/${this.cachedMaxMp}`);
  }

  private onLevelUp(level: number) {
    this.pushNotif(t('notif.level_up').replace('{level}', String(level)), UI.TXT_GOLD);
  }

  private onItemLooted({ item, quantity }: { item: Item; quantity: number }) {
    const rarityColor = RARITY_COLORS[item.rarity] ?? '#ffffff';
    const name = localizeItem(item).name;
    const q = item.rollQuality;

    // Item non rollé (matériaux, consommables, key items, équipables sans
    // equipRanges) : comportement historique — les Common restent silencieux.
    if (typeof q !== 'number') {
      if (item.rarity !== ItemRarity.COMMON) this.pushNotif(`${name}  ×${quantity}`, rarityColor);
      return;
    }

    // Paliers lus via StatRollSystem (source de vérité §4.3) — aucun seuil dupliqué ici.
    const label   = StatRollSystem.getResonanceLabel(q);
    const perfect = label === 'Parfaite';
    if (!StatRollSystem.isNotableResonance(q)) {
      // Résonance ordinaire (< 85) : rien de plus que l'existant.
      if (item.rarity !== ItemRarity.COMMON) this.pushNotif(`${name}  ×${quantity}`, rarityColor);
      return;
    }

    // Vibrante ou Parfaite (§7.2) : notifie TOUJOURS — même un Common.
    // Arbitrage lisibilité : le TEXTE garde la couleur de rareté (l'identité du
    // drop prime), la Résonance s'exprime par l'accent doré du panneau + la
    // mention chiffrée dans le message — les deux infos cohabitent sans se
    // voler la couleur.
    const glow = perfect
      ? UI.GLOW_GOLD // halo « événement » — même or que le bandeau de zone (onZoneEntered)
      : parseInt(resonanceColor(q).slice(1), 16); // or de palier §4.3, seuils non dupliqués
    this.pushNotifEntry({
      msg: `${name}  ×${quantity} — ${formatResonanceLine(q)}`,
      color: rarityColor,
      glow,
      // « Un Common parfait est un petit événement ; il doit se sentir » :
      // 4200 ms = 6 cycles complets du pulse (350 ms × yoyo × repeat 5).
      duration: perfect ? 4200 : 2500,
      shimmer: perfect,
    });
  }

  private onQuestCompleted() {
    this.pushNotif(t('notif.quest_done'), UI.TXT_ORANGE);
  }

  /** Système Pity (PITY/PITY.md) — distingue un paiement de dette d'un drop
   *  chanceux (LootSystem ne pousse ici que les raretés PAYÉES par la pitié). */
  private onPityPaid(rarity: ItemRarity) {
    const color = RARITY_COLORS[rarity] ?? '#ffffff';
    this.pushNotifEntry({
      msg: t('pity.paid').replace('{rarity}', t(`rarity.${rarity}`)),
      color,
      glow: parseInt(color.slice(1), 16),
      duration: 3200,
      shimmer: true,
    });
    // Flash du chip en même temps que la notif : le joueur associe le chip à
    // l'événement "Garantie honorée" sans un mot de plus à l'écran (retour ux-agent).
    const flash = this.add.rectangle(0, 0, this.pityChipW, this.pityChipH, 0xffffff, 0.3)
      .setOrigin(0, 0).setPosition(this.pityChipX, this.pityChipY);
    this.tweens.add({ targets: flash, alpha: 0, duration: 250, onComplete: () => flash.destroy() });
  }

  private onSkillUnlocked(skillId: string) {
    const skill = SKILL_MAP[skillId];
    if (skill) this.pushNotif(t('notif.skill_unlocked').replace('{name}', localizeSkill(skill).name), UI.TXT_BLUE);
  }

  private onZoneCleared(zone: { id: string; name: string }) {
    const zoneName = t(`zone.${zone.id}`) || zone.name;
    this.pushNotif(t('notif.zone_cleared').replace('{name}', zoneName), UI.TXT_GREEN);
  }

  private onShowNotification(msg: string) {
    this.pushNotif(msg, UI.TXT_PARCHMENT);
  }

  private onZoneEntered(zone: { id: string; name: string }) {
    if (!this.sys.isActive()) return;
    const W = this.cameras.main.width;
    this.zoneText.setText(t(`zone.${zone.id}`) || zone.name);

    // Encadré glow discret dimensionné sur le texte
    const padX = 8;
    const padY = 5;
    const bw = Math.ceil(this.zoneText.width)  + padX * 2;
    const bh = Math.ceil(this.zoneText.height) + padY * 2;
    this.zoneBg.clear();
    drawGlowPanel(this.zoneBg, W - 10 - bw, 15 - padY, bw, bh, UI.GLOW_GOLD, UI.BG_MID, 3);

    this.tweens.add({ targets: [this.zoneText, this.zoneBg], alpha: 1, duration: 400 });
    this.time.delayedCall(3500, () => {
      this.tweens.add({ targets: [this.zoneText, this.zoneBg], alpha: 0.4, duration: 1000 });
    });
  }

  private onNewCreatureDiscovered({ name }: { name: string }) {
    this.pushNotif(`Nouvelle créature : ${name} !`, UI.TXT_BLUE);
  }

  private pushNotif(msg: string, color: string = UI.TXT_PARCHMENT) {
    this.pushNotifEntry({ msg, color });
  }

  private pushNotifEntry(entry: NotifEntry) {
    this.notifQueue.push(entry);
    if (this.notifTimer <= 0) this.showNextNotif();
  }

  private showNextNotif() {
    if (!this.notifQueue.length) return;
    const entry = this.notifQueue.shift()!;
    this.stopNotifShimmer(); // reset scale/tweens si la notif précédente scintillait
    this.notifText.setText(entry.msg).setStyle({ color: entry.color }).setAlpha(1);

    // Fond semi-opaque ajusté à la largeur du message
    const padX = 10;
    const padY = 5;
    const bw = Math.ceil(this.notifText.width)  + padX * 2;
    const bh = Math.ceil(this.notifText.height) + padY * 2;
    this.notifBg.clear();
    drawGlowPanel(
      this.notifBg,
      this.notifText.x - bw / 2, this.notifText.y - bh / 2,
      bw, bh, entry.glow ?? UI.SEPARATOR, UI.BG_MID, 3,
    );
    this.notifBg.setAlpha(0.92);

    // Scintillement « Parfaite » (LOOT_STAT_ROLLS.md §7.2) : pulse BORNÉ
    // (repeat fini, ~4.2 s au total) sur l'alpha du panneau doré + micro-scale
    // du texte — même vocabulaire visuel que les tweens du bandeau de zone,
    // zéro asset/particule (ton sobre : « rien de plus qu'un drop Legendary »).
    if (entry.shimmer) {
      this.notifShimmerTweens = [
        this.tweens.add({
          targets: this.notifBg,
          alpha: 0.55, duration: 350, yoyo: true, repeat: 5, ease: 'Sine.easeInOut',
        }),
        this.tweens.add({
          targets: this.notifText,
          scaleX: 1.06, scaleY: 1.06, duration: 350, yoyo: true, repeat: 5, ease: 'Sine.easeInOut',
        }),
      ];
    }

    this.notifTimer = entry.duration ?? 2500;
  }

  /** Tue les tweens du scintillement et remet le texte à l'échelle 1. */
  private stopNotifShimmer() {
    for (const tw of this.notifShimmerTweens) tw.remove();
    this.notifShimmerTweens = [];
    if (this.notifText) this.notifText.setScale(1);
  }
}
