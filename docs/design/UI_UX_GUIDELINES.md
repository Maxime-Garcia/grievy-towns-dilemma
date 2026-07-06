# UI/UX Guidelines — Grievy Town's Dilemma

> **DOC DE RÉFÉRENCE UNIQUE pour toute intervention UI/UX ou DA.**
> Tout agent ou dev qui touche à une scène UI (existante ou future) lit ce fichier EN PREMIER,
> puis `docs/design/INSPIRATIONS.md` pour le ton visuel/narratif.
> Les tokens de ce document sont extraits du code réel (`src/utils/UITheme.ts`, `src/types/index.ts`,
> `src/main.ts`) — si le code et ce doc divergent, corriger l'un ou l'autre, jamais ignorer.

**Dernière synchro avec le code :** branche `feat/ui-stats-combat-polish` (commit `e0576e8`).

---

## 0. Contexte technique — à connaître avant tout layout

| Paramètre | Valeur | Source |
|-----------|--------|--------|
| Résolution logique | **800×600 px**, fixe | `src/main.ts` (`scale.width/height`) |
| Scale mode | `Phaser.Scale.FIT` + `CENTER_BOTH` | `src/main.ts` |
| Rendu | `pixelArt: true` (nearest-neighbor, zéro anti-aliasing) | `src/main.ts` |
| Police UI | `'Press Start 2P', monospace` | `UITheme.ts` → `FONT` |

**Conséquence critique :** toutes les coordonnées UI sont en **unités logiques** (800×600).
Sur un téléphone de 375 CSS px de large, `Scale.FIT` réduit tout d'un facteur **≈ 0.47**.
Un élément de 44 px logiques ne fait donc que ~21 px physiques à l'écran. C'est pourquoi :

- Le **minimum absolu** de zone tactile est 44×44 px logiques — mais c'est un plancher, pas une cible.
- Les actions **fréquentes en combat** (skills) visent **52 px et plus**, avec hit zone élargie.
- Toujours ajouter une **hit zone invisible** (`add.rectangle(..., 0, 0)`) de **+4 à +6 px** au-delà du visuel.
- Ne jamais coller un élément interactif à un bord absolu de l'écran (le pouce rate les bords ; les
  gestes système iOS/Android mangent les 20 derniers px du bas).

Toujours calculer les positions à partir de la caméra, jamais en dur :

```typescript
const { width: W, height: H } = this.cameras.main;
```

---

## 1. Principes fondamentaux

### 1.1 Touch-first, clavier-égal
Phaser unifie tap et clic (`pointerdown`). Toute action clavier (Z, ESC, I, K, A/E/R/F, 1–4) **doit**
avoir un équivalent tactile visible : boutons `INV`/`SKL` du HUD, hit zones des skill slots, tap-to-advance
du dialogue, boutons d'action du panneau détail. Aucune fonctionnalité ne doit être hover-only ou
keyboard-only. Le survol (`pointerover`) est un *bonus desktop*, jamais le seul chemin d'accès à une info.

### 1.2 Feedback immédiat (< 100 ms)
Règle héritée d'Alabaster Dawn (INSPIRATIONS.md §3) : *« Chaque action du joueur doit avoir un retour
immédiat — jamais de silence. »* Concrètement dans le code :

- Tap sur skill slot HUD : alpha 0.6 → 1 en **80 ms**, puis scale 1.15 yoyo **60 ms** (`Back.easeOut`).
- Tap sur bouton nav : flash blanc alpha 0.25 → 0 en **150 ms**.
- Tap-equip inventaire : flash blanc 0.8 → 0 en **400 ms** sur le slot paperdoll cible.
- Combo pip qui s'allume : pop scale 1.0 → 1.4 → 1.0 en **120 ms** total.

Le retour visuel part sur `pointerdown`, pas `pointerup` — le joueur sent l'input à l'instant du contact.

### 1.3 Hiérarchie visuelle — l'UI est discrète, le combat est roi
Référence HUD : Alabaster Dawn + SAO. Les barres sont lisibles mais ne gênent jamais la lecture de
l'action. Maximum **3 niveaux d'information simultanés**. La rareté d'un item est TOUJOURS portée par
sa couleur (`RARITY_COLORS`) dans toutes les interfaces. Les valeurs importantes (HP, nom d'item,
main stat) sont en gros et/ou dorées ; le lore et les descriptions en `TXT_MUTED` petit.

