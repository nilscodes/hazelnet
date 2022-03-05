const NodeCache = require('node-cache');
const axios = require('axios');
const globalsettings = require('./globalsettings');

const hazelCommunityUrl = process.env.HAZELNET_COMMUNITY_URL;

module.exports = {
  cache: new NodeCache({ stdTTL: 600 }),
  async registerDiscordServer(guildId, guildName, guildOwner, guildMemberCount) {
    return axios.post(`${hazelCommunityUrl}/discord/servers`, {
      guildId,
      guildName,
      guildOwner,
      guildMemberCount,
    });
  },
  async getDiscordServer(guildId) {
    const cachedDiscordServer = this.cache.get(`${guildId}`);
    if (cachedDiscordServer !== undefined) {
      return cachedDiscordServer;
    }
    const discordServer = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}`);
    const discordServerObject = this.makeDiscordServerObject(discordServer.data);
    this.cache.set(`${guildId}`, discordServerObject);
    return discordServerObject;
  },
  async listExternalAccounts(guildId) {
    const membersPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/members`);
    return membersPromise.data;
  },
  async connectExternalAccount(guildId, externalAccountId) {
    await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/members`, {
      externalAccountId,
    });
    this.clearCacheEntry(guildId);
  },
  async disconnectExternalAccount(guildId, externalAccountId) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/members/${externalAccountId}`);
    this.clearCacheEntry(guildId);
  },
  async updateDiscordServerSetting(guildId, settingName, settingValue) {
    await axios.put(`${hazelCommunityUrl}/discord/servers/${guildId}/settings/${settingName}`, {
      name: settingName,
      value: `${settingValue}`,
    });
    this.clearCacheEntry(guildId);
  },
  async deleteDiscordServerSetting(guildId, settingName) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/settings/${settingName}`);
    this.clearCacheEntry(guildId);
  },
  async deleteStakepool(guildId, poolToRemove) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/stakepools/${poolToRemove}`);
    this.clearCacheEntry(guildId);
  },
  async deleteTokenPolicy(guildId, policyToRemove) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenpolicies/${policyToRemove}`);
    this.clearCacheEntry(guildId);
  },
  async deleteTokenRole(guildId, tokenRoleIdToRemove) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles/${tokenRoleIdToRemove}`);
    this.clearCacheEntry(guildId);
  },
  async deleteDelegatorRole(guildId, delegatorRoleIdToRemove) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/delegatorroles/${delegatorRoleIdToRemove}`);
    this.clearCacheEntry(guildId);
  },
  async deleteWhitelist(guildId, whitelistIdToRemove) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistIdToRemove}`);
    this.clearCacheEntry(guildId);
  },
  async addStakepool(guildId, poolHash) {
    const newPoolPromise = axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/stakepools`, {
      poolHash,
    });
    this.clearCacheEntry(guildId);
    return newPoolPromise;
  },
  async addTokenPolicy(guildId, policyId, projectName) {
    const newPolicyPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenpolicies`, {
      policyId,
      projectName,
    });
    this.clearCacheEntry(guildId);
    return newPolicyPromise;
  },
  async createTokenRole(guildId, policyId, minimumTokenQuantity, discordRoleId, assetFingerprint) {
    const newTokenRolePromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles`, {
      policyId,
      minimumTokenQuantity,
      roleId: discordRoleId,
      assetFingerprint,
    });
    this.clearCacheEntry(guildId);
    return newTokenRolePromise;
  },
  async createDelegatorRole(guildId, poolHash, minimumStakeAda, discordRoleId) {
    const newDelegatorRolePromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/delegatorroles`, {
      poolHash,
      minimumStake: minimumStakeAda * 1000000,
      roleId: discordRoleId,
    });
    this.clearCacheEntry(guildId);
    return newDelegatorRolePromise;
  },
  async createPoll(guildId, pollObject) {
    const newPollPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/polls`, pollObject);
    this.clearCacheEntry(guildId);
    return newPollPromise;
  },
  async createWhitelist(guildId, creator, name, displayName, signupAfter, signupUntil, maxUsers, requiredRoleId) {
    const newWhitelistPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists`, {
      creator,
      displayName,
      name,
      signupAfter,
      signupUntil,
      maxUsers,
      requiredRoleId,
    });
    this.clearCacheEntry(guildId);
    return newWhitelistPromise;
  },
  async updateWhitelist(guildId, whitelistId, whitelistPartial) {
    const newWhitelistPromise = await axios.patch(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}`, whitelistPartial);
    this.clearCacheEntry(guildId);
    return newWhitelistPromise.data;
  },
  async getWhitelistRegistration(guildId, whitelistId, externalAccountId) {
    const registrationPromise = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups/${externalAccountId}`);
    return {
      whitelistId,
      signup: registrationPromise.data,
    };
  },
  async registerForWhitelist(guildId, whitelistId, externalAccountId, address) {
    const newWhitelistSignupPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups`, {
      externalAccountId,
      address,
    });
    this.clearCacheEntry(guildId);
    return newWhitelistSignupPromise;
  },
  async unregisterFromWhitelist(guildId, whitelistId, externalAccountId) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists/${whitelistId}/signups/${externalAccountId}`);
    this.clearCacheEntry(guildId);
  },
  async getCurrentDelegatorRoleAssignments(guildId) {
    const roleAssignments = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/roleassignments/delegatorroles`);
    return roleAssignments.data;
  },
  async getCurrentTokenRoleAssignments(guildId) {
    const roleAssignments = await axios.get(`${hazelCommunityUrl}/discord/servers/${guildId}/roleassignments/tokenroles`);
    return roleAssignments.data;
  },
  async getAllDiscordServers() {
    const cachedDiscordServer = this.cache.get('allservers');
    if (cachedDiscordServer !== undefined) {
      return cachedDiscordServer;
    }
    const discordServer = await axios.get(`${hazelCommunityUrl}/discord/servers`);
    this.cache.set('allservers', discordServer.data);
    return discordServer.data;
  },
  async regenerateAccessToken(guildId) {
    const roleAssignments = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/accesstoken`);
    return roleAssignments.data;
  },
  async deleteAccessToken(guildId) {
    await axios.delete(`${hazelCommunityUrl}/discord/servers/${guildId}/accesstoken`);
  },
  clearCacheEntry(guildId) {
    this.cache.del(`${guildId}`);
  },
  async makeDiscordServerObject(discordServer) {
    const basicThumbnail = await globalsettings.getGlobalSetting('BASIC_EDITION_THUMBNAIL');
    const adText = await globalsettings.getGlobalSetting('ADVERTISEMENT_TEXT');
    const adLogo = await globalsettings.getGlobalSetting('ADVERTISEMENT_LOGO');
    const discordServerObject = discordServer;
    discordServerObject.getBotLanguage = function getBotLanguage() {
      const useLocale = this.settings?.BOT_LANGUAGE?.length ? this.settings.BOT_LANGUAGE : 'en';
      return useLocale;
    };
    discordServerObject.getBasicEditionThumbnail = function getBasicEditionThumbnail() {
      return basicThumbnail ?? 'https://www.hazelnet.io/logo192.png';
    };
    discordServerObject.getAdvertisement = function getAdvertisement() {
      return { text: adText, logo: adLogo };
    };
    return discordServerObject;
  },
};
