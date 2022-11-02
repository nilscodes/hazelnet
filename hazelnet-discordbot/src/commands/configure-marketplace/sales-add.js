const NodeCache = require('node-cache');
const i18n = require('i18n');
const {
  ActionRowBuilder,
  SelectMenuBuilder,
  ChannelType,
  PermissionsBitField,
} = require('discord.js');
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
        if (minimumPriceAda >= 1) {
          const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild.id))
            .filter((channel) => channel.type === 'SALES');
          const maxSalesTrackerCount = discordServer.settings?.MAXIMUM_SALES_TRACKERS ?? 5;
          if (marketplaceChannels.length < maxSalesTrackerCount) {
            if (announceChannel.type === ChannelType.GuildText || announceChannel.type === ChannelType.GuildAnnouncement) {
              const announceChannelPermissions = announceChannel.permissionsFor(interaction.client.application.id);
              if (announceChannelPermissions.has(PermissionsBitField.Flags.SendMessages) && announceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel) && announceChannelPermissions.has(PermissionsBitField.Flags.EmbedLinks)) {
                if (policyIdToTrack) {
                  const officialProjectForPolicy = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdToTrack);
                  if (officialProjectForPolicy) {
                    const content = await this.createMarketplaceSalesChannel(interaction, {
                      channelId: announceChannel.id,
                      minimumPriceAda,
                      maximumPriceAda: null,
                      marketplace,
                      highlightAttributeName,
                      highlightAttributeDisplayName: highlightAttributeName,
                    }, policyIdToTrack, discordServer);
                    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', content, 'configure-marketplace-sales-add');
                    await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
                  } else {
                    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.noProjectFound', locale }), 'configure-marketplace-sales-add');
                    await interaction.editReply({ embeds: [embed], ephemeral: true });
                  }
                } else {
                  const officialProjects = discordServer.tokenPolicies
                    .sort((policyA, policyB) => policyA.projectName.localeCompare(policyB.projectName))
                    .map((tokenPolicy) => ({
                      label: tokenPolicy.projectName,
                      description: i18n.__({ phrase: 'configure.marketplace.sales.add.policyId', locale }, { policyId: tokenPolicy.policyId }),
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
                    const components = [new ActionRowBuilder()
                      .addComponents(
                        new SelectMenuBuilder()
                          .setCustomId('configure-marketplace/sales-add/add')
                          .setPlaceholder(i18n.__({ phrase: 'configure.marketplace.sales.add.chooseProject', locale }))
                          .addOptions(officialProjects.slice(0, 25)),
                      )];

                    const marketplaceNames = [marketplace].map((marketplaceKey) => i18n.__({ phrase: `marketplaces.${marketplaceKey}`, locale })).join(', ');
                    const content = i18n.__({ phrase: 'configure.marketplace.sales.add.purpose', locale }, { marketplaceNames, channel: announceChannel.id })
                      + (minimumPriceAda ? i18n.__({ phrase: 'configure.marketplace.sales.add.minimumPriceAddon', locale }, { minimumPriceAda }) : '');
                    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', content, 'configure-marketplace-sales-add');
                    await interaction.editReply({ components, embeds: [embed], ephemeral: true });
                  } else {
                    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.noPoliciesDetail', locale }), 'configure-marketplace-sales-add');
                    await interaction.editReply({ embeds: [embed], ephemeral: true });
                  }
                }
              } else {
                const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-marketplace-sales-add');
                await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
              }
            } else {
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.errorWrongChannelType', locale }), 'configure-marketplace-sales-add');
              await interaction.editReply({ embeds: [embed], ephemeral: true });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.errorLimitReached', locale }, { maxCount: maxSalesTrackerCount }), 'configure-marketplace-sales-add');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.errorMinimumValue', locale }), 'configure-marketplace-sales-add');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.noPremium', locale }), 'configure-marketplace-sales-add');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting sales channel list to announce. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-marketplace/sales-add/add') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      try {
        const policyIdToTrack = interaction.values[0];
        const marketplaceChannelData = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
        const content = await this.createMarketplaceSalesChannel(interaction, marketplaceChannelData, policyIdToTrack, discordServer);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', content, 'configure-marketplace-sales-add');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.otherError', locale }), 'configure-marketplace-sales-add');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    }
  },
  async createMarketplaceSalesChannel(interaction, marketplaceChannelData, policyIdToTrack, discordServer) {
    const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
    const minimumValue = marketplaceChannelData.minimumPriceAda * 1000000;
    const maximumValue = marketplaceChannelData.maximumPriceAda ? marketplaceChannelData.maximumPriceAda * 1000000 : null;

    await interaction.client.services.discordserver.createMarketplaceChannel(
      interaction.guild.id,
      externalAccount.id,
      'SALES',
      marketplaceChannelData.channelId,
      policyIdToTrack,
      marketplaceChannelData.marketplace,
      minimumValue,
      maximumValue,
      marketplaceChannelData.highlightAttributeName,
      marketplaceChannelData.highlightAttributeDisplayName,
    );

    return marketplaceUtil.getMarketplaceChannelDetailsField(discordServer, {
      channelId: marketplaceChannelData.channelId,
      marketplaces: [marketplaceChannelData.marketplace],
      minimumValue,
      maximumValue,
      policyId: policyIdToTrack,
      type: 'SALES',
    }, 'add.success', 'add').value;
  },
};