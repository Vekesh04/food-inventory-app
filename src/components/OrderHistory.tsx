import React, { useState } from 'react';
import { Clock, Package, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Order } from '../types';

interface OrderHistoryProps {
  orders: Order[];
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <Package className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const sortedOrders = [...orders].sort((a, b) => 
    new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Order History</h3>
      
      {sortedOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h4>
          <p className="text-gray-500">Your order history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedOrders.map(order => (
            <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-900">Order #{order.id.slice(-8)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center space-x-1 text-orange-600 hover:text-orange-700 text-sm"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Date:</span>
                  <div className="font-medium">{order.orderDate.toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-gray-500">Items:</span>
                  <div className="font-medium">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <div className="font-medium">₹{order.total}</div>
                </div>
                <div>
                  <span className="text-gray-500">Payment:</span>
                  <div className="font-medium capitalize">{order.paymentMethod}</div>
                </div>
              </div>
              
              <div className="mt-3">
                <span className="text-gray-500 text-sm">Items:</span>
                <div className="text-sm text-gray-700 mt-1">
                  {order.items.slice(0, 2).map(item => `${item.name} (${item.quantity})`).join(', ')}
                  {order.items.length > 2 && ` +${order.items.length - 2} more`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Order ID</span>
                      <div className="font-medium">#{selectedOrder.id.slice(-8)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Status</span>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="capitalize">{selectedOrder.status}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Order Date</span>
                      <div className="font-medium">{selectedOrder.orderDate.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Payment Method</span>
                      <div className="font-medium capitalize">{selectedOrder.paymentMethod}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map(item => (
                        <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">₹{item.price} × {item.quantity}</div>
                          </div>
                          <div className="font-medium text-gray-900">
                            ₹{item.price * item.quantity}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount</span>
                      <span>₹{selectedOrder.total}</span>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div>
                      <span className="text-sm text-gray-500">Notes</span>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                        {selectedOrder.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;