import { ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, SlashCommandBuilder, MessageActionRowComponentBuilder, ButtonStyle, GuildMember } from 'discord.js';
import { BotCommand } from "../utility/commandtypes";
import i18n from 'i18n';
import { DiscordServer, Poll } from '@vibrantnet/core';
import { AugmentedButtonInteraction, AugmentedSelectMenuInteraction } from '../utility/hazelnetclient';
import CommandTranslations from '../utility/commandtranslations';
import embedBuilder from '../utility/embedbuilder';
import commandbase from '../utility/commandbase';
import pollutil from '../utility/poll';
import discordemoji from '../utility/discordemoji';
import discordstring from '../utility/discordstring';
import { EmbedFieldsAndComponents } from '../utility/sharedtypes';

interface VoteCommand extends BotCommand {
  getPollVoteOptions(locale: string, poll: Poll, totalVotingPower: number, hasVoted: boolean): Promise<ActionRowBuilder<MessageActionRowComponentBuilder>[]>
  getPollChoices(locale: string, polls: Poll[]): ActionRowBuilder<MessageActionRowComponentBuilder>[]
  getVotingPowerText(discordServer: DiscordServer, poll: Poll, locale: string, totalVotingPower: number, tokenMetadata: any): string
  getVoteDetails(poll: Poll, interaction: AugmentedSelectMenuInteraction | AugmentedButtonInteraction, discordServer: DiscordServer, member: GuildMember): Promise<EmbedFieldsAndComponents>
}

