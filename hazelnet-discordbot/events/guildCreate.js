const commandRegistration = require('../utility/commandregistration');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    try {
      await commandRegistration.registerStartCommand(guild.client, guild.id);
      await guild.client.services.discordserver.registerDiscordServer(guild.id, guild.name, guild.ownerId, guild.memberCount);
    } catch (e) {
      guild.client.logger.error(e);
    }
  },
};