### 1.4 Économie d'écran
800×600 c'est petit. Labels de 2–3 mots max (`INV`, `SKL`, `← Stats`). Noms d'items tronqués à 11
caractères dans les listes (`slice(0, 9) + '..'`), complets uniquement dans le panneau détail.
Chaque panneau a un titre court en `TXT_GOLD` 7 px et un séparateur `BORDER_LIT`.

---

## 2. Design tokens

### 2.1 Palette — `UI.*` de `src/utils/UITheme.ts` (source de vérité)

#### Panneaux et structure
| Token | Hex | Usage |
|-------|-----|-------|
| `UI.PANEL_BG` | `0x0c0c18` | Fond de tout panneau standard |
| `UI.BORDER` | `0x2c1e10` | Bordure externe sombre |
| `UI.BORDER_LIT` | `0x6a4a22` | Liseré interne + séparateurs (alpha 0.3–0.7) |
| `UI.CORNER` | `0xc8a030` | Rivets dorés 3×3 aux coins + surbrillance sélection |

#### Texte (format string pour les Text objects)
| Token | Hex | Usage |
|-------|-----|-------|
| `UI.TXT_PARCHMENT` | `#f5edd0` | Texte primaire par défaut |
| `UI.TXT_GOLD` | `#c8a030` | Titres, valeurs importantes, or, nom du joueur |
| `UI.TXT_MUTED` | `#88776a` | Texte secondaire, labels, descriptions |
| `UI.TXT_HINT` | `#443322` | Hints clavier, texte tertiaire quasi-invisible |
| `UI.TXT_BLUE` | `#88aaff` | MP, choix de dialogue, liens, skills |
| `UI.TXT_GREEN` | `#55dd66` | HP, confirmations, actions positives (équiper) |
| `UI.TXT_RED` | `#dd4433` | Danger, bouton ×, erreurs |
| `UI.TXT_ORANGE` | `#ff9940` | Vente, quêtes, avertissements |
| `UI.TXT_WHITE` | `#ffffff` | Valeurs sur barres (toujours avec stroke noir) |

#### Slots et boutons
| Token | Hex | Usage |
|-------|-----|-------|
| `UI.SLOT_BG` | `0x0a0a18` | Fond de slot (inventaire, équipement, skill) |
| `UI.SLOT_BORDER` | `0x282040` | Bordure de slot vide |
| `UI.SLOT_ACTIVE` | `0xc8a030` | Slot sélectionné/actif |
| `UI.BTN_BG` | `0x121020` | Fond de bouton |
| `UI.BTN_BG_HOVER` | `0x1e1a30` | Fond de bouton au survol |
| `UI.BTN_BORDER` | `0x4a3520` | Bordure de bouton |
| `UI.BTN_BORDER_HOV` | `0xc8a030` | Bordure de bouton au survol/press |

#### Barres de ressources (style SAO — INSPIRATIONS.md §2)
| Token | Hex | Usage |
|-------|-----|-------|
| `UI.HP_BG` / `UI.HP_GREEN` / `UI.HP_ORANGE` / `UI.HP_RED` / `UI.HP_SHINE` | `0x0a140a` / `0x44cc55` / `0xdd9920` / `0xcc2222` / `0xaaffbb` | HP : vert > 50 %, orange 25–50 %, rouge < 25 % |
| `UI.MP_BG` / `UI.MP_FILL` / `UI.MP_SHINE` | `0x05050f` / `0x2255ee` / `0x99bbff` | MP : bleu uniforme |
| `UI.XP_BG` / `UI.XP_FILL` / `UI.XP_SHINE` | `0x080012` / `0x8833cc` / `0xcc88ff` | XP : bande violette de 4 px en bas d'écran |

#### Raretés — `RARITY_COLORS` de `src/types/index.ts` (source de vérité pour l'UI)
| Rareté | Hex |
|--------|-----|
| Common | `#b0b0b0` |
| Uncommon | `#4fc04f` |
| Rare | `#4f9fff` |
| Epic | `#a04fff` |
| Legendary | `#ffa04f` |
| Mythic | `#ff4f4f` |
| Hidden | `#ffd700` |

> Note : le tableau de INSPIRATIONS.md §4 décrit Hidden en « rouge/noir » et ne mentionne pas Mythic —
> le code fait foi pour l'UI tant que la divergence n'est pas arbitrée.

