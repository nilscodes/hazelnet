import axios from "axios";
import { ExternalAccountPing, ExternalAccountPingPartial } from "../utility/sharedtypes";

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

export default {
  async addPing(senderExternalAccountId: string, senderMessage: string | null, recipientAddress: string, discordServerId: number): Promise<ExternalAccountPing> {
    const newPingPromise = await axios.post(`${hazelCommunityUrl}/pings`, {
      sender: senderExternalAccountId,
      recipientAddress,
      senderMessage,
      sentFromServer: discordServerId,
    });
    return newPingPromise.data;
  },
  async getPingsForExternalAccount(externalAccountId: string): Promise<ExternalAccountPing[]> {
    const pingsPromise = await axios.get(`${hazelCommunityUrl}/externalaccounts/${externalAccountId}/pings`);
    return pingsPromise.data;
  },
  async updateExternalAccountPing(externalAccountId: string, pingId: string, pingPartial: ExternalAccountPingPartial): Promise<ExternalAccountPing> {
    const updatedPingPromise = await axios.patch(`${hazelCommunityUrl}/externalaccounts/${externalAccountId}/pings/${pingId}`, pingPartial);
    return updatedPingPromise.data;
  },
};
