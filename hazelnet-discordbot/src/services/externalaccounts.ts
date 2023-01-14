import axios from "axios";
import NodeCache from "node-cache";
import { Account, ExternalAccount, ExternalAccountPremiumInfo, SummarizedWhitelistSignup, Verification, VerificationImport } from "../utility/sharedtypes";

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

export default {
  cache: new NodeCache({ stdTTL: 600 }),
  async createOrUpdateExternalDiscordAccount(discordUserId: string, discordUserTag: string): Promise<ExternalAccount> {
    const cachedExternalDiscordAccount = this.cache.get(`${discordUserId}`) as ExternalAccount;
    if (cachedExternalDiscordAccount !== undefined) {
      return cachedExternalDiscordAccount;
    }
    const externalAccountResponse = await axios.put(`${hazelCommunityUrl}/externalaccounts/discord/${discordUserId}`, {
      type: 'DISCORD',
      referenceId: discordUserId,
      referenceName: discordUserTag,
    });
    const externalAccount = externalAccountResponse.data;
    this.cache.set(`${discordUserId}`, externalAccount);
    return externalAccount;
  },
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
      const externalAccountResponse = await axios.get(`${hazelCommunityUrl}/externalaccounts/discord/${discordUserId}`);
      const externalAccount = externalAccountResponse.data;
      this.cache.set(`${discordUserId}`, externalAccount);
      return externalAccount;
    } catch (error) {
      return null;
    }
  },
  async getAccountForExternalAccount(externalAccountId: string): Promise<Account> {
    const mainAccountResponse = await axios.put(`${hazelCommunityUrl}/externalaccounts/${externalAccountId}/account`);
    return mainAccountResponse.data;
  },
  clearExternalDiscordAccountCache(discordUserId: string) {
    this.cache.del(`${discordUserId}`);
  },
  async getActiveVerificationsForExternalAccount(externalAccountId: string): Promise<Verification[]> {
    const verifications = await axios.get(`${hazelCommunityUrl}/externalaccounts/${externalAccountId}/verifications`);
    return verifications.data;
  },
  async getExternalAccountWhitelists(externalAccountId: string): Promise<SummarizedWhitelistSignup[]> {
    const whitelistsPromise = await axios.get(`${hazelCommunityUrl}/externalaccounts/${externalAccountId}/whitelists`);
    return whitelistsPromise.data;
  },
  async getPremiumInfoForExternalAccount(externalAccountId: string): Promise<ExternalAccountPremiumInfo> {
    const premiumInfo = await axios.get(`${hazelCommunityUrl}/externalaccounts/${externalAccountId}/premium`);
    return premiumInfo.data;
  },
  async importVerifications(externalAccountId: string): Promise<VerificationImport[]> {
    const importedVerifications = await axios.post(`${hazelCommunityUrl}/externalaccounts/${externalAccountId}/import`);
    return importedVerifications.data;
  },
};
