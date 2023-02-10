/* eslint-disable no-await-in-loop */
import i18n from 'i18n';
import { GuildTextBasedChannel, PermissionsBitField } from "discord.js";
import HazelnetClient from "../utility/hazelnetclient";
import { ListingAnnouncement } from '../utility/sharedtypes';
import embedBuilder from '../utility/embedbuilder';
import marketplace from '../utility/marketplace';

export default {
  name: 'listingannouncements',
  async consume(client: HazelnetClient, listingAnnouncement: ListingAnnouncement) {
    try {
      const guild = await client.guilds.fetch(listingAnnouncement.guildId);
      if (guild) {
        const announceChannel = await guild.channels.fetch(listingAnnouncement.channelId) as GuildTextBasedChannel;
        if (announceChannel) {
          const announceChannelPermissions = announceChannel.permissionsFor(client.application!.id);
          if (announceChannelPermissions && announceChannelPermissions.has(PermissionsBitField.Flags.SendMessages) && announceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel) && announceChannelPermissions.has(PermissionsBitField.Flags.EmbedLinks)) {
            const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
            const locale = discordServer.getBotLanguage();
            const detailFields = marketplace.createListingAnnouncementFields(listingAnnouncement, locale);
            const title = marketplace.getListingAnnouncementTitle(listingAnnouncement, locale);
            const nftcdnBlob = await marketplace.prepareImageUrl(listingAnnouncement);
            const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.marketplace.listings.announce.title', locale }), title, 'policyid', detailFields, nftcdnBlob.name);
            const components = marketplace.getListingAnnouncementComponents(discordServer, listingAnnouncement);
            await announceChannel.send({ embeds: [embedPublic], components, files: nftcdnBlob.files });
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
