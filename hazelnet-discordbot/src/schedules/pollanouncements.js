/* eslint-disable no-await-in-loop */
const { PermissionsBitField } = require('discord.js');
const i18n = require('i18n');
const pollutil = require('../utility/poll');
const embedBuilder = require('../utility/embedbuilder');

module.exports = {
  cron: '* * * * *',
  async execute(client) {
    client.logger.info('Running poll announcement job');
    try {
      const allPollsToAnnounce = await client.services.discordserver.listPollsToBeAnnounced();
      for (let i = 0; i < allPollsToAnnounce.length; i += 1) {
        const pollUpdateInfo = allPollsToAnnounce[i];
        try {
          const guild = await client.guilds.fetch(pollUpdateInfo.guildId);
          if (guild) {
            const announceChannel = await guild.channels.fetch(pollUpdateInfo.channelId);
            if (announceChannel) {
              const announceChannelPermissions = announceChannel.permissionsFor(client.application.id);
              if (announceChannelPermissions.has(PermissionsBitField.Flags.SendMessages) && announceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel) && announceChannelPermissions.has(PermissionsBitField.Flags.EmbedLinks)) {
                const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
                const locale = discordServer.getBotLanguage();
                const poll = await client.services.discordserver.getPoll(pollUpdateInfo.guildId, pollUpdateInfo.pollId);
                const results = poll.resultsVisible ? await client.services.discordserver.getPollResults(guild.id, poll.id) : null;
                const { detailFields, components } = pollutil.getPollAnnouncementParts(discordServer, poll, results, false);
                const embedPublic = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'configure.poll.announce.publicSuccess', locale }), 'vote', detailFields);
                const announcementMessage = await announceChannel.send({ embeds: [embedPublic], components });
                await client.services.discordserver.updatePoll(guild.id, poll.id, {
                  channelId: announceChannel.id,
                  messageId: announcementMessage.id,
                });
              } else {
                client.logger.error({ guildId: pollUpdateInfo.guildId, msg: `Channel permissions for ${pollUpdateInfo.channelId} did not allow publishing poll announcements for poll ${pollUpdateInfo.pollId}` });
              }
            } else {
              client.logger.error({ guildId: pollUpdateInfo.guildId, msg: `Channel ${pollUpdateInfo.channelId} not found while publishing poll announcements` });
            }
          } else {
            client.logger.error({ guildId: pollUpdateInfo.guildId, msg: 'Guild not found while publishing poll announcements' });
          }
        } catch (announceError) {
          client.logger.error({ guildId: pollUpdateInfo.guildId, msg: 'Failed to publish poll announcements', error: announceError });
        }
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to announce polls while getting poll list', error });
    }
  },
};
