# UI/UX Guidelines — Grievy Town's Dilemma

> **DOC DE RÉFÉRENCE UNIQUE pour toute intervention UI/UX ou DA.**
> Tout agent ou dev qui touche à une scène UI (existante ou future) lit ce fichier EN PREMIER,
> puis `docs/design/INSPIRATIONS.md` pour le ton visuel/narratif.
> Les tokens de ce document sont extraits du code réel (`src/utils/UITheme.ts`, `src/types/index.ts`,
> `src/main.ts`) — si le code et ce doc divergent, corriger l'un ou l'autre, jamais ignorer.

**Dernière synchro avec le code :** passe « lisibilité micro-textes » (2026-07-12) —
plus aucun `uiStyle` < 9 px dans les scènes (les tailles plancher référencent `TYPE.SMALL`),
`TXT_MUTED`/`TXT_HINT` remontés, résolution de rendu du texte plafonnée à 10 (`setTextResolution`).
Précédente : refonte « UI moderne lisible » (2026-07-06) — double système typographique,
paperdoll Dofus, helpers `uiStyle`/`drawCard`/`drawDivider`/`addCloseButton`.

---

## 0. Direction artistique — « Dark modern RPG, readable first »

Depuis la refonte de juillet 2026, l'UI suit une règle simple :

> **Les sprites du jeu sont pixel art. L'INTERFACE, elle, est moderne, nette et lisible.**
> Références : Genshin Impact / AFK Arena (clarté mobile), Dofus (inventaire, paperdoll,
> slots à contour de rareté), Dead Cells / Hades (dark theme raffiné, panneaux translucides).

Concrètement :

1. **Deux polices, deux rôles** (voir §2.2) : la police pixel `'Press Start 2P'` est réservée à
   l'**identité** (titre du jeu au menu principal, éventuels gros titres cérémoniels). **Tout le
   reste** — corps, labels, stats, boutons, dialogues — utilise la police système moderne
   `FONT_UI` (Verdana/Segoe UI), lisible sans zoom même après le downscale mobile.
2. **Dark theme raffiné** : fonds très sombres (`PANEL_BG`, `BG_MID`), texte parchemin à fort
   contraste (≥ 4.5:1), accents dorés parcimonieux. Jamais de gris moyen sur gris moyen.
3. **La rareté colore tout** : bordure de slot ET nom d'item, partout (`RARITY_COLORS`).
4. **La hiérarchie se lit en 1 seconde** : titre doré gras > valeur importante grasse >
   corps normal > secondaire muted > hint quasi-invisible.
5. Le médiéval fantasy reste dans les **couleurs et les cadres** (rivets dorés, parchemin),
   pas dans l'illisibilité des textes.

---

## 0bis. Contexte technique — à connaître avant tout layout

| Paramètre | Valeur | Source |
|-----------|--------|--------|
| Résolution logique | **800×600 px**, fixe | `src/main.ts` (`scale.width/height`) |
| Scale mode | `Phaser.Scale.FIT` + `CENTER_BOTH` | `src/main.ts` |
| Rendu | `pixelArt: true` (nearest-neighbor, zéro anti-aliasing) | `src/main.ts` |
| Police identité | `'Press Start 2P', monospace` → `FONT` | `UITheme.ts` |
| Police UI | `Verdana, 'Segoe UI', Tahoma, Geneva, sans-serif` → `FONT_UI` | `UITheme.ts` |

**Conséquence critique :** toutes les coordonnées UI sont en **unités logiques** (800×600).
Sur un téléphone de 375 CSS px de large, `Scale.FIT` réduit tout d'un facteur **≈ 0.47**.
Un élément de 44 px logiques ne fait donc que ~21 px physiques à l'écran. C'est pourquoi :

- Le **minimum absolu** de zone tactile est 44×44 px logiques — mais c'est un plancher, pas une cible.
- Les actions **fréquentes en combat** (skills) visent **52 px et plus**, avec hit zone élargie.
- Toujours ajouter une **hit zone invisible** (`add.rectangle(..., 0, 0)`) de **+4 à +6 px** au-delà du visuel.
- Ne jamais coller un élément interactif à un bord absolu de l'écran (le pouce rate les bords ; les
  gestes système iOS/Android mangent les 20 derniers px du bas).
- C'est aussi pourquoi la police UI moderne est indispensable : Verdana 10 px logiques reste
  lisible à ×0.47 ; Press Start 2P 5–7 px ne l'était pas.
- **Résolution de rendu du texte** : `setTextResolution(zoom)` (UITheme.ts, appelée au boot dans
  `main.ts`) calibre la densité interne des canvas de texte sur le zoom réel — **plafonnée à 10** :
  au-delà, la minification NEAREST (pixelArt) décime les pixels rendus et transforme les
  micro-textes (9 px) en bruit. Ne jamais retirer ni déplafonner sans re-tester sur grand écran.

Toujours calculer les positions à partir de la caméra, jamais en dur :

```typescript
const { width: W, height: H } = this.cameras.main;
```

---

## 1. Principes fondamentaux

