const jwt = require('jsonwebtoken');
const User = require('../model/usermodel');

// Read JWT from httpOnly cookie "token"
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '❌ Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'email', 'isAdmin']
    });

    if (!user) {
      return res.status(404).json({ message: '❌ User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: '❌ Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: '❌ Admin access required' });
  next();
};

module.exports = verifyToken;
module.exports.requireAdmin = requireAdmin;
