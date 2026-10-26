import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package,
  BarChart3,
  PieChart,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Leaf,
  Scale,
  ChefHat,
  CalendarDays,
  RefreshCw
} from 'lucide-react';
import { Order, Payment, User, InventoryItem } from '../types';

interface DateWiseAnalyticsProps {
  orders: Order[];
  payments: Payment[];
  users: User[];
  inventory: InventoryItem[];
}

interface DailyData {
  date: string;
  orders: number;
  revenue: number;
  customers: number;
  topDishes: { name: string; quantity: number }[];
  ingredientsUsed: { name: string; quantity: number; unit: string }[];
}

interface IngredientUsageData {
  name: string;
  unit: string;
  dailyUsage: { [date: string]: number };
  weeklyUsage: { [week: string]: number };
  monthlyUsage: { [month: string]: number };
  totalUsage: number;
  averageDaily: number;
  averageWeekly: number;
  averageMonthly: number;
  trend: 'up' | 'down' | 'stable';
  usedInDishes: string[];
  peakUsageDate: string;
  peakUsageAmount: number;
}

const DateWiseAnalytics: React.FC<DateWiseAnalyticsProps> = ({
  orders,
  payments,
  users,
  inventory
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days' | 'custom'>('30days');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [ingredientAnalysisPeriod, setIngredientAnalysisPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedIngredient, setSelectedIngredient] = useState<string>('all');
  
  // Date range states
  const [fromDate, setFromDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showDateRange, setShowDateRange] = useState(false);

  // Filter orders and payments based on date range
  const filteredOrdersAndPayments = useMemo(() => {
    let startDate: Date;
    let endDate = new Date(toDate + 'T23:59:59');

    if (selectedPeriod === 'custom') {
      startDate = new Date(fromDate + 'T00:00:00');
    } else {
      const days = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
    }

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= startDate && orderDate <= endDate;
    });

    const filteredPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate >= startDate && paymentDate <= endDate;
    });

    return { filteredOrders, filteredPayments, startDate, endDate };
  }, [orders, payments, selectedPeriod, fromDate, toDate]);

  // Generate comprehensive ingredient usage analysis with date filtering
  const ingredientUsageAnalysis = useMemo(() => {
    const ingredientMap = new Map<string, IngredientUsageData>();
    const { filteredOrders } = filteredOrdersAndPayments;
    
    // Process filtered orders to track ingredient usage over time
    filteredOrders.forEach(order => {
      const orderDate = new Date(order.orderDate);
      const dateKey = orderDate.toISOString().split('T')[0];
      const weekKey = `${orderDate.getFullYear()}-W${Math.ceil(orderDate.getDate() / 7)}`;
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      
      order.items.forEach(item => {
        item.ingredients.forEach(ingredient => {
          const key = ingredient.name.toLowerCase();
          const totalAmount = ingredient.amount * item.quantity;
          
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            
            // Update daily usage
            existing.dailyUsage[dateKey] = (existing.dailyUsage[dateKey] || 0) + totalAmount;
            
            // Update weekly usage
            existing.weeklyUsage[weekKey] = (existing.weeklyUsage[weekKey] || 0) + totalAmount;
            
            // Update monthly usage
            existing.monthlyUsage[monthKey] = (existing.monthlyUsage[monthKey] || 0) + totalAmount;
            
            // Update total usage
            existing.totalUsage += totalAmount;
            
            // Add dish if not already included
            if (!existing.usedInDishes.includes(item.name)) {
              existing.usedInDishes.push(item.name);
            }
            
            // Update peak usage
            if (totalAmount > existing.peakUsageAmount) {
              existing.peakUsageAmount = totalAmount;
              existing.peakUsageDate = dateKey;
            }
          } else {
            const newData: IngredientUsageData = {
              name: ingredient.name,
              unit: ingredient.unit,
              dailyUsage: { [dateKey]: totalAmount },
              weeklyUsage: { [weekKey]: totalAmount },
              monthlyUsage: { [monthKey]: totalAmount },
              totalUsage: totalAmount,
              averageDaily: 0,
              averageWeekly: 0,
              averageMonthly: 0,
              trend: 'stable',
              usedInDishes: [item.name],
              peakUsageDate: dateKey,
              peakUsageAmount: totalAmount
            };
            
            ingredientMap.set(key, newData);
          }
        });
      });
    });
    
    // Calculate averages and trends
    ingredientMap.forEach((data, key) => {
      const dailyEntries = Object.keys(data.dailyUsage);
      const weeklyEntries = Object.keys(data.weeklyUsage);
      const monthlyEntries = Object.keys(data.monthlyUsage);
      
      data.averageDaily = dailyEntries.length > 0 ? data.totalUsage / dailyEntries.length : 0;
      data.averageWeekly = weeklyEntries.length > 0 ? 
        Object.values(data.weeklyUsage).reduce((sum, val) => sum + val, 0) / weeklyEntries.length : 0;
      data.averageMonthly = monthlyEntries.length > 0 ? 
        Object.values(data.monthlyUsage).reduce((sum, val) => sum + val, 0) / monthlyEntries.length : 0;
      
      // Calculate trend (comparing recent vs older periods)
      const sortedDates = dailyEntries.sort();
      if (sortedDates.length >= 6) {
        const recentDays = sortedDates.slice(-3);
        const olderDays = sortedDates.slice(-6, -3);
        
        const recentAvg = recentDays.reduce((sum, date) => sum + (data.dailyUsage[date] || 0), 0) / recentDays.length;
        const olderAvg = olderDays.reduce((sum, date) => sum + (data.dailyUsage[date] || 0), 0) / olderDays.length;
        
        if (recentAvg > olderAvg * 1.1) data.trend = 'up';
        else if (recentAvg < olderAvg * 0.9) data.trend = 'down';
        else data.trend = 'stable';
      }
    });
    
    return Array.from(ingredientMap.values()).sort((a, b) => b.totalUsage - a.totalUsage);
  }, [filteredOrdersAndPayments]);

  // Generate date-wise data with filtering
  const dateWiseData = useMemo(() => {
    const { filteredOrders, filteredPayments, startDate, endDate } = filteredOrdersAndPayments;
    const data: DailyData[] = [];
    
    // Generate data for each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Filter orders for this date
      const dayOrders = filteredOrders.filter(order => 
        order.orderDate.toISOString().split('T')[0] === dateStr
      );
      
      // Filter payments for this date
      const dayPayments = filteredPayments.filter(payment => 
        payment.status === 'completed' && 
        payment.paymentDate.toISOString().split('T')[0] === dateStr
      );
      
      // Calculate top dishes
      const dishCount = new Map<string, number>();
      dayOrders.forEach(order => {
        order.items.forEach(item => {
          dishCount.set(item.name, (dishCount.get(item.name) || 0) + item.quantity);
        });
      });
      
      const topDishes = Array.from(dishCount.entries())
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      
      // Calculate ingredients used
      const ingredientCount = new Map<string, { quantity: number; unit: string }>();
      dayOrders.forEach(order => {
        order.items.forEach(item => {
          item.ingredients.forEach(ingredient => {
            const key = ingredient.name;
            const existing = ingredientCount.get(key);
            if (existing) {
              existing.quantity += ingredient.amount * item.quantity;
            } else {
              ingredientCount.set(key, {
                quantity: ingredient.amount * item.quantity,
                unit: ingredient.unit
              });
            }
          });
        });
      });
      
      const ingredientsUsed = Array.from(ingredientCount.entries())
        .map(([name, data]) => ({ name, quantity: data.quantity, unit: data.unit }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
      
      // Get unique customers for this date
      const uniqueCustomers = new Set(dayOrders.map(order => order.userId)).size;
      
      data.push({
        date: dateStr,
        orders: dayOrders.length,
        revenue: dayPayments.reduce((sum, payment) => sum + payment.amount, 0),
        customers: uniqueCustomers,
        topDishes,
        ingredientsUsed
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  }, [filteredOrdersAndPayments]);

  // Filter ingredients based on selection
  const filteredIngredients = useMemo(() => {
    if (selectedIngredient === 'all') {
      return ingredientUsageAnalysis;
    }
    return ingredientUsageAnalysis.filter(ingredient => 
      ingredient.name.toLowerCase().includes(selectedIngredient.toLowerCase())
    );
  }, [ingredientUsageAnalysis, selectedIngredient]);

  // Get unique ingredients for filter dropdown
  const uniqueIngredients = useMemo(() => {
    return ['all', ...ingredientUsageAnalysis.map(ing => ing.name)];
  }, [ingredientUsageAnalysis]);

  // Calculate trends
  const trends = useMemo(() => {
    if (dateWiseData.length < 2) return { orders: 0, revenue: 0, customers: 0 };
    
    const halfPoint = Math.floor(dateWiseData.length / 2);
    const recent = dateWiseData.slice(halfPoint);
    const previous = dateWiseData.slice(0, halfPoint);
    
    const recentAvg = {
      orders: recent.reduce((sum, day) => sum + day.orders, 0) / recent.length,
      revenue: recent.reduce((sum, day) => sum + day.revenue, 0) / recent.length,
      customers: recent.reduce((sum, day) => sum + day.customers, 0) / recent.length
    };
    
    const previousAvg = {
      orders: previous.reduce((sum, day) => sum + day.orders, 0) / previous.length,
      revenue: previous.reduce((sum, day) => sum + day.revenue, 0) / previous.length,
      customers: previous.reduce((sum, day) => sum + day.customers, 0) / previous.length
    };
    
    return {
      orders: previousAvg.orders > 0 ? ((recentAvg.orders - previousAvg.orders) / previousAvg.orders) * 100 : 0,
      revenue: previousAvg.revenue > 0 ? ((recentAvg.revenue - previousAvg.revenue) / previousAvg.revenue) * 100 : 0,
      customers: previousAvg.customers > 0 ? ((recentAvg.customers - previousAvg.customers) / previousAvg.customers) * 100 : 0
    };
  }, [dateWiseData]);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
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

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period as any);
    if (period !== 'custom') {
      setShowDateRange(false);
    } else {
      setShowDateRange(true);
    }
  };

  const resetToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setToDate(today);
    setFromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  };

  const TrendCard = ({ title, value, trend, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          <div className="flex items-center mt-2">
            {trend >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ml-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(trend).toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs previous period</span>
          </div>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Date-wise Analytics</h2>
          <p className="text-gray-600">Comprehensive sales and ingredient usage analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="custom">Custom Date Range</option>
          </select>
          <button 
            onClick={resetToToday}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {showDateRange && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <CalendarDays className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Custom Date Range</h3>
                <p className="text-blue-700">Select from and to dates for analysis</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate}
                className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800">
                <strong>Selected Range:</strong> {new Date(fromDate).toLocaleDateString()} to {new Date(toDate).toLocaleDateString()}
              </span>
              <span className="text-blue-600">
                <strong>Duration:</strong> {Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TrendCard
          title="Daily Orders"
          value={Math.round(dateWiseData.reduce((sum, day) => sum + day.orders, 0) / Math.max(dateWiseData.length, 1))}
          trend={trends.orders}
          icon={ShoppingBag}
          color="text-blue-600"
        />
        <TrendCard
          title="Daily Revenue"
          value={formatCurrency(Math.round(dateWiseData.reduce((sum, day) => sum + day.revenue, 0) / Math.max(dateWiseData.length, 1)))}
          trend={trends.revenue}
          icon={DollarSign}
          color="text-green-600"
        />
        <TrendCard
          title="Daily Customers"
          value={Math.round(dateWiseData.reduce((sum, day) => sum + day.customers, 0) / Math.max(dateWiseData.length, 1))}
          trend={trends.customers}
          icon={Users}
          color="text-purple-600"
        />
      </div>

      {/* Ingredient Usage Analysis Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Leaf className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ingredient Usage Analysis</h3>
                <p className="text-gray-600">
                  Track ingredient consumption patterns 
                  {selectedPeriod === 'custom' ? 
                    ` from ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}` :
                    ` over the ${selectedPeriod.replace('days', ' days')}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={ingredientAnalysisPeriod}
                onChange={(e) => setIngredientAnalysisPeriod(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="daily">Daily Analysis</option>
                <option value="weekly">Weekly Analysis</option>
                <option value="monthly">Monthly Analysis</option>
              </select>
              <select
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {uniqueIngredients.map(ingredient => (
                  <option key={ingredient} value={ingredient}>
                    {ingredient === 'all' ? 'All Ingredients' : ingredient}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Ingredient Usage Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{filteredIngredients.length}</div>
              <div className="text-sm text-green-800">Total Ingredients</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredIngredients.reduce((sum, ing) => sum + ing.totalUsage, 0).toFixed(1)}
              </div>
              <div className="text-sm text-blue-800">Total Usage (all units)</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredIngredients.filter(ing => ing.trend === 'up').length}
              </div>
              <div className="text-sm text-orange-800">Trending Up</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredIngredients.filter(ing => ing.trend === 'down').length}
              </div>
              <div className="text-sm text-red-800">Trending Down</div>
            </div>
          </div>

          {/* Detailed Ingredient Analysis */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Scale className="h-5 w-5 mr-2 text-green-600" />
              {ingredientAnalysisPeriod.charAt(0).toUpperCase() + ingredientAnalysisPeriod.slice(1)} Ingredient Usage
              {selectedPeriod === 'custom' && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()})
                </span>
              )}
            </h4>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {ingredientAnalysisPeriod === 'daily' ? 'Avg Daily Usage' : 
                       ingredientAnalysisPeriod === 'weekly' ? 'Avg Weekly Usage' : 'Avg Monthly Usage'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Usage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peak Usage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used In Dishes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIngredients.map((ingredient, index) => {
                    const avgUsage = ingredientAnalysisPeriod === 'daily' ? ingredient.averageDaily :
                                   ingredientAnalysisPeriod === 'weekly' ? ingredient.averageWeekly :
                                   ingredient.averageMonthly;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <ChefHat className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
                              <div className="text-xs text-gray-500">Unit: {ingredient.unit}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatAmount(avgUsage, ingredient.unit)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatAmount(ingredient.totalUsage, ingredient.unit)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getTrendIcon(ingredient.trend)}
                            <span className={`ml-2 text-sm font-medium ${
                              ingredient.trend === 'up' ? 'text-green-600' :
                              ingredient.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {ingredient.trend.charAt(0).toUpperCase() + ingredient.trend.slice(1)}
                            </span>
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
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {ingredient.usedInDishes.slice(0, 3).join(', ')}
                            {ingredient.usedInDishes.length > 3 && (
                              <span className="text-gray-500"> +{ingredient.usedInDishes.length - 3} more</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredIngredients.length === 0 && (
              <div className="text-center py-12">
                <Leaf className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Ingredient Data</h4>
                <p className="text-gray-500">No ingredient usage found for the selected date range</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {dateWiseData.slice(-15).map((day, index) => {
              const maxRevenue = Math.max(...dateWiseData.map(d => d.revenue));
              const width = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={day.date} className="flex items-center space-x-3">
                  <div className="w-16 text-sm text-gray-600">{formatDate(day.date)}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${width}%` }}
                    >
                      {day.revenue > 0 && (
                        <span className="text-white text-xs font-medium">
                          {formatCurrency(day.revenue)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-600">{day.orders}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Orders Trend</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {dateWiseData.slice(-15).map((day, index) => {
              const maxOrders = Math.max(...dateWiseData.map(d => d.orders));
              const width = maxOrders > 0 ? (day.orders / maxOrders) * 100 : 0;
              
              return (
                <div key={day.date} className="flex items-center space-x-3">
                  <div className="w-16 text-sm text-gray-600">{formatDate(day.date)}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${width}%` }}
                    >
                      {day.orders > 0 && (
                        <span className="text-white text-xs font-medium">{day.orders}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-600">{day.customers}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Daily Summary Report</h3>
          <p className="text-gray-600">
            {selectedPeriod === 'custom' ? 
              `Data from ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}` :
              `Last ${selectedPeriod.replace('days', ' days')} summary`
            }
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Dish</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dateWiseData.slice().reverse().map(day => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(day.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.customers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.topDishes[0]?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.orders > 0 ? formatCurrency(Math.round(day.revenue / day.orders)) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DateWiseAnalytics;