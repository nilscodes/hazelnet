/* eslint-disable no-await-in-loop */
import i18n from 'i18n';
import giveawayutil from '../utility/giveaway';
import HazelnetClient from "src/utility/hazelnetclient";
import { GuildTextBasedChannel, PermissionsBitField } from 'discord.js';
const embedBuilder = require('../utility/embedbuilder');

export default {
  cron: '*/5 * * * *',
  async execute(client: HazelnetClient) {
    client.logger.info('Running giveaway result update job');
    try {
      const allGiveawaysToAnnounce = await client.services.discordserver.listGiveawayResultUpdates();
      for (let i = 0; i < allGiveawaysToAnnounce.length; i += 1) {
        const giveawayUpdateInfo = allGiveawaysToAnnounce[i];
        try {
          const guild = await client.guilds.fetch(giveawayUpdateInfo.guildId);
          if (guild) {
            const announceChannel = await guild.channels.fetch(giveawayUpdateInfo.channelId) as GuildTextBasedChannel;
            if (announceChannel) {
              const announceChannelPermissions = announceChannel.permissionsFor(client.application!.id);
              if (announceChannelPermissions && announceChannelPermissions.has(PermissionsBitField.Flags.SendMessages) && announceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel) && announceChannelPermissions.has(PermissionsBitField.Flags.EmbedLinks)) {
                const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
                const locale = discordServer.getBotLanguage();
                const giveaway = await client.services.discordserver.getGiveaway(giveawayUpdateInfo.guildId, giveawayUpdateInfo.giveawayId);
                const participation = await client.services.discordserver.getParticipationForGiveaway(guild.id, giveaway.id);
                const tokenMetadata = await giveawayutil.getTokenMetadataFromRegistry(guild.id, giveaway, client);
                const { detailFields, components } = giveawayutil.getGiveawayAnnouncementParts(discordServer, giveaway, participation, tokenMetadata);
                const embedPublic = embedBuilder.buildForUser(discordServer, giveaway.displayName, i18n.__({ phrase: 'configure.giveaway.announce.publicSuccess', locale }), 'vote', detailFields);
                try {
                  await announceChannel.messages.fetch(giveawayUpdateInfo.messageId);
                  await announceChannel.messages.edit(giveawayUpdateInfo.messageId, { embeds: [embedPublic], components });
                } catch (discordError: any) {
                  if (discordError.httpStatus === 404) {
                    client.logger.error({ guildId: giveawayUpdateInfo.guildId, msg: `Message ${giveawayUpdateInfo.messageId} was not found in channel ${giveawayUpdateInfo.channelId} when publishing giveaway result updates for giveaway ${giveawayUpdateInfo.giveawayId}` });
                  } else {
                    client.logger.error({ guildId: giveawayUpdateInfo.guildId, msg: `Editing message ${giveawayUpdateInfo.messageId} in channel ${giveawayUpdateInfo.channelId} failed when publishing giveaway result updates for giveaway ${giveawayUpdateInfo.giveawayId}`, error: discordError });
                  }
                }
              } else {
                client.logger.error({ guildId: giveawayUpdateInfo.guildId, msg: `Channel permissions for ${giveawayUpdateInfo.channelId} did not allow publishing giveaway result updates for giveaway ${giveawayUpdateInfo.giveawayId}` });
              }
            } else {
              client.logger.error({ guildId: giveawayUpdateInfo.guildId, msg: `Channel ${giveawayUpdateInfo.channelId} not found while publishing giveaway result updates` });
            }
          } else {
            client.logger.error({ guildId: giveawayUpdateInfo.guildId, msg: 'Guild not found while publishing giveaway result updates' });
          }
        } catch (announceError) {
          client.logger.error({ guildId: giveawayUpdateInfo.guildId, msg: 'Failed to publish giveaway result updates', error: announceError });
        }
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to update giveaway results while getting giveaway list', error });
    }
  },
};
