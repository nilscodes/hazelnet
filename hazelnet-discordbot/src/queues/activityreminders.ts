import { GuildTextBasedChannel, PermissionsBitField, TextBasedChannel } from "discord.js";
import i18n from 'i18n';
import HazelnetClient from "src/utility/hazelnetclient";
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
            const embedPublic = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'configure.engagement.activityreminder.announceTitle', locale }), i18n.__({ phrase: 'configure.engagement.activityreminder.announceText', locale }, activityReminder), 'help');
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
      console.log(reminderError);
      client.logger.error({ guildId: activityReminder.guildId, msg: 'Failed to publish activity reminder', error: reminderError });
    }
  },
};
