import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressesAPI } from '@/services/api';
import telegramService from '@/services/telegram';
import MapPicker from '@/components/MapPicker';

const AddressForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/addresses';
  const queryClient = useQueryClient();

  // Simplified form: label, delivery instructions (description), location (picked on map), is_default
  const [form, setForm] = useState({
    label: '',
    street_address: '',
    latitude: '',
    longitude: '',
    is_default: false,
    delivery_instructions: ''
  });

  const { data: addressData, isLoading } = useQuery({
    queryKey: ['address', id],
    enabled: !!id,
    queryFn: async () => {
      const resp = await addressesAPI.getOne(id);
      return resp.data.data.address;
    }
  });

  useEffect(() => {
    if (addressData) {
      setForm({
        label: addressData.label || '',
        street_address: addressData.street_address || '',
        latitude: addressData.latitude || '',
        longitude: addressData.longitude || '',
        is_default: !!addressData.is_default,
        delivery_instructions: addressData.delivery_instructions || ''
      });
    }
  }, [addressData]);

  const createMutation = useMutation({
    mutationFn: (payload) => addressesAPI.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses']);
      telegramService.hapticNotification('success');
      navigate(returnTo);
    },
    onError: () => {
      telegramService.hapticNotification('error');
      alert('Failed to create address');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => addressesAPI.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses']);
      telegramService.hapticNotification('success');
      navigate(returnTo);
    },
    onError: () => {
      telegramService.hapticNotification('error');
      alert('Failed to update address');
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleMapChange = ({ latitude, longitude, street_address }) => {
    setForm((s) => ({ ...s, latitude, longitude, street_address }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // validate required fields: delivery_instructions and location/street_address
    if (!form.delivery_instructions || !form.delivery_instructions.trim()) {
      alert('Please add a description for the address');
      return;
    }
    if (!form.latitude || !form.longitude) {
      alert('Please select a location on the map');
      return;
    }

    const payload = {
      label: form.label,
      street_address: form.street_address || '',
      latitude: form.latitude ? parseFloat(form.latitude) : undefined,
      longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      is_default: !!form.is_default,
      delivery_instructions: form.delivery_instructions
    };
    telegramService.hapticImpact('light');
    if (id) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">{id ? 'Edit Address' : 'Add Address'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select location on map (required)</label>
            <MapPicker initialLat={form.latitude} initialLng={form.longitude} onChange={handleMapChange} />
          </div>

          <div className="flex items-center space-x-2">
            <button type="button" onClick={async () => {
              const q = window.prompt('Type address to autocomplete (e.g. "123 Main St, City")');
              if (!q) return;
              try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=1`);
                const arr = await res.json();
                if (arr && arr.length) {
                  const r = arr[0];
                  setForm((s) => ({ ...s, latitude: r.lat, longitude: r.lon, street_address: r.display_name }));
                  // also notify map picker via onChange
                  handleMapChange({ latitude: r.lat, longitude: r.lon, street_address: r.display_name });
                } else {
                  alert('No results found');
                }
              } catch (e) {
                alert('Autocomplete failed');
              }
            }} className="px-3 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">Autocomplete</button>
            <span className="text-sm text-gray-500">or click on the map</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (required)</label>
            <textarea name="delivery_instructions" value={form.delivery_instructions} onChange={handleChange} placeholder="Add details for the courier (door color, intercom code...)" className="w-full p-2 border rounded" />
          </div>

          <label className="flex items-center space-x-2">
            <input type="checkbox" name="is_default" checked={form.is_default} onChange={handleChange} />
            <span>Set as default</span>
          </label>

          <div className="flex items-center space-x-2">
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">{id ? 'Save' : 'Add Address'}</button>
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressForm;


