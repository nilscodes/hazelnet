/* eslint-disable no-await-in-loop */
import i18n from 'i18n';
import { GuildTextBasedChannel, PermissionsBitField } from "discord.js";
import HazelnetClient from "../utility/hazelnetclient";
import { SaleAnnouncement } from '@vibrantnet/core';
import embedBuilder from '../utility/embedbuilder';
import marketplace from '../utility/marketplace';
import discordpermissions from '../utility/discordpermissions';

export default {
  name: 'saleannouncements',
  async consume(client: HazelnetClient, saleAnnouncement: SaleAnnouncement) {
    try {
      const guild = await client.guilds.fetch(saleAnnouncement.guildId);
      if (guild) {
        const announceChannel = await guild.channels.fetch(saleAnnouncement.channelId) as GuildTextBasedChannel;
        if (announceChannel) {
          const announceChannelPermissions = announceChannel.permissionsFor(client.application!.id);
          if (discordpermissions.hasBasicEmbedSendAndAttachPermissions(announceChannelPermissions)) {
            const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
            const locale = discordServer.getBotLanguage();
            const detailFields = marketplace.createSaleAnnouncementFields(saleAnnouncement, locale);
            const title = marketplace.getSaleAnnouncementTitle(saleAnnouncement, locale);
            const nftcdnBlob = await marketplace.prepareImageUrl(saleAnnouncement);
            const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.marketplace.sales.announce.title', locale }), title, 'policyid', detailFields, nftcdnBlob.name);
            const components = marketplace.getSaleAnnouncementComponents(discordServer, saleAnnouncement);
            await announceChannel.send({ embeds: [embedPublic], components, files: nftcdnBlob.files });
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
