module.exports = {
  userCommands: ['verify', 'info', 'policyid', 'whitelist', 'help'],
  adminCommands: ['start', 'configure-adminaccess', 'configure-delegatorroles', 'configure-policy', 'configure-pool', 'configure-protection', 'configure-tokenroles', 'configure-useraccess', 'configure-whitelist', 'configure-api'],
  async setSlashCommandPermissions(client, guildId, discordServer) {
    const guild = await client.guilds.fetch(guildId);
    if (guild && discordServer) {
      const commands = await this.getCommands(client, guild);
      await commands.forEach(async (command) => {
        const permissions = this.buildPermissionListForCommand(guild, discordServer, command);
        client.logger.info({ msg: `Registering the following command permissions for command ${command.name}`, permissions });
        await command.permissions.set({ permissions });
      });
    }
  },
  async getCommands(client, guild) {
    const globalCommands = false;
    if (globalCommands) {
      return client.application?.commands.fetch();
    }
    return guild.commands.fetch();
  },
  buildPermissionListForCommand(guild, discordServer, command) {
    const permissions = [{
      type: 'USER',
      id: guild.ownerId,
      permission: true,
    }];
    const adminRoleIds = (discordServer?.settings?.ADMIN_ROLES?.split(',')) ?? [];
    if (adminRoleIds.length && (this.adminCommands.includes(command.name) || this.userCommands.includes(command.name))) {
      permissions.push(...adminRoleIds.map((roleId) => ({
        type: 'ROLE',
        id: roleId,
        permission: true,
      })));
    }
    const userRoleIds = (discordServer?.settings?.USER_ROLES?.split(',')) ?? [];
    if (userRoleIds.length && this.userCommands.includes(command.name)) {
      permissions.push(...userRoleIds.map((roleId) => ({
        type: 'ROLE',
        id: roleId,
        permission: true,
      })));
    }
    return permissions;
  },
  async isBotAdmin(discordServer, client, userId) {
    const adminRoleIds = discordServer.settings?.ADMIN_ROLES?.split(',');
    return this.userHasOneOfRoles(discordServer, client, userId, adminRoleIds);
  },
  async isBotUser(discordServer, client, userId) {
    const userRoleIds = discordServer.settings?.USER_ROLES?.split(',');
    return this.userHasOneOfRoles(discordServer, client, userId, userRoleIds);
  },
  async userHasOneOfRoles(discordServer, client, userId, roleIds) {
    if (roleIds.length) {
      const guildForAssignments = await client.guilds.fetch(discordServer.guildId);
      const member = await guildForAssignments.members.fetch(userId);
      if (member) {
        return member.roles.cache.some((role) => (roleIds.includes(role.id)));
      }
    }
    return false;
  },
};
