const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const UserBadge = sequelize.define('UserBadge', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId:    { type: DataTypes.INTEGER, allowNull: false },
  badgeType: {
    type: DataTypes.ENUM(
      'solver_1', 'solver_5', 'solver_10', 'solver_25', 'solver_50',
      'first_blood', 'top_10', 'top_3',
      'web_master', 'crypto_master', 'pwn_master', 'forensics_master', 'misc_master',
      'speedrunner', 'team_player', 'veteran'
    ),
    allowNull: false,
  },
  earnedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'UserBadges',
  timestamps: true,
});

module.exports = UserBadge;
