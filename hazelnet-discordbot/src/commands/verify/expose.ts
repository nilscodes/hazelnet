import i18n from 'i18n';
import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder,
} from 'discord.js';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';
import wallet from '../../utility/wallet';
import verifyutil from '../../utility/verify';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const mainAccount = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccount.id);
      if (mainAccount.settings?.BLACKLISTED !== 'true') {
        const walletExposureRecommended = discordServer.settings?.EXPOSE_WALLETS_RECOMMENDED === 'true';
        if (walletExposureRecommended) {
          const exposedWallets = await interaction.client.services.externalaccounts.getExternalAccountExposedWallets(externalAccount.id, discordServer.guildId);
          const verifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);
          const exposedVerifications = verifications.filter((v) => exposedWallets.some((exposedWallet) => exposedWallet.verificationId === v.id));
          const exposedWalletsField = {
            name: i18n.__({ phrase: 'verify.expose.status', locale }),
            value: `${i18n.__({ phrase: 'verify.expose.exposedWalletsNone', locale })}`,
          };
          if (exposedVerifications.length) {
            const walletInfo = await wallet.getWalletRegisterOptions(interaction.client.services.cardanoinfo, exposedVerifications, '');
            const exposedWalletListText = walletInfo.map((walletEntry) => i18n.__({ phrase: 'verify.add.exposedEntry', locale }, { exposedEntry: walletEntry.label })).join('\n');
            exposedWalletsField.value = `${i18n.__({ phrase: 'verify.expose.exposedWallets', locale })}\n\n${exposedWalletListText}`;
          }
          await interaction.client.services.discordserver.connectExternalAccount(interaction.guild!.id, externalAccount.id);
          const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'verify.expose.messageTitle', locale }), i18n.__({ phrase: 'verify.expose.purpose', locale }), 'verify-expose', [exposedWalletsField]);
          const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('verify/expose/exposewallets')
                .setLabel(i18n.__({ phrase: 'verify.expose.changeExposedWalletsButton', locale }))
                .setStyle(ButtonStyle.Primary),
            )];
          await interaction.editReply({ embeds: [embed], components });
        } else {
          await interaction.client.services.externalaccounts.deleteExternalAccountExposedWallets(externalAccount.id, discordServer.guildId);
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.expose.messageTitle', locale }), i18n.__({ phrase: 'verify.expose.purpose', locale }), 'verify-expose', [{
            name: i18n.__({ phrase: 'verify.expose.status', locale }),
            value: i18n.__({ phrase: 'verify.expose.noWalletExposureSupported', locale }),
          }]);
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.add.blacklistedTitle', locale }), i18n.__({ phrase: 'verify.add.blacklisted', locale }), 'verify-expose');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while linking your account.' });
    }
  },
  async executeButton(interaction) {
    await interaction.deferUpdate();
    if (interaction.customId === 'verify/expose/exposewallets') {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const existingVerifications = await interaction.client.services.externalaccounts.getActiveVerificationsForExternalAccount(externalAccount.id);
      const existingConfirmedVerifications = existingVerifications.filter((verification) => verification.confirmed && !verification.obsolete);

      if (existingConfirmedVerifications.length) {
        const currentMembers = await interaction.client.services.discordserver.listExternalAccounts(interaction.guild!.id);
        const currentMemberData = currentMembers.find((member) => member.externalAccountId === externalAccount.id);
        if (currentMemberData) {
          const instructions = i18n.__({ phrase: 'verify.add.walletExposureRecommended', locale });
          const { serverMessageField, components } = await verifyutil.getWalletExposeInteractionComponents(interaction.client.services.cardanoinfo, interaction.guild!.name, existingConfirmedVerifications, externalAccount, discordServer);
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.expose.messageTitle', locale }), instructions, 'verify-expose', [serverMessageField]);
          await interaction.editReply({ embeds: [embed], components });
        } else {
          await interaction.client.services.externalaccounts.deleteExternalAccountExposedWallets(externalAccount.id, discordServer.guildId);
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.expose.messageTitle', locale }), i18n.__({ phrase: 'verify.expose.notLinked', locale }), 'verify-expose');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'verify.expose.messageTitle', locale }), i18n.__({ phrase: 'verify.expose.noVerifications', locale }), 'verify-expose');
        await interaction.editReply({ embeds: [embed], components: [] });
      }
    }
  },
};
