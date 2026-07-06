# Enemy Patterns — Grievy Town's Dilemma

> Design principle: **Telegraph before punish.**
> Every attack has a readable warning window. The window duration scales with the pattern's danger — more lethal attacks give more time, so a paying-attention player can always react. A player who ignores all signals and spams attack WILL die. A player who reads the enemy WILL survive.

---

## 1. Design Philosophy

### "Telegraph before punish"

Borrowed from Hollow Knight and Hyper Light Drifter: every enemy attack goes through a **visually distinct warning phase** before it actually damages the player. The duration of this warning scales with the pattern's lethality — fast patterns have shorter telegraphs, slow patterns have long ones.

This creates a skill loop:
1. Player sees telegraph → reads the attack type
2. Player repositions → dodges or counters
3. Attack fires into empty space → player punishes
4. Enemy enters cooldown → player's window to deal damage

A player who spams attack without reading will walk into every telegraph and die. A player who learns to read will feel increasingly powerful — not because the enemies get weaker, but because they become predictable.

### Progression of threat

| Zone tier | Telegraph | Cooldown | Patterns |
|-----------|-----------|----------|---------|
| Zones 1-2 (Ignis, Terravast) | 400-600ms | Long | Charge, Burst Fan |
| Zones 3-4 (Zephyr, Abyssmar) | 350-700ms | Medium | Dash Melee, Homing |
| Zones 5-6 (Volterra, Glaciem) | 350-800ms | Medium | All basic + Circular Burst |
| Boss (any zone) | 800-1000ms | Very long | Circular Burst + Summon |

---

## 2. The Six Patterns

### Pattern 1 — Charge

**Concept:** The enemy coils, trembles, then rockets in a straight line toward where the player *was* at the start of the telegraph.

| Parameter | Value |
|-----------|-------|
| Telegraph | 400ms |
| Telegraph VFX | Orange→red alternating tint, sprite trembling (scale oscillation) |
| Attack | Dash at 3.2× base move speed toward frozen player position |
| Damage mult | 1.5× base ATK |
| Cooldown | 800ms |
| Interrupt window | 300ms |

**Dodge:** Move laterally — the charge targets a frozen position. If you move during the telegraph, the charge misses entirely.

**Used by:** `ember_wyrm`, `lava_golem`, `crystal_golem`, `terravast_serpent`, `coral_golem`, `depth_serpent`, `thunder_drake`, `ice_golem`, `frost_wolf`

---

### Pattern 2 — Burst Fan

**Concept:** The enemy expands slightly (scale pop) then fires 4 projectiles in a 60° spread toward the player's current position.

| Parameter | Value |
|-----------|-------|
| Telegraph | 600ms |
| Telegraph VFX | Orange tint + scale 1.0→1.2→1.0, two concentric rings pulsing outward |
| Attack | 4 projectiles, 60° total spread, aimed at player position at telegraph start |
| Damage mult | 0.8× per projectile |
| Cooldown | 2000ms |
| Interrupt window | 400ms |

**Dodge:** The fan has gaps. A single sidestep during the telegraph puts you between two projectiles. Getting close to the enemy also narrows the angular spread.

**Used by:** `cinder_sprite`, `ash_revenant`, `terravast_serpent`, `gale_harpy`, `storm_eagle`, `cyclone_sprite`, `spark_imp`, `blizzard_wraith`

---

### Pattern 3 — Circular Burst

**Concept:** Elite/boss pattern. The enemy pulses a visible aura ring then fires 8 projectiles in all 8 directions simultaneously.

| Parameter | Value |
|-----------|-------|
| Telegraph | 800ms |
| Telegraph VFX | Dark red tint + large pulsing ring expanding/contracting, inner glow |
| Attack | 8 projectiles equally spaced (45° between each) |
| Damage mult | 1.0× per projectile |
| Cooldown | 3000ms |
| Interrupt window | 500ms |

**Dodge:** Get close — at very short range, the projectiles pass behind you by the time they reach your position. Alternatively, use a timed dash through one of the gaps. **Do not back away** — the projectiles will converge on you at mid-range.

**Used by (elite/boss only):** `magma_titan`, `crystal_golem`, `ruin_colossus`, `sky_titan`, `drowned_knight`, `storm_herald`, `ice_golem`, `permafrost_titan`, `crystal_dragon`, `shadow_construct`, `void_sentinel`, all zone bosses

