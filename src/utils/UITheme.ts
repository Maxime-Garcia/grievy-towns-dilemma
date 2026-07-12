// Shared pixel-art UI theme — medieval fantasy palette
// All scenes import from here to stay visually consistent.

import type { RangedStat } from '../types';
import { StatsSystem } from '../systems/StatsSystem';

export const UI = {
  // Panel backgrounds
  PANEL_BG:    0x0c0c18,
  BORDER:      0x2c1e10,
  BORDER_LIT:  0x6a4a22,
  CORNER:      0xc8a030,

  // Text colours (string form for Phaser text objects)
  TXT_PARCHMENT: '#f5edd0',
  TXT_GOLD:      '#c8a030',
  // TXT_MUTED remonté de #88776a (≈4.5:1, borderline) à ≈5.8:1 sur PANEL_BG —
  // même ton brun-gris chaud, juste assez de luminance pour rester lisible à
  // 9px (TYPE.SMALL), la taille plancher des fourchettes/badges/hints.
  TXT_MUTED:     '#9a8a7a',
  // TXT_HINT remonté de #443322 (≈1.6:1 — indéchiffrable à 9px) à ≈2.9:1 :
  // toujours nettement tertiaire/fantôme face à TXT_MUTED, mais déchiffrable.
  // Jamais d'info critique dans cette couleur (règle guidelines §2.1).
  TXT_HINT:      '#6b5a48',
  TXT_BLUE:      '#88aaff',
  TXT_GREEN:     '#55dd66',
  TXT_RED:       '#dd4433',
  TXT_ORANGE:    '#ff9940',
  TXT_WHITE:     '#ffffff',

  // Slot
  SLOT_BG:     0x0a0a18,
  SLOT_BORDER: 0x282040,
  SLOT_ACTIVE: 0xc8a030,

  // Buttons
  BTN_BG:        0x121020,
  BTN_BG_HOVER:  0x1e1a30,
  BTN_BORDER:    0x4a3520,
  BTN_BORDER_HOV: 0xc8a030,

  // HP
  HP_BG:     0x0a140a,
  HP_GREEN:  0x44cc55,
  HP_ORANGE: 0xdd9920,
  HP_RED:    0xcc2222,
  HP_SHINE:  0xaaffbb,

  // MP
  MP_BG:    0x05050f,
  MP_FILL:  0x2255ee,
  MP_SHINE: 0x99bbff,

  // XP
  XP_BG:    0x080012,
  XP_FILL:  0x8833cc,
  XP_SHINE: 0xcc88ff,

  // Modern accent palette (glow panels, badges, magic feedback)
  ACCENT_VIOLET: 0x9966ff,   // accents mana / magie
  ACCENT_CYAN:   0x44ddcc,   // accents vent / eau
  GLOW_GOLD:     0xffcc66,   // halos dorés (level up, EPIC)
  BG_DEEP:       0x060810,   // fond très sombre (menus overlay)
  BG_MID:        0x0e1520,   // fond panneau mid
  SEPARATOR:     0x1a2535,   // séparateurs discrets

  // Direction « arcane fresh » (refonte inventaire 07/2026) — structure UI
  // en cyan arcane froid, l'or restant réservé à l'identité et à la valeur
  // (titre, monnaie, nom du joueur, raretés). Réf. Dead Cells / HLD.
  ACCENT_ARCANE: 0x59e0c8,   // liserés, accents de panneaux modernes
  TXT_CYAN:      '#7fe8d8',  // titres de sections / panneaux (contraste ≥ 9:1 sur BG_MID)
} as const;

export const FONT = "'Press Start 2P', monospace";

/**
 * Résolution de rendu du texte (cf. `uiStyle`/`pxStyle`). Valeur par défaut
 * sûre pour SSR/tests ; `setTextResolution()` la recalibre une seule fois au
 * boot (`main.ts`) d'après le zoom RÉEL choisi par le Scale Manager.
 *
 * Pourquoi ce n'est pas un `3` fixe : le jeu tourne en `pixelArt:true` +
 * `image-rendering: pixelated` (index.html) — indispensable pour que les
 * sprites restent nets en gros pixels. Mais `Scale.FIT` + `zoom: MAX_ZOOM`
 * ne change QUE la taille CSS du canvas ; le canvas lui-même reste rendu à
 * 800×600 (cf. ScaleManager.resize — `canvas.width/height` = baseSize, jamais
 * multiplié par le zoom). Le navigateur agrandit donc tout le canvas déjà
 * rendu — texte compris — via un filtrage "plus proche voisin" d'un facteur
 * ÉGAL AU ZOOM. Un texte fin (8-10px) survit mal à ça, même généré à une
 * résolution interne fixe de 3× : sur un grand écran (zoom 3-4+), l'agrandissement
 * final blockifie quand même les glyphes. Fournir plus de détail source
 * (résolution ≥ zoom × un facteur confortable) neutralise l'essentiel de cet
 * effet sans toucher au Scale Manager ni au mapping des coordonnées d'input —
 * seule la police en profite, tout le reste du jeu (sprites, caméra, clics)
 * est inchangé.
 */
let TEXT_RESOLUTION = 4;