export default <VoteCommand> {
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
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      if (discordServer.premium) {
        const nonArchivedPolls = (await interaction.client.services.discordserver.getPolls(interaction.guild!.id) as Poll[])
          .filter((poll) => !poll.archived)
          .sort((pollA, pollB) => pollA.displayName.localeCompare(pollB.displayName));

        const member = await interaction.guild!.members.fetch(interaction.user.id);
        const visiblePolls = nonArchivedPolls.filter((poll) => pollutil.userCanSeePoll(member, poll));

        const pollFields = visiblePolls.map((poll) => {
          const description = poll.description.substring(0, 150) + (poll.description.length > 150 ? '...' : '');
          return {
            name: poll.displayName,
            value: i18n.__({ phrase: 'vote.pollInfo', locale }, { description }),
          };
        });
        if (!pollFields.length) {
          pollFields.push({ name: i18n.__({ phrase: 'vote.noPollsTitle', locale }), value: i18n.__({ phrase: 'vote.noPolls', locale }) });
        }
        const CHUNK_SIZE = 20;
        const firstPolls = pollFields.splice(0, CHUNK_SIZE);
        const components = this.getPollChoices(locale, visiblePolls.splice(0, CHUNK_SIZE));
        let embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'vote.messageTitle', locale }), i18n.__({ phrase: 'vote.purpose', locale }), 'vote', firstPolls);
        await interaction.editReply({ embeds: [embed], components });
        while (pollFields.length) {
          const additionalPolls = pollFields.splice(0, CHUNK_SIZE);
          const moreComponents = this.getPollChoices(locale, visiblePolls.splice(0, CHUNK_SIZE));
          embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'vote.messageTitle', locale }), i18n.__({ phrase: 'vote.purposeContinued', locale }), 'vote', additionalPolls);
          // eslint-disable-next-line no-await-in-loop
          await interaction.followUp({ embeds: [embed], components: moreComponents, ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'vote.messageTitle', locale }), i18n.__({ phrase: 'vote.noPremium', locale }), 'vote');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [] });
      await interaction.followUp({ content: 'Error while getting poll list. Please contact your bot admin via https://www.vibrantnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    try {
      await interaction.deferUpdate();
      const member = await interaction.guild!.members.fetch(interaction.user.id);
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const isVote = interaction.customId === 'vote/vote';
      const pollId = (isVote ? +interaction.values[0].split('-')[1] : +interaction.values[0].substring(5));
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild!.id) as Poll[];
      const poll = polls.find((pollForDetails) => pollForDetails.id === pollId && !pollForDetails.archived);
      if (poll) {
        if (interaction.customId === 'vote/details') {
          const { detailFields, components } = await this.getVoteDetails(poll, interaction, discordServer, member);
          const embed = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'vote.pollInfoTitle', locale }), 'vote', detailFields);
          await interaction.editReply({ embeds: [embed], components });
        } else if (isVote) {
          const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
          const votedFor = interaction.values.map((option) => +option.replace(`vote-${poll.id}-option-`, ''));
          const currentVoteData = await interaction.client.services.discordserver.setVoteForUser(interaction.guild!.id, poll.id, externalAccount.id, votedFor);
          let resultsText = i18n.__({ phrase: 'vote.resultsNotVisible', locale });
          const tokenMetadata = await pollutil.getTokenMetadataFromRegistry(interaction.guild!.id, poll, interaction.client);
          const decimals = (poll.weighted && tokenMetadata?.decimals?.value) || 0;
          if (poll.resultsVisible) {
            resultsText = pollutil.getCurrentResults(discordServer, poll, currentVoteData.poll, tokenMetadata);
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
                .map((option) => `${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text} (${discordServer.formatNumber(pollutil.calculateVotingNumber(currentVoteData.user.votes[option.id], decimals))})`).join('\n'),
            },
          ];
          const embed = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'vote.voteSuccess', locale }), 'vote', detailFields);
          await interaction.editReply({ embeds: [embed], components: [] });
        }
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [] });
      await interaction.followUp({ content: 'Error while showing poll details or voting. Please contact your bot admin via https://www.vibrantnet.io.', ephemeral: true });
    }
  },
  async executeButton(interaction) {
    if (interaction.customId.indexOf('vote/abstain') === 0) {
      try {
        await interaction.deferUpdate();
        const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
        const locale = discordServer.getBotLanguage();
        const pollId = +(interaction.customId.split('/')[2]);
        const polls = await interaction.client.services.discordserver.getPolls(interaction.guild!.id) as Poll[];
        const poll = polls.find((pollForDetails) => pollForDetails.id === pollId && !pollForDetails.archived);
        const member = await interaction.guild!.members.fetch(interaction.user.id);
        if (poll && pollutil.userCanSeePoll(member, poll)) {
          const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
          const currentVoteData = await interaction.client.services.discordserver.setVoteForUser(interaction.guild!.id, poll.id, externalAccount.id, []);
          let resultsText = i18n.__({ phrase: 'vote.resultsNotVisible', locale });
          if (poll.resultsVisible) {
            const tokenMetadata = await pollutil.getTokenMetadataFromRegistry(interaction.guild!.id, poll, interaction.client);
            resultsText = pollutil.getCurrentResults(discordServer, poll, currentVoteData.poll, tokenMetadata);
          }
          const detailFields = [{
            name: i18n.__({ phrase: 'vote.currentResults', locale }),
            value: resultsText,
          }];
          const embed = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'vote.abstainVoteSuccess', locale }), 'vote', detailFields);
          await interaction.editReply({ embeds: [embed], components: [] });
        }
      } catch (error) {
        interaction.client.logger.error(error);
        await interaction.editReply({ content: 'Error while abstaining from vote. Please contact your bot admin via https://www.vibrantnet.io.' });
      }
    } else if (interaction.customId.indexOf('vote/widgetvote') === 0) {
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const pollId = +(interaction.customId.split('/')[2]);
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild!.id) as Poll[];
      const poll = polls.find((pollForDetails) => pollForDetails.id === pollId && !pollForDetails.archived);
      if (poll) {
        const member = await interaction.guild!.members.fetch(interaction.user.id);
        if (pollutil.userCanSeePoll(member, poll)) {
          const { detailFields, components } = await this.getVoteDetails(poll, interaction, discordServer, member);
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
      const components = [new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('vote/vote')
            .setPlaceholder(i18n.__({ phrase: hasVoted ? 'vote.changeVoteOption' : 'vote.chooseVoteOption', locale }))
            .setMaxValues(poll.multipleVotes ? Math.min(totalVotingPower, poll.options.length) : 1)
            .addOptions(options),
        ),
      ];
      if (hasVoted) {
        components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>()
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
      return [new ActionRowBuilder<MessageActionRowComponentBuilder>()
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
  getVotingPowerText(discordServer, poll, locale, totalVotingPower, tokenMetadata) {
    if (poll.snapshotId) {
      const decimals = (poll.weighted && tokenMetadata?.decimals?.value) || 0;
      const unit = tokenMetadata?.ticker?.value ? ` ${tokenMetadata.ticker.value}` : '';
      if (totalVotingPower > 0) {
        const formattedVotingPower = discordServer.formatNumber(pollutil.calculateVotingNumber(totalVotingPower, decimals));
        return `${totalVotingPower > 1 ? i18n.__({ phrase: 'vote.votingPowerMultiple', locale }, { totalVotingPower: formattedVotingPower, unit }) : i18n.__({ phrase: 'vote.votingPowerSingleToken', locale })}\n\n${i18n.__({ phrase: 'vote.votingPowerTokenInfo', locale })}`;
      }
      return `${i18n.__({ phrase: 'vote.votingPowerNone', locale })}\n\n${i18n.__({ phrase: 'vote.votingPowerTokenInfo', locale })}`;
    }
    return i18n.__({ phrase: 'vote.votingPowerSingleNoToken', locale });
  },
  async getVoteDetails(poll, interaction, discordServer, member) {
    const locale = discordServer.getBotLanguage();
    const tokenMetadata = await pollutil.getTokenMetadataFromRegistry(interaction.guild!.id, poll, interaction.client);
    let resultsText = i18n.__({ phrase: 'vote.resultsNotVisible', locale });
    if (poll.resultsVisible) {
      const results = await interaction.client.services.discordserver.getPollResults(interaction.guild!.id, poll.id);
      resultsText = pollutil.getCurrentResults(discordServer, poll, results, tokenMetadata);
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
        } as any),
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
        value: poll.requiredRoles.map((role) => (i18n.__({ phrase: 'configure.poll.list.requiredRoleEntry', locale }, { role } as any))).join('\n'),
      });
    }

    if (!poll.voteaireUUID) {
      detailFields.push({
        name: i18n.__({ phrase: 'vote.currentResults', locale }),
        value: resultsText,
      });
    }

    let components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];
    if (!poll.voteaireUUID) {
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const currentVote = await interaction.client.services.discordserver.getVoteOfUser(interaction.guild!.id, poll.id, externalAccount.id);
      const totalVotingPower = currentVote.votes['0'];
      detailFields.push({
        name: i18n.__({ phrase: 'vote.yourVotingPower', locale }),
        value: this.getVotingPowerText(discordServer, poll, locale, totalVotingPower, tokenMetadata),
      });
      // If at least two keys are present, that means in addition to the total voting power at key 0, votes have been cast.
      const hasVoted = Object.keys(currentVote.votes).length > 1;
      if (pollutil.userCanVoteInPoll(member, poll, totalVotingPower)) {
        components = await this.getPollVoteOptions(locale, poll, totalVotingPower, hasVoted);
      }
      if (hasVoted) {
        const decimals = (poll.weighted && tokenMetadata?.decimals?.value) || 0;
        detailFields.push({
          name: i18n.__({ phrase: 'vote.yourVote', locale }),
          value: poll.options
            .filter((option) => currentVote.votes[option.id] > 0)
            .map((option) => {
              const formattedVote = discordServer.formatNumber(pollutil.calculateVotingNumber(currentVote.votes[option.id], decimals));
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
        value: pollutil.getCurrentOptions(poll),
      });
      if (pollutil.userCanVoteInPoll(member, poll, 1)) {
        components.push(new ActionRowBuilder<MessageActionRowComponentBuilder>()
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
