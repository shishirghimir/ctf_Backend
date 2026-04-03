require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Trust Railway's reverse proxy (fixes X-Forwarded-For / rate-limit warning)
app.set('trust proxy', 1);

// DB
const { sequelize, connectDB } = require('./db/database');
const { initializeModels } = require('./model/index');

// Multer config (uses Railway Volume if UPLOAD_DIR is set)
const { upload, UPLOAD_DIR } = require('./middleware/multerConfig');
const verifyToken = require('./middleware/auth');
const { requireAdmin } = require('./middleware/auth');

// ---------- Compression (reduces payload by ~70%) ----------
app.use(compression());

// ---------- Security & parsing ----------
app.use(helmet()); // Base helmet protection

// Extra headers for Mozilla Observatory + Nikto
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.hsts({ maxAge: 63072000, includeSubDomains: true, preload: true }));
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.permittedCrossDomainPolicies());

// Custom headers
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
const sanitizeBody = require('./middleware/sanitize');
app.use(sanitizeBody); // Strip XSS from all request bodies globally

// ---------- CORS with credentials ----------
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.CLIENT_ORIGIN?.replace(/\/$/, ''), // Remove trailing slash if present
  'https://ctfbackend-production.up.railway.app',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// ---------- Uploads: ensure dir exists & serve statically ----------
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
console.log('📁 UPLOAD_DIR:', UPLOAD_DIR);

app.use('/uploads', express.static(UPLOAD_DIR, {
  fallthrough: false,
  setHeaders(res) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  },
}));

// ---------- Upload endpoint ----------
app.post('/api/upload', verifyToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });

    const filename = req.file.filename;

    // FIXED: remove trailing slash from base URL
    const base = (process.env.PUBLIC_BASE_URL || 'https://api.netanixctf.xyz').replace(/\/$/, '');
    const url = `${base}/uploads/${filename}`;

    return res.json({ ok: true, filename, url });
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------- Safe download route (login required) ----------
app.get('/download/:filename', verifyToken, (req, res) => {
  try {
    // Prevent path traversal — strip any directory components
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: 'File not found' });
    }

    res.download(filePath, safeFilename, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ ok: false, error: 'Failed to download' });
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ---------- Basic rate limit for auth & otp ----------
const authLimiter      = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: '❌ Too many attempts, please try again later.' } });
const otpSendLimiter   = rateLimit({ windowMs: 60 * 60 * 1000, max: 5,  message: { message: '❌ Too many OTP requests, please try again in an hour.' } });
const otpVerifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5,  message: { message: '❌ Too many verification attempts, please request a new OTP.' } });
app.use('/api/pract/login',            authLimiter);
app.use('/api/pract/send-reset-otp',   otpSendLimiter);
app.use('/api/pract/verify-reset-otp', otpVerifyLimiter);

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
