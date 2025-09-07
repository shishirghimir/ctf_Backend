const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User, RegistrationChallenge } = require('../model');

// Get registration challenge
const getRegistrationChallenge = async (req, res) => {
  try {
    const challenge = await RegistrationChallenge.findOne({
      where: { isActive: true },
      attributes: ['id', 'title', 'description', 'difficulty', 'maxAttempts']
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'No registration challenge available at the moment.'
      });
    }

    res.status(200).json({
      success: true,
      data: { challenge }
    });
  } catch (error) {
    console.error('Get registration challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get registration challenge.'
    });
  }
};

// Submit registration challenge solution
const submitRegistrationChallenge = async (req, res) => {
  try {
    const { challengeId, flag, email } = req.body;

    if (!challengeId || !flag || !email) {
      return res.status(400).json({
        success: false,
        message: 'Challenge ID, flag, and email are required.'
      });
    }

    // Find the challenge
    const challenge = await RegistrationChallenge.findByPk(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found.'
      });
    }

    // Check if user already exists and has completed registration challenge
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.hasCompletedRegistrationChallenge) {
      return res.status(400).json({
        success: false,
        message: 'You have already completed the registration challenge.'
      });
    }

    // Hash the submitted flag and compare
    const flagHash = crypto.createHash('sha256').update(flag.trim()).digest('hex');
    
    if (flagHash !== challenge.flagHash) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect flag. Please try again.'
      });
    }

    // Update challenge solve count
    await RegistrationChallenge.update(
      { solveCount: challenge.solveCount + 1 },
      { where: { id: challengeId } }
    );

    // If user exists, update their registration challenge status
    if (existingUser) {
      await User.update(
        {
          hasCompletedRegistrationChallenge: true,
          registrationChallengeCompletedAt: new Date()
        },
        { where: { id: existingUser.id } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Congratulations! You have successfully solved the registration challenge. You can now complete your registration.',
      data: {
        canRegister: true,
        email: email
      }
    });
  } catch (error) {
    console.error('Submit registration challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit challenge solution.'
    });
  }
};

// Get hint for registration challenge
const getRegistrationHint = async (req, res) => {
  try {
    const { challengeId } = req.params;

    const challenge = await RegistrationChallenge.findByPk(challengeId);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        hint: challenge.hint || 'No hint available for this challenge.'
      }
    });
  } catch (error) {
    console.error('Get registration hint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hint.'
    });
  }
};

// Verify registration eligibility
const verifyRegistrationEligibility = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.'
      });
    }

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(200).json({
        success: true,
        data: {
          canRegister: false,
          message: 'Please solve the registration challenge first.',
          hasCompletedChallenge: false
        }
      });
    }

    if (!user.hasCompletedRegistrationChallenge) {
      return res.status(200).json({
        success: true,
        data: {
          canRegister: false,
          message: 'Please solve the registration challenge first.',
          hasCompletedChallenge: false
        }
      });
    }

    // Check if user is already fully registered
    if (user.username && user.password) {
      return res.status(200).json({
        success: true,
        data: {
          canRegister: false,
          message: 'You are already registered. Please login instead.',
          hasCompletedChallenge: true,
          alreadyRegistered: true
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        canRegister: true,
        message: 'You can now complete your registration.',
        hasCompletedChallenge: true
      }
    });
  } catch (error) {
    console.error('Verify registration eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify registration eligibility.'
    });
  }
};

// Admin: Create registration challenge
const createRegistrationChallenge = async (req, res) => {
  try {
    const { title, description, hint, flag, difficulty = 'Easy' } = req.body;

    if (!title || !description || !flag) {
      return res.status(400).json({ message: 'Title, description, and flag are required.' });
    }

    // Hash the flag
    const flagHash = crypto.createHash('sha256').update(flag.trim()).digest('hex');

    // Deactivate existing challenges
    await RegistrationChallenge.update(
      { isActive: false },
      { where: { isActive: true } }
    );

    // Create new challenge
    const challenge = await RegistrationChallenge.create({
      title,
      description,
      hint,
      flagHash,
      difficulty,
      isActive: true
    });

    // Return direct challenge object to match AdminDashboard expectations
    res.status(201).json(challenge);
  } catch (error) {
    console.error('Create registration challenge error:', error);
    res.status(500).json({ message: 'Failed to create registration challenge.' });
  }
};

// Admin: Get all registration challenges
const getAllRegistrationChallenges = async (req, res) => {
  try {
    const challenges = await RegistrationChallenge.findAll({
      attributes: ['id', 'title', 'description', 'hint', 'difficulty', 'isActive', 'solveCount', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    // Return direct array to match AdminDashboard expectations
    res.status(200).json(challenges);
  } catch (error) {
    console.error('Get all registration challenges error:', error);
    res.status(500).json({ message: 'Failed to get registration challenges.' });
  }
};

// Admin: Toggle registration challenge status
const toggleRegistrationChallenge = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { isActive } = req.body;

    if (isActive) {
      // Deactivate all other challenges first
      await RegistrationChallenge.update(
        { isActive: false },
        { where: { isActive: true } }
      );
    }

    // Update the specified challenge
    await RegistrationChallenge.update(
      { isActive },
      { where: { id: challengeId } }
    );

    res.status(200).json({
      success: true,
      message: `Registration challenge ${isActive ? 'activated' : 'deactivated'} successfully.`
    });
  } catch (error) {
    console.error('Toggle registration challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle registration challenge status.'
    });
  }
};

// Admin: Update registration challenge
const updateRegistrationChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, hint, flag, difficulty } = req.body;

    const challenge = await RegistrationChallenge.findByPk(id);
    if (!challenge) {
      return res.status(404).json({ message: 'Registration challenge not found.' });
    }

    // Update fields
    if (title) challenge.title = title;
    if (description) challenge.description = description;
    if (hint !== undefined) challenge.hint = hint;
    if (difficulty) challenge.difficulty = difficulty;
    if (flag) {
      challenge.flagHash = crypto.createHash('sha256').update(flag.trim()).digest('hex');
    }

    await challenge.save();
    res.status(200).json(challenge);
  } catch (error) {
    console.error('Update registration challenge error:', error);
    res.status(500).json({ message: 'Failed to update registration challenge.' });
  }
};

// Admin: Delete registration challenge
const deleteRegistrationChallenge = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await RegistrationChallenge.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Registration challenge not found.' });
    }

    res.status(200).json({ message: 'Registration challenge deleted successfully.' });
  } catch (error) {
    console.error('Delete registration challenge error:', error);
    res.status(500).json({ message: 'Failed to delete registration challenge.' });
  }
};

module.exports = {
  getRegistrationChallenge,
  submitRegistrationChallenge,
  getRegistrationHint,
  verifyRegistrationEligibility,
  createRegistrationChallenge,
  getAllRegistrationChallenges,
  toggleRegistrationChallenge,
  updateRegistrationChallenge,
  deleteRegistrationChallenge
};
