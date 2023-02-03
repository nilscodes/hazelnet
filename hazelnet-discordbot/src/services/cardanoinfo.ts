import axios from "axios";
import { EpochDetails, Handle, PolicyInfo } from "../utility/sharedtypes";

const hazelCardanoConnectUrl = process.env.HAZELNET_CONNECT_URL;

export default {
  async resolveHandle(handle: string): Promise<Handle> {
    const handleToResolve = handle.replace('$', '');
    const handleAddress = await axios.get(`${hazelCardanoConnectUrl}/handles/${handleToResolve}`);
    return handleAddress.data;
  },
  async bestHandleForStakeAddress(stakeAddress: string) {
    const bestHandlePromise = await axios.get(`${hazelCardanoConnectUrl}/token/stake/${stakeAddress}/besthandle`);
    return bestHandlePromise.data;
  },
  async handlesForStakeAddress(stakeAddress: string) {
    const handlesPromise = await axios.get(`${hazelCardanoConnectUrl}/token/stake/${stakeAddress}/handles`);
    return handlesPromise.data;
  },
  async handlesForWalletAddress(walletAddress: string) {
    const handlesPromise = await axios.get(`${hazelCardanoConnectUrl}/wallets/${walletAddress}/handles`);
    return handlesPromise.data;
  },
  async multiAssetInfo(policyId: string, assetNameHex: string) {
    const assetPromise = await axios.get(`${hazelCardanoConnectUrl}/token/assets/${policyId}/${assetNameHex}`);
    return assetPromise.data;
  },
  async walletInfo(address: string) {
    try {
      const walletInfo = await axios.get(`${hazelCardanoConnectUrl}/wallets/${address}`);
      return walletInfo.data;
    } catch (error) {
      return null;
    }
  },
  async epochDetails(): Promise<EpochDetails> {
    const epochDetailsPromise = await axios.get(`${hazelCardanoConnectUrl}/info/epochdetails`);
    return epochDetailsPromise.data;
  },
  async policyInfo(policyId: string): Promise<PolicyInfo> {
    const policyInfoPromise = await axios.get(`${hazelCardanoConnectUrl}/token/policies/${policyId}`);
    return policyInfoPromise.data;
  },
};
