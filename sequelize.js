const { Sequelize } = require('sequelize');
const config = require('./config.json');

var configDB = config.database;
const sequelize = new Sequelize(configDB.name, configDB.user, configDB.password, {
	host: configDB.host,
	port: configDB.port,
	dialect: 'mariadb',
	logging: false,
});

module.exports = sequelize;