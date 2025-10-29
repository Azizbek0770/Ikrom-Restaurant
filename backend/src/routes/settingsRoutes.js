const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { Settings } = require('../models');
const { supabaseService, supabaseAnon } = require('../config/supabase');

const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

// GET /api/settings/site - public
router.get('/site', async (req, res, next) => {
  try {
    const settingsRow = await Settings.findOne({ where: { key: 'site' } });
    let settings = settingsRow ? settingsRow.value || {} : {};

    // If logos are missing but Supabase is configured, try to discover public URLs from storage
    try {
      const needLight = !settings.logo_light;
      const needDark = !settings.logo_dark;

      if ((needLight || needDark) && (supabaseService || supabaseAnon)) {
        const client = supabaseAnon || supabaseService;

        // helper to find first file under a prefix and convert to public URL
        const findPublicUrl = async (prefix) => {
          try {
            const { data: listData, error: listErr } = await client.storage.from(SUPABASE_BUCKET).list(prefix, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
            if (listErr) return null;
            if (!listData || listData.length === 0) return null;
            // pick most recent file
            const file = listData[0];
            // file.name may already include prefix or be just the filename; normalize
            const filePath = file.name.startsWith(prefix) ? file.name.replace(/\\/g, '/') : `${prefix}/${file.name}`.replace(/\\/g, '/');
            const { data: publicData } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
            let url = publicData?.publicUrl || publicData?.publicURL || null;
            // If no public URL and we have service client, try signed URL
            if (!url && supabaseService) {
              try {
                const { data: signed } = await supabaseService.storage.from(SUPABASE_BUCKET).createSignedUrl(filePath, 60 * 60);
                url = signed?.signedUrl || null;
              } catch (e) {
                // ignore
              }
            }
            if (!url) {
              url = `${process.env.SUPABASE_PUBLIC_URL || ''}/storage/v1/object/public/${SUPABASE_BUCKET}/${filePath}`;
            }
            return url;
          } catch (e) {
            return null;
          }
        };

        // If prefix-specific search fails, try a generic settings_logo prefix
        const tryGenericLogoSearch = async () => {
          try {
            const { data: listData, error: listErr } = await client.storage.from(SUPABASE_BUCKET).list('settings_logo', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
            if (!listErr && listData && listData.length) {
              const file = listData[0];
              const filePath = `settings_logo/${file.name}`.replace(/\\/g, '/');
              const { data: publicData } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
              return publicData?.publicUrl || publicData?.publicURL || `${process.env.SUPABASE_PUBLIC_URL || ''}/storage/v1/object/public/${SUPABASE_BUCKET}/${filePath}`;
            }
          } catch (e) {
            // ignore
          }
          return null;
        };

        if (needLight) {
          const url = await findPublicUrl('settings_logo_light');
          if (!url) {
            // try generic search for any file containing 'logo' and 'light'
            const all = await client.storage.from(SUPABASE_BUCKET).list('', { limit: 500 });
            if (all.data && all.data.length) {
              const found = all.data.find(f => /logo/i.test(f.name) && /light/i.test(f.name));
              if (found) {
                const fp = `settings_logo_light/${found.name}`.replace(/\\/g, '/');
                const { data: pub } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(fp);
                url = pub?.publicUrl || pub?.publicURL || url;
              }
            }
          }
          if (url) settings.logo_light = url;
        }
        if (needDark) {
          const url = await findPublicUrl('settings_logo_dark');
          if (!url) {
            const all = await client.storage.from(SUPABASE_BUCKET).list('', { limit: 500 });
            if (all.data && all.data.length) {
              const found = all.data.find(f => /logo/i.test(f.name) && /dark/i.test(f.name));
              if (found) {
                const fp = `settings_logo_dark/${found.name}`.replace(/\\/g, '/');
                const { data: pub } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(fp);
                url = pub?.publicUrl || pub?.publicURL || url;
              }
            }
          }
          if (url) settings.logo_dark = url;
        }
      }
    } catch (e) {
      // ignore storage discovery errors
    }

    // Persist any discovered logos back to settings row for admin visibility
    try {
      if (settingsRow && settingsRow.value) {
        const merged = { ...settingsRow.value, ...settings };
        await settingsRow.update({ value: merged });
      } else if (!settingsRow && Object.keys(settings).length) {
        await Settings.create({ key: 'site', value: settings });
      }
    } catch (e) {
      // ignore persistence errors
    }

    return res.json({ success: true, data: { settings } });
  } catch (err) { next(err); }
});

// Admin: update site settings (logo etc)
router.put('/admin/site', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { value } = req.body;
    let settings = await Settings.findOne({ where: { key: 'site' } });
    if (settings) {
      await settings.update({ value });
    } else {
      settings = await Settings.create({ key: 'site', value });
    }
    return res.json({ success: true, data: { settings: settings.value } });
  } catch (err) { next(err); }
});

module.exports = router;


