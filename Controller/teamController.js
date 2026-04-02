const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Team, TeamMember, User, TeamScore, TeamHint, Challenge, RegistrationChallenge, Tournament } = require('../model');

// Generate unique team code — 16-char hex (8 random bytes)
const generateTeamCode = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

// Create a new team
const createTeam = async (req, res) => {
  try {
    const { name, description, maxMembers = 5 } = req.body;
    const userId = req.user.id;

    // Check if user is already in a team
    const existingUser = await User.findByPk(userId);
    if (existingUser.teamId) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already a member of a team. Leave your current team first.' 
      });
    }

    // Check if team name already exists
    const existingTeam = await Team.findOne({ where: { name } });
    if (existingTeam) {
      return res.status(400).json({ 
        success: false, 
        message: 'Team name already exists. Please choose a different name.' 
      });
    }

    // Generate unique team code
    let teamCode;
    let codeExists = true;
    while (codeExists) {
      teamCode = generateTeamCode();
      const existingCode = await Team.findOne({ where: { teamCode } });
      codeExists = !!existingCode;
    }

    // Create team
    const team = await Team.create({
      name,
      description,
      captainId: userId,
      maxMembers,
      teamCode,
      joinLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join-team/${teamCode}`
    });

    // Add creator as team captain
    await TeamMember.create({
      teamId: team.id,
      userId: userId,
      role: 'captain'
    });

    // Update user's teamId
    await User.update({ teamId: team.id }, { where: { id: userId } });

    res.status(201).json({
      success: true,
      message: 'Team created successfully!',
      data: {
        team: {
          id: team.id,
          name: team.name,
          teamCode: team.teamCode,
          joinLink: team.joinLink,
          maxMembers: team.maxMembers,
          currentMembers: 1
        }
      }
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create team. Please try again.' 
    });
  }
};

// Join a team using team code
const joinTeam = async (req, res) => {
  try {
    const { teamCode, userName, userEmail } = req.body;
    const userId = req.user?.id;

    // If user is logged in, use their ID, otherwise validate email/name
    if (!userId && (!userName || !userEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name and email to join the team.'
      });
    }

    // Find team by code
    const team = await Team.findOne({ 
      where: { teamCode, isActive: true },
      include: [
        {
          model: TeamMember,
          include: [{ model: User, attributes: ['id', 'username', 'email', 'fullName'] }]
        }
      ]
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Invalid team code or team not found.'
      });
    }

    // Check if team is full
    if (team.currentMembers >= team.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Team is full. Cannot join this team.'
      });
    }

    let targetUserId = userId;

    // If user is not logged in, find or create user
    if (!userId) {
      let user = await User.findOne({ where: { email: userEmail } });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User with this email not found. Please register first.'
        });
      }
      targetUserId = user.id;
    }

    // Check if user is already in this team
    const existingMember = await TeamMember.findOne({
      where: { teamId: team.id, userId: targetUserId }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team.'
      });
    }

    // Check if user is in another team
    const userInOtherTeam = await User.findByPk(targetUserId);
    if (userInOtherTeam.teamId && userInOtherTeam.teamId !== team.id) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of another team. Leave your current team first.'
      });
    }

    // Check minimum members requirement (at least 3)
    if (team.currentMembers >= 3) {
      // Team already has minimum members, can join directly
    }

    // Add user to team
    await TeamMember.create({
      teamId: team.id,
      userId: targetUserId,
      role: 'member'
    });

    // Update user's teamId and team's current members count
    await User.update({ teamId: team.id }, { where: { id: targetUserId } });
    await Team.update(
      { currentMembers: team.currentMembers + 1 },
      { where: { id: team.id } }
    );

    res.status(200).json({
      success: true,
      message: 'Successfully joined the team!',
      data: {
        team: {
          id: team.id,
          name: team.name,
          currentMembers: team.currentMembers + 1,
          maxMembers: team.maxMembers
        }
      }
    });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join team. Please try again.'
    });
  }
};

// Get team details
const getTeamDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    if (!user.teamId) {
      return res.status(404).json({
        success: false,
        message: 'You are not a member of any team.'
      });
    }

    const team = await Team.findByPk(user.teamId, {
      include: [
        {
          model: TeamMember,
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'email', 'fullName', 'totalPoints']
            }
          ]
        },
        {
          model: User,
          as: 'Captain',
          attributes: ['id', 'username', 'fullName']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: { team }
    });
  } catch (error) {
    console.error('Get team details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team details.'
    });
  }
};

// Leave team
const leaveTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    if (!user.teamId) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of any team.'
      });
    }

    const team = await Team.findByPk(user.teamId);
    
    // If user is captain and there are other members, transfer captaincy
    if (team.captainId === userId && team.currentMembers > 1) {
      const otherMember = await TeamMember.findOne({
        where: { teamId: team.id, userId: { [require('sequelize').Op.ne]: userId } }
      });
      
      if (otherMember) {
        await Team.update(
          { captainId: otherMember.userId },
          { where: { id: team.id } }
        );
        await TeamMember.update(
          { role: 'captain' },
          { where: { teamId: team.id, userId: otherMember.userId } }
        );
      }
    }

    // Remove user from team
    await TeamMember.destroy({
      where: { teamId: team.id, userId: userId }
    });

    // Update user's teamId and team's current members count
    await User.update({ teamId: null }, { where: { id: userId } });
    await Team.update(
      { currentMembers: team.currentMembers - 1 },
      { where: { id: team.id } }
    );

    // If team is empty, delete it
    if (team.currentMembers <= 1) {
      await Team.destroy({ where: { id: team.id } });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully left the team.'
    });
  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave team. Please try again.'
    });
  }
};

// Get team scoreboard - only available when a tournament is active
const getTeamScoreboard = async (req, res) => {
  try {
    // Lock scoreboard when no tournament is running
    const activeTournament = await Tournament.findOne({ where: { isActive: true } });
    if (!activeTournament) {
      return res.status(200).json({
        success: true,
        tournamentActive: false,
        data: { teams: [] },
        message: 'No active tournament. Scoreboard unlocks when a tournament starts.'
      });
    }

    // Get teams that have at least one TeamScore record (solved at least one team challenge)
    const teams = await Team.findAll({
      where: { isActive: true },
      include: [
        {
          model: User,
          as: 'Captain',
          attributes: ['username', 'fullName']
        },
        {
          model: TeamScore,
          attributes: ['finalPoints', 'solvedAt', 'challengeId'],
          required: true // This ensures only teams with TeamScore records are included
        }
      ],
      attributes: ['id', 'name', 'totalPoints', 'currentMembers', 'maxMembers', 'createdAt']
    });

    // Use Team.totalPoints directly — it's always kept in sync (hint deductions included)
    const teamsWithCalculatedPoints = teams.map(team => {
      const teamData = team.toJSON();
      return {
        ...teamData,
        totalPoints: teamData.totalPoints || 0,
        solvedChallenges: teamData.TeamScores ? teamData.TeamScores.length : 0,
        lastSolveAt: teamData.TeamScores && teamData.TeamScores.length > 0 ?
          Math.max(...teamData.TeamScores.map(s => new Date(s.solvedAt).getTime())) : null
      };
    });

    // Sort by total points (descending), then by last solve time (ascending for tiebreaker)
    const sortedTeams = teamsWithCalculatedPoints.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      // Tiebreaker: earlier last solve time wins
      if (a.lastSolveAt && b.lastSolveAt) {
        return a.lastSolveAt - b.lastSolveAt;
      }
      return 0;
    });

    // Add rank to teams
    const rankedTeams = sortedTeams.map((team, index) => ({
      ...team,
      rank: index + 1,
      lastSolveAt: team.lastSolveAt ? new Date(team.lastSolveAt) : null
    }));

    res.status(200).json({
      success: true,
      tournamentActive: true,
      tournament: {
        id: activeTournament.id,
        name: activeTournament.name,
        endTime: activeTournament.endTime
      },
      data: { teams: rankedTeams }
    });
  } catch (error) {
    console.error('Get team scoreboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team scoreboard.'
    });
  }
};

// Use hint for team (deduct points)
const useTeamHint = async (req, res) => {
  try {
    const { challengeId, hintNumber } = req.body;
    const userId = req.user.id;

    // Validate hint number
    if (!hintNumber || hintNumber < 1 || hintNumber > 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hint number. Must be 1 or 2.'
      });
    }

    const user = await User.findByPk(userId);
    if (!user.teamId) {
      return res.status(400).json({
        success: false,
        message: 'You must be in a team to use team hints.'
      });
    }

    const team = await Team.findByPk(user.teamId);
    const challenge = await Challenge.findByPk(challengeId);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found.'
      });
    }

    // Check if this is a team challenge
    if (!challenge.isTeamChallenge) {
      return res.status(400).json({
        success: false,
        message: 'Hints are only available for team challenges.'
      });
    }

    // Check if tournament mode is enabled for team challenges
    if (challenge.tournamentOnly && !team.tournamentMode) {
      return res.status(400).json({
        success: false,
        message: 'This challenge is only available during tournament mode.'
      });
    }

    // Check if team has already solved this challenge
    const existingScore = await TeamScore.findOne({
      where: { teamId: team.id, challengeId: challengeId }
    });

    if (existingScore) {
      return res.status(400).json({
        success: false,
        message: 'Your team has already solved this challenge.'
      });
    }

    // Check if hint has already been unlocked
    const existingHint = await TeamHint.findOne({
      where: { teamId: team.id, challengeId: challengeId, hintNumber: hintNumber }
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
      const firstHint = await TeamHint.findOne({
        where: { teamId: team.id, challengeId: challengeId, hintNumber: 1 }
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

    // Check if team has enough points
    const currentPoints = team.totalPoints || 0;
    
    if (currentPoints < hintPenalty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient team points. Your team needs at least ${hintPenalty} points to unlock this hint. Your team currently has ${currentPoints} points.`
      });
    }

    // Create hint record and deduct points
    await TeamHint.create({
      teamId: team.id,
      challengeId: challengeId,
      hintNumber: hintNumber,
      pointsDeducted: hintPenalty,
      unlockedBy: userId
    });

    // Update team's total points (deduct penalty)
    await Team.update(
      { totalPoints: Math.max(0, currentPoints - hintPenalty) },
      { where: { id: team.id } }
    );

    res.status(200).json({
      success: true,
      message: `Hint ${hintNumber} revealed! ${hintPenalty} points deducted from your team score.`,
      data: {
        hint: hintText,
        hintNumber: hintNumber,
        pointsDeducted: hintPenalty,
        newTeamPoints: Math.max(0, currentPoints - hintPenalty)
      }
    });
  } catch (error) {
    console.error('Use team hint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hint. Please try again.'
    });
  }
};

