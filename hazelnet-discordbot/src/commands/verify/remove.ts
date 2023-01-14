import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const addressToRemove = interaction.options.getString('address');
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccount.id);
      if (mainAccount.settings?.BLACKLISTED !== 'true') {
        const verifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);

        await verifications.filter((verification) => verification.address === addressToRemove).forEach(async (verification) => {
          await interaction.client.services.verifications.removeVerification(verification.id!);
        });
        const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'verify.remove.messageTitle', locale }), i18n.__({ phrase: 'verify.remove.success', locale }, { address: addressToRemove } as any), 'verify-remove');
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.blacklistedTitle', locale }), i18n.__({ phrase: 'verify.add.blacklisted', locale }), 'verify-link');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while deleting your verification info.' });
    }
  },
};
