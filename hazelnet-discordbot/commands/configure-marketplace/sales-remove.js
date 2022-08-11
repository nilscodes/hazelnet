const NodeCache = require('node-cache');
const i18n = require('i18n');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();

      const marketplaceChannels = await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild.id);

      const marketplaceChannelOptionsPromise = marketplaceChannels.map(async (marketplaceChannel) => {
        const projectData = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === marketplaceChannel.policyId);
        const projectName = projectData ? projectData.projectName : marketplaceChannel.policyId;
        const marketplaceName = i18n.__({ phrase: `marketplaces.${marketplaceChannel.marketplace}`, locale });
        const announceChannel = await interaction.guild.channels.fetch(marketplaceChannel.channelId);
        const channelName = announceChannel ? announceChannel.name : i18n.__({ phrase: 'configure.marketplace.sales.remove.deletedChannel', locale });
        const description = i18n.__({ phrase: 'configure.marketplace.sales.remove.entry', locale }, { marketplaceName, channelName })
          + (marketplaceChannel.minimumValue ? i18n.__({ phrase: 'configure.marketplace.sales.remove.entryAddon', locale }, { minimumPriceAda: discordServer.formatNumber(Math.floor(marketplaceChannel.minimumValue / 1000000)) }) : '');
        return {
          label: i18n.__({ phrase: 'configure.marketplace.sales.remove.entryTitle', locale }, { projectName, marketplaceChannel }).substring(0, 100),
          description: description.substring(0, 100),
          value: `marketplace-channel-id-${marketplaceChannel.id}`,
        };
      });
      const marketplaceChannelOptions = await Promise.all(marketplaceChannelOptionsPromise);

      if (marketplaceChannels.length) {
        const components = [new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
              .setCustomId('configure-marketplace/sales-remove/remove')
              .setPlaceholder(i18n.__({ phrase: 'configure.marketplace.sales.remove.chooseMarketplaceChannel', locale }))
              .addOptions(marketplaceChannelOptions),
          )];

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales remove', i18n.__({ phrase: 'configure.marketplace.sales.remove.purpose', locale }), 'configure-marketplace-sales-remove');
        await interaction.editReply({ embeds: [embed], components, ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales remove', i18n.__({ phrase: 'configure.marketplace.sales.list.noMarketplaceChannels', locale }), 'configure-marketplace-sales-remove');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting sales channel list. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-marketplace/sales-remove/remove') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      try {
        const marketplaceChannelId = +interaction.values[0].substr(23);
        const marketplaceChannels = await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild.id);
        const marketplaceChannelToDelete = marketplaceChannels.find((marketplaceChannel) => marketplaceChannel.id === marketplaceChannelId);
        if (marketplaceChannelToDelete) {
          await interaction.client.services.discordserver.deleteMarketplaceChannel(interaction.guild.id, marketplaceChannelToDelete.id);

          const projectData = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === marketplaceChannelToDelete.policyId);
          const projectName = projectData ? projectData.projectName : marketplaceChannelToDelete.policyId;

          const marketplaceName = i18n.__({ phrase: `marketplaces.${marketplaceChannelToDelete.marketplace}`, locale });
          const content = i18n.__({ phrase: 'configure.marketplace.sales.remove.deleted', locale }, { projectName, marketplaceName, channel: marketplaceChannelToDelete.channelId })
            + (marketplaceChannelToDelete.minimumValue ? i18n.__({ phrase: 'configure.marketplace.sales.remove.minimumPriceAddon', locale }, { minimumPriceAda: discordServer.formatNumber(Math.floor(marketplaceChannelToDelete.minimumValue / 1000000)) }) : '');

          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales remove', i18n.__({ phrase: 'configure.marketplace.sales.remove.success', locale }), 'configure-marketplace-sales-remove', [{
            name: i18n.__({ phrase: 'configure.marketplace.sales.list.entryTitle', locale }, { projectName, marketplaceChannel: marketplaceChannelToDelete }),
            value: content,
          }]);
          await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales remove', i18n.__({ phrase: 'configure.marketplace.sales.add.otherError', locale }), 'configure-marketplace-sales-remove');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    }
  },
};
