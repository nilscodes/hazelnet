export const bitcoinaddress = {
  isTaprootAddress(address: string) {
    const walletAddressRegex = /^[bB][cC]1[pP][a-zA-Z0-9]{38,58}$/;
    return walletAddressRegex.test(address);
  },
  shorten(address: string) {
    return `${address.substring(0, 5)}-${address.substring(address.length - 5)}`;
  },
};
