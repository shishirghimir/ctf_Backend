const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name']
    }
  ]
});

module.exports = Category;
