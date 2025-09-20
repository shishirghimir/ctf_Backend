const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { upload } = require('../middleware/multerConfig');
const verifyToken = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

const { Category, Challenge, Submission, User, Attempt, Notification, UserHint, Team, TeamScore, TeamHint, Tournament } = require('../model/index');
const NotificationService = require('../utils/notificationService');

const router = express.Router();

// Security utilities
function hashFlag(flag) {
  return crypto.createHash('sha256').update(flag).digest('hex');
}

function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '');
}

// Robust boolean parser for body/form-data values
function parseBool(val) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const v = val.trim().toLowerCase();
    return v === 'true' || v === '1' || v === 'on' || v === 'yes';
  }
  return Boolean(val);
}

// Rate limiting for flag submissions
async function checkSubmissionRateLimit(userId, challengeId, ipAddress) {
  const now = new Date();
  
  let attempt = await Attempt.findOne({
    where: { userId, challengeId }
  });

  if (!attempt) {
    // First attempt for this user-challenge combination
    attempt = await Attempt.create({
      userId,
      challengeId,
      attemptCount: 1,
      lastAttemptAt: now,
      ipAddress
    });
    return { allowed: true, remainingAttempts: 2, waitTime: 0 };
  }

  // Check if user is currently blocked
  if (attempt.blockedUntil && now < attempt.blockedUntil) {
    const waitTime = Math.ceil((attempt.blockedUntil - now) / 1000);
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      waitTime,
      message: `Too many attempts. Please wait ${waitTime} seconds before trying again.`
    };
  }

  // Reset block if time has passed
  if (attempt.blockedUntil && now >= attempt.blockedUntil) {
    attempt.attemptCount = 0;
    attempt.blockedUntil = null;
  }

  // Check if within rate limit (3 attempts)
  if (attempt.attemptCount >= 3) {
    // Block for 7 seconds
    attempt.blockedUntil = new Date(now.getTime() + 7000);
    await attempt.save();
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      waitTime: 7,
      message: 'Too many attempts. Please wait 7 seconds before trying again.'
    };
  }

  // Increment attempt count
  attempt.attemptCount += 1;
  attempt.lastAttemptAt = now;
  attempt.ipAddress = ipAddress;
  await attempt.save();

  return { 
    allowed: true, 
    remainingAttempts: 3 - attempt.attemptCount, 
    waitTime: 0 
  };
}

// Admin Dashboard Stats with enhanced metrics
router.get('/admin/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const totalChallenges = await Challenge.count();
    const activeChallenges = await Challenge.count({ where: { isActive: true } });
    const totalCategories = await Category.count();
    const totalSubmissions = await Submission.count();
    const correctSubmissions = await Submission.count({ where: { correct: true } });
    const uniqueSolvers = await Submission.count({
      where: { correct: true },
      distinct: true,
      col: 'userId'
    });

    // Recent challenges
    const recentChallenges = await Challenge.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{ model: Category, attributes: ['name'] }]
    });

    // Recent activity
    const recentSubmissions = await Submission.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, attributes: ['username'] },
        { model: Challenge, attributes: ['title'] }
      ]
    });

    // Challenge difficulty distribution
    const difficultyStats = await Challenge.findAll({
      attributes: [
        'difficulty',
        [Challenge.sequelize.fn('COUNT', Challenge.sequelize.col('id')), 'count']
      ],
      group: ['difficulty']
    });

    // Top users (renamed from topSolvers to match AdminDashboard expectations)
    const topUsers = await User.findAll({
      attributes: ['username', 'totalPoints'],
      where: { totalPoints: { [Op.gt]: 0 } },
      order: [['totalPoints', 'DESC']],
      limit: 10
    });

    // Most solved challenges
    const popularChallenges = await Challenge.findAll({
      attributes: ['title', 'solveCount', 'points'],
      order: [['solveCount', 'DESC']],
      limit: 10
    });

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalChallenges,
        activeChallenges,
        totalCategories,
        totalSubmissions,
        correctSubmissions,
        uniqueSolvers,
        successRate: totalSubmissions > 0 ? ((correctSubmissions / totalSubmissions) * 100).toFixed(1) : 0
      },
      recentChallenges,
      recentSubmissions: recentSubmissions.map(s => ({
        username: s.User?.username,
        challenge: s.Challenge?.title,
        correct: s.correct,
        points: s.pointsAwarded,
        timestamp: s.createdAt
      })),
      difficultyStats,
      topUsers,
      popularChallenges
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats', error: error.message });
  }
});

