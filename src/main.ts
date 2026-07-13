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
  // `texture` n'est pas exposé dans les types publics de Phaser.GameObjects.Text
  // (champ interne, cf. Text.js) — garde runtime pour ne pas planter tout le
  // rendu texte si une future version de Phaser renomme/retire ce champ.
  const tex = (textObj as unknown as { texture?: Phaser.Textures.Texture }).texture;
  if (tex) {
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  } else {
    console.warn('[main.ts] Text.texture introuvable — filtre LINEAR non appliqué (Phaser a changé ?)');
  }
  return textObj;
};

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
