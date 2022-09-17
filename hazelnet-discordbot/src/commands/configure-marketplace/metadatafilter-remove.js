const i18n = require('i18n');
const {
  ActionRowBuilder, SelectMenuBuilder,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const marketplace = require('../../utility/marketplace');

module.exports = {
  async execute(interaction) {
    const trackerId = interaction.options.getInteger('tracker-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();

      const marketplaceChannelToRemoveFilterFrom = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild.id))
        .find((channel) => channel.id === trackerId);
      if (marketplaceChannelToRemoveFilterFrom) {
        const marketplaceChannelInfo = [
          marketplace.getMarketplaceChannelDetailsField(discordServer, marketplaceChannelToRemoveFilterFrom, 'list.entry', 'add'),
        ];
        const components = this.createRemoveDropdown(discordServer, marketplaceChannelToRemoveFilterFrom);
        if (!components.length) {
          marketplaceChannelInfo.push({
            name: i18n.__({ phrase: 'configure.marketplace.metadatafilter.remove.errorNoFiltersTitle', locale }),
            value: i18n.__({ phrase: 'configure.marketplace.metadatafilter.remove.errorNoFilters', locale }),
          });
        }
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace metadatafilter remove', i18n.__({ phrase: 'configure.marketplace.metadatafilter.remove.purpose', locale }), 'configure-marketplace-metadatafilter-remove', marketplaceChannelInfo);
        await interaction.editReply({ embeds: [embed], components, ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace metadatafilter remove', i18n.__({ phrase: 'configure.marketplace.metadatafilter.remove.errorNotFound', locale }, { trackerId }), 'configure-marketplace-metadatafilter-remove');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while removing metadata filter from tracker with ID ${trackerId} on your server. Please contact your bot admin via https://www.hazelnet.io.`, ephemeral: true });
    }
  },
  createRemoveDropdown(discordServer, marketplaceChannel) {
    if (marketplaceChannel.filters?.length) {
      const locale = discordServer.getBotLanguage();
      return [new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('configure-marketplace/metadatafilter-remove/remove')
            .setPlaceholder(i18n.__({ phrase: 'configure.marketplace.metadatafilter.remove.chooseRemove', locale }))
            .addOptions(marketplaceChannel.filters.map((filter) => {
              const operatorText = i18n.__({ phrase: `configure.marketplace.metadatafilter.add.metadataOperator-${filter.operator}`, locale });
              return {
                label: i18n.__({ phrase: 'configure.marketplace.metadatafilter.add.metadataFiltersContent', locale }, { filter, operatorText, attributeValue: filter.attributeValue }).substring(0, 100),
                description: i18n.__({ phrase: 'configure.marketplace.metadatafilter.remove.valueRepeat', locale }, { attributeValue: filter.attributeValue }).substring(0, 100),
                value: `metadata-filter-id-${marketplaceChannel.id}-${filter.id}`,
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
      const trackerId = +ids[0];
      const marketplaceChannelToRemoveFilterFrom = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild.id))
        .find((channel) => channel.id === trackerId);
      if (marketplaceChannelToRemoveFilterFrom) {
        const filterId = +ids[1];
        await interaction.client.services.discordserver.deleteMarketplaceChannelMetadataFilter(interaction.guild.id, marketplaceChannelToRemoveFilterFrom.id, filterId);
        marketplaceChannelToRemoveFilterFrom.filters = marketplaceChannelToRemoveFilterFrom.filters.filter((metadataFilter) => metadataFilter.id !== filterId);
        const marketplaceChannelFields = [marketplace.getMarketplaceChannelDetailsField(discordServer, marketplaceChannelToRemoveFilterFrom, 'add.success', 'add')];
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace metadatafilter remove', i18n.__({ phrase: 'configure.marketplace.metadatafilter.remove.success', locale }), 'configure-marketplace-metadatafilter-remove', marketplaceChannelFields);
        interaction.editReply({ components: [], ephemeral: true });
        await interaction.followUp({ embeds: [embed], components: [], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace metadatafilter remove', i18n.__({ phrase: 'configure.marketplace.list.errorNotFound', locale }, { tokenRoleId: trackerId }), 'configure-marketplace-metadatafilter-remove');
        await interaction.editReply({ embeds: [embed], components: [], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [], ephemeral: true });
      await interaction.editReply({ content: 'Error while removing metadata filter from tracker on your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