// -------- Admin: Categories --------
router.post('/categories', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    
    const sanitizedName = sanitizeInput(name);
    const sanitizedDescription = sanitizeInput(description);
    
    const exists = await Category.findOne({ where: { name: sanitizedName } });
    if (exists) return res.status(409).json({ message: 'Category already exists' });
    
    const cat = await Category.create({ 
      name: sanitizedName, 
      description: sanitizedDescription 
    });
    res.status(201).json(cat);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create category', error: e.message });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const cats = await Category.findAll({ 
      order: [['name', 'ASC']],
      include: [{
        model: Challenge,
        attributes: ['id'],
        where: { isActive: true },
        required: false
      }]
    });
    
    const categoriesWithCount = cats.map(cat => ({
      ...cat.toJSON(),
      challengeCount: cat.Challenges ? cat.Challenges.length : 0
    }));
    
    res.json(categoriesWithCount);
  } catch (e) {
    console.error('Categories error:', e);
    res.status(500).json({ message: 'Failed to load categories', error: e.message });
  }
});

router.put('/categories/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Not found' });
    
    const { name, description } = req.body;
    if (name) cat.name = sanitizeInput(name);
    if (description !== undefined) cat.description = sanitizeInput(description);
    
    await cat.save();
    res.json(cat);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update category', error: e.message });
  }
});

router.delete('/categories/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const challengeCount = await Challenge.count({ where: { categoryId: req.params.id } });
    if (challengeCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category with existing challenges' });
    }
    
    const deleted = await Category.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete category', error: e.message });
  }
});

// -------- Admin: Challenges --------
router.post('/challenges', verifyToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const { 
      title, description, hint, hint2, points, categoryId, flag, difficulty, maxAttempts, driveLink,
      isTeamChallenge, tournamentOnly, hintPenalty, maxHints
    } = req.body;
    
    if (!title || !description || !categoryId || !flag) {
      return res.status(400).json({ message: 'title, description, categoryId, flag are required' });
    }
    
    const sanitizedTitle = sanitizeInput(title);
    const sanitizedDescription = sanitizeInput(description);
    const sanitizedHint = hint ? sanitizeInput(hint) : null;
    const sanitizedHint2 = hint2 ? sanitizeInput(hint2) : null;
    const sanitizedDriveLink = driveLink ? sanitizeInput(driveLink) : null;
    
    const challenge = await Challenge.create({
      title: sanitizedTitle,
      description: sanitizedDescription,
      hint: sanitizedHint,
      hint2: sanitizedHint2,
      points: Number(points) || 100,
      categoryId: Number(categoryId),
      filePath: req.file ? `/uploads/${req.file.filename}` : null,
      flagHash: hashFlag(flag.trim()),
      difficulty: difficulty || 'Medium',
      maxAttempts: maxAttempts ? Number(maxAttempts) : null,
      driveLink: sanitizedDriveLink,
      isTeamChallenge: parseBool(isTeamChallenge),
      tournamentOnly: parseBool(tournamentOnly),
      showInSolo: req.body.showInSolo !== undefined ? parseBool(req.body.showInSolo) : true,
      hintPenalty: Number(hintPenalty) || 50,
      maxHints: Number(maxHints) || 2,
      isActive: true
    });

    // Fire-and-forget notifications so challenge creation responds fast
    setImmediate(async () => {
      try {
        const author = await User.findByPk(req.user.id, { attributes: ['username'] });
        await NotificationService.notifyNewChallenge(
          sanitizedTitle,
          author?.username || 'Admin',
          challenge.id,
          null
        );
      } catch (notificationError) {
        console.error('Failed to send challenge creation notifications:', notificationError);
      }
    });

    res.status(201).json(challenge);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create challenge', error: e.message });
  }
});