#### Couleurs élémentaires (chiffres de dégâts — INSPIRATIONS.md §3)
Feu `0xff4400` · Eau `0x2266ff` · Foudre `0xffee00` · Glace `0x88ddff` · Vent `0xaaddff` · Terre `0x88aa33`

#### Combo HUD (pips sous le joueur)
Validé `0xf0e8d8` · Restant `0x444444` · Finisher prêt `0xffb347` (ambre) · Combo cassé `0x777777`
**Interdits pour les pips :** azur `0x66ddff` et doré `0xffe066` (réservés à d'autres systèmes).

### 2.2 Typographie

Une seule famille : `FONT = "'Press Start 2P', monospace"` — toujours via `pxStyle(size, color, stroke?)`.

| Rôle | Taille (px logiques) | Exemples dans le code |
|------|---------------------|----------------------|
| Titre d'écran | 11–14 | `INVENTAIRE` 11, `SKILLS` 12, `PAUSE` 14 |
| Sous-titre / speaker | 9–10 | Nom du NPC 10, boutons de menu 9 |
| Corps de texte | 8–9 | Dialogue 9 (+ `lineSpacing: 4`), noms d'items 8 |
| Secondaire / labels | 6–7 | Titres de panneaux 7, stats 6, substats 6 |
| Micro (à éviter en nouveau code) | 5 | Labels paperdoll — **7 px est le minimum recommandé** |

Règles :
- Texte blanc superposé à une barre ou un sprite → **toujours** `stroke: '#000000'`, `strokeThickness: 2–3`
  (ou `pxStyle(size, color, true)` qui applique thickness 3).
- Texte long → `wordWrap: { width: ... }`, jamais de débordement.
- Chiffres/valeurs à droite : `.setOrigin(1, 0)` ; titres centrés : `.setOrigin(0.5, 0)`.

### 2.3 Espacements et dimensions standard

| Constante | Valeur | Usage |
|-----------|--------|-------|
| Marge externe d'écran overlay | 6–8 px | `MARGIN = 8` (inventaire), 6 (skills) |
| Gap entre panneaux | 6 px | `GAP = 6` |
| Padding interne panneau | 8–10 px | textes à `x + 8` ou `x + 10` |
| Header d'écran overlay | 36 px | `HEADER_H = 36` |
| Slot inventaire | 48 px | `INV_SLOT = 48` |
| Slot équipement (paperdoll) | 44 px | `EQ_SLOT = 44` |
| Skill slot HUD | 52 px (+6 hit zone) | combat = cible élargie |
| Bouton nav HUD | 54×44 px (+4 hit zone) | `INV` / `SKL` |
| Bouton × fermeture | 40–44 px visuel, hit zone ≥ 44–48 | Dialogue, Skills |
| Hauteur ligne de stats | 18 px | `ROW_H = 18` |
| Bande XP | 4 px pleine largeur, bas d'écran | HUD |

### 2.4 Durées d'animation standard

| Animation | Durée | Où |
|-----------|-------|----|
| Feedback tap (alpha/flash) | 80–150 ms | skill slots, nav buttons |
| Pop scale yoyo | 60 ms (×2 = 120 ms) | skill tap, combo pip |
| Flash de confirmation (equip) | 400 ms | paperdoll |
| Fade-in d'ouverture de scène overlay | **300 ms** (unifié) | `cameras.main.fadeIn(300, 0, 0, 0)` — appliqué partout (MainMenu, Pause, Shop, Inventory, Skill, Dialogue, NameInput) |
| Fade-out avant `scene.start()` | **300 ms** | `fadeOut(300)` + `once(FADE_OUT_COMPLETE, () => scene.start(...))` avec garde `transitioning` anti double-tap — voir `MainMenuScene.transitionTo()` |
| Hover bouton (scale) | 100 ms, scale 1.03 (`Quad.easeOut`) | MainMenu (container bouton), Pause (label) — retour à 1.0 sur `pointerout` |
| Entrée échelonnée des boutons de menu | delay 0/80/160 ms, fade+slide 350 ms | MainMenuScene (`time.delayedCall`) |
| Notification visible | 2500 ms + fade out 400 ms | HUD |
| Nom de zone | fade-in 400 ms, hold 3500 ms, fade partiel 1000 ms → alpha 0.4 | HUD |
| Lerp des barres HP/MP | vitesse 8/s (jamais de saut sec) | HUD |

### 2.5 Profondeurs (depth) réservées

| Depth | Réservé à |
|-------|----------|
| < 0 | Tap zones d'arrière-plan (ex. tap-to-advance dialogue à -1) |
| 0 | Contenu par défaut |
| 5–7 | Hit zones interactives du HUD |
| 10 | Notifications, bouton × dialogue |
| 30 | Tooltips |
| 50–51 | Combo pips + particules finisher, messages de sauvegarde |
| 199–200 | Badge de build DEV (jamais rien au-dessus) |

### 2.6 Overlays plein écran

Fond noir semi-opaque derrière tout écran modal : `add.rectangle(W/2, H/2, W, H, 0x000000, alpha)`.
Valeurs unifiées : **0.88 standard** (inventaire, skills, shop), 0.72 (pause — plus léger volontairement,
le jeu figé reste visible en fond).

**Panneaux translucides** : les frames principaux passent `fillAlpha` à `drawPanel`/`drawGlowPanel` —
0.85 pour un panneau principal (Pause, Inventory, Skill, Shop), 0.92 pour un panneau secondaire
(dialogue, cartes de save). Les couleurs du jeu transparaissent derrière (réf. Hades / Hollow Knight).

---

## 3. Composants UI réutilisables

### 3.1 `drawPanel(g, x, y, w, h, fill?, fillAlpha?)` — LE panneau du jeu
Fond sombre + double bordure (`BORDER` puis `BORDER_LIT` alpha 0.7) + 4 rivets dorés 3×3 aux coins.
**Tout conteneur visuel passe par `drawPanel`** — jamais de `fillRect` nu pour un panneau.
Fill par défaut `PANEL_BG` ; `SLOT_BG` pour les sous-panneaux et slots ; `BTN_BG` pour les boutons.
`fillAlpha` (défaut 1) : 0.85 = frame principal translucide, 0.92 = panneau secondaire — les bordures
et rivets restent opaques. `drawGlowPanel` accepte le même paramètre en 8e position (défaut 0.97).

### 3.1bis `drawGlow(g, x, y, w, h, color?, intensity?)` — halo lumineux
4 anneaux `strokeRect` de plus en plus larges (pas de 3 px) et transparents (alpha 0.10 → 0.025 ×
`intensity`). Pixel-art friendly (aucun blur). Utilisé derrière le titre du menu principal ; à réserver
aux éléments « héros » (titres, level-up, items EPIC+) — jamais sur un composant répété en liste.

### 3.2 `drawBar(g, x, y, w, h, pct, fill, bg, shine)` — barres de progression
Remplissage + bande de brillance en haut (alpha 0.22, 32 % de la hauteur) + graduations noires tous
les 25 px (si w > 50) + contour noir alpha 0.45. Utilisée pour HP (16 px de haut) et MP (9 px).
Couleur HP dynamique : `HP_GREEN` > 50 %, `HP_ORANGE` > 25 %, `HP_RED` sinon. Texte `courant/max`
centré sur la barre, blanc 7 px + stroke noir 2.

### 3.3 `pxStyle(size, color?, stroke?)` — style de texte
Le seul chemin autorisé pour créer un style de texte. `stroke: true` = contour noir épaisseur 3.

### 3.4 Bouton standard (pattern, pas encore de helper)
```typescript
// 1. Fond : drawPanel(gfx, x, y, w, h, UI.BTN_BG)
// 2. Label : pxStyle(8–9, UI.TXT_GOLD | couleur sémantique), origin 0.5
// 3. Hit zone invisible ≥ visuel + 4 px, setInteractive({ useHandCursor: true })
// 4. pointerover  → bordure UI.BTN_BORDER_HOV + label doré (bonus desktop)
// 5. pointerout   → état normal
// 6. pointerdown  → flash blanc alpha 0.25 → 0 en 150 ms + action
```
Hauteur minimum d'un bouton : **44 px** dans tout nouveau code (les 20–34 px hérités sont de la dette,
voir §7).

