const NodeCache = require('node-cache');
const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const pollutil = require('../../utility/poll');

module.exports = {
  cache: new NodeCache({ stdTTL: 300 }),
  async execute(interaction) {
    const announceChannel = interaction.options.getChannel('channel');
    const publishResults = interaction.options.getBoolean('publishresults');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      if (announceChannel.type === 'GUILD_TEXT' || announceChannel.type === 'GUILD_NEWS') {
        const announceChannelPermissions = announceChannel.permissionsFor(interaction.client.application.id);
        if (announceChannelPermissions.has('SEND_MESSAGES') && announceChannelPermissions.has('VIEW_CHANNEL') && announceChannelPermissions.has('EMBED_LINKS')) {
          const polls = await interaction.client.services.discordserver.getPolls(interaction.guild.id);
          const { pollFields, components } = pollutil.getDiscordPollListParts(discordServer, polls, 'configure-poll/announce/publish', 'configure.poll.announce.choosePoll');
          this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, `${announceChannel.id}-${publishResults ? 1 : 0}`);
          const resultsPublishingInfo = i18n.__({ phrase: (publishResults ? 'configure.poll.announce.resultsPublishYes' : 'configure.poll.announce.resultsPublishMaybe'), locale });
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll announce', i18n.__({ phrase: 'configure.poll.announce.purpose', locale }, { resultsPublishingInfo }), 'configure-poll-announce', pollFields);
          await interaction.editReply({ embeds: [embed], components, ephemeral: true });
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll announce', i18n.__({ phrase: 'configure.poll.announce.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-poll-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll announce', i18n.__({ phrase: 'configure.poll.announce.errorWrongChannelType', locale }), 'configure-poll-announce');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
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
        const [announceChannelId, forcePublishResults] = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`).split('-');
        const results = await interaction.client.services.discordserver.getPollResults(interaction.guild.id, poll.id);
        const { detailFields, components } = pollutil.getPollAnnouncementParts(discordServer, poll, results, +forcePublishResults);

        try {
          const announceChannel = await interaction.guild.channels.fetch(announceChannelId);
          const embedPublic = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'configure.poll.announce.publicSuccess', locale }), 'vote', detailFields);
          const announcementMessage = await announceChannel.send({ embeds: [embedPublic], components });
          await interaction.client.services.discordserver.updatePoll(interaction.guild.id, poll.id, {
            channelId: announceChannel.id,
            messageId: announcementMessage.id,
          });
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
