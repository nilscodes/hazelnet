const axios = require('axios');

const hazelCardanoConnectUrl = process.env.HAZELNET_CONNECT_URL;

module.exports = {
  async resolveHandle(handle) {
    const handleToResolve = handle.replace('$', '');
    const handleAddress = await axios.get(`${hazelCardanoConnectUrl}/handles/${handleToResolve}`);
    return handleAddress.data.address;
  },
  async walletInfo(address) {
    try {
      const walletInfo = await axios.get(`${hazelCardanoConnectUrl}/wallets/${address}`);
      return walletInfo.data;
    } catch (error) {
      return null;
    }
  },
};
