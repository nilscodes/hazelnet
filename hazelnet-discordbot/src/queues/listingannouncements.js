/* eslint-disable no-await-in-loop */
const i18n = require('i18n');
const embedBuilder = require('../utility/embedbuilder');
const marketplace = require('../utility/marketplace');

module.exports = {
  name: 'listingannouncements',
  async consume(client, listingAnnouncement) {
    try {
      const guild = await client.guilds.fetch(listingAnnouncement.guildId);
      if (guild) {
        const announceChannel = await guild.channels.fetch(listingAnnouncement.channelId);
        if (announceChannel) {
          const announceChannelPermissions = announceChannel.permissionsFor(client.application.id);
          if (announceChannelPermissions.has('SEND_MESSAGES') && announceChannelPermissions.has('VIEW_CHANNEL') && announceChannelPermissions.has('EMBED_LINKS')) {
            const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
            const locale = discordServer.getBotLanguage();
            const detailFields = marketplace.createListingAnnouncementFields(listingAnnouncement, locale);
            const title = marketplace.getListingAnnouncementTitle(listingAnnouncement, locale);
            const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.marketplace.listings.announce.title', locale }), title, 'policyid', detailFields, listingAnnouncement.assetImageUrl);
            const components = marketplace.getListingAnnouncementComponents(discordServer, listingAnnouncement);
            await announceChannel.send({ embeds: [embedPublic], components });
          } else {
            client.logger.error({ guildId: listingAnnouncement.guildId, msg: `Channel permissions for ${listingAnnouncement.channelId} did not allow publishing listing announcements for asset ${listingAnnouncement.policyId} ${listingAnnouncement.assetName}` });
          }
        } else {
          client.logger.error({ guildId: listingAnnouncement.guildId, msg: `Channel ${listingAnnouncement.channelId} not found while publishing listing announcement` });
        }
      } else {
        client.logger.error({ guildId: listingAnnouncement.guildId, msg: 'Guild not found while publishing listing announcement' });
      }
    } catch (announceError) {
      client.logger.error({ guildId: listingAnnouncement.guildId, msg: 'Failed to publish listing announcement', error: announceError });
    }
  },
};
