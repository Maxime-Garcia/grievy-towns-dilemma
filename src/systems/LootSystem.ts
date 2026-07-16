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
  // Un élément AUTHORÉ est intouchable. Le nom et le lore en dépendent : un
  // « Braquemart de Foudre » dont le lore parle de la foudre de Volterra ne doit pas
  // sortir en glace. Ça annulait aussi l'accord élément↔zone du générateur d'ennemis
  // (une lame de givre n'est attachée qu'aux monstres de Glaciem — pour rien, si le
  // drop la relookait au hasard) et faisait mentir ses substats ELEM_BONUS_PCT.
  // Le tirage ne concerne donc QUE les pièces sans élément propre.
  if (item.element && item.element !== ElementType.NEUTRAL) return item;

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
/**
 * Seuil de pitié MYTHIC — simulé, pas extrapolé.
 *
 * L'extrapolation naïve sur le ratio des taux (0,004 / 0,010 = 0,4 → 500 / 0,4 =
 * 1250) ignore que les tables FIXES des ennemis ne suivent PAS RARITY_DROP_RATES :
 * les ~139 créatures générées (enemiesGenerated.ts) portent des entrées
 * EPIC/LEGENDARY/MYTHIC à un taux moyen de ~11 % chacune (mesuré : EPIC 0,107,
 * LEGENDARY 0,108, MYTHIC 0,114 — quasiment IDENTIQUES entre elles, et proches du
 * taux RARE 0,113), pendant que les entrées COMMON/UNCOMMON restent, elles, sur
 * l'ancienne économie (0,266 / 0,227). Résultat mesuré sur 378 000 kills simulés
 * (rollLoot réel, ALL_ENEMIES réel, progression pondérée par spawnWeight à travers
 * les 7 zones) : la pitié EPIC (250) ne s'est déclenchée QUE 2 fois sur 27 171
 * obtentions d'Épique+ (rang ≈ p99,99 de l'écart naturel — un filet qui ne
 * mord quasiment jamais), la pitié LEGENDARY (500) 44 fois sur 15 605 (rang ≈
 * p99,6 — un filet qui mord occasionnellement, le comportement qu'on veut).
 *
 * MYTHIC calé sur ce DEUXIÈME rang (celui qui fonctionne réellement, pas celui
 * qui ne sert à rien) : la valeur d'écart naturel au rang p99,6 de la
 * distribution MYTHIC mesurée est ~1000-1060 (contre p99,99 ≈ 1400, l'équivalent
 * du comportement inerte d'EPIC). 1000 est aussi exactement 2× PITY_LEGENDARY,
 * qui est lui-même 2× PITY_EPIC — une progression cohérente et lisible au HUD,
 * ARRIVÉE PAR LA SIMULATION, pas choisie pour la forme.
 *
 * Pire cas observé sur les 378 000 kills : écart naturel maximal 1468-1627 selon
 * les runs — 1000 reste sous ce plafond (le filet peut donc réellement mordre
 * pour le joueur le plus malchanceux), sans être aussi lâche que les 250 d'EPIC.
 *
 * ⚠️ Constante posée mais PAS ENCORE câblée : `player.killsWithoutMythic`
 * n'existe pas dans PlayerState. Câblage prévu dans une passe séparée (même
 * schéma que killsWithoutEpic/killsWithoutLegendary dans rollLoot : incrément à
 * chaque kill, reset à 0 sur tout drop MYTHIC/HIDDEN, entrée dans le calcul
 * d'`owed` juste avant EPIC en priorité — LEGENDARY > MYTHIC > EPIC, la dette la
 * plus chère d'abord).
 */
const PITY_MYTHIC = 1000;

/** Source de vérité unique des seuils de pitié — consommée par PityScene (HUD) pour
 *  ne jamais dupliquer un seuil dans l'UI. Une rareté absente de cette table n'a
 *  pas de garantie (HIDDEN : uniques attachés à des boss précis, hors du pool
 *  générique `gen_*` du world drop, structurellement incompatible avec ce système). */
