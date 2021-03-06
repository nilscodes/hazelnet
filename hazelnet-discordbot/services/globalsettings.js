const NodeCache = require('node-cache');
const axios = require('axios');

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

module.exports = {
  cache: new NodeCache({ stdTTL: 600 }),
  async getGlobalSetting(settingName) {
    const cachedSetting = this.cache.get(settingName);
    if (cachedSetting !== undefined) {
      return cachedSetting;
    }
    const allSettings = await axios.get(`${hazelCommunityUrl}/settings`);
    Object.entries(allSettings.data).forEach(([name, value]) => {
      this.cache.set(name, value);
    });
    return this.cache.get(settingName);
  },
  async updateGlobalSetting(name, value) {
    await axios.put(`${hazelCommunityUrl}/settings/${name}`, { name, value });
    this.clearCacheEntry(name);
  },
  async deleteGlobalSetting(settingName) {
    await axios.delete(`${hazelCommunityUrl}/settings/${settingName}`);
    this.clearCacheEntry(settingName);
  },
  clearCacheEntry(settingName) {
    this.cache.del(settingName);
  },
};