/** À appeler une seule fois au boot (`main.ts`), après `new Phaser.Game()`,
 *  une fois que `game.scale.zoom` reflète la valeur réellement choisie. */
export function setTextResolution(zoom: number): void {
  // Plafond à 10 : la texture de texte est affichée sous filtrage NEAREST
  // (pixelArt:true) — quand sa densité dépasse largement le zoom réel, la
  // minification ne retient qu'une fraction des pixels rasterisés et les
  // micro-glyphes (9-10px) ressortent "grignotés" (bruit de sous-échantillonnage,
  // aggravé par le hinting du navigateur aux toutes petites tailles de police).
  // 10 couvre les zooms réels desktop (FIT plafonne en pratique vers 2-4 →
  // marge ≥ 2.5× au pire) : assez de détail source pour garder les gros textes
  // nets (l'acquis de cette passe), sans sur-échantillonner à l'excès ni faire
  // exploser la taille des canvas de texte.
  TEXT_RESOLUTION = Math.min(10, Math.max(4, Math.ceil(zoom * 3)));
}

/**
 * Police UI moderne — lisible sans zoom, même après le downscale Scale.FIT
 * sur mobile (×0.47 à 375 CSS px). Verdana est large et très lisible aux
 * petites tailles, disponible partout sans chargement externe.
 *
 * Règle : FONT (pixel) = identité — titre du jeu, gros titres d'écran.
 *         FONT_UI (moderne) = TOUT le reste : corps, labels, stats, boutons.
 */
export const FONT_UI = "Verdana, 'Segoe UI', Tahoma, Geneva, sans-serif";

/** Échelle typographique officielle (px logiques 800×600) — voir UI_UX_GUIDELINES.md §2.2 */
export const TYPE = {
  TITLE:   15,  // titre d'écran (INVENTAIRE, SKILLS…)
  HEADING: 13,  // nom d'item / de talent / speaker
  BODY:    12,  // corps de texte, dialogue, valeurs
  LABEL:   10,  // labels de stats, texte secondaire
  SMALL:    9,  // badges, hints, micro-texte — MINIMUM absolu
} as const;

/** Constantes de layout réutilisables */
export const LAYOUT = {
  PANEL_RADIUS:  6,
  CARD_RADIUS:   4,
  BORDER_WIDTH:  1,
  SHADOW_COLOR:  0x000000,
  SHADOW_ALPHA:  0.45,
  TOUCH_MIN:     44,   // zone tactile minimum (px logiques)
} as const;

/** Options du style de texte moderne. */
export interface UiStyleOpts {
  bold?:          boolean;
  italic?:        boolean;
  /** Contour noir (obligatoire sur barre / sprite / fond variable). */
  stroke?:        boolean;
  wordWrapWidth?: number;
  align?:         string;
  lineSpacing?:   number;
}

/**
 * Style de texte moderne — LE chemin standard pour tout nouveau texte UI.
 * `pxStyle` reste disponible pour la police pixel (titres identitaires,
 * scènes non migrées).
 */
export function uiStyle(
  size: number,
  color: string = UI.TXT_PARCHMENT,
  opts: UiStyleOpts = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  const s: Phaser.Types.GameObjects.Text.TextStyle = {
    fontSize:   `${size}px`,
    color,
    fontFamily: FONT_UI,
    // Le jeu tourne en pixelArt:true (filtrage NEAREST global, cf. main.ts) — sans ça,
    // ce texte "moderne" (Verdana) hérite du même rendu blocky que les sprites au lieu
    // d'un rendu net. `resolution` fait générer le canvas de texte en interne à une
    // densité plus élevée avant le zoom du jeu, ce qui le garde net même sous NEAREST.
    // Valeur calibrée sur le zoom réel par setTextResolution() (voir sa doc) — un `3`
    // fixe ne suffit pas sur un grand écran où le Scale Manager choisit un zoom élevé.
    resolution: TEXT_RESOLUTION,
  };
  const styleParts: string[] = [];
  if (opts.bold)   styleParts.push('bold');
  if (opts.italic) styleParts.push('italic');
  if (styleParts.length) s.fontStyle = styleParts.join(' ');
  if (opts.stroke) {
    s.stroke = '#000000';
    s.strokeThickness = 3;
  }
  if (opts.wordWrapWidth !== undefined) s.wordWrap = { width: opts.wordWrapWidth };
  if (opts.align !== undefined)         s.align = opts.align;
  if (opts.lineSpacing !== undefined)   s.lineSpacing = opts.lineSpacing;
  return s;
}

/**
 * Draw a pixel-art panel: dark fill + dark border + gold inner line + gold corner rivets.
 *
 * @param fillAlpha Opacité du fond uniquement (bordures et rivets restent opaques).
 *                  0.85 = panneau principal translucide (le jeu reste visible derrière),
 *                  0.92 = panneau secondaire / tooltip, 1 = opaque (défaut, rétro-compatible).
 */
