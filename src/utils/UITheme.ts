// Shared pixel-art UI theme — medieval fantasy palette
// All scenes import from here to stay visually consistent.

import type { RangedStat } from '../types';
import { StatsSystem } from '../systems/StatsSystem';
import { StatRollSystem } from '../systems/StatRollSystem';
import { t } from '../i18n';

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

// ── Polices Neatpixels (ElvGames) — déclarées en @font-face dans index.html ──
// Une seule famille pixel dans TOUT le jeu (FONT), au lieu de l'ancien duo
// 'Press Start 2P' (monde) + Verdana (UI) qui juraient l'un avec l'autre.
/** Corps de texte : dialogues, menus, HUD, tooltips. */
export const FONT = "'Neatpixels', monospace";
/** Titres, noms de boss, écrans d'entrée de boss — plus lourde, plus solennelle. */
export const FONT_TITLE = "'Neatpixels Boss', 'Neatpixels', monospace";
/** HUD dense / petites valeurs chiffrées — la plus étroite des quatre. */
export const FONT_HUD = "'Neatpixels Minimal', 'Neatpixels', monospace";
/** Accents typographiques massifs (logo, chapitrage). */
export const FONT_DISPLAY = "'Neatpixels Blocks', 'Neatpixels', monospace";

/**
 * Résolution de rendu du texte (cf. `uiStyle`/`pxStyle`).
 *
 * Vaut 1 — c'est-à-dire : AUCUN supersampling. Ça mérite une explication, parce que
 * ce réglage a longtemps valu 4 à 10.
 *
 * Le jeu tourne en `pixelArt: true` : la texture d'un Text est affichée en NEAREST.
 * Avec les anciennes polices (Press Start 2P, Verdana), qui sont LISSES, le glyphe
 * rasterisé en canvas était anti-aliasé — et un anti-aliasing échantillonné en
 * NEAREST ressort grignoté. On compensait en rasterisant à ×4-×10 pour donner au
 * filtre « assez de matière ». Un pansement sur une incompatibilité de fond entre
 * une police lisse et un rendu pixel.
 *
 * Neatpixels est une police PIXEL : ses glyphes sont déjà des grilles de pixels
 * pleins, nets à l'échelle 1:1. Supersampler puis ré-échantillonner en NEAREST ne
 * l'améliore pas — ça la DÉGRADE (la minification ne retient qu'une fraction des
 * pixels rasterisés, et les traits d'un pixel de large disparaissent par endroits).
 * À résolution 1, le glyphe est écrit tel quel dans le canvas, et le navigateur
 * agrandit ensuite le tout par duplication de pixels (`image-rendering: pixelated`).
 * Net à tous les zooms, et des canvas de texte 16 à 100× plus petits au passage.
 */
let TEXT_RESOLUTION = 1;

/** À appeler une seule fois au boot (`main.ts`), après `new Phaser.Game()`.
 *  Conservé (l'appel existe dans main.ts) mais désormais sans effet : avec une
 *  police pixel, la bonne résolution est 1 quel que soit le zoom — voir ci-dessus. */
export function setTextResolution(_zoom: number): void {
  TEXT_RESOLUTION = 1;
}

/**
 * Police de l'interface. Historiquement Verdana : un choix de LISIBILITÉ, assumé
 * contre l'identité pixel, parce que 'Press Start 2P' était illisible aux petites
 * tailles. Neatpixels règle le dilemme — c'est une police pixel dessinée pour du
 * corps de texte, lisible là où Press Start 2P ne l'était pas.
 *
 * Conservé comme alias de FONT (plutôt que supprimé) : ~200 usages dans les scènes
 * s'appuient dessus, et un import unique évite un rename massif à faible valeur.
 * Le jeu n'a désormais plus qu'UNE famille de texte — cf. FONT_TITLE/FONT_HUD pour
 * les variantes de hiérarchie.
 */
export const FONT_UI = FONT;

