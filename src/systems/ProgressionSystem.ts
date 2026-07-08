import { PlayerState, Attributes, Stats } from '../types';
import { ALL_ITEMS } from '../data/items';
import { StatsSystem } from './StatsSystem';

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
      // DEV: toutes les armes pour tester chaque WeaponType + pattern de combat
      inventory: [
        // ── SWORD ──────────────────────────────────────────────
        { item: ALL_ITEMS['iron_sword'],                  quantity: 1 },
        { item: ALL_ITEMS['steel_sword'],                 quantity: 1 },
        { item: ALL_ITEMS['storm_sword'],                 quantity: 1 },
        { item: ALL_ITEMS['dragonfang_sword'],            quantity: 1 },
        { item: ALL_ITEMS['coral_sword'],                 quantity: 1 },
        { item: ALL_ITEMS['arc_sword'],                   quantity: 1 },
        { item: ALL_ITEMS['sentinel_sword'],              quantity: 1 },
        { item: ALL_ITEMS['drowned_knight_sword'],        quantity: 1 },
        { item: ALL_ITEMS['divine_sword'],                quantity: 1 },
        // ── GREATSWORD ─────────────────────────────────────────
        { item: ALL_ITEMS['magma_greatsword'],            quantity: 1 },
        { item: ALL_ITEMS['colossus_greatsword'],         quantity: 1 },
        { item: ALL_ITEMS['wind_greatsword'],             quantity: 1 },
        { item: ALL_ITEMS['blizzard_greatsword'],         quantity: 1 },
        // ── DAGGER ─────────────────────────────────────────────
        { item: ALL_ITEMS['dagger_of_shadow'],            quantity: 1 },
        { item: ALL_ITEMS['depth_serpent_fang_dagger'],   quantity: 1 },
        { item: ALL_ITEMS['cinder_dagger'],               quantity: 1 },
        { item: ALL_ITEMS['stone_dagger'],                quantity: 1 },
        { item: ALL_ITEMS['gale_dagger'],                 quantity: 1 },
        { item: ALL_ITEMS['frost_dagger'],                quantity: 1 },
        // ── DUAL_DAGGER ────────────────────────────────────────
        { item: ALL_ITEMS['test_dual_dagger'],            quantity: 1 },
        // ── DUAL_SWORD ─────────────────────────────────────────
        { item: ALL_ITEMS['test_dual_sword'],             quantity: 1 },
        // ── AXE ────────────────────────────────────────────────
        { item: ALL_ITEMS['test_axe'],                    quantity: 1 },
        // ── HAMMER ─────────────────────────────────────────────
        { item: ALL_ITEMS['test_hammer'],                 quantity: 1 },
        // ── STAFF ──────────────────────────────────────────────
        { item: ALL_ITEMS['fire_staff'],                  quantity: 1 },
        { item: ALL_ITEMS['tide_staff'],                  quantity: 1 },
        { item: ALL_ITEMS['seismic_staff'],               quantity: 1 },
        { item: ALL_ITEMS['shadow_staff'],                quantity: 1 },
        { item: ALL_ITEMS['water_staff'],                 quantity: 1 },
        { item: ALL_ITEMS['thunder_staff'],               quantity: 1 },
        { item: ALL_ITEMS['frost_staff'],                 quantity: 1 },
        { item: ALL_ITEMS['earth_tome'],                  quantity: 1 },
        // ── BOW ────────────────────────────────────────────────
        { item: ALL_ITEMS['harpy_bow'],                   quantity: 1 },
        { item: ALL_ITEMS['pyroclast_bow'],               quantity: 1 },
        { item: ALL_ITEMS['thunder_bow'],                 quantity: 1 },
        { item: ALL_ITEMS['void_bow'],                    quantity: 1 },
        { item: ALL_ITEMS['wind_bow'],                    quantity: 1 },
        { item: ALL_ITEMS['leather_helm'],                quantity: 1 },
        { item: ALL_ITEMS['iron_helm'],                   quantity: 1 },
        { item: ALL_ITEMS['leather_chest'],               quantity: 1 },
        { item: ALL_ITEMS['iron_chest'],                  quantity: 1 },
        { item: ALL_ITEMS['leather_legs'],                quantity: 1 },
        { item: ALL_ITEMS['leather_boots'],               quantity: 1 },
        { item: ALL_ITEMS['air_walker_boots'],            quantity: 1 },
        { item: ALL_ITEMS['leather_gloves'],              quantity: 1 },
        { item: ALL_ITEMS['obsidian_gauntlets'],          quantity: 1 },
        { item: ALL_ITEMS['storm_eagle_feather_cloak'],   quantity: 1 },
        { item: ALL_ITEMS['flame_ring'],                  quantity: 1 },
        { item: ALL_ITEMS['shadow_ring'],                 quantity: 1 },
        { item: ALL_ITEMS['sailor_ghost_ring'],           quantity: 1 },
        { item: ALL_ITEMS['thunder_drake_fang'],          quantity: 1 },
        { item: ALL_ITEMS['wraith_ice_amulet'],           quantity: 1 },
        { item: ALL_ITEMS['minor_health_potion'],         quantity: 10 },
        { item: ALL_ITEMS['health_potion'],               quantity: 5 },
        { item: ALL_ITEMS['minor_mana_potion'],           quantity: 10 },
        { item: ALL_ITEMS['mana_potion'],                 quantity: 5 },
        { item: ALL_ITEMS['full_elixir'],                 quantity: 3 },
        { item: ALL_ITEMS['revive_crystal'],              quantity: 2 },
      ],
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
      isNewGamePlus: false,
      ngPlusCount: 0,
      questProgress: {},
      talentPoints: 1,    // niveau 1 → 1 point disponible immédiatement
      unlockedTalents: [],
      respecCount: 0,
    };
  }
}
