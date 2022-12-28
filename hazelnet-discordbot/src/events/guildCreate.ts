import { GuildDiscordEvent } from "../utility/commandtypes";

const commandRegistration = require('../utility/commandregistration');

export default <GuildDiscordEvent> {
  name: 'guildCreate',
  async execute(client, guild) {
    try {
      await commandRegistration.registerStartCommand(client, guild.id);
      let discordServer = null;
      try {
        discordServer = await client.services.discordserver.getDiscordServer(guild.id);
        discordServer.active = true;
        await client.services.discordserver.updateDiscordServer(guild.id, { active: true });
      } catch (getDiscordServerError: any) {
        switch (getDiscordServerError.response?.status) {
          case 404:
            await client.services.discordserver.registerDiscordServer(guild.id, guild.name, guild.ownerId, guild.memberCount);
            discordServer = await client.services.discordserver.getDiscordServer(guild.id);
            break;
          default:
        }
      }
      if (discordServer?.settings?.BOT_NAME) {
        const botObject = await guild.members.fetch(client.application?.id as string);
        await botObject.setNickname(discordServer.settings.BOT_NAME);
      }
    } catch (e) {
      client.logger.error(e);
    }
  },
};