// Get all teams (admin only)
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.findAll({
      include: [
        {
          model: TeamMember,
          include: [
            {
              model: User,
              attributes: ['id', 'username', 'email', 'fullName']
            }
          ]
        },
        {
          model: User,
          as: 'Captain',
          attributes: ['id', 'username', 'fullName']
        },
        {
          model: TeamScore,
          attributes: ['id', 'points', 'finalPoints', 'challengeId', 'solvedAt'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calculate total points for each team
    const teamsWithTotalPoints = teams.map(team => {
      const teamData = team.toJSON();
      const totalPoints = teamData.TeamScores ? 
        teamData.TeamScores.reduce((sum, score) => sum + (score.finalPoints || 0), 0) : 0;
      
      return {
        ...teamData,
        TeamScore: { totalPoints }
      };
    });

    // Return direct array to match AdminDashboard expectations
    res.status(200).json(teamsWithTotalPoints);
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({ message: 'Failed to get teams.' });
  }
};

// Delete team (admin only)
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Find team
    const team = await Team.findByPk(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.'
      });
    }

    // Remove all team members and update their teamId to null
    await User.update(
      { teamId: null },
      { where: { teamId: id } }
    );

    // Delete team members
    await TeamMember.destroy({
      where: { teamId: id }
    });

    // Delete team scores
    await TeamScore.destroy({
      where: { teamId: id }
    });

    // Delete team
    await Team.destroy({
      where: { id: id }
    });

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully.'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team.'
    });
  }
};