/**
 * Échelle typographique — voir UI_UX_GUIDELINES.md §2.2.
 *
 * ⚠ TOUTES LES VALEURS SONT DES MULTIPLES DE 7. Ce n'est pas une coquetterie :
 * c'est la condition pour que le texte soit NET.
 *
 * Neatpixels est dessinée sur une grille de 7 pixels par em (mesuré dans le TTF :
 * ascendante = 2048 unités = 7 px, et toutes les avances de glyphe sont des
 * multiples de 2048/7). Une police pixel n'est nette QUE rastérisée à sa taille de
 * grille ou à un multiple entier : à 9, 10, 12, 13 ou 15 px — l'ancienne échelle —
 * chaque glyphe tombait ENTRE les pixels, et le rastériseur du navigateur
 * l'anti-aliasait. Ce flou est cuit dans le canvas 2D du Text AVANT que Phaser ne
 * voie quoi que ce soit : aucun réglage de filtrage (pixelArt, NEAREST, résolution
 * de texte) ne peut le rattraper après coup. C'est ce qui a fait tourner en rond
 * toutes les tentatives précédentes.
 *
 * Le corollaire est une échelle plus grossière — trois tailles au lieu de cinq. Elle
 * est native au pixel art : on ne peut pas avoir à la fois une grille de 7 px et
 * cinq paliers distincts en dessous de 21 px.
 *
 * Si l'échelle devait redevenir plus fine, il faudrait changer de police (une police
 * à grille de 8 px donnerait 8/16/24) ou passer les textes en BitmapText.
 */
