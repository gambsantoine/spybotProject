const { Client, Events, GatewayIntentBits, Collection, IntentsBitField, EmbedBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const config = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const { QueryTypes } = require('sequelize');
const sequelize = require('./sequelize');
const { raw } = require('mysql2');
const { channel } = require('node:diagnostics_channel');
const Activitys = require('./models/activity');
const ActivityTypes = require('./models/activityType');
const Log = require('./models/log');
const Members = require('./models/member');


// Le serveur à 1 heure de moins que la date d'hivers UTC+1

const client = new Client({ intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildVoiceStates, IntentsBitField.Flags.GuildIntegrations, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.GuildMembers] });
const instance = {};

// pour export
clientInstance = client;
module.exports = {
	clientInstance,
	instance,
};

// instance object for all data


// tableau foure tout access rapide
instance['memberVoiceConnected'] = {};
instance['sequelize'] = sequelize;
// ajout des models
instance['models'] = {};
instance['models']['Activity'] = Activitys;
instance['models']['ActivityType'] = ActivityTypes;
instance['models']['Log'] = Log;
instance['models']['Member'] = Members;

// command handler
client.commands = new Collection();
const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
            client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once('ready', () => {
    console.log(new Date().toISOString());
	client.guilds.cache.get(config.guildId).members.fetch();
	dailyFinish();
	firstAlert(() => {
		try {
			(async () => {
				result = await sequelize.query("SELECT SUM(`activityTime`) as totalActivityTime, `memberid` FROM Activitys WHERE `date` = CURRENT_DATE() GROUP BY `memberid`", { type: QueryTypes.SELECT, raw: true })
				const timeok = [];
				result.forEach(actifTime => {
					if (actifTime.totalActivityTime >= 3600){
						timeok.push(actifTime.memberid);
					}
				});
				members = await Members.findAll();
				// fait une boucle pour chaque membre
				members.forEach(member => {
					if (timeok.includes(member.id)) { const embed = new EmbedBuilder() .setColor('#00ff00') // Couleur verte
							.setTitle('Heures Accomplies')
							.setDescription(`L'utilisateur <@${member.discordID}> a accompli ses heures aujourd'hui! :tada:`)
							.setTimestamp();
						try {
							client.users.cache.get(member.discordID).send({ embeds: [embed], content: `<@${member.discordID}>` });
						} catch (error) {
							console.error(error);	
						}
					}else{
						const embed = new EmbedBuilder()
							.setColor('#ff0000') // Couleur rouge
							.setTitle('Heures Non Accomplies')
							.setDescription(`L'utilisateur <@${member.discordID}> n'a pas accompli ses heures aujourd'hui! :cry:`)
							.setTimestamp();
						try {
							client.users.cache.get(member.discordID).send({ embeds: [embed], content: `<@${member.discordID}>` });
						} catch (error) {
							console.error(error);
						}
					}
				});
			})();
		}catch (error) {
			console.error(error);
		}
	});

	setInterval(() => {
		dailyFinish();
	}, 1000 * 60 * 2);
});

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.token);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(config.clientId, config.guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

// event handler
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, instance));
	} else {
		client.on(event.name, (...args) => event.execute(...args, instance));
	}
}

function dailyFinish()
{
	try {
		(async () => {
			result = await sequelize.query("SELECT SUM(`activityTime`) as totalActivityTime, `memberid` FROM Activitys WHERE `date` = CURRENT_DATE() GROUP BY `memberid`", { type: QueryTypes.SELECT, raw: true })
			result.forEach(actifTime => {
				if (actifTime.totalActivityTime >= 3600){

					member = Members.findOne({ where: { id: actifTime.memberid } }).then(member => {
						if (member.daily != new Date().toISOString().split('T')[0]) {
							member.update({ daily: new Date().toISOString().split('T')[0] });
							const embed = new EmbedBuilder()
								.setColor('#00ff00') // Couleur verte
								.setTitle('Heures Accomplies')
								.setDescription(`L'utilisateur <@${member.discordID}> a accompli ses heures aujourd'hui! :tada:`)
								.addFields(
									{name: "Heures Accomplies", value: `${Math.floor(actifTime.totalActivityTime / 60)} Minutes`},
									)
								.setTimestamp();
							try {
								client.channels.cache.get(config.channelId).send({ embeds: [embed], content: `<@${member.discordID}>` });
								client.users.cache.get(member.discordID).send({ embeds: [embed], content: `<@${member.discordID}>` });
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

function firstAlert(callback) {
	const now = new Date();
	const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0, 0);
	if (now > targetTime) {
		targetTime.setDate(now.getDate() + 1);
	}
	const delay = targetTime - now;
	
	setTimeout(() => {
		callback();
		setInterval(callback, 24 * 60 * 60 * 1000);
	}, delay);
}



client.login(config.token);
