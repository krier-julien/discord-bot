# Discord Guild Management Bot

A self-hosted Discord bot written in Node.js using the discord.js library with MongoDB integration for managing guild members and scores.

## Features

### 🏆 Guild Management
- **Add Members**: Add new members to guilds with usernames and scores
- **Remove Members**: Remove members from guilds
- **Update Scores**: Modify member scores
- **Swap Members**: Move members between different guilds
- **Leaderboards**: View guild-specific and global leaderboards

### 🔒 Security & Anti-Spam
- **Admin Permissions**: Only administrators can modify data
- **Cooldown System**: 5-second cooldown per user to prevent spam
- **Input Validation**: Comprehensive validation for usernames and scores

### 📊 Database Features
- **MongoDB Integration**: Persistent storage with mongoose
- **Guild Schema**: Organized data structure for guilds and members
- **Score Formatting**: Numbers displayed with proper formatting (e.g., `999 999 999`)

## Commands

| Command | Description | Permission | Usage |
|---------|-------------|------------|-------|
| `/addmember` | Add a new member to the guild | Admin | `/addmember username:"Alphaa Melo" score:1000000` |
| `/removemember` | Remove a member from the guild | Admin | `/removemember username:"Alphaa Melo"` |
| `/updatescore` | Update a member's score | Admin | `/updatescore username:"Alphaa Melo" score:1500000` |
| `/swapmember` | Move a member to a different guild | Admin | `/swapmember username:"Alphaa Melo" target_guild:"New Guild"` |
| `/leaderboard` | View guild leaderboard | Everyone | `/leaderboard` |
| `/allleaderboard` | View global leaderboard | Everyone | `/allleaderboard` |

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Discord Bot Token

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and fill in your credentials:
   ```env
   # Discord Bot Configuration
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_discord_client_id_here
   
   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://Neiko:<db_password>@discordbot.sfs6ohh.mongodb.net/?retryWrites=true&w=majority&appName=DiscordBOT
   
   # Bot Settings
   COOLDOWN_SECONDS=5
   ```

### 3. Discord Bot Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Copy the bot token to your `.env` file
5. Copy the application client ID to your `.env` file
6. Enable the following bot permissions:
   - Send Messages
   - Use Slash Commands
   - Embed Links
   - Read Message History

### 4. Register Slash Commands
```bash
node deploy-commands.js
```

### 5. Start the Bot
```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

## Database Schema

### Guild Collection
```javascript
{
  guildId: String,        // Discord guild ID
  guildName: String,      // Guild name
  members: [
    {
      username: String,   // Two-word username (e.g., "Alphaa Melo")
      score: Number       // Member score
    }
  ],
  createdAt: Date,        // Auto-generated
  updatedAt: Date         // Auto-generated
}
```

## Usage Examples

### Adding Members
```
/addmember username:"Alphaa Melo" score:999999999
```
✅ Success: **Alphaa Melo** has been added to the guild with a score of **999 999 999**.

### Updating Scores
```
/updatescore username:"Alphaa Melo" score:1500000000
```
✅ Success: **Alphaa Melo**'s score has been updated.
- Old Score: 999 999 999
- New Score: 1 500 000 000
- Difference: 500 000 001

### Viewing Leaderboards
```
/leaderboard
```
🏆 **Guild Leaderboard**
🥇 **Alphaa Melo** - 1 500 000 000
🥈 **Beta User** - 750 000 000
🥉 **Gamma Player** - 500 000 000

## Error Handling

The bot includes comprehensive error handling for:
- Invalid usernames (must be exactly two words)
- Duplicate members
- Missing members
- Database connection issues
- Permission errors
- Invalid scores

## Security Features

- **Admin-Only Commands**: Data modification commands require Administrator permission
- **Cooldown Protection**: 5-second cooldown prevents command spam
- **Input Validation**: All inputs are validated before processing
- **Error Messages**: Clear, user-friendly error messages

## Development

### Project Structure
```
discord-bot/
├── commands/           # Slash command implementations
│   ├── addmember.js
│   ├── removemember.js
│   ├── updatescore.js
│   ├── swapmember.js
│   ├── leaderboard.js
│   └── allleaderboard.js
├── models/            # MongoDB schemas
│   └── Guild.js
├── utils/             # Utility functions
│   └── helpers.js
├── index.js           # Main bot file
├── deploy-commands.js # Command registration
├── package.json       # Dependencies
└── README.md         # This file
```

### Adding New Commands
1. Create a new file in the `commands/` directory
2. Export an object with `data` (SlashCommandBuilder) and `execute` (function)
3. Run `node deploy-commands.js` to register the command

### Database Operations
The bot uses mongoose for MongoDB operations with the following features:
- Automatic guild creation when needed
- Member validation and duplicate checking
- Score formatting with French locale
- Efficient queries with proper indexing

## Troubleshooting

### Common Issues

1. **Bot not responding to commands**
   - Ensure slash commands are registered: `node deploy-commands.js`
   - Check bot permissions in Discord server

2. **Database connection errors**
   - Verify MongoDB URI in `.env` file
   - Check network connectivity
   - Ensure MongoDB Atlas IP whitelist includes your IP

3. **Permission denied errors**
   - Ensure bot has Administrator permission for data modification commands
   - Check bot role hierarchy in Discord server

4. **Invalid username errors**
   - Usernames must contain exactly two words
   - Each word must be at least 2 characters long

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify your environment configuration
3. Check the console logs for detailed error messages

---

**Note**: Remember to replace `<db_password>` in the MongoDB URI with your actual database password before running the bot. 