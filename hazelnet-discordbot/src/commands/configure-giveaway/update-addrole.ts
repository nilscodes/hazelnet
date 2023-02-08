import NodeCache from 'node-cache';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import giveawayutil, { Giveaway } from '../../utility/giveaway';
import embedBuilder from '../../utility/embedbuilder';

interface GiveawayUpdateAddRoleCommand extends BotSubcommand {
  cache: NodeCache
}

export default <GiveawayUpdateAddRoleCommand> {
  cache: new NodeCache({ stdTTL: 300 }),
  async execute(interaction) {
    const requiredRole = interaction.options.getRole('required-role', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const giveaways = await interaction.client.services.discordserver.getGiveaways(interaction.guild!.id);
      const { components } = giveawayutil.getDiscordGiveawayListParts(discordServer, giveaways, 'configure-giveaway/update-addrole/complete', 'configure.giveaway.update.addrole.chooseGiveaway');
      this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, `${requiredRole.id}`);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway update addrole', i18n.__({ phrase: 'configure.giveaway.update.addrole.purpose', locale }, { roleId: requiredRole.id }), 'configure-giveaway-update-addrole');
      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting giveaway list to add role to. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-giveaway/update-addrole/complete') {
      await interaction.deferUpdate();
      const guildId = interaction.guild!.id;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guildId);
      const locale = discordServer.getBotLanguage();
      const giveawayId = +interaction.values[0].substring('configure-giveaway-'.length);
      const giveaways = await interaction.client.services.discordserver.getGiveaways(guildId) ;
      const giveaway = giveaways.find((giveawayForDetails) => giveawayForDetails.id === giveawayId);
      if (giveaway) {
        if (giveaway.requiredRoles.length < 20) {
          const roleToAdd = this.cache.take(`${guildId}-${interaction.user.id}`) as string;
          const roleAlreadyExists = giveaway.requiredRoles.find((role) => role.roleId === roleToAdd);
          if (!roleAlreadyExists) {
            const requiredRoles = giveaway.requiredRoles.concat([{ roleId: roleToAdd }]);
            await interaction.client.services.discordserver.updateGiveaway(guildId, giveaway.id, { requiredRoles });
            const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway update addrole', i18n.__({ phrase: 'configure.giveaway.update.addrole.success', locale }, { roleId: roleToAdd, giveaway } as any), 'configure-giveaway-update-addrole');
            await interaction.editReply({ embeds: [embedAdmin], components: [] });
          } else {
            const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway update addrole', i18n.__({ phrase: 'configure.giveaway.update.addrole.roleExists', locale }, { roleId: roleToAdd, giveaway } as any), 'configure-giveaway-update-addrole');
            await interaction.editReply({ embeds: [embedAdmin], components: [] });
          }
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway update addrole', i18n.__({ phrase: 'configure.giveaway.update.addrole.tooManyRoles', locale }), 'configure-giveaway-update-addrole');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      }
    }
  },
};
