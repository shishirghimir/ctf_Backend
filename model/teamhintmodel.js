const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const TeamHint = sequelize.define('TeamHint', {
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
  hintNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 2
    }
  },
  pointsDeducted: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50
  },
  unlockedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  unlockedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['teamId', 'challengeId', 'hintNumber']
    },
    {
      fields: ['teamId']
    },
    {
      fields: ['challengeId']
    },
    {
      fields: ['unlockedBy']
    }
  ]
});

module.exports = TeamHint;
