import i18n from 'i18n';
import cardanotoken from './cardanotoken';
import discordstring from './discordstring';
import { TokenOwnershipAggregationType, TokenOwnershipRole, TokenPolicy, TokenStakingType } from "./sharedtypes";

export default {
  getTokenRoleDetailsFields(tokenRole: TokenOwnershipRole, tokenPolicies: TokenPolicy[], locale: string, includeAllDetails: boolean = false, customTokenRoleMessage: string | false = false) {
    let useTokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetails';
    if (tokenRole.filters?.length) {
      if (tokenRole.aggregationType === 'ANY_POLICY_FILTERED_ONE_EACH') {
        useTokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetailsWithFiltersEachOne';
      } else if (tokenRole.aggregationType === 'ANY_POLICY_FILTERED_ALL_MATCHED') {
        useTokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetailsWithFiltersAllMatched';
      } else {
        useTokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetailsWithFilters';
      }
    } else if (tokenRole.aggregationType === 'EVERY_POLICY_FILTERED_OR') {
      if (tokenRole.filters?.length) {
        useTokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetailsEveryPolicyWithFilters';
      } else {
        useTokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetailsEveryPolicyNoFilters';
      }
    }
    if (customTokenRoleMessage) {
      useTokenRoleMessage = customTokenRoleMessage;
    }
    let stakingInfo = '';
    if (tokenRole.stakingType !== 'NONE') {
      stakingInfo = i18n.__({ phrase: 'configure.tokenroles.list.withStakingProvider', locale }, {
        stakingProviderName: this.getStakingProviderName(tokenRole.stakingType, locale),
      });
    }
    let title = i18n.__({ phrase: 'configure.tokenroles.list.tokenRoleNameMultiple', locale }, { tokenRole } as any);
    const policyIdCount = [...new Set(tokenRole.acceptedAssets.map((acceptedAsset) => acceptedAsset.policyId))].length;
    if (policyIdCount === 1) {
      const policyIdOfFirstAsset = tokenRole.acceptedAssets[0].policyId;
      const officialProject = tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdOfFirstAsset);
      const policyIdShort = `${policyIdOfFirstAsset.substr(0, 10)}…`;
      const titlePhrase = (officialProject ? 'configure.tokenroles.list.tokenRoleNameOfficial' : 'configure.tokenroles.list.tokenRoleNameInofficial');
      title = i18n.__({ phrase: titlePhrase, locale }, { tokenRole, officialProject, policyIdShort } as any);
    }

    const maximumInfo = tokenRole.maximumTokenQuantity ? i18n.__({ phrase: 'configure.tokenroles.list.maximumInfo', locale }, { tokenRole } as any) : '';
    const detailFields = [{
      name: title,
      value: i18n.__({ phrase: `${useTokenRoleMessage}`, locale }, {
        tokenRole,
        maximumInfo,
      } as any) + stakingInfo,
    }];
    if (includeAllDetails) {
      const policyInfo = tokenRole.acceptedAssets.map((acceptedAsset) => {
        const fingerprintInfo = acceptedAsset.assetFingerprint ? i18n.__({ phrase: 'configure.tokenroles.policies.add.fingerprintInfo', locale }, acceptedAsset as any) : '';
        const policyId = tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === acceptedAsset.policyId)?.projectName || discordstring.ensureLength(acceptedAsset.policyId, 10);
        return i18n.__({ phrase: 'configure.tokenroles.policies.add.policiesContentEntry', locale }, { policyId, fingerprintInfo });
      });
      if (policyInfo.length > 5) {
        policyInfo.splice(5);
        policyInfo.push(i18n.__({ phrase: 'configure.tokenroles.policies.add.policiesContentAndMore', locale }, { additionalPolicyCount: tokenRole.acceptedAssets.length - 5 } as any));
      }
      const policyInfoText = policyInfo.join('\n');
      detailFields.push({
        name: i18n.__({ phrase: 'configure.tokenroles.policies.add.policiesTitle', locale }),
        value: policyInfoText,
      });

      const metadataFilterContentList = cardanotoken.getMetadataFilterContentList(tokenRole.filters, tokenRole.aggregationType == TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR, locale);
      if (metadataFilterContentList.length) {
        const chunkSize = 10;
        const joinPhraseText = metadataFilterContentList.length < 25 ? cardanotoken.getJoinPhraseTextForAggregationType(tokenRole.aggregationType, locale) : ' **+** ';
        for (let i = 0; i < metadataFilterContentList.length; i += chunkSize) {
          const chunk = metadataFilterContentList.slice(i, i + chunkSize);
          const metadataSegmentTitle = (i === 0 ? i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.metadataFiltersTitle', locale }) : joinPhraseText);
          detailFields.push({
            name: metadataSegmentTitle,
            value: chunk.join(joinPhraseText),
          });
        }
      }
    }
    return detailFields;
  },
  getStakingProviderName(stakingType: TokenStakingType, locale: string) {
    return i18n.__({ phrase: `stakingProviders.${stakingType}`, locale });
  },
};
