/* eslint-disable no-await-in-loop */
import i18n from 'i18n';
import HazelnetClient from "../utility/hazelnetclient";
import {  GuildTextBasedChannel } from 'discord.js';
import pollutil from '../utility/poll';
import embedBuilder from '../utility/embedbuilder';
import { VoteData } from '@vibrantnet/core';
import discordpermissions from '../utility/discordpermissions';

export default {
  cron: '*/5 * * * *',
  async execute(client: HazelnetClient) {
    client.logger.info('Running poll result update job');
    try {
      const allPollsToAnnounce = await client.services.discordserver.listPollResultUpdates();
      for (let i = 0; i < allPollsToAnnounce.length; i += 1) {
        const pollUpdateInfo = allPollsToAnnounce[i];
        try {
          const guild = await client.guilds.fetch(pollUpdateInfo.guildId);
          if (guild) {
            const announceChannel = await guild.channels.fetch(pollUpdateInfo.channelId) as GuildTextBasedChannel;
            if (announceChannel) {
              const announceChannelPermissions = announceChannel.permissionsFor(client.application!.id);
              if (discordpermissions.hasBasicEmbedSendPermissions(announceChannelPermissions)) {
                const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
                const locale = discordServer.getBotLanguage();
                const poll = await client.services.discordserver.getPoll(pollUpdateInfo.guildId, pollUpdateInfo.pollId);
                const results = poll.resultsVisible ? await client.services.discordserver.getPollResults(guild.id, poll.id) : {} as VoteData;
                const tokenMetadata = await pollutil.getTokenMetadataFromRegistry(guild.id, poll, client);
                const { detailFields, components } = pollutil.getPollAnnouncementParts(discordServer, poll, results, false, tokenMetadata);
                const embedPublic = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'configure.poll.announce.publicSuccess', locale }), 'vote', detailFields);
                try {
                  await announceChannel.messages.fetch(pollUpdateInfo.messageId);
                  await announceChannel.messages.edit(pollUpdateInfo.messageId, { embeds: [embedPublic], components });
                } catch (discordError: any) {
                  if (discordError.httpStatus === 404) {
                    client.logger.error({ guildId: pollUpdateInfo.guildId, msg: `Message ${pollUpdateInfo.messageId} was not found in channel ${pollUpdateInfo.channelId} when publishing poll result updates for poll ${pollUpdateInfo.pollId}` });
                  } else {
                    client.logger.error({ guildId: pollUpdateInfo.guildId, msg: `Editing message ${pollUpdateInfo.messageId} in channel ${pollUpdateInfo.channelId} failed when publishing poll result updates for poll ${pollUpdateInfo.pollId}`, error: discordError });
                  }
                }
              } else {
                client.logger.error({ guildId: pollUpdateInfo.guildId, msg: `Channel permissions for ${pollUpdateInfo.channelId} did not allow publishing poll result updates for poll ${pollUpdateInfo.pollId}` });
              }
            } else {
              client.logger.error({ guildId: pollUpdateInfo.guildId, msg: `Channel ${pollUpdateInfo.channelId} not found while publishing poll result updates` });
            }
          } else {
            client.logger.error({ guildId: pollUpdateInfo.guildId, msg: 'Guild not found while publishing poll result updates' });
          }
        } catch (announceError) {
          client.logger.error({ guildId: pollUpdateInfo.guildId, msg: 'Failed to publish poll result updates', error: announceError });
        }
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to update poll results while getting poll list', error });
    }
  },
};