---

### Pattern 4 — Dash Melee

**Concept:** A fast aggressive dash directly at the player followed by a melee swipe on arrival.

| Parameter | Value |
|-----------|-------|
| Telegraph | 350ms |
| Telegraph VFX | Violet tint + slight compression (scaleY 1.15), 3 directional particles toward player |
| Attack | 180px dash at 400px/s + contact damage on arrival |
| Damage mult | 1.2× base ATK |
| Cooldown | 1200ms |
| Interrupt window | 200ms |

**Dodge:** The dash is fast but linear. Dash forward *through* the enemy — they'll overshoot and be momentarily vulnerable. Or time a dodge so the enemy passes.

**Used by:** `stone_crawler`, `cave_lurker`, `tide_crawler`, `gale_harpy`, `frost_wolf`, `volt_hound`, `chain_revenant`, `drowned_knight`, `shadow_construct`

---

### Pattern 5 — Homing

**Concept:** The enemy summons a slow violet orb that persistently tracks the player for 3 seconds.

| Parameter | Value |
|-----------|-------|
| Telegraph | 700ms |
| Telegraph VFX | Violet tint + orb forming at enemy position |
| Attack | Orb at 90px/s with 55°/s max turn rate, 3s lifetime |
| Damage mult | 1.3× base ATK |
| Cooldown | 4000ms |
| Interrupt window | 400ms |

**Dodge two approaches:** (a) Lead the orb into a wall — the projectile disappears on hitting a solid object. (b) Simply outlast it — at 90px/s with a 3s lifetime, the orb travels 270px maximum. Dash away and circle back.

**Used by:** `cinder_sprite` (secondary), `ash_revenant` (secondary), `wind_wraith`, `sea_wraith`, `blizzard_wraith`, `chain_revenant`, `dark_revenant`, `void_sentinel`

---

### Pattern 6 — Summon (Boss only)

**Concept:** At 50% HP, the boss teleports to the center of the arena, flashes gold, and spawns 2-3 minions around itself. Fires only once per fight.

| Parameter | Value |
|-----------|-------|
| HP trigger | 50% HP threshold, once per fight |
| Telegraph | 1000ms |
| Telegraph VFX | Gold tint + expanding gold aura ring, "— Reinforcements —" text on screen |
| Attack | Teleport to map center + spawn 2-3 minions at 80px radius |
| Cooldown | 15000ms (effectively once) |
| Interrupt window | 800ms |

**Counter:** This is the most interruptible pattern — 800ms interrupt window. Hit the boss hard during the 1000ms telegraph to interrupt the summon (staggering the boss during a telegraph resets their state to chase). If the summon fires, prioritize clearing minions before returning to the boss.

**Used by:** All zone bosses at 50% HP

---

## 3. Enemy-to-Pattern Assignment

### How the AI picks a pattern

1. **Summon check:** Boss below 50% HP and summon not yet fired → summon pattern.
2. **Variety roll:** 30% chance to use secondary pattern instead of primary.
3. **Default:** Use primary pattern.

The enemy only triggers a pattern when:
- It's in aggro range
- The attack cooldown (`atkcd_<instanceId>`) has expired
- It's in `chase` state (not already telegraphing or recovering)

### Assignment table

