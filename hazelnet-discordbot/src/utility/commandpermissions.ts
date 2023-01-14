/* eslint-disable no-await-in-loop */
import { ApplicationCommandPermissionType, Guild } from "discord.js";
import HazelnetClient from "./hazelnetclient";
import { DiscordServer } from "./sharedtypes";

export default {
  userCommands: ['verify', 'info', 'policyid', 'whitelist', 'vote', 'claim', 'premium', 'help'],
  adminCommands: ['start', 'configure-adminaccess', 'configure-delegatorroles', 'configure-policy', 'configure-poll', 'configure-stakepool', 'configure-protection', 'configure-tokenroles', 'configure-whitelist', 'configure-settings', 'configure-api', 'configure-premium', 'configure-healthcheck', 'configure-social', 'configure-giveaway', 'configure-marketplace', 'configure-info'],
  async setSlashCommandPermissions(client: HazelnetClient, guildId: string, discordServer: DiscordServer) {
    const guild = await client.guilds.fetch(guildId);
    if (guild && discordServer) {
      const commands = await this.getCommands(guild);
      for (let i = 0; i < commands.size; i += 1) {
        const command = commands.at(i)!;
        const permissions = this.buildPermissionListForCommand(guild, discordServer, command);
        client.logger.info({ msg: `Registering the following command permissions for command ${command.name}`, permissions });
        await command.permissions.set({ permissions } as any);
      }
    }
  },
  async getCommands(guild: Guild) {
    return guild.commands.fetch();
  },
  buildPermissionListForCommand(guild: Guild, discordServer: DiscordServer, command: any) {
    const permissions = [{
      type: ApplicationCommandPermissionType.User,
      id: guild.ownerId,
      permission: true,
    }];
    if (command.name === 'somersault' && (discordServer.guildId === '717264144759390238' || discordServer.guildId === '888447259895791667')) {
      permissions.push(...[{
        type: ApplicationCommandPermissionType.User,
        id: '687870760219574300',
        permission: true,
      }, {
        type: ApplicationCommandPermissionType.User,
        id: '890235844840030308',
        permission: true,
      }, {
        type: ApplicationCommandPermissionType.User,
        id: '797345338775044096',
        permission: true,
      }]);
    }
    const adminRoleIds = (discordServer?.settings?.ADMIN_ROLES?.split(',')) ?? [];
    if (adminRoleIds.length && (this.adminCommands.includes(command.name) || this.userCommands.includes(command.name))) {
      permissions.push(...adminRoleIds.map((roleId) => ({
        type: ApplicationCommandPermissionType.Role,
        id: roleId,
        permission: true,
      })));
    }
    return permissions;
  },
  async isBotAdmin(discordServer: DiscordServer, client: HazelnetClient, userId: string) {
    const adminRoleIds = discordServer.settings?.ADMIN_ROLES?.split(',');
    return this.userHasOneOfRoles(discordServer, client, userId, adminRoleIds);
  },
  async isBotUser(discordServer: DiscordServer, client: HazelnetClient, userId: string) {
    const userRoleIds = discordServer.settings?.USER_ROLES?.split(',');
    return this.userHasOneOfRoles(discordServer, client, userId, userRoleIds);
  },
  async userHasOneOfRoles(discordServer: DiscordServer, client: HazelnetClient, userId: string, roleIds: string[]) {
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
