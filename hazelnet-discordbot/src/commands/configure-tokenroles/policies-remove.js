const i18n = require('i18n');
const {
  ActionRowBuilder, SelectMenuBuilder,
} = require('discord.js');
const embedBuilder = require('../../utility/embedbuilder');
const tokenroles = require('../../utility/tokenroles');
const cardanotoken = require('../../utility/cardanotoken');

module.exports = {
  async execute(interaction) {
    const tokenRoleId = interaction.options.getInteger('token-role-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const tokenRoleToRemovePolicyFrom = discordServer.tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToRemovePolicyFrom) {
        const tokenRoleInfo = tokenroles.getTokenRoleDetailsFields(tokenRoleToRemovePolicyFrom, discordServer, locale, true);
        const components = this.createRemoveDropdown(discordServer, tokenRoleToRemovePolicyFrom);
        if (!components.length) {
          tokenRoleInfo.push({
            name: i18n.__({ phrase: 'configure.tokenroles.policies.remove.errorLastPolicyTitle', locale }),
            value: i18n.__({ phrase: 'configure.tokenroles.policies.remove.errorLastPolicy', locale }),
          });
        }
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles policies remove', i18n.__({ phrase: 'configure.tokenroles.policies.remove.purpose', locale }), 'configure-tokenroles-policies-remove', tokenRoleInfo);
        await interaction.editReply({ embeds: [embed], components, ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles policies remove', i18n.__({ phrase: 'configure.tokenroles.list.errorNotFound', locale }, { tokenRoleId }), 'configure-tokenroles-policies-remove');
        await interaction.editReply({ embeds: [embed], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while removing policies from auto-role assignment for role with ID ${tokenRoleId} on your server. Please contact your bot admin via https://www.hazelnet.io.`, ephemeral: true });
    }
  },
  createRemoveDropdown(discordServer, tokenRole) {
    if (tokenRole.acceptedAssets.length > 1) {
      const locale = discordServer.getBotLanguage();
      return [new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('configure-tokenroles/policies-remove/remove')
            .setPlaceholder(i18n.__({ phrase: 'configure.tokenroles.policies.remove.chooseRemove', locale }))
            .addOptions(tokenRole.acceptedAssets.map((acceptedAsset) => {
              const fingerprintInfo = acceptedAsset.assetFingerprint ? i18n.__({ phrase: 'configure.tokenroles.policies.add.fingerprintInfoShort', locale }, { assetFingerprint: acceptedAsset.assetFingerprint }) : '';
              const assetFingerprintSuffix = acceptedAsset.assetFingerprint ? `-${acceptedAsset.assetFingerprint}` : '';
              const policyId = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === acceptedAsset.policyId)?.projectName || `${acceptedAsset.policyId.substr(0, 20)}…`;
              return {
                label: i18n.__({ phrase: 'configure.tokenroles.policies.add.policiesContent', locale }, { policyId, fingerprintInfo }).substring(0, 100),
                value: `${tokenRole.id}-${acceptedAsset.policyId}${assetFingerprintSuffix}`.substring(0, 100),
              };
            })),
        ),
      ];
    }
    return [];
  },
  async executeSelectMenu(interaction) {
    try {
      await interaction.deferUpdate({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild.id);
      const locale = discordServer.getBotLanguage();
      const dataToRemove = interaction.values[0].split('-');
      const [tokenRoleIdString, policyIdToRemove, assetFingerprintToRemove] = dataToRemove;
      const tokenRoleId = +tokenRoleIdString;
      const tokenRoleToRemovePolicyFrom = discordServer.tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToRemovePolicyFrom) {
        tokenRoleToRemovePolicyFrom.acceptedAssets = tokenRoleToRemovePolicyFrom.acceptedAssets
          .filter((acceptedAsset) => !cardanotoken.isSamePolicyAndAsset(acceptedAsset.policyId, acceptedAsset.assetFingerprint, policyIdToRemove, assetFingerprintToRemove));
        const updatedTokenRole = await interaction.client.services.discordserver.updateTokenRole(interaction.guild.id, tokenRoleToRemovePolicyFrom.id, tokenRoleToRemovePolicyFrom.acceptedAssets);
        const tokenRoleFields = tokenroles.getTokenRoleDetailsFields(updatedTokenRole, discordServer, locale, true);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles policies remove', i18n.__({ phrase: 'configure.tokenroles.policies.remove.success', locale }), 'configure-tokenroles-policies-remove', tokenRoleFields);
        await interaction.followUp({ embeds: [embed], components: [], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles policies remove', i18n.__({ phrase: 'configure.tokenroles.list.errorNotFound', locale }, { tokenRoleId }), 'configure-tokenroles-policies-remove');
        await interaction.editReply({ embeds: [embed], components: [], ephemeral: true });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [], ephemeral: true });
      await interaction.followUp({ content: 'Error while removing policies from auto-role assignment on your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
