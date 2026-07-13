// ============================================================
// SEARCH FIELD — champ de recherche réutilisable (Arsenal / Bestiaire / Sac)
//
// Le contenu a explosé (649 items, 196 monstres, jusqu'à 400 objets en sac) :
// les trois écrans à liste ont besoin du MÊME champ de recherche, et surtout du
// même comportement (filtre à la frappe, insensible casse/accents, croix
// d'effacement, Échap qui vide avant de fermer).
//
// L'abstraction : ce helper possède la SAISIE, l'ÉTAT et le RENDU du champ.
// Il ne connaît rien des listes. Chaque scène lui passe un `onChange(query)` et
// applique elle-même son propre prédicat de filtrage sur sa propre structure
// (rangées groupées d'Arsenal/Bestiaire, grille virtualisée + onglets du sac).
// C'est la seule frontière qui marche : les trois listes n'ont aucune structure
// commune, mais elles ont exactement le même champ.
//
// ── SAISIE : <input> DOM invisible, PAS de capture clavier Phaser ────────────
// Le champ visible est rendu en Phaser (donc 100 % uiStyle/UI.* — sur grille,
// net, masquable, profondeur maîtrisée). Ce qui CAPTURE les touches est un
// <input> DOM transparent (opacity 0) superposé exactement sur le cadre, comme
// le fait déjà NameInputScene.
//
// Pourquoi le DOM plutôt qu'un `keyboard.on('keydown')` Phaser :
//   1. TACTILE — un <input> focalisé ouvre le clavier SYSTÈME. Une capture
//      Phaser ne le fait pas : sur mobile, la recherche serait inutilisable.
//   2. ACCENTS / IME / presse-papiers — « Épée » se tape avec une touche morte
//      ou une composition IME ; `event.key` d'un keydown Phaser ne restitue pas
//      ces séquences de façon fiable. L'input DOM les gère nativement.
//   3. `font-size: 16px` sur l'input évite le zoom automatique d'iOS au focus.
// Le rendu, lui, reste Phaser : un input DOM VISIBLE flotterait au-dessus du
// canvas quelles que soient les profondeurs (il passerait par-dessus les popups
// et tooltips, et sa police échapperait à la grille Neatpixels).
//
// Isolation clavier : tant que l'input a le focus, `keydown`/`keyup` sont
// stoppés (`stopPropagation`) AVANT d'atteindre le window listener de Phaser —
// sans quoi taper « zweihander » déclencherait le raccourci Z (= action
// principale) de l'inventaire. Seules ↑/↓ sont laissées passer (navigation de
// liste d'Arsenal/Bestiaire, documentée dans les hints) et Échap est traité ici.
// ============================================================

import { UI, TYPE, LAYOUT, uiStyle, fitText } from './UITheme';

