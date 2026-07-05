# Changelog — Grievy Town's Dilemma

Toutes les modifications notables du projet sont documentées ici.  
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) — versionnage sémantique.

---

## [0.7.0] — 2026-06-25 — Expansion majeure : villes, NPCs, quêtes, craft SAO

### Ajouté — Nouvelles villes (12 zones)
- **`src/data/zones.ts`** : 2 villes par zone élémentaire (mouvement libre dans la zone, chargement entre zones OK)
  - Ignis Reach : Ashford (Nv8), Pyrath's Crossing (Nv9)
  - Terravast : Deepdelve (Nv10), Stone Watch (Nv11)
  - Zephyr Peaks : Windherald (Nv12), Cloudspire (Nv13)
  - Abyssmar : Saltmourn (Nv14), The Wreck (Nv15)
  - Volterra : The Circuit (Nv16), Spark's Rest (Nv17)
  - Glaciem : Frostveil (Nv18), The Last Hearth (Nv19)

### Ajouté — NPCs (120+ nouveaux personnages)
- **`src/data/npcs.ts`** : 10+ NPCs par nouvelle ville, soit 120+ nouveaux personnages
  - Chaque ville : Forgeron (vend armes/armures + craft FORGE), Alchimiste (vend potions + craft BREW), Costumier (vend skins + craft TAILOR), Marchand (vend matériaux/consommables)
  - 6+ NPCs de fond par ville : réfugiés, gardes, savants, enfants, cuisiniers, chasseurs
  - Dialogues complets avec arbres de choix, triggers de quête, triggers de shop/craft
  - Ancien tableau `NPCS` renommé `GRIEVY_NPCS` — nouveau tableau `NPCS` regroupe toutes les villes

### Ajouté — Quêtes (36 nouvelles quêtes)
- **`src/data/quests.ts`** : 13 side quests + 23 fedex quests pour les nouvelles villes
  - Side quests : récompenses uniques (équipements forgés, items rares) liées aux artisans clés
  - Fedex quests : collecte de matériaux de zone pour NPCs (forgeron, alchimiste, marchand)
  - Toutes les quêtes référencées dans les NPCs (questIds) sont maintenant définies

### Ajouté — Système de craft SAO
- **`src/systems/CraftingSystem.ts`** : craft style Sword Art Online — le joueur rapporte les matériaux à l'artisan
  - `canCraft()` : vérifie niveau, zone, or, ingrédients
  - `craft()` : consomme les ingrédients, ajoute l'item résultat
  - `getAvailableRecipes()` : filtre par craftType ET critères joueur
- **`src/data/crafting.ts`** : 23 recettes réparties en 3 types
  - 10 recettes FORGE (Forgeron) : épées, armures élémentaires, lame de Velmara
  - 7 recettes BREW (Alchimiste) : élixirs, antidotes, cristal de résurrection
  - 6 recettes TAILOR (Costumier) : skins de tenues thématiques par zone

### Ajouté — Items (60+ nouveaux)
- **`src/data/items.ts`** : large extension de l'arsenal
  - 5 armes HIDDEN avec passifs uniques (KILL_HEAL_15_PCT, NO_ATTACK_COOLDOWN, ZERO_MANA_COST, FIRST_STRIKE_500_PCT, KILL_STACK_DAMAGE)
  - 2 armures HIDDEN + 2 accessoires HIDDEN (passifs quasi game-breaking uniques)
  - 10 skins (ItemType.SKIN, pour les 6 zones + neutre)
  - 14 armes élémentaires supplémentaires couvrant tous les éléments
  - 26 pièces d'armure supplémentaires (jambes, gants, casques, bottes, capes par élément)
  - 9 nouveaux matériaux de craft (moonpetal_herb, ash_residue, iron_ore, pearl, storm_glass, etc.)
  - Élément NEUTRAL ajouté — neutre avec tout, pas dans la table de faiblesses

### Ajouté — Mécaniques de combat
- **`src/systems/CombatSystem.ts`** : DARK super-effectif (×1.5) contre TOUS les éléments non-DARK/non-DIVINE
- **`src/systems/LootSystem.ts`** : élément assigné aléatoirement au drop (pas dans le template item)
  - Pondération : NEUTRAL 30%, éléments normaux 12% chacun, DARK 3%
  - Armes et armures peuvent être n'importe quel élément au loot

