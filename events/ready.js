const { Client, Events, EmbedBuilder, time } = require('discord.js');
const Activitys = require('../models/activity');
const ActivityTypes = require('../models/activityType');
const Log = require('../models/log');
const Members = require('../models/member');
const config = require('../config.json');
const { QueryTypes } = require('sequelize');
const sequelize = require('../sequelize');
const { clientInstance, instance } = require('../main');

const neededTimePerDay = 3600; // en seconde


module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${clientInstance.user.tag}`);
		dailyFinish();
		
		// lastAlert
		lastAlert(() => {
			try {
				(async () => {
					const notok = [];
					const members = await Members.findAll();
					const allUserTime = await getTimeForAllUser();
					
					// fait une boucle pour chaque membre
					members.forEach(async (member) => {
						userTime = allUserTime[member.discordID];
						if (member.daily != new Date().toISOString().split('T')[0]) {
							var tempRestant = (neededTimePerDay-parseInt(userTime))/60
							try{
								const embed = new EmbedBuilder()
									.setColor('#ff0000') // Couleur rouge
									.setTitle('Temps de travail minimum requis pas réalisé')
									.setDescription(`L'utilisateur <@${member.discordID}> n'a pas accompli ses heures aujourd'hui! :cry:\nIl vous reste ${tempRestant}min de temps avant que votre heure soit validé.`)
									.setTimestamp();
								user = client.users.cache.get(member.discordID);
								try{
									user.send({ embeds: [embed], content: `<@${member.discordID}>` });
								} catch(exception){
									console.log(exception);
								}
								notok.push(user);
							} catch(exception){
								console.log(exception);
							}
						}
					});
					try{
						const embed = new EmbedBuilder()
							.setColor('#ff0000')
							.setTitle('Avertissement : Temps de travail minimum requis pas réalisé')
							.addFields({
								name: 'Les membres suivants n\'ont pas accompli leurs heures aujourd\'hui:',
								value: notok.map(user => `<@${user.id}> => ${userTime[user.id]/60 || 0}min`).join('\n')
							});
						client.channels.cache.get(config.channelId).send({embeds: [embed], content: `@everyone` });
					} catch(exception){
						console.log(exception);
					}
				})();
			}catch (error) {
				console.error(error);
			}
		});
		
		midnightStats(() => {
			try {
				(async () => {
					const result = await getTimeForAllUser();
					const embed = new EmbedBuilder()
						.setColor('#ff0000')
						.setTitle('Voici le temps de tout le monde')
						.addFields({
							name: 'Utilisateurs:',
							value: Object.entries(result).map(([discordId, totalTime]) => `<@${discordId}> - ${Math.floor(totalTime/60)} minutes`).join('\n')
						});
					client.channels.cache.get(config.channelId).send({embeds: [embed], content: `@everyone`});
				})();
			}catch (exception){
				console.log(exception);
			}
		});

		setInterval(() => {
			dailyFinish();
		}, 1000 * 30);
	},
};

function lastAlert(callback) {
	const now = new Date();
	const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 30, 0, 0);
	if (now > targetTime) {
		targetTime.setDate(now.getDate() + 1);
	}
	const delay = targetTime - now;
	
	setTimeout(() => {
		callback();
		setInterval(callback, 24 * 60 * 60 * 1000);
	}, delay);
}

function dailyFinish()
{
	try {
		(async () => {
			onlineMember = instance['memberVoiceConnected'];
			result = await sequelize.query("SELECT SUM(`activityTime`) as totalActivityTime, memberid, Members.discordID as discordId FROM Activitys INNER JOIN Members ON Activitys.memberid = Members.id WHERE `date` = CURRENT_DATE() GROUP BY memberid", { type: QueryTypes.SELECT, raw: true })
			Object.keys(onlineMember).forEach(async (member) => {
				var timeElapsed = Math.floor((new Date() - onlineMember[member]) / 1000);
				result.forEach(actifTime => {
					if (actifTime.discordId == member) {
						actifTime.totalActivityTime += timeElapsed;
						console.log(actifTime.totalActivityTime)
					}
				});
			});
			result.forEach(actifTime => {
				if (actifTime.totalActivityTime >= neededTimePerDay){
					member = Members.findOne({ where: { id: actifTime.memberid } }).then(member => {
					if (member.daily != new Date().toISOString().split('T')[0]) {
						member.update({ daily: new Date().toISOString().split('T')[0] });
						const embed = new EmbedBuilder()
							.setColor('#00ff00') // Couleur verte
							.setTitle('Heures Accomplies')
							.setDescription(`L'utilisateur <@${member.discordID}> a accompli ses heures aujourd'hui! :tada:`)
							.setTimestamp();
						try {
							clientInstance.channels.cache.get(config.channelId).send({ embeds: [embed], content: `<@${member.discordID}>` });
							clientInstance.users.cache.get(member.discordID).send({ embeds: [embed], content: `<@${member.discordID}>` });
						}catch(exception){
							console.log(exception);
						}
					}
					});
				}
			});
		})();
	}catch (error) {
		console.error(error);
	}
}


function midnightStats(callback) {
	const now = new Date();
	const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
	if (now > targetTime) {
		targetTime.setDate(now.getDate() + 1);
	}
	const delay = targetTime - now;
	setTimeout(() => {
		callback();
		setInterval(callback, 24 * 60 * 60 * 1000);
	}, delay);
}

/* {
  'discordid': totalActivityTime, // en seconde
} */
async function getTimeForAllUser() {
	const result = {};

    try{
		const members = await Members.findAll();
		const onlineMember = instance['memberVoiceConnected'];
		const timeSavedForAllUser = await sequelize.query("SELECT SUM(`activityTime`) as totalActivityTime, Members.discordID as discordId FROM Activitys INNER JOIN Members ON Activitys.memberid = Members.id WHERE `date` = CURRENT_DATE() GROUP BY discordId;", { type: QueryTypes.SELECT, raw: true })

		members.forEach((member) => {
			result[member.discordID] = 0;
		});

		timeSavedForAllUser.forEach(({ totalActivityTime, discordId }) => {
			result[discordId] += totalActivityTime;
		});

		Object.entries(onlineMember).forEach(([discordId, lastOnlineTime]) => {
			if (result[discordId] !== undefined) {
				const elapsedTime = Math.floor((new Date() - onlineMember[member]) / 1000);
				result[discordId] += elapsedTime;
			}
		});
	} catch (exception){
		console.log(exception);
	}
	return result;
}