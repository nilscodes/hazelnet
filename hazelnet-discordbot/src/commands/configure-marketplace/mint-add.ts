import i18n from 'i18n';
import NodeCache from 'node-cache';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, ChannelType, GuildTextBasedChannel, MessageActionRowComponentBuilder, PermissionsBitField, SelectMenuBuilder } from 'discord.js';
import { DiscordMarketplaceChannelType, DiscordServer, ExternalAccount, Marketplace, MarketplaceChannel, MarketplaceChannelPartial, TokenPolicy } from '../../utility/sharedtypes';
import { AugmentedCommandInteraction, AugmentedSelectMenuInteraction } from '../../utility/hazelnetclient';
import embedBuilder from '../../utility/embedbuilder';
import marketplaceUtil from '../../utility/marketplace';
import discordpermissions from '../../utility/discordpermissions';

interface ConfigureMarketplaceMintAddCommand extends BotSubcommand {
  cache: NodeCache
  createMintChannel(interaction: AugmentedCommandInteraction | AugmentedSelectMenuInteraction, marketplaceChannelData: MarketplaceChannelPartial, policyIdToTrack: string, discordServer: DiscordServer): Promise<string>
}

export default <ConfigureMarketplaceMintAddCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const announceChannel = interaction.options.getChannel('channel') as GuildTextBasedChannel;
    const highlightAttributeName = interaction.options.getString('highlight-attribute');
    const policyIdToTrack = interaction.options.getString('policy-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      if (discordServer.premium) {
        const marketplaceChannels = (await interaction.client.services.discordserver.listMarketplaceChannels(interaction.guild!.id))
          .filter((channel) => channel.type === DiscordMarketplaceChannelType.MINT);
        const maxMintTrackerCount = +(discordServer.settings?.MAXIMUM_MINT_TRACKERS ?? 1);
        if (marketplaceChannels.length < maxMintTrackerCount) {
          if (announceChannel.type === ChannelType.GuildText || announceChannel.type === ChannelType.GuildAnnouncement) {
            const announceChannelPermissions = announceChannel.permissionsFor(interaction.client.application!.id);
            if (discordpermissions.hasBasicEmbedSendAndAttachPermissions(announceChannelPermissions)) {
              const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
              if (policyIdToTrack) {
                const officialProjectForPolicy = tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdToTrack);
                if (officialProjectForPolicy) {
                  const content = await this.createMintChannel(interaction, {
                    channelId: announceChannel.id,
                    highlightAttributeName,
                    highlightAttributeDisplayName: highlightAttributeName,
                  }, policyIdToTrack, discordServer);
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', content, 'configure-marketplace-mint-add');
                  await interaction.editReply({ components: [], embeds: [embed] });
                } else {
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.noProjectFound', locale }), 'configure-marketplace-mint-add');
                  await interaction.editReply({ embeds: [embed] });
                }
              } else {
                const officialProjects = tokenPolicies
                  .sort((policyA, policyB) => policyA.projectName.localeCompare(policyB.projectName))
                  .map((tokenPolicy) => ({
                    label: tokenPolicy.projectName,
                    description: i18n.__({ phrase: 'configure.marketplace.mint.add.policyId', locale }, { policyId: tokenPolicy.policyId }),
                    value: tokenPolicy.policyId,
                  }));
                if (officialProjects.length) {
                  this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, {
                    channelId: announceChannel.id,
                    highlightAttributeName,
                    highlightAttributeDisplayName: highlightAttributeName,
                  } as MarketplaceChannel);
                  const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
                    .addComponents(
                      new SelectMenuBuilder()
                        .setCustomId('configure-marketplace/mint-add/add')
                        .setPlaceholder(i18n.__({ phrase: 'configure.marketplace.mint.add.chooseProject', locale }))
                        .addOptions(officialProjects.slice(0, 25)),
                    )];

                  const content = i18n.__({ phrase: 'configure.marketplace.mint.add.purpose', locale }, { channel: announceChannel.id });
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', content, 'configure-marketplace-mint-add');
                  await interaction.editReply({ components, embeds: [embed] });
                } else {
                  const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.noPoliciesDetail', locale }), 'configure-marketplace-mint-add');
                  await interaction.editReply({ embeds: [embed] });
                }
              }
            } else {
              const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-marketplace-mint-add');
              await interaction.editReply({ embeds: [embedAdmin] });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.errorWrongChannelType', locale }), 'configure-marketplace-mint-add');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.errorLimitReached', locale }, { maxCount: `${maxMintTrackerCount}` }), 'configure-marketplace-mint-add');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.noPremium', locale }), 'configure-marketplace-mint-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting mint channel list to announce. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-marketplace/mint-add/add') {
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      try {
        const policyIdToTrack = interaction.values[0];
        const marketplaceChannelData = this.cache.take(`${interaction.guild!.id}-${interaction.user.id}`) as MarketplaceChannelPartial;
        const content = await this.createMintChannel(interaction, marketplaceChannelData, policyIdToTrack, discordServer);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', content, 'configure-marketplace-mint-add');
        await interaction.editReply({ components: [], embeds: [embed] });
      } catch (error) {
        interaction.client.logger.error(error);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-marketplace mint add', i18n.__({ phrase: 'configure.marketplace.mint.add.otherError', locale }), 'configure-marketplace-mint-add');
        await interaction.editReply({ components: [], embeds: [embed] });
      }
    }
  },
  async createMintChannel(interaction, marketplaceChannelData, policyIdToTrack, discordServer) {
    const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);

    const newMarketplaceChannel = await interaction.client.services.discordserver.createMarketplaceChannel(
      interaction.guild!.id,
      externalAccount.id,
      DiscordMarketplaceChannelType.MINT,
      marketplaceChannelData.channelId,
      policyIdToTrack,
      [Marketplace.MINT_ONCHAIN],
      null,
      null,
      marketplaceChannelData.highlightAttributeName,
      marketplaceChannelData.highlightAttributeDisplayName,
    );

    const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);

    return marketplaceUtil.getMarketplaceChannelDetailsField(discordServer, tokenPolicies, newMarketplaceChannel, 'add.success').value;
  },
};
