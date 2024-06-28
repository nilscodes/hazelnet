import { BotSubcommand } from "../../utility/commandtypes";
import i18n from 'i18n';
import { BaseGuildVoiceChannel, ChannelType } from "discord.js";
import cardanotoken from "../../utility/cardanotoken";
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const newStatus = interaction.options.getBoolean('status') ?? true;
    const maxCount = interaction.options.getInteger('max-count') ?? 0;
    const policyId = interaction.options.getString('policy-id', true);
    const mintCountChannel = interaction.options.getChannel('voice-channel', true);
    const cip68 = interaction.options.getBoolean('cip68') ?? false;
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      if (mintCountChannel.type === ChannelType.GuildVoice || newStatus === false) {
        try {
          if (newStatus !== false) {
            const policyInfo = await interaction.client.services.cardanoinfo.policyInfo(policyId);
            if (policyInfo) {
              const mintCount = cardanotoken.getMintCountText(policyInfo, maxCount, locale, cip68);
              await (mintCountChannel as BaseGuildVoiceChannel).setName(mintCount);
            }
          }
          await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild!.id, 'WIDGET_MINTCOUNTER', newStatus === false ? '' : `${mintCountChannel.id},${policyId},${maxCount},${cip68}`);
          const changeMessage = i18n.__({ phrase: (newStatus ? 'configure.policy.mintcounter.mintcounterOn' : 'configure.policy.mintcounter.mintcounterOff'), locale }, { mintcounter: mintCountChannel.id });
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-info mintcounter', changeMessage, 'configure-info-mintcounter');
          await interaction.editReply({ embeds: [embed] });
        } catch (error) {
          interaction.client.logger.info(error);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-info mintcounter', i18n.__({ phrase: 'configure.policy.mintcounter.errorChannelPermissions', locale }), 'configure-info-mintcounter');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-info mintcounter', i18n.__({ phrase: 'configure.policy.mintcounter.errorWrongChannelType', locale }), 'configure-info-mintcounter');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding an epoch clock to your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
};