router.get('/admin/challenges', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { category, difficulty, limit, offset, page, pageSize, includeInactive } = req.query;
    const where = {};
    if (!includeInactive) where.isActive = true;
    if (category) where.categoryId = category;
    if (difficulty) where.difficulty = difficulty;

    const size = Math.min(parseInt(pageSize || limit || 50, 10) || 50, 200);
    const off = (() => {
      if (page) {
        const p = Math.max(parseInt(page, 10) || 1, 1);
        return (p - 1) * size;
      }
      return Math.max(parseInt(offset, 10) || 0, 0);
    })();

    const list = await Challenge.findAll({
      attributes: { exclude: ['flagHash'] },
      where,
      include: [
        { model: Category, attributes: ['id', 'name'] },
        {
          model: User,
          as: 'FirstSolver',
          attributes: ['username'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: size,
      offset: off
    });

    res
      .set({ 'X-Pagination-Limit': String(size), 'X-Pagination-Offset': String(off) })
      .json(list);
  } catch (e) {
    console.error('Admin challenges error:', e);
    res.status(500).json({ message: 'Failed to load admin challenges', error: e.message });
  }
});

router.get('/challenges', async (req, res) => {
  try {
    const { category, difficulty, solved, limit, offset, page, pageSize } = req.query;
    const where = { 
      isActive: true,
      // Exclude team challenges and tournament-only challenges from solo challenges
      isTeamChallenge: false,
      tournamentOnly: false,
      showInSolo: true // Only show challenges meant for solo play
    };

    if (category) where.categoryId = category;
    if (difficulty) where.difficulty = difficulty;

    // Pagination: support limit/offset or page/pageSize. Defaults for safety.
    const size = Math.min(parseInt(pageSize || limit || 20, 10) || 20, 100);
    const off = (() => {
      if (page) {
        const p = Math.max(parseInt(page, 10) || 1, 1);
        return (p - 1) * size;
      }
      return Math.max(parseInt(offset, 10) || 0, 0);
    })();

    const list = await Challenge.findAll({
      attributes: { exclude: ['flagHash'] },
      where,
      include: [
        { model: Category, attributes: ['id', 'name'] },
        {
          model: User,
          as: 'FirstSolver',
          attributes: ['username'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: size,
      offset: off
    });

    // Add solve status if user is authenticated
    let enrichedList = list;
    if (req.headers.authorization || req.cookies?.token) {
      try {
        const token = (req.headers.authorization?.split(' ')[1]) || req.cookies?.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userSolves = await Submission.findAll({
          where: { userId: decoded.id, correct: true },
          attributes: ['challengeId']
        });

        const solvedIds = new Set(userSolves.map(s => s.challengeId));

        enrichedList = list.map(challenge => ({
          ...challenge.toJSON(),
          solved: solvedIds.has(challenge.id),
          firstSolver: challenge.FirstSolver?.username || null
        }));

        if (solved === 'true') {
          enrichedList = enrichedList.filter(c => c.solved);
        } else if (solved === 'false') {
          enrichedList = enrichedList.filter(c => !c.solved);
        }
      } catch (_) {
        // Invalid token, continue without user-specific data
      }
    }

    // Preserve array response for compatibility
    res
      .set({ 'X-Pagination-Limit': String(size), 'X-Pagination-Offset': String(off) })
      .json(enrichedList);
  } catch (e) {
    console.error('Challenges error:', e);
    res.status(500).json({ message: 'Failed to load challenges', error: e.message });
  }
});

router.get('/challenges/:id', async (req, res) => {
  try {
    const ch = await Challenge.findByPk(req.params.id, {
      attributes: { exclude: ['flagHash'] },
      include: [
        { model: Category, attributes: ['id', 'name'] },
        {
          model: User,
          as: 'FirstSolver',
          attributes: ['username'],
          required: false
        }
      ],
    });
    
    if (!ch || !ch.isActive) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Get recent solvers (last 5)
    const recentSolvers = await Submission.findAll({
      where: { challengeId: req.params.id, correct: true },
      include: [{ model: User, attributes: ['username'] }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const challengeData = {
      ...ch.toJSON(),
      firstSolver: ch.FirstSolver ? {
        username: ch.FirstSolver.username
      } : null,
      recentSolvers: recentSolvers.map(s => ({
        username: s.User.username,
        solvedAt: s.createdAt
      }))
    };

    res.json(challengeData);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch challenge', error: e.message });
  }
});

router.put('/challenges/:id', verifyToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    const ch = await Challenge.findByPk(req.params.id);
    if (!ch) return res.status(404).json({ message: 'Not found' });
    
    const { title, description, hint, hint2, points, categoryId, flag, difficulty, maxAttempts, isActive, driveLink, hintPenalty, maxHints, isTeamChallenge, tournamentOnly, showInSolo } = req.body;
    
    if (title) ch.title = sanitizeInput(title);
    if (description) ch.description = sanitizeInput(description);
    if (hint !== undefined) ch.hint = hint ? sanitizeInput(hint) : null;
    if (hint2 !== undefined) ch.hint2 = hint2 ? sanitizeInput(hint2) : null;
    if (points !== undefined) ch.points = Number(points);
    if (categoryId !== undefined) ch.categoryId = Number(categoryId);
    if (flag) ch.flagHash = hashFlag(flag.trim());
    if (difficulty) ch.difficulty = difficulty;
    if (maxAttempts !== undefined) ch.maxAttempts = maxAttempts ? Number(maxAttempts) : null;
    if (isActive !== undefined) ch.isActive = parseBool(isActive);
    if (driveLink !== undefined) ch.driveLink = driveLink ? sanitizeInput(driveLink) : null;
    if (hintPenalty !== undefined) ch.hintPenalty = Number(hintPenalty);
    if (maxHints !== undefined) ch.maxHints = Number(maxHints);
    if (isTeamChallenge !== undefined) ch.isTeamChallenge = parseBool(isTeamChallenge);
    if (tournamentOnly !== undefined) ch.tournamentOnly = parseBool(tournamentOnly);
    if (showInSolo !== undefined) ch.showInSolo = parseBool(showInSolo);
    if (req.file) ch.filePath = `/uploads/${req.file.filename}`;
    
    await ch.save();
    res.json(ch);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update challenge', error: e.message });
  }
});

router.delete('/challenges/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Soft delete by setting isActive to false
    const updated = await Challenge.update(
      { isActive: false },
      { where: { id: req.params.id } }
    );
    
    if (!updated[0]) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Challenge deactivated' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete challenge', error: e.message });
  }
});

// -------- Enhanced Flag Submission with Rate Limiting --------
router.post('/challenges/:id/submit', verifyToken, async (req, res) => {
  try {
    const { flag } = req.body;
    if (!flag) return res.status(400).json({ message: 'flag is required' });
    
    const sanitizedFlag = sanitizeInput(flag.trim());
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'];
    
    const ch = await Challenge.findByPk(req.params.id);
    if (!ch || !ch.isActive) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Get user and check if they're in a team
    const user = await User.findByPk(req.user.id);
    const team = user.teamId ? await Team.findByPk(user.teamId) : null;
    
    // Check if tournament mode is active
    const activeTournament = await Tournament.findOne({
      where: { isActive: true }
    });
    
    // Determine if this should be team scoring:
    // 1. Tournament is active AND user is in a team = Team scoring
    // 2. Challenge is marked as tournamentOnly but no active tournament = Error
    // 3. Otherwise = Individual scoring
    const shouldUseTeamScoring = activeTournament && team && team.tournamentMode;
    const isTournamentOnlyChallenge = ch.tournamentOnly;
    
    // If challenge is tournament-only but no active tournament, block submission
    if (isTournamentOnlyChallenge && !activeTournament) {
      return res.status(400).json({
        message: 'This challenge is only available during tournament mode',
        tournamentRequired: true
      });
    }
    
    // If tournament is active but user is not in a team, and challenge requires tournament
    if (activeTournament && (ch.isTeamChallenge || ch.tournamentOnly) && !team) {
      return res.status(400).json({
        message: 'You must be in a team to participate in tournament challenges',
        teamRequired: true
      });
    }

    if (shouldUseTeamScoring) {
      // TEAM SCORING LOGIC (Tournament Mode)

      // Check if team has already solved this challenge
      const existingTeamScore = await TeamScore.findOne({
        where: { teamId: team.id, challengeId: ch.id }
      });

      if (existingTeamScore) {
        return res.status(400).json({ 
          message: 'Your team has already solved this challenge',
          alreadySolved: true,
          isTeamChallenge: true
        });
      }

      // Check rate limiting for team challenges
      const rateLimitCheck = await checkSubmissionRateLimit(req.user.id, ch.id, ipAddress);
      if (!rateLimitCheck.allowed) {
        return res.status(429).json({
          message: rateLimitCheck.message,
          waitTime: rateLimitCheck.waitTime,
          remainingAttempts: rateLimitCheck.remainingAttempts,
          isTeamChallenge: true
        });
      }

      const providedHash = hashFlag(sanitizedFlag);
      const correct = crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(ch.flagHash));

      let pointsAwarded = 0;
      let isFirstSolve = false;

      if (correct) {
        pointsAwarded = ch.points;
        
        // Check if this is the first solve for this challenge
        if (!ch.firstSolverId) {
          isFirstSolve = true;
          // Award bonus points for first solve (50% bonus)
          pointsAwarded = Math.floor(ch.points * 1.5);
          
          // Update challenge with first solver info and set solve count to 1
          await Challenge.update({
            firstSolverId: req.user.id,
            firstSolvedAt: new Date(),
            solveCount: 1
          }, { where: { id: ch.id } });

          // Send first blood notifications
          try {
            const solver = await User.findByPk(req.user.id, { attributes: ['username'] });
            await NotificationService.notifyFirstBlood(
              ch.title,
              solver.username,
              ch.id,
              req.user.id
            );
          } catch (notificationError) {
            console.error('Failed to send first blood notifications:', notificationError);
            // Don't fail the submission if notifications fail
          }
        } else {
          // Increment solve count for subsequent solves
          await Challenge.increment('solveCount', { where: { id: ch.id } });
        }

        // Calculate final points after hint deductions
        const usedHints = await TeamHint.findAll({
          where: { teamId: team.id, challengeId: ch.id }
        });
        
        const totalHintPenalty = usedHints.reduce((sum, hint) => sum + hint.pointsDeducted, 0);
        const finalPoints = Math.max(0, pointsAwarded - totalHintPenalty);

        // Create team score record
        await TeamScore.create({
          teamId: team.id,
          challengeId: ch.id,
          solvedBy: req.user.id,
          points: pointsAwarded,
          hintsUsed: usedHints.length,
          pointsDeducted: totalHintPenalty,
          finalPoints: finalPoints,
          solvedAt: new Date(),
          tournamentMode: team.tournamentMode || false
        });

        // Update team's total points
        await Team.increment('totalPoints', { 
          by: finalPoints, 
          where: { id: team.id } 
        });

        // Reset attempt counter on successful solve
        await Attempt.destroy({
          where: { userId: req.user.id, challengeId: ch.id }
        });

        const response = {
          correct: true,
          pointsAwarded: finalPoints,
          originalPoints: pointsAwarded,
          hintPenalty: totalHintPenalty,
          remainingAttempts: rateLimitCheck.remainingAttempts,
          isFirstSolve,
          isTeamChallenge: true,
          teamName: team.name
        };

        if (isFirstSolve) {
          response.message = `🎉 Congratulations! Your team is the FIRST to solve this challenge! Bonus points awarded!`;
        } else {
          response.message = `✅ Correct! Your team earned ${finalPoints} points!`;
        }

        return res.json(response);
      } else {
        // Incorrect submission for team challenge
        return res.json({
          correct: false,
          pointsAwarded: 0,
          remainingAttempts: rateLimitCheck.remainingAttempts,
          isTeamChallenge: true,
          message: `❌ Incorrect flag. ${rateLimitCheck.remainingAttempts} attempts remaining.`
        });
      }
    }

    // Handle individual challenges (non-team challenges)
    // Check rate limiting
    const rateLimitCheck = await checkSubmissionRateLimit(req.user.id, ch.id, ipAddress);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        message: rateLimitCheck.message,
        waitTime: rateLimitCheck.waitTime,
        remainingAttempts: rateLimitCheck.remainingAttempts
      });
    }

    // Check if user already solved this challenge
    const previousCorrect = await Submission.findOne({ 
      where: { userId: req.user.id, challengeId: ch.id, correct: true } 
    });

    if (previousCorrect) {
      return res.status(400).json({ 
        message: 'You have already solved this challenge',
        alreadySolved: true
      });
    }

    const providedHash = hashFlag(sanitizedFlag);
    const correct = crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(ch.flagHash));

    let pointsAwarded = 0;
    let isFirstSolve = false;

    if (correct) {
      pointsAwarded = ch.points;
      
      // Check if this is the first solve
      if (!ch.firstSolverId) {
        isFirstSolve = true;
        // Award bonus points for first solve (50% bonus)
        pointsAwarded = Math.floor(ch.points * 1.5);
        
        // Update challenge with first solver info and set solve count to 1
        await Challenge.update({
          firstSolverId: req.user.id,
          firstSolvedAt: new Date(),
          solveCount: 1
        }, { where: { id: ch.id } });

        // Send first blood notifications
        try {
          const solver = await User.findByPk(req.user.id, { attributes: ['username'] });
          await NotificationService.notifyFirstBlood(
            ch.title,
            solver.username,
            ch.id,
            req.user.id
          );
        } catch (notificationError) {
          console.error('Failed to send first blood notifications:', notificationError);
          // Don't fail the submission if notifications fail
        }
      } else {
        // Increment solve count for subsequent solves
        await Challenge.increment('solveCount', { where: { id: ch.id } });
      }

      // Update user's total points
      await User.increment('totalPoints', { 
        by: pointsAwarded, 
        where: { id: req.user.id } 
      });

      // Reset attempt counter on successful solve
      await Attempt.destroy({
        where: { userId: req.user.id, challengeId: ch.id }
      });
    }

    // Create submission record
    const submission = await Submission.create({
      userId: req.user.id,
      challengeId: ch.id,
      correct,
      pointsAwarded,
      submittedFlag: hashFlag(sanitizedFlag), // Store hashed version for analysis
      ipAddress,
      userAgent,
      isFirstSolve
    });

    const response = {
      correct,
      pointsAwarded,
      submissionId: submission.id,
      remainingAttempts: rateLimitCheck.remainingAttempts,
      isFirstSolve
    };

    if (isFirstSolve) {
      response.message = `🎉 Congratulations! You are the FIRST to solve this challenge! Bonus points awarded!`;
    } else if (correct) {
      response.message = `✅ Correct! Well done!`;
    } else {
      response.message = `❌ Incorrect flag. ${rateLimitCheck.remainingAttempts} attempts remaining.`;
    }

    res.json(response);
  } catch (e) {
    console.error('Submission error:', e);
    res.status(500).json({ message: 'Submission failed', error: e.message });
  }
});

