export default {
  isHandle(addressOrHandle: string) {
    const handleRegex = /^\$[-._a-zA-Z0-9]{1,15}$/i;
    return handleRegex.test(addressOrHandle);
  },
  containsHandle(text: string) {
    const handleRegex = /\$[-._a-zA-Z0-9]{1,15}/i;
    return handleRegex.test(text);
  },
  async getHandleMapFromStakeAddresses(cardanoinfo: any, stakeAddresses: string[]) {
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