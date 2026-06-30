# SOUND EFFECTS — Grievy Town's Dilemma
## Catalogue complet à destination du Sound Designer

---

## CONTEXTE & AMBIANCE SONORE GLOBALE

**Grievy Town's Dilemma** est un Action RPG 2D top-down au pixel art, dont le ton visuel et narratif s'inspire de Frieren (mélancolie médiévale-fantasy), de Chrono Trigger (épique intemporel) et d'Alabaster Dawn (gamefeel précis et satisfaisant).

Le monde de Velmara est en train de mourir. Chaque boss tué est une divinité morte pour toujours. Le son doit refléter ce paradoxe : la violence du combat doit être satisfaisante (le joueur doit se sentir puissant), mais les sons de mort des boss doivent avoir du poids, de la tristesse — pas de triomphe vulgaire.

**Principes directeurs pour le Sound Design :**
- Chaque action du joueur a un retour sonore immédiat. Le silence après une action = une mécanique invisible.
- Les sons de combat sont percutants et lisibles. Pas de bouillie sonore en combat de masse.
- Les sons d'ambiance créent l'atmosphère de zone sans jamais couvrir les SFX de combat.
- Les morts de boss sont des moments cinematiques : son plus long, plus complexe, résonance émotionnelle.
- Le monde se désature visuellement à chaque divinité tuée : les sons d'ambiance devraient s'appauvrir en conséquence (moins de couches, moins de vivacité).

**Format de livraison attendu :** `.ogg` mono ou stéréo, 44.1 kHz, normalisé à -6 dBFS pic maximum.

**Convention de nommage :** `sfx_[categorie]_[id].ogg` — tout en minuscules, underscores, pas d'espaces.

---

## 1. COMBAT — ATTAQUES DE BASE

| Fichier | Description | Durée aprox. |
|---------|-------------|--------------|
| `sfx_hit_light.ogg` | Impact léger — attaque basique rapide. Son sec, bref. Inspiration : épée de bois sur cuir. | 0.1–0.15s |
| `sfx_hit_medium.ogg` | Impact moyen — combo milieu. Plus de corps, léger métal. | 0.15–0.2s |
| `sfx_hit_heavy.ogg` | Impact lourd — coup final de combo ou arme lente (greatsword). Résonance métallique, grave. | 0.2–0.3s |
| `sfx_hit_critical.ogg` | Coup critique. Flash jaune en jeu. Son distinct, plus aigu et percutant — "crack" sur métal. | 0.2–0.25s |
| `sfx_miss.ogg` | Attaque dans le vide. Sifflement d'air, très bref. | 0.1s |
| `sfx_attack_swing_1.ogg` | Son de lame fendue dans l'air — attaque rapide (épée, dague). | 0.08–0.12s |
| `sfx_attack_swing_2.ogg` | Variation de swing pour diversité. | 0.08–0.12s |
| `sfx_attack_swing_heavy.ogg` | Son de balancement — greatsword ou arme lente. Plus grave, plus lent. | 0.15–0.2s |
| `sfx_attack_bow.ogg` | Décoche d'arc. Corde qui vibre, air sifflant. | 0.12–0.18s |
| `sfx_attack_staff.ogg` | Frappe de bâton magique. Son mat avec une légère résonance magique. | 0.12–0.18s |
| `sfx_combo_counter.ogg` | Son de compteur de combo qui monte (discret). Bref ding ou tick. | 0.05s |

---

## 2. JOUEUR — ÉTATS & ACTIONS

| Fichier | Description | Durée aprox. |
|---------|-------------|--------------|
| `sfx_player_dash.ogg` | Dash du joueur. Whoosh rapide, léger effet d'air déplacé. Inspiration : Hollow Knight dash. | 0.15–0.2s |
| `sfx_player_dash_iframe.ogg` | Son distinct pendant les iframes du dash (0.3s). Légère distorsion/shimmer pour signaler l'invincibilité. | 0.3s |
| `sfx_player_footstep_grass.ogg` | Pas sur herbe/sol de Grievy Town. Feutre, organique. | 0.08s |
| `sfx_player_footstep_stone.ogg` | Pas sur pierre (zones de combat, routes). Légèrement plus sec. | 0.08s |
| `sfx_player_footstep_sand.ogg` | Pas sur cendre/sable (routes Ignis Reach). Sourd. | 0.08s |
| `sfx_player_footstep_ice.ogg` | Pas sur glace (Glaciem). Crissant, légèrement cristallin. | 0.08s |
| `sfx_player_footstep_metal.ogg` | Pas sur métal (Volterra). Résonance métallique. | 0.08s |
| `sfx_player_footstep_water.ogg` | Pas dans l'eau peu profonde (canaux Abyssmar). Éclaboussure légère. | 0.1s |
| `sfx_player_hurt.ogg` | Joueur touché. Grognement bref + impact sourd. | 0.2–0.3s |
| `sfx_player_death.ogg` | Mort du joueur. Son long et mélancolique. Chute, silence, résonance. | 0.8–1.5s |
| `sfx_player_respawn.ogg` | Réapparition au campfire. Son de "réveil", quelques notes montantes. | 0.5s |
| `sfx_player_levelup.ogg` | Level up. Montée de notes joyeuse mais discrète — pas de fanfare. Quelques notes de luth. | 0.5–0.8s |
| `sfx_player_heal.ogg` | Soin reçu (potion, regen). Doux et lumineux, bulles montantes. | 0.3–0.4s |
| `sfx_player_mana_restore.ogg` | Restauration de mana. Plus éthéré que le HP, tonalité bleue/froide. | 0.3s |
| `sfx_player_status_stun.ogg` | Joueur étourdi. Son de "head buzz", bref. | 0.2s |
| `sfx_player_status_freeze.ogg` | Joueur gelé. Craquèlement de glace, froid. | 0.3s |
| `sfx_player_status_slow.ogg` | Joueur ralenti. Son légèrement déformé, comme ralenti. | 0.2s |

