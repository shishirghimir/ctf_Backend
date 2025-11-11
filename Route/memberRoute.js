const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const User = require('../model/usermodel');

// GET /me — unchanged
router.get('/me', verifyToken, (req, res) => {
  if (req.user.isAdmin) {
    return res.status(403).json({ message: '❌ Admins are not allowed here' });
  }
  res.json(req.user);
});

// PUT /me — ✅ UPDATED to support username change
router.put('/me', verifyToken, async (req, res) => {
  if (req.user.isAdmin) {
    return res.status(403).json({ message: '❌ Admins are not allowed here' });
  }

  try {
    const { fullName, username, education, profession, contactNumber } = req.body; // ✅ Added username
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '❌ User not found' });
    }

    // ✅ Validate and update username (if provided)
    if (typeof username !== 'undefined') {
      const trimmedUsername = username.trim();

      // Basic validation
      if (!trimmedUsername) {
        return res.status(400).json({ message: '❌ Username cannot be empty' });
      }

      if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
        return res.status(400).json({ message: '❌ Username must be between 3 and 20 characters' });
      }

      // Allow only letters, numbers, underscores, hyphens
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        return res.status(400).json({ message: '❌ Username can only contain letters, numbers, underscores (_), and hyphens (-)' });
      }

      // Check uniqueness (case-insensitive)
      const existingUser = await User.findOne({
        where: { 
          username: trimmedUsername,
          id: { [Op.ne]: userId } // Exclude current user
        }
      });

      if (existingUser) {
        return res.status(409).json({ message: '❌ Username is already taken' });
      }

      user.username = trimmedUsername;
    }

    // Update other fields (as before)
    if (typeof fullName !== 'undefined') user.fullName = fullName;
    if (typeof education !== 'undefined') user.education = education;
    if (typeof profession !== 'undefined') user.profession = profession;
    if (typeof contactNumber !== 'undefined') user.contactNumber = contactNumber;

    await user.save();

    res.json({
      message: '✅ Profile updated',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        fullName: user.fullName,
        education: user.education,
        profession: user.profession,
        contactNumber: user.contactNumber,
      },
    });
  } catch (e) {
    console.error('Profile update error:', e);
    res.status(500).json({ message: '❌ Failed to update profile', error: e.message });
  }
});

module.exports = router;
