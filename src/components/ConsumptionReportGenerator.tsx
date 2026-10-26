import React, { useState, useMemo } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  Calculator, 
  Leaf, 
  BarChart3, 
  PieChart,
  TrendingUp,
  Package,
  Scale,
  ChefHat,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  X,
  Calendar,
  Filter,
  Users,
  ShoppingBag
} from 'lucide-react';
import { cloudStorage } from '../utils/cloudStorage';

interface ConsumptionReport {
  totalOrders: number;
  totalDishes: number;
  dateRange: {
    from: string;
    to: string;
  };
  ingredientConsumption: {
    name: string;
    totalUsed: number;
    unit: string;
    usedInDishes: string[];
    frequency: number;
    costEstimate?: number;
    category?: string;
    dailyAverage: number;
    peakUsageDate: string;
    peakUsageAmount: number;
  }[];
  dishAnalysis: {
    name: string;
    totalQuantity: number;
    orders: number;
    revenue: number;
    ingredients: {
      name: string;
      totalAmount: number;
      unit: string;
    }[];
  }[];
  summary: {
    uniqueIngredients: number;
    totalIngredientWeight: number;
    mostUsedIngredient: string;
    leastUsedIngredient: string;
    averageIngredientsPerDish: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  dailyBreakdown: {
    date: string;
    orders: number;
    dishes: number;
    ingredients: { name: string; amount: number; unit: string }[];
  }[];
}

const ConsumptionReportGenerator: React.FC = () => {
  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [fromDate, setFromDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showReport, setShowReport] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get real data from cloud storage
  const cloudData = cloudStorage.getFromCloud();
  const { orders, payments } = cloudData;

  // Filter orders based on selected period
  const filteredOrders = useMemo(() => {
    let startDate: Date;
    let endDate = new Date(toDate + 'T23:59:59');

    switch (reportPeriod) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        startDate = new Date(fromDate + 'T00:00:00');
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
    }

    return orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, reportPeriod, fromDate, toDate]);

