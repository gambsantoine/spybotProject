const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize'); // Import your Sequelize instance
const ActivityType = require('./activityType');
const Member = require('./member');

const Activitys = sequelize.define('Activitys', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  activityTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  memberID: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  activityType: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
}, {
  timestamps: false
});

// Associations
Activitys.belongsTo(ActivityType, { foreignKey: 'activityType' });
Activitys.belongsTo(Member, { foreignKey: 'memberid' });

module.exports = Activitys;