/** Minuscules + suppression des diacritiques (« Épée » → « epee ») + trim. */
export function normalizeSearch(raw: string): string {
  return raw
    .normalize('NFD')
    // NFD sépare « É » en « E » + marque combinante ; \p{M} supprime la marque —
    // c'est ce qui fait matcher « epee » sur « Épée » (cible ES2020, /u requis).
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Vrai si TOUS les mots de `query` (déjà normalisée via `normalizeSearch`) se
 * retrouvent dans l'un des champs fournis. Les champs sont normalisés ici :
 * l'appelant passe du texte LOCALISÉ brut (`localizeItem(item).name`, etc.).
 *
 * Requête vide = tout passe (le filtre est alors inerte).
 */
export function matchesSearch(query: string, ...fields: (string | undefined | null)[]): boolean {
  if (query.length === 0) return true;
  const hay = normalizeSearch(fields.filter((f): f is string => !!f).join(' '));
  for (const token of query.split(/\s+/)) {
    if (token.length > 0 && !hay.includes(token)) return false;
  }
  return true;
}

export interface SearchFieldOpts {
  /** Coin haut-gauche du cadre. */
  x: number;
  y: number;
  w: number;
  /** Défaut : LAYOUT.TOUCH_MIN (44) — le cadre EST la zone tactile. */
  h?: number;
  placeholder: string;
  /** Appelé à CHAQUE frappe avec la requête NORMALISÉE (peut être ''). */
  onChange: (query: string) => void;
  /** Échap alors que le champ est déjà vide ET focalisé (→ fermer l'écran). */
  onEscape?: () => void;
  depth?: number;
  maxLength?: number;
  /** Suffixe d'id du <input> DOM — unique par scène. */
  domId?: string;
}

/** Réserve à gauche (glyphe loupe) et à droite (croix d'effacement). */
const PAD_LEFT  = 30;
const CLEAR_W   = 34;
const MAX_LENGTH_DEFAULT = 32;

export class SearchField {
  private readonly scene: Phaser.Scene;
  private readonly x: number;
  private readonly y: number;
  private readonly w: number;
  private readonly h: number;
  private readonly depth: number;
  private readonly placeholder: string;
  private readonly onChange: (query: string) => void;
  private readonly onEscape?: () => void;

  private readonly frame: Phaser.GameObjects.Graphics;
  private readonly valueTxt: Phaser.GameObjects.Text;
  private readonly caret: Phaser.GameObjects.Rectangle;
  private caretTween: Phaser.Tweens.Tween | null = null;
  private readonly clearGlyph: Phaser.GameObjects.Text;
  private readonly clearHit: Phaser.GameObjects.Rectangle;

  private readonly input: HTMLInputElement;
  private readonly onDomInput:   () => void;
  private readonly onDomKeyDown: (e: KeyboardEvent) => void;
  private readonly onDomKeyUp:   (e: KeyboardEvent) => void;
  private readonly onDomFocus:   () => void;
  private readonly onDomBlur:    () => void;
  private readonly onResize:     () => void;

  private focused = false;
  private raw  = '';
  private norm = '';
  private destroyed = false;

  constructor(scene: Phaser.Scene, opts: SearchFieldOpts) {
    this.scene       = scene;
    this.x           = opts.x;
    this.y           = opts.y;
    this.w           = opts.w;
    this.h           = opts.h ?? LAYOUT.TOUCH_MIN;
    this.depth       = opts.depth ?? 12;
    this.placeholder = opts.placeholder;
    this.onChange    = opts.onChange;
    this.onEscape    = opts.onEscape;

    // ── Rendu Phaser ────────────────────────────────────────────────────────
    this.frame = scene.add.graphics().setDepth(this.depth);
    this.drawFrame();

    const cy = this.y + this.h / 2;
    this.valueTxt = scene.add
      .text(this.x + PAD_LEFT, cy, this.placeholder, SearchField.textStyle(false))
      .setOrigin(0, 0.5)
      .setDepth(this.depth + 1);

    this.caret = scene.add
      .rectangle(this.x + PAD_LEFT, cy, 2, 16, 0xffffff, 0.9)
      .setOrigin(0, 0.5)
      .setDepth(this.depth + 1)
      .setVisible(false);

    this.clearGlyph = scene.add
      .text(this.x + this.w - CLEAR_W / 2, cy, '×', uiStyle(TYPE.BODY, UI.TXT_MUTED, { bold: true }))
      .setOrigin(0.5)
      .setDepth(this.depth + 1)
      .setVisible(false);

    // Hit zone ≥ 44 px (LAYOUT.TOUCH_MIN) — plus large que le glyphe.
    this.clearHit = scene.add
      .rectangle(this.x + this.w - CLEAR_W / 2, cy, LAYOUT.TOUCH_MIN, LAYOUT.TOUCH_MIN, 0x000000, 0)
      .setDepth(this.depth + 2)
      .setVisible(false);
    this.clearHit.setInteractive({ useHandCursor: true });
    this.clearHit.on('pointerover', () => this.clearGlyph.setColor(UI.TXT_ORANGE));
    this.clearHit.on('pointerout',  () => this.clearGlyph.setColor(UI.TXT_MUTED));
    this.clearHit.on('pointerdown', () => {
      // Feedback < 100 ms (guidelines §1.3) avant le re-rendu de la liste
      this.scene.tweens.add({
        targets: this.clearGlyph, scaleX: 0.8, scaleY: 0.8, duration: 60, yoyo: true,
      });
      this.clear();
      this.input.focus();
    });

    // ── Capture DOM ─────────────────────────────────────────────────────────
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `gtd-search-${opts.domId ?? scene.scene.key}`;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.maxLength = opts.maxLength ?? MAX_LENGTH_DEFAULT;
    input.setAttribute('aria-label', this.placeholder);
    Object.assign(input.style, {
      position:   'fixed',
      // Transparent : le champ VISIBLE est le rendu Phaser ci-dessus. Cet input
      // n'est qu'une surface de capture (focus, clavier système, IME, collage).
      // opacity 0 (et non display/visibility) : l'élément reste focalisable et
      // reçoit les taps.
      opacity:    '0',
      background: 'transparent',
      border:     'none',
      outline:    'none',
      padding:    '0',
      margin:     '0',
      // 16px : en dessous, iOS Safari zoome automatiquement à la prise de focus.
      fontSize:   '16px',
      zIndex:     '5',
    });
    document.body.appendChild(input);
    this.input = input;
    this.syncInputBox();

    this.onDomInput = () => {
      if (this.destroyed) return;
      this.setValue(this.input.value, true);
    };
    this.onDomKeyDown = (e: KeyboardEvent) => {
      // ↑/↓ : laissées remonter jusqu'à Phaser (navigation de liste des écrans
      // Arsenal/Bestiaire). preventDefault seulement pour que le caret ne saute
      // pas en début/fin de champ.
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        return;
      }
      // Tout le reste est CONSOMMÉ ici : sans ça, chaque lettre tapée
      // atteindrait le window listener de Phaser et déclencherait les raccourcis
      // de la scène (Z = action principale de l'inventaire, etc.).
      e.stopPropagation();
      if (e.key === 'Escape') {
        e.preventDefault();
        // Échap VIDE la recherche avant de fermer quoi que ce soit.
        if (!this.clear()) {
          this.input.blur();
          this.onEscape?.();
        }
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        this.input.blur();   // referme le clavier système sur mobile
      }
    };
    this.onDomKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') return;
      e.stopPropagation();
    };
    this.onDomFocus = () => { this.focused = true;  this.drawFrame(); this.syncCaret(); };
    this.onDomBlur  = () => { this.focused = false; this.drawFrame(); this.syncCaret(); };
    input.addEventListener('input',   this.onDomInput);
    input.addEventListener('keydown', this.onDomKeyDown);
    input.addEventListener('keyup',   this.onDomKeyUp);
    input.addEventListener('focus',   this.onDomFocus);
    input.addEventListener('blur',    this.onDomBlur);

    // Le canvas est en Scale.FIT : sa boîte à l'écran change au redimensionnement
    // (et à l'ouverture du clavier système sur mobile) — l'overlay DOM doit suivre.
    this.onResize = () => this.syncInputBox();
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize);

    // Auto-focus au clavier UNIQUEMENT sur un appareil sans tactile : sur mobile,
    // ça ferait surgir le clavier système à l'ouverture de l'écran, par-dessus la
    // liste que le joueur vient d'ouvrir.
    if (!scene.sys.game.device.input.touch) input.focus();
  }

  /** Requête courante, NORMALISÉE (minuscules, sans accents). '' si vide. */
  get query(): string {
    return this.norm;
  }

  hasQuery(): boolean {
    return this.norm.length > 0;
  }

  /**
   * Vide le champ. Retourne `true` s'il y avait quelque chose à effacer (et
   * notifie alors la scène) — `false` s'il était déjà vide : c'est ce booléen
   * qui permet à l'appelant d'enchaîner sur la fermeture de l'écran (Échap).
   */
  clear(): boolean {
    if (this.norm.length === 0) return false;
    this.input.value = '';
    this.setValue('', true);
    return true;
  }

  focus(): void {
    this.input.focus();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.input.removeEventListener('input',   this.onDomInput);
    this.input.removeEventListener('keydown', this.onDomKeyDown);
    this.input.removeEventListener('keyup',   this.onDomKeyUp);
    this.input.removeEventListener('focus',   this.onDomFocus);
    this.input.removeEventListener('blur',    this.onDomBlur);
    if (this.input.parentNode) this.input.parentNode.removeChild(this.input);
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize);
    if (this.caretTween) { this.caretTween.stop(); this.caretTween = null; }
    this.frame.destroy();
    this.valueTxt.destroy();
    this.caret.destroy();
    this.clearGlyph.destroy();
    this.clearHit.destroy();
  }

  // ── Interne ───────────────────────────────────────────────────────────────

  /**
   * Style du contenu du champ. La SAISIE est du corps de texte (TYPE.BODY, grille
   * Standard 14) ; le PLACEHOLDER descend en TYPE.SMALL (grille Minimal 10, sa
   * propre grille — donc net aussi) : c'est un hint, et à 14 px il n'entrait pas
   * dans la colonne de liste de 259 px sans se faire tronquer par fitText.
   */
  private static textStyle(filled: boolean): Phaser.Types.GameObjects.Text.TextStyle {
    return filled
      ? uiStyle(TYPE.BODY,  UI.TXT_PARCHMENT)
      : uiStyle(TYPE.SMALL, UI.TXT_HINT);
  }

  private setValue(raw: string, emit: boolean): void {
    this.raw  = raw;
    const next = normalizeSearch(raw);
    const changed = next !== this.norm;
    this.norm = next;

    const has = this.raw.length > 0;
    const style = SearchField.textStyle(has);
    const maxW  = this.textMaxWidth();
    this.valueTxt.setStyle(style);
    this.valueTxt.setText(fitText(this.scene, has ? this.raw : this.placeholder, style, maxW));

    this.clearGlyph.setVisible(has);
    this.clearHit.setVisible(has);
    // L'input DOM recule pour laisser la croix (rendue en Phaser, sous le DOM)
    // recevoir les taps — sinon la surface de capture les intercepterait.
    this.syncInputBox();
    this.syncCaret();

    if (emit && changed) this.onChange(this.norm);
  }

  private textMaxWidth(): number {
    return Math.max(20, this.w - PAD_LEFT - CLEAR_W - 4);
  }

  private syncCaret(): void {
    const visible = this.focused;
    this.caret.setVisible(visible);
    if (!visible) {
      if (this.caretTween) { this.caretTween.stop(); this.caretTween = null; }
      this.caret.setAlpha(0.9);
      return;
    }
    this.caret.setX(Math.min(
      this.x + PAD_LEFT + this.valueTxt.width + 2,
      this.x + PAD_LEFT + this.textMaxWidth(),
    ));
    if (!this.caretTween) {
      this.caretTween = this.scene.tweens.add({
        targets: this.caret, alpha: { from: 0.9, to: 0.1 },
        duration: 500, yoyo: true, repeat: -1,
      });
    }
  }

  /** Recale l'overlay DOM sur le cadre Phaser, en pixels CSS. */
  private syncInputBox(): void {
    const cam    = this.scene.cameras.main;
    const canvas = this.scene.sys.game.canvas;
    const rect   = canvas.getBoundingClientRect();
    const sx = rect.width  / cam.width;
    const sy = rect.height / cam.height;
    // Largeur réduite quand la croix est affichée : la croix est un objet Phaser
    // (sous le DOM), elle doit rester atteignable au tap.
    const boxW = this.w - (this.raw.length > 0 ? CLEAR_W : 0);
    Object.assign(this.input.style, {
      left:   `${rect.left + this.x * sx}px`,
      top:    `${rect.top  + this.y * sy}px`,
      width:  `${boxW * sx}px`,
      height: `${this.h * sy}px`,
    });
  }

  private drawFrame(): void {
    const g = this.frame;
    g.clear();
    g.fillStyle(UI.BG_DEEP, 0.92);
    g.fillRoundedRect(this.x, this.y, this.w, this.h, LAYOUT.CARD_RADIUS + 2);
    g.lineStyle(1, this.focused ? UI.ACCENT_ARCANE : UI.SEPARATOR, this.focused ? 0.9 : 1);
    g.strokeRoundedRect(this.x, this.y, this.w, this.h, LAYOUT.CARD_RADIUS + 2);

    // Loupe — tracée en Graphics (pas un glyphe de police : Neatpixels n'a pas
    // de symbole loupe, et une émoji casserait la grille typographique).
    const cx = this.x + 15;
    const cy = this.y + this.h / 2;
    const accent = this.focused ? UI.ACCENT_ARCANE : UI.BORDER_LIT;
    g.lineStyle(2, accent, this.focused ? 0.95 : 0.75);
    g.strokeCircle(cx - 1, cy - 2, 5);
    g.lineBetween(cx + 2, cy + 2, cx + 6, cy + 6);
  }
}
