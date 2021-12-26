const axios = require('axios');

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

module.exports = {
  async createVerificationRequest(externalAccountId, addressToVerify) {
    const verifications = await axios.post(`${hazelCommunityUrl}/verifications`, {
      blockchain: 'CARDANO',
      address: addressToVerify,
      externalAccountId,
    });
    return verifications.data;
  },
  async getVerification(verificationId) {
    const verification = await axios.get(`${hazelCommunityUrl}/verifications/${verificationId}`);
    return verification.data;
  },
  async removeVerification(verificationId) {
    return axios.delete(`${hazelCommunityUrl}/verifications/${verificationId}`);
  },
};
