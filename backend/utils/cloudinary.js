const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const fs = require('fs');
const path = require('path');

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png'];
const MAX_FILENAME_BASE_LENGTH = 48;

const extensionForMimeType = (mimetype) => {
  if (mimetype === 'image/png') return '.png';
  return '.jpg';
};

const sanitizeFilenameBase = (name) => {
  const parsed = path.parse(name || '');
  const base = (parsed.name || 'image')
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_FILENAME_BASE_LENGTH);

  return base || 'image';
};

const buildSafeUploadName = (file) => {
  const safeBase = sanitizeFilenameBase(file.originalname);
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${file.fieldname}-${safeBase}-${uniqueSuffix}${extensionForMimeType(file.mimetype)}`;
};

// File filter function
const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Only PNG and JPG files are allowed. Received: ${file.mimetype}`), false);
  }
  cb(null, true);
};

let storage;
let upload;

const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                              process.env.CLOUDINARY_API_KEY && 
                              process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'ecotrade',
      allowed_formats: ALLOWED_FORMATS,
      resource_type: 'auto',
      public_id: (req, file) => path.parse(buildSafeUploadName(file)).name,
    },
  });
  
  upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
  });
} else {
  // Local storage fallback
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, buildSafeUploadName(file));
    },
  });
  
  upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
  });
}

// Helper to get file URL
const getFileUrl = (file, req) => {
  if (!file) return null;
  if (isCloudinaryConfigured) {
    return file.path; // Cloudinary storage puts URL in path
  } else {
    // Local static serving path
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/uploads/${file.filename}`;
  }
};

module.exports = {
  upload,
  getFileUrl,
  cloudinary,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_FORMATS,
};