  // Generate comprehensive consumption report from real order data
  const consumptionReport = useMemo((): ConsumptionReport => {
    if (filteredOrders.length === 0) {
      return {
        totalOrders: 0,
        totalDishes: 0,
        dateRange: { from: fromDate, to: toDate },
        ingredientConsumption: [],
        dishAnalysis: [],
        summary: {
          uniqueIngredients: 0,
          totalIngredientWeight: 0,
          mostUsedIngredient: '',
          leastUsedIngredient: '',
          averageIngredientsPerDish: 0,
          totalRevenue: 0,
          averageOrderValue: 0
        },
        dailyBreakdown: []
      };
    }

    const ingredientMap = new Map<string, {
      totalUsed: number;
      unit: string;
      usedInDishes: Set<string>;
      frequency: number;
      dailyUsage: Map<string, number>;
      peakUsageDate: string;
      peakUsageAmount: number;
    }>();

    const dishMap = new Map<string, {
      totalQuantity: number;
      orders: number;
      revenue: number;
      ingredients: Map<string, { totalAmount: number; unit: string }>;
    }>();

    const dailyBreakdownMap = new Map<string, {
      orders: number;
      dishes: number;
      ingredients: Map<string, { amount: number; unit: string }>;
    }>();

    let totalDishes = 0;
    let totalRevenue = 0;

    // Process all filtered orders
    filteredOrders.forEach(order => {
      const orderDate = order.orderDate.toISOString().split('T')[0];
      totalRevenue += order.total;

      // Initialize daily breakdown
      if (!dailyBreakdownMap.has(orderDate)) {
        dailyBreakdownMap.set(orderDate, {
          orders: 0,
          dishes: 0,
          ingredients: new Map()
        });
      }
      const dailyData = dailyBreakdownMap.get(orderDate)!;
      dailyData.orders += 1;

      order.items.forEach(item => {
        totalDishes += item.quantity;
        dailyData.dishes += item.quantity;

        // Track dish analysis
        if (dishMap.has(item.name)) {
          const existing = dishMap.get(item.name)!;
          existing.totalQuantity += item.quantity;
          existing.orders += 1;
          existing.revenue += item.price * item.quantity;
        } else {
          dishMap.set(item.name, {
            totalQuantity: item.quantity,
            orders: 1,
            revenue: item.price * item.quantity,
            ingredients: new Map()
          });
        }

        const dishData = dishMap.get(item.name)!;

        // Process ingredients
        item.ingredients.forEach(ingredient => {
          const totalAmount = ingredient.amount * item.quantity;
          const key = ingredient.name.toLowerCase();

          // Track ingredient consumption
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            existing.totalUsed += totalAmount;
            existing.usedInDishes.add(item.name);
            existing.frequency += item.quantity;
            
            // Track daily usage
            const currentDayUsage = existing.dailyUsage.get(orderDate) || 0;
            existing.dailyUsage.set(orderDate, currentDayUsage + totalAmount);
            
            // Update peak usage
            if (totalAmount > existing.peakUsageAmount) {
              existing.peakUsageAmount = totalAmount;
              existing.peakUsageDate = orderDate;
            }
          } else {
            const dailyUsage = new Map<string, number>();
            dailyUsage.set(orderDate, totalAmount);
            
            ingredientMap.set(key, {
              totalUsed: totalAmount,
              unit: ingredient.unit,
              usedInDishes: new Set([item.name]),
              frequency: item.quantity,
              dailyUsage,
              peakUsageDate: orderDate,
              peakUsageAmount: totalAmount
            });
          }

          // Track dish ingredients
          if (dishData.ingredients.has(key)) {
            const existing = dishData.ingredients.get(key)!;
            existing.totalAmount += totalAmount;
          } else {
            dishData.ingredients.set(key, {
              totalAmount: totalAmount,
              unit: ingredient.unit
            });
          }

          // Track daily breakdown ingredients
          if (dailyData.ingredients.has(key)) {
            const existing = dailyData.ingredients.get(key)!;
            existing.amount += totalAmount;
          } else {
            dailyData.ingredients.set(key, {
              amount: totalAmount,
              unit: ingredient.unit
            });
          }
        });
      });
    });

    // Calculate number of days for averages
    const dayCount = Math.max(1, Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)));

    // Convert maps to arrays
    const ingredientConsumption = Array.from(ingredientMap.entries()).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      totalUsed: data.totalUsed,
      unit: data.unit,
      usedInDishes: Array.from(data.usedInDishes),
      frequency: data.frequency,
      category: getIngredientCategory(name),
      dailyAverage: data.totalUsed / dayCount,
      peakUsageDate: data.peakUsageDate,
      peakUsageAmount: data.peakUsageAmount
    })).sort((a, b) => b.totalUsed - a.totalUsed);

    const dishAnalysis = Array.from(dishMap.entries()).map(([name, data]) => ({
      name,
      totalQuantity: data.totalQuantity,
      orders: data.orders,
      revenue: data.revenue,
      ingredients: Array.from(data.ingredients.entries()).map(([ingName, ingData]) => ({
        name: ingName.charAt(0).toUpperCase() + ingName.slice(1),
        totalAmount: ingData.totalAmount,
        unit: ingData.unit
      }))
    })).sort((a, b) => b.totalQuantity - a.totalQuantity);

    const dailyBreakdown = Array.from(dailyBreakdownMap.entries()).map(([date, data]) => ({
      date,
      orders: data.orders,
      dishes: data.dishes,
      ingredients: Array.from(data.ingredients.entries()).map(([name, ingData]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        amount: ingData.amount,
        unit: ingData.unit
      })).sort((a, b) => b.amount - a.amount)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate summary
    const totalWeight = ingredientConsumption
      .filter(ing => ing.unit === 'g' || ing.unit === 'kg')
      .reduce((sum, ing) => {
        const weight = ing.unit === 'kg' ? ing.totalUsed * 1000 : ing.totalUsed;
        return sum + weight;
      }, 0);

    const mostUsed = ingredientConsumption[0]?.name || '';
    const leastUsed = ingredientConsumption[ingredientConsumption.length - 1]?.name || '';
    const avgIngredientsPerDish = dishAnalysis.length > 0 
      ? dishAnalysis.reduce((sum, dish) => sum + dish.ingredients.length, 0) / dishAnalysis.length 
      : 0;

    return {
      totalOrders: filteredOrders.length,
      totalDishes,
      dateRange: { from: fromDate, to: toDate },
      ingredientConsumption,
      dishAnalysis,
      summary: {
        uniqueIngredients: ingredientConsumption.length,
        totalIngredientWeight: totalWeight,
        mostUsedIngredient: mostUsed,
        leastUsedIngredient: leastUsed,
        averageIngredientsPerDish: Math.round(avgIngredientsPerDish * 10) / 10,
        totalRevenue,
        averageOrderValue: filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0
      },
      dailyBreakdown
    };
  }, [filteredOrders, fromDate, toDate]);

  const getIngredientCategory = (name: string): string => {
    const spices = ['cumin', 'coriander', 'turmeric', 'chili', 'garam masala', 'cardamom', 'cinnamon', 'cloves', 'bay leaves', 'mustard seeds', 'fenugreek', 'asafoetida'];
    const vegetables = ['onion', 'tomato', 'garlic', 'ginger', 'potato', 'carrot', 'peas', 'spinach', 'cauliflower', 'bell pepper', 'green chili', 'curry leaves'];
    const proteins = ['chicken', 'mutton', 'fish', 'paneer', 'prawns', 'lamb', 'beef'];
    const dairy = ['milk', 'yogurt', 'cream', 'butter', 'ghee', 'cheese'];
    const grains = ['rice', 'wheat', 'flour', 'lentils', 'chickpeas', 'kidney beans', 'black gram'];
    const oils = ['oil', 'coconut oil', 'mustard oil', 'ghee'];

    const lowerName = name.toLowerCase();
    if (spices.some(spice => lowerName.includes(spice))) return 'Spices';
    if (vegetables.some(veg => lowerName.includes(veg))) return 'Vegetables';
    if (proteins.some(protein => lowerName.includes(protein))) return 'Proteins';
    if (dairy.some(d => lowerName.includes(d))) return 'Dairy';
    if (grains.some(grain => lowerName.includes(grain))) return 'Grains';
    if (oils.some(oil => lowerName.includes(oil))) return 'Oils';
    return 'Other';
  };

  // Filter ingredients by category
  const filteredIngredients = useMemo(() => {
    if (selectedCategory === 'all') {
      return consumptionReport.ingredientConsumption;
    }
    return consumptionReport.ingredientConsumption.filter(ing => 
      ing.category === selectedCategory
    );
  }, [consumptionReport.ingredientConsumption, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(consumptionReport.ingredientConsumption.map(ing => ing.category));
    return ['all', ...Array.from(cats)];
  }, [consumptionReport.ingredientConsumption]);

  const generateReport = () => {
    setShowReport(true);
  };

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      period: reportPeriod,
      dateRange: consumptionReport.dateRange,
      summary: consumptionReport.summary,
      ingredientConsumption: consumptionReport.ingredientConsumption,
      dishAnalysis: consumptionReport.dishAnalysis,
      dailyBreakdown: consumptionReport.dailyBreakdown
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consumption-report-${reportPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const csvContent = [
      'Ingredient,Total Used,Unit,Category,Daily Average,Peak Usage Date,Peak Amount,Used In Dishes,Frequency',
      ...consumptionReport.ingredientConsumption.map(ing => 
        `"${ing.name}",${ing.totalUsed},"${ing.unit}","${ing.category}",${ing.dailyAverage.toFixed(2)},"${ing.peakUsageDate}",${ing.peakUsageAmount},"${ing.usedInDishes.join('; ')}",${ing.frequency}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ingredient-consumption-${reportPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatAmount = (amount: number, unit: string) => {
    if (unit === 'g' && amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}kg`;
    }
    if (unit === 'ml' && amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}L`;
    }
    return `${amount.toFixed(1)}${unit}`;
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          <Calculator className="h-8 w-8 inline mr-3 text-blue-600" />
          Consumption Report from Order History
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Analyze ingredient consumption based on your actual order history
        </p>
      </div>

      {/* Period Selection */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Report Period</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setReportPeriod('today')}
            className={`p-4 rounded-lg border-2 transition-all ${
              reportPeriod === 'today' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">Today</div>
            <div className="text-sm text-gray-500">Current day</div>
          </button>
          <button
            onClick={() => setReportPeriod('week')}
            className={`p-4 rounded-lg border-2 transition-all ${
              reportPeriod === 'week' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">Last 7 Days</div>
            <div className="text-sm text-gray-500">Weekly report</div>
          </button>
          <button
            onClick={() => setReportPeriod('month')}
            className={`p-4 rounded-lg border-2 transition-all ${
              reportPeriod === 'month' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">Last 30 Days</div>
            <div className="text-sm text-gray-500">Monthly report</div>
          </button>
          <button
            onClick={() => setReportPeriod('custom')}
            className={`p-4 rounded-lg border-2 transition-all ${
              reportPeriod === 'custom' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Filter className="h-6 w-6 mx-auto mb-2" />
            <div className="font-medium">Custom Range</div>
            <div className="text-sm text-gray-500">Select dates</div>
          </button>
        </div>

        {/* Custom Date Range */}
        {reportPeriod === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <strong>Available Orders:</strong> {orders.length} total orders in system
          </div>
          <button
            onClick={generateReport}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Calculator className="h-4 w-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Consumption Report */}
      {showReport && (
        <div className="space-y-8">
          {/* Report Header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Consumption Report</h2>
                <p className="text-green-100">
                  Period: {reportPeriod === 'custom' ? 
                    `${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}` :
                    reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)
                  } • {filteredOrders.length} orders analyzed
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={exportReport}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-500">No orders found for the selected period. Try selecting a different date range.</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{consumptionReport.totalOrders}</div>
                      <div className="text-sm text-gray-600">Total Orders</div>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{consumptionReport.totalDishes}</div>
                      <div className="text-sm text-gray-600">Total Dishes</div>
                    </div>
                    <ChefHat className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{consumptionReport.summary.uniqueIngredients}</div>
                      <div className="text-sm text-gray-600">Unique Ingredients</div>
                    </div>
                    <Leaf className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {(consumptionReport.summary.totalIngredientWeight / 1000).toFixed(1)}kg
                      </div>
                      <div className="text-sm text-gray-600">Total Weight</div>
                    </div>
                    <Scale className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(consumptionReport.summary.totalRevenue)}
                      </div>
                      <div className="text-sm text-gray-600">Total Revenue</div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Filter by Category</h3>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ingredient Consumption Table */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Leaf className="h-5 w-5 mr-2 text-green-600" />
                    Ingredient Consumption Analysis
                    {selectedCategory !== 'all' && (
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        ({selectedCategory} - {filteredIngredients.length} ingredients)
                      </span>
                    )}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Used</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Average</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peak Usage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used In Dishes</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredIngredients.map((ingredient, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Package className="h-5 w-5 text-gray-400 mr-3" />
                              <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatAmount(ingredient.totalUsed, ingredient.unit)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatAmount(ingredient.dailyAverage, ingredient.unit)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatAmount(ingredient.peakUsageAmount, ingredient.unit)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(ingredient.peakUsageDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {ingredient.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ingredient.frequency}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {ingredient.usedInDishes.slice(0, 3).join(', ')}
                              {ingredient.usedInDishes.length > 3 && (
                                <span className="text-gray-500"> +{ingredient.usedInDishes.length - 3} more</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daily Breakdown */}
              {consumptionReport.dailyBreakdown.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                      Daily Breakdown
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {consumptionReport.dailyBreakdown.map((day, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                              {new Date(day.date).toLocaleDateString()}
                            </h4>
                            <div className="text-sm text-gray-500">
                              {day.orders} orders • {day.dishes} dishes
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {day.ingredients.slice(0, 6).map((ingredient, ingIndex) => (
                              <div key={ingIndex} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                <span className="text-gray-700">{ingredient.name}</span>
                                <span className="font-medium text-gray-900">
                                  {formatAmount(ingredient.amount, ingredient.unit)}
                                </span>
                              </div>
                            ))}
                            {day.ingredients.length > 6 && (
                              <div className="text-sm text-gray-500 p-2">
                                +{day.ingredients.length - 6} more ingredients
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Insights */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Key Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium text-gray-900">Most Used Ingredient</div>
                        <div className="text-sm text-gray-600">{consumptionReport.summary.mostUsedIngredient}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="font-medium text-gray-900">Least Used Ingredient</div>
                        <div className="text-sm text-gray-600">{consumptionReport.summary.leastUsedIngredient}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-gray-900">Average Ingredients per Dish</div>
                        <div className="text-sm text-gray-600">{consumptionReport.summary.averageIngredientsPerDish}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="font-medium text-gray-900">Average Order Value</div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(consumptionReport.summary.averageOrderValue)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsumptionReportGenerator;