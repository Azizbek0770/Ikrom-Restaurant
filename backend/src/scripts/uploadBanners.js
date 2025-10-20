const supabase = require('../config/supabase');
require('dotenv').config();

const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';

// 1x1 PNG placeholder
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
const toBuffer = (b64) => Buffer.from(b64, 'base64');

const files = [
  { key: 'banners/welcome.png', data: toBuffer(pngBase64) }
];

const upload = async () => {
  try {
    for (const file of files) {
      console.log(`Uploading ${file.key} to bucket ${bucket}...`);
      const { data, error } = await supabase.storage.from(bucket).upload(file.key, file.data, {
        contentType: 'image/png',
        upsert: true
      });

      if (error) {
        console.error('Upload error for', file.key, error);
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


