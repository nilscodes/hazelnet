const axios = require('axios');

const hazelCardanoConnectUrl = process.env.HAZELNET_CONNECT_URL;

module.exports = {
  async resolveHandle(handle) {
    const handleToResolve = handle.replace('$', '');
    const handleAddress = await axios.get(`${hazelCardanoConnectUrl}/handles/${handleToResolve}`);
    return handleAddress.data;
  },
  async bestHandleForStakeAddress(stakeAddress) {
    const bestHandlePromise = await axios.get(`${hazelCardanoConnectUrl}/token/stake/${stakeAddress}/besthandle`);
    return bestHandlePromise.data;
  },
  async handlesForStakeAddress(stakeAddress) {
    const handlesPromise = await axios.get(`${hazelCardanoConnectUrl}/token/stake/${stakeAddress}/handles`);
    return handlesPromise.data;
  },
  async handlesForWalletAddress(walletAddress) {
    const handlesPromise = await axios.get(`${hazelCardanoConnectUrl}/wallets/${walletAddress}/handles`);
    return handlesPromise.data;
  },
  async multiAssetInfo(policyId, assetNameHex) {
    const assetPromise = await axios.get(`${hazelCardanoConnectUrl}/token/assets/${policyId}/${assetNameHex}`);
    return assetPromise.data;
  },
  async walletInfo(address) {
    try {
      const walletInfo = await axios.get(`${hazelCardanoConnectUrl}/wallets/${address}`);
      return walletInfo.data;
    } catch (error) {
      return null;
    }
  },
  async epochDetails() {
    const epochDetailsPromise = await axios.get(`${hazelCardanoConnectUrl}/info/epochdetails`);
    return epochDetailsPromise.data;
  },
};
