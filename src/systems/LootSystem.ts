import { LootEntry, Item, ItemRarity, ItemType, ElementType, PlayerState, Weapon, Armor, WorldState } from '../types';
import { ALL_ITEMS } from '../data/items';
import { RARITY_DROP_RATES } from '../types';
import { ArsenalSystem } from './ArsenalSystem';
import { StatRollSystem } from './StatRollSystem';

// Elements that can be assigned randomly at drop (excludes NEUTRAL which is the baseline)
const RANDOM_ELEMENTS: ElementType[] = [
  ElementType.NEUTRAL,
  ElementType.FIRE,
  ElementType.EARTH,
  ElementType.WIND,
  ElementType.WATER,
  ElementType.LIGHTNING,
  ElementType.ICE,
  ElementType.DARK,
];

// Weight table: NEUTRAL is most common, DARK is rare
const ELEMENT_WEIGHTS = [30, 12, 12, 12, 12, 12, 12, 3];

function rollRandomElement(): ElementType {
  const total = ELEMENT_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < ELEMENT_WEIGHTS.length; i++) {
    r -= ELEMENT_WEIGHTS[i];
    if (r <= 0) return RANDOM_ELEMENTS[i];
  }
  return ElementType.NEUTRAL;
}

function applyRandomElement(item: Item): Item {
  if (item.type !== ItemType.WEAPON && item.type !== ItemType.HELM &&
      item.type !== ItemType.CHEST && item.type !== ItemType.LEGS &&
      item.type !== ItemType.BOOTS && item.type !== ItemType.GLOVES &&
      item.type !== ItemType.CAPE) {
    return item;
  }
  const element = rollRandomElement();
  // Shallow clone to avoid mutating the template
  return { ...item, element } as Item;
}

const PITY_EPIC      = 250;
const PITY_LEGENDARY = 500;

// ════════════════════════════════════════════════════════════════════
// WORLD DROP — le catalogue générique (`gen_*`, ~390 armes/armures issues des
// packs d'icônes) n'appartient à AUCUNE table de loot d'ennemi : l'y inscrire à
// la main aurait voulu dire 390 lignes réparties sur 60 ennemis, impossibles à
// maintenir. À la place, un pool global à l'ARPG : chaque kill a une chance de
// lâcher, EN PLUS de sa table fixe, un item tiré du catalogue générique.
//
// Les tables fixes gardent donc tout leur rôle (l'ennemi qui lâche SON arme
// signature, le drop garanti de boss) ; le world drop fournit le bruit de fond
// qui fait vivre la chasse au butin et rend l'Arsenal réellement complétable.
// ════════════════════════════════════════════════════════════════════

/** Probabilité qu'un kill produise un world drop, avant modulation élite/boss. */
const WORLD_DROP_CHANCE = 0.18;
const WORLD_DROP_ELITE_MULT = 2.5;
const WORLD_DROP_BOSS_MULT  = 4.0;

/**
 * Niveau d'ennemi minimum pour qu'une rareté puisse tomber en world drop.
 * Sans ce garde-fou, un rat de niveau 1 pourrait lâcher un MYTHIC : la
 * progression du butin n'aurait plus aucun sens et le early game serait résolu
 * au premier coup de chance.
 */
const WORLD_DROP_MIN_LEVEL: Partial<Record<ItemRarity, number>> = {
  [ItemRarity.COMMON]: 1,
  [ItemRarity.UNCOMMON]: 3,
  [ItemRarity.RARE]: 6,
  [ItemRarity.EPIC]: 11,
  [ItemRarity.LEGENDARY]: 17,
  [ItemRarity.MYTHIC]: 24,
};

/**
 * Plancher de rareté du world drop. Un boss qui lâche une épée COMMON est un
 * anticlimax : sa mort doit valoir quelque chose. On ne touche PAS aux
 * probabilités relatives des raretés supérieures — on retire simplement le bas
 * de la table pour les cibles d'élite, et la renormalisation fait le reste.
 */