export function drawPanel(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  fill = UI.PANEL_BG,
  fillAlpha = 1,
): void {
  g.fillStyle(fill, fillAlpha);
  g.fillRect(x, y, w, h);

  g.lineStyle(1, UI.BORDER, 1);
  g.strokeRect(x, y, w, h);

  g.lineStyle(1, UI.BORDER_LIT, 0.7);
  g.strokeRect(x + 1, y + 1, w - 2, h - 2);

  const C = 3;
  g.fillStyle(UI.CORNER, 1);
  g.fillRect(x,         y,         C, C);
  g.fillRect(x + w - C, y,         C, C);
  g.fillRect(x,         y + h - C, C, C);
  g.fillRect(x + w - C, y + h - C, C, C);
}

/**
 * Draw a modern glow panel: dark rounded fill + fine outer separator line +
 * fine inner accent line at 30% alpha. The "pixel art + modern UI" look
 * (Hyper Light Drifter / Dead Cells / Hades) — subtle glow instead of
 * thick flat borders.
 *
 * Coexists with drawPanel(): existing scenes keep drawPanel, new/refreshed
 * surfaces use drawGlowPanel. Both are separate named exports.
 */
export function drawGlowPanel(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  accentColor: number = UI.BORDER_LIT,
  bgColor: number = UI.PANEL_BG,
  radius: number = 4,
  fillAlpha: number = 0.97,
): void {
  g.fillStyle(bgColor, fillAlpha);
  g.fillRoundedRect(x, y, w, h, radius);
  g.lineStyle(1, UI.SEPARATOR, 1);
  g.strokeRoundedRect(x, y, w, h, radius);
  g.lineStyle(1, accentColor, 0.3);
  g.strokeRoundedRect(x + 2, y + 2, w - 4, h - 4, Math.max(1, radius - 2));
}

/**
 * Draw a soft luminous halo around a rectangular area — a stack of
 * progressively larger, progressively more transparent stroked rects.
 * Pixel-art friendly (straight edges, no blur filter), très léger à
 * redessiner. Utilisé derrière les titres et panneaux "héros"
 * (référence : lueurs discrètes d'Alabaster Dawn).
 *
 * @param intensity 0..1 — multiplie l'alpha de chaque anneau (défaut 1).
 */
export function drawGlow(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  color: number = UI.GLOW_GOLD,
  intensity: number = 1,
): void {
  const RINGS = 4;
  for (let i = 1; i <= RINGS; i++) {
    const pad   = i * 3;                                  // 3, 6, 9, 12 px
    const alpha = 0.10 * (1 - (i - 1) / RINGS) * intensity;
    g.lineStyle(3, color, alpha);
    g.strokeRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
  }
}

/**
 * Modern card: soft drop shadow + rounded dark fill + fine border +
 * optional coloured accent bar on the left edge (Dofus-like item rows,
 * quest cards, save slots). Complements drawPanel (medieval frame) and
 * drawGlowPanel (glow frame) for content that must read as "a card".
 */
export function drawCard(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  opts: {
    bg?: number;
    accent?: number;       // barre d'accent verticale à gauche (rareté, branche…)
    radius?: number;
    fillAlpha?: number;
    shadow?: boolean;
  } = {},
): void {
  const {
    bg        = UI.BG_MID,
    accent,
    radius    = LAYOUT.CARD_RADIUS,
    fillAlpha = 1,
    shadow    = true,
  } = opts;

  if (shadow) {
    g.fillStyle(LAYOUT.SHADOW_COLOR, LAYOUT.SHADOW_ALPHA * 0.6);
    g.fillRoundedRect(x + 2, y + 3, w, h, radius);
  }
  g.fillStyle(bg, fillAlpha);
  g.fillRoundedRect(x, y, w, h, radius);
  g.lineStyle(1, UI.SEPARATOR, 1);
  g.strokeRoundedRect(x, y, w, h, radius);

  if (accent !== undefined) {
    g.fillStyle(accent, 0.9);
    g.fillRoundedRect(x, y, 3, h, { tl: radius, bl: radius, tr: 0, br: 0 });
  }
}

/**
 * Slot d'item moderne (paperdoll + grille d'inventaire) : fond sombre arrondi,
 * bordure à la couleur de rareté et, quand le slot est occupé, une teinte
 * interne subtile de la même couleur (lueur douce, réf. Dead Cells / Hades).
 * Remplace les strokeRect carrés de l'ancien langage anguleux.
 *
 * (x, y) = coin haut-gauche. `borderColor` = RARITY_COLORS de l'item, ou
 * UI.SLOT_BORDER pour un slot vide.
 */
export function drawSlot(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, size: number,
  borderColor: number,
  opts: {
    occupied?:    boolean;
    borderAlpha?: number;   // défaut : 1 si occupé, 0.45 si vide
    radius?:      number;   // défaut : 5
    bg?:          number;   // défaut : UI.SLOT_BG
  } = {},
): void {
  const {
    occupied    = false,
    borderAlpha = occupied ? 1 : 0.45,
    radius      = 5,
    bg          = UI.SLOT_BG,
  } = opts;

  g.fillStyle(bg, 0.94);
  g.fillRoundedRect(x, y, size, size, radius);

  if (occupied) {
    // Halo interne de rareté — lisible sans crier
    g.fillStyle(borderColor, 0.10);
    g.fillRoundedRect(x + 2, y + 2, size - 4, size - 4, Math.max(2, radius - 2));
  }

  g.lineStyle(occupied ? 2 : 1, borderColor, borderAlpha);
  g.strokeRoundedRect(x, y, size, size, radius);
}

