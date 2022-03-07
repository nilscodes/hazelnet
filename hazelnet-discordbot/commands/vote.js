const { SlashCommandBuilder } = require('@discordjs/builders');
const i18n = require('i18n');
const {
  MessageActionRow, MessageSelectMenu,
} = require('discord.js');
const CommandTranslations = require('../utility/commandtranslations');
const embedBuilder = require('../utility/embedbuilder');
const pollUtil = require('../utility/poll');
const datetime = require('../utility/datetime');
const discordemoji = require('../utility/discordemoji');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('vote', locale);
    return new SlashCommandBuilder()
      .setName('vote')
      .setDescription(ci18n.description())
      .setDefaultPermission(false);
  },
  commandTags: ['poll'],
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();

      const nonArchivedPolls = (await interaction.client.services.discordserver.getPolls(interaction.guild.id))
        .filter((poll) => !poll.archived)
        .sort((pollA, pollB) => pollA.displayName.localeCompare(pollB.displayName));

      const member = await interaction.guild.members.fetch(interaction.user.id);
      const pollVisiblePromises = nonArchivedPolls.map((poll) => pollUtil.userCanSeePoll(member, poll));
      const pollsAllowed = await Promise.all(pollVisiblePromises);
      const visiblePolls = nonArchivedPolls.filter((_, index) => (pollsAllowed[index]));

      const pollFields = visiblePolls.map((poll) => ({ name: poll.displayName, value: i18n.__({ phrase: 'vote.pollInfo', locale: useLocale }, { poll }) }));
      if (!pollFields.length) {
        pollFields.push({ name: i18n.__({ phrase: 'vote.noPollsTitle', locale: useLocale }), value: i18n.__({ phrase: 'vote.noPolls', locale: useLocale }) });
      }
      const components = this.getPollChoices(useLocale, visiblePolls);
      const embed = embedBuilder.buildForUserWithAd(discordServer, i18n.__({ phrase: 'vote.messageTitle', locale: useLocale }), i18n.__({ phrase: 'vote.purpose', locale: useLocale }), 'vote', pollFields);
      await interaction.editReply({ embeds: [embed], components, ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting official token policy list. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    await interaction.deferUpdate({ ephemeral: true });
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
    const locale = discordServer.getBotLanguage();
    const isVote = interaction.customId === 'vote/vote';
    const pollId = (isVote ? +interaction.values[0].split('-')[1] : +interaction.values[0].substr(5));
    const polls = await interaction.client.services.discordserver.getPolls(interaction.guild.id);
    const poll = polls.find((pollForDetails) => pollForDetails.id === pollId && !pollForDetails.archived);
    if (poll) {
      if (interaction.customId === 'vote/details') {
        let resultsText = i18n.__({ phrase: 'vote.resultsNotVisible', locale });
        if (poll.resultsVisible) {
          const results = await interaction.client.services.discordserver.get(interaction.guild.id);
          resultsText = this.getCurrentResults(poll, results);
        }

        const detailFields = [
          {
            name: i18n.__({ phrase: 'configure.poll.list.detailsDescription', locale }),
            value: poll.description,
          },
          {
            name: i18n.__({ phrase: 'configure.poll.list.detailsDates', locale }),
            value: i18n.__({ phrase: 'configure.poll.list.pollInfo', locale }, {
              openAfterFormatted: datetime.getUTCDateFormatted(poll, 'openAfter'),
              openUntilFormatted: datetime.getUTCDateFormatted(poll, 'openUntil'),
            }),
          },
          {
            name: i18n.__({ phrase: 'configure.poll.list.detailsConfiguration', locale }),
            value: i18n.__({ phrase: 'configure.poll.list.optionList', locale }, {
              multipleVotes: poll.multipleVotes ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
              tokenBased: poll.snapshotId ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
              weighted: poll.weighted ? i18n.__({ phrase: 'generic.yes', locale }) : i18n.__({ phrase: 'generic.no', locale }),
            }),
          },
        ];
        if (poll.requiredRoles?.length) {
          detailFields.push({
            name: i18n.__({ phrase: 'configure.poll.list.detailsRoles', locale }),
            value: poll.requiredRoles.map((role) => (i18n.__({ phrase: 'configure.poll.list.requiredRoleEntry', locale }, { role }))).join('\n'),
          });
        }
        detailFields.push({
          name: i18n.__({ phrase: 'vote.currentResults', locale }),
          value: resultsText,
        });
        const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
        const currentVote = await interaction.client.services.discordserver.getVoteOfUser(interaction.guild.id, poll.id, externalAccount.id);
        const totalVotingPower = currentVote.votes['0'];
        detailFields.push({
          name: i18n.__({ phrase: 'vote.yourVotingPower', locale }),
          value: this.getVotingPowerText(poll, locale, totalVotingPower),
        });
        // If at least two keys are present, that means in addition to the total voting power at key 0, votes have been cast.
        if (Object.keys(currentVote.votes).length > 1) {
          detailFields.push({
            name: i18n.__({ phrase: 'vote.yourVote', locale }),
            value: poll.options
              .filter((option) => currentVote.votes[option.id] > 0)
              .map((option, idx) => `${idx + 1}. ${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text} (${currentVote.votes[option.id]})`).join('\n'),
          });
        }
        const components = await this.getPollVoteOptions(locale, poll, totalVotingPower);
        const embed = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'vote.pollInfoTitle', locale }), 'configure-poll-list', detailFields);
        await interaction.editReply({ embeds: [embed], components, ephemeral: true });
      } else if(isVote) {
        

      }
    }
  },
  getCurrentResults(poll, results) {
    return '';
  },
  async getPollVoteOptions(locale, poll, totalVotingPower) {
    if (totalVotingPower > 0) {
      const options = poll.options.map((option, idx) => ({
        label: `**${idx + 1}:** ${option.text}`,
        value: `vote-${poll.id}-option-${option.id}`,
        emoji: {
          id: option.reactionId,
          name: option.reactionName,
        },
      }));
      return [new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('vote/vote')
            .setPlaceholder(i18n.__({ phrase: 'vote.chooseVoteOption', locale }))
            .setMaxValues(poll.multipleVotes ? poll.options.length : 1)
            .addOptions(options),
        ),
      ];
    }
    return [];
  },
  getPollChoices(locale, polls) {
    if (polls.length) {
      return [new MessageActionRow()
        .addComponents(
          new MessageSelectMenu()
            .setCustomId('vote/details')
            .setPlaceholder(i18n.__({ phrase: 'vote.choosePoll', locale }))
            .addOptions(polls.map((poll) => ({
              label: poll.displayName,
              description: (poll.description ? (poll.description.substr(0, 90) + (poll.description.length > 90 ? '...' : '')) : ''),
              value: `poll-${poll.id}`,
            }))),
        ),
      ];
    }
    return [];
  },
  getVotingPowerText(poll, locale, totalVotingPower) {
    if (poll.snapshotId) {
      if (totalVotingPower > 0) {
        return `${totalVotingPower > 1 ? i18n.__({ phrase: 'vote.votingPowerMultiple', locale }, { totalVotingPower }) : i18n.__({ phrase: 'vote.votingPowerSingleToken', locale })}\n\n${i18n.__({ phrase: 'vote.votingPowerTokenInfo', locale })}`;
      }
      return `${i18n.__({ phrase: 'vote.votingPowerNone', locale })}\n\n${i18n.__({ phrase: 'vote.votingPowerTokenInfo', locale })}`;
    }
    return i18n.__({ phrase: 'vote.votingPowerSingleNoToken', locale });
  },
};
