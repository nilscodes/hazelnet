import NodeCache from 'node-cache';
import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';
import pollutil from '../../utility/poll';

interface PollUpdateAddRoleCommand extends BotSubcommand {
  cache: NodeCache
}

export default <PollUpdateAddRoleCommand> {
  cache: new NodeCache({ stdTTL: 300 }),
  async execute(interaction) {
    const requiredRole = interaction.options.getRole('required-role', true);
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild!.id);
      const CHUNK_SIZE = 20;
      const firstPolls = polls.splice(0, CHUNK_SIZE);
      const { components } = pollutil.getDiscordPollListParts(discordServer, firstPolls, 'configure-poll/update-addrole/complete', 'configure.poll.update.addrole.choosePoll');
      this.cache.set(`${interaction.guild!.id}-${interaction.user.id}`, `${requiredRole.id}`);
      let embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll update addrole', i18n.__({ phrase: 'configure.poll.update.addrole.purpose', locale }, { roleId: requiredRole.id }), 'configure-poll-update-addrole');
      await interaction.editReply({ embeds: [embed], components });
      while (polls.length) {
        const additionalPolls = polls.splice(0, CHUNK_SIZE);
        const { components: moreComponents } = pollutil.getDiscordPollListParts(discordServer, additionalPolls, 'configure-poll/update-addrole/complete', 'configure.poll.update.addrole.choosePoll');
        embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll update addrole', i18n.__({ phrase: 'configure.poll.update.addrole.purposeContinued', locale }, { roleId: requiredRole.id }), 'configure-poll-update-addrole');
        // eslint-disable-next-line no-await-in-loop
        await interaction.followUp({ embeds: [embed], components: moreComponents, ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting poll list to add role to. Please contact your bot admin via https://www.vibrantnet.io.' });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-poll/update-addrole/complete') {
      await interaction.deferUpdate();
      const guildId = interaction.guild!.id;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(guildId);
      const locale = discordServer.getBotLanguage();
      const pollId = +interaction.values[0].substring('configure-poll-'.length);
      const polls = await interaction.client.services.discordserver.getPolls(guildId);
      const poll = polls.find((pollForDetails) => pollForDetails.id === pollId);
      if (poll) {
        if (poll.requiredRoles && poll.requiredRoles.length < 20) {
          const roleToAdd = this.cache.take(`${guildId}-${interaction.user.id}`) as string;
          const roleAlreadyExists = poll.requiredRoles.find((role) => role.roleId === roleToAdd);
          if (!roleAlreadyExists) {
            const requiredRoles = poll.requiredRoles.concat([{ roleId: roleToAdd }]);
            await interaction.client.services.discordserver.updatePoll(guildId, poll.id!, { requiredRoles });
            const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll update addrole', i18n.__({ phrase: 'configure.poll.update.addrole.success', locale }, { roleId: roleToAdd, poll } as any), 'configure-poll-update-addrole');
            await interaction.editReply({ embeds: [embedAdmin], components: [] });
          } else {
            const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll update addrole', i18n.__({ phrase: 'configure.poll.update.addrole.roleExists', locale }, { roleId: roleToAdd, poll } as any), 'configure-poll-update-addrole');
            await interaction.editReply({ embeds: [embedAdmin], components: [] });
          }
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll update addrole', i18n.__({ phrase: 'configure.poll.update.addrole.tooManyRoles', locale }), 'configure-poll-update-addrole');
          await interaction.editReply({ embeds: [embedAdmin], components: [] });
        }
      }
    }
  },
};
