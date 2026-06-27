import Phaser from 'phaser';

export interface KeyBindings {
  up:        number;
  down:      number;
  left:      number;
  right:     number;
  attack:    number;
  dash:      number;
  skill1:    number;
  skill2:    number;
  skill3:    number;
  skill4:    number;
  inventory: number;
  skills:    number;
}

export const DEFAULT_BINDINGS: KeyBindings = {
  up:        Phaser.Input.Keyboard.KeyCodes.Z,
  down:      Phaser.Input.Keyboard.KeyCodes.S,
  left:      Phaser.Input.Keyboard.KeyCodes.Q,
  right:     Phaser.Input.Keyboard.KeyCodes.D,
  attack:    Phaser.Input.Keyboard.KeyCodes.W,
  dash:      Phaser.Input.Keyboard.KeyCodes.SHIFT,
  skill1:    Phaser.Input.Keyboard.KeyCodes.ONE,
  skill2:    Phaser.Input.Keyboard.KeyCodes.TWO,
  skill3:    Phaser.Input.Keyboard.KeyCodes.THREE,
  skill4:    Phaser.Input.Keyboard.KeyCodes.FOUR,
  inventory: Phaser.Input.Keyboard.KeyCodes.I,
  skills:    Phaser.Input.Keyboard.KeyCodes.K,
};

const STORAGE_KEY = 'grievy_keybindings';

export function loadBindings(): KeyBindings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_BINDINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_BINDINGS };
}

export function saveBindings(b: KeyBindings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(b)); } catch {}
}

export const ACTION_LABELS: Record<keyof KeyBindings, string> = {
  up:        'Haut',
  down:      'Bas',
  left:      'Gauche',
  right:     'Droite',
  attack:    'Attaque / Interagir',
  dash:      'Dash',
  skill1:    'Compétence 1',
  skill2:    'Compétence 2',
  skill3:    'Compétence 3',
  skill4:    'Compétence 4',
  inventory: 'Inventaire',
  skills:    'Compétences',
};
