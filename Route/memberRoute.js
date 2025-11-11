// routes/member.js
const express = require('express');
const { Op } = require('sequelize'); // Required for uniqueness check
const router = express.Router();
const verifyToken = require('../middleware/auth');
const User = require('../model/usermodel');

// GET /api/member/me — fetch current member profile
router.get('/me', verifyToken, (req, res) => {
  if (req.user.isAdmin) {
    return res.status(403).json({ message: '❌ Admins are not allowed here' });
  }
  res.json(req.user);
});

// PUT /api/member/me — update member profile (including username)
router.put('/me', verifyToken, async (req, res) => {
  if (req.user.isAdmin) {
    return res.status(403).json({ message: '❌ Admins are not allowed here' });
  }

  try {
    const { fullName, username, education, profession, contactNumber } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: '❌ User not found' });
    }

    // ✅ Handle username update (if provided)
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

      // Check uniqueness (case-insensitive alternative if needed, but Sequelize is case-sensitive by default)
      const existing = await User.findOne({
        where: {
          username: trimmed,
          id: { [Op.ne]: userId }
        }
      });

      if (existing) {
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

    // Return updated user (excluding sensitive fields like password)
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
    console.error('Member profile update error:', err);
    res.status(500).json({ message: '❌ Server error while updating profile' });
  }
});

module.exports = router;
