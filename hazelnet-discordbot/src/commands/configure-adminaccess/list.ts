import { BotSubcommand } from "../../utility/commandtypes";
import i18n from 'i18n';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();

      const adminRoleIds = (discordServer?.settings?.ADMIN_ROLES?.split(',')) ?? [];
      const adminFields = [{
        name: i18n.__({ phrase: 'configure.adminaccess.list.administratorTitle', locale }),
        value: adminRoleIds.map((roleId: string) => (i18n.__({ phrase: 'configure.adminaccess.list.administratorEntry', locale }, { roleId }))).join('\n'),
      }];
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-adminaccess list', i18n.__({ phrase: 'configure.adminaccess.list.purpose', locale }), 'configure-adminaccess-list', adminFields);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting admin access list.' });
    }
  },
};
