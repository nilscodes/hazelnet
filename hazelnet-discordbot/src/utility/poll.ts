import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMember, MessageActionRowComponentBuilder, StringSelectMenuBuilder,
} from 'discord.js';
import {
  DiscordServer, Poll, TokenMetadata, VoteData,
} from '@vibrantnet/core';
import i18n from 'i18n';
import discordemoji from './discordemoji';
import HazelnetClient from './hazelnetclient';

export default {
  isValidName(pollName: string) {
    const pollNameRegex = /^[A-Za-z][-A-Za-z0-9]{0,29}$/;
    return pollNameRegex.test(pollName);
  },
  hasVotingEnded(poll: Poll) {
    if (poll.openUntil) {
      return new Date(poll.openUntil) < new Date();
    }
    return false;
  },
  hasVotingStarted(poll: Poll) {
    if (poll.openAfter) {
      return new Date(poll.openAfter) < new Date();
    }
    return true;
  },
  isPollArchived(poll: Poll) {
    return !!poll.archived;
  },
  userCanSeePoll(member: GuildMember, poll: Poll) {
    if (!this.isPollArchived(poll)) {
      if (poll.requiredRoles?.length) {
        const needsAnyOfRoleIds = poll.requiredRoles.map((role) => role.roleId);
        return needsAnyOfRoleIds.length === 0 || member.roles.cache.some((role) => needsAnyOfRoleIds.includes(role.id));
      }
      return true;
    }
    return false;
  },
  userCanVoteInPoll(member: GuildMember, poll: Poll, votingWeight: number) {
    if (!this.isPollArchived(poll) && !this.hasVotingEnded(poll) && this.hasVotingStarted(poll) && votingWeight > 0) {
      const needsAnyOfRoleIds = poll.requiredRoles.map((role) => role.roleId);
      return needsAnyOfRoleIds.length === 0 || member.roles.cache.some((role) => needsAnyOfRoleIds.includes(role.id));
    }
    return false;
  },
  getVoteaireResultsUrl(voteaireUUID: string) {
    return `https://voteaire.io/results/${voteaireUUID}`;
  },
  getVoteaireVoteUrl(voteaireUUID: string) {
    return `https://voteaire.io/vote/${voteaireUUID}`;
  },
  getDiscordPollListParts(discordServer: DiscordServer, polls: Poll[], customId: string, selectionPhrase: string) {
    const locale = discordServer.getBotLanguage();
    const sortedPolls = polls.sort((pollA, pollB) => pollA.displayName.localeCompare(pollB.displayName));
    const pollFields = sortedPolls.map((poll) => {
      const pollPhrase = poll.voteaireUUID ? 'configure.poll.list.pollInfoVoteaire' : 'configure.poll.list.pollInfo';
      return {
        name: i18n.__({ phrase: 'configure.poll.list.adminName', locale }, { poll } as any),
        value: i18n.__({ phrase: pollPhrase, locale }, {
          openAfterTimestamp: Math.floor(new Date(poll.openAfter).getTime() / 1000),
          openUntilTimestamp: Math.floor(new Date(poll.openUntil).getTime() / 1000),
          resultsVisible: i18n.__({ phrase: (poll.resultsVisible ? 'configure.poll.add.publicVoteYes' : 'configure.poll.add.publicVoteNo'), locale }),
          voteaireUUID: poll.voteaireUUID,
          voteaireLink: this.getVoteaireResultsUrl(poll.voteaireUUID!),
        } as any),
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
  getPollChoices(locale: string, polls: Poll[], customId: string, selectionPhrase: string) {
    if (polls.length) {
      return [new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(i18n.__({ phrase: selectionPhrase, locale }))
            .addOptions(polls.map((poll) => ({
              label: i18n.__({ phrase: 'configure.poll.list.adminName', locale }, { poll } as any),
              description: (poll.description.trim().length ? (poll.description.substring(0, 90) + (poll.description.length > 90 ? '...' : '')) : i18n.__({ phrase: 'configure.poll.list.detailsDescriptionEmpty', locale })),
              value: `configure-poll-${poll.id}`,
            }))),
        ),
      ];
    }
    return [];
  },
  getCurrentResults(discordServer: DiscordServer, poll: Poll, result: VoteData, tokenMetadata: TokenMetadata | null) {
    const decimals = (poll.weighted && tokenMetadata?.decimals?.value) || 0;
    let totalVotes = 0;
    const resultList = poll.options
      .map((option, idx) => {
        const votes = this.calculateVotingNumber(result.votes[option.id], decimals);
        totalVotes += votes;
        const formattedVotes = discordServer.formatNumber(votes);
        return `${idx + 1}. ${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text}: **${formattedVotes} votes**`;
      });
    const formattedVoteCount = discordServer.formatNumber(totalVotes);
    resultList.push(i18n.__({ phrase: 'vote.currentResultsTotalVotes', locale: discordServer.getBotLanguage() }, { formattedVoteCount }));
    if (poll.weighted || poll.voteaireUUID) {
      const formattedVoterCount = discordServer.formatNumber(result.voterCount);
      resultList.push(i18n.__({ phrase: 'vote.currentResultsTotalVoters', locale: discordServer.getBotLanguage() }, { formattedVoterCount }));
    }
    return resultList.join('\n');
  },
  getCurrentOptions(poll: Poll) {
    return poll.options
      .map((option, idx) => (`${idx + 1}. ${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text}`)).join('\n');
  },
  getPollAnnouncementParts(discordServer: DiscordServer, poll: Poll, results: VoteData, forcePublishResults: boolean, tokenMetadata: TokenMetadata | null) {
    const locale = discordServer.getBotLanguage();
    const trimmedDescription = poll.description.trim().length
      ? poll.description.trim().substring(0, 1000)
      : i18n.__({ phrase: 'configure.poll.list.detailsDescriptionEmpty', locale });
    const detailFields = [
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsDescription', locale }),
        value: trimmedDescription,
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
        value: this.getCurrentResults(discordServer, poll, results, tokenMetadata),
      });
    } else {
      detailFields.push({
        name: i18n.__({ phrase: 'configure.poll.list.detailsChoices', locale }),
        value: this.getCurrentOptions(poll),
      });
    }

    detailFields.push({
      name: i18n.__({ phrase: 'configure.poll.list.detailsDates', locale }),
      value: i18n.__({ phrase: 'configure.poll.list.pollInfo', locale }, {
        openAfterTimestamp: Math.floor(new Date(poll.openAfter).getTime() / 1000),
        openUntilTimestamp: Math.floor(new Date(poll.openUntil).getTime() / 1000),
      } as any),
    });

    const components = [];
    if (!this.hasVotingEnded(poll)) {
      const buttons = [];

      if (!poll.voteaireUUID) {
        buttons.push(new ButtonBuilder()
          .setCustomId(`vote/widgetvote/${poll.id}`)
          .setLabel(i18n.__({ phrase: 'vote.voteButton', locale }))
          .setStyle(ButtonStyle.Primary));
      } else {
        buttons.push(new ButtonBuilder()
          .setURL(this.getVoteaireVoteUrl(poll.voteaireUUID))
          .setLabel(i18n.__({ phrase: 'vote.voteButton', locale }))
          .setStyle(ButtonStyle.Link));
      }

      if (poll.snapshotId) {
        buttons.push(new ButtonBuilder()
          .setCustomId('verify/add/widgetverify')
          .setLabel(i18n.__({ phrase: 'verify.add.verifyButton', locale }))
          .setStyle(ButtonStyle.Secondary));
      }
      components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(buttons));
    }
    return { detailFields, components };
  },
  getPollDetails(locale: string, poll: Poll) {
    if (poll.voteaireUUID) {
      return [
        {
          name: i18n.__({ phrase: 'configure.poll.list.detailsName', locale }),
          value: i18n.__({ phrase: 'configure.poll.list.adminName', locale }, { poll } as any),
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
          value: i18n.__({ phrase: 'configure.poll.list.creationDate', locale }, { createTime: Math.floor(new Date(poll.createTime).getTime() / 1000) } as any),
        },
        {
          name: i18n.__({ phrase: 'configure.poll.list.detailsDates', locale }),
          value: i18n.__({ phrase: 'configure.poll.list.pollInfo', locale }, {
            openAfterTimestamp: Math.floor(new Date(poll.openAfter).getTime() / 1000),
            openUntilTimestamp: Math.floor(new Date(poll.openUntil).getTime() / 1000),
          } as any),
        },
        {
          name: i18n.__({ phrase: 'configure.poll.list.detailsChannel', locale }),
          value: poll.channelId ? i18n.__({ phrase: 'configure.poll.list.announcementChannel', locale }, { poll } as any) : i18n.__({ phrase: 'configure.poll.list.announcementNone', locale }),
        },
      ];
    }
    const trimmedDescription = poll.description.trim().length
      ? poll.description.trim().substring(0, 1000)
      : i18n.__({ phrase: 'configure.poll.list.detailsDescriptionEmpty', locale });
    const detailFields = [
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsName', locale }),
        value: i18n.__({ phrase: 'configure.poll.list.adminName', locale }, { poll } as any),
      },
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsDescription', locale }),
        value: trimmedDescription,
      },
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsChoices', locale }),
        value: poll.options.map((option, idx) => `**${idx + 1}:** ${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text}`).join('\n'),
      },
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsCreation', locale }),
        value: i18n.__({ phrase: 'configure.poll.list.creationDate', locale }, { createTime: Math.floor(new Date(poll.createTime).getTime() / 1000) } as any),
      },
      {
        name: i18n.__({ phrase: 'configure.poll.list.detailsDates', locale }),
        value: i18n.__({ phrase: 'configure.poll.list.pollInfo', locale }, {
          openAfterTimestamp: Math.floor(new Date(poll.openAfter).getTime() / 1000),
          openUntilTimestamp: Math.floor(new Date(poll.openUntil).getTime() / 1000),
        } as any),
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
        value: poll.channelId ? i18n.__({ phrase: 'configure.poll.list.announcementChannel', locale }, { poll } as any) : i18n.__({ phrase: 'configure.poll.list.announcementNone', locale }),
      },
    ];
    if (poll.requiredRoles?.length) {
      detailFields.push({
        name: i18n.__({ phrase: 'configure.poll.list.detailsRoles', locale }),
        value: poll.requiredRoles.map((role) => (i18n.__({ phrase: 'configure.poll.list.requiredRoleEntry', locale }, { role } as any))).join('\n'),
      });
    }
    return detailFields;
  },
  async getTokenMetadataFromRegistry(guildId: string, poll: Poll, client: HazelnetClient) {
    if (poll.snapshotId) {
      return client.services.discordserver.getPollTokenMetadata(guildId, poll.id);
    }
    return null;
  },
  calculateVotingNumber(votingPower: number, decimals: number) {
    return Math.floor(votingPower / (10 ** decimals));
  },
};
