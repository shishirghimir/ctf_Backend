const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use Railway volume in prod; fallback to ./uploads locally
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Strip any path traversal characters; keep only the extension
    const ext = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '');
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  },
});

const allowed = [
  'image/jpeg','image/png','image/jpg','image/gif',
  'application/zip','application/x-zip-compressed',
  'text/plain','application/pdf','application/octet-stream',
  'application/x-7z-compressed','application/x-rar-compressed',
  'application/x-tar','application/gzip'
];
const fileFilter = (_req, file, cb) => {
  if (!file.mimetype || !allowed.includes(file.mimetype)) {
    return cb(new Error('File type not allowed for CTF challenges'), false);
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = { upload, UPLOAD_DIR };