---

## 3. ENNEMIS — IMPACTS & ÉTATS

| Fichier | Description | Durée aprox. |
|---------|-------------|--------------|
| `sfx_enemy_hit_light.ogg` | Ennemi touché par attaque légère. Légèrement différent du hit joueur — plus "charnu". | 0.1–0.15s |
| `sfx_enemy_hit_heavy.ogg` | Ennemi touché par attaque lourde ou skill. Plus grave, résonance. | 0.2–0.25s |
| `sfx_enemy_stagger.ogg` | Ennemi en état de stagger (flash rouge). Grognement court + son d'impact résonant. | 0.2–0.3s |
| `sfx_enemy_aggro.ogg` | Ennemi qui détecte le joueur. Son d'alerte — grognement, craquèlement, ou cri selon le type. | 0.2–0.3s |
| `sfx_enemy_block.ogg` | Ennemi bloque un coup (constructs, golems). Clang métallique ou pierre contre pierre. | 0.15s |
| `sfx_enemy_projectile.ogg` | Son de projectile ennemi générique. Sifflement court. | 0.1s |

---

## 4. ENNEMIS — SONS DE MORT PAR TYPE

Chaque ennemi a un son de mort distinct correspondant à sa nature. Durée typique : 0.3–0.6s.

### Ignis Reach (Feu)

| Fichier | Ennemi | Description sonore |
|---------|--------|-------------------|
| `sfx_death_ember_wyrm.ogg` | Ember Wyrm | Sifflement de serpent qui s'éteint, braise qui s'effondre. |
| `sfx_death_lava_golem.ogg` | Lava Golem | Fracas de roche lourde, crachotement de lave qui refroidit. |
| `sfx_death_cinder_sprite.ogg` | Cinder Sprite | Pop bref et sec — comme une étincelle qui s'éteint. Très court. |
| `sfx_death_ash_revenant.ogg` | Ash Revenant | Gémissement spectral qui s'estompe, nuage de cendre (son sec et diffus). |
| `sfx_death_magma_titan.ogg` | Magma Titan | Impact lourd et long, sol qui tremble, crachotement de lave (élite — plus dramatique). |
| `sfx_death_ember_broodmother.ogg` | Ember Broodmother | Craquèlement d'oeufs, sifflement d'araignée qui s'éteint. |
| `sfx_death_scorch_sentinel.ogg` | Scorch Sentinel | Pierre qui s'effondre, métal qui refroidit, craquèlement. |

### Terravast (Terre)

