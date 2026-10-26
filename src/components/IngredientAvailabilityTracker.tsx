import React, { useMemo } from 'react';
import { 
  Package, 
  TrendingDown, 
  AlertTriangle, 
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Download,
  Filter,
  Search,
  BarChart3,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Truck,
  DollarSign
} from 'lucide-react';
import { Order, MenuItem, InventoryItem } from '../types';

interface IngredientAvailabilityTrackerProps {
  orders: Order[];
  menuItems: MenuItem[];
  inventory: InventoryItem[];
}

interface IngredientConsumption {
  name: string;
  totalUsed: number;
  unit: string;
  currentStock: number;
  remainingStock: number;
  nextDayAvailability: number;
  status: 'sufficient' | 'low' | 'critical' | 'out-of-stock';
  affectedDishes: string[];
  dailyConsumption: number;
  daysUntilStockOut: number;
  weeklyConsumption: number;
  monthlyConsumption: number;
  recommendedPurchase: number;
  estimatedCost: number;
  supplier: string;
}

const IngredientAvailabilityTracker: React.FC<IngredientAvailabilityTrackerProps> = ({
  orders,
  menuItems,
  inventory
}) => {
  const ingredientAnalysis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Get today's orders
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= today && orderDate < tomorrow;
    });

    // Get weekly orders
    const weeklyOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= oneWeekAgo && orderDate < tomorrow;
    });

    // Get monthly orders
    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= oneMonthAgo && orderDate < tomorrow;
    });

    // Calculate ingredient consumption from today's orders
    const ingredientUsage = new Map<string, {
      totalUsed: number;
      unit: string;
      affectedDishes: Set<string>;
      weeklyUsed: number;
      monthlyUsed: number;
    }>();

    // Process today's consumption
    todayOrders.forEach(order => {
      order.items.forEach(item => {
        item.ingredients.forEach(ingredient => {
          const key = ingredient.name.toLowerCase();
          const totalAmount = ingredient.amount * item.quantity;
          
          if (ingredientUsage.has(key)) {
            const existing = ingredientUsage.get(key)!;
            existing.totalUsed += totalAmount;
            existing.affectedDishes.add(item.name);
          } else {
            ingredientUsage.set(key, {
              totalUsed: totalAmount,
              unit: ingredient.unit,
              affectedDishes: new Set([item.name]),
              weeklyUsed: 0,
              monthlyUsed: 0
            });
          }
        });
      });
    });

    // Process weekly consumption
    weeklyOrders.forEach(order => {
      order.items.forEach(item => {
        item.ingredients.forEach(ingredient => {
          const key = ingredient.name.toLowerCase();
          const totalAmount = ingredient.amount * item.quantity;
          
          if (ingredientUsage.has(key)) {
            ingredientUsage.get(key)!.weeklyUsed += totalAmount;
          } else {
            ingredientUsage.set(key, {
              totalUsed: 0,
              unit: ingredient.unit,
              affectedDishes: new Set(),
              weeklyUsed: totalAmount,
              monthlyUsed: 0
            });
          }
        });
      });
    });

    // Process monthly consumption
    monthlyOrders.forEach(order => {
      order.items.forEach(item => {
        item.ingredients.forEach(ingredient => {
          const key = ingredient.name.toLowerCase();
          const totalAmount = ingredient.amount * item.quantity;
          
          if (ingredientUsage.has(key)) {
            ingredientUsage.get(key)!.monthlyUsed += totalAmount;
          } else if (!ingredientUsage.has(key)) {
            ingredientUsage.set(key, {
              totalUsed: 0,
              unit: ingredient.unit,
              affectedDishes: new Set(),
              weeklyUsed: 0,
              monthlyUsed: totalAmount
            });
          }
        });
      });
    });

    // Calculate average daily consumption from all orders
    const allTimeConsumption = new Map<string, number>();
    const orderDays = new Set<string>();
    
    orders.forEach(order => {
      const dateKey = order.orderDate.toDateString();
      orderDays.add(dateKey);
      
      order.items.forEach(item => {
        item.ingredients.forEach(ingredient => {
          const key = ingredient.name.toLowerCase();
          const totalAmount = ingredient.amount * item.quantity;
          allTimeConsumption.set(key, (allTimeConsumption.get(key) || 0) + totalAmount);
        });
      });
    });

    const totalDays = Math.max(orderDays.size, 1);

    // Combine with inventory data
    const analysis: IngredientConsumption[] = [];

    // Process ingredients that were used
    const allIngredients = new Set([
      ...Array.from(ingredientUsage.keys()),
      ...inventory.map(item => item.name.toLowerCase())
    ]);

    allIngredients.forEach(ingredientKey => {
      const usage = ingredientUsage.get(ingredientKey);
      const inventoryItem = inventory.find(item => 
        item.name.toLowerCase() === ingredientKey
      );

      const currentStock = inventoryItem?.currentStock || 0;
      const todayUsed = usage?.totalUsed || 0;
      const weeklyUsed = usage?.weeklyUsed || 0;
      const monthlyUsed = usage?.monthlyUsed || 0;
      const remainingStock = Math.max(0, currentStock - todayUsed);
      const avgDailyConsumption = (allTimeConsumption.get(ingredientKey) || 0) / totalDays;
      const avgWeeklyConsumption = weeklyUsed / 7;
      const avgMonthlyConsumption = monthlyUsed / 30;
      
      // Calculate next day availability
      const nextDayAvailability = Math.max(0, remainingStock - avgDailyConsumption);
      
      let status: IngredientConsumption['status'] = 'sufficient';
      if (nextDayAvailability <= 0) status = 'out-of-stock';
      else if (nextDayAvailability <= avgDailyConsumption * 0.5) status = 'critical';
      else if (nextDayAvailability <= avgDailyConsumption) status = 'low';

      const daysUntilStockOut = avgDailyConsumption > 0 ? 
        Math.floor(remainingStock / avgDailyConsumption) : 999;

      // Calculate recommended purchase for next 7 days
      const weeklyNeed = avgDailyConsumption * 7;
      const recommendedPurchase = Math.max(0, weeklyNeed - remainingStock);
      const estimatedCost = recommendedPurchase * (inventoryItem?.costPerUnit || 1);

      if (todayUsed > 0 || currentStock > 0 || avgDailyConsumption > 0) {
        analysis.push({
          name: usage?.unit === 'piece' || usage?.unit === 'pieces' ? 
            ingredientKey.charAt(0).toUpperCase() + ingredientKey.slice(1) :
            ingredientKey.charAt(0).toUpperCase() + ingredientKey.slice(1),
          totalUsed: todayUsed,
          unit: usage?.unit || inventoryItem?.unit || 'g',
          currentStock,
          remainingStock,
          nextDayAvailability,
          status,
          affectedDishes: Array.from(usage?.affectedDishes || []),
          dailyConsumption: avgDailyConsumption,
          weeklyConsumption: avgWeeklyConsumption,
          monthlyConsumption: avgMonthlyConsumption,
          daysUntilStockOut,
          recommendedPurchase,
          estimatedCost,
          supplier: inventoryItem?.supplier || 'Unknown'
        });
      }
    });

    return analysis.sort((a, b) => {
      const statusOrder = { 'out-of-stock': 4, 'critical': 3, 'low': 2, 'sufficient': 1 };
      return statusOrder[b.status] - statusOrder[a.status];
    });
  }, [orders, menuItems, inventory]);

  const getStatusColor = (status: IngredientConsumption['status']) => {
    switch (status) {
      case 'sufficient': return 'bg-green-100 text-green-800 border-green-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'out-of-stock': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusIcon = (status: IngredientConsumption['status']) => {
    switch (status) {
      case 'sufficient': return <CheckCircle className="h-4 w-4" />;
      case 'low': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <TrendingDown className="h-4 w-4" />;
      case 'out-of-stock': return <XCircle className="h-4 w-4" />;
    }
  };

  const formatAmount = (amount: number, unit: string) => {
    if (amount === 0) return '0';
    if (unit === 'g' && amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}kg`;
    }
    if (unit === 'ml' && amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}L`;
    }
    return `${amount.toFixed(1)}${unit}`;
  };

  const stats = useMemo(() => {
    const sufficient = ingredientAnalysis.filter(item => item.status === 'sufficient').length;
    const low = ingredientAnalysis.filter(item => item.status === 'low').length;
    const critical = ingredientAnalysis.filter(item => item.status === 'critical').length;
    const outOfStock = ingredientAnalysis.filter(item => item.status === 'out-of-stock').length;
    const totalPurchaseCost = ingredientAnalysis.reduce((sum, item) => sum + item.estimatedCost, 0);
    const urgentPurchases = ingredientAnalysis.filter(item => item.status === 'critical' || item.status === 'out-of-stock').length;
    
    return { sufficient, low, critical, outOfStock, totalPurchaseCost, urgentPurchases };
  }, [ingredientAnalysis]);

  const purchaseList = ingredientAnalysis.filter(item => item.recommendedPurchase > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Ingredient Consumption & Availability Tracker</h3>
          <p className="text-gray-600">Real-time ingredient usage, stock levels, and purchase recommendations</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>Updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.sufficient}</div>
              <div className="text-sm text-green-800">Sufficient Stock</div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.low}</div>
              <div className="text-sm text-yellow-800">Low Stock</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-600">{stats.critical}</div>
              <div className="text-sm text-orange-800">Critical Level</div>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
              <div className="text-sm text-red-800">Out of Stock</div>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">₹{Math.round(stats.totalPurchaseCost)}</div>
              <div className="text-sm text-blue-800">Purchase Cost</div>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Purchase Recommendations */}
      {purchaseList.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              <div>
                <h4 className="text-lg font-semibold text-blue-900">Purchase Recommendations for Next 7 Days</h4>
                <p className="text-blue-700">{purchaseList.length} ingredients need restocking</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">₹{Math.round(stats.totalPurchaseCost)}</div>
              <div className="text-blue-700">Total estimated cost</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchaseList.slice(0, 6).map((ingredient, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-gray-900">{ingredient.name}</h5>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ingredient.status)}`}>
                    {ingredient.status.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Need to buy:</span>
                    <span className="font-medium text-red-600">{formatAmount(ingredient.recommendedPurchase, ingredient.unit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-medium">₹{ingredient.estimatedCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-medium text-blue-600">{ingredient.supplier}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {purchaseList.length > 6 && (
            <div className="mt-4 text-center">
              <span className="text-blue-700">+{purchaseList.length - 6} more ingredients need restocking</span>
            </div>
          )}
        </div>
      )}

      {/* Detailed Analysis */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">Detailed Ingredient Consumption Analysis</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingredient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Today's Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  After Today
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily/Weekly/Monthly Avg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Left
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Needed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ingredientAnalysis.map((ingredient, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {ingredient.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Used in: {ingredient.affectedDishes.slice(0, 2).join(', ')}
                          {ingredient.affectedDishes.length > 2 && ` +${ingredient.affectedDishes.length - 2}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ingredient.totalUsed > 0 ? (
                      <span className="font-medium text-orange-600">
                        -{formatAmount(ingredient.totalUsed, ingredient.unit)}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not used</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatAmount(ingredient.currentStock, ingredient.unit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${
                      ingredient.remainingStock <= 0 ? 'text-red-600' :
                      ingredient.remainingStock <= ingredient.dailyConsumption ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {formatAmount(ingredient.remainingStock, ingredient.unit)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                    <div>Daily: {formatAmount(ingredient.dailyConsumption, ingredient.unit)}</div>
                    <div>Weekly: {formatAmount(ingredient.weeklyConsumption, ingredient.unit)}</div>
                    <div>Monthly: {formatAmount(ingredient.monthlyConsumption, ingredient.unit)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className={`font-medium ${
                        ingredient.daysUntilStockOut <= 1 ? 'text-red-600' :
                        ingredient.daysUntilStockOut <= 3 ? 'text-orange-600' :
                        'text-gray-900'
                      }`}>
                        {ingredient.daysUntilStockOut > 30 ? '30+' : ingredient.daysUntilStockOut}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ingredient.status)}`}>
                      {getStatusIcon(ingredient.status)}
                      <span className="ml-1 capitalize">{ingredient.status.replace('-', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {ingredient.recommendedPurchase > 0 ? (
                      <div>
                        <div className="font-medium text-blue-600">
                          {formatAmount(ingredient.recommendedPurchase, ingredient.unit)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹{ingredient.estimatedCost.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not needed</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 text-gray-400 mr-1" />
                      {ingredient.supplier}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {ingredientAnalysis.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h4>
            <p className="text-gray-500">No orders or inventory data to analyze</p>
          </div>
        )}
      </div>

      {/* Critical Alerts */}
      {(stats.critical > 0 || stats.outOfStock > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h4 className="font-semibold text-red-800">Urgent Action Required</h4>
          </div>
          <div className="text-sm text-red-700">
            <p className="mb-2">
              {stats.outOfStock > 0 && `${stats.outOfStock} ingredients are out of stock. `}
              {stats.critical > 0 && `${stats.critical} ingredients are at critical levels. `}
            </p>
            <p className="mb-3">
              Recommended actions:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Place emergency orders for out-of-stock ingredients</li>
              <li>Contact suppliers for urgent delivery</li>
              <li>Consider temporarily removing affected dishes from menu</li>
              <li>Implement daily stock monitoring for critical ingredients</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientAvailabilityTracker;