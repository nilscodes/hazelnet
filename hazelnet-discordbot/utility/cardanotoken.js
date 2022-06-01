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
};
