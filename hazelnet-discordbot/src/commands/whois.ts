import i18n from 'i18n';
import {
  ApplicationCommandType, AttachmentBuilder, ContextMenuCommandBuilder, SlashCommandBuilder,
} from 'discord.js';
import { cardanoaddress, adahandle } from '@vibrantnet/core';
import { BotCommand } from '../utility/commandtypes';
import { AugmentedCommandInteraction } from '../utility/hazelnetclient';
import cardanotoken from '../utility/cardanotoken';
import commandbase from '../utility/commandbase';
import CommandTranslations from '../utility/commandtranslations';
import embedBuilder from '../utility/embedbuilder';
import nftcdn from '../utility/nftcdn';

interface WhoisCommand extends BotCommand {
  applyHandleBranding(embed: any): void
  showAddressList(address: string, handlesAtAddress: any, successMessage: string, failureMessage: string, interaction: AugmentedCommandInteraction, discordServer: any): void
}

type HandleInfo = {
  handle: string
  address?: string,
  resolved: boolean,
  image?: string
}

export default <WhoisCommand> {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('whois', locale);
    const builder = new SlashCommandBuilder();
    builder.setName('whois')
      .setDescription(ci18n.description())
      .addStringOption((option) => option.setName('address-or-handle').setDescription(ci18n.option('address-or-handle')).setRequired(true));
    return builder;
  },
  getContextMenuData(_) {
    return new ContextMenuCommandBuilder()
      .setName('Show ADA Handle')
      .setType(ApplicationCommandType.User);
  },
  augmentPermissions: commandbase.augmentPermissionsUser,
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const knownMarketplaces = JSON.parse(await interaction.client.services.globalsettings.getGlobalSetting('KNOWN_MARKETPLACE_ADDRESSES')) ?? {};
      const addressOrHandle = interaction.options.getString('address-or-handle', true);
      let resolvedAddress = null;
      let stakeAddress = null;
      let handle = null;
      let resolvedHandle = null;
      if (adahandle.isHandle(addressOrHandle)) {
        handle = addressOrHandle;
        resolvedHandle = await interaction.client.services.cardanoinfo.resolveHandle(handle);
        resolvedAddress = resolvedHandle.address;
      } else if (cardanoaddress.isWalletAddress(addressOrHandle)) {
        resolvedAddress = addressOrHandle;
      } else if (cardanoaddress.isStakeAddress(addressOrHandle)) {
        stakeAddress = addressOrHandle;
      }
      if (handle === null && resolvedAddress === null && stakeAddress === null) {
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whois.messageTitle', locale }), i18n.__({ phrase: 'whois.noValidHandleOrAddress', locale }, { addressOrHandle }), 'whois');
        this.applyHandleBranding(embed);
        await interaction.editReply({ embeds: [embed] });
      } else if (handle !== null) {
        if (!resolvedAddress) {
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whois.messageTitle', locale }), i18n.__({ phrase: 'whois.noHandleFound', locale }, { handle }), 'whois', [{
            name: i18n.__({ phrase: 'whois.noHandleFoundMintTitle', locale }),
            value: i18n.__({ phrase: 'whois.noHandleFoundMintText', locale }),
          }]);
          this.applyHandleBranding(embed);
          await interaction.editReply({ embeds: [embed] });
        } else if (Object.prototype.hasOwnProperty.call(knownMarketplaces, resolvedAddress)) {
          const marketplaceKey = knownMarketplaces[resolvedAddress];
          const marketplaceName = i18n.__({ phrase: `marketplaces.${marketplaceKey}`, locale });
          const assetNameHex = cardanotoken.toHex(handle.substring(1));
          const marketplaceLink = `https://www.jpg.store/asset/f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a${assetNameHex}`;
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whois.messageTitle', locale }), i18n.__({ phrase: 'whois.handleOnSale', locale }, { handle, marketplaceName }), 'whois', [{
            name: i18n.__({ phrase: 'whois.handleOnSaleTitle', locale }),
            value: marketplaceLink,
          }]);
          this.applyHandleBranding(embed);
          await interaction.editReply({ embeds: [embed] });
        } else {
          const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whois.messageTitle', locale }), i18n.__({ phrase: 'whois.handleResolvedSuccess', locale }, { handle, resolvedAddress }), 'whois', [{
            name: i18n.__({ phrase: 'whois.handleFoundTitle', locale }),
            value: i18n.__({ phrase: 'whois.handleFoundText', locale }, { handleWithoutPrefix: handle.substring(1) }),
          }]);
          const { files, name } = await nftcdn.nftcdnBlob(resolvedHandle?.assetFingerprint!!, { size: 1024 })
          embed.setImage(name);
          this.applyHandleBranding(embed);
          await interaction.editReply({ embeds: [embed], files });
        }
      } else if (resolvedAddress) {
        const handlesAtWalletAddress = await interaction.client.services.cardanoinfo.handlesForWalletAddress(resolvedAddress);
        this.showAddressList(resolvedAddress, handlesAtWalletAddress, 'whois.handlesForWalletAddress', 'whois.handlesForWalletAddressNone', interaction, discordServer);
      } else if (stakeAddress) {
        const handlesAtStakeAddress = await interaction.client.services.cardanoinfo.handlesForStakeAddress(stakeAddress);
        this.showAddressList(stakeAddress, handlesAtStakeAddress, 'whois.handlesForStake', 'whois.handlesForStakeNone', interaction, discordServer);
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.followUp({ content: 'Error while getting whois information. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeUserContextMenu(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
    const locale = discordServer.getBotLanguage();
    const externalAccountOfTarget = await interaction.client.services.externalaccounts.getExternalDiscordAccount(interaction.targetUser.id);
    if (externalAccountOfTarget) {
      const mainAccountOfTarget = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccountOfTarget.id);
      const handle = mainAccountOfTarget.settings['DEFAULT_HANDLE'];
      if (handle) {
        const resolvedHandle = await interaction.client.services.cardanoinfo.resolveHandle(handle);
        const resolvedAddress = resolvedHandle.address;
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whois.messageTitle', locale }), i18n.__({ phrase: 'whois.handleResolvedSuccessForUser', locale }, { handle, resolvedAddress, user: interaction.targetUser.id } as any), 'whois', [{
          name: i18n.__({ phrase: 'whois.handleFoundTitle', locale }),
          value: i18n.__({ phrase: 'whois.handleFoundText', locale }, { handleWithoutPrefix: handle.substring(1) }),
        }]);
        this.applyHandleBranding(embed);
        const { files, name } = await nftcdn.nftcdnBlob(resolvedHandle.assetFingerprint!!, { size: 1024 })
        embed.setImage(name);
        await interaction.editReply({ embeds: [embed], files });
        return;
      }
    }
    const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whois.messageTitle', locale }), i18n.__({ phrase: 'whois.noDefaultHandle', locale }, { user: interaction.targetUser.id }), 'whois');
    this.applyHandleBranding(embed);
    await interaction.editReply({ embeds: [embed] });
  },
  applyHandleBranding(embed) {
    embed.setThumbnail('https://i.postimg.cc/QC0r2Kyq/Logo.png');
    embed.setColor('#00CE5A');
  },
  async showAddressList(address, handlesAtAddress, successMessage, failureMessage, interaction, discordServer) {
    const locale = discordServer.getBotLanguage();
    let content = i18n.__({ phrase: failureMessage, locale }, { address });
    let useImage = null;
    let useFiles: AttachmentBuilder[] = [];
    if (handlesAtAddress.length) {
      handlesAtAddress.sort((handleA: HandleInfo, handleB: HandleInfo) => handleA.handle.length - handleB.handle.length);
      const handleList = handlesAtAddress.map((handleInfo: HandleInfo) => i18n.__({ phrase: 'whois.handlesEntry', locale }, { handle: handleInfo.handle }));
      content = i18n.__({ phrase: successMessage, locale }, { address }) + handleList.join('\n');
      const multiAssetInfoForFirstHandle = await interaction.client.services.cardanoinfo.multiAssetInfo(process.env.HANDLE_POLICY!, cardanotoken.toHex(handlesAtAddress[0].handle));
      const { files, name } = await nftcdn.nftcdnBlob(multiAssetInfoForFirstHandle.assetFingerprint, { size: 1024 })
      useImage = name;
      useFiles = files;
    }
    const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whois.messageTitle', locale }), content, 'whois');
    this.applyHandleBranding(embed);
    if (useImage) {
      embed.setImage(useImage);
    }
    await interaction.editReply({ embeds: [embed], files: useFiles });
  }
};
