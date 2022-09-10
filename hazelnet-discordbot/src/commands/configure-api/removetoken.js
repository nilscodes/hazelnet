const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      await interaction.client.services.discordserver.deleteAccessToken(interaction.guild.id);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-api removetoken', i18n.__({ phrase: 'configure.api.removetoken.success', locale: useLocale }), 'configure-api-removetoken');
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while deleting the API access token. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