### 3.5 Slot d'item
Fond `SLOT_BG`, **bordure = couleur de rareté** (`RARITY_COLORS`, alpha 0.3 si vide, 1 si occupé),
icône 32×32 centrée (fallback : carré de couleur rareté alpha 0.5 si texture absente — via
`resolveIcon()` + `addColorSquare()`), badge quantité en bas-droite (6 px blanc, origin (1,1)),
survol = bordure blanche.

### 3.6 Bouton de fermeture (règle inter-écrans, voir §6)
Glyphe `×` en `TXT_RED` 14 px, positionné **en haut à droite** du panneau, avec hit zone invisible
de **44×44 px minimum** (48×48 recommandé). `pointerover` → orange. ESC ferme toujours aussi.

### 3.7 Tabs horizontaux (PauseScene)
120×24 px, actif = fond `0x1a2030` + liseré `CORNER` alpha 0.8 + texte doré ; inactif = `SLOT_BG` +
texte `TXT_MUTED`, interactif avec survol parchemin. À élargir à 44 px de haut dans tout nouvel écran.

### 3.8 Notifications (HUD)
File FIFO, une seule visible à la fois, au-dessus des skill slots, centrée. 9 px, couleur sémantique
(doré = level-up, orange = quête, bleu = skill, vert = zone, couleur de rareté = loot). 2.5 s + fade
400 ms. Les items Common ne notifient pas (anti-spam).

