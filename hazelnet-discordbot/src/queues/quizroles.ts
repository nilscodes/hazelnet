import HazelnetClient from "../utility/hazelnetclient";
import { DiscordRoleAssignmentListForGuildMember } from '@vibrantnet/core';
import roleassignments from '../utility/roleassignments';

export default {
  name: 'quizroles',
  async consume(client: HazelnetClient, roleAssignmentsForUser: DiscordRoleAssignmentListForGuildMember) {
    try {
      const guild = await client.guilds.fetch(roleAssignmentsForUser.guildId);
      if (guild) {
        const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
        const removeInvalid = discordServer.settings?.REMOVE_INVALID_QUIZROLES !== 'false';
        await roleassignments.ensureRoleAssignmentsForUser(client, discordServer, 'quizRoles', guild, roleAssignmentsForUser.assignments, roleAssignmentsForUser.userId, removeInvalid);
      } else {
        client.logger.error({ guildId: roleAssignmentsForUser.guildId, msg: 'Guild not found while processing quiz role assignments' });
      }
    } catch (assignmentError) {
      client.logger.error({ guildId: roleAssignmentsForUser.guildId, msg: 'Failed to process quiz role assignments queue', error: assignmentError });
    }
  },
};
