import { ActionRowBuilder, MessageActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
import i18n, { Replacements } from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { Poll } from '../../utility/polltypes';
const embedBuilder = require('../../utility/embedbuilder');
const discordemoji = require('../../utility/discordemoji');

interface PollRemoveCommand extends BotSubcommand {
  getPollChoices(locale: string, polls: any[]): ActionRowBuilder<MessageActionRowComponentBuilder>[]
}

export default <PollRemoveCommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const useLocale = discordServer.getBotLanguage();
      const polls = (await interaction.client.services.discordserver.getPolls(interaction.guild!.id))
        .sort((pollA: Poll, pollB: Poll) => pollA.displayName.localeCompare(pollB.displayName));
      if (polls.length) {
        const components = this.getPollChoices(useLocale, polls);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll remove', i18n.__({ phrase: 'configure.poll.remove.purpose', locale: useLocale }), 'configure-poll-remove');
        await interaction.editReply({ embeds: [embed], components });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll remove', i18n.__({ phrase: 'configure.poll.list.noPollsDetail', locale: useLocale }), 'configure-poll-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting poll list. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-poll/remove/complete') {
      await interaction.deferUpdate();
      const guildId = interaction.guild!.id;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guildId);
      const locale = discordServer.getBotLanguage();
      const pollId = +interaction.values[0].substring(15);
      const polls = await interaction.client.services.discordserver.getPolls(guildId) as Poll[];
      const poll = polls.find((pollForDetails: Poll) => pollForDetails.id === pollId);
      if (poll) {
        await interaction.client.services.discordserver.deletePoll(guildId, poll.id);
        const removedFields = [
          {
            name: i18n.__({ phrase: 'configure.poll.list.detailsName', locale }),
            value: i18n.__({ phrase: 'configure.poll.list.adminName', locale }, { poll } as unknown as Replacements),
          },
          {
            name: i18n.__({ phrase: 'configure.poll.list.detailsDescription', locale }),
            value: poll.description.trim().length ? poll.description.trim() : i18n.__({ phrase: 'configure.poll.list.detailsDescriptionEmpty', locale }),
          },
          {
            name: i18n.__({ phrase: 'configure.poll.list.detailsChoices', locale }),
            value: poll.options.map((option, idx) => `**${idx + 1}:** ${discordemoji.makeOptionalEmojiMessageContent(option.reactionId, option.reactionName)} ${option.text}`).join('\n'),
          },
        ];
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll remove', i18n.__({ phrase: 'configure.poll.remove.success', locale }), 'configure-poll-remove', removedFields);
        await interaction.editReply({ embeds: [embed], components: [] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll remove', i18n.__({ phrase: 'configure.poll.remove.errorNotFound', locale }, { pollId: `pollId` }), 'configure-poll-remove');
        await interaction.editReply({ embeds: [embed], components: [] });
      }
    }
  },
  getPollChoices(locale, polls) {
    return [new ActionRowBuilder()
      .addComponents(
        new SelectMenuBuilder()
          .setCustomId('configure-poll/remove/complete')
          .setPlaceholder(i18n.__({ phrase: 'configure.poll.remove.choosePollDetails', locale: locale }))
          .addOptions(polls.map((poll) => ({
            label: i18n.__({ phrase: 'configure.poll.list.adminName', locale: locale }, { poll }),
            description: (poll.description ? (poll.description.substr(0, 90) + (poll.description.length > 90 ? '...' : '')) : ''),
            value: `configure-poll-${poll.id}`,
          }))),
      ),
    ];
  },
};
