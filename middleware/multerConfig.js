// middleware/multerConfig.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use Railway Volume if available, otherwise local ./uploads
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Ensure the directory exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Storage config
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, UPLOAD_DIR); // <-- important: use env dir
  },
  filename: function (_req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  }
});

// File filter for CTF challenges
const fileFilter = (_req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/jpg', 'image/gif',
    'application/zip', 'application/x-zip-compressed',
    'text/plain', 'application/pdf',
    'application/octet-stream',
    'application/x-7z-compressed',
    'application/x-rar-compressed',
    'application/x-tar',
    'application/gzip'
  ];

  if (allowedTypes.includes(file.mimetype) || !file.mimetype) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed for CTF challenges'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

module.exports = { upload, UPLOAD_DIR };
