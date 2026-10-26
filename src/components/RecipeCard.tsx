import React from 'react';
import { Clock, Users, MapPin, Utensils, Plus, Check } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  isSelected: boolean;
  onSelect: (recipe: Recipe) => void;
  compact?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, isSelected, onSelect, compact = false }) => {
  const getDietColor = (diet: string) => {
    switch (diet.toLowerCase()) {
      case 'vegetarian':
        return 'bg-green-100 text-green-800';
      case 'non vegetarian':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFlavorColor = (flavor: string) => {
    switch (flavor.toLowerCase()) {
      case 'spicy':
        return 'bg-red-100 text-red-700';
      case 'sweet':
        return 'bg-pink-100 text-pink-700';
      case 'bitter':
        return 'bg-yellow-100 text-yellow-700';
      case 'sour':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
        isSelected 
          ? 'border-orange-500 shadow-lg ring-2 ring-orange-200' 
          : 'border-gray-200 hover:border-orange-300'
      } ${compact ? 'p-4' : 'p-6'}`}
      onClick={() => onSelect(recipe)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-lg'} leading-tight`}>
          {recipe.name}
        </h3>
        <button
          className={`flex-shrink-0 ml-2 p-1.5 rounded-full transition-colors ${
            isSelected
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-500'
          }`}
        >
          {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      <div className={`flex flex-wrap gap-2 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className={`px-2 py-1 rounded-full font-medium ${getDietColor(recipe.diet)}`}>
          {recipe.diet}
        </span>
        <span className={`px-2 py-1 rounded-full font-medium ${getFlavorColor(recipe.flavorProfile)}`}>
          {recipe.flavorProfile}
        </span>
      </div>

      <div className={`grid grid-cols-2 gap-3 mb-3 ${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-1 text-gray-400" />
          <span>{recipe.prepTime + recipe.cookTime}m</span>
        </div>
        <div className="flex items-center">
          <Utensils className="h-4 w-4 mr-1 text-gray-400" />
          <span className="capitalize">{recipe.course}</span>
        </div>
        <div className="flex items-center col-span-2">
          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
          <span>{recipe.state}, {recipe.region}</span>
        </div>
      </div>

      {!compact && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">{recipe.ingredients.length} ingredients:</span>
          </p>
          <div className="flex flex-wrap gap-1">
            {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {ingredient.name}
              </span>
            ))}
            {recipe.ingredients.length > 3 && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{recipe.ingredients.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeCard;