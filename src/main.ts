import Phaser from 'phaser';
import { BootScene }      from './scenes/BootScene';
import { PreloaderScene } from './scenes/PreloaderScene';
import { MainMenuScene }  from './scenes/MainMenuScene';
import { NameInputScene } from './scenes/NameInputScene';
import { IntroScene }     from './scenes/IntroScene';
import { GameScene }      from './scenes/GameScene';
import { UIScene }        from './scenes/UIScene';
import { DialogueScene }  from './scenes/DialogueScene';
import { InventoryScene } from './scenes/InventoryScene';
import { SkillScene }     from './scenes/SkillScene';
import { EndingScene }    from './scenes/EndingScene';
import { ShopScene }      from './scenes/ShopScene';
import { PauseScene }     from './scenes/PauseScene';
import { BestiaryScene }  from './scenes/BestiaryScene';
import { ArsenalScene }   from './scenes/ArsenalScene';
import { setTextResolution } from './utils/UITheme';

// Le monkeypatch qui forçait LINEAR sur la texture de chaque `add.text()` a été
// RETIRÉ. Il n'existait que pour sauver du filtrage NEAREST des polices LISSES
// (Press Start 2P, Verdana) qui n'y survivaient pas. Le jeu est passé à Neatpixels,
// une police PIXEL : elle veut NEAREST et y est nette. Forcer LINEAR dessus la
// rendrait floue — exactement le défaut qu'on cherchait à supprimer.

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  // ── Filtre pixel art : REMIS, mais le problème d'origine est réglé autrement ──
  //
  // Testé sans (antialias) : tout devient flou, forcément — un sprite 32×32 agrandi
  // par interpolation bilinéaire N'EST que du flou. Ce n'était pas le bon levier.
  //
  // Ce qui rendait « moche » avant, ce n'était pas NEAREST : c'étaient les POLICES.
  // Press Start 2P et Verdana sont des polices LISSES (anti-aliasées) ; rasterisées
  // en canvas puis échantillonnées en NEAREST, leurs glyphes ressortaient grignotés.
  // D'où toute la machinerie de supersampling (TEXT_RESOLUTION ×4 à ×10) et le
  // monkeypatch LINEAR sur add.text() — des pansements sur une incompatibilité de
  // fond entre une police lisse et un rendu pixel.
  //
  // Neatpixels, elle, est une VRAIE police pixel : elle veut NEAREST, et elle est
  // nette à l'échelle 1:1. Le dilemme a disparu avec le changement de police —
  // sprites nets ET texte net, sans pansement (cf. TEXT_RESOLUTION = 1 dans UITheme).
  pixelArt: true,
  render: {
    antialias: false,
    antialiasGL: false,
    roundPixels: true,
    pixelArt: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
    zoom: Phaser.Scale.MAX_ZOOM,
    // Second facteur du flou : Scale.FIT étire le canvas 800×600 pour remplir la
    // fenêtre, d'un facteur qui n'a aucune raison d'être ENTIER (ex. ×2,37). Même
    // sous `image-rendering: pixelated`, un pixel source ne tombe alors pas sur un
    // nombre entier de pixels écran : certains sont doublés, d'autres non, et les
    // glyphes ressortent baveux et d'épaisseur irrégulière.
    // `autoRound` force les dimensions du canvas à des entiers, ce qui supprime le
    // placement sub-pixel. Ça ne rend pas le RATIO entier (impossible sans bandes
    // noires), mais ça élimine la moitié du problème — l'autre moitié, c'était la
    // rastérisation hors grille de la police, traitée dans UITheme.snapFontSize().
    autoRound: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    PreloaderScene,
    MainMenuScene,
    NameInputScene,
    IntroScene,
    GameScene,
    UIScene,
    DialogueScene,
    InventoryScene,
    SkillScene,
    EndingScene,
    ShopScene,
    PauseScene,
    BestiaryScene,
    ArsenalScene,
  ],
};

/**
 * Attendre les polices AVANT de démarrer Phaser.
 *
 * Un `Phaser.GameObjects.Text` est rasterisé dans un canvas 2D puis baké en
 * texture UNE SEULE FOIS, à sa création. Si la TTF Neatpixels n'est pas encore
 * chargée à ce moment-là, le glyphe est baké en `monospace` — et il ne sera
 * JAMAIS re-rendu (sauf appel explicite à setText()). Les écrans les plus
 * exposés sont justement les premiers : Boot, menu principal, HUD initial.
 * `font-display: block` ne protège que le DOM, pas le canvas : c'est à nous
 * d'attendre.
 *
 * En cas d'échec (police absente, navigateur exotique) on démarre quand même —
 * un jeu en police de repli reste jouable, un jeu qui ne démarre pas, non.
 */
const FONTS = ["'Neatpixels'", "'Neatpixels Boss'", "'Neatpixels Minimal'", "'Neatpixels Blocks'"];
async function bootFonts(): Promise<void> {
  if (!document.fonts?.load) return;
  try {
    await Promise.all(FONTS.map(f => document.fonts.load(`16px ${f}`)));
    await document.fonts.ready;
  } catch {
    /* police indisponible — on démarre en repli plutôt que de bloquer le boot */
  }
}

await bootFonts();

const game = new Phaser.Game(config);

// La résolution de rendu du texte est désormais fixée à 1 quel que soit le zoom :
// Neatpixels est une police pixel, nette à l'échelle 1:1, et la sur-échantillonner
// avant un filtrage NEAREST la dégrade au lieu de l'améliorer (cf. UITheme.ts).
// L'appel est conservé pour garder le point d'ancrage si la DA changeait à nouveau.
game.events.once(Phaser.Core.Events.READY, () => {
  setTextResolution(game.scale.zoom);
});
