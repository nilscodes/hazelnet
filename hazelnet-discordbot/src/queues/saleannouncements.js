/* eslint-disable no-await-in-loop */
const { PermissionsBitField } = require('discord.js');
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
          if (announceChannelPermissions.has(PermissionsBitField.Flags.SendMessages) && announceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel) && announceChannelPermissions.has(PermissionsBitField.Flags.EmbedLinks)) {
            const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
            const locale = discordServer.getBotLanguage();
            const detailFields = marketplace.createSaleAnnouncementFields(saleAnnouncement, locale);
            const title = marketplace.getSaleAnnouncementTitle(saleAnnouncement, locale);
            const image = marketplace.prepareImageUrl(saleAnnouncement.assetImageUrl)
            // const ipfsV0 = metadata.image.indexOf('ipfs://') === 0 ? metadata.image.substring(7) : null;
            // if (ipfsV0) {
            //   image = process.env.IPFS_LINK?.replaceAll('%s', new CID(ipfsV0).toV1().toString('base32'));
            // }

            const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.marketplace.sales.announce.title', locale }), title, 'policyid', detailFields, image);
            const components = marketplace.getSaleAnnouncementComponents(discordServer, saleAnnouncement);
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
