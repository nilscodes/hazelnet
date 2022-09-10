const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const newStatus = interaction.options.getBoolean('status');
    if (newStatus !== undefined) {
      try {
        await interaction.deferReply({ ephemeral: true });
        const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
        const useLocale = discordServer.getBotLanguage();
        await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild.id, 'PROTECTION_ADDR_REMOVAL', newStatus);
        const changeMessage = i18n.__({ phrase: (newStatus ? 'configure.protection.addressremove.protectionOn' : 'configure.protection.addressremove.protectionOff'), locale: useLocale });
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-protection addressremove', changeMessage, 'configure-protection-addressremove');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        interaction.client.logger.error(error);
        await interaction.editReply({ content: 'Error while adjusting address protection setting for your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
      }
    } else {
      await interaction.reply({ content: `New address protection status ${newStatus} is not valid. Please only send True or False for the status parameter.`, ephemeral: true });
    }
  },
};
