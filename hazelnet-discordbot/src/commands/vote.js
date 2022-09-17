const { SlashCommandBuilder, ButtonStyle } = require('discord.js');
const i18n = require('i18n');
const {
  ActionRowBuilder, SelectMenuBuilder, ButtonBuilder,
} = require('discord.js');
const CommandTranslations = require('../utility/commandtranslations');
const embedBuilder = require('../utility/embedbuilder');
const commandbase = require('../utility/commandbase');
const pollUtil = require('../utility/poll');
const discordemoji = require('../utility/discordemoji');
const pollutil = require('../utility/poll');
const discordstring = require('../utility/discordstring');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('vote', locale);
    return new SlashCommandBuilder()
      .setName('vote')
      .setDescription(ci18n.description());
  },
  augmentPermissions: commandbase.augmentPermissionsUser,
  commandTags: ['poll'],
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      if (discordServer.premium) {
        const nonArchivedPolls = (await interaction.client.services.discordserver.getPolls(interaction.guild.id))
          .filter((poll) => !poll.archived)
          .sort((pollA, pollB) => pollA.displayName.localeCompare(pollB.displayName));

        const member = await interaction.guild.members.fetch(interaction.user.id);
        const visiblePolls = nonArchivedPolls.filter((poll) => pollUtil.userCanSeePoll(member, poll));

        const pollFields = visiblePolls.map((poll) => ({ name: poll.displayName, value: i18n.__({ phrase: 'vote.pollInfo', locale }, { poll }) }));
        if (!pollFields.length) {
          pollFields.push({ name: i18n.__({ phrase: 'vote.noPollsTitle', locale }), value: i18n.__({ phrase: 'vote.noPolls', locale }) });
        }
        const components = this.getPollChoices(locale, visiblePolls);
        const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'vote.messageTitle', locale }), i18n.__({ phrase: 'vote.purpose', locale }), 'vote', pollFields);
        await interaction.editReply({ embeds: [embed], components, ephemeral: true });
      } else {
        const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'vote.messageTitle', locale }), i18n.__({ phrase: 'vote.noPremium', locale }), 'vote');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [], ephemeral: true });
      await interaction.followUp({ content: 'Error while getting poll list. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    try {
      await interaction.deferUpdate({ ephemeral: true });
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const isVote = interaction.customId === 'vote/vote';
      const pollId = (isVote ? +interaction.values[0].split('-')[1] : +interaction.values[0].substr(5));
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild.id);
      const poll = polls.find((pollForDetails) => pollForDetails.id === pollId && !pollForDetails.archived);
      if (poll) {
        if (interaction.customId === 'vote/details') {
          const { detailFields, components } = await this.getVoteDetails(locale, poll, interaction, discordServer, member);
          const embed = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'vote.pollInfoTitle', locale }), 'vote', detailFields);
          await interaction.editReply({ embeds: [embed], components, ephemeral: true });
        } else if (isVote) {
          const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
          const votedFor = interaction.values.map((option) => +option.replace(`vote-${poll.id}-option-`, ''));
          const currentVoteData = await interaction.client.services.discordserver.setVoteForUser(interaction.guild.id, poll.id, externalAccount.id, votedFor);
          let resultsText = i18n.__({ phrase: 'vote.resultsNotVisible', locale });
          if (poll.resultsVisible) {
            resultsText = pollutil.getCurrentResults(discordServer, poll, currentVoteData.poll);
          }
          const detailFields = [
            {
              name: i18n.__({ phrase: 'vote.currentResults', locale }),
              value: resultsText,
            },
            {
              name: i18n.__({ phrase: 'vote.yourVote', locale }),
              value: poll.options
                .filter((option) => currentVoteData.user.votes[option.id] > 0)
                .map((option) => `${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text} (${currentVoteData.user.votes[option.id]})`).join('\n'),
            },
          ];
          const embed = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'vote.voteSuccess', locale }), 'vote', detailFields);
          await interaction.editReply({ embeds: [embed], components: [], ephemeral: true });
        }
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [], ephemeral: true });
      await interaction.followUp({ content: 'Error while showing poll details or voting. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId.indexOf('vote/abstain') === 0) {
      try {
        await interaction.deferUpdate({ ephemeral: true });
        const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
        const locale = discordServer.getBotLanguage();
        const pollId = +(interaction.customId.split('/')[2]);
        const polls = await interaction.client.services.discordserver.getPolls(interaction.guild.id);
        const poll = polls.find((pollForDetails) => pollForDetails.id === pollId && !pollForDetails.archived);
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (pollUtil.userCanSeePoll(member, poll)) {
          const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
          const currentVoteData = await interaction.client.services.discordserver.setVoteForUser(interaction.guild.id, poll.id, externalAccount.id, []);
          let resultsText = i18n.__({ phrase: 'vote.resultsNotVisible', locale });
          if (poll.resultsVisible) {
            resultsText = pollutil.getCurrentResults(discordServer, poll, currentVoteData.poll);
          }
          const detailFields = [{
            name: i18n.__({ phrase: 'vote.currentResults', locale }),
            value: resultsText,
          }];
          const embed = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'vote.abstainVoteSuccess', locale }), 'vote', detailFields);
          await interaction.editReply({ embeds: [embed], components: [], ephemeral: true });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        await interaction.editReply({ content: 'Error while abstaining from vote. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
      }
    } else if (interaction.customId.indexOf('vote/widgetvote') === 0) {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const pollId = +(interaction.customId.split('/')[2]);
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild.id);
      const poll = polls.find((pollForDetails) => pollForDetails.id === pollId && !pollForDetails.archived);
      if (poll) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        if (pollUtil.userCanSeePoll(member, poll)) {
          const { detailFields, components } = await this.getVoteDetails(locale, poll, interaction, discordServer, member);
          const embed = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'vote.pollInfoTitle', locale }), 'vote', detailFields);
          await interaction.reply({ embeds: [embed], components, ephemeral: true });
        } else {
          const embed = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'vote.errorNotEligible', locale }), 'vote');
          await interaction.reply({ embeds: [embed], ephemeral: true });
        }
      }
    }
  },
  async getPollVoteOptions(locale, poll, totalVotingPower, hasVoted) {
    if (totalVotingPower > 0) {
      const options = poll.options.map((option, idx) => ({
        label: discordstring.ensureLength(`${idx + 1}: ${option.text}`, 100),
        value: `vote-${poll.id}-option-${option.id}`,
        emoji: {
          id: option.reactionId ?? undefined,
          name: option.reactionName ?? undefined,
        },
      }));
      const components = [new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('vote/vote')
            .setPlaceholder(i18n.__({ phrase: hasVoted ? 'vote.changeVoteOption' : 'vote.chooseVoteOption', locale }))
            .setMaxValues(poll.multipleVotes ? Math.min(totalVotingPower, poll.options.length) : 1)
            .addOptions(options),
        ),
      ];
      if (hasVoted) {
        components.push(new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`vote/abstain/${poll.id}`)
              .setLabel(i18n.__({ phrase: 'vote.abstainVote', locale }))
              .setStyle(ButtonStyle.Danger),
          ));
      }
      return components;
    }
    return [];
  },
  getPollChoices(locale, polls) {
    if (polls.length) {
      return [new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('vote/details')
            .setPlaceholder(i18n.__({ phrase: 'vote.choosePoll', locale }))
            .addOptions(polls.map((poll) => ({
              label: discordstring.ensureLength(poll.displayName, 100),
              description: (poll.description ? discordstring.ensureLength(poll.description, 90) : ''),
              value: `poll-${poll.id}`,
            }))),
        ),
      ];
    }
    return [];
  },
  getVotingPowerText(discordServer, poll, locale, totalVotingPower) {
    if (poll.snapshotId) {
      if (totalVotingPower > 0) {
        const formattedVotingPower = discordServer.formatNumber(totalVotingPower);
        return `${totalVotingPower > 1 ? i18n.__({ phrase: 'vote.votingPowerMultiple', locale }, { totalVotingPower: formattedVotingPower }) : i18n.__({ phrase: 'vote.votingPowerSingleToken', locale })}\n\n${i18n.__({ phrase: 'vote.votingPowerTokenInfo', locale })}`;
      }
      return `${i18n.__({ phrase: 'vote.votingPowerNone', locale })}\n\n${i18n.__({ phrase: 'vote.votingPowerTokenInfo', locale })}`;
    }
    return i18n.__({ phrase: 'vote.votingPowerSingleNoToken', locale });
  },
  async getVoteDetails(locale, poll, interaction, discordServer, member) {
    let resultsText = i18n.__({ phrase: 'vote.resultsNotVisible', locale });
    if (poll.resultsVisible) {
      const results = await interaction.client.services.discordserver.getPollResults(interaction.guild.id, poll.id);
      resultsText = pollutil.getCurrentResults(discordServer, poll, results);
    }
    const detailFields = [
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsDescription', locale }),
        value: poll.description.trim().length ? poll.description.trim() : i18n.__({ phrase: 'configure.poll.list.detailsDescriptionEmpty', locale }),
      },
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsDates', locale }),
        value: i18n.__({ phrase: 'configure.poll.list.pollInfo', locale }, {
          openAfterTimestamp: Math.floor(new Date(poll.openAfter).getTime() / 1000),
          openUntilTimestamp: Math.floor(new Date(poll.openUntil).getTime() / 1000),
        }),
      },
    ];

    if (!poll.voteaireUUID) {
      detailFields.push({
        name: i18n.__({ phrase: 'configure.poll.list.detailsConfiguration', locale }),
        value: i18n.__({ phrase: 'vote.optionList', locale }, {
          multipleVotes: poll.multipleVotes ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
          tokenBased: poll.snapshotId ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
          weighted: poll.weighted ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
        }),
      });
    }

    if (poll.requiredRoles?.length) {
      detailFields.push({
        name: i18n.__({ phrase: 'configure.poll.list.detailsRoles', locale }),
        value: poll.requiredRoles.map((role) => (i18n.__({ phrase: 'configure.poll.list.requiredRoleEntry', locale }, { role }))).join('\n'),
      });
    }

    if (!poll.voteaireUUID) {
      detailFields.push({
        name: i18n.__({ phrase: 'vote.currentResults', locale }),
        value: resultsText,
      });
    }

    let components = [];
    if (!poll.voteaireUUID) {
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const currentVote = await interaction.client.services.discordserver.getVoteOfUser(interaction.guild.id, poll.id, externalAccount.id);
      const totalVotingPower = currentVote.votes['0'];
      detailFields.push({
        name: i18n.__({ phrase: 'vote.yourVotingPower', locale }),
        value: this.getVotingPowerText(discordServer, poll, locale, totalVotingPower),
      });
      // If at least two keys are present, that means in addition to the total voting power at key 0, votes have been cast.
      const hasVoted = Object.keys(currentVote.votes).length > 1;
      if (pollUtil.userCanVoteInPoll(member, poll, totalVotingPower)) {
        components = await this.getPollVoteOptions(locale, poll, totalVotingPower, hasVoted);
      }
      if (hasVoted) {
        detailFields.push({
          name: i18n.__({ phrase: 'vote.yourVote', locale }),
          value: poll.options
            .filter((option) => currentVote.votes[option.id] > 0)
            .map((option) => {
              const formattedVote = discordServer.formatNumber(currentVote.votes[option.id]);
              return `${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text} (${formattedVote})`;
            }).join('\n'),
        });
      }
    } else {
      detailFields.push({
        name: i18n.__({ phrase: 'configure.poll.list.detailsVoteaireLink', locale }),
        value: pollutil.getVoteaireResultsUrl(poll.voteaireUUID),
      });
      detailFields.push({
        name: i18n.__({ phrase: 'configure.poll.list.detailsChoices', locale }),
        value: pollutil.getCurrentOptions(discordServer, poll),
      });
      if (pollUtil.userCanVoteInPoll(member, poll, 1)) {
        components.push(new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setURL(pollutil.getVoteaireVoteUrl(poll.voteaireUUID))
              .setLabel(i18n.__({ phrase: 'vote.voteButton', locale }))
              .setStyle(ButtonStyle.Link),
          ));
      }
    }
    return { detailFields, components };
  },
};
