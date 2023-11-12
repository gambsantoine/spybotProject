const { SlashCommandBuilder } = require('discord.js');
const Activitys = require('../../models/activity');
const Members = require('../../models/member');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inputation')
		.setDescription('imputation time !'),
    async execute(interaction) {
        currentTime = new Date();
        // Mettez ici le code pour parcourir le tableau d'utilisateurs et mettre à jour le temps d'imputation
        const userID = interaction.user.id;
        try {
            const member = await Members.findOne({ where: { discordID: userID } });
            if (!member) {
                await interaction.reply('Vous n\'êtes pas enregistré dans la base de données.');
                return;
            }
            const timeDifference = (currentTime - member.last_imputation) / (1000 * 60 * 60); // Différence de temps en heures
        
            if (timeDifference > 3) { // Si le temps d'imputation est vieux de plus de 3 heures
                // Mettez à jour le temps d'imputation
                await member.update({ last_imputation: currentTime });
    
                // Créez une nouvelle activité avec une durée de 15 minutes (en secondes)
                await Activitys.create({
                activityTime: 15 * 60,
                memberID: member.id,
                activityType: 4, // Remplacez par l'ID correspondant au type d'activité
                });
                await interaction.reply('15 minutes vous a été ajouté!');
            }else{
                const remainingTimeMinutes = Math.round(180 - timeDifference);
                await interaction.reply(`Vous avez déjà imputé ces 3 dernières heures ! Il vous reste environ ${remainingTimeMinutes} minutes avant la prochaine inputation.`);
            }
    
            
        } catch (error) {
            console.error('Error updating imputation time:', error);
            await interaction.reply('Une erreur s\'est produite lors de la mise à jour du temps d\'imputation.');
        }
    },
};