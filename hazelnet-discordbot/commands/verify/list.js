const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const verifications = await interaction.client.services.externalaccounts.getActiveVerificationsForDiscordAccount(externalAccount.id);
      const relevantVerifications = verifications.filter((verification) => verification.confirmed || !verification.obsolete);
      if (relevantVerifications.length) {
        const verificationFields = [];
        const confirmedVerifications = relevantVerifications.filter((verification) => verification.confirmed);
        if (confirmedVerifications.length) {
          verificationFields.push({
            name: i18n.__({ phrase: 'verify.list.confirmedVerifications', locale: useLocale }),
            value: confirmedVerifications.map((verification) => i18n.__({ phrase: 'verify.list.confirmedData', locale: useLocale }, { verification })).join('\n\n'),
          });
        }
        const outstandingVerifications = relevantVerifications.filter((verification) => !verification.confirmed);
        if (outstandingVerifications.length) {
          verificationFields.push({
            name: i18n.__({ phrase: 'verify.list.outstandingVerifications', locale: useLocale }),
            value: outstandingVerifications.map((verification) => i18n.__({ phrase: 'verify.list.outstandingData', locale: useLocale }, { verification, amount: verification.amount / 1000000 })).join('\n\n'),
          });
        }
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.list.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.list.listVerifications', locale: useLocale }), verificationFields);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.list.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.list.noVerifications', locale: useLocale }));
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting your verification info.', ephemeral: true });
    }
  },
};
