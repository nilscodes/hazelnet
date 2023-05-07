import { GuildTextBasedChannel } from "discord.js";
import i18n from 'i18n';
import HazelnetClient from '../utility/hazelnetclient';
import embedBuilder from '../utility/embedbuilder';
import { DiscordServer } from '@vibrantnet/core';
import discordpermissions from "../utility/discordpermissions";

export type DiscordActivityReminder = {
  guildId: string
  channelId: string
  userId: string
}

export default {
  name: 'activityreminders',
  async consume(client: HazelnetClient, activityReminder: DiscordActivityReminder) {
    try {
      const guild = await client.guilds.fetch(activityReminder.guildId);
      if (guild) {
        const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
        const locale = discordServer.getBotLanguage();
        const announceChannel = await guild.channels.fetch(activityReminder.channelId) as GuildTextBasedChannel;
        if (announceChannel) {
          const announceChannelPermissions = announceChannel.permissionsFor(client.application!.id);
          if (discordpermissions.hasBasicEmbedSendPermissions(announceChannelPermissions)) {
            const user = await guild.members.fetch(activityReminder.userId);
            if (user && !user.user.bot) {
              const reminderText = this.getReminderText(discordServer, activityReminder);
              const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.engagement.activityreminder.announceTitle', locale }, { userName: user.nickname ?? user.user.tag }), reminderText, 'help');
              await announceChannel.send({ embeds: [embedPublic] });
            }
          }  else {
            client.logger.error({ guildId: activityReminder.guildId, msg: `Channel permissions for ${activityReminder.channelId} did not allow publishing activity reminders for user ${activityReminder.userId}` });
          }
        } else {
          client.logger.error({ guildId: activityReminder.guildId, msg: `Channel ${activityReminder.channelId} not found while publishing activity reminder` });
        }
      } else {
        client.logger.error({ guildId: activityReminder.guildId, msg: 'Guild not found while publishing activity reminder' });
      }
    } catch (reminderError) {
      client.logger.error({ guildId: activityReminder.guildId, msg: 'Failed to publish activity reminder', error: reminderError });
    }
  },
  getReminderText(discordServer: DiscordServer, activityReminder: DiscordActivityReminder) {
    const locale = discordServer.getBotLanguage();
    let reminderText = '';
    if (discordServer.settings?.ACTIVITY_REMINDER_MESSAGE) {
      if (discordServer.settings.ACTIVITY_REMINDER_MESSAGE.indexOf('%USER%') === -1) {
        reminderText = i18n.__({ phrase: 'configure.engagement.activityreminder.announceTextPrefixWithMention', locale }, activityReminder);
      }
      reminderText += discordServer.settings.ACTIVITY_REMINDER_MESSAGE.replace('%USER%', `<@${activityReminder.userId}>`);
    } else {
      reminderText = i18n.__({ phrase: 'configure.engagement.activityreminder.announceText', locale }, activityReminder);
    }
    return reminderText;
  },
};


