/* eslint-disable no-await-in-loop */
import datetime from '../utility/datetime';
import HazelnetClient from '../utility/hazelnetclient';
import roleassignments from '../utility/roleassignments';

export default {
  cron: '0 * * * * *',
  async execute(client: HazelnetClient) {
    client.logger.info('Running dRep delegator role assignment job');
    try {
      const minutesInDay = datetime.getMinutesInDay();
      const allServers = await client.services.discordserver.getAllDiscordServers();
      for (let i = 0; i < allServers.length; i += 1) {
        const discordServer = allServers[i];
        if (discordServer.active && +discordServer.guildId % 120 === minutesInDay % 120) {
          try {
            const removeInvalid = discordServer.settings?.REMOVE_INVALID_DREPDELEGATORROLES !== 'false';
            const expectedRoleAssignments = await client.services.discordserver.getCurrentDRepDelegatorRoleAssignments(discordServer.guildId);
            await roleassignments.ensureRoleAssignments(client, discordServer, 'dRepDelegatorRoles', expectedRoleAssignments, removeInvalid);
          } catch (error) {
            client.logger.error({ msg: `Failed to update dRep delegator roles for ${discordServer.guildName} (${discordServer.guildId})`, error });
          }
        }
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to update dRep delegator roles while getting discord server list', error });
    }
  },
};
