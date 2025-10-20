import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { deliveriesAPI } from '@/services/api';
import telegramService from '@/services/telegram';
import { formatCurrency, formatTimeAgo } from '@/utils/formatters';
import { 
  Package, 
  MapPin, 
  Clock, 
  DollarSign,
  TrendingUp,
  CheckCircle
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
};

const AvailableDeliveryCard = ({ delivery, onAccept }) => {
  const order = delivery.order;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            Order #{order.order_number}
          </h3>
          <p className="text-sm text-gray-500">{formatTimeAgo(order.created_at)}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-gray-900">
            {formatCurrency(order.total_amount)}
          </p>
          {delivery.distance_km && (
            <p className="text-sm text-gray-600">~{delivery.distance_km} km</p>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-start space-x-2 text-sm">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-gray-700">
            {order.deliveryAddress?.street_address}
            {order.deliveryAddress?.apartment && `, Apt ${order.deliveryAddress.apartment}`}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <Package className="w-4 h-4 text-gray-400" />
          <p className="text-gray-600">{order.items?.length || 0} items</p>
        </div>

        {order.delivery_notes && (
          <div className="flex items-start space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600 italic">{order.delivery_notes}</p>
          </div>
        )}
      </div>

      <button
        onClick={() => onAccept(delivery.id)}
        className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
      >
        Accept Delivery
      </button>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'active'
  const { user } = useAuthStore();
  const { data: categories } = useQuery({
    queryKey: ['categories-dashboard'],
    queryFn: async () => (await categoriesAPI.getAll()).data.data.categories
  });

  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const { data: availableDeliveries, isLoading: loadingAvailable, refetch: refetchAvailable } = useQuery({
    queryKey: ['availableDeliveries'],
    queryFn: async () => {
      const response = await deliveriesAPI.getAvailable();
      return response.data.data.deliveries;
    },
    refetchInterval: 15000, // Refetch every 15 seconds
    enabled: isAuthenticated
  });

  const { data: myDeliveries, isLoading: loadingMy, refetch: refetchMy } = useQuery({
    queryKey: ['myDeliveries'],
    queryFn: async () => {
      const response = await deliveriesAPI.getMy({ 
        status: 'accepted,picked_up,in_transit' 
      });
      return response.data.data.deliveries;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    enabled: isAuthenticated
  });

  const handleAcceptDelivery = async (deliveryId) => {
    try {
      telegramService.hapticImpact('medium');
      await deliveriesAPI.accept(deliveryId);
      telegramService.hapticNotification('success');
      
      // Refetch both lists
      refetchAvailable();
      refetchMy();
      
      // Navigate to active delivery
      navigate(`/delivery/${deliveryId}`);
    } catch (error) {
      telegramService.hapticNotification('error');
      alert(error.response?.data?.message || 'Failed to accept delivery');
    }
  };

  const handleDeliveryClick = (deliveryId) => {
    telegramService.hapticImpact('light');
    navigate(`/delivery/${deliveryId}`);
  };

  // Calculate stats
  const stats = {
    available: availableDeliveries?.length || 0,
    active: myDeliveries?.length || 0,
    completed: 0, // Could fetch from API
    earnings: 0 // Could fetch from API
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 flex items-center justify-between space-x-4">
        <h1 className="text-2xl font-bold">Delivery Dashboard</h1>
        <p className="text-primary-100 mt-1">Welcome back, Partner!</p>
        <img src={user?.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-2 gap-4 overflow-y-auto">
        <StatCard
          icon={Package}
          label="Available"
          value={stats.available}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Active"
          value={stats.active}
          color="orange"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed Today"
          value={stats.completed}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          label="Today's Earnings"
          value={formatCurrency(stats.earnings)}
          color="purple"
        />
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-lg p-1 flex shadow-sm border border-gray-200">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'available'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Available ({stats.available})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active ({stats.active})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {activeTab === 'available' ? (
          // Available Deliveries
          loadingAvailable ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : availableDeliveries?.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No deliveries available
              </h3>
              <p className="text-gray-600">
                New deliveries will appear here
              </p>
            </div>
          ) : (
            availableDeliveries?.map((delivery) => (
              <AvailableDeliveryCard
                key={delivery.id}
                delivery={delivery}
                onAccept={handleAcceptDelivery}
              />
            ))
          )
        ) : (
          // Active Deliveries
          loadingMy ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : myDeliveries?.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No active deliveries
              </h3>
              <p className="text-gray-600">
                Accept a delivery to get started
              </p>
            </div>
          ) : (
            myDeliveries?.map((delivery) => (
              <button
                key={delivery.id}
                onClick={() => handleDeliveryClick(delivery.id)}
                className="w-full bg-white rounded-lg p-4 shadow-sm border-2 border-primary-200 text-left hover:border-primary-400 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">
                    Order #{delivery.order?.order_number}
                  </span>
                  <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                    {delivery.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <p className="line-clamp-1">
                    {delivery.order?.deliveryAddress?.street_address}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-gray-600">
                    {delivery.order?.items?.length || 0} items
                  </span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(delivery.order?.total_amount)}
                  </span>
                </div>
              </button>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default Dashboard;