import React, { useState, useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  TrendingDown, 
  Calendar,
  Search,
  Filter,
  Download,
  Plus,
  Minus,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { InventoryItem, PurchaseRecommendation } from '../types';

interface InventoryManagementProps {
  inventory: InventoryItem[];
  recommendations: PurchaseRecommendation[];
  onUpdateStock: (itemId: string, newStock: number) => void;
  onPurchaseOrder: (recommendations: PurchaseRecommendation[]) => void;
}

const InventoryManagement: React.FC<InventoryManagementProps> = ({
  inventory,
  recommendations,
  onUpdateStock,
  onPurchaseOrder
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'recommendations' | 'purchase'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventory, searchTerm, categoryFilter, statusFilter]);

  const inventoryStats = useMemo(() => {
    const totalItems = inventory.length;
    const inStock = inventory.filter(item => item.status === 'in-stock').length;
    const lowStock = inventory.filter(item => item.status === 'low-stock').length;
    const outOfStock = inventory.filter(item => item.status === 'out-of-stock').length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);
    
    return { totalItems, inStock, lowStock, outOfStock, totalValue };
  }, [inventory]);

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: PurchaseRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handleRecommendationToggle = (id: string) => {
    setSelectedRecommendations(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectedRecommendationItems = recommendations.filter(rec => 
    selectedRecommendations.includes(rec.ingredientId)
  );

  const totalPurchaseCost = selectedRecommendationItems.reduce((sum, rec) => sum + rec.estimatedCost, 0);

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value={inventoryStats.totalItems}
          subtitle={`${inventoryStats.inStock} in stock`}
          icon={Package}
          color="text-blue-600"
        />
        <StatCard
          title="Low Stock Items"
          value={inventoryStats.lowStock}
          subtitle="Need restocking"
          icon={AlertTriangle}
          color="text-yellow-600"
        />
        <StatCard
          title="Out of Stock"
          value={inventoryStats.outOfStock}
          subtitle="Immediate attention"
          icon={XCircle}
          color="text-red-600"
        />
        <StatCard
          title="Inventory Value"
          value={`₹${inventoryStats.totalValue.toLocaleString()}`}
          subtitle="Current stock value"
          icon={DollarSign}
          color="text-green-600"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'recommendations', label: 'Purchase Recommendations', icon: ShoppingCart },
            { id: 'purchase', label: 'Purchase Orders', icon: DollarSign }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-slate-500 text-slate-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {tab.id === 'recommendations' && recommendations.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {recommendations.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="spice">Spices</option>
                <option value="vegetable">Vegetables</option>
                <option value="meat">Meat</option>
                <option value="dairy">Dairy</option>
                <option value="grain">Grains</option>
                <option value="oil">Oils</option>
                <option value="other">Other</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Threshold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Usage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map(item => (
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
                        <span className="capitalize text-sm text-gray-900">{item.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.currentStock}{item.unit}
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹{(item.currentStock * item.costPerUnit).toFixed(2)} value
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.minThreshold}{item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.dailyConsumption}{item.unit}/day
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
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onUpdateStock(item.id, Math.max(0, item.currentStock - 10))}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onUpdateStock(item.id, item.currentStock + 10)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Purchase Recommendations ({recommendations.length})
            </h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {selectedRecommendations.length} selected
              </span>
              <button
                onClick={() => setSelectedRecommendations(recommendations.map(r => r.ingredientId))}
                className="text-sm text-slate-600 hover:text-slate-800"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedRecommendations([])}
                className="text-sm text-slate-600 hover:text-slate-800"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {recommendations.map(rec => (
              <div
                key={rec.ingredientId}
                className={`bg-white rounded-xl shadow-lg border-2 p-6 cursor-pointer transition-all ${
                  selectedRecommendations.includes(rec.ingredientId)
                    ? 'border-slate-500 ring-2 ring-slate-200'
                    : 'border-gray-200 hover:border-slate-300'
                }`}
                onClick={() => handleRecommendationToggle(rec.ingredientId)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{rec.ingredientName}</h4>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                      {rec.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedRecommendations.includes(rec.ingredientId)}
                    onChange={() => handleRecommendationToggle(rec.ingredientId)}
                    className="h-5 w-5 text-slate-600 rounded"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Stock:</span>
                    <span className="font-medium">{rec.currentStock}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Recommended:</span>
                    <span className="font-medium text-green-600">+{rec.recommendedQuantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Cost:</span>
                    <span className="font-medium">₹{rec.estimatedCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Days Until Stock Out:</span>
                    <span className={`font-medium ${rec.daysUntilStockOut <= 3 ? 'text-red-600' : 'text-gray-900'}`}>
                      {rec.daysUntilStockOut} days
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                  <div className="text-xs text-gray-500">
                    Affects: {rec.affectedDishes.slice(0, 2).join(', ')}
                    {rec.affectedDishes.length > 2 && ` +${rec.affectedDishes.length - 2} more`}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedRecommendations.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Purchase Summary</h4>
                  <p className="text-sm text-gray-600">
                    {selectedRecommendations.length} items selected
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">₹{totalPurchaseCost.toFixed(2)}</div>
                  <button
                    onClick={() => onPurchaseOrder(selectedRecommendationItems)}
                    className="mt-2 px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Create Purchase Order
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Purchase Orders Tab */}
      {activeTab === 'purchase' && (
        <div className="space-y-6">
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Purchase Orders</h3>
            <p className="text-gray-500">Purchase order management coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;