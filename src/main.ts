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

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
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
  ],
};

new Phaser.Game(config);
