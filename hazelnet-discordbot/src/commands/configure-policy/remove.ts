import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const policyIdToRemove = interaction.options.getString('policy-id', true);
    try {
      // TODO verify policy exists in the first place, send different message if not
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const policyToRemove = tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdToRemove);
      if (policyToRemove) {
        await interaction.client.services.discordserver.deleteTokenPolicy(interaction.guild!.id, policyToRemove.policyId);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-policy remove', i18n.__({ phrase: 'configure.policy.remove.success', locale: locale }), 'configure-policy-remove', [
          { name: policyToRemove.projectName, value: i18n.__({ phrase: 'policyid.projectPolicyId', locale: locale }, { policyId: policyToRemove.policyId }) },
        ]);
        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-policy remove', i18n.__({ phrase: 'configure.policy.remove.errorNotFound', locale: locale }, { policyId: policyIdToRemove }), 'configure-policy-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while removing official token policy from your server. Please contact your bot admin via https://www.hazelnet.io.' });
    }
  },
};
