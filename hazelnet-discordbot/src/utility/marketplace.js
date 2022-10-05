const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const i18n = require('i18n');
const CID = require('cids');
const cardanotoken = require('./cardanotoken');

module.exports = {
  createSaleAnnouncementFields(saleAnnouncement, locale) {
    const fields = [];

    if (saleAnnouncement.type === 'OFFER') {
      fields.push({
        name: i18n.__({ phrase: 'configure.marketplace.sales.announce.offerPrice', locale }),
        value: i18n.__({ phrase: 'configure.marketplace.sales.announce.soldForContent', locale }, { price: Math.ceil(saleAnnouncement.price / 1000000) }),
      });
    } else {
      fields.push({
        name: i18n.__({ phrase: 'configure.marketplace.sales.announce.soldFor', locale }),
        value: i18n.__({ phrase: 'configure.marketplace.sales.announce.soldForContent', locale }, { price: Math.ceil(saleAnnouncement.price / 1000000) }),
      });
    }

    fields.push({
      name: i18n.__({ phrase: 'configure.marketplace.sales.announce.marketplace', locale }),
      value: i18n.__({ phrase: `marketplaces.${saleAnnouncement.source}`, locale }),
    });

    if (saleAnnouncement.rarityRank) {
      fields.push({
        name: i18n.__({ phrase: 'configure.marketplace.sales.announce.rank', locale }),
        value: i18n.__({ phrase: 'configure.marketplace.sales.announce.rankContent', locale }, { rank: saleAnnouncement.rarityRank }),
        inline: true,
      });
    }
    this.addMetadataAttributeHighlightField(saleAnnouncement, fields);

    return fields;
  },
  getSaleAnnouncementTitle(saleAnnouncement, locale) {
    if (saleAnnouncement.type === 'OFFER') {
      return i18n.__({ phrase: 'configure.marketplace.sales.announce.itemContentOffer', locale }, saleAnnouncement);
    }
    return i18n.__({ phrase: 'configure.marketplace.sales.announce.itemContentBuy', locale }, saleAnnouncement);
  },
  getSaleAnnouncementComponents(discordServer, mintAnnouncement) {
    const componentsToAdd = discordServer.settings.SALES_TRACKER_BUTTONS?.split(',').filter((button) => button.trim() !== '') ?? ['MARKETPLACE', 'PIXLPAGE', 'CNFTJUNGLE'];
    const components = componentsToAdd.map((linkType) => this.generateLink(linkType, mintAnnouncement, discordServer.getBotLanguage()));
    if (components.length) {
      return [new ActionRowBuilder().addComponents(components)];
    }
    return [];
  },
  createListingAnnouncementFields(listingAnnouncement, locale) {
    const fields = [{
      name: i18n.__({ phrase: 'configure.marketplace.listings.announce.listedFor', locale }),
      value: i18n.__({ phrase: 'configure.marketplace.listings.announce.listedForContent', locale }, { price: Math.ceil(listingAnnouncement.price / 1000000) }),
    }];

    fields.push({
      name: i18n.__({ phrase: 'configure.marketplace.listings.announce.marketplace', locale }),
      value: i18n.__({ phrase: `marketplaces.${listingAnnouncement.source}`, locale }),
    });

    if (listingAnnouncement.rarityRank) {
      fields.push({
        name: i18n.__({ phrase: 'configure.marketplace.listings.announce.rank', locale }),
        value: i18n.__({ phrase: 'configure.marketplace.listings.announce.rankContent', locale }, { rank: listingAnnouncement.rarityRank }),
        inline: true,
      });
    }
    this.addMetadataAttributeHighlightField(listingAnnouncement, fields);

    return fields;
  },
  getListingAnnouncementTitle(listingAnnouncement, locale) {
    return i18n.__({ phrase: 'configure.marketplace.listings.announce.itemContentListed', locale }, listingAnnouncement);
  },
  getListingAnnouncementComponents(discordServer, listingAnnouncement) {
    const componentsToAdd = discordServer.settings.LISTINGS_TRACKER_BUTTONS?.split(',').filter((button) => button.trim() !== '') ?? ['MARKETPLACE', 'PIXLPAGE', 'CNFTJUNGLE'];
    const components = componentsToAdd.map((linkType) => this.generateLink(linkType, listingAnnouncement, discordServer.getBotLanguage()));
    if (components.length) {
      return [new ActionRowBuilder().addComponents(components)];
    }
    return [];
  },
  prepareImageUrl(imageUrl) {
    if (imageUrl.indexOf('https://nftstorage.link/ipfs/') === 0) {
      const ipfsV0 = imageUrl.substring('https://nftstorage.link/ipfs/'.length);
      return process.env.IPFS_LINK?.replaceAll('%s', new CID(ipfsV0).toV1().toString('base32'));
    }
    return imageUrl;
  },
  generateLink(linkType, linkData, locale) {
    switch (linkType) {
      case 'MARKETPLACE':
        return new ButtonBuilder()
          .setLabel(i18n.__({ phrase: 'configure.marketplace.general.viewOnMarketplace', locale }))
          .setURL(linkData.marketplaceAssetUrl)
          .setStyle(ButtonStyle.Link);
      case 'PIXLPAGE':
        return new ButtonBuilder()
          .setLabel(i18n.__({ phrase: 'configure.marketplace.general.viewOnPixlPage', locale }))
          .setURL(`https://pixl.page/asset/${linkData.policyId}${linkData.assetNameHex}`)
          .setStyle(ButtonStyle.Link);
      case 'CNFTJUNGLE':
        return new ButtonBuilder()
          .setLabel(i18n.__({ phrase: 'configure.marketplace.general.viewOnCnftJungle', locale }))
          .setURL(`https://www.cnftjungle.io/collections/${linkData.policyId}?assetId=${linkData.policyId}.${encodeURIComponent(linkData.assetName)}`)
          .setStyle(ButtonStyle.Link);
      case 'POOLPMHANDLE':
        return new ButtonBuilder()
          .setLabel(i18n.__({ phrase: 'configure.marketplace.general.viewOnPoolPm', locale }))
          .setURL(`https://pool.pm/$${linkData.assetName}`)
          .setStyle(ButtonStyle.Link);
      case 'POOLPM':
      default:
        return new ButtonBuilder()
          .setLabel(i18n.__({ phrase: 'configure.marketplace.general.viewOnPoolPm', locale }))
          .setURL(`https://pool.pm/${linkData.assetFingerprint}`)
          .setStyle(ButtonStyle.Link);
    }
  },
  createMintAnnouncementFields(mintAnnouncement, locale) {
    const fields = [];

    if (mintAnnouncement.rarityRank) {
      fields.push({
        name: i18n.__({ phrase: 'configure.marketplace.mint.announce.rank', locale }),
        value: i18n.__({ phrase: 'configure.marketplace.mint.announce.rankContent', locale }, { rank: mintAnnouncement.rarityRank }),
        inline: true,
      });
    }
    this.addMetadataAttributeHighlightField(mintAnnouncement, fields);

    return fields;
  },
  getMintAnnouncementTitle(mintAnnouncement, locale) {
    return i18n.__({ phrase: 'configure.marketplace.mint.announce.itemContentMint', locale }, mintAnnouncement);
  },
  getMintAnnouncementComponents(discordServer, mintAnnouncement) {
    const componentsToAdd = discordServer.settings.MINT_TRACKER_BUTTONS?.split(',').filter((button) => button.trim() !== '') ?? ['PIXLPAGE', 'CNFTJUNGLE'];
    const components = componentsToAdd.map((linkType) => this.generateLink(linkType, mintAnnouncement, discordServer.getBotLanguage()));
    if (components.length) {
      return [new ActionRowBuilder().addComponents(components)];
    }
    return [];
  },
  async getMarketplaceChannelOption(discordServer, marketplaceChannel, interaction, subcommand) {
    const locale = discordServer.getBotLanguage();
    const projectName = this.getProjectName(discordServer, marketplaceChannel);
    const announceChannel = await interaction.guild.channels.fetch(marketplaceChannel.channelId);
    const marketplaceNames = marketplaceChannel.marketplaces?.map((marketplace) => i18n.__({ phrase: `marketplaces.${marketplace}`, locale })).join(', ');
    const channelName = announceChannel ? announceChannel.name : i18n.__({ phrase: `configure.marketplace.${subcommand}.remove.deletedChannel`, locale });
    let description = i18n.__({ phrase: `configure.marketplace.${subcommand}.remove.entry`, locale }, { channelName, marketplaceNames });
    if (marketplaceChannel.type !== 'MINT' && marketplaceChannel.minimumValue) {
      description += i18n.__({ phrase: `configure.marketplace.${subcommand}.remove.entryAddon`, locale }, { minimumPriceAda: discordServer.formatNumber(Math.floor(marketplaceChannel.minimumValue / 1000000)) });
    }
    return {
      label: i18n.__({ phrase: `configure.marketplace.${subcommand}.remove.entryTitle`, locale }, { projectName, marketplaceChannel }).substring(0, 100),
      description: description.substring(0, 100),
      value: `marketplace-channel-id-${marketplaceChannel.id}`,
    };
  },
  getMarketplaceChannelDetailsField(discordServer, marketplaceChannel, mainTextSubAttribute, priceAddonSubCommand) {
    const subcommand = marketplaceChannel.type.toLowerCase();
    const locale = discordServer.getBotLanguage();
    const projectName = this.getProjectName(discordServer, marketplaceChannel);
    const marketplaceNames = marketplaceChannel.marketplaces?.map((marketplace) => i18n.__({ phrase: `marketplaces.${marketplace}`, locale })).join(', ');
    let content = i18n.__({ phrase: `configure.marketplace.${subcommand}.${mainTextSubAttribute}`, locale }, { projectName, marketplaceNames, channel: marketplaceChannel.channelId });
    if (marketplaceChannel.type !== 'MINT') {
      if (marketplaceChannel.minimumValue) {
        content += ` ${i18n.__({ phrase: `configure.marketplace.${subcommand}.${priceAddonSubCommand}.minimumPriceAddon`, locale }, { minimumPriceAda: discordServer.formatNumber(Math.floor(marketplaceChannel.minimumValue / 1000000)) })}`;
      }
      if (marketplaceChannel.maximumValue) {
        content += ` ${i18n.__({ phrase: `configure.marketplace.${subcommand}.${priceAddonSubCommand}.maximumPriceAddon`, locale }, { maximumPriceAda: discordServer.formatNumber(Math.floor(marketplaceChannel.maximumValue / 1000000)) })}`;
      }
    }
    if (marketplaceChannel.filters?.length) {
      content += cardanotoken.buildMetadataFilterContentText(marketplaceChannel.filters, marketplaceChannel.aggregationType, locale);
    }
    return {
      name: i18n.__({ phrase: `configure.marketplace.${subcommand}.list.entryTitle`, locale }, { projectName, marketplaceChannel }),
      value: content,
    };
  },
  getProjectName(discordServer, marketplaceChannel) {
    const projectData = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === marketplaceChannel.policyId);
    return projectData ? projectData.projectName : marketplaceChannel.policyId;
  },
  addMetadataAttributeHighlightField(announcement, fields) {
    if (announcement.highlightAttributeDisplayName) {
      fields.push({
        name: announcement.highlightAttributeDisplayName,
        value: announcement.highlightAttributeValue,
        inline: true,
      });
    }
  },
};
