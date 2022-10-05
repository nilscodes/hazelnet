/* eslint-disable no-await-in-loop */
const { PermissionsBitField } = require('discord.js');
const i18n = require('i18n');
const embedBuilder = require('../utility/embedbuilder');
const marketplace = require('../utility/marketplace');

module.exports = {
  name: 'mintannouncements',
  async consume(client, mintAnnouncement) {
    try {
      const guild = await client.guilds.fetch(mintAnnouncement.guildId);
      if (guild) {
        const announceChannel = await guild.channels.fetch(mintAnnouncement.channelId);
        if (announceChannel) {
          const announceChannelPermissions = announceChannel.permissionsFor(client.application.id);
          if (announceChannelPermissions.has(PermissionsBitField.Flags.SendMessages) && announceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel) && announceChannelPermissions.has(PermissionsBitField.Flags.EmbedLinks)) {
            const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
            const locale = discordServer.getBotLanguage();
            const detailFields = marketplace.createMintAnnouncementFields(mintAnnouncement, locale);
            const title = marketplace.getMintAnnouncementTitle(mintAnnouncement, locale);
            const image = marketplace.prepareImageUrl(mintAnnouncement.assetImageUrl);
            const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.marketplace.mint.announce.title', locale }), title, 'policyid', detailFields, image);
            const components = marketplace.getMintAnnouncementComponents(discordServer, mintAnnouncement);
            await announceChannel.send({ embeds: [embedPublic], components });
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
