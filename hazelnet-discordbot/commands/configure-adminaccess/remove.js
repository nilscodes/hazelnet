const i18n = require('i18n');
const commandpermissions = require('../../utility/commandpermissions');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const adminRoleToRemove = interaction.options.getRole('admin-role');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();

      const adminRoleIds = (discordServer?.settings?.ADMIN_ROLES?.split(',')) ?? [];
      if (adminRoleIds.includes(adminRoleToRemove.id)) {
        const guild = await interaction.client.guilds.fetch(discordServer.guildId);
        const guildRoles = await guild.roles.fetch();

        const newAdminRoleList = adminRoleIds
          .filter((roleId) => roleId !== adminRoleToRemove.id) // Remove the role that we want to remove
          .filter((roleId) => (guildRoles.some((guildRole) => (guildRole.id === roleId)))); // Filter out non-existent roles while we're updating anyway

        const member = await guild.members.fetch(interaction.user.id);
        const currentUserHasAdminRoleAfterRemoval = member.roles.cache.some((role) => (newAdminRoleList.includes(role.id)));
        if (currentUserHasAdminRoleAfterRemoval) {
          await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild.id, 'ADMIN_ROLES', newAdminRoleList.join(','));
          discordServer.settings.ADMIN_ROLES = newAdminRoleList.join(',');
          await commandpermissions.setSlashCommandPermissions(interaction.client, interaction.guild.id, discordServer);
          const adminFields = [{
            name: i18n.__({ phrase: 'configure.adminaccess.list.administratorTitle', locale: useLocale }),
            value: newAdminRoleList.map((roleId) => (i18n.__({ phrase: 'configure.adminaccess.list.administratorEntry', locale: useLocale }, { roleId }))).join('\n'),
          }];
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-adminaccess remove', i18n.__({ phrase: 'configure.adminaccess.remove.success', locale: useLocale }, { roleId: adminRoleToRemove.id }), 'configure-adminaccess-remove', adminFields);
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-adminaccess remove', i18n.__({ phrase: 'configure.adminaccess.remove.cannotRemoveLastAdminRole', locale: useLocale }, { roleId: adminRoleToRemove.id }), 'configure-adminaccess-remove');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-adminaccess remove', i18n.__({ phrase: 'configure.adminaccess.remove.notExists', locale: useLocale }, { roleId: adminRoleToRemove.id }), 'configure-adminaccess-remove');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while changing admin access list.', ephemeral: true });
    }
  },
};
