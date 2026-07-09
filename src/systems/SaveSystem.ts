import { GameState, SaveData, PlayerState, WorldState, EndingChoice } from '../types';
import { ProgressionSystem } from './ProgressionSystem';

const SAVE_VERSION = '1.6.0';
const SAVE_KEY_PREFIX = 'gtd_save_';
const MAX_SLOTS = 3;

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
