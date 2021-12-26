const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const addressRemoval = discordServer.settings?.PROTECTION_ADDR_REMOVAL === 'true';
      const auditChannel = discordServer.settings?.PROTECTION_AUDIT_CHANNEL;
      const settingFields = [{
        name: i18n.__({ phrase: 'configure.protection.status.protectionTitle', locale: useLocale }),
        value: i18n.__({ phrase: (addressRemoval ? 'configure.protection.addressremove.protectionOn' : 'configure.protection.addressremove.protectionOff'), locale: useLocale }),
      }, {
        name: i18n.__({ phrase: 'configure.protection.status.auditChannelTitle', locale: useLocale }),
        value: i18n.__({ phrase: (addressRemoval ? 'configure.protection.auditchannel.auditChannelOn' : 'configure.protection.auditchannel.auditChannelOff'), locale: useLocale }, { auditChannel }),
      }];
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-protection status', i18n.__({ phrase: 'configure.protection.status.purpose', locale: useLocale }), settingFields);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting server settings. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
