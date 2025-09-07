// utils/mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter from env with better error handling
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Additional settings for better reliability
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
});

// Verify transport on startup with detailed logging and safe error handling
transporter.verify().then(() => {
  console.log('✉️  Mailer ready - SMTP connection verified');
  console.log('📧 SMTP Config:', {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    user: process.env.SMTP_USER ? '***@' + (process.env.SMTP_USER.includes('@') ? process.env.SMTP_USER.split('@')[1] : 'unknown') : 'NOT_SET',
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true
  });
}).catch((e) => {
  console.error('❌ Mailer verification failed:', e.message);
  console.error('🔍 Check these environment variables on Railway:');
  console.error('   - SMTP_HOST (default: smtp.gmail.com)');
  console.error('   - SMTP_PORT (default: 465)');
  console.error('   - SMTP_USER (your email address)');
  console.error('   - SMTP_PASS (Gmail App Password, not regular password)');
  console.error('   - MAIL_FROM_EMAIL (optional, defaults to SMTP_USER)');
  console.error('   - MAIL_FROM_NAME (optional, defaults to "Netanix Portal")');
});

const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;
const FROM_NAME = process.env.MAIL_FROM_NAME || 'Netanix Portal';

function buildBaseEmail({ title, bodyHtml }) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;padding:24px;background:#0b1220;color:#e5e7eb">
    <div style="text-align:center;margin-bottom:16px">
      <h2 style="margin:0;color:#60a5fa">${FROM_NAME}</h2>
    </div>
    <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:20px">
      <h3 style="margin:0 0 12px 0;color:#f9fafb">${title}</h3>
      <div style="color:#d1d5db;font-size:14px;line-height:1.6">${bodyHtml}</div>
    </div>
    <p style="color:#6b7280;font-size:12px;margin-top:16px">This is an automated message. Do not reply.</p>
  </div>`;
}

async function sendResetOtpEmail(to, otp) {
  try {
    // Validate required environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    }

    const html = buildBaseEmail({
      title: 'Password Reset Verification',
      bodyHtml: `
        <p>Hello,</p>
        <p>Your one-time password (OTP) is:</p>
        <div style="font-size:28px;font-weight:700;color:#34d399;letter-spacing:3px">${otp}</div>
        <p>This code expires in <strong>5 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
      `,
    });

    const result = await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: 'Your OTP for Password Reset',
      html,
    });

    console.log('✅ OTP email sent successfully to:', to);
    return result;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error.message);
    throw error; // Re-throw to handle in calling function
  }
}

async function sendWelcomeEmail(to, name) {
  try {
    // Skip welcome email if SMTP not configured (non-critical)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️  Skipping welcome email - SMTP not configured');
      return null;
    }

    const html = buildBaseEmail({
      title: 'Welcome to Netanix CTF',
      bodyHtml: `
        <p>Hi ${name || 'there'},</p>
        <p>Welcome to the Netanix CTF Platform! Your account has been created successfully.</p>
        <p>You can now log in and start solving challenges. Good luck!</p>
      `,
    });

    const result = await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: 'Welcome to Netanix CTF',
      html,
    });

    console.log('✅ Welcome email sent successfully to:', to);
    return result;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
    // Don't throw error for welcome emails - they're non-critical
    return null;
  }
}

module.exports = {
  transporter,
  buildBaseEmail,
  sendResetOtpEmail,
  sendWelcomeEmail,
};
