const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const User = require('../model/usermodel');

// Only members (non-admins) can access this
router.get('/me', verifyToken, (req, res) => {
  if (req.user.isAdmin) {
    return res.status(403).json({ message: '❌ Admins are not allowed here' });
  }

  res.json(req.user); // Send user info
});

// Update own profile (limited fields)
router.put('/me', verifyToken, async (req, res) => {
  if (req.user.isAdmin) {
    return res.status(403).json({ message: '❌ Admins are not allowed here' });
  }
  try {
    const { fullName, education, profession, contactNumber } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: '❌ User not found' });

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
    res.status(500).json({ message: '❌ Failed to update profile', error: e.message });
  }
});

module.exports = router;
