import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const newStatus = interaction.options.getBoolean('status') ?? true;
    const auditChannel = interaction.options.getChannel('auditchannel', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild!.id, 'PROTECTION_AUDIT_CHANNEL', newStatus === false ? '' : auditChannel.id);
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const useLocale = discordServer.getBotLanguage();
      const changeMessage = i18n.__({ phrase: (newStatus ? 'configure.protection.auditchannel.auditChannelOn' : 'configure.protection.auditchannel.auditChannelOff'), locale: useLocale }, { auditChannel: auditChannel.id });
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-protection auditchannel', changeMessage, 'configure-protection-auditchannel');
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adjusting audit info channel setting for your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