| Fichier | Ennemi | Description sonore |
|---------|--------|-------------------|
| `sfx_death_stone_crawler.ogg` | Stone Crawler | Carapace de pierre qui se brise, clic d'insecte qui cesse. |
| `sfx_death_crystal_golem.ogg` | Crystal Golem | Explosion de cristaux — son cristallin aigu + fracas sourd de la base. |
| `sfx_death_cave_lurker.ogg` | Cave Lurker | Grognement court, impact sourd (tombe d'en haut). |
| `sfx_death_terravast_serpent.ogg` | Terravast Serpent | Sifflement qui s'affaiblit, corps de pierre qui s'effondre en strates. |
| `sfx_death_rune_shard_ghost.ogg` | Rune Shard Ghost | Cristaux qui se dispersent, résonance de rune qui s'éteint — son éthéré. |
| `sfx_death_stone_hound.ogg` | Stone Hound | Grognement de chien qui cesse, gravier qui roule. |
| `sfx_death_ruin_colossus.ogg` | Ruin Colossus | Effondrement massif — multiple impacts de débris, nuage de poussière sonore. Long et lourd. |

### Zephyr Peaks (Vent)

| Fichier | Ennemi | Description sonore |
|---------|--------|-------------------|
| `sfx_death_gale_harpy.ogg` | Gale Harpy | Cri de volatile blessé, plumes qui se dispersent dans le vent. |
| `sfx_death_storm_eagle.ogg` | Storm Eagle | Craquèlement électrique qui s'éteint, impact lourd (grande créature). |
| `sfx_death_wind_wraith.ogg` | Wind Wraith | Dissolution aérienne — comme si le vent se dispersait, son éthéré qui s'évanouit. |
| `sfx_death_cyclone_sprite.ogg` | Cyclone Sprite | Petit tornado qui se dissout, sifflement de vent qui cesse. |
| `sfx_death_sky_titan.ogg` | Sky Titan | Impact massif — le sol tremble, rafale de vent finale, lent. |
| `sfx_death_storm_caller.ogg` | Storm Caller | Robes qui flottent et se dispersent, vent qui murmure et cesse. |
| `sfx_death_cloudpiercer.ogg` | Cloudpiercer | Dégonflement rapide, sifflement d'air qui s'échappe. |

### Abyssmar (Eau)

| Fichier | Ennemi | Description sonore |
|---------|--------|-------------------|
| `sfx_death_tide_crawler.ogg` | Tide Crawler | Carapace de crabe qui se brise, eau qui s'écoule. |
| `sfx_death_sea_wraith.ogg` | Sea Wraith | Gémissement de noyé qui s'estompe, bulle qui remonte, eau. |
| `sfx_death_coral_golem.ogg` | Coral Golem | Corail qui se brise — sons cristallins/biologiques mélangés, lourd. |
| `sfx_death_depth_serpent.ogg` | Depth Serpent | Serpent aquatique, éclaboussure lourde, glouglou. |
| `sfx_death_tide_shaper.ogg` | Tide Shaper | Méduse qui éclate, bioluminescence qui s'éteint (son "pop" humide). |
| `sfx_death_abyssal_shade.ogg` | Abyssal Shade | Gémissement de fantôme se dissolvant dans l'eau, bulle finale. |
| `sfx_death_drowned_knight.ogg` | Drowned Knight | Armure qui s'effondre sous l'eau, métal rouillé, eau qui engloutit. Long. |

### Volterra (Foudre)

| Fichier | Ennemi | Description sonore |
|---------|--------|-------------------|
| `sfx_death_spark_imp.ogg` | Spark Imp | Petit pop électrique, statique qui se disperse. |
| `sfx_death_thunder_drake.ogg` | Thunder Drake | Craquèlement électrique massif, impact de créature ailée. |
| `sfx_death_chain_revenant.ogg` | Chain Revenant | Son de circuit court-circuité, gémissement spectral électrique. |
| `sfx_death_volt_hound.ogg` | Volt Hound | Grognement de chien + décharge finale, corps qui s'effondre. |
| `sfx_death_arc_node.ogg` | Arc Node | Machine qui cesse — bruit de condensateur qui se décharge, silence mécanique. |
| `sfx_death_grid_architect.ogg` | Grid Architect | Machine complexe qui s'effondre — plusieurs décharges, chute mécanique. Long. |
| `sfx_death_storm_herald.ogg` | Storm Herald | Construire électrique qui explose, résonnance d'armure et de foudre. Long. |

### Glaciem (Glace)

| Fichier | Ennemi | Description sonore |
|---------|--------|-------------------|
| `sfx_death_frost_wolf.ogg` | Frost Wolf | Grognement qui se tait, cristaux de glace qui se brisent sur le sol. |
| `sfx_death_ice_golem.ogg` | Ice Golem | Bloc de glace massif qui se fend et s'effondre — sons cristallins intenses. |
| `sfx_death_blizzard_wraith.ogg` | Blizzard Wraith | Tempête miniature qui se dissout, silence froid. |
| `sfx_death_permafrost_titan.ogg` | Permafrost Titan | Givre qui se fend, impact lourd préhistorique, sol gelé qui craque. Long. |
| `sfx_death_crystal_dragon.ogg` | Crystal Dragon | Dragon de cristal — facettes qui explosent, résonance longue et cristalline. Long. |
| `sfx_death_glacial_shaper.ogg` | Glacial Shaper | Mains de glace bleue qui se dissolvent, gémissement de préservation interrompue. |
| `sfx_death_hoarfrost_stalker.ogg` | Hoarfrost Stalker | Loup alpha — plus puissant que frost_wolf, grognement profond, glace qui se brise. |

### Malachar's Spire (Ombre)

| Fichier | Ennemi | Description sonore |
|---------|--------|-------------------|
| `sfx_death_dark_revenant.ogg` | Dark Revenant | Dissolution d'ombre, gémissement spectral grave, silence absorbant. |
| `sfx_death_shadow_construct.ogg` | Shadow Construct | Machine d'ombre qui s'effondre, craquèlement de matière sombre. |
| `sfx_death_void_weaver.ogg` | Void Weaver | Tissage qui se défait, araignée d'ombre qui se dissout dans le vide. |
| `sfx_death_void_stalker.ogg` | Void Stalker | Prédateur d'ombre qui se volatilise, silence soudain après impact. |
| `sfx_death_void_sentinel.ogg` | Void Sentinel | Gardien massif d'ombre qui s'effondre — long, grave, résonant. |

---

## 5. BOSS — CRIS (ROAR) ET MORTS

Les boss sont des divinités. Leurs sons doivent être monumentaux au moment de l'entrée, et poignants à la mort.

### Pyrath the Unbound (Ignis Reach)

| Fichier | Description | Durée |
|---------|-------------|-------|
| `sfx_boss_pyrath_roar.ogg` | Rugissement de dragon de feu — puissant, primal, douloureux plutôt que menaçant. | 1.5–2s |
| `sfx_boss_pyrath_attack.ogg` | Attaque de Pyrath — craquèlement de flamme massive. | 0.4–0.6s |
| `sfx_boss_pyrath_death.ogg` | Mort de Pyrath. Dragon qui s'éteint — flamme qui s'affaiblit, rugissement final déchirant, silence chaud. Doit être poignant. | 3–5s |
| `sfx_boss_pyrath_phase2.ogg` | Transition de phase — explosion de lave, roar rageur. | 1–1.5s |

### Gorvun the Trembling (Terravast)

| Fichier | Description | Durée |
|---------|-------------|-------|
| `sfx_boss_gorvun_roar.ogg` | Grondement tellurique — pas un cri, un tremblement de terre. Basses profondes. | 2–3s |
| `sfx_boss_gorvun_attack.ogg` | Gorvun frappe — séisme localisé, sol qui se fissure. | 0.5–0.8s |
| `sfx_boss_gorvun_death.ogg` | Mort de Gorvun. La terre s'immobilise — après une vie entière de tremblements, le silence de la roche. Doit peser. | 4–6s |
| `sfx_boss_gorvun_phase2.ogg` | Transition — cascade de rochers, séisme. | 1.5–2s |

### Sylvael the Tempest (Zephyr Peaks)

| Fichier | Description | Durée |
|---------|-------------|-------|
| `sfx_boss_sylvael_roar.ogg` | Cri de phénix brisé — beau et terrible. Vent qui mugit avec une voix dedans. | 1.5–2s |
| `sfx_boss_sylvael_attack.ogg` | Sylvael attaque — rafale tranchante, plumes qui déchirent l'air. | 0.3–0.5s |
| `sfx_boss_sylvael_death.ogg` | Mort de Sylvael. Le vent s'arrête — pour la première fois dans cette zone, calme total. Puis rien. | 4–6s |
| `sfx_boss_sylvael_phase2.ogg` | Transition — typhon soudain, cri de tempête. | 1–1.5s |

### Thalymor the Deluge (Abyssmar)

| Fichier | Description | Durée |
|---------|-------------|-------|
| `sfx_boss_thalymor_roar.ogg` | Cri de léviathan — grave et abyssal, résonnant comme sous l'eau. | 2–3s |
| `sfx_boss_thalymor_attack.ogg` | Vague massive, pression de l'eau, impact sourd. | 0.5–0.8s |
| `sfx_boss_thalymor_death.ogg` | Mort de Thalymor. L'océan se retire — son d'eau qui recède, gémissement abyssal final, marée basse définitive. | 4–7s |
| `sfx_boss_thalymor_phase2.ogg` | Transition — tsunami miniature, pression d'eau extrême. | 1.5–2s |

### Volkran the Stormbringer (Volterra)

| Fichier | Description | Durée |
|---------|-------------|-------|
| `sfx_boss_volkran_roar.ogg` | Rugissement de colosse électrique — tonnerre intégré dans le cri. | 1.5–2.5s |
| `sfx_boss_volkran_attack.ogg` | Décharge de Volkran — arc électrique massif, explosion de foudre. | 0.4–0.6s |
| `sfx_boss_volkran_death.ogg` | Mort de Volkran. Les lumières s'éteignent — décharge finale, puis silence électrique absolu. La grille de Volterra cesse définitivement. | 4–6s |
| `sfx_boss_volkran_phase2.ogg` | Transition — surcharge électrique, tonnerre continu. | 1–1.5s |

### Crysthea the Frozen (Glaciem)

| Fichier | Description | Durée |
|---------|-------------|-------|
| `sfx_boss_crysthea_roar.ogg` | Cri de déesse de glace — pas de colère, de tristesse cristalline. Harmoniques de verre. | 1.5–2s |
| `sfx_boss_crysthea_attack.ogg` | Attaque de Crysthea — blizzard concentré, cristaux tranchants. | 0.4–0.6s |
| `sfx_boss_crysthea_death.ogg` | Mort de Crysthea. La glace fond — craquèlement lent, harmonie de cristaux brisés, eau qui coule pour la première fois en des décennies. Le plus mélancolique. | 5–8s |
| `sfx_boss_crysthea_phase2.ogg` | Transition — tempête de glace, cri de préservation désespérée. | 1.5–2s |

### Malachar the Unbound (Malachar's Spire) — 3 phases

| Fichier | Description | Durée |
|---------|-------------|-------|
| `sfx_boss_malachar_intro.ogg` | Malachar parle avant le combat — résonance sombre, pas un monstre, un homme. | 2–3s |
| `sfx_boss_malachar_attack_1.ogg` | Attaque phase 1 — magie sombre concentrée, contrôlée, précise. | 0.3–0.5s |
| `sfx_boss_malachar_attack_2.ogg` | Attaque phase 2 — éléments mélangés (feu+glace+foudre). Plus chaotique. | 0.4–0.7s |
| `sfx_boss_malachar_attack_3.ogg` | Attaque phase 3 — libération totale, son de tous les éléments à la fois. | 0.5–0.8s |
| `sfx_boss_malachar_phase2.ogg` | Transition phase 1→2. Malachar absorbe de l'énergie — montée de puissance. | 1.5–2s |
| `sfx_boss_malachar_phase3.ogg` | Transition phase 2→3. Rupture totale — Malachar abandonne toute retenue. | 2–3s |
| `sfx_boss_malachar_death.ogg` | Mort de Malachar. Un homme qui cède — pas un monstre. Soupir, effondrement de la magie, silence de la Spire. Long, complexe, ambigu émotionnellement. | 6–10s |

---

## 6. INTERFACE & MENUS

| Fichier | Description | Durée |
|---------|-------------|-------|
| `sfx_ui_menu_open.ogg` | Ouverture d'un menu (inventaire, carte...). Son sec et propre, léger. | 0.1s |
| `sfx_ui_menu_close.ogg` | Fermeture d'un menu. Symétrique de l'ouverture. | 0.1s |
| `sfx_ui_cursor_move.ogg` | Navigation dans les menus. Tick discret. | 0.05s |
| `sfx_ui_confirm.ogg` | Confirmation d'action. Son net, positif. | 0.1–0.15s |
| `sfx_ui_cancel.ogg` | Annulation. Son différent de confirm — descendant ou plus sourd. | 0.1s |
| `sfx_ui_dialogue_next.ogg` | Avancer dans le dialogue. Clic discret, page qui tourne. | 0.05–0.08s |
| `sfx_ui_dialogue_open.ogg` | Ouverture d'une boîte de dialogue NPC. Son légèrement différent d'ouverture de menu. | 0.1s |
| `sfx_ui_notification.ogg` | Notification montante (level up, item rare, quête). Bref ding ou note. | 0.2s |
| `sfx_ui_quest_start.ogg` | Début d'une nouvelle quête. Son distinct et légèrement solennel. | 0.3–0.4s |
| `sfx_ui_quest_complete.ogg` | Quête complétée. Son de satisfaction, quelques notes. | 0.4–0.6s |
| `sfx_ui_error.ogg` | Action invalide (pas assez de mana, inventaire plein). Son d'erreur discret. | 0.1s |
| `sfx_ui_save.ogg` | Sauvegarde (Liria, campfire). Son doux et rassurant. | 0.3–0.5s |
| `sfx_ui_page_turn.ogg` | Pour les menus à onglets ou textes longs. | 0.1s |
| `sfx_ui_equip.ogg` | Équipement d'un item. Son de métal/cuir qui se met en place. | 0.2s |
| `sfx_ui_unequip.ogg` | Déséquipement. Son inverse, légèrement différent. | 0.15s |
| `sfx_ui_shop_buy.ogg` | Achat en boutique. Son de pièce(s), satisfaisant. | 0.2s |
| `sfx_ui_shop_sell.ogg` | Vente en boutique. Son de pièce(s), légèrement différent. | 0.2s |
| `sfx_ui_skill_equip.ogg` | Équipement d'une compétence dans un slot. | 0.15s |
| `sfx_ui_skill_unlock.ogg` | Déverrouillage d'une nouvelle compétence (après boss). Momentané et notable. | 0.5–0.8s |
| `sfx_ui_boss_nameplate.ogg` | Annonce du nom du boss à l'entrée. Son cinématique, s'accordant avec la zone. | 1–1.5s |

---

## 7. LOOT & CRAFT

| Fichier | Description | Durée |
|---------|-------------|-------|
| `sfx_loot_drop_common.ogg` | Drop d'item Commun. Bruit de chute simple. | 0.1–0.15s |
| `sfx_loot_drop_uncommon.ogg` | Drop Uncommon. Légèrement plus résonant. | 0.15s |
| `sfx_loot_drop_rare.ogg` | Drop Rare. Son distinct avec légère harmonie. | 0.2s |
| `sfx_loot_drop_epic.ogg` | Drop Epique. Son notable, vibration magique. | 0.3–0.4s |
| `sfx_loot_drop_legendary.ogg` | Drop Légendaire. Son majestueux bref — le joueur doit l'entendre à travers le combat. | 0.5–0.7s |
| `sfx_loot_drop_mythic.ogg` | Drop Mythique. Très rare, son très distinctif — doit arrêter le joueur. | 0.7–1s |
| `sfx_loot_drop_hidden.ogg` | Drop Hidden. Unique, chargé de mystère. Différent des autres. | 0.8–1.2s |
| `sfx_loot_pickup.ogg` | Ramassage d'item. Son bref et satisfaisant. | 0.1s |
| `sfx_loot_gold.ogg` | Ramassage d'or. Tintement de pièces. | 0.1–0.15s |
| `sfx_loot_xp_orb.ogg` | Collecte d'orbe d'XP (style Vampire Survivors). Son magnétique, petit "pip". | 0.08s |
| `sfx_loot_xp_orbs_burst.ogg` | Multiple orbes collectés rapidement — son de rafale de pips. | 0.2–0.3s |
| `sfx_loot_chest_open.ogg` | Ouverture d'un coffre. Grincement de serrure, bois qui s'ouvre, tintement intérieur. | 0.5–0.8s |
| `sfx_loot_plant_harvest.ogg` | Récolte d'une plante. Son végétal, feuilles, tige. | 0.2–0.3s |
| `sfx_loot_mineral_mine.ogg` | Extraction de minéral. Coup de pioche sur roche, éclat. | 0.3–0.4s |
| `sfx_loot_shrine_activate.ogg` | Activation d'un sanctuaire. Son mystique, résonance. | 0.5–1s |
| `sfx_loot_pity_trigger.ogg` | Déclenchement du système de pity (250 kills → Epic garanti). Son discret mais distinct — signal que le prochain drop sera spécial. | 0.3s |
| `sfx_craft_start.ogg` | Début d'artisanat. Son de forge ou d'alchimie selon l'artisan. | 0.3s |
| `sfx_craft_complete.ogg` | Objet fabriqué. Son de satisfaction de craft réussi. | 0.5–0.8s |
| `sfx_campfire_rest.ogg` | Repos au campfire. Son de feu de camp, crépitement, regen. | 1–2s (peut être une loop courte) |

---

## 8. TÉLÉPORTATION & TRANSITIONS

| Fichier | Description | Durée |
|---------|-------------|-------|
| `sfx_teleport_enter.ogg` | Entrée dans une zone de téléportation. Son de "succion" ou d'attraction. | 0.3–0.5s |
| `sfx_teleport_exit.ogg` | Apparition dans la nouvelle zone. Son d'arrivée. | 0.3–0.5s |
| `sfx_zone_transition_out.ogg` | Fondu au noir vers une nouvelle zone. Son qui s'estompe avec l'image. | 0.5–1s |
| `sfx_zone_transition_in.ogg` | Arrivée dans une nouvelle zone après fondu. Son qui apparaît. | 0.5–1s |
| `sfx_void_step_activate.ogg` | Activation du skill Void Step (téléport global). Son distinctif, grave et dimensionnel. | 0.5–0.8s |
| `sfx_void_step_arrive.ogg` | Arrivée après Void Step. Symétrique mais différent. | 0.4–0.6s |
| `sfx_gale_step_activate.ogg` | Gale Step du joueur (téléport vent). Souffle d'air rapide et précis. | 0.2–0.3s |
| `sfx_volt_dash_origin.ogg` | Explosion électrique au point de départ du Volt Dash. | 0.3–0.4s |
| `sfx_volt_dash_arrive.ogg` | Arrivée après Volt Dash. Son plus bref. | 0.2s |

---

## 9. AMBIANCE — LOOPS PAR ZONE

Ces sons sont des boucles sans rupture perceptible (seamless loop), jouées en arrière-plan.

| Fichier | Zone | Description | Durée boucle |
|---------|------|-------------|--------------|
| `amb_grievy_town.ogg` | Grievy Town | Village médiéval tranquille mais anxieux. Vent léger, quelques oiseaux, bruit lointain de marteau de forgeron, murmures. | 60–90s |
| `amb_grievy_town_degraded.ogg` | Grievy Town (après 3+ bosses) | Même base, mais moins riche : moins d'oiseaux, vent plus froid, moins de voix. | 60–90s |
| `amb_ignis_reach.ogg` | Ignis Reach | Rumble volcanique sourd en permanence, crépitement de lave, chaleur sonore. | 45–60s |
| `amb_terravast.ogg` | Terravast | Écho souterrain, gouttes d'eau espacées, résonance de cristaux, vent dans des tunnels. | 45–60s |
| `amb_zephyr_peaks.ogg` | Zephyr Peaks | Vent fort et constant, rafales aléatoires, hauteur (sons aigus et fins), pierres qui roulent. | 30–45s |
| `amb_abyssmar.ogg` | Abyssmar | Eau partout — profonde, sous pression, courants sourds, écho aquatique, bioluminescence (sons de méduses imaginaires). | 60s |
| `amb_volterra.ogg` | Volterra | Statique électrique constante, crachotements aléatoires de foudre lointaine, bourdonnement de machines mortes. | 45–60s |
| `amb_glaciem.ogg` | Glaciem | Vent glacial, craquèlement de glace périodique, silence dense, pingot cristallin. | 60–90s |
| `amb_malachars_spire.ogg` | Malachar's Spire | Quasi-silence oppressant. Résonance sombre très basse. Aucune vie, aucun vent. Le vide rendu audible. | 60–120s |
| `amb_route_ember_road.ogg` | Route des Braises | Transition Grievy→Ignis. Vent chaud, quelques crépitements, sol aride. | 45s |
| `amb_route_stone_path.ogg` | Chemin de Pierre | Transition Grievy→Terravast. Vent de canyon, résonance souterraine qui commence. | 45s |
| `amb_route_zephyr_trail.ogg` | Sentier de Zephyr | Transition Grievy→Zephyr. Vent qui monte en intensité. | 45s |
| `amb_route_coastal_road.ogg` | Route Côtière | Transition Grievy→Abyssmar. Vent marin, vagues lointaines, sel dans l'air. | 45s |
| `amb_route_thunder_pass.ogg` | Col du Tonnerre | Transition Grievy→Volterra. Statique naissante, tonnerre lointain, vent de col. | 45s |
| `amb_route_frost_way.ogg` | Voie Glaciale | Transition Grievy→Glaciem. Froid qui s'installe, crissements de givre, vent glacial. | 45s |

---

## 10. SORTS & COMPÉTENCES — UN SFX PAR SKILL

### Compétences par défaut

| Fichier | Skill | Description |
|---------|-------|-------------|
| `sfx_skill_dash.ogg` | Dash | Woosh rapide + shimmer d'iframes. (Voir aussi sfx_player_dash.ogg) |
| `sfx_skill_echo_strike.ogg` | Echo Strike | Burst d'énergie divine — son pur, légèrement résonnant, blanc lumineux. |

### Compétences de Feu (Ignis Reach)

| Fichier | Skill | Description |
|---------|-------|-------------|
| `sfx_skill_fireball_launch.ogg` | Fireball (lancement) | Compression de flamme puis relâchement — whomp! | 0.2s |
| `sfx_skill_fireball_impact.ogg` | Fireball (impact/explosion) | Explosion de feu. Chaud, grave et expansif. | 0.4s |
| `sfx_skill_flame_dash.ogg` | Flame Dash | Dash + traîne de feu — whoosh enflammé, crépitement qui reste. | 0.3s |
| `sfx_skill_inferno_burst_charge.ogg` | Inferno Burst (charge 1s) | Montée de chaleur, concentration d'énergie. Bourdonnement qui monte. | 1s |
| `sfx_skill_inferno_burst_release.ogg` | Inferno Burst (relâchement) | Explosion de feu en anneau. Massif, grave, chaud. | 0.5s |

### Compétences de Terre (Terravast)

| Fichier | Skill | Description |
|---------|-------|-------------|
| `sfx_skill_stone_shield.ogg` | Stone Shield | Pierre qui se forme autour du joueur — son de roche solide. | 0.4s |
| `sfx_skill_stone_shield_break.ogg` | Stone Shield (rupture) | Bouclier de pierre qui cède — fracas. | 0.3s |
| `sfx_skill_seismic_slam.ogg` | Seismic Slam | Impact violent sur le sol, onde de choc qui se propage. Très grave. | 0.5s |
| `sfx_skill_terra_surge_charge.ogg` | Terra Surge (0.5s charge) | Sol qui se tend, grondement souterrain. | 0.5s |
| `sfx_skill_terra_surge_erupt.ogg` | Terra Surge (pics) | Pics de pierre qui jaillissent — multiples impacts en rafale. | 0.4s |

### Compétences de Vent (Zephyr Peaks)

| Fichier | Skill | Description |
|---------|-------|-------------|
| `sfx_skill_gale_step.ogg` | Gale Step | Téléport vent — air qui s'escamote, arrivée en rafale. | 0.2s |
| `sfx_skill_tornado_spin.ogg` | Tornado Spin | Rotation continue de vent — sifflement circulaire qui monte. | 0.5s (loop) |
| `sfx_skill_tornado_spin_end.ogg` | Tornado Spin (fin) | Rafale de vent final quand le spin s'arrête. | 0.2s |
| `sfx_skill_skyward_strike.ogg` | Skyward Strike | Lancement en l'air (whoosh ascendant) + crash descendant (impact lourd). | 0.8s total |

### Compétences d'Eau (Abyssmar)

| Fichier | Skill | Description |
|---------|-------|-------------|
| `sfx_skill_tidal_wave_launch.ogg` | Tidal Wave (lancement) | Vague qui se forme — son d'eau en mouvement massif. | 0.3s |
| `sfx_skill_tidal_wave_impact.ogg` | Tidal Wave (impact) | Vague qui frappe — énorme, répercutant. | 0.5s |
| `sfx_skill_healing_current_channel.ogg` | Healing Current (channel 2s) | Eau qui coule autour du joueur, régénération. Loop douce de 2s. | 2s (loop) |
| `sfx_skill_healing_current_end.ogg` | Healing Current (fin) | Légère fin de soin — note d'eau apaisée. | 0.2s |
| `sfx_skill_frost_lance_launch.ogg` | Frost Lance (lancement) | Lance de glace projetée — son tranchant et froid. | 0.25s |
| `sfx_skill_frost_lance_impact.ogg` | Frost Lance (impact) | Glace qui pénètre — impact sec et cristallin. | 0.2s |

### Compétences de Foudre (Volterra)

| Fichier | Skill | Description |
|---------|-------|-------------|
| `sfx_skill_thunder_bolt.ogg` | Thunder Bolt | Éclair rapide — snap! électrique intense et bref. | 0.15s |
| `sfx_skill_chain_lightning_initial.ogg` | Chain Lightning (impact 1) | Premier hit — plus grand que Thunder Bolt. | 0.3s |
| `sfx_skill_chain_lightning_chain.ogg` | Chain Lightning (chaque chaîne) | Rebond — plus petit, snap rapide. | 0.15s |
| `sfx_skill_volt_dash_teleport.ogg` | Volt Dash | Téléport électrique — disparition et apparition avec décharge. | 0.3s |
| `sfx_skill_volt_dash_explosion.ogg` | Volt Dash (explosion à l'origine) | Explosion électrique au point de départ. | 0.4s |

### Compétences de Glace (Glaciem)

| Fichier | Skill | Description |
|---------|-------|-------------|
| `sfx_skill_frost_nova.ogg` | Frost Nova | Explosion de froid en anneau — craquèlement cristallin expansif. | 0.5s |
| `sfx_skill_frost_nova_freeze.ogg` | Son d'ennemi gelé par Frost Nova | Craquèlement de glace sur la cible. | 0.2s |
| `sfx_skill_blizzard_start.ogg` | Blizzard (invocation) | Zone de blizzard qui apparaît — vent qui s'installe. | 0.4s |
| `sfx_skill_blizzard_loop.ogg` | Blizzard (loop 5s) | Blizzard actif — tempête de neige continue. | 5s (seamless) |
| `sfx_skill_blizzard_end.ogg` | Blizzard (fin) | Blizzard qui se disperse — vent qui se tait. | 0.3s |
| `sfx_skill_ice_barrier.ogg` | Ice Barrier | Murs de glace qui surgissent — multiple craquèlements de glace qui se cristallise. | 0.4s |
| `sfx_skill_ice_barrier_break.ogg` | Ice Barrier (rupture) | Mur de glace brisé par un ennemi. | 0.3s |

### Compétences cachées

| Fichier | Skill | Description |
|---------|-------|-------------|
| `sfx_skill_soul_echo_proc.ogg` | Soul Echo (passif — proc) | Son discret quand le bonus s'applique. Très subtil. | 0.1s |
| `sfx_skill_void_step.ogg` | Void Step | Téléport dimensionnel — son qui absorbe tout autour, trou dans l'espace. | 0.5s |
| `sfx_skill_prism_burst.ogg` | Prism Burst | Tous les éléments à la fois — son complexe, couches multiples de tous les SFX élémentaires. | 0.8s |
| `sfx_skill_prism_burst_impact.ogg` | Prism Burst (impact) | Explosion multiélémentaire. | 1s |
| `sfx_skill_elaras_gift_proc.ogg` | Elara's Gift (proc) | Regen passive hors combat — très discret, eau coulant doucement. | 0.2s |

---

## 11. DIVERS

| Fichier | Description | Durée |
|---------|-------------|-------|
| `sfx_world_degrade.ogg` | Désaturation du monde après mort d'une divinité. Son ambigu et triste, comme si le monde perdait un peu de son signal. | 3–5s |
| `sfx_xp_levelup_bar_fill.ogg` | Barre XP qui se remplit jusqu'au level up. Son montant. | 0.5s |
| `sfx_npc_approve.ogg` | NPC satisfait (quête complétée). Son chaleureux bref. | 0.2s |
| `sfx_campfire_ignite.ogg` | Allumage d'un campfire. Crépitement de feu. | 0.4s |
| `sfx_boss_arena_door_open.ogg` | Porte d'arène de boss qui s'ouvre (si applicable). Lourd, inévitable. | 1–1.5s |
| `sfx_secret_found.ogg` | Découverte d'une zone secrète ou d'un chemin caché. Son discret de révélation. | 0.4–0.6s |
| `sfx_endgame_restore.ogg` | Son de la fin "Restore" — résurrection des 6 divinités, magie qui revient. | 8–15s |
| `sfx_endgame_erase.ogg` | Son de la fin "Erase" — le silence progressif puis l'effacement. | 10–20s |
| `sfx_new_game_plus.ogg` | Début du New Game+ après Erase. Un écho du jeu précédent dans le silence. | 3–5s |
