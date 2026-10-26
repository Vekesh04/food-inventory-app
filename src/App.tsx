import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Search, Star, Clock, Users, MapPin, CreditCard, Banknote, Plus, Minus, Check, LogOut, User, Shield, Activity } from 'lucide-react';
import RestaurantLogo from './components/RestaurantLogo';
import MenuCard from './components/MenuCard';
import Cart from './components/Cart';
import PaymentModal from './components/PaymentModal';
import LoginModal from './components/LoginModal';
import IngredientsModal from './components/IngredientsModal';
import UserProfile from './components/UserProfile';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import CurrentStatusDashboard from './components/CurrentStatusDashboard';
import { MenuItem, CartItem, PaymentMethod, User as UserType, Order, Payment, Admin, UserSession } from './types';
import { parseCSVData } from './utils/csvParser';
import { getDishImage } from './utils/dishImages';
import { cloudStorage, createUserSession, updateSessionActivity, endUserSession } from './utils/cloudStorage';

function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showCurrentStatus, setShowCurrentStatus] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [user, setUser] = useState<UserType | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [currentSession, setCurrentSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionRestored, setSessionRestored] = useState(false);

  // Check for existing session on app load - FIRST PRIORITY
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        console.log('🔍 Checking for existing session...');
        
        const restoredData = cloudStorage.restoreSession();
        
        if (restoredData) {
          const { session, user: userData, cart: cartData } = restoredData;
          
          setCurrentSession(session);
          setUser(userData);
          setCart(cartData || []);
          setShowLogin(false);
          setSessionRestored(true);
          
          console.log('✅ Session restored for user:', userData.name, 'Session ID:', session.id);
          
          updateSessionActivity(session.id);
          cloudStorage.saveSession(session, userData, cartData);
          
        } else {
          console.log('❌ No valid session found');
          setShowLogin(true);
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        cloudStorage.clearSession();
        setShowLogin(true);
      }
    };

    checkExistingSession();
  }, []);

  // Save session and cart to storage whenever they change
  useEffect(() => {
    if (currentSession && user && sessionRestored) {
      try {
        cloudStorage.saveSession(currentSession, user, cart);
        console.log('💾 Session and cart data saved to storage');
      } catch (error) {
        console.error('Error saving session to storage:', error);
      }
    }
  }, [currentSession, user, cart, sessionRestored]);

  // Load data from cloud storage on component mount with enhanced real-time sync
  useEffect(() => {
    const loadData = () => {
      const cloudData = cloudStorage.getFromCloud();
      setAllUsers(cloudData.users);
      setOrders(cloudData.orders);
      setPayments(cloudData.payments);
      setSessions(cloudData.sessions);
      
      console.log('📊 Loaded data from global cloud storage:', {
        users: cloudData.users.length,
        orders: cloudData.orders.length,
        payments: cloudData.payments.length,
        sessions: cloudData.sessions.length,
        activeSessions: cloudData.sessions.filter(s => s.isActive).length,
        lastUpdated: cloudData.lastUpdated
      });
    };

    loadData();

    // Subscribe to real-time updates with enhanced synchronization
    const unsubscribe = cloudStorage.subscribe((data) => {
      console.log('🔄 Real-time update received:', {
        users: data.users.length,
        orders: data.orders.length,
        payments: data.payments.length,
        sessions: data.sessions.length,
        activeSessions: data.sessions.filter(s => s.isActive).length,
        timestamp: data.lastUpdated
      });
      
      setAllUsers(data.users);
      setOrders(data.orders);
      setPayments(data.payments);
      setSessions(data.sessions);
    });

    return unsubscribe;
  }, []);

  // Update session activity periodically with enhanced tracking
  useEffect(() => {
    if (currentSession && user) {
      const interval = setInterval(() => {
        updateSessionActivity(currentSession.id);
      }, 15000); // Update every 15 seconds for better real-time tracking

      return () => clearInterval(interval);
    }
  }, [currentSession, user]);

  // Handle page lifecycle events for better session management
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentSession) {
        // Don't end session on refresh, just update activity
        updateSessionActivity(currentSession.id);
        
        // Save current state before unload
        if (user) {
          try {
            sessionStorage.setItem('current_user_session', JSON.stringify(currentSession));
            sessionStorage.setItem('current_user', JSON.stringify(user));
            sessionStorage.setItem('current_cart', JSON.stringify(cart));
            localStorage.setItem('current_user_session', JSON.stringify(currentSession));
            localStorage.setItem('current_user', JSON.stringify(user));
            localStorage.setItem('current_cart', JSON.stringify(cart));
          } catch (error) {
            console.error('Error saving state before unload:', error);
          }
        }
      }
    };

    // Handle visibility changes for better session tracking
    const handleVisibilityChange = () => {
      if (currentSession) {
        if (document.visibilityState === 'visible') {
          updateSessionActivity(currentSession.id);
          console.log('👁️ Tab became visible, updated session activity');
        }
      }
    };

    // Handle page focus
    const handleFocus = () => {
      if (currentSession) {
        updateSessionActivity(currentSession.id);
        console.log('🎯 Page focused, updated session activity');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentSession, user, cart]);

  useEffect(() => {
    const loadMenuItems = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Loading CSV data...');
        
        // Try to load the CSV file
        const response = await fetch('/indian_food.csv');
        
        if (!response.ok) {
          throw new Error(`Failed to load CSV file: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('CSV loaded, length:', csvText.length);
        
        if (!csvText || csvText.trim().length === 0) {
          throw new Error('CSV file is empty');
        }
        
        const parsedRecipes = parseCSVData(csvText);
        console.log('Parsed recipes:', parsedRecipes.length);
        
        if (parsedRecipes.length === 0) {
          throw new Error('No recipes found in CSV');
        }
        
        // Convert recipes to menu items with pricing and stock
        const menuData = parsedRecipes.map((recipe, index) => ({
          id: recipe.id,
          name: recipe.name,
          description: `Authentic ${recipe.region} cuisine with ${recipe.ingredients.length} premium ingredients`,
          price: calculatePrice(recipe),
          category: recipe.course,
          cuisine: recipe.region,
          diet: recipe.diet,
          prepTime: recipe.prepTime + recipe.cookTime,
          spiceLevel: getSpiceLevel(recipe.flavorProfile),
          rating: 4.2 + (Math.random() * 0.8),
          stock: Math.floor(Math.random() * 50) + 10, // Random stock between 10-60
          ingredients: recipe.ingredients,
          image: getDishImage(recipe.name, index)
        }));
        
        console.log('Menu items created:', menuData.length);
        setMenuItems(menuData);
        
      } catch (error) {
        console.error('Error loading menu items:', error);
        setError(error instanceof Error ? error.message : 'Failed to load menu data');
        
        // Fallback to sample data if CSV fails to load
        const fallbackMenuItems: MenuItem[] = [
          {
            id: 1,
            name: "Butter Chicken",
            description: "Authentic North cuisine with 7 premium ingredients",
            price: 18,
            category: "main course",
            cuisine: "North",
            diet: "non vegetarian",
            prepTime: 50,
            spiceLevel: 3,
            rating: 4.5,
            stock: 50,
            ingredients: [
              { name: "Chicken", amount: 500, unit: "g" },
              { name: "Butter", amount: 50, unit: "g" },
              { name: "Tomato", amount: 200, unit: "g" },
              { name: "Cream", amount: 100, unit: "ml" },
              { name: "Garam Masala", amount: 10, unit: "g" },
              { name: "Garlic", amount: 20, unit: "g" },
              { name: "Ginger", amount: 15, unit: "g" }
            ],
            image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop"
          },
          {
            id: 2,
            name: "Dal Makhani",
            description: "Authentic North cuisine with 7 premium ingredients",
            price: 15,
            category: "main course",
            cuisine: "North",
            diet: "vegetarian",
            prepTime: 60,
            spiceLevel: 3,
            rating: 4.3,
            stock: 50,
            ingredients: [
              { name: "Black Lentils", amount: 200, unit: "g" },
              { name: "Kidney Beans", amount: 50, unit: "g" },
              { name: "Butter", amount: 30, unit: "g" },
              { name: "Cream", amount: 50, unit: "ml" },
              { name: "Tomato", amount: 100, unit: "g" },
              { name: "Onion", amount: 80, unit: "g" },
              { name: "Cumin", amount: 5, unit: "g" }
            ],
            image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop"
          }
        ];
        
        setMenuItems(fallbackMenuItems);
      } finally {
        setIsLoading(false);
      }
    };

    loadMenuItems();
  }, []);

  const calculatePrice = (recipe: any): number => {
    const basePrice = 12;
    const ingredientMultiplier = recipe.ingredients.length * 0.8;
    const timeMultiplier = (recipe.prepTime + recipe.cookTime) * 0.1;
    const regionMultiplier = recipe.region === 'North' ? 1.2 : 1.0;
    
    return Math.round((basePrice + ingredientMultiplier + timeMultiplier) * regionMultiplier);
  };

  const getSpiceLevel = (flavorProfile: string): number => {
    switch (flavorProfile.toLowerCase()) {
      case 'spicy': return 3;
      case 'sweet': return 1;
      case 'bitter': return 2;
      case 'sour': return 2;
      default: return 2;
    }
  };

  const categories = useMemo(() => {
    const cats = ['all', ...new Set(menuItems.map(item => item.category))];
    return cats;
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const inStock = item.stock > 0;
      
      return matchesSearch && matchesCategory && inStock;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const addToCart = (item: MenuItem, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity }];
      }
    });

    // Update stock
    setMenuItems(prevItems =>
      prevItems.map(menuItem =>
        menuItem.id === item.id
          ? { ...menuItem, stock: menuItem.stock - quantity }
          : menuItem
      )
    );
  };

  const updateCartQuantity = (id: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(id);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (id: number) => {
    const cartItem = cart.find(item => item.id === id);
    if (cartItem) {
      // Restore stock
      setMenuItems(prevItems =>
        prevItems.map(menuItem =>
          menuItem.id === id
            ? { ...menuItem, stock: menuItem.stock + cartItem.quantity }
            : menuItem
        )
      );
    }

    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    setShowCart(false);
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    if (!user) return;

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const total = Math.round(getTotalAmount() * 1.18);

    // Create order with session tracking
    const newOrder: Order = {
      id: orderId,
      userId: user.id,
      userName: user.name,
      userMobile: user.mobile,
      userEmail: user.email,
      items: [...cart],
      total,
      paymentMethod,
      status: 'confirmed',
      orderDate: new Date(),
      deliveryTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      sessionId: currentSession?.id
    };

    // Create payment record with session tracking
    const newPayment: Payment = {
      id: paymentId,
      orderId,
      userId: user.id,
      userName: user.name,
      userMobile: user.mobile,
      amount: total,
      method: paymentMethod,
      status: 'completed',
      transactionId: paymentMethod !== 'cash' ? `txn_${Date.now()}` : undefined,
      paymentDate: new Date(),
      cardDetails: paymentMethod === 'card' ? {
        last4: '1234',
        brand: 'Visa'
      } : undefined,
      sessionId: currentSession?.id
    };

    // Update cloud storage with immediate sync
    const cloudData = cloudStorage.getFromCloud();
    cloudData.orders.push(newOrder);
    cloudData.payments.push(newPayment);
    
    // Update user stats
    const userIndex = cloudData.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      cloudData.users[userIndex].totalOrders += 1;
      cloudData.users[userIndex].totalSpent += total;
      cloudData.users[userIndex].lastLoginDate = new Date();
    }

    cloudStorage.saveToCloud(cloudData);

    setCart([]);
    setShowPayment(false);
    
    alert('Order placed successfully! Your delicious meal will be ready soon.');
  };

  const handleLogin = (name: string, mobile: string) => {
    // Check if user already exists in cloud storage
    const cloudData = cloudStorage.getFromCloud();
    const existingUser = cloudData.users.find(u => u.mobile === mobile);
    
    let currentUser: UserType;
    
    if (existingUser) {
      // Update last login date for existing user
      currentUser = {
        ...existingUser,
        lastLoginDate: new Date(),
        isActive: true
      };
      
      // Update in cloud storage
      const userIndex = cloudData.users.findIndex(u => u.id === existingUser.id);
      cloudData.users[userIndex] = currentUser;
    } else {
      // Create new user
      currentUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        mobile,
        joinedDate: new Date(),
        lastLoginDate: new Date(),
        totalOrders: 0,
        totalSpent: 0,
        isActive: true
      };
      
      cloudData.users.push(currentUser);
    }

    // Save updated user data to cloud
    cloudStorage.saveToCloud(cloudData);
    
    // Create session for this login (this will also save to cloud with immediate sync)
    const session = createUserSession(currentUser);
    setCurrentSession(session);
    setUser(currentUser);
    setShowLogin(false);
    setSessionRestored(true);
    
    console.log('✅ User logged in:', currentUser.name, 'Session:', session.id);
    console.log('🌐 Session is now visible to admin across ALL devices and browsers');
  };

  const handleAdminLogin = (adminData: Admin) => {
    setAdmin(adminData);
    setShowAdminLogin(false);
  };

  const handleLogout = () => {
    if (currentSession) {
      endUserSession(currentSession.id);
    }
    
    // Clear all session storage
    sessionStorage.removeItem('current_user_session');
    sessionStorage.removeItem('current_user');
    sessionStorage.removeItem('current_cart');
    localStorage.removeItem('current_user_session');
    localStorage.removeItem('current_user');
    localStorage.removeItem('current_cart');
    
    setUser(null);
    setCurrentSession(null);
    setCart([]);
    setShowLogin(true);
    setSessionRestored(false);
    
    console.log('🔚 User logged out and all session data cleared');
  };

  const handleAdminLogout = () => {
    setAdmin(null);
  };

  const handleViewIngredients = (item: MenuItem) => {
    setSelectedItem(item);
    setShowIngredients(true);
  };

  const handleUpdateUser = (updatedUser: UserType) => {
    setUser(updatedUser);
    
    // Update in cloud storage
    const cloudData = cloudStorage.getFromCloud();
    const userIndex = cloudData.users.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      cloudData.users[userIndex] = updatedUser;
      cloudStorage.saveToCloud(cloudData);
    }
  };

  // Menu item management functions for admin
  const handleUpdateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems(prevItems =>
      prevItems.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
  };

  const handleAddMenuItem = (newItem: Omit<MenuItem, 'id'>) => {
    const menuItem: MenuItem = {
      ...newItem,
      id: Math.max(...menuItems.map(item => item.id), 0) + 1
    };
    setMenuItems(prevItems => [...prevItems, menuItem]);
  };

  const handleDeleteMenuItem = (id: number) => {
    setMenuItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleToggleAvailability = (id: number, available: boolean) => {
    setMenuItems(prevItems =>
      prevItems.map(item =>
        item.id === id 
          ? { ...item, stock: available ? 50 : 0 }
          : item
      )
    );
  };

  // Show current status dashboard if requested
  if (showCurrentStatus) {
    return <CurrentStatusDashboard />;
  }

  // If admin is logged in, show admin dashboard with all customer data
  if (admin) {
    return (
      <AdminDashboard
        admin={admin}
        users={allUsers}
        orders={orders}
        payments={payments}
        sessions={sessions}
        menuItems={menuItems}
        onLogout={handleAdminLogout}
        onUpdateMenuItem={handleUpdateMenuItem}
        onAddMenuItem={handleAddMenuItem}
        onDeleteMenuItem={handleDeleteMenuItem}
        onToggleAvailability={handleToggleAvailability}
      />
    );
  }

  if (showLogin) {
    return (
      <>
        <LoginModal
          isOpen={showLogin}
          onClose={() => {}}
          onLogin={handleLogin}
        />
        
        {/* Admin Access Button */}
        <button
          onClick={() => setShowAdminLogin(true)}
          className="fixed bottom-6 right-6 bg-slate-800 hover:bg-slate-900 text-white p-4 rounded-full shadow-lg transition-colors z-50"
          title="Admin Access"
        >
          <Shield className="h-6 w-6" />
        </button>

        {/* Current Status Button */}
        <button
          onClick={() => setShowCurrentStatus(true)}
          className="fixed bottom-6 left-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors z-50"
          title="Current Status"
        >
          <Activity className="h-6 w-6" />
        </button>

        <AdminLogin
          isOpen={showAdminLogin}
          onClose={() => setShowAdminLogin(false)}
          onLogin={handleAdminLogin}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-orange-200 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <RestaurantLogo />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Ciolake Food Inventory
                </h1>
                <p className="text-sm text-gray-600">Authentic Indian Cuisine</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-80 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/80"
                />
              </div>

              {user && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowProfile(true)}
                    className="flex items-center space-x-2 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    <User className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">{user.name}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              )}
              
              <button
                onClick={() => setShowCart(true)}
                className="relative flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="font-medium">Cart</span>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-orange-900 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Experience the <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Flavors of India</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            From traditional recipes passed down through generations to modern culinary innovations
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span>Fresh & Fast</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Premium Quality</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-red-500" />
              <span>Authentic Recipes</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Menu...</h3>
            <p className="text-gray-600">Fetching delicious dishes from our kitchen</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Unable to Load Menu</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Menu Content */}
        {!isLoading && !error && (
          <>
            {/* Category Filter */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-3">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
                    }`}
                  >
                    {category === 'all' ? 'All Items' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Stats */}
            <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{menuItems.length}</div>
                  <div className="text-sm text-gray-600">Total Dishes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{filteredItems.length}</div>
                  <div className="text-sm text-gray-600">Available Now</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{categories.length - 1}</div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(menuItems.map(item => item.cuisine)).size}
                  </div>
                  <div className="text-sm text-gray-600">Regions</div>
                </div>
              </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map(item => (
                <MenuCard
                  key={item.id}
                  item={item}
                  onAddToCart={addToCart}
                  onViewIngredients={handleViewIngredients}
                />
              ))}
            </div>

            {filteredItems.length === 0 && menuItems.length > 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">No dishes found</h3>
                <p className="text-gray-600">Try adjusting your search or category filter</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Admin Access Button */}
      <button
        onClick={() => setShowAdminLogin(true)}
        className="fixed bottom-6 right-6 bg-slate-800 hover:bg-slate-900 text-white p-4 rounded-full shadow-lg transition-colors z-40"
        title="Admin Access"
      >
        <Shield className="h-6 w-6" />
      </button>

      {/* Current Status Button */}
      <button
        onClick={() => setShowCurrentStatus(true)}
        className="fixed bottom-6 left-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors z-40"
        title="Current Status"
      >
        <Activity className="h-6 w-6" />
      </button>

      {/* Cart Sidebar */}
      {showCart && (
        <Cart
          items={cart}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
          onClose={() => setShowCart(false)}
          onCheckout={handleCheckout}
          total={getTotalAmount()}
        />
      )}

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={getTotalAmount()}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          onClose={() => setShowPayment(false)}
          onComplete={handlePaymentComplete}
        />
      )}

      {/* Ingredients Modal */}
      <IngredientsModal
        item={selectedItem}
        isOpen={showIngredients}
        onClose={() => setShowIngredients(false)}
        onAddToCart={addToCart}
      />

      {/* User Profile Modal */}
      {user && (
        <UserProfile
          user={user}
          orders={orders.filter(order => order.userId === user.id)}
          payments={payments.filter(payment => payment.userId === user.id)}
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLogin
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLogin={handleAdminLogin}
      />
    </div>
  );
}

export default App;