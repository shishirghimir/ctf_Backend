const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const Attempt = sequelize.define('Attempt', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  challengeId: { type: DataTypes.INTEGER, allowNull: false },
  attemptCount: { type: DataTypes.INTEGER, defaultValue: 1 },
  lastAttemptAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  blockedUntil: { type: DataTypes.DATE, allowNull: true },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true },
}, { 
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'challengeId']
    },
    {
      fields: ['blockedUntil']
    },
    {
      fields: ['ipAddress']
    },
    {
      fields: ['lastAttemptAt']
    }
  ]
});

module.exports = Attempt;
