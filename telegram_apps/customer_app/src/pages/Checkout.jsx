import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { addressesAPI, ordersAPI } from '@/services/api';
import useCartStore from '@/store/cartStore';
import telegramService from '@/services/telegram';
import { formatCurrency } from '@/utils/formatters';
import { MapPin, CreditCard, Wallet, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

const AddressSelector = ({ addresses, selectedId, onSelect, onAddNew }) => {
  return (
    <div className="space-y-3">
      {addresses?.map((address) => (
        <button
          key={address.id}
          onClick={() => onSelect(address.id)}
          className={cn(
            'w-full text-left p-4 rounded-xl border-2 transition-all',
            selectedId === address.id
              ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {address.label && (
                <p className="font-semibold text-gray-900 dark:text-white mb-1">
                  {address.label}
                </p>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {address.street_address}
                {address.apartment && `, Apt ${address.apartment}`}
              </p>
              {address.delivery_instructions && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {address.delivery_instructions}
                </p>
              )}
            </div>
            {address.is_default && (
              <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-2 py-1 rounded">
                Default
              </span>
            )}
          </div>
        </button>
      ))}

      <button
        onClick={onAddNew}
        className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-600 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
      >
        <div className="flex items-center justify-center space-x-2 text-primary-600 dark:text-primary-400">
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add New Address</span>
        </div>
      </button>
    </div>
  );
};

const PaymentMethodSelector = ({ selected, onSelect }) => {
  const methods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
    { id: 'cash', name: 'Cash on Delivery', icon: Wallet }
  ];

  return (
    <div className="space-y-3">
      {methods.map((method) => (
        <button
          key={method.id}
          onClick={() => onSelect(method.id)}
          className={cn(
            'w-full p-4 rounded-xl border-2 transition-all',
            selected === method.id
              ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
          )}
        >
          <div className="flex items-center space-x-3">
            <method.icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">{method.name}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, clearCart, getTotal } = useCartStore();
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const { data: addresses, isLoading: loadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await addressesAPI.getAll();
      return response.data.data.addresses;
    }
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
  }, [items, navigate]);

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      const defaultAddress = addresses.find(addr => addr.is_default);
      setSelectedAddress(defaultAddress?.id || addresses[0].id);
    }
  }, [addresses, selectedAddress]);

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => ordersAPI.create(orderData),
    onSuccess: (response) => {
      const order = response.data.data.order;
      const payment = response.data.data.payment;

      clearCart();
      telegramService.hapticNotification('success');

      if (payment && payment.client_secret) {
        navigate(`/payment/${order.id}`, { 
          state: { clientSecret: payment.client_secret }
        });
      } else {
        navigate(`/orders/${order.id}`);
      }
    },
    onError: (error) => {
      telegramService.hapticNotification('error');
      alert(error.response?.data?.message || 'Failed to create order');
    }
  });

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    telegramService.hapticImpact('medium');

    const orderData = {
      items: items.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        special_instructions: item.special_instructions
      })),
      address_id: selectedAddress,
      payment_method: paymentMethod,
      delivery_notes: deliveryNotes
    };

    createOrderMutation.mutate(orderData);
  };

  const subtotal = getTotal();
  const deliveryFee = 5000;
  const total = subtotal + deliveryFee;

  if (loadingAddresses) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Complete your order</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Delivery Address */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
            Delivery Address
          </h2>
          <AddressSelector
            addresses={addresses}
            selectedId={selectedAddress}
            onSelect={setSelectedAddress}
            onAddNew={() => navigate('/addresses/new', { state: { returnTo: '/checkout' } })}
          />
        </div>

        {/* Payment Method */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
            Payment Method
          </h2>
          <PaymentMethodSelector
            selected={paymentMethod}
            onSelect={setPaymentMethod}
          />
        </div>

        {/* Delivery Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Delivery Instructions (Optional)
          </label>
          <textarea
            value={deliveryNotes}
            onChange={(e) => setDeliveryNotes(e.target.value)}
            rows={3}
            placeholder="e.g., Ring the doorbell, leave at the door..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Summary</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.menu_item_id} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {item.menuItem.name} x {item.quantity}
                </span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatCurrency(parseFloat(item.unit_price) * item.quantity)}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span>Delivery Fee</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 shadow-lg safe-bottom">
        <button
          onClick={handlePlaceOrder}
          disabled={!selectedAddress || createOrderMutation.isPending}
          className={cn(
            'w-full py-3 rounded-xl font-semibold transition-all shadow-sm',
            selectedAddress && !createOrderMutation.isPending
              ? 'bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          )}
        >
          {createOrderMutation.isPending ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Placing Order...
            </div>
          ) : (
            `Place Order • ${formatCurrency(total)}`
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;