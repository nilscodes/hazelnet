import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
const embedBuilder = require('../../utility/embedbuilder');

export default <BotSubcommand> {
  async execute(interaction) {
    const policyId = interaction.options.getString('policy-id');
    const projectName = interaction.options.getString('project-name');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const useLocale = discordServer.getBotLanguage();
      const existingTokenPolicy = discordServer.tokenPolicies.find((tokenPolicy: any) => tokenPolicy.policyId === policyId);
      if (!existingTokenPolicy) {
        const newPolicyPromise = await interaction.client.services.discordserver.addTokenPolicy(interaction.guild!.id, policyId, projectName);
        const newPolicyData = newPolicyPromise.data;
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-policy add', i18n.__({ phrase: 'configure.policy.add.success', locale: useLocale }), 'configure-policy-add', [
          { name: newPolicyData.projectName, value: i18n.__({ phrase: 'policyid.projectPolicyId', locale: useLocale }, { policyId: newPolicyData.policyId }) },
        ]);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-policy add', i18n.__({ phrase: 'configure.policy.add.errorAlreadyUsed', locale: useLocale }, existingTokenPolicy), 'configure-policy-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding official token policy to your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
