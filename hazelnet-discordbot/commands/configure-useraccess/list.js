const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();

      const userRoleIds = (discordServer?.settings?.USER_ROLES?.split(',')) ?? [];
      const userFields = [{
        name: i18n.__({ phrase: 'configure.useraccess.list.userTitle', locale: useLocale }),
        value: userRoleIds.map((roleId) => (i18n.__({ phrase: 'configure.useraccess.list.userEntry', locale: useLocale }, { roleId }))).join('\n'),
      }];
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-useraccess list', i18n.__({ phrase: 'configure.useraccess.list.purpose', locale: useLocale }), userFields);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting user access list.', ephemeral: true });
    }
  },
};
