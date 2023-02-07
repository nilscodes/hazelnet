/* eslint-disable no-await-in-loop */
import HazelnetClient from "../utility/hazelnetclient";
import { BaseGuildVoiceChannel, PermissionsBitField } from 'discord.js';
import roleassignments from "../utility/roleassignments";

export default {
  // TODO
  cron: '* * * * *',
  async execute(client: HazelnetClient) {
    client.logger.info('Running role count update job');
    try {
      const allRoleCountersToUpdate = await client.services.discordserver.listChannelsForRoleCounterUpdate();
      for (let i = 0; i < allRoleCountersToUpdate.length; i += 1) {
        const roleCounterUpdateInfo = allRoleCountersToUpdate[i];
        try {
          const guild = await client.guilds.fetch(roleCounterUpdateInfo.guildId);
          if (guild) {
            const roleCounterChannel = await guild.channels.fetch(roleCounterUpdateInfo.channelId) as BaseGuildVoiceChannel;
            if (roleCounterChannel) {
              const voiceChannelPermissions = roleCounterChannel.permissionsFor(client.application!.id);
              if (voiceChannelPermissions && voiceChannelPermissions.has(PermissionsBitField.Flags.Connect) && voiceChannelPermissions.has(PermissionsBitField.Flags.ManageChannels) && voiceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
                try {
                  const role = await guild.roles.fetch(roleCounterUpdateInfo.roleId);
                  if (role) {
                    const roleCountChannelName = await roleassignments.getRoleCountChannelName(guild, role);
                    await roleCounterChannel.setName(roleCountChannelName);
                  } else {
                    await client.services.discordserver.deleteDiscordServerSetting(roleCounterUpdateInfo.guildId, `WIDGET_ROLE_COUNTER_${roleCounterUpdateInfo.roleId}`);
                  }
                } catch (discordError: any) {
                  client.logger.error({ guildId: roleCounterUpdateInfo.guildId, msg: `Channel ${roleCounterUpdateInfo.channelId} was not updated with role count info due to unknown error.`, error: discordError + '' });
                }
              } else {
                client.logger.error({ guildId: roleCounterUpdateInfo.guildId, msg: `Channel permissions for ${roleCounterUpdateInfo.channelId} did not allow updating role counter` });
                await client.services.discordserver.deleteDiscordServerSetting(roleCounterUpdateInfo.guildId, `WIDGET_ROLE_COUNTER_${roleCounterUpdateInfo.roleId}`);
              }
            } else {
              client.logger.error({ guildId: roleCounterUpdateInfo.guildId, msg: `Channel ${roleCounterUpdateInfo.channelId} not found while updating role counter` });
              await client.services.discordserver.deleteDiscordServerSetting(roleCounterUpdateInfo.guildId, `WIDGET_ROLE_COUNTER_${roleCounterUpdateInfo.roleId}`);
            }
          } else {
            client.logger.error({ guildId: roleCounterUpdateInfo.guildId, msg: 'Guild not found while publishing role counter updates' });
            await client.services.discordserver.updateDiscordServerSetting(roleCounterUpdateInfo.guildId, 'WIDGET_EPOCHCLOCK', '');
          }
        } catch (announceError) {
          client.logger.error({ guildId: roleCounterUpdateInfo.guildId, msg: 'Failed to publish role counter updates', error: announceError + '' });
        }
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to update role counters', error: error + '' });
    }
  },
};
