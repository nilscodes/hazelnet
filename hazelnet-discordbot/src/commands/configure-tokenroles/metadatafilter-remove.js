const i18n = require('i18n');
const {
  ActionRowBuilder, SelectMenuBuilder,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const tokenroles = require('../../utility/tokenroles');

module.exports = {
  async execute(interaction) {
    const tokenRoleId = interaction.options.getInteger('token-role-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const tokenRoles = await interaction.client.services.discordserver.listTokenOwnershipRoles(interaction.guild.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const tokenRoleToRemoveFilterFrom = tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToRemoveFilterFrom) {
        const tokenRoleInfo = tokenroles.getTokenRoleDetailsFields(tokenRoleToRemoveFilterFrom, tokenPolicies, locale, true);
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
      return [new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('configure-tokenroles/metadatafilter-remove/remove')
            .setPlaceholder(i18n.__({ phrase: 'configure.tokenroles.metadatafilter.remove.chooseRemove', locale }))
            .addOptions(tokenRole.filters.map((filter) => {
              const operatorText = i18n.__({ phrase: `configure.tokenroles.metadatafilter.add.metadataOperator-${filter.operator}`, locale });
              return {
                label: i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.metadataFiltersContent', locale }, { filter, operatorText, attributeValue: filter.attributeValue }).substring(0, 100),
                description: i18n.__({ phrase: 'configure.tokenroles.metadatafilter.remove.valueRepeat', locale }, { attributeValue: filter.attributeValue }).substring(0, 100),
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
      const tokenRoles = await interaction.client.services.discordserver.listTokenOwnershipRoles(interaction.guild.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const ids = interaction.values[0].replace('metadata-filter-id-', '').split('-');
      const tokenRoleId = +ids[0];
      const tokenRoleToRemoveFilterFrom = tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToRemoveFilterFrom) {
        const filterId = +ids[1];
        await interaction.client.services.discordserver.deleteTokenRoleMetadataFilter(interaction.guild.id, tokenRoleToRemoveFilterFrom.id, filterId);
        tokenRoleToRemoveFilterFrom.filters = tokenRoleToRemoveFilterFrom.filters.filter((metadataFilter) => metadataFilter.id !== filterId);
        const tokenRoleFields = tokenroles.getTokenRoleDetailsFields(tokenRoleToRemoveFilterFrom, tokenPolicies, locale, true);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles metadatafilter remove', i18n.__({ phrase: 'configure.tokenroles.metadatafilter.remove.success', locale }), 'configure-tokenroles-metadatafilter-remove', tokenRoleFields);
        interaction.editReply({ components: [], ephemeral: true });
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
