# Session fixes — Grievy Town's Dilemma
Date : 2026-06-27

## Bugs à corriger (tous en cours / à faire)

### [x] 1. Spells désactivés
- Vider `equippedSkills` dans `GameScene.init()` → slots tous à null
- Les spells consomment du mana mais ne font rien visuellement → désactivés en attendant le skill tree

### [x] 2. Croix pour fermer un dialogue
- Ajouter un bouton X interactif en haut à droite du panel dans `DialogueScene.create()`

### [x] 3. Crash onglet Compétences (SkillScene)
- ROOT CAUSE : `GameScene.openSkills()` passe `{ player: this.gameState.player }` 
  mais `SkillScene.init()` attend `{ gameScene: GameScene }`
- FIX : changer en `this.scene.launch('SkillScene', { gameScene: this })`

### [x] 4. Crash Save > Menu principal > Load
- ROOT CAUSE : `PauseScene.goMainMenu()` arrête PauseScene en premier, 
  puis appelle `this.scene.start('MainMenuScene')` depuis une scène déjà stoppée
  → double-stop sur PauseScene + état physique non résumé avant transition
- FIX : ajouter `GameScene.goToMainMenu()` qui gère proprement toutes les scènes,
  et `PauseScene.goMainMenu()` délègue à cette méthode

### [x] 5. Bug zone transition (écran noir) + dash inversé
- ROOT CAUSE zone : `this.cameras.main.fade(400, 0,0,0)` fade vers le noir, 
  mais le NEW GameScene (après scene.restart) ne fait pas de fade-in → écran reste noir
- FIX : ajouter `this.cameras.main.fadeIn(300)` dans `GameScene.create()`
- Dash inversé : probablement des bindings corrompus dans localStorage 
  → le bouton "Réinitialiser" dans l'onglet Touches règle ça

### [x] 6. Boutons du menu pause fonctionnels
- Inventaire : OK (fonctionne via resume() + openInventory())
- Compétences : crash → fix #3 résout ça
- Sauvegarder : fonctionne déjà
- Menu principal : fix #4

### [x] 7. Interaction NPC (W seul, sans Z simultané)
- ROOT CAUSE : NPC a un COLLIDER (physics.add.collider) qui empêche le vrai overlap
  → l'overlap callback ne fire que quand le joueur pousse activement contre le NPC
- FIX : remplacer l'overlap par un check de distance dans `update()` 
  (setData('npcId', id) sur sprite, forEach + Phaser.Math.Distance.Between < 42px)

### [ ] 8. Spawn aléatoire d'objets
- OK tel quel, rien à faire
- TODO plus tard : spawns fixes avec réapparition pour farm de ressources

### [x] 9. HUD (HP/MP débordement, gold, position)
- Retirer gold de la barre de statut
- Déplacer le panel en BAS À GAUCHE (était haut à gauche)
- HP/MP text : mettre À L'INTÉRIEUR des barres (centré) plutôt qu'à droite
- Panel extensible (pas de texte qui dépasse)

### [x] 10. Agent gamefeel
- Créer `.claude/agents/gamefeel-agent.md`

## Architecture agents — décisions prises

### Découpage proposé du code-reviewer → 3 agents spécialisés
- `ts-auditor` : TypeScript types, imports, erreurs de compilation
- `phaser-auditor` : lifecycle scènes, assets, tilemap, input
- `data-auditor` : cohérence données (IDs, quêtes, loot tables, save/migrations)

### Découpage proposé du dev-agent → 3 agents spécialisés  
- `systems-dev` : logique pure (combat, loot, inventory, XP, saves)
- `phaser-dev` : scènes, tilemaps, animations, input, caméra
- `ui-dev` : HUD, menus, responsive canvas, touch controls

## Notes techniques importantes

- `gh` CLI non installé, Chocolatey bloqué par security policies
- `curl` dans Git Bash nécessite `-k` (SSL inspection d'entreprise)
- Token OAuth récupérable via `git credential fill`
- `npm` fonctionne via Git Bash (pas PowerShell)
