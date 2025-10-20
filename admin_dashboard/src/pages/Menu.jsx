import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuAPI, categoriesAPI } from '@/services/api';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import ImageUpload from '@/components/ui/ImageUpload';
import { Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import toast from 'react-hot-toast';

const MenuItemForm = ({ item, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    category_id: item?.category_id || '',
    name: item?.name || '',
    name_uz: item?.name_uz || '',
    name_ru: item?.name_ru || '',
    description: item?.description || '',
    description_uz: item?.description_uz || '',
    description_ru: item?.description_ru || '',
    price: item?.price || '',
    image_url: item?.image_url || '',
    preparation_time: item?.preparation_time || 15,
    calories: item?.calories || '',
    sort_order: item?.sort_order || 0
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getAll({ active_only: true });
      return response.data.data.categories;
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      return item 
        ? menuAPI.update(item.id, data)
        : menuAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['menuItems']);
      toast.success(item ? 'Menu item updated!' : 'Menu item created!');
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const categoryOptions = categories?.map(cat => ({
    value: cat.id,
    label: cat.name
  })) || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Category"
        value={formData.category_id}
        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
        options={categoryOptions}
        placeholder="Select category"
        required
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Name (English)"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Input
          label="Name (Uzbek)"
          value={formData.name_uz}
          onChange={(e) => setFormData({ ...formData, name_uz: e.target.value })}
        />
        <Input
          label="Name (Russian)"
          value={formData.name_ru}
          onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (English)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Price (UZS)"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          type="number"
          min="0"
          step="1000"
          required
        />
        <Input
          label="Preparation Time (minutes)"
          value={formData.preparation_time}
          onChange={(e) => setFormData({ ...formData, preparation_time: parseInt(e.target.value) || 0 })}
          type="number"
          min="1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Calories"
          value={formData.calories}
          onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
          type="number"
          min="0"
        />
        <Input
          label="Sort Order"
          value={formData.sort_order}
          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
          type="number"
        />
      </div>

      <ImageUpload
        label="Menu Item Image"
        value={formData.image_url}
        onChange={(url) => setFormData({ ...formData, image_url: url })}
        type="menu"
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" isLoading={mutation.isPending}>
          {item ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

const Menu = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getAll({ active_only: true });
      return response.data.data.categories;
    }
  });

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menuItems', filterCategory],
    queryFn: async () => {
      const params = {};
      if (filterCategory) params.category_id = filterCategory;
      const response = await menuAPI.getAll(params);
      return response.data.data.menuItems;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => menuAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['menuItems']);
      toast.success('Menu item deleted!');
    }
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (id) => menuAPI.toggleAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['menuItems']);
      toast.success('Availability updated!');
    }
  });

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Delete "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...(categories?.map(cat => ({ value: cat.id, label: cat.name })) || [])
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
          <h1 className="text-3xl font-bold text-gray-900">Menu</h1>
          <p className="text-gray-600 mt-1">Manage your menu items</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            options={categoryOptions}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems?.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-0">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">{item.category?.name}</p>
                  </div>
                  <Badge variant={item.is_available ? 'success' : 'danger'}>
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
                
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="font-semibold text-lg text-gray-900">
                    {formatCurrency(item.price)}
                  </span>
                  <span>{item.preparation_time} min</span>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={item.is_available ? 'ghost' : 'success'}
                    onClick={() => toggleAvailabilityMutation.mutate(item.id)}
                  >
                    {item.is_available ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(item)}
                    isLoading={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {menuItems?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">No menu items found</p>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedItem ? 'Edit Menu Item' : 'Create Menu Item'}
        size="lg"
      >
        <MenuItemForm
          item={selectedItem}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setSelectedItem(null)}
        />
      </Modal>
    </div>
  );
};

export default Menu;