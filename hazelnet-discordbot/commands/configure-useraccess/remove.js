const i18n = require('i18n');
const commandpermissions = require('../../utility/commandpermissions');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const userRoleToRemove = interaction.options.getRole('user-role');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();

      const userRoleIds = (discordServer?.settings?.USER_ROLES?.split(',')) ?? [];
      if (userRoleIds.includes(userRoleToRemove.id)) {
        if (userRoleIds.length > 1) {
          const guild = await interaction.client.guilds.fetch(discordServer.guildId);
          const guildRoles = await guild.roles.fetch();

          const newUserRoleList = userRoleIds
            .filter((roleId) => roleId !== userRoleToRemove.id) // Remove the role that we want to remove
            .filter((roleId) => (guildRoles.some((guildRole) => (guildRole.id === roleId)))); // Filter out non-existent roles while we're updating anyway

          await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild.id, 'USER_ROLES', newUserRoleList.join(','));
          discordServer.settings.USER_ROLES = newUserRoleList.join(',');
          // await commandpermissions.setSlashCommandPermissions(interaction.client, interaction.guild.id, discordServer);
          const userFields = [{
            name: i18n.__({ phrase: 'configure.useraccess.list.userTitle', locale: useLocale }),
            value: newUserRoleList.map((roleId) => (i18n.__({ phrase: 'configure.useraccess.list.userEntry', locale: useLocale }, { roleId }))).join('\n'),
          }];
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-useraccess remove', i18n.__({ phrase: 'configure.useraccess.remove.success', locale: useLocale }, { roleId: userRoleToRemove.id }), 'configure-useraccess-remove', userFields);
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-useraccess remove', i18n.__({ phrase: 'configure.useraccess.remove.cannotRemoveLastUserRole', locale: useLocale }, { roleId: userRoleToRemove.id }), 'configure-useraccess-remove');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-useraccess remove', i18n.__({ phrase: 'configure.useraccess.remove.notExists', locale: useLocale }, { roleId: userRoleToRemove.id }), 'configure-useraccess-remove');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while changing user access list.', ephemeral: true });
    }
  },
};
