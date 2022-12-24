const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const marketplace = require('../../utility/marketplace');

module.exports = {
  async execute(interaction) {
    const trackerId = interaction.options.getInteger('tracker-id');
    const attributeName = interaction.options.getString('attribute-path');
    const operator = interaction.options.getString('operator');
    const attributeValue = interaction.options.getString('attribute-value');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const marketplaceChannelToAddFilterTo = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild.id))
        .find((channel) => channel.id === trackerId);
      if (marketplaceChannelToAddFilterTo) {
        const maxFiltersPerMarketplaceChannel = await interaction.client.services.globalsettings.getGlobalSetting('MAX_FILTERS_PER_TRACKER') || 10;
        if (!marketplaceChannelToAddFilterTo.filters || marketplaceChannelToAddFilterTo.filters.length < maxFiltersPerMarketplaceChannel) {
          if (attributeName.length <= 64) {
            if (attributeValue.length <= 128) {
              const newMetadataFilter = await interaction.client.services.discordserver.addMarketplaceChannelMetadataFilter(interaction.guild.id, marketplaceChannelToAddFilterTo.id, attributeName, operator, attributeValue);
              const effectiveFilters = [...(marketplaceChannelToAddFilterTo.filters ?? []), newMetadataFilter];
              marketplaceChannelToAddFilterTo.filters = effectiveFilters;
              const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild.id);
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace metadatafilter add', i18n.__({ phrase: 'configure.marketplace.metadatafilter.add.success', locale }), 'configure-marketplace-metadatafilter-add', [
                marketplace.getMarketplaceChannelDetailsField(discordServer, tokenPolicies, marketplaceChannelToAddFilterTo, 'list.entry', 'add'),
              ]);
              await interaction.editReply({ embeds: [embed], ephemeral: true });
            } else {
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace metadatafilter add', i18n.__({ phrase: 'configure.marketplace.metadatafilter.add.errorAttributeValueLength', locale }, { maxLength: 128 }), 'configure-marketplace-metadatafilter-add');
              await interaction.editReply({ embeds: [embed], ephemeral: true });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace metadatafilter add', i18n.__({ phrase: 'configure.marketplace.metadatafilter.add.errorAttributeNameLength', locale }, { maxLength: 64 }), 'configure-marketplace-metadatafilter-add');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace metadatafilter add', i18n.__({ phrase: 'configure.marketplace.metadatafilter.add.errorLimitReached', locale }), 'configure-marketplace-metadatafilter-add');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace metadatafilter add', i18n.__({ phrase: 'configure.marketplace.metadatafilter.add.errorNotFound', locale }, { trackerId }), 'configure-marketplace-metadatafilter-add');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while adding metadata filter to tracker with ID ${trackerId} on your server. Please contact your bot admin via https://www.hazelnet.io.`, ephemeral: true });
    }
  },
};
