const axios = require('axios');

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

module.exports = {
  async createOrUpdateExternalDiscordAccount(discordUserId, discordUserTag) {
    const externalAccount = await axios.put(`${hazelCommunityUrl}/externalaccounts/discord/${discordUserId}`, {
      type: 'DISCORD',
      referenceId: discordUserId,
      referenceName: discordUserTag,
    });
    return externalAccount.data;
  },
  /**
   * @param {Long} discordUserId The Discord user ID for which we would like to get the respective account
   * @returns The external account data for the user, or null if none found.
   */
  async getExternalDiscordAccount(discordUserId) {
    try {
      const externalAccount = await axios.get(`${hazelCommunityUrl}/externalaccounts/discord/${discordUserId}`);
      return externalAccount.data;
    } catch (error) {
      return null;
    }
  },
  async getActiveVerificationsForDiscordAccount(externalAccountId) {
    const verifications = await axios.get(`${hazelCommunityUrl}/externalaccounts/${externalAccountId}/verifications`);
    return verifications.data;
  },
};
