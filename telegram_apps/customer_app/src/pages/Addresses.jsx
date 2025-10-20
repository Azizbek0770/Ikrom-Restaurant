import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressesAPI } from '@/services/api';
import telegramService from '@/services/telegram';
import { MapPin, Plus, Edit2, Trash2, Star } from 'lucide-react';
import { cn } from '@/utils/cn';

const AddressCard = ({ address, onEdit, onDelete, onSetDefault }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          {address.label && (
            <span className="font-semibold text-gray-900 dark:text-white">{address.label}</span>
          )}
        </div>
        {address.is_default && (
          <span className="flex items-center text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-2 py-1 rounded-full">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Default
          </span>
        )}
      </div>

      <p className="text-gray-700 dark:text-gray-300 mb-1">
        {address.street_address}
        {address.apartment && `, Apt ${address.apartment}`}
      </p>
      {address.entrance && (
        <p className="text-sm text-gray-600 dark:text-gray-400">Entrance: {address.entrance}</p>
      )}
      {address.floor && (
        <p className="text-sm text-gray-600 dark:text-gray-400">Floor: {address.floor}</p>
      )}
      {address.delivery_instructions && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
          {address.delivery_instructions}
        </p>
      )}

      <div className="flex space-x-2 mt-4">
        {!address.is_default && (
          <button
            onClick={() => onSetDefault(address.id)}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Set as Default
          </button>
        )}
        <button
          onClick={() => onEdit(address)}
          className="flex-1 px-3 py-2 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 flex items-center justify-center transition-colors"
        >
          <Edit2 className="w-4 h-4 mr-1" />
          Edit
        </button>
        <button
          onClick={() => onDelete(address.id)}
          className="px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const Addresses = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const response = await addressesAPI.getAll();
      return response.data.data.addresses;
    }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id) => addressesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses']);
      telegramService.hapticNotification('success');
    },
    onError: () => {
      telegramService.hapticNotification('error');
      alert('Failed to delete address');
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id) => addressesAPI.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses']);
      telegramService.hapticNotification('success');
    }
  });

  const handleEdit = (address) => {
    telegramService.hapticImpact('light');
    navigate(`/addresses/edit/${address.id}`, { state: { address } });
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this address?')) {
      telegramService.hapticImpact('medium');
      deleteAddressMutation.mutate(id);
    }
  };

  const handleSetDefault = (id) => {
    telegramService.hapticImpact('light');
    setDefaultMutation.mutate(id);
  };

  const handleAddNew = () => {
    telegramService.hapticImpact('light');
    navigate('/addresses/new');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Addresses</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {addresses?.length || 0} saved {addresses?.length === 1 ? 'address' : 'addresses'}
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="p-2.5 bg-primary-600 dark:bg-primary-500 text-white rounded-xl hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-sm"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Addresses List */}
      <div className="p-4 space-y-4">
        {addresses?.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-12 h-12 text-gray-400 dark:text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No addresses saved
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add your delivery address to get started
            </p>
            <button
              onClick={handleAddNew}
              className="px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-sm"
            >
              Add Address
            </button>
          </div>
        ) : (
          addresses?.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Addresses;