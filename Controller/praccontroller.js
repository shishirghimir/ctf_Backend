const User = require('../model/usermodel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail } = require('../utils/mailer');
const NotificationService = require('../utils/notificationService');

/*  
 -------------------------------------------------------------------
    SECURITY PATCH ⚠️
    Never accept isAdmin from client-side.
    Only server / seeded admin can set admin privilege.
 -------------------------------------------------------------------
*/

// GET all users (only for admins)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'isAdmin', 'fullName', 'education', 'profession', 'contactNumber', 'totalPoints']
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "❌ Failed to fetch users", ...(process.env.NODE_ENV === "development" && { error: error.message }) });
  }
};

// CREATE user (Public registration)
const createUsers = async (req, res) => {
  try {
    const { username, email, password, fullName, education, profession, contactNumber } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: '❌ Username, email & password required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: '❌ Email already registered' });

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) return res.status(409).json({ message: '❌ Username already taken' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      isAdmin: false,  // ❌CLIENT CANNOT MAKE ADMIN
      fullName: fullName || null,
      education: education || null,
      profession: profession || null,
      contactNumber: contactNumber || null,
    });

    sendWelcomeEmail(newUser.email, newUser.fullName || newUser.username).catch(() => {});

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
        totalPoints: newUser.totalPoints,
      },
    });
  } catch (error) {
    res.status(400).json({ message: '❌ Failed to create user', ...(process.env.NODE_ENV === "development" && { error: error.message }) });
  }
};

// UPDATE user (Client-safe, admin cannot be changed)
const updateUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, fullName, education, profession, contactNumber } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: `❌ No user found with ID ${id}.` });

    // NORMAL UPDATES ALLOWED
    if (username) user.username = username;
    if (email) user.email = email;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (education !== undefined) user.education = education;
    if (profession !== undefined) user.profession = profession;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;

    // ❌ DO NOT UPDATE isAdmin FROM CLIENT
    // This is the vulnerability patch

    await user.save();

    res.status(200).json({
      message: `✅ User with ID ${id} updated`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        fullName: user.fullName,
        education: user.education,
        profession: user.profession,
        contactNumber: user.contactNumber,
        totalPoints: user.totalPoints,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "❌ Server error while updating user", ...(process.env.NODE_ENV === "development" && { error: error.message }) });
  }
};

// DELETE user (Admin only)
const deleteUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.destroy({ where: { id } });

    if (deleted) {
      return res.status(200).json({ message: `✅ User with ID ${id} deleted.` });
    }

    return res.status(404).json({ message: `❌ No user found with ID ${id}.` });
  } catch (error) {
    res.status(500).json({ message: "❌ Server error while deleting user", ...(process.env.NODE_ENV === "development" && { error: error.message }) });
  }
};

// LOGIN user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    const isMatch = user && await bcrypt.compare(password, user.password);
    if (!user || !isMatch) return res.status(401).json({ message: '❌ Invalid email or password' });

    user.lastLogin = new Date();
    await user.save();

    // JWT with user.id only (never send isAdmin in token)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '4h',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 4 * 60 * 60 * 1000,
    });

    const ipAddress =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    NotificationService.notifyLogin(user.id, user.username, ipAddress).catch(() => {});

    res.status(200).json({
      message: '✅ Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        fullName: user.fullName,
        education: user.education,
        profession: user.profession,
        contactNumber: user.contactNumber,
        totalPoints: user.totalPoints,
      },
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Server error during login', ...(process.env.NODE_ENV === "development" && { error: error.message }) });
  }
};

// LOGOUT user
const logoutUser = async (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
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
