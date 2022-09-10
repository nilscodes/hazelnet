const commandRegistration = require('../utility/commandregistration');

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    try {
      await commandRegistration.registerStartCommand(guild.client, guild.id);
      let discordServer = null;
      try {
        discordServer = await guild.client.services.discordserver.getDiscordServer(guild.id);
        discordServer.active = true;
        await guild.client.services.discordserver.updateDiscordServer(guild.id, { active: true });
      } catch (getDiscordServerError) {
        switch (getDiscordServerError.response?.status) {
          case 404:
            await guild.client.services.discordserver.registerDiscordServer(guild.id, guild.name, guild.ownerId, guild.memberCount);
            discordServer = await guild.client.services.discordserver.getDiscordServer(guild.id);
            break;
          default:
        }
      }
      if (discordServer?.settings?.BOT_NAME) {
        const botObject = await guild.members.fetch(guild.client.application.id);
        await botObject.setNickname(discordServer.settings.BOT_NAME);
      }
    } catch (e) {
      guild.client.logger.error(e);
    }
  },
};
