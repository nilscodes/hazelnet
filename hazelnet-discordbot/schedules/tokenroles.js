const roleassignments = require('../utility/roleassignments');

module.exports = {
  cron: '*/10 * * * *',
  async execute(client) {
    client.logger.info('Running token role assignment job');
    try {
      const allServers = await client.services.discordserver.getAllDiscordServers();
      allServers.forEach(async (discordServer) => {
        try {
          const expectedRoleAssignments = await client.services.discordserver.getCurrentTokenRoleAssignments(discordServer.guildId);
          await roleassignments.ensureRoleAssignments(client, discordServer, 'tokenRoles', expectedRoleAssignments);
        } catch (error) {
          client.logger.error({ msg: `Failed to update token roles for ${discordServer.guildName} (${discordServer.guildId})`, error });
        }
      });
    } catch (error) {
      client.logger.error({ msg: 'Failed to update token roles while getting discord server list', error });
    }
  },
};
