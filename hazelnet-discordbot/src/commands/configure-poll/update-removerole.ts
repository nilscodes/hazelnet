import NodeCache from 'node-cache';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import { Poll } from '../../utility/polltypes';
import { ActionRowBuilder, MessageActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
const embedBuilder = require('../../utility/embedbuilder');
const pollutil = require('../../utility/poll');

interface PollUpdateRemoveRoleCommand extends BotSubcommand {
  cache: NodeCache
}

export default <PollUpdateRemoveRoleCommand> {
  cache: new NodeCache({ stdTTL: 300 }),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild!.id);
      const { components } = pollutil.getDiscordPollListParts(discordServer, polls, 'configure-poll/update-removerole/chooserole', 'configure.poll.update.removerole.choosePoll');
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll update removerole', i18n.__({ phrase: 'configure.poll.update.removerole.purpose', locale }), 'configure-poll-update-removerole');
      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting poll list to remove role from. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    await interaction.deferUpdate();
    const guild = interaction.guild!;
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(guild.id);
    const locale = discordServer.getBotLanguage();
    if (interaction.customId === 'configure-poll/update-removerole/chooserole') {
      const pollId = +interaction.values[0].substring(15);
      const polls = await interaction.client.services.discordserver.getPolls(guild.id) as Poll[];
      const poll = polls.find((pollForDetails) => pollForDetails.id === pollId);
      if (poll) {
        if (poll.requiredRoles.length) {
          const roles = [];
          for (let i = 0; i < poll.requiredRoles.length; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            const role = await guild.roles.fetch(poll.requiredRoles[i].roleId);
            if (role) {
              roles.push(role);
            }
          }
          const components = [new ActionRowBuilder()
            .addComponents(
              new SelectMenuBuilder()
                .setCustomId('configure-poll/update-removerole/complete')
                .setPlaceholder(i18n.__({ phrase: '', locale }))
                .addOptions(roles.map((role) => ({
                  label: role.name,
                  value: `${poll.id}-${role.id}`,
                }))),
            ),
          ] as ActionRowBuilder<MessageActionRowComponentBuilder>[];
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll update removerole', i18n.__({ phrase: 'configure.poll.update.removerole.chooseRolePurpose', locale }, poll as any), 'configure-poll-update-removerole');
          await interaction.editReply({ embeds: [embedAdmin], components });
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll update removerole', i18n.__({ phrase: 'configure.poll.update.removerole.noRoles', locale }), 'configure-poll-update-removerole');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      }
    } else if (interaction.customId === 'configure-poll/update-removerole/complete') {
      const [pollId, roleToRemove] = interaction.values[0].split('-');
      const polls = await interaction.client.services.discordserver.getPolls(guild.id) as Poll[];
      const poll = polls.find((pollForDetails) => pollForDetails.id === +pollId);
      if (poll) {
        const requiredRoles = poll.requiredRoles.filter((role) => role.roleId !== roleToRemove);
        if (requiredRoles.length !== poll.requiredRoles.length) {
          await interaction.client.services.discordserver.updatePoll(guild.id, poll.id, { requiredRoles });
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll update removerole', i18n.__({ phrase: 'configure.poll.update.removerole.success', locale }, { roleId: roleToRemove, poll } as any), 'configure-poll-update-addrole');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      }
    }
  },
};
