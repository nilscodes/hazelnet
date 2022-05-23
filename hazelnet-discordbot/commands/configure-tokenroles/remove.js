const i18n = require('i18n');
const embedBuilder = require('../../utility/embedbuilder');

module.exports = {
  async execute(interaction) {
    const tokenRoleIdToRemove = interaction.options.getInteger('token-role-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const useLocale = discordServer.getBotLanguage();
      const tokenRoleToRemove = discordServer.tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleIdToRemove);
      if (tokenRoleToRemove) {
        await interaction.client.services.discordserver.deleteTokenRole(interaction.guild.id, tokenRoleToRemove.id);
        const { policyId: policyIdOfFirstAsset, assetFingerprint: assetFingerprintOfFirstAsset } = tokenRoleToRemove.acceptedAssets[0];
        const officialProject = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdOfFirstAsset);
        const policyIdShort = `${policyIdOfFirstAsset.substr(0, 10)}…`;
        const fingerprintInfo = assetFingerprintOfFirstAsset ? i18n.__({ phrase: 'configure.tokenroles.list.fingerprintInfo', locale: useLocale }, { assetFingerprint: assetFingerprintOfFirstAsset }) : '';
        const maximumInfo = tokenRoleToRemove.maximumTokenQuantity ? i18n.__({ phrase: 'configure.tokenroles.list.maximumInfo', locale: useLocale }, { tokenRole: tokenRoleToRemove }) : '';
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles remove', i18n.__({ phrase: 'configure.tokenroles.remove.success', locale: useLocale }), 'configure-tokenroles-remove', [
          {
            name: i18n.__({ phrase: (officialProject ? 'configure.tokenroles.list.tokenRoleNameOfficial' : 'configure.tokenroles.list.tokenRoleNameInofficial'), locale: useLocale }, { tokenRole: tokenRoleToRemove, officialProject, policyIdShort }),
            value: i18n.__({ phrase: 'configure.tokenroles.list.tokenRoleDetails', locale: useLocale }, {
              tokenRole: tokenRoleToRemove,
              policyId: policyIdOfFirstAsset,
              fingerprintInfo,
              maximumInfo,
            }),
          },
        ]);
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles remove', i18n.__({ phrase: 'configure.tokenroles.remove.errorNotFound', locale: useLocale }, { tokenRoleId: tokenRoleIdToRemove }), 'configure-tokenroles-remove');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while removing auto-role assignment for role with ID ${tokenRoleIdToRemove} from your server. Please contact your bot admin via https://www.hazelnet.io.`, ephemeral: true });
    }
  },
};
