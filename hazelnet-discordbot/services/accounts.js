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
    await axios.delete(`${hazelCommunityUrl}/discord/accounts/${accountId}/settings/${settingName}`);
  },
};
