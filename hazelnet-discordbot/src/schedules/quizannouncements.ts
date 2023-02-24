/* eslint-disable no-await-in-loop */
import i18n from 'i18n';
import quizutil from '../utility/quiz';
import HazelnetClient from "../utility/hazelnetclient";
import { GuildTextBasedChannel } from 'discord.js';
import embedBuilder from '../utility/embedbuilder';
import discordpermissions from '../utility/discordpermissions';

export default {
  cron: '*/5 * * * *',
  async execute(client: HazelnetClient) {
    client.logger.info('Running quiz announcement job');
    try {
      const allQuizzesToAnnounce = await client.services.discordquiz.listQuizzesToBeAnnounced();
      for (let i = 0; i < allQuizzesToAnnounce.length; i += 1) {
        const quizUpdateInfo = allQuizzesToAnnounce[i];
        try {
          const guild = await client.guilds.fetch(quizUpdateInfo.guildId);
          if (guild) {
            const announceChannel = await guild.channels.fetch(quizUpdateInfo.channelId) as GuildTextBasedChannel;
            if (announceChannel) {
              const announceChannelPermissions = announceChannel.permissionsFor(client.application!.id);
              if (discordpermissions.hasBasicEmbedSendPermissions(announceChannelPermissions)) {
                const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
                const locale = discordServer.getBotLanguage();
                const quiz = await client.services.discordquiz.getQuiz(quizUpdateInfo.guildId, quizUpdateInfo.quizId);
                const { detailFields, components } = quizutil.getQuizAnnouncementParts(discordServer, quiz);
                const embedPublic = embedBuilder.buildForUser(discordServer, quiz.displayName, i18n.__({ phrase: 'configure.quiz.announce.publicSuccess', locale }), 'join', detailFields, quiz.logoUrl);
                const announcementMessage = await announceChannel.send({ embeds: [embedPublic], components });
                await client.services.discordquiz.updateQuiz(guild.id, quiz.id, {
                  channelId: announceChannel.id,
                  messageId: announcementMessage.id,
                });
              } else {
                client.logger.error({ guildId: quizUpdateInfo.guildId, msg: `Channel permissions for ${quizUpdateInfo.channelId} did not allow publishing quiz announcements for quiz ${quizUpdateInfo.quizId}` });
              }
            } else {
              client.logger.error({ guildId: quizUpdateInfo.guildId, msg: `Channel ${quizUpdateInfo.channelId} not found while publishing quiz announcements` });
            }
          } else {
            client.logger.error({ guildId: quizUpdateInfo.guildId, msg: 'Guild not found while publishing quiz announcements' });
          }
        } catch (announceError) {
          client.logger.error({ guildId: quizUpdateInfo.guildId, msg: 'Failed to publish quiz announcements', error: announceError });
        }
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to announce quizzes while getting quiz list', error });
    }
  },
};
