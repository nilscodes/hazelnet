/* eslint-disable no-await-in-loop */
const i18n = require('i18n');
const wait = require('util').promisify(setTimeout);
const embedBuilder = require('../../utility/embedbuilder');
const adahandle = require('../../utility/adahandle');
const cardanoaddress = require('../../utility/cardanoaddress');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const addressOrHandle = interaction.options.getString('address-or-handle');
      let addressToVerify = null;
      let handle = null;
      if (adahandle.isHandle(addressOrHandle)) {
        handle = addressOrHandle;
        addressToVerify = await interaction.client.services.cardanoinfo.resolveHandle(handle);
      } else {
        addressToVerify = addressOrHandle;
      }
      if (cardanoaddress.isStakedAddress(addressToVerify)) {
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

        try {
          const verification = await interaction.client.services.verifications.createVerificationRequest(externalAccount.id, addressToVerify);
          const maxVerificationWaitTimeInMinutes = await interaction.client.services.globalsettings.getGlobalSetting('VERIFICATION_TIMEOUT_MINUTES') || 15;
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.add.verificationRequest', locale: useLocale }, { verification, amount: verification.amount / 1000000, maxTime: maxVerificationWaitTimeInMinutes }));
          await interaction.editReply({ embeds: [embed], ephemeral: true });
          for (let i = 0; i < +maxVerificationWaitTimeInMinutes; i += 1) {
            await wait(60000);
            const verificationStatus = await interaction.client.services.verifications.getVerification(verification.id);
            if (verificationStatus.confirmed) {
              await interaction.client.services.discordserver.connectExternalAccount(interaction.guild.id, externalAccount.id);
              const successEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.add.verificationSuccess', locale: useLocale }, { verification: verificationStatus }));
              await interaction.followUp({ embeds: [successEmbed], ephemeral: true });
              return;
            }
            if (verification.obsolete) {
              return;
            }
            const waitEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.add.verificationWaiting', locale: useLocale }));
            await interaction.followUp({ embeds: [waitEmbed], ephemeral: true });
          }
          const failureEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale: useLocale }), i18n.__({ phrase: 'verify.add.verificationFailure', locale: useLocale }));
          await interaction.followUp({ embeds: [failureEmbed], ephemeral: true });
        } catch (verificationError) {
          let errorMessage = 'verify.add.verificationFailure';
          switch (verificationError.response?.status) {
            case 404:
              errorMessage = 'verify.add.verificationInvalidAddress';
              break;
            case 409:
              errorMessage = 'verify.add.verificationWalletInUse';
              break;
            default:
              break;
          }
          const failureEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale: useLocale }), i18n.__({ phrase: errorMessage, locale: useLocale }, { address: addressToVerify }));
          await interaction.followUp({ embeds: [failureEmbed], ephemeral: true });
        }
      } else {
        const addressError = handle !== null ? 'verify.add.verificationInvalidHandle' : 'verify.add.verificationInvalidAddress';
        const failureEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale: useLocale }), i18n.__({ phrase: addressError, locale: useLocale }, {
          address: addressOrHandle,
          handle,
          resolveText: (addressToVerify === null ? i18n.__({ phrase: 'verify.add.resolveFailure', locale: useLocale }) : i18n.__({ phrase: 'verify.add.resolveSuccess', locale: useLocale }, { resolvedAddress: addressToVerify })),
        }));
        await interaction.editReply({ embeds: [failureEmbed], ephemeral: true });
      }
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
