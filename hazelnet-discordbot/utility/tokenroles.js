const i18n = require('i18n');

module.exports = {
  getTokenRoleDetailsText(tokenRole, discordServer, locale, includeFilters, customTokenRoleMessage) {
    let useTokenRoleMessage = tokenRole.filters?.length ? 'configure.tokenroles.list.tokenRoleDetailsWithFilters' : 'configure.tokenroles.list.tokenRoleDetails';
    if (customTokenRoleMessage) {
      useTokenRoleMessage = customTokenRoleMessage;
    }
    const { policyId: policyIdOfFirstAsset, assetFingerprint: assetFingerprintOfFirstAsset } = tokenRole.acceptedAssets[0];
    const officialProject = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === policyIdOfFirstAsset);
    const policyIdShort = `${policyIdOfFirstAsset.substr(0, 10)}…`;
    const fingerprintInfo = assetFingerprintOfFirstAsset ? i18n.__({ phrase: 'configure.tokenroles.list.fingerprintInfo', locale }, { assetFingerprint: assetFingerprintOfFirstAsset }) : '';
    const maximumInfo = tokenRole.maximumTokenQuantity ? i18n.__({ phrase: 'configure.tokenroles.list.maximumInfo', locale }, { tokenRole }) : '';
    const metadataFiltersList = tokenRole.filters.map((filter) => {
      const operatorText = i18n.__({ phrase: `configure.tokenroles.metadatafilter.add.metadataOperator-${filter.operator}`, locale });
      return i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.metadataFiltersContent', locale }, { filter, operatorText });
    });
    const joinPhrase = i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.metadataFilterJoinPhrase', locale });
    let metadataFilters = '';
    if (includeFilters) {
      metadataFilters = metadataFiltersList.length ? `\n${i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.metadataFiltersTitle', locale })}\n${metadataFiltersList.join(joinPhrase)}` : '';
    }
    return {
      name: i18n.__({ phrase: (officialProject ? 'configure.tokenroles.list.tokenRoleNameOfficial' : 'configure.tokenroles.list.tokenRoleNameInofficial'), locale }, { tokenRole, officialProject, policyIdShort }),
      value: i18n.__({ phrase: useTokenRoleMessage, locale }, {
        tokenRole,
        policyId: policyIdOfFirstAsset,
        fingerprintInfo,
        maximumInfo,
      }) + metadataFilters,
    };
  },
};
