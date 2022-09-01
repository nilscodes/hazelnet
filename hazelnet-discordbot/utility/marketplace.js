const i18n = require('i18n');
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
    if (marketplaceChannel.type !== 'MINT' && marketplaceChannel.minimumValue) {
      content += ` ${i18n.__({ phrase: `configure.marketplace.${subcommand}.${priceAddonSubCommand}.minimumPriceAddon`, locale }, { minimumPriceAda: discordServer.formatNumber(Math.floor(marketplaceChannel.minimumValue / 1000000)) })}`;
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
