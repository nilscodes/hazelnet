/* eslint-disable no-await-in-loop */
module.exports = {
  async ensureRoleAssignments(client, discordServer, roleProperty, expectedRoleAssignments) {
    client.logger.info(`Processing ${roleProperty} for ${discordServer.guildName} (${discordServer.guildId})...`);
    const rolesToUsers = this.createRolesToUsersMap(discordServer, roleProperty, expectedRoleAssignments);
    const guildForAssignments = await client.guilds.fetch(discordServer.guildId);
    if (guildForAssignments) {
      await this.removeInvalidMembersFromRole(discordServer, roleProperty, guildForAssignments, rolesToUsers, client);
      await this.addMissingMembersToRole(discordServer, roleProperty, guildForAssignments, rolesToUsers, client);
    } else {
      client.logger.warn(`Did not find guild for ${roleProperty} assignments in guild cache for server ${discordServer.guildName} (${discordServer.guildId}).`);
    }
  },
  createRolesToUsersMap(discordServer, roleProperty, roleAssignments) {
    const rolesToUsers = {};
    discordServer[roleProperty].forEach((roleMapping) => { rolesToUsers[roleMapping.roleId] = []; });
    roleAssignments.forEach((roleAssignment) => {
      if (roleAssignment.guildId === discordServer.guildId) {
        const listForRole = rolesToUsers[roleAssignment.roleId] ?? [];
        listForRole.push(roleAssignment.userId);
        rolesToUsers[roleAssignment.roleId] = listForRole;
      }
    });
    return rolesToUsers;
  },
  removeInvalidMembersFromRole(discordServer, roleProperty, guildForAssignments, rolesToUsers, client) {
    discordServer[roleProperty].forEach(async (roleMapping) => {
      const guildRole = await guildForAssignments.roles.fetch(roleMapping.roleId);
      if (guildRole) {
        try {
          // TODO - add paging - but how to get the member count to page by?
          const allUsers = await guildForAssignments.members.fetch();
          for (let i = 0; i < allUsers.size; i += 1) {
            const member = allUsers.at(i);
            if (!rolesToUsers[roleMapping.roleId].includes(member.user.id) && member.roles.cache.some((role) => role.id === roleMapping.roleId)) {
              client.logger.info(`Removing ${roleProperty} ${guildRole.name} from member ${member.user.tag} (${member.user.id}) on discord server ${discordServer.guildName}`);
              try {
                await member.roles.remove(guildRole);
              } catch (error) {
                client.logger.error({ msg: `Failed to remove ${roleProperty} ${guildRole.name} from member ${member.user.tag} (${member.user.id}) on discord server ${discordServer.guildName}`, error });
              }
            }
          }
        } catch (error) {
          client.logger.error({ msg: `Failed fetching members of ${discordServer.guildName} (${discordServer.guildId})`, error });
        }
      } else {
        client.logger.info(`No role with ID ${roleMapping.roleId} found on discord server ${discordServer.guildName}`);
      }
    });
  },
  addMissingMembersToRole(discordServer, roleProperty, guildForAssignments, rolesToUsers, client) {
    Object.entries(rolesToUsers).forEach(async (roleMapping) => {
      const [roleId, roleList] = roleMapping;
      const guildRole = await guildForAssignments.roles.fetch(roleId);
      if (guildRole) {
        roleList.forEach(async (userIdToAssignRole) => {
          try {
            const member = await guildForAssignments.members.fetch(userIdToAssignRole);
            if (!member?.roles.cache.some((role) => role.id === roleId)) {
              client.logger.info(`Adding ${roleProperty} ${guildRole.name} to member ${member.user.tag} (${member.user.id}) on discord server ${discordServer.guildName}`);
              try {
                await member.roles.add(guildRole);
              } catch (error) {
                client.logger.error({ msg: `Failed to add ${roleProperty} ${guildRole.name} from member ${member.user.tag} (${member.user.id}) on discord server ${discordServer.guildName}`, error });
              }
            }
          } catch (e) {
            client.logger.info(`No member with ID ${userIdToAssignRole} found on discord server ${discordServer.guildName} (${discordServer.guildId})`);
          }
        });
      } else {
        client.logger.info(`No role with ID ${roleId} found on discord server ${discordServer.guildName}`);
      }
    });
  },
};
