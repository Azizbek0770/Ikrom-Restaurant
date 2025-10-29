import React, { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import ImageUpload from '@/components/ui/ImageUpload';
import { authAPI } from '@/services/api';
import api, { usersAPI } from '@/services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const [settings, setSettings] = useState({});

  const load = async () => {
    try {
      const resp = await api.get('/settings/site');
      setSettings(resp.data.data.settings || {});
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    try {
      // If settings include logo_light/logo_dark that are remote URLs returned from upload, ensure saved
      await api.put('/settings/admin/site', { value: settings });
      toast.success('Settings saved');
    } catch (err) { toast.error('Save failed'); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Site Settings</h1>

      <div className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo (Light)</label>
          <ImageUpload value={settings.logo_light} onChange={(url) => setSettings({ ...settings, logo_light: url })} type="settings_logo_light" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo (Dark)</label>
          <ImageUpload value={settings.logo_dark} onChange={(url) => setSettings({ ...settings, logo_dark: url })} type="settings_logo_dark" />
        </div>

        <div className="pt-4">
          <button className="px-4 py-2 bg-primary-600 text-white rounded" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;


