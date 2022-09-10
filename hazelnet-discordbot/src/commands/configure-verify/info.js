const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-verify info', i18n.__({ phrase: 'configure.verify.info.purpose', locale }), 'configure-verify-info');
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting verification info. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
