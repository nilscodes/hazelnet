const axios = require('axios');

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

module.exports = {
  async scheduleSnapshot(snapshotTime, policyId, assetFingerprint) {
    const newSnapshot = await axios.post(`${hazelCommunityUrl}/snapshots/stake`, {
      snapshotTime,
      policyId,
      assetFingerprint,
    });
    return newSnapshot.data;
  },
};
