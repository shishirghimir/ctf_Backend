const express = require('express');
const router = express.Router();
const axios = require('axios');
const bcrypt = require('bcryptjs');
const upload = require('../middleware/multerConfig');
const verifyToken = require('../middleware/auth'); // ✅ JWT from cookie
const { requireAdmin } = require('../middleware/auth');
const { sendResetOtpEmail } = require('../utils/mailer');

const {
  createUsers,
  updateUsers,
  deleteUsers,
  loginUser,
  getAllUsers,
  logoutUser,
} = require('../Controller/praccontroller');

const User = require('../model/usermodel');
// Note: MCQ system removed in favor of CTF routes

// ✅ User Routes
router.post('/users', createUsers);
router.post('/register', createUsers); // Add registration endpoint
router.put('/users/:id', updateUsers);
router.delete('/users/:id', verifyToken,
  requireAdmin, deleteUsers);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/users', verifyToken,
  requireAdmin, getAllUsers);

// Profile Image Upload removed - no longer needed

// MCQ endpoints removed

// ✅ Authenticated Profile Info (Protected) - works for both admin and member
router.get('/me', verifyToken, (req, res) => {
  res.json(req.user);
});

// ✅ Verify reCAPTCHA token (use env secret)
router.post('/verify-recaptcha', async (req, res) => {
  const { token } = req.body;
  const secretKey = process.env.RECAPTCHA_SECRET || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'; // default to test secret

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
    );

    if (!response.data.success) {
      return res.status(403).json({ message: '❌ Captcha verification failed' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: '❌ Captcha error', error: error.message });
  }
});

// ✅ Send OTP to Email (5 min expiry)
router.post('/send-reset-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: '❌ Email not found' });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.resetOtp = otp;
    user.otpExpires = otpExpires;
    await sendResetOtpEmail(user.email, otp);
    await user.save();
    res.json({ message: '✅ OTP sent to email' });

  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    res.status(500).json({ message: '❌ Failed to send OTP', error: error.message });
  }
});

// ✅ Verify OTP and Reset Password
router.post('/verify-reset-otp', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: '❌ User not found' });

    if (
      !user.resetOtp ||
      user.resetOtp.toString() !== otp ||
      new Date() > user.otpExpires
    ) {
      return res.status(400).json({ message: '❌ Invalid or expired OTP' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ message: '✅ Password successfully reset' });
  } catch (error) {
    console.error('❌ Reset error:', error);
    res.status(500).json({ message: '❌ Failed to reset password', error: error.message });
  }
});

module.exports = router;
