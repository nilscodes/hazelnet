import NodeCache from 'node-cache';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { ChannelType, GuildChannel, PermissionsBitField, TextBasedChannel } from 'discord.js';
import embedBuilder from '../../utility/embedbuilder';
import pollutil from '../../utility/poll';

interface PollAnnounceCommand extends BotSubcommand {
  cache: NodeCache
}

export default <PollAnnounceCommand> {
  cache: new NodeCache({ stdTTL: 300 }),
  async execute(interaction) {
    const announceChannel = interaction.options.getChannel('channel', true);
    const publishResults = interaction.options.getBoolean('publishresults');
    try {
      await interaction.deferReply({ ephemeral: true });
      const guildId = interaction.guild!.id;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guildId);
      const locale = discordServer.getBotLanguage();
      if (announceChannel.type === ChannelType.GuildText || announceChannel.type === ChannelType.GuildAnnouncement) {
        const announceGuildChannel = announceChannel as GuildChannel;
        const announceChannelPermissions = announceGuildChannel.permissionsFor(interaction.client.application!.id);
        if (announceChannelPermissions && announceChannelPermissions.has(PermissionsBitField.Flags.SendMessages) && announceChannelPermissions.has(PermissionsBitField.Flags.ViewChannel) && announceChannelPermissions.has(PermissionsBitField.Flags.EmbedLinks)) {
          const polls = await interaction.client.services.discordserver.getPolls(guildId);
          const { pollFields, components } = pollutil.getDiscordPollListParts(discordServer, polls, 'configure-poll/announce/publish', 'configure.poll.announce.choosePoll');
          this.cache.set(`${guildId}-${interaction.user.id}`, `${announceChannel.id}-${publishResults ? 1 : 0}`);
          const resultsPublishingInfo = i18n.__({ phrase: (publishResults ? 'configure.poll.announce.resultsPublishYes' : 'configure.poll.announce.resultsPublishMaybe'), locale });
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll announce', i18n.__({ phrase: 'configure.poll.announce.purpose', locale }, { resultsPublishingInfo }), 'configure-poll-announce', pollFields);
          await interaction.editReply({ embeds: [embed], components });
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll announce', i18n.__({ phrase: 'configure.poll.announce.errorNoSendPermissions', locale }, { channel: announceChannel.id }), 'configure-poll-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll announce', i18n.__({ phrase: 'configure.poll.announce.errorWrongChannelType', locale }), 'configure-poll-announce');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting poll list to announce. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-poll/announce/publish') {
      await interaction.deferUpdate();
      const guild = interaction.guild!;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guild.id);
      const locale = discordServer.getBotLanguage();
      const pollId = +interaction.values[0].substring(15);
      const polls = await interaction.client.services.discordserver.getPolls(guild.id);
      const poll = polls.find((pollForDetails) => pollForDetails.id === pollId);
      if (poll) {
        const [announceChannelId, forcePublishResults] = (this.cache.take(`${guild.id}-${interaction.user.id}`) as string).split('-');
        const results = await interaction.client.services.discordserver.getPollResults(guild.id, poll.id!);
        const tokenMetadata = await pollutil.getTokenMetadataFromRegistry(guild.id, poll, interaction.client);
        const { detailFields, components } = pollutil.getPollAnnouncementParts(discordServer, poll, results, forcePublishResults === '1', tokenMetadata);

        try {
          const announceChannel = await guild.channels.fetch(announceChannelId);
          if (announceChannel) {
            const guildAnnounceChannel = announceChannel as TextBasedChannel;
            const embedPublic = embedBuilder.buildForUser(discordServer, poll.displayName, i18n.__({ phrase: 'configure.poll.announce.publicSuccess', locale }), 'vote', detailFields);
            const announcementMessage = await guildAnnounceChannel.send({ embeds: [embedPublic], components });
            await interaction.client.services.discordserver.updatePoll(guild.id, poll.id!, {
              channelId: announceChannel.id,
              messageId: announcementMessage.id,
            });
            const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll announce', i18n.__({ phrase: 'configure.poll.announce.success', locale }, { channel: guildAnnounceChannel.id }), 'configure-poll-announce');
            await interaction.editReply({ embeds: [embedAdmin], components: [] });
          }
        } catch (sendError) {
          interaction.client.logger.info(sendError);
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll announce', i18n.__({ phrase: 'configure.poll.announce.errorNoSendPermissions', locale }, { channel: announceChannelId }), 'configure-poll-announce');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      }
    }
  },
};
