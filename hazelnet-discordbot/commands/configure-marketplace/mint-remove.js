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

      const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild.id))
        .filter((channel) => channel.type === 'MINT');

      const marketplaceChannelOptionsPromise = marketplaceChannels.map(async (marketplaceChannel) => {
        const projectData = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === marketplaceChannel.policyId);
        const projectName = projectData ? projectData.projectName : marketplaceChannel.policyId;
        const announceChannel = await interaction.guild.channels.fetch(marketplaceChannel.channelId);
        const channelName = announceChannel ? announceChannel.name : i18n.__({ phrase: 'configure.marketplace.mint.remove.deletedChannel', locale });
        const description = i18n.__({ phrase: 'configure.marketplace.mint.remove.entry', locale }, { channelName });
        return {
          label: i18n.__({ phrase: 'configure.marketplace.mint.remove.entryTitle', locale }, { projectName, marketplaceChannel }).substring(0, 100),
          description: description.substring(0, 100),
          value: `marketplace-channel-id-${marketplaceChannel.id}`,
        };
      });
      const marketplaceChannelOptions = await Promise.all(marketplaceChannelOptionsPromise);

      if (marketplaceChannels.length) {
        const components = [new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
              .setCustomId('configure-marketplace/mint-remove/remove')
              .setPlaceholder(i18n.__({ phrase: 'configure.marketplace.mint.remove.chooseMarketplaceChannel', locale }))
              .addOptions(marketplaceChannelOptions),
          )];

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint remove', i18n.__({ phrase: 'configure.marketplace.mint.remove.purpose', locale }), 'configure-marketplace-mint-remove');
        await interaction.editReply({ embeds: [embed], components, ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint remove', i18n.__({ phrase: 'configure.marketplace.mint.list.noMarketplaceChannels', locale }), 'configure-marketplace-mint-remove');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting mint channel list. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-marketplace/mint-remove/remove') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      try {
        const marketplaceChannelId = +interaction.values[0].substr(23);
        const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild.id))
          .filter((channel) => channel.type === 'MINT');
        const marketplaceChannelToDelete = marketplaceChannels.find((marketplaceChannel) => marketplaceChannel.id === marketplaceChannelId);
        if (marketplaceChannelToDelete) {
          await interaction.client.services.discordserver.deleteMarketplaceChannel(interaction.guild.id, marketplaceChannelToDelete.id);

          const projectData = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === marketplaceChannelToDelete.policyId);
          const projectName = projectData ? projectData.projectName : marketplaceChannelToDelete.policyId;

          const content = i18n.__({ phrase: 'configure.marketplace.mint.remove.deleted', locale }, { projectName, channel: marketplaceChannelToDelete.channelId });

          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint remove', i18n.__({ phrase: 'configure.marketplace.mint.remove.success', locale }), 'configure-marketplace-mint-remove', [{
            name: i18n.__({ phrase: 'configure.marketplace.mint.list.entryTitle', locale }, { projectName, marketplaceChannel: marketplaceChannelToDelete }),
            value: content,
          }]);
          await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint remove', i18n.__({ phrase: 'configure.marketplace.mint.remove.otherError', locale }), 'configure-marketplace-mint-remove');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    }
  },
};
