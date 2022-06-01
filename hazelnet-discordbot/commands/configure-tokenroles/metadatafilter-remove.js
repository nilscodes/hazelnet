const i18n = require('i18n');
const {
  MessageActionRow, MessageSelectMenu,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const tokenroles = require('../../utility/tokenroles');

module.exports = {
  async execute(interaction) {
    const tokenRoleId = interaction.options.getInteger('token-role-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const tokenRoleToRemoveFilterFrom = discordServer.tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToRemoveFilterFrom) {
        const tokenRoleInfo = [
          tokenroles.getTokenRoleDetailsText(tokenRoleToRemoveFilterFrom, discordServer, locale, true),
        ];
        const components = this.createRemoveDropdown(discordServer, tokenRoleToRemoveFilterFrom);
        if (!components.length) {
          tokenRoleInfo.push({
            name: i18n.__({ phrase: 'configure.tokenroles.metadatafilter.remove.errorNoFiltersTitle', locale }),
            value: i18n.__({ phrase: 'configure.tokenroles.metadatafilter.remove.errorNoFilters', locale }),
          });
        }
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter remove', i18n.__({ phrase: 'configure.tokenroles.metadatafilter.remove.purpose', locale }), 'configure-tokenroles-metadatafilter-remove', tokenRoleInfo);
        await interaction.editReply({ embeds: [embed], components, ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter remove', i18n.__({ phrase: 'configure.tokenroles.list.errorNotFound', locale }, { tokenRoleId }), 'configure-tokenroles-metadatafilter-remove');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while removing metadata filter from auto-role assignment for role with ID ${tokenRoleId} on your server. Please contact your bot admin via https://www.hazelnet.io.`, ephemeral: true });
    }
  },
  createRemoveDropdown(discordServer, tokenRole) {
    if (tokenRole.filters?.length) {
      const locale = discordServer.getBotLanguage();
      return [new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('configure-tokenroles/metadatafilter-remove/remove')
            .setPlaceholder(i18n.__({ phrase: 'configure.tokenroles.metadatafilter.remove.chooseRemove', locale }))
            .addOptions(tokenRole.filters.map((filter) => {
              const operatorText = i18n.__({ phrase: `configure.tokenroles.metadatafilter.add.metadataOperator-${filter.operator}`, locale });
              return {
                label: i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.metadataFiltersContent', locale }, { filter, operatorText }).substring(0, 100),
                value: `metadata-filter-id-${tokenRole.id}-${filter.id}`,
              };
            })),
        ),
      ];
    }
    return [];
  },
  async executeSelectMenu(interaction) {
    try {
      await interaction.deferUpdate({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const ids = interaction.values[0].replace('metadata-filter-id-', '').split('-');
      const tokenRoleId = +ids[0];
      const tokenRoleToRemoveFilterFrom = discordServer.tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToRemoveFilterFrom) {
        const filterId = +ids[1];
        await interaction.client.services.discordserver.deleteTokenRoleMetadataFilter(interaction.guild.id, tokenRoleToRemoveFilterFrom.id, filterId);
        tokenRoleToRemoveFilterFrom.filters = tokenRoleToRemoveFilterFrom.filters.filter((metadataFilter) => metadataFilter.id !== filterId);
        const tokenRoleFields = [tokenroles.getTokenRoleDetailsText(tokenRoleToRemoveFilterFrom, discordServer, locale, true)];
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter remove', i18n.__({ phrase: 'configure.tokenroles.metadatafilter.remove.success', locale }), 'configure-tokenroles-metadatafilter-remove', tokenRoleFields);
        await interaction.followUp({ embeds: [embed], components: [], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter remove', i18n.__({ phrase: 'configure.tokenroles.list.errorNotFound', locale }, { tokenRoleId }), 'configure-tokenroles-metadatafilter-remove');
        await interaction.editReply({ embeds: [embed], components: [], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [], ephemeral: true });
      await interaction.followUp({ content: 'Error while editing token role metadata. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
