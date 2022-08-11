const NodeCache = require('node-cache');
const i18n = require('i18n');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const marketplace = interaction.options.getString('marketplace');
    const minimumPriceAda = interaction.options.getInteger('minimum-price');
    const announceChannel = interaction.options.getChannel('channel');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium) {
        const marketplaceChannels = await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild.id);
        const maxSalesTrackerCount = 5;
        if (marketplaceChannels.length < maxSalesTrackerCount) {
          if (announceChannel.type === 'GUILD_TEXT' || announceChannel.type === 'GUILD_NEWS') {
            const announceChannelPermissions = announceChannel.permissionsFor(interaction.client.application.id);
            if (announceChannelPermissions.has('SEND_MESSAGES') && announceChannelPermissions.has('VIEW_CHANNEL')) {
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
                      .addOptions(officialProjects),
                  )];

                const marketplaceName = i18n.__({ phrase: `marketplaces.${marketplace}`, locale });
                const content = i18n.__({ phrase: 'configure.marketplace.sales.add.purpose', locale }, { marketplaceName, channel: announceChannel.id })
                  + (minimumPriceAda ? i18n.__({ phrase: 'configure.marketplace.sales.add.minimumPriceAddon', locale }, { minimumPriceAda }) : '');
                const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', content, 'configure-marketplace-sales-add');
                await interaction.editReply({ components, embeds: [embed], ephemeral: true });
              } else {
                const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.noPoliciesDetail', locale }), 'configure-marketplace-sales-add');
                await interaction.editReply({ embeds: [embed], ephemeral: true });
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
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.errorLimitReached', locale }, { maxCount: maxSalesTrackerCount }), 'configure-tokenroles-metadatafilter-add');
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
        const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);

        await interaction.client.services.discordserver.createMarketplaceChannel(
          interaction.guild.id,
          externalAccount.id,
          marketplaceChannelData.channelId,
          policyIdToTrack,
          marketplaceChannelData.marketplace,
          marketplaceChannelData.minimumPriceAda * 1000000,
        );

        const { projectName } = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdToTrack);

        const marketplaceName = i18n.__({ phrase: `marketplaces.${marketplaceChannelData.marketplace}`, locale });
        const content = i18n.__({ phrase: 'configure.marketplace.sales.add.success', locale }, { projectName, marketplaceName, channel: marketplaceChannelData.channelId })
          + (marketplaceChannelData.minimumPriceAda ? i18n.__({ phrase: 'configure.marketplace.sales.add.minimumPriceAddon', locale }, { minimumPriceAda: marketplaceChannelData.minimumPriceAda }) : '');

        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', content, 'configure-marketplace-sales-add');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace sales add', i18n.__({ phrase: 'configure.marketplace.sales.add.otherError', locale }), 'configure-marketplace-sales-add');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    }
  },
};
