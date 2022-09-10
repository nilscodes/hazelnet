/* eslint-disable no-await-in-loop */
const roleassignments = require('../utility/roleassignments');

module.exports = {
  cron: '0 * * * * *',
  async execute(client) {
    client.logger.info('Running delegator role assignment job');
    try {
      const hours = new Date().getHours();
      const minutes = new Date().getMinutes();
      const minutesInDay = hours * 60 + minutes;
      const allServers = await client.services.discordserver.getAllDiscordServers();
      for (let i = 0; i < allServers.length; i += 1) {
        const discordServer = allServers[i];
        if (discordServer.active && discordServer.guildId % 120 === minutesInDay % 120) {
          try {
            const removeInvalid = discordServer.settings?.REMOVE_INVALID_DELEGATORROLES !== 'false';
            const expectedRoleAssignments = await client.services.discordserver.getCurrentDelegatorRoleAssignments(discordServer.guildId);
            await roleassignments.ensureRoleAssignments(client, discordServer, 'delegatorRoles', expectedRoleAssignments, removeInvalid);
          } catch (error) {
            client.logger.error({ msg: `Failed to update delegator roles for ${discordServer.guildName} (${discordServer.guildId})`, error });
          }
        }
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to update delegator roles while getting discord server list', error });
    }
  },
};
