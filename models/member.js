const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const Members = sequelize.define('Members', {
  discordID: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  last_imputation: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  daily: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  timestamps: false
});

module.exports = Members;
