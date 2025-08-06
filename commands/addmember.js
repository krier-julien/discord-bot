const { SlashCommandBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const { 
  createSuccessEmbed, 
  createErrorEmbed, 
  hasAdminPermission, 
  validateUsername, 
  validateScore,
  validateGuildNumber
} = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addmember')
    .setDescription('Add a new member to a specific guild (Admin only)')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Member username (two words, e.g., "Alphaa Melo")')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('guild')
        .setDescription('Guild number (1-10)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10))
    .addIntegerOption(option =>
      option.setName('score')
        .setDescription('Member score (default: 0)')
        .setRequired(false)
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
      const guildNumber = interaction.options.getInteger('guild');
      const score = interaction.options.getInteger('score') || 0;

      let validatedUsername, validatedScore, validatedGuildNumber;
      try {
        validatedUsername = validateUsername(username);
        validatedScore = validateScore(score);
        validatedGuildNumber = validateGuildNumber(guildNumber);
      } catch (error) {
        const errorEmbed = createErrorEmbed(error.message);
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Get global guild data
      const guild = await Guild.getGlobalGuild();

      // Add member to guild
      await guild.addMember(validatedUsername, validatedScore, validatedGuildNumber);

      // Create success embed
      const successEmbed = createSuccessEmbed(
        'Member Added Successfully',
        `**${validatedUsername}** has been added to **Guild ${validatedGuildNumber}** with a score of **${validatedScore.toLocaleString('fr-FR')}**.`,
        [
          { name: 'Guild', value: `Guild ${validatedGuildNumber}`, inline: true },
          { name: 'Total Members', value: guild.members.length.toString(), inline: true }
        ]
      );

      await interaction.reply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error in addmember command:', error);
      
      let errorMessage = 'An unexpected error occurred while adding the member.';
      if (error.message.includes('already exists')) {
        errorMessage = error.message;
      }

      const errorEmbed = createErrorEmbed(errorMessage);
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
}; 