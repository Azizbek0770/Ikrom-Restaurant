import React, { useState, useEffect } from 'react';
import { bannersAPI } from '@/services/api';
import Button from '@/components/ui/Button';
import ImageUpload from '@/components/ui/ImageUpload';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const res = await bannersAPI.getAll();
      const list = res.data.data.banners || [];
      // Ensure sorted by sort_order asc
      list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setBanners(list);
    } catch (err) {
      toast.error('Failed to load banners');
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (b) => {
    try {
      if (b.id) await bannersAPI.update(b.id, b);
      else await bannersAPI.create(b);
      toast.success('Saved');
      setEditing(null);
      load();
    } catch (err) { toast.error('Failed to save'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete banner?')) return;
    try { await bannersAPI.delete(id); toast.success('Deleted'); load(); } catch { toast.error('Failed to delete'); }
  };

  const toggleActive = async (b) => {
    try {
      await bannersAPI.update(b.id, { is_active: !b.is_active });
      toast.success('Updated');
      load();
    } catch {
      toast.error('Failed to update');
    }
  };

  const move = async (index, dir) => {
    const targetIndex = index + dir;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const a = banners[index];
    const b = banners[targetIndex];

    try {
      // Swap sort_order
      const aOrder = a.sort_order || 0;
      const bOrder = b.sort_order || 0;

      await bannersAPI.update(a.id, { sort_order: bOrder });
      await bannersAPI.update(b.id, { sort_order: aOrder });

      toast.success('Order updated');
      load();
    } catch (err) {
      toast.error('Failed to reorder');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Banners</h1>
        <Button onClick={() => setEditing({ title: '', subtitle: '', image_url: '', link: '', sort_order: 0, is_active: true })}>Add</Button>
      </div>

      {editing && (
        <div className="p-4 bg-white rounded-lg shadow">
          <Input label="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          <Input label="Subtitle" value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
          <ImageUpload label="Image" value={editing.image_url} onChange={(url) => setEditing({ ...editing, image_url: url })} type="banners" uploadUrl={editing.id ? `/api/upload/banners/${editing.id}` : undefined} />
          <div className="flex space-x-2 mt-2">
            <Button onClick={() => handleSave(editing)}>Save</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {banners.map((b, idx) => (
          <div key={b.id} className="p-3 bg-white rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={b.image_url} alt={b.title} className="w-24 h-14 object-cover rounded" />
              <div>
                <div className="font-semibold">{b.title}</div>
                <div className="text-sm text-gray-600">{b.subtitle}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => move(idx, -1)}>↑</button>
              <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => move(idx, 1)}>↓</button>
              <button className={`px-2 py-1 rounded ${b.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`} onClick={() => toggleActive(b)}>
                {b.is_active ? 'Active' : 'Inactive'}
              </button>
              <Button onClick={() => setEditing(b)}>Edit</Button>
              <Button variant="danger" onClick={() => handleDelete(b.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Banners;


