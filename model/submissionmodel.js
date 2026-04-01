const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const Submission = sequelize.define('Submission', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  correct: { type: DataTypes.BOOLEAN, defaultValue: false },
  pointsAwarded: { type: DataTypes.INTEGER, defaultValue: 0 },
  submittedFlag: { type: DataTypes.STRING(255), allowNull: true }, // Store for analysis (hashed)
  ipAddress: { type: DataTypes.STRING(45), allowNull: true }, // IPv4/IPv6 support
  userAgent: { type: DataTypes.TEXT, allowNull: true },
  isFirstSolve: { type: DataTypes.BOOLEAN, defaultValue: false },
  isSecondSolve: { type: DataTypes.BOOLEAN, defaultValue: false },
  isThirdSolve: { type: DataTypes.BOOLEAN, defaultValue: false },
  solveTime: { type: DataTypes.INTEGER, allowNull: true }, // Time taken to solve in seconds
}, { 
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['challengeId']
    },
    {
      fields: ['correct']
    },
    {
      fields: ['userId', 'challengeId']
    },
    {
      fields: ['isFirstSolve']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['ipAddress']
    }
  ]
});

module.exports = Submission;