### 3.9 Tooltip (SkillScene)
Panneau `drawPanel` 216×82, depth 30, nom doré 9 px + description muted 7 px wrapped + coûts bleus 7 px.
Position clampée dans l'écran (`Math.min(sx + 84, W - TW - 8)`). **Attention :** actuellement
hover-only — tout nouveau tooltip doit aussi s'ouvrir au long-press (cf. §5.2).

---

## 4. Layout responsive et safe zones

1. **Toujours** dériver les positions de `this.cameras.main.width/height`. Les constantes de layout
   (largeurs de panneaux, tailles de slots) peuvent être fixes ; les **positions** sont relatives.
2. Panneau bas ancré : `PANEL_TOP = H - PANEL_H - 4` ; éléments à droite : `W - marge - largeur`.
3. **Zone de pouce** = moitié basse de l'écran. Y vivent : barres HP/MP (bas-gauche), skill slots
   (bas-centre), boutons nav INV/SKL (bas-droite), boutons d'action des panneaux détail (bas du panneau),
   panneau de dialogue (bande basse de 168 px).
4. **Safe zone basse** : la bande XP occupe les 4 derniers px ; garder les hit zones interactives à
   ≥ 7 px du bord bas (les skill slots sont à `H - SLOT_SZ - 7`).
5. Grilles : nombre de colonnes **calculé** depuis la largeur disponible quand c'est possible
   (`COLS = Math.floor((W - 36) / (CELL_W + GAP))` dans SkillScene). Le `INV_COLS = 7` fixe de
   l'inventaire fonctionne car les largeurs de panneaux sont fixes — ne pas copier ce pattern dans
   un écran dont les panneaux sont fluides.
6. Contenu scrollable : geometry mask (`createGeometryMask`) + clamp
   (`Phaser.Math.Clamp(scrollY, 0, contentH - visibleH)`). Supporter wheel **et** drag vertical (§5.4).
7. Test mental obligatoire : « à 375 CSS px de large, ce bouton fait la moitié de sa taille logique —
   est-il encore tapable ? » Si doute → agrandir la hit zone.

---

## 5. Interactions standard

### 5.1 Tap = action primaire
Équiper / utiliser / valider / avancer le dialogue / lancer un skill. Un seul tap, action immédiate,
feedback < 100 ms. Dans la grille d'inventaire : tap court = `doMainAction()` (equip / use / détail
pour les key items).

### 5.2 Long-press (≥ 500 ms) = action secondaire (détail)
Pattern canonique du projet (InventoryScene) — **un seul timer, toujours nettoyé** :
```typescript
private longPressTimer: ReturnType<typeof setTimeout> | null = null;

hit.on('pointerdown', () => {
  this.longPressTimer = setTimeout(() => {
    this.longPressTimer = null;
    this.showDetail(item.id);              // long-press → détail
  }, 500);
});
hit.on('pointerup', () => {
  if (this.longPressTimer !== null) {      // relâché avant 500 ms → tap
    clearTimeout(this.longPressTimer);
    this.longPressTimer = null;
    this.doMainAction(item.id);
  }
});
hit.on('pointerout', () => {               // le doigt sort → annule tout
  if (this.longPressTimer !== null) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
});
// ET dans shutdown() : clearTimeout + null — jamais de timer orphelin
```

