#!/usr/bin/env node
/**
 * copy-ui-assets.mjs — copie les assets UI retenus depuis la bibliothèque
 * source (assets/Bundle_extracted/, non versionnée) vers public/assets/.
 *
 * À lancer UNE FOIS depuis la racine du repo :
 *   node scripts/copy-ui-assets.mjs
 *
 * Pourquoi un script : l'agent UI ne peut pas copier de fichiers binaires ;
 * ce script rend l'opération reproductible et documentée. Le code du jeu
 * (PreloaderScene) est tolérant : si un fichier manque, l'UI retombe sur les
 * placeholders/rendu Graphics existants — rien ne casse.
 *
 * Fichiers copiés (voir public/assets/ASSET_SOURCES.md §ui/) :
 *  - Icons 16x16 Transparent.png  → ui_icons_16.png   (glyphes blancs teintés
 *    au bake pour les icônes de skills/talents — grille 16×16 px attendue
 *    256×336 = 16 col × 21 lignes, vérifiée ci-dessous)
 *  - Retro Inventory Slot_2       → ui_slot_frame.png (cadre de slot sombre+or)
 *  - GUI Kit UI 03 Slot_01        → ui_tab_frame.png  (fond d'onglet bleu nuit)
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const GUI   = join(ROOT, 'assets', 'Bundle_extracted', 'Pixelart Graphical User Interface', 'Pixelart Graphical User Interface');
const RETRO = join(ROOT, 'assets', 'Bundle_extracted', 'Retro Inventory', 'Retro Inventory', 'Original');
const DEST  = join(ROOT, 'public', 'assets', 'sprites', 'ui');

const COPIES = [
  {
    src: join(GUI, 'Icons Sprite Sheets', 'Icons 16x16 Transparent.png'),
    dst: join(DEST, 'ui_icons_16.png'),
    // Géométrie attendue par PreloaderScene (spritesheet frameWidth/Height 16,
    // indices de frames = ligne * 16 + colonne).
    expect: { w: 256, h: 336 },
  },
  {
    src: join(RETRO, 'Inventory_Slot_2.png'),
    dst: join(DEST, 'ui_slot_frame.png'),
  },
  {
    src: join(GUI, 'User Interface 03', 'Inventory_Slot_01.png'),
    dst: join(DEST, 'ui_tab_frame.png'),
  },
];

/** Lit width/height du IHDR d'un PNG (octets 16-23, big-endian). */
function pngSize(path) {
  const buf = readFileSync(path);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

mkdirSync(DEST, { recursive: true });

let failures = 0;
for (const { src, dst, expect } of COPIES) {
  if (!existsSync(src)) {
    console.error(`✗ INTROUVABLE : ${src}`);
    failures++;
    continue;
  }
  copyFileSync(src, dst);
  const { w, h } = pngSize(dst);
  let note = `${w}×${h}`;
  if (expect && (w !== expect.w || h !== expect.h)) {
    note += `  ⚠ ATTENDU ${expect.w}×${expect.h} — ajuster la géométrie du spritesheet dans PreloaderScene !`;
    failures++;
  }
  console.log(`✓ ${dst}  (${note})`);
}

process.exit(failures > 0 ? 1 : 0);
