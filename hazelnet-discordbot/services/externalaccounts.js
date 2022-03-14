const NodeCache = require('node-cache');
const axios = require('axios');

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

module.exports = {
  cache: new NodeCache({ stdTTL: 600 }),
  async createOrUpdateExternalDiscordAccount(discordUserId, discordUserTag) {
    const cachedExternalDiscordAccount = this.cache.get(`${discordUserId}`);
    if (cachedExternalDiscordAccount !== undefined) {
      return cachedExternalDiscordAccount;
    }
    const externalAccountResponse = await axios.put(`${hazelCommunityUrl}/externalaccounts/discord/${discordUserId}`, {
      type: 'DISCORD',
      referenceId: discordUserId,
      referenceName: discordUserTag,
    });
    const externalAccount = externalAccountResponse.data;
    this.cache.set(`${discordUserId}`, externalAccount);
    return externalAccount;
  },
  /**
   * @param {Long} discordUserId The Discord user ID for which we would like to get the respective account
   * @returns The external account data for the user, or null if none found.
   */
  async getExternalDiscordAccount(discordUserId) {
    const cachedExternalDiscordAccount = this.cache.get(`${discordUserId}`);
    if (cachedExternalDiscordAccount !== undefined) {
      return cachedExternalDiscordAccount;
    }
    try {
      const externalAccountResponse = await axios.get(`${hazelCommunityUrl}/externalaccounts/discord/${discordUserId}`);
      const externalAccount = externalAccountResponse.data;
      this.cache.set(`${discordUserId}`, externalAccount);
      return externalAccount;
    } catch (error) {
      return null;
    }
  },
  async getActiveVerificationsForExternalAccount(externalAccountId) {
    const verifications = await axios.get(`${hazelCommunityUrl}/externalaccounts/${externalAccountId}/verifications`);
    return verifications.data;
  },
};
