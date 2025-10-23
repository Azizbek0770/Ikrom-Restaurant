import React, { useState, useEffect } from 'react';
import { bannersAPI, newsAPI } from '@/services/api';
import Button from '@/components/ui/Button';
import ImageUpload from '@/components/ui/ImageUpload';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [newsList, setNewsList] = useState([]);
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

  const loadNews = async () => {
    try {
      const res = await newsAPI.getAll();
      const list = res.data.data.news || [];
      setNewsList(list.filter(n => n.is_published));
    } catch (err) {
      console.error('Failed to load news');
    }
  };

  useEffect(() => { 
    load(); 
    loadNews();
  }, []);

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
        <Button onClick={() => setEditing({ 
          title: '', 
          subtitle: '', 
          image_url: '', 
          link: '', 
          sort_order: 0, 
          is_active: true,
          banner_type: 'standard',
          news_id: null
        })}>Add Banner</Button>
      </div>

      {editing && (
        <div className="p-6 bg-white rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold">{editing.id ? 'Edit Banner' : 'Create Banner'}</h2>
          
          {/* Banner Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Banner Type</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="banner_type"
                  value="standard"
                  checked={editing.banner_type === 'standard'}
                  onChange={(e) => setEditing({ ...editing, banner_type: e.target.value, news_id: null })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm">Standard Banner</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="banner_type"
                  value="news_linked"
                  checked={editing.banner_type === 'news_linked'}
                  onChange={(e) => setEditing({ ...editing, banner_type: e.target.value })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm">News-Linked Banner</span>
              </label>
            </div>
          </div>

          {editing.banner_type === 'news_linked' ? (
            /* News-Linked Banner Fields */
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select News Article</label>
              <select
                value={editing.news_id || ''}
                onChange={(e) => {
                  const selectedNews = newsList.find(n => n.id === e.target.value);
                  setEditing({ 
                    ...editing, 
                    news_id: e.target.value,
                    title: selectedNews?.title || editing.title,
                    subtitle: selectedNews?.excerpt || editing.subtitle,
                    image_url: selectedNews?.image_url || editing.image_url
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">-- Select a news article --</option>
                {newsList.map(news => (
                  <option key={news.id} value={news.id}>
                    {news.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Banner will automatically use the news article's title, image, and excerpt
              </p>
            </div>
          ) : (
            /* Standard Banner Fields */
            <>
              <Input 
                label="Title" 
                value={editing.title} 
                onChange={(e) => setEditing({ ...editing, title: e.target.value })} 
                required
              />
              <Input 
                label="Subtitle" 
                value={editing.subtitle || ''} 
                onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} 
              />
              <ImageUpload 
                label="Image" 
                value={editing.image_url} 
                onChange={(url) => setEditing({ ...editing, image_url: url })} 
                type="banners" 
                uploadUrl={editing.id ? `/api/upload/banners/${editing.id}` : undefined}
              />
              <Input 
                label="Link (URL)" 
                value={editing.link || ''} 
                onChange={(e) => setEditing({ ...editing, link: e.target.value })} 
                placeholder="https://example.com"
              />
            </>
          )}

          <div className="flex space-x-2 pt-2">
            <Button onClick={() => handleSave(editing)}>Save</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {banners.map((b, idx) => (
          <div key={b.id} className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <img src={b.image_url} alt={b.title} className="w-32 h-20 object-cover rounded" />
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-gray-900">{b.title}</span>
                    {b.banner_type === 'news_linked' && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                        News-Linked
                      </span>
                    )}
                  </div>
                  {b.subtitle && (
                    <div className="text-sm text-gray-600 mb-1">{b.subtitle}</div>
                  )}
                  {b.news && (
                    <div className="text-xs text-gray-500">
                      Linked to: {b.news.title}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200" onClick={() => move(idx, -1)}>↑</button>
                <button className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200" onClick={() => move(idx, 1)}>↓</button>
                <button 
                  className={`px-3 py-1 rounded text-sm font-medium ${b.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`} 
                  onClick={() => toggleActive(b)}
                >
                  {b.is_active ? 'Active' : 'Inactive'}
                </button>
                <Button size="sm" onClick={() => setEditing(b)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(b.id)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No banners yet. Create your first one!
          </div>
        )}
      </div>
    </div>
  );
};

export default Banners;


