import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuAPI, categoriesAPI } from "@/services/api";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Badge from "@/components/ui/Badge";
import ImageUpload from "@/components/ui/ImageUpload";
import { Plus, Edit2, Trash2, Power, PowerOff, X, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import toast from "react-hot-toast";

// ======================================================
// Menu Item Form
// ======================================================
const MenuItemForm = ({ item, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    category_id: item?.category_id || "",
    name: item?.name || "",
    name_uz: item?.name_uz || "",
    name_ru: item?.name_ru || "",
    description: item?.description || "",
    description_uz: item?.description_uz || "",
    description_ru: item?.description_ru || "",
    price: item?.price || "",
    image_url: item?.image_url || "",
    preparation_time: item?.preparation_time || 15,
    calories: item?.calories || "",
    sort_order: item?.sort_order || 0,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await categoriesAPI.getAll({ active_only: true });
      return res.data.data.categories;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => (item ? menuAPI.update(item.id, data) : menuAPI.create(data)),
    onSuccess: () => {
      queryClient.invalidateQueries(["menuItems"]);
      toast.success(item ? "Menu item updated successfully!" : "New menu item created!");
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Something went wrong");
    },
  });

  const handleChange = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const categoryOptions = categories?.map((c) => ({ value: c.id, label: c.name })) || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Category"
        value={formData.category_id}
        onChange={(e) => handleChange("category_id", e.target.value)}
        options={categoryOptions}
        placeholder="Select category"
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Name (English)" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
        <Input label="Name (Uzbek)" value={formData.name_uz} onChange={(e) => handleChange("name_uz", e.target.value)} />
        <Input label="Name (Russian)" value={formData.name_ru} onChange={(e) => handleChange("name_ru", e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Price (UZS)"
          type="number"
          min="0"
          step="1000"
          value={formData.price}
          onChange={(e) => handleChange("price", e.target.value)}
          required
        />
        <Input
          label="Preparation Time (minutes)"
          type="number"
          min="1"
          value={formData.preparation_time}
          onChange={(e) => handleChange("preparation_time", parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Calories" type="number" min="0" value={formData.calories} onChange={(e) => handleChange("calories", e.target.value)} />
        <Input
          label="Sort Order"
          type="number"
          min="0"
          value={formData.sort_order}
          onChange={(e) => handleChange("sort_order", parseInt(e.target.value) || 0)}
        />
      </div>

      <ImageUpload label="Menu Item Image" value={formData.image_url} onChange={(url) => handleChange("image_url", url)} type="menu" />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" isLoading={mutation.isPending}>
          {item ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </form>
  );
};

// ======================================================
// Simple Custom Lightbox
// ======================================================
const Lightbox = ({ items, index, onClose, onPrev, onNext }) => {
  const [zoom, setZoom] = useState(1);
  const startX = useRef(0);
  const currentIndex = useRef(index);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    if (endX - startX.current > 80) onPrev();
    if (startX.current - endX > 80) onNext();
  };

  const handleZoom = (e) => {
    e.preventDefault();
    setZoom((z) => Math.min(Math.max(z + e.deltaY * -0.001, 1), 2));
  };

  return (
      <div
        className="fixed left-0 right-0 -top-[25px] h-[calc(100%+25px)] z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white bg-black/50 p-2 rounded-full hover:bg-black/70"
        >
          <X className="w-6 h-6" />
        </button>

        <button onClick={onPrev} className="absolute left-4 text-white/70 hover:text-white">
          <ChevronLeft className="w-10 h-10" />
        </button>
        <button onClick={onNext} className="absolute right-4 text-white/70 hover:text-white">
          <ChevronRight className="w-10 h-10" />
        </button>

        <div
          className="max-w-3xl w-full px-4 text-center"
          onWheel={handleZoom}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={items[index]?.image_url}
            alt={items[index]?.name}
            style={{ transform: `scale(${zoom})` }}
            className="mx-auto max-h-[80vh] object-contain transition-transform duration-200"
          />
          <h3 className="text-white text-2xl font-semibold mt-4">{items[index]?.name}</h3>
          <p className="text-gray-300 mt-2">{items[index]?.description}</p>
        </div>
      </div>

  );
};

// ======================================================
// Menu Management Page
// ======================================================
const Menu = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await categoriesAPI.getAll({ active_only: true });
      return res.data.data.categories;
    },
  });

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ["menuItems", filterCategory],
    queryFn: async () => {
      const params = {};
      if (filterCategory) params.category_id = filterCategory;
      const res = await menuAPI.getAll(params);
      return res.data.data.menuItems;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => menuAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["menuItems"]);
      toast.success("Menu item deleted successfully!");
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (id) => menuAPI.toggleAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["menuItems"]);
      toast.success("Availability status updated!");
    },
  });

  const handleCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  const categoryOptions = [{ value: "", label: "All Categories" }, ...(categories?.map((c) => ({ value: c.id, label: c.name })) || [])];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 mt-1">Add, edit, and organize your restaurant’s menu items</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} options={categoryOptions} className="max-w-xs" />
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {menuItems.map((item, i) => (
          <Card key={item.id} className="overflow-hidden shadow-sm">
            <CardContent className="p-0 ">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-60 object-cover rounded-t-lg cursor-pointer"
                  onClick={() => setLightboxIndex(i)}
                />
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category?.name || "Uncategorized"}</p>
                  </div>
                  <Badge variant={item.is_available ? "success" : "danger"}>{item.is_available ? "Available" : "Unavailable"}</Badge>
                </div>

                {item.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>}

                <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                  <span className="font-semibold text-lg text-gray-900">{formatCurrency(item.price)}</span>
                  <span>{item.preparation_time} min</span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(item)}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant={item.is_available ? "ghost" : "success"} onClick={() => toggleAvailabilityMutation.mutate(item.id)}>
                    {item.is_available ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="danger" isLoading={deleteMutation.isPending} onClick={() => handleDelete(item)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {menuItems.length === 0 && (
        <Card>
          <CardContent className="py-20 text-center text-gray-500">No menu items found</CardContent>
        </Card>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedItem ? "Edit Menu Item" : "Create Menu Item"} size="lg">
        <MenuItemForm item={selectedItem} onClose={() => setIsModalOpen(false)} onSuccess={() => setSelectedItem(null)} />
      </Modal>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          items={menuItems}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i > 0 ? i - 1 : menuItems.length - 1))}
          onNext={() => setLightboxIndex((i) => (i < menuItems.length - 1 ? i + 1 : 0))}
        />
      )}
    </div>
  );
};

export default Menu;