const WORLD_DROP_RARITY_FLOOR: ItemRarity[] = [
  ItemRarity.COMMON, ItemRarity.UNCOMMON, ItemRarity.RARE, ItemRarity.EPIC,
  ItemRarity.LEGENDARY, ItemRarity.MYTHIC, ItemRarity.HIDDEN,
];
const ELITE_FLOOR_IDX = WORLD_DROP_RARITY_FLOOR.indexOf(ItemRarity.UNCOMMON);
const BOSS_FLOOR_IDX  = WORLD_DROP_RARITY_FLOOR.indexOf(ItemRarity.RARE);

/** Pool générique indexé par rareté — construit une seule fois, à la demande. */
let WORLD_POOL: Partial<Record<ItemRarity, Item[]>> | null = null;

function getWorldPool(): Partial<Record<ItemRarity, Item[]>> {
  if (WORLD_POOL) return WORLD_POOL;
  const pool: Partial<Record<ItemRarity, Item[]>> = {};
  for (const item of Object.values(ALL_ITEMS)) {
    if (!item.id.startsWith('gen_')) continue;
    (pool[item.rarity] ??= []).push(item);
  }
  WORLD_POOL = pool;
  return pool;
}

export interface LootResult {
  items: { item: Item; quantity: number }[];
  gold: number;
  xp: number;
}

