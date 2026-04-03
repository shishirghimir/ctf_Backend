const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
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
const Submission = require('../model/submissionmodel');
const Tournament = require('../model/tournamentmodel');
const Team = require('../model/teammodel');
const Challenge = require('../model/challengemodel');
const { Category } = require('../model/index');
// Note: MCQ system removed in favor of CTF routes

// ✅ User Routes
router.post('/users', createUsers);
router.post('/register', createUsers); // Add registration endpoint
router.put('/users/:id', verifyToken, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    // If user is not admin and tries to update someone else → deny
    if (!req.user.isAdmin && req.user.id !== userId) {
      return res.status(403).json({ message: '❌ You can only update your own account' });
    }

    // Call the controller normally
    await updateUsers(req, res, next);
  } catch (err) {
    next(err);
  }
});
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

// ✅ Server-side admin gate — requireAdmin checks DB directly, cannot be bypassed by response interception
// Returns 200 only if the token belongs to a real DB-confirmed admin. Otherwise 403.
router.get('/verify-admin', verifyToken, requireAdmin, (req, res) => {
  res.json({ verified: true });
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
    res.status(500).json({ message: '❌ Failed to send OTP', ...(process.env.NODE_ENV === "development" && { error: error.message }) });
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
    res.status(500).json({ message: '❌ Failed to reset password', ...(process.env.NODE_ENV === "development" && { error: error.message }) });
  }
});

// ✅ Certificate endpoint — team members only, after tournament ends
// Supports ?tournamentId=X for per-tournament certificates
router.get('/certificate', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Must be in a team to earn a certificate
    if (!user.teamId) {
      return res.status(403).json({
        message: 'Certificates are only awarded to team members. Join or create a team to participate.',
        requiresTeam: true,
      });
    }

    const team = await Team.findByPk(user.teamId);

    // Pick tournament: specific one by query param, or most recent ended one
    let tournament;
    if (req.query.tournamentId) {
      tournament = await Tournament.findByPk(req.query.tournamentId);
    } else {
      tournament = await Tournament.findOne({
        where: { isActive: false },
        order: [['endTime', 'DESC']],
      });
    }

    // Tournament must have ended
    if (!tournament || tournament.isActive || (tournament.endTime && new Date(tournament.endTime) > new Date())) {
      return res.status(403).json({
        message: 'Your certificate will be available once the tournament ends.',
        tournamentNotEnded: true,
      });
    }

    // Count solves within the tournament window (if time bounds exist), else all solves
    let solveWhere = { userId, correct: true };
    if (tournament.startTime && tournament.endTime) {
      solveWhere.createdAt = { [Op.between]: [tournament.startTime, tournament.endTime] };
    }
    const solveCount = await Submission.count({ where: solveWhere });

    // Unique cert ID per user + tournament
    const certId = `NCTF-${String(userId).padStart(4, '0')}-T${String(tournament.id).padStart(3, '0')}`;

    res.json({
      success: true,
      data: {
        userName: user.fullName || user.username,
        username: user.username,
        teamName: team?.name || 'Unknown Team',
        teamRank: team?.teamRank || null,
        totalPoints: user.totalPoints || 0,
        solvedChallenges: solveCount,
        tournamentName: tournament.name || 'Netanix CTF',
        issuedDate: tournament.endTime,
        certificateId: certId,
        tournamentId: tournament.id,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate certificate', ...(process.env.NODE_ENV === "development" && { error: err.message }) });
  }
});

// ✅ List ended tournaments the user can get certificates for
router.get('/my-tournaments', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    if (!user || !user.teamId) return res.json({ success: true, data: [] });

    const tournaments = await Tournament.findAll({
      where: { isActive: false, endTime: { [Op.lt]: new Date() } },
      order: [['endTime', 'DESC']],
      limit: 10,
    });

    res.json({ success: true, data: tournaments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tournaments', ...(process.env.NODE_ENV === "development" && { error: err.message }) });
  }
});

// ✅ Solve history — last 30 correct submissions with challenge + category info
router.get('/solve-history', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const solves = await Submission.findAll({
      where: { userId, correct: true },
      order: [['createdAt', 'DESC']],
      limit: 30,
      include: [{
        model: Challenge,
        attributes: ['title', 'points', 'id'],
        include: [{ model: Category, attributes: ['name'] }],
      }],
    });

    res.json({
      success: true,
      data: solves.map(s => ({
        id: s.id,
        challengeId: s.challengeId,
        title: s.Challenge?.title || 'Unknown Challenge',
        points: s.pointsAwarded || s.Challenge?.points || 0,
        solvedAt: s.createdAt,
        isFirstSolve: s.isFirstSolve,
        category: s.Challenge?.Category?.name || 'Unknown',
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch solve history', ...(process.env.NODE_ENV === "development" && { error: err.message }) });
  }
});

module.exports = router;
