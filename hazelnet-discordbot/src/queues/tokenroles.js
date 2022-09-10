/* eslint-disable no-await-in-loop */
const roleassignments = require('../utility/roleassignments');

module.exports = {
  name: 'tokenroles',
  async consume(client, roleAssignmentsForUser) {
    try {
      const guild = await client.guilds.fetch(roleAssignmentsForUser.guildId);
      if (guild) {
        const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
        const removeInvalid = discordServer.settings?.REMOVE_INVALID_TOKENROLES !== 'false';
        await roleassignments.ensureRoleAssignmentsForUser(client, discordServer, 'tokenRoles', guild, roleAssignmentsForUser.assignments, roleAssignmentsForUser.userId, removeInvalid);
      } else {
        client.logger.error({ guildId: roleAssignmentsForUser.guildId, msg: 'Guild not found while processing token role assignments' });
      }
    } catch (assignmentError) {
      client.logger.error({ guildId: roleAssignmentsForUser.guildId, msg: 'Failed to process token role assignments queue', error: assignmentError });
    }
  },
};
