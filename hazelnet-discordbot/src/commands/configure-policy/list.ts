import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
const embedBuilder = require('../../utility/embedbuilder');

export default <BotSubcommand> {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const tokenPolicies = discordServer.tokenPolicies
        .sort((policyA: any, policyB: any) => policyA.projectName.localeCompare(policyB.projectName))
        .map((tokenPolicy: any) => ({ name: tokenPolicy.projectName, value: i18n.__({ phrase: 'policyid.projectPolicyId', locale }, { policyId: tokenPolicy.policyId }) }));
      if (!tokenPolicies.length) {
        tokenPolicies.push({ name: i18n.__({ phrase: 'policyid.noProjectName', locale }), value: i18n.__({ phrase: 'policyid.noPolicies', locale }) });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-policy list', i18n.__({ phrase: 'configure.policy.list.purpose', locale }), 'configure-policy-list', tokenPolicies);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting official token policy list. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
