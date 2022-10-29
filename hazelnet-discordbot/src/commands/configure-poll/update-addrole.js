const NodeCache = require('node-cache');
const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');
const pollutil = require('../../utility/poll');

module.exports = {
  cache: new NodeCache({ stdTTL: 300 }),
  async execute(interaction) {
    const requiredRole = interaction.options.getRole('required-role');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild.id);
      const { components } = pollutil.getDiscordPollListParts(discordServer, polls, 'configure-poll/update-addrole/complete', 'configure.poll.update.addrole.choosePoll');
      this.cache.set(`${interaction.guild.id}-${interaction.user.id}`, `${requiredRole.id}`);
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-poll update addrole', i18n.__({ phrase: 'configure.poll.update.addrole.purpose', locale }, { roleId: requiredRole.id }), 'configure-poll-update-addrole');
      await interaction.editReply({ embeds: [embed], components, ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting poll list to add role to. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
  async executeSelectMenu(interaction) {
    if (interaction.customId === 'configure-poll/update-addrole/complete') {
      await interaction.deferUpdate({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const pollId = +interaction.values[0].substr(15);
      const polls = await interaction.client.services.discordserver.getPolls(interaction.guild.id);
      const poll = polls.find((pollForDetails) => pollForDetails.id === pollId);
      if (poll) {
        if (poll.requiredRoles.length < 20) {
          const roleToAdd = this.cache.take(`${interaction.guild.id}-${interaction.user.id}`);
          const roleAlreadyExists = poll.requiredRoles.find((role) => role.roleId === roleToAdd);
          if (!roleAlreadyExists) {
            const requiredRoles = poll.requiredRoles.concat([{ roleId: roleToAdd }]);
            await interaction.client.services.discordserver.updatePoll(interaction.guild.id, poll.id, { requiredRoles });
            const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll update addrole', i18n.__({ phrase: 'configure.poll.update.addrole.success', locale }, { roleId: roleToAdd, poll }), 'configure-poll-update-addrole');
            await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
          } else {
            const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll update addrole', i18n.__({ phrase: 'configure.poll.update.addrole.roleExists', locale }, { roleId: roleToAdd, poll }), 'configure-poll-update-addrole');
            await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
          }
        } else {
          const embedAdmin = embedBuilder.buildForAdmin(discordServer, '/configure-poll update addrole', i18n.__({ phrase: 'configure.poll.update.addrole.tooManyRoles', locale }), 'configure-poll-update-addrole');
          await interaction.editReply({ embeds: [embedAdmin], components: [], ephemeral: true });
        }
      }
    }
  },
};
