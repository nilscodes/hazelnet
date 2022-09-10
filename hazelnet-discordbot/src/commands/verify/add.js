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
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const addressOrHandle = interaction.options.getString('address-or-handle');
      let addressToVerify = null;
      let handle = null;
      if (adahandle.isHandle(addressOrHandle)) {
        handle = addressOrHandle;
        addressToVerify = (await interaction.client.services.cardanoinfo.resolveHandle(handle)).address;
      } else {
        addressToVerify = addressOrHandle;
      }
      if (cardanoaddress.isWalletAddress(addressToVerify)) {
        const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccount.id);
        if (mainAccount.settings?.BLACKLISTED !== 'true') {
          const walletInfo = await interaction.client.services.cardanoinfo.walletInfo(addressToVerify);
          const existingVerifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);
          const existingConfirmedVerification = existingVerifications
            .find((verification) => verification.confirmed && !verification.obsolete && (verification.address === addressToVerify || walletInfo?.stakeAddress === verification.cardanoStakeAddress));
          if (existingConfirmedVerification) {
            await interaction.client.services.discordserver.connectExternalAccount(interaction.guild.id, externalAccount.id);
            const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.alreadyVerified', locale }, { verification: existingConfirmedVerification, address: addressToVerify }), 'verify-add');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
          }
          const hasOutstandingVerifications = existingVerifications.some((verification) => !verification.confirmed && !verification.obsolete && verification.address === addressToVerify);
          if (hasOutstandingVerifications) {
            const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.outstandingVerification', locale }, { verification: existingConfirmedVerification }), 'verify-add');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
          }

          try {
            const verification = await interaction.client.services.verifications.createVerificationRequest(externalAccount.id, addressToVerify);
            const maxVerificationWaitTimeInMinutes = await interaction.client.services.globalsettings.getGlobalSetting('VERIFICATION_TIMEOUT_MINUTES') || 15;
            const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.verificationRequest', locale }, { verification, amount: verification.amount / 1000000, maxTime: maxVerificationWaitTimeInMinutes }), 'verify-add');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            for (let i = 0; i < 14; i += 1) {
              await wait(60000);
              const verificationStatus = await interaction.client.services.verifications.getVerification(verification.id);
              if (verificationStatus.confirmed) {
                await interaction.client.services.discordserver.connectExternalAccount(interaction.guild.id, externalAccount.id);
                const successEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.verificationSuccess', locale }, { verification: verificationStatus }), 'verify-add');
                await interaction.followUp({ embeds: [successEmbed], ephemeral: true });
                return;
              }
              if (verification.obsolete) {
                break;
              }
              const waitEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.verificationWaiting', locale }), 'verify-add');
              await interaction.followUp({ embeds: [waitEmbed], ephemeral: true });
            }
            if (maxVerificationWaitTimeInMinutes > 15) {
              // Connect the account so that if the verification goes through later, the account is properly linked
              await interaction.client.services.discordserver.connectExternalAccount(interaction.guild.id, externalAccount.id);
              const endEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.verificationMessageChainEnd', locale }), 'verify-add');
              await interaction.followUp({ embeds: [endEmbed], ephemeral: true });
            } else {
              const failureEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.verificationFailure', locale }), 'verify-add');
              await interaction.followUp({ embeds: [failureEmbed], ephemeral: true });
            }
          } catch (verificationError) {
            let errorMessage = 'verify.add.verificationFailure';
            switch (verificationError.response?.status) {
              case 404:
              case 500:
                errorMessage = 'verify.add.verificationInvalidAddress';
                break;
              case 409:
                errorMessage = 'verify.add.verificationWalletInUse';
                break;
              default:
                break;
            }
            const failureEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: errorMessage, locale }, { address: addressToVerify }), 'verify-add');
            await interaction.followUp({ embeds: [failureEmbed], ephemeral: true });
          }
        } else {
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.blacklistedTitle', locale }), i18n.__({ phrase: 'verify.add.blacklisted', locale }), 'verify-link');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const addressError = handle !== null ? 'verify.add.verificationInvalidHandle' : 'verify.add.verificationInvalidAddress';
        const failureEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: addressError, locale }, {
          address: addressOrHandle,
          handle,
          resolveText: (addressToVerify === null ? i18n.__({ phrase: 'verify.add.resolveFailure', locale }) : i18n.__({ phrase: 'verify.add.resolveSuccess', locale }, { resolvedAddress: addressToVerify })),
        }), 'verify-add');
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
  async executeButton(interaction) {
    if (interaction.customId === 'verify/add/widgetverify') {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const existingVerifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);
      const existingConfirmedVerifications = existingVerifications.filter((verification) => verification.confirmed && !verification.obsolete);
      const currentMembers = await interaction.client.services.discordserver.listExternalAccounts(interaction.guild.id);
      const currentMemberData = currentMembers.find((member) => member.externalAccountId === externalAccount.id);
      if (existingConfirmedVerifications.length) {
        if (!currentMemberData) {
          await interaction.client.services.discordserver.connectExternalAccount(interaction.guild.id, externalAccount.id);
        }
        const instructions = `${i18n.__({ phrase: 'verify.link.success', locale })}\n\n${i18n.__({ phrase: 'verify.add.widgetInstructionsAlreadyVerified', locale }, { verifiedWallets: existingConfirmedVerifications.length })}`;
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.link.messageTitle', locale }), instructions, 'verify-link');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const instructions = i18n.__({ phrase: 'verify.add.widgetInstructions', locale });
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), instructions, 'verify-add');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    }
  },
};
