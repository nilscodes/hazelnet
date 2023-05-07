import { EpochDetails } from '@vibrantnet/core';

export default {
  buildEpochClockText(epochDetails: EpochDetails) {
    const daysLeft = Math.floor(epochDetails.estimatedSecondsLeft / 86400);
    const hoursLeft = Math.floor((epochDetails.estimatedSecondsLeft - daysLeft * 86400) / 3600);
    const minutesLeft = Math.floor((epochDetails.estimatedSecondsLeft - (daysLeft * 86400 + hoursLeft * 3600)) / 60);
    const epochClock = `⏳ E${epochDetails.epochNo}: ${daysLeft}d ${hoursLeft}h ${minutesLeft}m left`;
    return epochClock;
  },
};
