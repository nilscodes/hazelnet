import HazelnetClient from "../utility/hazelnetclient";
import { DiscordRoleAssignmentListForGuildMember } from '@vibrantnet/core';
import roleassignments from '../utility/roleassignments';

export default {
  name: 'delegatorroles',
  async consume(client: HazelnetClient, roleAssignmentsForUser: DiscordRoleAssignmentListForGuildMember) {
    try {
      const guild = await client.guilds.fetch(roleAssignmentsForUser.guildId);
      if (guild) {
        const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
        const removeInvalid = discordServer.settings?.REMOVE_INVALID_DELEGATORROLES !== 'false';
        await roleassignments.ensureRoleAssignmentsForUser(client, discordServer, 'delegatorRoles', guild, roleAssignmentsForUser.assignments, roleAssignmentsForUser.userId, removeInvalid);
      } else {
        client.logger.error({ guildId: roleAssignmentsForUser.guildId, msg: 'Guild not found while processing delegator role assignments' });
      }
    } catch (assignmentError) {
      client.logger.error({ guildId: roleAssignmentsForUser.guildId, msg: 'Failed to process delegator role assignments queue', error: assignmentError });
    }
  },
};
