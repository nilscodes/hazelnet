const NodeCache = require('node-cache');
const i18n = require('i18n');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const marketplaceUtil = require('../../utility/marketplace');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const marketplace = interaction.options.getString('marketplace');
    const minimumPriceAda = interaction.options.getInteger('minimum-price');
    const announceChannel = interaction.options.getChannel('channel');
    const highlightAttributeName = interaction.options.getString('highlight-attribute');
    const policyIdToTrack = interaction.options.getString('policy-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium) {
        const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild.id))
          .filter((channel) => channel.type === 'LISTINGS');
        const maxListingsTrackerCount = discordServer.settings?.MAXIMUM_LISTINGS_TRACKERS ?? 5;
        if (marketplaceChannels.length < maxListingsTrackerCount) {
          if (announceChannel.type === 'GUILD_TEXT' || announceChannel.type === 'GUILD_NEWS') {
            const announceChannelPermissions = announceChannel.permissionsFor(interaction.client.application.id);
            if (announceChannelPermissions.has('SEND_MESSAGES') && announceChannelPermissions.has('VIEW_CHANNEL') && announceChannelPermissions.has('EMBED_LINKS')) {
              if (policyIdToTrack) {
                const officialProjectForPolicy = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdToTrack);
                if (officialProjectForPolicy) {
                  const content = await this.createMarketplaceListingsChannel(interaction, {
                    channelId: announceChannel.id,
                    minimumPriceAda,
                    marketplace,
                    highlightAttributeName,
                    highlightAttributeDisplayName: highlightAttributeName,
                  }, policyIdToTrack, discordServer);
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', content, 'configure-marketplace-listings-add');
                  await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
                } else {
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.noProjectFound', locale }), 'configure-marketplace-listings-add');
                  await interaction.editReply({ embeds: [embed], ephemeral: true });
                }
              } else {
                const officialProjects = discordServer.tokenPolicies
                  .sort((policyA, policyB) => policyA.projectName.localeCompare(policyB.projectName))
                  .map((tokenPolicy) => ({
                    label: tokenPolicy.projectName,
                    description: i18n.__({ phrase: 'configure.marketplace.listings.add.policyId', locale }, { policyId: tokenPolicy.policyId }),
                    value: tokenPolicy.policyId,
                  }));
                if (officialProjects.length) {
                  this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, {
                    channelId: announceChannel.id,
                    minimumPriceAda,
                    marketplace,
                    highlightAttributeName,
                    highlightAttributeDisplayName: highlightAttributeName,
                  });
                  const components = [new MessageActionRow()
                    .addComponents(
                      new MessageSelectMenu()
                        .setCustomId('configure-marketplace/listings-add/add')
                        .setPlaceholder(i18n.__({ phrase: 'configure.marketplace.listings.add.chooseProject', locale }))
                        .addOptions(officialProjects.slice(0, 25)),
                    )];

                  const marketplaceNames = [marketplace].map((marketplaceKey) => i18n.__({ phrase: `marketplaces.${marketplaceKey}`, locale })).join(', ');
                  const content = i18n.__({ phrase: 'configure.marketplace.listings.add.purpose', locale }, { marketplaceNames, channel: announceChannel.id })
                    + (minimumPriceAda ? i18n.__({ phrase: 'configure.marketplace.listings.add.minimumPriceAddon', locale }, { minimumPriceAda }) : '');
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', content, 'configure-marketplace-listings-add');
                  await interaction.editReply({ components, embeds: [embed], ephemeral: true });
                } else {
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.noPoliciesDetail', locale }), 'configure-marketplace-listings-add');
                  await interaction.editReply({ embeds: [embed], ephemeral: true });
                }
              }
            } else {
              const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-marketplace-listings-add');
              await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.errorWrongChannelType', locale }), 'configure-marketplace-listings-add');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.errorLimitReached', locale }, { maxCount: maxListingsTrackerCount }), 'configure-marketplace-listings-add');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.noPremium', locale }), 'configure-marketplace-listings-add');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting listings channel list to announce. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-marketplace/listings-add/add') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      try {
        const policyIdToTrack = interaction.values[0];
        const marketplaceChannelData = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
        const content = await this.createMarketplaceListingsChannel(interaction, marketplaceChannelData, policyIdToTrack, discordServer);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', content, 'configure-marketplace-listings-add');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace listings add', i18n.__({ phrase: 'configure.marketplace.listings.add.otherError', locale }), 'configure-marketplace-listings-add');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    }
  },
  async createMarketplaceListingsChannel(interaction, marketplaceChannelData, policyIdToTrack, discordServer) {
    const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
    const minimumValue = marketplaceChannelData.minimumPriceAda * 1000000;

    await interaction.client.services.discordserver.createMarketplaceChannel(
      interaction.guild.id,
      externalAccount.id,
      'LISTINGS',
      marketplaceChannelData.channelId,
      policyIdToTrack,
      marketplaceChannelData.marketplace,
      marketplaceChannelData.minimumPriceAda * 1000000,
      marketplaceChannelData.highlightAttributeName,
      marketplaceChannelData.highlightAttributeDisplayName,
    );

    return marketplaceUtil.getMarketplaceChannelDetailsField(discordServer, {
      channelId: marketplaceChannelData.channelId,
      marketplaces: [marketplaceChannelData.marketplace],
      minimumValue,
      policyId: policyIdToTrack,
      type: 'LISTINGS',
    }, 'add.success', 'add').value;
  },
};
