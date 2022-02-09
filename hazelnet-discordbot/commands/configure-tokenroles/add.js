const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const minimumTokenQuantity = interaction.options.getString('count');
    const policyId = interaction.options.getString('policy-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      if (parseInt(minimumTokenQuantity, 10) > 0) {
        const newTokenRolePromise = await interaction.client.services.discordserver.createTokenRole(interaction.guild.id, policyId, minimumTokenQuantity, role.id);
        const newTokenRole = newTokenRolePromise.data;

        const officialProject = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === newTokenRole.policyId);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.success', locale: useLocale }), [
          {
            name: i18n.__({ phrase: (officialProject ? 'configure.tokenroles.list.tokenRoleNameOfficial' : 'configure.tokenroles.list.tokenRoleNameInofficial'), locale: useLocale }, { tokenRole: newTokenRole, officialProject }),
            value: i18n.__({ phrase: 'configure.tokenroles.list.tokenRoleDetails', locale: useLocale }, { tokenRole: newTokenRole }),
          },
        ]);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles add', i18n.__({ phrase: 'configure.tokenroles.add.errorMinimumTokens', locale: useLocale }));
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding automatic token-role assignment to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
