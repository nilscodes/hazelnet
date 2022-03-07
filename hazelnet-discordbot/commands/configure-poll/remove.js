const i18n = require('i18n');
const {
  MessageActionRow, MessageSelectMenu,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const discordemoji = require('../../utility/discordemoji');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const polls = (await interaction.client.services.discordserver.getPolls(interaction.guild.id))
        .sort((pollA, pollB) => pollA.displayName.localeCompare(pollB.displayName));
      if (polls.length) {
        const components = this.getPollChoices(useLocale, polls);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll remove', i18n.__({ phrase: 'configure.poll.remove.purpose', locale: useLocale }), 'configure-poll-remove');
        await interaction.editReply({ embeds: [embed], components, ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll remove', i18n.__({ phrase: 'configure.poll.list.noPollsDetail', locale: useLocale }), 'configure-poll-remove');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting poll list. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-poll/remove/complete') {
      await interaction.deferUpdate({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const pollId = +interaction.values[0].substr(15);
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild.id);
      const poll = polls.find((pollForDetails) => pollForDetails.id === pollId);
      if (poll) {
        await interaction.client.services.discordserver.deletePoll(interaction.guild.id, poll.id);
        const removedFields = [
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
        ];
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll remove', i18n.__({ phrase: 'configure.poll.remove.success', locale }), 'configure-poll-remove', removedFields);
        await interaction.editReply({ embeds: [embed], components: [], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll remove', i18n.__({ phrase: 'configure.poll.remove.errorNotFound', locale }, { pollId }), 'configure-poll-remove');
        await interaction.editReply({ embeds: [embed], components: [], ephemeral: true });
      }
    }
  },
  getPollChoices(useLocale, polls) {
    return [new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId('configure-poll/remove/complete')
          .setPlaceholder(i18n.__({ phrase: 'configure.poll.remove.choosePollDetails', locale: useLocale }))
          .addOptions(polls.map((poll) => ({
            label: i18n.__({ phrase: 'configure.poll.list.adminName', locale: useLocale }, { poll }),
            description: (poll.description ? (poll.description.substr(0, 90) + (poll.description.length > 90 ? '...' : '')) : ''),
            value: `configure-poll-${poll.id}`,
          }))),
      ),
    ];
  },
};
