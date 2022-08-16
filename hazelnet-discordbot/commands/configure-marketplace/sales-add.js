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
    const policyIdToTrack = interaction.options.getString('policy-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium) {
        const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild.id))
          .filter((channel) => channel.type === 'SALES');
        const maxSalesTrackerCount = discordServer.settings?.MAXIMUM_SALES_TRACKERS ?? 5;
        if (marketplaceChannels.length < maxSalesTrackerCount) {
          if (announceChannel.type === 'GUILD_TEXT' || announceChannel.type === 'GUILD_NEWS') {
            const announceChannelPermissions = announceChannel.permissionsFor(interaction.client.application.id);
            if (announceChannelPermissions.has('SEND_MESSAGES') && announceChannelPermissions.has('VIEW_CHANNEL')) {
              if (policyIdToTrack) {
                const officialProjectForPolicy = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdToTrack);
                if (officialProjectForPolicy) {
                  const content = await this.createMarketplaceSalesChannel(interaction, {
                    channelId: announceChannel.id,
                    minimumPriceAda,
                    marketplace,
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
                  });
                  const components = [new MessageActionRow()
                    .addComponents(
                      new MessageSelectMenu()
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

    await interaction.client.services.discordserver.createMarketplaceChannel(
      interaction.guild.id,
      externalAccount.id,
      'SALES',
      marketplaceChannelData.channelId,
      policyIdToTrack,
      marketplaceChannelData.marketplace,
      minimumValue,
    );

    return marketplaceUtil.getMarketplaceChannelDetailsField(discordServer, {
      channelId: marketplaceChannelData.channelId,
      marketplaces: [marketplaceChannelData.marketplace],
      minimumValue,
      policyId: policyIdToTrack,
      type: 'SALES',
    }, 'add.success', 'add').value;
  },
};
