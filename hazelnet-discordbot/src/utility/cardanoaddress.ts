import { EpochDetails } from "./sharedtypes";

export default {
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
  buildEpochClockText(epochDetails: EpochDetails) {
    const daysLeft = Math.floor(epochDetails.estimatedSecondsLeft / 86400);
    const hoursLeft = Math.floor((epochDetails.estimatedSecondsLeft - daysLeft * 86400) / 3600);
    const minutesLeft = Math.floor((epochDetails.estimatedSecondsLeft - (daysLeft * 86400 + hoursLeft * 3600)) / 60);
    const epochClock = `⏳ E${epochDetails.epochNo}: ${daysLeft}d ${hoursLeft}h ${minutesLeft}m left`;
    return epochClock;
  },
};
