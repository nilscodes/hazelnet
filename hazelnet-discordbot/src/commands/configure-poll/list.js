const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
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
        const detailFields = pollutil.getPollDetails(locale, poll);
        const components = pollutil.getPollChoices(locale, polls, 'configure-poll/list/details', 'configure.poll.list.choosePollDetails');
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll list', i18n.__({ phrase: 'configure.poll.list.details', locale }), 'configure-poll-list', detailFields);
        await interaction.editReply({ embeds: [embed], components, ephemeral: true });
      }
    }
  },
};
