import axios from 'axios';
import { BaseApi } from './base';
import { Ban } from '../types/ban/ban';

export class DiscordBanApi extends BaseApi {
  async addBan(guildId: string, banObject: Ban) {
    const newBanPromise = await axios.post(`${this.apiUrl}/discord/servers/${guildId}/bans`, banObject);
    return newBanPromise.data;
  }

  async listBans(guildId: string): Promise<Ban[]> {
    const bans = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/bans`);
    return bans.data;
  }

  async getBan(guildId: string, banId: number): Promise<Ban | null> {
    try {
      const ban = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/bans/${banId}`);
      return ban.data;
    } catch (error) {
      return null;
    }
  }

  async deleteBan(guildId: string, banId: number) {
    await axios.delete(`${this.apiUrl}/discord/servers/${guildId}/bans/${banId}`);
  }
}
