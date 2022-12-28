import { GuildDiscordEvent } from "../utility/commandtypes";

export default <GuildDiscordEvent> {
  name: 'guildDelete',
  async execute(client, guild) {
    try {
      await client.services.discordserver.updateDiscordServer(guild.id, { active: false });
    } catch (e) {
      client.logger.error(e);
    }
  },
};
