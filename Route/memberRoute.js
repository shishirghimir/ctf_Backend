// routes/member.js
const express = require('express');
const { Op } = require('sequelize');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const User = require('../model/usermodel');

// GET /api/member/me
router.get('/me', verifyToken, (req, res) => {
  if (req.user.isAdmin) {
    return res.status(403).json({ message: '❌ Admins are not allowed here' });
  }
  res.json(req.user);
});

// PUT /api/member/me — update profile (username, email, and other fields)
router.put('/me', verifyToken, async (req, res) => {
  if (req.user.isAdmin) {
    return res.status(403).json({ message: '❌ Admins are not allowed here' });
  }

  try {
    const { fullName, username, email, education, profession, contactNumber } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '❌ User not found' });
    }

    // ✅ Validate and update email (if provided)
    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!trimmedEmail) {
        return res.status(400).json({ message: '❌ Email cannot be empty' });
      }
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ message: '❌ Please provide a valid email address' });
      }

      // Check uniqueness
      const existingEmail = await User.findOne({
        where: {
          email: trimmedEmail,
          id: { [Op.ne]: userId }
        }
      });
      if (existingEmail) {
        return res.status(409).json({ message: '❌ This email is already in use' });
      }

      user.email = trimmedEmail;
    }

    // ✅ Validate and update username (if provided)
    if (username !== undefined) {
      const trimmed = username.trim();
      if (!trimmed) {
        return res.status(400).json({ message: '❌ Username cannot be empty' });
      }
      if (trimmed.length < 3 || trimmed.length > 20) {
        return res.status(400).json({ message: '❌ Username must be 3–20 characters long' });
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        return res.status(400).json({
          message: '❌ Username can only contain letters, numbers, underscores (_), and hyphens (-)'
        });
      }

      const existingUser = await User.findOne({
        where: {
          username: trimmed,
          id: { [Op.ne]: userId }
        }
      });
      if (existingUser) {
        return res.status(409).json({ message: '❌ Username is already taken' });
      }

      user.username = trimmed;
    }

    // Update other optional fields
    if (fullName !== undefined) user.fullName = fullName;
    if (education !== undefined) user.education = education;
    if (profession !== undefined) user.profession = profession;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;

    await user.save();

    res.json({
      message: '✅ Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        education: user.education,
        profession: user.profession,
        contactNumber: user.contactNumber,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: '❌ Server error while updating profile' });
  }
});

module.exports = router;
