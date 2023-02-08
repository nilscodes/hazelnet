import NodeCache from 'node-cache';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { Poll, PollOption, PollPartial } from '../../utility/polltypes';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, MessageActionRowComponentBuilder, MessageReaction, SelectMenuBuilder, SelectMenuComponentOptionData, User } from 'discord.js';
import { AugmentedButtonInteraction, AugmentedCommandInteraction, AugmentedSelectMenuInteraction } from '../../utility/hazelnetclient';
import embedBuilder from '../../utility/embedbuilder';
import cardanotoken from '../../utility/cardanotoken';
import poll from '../../utility/poll';
import datetime from '../../utility/datetime';
import discordemoji from '../../utility/discordemoji';
import { DiscordServer } from '../../utility/sharedtypes';

interface PollAddCommand extends BotSubcommand {
  cache: NodeCache
  buildContent(locale: string, currentChannel: string, pollObject: PollPartial, step: number): string[]
  startPhase2(interaction: AugmentedCommandInteraction | AugmentedButtonInteraction, discordServer: DiscordServer, pollObject: PollPartial): void
  startPhase3(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, pollObject: PollPartial): void
  startPhase4(interaction: AugmentedButtonInteraction | AugmentedSelectMenuInteraction, discordServer: DiscordServer, pollObject: PollPartial): void
  startPhase5(interaction: AugmentedButtonInteraction, discordServer: DiscordServer, pollObject: PollPartial): void
  getVoteOptionComponents(locale: string, pollOptions: PollPartial): ActionRowBuilder<MessageActionRowComponentBuilder>[]
  validateOptions(options: PollOption[]): boolean
  getYesNoOptions(locale: string, yesIsSelected: boolean, yesLabel: string, yesDescription: string, yesEmoji: string, noLabel: string, noDescription: string, noEmoji: string): SelectMenuComponentOptionData[]
  getTokenOwnershipOptions(locale: string, tokenType: string): SelectMenuComponentOptionData[]
  createPoll(interaction: AugmentedButtonInteraction, discordServer: DiscordServer): void
}

