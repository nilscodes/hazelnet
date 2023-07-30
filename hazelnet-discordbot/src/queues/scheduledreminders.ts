import { GuildTextBasedChannel } from 'discord.js';
import HazelnetClient from '../utility/hazelnetclient';
import embedBuilder from '../utility/embedbuilder';
import discordpermissions from '../utility/discordpermissions';

export type ReminderInfo = {
  guildId: string
  reminderId: number
};

export default {
  name: 'scheduledreminders',
  async consume(client: HazelnetClient, scheduledReminder: ReminderInfo) {
    try {
      const guild = await client.guilds.fetch(scheduledReminder.guildId);
      if (guild) {
        const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
        const reminder = await client.services.reminders.getReminder(guild.id, scheduledReminder.reminderId);
        if (reminder) {
          const announceChannel = await guild.channels.fetch(reminder.reminderChannel) as GuildTextBasedChannel;
          if (announceChannel) {
            const announceChannelPermissions = announceChannel.permissionsFor(client.application!.id);
            if (discordpermissions.hasBasicEmbedSendPermissions(announceChannelPermissions)) {
              const embedPublic = embedBuilder.buildForUser(discordServer, reminder.title, reminder.reminderText, 'help');
              await announceChannel.send({ embeds: [embedPublic] });
            } else {
              client.logger.error({ guildId: scheduledReminder.guildId, msg: `Channel permissions for ${reminder.reminderChannel} did not allow publishing scheduled reminders reminder ID ${reminder.id}` });
            }
          } else {
            client.logger.error({ guildId: scheduledReminder.guildId, msg: `Channel ${reminder.reminderChannel} not found while publishing scheduled reminder for reminder ID ${reminder.id}` });
          }
        } else {
          client.logger.error({ guildId: scheduledReminder.guildId, msg: `Reminder ${scheduledReminder.reminderId} not found while publishing scheduled reminder` });
        }
      } else {
        client.logger.error({ guildId: scheduledReminder.guildId, msg: 'Guild not found while publishing scheduled reminder' });
      }
    } catch (reminderError) {
      client.logger.error({ guildId: scheduledReminder.guildId, msg: 'Failed to publish scheduled reminder', error: reminderError });
    }
  },
};
