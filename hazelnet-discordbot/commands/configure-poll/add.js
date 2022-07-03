const NodeCache = require('node-cache');
const i18n = require('i18n');
const {
  MessageActionRow, MessageSelectMenu, MessageButton,
} = require('discord.js');
const datetime = require('../../utility/datetime');
const embedBuilder = require('../../utility/embedbuilder');
const discordemoji = require('../../utility/discordemoji');
const cardanotoken = require('../../utility/cardanotoken');
const poll = require('../../utility/poll');

module.exports = {
  cache: new NodeCache({ stdTTL: 900 }),
  async execute(interaction) {
    const pollName = interaction.options.getString('poll-name');
    const pollDisplayName = interaction.options.getString('poll-displayname');
    const pollOpenTime = interaction.options.getString('poll-opentime');
    const pollCloseTime = interaction.options.getString('poll-closetime');
    const requiredRole = interaction.options.getRole('required-role');
    const publishChannel = interaction.options.getChannel('publish-channel');

    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();

      if (discordServer.premium) {
        if (poll.isValidName(pollName)) {
          const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);

          if (!datetime.isValidISOTimestamp(pollOpenTime)) {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale }, { parameter: 'poll-opentime', value: pollOpenTime }), 'configure-poll-add');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
          }
          if (!datetime.isValidISOTimestamp(pollCloseTime)) {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', i18n.__({ phrase: 'errors.invalidIsoDateFormat', locale }, { parameter: 'poll-closetime', value: pollCloseTime }), 'configure-poll-add');
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
          }

          const pollObject = {
            name: pollName,
            displayName: pollDisplayName,
            creator: externalAccount.id,
            openAfter: pollOpenTime,
            openUntil: pollCloseTime,
            channelId: publishChannel?.id,
          };
          if (requiredRole) {
            pollObject.requiredRoles = [{ roleId: requiredRole.id }];
          }

          const content = this.buildContent(locale, interaction.channel.id, pollObject, 1);
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
          await interaction.editReply({ embeds: [embed], ephemeral: true });

          this.startPhase2(interaction, discordServer, pollObject);
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', i18n.__({ phrase: 'configure.poll.add.invalidName', locale }, { pollName }), 'configure-poll-add');
          await interaction.editReply({ embeds: [embed], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', i18n.__({ phrase: 'configure.poll.add.noPremium', locale }), 'configure-poll-add');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding poll to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
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
        pollOpenTime: pollObject.openAfter.replace('T', ' ').replace('Z', ''),
        pollCloseTime: pollObject.openUntil.replace('T', ' ').replace('Z', ''),
      }));
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
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase2Description', locale }, { description: pollObject.description }));
    }
    if (step >= 4) {
      content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase3Options', locale }, {
        options: pollObject.options.map((option, idx) => `**${idx + 1}:** ${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text}`).join('\n'),
      }));
    }
    if (step >= 6) {
      const resultsVisible = pollObject.resultsVisible ?? true;
      content.push(i18n.__({ phrase: resultsVisible ? 'configure.poll.add.publicVoteYesDescription' : 'configure.poll.add.publicVoteNoDescription', locale }));
      const multipleVotes = pollObject.multipleVotes ?? false;
      content.push(i18n.__({ phrase: multipleVotes ? 'configure.poll.add.multipleVoteYesDescription' : 'configure.poll.add.multipleVoteNoDescription', locale }));
      if (pollObject.tokenType !== 'no') {
        if (pollObject.assetFingerprint) {
          content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase5NextStepsPolicyIdAndFingerprint', locale }, pollObject));
          if (pollObject.tokenType === 'tokenweighted') {
            content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase5NextStepsWeighted', locale }, pollObject));
          }
        } else if (pollObject.policyId) {
          content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase5NextStepsPolicyIdOnly', locale }, pollObject));
          if (pollObject.tokenType === 'tokenweighted') {
            content.push(i18n.__({ phrase: 'configure.poll.add.previewPhase5NextStepsWeighted', locale }, pollObject));
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
    const collector = interaction.channel.createMessageCollector(this.defaultCollectorOptions());

    collector.on('end', async (collected) => {
      if (collected.size > 0) {
        const phase2PollObject = { description: collected.at(0).content, ...pollObject };
        const content = this.buildContent(locale, interaction.channel.id, phase2PollObject, 2);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
        this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, phase2PollObject);
        const components = [new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId('configure-poll/add/startphase3')
              .setLabel(i18n.__({ phrase: 'configure.poll.add.startPhase3', locale }))
              .setStyle('PRIMARY'),
            new MessageButton()
              .setCustomId('configure-poll/add/redophase2')
              .setLabel(i18n.__({ phrase: 'configure.poll.add.redoPhase2', locale }))
              .setStyle('SECONDARY'),
          ),
        ];
        await interaction.editReply({ embeds: [embed], components, ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', i18n.__({ phrase: 'configure.poll.add.errorTimeout', locale }), 'configure-poll-add');
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      }
    });
  },
  startPhase3(interaction, discordServer, pollObject) {
    const locale = discordServer.getBotLanguage();
    const onlyPollCreatorMessageFilter = (message) => message.author.id === interaction.user.id;
    const optionCollector = interaction.channel.createMessageCollector(this.defaultCollectorOptions(onlyPollCreatorMessageFilter, 10));
    const phase3PollObject = { ...pollObject, options: [], optionCollector };

    optionCollector.on('collect', async (collectedMessage) => {
      phase3PollObject.options.push({
        messageId: collectedMessage.id,
        text: collectedMessage.content,
      });
      this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, phase3PollObject);

      const content = this.buildContent(locale, interaction.channel.id, phase3PollObject, 4);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
      const components = this.getVoteOptionComponents(locale, phase3PollObject);
      await interaction.editReply({ embeds: [embed], components, ephemeral: true });

      const onlyAuthorReactionsFilter = (_, user) => user.id === collectedMessage.author.id;
      const reactionCollector = collectedMessage.createReactionCollector(this.defaultCollectorOptions(onlyAuthorReactionsFilter));

      reactionCollector.on('end', async (collectedReactions) => {
        if (collectedReactions.size > 0) {
          const optionReaction = collectedReactions.at(0);
          const optionToEnhance = phase3PollObject.options.find((option) => option.messageId === optionReaction.message.id);
          if (optionToEnhance) {
            optionToEnhance.reactionId = optionReaction._emoji.id;
            optionToEnhance.reactionName = optionReaction._emoji.name;
          }
          this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, phase3PollObject);
          const contentWithReaction = this.buildContent(locale, interaction.channel.id, phase3PollObject, 4);
          const embedWithReaction = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', contentWithReaction.join('\n\n'), 'configure-poll-add');

          const componentsWithReaction = this.getVoteOptionComponents(locale, phase3PollObject);
          await interaction.editReply({ embeds: [embedWithReaction], components: componentsWithReaction, ephemeral: true });
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
      new MessageButton()
        .setCustomId('configure-poll/add/redophase3')
        .setLabel(i18n.__({ phrase: 'configure.poll.add.redoPhase3', locale }))
        .setStyle('SECONDARY'),
    ];
    if (this.validateOptions(phase3PollObject.options)) {
      buttons.unshift(new MessageButton()
        .setCustomId('configure-poll/add/startphase4')
        .setLabel(i18n.__({ phrase: 'configure.poll.add.startPhase4', locale }))
        .setStyle('PRIMARY'));
    }
    return [new MessageActionRow().addComponents(...buttons)];
  },
  validateOptions(options) {
    return options.every((option) => option.text.length && (option.reactionId || option.reactionName)) && options.length >= 2;
  },
  async startPhase4(interaction, discordServer, pollObject) {
    this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, pollObject);
    const locale = discordServer.getBotLanguage();
    const content = this.buildContent(locale, interaction.channel.id, pollObject, 5);
    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
    const components = [
      new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('configure-poll/add/resultsvisible')
            .setPlaceholder(i18n.__({ phrase: 'configure.poll.add.isPublicVote', locale }).substring(0, 100))
            .addOptions(this.getYesNoOptions(locale, pollObject.resultsVisible ?? true, 'publicVoteYes', 'publicVoteYesDescription', '👁', 'publicVoteNo', 'publicVoteNoDescription', '🔐')),
        ),
      new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('configure-poll/add/multiplevotes')
            .setPlaceholder(i18n.__({ phrase: 'configure.poll.add.isMultipleVotes', locale }).substring(0, 100))
            .addOptions(this.getYesNoOptions(locale, pollObject.multipleVotes ?? false, 'multipleVoteYes', 'multipleVoteYesDescription', '🖐', 'multipleVoteNo', 'multipleVoteNoDescription', '1️⃣')),
        ),
      new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('configure-poll/add/tokentype')
            .setPlaceholder(i18n.__({ phrase: 'configure.poll.add.isTokenOwnershipRequired', locale }).substring(0, 100))
            .addOptions(this.getTokenOwnershipOptions(locale, pollObject.tokenType)),
        ),
    ];

    if (pollObject.tokenType) {
      const finish = pollObject.tokenType === 'no';
      components.push(new MessageActionRow()
        .addComponents(new MessageButton()
          .setCustomId(finish ? 'configure-poll/add/finish' : 'configure-poll/add/startphase5')
          .setLabel(i18n.__({ phrase: finish ? 'configure.poll.add.finish' : 'configure.poll.add.startPhase5', locale }))
          .setStyle('PRIMARY')));
    }

    await interaction.update({ embeds: [embed], components, ephemeral: true });
  },
  getYesNoOptions(locale, yesIsSelected, yesLabel, yesDescription, yesEmoji, noLabel, noDescription, noEmoji) {
    return [{
      label: i18n.__({ phrase: `configure.poll.add.${yesLabel}`, locale }).substring(0, 100),
      description: i18n.__({ phrase: `configure.poll.add.${yesDescription}`, locale }).substring(0, 100),
      value: 'yes',
      emoji: { id: null, name: yesEmoji },
      default: yesIsSelected,
    }, {
      label: i18n.__({ phrase: `configure.poll.add.${noLabel}`, locale }).substring(0, 100),
      description: i18n.__({ phrase: `configure.poll.add.${noDescription}`, locale }).substring(0, 100),
      value: 'no',
      emoji: { id: null, name: noEmoji },
      default: !yesIsSelected,
    }];
  },
  getTokenOwnershipOptions(locale, tokenType) {
    return [{
      label: i18n.__({ phrase: 'configure.poll.add.tokenTypeNone', locale }).substring(0, 100),
      description: i18n.__({ phrase: 'configure.poll.add.tokenTypeNoneDescription', locale }).substring(0, 100),
      value: 'no',
      emoji: { id: null, name: '🔓' },
      default: tokenType === 'no',
    }, {
      label: i18n.__({ phrase: 'configure.poll.add.tokenTypeHolderOnly', locale }).substring(0, 100),
      description: i18n.__({ phrase: 'configure.poll.add.tokenTypeHolderOnlyDescription', locale }).substring(0, 100),
      value: 'token',
      emoji: { id: null, name: '📃' },
      default: tokenType === 'token',
    }, {
      label: i18n.__({ phrase: 'configure.poll.add.tokenTypeHolderWeighted', locale }).substring(0, 100),
      description: i18n.__({ phrase: 'configure.poll.add.tokenTypeHolderWeightedDescription', locale }).substring(0, 100),
      value: 'tokenweighted',
      emoji: { id: null, name: '⚖' },
      default: tokenType === 'tokenweighted',
    }];
  },
  async startPhase5(interaction, discordServer, pollObject) {
    const locale = discordServer.getBotLanguage();
    const onlyPollCreatorMessageFilter = (message) => message.author.id === interaction.user.id;
    const policyIdAndAssetFingerprintCollector = interaction.channel.createMessageCollector(this.defaultCollectorOptions(onlyPollCreatorMessageFilter));
    const phase5PollObject = {
      ...pollObject,
      policyId: null,
      assetFingerprint: null,
      policyIdAndAssetFingerprintCollector,
    };
    this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, phase5PollObject);
    const content = this.buildContent(locale, interaction.channel.id, phase5PollObject, 6);
    const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
    const components = [new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('configure-poll/add/redophase5')
          .setLabel(i18n.__({ phrase: 'configure.poll.add.redoPhase5', locale }))
          .setStyle('SECONDARY'),
      ),
    ];
    await interaction.update({ embeds: [embed], components, ephemeral: true });

    policyIdAndAssetFingerprintCollector.on('end', async (collected) => {
      if (collected.size > 0) {
        const [policyId, assetFingerprint] = collected.at(0).content.split('+');
        if (cardanotoken.isValidPolicyId(policyId) && (!assetFingerprint || cardanotoken.isValidAssetFingerprint(assetFingerprint))) {
          phase5PollObject.policyId = policyId;
          phase5PollObject.assetFingerprint = assetFingerprint;
          this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, phase5PollObject);
          const contentAfterPolicy = this.buildContent(locale, interaction.channel.id, phase5PollObject, 6);
          const embedAfterPolicy = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', contentAfterPolicy.join('\n\n'), 'configure-poll-add');
          const componentsAfterPolicy = [new MessageActionRow()
            .addComponents(
              new MessageButton()
                .setCustomId('configure-poll/add/finish')
                .setLabel(i18n.__({ phrase: 'configure.poll.add.finish', locale }))
                .setStyle('PRIMARY'),
              new MessageButton()
                .setCustomId('configure-poll/add/redophase5')
                .setLabel(i18n.__({ phrase: 'configure.poll.add.redoPhase5', locale }))
                .setStyle('SECONDARY'),
            ),
          ];
          await interaction.editReply({ embeds: [embedAfterPolicy], components: componentsAfterPolicy, ephemeral: true });
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
    const pollObject = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
    try {
      if (pollObject.policyId) {
        const scheduledSnapshot = await interaction.client.services.snapshots.scheduleSnapshot(new Date().toISOString(), pollObject.policyId, pollObject.assetFingerprint);
        pollObject.snapshotId = scheduledSnapshot.id;
      }
      await interaction.client.services.discordserver.createPoll(interaction.guild.id, pollObject);
      const content = this.buildContent(locale, interaction.channel.id, pollObject, 7);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
      await interaction.update({ embeds: [embed], components: [], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding poll to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeButton(interaction) {
    try {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      if (interaction.customId === 'configure-poll/add/startphase3') {
        const pollObjectPhase3 = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
        const content = this.buildContent(locale, interaction.channel.id, pollObjectPhase3, 3);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
        await interaction.update({ embeds: [embed], components: [], ephemeral: true });
        this.startPhase3(interaction, discordServer, pollObjectPhase3);
      } else if (interaction.customId === 'configure-poll/add/startphase4') {
        const { optionCollector, ...pollObject } = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
        optionCollector.stop('cancelled');
        this.startPhase4(interaction, discordServer, pollObject);
      } else if (interaction.customId === 'configure-poll/add/startphase5' || interaction.customId === 'configure-poll/add/redophase5') {
        const pollObjectPhase5 = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
        this.startPhase5(interaction, discordServer, pollObjectPhase5);
      } else if (interaction.customId === 'configure-poll/add/redophase2') {
        const { description, ...pollObject } = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
        const content = this.buildContent(locale, interaction.channel.id, pollObject, 1);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
        await interaction.update({ embeds: [embed], components: [], ephemeral: true });
        this.startPhase2(interaction, discordServer, pollObject);
      } else if (interaction.customId === 'configure-poll/add/redophase3') {
        const { options, optionCollector, ...pollObject } = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
        optionCollector.stop('cancelled');
        const content = this.buildContent(locale, interaction.channel.id, pollObject, 3);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add', content.join('\n\n'), 'configure-poll-add');
        await interaction.update({ embeds: [embed], components: [], ephemeral: true });
        this.startPhase3(interaction, discordServer, pollObject);
      } else if (interaction.customId === 'configure-poll/add/finish') {
        this.createPoll(interaction, discordServer);
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding poll to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    try {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const pollObject = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
      if (interaction.customId === 'configure-poll/add/resultsvisible') {
        pollObject.resultsVisible = interaction.values[0] === 'yes';
      } else if (interaction.customId === 'configure-poll/add/multiplevotes') {
        pollObject.multipleVotes = interaction.values[0] === 'yes';
      } else if (interaction.customId === 'configure-poll/add/tokentype') {
        [pollObject.tokenType] = interaction.values;
        pollObject.weighted = pollObject.tokenType === 'tokenweighted';
      }
      this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, pollObject);
      this.startPhase4(interaction, discordServer, pollObject);
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding poll to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  defaultCollectorOptions(filter, max) {
    return {
      filter,
      time: 5 * 60000,
      dispose: true,
      max: max ?? 1,
    };
  },
};
