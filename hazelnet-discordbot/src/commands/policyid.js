const { SlashCommandBuilder } = require('discord.js');
const i18n = require('i18n');
const CommandTranslations = require('../utility/commandtranslations');
const embedBuilder = require('../utility/embedbuilder');
const commandbase = require('../utility/commandbase');

module.exports = {
  getCommandData(locale) {
    const ci18n = new CommandTranslations('policyid', locale);
    return new SlashCommandBuilder()
      .setName('policyid')
      .setDescription(ci18n.description());
  },
  augmentPermissions: commandbase.augmentPermissionsUser,
  commandTags: ['token'],
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const externalAccount = await interaction.client.services.externalaccounts.createOrUpdateExternalDiscordAccount(interaction.user.id, interaction.user.tag);
      const tokenPolicies = discordServer.tokenPolicies
        .sort((policyA, policyB) => policyA.projectName.localeCompare(policyB.projectName))
        .map((tokenPolicy) => ({ name: tokenPolicy.projectName, value: i18n.__({ phrase: 'policyid.projectPolicyId', locale }, { policyId: tokenPolicy.policyId }) }));
      if (!tokenPolicies.length) {
        tokenPolicies.push({ name: i18n.__({ phrase: 'policyid.noProjectName', locale }), value: i18n.__({ phrase: 'policyid.noPolicies', locale }) });
      }
      const embed = embedBuilder.buildForUserWithAd(externalAccount, discordServer, i18n.__({ phrase: 'policyid.messageTitle', locale }), i18n.__({ phrase: 'policyid.purpose', locale }), 'policyid', tokenPolicies);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting official token policy list. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
