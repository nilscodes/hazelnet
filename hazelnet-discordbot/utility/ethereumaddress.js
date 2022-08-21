module.exports = {
  containsWalletAddress(text) {
    const walletAddressRegex = /[0O]x[a-z0-9]{40}/i;
    return walletAddressRegex.test(text);
  },
};
