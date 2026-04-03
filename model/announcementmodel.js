const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const Announcement = sequelize.define('Announcement', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title:     { type: DataTypes.STRING(200), allowNull: false },
  message:   { type: DataTypes.TEXT, allowNull: false },
  type:      { type: DataTypes.ENUM('info', 'warning', 'success', 'danger'), defaultValue: 'info' },
  isActive:  { type: DataTypes.BOOLEAN, defaultValue: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'Announcements',
  timestamps: true,
});

module.exports = Announcement;
