import React from 'react';
import { X, Leaf, Clock, Users, Scale } from 'lucide-react';
import { MenuItem } from '../types';

interface IngredientsModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number) => void;
}

const IngredientsModal: React.FC<IngredientsModalProps> = ({ 
  item, 
  isOpen, 
  onClose, 
  onAddToCart 
}) => {
  const [quantity, setQuantity] = React.useState(1);

  if (!isOpen || !item) return null;

  const handleAddToCart = () => {
    onAddToCart(item, quantity);
    onClose();
    setQuantity(1);
  };

  const getSpiceIndicator = (level: number) => {
    return '🌶️'.repeat(level);
  };

  const getDietBadgeColor = (diet: string) => {
    return diet === 'vegetarian' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getTotalWeight = () => {
    return item.ingredients.reduce((total, ingredient) => {
      if (ingredient.unit === 'g' || ingredient.unit === 'kg') {
        const weight = ingredient.unit === 'kg' ? ingredient.amount * 1000 : ingredient.amount;
        return total + weight;
      }
      return total;
    }, 0);
  };

  const formatAmount = (amount: number, unit: string) => {
    if (unit === 'kg' && amount < 1) {
      return `${(amount * 1000).toFixed(0)}g`;
    }
    if (unit === 'g' && amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}kg`;
    }
    return `${amount}${unit}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="relative">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-64 object-cover rounded-t-2xl"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDietBadgeColor(item.diet)}`}>
                {item.diet === 'vegetarian' ? '🌱 Vegetarian' : '🍖 Non-Vegetarian'}
              </span>
            </div>
          </div>

          <div className="p-6">
            {/* Title and Info */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{item.name}</h2>
              <p className="text-gray-600 mb-4">{item.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl font-bold text-orange-600">₹{item.price}</div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{item.prepTime} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{item.stock} servings left</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>Spice:</span>
                    <span>{getSpiceIndicator(item.spiceLevel)}</span>
                  </div>
                </div>
              </div>

              {/* Ingredient Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{item.ingredients.length}</div>
                  <div className="text-sm text-gray-600">Total Ingredients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{getTotalWeight()}g</div>
                  <div className="text-sm text-gray-600">Total Weight</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {item.ingredients.filter(i => i.unit === 'piece' || i.unit === 'pieces').length}
                  </div>
                  <div className="text-sm text-gray-600">Whole Items</div>
                </div>
              </div>
            </div>

            {/* Detailed Ingredients */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Leaf className="h-5 w-5 mr-2 text-green-500" />
                Complete Ingredients List
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 border-2 border-gray-100 hover:border-green-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm mb-1">
                          {ingredient.name}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Scale className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-medium text-orange-600">
                            {formatAmount(ingredient.amount, ingredient.unit)}
                          </span>
                        </div>
                      </div>
                      <div className="text-2xl">
                        {ingredient.unit === 'piece' || ingredient.unit === 'pieces' ? '🥄' : 
                         ingredient.name.toLowerCase().includes('spice') || ingredient.name.toLowerCase().includes('masala') ? '🌶️' :
                         ingredient.name.toLowerCase().includes('oil') ? '🫒' :
                         ingredient.name.toLowerCase().includes('salt') ? '🧂' :
                         ingredient.name.toLowerCase().includes('water') ? '💧' : '🥬'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nutritional Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Nutritional Highlights</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="text-center">
                  <div className="font-bold text-blue-700">Fresh</div>
                  <div className="text-blue-600">Daily Prepared</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-700">Authentic</div>
                  <div className="text-blue-600">Traditional Recipe</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-700">Quality</div>
                  <div className="text-blue-600">Premium Ingredients</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-700">Healthy</div>
                  <div className="text-blue-600">Balanced Nutrition</div>
                </div>
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      disabled={quantity <= 1}
                    >
                      <span className="text-lg font-medium">-</span>
                    </button>
                    <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(item.stock, quantity + 1))}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      disabled={quantity >= item.stock}
                    >
                      <span className="text-lg font-medium">+</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={item.stock === 0}
                  className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                    item.stock === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {item.stock === 0 ? 'Out of Stock' : `Add ₹${item.price * quantity} to Cart`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientsModal;