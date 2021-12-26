/* eslint-disable no-await-in-loop */
const i18n = require('i18n');
const wait = require('util').promisify(setTimeout);
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const addressToVerify = interaction.options.getString('address');
      const existingVerifications = await interaction.client.services.externalaccounts.getActiveVerificationsForDiscordAccount(externalAccount.id);
      const existingConfirmedVerification = existingVerifications.find((verification) => verification.confirmed && verification.address === addressToVerify);
      if (existingConfirmedVerification) {
        await interaction.client.services.discordserver.connectExternalAccount(interaction.guild.id, externalAccount.id);
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.add.alreadyVerified', locale: useLocale }, { verification: existingConfirmedVerification }));
        await interaction.editReply({ embeds: [embed], ephemeral: true });
        return;
      }
      const hasOutstandingVerifications = existingVerifications.some((verification) => !verification.confirmed && !verification.obsolete && verification.address === addressToVerify);
      if (hasOutstandingVerifications) {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.add.outstandingVerification', locale: useLocale }, { verification: existingConfirmedVerification }));
        await interaction.editReply({ embeds: [embed], ephemeral: true });
        return;
      }
      const verification = await interaction.client.services.verifications.createVerificationRequest(externalAccount.id, addressToVerify);
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.add.verificationRequest', locale: useLocale }, { verification, amount: verification.amount / 1000000 }));
      await interaction.editReply({ embeds: [embed], ephemeral: true });
      for (let i = 0; i < 14; i += 1) {
        await wait(60000);
        const verificationStatus = await interaction.client.services.verifications.getVerification(verification.id);
        if (verificationStatus.confirmed) {
          await interaction.client.services.discordserver.connectExternalAccount(interaction.guild.id, externalAccount.id);
          const successEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.add.verificationSuccess', locale: useLocale }, { verification: verificationStatus }));
          await interaction.followUp({ embeds: [successEmbed], ephemeral: true });
          return;
        }
        const waitEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.add.verificationWaiting', locale: useLocale }));
        await interaction.followUp({ embeds: [waitEmbed], ephemeral: true });
      }
      const failureEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.add.verificationFailure', locale: useLocale }));
      await interaction.followUp({ embeds: [failureEmbed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      if (interaction.deferred) {
        await interaction.editReply({ content: 'Error while verifying your account on this server.', ephemeral: true });
      } else {
        await interaction.followUp({ content: 'Error while verifying your account on this server.', ephemeral: true });
      }
    }
  },
};
