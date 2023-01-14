import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, MessageActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
import { DiscordMarketplaceChannelType, MarketplaceChannel } from '../../utility/sharedtypes';
import embedBuilder from '../../utility/embedbuilder';
import marketplaceUtil from '../../utility/marketplace';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();

      const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild!.id))
        .filter((channel) => channel.type === DiscordMarketplaceChannelType.LISTINGS);

      const marketplaceChannelOptionsPromise = marketplaceChannels.map(async (marketplaceChannel) => marketplaceUtil.getMarketplaceChannelOption(discordServer, tokenPolicies, marketplaceChannel, interaction, 'listings'));
      const marketplaceChannelOptions = await Promise.all(marketplaceChannelOptionsPromise);

      if (marketplaceChannels.length) {
        const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
          .addComponents(
            new SelectMenuBuilder()
              .setCustomId('configure-marketplace/listings-remove/remove')
              .setPlaceholder(i18n.__({ phrase: 'configure.marketplace.listings.remove.chooseMarketplaceChannel', locale }))
              .addOptions(marketplaceChannelOptions),
          )];

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings remove', i18n.__({ phrase: 'configure.marketplace.listings.remove.purpose', locale }), 'configure-marketplace-listings-remove');
        await interaction.editReply({ embeds: [embed], components });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings remove', i18n.__({ phrase: 'configure.marketplace.listings.list.noMarketplaceChannels', locale }), 'configure-marketplace-listings-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting listings channel list. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-marketplace/listings-remove/remove') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      try {
        const marketplaceChannelId = +interaction.values[0].substring('marketplace-channel-id-'.length);
        const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild!.id))
          .filter((channel) => channel.type === DiscordMarketplaceChannelType.LISTINGS);
        const marketplaceChannelToDelete = marketplaceChannels.find((marketplaceChannel) => marketplaceChannel.id === marketplaceChannelId);
        if (marketplaceChannelToDelete) {
          await interaction.client.services.discordserver.deleteMarketplaceChannel(interaction.guild!.id, marketplaceChannelToDelete.id!);
          const marketplaceChannelFields = [marketplaceUtil.getMarketplaceChannelDetailsField(discordServer, tokenPolicies, marketplaceChannelToDelete, 'remove.deleted', 'remove')];
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings remove', i18n.__({ phrase: 'configure.marketplace.listings.remove.success', locale }), 'configure-marketplace-listings-remove', marketplaceChannelFields);
          await interaction.editReply({ components: [], embeds: [embed] });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings remove', i18n.__({ phrase: 'configure.marketplace.listings.remove.otherError', locale }), 'configure-marketplace-listings-remove');
        await interaction.editReply({ components: [], embeds: [embed] });
      }
    }
  },
};
