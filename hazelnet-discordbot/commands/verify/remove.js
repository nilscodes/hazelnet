const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const addressToRemove = interaction.options.getString('address');
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const verifications = await interaction.client.services.externalaccounts.getActiveVerificationsForDiscordAccount(externalAccount.id);

      await verifications.filter((verification) => verification.address === addressToRemove).forEach(async (verification) => {
        await interaction.client.services.verifications.removeVerification(verification.id);
      });
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.remove.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.remove.success', locale: useLocale }, { address: addressToRemove }), 'verify-remove');
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while deleting your verification info.', ephemeral: true });
    }
  },
};