### 5.3 Swipe horizontal = navigation entre panneaux/tabs
Cible design (pas encore implémenté — voir §7). Seuil : **60 px logiques** de delta X entre
`pointerdown` et `pointerup`.
```typescript
let startX = 0;
this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { startX = p.x; });
this.input.on('pointerup',   (p: Phaser.Input.Pointer) => {
  const dx = p.x - startX;
  if (Math.abs(dx) > 60) dx < 0 ? nextPanel() : prevPanel();
});
```

### 5.4 Scroll vertical = wheel + drag
Le wheel existe (grille d'inventaire). Tout nouveau contenu scrollable ajoute le drag tactile :
```typescript
this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
  if (!p.isDown) return;
  scrollY = Phaser.Math.Clamp(scrollY - (p.y - p.prevPosition.y), 0, maxScroll);
  for (const { obj, baseY } of scrollables) obj.setY(baseY - scrollY);
});
```

### 5.5 Tap-to-advance (dialogue)
Zone de tap = **tout le panneau de dialogue**, en `depth: -1` pour que les choix (depth 0) gagnent le
routing d'input (`topOnly`). `advance()` garde un guard contre les lignes à choix. Standard mobile RPG.

### 5.6 Pont tactile → gameplay : l'événement `mobile_action`
Le HUD n'appelle jamais directement la logique de GameScene. Il émet
`this.game.events.emit('mobile_action', 'skill0' | ... | 'inventory' | 'skills')` et GameScene exécute
**le même code path que le clavier**. Toute nouvelle commande tactile passe par ce canal — une seule
logique, deux inputs.

### 5.7 Hygiène des listeners (règle CLAUDE.md)
Toute scène UI définit `shutdown()` : `events.off(...)` pour chaque `events.on(...)` sur GameScene,
`removeKey()` pour chaque touche, `clearTimeout` des long-press, `input.off('wheel')`. Les handlers
d'événements vérifient `if (!this.sys.isActive()) return;` en tête.

---

## 6. Règles par écran

### 6.1 UIScene (HUD)
Hérite de tout §1–5. Spécifique :
- **Panneau stats bas-gauche** (66 px de haut, ancré `H - 66 - 4`) : nom joueur doré, niveau à droite,
  barre HP 178×16 + barre MP 178×9, labels `HP`/`MP` vert/bleu 7 px, valeurs centrées sur les barres.
- **Barres lerpées** (vitesse 8/s) — jamais de saut instantané, redraw seulement si delta > 0.001.
- **Skill slots bas-centre** : 4 slots de **52 px** (gap 5), icône 34×34, badge touche (A/E/R/F) doré
  6 px en coin haut-gauche, overlay cooldown + texte 10 px, hit zone 58×58, feedback §1.2.
- **Boutons nav bas-droite** : `INV` et `SKL` 54×44, flash blanc 150 ms, émettent `mobile_action`.
- **Bande XP** : 4 px pleine largeur tout en bas, violette, sans lerp.
- **Nom de zone** haut-droite doré 9 px ; **notifications** au-dessus des slots (§3.8).
- **Combo pips** : losanges 4×4 (carrés rotés 45°) sous le joueur (+26 px), espacés de 7 px, alpha 0.75,
  fade-out après 2 s sans attaque. Couleurs §2.1. Échec de combo = gris + blink + fade — *« silencieux,
  jamais humiliant »*.
- **Badge de build DEV** haut-gauche (depth 199–200) — obligatoire, cf. CLAUDE.md.

### 6.2 InventoryScene
Layout 3 panneaux fixes : équipement 180 px | stats/détail 220 px | grille (largeur restante, 7 col × 48 px).
- **Tap = action, long-press = détail** (§5.2) — le hint « Tap = action • Maintenir = détail » est
  affiché en bas du panneau stats.
- Panneau central à double état : stats par défaut ↔ détail d'item (`selectedItemId`), retour via
  `← Stats` bleu.
- Panneau détail : `[RARETÉ]` + nom (couleur rareté, wrapped) → main stat dorée 9 px → séparateur →
  substats à puces 6 px → description muted → **boutons d'action empilés en bas du panneau** (zone de
  pouce) : Équiper/Utiliser (vert), Vendre (orange), Fermer (muted).
- Équiper flashe le slot paperdoll cible en blanc 400 ms (`lastFlashSlotKey`).
- Grille scrollable par geometry mask + wheel ; raccourcis ESC (fermer) et Z (action principale).
- Refresh par destruction/recréation des `dynamicObjs` — toujours pousser chaque objet dynamique dans
  le tableau, sinon fuite visuelle au refresh.

