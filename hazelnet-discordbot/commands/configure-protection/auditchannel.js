const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const newStatus = interaction.options.getBoolean('status') ?? true;
    const auditChannel = interaction.options.getChannel('auditchannel');
    try {
      await interaction.deferReply({ ephemeral: true });
      await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild.id, 'PROTECTION_AUDIT_CHANNEL', newStatus === false ? '' : auditChannel.id);
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const changeMessage = i18n.__({ phrase: (newStatus ? 'configure.protection.auditchannel.auditChannelOn' : 'configure.protection.auditchannel.auditChannelOff'), locale: useLocale }, { auditChannel: auditChannel.id });
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-protection auditchannel', changeMessage);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adjusting audit info channel setting for your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
