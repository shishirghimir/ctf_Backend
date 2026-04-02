const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const Challenge = sequelize.define('Challenge', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  hint: { type: DataTypes.TEXT, allowNull: true },
  points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
  categoryId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Categories', key: 'id' } },
  filePath: { type: DataTypes.STRING(500), allowNull: true },
  driveLink: { type: DataTypes.STRING(500), allowNull: true },
  flagHash: { type: DataTypes.STRING(64), allowNull: false },
  solveCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  firstSolverId: { type: DataTypes.INTEGER, allowNull: true },
  firstSolvedAt: { type: DataTypes.DATE, allowNull: true },
  secondSolverId: { type: DataTypes.INTEGER, allowNull: true },
  secondSolvedAt: { type: DataTypes.DATE, allowNull: true },
  thirdSolverId: { type: DataTypes.INTEGER, allowNull: true },
  thirdSolvedAt: { type: DataTypes.DATE, allowNull: true },
  difficulty: { type: DataTypes.ENUM('Easy', 'Medium', 'Hard', 'Expert'), defaultValue: 'Medium' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  maxAttempts: { type: DataTypes.INTEGER, defaultValue: null }, // null = unlimited
  isTeamChallenge: { type: DataTypes.BOOLEAN, defaultValue: false }, // true = team only, false = solo
  tournamentOnly: { type: DataTypes.BOOLEAN, defaultValue: false }, // only available during tournament
  showInSolo: { type: DataTypes.BOOLEAN, defaultValue: true }, // show in solo challenges (false for team-only)
  hint2: { type: DataTypes.TEXT, allowNull: true }, // second hint
  maxHints: { type: DataTypes.INTEGER, defaultValue: 2 }, // maximum hints available
  hintPenalty: { type: DataTypes.INTEGER, defaultValue: 50 }, // points deducted per hint
  imageUrl: { type: DataTypes.STRING(500), allowNull: true }, // optional banner image URL
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['categoryId']
    },
    {
      fields: ['points']
    },
    {
      fields: ['solveCount']
    },
    {
      fields: ['firstSolverId']
    },
    {
      fields: ['difficulty']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Challenge;
