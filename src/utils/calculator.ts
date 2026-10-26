import { Recipe, IngredientUsage } from '../types';

export const calculateIngredientUsage = (recipes: Recipe[], servings: number): IngredientUsage[] => {
  const ingredientMap = new Map<string, IngredientUsage>();
  
  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ingredient => {
      const key = ingredient.name.toLowerCase();
      
      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        existing.totalAmount += ingredient.amount;
        existing.usedInRecipes.push(recipe.name);
        existing.frequency += 1;
      } else {
        ingredientMap.set(key, {
          name: ingredient.name,
          totalAmount: ingredient.amount,
          unit: ingredient.unit,
          usedInRecipes: [recipe.name],
          frequency: 1
        });
      }
    });
  });
  
  return Array.from(ingredientMap.values());
};

export const formatIngredientAmount = (amount: number, unit: string): string => {
  if (amount < 1 && unit === 'g') {
    return `${(amount * 1000).toFixed(1)}mg`;
  }
  if (amount >= 1000 && unit === 'g') {
    return `${(amount / 1000).toFixed(2)}kg`;
  }
  return `${amount.toFixed(amount < 1 ? 2 : 1)}${unit}`;
};