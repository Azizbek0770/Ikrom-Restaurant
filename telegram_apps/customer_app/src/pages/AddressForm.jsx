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
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchTimer, setSearchTimer] = useState(null);

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

  const handleSearchChange = (q) => {
    setSearchQuery(q);
    if (searchTimer) clearTimeout(searchTimer);
    if (!q || q.length < 3) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5`);
        const arr = await res.json();
        setSuggestions(arr || []);
      } catch (e) {
        setSuggestions([]);
      }
    }, 300);
    setSearchTimer(t);
  };

  const selectSuggestion = (s) => {
    setSearchQuery(s.display_name);
    setSuggestions([]);
    setForm((f) => ({ ...f, latitude: s.lat, longitude: s.lon, street_address: s.display_name }));
    handleMapChange({ latitude: s.lat, longitude: s.lon, street_address: s.display_name });
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search address</label>
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Start typing address..."
                className="w-full p-2 border rounded"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 bg-white dark:bg-gray-800 border rounded mt-1 max-h-48 overflow-auto">
                  {suggestions.map((s) => (
                    <div key={s.place_id} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" onClick={() => selectSuggestion(s)}>
                      {s.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">Or click on the map to choose location</p>
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


