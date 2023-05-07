import i18n from 'i18n';
import { BaseGuildVoiceChannel, ChannelType } from 'discord.js';
import { BotSubcommand } from '../../utility/commandtypes';
import epochClockUtil from '../../utility/epochclockutil';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const newStatus = interaction.options.getBoolean('status') ?? true;
    const clockChannel = interaction.options.getChannel('channel', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      if (clockChannel.type === ChannelType.GuildVoice || newStatus === false) {
        try {
          if (newStatus !== false) {
            const epochDetails = await interaction.client.services.cardanoinfo.epochDetails();
            if (epochDetails.estimatedSecondsLeft > 0) {
              const epochClock = epochClockUtil.buildEpochClockText(epochDetails);
              await (clockChannel as BaseGuildVoiceChannel).setName(epochClock);
            }
          }
          await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild!.id, 'WIDGET_EPOCHCLOCK', newStatus === false ? '' : clockChannel.id);
          const changeMessage = i18n.__({ phrase: (newStatus ? 'configure.info.epochclock.epochclockOn' : 'configure.info.epochclock.epochclockOff'), locale }, { epochclock: clockChannel.id });
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-info epochclock', changeMessage, 'configure-info-epochclock');
          await interaction.editReply({ embeds: [embed] });
        } catch (error) {
          interaction.client.logger.info(error);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-info epochclock', i18n.__({ phrase: 'configure.info.epochclock.errorChannelPermissions', locale }), 'configure-info-epochclock');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-info epochclock', i18n.__({ phrase: 'configure.info.epochclock.errorWrongChannelType', locale }), 'configure-info-epochclock');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding an epoch clock to your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