// -------- User: Get Solved Challenges --------
router.get('/user/solved', verifyToken, async (req, res) => {
  try {
    const solvedChallenges = await Submission.findAll({
      where: { 
        userId: req.user.id, 
        correct: true 
      },
      attributes: ['challengeId', 'pointsAwarded', 'createdAt', 'isFirstSolve'],
      include: [{ 
        model: Challenge, 
        attributes: ['id', 'title', 'points', 'difficulty'],
        include: [{ model: Category, attributes: ['name'] }]
      }],
      order: [['createdAt', 'DESC']]
    });

    const solved = solvedChallenges.map(s => ({
      challengeId: s.challengeId,
      title: s.Challenge?.title,
      points: s.Challenge?.points,
      pointsAwarded: s.pointsAwarded,
      solvedAt: s.createdAt,
      category: s.Challenge?.Category?.name,
      difficulty: s.Challenge?.difficulty,
      isFirstSolve: s.isFirstSolve
    }));

    res.json(solved);
  } catch (e) {
    res.status(500).json({ message: 'Failed to get solved challenges', error: e.message });
  }
});

// -------- Enhanced Global Scoreboard --------
router.get('/scoreboard', async (req, res) => {
  try {
    const { limit = 50, category } = req.query;
    
    // Build the query to get users with their actual totalPoints (which includes hint deductions)
    // and their solve statistics from submissions
    let whereClause = 's.correct = true';
    let joinClause = `
      FROM Submissions s
      JOIN Users u ON s.userId = u.id
      JOIN Challenges c ON s.challengeId = c.id
    `;
    
    if (category) {
      joinClause += ` JOIN Categories cat ON c.categoryId = cat.id`;
      whereClause += ` AND cat.id = ${parseInt(category)}`;
    }

    const [results] = await Submission.sequelize.query(`
      SELECT 
        s.userId,
        u.username,
        u.country,
        u.totalPoints as totalPoints,
        COUNT(DISTINCT s.challengeId) as solvedCount,
        COUNT(CASE WHEN s.isFirstSolve = true THEN 1 END) as firstSolves,
        MAX(s.createdAt) as lastSolveAt,
        MIN(s.createdAt) as firstSolveAt
      ${joinClause}
      WHERE ${whereClause}
      GROUP BY s.userId, u.username, u.country, u.totalPoints
      ORDER BY totalPoints DESC, lastSolveAt ASC
      LIMIT ${parseInt(limit)}
    `);

    const leaderboard = results.map((r, idx) => ({
      position: idx + 1,
      username: r.username,
      country: r.country || null,
      totalPoints: Number(r.totalPoints || 0),
      solvedCount: Number(r.solvedCount || 0),
      firstSolves: Number(r.firstSolves || 0),
      lastSolveAt: r.lastSolveAt,
      firstSolveAt: r.firstSolveAt
    }));

    res.json(leaderboard);
  } catch (e) {
    console.error('Scoreboard error:', e);
    res.status(500).json({ message: 'Failed to get scoreboard', error: e.message });
  }
});

