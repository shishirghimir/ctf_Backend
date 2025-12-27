require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 5000);

// DB
const { sequelize, connectDB } = require('./db/database');
const { initializeModels } = require('./model/index');

// Multer config (uses Railway Volume if UPLOAD_DIR is set)
const { upload, UPLOAD_DIR } = require('./middleware/multerConfig');

// ---------- Security & parsing ----------
app.use(helmet()); // Base helmet protection

// Extra headers for Mozilla Observatory + Nikto
app.use(
  helmet.frameguard({ action: 'deny' }) // X-Frame-Options: DENY
);
app.use(
  helmet.hsts({ maxAge: 63072000, includeSubDomains: true, preload: true }) // Strict-Transport-Security
);
app.use(helmet.noSniff()); // X-Content-Type-Options: nosniff
app.use(helmet.referrerPolicy({ policy: 'no-referrer' })); // Referrer-Policy
app.use(helmet.permittedCrossDomainPolicies()); // Optional: cross-domain policy

// Custom headers
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()'); // Permissions-Policy
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// ---------- CORS with credentials ----------
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.CLIENT_ORIGIN?.replace(/\/$/, ''), // Remove trailing slash if present
  'https://ctfbackend-production.up.railway.app', // Railway backend URL
  'http://localhost:5173', // Common React dev port
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 CORS Debug - Origin received:', origin);
    console.log('🔍 CORS Debug - CLIENT_ORIGIN env:', process.env.CLIENT_ORIGIN);
    console.log('🔍 CORS Debug - Allowed origins:', allowedOrigins);

    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS - Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS - Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// ---------- Uploads: ensure dir exists & serve statically ----------
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
console.log('📁 UPLOAD_DIR:', UPLOAD_DIR);

// Serve uploads statically
app.use('/uploads', express.static(UPLOAD_DIR, {
  fallthrough: false,
  setHeaders(res) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  },
}));

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });

    const filename = req.file.filename;

    // Fix double slash issue in URL
    const base = process.env.PUBLIC_BASE_URL || 'https://api.netanixctf.xyz';
    const url = `${base}/uploads/${filename}`.replace(/([^:]\/)\/+/g, '$1'); 
    // Replaces multiple slashes with one, but keeps "https://"

    return res.json({ ok: true, filename, url });
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Safe download route
app.get('/download/:filename', (req, res) => {
  try {
    const filePath = path.join(UPLOAD_DIR, req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: 'File not found' });
    }

    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ ok: false, error: 'Failed to download' });
      }
    });
  } catch (e) {
    console.error('Download error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------- Basic rate limit for auth & otp ----------
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/pract/login', authLimiter);
app.use('/api/pract/send-reset-otp', authLimiter);

// ---------- Health check ----------
app.get('/', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Netanix CTF Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ---------- Routes ----------
app.use('/api/pract', require('./Route/pracRoute'));
app.use('/api/member', require('./Route/memberRoute'));
app.use('/api/ctf', require('./Route/ctfRoute'));
app.use('/api/team', require('./Route/teamRoute'));
app.use('/api/registration', require('./Route/registrationRoute'));

// ---------- Boot ----------
const startServer = async () => {
  try {
    const required = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
    if (missing.length) {
      console.error('❌ Missing required environment variables:', missing.join(', '));
      return;
    }

    await connectDB();
    initializeModels();

    app.listen(PORT, () => {
      console.log(`🚀 Netanix CTF Server running at http://localhost:${PORT}`);
      console.log(`🖼️ Uploads served from: ${UPLOAD_DIR}`);
      console.log(`📊 Admin Panel: http://localhost:${PORT}/api/ctf/`);
      console.log(`🎯 Frontend origins: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error.stack || error.message);
  }
};

startServer();
