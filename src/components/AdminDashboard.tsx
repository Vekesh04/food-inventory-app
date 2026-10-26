import React, { useState, useMemo } from 'react';
import { 
  LogOut, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
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
  PieChart,
  Activity,
  Star,
  ChefHat,
  Utensils,
  Coffee,
  Pizza,
  Cake,
  Crown,
  Award,
  Zap,
  Heart,
  Package,
  AlertTriangle,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Admin, User, Order, Payment, MenuItem, UserSession, InventoryItem, PurchaseRecommendation } from '../types';
import DateWiseAnalytics from './DateWiseAnalytics';
import DishManagement from './DishManagement';
import IngredientAvailabilityTracker from './IngredientAvailabilityTracker';
import { exportAllDataAsCSV } from '../utils/dataExporter';
import { generateInventoryData, generatePurchaseRecommendations, getInventoryStats } from '../utils/inventoryManager';

interface AdminDashboardProps {
  admin: Admin;
  users: User[];
  orders: Order[];
  payments: Payment[];
  sessions: UserSession[];
  menuItems: MenuItem[];
  onLogout: () => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onDeleteMenuItem: (id: number) => void;
  onToggleAvailability: (id: number, available: boolean) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  admin,
  users,
  orders,
  payments,
  sessions,
  menuItems,
  onLogout,
  onUpdateMenuItem,
  onAddMenuItem,
  onDeleteMenuItem,
  onToggleAvailability
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orders' | 'analytics' | 'dishes' | 'inventory'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [inventory, setInventory] = useState<InventoryItem[]>(() => generateInventoryData(menuItems));
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [purchaseQuantities, setPurchaseQuantities] = useState<{ [key: string]: number }>({});

