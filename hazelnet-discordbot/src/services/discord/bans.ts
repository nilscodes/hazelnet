import axios from "axios";
import { Ban } from "../../utility/bans";

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

export default {
  async addBan(guildId: string, banObject: Ban) {
    const newBanPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/bans`, banObject);
    return newBanPromise.data;
  },
  async listBans(guildId: string): Promise<Ban[]> {
    const bans = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/bans`);
    return bans.data;
  },
  async getBan(guildId: string, banId: number): Promise<Ban | null> {
    try {
      const ban = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/bans/${banId}`);
      return ban.data;
    } catch (error) {
      return null;
    }
  },
  async deleteBan(guildId: string, banId: number) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/bans/${banId}`);
  },
}