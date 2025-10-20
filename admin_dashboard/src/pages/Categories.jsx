import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import ImageUpload from '@/components/ui/ImageUpload';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const CategoryForm = ({ category, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: category?.name || '',
    name_uz: category?.name_uz || '',
    name_ru: category?.name_ru || '',
    description: category?.description || '',
    image_url: category?.image_url || '',
    sort_order: category?.sort_order || 0
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      return category 
        ? categoriesAPI.update(category.id, data)
        : categoriesAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success(category ? 'Category updated!' : 'Category created!');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <ImageUpload
        label="Category Image"
        value={formData.image_url}
        onChange={(url) => setFormData({ ...formData, image_url: url })}
        type="categories"
        uploadUrl={category?.id ? `/api/upload/categories/${category.id}` : undefined}
      />
      <Input
        label="Sort Order"
        value={formData.sort_order}
        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
        type="number"
      />
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" isLoading={mutation.isPending}>
          {category ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

const Categories = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getAll({ include_items: true });
      return response.data.data.categories;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoriesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success('Category deleted!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  });

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = (category) => {
    if (window.confirm(`Delete category "${category.name}"?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">Manage menu categories</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-6">
              {category.image_url && (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {category.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{category.items?.length || 0} items</span>
                <span className={`px-2 py-1 rounded-full ${
                  category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEdit(category)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  className="flex-1"
                  onClick={() => handleDelete(category)}
                  isLoading={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCategory ? 'Edit Category' : 'Create Category'}
      >
        <CategoryForm
          category={selectedCategory}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setSelectedCategory(null)}
        />
      </Modal>
    </div>
  );
};

export default Categories;