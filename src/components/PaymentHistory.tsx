import React from 'react';
import { CreditCard, Banknote, Smartphone, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import { Payment } from '../types';

interface PaymentHistoryProps {
  payments: Payment[];
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments }) => {
  const getPaymentIcon = (method: Payment['method']) => {
    switch (method) {
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'upi': return <Smartphone className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'refunded': return <RotateCcw className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const sortedPayments = [...payments].sort((a, b) => 
    new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        <div className="flex space-x-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-green-600">₹{totalPaid}</div>
            <div className="text-gray-500">Total Paid</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-blue-600">₹{totalRefunded}</div>
            <div className="text-gray-500">Refunded</div>
          </div>
        </div>
      </div>
      
      {sortedPayments.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h4>
          <p className="text-gray-500">Your payment history will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPayments.map(payment => (
            <div key={payment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg">
                    {getPaymentIcon(payment.method)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Payment #{payment.id.slice(-8)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Order #{payment.orderId.slice(-8)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-900">₹{payment.amount}</div>
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    <span className="capitalize">{payment.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Date:</span>
                  <div className="font-medium">{payment.paymentDate.toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-gray-500">Method:</span>
                  <div className="font-medium capitalize">{payment.method}</div>
                </div>
                <div>
                  <span className="text-gray-500">Time:</span>
                  <div className="font-medium">{payment.paymentDate.toLocaleTimeString()}</div>
                </div>
                <div>
                  <span className="text-gray-500">Transaction ID:</span>
                  <div className="font-medium text-xs">
                    {payment.transactionId || 'N/A'}
                  </div>
                </div>
              </div>

              {payment.cardDetails && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{payment.cardDetails.brand}</span> ending in {payment.cardDetails.last4}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;