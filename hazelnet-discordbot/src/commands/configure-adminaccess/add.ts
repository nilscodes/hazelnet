import { BotSubcommand } from "../../utility/commandtypes";
import i18n from 'i18n';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const newAdminRole = interaction.options.getRole('admin-role', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();

      const adminRoleIds = (discordServer?.settings?.ADMIN_ROLES?.split(',')) ?? [];
      if (!adminRoleIds.includes(newAdminRole.id)) {
        const guild = await interaction.client.guilds.fetch(discordServer.guildId);
        const guildRoles = await guild.roles.fetch();
        adminRoleIds.push(newAdminRole.id); // Add the new role
        const newAdminRoleList = adminRoleIds.filter((roleId: string) => (guildRoles.some((guildRole) => (guildRole.id === roleId)))); // Filter out non-existent roles while we're updating anyway
        await interaction.client.services.discordserver.updateDiscordServerSetting(interaction.guild!.id, 'ADMIN_ROLES', newAdminRoleList.join(','));
        discordServer.settings.ADMIN_ROLES = newAdminRoleList.join(',');
        const adminFields = [{
          name: i18n.__({ phrase: 'configure.adminaccess.list.administratorTitle', locale }),
          value: newAdminRoleList.map((roleId: string) => (i18n.__({ phrase: 'configure.adminaccess.list.administratorEntry', locale }, { roleId }))).join('\n'),
        }];
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-adminaccess add', i18n.__({ phrase: 'configure.adminaccess.add.success', locale }, { roleId: newAdminRole.id }), 'configure-adminaccess-add', adminFields);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-adminaccess add', i18n.__({ phrase: 'configure.adminaccess.add.alreadyExists', locale }, { roleId: newAdminRole.id }), 'configure-adminaccess-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while changing admin access list.' });
    }
  },
};
