/**
 * KeyIcons — pure mapping from a Phaser keycode to a frame index in the
 * `keyboard_ui` spritesheet (assets/sprites/ui/keyboard_ui.png, thème sombre,
 * grille 32×32, 23 colonnes × 15 lignes — voir ASSET_SOURCES.md).
 *
 * Ne couvre que les touches à une seule cellule (lettres, chiffres, flèches) —
 * SPACE/ESC/ENTER/TAB/SHIFT/CTRL/ALT/BACKSPACE n'ont pas de frame dédiée
 * (touches larges multi-cellules ou absentes du pack) : fallback texte requis.
 */
import Phaser from 'phaser';

const COLS = 23;
const frame = (row: number, col: number) => row * COLS + col;

const KC = Phaser.Input.Keyboard.KeyCodes;

/** Touche -> frame index dans le spritesheet `keyboard_ui` (thème sombre, colonnes 1-10). */
export const KEY_ICON_FRAME: Record<number, number> = {
  // Chiffres — ligne 1
  [KC.ONE]: frame(1, 1), [KC.TWO]: frame(1, 2), [KC.THREE]: frame(1, 3), [KC.FOUR]: frame(1, 4),
  [KC.FIVE]: frame(1, 5), [KC.SIX]: frame(1, 6), [KC.SEVEN]: frame(1, 7), [KC.EIGHT]: frame(1, 8),
  [KC.NINE]: frame(1, 9), [KC.ZERO]: frame(1, 10),
  // QWERTYUIOP — ligne 4
  [KC.Q]: frame(4, 1), [KC.W]: frame(4, 2), [KC.E]: frame(4, 3), [KC.R]: frame(4, 4),
  [KC.T]: frame(4, 5), [KC.Y]: frame(4, 6), [KC.U]: frame(4, 7), [KC.I]: frame(4, 8),
  [KC.O]: frame(4, 9), [KC.P]: frame(4, 10),
  // ASDFGHJKLM — ligne 5
  [KC.A]: frame(5, 1), [KC.S]: frame(5, 2), [KC.D]: frame(5, 3), [KC.F]: frame(5, 4),
  [KC.G]: frame(5, 5), [KC.H]: frame(5, 6), [KC.J]: frame(5, 7), [KC.K]: frame(5, 8),
  [KC.L]: frame(5, 9), [KC.M]: frame(5, 10),
  // ZXCVBN... — ligne 6
  [KC.Z]: frame(6, 1), [KC.X]: frame(6, 2), [KC.C]: frame(6, 3), [KC.V]: frame(6, 4),
  [KC.B]: frame(6, 5), [KC.N]: frame(6, 6),
  // Flèches — ligne 2 (symboles), colonnes 6-9
  [KC.UP]: frame(2, 6), [KC.DOWN]: frame(2, 7), [KC.LEFT]: frame(2, 8), [KC.RIGHT]: frame(2, 9),
};

/** Retourne le frame index pour une touche, ou undefined si non couverte (fallback texte). */
export function keyIconFrame(keyCode: number): number | undefined {
  return KEY_ICON_FRAME[keyCode];
}

/** Nom lisible d'une touche pour le fallback texte `[NOM]` (ex: 70 -> "F"). */
export function keyCodeLabel(keyCode: number): string {
  for (const [name, code] of Object.entries(KC)) {
    if (code === keyCode) return name;
  }
  return `#${keyCode}`;
}
