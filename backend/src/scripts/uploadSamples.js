const fs = require('fs');
const path = require('path');
const { supabaseService, supabaseAnon } = require('../config/supabase');
require('dotenv').config();

const supabaseClient = supabaseService || supabaseAnon;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

// Simple 1x1 PNG placeholders (transparent)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
const toBuffer = (b64) => Buffer.from(b64, 'base64');

const files = [
  { key: 'categories/pizza.png', data: toBuffer(pngBase64) },
  { key: 'categories/burgers.png', data: toBuffer(pngBase64) },
  { key: 'categories/drinks.png', data: toBuffer(pngBase64) }
];

const saveLocally = async (file) => {
  const outDir = path.join(__dirname, '../../uploads', path.dirname(file.key));
  const outPath = path.join(outDir, path.basename(file.key));
  await fs.promises.mkdir(outDir, { recursive: true });
  await fs.promises.writeFile(outPath, file.data);
  console.log('Saved locally:', outPath);
};

const upload = async () => {
  try {
    for (const file of files) {
      console.log(`Uploading ${file.key} to bucket ${bucket}...`);

      if (!supabaseClient) {
        console.warn('Supabase not configured - falling back to local storage');
        await saveLocally(file);
        continue;
      }

      const { data, error } = await supabaseClient.storage.from(bucket).upload(file.key, file.data, {
        contentType: 'image/png',
        upsert: true
      });

      if (error) {
        console.error('Upload error for', file.key, error);
        await saveLocally(file);
      } else {
        console.log('Uploaded:', file.key);
      }
    }

    console.log('All uploads attempted');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error uploading samples:', err);
    process.exit(1);
  }
};

upload();