// -------- Challenge Statistics --------
router.get('/challenges/:id/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const challengeId = req.params.id;
    
    const totalSubmissions = await Submission.count({ where: { challengeId } });
    const correctSubmissions = await Submission.count({ where: { challengeId, correct: true } });
    const uniqueSolvers = await Submission.count({
      where: { challengeId, correct: true },
      distinct: true,
      col: 'userId'
    });

    // Submission timeline (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const timeline = await Submission.findAll({
      where: {
        challengeId,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: [
        [Challenge.sequelize.fn('DATE', Challenge.sequelize.col('createdAt')), 'date'],
        [Challenge.sequelize.fn('COUNT', Challenge.sequelize.col('id')), 'submissions'],
        [Challenge.sequelize.fn('SUM', Challenge.sequelize.literal('CASE WHEN correct = true THEN 1 ELSE 0 END')), 'correct']
      ],
      group: [Challenge.sequelize.fn('DATE', Challenge.sequelize.col('createdAt'))],
      order: [[Challenge.sequelize.fn('DATE', Challenge.sequelize.col('createdAt')), 'ASC']]
    });

    res.json({
      totalSubmissions,
      correctSubmissions,
      uniqueSolvers,
      successRate: totalSubmissions > 0 ? ((correctSubmissions / totalSubmissions) * 100).toFixed(1) : 0,
      timeline: timeline.map(t => ({
        date: t.get('date'),
        submissions: Number(t.get('submissions')),
        correct: Number(t.get('correct'))
      }))
    });
  } catch (e) {
    res.status(500).json({ message: 'Failed to get challenge stats', error: e.message });
  }
});

