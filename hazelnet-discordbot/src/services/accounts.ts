import axios from "axios";
import { Handle } from "../utility/sharedtypes";

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

export default {
  async updateAccountSetting(accountId: string, settingName: string, settingValue: string) {
    await axios.put(`${hazelCommunityUrl}/accounts/${accountId}/settings/${settingName}`, {
      name: settingName,
      value: `${settingValue}`,
    });
  },
  async deleteAccountSetting(accountId: string, settingName: string) {
    await axios.delete(`${hazelCommunityUrl}/accounts/${accountId}/settings/${settingName}`);
  },
  async getHandlesForAccount(accountId: string): Promise<Handle[]> {
    const handlesPromise = await axios.get(`${hazelCommunityUrl}/accounts/${accountId}/handles`);
    return handlesPromise.data;
  },
};
