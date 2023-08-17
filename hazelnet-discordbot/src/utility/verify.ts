import i18n from 'i18n';
import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder, StringSelectMenuBuilder,
} from 'discord.js';
import {
  CardanoInfoApi, DiscordServer, ExternalAccount, Verification,
} from '@vibrantnet/core';
import wallet from './wallet';
import type Services from '../services';

export default {
  async getWalletExposeInteractionComponents(cardanoinfo: CardanoInfoApi, guildName: string, existingConfirmedVerifications: Verification[], externalAccount: ExternalAccount, discordServer: DiscordServer) {
    const locale = discordServer.getBotLanguage();
    const allWallets = await wallet.getWalletRegisterOptions(cardanoinfo, existingConfirmedVerifications, `${externalAccount.id}`);
    const wallets = allWallets.splice(0, 25);
    const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('verify/add/exposewallets')
          .setPlaceholder(i18n.__({ phrase: 'verify.add.chooseExpose', locale }))
          .addOptions(wallets)
          .setMaxValues(wallets.length),
      ), new ActionRowBuilder<MessageActionRowComponentBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('verify/add/exposewalletsconfirm')
          .setLabel(i18n.__({ phrase: 'verify.add.exposeAction', locale }))
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('verify/add/exposewalletsdeny')
          .setLabel(i18n.__({ phrase: 'verify.add.doNotExposeAction', locale }))
          .setStyle(ButtonStyle.Secondary),
      )];
    const walletExposureRecommendedText = discordServer.settings?.EXPOSE_WALLETS_RECOMMENDED_TEXT ?? i18n.__({ phrase: 'verify.add.walletExposureRecommendedNoDetails', locale });
    const serverMessageField = {
      name: i18n.__({ phrase: 'verify.add.walletExposureRecommendedTitle', locale }, { guildName }),
      value: `${walletExposureRecommendedText}\n\n${i18n.__({ phrase: 'verify.add.walletExposureSelect', locale })}`,
    };
    return { serverMessageField, components };
  },
  async completeExposeWalletsAction(services: typeof Services, discordServer: DiscordServer, walletsToExpose: string[], existingConfirmedVerifications: Verification[], externalAccount: ExternalAccount) {
    const locale = discordServer.getBotLanguage();
    const verificationIdsToExpose = walletsToExpose.map((walletToExpose) => +(walletToExpose.split('-')[1]));
    const verificationsToExpose = existingConfirmedVerifications.filter((verification) => verificationIdsToExpose.includes(verification.id!));
    await services.externalaccounts.deleteExternalAccountExposedWallets(externalAccount.id, discordServer.guildId); // First delete all existing exposed wallets
    const exposePromises = verificationsToExpose.map((verification) => services.verifications.addExposedWallet(verification.id!, {
      discordServerId: discordServer.id,
      verificationId: verification.id!,
    }));
    const exposedWallets = await Promise.all(exposePromises.map((p) => p.catch(() => undefined)));
    const affectedVerifications = existingConfirmedVerifications.filter((verification) => exposedWallets.some((exposedWallet) => exposedWallet?.verificationId === verification.id));
    const walletInfo = await wallet.getWalletRegisterOptions(services.cardanoinfo, affectedVerifications, '');
    const exposedWalletListText = walletInfo.map((walletEntry) => i18n.__({ phrase: 'verify.add.exposedEntry', locale }, { exposedEntry: walletEntry.label })).join('\n');
    return `${i18n.__({ phrase: 'verify.add.successConfirmExpose', locale })}\n\n${exposedWalletListText}`;
  },
};
