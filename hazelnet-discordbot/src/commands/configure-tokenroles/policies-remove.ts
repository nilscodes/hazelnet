import i18n from 'i18n';
import { TokenOwnershipRole, TokenPolicy } from '../../utility/sharedtypes';
import { BotSubcommand } from '../../utility/commandtypes';
import { ActionRowBuilder, MessageActionRowComponentBuilder, SelectMenuBuilder } from 'discord.js';
import tokenroles from '../../utility/tokenroles';
import embedBuilder from '../../utility/embedbuilder';
import cardanotoken from '../../utility/cardanotoken';

interface ConfigureTokenrolesPoliciesRemoveCommand extends BotSubcommand {
  createRemoveDropdown(tokenPolicies: TokenPolicy[], locale: string, tokenRole: TokenOwnershipRole): ActionRowBuilder<MessageActionRowComponentBuilder>[]
}

export default <ConfigureTokenrolesPoliciesRemoveCommand> {
  async execute(interaction) {
    const tokenRoleId = interaction.options.getInteger('token-role-id');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenRoles = await interaction.client.services.discordserver.listTokenOwnershipRoles(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const tokenRoleToRemovePolicyFrom = tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToRemovePolicyFrom) {
        const tokenRoleInfo = tokenroles.getTokenRoleDetailsFields(tokenRoleToRemovePolicyFrom, tokenPolicies, locale, true);
        const components = this.createRemoveDropdown(tokenPolicies, locale, tokenRoleToRemovePolicyFrom);
        if (!components.length) {
          tokenRoleInfo.push({
            name: i18n.__({ phrase: 'configure.tokenroles.policies.remove.errorLastPolicyTitle', locale }),
            value: i18n.__({ phrase: 'configure.tokenroles.policies.remove.errorLastPolicy', locale }),
          });
        }
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles policies remove', i18n.__({ phrase: 'configure.tokenroles.policies.remove.purpose', locale }), 'configure-tokenroles-policies-remove', tokenRoleInfo);
        await interaction.editReply({ embeds: [embed], components });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles policies remove', i18n.__({ phrase: 'configure.tokenroles.list.errorNotFound', locale }, { tokenRoleId } as any), 'configure-tokenroles-policies-remove');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while removing policies from auto-role assignment for role with ID ${tokenRoleId} on your server. Please contact your bot admin via https://www.hazelnet.io.` });
    }
  },
  createRemoveDropdown(tokenPolicies, locale, tokenRole) {
    if (tokenRole.acceptedAssets.length > 1) {
      return [new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('configure-tokenroles/policies-remove/remove')
            .setPlaceholder(i18n.__({ phrase: 'configure.tokenroles.policies.remove.chooseRemove', locale }))
            .addOptions(tokenRole.acceptedAssets.map((acceptedAsset) => {
              const fingerprintInfo = acceptedAsset.assetFingerprint ? i18n.__({ phrase: 'configure.tokenroles.policies.add.fingerprintInfoShort', locale }, { assetFingerprint: acceptedAsset.assetFingerprint }) : '';
              const assetFingerprintSuffix = acceptedAsset.assetFingerprint ? `-${acceptedAsset.assetFingerprint}` : '';
              const policyId = tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === acceptedAsset.policyId)?.projectName || `${acceptedAsset.policyId.substring(0, 20)}…`;
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
      await interaction.deferUpdate();
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenRoles = await interaction.client.services.discordserver.listTokenOwnershipRoles(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const dataToRemove = interaction.values[0].split('-');
      const [tokenRoleIdString, policyIdToRemove, assetFingerprintToRemove] = dataToRemove;
      const tokenRoleId = +tokenRoleIdString;
      const tokenRoleToRemovePolicyFrom = tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToRemovePolicyFrom) {
        tokenRoleToRemovePolicyFrom.acceptedAssets = tokenRoleToRemovePolicyFrom.acceptedAssets
          .filter((acceptedAsset) => !cardanotoken.isSamePolicyAndAsset(acceptedAsset.policyId, acceptedAsset.assetFingerprint, policyIdToRemove, assetFingerprintToRemove));
        const updatedTokenRole = await interaction.client.services.discordserver.updateTokenRole(interaction.guild!.id, tokenRoleToRemovePolicyFrom.id, tokenRoleToRemovePolicyFrom.acceptedAssets);
        const tokenRoleFields = tokenroles.getTokenRoleDetailsFields(updatedTokenRole, tokenPolicies, locale, true);
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles policies remove', i18n.__({ phrase: 'configure.tokenroles.policies.remove.success', locale }), 'configure-tokenroles-policies-remove', tokenRoleFields);
        await interaction.followUp({ embeds: [embed], components: [], ephemeral: true });
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles policies remove', i18n.__({ phrase: 'configure.tokenroles.list.errorNotFound', locale }, { tokenRoleId } as any), 'configure-tokenroles-policies-remove');
        await interaction.editReply({ embeds: [embed], components: [] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ components: [] });
      await interaction.followUp({ content: 'Error while removing policies from auto-role assignment on your server. Please contact your bot admin via https://www.hazelnet.io.', ephemeral: true });
    }
  },
};
