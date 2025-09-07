const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const TeamScore = sequelize.define('TeamScore', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Teams',
      key: 'id'
    }
  },
  challengeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Challenges',
      key: 'id'
    }
  },
  solvedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  hintsUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  pointsDeducted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  finalPoints: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  solvedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  tournamentMode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['teamId', 'challengeId']
    },
    {
      fields: ['teamId']
    },
    {
      fields: ['challengeId']
    },
    {
      fields: ['solvedBy']
    },
    {
      fields: ['points']
    },
    {
      fields: ['solvedAt']
    },
    {
      fields: ['tournamentMode']
    }
  ]
});

module.exports = TeamScore;