export default <PollAddCommand> {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const pollName = interaction.options.getString('poll-name', true);
    const pollDisplayName = interaction.options.getString('poll-displayname', true);
    const pollOpenTime = interaction.options.getString('poll-opentime', true);
    const pollCloseTime = interaction.options.getString('poll-closetime', true);
    const requiredRole = interaction.options.getRole('required-role');
    const publishChannel = interaction.options.getChannel('publish-channel');

    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();

      if (discordServer.premium) {
        if (poll.isValidName(pollName)) {
          const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);

          if (!datetime.isValidISOTimestamp(pollOpenTime)) {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale }, { parameter: 'poll-opentime', value: pollOpenTime }), 'configure-poll-add');
            await interaction.editReply({ embeds: [embed] });
            return;
          }
          if (!datetime.isValidISOTimestamp(pollCloseTime)) {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale }, { parameter: 'poll-closetime', value: pollCloseTime }), 'configure-poll-add');
            await interaction.editReply({ embeds: [embed] });
            return;
          }

          const pollObject = {
            name: pollName,
            displayName: pollDisplayName,
            creator: externalAccount.id,
            openAfter: pollOpenTime,
            openUntil: pollCloseTime,
            channelId: publishChannel?.id,
          } as PollPartial;
          if (requiredRole) {
            pollObject.requiredRoles = [{ roleId: requiredRole.id }];
          }

          const content = this.buildContent(locale, interaction.channel!.id, pollObject, 1);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
          await interaction.editReply({ embeds: [embed] });

          this.startPhase2(interaction, discordServer, pollObject);
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', i18n.__({ phrase: 'configure.poll.add.invalidName', locale }, { pollName }), 'configure-poll-add');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', i18n.__({ phrase: 'configure.poll.add.noPremium', locale }), 'configure-poll-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding poll to your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  buildContent(locale, currentChannel, pollObject, step) {
    const content = [];
    if (step === 7) {
      content.push(i18n.__({ phrase: 'configure.poll.add.success', locale }));
    } else {
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase1', locale }));
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase1Details', locale }, {
        name: pollObject.name,
        displayName: pollObject.displayName,
        pollOpenTime: pollObject.openAfter!.replace('T', ' ').replace('Z', ''),
        pollCloseTime: pollObject.openUntil!.replace('T', ' ').replace('Z', ''),
      } as any));
    }

    if (pollObject.channelId) {
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase1Channel', locale }, { publishChannel: pollObject.channelId }));
    } else {
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase1NoChannel', locale }));
    }
    if (pollObject.requiredRoles?.length) {
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase1RequiredRole', locale }, { requiredRole: pollObject.requiredRoles[0].roleId }));
    } else {
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase1NoRequiredRole', locale }));
    }
    if (step >= 2) {
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase2Description', locale }, { description: pollObject.description } as any));
    }
    if (step >= 4) {
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase3Options', locale }, {
        options: pollObject.options!.map((option, idx) => `**${idx + 1}:** ${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text}`).join('\n'),
      }));
    }
    if (step >= 6) {
      const resultsVisible = pollObject.resultsVisible ?? true;
      content.push(i18n.__({ phrase: resultsVisible ? 'configure.poll.add.publicVoteYesDescription' : 'configure.poll.add.publicVoteNoDescription', locale }));
      const multipleVotes = pollObject.multipleVotes ?? false;
      content.push(i18n.__({ phrase: multipleVotes ? 'configure.poll.add.multipleVoteYesDescription' : 'configure.poll.add.multipleVoteNoDescription', locale }));
      if (pollObject.tokenType !== 'no') {
        if (pollObject.assetFingerprint) {
          content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase5NextStepsPolicyIdAndFingerprint', locale }, pollObject as any));
          if (pollObject.tokenType === 'tokenweighted') {
            content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase5NextStepsWeighted', locale }, pollObject as any));
          }
        } else if (pollObject.policyId) {
          content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase5NextStepsPolicyIdOnly', locale }, pollObject as any));
          if (pollObject.tokenType === 'tokenweighted') {
            content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase5NextStepsWeighted', locale }, pollObject as any));
          }
        } else {
          content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase5NextSteps', locale }));
        }
      }
    }
    if (step === 1) {
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase1NextSteps', locale }, { currentChannel }));
    } else if (step === 3) {
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase3NextSteps', locale }, { currentChannel }));
    } else if (step === 4) {
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase3NextSteps', locale }, { currentChannel }));
    } else if (step === 5) {
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase4NextSteps', locale }));
    }
    return content;
  },
  startPhase2(interaction, discordServer, pollObject) {
    const locale = discordServer.getBotLanguage();
    const collector = interaction.channel!.createMessageCollector({
      time: 5 * 60000,
      dispose: true,
      max: 1,
    });

    collector.on('end', async (collected) => {
      if (collected.size > 0) {
        const phase2PollObject = { description: collected.at(0)!.content, ...pollObject };
        const content = this.buildContent(locale, interaction.channel!.id, phase2PollObject, 2);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
        this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, phase2PollObject);
        const components = [new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('configure-poll/add/startphase3')
              .setLabel(i18n.__({ phrase: 'configure.poll.add.startPhase3', locale }))
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('configure-poll/add/redophase2')
              .setLabel(i18n.__({ phrase: 'configure.poll.add.redoPhase2', locale }))
              .setStyle(ButtonStyle.Secondary),
          ),
        ] as ActionRowBuilder<MessageActionRowComponentBuilder>[];
        await interaction.editReply({ embeds: [embed], components });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', i18n.__({ phrase: 'configure.poll.add.errorTimeout', locale }), 'configure-poll-add');
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      }
    });
  },
  startPhase3(interaction, discordServer, pollObject) {
    const locale = discordServer.getBotLanguage();
    const onlyPollCreatorMessageFilter = (message: Message) => message.author.id === interaction.user.id;
    const optionCollector = interaction.channel!.createMessageCollector({
      filter: onlyPollCreatorMessageFilter,
      time: 5 * 60000,
      dispose: true,
      max: 10,
    });
    const phase3PollObject = { ...pollObject, options: [], optionCollector } as PollPartial;

    optionCollector.on('collect', async (collectedMessage) => {
      phase3PollObject.options!.push({
        messageId: collectedMessage.id,
        text: collectedMessage.content,
      });
      this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, phase3PollObject);

      const content = this.buildContent(locale, interaction.channel!.id, phase3PollObject, 4);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
      const components = this.getVoteOptionComponents(locale, phase3PollObject);
      await interaction.editReply({ embeds: [embed], components });

      const onlyAuthorReactionsFilter = (_: MessageReaction, user: User) => user.id === collectedMessage.author.id;
      const reactionCollector = collectedMessage.createReactionCollector({
        filter: onlyAuthorReactionsFilter,
        time: 5 * 60000,
        dispose: true,
        max: 1
      });

      reactionCollector.on('end', async (collectedReactions) => {
        if (collectedReactions.size > 0) {
          const optionReaction = collectedReactions.at(0)!;
          const optionToEnhance = phase3PollObject.options!.find((option) => option.messageId === optionReaction.message.id);
          if (optionToEnhance) {
            optionToEnhance.reactionId = optionReaction.emoji.id;
            optionToEnhance.reactionName = optionReaction.emoji.name;
          }
          this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, phase3PollObject);
          const contentWithReaction = this.buildContent(locale, interaction.channel!.id, phase3PollObject, 4);
          const embedWithReaction = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', contentWithReaction.join('\n\n'), 'configure-poll-add');

          const componentsWithReaction = this.getVoteOptionComponents(locale, phase3PollObject);
          await interaction.editReply({ embeds: [embedWithReaction], components: componentsWithReaction });
        }
      });
    });
    optionCollector.on('end', async (collectedMessages, reason) => {
      if (collectedMessages.size < 2 && reason !== 'cancelled') {
        const embedOptionTimeout = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', i18n.__({ phrase: 'configure.poll.add.errorTimeout', locale }), 'configure-poll-add');
        await interaction.followUp({ embeds: [embedOptionTimeout], ephemeral: true });
      }
    });
  },
  getVoteOptionComponents(locale, phase3PollObject) {
    const buttons = [
      new ButtonBuilder()
        .setCustomId('configure-poll/add/redophase3')
        .setLabel(i18n.__({ phrase: 'configure.poll.add.redoPhase3', locale }))
        .setStyle(ButtonStyle.Secondary),
    ];
    if (this.validateOptions(phase3PollObject.options!)) {
      buttons.unshift(new ButtonBuilder()
        .setCustomId('configure-poll/add/startphase4')
        .setLabel(i18n.__({ phrase: 'configure.poll.add.startPhase4', locale }))
        .setStyle(ButtonStyle.Primary));
    }
    return [new ActionRowBuilder().addComponents(...buttons)];
  },
  validateOptions(options) {
    return options.every((option) => option.text.length && (option.reactionId || option.reactionName)) && options.length >= 2;
  },
  async startPhase4(interaction, discordServer, pollObject) {
    this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, pollObject);
    const locale = discordServer.getBotLanguage();
    const content = this.buildContent(locale, interaction.channel!.id, pollObject, 5);
    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
    const components = [
      new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('configure-poll/add/resultsvisible')
            .setPlaceholder(i18n.__({ phrase: 'configure.poll.add.isPublicVote', locale }).substring(0, 100))
            .addOptions(this.getYesNoOptions(locale, pollObject.resultsVisible ?? true, 'publicVoteYes', 'publicVoteYesDescription', '👁', 'publicVoteNo', 'publicVoteNoDescription', '🔐')),
        ),
      new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('configure-poll/add/multiplevotes')
            .setPlaceholder(i18n.__({ phrase: 'configure.poll.add.isMultipleVotes', locale }).substring(0, 100))
            .addOptions(this.getYesNoOptions(locale, pollObject.multipleVotes ?? false, 'multipleVoteYes', 'multipleVoteYesDescription', '🖐', 'multipleVoteNo', 'multipleVoteNoDescription', '1️⃣')),
        ),
      new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('configure-poll/add/tokentype')
            .setPlaceholder(i18n.__({ phrase: 'configure.poll.add.isTokenOwnershipRequired', locale }).substring(0, 100))
            .addOptions(this.getTokenOwnershipOptions(locale, pollObject.tokenType!)),
        ),
    ] as ActionRowBuilder<MessageActionRowComponentBuilder>[];

    if (pollObject.tokenType) {
      const finish = pollObject.tokenType === 'no';
      components.push(new ActionRowBuilder()
        .addComponents(new ButtonBuilder()
          .setCustomId(finish ? 'configure-poll/add/finish' : 'configure-poll/add/startphase5')
          .setLabel(i18n.__({ phrase: finish ? 'configure.poll.add.finish' : 'configure.poll.add.startPhase5', locale }))
          .setStyle(ButtonStyle.Primary)) as ActionRowBuilder<MessageActionRowComponentBuilder>);
    }

    await interaction.update({ embeds: [embed], components });
  },
  getYesNoOptions(locale, yesIsSelected, yesLabel, yesDescription, yesEmoji, noLabel, noDescription, noEmoji) {
    return [{
      label: i18n.__({ phrase: `configure.poll.add.${yesLabel}`, locale }).substring(0, 100),
      description: i18n.__({ phrase: `configure.poll.add.${yesDescription}`, locale }).substring(0, 100),
      value: 'yes',
      emoji: { name: yesEmoji },
      default: yesIsSelected,
    }, {
      label: i18n.__({ phrase: `configure.poll.add.${noLabel}`, locale }).substring(0, 100),
      description: i18n.__({ phrase: `configure.poll.add.${noDescription}`, locale }).substring(0, 100),
      value: 'no',
      emoji: { name: noEmoji },
      default: !yesIsSelected,
    }];
  },
  getTokenOwnershipOptions(locale, tokenType) {
    return [{
      label: i18n.__({ phrase: 'configure.poll.add.tokenTypeNone', locale }).substring(0, 100),
      description: i18n.__({ phrase: 'configure.poll.add.tokenTypeNoneDescription', locale }).substring(0, 100),
      value: 'no',
      emoji: { name: '🔓' },
      default: tokenType === 'no',
    }, {
      label: i18n.__({ phrase: 'configure.poll.add.tokenTypeHolderOnly', locale }).substring(0, 100),
      description: i18n.__({ phrase: 'configure.poll.add.tokenTypeHolderOnlyDescription', locale }).substring(0, 100),
      value: 'token',
      emoji: { name: '📃' },
      default: tokenType === 'token',
    }, {
      label: i18n.__({ phrase: 'configure.poll.add.tokenTypeHolderWeighted', locale }).substring(0, 100),
      description: i18n.__({ phrase: 'configure.poll.add.tokenTypeHolderWeightedDescription', locale }).substring(0, 100),
      value: 'tokenweighted',
      emoji: { name: '⚖' },
      default: tokenType === 'tokenweighted',
    }];
  },
  async startPhase5(interaction, discordServer, pollObject) {
    const locale = discordServer.getBotLanguage();
    const onlyPollCreatorMessageFilter = (message: Message) => message.author.id === interaction.user.id;
    const policyIdAndAssetFingerprintCollector = interaction.channel!.createMessageCollector({
      filter: onlyPollCreatorMessageFilter,
      time: 5 * 60000,
      dispose: true,
      max: 1
    });
    const phase5PollObject = {
      ...pollObject,
      policyId: null,
      assetFingerprint: null,
      policyIdAndAssetFingerprintCollector,
    } as unknown as PollPartial;
    this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, phase5PollObject);
    const content = this.buildContent(locale, interaction.channel!.id, phase5PollObject, 6);
    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
    const components = [new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('configure-poll/add/redophase5')
          .setLabel(i18n.__({ phrase: 'configure.poll.add.redoPhase5', locale }))
          .setStyle(ButtonStyle.Secondary),
      ),
    ] as ActionRowBuilder<MessageActionRowComponentBuilder>[];
    await interaction.update({ embeds: [embed], components });

    policyIdAndAssetFingerprintCollector.on('end', async (collected) => {
      if (collected.size > 0) {
        const [policyId, assetFingerprint] = collected.at(0)!.content.split('+');
        if (cardanotoken.isValidPolicyId(policyId) && (!assetFingerprint || cardanotoken.isValidAssetFingerprint(assetFingerprint))) {
          phase5PollObject.policyId = policyId;
          phase5PollObject.assetFingerprint = assetFingerprint;
          this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, phase5PollObject);
          const contentAfterPolicy = this.buildContent(locale, interaction.channel!.id, phase5PollObject, 6);
          const embedAfterPolicy = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', contentAfterPolicy.join('\n\n'), 'configure-poll-add');
          const componentsAfterPolicy = [new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('configure-poll/add/finish')
                .setLabel(i18n.__({ phrase: 'configure.poll.add.finish', locale }))
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('configure-poll/add/redophase5')
                .setLabel(i18n.__({ phrase: 'configure.poll.add.redoPhase5', locale }))
                .setStyle(ButtonStyle.Secondary),
            ),
          ] as ActionRowBuilder<MessageActionRowComponentBuilder>[];
          await interaction.editReply({ embeds: [embedAfterPolicy], components: componentsAfterPolicy });
        } else {
          const wrongFormatEmbed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', i18n.__({ phrase: 'configure.poll.add.errorPolicyFormat', locale }), 'configure-poll-add');
          await interaction.followUp({ embeds: [wrongFormatEmbed], ephemeral: true });
        }
      } else {
        const timeoutEmbed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', i18n.__({ phrase: 'configure.poll.add.errorTimeout', locale }), 'configure-poll-add');
        await interaction.followUp({ embeds: [timeoutEmbed], ephemeral: true });
      }
    });
  },
  async createPoll(interaction, discordServer) {
    const locale = discordServer.getBotLanguage();
    const pollObject = this.cache.take(`${interaction.guild!.id}-${interaction.user.id}`) as PollPartial;
    try {
      if (pollObject.policyId) {
        const scheduledSnapshot = await interaction.client.services.snapshots.scheduleSnapshot(new Date().toISOString(), pollObject.policyId, pollObject.assetFingerprint);
        pollObject.snapshotId = scheduledSnapshot.id;
      }
      await interaction.client.services.discordserver.createPoll(interaction.guild!.id, pollObject as Poll);
      const content = this.buildContent(locale, interaction.channel!.id, pollObject, 7);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
      await interaction.update({ embeds: [embed], components: [] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.update({ content: 'Error while adding poll to your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeButton(interaction) {
    try {
      const guildId = interaction.guild!.id;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guildId);
      const locale = discordServer.getBotLanguage();
      if (interaction.customId === 'configure-poll/add/startphase3') {
        const pollObjectPhase3 = this.cache.take(`${guildId}-${interaction.user.id}`) as PollPartial;
        const content = this.buildContent(locale, interaction.channel!.id, pollObjectPhase3, 3);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
        await interaction.update({ embeds: [embed], components: [] });
        this.startPhase3(interaction, discordServer, pollObjectPhase3);
      } else if (interaction.customId === 'configure-poll/add/startphase4') {
        const { optionCollector, ...pollObject } = this.cache.take(`${guildId}-${interaction.user.id}`) as PollPartial;
        optionCollector!.stop('cancelled');
        this.startPhase4(interaction, discordServer, pollObject);
      } else if (interaction.customId === 'configure-poll/add/startphase5' || interaction.customId === 'configure-poll/add/redophase5') {
        const pollObjectPhase5 = this.cache.take(`${guildId}-${interaction.user.id}`) as PollPartial;
        this.startPhase5(interaction, discordServer, pollObjectPhase5);
      } else if (interaction.customId === 'configure-poll/add/redophase2') {
        const { description, ...pollObject } = this.cache.take(`${guildId}-${interaction.user.id}`) as PollPartial;
        const content = this.buildContent(locale, interaction.channel!.id, pollObject, 1);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
        await interaction.update({ embeds: [embed], components: [] });
        this.startPhase2(interaction, discordServer, pollObject);
      } else if (interaction.customId === 'configure-poll/add/redophase3') {
        const { options, optionCollector, ...pollObject } = this.cache.take(`${guildId}-${interaction.user.id}`) as PollPartial;
        optionCollector!.stop('cancelled');
        const content = this.buildContent(locale, interaction.channel!.id, pollObject, 3);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
        await interaction.update({ embeds: [embed], components: [] });
        this.startPhase3(interaction, discordServer, pollObject);
      } else if (interaction.customId === 'configure-poll/add/finish') {
        this.createPoll(interaction, discordServer);
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding poll to your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    try {
      const guildId = interaction.guild!.id;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guildId);
      const pollObject = this.cache.take(`${guildId}-${interaction.user.id}`) as PollPartial;
      if (interaction.customId === 'configure-poll/add/resultsvisible') {
        pollObject.resultsVisible = interaction.values[0] === 'yes';
      } else if (interaction.customId === 'configure-poll/add/multiplevotes') {
        pollObject.multipleVotes = interaction.values[0] === 'yes';
      } else if (interaction.customId === 'configure-poll/add/tokentype') {
        [pollObject.tokenType] = interaction.values;
        pollObject.weighted = pollObject.tokenType === 'tokenweighted';
      }
      this.cache.set(`${guildId}-${interaction.user.id}`, pollObject);
      this.startPhase4(interaction, discordServer, pollObject);
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding poll to your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
