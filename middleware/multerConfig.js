const multer = require('multer');
const path = require('path');

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique file name
  }
});

// File filter for CTF challenges - allow common file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/jpg', 'image/gif',
    'application/zip', 'application/x-zip-compressed',
    'text/plain', 'application/pdf',
    'application/octet-stream', // For binary files
    'application/x-7z-compressed',
    'application/x-rar-compressed',
    'application/x-tar',
    'application/gzip'
  ];
  
  // Also allow files without specific mime types (common for CTF files)
  if (allowedTypes.includes(file.mimetype) || !file.mimetype) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed for CTF challenges'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for CTF files
  }
});
module.exports = upload;
