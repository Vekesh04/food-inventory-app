import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Check, 
  X, 
  Calendar,
  DollarSign,
  Package,
  Truck,
  AlertTriangle,
  TrendingUp,
  FileText,
  Download
} from 'lucide-react';
import { InventoryItem, PurchaseRecommendation, Order } from '../types';

interface PurchaseOrder {
  id: string;
  items: {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
    totalCost: number;
    supplier: string;
  }[];
  totalAmount: number;
  status: 'pending' | 'ordered' | 'delivered' | 'cancelled';
  orderDate: Date;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
}

interface PurchaseManagementProps {
  inventory: InventoryItem[];
  recommendations: PurchaseRecommendation[];
  orders: Order[];
  onCreatePurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'orderDate'>) => void;
  onUpdateInventoryAfterPurchase: (updates: { ingredientId: string; addedStock: number }[]) => void;
}

const PurchaseManagement: React.FC<PurchaseManagementProps> = ({
  inventory,
  recommendations,
  orders,
  onCreatePurchaseOrder,
  onUpdateInventoryAfterPurchase
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customQuantities, setCustomQuantities] = useState<{ [key: string]: number }>({});
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');

  // Calculate purchase suggestions based on usage patterns
  const purchaseSuggestions = useMemo(() => {
    const suggestions: PurchaseRecommendation[] = [];
    
    // Add existing recommendations
    suggestions.push(...recommendations);
    
    // Add additional suggestions based on usage patterns
    inventory.forEach(item => {
      if (!recommendations.find(rec => rec.ingredientId === item.id)) {
        const daysUntilStockOut = Math.floor(item.currentStock / Math.max(item.dailyConsumption, 1));
        
        if (daysUntilStockOut <= 14 && item.currentStock < item.maxCapacity * 0.7) {
          suggestions.push({
            ingredientId: item.id,
            ingredientName: item.name,
            currentStock: item.currentStock,
            recommendedQuantity: Math.floor(item.maxCapacity * 0.8) - item.currentStock,
            estimatedCost: (Math.floor(item.maxCapacity * 0.8) - item.currentStock) * item.costPerUnit,
            priority: daysUntilStockOut <= 7 ? 'high' : daysUntilStockOut <= 14 ? 'medium' : 'low',
            reason: `Stock will last ${daysUntilStockOut} days at current usage rate`,
            daysUntilStockOut,
            affectedDishes: item.usedInDishes
          });
        }
      }
    });
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [inventory, recommendations]);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setCustomQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, quantity)
    }));
  };

  const getItemQuantity = (itemId: string) => {
    const suggestion = purchaseSuggestions.find(s => s.ingredientId === itemId);
    return customQuantities[itemId] ?? suggestion?.recommendedQuantity ?? 0;
  };

  const selectedSuggestions = purchaseSuggestions.filter(suggestion => 
    selectedItems.includes(suggestion.ingredientId)
  );

  const totalCost = selectedSuggestions.reduce((sum, suggestion) => {
    const quantity = getItemQuantity(suggestion.ingredientId);
    const item = inventory.find(inv => inv.id === suggestion.ingredientId);
    return sum + (quantity * (item?.costPerUnit || 0));
  }, 0);

  const handleCreatePurchaseOrder = () => {
    if (selectedSuggestions.length === 0) return;

    const orderItems = selectedSuggestions.map(suggestion => {
      const item = inventory.find(inv => inv.id === suggestion.ingredientId)!;
      const quantity = getItemQuantity(suggestion.ingredientId);
      
      return {
        ingredientId: suggestion.ingredientId,
        ingredientName: suggestion.ingredientName,
        quantity,
        unit: item.unit,
        costPerUnit: item.costPerUnit,
        totalCost: quantity * item.costPerUnit,
        supplier: item.supplier
      };
    });

    const newOrder: Omit<PurchaseOrder, 'id' | 'orderDate'> = {
      items: orderItems,
      totalAmount: totalCost,
      status: 'pending',
      expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      notes: orderNotes
    };

    onCreatePurchaseOrder(newOrder);
    
    // Add to local state for display
    const fullOrder: PurchaseOrder = {
      ...newOrder,
      id: `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderDate: new Date()
    };
    
    setPurchaseOrders(prev => [fullOrder, ...prev]);
    
    // Reset form
    setSelectedItems([]);
    setCustomQuantities({});
    setOrderNotes('');
    setShowCreateOrder(false);
    
    alert(`Purchase order created successfully!\nOrder ID: ${fullOrder.id}\nTotal: ₹${totalCost.toFixed(2)}`);
  };

  const handleMarkAsDelivered = (orderId: string) => {
    const order = purchaseOrders.find(o => o.id === orderId);
    if (!order) return;

    // Update inventory
    const updates = order.items.map(item => ({
      ingredientId: item.ingredientId,
      addedStock: item.quantity
    }));
    
    onUpdateInventoryAfterPurchase(updates);
    
    // Update order status
    setPurchaseOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { ...o, status: 'delivered' as const, actualDelivery: new Date() }
        : o
    ));
    
    alert('Order marked as delivered and inventory updated!');
  };

  const getPriorityColor = (priority: PurchaseRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Management</h2>
          <p className="text-gray-600">Manage ingredient purchases and supplier orders</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateOrder(true)}
            disabled={selectedItems.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Create Purchase Order ({selectedItems.length})</span>
          </button>
        </div>
      </div>

      {/* Purchase Summary */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Purchase Summary</h3>
              <p className="text-blue-700">{selectedItems.length} items selected</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">₹{totalCost.toFixed(2)}</div>
              <div className="text-blue-700">Total estimated cost</div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Suggestions */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Purchase Suggestions</h3>
          <p className="text-gray-600">Based on current stock levels and usage patterns</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {purchaseSuggestions.map(suggestion => {
              const isSelected = selectedItems.includes(suggestion.ingredientId);
              const quantity = getItemQuantity(suggestion.ingredientId);
              const item = inventory.find(inv => inv.id === suggestion.ingredientId);
              
              return (
                <div
                  key={suggestion.ingredientId}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleToggleItem(suggestion.ingredientId)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{suggestion.ingredientName}</h4>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleItem(suggestion.ingredientId)}
                      className="h-5 w-5 text-blue-600 rounded"
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Stock:</span>
                      <span className="font-medium">{suggestion.currentStock}{item?.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Suggested Quantity:</span>
                      <span className="font-medium text-green-600">{suggestion.recommendedQuantity}{item?.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost per {item?.unit}:</span>
                      <span className="font-medium">₹{item?.costPerUnit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Cost:</span>
                      <span className="font-medium">₹{(quantity * (item?.costPerUnit || 0)).toFixed(2)}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Quantity:
                      </label>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuantityChange(suggestion.ingredientId, quantity - 10);
                          }}
                          className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleQuantityChange(suggestion.ingredientId, parseInt(e.target.value) || 0);
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          min="0"
                        />
                        <span className="text-sm text-gray-600">{item?.unit}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuantityChange(suggestion.ingredientId, quantity + 10);
                          }}
                          className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">{suggestion.reason}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      Supplier: {item?.supplier} | Affects: {suggestion.affectedDishes.slice(0, 2).join(', ')}
                      {suggestion.affectedDishes.length > 2 && ` +${suggestion.affectedDishes.length - 2} more`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Purchase Orders */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Purchase Orders</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Delivery</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{order.id.slice(-8)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {order.items.length} items
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.items.slice(0, 2).map(item => item.ingredientName).join(', ')}
                      {order.items.length > 2 && ` +${order.items.length - 2} more`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₹{order.totalAmount.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.orderDate.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.expectedDelivery?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {order.status === 'ordered' && (
                      <button
                        onClick={() => handleMarkAsDelivered(order.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {purchaseOrders.length === 0 && (
          <div className="text-center py-12">
            <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Purchase Orders</h4>
            <p className="text-gray-500">Create your first purchase order to get started</p>
          </div>
        )}
      </div>

      {/* Create Order Confirmation Modal */}
      {showCreateOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateOrder(false)} />
          
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Confirm Purchase Order</h3>
                  <button
                    onClick={() => setShowCreateOrder(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Order Items */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {selectedSuggestions.map(suggestion => {
                        const item = inventory.find(inv => inv.id === suggestion.ingredientId);
                        const quantity = getItemQuantity(suggestion.ingredientId);
                        const cost = quantity * (item?.costPerUnit || 0);
                        
                        return (
                          <div key={suggestion.ingredientId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{suggestion.ingredientName}</div>
                              <div className="text-sm text-gray-500">Supplier: {item?.supplier}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">{quantity}{item?.unit}</div>
                              <div className="text-sm text-gray-500">₹{cost.toFixed(2)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes (Optional)</label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add any special instructions or notes..."
                    />
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span>₹{totalCost.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCreatePurchaseOrder}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      <span>Create Purchase Order</span>
                    </button>
                    <button
                      onClick={() => setShowCreateOrder(false)}
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

export default PurchaseManagement;