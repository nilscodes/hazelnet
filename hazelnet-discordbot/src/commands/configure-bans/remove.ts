import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';
import banutils from '../../utility/bans';

export default <BotSubcommand> {
  async execute(interaction) {
    const banId = interaction.options.getInteger('ban-id', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id) ;
      const bans = await interaction.client.services.discordbans.listBans(interaction.guild!.id);;
      const locale = discordServer.getBotLanguage();
      const banToRemove = bans.find((ban) => ban.id === banId);
      if (banToRemove) {
        await interaction.client.services.discordbans.deleteBan(interaction.guild!.id, banToRemove.id);
        const bannedBy = await interaction.client.services.externalaccounts.getExternalDiscordAccountFromExternalAccountId(banToRemove.creator);
        const banFields = banutils.getBanDetailsFields(banToRemove, bannedBy, locale);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-bans remove', i18n.__({ phrase: 'configure.bans.remove.success', locale }), 'configure-bans-remove', banFields);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-bans remove', i18n.__({ phrase: 'configure.bans.remove.errorNotFound', locale }, { banId: `${banId}` }), 'configure-bans-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while removing ban from your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
