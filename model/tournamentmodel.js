const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const Tournament = sequelize.define('Tournament', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(200), allowNull: false, defaultValue: 'CTF Tournament' },
  description: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
  startTime: { type: DataTypes.DATE, allowNull: true },
  endTime: { type: DataTypes.DATE, allowNull: true },
  duration: { type: DataTypes.INTEGER, allowNull: true }, // Duration in minutes
  autoStart: { type: DataTypes.BOOLEAN, defaultValue: false },
  autoEnd: { type: DataTypes.BOOLEAN, defaultValue: false },
  maxTeams: { type: DataTypes.INTEGER, allowNull: true },
  allowLateJoin: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdBy: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['isActive']
    },
    {
      fields: ['startTime']
    },
    {
      fields: ['endTime']
    },
    {
      fields: ['createdBy']
    }
  ]
});

module.exports = Tournament;
