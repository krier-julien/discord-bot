const { SlashCommandBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const { 
  createSuccessEmbed, 
  createErrorEmbed, 
  hasAdminPermission, 
  validateUsername,
  validateGuildNumber
} = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('swapmember')
    .setDescription('Move a member to a different guild (Admin only)')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Member username to move (two words, e.g., "Alphaa Melo")')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('target_guild')
        .setDescription('Target guild number (1-10)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10)),

  async execute(interaction) {
    try {
      // Check admin permission
      if (!hasAdminPermission(interaction)) {
        const errorEmbed = createErrorEmbed('You need Administrator permission to use this command.');
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Get and validate inputs
      const username = interaction.options.getString('username');
      const targetGuildNumber = interaction.options.getInteger('target_guild');

      let validatedUsername, validatedTargetGuild;
      try {
        validatedUsername = validateUsername(username);
        validatedTargetGuild = validateGuildNumber(targetGuildNumber);
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

      // Find member in database
      const member = guild.members.find(m => 
        m.username.toLowerCase() === validatedUsername.toLowerCase()
      );
      
      if (!member) {
        const errorEmbed = createErrorEmbed(`Member "${validatedUsername}" not found in the database.`);
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      const oldGuildNumber = member.guildNumber;
      const oldGuildName = member.guildName;

      // Move member to target guild
      await guild.moveMember(validatedUsername, validatedTargetGuild);

      // Create success embed
      const successEmbed = createSuccessEmbed(
        'Member Moved Successfully',
        `**${validatedUsername}** has been moved from **${oldGuildName}** to **Guild ${validatedTargetGuild}**.`,
        [
          { name: 'Score', value: member.score.toLocaleString('fr-FR'), inline: true },
          { name: 'Old Guild', value: oldGuildName, inline: true },
          { name: 'New Guild', value: `Guild ${validatedTargetGuild}`, inline: true }
        ]
      );

      await interaction.reply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error in swapmember command:', error);
      
      let errorMessage = 'An unexpected error occurred while swapping the member.';
      if (error.message.includes('not found') || error.message.includes('already exists')) {
        errorMessage = error.message;
      }

      const errorEmbed = createErrorEmbed(errorMessage);
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
}; 