const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  score: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  guildNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 10 // Allow up to 10 guilds
  },
  guildName: {
    type: String,
    required: true,
    default: function() {
      return `Guild ${this.guildNumber}`;
    }
  }
});

const guildSchema = new mongoose.Schema({
  members: [memberSchema]
}, {
  timestamps: true,
  collection: 'guilds' // Explicitly set collection name to 'guilds'
});

// Index for better query performance
guildSchema.index({ 'members.username': 1 });
guildSchema.index({ 'members.guildNumber': 1 });

// Virtual for member count
guildSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Method to add a member to a specific guild
guildSchema.methods.addMember = function(username, score = 0, guildNumber) {
  const existingMember = this.members.find(member => 
    member.username.toLowerCase() === username.toLowerCase()
  );
  
  if (existingMember) {
    throw new Error(`Member "${username}" already exists in the database.`);
  }
  
  const guildName = `Guild ${guildNumber}`;
  this.members.push({ username, score, guildNumber, guildName });
  return this.save();
};

// Method to remove a member
guildSchema.methods.removeMember = function(username) {
  const memberIndex = this.members.findIndex(member => 
    member.username.toLowerCase() === username.toLowerCase()
  );
  
  if (memberIndex === -1) {
    throw new Error(`Member "${username}" not found in the database.`);
  }
  
  this.members.splice(memberIndex, 1);
  return this.save();
};

// Method to update a member's score
guildSchema.methods.updateMemberScore = function(username, newScore) {
  const member = this.members.find(member => 
    member.username.toLowerCase() === username.toLowerCase()
  );
  
  if (!member) {
    throw new Error(`Member "${username}" not found in the database.`);
  }
  
  member.score = newScore;
  return this.save();
};

// Method to move a member between guilds
guildSchema.methods.moveMember = function(username, newGuildNumber) {
  const member = this.members.find(member => 
    member.username.toLowerCase() === username.toLowerCase()
  );
  
  if (!member) {
    throw new Error(`Member "${username}" not found in the database.`);
  }
  
  member.guildNumber = newGuildNumber;
  member.guildName = `Guild ${newGuildNumber}`;
  return this.save();
};

// Method to get members by guild number
guildSchema.methods.getMembersByGuild = function(guildNumber) {
  return this.members.filter(member => member.guildNumber === guildNumber);
};

// Method to get sorted members by guild number
guildSchema.methods.getSortedMembersByGuild = function(guildNumber) {
  return this.getMembersByGuild(guildNumber).sort((a, b) => b.score - a.score);
};

// Method to get all members sorted by score
guildSchema.methods.getAllSortedMembers = function() {
  return this.members.sort((a, b) => b.score - a.score);
};

// Method to get guild statistics
guildSchema.methods.getGuildStats = function() {
  const guildStats = {};
  
  for (let i = 1; i <= 10; i++) {
    const guildMembers = this.getMembersByGuild(i);
    if (guildMembers.length > 0) {
      const totalScore = guildMembers.reduce((sum, member) => sum + member.score, 0);
      const avgScore = Math.round(totalScore / guildMembers.length);
      
      guildStats[i] = {
        guildName: `Guild ${i}`,
        memberCount: guildMembers.length,
        totalScore,
        avgScore,
        members: guildMembers.sort((a, b) => b.score - a.score)
      };
    }
  }
  
  return guildStats;
};

// Static method to get or create the global guild data
guildSchema.statics.getGlobalGuild = async function() {
  let guild = await this.findOne({});
  
  if (!guild) {
    guild = new this({
      members: []
    });
    await guild.save();
  }
  
  return guild;
};

module.exports = mongoose.model('Guild', guildSchema); 