export const cardanoaddress = {
  isWalletAddress(address: string) {
    const walletAddressRegex = /^addr1[a-z0-9]{98}$/;
    return walletAddressRegex.test(address);
  },
  containsWalletOrEnterpriseAddress(text: string) {
    const walletOrEnterpriseAddressRegex = /addr1[a-z0-9]{10,98}/;
    return walletOrEnterpriseAddressRegex.test(text);
  },
  isStakeAddress(address: string) {
    const stakeAddressRegex = /^stake1[a-z0-9]{53}$/;
    return stakeAddressRegex.test(address);
  },
  isTransactionHash(transactionHash: string) {
    const transactionHashRegex = /^[a-z0-9]{64}$/;
    return transactionHashRegex.test(transactionHash);
  },
  shorten(address: string) {
    if (address[0] === '$') {
      return address; // Do not shorten handles
    }
    return `${address.substring(0, 15)}…${address.substring(address.length - 5)}`;
  },
};
