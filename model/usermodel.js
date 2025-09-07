const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },

  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },

  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },

  fullName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  education: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  profession: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  contactNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },

  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  resetOtp: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },

  otpExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },


  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  githubUsername: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  twitterUsername: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  totalPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },


  teamId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Teams',
      key: 'id'
    }
  },

  hasCompletedRegistrationChallenge: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  registrationChallengeCompletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  }

}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['isAdmin']
    },
    {
      fields: ['totalPoints']
    },
    {
      fields: ['isActive']
    },
  ]
});

module.exports = User;