  // Generate inventory data based on menu items
  const purchaseRecommendations = useMemo(() => generatePurchaseRecommendations(inventory, orders), [inventory, orders]);
  const inventoryStats = useMemo(() => getInventoryStats(inventory), [inventory]);

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= today && orderDate < tomorrow;
    });

    const todayRevenue = payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate >= today && paymentDate < tomorrow && payment.status === 'completed';
    }).reduce((sum, payment) => sum + payment.amount, 0);

    const activeSessions = sessions.filter(session => session.isActive);
    const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

    return {
      totalUsers: users.length,
      activeUsers: activeSessions.length,
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      totalRevenue,
      todayRevenue,
      pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length,
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      topDishes: getTopDishes(),
      recentActivity: getRecentActivity(),
      inventoryValue: inventoryStats.totalValue,
      lowStockItems: inventoryStats.lowStock,
      outOfStockItems: inventoryStats.outOfStock,
      urgentPurchases: purchaseRecommendations.filter(r => r.priority === 'high').length
    };
  }, [users, orders, payments, sessions, inventoryStats, purchaseRecommendations]);

  function getTopDishes() {
    const dishCount = new Map<string, number>();
    orders.forEach(order => {
      order.items.forEach(item => {
        dishCount.set(item.name, (dishCount.get(item.name) || 0) + item.quantity);
      });
    });
    return Array.from(dishCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }

  function getRecentActivity() {
    const activities = [
      ...orders.slice(-5).map(order => ({
        type: 'order',
        message: `New order from ${order.userName}`,
        time: order.orderDate,
        amount: order.total
      })),
      ...sessions.slice(-3).map(session => ({
        type: 'login',
        message: `${session.userName} logged in`,
        time: session.loginTime,
        device: session.deviceInfo?.deviceType
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
    
    return activities;
  }

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.mobile.includes(searchTerm);
      const matchesFilter = filterStatus === 'all' || 
                          (filterStatus === 'active' && user.isActive) ||
                          (filterStatus === 'inactive' && !user.isActive);
      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, filterStatus]);

  // Inventory management functions
  const handleUpdateStock = (itemId: string, newStock: number) => {
    setInventory(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            currentStock: Math.max(0, newStock),
            status: newStock === 0 ? 'out-of-stock' : 
                   newStock <= item.minThreshold ? 'low-stock' : 'in-stock'
          }
        : item
    ));
  };

  const handleToggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setPurchaseQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, quantity)
    }));
  };

  const getItemQuantity = (itemId: string) => {
    const recommendation = purchaseRecommendations.find(r => r.ingredientId === itemId);
    return purchaseQuantities[itemId] ?? recommendation?.recommendedQuantity ?? 50;
  };

  const handlePurchaseItems = () => {
    if (selectedItems.length === 0) {
      alert('Please select items to purchase');
      return;
    }

    const totalCost = selectedItems.reduce((sum, itemId) => {
      const item = inventory.find(inv => inv.id === itemId);
      const quantity = getItemQuantity(itemId);
      return sum + (quantity * (item?.costPerUnit || 0));
    }, 0);

    const itemsList = selectedItems.map(itemId => {
      const item = inventory.find(inv => inv.id === itemId);
      const quantity = getItemQuantity(itemId);
      return `${item?.name}: ${quantity}${item?.unit} (₹${(quantity * (item?.costPerUnit || 0)).toFixed(2)})`;
    }).join('\n');

    if (confirm(`Purchase Order Summary:\n\n${itemsList}\n\nTotal Cost: ₹${totalCost.toFixed(2)}\n\nConfirm purchase?`)) {
      // Update inventory with purchased items
      setInventory(prev => prev.map(item => {
        if (selectedItems.includes(item.id)) {
          const quantity = getItemQuantity(item.id);
          const newStock = item.currentStock + quantity;
          return {
            ...item,
            currentStock: newStock,
            lastRestocked: new Date(),
            status: newStock <= item.minThreshold ? 'low-stock' : 'in-stock'
          };
        }
        return item;
      }));

      // Clear selections
      setSelectedItems([]);
      setPurchaseQuantities({});

      alert(`Purchase order completed!\n\nItems purchased: ${selectedItems.length}\nTotal cost: ₹${totalCost.toFixed(2)}\n\nInventory has been updated.`);
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

  const getPriorityColor = (priority: PurchaseRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
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

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Customers', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'dishes', label: 'Menu Management', icon: ChefHat }
  ];

  // Animated food icons for background
  const backgroundIcons = [
    { Icon: ChefHat, color: 'text-orange-100' },
    { Icon: Utensils, color: 'text-red-100' },
    { Icon: Coffee, color: 'text-yellow-100' },
    { Icon: Pizza, color: 'text-green-100' },
    { Icon: Cake, color: 'text-pink-100' },
    { Icon: Star, color: 'text-blue-100' },
    { Icon: Crown, color: 'text-purple-100' },
    { Icon: Award, color: 'text-indigo-100' },
    { Icon: Zap, color: 'text-orange-100' },
    { Icon: Heart, color: 'text-red-100' }
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color} mb-2`}>{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">{trend}% from yesterday</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${color.replace('text-', 'bg-').replace('-600', '-100')} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Food Icons */}
        {Array.from({ length: 30 }).map((_, i) => {
          const IconData = backgroundIcons[i % backgroundIcons.length];
          const Icon = IconData.Icon;
          return (
            <div
              key={i}
              className={`absolute opacity-5 ${IconData.color}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animation: `float ${8 + Math.random() * 4}s ease-in-out infinite alternate`
              }}
            >
              <Icon className={`w-${4 + Math.floor(Math.random() * 8)} h-${4 + Math.floor(Math.random() * 8)} transform rotate-${Math.floor(Math.random() * 4) * 90}`} />
            </div>
          );
        })}
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              {/* Enhanced Restaurant Logo */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500 rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-500 group">
                  <ChefHat className="h-8 w-8 text-white group-hover:rotate-12 transition-transform duration-300" />
                  
                  {/* Orbiting Elements */}
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                    <Star className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 text-yellow-400 fill-current" />
                  </div>
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                    <Utensils className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-3 h-3 text-orange-300" />
                  </div>
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '25s' }}>
                    <Coffee className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 text-red-300" />
                  </div>
                  <div className="absolute inset-0 animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }}>
                    <Crown className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-3 h-3 text-yellow-300" />
                  </div>
                </div>
                
                {/* Glow Effect */}
                <div className="absolute inset-0 w-16 h-16 bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                  Ciolake Admin Portal
                </h1>
                <p className="text-sm text-gray-300">Restaurant Management System</p>
              </div>
            </div>
            
            {/* Admin Info & Actions */}
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-white font-medium">{admin.name}</p>
                <p className="text-sm text-gray-300 capitalize">{admin.role}</p>
              </div>
              
              <button
                onClick={() => exportAllDataAsCSV()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-700/80 text-white rounded-xl transition-all duration-200 backdrop-blur-sm border border-blue-400/30"
              >
                <Download className="h-4 w-4" />
                <span>Export Data</span>
              </button>
              
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600/80 hover:bg-red-700/80 text-white rounded-xl transition-all duration-200 backdrop-blur-sm border border-red-400/30"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="relative z-10 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-orange-400 text-orange-300 bg-orange-500/10'
                      : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  {tab.id === 'inventory' && stats.urgentPurchases > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {stats.urgentPurchases}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-white mb-4">
                Welcome back, <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">{admin.name}</span>
              </h2>
              <p className="text-gray-300 text-lg">Here's what's happening in your restaurant today</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Customers"
                value={stats.totalUsers}
                subtitle={`${stats.activeUsers} currently active`}
                icon={Users}
                color="text-blue-600"
                trend={12}
              />
              <StatCard
                title="Today's Orders"
                value={stats.todayOrders}
                subtitle={`${stats.totalOrders} total orders`}
                icon={ShoppingBag}
                color="text-green-600"
                trend={8}
              />
              <StatCard
                title="Today's Revenue"
                value={`₹${stats.todayRevenue.toLocaleString()}`}
                subtitle={`₹${stats.totalRevenue.toLocaleString()} total`}
                icon={DollarSign}
                color="text-purple-600"
                trend={15}
              />
              <StatCard
                title="Inventory Value"
                value={`₹${Math.round(stats.inventoryValue).toLocaleString()}`}
                subtitle={`${stats.lowStockItems} items low stock`}
                icon={Package}
                color="text-orange-600"
              />
            </div>

            {/* Inventory Alerts */}
            {(stats.outOfStockItems > 0 || stats.lowStockItems > 0) && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
                  <h3 className="text-xl font-bold text-white">Inventory Alerts</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-600/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-300">{stats.outOfStockItems}</div>
                    <div className="text-red-200">Out of Stock</div>
                  </div>
                  <div className="bg-yellow-600/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-300">{stats.lowStockItems}</div>
                    <div className="text-yellow-200">Low Stock</div>
                  </div>
                  <div className="bg-orange-600/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-300">{stats.urgentPurchases}</div>
                    <div className="text-orange-200">Urgent Purchases</div>
                  </div>
                </div>
              </div>
            )}

            {/* Charts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Dishes */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Award className="h-6 w-6 text-yellow-500 mr-2" />
                  Top Performing Dishes
                </h3>
                <div className="space-y-4">
                  {stats.topDishes.map((dish, index) => (
                    <div key={dish.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{dish.name}</span>
                      </div>
                      <span className="font-bold text-gray-700">{dish.count} orders</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Clock className="h-6 w-6 text-blue-500 mr-2" />
                  Recent Activity
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'order' ? 'bg-green-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.time).toLocaleTimeString()}
                          {activity.amount && ` • ₹${activity.amount}`}
                          {activity.device && ` • ${activity.device}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Customer Management</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">{user.name.charAt(0)}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">ID: {user.id.slice(-8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.mobile}</div>
                          <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.totalOrders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{user.totalSpent.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLoginDate ? user.lastLoginDate.toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Order Management</h2>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.slice(0, 20).map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.userName}</div>
                          <div className="text-sm text-gray-500">{order.userMobile}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{order.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.orderDate.toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <IngredientAvailabilityTracker
            orders={orders}
            menuItems={menuItems}
            inventory={inventory}
          />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <DateWiseAnalytics
            orders={orders}
            payments={payments}
            users={users}
            inventory={inventory}
          />
        )}

        {/* Dishes Tab */}
        {activeTab === 'dishes' && (
          <DishManagement
            menuItems={menuItems}
            onUpdateMenuItem={onUpdateMenuItem}
            onAddMenuItem={onAddMenuItem}
            onDeleteMenuItem={onDeleteMenuItem}
            onToggleAvailability={onToggleAvailability}
          />
        )}
      </main>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
          100% { transform: translateY(0px) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;