/* eslint-disable no-await-in-loop */
import i18n from 'i18n';
import NodeCache from 'node-cache';
import {
  Account, cardanoaddress, adahandle, DiscordServer, ExternalAccount, Verification,
  bitcoinaddress,
} from '@vibrantnet/core';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder } from 'discord.js';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';
import { AugmentedButtonInteraction } from '../../utility/hazelnetclient';
import verifyutil from '../../utility/verify';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const wait = require('util').promisify(setTimeout);

const baseUrl = process.env.VIBRANTNET_WEBSITE_URL || 'https://www.vibrantnet.io';

interface VerifyAddCommand extends BotSubcommand {
  cache: NodeCache
  confirmExposeWalletsDenied(interaction: AugmentedButtonInteraction, externalAccount: ExternalAccount, discordServer: DiscordServer): Promise<void>
  confirmExposeWalletsSuccess(interaction: AugmentedButtonInteraction, walletsToExpose: string[], existingConfirmedVerifications: Verification[], externalAccount: ExternalAccount, discordServer: DiscordServer): Promise<void>
}

function getWebsiteVerificationComponents(guildId: string, locale: string, buttonPhrase: string) {
  return [new ActionRowBuilder<MessageActionRowComponentBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setURL(`${baseUrl}/app/wallets?guildId=${guildId}`)
        .setLabel(i18n.__({ phrase: buttonPhrase, locale }))
        .setStyle(ButtonStyle.Link),
    )];
}

