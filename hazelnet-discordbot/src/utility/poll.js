const i18n = require('i18n');
const {
  MessageActionRow, MessageSelectMenu, MessageButton,
} = require('discord.js');
const discordemoji = require('./discordemoji');

module.exports = {
  isValidName(pollName) {
    const pollNameRegex = /^[A-Za-z][-A-Za-z0-9]{0,29}$/;
    return pollNameRegex.test(pollName);
  },
  hasVotingEnded(poll) {
    if (poll.openUntil) {
      return new Date(poll.openUntil) < new Date();
    }
    return false;
  },
  hasVotingStarted(poll) {
    if (poll.openAfter) {
      return new Date(poll.openAfter) < new Date();
    }
    return true;
  },
  isPollArchived(poll) {
    return !!poll.closed;
  },
  userCanSeePoll(member, poll) {
    if (!this.isPollArchived(poll)) {
      if (poll.requiredRoles?.length) {
        const needsAnyOfRoleIds = poll.requiredRoles.map((role) => role.roleId);
        return needsAnyOfRoleIds.length === 0 || member.roles.cache.some((role) => needsAnyOfRoleIds.includes(role.id));
      }
      return true;
    }
    return false;
  },
  userCanVoteInPoll(member, poll, votingWeight) {
    if (!this.isPollArchived(poll) && !this.hasVotingEnded(poll) && this.hasVotingStarted(poll) && votingWeight > 0) {
      const needsAnyOfRoleIds = poll.requiredRoles.map((role) => role.roleId);
      return needsAnyOfRoleIds.length === 0 || member.roles.cache.some((role) => needsAnyOfRoleIds.includes(role.id));
    }
    return false;
  },
  getVoteaireResultsUrl(voteaireUUID) {
    return `https://voteaire.io/results/${voteaireUUID}`;
  },
  getVoteaireVoteUrl(voteaireUUID) {
    return `https://voteaire.io/vote/${voteaireUUID}`;
  },
  getDiscordPollListParts(discordServer, polls, customId, selectionPhrase) {
    const locale = discordServer.getBotLanguage();
    const sortedPolls = polls.sort((pollA, pollB) => pollA.displayName.localeCompare(pollB.displayName));
    const pollFields = sortedPolls.map((poll) => {
      const pollPhrase = poll.voteaireUUID ? 'configure.poll.list.pollInfoVoteaire' : 'configure.poll.list.pollInfo';
      return {
        name: i18n.__({ phrase: 'configure.poll.list.adminName', locale }, { poll }),
        value: i18n.__({ phrase: pollPhrase, locale }, {
          openAfterTimestamp: Math.floor(new Date(poll.openAfter).getTime() / 1000),
          openUntilTimestamp: Math.floor(new Date(poll.openUntil).getTime() / 1000),
          resultsVisible: i18n.__({ phrase: (poll.resultsVisible ? 'configure.poll.add.publicVoteYes' : 'configure.poll.add.publicVoteNo'), locale }),
          voteaireUUID: poll.voteaireUUID,
          voteaireLink: this.getVoteaireResultsUrl(poll.voteaireUUID),
        }),
      };
    });
    if (!pollFields.length) {
      pollFields.push({ name: i18n.__({ phrase: 'vote.noPollsTitle', locale }), value: i18n.__({ phrase: 'vote.noPolls', locale }) });
    }
    if (!discordServer.premium && sortedPolls.length) {
      pollFields.unshift({
        name: i18n.__({ phrase: 'generic.blackEditionWarning', locale }),
        value: i18n.__({ phrase: 'configure.poll.list.noPremium', locale }),
      });
    }
    const components = this.getPollChoices(locale, sortedPolls, customId, selectionPhrase);
    return { locale, pollFields, components };
  },
  getPollChoices(locale, polls, customId, selectionPhrase) {
    if (polls.length) {
      return [new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId(customId)
            .setPlaceholder(i18n.__({ phrase: selectionPhrase, locale }))
            .addOptions(polls.map((poll) => ({
              label: i18n.__({ phrase: 'configure.poll.list.adminName', locale }, { poll }),
              description: (poll.description.trim().length ? (poll.description.substr(0, 90) + (poll.description.length > 90 ? '...' : '')) : i18n.__({ phrase: 'configure.poll.list.detailsDescriptionEmpty', locale })),
              value: `configure-poll-${poll.id}`,
            }))),
        ),
      ];
    }
    return [];
  },
  getCurrentResults(discordServer, poll, result) {
    return poll.options
      .map((option, idx) => {
        const formattedVotes = discordServer.formatNumber(result.votes[option.id]);
        return `${idx + 1}. ${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text}: **${formattedVotes} votes**`;
      }).join('\n');
  },
  getCurrentOptions(discordServer, poll) {
    return poll.options
      .map((option, idx) => (`${idx + 1}. ${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text}`)).join('\n');
  },
  getPollAnnouncementParts(discordServer, poll, results, forcePublishResults) {
    const locale = discordServer.getBotLanguage();
    const detailFields = [
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsDescription', locale }),
        value: poll.description.trim().length ? poll.description.trim() : i18n.__({ phrase: 'configure.poll.list.detailsDescriptionEmpty', locale }),
      },
    ];

    if (poll.voteaireUUID) {
      detailFields.push({
        name: i18n.__({ phrase: 'configure.poll.list.detailsVoteaireLink', locale }),
        value: this.getVoteaireResultsUrl(poll.voteaireUUID),
      });
    }

    if (forcePublishResults || poll.resultsVisible) {
      detailFields.push({
        name: i18n.__({ phrase: 'vote.currentResults', locale }),
        value: this.getCurrentResults(discordServer, poll, results),
      });
    } else {
      detailFields.push({
        name: i18n.__({ phrase: 'configure.poll.list.detailsChoices', locale }),
        value: this.getCurrentOptions(discordServer, poll),
      });
    }

    detailFields.push({
      name: i18n.__({ phrase: 'configure.poll.list.detailsDates', locale }),
      value: i18n.__({ phrase: 'configure.poll.list.pollInfo', locale }, {
        openAfterTimestamp: Math.floor(new Date(poll.openAfter).getTime() / 1000),
        openUntilTimestamp: Math.floor(new Date(poll.openUntil).getTime() / 1000),
      }),
    });

    const components = [];
    if (!this.hasVotingEnded(poll)) {
      const buttons = [];

      if (!poll.voteaireUUID) {
        buttons.push(new MessageButton()
          .setCustomId(`vote/widgetvote/${poll.id}`)
          .setLabel(i18n.__({ phrase: 'vote.voteButton', locale }))
          .setStyle('PRIMARY'));
      } else {
        buttons.push(new MessageButton()
          .setURL(this.getVoteaireVoteUrl(poll.voteaireUUID))
          .setLabel(i18n.__({ phrase: 'vote.voteButton', locale }))
          .setStyle('LINK'));
      }

      if (poll.snapshotId) {
        buttons.push(new MessageButton()
          .setCustomId('verify/add/widgetverify')
          .setLabel(i18n.__({ phrase: 'verify.add.verifyButton', locale }))
          .setStyle('SECONDARY'));
      }
      components.push(new MessageActionRow().addComponents(buttons));
    }
    return { detailFields, components };
  },
  getPollDetails(locale, poll) {
    if (poll.voteaireUUID) {
      return [
        {
          name: i18n.__({ phrase: 'configure.poll.list.detailsName', locale }),
          value: i18n.__({ phrase: 'configure.poll.list.adminName', locale }, { poll }),
        },
        {
          name: i18n.__({ phrase: 'configure.poll.list.detailsDescription', locale }),
          value: poll.description.trim().length ? poll.description.trim() : i18n.__({ phrase: 'configure.poll.list.detailsDescriptionEmpty', locale }),
        },
        {
          name: i18n.__({ phrase: 'configure.poll.list.detailsVoteaireLink', locale }),
          value: this.getVoteaireResultsUrl(poll.voteaireUUID),
        },
        {
          name: i18n.__({ phrase: 'configure.poll.list.detailsChoices', locale }),
          value: poll.options.map((option, idx) => `**${idx + 1}:** ${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text}`).join('\n'),
        },
        {
          name: i18n.__({ phrase: 'configure.poll.list.detailsCreation', locale }),
          value: i18n.__({ phrase: 'configure.poll.list.creationDate', locale }, { createTime: Math.floor(new Date(poll.createTime).getTime() / 1000) }),
        },
        {
          name: i18n.__({ phrase: 'configure.poll.list.detailsDates', locale }),
          value: i18n.__({ phrase: 'configure.poll.list.pollInfo', locale }, {
            openAfterTimestamp: Math.floor(new Date(poll.openAfter).getTime() / 1000),
            openUntilTimestamp: Math.floor(new Date(poll.openUntil).getTime() / 1000),
          }),
        },
        {
          name: i18n.__({ phrase: 'configure.poll.list.detailsChannel', locale }),
          value: poll.channelId ? i18n.__({ phrase: 'configure.poll.list.announcementChannel', locale }, { poll }) : i18n.__({ phrase: 'configure.poll.list.announcementNone', locale }),
        },
      ];
    }
    const detailFields = [
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsName', locale }),
        value: i18n.__({ phrase: 'configure.poll.list.adminName', locale }, { poll }),
      },
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsDescription', locale }),
        value: poll.description.trim().length ? poll.description.trim() : i18n.__({ phrase: 'configure.poll.list.detailsDescriptionEmpty', locale }),
      },
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsChoices', locale }),
        value: poll.options.map((option, idx) => `**${idx + 1}:** ${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text}`).join('\n'),
      },
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsCreation', locale }),
        value: i18n.__({ phrase: 'configure.poll.list.creationDate', locale }, { createTime: Math.floor(new Date(poll.createTime).getTime() / 1000) }),
      },
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsDates', locale }),
        value: i18n.__({ phrase: 'configure.poll.list.pollInfo', locale }, {
          openAfterTimestamp: Math.floor(new Date(poll.openAfter).getTime() / 1000),
          openUntilTimestamp: Math.floor(new Date(poll.openUntil).getTime() / 1000),
        }),
      },
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsConfiguration', locale }),
        value: i18n.__({ phrase: 'configure.poll.list.optionList', locale }, {
          resultsVisible: poll.resultsVisible ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
          multipleVotes: poll.multipleVotes ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
          tokenBased: poll.snapshotId ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
          weighted: poll.weighted ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
        }),
      },
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsChannel', locale }),
        value: poll.channelId ? i18n.__({ phrase: 'configure.poll.list.announcementChannel', locale }, { poll }) : i18n.__({ phrase: 'configure.poll.list.announcementNone', locale }),
      },
    ];
    if (poll.requiredRoles?.length) {
      detailFields.push({
        name: i18n.__({ phrase: 'configure.poll.list.detailsRoles', locale }),
        value: poll.requiredRoles.map((role) => (i18n.__({ phrase: 'configure.poll.list.requiredRoleEntry', locale }, { role }))).join('\n'),
      });
    }
    return detailFields;
  },
};
