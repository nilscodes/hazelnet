const axios = require('axios');

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

module.exports = {
  async addPing(senderExternalAccountId, senderMessage, recipientAddress, discordServerId) {
    const newPingPromise = await axios.post(`${hazelCommunityUrl}/pings`, {
      sender: senderExternalAccountId,
      recipientAddress,
      senderMessage,
      sentFromServer: discordServerId,
    });
    return newPingPromise.data;
  },
  async getPingsForExternalAccount(externalAccountId) {
    const pingsPromise = await axios.get(`${hazelCommunityUrl}/externalaccounts/${externalAccountId}/pings`);
    return pingsPromise.data;
  },
  async updateExternalAccountPing(externalAccountId, pingId, pingPartial) {
    const updatedPingPromise = await axios.patch(`${hazelCommunityUrl}/externalaccounts/${externalAccountId}/pings/${pingId}`, pingPartial);
    return updatedPingPromise.data;
  },
};
