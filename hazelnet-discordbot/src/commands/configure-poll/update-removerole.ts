import NodeCache from 'node-cache';
import i18n from 'i18n';
import { ActionRowBuilder, MessageActionRowComponentBuilder, StringSelectMenuBuilder } from 'discord.js';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';
import pollutil from '../../utility/poll';

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
      const CHUNK_SIZE = 20;
      const firstPolls = polls.splice(0, CHUNK_SIZE);
      const { components } = pollutil.getDiscordPollListParts(discordServer, firstPolls, 'configure-poll/update-removerole/chooserole', 'configure.poll.update.removerole.choosePoll');
      let embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll update removerole', i18n.__({ phrase: 'configure.poll.update.removerole.purpose', locale }), 'configure-poll-update-removerole');
      await interaction.editReply({ embeds: [embed], components });
      while (polls.length) {
        const additionalPolls = polls.splice(0, CHUNK_SIZE);
        const { components: moreComponents } = pollutil.getDiscordPollListParts(discordServer, additionalPolls, 'configure-poll/update-removerole/chooserole', 'configure.poll.update.removerole.choosePoll');
        embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll update removerole', i18n.__({ phrase: 'configure.poll.update.removerole.purposeContinued', locale }), 'configure-poll-update-removerole');
        // eslint-disable-next-line no-await-in-loop
        await interaction.followUp({ embeds: [embed], components: moreComponents, ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting poll list to remove role from. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    await interaction.deferUpdate();
    const guild = interaction.guild!;
    const discordServer = await interaction.client.services.discordserver.getDiscordServer(guild.id);
    const locale = discordServer.getBotLanguage();
    if (interaction.customId === 'configure-poll/update-removerole/chooserole') {
      const pollId = +interaction.values[0].substring('configure-poll-'.length);
      const polls = await interaction.client.services.discordserver.getPolls(guild.id);
      const poll = polls.find((pollForDetails) => pollForDetails.id === pollId);
      if (poll) {
        if (poll.requiredRoles && poll.requiredRoles.length) {
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
              new StringSelectMenuBuilder()
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
      const polls = await interaction.client.services.discordserver.getPolls(guild.id);
      const poll = polls.find((pollForDetails) => pollForDetails.id === +pollId);
      if (poll && poll.requiredRoles) {
        const requiredRoles = poll.requiredRoles.filter((role) => role.roleId !== roleToRemove);
        if (requiredRoles.length !== poll.requiredRoles.length) {
          await interaction.client.services.discordserver.updatePoll(guild.id, poll.id!, { requiredRoles });
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll update removerole', i18n.__({ phrase: 'configure.poll.update.removerole.success', locale }, { roleId: roleToRemove, poll } as any), 'configure-poll-update-addrole');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      }
    }
  },
};
