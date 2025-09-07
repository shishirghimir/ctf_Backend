const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  teamCode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  captainId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  maxMembers: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  currentMembers: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  teamRank: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  joinLink: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tournamentMode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  hintsUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      unique: true,
      fields: ['teamCode']
    },
    {
      fields: ['captainId']
    },
    {
      fields: ['totalPoints']
    },
    {
      fields: ['teamRank']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Team;