### Ajouté — Interface et contrôles
- **`src/scenes/UIScene.ts`** : barres HP/MP style Sword Art Online
  - HP bar horizontale (vert → orange <50% → rouge <25%) avec surlignage SAO
  - MP bar bleue avec surlignage
  - XP bar violette en bas d'écran
  - Skill labels AZERTY (A/E/R/F au lieu de Q/E/R/F)
- **`src/scenes/GameScene.ts`** : clavier AZERTY complet
  - Déplacement : Z=haut, Q=gauche, S=bas, D=droite
  - Attaque : W, Dash : Espace
  - Skills : A/E/R/F (A remplace Q précédent)
- **`src/scenes/GameScene.ts`** : orbes d'XP style Vampire Survivors
  - Ennemi tué → spawn d'orbes d'XP (jusqu'à 8 orbes)
  - Aimantation magnétique vers le joueur dans un rayon de 96px
  - Collecte par overlap — XP attribué au contact

### Modifié
- **`src/types/index.ts`** : ajout ItemType.SKIN, interface Skin, interface CraftRecipe (FORGE/BREW/TAILOR), passiveEffect sur Weapon, DARK_MULTIPLIER, WEAKNESS_MULTIPLIER constants
- **`src/data/npcs.ts`** : `NPCS` (Grievy Town) renommé `GRIEVY_NPCS`, nouveau tableau `NPCS` = toutes les villes

---

## [0.6.1] — 2026-06-25 — Corrections audit qualité

### Corrigé — Blockers
- **InventorySystem** : `getEquipSlot()` reçoit désormais `player` en paramètre au lieu de dépendre de la variable globale `player_placeholder` — évite le crash à l'équipement d'une bague si `setInventoryPlayerContext()` n'avait pas été appelé au préalable
- **LootSystem** : remplacement des comparaisons `>=` sur l'enum string `ItemRarity` par des `.includes([...])` explicites — les items de rareté `HIDDEN` réinitialisent désormais correctement les compteurs du système de pity

### Corrigé — Bugs
- **GameScene** : regen hors-combat limitée à une fois toutes les 2 secondes via `lastRegenTime` (auparavant déclenchée ~30 fois/seconde à 60 fps)
- **GameScene** : `init(data)` protégé contre `data.gameState === undefined` avec fallback sur `SaveSystem.createNewGame()`
- **GameScene** : listeners clavier dans `setupInput()` stockés par référence et retirés dans `shutdown()` — corrige l'accumulation de scènes dupliquées après plusieurs voyages de zone
- **UIScene** : ajout de `shutdown()` retirant les 7 event listeners sur `GameScene.events` — évite les fuites mémoire à chaque restart
- **QuestSystem** : guard ajoutée sur `quest.followupQuestId` avant accès à `QUEST_MAP` — évite le crash sur les quêtes terminales sans suite
- **DialogueSystem** : suppression de la branche `cond.hasQuest` inexistante sur l'interface `DialogueCondition`

### Corrigé — Erreurs de types
- **types/index.ts** : ajout de `isHidden?: boolean` à l'interface `Quest`
- **data/quests.ts** : remplacement des casts `as any` sur `ElementType.EARTH` et `ElementType.ICE` par les valeurs enum correctes ; suppression du cast `as any` sur `sq_08_find_elara`
- **data/items.ts** : `ItemRarity.KEY_ITEM` (inexistant) remplacé par `ItemRarity.HIDDEN` sur les items de type clé
- **systems/ProgressionSystem.ts** : inventaire initial du joueur utilise désormais `ALL_ITEMS['minor_health_potion']` au lieu d'un objet partiel casté `as any`

### Corrigé — Incohérences de données
- **data/skills.ts** : condition de déblocage de `elaras_gift` corrigée (`'find_elara'` → `'sq_08_find_elara'`)
- **data/items.ts** : ajout des 6 items manquants référencés dans les loot tables ennemis : `stone_shield_scroll`, `runic_armor`, `fragment_of_permanence`, `drowned_knight_sword`, `seaguard_armor`, `glacial_shield`
- **data/items.ts** : `questId` de `glaciem_archive_key` corrigé (`'crystal_archivist'` → `'sq_03_crystal_archivist'`)
- **data/items.ts** : ajout des items de quête manquants : `aldric_medallion`, `family_photo`
- **data/quests.ts** : `targetId` des quêtes `sq_01_aldrics_past` et `sq_02_embers_of_memory` désormais cohérents avec les items ajoutés

### Corrigé — Balance
- **CombatSystem** : `getSoulEchoBonus(player)` désormais appliqué dans `playerAttack()` et `playerSkill()` — le passif Soul Echo (+3% dégâts par boss tué) avait un effet réel nul

---

## [0.6.0] — 2026-06-25 — Automatisation QA et agent code reviewer

### Ajouté
- **`.claude/agents/code-reviewer.md`** : agent spécialisé en audit qualité — protocole en 6 étapes (audit TypeScript, cohérence des données, cycle de vie Phaser, simulation de balance, intégrité du save system, rapport structuré par sévérité)
- **`.claude/settings.json`** : hook `PostToolUse` déclenchant `npm run typecheck` après chaque modification d'un fichier TypeScript — retour d'erreurs immédiat à chaque Edit/Write
- **`CLAUDE.md`** : règles de développement pour Claude Code — conventions de données, points critiques connus, règle d'invocation automatique du code reviewer
- **`C:/Users/m.garcia/.claude/ARCHITECTURE.md`** : template générique réutilisable pour tous les projets futurs (pipeline d'agents, configuration hooks par stack, template CLAUDE.md, workflow de démarrage)

### Audité
- Audit complet sur 28 fichiers (22 TypeScript + 6 config/data) — 27 findings : 2 blockers, 6 bugs, 5 erreurs de types, 6 incohérences de données, 4 problèmes de balance, 4 pratiques

---

## [0.5.0] — 2026-06-25 — Assets procéduraux et tilemaps

### Ajouté
- **`src/utils/PlaceholderAssets.ts`** : génération de 106 textures via Canvas API au démarrage — aucun fichier PNG externe requis pour jouer
  - 8 tilesets zone (256×256, 5 tuiles distinctes par palette)
  - Spritesheet joueur (384×32, 12 frames avec frame data explicite)
  - 33 sprites ennemis (32×32, colorés par élément)
  - 7 sprites boss (64×64, bordure dorée)
  - 6 sprites divins (48×48)
  - 8 sprites NPC + 8 portraits NPC (80×80)
  - 5 éléments UI, 24 icônes de skills, logo
- **`assets/maps/grievy_town.json`** : tilemap 40×30, 4 couches, 5 bâtiments, routes en croix, 7 NPCs positionnés
- **`assets/maps/ignis_reach.json`** : 2 rivières de lave, 4 zones de spawn, boss Pyrath
- **`assets/maps/terravast.json`** : couloirs de grotte, 5 zones de spawn, boss Gorvun
- **`assets/maps/zephyr_peaks.json`** : fond abîme, 3 îles flottantes reliées, boss Sylvael
- **`assets/maps/abyssmar.json`** : zone d'eau centrale, salles de ruines, boss Thalymor
- **`assets/maps/volterra.json`** : grille métallique, NPC Kasyr, boss Volkran
- **`assets/maps/glaciem.json`** : toundra glacée, NPC Elara caché, boss Crysthea
- **`assets/maps/malachars_spire.json`** : chemin en spirale montante, boss Malachar

### Modifié
- **`src/scenes/BootScene.ts`** : reécrit pour appeler `generatePlaceholderAssets()` de façon synchrone dans `create()` avant PreloaderScene
- **`src/scenes/PreloaderScene.ts`** : chargement des assets PNG supprimé (remplacé par PlaceholderAssets) ; seuls les 8 tilemaps JSON sont chargés avec try/catch défensif

---

## [0.4.0] — 2026-06-25 — Pipeline multi-agents

### Ajouté
- **`agents/PIPELINE.md`** : architecture complète du pipeline de 6 agents spécialisés
  - Orchestrator Agent : coordination et délégation
  - Design Agent : game design, balance, spécifications
  - Content Agent : TypeScript data (quêtes, items, ennemis, NPCs, dialogues)
  - Dev Agent : code TypeScript/Phaser
  - QA Agent : tests statistiques, validation des chaînes de quêtes, vérification des assets
  - Asset Agent : prompts Stable Diffusion par type de sprite
- Conventions de nommage des IDs pour tous les agents
- Manifest des assets et structure des répertoires
- Workflows documentés : ajout de contenu, nouvelle zone, correction de bug

---

## [0.3.0] — 2026-06-25 — Scènes Phaser et interface

### Ajouté
- **`src/scenes/BootScene.ts`** : chargement du logo, transition vers PreloaderScene
- **`src/scenes/PreloaderScene.ts`** : barre de progression, chargement de tous les assets (tilesets, tilemaps, sprites, UI, icons)
- **`src/scenes/MainMenuScene.ts`** : aperçu des 3 slots de sauvegarde, boutons NEW GAME / CONTINUE
- **`src/scenes/NameInputScene.ts`** : saisie HTML native overlay, validation Enter/bouton, création de partie
- **`src/scenes/GameScene.ts`** : scène principale — mouvement WASD, attaque Z, dash Space (1,5s CD + 0,3s iframes), skills Q/E/R/F, IA ennemis, spawning dynamique, détection de boss, dégradation du monde, sauvegarde automatique toutes les 3 minutes
- **`src/scenes/UIScene.ts`** : HUD parallèle — barres HP/Mana/XP, niveau, or, 4 slots de skills, file de notifications (level-up, item rare, quête, skill, zone)
- **`src/scenes/DialogueScene.ts`** : panneau bas d'écran, portrait NPC, avancement Z/Entrée, choix cliqués ou numérotés
- **`src/scenes/InventoryScene.ts`** : grille 8 colonnes avec bordures de rareté, panneau d'équipement, détail item (équiper/utiliser/vendre)
- **`src/scenes/SkillScene.ts`** : grille des skills débloqués, 4 slots équipés Q/E/R/F, tooltips
- **`src/scenes/EndingScene.ts`** : deux fins (RESTORE / ERASE), affichage ligne par ligne avec fondu, crédits, bouton New Game+
- **`src/main.ts`** : configuration Phaser — 800×600, pixel art, physics arcade, chaîne de scènes

---

## [0.2.0] — 2026-06-25 — Architecture de données et systèmes

### Ajouté
- **`src/types/index.ts`** : système de types TypeScript complet (enums, interfaces de 40+ types)
- **`src/data/zones.ts`** : 8 zones (Grievy Town, 6 zones élémentaires, Spire de Malachar) avec lore des divinités
- **`src/data/enemies.ts`** : 37 ennemis (5 réguliers + 1 élite + 1 boss par zone + zone sombre)
- **`src/data/items.ts`** : ~120 items (armes, armures, accessoires, consommables, matériaux, clés)
- **`src/data/skills.ts`** : 24 skills (2 défaut + 3 par élément + 4 cachés dont Soul Echo, Void Step, Prism Burst, Elara's Gift)
- **`src/data/quests.ts`** : 27 quêtes (7 principales chaînées + 8 secondaires + 8 fedex)
- **`src/data/npcs.ts`** : 8 NPCs avec arbres de dialogue complets (Aldric, Mira, Theron, Frère Ovan, Liria, Kelvar, Ysolde, Elara)
- **`src/systems/ProgressionSystem.ts`** : formules XP (`100 × n^1.6`), stats, attributs, scaling ennemi (`base + floor(delta × 0.6)`)
- **`src/systems/LootSystem.ts`** : drop rates par rareté, système de pity (250 tués → Epic garanti, 500 → Legendary)
- **`src/systems/CombatSystem.ts`** : attaque physique, skills élémentaires, statuts (STUN/FREEZE/SLOW/BURN), IA ennemis
- **`src/systems/QuestSystem.ts`** : suivi d'objectifs, événements (boss tué, ennemi tué, item collecté, zone visitée, NPC parlé), chaînage automatique
- **`src/systems/InventorySystem.ts`** : équipement (10 slots), vente, utilisation de consommables
- **`src/systems/SkillSystem.ts`** : déblocage par zone, skills cachés, équipement en slot (Q/E/R/F), cooldowns
- **`src/systems/DialogueSystem.ts`** : sessions de dialogue avec conditions et triggers (startQuest, completeQuest, setFlag, giveItem)
- **`src/systems/SaveSystem.ts`** : 3 slots localStorage, sauvegarde versionnée, New Game+ (Erase → Prism Burst dès niveau 1)

---

## [0.1.0] — 2026-06-25 — Initialisation du projet

### Ajouté
- **`package.json`** : dépendances Phaser 3.70, TypeScript 5, Vite 5 ; scripts `dev`, `build`, `typecheck`
- **`tsconfig.json`** : cible ES2020, mode strict, alias `@/*` → `src/*`
- **`vite.config.ts`** : port 3000, chunk Phaser séparé pour les performances de build
- **`index.html`** : canvas centré, rendu pixelisé (`image-rendering: pixelated`)
- **`GAME_DESIGN.md`** : document de game design complet — synopsis, monde de Velmara, 6 zones élémentaires, Malachar et la Malédiction du Dénouement, capacité Echo Magic du héros, révélation finale (le héros est le Dieu Suprême), fins Restaurer/Effacer, New Game+, systèmes RPG, table des raretés, dégradation du monde

---

*Prochaine version prévue : [0.7.0] — Intégration des musiques*
