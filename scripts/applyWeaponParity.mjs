/**
 * ÉTAPE 3 — APPLIQUE la parité des armes + la re-tarification d'ASPD_PCT au catalogue.
 *
 * Réécriture CHIRURGICALE : on ne régénère pas les items (ça reshufflerait noms, lore,
 * icônes et substats de 336 objets pour un changement de deux nombres). On ne touche
 * QUE ce que le modèle vient de changer :
 *
 *   1. La MAIN STAT des armes  — weaponMainRange(type, rareté), qui dépend de TYPE_COEF.
 *      + `damage` / `magicDamage`, qui en sont le MIROIR (règle absolue CLAUDE.md).
 *   2. Les fourchettes de la substat ASPD_PCT — partout où elle apparaît (armes,
 *      armures, accessoires), car son CALIB passe de 1,010 à 2,197.
 *
 * ⚠ RAISONNE PAR BLOC, PAS PAR LIGNE. Une première version travaillait ligne à ligne :
 * elle a traité 385 armes sur 395 et a raté les 10 en silence — les 10 objets CACHÉS,
 * justement, parce qu'eux sont écrits en multi-ligne. Rater 10 objets sur 395 est une
 * erreur ; rater précisément les 10 plus rares du jeu en est une autre. Un script de
 * données doit COMPTER ce qu'il touche et le comparer à ce qu'il devait toucher.
 *
 * La source de vérité reste balanceModel.mjs : ce script ne décide d'AUCUN nombre, il
 * applique. Idempotent — relance-le après tout changement de TYPE_COEF ou de CALIB.
 */
import fs from 'fs';
import * as M from './balanceModel.mjs';

const FILES = ['src/data/items.ts', 'src/data/itemsGenerated.ts'];
const MAGIC_WEAPONS = new Set(['STAFF']);

const stats = { blocks: 0, weapons: 0, aspdLines: 0 };
const seenByType = {};

for (const file of FILES) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split(/\r?\n/);

  // Découpe en BLOCS d'item : un bloc va d'une ligne contenant `id: '...'` jusqu'à
  // la ligne précédant le prochain `id:` (ou la fin). Couvre mono- ET multi-ligne.
  const starts = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\{?\s*id:\s*'/.test(lines[i])) starts.push(i);
  }

  for (let b = 0; b < starts.length; b++) {
    const from = starts[b];
    const to = (b + 1 < starts.length ? starts[b + 1] : lines.length) - 1;
    const block = lines.slice(from, to + 1).join('\n');
    if (!block.includes('equipRanges:')) continue;
    stats.blocks++;

    const rarity = (block.match(/rarity:\s*ItemRarity\.(\w+)/) || [])[1];
    if (!rarity || !M.TIER[rarity]) continue;

    let out = block;

    // ── 1. MAIN STAT des armes ──────────────────────────────────
    const wt = (block.match(/weaponType:\s*WeaponType\.(\w+)/) || [])[1];
    const isWeapon = block.includes('type: ItemType.WEAPON');
    if (wt && isWeapon) {
      if (!M.TYPE_COEF[wt]) throw new Error(`TYPE_COEF manquant pour ${wt}`);
      const r = M.weaponMainRange(wt, rarity);
      const center = Math.round((r.min + r.max) / 2);
      const magic = MAGIC_WEAPONS.has(wt);
      const dmg  = magic ? Math.round(center * 0.45) : center;
      const mdmg = magic ? center : Math.round(center * 0.45);

      out = out.replace(
        /mainStat:\s*\{\s*key:\s*'(\w+)',\s*min:\s*\d+,\s*max:\s*\d+\s*\}/,
        `mainStat: { key: '$1', min: ${r.min}, max: ${r.max} }`,
      );
      // `magicDamage` d'abord, sinon /damage:\s*\d+/ mordrait dedans.
      out = out.replace(/magicDamage:\s*\d+/, `magicDamage: ${mdmg}`);
      out = out.replace(/(^|[^c])damage:\s*\d+/, `$1damage: ${dmg}`);

      stats.weapons++;
      seenByType[wt] = (seenByType[wt] || 0) + 1;
    }

    // ── 2. Substat ASPD_PCT (armes, armures, accessoires) ───────
    const a = M.substatRange('ASPD_PCT', rarity);
    const n = (out.match(/key:\s*'ASPD_PCT'/g) || []).length;
    if (n) {
      out = out.replace(
        /\{\s*key:\s*'ASPD_PCT',\s*min:\s*\d+,\s*max:\s*\d+(,\s*isPercentage:\s*true)?\s*\}/g,
        `{ key: 'ASPD_PCT', min: ${a.min}, max: ${a.max}, isPercentage: true }`,
      );
      stats.aspdLines += n;
    }

    if (out !== block) {
      const rewritten = out.split('\n');
      for (let k = 0; k < rewritten.length; k++) lines[from + k] = rewritten[k];
    }
  }

  fs.writeFileSync(file, lines.join('\n'));
}

console.log(`Blocs d'item examinés : ${stats.blocks}`);
console.log(`ARMES recalibrées     : ${stats.weapons}   ${stats.weapons === 395 ? '✓ les 395' : '❌ ATTENDU 395 — des armes ont été RATÉES'}`);
console.log(`Lignes ASPD_PCT       : ${stats.aspdLines}  → fourchette ${M.substatRange('ASPD_PCT', 'MYTHIC').min}–${M.substatRange('ASPD_PCT', 'MYTHIC').max}%`);
console.log('\nPar type :', Object.entries(seenByType).map(([k, v]) => `${k} ${v}`).join(' · '));

console.log('\nMain stat à MYTHIC (coef → fourchette) :');
for (const wt of Object.keys(M.TYPE_COEF)) {
  const r = M.weaponMainRange(wt, 'MYTHIC');
  console.log(`  ${wt.padEnd(12)} ×${M.TYPE_COEF[wt].toFixed(3)}  →  ${r.min}-${r.max}`);
}
if (stats.weapons !== 395) process.exit(1);
