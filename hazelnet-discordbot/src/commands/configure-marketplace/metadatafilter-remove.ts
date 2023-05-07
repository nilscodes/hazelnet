import i18n from 'i18n';
import { DiscordServer, MarketplaceChannel, TokenPolicy } from '@vibrantnet/core';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, MessageActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
import embedBuilder from '../../utility/embedbuilder';
import marketplace from '../../utility/marketplace';

interface ConfigureMarketplaceMetadataFilterRemoveCommand extends BotSubcommand {
  createRemoveDropdown(tokenRole: MarketplaceChannel, locale: string): ActionRowBuilder<MessageActionRowComponentBuilder>[]
}

export default <ConfigureMarketplaceMetadataFilterRemoveCommand> {
  async execute(interaction) {
    const trackerId = interaction.options.getInteger('tracker-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id) ;
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();

      const marketplaceChannelToRemoveFilterFrom = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild!.id))
        .find((channel) => channel.id === trackerId);
      if (marketplaceChannelToRemoveFilterFrom) {
        const marketplaceChannelInfo = [
          marketplace.getMarketplaceChannelDetailsField(discordServer, tokenPolicies, marketplaceChannelToRemoveFilterFrom, 'list.entry', 'add'),
        ];
        const components = this.createRemoveDropdown(marketplaceChannelToRemoveFilterFrom, discordServer.getBotLanguage());
        if (!components.length) {
          marketplaceChannelInfo.push({
            name: i18n.__({ phrase: 'configure.marketplace.metadatafilter.remove.errorNoFiltersTitle', locale }),
            value: i18n.__({ phrase: 'configure.marketplace.metadatafilter.remove.errorNoFilters', locale }),
          });
        }
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace metadatafilter remove', i18n.__({ phrase: 'configure.marketplace.metadatafilter.remove.purpose', locale }), 'configure-marketplace-metadatafilter-remove', marketplaceChannelInfo);
        await interaction.editReply({ embeds: [embed], components });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace metadatafilter remove', i18n.__({ phrase: 'configure.marketplace.metadatafilter.remove.errorNotFound', locale }, { trackerId } as any), 'configure-marketplace-metadatafilter-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while removing metadata filter from tracker with ID ${trackerId} on your server. Please contact your bot admin via https://www.hazelnet.io.` });
    }
  },
  createRemoveDropdown(marketplaceChannel, locale) {
    if (marketplaceChannel.filters?.length) {
      return [new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('configure-marketplace/metadatafilter-remove/remove')
            .setPlaceholder(i18n.__({ phrase: 'configure.marketplace.metadatafilter.remove.chooseRemove', locale }))
            .addOptions(marketplaceChannel.filters.map((filter) => {
              const operatorText = i18n.__({ phrase: `configure.marketplace.metadatafilter.add.metadataOperator-${filter.operator}`, locale });
              return {
                label: i18n.__({ phrase: 'configure.marketplace.metadatafilter.add.metadataFiltersContent', locale }, { filter, operatorText, attributeValue: filter.attributeValue } as any).substring(0, 100),
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
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const ids = interaction.values[0].replace('metadata-filter-id-', '').split('-');
      const trackerId = +ids[0];
      const marketplaceChannelToRemoveFilterFrom = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild!.id))
        .find((channel) => channel.id === trackerId);
      if (marketplaceChannelToRemoveFilterFrom) {
        const filterId = +ids[1];
        await interaction.client.services.discordserver.deleteMarketplaceChannelMetadataFilter(interaction.guild!.id, marketplaceChannelToRemoveFilterFrom.id!, filterId);
        marketplaceChannelToRemoveFilterFrom.filters = marketplaceChannelToRemoveFilterFrom.filters?.filter((metadataFilter) => metadataFilter.id !== filterId);
        const marketplaceChannelFields = [marketplace.getMarketplaceChannelDetailsField(discordServer, tokenPolicies, marketplaceChannelToRemoveFilterFrom, 'add.success', 'add')];
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace metadatafilter remove', i18n.__({ phrase: 'configure.marketplace.metadatafilter.remove.success', locale }), 'configure-marketplace-metadatafilter-remove', marketplaceChannelFields);
        interaction.editReply({ components: [] });
        await interaction.followUp({ embeds: [embed], components: [], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace metadatafilter remove', i18n.__({ phrase: 'configure.marketplace.list.errorNotFound', locale }, { tokenRoleId: trackerId } as any), 'configure-marketplace-metadatafilter-remove');
        await interaction.editReply({ embeds: [embed], components: [] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [] });
      await interaction.editReply({ content: 'Error while removing metadata filter from tracker on your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
