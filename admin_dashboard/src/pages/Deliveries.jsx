import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { deliveriesAPI, ordersAPI } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { Truck, MapPin, Clock, Package } from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/utils/formatters';

const Deliveries = () => {
  const { data: deliveryStats, isLoading: loadingStats } = useQuery({
    queryKey: ['deliveryStatistics'],
    queryFn: async () => {
      const response = await deliveriesAPI.getStatistics();
      return response.data.data;
    }
  });

  const { data: activeDeliveries, isLoading: loadingActive } = useQuery({
    queryKey: ['activeDeliveries'],
    queryFn: async () => {
      const response = await ordersAPI.getAll({ 
        status: 'out_for_delivery',
        limit: 50
      });
      return response.data.data.orders;
    }
  });

  const getDeliveryStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      accepted: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      in_transit: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loadingStats || loadingActive) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
        <p className="text-gray-600 mt-1">Monitor active deliveries and partners</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {deliveryStats?.deliveries_by_status?.map((stat) => (
          <Card key={stat.status}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">
                    {stat.status.replace('_', ' ')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stat.count}
                  </p>
                </div>
                <Truck className="w-8 h-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle>Active Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          {activeDeliveries?.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active deliveries</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeDeliveries?.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="font-semibold text-lg">
                        {order.order_number}
                      </span>
                      <Badge className={getDeliveryStatusColor(order.delivery?.status)}>
                        {order.delivery?.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Customer</p>
                        <p className="font-medium">
                          {order.customer?.first_name} {order.customer?.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Delivery Partner</p>
                        <p className="font-medium">
                          {order.deliveryPartner ? 
                            `${order.deliveryPartner.first_name} ${order.deliveryPartner.last_name}` : 
                            'Unassigned'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Time</p>
                        <p className="font-medium">{formatDateTime(order.picked_up_at)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <MapPin className="w-5 h-5 text-primary-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Delivery Partners */}
      <Card>
        <CardHeader>
          <CardTitle>Top Delivery Partners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deliveryStats?.top_delivery_partners?.map((partner, index) => (
              <div
                key={partner.delivery_partner_id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full">
                    <span className="font-bold text-primary-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold">
                      {partner.deliveryPartner?.first_name} {partner.deliveryPartner?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {partner.delivery_count} deliveries completed
                    </p>
                  </div>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            ))}

            {deliveryStats?.top_delivery_partners?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No delivery partners yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Deliveries;