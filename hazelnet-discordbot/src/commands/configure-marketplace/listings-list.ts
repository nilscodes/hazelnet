import i18n from 'i18n';
import { DiscordMarketplaceChannelType, DiscordServer, MarketplaceChannel, TokenPolicy } from '../../utility/sharedtypes';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';
import marketplaceUtil from '../../utility/marketplace';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id) ;
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();

      const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild!.id))
        .filter((channel) => channel.type === DiscordMarketplaceChannelType.LISTINGS);

      const marketplaceChannelFields = marketplaceChannels.map((marketplaceChannel) => marketplaceUtil.getMarketplaceChannelDetailsField(discordServer, tokenPolicies, marketplaceChannel, 'list.entry', 'add'));

      if (marketplaceChannels.length) {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings list', i18n.__({ phrase: 'configure.marketplace.listings.list.purpose', locale }), 'configure-marketplace-listings-list', marketplaceChannelFields);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings list', i18n.__({ phrase: 'configure.marketplace.listings.list.noMarketplaceChannels', locale }), 'configure-marketplace-listings-list');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting listings channel list. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
