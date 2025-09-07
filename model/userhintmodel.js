const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const UserHint = sequelize.define('UserHint', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  challengeId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: 'Challenges', key: 'id' }
  },
  hintNumber: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    validate: { min: 1, max: 2 }
  },
  pointsDeducted: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    defaultValue: 50
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'challengeId', 'hintNumber']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['challengeId']
    }
  ]
});

module.exports = UserHint;
