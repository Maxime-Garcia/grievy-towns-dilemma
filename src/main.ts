import Phaser from 'phaser';
import { BootScene }      from './scenes/BootScene';
import { PreloaderScene } from './scenes/PreloaderScene';
import { MainMenuScene }  from './scenes/MainMenuScene';
import { NameInputScene } from './scenes/NameInputScene';
import { GameScene }      from './scenes/GameScene';
import { UIScene }        from './scenes/UIScene';
import { DialogueScene }  from './scenes/DialogueScene';
import { InventoryScene } from './scenes/InventoryScene';
import { SkillScene }     from './scenes/SkillScene';
import { EndingScene }    from './scenes/EndingScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#000000',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: import.meta.env.DEV,
    },
  },
  scene: [
    BootScene,
    PreloaderScene,
    MainMenuScene,
    NameInputScene,
    GameScene,
    UIScene,
    DialogueScene,
    InventoryScene,
    SkillScene,
    EndingScene,
  ],
};

new Phaser.Game(config);
