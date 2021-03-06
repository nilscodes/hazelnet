const i18n = require('i18n');

module.exports = {
  getTokenRoleDetailsText(tokenRole, discordServer, locale, includeAllDetails, customTokenRoleMessage) {
    let useTokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetails';
    if (tokenRole.filters?.length) {
      if (tokenRole.aggregationType === 'ANY_POLICY_FILTERED_ONE_EACH') {
        useTokenRoleMessage = 'configure.tokenroles.list.tokenRoleDetailsWithFiltersEachOne';
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
    let title = i18n.__({ phrase: 'configure.tokenroles.list.tokenRoleNameMultiple', locale }, { tokenRole });
    const policyIdCount = [...new Set(tokenRole.acceptedAssets.map((acceptedAsset) => acceptedAsset.policyId))].length;
    if (policyIdCount === 1) {
      const policyIdOfFirstAsset = tokenRole.acceptedAssets[0].policyId;
      const officialProject = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdOfFirstAsset);
      const policyIdShort = `${policyIdOfFirstAsset.substr(0, 10)}…`;
      const titlePhrase = (officialProject ? 'configure.tokenroles.list.tokenRoleNameOfficial' : 'configure.tokenroles.list.tokenRoleNameInofficial');
      title = i18n.__({ phrase: titlePhrase, locale }, { tokenRole, officialProject, policyIdShort });
    }

    const maximumInfo = tokenRole.maximumTokenQuantity ? i18n.__({ phrase: 'configure.tokenroles.list.maximumInfo', locale }, { tokenRole }) : '';
    const metadataFiltersList = tokenRole.filters.map((filter) => {
      const operatorText = i18n.__({ phrase: `configure.tokenroles.metadatafilter.add.metadataOperator-${filter.operator}`, locale });
      return i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.metadataFiltersContent', locale }, { filter, operatorText });
    });
    let metadataFilters = '';
    let acceptedPolicies = '';
    if (includeAllDetails) {
      let joinPhrase;
      switch (tokenRole.aggregationType) {
        case 'ANY_POLICY_FILTERED_AND':
          joinPhrase = 'configure.tokenroles.metadatafilter.add.metadataFilterJoinPhraseAnd';
          break;
        case 'ANY_POLICY_FILTERED_ONE_EACH':
          joinPhrase = 'configure.tokenroles.metadatafilter.add.metadataFilterJoinPhraseOneEach';
          break;
        case 'EVERY_POLICY_FILTERED_OR':
        case 'ANY_POLICY_FILTERED_OR':
        default:
          joinPhrase = 'configure.tokenroles.metadatafilter.add.metadataFilterJoinPhraseOr';
          break;
      }
      const joinPhraseText = i18n.__({ phrase: joinPhrase, locale });
      metadataFilters = metadataFiltersList.length ? `\n${i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.metadataFiltersTitle', locale })}\n${metadataFiltersList.join(joinPhraseText)}` : '';

      const policyInfo = tokenRole.acceptedAssets.map((acceptedAsset) => {
        const fingerprintInfo = acceptedAsset.assetFingerprint ? i18n.__({ phrase: 'configure.tokenroles.policies.add.fingerprintInfo', locale }, { assetFingerprint: acceptedAsset.assetFingerprint }) : '';
        const policyId = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === acceptedAsset.policyId)?.projectName || acceptedAsset.policyId;
        return i18n.__({ phrase: 'configure.tokenroles.policies.add.policiesContentEntry', locale }, { policyId, fingerprintInfo });
      }).join('\n');
      acceptedPolicies = `\n${i18n.__({ phrase: 'configure.tokenroles.policies.add.policiesTitle', locale })}\n${policyInfo}`;
    }
    return {
      name: title,
      value: i18n.__({ phrase: useTokenRoleMessage, locale }, {
        tokenRole,
        maximumInfo,
      }) + acceptedPolicies + metadataFilters,
    };
  },
};
