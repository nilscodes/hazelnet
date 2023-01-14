import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const tokenPoliciesFields = tokenPolicies
        .sort((policyA, policyB) => policyA.projectName.localeCompare(policyB.projectName))
        .map((tokenPolicy) => ({ name: tokenPolicy.projectName, value: i18n.__({ phrase: 'policyid.projectPolicyId', locale }, { policyId: tokenPolicy.policyId }) }));
      if (!tokenPoliciesFields.length) {
        tokenPoliciesFields.push({ name: i18n.__({ phrase: 'policyid.noProjectName', locale }), value: i18n.__({ phrase: 'policyid.noPolicies', locale }) });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-policy list', i18n.__({ phrase: 'configure.policy.list.purpose', locale }), 'configure-policy-list', tokenPoliciesFields);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting official token policy list. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
