/* eslint-disable no-await-in-loop */
const {
  MessageActionRow, MessageButton,
} = require('discord.js');
const i18n = require('i18n');
const embedBuilder = require('../utility/embedbuilder');
const marketplace = require('../utility/marketplace');

module.exports = {
  name: 'saleannouncements',
  async consume(client, saleAnnouncement) {
    try {
      const guild = await client.guilds.fetch(saleAnnouncement.guildId);
      if (guild) {
        const announceChannel = await guild.channels.fetch(saleAnnouncement.channelId);
        if (announceChannel) {
          const announceChannelPermissions = announceChannel.permissionsFor(client.application.id);
          if (announceChannelPermissions.has('SEND_MESSAGES') && announceChannelPermissions.has('VIEW_CHANNEL')) {
            const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
            const locale = discordServer.getBotLanguage();
            const detailFields = marketplace.createSaleAnnouncementFields(saleAnnouncement, locale);
            const title = marketplace.getSaleAnnouncementTitle(saleAnnouncement, locale);
            const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.marketplace.sales.announce.title', locale }), title, 'policyid', detailFields, saleAnnouncement.assetImageUrl);
            const components = [new MessageActionRow()
              .addComponents(
                new MessageButton()
                  .setLabel(i18n.__({ phrase: 'configure.marketplace.sales.announce.viewOnMarketplace', locale }))
                  .setURL(saleAnnouncement.marketplaceAssetUrl)
                  .setStyle('LINK'),
                new MessageButton()
                  .setLabel(i18n.__({ phrase: 'configure.marketplace.sales.announce.viewOnPixlPage', locale }))
                  .setURL(`https://pixl.page/asset/${saleAnnouncement.policyId}${saleAnnouncement.assetNameHex}`)
                  .setStyle('LINK'),
                new MessageButton()
                  .setLabel(i18n.__({ phrase: 'configure.marketplace.sales.announce.viewOnCnftJungle', locale }))
                  .setURL(`https://www.cnftjungle.io/collections/${saleAnnouncement.policyId}?assetId=${saleAnnouncement.policyId}.${encodeURIComponent(saleAnnouncement.assetName)}`)
                  .setStyle('LINK'),
              ),
            ];
            await announceChannel.send({ embeds: [embedPublic], components });
          } else {
            client.logger.error({ guildId: saleAnnouncement.guildId, msg: `Channel permissions for ${saleAnnouncement.channelId} did not allow publishing sale announcements for asset ${saleAnnouncement.policyId} ${saleAnnouncement.assetName}` });
          }
        } else {
          client.logger.error({ guildId: saleAnnouncement.guildId, msg: `Channel ${saleAnnouncement.channelId} not found while publishing sale announcement` });
        }
      } else {
        client.logger.error({ guildId: saleAnnouncement.guildId, msg: 'Guild not found while publishing sale announcement' });
      }
    } catch (announceError) {
      client.logger.error({ guildId: saleAnnouncement.guildId, msg: 'Failed to publish sale announcement', error: announceError });
    }
  },
};
