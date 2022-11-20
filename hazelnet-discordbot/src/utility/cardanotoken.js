const i18n = require('i18n');
const discordstring = require('./discordstring');

module.exports = {
  isValidAssetFingerprint(assetFingerprint) {
    const assetFingerprintRegex = /^asset1[A-Za-z0-9]{38}$/i;
    return assetFingerprintRegex.test(assetFingerprint);
  },
  isValidPolicyId(policyId) {
    const policyIdRegex = /^[A-Za-z0-9]{56}$/i;
    return policyIdRegex.test(policyId);
  },
  isSamePolicyAndAsset(policyIdA, assetFingerprintA, policyIdB, assetFingerprintB) {
    if (policyIdA !== policyIdB) {
      return false; // No need to filter out if the policy ID does not match
    }
    if (!assetFingerprintA && !assetFingerprintB) {
      return true; // If the policy ID matches and no asset fingerprint is provided, we have a match
    }
    return assetFingerprintA?.indexOf(assetFingerprintB) === 0;
  },
  toHex(assetName) {
    return assetName.split('').map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  },
  buildMetadataFilterContentText(filters, aggregationType, locale) {
    const metadataFiltersList = this.getMetadataFilterContentList(filters, locale);
    const joinPhraseText = this.getJoinPhraseTextForAggregationType(aggregationType, locale);
    return metadataFiltersList.length ? `\n${i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.metadataFiltersTitle', locale })}\n${metadataFiltersList.join(joinPhraseText)}` : '';
  },
  getMetadataFilterContentList(filters, locale) {
    return filters.map((filter) => {
      const operatorText = i18n.__({ phrase: `configure.tokenroles.metadatafilter.add.metadataOperator-${filter.operator}`, locale });
      return i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.metadataFiltersContent', locale }, { filter, operatorText, attributeValue: discordstring.escapeBackslashes(filter.attributeValue) });
    });
  },
  getJoinPhraseTextForAggregationType(aggregationType, locale) {
    let joinPhrase;
    switch (aggregationType) {
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
    return i18n.__({ phrase: joinPhrase, locale });
  },
  getMintCountText(policyInfo, maxCount, locale) {
    const phrase = maxCount > 0 ? 'configure.policy.mintcounter.mintCountWithMax' : 'configure.policy.mintcounter.mintCount';
    return i18n.__({ phrase, locale }, { count: policyInfo.tokenCount, maxCount });
  },
};
