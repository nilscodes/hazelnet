/* eslint-disable no-await-in-loop */
import { BaseGuildVoiceChannel, PermissionsBitField } from 'discord.js';
import HazelnetClient from '../utility/hazelnetclient';
import epochClockUtil from '../utility/epochclockutil';

export default {
  cron: '*/5 * * * *',
  async execute(client: HazelnetClient) {
    client.logger.info('Running epoch clock update job');
    try {
      const allEpochClocksToUpdate = await client.services.discordserver.listChannelsForEpochClockUpdate();
      const epochDetails = await client.services.cardanoinfo.epochDetails();
      if (epochDetails.estimatedSecondsLeft < 0) {
        return;
      }
      const epochClock = epochClockUtil.buildEpochClockText(epochDetails);
      for (let i = 0; i < allEpochClocksToUpdate.length; i += 1) {
        const epochClockUpdateInfo = allEpochClocksToUpdate[i];
        try {
          const guild = await client.guilds.fetch(epochClockUpdateInfo.guildId);
          if (guild) {
            const epochClockChannel = await guild.channels.fetch(epochClockUpdateInfo.channelId) as BaseGuildVoiceChannel;
            if (epochClockChannel) {
              const voiceChannelPermissions = epochClockChannel.permissionsFor(client.application!.id);
              if (voiceChannelPermissions
                && voiceChannelPermissions.has(PermissionsBitField.Flags.Connect)
                && voiceChannelPermissions.has(PermissionsBitField.Flags.ManageChannels)
                && voiceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel)
              ) {
                try {
                  await epochClockChannel.setName(epochClock);
                } catch (discordError: any) {
                  client.logger.error({ guildId: epochClockUpdateInfo.guildId, msg: `Channel ${epochClockUpdateInfo.channelId} was not updated with epoch clock info due to unknown error.`, error: `${discordError}` });
                }
              } else {
                client.logger.error({ guildId: epochClockUpdateInfo.guildId, msg: `Channel permissions for ${epochClockUpdateInfo.channelId} did not allow updating epoch clock` });
                await client.services.discordserver.updateDiscordServerSetting(guild.id, 'WIDGET_EPOCHCLOCK', '');
              }
            } else {
              client.logger.error({ guildId: epochClockUpdateInfo.guildId, msg: `Channel ${epochClockUpdateInfo.channelId} not found while updating epoch clock` });
              await client.services.discordserver.updateDiscordServerSetting(guild.id, 'WIDGET_EPOCHCLOCK', '');
            }
          } else {
            client.logger.error({ guildId: epochClockUpdateInfo.guildId, msg: 'Guild not found while publishing epoch clock updates' });
            await client.services.discordserver.updateDiscordServerSetting(epochClockUpdateInfo.guildId, 'WIDGET_EPOCHCLOCK', '');
          }
        } catch (announceError) {
          client.logger.error({ guildId: epochClockUpdateInfo.guildId, msg: 'Failed to publish epoch clock updates', error: `${announceError}` });
        }
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to update epoch clocks', error: `${error}` });
    }
  },
};
