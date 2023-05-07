import axios from 'axios';
import { Handle } from '../types/cardano/handle';
import { EpochDetails } from '../types/cardano/epochDetails';
import { PolicyInfo } from '../types/cardano/policyInfo';
import { BaseApi } from './base';

export class CardanoInfoApi extends BaseApi {
  async resolveHandle(handle: string): Promise<Handle> {
    const handleToResolve = handle.replace('$', '');
    const handleAddress = await axios.get(`${this.apiUrl}/handles/${handleToResolve}`);
    return handleAddress.data;
  }

  async bestHandleForStakeAddress(stakeAddress: string) {
    const bestHandlePromise = await axios.get(`${this.apiUrl}/token/stake/${stakeAddress}/besthandle`);
    return bestHandlePromise.data;
  }

  async handlesForStakeAddress(stakeAddress: string) {
    const handlesPromise = await axios.get(`${this.apiUrl}/token/stake/${stakeAddress}/handles`);
    return handlesPromise.data;
  }

  async handlesForWalletAddress(walletAddress: string) {
    const handlesPromise = await axios.get(`${this.apiUrl}/wallets/${walletAddress}/handles`);
    return handlesPromise.data;
  }

  async multiAssetInfo(policyId: string, assetNameHex: string) {
    const assetPromise = await axios.get(`${this.apiUrl}/token/assets/${policyId}/${assetNameHex}`);
    return assetPromise.data;
  }

  async walletInfo(address: string) {
    try {
      const walletInfo = await axios.get(`${this.apiUrl}/wallets/${address}`);
      return walletInfo.data;
    } catch (error) {
      return null;
    }
  }

  async epochDetails(): Promise<EpochDetails> {
    const epochDetailsPromise = await axios.get(`${this.apiUrl}/info/epochdetails`);
    return epochDetailsPromise.data;
  }

  async policyInfo(policyId: string): Promise<PolicyInfo> {
    const policyInfoPromise = await axios.get(`${this.apiUrl}/token/policies/${policyId}`);
    return policyInfoPromise.data;
  }
}
