import i18n from 'i18n';
import { TokenOwnershipRole } from '../../utility/sharedtypes';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, MessageActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
import tokenroles from '../../utility/tokenroles';
import embedBuilder from '../../utility/embedbuilder';


interface ConfigureTokenrolesListCommand extends BotSubcommand {
  createDetailsDropdown(tokenRoles: TokenOwnershipRole[], locale: string, maxForDropdown: number): ActionRowBuilder<MessageActionRowComponentBuilder>[]
}

export default <ConfigureTokenrolesListCommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenRoles = await interaction.client.services.discordserver.listTokenOwnershipRoles(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const maxDetailedRolesOnOnePage = 5;
      const maxForDropdown = 25;
      let customTokenRoleMessage: string | false = false;

      if (tokenRoles.length > maxForDropdown) {
        customTokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetailsShortCommand';
      } else if (tokenRoles.length > maxDetailedRolesOnOnePage) {
        customTokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetailsShortSelect';
      }

      const tokenRoleFieldsNested = tokenRoles.map((tokenRole) => tokenroles.getTokenRoleDetailsFields(tokenRole, tokenPolicies, locale, false, customTokenRoleMessage));
      const tokenRoleFields = tokenRoleFieldsNested.flat();
      if (!tokenRoleFields.length) {
        tokenRoleFields.push({ name: i18n.__({ phrase: 'configure.tokenroles.list.noTokenRolesTitle', locale }), value: i18n.__({ phrase: 'configure.tokenroles.list.noTokenRolesDetail', locale }) });
      } else if (tokenRoleFields.length > 25) {
        const moreCount = tokenRoleFields.length - 24;
        tokenRoleFields.splice(24);
        tokenRoleFields.push({ name: i18n.__({ phrase: 'configure.tokenroles.list.moreRolesTitle', locale }), value: i18n.__({ phrase: 'configure.tokenroles.list.moreRoles', locale }, { moreCount } as any) });
      }
      if (!discordServer.premium && tokenRoles.length > 1) {
        const lowestTokenRoleId = Math.min(...tokenRoles.map((tokenRole) => +tokenRole.id));
        const lowestIdTokenRole = tokenRoles.find((tokenRole) => tokenRole.id === lowestTokenRoleId);
        tokenRoleFields.unshift({
          name: i18n.__({ phrase: 'generic.blackEditionWarning', locale }),
          value: i18n.__({ phrase: 'configure.tokenroles.list.noPremium', locale }, { tokenRole: lowestIdTokenRole } as any),
        });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles list', i18n.__({ phrase: 'configure.tokenroles.list.purpose', locale }), 'configure-tokenroles-list', tokenRoleFields);
      const components = this.createDetailsDropdown(tokenRoles, discordServer.getBotLanguage(), maxForDropdown);
      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting auto-role-assignment for token owners. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  createDetailsDropdown(tokenRoles, locale, maxForDropdown) {
    if (tokenRoles.length > 0 && tokenRoles.length <= maxForDropdown) {
      return [new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('configure-tokenroles/list/details')
            .setPlaceholder(i18n.__({ phrase: 'configure.tokenroles.list.chooseDetails', locale }))
            .addOptions(tokenRoles.map((tokenRole) => ({
              label: i18n.__({ phrase: 'configure.tokenroles.list.chooseText', locale }, { tokenRole } as any),
              value: `token-role-id-${tokenRole.id}`,
            }))),
        ),
      ];
    }
    return undefined;
  },
  async executeSelectMenu(interaction) {
    try {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenRoles = await interaction.client.services.discordserver.listTokenOwnershipRoles(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const tokenRoleId = +interaction.values[0].replace('token-role-id-', '');
      const tokenRoleToShow = tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToShow) {
        const tokenRoleFields = tokenroles.getTokenRoleDetailsFields(tokenRoleToShow, tokenPolicies, locale, true);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles list', i18n.__({ phrase: 'configure.tokenroles.list.detailsPurpose', locale }), 'configure-tokenroles-list', tokenRoleFields);
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles list', i18n.__({ phrase: 'configure.tokenroles.list.errorNotFound', locale }, { tokenRoleId } as any), 'configure-tokenroles-list');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [] });
      await interaction.followUp({ content: 'Error while showing token role details. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
