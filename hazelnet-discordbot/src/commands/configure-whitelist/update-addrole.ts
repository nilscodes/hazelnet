import NodeCache from 'node-cache';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import whitelistUtil from '../../utility/whitelist';
import embedBuilder from '../../utility/embedbuilder';

interface WhitelistUpdateAddRoleCommand extends BotSubcommand {
  cache: NodeCache
}

export default <WhitelistUpdateAddRoleCommand> {
  cache: new NodeCache({ stdTTL: 300 }),
  async execute(interaction) {
    const requiredRole = interaction.options.getRole('required-role', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const { components } = whitelistUtil.getDiscordWhitelistListParts(discordServer, whitelists, 'configure-whitelist/update-addrole/complete', 'configure.whitelist.update.addrole.chooseWhitelist');
      this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, `${requiredRole.id}`);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update addrole', i18n.__({ phrase: 'configure.whitelist.update.addrole.purpose', locale }, { roleId: requiredRole.id }), 'configure-whitelist-update-addrole');
      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting whitelist list to add role to. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-whitelist/update-addrole/complete') {
      await interaction.deferUpdate();
      const guildId = interaction.guild!.id;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guildId);
      const locale = discordServer.getBotLanguage();
      const whitelistId = +interaction.values[0].substring('configure-whitelist-'.length);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const whitelist = whitelists.find((whitelistForDetails) => whitelistForDetails.id === whitelistId);
      if (whitelist) {
        if (whitelist.requiredRoles.length < 20) {
          const roleToAdd = this.cache.take(`${guildId}-${interaction.user.id}`) as string;
          const roleAlreadyExists = whitelist.requiredRoles.find((role) => role.roleId === roleToAdd);
          if (!roleAlreadyExists) {
            const requiredRoles = whitelist.requiredRoles.concat([{ roleId: roleToAdd }]);
            await interaction.client.services.discordserver.updateWhitelist(guildId, whitelist.id, { requiredRoles });
            const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update addrole', i18n.__({ phrase: 'configure.whitelist.update.addrole.success', locale }, { roleId: roleToAdd, whitelist } as any), 'configure-whitelist-update-addrole');
            await interaction.editReply({ embeds: [embedAdmin], components: [] });
          } else {
            const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update addrole', i18n.__({ phrase: 'configure.whitelist.update.addrole.roleExists', locale }, { roleId: roleToAdd, whitelist } as any), 'configure-whitelist-update-addrole');
            await interaction.editReply({ embeds: [embedAdmin], components: [] });
          }
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update addrole', i18n.__({ phrase: 'configure.whitelist.update.addrole.tooManyRoles', locale }), 'configure-whitelist-update-addrole');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      }
    }
  },
};