| Enemy | Primary | Secondary | Minion ID |
|-------|---------|-----------|-----------|
| ember_wyrm | charge | melee_basic | — |
| lava_golem | charge | melee_basic | — |
| cinder_sprite | burst_fan | homing | — |
| ash_revenant | burst_fan | homing | — |
| magma_titan | charge | circular_burst | — |
| ember_broodmother | summon | melee_basic | cinder_sprite |
| scorch_sentinel | melee_basic | charge | — |
| pyrath_boss | circular_burst | charge | ember_wyrm |
| stone_crawler | dash_melee | melee_basic | — |
| crystal_golem | charge | circular_burst | — |
| cave_lurker | dash_melee | melee_basic | — |
| terravast_serpent | charge | burst_fan | — |
| ruin_colossus | circular_burst | charge | stone_crawler |
| gorvun_boss | circular_burst | charge | crystal_golem |
| gale_harpy | dash_melee | burst_fan | — |
| storm_eagle | burst_fan | charge | — |
| wind_wraith | homing | burst_fan | — |
| cyclone_sprite | burst_fan | melee_basic | — |
| sky_titan | circular_burst | charge | cyclone_sprite |
| sylvael_boss | circular_burst | homing | storm_eagle |
| tide_crawler | dash_melee | melee_basic | — |
| sea_wraith | homing | burst_fan | — |
| coral_golem | charge | melee_basic | — |
| depth_serpent | charge | burst_fan | — |
| drowned_knight | dash_melee | circular_burst | — |
| thalymor_boss | circular_burst | summon | tide_crawler |
| spark_imp | burst_fan | dash_melee | — |
| thunder_drake | charge | burst_fan | — |
| chain_revenant | homing | dash_melee | — |
| volt_hound | dash_melee | melee_basic | — |
| storm_herald | circular_burst | homing | spark_imp |
| volkran_boss | circular_burst | charge | thunder_drake |
| frost_wolf | dash_melee | charge | — |
| ice_golem | charge | circular_burst | — |
| blizzard_wraith | homing | burst_fan | — |
| permafrost_titan | circular_burst | charge | frost_wolf |
| crystal_dragon | circular_burst | homing | — |
| crysthea_boss | circular_burst | summon | ice_golem |
| dark_revenant | homing | burst_fan | — |
| shadow_construct | dash_melee | circular_burst | — |
| void_sentinel | circular_burst | homing | — |
| malachar_boss | circular_burst | summon | shadow_construct |

---

## 4. Tuning Parameters

### Why these numbers?

**Charge (400ms telegraph, 800ms cooldown):**
- 400ms is the minimum readable telegraph — below that, it reads as "instant" and feels unfair.
- The 3.2× speed mult makes it feel dangerous. At 90px/s base, that's 288px/s — crosses the screen in under a second.
- 800ms cooldown means the enemy isn't locked out for long, keeping pressure up.

**Burst Fan (600ms telegraph, 2000ms cooldown):**
- 600ms lets the player start moving *before* the shots fire.
- 4 projectiles at 260px/s with 60° spread → gaps are real. One sidestep clears all 4.
- 2000ms cooldown because projectile patterns are range-safe — enemy needs longer recovery.

**Circular Burst (800ms telegraph, 3000ms cooldown):**
- 800ms is long because 8 directions leaves nowhere to run. The solution (get close) is counter-intuitive and needs time to execute.
- 3000ms cooldown is punishment for the most dangerous attack. Rewards the player who correctly dodges.

**Dash Melee (350ms telegraph, 1200ms cooldown):**
- Shortest telegraph — this is meant to feel fast. But the violet color and compression VFX are distinctive.
- 180px dash at 400px/s covers the screen quickly, but the enemy overshoots if you dodge.
- 1200ms cooldown = moderate recovery.

**Homing (700ms telegraph, 4000ms cooldown):**
- 700ms to form the orb — long enough that the player can start repositioning.
- Orb at 90px/s with 3s lifetime. Slow but persistent — tests spatial awareness not reflexes.
- 4000ms cooldown because a homing orb lingers on screen, effectively locking the player's movement during its 3s flight.

**Summon (1000ms telegraph, fires once):**
- 1000ms is the boss moment. Long, dramatic, interruptible.
- Gold VFX + screen text = maximum legibility. The player always knows what's happening.
- Firing once per fight keeps it as a phase transition, not a spam.

---

## 5. FSM States

Each enemy instance runs through this state machine:

```
IDLE → PATROL    (if behavior=patrol and out of aggro range)
     → CHASE     (if player enters aggro range)

CHASE → IDLE     (if player moves out of aggro range × 1.4)
      → TELEGRAPH (if in attack range AND attack cooldown ready)

TELEGRAPH → ATTACK (after telegraphMs expires)

ATTACK → COOLDOWN (after 600ms execution window)

COOLDOWN → CHASE  (if player still in aggro range, after cooldownMs)
         → IDLE   (if player out of range)
```

**Contact melee** runs as a background check: when a non-ranged enemy is within 50px of the player and NOT in telegraph state, it applies a basic melee tap (1.2s cooldown) so enemies never feel inert while touching the player.

**STUN** from player finishers or skills can interrupt any state — the enemy freezes for the stun duration, then returns to chase.

---

*Document version 1.0 — feat/enemy-patterns*
