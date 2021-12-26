const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const policyId = interaction.options.getString('policy-id');
    const projectName = interaction.options.getString('project-name');
    try {
      await interaction.deferReply({ ephemeral: true });
      const newPolicyPromise = await interaction.client.services.discordserver.addTokenPolicy(interaction.guild.id, policyId, projectName);
      const newPolicyData = newPolicyPromise.data;
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-policy add', i18n.__({ phrase: 'configure.policy.add.success', locale: useLocale }), [
        { name: newPolicyData.projectName, value: i18n.__({ phrase: 'policyid.projectPolicyId', locale: useLocale }, { policyId: newPolicyData.policyId }) },
      ]);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while adding official token policy to your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
