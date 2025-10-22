const supabase = require('../config/supabase');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

// 1x1 PNG placeholder
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
const toBuffer = (b64) => Buffer.from(b64, 'base64');

const files = [
  { key: 'banners/welcome.png', data: toBuffer(pngBase64) }
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

      if (!supabase) {
        console.warn('Supabase not configured - falling back to local storage');
        await saveLocally(file);
        continue;
      }

      const { data, error } = await supabase.storage.from(bucket).upload(file.key, file.data, {
        contentType: 'image/png',
        upsert: true
      });

      if (error) {
        console.error('Upload error for', file.key, error);
        // fallback to local save
        await saveLocally(file);
      } else {
        console.log('Uploaded:', file.key);
      }
    }

    console.log('Banners upload done');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error uploading banners:', err);
    process.exit(1);
  }
};

upload();


