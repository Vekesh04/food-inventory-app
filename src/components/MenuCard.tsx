import React, { useState } from 'react';
import { Clock, Star, Plus, Minus, ShoppingCart, Info, Leaf } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity: number) => void;
  onViewIngredients: (item: MenuItem) => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, onAddToCart, onViewIngredients }) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    setIsAdding(true);
    onAddToCart(item, quantity);
    
    setTimeout(() => {
      setIsAdding(false);
      setQuantity(1);
    }, 500);
  };

  const getSpiceIndicator = (level: number) => {
    return '🌶️'.repeat(level);
  };

  const getDietBadgeColor = (diet: string) => {
    return diet === 'vegetarian' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStockStatus = () => {
    if (item.stock === 0) return { color: 'text-red-600', text: 'Out of Stock' };
    if (item.stock <= 10) return { color: 'text-orange-600', text: `Only ${item.stock} left!` };
    return { color: 'text-green-600', text: `${item.stock} servings available` };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDietBadgeColor(item.diet)}`}>
            {item.diet === 'vegetarian' ? '🌱 Veg' : '🍖 Non-Veg'}
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
            <span className="text-xs font-medium">{item.rating.toFixed(1)}</span>
          </div>
        </div>
        <button
          onClick={() => onViewIngredients(item)}
          className="absolute bottom-3 right-3 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full transition-colors shadow-lg"
          title="View Full Ingredients"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{item.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>
          
          {/* Ingredients Section */}
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center space-x-2 mb-2">
              <Leaf className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-800">
                Key Ingredients ({item.ingredients.length})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {item.ingredients.slice(0, 6).map((ingredient, index) => (
                <div key={index} className="text-xs text-green-700">
                  <span className="font-medium">{ingredient.name}</span>
                  <span className="text-green-600 ml-1">
                    ({ingredient.amount}{ingredient.unit})
                  </span>
                </div>
              ))}
              {item.ingredients.length > 6 && (
                <div className="text-xs text-green-600 font-medium col-span-2">
                  +{item.ingredients.length - 6} more ingredients...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{item.prepTime} min</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Spice:</span>
            <span>{getSpiceIndicator(item.spiceLevel)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-bold text-gray-900">
            ₹{item.price}
          </div>
          <div className={`text-sm font-medium ${stockStatus.color}`}>
            {stockStatus.text}
          </div>
        </div>

        {/* Quantity and Add to Cart */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4 text-gray-600" />
            </button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(item.stock, quantity + 1))}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              disabled={quantity >= item.stock}
            >
              <Plus className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={item.stock === 0 || isAdding}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
              item.stock === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isAdding
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-md hover:shadow-lg'
            }`}
          >
            {isAdding ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                <span>{item.stock === 0 ? 'Out of Stock' : 'Add'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;