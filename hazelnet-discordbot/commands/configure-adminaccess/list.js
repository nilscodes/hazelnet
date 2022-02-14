const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();

      const adminRoleIds = (discordServer?.settings?.ADMIN_ROLES?.split(',')) ?? [];
      const adminFields = [{
        name: i18n.__({ phrase: 'configure.adminaccess.list.administratorTitle', locale: useLocale }),
        value: adminRoleIds.map((roleId) => (i18n.__({ phrase: 'configure.adminaccess.list.administratorEntry', locale: useLocale }, { roleId }))).join('\n'),
      }];
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-adminaccess list', i18n.__({ phrase: 'configure.adminaccess.list.purpose', locale: useLocale }), 'configure-adminaccess-list', adminFields);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting admin access list.', ephemeral: true });
    }
  },
};
