import { PlayerState, Attributes, Stats, Equipment, StatBonus } from '../types';
import { ALL_ITEMS } from '../data/items';

export const XP_PER_LEVEL = (level: number): number =>
  Math.floor(100 * Math.pow(level, 1.6));

export const ENEMY_XP = (enemyLevel: number): number =>
  Math.floor(8 * Math.pow(enemyLevel, 1.3));

export const BOSS_XP = (bossLevel: number): number =>
  Math.floor(80 * Math.pow(bossLevel, 1.3));

export const SCALED_ENEMY_LEVEL = (baseLevel: number, playerLevel: number): number => {
  const delta = playerLevel - baseLevel;
  return Math.max(1, baseLevel + Math.floor(delta * 0.6));
};

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

  static applyEquipmentBonuses(base: Stats, equipment: Equipment): Stats {
    const stats = { ...base };
    const slots = [
      equipment.weapon,
      equipment.helm,
      equipment.chest,
      equipment.legs,
      equipment.boots,
      equipment.gloves,
      equipment.cape,
      equipment.ring1,
      equipment.ring2,
      equipment.amulet,
    ];

    for (const item of slots) {
      if (!item) continue;

      let bonusStats: StatBonus = {};
      if ('bonusStats' in item) bonusStats = (item as any).bonusStats;

      if (bonusStats.hp)       stats.maxHp    += bonusStats.hp;
      if (bonusStats.mana)     stats.maxMana  += bonusStats.mana;
      if (bonusStats.atk)      stats.atk      += bonusStats.atk;
      if (bonusStats.def)      stats.def      += bonusStats.def;
      if (bonusStats.spd)      stats.spd      += bonusStats.spd;
      if (bonusStats.magicAtk) stats.magicAtk += bonusStats.magicAtk;
      if (bonusStats.magicDef) stats.magicDef += bonusStats.magicDef;
      if (bonusStats.str)      stats.atk      += bonusStats.str * 3;
      if (bonusStats.int)      { stats.magicAtk += bonusStats.int * 3; stats.maxMana += bonusStats.int * 5; }
      if (bonusStats.agi)      stats.spd      += bonusStats.agi * 2;
      if (bonusStats.vit)      stats.maxHp    += bonusStats.vit * 8;
      if (bonusStats.end)      { stats.def += bonusStats.end * 2; stats.magicDef += bonusStats.end; }

      if ('defense' in item)      stats.def      += (item as any).defense ?? 0;
      if ('magicDefense' in item) stats.magicDef += (item as any).magicDefense ?? 0;
    }

    return stats;
  }

  static addXp(player: PlayerState, xp: number): { leveled: boolean; newLevel: number } {
    player.xp += xp;
    let leveled = false;

    while (player.xp >= player.xpToNext) {
      player.xp -= player.xpToNext;
      player.level++;
      player.attributePoints += 3;
      player.xpToNext = XP_PER_LEVEL(player.level);
      leveled = true;

      const newBase = this.computeBaseStats(player.level, player.attributes);
      const hpDiff = newBase.maxHp - player.stats.maxHp;
      const manaDiff = newBase.maxMana - player.stats.maxMana;

      player.stats.maxHp   = newBase.maxHp;
      player.stats.maxMana = newBase.maxMana;
      player.stats.atk     = newBase.atk;
      player.stats.def     = newBase.def;
      player.stats.spd     = newBase.spd;
      player.stats.magicAtk = newBase.magicAtk;
      player.stats.magicDef = newBase.magicDef;

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
      inventory: [
        { item: ALL_ITEMS['minor_health_potion'], quantity: 5 },
        { item: ALL_ITEMS['minor_mana_potion'], quantity: 3 },
      ],
      gold: 50,
      unlockedSkills: ['dash', 'echo_strike'],
      equippedSkills: { slot1: 'echo_strike', slot2: null, slot3: null, slot4: null },
      clearedZones: [],
      activeQuests: ['mq_00_awakening'],
      completedQuests: [],
      currentZone: 'grievy_town',
      position: { x: 400, y: 300 },
      flags: {},
      playtime: 0,
      deaths: 0,
      totalKills: 0,
      killsWithoutEpic: 0,
      killsWithoutLegendary: 0,
      isNewGamePlus: false,
      ngPlusCount: 0,
    };
  }
}
