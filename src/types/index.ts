export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: number;
  name: string;
  ingredients: Ingredient[];
  diet: string;
  prepTime: number;
  cookTime: number;
  flavorProfile: string;
  course: string;
  state: string;
  region: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  cuisine: string;
  diet: string;
  prepTime: number;
  spiceLevel: number;
  rating: number;
  stock: number;
  ingredients: Ingredient[];
  image: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'upi';

export interface IngredientUsage {
  name: string;
  totalAmount: number;
  unit: string;
  usedInRecipes: string[];
  frequency: number;
}

export interface FilterOptions {
  diet: string;
  course: string;
  region: string;
  flavorProfile: string;
  prepTimeRange: [number, number];
  cookTimeRange: [number, number];
}

export interface User {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  joinedDate: Date;
  lastLoginDate?: Date;
  totalOrders: number;
  totalSpent: number;
  isActive: boolean;
  address?: string;
  preferences?: {
    favoriteItems: string[];
    dietaryRestrictions: string[];
    spiceLevel: number;
  };
}

export interface UserSession {
  id: string;
  userId: string;
  userName: string;
  userMobile: string;
  loginTime: Date;
  lastActivity: Date;
  logoutTime?: Date;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    timezone: string;
    deviceId?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    onlineStatus?: boolean;
  };
  ipAddress: string;
  location?: {
    city?: string;
    country?: string;
  };
  isActive: boolean;
}

export interface Admin {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: 'owner' | 'manager';
  lastLoginDate?: Date;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userMobile: string;
  userEmail?: string;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderDate: Date;
  deliveryTime?: Date;
  notes?: string;
  customerAddress?: string;
  sessionId?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  userMobile: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentDate: Date;
  cardDetails?: {
    last4: string;
    brand: string;
  };
  sessionId?: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  totalSessions: number;
  activeSessions: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'spice' | 'vegetable' | 'meat' | 'dairy' | 'grain' | 'oil' | 'other';
  currentStock: number;
  unit: string;
  minThreshold: number;
  maxCapacity: number;
  costPerUnit: number;
  supplier: string;
  lastRestocked: Date;
  expiryDate?: Date;
  usedInDishes: string[];
  dailyConsumption: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'expired';
}

export interface PurchaseRecommendation {
  ingredientId: string;
  ingredientName: string;
  currentStock: number;
  recommendedQuantity: number;
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  daysUntilStockOut: number;
  affectedDishes: string[];
}