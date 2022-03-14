/* eslint-disable no-await-in-loop */

module.exports = {
  cron: '0 0 * * *',
  async execute(client) {
    client.logger.info('Updating member counts and other information for all servers');
    try {
      const allServers = await client.services.discordserver.getAllDiscordServers();
      for (let i = 0; i < allServers.length; i += 1) {
        const discordServer = allServers[i];
        try {
          const guild = await client.guilds.fetch(discordServer.guildId);
          await client.services.discordserver.updateDiscordServer(guild.id, {
            guildName: guild.name,
            guildOwner: guild.ownerId,
            guildMemberCount: guild.memberCount,
          });
        } catch (error) {
          client.logger.error({ msg: `Failed to update member counts for ${discordServer.guildName} (${discordServer.guildId})` });
        }
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to do guild member updates.', error });
    }
  },
};
