import { GuildTextBasedChannel, PermissionsBitField } from "discord.js";
import i18n from 'i18n';
import HazelnetClient from '../utility/hazelnetclient';
const embedBuilder = require('../utility/embedbuilder');

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
          if (announceChannelPermissions
            && announceChannelPermissions.has(PermissionsBitField.Flags.SendMessages)
            && announceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel)
            && announceChannelPermissions.has(PermissionsBitField.Flags.EmbedLinks)
          ) {
            const reminderText = this.getReminderText(discordServer, activityReminder);
            const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.engagement.activityreminder.announceTitle', locale }), reminderText, 'help');
            await announceChannel.send({ embeds: [embedPublic] });
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
  getReminderText(discordServer: any, activityReminder: DiscordActivityReminder) {
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

