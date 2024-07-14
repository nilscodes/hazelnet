/* eslint-disable no-await-in-loop */
import { BaseGuildVoiceChannel, PermissionsBitField } from 'discord.js';
import HazelnetClient from '../utility/hazelnetclient';
import cardanotoken from '../utility/cardanotoken';

export default {
  cron: '*/5 * * * *',
  async execute(client: HazelnetClient) {
    client.logger.info('Running mint count update job');
    try {
      const allMintCountersToUpdate = await client.services.discordserver.listChannelsForMintCountUpdate();
      for (let i = 0; i < allMintCountersToUpdate.length; i += 1) {
        const mintCounterUpdateInfo = allMintCountersToUpdate[i];
        try {
          const guild = await client.guilds.fetch(mintCounterUpdateInfo.guildId);
          if (guild) {
            const mintCounterChannel = await guild.channels.fetch(mintCounterUpdateInfo.channelId) as BaseGuildVoiceChannel;
            if (mintCounterChannel) {
              const voiceChannelPermissions = mintCounterChannel.permissionsFor(client.application!.id);
              if (voiceChannelPermissions
                && voiceChannelPermissions.has(PermissionsBitField.Flags.Connect)
                && voiceChannelPermissions.has(PermissionsBitField.Flags.ManageChannels)
                && voiceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel)
              ) {
                try {
                  const discordServer = await client.services.discordserver.getDiscordServer(guild.id);
                  const locale = discordServer.getBotLanguage();
                  await mintCounterChannel.setName(cardanotoken.getMintCountText(mintCounterUpdateInfo, mintCounterUpdateInfo.maxCount, locale, (mintCounterUpdateInfo as any).cip68));
                } catch (discordError: any) {
                  client.logger.error({ guildId: mintCounterUpdateInfo.guildId, msg: `Channel ${mintCounterUpdateInfo.channelId} was not updated with mint count info due to unknown error.` });
                }
              } else {
                client.logger.error({ guildId: mintCounterUpdateInfo.guildId, msg: `Channel permissions for ${mintCounterUpdateInfo.channelId} did not allow updating mint count` });
                await client.services.discordserver.updateDiscordServerSetting(guild.id, 'WIDGET_MINTCOUNTER', '');
              }
            } else {
              client.logger.error({ guildId: mintCounterUpdateInfo.guildId, msg: `Channel ${mintCounterUpdateInfo.channelId} not found while updating mint count` });
              await client.services.discordserver.updateDiscordServerSetting(guild.id, 'WIDGET_MINTCOUNTER', '');
            }
          } else {
            client.logger.error({ guildId: mintCounterUpdateInfo.guildId, msg: 'Guild not found while publishing mint count result updates' });
            await client.services.discordserver.updateDiscordServerSetting(mintCounterUpdateInfo.guildId, 'WIDGET_MINTCOUNTER', '');
          }
        } catch (announceError) {
          client.logger.error({ guildId: mintCounterUpdateInfo.guildId, msg: 'Failed to publish mint count updates', error: announceError });
        }
      }
    } catch (error) {
      client.logger.error({ msg: 'Failed to update mint counts', error });
    }
  },
};
