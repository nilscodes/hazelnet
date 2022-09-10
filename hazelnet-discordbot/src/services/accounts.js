const axios = require('axios');

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

module.exports = {
  async updateAccountSetting(accountId, settingName, settingValue) {
    await axios.put(`${hazelCommunityUrl}/accounts/${accountId}/settings/${settingName}`, {
      name: settingName,
      value: `${settingValue}`,
    });
  },
  async deleteAccountSetting(accountId, settingName) {
    await axios.delete(`${hazelCommunityUrl}/accounts/${accountId}/settings/${settingName}`);
  },
  async getHandlesForAccount(accountId) {
    const handlesPromise = await axios.get(`${hazelCommunityUrl}/accounts/${accountId}/handles`);
    return handlesPromise.data;
  },
};
