require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

// Command collection and cooldown tracking
client.commands = new Collection();
const cooldowns = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`Loaded command: ${command.data.name}`);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'discordbot' // Explicitly set database name
    });

    console.log('✅ Connected to MongoDB successfully');
    console.log('📊 Database: discordbot');
    console.log('📁 Collection: guilds');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Cooldown handler
function checkCooldown(interaction, commandName) {
  const cooldownSeconds = parseInt(process.env.COOLDOWN_SECONDS) || 5;
  
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(commandName);
  const userId = interaction.user.id;
  const cooldownAmount = cooldownSeconds * 1000;

  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return {
        onCooldown: true,
        timeLeft: Math.ceil(timeLeft)
      };
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);

  return { onCooldown: false };
}

// Bot ready event
client.once('ready', () => {
  console.log(`🤖 Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
});

// Interaction handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    // Check cooldown
    const cooldownCheck = checkCooldown(interaction, command.data.name);
    if (cooldownCheck.onCooldown) {
      const { createErrorEmbed } = require('./utils/helpers');
      const errorEmbed = createErrorEmbed(
        `Please wait **${cooldownCheck.timeLeft} seconds** before using this command again.`
      );
      return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // Execute command
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    
    const { createErrorEmbed } = require('./utils/helpers');
    const errorEmbed = createErrorEmbed('An unexpected error occurred while executing this command.');
    
    const replyOptions = { embeds: [errorEmbed], ephemeral: true };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(replyOptions);
    } else {
      await interaction.reply(replyOptions);
    }
  }
});

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down bot...');
  await mongoose.connection.close();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down bot...');
  await mongoose.connection.close();
  client.destroy();
  process.exit(0);
});

// Start the bot
async function startBot() {
  try {
    // Connect to database first
    await connectToDatabase();
    
    // Login to Discord
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      throw new Error('DISCORD_TOKEN environment variable is not set');
    }
    
    await client.login(token);
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the application
startBot();

/*
 * SETUP INSTRUCTIONS:
 * 
 * 1. Install dependencies:
 *    npm install
 * 
 * 2. Configure environment variables in .env file:
 *    - DISCORD_TOKEN: Your Discord bot token
 *    - MONGODB_URI: Your MongoDB connection string (replace <db_password> with actual password)
 *    - COOLDOWN_SECONDS: Cooldown time in seconds (default: 5)
 * 
 * 3. Register slash commands with Discord:
 *    You'll need to register the slash commands with Discord's API.
 *    You can use a separate script or the Discord Developer Portal.
 * 
 * 4. Run the bot:
 *    npm start
 *    or
 *    node index.js
 * 
 * 5. For development with auto-restart:
 *    npm run dev
 * 
 * COMMANDS AVAILABLE:
 * - /addmember: Add a new member to the guild (Admin only)
 * - /removemember: Remove a member from the guild (Admin only)
 * - /updatescore: Update a member's score (Admin only)
 * - /swapmember: Move a member between guilds (Admin only)
 * - /leaderboard: View guild leaderboard (Everyone)
 * - /allleaderboard: View combined leaderboard across all guilds (Everyone)
 */