/**
 * Surbrillance de survol/sélection d'un slot dessiné via drawSlot —
 * même géométrie arrondie, contour blanc doux.
 */
export function strokeSlotHighlight(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, size: number,
  color = 0xffffff,
  alpha = 0.85,
  radius = 5,
): void {
  g.lineStyle(2, color, alpha);
  g.strokeRoundedRect(x, y, size, size, radius);
}

/** Séparateur horizontal discret — remplace les lineStyle/moveTo/lineTo répétés. */
export function drawDivider(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number,
  color: number = UI.BORDER_LIT,
  alpha = 0.5,
): void {
  g.lineStyle(1, color, alpha);
  g.lineBetween(x, y, x + w, y);
}

/**
 * Scrollbar verticale discrète (piste + curseur) pour les panneaux de liste
 * scrollables (Bestiaire, Arsenal...). À redessiner (g.clear() + rappel) à
 * chaque changement de scrollOffset — pas de listener interne, purement visuel
 * (le drag/molette/flèches restent gérés par la scène elle-même).
 *
 * @param visibleFraction ratio 0-1 de contenu visible (lignes visibles / total)
 *   — détermine la hauteur du curseur. `scrollOffset`/`maxScrollOffset` en
 *   unités de ligne (pas en pixels) déterminent sa position.
 */
export function drawScrollbar(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  scrollOffset: number, maxScrollOffset: number, visibleFraction: number,
): void {
  g.fillStyle(UI.BG_DEEP, 0.7);
  g.fillRoundedRect(x, y, w, h, w / 2);

  if (maxScrollOffset <= 0) return; // tout tient à l'écran — pas de curseur nécessaire

  const thumbH = Math.max(24, h * Math.max(0, Math.min(1, visibleFraction)));
  const trackRange = h - thumbH;
  const thumbY = y + trackRange * Math.max(0, Math.min(1, scrollOffset / maxScrollOffset));

  g.fillStyle(UI.ACCENT_ARCANE, 0.85);
  g.fillRoundedRect(x, thumbY, w, thumbH, w / 2);
}

/** Formate un taux de drop (0-1) en pourcentage lisible — plus de décimales pour
 *  les taux rares (ex. 0.4% plutôt que 0%). Partagé entre ArsenalScene/BestiaryScene. */
