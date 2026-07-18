// ============================================================
// STATS PANEL — sections OFFENSE / DÉFENSE / UTILITAIRE partagées
// entre l'inventaire hors run (InventoryScene) et l'inventaire de
// run (RunBagScene modes 'view'/'extract').
//
// La capture de référence du créateur (18/07) impose EXACTEMENT le
// même panneau Statistiques dans les deux écrans : une seule source
// de rendu, sinon les deux copies divergeraient à la première passe
// d'équilibrage (règle §7 « cohérence inter-écrans » des guidelines).
// Extrait tel quel de InventoryScene.renderStats — le contenu
// (lignes, couleurs, zébrage, valeurs boostées en or) est inchangé.
// ============================================================

import { PlayerState } from '../types';
import { StatsSystem, BASE_CRIT_PCT, CRIT_PER_AGI_PCT, BASE_CRIT_MULT } from '../systems/StatsSystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { UI, TYPE, uiStyle, drawDivider } from './UITheme';
import { t } from '../i18n';

/**
 * Rend les trois groupes de statistiques dans un panneau de coin haut-gauche
 * (px, ·) et de largeur pw, à partir de startY. Chaque GameObject créé est
 * remis à l'appelant via `push` — chaque scène garde ainsi son propre cycle de
 * vie (dynamicObjs / track). Retourne le y atteint sous le dernier groupe.
 *
 * TOUTES les valeurs viennent de StatsSystem.computeAll (source de vérité) :
 * cs.atk/matk incluent DÉJÀ la main stat de l'arme — ne rien réadditionner.
 */
export function renderStatsSections(
  scene: Phaser.Scene,
  player: PlayerState,
  px: number, pw: number, startY: number,
  push: (go: Phaser.GameObjects.GameObject) => void,
): number {
  const cs = StatsSystem.computeAll(player);
  // Baseline « sans aucun équipement » (mêmes formules que computeAll, sans la
  // contribution du gear) — sert uniquement à savoir quelles stats afficher en
  // or parce qu'un équipement les booste réellement.
  const base = ProgressionSystem.computeBaseStats(player.level, player.attributes);
  const baseCrit    = BASE_CRIT_PCT + player.attributes.agi * CRIT_PER_AGI_PCT;
  const baseCritDmg = BASE_CRIT_MULT;
  const baseAspd    = 1;
  const hexOf = (c: string) => parseInt(c.replace('#', ''), 16);

  type Row = { label: string; value: string; boosted: boolean };
  interface Section { title: string; titleColor: string; accent: number; rows: Row[] }
  const sections: Section[] = [
    {
      title: t('stats.section_offense'),
      titleColor: UI.TXT_ORANGE, accent: hexOf(UI.TXT_ORANGE),
      rows: [
        { label: t('stats.atk'),        value: String(cs.atk),                 boosted: cs.atk > base.atk },
        { label: t('stats.matk'),       value: String(cs.matk),                boosted: cs.matk > base.magicAtk },
        { label: t('stats.crit_rate'),  value: `${cs.crit.toFixed(1)}%`,       boosted: cs.crit > baseCrit },
        { label: t('stats.crit_dmg'),   value: `×${cs.critDmg.toFixed(2)}`,    boosted: cs.critDmg > baseCritDmg },
        { label: t('stats.aspd'),       value: `×${cs.aspd.toFixed(2)}`,       boosted: cs.aspd > baseAspd },
        { label: t('stats.elem_bonus'), value: `+${cs.elemBonus.toFixed(0)}%`, boosted: cs.elemBonus > 0 },
      ],
    },
    {
      title: t('stats.section_defense'),
      titleColor: UI.TXT_BLUE, accent: hexOf(UI.TXT_BLUE),
      rows: [
        { label: t('stats.def'),    value: String(cs.def),      boosted: cs.def > base.def },
        { label: t('stats.mdef'),   value: String(cs.magicDef), boosted: cs.magicDef > base.magicDef },
        { label: t('stats.hp_max'), value: String(cs.hp),       boosted: cs.hp > base.maxHp },
        { label: t('stats.mp_max'), value: String(cs.mana),     boosted: cs.mana > base.maxMana },
      ],
    },
    {
      title: t('stats.section_utility'),
      titleColor: UI.TXT_CYAN, accent: UI.ACCENT_ARCANE,
      rows: [
        { label: t('stats.speed'),     value: String(cs.spd),                boosted: cs.spd > base.spd },
        { label: t('stats.lifesteal'), value: `${cs.lifesteal.toFixed(0)}%`, boosted: cs.lifesteal > 0 },
      ],
    },
  ];

  const COL1  = px + 16;
  const COL2  = px + pw - 16;
  // 26 px de ligne pour un texte de 14 px : 12 px d'air (cf. guidelines §2.2).
  const ROW_H = 26;
  let   y     = startY;

  for (const sec of sections) {
    // En-tête de section : pastille d'accent + label coloré + filet
    const hdrGfx = scene.add.graphics();
    hdrGfx.fillStyle(sec.accent, 0.9);
    hdrGfx.fillRoundedRect(px + 10, y + 1, 3, 10, 1.5);
    push(hdrGfx);

    const title = scene.add.text(px + 18, y, sec.title, uiStyle(TYPE.SMALL, sec.titleColor, { bold: true }));
    push(title);
    drawDivider(hdrGfx, px + 24 + title.width, y + 6, COL2 - (px + 24 + title.width), sec.accent, 0.18);

    y += 22;

    sec.rows.forEach((row, i) => {
      // Zébrage discret une ligne sur deux — lecture rapide en colonne
      if (i % 2 === 0) {
        const zebra = scene.add.graphics();
        zebra.fillStyle(0xffffff, 0.02);
        zebra.fillRoundedRect(px + 8, y - 4, pw - 16, ROW_H - 2, 3);
        push(zebra);
      }
      // Libellé et valeur à la MÊME taille (grille de 7 px : pas de palier entre
      // 10 et 14) — la hiérarchie passe par la couleur et la graisse : libellé
      // muted maigre, valeur grasse (or si un équipement la booste réellement).
      push(scene.add.text(COL1, y, row.label, uiStyle(TYPE.LABEL, UI.TXT_MUTED)));
      push(
        scene.add.text(COL2, y, row.value,
          uiStyle(TYPE.BODY, row.boosted ? UI.TXT_GOLD : UI.TXT_PARCHMENT, { bold: true }))
          .setOrigin(1, 0),
      );
      y += ROW_H;
    });

    y += 12; // respiration entre sections
  }
  return y;
}
