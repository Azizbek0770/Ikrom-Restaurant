import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '@/services/api';
import telegramService from '@/services/telegram';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Truck, 
  CheckCircle,
  Package,
  XCircle
} from 'lucide-react';
import { cn } from '@/utils/cn';

const StatusTimeline = ({ order }) => {
  const statuses = [
    { key: 'created_at', label: 'Order Placed', icon: Package },
    { key: 'accepted_at', label: 'Confirmed', icon: CheckCircle },
    { key: 'preparing_at', label: 'Preparing', icon: Clock },
    { key: 'ready_at', label: 'Ready', icon: CheckCircle },
    { key: 'picked_up_at', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered_at', label: 'Delivered', icon: CheckCircle }
  ];

  return (
    <div className="space-y-4">
      {statuses.map((status, index) => {
        const isCompleted = !!order[status.key];
        const isCurrent = isCompleted && !order[statuses[index + 1]?.key];

        return (
          <div key={status.key} className="flex items-start space-x-3">
            <div className={cn(
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
              isCompleted
                ? isCurrent
                  ? 'bg-primary-600 dark:bg-primary-500 text-white'
                  : 'bg-green-500 dark:bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            )}>
              <status.icon className="w-4 h-4" />
            </div>
            
            <div className="flex-1">
              <p className={cn(
                'font-medium',
                isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'
              )}>
                {status.label}
              </p>
              {isCompleted && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDateTime(order[status.key])}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await ordersAPI.getOne(orderId);
      return response.data.data.order;
    },
    refetchInterval: (data) => {
      return data?.status !== 'delivered' && data?.status !== 'cancelled' ? 10000 : false;
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (reason) => ordersAPI.cancel(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', orderId]);
      queryClient.invalidateQueries(['myOrders']);
      telegramService.hapticNotification('success');
      alert('Order cancelled successfully');
    },
    onError: (error) => {
      telegramService.hapticNotification('error');
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
  });

  const handleCancelOrder = () => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      telegramService.hapticImpact('medium');
      cancelOrderMutation.mutate('Cancelled by customer');
    }
  };

  const canCancel = order && ['pending', 'paid', 'confirmed'].includes(order.status);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Order not found
          </h2>
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-sm"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Order #{order.order_number}
        </h1>
        <div className="flex items-center space-x-2 mt-2">
          <span className={cn(
            'px-3 py-1 text-sm font-medium rounded-full',
            order.status === 'delivered'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : order.status === 'cancelled'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
          )}>
            {order.status.replace('_', ' ')}
          </span>
          <span className={cn(
            'px-3 py-1 text-sm font-medium rounded-full',
            order.payment_status === 'paid'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
          )}>
            Payment: {order.payment_status}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Status Timeline */}
        {order.status !== 'cancelled' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Order Status
            </h2>
            <StatusTimeline order={order} />
          </div>
        )}

        {/* Delivery Address */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
            Delivery Address
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            {order.deliveryAddress?.street_address}
            {order.deliveryAddress?.apartment && `, Apt ${order.deliveryAddress.apartment}`}
            {order.deliveryAddress?.entrance && `, Entrance ${order.deliveryAddress.entrance}`}
            {order.deliveryAddress?.floor && `, Floor ${order.deliveryAddress.floor}`}
          </p>
          {order.delivery_notes && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Delivery Instructions:</p>
              <p className="text-gray-700 dark:text-gray-300">{order.delivery_notes}</p>
            </div>
          )}
        </div>

        {/* Delivery Partner */}
        {order.deliveryPartner && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
              Delivery Partner
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.deliveryPartner.first_name} {order.deliveryPartner.last_name}
                </p>
                {order.deliveryPartner.phone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                    <Phone className="w-4 h-4 mr-1" />
                    {order.deliveryPartner.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Order Items
          </h2>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-start pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.menuItem?.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                  </p>
                  {item.special_instructions && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                      Note: {item.special_instructions}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Order Summary
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Delivery Fee</span>
              <span>{formatCurrency(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-800">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Payment Method: <span className="font-medium capitalize text-gray-900 dark:text-white">{order.payment_method}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ordered: <span className="font-medium text-gray-900 dark:text-white">{formatDateTime(order.created_at)}</span>
            </p>
            {order.estimated_delivery_time && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Estimated Delivery: <span className="font-medium text-gray-900 dark:text-white">{formatDateTime(order.estimated_delivery_time)}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Order Button */}
      {canCancel && (
        <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 shadow-lg safe-bottom">
          <button
            onClick={handleCancelOrder}
            disabled={cancelOrderMutation.isPending}
            className={cn(
              'w-full py-3 rounded-xl font-semibold transition-all shadow-sm',
              cancelOrderMutation.isPending
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700'
            )}
          >
            {cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;