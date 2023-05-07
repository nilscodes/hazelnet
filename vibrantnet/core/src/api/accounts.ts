import axios from 'axios';
import { Handle } from '../types/cardano/handle';
import { BaseApi } from './base';

export class AccountsApi extends BaseApi {
  async updateAccountSetting(accountId: string, settingName: string, settingValue: string) {
    await axios.put(`${this.apiUrl}/accounts/${accountId}/settings/${settingName}`, {
      name: settingName,
      value: `${settingValue}`,
    });
  }

  async deleteAccountSetting(accountId: string, settingName: string) {
    await axios.delete(`${this.apiUrl}/accounts/${accountId}/settings/${settingName}`);
  }

  async getHandlesForAccount(accountId: string): Promise<Handle[]> {
    const handlesPromise = await axios.get(`${this.apiUrl}/accounts/${accountId}/handles`);
    return handlesPromise.data;
  }
}
