import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Search, 
  Filter,
  Eye,
  EyeOff,
  Package,
  Clock,
  DollarSign,
  Star,
  ChefHat,
  Utensils,
  AlertTriangle
} from 'lucide-react';
import { MenuItem, Ingredient } from '../types';

interface DishManagementProps {
  menuItems: MenuItem[];
  onUpdateMenuItem: (item: MenuItem) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onDeleteMenuItem: (id: number) => void;
  onToggleAvailability: (id: number, available: boolean) => void;
}

const DishManagement: React.FC<DishManagementProps> = ({
  menuItems,
  onUpdateMenuItem,
  onAddMenuItem,
  onDeleteMenuItem,
  onToggleAvailability
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newDish, setNewDish] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: 'main course',
    cuisine: 'North',
    diet: 'vegetarian',
    prepTime: 30,
    spiceLevel: 2,
    stock: 50,
    ingredients: [],
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
  });
  const [newIngredient, setNewIngredient] = useState<Ingredient>({
    name: '',
    amount: 0,
    unit: 'g'
  });

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'available' && item.stock > 0) ||
                          (statusFilter === 'unavailable' && item.stock === 0);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [menuItems, searchTerm, categoryFilter, statusFilter]);

  const categories = useMemo(() => {
    return ['all', ...new Set(menuItems.map(item => item.category))];
  }, [menuItems]);

  const handleAddIngredient = () => {
    if (newIngredient.name && newIngredient.amount > 0) {
      setNewDish(prev => ({
        ...prev,
        ingredients: [...(prev.ingredients || []), { ...newIngredient }]
      }));
      setNewIngredient({ name: '', amount: 0, unit: 'g' });
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setNewDish(prev => ({
      ...prev,
      ingredients: prev.ingredients?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSaveNewDish = () => {
    if (newDish.name && newDish.price && newDish.ingredients && newDish.ingredients.length > 0) {
      onAddMenuItem({
        ...newDish,
        rating: 4.0 + Math.random() * 0.8
      } as Omit<MenuItem, 'id'>);
      
      setNewDish({
        name: '',
        description: '',
        price: 0,
        category: 'main course',
        cuisine: 'North',
        diet: 'vegetarian',
        prepTime: 30,
        spiceLevel: 2,
        stock: 50,
        ingredients: [],
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'
      });
      setShowAddForm(false);
    }
  };

  const handleUpdateStock = (id: number, newStock: number) => {
    const item = menuItems.find(item => item.id === id);
    if (item) {
      onUpdateMenuItem({ ...item, stock: Math.max(0, newStock) });
    }
  };

  const handleUpdatePrice = (id: number, newPrice: number) => {
    const item = menuItems.find(item => item.id === id);
    if (item) {
      onUpdateMenuItem({ ...item, price: Math.max(0, newPrice) });
    }
  };

  const getStatusColor = (stock: number) => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock <= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (stock: number) => {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 10) return 'Low Stock';
    return 'Available';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dish Management</h2>
          <p className="text-gray-600">Manage menu items, pricing, and availability</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{menuItems.length}</div>
              <div className="text-sm text-gray-600">Total Dishes</div>
            </div>
            <ChefHat className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {menuItems.filter(item => item.stock > 0).length}
              </div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <Package className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {menuItems.filter(item => item.stock === 0).length}
              </div>
              <div className="text-sm text-gray-600">Out of Stock</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ₹{Math.round(menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length)}
              </div>
              <div className="text-sm text-gray-600">Avg Price</div>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search dishes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="unavailable">Out of Stock</option>
        </select>
      </div>

      {/* Dishes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="relative">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => onToggleAvailability(item.id, item.stock === 0)}
                  className={`p-2 rounded-full ${
                    item.stock > 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                  } text-white transition-colors`}
                  title={item.stock > 0 ? 'Mark as unavailable' : 'Mark as available'}
                >
                  {item.stock > 0 ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.stock)}`}>
                  {getStatusText(item.stock)}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <span>₹{item.price}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>{item.prepTime}m</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Package className="h-4 w-4 text-purple-500" />
                  <span>{item.stock} left</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{item.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Quick Controls */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 w-16">Price:</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 w-16">Stock:</label>
                  <input
                    type="number"
                    value={item.stock}
                    onChange={(e) => handleUpdateStock(item.id, parseInt(e.target.value) || 0)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => setEditingItem(item)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this dish?')) {
                      onDeleteMenuItem(item.id);
                    }
                  }}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Dish Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Add New Dish</h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dish Name</label>
                      <input
                        type="text"
                        value={newDish.name}
                        onChange={(e) => setNewDish(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter dish name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={newDish.price}
                        onChange={(e) => setNewDish(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newDish.description}
                      onChange={(e) => setNewDish(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter dish description"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newDish.category}
                        onChange={(e) => setNewDish(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="starter">Starter</option>
                        <option value="main course">Main Course</option>
                        <option value="dessert">Dessert</option>
                        <option value="snack">Snack</option>
                        <option value="bread">Bread</option>
                        <option value="soup">Soup</option>
                        <option value="breakfast">Breakfast</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Diet</label>
                      <select
                        value={newDish.diet}
                        onChange={(e) => setNewDish(prev => ({ ...prev, diet: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="vegetarian">Vegetarian</option>
                        <option value="non vegetarian">Non Vegetarian</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
                      <select
                        value={newDish.cuisine}
                        onChange={(e) => setNewDish(prev => ({ ...prev, cuisine: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="North">North Indian</option>
                        <option value="South">South Indian</option>
                        <option value="West">West Indian</option>
                        <option value="East">East Indian</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
                      <input
                        type="number"
                        value={newDish.prepTime}
                        onChange={(e) => setNewDish(prev => ({ ...prev, prepTime: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spice Level (1-5)</label>
                      <input
                        type="number"
                        value={newDish.spiceLevel}
                        onChange={(e) => setNewDish(prev => ({ ...prev, spiceLevel: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                      <input
                        type="number"
                        value={newDish.stock}
                        onChange={(e) => setNewDish(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Ingredients Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
                    <div className="border border-gray-300 rounded-lg p-4">
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <input
                          type="text"
                          value={newIngredient.name}
                          onChange={(e) => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
                          className="col-span-2 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="Ingredient name"
                        />
                        <input
                          type="number"
                          value={newIngredient.amount}
                          onChange={(e) => setNewIngredient(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                          className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          placeholder="Amount"
                          min="0"
                          step="0.1"
                        />
                        <div className="flex space-x-1">
                          <select
                            value={newIngredient.unit}
                            onChange={(e) => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))}
                            className="flex-1 px-2 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-sm"
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="l">l</option>
                            <option value="piece">piece</option>
                            <option value="cup">cup</option>
                            <option value="tbsp">tbsp</option>
                            <option value="tsp">tsp</option>
                          </select>
                          <button
                            type="button"
                            onClick={handleAddIngredient}
                            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {newDish.ingredients?.map((ingredient, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                            <span className="text-sm">
                              {ingredient.name} - {ingredient.amount}{ingredient.unit}
                            </span>
                            <button
                              onClick={() => handleRemoveIngredient(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleSaveNewDish}
                      disabled={!newDish.name || !newDish.price || !newDish.ingredients?.length}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Dish</span>
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DishManagement;