// -------- User Profile Management --------
router.get('/user/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetOtp', 'otpExpires', 'twoFactorSecret'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's rank
    const [rankResult] = await User.sequelize.query(`
      SELECT COUNT(*) + 1 as rank
      FROM Users 
      WHERE totalPoints > (SELECT totalPoints FROM Users WHERE id = ?)
    `, { replacements: [req.user.id] });
    
    const userRank = rankResult[0]?.rank || null;

    // Get solve statistics
    const solveStats = await Submission.findAll({
      where: { userId: req.user.id, correct: true },
      attributes: [
        [Challenge.sequelize.fn('COUNT', Challenge.sequelize.col('Submission.id')), 'totalSolves'],
        [Challenge.sequelize.fn('COUNT', Challenge.sequelize.literal('CASE WHEN isFirstSolve = true THEN 1 END')), 'firstSolves']
      ],
      include: [{
        model: Challenge,
        attributes: ['difficulty'],
        include: [{ model: Category, attributes: ['name'] }]
      }]
    });

    res.json({
      ...user.toJSON(),
      rank: userRank,
      solveStats: solveStats[0] || { totalSolves: 0, firstSolves: 0 }
    });
  } catch (e) {
    res.status(500).json({ message: 'Failed to get profile', error: e.message });
  }
});

