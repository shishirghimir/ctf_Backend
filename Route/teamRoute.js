const router = require('express').Router();
const teamController = require('../Controller/teamController');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

// Team management routes
router.post('/create', auth, teamController.createTeam);
router.post('/join', auth, teamController.joinTeam);
router.get('/details', auth, teamController.getTeamDetails);
router.post('/leave', auth, teamController.leaveTeam);

// Team scoreboard
router.get('/scoreboard', teamController.getTeamScoreboard);

// Team hints
router.post('/hint', auth, teamController.useTeamHint);

// Team challenges
router.get('/challenges', auth, teamController.getTeamChallenges);


// Tournament routes
router.get('/tournament/active', teamController.getActiveTournament); // Get active tournament (public)

// Admin routes
router.get('/', auth, requireAdmin, teamController.getAllTeams); // Get all teams for admin
router.delete('/:id', auth, requireAdmin, teamController.deleteTeam); // Delete team
router.get('/tournament-mode', auth, requireAdmin, teamController.getTournamentMode); // Get tournament mode status
router.post('/tournament-mode', auth, requireAdmin, teamController.toggleTournamentMode); // Toggle tournament mode
router.post('/tournament/toggle', auth, requireAdmin, teamController.toggleTournamentMode); // Legacy route

// Tournament management (admin only)
router.post('/tournament/create', auth, requireAdmin, teamController.createTournament); // Create tournament
router.post('/tournament/:id/start', auth, requireAdmin, teamController.startTournament); // Start tournament
router.post('/tournament/:id/end', auth, requireAdmin, teamController.endTournament); // End tournament

module.exports = router;
