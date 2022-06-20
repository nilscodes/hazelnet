module.exports = {
  isWalletAddress(address) {
    const walletAddressRegex = /^addr1[a-zA-Z0-9]{98}$/i;
    return walletAddressRegex.test(address);
  },
  isStakeAddress(address) {
    const stakeAddressRegex = /^stake1[a-zA-Z0-9]{53}$/;
    return stakeAddressRegex.test(address);
  },
  isTransactionHash(transactionHash) {
    const transactionHashRegex = /^[a-z0-9]{64}$/i;
    return transactionHashRegex.test(transactionHash);
  },
  shorten(address) {
    return `${address.substr(0, 15)}…${address.substr(-5)}`;
  },
};
