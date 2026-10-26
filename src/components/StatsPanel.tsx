import React from 'react';
import { ChefHat, BookOpen, Package } from 'lucide-react';

interface StatsPanelProps {
  totalRecipes: number;
  selectedRecipes: number;
  totalIngredients: number;
}

const StatsPanel: React.FC<StatsPanelProps> = ({
  totalRecipes,
  selectedRecipes,
  totalIngredients
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Overview</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Total Recipes</p>
              <p className="text-xs text-gray-600">Available in database</p>
            </div>
          </div>
          <span className="text-xl font-bold text-blue-600">{totalRecipes}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ChefHat className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Selected</p>
              <p className="text-xs text-gray-600">Recipes chosen</p>
            </div>
          </div>
          <span className="text-xl font-bold text-orange-600">{selectedRecipes}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Ingredients</p>
              <p className="text-xs text-gray-600">Unique items needed</p>
            </div>
          </div>
          <span className="text-xl font-bold text-green-600">{totalIngredients}</span>
        </div>
      </div>

      {selectedRecipes > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900 mb-1">Shopping List Ready!</p>
            <p className="text-xs text-gray-600">
              Your ingredient calculator is updated with {totalIngredients} unique ingredients
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;