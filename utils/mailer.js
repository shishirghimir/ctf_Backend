// utils/mailer.js
const { Resend } = require('resend');
require('dotenv').config();

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.MAIL_FROM_NAME || 'Netanix Portal';

// Verify Resend configuration on startup
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not configured');
  console.error('🔍 Set RESEND_API_KEY environment variable on Railway');
} else {
  console.log('✉️  Resend mailer initialized');
  console.log('📧 Email Config:', {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    apiKey: process.env.RESEND_API_KEY ? '***' + process.env.RESEND_API_KEY.slice(-4) : 'NOT_SET'
  });
}

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
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured. Set RESEND_API_KEY environment variable.');
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

    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: 'Your OTP for Password Reset',
      html,
    });

    console.log('✅ OTP email sent successfully to:', to);
    console.log('📧 Resend response:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error.message);
    throw error; // Re-throw to handle in calling function
  }
}

async function sendWelcomeEmail(to, name) {
  try {
    // Skip welcome email if Resend not configured (non-critical)
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️  Skipping welcome email - RESEND_API_KEY not configured');
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

    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: 'Welcome to Netanix CTF',
      html,
    });

    console.log('✅ Welcome email sent successfully to:', to);
    console.log('📧 Resend response:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
    // Don't throw error for welcome emails - they're non-critical
    return null;
  }
}

module.exports = {
  resend,
  buildBaseEmail,
  sendResetOtpEmail,
  sendWelcomeEmail,
};
