import axios from "axios";
import { ClaimListsWithProducts, PhysicalOrder } from "../utility/sharedtypes";

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

export default {
  async getAvailableClaimLists(guildId: string, externalAccountId: string): Promise<ClaimListsWithProducts> {
    const claimListPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/claimlists`);
    return claimListPromise.data;
  },
  async getExistingOrderForClaimList(guildId: string, externalAccountId: string, claimListId: number): Promise<PhysicalOrder | null> {
    try {
      const claimListPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/claimlists/${claimListId}/orders`);
      return claimListPromise.data;
    } catch (error) {
      return null;
    }
  },
  async submitPhysicalOrder(guildId: string, externalAccountId: string, claimListId: number, order: PhysicalOrder): Promise<PhysicalOrder> {
    const claimListPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}/claimlists/${claimListId}/orders`, order);
    return claimListPromise.data;
  },
};
