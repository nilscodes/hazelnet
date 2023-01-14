/* eslint-disable no-await-in-loop */
import HazelnetClient from "../utility/hazelnetclient";
const wait = require('util').promisify(setTimeout);
import lostroles from "../utility/lostroles";

/**
 * Helper schedule that should only be used to restore lost roles in a guild, if the bot removed them.
 */
export default {
  // cron: '1 * * * *',
  async execute(client: HazelnetClient) {
    client.logger.info('Restoring lost roles');
    try {
      const roleToRestore = '855667481858539000';
      const guildToFix = '848934948329226200';
      const guildForAssignments = await client.guilds.fetch(guildToFix);
      if (guildForAssignments) {
        const guildRole = await guildForAssignments.roles.fetch(roleToRestore);
        if (guildRole) {
          const allUsers = await guildForAssignments.members.fetch();
          const usersWithLostRoles = [...new Set(lostroles)];
          client.logger.info(`Restoring lost role ${guildRole.name} on guild ${guildForAssignments.name} - found ${allUsers.size} members. ${usersWithLostRoles.length} users with lost roles to restore.`);
          for (let i = 0, len = usersWithLostRoles.length; i < len; i += 1) {
            const userTag = usersWithLostRoles[i];
            const member = allUsers.find((guildUser) => guildUser.user.tag === userTag);
            if (member) {
              if (!member?.roles.cache.some((role) => role.id === roleToRestore)) {
                client.logger.info(`Restoring role ${guildRole.name} to member ${member.user.tag} (${member.user.id}) on discord server ${guildForAssignments.name}`);
                try {
                  await member.roles.add(guildRole);
                } catch (error) {
                  client.logger.error({ msg: `Failed to restore role ${guildRole.name} to member ${member.user.tag} (${member.user.id}) on discord server ${guildForAssignments.name}`, error });
                }
                await wait(1000);
              }
            } else {
              client.logger.info(`User with tag ${userTag} not found in guild ${guildForAssignments.name}`);
            }
          }
        } else {
          client.logger.info(`No role with ID ${roleToRestore} found on discord server ${guildForAssignments.name}`);
        }
      } else {
        client.logger.info(`No guild with ID ${guildToFix} found`);
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to do restore lost roles.', error });
    }
  },
};