// Get tournament mode status (admin only)
const getTournamentMode = async (req, res) => {
  try {
    // Check if any team has tournament mode enabled
    const team = await Team.findOne({
      where: { tournamentMode: true }
    });

    // Return direct object to match AdminDashboard expectations
    res.status(200).json({
      enabled: !!team
    });
  } catch (error) {
    console.error('Get tournament mode error:', error);
    res.status(500).json({ message: 'Failed to get tournament mode status.' });
  }
};

// Toggle tournament mode (admin only)
const toggleTournamentMode = async (req, res) => {
  try {
    const { enabled } = req.body;

    // Update all teams' tournament mode
    await Team.update(
      { tournamentMode: enabled },
      { where: {} }
    );

    res.status(200).json({
      success: true,
      message: `Tournament mode ${enabled ? 'enabled' : 'disabled'} for all teams.`,
      data: {
        enabled: enabled
      }
    });
  } catch (error) {
    console.error('Toggle tournament mode error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle tournament mode.'
    });
  }
};

// Create tournament with timer (admin only)
const createTournament = async (req, res) => {
  try {
    const { name, description, duration, autoStart = false } = req.body;
    const userId = req.user.id;

    // Validate duration (in minutes)
    if (!duration || duration < 1) {
      return res.status(400).json({
        success: false,
        message: 'Tournament duration must be at least 1 minute.'
      });
    }

    // Check if there's already an active tournament
    const activeTournament = await Tournament.findOne({
      where: { isActive: true }
    });

    if (activeTournament) {
      return res.status(400).json({
        success: false,
        message: 'There is already an active tournament. End it first before creating a new one.'
      });
    }

    const startTime = autoStart ? new Date() : null;
    const endTime = autoStart ? new Date(Date.now() + duration * 60 * 1000) : null;

    // Create tournament
    const tournament = await Tournament.create({
      name: name || 'CTF Tournament',
      description,
      duration,
      startTime,
      endTime,
      autoStart,
      isActive: autoStart,
      createdBy: userId
    });

    // If auto-start, enable tournament mode for all teams
    if (autoStart) {
      await Team.update(
        { tournamentMode: true },
        { where: {} }
      );

      // Set up auto-end timer
      setTimeout(async () => {
        try {
          await Tournament.update(
            { isActive: false },
            { where: { id: tournament.id } }
          );
          await Team.update(
            { tournamentMode: false },
            { where: {} }
          );
          console.log(`Tournament ${tournament.name} ended automatically`);
        } catch (error) {
          console.error('Auto-end tournament error:', error);
        }
      }, duration * 60 * 1000);
    }

    res.status(201).json({
      success: true,
      message: `Tournament ${autoStart ? 'created and started' : 'created'} successfully!`,
      data: { tournament }
    });
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tournament.'
    });
  }
};

