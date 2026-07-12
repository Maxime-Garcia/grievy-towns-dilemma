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

// ── Texte net sous pixelArt:true — LE fix (pas un pansement de résolution) ──
// Le jeu tourne en pixelArt:true + image-rendering:pixelated (index.html) :
// indispensable pour que les sprites restent nets en gros pixels. Mais tout
// Phaser.GameObjects.Text est un Canvas 2D "normal" (police lisse, anti-
// aliasée) transformé en texture — sous filtrage NEAREST global, cette
// texture lisse est échantillonnée comme un sprite pixel-art, ce qui la fait
// ressortir grignotée/floue (essayé et insuffisant : sur-échantillonner la
// résolution du texte pour "survivre" au NEAREST, cf. anciens commentaires
// dans UITheme.ts — un texte lisse n'est simplement pas fait pour ce
// filtrage, peu importe sa densité source).
// Le vrai fix : chaque Texture Phaser peut avoir SON PROPRE filtre, indépendant
// du réglage global pixelArt. On intercepte donc la factory `add.text()` une
// seule fois ici (avant toute scène) pour forcer LINEAR (bilinéaire, lisse)
// sur la texture de CHAQUE Text créé dans le jeu — les sprites, eux, gardent
// NEAREST (chunky, voulu) puisqu'on ne touche à rien d'autre que Text.
// Aucune scène n'a besoin d'être modifiée : this.add.text() reste l'API
// normale partout, ce correctif est invisible pour le reste du code.
const originalTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (
  this: Phaser.GameObjects.GameObjectFactory,
  ...args: Parameters<typeof originalTextFactory>
) {
  const textObj = originalTextFactory.apply(this, args);
  textObj.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return textObj;
};

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
// Complémentaire au fix LINEAR ci-dessus (celui-ci gère le filtrage, celui-là
// la densité de la source avant filtrage — les deux ensemble donnent le
// meilleur résultat, LINEAR seul suffirait déjà à éliminer le bruit NEAREST).
game.events.once(Phaser.Core.Events.READY, () => {
  setTextResolution(game.scale.zoom);
});
