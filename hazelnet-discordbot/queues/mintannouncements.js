/* eslint-disable no-await-in-loop */
const {
  MessageActionRow, MessageButton,
} = require('discord.js');
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
          if (announceChannelPermissions.has('SEND_MESSAGES') && announceChannelPermissions.has('VIEW_CHANNEL') && announceChannelPermissions.has('EMBED_LINKS')) {
            const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
            const locale = discordServer.getBotLanguage();
            const detailFields = marketplace.createMintAnnouncementFields(mintAnnouncement, locale);
            const title = marketplace.getMintAnnouncementTitle(mintAnnouncement, locale);
            const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.marketplace.mint.announce.title', locale }), title, 'policyid', detailFields, mintAnnouncement.assetImageUrl);
            const components = [new MessageActionRow()
              .addComponents(
                new MessageButton()
                  .setLabel(i18n.__({ phrase: 'configure.marketplace.mint.announce.viewOnPixlPage', locale }))
                  .setURL(`https://pixl.page/asset/${mintAnnouncement.policyId}${mintAnnouncement.assetNameHex}`)
                  .setStyle('LINK'),
                new MessageButton()
                  .setLabel(i18n.__({ phrase: 'configure.marketplace.mint.announce.viewOnCnftJungle', locale }))
                  .setURL(`https://www.cnftjungle.io/collections/${mintAnnouncement.policyId}?assetId=${mintAnnouncement.policyId}.${encodeURIComponent(mintAnnouncement.assetName)}`)
                  .setStyle('LINK'),
              ),
            ];
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
