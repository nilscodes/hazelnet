module.exports = {
  isStakedAddress(address) {
    const stakedAddressRegex = /^addr1[a-z0-9]{98}$/i;
    return stakedAddressRegex.test(address);
  },
  isTransactionHash(transactionHash) {
    const transactionHashRegex = /^[a-z0-9]{64}$/i;
    return transactionHashRegex.test(transactionHash);
  },
  shorten(address) {
    return `${address.substr(0, 15)}…${address.substr(-5)}`;
  },
};
