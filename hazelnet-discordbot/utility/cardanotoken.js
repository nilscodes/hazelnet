module.exports = {
  isValidAssetFingerprint(assetFingerprint) {
    const assetFingerprintRegex = /^asset1[A-Za-z0-9]{38}$/i;
    return assetFingerprintRegex.test(assetFingerprint);
  },
  isValidPolicyId(policyId) {
    const policyIdRegex = /^[A-Za-z0-9]{56}$/i;
    return policyIdRegex.test(policyId);
  },
};
