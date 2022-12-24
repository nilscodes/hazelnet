const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const marketplaceUtil = require('../../utility/marketplace');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild.id);
      const locale = discordServer.getBotLanguage();

      const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild.id))
        .filter((channel) => channel.type === 'LISTINGS');

      const marketplaceChannelFields = marketplaceChannels.map((marketplaceChannel) => marketplaceUtil.getMarketplaceChannelDetailsField(discordServer, tokenPolicies, marketplaceChannel, 'list.entry', 'add'));

      if (marketplaceChannels.length) {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings list', i18n.__({ phrase: 'configure.marketplace.listings.list.purpose', locale }), 'configure-marketplace-listings-list', marketplaceChannelFields);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings list', i18n.__({ phrase: 'configure.marketplace.listings.list.noMarketplaceChannels', locale }), 'configure-marketplace-listings-list');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting listings channel list. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