export function formatDropRate(rate: number): string {
  const pct = rate * 100;
  return pct >= 10 ? `${Math.round(pct)}%` : pct >= 1 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`;
}

/** Result of {@link renderScrollableText} — caller owns both objects and must push
 * them into its own cleanup array (destroyed on every re-render + on shutdown). */
export interface ScrollTextResult {
  text: Phaser.GameObjects.Text;
  /** Source Graphics for the GeometryMask applied to `text` — never added to the
   *  display list (created via `scene.make.graphics(undefined, false)`), but still
   *  a real GameObject that must be `.destroy()`-ed like any other. */
  mask: Phaser.GameObjects.Graphics;
  /** `max(0, contentHeight - viewportHeight)` — 0 means the text fits, no scroll needed. */
  maxScrollPx: number;
}

/**
 * Renders a block of text clipped to a fixed viewport rectangle (GeometryMask),
 * with a caller-controlled vertical scroll offset in pixels. Lets detail panels
 * (Arsenal/Bestiary description & lore) stay a UNIFORM fixed size for every entry
 * while guaranteeing the full text remains reachable via scroll, instead of
 * overflowing past the panel or being silently clipped without a way to read the rest.
 *
 * Purely a rendering primitive: the caller is responsible for clamping/storing
 * `scrollPx` across renders, wiring wheel/drag input, and drawing a scrollbar
 * (see `drawScrollbar`) using the returned `maxScrollPx`.
 */
export function renderScrollableText(
  scene: Phaser.Scene,
  x: number, y: number, w: number, h: number,
  content: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
  scrollPx: number,
): ScrollTextResult {
  const text = scene.add.text(x, y - scrollPx, content, { ...style, wordWrap: { width: w } });

  const mask = scene.make.graphics(undefined, false);
  mask.fillStyle(0xffffff, 1);
  mask.fillRect(x, y, w, h);
  text.setMask(mask.createGeometryMask());

  const maxScrollPx = Math.max(0, Math.ceil(text.height) - h);
  if (scrollPx > maxScrollPx) {
    text.y = y - maxScrollPx;
  }
  return { text, mask, maxScrollPx };
}

/**
 * Bouton de fermeture standard (règle inter-écrans §7.1 des guidelines) :
 * glyphe × rouge + hit zone invisible 48×48 + hover orange.
 * (cx, cy) = CENTRE du bouton. Retourne les objets pour gestion dynamique.
 */
export function addCloseButton(
  scene: Phaser.Scene,
  cx: number, cy: number,
  onClose: () => void,
  depth = 10,
): { glyph: Phaser.GameObjects.Text; hit: Phaser.GameObjects.Rectangle } {
  const glyph = scene.add.text(cx, cy, '×', uiStyle(22, UI.TXT_RED, { bold: true, stroke: true }))
    .setOrigin(0.5)
    .setDepth(depth);
  const hit = scene.add.rectangle(cx, cy, 48, 48, 0, 0)
    .setInteractive({ useHandCursor: true })
    .setDepth(depth + 1);
  hit.on('pointerover', () => glyph.setColor(UI.TXT_ORANGE));
  hit.on('pointerout',  () => glyph.setColor(UI.TXT_RED));
  hit.on('pointerdown', () => onClose());
  return { glyph, hit };
}

// ────────────────────────────────────────────────────────────
// TRANSITIONS D'ÉCRAN (Arsenal / Bestiaire) — trois langages distincts :
//   ouverture   = matérialisation (fade + scale-in caméra, cadre énergisé)
//   fermeture   = dissolution     (la scène recule et s'efface, le jeu réapparaît)
//   redirection = portail arcane  (anneau runique qui se referme, teinte de la
//                 destination, puis se rouvre à l'arrivée)
// Tout est caméra + Graphics/tweens : aucun refactor en Container nécessaire,
// aucun asset, pixel-art friendly (traits nets, pas de blur/postFX).
// ────────────────────────────────────────────────────────────

/** Depth des overlays de transition — au-dessus de tout contenu de scène
 *  (les scènes Arsenal/Bestiaire plafonnent à 50). */
const TRANSITION_DEPTH = 900;

/** Anneau de portail arcane : cercle principal + fin cercle blanc intérieur +
 *  ticks runiques en rotation autour. Redessiné à chaque frame du tween. */
function drawPortalRing(
  g: Phaser.GameObjects.Graphics,
  cx: number, cy: number, r: number,
  tint: number, alpha: number, rot: number,
): void {
  g.clear();
  g.lineStyle(3, tint, alpha);
  g.strokeCircle(cx, cy, r);
  g.lineStyle(1, 0xffffff, alpha * 0.55);
  g.strokeCircle(cx, cy, Math.max(4, r - 7));
  g.lineStyle(2, tint, alpha * 0.9);
  const TICKS = 6;
  for (let i = 0; i < TICKS; i++) {
    const ang = rot + (i * Math.PI * 2) / TICKS;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    g.lineBetween(
      cx + cos * (r + 10), cy + sin * (r + 10),
      cx + cos * (r + 17), cy + sin * (r + 17),
    );
  }
}

export interface OpenScreenOpts {
  /** Couleur du liseré "énergisé" du cadre (défaut : UI.ACCENT_ARCANE). */
  accent?: number;
  /** Arrivée via redirection croisée : joue en plus l'ouverture du portail
   *  (voile teinté + anneau qui se rouvre depuis le centre) dans cette teinte —
   *  la même que le fondu de départ, pour la continuité visuelle. */
  portalTint?: number;
}

/**
 * Transition d'OUVERTURE d'un écran plein cadre (Arsenal/Bestiaire) — à appeler
 * en tête de create(). La scène se matérialise : fondu d'alpha caméra (le jeu
 * reste visible derrière, pas de flash noir plein écran) + scale-in léger
 * (zoom 0.96 → 1, Back.easeOut) + liseré accent qui s'éteint sur la géométrie
 * exacte du cadre drawGlowPanel (6,6,W-12,H-12, r=10).
 *
 * Tous les objets créés sont bounded (tween onComplete → destroy) et vivent sur
 * la display list de la scène : un stop pendant l'animation les détruit avec elle.
 */
export function openScreenTransition(scene: Phaser.Scene, opts: OpenScreenOpts = {}): void {
  const cam = scene.cameras.main;
  const { width: W, height: H } = cam;
  const accent = opts.accent ?? UI.ACCENT_ARCANE;

  cam.setZoom(0.96);
  scene.tweens.add({ targets: cam, zoom: 1, duration: 260, ease: 'Back.easeOut' });

  if (opts.portalTint === undefined) {
    // Ouverture normale : la scène sous-jacente (PauseScene) est exactement ce
    // qui était affiché la frame d'avant — le fondu d'alpha caméra part donc
    // d'une image continue, sans flash.
    cam.setAlpha(0);
    scene.tweens.add({ targets: cam, alpha: 1, duration: 160, ease: 'Quad.easeOut' });
  } else {
    // Arrivée par portail : la scène de départ s'est terminée sur un écran
    // ENTIÈREMENT teinté (fadeOut caméra) — la caméra reste opaque et c'est un
    // voile de la même teinte, pleinement opaque à la frame 1, qui assure la
    // continuité avant de se dissiper. Surdimensionné : le zoom-settle 0.96
    // rétrécit aussi le voile, la marge évite d'entrevoir les bords du dessous.
    const tint = opts.portalTint;
    const veil = scene.add.rectangle(W / 2, H / 2, W + 80, H + 80, tint, 1)
      .setDepth(TRANSITION_DEPTH + 1);
    scene.tweens.add({
      targets: veil, alpha: 0, duration: 260, ease: 'Quad.easeOut',
      onComplete: () => veil.destroy(),
    });

    const ring = scene.add.graphics().setDepth(TRANSITION_DEPTH + 2);
    const st = { r: 24, a: 0.95, rot: 0.9 };
    scene.tweens.add({
      targets: st, r: Math.hypot(W, H) / 2, a: 0, rot: 1.8,
      duration: 320, ease: 'Cubic.easeOut',
      onUpdate:   () => drawPortalRing(ring, W / 2, H / 2, st.r, tint, st.a, st.rot),
      onComplete: () => ring.destroy(),
    });
  }

  const frame = scene.add.graphics().setDepth(TRANSITION_DEPTH);
  frame.lineStyle(2, accent, 1);
  frame.strokeRoundedRect(6, 6, W - 12, H - 12, 10);
  frame.setAlpha(0.85);
  scene.tweens.add({
    targets: frame, alpha: 0, duration: 340, ease: 'Quad.easeIn',
    onComplete: () => frame.destroy(),
  });
}

/**
 * Transition de FERMETURE (bouton ×, ESC) : la scène recule (zoom 1 → 0.94) et
 * se dissout (alpha caméra → 0) en 170 ms, révélant le jeu/PauseScene derrière
 * au lieu d'un fondu au noir plein écran.
 *
 * Le callback tween s'exécute pendant l'update de la scène (pas le cycle de
 * rendu caméra comme FADE_OUT_COMPLETE), mais on garde le déferrement d'un tick
 * via time.delayedCall(0, ...) avant toute mutation du scene manager — même
 * précaution que GameScene.performZoneTransition()/onPlayerDeath()/goToMainMenu()
 * (écran figé reporté quand stop()/launch() est appelé depuis un callback
 * d'effet). Cette fonction n'appelle jamais scene.stop() elle-même : c'est
 * `onClosed` qui décide (stop + resume PauseScene, etc.).
 */
export function closeScreenTransition(scene: Phaser.Scene, onClosed: () => void): void {
  const cam = scene.cameras.main;
  // Tue un éventuel tween d'ouverture encore en cours sur la caméra (ESC très
  // tôt) — sinon deux tweens se disputent zoom/alpha.
  scene.tweens.killTweensOf(cam);
  scene.tweens.add({
    targets: cam, zoom: 0.94, alpha: 0, duration: 170, ease: 'Cubic.easeIn',
    onComplete: () => { scene.time.delayedCall(0, onClosed); },
  });
}

/**
 * Transition de REDIRECTION croisée (Arsenal ⇄ Bestiaire) : portail arcane —
 * un anneau runique se referme vers le centre de l'écran pendant que la caméra
 * zoome légèrement (aspiration) et fond vers la teinte de la destination
 * (cyan arcane → Bestiaire, or → Arsenal). L'écran d'arrivée rejoue l'anneau
 * en ouverture via openScreenTransition({ portalTint }).
 *
 * FADE_OUT_COMPLETE se déclenche depuis le cycle de rendu de la caméra —
 * appeler scene.stop()/scene.launch() de façon SYNCHRONE dedans casse le
 * rendu (l'écran reste figé sur la dernière frame, entièrement teintée).
 * Cf. GameScene.performZoneTransition()/onPlayerDeath()/goToMainMenu() : on
 * diffère systématiquement d'un tick via time.delayedCall(0, ...). Le listener
 * résiduel éventuel (stop forcé pendant le fondu) doit être retiré par
 * shutdown() via cameras.main?.off(FADE_OUT_COMPLETE) — chaînage optionnel
 * obligatoire, cf. commentaires des scènes appelantes.
 */
export function portalRedirectTransition(
  scene: Phaser.Scene,
  tint: number,
  onFadedOut: () => void,
): void {
  const cam = scene.cameras.main;
  const { width: W, height: H } = cam;
  scene.tweens.killTweensOf(cam);
  // Un clic très rapide sur "Aller" pendant le tween d'alpha de l'ouverture
  // (~160ms) figerait cam.alpha à une valeur partielle une fois ce tween tué —
  // on garantit l'opacité pleine avant d'entamer le fondu de sortie.
  cam.setAlpha(1);

  const ring = scene.add.graphics().setDepth(TRANSITION_DEPTH + 2);
  const st = { r: Math.hypot(W, H) / 2, a: 0.12, rot: 0 };
  scene.tweens.add({
    targets: st, r: 22, a: 1, rot: 0.9, duration: 300, ease: 'Cubic.easeIn',
    onUpdate:   () => drawPortalRing(ring, W / 2, H / 2, st.r, tint, st.a, st.rot),
    onComplete: () => ring.destroy(),
  });
  scene.tweens.add({ targets: cam, zoom: 1.06, duration: 300, ease: 'Cubic.easeIn' });

  const r = (tint >> 16) & 0xff;
  const g = (tint >> 8) & 0xff;
  const b = tint & 0xff;
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.time.delayedCall(0, onFadedOut);
  });
  cam.fadeOut(300, r, g, b);
}

/** Palette du bouton Confirmer — défaut vert "action positive" générique.
 *  Un appelant peut passer une teinte différente (ex: bleu arcane) pour que
 *  le bouton "Aller" d'une redirection annonce visuellement la couleur de la
 *  destination plutôt qu'un vert neutre. */
export interface ConfirmButtonAccent {
  bg: number; border: number; borderHover: number; text: string;
}
const DEFAULT_CONFIRM_ACCENT: ConfirmButtonAccent = {
  bg: 0x0d2010, border: 0x44cc66, borderHover: 0xaaffcc, text: UI.TXT_GREEN,
};
/** Variante bleu/cyan arcane — même teinte que le liseré des cadres
 *  (UI.ACCENT_ARCANE) : utilisée pour le bouton "Aller" qui redirige vers un
 *  écran dont le cadre/portail est teinté dans cette même couleur. */
export const ARCANE_CONFIRM_ACCENT: ConfirmButtonAccent = {
  bg: 0x0a1f24, border: UI.ACCENT_ARCANE, borderHover: 0xa8f5e8, text: UI.TXT_CYAN,
};

/**
 * Paire de boutons horizontaux Confirmer (gauche, vert par défaut) / Annuler
 * (rouge, droite) — même convention visuelle que InventoryScene.showActionConfirmPopup()
 * (fond sombre teinté, bordure vive, hover plus clair). (x, y) = coin haut-gauche
 * de la rangée, `w` = largeur totale disponible (les deux boutons + l'espacement
 * la remplissent exactement). Hauteur par défaut = LAYOUT.TOUCH_MIN (zone
 * tactile minimale). Retourne les GameObjects créés (à la charge de l'appelant
 * de les détruire/pousser dans son propre tableau de nettoyage).
 */
export function drawConfirmCancelButtons(
  scene: Phaser.Scene,
  x: number, y: number, w: number,
  confirmLabel: string, cancelLabel: string,
  onConfirm: () => void, onCancel: () => void,
  height: number = LAYOUT.TOUCH_MIN,
  confirmAccent: ConfirmButtonAccent = DEFAULT_CONFIRM_ACCENT,
): { objects: Phaser.GameObjects.GameObject[]; height: number } {
  const GAP  = 8;
  const btnW = (w - GAP) / 2;
  const confirmX = x;
  const cancelX  = x + btnW + GAP;

  const confirmGfx = scene.add.graphics();
  confirmGfx.fillStyle(confirmAccent.bg, 1);
  confirmGfx.fillRoundedRect(confirmX, y, btnW, height, 3);
  confirmGfx.lineStyle(1, confirmAccent.border, 1);
  confirmGfx.strokeRoundedRect(confirmX, y, btnW, height, 3);
  const confirmTxt = scene.add.text(confirmX + btnW / 2, y + height / 2, confirmLabel,
    uiStyle(10, confirmAccent.text, { bold: true })).setOrigin(0.5);
  const confirmHit = scene.add.rectangle(confirmX + btnW / 2, y + height / 2, btnW, height, 0, 0)
    .setInteractive({ useHandCursor: true });
  confirmHit.on('pointerover', () => {
    confirmGfx.lineStyle(1, confirmAccent.borderHover, 1); confirmGfx.strokeRoundedRect(confirmX, y, btnW, height, 3);
  });
  confirmHit.on('pointerout', () => {
    confirmGfx.lineStyle(1, confirmAccent.border, 1); confirmGfx.strokeRoundedRect(confirmX, y, btnW, height, 3);
  });
  confirmHit.on('pointerdown', onConfirm);

  const cancelGfx = scene.add.graphics();
  cancelGfx.fillStyle(0x1a0808, 1);
  cancelGfx.fillRoundedRect(cancelX, y, btnW, height, 3);
  cancelGfx.lineStyle(1, 0xcc3322, 1);
  cancelGfx.strokeRoundedRect(cancelX, y, btnW, height, 3);
  const cancelTxt = scene.add.text(cancelX + btnW / 2, y + height / 2, cancelLabel,
    uiStyle(10, UI.TXT_RED, { bold: true })).setOrigin(0.5);
  const cancelHit = scene.add.rectangle(cancelX + btnW / 2, y + height / 2, btnW, height, 0, 0)
    .setInteractive({ useHandCursor: true });
  cancelHit.on('pointerover', () => {
    cancelGfx.lineStyle(1, 0xff6655, 1); cancelGfx.strokeRoundedRect(cancelX, y, btnW, height, 3);
  });
  cancelHit.on('pointerout', () => {
    cancelGfx.lineStyle(1, 0xcc3322, 1); cancelGfx.strokeRoundedRect(cancelX, y, btnW, height, 3);
  });
  cancelHit.on('pointerdown', onCancel);

  return {
    objects: [confirmGfx, confirmTxt, confirmHit, cancelGfx, cancelTxt, cancelHit],
    height,
  };
}

/**
 * Small coloured badge (rarity, element, status): rounded background +
 * centred label, returned as a Container positioned at (x, y) — the
 * container's origin is the badge centre.
 */
export function drawBadge(
  scene: Phaser.Scene,
  x: number, y: number,
  label: string,
  bgColor: number,
  textColor: string = '#ffffff',
): Phaser.GameObjects.Container {
  const txt = scene.add.text(0, 0, label, uiStyle(9, textColor, { bold: true })).setOrigin(0.5);
  const padX = 6;
  const padY = 4;
  const w = Math.ceil(txt.width)  + padX * 2;
  const h = Math.ceil(txt.height) + padY * 2;

  const g = scene.add.graphics();
  g.fillStyle(bgColor, 0.9);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 3);
  g.lineStyle(1, bgColor, 0.45);
  g.strokeRoundedRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, 4);

  return scene.add.container(x, y, [g, txt]);
}

/**
 * Draw a pixel-art progress bar with shine stripe and segment ticks.
 */
export function drawBar(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  pct: number,
  fill: number, bg: number, shine: number,
): void {
  const fw = Math.max(0, Math.floor(w * Math.max(0, Math.min(1, pct))));

  g.fillStyle(bg, 1);
  g.fillRect(x, y, w, h);

  if (fw > 0) {
    g.fillStyle(fill, 1);
    g.fillRect(x, y, fw, h);

    // Top shine stripe
    g.fillStyle(shine, 0.22);
    g.fillRect(x, y, fw, Math.max(2, Math.ceil(h * 0.32)));

    // Pixel segment ticks every 25 px
    if (w > 50) {
      g.fillStyle(0x000000, 0.22);
      for (let tx = x + 25; tx < x + fw; tx += 25) {
        g.fillRect(tx, y, 1, h);
      }
    }
  }

  g.lineStyle(1, 0x000000, 0.45);
  g.strokeRect(x, y, w, h);
}

/**
 * Return a Phaser text style using the pixel font.
 */
export function pxStyle(
  size: number,
  color: string = UI.TXT_PARCHMENT,
  stroke = false,
): Phaser.Types.GameObjects.Text.TextStyle {
  const s: Phaser.Types.GameObjects.Text.TextStyle = {
    fontSize: `${size}px`,
    color,
    fontFamily: FONT,
    // Même raison que dans uiStyle() (voir sa doc) — "Press Start 2P" a des
    // courbes/diagonales qui aliasent tout autant sous le zoom NEAREST du jeu ;
    // ça ne rend pas la police moins "8-bit", juste ses bords moins déchiquetés.
    resolution: TEXT_RESOLUTION,
  };
  if (stroke) {
    s.stroke = '#000000';
    s.strokeThickness = 3;
  }
  return s;
}

// ============================================================
// LOOT STAT ROLLS — helpers d'affichage partagés Arsenal/Inventaire
// (docs/design/LOOT_STAT_ROLLS.md §7). Formatage pur (aucun GameObject créé
// ici) — les scènes restent responsables du rendu Phaser.
// ============================================================

/** Sépare une chaîne `StatsSystem.formatStat` en (valeur signée, libellé) — ex.
 *  "+91 PV" → { num: "+91", label: "PV" }. Le libellé peut contenir des espaces
 *  (ex. "PV Max", "Vit. d'attaque"), d'où le split sur le PREMIER espace seulement. */
function splitFormattedStat(full: string): { num: string; label: string } {
  const i = full.indexOf(' ');
  return i === -1 ? { num: full, label: '' } : { num: full.slice(0, i), label: full.slice(i + 1) };
}

/** Retire le signe "+" — non pertinent pour une fourchette catalogue (seule une
 *  valeur rollée a un signe qui a du sens à afficher). */
function stripSign(num: string): string {
  return num.replace(/^\+/, '');
}

/**
 * Ligne "label + fourchette" d'une stat catalogue — format Arsenal (§7.1) :
 * `PV  91 – 150`. Réutilise `StatsSystem.formatStat` pour dériver libellé et
 * suffixe % sans dupliquer STAT_LABELS/PERCENT_KEYS (source de vérité unique).
 */
export function formatRangedStatLine(range: RangedStat): string {
  const { num: minNum, label } = splitFormattedStat(StatsSystem.formatStat(range.key, range.min, range.isPercentage));
  const { num: maxNum } = splitFormattedStat(StatsSystem.formatStat(range.key, range.max, range.isPercentage));
  return `${label}  ${stripSign(minNum)} – ${stripSign(maxNum)}`;
}

/**
 * Fourchette seule, sans libellé — format Inventaire (§7.2), affichée en petit
 * gris juste après une valeur rollée : `(91–150)`.
 */
export function formatRangedStatBounds(range: RangedStat): string {
  const minNum = stripSign(splitFormattedStat(StatsSystem.formatStat(range.key, range.min, range.isPercentage)).num);
  const maxNum = stripSign(splitFormattedStat(StatsSystem.formatStat(range.key, range.max, range.isPercentage)).num);
  return `(${minNum}–${maxNum})`;
}

/** Qualité locale d'une ligne rollée (0–1) — q = (value-min)/(max-min), clampée.
 *  Ligne fixe (max <= min) : 0.5 neutre (ni bonne ni mauvaise, rien à jauger). */
export function lineQuality(value: number, min: number, max: number): number {
  if (max <= min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Couleur de qualité pour une Résonance globale OU une qualité locale de ligne,
 * exprimée en 0–100 — mêmes paliers pour les deux usages (docs/design/
 * LOOT_STAT_ROLLS.md §4.3/§7.2) : <30 gris sombre, 30–59 blanc, 60–84 cyan,
 * ≥85 or (Vibrante ET Parfaite partagent l'or — le scintillement de la
 * Parfaite est un traitement de notification de drop séparé, hors scope ici).
 */
export function resonanceColor(pct: number): string {
  if (pct >= 85) return UI.TXT_GOLD;
  if (pct >= 60) return UI.TXT_CYAN;
  if (pct >= 30) return UI.TXT_WHITE;
  return UI.TXT_MUTED;
}
