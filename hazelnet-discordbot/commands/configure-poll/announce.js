const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const datetime = require('../../utility/datetime');
const pollutil = require('../../utility/poll');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild.id);
      const { pollFields, components } = pollutil.getDiscordPollListParts(discordServer, polls, 'configure-poll/announce/publish', 'configure.poll.announce.choosePoll');
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll announce', i18n.__({ phrase: 'configure.poll.announce.purpose', locale }), 'configure-poll-announce', pollFields);
      await interaction.editReply({ embeds: [embed], components, ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting poll list to announce. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-poll/announce/publish') {
      await interaction.deferUpdate({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const pollId = +interaction.values[0].substr(15);
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild.id);
      const poll = polls.find((pollForDetails) => pollForDetails.id === pollId);
      if (poll) {
        const results = await interaction.client.services.discordserver.getPollResults(interaction.guild.id, poll.id);
        const resultsText = pollutil.getCurrentResults(discordServer, poll, results);
        const detailFields = [
          {
            name: i18n.__({ phrase: 'configure.poll.list.detailsDescription', locale }),
            value: poll.description,
          },
          {
            name: i18n.__({ phrase: 'vote.currentResults', locale }),
            value: resultsText,
          },
          {
            name: i18n.__({ phrase: 'configure.poll.list.detailsDates', locale }),
            value: i18n.__({ phrase: 'configure.poll.list.pollInfo', locale }, {
              openAfterFormatted: datetime.getUTCDateFormatted(poll, 'openAfter'),
              openUntilFormatted: datetime.getUTCDateFormatted(poll, 'openUntil'),
            }),
          },
        ];
        try {
          const embedPublic = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'configure.poll.announce.publicSuccess', locale }), 'vote', detailFields);
          await interaction.channel.send({ embeds: [embedPublic] });
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll announce', i18n.__({ phrase: 'configure.poll.announce.success', locale }, { currentChannel: interaction.channel.id }), 'configure-poll-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
        } catch (sendError) {
          interaction.client.logger.info(sendError);
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll announce', i18n.__({ phrase: 'configure.poll.announce.errorNoSendPermissions', locale }, { currentChannel: interaction.channel.id }), 'configure-poll-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
        }
      }
    }
  },
};
