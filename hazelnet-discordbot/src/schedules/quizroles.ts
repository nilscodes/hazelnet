/* eslint-disable no-await-in-loop */
import HazelnetClient from '../utility/hazelnetclient';
import roleassignments from '../utility/roleassignments';

export default {
  cron: '15 * * * * *',
  async execute(client: HazelnetClient) {
    client.logger.info('Running quiz role assignment job');
    try {
      const hours = new Date().getHours();
      const minutes = new Date().getMinutes();
      const minutesInDay = hours * 60 + minutes;
      const allServers = await client.services.discordserver.getAllDiscordServers();
      for (let i = 0; i < allServers.length; i += 1) {
        const discordServer = allServers[i];
        if (discordServer.active && +discordServer.guildId % 120 === minutesInDay % 120) {
          try {
            const removeInvalid = discordServer.settings?.REMOVE_INVALID_QUIZROLES !== 'false';
            const expectedRoleAssignments = await client.services.discordquiz.getCurrentQuizRoleAssignments(discordServer.guildId);
            await roleassignments.ensureRoleAssignments(client, discordServer, 'quizRoles', expectedRoleAssignments, removeInvalid);
          } catch (error) {
            client.logger.error({ msg: `Failed to update quiz roles for ${discordServer.guildName} (${discordServer.guildId})`, error });
          }
        }
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to update quiz roles while getting discord server list', error });
    }
  },
};
