/* eslint-disable no-await-in-loop */
const roleassignments = require('../utility/roleassignments');

module.exports = {
  cron: '30 * * * * *',
  async execute(client) {
    client.logger.info('Running token role assignment job');
    try {
      const minutes = new Date().getMinutes() % 60;
      const allServers = await client.services.discordserver.getAllDiscordServers();
      for (let i = 0; i < allServers.length; i += 1) {
        const discordServer = allServers[i];
        if (discordServer.active && discordServer.guildId % 60 === minutes) {
          try {
            const removeInvalid = discordServer.settings?.REMOVE_INVALID_TOKENROLES !== 'false';
            const expectedRoleAssignments = await client.services.discordserver.getCurrentTokenRoleAssignments(discordServer.guildId);
            await roleassignments.ensureRoleAssignments(client, discordServer, 'tokenRoles', expectedRoleAssignments, removeInvalid);
          } catch (error) {
            client.logger.error({ msg: `Failed to update token roles for ${discordServer.guildName} (${discordServer.guildId})`, error });
          }
        }
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to update token roles while getting discord server list', error });
    }
  },
};