### 6.3 DialogueScene
- Panneau = bande basse de **168 px** (`H - 168 - 6`), pleine largeur moins 16 px — zone de pouce.
- Portrait 72×72 encadré à gauche (frame `drawPanel` fond `0x080810`), texture `portrait_<speaker>`.
- Speaker doré 10 px ; corps parchemin **9 px + lineSpacing 4** avec wordWrap.
- **Tap n'importe où sur le panneau = avancer** (§5.5) ; Z/Enter équivalents clavier ; ESC ferme.
- Choix : `▸ texte` bleu 9 px, interligne 22 px, touches 1–4 en miroir, survol blanc.
- Bouton `×` rouge haut-droite du panneau avec hit zone 44×44 (§3.6).

### 6.4 SkillScene
- Overlay 0.88, frame plein écran moins 12 px, titre 12 px doré.
- Flow **select-then-place** : tap sur un skill débloqué (cellules 78×66) → les slots équipés (86×64)
  s'illuminent — vides en liseré doré alpha 0.85 (invitation), occupés en 0.35 — → tap sur un slot
  pour équiper. Deux taps, zéro drag requis.
- Slots équipés en bas d'écran (zone de pouce), labels A/E/R/F cohérents avec le HUD.
- Bouton `×` 40 px + hit zone 48×48 haut-droite ; coût mana bleu en coin de cellule.

### 6.5 PauseScene
- Overlay 0.72 (plus léger : le jeu reste visible), panneau central 400 px de large.
- **3 tabs** (Jeu / Touches / Réglages) 120×24, pattern §3.7.
- Boutons de menu 260×34, hover = fond `BTN_BG_HOVER` + liseré doré + texte doré.
- Toggles ON/OFF : fond teinté vert `0x081a08` / rouge `0x1a0808`, texte `TXT_GREEN`/`TXT_RED`.
- Rebind clavier : slot en attente = fond `0x1a2030` + liseré doré + `...` bleu, ESC annule.
- Confirmation de sauvegarde : texte centré vert/rouge 11 px, fade-in 150 ms, hold 1600 ms, fade 300 ms.

---

### 6.6 MainMenuScene
- **Fond animé 100 % procédural** (aucun asset) : ciel crépusculaire en 16 bandes (`0x0a0a1f` → `0x1a0a0a`),
  ~50 étoiles fixes (LCG à graine fixe — jamais de `Math.random` dans `create()`), 10 étoiles à pulsation,
  2 astres avec halo en cercles concentriques, 3 plans de montagnes en escaliers (silhouettes périodiques
  sur W, dessinées sur 2×W, scroll infini par translation de `.x` — **zéro redraw** dans `update()`),
  falaise fixe bas-gauche + silhouette du héros (corps 4×16, tête 6×6) avec respiration sinusoïdale
  (±1.5 px, période 3 s). Vitesses parallax : 2.5 / 4.5 / 7.5 px/s.
- Voile de lisibilité `0x060810` alpha 0.28 entre le fond et l'UI ; cadre décoratif **bordure seule**
  (jamais de fill opaque qui masquerait le fond).
- Titre : halo `drawGlow` + pulsation alpha 0.9 ↔ 1.0 (2 s, yoyo, infini) après le fade-in initial.
- Boutons : entrée échelonnée 0/80 ms (fade + slide 8 px), hover scale 1.03 via container centré.
- Toute sortie de scène passe par `transitionTo()` (fade-out 300 ms + garde `transitioning`).

## 7. Cohérence inter-écrans — points NON NÉGOCIABLES

Identiques sur **tous** les écrans, actuels et futurs :

1. **Fermeture** : bouton `×` rouge en **haut à droite**, hit zone ≥ 44×44 px, hover orange, ET la
   touche ESC. *(Dette : InventoryScene n'a qu'un hint texte en footer — à aligner à la prochaine passe.)*
2. **Feedback tap < 100 ms** sur `pointerdown` : flash, alpha ou scale — jamais d'action silencieuse.
3. **Toute action clavier a un équivalent tactile** visible, via `mobile_action` si elle touche au gameplay.
4. **`drawPanel` / `drawBar` / `pxStyle` / `UI.*`** exclusivement — aucune couleur ou style de texte en dur
   (exceptions listées : couleurs de rareté via `RARITY_COLORS`, couleurs élémentaires §2.1, pips combo).
