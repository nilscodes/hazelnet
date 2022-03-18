const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const tokenRoleFields = discordServer.tokenRoles.map((tokenRole) => {
        const officialProject = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === tokenRole.policyId);
        const fingerprintInfo = tokenRole.assetFingerprint ? i18n.__({ phrase: 'configure.tokenroles.list.fingerprintInfo', locale: useLocale }, { tokenRole }) : '';
        const maximumInfo = tokenRole.maximumTokenQuantity ? i18n.__({ phrase: 'configure.tokenroles.list.maximumInfo', locale: useLocale }, { tokenRole }) : '';
        return {
          name: i18n.__({ phrase: (officialProject ? 'configure.tokenroles.list.tokenRoleNameOfficial' : 'configure.tokenroles.list.tokenRoleNameInofficial'), locale: useLocale }, { tokenRole, officialProject }),
          value: i18n.__({ phrase: 'configure.tokenroles.list.tokenRoleDetails', locale: useLocale }, { tokenRole, fingerprintInfo, maximumInfo }),
        };
      });
      if (!tokenRoleFields.length) {
        tokenRoleFields.push({ name: i18n.__({ phrase: 'configure.tokenroles.list.noTokenRolesTitle', locale: useLocale }), value: i18n.__({ phrase: 'configure.tokenroles.list.noTokenRolesDetail', locale: useLocale }) });
      }
      const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles list', i18n.__({ phrase: 'configure.tokenroles.list.purpose', locale: useLocale }), 'configure-tokenroles-list', tokenRoleFields);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: 'Error while getting auto-role-assignment for token owners. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