export const TYPE = {
  /** Titres d'écran — rendus en police BOSS (cf. titleStyle), grille 18. */
  TITLE:   18,
  /** Titres de section, noms d'items — Standard, 3 × grille. */
  HEADING: 21,
  /** Corps de texte, dialogues, valeurs — Standard, 2 × grille. */
  BODY:    14,
  /** Libellés secondaires — MÊME taille que BODY : on les distingue par la COULEUR
   *  (UI.TXT_MUTED) et non par la taille. Une police à grille de 7 n'offre pas de
   *  palier intermédiaire entre 7 et 14, et 7 serait illisible pour un libellé. */
  LABEL:   14,
  /** Micro-texte, HUD dense, badges — rendus en police MINIMAL (cf. hudStyle),
   *  grille 10. C'est le seul moyen d'avoir un palier lisible sous 14 px : Standard
   *  n'offre que 7, trop petit. Minimal est justement dessinée pour ça. */
  SMALL:   10,
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
/**
 * Grille de dessin de CHAQUE variante Neatpixels, en pixels — mesurée dans les TTF
 * (toutes les avances de glyphe sont des multiples de `unitsPerEm / grille`).
 *
 * C'est le point qu'on avait manqué : les quatre polices n'ont PAS la même grille.
 * Une police pixel n'est nette qu'à sa taille de grille ou à un multiple entier ;
 * arrondir Boss au multiple de 7 le plus proche (18 → 21) la rendrait floue, alors
 * même qu'on l'utilise pour les titres. C'est aussi ce qui débloque la hiérarchie
 * typographique : trois polices, trois grilles, donc plus de paliers nets
 * disponibles qu'avec une seule.
 */
const FONT_GRIDS: { match: string; grid: number }[] = [
  { match: 'Neatpixels Boss',    grid: 18 }, // titres — 18 / 36
  { match: 'Neatpixels Minimal', grid: 10 }, // HUD dense — 10 / 20 / 30
  { match: 'Neatpixels Blocks',  grid: 7  },
  { match: 'Neatpixels',         grid: 7  }, // Standard (corps) — 7 / 14 / 21 / 28
];

/** Grille par défaut (Neatpixels Standard). */
export const FONT_GRID_PX = 7;

/** Grille de dessin de la famille de police donnée. */
export function fontGrid(fontFamily: string): number {
  // Ordre important : 'Neatpixels Boss' contient 'Neatpixels', donc on teste du plus
  // spécifique au plus générique.
  for (const { match, grid } of FONT_GRIDS) {
    if (fontFamily.includes(match)) return grid;
  }
  return FONT_GRID_PX;
}

/**
 * Recale une taille de police sur la grille de SA police.
 *
 * C'est LE verrou du rendu net, et il est ici plutôt que dans TYPE parce que ~160
 * appels dans les scènes passent une taille LITTÉRALE (`uiStyle(9, …)`,
 * `uiStyle(11, …)`) sans passer par TYPE. Corriger seulement TYPE aurait laissé la
 * grande majorité des textes du jeu hors grille — donc flous. En verrouillant au
 * point de passage unique, tout texte du jeu est net, y compris ceux qu'on écrira
 * demain sans y penser.
 *
 * Plancher à une case de grille : jamais de texte à 0.
 */
export function snapFontSize(size: number, fontFamily: string = FONT): number {
  const grid = fontGrid(fontFamily);
  return Math.max(grid, Math.round(size / grid) * grid);
}

/**
 * Choisit la POLICE et la TAILLE nette les plus proches de la taille demandée.
 *
 * C'est le cœur du système. Standard (grille 7) n'offre que 7, 14, 21, 28 : entre
 * 7 (illisible pour un libellé) et 14, il n'y a rien. Or ~87 appels dans les scènes
 * demandent 9 ou 10 px — du micro-texte parfaitement légitime (badges, hints,
 * valeurs de HUD). Les rabattre sur 7 px les aurait rendus minuscules ; les monter à
 * 14 px aurait fait exploser tous les layouts denses.
 *
 * La réponse est dans le pack lui-même : Neatpixels Minimal est dessinée sur une
 * grille de 10 px, précisément pour ce registre. On route donc les petites tailles
 * vers Minimal (10 px, net) et les autres vers Standard (14/21/28, net).
 *
 * Faire ce choix ICI plutôt que dans chaque scène, c'est ce qui permet de corriger
 * les 87 appels sans en toucher un seul — et de garantir que tout texte écrit demain
 * tombera lui aussi sur une grille.
 */
export function resolveFont(size: number): { family: string; size: number } {
  if (size <= 11) return { family: FONT_HUD, size: 10 };            // Minimal — micro-texte
  return { family: FONT, size: snapFontSize(size, FONT) };          // Standard — 14 / 21 / 28
}

export function uiStyle(
  size: number,
  color: string = UI.TXT_PARCHMENT,
  opts: UiStyleOpts = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  const { family, size: px } = resolveFont(size);
  const s: Phaser.Types.GameObjects.Text.TextStyle = {
    // Taille ET police choisies ensemble : hors grille, le rastériseur du navigateur
    // anti-aliase le glyphe, et ce flou est cuit dans le canvas avant même que Phaser
    // ne le voie — aucun filtrage ne le rattrape après coup (cf. doc de TYPE).
    fontSize:   `${px}px`,
    color,
    fontFamily: family,
    // resolution 1 : la police est déjà nette à l'échelle 1:1 ; sur-échantillonner
    // puis ré-échantillonner en NEAREST la dégraderait (cf. doc de TEXT_RESOLUTION).
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
 * Style de TITRE D'ÉCRAN — police Neatpixels Boss (grille 18).
 *
 * Une police différente, plus lourde, plutôt qu'un simple palier de taille au-dessus :
 * c'est ce qui redonne au titre sa domination. Depuis le recalage sur grille, un titre
 * en Standard tombait à la même taille que le corps de texte — la hiérarchie avait
 * purement et simplement disparu.
 */
export function titleStyle(
  color: string = UI.TXT_GOLD,
  opts: UiStyleOpts = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  const s: Phaser.Types.GameObjects.Text.TextStyle = {
    fontSize:   `${snapFontSize(TYPE.TITLE, FONT_TITLE)}px`,
    color,
    fontFamily: FONT_TITLE,
    resolution: TEXT_RESOLUTION,
  };
  if (opts.bold)   s.fontStyle = 'bold';
  if (opts.stroke) { s.stroke = '#000000'; s.strokeThickness = 3; }
  if (opts.wordWrapWidth !== undefined) s.wordWrap = { width: opts.wordWrapWidth };
  if (opts.align !== undefined)         s.align = opts.align;
  return s;
}

/**
 * Tronque un texte pour qu'il tienne dans `maxWidth` PIXELS, avec une ellipse.
 *
 * Remplace les troncatures au nombre de CARACTÈRES (`slice(0, 4)`, `slice(0, 15)`…)
 * qui parsèment les scènes. Une troncature au caractère ne veut rien dire : « MMMM »
 * et « iiii » n'ont pas la même largeur, et surtout elle ne sait rien de la police ni
 * de sa taille. C'est la cause structurelle des débordements — chaque changement de
 * typo les faisait tous réapparaître ailleurs.
 *
 * Mesure réelle via un Text jetable (même coût que ce que font déjà `drawBadge` et le
 * calcul de hauteur du popup d'inventaire).
 */
export function fitText(
  scene: Phaser.Scene,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
  maxWidth: number,
): string {
  // `wordWrap` retiré de la sonde : avec lui, `probe.width` vaut la largeur de WRAP et
  // non celle du texte — la recherche binaire mesurerait une constante et renverrait
  // n'importe quoi. On mesure toujours sur une seule ligne.
  const probeStyle = { ...style };
  delete probeStyle.wordWrap;

  const probe = scene.make.text({ text, style: probeStyle }, false);
  if (probe.width <= maxWidth) { probe.destroy(); return text; }

  // Recherche du plus long préfixe qui tient, ellipse comprise.
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    probe.setText(`${text.slice(0, mid)}…`);
    if (probe.width <= maxWidth) lo = mid; else hi = mid - 1;
  }
  probe.destroy();
  // Même un seul caractère + ellipse ne tient pas : on rend l'ellipse seule plutôt
  // qu'une chaîne vide. Un label qui DISPARAÎT est pire qu'un label tronqué — le
  // joueur ne sait même plus qu'il y avait quelque chose là.
  return lo <= 0 ? '…' : `${text.slice(0, lo)}…`;
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

/**
 * Découpe neuf-tranches d'une texture, BAKÉE une fois pour toutes à la taille
 * demandée, et mise en cache sous la clé `<texKey>@<w>x<h>`.
 *
 * Motif — le bug du cadre qui disparaît au scroll de l'inventaire :
 * `addUiFrame` créait un `NineSlice`, qui est un GameObject à base de **Mesh**.
 * La grille virtualisée en détruit et recrée des centaines par seconde pendant
 * le scroll, sous masque géométrique. Dans ces conditions le Mesh lâchait : le
 * cadre d'une case ne se dessinait plus, alors que le `Graphics` de fond et
 * l'`Image` de l'icône de la MÊME case, eux, tenaient. Visuellement, la case
 * perdait d'un coup son intérieur gris ET sa bordure dorée (les deux vivent dans
 * cette unique texture) et laissait voir le bleu nuit de drawSlot dessous.
 *
 * En bakant la découpe en amont, une case n'affiche plus qu'une `Image` ordinaire
 * à sa taille native — le chemin de rendu le plus robuste et le plus léger de
 * Phaser. Zéro Mesh, zéro étirement au moment du rendu, et une seule texture
 * partagée par toutes les cases d'une même taille.
 *
 * Le bake reproduit exactement la géométrie du NineSlice : les quatre coins
 * (`slice`×`slice`) sont copiés à l'échelle 1:1 — donc restent nets — seuls les
 * bords et le centre sont étirés, avec le lissage désactivé.
 */
function slicedFrameTexture(
  scene: Phaser.Scene, texKey: string, w: number, h: number, slice: number,
): string | null {
  const key = `${texKey}@${w}x${h}`;
  if (scene.textures.exists(key)) return key;

  const src = scene.textures.get(texKey).getSourceImage();
  if (!(src instanceof HTMLImageElement) && !(src instanceof HTMLCanvasElement)) return null;
  const sw = src.width;
  const sh = src.height;
  // Cadre trop petit pour porter ses propres coins : la découpe n'a pas de sens.
  if (sw <= slice * 2 || sh <= slice * 2 || w <= slice * 2 || h <= slice * 2) return null;

  const canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;

  // Bandes source / destination : coin | milieu étiré | coin.
  const sx = [0, slice, sw - slice];
  const sy = [0, slice, sh - slice];
  const sWid = [slice, sw - slice * 2, slice];
  const sHei = [slice, sh - slice * 2, slice];
  const dx = [0, slice, w - slice];
  const dy = [0, slice, h - slice];
  const dWid = [slice, w - slice * 2, slice];
  const dHei = [slice, h - slice * 2, slice];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.drawImage(
        src,
        sx[c]!, sy[r]!, sWid[c]!, sHei[r]!,
        dx[c]!, dy[r]!, dWid[c]!, dHei[r]!,
      );
    }
  }
  scene.textures.addCanvas(key, canvas);
  return key;
}

/**
 * Cadre UI en VRAI asset pixel art (packs GUI Kit / Retro Inventory — voir
 * ASSET_SOURCES.md §ui/), posé PAR-DESSUS le fond dessiné par drawSlot/drawCard.
 * (cx, cy) = CENTRE du cadre (aligné sur les conventions d'Image Phaser).
 *
 * Renvoie une `Image` à sa taille native, découpée en neuf tranches EN AMONT
 * (cf. slicedFrameTexture) — plus de `NineSlice` à l'exécution, dont le Mesh
 * décrochait sous le scroll virtualisé de l'inventaire.
 *
 * Texture absente (script scripts/copy-ui-assets.mjs pas lancé) : retourne null —
 * l'appelant garde son rendu Graphics existant, rien ne casse.
 */
export function addUiFrame(
  scene: Phaser.Scene,
  cx: number, cy: number, w: number, h: number,
  texKey = 'ui_slot_frame',
  slice = 8,
): Phaser.GameObjects.Image | null {
  if (!scene.textures.exists(texKey)) return null;
  const baked = slicedFrameTexture(scene, texKey, Math.round(w), Math.round(h), slice);
  // Bake impossible (cadre dégénéré) : repli sur l'étirement direct, qui reste
  // meilleur que pas de cadre du tout.
  if (!baked) return scene.add.image(cx, cy, texKey).setDisplaySize(w, h);
  return scene.add.image(cx, cy, baked);
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
  if (pct >= 10) return `${Math.round(pct)}%`;
  if (pct >= 1)  return `${pct.toFixed(1)}%`;
  // Un taux non nul ne doit JAMAIS s'afficher « 0.00% » : le joueur en conclurait
  // que le drop est impossible, alors qu'il est simplement très rare (un Hidden est
  // à 0,07%). En dessous du seuil affichable, on le dit explicitement.
  if (pct > 0 && pct < 0.01) return '<0.01%';
  return `${pct.toFixed(2)}%`;
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
    // Même verrou que uiStyle() : taille recalée sur la grille de 7 px de Neatpixels,
    // sans quoi le glyphe est anti-aliasé à la rastérisation (cf. doc de TYPE).
    fontSize: `${snapFontSize(size, FONT)}px`,
    color,
    fontFamily: FONT,
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

/**
 * Ligne de Résonance affichée au joueur : `Résonance 72% — Claire`.
 *
 * `StatRollSystem.getResonanceLabel()` renvoie un libellé FRANÇAIS qui sert de
 * CLÉ dans la logique (`label === 'Vibrante'` conditionne les notifications de
 * drop) : on ne peut pas le traduire à la source sans casser ces comparaisons.
 * On le traduit donc ICI, au point d'affichage — les trois sites qui montraient
 * cette ligne la composaient chacun à la main, en français en dur.
 */
export function formatResonanceLine(quality: number): string {
  const key = StatRollSystem.getResonanceLabel(quality);
  return `${t('resonance.label')} ${quality}% — ${t(`resonance.${key}`)}`;
}
