const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const policyIdToRemove = interaction.options.getString('policy-id');
    try {
      // TODO verify policy exists in the first place, send different message if not
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const policyToRemove = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdToRemove);
      if (policyToRemove) {
        await interaction.client.services.discordserver.deleteTokenPolicy(interaction.guild.id, policyToRemove.policyId);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-policy remove', i18n.__({ phrase: 'configure.policy.remove.success', locale: useLocale }), 'configure-policy-remove', [
          { name: policyToRemove.projectName, value: i18n.__({ phrase: 'policyid.projectPolicyId', locale: useLocale }, { policyId: policyToRemove.policyId }) },
        ]);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-policy remove', i18n.__({ phrase: 'configure.policy.remove.errorNotFound', locale: useLocale }, { policyId: policyIdToRemove }), 'configure-policy-remove');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while removing official token policy from your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
