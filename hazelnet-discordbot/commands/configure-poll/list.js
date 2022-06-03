const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const datetime = require('../../utility/datetime');
const discordemoji = require('../../utility/discordemoji');
const pollutil = require('../../utility/poll');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild.id);
      const { pollFields, components } = pollutil.getDiscordPollListParts(discordServer, polls, 'configure-poll/list/details', 'configure.poll.list.choosePollDetails');
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll list', i18n.__({ phrase: 'configure.poll.list.purpose', locale }), 'configure-poll-list', pollFields);
      await interaction.editReply({ embeds: [embed], components, ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting poll list. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-poll/list/details') {
      await interaction.deferUpdate({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const pollId = +interaction.values[0].substr(15);
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild.id);
      const poll = polls.find((pollForDetails) => pollForDetails.id === pollId);
      if (poll) {
        const detailFields = [
          {
            name: i18n.__({ phrase: 'configure.poll.list.detailsName', locale }),
            value: i18n.__({ phrase: 'configure.poll.list.adminName', locale }, { poll }),
          },
          {
            name: i18n.__({ phrase: 'configure.poll.list.detailsDescription', locale }),
            value: poll.description,
          },
          {
            name: i18n.__({ phrase: 'configure.poll.list.detailsChoices', locale }),
            value: poll.options.map((option, idx) => `**${idx + 1}:** ${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text}`).join('\n'),
          },
          {
            name: i18n.__({ phrase: 'configure.poll.list.detailsCreation', locale }),
            value: i18n.__({ phrase: 'configure.poll.list.creationDate', locale }, { createTime: datetime.getUTCDateFormatted(poll, 'createTime') }),
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
        const components = pollutil.getPollChoices(locale, polls, 'configure-poll/list/details', 'configure.poll.list.choosePollDetails');
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll list', i18n.__({ phrase: 'configure.poll.list.details', locale }), 'configure-poll-list', detailFields);
        await interaction.editReply({ embeds: [embed], components, ephemeral: true });
      }
    }
  },
};
