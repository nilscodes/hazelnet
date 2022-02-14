const i18n = require('i18n');
const commandpermissions = require('../../utility/commandpermissions');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const newAdminRole = interaction.options.getRole('admin-role');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();

      const adminRoleIds = (discordServer?.settings?.ADMIN_ROLES?.split(',')) ?? [];
      if (!adminRoleIds.includes(newAdminRole.id)) {
        const guild = await interaction.client.guilds.fetch(discordServer.guildId);
        const guildRoles = await guild.roles.fetch();
        adminRoleIds.push(newAdminRole.id); // Add the new role
        const newAdminRoleList = adminRoleIds.filter((roleId) => (guildRoles.some((guildRole) => (guildRole.id === roleId)))); // Filter out non-existent roles while we're updating anyway
        await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild.id, 'ADMIN_ROLES', newAdminRoleList.join(','));
        discordServer.settings.ADMIN_ROLES = newAdminRoleList.join(',');
        await commandpermissions.setSlashCommandPermissions(interaction.client, interaction.guild.id, discordServer);
        const adminFields = [{
          name: i18n.__({ phrase: 'configure.adminaccess.list.administratorTitle', locale: useLocale }),
          value: newAdminRoleList.map((roleId) => (i18n.__({ phrase: 'configure.adminaccess.list.administratorEntry', locale: useLocale }, { roleId }))).join('\n'),
        }];
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-adminaccess add', i18n.__({ phrase: 'configure.adminaccess.add.success', locale: useLocale }, { roleId: newAdminRole.id }), 'configure-adminaccess-add', adminFields);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-adminaccess add', i18n.__({ phrase: 'configure.adminaccess.add.alreadyExists', locale: useLocale }, { roleId: newAdminRole.id }), 'configure-adminaccess-add');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while changing admin access list.', ephemeral: true });
    }
  },
};
