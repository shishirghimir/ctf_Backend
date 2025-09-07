const User = require('../model/usermodel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail } = require('../utils/mailer');
const NotificationService = require('../utils/notificationService');

// GET all users (exclude passwords)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'isAdmin'],
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to fetch users",
      error: error.message,
    });
  }
};

// CREATE user with optional admin role and validation
const createUsers = async (req, res) => {
  try {
    const { username, email, password, isAdmin, fullName, education, profession, contactNumber } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: '❌ username, email and password are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: '❌ Email already registered' });
    }

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ message: '❌ Username already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      isAdmin: !!isAdmin,
      fullName: fullName || null,
      education: education || null,
      profession: profession || null,
      contactNumber: contactNumber || null,
    });

    // Fire-and-forget welcome email (non-blocking)
    try { await sendWelcomeEmail(newUser.email, newUser.fullName || newUser.username); } catch (e) { /* ignore */ }

    res.status(201).json({
      message: '✅ User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        fullName: newUser.fullName,
        education: newUser.education,
        profession: newUser.profession,
        contactNumber: newUser.contactNumber,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: '❌ Failed to create user',
      error: error.message,
    });
  }
};

// UPDATE user
const updateUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, isAdmin } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: `❌ No user found with ID ${id}.` });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    if (typeof isAdmin === 'boolean') user.isAdmin = isAdmin;

    await user.save();

    res.status(200).json({
      message: `✅ User with ID ${id} has been updated.`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("❌ Error updating user:", error.message);
    res.status(500).json({
      message: "❌ Server error while updating user",
      error: error.message,
    });
  }
};

// DELETE user
const deleteUsers = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await User.destroy({ where: { id } });

    if (deleted) {
      res.status(200).json({ message: `✅ User with ID ${id} has been deleted.` });
    } else {
      res.status(404).json({ message: `❌ No user found with ID ${id}.` });
    }
  } catch (error) {
    console.error("❌ Error deleting user:", error.message);
    res.status(500).json({
      message: "❌ Server error while deleting user",
      error: error.message,
    });
  }
};

// LOGIN user (cookie-based JWT)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: '❌ User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '❌ Invalid credentials' });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Production-ready cookie settings for cross-domain deployment
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,        // Always true for HTTPS (required for production)
      sameSite: 'none',    // Required for cross-domain cookies (Vercel + Railway)
      maxAge: 60 * 60 * 1000, // 1h
    });

    // Send login notification (non-blocking)
    try {
      const ipAddress = req.headers['x-forwarded-for'] || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress ||
                       (req.connection.socket ? req.connection.socket.remoteAddress : null);
      
      await NotificationService.notifyLogin(user.id, user.username, ipAddress);
    } catch (notificationError) {
      console.error('Failed to send login notification:', notificationError);
      // Don't fail the login if notification fails
    }

    res.status(200).json({
      message: '✅ Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: '❌ Server error during login',
      error: error.message,
    });
  }
};

const logoutUser = async (_req, res) => {
  // Clear cookie with same settings as login for proper removal
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,        // Must match login cookie settings
    sameSite: 'none',    // Must match login cookie settings
  });
  res.json({ message: '✅ Logged out' });
};

module.exports = {
  createUsers,
  updateUsers,
  deleteUsers,
  loginUser,
  getAllUsers,
  logoutUser,
};
