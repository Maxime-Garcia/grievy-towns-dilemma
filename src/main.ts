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

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
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

const game = new Phaser.Game(config);

// Calibre la résolution de rendu du texte (uiStyle/pxStyle, cf. UITheme.ts)
// sur le zoom RÉEL choisi par le Scale Manager pour cet écran — un `3` fixe
// ne suffit pas sur un grand moniteur où Scale.MAX_ZOOM choisit un zoom élevé
// (le canvas 800×600 est alors très agrandi par le navigateur en NEAREST,
// ce qui blockifie le texte si sa résolution interne ne suit pas). `READY`
// fire une fois le Scale Manager initialisé, avant la première scène.
game.events.once(Phaser.Core.Events.READY, () => {
  setTextResolution(game.scale.zoom);
});
