const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const USE_SUPABASE = !!process.env.SUPABASE_URL;

let storage;

if (USE_SUPABASE) {
  // Use memory storage and upload buffer to Supabase in controller
  storage = multer.memoryStorage();
} else {
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure disk storage
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const type = req.params.type || 'general';
      const typeDir = path.join(uploadsDir, type);

      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
      }

      cb(null, typeDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });
}

// Upload configuration per type
const uploadConfigs = {
  image: { allowedTypes: /jpeg|jpg|png|gif|webp/, maxSize: 5 * 1024 * 1024 },
  avatar: { allowedTypes: /jpeg|jpg|png|webp/, maxSize: 2 * 1024 * 1024 },
  document: { allowedTypes: /pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|plain|csv/, maxSize: 10 * 1024 * 1024 },
  general: { allowedTypes: /jpeg|jpg|png|gif|webp|pdf|plain|msword|octet-stream/, maxSize: 5 * 1024 * 1024 }
};

// Create multer instance for a given type
const createMulter = (type = 'general') => {
  const cfg = uploadConfigs[type] || uploadConfigs.general;

  const fileFilter = (req, file, cb) => {
    const allowed = cfg.allowedTypes;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }

    const err = new Error(`Invalid file type. Allowed: ${allowed.toString()}`);
    err.code = 'INVALID_FILE_TYPE';
    return cb(err);
  };

  return multer({
    storage: storage,
    limits: { fileSize: cfg.maxSize },
    fileFilter
  });
};

// Wrapper to use multer and return consistent JSON errors
const uploadHandler = (options = {}) => {
  // options: { type: 'image'|'document'|'avatar'|'general', field: 'file', multiple: false }
  const type = options.type || 'general';
  const field = options.field || 'file';
  const multiple = !!options.multiple;

  const uploader = createMulter(type);

  if (multiple) {
    const mw = uploader.array(field);
    return (req, res, next) => {
      mw(req, res, (err) => {
        if (err) return handleMulterError(err, res);
        next();
      });
    };
  }

  const mw = uploader.single(field);
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (err) return handleMulterError(err, res);
      next();
    });
  };
};

// Standardized multer error responses
const handleMulterError = (err, res) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'File too large' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }

  // Custom errors from fileFilter
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(415).json({ success: false, message: err.message });
  }

  // Generic
  return res.status(400).json({ success: false, message: err.message || 'File upload error' });
};

module.exports = {
  uploadHandler,
  createMulter,
  uploadConfigs,
  storage
};