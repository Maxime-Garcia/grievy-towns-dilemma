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
// RETIRÉ : il n'existait que pour sauver le texte du filtrage NEAREST imposé par
// `pixelArt: true`. Depuis le retrait du filtre pixel art (ci-dessous), LINEAR est
// le filtre global — le patch ne faisait plus que coûter un setFilter par Text créé.
// S'il fallait revenir à `pixelArt: true`, il faudrait le restaurer (cf. historique
// git : commit d3c10e6 « filtre LINEAR sur les textures de texte »).

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  // ── Filtre pixel art RETIRÉ (demande explicite : « ça rend moche, je veux
  // tester sans ») ──
  // pixelArt:true imposait un filtrage NEAREST global : les sprites 32×32 étaient
  // agrandis en gros blocs durs. En passant à antialias, ils sont interpolés et
  // paraissent lissés. C'est un choix de DA à valider À L'ŒIL, en jeu — c'est tout
  // l'intérêt de le tester. Pour revenir en arrière : remettre `pixelArt: true` ici
  // ET `image-rendering: pixelated` sur le canvas dans index.html (les deux vont
  // ensemble, l'un sans l'autre ne fait rien).
  pixelArt: false,
  render: {
    antialias: true,
    antialiasGL: true,
    roundPixels: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
    zoom: Phaser.Scale.MAX_ZOOM,
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

// Calibre la résolution de rendu du texte (uiStyle/pxStyle, cf. UITheme.ts)
// sur le zoom RÉEL choisi par le Scale Manager pour cet écran — un `3` fixe
// ne suffit pas sur un grand moniteur où Scale.MAX_ZOOM choisit un zoom élevé
// (le canvas 800×600 est alors très agrandi par le navigateur en NEAREST,
// ce qui blockifie le texte si sa résolution interne ne suit pas). `READY`
// fire une fois le Scale Manager initialisé, avant la première scène.
// Complémentaire au fix LINEAR ci-dessus (celui-ci gère le filtrage, celui-là
// la densité de la source avant filtrage — les deux ensemble donnent le
// meilleur résultat, LINEAR seul suffirait déjà à éliminer le bruit NEAREST).
game.events.once(Phaser.Core.Events.READY, () => {
  setTextResolution(game.scale.zoom);
});
