import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, MessageActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
import { DiscordMarketplaceChannelType, DiscordServer, MarketplaceChannel, TokenPolicy } from '@vibrantnet/core';
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
        .filter((channel) => channel.type === DiscordMarketplaceChannelType.MINT);

      const marketplaceChannelOptionsPromise = marketplaceChannels.map(async (marketplaceChannel) => marketplaceUtil.getMarketplaceChannelOption(discordServer, tokenPolicies, marketplaceChannel, interaction, 'mint'));
      const marketplaceChannelOptions = await Promise.all(marketplaceChannelOptionsPromise);

      if (marketplaceChannels.length) {
        const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
          .addComponents(
            new SelectMenuBuilder()
              .setCustomId('configure-marketplace/mint-remove/remove')
              .setPlaceholder(i18n.__({ phrase: 'configure.marketplace.mint.remove.chooseMarketplaceChannel', locale }))
              .addOptions(marketplaceChannelOptions),
          )];

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint remove', i18n.__({ phrase: 'configure.marketplace.mint.remove.purpose', locale }), 'configure-marketplace-mint-remove');
        await interaction.editReply({ embeds: [embed], components });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint remove', i18n.__({ phrase: 'configure.marketplace.mint.list.noMarketplaceChannels', locale }), 'configure-marketplace-mint-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting mint channel list. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-marketplace/mint-remove/remove') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id) ;
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      try {
        const marketplaceChannelId = +interaction.values[0].substring('marketplace-channel-id-'.length);
        const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild!.id))
          .filter((channel) => channel.type === DiscordMarketplaceChannelType.MINT);
        const marketplaceChannelToDelete = marketplaceChannels.find((marketplaceChannel) => marketplaceChannel.id === marketplaceChannelId);
        if (marketplaceChannelToDelete) {
          await interaction.client.services.discordserver.deleteMarketplaceChannel(interaction.guild!.id, marketplaceChannelToDelete.id!);
          const marketplaceChannelFields = [marketplaceUtil.getMarketplaceChannelDetailsField(discordServer, tokenPolicies, marketplaceChannelToDelete, 'remove.deleted')];
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint remove', i18n.__({ phrase: 'configure.marketplace.mint.remove.success', locale }), 'configure-marketplace-mint-remove', marketplaceChannelFields);
          await interaction.editReply({ components: [], embeds: [embed] });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint remove', i18n.__({ phrase: 'configure.marketplace.mint.remove.otherError', locale }), 'configure-marketplace-mint-remove');
        await interaction.editReply({ components: [], embeds: [embed] });
      }
    }
  },
};