router.put('/user/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { fullName, bio, country, website, githubUsername, twitterUsername } = req.body;
    
    // Sanitize inputs
    if (fullName !== undefined) user.fullName = sanitizeInput(fullName);
    if (bio !== undefined) user.bio = sanitizeInput(bio);
    if (country !== undefined) user.country = sanitizeInput(country);
    if (website !== undefined) {
      const sanitizedWebsite = sanitizeInput(website);
      // Basic URL validation
      if (sanitizedWebsite && !sanitizedWebsite.match(/^https?:\/\/.+/)) {
        return res.status(400).json({ message: 'Website must be a valid URL starting with http:// or https://' });
      }
      user.website = sanitizedWebsite;
    }
    if (githubUsername !== undefined) user.githubUsername = sanitizeInput(githubUsername);
    if (twitterUsername !== undefined) user.twitterUsername = sanitizeInput(twitterUsername);

    await user.save();
    
    // Return updated user without sensitive data
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetOtp', 'otpExpires', 'twoFactorSecret'] }
    });
    
    res.json(updatedUser);
  } catch (e) {
    res.status(500).json({ message: 'Failed to update profile', error: e.message });
  }
});

// -------- Security: Audit Log --------
router.get('/admin/audit', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 100, userId, challengeId } = req.query;
    const where = {};
    
    if (userId) where.userId = userId;
    if (challengeId) where.challengeId = challengeId;

    const auditLog = await Submission.findAll({
      where,
      include: [
        { model: User, attributes: ['username'] },
        { model: Challenge, attributes: ['title'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    const formattedLog = auditLog.map(entry => ({
      id: entry.id,
      username: entry.User?.username,
      challenge: entry.Challenge?.title,
      correct: entry.correct,
      points: entry.pointsAwarded,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      timestamp: entry.createdAt,
      isFirstSolve: entry.isFirstSolve
    }));

    res.json(formattedLog);
  } catch (e) {
    res.status(500).json({ message: 'Failed to get audit log', error: e.message });
  }
});

// -------- Notification Routes --------
// Get user notifications
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const notifications = await NotificationService.getUserNotifications(
      req.user.id,
      parseInt(limit),
      parseInt(offset)
    );
    res.json(notifications);
  } catch (e) {
    res.status(500).json({ message: 'Failed to get notifications', error: e.message });
  }
});

