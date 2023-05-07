import axios from 'axios';
import { BaseApi } from './base';
import { ExternalAccountPing } from '../types/ping/externalAccountPing';
import { ExternalAccountPingPartial } from '../types/ping/externalAccountPingPartial';

export class PingsApi extends BaseApi {
  async addPing(senderExternalAccountId: string, senderMessage: string | null, recipientAddress: string, discordServerId: number): Promise<ExternalAccountPing> {
    const newPingPromise = await axios.post(`${this.apiUrl}/pings`, {
      sender: senderExternalAccountId,
      recipientAddress,
      senderMessage,
      sentFromServer: discordServerId,
    });
    return newPingPromise.data;
  }

  async getPingsForExternalAccount(externalAccountId: string): Promise<ExternalAccountPing[]> {
    const pingsPromise = await axios.get(`${this.apiUrl}/externalaccounts/${externalAccountId}/pings`);
    return pingsPromise.data;
  }

  async updateExternalAccountPing(externalAccountId: string, pingId: string, pingPartial: ExternalAccountPingPartial): Promise<ExternalAccountPing> {
    const updatedPingPromise = await axios.patch(`${this.apiUrl}/externalaccounts/${externalAccountId}/pings/${pingId}`, pingPartial);
    return updatedPingPromise.data;
  }
}
