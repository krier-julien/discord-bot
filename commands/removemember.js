const { SlashCommandBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const { 
  createSuccessEmbed, 
  createErrorEmbed, 
  hasAdminPermission, 
  validateUsername 
} = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removemember')
    .setDescription('Remove a member from the guild (Admin only)')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Member username to remove (two words, e.g., "Alphaa Melo")')
        .setRequired(true)),

  async execute(interaction) {
    try {
      // Check admin permission
      if (!hasAdminPermission(interaction)) {
        const errorEmbed = createErrorEmbed('You need Administrator permission to use this command.');
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Get and validate username
      const username = interaction.options.getString('username');

      let validatedUsername;
      try {
        validatedUsername = validateUsername(username);
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

      // Find member to get guild info before removal
      const member = guild.members.find(m => 
        m.username.toLowerCase() === validatedUsername.toLowerCase()
      );

      if (!member) {
        const errorEmbed = createErrorEmbed(`Member "${validatedUsername}" not found in the database.`);
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Remove member from database
      await guild.removeMember(validatedUsername);

      // Create success embed
      const successEmbed = createSuccessEmbed(
        'Member Removed Successfully',
        `**${validatedUsername}** has been removed from the database.`,
        [
          { name: 'Guild', value: member.guildName, inline: true },
          { name: 'Remaining Members', value: guild.members.length.toString(), inline: true }
        ]
      );

      await interaction.reply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error in removemember command:', error);
      
      let errorMessage = 'An unexpected error occurred while removing the member.';
      if (error.message.includes('not found')) {
        errorMessage = error.message;
      }

      const errorEmbed = createErrorEmbed(errorMessage);
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
}; 