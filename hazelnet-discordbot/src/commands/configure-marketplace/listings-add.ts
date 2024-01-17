import i18n from 'i18n';
import NodeCache from 'node-cache';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, ChannelType, GuildTextBasedChannel, MessageActionRowComponentBuilder, PermissionsBitField, SelectMenuBuilder } from 'discord.js';
import { DiscordMarketplaceChannelType, DiscordServer, ExternalAccount, Marketplace, MarketplaceChannel, MarketplaceChannelPartial } from '@vibrantnet/core';
import { AugmentedCommandInteraction, AugmentedSelectMenuInteraction } from '../../utility/hazelnetclient';
import embedBuilder from '../../utility/embedbuilder';
import marketplaceUtil from '../../utility/marketplace';
import discordpermissions from '../../utility/discordpermissions';

interface ConfigureMarketplaceListingsAddCommand extends BotSubcommand {
  cache: NodeCache
  createMarketplaceListingsChannel(interaction: AugmentedCommandInteraction | AugmentedSelectMenuInteraction, marketplaceChannelData: MarketplaceChannelPartial, policyIdToTrack: string, discordServer: DiscordServer): Promise<string>
}

export default <ConfigureMarketplaceListingsAddCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const minimumPriceAda = interaction.options.getInteger('minimum-price', true);
    const maximumPriceAda = interaction.options.getInteger('maximum-price');
    const announceChannel = interaction.options.getChannel('channel', true) as GuildTextBasedChannel;
    const marketplace = (interaction.options.getString('marketplace') as Marketplace) ?? Marketplace.ALL_MARKETPLACES;
    const highlightAttributeName = interaction.options.getString('highlight-attribute');
    const policyIdToTrack = interaction.options.getString('policy-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium) {
        if (minimumPriceAda >= 1) {
          const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild!.id))
            .filter((channel) => channel.type === DiscordMarketplaceChannelType.LISTINGS);
          const maxListingsTrackerCount = +(discordServer.settings?.MAXIMUM_LISTINGS_TRACKERS ?? 5);
          if (marketplaceChannels.length < maxListingsTrackerCount) {
            if (announceChannel.type === ChannelType.GuildText || announceChannel.type === ChannelType.GuildAnnouncement) {
              const announceChannelPermissions = announceChannel.permissionsFor(interaction.client.application!.id);
              if (discordpermissions.hasBasicEmbedSendAndAttachPermissions(announceChannelPermissions)) {
                const marketplaces = [marketplace];
                const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
                const minimumValue = minimumPriceAda * 1000000;
                const maximumValue = maximumPriceAda ? maximumPriceAda * 1000000 : null;
                if (policyIdToTrack) {
                  const officialProjectForPolicy = tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdToTrack);
                  const globalMarketplaceTracker = policyIdToTrack === '00000000000000000000000000000000000000000000000000000000' && discordServer.settings?.GLOBAL_MARKETPLACE_TRACKER_ENABLED === 'true'
                  if (officialProjectForPolicy || globalMarketplaceTracker) {
                    const content = await this.createMarketplaceListingsChannel(interaction, {
                      channelId: announceChannel.id,
                      minimumValue,
                      maximumValue,
                      marketplaces,
                      highlightAttributeName,
                      highlightAttributeDisplayName: highlightAttributeName,
                    }, policyIdToTrack, discordServer);
                    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', content, 'configure-marketplace-listings-add');
                    await interaction.editReply({ components: [], embeds: [embed] });
                  } else {
                    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.noProjectFound', locale }), 'configure-marketplace-listings-add');
                    await interaction.editReply({ embeds: [embed] });
                  }
                } else {
                  const officialProjects = tokenPolicies
                    .sort((policyA, policyB) => policyA.projectName.localeCompare(policyB.projectName))
                    .map((tokenPolicy) => ({
                      label: tokenPolicy.projectName,
                      description: i18n.__({ phrase: 'configure.marketplace.listings.add.policyId', locale }, { policyId: tokenPolicy.policyId }),
                      value: tokenPolicy.policyId,
                    }));
                  if (officialProjects.length) {
                    this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, {
                      channelId: announceChannel.id,
                      minimumValue,
                      maximumValue,
                      marketplaces,
                      highlightAttributeName,
                      highlightAttributeDisplayName: highlightAttributeName,
                    } as MarketplaceChannel);
                    const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
                      .addComponents(
                        new SelectMenuBuilder()
                          .setCustomId('configure-marketplace/listings-add/add')
                          .setPlaceholder(i18n.__({ phrase: 'configure.marketplace.listings.add.chooseProject', locale }))
                          .addOptions(officialProjects.slice(0, 25)),
                      )];

                    const marketplaceNames = marketplaceUtil.getMarketplaceNames(marketplaces, locale);
                    const content = i18n.__({ phrase: 'configure.marketplace.listings.add.purpose', locale }, { marketplaceNames, channel: announceChannel.id })
                      + (minimumPriceAda ? i18n.__({ phrase: 'configure.marketplace.listings.add.minimumPriceAddon', locale }, { minimumPriceAda } as any) : '');
                    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', content, 'configure-marketplace-listings-add');
                    await interaction.editReply({ components, embeds: [embed] });
                  } else {
                    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.noPoliciesDetail', locale }), 'configure-marketplace-listings-add');
                    await interaction.editReply({ embeds: [embed] });
                  }
                }
              } else {
                const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-marketplace-listings-add');
                await interaction.editReply({ embeds: [embedAdmin] });
              }
            } else {
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.errorWrongChannelType', locale }), 'configure-marketplace-listings-add');
              await interaction.editReply({ embeds: [embed] });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.errorLimitReached', locale }, { maxCount: `${maxListingsTrackerCount}` }), 'configure-marketplace-listings-add');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.errorMinimumValue', locale }), 'configure-marketplace-listings-add');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.noPremium', locale }), 'configure-marketplace-listings-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting listings channel list to announce. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-marketplace/listings-add/add') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      try {
        const policyIdToTrack = interaction.values[0];
        const marketplaceChannelData = this.cache.take(`${interaction.guild!.id}-${interaction.user.id}`) as MarketplaceChannelPartial;
        const content = await this.createMarketplaceListingsChannel(interaction, marketplaceChannelData, policyIdToTrack, discordServer);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', content, 'configure-marketplace-listings-add');
        await interaction.editReply({ components: [], embeds: [embed] });
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.otherError', locale }), 'configure-marketplace-listings-add');
        await interaction.editReply({ components: [], embeds: [embed] });
      }
    }
  },
  async createMarketplaceListingsChannel(interaction, marketplaceChannelData, policyIdToTrack, discordServer) {
    const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);

    const newMarketplaceChannel = await interaction.client.services.discordserver.createMarketplaceChannel(
      interaction.guild!.id,
      externalAccount.id,
      DiscordMarketplaceChannelType.LISTINGS,
      marketplaceChannelData.channelId,
      policyIdToTrack,
      marketplaceChannelData.marketplaces!,
      marketplaceChannelData.minimumValue,
      marketplaceChannelData.maximumValue,
      marketplaceChannelData.highlightAttributeName,
      marketplaceChannelData.highlightAttributeDisplayName,
    );

    const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);

    return marketplaceUtil.getMarketplaceChannelDetailsField(discordServer, tokenPolicies, newMarketplaceChannel, 'add.success', 'add').value;
  },
};
