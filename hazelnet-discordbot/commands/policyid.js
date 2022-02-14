const { SlashCommandBuilder } = require('@discordjs/builders');
const i18n = require('i18n');
const embedBuilder = require('../utility/embedbuilder');

module.exports = {
  getCommandData(locale) {
    return new SlashCommandBuilder()
      .setName('policyid')
      .setDescription(i18n.__({ phrase: 'commands.descriptions.policyid', locale }))
      .setDefaultPermission(false);
  },
  commandTags: ['token'],
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const tokenPolicies = discordServer.tokenPolicies.map((tokenPolicy) => ({ name: tokenPolicy.projectName, value: i18n.__({ phrase: 'policyid.projectPolicyId', locale: useLocale }, { policyId: tokenPolicy.policyId }) }));
      if (!tokenPolicies.length) {
        tokenPolicies.push({ name: i18n.__({ phrase: 'policyid.noProjectName', locale: useLocale }), value: i18n.__({ phrase: 'policyid.noPolicies', locale: useLocale }) });
      }
      const embed = embedBuilder.buildForUser(discordServer, i18n.__({ phrase: 'policyid.messageTitle', locale: useLocale }), i18n.__({ phrase: 'policyid.purpose', locale: useLocale }), 'policyid', tokenPolicies);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting official token policy list. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