// Get unread notification count
router.get('/notifications/unread-count', verifyToken, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: 'Failed to get unread count', error: e.message });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const success = await NotificationService.markAsRead(req.params.id, req.user.id);
    if (success) {
      res.json({ message: 'Notification marked as read' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark notification as read', error: e.message });
  }
});

// Mark all notifications as read
router.put('/notifications/read-all', verifyToken, async (req, res) => {
  try {
    const updatedCount = await NotificationService.markAllAsRead(req.user.id);
    res.json({ message: `${updatedCount} notifications marked as read` });
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark all notifications as read', error: e.message });
  }
});

// -------- User Hint System --------
router.post('/challenges/:id/hint', verifyToken, async (req, res) => {
  try {
    const { hintNumber } = req.body;
    const challengeId = req.params.id;
    const userId = req.user.id;

    // Validate hint number
    if (!hintNumber || hintNumber < 1 || hintNumber > 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hint number. Must be 1 or 2.'
      });
    }

    const challenge = await Challenge.findByPk(challengeId);
    if (!challenge || !challenge.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found.'
      });
    }

    // Check if this is a team challenge (team challenges use different hint system)
    if (challenge.isTeamChallenge) {
      return res.status(400).json({
        success: false,
        message: 'This is a team challenge. Use team hint system instead.'
      });
    }

    // Check if user has already solved this challenge
    const existingSubmission = await Submission.findOne({
      where: { userId: userId, challengeId: challengeId, correct: true }
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'You have already solved this challenge.'
      });
    }

    // Check if hint has already been unlocked
    const existingHint = await UserHint.findOne({
      where: { userId: userId, challengeId: challengeId, hintNumber: hintNumber }
    });

    if (existingHint) {
      // Return the already unlocked hint without deducting points again
      const hintText = hintNumber === 1 ? challenge.hint : challenge.hint2;
      return res.status(200).json({
        success: true,
        message: 'Hint already unlocked.',
        data: {
          hint: hintText,
          hintNumber: hintNumber,
          pointsDeducted: 0,
          alreadyUnlocked: true
        }
      });
    }

    // Check if previous hint is unlocked (for hint 2)
    if (hintNumber === 2) {
      const firstHint = await UserHint.findOne({
        where: { userId: userId, challengeId: challengeId, hintNumber: 1 }
      });

      if (!firstHint) {
        return res.status(400).json({
          success: false,
          message: 'You must unlock the first hint before accessing the second hint.'
        });
      }
    }

    // Get hint text
    const hintText = hintNumber === 1 ? challenge.hint : challenge.hint2;
    if (!hintText) {
      return res.status(404).json({
        success: false,
        message: `Hint ${hintNumber} is not available for this challenge.`
      });
    }

    // Calculate penalty
    const hintPenalty = challenge.hintPenalty || 50;

    // Check if user has enough points
    const user = await User.findByPk(userId);
    const currentPoints = user.totalPoints || 0;
    
    if (currentPoints < hintPenalty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You need at least ${hintPenalty} points to unlock this hint. You currently have ${currentPoints} points.`
      });
    }

    // Create hint record and deduct points
    await UserHint.create({
      userId: userId,
      challengeId: challengeId,
      hintNumber: hintNumber,
      pointsDeducted: hintPenalty
    });

    // Update user's total points (deduct penalty)
    await User.update(
      { totalPoints: Math.max(0, currentPoints - hintPenalty) },
      { where: { id: userId } }
    );

    res.status(200).json({
      success: true,
      message: `Hint ${hintNumber} revealed! ${hintPenalty} points deducted from your score.`,
      data: {
        hint: hintText,
        hintNumber: hintNumber,
        pointsDeducted: hintPenalty,
        newUserPoints: Math.max(0, currentPoints - hintPenalty)
      }
    });
  } catch (error) {
    console.error('Use user hint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hint. Please try again.'
    });
  }
});

module.exports = router;
