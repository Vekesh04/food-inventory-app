import React from 'react';
import { Calculator, Users, Scale, TrendingUp } from 'lucide-react';
import { IngredientUsage } from '../types';

interface IngredientCalculatorProps {
  ingredientUsage: IngredientUsage[];
  servings: number;
  onServingsChange: (servings: number) => void;
}

const IngredientCalculator: React.FC<IngredientCalculatorProps> = ({
  ingredientUsage,
  servings,
  onServingsChange
}) => {
  const formatAmount = (amount: number, unit: string) => {
    if (amount < 1 && unit === 'g') {
      return `${(amount * 1000).toFixed(1)}mg`;
    }
    if (amount >= 1000 && unit === 'g') {
      return `${(amount / 1000).toFixed(2)}kg`;
    }
    return `${amount.toFixed(amount < 1 ? 2 : 1)}${unit}`;
  };

  const getFrequencyColor = (frequency: number) => {
    if (frequency >= 3) return 'bg-red-100 text-red-700';
    if (frequency >= 2) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const sortedIngredients = [...ingredientUsage].sort((a, b) => b.frequency - a.frequency);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Calculator className="h-5 w-5 mr-2 text-orange-500" />
          Ingredient Calculator
        </h3>
      </div>

      <div className="p-4">
        {/* Servings Control */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="h-4 w-4 inline mr-1" />
            Servings
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onServingsChange(Math.max(1, servings - 1))}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-medium"
            >
              -
            </button>
            <span className="text-xl font-semibold text-gray-900 w-8 text-center">
              {servings}
            </span>
            <button
              onClick={() => onServingsChange(servings + 1)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-medium"
            >
              +
            </button>
          </div>
        </div>

        {/* Ingredients List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium text-gray-700">
            <span>Ingredient</span>
            <span>Amount</span>
          </div>
          
          {sortedIngredients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Scale className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Select recipes to see ingredients</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {sortedIngredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {ingredient.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getFrequencyColor(ingredient.frequency)}`}>
                        {ingredient.frequency}x
                      </span>
                    </div>
                    {ingredient.usedInRecipes.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Used in: {ingredient.usedInRecipes.slice(0, 2).join(', ')}
                        {ingredient.usedInRecipes.length > 2 && ` +${ingredient.usedInRecipes.length - 2} more`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">
                      {formatAmount(ingredient.totalAmount * servings, ingredient.unit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {ingredientUsage.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Total unique ingredients: {ingredientUsage.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IngredientCalculator;