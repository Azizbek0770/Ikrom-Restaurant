import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '@/services/api';
import telegramService from '@/services/telegram';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { Package, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

const OrderCard = ({ order, onClick }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'out_for_delivery':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'preparing':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    }
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all text-left group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon(order.status)}
          <span className="font-semibold text-gray-900 dark:text-white">
            Order #{order.order_number}
          </span>
        </div>
        <span className={cn(
          'px-3 py-1 text-xs font-medium rounded-full',
          getStatusColor(order.status)
        )}>
          {order.status.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Items</span>
          <span>{order.items?.length || 0} items</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Total</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(order.total_amount)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {formatDateTime(order.created_at)}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
        </div>
      </div>
    </button>
  );
};

const Orders = () => {
  const navigate = useNavigate();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const response = await ordersAPI.getMy({ limit: 50 });
      return response.data.data;
    }
  });

  const handleOrderClick = (orderId) => {
    telegramService.hapticImpact('light');
    navigate(`/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {ordersData?.orders?.length || 0} {ordersData?.orders?.length === 1 ? 'order' : 'orders'}
        </p>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-4">
        {ordersData?.orders?.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-12 h-12 text-gray-400 dark:text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No orders yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start ordering from our delicious menu
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-sm"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          ordersData?.orders?.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => handleOrderClick(order.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;