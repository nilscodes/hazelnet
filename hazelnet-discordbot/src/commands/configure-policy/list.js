const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const tokenPolicies = discordServer.tokenPolicies
        .sort((policyA, policyB) => policyA.projectName.localeCompare(policyB.projectName))
        .map((tokenPolicy) => ({ name: tokenPolicy.projectName, value: i18n.__({ phrase: 'policyid.projectPolicyId', locale: useLocale }, { policyId: tokenPolicy.policyId }) }));
      if (!tokenPolicies.length) {
        tokenPolicies.push({ name: i18n.__({ phrase: 'policyid.noProjectName', locale: useLocale }), value: i18n.__({ phrase: 'policyid.noPolicies', locale: useLocale }) });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-policy list', i18n.__({ phrase: 'configure.policy.list.purpose', locale: useLocale }), 'configure-policy-list', tokenPolicies);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting official token policy list. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
