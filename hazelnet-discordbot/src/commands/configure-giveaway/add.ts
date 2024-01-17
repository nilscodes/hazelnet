import NodeCache from 'node-cache';
import i18n from 'i18n';
import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, MessageActionRowComponentBuilder, StringSelectMenuBuilder, SelectMenuComponentOptionData,
} from 'discord.js';
import {
  DiscordServer, Giveaway, GiveawayDrawType, GiveawayPartial,
} from '@vibrantnet/core';
import { BotSubcommand } from '../../utility/commandtypes';
import { AugmentedButtonInteraction, AugmentedCommandInteraction, AugmentedSelectMenuInteraction } from '../../utility/hazelnetclient';
import giveaway from '../../utility/giveaway';
import embedBuilder from '../../utility/embedbuilder';
import cardanotoken from '../../utility/cardanotoken';
import datetime from '../../utility/datetime';
import discordstring from '../../utility/discordstring';

interface GiveawayAddCommand extends BotSubcommand {
  cache: NodeCache
  buildContent(locale: string, currentChannel: string, giveawayObject: GiveawayPartial, step: number): string[]
  startPhase2(interaction: AugmentedCommandInteraction | AugmentedButtonInteraction, discordServer: DiscordServer, giveawayObject: GiveawayPartial): void
  startPhase3(interaction: AugmentedButtonInteraction | AugmentedSelectMenuInteraction, discordServer: DiscordServer, giveawayObject: GiveawayPartial): void
  startPhase4(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, giveawayObject: GiveawayPartial): void
  getYesNoOptions(locale: string, yesIsSelected: boolean, yesLabel: string, yesDescription: string, yesEmoji: string, noLabel: string, noDescription: string, noEmoji: string): SelectMenuComponentOptionData[]
  getDrawTypeOptions(locale: string, drawType: string): SelectMenuComponentOptionData[]
  getTokenOwnershipOptions(locale: string, tokenType: string): SelectMenuComponentOptionData[]
  createGiveaway(interaction: AugmentedButtonInteraction, discordServer: DiscordServer): void
}

