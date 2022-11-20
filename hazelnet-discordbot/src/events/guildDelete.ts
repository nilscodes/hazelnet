import { GuildDiscordEvent } from "../utility/commandtypes";

export default <GuildDiscordEvent> {
  name: 'guildDelete',
  async execute(guild) {
    try {
      await guild.client.services.discordserver.updateDiscordServer(guild.id, { active: false });
    } catch (e) {
      guild.client.logger.error(e);
    }
  },
};
