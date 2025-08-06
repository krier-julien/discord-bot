const { SlashCommandBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const { 
  createSuccessEmbed, 
  createErrorEmbed, 
  hasAdminPermission, 
  validateUsername, 
  validateScore 
} = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('updatescore')
    .setDescription('Update a member\'s score (Admin only)')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Member username (two words, e.g., "Alphaa Melo")')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('score')
        .setDescription('New score value')
        .setRequired(true)
        .setMinValue(0)),

  async execute(interaction) {
    try {
      // Check admin permission
      if (!hasAdminPermission(interaction)) {
        const errorEmbed = createErrorEmbed('You need Administrator permission to use this command.');
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Get and validate inputs
      const username = interaction.options.getString('username');
      const score = interaction.options.getInteger('score');

      let validatedUsername, validatedScore;
      try {
        validatedUsername = validateUsername(username);
        validatedScore = validateScore(score);
      } catch (error) {
        const errorEmbed = createErrorEmbed(error.message);
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Get global guild data
      const guild = await Guild.getGlobalGuild();
      
      if (!guild || guild.members.length === 0) {
        const errorEmbed = createErrorEmbed('No members found in the database.');
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Find member to get old score
      const member = guild.members.find(m => 
        m.username.toLowerCase() === validatedUsername.toLowerCase()
      );
      
      if (!member) {
        const errorEmbed = createErrorEmbed(`Member "${validatedUsername}" not found in the database.`);
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      const oldScore = member.score;

      // Update member score
      await guild.updateMemberScore(validatedUsername, validatedScore);

      // Create success embed
      const successEmbed = createSuccessEmbed(
        'Score Updated Successfully',
        `**${validatedUsername}**'s score has been updated.`,
        [
          { name: 'Old Score', value: oldScore.toLocaleString('fr-FR'), inline: true },
          { name: 'New Score', value: validatedScore.toLocaleString('fr-FR'), inline: true },
          { name: 'Difference', value: (validatedScore - oldScore).toLocaleString('fr-FR'), inline: true },
          { name: 'Guild', value: member.guildName, inline: true }
        ]
      );

      await interaction.reply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error in updatescore command:', error);
      
      let errorMessage = 'An unexpected error occurred while updating the score.';
      if (error.message.includes('not found')) {
        errorMessage = error.message;
      }

      const errorEmbed = createErrorEmbed(errorMessage);
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
}; 