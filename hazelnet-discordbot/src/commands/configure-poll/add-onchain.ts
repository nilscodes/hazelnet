import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';
import pollutil from '../../utility/poll';
import { Poll } from '@vibrantnet/core';

export default <BotSubcommand> {
  async execute(interaction) {
    const voteaireUUID = interaction.options.getString('ballot-id', true);
    const publishChannel = interaction.options.getChannel('publish-channel');

    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();

      const pollName = `VOTEAIRE${voteaireUUID.replace('-', '').substring(0, 20)}`;
      if (pollutil.isValidName(pollName)) {
        const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);

        const pollObject = {
          name: pollName,
          displayName: pollName,
          description: 'N/A',
          creator: +externalAccount.id,
          openAfter: new Date().toISOString(),
          openUntil: new Date().toISOString(),
          channelId: publishChannel?.id,
          voteaireUUID,
        } as Poll;

        const poll = await interaction.client.services.discordserver.createPoll(interaction.guild!.id, pollObject);
        const detailFields = pollutil.getPollDetails(locale, poll);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add-onchain', i18n.__({ phrase: 'configure.poll.add-onchain.success', locale }, { poll } as any), 'configure-poll-add-onchain', detailFields);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll add-onchain', i18n.__({ phrase: 'configure.poll.add.invalidName', locale }, { pollName: voteaireUUID }), 'configure-poll-add-onchain');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding poll to your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
