import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Search, 
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  ShoppingCart,
  BarChart3
} from 'lucide-react';
import { InventoryItem, Order, MenuItem } from '../types';

interface IngredientManagementProps {
  inventory: InventoryItem[];
  orders: Order[];
  menuItems: MenuItem[];
  onUpdateInventory: (item: InventoryItem) => void;
  onAddInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  onDeleteInventoryItem: (id: string) => void;
}

interface UsageAnalytics {
  daily: { [key: string]: number };
  weekly: { [key: string]: number };
  monthly: { [key: string]: number };
  trending: 'up' | 'down' | 'stable';
  totalUsed: number;
  averageDaily: number;
}

const IngredientManagement: React.FC<IngredientManagementProps> = ({
  inventory,
  orders,
  menuItems,
  onUpdateInventory,
  onAddInventoryItem,
  onDeleteInventoryItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [newIngredient, setNewIngredient] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'other',
    currentStock: 0,
    unit: 'g',
    minThreshold: 10,
    maxCapacity: 100,
    costPerUnit: 1,
    supplier: '',
    usedInDishes: [],
    dailyConsumption: 0,
    status: 'in-stock'
  });

  // Calculate usage analytics for each ingredient
  const usageAnalytics = useMemo(() => {
    const analytics: { [key: string]: UsageAnalytics } = {};
    
    inventory.forEach(item => {
      const ingredientName = item.name.toLowerCase();
      const usage: UsageAnalytics = {
        daily: {},
        weekly: {},
        monthly: {},
        trending: 'stable',
        totalUsed: 0,
        averageDaily: 0
      };

      // Calculate usage from orders
      orders.forEach(order => {
        const orderDate = new Date(order.orderDate);
        const dateKey = orderDate.toISOString().split('T')[0];
        const weekKey = `${orderDate.getFullYear()}-W${Math.ceil(orderDate.getDate() / 7)}`;
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;

        order.items.forEach(orderItem => {
          orderItem.ingredients.forEach(ingredient => {
            if (ingredient.name.toLowerCase() === ingredientName) {
              const totalAmount = ingredient.amount * orderItem.quantity;
              
              usage.daily[dateKey] = (usage.daily[dateKey] || 0) + totalAmount;
              usage.weekly[weekKey] = (usage.weekly[weekKey] || 0) + totalAmount;
              usage.monthly[monthKey] = (usage.monthly[monthKey] || 0) + totalAmount;
              usage.totalUsed += totalAmount;
            }
          });
        });
      });

      // Calculate average daily usage
      const daysWithData = Object.keys(usage.daily).length;
      usage.averageDaily = daysWithData > 0 ? usage.totalUsed / daysWithData : 0;

      // Determine trending direction
      const recentDays = Object.keys(usage.daily).sort().slice(-7);
      const olderDays = Object.keys(usage.daily).sort().slice(-14, -7);
      
      if (recentDays.length > 0 && olderDays.length > 0) {
        const recentAvg = recentDays.reduce((sum, day) => sum + (usage.daily[day] || 0), 0) / recentDays.length;
        const olderAvg = olderDays.reduce((sum, day) => sum + (usage.daily[day] || 0), 0) / olderDays.length;
        
        if (recentAvg > olderAvg * 1.1) usage.trending = 'up';
        else if (recentAvg < olderAvg * 0.9) usage.trending = 'down';
      }

      analytics[item.id] = usage;
    });

    return analytics;
  }, [inventory, orders]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, searchTerm, categoryFilter, statusFilter]);

  const categories = useMemo(() => {
    return ['all', ...new Set(inventory.map(item => item.category))];
  }, [inventory]);

  const handleSaveNewIngredient = () => {
    if (newIngredient.name && newIngredient.supplier) {
      onAddInventoryItem({
        ...newIngredient,
        lastRestocked: new Date(),
        status: newIngredient.currentStock === 0 ? 'out-of-stock' : 
               newIngredient.currentStock! <= newIngredient.minThreshold! ? 'low-stock' : 'in-stock'
      } as Omit<InventoryItem, 'id'>);
      
      setNewIngredient({
        name: '',
        category: 'other',
        currentStock: 0,
        unit: 'g',
        minThreshold: 10,
        maxCapacity: 100,
        costPerUnit: 1,
        supplier: '',
        usedInDishes: [],
        dailyConsumption: 0,
        status: 'in-stock'
      });
      setShowAddForm(false);
    }
  };

  const handleUpdateStock = (id: string, newStock: number) => {
    const item = inventory.find(item => item.id === id);
    if (item) {
      const updatedItem = {
        ...item,
        currentStock: Math.max(0, newStock),
        lastRestocked: newStock > item.currentStock ? new Date() : item.lastRestocked,
        status: newStock === 0 ? 'out-of-stock' as const : 
               newStock <= item.minThreshold ? 'low-stock' as const : 'in-stock' as const
      };
      onUpdateInventory(updatedItem);
    }
  };

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendingIcon = (trending: 'up' | 'down' | 'stable') => {
    switch (trending) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: InventoryItem['category']) => {
    const icons = {
      spice: '🌶️',
      vegetable: '🥬',
      meat: '🍖',
      dairy: '🥛',
      grain: '🌾',
      oil: '🫒',
      other: '📦'
    };
    return icons[category] || '📦';
  };

  const inventoryStats = useMemo(() => {
    const totalItems = inventory.length;
    const inStock = inventory.filter(item => item.status === 'in-stock').length;
    const lowStock = inventory.filter(item => item.status === 'low-stock').length;
    const outOfStock = inventory.filter(item => item.status === 'out-of-stock').length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);
    
    return { totalItems, inStock, lowStock, outOfStock, totalValue };
  }, [inventory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ingredient Management</h2>
          <p className="text-gray-600">Manage inventory, track usage, and monitor stock levels</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Ingredient</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{inventoryStats.totalItems}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{inventoryStats.inStock}</div>
              <div className="text-sm text-gray-600">In Stock</div>
            </div>
            <Package className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStock}</div>
              <div className="text-sm text-gray-600">Low Stock</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</div>
              <div className="text-sm text-gray-600">Out of Stock</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">₹{inventoryStats.totalValue.toFixed(0)}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Usage Period:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Analytics</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map(item => {
                const analytics = usageAnalytics[item.id] || {
                  daily: {}, weekly: {}, monthly: {}, trending: 'stable' as const, totalUsed: 0, averageDaily: 0
                };
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{getCategoryIcon(item.category)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            Used in {item.usedInDishes.length} dishes
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={item.currentStock}
                          onChange={(e) => handleUpdateStock(item.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                          min="0"
                        />
                        <span className="text-sm text-gray-600">{item.unit}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Min: {item.minThreshold}{item.unit} | Max: {item.maxCapacity}{item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getTrendingIcon(analytics.trending)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {analytics.averageDaily.toFixed(1)}{item.unit}/day
                          </div>
                          <div className="text-xs text-gray-500">
                            Total used: {analytics.totalUsed.toFixed(1)}{item.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{item.costPerUnit}/{item.unit}</div>
                      <div className="text-xs text-gray-500">
                        Value: ₹{(item.currentStock * item.costPerUnit).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const newStock = prompt(`Enter new stock for ${item.name}:`, item.currentStock.toString());
                            if (newStock !== null) {
                              handleUpdateStock(item.id, parseInt(newStock) || 0);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                              onDeleteInventoryItem(item.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Ingredient Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Add New Ingredient</h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredient Name</label>
                    <input
                      type="text"
                      value={newIngredient.name}
                      onChange={(e) => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter ingredient name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newIngredient.category}
                        onChange={(e) => setNewIngredient(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="spice">Spice</option>
                        <option value="vegetable">Vegetable</option>
                        <option value="meat">Meat</option>
                        <option value="dairy">Dairy</option>
                        <option value="grain">Grain</option>
                        <option value="oil">Oil</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <select
                        value={newIngredient.unit}
                        onChange={(e) => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="g">Grams (g)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="ml">Milliliters (ml)</option>
                        <option value="l">Liters (l)</option>
                        <option value="piece">Pieces</option>
                        <option value="cup">Cups</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                      <input
                        type="number"
                        value={newIngredient.currentStock}
                        onChange={(e) => setNewIngredient(prev => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Threshold</label>
                      <input
                        type="number"
                        value={newIngredient.minThreshold}
                        onChange={(e) => setNewIngredient(prev => ({ ...prev, minThreshold: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
                      <input
                        type="number"
                        value={newIngredient.maxCapacity}
                        onChange={(e) => setNewIngredient(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit (₹)</label>
                      <input
                        type="number"
                        value={newIngredient.costPerUnit}
                        onChange={(e) => setNewIngredient(prev => ({ ...prev, costPerUnit: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                      <input
                        type="text"
                        value={newIngredient.supplier}
                        onChange={(e) => setNewIngredient(prev => ({ ...prev, supplier: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Supplier name"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleSaveNewIngredient}
                      disabled={!newIngredient.name || !newIngredient.supplier}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Ingredient</span>
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

export default IngredientManagement;