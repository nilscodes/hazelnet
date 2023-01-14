import axios from "axios";
import NodeCache from "node-cache";

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

export default {
  cache: new NodeCache({ stdTTL: 600 }),
  async getGlobalSetting(settingName: string): Promise<string> {
    const cachedSetting = this.cache.get(settingName) as string;
    if (cachedSetting !== undefined) {
      return cachedSetting;
    }
    const allSettings = await axios.get(`${hazelCommunityUrl}/settings`);
    Object.entries(allSettings.data).forEach(([name, value]) => {
      this.cache.set(name, value);
    });
    return this.cache.get(settingName) as string;
  },
  async updateGlobalSetting(name: string, value: string) {
    await axios.put(`${hazelCommunityUrl}/settings/${name}`, { name, value });
    this.clearCacheEntry(name);
  },
  async deleteGlobalSetting(settingName: string) {
    await axios.delete(`${hazelCommunityUrl}/settings/${settingName}`);
    this.clearCacheEntry(settingName);
  },
  clearCacheEntry(settingName: string) {
    this.cache.del(settingName);
  },
};
