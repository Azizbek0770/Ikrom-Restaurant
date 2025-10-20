import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deliveriesAPI } from '@/services/api';
import telegramService from '@/services/telegram';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Package, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  </div>
);

const DeliveryHistoryCard = ({ delivery, onClick }) => {
  const order = delivery.order;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">
            Order #{order?.order_number}
          </p>
          <p className="text-sm text-gray-500">
            {formatDate(delivery.delivered_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">
            {formatCurrency(order?.total_amount)}
          </p>
          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full mt-1">
            Completed
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{order?.items?.length || 0} items</span>
        {delivery.distance_km && (
          <span>~{delivery.distance_km} km</span>
        )}
      </div>
    </button>
  );
};

const History = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('today'); // today, week, month, all

  const { data: completedDeliveries, isLoading } = useQuery({
    queryKey: ['completedDeliveries', dateRange],
    queryFn: async () => {
      const response = await deliveriesAPI.getMy({ status: 'delivered' });
      return response.data.data.deliveries;
    }
  });

  React.useEffect(() => {
    telegramService.showBackButton(() => {
      navigate('/');
    });

    return () => {
      telegramService.hideBackButton();
    };
  }, [navigate]);

  const handleDeliveryClick = (deliveryId) => {
    telegramService.hapticImpact('light');
    navigate(`/delivery/${deliveryId}`);
  };

  // Calculate statistics
  const stats = {
    total: completedDeliveries?.length || 0,
    earnings: completedDeliveries?.reduce((sum, d) => sum + parseFloat(d.order?.total_amount || 0), 0) || 0,
    avgPerDelivery: completedDeliveries?.length 
      ? (completedDeliveries.reduce((sum, d) => sum + parseFloat(d.order?.total_amount || 0), 0) / completedDeliveries.length)
      : 0
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4">
        <h1 className="text-2xl font-bold">Delivery History</h1>
        <p className="text-primary-100 mt-1">Your completed deliveries</p>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <StatCard
            icon={CheckCircle}
            label="Completed Deliveries"
            value={stats.total}
          />
          <StatCard
            icon={TrendingUp}
            label="Total Earnings"
            value={formatCurrency(stats.earnings)}
          />
          <StatCard
            icon={Package}
            label="Avg per Delivery"
            value={formatCurrency(stats.avgPerDelivery)}
          />
        </div>

        {/* Deliveries List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Recent Deliveries</h2>
          
          {completedDeliveries?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No completed deliveries
              </h3>
              <p className="text-gray-600">
                Your delivery history will appear here
              </p>
            </div>
          ) : (
            completedDeliveries?.map((delivery) => (
              <DeliveryHistoryCard
                key={delivery.id}
                delivery={delivery}
                onClick={() => handleDeliveryClick(delivery.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default History;