import {
  CardanoInfoApi, Verification, cardanoaddress, adahandle,
  BlockchainType,
} from '@vibrantnet/core';

export default {
  async getWalletRegisterOptions(service: CardanoInfoApi, existingConfirmedVerifications: Verification[], optionPrefix: string) {
    const stakeAddressesToHandles = await adahandle.getHandleMapFromStakeAddresses(service, existingConfirmedVerifications
      .filter((verification) => verification.blockchain === BlockchainType.CARDANO)
      .map((verification) => verification.cardanoStakeAddress!));
    const registerOptions = existingConfirmedVerifications.map((verification) => {
      const handleForStakeAddress = stakeAddressesToHandles.find((handleForStake) => handleForStake && (handleForStake.handle.resolved && handleForStake.stakeAddress === verification.cardanoStakeAddress));
      const shortAddress = verification.cardanoStakeAddress ? `${cardanoaddress.shorten(verification.address)} (${cardanoaddress.shorten(verification.cardanoStakeAddress)})` : cardanoaddress.shorten(verification.address);
      return {
        label: handleForStakeAddress ? `$${handleForStakeAddress.handle.handle}` : shortAddress,
        value: `${optionPrefix}-${verification.id}`,
      };
    });
    return registerOptions;
  },
};