// Start tournament (admin only)
const startTournament = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await Tournament.findByPk(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found.'
      });
    }

    if (tournament.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Tournament is already active.'
      });
    }

    const startTime = new Date();
    const endTime = new Date(Date.now() + tournament.duration * 60 * 1000);

    // Update tournament
    await Tournament.update(
      {
        isActive: true,
        startTime,
        endTime
      },
      { where: { id } }
    );

    // Enable tournament mode for all teams
    await Team.update(
      { tournamentMode: true },
      { where: {} }
    );

    // ── Reset all team scores for a fresh tournament start ──
    // 1. Wipe all TeamScore solve records
    await TeamScore.destroy({ where: {} });
    // 2. Reset every team's points and hint counter to zero
    await Team.update(
      { totalPoints: 0, hintsUsed: 0 },
      { where: {} }
    );
    // 3. Reset blood tracking on team/tournament challenges so 1st/2nd/3rd blood can be earned fresh
    const { Op } = require('sequelize');
    await Challenge.update(
      {
        firstSolverId: null,  firstSolvedAt: null,
        secondSolverId: null, secondSolvedAt: null,
        thirdSolverId: null,  thirdSolvedAt: null,
        solveCount: 0
      },
      { where: { [Op.or]: [{ isTeamChallenge: true }, { tournamentOnly: true }] } }
    );
    // ────────────────────────────────────────────────────────

    // Set up auto-end timer
    setTimeout(async () => {
      try {
        await Tournament.update(
          { isActive: false },
          { where: { id } }
        );
        await Team.update(
          { tournamentMode: false },
          { where: {} }
        );
        console.log(`Tournament ${tournament.name} ended automatically`);
      } catch (error) {
        console.error('Auto-end tournament error:', error);
      }
    }, tournament.duration * 60 * 1000);

    res.status(200).json({
      success: true,
      message: 'Tournament started successfully!',
      data: {
        tournament: {
          ...tournament.toJSON(),
          isActive: true,
          startTime,
          endTime
        }
      }
    });
  } catch (error) {
    console.error('Start tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start tournament.'
    });
  }
};

