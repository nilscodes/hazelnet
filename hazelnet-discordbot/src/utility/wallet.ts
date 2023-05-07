import {
  CardanoInfoApi, Verification, cardanoaddress, adahandle,
} from '@vibrantnet/core';

export default {
  async getWalletRegisterOptions(service: CardanoInfoApi, existingConfirmedVerifications: Verification[], optionPrefix: string) {
    const stakeAddressesToHandles = await adahandle.getHandleMapFromStakeAddresses(service, existingConfirmedVerifications.map((verification) => verification.cardanoStakeAddress!));
    const registerOptions = existingConfirmedVerifications.map((verification) => {
      const handleForStakeAddress = stakeAddressesToHandles.find((handleForStake) => handleForStake && (handleForStake.handle.resolved && handleForStake.stakeAddress === verification.cardanoStakeAddress));
      return {
        label: handleForStakeAddress ? `$${handleForStakeAddress.handle.handle}` : `${cardanoaddress.shorten(verification.address)} (${cardanoaddress.shorten(verification.cardanoStakeAddress!)})`,
        value: `${optionPrefix}-${verification.id}`,
      };
    });
    return registerOptions;
  },
};
