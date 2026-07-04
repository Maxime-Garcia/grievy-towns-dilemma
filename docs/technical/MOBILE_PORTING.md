# Portage Mobile — Grievy Town's Dilemma

> Référence d'implémentation pour adapter le jeu aux écrans tactiles (iOS/Android via navigateur ou PWA).  
> Déléguer l'implémentation à l'agent `mobile-agent`.

---

## 1. Objectifs

- Jouable sur smartphone (portrait **et** paysage) sans clavier ni souris
- Performances cibles : 60 fps sur mid-range 2022 (Snapdragon 695, Mali-G57)
- Canvas pixel-perfect sur toute résolution (300 px → 1440 px de largeur)
- Aucune régression desktop

---

## 2. Résolution & Canvas

### Problème actuel
`src/main.ts` fixe le canvas à 800×600. Sur mobile le canvas est trop petit ou trop grand selon le device.

### Solution
```typescript
// Phaser Scale config
scale: {
  mode:       Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width:      800,
  height:     600,
  // Orientation lock optionnel
  // orientation: Phaser.Scale.Orientation.LANDSCAPE,
}
```
- Ajouter `meta viewport` dans `index.html` : `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`
- CSS : `canvas { image-rendering: pixelated; touch-action: none; }`

---

## 3. Contrôles tactiles

### 3.1 Joystick virtuel (mouvement)
- Bibliothèque conseillée : **rexplugins/rex-virtual-joystick** (Phaser 3 compatible) ou implémentation maison
- Joystick fixe en bas-gauche, rayon 60 px, opacité 0.5
- Traduit en direction ZQSD → injecter directement dans le système de mouvement de `GameScene`

### 3.2 Boutons d'action
Disposition portrait recommandée (bottom-right, style SNES) :

```
             [A] Attaque / Interagir
        [B] Dash          [Y] Inventaire
             [X] Compétence 1
```

- Chaque bouton = `Phaser.GameObjects.Image` interactif, setDepth(100)
- `pointerdown` → déclenche l'action, `pointerup` → relâche (pour la détection de hold si besoin)

### 3.3 Gestes
- **Swipe vers le bas** sur l'écran (hors joystick/boutons) → ferme l'overlay actif (ESC)
- **Double-tap** → dash (alternative au bouton)

---

## 4. UI Responsive

### Inventaire (`InventoryScene`)
- Portrait : grille 4 colonnes (au lieu de 8), SLOT = 56 px
- Paysage : grille 6 colonnes, SLOT = 48 px (identique desktop)
- Scroll : `this.input.on('pointermove', ...)` pour drag-to-scroll (en plus de la roue)

### Menus pause / skills
- Déjà overlay → s'adaptent naturellement si le canvas scale est correct
- Vérifier que les zones tactiles font ≥ 44 px (Apple HIG minimum)

### Textes
- `pxStyle(8, ...)` peut être trop petit sur mobile → ajouter un flag `isMobile` pour upscaler de +2px

---

## 5. Performance

### Tilemaps
- Utiliser `Phaser.Tilemaps.Tilemap.setRenderOrder()` = "right-down" (par défaut, OK)
- Activer `tilemap.setCollisionByExclusion([-1])` une seule fois à l'init (déjà le cas)
- Sur mobile, limiter les layers visibles : masquer les couches décoratives lointaines

### Particules & VFX
- Réduire `maxParticles` de moitié sur mobile
- Détecter : `const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS`

### Audio
- Phaser WebAudio fonctionne sur iOS depuis iOS 13, mais nécessite un geste utilisateur avant `AudioContext.resume()`
- Ajouter un écran "tap to start" dans `MainMenuScene` pour débloquer l'audio

---

## 6. PWA (optionnel, phase 2)

- `manifest.json` : `display: "fullscreen"`, orientations autorisées
- Service Worker : cache les assets statiques pour mode offline
- Icônes : 192×192 et 512×512 px

---

## 7. Plan d'implémentation (ordre conseillé)

| Étape | Fichier(s) | Priorité |
|-------|-----------|----------|
| 1. Scale config | `src/main.ts` | P0 |
| 2. Viewport meta | `index.html` | P0 |
| 3. Détection mobile | nouveau `src/utils/device.ts` | P0 |
| 4. Joystick virtuel | nouveau `src/ui/VirtualJoystick.ts` | P1 |
| 5. Boutons d'action | nouveau `src/ui/MobileHUD.ts` | P1 |
| 6. Intégration GameScene | `src/scenes/GameScene.ts` | P1 |
| 7. Inventaire responsive | `src/scenes/InventoryScene.ts` | P2 |
| 8. Drag-to-scroll inventaire | `src/scenes/InventoryScene.ts` | P2 |
| 9. Réduction VFX mobile | `src/scenes/GameScene.ts` | P2 |
| 10. Audio unlock screen | `src/scenes/MainMenuScene.ts` | P2 |
| 11. PWA manifest | racine du projet | P3 |

---

## 8. Tests

- Chrome DevTools → toggle device toolbar → iPhone 14 Pro (390×844) et Galaxy S22 (360×780)
- Tester les deux orientations
- Vérifier le scroll inventaire avec touch drag
- Vérifier que le pause + reprise fonctionne après appel entrant (visibilitychange event)

---

## 9. Notes spécifiques Phaser 3.70

- `this.input.addPointer(2)` → activer le multi-touch (2 doigts = joystick + bouton simultanés)
- `pointer.isDown` fonctionne bien pour hold detection sur mobile
- `scene.scale.on('resize', callback)` → recalculer les positions de l'HUD mobile si l'orientation change en jeu
