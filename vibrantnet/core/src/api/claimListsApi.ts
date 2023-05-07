import axios from 'axios';
import { ClaimListsWithProducts } from '../types/claim/claimListsWithProducts';
import { PhysicalOrder } from '../types/claim/physicalOrder';
import { BaseApi } from './base';

export class ClaimListsApi extends BaseApi {
  async getAvailableClaimLists(guildId: string, externalAccountId: string): Promise<ClaimListsWithProducts> {
    const claimListPromise = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/members/${externalAccountId}/claimlists`);
    return claimListPromise.data;
  }

  async getExistingOrderForClaimList(guildId: string, externalAccountId: string, claimListId: number): Promise<PhysicalOrder | null> {
    try {
      const claimListPromise = await axios.get(`${this.apiUrl}/discord/servers/${guildId}/members/${externalAccountId}/claimlists/${claimListId}/orders`);
      return claimListPromise.data;
    } catch (error) {
      return null;
    }
  }

  async submitPhysicalOrder(guildId: string, externalAccountId: string, claimListId: number, order: PhysicalOrder): Promise<PhysicalOrder> {
    const claimListPromise = await axios.post(`${this.apiUrl}/discord/servers/${guildId}/members/${externalAccountId}/claimlists/${claimListId}/orders`, order);
    return claimListPromise.data;
  }
}
