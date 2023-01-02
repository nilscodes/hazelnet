const i18n = require('i18n');

/* eslint-disable no-await-in-loop */
module.exports = {
  async ensureRoleAssignments(client, discordServer, roleProperty, expectedRoleAssignments, removeInvalid) {
    client.logger.info(`Processing ${roleProperty} for ${discordServer.guildName} (${discordServer.guildId}). ${removeInvalid ? 'R' : 'Not r'}emoving invalid role assignments. Processing a total of ${expectedRoleAssignments.length} roles that should be assigned.`);
    const roles = await this.getRoles(client, discordServer.guildId, roleProperty);
    const rolesToUsers = this.createRolesToUsersMap(discordServer, roles, expectedRoleAssignments);
    const guildForAssignments = await client.guilds.fetch(discordServer.guildId);
    if (guildForAssignments) {
      if (removeInvalid && (discordServer.premium || roles.length <= 1)) {
        await this.removeInvalidMembersFromRole(discordServer, roleProperty, roles, guildForAssignments, rolesToUsers, client);
      }
      await this.addMissingMembersToRole(discordServer, roleProperty, guildForAssignments, rolesToUsers, client);
    } else {
      client.logger.warn(`Did not find guild for ${roleProperty} assignments in guild cache for server ${discordServer.guildName} (${discordServer.guildId}).`);
    }
  },
  async ensureRoleAssignmentsForUser(client, discordServer, roleProperty, guildForAssignments, expectedRoleAssignments, userId, removeInvalid) {
    client.logger.info(`Processing ${roleProperty} for single user with ID ${userId} on ${discordServer.guildName} (${discordServer.guildId}). ${removeInvalid ? 'R' : 'Not r'}emoving invalid role assignments. Processing a total of ${expectedRoleAssignments.length} roles that should be assigned.`);
    const roles = await this.getRoles(client, discordServer.guildId, roleProperty);
    const rolesToUsers = this.createRolesToUsersMap(discordServer, roles, expectedRoleAssignments);
    if (removeInvalid && (discordServer.premium || roles.length <= 1)) {
      await this.removeInvalidRolesFromMember(discordServer, roleProperty, roles, guildForAssignments, rolesToUsers, client, userId);
    }
    await this.addMissingMembersToRole(discordServer, roleProperty, guildForAssignments, rolesToUsers, client);
  },
  async getRoles(client, guildId, roleProperty) {
    if (roleProperty === 'delegatorRoles') {
      return client.services.discordserver.listDelegatorRoles(guildId);
    }
    if (roleProperty === 'whitelistRoles') {
      const whitelists = await client.services.discordserver.listWhitelists(guildId);
      return whitelists.filter((whitelist) => !!whitelist.awardedRole).map((whitelist) => ({ roleId: whitelist.awardedRole }));
    }
    return client.services.discordserver.listTokenOwnershipRoles(guildId);
  },
  createRolesToUsersMap(discordServer, roles, roleAssignments) {
    const rolesToUsers = {};
    roles.forEach((roleMapping) => { rolesToUsers[roleMapping.roleId] = []; });
    roleAssignments.forEach((roleAssignment) => {
      if (roleAssignment.guildId === discordServer.guildId) {
        const listForRole = rolesToUsers[roleAssignment.roleId] ?? [];
        listForRole.push(roleAssignment.userId);
        rolesToUsers[roleAssignment.roleId] = listForRole;
      }
    });
    return rolesToUsers;
  },
  /*
   * Remove roles from individual user they do not qualify any more for
   */
  async removeInvalidRolesFromMember(discordServer, roleProperty, roles, guildForAssignments, rolesToUsers, client, userId) {
    try {
      const member = await guildForAssignments.members.fetch(userId);
      for (let r = 0, len = roles.length; r < len; r += 1) {
        const roleMapping = roles[r];
        const guildRole = await guildForAssignments.roles.fetch(roleMapping.roleId);
        if (guildRole) {
          if (!rolesToUsers[roleMapping.roleId].includes(member.user.id) && member.roles.cache.some((role) => role.id === roleMapping.roleId)) {
            client.logger.info(`Removing ${roleProperty} ${guildRole.name} from member ${member.user.tag} (${member.user.id}) on discord server ${discordServer.guildName}`);
            try {
              await member.roles.remove(guildRole);
            } catch (error) {
              client.logger.error({ msg: `Failed to remove ${roleProperty} ${guildRole.name} from member ${member.user.tag} (${member.user.id}) on discord server ${discordServer.guildName}`, error });
            }
          }
        } else {
          client.logger.info(`No role with ID ${roleMapping.roleId} found on discord server ${discordServer.guildName} while removing roles from individual member`);
        }
      }
    } catch (error) {
      client.logger.error({ msg: `Failed fetching member ${userId} for ${discordServer.guildName} (${discordServer.guildId})`, error });
    }
  },
  async removeInvalidMembersFromRole(discordServer, roleProperty, roles, guildForAssignments, rolesToUsers, client) {
    try {
      // TODO - add paging - but how to get the member count to page by?
      const allUsers = await guildForAssignments.members.fetch();
      for (let r = 0, len = roles.length; r < len; r += 1) {
        const roleMapping = roles[r];
        const guildRole = await guildForAssignments.roles.fetch(roleMapping.roleId);
        if (guildRole) {
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
        } else {
          client.logger.info(`No role with ID ${roleMapping.roleId} found on discord server ${discordServer.guildName} while removing members from role`);
        }
      }
    } catch (error) {
      client.logger.error({ msg: `Failed fetching members of ${discordServer.guildName} (${discordServer.guildId})`, error });
    }
  },
  async addMissingMembersToRole(discordServer, roleProperty, guildForAssignments, rolesToUsers, client) {
    const rolesToUsersList = Object.entries(rolesToUsers);
    for (let i = 0, len = rolesToUsersList.length; i < len; i += 1) {
      const [roleId, roleList] = rolesToUsersList[i];
      const guildRole = await guildForAssignments.roles.fetch(roleId);
      if (guildRole) {
        for (let j = 0, len2 = roleList.length; j < len2; j += 1) {
          const userIdToAssignRole = roleList[j];
          try {
            const member = await guildForAssignments.members.fetch(userIdToAssignRole);
            if (!member?.roles.cache.some((role) => role.id === roleId)) {
              client.logger.info(`Adding ${roleProperty} ${guildRole.name} to member ${member.user.tag} (${member.user.id}) on discord server ${discordServer.guildName}`);
              try {
                await member.roles.add(guildRole);
              } catch (error) {
                client.logger.error({ msg: `Failed to add ${roleProperty} ${guildRole.name} to member ${member.user.tag} (${member.user.id}) on discord server ${discordServer.guildName}`, error });
              }
            }
          } catch (e) {
            client.logger.info(`No member with ID ${userIdToAssignRole} found on discord server ${discordServer.guildName} (${discordServer.guildId}). Unlinking user to avoid further attempts.`);
            const externalAccount = await client.services.externalaccounts.getExternalDiscordAccount(userIdToAssignRole);
            if (externalAccount !== null) {
              await client.services.discordserver.disconnectExternalAccount(discordServer.guildId, externalAccount.id, true);
            }
          }
        }
      } else {
        client.logger.info(`No role with ID ${roleId} found on discord server ${discordServer.guildName} while adding members to role`);
      }
    }
  },
  getEligibleAndMissingRoles(roleAssignments, member, locale, phraseComponent) {
    const missingRoleAssignments = roleAssignments.filter((roleAssignment) => !member.roles.cache.some((role) => role.id === roleAssignment.roleId));
    let missingRoleField = null;
    if (missingRoleAssignments.length) {
      const missingRoleData = missingRoleAssignments.map((roleAssignment) => i18n.__({ phrase: `configure.${phraseComponent}.test.roleEntry`, locale }, { roleId: roleAssignment.roleId })).join('\n');
      missingRoleField = {
        name: i18n.__({ phrase: `configure.${phraseComponent}.test.missingRolesTitle`, locale }),
        value: i18n.__({ phrase: `configure.${phraseComponent}.test.missingRoles`, locale }, { roleData: missingRoleData }),
      };
    }
    const roleData = roleAssignments.map((roleAssignment) => i18n.__({ phrase: `configure.${phraseComponent}.test.roleEntry`, locale }, { roleId: roleAssignment.roleId })).join('\n');
    return { roleData, missingRoleField };
  },
};
