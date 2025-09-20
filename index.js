require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// --- DB setup (keep your own db logic here) ---
const { sequelize, connectDB } = require('./db/database');
const { initializeModels } = require('./model/index');

// --- Multer upload middleware ---
const { upload, UPLOAD_DIR } = require('./middleware/multerConfig');

// === Security & parsing ===
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// --- CORS config ---
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.CLIENT_ORIGIN?.replace(/\/$/, ''), // remove trailing slash
  'https://ctfbackend-production.up.railway.app',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow curl / Postman (no origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// --- Rate limiting for sensitive routes ---
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/pract/login', authLimiter);
app.use('/api/pract/send-reset-otp', authLimiter);

// --- Ensure uploads dir exists ---
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
console.log('📁 UPLOAD_DIR:', UPLOAD_DIR);

// --- Serve uploads statically ---
app.use('/uploads', express.static(UPLOAD_DIR, {
  fallthrough: false,
  setHeaders(res) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// --- Health check endpoint ---
app.get('/', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Netanix CTF Server is running',
    timestamp: new Date().toISOString()
  });
});

// --- Upload endpoint ---
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });

    const filename = req.file.filename;
    const relativePath = `/uploads/${filename}`;
    const url = process.env.PUBLIC_BASE_URL
      ? `${process.env.PUBLIC_BASE_URL}${relativePath}`
      : relativePath;

    // Example: Save relativePath to DB if you want
    // await Challenge.create({ filePath: relativePath, ... });

    return res.json({ ok: true, filename, path: relativePath, url });
  } catch (err) {
    console.error('❌ Upload error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Debug route (optional; remove in prod) ---
app.get('/debug/uploads', (_req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    res.json({ uploadDir: UPLOAD_DIR, count: files.length, files });
  } catch (err) {
    res.status(500).json({ error: err.message, tried: UPLOAD_DIR });
  }
});

// --- Your existing routes ---
app.use('/api/pract', require('./Route/pracRoute'));
app.use('/api/member', require('./Route/memberRoute'));
app.use('/api/ctf', require('./Route/ctfRoute'));
app.use('/api/team', require('./Route/teamRoute'));
app.use('/api/registration', require('./Route/registrationRoute'));

// --- Boot server ---
(async () => {
  try {
    const required = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
    if (missing.length) {
      console.error('❌ Missing required env vars:', missing.join(', '));
      return;
    }

    await connectDB();
    initializeModels();

    app.listen(PORT, () => {
      console.log(`🚀 Netanix CTF Server running on port ${PORT}`);
      console.log(`🖼️ Uploads available at ${process.env.PUBLIC_BASE_URL || ''}/uploads`);
    });
  } catch (err) {
    console.error('❌ Server failed to start:', err.stack || err.message);
  }
})();

