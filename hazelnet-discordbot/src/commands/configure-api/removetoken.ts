import i18n from 'i18n';
import { BotSubcommand } from 'src/utility/commandtypes';
const embedBuilder = require('../../utility/embedbuilder');

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild?.id);
      const useLocale = discordServer.getBotLanguage();
      await interaction.client.services.discordserver.deleteAccessToken(interaction.guild?.id);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-api removetoken', i18n.__({ phrase: 'configure.api.removetoken.success', locale: useLocale }), 'configure-api-removetoken');
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while deleting the API access token. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
