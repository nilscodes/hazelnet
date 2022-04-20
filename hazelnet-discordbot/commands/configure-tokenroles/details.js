const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const tokenRoleId = interaction.options.getInteger('token-role-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const tokenRoleToShow = discordServer.tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToShow) {
        const officialProject = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === tokenRoleToShow.policyId);
        const policyIdShort = `${tokenRoleToShow.policyId.substr(0, 10)}…`;
        const fingerprintInfo = tokenRoleToShow.assetFingerprint ? i18n.__({ phrase: 'configure.tokenroles.list.fingerprintInfo', locale: useLocale }, { tokenRole: tokenRoleToShow }) : '';
        const maximumInfo = tokenRoleToShow.maximumTokenQuantity ? i18n.__({ phrase: 'configure.tokenroles.list.maximumInfo', locale: useLocale }, { tokenRole: tokenRoleToShow }) : '';
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles details', i18n.__({ phrase: 'configure.tokenroles.details.purpose', locale: useLocale }), 'configure-tokenroles-details', [
          {
            name: i18n.__({ phrase: (officialProject ? 'configure.tokenroles.list.tokenRoleNameOfficial' : 'configure.tokenroles.list.tokenRoleNameInofficial'), locale: useLocale }, { tokenRole: tokenRoleToShow, officialProject, policyIdShort }),
            value: i18n.__({ phrase: 'configure.tokenroles.list.tokenRoleDetails', locale: useLocale }, { tokenRole: tokenRoleToShow, fingerprintInfo, maximumInfo }),
          },
        ]);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles details', i18n.__({ phrase: 'configure.tokenroles.list.errorNotFound', locale: useLocale }, { tokenRoleId }), 'configure-tokenroles-details');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while showing details of auto-role assignment for role with ID ${tokenRoleId} from your server. Please contact your bot admin via https://www.hazelnet.io.`, ephemeral: true });
    }
  },
};