5. **Couleur de rareté** = bordure de slot ET couleur du nom de l'item, partout où un item apparaît.
6. **Labels de touches A/E/R/F** identiques entre HUD et SkillScene (doré, coin du slot).
7. **Titres d'écran** : doré, 11–14 px, centrés, avec séparateur `BORDER_LIT` en dessous.
8. **Long-press 500 ms = détail** partout où un item/skill a des infos supplémentaires.
9. **Fade-in 300 ms** à l'ouverture de tout écran overlay ; fond noir 0.88 (0.72 pour pause).
10. **`shutdown()` complet** (§5.7) dans chaque scène UI — règle CLAUDE.md.
11. **Hit zone invisible ≥ visuel + 4 px** pour tout élément interactif < 60 px.
12. **Zone de pouce** : les boutons d'action (valider, équiper, utiliser, fermer un détail) vivent dans
    la moitié basse du panneau/écran.

### Dette UX connue (à résorber, ne PAS répliquer dans du nouveau code)
| # | Écart | Où |
|---|-------|-----|
| D1 | Pas de bouton × haut-droite (hint footer seul) | InventoryScene |
| D2 | Scroll de la grille = wheel uniquement, pas de drag tactile | InventoryScene |
| D3 | Tooltip skill hover-only, inaccessible au tap | SkillScene |
| D4 | Sélection via `scene.restart()` — re-render complet, pas de micro-feedback | SkillScene |
| D5 | Textes 5 px sous le minimum 7 px | InventoryScene (labels paperdoll) |
| D6 | Boutons < 44 px de haut (20–34 px) | PauseScene (menu, tabs, toggles), InventoryScene (boutons détail 20 px) |
| D7 | Choix de dialogue = hit zone du texte seul (~9 px de haut) | DialogueScene |
| D8 | Swipe horizontal non implémenté (nav panneaux/tabs) | InventoryScene, PauseScene |
| ~~D9~~ | **Résorbée** — fade-in unifié à 300 ms, overlays 0.88 standard (pause 0.72 volontaire), fade-out 300 ms avant tout `scene.start` du flow menu | — |
| D10 | `RARITY_COLORS` (code) diverge du tableau INSPIRATIONS.md §4 (Hidden, Mythic) | `src/types/index.ts` |

---

## 8. Checklist « avant de livrer un écran »

Cocher chaque point avant de considérer un écran UI comme terminé :

- [ ] Toutes les positions dérivent de `this.cameras.main.width/height` — aucun 800/600 en dur
- [ ] Tout élément interactif a une hit zone ≥ 44×44 px logiques (≥ 52 px si utilisé en combat)
- [ ] Hit zones invisibles élargies de +4 à +6 px au-delà du visuel
- [ ] Chaque `pointerdown` produit un feedback visuel < 100 ms
- [ ] Aucune info ou action accessible uniquement au hover ou au clavier
- [ ] Tap = action primaire ; long-press 500 ms = détail (timer nettoyé sur up/out/shutdown)
- [ ] Bouton `×` rouge haut-droite (hit ≥ 44 px) + ESC pour fermer
- [ ] Boutons d'action dans la moitié basse (zone de pouce)
- [ ] 100 % des styles via `pxStyle` / `drawPanel` / `drawBar` / `UI.*` — zéro hex sauvage
- [ ] Tailles de texte ≥ 7 px ; texte sur barre/sprite avec stroke noir ; wordWrap sur tout texte long
- [ ] Noms et bordures d'items colorés par `RARITY_COLORS`
- [ ] Contenu scrollable : geometry mask + clamp + wheel + drag vertical
- [ ] Fade-in 300 ms + overlay noir (0.88 standard)
- [ ] Depths conformes au tableau §2.5 (rien au-dessus de 199 sauf badge build)
- [ ] `shutdown()` retire TOUS les listeners, touches, timers et le wheel
- [ ] `if (!this.sys.isActive()) return;` en tête des handlers d'événements externes
- [ ] Actions gameplay tactiles émises via `mobile_action` (jamais d'appel direct à GameScene)
- [ ] Vérification mentale à 375 CSS px : tout reste lisible et tapable au facteur ×0.47
- [ ] Ton visuel conforme à INSPIRATIONS.md : médiéval fantasy pixel, sobre, jamais tech/générique

---

*Document vivant — le mettre à jour à chaque évolution de UITheme.ts, ajout de composant réutilisable,
ou résorption d'un point de dette §7. Le code et ce document ne doivent jamais diverger silencieusement.*
