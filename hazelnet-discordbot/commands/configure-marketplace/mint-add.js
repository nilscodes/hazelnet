const NodeCache = require('node-cache');
const i18n = require('i18n');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const marketplaceUtil = require('../../utility/marketplace');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const announceChannel = interaction.options.getChannel('channel');
    const policyIdToTrack = interaction.options.getString('policy-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium) {
        const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild.id))
          .filter((channel) => channel.type === 'MINT');
        const maxMintTrackerCount = discordServer.settings?.MAXIMUM_MINT_TRACKERS ?? 1;
        if (marketplaceChannels.length < maxMintTrackerCount) {
          if (announceChannel.type === 'GUILD_TEXT' || announceChannel.type === 'GUILD_NEWS') {
            const announceChannelPermissions = announceChannel.permissionsFor(interaction.client.application.id);
            if (announceChannelPermissions.has('SEND_MESSAGES') && announceChannelPermissions.has('VIEW_CHANNEL')) {
              if (policyIdToTrack) {
                const officialProjectForPolicy = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdToTrack);
                if (officialProjectForPolicy) {
                  const content = await this.createMintChannel(interaction, {
                    channelId: announceChannel.id,
                  }, policyIdToTrack, discordServer);
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', content, 'configure-marketplace-mint-add');
                  await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
                } else {
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.noProjectFound', locale }), 'configure-marketplace-mint-add');
                  await interaction.editReply({ embeds: [embed], ephemeral: true });
                }
              } else {
                const officialProjects = discordServer.tokenPolicies
                  .sort((policyA, policyB) => policyA.projectName.localeCompare(policyB.projectName))
                  .map((tokenPolicy) => ({
                    label: tokenPolicy.projectName,
                    description: i18n.__({ phrase: 'configure.marketplace.mint.add.policyId', locale }, { policyId: tokenPolicy.policyId }),
                    value: tokenPolicy.policyId,
                  }));
                if (officialProjects.length) {
                  this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, {
                    channelId: announceChannel.id,
                  });
                  const components = [new MessageActionRow()
                    .addComponents(
                      new MessageSelectMenu()
                        .setCustomId('configure-marketplace/mint-add/add')
                        .setPlaceholder(i18n.__({ phrase: 'configure.marketplace.mint.add.chooseProject', locale }))
                        .addOptions(officialProjects.slice(0, 25)),
                    )];

                  const content = i18n.__({ phrase: 'configure.marketplace.mint.add.purpose', locale }, { channel: announceChannel.id });
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', content, 'configure-marketplace-mint-add');
                  await interaction.editReply({ components, embeds: [embed], ephemeral: true });
                } else {
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.noPoliciesDetail', locale }), 'configure-marketplace-mint-add');
                  await interaction.editReply({ embeds: [embed], ephemeral: true });
                }
              }
            } else {
              const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-marketplace-mint-add');
              await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.errorWrongChannelType', locale }), 'configure-marketplace-mint-add');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.errorLimitReached', locale }, { maxCount: maxMintTrackerCount }), 'configure-marketplace-mint-add');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.noPremium', locale }), 'configure-marketplace-mint-add');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting mint channel list to announce. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-marketplace/mint-add/add') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      try {
        const policyIdToTrack = interaction.values[0];
        const marketplaceChannelData = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
        const content = await this.createMintChannel(interaction, marketplaceChannelData, policyIdToTrack, discordServer);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', content, 'configure-marketplace-mint-add');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.otherError', locale }), 'configure-marketplace-mint-add');
        await interaction.editReply({ components: [], embeds: [embed], ephemeral: true });
      }
    }
  },
  async createMintChannel(interaction, marketplaceChannelData, policyIdToTrack, discordServer) {
    const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);

    await interaction.client.services.discordserver.createMarketplaceChannel(
      interaction.guild.id,
      externalAccount.id,
      'MINT',
      marketplaceChannelData.channelId,
      policyIdToTrack,
      'MINT_ONCHAIN',
      null,
    );

    return marketplaceUtil.getMarketplaceChannelDetailsField(discordServer, {
      channelId: marketplaceChannelData.channelId,
      policyId: policyIdToTrack,
      type: 'MINT',
    }, 'add.success').value;
  },
};
