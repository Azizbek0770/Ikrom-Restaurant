import React, { useState, useEffect } from 'react';
import { newsAPI } from '@/services/api';
import Button from '@/components/ui/Button';
import ImageUpload from '@/components/ui/ImageUpload';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

const News = () => {
  const [newsList, setNewsList] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const res = await newsAPI.getAll();
      const list = res.data.data.news || [];
      setNewsList(list);
    } catch (err) {
      toast.error('Failed to load news');
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (news) => {
    try {
      if (news.id) {
        await newsAPI.update(news.id, news);
      } else {
        await newsAPI.create(news);
      }
      toast.success('Saved');
      setEditing(null);
      load();
    } catch (err) {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete news? This will also remove any linked banners.')) return;
    try {
      await newsAPI.delete(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const togglePublish = async (news) => {
    try {
      await newsAPI.togglePublish(news.id);
      toast.success(news.is_published ? 'Unpublished' : 'Published');
      load();
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">News Management</h1>
        <Button onClick={() => setEditing({ 
          title: '', 
          content: '', 
          excerpt: '', 
          image_url: '', 
          author: '', 
          is_published: false,
          add_to_banner: false,
          sort_order: 0
        })}>
          Add News
        </Button>
      </div>

      {editing && (
        <div className="p-6 bg-white rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold">{editing.id ? 'Edit News' : 'Create News'}</h2>
          
          <Input 
            label="Title" 
            value={editing.title} 
            onChange={(e) => setEditing({ ...editing, title: e.target.value })} 
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (Short description)</label>
            <textarea
              value={editing.excerpt || ''}
              onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows="2"
              placeholder="Brief summary of the news..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              value={editing.content || ''}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows="8"
              placeholder="Full news content..."
              required
            />
          </div>

          <ImageUpload 
            label="Image" 
            value={editing.image_url} 
            onChange={(url) => setEditing({ ...editing, image_url: url })} 
            type="news" 
            uploadUrl={editing.id ? `/api/upload/news/${editing.id}` : undefined}
          />

          <Input 
            label="Author" 
            value={editing.author || ''} 
            onChange={(e) => setEditing({ ...editing, author: e.target.value })} 
            placeholder="Author name (optional)"
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_published"
              checked={editing.is_published || false}
              onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
              Publish immediately
            </label>
          </div>

          <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="add_to_banner"
              checked={editing.add_to_banner || false}
              onChange={(e) => setEditing({ ...editing, add_to_banner: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="add_to_banner" className="text-sm font-medium text-gray-700">
              🎯 Add to banner carousel (news-linked banner)
            </label>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button onClick={() => handleSave(editing)}>Save</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {newsList.map((news) => (
          <div key={news.id} className="p-4 bg-white rounded-lg shadow border border-gray-200">
            <div className="flex items-start space-x-4">
              {news.image_url && (
                <img src={news.image_url} alt={news.title} className="w-32 h-24 object-cover rounded" />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{news.title}</h3>
                    {news.excerpt && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{news.excerpt}</p>
                    )}
                    {news.author && (
                      <p className="text-xs text-gray-500 mt-1">By {news.author}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {news.is_published 
                        ? `Published: ${new Date(news.published_at).toLocaleDateString()}` 
                        : 'Draft'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className={`px-3 py-1.5 rounded text-sm font-medium ${
                        news.is_published 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      onClick={() => togglePublish(news)}
                    >
                      {news.is_published ? '✓ Published' : 'Unpublished'}
                    </button>
                    <Button size="sm" onClick={() => setEditing({...news, add_to_banner: false})}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(news.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {newsList.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No news articles yet. Create your first one!
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
