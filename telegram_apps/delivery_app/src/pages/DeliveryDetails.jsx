import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveriesAPI, ordersAPI } from '@/services/api';
import telegramService from '@/services/telegram';
import useLocationStore from '@/store/locationStore';
import { formatCurrency, formatDateTime } from '@/utils/formatters';
import {
  MapPin,
  Phone,
  Package,
  Navigation,
  CheckCircle,
  Clock
} from 'lucide-react';

const DeliveryDetails = () => {
  const { deliveryId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentLocation, startTracking, stopTracking, getCurrentPosition } = useLocationStore();
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const { data: delivery, isLoading } = useQuery({
    queryKey: ['delivery', deliveryId],
    queryFn: async () => {
      const response = await ordersAPI.getOne(deliveryId);
      return response.data.data.order;
    },
    refetchInterval: 10000
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (location) => {
      return await deliveriesAPI.updateLocation(deliveryId, location);
    }
  });

  const markPickedUpMutation = useMutation({
    mutationFn: () => deliveriesAPI.markPickedUp(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries(['delivery', deliveryId]);
      telegramService.hapticNotification('success');
      startTracking();
    }
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: () => deliveriesAPI.complete(deliveryId),
    onSuccess: () => {
      queryClient.invalidateQueries(['delivery', deliveryId]);
      queryClient.invalidateQueries(['myDeliveries']);
      telegramService.hapticNotification('success');
      stopTracking();
      alert('Delivery completed successfully!');
      navigate('/');
    }
  });

  useEffect(() => {
    telegramService.showBackButton(() => {
      navigate('/');
    });

    return () => {
      telegramService.hideBackButton();
      stopTracking();
    };
  }, [navigate]);

  // Update location periodically
  useEffect(() => {
    if (delivery?.delivery?.status === 'in_transit' && currentLocation) {
      const interval = setInterval(() => {
        if (!isUpdatingLocation) {
          setIsUpdatingLocation(true);
          updateLocationMutation.mutate(currentLocation, {
            onSettled: () => setIsUpdatingLocation(false)
          });
        }
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [delivery, currentLocation, isUpdatingLocation]);

  const handleMarkPickedUp = async () => {
    if (window.confirm('Confirm that you have picked up the order?')) {
      telegramService.hapticImpact('medium');
      markPickedUpMutation.mutate();
    }
  };

  const handleCompleteDelivery = async () => {
    if (window.confirm('Confirm delivery completion?')) {
      telegramService.hapticImpact('medium');
      completeDeliveryMutation.mutate();
    }
  };

  const openMap = (latitude, longitude) => {
    telegramService.hapticImpact('light');
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    telegramService.openLink(url);
  };

  const callCustomer = (phone) => {
    telegramService.hapticImpact('light');
    window.location.href = `tel:${phone}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Delivery not found
          </h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const order = delivery;
  const deliveryStatus = order.delivery?.status;
  const canPickUp = deliveryStatus === 'accepted';
  const canComplete = deliveryStatus === 'picked_up' || deliveryStatus === 'in_transit';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4">
        <h1 className="text-xl font-bold">Order #{order.order_number}</h1>
        <div className="flex items-center space-x-2 mt-2">
          <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
            {deliveryStatus}
          </span>
          <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
            {formatCurrency(order.total_amount)}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* Customer Information */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Customer Information
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">
                {order.customer?.first_name} {order.customer?.last_name}
              </p>
            </div>
            {order.customer?.phone && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Phone</p>
                <button
                  onClick={() => callCustomer(order.customer.phone)}
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  <Phone className="w-4 h-4" />
                  <span className="font-medium">{order.customer.phone}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Delivery Address
            </h2>
            {order.deliveryAddress?.latitude && order.deliveryAddress?.longitude && (
              <button
                onClick={() => openMap(
                  order.deliveryAddress.latitude,
                  order.deliveryAddress.longitude
                )}
                className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
              >
                <Navigation className="w-4 h-4" />
                <span className="text-sm font-medium">Navigate</span>
              </button>
            )}
          </div>
          
          <div className="flex items-start space-x-2">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-gray-900">
                {order.deliveryAddress?.street_address}
              </p>
              {order.deliveryAddress?.apartment && (
                <p className="text-sm text-gray-600">
                  Apartment: {order.deliveryAddress.apartment}
                </p>
              )}
              {order.deliveryAddress?.entrance && (
                <p className="text-sm text-gray-600">
                  Entrance: {order.deliveryAddress.entrance}
                </p>
              )}
              {order.deliveryAddress?.floor && (
                <p className="text-sm text-gray-600">
                  Floor: {order.deliveryAddress.floor}
                </p>
              )}
            </div>
          </div>

          {order.delivery_notes && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm text-gray-500 mb-1">Delivery Instructions</p>
              <p className="text-gray-700 italic">{order.delivery_notes}</p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Order Items ({order.items?.length})
          </h2>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {item.menuItem?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Qty: {item.quantity}
                  </p>
                  {item.special_instructions && (
                    <p className="text-xs text-gray-500 italic mt-1">
                      Note: {item.special_instructions}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery Fee</span>
              <span>{formatCurrency(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium text-gray-900 capitalize">
                {order.payment_method}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Payment Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                order.payment_status === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.payment_status}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Delivery Timeline
          </h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Order Accepted</p>
                <p className="text-sm text-gray-500">
                  {formatDateTime(order.delivery?.accepted_at || order.accepted_at)}
                </p>
              </div>
            </div>

            {order.delivery?.picked_up_at && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Picked Up</p>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(order.delivery.picked_up_at)}
                  </p>
                </div>
              </div>
            )}

            {order.delivery?.delivered_at && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Delivered</p>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(order.delivery.delivered_at)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        {canPickUp && (
          <button
            onClick={handleMarkPickedUp}
            disabled={markPickedUpMutation.isPending}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {markPickedUpMutation.isPending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Marking as Picked Up...
              </div>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 inline mr-2" />
                Mark as Picked Up
              </>
            )}
          </button>
        )}

        {canComplete && (
          <button
            onClick={handleCompleteDelivery}
            disabled={completeDeliveryMutation.isPending}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {completeDeliveryMutation.isPending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Completing...
              </div>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 inline mr-2" />
                Complete Delivery
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default DeliveryDetails;