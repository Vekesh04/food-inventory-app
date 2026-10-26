import { InventoryItem, PurchaseRecommendation, MenuItem, Order } from '../types';

// Sample inventory data
export const generateInventoryData = (menuItems: MenuItem[]): InventoryItem[] => {
  const ingredientMap = new Map<string, {
    dishes: string[];
    totalUsage: number;
    unit: string;
  }>();

  // Analyze menu items to understand ingredient usage
  menuItems.forEach(item => {
    item.ingredients.forEach(ingredient => {
      const key = ingredient.name.toLowerCase();
      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        existing.dishes.push(item.name);
        existing.totalUsage += ingredient.amount;
      } else {
        ingredientMap.set(key, {
          dishes: [item.name],
          totalUsage: ingredient.amount,
          unit: ingredient.unit
        });
      }
    });
  });

  const categories = ['spice', 'vegetable', 'meat', 'dairy', 'grain', 'oil', 'other'] as const;
  const suppliers = ['Fresh Mart', 'Spice Palace', 'Green Valley', 'Metro Wholesale', 'Local Vendor'];

  return Array.from(ingredientMap.entries()).map(([name, data], index) => {
    const baseStock = Math.floor(Math.random() * 100) + 20;
    const minThreshold = Math.floor(baseStock * 0.2);
    const maxCapacity = baseStock * 3;
    const dailyConsumption = Math.floor(data.totalUsage / 10) + 1;
    
    let status: InventoryItem['status'] = 'in-stock';
    if (baseStock <= minThreshold) status = 'low-stock';
    if (baseStock === 0) status = 'out-of-stock';

    const category = getIngredientCategory(name);
    
    return {
      id: `inv_${index + 1}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      category,
      currentStock: baseStock,
      unit: data.unit,
      minThreshold,
      maxCapacity,
      costPerUnit: getCostPerUnit(category, data.unit),
      supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      lastRestocked: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      expiryDate: category === 'vegetable' || category === 'dairy' || category === 'meat' 
        ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) 
        : undefined,
      usedInDishes: data.dishes.slice(0, 5),
      dailyConsumption,
      status
    };
  });
};

const getIngredientCategory = (name: string): InventoryItem['category'] => {
  const spices = ['cumin', 'coriander', 'turmeric', 'chili', 'garam masala', 'cardamom', 'cinnamon', 'cloves', 'bay leaves', 'mustard seeds', 'fenugreek', 'asafoetida'];
  const vegetables = ['onion', 'tomato', 'garlic', 'ginger', 'potato', 'carrot', 'peas', 'spinach', 'cauliflower', 'bell pepper', 'green chili', 'curry leaves'];
  const meat = ['chicken', 'mutton', 'fish', 'prawns', 'lamb', 'beef'];
  const dairy = ['milk', 'yogurt', 'cream', 'butter', 'ghee', 'paneer', 'cheese'];
  const grains = ['rice', 'wheat', 'flour', 'lentils', 'chickpeas', 'kidney beans', 'black gram'];
  const oils = ['oil', 'coconut oil', 'mustard oil', 'ghee'];

  const lowerName = name.toLowerCase();
  
  if (spices.some(spice => lowerName.includes(spice))) return 'spice';
  if (vegetables.some(veg => lowerName.includes(veg))) return 'vegetable';
  if (meat.some(m => lowerName.includes(m))) return 'meat';
  if (dairy.some(d => lowerName.includes(d))) return 'dairy';
  if (grains.some(g => lowerName.includes(g))) return 'grain';
  if (oils.some(o => lowerName.includes(o))) return 'oil';
  
  return 'other';
};

const getCostPerUnit = (category: InventoryItem['category'], unit: string): number => {
  const baseCosts = {
    spice: { g: 2, kg: 800, piece: 5 },
    vegetable: { g: 0.5, kg: 50, piece: 10 },
    meat: { g: 8, kg: 600, piece: 200 },
    dairy: { g: 1, kg: 80, piece: 30, ml: 0.8, l: 60 },
    grain: { g: 0.3, kg: 40, piece: 2 },
    oil: { g: 1.2, kg: 120, ml: 1, l: 100 },
    other: { g: 1, kg: 100, piece: 15 }
  };

  return baseCosts[category][unit as keyof typeof baseCosts[typeof category]] || 1;
};

export const generatePurchaseRecommendations = (
  inventory: InventoryItem[],
  orders: Order[]
): PurchaseRecommendation[] => {
  const recommendations: PurchaseRecommendation[] = [];

  inventory.forEach(item => {
    const daysUntilStockOut = Math.floor(item.currentStock / Math.max(item.dailyConsumption, 1));
    let priority: 'high' | 'medium' | 'low' = 'low';
    let reason = '';
    let recommendedQuantity = 0;

    if (item.status === 'out-of-stock') {
      priority = 'high';
      reason = 'Out of stock - immediate restocking required';
      recommendedQuantity = item.maxCapacity;
    } else if (item.status === 'low-stock') {
      priority = 'high';
      reason = `Low stock - only ${item.currentStock}${item.unit} remaining`;
      recommendedQuantity = item.maxCapacity - item.currentStock;
    } else if (daysUntilStockOut <= 3) {
      priority = 'high';
      reason = `Will run out in ${daysUntilStockOut} days`;
      recommendedQuantity = Math.floor(item.maxCapacity * 0.8);
    } else if (daysUntilStockOut <= 7) {
      priority = 'medium';
      reason = `Will run out in ${daysUntilStockOut} days`;
      recommendedQuantity = Math.floor(item.maxCapacity * 0.6);
    } else if (item.currentStock < item.maxCapacity * 0.5) {
      priority = 'low';
      reason = 'Stock below 50% capacity';
      recommendedQuantity = Math.floor(item.maxCapacity * 0.3);
    }

    // Check for expiry
    if (item.expiryDate) {
      const daysUntilExpiry = Math.floor((item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 2) {
        priority = 'high';
        reason = `Expires in ${daysUntilExpiry} days - replace immediately`;
        recommendedQuantity = item.maxCapacity;
      }
    }

    if (recommendedQuantity > 0) {
      recommendations.push({
        ingredientId: item.id,
        ingredientName: item.name,
        currentStock: item.currentStock,
        recommendedQuantity,
        estimatedCost: recommendedQuantity * item.costPerUnit,
        priority,
        reason,
        daysUntilStockOut,
        affectedDishes: item.usedInDishes
      });
    }
  });

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

export const getInventoryStats = (inventory: InventoryItem[]) => {
  const totalItems = inventory.length;
  const inStock = inventory.filter(item => item.status === 'in-stock').length;
  const lowStock = inventory.filter(item => item.status === 'low-stock').length;
  const outOfStock = inventory.filter(item => item.status === 'out-of-stock').length;
  const expired = inventory.filter(item => item.status === 'expired').length;
  
  const totalValue = inventory.reduce((sum, item) => 
    sum + (item.currentStock * item.costPerUnit), 0
  );

  const expiringItems = inventory.filter(item => {
    if (!item.expiryDate) return false;
    const daysUntilExpiry = Math.floor((item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7;
  }).length;

  return {
    totalItems,
    inStock,
    lowStock,
    outOfStock,
    expired,
    totalValue,
    expiringItems,
    stockPercentage: Math.round((inStock / totalItems) * 100)
  };
};