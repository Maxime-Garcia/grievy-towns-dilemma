import { PlayerState, Attributes, Stats } from '../types';
import { StatsSystem } from './StatsSystem';

export const XP_PER_LEVEL = (level: number): number =>
  Math.floor(100 * Math.pow(level, 1.6));

export const ENEMY_XP = (enemyLevel: number): number =>
  Math.floor(8 * Math.pow(enemyLevel, 1.3));

export const BOSS_XP = (bossLevel: number): number =>
  Math.floor(80 * Math.pow(bossLevel, 1.3));

/**
 * `SCALED_ENEMY_LEVEL` A ÉTÉ SUPPRIMÉE — elle produisait des PV NÉGATIFS.
 *
 *     level = max(1, baseLevel + floor((playerLevel - baseLevel) * 0.6))
 *     scale = 1 + (level - baseLevel) * 0.08      // ← CombatSystem.spawnEnemy
 *
 * Les niveaux étant supprimés, `playerLevel` vaut 1 partout. Pour un ennemi de
 * `baseLevel` 30, `scale` tombait à -0,44 : `maxHp = floor(baseHp × -0,44)` était
 * NÉGATIF. Mesuré : 9 ennemis sur 57, dont 3 boss (malachar_boss à -1760 PV).
 *
 * La mise à l'échelle se fait désormais par PROFONDEUR DE ZONE, la seule variable
 * qui garde un sens dans un roguelite : `src/data/enemyScaling.ts`.
 */

export class ProgressionSystem {
  static computeBaseStats(level: number, attrs: Attributes): Stats {
    return {
      maxHp: 100 + level * 15 + attrs.vit * 8,
      hp: 100 + level * 15 + attrs.vit * 8,
      maxMana: 60 + level * 8 + attrs.int * 5,
      mana: 60 + level * 8 + attrs.int * 5,
      atk: 10 + level * 2 + attrs.str * 3,
      def: 5 + level + attrs.end * 2,
      spd: 5 + Math.floor(level * 0.5) + attrs.agi * 2,
      magicAtk: 10 + level * 2 + attrs.int * 3,
      magicDef: 5 + Math.floor(level * 0.8) + attrs.end + attrs.int,
    };
  }

  static addXp(player: PlayerState, xp: number): { leveled: boolean; newLevel: number } {
    player.xp += xp;
    let leveled = false;

    while (player.xp >= player.xpToNext) {
      player.xp -= player.xpToNext;
      player.level++;
      player.attributePoints += 3;
      // 1 talent point par niveau, cap global à 20
      if (player.talentPoints < 20) player.talentPoints++;
      player.xpToNext = XP_PER_LEVEL(player.level);
      leveled = true;
    }

    if (leveled) {
      // Recalcule via StatsSystem.computeAll (base + équipement) plutôt que
      // computeBaseStats seul — sinon chaque level-up écrasait les bonus
      // d'équipement (equipStats) jusqu'au prochain equip/unequip.
      const prevMaxHp = player.stats.maxHp;
      const prevMaxMana = player.stats.maxMana;
      const cs = StatsSystem.computeAll(player);
      const hpDiff = cs.hp - prevMaxHp;
      const manaDiff = cs.mana - prevMaxMana;

      player.stats.maxHp    = cs.hp;
      player.stats.maxMana  = cs.mana;
      player.stats.atk      = cs.atk;
      player.stats.def      = cs.def;
      player.stats.spd      = cs.spd;
      player.stats.magicAtk = cs.matk;
      player.stats.magicDef = cs.magicDef;

      player.stats.hp   = Math.min(player.stats.hp + hpDiff,   player.stats.maxHp);
      player.stats.mana = Math.min(player.stats.mana + manaDiff, player.stats.maxMana);
    }

    return { leveled, newLevel: player.level };
  }

  static allocateAttribute(
    player: PlayerState,
    attribute: keyof Attributes
  ): boolean {
    if (player.attributePoints <= 0) return false;

    player.attributes[attribute]++;
    player.attributePoints--;

    const newStats = this.computeBaseStats(player.level, player.attributes);
    player.stats.maxHp    = newStats.maxHp;
    player.stats.maxMana  = newStats.maxMana;
    player.stats.atk      = newStats.atk;
    player.stats.def      = newStats.def;
    player.stats.spd      = newStats.spd;
    player.stats.magicAtk = newStats.magicAtk;
    player.stats.magicDef = newStats.magicDef;

    return true;
  }

  static critChance(player: PlayerState): number {
    return 0.05 + player.attributes.agi * 0.003;
  }

  static createFreshPlayer(name: string): PlayerState {
    const attrs: Attributes = { str: 2, int: 2, agi: 2, vit: 2, end: 2 };
    const stats = ProgressionSystem.computeBaseStats(1, attrs);

    return {
      name,
      level: 1,
      xp: 0,
      xpToNext: XP_PER_LEVEL(1),
      stats,
      attributes: attrs,
      attributePoints: 0,
      equipment: {},
      // Sac vide à la création (à la demande du créateur, 17/07) — l'ancien dump
      // de toutes les armes écrites à la main était une commodité DEV, pas un
      // vrai départ de partie. Ces armes restent accessibles via la touche debug
      // G (giveAllWeaponsKey/debugGiveAllWeapons) quand DEBUG_CHEAT_KEYS_ENABLED
      // est réactivé.
      inventory: [],
      gold: 50,
      unlockedSkills: ['dash', 'echo_strike'],
      equippedSkills: { slot1: 'echo_strike', slot2: null, slot3: null, slot4: null },
      clearedZones: [],
      activeQuests: ['mq_00_awakening'],
      completedQuests: [],
      currentZone: 'grievy_town',
      position: { x: 0, y: 0 },
      flags: {},
      playtime: 0,
      deaths: 0,
      totalKills: 0,
      killsWithoutEpic: 0,
      killsWithoutLegendary: 0,
      killsWithoutMythic: 0,
      isNewGamePlus: false,
      ngPlusCount: 0,
      questProgress: {},
      talentPoints: 1,    // niveau 1 → 1 point disponible immédiatement
      unlockedTalents: [],
      respecCount: 0,
      passiveStacks: {},
      firstStrikeReady: true,
      runBagCapacity: 20,
      runSafeSlotCapacity: 4,
    };
  }
}
