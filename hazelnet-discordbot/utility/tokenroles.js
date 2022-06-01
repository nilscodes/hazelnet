const i18n = require('i18n');

module.exports = {
  getTokenRoleDetailsText(tokenRole, discordServer, locale, includeAllDetails, customTokenRoleMessage) {
    let useTokenRoleMessage = tokenRole.filters?.length ? 'configure.tokenroles.list.tokenRoleDetailsWithFilters' : 'configure.tokenroles.list.tokenRoleDetails';
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
      const joinPhrase = i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.metadataFilterJoinPhrase', locale });
      metadataFilters = metadataFiltersList.length ? `\n${i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.metadataFiltersTitle', locale })}\n${metadataFiltersList.join(joinPhrase)}` : '';

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
