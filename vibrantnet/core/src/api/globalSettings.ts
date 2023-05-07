import axios from 'axios';
import { BaseCacheApi } from './baseCache';

export class GlobalSettingsApi extends BaseCacheApi {
  async getGlobalSetting(settingName: string): Promise<string> {
    const cachedSetting = this.cache.get(settingName) as string;
    if (cachedSetting !== undefined) {
      return cachedSetting;
    }
    const allSettings = await axios.get(`${this.apiUrl}/settings`);
    Object.entries(allSettings.data).forEach(([name, value]) => {
      this.cache.set(name, value);
    });
    return this.cache.get(settingName) as string;
  }

  async updateGlobalSetting(name: string, value: string) {
    await axios.put(`${this.apiUrl}/settings/${name}`, { name, value });
    this.clearCacheEntry(name);
  }

  async deleteGlobalSetting(settingName: string) {
    await axios.delete(`${this.apiUrl}/settings/${settingName}`);
    this.clearCacheEntry(settingName);
  }

  clearCacheEntry(settingName: string) {
    this.cache.del(settingName);
  }
}
