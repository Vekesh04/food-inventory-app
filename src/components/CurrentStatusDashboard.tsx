import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Calendar,
  MapPin,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Package,
  ChefHat,
  Star
} from 'lucide-react';
import { cloudStorage } from '../utils/cloudStorage';

const CurrentStatusDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState<any>({
    users: [],
    orders: [],
    payments: [],
    sessions: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load data from cloud storage
  useEffect(() => {
    const loadData = () => {
      try {
        const cloudData = cloudStorage.getFromCloud();
        setData(cloudData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const unsubscribe = cloudStorage.subscribe((newData) => {
      setData(newData);
    });

    return unsubscribe;
  }, []);

  // Calculate current statistics
  const currentStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const last30Minutes = new Date(now.getTime() - 30 * 60 * 1000);

    // Today's data
    const todayOrders = data.orders.filter((order: any) => 
      new Date(order.orderDate) >= todayStart
    );
    
    const todayRevenue = data.payments.filter((payment: any) => 
      payment.status === 'completed' && new Date(payment.paymentDate) >= todayStart
    ).reduce((sum: number, payment: any) => sum + payment.amount, 0);

    // This hour's data
    const thisHourOrders = data.orders.filter((order: any) => 
      new Date(order.orderDate) >= thisHourStart
    );

    // Last 30 minutes data
    const recentOrders = data.orders.filter((order: any) => 
      new Date(order.orderDate) >= last30Minutes
    );

    // Active sessions
    const activeSessions = data.sessions.filter((session: any) => session.isActive);
    
    // Device breakdown
    const deviceStats = activeSessions.reduce((acc: any, session: any) => {
      const deviceType = session.deviceInfo?.deviceType || 'Unknown';
      acc[deviceType] = (acc[deviceType] || 0) + 1;
      return acc;
    }, {});

    // Location breakdown
    const locationStats = activeSessions.reduce((acc: any, session: any) => {
      const city = session.location?.city || 'Unknown';
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    // Browser breakdown
    const browserStats = activeSessions.reduce((acc: any, session: any) => {
      const browser = session.deviceInfo?.browser || 'Unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});

    // Recent activity
    const recentActivity = [
      ...data.orders.slice(-5).map((order: any) => ({
        type: 'order',
        message: `New order from ${order.userName}`,
        time: new Date(order.orderDate),
        amount: order.total,
        icon: ShoppingBag
      })),
      ...data.sessions.filter((s: any) => s.isActive).slice(-3).map((session: any) => ({
        type: 'login',
        message: `${session.userName} is online`,
        time: new Date(session.loginTime),
        device: session.deviceInfo?.deviceType,
        icon: Users
      }))
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 8);

    return {
      totalUsers: data.users.length,
      activeUsers: activeSessions.length,
      todayOrders: todayOrders.length,
      todayRevenue,
      thisHourOrders: thisHourOrders.length,
      recentOrders: recentOrders.length,
      deviceStats,
      locationStats,
      browserStats,
      recentActivity,
      totalOrders: data.orders.length,
      totalRevenue: data.payments.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + p.amount, 0)
    };
  }, [data]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      case 'desktop': return Monitor;
      default: return Globe;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Loading Current Status...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Current Time */}
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Clock className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Current Status Dashboard
            </h1>
          </div>
          
          <div className="text-center space-y-2">
            <div className="text-5xl font-bold text-gray-900 font-mono">
              {formatTime(currentTime)}
            </div>
            <div className="text-xl text-gray-600">
              {formatDate(currentTime)}
            </div>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">System Online</span>
            </div>
          </div>
        </div>

        {/* Real-time Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active Users */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
                <p className="text-3xl font-bold text-green-600">{currentStats.activeUsers}</p>
                <p className="text-sm text-gray-500">of {currentStats.totalUsers} total</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Activity className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">Live Sessions</span>
            </div>
          </div>

          {/* Today's Orders */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Today's Orders</p>
                <p className="text-3xl font-bold text-blue-600">{currentStats.todayOrders}</p>
                <p className="text-sm text-gray-500">{currentStats.thisHourOrders} this hour</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm text-blue-600 font-medium">{currentStats.recentOrders} in last 30min</span>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Today's Revenue</p>
                <p className="text-3xl font-bold text-purple-600">₹{currentStats.todayRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">₹{currentStats.totalRevenue.toLocaleString()} total</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Star className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-sm text-purple-600 font-medium">Live Earnings</span>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">System Health</p>
                <p className="text-3xl font-bold text-green-600">100%</p>
                <p className="text-sm text-gray-500">All systems operational</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Activity className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">Real-time Sync</span>
            </div>
          </div>
        </div>

        {/* Device & Location Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device Breakdown */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Monitor className="h-5 w-5 mr-2 text-blue-600" />
              Active Devices
            </h3>
            <div className="space-y-3">
              {Object.entries(currentStats.deviceStats).map(([device, count]) => {
                const Icon = getDeviceIcon(device);
                const percentage = Math.round((count as number / currentStats.activeUsers) * 100);
                return (
                  <div key={device} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">{device}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location Breakdown */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-600" />
              User Locations
            </h3>
            <div className="space-y-3">
              {Object.entries(currentStats.locationStats).slice(0, 5).map(([city, count]) => {
                const percentage = Math.round((count as number / currentStats.activeUsers) * 100);
                return (
                  <div key={city} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">{city}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Browser Breakdown */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-purple-600" />
              Browsers Used
            </h3>
            <div className="space-y-3">
              {Object.entries(currentStats.browserStats).map(([browser, count]) => {
                const percentage = Math.round((count as number / currentStats.activeUsers) * 100);
                return (
                  <div key={browser} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">{browser}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-orange-600" />
            Live Activity Feed
          </h3>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {currentStats.recentActivity.map((activity: any, index: number) => {
              const Icon = activity.icon;
              const timeAgo = Math.floor((currentTime.getTime() - activity.time.getTime()) / (1000 * 60));
              
              return (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'order' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      activity.type === 'order' ? 'text-blue-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{timeAgo === 0 ? 'Just now' : `${timeAgo}m ago`}</span>
                      {activity.amount && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-green-600">₹{activity.amount}</span>
                        </>
                      )}
                      {activity.device && (
                        <>
                          <span>•</span>
                          <span>{activity.device}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {activity.time.toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 bg-white/50 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Real-time Data</span>
            </div>
            <div className="flex items-center space-x-1">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              <span>Auto-refresh Active</span>
            </div>
            <div className="flex items-center space-x-1">
              <Globe className="h-4 w-4 text-purple-500" />
              <span>Cross-device Sync</span>
            </div>
          </div>
          <p className="mt-2">
            Last updated: {formatTime(currentTime)} • Ciolake Food Inventory System
          </p>
        </div>
      </div>
    </div>
  );
};

export default CurrentStatusDashboard;