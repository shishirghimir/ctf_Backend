const router = require('express').Router();
const registrationController = require('../Controller/registrationController');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');

// Public registration challenge routes
router.get('/challenge', registrationController.getRegistrationChallenge);
router.post('/challenge/submit', registrationController.submitRegistrationChallenge);
router.get('/challenge/:challengeId/hint', registrationController.getRegistrationHint);
router.post('/verify-eligibility', registrationController.verifyRegistrationEligibility);

// Admin routes for managing registration challenges
router.post('/admin/challenge/create', auth, requireAdmin, registrationController.createRegistrationChallenge);
router.get('/admin/challenges', auth, requireAdmin, registrationController.getAllRegistrationChallenges);
router.put('/admin/challenge/:challengeId/toggle', auth, requireAdmin, registrationController.toggleRegistrationChallenge);

// Additional admin routes to match AdminDashboard expectations
router.get('/challenges', auth, requireAdmin, registrationController.getAllRegistrationChallenges);
router.post('/challenges', auth, requireAdmin, registrationController.createRegistrationChallenge);
router.put('/challenges/:id', auth, requireAdmin, registrationController.updateRegistrationChallenge);
router.delete('/challenges/:id', auth, requireAdmin, registrationController.deleteRegistrationChallenge);
router.put('/challenges/:id/toggle', auth, requireAdmin, registrationController.toggleRegistrationChallenge);

module.exports = router;
