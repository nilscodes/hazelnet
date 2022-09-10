const i18n = require('i18n');
import { ContextMenuCommandBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { BotCommand } from "src/utility/commandtypes";
const commandbase = require('../utility/commandbase');
const CommandTranslations = require('../utility/commandtranslations');
const embedBuilder = require('../utility/embedbuilder');
const adahandle = require('../utility/adahandle');
const cardanoaddress = require('../utility/cardanoaddress');

interface WhoisCommand extends BotCommand {
  applyHandleBranding(embed: any): void
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
  getContextMenuData(locale) {
    const ci18n = new CommandTranslations('whois', locale);
    return new ContextMenuCommandBuilder()
      .setName('Show ADA Handle')
      .setType(2); // ApplicationCommandType.User does not work work due to TypeScript being weird
  },
  commandTags: ['handle'],
  augmentPermissions: commandbase.augmentPermissionsUser,
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild?.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const knownMarketplaces = JSON.parse(await interaction.client.services.globalsettings.getGlobalSetting('KNOWN_MARKETPLACE_ADDRESSES')) ?? {};
      const addressOrHandle = interaction.options.getString('address-or-handle');
      let resolvedAddress = null;
      let handle = null;
      let resolvedHandle = null;
      if (adahandle.isHandle(addressOrHandle)) {
        handle = addressOrHandle;
        resolvedHandle = await interaction.client.services.cardanoinfo.resolveHandle(handle);
        resolvedAddress = resolvedHandle.address;
      } else if (cardanoaddress.isWalletAddress(addressOrHandle)) {
        resolvedAddress = addressOrHandle;
      }
      // WHOIS actions:
      // resolve address -> no handle found
      // resolve address -> one or more handles found
      if (handle === null && resolvedAddress === null) {
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
          const assetNameHex = handle.substring(1).split('').map((c: string) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
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
          embed.setImage(resolvedHandle.image);
          this.applyHandleBranding(embed);
          await interaction.editReply({ embeds: [embed] });
        }
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [] });
      await interaction.followUp({ content: 'Error while getting poll list. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeUserContextMenu(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild?.id);
    const locale = discordServer.getBotLanguage();
    const externalAccountOfTarget = await interaction.client.services.externalaccounts.getExternalDiscordAccount(interaction.targetUser.id);
    if (externalAccountOfTarget) {
      const mainAccountOfTarget = await interaction.client.services.externalaccounts.getAccountForExternalAccount(externalAccountOfTarget.id);
      const handle = mainAccountOfTarget.settings['DEFAULT_HANDLE'];
      if (handle) {
        const resolvedHandle = await interaction.client.services.cardanoinfo.resolveHandle(handle);
        const resolvedAddress = resolvedHandle.address;
        // xxx WHERE IS THE HANDLE IMAGE - add to resolution!
        // yyy change default logo to handle for this command!
        const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'whois.messageTitle', locale }), i18n.__({ phrase: 'whois.handleResolvedSuccessForUser', locale }, { handle, resolvedAddress, user: interaction.targetUser.id }), 'whois', [{
          name: i18n.__({ phrase: 'whois.handleFoundTitle', locale }),
          value: i18n.__({ phrase: 'whois.handleFoundText', locale }, { handleWithoutPrefix: handle.substring(1) }),
        }]);
        this.applyHandleBranding(embed);
        embed.setImage(resolvedHandle.image);
        await interaction.editReply({ embeds: [embed] });
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
  }
};