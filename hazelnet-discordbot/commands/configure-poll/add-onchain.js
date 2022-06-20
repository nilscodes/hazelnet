const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const pollutil = require('../../utility/poll');

module.exports = {
  async execute(interaction) {
    const voteaireUUID = interaction.options.getString('ballot-id');
    const publishChannel = interaction.options.getChannel('publish-channel');

    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();

      const pollName = `VOTEAIRE${voteaireUUID.replace('-', '').substring(0, 20)}`;
      if (pollutil.isValidName(pollName)) {
        const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);

        const pollObject = {
          name: pollName,
          displayName: pollName,
          description: 'N/A',
          creator: externalAccount.id,
          openAfter: new Date().toISOString(),
          openUntil: new Date().toISOString(),
          channelId: publishChannel?.id,
          voteaireUUID,
        };

        const poll = await interaction.client.services.discordserver.createPoll(interaction.guild.id, pollObject);
        const detailFields = pollutil.getPollDetails(locale, poll);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add-onchain', i18n.__({ phrase: 'configure.poll.add-onchain.success', locale }, { poll }), 'configure-poll-add-onchain', detailFields);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add-onchain', i18n.__({ phrase: 'configure.poll.add.invalidName', locale }, { pollName: voteaireUUID }), 'configure-poll-add-onchain');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding poll to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
