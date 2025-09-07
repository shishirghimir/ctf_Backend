const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const RegistrationChallenge = sequelize.define('RegistrationChallenge', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  hint: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  flagHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  difficulty: {
    type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
    defaultValue: 'Easy',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  solveCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  maxAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['isActive']
    },
    {
      fields: ['difficulty']
    },
    {
      fields: ['solveCount']
    }
  ]
});

module.exports = RegistrationChallenge;
