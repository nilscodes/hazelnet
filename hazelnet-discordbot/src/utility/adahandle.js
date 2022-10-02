module.exports = {
  isHandle(addressOrHandle) {
    const handleRegex = /^\$[-._a-zA-Z0-9]{1,15}$/i;
    return handleRegex.test(addressOrHandle);
  },
  containsHandle(text) {
    const handleRegex = /\$[-._a-zA-Z0-9]{1,15}/i;
    return handleRegex.test(text);
  },
  async getHandleMapFromStakeAddresses(cardanoinfo, stakeAddresses) {
    const resolvedHandles = stakeAddresses.map(async (stakeAddress) => {
      const handle = await cardanoinfo.bestHandleForStakeAddress(stakeAddress);
      return {
        stakeAddress,
        handle,
      };
    });
    return Promise.all(resolvedHandles.map((p) => p.catch(() => undefined)));
  },
};
