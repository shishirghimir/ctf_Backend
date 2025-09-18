const express = require('express');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const app = express();

const PORT = Number(process.env.PORT || 5000);
const { sequelize, connectDB } = require('./db/database');
const { initializeModels } = require('./model/index');

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// Security & parsing
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // allow API JSON cross-origin
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// CORS with credentials for frontend
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.CLIENT_ORIGIN?.replace(/\/$/, ''), // Remove trailing slash if present
  'https://ctfbackend-production.up.railway.app', // Allow Railway backend URL
  'http://localhost:5173',  // Common React dev port
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 CORS Debug - Origin received:', origin);
    console.log('🔍 CORS Debug - CLIENT_ORIGIN env:', process.env.CLIENT_ORIGIN);
    console.log('🔍 CORS Debug - Allowed origins:', allowedOrigins);

    if (!origin) return callback(null, true); // allow no-origin (curl/Postman)

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

// Static
app.use('/uploads', express.static('uploads'));

// Basic rate limit for auth & otp
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/pract/login', authLimiter);
app.use('/api/pract/send-reset-otp', authLimiter);

// Health check endpoint for Railway
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Netanix CTF Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use("/api/pract", require('./Route/pracRoute'));
app.use("/api/member", require('./Route/memberRoute'));
app.use("/api/ctf", require('./Route/ctfRoute'));
app.use("/api/team", require('./Route/teamRoute'));
app.use("/api/registration", require('./Route/registrationRoute'));

const startServer = async () => {
  try {
    // Check required environment variables for MySQL
    const required = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
    if (missing.length) {
      console.error('❌ Missing required environment variables:', missing.join(', '));
      console.error('Create or update \'express-server/.env\' with these values.');
      return;
    }

    await connectDB();
    initializeModels();

    // 🚨 TEMP PATCH: sync models to DB in Railway (adds missing columns)
    await sequelize.sync({ alter: true })
      .then(() => console.log('✅ Sequelize: DB schema synced (alter)'))
      .catch(err => console.error('❌ Sequelize sync failed:', err));

    app.listen(PORT, () => {
      console.log(`🚀 Netanix CTF Server running at http://localhost:${PORT}`);
      console.log(`📊 Admin Panel: http://localhost:${PORT}/api/ctf/`);
      console.log(`🎯 Frontend: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error.stack || error.message);
  }
};

startServer();
