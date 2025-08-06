const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Format number with spaces (e.g., 999999999 -> 999 999 999)
function formatNumber(number) {
  return new Intl.NumberFormat('fr-FR').format(number);
}

// Create success embed
function createSuccessEmbed(title, description, fields = []) {
  const embed = new EmbedBuilder()
    .setColor(0x00FF00) // Green
    .setTitle(`✅ ${title}`)
    .setDescription(description)
    .setTimestamp();

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

// Create error embed
function createErrorEmbed(description) {
  return new EmbedBuilder()
    .setColor(0xFF0000) // Red
    .setTitle('❌ Error')
    .setDescription(description)
    .setTimestamp();
}

// Create info embed
function createInfoEmbed(title, description, fields = []) {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF) // Blue
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

// Create leaderboard embed
function createLeaderboardEmbed(title, members, guildName = null) {
  const embed = new EmbedBuilder()
    .setColor(0xFFD700) // Gold
    .setTitle(`🏆 ${title}`)
    .setTimestamp();

  if (guildName) {
    embed.setDescription(`**Guild:** ${guildName}`);
  }

  if (members.length === 0) {
    embed.addFields({
      name: 'No Members',
      value: 'This guild has no members yet.',
      inline: false
    });
  } else {
    const leaderboardText = members.map((member, index) => {
      const rank = index + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
      return `${medal} **${member.username}** - ${formatNumber(member.score)}`;
    }).join('\n');

    embed.addFields({
      name: 'Leaderboard',
      value: leaderboardText,
      inline: false
    });
  }

  return embed;
}

// Check if user has administrator permission
function hasAdminPermission(interaction) {
  return interaction.member.permissions.has(PermissionFlagsBits.Administrator);
}

// Validate username format (two words)
function validateUsername(username) {
  const words = username.trim().split(/\s+/);
  if (words.length !== 2) {
    throw new Error('Username must contain exactly two words (e.g., "Alphaa Melo").');
  }
  
  if (words[0].length < 2 || words[1].length < 2) {
    throw new Error('Each word in the username must be at least 2 characters long.');
  }
  
  return words.join(' ');
}

// Validate score
function validateScore(score) {
  const numScore = parseInt(score);
  if (isNaN(numScore) || numScore < 0) {
    throw new Error('Score must be a positive number.');
  }
  return numScore;
}

// Validate guild number
function validateGuildNumber(guildNumber) {
  const numGuild = parseInt(guildNumber);
  if (isNaN(numGuild) || numGuild < 1 || numGuild > 10) {
    throw new Error('Guild number must be between 1 and 10.');
  }
  return numGuild;
}

// Find member in global database
async function findMemberInDatabase(username) {
  const Guild = require('../models/Guild');
  const guild = await Guild.getGlobalGuild();
  
  const member = guild.members.find(m => 
    m.username.toLowerCase() === username.toLowerCase()
  );
  
  return member ? { guild, member } : null;
}

module.exports = {
  formatNumber,
  createSuccessEmbed,
  createErrorEmbed,
  createInfoEmbed,
  createLeaderboardEmbed,
  hasAdminPermission,
  validateUsername,
  validateScore,
  validateGuildNumber,
  findMemberInDatabase
}; 