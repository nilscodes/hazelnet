export default {
  containsWalletAddress(text: string) {
    const walletAddressRegex = /[0O]x[a-z0-9]{40}/i;
    return walletAddressRegex.test(text);
  },
  isWalletAddress(text: string) {
    const walletAddressRegex = /^[0O]x[a-z0-9]{40}$/i;
    return walletAddressRegex.test(text);
  },
};
