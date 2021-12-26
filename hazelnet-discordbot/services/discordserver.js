const NodeCache = require('node-cache');
const axios = require('axios');

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
  async connectExternalAccount(guildId, externalAccountId) {
    await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/members`, {
      externalAccountId,
    });
    this.clearCacheEntry(guildId);
  },
  async updateDiscordServerSetting(guildId, settingName, settingValue) {
    await axios.put(`${hazelCommunityUrl}/discord/servers/${guildId}/settings/${settingName}`, {
      name: settingName,
      value: `${settingValue}`,
    });
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
  async createTokenRole(guildId, policyId, minimumTokenQuantity, discordRoleId) {
    const newTokenRolePromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/tokenroles`, {
      policyId,
      minimumTokenQuantity,
      roleId: discordRoleId,
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
  async createWhitelist(guildId, name, displayName, signupAfter, signupUntil, maxUsers, requiredRoleId) {
    const newWhitelistPromise = await axios.post(`${hazelCommunityUrl}/discord/servers/${guildId}/whitelists`, {
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
    const discordServer = await axios.get(`${hazelCommunityUrl}/discord/servers`);
    return discordServer.data;
  },
  clearCacheEntry(guildId) {
    this.cache.del(`${guildId}`);
  },
  makeDiscordServerObject(discordServer) {
    const discordServerObject = discordServer;
    discordServerObject.getBotLanguage = function getBotLanguage() {
      const useLocale = this.settings?.BOT_LANGUAGE?.length ? this.settings.BOT_LANGUAGE : 'en';
      return useLocale;
    };
    return discordServerObject;
  },
};
