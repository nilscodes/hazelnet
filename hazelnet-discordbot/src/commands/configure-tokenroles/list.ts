/* eslint-disable no-await-in-loop */
import i18n from 'i18n';
import { TokenOwnershipRole } from '@vibrantnet/core';
import { ActionRowBuilder, MessageActionRowComponentBuilder, StringSelectMenuBuilder } from 'discord.js';
import { BotSubcommand } from '../../utility/commandtypes';
import tokenroles from '../../utility/tokenroles';
import embedBuilder from '../../utility/embedbuilder';

interface ConfigureTokenrolesListCommand extends BotSubcommand {
  createDetailsDropdown(tokenRoles: TokenOwnershipRole[], locale: string): ActionRowBuilder<MessageActionRowComponentBuilder>[]
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
      let customTokenRoleMessage: string | false = false;

      if (tokenRoles.length > maxDetailedRolesOnOnePage) {
        customTokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetailsShortSelect';
      }

      if (tokenRoles.length) {
        const CHUNK_SIZE = 20;
        let page = 0;
        while (tokenRoles.length) {
          const currentTokenRoles = tokenRoles.splice(0, CHUNK_SIZE);
          const tokenRoleFieldsNested = currentTokenRoles.map((tokenRole) => tokenroles.getTokenRoleDetailsFields(tokenRole, tokenPolicies, locale, false, customTokenRoleMessage));
          const tokenRoleFields = tokenRoleFieldsNested.flat();
          if (!discordServer.premium && tokenRoles.length > 1 && page === 0) {
            const lowestTokenRoleId = Math.min(...tokenRoles.map((tokenRole) => +tokenRole.id));
            const lowestIdTokenRole = tokenRoles.find((tokenRole) => tokenRole.id === lowestTokenRoleId);
            tokenRoleFields.unshift({
              name: i18n.__({phrase: 'generic.blackEditionWarning', locale}),
              value: i18n.__({
                phrase: 'configure.tokenroles.list.noPremium',
                locale
              }, {tokenRole: lowestIdTokenRole} as any),
            });
          }
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles list', i18n.__({
            phrase: 'configure.tokenroles.list.purpose',
            locale
          }), 'configure-tokenroles-list', tokenRoleFields);
          const components = this.createDetailsDropdown(currentTokenRoles, discordServer.getBotLanguage());
          if (page === 0) {
            await interaction.editReply({embeds: [embed], components});
          } else {
            await interaction.followUp({embeds: [embed], components, ephemeral: true});
          }
          page += 1;
        }
      } else {
        const tokenRoleFields = [{
          name: i18n.__({ phrase: 'configure.tokenroles.list.noTokenRolesTitle', locale }),
          value: i18n.__({ phrase: 'configure.tokenroles.list.noTokenRolesDetail', locale })
        }];
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles list', i18n.__({
          phrase: 'configure.tokenroles.list.purpose',
          locale
        }), 'configure-tokenroles-list', tokenRoleFields);
        await interaction.editReply({embeds: [embed]});
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting auto-role-assignment for token owners. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  createDetailsDropdown(tokenRoles, locale) {
    if (tokenRoles.length > 0) {
      return [new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
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
      await interaction.followUp({ content: 'Error while showing token role details. Please contact your bot admin via https://www.vibrantnet.io.', ephemeral: true });
    }
  },
};
