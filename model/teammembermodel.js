const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const TeamMember = sequelize.define('TeamMember', {
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('captain', 'member'),
    defaultValue: 'member',
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  contributionPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['teamId', 'userId']
    },
    {
      fields: ['teamId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['role']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = TeamMember;
