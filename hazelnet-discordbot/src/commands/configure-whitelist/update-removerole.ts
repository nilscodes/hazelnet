import NodeCache from 'node-cache';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, MessageActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
import whitelistUtil from '../../utility/whitelist';
import embedBuilder from '../../utility/embedbuilder';

interface WhitelistUpdateRemoveRoleCommand extends BotSubcommand {
  cache: NodeCache
}

export default <WhitelistUpdateRemoveRoleCommand> {
  cache: new NodeCache({ stdTTL: 300 }),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const { components } = whitelistUtil.getDiscordWhitelistListParts(discordServer, whitelists, 'configure-whitelist/update-removerole/chooserole', 'configure.whitelist.update.removerole.chooseWhitelist');
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update removerole', i18n.__({ phrase: 'configure.whitelist.update.removerole.purpose', locale }), 'configure-whitelist-update-removerole');
      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting whitelist list to remove role from. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    await interaction.deferUpdate();
    const guild = interaction.guild!;
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(guild.id);
    const locale = discordServer.getBotLanguage();
    if (interaction.customId === 'configure-whitelist/update-removerole/chooserole') {
      const whitelistId = +interaction.values[0].substring('configure-whitelist-'.length);
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const whitelist = whitelists.find((whitelistForDetails) => whitelistForDetails.id === whitelistId);
      if (whitelist) {
        if (whitelist.requiredRoles.length) {
          const roles = [];
          for (let i = 0; i < whitelist.requiredRoles.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            const role = await guild.roles.fetch(whitelist.requiredRoles[i].roleId);
            if (role) {
              roles.push(role);
            }
          }
          const components = [new ActionRowBuilder()
            .addComponents(
              new SelectMenuBuilder()
                .setCustomId('configure-whitelist/update-removerole/complete')
                .setPlaceholder(i18n.__({ phrase: '', locale }))
                .addOptions(roles.map((role) => ({
                  label: role.name,
                  value: `${whitelist.id}-${role.id}`,
                }))),
            ),
          ] as ActionRowBuilder<MessageActionRowComponentBuilder>[];
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update removerole', i18n.__({ phrase: 'configure.whitelist.update.removerole.chooseRolePurpose', locale }, whitelist as any), 'configure-whitelist-update-removerole');
          await interaction.editReply({ embeds: [embedAdmin], components });
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update removerole', i18n.__({ phrase: 'configure.whitelist.update.removerole.noRoles', locale }), 'configure-whitelist-update-removerole');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      }
    } else if (interaction.customId === 'configure-whitelist/update-removerole/complete') {
      const [whitelistId, roleToRemove] = interaction.values[0].split('-');
      const whitelists = await interaction.client.services.discordserver.listWhitelists(interaction.guild!.id);
      const whitelist = whitelists.find((whitelistForDetails) => whitelistForDetails.id === +whitelistId);
      if (whitelist) {
        const requiredRoles = whitelist.requiredRoles.filter((role) => role.roleId !== roleToRemove);
        if (requiredRoles.length !== whitelist.requiredRoles.length) {
          await interaction.client.services.discordserver.updateWhitelist(guild.id, whitelist.id, { requiredRoles });
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-whitelist update removerole', i18n.__({ phrase: 'configure.whitelist.update.removerole.success', locale }, { roleId: roleToRemove, whitelist } as any), 'configure-whitelist-update-addrole');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      }
    }
  },
};