export default <GiveawayAddCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const giveawayName = interaction.options.getString('giveaway-name', true);
    const giveawayDisplayName = interaction.options.getString('giveaway-displayname', true);
    const giveawayOpenTime = interaction.options.getString('giveaway-opentime', false);
    const giveawayCloseTime = interaction.options.getString('giveaway-closetime', false);
    const snapshotTime = interaction.options.getString('snapshot-time', false);
    const logoUrl = interaction.options.getString('image-url', false);
    const winnerCount = interaction.options.getInteger('winner-count', false) ?? 1;
    const requiredRole = interaction.options.getRole('required-role');
    const publishChannel = interaction.options.getChannel('channel');
    const group = interaction.options.getString('group-name');

    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();

      if (discordServer.premium) {
        if (giveaway.isValidName(giveawayName)) {
          const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);

          if (giveawayOpenTime && !datetime.isValidISOTimestamp(giveawayOpenTime)) {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale }, { parameter: 'giveaway-opentime', value: giveawayOpenTime } as any), 'configure-giveaway-add');
            await interaction.editReply({ embeds: [embed] });
            return;
          }
          if (giveawayCloseTime && !datetime.isValidISOTimestamp(giveawayCloseTime)) {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale }, { parameter: 'giveaway-closetime', value: giveawayCloseTime }), 'configure-giveaway-add');
            await interaction.editReply({ embeds: [embed] });
            return;
          }

          const giveawayObject = {
            name: giveawayName,
            displayName: giveawayDisplayName,
            creator: +externalAccount.id,
            openAfter: giveawayOpenTime,
            openUntil: giveawayCloseTime,
            snapshotTime,
            channelId: publishChannel?.id,
            winnerCount,
            drawType: 'DISCORD_ID',
            logoUrl,
            group,
          } as GiveawayPartial;
          if (requiredRole) {
            giveawayObject.requiredRoles = [{ roleId: requiredRole.id }];
          }

          const content = this.buildContent(locale, interaction.channel!.id, giveawayObject, 1);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', content.join('\n\n'), 'configure-giveaway-add');
          await interaction.editReply({ embeds: [embed] });

          this.startPhase2(interaction, discordServer, giveawayObject);
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', i18n.__({ phrase: 'configure.giveaway.add.invalidName', locale }, { giveawayName }), 'configure-giveaway-add');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', i18n.__({ phrase: 'configure.giveaway.add.noPremium', locale }), 'configure-giveaway-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding giveaway to your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  buildContent(locale, currentChannel, giveawayObject, step) {
    const content = [];
    if (step === 7) {
      content.push(i18n.__({ phrase: 'configure.giveaway.add.success', locale }));
    } else {
      content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase1', locale }));
      const openTime = giveaway.getTimePhrase(giveawayObject.openAfter, 'configure.giveaway.add.previewPhase1DetailsOpenTime', locale);
      const closeTime = giveaway.getTimePhrase(giveawayObject.openUntil, 'configure.giveaway.add.previewPhase1DetailsCloseTime', locale);
      const snapshotTime = giveaway.getTimePhrase(giveawayObject.snapshotTime, 'configure.giveaway.add.previewPhase1DetailsSnapshotTime', locale);
      content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase1Details', locale }, giveawayObject as any) + openTime + closeTime + snapshotTime);
      if (giveawayObject.logoUrl) {
        content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase1DetailsImage', locale }, giveawayObject as any));
      }
    }

    if (giveawayObject.channelId) {
      content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase1Channel', locale }, { publishChannel: giveawayObject.channelId }));
    } else {
      content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase1NoChannel', locale }));
    }
    if (giveawayObject.requiredRoles?.length) {
      content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase1RequiredRole', locale }, { requiredRole: giveawayObject.requiredRoles[0].roleId }));
    } else {
      content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase1NoRequiredRole', locale }));
    }
    if (step >= 2) {
      content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase2Description', locale }, { description: giveawayObject.description } as any));
    }
    if (step >= 3) {
      const { drawType } = giveawayObject;
      content.push(i18n.__({ phrase: `configure.giveaway.list.drawType${drawType}`, locale }));
    }
    if (step >= 4) {
      if (giveawayObject.tokenType !== 'no') {
        if (giveawayObject.assetFingerprint) {
          content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase4NextStepsPolicyIdAndFingerprint', locale }, giveawayObject as any));
          if (!giveawayObject.snapshotTime) {
            content.push(i18n.__({ phrase: 'configure.giveaway.add.noSnapshotTimeProvided', locale }));
          }
          if (giveawayObject.tokenType === 'tokenweighted') {
            content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase4NextStepsWeighted', locale }, giveawayObject as any));
          }
        } else if (giveawayObject.policyId) {
          content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase4NextStepsPolicyIdOnly', locale }, giveawayObject as any));
          if (giveawayObject.tokenType === 'tokenweighted') {
            content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase4NextStepsWeighted', locale }, giveawayObject as any));
          }
        } else {
          content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase4NextSteps', locale }));
        }
      }
    }
    if (step === 1) {
      content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase1NextSteps', locale }, { currentChannel }));
    } else if (step === 3) {
      content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase3NextSteps', locale }, { currentChannel }));
    } else if (step === 4) {
      content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase3NextSteps', locale }, { currentChannel }));
    } else if (step === 5) {
      content.push(i18n.__({ phrase: 'configure.giveaway.add.previewPhase4NextSteps', locale }));
    }
    return content;
  },
  startPhase2(interaction, discordServer, giveawayObject) {
    const locale = discordServer.getBotLanguage();
    const collector = interaction.channel!.createMessageCollector({
      time: 5 * 60000,
      dispose: true,
      max: 1,
    });

    collector.on('end', async (collected) => {
      if (collected.size > 0) {
        const maxLength = 1000;
        const description = collected.at(0)!.content;
        const phase2GiveawayObject = { description: discordstring.ensureLength(description, maxLength), ...giveawayObject };
        if (description.length > maxLength) {
          const warningEmbed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', i18n.__({ phrase: 'configure.giveaway.add.descriptionLengthWarning', locale }, { maxLength } as any), 'configure-giveaway-add');
          await interaction.followUp({ embeds: [warningEmbed], ephemeral: true });
        }
        const content = this.buildContent(locale, interaction.channel!.id, phase2GiveawayObject, 2);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', content.join('\n\n'), 'configure-giveaway-add');
        this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, phase2GiveawayObject);
        const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('configure-giveaway/add/startphase3')
              .setLabel(i18n.__({ phrase: 'configure.giveaway.add.startPhase3', locale }))
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('configure-giveaway/add/redophase2')
              .setLabel(i18n.__({ phrase: 'configure.giveaway.add.redoPhase2', locale }))
              .setStyle(ButtonStyle.Secondary),
          ),
        ];
        await interaction.editReply({ embeds: [embed], components });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', i18n.__({ phrase: 'configure.giveaway.add.errorTimeout', locale }), 'configure-giveaway-add');
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      }
    });
  },
  async startPhase3(interaction, discordServer, giveawayObject) {
    this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, giveawayObject);
    const locale = discordServer.getBotLanguage();
    const content = this.buildContent(locale, interaction.channel!.id, giveawayObject, 3);
    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', content.join('\n\n'), 'configure-giveaway-add');
    const components = [
      new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('configure-giveaway/add/uniquewinners')
            .setPlaceholder(i18n.__({ phrase: 'configure.giveaway.add.isUniqueWinners', locale }).substring(0, 100))
            .addOptions(this.getYesNoOptions(locale, giveawayObject.uniqueWinners ?? true, 'uniqueWinnersYes', 'uniqueWinnersYesDescription', '1️⃣', 'uniqueWinnersNo', 'uniqueWinnersNoDescription', '🔢')),
        ),
      new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('configure-giveaway/add/drawtype')
            .setPlaceholder(i18n.__({ phrase: 'configure.giveaway.add.selectDrawType', locale }).substring(0, 100))
            .addOptions(this.getDrawTypeOptions(locale, giveawayObject.drawType!)),
        ),
      new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('configure-giveaway/add/tokentype')
            .setPlaceholder(i18n.__({ phrase: 'configure.giveaway.add.isTokenOwnershipRequired', locale }).substring(0, 100))
            .addOptions(this.getTokenOwnershipOptions(locale, giveawayObject.tokenType!)),
        ),
    ];

    if (giveawayObject.tokenType) {
      const finish = giveawayObject.tokenType === 'no';
      components.push(new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
          .setCustomId(finish ? 'configure-giveaway/add/finish' : 'configure-giveaway/add/startphase4')
          .setLabel(i18n.__({ phrase: finish ? 'configure.giveaway.add.finish' : 'configure.giveaway.add.startPhase4', locale }))
          .setStyle(ButtonStyle.Primary)) as ActionRowBuilder<MessageActionRowComponentBuilder>);
    }

    await interaction.update({ embeds: [embed], components });
  },
  getYesNoOptions(locale, yesIsSelected, yesLabel, yesDescription, yesEmoji, noLabel, noDescription, noEmoji) {
    return [{
      label: i18n.__({ phrase: `configure.giveaway.add.${yesLabel}`, locale }).substring(0, 100),
      description: i18n.__({ phrase: `configure.giveaway.add.${yesDescription}`, locale }).substring(0, 100),
      value: 'yes',
      emoji: { name: yesEmoji },
      default: yesIsSelected,
    }, {
      label: i18n.__({ phrase: `configure.giveaway.add.${noLabel}`, locale }).substring(0, 100),
      description: i18n.__({ phrase: `configure.giveaway.add.${noDescription}`, locale }).substring(0, 100),
      value: 'no',
      emoji: { name: noEmoji },
      default: !yesIsSelected,
    }];
  },
  getDrawTypeOptions(locale, drawType) {
    return [{
      label: i18n.__({ phrase: 'configure.giveaway.add.drawTypeDiscordId', locale }).substring(0, 100),
      description: i18n.__({ phrase: 'configure.giveaway.add.drawTypeDiscordIdDescription', locale }).substring(0, 100),
      value: 'DISCORD_ID',
      emoji: { name: '🆔' },
      default: drawType === 'DISCORD_ID',
    }, {
      label: i18n.__({ phrase: 'configure.giveaway.add.drawTypeWalletAddress', locale }).substring(0, 100),
      description: i18n.__({ phrase: 'configure.giveaway.add.drawTypeWalletAddressDescription', locale }).substring(0, 100),
      value: 'WALLET_ADDRESS',
      emoji: { name: '🏠' },
      default: drawType === 'WALLET_ADDRESS',
    }];
  },
  getTokenOwnershipOptions(locale, tokenType) {
    return [{
      label: i18n.__({ phrase: 'configure.giveaway.add.tokenTypeNone', locale }).substring(0, 100),
      description: i18n.__({ phrase: 'configure.giveaway.add.tokenTypeNoneDescription', locale }).substring(0, 100),
      value: 'no',
      emoji: { name: '🔓' },
      default: tokenType === 'no',
    }, {
      label: i18n.__({ phrase: 'configure.giveaway.add.tokenTypeHolderOnly', locale }).substring(0, 100),
      description: i18n.__({ phrase: 'configure.giveaway.add.tokenTypeHolderOnlyDescription', locale }).substring(0, 100),
      value: 'token',
      emoji: { name: '📃' },
      default: tokenType === 'token',
    }, {
      label: i18n.__({ phrase: 'configure.giveaway.add.tokenTypeHolderWeighted', locale }).substring(0, 100),
      description: i18n.__({ phrase: 'configure.giveaway.add.tokenTypeHolderWeightedDescription', locale }).substring(0, 100),
      value: 'tokenweighted',
      emoji: { name: '⚖' },
      default: tokenType === 'tokenweighted',
    }];
  },
  async startPhase4(interaction, discordServer, giveawayObject) {
    const locale = discordServer.getBotLanguage();
    const onlyGiveawayCreatorMessageFilter = (message: Message) => message.author.id === interaction.user.id;
    const policyIdAndAssetFingerprintCollector = interaction.channel!.createMessageCollector({
      filter: onlyGiveawayCreatorMessageFilter,
      time: 5 * 60000,
      dispose: true,
      max: 1,
    });
    const phase4GivewayObject = {
      ...giveawayObject,
      policyId: null,
      assetFingerprint: null,
      policyIdAndAssetFingerprintCollector,
    } as unknown as GiveawayPartial;
    this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, phase4GivewayObject);
    const content = this.buildContent(locale, interaction.channel!.id, phase4GivewayObject, 6);
    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', content.join('\n\n'), 'configure-giveaway-add');
    const components = [new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('configure-giveaway/add/redophase4')
          .setLabel(i18n.__({ phrase: 'configure.giveaway.add.redoPhase4', locale }))
          .setStyle(ButtonStyle.Secondary),
      ),
    ] as ActionRowBuilder<MessageActionRowComponentBuilder>[];
    await interaction.update({ embeds: [embed], components });

    policyIdAndAssetFingerprintCollector.on('end', async (collected) => {
      if (collected.size > 0) {
        const [policyId, assetFingerprint] = collected.at(0)!.content.split('+');
        if (cardanotoken.isValidPolicyId(policyId) && (!assetFingerprint || cardanotoken.isValidAssetFingerprint(assetFingerprint))) {
          phase4GivewayObject.policyId = policyId;
          phase4GivewayObject.assetFingerprint = assetFingerprint;
          this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, phase4GivewayObject);
          const contentAfterPolicy = this.buildContent(locale, interaction.channel!.id, phase4GivewayObject, 6);
          const embedAfterPolicy = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', contentAfterPolicy.join('\n\n'), 'configure-giveaway-add');
          const componentsAfterPolicy = [new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('configure-giveaway/add/finish')
                .setLabel(i18n.__({ phrase: 'configure.giveaway.add.finish', locale }))
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('configure-giveaway/add/redophase4')
                .setLabel(i18n.__({ phrase: 'configure.giveaway.add.redoPhase4', locale }))
                .setStyle(ButtonStyle.Secondary),
            ),
          ] as ActionRowBuilder<MessageActionRowComponentBuilder>[];
          await interaction.editReply({ embeds: [embedAfterPolicy], components: componentsAfterPolicy });
        } else {
          const wrongFormatEmbed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', i18n.__({ phrase: 'configure.giveaway.add.errorPolicyFormat', locale }), 'configure-giveaway-add');
          await interaction.followUp({ embeds: [wrongFormatEmbed], ephemeral: true });
        }
      } else {
        const timeoutEmbed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', i18n.__({ phrase: 'configure.giveaway.add.errorTimeout', locale }), 'configure-giveaway-add');
        await interaction.followUp({ embeds: [timeoutEmbed], ephemeral: true });
      }
    });
  },
  async createGiveaway(interaction, discordServer) {
    const locale = discordServer.getBotLanguage();
    const giveawayObject = this.cache.take(`${interaction.guild!.id}-${interaction.user.id}`) as GiveawayPartial;
    try {
      if (giveawayObject.policyId) {
        const scheduledSnapshot = await interaction.client.services.snapshots.scheduleSnapshot(giveawayObject.snapshotTime ?? new Date().toISOString(), giveawayObject.policyId, giveawayObject.assetFingerprint);
        giveawayObject.snapshotIds = [scheduledSnapshot.id!];
      }
      await interaction.client.services.discordserver.createGiveaway(interaction.guild!.id, giveawayObject as Giveaway);
      const content = this.buildContent(locale, interaction.channel!.id, giveawayObject, 7);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', content.join('\n\n'), 'configure-giveaway-add');
      await interaction.update({ embeds: [embed], components: [] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.update({ content: 'Error while adding giveaway to your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeButton(interaction) {
    try {
      const guildId = interaction.guild!.id;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guildId);
      const locale = discordServer.getBotLanguage();
      if (interaction.customId === 'configure-giveaway/add/startphase3') {
        const giveawayObjectPhase3 = this.cache.take(`${guildId}-${interaction.user.id}`) as GiveawayPartial;
        this.startPhase3(interaction, discordServer, giveawayObjectPhase3);
      } else if (interaction.customId === 'configure-giveaway/add/startphase4' || interaction.customId === 'configure-giveaway/add/redophase4') {
        const giveawayObjectPhase4 = this.cache.take(`${guildId}-${interaction.user.id}`) as GiveawayPartial;
        this.startPhase4(interaction, discordServer, giveawayObjectPhase4);
      } else if (interaction.customId === 'configure-giveaway/add/redophase2') {
        const { description: _, ...giveawayObject } = this.cache.take(`${guildId}-${interaction.user.id}`) as GiveawayPartial;
        const content = this.buildContent(locale, interaction.channel!.id, giveawayObject, 1);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-giveaway add', content.join('\n\n'), 'configure-giveaway-add');
        await interaction.update({ embeds: [embed], components: [] });
        this.startPhase2(interaction, discordServer, giveawayObject);
      } else if (interaction.customId === 'configure-giveaway/add/finish') {
        this.createGiveaway(interaction, discordServer);
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding giveaway to your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    try {
      const guildId = interaction.guild!.id;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guildId);
      const giveawayObject = this.cache.take(`${guildId}-${interaction.user.id}`) as GiveawayPartial;
      if (interaction.customId === 'configure-giveaway/add/tokentype') {
        [giveawayObject.tokenType] = interaction.values;
        giveawayObject.weighted = giveawayObject.tokenType === 'tokenweighted';
      } else if (interaction.customId === 'configure-giveaway/add/drawtype') {
        [giveawayObject.drawType] = interaction.values as GiveawayDrawType[];
      } else if (interaction.customId === 'configure-giveaway/add/uniquewinners') {
        giveawayObject.uniqueWinners = interaction.values[0] === 'yes';
      }
      this.cache.set(`${guildId}-${interaction.user.id}`, giveawayObject);
      this.startPhase3(interaction, discordServer, giveawayObject);
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding giveaway to your server. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
};
