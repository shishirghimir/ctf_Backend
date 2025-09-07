const { sequelize } = require('../db/database');

// Import all models
const User = require('./usermodel');
const Category = require('./categorymodel');
const Challenge = require('./challengemodel');
const Submission = require('./submissionmodel');
const Attempt = require('./attemptmodel');
const Notification = require('./notificationmodel');
const Team = require('./teammodel');
const TeamMember = require('./teammembermodel');
const TeamScore = require('./teamscoremodel');
const TeamHint = require('./teamhintmodel');
const UserHint = require('./userhintmodel');
const RegistrationChallenge = require('./registrationchallengemodel');
const Tournament = require('./tournamentmodel');

function initializeModels() {
  // User -> Submission (1:N)
  User.hasMany(Submission, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Submission.belongsTo(User, { foreignKey: 'userId' });

  // Challenge -> Submission (1:N)
  Challenge.hasMany(Submission, { foreignKey: 'challengeId', onDelete: 'CASCADE' });
  Submission.belongsTo(Challenge, { foreignKey: 'challengeId' });

  // Category -> Challenge (1:N)
  Category.hasMany(Challenge, { foreignKey: 'categoryId', onDelete: 'CASCADE' });
  Challenge.belongsTo(Category, { foreignKey: 'categoryId' });


  // User -> Attempt (1:N)
  User.hasMany(Attempt, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Attempt.belongsTo(User, { foreignKey: 'userId' });

  // Challenge -> Attempt (1:N)
  Challenge.hasMany(Attempt, { foreignKey: 'challengeId', onDelete: 'CASCADE' });
  Attempt.belongsTo(Challenge, { foreignKey: 'challengeId' });

  // First Solver relationship
  Challenge.belongsTo(User, { as: 'FirstSolver', foreignKey: 'firstSolverId' });
  User.hasMany(Challenge, { as: 'FirstSolves', foreignKey: 'firstSolverId' });

  // Author relationship removed: DB does not have an author column on Challenges

  // User -> Notification (1:N)
  User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
  Notification.belongsTo(User, { foreignKey: 'userId' });

  // Team relationships
  // User -> Team (N:1) - User belongs to one team
  User.belongsTo(Team, { foreignKey: 'teamId' });
  Team.hasMany(User, { foreignKey: 'teamId' });

  // Team -> TeamMember (1:N)
  Team.hasMany(TeamMember, { foreignKey: 'teamId', onDelete: 'CASCADE' });
  TeamMember.belongsTo(Team, { foreignKey: 'teamId' });

  // User -> TeamMember (1:N)
  User.hasMany(TeamMember, { foreignKey: 'userId', onDelete: 'CASCADE' });
  TeamMember.belongsTo(User, { foreignKey: 'userId' });

  // Team Captain relationship
  Team.belongsTo(User, { as: 'Captain', foreignKey: 'captainId' });
  User.hasMany(Team, { as: 'CaptainOf', foreignKey: 'captainId' });

  // Team -> TeamScore (1:N)
  Team.hasMany(TeamScore, { foreignKey: 'teamId', onDelete: 'CASCADE' });
  TeamScore.belongsTo(Team, { foreignKey: 'teamId' });

  // Challenge -> TeamScore (1:N)
  Challenge.hasMany(TeamScore, { foreignKey: 'challengeId', onDelete: 'CASCADE' });
  TeamScore.belongsTo(Challenge, { foreignKey: 'challengeId' });

  // User -> TeamScore (1:N) - who solved it
  User.hasMany(TeamScore, { foreignKey: 'solvedBy', onDelete: 'CASCADE' });
  TeamScore.belongsTo(User, { as: 'Solver', foreignKey: 'solvedBy' });

  // TeamHint relationships
  // Team -> TeamHint (1:N)
  Team.hasMany(TeamHint, { foreignKey: 'teamId', onDelete: 'CASCADE' });
  TeamHint.belongsTo(Team, { foreignKey: 'teamId' });

  // Challenge -> TeamHint (1:N)
  Challenge.hasMany(TeamHint, { foreignKey: 'challengeId', onDelete: 'CASCADE' });
  TeamHint.belongsTo(Challenge, { foreignKey: 'challengeId' });

  // User -> TeamHint (1:N) - who unlocked the hint
  User.hasMany(TeamHint, { foreignKey: 'unlockedBy', onDelete: 'CASCADE' });
  TeamHint.belongsTo(User, { as: 'UnlockedBy', foreignKey: 'unlockedBy' });

  // UserHint relationships
  // User -> UserHint (1:N)
  User.hasMany(UserHint, { foreignKey: 'userId', onDelete: 'CASCADE' });
  UserHint.belongsTo(User, { foreignKey: 'userId' });

  // Challenge -> UserHint (1:N)
  Challenge.hasMany(UserHint, { foreignKey: 'challengeId', onDelete: 'CASCADE' });
  UserHint.belongsTo(Challenge, { foreignKey: 'challengeId' });

  // Tournament relationships
  // User -> Tournament (1:N) - who created the tournament
  User.hasMany(Tournament, { foreignKey: 'createdBy', onDelete: 'CASCADE' });
  Tournament.belongsTo(User, { as: 'Creator', foreignKey: 'createdBy' });
}

module.exports = {
  User,
  Category,
  Challenge,
  Submission,
  Attempt,
  Notification,
  Team,
  TeamMember,
  TeamScore,
  TeamHint,
  UserHint,
  RegistrationChallenge,
  Tournament,
  initializeModels,
};
