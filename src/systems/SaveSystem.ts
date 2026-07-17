import { GameState, SaveData, PlayerState, WorldState, EndingChoice, Item, Equipment } from '../types';
import { ProgressionSystem } from './ProgressionSystem';
import { StatRollSystem, isEquipableItem } from './StatRollSystem';
import { ALL_ITEMS } from '../data/items';

const SAVE_VERSION = '1.9.0';
const SAVE_KEY_PREFIX = 'gtd_save_';
const MAX_SLOTS = 3;

/** Les 10 slots d'équipement portant un Item — exclut `skins` (pas un Item). */
type GearSlotKey = Exclude<keyof Equipment, 'skins'>;
const EQUIPMENT_SLOTS: GearSlotKey[] = [
  'weapon', 'helm', 'chest', 'legs', 'boots', 'gloves', 'cape', 'ring1', 'ring2', 'amulet',
];

/**
 * Re-roll un item équipable à Q = 0.5 exactement (docs/design/LOOT_STAT_ROLLS.md
 * §8.2 : le centre EST l'ancienne valeur fixe par construction §6.1 — migration
 * invisible en puissance, personne ne perd ni ne gagne rien). Préserve les
 * champs d'instance déjà mutés (élément roulé au drop). No-op sûr pour tout
 * item sans equipRanges (consommables/matériaux/clés/skins, ou équipement pas
 * encore migré côté data — cf. StatRollSystem.rollItem).
 */
function reRollEquipableInstance(item: Item): Item {
  const template = ALL_ITEMS[item.id];
  if (!template || !isEquipableItem(template) || !template.equipRanges) return item;
  const rolled = StatRollSystem.rollItem(template, 0.5);
  if (item.element !== undefined) rolled.element = item.element;
  return rolled;
}

// Each entry migrates a save from its key version to the next.
// Add a new entry here whenever PlayerState, WorldState, or GameState changes.
const FRESH_WORLD: WorldState = { clearedZones: [], degradationLevel: 0, malacharDefeated: false, bestiary: {}, arsenal: {} };

const MIGRATION_MAP: Record<string, (state: GameState) => GameState> = {
  '1.0.0': (state) => ({
    ...state,
    version: '1.1.0',
    world: (state as any).world ?? { ...FRESH_WORLD },
    player: {
      ...state.player,
      totalKills: state.player.totalKills ?? 0,
      killsWithoutEpic: state.player.killsWithoutEpic ?? 0,
      killsWithoutLegendary: state.player.killsWithoutLegendary ?? 0,
      equipment: {
        ...state.player.equipment,
        skins: state.player.equipment.skins ?? {},
      },
    },
  }),
  '1.1.0': (state) => ({
    ...state,
    version: '1.2.0',
    world: (state as any).world ?? { ...FRESH_WORLD },
    player: {
      ...state.player,
      questProgress: (state.player as any).questProgress ?? {},
    },
  }),
  // Ajout des champs talent (talentPoints, unlockedTalents, respecCount)
  '1.2.0': (state) => ({
    ...state,
    version: '1.3.0',
    player: {
      ...state.player,
      talentPoints: Math.min((state.player as any).talentPoints ?? Math.min(state.player.level ?? 1, 20), 20),
      unlockedTalents: (state.player as any).unlockedTalents ?? [],
      respecCount: (state.player as any).respecCount ?? 0,
    },
  }),
  // Ajout du champ bestiary dans WorldState
  '1.3.0': (state) => ({
    ...state,
    version: '1.4.0',
    world: {
      ...state.world,
      bestiary: (state.world as any).bestiary ?? {},
    },
  }),
  // Ajout du compteur kills dans chaque BestiaryEntryState
  '1.4.0': (state) => ({
    ...state,
    version: '1.4.1',
    world: {
      ...state.world,
      bestiary: Object.fromEntries(
        Object.entries((state.world as any).bestiary ?? {}).map(([id, e]: [string, any]) => [
          id, { ...e, kills: e.kills ?? 0 },
        ])
      ),
    },
  }),
  // Ajout du champ arsenal dans WorldState (glossaire armes/armures)
  '1.4.1': (state) => ({
    ...state,
    version: '1.5.0',
    world: {
      ...state.world,
      arsenal: (state.world as any).arsenal ?? {},
    },
  }),
  // Ajout des champs passifs d'objet (passiveStacks, firstStrikeReady)
  '1.5.0': (state) => ({
    ...state,
    version: '1.6.0',
    player: {
      ...state.player,
      passiveStacks: (state.player as any).passiveStacks ?? {},
      firstStrikeReady: (state.player as any).firstStrikeReady ?? true,
    },
  }),
  // Loot stat rolls (docs/design/LOOT_STAT_ROLLS.md §8) : re-roll à Q = 0.5
  // exactement chaque équipable de l'inventaire ET des 10 slots d'équipement —
  // Q = 0.5 = centre = ancienne valeur fixe, migration invisible en puissance.
  '1.6.0': (state) => {
    const inventory = state.player.inventory.map(slot => ({
      ...slot,
      item: reRollEquipableInstance(slot.item),
    }));

    const equipment: Equipment = { ...state.player.equipment };
    // Écriture par clé générique sur un objet à propriétés hétérogènes (Weapon |
    // Armor | Accessory selon le slot) — TypeScript ne peut pas prouver la
    // correspondance clé→type dans une boucle générique ; on passe par `unknown`
    // (plutôt que `any`) sur un type de vue borné aux 10 slots réels, jamais
    // sur `equipment` entier. Même limitation déjà acceptée dans
    // InventorySystem.equip/unequip pour la même raison structurelle.
    const gearView = equipment as unknown as Record<GearSlotKey, Item | undefined>;
    for (const slot of EQUIPMENT_SLOTS) {
      const current = gearView[slot];
      if (current) gearView[slot] = reRollEquipableInstance(current);
    }

    return {
      ...state,
      version: '1.7.0',
      player: {
        ...state.player,
        inventory,
        equipment,
      },
    };
  },
  // Ajout du compteur pity MYTHIC (Système Pity, PITY/PITY.md)
  '1.7.0': (state) => ({
    ...state,
    version: '1.8.0',
    player: {
      ...state.player,
      killsWithoutMythic: (state.player as any).killsWithoutMythic ?? 0,
    },
  }),
  // RunSystem (docs/design/ROGUELITE_POC.md) : état de run persistant + capacités
  // du sac de run. `run` reste null pour toute save d'avant ce chantier — une run
  // en cours n'existait tout simplement pas.
  '1.8.0': (state) => ({
    ...state,
    version: '1.9.0',
    run: (state as any).run ?? null,
    player: {
      ...state.player,
      runBagCapacity: (state.player as any).runBagCapacity ?? 20,
      runSafeSlotCapacity: (state.player as any).runSafeSlotCapacity ?? 4,
    },
  }),
};

