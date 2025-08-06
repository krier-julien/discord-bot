const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Guild = require('../models/Guild');
const { 
  createErrorEmbed, 
  formatNumber 
} = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guildinfo')
    .setDescription('View detailed information about all guilds and their members'),

  async execute(interaction) {
    try {
      // Get global guild data
      const guild = await Guild.getGlobalGuild();
      
      if (!guild || guild.members.length === 0) {
        const errorEmbed = createErrorEmbed('No members found in the database.');
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Get guild statistics
      const guildStats = guild.getGuildStats();
      
      if (Object.keys(guildStats).length === 0) {
        const errorEmbed = createErrorEmbed('No members found in any guild.');
        return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      // Create main embed
      const embed = new EmbedBuilder()
        .setColor(0x0099FF) // Blue
        .setTitle('📊 Guild Information')
        .setDescription(`Overview of all guilds and their members`)
        .setTimestamp();

      // Add guild summary
      const guildSummary = Object.values(guildStats).map((stat, index) => {
        return `**${index + 1}. ${stat.guildName}**\n` +
               `   👥 Members: ${stat.memberCount}\n` +
               `   🏆 Total Score: ${formatNumber(stat.totalScore)}\n` +
               `   📊 Average Score: ${formatNumber(stat.avgScore)}`;
      }).join('\n\n');

      embed.addFields({
        name: '🏛️ Guild Summary',
        value: guildSummary,
        inline: false
      });

      // Add detailed member lists for each guild
      for (const [guildNumber, stat] of Object.entries(guildStats)) {
        const memberList = stat.members.map((member, index) => {
          const rank = index + 1;
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
          return `${medal} **${member.username}** - ${formatNumber(member.score)}`;
        }).join('\n');

        embed.addFields({
          name: `👥 ${stat.guildName} Members (${stat.memberCount})`,
          value: memberList,
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in guildinfo command:', error);
      
      const errorEmbed = createErrorEmbed('An unexpected error occurred while fetching guild information.');
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
}; 