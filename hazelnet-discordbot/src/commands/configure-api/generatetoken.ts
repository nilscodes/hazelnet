import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const useLocale = discordServer.getBotLanguage();
      const accessToken = await interaction.client.services.discordserver.regenerateAccessToken(interaction.guild!.id);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-api generatetoken', i18n.__({ phrase: 'configure.api.generatetoken.success', locale: useLocale }, {
        accessToken,
        externalDocumentationUrl: 'http://info.hazelpool.com/hazelnet-external-api.yml',
      }), 'configure-api-generatetoken');
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while generating a new API access token. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
};
