const { Events } = require('discord.js');
const Member = require('../models/member');
const Members = require('../models/member');
const config = require('../config.json');

module.exports = {
	name: Events.VoiceStateUpdate,
	once: false,
	execute(oldState, newState, instance) {
        if (oldState.channelId == newState.channelId) {
            return;
        }
        var channelID = newState.channelId;
        var userID = newState.member.id;
        (async () => {
            access = await Members.findOne({ where: { discordID: userID } });
            if (channelID == null) {
                console.log(typeof(oldState.channelId));
                console.log(config['approvedChannelId'].includes(oldState.channelId));
                if (config['approvedChannelId'].includes(oldState.channelId)) {
                    // end of voice channel
                    if (userID in instance['memberVoiceConnected']) {
                        if (access != null) {
                            var time = new Date() - instance['memberVoiceConnected'][userID];
                            member = await Members.findOne({ where: { discordID: userID } });
                            addActivity(member.id, 1, instance, Math.floor(time/1000));
                            addlog(userID, `User left voice channel after ${Math.floor(time/1000)}`, instance);
                        }
                        delete instance['memberVoiceConnected'][userID];
                    }
                }
                console.log("User left voice channel")
            }else if (userID in instance['memberVoiceConnected']) {
                if (config['approvedChannelId'].includes(newState.channelId) && config['approvedChannelId'].includes(oldState.channelId)) {
                    return;
                }else if (config['approvedChannelId'].includes(newState.channelId) && !(config['approvedChannelId'].includes(oldState.channelId))) {
                    if (access != null) {
                        instance['memberVoiceConnected'][userID] = new Date();
                        addlog(userID, "User switch to voice channel timed", instance);
                        console.log("User switch to voice channel timed")
                    }
                }else if (config['approvedChannelId'].includes(oldState.channelId) && !config['approvedChannelId'].includes(newState.channelId)) {
                    if (userID in instance['memberVoiceConnected']) {
                        if (access != null) {
                            var time = new Date() - instance['memberVoiceConnected'][userID];
                            member = await Members.findOne({ where: { discordID: userID } });
                            addActivity(member.id, 1, instance, Math.floor(time/1000));
                        }
                        console.log("User switch to voice channel not timed")
                        delete instance['memberVoiceConnected'][userID];
                    }
                }
            }else{
                // start of voice channel
                if (config['approvedChannelId'].includes(newState.channelId)) {
                    if (access != null) {
                        instance['memberVoiceConnected'][userID] = new Date();
                        addlog(userID, "User joined voice channel", instance);
                    }
                    console.log("User joined voice channel")
                }
            }
        })();
	},
};

function addActivity(userID, activityTypeID, instance, time) {
    activity = instance["models"]["Activity"];
    activity.create({ memberID: userID, activityType: activityTypeID, activityTime: time});
};

function addlog(userID, message, instance) {
    log = instance["models"]["Log"];

    log.create({ discordid: userID, message: message});
}