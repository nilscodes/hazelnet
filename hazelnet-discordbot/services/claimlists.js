const axios = require('axios');

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

module.exports = {
  async getAvailableClaimLists(guildId, externalAccountId) {
    const claimListPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/claimlists`);
    return claimListPromise.data;
  },
  async getExistingOrderForClaimList(guildId, externalAccountId, claimListId) {
    try {
      const claimListPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/claimlists/${claimListId}/orders`);
      return claimListPromise.data;
    } catch (error) {
      return null;
    }
  },
  async submitPhysicalOrder(guildId, externalAccountId, claimListId, order) {
    const claimListPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/claimlists/${claimListId}/orders`, order);
    return claimListPromise.data;
  },
};
