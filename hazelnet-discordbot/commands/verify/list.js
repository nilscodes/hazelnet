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

      const verificationInfoFields = [];
      const currentMembers = await interaction.client.services.discordserver.listExternalAccounts(interaction.guild.id);
      const currentMemberData = currentMembers.find((member) => member.externalAccountId === externalAccount.id);
      if (currentMemberData) {
        verificationInfoFields.push({ name: i18n.__({ phrase: 'verify.list.accountIsLinked', locale: useLocale }), value: i18n.__({ phrase: 'verify.list.accountIsLinkedInfo', locale: useLocale }) });
      } else {
        verificationInfoFields.push({ name: i18n.__({ phrase: 'verify.list.accountIsNotLinked', locale: useLocale }), value: i18n.__({ phrase: 'verify.list.accountIsNotLinkedInfo', locale: useLocale }) });
      }

      const relevantVerifications = verifications.filter((verification) => verification.confirmed || !verification.obsolete);
      if (relevantVerifications.length) {
        const confirmedVerifications = relevantVerifications.filter((verification) => verification.confirmed);
        if (confirmedVerifications.length) {
          verificationInfoFields.push(...confirmedVerifications.map((verification) => {
            const stakeShort = verification.cardanoStakeAddress.substr(0, 10);
            return {
              name: i18n.__({ phrase: 'verify.list.confirmedVerificationFor', locale: useLocale }, { stakeShort }),
              value: i18n.__({ phrase: 'verify.list.confirmedData', locale: useLocale }, { verification }),
            };
          }));
        }
        const outstandingVerifications = relevantVerifications.filter((verification) => !verification.confirmed);
        if (outstandingVerifications.length) {
          verificationInfoFields.push({
            name: i18n.__({ phrase: 'verify.list.outstandingVerifications', locale: useLocale }),
            value: outstandingVerifications.map((verification) => i18n.__({ phrase: 'verify.list.outstandingData', locale: useLocale }, { verification, amount: verification.amount / 1000000 })).join('\n\n'),
          });
        }
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.list.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.list.listVerificationsInfo', locale: useLocale }), verificationInfoFields);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.list.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.list.noVerifications', locale: useLocale }), verificationInfoFields);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting your verification info.', ephemeral: true });
    }
  },
};