function migrate(state: GameState): GameState {
  let current = state;
  while (current.version !== SAVE_VERSION && MIGRATION_MAP[current.version]) {
    current = MIGRATION_MAP[current.version](current);
  }
  return current;
}

export class SaveSystem {

  static save(state: GameState, slot: number): boolean {
    if (slot < 0 || slot >= MAX_SLOTS) return false;
    try {
      const data: SaveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        gameState: state,
        slot,
        playtime: state.player.playtime,
        playerName: state.player.name,
        level: state.player.level,
        clearedZones: state.player.clearedZones.length,
      };
      localStorage.setItem(`${SAVE_KEY_PREFIX}${slot}`, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  static load(slot: number): GameState | null {
    try {
      const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`);
      if (!raw) return null;
      const data: SaveData = JSON.parse(raw);
      if (!data.version || !data.gameState) return null;
      return migrate(data.gameState);
    } catch {
      return null;
    }
  }

  static listSlots(): Array<SaveData | null> {
    const slots: Array<SaveData | null> = [];
    for (let i = 0; i < MAX_SLOTS; i++) {
      try {
        const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${i}`);
        slots.push(raw ? JSON.parse(raw) : null);
      } catch {
        slots.push(null);
      }
    }
    return slots;
  }

  static delete(slot: number): void {
    localStorage.removeItem(`${SAVE_KEY_PREFIX}${slot}`);
  }

  static createNewGame(playerName: string, slot = 0): GameState {
    const player = ProgressionSystem.createFreshPlayer(playerName);
    const world: WorldState = {
      clearedZones: [],
      degradationLevel: 0,
      malacharDefeated: false,
      bestiary: {},
      arsenal: {},
    };
    return {
      player,
      world,
      run: null,
      saveSlot: slot,
      saveTimestamp: Date.now(),
      version: SAVE_VERSION,
    };
  }

  static createNewGamePlus(previous: GameState, choice: EndingChoice): GameState {
    const fresh = this.createNewGame(previous.player.name, previous.saveSlot);
    fresh.player.isNewGamePlus = true;
    fresh.player.ngPlusCount   = previous.player.ngPlusCount + 1;
    if (choice === EndingChoice.ERASE) {
      fresh.player.unlockedSkills.push('prism_burst');
      fresh.player.equippedSkills.slot2 = 'prism_burst';
    }
    return fresh;
  }

  static formatPlaytime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
