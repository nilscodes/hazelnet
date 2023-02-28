import { ActionRowBuilder, APIEmbedField, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder } from 'discord.js';
import i18n from 'i18n';
import { DiscordServer, ListingAnnouncement, Marketplace, MarketplaceChannel, MarketplaceLinkType, MintAnnouncement, SaleAnnouncement, SalesType, TokenPolicy } from './sharedtypes';
import { AugmentedCommandInteraction } from './hazelnetclient';
import cardanotoken from './cardanotoken';
import nftcdn, { NftCdnAttachment } from './nftcdn';
const punycode = require('punycode/');

export default {
  createSaleAnnouncementFields(saleAnnouncement: SaleAnnouncement, locale: string) {
    const fields = [];

    if (saleAnnouncement.type === SalesType.OFFER) {
      fields.push({
        name: i18n.__({ phrase: 'configure.marketplace.sales.announce.offerPrice', locale }),
        value: i18n.__({ phrase: 'configure.marketplace.sales.announce.soldForContent', locale }, { price: Math.ceil(saleAnnouncement.price / 1000000) } as any),
      });
    } else {
      fields.push({
        name: i18n.__({ phrase: 'configure.marketplace.sales.announce.soldFor', locale }),
        value: i18n.__({ phrase: 'configure.marketplace.sales.announce.soldForContent', locale }, { price: `${Math.ceil(saleAnnouncement.price / 1000000)}` }),
      });
    }

    fields.push({
      name: i18n.__({ phrase: 'configure.marketplace.sales.announce.marketplace', locale }),
      value: i18n.__({ phrase: `marketplaces.${saleAnnouncement.source}`, locale }),
    });

    if (saleAnnouncement.rarityRank) {
      fields.push({
        name: i18n.__({ phrase: 'configure.marketplace.sales.announce.rank', locale }),
        value: i18n.__({ phrase: 'configure.marketplace.sales.announce.rankContent', locale }, { rank: `${saleAnnouncement.rarityRank}` }),
        inline: true,
      });
    }
    this.addMetadataAttributeHighlightField(saleAnnouncement, fields);

    return fields;
  },
  getSaleAnnouncementTitle(saleAnnouncement: SaleAnnouncement, locale: string) {
    const displayName = this.getAugmentedDisplayName(saleAnnouncement.displayName);
    if (saleAnnouncement.type === SalesType.OFFER) {
      return i18n.__({ phrase: 'configure.marketplace.sales.announce.itemContentOffer', locale }, { displayName });
    }
    return i18n.__({ phrase: 'configure.marketplace.sales.announce.itemContentBuy', locale }, { displayName });
  },
  getAugmentedDisplayName(displayName: string): string {
    if (displayName.startsWith('$xn')) {
      return `${displayName} (${punycode.toUnicode(displayName.substring(1))})`;
    }
    return displayName;
  },
  getSaleAnnouncementComponents(discordServer: DiscordServer, saleAnnouncement: SaleAnnouncement) {
    const componentsToAdd = (discordServer.settings.SALES_TRACKER_BUTTONS?.split(',').filter((button) => button.trim() !== '') ?? [MarketplaceLinkType.MARKETPLACE, MarketplaceLinkType.PIXLPAGE, MarketplaceLinkType.CNFTJUNGLE]) as MarketplaceLinkType[];
    const components = componentsToAdd.map((linkType) => this.generateLink(linkType, saleAnnouncement, discordServer.getBotLanguage()));
    if (components.length) {
      return [new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(components)];
    }
    return [];
  },
  createListingAnnouncementFields(listingAnnouncement: ListingAnnouncement, locale: string) {
    const fields: APIEmbedField[] = [{
      name: i18n.__({ phrase: 'configure.marketplace.listings.announce.listedFor', locale }),
      value: i18n.__({ phrase: 'configure.marketplace.listings.announce.listedForContent', locale }, { price: `${Math.ceil(listingAnnouncement.price / 1000000)}` }),
    }];

    fields.push({
      name: i18n.__({ phrase: 'configure.marketplace.listings.announce.marketplace', locale }),
      value: i18n.__({ phrase: `marketplaces.${listingAnnouncement.source}`, locale }),
    });

    if (listingAnnouncement.rarityRank) {
      fields.push({
        name: i18n.__({ phrase: 'configure.marketplace.listings.announce.rank', locale }),
        value: i18n.__({ phrase: 'configure.marketplace.listings.announce.rankContent', locale }, { rank: `${listingAnnouncement.rarityRank}` }),
        inline: true,
      });
    }
    this.addMetadataAttributeHighlightField(listingAnnouncement, fields);

    return fields;
  },
  getListingAnnouncementTitle(listingAnnouncement: ListingAnnouncement, locale: string) {
    const displayName = this.getAugmentedDisplayName(listingAnnouncement.displayName);
    return i18n.__({ phrase: 'configure.marketplace.listings.announce.itemContentListed', locale }, { displayName });
  },
  getListingAnnouncementComponents(discordServer: DiscordServer, listingAnnouncement: ListingAnnouncement) {
    const componentsToAdd = (discordServer.settings.LISTINGS_TRACKER_BUTTONS?.split(',').filter((button) => button.trim() !== '') ?? [MarketplaceLinkType.MARKETPLACE, MarketplaceLinkType.PIXLPAGE, MarketplaceLinkType.CNFTJUNGLE]) as MarketplaceLinkType[]
    const components = componentsToAdd.map((linkType) => this.generateLink(linkType, listingAnnouncement, discordServer.getBotLanguage()));
    if (components.length) {
      return [new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(components)];
    }
    return [];
  },
  async prepareImageUrl(assetInfo: ListingAnnouncement | SaleAnnouncement | MintAnnouncement): Promise<NftCdnAttachment> {
    return nftcdn.nftcdnBlob(assetInfo.assetFingerprint, { size: 1024 });
  },
  generateLink(linkType: MarketplaceLinkType, linkData: ListingAnnouncement | SaleAnnouncement | MintAnnouncement, locale: string) {
    switch (linkType) {
      case MarketplaceLinkType.MARKETPLACE:
        return new ButtonBuilder()
          .setLabel(i18n.__({ phrase: 'configure.marketplace.general.viewOnMarketplace', locale }))
          .setURL((linkData as SaleAnnouncement).marketplaceAssetUrl)
          .setStyle(ButtonStyle.Link);
      case MarketplaceLinkType.PIXLPAGE:
        return new ButtonBuilder()
          .setLabel(i18n.__({ phrase: 'configure.marketplace.general.viewOnPixlPage', locale }))
          .setURL(`https://pixl.page/asset/${linkData.policyId}${linkData.assetNameHex}`)
          .setStyle(ButtonStyle.Link);
      case MarketplaceLinkType.CNFTJUNGLE:
        return new ButtonBuilder()
          .setLabel(i18n.__({ phrase: 'configure.marketplace.general.viewOnCnftJungle', locale }))
          .setURL(`https://www.cnftjungle.io/collections/${linkData.policyId}?assetId=${linkData.policyId}.${encodeURIComponent(linkData.assetName)}`)
          .setStyle(ButtonStyle.Link);
      case MarketplaceLinkType.POOLPMHANDLE:
        return new ButtonBuilder()
          .setLabel(i18n.__({ phrase: 'configure.marketplace.general.viewOnPoolPm', locale }))
          .setURL(`https://pool.pm/$${linkData.assetName}`)
          .setStyle(ButtonStyle.Link);
      case MarketplaceLinkType.POOLPM:
      default:
        return new ButtonBuilder()
          .setLabel(i18n.__({ phrase: 'configure.marketplace.general.viewOnPoolPm', locale }))
          .setURL(`https://pool.pm/${linkData.assetFingerprint}`)
          .setStyle(ButtonStyle.Link);
    }
  },
  createMintAnnouncementFields(mintAnnouncement: MintAnnouncement, locale: string) {
    const fields: APIEmbedField[] = [];

    if (mintAnnouncement.rarityRank) {
      fields.push({
        name: i18n.__({ phrase: 'configure.marketplace.mint.announce.rank', locale }),
        value: i18n.__({ phrase: 'configure.marketplace.mint.announce.rankContent', locale }, { rank: `${mintAnnouncement.rarityRank}` }),
        inline: true,
      });
    }
    this.addMetadataAttributeHighlightField(mintAnnouncement, fields);

    return fields;
  },
  getMintAnnouncementTitle(mintAnnouncement: MintAnnouncement, locale: string) {
    const displayName = this.getAugmentedDisplayName(mintAnnouncement.displayName);
    return i18n.__({ phrase: 'configure.marketplace.mint.announce.itemContentMint', locale }, { displayName });
  },
  getMintAnnouncementComponents(discordServer: DiscordServer, mintAnnouncement: MintAnnouncement) {
    const componentsToAdd = (discordServer.settings.MINT_TRACKER_BUTTONS?.split(',').filter((button) => button.trim() !== '') ?? [MarketplaceLinkType.PIXLPAGE, MarketplaceLinkType.CNFTJUNGLE]) as MarketplaceLinkType[];
    const components = componentsToAdd.map((linkType) => this.generateLink(linkType, mintAnnouncement, discordServer.getBotLanguage()));
    if (components.length) {
      return [new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(components)];
    }
    return [];
  },
  async getMarketplaceChannelOption(discordServer: DiscordServer, tokenPolicies: TokenPolicy[], marketplaceChannel: MarketplaceChannel, interaction: AugmentedCommandInteraction, subcommand: string) {
    const locale = discordServer.getBotLanguage();
    const projectName = this.getProjectName(tokenPolicies, marketplaceChannel);
    let announceChannel = null;
    try {
      announceChannel = await interaction.guild!.channels.fetch(marketplaceChannel.channelId);
    } catch (error) {
      // Channel deleted
    }
    const marketplaceNames = this.getMarketplaceNames(marketplaceChannel.marketplaces, locale, false);
    const channelName = announceChannel ? announceChannel.name : i18n.__({ phrase: `configure.marketplace.${subcommand}.remove.deletedChannel`, locale });
    let description = i18n.__({ phrase: `configure.marketplace.${subcommand}.remove.entry`, locale }, { channelName, marketplaceNames } as any);
    if (marketplaceChannel.type !== 'MINT' && marketplaceChannel.minimumValue) {
      description += i18n.__({ phrase: `configure.marketplace.${subcommand}.remove.entryAddon`, locale }, { minimumPriceAda: discordServer.formatNumber(Math.floor(marketplaceChannel.minimumValue / 1000000)) });
    }
    return {
      label: i18n.__({ phrase: `configure.marketplace.${subcommand}.remove.entryTitle`, locale }, { projectName, marketplaceChannel } as any).substring(0, 100),
      description: description.substring(0, 100),
      value: `marketplace-channel-id-${marketplaceChannel.id}`,
    };
  },
  getMarketplaceChannelDetailsField(discordServer: DiscordServer, tokenPolicies: TokenPolicy[], marketplaceChannel: MarketplaceChannel, mainTextSubAttribute: string, priceAddonSubCommand?: string): APIEmbedField {
    const subcommand = marketplaceChannel.type.toLowerCase();
    const locale = discordServer.getBotLanguage();
    const projectName = this.getProjectName(tokenPolicies, marketplaceChannel);
    const marketplaceNames = this.getMarketplaceNames(marketplaceChannel.marketplaces, locale);
    let content = i18n.__({ phrase: `configure.marketplace.${subcommand}.${mainTextSubAttribute}`, locale }, { projectName, marketplaceNames, channel: marketplaceChannel.channelId } as any);
    if (marketplaceChannel.type !== 'MINT') {
      if (marketplaceChannel.minimumValue) {
        content += ` ${i18n.__({ phrase: `configure.marketplace.${subcommand}.${priceAddonSubCommand}.minimumPriceAddon`, locale }, { minimumPriceAda: discordServer.formatNumber(Math.floor(marketplaceChannel.minimumValue / 1000000)) })}`;
      }
      if (marketplaceChannel.maximumValue) {
        content += ` ${i18n.__({ phrase: `configure.marketplace.${subcommand}.${priceAddonSubCommand}.maximumPriceAddon`, locale }, { maximumPriceAda: discordServer.formatNumber(Math.floor(marketplaceChannel.maximumValue / 1000000)) })}`;
      }
    }
    if (marketplaceChannel.filters?.length && marketplaceChannel.aggregationType) {
      content += cardanotoken.buildMetadataFilterContentText(marketplaceChannel.filters, marketplaceChannel.aggregationType, locale);
    }
    return {
      name: i18n.__({ phrase: `configure.marketplace.${subcommand}.list.entryTitle`, locale }, { projectName, marketplaceChannel } as any),
      value: content,
    };
  },
  getProjectName(tokenPolicies: TokenPolicy[], marketplaceChannel: MarketplaceChannel) {
    const projectData = tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === marketplaceChannel.policyId);
    return projectData ? projectData.projectName : marketplaceChannel.policyId;
  },
  addMetadataAttributeHighlightField(announcement: MintAnnouncement | SaleAnnouncement | ListingAnnouncement, fields: APIEmbedField[]) {
    if (announcement.highlightAttributeDisplayName) {
      fields.push({
        name: announcement.highlightAttributeDisplayName,
        value: announcement.highlightAttributeValue ?? '-',
        inline: true,
      });
    }
  },
  getMarketplaceNames(marketplaces: Marketplace[], locale: string, showAllMarketplaceNamesInsteadOfCatchAll: boolean = true): string {
    let useMarketplaces = marketplaces;
    if (showAllMarketplaceNamesInsteadOfCatchAll && marketplaces.find((marketplace) => marketplace === Marketplace.ALL_MARKETPLACES)) {
      useMarketplaces = [];
      for (const [_, value] of Object.entries(Marketplace)) {
        if (value !== Marketplace.ALL_MARKETPLACES && value !== Marketplace.MINT_ONCHAIN) {
          useMarketplaces.push(value);
        }
      }
    }
    return useMarketplaces.map((marketplaceKey) => i18n.__({ phrase: `marketplaces.${marketplaceKey}`, locale })).join(', ')
  }
};
