import { DiscordRoleAssignmentListForGuildMember } from '@vibrantnet/core';
import HazelnetClient from "../utility/hazelnetclient";
import roleassignments from '../utility/roleassignments';

export default {
  name: 'drepdelegatorroles',
  async consume(client: HazelnetClient, roleAssignmentsForUser: DiscordRoleAssignmentListForGuildMember) {
    try {
      const guild = await client.guilds.fetch(roleAssignmentsForUser.guildId);
      if (guild) {
        const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
        const removeInvalid = discordServer.settings?.REMOVE_INVALID_DREPDELEGATORROLES !== 'false';
        await roleassignments.ensureRoleAssignmentsForUser(client, discordServer, 'dRepDelegatorRoles', guild, roleAssignmentsForUser.assignments, roleAssignmentsForUser.userId, removeInvalid);
      } else {
        client.logger.error({ guildId: roleAssignmentsForUser.guildId, msg: 'Guild not found while processing dRep delegator role assignments' });
      }
    } catch (assignmentError) {
      client.logger.error({ guildId: roleAssignmentsForUser.guildId, msg: 'Failed to process dRep delegator role assignments queue', error: assignmentError });
    }
  },
};