export const PITY_THRESHOLDS: Partial<Record<ItemRarity, number>> = {
  [ItemRarity.EPIC]: PITY_EPIC,
  [ItemRarity.LEGENDARY]: PITY_LEGENDARY,
  [ItemRarity.MYTHIC]: PITY_MYTHIC,
};

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
const WORLD_DROP_MIN_LEVEL: Record<ItemRarity, number> = {
  [ItemRarity.COMMON]: 1,
  [ItemRarity.UNCOMMON]: 3,
  [ItemRarity.RARE]: 6,
  [ItemRarity.EPIC]: 11,
  [ItemRarity.LEGENDARY]: 17,
  [ItemRarity.MYTHIC]: 24,
  // HIDDEN manquait : les deux filtres rejettent `min === undefined`, donc un item
  // HIDDEN ne pouvait JAMAIS tomber en world drop et son entrée dans le plancher de
  // rareté était du code mort. Sans effet aujourd'hui (le générateur n'en produit
  // plus aucun), mais un Hidden versé au pool plus tard serait resté inatteignable.
  [ItemRarity.HIDDEN]: 30,
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
  /** Raretés dont la dette de pitié a été PAYÉE ce kill-ci (roll forcé à 0, pas un
   *  drop chanceux) — sert uniquement à déclencher la notif « Garantie honorée ! »
   *  côté scène (LootSystem n'importe pas Phaser, cf. TalentSystem). */
  pityPaid: ItemRarity[];
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
  static rollWorldDrop(
    enemyLevel: number, isElite: boolean, isBoss: boolean,
    /**
     * Rareté DUE au titre de la pitié (cf. rollLoot). Quand elle est fournie, le
     * world drop est garanti et forcé sur cette rareté, SANS verrou de niveau
     * (cf. commentaire dans le corps de la fonction) : c'est la pitié qui paie.
     *
     * Elle ne payait pas, deux fois de suite :
     * 1. La pitié ne savait forcer un drop que si la table de butin FIXE de
     *    l'ennemi contenait justement un item de la rareté due — sur ALL_ENEMIES
     *    (196 ennemis, table fixe + ennemis générés), 132 n'ont aucun EPIC, 128
     *    aucun LEGENDARY, 145 aucun MYTHIC. Le pool générique du world drop existe
     *    pour ça (90 items par rareté, cf. getWorldPool()).
     * 2. Le world drop lui-même refusait de payer sous WORLD_DROP_MIN_LEVEL — un
     *    verrou pensé pour le tirage NORMAL (empêcher un ennemi trivial de lâcher
     *    du loot de fin de jeu par pure chance), mais qui s'appliquait AUSSI au
     *    paiement d'une dette déjà due, ce qui n'a plus de sens après 250+ kills
     *    sans rien recevoir. C'est le piège niveau 11 (`ember_wyrm`, zone Feu,
     *    niveau 8, aucun EPIC dans sa table) : retiré, cf. le corps de la fonction.
     */
    owedRarity?: ItemRarity,
  ): Item | null {
    const pool = getWorldPool();

    // Dette de pitié : drop garanti, rareté imposée. On court-circuite le tirage
    // de chance ET le tirage de rareté — ET, depuis cette passe, le verrou de
    // niveau (WORLD_DROP_MIN_LEVEL) aussi. Ce verrou reste appliqué plus bas, au
    // tirage NORMAL (non dû) : c'est lui qui empêche un rat de niveau 1 de lâcher
    // une arme de fin de jeu par pur coup de chance.
    //
    // Mais un PAIEMENT de dette n'est pas un coup de chance : le joueur vient de
    // tuer 250/500/1000 ennemis SANS RIEN recevoir de la rareté due. À ce stade,
    // le verrou de niveau ne protège plus rien — il PUNIT. C'était exactement le
    // piège niveau 11 : `ember_wyrm` (ennemi de base de la toute première zone,
    // niveau 8) n'a aucun EPIC dans sa table fixe ET son niveau est sous le
    // WORLD_DROP_MIN_LEVEL[EPIC]=11 — la dette ne pouvait jamais être payée par un
    // joueur qui grinderait cette zone, indéfiniment. Chiffré sur ALL_ENEMIES
    // (196 ennemis, cf. balance-agent, kills simulés 2026-07) : 35 ennemis sont
    // sous le niveau 11 (EPIC), 123 sous le niveau 17 (LEGENDARY), 170 sous le
    // niveau 24 (MYTHIC) — et parmi eux, 31 / 91 / 136 respectivement n'ont AUCUN
    // repli dans leur propre table fixe. Le contrat du pity
    // (docs/design/ROGUELITE_POC.md §4 : « tenu au kill près, sur TOUS les
    // ennemis ») ne tient pas tant qu'un seul de ces ennemis existe et peut être
    // le kill qui déclenche la dette.
    //
    // Ennemi trop bas pour la rareté due : la dette n'est PAS gelée, elle EST
    // payée, quel que soit le niveau — le pool générique a toujours du stock
    // (90 items par rareté, y compris MYTHIC, cf. getWorldPool()).
    if (owedRarity) {
      const owedPool = pool[owedRarity];
      if (owedPool?.length) {
        return owedPool[Math.floor(Math.random() * owedPool.length)]!;
      }
    }

    let chance = WORLD_DROP_CHANCE;
    if (isBoss) chance *= WORLD_DROP_BOSS_MULT;
    else if (isElite) chance *= WORLD_DROP_ELITE_MULT;
    // Clamp : sans lui, monter WORLD_DROP_CHANCE au-dessus de 0.25 rendrait le world
    // drop de boss silencieusement GARANTI (0.25 × 4 = 1.0), sans que rien ne le dise.
    chance = Math.min(1, chance);
    if (Math.random() > chance) return null;

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
    player.killsWithoutMythic++;
    player.totalKills++;

    const pityPaid: ItemRarity[] = [];

    let pityEpicForced   = player.killsWithoutEpic     >= PITY_EPIC;
    let pityLegendForced = player.killsWithoutLegendary >= PITY_LEGENDARY;
    let pityMythicForced = player.killsWithoutMythic    >= PITY_MYTHIC;

    for (const entry of entries) {
      const item = ALL_ITEMS[entry.itemId];
      if (!item) continue;

      let roll = Math.random();

      if (pityMythicForced && item.rarity === ItemRarity.MYTHIC) {
        roll = 0;
        pityMythicForced = false;
        player.killsWithoutMythic = 0;
        pityPaid.push(ItemRarity.MYTHIC);
      }
      if (pityEpicForced && item.rarity === ItemRarity.EPIC) {
        roll = 0;
        pityEpicForced = false;
        player.killsWithoutEpic = 0;
        pityPaid.push(ItemRarity.EPIC);
      }
      if (pityLegendForced && item.rarity === ItemRarity.LEGENDARY) {
        roll = 0;
        pityLegendForced = false;
        player.killsWithoutLegendary = 0;
        pityPaid.push(ItemRarity.LEGENDARY);
      }

      if (roll <= entry.dropRate) {
        const qty = Math.floor(Math.random() * (entry.maxQty - entry.minQty + 1)) + entry.minQty;
        const droppedItem = applyRandomElement(item);
        // StatRollSystem.rollItem est un no-op sûr (clone superficiel) pour tout
        // item non équipable ou sans equipRanges authoré — safe à appeler ici
        // inconditionnellement pour chaque type de drop.
        const rolledItem = StatRollSystem.rollItem(droppedItem, qFloor);
        items.push({ item: rolledItem, quantity: qty });

        // Remettre aussi les FLAGS locaux à false (pas seulement le compteur) :
        // sans ça, un ennemi dont la table fixe contient plusieurs raretés
        // (ex. pyrath_boss : LEGENDARY garanti + EPIC 25%) éteint la dette EPIC
        // via le premier item, mais pityEpicForced restait true — l'entrée EPIC
        // plus loin dans le tableau forçait ENCORE un roll à 0, payant la dette
        // une seconde fois pour rien (double-paiement trouvé en review).
        if ([ItemRarity.EPIC, ItemRarity.LEGENDARY, ItemRarity.MYTHIC, ItemRarity.HIDDEN].includes(item.rarity)) {
          player.killsWithoutEpic = 0;
          pityEpicForced = false;
        }
        if ([ItemRarity.LEGENDARY, ItemRarity.MYTHIC, ItemRarity.HIDDEN].includes(item.rarity)) {
          player.killsWithoutLegendary = 0;
          pityLegendForced = false;
        }
        if ([ItemRarity.MYTHIC, ItemRarity.HIDDEN].includes(item.rarity)) {
          player.killsWithoutMythic = 0;
          pityMythicForced = false;
        }
      }
    }

    // ── World drop (catalogue générique) ──
    // Tiré APRÈS la table fixe, et compté dans la pity comme n'importe quel drop :
    // un LEGENDARY obtenu en world drop doit bien remettre le compteur à zéro,
    // sinon la pity finirait par en garantir un second juste derrière.
    //
    // Si la table FIXE n'a pas pu honorer une dette de pitié (le cas courant : 132
    // ennemis sur 196 n'ont aucun EPIC dans leur table, 128 aucun LEGENDARY, 145
    // aucun MYTHIC), on la présente ICI. MYTHIC prime sur LEGENDARY, qui prime sur
    // EPIC : payer la dette la plus chère remet AUSSI les compteurs des raretés
    // inférieures à zéro (cf. les resets ci-dessous), donc payer la plus chère
    // d'abord résout plusieurs dettes en un seul item quand elles sont dues
    // simultanément — jamais l'inverse.
    const owed = pityMythicForced ? ItemRarity.MYTHIC
               : pityLegendForced ? ItemRarity.LEGENDARY
               : pityEpicForced   ? ItemRarity.EPIC
               : undefined;
    const worldItem = LootSystem.rollWorldDrop(enemyLevel, !!opts.isElite, !!opts.isBoss, owed);
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
      if ([ItemRarity.MYTHIC, ItemRarity.HIDDEN].includes(worldItem.rarity)) {
        player.killsWithoutMythic = 0;
        pityMythicForced = false;
      }
      // Un item de rareté INFÉRIEURE à `owed` ne peut sortir d'ici que si le pool
      // générique de `owed` était vide (cf. rollWorldDrop) — ce n'est alors pas un
      // paiement de la dette due, elle reste ouverte malgré cet item bonus.
      if (owed && worldItem.rarity === owed) pityPaid.push(owed);
    }

    // Une dette encore due ici n'est PAS effacée : le compteur reste à son niveau
    // et la pitié retentera au kill suivant. Le code remettait au contraire les
    // compteurs à zéro « si aucun item éligible n'existait dans la table » — il
    // détruisait donc 250 kills de progression sans rien donner en échange, à
    // chaque fois, sur la majorité des ennemis du jeu.
    //
    // Depuis le retrait du verrou de niveau sur le paiement (cf. rollWorldDrop),
    // le seul cas où une dette EPIC/LEGENDARY/MYTHIC reste due après ce kill est un
    // pool générique vide pour cette rareté — situation qui n'existe pas aujourd'hui
    // (90 items par rareté, cf. getWorldPool()) mais que le code ne suppose pas
    // impossible pour autant.

    return { items, gold, xp: Math.max(1, scaledXp), pityPaid };
  }

  /**
   * Taille du sac.
   *
   * Historique : 60, alors que l'inventaire de départ contient déjà ~59 armes
   * (ProgressionSystem.createNewPlayer) — il ne restait littéralement QU'UN slot
   * libre pour tout le loot de la partie.
   *
   * Puis 150 : encore insuffisant. Le jeu lâche désormais ~0,78 item/kill (table
   * fixe ~0,60 + world drop ~0,18), soit un sac plein en ~117 kills — avant même
   * d'avoir nettoyé la première zone. « Tout est lootable » se serait auto-saboté :
   * le joueur aurait passé la partie à voir ses drops refusés.
   *
   * 400 laisse de quoi jouer plusieurs zones avant d'avoir à faire le tri. La
   * grille d'inventaire est virtualisée (cf. InventoryScene.renderGrid), donc un
   * gros sac ne coûte plus rien à l'affichage — c'est ce qui rend ce cap tenable.
   */
  static readonly MAX_SLOTS = 400;

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
