const axios = require('axios');

const hazelCardanoConnectUrl = process.env.HAZELNET_CONNECT_URL;

module.exports = {
  async resolveHandle(handle) {
    const handleToResolve = handle.replace('$', '');
    const handleAddress = await axios.get(`${hazelCardanoConnectUrl}/handles/${handleToResolve}`);
    return handleAddress.data.address;
  },
};
