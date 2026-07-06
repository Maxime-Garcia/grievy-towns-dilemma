/**
 * ItemAssets — Pure helpers for item texture key resolution.
 *
 * Zero Phaser imports — testable in isolation.
 *
 * Fallback chain:
 *   1. `item_<itemId>`   — per-item specific texture (baked in PreloaderScene)
 *   2. `item_type_<type>` — category-level fallback texture
 *   3. `item_type_generic` — last-resort fallback
 *
 * Usage in Phaser scenes:
 *   const key = itemTextureKey(item.id, item.type);
 *   if (this.textures.exists(key)) {
 *     sprite.setTexture(key);
 *   }
 */

import { ItemType } from '../types';

/**
 * Maps an ItemType enum value to its corresponding type-level fallback texture key.
 * These textures are generated procedurally in PreloaderScene.generateItemIcons().
 */
const TYPE_FALLBACK_KEYS: Record<ItemType, string> = {
  [ItemType.WEAPON]:     'item_type_weapon',
  [ItemType.HELM]:       'item_type_helm',
  [ItemType.CHEST]:      'item_type_chest',
  [ItemType.LEGS]:       'item_type_legs',
  [ItemType.BOOTS]:      'item_type_boots',
  [ItemType.GLOVES]:     'item_type_gloves',
  [ItemType.CAPE]:       'item_type_cape',
  [ItemType.RING]:       'item_type_ring',
  [ItemType.AMULET]:     'item_type_amulet',
  [ItemType.CONSUMABLE]: 'item_type_consumable',
  [ItemType.MATERIAL]:   'item_type_material',
  [ItemType.KEY_ITEM]:   'item_type_key_item',
  [ItemType.SKIN]:       'item_type_skin',
};

/**
 * Returns the preferred texture key for a given item.
 *
 * Pass a `textureExists` callback so this function stays pure (no Phaser reference):
 *
 * ```typescript
 * const key = itemTextureKey(item.id, item.type, k => this.textures.exists(k));
 * ```
 *
 * If no callback is supplied, returns the per-item key unconditionally (useful for
 * pre-generation passes where all textures will be created).
 */
export function itemTextureKey(
  itemId: string,
  itemType: ItemType,
  textureExists?: (key: string) => boolean,
): string {
  const specificKey = `item_${itemId}`;

  if (!textureExists) return specificKey;

  if (textureExists(specificKey)) return specificKey;

  const typeKey = TYPE_FALLBACK_KEYS[itemType];
  if (typeKey && textureExists(typeKey)) return typeKey;

  return 'item_type_generic';
}

/**
 * Returns the type-level fallback key for an ItemType, without checking
 * texture existence.  Useful during procedural generation to decide which
 * draw function to invoke.
 */
export function itemTypeFallbackKey(itemType: ItemType): string {
  return TYPE_FALLBACK_KEYS[itemType] ?? 'item_type_generic';
}