// End tournament (admin only)
const endTournament = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await Tournament.findByPk(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found.'
      });
    }

    if (!tournament.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Tournament is not active.'
      });
    }

    // Update tournament
    await Tournament.update(
      { isActive: false },
      { where: { id } }
    );

    // Disable tournament mode for all teams
    await Team.update(
      { tournamentMode: false },
      { where: {} }
    );

    res.status(200).json({
      success: true,
      message: 'Tournament ended successfully!',
      data: { tournament: { ...tournament.toJSON(), isActive: false } }
    });
  } catch (error) {
    console.error('End tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end tournament.'
    });
  }
};

// Get active tournament
const getActiveTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      where: { isActive: true },
      include: [
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'username', 'fullName']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: { tournament }
    });
  } catch (error) {
    console.error('Get active tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tournament information.'
    });
  }
};

// Get team challenges (only show team challenges when tournament is active)
const getTeamChallenges = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    if (!user.teamId) {
      return res.status(400).json({
        success: false,
        message: 'You must be in a team to view team challenges.'
      });
    }

    const team = await Team.findByPk(user.teamId);
    
    // Check if there's an active tournament
    const activeTournament = await Tournament.findOne({
      where: { isActive: true }
    });

    // If no active tournament, return empty challenges
    if (!activeTournament) {
      return res.status(200).json({
        success: true,
        message: 'No active tournament. Team challenges are not available.',
        data: { challenges: [], tournamentActive: false }
      });
    }

    // Get team challenges - show all team challenges when tournament is active
    // Include both team-only challenges and tournament-only challenges
    // Include ALL team/tournament challenges regardless of "showInSolo"
    // Admins may choose to show a team challenge in solo too; that should not hide it from the team list.
    const challenges = await Challenge.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { isTeamChallenge: true },
          { tournamentOnly: true }
        ],
        isActive: true
      },
      include: [
        {
          model: require('../model').Category,
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get team's solved challenges
    const solvedChallenges = await TeamScore.findAll({
      where: { teamId: team.id },
      attributes: ['challengeId', 'solvedAt', 'finalPoints']
    });

    // Get team's used hints
    const usedHints = await TeamHint.findAll({
      where: { teamId: team.id },
      attributes: ['challengeId', 'hintNumber', 'pointsDeducted']
    });

    // Combine data
    const challengesWithStatus = challenges.map(challenge => {
      const solved = solvedChallenges.find(s => s.challengeId === challenge.id);
      const hints = usedHints.filter(h => h.challengeId === challenge.id);
      
      return {
        ...challenge.toJSON(),
        solved: !!solved,
        solvedAt: solved?.solvedAt || null,
        earnedPoints: solved?.finalPoints || 0,
        hintsUsed: hints.length,
        hintDetails: hints
      };
    });

    res.status(200).json({
      success: true,
      data: { 
        challenges: challengesWithStatus, 
        tournamentActive: true,
        tournament: activeTournament,
        team: {
          id: team.id,
          name: team.name,
          totalPoints: team.totalPoints
        }
      }
    });
  } catch (error) {
    console.error('Get team challenges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get team challenges.'
    });
  }
};

module.exports = {
  createTeam,
  joinTeam,
  getTeamDetails,
  leaveTeam,
  getTeamScoreboard,
  useTeamHint,
  getAllTeams,
  deleteTeam,
  getTournamentMode,
  toggleTournamentMode,
  createTournament,
  startTournament,
  endTournament,
  getActiveTournament,
  getTeamChallenges
};