### 1.1 Readable first
Aucun texte fonctionnel sous **9 px logiques** en `FONT_UI`. Les valeurs importantes (HP, nom
d'item, main stat) sont en **gras** et/ou dorées. Texte sur fond variable (barre, sprite, icône) →
**toujours** `stroke: true`. Si un texte doit être tronqué pour tenir, il doit être disponible en
entier ailleurs (panneau détail, long-press).

### 1.2 Touch-first, clavier-égal
Phaser unifie tap et clic (`pointerdown`). Toute action clavier (Z, ESC, I, K, A/E/R/F, 1–4) **doit**
avoir un équivalent tactile visible : boutons `INV`/`SKL` du HUD, hit zones des skill slots, tap-to-advance
du dialogue, boutons d'action du panneau détail. Aucune fonctionnalité ne doit être hover-only ou
keyboard-only. Le survol (`pointerover`) est un *bonus desktop*, jamais le seul chemin d'accès à une info.

### 1.3 Feedback immédiat (< 100 ms)
Règle héritée d'Alabaster Dawn (INSPIRATIONS.md §3) : *« Chaque action du joueur doit avoir un retour
immédiat — jamais de silence. »* Concrètement dans le code :

- Tap sur skill slot HUD : alpha 0.6 → 1 en **80 ms**, puis scale 1.15 yoyo **60 ms** (`Back.easeOut`).
- Tap sur bouton nav : flash blanc alpha 0.25 → 0 en **150 ms**.
- Tap-equip inventaire : flash blanc 0.8 → 0 en **400 ms** sur le slot paperdoll cible.
- Combo pip qui s'allume : pop scale 1.0 → 1.4 → 1.0 en **120 ms** total.

Le retour visuel part sur `pointerdown`, pas `pointerup` — le joueur sent l'input à l'instant du contact.

### 1.4 Hiérarchie visuelle — l'UI est discrète, le combat est roi
Référence HUD : Alabaster Dawn + SAO. Les barres sont lisibles mais ne gênent jamais la lecture de
l'action. Maximum **3 niveaux d'information simultanés**. La rareté d'un item est TOUJOURS portée par
sa couleur (`RARITY_COLORS`) dans toutes les interfaces.

### 1.5 Économie d'écran
800×600 c'est petit. Labels de 2–3 mots max (`INV`, `SKL`, `← Stats`). Noms d'items complets
uniquement dans le panneau détail. Chaque panneau a un titre court en `TXT_GOLD` 11 px gras et un
séparateur `drawDivider`.

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
| `UI.BG_DEEP` | `0x060810` | Fond très sombre (menus overlay) |
| `UI.BG_MID` | `0x0e1520` | Fond panneau mid / cartes |
| `UI.SEPARATOR` | `0x1a2535` | Séparateurs discrets, bordure de carte |

#### Texte (format string pour les Text objects) — contraste vérifié sur `PANEL_BG`
| Token | Hex | Usage | Contraste |
|-------|-----|-------|-----------|
| `UI.TXT_PARCHMENT` | `#f5edd0` | Texte primaire par défaut | ≥ 12:1 |
| `UI.TXT_GOLD` | `#c8a030` | Titres, valeurs importantes, or, nom du joueur | ≥ 6:1 |
| `UI.TXT_MUTED` | `#9a8a7a` | Texte secondaire, labels, descriptions, fourchettes de stats | ≥ 5.8:1 |
| `UI.TXT_HINT` | `#6b5a48` | Hints clavier, texte tertiaire discret (jamais d'info critique) | ≈ 2.9:1 |
| `UI.TXT_BLUE` | `#88aaff` | MP, choix de dialogue, liens, skills | ≥ 7:1 |
| `UI.TXT_GREEN` | `#55dd66` | HP, confirmations, actions positives (équiper) | ≥ 8:1 |
| `UI.TXT_RED` | `#dd4433` | Danger, bouton ×, erreurs | ≥ 4.5:1 |
| `UI.TXT_ORANGE` | `#ff9940` | Vente, quêtes, avertissements | ≥ 7:1 |
| `UI.TXT_WHITE` | `#ffffff` | Valeurs sur barres (toujours avec stroke noir) | max |

#### Slots, boutons, barres, accents
Identiques à l'existant : `SLOT_BG/SLOT_BORDER/SLOT_ACTIVE`, `BTN_BG/BTN_BG_HOVER/BTN_BORDER/BTN_BORDER_HOV`,
`HP_*` (vert > 50 %, orange 25–50 %, rouge < 25 %), `MP_*` (bleu), `XP_*` (violet),
`ACCENT_VIOLET 0x9966ff`, `ACCENT_CYAN 0x44ddcc`, `GLOW_GOLD 0xffcc66`.

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
> le code fait foi pour l'UI tant que la divergence n'est pas arbitrée (dette D10).

#### Couleurs élémentaires (chiffres de dégâts — INSPIRATIONS.md §3)
Feu `0xff4400` · Eau `0x2266ff` · Foudre `0xffee00` · Glace `0x88ddff` · Vent `0xaaddff` · Terre `0x88aa33`

#### Combo HUD (pips sous le joueur)
Validé `0xf0e8d8` · Restant `0x444444` · Finisher prêt `0xffb347` (ambre) · Combo cassé `0x777777`
**Interdits pour les pips :** azur `0x66ddff` et doré `0xffe066` (réservés à d'autres systèmes).

### 2.2 Typographie — LE cœur de la refonte

**Deux familles, deux fonctions :**

| Constante | Famille | Rôle |
|-----------|---------|------|
| `FONT` | `'Press Start 2P', monospace` | **Identité uniquement** : titre du jeu (MainMenu 24 px). Ne plus l'utiliser pour du texte fonctionnel. |
| `FONT_UI` | `Verdana, 'Segoe UI', Tahoma, Geneva, sans-serif` | **Tout le reste.** Créée via `uiStyle()`. |

**Échelle typographique officielle** (constante `TYPE` de UITheme.ts, px logiques) :

| Rôle | Taille | Style | Exemples dans le code |
|------|--------|-------|----------------------|
| Titre d'écran | **15** | bold + stroke, doré | `INVENTAIRE` |
| Titre de section / nom (heading) | **13** | bold, souvent stroke | Nom d'item détail, speaker dialogue, nom de talent, boutons MainMenu |
| Corps / valeur (body) | **12** | normal ou bold | Corps de dialogue (13), main stat, notifications, nom de zone |
| Label / secondaire | **10–11** | normal | Labels de stats, substats, descriptions, tabs (11), boutons d'action (11) |
| Badge / hint / micro | **9** | — | **MINIMUM ABSOLU.** Abréviations de slots, hints, lore, footer |

Règles :
- **Toujours passer par `uiStyle(size, color, opts)`** — jamais de style inline.
- **Jamais de taille < 9 px** : tout texte au plancher référence **`TYPE.SMALL`** (pas un `9` en
  dur) — purge complète des 7–8 px effectuée le 2026-07-12 (Arsenal, Bestiaire, Inventaire, Dialogue).
- Texte superposé à une barre, un sprite ou une icône → `{ stroke: true }` (contour noir épaisseur 3).
- Texte long → `{ wordWrapWidth: ... }`, jamais de débordement.
- Chiffres/valeurs à droite : `.setOrigin(1, 0)` ; titres centrés : `.setOrigin(0.5, 0)`.
- Chiffres de quantité sur les slots : 10 px bold + stroke.
- `pxStyle()` reste défini dans UITheme.ts mais n'est plus référencé que par le **titre du jeu
  de MainMenuScene** (seul usage identitaire autorisé). Toutes les autres scènes sont migrées
  vers `uiStyle` (passe « arcane fresh » 07/2026) — **ne jamais l'utiliser dans du nouveau code
  fonctionnel** (dette D11 résorbée).

### 2.3 Espacements et dimensions standard

| Constante | Valeur | Usage |
|-----------|--------|-------|
| `LAYOUT.PANEL_RADIUS` | 6 | rayon des panneaux arrondis |
| `LAYOUT.CARD_RADIUS` | 4 | rayon des cartes / boutons |
| `LAYOUT.SHADOW_COLOR/ALPHA` | noir / 0.45 | ombre portée de `drawCard` |
| `LAYOUT.TOUCH_MIN` | 44 | zone tactile minimum |
| Marge externe d'écran overlay | 6–8 px | `MARGIN = 8` (inventaire), 6 (skills) |
| Gap entre panneaux | 6 px | `GAP = 6` |
| Padding interne panneau | 8–12 px | textes à `x + 10/12` |
| Header d'écran overlay | 36 px | `HEADER_H = 36` |
| Slot inventaire | 48 px | `INV_SLOT = 48` |
| Slot équipement (paperdoll) | 44 px (+8 hit) | `EQ_SLOT = 44` |
| Skill slot HUD | 52 px (+6 hit zone) | combat = cible élargie |
| Bouton nav HUD | 54×44 px (+4 hit zone) | `INV` / `SKL` |
| Bouton × fermeture | glyphe 20–22 px, hit zone 48×48 | `addCloseButton` partout |
| Bouton d'action panneau | visuel 32 px, hit ≥ 44 px | InventoryScene détail |
| Hauteur ligne de stats | 22 px | `ROW_H = 22` (lisible en 10/11 px) |
| Bande XP | 4 px pleine largeur, bas d'écran | HUD |

### 2.4 Durées d'animation standard

| Animation | Durée | Où |
|-----------|-------|----|
| Feedback tap (alpha/flash) | 80–150 ms | skill slots, nav buttons |
| Pop scale yoyo | 60 ms (×2 = 120 ms) | skill tap, combo pip |
| Flash de confirmation (equip) | 400 ms | paperdoll |
| Fade-in d'ouverture de scène overlay | **300 ms** (unifié) | `cameras.main.fadeIn(300, 0, 0, 0)` |
| Fade-out avant `scene.start()` | **300 ms** | + garde `transitioning` anti double-tap (`MainMenuScene.transitionTo()`) |
| Hover bouton (scale) | 100 ms, scale 1.03 (`Quad.easeOut`) | MainMenu, Pause |
| Entrée échelonnée des boutons de menu | delay 0/80/160 ms, fade+slide 350 ms | MainMenuScene |
| Pop-in popup (scale 0.9→1) | 90 ms `Back.easeOut` | popup consommable |
| Notification visible | 2500 ms + fade out 400 ms | HUD |
| Nom de zone | fade-in 400 ms, hold 3500 ms, fade partiel 1000 ms → alpha 0.4 | HUD |
| Lerp des barres HP/MP | vitesse 8/s (jamais de saut sec) | HUD |

### 2.5 Profondeurs (depth) réservées

| Depth | Réservé à |
|-------|----------|
| < 0 | Tap zones d'arrière-plan (ex. tap-to-advance dialogue à -1) |
| 0 | Contenu par défaut |
| 5–7 | Hit zones interactives du HUD |
| 10 | Notifications, bouton × |
| 30 | Tooltips |
| 50–51 | Combo pips + particules finisher, popups, messages de sauvegarde |
| 199–200 | Badge de build DEV (jamais rien au-dessus) |

### 2.6 Overlays plein écran

Fond noir semi-opaque derrière tout écran modal : `add.rectangle(W/2, H/2, W, H, 0x000000, alpha)`.
Valeurs unifiées : **0.88 standard** (inventaire, skills, shop), 0.72 (pause — plus léger volontairement,
le jeu figé reste visible en fond).

**Panneaux translucides** : les frames principaux passent `fillAlpha` à `drawPanel`/`drawGlowPanel` —
0.85 pour un panneau principal, 0.92 pour un panneau secondaire (réf. Hades / Hollow Knight).

---

## 3. Composants UI réutilisables (`src/utils/UITheme.ts`)

### 3.1 `uiStyle(size, color?, opts?)` — LE style de texte
Chemin unique pour tout nouveau texte. Options : `bold`, `italic`, `stroke` (contour noir 3),
`wordWrapWidth`, `align`, `lineSpacing`.

```typescript
this.add.text(x, y, 'INVENTAIRE', uiStyle(15, UI.TXT_GOLD, { bold: true, stroke: true }));
this.add.text(x, y, desc, uiStyle(10, UI.TXT_MUTED, { italic: true, wordWrapWidth: 200 }));
```

### 3.2 `drawPanel(g, x, y, w, h, fill?, fillAlpha?)` — le panneau médiéval
Fond sombre + double bordure + 4 rivets dorés. Pour les **frames** d'écran et sous-panneaux.
`fillAlpha` 0.85 = frame principal translucide, 0.92 = panneau secondaire.

### 3.3 `drawGlowPanel(g, x, y, w, h, accent?, bg?, radius?, fillAlpha?)` — le panneau moderne
Fond arrondi + liseré fin + accent 30 %. Pour HUD, dialogue, cartes de save, popups.

### 3.4 `drawCard(g, x, y, w, h, opts?)` — la carte de contenu
Ombre portée douce + fond arrondi `BG_MID` + bordure `SEPARATOR` + **barre d'accent verticale
optionnelle à gauche** (`opts.accent` — rareté d'un item, couleur de branche…). Pour les lignes
d'item, cartes de quête, rangées de liste. Options : `bg`, `accent`, `radius`, `fillAlpha`, `shadow`.

### 3.5 `drawDivider(g, x, y, w, color?, alpha?)` — séparateur horizontal
Remplace tous les `lineStyle/moveTo/lineTo` répétés.

### 3.6 `addCloseButton(scene, cx, cy, onClose, depth?)` — fermeture standard
Glyphe `×` rouge 22 px bold + stroke, hit zone **48×48**, hover orange. À placer en **haut à
droite** de tout écran/panneau fermable. ESC ferme toujours aussi. Retourne `{ glyph, hit }`
pour gestion dynamique.

### 3.7 `drawBar(g, x, y, w, h, pct, fill, bg, shine)` — barres de progression
Remplissage + brillance + graduations + contour. HP 16 px de haut, MP 11 px. Texte `courant/max`
centré, `uiStyle(9–10, WHITE, { bold, stroke })`.

### 3.8 `drawBadge(scene, x, y, label, bgColor, textColor?)` — badge coloré
Fond arrondi + label 9 px bold moderne, retourné en Container centré.

### 3.9 `drawGlow(g, x, y, w, h, color?, intensity?)` — halo lumineux
4 anneaux stroke pixel-friendly. Réservé aux éléments « héros » (titres, level-up, EPIC+) —
jamais sur un composant répété en liste.

### 3.10 Bouton standard (pattern)
```typescript
// 1. Fond : fillRoundedRect(x, y, w, h, 4) en UI.BTN_BG + bordure UI.BTN_BORDER
// 2. Label : uiStyle(11, couleur sémantique, { bold: true }), origin 0.5
// 3. Hit zone invisible ≥ max(44, visuel + 6), setInteractive({ useHandCursor: true })
// 4. pointerover  → bordure UI.BTN_BORDER_HOV + label doré (bonus desktop)
// 5. pointerout   → état normal
// 6. pointerdown  → flash blanc alpha 0.25 → 0 en 150 ms + action
```
Hauteur minimum de la **hit zone** d'un bouton : **44 px**. Le visuel peut descendre à 32 px.

### 3.11 Slot d'item
Fond `SLOT_BG`, **bordure = couleur de rareté** (`RARITY_COLORS`, alpha 0.3–0.55 si vide, 1 si occupé),
icône 32×32 centrée (fallback : carré de couleur rareté alpha 0.5 via `resolveIcon()` +
`addColorSquare()`), badge quantité 10 px bold + stroke en bas-droite (origin (1,1)),
survol = bordure blanche. Slot vide du paperdoll : abréviation fantôme 9 px bold `TXT_HINT` centrée.

### 3.12 Notifications (HUD)
File FIFO, une seule visible à la fois, au-dessus des skill slots, centrée. 12 px bold + stroke,
couleur sémantique (doré = level-up, orange = quête, bleu = skill, vert = zone, couleur de rareté =
loot). 2.5 s + fade 400 ms. Les items Common ne notifient pas (anti-spam).

### 3.13 Tooltip
Panneau depth 30, nom doré 13 px bold + description muted 10 px wrapped. Position clampée dans
l'écran. **Attention :** le tooltip SkillScene historique est hover-only — tout nouveau tooltip
doit aussi s'ouvrir au long-press (cf. §5.2, dette D3).

---

## 4. Layout responsive et safe zones

1. **Toujours** dériver les positions de `this.cameras.main.width/height`. Les constantes de layout
   (largeurs de panneaux, tailles de slots) peuvent être fixes ; les **positions** sont relatives.
2. Panneau bas ancré : `PANEL_TOP = H - PANEL_H - 4` ; éléments à droite : `W - marge - largeur`.
3. **Zone de pouce** = moitié basse de l'écran. Y vivent : barres HP/MP (bas-gauche), skill slots
   (bas-centre), boutons nav INV/SKL (bas-droite), boutons d'action des panneaux détail (bas du panneau),
   panneau de dialogue (bande basse de 180 px).
4. **Safe zone basse** : la bande XP occupe les 4 derniers px ; garder les hit zones interactives à
   ≥ 7 px du bord bas (les skill slots sont à `H - SLOT_SZ - 7`).
5. Grilles : nombre de colonnes **calculé** depuis la largeur disponible quand c'est possible.
   Le `INV_COLS = 7` fixe de l'inventaire fonctionne car les largeurs de panneaux sont fixes — ne pas
   copier ce pattern dans un écran dont les panneaux sont fluides.
6. Contenu scrollable : geometry mask (`createGeometryMask`) + clamp + **wheel ET drag vertical**
   (§5.4 — pattern de référence dans `InventoryScene.renderGrid`).
7. Test mental obligatoire : « à 375 CSS px de large, ce bouton fait la moitié de sa taille logique —
   est-il encore tapable ? ce texte fait la moitié de sa taille — est-il encore lisible ? »

---

## 5. Interactions standard

### 5.1 Tap = action primaire
Équiper / utiliser / valider / avancer le dialogue / lancer un skill. Un seul tap, action immédiate,
feedback < 100 ms. Dans la grille d'inventaire : tap court = `doMainAction()` (equip / use / détail
pour les key items). **Un tap dont le pointeur a bougé de > 10 px est un scroll, pas un tap**
(`pointer.getDistance() > 10` → ignorer l'action).

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
hit.on('pointerup', (p: Phaser.Input.Pointer) => {
  if (this.longPressTimer !== null) {      // relâché avant 500 ms → tap
    clearTimeout(this.longPressTimer);
    this.longPressTimer = null;
    if (p.getDistance() > 10) return;      // c'était un scroll
    this.doMainAction(item.id);
  }
});
hit.on('pointerout', () => {               // le doigt sort → annule tout
  if (this.longPressTimer !== null) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
});
// ET dans shutdown() : clearTimeout + null — jamais de timer orphelin
// ET le drag de scroll annule aussi le timer (voir InventoryScene.renderGrid)
```

### 5.3 Swipe horizontal = navigation entre panneaux/tabs
Implémenté dans SkillScene (branches). Seuil : **60 px logiques** de delta X, delta Y max 40 px.

### 5.4 Scroll vertical = wheel + drag
Tout contenu scrollable supporte les deux (pattern de référence : `InventoryScene.renderGrid`) :
```typescript
this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
  if (!p.isDown) return;
  if (/* p.downX/downY hors de la zone scrollable */) return;
  scrollY = Phaser.Math.Clamp(scrollY - (p.y - p.prevPosition.y), 0, maxScroll);
  for (const { obj, baseY } of scrollables) obj.setY(baseY - scrollY);
  if (p.getDistance() > 10) { /* annuler le long-press en cours */ }
});
// shutdown()/clear : this.input.off('pointermove')
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
`removeKey()` pour chaque touche, `clearTimeout` des long-press, `input.off('wheel')` ET
`input.off('pointermove')`. Les handlers d'événements vérifient `if (!this.sys.isActive()) return;` en tête.

---

## 6. Règles par écran

### 6.1 UIScene (HUD)
Hérite de tout §1–5. Spécifique :
- **Panneau stats bas-gauche** (66 px de haut, ancré `H - 66 - 4`) : nom joueur doré 11 px bold,
  niveau 11 px à droite, barre HP 178×16 + barre MP 178×11, labels `HP`/`MP` vert/bleu 10 px bold,
  valeurs 9–10 px bold + stroke centrées sur les barres.
- **Barres lerpées** (vitesse 8/s) — jamais de saut instantané, redraw seulement si delta > 0.001.
  Traîne de drain orange retardée sur la barre HP (lerp 1.5/s, snap sur soin).
- **Skill slots bas-centre** : 4 slots de **52 px** (gap 5), icône 34×34, badge touche (A/E/R/F) doré
  9 px bold en coin haut-gauche, overlay cooldown + texte 14 px bold + stroke, hit zone 58×58, feedback §1.3.
- **Boutons nav bas-droite** : `INV` et `SKL` 54×44, label 11 px bold doré, flash blanc 150 ms,
  émettent `mobile_action`.
- **Bande XP** : 4 px pleine largeur tout en bas, violette, sans lerp.
- **Nom de zone** haut-droite doré 12 px bold ; **notifications** 12 px bold + stroke au-dessus des slots.
- **Combo pips** : losanges 4×4 sous le joueur (+26 px), espacés de 7 px, alpha 0.75, fade-out après
  2 s sans attaque. Couleurs §2.1. Échec de combo = gris + blink + fade — *« silencieux, jamais humiliant »*.
- **Badge de build DEV** haut-gauche (depth 199–200) — obligatoire (CLAUDE.md), mais **discret** :
  texte monospace 8 px vert clair sur bande translucide sombre + tick vert 3 px, alpha 0.85.

### 6.2 InventoryScene
Layout 3 panneaux fixes : **paperdoll 180 px | stats/détail 220 px | grille** (largeur restante, 7 col × 48 px).
- **Header** : titre `INVENTAIRE` 15 px bold doré + stroke, **bouton × standard haut-droite**
  (`addCloseButton`), encadré or (130×24, valeur 11 px bold) à gauche du ×.
- **Paperdoll style Dofus** (panneau gauche) : silhouette stylisée semi-transparente (tête + capsule
  corps, parchemin alpha 0.05–0.06) derrière la colonne centrale ; slots 44 px disposés en croix :
  `amulette|casque|cape` / `arme|plastron|gants` / `anneau1|jambes|anneau2` / `bottes` (constante
  `PAPERDOLL_POS`). Slot vide = abréviation fantôme 9 px ; slot occupé = bordure rareté + icône 32,
  tap → détail, hit zone +8 px. Sous le paperdoll : divider + nom du joueur 12 px bold doré +
  `Niveau X` 10 px + hint 9 px en bas.
- **Tap = action, long-press = détail** (§5.2) — hint « Tap = action • Maintenir = détail »
  en bas du panneau stats.
- **Panneau stats** : titre 11 px bold, lignes de 22 px avec **zébrage** alpha 0.025 une ligne sur
  deux, label 10 px muted à gauche, valeur 11 px bold parchemin à droite.
- **Panneau détail** : `← Stats` 10 px bold bleu → `[RARETÉ]` 9 px bold → nom 13 px bold couleur
  rareté (wrapped, stroke) → main stat 12 px bold doré → divider → substats à puces 10 px →
  description 10 px muted italique → **boutons d'action empilés en bas** (zone de pouce) : visuel
  32 px arrondi, hit ≥ 44 px, label 11 px bold — Équiper/Utiliser (vert), Vendre (orange), Fermer (muted).
- Équiper flashe le slot paperdoll cible en blanc 400 ms (`lastFlashSlotKey`).
- **Grille** : bordure de cellule = rareté, badge quantité 10 px bold + stroke, scroll **wheel + drag
  vertical** (§5.4), tap avec `getDistance() > 10` ignoré (anti-scroll-tap).
- Popup consommable : `drawGlowPanel` accent vert, nom 11 px bold rareté, effet 10 px vert,
  boutons 44 px, pop-in 90 ms, auto-dismiss 4 s, tap extérieur ferme.
- Raccourcis ESC (fermer) et Z (action principale). Refresh par destruction/recréation des
  `dynamicObjs` — toujours pousser chaque objet dynamique dans le tableau.

### 6.3 DialogueScene
- Panneau = bande basse de **180 px** (`H - 180 - 6`), pleine largeur moins 16 px — zone de pouce.
- Portrait 80×80 encadré `drawGlowPanel` accent rôle ; placeholder = cercle accent + initiales 20 px bold.
- Couleur d'accent par rôle de NPC (exception documentée aux tokens) : marchand or, forgeron orange,
  quête bleu, lore violet, habitant vert.
- **Speaker en badge teinté** : 13 px bold doré + stroke sur fond accent alpha 0.22 arrondi.
- Corps **13 px parchemin + lineSpacing 6** avec wordWrap — lisible sans zoom.
- Machine à écrire 30 ms/lettre ; tap pendant la frappe = skip.
- **Tap n'importe où sur le panneau = avancer** (§5.5) ; Z/ESPACE/Entrée équivalents ; ESC ferme.
- Choix : boutons `drawGlowPanel` 36 px (hit ≥ 44), numéro 9 px hint + texte 11 px bleu, touches 1–4.
- Bouton `×` 20 px bold rouge haut-droite avec hit zone 44×44 ; bouton Commerce/Forge 128×36
  (hit 44) label 11 px bold.

### 6.4 SkillScene
- Overlay 0.88, frame plein écran moins 12 px.
- **Tabs 2 rangées** (36 px, hit ≥ 44) : label 11 px bold — blanc si actif (fond couleur de branche +
  bande d'accent basse 3 px), muted sinon. Swipe horizontal change de branche.
- Header de branche : nom 13 px bold doré + stroke, description 9 px muted, compteur `✶ N pts`
  11 px bold à droite.
- Nodes 60 px (+7 hit) : débloqué = plein couleur branche + bord blanc ; disponible = fond 28 % +
  bord branche + anneau interne ; verrouillé = sombre ; NG+ = croix. Label sous le node **9 px +
  stroke** (tronqué à 13 caractères).
- Bottom sheet 148 px : nom 13 px bold doré, description 10 px muted, effets 10 px parchemin
  (lineSpacing 3), coût 11 px bold doré, statut 10 px, lore 9 px italique hint, bouton **Débloquer
  136×40 arrondi** (hit ≥ 44) label 13 px bold + stroke.
- Réspec : 160×26 arrondi, label 10 px bold, hit 44 px de haut.
- Bouton `×` 20 px bold + hit zone ≥ 44 haut-droite ; ESC ferme.
- Sélection = re-render de branche (dette D4 : pas de micro-feedback).

### 6.5 PauseScene *(migrée « arcane fresh » 07/2026 — drawGlowPanel + uiStyle)*
- Overlay 0.72 (plus léger : le jeu reste visible), panneau central `drawGlowPanel` 400 px de large,
  accent `ACCENT_ARCANE`, titre 15 px doré + `addCloseButton` haut-droite.
- **3 tabs** (Jeu / Touches / Réglages) visuel 104×24 arrondi, tab actif = fond `BG_MID` + liseré et
  bande basse `ACCENT_ARCANE` + label `TXT_CYAN` bold ; **hit zones 44 px de haut** (dette D6 résorbée).
- Boutons de menu 260×34 arrondis (hit 44), hover = liseré arcane + label doré.
- Toggles ON/OFF : pilule arrondie teintée vert `0x081a08` / rouge `0x1a0808`, texte `TXT_GREEN`/`TXT_RED`,
  hit 44 px.
- Rebind clavier : slot en attente = fond `0x1a2030` + liseré doré + `...` bleu, ESC annule.
- Confirmation de sauvegarde : texte centré vert/rouge, fade-in 150 ms, hold 1600 ms, fade 300 ms.

### 6.6 MainMenuScene
- **Fond diorama procédural** (aucun asset) : ciel en bandes, nuages TileSprite 3 couches, montagnes
  LCG à graine fixe (jamais de `Math.random` dans `create()`), lac animé, pont, héros silhouette avec
  respiration sinusoïdale. Voile de lisibilité `0x000822` alpha 0.12 ; cadre décoratif bordure seule.
- **Titre : SEUL usage restant de la police pixel** (`pxStyle(24)`) — identité du jeu, halo doré +
  pulsation. Sous-titre 11 px muted, citation 10 px italique.
- Boutons : **240×44** (norme tactile), label 13 px bold, entrée échelonnée, hover scale 1.03,
  press scale 0.96.
- Cartes de save : slot 10 px bold doré, nom+niveau 11 px, méta 10 px muted à droite.
- Modales New Game / Load : titre 14 px bold + stroke, **hit zone = toute la carte 400×48**
  (jamais le texte seul), cancel avec hit 200×44.
- Toute sortie de scène passe par `transitionTo()` (fade-out 300 ms + garde `transitioning`).

---

## 7. Cohérence inter-écrans — points NON NÉGOCIABLES

Identiques sur **tous** les écrans, actuels et futurs :

1. **Fermeture** : `addCloseButton()` en **haut à droite** (hit ≥ 44×44, hover orange) ET la touche ESC.
2. **Feedback tap < 100 ms** sur `pointerdown` : flash, alpha ou scale — jamais d'action silencieuse.
3. **Toute action clavier a un équivalent tactile** visible, via `mobile_action` si elle touche au gameplay.
4. **`uiStyle` / `drawPanel` / `drawGlowPanel` / `drawCard` / `drawBar` / `UI.*`** exclusivement —
   aucune couleur ou style de texte en dur (exceptions listées : couleurs de rareté via
   `RARITY_COLORS`, couleurs élémentaires §2.1, pips combo, accents de rôle NPC).
5. **Couleur de rareté** = bordure de slot ET couleur du nom de l'item, partout où un item apparaît.
6. **Labels de touches A/E/R/F** identiques entre HUD et SkillScene (doré bold, coin du slot).
7. **Titres d'écran** : doré, 15 px bold + stroke, centrés, avec `drawDivider` en dessous.
8. **Long-press 500 ms = détail** partout où un item/skill a des infos supplémentaires.
9. **Fade-in 300 ms** à l'ouverture de tout écran overlay ; fond noir 0.88 (0.72 pour pause).
10. **`shutdown()` complet** (§5.7) dans chaque scène UI — règle CLAUDE.md.
11. **Hit zone invisible ≥ visuel + 4 px** pour tout élément interactif < 60 px ; hit ≥ 44 px toujours.
12. **Zone de pouce** : les boutons d'action (valider, équiper, utiliser, fermer un détail) vivent dans
    la moitié basse du panneau/écran.
13. **Texte fonctionnel ≥ 9 px `FONT_UI`** ; la police pixel est réservée à l'identité (titre du jeu).
14. **Tap vs scroll** : toute liste scrollable ignore les taps dont `pointer.getDistance() > 10`.

### Dette UX connue (à résorber, ne PAS répliquer dans du nouveau code)
| # | Écart | Où | Statut |
|---|-------|-----|--------|
| ~~D1~~ | ~~Pas de bouton × haut-droite~~ | InventoryScene | **Résorbée** — `addCloseButton` (refonte 07/2026) |
| ~~D2~~ | ~~Scroll grille = wheel uniquement~~ | InventoryScene | **Résorbée** — drag vertical + anti scroll-tap |
| D3 | Tooltip skill hover-only, inaccessible au tap | SkillScene (ancien tooltip) | ouverte |
| D4 | Sélection de node = re-render complet, pas de micro-feedback | SkillScene | ouverte |
| ~~D5~~ | ~~Textes 5 px sous le minimum~~ | InventoryScene | **Résorbée** — plus aucun texte < 9 px dans les scènes migrées |
| ~~D6~~ | ~~Boutons < 44 px de haut (20–34 px)~~ | PauseScene | **Résorbée** — hit zones ≥ 44 px sur menu/tabs/toggles (visuels 24–34 px conservés) |
| ~~D7~~ | ~~Choix de dialogue = hit zone du texte seul~~ | DialogueScene | **Résorbée** — hit ≥ 44 px |
| D8 | Swipe horizontal non implémenté (nav panneaux) | InventoryScene, PauseScene | ouverte (fait dans SkillScene) |
| ~~D9~~ | — | — | **Résorbée** (fade-in/out 300 ms unifiés) |
| D10 | `RARITY_COLORS` (code) diverge du tableau INSPIRATIONS.md §4 (Hidden, Mythic) | `src/types/index.ts` | ouverte |
| ~~D11~~ | ~~Scènes non migrées vers `uiStyle`/`FONT_UI` (encore en `pxStyle` pixel)~~ | Pause, Shop, Bestiary, NameInput, Intro, Ending, UIScene, SkillScene | **Résorbée** — passe « arcane fresh » généralisée (07/2026) ; seul le titre du jeu (MainMenu, NameInput) reste en police pixel (identité) |
| D12 | Pas de drag-and-drop grille → paperdoll (le tap-equip couvre le besoin, D&D = confort desktop) | InventoryScene | ouverte, basse priorité |
| D13 | Pas d'onglets de filtrage du sac (Tous / Équipement / Conso / Ressources / Quête) | InventoryScene | ouverte |
| D14 | Pas de comparaison item survolé vs équipé (flèches vertes/rouges — INSPIRATIONS.md §4) | InventoryScene détail | ouverte |

---

## 8. Checklist « avant de livrer un écran »

Cocher chaque point avant de considérer un écran UI comme terminé :

- [ ] Toutes les positions dérivent de `this.cameras.main.width/height` — aucun 800/600 en dur
- [ ] **Typo : 100 % `uiStyle` (FONT_UI)** — la police pixel uniquement pour un titre identitaire justifié
- [ ] Aucun texte fonctionnel < 9 px ; texte sur barre/sprite/icône avec `stroke: true` ; wordWrap sur tout texte long
- [ ] Tout élément interactif a une hit zone ≥ 44×44 px logiques (≥ 52 px si utilisé en combat)
- [ ] Hit zones invisibles élargies de +4 à +6 px au-delà du visuel
- [ ] Chaque `pointerdown` produit un feedback visuel < 100 ms
- [ ] Aucune info ou action accessible uniquement au hover ou au clavier
- [ ] Tap = action primaire ; long-press 500 ms = détail (timer nettoyé sur up/out/drag/shutdown)
- [ ] `addCloseButton` haut-droite + ESC pour fermer
- [ ] Boutons d'action dans la moitié basse (zone de pouce)
- [ ] 100 % des styles via `uiStyle` / `drawPanel` / `drawGlowPanel` / `drawCard` / `drawBar` / `UI.*` — zéro hex sauvage
- [ ] Noms et bordures d'items colorés par `RARITY_COLORS`
- [ ] Contenu scrollable : geometry mask + clamp + wheel + drag vertical + anti scroll-tap (`getDistance() > 10`)
- [ ] Fade-in 300 ms + overlay noir (0.88 standard)
- [ ] Depths conformes au tableau §2.5 (rien au-dessus de 199 sauf badge build)
- [ ] `shutdown()` retire TOUS les listeners, touches, timers, le wheel ET le pointermove
- [ ] `if (!this.sys.isActive()) return;` en tête des handlers d'événements externes
- [ ] Actions gameplay tactiles émises via `mobile_action` (jamais d'appel direct à GameScene)
- [ ] Vérification mentale à 375 CSS px : tout reste lisible et tapable au facteur ×0.47
- [ ] Ton visuel conforme à INSPIRATIONS.md : médiéval fantasy sombre, sobre, jamais tech/générique —
      **UI moderne, sprites pixel**

---

*Document vivant — le mettre à jour à chaque évolution de UITheme.ts, ajout de composant réutilisable,
ou résorption d'un point de dette §7. Le code et ce document ne doivent jamais diverger silencieusement.*
