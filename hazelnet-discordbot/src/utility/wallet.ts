import cardanoinfo from '../services/cardanoinfo';
import adahandle from './adahandle';
import cardanoaddress from './cardanoaddress';
import { Verification } from './sharedtypes';

export default {
  async getWalletRegisterOptions(service: typeof cardanoinfo, existingConfirmedVerifications: Verification[], optionPrefix: string) {
    const stakeAddressesToHandles = await adahandle.getHandleMapFromStakeAddresses(service, existingConfirmedVerifications.map((verification) => verification.cardanoStakeAddress!));
    const registerOptions = existingConfirmedVerifications.map((verification) => {
      const handleForStakeAddress = stakeAddressesToHandles.find((handleForStake) => handleForStake && (handleForStake.handle.resolved && handleForStake.stakeAddress === verification.cardanoStakeAddress));
      return {
        label: handleForStakeAddress ? `$${handleForStakeAddress.handle.handle}` : `${cardanoaddress.shorten(verification.address)} (${cardanoaddress.shorten(verification.cardanoStakeAddress!)})`,
        value: `${optionPrefix}-${verification.id}`,
      };
    });
    return registerOptions;
  }
}