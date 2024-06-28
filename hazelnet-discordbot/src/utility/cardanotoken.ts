import i18n from 'i18n';
import discordstring from './discordstring';
import { DiscordMintCounterUpdate, MetadataFilter, PolicyInfo, TokenOwnershipAggregationType } from '@vibrantnet/core';

export default {
  isValidAssetFingerprint(assetFingerprint: string) {
    const assetFingerprintRegex = /^asset1[A-Za-z0-9]{38}$/i;
    return assetFingerprintRegex.test(assetFingerprint);
  },
  isValidPolicyId(policyId: string) {
    const policyIdRegex = /^[A-Za-z0-9]{56}$/i;
    return policyIdRegex.test(policyId);
  },
  isSamePolicyAndAsset(policyIdA: string, assetFingerprintA: string | null, policyIdB: string, assetFingerprintB: string | null) {
    if (policyIdA !== policyIdB) {
      return false; // No need to filter out if the policy ID does not match
    }
    if (!assetFingerprintA && !assetFingerprintB) {
      return true; // If the policy ID matches and no asset fingerprint is provided, we have a match
    }
    return assetFingerprintB && assetFingerprintA?.indexOf(assetFingerprintB) === 0;
  },
  toHex(assetName: string) {
    return assetName.split('').map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  },
  buildMetadataFilterContentText(filters: MetadataFilter[], aggregationType: TokenOwnershipAggregationType, locale: string) {
    const metadataFiltersList = this.getMetadataFilterContentList(filters, aggregationType == TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR, locale);
    const joinPhraseText = this.getJoinPhraseTextForAggregationType(aggregationType, locale);
    return metadataFiltersList.length ? `\n${i18n.__({ phrase: 'configure.tokenroles.metadatafilter.add.metadataFiltersTitle', locale })}\n${metadataFiltersList.join(joinPhraseText)}` : '';
  },
  getMetadataFilterContentList(filters: MetadataFilter[], tokenWeightIsRelevant: boolean, locale: string) {
    const tokenWeightString = tokenWeightIsRelevant && filters.filter((filter) => filter.tokenWeight !== 1).length ? 'TokenWeight' : '';
    return filters.map((filter) => {
      const operatorText = i18n.__({ phrase: `configure.tokenroles.metadatafilter.add.metadataOperator-${filter.operator}`, locale });
      return i18n.__({ phrase: `configure.tokenroles.metadatafilter.add.metadataFiltersContent${tokenWeightString}`, locale }, { filter, operatorText, attributeValue: discordstring.escapeBackslashes(filter.attributeValue), tokenWeight: `${filter.tokenWeight}` } as any);
    });
  },
  getJoinPhraseTextForAggregationType(aggregationType: TokenOwnershipAggregationType, locale: string) {
    let joinPhrase;
    switch (aggregationType) {
      case TokenOwnershipAggregationType.ANY_POLICY_FILTERED_AND:
        joinPhrase = 'configure.tokenroles.metadatafilter.add.metadataFilterJoinPhraseAnd';
        break;
      case TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ONE_EACH:
        joinPhrase = 'configure.tokenroles.metadatafilter.add.metadataFilterJoinPhraseOneEach';
        break;
      case TokenOwnershipAggregationType.ANY_POLICY_FILTERED_ALL_MATCHED:
        joinPhrase = 'configure.tokenroles.metadatafilter.add.metadataFilterJoinPhraseAllMatch';
        break;
      case TokenOwnershipAggregationType.ANY_POLICY_FILTERED_OR:
      case TokenOwnershipAggregationType.EVERY_POLICY_FILTERED_OR:
      default:
        joinPhrase = 'configure.tokenroles.metadatafilter.add.metadataFilterJoinPhraseOr';
        break;
    }
    return i18n.__({ phrase: joinPhrase, locale });
  },
  getMintCountText(policyInfo: DiscordMintCounterUpdate | PolicyInfo, maxCount: number, locale: string, cip68 = false) {
    const phrase = maxCount > 0 ? 'configure.policy.mintcounter.mintCountWithMax' : 'configure.policy.mintcounter.mintCount';
    const finalCount = cip68 ? policyInfo.tokenCount / 2 : policyInfo.tokenCount;
    return i18n.__({ phrase, locale }, { count: finalCount, maxCount } as any);
  },
};
