const NodeCache = require('node-cache');
const i18n = require('i18n');
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

      const marketplaceChannelFields = marketplaceChannels.map((marketplaceChannel) => {
        const projectData = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === marketplaceChannel.policyId);
        const projectName = projectData ? projectData.projectName : marketplaceChannel.policyId;
        const content = i18n.__({ phrase: 'configure.marketplace.mint.list.entry', locale }, { channel: marketplaceChannel.channelId });
        return {
          name: i18n.__({ phrase: 'configure.marketplace.mint.list.entryTitle', locale }, { projectName, marketplaceChannel }),
          value: content,
        };
      });

      if (marketplaceChannels.length) {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint list', i18n.__({ phrase: 'configure.marketplace.mint.list.purpose', locale }), 'configure-marketplace-mint-list', marketplaceChannelFields);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint list', i18n.__({ phrase: 'configure.marketplace.mint.list.noMarketplaceChannels', locale }), 'configure-marketplace-mint-list');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting mint channel list. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
