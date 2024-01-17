import i18n from 'i18n';
import { BotSubcommand } from '../../utility/commandtypes';
import tokenroles from '../../utility/tokenroles';
import cardanotoken from '../../utility/cardanotoken';
import embedBuilder from '../../utility/embedbuilder';

export default <BotSubcommand> {
  async execute(interaction) {
    const tokenRoleId = interaction.options.getInteger('token-role-id', true);
    const policyId = interaction.options.getString('policy-id', true);
    const assetFingerprint = interaction.options.getString('asset-fingerprint');
    try {
      await interaction.deferReply({ ephemeral: true });
      const discordServer = await interaction.client.services.discordserver.getDiscordServer(interaction.guild!.id);
      const tokenRoles = await interaction.client.services.discordserver.listTokenOwnershipRoles(interaction.guild!.id);
      const tokenPolicies = await interaction.client.services.discordserver.listTokenPolicies(interaction.guild!.id);
      const locale = discordServer.getBotLanguage();
      const tokenRoleToAddPolicyTo = tokenRoles.find((tokenRole) => tokenRole.id === tokenRoleId);
      if (tokenRoleToAddPolicyTo) {
        const maxPoliciesPerTokenRole = +(discordServer.settings?.MAX_POLICIES_PER_TOKEN_ROLE ?? 50);
        if (!tokenRoleToAddPolicyTo.acceptedAssets || tokenRoleToAddPolicyTo.acceptedAssets.length < maxPoliciesPerTokenRole) {
          if (cardanotoken.isValidPolicyId(policyId)) {
            if (assetFingerprint === null || cardanotoken.isValidAssetFingerprint(assetFingerprint)) {
              if (!tokenRoleToAddPolicyTo.acceptedAssets
                .some((acceptedAsset) => cardanotoken.isSamePolicyAndAsset(acceptedAsset.policyId, acceptedAsset.assetFingerprint, policyId, assetFingerprint))) {
                tokenRoleToAddPolicyTo.acceptedAssets.push({
                  policyId,
                  assetFingerprint,
                });
                await interaction.client.services.discordserver.updateTokenRole(interaction.guild!.id, tokenRoleToAddPolicyTo.id, tokenRoleToAddPolicyTo.acceptedAssets);
                const embed = embedBuilder.buildForAdmin(
                  discordServer,
                  '/configure-tokenroles policies add',
                  i18n.__({ phrase: 'configure.tokenroles.details.purpose', locale }),
                  'configure-tokenroles-policies-add',
                  tokenroles.getTokenRoleDetailsFields(tokenRoleToAddPolicyTo, tokenPolicies, locale, true),
                );
                await interaction.editReply({ embeds: [embed] });
              } else {
                const fingerprintInfo = assetFingerprint ? i18n.__({ phrase: 'configure.tokenroles.policies.add.fingerprintInfo', locale }, { assetFingerprint }) : '';
                const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles policies add', i18n.__({ phrase: 'configure.tokenroles.policies.add.errorAlreadyUsed', locale }, {
                  tokenRole: tokenRoleToAddPolicyTo,
                  policyId,
                  fingerprintInfo,
                } as any), 'configure-tokenroles-policies-add');
                await interaction.editReply({ embeds: [embed] });
              }
            } else {
              const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles policies add', i18n.__({ phrase: 'configure.tokenroles.add.errorAssetFingerprint', locale }), 'configure-tokenroles-policies-add');
              await interaction.editReply({ embeds: [embed] });
            }
          } else {
            const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles policies add', i18n.__({ phrase: 'configure.tokenroles.add.errorPolicyId', locale }), 'configure-tokenroles-policies-add');
            await interaction.editReply({ embeds: [embed] });
          }
        } else {
          const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles policies add', i18n.__({ phrase: 'configure.tokenroles.policies.add.errorLimitReached', locale }, { tokenRoleId } as any), 'configure-tokenroles-policies-add');
          await interaction.editReply({ embeds: [embed] });
        }
      } else {
        const embed = embedBuilder.buildForAdmin(discordServer, '/configure-tokenroles policies add', i18n.__({ phrase: 'configure.tokenroles.list.errorNotFound', locale }, { tokenRoleId } as any), 'configure-tokenroles-policies-add');
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      interaction.client.logger.error(error);
      await interaction.editReply({ content: `Error while adding policy to auto-role assignment for role with ID ${tokenRoleId} on your server. Please contact your bot admin via https://www.vibrantnet.io.` });
    }
  },
};
