import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const newStatus = interaction.options.getBoolean('status', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild!.id, 'PROTECTION_ADDR_REMOVAL', `${newStatus}`);
      const changeMessage = i18n.__({ phrase: (newStatus ? 'configure.protection.addressremove.protectionOn' : 'configure.protection.addressremove.protectionOff'), locale });
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-protection addressremove', changeMessage, 'configure-protection-addressremove');
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adjusting address protection setting for your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
};
