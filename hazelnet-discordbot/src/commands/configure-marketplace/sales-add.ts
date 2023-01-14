import i18n from 'i18n';
import NodeCache from 'node-cache';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, ChannelType, GuildTextBasedChannel, MessageActionRowComponentBuilder, PermissionsBitField, SelectMenuBuilder } from 'discord.js';
import { DiscordMarketplaceChannelType, DiscordServer, ExternalAccount, Marketplace, MarketplaceChannel, MarketplaceChannelPartial } from '../../utility/sharedtypes';
import { AugmentedCommandInteraction, AugmentedSelectMenuInteraction } from '../../utility/hazelnetclient';
import embedBuilder from '../../utility/embedbuilder';
import marketplaceUtil from '../../utility/marketplace';

interface ConfigureMarketplaceSalesAddCommand extends BotSubcommand {
  cache: NodeCache
  createMarketplaceSalesChannel(interaction: AugmentedCommandInteraction | AugmentedSelectMenuInteraction, marketplaceChannelData: MarketplaceChannelPartial, policyIdToTrack: string, discordServer: DiscordServer): Promise<string>
}

export default <ConfigureMarketplaceSalesAddCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const marketplace = interaction.options.getString('marketplace', true) as Marketplace;
    const minimumPriceAda = interaction.options.getInteger('minimum-price', true);
    const maximumPriceAda = interaction.options.getInteger('maximum-price');
    const announceChannel = interaction.options.getChannel('channel', true) as GuildTextBasedChannel;
    const highlightAttributeName = interaction.options.getString('highlight-attribute');
    const policyIdToTrack = interaction.options.getString('policy-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium) {
        if (minimumPriceAda >= 1) {
          const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild!.id))
            .filter((channel) => channel.type === DiscordMarketplaceChannelType.SALES);
          const maxSalesTrackerCount = +discordServer.settings?.MAXIMUM_SALES_TRACKERS ?? 5;
          if (marketplaceChannels.length < maxSalesTrackerCount) {
            if (announceChannel.type === ChannelType.GuildText || announceChannel.type === ChannelType.GuildAnnouncement) {
              const announceChannelPermissions = announceChannel.permissionsFor(interaction.client.application!.id);
              if (announceChannelPermissions && announceChannelPermissions.has(PermissionsBitField.Flags.SendMessages) && announceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel) && announceChannelPermissions.has(PermissionsBitField.Flags.EmbedLinks)) {
                const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
                const minimumValue = minimumPriceAda * 1000000;
                const maximumValue = maximumPriceAda ? maximumPriceAda * 1000000 : null;
                if (policyIdToTrack) {
                  const officialProjectForPolicy = tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdToTrack);
                  if (officialProjectForPolicy) {
                    const content = await this.createMarketplaceSalesChannel(interaction, {
                      channelId: announceChannel.id,
                      minimumValue,
                      maximumValue,
                      marketplaces: [marketplace],
                      highlightAttributeName,
                      highlightAttributeDisplayName: highlightAttributeName,
                    }, policyIdToTrack, discordServer);
                    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', content, 'configure-marketplace-sales-add');
                    await interaction.editReply({ components: [], embeds: [embed] });
                  } else {
                    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.noProjectFound', locale }), 'configure-marketplace-sales-add');
                    await interaction.editReply({ embeds: [embed] });
                  }
                } else {
                  const officialProjects = tokenPolicies
                    .sort((policyA, policyB) => policyA.projectName.localeCompare(policyB.projectName))
                    .map((tokenPolicy) => ({
                      label: tokenPolicy.projectName,
                      description: i18n.__({ phrase: 'configure.marketplace.sales.add.policyId', locale }, { policyId: tokenPolicy.policyId }),
                      value: tokenPolicy.policyId,
                    }));
                  if (officialProjects.length) {
                    this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, {
                      channelId: announceChannel.id,
                      minimumValue,
                      maximumValue,
                      marketplaces: [marketplace],
                      highlightAttributeName,
                      highlightAttributeDisplayName: highlightAttributeName,
                    } as MarketplaceChannel);
                    const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
                      .addComponents(
                        new SelectMenuBuilder()
                          .setCustomId('configure-marketplace/sales-add/add')
                          .setPlaceholder(i18n.__({ phrase: 'configure.marketplace.sales.add.chooseProject', locale }))
                          .addOptions(officialProjects.slice(0, 25)),
                      )];

                    const marketplaceNames = [marketplace].map((marketplaceKey) => i18n.__({ phrase: `marketplaces.${marketplaceKey}`, locale })).join(', ');
                    const content = i18n.__({ phrase: 'configure.marketplace.sales.add.purpose', locale }, { marketplaceNames, channel: announceChannel.id })
                      + (minimumPriceAda ? i18n.__({ phrase: 'configure.marketplace.sales.add.minimumPriceAddon', locale }, { minimumPriceAda } as any) : '');
                    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', content, 'configure-marketplace-sales-add');
                    await interaction.editReply({ components, embeds: [embed] });
                  } else {
                    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.noPoliciesDetail', locale }), 'configure-marketplace-sales-add');
                    await interaction.editReply({ embeds: [embed] });
                  }
                }
              } else {
                const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-marketplace-sales-add');
                await interaction.editReply({ embeds: [embedAdmin] });
              }
            } else {
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.errorWrongChannelType', locale }), 'configure-marketplace-sales-add');
              await interaction.editReply({ embeds: [embed] });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.errorLimitReached', locale }, { maxCount: `${maxSalesTrackerCount}` }), 'configure-marketplace-sales-add');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.errorMinimumValue', locale }), 'configure-marketplace-sales-add');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.noPremium', locale }), 'configure-marketplace-sales-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting sales channel list to announce. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-marketplace/sales-add/add') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      try {
        const policyIdToTrack = interaction.values[0];
        const marketplaceChannelData = this.cache.take(`${interaction.guild!.id}-${interaction.user.id}`) as MarketplaceChannelPartial;
        const content = await this.createMarketplaceSalesChannel(interaction, marketplaceChannelData, policyIdToTrack, discordServer);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', content, 'configure-marketplace-sales-add');
        await interaction.editReply({ components: [], embeds: [embed] });
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.otherError', locale }), 'configure-marketplace-sales-add');
        await interaction.editReply({ components: [], embeds: [embed] });
      }
    }
  },
  async createMarketplaceSalesChannel(interaction, marketplaceChannelData, policyIdToTrack, discordServer) {
    const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag) as ExternalAccount;

    const newMarketplaceChannel = await interaction.client.services.discordserver.createMarketplaceChannel(
      interaction.guild!.id,
      externalAccount.id,
      DiscordMarketplaceChannelType.SALES,
      marketplaceChannelData.channelId,
      policyIdToTrack,
      marketplaceChannelData.marketplaces![0],
      marketplaceChannelData.minimumValue,
      marketplaceChannelData.maximumValue,
      marketplaceChannelData.highlightAttributeName,
      marketplaceChannelData.highlightAttributeDisplayName,
    );

    const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);

    return marketplaceUtil.getMarketplaceChannelDetailsField(discordServer, tokenPolicies, newMarketplaceChannel, 'add.success', 'add').value;
  },
};
