import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '@/services/api';
import { getSocket } from '@/services/socket';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { Eye, RefreshCw, Filter } from 'lucide-react';
import { formatCurrency, formatDateTime, getOrderStatusColor, getOrderStatusLabel } from '@/utils/formatters';
import toast from 'react-hot-toast';

const OrderDetailsModal = ({ order, onClose, onStatusUpdate }) => {
  const [newStatus, setNewStatus] = useState(order.status);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (status) => ordersAPI.updateStatus(order.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['order', order.id]);
      toast.success('Order status updated!');
      onStatusUpdate?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });

  const handleStatusUpdate = () => {
    if (newStatus !== order.status) {
      updateStatusMutation.mutate(newStatus);
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="space-y-6">
      {/* Order Info */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Order Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="font-semibold">{order.order_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <Badge className={getOrderStatusColor(order.status)}>
              {getOrderStatusLabel(order.status)}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment Status</p>
            <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
              {order.payment_status}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment Method</p>
            <p className="font-semibold capitalize">{order.payment_method}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="font-semibold">{formatDateTime(order.created_at)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estimated Delivery</p>
            <p className="font-semibold">{formatDateTime(order.estimated_delivery_time)}</p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-semibold">
              {order.customer?.first_name} {order.customer?.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-semibold">{order.customer?.phone || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Delivery Address</h3>
        <p className="text-gray-700">
          {order.deliveryAddress?.street_address}
          {order.deliveryAddress?.apartment && `, Apt ${order.deliveryAddress.apartment}`}
          {order.deliveryAddress?.entrance && `, Entrance ${order.deliveryAddress.entrance}`}
          {order.deliveryAddress?.floor && `, Floor ${order.deliveryAddress.floor}`}
        </p>
        {order.delivery_notes && (
          <div className="mt-2">
            <p className="text-sm text-gray-500">Delivery Notes</p>
            <p className="text-gray-700">{order.delivery_notes}</p>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Order Items</h3>
        <div className="space-y-3">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">{item.menuItem?.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                {item.special_instructions && (
                  <p className="text-xs text-gray-500 italic">{item.special_instructions}</p>
                )}
              </div>
              <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="border-t pt-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery Fee</span>
            <span className="font-semibold">{formatCurrency(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Status Update */}
      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Update Status</h3>
          <div className="flex space-x-3">
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={statusOptions}
              className="flex-1"
            />
            <Button
              onClick={handleStatusUpdate}
              isLoading={updateStatusMutation.isPending}
              disabled={newStatus === order.status}
            >
              Update
            </Button>
          </div>
        </div>
      )}

      {/* Delivery Partner Info */}
      {order.deliveryPartner && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Delivery Partner</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-semibold">
                {order.deliveryPartner.first_name} {order.deliveryPartner.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-semibold">{order.deliveryPartner.phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};

const Orders = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    payment_status: ''
  });
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.payment_status) params.payment_status = filters.payment_status;
      
      const response = await ordersAPI.getAll(params);
      return response.data.data;
    }
  });

  // Real-time updates
  useEffect(() => {
    const socket = getSocket();
    
    if (socket) {
      socket.on('order_created', () => {
        queryClient.invalidateQueries(['orders']);
        toast.success('New order received!');
      });

      socket.on('order_updated', () => {
        queryClient.invalidateQueries(['orders']);
      });

      return () => {
        socket.off('order_created');
        socket.off('order_updated');
      };
    }
  }, [queryClient]);

  const handleViewOrder = async (orderId) => {
    const response = await ordersAPI.getOne(orderId);
    setSelectedOrder(response.data.data.order);
  };

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const paymentStatusOptions = [
    { value: '', label: 'All Payment Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">
            {ordersData?.total || 0} total orders
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={statusOptions}
              className="flex-1"
            />
            <Select
              value={filters.payment_status}
              onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}
              options={paymentStatusOptions}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordersData?.orders?.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.customer?.first_name} {order.customer?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer?.phone || order.customer?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getOrderStatusColor(order.status)}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                        {order.payment_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ordersData?.orders?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.order_number}`}
        size="lg"
      >
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusUpdate={() => {
              refetch();
              setSelectedOrder(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default Orders;