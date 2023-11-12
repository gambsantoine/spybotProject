const { Events, EmbedBuilder } = require('discord.js');
const Activitys = require('../models/activity');
const ActivityTypes = require('../models/activityType');
const Log = require('../models/log');
const Members = require('../models/member');
const config = require('../config.json');
const { QueryTypes } = require('sequelize');
const sequelize = require('../sequelize');

class Alert {
    constructor() {
        this.neededTimePerDay = 3600; // en seconde
    }

    
}