export default <VerifyAddCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const addressOrHandle = interaction.options.getString('address-or-handle', true);
      let addressToVerify: string;
      let handle = null;
      if (adahandle.isHandle(addressOrHandle)) {
        handle = addressOrHandle;
        addressToVerify = (await interaction.client.services.cardanoinfo.resolveHandle(handle)).address ?? '';
      } else {
        addressToVerify = addressOrHandle;
      }
      if (cardanoaddress.isWalletAddress(addressToVerify)) {
        const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccount.id) as Account;
        if (mainAccount.settings?.BLACKLISTED !== 'true') {
          const walletInfo = await interaction.client.services.cardanoinfo.walletInfo(addressToVerify);
          const existingVerifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);
          const existingConfirmedVerification = existingVerifications
            .find((verification) => verification.confirmed && !verification.obsolete && (verification.address === addressToVerify || walletInfo?.stakeAddress === verification.cardanoStakeAddress));
          if (existingConfirmedVerification) {
            await interaction.client.services.discordserver.connectExternalAccount(interaction.guild!.id, externalAccount.id);
            const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.alreadyVerified', locale }, { verification: existingConfirmedVerification, address: addressToVerify } as any), 'verify-add');
            await interaction.editReply({ embeds: [embed] });
            return;
          }
          const hasOutstandingVerifications = existingVerifications.some((verification) => !verification.confirmed && !verification.obsolete && verification.address === addressToVerify);
          if (hasOutstandingVerifications) {
            const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.outstandingVerification', locale }, { verification: existingConfirmedVerification } as any), 'verify-add');
            await interaction.editReply({ embeds: [embed] });
            return;
          }

          try {
            const verification = await interaction.client.services.verifications.createVerificationRequest(externalAccount.id, addressToVerify);
            const maxVerificationWaitTimeInMinutes = +(await interaction.client.services.globalsettings.getGlobalSetting('VERIFICATION_TIMEOUT_MINUTES')) || 15;
            const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.verificationRequest', locale }, { verification, amount: verification.amount / 1000000, maxTime: maxVerificationWaitTimeInMinutes } as any), 'verify-add');
            await interaction.editReply({ embeds: [embed] });
            for (let i = 0; i < 14; i += 1) {
              await wait(60000);
              const verificationStatus = await interaction.client.services.verifications.getVerification(verification.id!);
              if (verificationStatus.confirmed) {
                await interaction.client.services.discordserver.connectExternalAccount(interaction.guild!.id, externalAccount.id);
                const walletExposureRecommended = discordServer.settings?.EXPOSE_WALLETS_RECOMMENDED === 'true';
                if (walletExposureRecommended) {
                  const existingConfirmedVerifications = existingVerifications.filter((v) => v.confirmed && !v.obsolete);
                  existingConfirmedVerifications.push(verificationStatus);
                  const instructions = `${i18n.__({ phrase: 'verify.add.messageTitle', locale })}\n\n${i18n.__({ phrase: 'verify.add.verificationSuccess', locale }, { verification: verificationStatus } as any)}\n\n${i18n.__({ phrase: 'verify.add.walletExposureRecommended', locale })}`;
                  const { serverMessageField, components } = await verifyutil.getWalletExposeInteractionComponents(interaction.client.services.cardanoinfo, interaction.guild!.name, existingConfirmedVerifications, externalAccount, discordServer);
                  const successEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), instructions, 'verify-add', [serverMessageField]);
                  await interaction.followUp({ ephemeral: true, embeds: [successEmbed], components });
                } else {
                  const successEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.verificationSuccess', locale }, { verification: verificationStatus } as any), 'verify-add');
                  await interaction.followUp({ embeds: [successEmbed], ephemeral: true });
                }
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
              await interaction.client.services.discordserver.connectExternalAccount(interaction.guild!.id, externalAccount.id);
              const endEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.verificationMessageChainEnd', locale }), 'verify-add');
              await interaction.followUp({ embeds: [endEmbed], ephemeral: true });
            } else {
              const failureEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.verificationFailure', locale }), 'verify-add');
              await interaction.followUp({ embeds: [failureEmbed], ephemeral: true });
            }
          } catch (verificationError: any) {
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
            const failureEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: errorMessage, locale }, { address: addressToVerify } as any), 'verify-add');
            await interaction.followUp({ embeds: [failureEmbed], ephemeral: true });
          }
        } else {
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.blacklistedTitle', locale }), i18n.__({ phrase: 'verify.add.blacklisted', locale }), 'verify-link');
          await interaction.editReply({ embeds: [embed] });
        }
      } else if (bitcoinaddress.isTaprootAddress(addressToVerify)) {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: 'verify.add.bitcoinInstructions', locale }), 'verify-add');
        const components = getWebsiteVerificationComponents(interaction.guild!.id, locale, 'verify.add.widgetLinkButton');
        await interaction.editReply({ embeds: [embed], components });
      } else {
        const addressError = handle !== null ? 'verify.add.verificationInvalidHandle' : 'verify.add.verificationInvalidAddress';
        const failureEmbed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), i18n.__({ phrase: addressError, locale }, {
          address: addressOrHandle,
          handle,
          resolveText: (addressToVerify === null ? i18n.__({ phrase: 'verify.add.resolveFailure', locale }) : i18n.__({ phrase: 'verify.add.resolveSuccess', locale }, { resolvedAddress: addressToVerify } as any)),
        } as any), 'verify-add');
        await interaction.editReply({ embeds: [failureEmbed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      if (interaction.deferred) {
        await interaction.editReply({ content: 'Error while verifying your account on this server.' });
      } else {
        await interaction.followUp({ content: 'Error while verifying your account on this server.' });
      }
    }
  },
  async executeButton(interaction) {
    await interaction.deferUpdate();
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
    const locale = discordServer.getBotLanguage();
    const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
    const existingVerifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);
    const existingConfirmedVerifications = existingVerifications.filter((verification) => verification.confirmed && !verification.obsolete);
    const currentMembers = await interaction.client.services.discordserver.listExternalAccounts(interaction.guild!.id);
    const currentMemberData = currentMembers.find((member) => member.externalAccountId === externalAccount.id);

    if (interaction.customId === 'verify/add/widgetverify') {
      if (existingConfirmedVerifications.length) {
        if (!currentMemberData) {
          await interaction.client.services.discordserver.connectExternalAccount(interaction.guild!.id, externalAccount.id);
        }
        const walletExposureRecommended = discordServer.settings?.EXPOSE_WALLETS_RECOMMENDED === 'true';
        if (walletExposureRecommended) {
          const instructions = `${i18n.__({ phrase: 'verify.link.success', locale })}\n\n${i18n.__({ phrase: 'verify.add.walletExposureRecommended', locale })}`;
          const { serverMessageField, components } = await verifyutil.getWalletExposeInteractionComponents(interaction.client.services.cardanoinfo, interaction.guild!.name, existingConfirmedVerifications, externalAccount, discordServer);
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.link.messageTitle', locale }), instructions, 'verify-link', [serverMessageField]);
          await interaction.followUp({ ephemeral: true, embeds: [embed], components });
        } else {
          const instructions = `${i18n.__({ phrase: 'verify.link.success', locale })}\n\n${i18n.__({ phrase: 'verify.add.widgetInstructionsAlreadyVerified', locale }, { verifiedWallets: existingConfirmedVerifications.length } as any)}`;
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.link.messageTitle', locale }), instructions, 'verify-link');
          const components = getWebsiteVerificationComponents(interaction.guild!.id, locale, 'verify.add.widgetAddMoreWalletsButton');
          await interaction.followUp({ ephemeral: true, embeds: [embed], components });
        }
      } else {
        const instructions = i18n.__({ phrase: 'verify.add.widgetInstructions', locale });
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.messageTitle', locale }), instructions, 'verify-add');
        const components = getWebsiteVerificationComponents(interaction.guild!.id, locale, 'verify.add.widgetLinkButton');
        await interaction.followUp({ ephemeral: true, embeds: [embed], components });
      }
    } else if (interaction.customId === 'verify/add/exposewalletsconfirm' && currentMemberData /* Only expose linked users */) {
      const walletsToExpose = this.cache.take(`${interaction.guild!.id}-${interaction.user.id}`) as string[];
      if (walletsToExpose?.length) {
        await this.confirmExposeWalletsSuccess(interaction, walletsToExpose, existingConfirmedVerifications, externalAccount, discordServer);
      } else {
        await this.confirmExposeWalletsDenied(interaction, externalAccount, discordServer);
      }
    } else if (interaction.customId === 'verify/add/exposewalletsdeny') {
      await this.confirmExposeWalletsDenied(interaction, externalAccount, discordServer);
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'verify/add/exposewallets') {
      this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, interaction.values);
      await interaction.deferUpdate();
    }
  },
  async confirmExposeWalletsDenied(interaction, externalAccount, discordServer) {
    const locale = discordServer.getBotLanguage();
    await interaction.client.services.externalaccounts.deleteExternalAccountExposedWallets(externalAccount.id, discordServer.guildId);
    const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.link.messageTitle', locale }), i18n.__({ phrase: 'verify.add.successDenyExpose', locale }), 'verify-link');
    await interaction.editReply({ embeds: [embed], components: [] });
  },
  async confirmExposeWalletsSuccess(interaction, walletsToExpose, existingConfirmedVerifications, externalAccount, discordServer) {
    const locale = discordServer.getBotLanguage();
    const exposeText = await verifyutil.completeExposeWalletsAction(interaction.client.services, discordServer, walletsToExpose, existingConfirmedVerifications, externalAccount);
    const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.link.messageTitle', locale }), exposeText, 'verify-link');
    await interaction.editReply({ embeds: [embed], components: [] });
  },
};
