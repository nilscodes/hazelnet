import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const addressRemoval = discordServer.settings?.PROTECTION_ADDR_REMOVAL === 'true';
      const auditChannel = discordServer.settings?.PROTECTION_AUDIT_CHANNEL;
      const settingFields = [{
        name: i18n.__({ phrase: 'configure.protection.status.protectionTitle', locale }),
        value: i18n.__({ phrase: (addressRemoval ? 'configure.protection.addressremove.protectionOn' : 'configure.protection.addressremove.protectionOff'), locale }),
      }, {
        name: i18n.__({ phrase: 'configure.protection.status.auditChannelTitle', locale }),
        value: i18n.__({ phrase: (auditChannel?.length ? 'configure.protection.auditchannel.auditChannelOn' : 'configure.protection.auditchannel.auditChannelOff'),    }, { auditChannel }),
      }];
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-protection status', i18n.__({ phrase: 'configure.protection.status.purpose', locale }), 'configure-protection-status', settingFields);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting server settings. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
