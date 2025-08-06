const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const { 
  createLeaderboardEmbed, 
  createErrorEmbed,
  formatNumber
} = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View leaderboard for a specific guild or all guilds combined')
    .addIntegerOption(option =>
      option.setName('guild')
        .setDescription('Guild number (1-10) or leave empty for all guilds')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)),

  async execute(interaction) {
    try {
      const guildNumber = interaction.options.getInteger('guild');
      
      // Get global guild data
      const guild = await Guild.getGlobalGuild();
      
      if (!guild || guild.members.length === 0) {
        const errorEmbed = createErrorEmbed('No members found in the database.');
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      if (guildNumber) {
        // Show specific guild leaderboard
        const guildMembers = guild.getSortedMembersByGuild(guildNumber);
        
        if (guildMembers.length === 0) {
          const errorEmbed = createErrorEmbed(`No members found in Guild ${guildNumber}.`);
          return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const leaderboardEmbed = createLeaderboardEmbed(
          `Guild ${guildNumber} Leaderboard`,
          guildMembers,
          `Guild ${guildNumber}`
        );

        await interaction.reply({ embeds: [leaderboardEmbed] });
      } else {
        // Show combined leaderboard for all guilds
        const allMembers = guild.getAllSortedMembers();
        
        if (allMembers.length === 0) {
          const errorEmbed = createErrorEmbed('No members found in any guild.');
          return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // Create combined leaderboard embed
        const embed = new EmbedBuilder()
          .setColor(0xFFD700) // Gold
          .setTitle('🏆 Combined Leaderboard')
          .setDescription(`All members across all guilds (${allMembers.length} total members)`)
          .setTimestamp();

        const leaderboardText = allMembers.map((member, index) => {
          const rank = index + 1;
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
          return `${medal} **${member.username}** - ${formatNumber(member.score)} (${member.guildName})`;
        }).join('\n');

        embed.addFields({
          name: 'Combined Leaderboard',
          value: leaderboardText,
          inline: false
        });

        // Add guild statistics
        const guildStats = guild.getGuildStats();
        const statsText = Object.values(guildStats).map(stat => 
          `**${stat.guildName}**: ${stat.memberCount} members, ${formatNumber(stat.totalScore)} total score`
        ).join('\n');

        if (statsText) {
          embed.addFields({
            name: 'Guild Statistics',
            value: statsText,
            inline: false
          });
        }

        await interaction.reply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in leaderboard command:', error);
      
      const errorEmbed = createErrorEmbed('An unexpected error occurred while fetching the leaderboard.');
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
}; 