/* eslint-disable no-await-in-loop */
import i18n from 'i18n';
import { GuildTextBasedChannel, PermissionsBitField } from "discord.js";
import HazelnetClient from "../utility/hazelnetclient";
import { MintAnnouncement } from '@vibrantnet/core';
import embedBuilder from '../utility/embedbuilder';
import marketplace from '../utility/marketplace';
import discordpermissions from '../utility/discordpermissions';

export default {
  name: 'mintannouncements',
  async consume(client: HazelnetClient, mintAnnouncement: MintAnnouncement) {
    try {
      const guild = await client.guilds.fetch(mintAnnouncement.guildId);
      if (guild) {
        const announceChannel = await guild.channels.fetch(mintAnnouncement.channelId) as GuildTextBasedChannel;
        if (announceChannel) {
          const announceChannelPermissions = announceChannel.permissionsFor(client.application!.id);
          if (discordpermissions.hasBasicEmbedSendAndAttachPermissions(announceChannelPermissions)) {
            const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
            const locale = discordServer.getBotLanguage();
            const detailFields = marketplace.createMintAnnouncementFields(mintAnnouncement, locale);
            const title = marketplace.getMintAnnouncementTitle(mintAnnouncement, locale);
            const nftcdnBlob = await marketplace.prepareImageUrl(mintAnnouncement);
            const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.marketplace.mint.announce.title', locale }), title, 'policyid', detailFields, nftcdnBlob.name);
            const components = marketplace.getMintAnnouncementComponents(discordServer, mintAnnouncement);
            await announceChannel.send({ embeds: [embedPublic], components, files: nftcdnBlob.files });
          } else {
            client.logger.error({ guildId: mintAnnouncement.guildId, msg: `Channel permissions for ${mintAnnouncement.channelId} did not allow publishing mint announcements for asset ${mintAnnouncement.policyId} ${mintAnnouncement.assetName}` });
          }
        } else {
          client.logger.error({ guildId: mintAnnouncement.guildId, msg: `Channel ${mintAnnouncement.channelId} not found while publishing mint announcement` });
        }
      } else {
        client.logger.error({ guildId: mintAnnouncement.guildId, msg: 'Guild not found while publishing mint announcement' });
      }
    } catch (announceError) {
      client.logger.error({ guildId: mintAnnouncement.guildId, msg: 'Failed to publish mint announcement', error: announceError });
    }
  },
};
