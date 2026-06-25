import { PlayerState, CraftRecipe } from '../types';
import { ALL_ITEMS } from '../data/items';
import { LootSystem } from './LootSystem';

export type CraftResult =
  | { success: true;  itemId: string; itemName: string }
  | { success: false; reason: string };

export class CraftingSystem {

  static canCraft(player: PlayerState, recipe: CraftRecipe): CraftResult {
    if (player.level < recipe.levelRequired) {
      return { success: false, reason: `Niveau ${recipe.levelRequired} requis.` };
    }
    if (recipe.zoneRequired && !player.clearedZones.includes(recipe.zoneRequired)) {
      return { success: false, reason: `Zone ${recipe.zoneRequired} non explorée.` };
    }
    if (player.gold < recipe.goldCost) {
      return { success: false, reason: `${recipe.goldCost} or requis.` };
    }
    if (!ALL_ITEMS[recipe.resultItemId]) {
      return { success: false, reason: `Item résultat "${recipe.resultItemId}" introuvable.` };
    }
    for (const ingredient of recipe.ingredients) {
      const count = LootSystem.getInventoryCount(player, ingredient.itemId);
      if (count < ingredient.quantity) {
        const item = ALL_ITEMS[ingredient.itemId];
        const name = item?.name ?? ingredient.itemId;
        return { success: false, reason: `${name} ×${ingredient.quantity} manquant (possédé : ${count}).` };
      }
    }
    return { success: true, itemId: recipe.resultItemId, itemName: ALL_ITEMS[recipe.resultItemId].name };
  }

  static craft(player: PlayerState, recipe: CraftRecipe): CraftResult {
    const check = CraftingSystem.canCraft(player, recipe);
    if (!check.success) return check;

    // Consommer les ingrédients
    for (const ingredient of recipe.ingredients) {
      LootSystem.removeFromInventory(player, ingredient.itemId, ingredient.quantity);
    }
    player.gold -= recipe.goldCost;

    // Ajouter l'item crafté
    const resultItem = ALL_ITEMS[recipe.resultItemId];
    if (!resultItem) {
      return { success: false, reason: `Item résultat "${recipe.resultItemId}" introuvable.` };
    }
    LootSystem.addToInventory(player, resultItem, recipe.resultQuantity);

    return { success: true, itemId: recipe.resultItemId, itemName: resultItem.name };
  }

  // Filtre les recettes disponibles selon le type d'artisan
  static getRecipesForCraftType(
    recipes: CraftRecipe[],
    craftType: CraftRecipe['craftType']
  ): CraftRecipe[] {
    return recipes.filter(r => r.craftType === craftType);
  }

  // Recettes accessibles par le joueur (tous critères remplis)
  static getAvailableRecipes(
    player: PlayerState,
    recipes: CraftRecipe[],
    craftType: CraftRecipe['craftType']
  ): CraftRecipe[] {
    return CraftingSystem.getRecipesForCraftType(recipes, craftType).filter(r => {
      if (player.level < r.levelRequired) return false;
      if (r.zoneRequired && !player.clearedZones.includes(r.zoneRequired)) return false;
      return true;
    });
  }
}
