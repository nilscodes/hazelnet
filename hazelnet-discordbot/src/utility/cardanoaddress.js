module.exports = {
  isWalletAddress(address) {
    const walletAddressRegex = /^addr1[a-z0-9]{98}$/;
    return walletAddressRegex.test(address);
  },
  containsWalletOrEnterpriseAddress(text) {
    const walletOrEnterpriseAddressRegex = /addr1[a-z0-9]{10,98}/;
    return walletOrEnterpriseAddressRegex.test(text);
  },
  isStakeAddress(address) {
    const stakeAddressRegex = /^stake1[a-z0-9]{53}$/;
    return stakeAddressRegex.test(address);
  },
  isTransactionHash(transactionHash) {
    const transactionHashRegex = /^[a-z0-9]{64}$/;
    return transactionHashRegex.test(transactionHash);
  },
  shorten(address) {
    if (address[0] === '$') {
      return address; // Do not shorten handles
    }
    return `${address.substr(0, 15)}…${address.substr(-5)}`;
  },
};