export class LootSystem {
  /**
   * `qFloor` (0–1, défaut 0) : plancher de Résonance transmis à
   * StatRollSystem.rollItem() pour chaque équipable droppé — 0.5 pour un drop
   * garanti de boss (première mort, cf. GameScene.onEnemyKilled), 0 sinon
   * (docs/design/LOOT_STAT_ROLLS.md §5).
   */
  /**
   * Tire un item du catalogue générique, ou `null`. La rareté est tirée selon les
   * taux du jeu (RARITY_DROP_RATES), puis filtrée par le niveau de l'ennemi
   * (WORLD_DROP_MIN_LEVEL) : on renormalise sur les seules raretés autorisées,
   * plutôt que de retirer à vide — sinon un ennemi de bas niveau perdrait le plus
   * clair de ses world drops au lieu de lâcher du COMMON.
   */
  static rollWorldDrop(enemyLevel: number, isElite: boolean, isBoss: boolean): Item | null {
    let chance = WORLD_DROP_CHANCE;
    if (isBoss) chance *= WORLD_DROP_BOSS_MULT;
    else if (isElite) chance *= WORLD_DROP_ELITE_MULT;
    if (Math.random() > chance) return null;

    const pool = getWorldPool();
    // Plancher de rareté : un boss ne lâche jamais de COMMON/UNCOMMON, une élite
    // jamais de COMMON. Le plancher cède devant le verrou de niveau (un boss de
    // niveau 2 n'ouvrira pas du RARE avant le niveau 6) : c'est le niveau qui
    // gouverne la progression, le plancher ne fait qu'écrémer le bas de table.
    const floorIdx = isBoss ? BOSS_FLOOR_IDX : isElite ? ELITE_FLOOR_IDX : 0;

    const eligible = (Object.keys(RARITY_DROP_RATES) as ItemRarity[]).filter(r => {
      const min = WORLD_DROP_MIN_LEVEL[r];
      if (min === undefined || enemyLevel < min) return false;
      if ((pool[r]?.length ?? 0) === 0) return false;
      return WORLD_DROP_RARITY_FLOOR.indexOf(r) >= floorIdx;
    });
    // Si le plancher ne laisse rien (cible d'élite de très bas niveau), on rouvre
    // le bas de table plutôt que d'annuler le drop — mieux vaut un COMMON que rien.
    if (eligible.length === 0) {
      const fallback = (Object.keys(RARITY_DROP_RATES) as ItemRarity[]).filter(r => {
        const min = WORLD_DROP_MIN_LEVEL[r];
        return min !== undefined && enemyLevel >= min && (pool[r]?.length ?? 0) > 0;
      });
      if (fallback.length === 0) return null;
      eligible.push(...fallback);
    }

    const total = eligible.reduce((s, r) => s + RARITY_DROP_RATES[r], 0);
    let r = Math.random() * total;
    let chosen = eligible[0];
    for (const rarity of eligible) {
      r -= RARITY_DROP_RATES[rarity];
      if (r <= 0) { chosen = rarity; break; }
    }

    const candidates = pool[chosen]!;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  static rollLoot(
    entries: LootEntry[],
    goldRange: { min: number; max: number },
    baseXp: number,
    enemyLevel: number,
    player: PlayerState,
    qFloor = 0,
    opts: { isElite?: boolean; isBoss?: boolean } = {},
  ): LootResult {
    const items: { item: Item; quantity: number }[] = [];
    const scaledXp = Math.floor(baseXp * (1 + (enemyLevel - player.level) * 0.05));
    const gold = Math.floor(goldRange.min + Math.random() * (goldRange.max - goldRange.min));

    player.killsWithoutEpic++;
    player.killsWithoutLegendary++;
    player.totalKills++;

    let pityEpicForced   = player.killsWithoutEpic     >= PITY_EPIC;
    let pityLegendForced = player.killsWithoutLegendary >= PITY_LEGENDARY;

    for (const entry of entries) {
      const item = ALL_ITEMS[entry.itemId];
      if (!item) continue;

      let roll = Math.random();

      if (pityEpicForced && item.rarity === ItemRarity.EPIC) {
        roll = 0;
        pityEpicForced = false;
        player.killsWithoutEpic = 0;
      }
      if (pityLegendForced && item.rarity === ItemRarity.LEGENDARY) {
        roll = 0;
        pityLegendForced = false;
        player.killsWithoutLegendary = 0;
      }

      if (roll <= entry.dropRate) {
        const qty = Math.floor(Math.random() * (entry.maxQty - entry.minQty + 1)) + entry.minQty;
        const droppedItem = applyRandomElement(item);
        // StatRollSystem.rollItem est un no-op sûr (clone superficiel) pour tout
        // item non équipable ou sans equipRanges authoré — safe à appeler ici
        // inconditionnellement pour chaque type de drop.
        const rolledItem = StatRollSystem.rollItem(droppedItem, qFloor);
        items.push({ item: rolledItem, quantity: qty });

        if ([ItemRarity.EPIC, ItemRarity.LEGENDARY, ItemRarity.MYTHIC, ItemRarity.HIDDEN].includes(item.rarity)) {
          player.killsWithoutEpic = 0;
        }
        if ([ItemRarity.LEGENDARY, ItemRarity.MYTHIC, ItemRarity.HIDDEN].includes(item.rarity)) {
          player.killsWithoutLegendary = 0;
        }
      }
    }

    // ── World drop (catalogue générique) ──
    // Tiré APRÈS la table fixe, et compté dans la pity comme n'importe quel drop :
    // un LEGENDARY obtenu en world drop doit bien remettre le compteur à zéro,
    // sinon la pity finirait par en garantir un second juste derrière.
    const worldItem = LootSystem.rollWorldDrop(enemyLevel, !!opts.isElite, !!opts.isBoss);
    if (worldItem) {
      items.push({ item: StatRollSystem.rollItem(applyRandomElement(worldItem), qFloor), quantity: 1 });
      if ([ItemRarity.EPIC, ItemRarity.LEGENDARY, ItemRarity.MYTHIC, ItemRarity.HIDDEN].includes(worldItem.rarity)) {
        player.killsWithoutEpic = 0;
        pityEpicForced = false;
      }
      if ([ItemRarity.LEGENDARY, ItemRarity.MYTHIC, ItemRarity.HIDDEN].includes(worldItem.rarity)) {
        player.killsWithoutLegendary = 0;
        pityLegendForced = false;
      }
    }

    // Reset pity if no eligible item existed in this enemy's loot table
    if (pityEpicForced)   player.killsWithoutEpic      = 0;
    if (pityLegendForced) player.killsWithoutLegendary = 0;

    return { items, gold, xp: Math.max(1, scaledXp) };
  }

  /**
   * Taille du sac. Relevé de 60 à 150 : l'inventaire de départ contient déjà ~59
   * armes (ProgressionSystem.createNewPlayer), ce qui ne laissait littéralement
   * QU'UN slot libre pour tout le loot de la partie — chaque drop suivant était
   * refusé par addToInventory et silencieusement perdu.
   */
  static readonly MAX_SLOTS = 150;

  /**
   * @param ignoreCap Contourne le cap de slots. Réservé aux transferts NEUTRES en
   *   taille de sac — typiquement le retour en sac d'un équipement lors d'un swap
   *   (InventorySystem.equip retire d'abord le nouvel item du sac, donc rendre
   *   l'ancien ne fait pas grossir l'inventaire). Sans cette échappatoire, un sac
   *   plein faisait échouer le retour et l'ancien équipement était DÉTRUIT.
   */
  static addToInventory(
    player: PlayerState,
    item: Item,
    quantity: number,
    world?: WorldState,
    ignoreCap = false
  ): boolean {
    const atCap = !ignoreCap && player.inventory.length >= LootSystem.MAX_SLOTS;
    if (atCap && !('stackable' in item && (item as any).stackable)) {
      return false;
    }

    const existing = player.inventory.find(s => s.item.id === item.id);
    if (existing && 'stackable' in item && (item as any).stackable) {
      existing.quantity = Math.min(existing.quantity + quantity, (item as any).maxStack ?? 99);
      if (world) ArsenalSystem.discover(world, item.id);
      return true;
    }

    if (atCap) return false;
    if (!ignoreCap && player.inventory.length >= LootSystem.MAX_SLOTS) return false;
    player.inventory.push({ item, quantity });
    if (world) ArsenalSystem.discover(world, item.id);
    return true;
  }

  static removeFromInventory(
    player: PlayerState,
    itemId: string,
    quantity: number,
    instance?: Item,
  ): boolean {
    // `instance`, quand fourni, résout par IDENTITÉ (===) plutôt que par id —
    // deux armes non-stackables identiques ont chacune leur propre entrée
    // qty:1 avec des rolls différents (docs/design/LOOT_STAT_ROLLS.md §9 étape
    // 8) : un findIndex par itemId retomberait toujours sur la PREMIÈRE des
    // deux, pas forcément celle que l'appelant vise réellement. Sans instance
    // (cas des matériaux/consommables stackables, où il n'existe jamais qu'une
    // seule entrée par id), le comportement par itemId reste inchangé.
    const idx = instance
      ? player.inventory.findIndex(s => s.item === instance)
      : player.inventory.findIndex(s => s.item.id === itemId);
    if (idx === -1 || player.inventory[idx].quantity < quantity) return false;

    player.inventory[idx].quantity -= quantity;
    // splice CE slot précis — un filter par itemId supprimerait AUSSI les autres
    // stacks du même id (ex: deux armes non-stackables identiques, chacune sa
    // propre entrée qty:1 — équiper la première effacerait la seconde en silence).
    if (player.inventory[idx].quantity <= 0) {
      player.inventory.splice(idx, 1);
    }
    return true;
  }

  static getInventoryCount(player: PlayerState, itemId: string): number {
    return player.inventory.find(s => s.item.id === itemId)?.quantity ?? 0;
  }

  static rarityFromRoll(roll: number): ItemRarity {
    let cumulative = 0;
    const order = [
      ItemRarity.HIDDEN,
      ItemRarity.MYTHIC,
      ItemRarity.LEGENDARY,
      ItemRarity.EPIC,
      ItemRarity.RARE,
      ItemRarity.UNCOMMON,
      ItemRarity.COMMON,
    ];
    for (const rarity of order) {
      cumulative += RARITY_DROP_RATES[rarity];
      if (roll <= cumulative) return rarity;
    }
    return ItemRarity.COMMON;
  }
}
