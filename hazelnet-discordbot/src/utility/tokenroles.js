const i18n = require('i18n');
const cardanotoken = require('./cardanotoken');
const discordstring = require('./discordstring');

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
    let metadataFilters = '';
    let acceptedPolicies = '';
    if (includeAllDetails) {
      metadataFilters = cardanotoken.buildMetadataFilterContentText(tokenRole.filters, tokenRole.aggregationType, locale);

      const policyInfo = tokenRole.acceptedAssets.map((acceptedAsset) => {
        const fingerprintInfo = acceptedAsset.assetFingerprint ? i18n.__({ phrase: 'configure.tokenroles.policies.add.fingerprintInfo', locale }, { assetFingerprint: discordstring.ensureLength(acceptedAsset.assetFingerprint, 15) }) : '';
        const policyId = discordServer.tokenPolicies.find((tokenPolicy) => tokenPolicy.policyId === acceptedAsset.policyId)?.projectName || discordstring.ensureLength(acceptedAsset.policyId, 10);
        return i18n.__({ phrase: 'configure.tokenroles.policies.add.policiesContentEntry', locale }, { policyId, fingerprintInfo });
      });
      if (policyInfo.length > 5) {
        policyInfo.splice(5);
        policyInfo.push(i18n.__({ phrase: 'configure.tokenroles.policies.add.policiesContentAndMore', locale }, { additionalPolicyCount: tokenRole.acceptedAssets.length - 5 }));
      }
      const policyInfoText = policyInfo.join('\n');
      acceptedPolicies = `\n${i18n.__({ phrase: 'configure.tokenroles.policies.add.policiesTitle', locale })}\n${policyInfoText}`;
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
