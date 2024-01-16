import { ActionRowBuilder, MessageActionRowComponentBuilder, StringSelectMenuBuilder } from 'discord.js';
import NodeCache from 'node-cache';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import giveawayutil from '../../utility/giveaway';
import embedBuilder from '../../utility/embedbuilder';

interface GiveawayUpdateRemoveRoleCommand extends BotSubcommand {
  cache: NodeCache
}

export default <GiveawayUpdateRemoveRoleCommand> {
  cache: new NodeCache({ stdTTL: 300 }),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const giveaways = await interaction.client.services.discordserver.getGiveaways(interaction.guild!.id);
      const CHUNK_SIZE = 20;
      const firstGiveaways = giveaways.splice(0, CHUNK_SIZE);
      const { components } = giveawayutil.getDiscordGiveawayListParts(discordServer, firstGiveaways, 'configure-giveaway/update-removerole/chooserole', 'configure.giveaway.update.removerole.chooseGiveaway');
      let embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway update removerole', i18n.__({ phrase: 'configure.giveaway.update.removerole.purpose', locale }), 'configure-giveaway-update-removerole');
      await interaction.editReply({ embeds: [embed], components });
      while (giveaways.length) {
        const additionalGiveaways = giveaways.splice(0, CHUNK_SIZE);
        const { components: moreComponents } = giveawayutil.getDiscordGiveawayListParts(discordServer, additionalGiveaways, 'configure-giveaway/update-removerole/chooserole', 'configure.giveaway.update.removerole.chooseGiveaway');
        embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway update removerole', i18n.__({ phrase: 'configure.giveaway.update.removerole.purposeContinued', locale }), 'configure-giveaway-update-removerole');
        // eslint-disable-next-line no-await-in-loop
        await interaction.followUp({ embeds: [embed], components: moreComponents, ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting giveaway list to remove role from. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    await interaction.deferUpdate();
    const guild = interaction.guild!;
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(guild.id);
    const locale = discordServer.getBotLanguage();
    if (interaction.customId === 'configure-giveaway/update-removerole/chooserole') {
      const giveawayId = +interaction.values[0].substring('configure-giveaway-'.length);
      const giveaways = await interaction.client.services.discordserver.getGiveaways(guild.id);
      const giveaway = giveaways.find((giveawayForDetails) => giveawayForDetails.id === giveawayId);
      if (giveaway) {
        if (giveaway.requiredRoles.length) {
          const roles = [];
          for (let i = 0; i < giveaway.requiredRoles.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            const role = await guild.roles.fetch(giveaway.requiredRoles[i].roleId);
            if (role) {
              roles.push(role);
            }
          }
          const components = [new ActionRowBuilder()
            .addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('configure-giveaway/update-removerole/complete')
                .setPlaceholder(i18n.__({ phrase: '', locale }))
                .addOptions(roles.map((role) => ({
                  label: role.name,
                  value: `${giveaway.id}-${role.id}`,
                }))),
            ),
          ] as ActionRowBuilder<MessageActionRowComponentBuilder>[];
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway update removerole', i18n.__({ phrase: 'configure.giveaway.update.removerole.chooseRolePurpose', locale }, giveaway as any), 'configure-giveaway-update-removerole');
          await interaction.editReply({ embeds: [embedAdmin], components });
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway update removerole', i18n.__({ phrase: 'configure.giveaway.update.removerole.noRoles', locale }), 'configure-giveaway-update-removerole');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      }
    } else if (interaction.customId === 'configure-giveaway/update-removerole/complete') {
      const [giveawayId, roleToRemove] = interaction.values[0].split('-');
      const giveaways = await interaction.client.services.discordserver.getGiveaways(guild.id);
      const giveaway = giveaways.find((giveawayForDetails) => giveawayForDetails.id === +giveawayId);
      if (giveaway) {
        const requiredRoles = giveaway.requiredRoles.filter((role) => role.roleId !== roleToRemove);
        if (requiredRoles.length !== giveaway.requiredRoles.length) {
          await interaction.client.services.discordserver.updateGiveaway(guild.id, giveaway.id, { requiredRoles });
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway update removerole', i18n.__({ phrase: 'configure.giveaway.update.removerole.success', locale }, { roleId: roleToRemove, giveaway } as any), 'configure-giveaway-update-addrole');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      }
    }
  },
};
