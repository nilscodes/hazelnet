const i18n = require('i18n');

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

    return fields;
  },
  getMintAnnouncementTitle(mintAnnouncement, locale) {
    return i18n.__({ phrase: 'configure.marketplace.mint.announce.itemContentMint', locale }, mintAnnouncement);
  },
};
