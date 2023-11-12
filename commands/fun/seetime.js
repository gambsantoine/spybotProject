const { SlashCommandBuilder } = require('discord.js');
const Activitys = require('../../models/activity');
const Members = require('../../models/member');
const { clientInstance, instance } = require('../../main');
const sequelize = require('../../sequelize');
const { QueryTypes } = require('sequelize');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('see_my_time')
		.setDescription('Voir ton temps !'),
    async execute(interaction) {
        currentTime = new Date();
        const userID = interaction.user.id;

        try {
            const member = await Members.findOne({ where: { discordID: userID } });
            if (!member) {
                await interaction.reply('Vous n\'êtes pas enregistré dans la base de données.');
                return;
            }

            onlineMember = instance['memberVoiceConnected'];
            timeForOnlineMember = onlineMember[userID]/1000 || 0;
            timeSavedForUser = await sequelize.query("SELECT SUM(`activityTime`) as totalActivityTime, Members.discordID as discordId FROM Activitys INNER JOIN Members ON Activitys.memberid = Members.id WHERE `date` = CURRENT_DATE() AND discordId = " + userID + ";", { type: QueryTypes.SELECT, raw: true });
            totalTime = parseInt(timeSavedForUser[0].totalActivityTime/60) + parseInt(timeForOnlineMember/60)
            await interaction.reply(`Voici votre temps => ${totalTime}min`);
        } catch (error) {
            console.error('ratio', error);
            await interaction.reply('||_ _                                   _ _|| !!!');
        }
    },
};