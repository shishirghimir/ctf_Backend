const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('first_blood', 'challenge_created', 'login', 'achievement'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true, // Additional data like challengeId, points, etc.
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isGlobal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Global notifications like first blood
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true, // Optional expiration for notifications
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['isRead']
    },
    {
      fields: ['isGlobal']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Notification;
