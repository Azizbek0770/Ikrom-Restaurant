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

    // If we have a supabase service client, attempt to return signed URLs for logos
    const returned = { ...settings };
    try {
      const client = supabaseService || null;
      const tryMakeSigned = async (maybeUrl) => {
        if (!maybeUrl) return maybeUrl;
        if (!client) return maybeUrl;
        try {
          // try to extract path after /storage/v1/object/public/<bucket>/:filepath
          const m = maybeUrl.match(/\/storage\/v1\/object\/public\/(.+?)\/(.+)$/);
          if (m && m[1] && m[2]) {
            const bucket = m[1];
            const filePath = `${m[2]}`.replace(/\\/g, '/');
            const { data: signed } = await client.storage.from(bucket).createSignedUrl(filePath, 60 * 60);
            return signed?.signedUrl || maybeUrl;
          }
        } catch (e) {
          // ignore and return original
        }
        return maybeUrl;
      };

      if (settings.logo_light) returned.logo_light = await tryMakeSigned(settings.logo_light);
      if (settings.logo_dark) returned.logo_dark = await tryMakeSigned(settings.logo_dark);
      if (settings.logo_url) returned.logo_url = await tryMakeSigned(settings.logo_url);
    } catch (e) {
      // ignore
    }

    const raw = settingsRow && settingsRow.value ? { ...settingsRow.value } : {};
    return res.json({ success: true, data: { settings: returned, settings_raw: raw } });
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

// Admin-only: list objects under a storage prefix for debugging
router.get('/admin/storage/list', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const prefix = String(req.query.prefix || '').replace(/^\/+/, '');
    if (!prefix) return res.status(400).json({ success: false, message: 'prefix query is required' });
    if (!supabaseService && !supabaseAnon) return res.status(500).json({ success: false, message: 'Supabase client not configured' });

    const client = supabaseService || supabaseAnon;
    const bucket = SUPABASE_BUCKET;
    const { data: listData, error: listErr } = await client.storage.from(bucket).list(prefix, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    if (listErr) return res.status(500).json({ success: false, message: 'Failed to list storage', error: listErr });

    const items = await Promise.all((listData || []).map(async (file) => {
      const filePath = `${prefix}/${file.name}`.replace(/\\/g, '/');
      let publicUrl = null;
      try {
        const { data: pub } = client.storage.from(bucket).getPublicUrl(filePath);
        publicUrl = pub?.publicUrl || pub?.publicURL || `${process.env.SUPABASE_PUBLIC_URL || ''}/storage/v1/object/public/${bucket}/${filePath}`;
      } catch (e) {
        publicUrl = `${process.env.SUPABASE_PUBLIC_URL || ''}/storage/v1/object/public/${bucket}/${filePath}`;
      }
      let signedUrl = null;
      if (supabaseService) {
        try {
          const { data: s } = await supabaseService.storage.from(bucket).createSignedUrl(filePath, 60 * 60);
          signedUrl = s?.signedUrl || null;
        } catch (e) {
          signedUrl = null;
        }
      }
      return {
        name: file.name,
        id: file.id,
        size: file.size,
        updated_at: file.updated_at,
        publicUrl,
        signedUrl
      };
    }));

    return res.json({ success: true, data: { items } });
  } catch (err) { next(err); }
});

module.exports = router;


