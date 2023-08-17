import axios from 'axios';
import { ExternalAccount } from '../types/externalaccount/externalAccount';
import { Verification } from '../types/verification/verification';
import { Account } from '../types/account/account';
import { SummarizedWhitelistSignup } from '../types/whitelist/summarizedWhitelistSignup';
import { ExternalAccountPremiumInfo } from '../types/premium/externalAccountPremiumInfo';
import { VerificationImport } from '../types/verification/verificationImport';
import { BaseCacheApi } from './baseCache';
import { ExposedWallet } from '../types/verification/exposedWallet';

export class ExternalAccountsApi extends BaseCacheApi {
  async createOrUpdateExternalDiscordAccount(discordUserId: string, discordUserTag: string): Promise<ExternalAccount> {
    const cachedExternalDiscordAccount = this.cache.get(`${discordUserId}`) as ExternalAccount;
    if (cachedExternalDiscordAccount !== undefined) {
      return cachedExternalDiscordAccount;
    }
    const externalAccountResponse = await axios.put(`${this.apiUrl}/externalaccounts/discord/${discordUserId}`, {
      type: 'DISCORD',
      referenceId: discordUserId,
      referenceName: discordUserTag,
    });
    const externalAccount = externalAccountResponse.data;
    this.cache.set(`${discordUserId}`, externalAccount);
    return externalAccount;
  }

  /**
   * @param {Long} discordUserId The Discord user ID for which we would like to get the respective account
   * @returns The external account data for the user, or null if none found.
   */
  async getExternalDiscordAccount(discordUserId: string): Promise<ExternalAccount | null> {
    const cachedExternalDiscordAccount = this.cache.get(`${discordUserId}`) as ExternalAccount;
    if (cachedExternalDiscordAccount !== undefined) {
      return cachedExternalDiscordAccount;
    }
    try {
      const externalAccountResponse = await axios.get(`${this.apiUrl}/externalaccounts/discord/${discordUserId}`);
      const externalAccount = externalAccountResponse.data;
      this.cache.set(`${discordUserId}`, externalAccount);
      return externalAccount;
    } catch (error) {
      return null;
    }
  }

  async getExternalDiscordAccountFromExternalAccountId(externalAccountId: string): Promise<ExternalAccount | null> {
    try {
      const externalAccountResponse = await axios.get(`${this.apiUrl}/externalaccounts/${externalAccountId}`);
      return externalAccountResponse.data;
    } catch (error) {
      return null;
    }
  }

  async getAccountForExternalAccount(externalAccountId: string): Promise<Account> {
    const mainAccountResponse = await axios.put(`${this.apiUrl}/externalaccounts/${externalAccountId}/account`);
    return mainAccountResponse.data;
  }

  clearExternalDiscordAccountCache(discordUserId: string) {
    this.cache.del(`${discordUserId}`);
  }

  async getActiveVerificationsForExternalAccount(externalAccountId: string): Promise<Verification[]> {
    const verifications = await axios.get(`${this.apiUrl}/externalaccounts/${externalAccountId}/verifications`);
    return verifications.data;
  }

  async addExternalAccountVerification(externalAccountId: string, verification: Verification): Promise<Verification> {
    const verifications = await axios.post(`${this.apiUrl}/externalaccounts/${externalAccountId}/verifications`, verification);
    return verifications.data;
  }

  async getExternalAccountWhitelists(externalAccountId: string): Promise<SummarizedWhitelistSignup[]> {
    const whitelistsPromise = await axios.get(`${this.apiUrl}/externalaccounts/${externalAccountId}/whitelists`);
    return whitelistsPromise.data;
  }

  async getPremiumInfoForExternalAccount(externalAccountId: string): Promise<ExternalAccountPremiumInfo> {
    const premiumInfo = await axios.get(`${this.apiUrl}/externalaccounts/${externalAccountId}/premium`);
    return premiumInfo.data;
  }

  async importVerifications(externalAccountId: string): Promise<VerificationImport[]> {
    const importedVerifications = await axios.post(`${this.apiUrl}/externalaccounts/${externalAccountId}/import`);
    return importedVerifications.data;
  }

  async getExternalAccountExposedWallets(externalAccountId: string, guildId?: string): Promise<ExposedWallet[]> {
    const exposedWallets = await axios.get(`${this.apiUrl}/externalaccounts/${externalAccountId}/exposedwallets`, {
      params: {
        guildId,
      },
    });
    return exposedWallets.data;
  }

  async deleteExternalAccountExposedWallets(externalAccountId: string, guildId?: string): Promise<ExposedWallet[]> {
    const exposedWallets = await axios.delete(`${this.apiUrl}/externalaccounts/${externalAccountId}/exposedwallets`, {
      params: {
        guildId,
      },
    });
    return exposedWallets.data;
  }
}
