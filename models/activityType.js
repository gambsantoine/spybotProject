const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const ActivityTypes = sequelize.define('ActivityTypes', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(25),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  timestamps: false
});

module.exports = ActivityTypes;
